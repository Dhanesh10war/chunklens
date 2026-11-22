import React from 'react';

interface ChunkLensLogoProps {
  className?: string;
  size?: number;
}

/**
 * ChunkLens Brand Mark: The Partitioned Lens
 * Synthesizes document chunking (three discrete horizontal strata)
 * with optical inspection (a precision biconvex/circular lens with central focal aperture).
 */
export const ChunkLensLogo: React.FC<ChunkLensLogoProps> = ({
  className = 'h-5 w-5',
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Chunk Cap */}
      <path
        d="M 5 8 C 6.8 4.2 9.2 3 12 3 C 14.8 3 17.2 4.2 19 8 L 5 8 Z"
        className="fill-text"
      />
      {/* Inspected Focal Chunk in Brand Terracotta */}
      <rect
        x="2.5"
        y="10"
        width="19"
        height="4"
        rx="2"
        className="fill-accent"
      />
      {/* Central Optical Aperture */}
      <circle
        cx="12"
        cy="12"
        r="1.4"
        className="fill-bg"
      />
      {/* Bottom Chunk Cap */}
      <path
        d="M 5 16 C 6.8 19.8 9.2 21 12 21 C 14.8 21 17.2 19.8 19 16 L 5 16 Z"
        className="fill-text"
      />
    </svg>
  );
};
