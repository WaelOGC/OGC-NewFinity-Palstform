# Mermaid Diagram File Rename Summary

## Overview

All Mermaid diagram files have been normalized to the new naming convention:

**Format:** `phase-<major>[.<minor>]--<category>--<topic>.mmd`

## Rename Summary Table

| Old Filename | New Filename |
|--------------|--------------|
| **03-platform-flows/** |
| `phase-1-platform-flow-diagram.mmd` | `phase-1--platform--flow.mmd` |
| `phase-2-platform-flow-diagram.mmd` | `phase-2--platform--flow.mmd` |
| `phase-3-admin-tools-overview.mmd` | `phase-3--admin--tools-overview.mmd` |
| `phase-3-admin-tools-platform-flow.mmd` | `phase-3--admin--platform-flow.mmd` |
| `phase-3-component-interaction-diagram.mmd` | `phase-3--platform--component-interaction.mmd` |
| `platform-user-flow-diagram.mmd` | `phase-3--platform--user-flow.mmd` |
| **04-unified-master-flow/** |
| `phase-4-unified-master-flow-diagram.mmd` | `phase-4--platform--unified-master-flow.mmd` |
| **04-layouts-and-navigation/** |
| `phase-4.1-platform-layout-structure.mmd` | `phase-4.1--ui--layout-structure.mmd` |
| `phase-4.2-platform-navigation-map.mmd` | `phase-4.2--ui--navigation-map.mmd` |
| `phase-4.3-frontend-component-tree.mmd` | `phase-4.3--ui--component-tree.mmd` |
| `phase-4.4-ui-layer-overview.mmd` | `phase-4.4--ui--layer-overview.mmd` |
| **05-core-sequences/** |
| `phase-5.1-auth-and-sso-sequence.mmd` | `phase-5.1--auth--sso-sequence.mmd` |
| `phase-5.2-subscription-and-checkout-sequence.mmd` | `phase-5.2--subscription--checkout-sequence.mmd` |
| `phase-5.3-wallet-transaction-lifecycle.mmd` | `phase-5.3--wallet--transaction-lifecycle.mmd` |
| `phase-5.4-challenge-and-badge-lifecycle.mmd` | `phase-5.4--challenge--badge-lifecycle.mmd` |
| **06-governance/** |
| `phase-6.1-governance-overview-diagram.mmd` | `phase-6.1--governance--overview.mmd` |
| `phase-6.2-permissions-matrix-flow.mmd` | `phase-6.2--governance--permissions-matrix.mmd` |
| `phase-6.3-escalation-and-moderation-flow.mmd` | `phase-6.3--governance--escalation-moderation.mmd` |
| `phase-6.4-audit-and-compliance-flow.mmd` | `phase-6.4--governance--audit-compliance.mmd` |
| `phase-6.5-policy-inheritance-and-feature-access.mmd` | `phase-6.5--governance--policy-inheritance-access.mmd` |
| **07-data-models/** |
| `phase-7.1-core-data-erd.mmd` | `phase-7.1--data--core-erd.mmd` |
| `phase-7.2-prisma-integration-flow.mmd` | `phase-7.2--data--prisma-integration.mmd` |
| `phase-7.3-migration-sequence.mmd` | `phase-7.3--data--migration-sequence.mmd` |
| `phase-7.4-indices-and-constraints.mmd` | `phase-7.4--data--indices-constraints.mmd` |
| `phase-7.5-data-lifecycle-crud.mmd` | `phase-7.5--data--lifecycle-crud.mmd` |
| **07-wallet-architecture/** |
| `phase-7.6-ogc-wallet-architecture.mmd` | `phase-7.6--wallet--architecture.mmd` |
| `phase-7.7-ogc-wallet-rewards-data-flow.mmd` | `phase-7.7--wallet--rewards-flow.mmd` |
| `phase-7.8-ogc-wallet-blockchain-integration.mmd` | `phase-7.8--wallet--blockchain-integration.mmd` |
| `phase-7.9-ogc-blockchain-transaction-lifecycle.mmd` | `phase-7.9--wallet--transaction-lifecycle.mmd` |
| `phase-7.10-ogc-wallet-reconciliation.mmd` | `phase-7.10--wallet--reconciliation.mmd` |
| **08-api-contracts/** |
| `phase-8.1-api-surface-overview.mmd` | `phase-8.1--api--surface-overview.mmd` |
| `phase-8.2-auth-api-contract-v1-0.mmd` | `phase-8.2--api--auth-contract-v1-0.mmd` |
| `phase-8.3-subscription-api-contract-v1-0.mmd` | `phase-8.3--api--subscription-contract-v1-0.mmd` |
| `phase-8.4-wallet-api-contract-v1-0.mmd` | `phase-8.4--api--wallet-contract-v1-0.mmd` |
| `phase-8.5-transactions-and-blockchain-events-api-contract-v1-0.mmd` | `phase-8.5--api--transactions-blockchain-events.mmd` |
| `phase-8.6-notifications-and-webhooks-api-contract-v1-0.mmd` | `phase-8.6--api--notifications-webhooks.mmd` |
| `phase-8.7-admin-api-contract-v1-0.mmd` | `phase-8.7--api--admin-contract-v1-0.mmd` |
| `phase-8.8-analytics-and-usage-api-contract-v1-0.mmd` | `phase-8.8--api--analytics-usage.mmd` |
| **09-amy-agent/** |
| `phase-9.1-amy-routing-architecture.mmd` | `phase-9.1--amy--routing-architecture.mmd` |
| `phase-9.2-amy-phase1-tools.mmd` | `phase-9.2--amy--core-tools.mmd` |
| `phase-9.3-amy-phase2-tools-automation.mmd` | `phase-9.3--amy--automation-tools.mmd` |
| `phase-9.4-amy-phase3-tools-advanced.mmd` | `phase-9.4--amy--advanced-tools.mmd` |
| `phase-9.5-amy-unified-tool-map.mmd` | `phase-9.5--amy--tool-map.mmd` |
| `phase-9.6-amy-user-flow.mmd` | `phase-9.6--amy--user-flow.mmd` |
| `phase-9.7-amy-system-interaction.mmd` | `phase-9.7--amy--system-interaction.mmd` |
| `phase-9.8-amy-data-flow-architecture.mmd` | `phase-9.8--amy--data-flow.mmd` |
| **02-architecture/** |
| `phase-2.3-ogc-master-architecture.mmd` | `phase-2.3--architecture--master.mmd` |

## Verification

- **Total .mmd files:** 47 (unchanged)
- **Files renamed:** 47
- **Naming convention:** All files now follow `phase-<major>[.<minor>]--<category>--<topic>.mmd`
- **File contents:** Unchanged (only filenames modified)

## Next Steps

1. **Git History:** Since `git mv` was not available in the environment, files were renamed using `Move-Item`. To preserve git history, you should:
   ```bash
   git add -A
   git commit -m "Normalize Mermaid diagram filenames to new convention"
   ```
   Git should detect these as renames if the file contents are identical.

2. **Documentation References:** No direct filename references were found in documentation files. All README files use generic descriptions.

3. **Diagram Rendering:** All diagrams should render correctly as file contents were not modified.

## Categories Used

- `platform` - Platform flows and interactions
- `admin` - Admin tools and flows
- `ui` - UI layouts and navigation
- `auth` - Authentication flows
- `subscription` - Subscription flows
- `wallet` - Wallet-related diagrams
- `challenge` - Challenge flows
- `governance` - Governance and permissions
- `data` - Data models and database
- `api` - API contracts
- `amy` - Amy AI Agent
- `architecture` - System architecture

