
import { prisma } from '../prisma/client.js';

export async function getSummary(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { balance: '0', staked: '0', rewards: '0', address: null };
  const { balance, staked, rewards, address, updatedAt } = wallet;
  return { balance: balance.toString(), staked: staked.toString(), rewards: rewards.toString(), address, updatedAt };
}

export async function listTx(userId, query) {
  const { page = 1, pageSize = 20, type, status } = query;
  const where = { userId, ...(type ? { type } : {}), ...(status ? { status } : {}) };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: Number(pageSize)
    }),
    prisma.transaction.count({ where })
  ]);
  return { items, total, page: Number(page), pageSize: Number(pageSize) };
}

export async function rewards(userId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return { rewards: wallet ? wallet.rewards.toString() : '0' };
}

export async function transfer(userId, { to, amount }) {
  // placeholder: validate & record pending tx
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error('Wallet not found');
  // simple balance check (no decimals logic here)
  if (Number(wallet.balance) < Number(amount)) throw new Error('Insufficient balance');

  const tx = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId,
      type: 'transfer',
      token: 'OGC',
      amount,
      status: 'pending'
    }
  });
  return { txId: tx.id, status: tx.status };
}

export async function stake(userId, amount) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error('Wallet not found');
  // naive update for scaffold
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: wallet.balance - amount, staked: wallet.staked + amount }
  });
  return { success: true };
}

export async function unstake(userId, amount) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error('Wallet not found');
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: wallet.balance + amount, staked: wallet.staked - amount }
  });
  return { success: true };
}

export async function createDemoTransactions(userId) {
  // Find or create wallet
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      address: `0x${userId.toString(16).padStart(40, '0')}`,
      balance: 0,
      staked: 0,
      rewards: 0
    }
  });

  // Define demo transactions
  const demoTransactions = [
    { type: 'DEPOSIT', amount: 5000, status: 'CONFIRMED' },
    { type: 'REWARD', amount: 250, status: 'CONFIRMED' },
    { type: 'TRANSFER_OUT', amount: 1000, status: 'CONFIRMED' },
    { type: 'DEPOSIT', amount: 2000, status: 'CONFIRMED' },
    { type: 'REWARD', amount: 150, status: 'CONFIRMED' }
  ];

  // Calculate balance and rewards changes
  let balanceDelta = 0;
  let rewardsDelta = 0;

  for (const tx of demoTransactions) {
    if (tx.type === 'DEPOSIT') {
      balanceDelta += tx.amount;
    } else if (tx.type === 'REWARD') {
      rewardsDelta += tx.amount;
    } else if (tx.type === 'TRANSFER_OUT') {
      balanceDelta -= tx.amount;
    }
  }

  // Create transactions and update wallet in a transaction
  const result = await prisma.$transaction(async (prismaTx) => {
    const created = await Promise.all(
      demoTransactions.map((demo) =>
        prismaTx.transaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: demo.type,
            token: 'OGC',
            amount: demo.amount,
            status: demo.status,
            txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
            chainId: 137
          }
        })
      )
    );

    // Update wallet balance and rewards
    await prismaTx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + balanceDelta,
        rewards: wallet.rewards + rewardsDelta
      }
    });

    return created;
  });

  return { ok: true, inserted: result.length };
}

