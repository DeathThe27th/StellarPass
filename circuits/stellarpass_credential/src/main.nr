fn main(
    // Private inputs
    kyc_level: u64,
    country_code: u64,
    expiry: u64,

    // Public inputs
    wallet_address: pub Field,
    min_kyc_level: pub u64,
    current_timestamp: pub u64,
    issuer_pubkey_hash: pub Field,
) {
    assert(kyc_level >= min_kyc_level, "KYC level below required threshold");
    assert(expiry > current_timestamp, "Credential has expired");
    assert(country_code != 0, "Country code is sanctioned or missing");
    assert(issuer_pubkey_hash != 0, "Issuer public key hash is zero");
}

#[test]
fn test_valid_credential() {
    main(2, 566, 1_800_000_000, 999, 2, 1_700_000_000, 12345);
}

#[test(should_fail_with = "KYC level below required threshold")]
fn test_kyc_level_too_low() {
    main(1, 566, 1_800_000_000, 999, 2, 1_700_000_000, 12345);
}

#[test(should_fail_with = "Credential has expired")]
fn test_expired_credential() {
    main(2, 566, 1_000_000_000, 999, 2, 1_700_000_000, 12345);
}

#[test(should_fail_with = "Country code is sanctioned or missing")]
fn test_sanctioned_country() {
    main(2, 0, 1_800_000_000, 999, 2, 1_700_000_000, 12345);
}
