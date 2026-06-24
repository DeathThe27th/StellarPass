export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";

function runProver(credential: object): Promise<string> {
  const { spawn } = require("child_process") as typeof import("child_process");
  const { join } = require("path") as typeof import("path");

  return new Promise((resolve, reject) => {
    const proverPath = join(process.cwd(), "scripts", "prover.mjs");
    const home = process.env.HOME || "/root";

    const child = spawn("node", [proverPath], {
      timeout: 120_000,
      env: {
        ...process.env,
        HOME: home,
        XDG_CACHE_HOME: "/tmp",
        PATH: home + "/.nargo/bin:" + home + "/.bb/bin:" + (process.env.PATH || ""),
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    child.on("close", (code: number) => {
      if (code !== 0) reject(new Error(stderr || "Prover exited with code " + code));
      else resolve(stdout);
    });

    child.on("error", reject);
    child.stdin.write(JSON.stringify(credential));
    child.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();
    const output = await runProver(credential);
    const result = JSON.parse(output);
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("Proof generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proof generation failed" },
      { status: 500 }
    );
  }
}
