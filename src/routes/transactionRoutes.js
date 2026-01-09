const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Buyer sees their purchases
router.get('/my-orders', verifyToken, authorizeRoles('buyer'), transactionController.getMyOrders);

// Farmer sees their sales
router.get('/my-sales', verifyToken, authorizeRoles('farmer'), transactionController.getMySales);

// Update Status (Only Farmer can mark as Dispatched/Completed)
router.put('/:id/status', verifyToken, transactionController.updateTransactionStatus);

// Direct Buy Route (Buy Now)
router.post('/buy-now', verifyToken, authorizeRoles('buyer'), transactionController.directBuy);

module.exports = router;