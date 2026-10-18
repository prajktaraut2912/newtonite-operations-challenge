
const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Configure it in your environment."
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
  console.error("Unexpected idle database connection error:", error);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  closeDatabase
};
