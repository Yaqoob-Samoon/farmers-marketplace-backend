const pool = require('../config/db');
const Notification = require('./notificationModel'); // ✅ Import Notification Model

// Create a new offer (Buyer bids on a crop)
const createOffer = async (offerData) => {
  const { buyerId, listingId, offerAmount, offerQuantity, message } = offerData;

  const query = `
    INSERT INTO offers 
    (buyer_id, listing_id, offer_amount, offer_quantity, message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  
  const values = [buyerId, listingId, offerAmount, offerQuantity, message];
  const { rows } = await pool.query(query, values);
  const newOffer = rows[0];

  // ✅ NOTIFICATION: Alert the Farmer about the new offer
  if (newOffer) {
    try {
      // 1. Get the farmer ID and Crop Title from the listing table
      const listingRes = await pool.query(
        'SELECT farmer_id, title FROM farmer_listings WHERE id = $1', 
        [listingId]
      );
      const listing = listingRes.rows[0];

      // 2. Send the Alert
      if (listing) {
        await Notification.createNotification(
          listing.farmer_id, 
          `New Offer! Someone offered PKR ${offerAmount} for your ${listing.title}.`
        );
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  return newOffer;
};

// Get offers received by a Farmer (My Received Offers)
const getOffersForFarmer = async (farmerId) => {
  const query = `
    SELECT 
      o.*,
      u.name as buyer_name,
      u.phone as buyer_phone,
      l.title as crop_title
    FROM offers o
    JOIN farmer_listings l ON o.listing_id = l.id
    JOIN users u ON o.buyer_id = u.id
    WHERE l.farmer_id = $1  -- Only show offers for this farmer's listings
    ORDER BY o.created_at DESC;
  `;
  const { rows } = await pool.query(query, [farmerId]);
  return rows;
};

// Update Offer Status (Accept/Reject)
const updateOfferStatus = async (offerId, status) => {
  const query = `
    UPDATE offers 
    SET status = $1 
    WHERE id = $2 
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [status, offerId]);
  const updatedOffer = rows[0];

  // ✅ NOTIFICATION: If Accepted, Alert the Buyer
  if (updatedOffer && status === 'ACCEPTED') {
    try {
      // 1. Get Crop Title for the message
      const listingRes = await pool.query(
        'SELECT title FROM farmer_listings WHERE id = $1', 
        [updatedOffer.listing_id]
      );
      const cropTitle = listingRes.rows[0]?.title || "Crop";

      // 2. Send the Alert to the Buyer
      await Notification.createNotification(
        updatedOffer.buyer_id, 
        `Good News! Your offer for ${cropTitle} was ACCEPTED by the farmer.`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  return updatedOffer;
};

const getOffersByBuyer = async (buyerId) => {
  const query = `
    SELECT 
      o.*,
      l.title as crop_title,
      l.images,
      u.name as farmer_name 
    FROM offers o
    JOIN farmer_listings l ON o.listing_id = l.id
    JOIN users u ON l.farmer_id = u.id
    WHERE o.buyer_id = $1
    ORDER BY o.created_at DESC;
  `;
  const { rows } = await pool.query(query, [buyerId]);
  return rows;
};

module.exports = { createOffer, getOffersForFarmer, updateOfferStatus, getOffersByBuyer };