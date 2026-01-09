const db = require('../config/db');

const getRates = async (req, res) => {
    try {
        const { category } = req.query; 

        // Debugging: See what the app is sending
        console.log("Filtering by Category:", category);

        let query = 'SELECT * FROM mandi_rates';
        let params = [];

        if (category && category !== 'All') {
            // ✅ FIX: Use ILIKE for case-insensitive matching (Vegetables == vegetables)
            // AND ensure we don't return null categories
            query += ' WHERE category ILIKE $1';
            params.push(category.trim()); // Trim spaces just in case
        }

        query += ' ORDER BY crop_name ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Mandi Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getRates };