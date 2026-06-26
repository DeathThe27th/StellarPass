import express from "express";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "10mb" }));

function strToField(str) {
  const hash = createHash("sha256").update(str).digest("hex");
  return BigInt("0x" + hash.slice(0, 62)).toString();
}

app.get("/health", (_, res) => res.json({ ok: true, service: "stellarpass-prover" }));

app.post("/prove", async (req, res) => {
  const credential = req.body;
  const circuitSrc = join(__dirname, "circuits", "stellarpass_credential");
  const workDir = mkdtempSync(join(tmpdir(), "stellarpass-"));
  const targetDir = join(workDir, "target");
  const srcDir = join(workDir, "src");

  try {
    mkdirSync(targetDir, { recursive: true });
    mkdirSync(srcDir, { recursive: true });

    copyFileSync(join(circuitSrc, "Nargo.toml"), join(workDir, "Nargo.toml"));
    copyFileSync(join(circuitSrc, "src", "main.nr"), join(srcDir, "main.nr"));
    copyFileSync(join(circuitSrc, "target", "stellarpass_credential.json"), join(targetDir, "stellarpass_credential.json"));

    const currentTimestamp = Math.floor(Date.now() / 1000);
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
    const PATH = home + "/.nargo/bin:" + home + "/.bb/bin:" + process.env.PATH;

    execSync(join(__dirname, "bin", "nargo") + " execute", {
      cwd: workDir,
      env: Object.assign({}, process.env, { PATH, HOME: home, NARGO_HOME: "/tmp" }),
      stdio: "pipe",
    });

    const proofOutDir = mkdtempSync(join(tmpdir(), "proof-"));
    const bbBin = join(__dirname, "bin", "bb");

    execSync(
      bbBin + " prove" +
      " -b " + join(targetDir, "stellarpass_credential.json") +
      " -w " + join(targetDir, "stellarpass_credential.gz") +
      " -o " + proofOutDir +
      " --scheme ultra_honk --oracle_hash keccak --output_format bytes_and_fields",
      { stdio: "pipe", env: Object.assign({}, process.env, { HOME: home }) }
    );

    const proof = readFileSync(join(proofOutDir, "proof"));
    const publicInputs = readFileSync(join(proofOutDir, "public_inputs"));
    const vk = readFileSync(join(circuitSrc, "target", "vk"));

    const pubInputsArray = [];
    for (let i = 0; i < publicInputs.length; i += 32) {
      pubInputsArray.push("0x" + publicInputs.slice(i, i + 32).toString("hex"));
    }

    res.json({
      proof: "0x" + proof.toString("hex"),
      publicInputs: pubInputsArray,
      proofSize: proof.length,
      vkSize: vk.length,
    });

    rmSync(proofOutDir, { recursive: true, force: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Prover server on port " + PORT));
