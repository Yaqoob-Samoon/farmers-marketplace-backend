const offerModel = require('../models/offerModel');
const pool = require('../config/db'); 

// 1. Send Offer (Buyer)
const sendOffer = async (req, res) => {
  try {
    const buyerId = req.user.id;
    // Android sends these keys:
    const { listing_id, offer_amount, offer_quantity, message } = req.body;

    // Validate Input
    if (!listing_id || !offer_amount) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate Listing exists
    const listingCheck = await pool.query('SELECT farmer_id FROM farmer_listings WHERE id = $1', [listing_id]);
    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const farmerId = listingCheck.rows[0].farmer_id;
    if (buyerId === farmerId) {
      return res.status(400).json({ message: 'You cannot bid on your own crop' });
    }

    const newOffer = await offerModel.createOffer({
      buyerId,
      listingId: listing_id,
      offerAmount: offer_amount,
      offerQuantity: offer_quantity || 0, // Handle missing quantity safely
      message
    });

    res.status(201).json({ message: 'Offer sent!', offer: newOffer });

  } catch (error) {
    console.error("Send Offer Error:", error);
    res.status(500).json({ message: 'Server error sending offer' });
  }
};

// 2. Get Received Offers (Farmer)
const getMyReceivedOffers = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const offers = await offerModel.getOffersForFarmer(farmerId);
    res.status(200).json(offers);
  } catch (error) {
    console.error("Get Offers Error:", error);
    res.status(500).json({ message: 'Server error fetching offers' });
  }
};

const getMySentOffers = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const offers = await offerModel.getOffersByBuyer(buyerId);
    res.status(200).json(offers);
  } catch (error) {
    console.error("Get Sent Offers Error:", error);
    res.status(500).json({ message: 'Server error fetching your bids' });
  }
};

// 3. Accept/Reject Offer (Farmer) - ✅ FIXED CRASH HERE


const respondToOffer = async (req, res) => {
  try {
    const { id } = req.params; 
    let { status } = req.body; 
    status = status.toLowerCase(); 

    const updatedOffer = await offerModel.updateOfferStatus(id, status);
    
    // Get Offer Details to notify the right person
    const offerDetails = await pool.query("SELECT * FROM offers WHERE id = $1", [id]);
    const offer = offerDetails.rows[0];

    if (status === 'accepted') {
      // 1. Create Transaction
      await pool.query(
        `INSERT INTO transactions (offer_id, buyer_id, seller_id, final_amount, status) 
         SELECT id, buyer_id, (SELECT farmer_id FROM farmer_listings WHERE id = listing_id), offer_amount, 'PENDING' 
         FROM offers WHERE id = $1`,
        [id]
      );

      // ✅ 2. NOTIFY THE BUYER
      const notifTitle = "✅ Bid Accepted!";
      const notifMessage = `Your bid of PKR ${offer.offer_amount} has been accepted! Go to 'Orders' to view details.`;
      
      await pool.query(
        "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
        [offer.buyer_id, notifTitle, notifMessage]
      );
    } 
    else if (status === 'rejected') {
        // Optional: Notify Buyer of rejection
        await pool.query(
            "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
            [offer.buyer_id, "❌ Bid Rejected", `The farmer rejected your bid of PKR ${offer.offer_amount}.`]
        );
    }

    res.status(200).json({ message: `Offer ${status}`, offer: updatedOffer });

  } catch (error) {
    console.error("Respond Offer Error:", error);
    res.status(500).json({ message: 'Server error updating offer' });
  }
};

module.exports = { sendOffer, getMyReceivedOffers, respondToOffer, getMySentOffers };