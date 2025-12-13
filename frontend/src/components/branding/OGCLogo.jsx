/**
 * OGC Logo Component
 * 
 * Theme-aware logo component that switches between dark/light variants
 * based on the current theme setting.
 * 
 * Rules:
 * - Dark mode → uses ogc-logo-light.png (light logo on dark background)
 * - Light mode → uses ogc-logo-dark.png (dark logo on light background)
 * - Compact size: 28-36px height max
 * - Subtle plasma glow on hover only
 * - Slight lift on hover
 */

import { useTheme } from '../../context/ThemeContext.jsx';
import logoDark from '../../assets/branding/ogc-logo-dark.png';
import logoLight from '../../assets/branding/ogc-logo-light.png';
import './OGCLogo.css';

export default function OGCLogo({ className = '', onClick, ...props }) {
  const { theme } = useTheme();
  
  // Dark mode uses light logo, light mode uses dark logo
  const logoSrc = theme === 'dark' ? logoLight : logoDark;
  const altText = 'OGC NewFinity';

  return (
    <img
      src={logoSrc}
      alt={altText}
      className={`ogc-logo ${className}`}
      onClick={onClick}
      {...props}
    />
  );
}
