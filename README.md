# S3 Browser

A modern desktop application for browsing and managing AWS S3 buckets with AWS SSO support.


## Features

- Modern, sleek UI with dark mode
- Browse S3 buckets and folders
- Upload and download files
- Preview various file types (images, PDFs, text files, code with syntax highlighting)
- AWS SSO support
- Search functionality
- Responsive layout with resizable panels
- Built with React, Tailwind CSS, and Electron

## Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)
- AWS CLI configured with profiles
- AWS SSO configured (if using SSO profiles)

## Development

1. Clone the repository:
```bash
git clone <repository-url>
cd s3-browser
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
# Start both React and Electron in development mode
npm run start

# Alternatively, use the shell script
./run-app.sh
```

This will start both the Vite development server and the Electron application.

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Package the application:
```bash
npm run package
```

This will create an unpacked version of the application in the `out` directory.

3. Create distributable packages:
```bash
npm run make
```

This will create platform-specific packages in the `out/make` directory:
- Windows: Squirrel installer
- macOS: ZIP archive
- Linux: DEB and RPM packages

4. Publish a release (requires GitHub token):
```bash
npm run publish
```

## Project Structure

This project uses Electron with Vite and React. The key files are:

- `main.js`: The Electron main process file
- `preload.js`: Preload script for secure IPC communication
- `src/index.jsx`: React entry point
- `src/App.jsx`: Main React component

For development, we use:
- `main.js` directly with the Vite dev server
- React hot module replacement via Vite

For production, Electron Forge with the Vite plugin:
- Builds the React app to `dist/`
- Processes main.js and preload.js to `.vite/build/`
- Packages everything into an Electron app

## License

This project is licensed under the MIT License - see the LICENSE file for details
## Configuration

### AWS Credentials

The application uses AWS credentials from your local AWS CLI configuration. Make sure you have:

1. AWS CLI installed and configured
2. Credentials file at `~/.aws/credentials`
3. SSO configuration in `~/.aws/config` (if using SSO)
