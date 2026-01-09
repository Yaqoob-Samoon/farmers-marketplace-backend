require('dotenv').config(); // Load env vars immediately
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start the Server
app.listen(PORT, () => {
  console.log(`
  ################################################
  🚀 Server listening on port: ${PORT}
  ################################################
  `);
});

// Handle graceful shutdown (Close DB connection when server stops)
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await pool.end();
  process.exit(0);
});