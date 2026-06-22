export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  Contract, Networks, rpc, TransactionBuilder,
  BASE_FEE, Address, xdr, Keypair,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC!;
const VERIFIER_CONTRACT = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT!;
const ISSUER_SECRET = process.env.ISSUER_SECRET!;
const server = new rpc.Server(RPC_URL, { allowHttp: false });

export async function POST(req: NextRequest) {
  try {
    const { credential, proof, publicInputs } = await req.json();

    const issuer = Keypair.fromSecret(ISSUER_SECRET);
    const account = await server.getAccount(issuer.publicKey());
    const contract = new Contract(VERIFIER_CONTRACT);

    // Convert proof hex to bytes ScVal
    const proofHex = proof.replace("0x", "");
    const proofBuffer = Buffer.from(proofHex, "hex");
    const proofScVal = xdr.ScVal.scvBytes(proofBuffer);

    // Encode public inputs as bytes (4 x 32-byte fields)
    // Order matches circuit: wallet_address, min_kyc_level, current_timestamp, issuer_pubkey_hash
    const pubInputsBuffer = Buffer.concat(
      publicInputs.map((pi: string) => {
        const hex = pi.replace("0x", "").padStart(64, "0");
        return Buffer.from(hex, "hex");
      })
    );
    const pubInputsScVal = xdr.ScVal.scvBytes(pubInputsBuffer);

    // Wallet address
    const walletScVal = new Address(credential.wallet).toScVal();

    // KYC level as u32
    const kycLevelScVal = xdr.ScVal.scvU32(credential.kyc_level);

    // Expiry as u64
    const expiryScVal = xdr.ScVal.scvU64(
      xdr.Uint64.fromString(credential.expiry.toString())
    );

    const tx = new TransactionBuilder(account, {
      fee: "10000000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "verify_and_stamp",
          proofScVal,
          pubInputsScVal,
          walletScVal,
          kycLevelScVal,
          expiryScVal,
        )
      )
      .setTimeout(60)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simResult)) {
      throw new Error("Simulation failed: " + JSON.stringify(simResult));
    }

    const preparedTx = rpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(issuer);
    const sendResult = await server.sendTransaction(preparedTx);

    let getResult = await server.getTransaction(sendResult.hash);
    let attempts = 0;
    while (getResult.status === "NOT_FOUND" && attempts < 20) {
      await new Promise(r => setTimeout(r, 1500));
      getResult = await server.getTransaction(sendResult.hash);
      attempts++;
    }

    if (getResult.status === "SUCCESS") {
      return NextResponse.json({ txHash: sendResult.hash });
    } else {
      throw new Error("Transaction failed: " + getResult.status);
    }

  } catch (e: unknown) {
    console.error("Stamp error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stamp failed" },
      { status: 500 }
    );
  }
}
