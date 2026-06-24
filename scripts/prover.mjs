#!/usr/bin/env node
import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, existsSync } from "fs";
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

  const cwd = process.cwd();
  const circuitSrc = join(cwd, "circuits", "stellarpass_credential");
  const circuitJson = join(circuitSrc, "target", "stellarpass_credential.json");
  const vkPath = join(circuitSrc, "target", "vk");

  // Work entirely in /tmp — only writable dir on Vercel
  const workDir = mkdtempSync(join(tmpdir(), "stellarpass-"));
  const targetDir = join(workDir, "target");
  const srcDir = join(workDir, "src");
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(srcDir, { recursive: true });

  try {
    // Copy circuit files into /tmp
    copyFileSync(join(circuitSrc, "Nargo.toml"), join(workDir, "Nargo.toml"));
    copyFileSync(join(circuitSrc, "src", "main.nr"), join(srcDir, "main.nr"));
    copyFileSync(circuitJson, join(targetDir, "stellarpass_credential.json"));

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Write Prover.toml in /tmp
    const proverToml = [
      'kyc_level = "' + credential.kyc_level + '"',
      'country_code = "' + credential.country_code + '"',
      'expiry = "' + credential.expiry + '"',
      'wallet_address = "' + strToField(credential.wallet) + '"',
      'min_kyc_level = "2"',
      'current_timestamp = "' + currentTimestamp + '"',
      'issuer_pubkey_hash = "' + strToField(credential.issuer_pubkey_hash) + '"',
    ].join("\n");
    writeFileSync(join(workDir, "Prover.toml"), proverToml);

    const home = process.env.HOME || "/root";
    const nargoBin = join(cwd, "bin", "nargo");
    const bbBin = join(cwd, "bin", "bb");

    // nargo execute in /tmp workdir
    execSync(nargoBin + " execute", {
      cwd: workDir,
      env: Object.assign({}, process.env, { HOME: "/tmp", XDG_CACHE_HOME: "/tmp", NARGO_HOME: "/tmp", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_COUNT: "0" }),
      stdio: "pipe",
    });

    const witnessGz = join(targetDir, "stellarpass_credential.gz");
    const circuitJsonTmp = join(targetDir, "stellarpass_credential.json");
    const proofOutDir = mkdtempSync(join(tmpdir(), "proof-"));

    // bb prove in /tmp
    execSync(
      bbBin + " prove" +
      " -b " + circuitJsonTmp +
      " -w " + witnessGz +
      " -o " + proofOutDir +
      " --scheme ultra_honk --oracle_hash keccak --output_format bytes_and_fields",
      { stdio: "pipe", env: Object.assign({}, process.env, { HOME: home }) }
    );

    const proof = readFileSync(join(proofOutDir, "proof"));
    const publicInputs = readFileSync(join(proofOutDir, "public_inputs"));
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

    rmSync(proofOutDir, { recursive: true, force: true });
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch(e => {
  process.stderr.write(e.stack + "\n");
  process.exit(1);
});
