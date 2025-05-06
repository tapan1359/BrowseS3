import React from 'react';
import { FolderIcon } from './Icons';

const FolderItem = ({ folder, currentPath, navigateToFolder }) => {
  const handleClick = () => {
    navigateToFolder(currentPath ? `${currentPath}/${folder}` : folder);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-3 rounded-md text-left transition-colors mb-2 flex items-center hover:bg-tertiary group"
    >
      <div className="mr-3 text-blue-400 group-hover:text-blue-300 transition-colors">
        <FolderIcon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-text-primary" title={folder}>
            {folder}
          </span>
        </div>

        <div className="text-xs text-text-tertiary mt-1">Folder</div>
      </div>
    </button>
  );
};

export default FolderItem;
