# Wallet API Blueprint — OGC NewFinity Platform

This document describes the Wallet API.

---

## 1. Overview

**Service name:** Wallet Service  
**Domain:** Token balances, transactions, rewards, and blockchain sync.  

---

## 2. Base Configuration

**Base URL:** /wallet  
**Auth type:** JWT  
**Version:** v1  

---

## 3. Endpoints

### 3.1 GET /wallet/balance

**Description:**  

Retrieve the user's wallet balance (off-chain + synced view).

**Requires auth:** yes  

**Response:**

- 200: balance, pendingRewards, lastSyncAt  

---

### 3.2 GET /wallet/transactions

**Description:**  

List wallet transaction history.

**Requires auth:** yes  

**Query:**

- page: number  

- limit: number  

**Response:**

- 200: list of transactions  

---

### 3.3 POST /wallet/transfer

**Description:**  

Initiate a token transfer.

**Requires auth:** yes  

**Request:**

- toAddress: string  

- amount: number  

**Response:**

- 200: transactionId, status=pending  

- 400: invalid payload  

- 402: insufficient balance  

- 500: blockchain error  

