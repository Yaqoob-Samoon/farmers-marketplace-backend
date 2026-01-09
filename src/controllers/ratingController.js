const db = require('../config/db');

// 1. Submit a Rating
const submitRating = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { transaction_id, farmer_id, rating, review } = req.body;
        const buyer_id = req.user.id;

        // ✅ FIXED QUERY: Join 'transactions' with 'offers' to get the listing_id
        // The previous error happened because 'listing_id' is not directly in the 'transactions' table.
        const check = await client.query(
            `SELECT t.id, o.listing_id 
             FROM transactions t 
             JOIN offers o ON t.offer_id = o.id 
             WHERE t.id = $1 AND t.buyer_id = $2 AND t.seller_id = $3`,
            [transaction_id, buyer_id, farmer_id]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ message: "You can only rate verified purchases." });
        }

        const listingId = check.rows[0].listing_id; // Now this will work!

        // B. Insert Rating
        await client.query(
            `INSERT INTO ratings (transaction_id, buyer_id, farmer_id, rating, review)
             VALUES ($1, $2, $3, $4, $5)`,
            [transaction_id, buyer_id, farmer_id, rating, review]
        );

        // C. Update Farmer's Average Rating
        await client.query(`
            UPDATE users 
            SET rating = (SELECT AVG(rating) FROM ratings WHERE farmer_id = $1),
                rating_count = (SELECT COUNT(*) FROM ratings WHERE farmer_id = $1)
            WHERE id = $1
        `, [farmer_id]);

        // D. AUTO-COMPLETE ORDER & MARK CROP SOLD
        await client.query(
            "UPDATE transactions SET status = 'COMPLETED' WHERE id = $1",
            [transaction_id]
        );

        // Mark Listing as SOLD
        if (listingId) {
            await client.query(
                "UPDATE farmer_listings SET status = 'SOLD' WHERE id = $1",
                [listingId]
            );
        }

        res.status(201).json({ message: "Rating submitted & Order Completed!" });

    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ message: "You have already rated this order." });
        }
        console.error("Submit Rating Error:", error);
        res.status(500).json({ message: "Error submitting rating" });
    } finally {
        client.release();
    }
};

module.exports = { submitRating };