#!/usr/bin/env node
// Standalone prover — runs outside Next.js to avoid WASM path issues
// Reads credential JSON from stdin, writes proof JSON to stdout

import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, Barretenberg, BackendType } from "@aztec/bb.js";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function strToField(str) {
  const hash = createHash("sha256").update(str).digest("hex");
  return BigInt("0x" + hash.slice(0, 62)).toString();
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  const credential = JSON.parse(raw);

  const circuitPath = join(__dirname, "..", "circuits", "stellarpass_credential.json");
  const circuit = JSON.parse(readFileSync(circuitPath, "utf-8"));

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const inputs = {
    // Private
    kyc_level: credential.kyc_level.toString(),
    country_code: credential.country_code.toString(),
    expiry: credential.expiry.toString(),
    // Public
    wallet_address: strToField(credential.wallet),
    min_kyc_level: "2",
    current_timestamp: currentTimestamp.toString(),
    issuer_pubkey_hash: strToField(credential.issuer_pubkey_hash),
  };

  // Execute circuit to get witness
  const noir = new Noir(circuit);
  const { witness } = await noir.execute(inputs);

  // Generate real UltraHonk proof
  const api = await Barretenberg.new({ backend: BackendType.Wasm });
  const backend = new UltraHonkBackend(circuit.bytecode, api);
  const { proof, publicInputs } = await backend.generateProof(witness, {
    honkRecursion: false,
  });

  await api.destroy();

  process.stdout.write(JSON.stringify({
    proof: "0x" + Buffer.from(proof).toString("hex"),
    publicInputs,
    proofSize: proof.length,
  }));
}

main().catch(e => {
  process.stderr.write(e.stack + "\n");
  process.exit(1);
});
