# BrowseS3

A modern, feature-rich S3 file browser with AWS SSO support. Built with Electron, React, and Tailwind CSS.

![BrowseS3 Screenshot](screenshot.png)

## Features

- 🔐 AWS SSO Support
- 📂 Hierarchical folder navigation
- 🔍 File search within folders
- 👀 File preview support for:
  - Text files
  - Code files with syntax highlighting
  - Images
  - PDFs
- 📤 Upload files and folders
- 📥 Download files and folders
- 🎨 Modern, responsive UI with dark theme
- ↔️ Resizable panels
- 🔄 Auto-refresh
- 🗂️ Breadcrumb navigation

## Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/yourusername/browse-s3/releases) page.

### Build from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/browse-s3.git
cd browse-s3
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run electron:dev
```

4. Build for production:
```bash
npm run electron:build
```

The built application will be available in the `dist_electron` directory.

## AWS Configuration

1. **Standard AWS Profiles**
   - Configure your AWS credentials in `~/.aws/credentials`
   - Configure your AWS config in `~/.aws/config`

2. **AWS SSO Profiles**
   - Configure your SSO profiles in `~/.aws/config`:
   ```ini
   [profile my-sso-profile]
   sso_start_url = https://my-sso-portal.awsapps.com/start
   sso_region = us-east-1
   sso_account_id = 123456789012
   sso_role_name = MyRole
   region = us-west-2
   ```

## Development

### Project Structure

- `main.js` - Electron main process
- `preload.js` - Electron preload script
- `src/App.jsx` - Main React component
- `src/index.jsx` - React entry point

### Available Scripts

- `npm run electron:dev` - Run in development mode
- `npm run electron:build` - Build for production
- `npm run electron:preview` - Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/)