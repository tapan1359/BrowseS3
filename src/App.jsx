import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import FilePreview from './components/FilePreview';
import FileEditor from './components/FileEditor';
import CodeEditor from './components/CodeEditor';

function App() {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSSOProfile, setIsSSOProfile] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const itemsPerPage = 100;
  const [currentPath, setCurrentPath] = useState('');
  const [folderStructure, setFolderStructure] = useState({});
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(true);
  const [isFileListOpen, setIsFileListOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Add file input ref
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Listen for AWS profiles from main process
    window.electron.on('aws-profiles', (profiles) => {
      console.log('Received profiles:', profiles);
      setProfiles(profiles);
      if (profiles.length > 0) {
        setSelectedProfile(profiles[0]);
      }
    });
  }, []);

  // Initialize AWS on profile selection
  const initializeAWS = async (profile) => {
    try {
      const success = await window.electron.invoke('get-aws-credentials', profile);
      if (success) {
        setIsInitialized(true);
        setError(null);
        setIsSignedIn(false);

        // Check if this is an SSO profile
        const isSSO = profile.includes('sso') || profile.includes('SSO');
        setIsSSOProfile(isSSO);

        if (!isSSO) {
          // For regular profiles, just initialize AWS
          listBuckets();
        } else {
          setLoading(false);
        }
      } else {
        setError('Failed to initialize AWS credentials');
        setIsInitialized(false);
      }
    } catch (error) {
      console.error('Error initializing AWS:', error);
      setError('Failed to initialize AWS credentials');
      setIsInitialized(false);
    }
  };

  // Effect to initialize AWS with selected profile
  useEffect(() => {
    if (selectedProfile) {
      initializeAWS(selectedProfile);
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (files.length > 0) {
      const filtered = getCurrentFolderContents().files.filter((file) =>
        file.Key.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredFiles(filtered);
      setCurrentPage(1);
    }
  }, [files, searchQuery, currentPath]);

  const handleSSOSignIn = async () => {
    if (!selectedProfile) return;

    setLoading(true);
    setError(null);

    try {
      const success = await window.electron.invoke('aws-sso-signin', selectedProfile);
      if (success) {
        setIsSignedIn(true);
        // Initialize AWS after successful sign-in
        const awsSuccess = await window.electron.invoke('get-aws-credentials', selectedProfile);
        if (awsSuccess) {
          listBuckets();
        } else {
          setError('Failed to initialize AWS after SSO sign-in');
        }
      } else {
        setError('Failed to sign in with AWS SSO');
      }
    } catch (err) {
      console.error('Error during SSO sign-in:', err);
      setError('Failed to sign in with AWS SSO');
    } finally {
      setLoading(false);
    }
  };

  // Modified listBuckets function
  const listBuckets = async () => {
    if (!isInitialized) {
      setError('Please select an AWS profile first');
      return;
    }
    try {
      setLoading(true);
      const buckets = await window.electron.invoke('list-buckets');
      setBuckets(buckets || []);
      setError(null);
    } catch (error) {
      console.error('Error listing buckets:', error);
      setError('Failed to list buckets. Please check your AWS credentials.');
      setBuckets([]);
    } finally {
      setLoading(false);
    }
  };

  // Modified buildFolderStructure function
  const buildFolderStructure = (files) => {
    if (!files || !Array.isArray(files)) {
      return {};
    }
    const structure = {};
    files.forEach((file) => {
      if (!file || !file.Key) return; // Skip invalid files
      const parts = file.Key.split('/');
      let current = structure;
      parts.forEach((part, index) => {
        if (!part) return; // Skip empty parts
        if (index === parts.length - 1) {
          // It's a file
          if (!current._files) current._files = [];
          current._files.push(file);
        } else {
          // It's a directory
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    return structure;
  };

  // Modified selectBucket function
  const selectBucket = async (bucketName) => {
    setSelectedBucket(bucketName);
    setSelectedFile(null);
    setCurrentPath('');
    try {
      setLoading(true);
      const files = await window.electron.invoke('list-files', bucketName);
      setFiles(files || []);
      setFolderStructure(buildFolderStructure(files));
      setError(null);
    } catch (error) {
      console.error('Error listing files:', error);
      setError('Failed to list files in bucket');
      setFiles([]);
      setFolderStructure({});
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate to a folder
  const navigateToFolder = (path) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent(null);
    setIsEditing(false);
  };

  // Modified getCurrentFolderContents function
  const getCurrentFolderContents = () => {
    if (!folderStructure) return { folders: [], files: [] };

    if (!currentPath) {
      return {
        folders: Object.keys(folderStructure).filter((k) => k !== '_files'),
        files: folderStructure._files || [],
      };
    }

    const parts = currentPath.split('/').filter(Boolean);
    let current = folderStructure;
    for (const part of parts) {
      current = current[part];
      if (!current) return { folders: [], files: [] };
    }

    return {
      folders: Object.keys(current).filter((k) => k !== '_files'),
      files: current._files || [],
    };
  };

  // Handle refresh based on current path
  const handleRefresh = async () => {
    if (selectedBucket) {
      try {
        setLoading(true);
        const files = await window.electron.invoke('list-files', selectedBucket);
        setFiles(files);
        setFolderStructure(buildFolderStructure(files));
        setError(null);
      } catch (error) {
        console.error('Error refreshing files:', error);
        setError('Failed to refresh files');
      } finally {
        setLoading(false);
      }
    } else {
      listBuckets();
    }
  };

  // Modified handleUpload function
  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || !selectedBucket) return;

    setLoading(true);
    let hasError = false;

    try {
      for (const file of files) {
        const uploadPath = currentPath ? `${currentPath}/${file.name}` : file.name;

        try {
          await window.electron.invoke('upload-file', {
            bucket: selectedBucket,
            key: uploadPath,
            filePath: file.path,
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          hasError = true;
        }
      }

      // Refresh the current folder after upload
      await handleRefresh();
    } catch (error) {
      console.error('Error during upload:', error);
      setError('Failed to upload one or more files');
    } finally {
      setLoading(false);
      if (hasError) {
        setError('Some files failed to upload');
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to handle bulk download
  const handleDownloadFolder = async () => {
    if (!selectedBucket || !currentPath) return;

    try {
      await window.electron.invoke('download-folder', {
        bucket: selectedBucket,
        prefix: currentPath,
      });
    } catch (error) {
      console.error('Error downloading folder:', error);
      setError('Failed to download folder');
    }
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    setFileLoading(true);
    setFileContent(null);
    setIsEditing(false);

    try {
      // Get signed URL for the file
      const signedUrl = await window.electron.invoke('get-signed-url', selectedBucket, file.Key);

      const fileName = file.Key.toLowerCase();

      if (
        fileName.endsWith('.txt') ||
        fileName.endsWith('.log') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.csv')
      ) {
        // For text files
        const response = await fetch(signedUrl);
        const text = await response.text();
        setFileContent({ type: 'text', content: text });
      } else if (
        fileName.match(/\.(js|jsx|ts|tsx|py|java|html|css|json|yaml|yml|xml|go|c|cpp|cs|php|rb)$/)
      ) {
        // For code files
        const response = await fetch(signedUrl);
        const text = await response.text();
        setFileContent({ type: 'code', content: text });
      } else if (fileName.endsWith('.pdf')) {
        setFileContent({ type: 'pdf', url: signedUrl });
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        setFileContent({ type: 'image', url: signedUrl });
      } else {
        // For other files, just provide download link
        setFileContent({ type: 'other', url: signedUrl });
      }
    } catch (error) {
      console.error('Error fetching file:', error);
      setError('Failed to load file content');
    } finally {
      setFileLoading(false);
    }
  };

  const handleEditFile = () => {
    if (selectedFile && (fileContent.type === 'text' || fileContent.type === 'code')) {
      setIsEditing(true);
    }
  };

  const handleSaveFile = async (newContent) => {
    if (!selectedFile || !selectedBucket) return;

    try {
      const success = await window.electron.invoke('save-file-content', {
        bucket: selectedBucket,
        key: selectedFile.Key,
        content: newContent,
      });

      if (success) {
        // Update the file content in the state
        setFileContent({
          ...fileContent,
          content: newContent,
        });

        // Exit edit mode
        setIsEditing(false);

        // Refresh the file list to update metadata
        await handleRefresh();
      } else {
        throw new Error('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save file');
      return Promise.reject(error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const { folders, files: currentFiles } = getCurrentFolderContents();

  return (
    <div className="flex h-screen bg-primary text-text-primary">
      {/* Profile Sidebar */}
      <Sidebar
        isProfileSidebarOpen={isProfileSidebarOpen}
        setIsProfileSidebarOpen={setIsProfileSidebarOpen}
        profiles={profiles}
        selectedProfile={selectedProfile}
        setSelectedProfile={setSelectedProfile}
        isSSOProfile={isSSOProfile}
        isSignedIn={isSignedIn}
        handleSSOSignIn={handleSSOSignIn}
        loading={loading}
        buckets={buckets}
        selectedBucket={selectedBucket}
        selectBucket={selectBucket}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* File Explorer */}
        <FileExplorer
          isFileListOpen={isFileListOpen}
          setIsFileListOpen={setIsFileListOpen}
          selectedBucket={selectedBucket}
          currentPath={currentPath}
          navigateToFolder={navigateToFolder}
          fileInputRef={fileInputRef}
          handleUpload={handleUpload}
          handleDownloadFolder={handleDownloadFolder}
          handleRefresh={handleRefresh}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          folders={folders}
          filteredFiles={filteredFiles.length > 0 ? filteredFiles : currentFiles}
          selectedFile={selectedFile}
          handleFileClick={handleFileClick}
        />

        {/* File Preview Area */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
          {error && (
            <div className="mb-4 p-3 bg-error bg-opacity-10 border border-error text-error rounded-md text-sm">
              {error}
            </div>
          )}

          {selectedFile ? (
            isEditing ? (
              fileContent.type === 'code' ? (
                <CodeEditor
                  file={selectedFile}
                  content={fileContent}
                  onSave={handleSaveFile}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <FileEditor
                  file={selectedFile}
                  content={fileContent}
                  onSave={handleSaveFile}
                  onCancel={handleCancelEdit}
                />
              )
            ) : (
              <FilePreview
                file={selectedFile}
                content={fileContent}
                fileLoading={fileLoading}
                onEdit={handleEditFile}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
              <svg
                className="w-16 h-16 mb-4 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">Select a file to preview</p>
              {selectedBucket && (
                <p className="text-sm mt-2">Browse files in bucket: {selectedBucket}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
