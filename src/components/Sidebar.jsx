import React from 'react';
import { BucketIcon, ChevronLeftIcon, ChevronRightIcon, SpinnerIcon } from './Icons';

const Sidebar = ({
  isProfileSidebarOpen,
  setIsProfileSidebarOpen,
  profiles,
  selectedProfile,
  setSelectedProfile,
  isSSOProfile,
  isSignedIn,
  handleSSOSignIn,
  loading,
  buckets,
  selectedBucket,
  selectBucket,
}) => {
  return (
    <div
      className="flex flex-col flex-shrink-0 border-r border-border"
      style={{
        width: isProfileSidebarOpen ? '256px' : '48px',
        transition: 'width 300ms ease-in-out',
      }}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isProfileSidebarOpen ? (
          <>
            <h2 className="text-lg font-medium text-text-primary">S3 Browser</h2>
            <button
              onClick={() => setIsProfileSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-tertiary transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon className="text-text-secondary" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsProfileSidebarOpen(true)}
            className="p-1 rounded-md hover:bg-tertiary transition-colors mx-auto"
            aria-label="Expand sidebar"
          >
            <ChevronRightIcon className="text-text-secondary" />
          </button>
        )}
      </div>

      {isProfileSidebarOpen && (
        <>
          <div className="p-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              AWS Profile
            </label>
            <select
              value={selectedProfile || ''}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-accent transition-colors bg-secondary text-text-primary border-border text-sm"
            >
              {profiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>

            {isSSOProfile && !isSignedIn && (
              <button
                onClick={handleSSOSignIn}
                disabled={loading}
                className="w-full mt-3 px-4 py-2 rounded-md transition-colors bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in with SSO</span>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium mb-3 text-text-secondary flex items-center">
              <BucketIcon className="w-4 h-4 mr-1.5" />
              Buckets
            </h3>

            {loading ? (
              <div className="flex justify-center items-center p-4">
                <SpinnerIcon className="text-accent" />
              </div>
            ) : (
              <div className="space-y-1">
                {buckets.map((bucket) => (
                  <button
                    key={bucket.Name}
                    onClick={() => selectBucket(bucket.Name)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedBucket === bucket.Name
                        ? 'bg-accent bg-opacity-10 text-accent'
                        : 'text-text-primary hover:bg-tertiary'
                    }`}
                  >
                    {bucket.Name}
                  </button>
                ))}

                {buckets.length === 0 && (
                  <div className="text-sm text-text-tertiary py-2 px-3">No buckets found</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
