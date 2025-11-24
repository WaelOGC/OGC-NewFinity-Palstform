# RFC Examples — OGC NewFinity Platform

This file contains example RFCs to help contributors understand how to structure proposals.

---

## Example RFC #001 — Unified Wallet Sync Engine

### Summary

Proposes merging the reward engine and blockchain sync engine into a single wallet sync service.

### Motivation

- Current system duplicates logic  

- Sync failures require dual logging  

- Simplifies reconciliation  

### Proposed Solution

- Replace two engines with a unified sync module  

- Update wallet architecture diagrams  

- Add new sequenceDiagram under Phase 7  

### Impact Analysis

- Backend: new service file  

- Frontend: new sync status banner  

- Database: add sync_state column  

- Diagrams: update 07-wallet-architecture  

### Migration Plan

1. Create new sync module  

2. Disable old engines  

3. Update schemas  

4. Deploy  

5. Monitor logs  

---

## Example RFC #002 — Amy Tool Auto-Routing Upgrade

### Summary

Allow Amy to route tasks to multiple tools automatically.

### Motivation

Improves flexibility and reduces manual tool selection.

### Proposed Solution

- Add "auto-pipeline" module  

- Integrate model selector  

- Update Phase 9 diagrams  

### Impact

- New endpoints in /amy/auto  

- Updated routing architecture  

---

