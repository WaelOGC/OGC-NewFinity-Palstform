# OGC NewFinity — Wallet Dashboard UI Specification (v1.0)



## 1. Introduction

This document defines the complete Wallet Dashboard UI for the OGC NewFinity platform.  

It specifies layout, components, charts, interactions, states, and UX behavior for all wallet-related features.



The Wallet Dashboard consolidates:

- On-chain balance  

- Off-chain balance  

- Combined total  

- Token earnings  

- Mining history  

- Transaction list  

- Syncing status  

- Reward/airdrop notifications  



This defines the visual and functional standard for all wallet screens.



---



# 2. Wallet Dashboard Structure



The Wallet Dashboard uses a **three-section layout**:



| SECTION 1: BALANCE CARDS |

| SECTION 2: ANALYTICS CHARTS |

| SECTION 3: TRANSACTION TABLE |

yaml

Copy code



### Responsive Rules:

- Desktop → 3-column card grid  

- Tablet → 2-column  

- Mobile → stacked vertical cards  



---



# 3. Section 1 — Balance Overview Cards



Three cards appear at the top:



### 3.1 On-Chain Balance Card

Displays:

- OGCFinity symbol  

- On-chain OGCFinity balance  

- Network: Polygon  

- Status: Synced / Syncing  



### 3.2 Off-Chain Balance Card

Displays:

- Off-chain (platform) balance  

- Latest pending rewards  

- Mining contributions  



### 3.3 Total Balance Card

Displays:

- Combined total value  

- Equivalent USD value (future)  



---



## Card Design Rules

- Neon border glow based on token color (#00FFC6)  

- Transparent dark backgrounds  

- Light hover scale: `scale(1.02)`  

- Soft-shadow + Neon glow  

- Large numbers with high clarity  

- Icons on the left, numbers on the right  



---



# 4. Section 2 — Analytics & Token Behavior



### Required Components:

- **Token Earnings Chart** (line chart)  

- **Mining Timeline** (horizontal event timeline)  



---



## 4.1 Token Earnings Chart



### Displays:

- Daily / Weekly / Monthly earnings  

- Dropdown filter  

- Neon gradient line  

- Hover info tooltip  



### Behavior:

- Animates on mount  

- Updates dynamically after sync  

- Responsive scaling  



---



## 4.2 Mining Timeline



Shows the contribution and mining events chronologically.



### Elements:

- Event dot (neon pink or neon teal)  

- Date & time  

- Description (e.g., "Challenge Reward", "Mining Contribution Added")  



### Behavior:

- Scrollable horizontally on mobile  

- Hover → highlight + details  

- Sync events glow teal  



---



# 5. Section 3 — Transaction Table



### Required Columns:

- Event Type (icon + text)  

- Amount  

- Date  

- Status  



### Features:

- Sticky header  

- Pagination  

- Filters (e.g., "Rewards", "Mining", "Airdrops")  

- Neon hover row highlight  

- Expandable mobile accordion layout  



### Mobile Behavior:

- Each row becomes a card-like block  

- Tap expands details  

- Amount stays bold & centered  



---



# 6. Wallet Syncing UX



### Sync Button:

- Icon rotates when syncing  

- Glow pulse animation  

- Disabled during sync  



### Sync States:



#### **1. Synced**

- Green accent glow  

- Text: "Wallet is up to date"  



#### **2. Syncing**

- Animated spinner  

- Text: "Synchronizing wallet…"  



#### **3. Failed**

- Red glow border  

- Text: "Unable to sync. Try again."  

- Retry button visible  



#### **4. Out of Sync**

Triggered if last sync > X minutes:

- Yellow border  

- Text: "Wallet out of sync"  



---



# 7. Error States



### If API fails:

- Show full-width error card  

- Message:  

  "We couldn't load your wallet data. Try again shortly."  



### If transaction list fails:

- Replace table with empty-state component  



---



# 8. Empty States



### No Transactions:

"Your wallet has no transactions yet."



### No Mining Activity:

"No mining events available."



### No Rewards:

"You haven't earned any rewards yet."



---



# 9. Interactive Components



### 9.1 Quick-Action Buttons

- Refresh Sync  

- Download CSV (future)  

- Copy Wallet Address  



### 9.2 Hover Tooltips

Used for:

- OGCFinity symbol  

- Network details  

- Mining levels  

- Reward statuses  



---



# 10. Navigation From Wallet



User can navigate to:

- Profile (wallet settings)  

- AI Agent (if reward generated from AI usage?)  

- Challenges (jump to reward source)  

- Submissions  



Links should use neon highlight + arrow icon.



---



# 11. Visual Styling Tokens



### Colors:

- Teal (#00FFC6) for token values  

- Neon accents for borders  

- Transparent backgrounds  

- White text everywhere  



### Shadows:

--shadow-soft

--glow-teal

--glow-pink



yaml

Copy code



### Typography:

- Large numeric font  

- Semi-bold for labels  

- Slight letter spacing  



---



# 12. Responsive Rules Summary



### Desktop:

- 3-card balance grid  

- Dual chart layout  

- Full transaction table  



### Tablet:

- 2-card grid  

- Charts stacked  

- Compact table  



### Mobile:

- 1-column  

- Charts fully vertical  

- Transactions → accordion cards  



---



# 13. Future Enhancements



- Live token price feed  

- Multi-wallet support  

- Layer-2 balance aggregation  

- Mining level badges  

- Token faucet (development only)  



---



# 14. Conclusion

This document provides the complete specification for the Wallet Dashboard UI in OGC NewFinity.  

All wallet interfaces, charts, interactions, and sync behaviors must follow these rules for a unified user experience.

