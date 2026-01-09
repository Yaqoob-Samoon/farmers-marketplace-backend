const { Pool } = require('pg');
require('dotenv').config();

// Create the connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { 
        rejectUnauthorized: false // Required for Neon Cloud
    },
    max: 20, // Max clients
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // ✅ CHANGED: Wait 10 seconds before failing (was 2s)
});

// ✅ SAFETY NET: Catch background errors so the app doesn't crash
pool.on('error', (err, client) => {
    console.error('⚠️ Unexpected database error (client idle):', err.message);
    // Do not exit the process. The pool will recover.
});

// Test Connection on Startup
pool.connect()
    .then(client => {
        console.log('✅ Connected to Neon PostgreSQL Database');
        client.release(); // Release the client back to the pool
    })
    .catch(err => {
        console.error('❌ Database Connection Failed:', err.message);
        console.error('👉 Hint: Check your internet connection or .env DATABASE_URL');
    });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool ,
  end: () => pool.end()
};