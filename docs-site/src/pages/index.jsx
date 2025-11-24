import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home() {
  return (
    <Layout
      title="OGC NewFinity Documentation"
      description="Official documentation portal for the OGC NewFinity Platform"
    >
      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1>OGC NewFinity Platform — Documentation</h1>
        <p>
          This is the Docusaurus-powered documentation site for the OGC NewFinity Platform.
        </p>
        <p>
          The content is sourced directly from the <code>/docs</code> folder in the main repository.
        </p>
        <h2>Get Started</h2>
        <ul>
          <li>
            <Link to="/index">Documentation Landing Page</Link>
          </li>
          <li>
            <Link to="/quickstart">Developer Quickstart Guide</Link>
          </li>
          <li>
            <Link to="/structure-map">Repository Structure Map</Link>
          </li>
          <li>
            <Link to="/mermaid/index">Mermaid Diagram Index</Link>
          </li>
        </ul>
      </main>
    </Layout>
  );
}

