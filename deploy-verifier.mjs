import { Networks, rpc, TransactionBuilder, Operation, Keypair } from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RPC = "https://soroban-testnet.stellar.org";
const SECRET = "SDWRR73ERXKASZNOBCYXXMLDDJ5MEZBLB3FGM2ZGMVZEYZWQDU54IW26";
const WASM_PATH = "../contracts/stellarpass-verifier/target/wasm32v1-none/release/stellarpass_verifier.wasm";

const server = new rpc.Server(RPC);
const kp = Keypair.fromSecret(SECRET);

async function sendAndWait(tx) {
  const result = await server.sendTransaction(tx);
  console.log("TX hash:", result.hash);
  let res = await server.getTransaction(result.hash);
  let i = 0;
  while (res.status === "NOT_FOUND" && i++ < 20) {
    await new Promise(r => setTimeout(r, 2000));
    res = await server.getTransaction(result.hash);
  }
  return res;
}

async function main() {
  const wasm = readFileSync(join(__dirname, WASM_PATH));
  console.log("WASM size:", wasm.length, "bytes");

  let account = await server.getAccount(kp.publicKey());

  // Step 1: Upload WASM
  console.log("Uploading WASM...");
  const uploadTx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(60)
    .build();

  const uploadSim = await server.simulateTransaction(uploadTx);
  if (uploadSim.error) { console.error("Upload sim failed:", uploadSim.error); return; }

  const preparedUpload = rpc.assembleTransaction(uploadTx, uploadSim).build();
  preparedUpload.sign(kp);
  const uploadRes = await sendAndWait(preparedUpload);
  console.log("Upload status:", uploadRes.status);

  // Step 2: Create contract instance
  account = await server.getAccount(kp.publicKey());
  const wasmHash = Buffer.from(uploadSim.result?.retval?.toXDR() ?? "", "base64");
  
  console.log("Done — use stellar contract deploy with wasm hash next");
  console.log("WASM hash (hex):", Buffer.from(wasm).toString("hex").slice(0, 20) + "...");
}

main().catch(e => { console.error(e.message); process.exit(1); });
