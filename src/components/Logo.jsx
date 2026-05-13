export function Logo({ size = 20 }) {
  const s = size
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* paper emerging from top */}
      <rect x="9" y="1" width="10" height="10" rx="1" fill="currentColor" opacity="0.18" />
      <rect x="11" y="3" width="6" height="1.2" rx="0.6" fill="currentColor" opacity="0.55" />
      <rect x="11" y="5.2" width="6" height="1.2" rx="0.6" fill="currentColor" opacity="0.55" />
      <rect x="11" y="7.4" width="4" height="1.2" rx="0.6" fill="currentColor" opacity="0.55" />

      {/* machine body */}
      <rect x="3" y="9" width="22" height="14" rx="2.5" fill="currentColor" opacity="0.85" />

      {/* paper slot line */}
      <rect x="8" y="9" width="12" height="2" rx="0" fill="currentColor" opacity="0.22" />

      {/* keypad dots */}
      <circle cx="9.5"  cy="16" r="1.3" fill="currentColor" opacity="0.22" />
      <circle cx="14"   cy="16" r="1.3" fill="currentColor" opacity="0.22" />
      <circle cx="18.5" cy="16" r="1.3" fill="currentColor" opacity="0.22" />
      <circle cx="9.5"  cy="20" r="1.3" fill="currentColor" opacity="0.22" />
      <circle cx="14"   cy="20" r="1.3" fill="currentColor" opacity="0.22" />
      <circle cx="18.5" cy="20" r="1.3" fill="currentColor" opacity="0.22" />

      {/* status bar */}
      <rect x="6" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" opacity="0.18" />
    </svg>
  )
}
