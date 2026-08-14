const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const app = express();
const port = 3001;

// Initialize Firebase Admin (only once)
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());

// ✅ CORRECT FLOW: Home → Dashboard → Reports
app.get('/', (req, res) => {
    res.render('home');  // ✅ Home page first
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.get('/reports', (req, res) => {
    res.render('reports');
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

// Helper functions for mock data generation
function getRandomValue(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function jitter(value, maxOffset) {
  return value + (Math.random() * 2 - 1) * maxOffset;
}

function getRandomLocation() {
  const locations = [
    { name: "Sabarmati River", district: "Ahmedabad", state: "Gujarat", lat: 23.020925865026157, lng: 72.5751981354866 },
    { name: "Kankaria Lake", district: "Ahmedabad", state: "Gujarat", lat: 22.9988, lng: 72.6047 },
    { name: "Chandola Lake", district: "Ahmedabad", state: "Gujarat", lat: 23.0089, lng: 72.6047 },
    { name: "Vastrapur Lake", district: "Ahmedabad", state: "Gujarat", lat: 23.0355, lng: 72.5246 },
    { name: "Narmada River", district: "Bharuch", state: "Gujarat", lat: 21.7051, lng: 72.9959 },
    { name: "Thol Lake", district: "Mehsana", state: "Gujarat", lat: 23.5832, lng: 72.4153 }
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

async function addMockDataEntry() {
  try {
    const loc = getRandomLocation();
    await db.collection('sensor_data').add({
      chlorophyll: getRandomValue(5, 150, 1),
      district: loc.district,
      gps: { 
        lat: jitter(loc.lat, 0.01), 
        lng: jitter(loc.lng, 0.01) 
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

// Start server
app.listen(port, () => {
    console.log(`🚤 Aqunex Server running at http://localhost:${port}`);
    console.log(`🏠 Home:      http://localhost:${port}/`);
    console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
    console.log(`📈 Reports:   http://localhost:${port}/reports`);
    console.log(`🧪 Mock API:  Press Ctrl+M on dashboard to control mock data`);
});
