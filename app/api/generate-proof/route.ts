export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import { fileURLToPath } from "url";

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    const _require = createRequire(fileURLToPath(import.meta.url));
    const childProcess = _require("child_process");
    const pathMod = _require("path");

    const home = process.env.HOME || "/root";
    const cwd = process.cwd();
    const proverPath = pathMod.join(cwd, "scripts", "prover.mjs");

    const result = await new Promise<object>((resolve, reject) => {
      const child = childProcess.spawn("node", [proverPath], {
        timeout: 120000,
        env: Object.assign({}, process.env, {
          HOME: home,
          XDG_CACHE_HOME: "/tmp",
          PATH: home + "/.nargo/bin:" + home + "/.bb/bin:" + (process.env.PATH || ""),
        }),
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
      child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      child.on("close", (code: number) => {
        if (code !== 0) reject(new Error(stderr || "Prover failed: " + code));
        else resolve(JSON.parse(stdout));
      });
      child.on("error", reject);
      child.stdin.write(JSON.stringify(credential));
      child.stdin.end();
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("Proof generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proof generation failed" },
      { status: 500 }
    );
  }
}
