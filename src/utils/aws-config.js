// This file is now just for type definitions and interfaces
export const initializeAWS = (credentials) => {
  // This is just a placeholder - actual initialization happens in main process
  return credentials;
};

export const getAvailableProfiles = async () => {
  // For now, return a default profile
  // In a real app, you would read this from ~/.aws/credentials
  return ['default'];
};
