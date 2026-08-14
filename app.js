const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

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
});
