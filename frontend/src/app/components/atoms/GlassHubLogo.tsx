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
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_16px_rgba(6,182,212,0.55)] transition-transform hover:scale-105 duration-300 ${className}`}
    >
      <defs>
        {/* Cosmic Gradient (Purple -> Deep Blue -> Cyan) */}
        <linearGradient id="pulsarCosmic" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="80%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Vertical Light Beam Gradient */}
        <linearGradient id="pulsarBeam" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>

        {/* Glassmorphism Surface Gradient */}
        <linearGradient id="pulsarGlassCard" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.65" />
        </linearGradient>

        {/* Concentric Wave Gradient */}
        <linearGradient id="waveCyanViolet" x1="12" y1="32" x2="52" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.75" />
        </linearGradient>

        {/* Specular White Highlight */}
        <linearGradient id="specularGlow" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
        </linearGradient>

        {/* Deep Glow Filter */}
        <filter id="pulsarCoreGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Glassmorphic Rounded Outer Squircle */}
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="16"
        fill="url(#pulsarGlassCard)"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="1.2"
      />

      {/* Internal Specular Border */}
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="13"
        fill="none"
        stroke="url(#pulsarCosmic)"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* Concentric Signal Waves (Rhythmic Transmission) */}
      <circle cx="32" cy="32" r="23" stroke="url(#waveCyanViolet)" strokeWidth="1" strokeOpacity="0.35" />
      <circle cx="32" cy="32" r="18" stroke="url(#waveCyanViolet)" strokeWidth="1.2" strokeOpacity="0.55" />
      <circle cx="32" cy="32" r="13" stroke="url(#waveCyanViolet)" strokeWidth="1.4" strokeOpacity="0.75" />

      {/* Vertical Light Beam */}
      <path
        d="M30 4H34V60H30Z"
        fill="url(#pulsarBeam)"
        filter="url(#pulsarCoreGlow)"
        opacity="0.85"
      />

      {/* Secondary 8-Point Geometric Star (Background Facet) */}
      <polygon
        points="32,16 35.5,25.5 45,22 38.5,29 48,32 38.5,35 45,42 35.5,38.5 32,48 28.5,38.5 19,42 25.5,35 16,32 25.5,29 19,22 28.5,25.5"
        fill="#8b5cf6"
        fillOpacity="0.35"
        stroke="url(#pulsarCosmic)"
        strokeWidth="1"
      />

      {/* Primary 8-Point Geometric Star (Crystal Facets) */}
      <polygon
        points="32,12 36,25 49,20 40,29 52,32 40,35 49,44 36,39 32,52 28,39 15,44 24,35 12,32 24,29 15,20 28,25"
        fill="url(#pulsarCosmic)"
        fillOpacity="0.45"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Specular Inner Diamond Facets */}
      <polygon
        points="32,14 36,28 32,32 28,28"
        fill="url(#specularGlow)"
        fillOpacity="0.7"
      />
      <polygon
        points="32,32 36,36 32,50 28,36"
        fill="#3b82f6"
        fillOpacity="0.45"
      />
      <polygon
        points="14,32 28,28 32,32 28,36"
        fill="#06b6d4"
        fillOpacity="0.55"
      />
      <polygon
        points="32,32 36,28 50,32 36,36"
        fill="#a855f7"
        fillOpacity="0.55"
      />

      {/* High-Luminance Center Core (Pulsar Core) */}
      <circle cx="32" cy="32" r="5" fill="#ffffff" filter="url(#pulsarCoreGlow)" />
      <circle cx="32" cy="32" r="2.8" fill="#e0f2fe" />
      <circle cx="32" cy="32" r="1.2" fill="#ffffff" />
    </svg>
  );
};
