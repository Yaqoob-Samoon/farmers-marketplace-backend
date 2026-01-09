const db = require('../config/db');

// 1. Get All Orders for a Buyer (My Purchases)
const getTransactionsByBuyer = async (buyerId) => {
    // ✅ ADDED: t.seller_id so the app knows who to rate
    const query = `
        SELECT 
            t.id, 
            t.seller_id,                   -- ✅ CRITICAL FIX
            t.final_amount,
            t.status, 
            t.created_at,
            l.title as crop_title,
            u.name as other_party_name,
            u.phone as other_party_phone,
            l.images 
        FROM transactions t
        JOIN offers o ON t.offer_id = o.id
        JOIN farmer_listings l ON o.listing_id = l.id
        JOIN users u ON t.seller_id = u.id
        WHERE t.buyer_id = $1
        ORDER BY t.created_at DESC;
    `;
    const result = await db.query(query, [buyerId]);
    return result.rows;
};

// 2. Get All Sales for a Farmer (My Sales)
const getTransactionsBySeller = async (sellerId) => {
    // ✅ ADDED: t.buyer_id (Good for future use)
    const query = `
        SELECT 
            t.id, 
            t.buyer_id,                    -- ✅ Good practice to add this too
            t.final_amount,
            t.status, 
            t.created_at,
            l.title as crop_title,
            u.name as other_party_name,
            u.phone as other_party_phone,
            l.images
        FROM transactions t
        JOIN offers o ON t.offer_id = o.id
        JOIN farmer_listings l ON o.listing_id = l.id
        JOIN users u ON t.buyer_id = u.id
        WHERE t.seller_id = $1
        ORDER BY t.created_at DESC;
    `;
    const result = await db.query(query, [sellerId]);
    return result.rows;
};

// 3. Update Transaction Status
const updateStatus = async (transactionId, status) => {
    const query = `
        UPDATE transactions 
        SET status = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const result = await db.query(query, [status, transactionId]);
    return result.rows[0];
};

module.exports = {
    getTransactionsByBuyer,
    getTransactionsBySeller,
    updateStatus
};