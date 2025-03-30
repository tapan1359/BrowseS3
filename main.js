const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const { 
  S3Client, 
  ListBucketsCommand, 
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { fromNodeProviderChain } = require('@aws-sdk/credential-providers');

let s3Client = null;
let mainWindow = null;

// Handle development server URL
const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

// Function to read AWS profiles
function getAWSProfiles() {
  try {
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    const configPath = path.join(os.homedir(), '.aws', 'config');
    
    const profiles = new Set(['default']);
    
    // Read credentials file
    if (fs.existsSync(credentialsPath)) {
      const credentials = fs.readFileSync(credentialsPath, 'utf8');
      const credentialProfiles = credentials.match(/\[(.*?)\]/g)?.map(profile => profile.slice(1, -1)) || [];
      credentialProfiles.forEach(profile => profiles.add(profile));
    }
    
    // Read config file for SSO profiles
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      const ssoProfiles = config.match(/\[profile (.*?)\]/g)?.map(profile => profile.slice(9, -1)) || [];
      ssoProfiles.forEach(profile => profiles.add(profile));
    }
    
    return Array.from(profiles);
  } catch (error) {
    console.error('Error reading AWS profiles:', error);
    return ['default'];
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Send AWS profiles to renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    const profiles = getAWSProfiles();
    console.log('Sending profiles to renderer:', profiles);
    mainWindow.webContents.send('aws-profiles', profiles);
  });
}

// Handle AWS credential requests from renderer
ipcMain.handle('get-aws-credentials', async (event, profile) => {
  try {
    console.log('Initializing AWS with profile:', profile);
    
    // Create S3 client with credentials from the specified profile
    s3Client = new S3Client({
      region: 'us-east-1',
      credentials: fromNodeProviderChain({ profile })
    });
    
    return true;
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    return false;
  }
});

// Handle AWS SSO sign-in
ipcMain.handle('aws-sso-signin', async (event, profile) => {
  try {
    console.log('Starting AWS SSO sign-in for profile:', profile);
    
    // For SSO profiles, the fromNodeProviderChain credential provider will handle the SSO flow
    s3Client = new S3Client({
      region: 'us-east-1',
      credentials: fromNodeProviderChain({ profile })
    });
    
    // Test the credentials by making a simple API call
    await s3Client.send(new ListBucketsCommand({}));
    return true;
  } catch (error) {
    console.error('Error during AWS SSO sign-in:', error);
    return false;
  }
});

// Handle list buckets request
ipcMain.handle('list-buckets', async () => {
  try {
    if (!s3Client) {
      throw new Error('AWS client not initialized');
    }
    console.log('Listing buckets...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log('Buckets found:', response.Buckets.length);
    return response.Buckets;
  } catch (error) {
    console.error('Error listing buckets:', error);
    throw error;
  }
});

// Handle list files request
ipcMain.handle('list-files', async (event, bucketName) => {
  try {
    if (!s3Client) {
      throw new Error('AWS client not initialized');
    }
    console.log('Listing files in bucket:', bucketName);
    const command = new ListObjectsCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);
    return response.Contents;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
});

// Handle signed URL generation
ipcMain.handle('get-signed-url', async (event, bucketName, key) => {
  try {
    if (!s3Client) {
      throw new Error('AWS client not initialized');
    }
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    // Generate a signed URL that expires in 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
});

// Add upload file handler
ipcMain.handle('upload-file', async (event, { bucket, key, filePath }) => {
  try {
    if (!s3Client) {
      throw new Error('AWS not initialized');
    }

    const fileStream = fs.createReadStream(filePath);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
});

// Add download folder handler
ipcMain.handle('download-folder', async (event, { bucket, prefix }) => {
  try {
    if (!s3Client) {
      throw new Error('AWS not initialized');
    }

    // First, let user select download location
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Download Location',
      buttonLabel: 'Select Folder'
    });

    if (!filePaths || filePaths.length === 0) {
      return false;
    }

    const downloadPath = filePaths[0];

    // List all objects in the folder
    const command = new ListObjectsCommand({
      Bucket: bucket,
      Prefix: prefix
    });

    const { Contents } = await s3Client.send(command);
    if (!Contents || Contents.length === 0) {
      throw new Error('No files found in folder');
    }

    // Download each file
    for (const file of Contents) {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: file.Key
      });

      const { Body } = await s3Client.send(getCommand);
      
      // Create the full path for the file
      const relativePath = file.Key.startsWith(prefix) 
        ? file.Key.slice(prefix.length) 
        : file.Key;
      const fullPath = path.join(downloadPath, relativePath);

      // Create directories if they don't exist
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

      // Save the file
      const writeStream = fs.createWriteStream(fullPath);
      await new Promise((resolve, reject) => {
        Body.pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });
    }

    return true;
  } catch (error) {
    console.error('Error downloading folder:', error);
    throw error;
  }
});

// Wait for the app to be ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 