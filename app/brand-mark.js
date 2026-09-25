"use client";

import { useId } from 'react';

export default function BrandMark({ className = '' }) {
  const gradientId = useId();
  return (
    <svg className={'kitsley-mark ' + className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="8" y1="56" x2="56" y2="8">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.4" stopColor="#7C3AED" />
          <stop offset="0.7" stopColor="#DB2777" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <path d="M10 9V27M10 37V55M20 9V27M20 37V55M28 27L46 9M55 14L37 32L55 50M28 37L46 55" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
