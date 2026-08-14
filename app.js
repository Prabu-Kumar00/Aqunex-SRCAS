require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const { getRandomLocation, addGPSVariation, getRandomValue } = require('./scripts/locations');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Firebase Admin (only once)
let serviceAccount;
const fs = require('fs');
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('✅ Firebase Admin initialized via environment variable');
  } catch (e) {
    console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', e.message);
  }
}

if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath);
  console.log('✅ Firebase Admin initialized via local JSON file');
}

if (!serviceAccount) {
  console.error('❌ CRITICAL ERROR: No Firebase credentials found!');
  console.error('Please set FIREBASE_SERVICE_ACCOUNT environment variable or provide serviceAccountKey.json');
  // In production (Render), we want to avoid crashing the whole process immediately if possible, 
  // but Firebase Admin requires it. We'll proceed but db calls will fail.
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

// Global Firebase Web Config to pass to views
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyARC-G4soX4WRO26ncZE19l9BeFUsTyHlw",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "aquex-871b9.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://aquex-871b9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.FIREBASE_PROJECT_ID || "aquex-871b9",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "aquex-871b9.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "501715709742",
  appId: process.env.FIREBASE_APP_ID || "1:501715709742:web:8204e44f3219e6584954bf"
};

let db;
try {
  db = admin.firestore();
} catch (e) {
  console.error('⚠️ Could not initialize Firestore database:', e.message);
}

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());

// ✅ CORRECT FLOW: Home → Dashboard → Reports
app.get('/', (req, res) => {
  res.render('home', { firebaseConfig });  // ✅ Home page first
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { firebaseConfig });
});

app.get('/reports', (req, res) => {
  res.render('reports', { firebaseConfig });
});

// ✅ Home page links to dashboard
app.get('/map', (req, res) => {
  res.redirect('/dashboard');
});

// API endpoint
app.get('/api/data', async (req, res) => {
  res.json({
    message: "Real-time data available in dashboard/reports",
    endpoints: ["/dashboard", "/reports"]
  });
});

// ==========================================
// MOCK DATA CONTROL API ENDPOINTS
// ==========================================

let mockInterval = null;
let isMockRunning = false;


async function addMockDataEntry() {
  try {
    const loc = getRandomLocation();
    const variedGPS = addGPSVariation(loc.lat, loc.lng, 3);
    await db.collection('sensor_data').add({
      chlorophyll: getRandomValue(5, 150, 1),
      district: loc.district,
      gps: {
        lat: variedGPS.lat,
        lng: variedGPS.lng
      },
      location: loc.name,
      ph: getRandomValue(6.5, 8.5, 1),
      state: loc.state,
      temperature: getRandomValue(18, 32, 1),
      timestamp: admin.firestore.Timestamp.now(),
      turbidity: Math.floor(getRandomValue(5, 50, 0)),
      isMockData: true
    });
    console.log(`✓ Mock data added: ${loc.name}`);
  } catch (error) {
    console.error('❌ Error adding mock data:', error.message);
  }
}

// Start mock data generation
app.post('/api/mock/start', async (req, res) => {
  if (isMockRunning) {
    return res.json({ success: false, message: 'Mock data already running' });
  }

  try {
    // Add first entry immediately
    await addMockDataEntry();

    // Then continue every 10 seconds
    mockInterval = setInterval(addMockDataEntry, 10000);
    isMockRunning = true;

    console.log('🚀 Mock data generation started from dashboard');
    res.json({ success: true, message: 'Mock data started - adding every 10 seconds' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Stop mock data generation
app.post('/api/mock/stop', (req, res) => {
  if (!isMockRunning) {
    return res.json({ success: false, message: 'Mock data not running' });
  }

  clearInterval(mockInterval);
  mockInterval = null;
  isMockRunning = false;

  console.log('🛑 Mock data generation stopped from dashboard');
  res.json({ success: true, message: 'Mock data stopped' });
});

// Cleanup all mock data
app.post('/api/mock/cleanup', async (req, res) => {
  try {
    const snapshot = await db.collection('sensor_data')
      .where('isMockData', '==', true)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, message: 'No mock data to clean', count: 0 });
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    console.log(`🧹 Cleaned up ${snapshot.size} mock data entries from dashboard`);
    res.json({ success: true, message: `Deleted ${snapshot.size} mock entries`, count: snapshot.size });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get mock status
app.get('/api/mock/status', (req, res) => {
  res.json({ running: isMockRunning });
});

// ==========================================
// END MOCK DATA CONTROL
// ==========================================

// 404 handler
app.use((req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`🚤 Aqunex Server running at http://localhost:${port}`);
  console.log(`🏠 Home:      http://localhost:${port}/`);
  console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
  console.log(`📈 Reports:   http://localhost:${port}/reports`);
  console.log(`🧪 Mock API:  Press Ctrl+M on dashboard to control mock data`);
});
