import Link from "next/link";

const ASSETS = [
  { name: "Franklin Templeton BENJI", type: "Money Market Fund" },
  { name: "Spiko USTBL", type: "T-Bill Token" },
  { name: "WisdomTree Funds", type: "Digital Fund" },
  { name: "Centrifuge Bonds", type: "Real-World Asset" },
  { name: "SG-Forge EURCV", type: "Digital Currency" },
];

export default function Home() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#111827", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ height: 52, borderBottom: "1px solid #E5E7EB", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 5, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 6L6 11L1 6L6 1Z" fill="white" fillOpacity="0.95"/></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>StellarPass</span>
        </div>
        <Link href="/verify" style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Get Verified</Link>
      </nav>

      {/* Hero */}
      <section style={{ padding: "88px 24px 72px", textAlign: "center", background: "linear-gradient(180deg, #F0F7FF 0%, #ffffff 100%)", borderBottom: "1px solid #E5E7EB" }}>
        <h1 className="sp-display" style={{ fontSize: 60, fontWeight: 400, color: "#111827", lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 22 }}>
          Prove you&apos;re verified.<br /><em style={{ fontStyle: "italic", color: "#2563EB" }}>Access every regulated<br />asset on Stellar.</em>
        </h1>
        <p style={{ color: "#6B7280", fontSize: 17, maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.65 }}>
          One ZK proof. Every SEP-57 token. Your identity stays private — only the proof goes on-chain.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/verify" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563EB", color: "white", borderRadius: 6, padding: "12px 24px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Start verification
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link href="/check" style={{ background: "none", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 6, padding: "10px 22px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Check a wallet</Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", maxWidth: 380, margin: "56px auto 0", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", background: "white" }}>
          {[["$2B+", "RWA on Stellar"], ["ZK", "No data on-chain"], ["SEP-57", "Native standard"]].map(([v, l], i) => (
            <div key={l} style={{ padding: "16px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid #E5E7EB" : "none" }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>{v}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "64px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>How it works</div>
          <h2 className="sp-display" style={{ fontSize: 34, fontWeight: 400, color: "#111827", letterSpacing: "-0.01em", marginBottom: 48, lineHeight: 1.2 }}>From KYC form to on-chain stamp<br />in under two minutes.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "#E5E7EB", borderRadius: 8, overflow: "hidden" }}>
            {[
              { n: "01", t: "Submit KYC", b: "Fill in your details. Our mock issuer validates and signs a credential." },
              { n: "02", t: "Generate Proof", b: "A Noir ZK circuit runs in the browser. Your data never leaves your device." },
              { n: "03", t: "Stamp On-Chain", b: "The proof is submitted to our Soroban registry contract on Stellar testnet." },
              { n: "04", t: "Access Assets", b: "Any SEP-57 token calls verify_identity() on our registry before allowing transfers." },
            ].map((s) => (
              <div key={s.n} style={{ background: "white", padding: 24 }}>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#2563EB", marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65 }}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section style={{ padding: "64px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>Architecture</div>
          <h2 className="sp-display" style={{ fontSize: 34, fontWeight: 400, color: "#111827", letterSpacing: "-0.01em", marginBottom: 48, lineHeight: 1.2 }}>Built on real cryptography,<br />not promises.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#E5E7EB", borderRadius: 8, overflow: "hidden" }}>
            {[
              { icon: "⬡", t: "ZK Proof", b: "Your identity is proven with a zero-knowledge circuit. Personal data never leaves your device." },
              { icon: "◈", t: "One-Time KYC", b: "Verify once with StellarPass. Every SEP-57 regulated asset on Stellar accepts your stamp." },
              { icon: "◎", t: "On-Chain Registry", b: "Your verification stamp lives in a Soroban smart contract — transparent, auditable, permanent." },
            ].map((f) => (
              <div key={f.t} style={{ background: "white", padding: "28px 24px" }}>
                <div style={{ fontSize: 18, color: "#2563EB", marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 8 }}>{f.t}</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65 }}>{f.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assets */}
      <section style={{ padding: "64px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>Compatible Assets</div>
          <h2 className="sp-display" style={{ fontSize: 34, fontWeight: 400, color: "#111827", letterSpacing: "-0.01em", marginBottom: 48, lineHeight: 1.2 }}>One stamp. Every regulated<br />asset on Stellar.</h2>
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
            {ASSETS.map((a, i) => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < ASSETS.length - 1 ? "1px solid #E5E7EB" : "none", background: "white" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#BFDBFE", border: "1.5px solid #2563EB", marginRight: 12 }} />
                  <span style={{ fontSize: 14, color: "#111827" }}>{a.name}</span>
                </div>
                <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "3px 8px", borderRadius: 4 }}>{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center", background: "#EFF6FF", borderBottom: "1px solid #BFDBFE" }}>
        <h2 className="sp-display" style={{ fontSize: 40, fontWeight: 400, color: "#111827", letterSpacing: "-0.01em", marginBottom: 14 }}>Ready to get yours?</h2>
        <p style={{ color: "#6B7280", marginBottom: 32, fontSize: 14 }}>Takes under two minutes. Your identity stays private.</p>
        <Link href="/verify" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563EB", color: "white", borderRadius: 6, padding: "12px 24px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
          Start verification
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 6L6 11L1 6L6 1Z" fill="white" fillOpacity="0.95"/></svg>
          </div>
          <span style={{ fontSize: 12, color: "#6B7280" }}>StellarPass</span>
        </div>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>ZK · Noir + Soroban</span>
      </footer>
    </div>
  );
}
