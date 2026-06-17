"use client";
import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "verified" | "not_verified" | "error";

export default function CheckPage() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleCheck() {
    if (!wallet.startsWith("G") || wallet.length < 50) {
      setError("Enter a valid Stellar wallet address.");
      return;
    }
    setError("");
    setStatus("loading");
    try {
      const res = await fetch(`/api/check-identity?wallet=${wallet}`);
      const data = await res.json();
      setStatus(data.verified ? "verified" : "not_verified");
    } catch {
      setError("Failed to query registry.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-6">
        <div>
          <Link href="/" className="text-gray-600 text-sm hover:text-gray-400">Back</Link>
          <h1 className="text-3xl font-bold mt-2">Check Wallet</h1>
          <p className="text-gray-500 text-sm mt-1">Look up any Stellar wallet to see its StellarPass status.</p>
        </div>
        <div className="space-y-3">
          <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500" placeholder="G..." value={wallet} onChange={(e) => setWallet(e.target.value)} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleCheck} disabled={status === "loading"} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-semibold transition-colors">
            {status === "loading" ? "Checking..." : "Check Status"}
          </button>
        </div>
        {status === "verified" && (
          <div className="bg-green-950 border border-green-700 rounded-xl p-6 text-center space-y-2">
            <div className="text-4xl">✅</div>
            <h2 className="text-green-400 font-bold text-lg">StellarPass Verified</h2>
            <p className="text-gray-400 text-sm">This wallet holds a valid KYC stamp and can access regulated assets.</p>
            <Link href={"https://stellar.expert/explorer/testnet/account/" + wallet} className="block text-blue-400 text-xs hover:underline mt-2" target="_blank">View on Stellar Expert</Link>
          </div>
        )}
        {status === "not_verified" && (
          <div className="bg-gray-950 border border-gray-700 rounded-xl p-6 text-center space-y-2">
            <div className="text-4xl">❌</div>
            <h2 className="text-gray-400 font-bold text-lg">Not Verified</h2>
            <p className="text-gray-600 text-sm">This wallet has no StellarPass stamp.</p>
            <Link href="/verify" className="block text-blue-400 text-xs hover:underline mt-2">Get verified</Link>
          </div>
        )}
      </div>
    </main>
  );
}
