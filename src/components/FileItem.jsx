import React from 'react';
import { FileIcon, ImageFileIcon, CodeFileIcon, PDFFileIcon, TextFileIcon } from './Icons';

const FileItem = ({ file, selectedFile, handleFileClick }) => {
  const fileName = file.Key.split('/').pop();

  // File type detection
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
  const isCode = /\.(js|jsx|ts|tsx|py|java|html|css|json|yaml|yml|xml|go|c|cpp|cs|php|rb)$/i.test(
    fileName,
  );
  const isPDF = /\.pdf$/i.test(fileName);
  const isText = /\.(txt|log|md|csv)$/i.test(fileName);

  // Get appropriate icon
  const getIcon = () => {
    if (isImage) return <ImageFileIcon className="w-5 h-5 text-blue-400" />;
    if (isCode) return <CodeFileIcon className="w-5 h-5 text-green-400" />;
    if (isPDF) return <PDFFileIcon className="w-5 h-5 text-red-400" />;
    if (isText) return <TextFileIcon className="w-5 h-5 text-yellow-400" />;
    return <FileIcon className="w-5 h-5 text-gray-400" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Format last modified date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <button
      onClick={() => handleFileClick(file)}
      className={`w-full p-3 rounded-md text-left transition-colors mb-2 flex items-center group ${
        selectedFile?.Key === file.Key
          ? 'bg-accent bg-opacity-10 border-l-2 border-accent'
          : 'hover:bg-tertiary border-l-2 border-transparent'
      }`}
    >
      <div className="mr-3 flex-shrink-0">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-text-primary" title={fileName}>
            {fileName}
          </span>
          <span className="text-xs text-text-tertiary ml-2 flex-shrink-0">
            {formatFileSize(file.Size)}
          </span>
        </div>

        <div className="text-xs text-text-tertiary mt-1">{formatDate(file.LastModified)}</div>
      </div>
    </button>
  );
};

export default FileItem;
