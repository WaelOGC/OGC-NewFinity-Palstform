# OGC NewFinity — Wallet API Contract (v1.0)



## 1. Introduction

The Wallet API Contract defines all backend endpoints responsible for wallet balance retrieval, blockchain sync, mining history, rewards, and transaction management.



This API integrates:

- On-chain OGCFinity (Polygon)  

- Off-chain wallet logic  

- Reward system  

- Contribution-Based Mining engine  

- Admin transaction tools  



This is the official backend contract for the Wallet Dashboard.



---



# 2. Base Path & Versioning



All wallet endpoints follow:



/api/v1/wallet/*



yaml

Copy code



Responses are always **JSON**.



---



# 3. Core Concepts



### **On-chain Balance**

Actual OGCFinity stored on Polygon.



### **Off-chain Balance**

Platform-tracked balance including:

- Rewards  

- Mining conversions  

- Admin adjustments  



Both together represent the user's total earnings.



### **Transaction Types**

- reward  

- mining  

- deposit  

- withdrawal (future)  

- admin_adjust  



---



# 4. Endpoints



---



## 4.1 GET `/wallet`

### Description

Fetches the full wallet overview for the authenticated user.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Success Response

```json
{
  "success": true,
  "wallet": {
    "onchain_balance": "string",
    "offchain_balance": "string",
    "total_balance": "string",
    "pending_rewards": "string",
    "last_synced": "ISO"
  }
}
```



---



## 4.2 GET `/wallet/transactions`

### Description

Fetches paginated transaction history.



### Query Parameters

- `page` (optional)

- `limit` (optional)

- `type` (optional filter)



### Success Response

{

"success": true,

"transactions": [

{

"id": "string",

"type": "reward|mining|deposit|withdrawal|admin_adjust",

"amount": "string",

"source": "on_chain | off_chain",

"tx_hash": "string|null",

"created_at": "ISO"

}

],

"pagination": {

"page": 1,

"limit": 20,

"total": 45

}

}



yaml

Copy code



---



## 4.3 POST `/wallet/sync`

### Description

Triggers an on-chain balance and transaction sync.



### Success Response

{

"success": true,

"message": "Sync completed.",

"synced_at": "ISO"

}



yaml

Copy code



### Error Codes

- `WALLET_INVALID_ADDRESS`

- `WALLET_SYNC_FAILED`



---



## 4.4 POST `/wallet/link-address`

### Description

Links a Polygon wallet address to the user.



### Request Body

{

"wallet_address": "string"

}



shell

Copy code



### Validation

- Must be valid Polygon/EVM address  



### Success Response

{

"success": true,

"message": "Wallet address linked."

}



yaml

Copy code



### Error Codes

- `WALLET_ADDRESS_INVALID`

- `WALLET_ADDRESS_IN_USE`



---



## 4.5 GET `/wallet/mining-history`

### Description

Returns all Contribution-Based Mining conversions and mining events.



### Success Response

{

"success": true,

"mining": [

{

"id": "string",

"points": 150,

"tokens_earned": "string",

"multiplier": 1.5,

"created_at": "ISO"

}

]

}



yaml

Copy code



---



## 4.6 POST `/wallet/reward`

### Description

Admin-only: Issues a reward transaction.



### Headers

Authorization: `Bearer ACCESS_TOKEN` (Admin role required)



### Request Body

{

"user_id": "string",

"amount": "string",

"reason": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "Reward issued."

}



yaml

Copy code



### Error Codes

- `WALLET_ADMIN_ONLY`

- `USER_NOT_FOUND`



---



## 4.7 POST `/wallet/manual-adjust`

### Description

Admin-only: Adds or adjusts off-chain balance.



### Request Body

{

"user_id": "string",

"amount": "string",

"note": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "Balance adjusted."

}



yaml

Copy code



### Error Codes

- `WALLET_ADMIN_ONLY`

- `WALLET_INVALID_AMOUNT`



---



# 5. Validation Rules



- All wallet operations require authentication  

- Admin routes require admin role  

- Wallet address must be valid EVM format  

- Negative balances are not allowed (unless admin override)  

- Sync events log discrepancies automatically  



---



# 6. Standard Error Response Format



{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Readable message"

}

}



yaml

Copy code



---



# 7. Security Requirements



- Block invalid or spoofed wallet addresses  

- Validate all admin actions with RBAC middleware  

- Log all balance adjustments  

- Log all reward distributions  

- Sync mismatch triggers a security alert  

- Prevent double-counting of transactions  



---



# 8. Wallet Sync Logic



### Step-by-step:

1. Retrieve linked wallet address  

2. Query blockchain node  

3. Fetch balance & tx history  

4. Compare with off-chain records  

5. Insert missing transactions  

6. Update total balance  

7. Log sync event  



### Automatic Syncs:

- Daily automated sync  

- Also triggered after reward distribution  



---



# 9. Future Extensions



- On-chain staking integration  

- Multi-wallet support  

- NFT rewards from challenges  

- Token claimable rewards  

- On-chain governance voting power  

- Real-time blockchain listeners  



---



# 10. Conclusion

This Wallet API Contract defines all backend interfaces used by the Wallet Dashboard and token system.  

All wallet-related backend and frontend logic must comply with this contract.

