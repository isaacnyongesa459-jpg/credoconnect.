
"use strict";

const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

async function query(text, params = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is missing.");
  }

  return pool.query(text, params);
}

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

if (pool) {
  pool.on("error", (error) => {
    console.error("PostgreSQL connection error:", error.message);
  });
}

module.exports = {
  query,
  pool,
  testDatabaseConnection
};
