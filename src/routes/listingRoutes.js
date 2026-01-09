const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController'); 
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 1. Get All Crops (Public Marketplace)
// URL: GET /api/crops/
router.get('/', listingController.getAllCrops);

// 2. Get Logged-in Farmer's Crops (Protected)
// URL: GET /api/crops/my-crops
router.get(
  '/my-crops', 
  verifyToken, 
  authorizeRoles('farmer'), 
  listingController.getMyCrops
);

// 3. Add New Crop (Protected)
// URL: POST /api/crops/
router.post(
  '/', 
  verifyToken, 
  authorizeRoles('farmer'), 
  upload.single('image'), 
  listingController.addCrop
);

// 4. Update Crop (Protected)
// URL: PUT /api/crops/:id
router.put(
  '/:id', 
  verifyToken, 
  authorizeRoles('farmer'), 
  upload.single('image'), 
  listingController.updateCrop
);

// 5. Delete Crop (Protected)
// URL: DELETE /api/crops/:id
router.delete(
  '/:id', 
  verifyToken, 
  authorizeRoles('farmer'), 
  listingController.deleteCrop
);

module.exports = router;