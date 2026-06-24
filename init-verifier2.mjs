import { Networks, rpc, TransactionBuilder, Contract, Address, xdr, Keypair } from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RPC = "https://soroban-testnet.stellar.org";
const DEPLOYER_SECRET = "SDWRR73ERXKASZNOBCYXXMLDDJ5MEZBLB3FGM2ZGMVZEYZWQDU54IW26";
const DEPLOYER_ADDRESS = "GBJPKBUZSCFFYC52CDQJPTU66GHUJ3KBR3DFK5IICILDQ7PW5VQIGINS";
const VERIFIER_CONTRACT = "CBB6Z3JJTQQJUY3YP3EQDXZ4IDIZ6R43OUNHOA5HZ3EAPUAGNDJPHFTO";
const REGISTRY_CONTRACT = "CCD45IDTIOTP5J7MDI7RQM4MHDIN2FWSCV7FMIB5CZJ6XABHL2Q3ZLNN";

const server = new rpc.Server(RPC);

async function sendAndWait(tx, kp) {
  const sim = await server.simulateTransaction(tx);
  if (sim.error) { console.error("Sim failed:", JSON.stringify(sim.error)); process.exit(1); }
  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const result = await server.sendTransaction(prepared);
  console.log("TX:", result.hash);
  let res = await server.getTransaction(result.hash);
  let i = 0;
  while (res.status === "NOT_FOUND" && i++ < 20) {
    await new Promise(r => setTimeout(r, 2000));
    res = await server.getTransaction(result.hash);
  }
  console.log("Status:", res.status);
  if (res.status !== "SUCCESS") { console.error("Failed:", JSON.stringify(res)); process.exit(1); }
  return res;
}

async function main() {
  const kp = Keypair.fromSecret(DEPLOYER_SECRET);
  const account = await server.getAccount(kp.publicKey());
  const contract = new Contract(VERIFIER_CONTRACT);

  // Load the 1760-byte VK from bb CLI output
  const vkBuffer = readFileSync(join(__dirname, "../circuits/stellarpass_credential/target/vk"));
  console.log("VK size:", vkBuffer.length, "bytes");

  const vkScVal = xdr.ScVal.scvBytes(vkBuffer);
  const registryScVal = new Address(REGISTRY_CONTRACT).toScVal();
  const adminScVal = new Address(DEPLOYER_ADDRESS).toScVal();

  console.log("Initializing verifier with 1760-byte VK...");

  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call("initialize", vkScVal, registryScVal, adminScVal))
    .setTimeout(60)
    .build();

  await sendAndWait(tx, kp);
  console.log("Verifier initialized!");

  // Update registry to trust new verifier
  const account2 = await server.getAccount(kp.publicKey());
  const registry = new Contract(REGISTRY_CONTRACT);
  const tx2 = new TransactionBuilder(account2, {
    fee: "10000000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(registry.call("set_verifier", new Address(VERIFIER_CONTRACT).toScVal()))
    .setTimeout(60)
    .build();

  console.log("Setting verifier on registry...");
  await sendAndWait(tx2, kp);
  console.log("Done!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
