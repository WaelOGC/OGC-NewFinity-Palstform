/**
 * HeroSection Component
 * 
 * Main hero section for the OGC NewFinity landing page.
 * Features:
 * - Left side: Title, description, and CTA buttons
 * - Right side: 3D glass blockchain cube with AI symbol and Matrix-style animated background
 * - Theme-aware (dark/light mode support)
 * - Fully responsive design
 * 
 * This component replaces the previous blockchain network visualization
 * with a more thematic glass cube visual representing AI meets Blockchain.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURE_FLAGS } from '../config/featureFlags.js';
import './HeroSection.css';

const MATRIX_CHARS = "01ABCDEF#$%@";
const MATRIX_COLUMNS = 18; // number of vertical streams
const MATRIX_LENGTH = 26;  // characters per stream

function randomMatrixString(len) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
  }
  return out;
}

function MatrixColumn({ index }) {
  const [value, setValue] = React.useState(() => randomMatrixString(MATRIX_LENGTH));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setValue(randomMatrixString(MATRIX_LENGTH));
    }, 220 + index * 15); // small offset so streams feel different
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="matrix-column" style={{ animationDelay: `${index * -0.5}s` }}>
      <span>{value}</span>
    </div>
  );
}

export default function HeroSection() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('landing-page-theme');
    return savedTheme || 'dark';
  });
  
  const heroRef = useRef(null);

  // Listen for theme changes from parent page
  useEffect(() => {
    const checkTheme = () => {
      const currentTheme = localStorage.getItem('landing-page-theme') || 'dark';
      if (currentTheme !== theme) {
        setTheme(currentTheme);
      }
    };
    
    // Check theme on mount
    checkTheme();
    
    // Listen for storage changes (when theme toggle is used)
    const handleStorageChange = (e) => {
      if (e.key === 'landing-page-theme') {
        checkTheme();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes (fallback if storage event doesn't fire in same window)
    const interval = setInterval(checkTheme, 200);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [theme]);

  return (
    <section 
      className={`hero-section theme-${theme}`} 
      ref={heroRef}
      data-theme={theme}
    >
      <div className="hero-content">
        <h1 className="hero-title">OGC NewFinity: Where AI Meets Blockchain Innovation</h1>
        <p className="hero-subline">
          A unified digital ecosystem connecting creators, developers, and organizations through intelligent AI tools, secure blockchain infrastructure, and transparent token economics.
        </p>
        <div className="hero-buttons">
          <Link 
            to={FEATURE_FLAGS.DOWNLOADS ? "/download" : "/coming-soon?feature=Downloads"} 
            className="btn-primary"
          >
            <span className="btn-ripple"></span>
            Download Whitepaper
          </Link>
          <Link to="/community" className="btn-secondary">
            <span className="btn-ripple"></span>
            Join the Community
          </Link>
        </div>
        <p className="hero-support">
          Built on four foundational layers: Infrastructure, Application, Community, and Economic.
        </p>
      </div>
      
      <div className="hero-visual">
        <div className="matrix-layer">
          {Array.from({ length: MATRIX_COLUMNS }).map((_, i) => (
            <MatrixColumn key={i} index={i} />
          ))}
        </div>
        <div className="glass-cube">
          <div className="cube-face cube-face--front">
            <span className="engraved-ai">AI</span>
          </div>
          <div className="cube-face cube-face--back">
            <span className="engraved-ai">AI</span>
          </div>
          <div className="cube-face cube-face--left">
            <span className="engraved-ai">AI</span>
          </div>
          <div className="cube-face cube-face--right">
            <span className="engraved-ai">AI</span>
          </div>
          <div className="cube-face cube-face--top"></div>
          <div className="cube-face cube-face--bottom"></div>
        </div>
      </div>
    </section>
  );
}

// Matrix background updated: full-height falling code columns with continuous
// character changes, layered behind the cube.

