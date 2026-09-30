import React from 'react';

export interface TestVerseLogoProps {
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  idPrefix?: string;
}

/**
 * TESTVERSE Architectural / Geometric Faceted Wordmark
 * Distinctive custom brand typography with angular structural letterforms
 * and blue, teal, cyan, gold faceted dimensional accents.
 */
export const TestVerseLogo: React.FC<TestVerseLogoProps> = ({
  height = 24,
  className = '',
  style = {},
  idPrefix = 'tv-logo',
}) => {
  const blueId = `${idPrefix}-blue-grad`;
  const darkId = `${idPrefix}-dark-grad`;
  const tealId = `${idPrefix}-teal-grad`;
  const cyanId = `${idPrefix}-cyan-grad`;
  const goldId = `${idPrefix}-gold-grad`;

  return (
    <svg
      role="img"
      aria-label="TESTVERSE"
      viewBox="0 0 320 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        height,
        width: 'auto',
        display: 'block',
        ...style,
      }}
    >
      <title>TESTVERSE</title>
      <defs>
        <linearGradient id={blueId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0062E0" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={darkId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#003E99" />
        </linearGradient>
        <linearGradient id={tealId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B388" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={cyanId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0062E0" />
        </linearGradient>
        <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <g>
        {/* T1 */}
        <path d="M 4 10 L 8 6 L 19 6 L 19 13 L 4 13 Z" fill={`url(#${cyanId})`} />
        <path d="M 19 6 L 30 6 L 34 10 L 34 13 L 19 13 Z" fill={`url(#${blueId})`} />
        <path d="M 15 13 L 19 13 L 19 38 L 15 38 Z" fill={`url(#${blueId})`} />
        <path d="M 19 13 L 23 13 L 23 34 L 19 38 Z" fill={`url(#${darkId})`} />
        <path d="M 19 38 L 23 34 L 23 38 Z" fill={`url(#${goldId})`} />

        {/* E1 */}
        <path d="M 40 10 L 44 6 L 44 38 L 40 38 Z" fill={`url(#${blueId})`} />
        <path d="M 44 6 L 47 6 L 47 38 L 44 38 Z" fill={`url(#${darkId})`} />
        <path d="M 47 6 L 64 6 L 68 10 L 68 13 L 47 13 Z" fill={`url(#${cyanId})`} />
        <path d="M 47 18 L 61 18 L 64 21 L 61 24 L 47 24 Z" fill={`url(#${tealId})`} />
        <path d="M 61 18 L 64 21 L 61 21 Z" fill={`url(#${goldId})`} />
        <path d="M 47 31 L 68 31 L 68 34 L 64 38 L 47 38 Z" fill={`url(#${blueId})`} />

        {/* S1 */}
        <path d="M 78 6 L 98 6 L 102 10 L 98 13 L 83 13 L 80 16 Z" fill={`url(#${cyanId})`} />
        <path d="M 74 13 L 80 16 L 78 19 L 74 16 Z" fill={`url(#${darkId})`} />
        <path d="M 74 19 L 81 16 L 97 22 L 102 26 L 96 27 L 78 22 Z" fill={`url(#${blueId})`} />
        <path d="M 97 22 L 102 26 L 96 26 Z" fill={`url(#${goldId})`} />
        <path d="M 96 27 L 102 26 L 102 32 L 96 35 Z" fill={`url(#${darkId})`} />
        <path d="M 74 34 L 78 31 L 96 31 L 96 35 L 92 38 L 78 38 L 74 34 Z" fill={`url(#${tealId})`} />

        {/* T2 */}
        <path d="M 108 10 L 112 6 L 123 6 L 123 13 L 108 13 Z" fill={`url(#${cyanId})`} />
        <path d="M 123 6 L 134 6 L 138 10 L 138 13 L 123 13 Z" fill={`url(#${blueId})`} />
        <path d="M 119 13 L 123 13 L 123 38 L 119 38 Z" fill={`url(#${blueId})`} />
        <path d="M 123 13 L 127 13 L 127 34 L 123 38 Z" fill={`url(#${darkId})`} />
        <path d="M 123 38 L 127 34 L 127 38 Z" fill={`url(#${goldId})`} />

        {/* V */}
        <path d="M 144 10 L 148 6 L 155 6 L 160 32 L 157 35 L 144 10 Z" fill={`url(#${cyanId})`} />
        <path d="M 165 6 L 172 6 L 176 10 L 163 35 L 160 32 L 165 6 Z" fill={`url(#${darkId})`} />
        <path d="M 157 35 L 163 35 L 160 38 Z" fill={`url(#${goldId})`} />

        {/* E2 */}
        <path d="M 182 10 L 186 6 L 186 38 L 182 38 Z" fill={`url(#${blueId})`} />
        <path d="M 186 6 L 189 6 L 189 38 L 186 38 Z" fill={`url(#${darkId})`} />
        <path d="M 189 6 L 206 6 L 210 10 L 210 13 L 189 13 Z" fill={`url(#${cyanId})`} />
        <path d="M 189 18 L 203 18 L 206 21 L 203 24 L 189 24 Z" fill={`url(#${tealId})`} />
        <path d="M 203 18 L 206 21 L 203 21 Z" fill={`url(#${goldId})`} />
        <path d="M 189 31 L 210 31 L 210 34 L 206 38 L 189 38 Z" fill={`url(#${blueId})`} />

        {/* R */}
        <path d="M 216 10 L 220 6 L 220 38 L 216 38 Z" fill={`url(#${blueId})`} />
        <path d="M 220 6 L 223 6 L 223 38 L 220 38 Z" fill={`url(#${darkId})`} />
        <path d="M 223 6 L 240 6 L 245 11 L 245 18 L 240 23 L 223 23 Z" fill={`url(#${cyanId})`} />
        <path d="M 223 11 L 236 11 L 239 14.5 L 236 18 L 223 18 Z" fill="#FFFFFF" />
        <path d="M 230 23 L 238 23 L 246 38 L 239 38 Z" fill={`url(#${tealId})`} />
        <path d="M 238 23 L 242 27 L 236 27 Z" fill={`url(#${goldId})`} />

        {/* S2 */}
        <path d="M 256 6 L 276 6 L 280 10 L 276 13 L 261 13 L 258 16 Z" fill={`url(#${cyanId})`} />
        <path d="M 252 13 L 258 16 L 256 19 L 252 16 Z" fill={`url(#${darkId})`} />
        <path d="M 252 19 L 259 16 L 275 22 L 280 26 L 274 27 L 256 22 Z" fill={`url(#${blueId})`} />
        <path d="M 275 22 L 280 26 L 274 26 Z" fill={`url(#${goldId})`} />
        <path d="M 274 27 L 280 26 L 280 32 L 274 35 Z" fill={`url(#${darkId})`} />
        <path d="M 252 34 L 256 31 L 274 31 L 274 35 L 270 38 L 256 38 L 252 34 Z" fill={`url(#${tealId})`} />

        {/* E3 */}
        <path d="M 286 10 L 290 6 L 290 38 L 286 38 Z" fill={`url(#${blueId})`} />
        <path d="M 290 6 L 293 6 L 293 38 L 290 38 Z" fill={`url(#${darkId})`} />
        <path d="M 293 6 L 310 6 L 314 10 L 314 13 L 293 13 Z" fill={`url(#${cyanId})`} />
        <path d="M 293 18 L 307 18 L 310 21 L 307 24 L 293 24 Z" fill={`url(#${tealId})`} />
        <path d="M 307 18 L 310 21 L 307 21 Z" fill={`url(#${goldId})`} />
        <path d="M 293 31 L 314 31 L 314 34 L 310 38 L 293 38 Z" fill={`url(#${blueId})`} />
      </g>
    </svg>
  );
};

/**
 * Compact Faceted Architectural Emblem for Collapsed Sidebar & Mobile
 */
export const TestVerseIcon: React.FC<TestVerseLogoProps> = ({
  height = 28,
  className = '',
  style = {},
  idPrefix = 'tv-icon',
}) => {
  const blueId = `${idPrefix}-blue-grad`;
  const darkId = `${idPrefix}-dark-grad`;
  const cyanId = `${idPrefix}-cyan-grad`;
  const goldId = `${idPrefix}-gold-grad`;

  return (
    <svg
      role="img"
      aria-label="TV"
      viewBox="0 0 38 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        height,
        width: 'auto',
        display: 'block',
        ...style,
      }}
    >
      <title>TV</title>
      <defs>
        <linearGradient id={blueId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0062E0" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={darkId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#003E99" />
        </linearGradient>
        <linearGradient id={cyanId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0062E0" />
        </linearGradient>
        <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <g>
        {/* Faceted T Architectural Emblem */}
        <path d="M 4 10 L 8 6 L 19 6 L 19 13 L 4 13 Z" fill={`url(#${cyanId})`} />
        <path d="M 19 6 L 30 6 L 34 10 L 34 13 L 19 13 Z" fill={`url(#${blueId})`} />
        <path d="M 15 13 L 19 13 L 19 38 L 15 38 Z" fill={`url(#${blueId})`} />
        <path d="M 19 13 L 23 13 L 23 34 L 19 38 Z" fill={`url(#${darkId})`} />
        <path d="M 19 38 L 23 34 L 23 38 Z" fill={`url(#${goldId})`} />
      </g>
    </svg>
  );
};

export default TestVerseLogo;
