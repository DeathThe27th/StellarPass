"use client";
import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("100");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"failed">("idle");
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
        setMessage("Transfer successful! Both wallets are KYC verified.");
      } else {
        setStatus("failed");
        setMessage(data.error || "Transfer blocked.");
      }
    } catch {
      setStatus("failed");
      setMessage("Request failed.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-6">
        <div>
          <Link href="/" className="text-gray-600 text-sm hover:text-gray-400">← Back</Link>
          <h1 className="text-3xl font-bold mt-2">RWA Transfer Demo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Try transferring SPASS tokens — a mock regulated asset.
            Transfer is blocked unless both wallets hold a StellarPass stamp.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm space-y-1">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Contract</p>
          <p className="font-mono text-xs text-gray-400 break-all">{process.env.NEXT_PUBLIC_RWA_CONTRACT}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">From (Stellar address)</label>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500"
              placeholder="G..."
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">To (Stellar address)</label>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500"
              placeholder="G..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Amount (SPASS)</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button
            onClick={handleTransfer}
            disabled={status === "loading"}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-semibold transition-colors"
          >
            {status === "loading" ? "Checking KYC & Transferring..." : "Transfer SPASS Tokens"}
          </button>
        </div>

        {status === "success" && (
          <div className="bg-green-950 border border-green-700 rounded-xl p-4 space-y-2">
            <p className="text-green-400 font-semibold">✅ {message}</p>
            
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 text-xs hover:underline"
            >
              View transaction →
            </a>
          </div>
        )}

        {status === "failed" && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4">
            <p className="text-red-400 font-semibold">❌ {message}</p>
            <p className="text-gray-500 text-xs mt-1">Make sure both wallets are verified at /verify first.</p>
          </div>
        )}
      </div>
    </main>
  );
}
