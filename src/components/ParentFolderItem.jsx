import React from 'react';
import { BackIcon } from './Icons';

const ParentFolderItem = ({ currentPath, navigateToFolder }) => {
  const handleClick = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateToFolder(parts.join('/'));
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-3 rounded-md text-left transition-colors mb-2 flex items-center hover:bg-tertiary group"
    >
      <div className="mr-3 text-accent group-hover:text-blue-300 transition-colors">
        <BackIcon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-text-primary">Parent Directory</span>
        </div>

        <div className="text-xs text-text-tertiary mt-1">Go back</div>
      </div>
    </button>
  );
};

export default ParentFolderItem;
