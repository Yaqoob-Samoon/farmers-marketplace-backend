const listingModel = require('../models/listingModel');

// 1. Add Crop (POST)
const addCrop = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { title, quantity, unit, price_per_unit, min_price, city, description } = req.body;

    // Handle Image Logic
    let images = [];
    if (req.file) {
      images.push(req.file.path); // Cloudinary URL
    } else {
      images.push("https://res.cloudinary.com/demo/image/upload/sample.jpg"); // Fallback
    }

    // ✅ STANDARD STATUS: 'AVAILABLE'
    // This will now be correctly saved by the Model
    const newListing = await listingModel.create({
      farmerId, title, quantity, unit, 
      pricePerUnit: price_per_unit,
      minPrice: min_price || price_per_unit, 
      city, description, images,
      status: 'AVAILABLE' 
    });

    res.status(201).json({ message: 'Crop listed successfully', crop: newListing });

  } catch (error) {
    console.error("Add Crop Error:", error);
    res.status(500).json({ message: 'Server error adding crop' });
  }
};

// 2. Get All Crops (GET Marketplace)
const getAllCrops = async (req, res) => {
  try {
    const crops = await listingModel.getAllCrops();
    // ✅ Now this returns EVERYTHING (Available + Sold)
    // The Android App will check listing.status == 'SOLD' to disable the button
    res.status(200).json(crops);

  } catch (error) {
    console.error("Fetch Crops Error:", error);
    res.status(500).json({ message: 'Server error fetching market data' });
  }
};

// ... (Rest of the controller functions: getMyCrops, deleteCrop, updateCrop remain the same)
// ...
// ...

const getMyCrops = async (req, res) => {
  try {
    const farmerId = req.user.id; 
    const listings = await listingModel.getCropsByFarmer(farmerId);
    res.status(200).json(listings);
  } catch (error) {
    console.error("Fetch My Crops Error:", error);
    res.status(500).json({ message: 'Server error fetching your crops' });
  }
};

const deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    const deletedCrop = await listingModel.deleteListing(id, farmerId);
    if (!deletedCrop) {
      return res.status(404).json({ message: 'Crop not found or unauthorized' });
    }
    res.status(200).json({ message: 'Crop deleted successfully' });
  } catch (error) {
    console.error("Delete Crop Error:", error);
    res.status(500).json({ message: 'Server error deleting crop' });
  }
};

const updateCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    let images;
    if (req.file) {
        images = [req.file.path]; 
    } else {
        try {
            images = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
        } catch (e) {
            images = [];
        }
    }

    const updateData = {
      ...req.body,
      pricePerUnit: req.body.price_per_unit,
      minPrice: req.body.min_price || req.body.price_per_unit,
      images: images
    };

    const updated = await listingModel.updateListing(id, farmerId, updateData);
    if (!updated) {
        return res.status(404).json({ message: "Not found or unauthorized" });
    }
    res.status(200).json({ message: "Updated successfully", crop: updated });
  } catch (error) {
    console.error("Update Crop Error:", error);
    res.status(500).json({ message: "Server error updating crop" });
  }
};

module.exports = { addCrop, getAllCrops, getMyCrops, deleteCrop, updateCrop };