"use client";

import Link from "next/link";
import { GlobeBackground } from "./globe";
import { IconArrow } from "./site";

/**
 * AcmeHero — centered launch-style hero. The dotted globe is the asset, so a
 * centered composition over a full-bleed background visual is the intended
 * pattern here (Section 4.3 override: background-asset hero).
 */
export function AcmeHero() {
  return (
    <header className="hero">
      <div className="hero-grid-bg" aria-hidden />
      <div className="hero-globe" aria-hidden>
        <GlobeBackground />
      </div>

      <div className="hero-inner">
        <h1 className="display reveal d1">
          Prove you&apos;re verified.
          <br />
          <span className="accent-text" style={{ fontWeight: 700 }}>
            Reveal nothing.
          </span>
        </h1>

        <p
          className="lead reveal d2"
          style={{ marginTop: 22, marginInline: "auto" }}
        >
          One zero-knowledge proof, checked on-chain by a Soroban contract,
          unlocks every regulated asset on Stellar. Your identity never leaves
          your device.
        </p>

        <div
          className="row gap-3 hero-cta reveal d3"
          style={{ marginTop: 34 }}
        >
          <Link href="/verify" className="btn btn-primary">
            Get verified <IconArrow />
          </Link>
          <Link href="/check" className="btn btn-ghost">
            Check a wallet
          </Link>
        </div>

        <div
          className="row gap-4 hero-trust mono reveal d4"
          style={{ marginTop: 30, fontSize: "0.74rem" }}
        >
          <span>Zero-knowledge</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>Verified on-chain</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>Under 2 minutes</span>
        </div>
      </div>
    </header>
  );
}
