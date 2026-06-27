// Diagnostic harness for the StellarPass on-chain verification path.
//
// Usage:
//   PROVER_URL=https://stellarpass.onrender.com node test-verify.mjs
//
// It:
//   1. Confirms the deployed verifier is initialized (vk_size == 1760).
//   2. (if the prover works) pulls a real proof + public inputs.
//   3. Simulates verify_and_stamp against the LIVE verifier and prints the
//      exact contract error / diagnostic events — no on-chain write.
//
// Requires: npm install  (for @stellar/stellar-sdk)

import {
  Networks, rpc, TransactionBuilder, Contract, Address, xdr, Keypair, scValToNative,
} from "@stellar/stellar-sdk";

const RPC = "https://soroban-testnet.stellar.org";
// Override with VERIFIER_ID=C... after redeploying the verifier.
const VERIFIER_CONTRACT = process.env.VERIFIER_ID || "CBB6Z3JJTQQJUY3YP3EQDXZ4IDIZ6R43OUNHOA5HZ3EAPUAGNDJPHFTO";
// Source account only used to build simulation txs (no signature/funds needed to simulate).
const DEPLOYER_SECRET = "SDWRR73ERXKASZNOBCYXXMLDDJ5MEZBLB3FGM2ZGMVZEYZWQDU54IW26";
const WALLET = "GBJPKBUZSCFFYC52CDQJPTU66GHUJ3KBR3DFK5IICILDQ7PW5VQIGINS";
const PROVER_URL = process.env.PROVER_URL || "https://stellarpass.onrender.com";

const server = new rpc.Server(RPC);

async function simulateCall(kp, account, name, ...args) {
  const contract = new Contract(VERIFIER_CONTRACT);
  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(name, ...args))
    .setTimeout(60)
    .build();
  return server.simulateTransaction(tx);
}

async function main() {
  const kp = Keypair.fromSecret(DEPLOYER_SECRET);
  const account = await server.getAccount(kp.publicKey());

  // 1. Is the verifier initialized?
  console.log("=== 1. verifier.vk_size() ===");
  const vkSim = await simulateCall(kp, account, "vk_size");
  if (rpc.Api.isSimulationError(vkSim)) {
    console.log("  ERROR:", vkSim.error);
  } else {
    console.log("  vk_size =", scValToNative(vkSim.result.retval), "(expect 1760)");
  }

  // 2. Get a real proof from the prover.
  console.log("\n=== 2. prover /prove ===");
  let proofData;
  try {
    const res = await fetch(PROVER_URL.replace(/\/+$/, "") + "/prove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kyc_level: 3, country_code: 566, expiry: 1800000000,
        wallet: WALLET, issuer_pubkey_hash: "issuer-demo-key",
      }),
      signal: AbortSignal.timeout(120000),
    });
    proofData = await res.json();
    if (!res.ok || proofData.error) {
      console.log("  PROVER FAILED:", proofData.error || res.status);
      console.log("  -> Fix the prover (Docker deploy) before on-chain verify can be tested.");
      return;
    }
    console.log("  proofSize =", proofData.proofSize, " vkSize =", proofData.vkSize,
      " numPublicInputs =", proofData.publicInputs?.length);
  } catch (e) {
    console.log("  PROVER UNREACHABLE:", e.message);
    return;
  }

  // 3. Simulate verify_and_stamp with the real proof.
  console.log("\n=== 3. verifier.verify_and_stamp(...) simulation ===");
  const proofBuffer = Buffer.from(proofData.proof.replace("0x", ""), "hex");
  const pubInputsBuffer = Buffer.concat(
    proofData.publicInputs.map((pi) =>
      Buffer.from(pi.replace("0x", "").padStart(64, "0"), "hex")
    )
  );
  console.log("  proof bytes:", proofBuffer.length, " public_input bytes:", pubInputsBuffer.length);

  const sim = await simulateCall(
    kp, account, "verify_and_stamp",
    xdr.ScVal.scvBytes(proofBuffer),
    xdr.ScVal.scvBytes(pubInputsBuffer),
    new Address(WALLET).toScVal(),
    xdr.ScVal.scvU32(3),
    xdr.ScVal.scvU64(xdr.Uint64.fromString("1800000000")),
  );

  if (rpc.Api.isSimulationError(sim)) {
    console.log("  RESULT: SIMULATION ERROR");
    console.log("  error:", sim.error);
    if (sim.events) sim.events.forEach((e) => console.log("  event:", JSON.stringify(e)));
  } else {
    console.log("  RESULT: SUCCESS — verification passed! retval:",
      scValToNative(sim.result.retval));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
