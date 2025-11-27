import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '070'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '48c'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'cb6'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'ed3'),
            routes: [
              {
                path: '/admin/',
                component: ComponentCreator('/admin/', 'bff'),
                exact: true
              },
              {
                path: '/admin/admin-tools-overview',
                component: ComponentCreator('/admin/admin-tools-overview', '963'),
                exact: true
              },
              {
                path: '/amy/',
                component: ComponentCreator('/amy/', '2ad'),
                exact: true
              },
              {
                path: '/amy/amy-feature-matrix',
                component: ComponentCreator('/amy/amy-feature-matrix', '81f'),
                exact: true
              },
              {
                path: '/amy/amy-system-spec',
                component: ComponentCreator('/amy/amy-system-spec', '856'),
                exact: true
              },
              {
                path: '/api-contracts/admin-api-contract',
                component: ComponentCreator('/api-contracts/admin-api-contract', '307'),
                exact: true
              },
              {
                path: '/api-contracts/ai-gateway-api-contract',
                component: ComponentCreator('/api-contracts/ai-gateway-api-contract', 'a26'),
                exact: true
              },
              {
                path: '/api-contracts/auth-api-contract',
                component: ComponentCreator('/api-contracts/auth-api-contract', '87b'),
                exact: true
              },
              {
                path: '/api-contracts/badge-contribution-api-contract',
                component: ComponentCreator('/api-contracts/badge-contribution-api-contract', '1bd'),
                exact: true
              },
              {
                path: '/api-contracts/challenge-api-contract',
                component: ComponentCreator('/api-contracts/challenge-api-contract', 'b96'),
                exact: true
              },
              {
                path: '/api-contracts/notification-api-contract',
                component: ComponentCreator('/api-contracts/notification-api-contract', 'e1b'),
                exact: true
              },
              {
                path: '/api-contracts/submission-api-contract',
                component: ComponentCreator('/api-contracts/submission-api-contract', '7c7'),
                exact: true
              },
              {
                path: '/api-contracts/subscription-api-contract',
                component: ComponentCreator('/api-contracts/subscription-api-contract', '91d'),
                exact: true
              },
              {
                path: '/api-contracts/wallet-api-contract',
                component: ComponentCreator('/api-contracts/wallet-api-contract', '34e'),
                exact: true
              },
              {
                path: '/api/admin-api-blueprint',
                component: ComponentCreator('/api/admin-api-blueprint', 'df5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/amy-router-api-blueprint',
                component: ComponentCreator('/api/amy-router-api-blueprint', '735'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/api-blueprint-template',
                component: ComponentCreator('/api/api-blueprint-template', '6ce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/api-index',
                component: ComponentCreator('/api/api-index', 'a99'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/auth-api-blueprint',
                component: ComponentCreator('/api/auth-api-blueprint', '4af'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/challenge-api-blueprint',
                component: ComponentCreator('/api/challenge-api-blueprint', 'a1c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/governance-api-blueprint',
                component: ComponentCreator('/api/governance-api-blueprint', 'c4c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/notification-api-blueprint',
                component: ComponentCreator('/api/notification-api-blueprint', '4d6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/subscription-api-blueprint',
                component: ComponentCreator('/api/subscription-api-blueprint', '155'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/wallet-api-blueprint',
                component: ComponentCreator('/api/wallet-api-blueprint', '75e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/architecture-principles',
                component: ComponentCreator('/architecture-principles', '451'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/automation/auto-diagrams',
                component: ComponentCreator('/automation/auto-diagrams', '045'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/automation/generator-rules',
                component: ComponentCreator('/automation/generator-rules', '1ae'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/backend/admin-audit-trail-and-activity-tracking-ui-specification',
                component: ComponentCreator('/backend/admin-audit-trail-and-activity-tracking-ui-specification', '05d'),
                exact: true
              },
              {
                path: '/backend/admin-badges-and-contribution-management-ui-specification',
                component: ComponentCreator('/backend/admin-badges-and-contribution-management-ui-specification', '8a2'),
                exact: true
              },
              {
                path: '/backend/admin-challenge-management-ui-specification',
                component: ComponentCreator('/backend/admin-challenge-management-ui-specification', 'b0d'),
                exact: true
              },
              {
                path: '/backend/admin-data-tables-and-moderation-tools-ui-specification',
                component: ComponentCreator('/backend/admin-data-tables-and-moderation-tools-ui-specification', '3d9'),
                exact: true
              },
              {
                path: '/backend/admin-developer-tools-and-api-console-ui-specification',
                component: ComponentCreator('/backend/admin-developer-tools-and-api-console-ui-specification', '69f'),
                exact: true
              },
              {
                path: '/backend/admin-email-sms-template-management-ui-specification',
                component: ComponentCreator('/backend/admin-email-sms-template-management-ui-specification', '9b4'),
                exact: true
              },
              {
                path: '/backend/admin-notification-system-ui-specification',
                component: ComponentCreator('/backend/admin-notification-system-ui-specification', 'a2d'),
                exact: true
              },
              {
                path: '/backend/admin-rate-limiting-and-resource-management-ui-specification',
                component: ComponentCreator('/backend/admin-rate-limiting-and-resource-management-ui-specification', '5b5'),
                exact: true
              },
              {
                path: '/backend/admin-submission-review-system-ui-specification',
                component: ComponentCreator('/backend/admin-submission-review-system-ui-specification', '475'),
                exact: true
              },
              {
                path: '/backend/admin-subscription-management-ui-specification',
                component: ComponentCreator('/backend/admin-subscription-management-ui-specification', '7e7'),
                exact: true
              },
              {
                path: '/backend/admin-system-logs-and-observability-ui-specification',
                component: ComponentCreator('/backend/admin-system-logs-and-observability-ui-specification', 'd06'),
                exact: true
              },
              {
                path: '/backend/admin-system-settings-and-configuration-ui-specification',
                component: ComponentCreator('/backend/admin-system-settings-and-configuration-ui-specification', 'bcf'),
                exact: true
              },
              {
                path: '/backend/admin-user-management-system-ui-specification',
                component: ComponentCreator('/backend/admin-user-management-system-ui-specification', '85f'),
                exact: true
              },
              {
                path: '/backend/admin-wallet-and-transactions-management-ui-specification',
                component: ComponentCreator('/backend/admin-wallet-and-transactions-management-ui-specification', 'a16'),
                exact: true
              },
              {
                path: '/backend/backend-admin-tools-and-moderation-engine-specification',
                component: ComponentCreator('/backend/backend-admin-tools-and-moderation-engine-specification', 'eec'),
                exact: true
              },
              {
                path: '/backend/backend-analytics-and-insights-engine-specification',
                component: ComponentCreator('/backend/backend-analytics-and-insights-engine-specification', '2ba'),
                exact: true
              },
              {
                path: '/backend/backend-api-gateway-and-routing-engine-specification',
                component: ComponentCreator('/backend/backend-api-gateway-and-routing-engine-specification', '270'),
                exact: true
              },
              {
                path: '/backend/backend-api-standards-and-conventions',
                component: ComponentCreator('/backend/backend-api-standards-and-conventions', 'f1d'),
                exact: true
              },
              {
                path: '/backend/backend-architecture-overview',
                component: ComponentCreator('/backend/backend-architecture-overview', '53b'),
                exact: true
              },
              {
                path: '/backend/backend-authentication-and-token-lifecycle-specification',
                component: ComponentCreator('/backend/backend-authentication-and-token-lifecycle-specification', '569'),
                exact: true
              },
              {
                path: '/backend/backend-blockchain-and-token-interaction-engine-specification',
                component: ComponentCreator('/backend/backend-blockchain-and-token-interaction-engine-specification', '4d9'),
                exact: true
              },
              {
                path: '/backend/backend-cache-layer-architecture-and-optimization-rules',
                component: ComponentCreator('/backend/backend-cache-layer-architecture-and-optimization-rules', '5d7'),
                exact: true
              },
              {
                path: '/backend/backend-challenge-engine-logic-and-workflow-specification',
                component: ComponentCreator('/backend/backend-challenge-engine-logic-and-workflow-specification', '548'),
                exact: true
              },
              {
                path: '/backend/backend-contribution-and-badge-engine-specification',
                component: ComponentCreator('/backend/backend-contribution-and-badge-engine-specification', '822'),
                exact: true
              },
              {
                path: '/backend/backend-core-modules-and-responsibilities',
                component: ComponentCreator('/backend/backend-core-modules-and-responsibilities', '78d'),
                exact: true
              },
              {
                path: '/backend/backend-database-schema-and-data-modeling-guidelines',
                component: ComponentCreator('/backend/backend-database-schema-and-data-modeling-guidelines', '710'),
                exact: true
              },
              {
                path: '/backend/backend-developer-sandbox-and-testing-environment-specification',
                component: ComponentCreator('/backend/backend-developer-sandbox-and-testing-environment-specification', 'd31'),
                exact: true
              },
              {
                path: '/backend/backend-email-queue-and-bulk-delivery-engine-specification',
                component: ComponentCreator('/backend/backend-email-queue-and-bulk-delivery-engine-specification', '270'),
                exact: true
              },
              {
                path: '/backend/backend-email-sms-provider-integration-specification',
                component: ComponentCreator('/backend/backend-email-sms-provider-integration-specification', 'de1'),
                exact: true
              },
              {
                path: '/backend/backend-file-migration-and-archiving-engine',
                component: ComponentCreator('/backend/backend-file-migration-and-archiving-engine', 'f1b'),
                exact: true
              },
              {
                path: '/backend/backend-file-processing-and-validation-pipeline-specification',
                component: ComponentCreator('/backend/backend-file-processing-and-validation-pipeline-specification', '125'),
                exact: true
              },
              {
                path: '/backend/backend-file-uploads-storage-and-media-handling-specification',
                component: ComponentCreator('/backend/backend-file-uploads-storage-and-media-handling-specification', 'ba0'),
                exact: true
              },
              {
                path: '/backend/backend-fraud-detection-and-abuse-prevention-engine',
                component: ComponentCreator('/backend/backend-fraud-detection-and-abuse-prevention-engine', 'ef9'),
                exact: true
              },
              {
                path: '/backend/backend-internationalization-i18n-support-specification',
                component: ComponentCreator('/backend/backend-internationalization-i18n-support-specification', '9e6'),
                exact: true
              },
              {
                path: '/backend/backend-logging-and-observability-engine-specification',
                component: ComponentCreator('/backend/backend-logging-and-observability-engine-specification', 'ec7'),
                exact: true
              },
              {
                path: '/backend/backend-multi-tenant-and-multi-instance-expansion-framework',
                component: ComponentCreator('/backend/backend-multi-tenant-and-multi-instance-expansion-framework', 'b6a'),
                exact: true
              },
              {
                path: '/backend/backend-notification-delivery-engine-specification',
                component: ComponentCreator('/backend/backend-notification-delivery-engine-specification', '496'),
                exact: true
              },
              {
                path: '/backend/backend-notification-template-rendering-engine-specification',
                component: ComponentCreator('/backend/backend-notification-template-rendering-engine-specification', '693'),
                exact: true
              },
              {
                path: '/backend/backend-payment-gateway-integration-specification',
                component: ComponentCreator('/backend/backend-payment-gateway-integration-specification', '72f'),
                exact: true
              },
              {
                path: '/backend/backend-rate-limiting-engine-specification',
                component: ComponentCreator('/backend/backend-rate-limiting-engine-specification', '117'),
                exact: true
              },
              {
                path: '/backend/backend-search-and-indexing-engine-specification',
                component: ComponentCreator('/backend/backend-search-and-indexing-engine-specification', '9fc'),
                exact: true
              },
              {
                path: '/backend/backend-service-health-monitoring-and-status-endpoint-specification',
                component: ComponentCreator('/backend/backend-service-health-monitoring-and-status-endpoint-specification', 'aed'),
                exact: true
              },
              {
                path: '/backend/backend-storage-management-and-bucket-lifecycle-rules',
                component: ComponentCreator('/backend/backend-storage-management-and-bucket-lifecycle-rules', '083'),
                exact: true
              },
              {
                path: '/backend/backend-submission-processing-engine-specification',
                component: ComponentCreator('/backend/backend-submission-processing-engine-specification', '8fd'),
                exact: true
              },
              {
                path: '/backend/backend-system-backup-and-disaster-recovery-specification',
                component: ComponentCreator('/backend/backend-system-backup-and-disaster-recovery-specification', '7f4'),
                exact: true
              },
              {
                path: '/backend/backend-system-logging-retention-and-data-compliance-specification',
                component: ComponentCreator('/backend/backend-system-logging-retention-and-data-compliance-specification', 'd89'),
                exact: true
              },
              {
                path: '/backend/backend-system-settings-and-configuration-engine-specification',
                component: ComponentCreator('/backend/backend-system-settings-and-configuration-engine-specification', '8b6'),
                exact: true
              },
              {
                path: '/backend/backend-system-shutdown-restart-and-deployment-safeguards',
                component: ComponentCreator('/backend/backend-system-shutdown-restart-and-deployment-safeguards', '920'),
                exact: true
              },
              {
                path: '/backend/backend-wallet-and-reward-distribution-engine-specification',
                component: ComponentCreator('/backend/backend-wallet-and-reward-distribution-engine-specification', '830'),
                exact: true
              },
              {
                path: '/backend/backend-worker-queue-and-task-scheduler-specification',
                component: ComponentCreator('/backend/backend-worker-queue-and-task-scheduler-specification', '211'),
                exact: true
              },
              {
                path: '/badges/',
                component: ComponentCreator('/badges/', '6e3'),
                exact: true
              },
              {
                path: '/badges/badges-and-levels-spec',
                component: ComponentCreator('/badges/badges-and-levels-spec', 'a94'),
                exact: true
              },
              {
                path: '/changelog',
                component: ComponentCreator('/changelog', 'de4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/ci/docs-validation-overview',
                component: ComponentCreator('/ci/docs-validation-overview', '242'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/ci/link-checking',
                component: ComponentCreator('/ci/link-checking', '818'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/ci/markdown-rules',
                component: ComponentCreator('/ci/markdown-rules', '54d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/ci/mermaid-validation',
                component: ComponentCreator('/ci/mermaid-validation', 'c18'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/ci/naming-checks',
                component: ComponentCreator('/ci/naming-checks', '12a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/content/challenge-content-and-publishing-guidelines',
                component: ComponentCreator('/content/challenge-content-and-publishing-guidelines', 'b2f'),
                exact: true
              },
              {
                path: '/content/content-localization-and-language-expansion-strategy',
                component: ComponentCreator('/content/content-localization-and-language-expansion-strategy', '53e'),
                exact: true
              },
              {
                path: '/content/knowledge-base-structure-and-article-templates',
                component: ComponentCreator('/content/knowledge-base-structure-and-article-templates', '5f1'),
                exact: true
              },
              {
                path: '/content/legal-pages-content-specification',
                component: ComponentCreator('/content/legal-pages-content-specification', 'a8f'),
                exact: true
              },
              {
                path: '/content/marketing-content-and-seo-framework',
                component: ComponentCreator('/content/marketing-content-and-seo-framework', '43b'),
                exact: true
              },
              {
                path: '/content/platform-content-architecture-and-editorial-policy',
                component: ComponentCreator('/content/platform-content-architecture-and-editorial-policy', '3f7'),
                exact: true
              },
              {
                path: '/content/user-education-and-onboarding-content-framework',
                component: ComponentCreator('/content/user-education-and-onboarding-content-framework', 'e05'),
                exact: true
              },
              {
                path: '/contribution/',
                component: ComponentCreator('/contribution/', 'fbe'),
                exact: true
              },
              {
                path: '/contribution/contribution-system-spec',
                component: ComponentCreator('/contribution/contribution-system-spec', 'ff1'),
                exact: true
              },
              {
                path: '/contributors-guide',
                component: ComponentCreator('/contributors-guide', '739'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/core-systems/admin-panel-specification-and-operational-workflows',
                component: ComponentCreator('/core-systems/admin-panel-specification-and-operational-workflows', 'fa6'),
                exact: true
              },
              {
                path: '/core-systems/amy-agent-ai-tools-specification',
                component: ComponentCreator('/core-systems/amy-agent-ai-tools-specification', '887'),
                exact: true
              },
              {
                path: '/core-systems/api-architecture-and-endpoint-inventory',
                component: ComponentCreator('/core-systems/api-architecture-and-endpoint-inventory', '684'),
                exact: true
              },
              {
                path: '/core-systems/authentication-and-security-architecture',
                component: ComponentCreator('/core-systems/authentication-and-security-architecture', '850'),
                exact: true
              },
              {
                path: '/core-systems/badge-and-contribution-system-specification',
                component: ComponentCreator('/core-systems/badge-and-contribution-system-specification', '3bb'),
                exact: true
              },
              {
                path: '/core-systems/challenge-program-specification',
                component: ComponentCreator('/core-systems/challenge-program-specification', '5a7'),
                exact: true
              },
              {
                path: '/core-systems/database-schema-and-entity-relationships',
                component: ComponentCreator('/core-systems/database-schema-and-entity-relationships', 'e26'),
                exact: true
              },
              {
                path: '/core-systems/error-handling-and-system-messaging-specification',
                component: ComponentCreator('/core-systems/error-handling-and-system-messaging-specification', '963'),
                exact: true
              },
              {
                path: '/core-systems/logging-monitoring-and-observability-specification',
                component: ComponentCreator('/core-systems/logging-monitoring-and-observability-specification', 'd99'),
                exact: true
              },
              {
                path: '/core-systems/navigation-flow-and-user-journey-maps',
                component: ComponentCreator('/core-systems/navigation-flow-and-user-journey-maps', '43f'),
                exact: true
              },
              {
                path: '/core-systems/notification-system-specification',
                component: ComponentCreator('/core-systems/notification-system-specification', '52d'),
                exact: true
              },
              {
                path: '/core-systems/rate-limiting-and-resource-management-specification',
                component: ComponentCreator('/core-systems/rate-limiting-and-resource-management-specification', '972'),
                exact: true
              },
              {
                path: '/core-systems/subscription-system-specification',
                component: ComponentCreator('/core-systems/subscription-system-specification', 'e12'),
                exact: true
              },
              {
                path: '/core-systems/ui-ux-framework-and-design-system-overview',
                component: ComponentCreator('/core-systems/ui-ux-framework-and-design-system-overview', '8ba'),
                exact: true
              },
              {
                path: '/core-systems/wallet-and-token-system-specification',
                component: ComponentCreator('/core-systems/wallet-and-token-system-specification', '0cd'),
                exact: true
              },
              {
                path: '/database/',
                component: ComponentCreator('/database/', '46b'),
                exact: true
              },
              {
                path: '/database/schema-overview',
                component: ComponentCreator('/database/schema-overview', '4bd'),
                exact: true
              },
              {
                path: '/developer-onboarding',
                component: ComponentCreator('/developer-onboarding', 'afe'),
                exact: true
              },
              {
                path: '/devops/backup-automation-and-restore-script-specifications',
                component: ComponentCreator('/devops/backup-automation-and-restore-script-specifications', 'd16'),
                exact: true
              },
              {
                path: '/devops/ci-cd-pipeline-architecture-and-deployment-workflow',
                component: ComponentCreator('/devops/ci-cd-pipeline-architecture-and-deployment-workflow', 'f29'),
                exact: true
              },
              {
                path: '/devops/devops-alerts-notifications-and-health-dashboard-setup',
                component: ComponentCreator('/devops/devops-alerts-notifications-and-health-dashboard-setup', 'aac'),
                exact: true
              },
              {
                path: '/devops/devops-infrastructure-overview',
                component: ComponentCreator('/devops/devops-infrastructure-overview', '3bc'),
                exact: true
              },
              {
                path: '/devops/environment-configuration-and-secret-management-specification',
                component: ComponentCreator('/devops/environment-configuration-and-secret-management-specification', 'beb'),
                exact: true
              },
              {
                path: '/devops/load-balancer-and-traffic-routing-configuration',
                component: ComponentCreator('/devops/load-balancer-and-traffic-routing-configuration', 'cc2'),
                exact: true
              },
              {
                path: '/devops/logging-and-monitoring-stack-deployment-guide',
                component: ComponentCreator('/devops/logging-and-monitoring-stack-deployment-guide', 'b94'),
                exact: true
              },
              {
                path: '/devops/security-hardening-and-firewall-configuration-standards',
                component: ComponentCreator('/devops/security-hardening-and-firewall-configuration-standards', '6c8'),
                exact: true
              },
              {
                path: '/devops/server-provisioning-and-runtime-orchestration-playbook',
                component: ComponentCreator('/devops/server-provisioning-and-runtime-orchestration-playbook', 'dbd'),
                exact: true
              },
              {
                path: '/devops/zero-downtime-deployment-procedures',
                component: ComponentCreator('/devops/zero-downtime-deployment-procedures', '4b2'),
                exact: true
              },
              {
                path: '/diagrams/',
                component: ComponentCreator('/diagrams/', '61a'),
                exact: true
              },
              {
                path: '/DOCUMENTATION-AUDIT-REPORT',
                component: ComponentCreator('/DOCUMENTATION-AUDIT-REPORT', '6e8'),
                exact: true
              },
              {
                path: '/documentation-overview',
                component: ComponentCreator('/documentation-overview', '824'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/faq',
                component: ComponentCreator('/faq', 'a4e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/flows/',
                component: ComponentCreator('/flows/', '901'),
                exact: true
              },
              {
                path: '/flows/challenge-detailed-flow',
                component: ComponentCreator('/flows/challenge-detailed-flow', '545'),
                exact: true
              },
              {
                path: '/flows/frontend-backend-db-flow',
                component: ComponentCreator('/flows/frontend-backend-db-flow', 'b38'),
                exact: true
              },
              {
                path: '/flows/platform-flows-overview',
                component: ComponentCreator('/flows/platform-flows-overview', '2cb'),
                exact: true
              },
              {
                path: '/footer',
                component: ComponentCreator('/footer', '9f9'),
                exact: true
              },
              {
                path: '/foundations/detailed-feature-specification',
                component: ComponentCreator('/foundations/detailed-feature-specification', 'ee0'),
                exact: true
              },
              {
                path: '/foundations/platform-overview',
                component: ComponentCreator('/foundations/platform-overview', '0fe'),
                exact: true
              },
              {
                path: '/foundations/platform-sitemap-information-architecture',
                component: ComponentCreator('/foundations/platform-sitemap-information-architecture', '63d'),
                exact: true
              },
              {
                path: '/foundations/system-architecture-overview',
                component: ComponentCreator('/foundations/system-architecture-overview', '693'),
                exact: true
              },
              {
                path: '/foundations/user-roles-permission-matrix',
                component: ComponentCreator('/foundations/user-roles-permission-matrix', 'eb9'),
                exact: true
              },
              {
                path: '/frontend/',
                component: ComponentCreator('/frontend/', 'a3e'),
                exact: true
              },
              {
                path: '/frontend/admin-panel-frontend-architecture',
                component: ComponentCreator('/frontend/admin-panel-frontend-architecture', '469'),
                exact: true
              },
              {
                path: '/frontend/amy-agent-ui-specification',
                component: ComponentCreator('/frontend/amy-agent-ui-specification', '06c'),
                exact: true
              },
              {
                path: '/frontend/authentication-ui-flow-and-screen-specification',
                component: ComponentCreator('/frontend/authentication-ui-flow-and-screen-specification', '795'),
                exact: true
              },
              {
                path: '/frontend/base-layout-components',
                component: ComponentCreator('/frontend/base-layout-components', '65f'),
                exact: true
              },
              {
                path: '/frontend/challenge-hub-ui-specification',
                component: ComponentCreator('/frontend/challenge-hub-ui-specification', '85c'),
                exact: true
              },
              {
                path: '/frontend/component-interaction-and-motion-specification',
                component: ComponentCreator('/frontend/component-interaction-and-motion-specification', '0a7'),
                exact: true
              },
              {
                path: '/frontend/cross-app-interface-and-unified-experience-specification',
                component: ComponentCreator('/frontend/cross-app-interface-and-unified-experience-specification', '9bf'),
                exact: true
              },
              {
                path: '/frontend/dashboard-layout-system-specification',
                component: ComponentCreator('/frontend/dashboard-layout-system-specification', '13f'),
                exact: true
              },
              {
                path: '/frontend/dashboard-navigation',
                component: ComponentCreator('/frontend/dashboard-navigation', '459'),
                exact: true
              },
              {
                path: '/frontend/dashboard-widgets-and-data-visualization-ui-specification',
                component: ComponentCreator('/frontend/dashboard-widgets-and-data-visualization-ui-specification', '778'),
                exact: true
              },
              {
                path: '/frontend/design-tokens-and-theme-specification',
                component: ComponentCreator('/frontend/design-tokens-and-theme-specification', '7c0'),
                exact: true
              },
              {
                path: '/frontend/file-structure',
                component: ComponentCreator('/frontend/file-structure', 'afe'),
                exact: true
              },
              {
                path: '/frontend/frontend-architecture-overview',
                component: ComponentCreator('/frontend/frontend-architecture-overview', '1a8'),
                exact: true
              },
              {
                path: '/frontend/frontend-error-handling-and-ux-messaging-rules',
                component: ComponentCreator('/frontend/frontend-error-handling-and-ux-messaging-rules', '52f'),
                exact: true
              },
              {
                path: '/frontend/frontend-form-system-and-validation-framework',
                component: ComponentCreator('/frontend/frontend-form-system-and-validation-framework', '33a'),
                exact: true
              },
              {
                path: '/frontend/global-navigation-system-ui-specification',
                component: ComponentCreator('/frontend/global-navigation-system-ui-specification', '8e3'),
                exact: true
              },
              {
                path: '/frontend/global-styling-and-css-architecture',
                component: ComponentCreator('/frontend/global-styling-and-css-architecture', 'fbd'),
                exact: true
              },
              {
                path: '/frontend/layouts-and-navigation',
                component: ComponentCreator('/frontend/layouts-and-navigation', '272'),
                exact: true
              },
              {
                path: '/frontend/notification-center-ui-specification',
                component: ComponentCreator('/frontend/notification-center-ui-specification', '72b'),
                exact: true
              },
              {
                path: '/frontend/profile-and-account-settings-ui-specification',
                component: ComponentCreator('/frontend/profile-and-account-settings-ui-specification', 'e4c'),
                exact: true
              },
              {
                path: '/frontend/responsive-layout-and-breakpoint-specification',
                component: ComponentCreator('/frontend/responsive-layout-and-breakpoint-specification', 'de4'),
                exact: true
              },
              {
                path: '/frontend/submissions-ui-specification',
                component: ComponentCreator('/frontend/submissions-ui-specification', 'ea2'),
                exact: true
              },
              {
                path: '/frontend/subscription-center-ui-specification',
                component: ComponentCreator('/frontend/subscription-center-ui-specification', 'e1e'),
                exact: true
              },
              {
                path: '/frontend/ui-components-reference',
                component: ComponentCreator('/frontend/ui-components-reference', '208'),
                exact: true
              },
              {
                path: '/frontend/wallet-dashboard-ui-specification',
                component: ComponentCreator('/frontend/wallet-dashboard-ui-specification', 'bef'),
                exact: true
              },
              {
                path: '/glossary',
                component: ComponentCreator('/glossary', 'f32'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/governance/community-voting-procedures-and-decision-policy',
                component: ComponentCreator('/governance/community-voting-procedures-and-decision-policy', 'c8d'),
                exact: true
              },
              {
                path: '/governance/contribution-mining-governance-rules',
                component: ComponentCreator('/governance/contribution-mining-governance-rules', 'fe6'),
                exact: true
              },
              {
                path: '/governance/dao-transition-roadmap-future',
                component: ComponentCreator('/governance/dao-transition-roadmap-future', '0ac'),
                exact: true
              },
              {
                path: '/governance/ecosystem-compliance-and-risk-assessment-guidelines',
                component: ComponentCreator('/governance/ecosystem-compliance-and-risk-assessment-guidelines', '525'),
                exact: true
              },
              {
                path: '/governance/governance-framework-overview',
                component: ComponentCreator('/governance/governance-framework-overview', '8fd'),
                exact: true
              },
              {
                path: '/governance/security-council-and-emergency-powers-specification',
                component: ComponentCreator('/governance/security-council-and-emergency-powers-specification', '8b4'),
                exact: true
              },
              {
                path: '/governance/token-utility-and-governance-proposal-framework',
                component: ComponentCreator('/governance/token-utility-and-governance-proposal-framework', '999'),
                exact: true
              },
              {
                path: '/maintenance-guide',
                component: ComponentCreator('/maintenance-guide', 'b6a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/manifest',
                component: ComponentCreator('/manifest', 'e99'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/',
                component: ComponentCreator('/mermaid/', '43c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/amy-agent/',
                component: ComponentCreator('/mermaid/amy-agent/', '869'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/amy-agent/phase-9-amy-ai-agent-overview',
                component: ComponentCreator('/mermaid/amy-agent/phase-9-amy-ai-agent-overview', '586'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/api-contracts/',
                component: ComponentCreator('/mermaid/api-contracts/', '4ce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/api-contracts/phase-8-api-contracts-overview',
                component: ComponentCreator('/mermaid/api-contracts/phase-8-api-contracts-overview', '4f3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/architecture/',
                component: ComponentCreator('/mermaid/architecture/', '307'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/architecture/phase-2-platform-architecture-overview',
                component: ComponentCreator('/mermaid/architecture/phase-2-platform-architecture-overview', '9bc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/architecture/phase-2-security-and-protection-framework',
                component: ComponentCreator('/mermaid/architecture/phase-2-security-and-protection-framework', 'ada'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/core-sequences/',
                component: ComponentCreator('/mermaid/core-sequences/', 'eee'),
                exact: true
              },
              {
                path: '/mermaid/core-sequences/phase-5-core-system-sequences-overview',
                component: ComponentCreator('/mermaid/core-sequences/phase-5-core-system-sequences-overview', '243'),
                exact: true
              },
              {
                path: '/mermaid/data-models/',
                component: ComponentCreator('/mermaid/data-models/', 'a24'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/data-models/phase-7-data-models-and-prisma-layer-overview',
                component: ComponentCreator('/mermaid/data-models/phase-7-data-models-and-prisma-layer-overview', '9b3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/foundations/',
                component: ComponentCreator('/mermaid/foundations/', '5bb'),
                exact: true
              },
              {
                path: '/mermaid/foundations/phase-1-strategic-foundations-plan',
                component: ComponentCreator('/mermaid/foundations/phase-1-strategic-foundations-plan', 'f02'),
                exact: true
              },
              {
                path: '/mermaid/governance/',
                component: ComponentCreator('/mermaid/governance/', '186'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/governance/phase-6-governance-and-permissions-overview',
                component: ComponentCreator('/mermaid/governance/phase-6-governance-and-permissions-overview', 'bc4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/index-report',
                component: ComponentCreator('/mermaid/index-report', '87c'),
                exact: true
              },
              {
                path: '/mermaid/layouts-and-navigation/',
                component: ComponentCreator('/mermaid/layouts-and-navigation/', '01c'),
                exact: true
              },
              {
                path: '/mermaid/platform-flows/',
                component: ComponentCreator('/mermaid/platform-flows/', 'b3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/platform-flows/phase-3-platform-flows-overview',
                component: ComponentCreator('/mermaid/platform-flows/phase-3-platform-flows-overview', 'b44'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/RENAME_SUMMARY',
                component: ComponentCreator('/mermaid/RENAME_SUMMARY', 'ff2'),
                exact: true
              },
              {
                path: '/mermaid/standardized/',
                component: ComponentCreator('/mermaid/standardized/', 'd59'),
                exact: true
              },
              {
                path: '/mermaid/standardized/DIAGRAM-STANDARDIZATION-SUMMARY',
                component: ComponentCreator('/mermaid/standardized/DIAGRAM-STANDARDIZATION-SUMMARY', 'e67'),
                exact: true
              },
              {
                path: '/mermaid/standardized/roadmap-reference',
                component: ComponentCreator('/mermaid/standardized/roadmap-reference', 'dc8'),
                exact: true
              },
              {
                path: '/mermaid/unified-master-flow/',
                component: ComponentCreator('/mermaid/unified-master-flow/', '5f3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/unified-master-flow/phase-4-unified-master-flow-overview',
                component: ComponentCreator('/mermaid/unified-master-flow/phase-4-unified-master-flow-overview', '86a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/wallet-architecture/',
                component: ComponentCreator('/mermaid/wallet-architecture/', 'fde'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/mermaid/wallet/',
                component: ComponentCreator('/mermaid/wallet/', '264'),
                exact: true
              },
              {
                path: '/mermaid/wallet/phase-10-wallet-dashboard-overview',
                component: ComponentCreator('/mermaid/wallet/phase-10-wallet-dashboard-overview', 'e9a'),
                exact: true
              },
              {
                path: '/PRIORITY-1-FIXES-SUMMARY',
                component: ComponentCreator('/PRIORITY-1-FIXES-SUMMARY', 'e41'),
                exact: true
              },
              {
                path: '/public/announcements/ogc-newfinity-documentation-v2.0-release-announcement',
                component: ComponentCreator('/public/announcements/ogc-newfinity-documentation-v2.0-release-announcement', 'eda'),
                exact: true
              },
              {
                path: '/public/announcements/ogc-newfinity-v2.0-release-notes',
                component: ComponentCreator('/public/announcements/ogc-newfinity-v2.0-release-notes', 'c76'),
                exact: true
              },
              {
                path: '/public/challenge/challenge-faq',
                component: ComponentCreator('/public/challenge/challenge-faq', 'baa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/challenge/challenge-program-overview',
                component: ComponentCreator('/public/challenge/challenge-program-overview', '39d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/challenge/judging-and-rules',
                component: ComponentCreator('/public/challenge/judging-and-rules', '2a2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/challenge/tracks-categories',
                component: ComponentCreator('/public/challenge/tracks-categories', '8fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/investors/investor-information-pack',
                component: ComponentCreator('/public/investors/investor-information-pack', 'd8d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/investors/market-positioning',
                component: ComponentCreator('/public/investors/market-positioning', 'ae0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/investors/public-roadmap',
                component: ComponentCreator('/public/investors/public-roadmap', '386'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/legal/cookies-and-data-policy',
                component: ComponentCreator('/public/legal/cookies-and-data-policy', 'd56'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/legal/privacy-policy',
                component: ComponentCreator('/public/legal/privacy-policy', '5a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/legal/terms-of-use',
                component: ComponentCreator('/public/legal/terms-of-use', 'dae'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/overview/ogc-newfinity-overview',
                component: ComponentCreator('/public/overview/ogc-newfinity-overview', '252'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/platform/ai-agent-amy-overview',
                component: ComponentCreator('/public/platform/ai-agent-amy-overview', '695'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/platform/platform-user-guide',
                component: ComponentCreator('/public/platform/platform-user-guide', '08b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/platform/subscriptions-overview',
                component: ComponentCreator('/public/platform/subscriptions-overview', '05e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/platform/wallet-feature-sheet',
                component: ComponentCreator('/public/platform/wallet-feature-sheet', '7f8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/token/ecosystem-economy',
                component: ComponentCreator('/public/token/ecosystem-economy', '0e9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/token/ogcfinity-token-summary',
                component: ComponentCreator('/public/token/ogcfinity-token-summary', '357'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/token/tokenomics-visual',
                component: ComponentCreator('/public/token/tokenomics-visual', 'c0a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/public/whitepaper/ogc-whitepaper-public',
                component: ComponentCreator('/public/whitepaper/ogc-whitepaper-public', 'd94'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/quickstart',
                component: ComponentCreator('/quickstart', 'fc3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/rfc/rfc-examples',
                component: ComponentCreator('/rfc/rfc-examples', '572'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/rfc/rfc-guidelines',
                component: ComponentCreator('/rfc/rfc-guidelines', '5d6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/rfc/rfc-template',
                component: ComponentCreator('/rfc/rfc-template', '458'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shortcuts',
                component: ComponentCreator('/shortcuts', '2c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/site/deployment-options',
                component: ComponentCreator('/site/deployment-options', 'f47'),
                exact: true
              },
              {
                path: '/site/navigation-structure',
                component: ComponentCreator('/site/navigation-structure', '259'),
                exact: true
              },
              {
                path: '/site/sidebar-config',
                component: ComponentCreator('/site/sidebar-config', '5a7'),
                exact: true
              },
              {
                path: '/site/site-preparation',
                component: ComponentCreator('/site/site-preparation', '89a'),
                exact: true
              },
              {
                path: '/site/theme-guidelines',
                component: ComponentCreator('/site/theme-guidelines', '723'),
                exact: true
              },
              {
                path: '/specs/',
                component: ComponentCreator('/specs/', 'b61'),
                exact: true
              },
              {
                path: '/specs/auth-system-spec',
                component: ComponentCreator('/specs/auth-system-spec', 'f60'),
                exact: true
              },
              {
                path: '/specs/challenge-program-spec',
                component: ComponentCreator('/specs/challenge-program-spec', '130'),
                exact: true
              },
              {
                path: '/specs/governance-system-spec',
                component: ComponentCreator('/specs/governance-system-spec', '8fa'),
                exact: true
              },
              {
                path: '/specs/subscription-system-spec',
                component: ComponentCreator('/specs/subscription-system-spec', '21b'),
                exact: true
              },
              {
                path: '/structure-map',
                component: ComponentCreator('/structure-map', 'be5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/tests/api-tests',
                component: ComponentCreator('/tests/api-tests', 'f82'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/tests/integration-tests',
                component: ComponentCreator('/tests/integration-tests', 'c1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/tests/test-standards',
                component: ComponentCreator('/tests/test-standards', 'c3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/tests/testing-overview',
                component: ComponentCreator('/tests/testing-overview', '2c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/tests/unit-tests',
                component: ComponentCreator('/tests/unit-tests', 'd4a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/wallet/',
                component: ComponentCreator('/wallet/', '0fb'),
                exact: true
              },
              {
                path: '/wallet/wallet-product-spec',
                component: ComponentCreator('/wallet/wallet-product-spec', '673'),
                exact: true
              },
              {
                path: '/wallet/wallet-ui-wireframes',
                component: ComponentCreator('/wallet/wallet-ui-wireframes', 'b0e'),
                exact: true
              },
              {
                path: '/zzz-archive-diagrams/',
                component: ComponentCreator('/zzz-archive-diagrams/', '71f'),
                exact: true
              },
              {
                path: '/',
                component: ComponentCreator('/', '42b'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
