export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  scValToNative,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC!;
const REGISTRY_CONTRACT = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT!;
const RWA_CONTRACT = process.env.NEXT_PUBLIC_RWA_CONTRACT!;
const ISSUER_SECRET = process.env.ISSUER_SECRET!;
const server = new rpc.Server(RPC_URL, { allowHttp: false });

async function checkVerified(wallet: string, issuerAccount: any): Promise<boolean> {
  try {
    const registry = new Contract(REGISTRY_CONTRACT);
    const tx = new TransactionBuilder(issuerAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(registry.call("verify_id", new Address(wallet).toScVal()))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      return scValToNative(sim.result.retval) as boolean;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { from, to, amount } = await req.json();

    if (!from || !to || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const issuer = Keypair.fromSecret(ISSUER_SECRET);
    const issuerAccount = await server.getAccount(issuer.publicKey());

    // Check KYC status using the issuer account for simulation (no friendbot needed)
    const [fromVerified, toVerified] = await Promise.all([
      checkVerified(from, issuerAccount),
      checkVerified(to, issuerAccount),
    ]);

    if (!fromVerified) {
      return NextResponse.json({
        success: false,
        error: "Sender wallet is not KYC verified. Get a StellarPass first.",
      });
    }

    if (!toVerified) {
      return NextResponse.json({
        success: false,
        error: "Recipient wallet is not KYC verified. They need a StellarPass too.",
      });
    }

    // Both verified — execute transfer
    const rwaContract = new Contract(RWA_CONTRACT);

    // Refresh account sequence number
    const freshAccount = await server.getAccount(issuer.publicKey());

    const tx = new TransactionBuilder(freshAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        rwaContract.call(
          "transfer",
          new Address(from).toScVal(),
          new Address(to).toScVal(),
          nativeToScVal(BigInt(amount), { type: "i128" }),
        )
      )
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simResult)) {
      return NextResponse.json({
        success: false,
        error: "Transfer simulation failed: " + JSON.stringify(simResult),
      });
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
      return NextResponse.json({ success: true, txHash: sendResult.hash });
    } else {
      return NextResponse.json({
        success: false,
        error: "Transaction failed: " + getResult.status,
      });
    }

  } catch (e: unknown) {
    console.error("Demo transfer error:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Transfer failed" },
      { status: 500 }
    );
  }
}
