import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { SpinnerIcon } from './Icons';

const CodeEditor = ({ file, content, onSave, onCancel }) => {
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (content && content.content) {
      setEditedContent(content.content);
    }
  }, [content]);

  const handleSave = async () => {
    if (!file || !editedContent) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await onSave(editedContent);
    } catch (err) {
      console.error('Error saving file:', err);
      setError('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorDidMount = () => {
    setIsEditorReady(true);
  };

  // Determine language based on file extension
  const getLanguage = () => {
    if (!file) return 'plaintext';
    
    const fileName = file.Key.toLowerCase();
    const extension = fileName.split('.').pop();
    
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'shell',
      'bash': 'shell',
      'xml': 'xml',
      'sql': 'sql',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'txt': 'plaintext',
      'log': 'plaintext',
    };
    
    return languageMap[extension] || 'plaintext';
  };

  // Determine theme based on file type
  const getTheme = () => {
    return 'vs-dark';
  };

  if (!file || !content) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-text-primary truncate">
          Editing: {file.Key.split('/').pop()}
        </h2>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-error text-sm">{error}</span>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md transition-colors bg-tertiary hover:bg-gray-600 text-white flex items-center gap-2 text-sm"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md transition-colors bg-accent hover:bg-accent-hover text-white flex items-center gap-2 text-sm"
            disabled={isSaving || !isEditorReady}
          >
            {isSaving ? (
              <>
                <SpinnerIcon className="w-4 h-4" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-border">
        <Editor
          height="100%"
          language={getLanguage()}
          value={editedContent}
          theme={getTheme()}
          onChange={setEditedContent}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontLigatures: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <SpinnerIcon className="w-8 h-8 text-blue-500" />
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CodeEditor;
