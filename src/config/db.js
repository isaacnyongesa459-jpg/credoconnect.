

"use strict";

const { Pool } = require("pg");

// ======================================================
// CREDOCONNECT - NEON POSTGRESQL DATABASE CONNECTION
// ======================================================

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

// ======================================================
// DATABASE QUERY FUNCTION
// ======================================================

async function query(text, params = []) {
  if (!pool) {
    throw new Error(
      "DATABASE_URL is missing. Configure it in your backend environment."
    );
  }

  return pool.query(text, params);
}

// ======================================================
// TEST DATABASE CONNECTION
// ======================================================

async function testDatabaseConnection() {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const result = await pool.query(`
    SELECT
      NOW() AS server_time,
      current_database() AS database_name
  `);

  return result.rows[0];
}

// ======================================================
// DATABASE ERROR HANDLING
// ======================================================

if (pool) {
  pool.on("error", (error) => {
    console.error(
      "Unexpected PostgreSQL connection error:",
      error.message
    );
  });
}

// ======================================================
// EXPORT DATABASE FUNCTIONS
// ======================================================

module.exports = {
  query,
  pool,
  testDatabaseConnection
};
