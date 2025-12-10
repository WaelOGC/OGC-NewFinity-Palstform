import React from 'react';
import './styles.css';

// SVG Icon Components
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GitHubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
  </svg>
);

const DiscordIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const ScrollUpIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 15l-6-6-6 6"/>
  </svg>
);

export default function SocialFooterSection() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
            </ul>
            <div className="social-footer">
              <a
                href="https://x.com/OGCNewfinity"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OGC NewFinity on X (Twitter)"
                className="social-footer__link"
              >
                <XIcon className="social-footer__icon" />
              </a>
              <a
                href="https://www.linkedin.com/company/ogc-newfinity/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OGC NewFinity on LinkedIn"
                className="social-footer__link"
              >
                <LinkedInIcon className="social-footer__icon" />
              </a>
              <a
                href="https://github.com/OGC-NewFinity"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OGC NewFinity on GitHub"
                className="social-footer__link"
              >
                <GitHubIcon className="social-footer__icon" />
              </a>
              <a
                href="https://discord.gg/k8RYhkzQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OGC NewFinity on Discord"
                className="social-footer__link"
              >
                <DiscordIcon className="social-footer__icon" />
              </a>
            </div>
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
      <button
        onClick={scrollToTop}
        className="scroll-to-top-btn"
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ScrollUpIcon className="scroll-to-top-icon" />
      </button>
    </footer>
  );
}

