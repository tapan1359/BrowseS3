import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './Icons';

// Simple text editor component
const FileEditor = ({ file, content, onSave, onCancel }) => {
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

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

  if (!file || !content) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-text-primary truncate">
          Editing: {file.Key.split('/').pop()}
        </h2>
        <div className="flex items-center gap-2">
          {error && <span className="text-error text-sm">{error}</span>}
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
            disabled={isSaving}
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
      <div className="flex-1 rounded-lg overflow-hidden">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-full p-4 bg-secondary text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent code-preview resize-none"
          spellCheck="false"
          disabled={isSaving}
        />
      </div>
    </div>
  );
};

export default FileEditor;
