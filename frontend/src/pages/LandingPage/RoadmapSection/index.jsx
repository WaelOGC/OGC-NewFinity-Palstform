import React, { useRef, useEffect } from 'react';
import './styles.css';

export default function RoadmapSection() {
  const timelineRef = useRef(null);
  const leftBtnRef = useRef(null);
  const rightBtnRef = useRef(null);

  useEffect(() => {
    const timeline = timelineRef.current;
    const leftBtn = leftBtnRef.current;
    const rightBtn = rightBtnRef.current;

    if (!timeline || !leftBtn || !rightBtn) return;

    const SCROLL = 320;

    const handleLeftClick = () => {
      timeline.scrollBy({ left: -SCROLL, behavior: 'smooth' });
    };

    const handleRightClick = () => {
      timeline.scrollBy({ left: SCROLL, behavior: 'smooth' });
    };

    const handleWheel = (e) => {
      e.preventDefault();
      timeline.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    };

    leftBtn.addEventListener('click', handleLeftClick);
    rightBtn.addEventListener('click', handleRightClick);
    timeline.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      leftBtn.removeEventListener('click', handleLeftClick);
      rightBtn.removeEventListener('click', handleRightClick);
      timeline.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <section className="platform-roadmap">
      <div className="platform-roadmap__inner">
        <div className="roadmap-header">
          <span className="roadmap-eyebrow">PLATFORM ROADMAP</span>
          <h2 className="roadmap-title">Development Timeline</h2>
          <p className="roadmap-description">
            The OGC NewFinity roadmap outlines how the platform moves from core infrastructure to a fully integrated AI and blockchain ecosystem. Each quarter introduces a focused release: platform foundation, Amy AI Agent capabilities, token launch on Polygon, and ecosystem expansion with partner integrations and new automation tracks. This public view highlights only the major milestones; technical details, internal iterations, and implementation plans are documented separately inside the{' '}
            <a href="/docs/roadmap" className="roadmap-link">full roadmap specification</a> for contributors and ecosystem partners.
          </p>
        </div>

        <div className="roadmap-shell">
          <button 
            className="roadmap-nav roadmap-nav--left" 
            ref={leftBtnRef}
            aria-label="Scroll roadmap left"
          >
            ‹
          </button>

          <div className="roadmap-timeline" ref={timelineRef}>
            {/* 5 confirmed milestones */}
            <div className="roadmap-node roadmap-node--confirmed">
              <span className="roadmap-quarter">Q1 2026</span>
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Platform Genesis Launch</span>
            </div>

            <div className="roadmap-node roadmap-node--confirmed">
              <span className="roadmap-quarter">Q2 2026</span>
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Amy AI Agent (Public Beta)</span>
            </div>

            <div className="roadmap-node roadmap-node--confirmed">
              <span className="roadmap-quarter">Q3 2026</span>
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">OGC Token Genesis on Polygon</span>
            </div>

            <div className="roadmap-node roadmap-node--confirmed">
              <span className="roadmap-quarter">Q4 2026</span>
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Ecosystem Expansion & Partner Integrations</span>
            </div>

            <div className="roadmap-node roadmap-node--confirmed">
              <span className="roadmap-quarter">Q1 2027</span>
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Advanced Automation & New Service Tracks</span>
            </div>

            {/* 5 coming-soon placeholders */}
            <div className="roadmap-node roadmap-node--soon">
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Coming Soon</span>
            </div>

            <div className="roadmap-node roadmap-node--soon">
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Coming Soon</span>
            </div>

            <div className="roadmap-node roadmap-node--soon">
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Coming Soon</span>
            </div>

            <div className="roadmap-node roadmap-node--soon">
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Coming Soon</span>
            </div>

            <div className="roadmap-node roadmap-node--soon">
              <div className="roadmap-line">
                <span className="roadmap-dot"></span>
              </div>
              <span className="roadmap-node-title">Coming Soon</span>
            </div>
          </div>

          <button 
            className="roadmap-nav roadmap-nav--right" 
            ref={rightBtnRef}
            aria-label="Scroll roadmap right"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
