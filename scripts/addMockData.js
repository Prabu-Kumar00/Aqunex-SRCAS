const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Random data generators
function getRandomValue(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomLocation() {
  const locations = [
  {
  "name": "East Kolkata Wetlands",
  "district": "South 24 Parganas",
  "state": "West Bengal",
  "lat": 22.5167,
  "lng": 88.4000
    }
{
    name: "Kankaria Lake",
    district: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0060,
    lng: 72.6011
  },
  {
    name: "Hussain Sagar Lake",
    district: "Hyderabad",
    state: "Telangana",
    lat: 17.4239,
    lng: 78.4738
  },
  {
    name: "Vembanad Lake",
    district: "Alappuzha",
    state: "Kerala",
    lat: 9.6200,
    lng: 76.4300
  },
  {
    name: "Powai Lake",
    district: "Mumbai",
    state: "Maharashtra",
    lat: 19.1233,
    lng: 72.9057
  },
  {
    name: "Dal Lake",
    district: "Srinagar",
    state: "Jammu and Kashmir",
    lat: 34.1100,
    lng: 74.8600
  }
];

  return locations[Math.floor(Math.random() * locations.length)];
}

function generateMockData() {
  const location = getRandomLocation();
  
  return {
    chlorophyll: getRandomValue(5, 150, 1),
    district: location.district,
    gps: {
      lat: location.lat,
      lng: location.lng
    },
    location: location.name,
    ph: getRandomValue(6.5, 8.5, 1),
    state: location.state,
    temperature: getRandomValue(18, 32, 1),
    timestamp: admin.firestore.Timestamp.now(),
    turbidity: Math.floor(getRandomValue(5, 50, 0)),
    
    // Flag to identify mock data for cleanup
    isMockData: true
  };
}

async function addMockData() {
  try {
    const mockData = generateMockData();
    
    // Add to Firestore (it will auto-generate document ID)
    const docRef = await db.collection('waterQualityData').add(mockData);
    
    console.log(`✓ [${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}] Mock data added`);
    console.log(`  ID: ${docRef.id}`);
    console.log(`  Location: ${mockData.location} (${mockData.district})`);
    console.log(`  pH: ${mockData.ph} | Temp: ${mockData.temperature}°C | Turbidity: ${mockData.turbidity}`);
    console.log(`  Chlorophyll: ${mockData.chlorophyll}\n`);
  } catch (error) {
    console.error('❌ Error adding mock data:', error.message);
  }
}

// Start the generator
console.log('🚀 AQUNEX Mock Data Generator Started');
console.log('📊 Adding random water quality data every 10 seconds...');
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
