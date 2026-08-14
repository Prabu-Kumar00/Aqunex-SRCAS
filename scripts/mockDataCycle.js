const admin = require('firebase-admin');
const { getRandomLocation, addGPSVariation, getRandomValue } = require('./locations');

const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const COLLECTION_NAME = 'sensor_data';   // must match dashboard
const MAX_MOCK_DOCS = 10;
const ADD_INTERVAL = 10000;             // 10 seconds

function generateMockData() {
  const loc = getRandomLocation();
  const variedGPS = addGPSVariation(loc.lat, loc.lng, 3);
  return {
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
  };
}

async function getMockDocs() {
  const snap = await db.collection(COLLECTION_NAME)
    .where('isMockData', '==', true)
    .get();
  return snap.docs;
}

async function trimMockDocsIfNeeded() {
  const docs = await getMockDocs();
  if (docs.length <= MAX_MOCK_DOCS) return;

  const extra = docs.length - MAX_MOCK_DOCS;
  const batch = db.batch();

  // Delete first N docs (no ordering needed)
  for (let i = 0; i < extra; i++) {
    batch.delete(docs[i].ref);
  }
  await batch.commit();
  console.log(`🧹 Removed ${extra} oldest mock docs (kept ${MAX_MOCK_DOCS})`);
}

async function addMockData() {
  try {
    await trimMockDocsIfNeeded();

    const mock = generateMockData();
    await db.collection(COLLECTION_NAME).add(mock);

    const current = (await getMockDocs()).length;
    console.log(`✓ [${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}] Mock added (${current}/${MAX_MOCK_DOCS}) at ${mock.location}`);
  } catch (err) {
    console.error('❌ mockDataCycle error:', err.message);
  }
}

console.log('🚀 Mock Data Cycle Mode');
console.log(`   Collection : ${COLLECTION_NAME}`);
console.log(`   Interval   : ${ADD_INTERVAL / 1000}s`);
console.log(`   Max mocks  : ${MAX_MOCK_DOCS}`);
console.log('Press Ctrl+C to stop\n');

addMockData();
const timer = setInterval(addMockData, ADD_INTERVAL);

process.on('SIGINT', async () => {
  clearInterval(timer);
  console.log('\n🛑 Stopping mock cycle, cleaning all mock docs...');
  try {
    const docs = await getMockDocs();
    if (docs.length === 0) {
      console.log('✅ No mock docs to clean. Bye!');
      process.exit(0);
    }
    const batch = db.batch();
    docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`✅ Deleted ${docs.length} mock docs. Bye!`);
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
  process.exit(0);
});
