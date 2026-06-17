import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Simulated Poseidon2 for proof stub — real circuit proof generated via
// Barretenberg WASM. For hackathon demo the proof bytes are generated
// server-side and passed to stamp-identity which trusts the issuer backend.
function mockPoseidon(a: string, b: string): string {
  return "0x" + createHash("sha256").update(a + b).digest("hex").slice(0, 62);
}

export async function POST(req: NextRequest) {
  const { credential } = await req.json();

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const nullifierHash = mockPoseidon(
    credential.nullifier_secret,
    credential.wallet
  );

  // In production: run nargo prove / bb prove WASM here
  // For demo: return structured public inputs the contract needs
  const publicInputs = {
    wallet_address: credential.wallet,
    min_kyc_level: 2,
    current_timestamp: currentTimestamp,
    issuer_pubkey_hash: credential.issuer_pubkey_hash,
    nullifier_hash: nullifierHash,
  };

  // Mock proof bytes (real proof is 2kb UltraHonk)
  const proof = "0x" + createHash("sha256")
    .update(JSON.stringify(publicInputs) + credential.nullifier_secret)
    .digest("hex");

  return NextResponse.json({ proof, publicInputs });
}
