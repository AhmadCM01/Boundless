import React from 'react';

interface BrandLogoProps {
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* 4 Colored Arc Segments forming a Continuous Infinite Loop */}
      {/* Segment 1: Warm Yellow Top-Left Arc */}
      <path
        d="M 30 15 A 15 15 0 0 0 15 30 A 15 15 0 0 0 30 45 C 42 45 50 30 50 30"
        stroke="#F5B93F"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Segment 2: Coral Red Top-Right Arc */}
      <path
        d="M 50 30 C 50 30 58 15 70 15 A 15 15 0 0 1 85 30"
        stroke="#EF5350"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Segment 3: Mint Green Bottom-Right Arc */}
      <path
        d="M 85 30 A 15 15 0 0 1 70 45 C 58 45 50 30 50 30"
        stroke="#3DD9A6"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Segment 4: Vibrant Orange Bottom-Left Arc */}
      <path
        d="M 50 30 C 50 30 42 15 30 15"
        stroke="#FF9448"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
};
