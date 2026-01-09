const pool = require('../config/db');

// Add a new rating
const createRating = async (ratingData) => {
  const { reviewerId, targetUserId, transactionId, ratingValue, comment } = ratingData;

  const query = `
    INSERT INTO ratings 
    (reviewer_id, target_user_id, transaction_id, rating_value, comment)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [reviewerId, targetUserId, transactionId, ratingValue, comment];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Get Average Rating for a User
const getUserAverageRating = async (userId) => {
  const query = `
    SELECT 
      COUNT(*) as total_reviews,
      ROUND(AVG(rating_value), 1) as average_rating
    FROM ratings
    WHERE target_user_id = $1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

module.exports = { createRating, getUserAverageRating };