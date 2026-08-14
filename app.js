require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const session = require('express-session');
const helmet = require('helmet');
const crypto = require('crypto');
const { getRandomLocation, addGPSVariation, getRandomValue } = require('./scripts/locations');

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3001;

// ── Firebase Admin Init ──
let serviceAccount;
const fs = require('fs');
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
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
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

// ── Firebase Web Config ──
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY            || "AIzaSyARC-G4soX4WRO26ncZE19l9BeFUsTyHlw",
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || "aquex-871b9.firebaseapp.com",
  databaseURL:       process.env.FIREBASE_DATABASE_URL       || "https://aquex-871b9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         process.env.FIREBASE_PROJECT_ID         || "aquex-871b9",
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || "aquex-871b9.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID|| "501715709742",
  appId:             process.env.FIREBASE_APP_ID             || "1:501715709742:web:8204e44f3219e6584954bf"
};

let db;
try {
  db = admin.firestore();
} catch (e) {
  console.error('⚠️ Could not initialize Firestore database:', e.message);
}

// ── Middleware ──
const isProd = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());

// ── Session ──
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProd) {
    throw new Error('SESSION_SECRET is required in production for secure sessions.');
  }
  sessionSecret = crypto.randomBytes(32).toString('hex');
}

app.use(session({
  name: 'aqunex.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 4
  }
}));

// ── Auth Middleware ──
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/login');
}

// ── Helper ──
function calcRiskLevel(chlorophyll) {
  const score = Math.min(Math.floor(chlorophyll / 3), 10);
  if (score >= 8) return 'high';
  if (score >= 4) return 'moderate';
  return 'low';
}

// ══════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════

// Home
app.get('/', (req, res) => {
  res.render('home', { firebaseConfig, page: 'home', admin: req.session.admin || null });
});

// Login page
app.get('/login', (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/mission');
  res.render('login', { firebaseConfig, page: 'login', admin: null });
});

// POST — verify Firebase ID token and create session
app.post('/auth/login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.json({ success: false, message: 'No token provided.' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      req.session.admin = { uid: decoded.uid, email: decoded.email };
      console.log(`✅ Admin login: ${decoded.email}`);
      res.json({ success: true });
    });
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    res.json({ success: false, message: 'Invalid or expired token.' });
  }
});

// Logout — go back to home, not login
app.get('/auth/logout', (req, res) => {
  const email = req.session.admin?.email || 'unknown';
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('aqunex.sid');
    console.log(`🚪 Admin logged out: ${email}`);
    res.redirect('/');
  });
});


// GET /dashboard — PUBLIC
app.get('/dashboard', async (req, res) => {
  try {
    const snapshot = await db.collection('sensor_data')
      .orderBy('timestamp', 'desc')
      .get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('dashboard', { logs, firebaseConfig, page: 'dashboard', admin: req.session.admin || null });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

// GET /reports — PUBLIC
app.get('/reports', async (req, res) => {
  try {
    const snapshot = await db.collection('sensor_data')
      .orderBy('timestamp', 'desc')
      .get();

    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    logs = logs.map(l => ({
      ...l,
      riskLevel: l.riskLevel || calcRiskLevel(l.chlorophyll || 0)
    }));

    if (req.query.risk === 'high') {
      logs = logs.filter(l => l.riskLevel === 'high');
    }

    const highRiskCount = logs.filter(l => l.riskLevel === 'high').length;

    const avgChlorophyll = logs.length
      ? (logs.reduce((s, l) => s + (l.chlorophyll || 0), 0) / logs.length).toFixed(1)
      : '0.0';

    const avgMicroplastic = logs.length
      ? (logs.reduce((s, l) => s + (l.microplasticIndex || 0), 0) / logs.length).toFixed(2)
      : '0.00';

    res.render('reports', {
      logs, highRiskCount, avgChlorophyll, avgMicroplastic,
      firebaseConfig, page: 'reports', admin: req.session.admin || null
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).send('Error loading reports: ' + err.message);
  }
});

// ══════════════════════════════════════════════
// PROTECTED ROUTES
// ══════════════════════════════════════════════

// GET /mission — 🔐 ONLY THIS IS PROTECTED
app.get('/mission', requireAuth, (req, res) => {
  res.render('mission', { firebaseConfig, page: 'mission', admin: req.session.admin });
});

// ══════════════════════════════════════════════
// MISC ROUTES
// ══════════════════════════════════════════════

app.get('/map', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/api/data', (req, res) => {
  res.json({
    message: "Real-time data available in dashboard/reports",
    endpoints: ["/dashboard", "/reports"]
  });
});

// ══════════════════════════════════════════════
// MOCK DATA CONTROL
// ══════════════════════════════════════════════

let mockInterval = null;
let isMockRunning = false;

async function addMockDataEntry() {
  try {
    const loc = getRandomLocation();
    const variedGPS = addGPSVariation(loc.lat, loc.lng, 3);
    const chlorophyll = getRandomValue(5, 150, 1);

    await db.collection('sensor_data').add({
      chlorophyll,
      district:          loc.district,
      gps:               { lat: variedGPS.lat, lng: variedGPS.lng },
      location:          loc.name,
      ph:                getRandomValue(6.5, 8.5, 1),
      state:             loc.state,
      temperature:       getRandomValue(18, 32, 1),
      timestamp:         admin.firestore.Timestamp.now(),
      turbidity:         Math.floor(getRandomValue(5, 50, 0)),
      microplasticIndex: parseFloat((Math.random() * 15).toFixed(2)),
      plasticDensity:    parseFloat((Math.random() * 8).toFixed(2)),
      riskLevel:         calcRiskLevel(chlorophyll),
      isMockData:        true
    });
    console.log(`✓ Mock data added: ${loc.name} | Chlorophyll: ${chlorophyll} | Risk: ${calcRiskLevel(chlorophyll)}`);
  } catch (error) {
    console.error('❌ Error adding mock data:', error.message);
  }
}

app.post('/api/mock/start', async (req, res) => {
  if (isMockRunning) {
    return res.json({ success: false, message: 'Mock data already running' });
  }
  try {
    await addMockDataEntry();
    mockInterval = setInterval(addMockDataEntry, 10000);
    isMockRunning = true;
    console.log('🚀 Mock data generation started');
    res.json({ success: true, message: 'Mock data started - adding every 10 seconds' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/mock/stop', (req, res) => {
  if (!isMockRunning) {
    return res.json({ success: false, message: 'Mock data not running' });
  }
  clearInterval(mockInterval);
  mockInterval = null;
  isMockRunning = false;
  console.log('🛑 Mock data generation stopped');
  res.json({ success: true, message: 'Mock data stopped' });
});

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
    console.log(`🧹 Cleaned up ${snapshot.size} mock data entries`);
    res.json({ success: true, message: `Deleted ${snapshot.size} mock entries`, count: snapshot.size });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/mock/status', (req, res) => {
  res.json({ running: isMockRunning });
});

// ── 404 handler ──
app.use((req, res) => {
  res.redirect('/');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚤 Aqunex Server running at http://0.0.0.0:${port}`);
  console.log(`🏠 Home:      http://localhost:${port}/`);
  console.log(`🔐 Login:     http://localhost:${port}/login`);
  console.log(`📊 Dashboard: http://localhost:${port}/dashboard  (public)`);
  console.log(`📈 Reports:   http://localhost:${port}/reports    (public)`);
  console.log(`🗺️  Mission:   http://localhost:${port}/mission   (🔐 protected)`);
  console.log(`🧪 Mock API:  Press Ctrl+M on dashboard to control mock data`);
});
