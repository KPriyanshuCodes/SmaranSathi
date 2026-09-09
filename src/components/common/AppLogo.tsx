import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  animate?: boolean;
}

/**
 * Smaran Sathi Regional Spiral Swirl Brand Logo
 * Based on the custom green 8-petal life swirl motif
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-6 h-6',
  size,
  animate = false,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animate ? 'hover:rotate-45 transition-transform duration-500' : ''}`}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Smaran Sathi Logo"
    >
      <defs>
        <linearGradient id="swirlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8E800" />
          <stop offset="100%" stopColor="#78BF00" />
        </linearGradient>
      </defs>
      <g fill="url(#swirlGrad)">
        {/* 8 Radial Swirling Petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            <path
              d="M 48 8 C 55 8 62 13 62 20 C 62 28 54 36 44 40 C 38 42 34 40 35 36 C 37 31 43 28 47 23 C 51 18 48 12 43 11 C 41 10 43 8 48 8 Z"
              className="transition-all duration-300"
            />
          </g>
        ))}
      </g>
    </svg>
  );
};

export default AppLogo;
