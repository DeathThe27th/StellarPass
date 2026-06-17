"use client";
import { useState } from "react";
import Link from "next/link";

type Step = "form" | "proving" | "submitting" | "done" | "error";

const COUNTRIES: Record<string, number> = {
  "Nigeria (566)": 566,
  "United States (840)": 840,
  "United Kingdom (826)": 826,
  "Germany (276)": 276,
  "Singapore (702)": 702,
  "Canada (124)": 124,
  "Australia (036)": 36,
  "Kenya (404)": 404,
  "Ghana (288)": 288,
  "South Africa (710)": 710,
};

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ wallet: "", fullName: "", country: "Nigeria (566)", kycLevel: "2", dob: "" });
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function handleSubmit() {
    if (!form.wallet || !form.fullName || !form.dob) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setStep("proving");
    setLog([]);
    try {
      addLog("Requesting credential from issuer...");
      const credRes = await fetch("/api/issue-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: form.wallet, fullName: form.fullName, countryCode: COUNTRIES[form.country], kycLevel: parseInt(form.kycLevel), dob: form.dob }),
      });
      if (!credRes.ok) throw new Error("Credential issuance failed");
      const credential = await credRes.json();
      addLog("Credential issued");
      addLog("Generating ZK proof in browser...");
      const proofRes = await fetch("/api/generate-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!proofRes.ok) throw new Error("Proof generation failed");
      const { proof, publicInputs } = await proofRes.json();
      addLog("ZK proof generated");
      setStep("submitting");
      addLog("Submitting proof to Soroban registry...");
      const stampRes = await fetch("/api/stamp-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, proof, publicInputs }),
      });
      if (!stampRes.ok) throw new Error("Stamp failed");
      const { txHash: hash } = await stampRes.json();
      setTxHash(hash);
      addLog("Identity stamped on-chain!");
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-6 text-center">
          <div className="text-6xl">✅</div>
          <h1 className="text-3xl font-bold">StellarPass Issued</h1>
          <p className="text-gray-400">Your wallet is now KYC-verified on Stellar testnet.</p>
          <div className="bg-gray-900 rounded-xl p-4 text-left space-y-1">
            {log.map((l, i) => (<p key={i} className="text-xs text-gray-400 font-mono">{l}</p>))}
          </div>
          <Link href={"https://stellar.expert/explorer/testnet/tx/" + txHash} className="block text-blue-400 text-sm hover:underline" target="_blank">View on Stellar Expert</Link>
          <div className="flex gap-3 justify-center">
            <Link href="/check" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">Check Wallet</Link>
            <Link href="/demo" className="border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg text-sm">Try RWA Demo</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-6">
        <div>
          <Link href="/" className="text-gray-600 text-sm hover:text-gray-400">Back</Link>
          <h1 className="text-3xl font-bold mt-2">Get Your StellarPass</h1>
          <p className="text-gray-500 text-sm mt-1">Submit KYC once. Generate a ZK proof. Access all regulated assets.</p>
        </div>
        {(step === "proving" || step === "submitting") && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-1">
            {log.map((l, i) => (<p key={i} className="text-xs text-gray-400 font-mono">{l}</p>))}
            <p className="text-xs text-blue-400 font-mono animate-pulse">{step === "proving" ? "Generating proof..." : "Submitting to Soroban..."}</p>
          </div>
        )}
        {(step === "form" || step === "error") && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Stellar Wallet Address</label>
              <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500" placeholder="G..." value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Full Name</label>
              <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="As on your ID" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Date of Birth</label>
              <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Country</label>
              <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {Object.keys(COUNTRIES).map((c) => (<option key={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">KYC Level</label>
              <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" value={form.kycLevel} onChange={(e) => setForm({ ...form, kycLevel: e.target.value })}>
                <option value="1">Level 1 - Basic</option>
                <option value="2">Level 2 - Standard (recommended)</option>
                <option value="3">Level 3 - Enhanced</option>
              </select>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors">
              Generate ZK Proof and Get Stamped
            </button>
            <p className="text-gray-600 text-xs text-center">Your personal data is never stored or sent to the blockchain.</p>
          </div>
        )}
      </div>
    </main>
  );
}
