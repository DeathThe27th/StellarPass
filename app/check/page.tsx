"use client";
import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "verified" | "not_verified";

const nav: React.CSSProperties = { height: 52, borderBottom: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" };

export default function CheckPage() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleCheck() {
    if (!wallet.startsWith("G") || wallet.length < 50) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/check-identity?wallet=${wallet}`);
      const data = await res.json();
      setStatus(data.verified ? "verified" : "not_verified");
    } catch {
      setStatus("not_verified");
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F5F7FF", minHeight: "100vh" }}>
      <nav style={nav}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#6B7280", fontSize: 13, textDecoration: "none" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </Link>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 26, height: 26, borderRadius: 5, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 6L6 11L1 6L6 1Z" fill="white" fillOpacity="0.95"/></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>StellarPass</span>
        </Link>
        <Link href="/verify" style={{ background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Get Verified</Link>
      </nav>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#2563EB", marginBottom: 10 }}>Registry Lookup</div>
        <h1 className="sp-display" style={{ fontSize: 34, fontWeight: 400, color: "#111827", letterSpacing: "-0.01em", marginBottom: 8 }}>Check any wallet</h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 36 }}>Look up whether a Stellar address holds a valid StellarPass stamp.</p>

        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6B7280", textTransform: "uppercase" as const, marginBottom: 7 }}>Stellar wallet address</label>
              <input style={{ width: "100%", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: "11px 14px", fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box" as const, fontFamily: "monospace" }} placeholder="G..." value={wallet} onChange={e => { setWallet(e.target.value); setStatus("idle"); }} />
            </div>
            <button onClick={handleCheck} disabled={status === "loading"} style={{ width: "100%", background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: 13, fontSize: 14, fontWeight: 500, cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? 0.7 : 1, fontFamily: "inherit" }}>
              {status === "loading" ? "Querying Soroban..." : "Check status"}
            </button>
          </div>
        </div>

        {status === "verified" && (
          <div style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>StellarPass verified</div>
                <p style={{ color: "#6B7280", fontSize: 12, marginBottom: 8 }}>This wallet holds a valid KYC stamp and can access regulated assets on Stellar.</p>
                <a href={"https://stellar.expert/explorer/testnet/account/" + wallet} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", fontSize: 12, textDecoration: "none" }}>View on Stellar Expert</a>
              </div>
            </div>
          </div>
        )}

        {status === "not_verified" && (
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F9FAFB", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>Not verified</div>
                <p style={{ color: "#6B7280", fontSize: 12, marginBottom: 8 }}>This wallet has no StellarPass stamp. Transfers of regulated assets will be blocked.</p>
                <Link href="/verify" style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "none" }}>Get verified</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
