const admin = require('firebase-admin');
const { getRandomLocation, addGPSVariation, getRandomValue } = require('./locations');
require('dotenv').config({ path: '../.env' });

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://aquex-871b9-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = admin.firestore();

function generateMockData() {
  const location = getRandomLocation();
  const variedGPS = addGPSVariation(location.lat, location.lng, 5);

  return {
    chlorophyll: getRandomValue(5, 150, 1),
    district: location.district,
    gps: {
      lat: variedGPS.lat,
      lng: variedGPS.lng
    },
    location: location.name,
    ph: getRandomValue(6.5, 8.5, 1),
    state: location.state,
    temperature: getRandomValue(18, 32, 1),
    timestamp: admin.firestore.Timestamp.now(),
    turbidity: Math.floor(getRandomValue(5, 50, 0)),
    isMockData: true
  };
}

async function addMockData() {
  try {
    const mockData = generateMockData();

    const docRef = await db.collection('sensor_data').add(mockData);

    console.log(`✓ [${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}] Mock data added`);
    console.log(`  ID: ${docRef.id}`);
    console.log(`  Location: ${mockData.location} (${mockData.district})`);
    console.log(`  GPS: ${mockData.gps.lat}, ${mockData.gps.lng}`);
    console.log(`  pH: ${mockData.ph} | Temp: ${mockData.temperature}°C | Turbidity: ${mockData.turbidity}`);
    console.log(`  Chlorophyll: ${mockData.chlorophyll} µg/L\n`);
  } catch (error) {
    console.error('❌ Error adding mock data:', error.message);
  }
}

function generateRtdbMockData() {
  const tempBase = 24.12;
  const temp = parseFloat((tempBase + (Math.random() * 2 - 1)).toFixed(2));
  
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  return {
    chlorophyll: "Absent",
    district: "Coimbatore",
    gps: "11.021970,77.034560",
    location: "Sri Ramakrishna College of Arts And Science",
    ph: 10,
    state: "Tamil Nadu",
    temperature: temp,
    timestamp: timestamp,
    turbidity: "CLEAN",
    isMockData: true
  };
}

async function addRtdbMockData() {
  try {
    const mockData = generateRtdbMockData();
    const rtdb = admin.database();
    const newRef = rtdb.ref().push();
    await newRef.set(mockData);
    
    console.log(`✓ [${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}] RTDB Mock data added`);
    console.log(`  ID: ${newRef.key}`);
    console.log(`  Location: ${mockData.location}`);
    console.log(`  Temp: ${mockData.temperature}°C\n`);
  } catch (error) {
    console.error('❌ Error adding RTDB mock data:', error.message);
  }
}

async function deleteRtdbMockData() {
  try {
    console.log('🔍 Searching for RTDB mock data...');
    const rtdb = admin.database();
    const ref = rtdb.ref();
    const snap = await ref.once('value');
    const data = snap.val();
    
    if (!data) {
      console.log('✓ No RTDB data found.');
      process.exit(0);
    }
    
    let deletedCount = 0;
    for (const [key, value] of Object.entries(data)) {
      if (value.isMockData === true && value.location === "Sri Ramakrishna College of Arts And Science") {
        await rtdb.ref(key).remove();
        deletedCount++;
      }
    }
    console.log(`✅ Successfully deleted ${deletedCount} RTDB mock entries!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting RTDB mock data:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n' + '─'.repeat(60));
  console.log('🛑 Mock data generator stopped');
  console.log('✓ Total runtime: ' + Math.floor(process.uptime()) + ' seconds');
  process.exit(0);
});

const isRtdb = process.argv.includes('--rtdb');
const isDeleteRtdb = process.argv.includes('--delete-rtdb');

if (isDeleteRtdb) {
  deleteRtdbMockData();
} else if (isRtdb) {
  console.log('🚀 AQUNEX RTDB Mock Data Generator Started');
  console.log('📊 Adding RTDB data every 7 seconds...');
  addRtdbMockData();
  setInterval(addRtdbMockData, 7000);
} else {
  // Start the generator
  console.log('🚀 AQUNEX Mock Data Generator Started');
  console.log('📊 Adding random water quality data every 10 seconds...');
  console.log('🌍 GPS variation: ±5km radius per location');
  console.log('📍 Total locations: 15 lakes across India');
  console.log('⏰ Time: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('Press Ctrl+C to stop\n');
  console.log('─'.repeat(60) + '\n');

  // Add first entry immediately
  addMockData();

  // Then continue every 10 seconds
  setInterval(addMockData, 10000);
}
