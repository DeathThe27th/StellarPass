"use client";
import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "failed";

export default function DemoPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("100");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleTransfer() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/demo-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, amount: parseInt(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setTxHash(data.txHash);
        setMessage("Transfer successful. Both wallets passed KYC verification.");
      } else {
        setStatus("failed");
        setMessage(data.error || "Transfer blocked by KYC registry.");
      }
    } catch {
      setStatus("failed");
      setMessage("Request failed.");
    }
  }

  const inputStyle: React.CSSProperties = { width: "100%", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: "11px 14px", fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box", fontFamily: "monospace" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F5F7FF", minHeight: "100vh" }}>
      <nav style={{ height: 52, borderBottom: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
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
        <Link href="/verify" style={{ background: "#2563EB", color: "white", borderRadius: 6, padding: "7px 18px", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Get Verified</Link>
      </nav>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#2563EB", marginBottom: 10 }}>Live Demo</div>
        <h1 className="sp-display" style={{ fontSize: 34, fontWeight: 400, color: "#111827", letterSpacing: "-0.01em", marginBottom: 8 }}>RWA token transfer</h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 36 }}>Transfer SPASS tokens — a mock SEP-57 regulated asset. Blocked without a valid StellarPass stamp on both wallets.</p>

        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>SPASS Token Contract</span>
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>CAUSCD22OSFKEN...</span>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6B7280", textTransform: "uppercase" as const, marginBottom: 7 }}>From</label>
              <input style={inputStyle} placeholder="G..." value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6B7280", textTransform: "uppercase" as const, marginBottom: 7 }}>To</label>
              <input style={inputStyle} placeholder="G..." value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6B7280", textTransform: "uppercase" as const, marginBottom: 7 }}>Amount (SPASS)</label>
              <input type="number" style={{ ...inputStyle, fontFamily: "'DM Sans', sans-serif" }} value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <button onClick={handleTransfer} disabled={status === "loading"} style={{ width: "100%", background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: 13, fontSize: 14, fontWeight: 500, cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? 0.7 : 1, fontFamily: "inherit" }}>
              {status === "loading" ? "Checking KYC registry..." : "Transfer SPASS tokens"}
            </button>
          </div>
        </div>

        {status === "success" && (
          <div style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", borderRadius: 10, padding: 20, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>{message}</span>
            </div>
            <a href={"https://stellar.expert/explorer/testnet/tx/" + txHash} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", fontSize: 12, textDecoration: "none" }}>View transaction</a>
          </div>
        )}

        {status === "failed" && (
          <div style={{ border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 10, padding: 20, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ color: "#DC2626", fontSize: 14, fontWeight: 500 }}>Transfer blocked</span>
            </div>
            <p style={{ color: "#6B7280", fontSize: 12, marginLeft: 26, marginBottom: 8 }}>{message}</p>
            <Link href="/verify" style={{ marginLeft: 26, color: "#2563EB", fontSize: 12, textDecoration: "none" }}>Get verified first</Link>
          </div>
        )}

        <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#9CA3AF", marginBottom: 12 }}>How the KYC check works</div>
          {["Sender calls transfer() on SPASS contract", "Contract calls verify_identity() on StellarPass registry", "Registry checks wallet has valid, non-expired stamp", "Transfer executes or reverts based on result"].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{i + 1}.</span>
              <span style={{ fontSize: 12, color: "#6B7280" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
