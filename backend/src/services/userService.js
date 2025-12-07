import pool from "../db.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function getAllUsers() {
  const [rows] = await pool.query(
    "SELECT id, email, fullName, createdAt, updatedAt FROM User ORDER BY id DESC"
  );
  return rows;
}

export async function getUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, email, fullName, createdAt, updatedAt FROM User WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ email, password, fullName }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.query(
    "INSERT INTO User (email, password, fullName) VALUES (?, ?, ?)",
    [email, passwordHash, fullName || null]
  );
  return {
    id: result.insertId,
    email,
    fullName: fullName || null,
  };
}

export async function deleteUser(id) {
  const [result] = await pool.query("DELETE FROM User WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function verifyUserCredentials(email, password) {
  const [rows] = await pool.query(
    "SELECT id, email, password, fullName FROM User WHERE email = ?",
    [email]
  );
  const user = rows[0];
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  };
}
