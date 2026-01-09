const pool = require('../config/db');

// 1. Create a new listing
const create = async (listingData) => {
  const { farmerId, title, quantity, unit, pricePerUnit, minPrice, city, description, images, status } = listingData;
  
  const query = `
    INSERT INTO farmer_listings 
    (farmer_id, title, quantity, unit, price_per_unit, min_price, city, description, images, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const finalStatus = status || 'AVAILABLE';
  const values = [farmerId, title, quantity, unit, pricePerUnit, minPrice, city, description, images, finalStatus];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// 2. Get All Crops (Marketplace)
const getAllCrops = async () => {
  const query = `
    SELECT 
      l.*, 
      u.name as farmer_name, 
      u.profile_image as farmer_image, 
      u.is_verified, 
      u.avg_rating 
    FROM farmer_listings l
    JOIN users u ON l.farmer_id = u.id
    ORDER BY l.created_at DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// 3. Get Crops by Farmer (My Farm)
const getCropsByFarmer = async (farmerId) => {
  // ✅ JOIN ensures "Unknown Farmer" is fixed
  const query = `
    SELECT 
      l.*, 
      u.name as farmer_name, 
      u.profile_image as farmer_image 
    FROM farmer_listings l
    JOIN users u ON l.farmer_id = u.id
    WHERE l.farmer_id = $1
    ORDER BY l.created_at DESC;
  `;
  const { rows } = await pool.query(query, [farmerId]);
  return rows;
};

// 4. Delete Listing (✅ PROFESSIONAL: Simplified)
const deleteListing = async (id, farmerId) => {
  // Since you ran the SQL commands, the Database will automatically
  // delete all related Offers, Transactions, and Ratings for us!
  const query = `
    DELETE FROM farmer_listings 
    WHERE id = $1 AND farmer_id = $2 
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id, farmerId]);
  return rows[0];
};

// 5. Update Listing
const updateListing = async (id, farmerId, data) => {
  const { title, quantity, unit, pricePerUnit, minPrice, city, description, images } = data;
  
  const query = `
    UPDATE farmer_listings 
    SET title=$1, quantity=$2, unit=$3, price_per_unit=$4, min_price=$5, city=$6, description=$7, images=$8
    WHERE id=$9 AND farmer_id=$10
    RETURNING *;
  `;
  
  const values = [title, quantity, unit, pricePerUnit, minPrice, city, description, images, id, farmerId];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = { create, getAllCrops, getCropsByFarmer, deleteListing, updateListing };