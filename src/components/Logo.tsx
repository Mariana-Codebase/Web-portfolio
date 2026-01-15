import React from 'react';

interface LogoProps {
  size?: number;
  isDarkMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 200, isDarkMode = true }) => {
  const center = size / 2;
  const circleRadius = size * 0.42;
  const strokeWidth = size * 0.015;
  const fontSize = circleRadius * 0.55;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className="logo-svg"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <circle
        cx={center}
        cy={center}
        r={circleRadius}
        fill="none"
        stroke={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
        strokeWidth={strokeWidth}
      />

      <text
        x={center}
        y={center}
        fontSize={fontSize}
        fill={isDarkMode ? '#ffffff' : '#000000'}
        fontFamily="monospace"
        fontWeight="900"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ letterSpacing: '0.05em' }}
      >
        &lt;M/&gt;
      </text>
    </svg>
  );
};
