import pool from "../db.js";

export async function checkDatabaseConnection() {
  const [rows] = await pool.query("SELECT 1 AS ok;");
  return rows && rows[0] ? rows[0] : null;
}
