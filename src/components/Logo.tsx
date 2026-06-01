type Props = { size?: number; className?: string };

export function Logo({ size = 72, className = "" }: Props) {
  const id = "tc-logo";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Take Care logo"
      role="img"
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="70%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </radialGradient>
        <linearGradient id={`${id}-concrete`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`${id}-stem`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient id={`${id}-petal`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </radialGradient>
        <radialGradient id={`${id}-center`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
          <feOffset dy="0.8" result="off" />
          <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Badge background */}
      <circle cx="36" cy="36" r="34" fill={`url(#${id}-bg)`} />
      <circle cx="36" cy="36" r="34" fill="none" stroke="#22c55e" strokeOpacity="0.25" strokeWidth="1" />

      {/* Concrete slab */}
      <path
        d="M6 58 Q6 52 12 52 L60 52 Q66 52 66 58 L66 64 Q66 66 64 66 L8 66 Q6 66 6 64 Z"
        fill={`url(#${id}-concrete)`}
      />
      {/* Jagged crack */}
      <path
        d="M38 66 L36 60 L39 56 L35 54 L37 52"
        stroke="#1e293b"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />

      <g filter={`url(#${id}-shadow)`}>
        {/* Stem */}
        <path
          d="M36 52 C36 44, 34 38, 36 30 C37 26, 36 22, 36 18"
          stroke={`url(#${id}-stem)`}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Leaves */}
        <path d="M36 40 C30 38, 26 34, 25 29 C30 29, 35 32, 36 37 Z" fill="#4ade80" />
        <path d="M36 34 C40 33, 44 30, 45 26 C41 26, 37 28, 36 32 Z" fill="#86efac" />

        {/* Flower — 6 rotated petals */}
        <g transform="translate(36 18)">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-5"
              rx="3.8"
              ry="5.5"
              fill={`url(#${id}-petal)`}
              transform={`rotate(${deg})`}
            />
          ))}
          <circle r="2.8" fill={`url(#${id}-center)`} />
        </g>
      </g>
    </svg>
  );
}
