const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Run full schema
    const { createTables } = require('./schema');
    await createTables();

  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };