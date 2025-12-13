/**
 * Coming Soon Page
 * 
 * A standalone "Coming Soon" page for the OGC NewFinity Platform.
 * Features a plasma-style animated background with centered logo, title, description, and social links.
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../../styles/coming-soon.css';
import './styles.css';

export default function ComingSoonPage() {
  const [searchParams] = useSearchParams();
  const featureName = searchParams.get('feature') || 'This feature';
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Plasma colors: deep blues, violets, turquoise/cyan
    const plasmaColors = {
      deepBlue: '#0a1a2e',
      darkBlue: '#0d1b2a',
      plasmaBlue: '#1e3a5f',
      cyan: '#4dd0e1',
      turquoise: '#26a69a',
      softViolet: '#9575cd',
      violet: '#7e57c2',
    };

    // Draw plasma energy waves
    const drawPlasmaWaves = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.max(canvas.width, canvas.height) * 0.6;

      // Create multiple wave layers for organic plasma effect
      for (let layer = 0; layer < 3; layer++) {
        const layerTime = time * (0.0003 + layer * 0.0001);
        const radius = maxRadius * (0.4 + layer * 0.2);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Create gradient for each wave
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        const phase = (layerTime + layer * Math.PI / 3) % (Math.PI * 2);
        
        if (layer === 0) {
          gradient.addColorStop(0, `rgba(77, 208, 225, ${0.15 + Math.sin(phase) * 0.1})`);
          gradient.addColorStop(0.5, `rgba(149, 117, 205, ${0.1 + Math.cos(phase) * 0.08})`);
          gradient.addColorStop(1, 'transparent');
        } else if (layer === 1) {
          gradient.addColorStop(0, `rgba(38, 166, 154, ${0.12 + Math.sin(phase * 1.3) * 0.08})`);
          gradient.addColorStop(0.4, `rgba(126, 87, 194, ${0.08 + Math.cos(phase * 1.2) * 0.06})`);
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, `rgba(77, 208, 225, ${0.08 + Math.sin(phase * 0.8) * 0.05})`);
          gradient.addColorStop(0.6, `rgba(149, 117, 205, ${0.05 + Math.cos(phase * 0.9) * 0.04})`);
          gradient.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    };

    // Draw plasma beams (energy streams)
    const drawPlasmaBeams = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const numBeams = 8;
      
      for (let i = 0; i < numBeams; i++) {
        const angle = (Math.PI * 2 / numBeams) * i + time * 0.0002;
        const beamLength = Math.min(canvas.width, canvas.height) * 0.4;
        const beamWidth = 2;
        const x1 = centerX;
        const y1 = centerY;
        const x2 = centerX + Math.cos(angle) * beamLength;
        const y2 = centerY + Math.sin(angle) * beamLength;
        
        // Create gradient along the beam
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        const opacity = 0.15 + Math.sin(time * 0.003 + i) * 0.1;
        gradient.addColorStop(0, `rgba(77, 208, 225, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(149, 117, 205, ${opacity * 0.7})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = beamWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    // Draw background plasma gradient
    const drawPlasmaBackground = () => {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.8
      );
      gradient.addColorStop(0, plasmaColors.plasmaBlue);
      gradient.addColorStop(0.3, plasmaColors.deepBlue);
      gradient.addColorStop(0.6, plasmaColors.darkBlue);
      gradient.addColorStop(1, '#050811');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Animation loop
    const animate = () => {
      time += 16; // ~60fps
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawPlasmaBackground();
      drawPlasmaWaves();
      drawPlasmaBeams();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <main className="coming-soon-root">
      {/* Plasma Background Canvas */}
      <canvas ref={canvasRef} className="plasma-canvas" />

      {/* Content Overlay */}
      <div className="coming-soon-content">
        {/* Logo */}
        <div className="cs-logo">
          <div className="cs-logo-text">OGC</div>
          <div className="cs-logo-subtext">NewFinity</div>
        </div>

        {/* Main Title */}
        <h1 className="cs-title">
          {featureName !== 'This feature' ? `${featureName} - Coming Soon` : 'OGC NewFinity Platform'}
        </h1>

        {/* Description */}
        <div className="cs-description">
          {featureName !== 'This feature' ? (
            <p>
              <strong>{featureName}</strong> is under active development. We're working hard to bring you
              this feature and will make it available as soon as it's ready. Thank you for your patience
              and interest in the OGC NewFinity Platform.
            </p>
          ) : (
            <>
              <p>
                The OGC NewFinity Platform is currently under active development. We are building a unified ecosystem that integrates advanced AI tools, blockchain infrastructure, and comprehensive community features into a single, cohesive platform. This system will bring together productivity tools, AI-powered services, blockchain integrations, and community-driven initiatives to create a seamless experience for users, developers, and contributors.
              </p>
              <p>
                Our current focus is on establishing a robust architecture, implementing enterprise-grade security measures, optimizing system performance, and ensuring long-term reliability. The platform will provide users and contributors with intuitive dashboards, powerful development tools, and seamless access to services across the OGC NewFinity ecosystem. We are prioritizing scalability, security, and user experience as foundational elements of the platform.
              </p>
              <p>
                Once complete, the platform will deliver comprehensive dashboards for managing accounts, tokens, and contributions. It will offer integrated tools for development, collaboration, and innovation. The system is designed to support the OGC NewFinity Challenge Program, token management, AI agent services, and future governance features. We appreciate your patience and interest as we continue to develop and refine the platform. Thank you for being part of this journey.
              </p>
            </>
          )}
        </div>

        {/* Social Links */}
        <div className="cs-social-links">
          <a 
            href="https://x.com/OGCNewfinity" 
            target="_blank" 
            rel="noreferrer"
            className="cs-social-link"
            aria-label="Follow on X (Twitter)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </a>
          <a 
            href="https://www.linkedin.com/company/ogc-newfinity/" 
            target="_blank" 
            rel="noreferrer"
            className="cs-social-link"
            aria-label="Follow on LinkedIn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a 
            href="https://github.com/OGC-NewFinity" 
            target="_blank" 
            rel="noreferrer"
            className="cs-social-link"
            aria-label="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
          <a 
            href="https://discord.gg/GMW55fK8" 
            target="_blank" 
            rel="noreferrer"
            className="cs-social-link"
            aria-label="Join Discord"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
        </div>
      </div>
    </main>
  );
}
