export function Logo({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Paper sheet emerging from top slot */}
      <rect x="9" y="2" width="10" height="9" rx="1.5" fill="currentColor" opacity="0.38" />
      {/* Content lines on the paper */}
      <rect x="11" y="4.5" width="6" height="1.1" rx="0.55" fill="currentColor" opacity="0.85" />
      <rect x="11" y="7" width="4" height="1.1" rx="0.55" fill="currentColor" opacity="0.5" />
      {/* Machine body */}
      <rect x="2" y="9" width="24" height="15" rx="3" fill="currentColor" />
      {/* Keypad row */}
      <circle cx="8" cy="15.5" r="1.4" fill="white" opacity="0.92" />
      <circle cx="12.5" cy="15.5" r="1.4" fill="white" opacity="0.42" />
      <circle cx="17" cy="15.5" r="1.4" fill="white" opacity="0.42" />
      {/* Status / display bar */}
      <rect x="8" y="19" width="12" height="2" rx="1" fill="white" opacity="0.18" />
    </svg>
  )
}
