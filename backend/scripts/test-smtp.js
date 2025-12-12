#!/usr/bin/env node
import 'dotenv/config';
import { initEmailService, sendEmail } from '../src/services/emailService.js';

async function main() {
  console.log("=== SMTP TEST ===");

  const init = initEmailService();
  console.log("Email Mode:", init.mode);

  try {
    await sendEmail({
      to: process.env.TEST_EMAIL || "test@example.com",
      subject: "SMTP Test",
      text: "This is a test email from OGC NewFinity.",
      html: "<p>This is a <strong>test email</strong> from OGC NewFinity.</p>",
    });

    console.log("✅ Email test completed (check console or your inbox)");
  } catch (err) {
    console.error("❌ SMTP test failed:", err.message);
    process.exit(1);
  }
}

main();
