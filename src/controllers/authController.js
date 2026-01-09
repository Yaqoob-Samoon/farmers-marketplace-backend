const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const db = require('../config/db'); 
require('dotenv').config();

// 1. REGISTER (Kept Exact)
const register = async (req, res) => {
  try {
    const { name, phone, password, role, province, city } = req.body;
    const profileImage = req.file ? req.file.path : null;

    const userCheck = await userModel.findUserByPhone(phone);
    if (userCheck) {
      return res.status(400).json({ message: 'User with this phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userModel.createUser({
      name,
      phone,
      passwordHash,
      role,
      province,
      city,
      profileImage
    });

    res.status(201).json({
      message: 'Registration successful',
      user: newUser
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// 2. LOGIN (Kept Exact)
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await userModel.findUserByPhone(phone);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        is_verified: user.is_verified,
        city: user.city 
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// 3. GET PROFILE (Kept Exact)
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const query = `
      SELECT id, name, phone, role, province, city, profile_image, rating, rating_count 
      FROM users 
      WHERE id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// ✅ 4. UPDATE PROFILE (ADDED THIS)
const updateProfile = async (req, res) => {
    try {
        const { name, phone, city } = req.body;
        const userId = req.user.id; 
        
        let profileImage = null;
        if (req.file) {
            profileImage = req.file.path; 
        }

        // Build Query Dynamically
        const fields = [];
        const values = [];
        let query = "UPDATE users SET ";
        let index = 1;

        if (name) {
            fields.push(`name = $${index++}`);
            values.push(name);
        }
        if (phone) {
            fields.push(`phone = $${index++}`);
            values.push(phone);
        }
        if (city) {
            fields.push(`city = $${index++}`);
            values.push(city);
        }
        if (profileImage) {
            fields.push(`profile_image = $${index++}`);
            values.push(profileImage);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        // Removed 'email' to prevent crash since your table likely doesn't have it
        query += fields.join(", ") + ` WHERE id = $${index} RETURNING id, name, phone, role, city, profile_image`;
        values.push(userId);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error updating profile" });
    }
};

// ✅ EXPORT ALL 4 FUNCTIONS
module.exports = { register, login, getProfile, updateProfile };