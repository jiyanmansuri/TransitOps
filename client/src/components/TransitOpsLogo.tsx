import React from 'react';

interface TransitOpsLogoProps {
  /** Size in pixels for the hexagon icon */
  iconSize?: number;
  /** Show brand text ("TransitOps" + subtitle) next to the icon */
  showText?: boolean;
  /** Extra classes on the wrapper div */
  className?: string;
}

/**
 * TransitOps brand logo — hexagon with trend-line chart.
 *
 * Works in both dark and light themes:
 *   Dark mode  → purple hex on near-black sidebar / login panel
 *   Light mode → purple hex on white / light-gray background
 *
 * The hexagon fill uses the CSS variable that Tailwind exposes for
 * the `accent-amber` colour token so it automatically picks up the
 * correct shade from index.css in each theme.
 */
export default function TransitOpsLogo({
  iconSize = 36,
  showText = true,
  className = '',
}: TransitOpsLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* ── Hexagon SVG icon ── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="TransitOps logo"
        style={{ flexShrink: 0 }}
      >
        {/* Pointy-top regular hexagon — fill driven by CSS variable */}
        <polygon
          points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"
          style={{ fill: 'var(--logo-hex-fill, #9333ea)' }}
        />

        {/* Upward trend-line mimicking the stock-chart in the uploaded logo */}
        <polyline
          points="22,72 38,53 56,63 78,34"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Terminal circle dot */}
        <circle cx="78" cy="34" r="7" fill="white" />
      </svg>

      {showText && (
        <div>
          {/* Brand name */}
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-accent-amber logo-brand-text">
              TransitOps
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse shadow-[0_0_8px_#9333ea]" />
          </div>

          {/* Subtitle */}
          <div className="text-[8px] font-bold text-gray-500 tracking-widest uppercase mt-0.5">
            smart transport ops
          </div>
        </div>
      )}
    </div>
  );
}

