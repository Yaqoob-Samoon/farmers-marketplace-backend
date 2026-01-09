const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// 1. Send an offer (Buyers Only)
// URL: POST /api/offers
router.post(
  '/', 
  verifyToken, 
  authorizeRoles('buyer'), 
  offerController.sendOffer
);

// 2. Farmer: Get Received Offers
// URL: GET /api/offers/received
router.get(
  '/received', 
  verifyToken, 
  authorizeRoles('farmer'), 
  offerController.getMyReceivedOffers
);

// 3. ✅ NEW: Buyer: Get Sent Offers (My Bids)
// URL: GET /api/offers/sent
router.get(
  '/sent', 
  verifyToken, 
  authorizeRoles('buyer'), 
  offerController.getMySentOffers 
);

// 4. Farmer: Accept/Reject Offer
// URL: PUT /api/offers/:id/status
router.put(
  '/:id/status',
  verifyToken, 
  authorizeRoles('farmer'), 
  offerController.respondToOffer
);

module.exports = router;