// @ts-check

const config = {
  title: 'OGC NewFinity Docs',
  tagline: 'OGC NewFinity Platform Documentation',
  url: 'https://example.com',
  baseUrl: '/',
  baseUrlIssueBanner: false,
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  organizationName: 'ogc-newfinity',
  projectName: 'ogc-newfinity-docs',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editCurrentVersion: false,
          include: ['**/*.md', '**/*.mdx'],
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
};

module.exports = config;

