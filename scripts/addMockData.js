const admin = require('firebase-admin');
const { getRandomLocation, addGPSVariation, getRandomValue } = require('./locations');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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
    microplasticIndex: parseFloat((Math.random() * 15).toFixed(2)),
    plasticDensity: parseFloat((Math.random() * 8).toFixed(2)),
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
    console.log(`  Chlorophyll: ${mockData.chlorophyll} µg/L`);
    console.log(`  Microplastic Index: ${mockData.microplasticIndex} µg/L | Plastic Density: ${mockData.plasticDensity} /m²\n`);
  } catch (error) {
    console.error('❌ Error adding mock data:', error.message);
  }
}

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

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n' + '─'.repeat(60));
  console.log('🛑 Mock data generator stopped');
  console.log('✓ Total runtime: ' + Math.floor(process.uptime()) + ' seconds');
  process.exit(0);
});
