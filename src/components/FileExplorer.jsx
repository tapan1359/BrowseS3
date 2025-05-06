import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UploadIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
  SpinnerIcon,
} from './Icons';
import Breadcrumbs from './Breadcrumbs';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import ParentFolderItem from './ParentFolderItem';

const FileExplorer = ({
  isFileListOpen,
  setIsFileListOpen,
  selectedBucket,
  currentPath,
  navigateToFolder,
  fileInputRef,
  handleUpload,
  handleDownloadFolder,
  handleRefresh,
  loading,
  searchQuery,
  setSearchQuery,
  folders,
  filteredFiles,
  selectedFile,
  handleFileClick,
}) => {
  return (
    <div
      className="flex flex-col flex-shrink-0 border-r border-border"
      style={{
        width: isFileListOpen ? '320px' : '48px',
        transition: 'width 300ms ease-in-out',
      }}
    >
      <div className="p-4 border-b border-border flex items-center gap-2">
        {isFileListOpen ? (
          <>
            <Breadcrumbs
              selectedBucket={selectedBucket}
              currentPath={currentPath}
              navigateToFolder={navigateToFolder}
            />

            <div className="flex items-center gap-1 flex-shrink-0">
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
                className="p-1.5 rounded-md hover:bg-tertiary transition-colors"
                title="Upload files"
                disabled={loading || !selectedBucket}
              >
                <UploadIcon className="w-4 h-4 text-text-secondary" />
              </button>

              {/* Download folder button - only show if we're in a folder */}
              {currentPath && (
                <button
                  onClick={handleDownloadFolder}
                  className="p-1.5 rounded-md hover:bg-tertiary transition-colors"
                  title="Download folder"
                  disabled={loading}
                >
                  <DownloadIcon className="w-4 h-4 text-text-secondary" />
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-md hover:bg-tertiary transition-colors"
                title="Refresh"
                disabled={loading}
              >
                <RefreshIcon className="w-4 h-4 text-text-secondary" />
              </button>

              {/* Collapse button */}
              <button
                onClick={() => setIsFileListOpen(false)}
                className="p-1.5 rounded-md hover:bg-tertiary transition-colors"
                title="Collapse file explorer"
              >
                <ChevronLeftIcon className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsFileListOpen(true)}
            className="p-1.5 rounded-md hover:bg-tertiary transition-colors mx-auto"
            title="Expand file explorer"
          >
            <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
          </button>
        )}
      </div>

      {isFileListOpen && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search input */}
          {selectedBucket && (
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-4 h-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                placeholder="Search in current folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-accent transition-colors bg-secondary text-text-primary border-border text-sm"
              />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <SpinnerIcon className="text-accent" />
            </div>
          ) : (
            <>
              {/* Parent folder button */}
              {currentPath && (
                <ParentFolderItem currentPath={currentPath} navigateToFolder={navigateToFolder} />
              )}

              {/* Folders */}
              {folders.map((folder) => (
                <FolderItem
                  key={folder}
                  folder={folder}
                  currentPath={currentPath}
                  navigateToFolder={navigateToFolder}
                />
              ))}

              {/* Files */}
              {filteredFiles.map((file) => (
                <FileItem
                  key={file.Key}
                  file={file}
                  selectedFile={selectedFile}
                  handleFileClick={handleFileClick}
                />
              ))}

              {/* Empty state */}
              {folders.length === 0 && filteredFiles.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-text-tertiary">No files or folders found</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
