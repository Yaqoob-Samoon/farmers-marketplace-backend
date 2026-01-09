const transactionModel = require('../models/transactionModel');
const db = require('../config/db'); // Imports the pool object

// 1. Get My Orders (Buyer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await transactionModel.getTransactionsByBuyer(req.user.id);
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// 2. Get My Sales (Farmer)
const getMySales = async (req, res) => {
  try {
    const sales = await transactionModel.getTransactionsBySeller(req.user.id);
    res.status(200).json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching sales" });
  }
};

// 3. Update Status (Mark as Dispatched/Completed)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    const updated = await transactionModel.updateStatus(req.params.id, status);
    res.status(200).json({ message: "Status updated", transaction: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// ✅ 4. PROFESSIONAL DIRECT BUY
const directBuy = async (req, res) => {
  const client = await db.pool.connect(); 
  try {
    await client.query('BEGIN'); // Start Transaction

    const buyerId = req.user.id;
    const { listing_id, price, quantity, payment_mode } = req.body;

    // A. Lock Listing & Get Details (Stock + Farmer Phone/Name)
    const listingRes = await client.query(
        `SELECT l.farmer_id, l.quantity, l.title, u.phone as farmer_phone, u.name as farmer_name 
         FROM farmer_listings l 
         JOIN users u ON l.farmer_id = u.id 
         WHERE l.id = $1 FOR UPDATE`, 
        [listing_id]
    );

    if (listingRes.rows.length === 0) throw new Error('Listing not found');
    
    const { farmer_id, quantity: currentStock, title, farmer_phone, farmer_name } = listingRes.rows[0];

    if (buyerId === farmer_id) throw new Error('Cannot buy your own crop');
    
    // B. Validation
    if (currentStock < quantity) {
        throw new Error(`Not enough stock! Only ${currentStock} available.`);
    }

    // C. Deduct Stock
    const newStock = currentStock - quantity;
    await client.query(
        'UPDATE farmer_listings SET quantity = $1 WHERE id = $2',
        [newStock, listing_id]
    );

    // D. Create Offer (Record Payment Mode)
    const offerMsg = `Direct Buy via ${payment_mode || 'Cash'}`;
    const offerQuery = `
      INSERT INTO offers (buyer_id, listing_id, offer_amount, offer_quantity, status, message)
      VALUES ($1, $2, $3, $4, 'accepted', $5)
      RETURNING id;
    `;
    const offerRes = await client.query(offerQuery, [buyerId, listing_id, price, quantity, offerMsg]);
    const offerId = offerRes.rows[0].id;

    // E. Create Transaction
    const transQuery = `
      INSERT INTO transactions (offer_id, buyer_id, seller_id, final_amount, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *;
    `;
    const transRes = await client.query(transQuery, [offerId, buyerId, farmer_id, price]);

    // F. ✅ NOTIFY FARMER (Fixed SQL to match your Table)
    // We combined the "Title" into the message because your table only has 'message'
    const notifMessage = `🎉 New Order! ${quantity} ${title} sold for PKR ${price} via ${payment_mode || 'Cash'}. Check 'My Sales'.`;
    
    await client.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [farmer_id, notifMessage]
    );

    await client.query('COMMIT');
    
    // ✅ RETURN FARMER DETAILS (For the App's "Call Now" Dialog)
    res.status(201).json({ 
        message: "Purchase Successful!", 
        order: transRes.rows[0],
        farmer: { 
            name: farmer_name, 
            phone: farmer_phone 
        }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Direct Buy Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ✅ 5. UPDATE TRANSACTION & MARK CROP AS SOLD
const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params; // Transaction ID
        const { status } = req.body; 

        // 1. Update Transaction
        const result = await db.query(
            "UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const transaction = result.rows[0];

        // ✅ 2. FIND THE LISTING ID
        let listingId = transaction.listing_id;

        if (!listingId && transaction.offer_id) {
            // Fetch listing_id from the linked offer
            const offerRes = await db.query("SELECT listing_id FROM offers WHERE id = $1", [transaction.offer_id]);
            if (offerRes.rows.length > 0) {
                listingId = offerRes.rows[0].listing_id;
            }
        }

        // ✅ 3. MARK CROP AS SOLD
        if (status === 'COMPLETED' || status === 'DISPATCHED') {
            if (listingId) {
                console.log(`🔒 Locking Listing ${listingId} as SOLD`);
                await db.query(
                    "UPDATE farmer_listings SET status = 'SOLD' WHERE id = $1",
                    [listingId]
                );
            } else {
                console.error("❌ ERROR: Could not find listing ID for transaction", id);
            }
        }

        // Optional: Make available again if cancelled
        if (status === 'CANCELLED' && listingId) {
             await db.query(
                "UPDATE farmer_listings SET status = 'AVAILABLE' WHERE id = $1",
                [listingId]
            );
        }

        res.status(200).json({ 
            message: "Order status updated successfully", 
            transaction: transaction 
        });

    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { 
  getMyOrders, 
  getMySales, 
  updateStatus, 
  directBuy,
  updateTransactionStatus 
};