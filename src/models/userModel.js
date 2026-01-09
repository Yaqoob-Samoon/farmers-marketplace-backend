const pool = require('../config/db');

// Check if user exists
const findUserByPhone = async (phone) => {
  const query = 'SELECT * FROM users WHERE phone = $1';
  const { rows } = await pool.query(query, [phone]);
  return rows[0];
};

// Create User (with Profile Image URL)
const createUser = async (user) => {
  const { name, phone, passwordHash, role, province, city, profileImage } = user;
  
  const query = `
    INSERT INTO users (name, phone, password_hash, role, province, city, profile_image)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, phone, role, is_verified, profile_image, created_at;
  `;
  
  // If no image uploaded, profileImage will be null
  const values = [name, phone, passwordHash, role, province, city, profileImage || null];
  
  const { rows } = await pool.query(query, values);
  return rows[0]; 
};

module.exports = {
  findUserByPhone,
  createUser
};