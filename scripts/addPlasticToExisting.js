const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function patchExistingDocs() {
  const snapshot = await db.collection('sensor_data').get();
  
  let updated = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    // Only patch docs that are missing the plastic fields
    if (data.microplasticIndex == null || data.plasticDensity == null) {
      batch.update(doc.ref, {
        microplasticIndex: parseFloat((Math.random() * 15).toFixed(2)),
        plasticDensity:    parseFloat((Math.random() * 8).toFixed(2))
      });
      updated++;
    }
  });

  await batch.commit();
  console.log(`✅ Patched ${updated} existing documents with plastic data`);
  process.exit(0);
}

patchExistingDocs().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
