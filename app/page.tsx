import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-block bg-blue-600 text-xs font-semibold px-3 py-1 rounded-full tracking-widest uppercase">
            Stellar Testnet
          </div>
          <h1 className="text-5xl font-bold tracking-tight">StellarPass</h1>
          <p className="text-gray-400 text-lg">
            Prove you&apos;re verified. Access every regulated asset on Stellar.
          </p>
          <p className="text-gray-600 text-sm">
            ZK-based KYC identity layer for SEP-57 regulated assets.
            Your personal data never touches the blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Link href="/verify" className="group border border-gray-800 hover:border-blue-500 rounded-xl p-6 text-left transition-all">
            <div className="text-2xl mb-3">🔐</div>
            <h2 className="font-semibold mb-1">Get Verified</h2>
            <p className="text-gray-500 text-sm">Submit KYC once, generate a ZK proof, get stamped on-chain.</p>
          </Link>

          <Link href="/check" className="group border border-gray-800 hover:border-blue-500 rounded-xl p-6 text-left transition-all">
            <div className="text-2xl mb-3">🔍</div>
            <h2 className="font-semibold mb-1">Check Wallet</h2>
            <p className="text-gray-500 text-sm">Look up any Stellar wallet to see if it holds a StellarPass stamp.</p>
          </Link>

          <Link href="/demo" className="group border border-gray-800 hover:border-blue-500 rounded-xl p-6 text-left transition-all">
            <div className="text-2xl mb-3">🏦</div>
            <h2 className="font-semibold mb-1">RWA Demo</h2>
            <p className="text-gray-500 text-sm">Try transferring a regulated token. Fails without StellarPass.</p>
          </Link>
        </div>

        <p className="text-gray-700 text-xs">
          Built for Stellar Hacks: Real-World ZK · Powered by Noir + Soroban
        </p>
      </div>
    </main>
  );
}
