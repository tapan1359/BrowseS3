import React, { useRef } from 'react';
import { BucketIcon } from './Icons';

const Breadcrumbs = ({ selectedBucket, currentPath, navigateToFolder }) => {
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
    <div className="flex-1 min-w-0 text-sm flex items-center">
      <div ref={containerRef} className="flex flex-wrap items-center gap-1 overflow-hidden">
        <button
          onClick={() => handleBreadcrumbClick(-1)}
          className="flex items-center text-text-primary truncate max-w-[150px] hover:text-accent transition-colors"
          title={selectedBucket}
        >
          <BucketIcon className="w-4 h-4 mr-1.5 text-accent" />
          <span className="truncate">{selectedBucket}</span>
        </button>

        {parts.length > 0 && <span className="text-text-tertiary mx-1">/</span>}

        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className="text-text-primary truncate max-w-[150px] hover:text-accent transition-colors"
              title={part}
            >
              {part}
            </button>
            {index < parts.length - 1 && <span className="text-text-tertiary mx-1">/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Breadcrumbs;
