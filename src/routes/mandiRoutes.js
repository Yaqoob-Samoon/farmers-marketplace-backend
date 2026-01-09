const express = require('express');
const router = express.Router();

// 1. Import Controller (Ensure this path is correct)
const mandiController = require('../controllers/mandiController');

// 2. Import Scraper (Ensure this path is correct)
const scrapeMandiRates = require('../services/mandiScraper'); 

// 3. Define Routes
// GET /api/mandi/
router.get('/', mandiController.getRates);

// POST /api/mandi/refresh (Manual trigger)
router.get('/refresh', async (req, res) => {
    try {
        console.log("🔄 Manual Refresh Triggered");
        await scrapeMandiRates();
        res.json({ message: "Rates updated successfully!" });
    } catch (error) {
        console.error("Refresh Error:", error);
        res.status(500).json({ message: "Scraping failed", error: error.message });
    }
});

// 4. ✅ EXPORT ROUTER (Crucial Step)
module.exports = router;