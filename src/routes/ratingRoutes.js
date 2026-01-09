const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/ratings (Submit review)
router.post('/', verifyToken, ratingController.submitRating);

// GET /api/ratings/user/:userId (View reputation)
// Only add this line if you kept 'getUserStats' in your ratingController
// router.get('/user/:userId', ratingController.getUserStats);

module.exports = router;