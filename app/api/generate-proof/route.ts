import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    const proverPath = join(process.cwd(), "scripts", "prover.mjs");

    // Run the standalone prover script, passing credential via stdin
    const { stdout, stderr } = await execFileAsync(
      "node",
      [proverPath],
      {
        input: JSON.stringify(credential),
        timeout: 120_000, // 2 min timeout — proof generation takes time
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for proof output
        env: {
          ...process.env,
          // Ensure node_modules is resolvable from the script's location
          NODE_PATH: join(process.cwd(), "node_modules"),
        },
      }
    );

    if (stderr) {
      console.warn("Prover stderr:", stderr);
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);

  } catch (e: unknown) {
    console.error("Proof generation error:", e);
    const msg = e instanceof Error ? e.message : "Proof generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
