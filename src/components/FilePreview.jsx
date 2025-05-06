import React from 'react';
import { DownloadIcon, SpinnerIcon } from './Icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const getLanguage = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sh: 'bash',
    bash: 'bash',
    xml: 'xml',
    sql: 'sql',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
  };

  return languageMap[extension] || 'plaintext';
};

const FilePreview = ({ file, content, fileLoading, onEdit }) => {
  if (!file || !content) return null;

  if (fileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <SpinnerIcon className="w-8 h-8 text-blue-500" />
      </div>
    );
  }

  const isEditable = content.type === 'text' || content.type === 'code';

  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <div className="h-full overflow-auto">
            <div className="bg-secondary rounded-md p-4 h-full overflow-auto tracking-tight text-text-primary">
              <pre className="whitespace-pre-wrap font-mono text-sm">{content.content}</pre>
            </div>
          </div>
        );
      case 'code':
        return (
          <div className="h-full overflow-auto">
            <SyntaxHighlighter
              language={getLanguage(file.Key)}
              style={atomOneDark}
              customStyle={{
                margin: 0,
                padding: '1rem',
                borderRadius: '0.375rem',
                height: '100%',
                fontSize: 'var(--code-font-size)',
                backgroundColor: '#1e293b',
              }}
              showLineNumbers={true}
              wrapLines={true}
            >
              {content.content}
            </SyntaxHighlighter>
          </div>
        );
      case 'pdf':
        return (
          <div className="h-full">
            <iframe src={content.url} className="w-full h-full rounded-md" title="PDF Preview" />
          </div>
        );
      case 'image':
        return (
          <div className="h-full flex items-center justify-center bg-secondary rounded-md p-4">
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
            <p className="text-text-primary mb-4">This file type cannot be previewed</p>
            <a
              href={content.url}
              download
              className="px-4 py-2 rounded-md transition-colors bg-accent hover:bg-accent-hover text-white flex items-center gap-2"
            >
              <DownloadIcon />
              Download File
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-text-primary truncate">
          {file.Key.split('/').pop()}
        </h2>
        <div className="flex items-center gap-2">
          {isEditable && (
            <button
              onClick={() => onEdit && onEdit()}
              className="px-3 py-1.5 rounded-md transition-colors bg-tertiary hover:bg-gray-600 text-white flex items-center gap-2 text-sm"
            >
              Edit
            </button>
          )}
          {content.url && (
            <a
              href={content.url}
              download
              className="px-3 py-1.5 rounded-md transition-colors bg-accent hover:bg-accent-hover text-white flex items-center gap-2 text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default FilePreview;
