import { NextRequest, NextResponse } from "next/server";
import {
  Contract,
  Networks,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Address,
  scValToNative,
  Keypair,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC!;
const REGISTRY_CONTRACT = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT!;
const server = new rpc.Server(RPC_URL, { allowHttp: false });

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  try {
    const contract = new Contract(REGISTRY_CONTRACT);
    // Use a dummy keypair just for simulation
    const dummy = Keypair.random();
    const account = await server.getAccount(dummy.publicKey()).catch(() => null);

    if (!account) {
      // Friendbot the dummy account for simulation
      await fetch(`https://friendbot.stellar.org?addr=${dummy.publicKey()}`);
      await new Promise(r => setTimeout(r, 3000));
    }

    const acc = await server.getAccount(dummy.publicKey());
    const tx = new TransactionBuilder(acc, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("verify_id", new Address(wallet).toScVal()))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result) {
      const verified = scValToNative(result.result.retval) as boolean;
      return NextResponse.json({ verified });
    }
    return NextResponse.json({ verified: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ verified: false });
  }
}
