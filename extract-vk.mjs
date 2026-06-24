// Extract and reformat the bb.js VK into the 1760-byte format
// that the yugocabrio rust verifier expects.
//
// bb.js getVerificationKey() returns the VK in a specific binary format.
// The rust verifier expects:
//   4 x u64 (big-endian): circuit_size, log_circuit_size, public_inputs_size, pub_inputs_offset
//   27 x G1Point (64 bytes each, uncompressed x||y in big-endian)
//
// The 27 points in order:
//   qm, qc, ql, qr, qo, q4, q_lookup, q_arith, q_delta_range,
//   q_elliptic, q_aux, q_poseidon2_external, q_poseidon2_internal,
//   s1, s2, s3, s4, id1, id2, id3, id4, t1, t2, t3, t4,
//   lagrange_first, lagrange_last

import { UltraHonkBackend, Barretenberg, BackendType } from "@aztec/bb.js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.XDG_CACHE_HOME = "/tmp";
process.env.HOME = "/tmp";

async function main() {
  const circuit = JSON.parse(readFileSync(join(__dirname, "circuits/stellarpass_credential.json"), "utf-8"));
  
  const api = await Barretenberg.new({ backend: BackendType.Wasm });
  const backend = new UltraHonkBackend(circuit.bytecode, api);
  
  // Get the raw VK bytes from bb.js
  const vkBytes = await backend.getVerificationKey();
  console.log("Raw VK size:", vkBytes.length, "bytes");
  
  // Parse the bb.js VK format
  // bb.js VK format (based on barretenberg serialization):
  // First parse the header to find circuit_size, log_circuit_size, public_inputs_size, pub_inputs_offset
  
  let offset = 0;
  
  function readU64BE(buf, off) {
    const hi = buf.readUInt32BE(off);
    const lo = buf.readUInt32BE(off + 4);
    return BigInt(hi) * BigInt(0x100000000) + BigInt(lo);
  }
  
  function readU32BE(buf, off) {
    return buf.readUInt32BE(off);
  }
  
  const buf = Buffer.from(vkBytes);
  
  // Print first 64 bytes to understand structure
  console.log("First 128 bytes of raw VK (hex):");
  console.log(buf.slice(0, 128).toString("hex"));
  
  // The bb.js VK likely starts with:
  // 4 bytes: circuit_size (u32)  OR  8 bytes: circuit_size (u64)
  // Let's check both interpretations
  console.log("\nInterpreting as u32 fields:");
  console.log("circuit_size (u32):", readU32BE(buf, 0));
  console.log("num_public_inputs (u32):", readU32BE(buf, 4));
  console.log("pub_inputs_offset (u32):", readU32BE(buf, 8));
  
  console.log("\nInterpreting as u64 fields:");
  console.log("circuit_size (u64):", readU64BE(buf, 0).toString());
  console.log("log_circuit_size (u64):", readU64BE(buf, 8).toString());
  console.log("num_public_inputs (u64):", readU64BE(buf, 16).toString());
  console.log("pub_inputs_offset (u64):", readU64BE(buf, 24).toString());
  
  await api.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
