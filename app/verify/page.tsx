"use client";
import { useState } from "react";
import Link from "next/link";
import { FlowNav, IconCheck, IconShield, IconArrow, IconLink, IconLock, IconChip } from "../components/site";

const COUNTRIES = ["Nigeria", "United States", "United Kingdom", "Germany", "Singapore", "Canada", "Australia", "Kenya", "Ghana", "South Africa"];
const COUNTRY_CODES: Record<string, number> = { Nigeria: 566, "United States": 840, "United Kingdom": 826, Germany: 276, Singapore: 702, Canada: 124, Australia: 36, Kenya: 404, Ghana: 288, "South Africa": 710 };

type Step = "welcome" | "personal" | "wallet" | "review" | "proving" | "submitting" | "done" | "error";

// Onfido-style: a short, focused flow with a visible step position.
const FORM_STEPS: Step[] = ["personal", "wallet", "review"];

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [form, setForm] = useState({ firstName: "", lastName: "", country: "Nigeria", kycLevel: "2", dob: "", wallet: "" });
  const [consent, setConsent] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  function addLog(msg: string) { setLog((p) => [...p, msg]); }

  function handleBack() {
    if (step === "personal") setStep("welcome");
    else if (step === "wallet") setStep("personal");
    else if (step === "review" || step === "error") setStep("wallet");
  }

  async function handleProve() {
    if (!validWallet || !consent) return;
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
      addLog("Generating Noir / UltraHonk proof...");
      const proofRes = await fetch("/api/generate-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!proofRes.ok) throw new Error("Proof generation failed");
      const { proof, publicInputs } = await proofRes.json();
      addLog("ZK proof generated: " + proof.slice(0, 18) + "...");
      setStep("submitting");
      addLog("Submitting to Soroban verifier...");
      const stampRes = await fetch("/api/stamp-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, proof, publicInputs }),
      });
      if (!stampRes.ok) throw new Error("Stamp transaction failed");
      const { txHash: hash } = await stampRes.json();
      setTxHash(hash);
      addLog("Identity stamped on Stellar testnet");
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("error");
    }
  }

  const valid2 = form.firstName && form.lastName && form.dob;
  const validWallet = form.wallet.startsWith("G") && form.wallet.length >= 56;
  const kycLabel = { "1": "Level 1 · Basic", "2": "Level 2 · Standard", "3": "Level 3 · Enhanced" }[form.kycLevel];

  // ---- card chrome: Onfido-style header with step position + footer ----
  const formIndex = FORM_STEPS.indexOf(step as Step);
  const isProcessing = step === "proving" || step === "submitting";

  const wrap = (content: React.ReactNode, opts?: { showHead?: boolean }) => (
    <div className="page wrap-min">
      <FlowNav />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "56px 24px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            {opts?.showHead && (
              <div className="flow-head">
                <span className="flow-head-title">Identity verification</span>
                <div className="step-dots" aria-hidden>
                  {FORM_STEPS.map((s, i) => (
                    <span key={s} className={"step-dot" + (i === formIndex ? " active" : i < formIndex ? " done" : "")} />
                  ))}
                </div>
              </div>
            )}
            {content}
          </div>
          <p className="flow-foot">Secured with zero-knowledge proofs. Your data never leaves your device.</p>
        </div>
      </div>
    </div>
  );

  /* ---------- WELCOME (Onfido checklist intro) ---------- */
  if (step === "welcome") return wrap(
    <div className="card-pad center">
      <div className="status-badge accent"><IconShield size={26} /></div>
      <h2 className="h3" style={{ fontSize: "1.4rem", marginTop: 18 }}>Verify your identity</h2>
      <p className="body" style={{ margin: "8px auto 8px", fontSize: "0.9rem", maxWidth: "36ch" }}>
        Confirm a few details to access regulated assets on Stellar. It takes about two minutes.
      </p>
      <div className="checklist">
        {[
          { n: 1, icon: <IconChip size={15} />, t: "Your basic information", s: "Name, date of birth and country of residence." },
          { n: 2, icon: <IconLink size={15} />, t: "Your Stellar wallet", s: "The address that receives your on-chain pass." },
          { n: 3, icon: <IconLock size={15} />, t: "Get stamped privately", s: "A zero-knowledge proof is verified on-chain, no personal data is sent." },
        ].map((c) => (
          <div key={c.n} className="checklist-item">
            <span className="checklist-num">{c.n}</span>
            <div>
              <div className="checklist-title">{c.t}</div>
              <div className="checklist-sub">{c.s}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-block" onClick={() => setStep("personal")}>Start verification <IconArrow /></button>
    </div>
  );

  /* ---------- PROCESSING ---------- */
  if (isProcessing) return wrap(
    <div className="card-pad center">
      <div className="spinner" style={{ margin: "6px auto 18px" }} />
      <h2 className="h3" style={{ fontSize: "1.2rem" }}>{step === "submitting" ? "Verifying on-chain..." : "Generating your proof..."}</h2>
      <p className="body" style={{ fontSize: "0.86rem", marginTop: 6, marginBottom: 18 }}>This only takes a moment. Please keep this window open.</p>
      <div className="console" style={{ textAlign: "left" }}>
        {log.map((l, i) => <div key={i} className="console-line">{l}</div>)}
      </div>
    </div>
  );

  /* ---------- DONE ---------- */
  if (step === "done") return wrap(
    <div className="card-pad center">
      <div className="status-badge ok"><IconCheck size={26} /></div>
      <h2 className="h3" style={{ fontSize: "1.4rem", marginTop: 18 }}>Identity verified</h2>
      <p className="body" style={{ margin: "8px auto 22px", fontSize: "0.9rem", maxWidth: "34ch" }}>
        Your StellarPass is live on testnet. You can now access any regulated asset on Stellar.
      </p>
      <div className="inset" style={{ padding: 16, textAlign: "left", marginBottom: 20 }}>
        <div className="mono dim" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: 8 }}>TRANSACTION</div>
        <div className="mono accent-text" style={{ fontSize: "0.8rem", wordBreak: "break-all", marginBottom: 10 }}>{txHash}</div>
        <a href={"https://stellar.expert/explorer/testnet/tx/" + txHash} target="_blank" rel="noopener noreferrer" className="row gap-2 nav-link" style={{ fontSize: "0.8rem" }}><IconLink size={14} /> View on Stellar Expert</a>
      </div>
      <div className="row gap-3">
        <Link href="/demo" className="btn btn-primary btn-block">Try the RWA demo <IconArrow /></Link>
        <Link href="/" className="btn btn-ghost">Home</Link>
      </div>
    </div>
  );

  /* ---------- PERSONAL ---------- */
  if (step === "personal") return wrap(
    <div className="card-pad">
      <button className="nav-link" onClick={handleBack} style={{ fontSize: "0.82rem", marginBottom: 14 }}>← Back</button>
      <h2 className="h3" style={{ fontSize: "1.3rem" }}>Your details</h2>
      <p className="body" style={{ fontSize: "0.86rem", margin: "6px 0 22px" }}>Use your legal name as it appears on your ID.</p>
      {[{ l: "First name", k: "firstName", p: "Adaeze" }, { l: "Last name", k: "lastName", p: "Okafor" }].map(({ l, k, p }) => (
        <div className="field" key={k}>
          <label className="label">{l}</label>
          <input className="input" placeholder={p} value={(form as Record<string, string>)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
        </div>
      ))}
      <div className="field">
        <label className="label">Date of birth</label>
        <input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
      </div>
      <div className="field">
        <label className="label">Country of residence</label>
        <select className="select" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field" style={{ marginBottom: 24 }}>
        <label className="label">KYC level</label>
        <select className="select" value={form.kycLevel} onChange={(e) => setForm({ ...form, kycLevel: e.target.value })}>
          <option value="1">Level 1 · Basic</option>
          <option value="2">Level 2 · Standard (recommended)</option>
          <option value="3">Level 3 · Enhanced</option>
        </select>
      </div>
      <button className="btn btn-primary btn-block" aria-disabled={!valid2} onClick={() => valid2 && setStep("wallet")}>Continue <IconArrow /></button>
    </div>,
    { showHead: true }
  );

  /* ---------- WALLET ---------- */
  if (step === "wallet") return wrap(
    <div className="card-pad">
      <button className="nav-link" onClick={handleBack} style={{ fontSize: "0.82rem", marginBottom: 14 }}>← Back</button>
      <h2 className="h3" style={{ fontSize: "1.3rem" }}>Your Stellar wallet</h2>
      <p className="body" style={{ fontSize: "0.86rem", margin: "6px 0 22px" }}>Your StellarPass stamp is issued to this address.</p>
      <div className="field" style={{ marginBottom: 24 }}>
        <label className="label">Stellar wallet address</label>
        <input className="input input-mono" placeholder="G..." value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} />
        {form.wallet && !validWallet && <span className="error-text">Enter a valid Stellar address (starts with G, 56 characters).</span>}
      </div>
      <button className="btn btn-primary btn-block" aria-disabled={!validWallet} onClick={() => validWallet && setStep("review")}>Continue <IconArrow /></button>
    </div>,
    { showHead: true }
  );

  /* ---------- REVIEW + CONSENT ---------- */
  if (step === "review" || step === "error") return wrap(
    <div className="card-pad">
      <button className="nav-link" onClick={handleBack} style={{ fontSize: "0.82rem", marginBottom: 14 }}>← Back</button>
      <h2 className="h3" style={{ fontSize: "1.3rem" }}>Review and confirm</h2>
      <p className="body" style={{ fontSize: "0.86rem", margin: "6px 0 22px" }}>Check your details before we generate your proof.</p>
      <div className="summary">
        <div className="summary-row"><span className="k">Name</span><span className="v">{form.firstName} {form.lastName}</span></div>
        <div className="summary-row"><span className="k">Date of birth</span><span className="v">{form.dob}</span></div>
        <div className="summary-row"><span className="k">Country</span><span className="v">{form.country}</span></div>
        <div className="summary-row"><span className="k">KYC level</span><span className="v">{kycLabel}</span></div>
        <div className="summary-row"><span className="k">Wallet</span><span className="v mono" style={{ fontSize: "0.78rem" }}>{form.wallet.slice(0, 8)}…{form.wallet.slice(-6)}</span></div>
      </div>
      <div className={"consent" + (consent ? " checked" : "")} onClick={() => setConsent((c) => !c)} role="checkbox" aria-checked={consent} tabIndex={0}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setConsent((c) => !c); } }}>
        <span className="consent-box">{consent && <IconCheck size={14} />}</span>
        <span className="consent-text">I confirm this information is accurate. Only a zero-knowledge proof is submitted on-chain, never my personal data.</span>
      </div>
      {error && <div className="alert alert-bad" style={{ marginBottom: 16 }}>{error}</div>}
      <button className="btn btn-primary btn-block" aria-disabled={!consent} onClick={handleProve}>Generate proof and get stamped</button>
    </div>,
    { showHead: true }
  );

  return null;
}
