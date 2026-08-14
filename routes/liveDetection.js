const express = require('express');
const admin = require('firebase-admin');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/live-detection', requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('detections')
      .orderBy('timestamp', 'desc')
      .limit(6)
      .get();
      
    const detections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // We pass page: "live-detection" for nav highlighting
    res.render('live-detection', {
      pageTitle: "Aqunex - Live Detection",
      page: "live-detection",
      admin: req.session.admin || null,
      detections
    });
  } catch (err) {
    console.error('Error fetching live detections:', err);
    // Graceful fallback on error, render empty list
    res.render('live-detection', {
      pageTitle: "Aqunex - Live Detection",
      page: "live-detection",
      admin: req.session.admin || null,
      detections: []
    });
  }
});

router.get('/api/detections/latest', requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('detections')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
      
    const detections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ detections });
  } catch (err) {
    console.error('Error fetching latest detection:', err);
    res.status(500).json({ error: 'Failed to fetch latest detection' });
  }
});

module.exports = router;
