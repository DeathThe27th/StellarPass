// Initialize a freshly-deployed StellarPass verifier and point the registry at it.
// Run AFTER the new verifier WASM is deployed in a Codespace.
//
// Usage:
//   NEW_VERIFIER_ID=C... node init-new-verifier.mjs
//
// Does (all via testnet RPC, no Stellar CLI needed):
//   1. verifier.initialize(vk_bytes, registry, admin)   -- vk is the 1760-byte canonical VK
//   2. registry.set_verifier(new_verifier)
import { Networks, rpc, TransactionBuilder, Contract, Address, xdr, Keypair } from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RPC = "https://soroban-testnet.stellar.org";
const DEPLOYER_SECRET = "SDWRR73ERXKASZNOBCYXXMLDDJ5MEZBLB3FGM2ZGMVZEYZWQDU54IW26";
const DEPLOYER_ADDRESS = "GBJPKBUZSCFFYC52CDQJPTU66GHUJ3KBR3DFK5IICILDQ7PW5VQIGINS";
const REGISTRY_CONTRACT = "CCD45IDTIOTP5J7MDI7RQM4MHDIN2FWSCV7FMIB5CZJ6XABHL2Q3ZLNN";
const NEW_VERIFIER = process.env.NEW_VERIFIER_ID;

if (!NEW_VERIFIER) { console.error("Set NEW_VERIFIER_ID=C... (the contract id from `stellar contract deploy`)"); process.exit(1); }

const server = new rpc.Server(RPC);

async function sendAndWait(label, tx, kp) {
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) { console.error(`${label} sim failed:`, sim.error); process.exit(1); }
  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const res = await server.sendTransaction(prepared);
  let g = await server.getTransaction(res.hash);
  let i = 0;
  while (g.status === "NOT_FOUND" && i++ < 25) { await new Promise(r => setTimeout(r, 1500)); g = await server.getTransaction(res.hash); }
  console.log(`${label}: ${g.status} (${res.hash})`);
  if (g.status !== "SUCCESS") { console.error(JSON.stringify(g)); process.exit(1); }
}

async function main() {
  const kp = Keypair.fromSecret(DEPLOYER_SECRET);

  // 1) initialize new verifier
  const vk = readFileSync(join(__dirname, "circuits/stellarpass_credential/target/vk"));
  console.log("VK size:", vk.length, "bytes (expect 1760)");
  let account = await server.getAccount(kp.publicKey());
  const verifier = new Contract(NEW_VERIFIER);
  const initTx = new TransactionBuilder(account, { fee: "10000000", networkPassphrase: Networks.TESTNET })
    .addOperation(verifier.call("initialize",
      xdr.ScVal.scvBytes(vk),
      new Address(REGISTRY_CONTRACT).toScVal(),
      new Address(DEPLOYER_ADDRESS).toScVal()))
    .setTimeout(60).build();
  await sendAndWait("initialize", initTx, kp);

  // 2) point registry at new verifier
  account = await server.getAccount(kp.publicKey());
  const registry = new Contract(REGISTRY_CONTRACT);
  const setTx = new TransactionBuilder(account, { fee: "10000000", networkPassphrase: Networks.TESTNET })
    .addOperation(registry.call("set_verifier", new Address(NEW_VERIFIER).toScVal()))
    .setTimeout(60).build();
  await sendAndWait("set_verifier", setTx, kp);

  console.log("\nDone. New verifier wired up. Now run: node test-verify.mjs");
}

main().catch(e => { console.error(e); process.exit(1); });
