import React, { useState, useEffect, useRef } from 'react';

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
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [leftWidth, setLeftWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [middleWidth, setMiddleWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [isInitialized, setIsInitialized] = useState(false);

  // Add base font style that will be inherited by all elements
  const baseStyle = {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Courier New", monospace',
  };

  // File type detection helpers
  const isTextFile = (filename) => {
    const textExtensions = ['.txt', '.log', '.md', '.csv'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isCodeFile = (filename) => {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.html', '.css', '.json', '.yaml', '.yml'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isPDFFile = (filename) => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

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
      const filtered = getCurrentFolderContents().files.filter(file => 
        file.Key.toLowerCase().includes(searchQuery.toLowerCase())
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
    files.forEach(file => {
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
  };

  // Modified getCurrentFolderContents function
  const getCurrentFolderContents = () => {
    if (!folderStructure) return { folders: [], files: [] };

    if (!currentPath) {
      return { 
        folders: Object.keys(folderStructure).filter(k => k !== '_files'), 
        files: folderStructure._files || [] 
      };
    }

    const parts = currentPath.split('/').filter(Boolean);
    let current = folderStructure;
    for (const part of parts) {
      current = current[part];
      if (!current) return { folders: [], files: [] };
    }

    return {
      folders: Object.keys(current).filter(k => k !== '_files'),
      files: current._files || []
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

  // Handle mouse events for resizing
  const handleMouseMove = (e) => {
    if (isDraggingLeft) {
      const newWidth = Math.max(48, Math.min(400, e.clientX));
      setLeftWidth(newWidth);
    } else if (isDraggingRight) {
      const newWidth = Math.max(48, Math.min(600, e.clientX - leftWidth));
      setMiddleWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  };

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLeft, isDraggingRight]);

  // Modified Breadcrumbs component
  const Breadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const containerRef = useRef(null);

    const handleBreadcrumbClick = (index) => {
      if (index === -1) {
        // Clicked on bucket name - go to root
        navigateToFolder('');
      } else {
        // Clicked on a folder - go to that path
        navigateToFolder(parts.slice(0, index + 1).join('/'));
      }
    };

    return (
      <div className="flex-1 min-w-0 text-xs" style={{ color: '#718096' }}>
        <div 
          ref={containerRef} 
          className="flex flex-wrap items-center gap-1"
        >
          <button 
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-[#E5E9F0] truncate max-w-[150px] hover:text-blue-400 transition-colors" 
            title={selectedBucket}
          >
            {selectedBucket}
          </button>
          {parts.length > 0 && (
            <span className="text-gray-500">/</span>
          )}
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <button 
                onClick={() => handleBreadcrumbClick(index)}
                className="text-[#E5E9F0] truncate max-w-[150px] hover:text-blue-400 transition-colors" 
                title={part}
              >
                {part}
              </button>
              {index < parts.length - 1 && (
                <span className="text-gray-500">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const { folders, files: currentFiles } = getCurrentFolderContents();

  // Modified handleUpload function
  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || !selectedBucket) return;

    setLoading(true);
    let hasError = false;

    try {
      for (const file of files) {
        const uploadPath = currentPath 
          ? `${currentPath}/${file.name}` 
          : file.name;

        try {
          await window.electron.invoke('upload-file', {
            bucket: selectedBucket,
            key: uploadPath,
            filePath: file.path
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
        prefix: currentPath
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

    try {
      // Get signed URL for the file
      const signedUrl = await window.electron.invoke('get-signed-url', selectedBucket, file.Key);
      
      if (isTextFile(file.Key) || isCodeFile(file.Key)) {
        // For text and code files, fetch content
        const response = await fetch(signedUrl);
        const text = await response.text();
        setFileContent({ type: 'text', content: text });
      } else if (isPDFFile(file.Key)) {
        setFileContent({ type: 'pdf', url: signedUrl });
      } else if (isImageFile(file.Key)) {
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

  const FilePreview = ({ file, content }) => {
    if (!file || !content) return null;

    if (fileLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2D9CDB' }}></div>
        </div>
      );
    }

    switch (content.type) {
      case 'text':
        return (
          <div className="h-full">
            <div className="bg-[#1E1E1E] rounded-md p-4 h-full overflow-auto tracking-tight" style={{ color: '#E5E9F0' }}>
              <pre className="whitespace-pre-wrap font-inherit">{content.content}</pre>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="h-full">
            <iframe
              src={content.url}
              className="w-full h-full rounded-md"
              title="PDF Preview"
            />
          </div>
        );
      case 'image':
        return (
          <div className="h-full flex items-center justify-center bg-[#1E1E1E] rounded-md">
            <img
              src={content.url}
              alt={file.Key}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );
      case 'other':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[#E5E9F0] mb-4">This file type cannot be previewed</p>
            <a
              href={content.url}
              download
              className="px-4 py-2 rounded-md transition-colors"
              style={{ backgroundColor: '#2D9CDB', color: '#E5E9F0' }}
            >
              Download File
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#1A2B3B', ...baseStyle }}>
      {/* Profile Sidebar */}
      <div 
        className="flex flex-col flex-shrink-0" 
        style={{ 
          backgroundColor: '#2C3E50',
          width: isProfileSidebarOpen ? `${leftWidth}px` : '48px',
          transition: isDraggingLeft ? 'none' : 'width 300ms'
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#3D5A80' }}>
          {isProfileSidebarOpen ? (
            <>
              <h2 className="text-lg font-medium tracking-tight" style={{ color: '#E5E9F0' }}>S3 Browser</h2>
              <button
                onClick={() => setIsProfileSidebarOpen(false)}
                className="p-1 rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsProfileSidebarOpen(true)}
              className="p-1 rounded-md hover:bg-gray-700 transition-colors mx-auto"
            >
              <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {isProfileSidebarOpen && (
          <>
            <div className="p-4">
              <select 
                value={selectedProfile || ''} 
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="w-full p-2 rounded-md border focus:outline-none focus:ring-2 transition-colors tracking-tight"
                style={{ 
                  backgroundColor: '#1A2B3B',
                  color: '#E5E9F0',
                  borderColor: '#3D5A80',
                  fontFamily: 'inherit'
                }}
              >
                {profiles.map(profile => (
                  <option key={profile} value={profile} style={{ backgroundColor: '#1A2B3B' }}>
                    {profile}
                  </option>
                ))}
              </select>
              {isSSOProfile && !isSignedIn && (
                <button
                  onClick={handleSSOSignIn}
                  disabled={loading}
                  className="w-full mt-2 px-4 py-2 rounded-md transition-colors tracking-tight"
                  style={{ 
                    backgroundColor: loading ? '#2C3E50' : '#F2994A',
                    color: '#E5E9F0',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  Sign in with SSO
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium mb-2 tracking-tight" style={{ color: '#E5E9F0' }}>Buckets</h3>
              {loading ? (
                <div className="flex justify-center items-center p-4" style={{ color: '#E5E9F0' }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#2D9CDB' }}></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {buckets.map((bucket) => (
                    <button
                      key={bucket.Name}
                      onClick={() => selectBucket(bucket.Name)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                      style={{ 
                        backgroundColor: selectedBucket === bucket.Name ? '#1A2B3B' : 'transparent',
                        color: '#E5E9F0',
                        ':hover': { backgroundColor: '#1A2B3B' }
                      }}
                    >
                      {bucket.Name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Resize handle for left sidebar */}
      {isProfileSidebarOpen && (
        <div
          className="w-1 cursor-col-resize hover:bg-blue-400 transition-colors"
          onMouseDown={() => setIsDraggingLeft(true)}
          style={{ backgroundColor: isDraggingLeft ? '#60A5FA' : '#3D5A80' }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* Folder Structure */}
        <div 
          className="flex flex-col flex-shrink-0 border-r" 
          style={{ 
            backgroundColor: '#1A2B3B', 
            borderColor: '#3D5A80',
            width: isFileListOpen ? `${middleWidth}px` : '48px',
            transition: isDraggingRight ? 'none' : 'width 300ms'
          }}
        >
          <div className="p-4 border-b flex items-center gap-2" style={{ backgroundColor: '#2C3E50', borderColor: '#3D5A80' }}>
            {isFileListOpen ? (
              <>
                <Breadcrumbs />
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Hidden file input for upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    className="hidden"
                    multiple
                  />
                  
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 rounded-md hover:bg-gray-700 transition-colors"
                    title="Upload files"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>

                  {/* Download folder button - only show if we're in a folder */}
                  {currentPath && (
                    <button
                      onClick={handleDownloadFolder}
                      className="p-1 rounded-md hover:bg-gray-700 transition-colors"
                      title="Download folder"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}

                  {/* Refresh button */}
                  <button
                    onClick={handleRefresh}
                    className="p-1 rounded-md hover:bg-gray-700 transition-colors"
                    title="Refresh"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  {/* Collapse button */}
                  <button
                    onClick={() => setIsFileListOpen(false)}
                    className="p-1 rounded-md hover:bg-gray-700 transition-colors"
                    title="Collapse sidebar"
                  >
                    <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setIsFileListOpen(true)}
                className="p-1 rounded-md hover:bg-gray-700 transition-colors mx-auto"
              >
                <svg className="w-5 h-5" style={{ color: '#E5E9F0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {isFileListOpen && (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Search input */}
              {selectedBucket && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search in current folder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 rounded-md border focus:outline-none focus:ring-2 tracking-tight"
                    style={{ 
                      backgroundColor: '#1A2B3B',
                      color: '#E5E9F0',
                      borderColor: '#3D5A80',
                      '::placeholder': { color: '#718096' },
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}

              {/* Parent folder button */}
              {currentPath && (
                <button
                  onClick={() => {
                    const parts = currentPath.split('/').filter(Boolean);
                    parts.pop();
                    navigateToFolder(parts.join('/'));
                  }}
                  className="w-full p-3 rounded-md text-left transition-colors mb-2 flex items-center"
                  style={{ 
                    backgroundColor: '#2C3E50',
                    color: '#E5E9F0'
                  }}
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#2D9CDB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                  <span className="truncate">Parent Directory</span>
                </button>
              )}

              {/* Folders */}
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => navigateToFolder(currentPath ? `${currentPath}/${folder}` : folder)}
                  className="w-full p-3 rounded-md text-left transition-colors mb-2 flex items-center"
                  style={{ 
                    backgroundColor: '#2C3E50',
                    color: '#E5E9F0'
                  }}
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#2D9CDB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="truncate" title={folder}>{folder}</span>
                </button>
              ))}

              {/* Files */}
              {filteredFiles.map((file) => (
                <button
                  key={file.Key}
                  onClick={() => handleFileClick(file)}
                  className="w-full p-3 rounded-md text-left transition-colors mb-2 flex items-center"
                  style={{ 
                    backgroundColor: selectedFile?.Key === file.Key ? '#2C3E50' : '#1A2B3B',
                    color: '#E5E9F0'
                  }}
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#2D9CDB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate" title={file.Key.split('/').pop()}>
                    {file.Key.split('/').pop()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resize handle for middle section */}
        {isFileListOpen && (
          <div
            className="w-1 cursor-col-resize hover:bg-blue-400 transition-colors"
            onMouseDown={() => setIsDraggingRight(true)}
            style={{ backgroundColor: isDraggingRight ? '#60A5FA' : '#3D5A80' }}
          />
        )}

        {/* File Preview Area */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {selectedFile ? (
            <>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-medium tracking-tight" style={{ color: '#E5E9F0' }}>{selectedFile.Key.split('/').pop()}</h2>
                <div className="flex gap-2">
                  {fileContent?.url && (
                    <a
                      href={fileContent.url}
                      download
                      className="px-4 py-2 rounded-md transition-colors"
                      style={{ backgroundColor: '#2D9CDB', color: '#E5E9F0' }}
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
              <div className="flex-1 rounded-lg overflow-hidden">
                <FilePreview file={selectedFile} content={fileContent} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-lg tracking-tight" style={{ color: '#718096' }}>
              Select a file to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 