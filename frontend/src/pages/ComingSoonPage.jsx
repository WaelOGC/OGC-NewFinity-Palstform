/**
 * Coming Soon Page
 * 
 * A standalone "Coming Soon" page for the OGC NewFinity Platform.
 * This page provides a simple, stable landing page while the full platform is being developed.
 * 
 * Features:
 * - Hero block with title and description
 * - Launch status card with current phase and milestones
 * - Call-to-action buttons (Landing Page, Whitepaper, Community)
 * - Footer note
 * - Custom fusion-plasma background with elegant ring animation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css'; 
import '../styles/coming-soon.css';

export default function ComingSoonPage() {
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('landing-page-theme');
    return savedTheme || 'dark';
  });

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
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

    // Initialize particles
    const particleCount = 30;
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    // Plasma colors: blue → cyan → violet (no neon)
    const plasmaColors = {
      deepBlue: '#0a1a2e',
      plasmaBlue: '#1e3a5f',
      cyan: '#4dd0e1',
      softViolet: '#9575cd',
      whiteHot: '#ffffff',
    };

    // Draw plasma ring
    const drawPlasmaRing = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.15;
      const ringThickness = 2;

      // Create gradient for the ring: blue → cyan → violet
      const gradient = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY + baseRadius
      );
      gradient.addColorStop(0, plasmaColors.cyan);
      gradient.addColorStop(0.5, plasmaColors.softViolet);
      gradient.addColorStop(1, plasmaColors.cyan);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time * 0.0005); // Very slow, subtle rotation

      // Draw outer ring
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = ringThickness;
      ctx.globalAlpha = 0.6;
      ctx.stroke();

      // Draw inner glow
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius - ringThickness, 0, Math.PI * 2);
      ctx.strokeStyle = plasmaColors.whiteHot;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.stroke();

      // Draw center core
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.3, 0, Math.PI * 2);
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.3);
      coreGradient.addColorStop(0, plasmaColors.whiteHot);
      coreGradient.addColorStop(0.5, plasmaColors.cyan);
      coreGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGradient;
      ctx.globalAlpha = 0.4;
      ctx.fill();

      ctx.restore();
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
      gradient.addColorStop(0.6, '#0d1b2a');
      gradient.addColorStop(1, '#050811');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Draw particles
    const drawParticles = () => {
      particlesRef.current.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77, 208, 225, ${particle.opacity})`;
        ctx.fill();
      });
    };

    // Update particles
    const updateParticles = () => {
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      });
    };

    // Animation loop
    const animate = () => {
      time += 16; // ~60fps
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawPlasmaBackground();
      drawParticles();
      drawPlasmaRing();
      updateParticles();

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
    <main className={`coming-soon-root ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* Custom Fusion-Plasma Background Layer */}
      <canvas id="plasma-canvas" ref={canvasRef} className="plasma-canvas" />

      <div className="coming-soon-container">
        {/* Hero Block */}
        <section className="cs-hero-section">
          <h1 className="cs-hero-title">OGC NewFinity Platform</h1>
          <p className="cs-hero-subtitle">
            The live dashboards are coming soon. The core ecosystem is already online.
          </p>
          <p className="cs-hero-description">
            The platform is under active development. The landing site and whitepaper are available now. 
            Users can join the community to follow progress and stay updated on upcoming features.
          </p>
        </section>

        {/* Launch Status Card */}
        <section className="cs-status-section">
          <div className="glass-card cs-status-card">
            <div className="cs-status-label">Current status</div>
            <div className="cs-status-phase">Phase: Platform Development</div>
            <div className="cs-milestones">
              <h3 className="cs-milestones-title">Next Milestones</h3>
              <ul className="cs-milestones-list">
                <li>User dashboard</li>
                <li>Wallet integration</li>
                <li>Challenge Program portal</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call-to-Action Buttons */}
        <section className="cs-cta-section">
          <div className="cs-cta-buttons">
            <Link to="/" className="btn-primary">
              <span className="btn-ripple"></span>
              View Landing Page
            </Link>
            {/* TODO: Replace # with actual whitepaper URL when available */}
            <a href="#" className="btn-secondary">
              <span className="btn-ripple"></span>
              Download Whitepaper
            </a>
            {/* TODO: Replace # with actual community link when available */}
            <a href="#" className="btn-secondary">
              <span className="btn-ripple"></span>
              Join the Community
            </a>
          </div>
        </section>

        {/* Footer Note */}
        <section className="cs-footer-section">
          <p className="cs-footer-text">
            © OGC NewFinity — Platform preview. Production release timeline will be announced on the main site.
          </p>
        </section>
      </div>
    </main>
  );
}
