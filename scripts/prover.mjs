#!/usr/bin/env node
import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

function strToField(str) {
  const hash = createHash("sha256").update(str).digest("hex");
  return BigInt("0x" + hash.slice(0, 62)).toString();
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  const credential = JSON.parse(raw);

  const circuitDir = join(__dirname, "..", "..", "circuits", "stellarpass_credential");
  const circuitJson = join(circuitDir, "target", "stellarpass_credential.json");
  const witnessGz = join(circuitDir, "target", "stellarpass_credential.gz");
  const vkPath = join(circuitDir, "target", "vk");

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const nargoBin = process.env.HOME + "/.nargo/bin";
  const bbBin = process.env.HOME + "/.bb/bin";
  const PATH = nargoBin + ":" + bbBin + ":" + process.env.PATH;

  const proverToml = [
    'kyc_level = "' + credential.kyc_level + '"',
    'country_code = "' + credential.country_code + '"',
    'expiry = "' + credential.expiry + '"',
    'wallet_address = "' + strToField(credential.wallet) + '"',
    'min_kyc_level = "2"',
    'current_timestamp = "' + currentTimestamp + '"',
    'issuer_pubkey_hash = "' + strToField(credential.issuer_pubkey_hash) + '"',
  ].join("\n");

  writeFileSync(join(circuitDir, "Prover.toml"), proverToml);

  execSync("nargo execute", {
    cwd: circuitDir,
    env: Object.assign({}, process.env, { PATH }),
    stdio: "pipe",
  });

  const tmpDir = mkdtempSync(join(tmpdir(), "stellarpass-"));
  try {
    const bbPath = bbBin + "/bb";
    execSync(
      bbPath + " prove -b " + circuitJson +
      " -w " + witnessGz +
      " -o " + tmpDir +
      " --scheme ultra_honk --oracle_hash keccak --output_format bytes_and_fields",
      { stdio: "pipe" }
    );

    const proof = readFileSync(join(tmpDir, "proof"));
    const publicInputs = readFileSync(join(tmpDir, "public_inputs"));
    const vk = readFileSync(vkPath);

    const pubInputsArray = [];
    for (let i = 0; i < publicInputs.length; i += 32) {
      pubInputsArray.push("0x" + publicInputs.slice(i, i + 32).toString("hex"));
    }

    process.stdout.write(JSON.stringify({
      proof: "0x" + proof.toString("hex"),
      publicInputs: pubInputsArray,
      proofSize: proof.length,
      vkSize: vk.length,
    }));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch(e => {
  process.stderr.write(e.stack + "\n");
  process.exit(1);
});
