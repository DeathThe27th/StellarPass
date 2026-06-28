"use client";
import { useState } from "react";
import Link from "next/link";
import { FlowNav, IconCheck, IconX, IconLink } from "../components/site";

type Status = "idle" | "loading" | "verified" | "not_verified";

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
    <div className="page wrap-min">
      <FlowNav />
      <div className="container-tight" style={{ paddingBlock: 64 }}>
        <span className="eyebrow">Registry lookup</span>
        <h1 className="h2" style={{ marginTop: 16 }}>Check any wallet.</h1>
        <p className="body" style={{ marginTop: 12, marginBottom: 32 }}>
          Look up whether a Stellar address holds a valid, non-expired StellarPass stamp.
        </p>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label className="label">Stellar wallet address</label>
            <input className="input input-mono" placeholder="G..." value={wallet} onChange={(e) => { setWallet(e.target.value); setStatus("idle"); }} />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleCheck} aria-disabled={status === "loading"}>
            {status === "loading" ? "Querying Soroban..." : "Check status"}
          </button>
        </div>

        {status === "verified" && (
          <div className="card card-pad" style={{ borderColor: "var(--accent-line)", background: "var(--accent-tint)" }}>
            <div className="row gap-3" style={{ alignItems: "flex-start" }}>
              <span className="status-badge ok" style={{ width: 40, height: 40, flexShrink: 0 }}><IconCheck size={18} /></span>
              <div>
                <div className="h3" style={{ marginBottom: 4 }}>StellarPass verified</div>
                <p className="body" style={{ fontSize: "0.86rem", marginBottom: 8 }}>This wallet holds a valid KYC stamp and can access regulated assets on Stellar.</p>
                <a href={"https://stellar.expert/explorer/testnet/account/" + wallet} target="_blank" rel="noopener noreferrer" className="row gap-2 nav-link" style={{ fontSize: "0.8rem" }}><IconLink size={14} /> View on Stellar Expert</a>
              </div>
            </div>
          </div>
        )}

        {status === "not_verified" && (
          <div className="card card-pad">
            <div className="row gap-3" style={{ alignItems: "flex-start" }}>
              <span className="status-badge bad" style={{ width: 40, height: 40, flexShrink: 0 }}><IconX size={16} /></span>
              <div>
                <div className="h3" style={{ marginBottom: 4 }}>Not verified</div>
                <p className="body" style={{ fontSize: "0.86rem", marginBottom: 8 }}>This wallet has no StellarPass stamp. Transfers of regulated assets will be blocked.</p>
                <Link href="/verify" className="nav-link accent-text" style={{ fontSize: "0.82rem" }}>Get verified →</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
