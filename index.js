const express = require('express');
const { Worker } = require('worker_threads');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

app.use(cors());

// Firebase setup using environment variables
const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  // Ensure newline characters are correctly parsed
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": "googleapis.com"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL  // Use your Firebase Realtime Database URL here
});

app.use(bodyParser.json());

const MAX_SLOTS = 50;

// Function to run in a worker thread
function runWorker(workerData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', {
            workerData
        });

        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

// POST endpoint for vehicle validation
app.post('/api/validate', async (req, res) => {
    const { docId } = req.body;

    try {
        const result = await runWorker({ docId, action: 'validate' });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error validating vehicle:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST endpoint for vehicle entry
app.post('/api/vehicle-entry', async (req, res) => {
    const vehicleData = req.body;

    try {
        const result = await runWorker({ vehicleData, action: 'vehicle-entry' });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error handling vehicle entry:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST endpoint for vehicle exit
app.post('/api/vehicle-exit', async (req, res) => {
    const vehicleData = req.body;

    try {
        const result = await runWorker({ vehicleData, action: 'vehicle-exit' });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error handling vehicle exit:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET endpoint for vehicle history
app.get('/api/vehicle-history', async (req, res) => {
    const { date } = req.query;

    try {
        const result = await runWorker({ date, action: 'vehicle-history' });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error retrieving vehicle history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    const host = process.env.NODE_ENV === 'production' ? 'https://your-deployed-domain.com' : 'http://localhost';
    console.log(`Server running at ${host}:${PORT}`);
});
