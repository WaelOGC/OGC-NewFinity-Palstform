# Phase 05 – Core System Sequences (OGC NewFinity Platform)

## Objective

Define the transactional and process lifecycles that power the OGC NewFinity backend.

These sequences show how user actions and system triggers evolve across APIs, databases, and blockchain layers.

## Core Sequences

1. **Authentication & SSO Sequence**

   - Handles login, logout, and token refresh using JWTs.
   - Verifies user identity through Auth API (Phase 8.2).
   - Refresh tokens stored securely and rotated automatically.

2. **Subscription & Checkout Flow**

   - User upgrades to a paid tier through Stripe or token payment.
   - Backend updates subscription table and permissions scope.
   - Webhooks confirm payment status; user gains new access level.

3. **Wallet Transaction Lifecycle**

   - Transaction initiated → validated → broadcast to blockchain.
   - Indexer tracks confirmations → updates DB record.
   - Rewards, staking, and contribution mining tied to this flow.

4. **Challenge & Badge Lifecycle**

   - Challenge created by admin → submissions opened.
   - User submits entry → judged or voted → rewards distributed.
   - Badges assigned based on participation and results.

## Diagram Placeholders

Separate Mermaid diagrams will be created for each lifecycle:

- Auth & SSO Sequence  
- Subscription & Checkout  
- Wallet TX Lifecycle  
- Challenge & Badge Lifecycle  

## Integration Notes

- Connects directly to API layers (8.2–8.5).  
- Relies on data models from Phase 07.  
- Secured by framework defined in Phase 02 (Security & Protection).  

## Deliverables

- 4 core lifecycle sequence diagrams (.mmd files)
- Transaction and reward flowchart
- Error handling flow per sequence

## Status

Draft – Ready for sequence diagrams implementation after base API structure is finalized.

