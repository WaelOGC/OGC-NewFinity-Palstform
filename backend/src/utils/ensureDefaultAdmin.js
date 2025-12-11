/**
 * Dev-only bootstrap:
 * On startup, if no admin exists, create a default FOUNDER admin user:
 *   email: admin@ogc.local
 *   password: Admin!123456
 * Runs only when NODE_ENV !== 'production'
 */

import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { ADMIN_ROLES } from '../config/rolePermissions.js';
import { getTermsVersion } from '../services/activationService.js';

/**
 * Ensures a default FOUNDER admin user exists in development
 * Only runs in non-production environments
 */
export async function ensureDefaultAdmin() {
  // Only run in non-production environments to avoid security issues
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    // 1) Check if ANY admin user already exists (role in ADMIN_ROLES)
    // Build placeholders for IN clause: (?, ?, ?)
    const placeholders = ADMIN_ROLES.map(() => '?').join(', ');
    const [adminRows] = await pool.query(
      `SELECT id, email, role FROM User WHERE role IN (${placeholders})`,
      ADMIN_ROLES
    );

    if (adminRows.length > 0) {
      console.log('[BootstrapAdmin] Admin already exists:', adminRows[0].email || adminRows[0].id);
      return;
    }

    // 2) If no admin, create a default FOUNDER user with known credentials
    const email = 'admin@ogc.local';
    const password = 'Admin!123456'; // temp dev password
    const role = 'FOUNDER';
    const fullName = 'Default Admin';
    const termsVersion = getTermsVersion();
    const now = new Date();

    console.log('[BootstrapAdmin] No admin found. Creating default FOUNDER admin:', email);

    // Use the same password hashing method as registration (bcrypt with 10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the user row into the DB using the same approach as normal users
    // Status is 'active' so they can log in immediately (no activation required)
    const [result] = await pool.query(
      `INSERT INTO User (email, password, fullName, status, role, termsAccepted, termsAcceptedAt, termsVersion, termsSource) 
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, 'bootstrap')`,
      [email, passwordHash, fullName, role, true, now, termsVersion]
    );

    console.log('[BootstrapAdmin] Default admin created:', email, '(ID:', result.insertId + ')');
    console.log('[BootstrapAdmin] Login credentials:');
    console.log('[BootstrapAdmin]   Email:', email);
    console.log('[BootstrapAdmin]   Password:', password);
  } catch (err) {
    console.error('[BootstrapAdmin] Failed to ensure default admin:', err);
    // Don't throw - we don't want to block server startup if this fails
  }
}
