// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('/api/config/serviceAccountKey.json');  // Replace with actual path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://intellipark-db283.firebaseio.com'  // Replace with your actual Firebase Database URL
});

const db = admin.firestore();

module.exports = { db };
