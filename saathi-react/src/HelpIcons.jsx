export function JusticeIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v3M8 6h8M6 9h12l-2 10H8L6 9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 6h4M16 6h4M12 6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
    </svg>
  );
}

export function TarotIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="4" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" transform="rotate(-8 10 11)"/>
      <rect x="9" y="6" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" transform="rotate(8 14 13)"/>
      <circle cx="10" cy="10" r="1.2" fill="currentColor" opacity="0.8"/>
      <path d="M14 14l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function KundliIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 12h16M12 4v16M4 8h16M4 16h16M8 4v16M16 4v16" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.9"/>
    </svg>
  );
}
