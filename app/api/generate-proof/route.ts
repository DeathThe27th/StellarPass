export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";

const PROVER_URL = process.env.PROVER_URL || "https://psychic-potato-7w74vp54x57hpp75-4000.app.github.dev";

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    const res = await fetch(PROVER_URL + "/prove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
      signal: AbortSignal.timeout(110_000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error("Prover error: " + err);
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("Proof generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proof generation failed" },
      { status: 500 }
    );
  }
}
