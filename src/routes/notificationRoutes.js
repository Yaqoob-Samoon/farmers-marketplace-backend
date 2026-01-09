const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Use your DB config
const { verifyToken } = require('../middleware/authMiddleware');

// 1. GET ALL NOTIFICATIONS
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', 
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. ✅ NEW: MARK AS READ (Clears the Red Badge)
router.put('/mark-read', verifyToken, async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
            [req.user.id]
        );
        res.json({ message: "Marked as read" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;