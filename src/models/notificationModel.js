// src/models/notificationModel.js
const pool = require('../config/db');

// Send a notification to a specific user
const createNotification = async (userId, message) => {
  const query = `
    INSERT INTO notifications (user_id, message)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, message]);
  return rows[0];
};

// Get all notifications for a user
const getUserNotifications = async (userId) => {
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

// Mark notifications as read
const markRead = async (userId) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
};

module.exports = { createNotification, getUserNotifications, markRead };