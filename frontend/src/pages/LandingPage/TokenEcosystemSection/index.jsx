import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

export default function TokenEcosystemSection() {
  const [activeTab, setActiveTab] = useState("genesis");

  return (
    <section className="token-ecosystem-section">
      <div className="token-ecosystem-container">
        <div className="token-ecosystem-content">
          <div className="tec-eyebrow">Token & Ecosystem Architecture</div>
          
          <h2 className="tec-title">
            How the OGCFinity Token Powers the Ecosystem
          </h2>
          
          <p className="tec-description">
            OGCFinity operates through a two-phase token model that is tightly
            coupled with the OGC NewFinity ecosystem. The Genesis Token on
            Polygon unlocks early platform utility, while the future Native
            Token on the OGC Chain will govern supply, contribution mining, and
            advanced on-chain features across the entire infrastructure,
            application, community, and economic layers.
          </p>
          
          <div className="tec-tabs">
            <button
              className={`tec-tab ${activeTab === "genesis" ? "active" : ""}`}
              onClick={() => setActiveTab("genesis")}
            >
              Genesis Token (Polygon)
            </button>
            <button
              className={`tec-tab ${activeTab === "native" ? "active" : ""}`}
              onClick={() => setActiveTab("native")}
            >
              Native Token (OGC Chain)
            </button>
            <button
              className={`tec-tab ${activeTab === "utility" ? "active" : ""}`}
              onClick={() => setActiveTab("utility")}
            >
              Ecosystem Utility
            </button>
          </div>
          
          <div className="tec-tab-panel">
            {activeTab === "genesis" && (
              <p>
                <strong>Genesis Token (Polygon)</strong> — Fixed-supply ERC-20
                used for early platform access and utilities.
              </p>
            )}
            {activeTab === "native" && (
              <p>
                <strong>Native Token (OGC Chain)</strong> — Governance-driven,
                contribution-aware token for the future chain.
              </p>
            )}
            {activeTab === "utility" && (
              <p>
                <strong>Ecosystem Utility</strong> — Access to AI tools,
                developer features, staking, governance, and rewards.
              </p>
            )}
          </div>
          
          <Link to="/docs" className="token-ecosystem-cta">
            View token &amp; ecosystem docs
          </Link>
        </div>
        
        <div className="token-ecosystem-blueprint">
          <div className="blueprint-chain">
            <div className="bp-token-core">OGC</div>
            
            <div className="bp-contract bp-contract-1">
              <span className="bp-contract-label">Access Contract</span>
            </div>
            <div className="bp-contract bp-contract-2">
              <span className="bp-contract-label">Staking Contract</span>
            </div>
            <div className="bp-contract bp-contract-3">
              <span className="bp-contract-label">Governance Contract</span>
            </div>
            <div className="bp-contract bp-contract-4">
              <span className="bp-contract-label">Rewards Contract</span>
            </div>
            
            {/* Chain line and animated data dot handled by CSS */}
            <div className="bp-chain-line"></div>
            <div className="bp-data-dot"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
