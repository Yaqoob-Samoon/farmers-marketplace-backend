const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Public route (no token needed for weather, strictly speaking, but you can add verifyToken if you want)
router.get('/', weatherController.getWeather);

module.exports = router;