# S3 Browser

A modern desktop application for browsing and managing AWS S3 buckets with AWS SSO support.

## Features

- Browse S3 buckets and folders
- Upload and download files
- Preview various file types (images, PDFs, text files, code)
- AWS SSO support
- Search functionality
- Pagination for large directories
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
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
npm start
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

## Configuration

### AWS Credentials

The application uses AWS credentials from your local AWS CLI configuration. Make sure you have:

1. AWS CLI installed and configured
2. Credentials file at `~/.aws/credentials`
3. SSO configuration in `~/.aws/config` (if using SSO)

### Development Environment

The application uses the following environment variables:
- `NODE_ENV`: Set to 'development' during development and 'production' during packaging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.