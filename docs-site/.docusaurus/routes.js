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
    component: ComponentCreator('/', '754'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '004'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '29b'),
            routes: [
              {
                path: '/api-contracts/auth-api-contract',
                component: ComponentCreator('/api-contracts/auth-api-contract', '87b'),
                exact: true
              },
              {
                path: '/api-contracts/challenge-api-contract',
                component: ComponentCreator('/api-contracts/challenge-api-contract', 'b96'),
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
                path: '/developer-onboarding',
                component: ComponentCreator('/developer-onboarding', 'afe'),
                exact: true
              },
              {
                path: '/diagrams/',
                component: ComponentCreator('/diagrams/', '61a'),
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
                path: '/glossary',
                component: ComponentCreator('/glossary', 'f32'),
                exact: true,
                sidebar: "docsSidebar"
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
