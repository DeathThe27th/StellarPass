# StellarPass

**Prove you're verified. Access every regulated asset on Stellar.**

StellarPass is a zero-knowledge KYC identity layer for Stellar's regulated-asset
ecosystem. A user proves they hold a valid KYC credential — sufficient level, not
expired, allowed jurisdiction, issued by a real issuer — **without revealing any of
the underlying personal data**. The proof is verified **on-chain** inside a Soroban
smart contract, which then stamps the wallet as verified. Regulated assets (RWAs)
check that stamp before allowing transfers.

> Built for **Stellar Hacks: Real-World ZK** (DoraHacks).

---

## Is the ZK proof actually verified on-chain? Yes.

This is the core of the project, so to be unambiguous: **the proof is verified by a
smart contract on Stellar testnet — not off-chain, not mocked.**

When a user verifies, the flow is:

```
  Noir circuit  ──►  UltraHonk proof (Barretenberg bb 0.87.0, keccak)
                         │   14,592-byte proof + 4 public inputs
                         ▼
   verify_and_stamp(proof, public_inputs, wallet, kyc_level, expiry)
                         │   submitted as a Soroban transaction
                         ▼
   Verifier contract (Rust/Soroban)  ──►  runs the FULL UltraHonk verifier on-chain:
     • parses the proof
     • rebuilds the Fiat–Shamir transcript using on-chain keccak256
     • runs sumcheck + Shplemini/Gemini + the KZG pairing check
     • against the stored 1,760-byte verification key
                         │   if the math fails → VerificationFailed, nothing is stamped
                         ▼
   Registry contract  ──►  stamps the wallet's identity (kyc_level, expiry, nullifier)
                         ▼
   RWA demo contract  ──►  checks the stamp before every transfer
```

The cryptographic checking happens in the contract itself. During development we
observed the contract **reject** an invalid/mismatched proof (`Error #5
VerificationFailed`) and then **accept** a valid one (`Ok`) — i.e. the on-chain
verifier genuinely runs the verification math.

---

## What the circuit proves

[`circuits/stellarpass_credential/src/main.nr`](circuits/stellarpass_credential/src/main.nr)

| Inputs | |
|---|---|
| **Private** (hidden) | `kyc_level`, `country_code`, `expiry` |
| **Public** | `wallet_address`, `min_kyc_level`, `current_timestamp`, `issuer_pubkey_hash` |

Assertions proven in zero knowledge:
- `kyc_level >= min_kyc_level` — meets the required KYC tier
- `expiry > current_timestamp` — credential hasn't expired
- `country_code != 0` — jurisdiction is present / not sanctioned
- `issuer_pubkey_hash != 0` — issued by a real issuer

So a verifier learns *"this wallet holds a KYC credential of at least level N, currently
valid"* — and nothing about the person's actual level, country, or expiry date.

---

## Live deployment (Stellar testnet)

| Component | Address / URL |
|---|---|
| Verifier contract | `CA2J45JL2GQXQORQHLAR6XRFFROJLQHZC5XVWTF5TO3PZ557U5CJ3C6S` |
| Registry contract | `CCD45IDTIOTP5J7MDI7RQM4MHDIN2FWSCV7FMIB5CZJ6XABHL2Q3ZLNN` |
| RWA demo contract | `CBFE5EBXU4MHUQOSY3KNAFJHB24HZNBSIDWJV3E2D5SMPCW3WNEJK6EH` |
| Prover server | `https://stellarpass-prover.onrender.com` |
| Frontend | Vercel (Next.js) |

Explore the contracts on [Stellar Expert (testnet)](https://stellar.expert/explorer/testnet).

---

## Architecture

- **ZK circuit** — Noir `1.0.0-beta.9`, proving the credential predicates above.
- **Proof system** — UltraHonk with a **keccak** oracle hash (Barretenberg `bb` `0.87.0`),
  so the transcript matches an on-chain keccak256 verifier. Proofs are 14,592 bytes; the
  VK is 1,760 bytes.
- **On-chain verifier** — Rust/Soroban contract wrapping the
  [`ultrahonk_soroban_verifier`](https://github.com/yugocabrio/ultrahonk-rust-verifier)
  (UltraHonk verification in Soroban). Source: [`contracts/stellarpass-verifier/`](contracts/stellarpass-verifier/).
- **Registry** — stores verified identities; `set_verifier` lets the admin point it at the
  verifier; `verify_id` is read by consumers.
- **RWA demo** — a sample regulated asset that calls `verify_id` before transfers.
- **Prover server** — an Express service (Dockerized) that runs `nargo` + `bb` to produce
  real proofs. Deployed on Render.
- **Frontend** — Next.js 16 app with the multi-step KYC flow, wallet lookup, and RWA demo.

### Tech stack

| Layer | Technology |
|---|---|
| ZK circuit | Noir 1.0.0-beta.9 |
| Proof system | UltraHonk / keccak (bb 0.87.0) |
| On-chain verifier | Rust / Soroban (soroban-sdk 26) + yugocabrio UltraHonk verifier |
| Smart contracts | Rust / Soroban |
| Frontend | Next.js 16 + TypeScript |
| Stellar SDK | @stellar/stellar-sdk 16 |
| Hosting | Vercel (frontend) · Render (prover) · Stellar testnet |

---

## Run it locally

```bash
# Frontend
npm install
npm run dev          # http://localhost:3000
```

The frontend needs these env vars (point them at the deployed contracts/prover):

```
NEXT_PUBLIC_REGISTRY_CONTRACT=CCD45IDTIOTP5J7MDI7RQM4MHDIN2FWSCV7FMIB5CZJ6XABHL2Q3ZLNN
NEXT_PUBLIC_RWA_CONTRACT=CBFE5EBXU4MHUQOSY3KNAFJHB24HZNBSIDWJV3E2D5SMPCW3WNEJK6EH
NEXT_PUBLIC_VERIFIER_CONTRACT=CA2J45JL2GQXQORQHLAR6XRFFROJLQHZC5XVWTF5TO3PZ557U5CJ3C6S
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC=https://soroban-testnet.stellar.org
PROVER_URL=https://stellarpass-prover.onrender.com
ISSUER_SECRET=<an issuer secret key>
```

Verify the on-chain verifier end-to-end (pulls a real proof and simulates
`verify_and_stamp` against the live contract):

```bash
VERIFIER_ID=CA2J45JL2GQXQORQHLAR6XRFFROJLQHZC5XVWTF5TO3PZ557U5CJ3C6S \
PROVER_URL=https://stellarpass-prover.onrender.com \
node test-verify.mjs
# => RESULT: SUCCESS — verification passed!
```

Rebuild/redeploy the verifier contract: see [`contracts/REDEPLOY.md`](contracts/REDEPLOY.md).

---

## Honest scope & limitations

This is a hackathon demo of the **ZK + on-chain-verification pipeline**, and it does that
genuinely. Where it stops short of production:

- **Credential issuance is demo-grade.** The prover currently builds a credential from
  supplied values and hashes the issuer key. A production system needs a real, trusted KYC
  issuer cryptographically signing attestations, and the circuit checking that signature —
  so the proof is bound to a genuine off-chain identity verification.
- **No nullifier-uniqueness / revocation enforcement yet.** A nullifier is recorded, but
  double-stamping and revocation flows aren't fully enforced on-chain.
- **Testnet only.** Keys, contracts, and assets are testnet. Don't reuse the keys on mainnet.
- **Issuer key handling.** The demo uses a server-side issuer secret for stamping
  transactions; production would separate issuance, proving, and submission.

What *is* real and verifiable: the ZK proof, the circuit predicates, and the **on-chain
verification** that gates the identity stamp.

---

## Repo layout

```
app/                          Next.js app (pages + API routes)
  api/generate-proof          calls the prover server
  api/stamp-identity          submits proof to the verifier contract on-chain
circuits/stellarpass_credential   Noir circuit + compiled artifacts + VK
contracts/stellarpass-verifier    Soroban verifier contract (Rust)
prover-server.mjs             Express prover (Dockerized) — runs nargo + bb
init-new-verifier.mjs         initialize verifier + registry.set_verifier (via RPC)
test-verify.mjs               end-to-end on-chain verification harness
```
