import React from 'react';

interface GlassHubLogoProps {
  size?: number;
  className?: string;
}

export const GlassHubLogo: React.FC<GlassHubLogoProps> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] ${className}`}
    >
      <defs>
        <linearGradient id="glassPrismGrad1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="glassPrismGlow" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
        </linearGradient>
        <filter id="prismGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Outer Crystal Mesh */}
      <polygon
        points="24,4 42,14 42,34 24,44 6,34 6,14"
        fill="url(#glassPrismGrad1)"
        fillOpacity="0.25"
        stroke="url(#glassPrismGrad1)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Internal Specular Glass Facets */}
      <polygon
        points="24,4 42,14 24,24 6,14"
        fill="url(#glassPrismGlow)"
        fillOpacity="0.4"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1.2"
      />
      <polygon
        points="6,14 24,24 24,44 6,34"
        fill="#06b6d4"
        fillOpacity="0.35"
        stroke="rgba(6, 182, 212, 0.5)"
        strokeWidth="1.2"
      />
      <polygon
        points="42,14 42,34 24,44 24,24"
        fill="#8b5cf6"
        fillOpacity="0.35"
        stroke="rgba(139, 92, 246, 0.5)"
        strokeWidth="1.2"
      />

      {/* Center Core Floating Gem */}
      <circle cx="24" cy="24" r="4.5" fill="#ffffff" filter="url(#prismGlowFilter)" />
      <circle cx="24" cy="24" r="2.5" fill="#38bdf8" />
    </svg>
  );
};
