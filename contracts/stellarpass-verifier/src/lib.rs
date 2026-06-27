#![no_std]
//! StellarPass verifier contract.
//!
//! Reconstructed to match the deployed interface (pulled from testnet):
//!   initialize(vk_bytes, registry, admin) -> Result
//!   verify_and_stamp(proof_bytes, public_inputs, wallet, kyc_level, expiry) -> Result
//!   vk_size() -> u32
//!   verify_id(wallet) -> bool
//!
//! The only behavioural change vs. the previously deployed build is that the ZK
//! verification now uses the CURRENT `ultrahonk_soroban_verifier` (Barretenberg
//! v0.87.0 compatible). Everything else mirrors the original so the registry,
//! RWA demo, and frontend keep working unchanged.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, vec, Address, Bytes, Env,
    IntoVal,
};
use ultrahonk_soroban_verifier::UltraHonkVerifier;

/// UltraHonk keccak proof size for this circuit: 456 field elements * 32 bytes.
const PROOF_BYTES: u32 = 14_592;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    ProofSizeError = 3,
    VkParseError = 4,
    // Discriminant 5 intentionally matches the historical `#5` so external
    // tooling/observability stays consistent.
    VerificationFailed = 5,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Registry,
    Vk,
}

#[contract]
pub struct StellarPassVerifier;

#[contractimpl]
impl StellarPassVerifier {
    /// Store the verification key, the registry address, and the admin.
    pub fn initialize(
        env: Env,
        vk_bytes: Bytes,
        registry: Address,
        admin: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Vk, &vk_bytes);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Length of the stored verification key (used for sanity checks). 1760 bytes.
    pub fn vk_size(env: Env) -> u32 {
        let vk: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .expect("not initialized");
        vk.len()
    }

    /// Verify an UltraHonk KYC proof and, on success, stamp the identity in the registry.
    pub fn verify_and_stamp(
        env: Env,
        proof_bytes: Bytes,
        public_inputs: Bytes,
        wallet: Address,
        kyc_level: u32,
        expiry: u64,
    ) -> Result<(), Error> {
        if proof_bytes.len() != PROOF_BYTES {
            return Err(Error::ProofSizeError);
        }

        let vk_bytes: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .ok_or(Error::NotInitialized)?;
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .ok_or(Error::NotInitialized)?;

        // ---- the fix: current verifier, bb v0.87.0 compatible ----
        let verifier = UltraHonkVerifier::new(&env, &vk_bytes).map_err(|_| Error::VkParseError)?;
        verifier
            .verify(&env, &proof_bytes, &public_inputs)
            .map_err(|_| Error::VerificationFailed)?;

        // Deterministic nullifier derived from the wallet public input
        // (public_inputs[0] = hashed wallet). Low 8 bytes -> i128.
        let mut head = [0u8; 32];
        public_inputs.slice(0..32).copy_into_slice(&mut head);
        let nullifier = u64::from_be_bytes([
            head[24], head[25], head[26], head[27], head[28], head[29], head[30], head[31],
        ]) as i128;

        // Cross-contract call: registry.stamp_id(wallet, kyc_level, expiry, nullifier)
        let args = vec![
            &env,
            wallet.into_val(&env),
            kyc_level.into_val(&env),
            expiry.into_val(&env),
            nullifier.into_val(&env),
        ];
        env.invoke_contract::<()>(&registry, &symbol_short!("stamp_id"), args);

        Ok(())
    }

    /// Convenience proxy: ask the registry whether `wallet` holds a valid identity.
    pub fn verify_id(env: Env, wallet: Address) -> bool {
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("not initialized");
        let args = vec![&env, wallet.into_val(&env)];
        env.invoke_contract::<bool>(&registry, &symbol_short!("verify_id"), args)
    }
}
