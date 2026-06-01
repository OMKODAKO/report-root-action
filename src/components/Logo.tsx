type Props = { size?: number; className?: string };

export function Logo({ size = 72, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Take Care logo"
    >
      {/* concrete */}
      <rect x="4" y="48" width="64" height="20" rx="2" fill="#94a3b8" />
      {/* crack */}
      <path
        d="M34 68 L36 56 L33 52 L38 48"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* stem */}
      <path
        d="M36 48 C36 38, 34 32, 36 24"
        stroke="#16A34A"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* leaf */}
      <path
        d="M36 34 C30 32, 26 28, 26 24 C30 24, 34 26, 36 30 Z"
        fill="#4ADE80"
      />
      {/* petals */}
      <circle cx="36" cy="16" r="6" fill="#22C55E" />
      <circle cx="28" cy="20" r="5.5" fill="#4ADE80" />
      <circle cx="44" cy="20" r="5.5" fill="#4ADE80" />
      <circle cx="32" cy="11" r="5" fill="#86efac" />
      <circle cx="40" cy="11" r="5" fill="#86efac" />
      {/* center */}
      <circle cx="36" cy="16" r="2.5" fill="#F97316" />
    </svg>
  );
}
