const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteMockData() {
  try {
    console.log('🔍 Searching for mock data entries in Firestore...\n');
    
    const snapshot = await db.collection('waterQualityData')
      .where('isMockData', '==', true)
      .get();

    if (snapshot.empty) {
      console.log('✓ No mock data found - database is clean!');
      console.log('💧 All data in your Aqunex database is real sensor data.\n');
      process.exit(0);
    }

    console.log(`📦 Found ${snapshot.size} mock data entries`);
    console.log('🗑️  Deleting mock data...\n');

    // Batch delete for efficiency (Firestore limit: 500 operations per batch)
    const batchSize = 500;
    const batches = [];
    let batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;

      // Create new batch every 500 operations
      if (count % batchSize === 0) {
        batches.push(batch.commit());
        batch = db.batch();
        console.log(`  Processed ${count}/${snapshot.size} entries...`);
      }
    });

    // Commit remaining batch
    if (count % batchSize !== 0) {
      batches.push(batch.commit());
    }

    await Promise.all(batches);
    
    console.log('\n' + '─'.repeat(60));
    console.log(`✅ Successfully deleted ${snapshot.size} mock data entries!`);
    console.log('💧 Your Aqunex database now contains only real sensor data.');
    console.log('─'.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error deleting mock data:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

console.log('\n' + '─'.repeat(60));
console.log('🧹 AQUNEX Mock Data Cleanup Tool');
console.log('─'.repeat(60) + '\n');

deleteMockData();
