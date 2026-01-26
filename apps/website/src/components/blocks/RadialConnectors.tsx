import React from 'react';

interface RadialConnectorsProps {
  radius: number;
  centerX: number;
  centerY: number;
  angles: number[];
}

export const RadialConnectors: React.FC<RadialConnectorsProps> = ({
  radius,
  centerX,
  centerY,
  angles,
}) => {
  return (
    <svg
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(10, 78, 142)" stopOpacity="0.6" />
          <stop offset="50%" stopColor="rgb(148, 163, 184)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(10, 78, 142)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {angles.map((angle, index) => {
        const angleRad = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);

        return (
          <line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        );
      })}
    </svg>
  );
};
