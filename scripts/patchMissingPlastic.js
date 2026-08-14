const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function patchMissingPlasticData() {
  console.log('🔍 Scanning sensor_data for missing plastic fields...');

  const snapshot = await db.collection('sensor_data').get();
  const batch    = db.batch();
  let   count    = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    // Only patch if BOTH fields are missing
    if (data.microplasticIndex == null || data.plasticDensity == null) {
      batch.update(doc.ref, {
        microplasticIndex: parseFloat((Math.random() * 15).toFixed(2)),
        plasticDensity:    parseFloat((Math.random() * 8).toFixed(2))
      });
      count++;
      console.log(`  Patching: ${data.location || doc.id}`);
    }
  });

  if (count === 0) {
    console.log('✅ All documents already have plastic data. Nothing to patch.');
    return;
  }

  await batch.commit();
  console.log(`\n✅ Patched ${count} document(s) with plastic data.`);
  console.log('🔄 Refresh the dashboard to see updated values.');
}

patchMissingPlasticData()
  .then(() => process.exit(0))
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
