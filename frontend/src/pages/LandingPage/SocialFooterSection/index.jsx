import React from 'react';
import './styles.css';

export default function SocialFooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-columns">
          <div className="footer-col footer-col--brand">
            <div className="footer-logo">OGC NewFinity</div>
            <p className="footer-text">
              A plasma-fast AI and blockchain infrastructure for building real products, tokenized ecosystems, and intelligent automation.
            </p>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <ul>
              <li><a href="/platform">Overview</a></li>
              <li><a href="/challenge-program">Challenge Program</a></li>
              <li><a href="/token">OGC Token</a></li>
              <li><a href="/ecosystem">Ecosystem</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Resources</h4>
            <ul>
              <li><a href="/docs">Developer Docs</a></li>
              <li><a href="/docs/roadmap">Roadmap</a></li>
              <li><a href="/docs/faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Connect</h4>
            <ul>
              <li><a href="mailto:contact@ogc-newfinity.com">Email</a></li>
              <li><a href="#">Discord / Community</a></li>
              <li><a href="#">X (Twitter)</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© {currentYear} OGC NewFinity. All rights reserved.</span>
          <div className="footer-legal">
            <a href="/legal/terms">Terms</a>
            <span>•</span>
            <a href="/legal/privacy">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

