"use client";
import { useState } from "react";
import Link from "next/link";
import { FlowNav, IconCheck, IconX, IconLink } from "../components/site";

type Status = "idle" | "loading" | "success" | "failed";

const FLOW = [
  "Sender calls transfer() on the SPASS token contract",
  "The contract calls verify_id() on the StellarPass registry",
  "Registry checks the wallet has a valid, non-expired stamp",
  "Transfer executes, or reverts if the check fails",
];

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
        setMessage(data.error || "Transfer blocked by the KYC registry.");
      }
    } catch {
      setStatus("failed");
      setMessage("Request failed.");
    }
  }

  return (
    <div className="page wrap-min">
      <FlowNav rightLabel="Live demo" />
      <div className="container-tight" style={{ paddingBlock: 64 }}>
        <span className="eyebrow">Live demo · testnet</span>
        <h1 className="h2" style={{ marginTop: 16 }}>RWA token transfer.</h1>
        <p className="body" style={{ marginTop: 12, marginBottom: 32 }}>
          Move SPASS, a mock regulated asset. The transfer is blocked unless both wallets carry a valid
          StellarPass stamp.
        </p>

        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          <div className="row between" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
            <span className="mono dim" style={{ fontSize: "0.78rem" }}>SPASS token contract</span>
            <span className="mono dim" style={{ fontSize: "0.72rem" }}>regulated · SEP-style</span>
          </div>
          <div className="card-pad">
            <div className="field">
              <label className="label">From</label>
              <input className="input input-mono" placeholder="G..." value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">To</label>
              <input className="input input-mono" placeholder="G..." value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 22 }}>
              <label className="label">Amount (SPASS)</label>
              <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleTransfer} aria-disabled={status === "loading"}>
              {status === "loading" ? "Checking KYC registry..." : "Transfer SPASS tokens"}
            </button>
          </div>
        </div>

        {status === "success" && (
          <div className="alert alert-ok" style={{ marginBottom: 16, flexDirection: "column" }}>
            <span className="row gap-2" style={{ color: "var(--text)", fontWeight: 500 }}><span className="accent-text"><IconCheck size={16} /></span> {message}</span>
            <a href={"https://stellar.expert/explorer/testnet/tx/" + txHash} target="_blank" rel="noopener noreferrer" className="row gap-2 nav-link" style={{ fontSize: "0.8rem", marginTop: 6 }}><IconLink size={14} /> View transaction</a>
          </div>
        )}

        {status === "failed" && (
          <div className="alert alert-bad" style={{ marginBottom: 16, flexDirection: "column" }}>
            <span className="row gap-2" style={{ color: "var(--text)", fontWeight: 500 }}><span style={{ color: "var(--danger)" }}><IconX size={16} /></span> Transfer blocked</span>
            <p className="body" style={{ fontSize: "0.84rem", marginTop: 4 }}>{message}</p>
            <Link href="/verify" className="nav-link accent-text" style={{ fontSize: "0.82rem", marginTop: 6 }}>Get verified first →</Link>
          </div>
        )}

        <div className="card card-pad">
          <div className="mono dim" style={{ fontSize: "0.72rem", letterSpacing: "0.1em", marginBottom: 14 }}>HOW THE KYC CHECK WORKS</div>
          <div className="stack gap-3">
            {FLOW.map((s, i) => (
              <div key={i} className="row gap-3" style={{ alignItems: "flex-start" }}>
                <span className="mono accent-text" style={{ fontSize: "0.78rem", marginTop: 1 }}>{i + 1}</span>
                <span className="body" style={{ fontSize: "0.88rem" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
