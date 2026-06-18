"use client";
import { useState } from "react";
import Link from "next/link";

const COUNTRIES = ["Nigeria","United States","United Kingdom","Germany","Singapore","Canada","Australia","Kenya","Ghana","South Africa"];
const COUNTRY_CODES: Record<string, number> = { Nigeria:566, "United States":840, "United Kingdom":826, Germany:276, Singapore:702, Canada:124, Australia:36, Kenya:404, Ghana:288, "South Africa":710 };

type Step = "start" | "personal" | "wallet" | "proving" | "submitting" | "done" | "error";

const PROGRESS: Record<Step, number> = { start: 0, personal: 50, wallet: 80, proving: 90, submitting: 90, done: 100, error: 80 };
const STEP_LABEL: Record<Step, string> = { start: "KYC Verification", personal: "Step 1 of 2", wallet: "Step 2 of 2", proving: "Processing", submitting: "Processing", done: "Complete ✓", error: "Step 2 of 2" };

const nav: React.CSSProperties = { height: 52, borderBottom: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" };
const backBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 13, fontFamily: "inherit" };
const card: React.CSSProperties = { width: "100%", maxWidth: 460, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" };
const kyc: React.CSSProperties = { padding: 32 };
const h1: React.CSSProperties = { fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 24, color: "#111827", textAlign: "center", marginBottom: 6 };
const sub: React.CSSProperties = { color: "#6B7280", fontSize: 13, textAlign: "center", marginBottom: 28 };
const inputStyle: React.CSSProperties = { width: "100%", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: "11px 14px", fontSize: 14, color: "#111827", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", marginTop: 6 };
const label: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "#111827" };
const btnFull: React.CSSProperties = { width: "100%", background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: 13, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("start");
  const [form, setForm] = useState({ firstName: "", lastName: "", country: "Nigeria", kycLevel: "2", dob: "", wallet: "" });
  const [log, setLog] = useState<string[]>([]);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  function addLog(msg: string) { setLog(p => [...p, msg]); }

  function handleBack() {
    if (step === "start") return;
    if (step === "personal") setStep("start");
    if (step === "wallet" || step === "error") setStep("personal");
  }

  async function handleProve() {
    if (!form.wallet.startsWith("G") || form.wallet.length < 56) return;
    setError("");
    setLog([]);
    setStep("proving");
    try {
      addLog("Requesting signed credential from issuer...");
      const credRes = await fetch("/api/issue-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: form.wallet, fullName: `${form.firstName} ${form.lastName}`, countryCode: COUNTRY_CODES[form.country], kycLevel: parseInt(form.kycLevel), dob: form.dob }),
      });
      if (!credRes.ok) throw new Error("Credential issuance failed");
      const credential = await credRes.json();
      addLog("Credential issued and signed");
      addLog("Running Noir ZK circuit in browser...");
      const proofRes = await fetch("/api/generate-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!proofRes.ok) throw new Error("Proof generation failed");
      const { proof, publicInputs } = await proofRes.json();
      addLog("ZK proof generated — " + proof.slice(0, 18) + "...");
      setStep("submitting");
      addLog("Submitting to Soroban registry...");
      const stampRes = await fetch("/api/stamp-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, proof, publicInputs }),
      });
      if (!stampRes.ok) throw new Error("Stamp transaction failed");
      const { txHash: hash } = await stampRes.json();
      setTxHash(hash);
      addLog("Identity stamped on Stellar testnet ✓");
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("error");
    }
  }

  function ProgressBar() {
    return (
      <div style={{ height: 3, background: "#E5E7EB" }}>
        <div style={{ height: 3, background: step === "done" ? "#16A34A" : "#2563EB", width: PROGRESS[step] + "%", transition: "width 0.4s ease" }} />
      </div>
    );
  }

  function KycNav() {
    return (
      <nav style={nav}>
        <button style={backBtn} onClick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 26, height: 26, borderRadius: 5, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 6L6 11L1 6L6 1Z" fill="white" fillOpacity="0.95"/></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>StellarPass</span>
        </Link>
        <span style={{ fontSize: 11, color: "#6B7280" }}>{STEP_LABEL[step]}</span>
      </nav>
    );
  }

  function CardHeader() {
    return (
      <div style={{ borderBottom: "1px solid #E5E7EB", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>StellarPass</span>
        <span style={{ fontSize: 11, color: "#6B7280" }}>{STEP_LABEL[step]}</span>
      </div>
    );
  }

  const wrap = (content: React.ReactNode) => (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F5F7FF", minHeight: "100vh" }}>
      <KycNav />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "56px 24px", minHeight: "calc(100vh - 53px)" }}>
        <div style={card}>
          <CardHeader />
          <ProgressBar />
          {content}
        </div>
      </div>
    </div>
  );

  if (step === "done") return wrap(
    <div style={{ ...kyc, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#DCFCE7", border: "1px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h2 style={h1}>Identity stamped!</h2>
      <p style={sub}>Your StellarPass is live on Stellar testnet. You can now access any SEP-57 regulated asset.</p>
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 14, marginBottom: 20, textAlign: "left" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#6B7280", marginBottom: 6 }}>TRANSACTION HASH</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#2563EB", wordBreak: "break-all", marginBottom: 8 }}>{txHash}</div>
        <a href={"https://stellar.expert/explorer/testnet/tx/" + txHash} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", fontSize: 12, textDecoration: "none" }}>View on Stellar Expert</a>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/demo" style={{ flex: 1, textAlign: "center", background: "#2563EB", color: "white", borderRadius: 6, padding: "11px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Try RWA demo</Link>
        <Link href="/" style={{ flex: 1, textAlign: "center", background: "none", border: "1px solid #E5E7EB", borderRadius: 6, padding: "11px", fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Back to home</Link>
      </div>
    </div>
  );

  if (step === "proving" || step === "submitting") return wrap(
    <div style={{ ...kyc, textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #BFDBFE", borderTopColor: "#2563EB", animation: "sp-spin 0.8s linear infinite", margin: "0 auto 20px" }} />
      <h2 style={{ ...h1, fontSize: 20 }}>{step === "submitting" ? "Stamping on-chain..." : "Generating ZK proof..."}</h2>
      <p style={{ ...sub, marginBottom: 20 }}>This will take a moment.</p>
      <div style={{ textAlign: "left", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
        {log.map((l, i) => (
          <div key={i} style={{ fontSize: 12, fontFamily: "monospace", color: "#2563EB", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #BFDBFE" }}>{l}</div>
        ))}
      </div>
    </div>
  );

  if (step === "start") return wrap(
    <div style={{ ...kyc, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L19.2 5.6V10.8C19.2 15.336 16.08 19.56 12 21C7.92 19.56 4.8 15.336 4.8 10.8V5.6L12 2Z" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round"/></svg>
      </div>
      <h2 style={h1}>Verify your identity</h2>
      <p style={sub}>Complete KYC to access regulated assets on Stellar. Your personal data never leaves your device.</p>
      <button style={btnFull} onClick={() => setStep("personal")}>Start verification</button>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "center", gap: 20 }}>
        {[["ZK privacy", true], ["Under 2 minutes", false], ["Stellar native", false]].map(([t]) => (
          <span key={t as string} style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>{t as string}</span>
        ))}
      </div>
    </div>
  );

  if (step === "personal") {
    const valid = form.firstName && form.lastName && form.dob;
    return wrap(
      <div style={kyc}>
        <h2 style={h1}>Personal information</h2>
        <p style={sub}>Please provide your legal name as it appears on your identity documents.</p>
        {[
          { l: "First name", k: "firstName", p: "e.g. Jane" },
          { l: "Last name", k: "lastName", p: "e.g. Smith" },
        ].map(({ l, k, p }) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <label style={label}>{l}</label>
            <input style={inputStyle} placeholder={p} value={(form as Record<string, string>)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Date of birth</label>
          <input type="date" style={inputStyle} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Country of residence</label>
          <select style={inputStyle} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={label}>KYC level</label>
          <select style={inputStyle} value={form.kycLevel} onChange={e => setForm({ ...form, kycLevel: e.target.value })}>
            <option value="1">Level 1 — Basic</option>
            <option value="2">Level 2 — Standard (recommended)</option>
            <option value="3">Level 3 — Enhanced</option>
          </select>
        </div>
        <button style={{ ...btnFull, opacity: valid ? 1 : 0.55, cursor: valid ? "pointer" : "not-allowed" }} onClick={() => valid && setStep("wallet")}>Continue</button>
      </div>
    );
  }

  if (step === "wallet" || step === "error") {
    const valid = form.wallet.startsWith("G") && form.wallet.length >= 56;
    return wrap(
      <div style={kyc}>
        <h2 style={h1}>Your Stellar wallet</h2>
        <p style={sub}>Your StellarPass stamp will be issued to this address.</p>
        <div style={{ marginBottom: 28 }}>
          <label style={label}>Stellar wallet address</label>
          <input style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }} placeholder="G..." value={form.wallet} onChange={e => setForm({ ...form, wallet: e.target.value })} />
          {form.wallet && !valid && <p style={{ color: "#DC2626", fontSize: 12, marginTop: 4 }}>Enter a valid Stellar address (starts with G, 56 chars)</p>}
        </div>
        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: 12, marginBottom: 16 }}><p style={{ color: "#DC2626", fontSize: 12 }}>{error}</p></div>}
        <button style={{ ...btnFull, opacity: valid ? 1 : 0.55, cursor: valid ? "pointer" : "not-allowed" }} onClick={handleProve}>Generate ZK proof and get stamped</button>
        <p style={{ color: "#9CA3AF", fontSize: 11, textAlign: "center", marginTop: 14 }}>Your personal data is never sent to the blockchain. Only a cryptographic proof is submitted.</p>
      </div>
    );
  }

  return null;
}
