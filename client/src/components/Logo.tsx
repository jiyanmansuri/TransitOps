import React from 'react';

interface LogoProps {
  type?: 'mark' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ type = 'full', size = 'md', className = '' }: LogoProps) {
  // Hexagon dimensions based on size
  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-lg', tagline: 'text-[9px]' },
    md: { box: 'w-10 h-10', text: 'text-2xl', tagline: 'text-[11px]' },
    lg: { box: 'w-14 h-14', text: 'text-4xl', tagline: 'text-[14px]' }
  };

  const dims = sizeMap[size];

  // The hexagon SVG mark (pure SVG matching the uploaded image)
  const hexMark = (
    <svg viewBox="0 0 100 100" className={`${dims.box} flex-shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hexagon with pointy top (#6B4D62) */}
      <polygon points="50,5 93,30 93,70 50,95 7,70 7,30" fill="#6B4D62" />
      {/* Trendline inside hexagon */}
      <path d="M22,60 L42,42 L62,56 L76,34" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      {/* End Circle on trendline */}
      <circle cx="76" cy="34" r="7" fill="#FFFFFF" />
    </svg>
  );

  if (type === 'mark') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{hexMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {hexMark}
      <div className="flex flex-col justify-center text-left">
        <span className={`font-extrabold tracking-tight leading-none text-gray-900 dark:text-gray-50 ${dims.text}`}>
          TransitOps
        </span>
        <span className={`font-medium tracking-normal text-gray-500 dark:text-gray-400 mt-1.5 lowercase leading-none ${dims.tagline}`}>
          smart transport operations platform
        </span>
      </div>
    </div>
  );
}
