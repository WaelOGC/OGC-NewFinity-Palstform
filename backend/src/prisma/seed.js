import 'dotenv/config';
import { prisma } from './client.js';
import bcrypt from 'bcryptjs';

async function main() {
  // seed admin user
  const email = 'admin@ogc.local';
  const passwordHash = await bcrypt.hash('ChangeMe!123', 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin' },
    create: { email, passwordHash, role: 'admin' }
  });

  // seed wallet
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, address: '0xADMINSEED', balance: 100000 }
  });

  console.log('Seed complete:', { admin: admin.email });
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

