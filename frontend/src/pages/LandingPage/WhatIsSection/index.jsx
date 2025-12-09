import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

export default function WhatIsSection() {
  return (
    <section className="what-is-section">
      <div className="what-is-inner">
        {/* Top Icon */}
        <div className="what-is-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="iconGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(150, 200, 255, 0.9)" />
                <stop offset="50%" stopColor="rgba(100, 150, 255, 0.8)" />
                <stop offset="100%" stopColor="rgba(0, 255, 200, 0.7)" />
              </linearGradient>
              <linearGradient id="iconGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(80, 130, 220, 0.9)" />
                <stop offset="50%" stopColor="rgba(60, 110, 200, 0.8)" />
                <stop offset="100%" stopColor="rgba(0, 180, 160, 0.7)" />
              </linearGradient>
            </defs>
            {/* Platform layers icon */}
            <rect x="8" y="20" width="48" height="8" rx="2" className="icon-layer icon-layer-1" />
            <rect x="12" y="32" width="40" height="8" rx="2" className="icon-layer icon-layer-2" />
            <rect x="16" y="44" width="32" height="8" rx="2" className="icon-layer icon-layer-3" />
            <circle cx="32" cy="12" r="4" className="icon-core" />
          </svg>
        </div>

        {/* Main Text Block */}
        <div className="what-is-text">
          <p className="what-is-intro">
            OGC NewFinity is a unified AI and blockchain platform built for real products, not experiments. It combines intelligent automation, secure blockchain infrastructure, and tokenized incentives so teams can design, launch, and scale digital services on one integrated ecosystem.
          </p>
          
          <div className="what-is-cards">
            <div className="layer-card">
              <div className="card-inner">
                <div className="card-front">
                  <span className="card-title">AI Automation Layer</span>
                </div>
                <div className="card-back">
                  <span className="card-content">Orchestrate agents, workflows, and data pipelines with AI.</span>
                </div>
              </div>
            </div>
            <div className="layer-card">
              <div className="card-inner">
                <div className="card-front">
                  <span className="card-title">Blockchain & Security Layer</span>
                </div>
                <div className="card-back">
                  <span className="card-content">Anchor identity, logic, and transactions on secure blockchain rails.</span>
                </div>
              </div>
            </div>
            <div className="layer-card">
              <div className="card-inner">
                <div className="card-front">
                  <span className="card-title">Tokenized Value Layer</span>
                </div>
                <div className="card-back">
                  <span className="card-content">Reward contributions, fund innovation, and align communities with programmable tokens.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Button */}
        <Link to="/docs" className="what-is-doc-button">
          Read the full documentation
        </Link>

        {/* Small Tagline */}
        <p className="what-is-tagline">
          Trusted by builders who need AI speed with blockchain-grade security and transparency.
        </p>
      </div>
    </section>
  );
}
