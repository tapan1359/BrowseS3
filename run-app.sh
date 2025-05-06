#!/bin/bash

# Single command to run both React and Electron parts of BrowseS3
echo "Starting BrowseS3 application..."

# Set environment variables
export NODE_ENV=development
export VITE_DEV_SERVER_URL=http://localhost:5173

# Start Vite dev server in background
echo "Starting Vite development server..."
npm run dev &
VITE_PID=$!

# Wait for Vite server to be ready
echo "Waiting for Vite server to be ready..."
npx wait-on http://localhost:5173

# Start Electron
echo "Starting Electron app..."
electron main.js

# Clean up Vite process when Electron exits
kill $VITE_PID
