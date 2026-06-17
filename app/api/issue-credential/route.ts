import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { wallet, fullName, countryCode, kycLevel } = await req.json();

  if (!wallet || !fullName || !countryCode || !kycLevel) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Mock KYC validation — in production this calls a real KYC provider
  const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year
  const nullifierSecret = "0x" + randomBytes(31).toString("hex");

  // issuer_pubkey_hash — hash of our issuer keypair public key
  const issuerPubkeyHash = "0x" + createHash("sha256")
    .update("stellarpass-issuer-v1")
    .digest("hex")
    .slice(0, 62); // fit in Field

  const credential = {
    wallet,
    kyc_level: kycLevel,
    country_code: countryCode,
    expiry,
    issuer_pubkey_hash: issuerPubkeyHash,
    nullifier_secret: nullifierSecret,
  };

  return NextResponse.json(credential);
}
