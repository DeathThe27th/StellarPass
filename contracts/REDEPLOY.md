# Redeploy the StellarPass verifier (fixes on-chain VerificationFailed #5)

**Why:** the verifier contract currently on testnet was built from an older
(Barretenberg v0.82.2-era) verifier and rejects our v0.87.0 proofs. This crate
rebuilds it against the *current* `ultrahonk_soroban_verifier` (CI-proven for bb
v0.87.0). Registry, RWA demo, frontend, prover, and VK are unchanged.

## You do (in a Linux env — a GitHub Codespace on ANY account with free hours, or Gitpod)

Codespaces free hours are **per account**, so if one account is out, open the repo
in a Codespace on your other account.

```bash
# 0. Tooling (Codespaces usually have Rust; add the wasm target + Stellar CLI)
rustup target add wasm32-unknown-unknown
curl -sSf https://stellar.org/install.sh | sh    # or: cargo install --locked stellar-cli
export PATH="$HOME/.local/bin:$PATH"

# 1. Build the contract WASM
cd contracts/stellarpass-verifier
stellar contract build
#   -> target/wasm32-unknown-unknown/release/stellarpass_verifier.wasm

# 2. Register the deployer key (the StellarPass DEPLOYER from BUILDLOG)
stellar keys add deployer --secret-key
#   paste: SDWRR73ERXKASZNOBCYXXMLDDJ5MEZBLB3FGM2ZGMVZEYZWQDU54IW26

# 3. Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellarpass_verifier.wasm \
  --source deployer --network testnet
#   -> prints the NEW verifier contract id:  C..............
```

## Then send me the new contract id

I (or you) finish from anywhere with Node + testnet RPC — no CLI needed:

```bash
# from the repo root
npm install                              # if not already
NEW_VERIFIER_ID=<the C... id> node init-new-verifier.mjs   # initialize + registry.set_verifier
VERIFIER_ID=<the C... id> node test-verify.mjs             # expect: RESULT: SUCCESS
```

Finally, point the frontend at the new verifier:
- Vercel env `NEXT_PUBLIC_VERIFIER_CONTRACT` = the new id, then redeploy Vercel.

## If `stellar contract build` errors

The wrapper in `src/lib.rs` is reconstructed from the deployed interface and may
need a tiny API tweak for your exact soroban-sdk patch. Paste the compiler error
and it's a quick fix.
