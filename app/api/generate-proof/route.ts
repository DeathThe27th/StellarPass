export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    // Use eval-based dynamic execution to prevent Turbopack from analyzing spawn
    const result = await new Function("credential", `
      return new Promise((resolve, reject) => {
        const { spawn } = require("child_process");
        const { join } = require("path");
        const home = process.env.HOME || "/root";
        const proverPath = join(process.cwd(), "scripts", "prover.mjs");

        const child = spawn("node", [proverPath], {
          timeout: 120000,
          env: Object.assign({}, process.env, {
            HOME: home,
            XDG_CACHE_HOME: "/tmp",
            PATH: home + "/.nargo/bin:" + home + "/.bb/bin:" + (process.env.PATH || ""),
          }),
        });

        let stdout = "";
        let stderr = "";
        child.stdout.on("data", d => { stdout += d.toString(); });
        child.stderr.on("data", d => { stderr += d.toString(); });
        child.on("close", code => {
          if (code !== 0) reject(new Error(stderr || "Prover failed: " + code));
          else resolve(JSON.parse(stdout));
        });
        child.on("error", reject);
        child.stdin.write(JSON.stringify(credential));
        child.stdin.end();
      });
    `)(credential);

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("Proof generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proof generation failed" },
      { status: 500 }
    );
  }
}
