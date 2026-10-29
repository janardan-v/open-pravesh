import type { SVGProps } from 'react'

interface OpenPraveshLogoProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function OpenPraveshLogo({ size = 32, className, ...props }: OpenPraveshLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OpenPravesh Liquid Mercury Portal Emblem"
      {...props}
    >
      <defs>
        {/* Outer Shield / Portal Metallic Chrome Gradient */}
        <linearGradient id="op-chrome-portal" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="55%" stopColor="#94A3B8" />
          <stop offset="85%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Inner Liquid Core Gradient */}
        <radialGradient id="op-liquid-orb" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#CBD5E1" />
          <stop offset="75%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>

        {/* Specular Rim Sheen */}
        <linearGradient id="op-rim-sheen" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Ambient Metallic Glow Drop Filter Behind Emblem */}
      <circle cx="18" cy="18" r="16" fill="rgba(255, 255, 255, 0.04)" />

      {/* Outer Hexagonal Gateway / Portal Shield */}
      <path
        d="M18 3.5L30.5 10.7V25.3L18 32.5L5.5 25.3V10.7L18 3.5Z"
        fill="#0D0F14"
        stroke="url(#op-chrome-portal)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Beveled Facet Cuts for 3D Chiseled Chrome Feel */}
      <path
        d="M18 3.5V11M30.5 10.7L24 14.5M30.5 25.3L24 21.5M18 32.5V25M5.5 25.3L12 21.5M5.5 10.7L12 14.5"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Inner Gateway Arch ("Pravesh" / Entrance Keyhole) */}
      <path
        d="M14 25V18C14 15.7909 15.7909 14 18 14C20.2091 14 22 15.7909 22 18V25H14Z"
        fill="rgba(16, 18, 23, 0.95)"
        stroke="url(#op-rim-sheen)"
        strokeWidth="1.5"
      />

      {/* Floating Central Liquid Mercury Core (Cryptographic Seed) */}
      <circle
        cx="18"
        cy="18.5"
        r="3.8"
        fill="url(#op-liquid-orb)"
        stroke="#FFFFFF"
        strokeWidth="1"
      />

      {/* Specular Glint Reflection on Core */}
      <ellipse
        cx="16.8"
        cy="16.8"
        rx="1.2"
        ry="0.8"
        fill="#FFFFFF"
        opacity="0.9"
        transform="rotate(-25 16.8 16.8)"
      />
    </svg>
  )
}
