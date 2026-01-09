const db = require('../config/db');

// GET /notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT id, title, message, created_at, is_read 
             FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: "Server error fetching notifications" });
    }
};

module.exports = { getNotifications };