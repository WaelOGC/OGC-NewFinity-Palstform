import pool from "./db.js";

async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok;");
    console.log("✅ DB connection OK:", rows);
  } catch (error) {
    console.error("❌ DB connection FAILED:", error);
  } finally {
    process.exit();
  }
}

testConnection();
