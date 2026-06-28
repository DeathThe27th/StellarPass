import Link from "next/link";

/* ---- minimal, consistent icon set (1.6 stroke) ---- */
type IP = { size?: number };
const S = (size = 16) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const });

export const IconShield = ({ size }: IP) => (
  <svg {...S(size)}><path d="M12 3l7 3v5c0 4.4-3 8.2-7 9.4C8 18.2 5 14.4 5 11V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconCheck = ({ size }: IP) => (
  <svg {...S(size)}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconArrow = ({ size }: IP) => (
  <svg {...S(size)}><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconBack = ({ size }: IP) => (
  <svg {...S(size)}><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconLock = ({ size }: IP) => (
  <svg {...S(size)}><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const IconX = ({ size }: IP) => (
  <svg {...S(size)}><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const IconChip = ({ size }: IP) => (
  <svg {...S(size)}><rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M9.5 9.5h5v5h-5z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const IconLink = ({ size }: IP) => (
  <svg {...S(size)}><path d="M10 14a4 4 0 005.66 0l2.34-2.34a4 4 0 00-5.66-5.66L11 7.34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 10a4 4 0 00-5.66 0L6 12.34a4 4 0 005.66 5.66L13 16.66" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function Logo({ withWord = true }: { withWord?: boolean }) {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6L12 2z" fill="#ffffff" />
        </svg>
      </span>
      {withWord && <span>StellarPass</span>}
    </Link>
  );
}

export function Nav({ cta = true }: { cta?: boolean }) {
  return (
    <nav className="nav">
      <Logo />
      <div className="nav-links">
        <Link href="/check" className="nav-link hide-mobile">Check a wallet</Link>
        <Link href="/demo" className="nav-link hide-mobile">RWA demo</Link>
        {cta && (
          <Link href="/verify" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.88rem" }}>
            Get verified
          </Link>
        )}
      </div>
    </nav>
  );
}

/* Inner-page nav: only the back button and the StellarPass logo. */
export function FlowNav() {
  return (
    <nav className="nav">
      <Link href="/" className="nav-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconBack size={18} /> Back
      </Link>
      <Logo />
      <span aria-hidden style={{ width: 56 }} />
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container row between" style={{ flexWrap: "wrap", gap: 16 }}>
        <Logo />
      </div>
    </footer>
  );
}
