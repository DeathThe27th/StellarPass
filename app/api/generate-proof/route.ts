import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";

function runProver(credential: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const proverPath = join(process.cwd(), "scripts", "prover.mjs");
    const child = spawn("node", [proverPath], {
      timeout: 120_000,
      env: { ...process.env, NODE_PATH: join(process.cwd(), "node_modules") },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Prover exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    child.on("error", reject);

    // Send credential via stdin
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
