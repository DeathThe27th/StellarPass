export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function strToField(str: string): string {
  const hash = createHash("sha256").update(str).digest("hex");
  return BigInt("0x" + hash.slice(0, 62)).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    // Point bb.js CRS cache to /tmp — only writable dir on Vercel
    process.env.XDG_CACHE_HOME = "/tmp";
    process.env.HOME = "/tmp";

    const { Noir } = await import("@noir-lang/noir_js");
    const { Barretenberg, BackendType, UltraHonkBackend } = await import("@aztec/bb.js");
    const { readFileSync } = await import("fs");
    const { join } = await import("path");

    const circuitPath = join(process.cwd(), "circuits", "stellarpass_credential.json");
    const circuit = JSON.parse(readFileSync(circuitPath, "utf-8"));

    const currentTimestamp = Math.floor(Date.now() / 1000);

    const inputs = {
      kyc_level: credential.kyc_level.toString(),
      country_code: credential.country_code.toString(),
      expiry: credential.expiry.toString(),
      wallet_address: strToField(credential.wallet),
      min_kyc_level: "2",
      current_timestamp: currentTimestamp.toString(),
      issuer_pubkey_hash: strToField(credential.issuer_pubkey_hash),
    };

    const noir = new Noir(circuit);
    const { witness } = await noir.execute(inputs);

    const api = await Barretenberg.new({ backend: BackendType.Wasm });
    const backend = new UltraHonkBackend(circuit.bytecode, api);
    const { proof, publicInputs } = await backend.generateProof(witness);

    await (api as any).destroy();

    return NextResponse.json({
      proof: "0x" + Buffer.from(proof).toString("hex"),
      publicInputs,
      proofSize: proof.length,
    });

  } catch (e: unknown) {
    console.error("Proof generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proof generation failed" },
      { status: 500 }
    );
  }
}
