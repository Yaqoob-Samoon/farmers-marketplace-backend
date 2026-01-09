const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes'); 
const offerRoutes = require('./routes/offerRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

// ✅ Import Mandi Routes (Make sure file exists!)
const mandiRoutes = require('./routes/mandiRoutes'); 

// Import Service
const scrapeMandiRates = require('./services/mandiScraper');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', listingRoutes); 
app.use('/api/offers', offerRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);

// ✅ Mount Mandi Routes
app.use('/api/mandi', mandiRoutes);
app.use('/api/weather', require('./routes/weatherRoutes'));

// Cron Job: 8:00 AM Daily
cron.schedule('0 8 * * *', () => {
    console.log("⏰ Cron Job Triggered: Scraper");
    scrapeMandiRates();
});

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Farmers Marketplace API is Online 🚀' });
});

module.exports = app;