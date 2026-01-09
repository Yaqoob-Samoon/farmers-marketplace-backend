const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware'); 

// Existing Routes
router.post('/register', upload.single('profile_image'), authController.register);
router.post('/login', authController.login);
router.get('/profile', verifyToken, authController.getProfile);

// ✅ ADDED THIS NEW ROUTE
router.put(
  '/profile', 
  verifyToken, 
  upload.single('profile_image'), 
  authController.updateProfile 
);

module.exports = router;