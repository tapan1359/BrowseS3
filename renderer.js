const AWS = require('aws-sdk');

// Initialize AWS SDK
const s3 = new AWS.S3({
    region: 'us-east-1' // You'll need to configure this based on your needs
});

// DOM Elements
const bucketsContainer = document.getElementById('buckets');
const fileList = document.getElementById('fileList');
const refreshBtn = document.getElementById('refreshBtn');
const uploadBtn = document.getElementById('uploadBtn');

// Event Listeners
refreshBtn.addEventListener('click', refreshFiles);
uploadBtn.addEventListener('click', handleUpload);

// Functions
async function listBuckets() {
    try {
        const data = await s3.listBuckets().promise();
        displayBuckets(data.Buckets);
    } catch (error) {
        console.error('Error listing buckets:', error);
        showError('Failed to list buckets');
    }
}

function displayBuckets(buckets) {
    bucketsContainer.innerHTML = buckets.map(bucket => `
        <div class="bucket-item" onclick="selectBucket('${bucket.Name}')">
            ${bucket.Name}
        </div>
    `).join('');
}

async function refreshFiles() {
    // Implementation will be added later
    console.log('Refreshing files...');
}

async function handleUpload() {
    // Implementation will be added later
    console.log('Uploading file...');
}

function showError(message) {
    // Implementation will be added later
    console.error(message);
}

// Initialize the app
listBuckets(); 