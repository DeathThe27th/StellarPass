import { NextRequest, NextResponse } from "next/server";
import {
  Contract,
  Networks,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  Keypair,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC!;
const REGISTRY_CONTRACT = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT!;
const ISSUER_SECRET = process.env.ISSUER_SECRET!;
const server = new rpc.Server(RPC_URL, { allowHttp: false });

export async function POST(req: NextRequest) {
  const { credential } = await req.json();

  try {
    const issuer = Keypair.fromSecret(ISSUER_SECRET);
    const account = await server.getAccount(issuer.publicKey());
    const contract = new Contract(REGISTRY_CONTRACT);

    const nullifierBigInt = BigInt(
      "0x" + Buffer.from(credential.nullifier_secret.slice(2), "hex")
        .slice(0, 15)
        .toString("hex")
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "stamp_identity",
          new Address(credential.wallet).toScVal(),
          nativeToScVal(credential.kyc_level, { type: "u32" }),
          nativeToScVal(credential.expiry, { type: "u64" }),
          nativeToScVal(nullifierBigInt, { type: "i128" }),
        )
      )
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simResult)) {
      throw new Error("Simulation failed: " + JSON.stringify(simResult));
    }

    const preparedTx = rpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(issuer);

    const sendResult = await server.sendTransaction(preparedTx);

    // Poll for completion
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
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
