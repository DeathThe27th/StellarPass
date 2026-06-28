import Link from "next/link";
import { Nav, Footer, IconArrow, IconCheck, IconLock, IconChip, IconLink } from "./components/site";
import { AcmeHero } from "./components/hero";

const VERIFIER = "CA2J45JL2GQXQORQHLAR6XRFFROJLQHZC5XVWTF5TO3PZ557U5CJ3C6S";

const ASSETS = [
  { name: "Franklin Templeton BENJI", type: "Money-market fund" },
  { name: "Spiko US T-Bill", type: "Treasury token" },
  { name: "WisdomTree Funds", type: "Digital fund" },
  { name: "Centrifuge", type: "Real-world asset" },
  { name: "SG-Forge EURCV", type: "Digital currency" },
];

const STEPS = [
  { k: "Submit KYC", b: "Your credential is issued and signed off-chain. Nothing here touches the blockchain." },
  { k: "Generate proof", b: "A Noir circuit produces an UltraHonk proof of your credential's validity, not its contents." },
  { k: "Verify on-chain", b: "A Soroban contract runs the full proof verification itself and stamps your wallet." },
  { k: "Access assets", b: "Regulated tokens check that stamp before every transfer. One stamp, every asset." },
];

export default function Home() {
  return (
    <div className="page">
      <Nav />

      {/* ===== HERO — acme-style centered hero over dotted globe ===== */}
      <AcmeHero />

      {/* ===== STAT STRIP (different family) ===== */}
      <section className="container">
        <div className="surface stat-strip">
          {[
            ["0 B", "personal data on-chain"],
            ["14,592 B", "UltraHonk proof, keccak"],
            ["1,760 B", "verifier key on-chain"],
            ["1 stamp", "every SEP-compatible asset"],
          ].map(([v, l]) => (
            <div key={l} className="stat">
              <div className="stat-v mono">{v}</div>
              <div className="dim" style={{ fontSize: "0.8rem", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS — connected flow ===== */}
      <section className="section">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2 className="h2" style={{ marginTop: 16, maxWidth: "18ch" }}>
            From KYC form to an on-chain stamp in under two minutes.
          </h2>
          <div className="flow" style={{ marginTop: 48 }}>
            {STEPS.map((s, i) => (
              <div key={s.k} className="flow-step">
                <div className="flow-node mono">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="h3" style={{ marginBottom: 8 }}>{s.k}</h3>
                <p className="body" style={{ fontSize: "0.92rem" }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ON-CHAIN VERIFICATION — split text + live receipt ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container verify-grid">
          <div>
            <span className="eyebrow">Checked by a contract, not a server</span>
            <h2 className="h2" style={{ marginTop: 16 }}>
              The proof is verified <span className="accent-text">on-chain</span>.
            </h2>
            <p className="body" style={{ marginTop: 16, maxWidth: "46ch" }}>
              When you verify, the proof is submitted to a Soroban smart contract that runs the entire
              UltraHonk verifier itself: it rebuilds the transcript with on-chain keccak, runs sumcheck and
              the pairing check, and only then stamps your wallet. If the math fails, nothing is stamped.
            </p>
            <div className="stack gap-2" style={{ marginTop: 24 }}>
              {["Noir circuit, UltraHonk + keccak (bb 0.87.0)", "Rust verifier on Soroban (soroban-sdk 26)", "Verification key stored and read on-chain"].map((t) => (
                <div key={t} className="row gap-3">
                  <span className="accent-text" style={{ display: "grid", placeItems: "center" }}><IconCheck size={17} /></span>
                  <span className="body" style={{ fontSize: "0.92rem", color: "var(--text)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* receipt card — real call shape */}
          <div className="card card-pad receipt">
            <div className="row between" style={{ marginBottom: 16 }}>
              <span className="badge badge-accent"><span className="dot" /> verify_and_stamp</span>
              <span className="mono dim" style={{ fontSize: "0.74rem" }}>Soroban · testnet</span>
            </div>
            <div className="receipt-rows mono">
              <div className="rr"><span className="dim">proof</span><span>14,592 bytes</span></div>
              <div className="rr"><span className="dim">public inputs</span><span>4 fields</span></div>
              <div className="rr"><span className="dim">verifier key</span><span>1,760 bytes</span></div>
              <div className="rr"><span className="dim">transcript</span><span>keccak-256</span></div>
            </div>
            <div className="receipt-result mono">
              <span className="accent-text row gap-2"><IconCheck size={16} /> Ok</span>
              <span className="dim">verification passed</span>
            </div>
            <a href={`https://stellar.expert/explorer/testnet/contract/${VERIFIER}`} target="_blank" rel="noopener noreferrer" className="row gap-2 nav-link" style={{ marginTop: 16, fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
              <IconLink size={14} /> {VERIFIER.slice(0, 10)}…{VERIFIER.slice(-6)}
            </a>
          </div>
        </div>
      </section>

      {/* ===== UNDER THE HOOD — bento with diversity ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="h2" style={{ marginBottom: 32, maxWidth: "20ch" }}>Real cryptography, end to end.</h2>
          <div className="bento">
            <div className="card card-pad card-hover col-3 bento-feature">
              <span className="accent-text"><IconChip size={26} /></span>
              <h3 className="h3" style={{ marginTop: 16 }}>The circuit proves four things</h3>
              <p className="body" style={{ marginTop: 8, fontSize: "0.92rem" }}>
                KYC level meets the threshold, the credential hasn&apos;t expired, the jurisdiction is allowed,
                and the issuer is real. The values themselves stay private.
              </p>
              <div className="row gap-2" style={{ marginTop: 18, flexWrap: "wrap" }}>
                {["kyc_level ≥ min", "not expired", "country ≠ 0", "issuer ≠ 0"].map((t) => (
                  <span key={t} className="badge" style={{ fontSize: "0.7rem" }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="card card-pad card-hover col-3 bento-tint">
              <span className="accent-text"><IconLock size={26} /></span>
              <h3 className="h3" style={{ marginTop: 16 }}>Private by construction</h3>
              <p className="body" style={{ marginTop: 8, fontSize: "0.92rem" }}>
                Name, country, level, and expiry are private inputs. Only the proof and four field elements
                are ever submitted, and none of them is your data.
              </p>
            </div>
            <div className="card card-pad card-hover col-2">
              <h3 className="h3">One stamp</h3>
              <p className="body" style={{ marginTop: 8, fontSize: "0.9rem" }}>Verify once. Every regulated asset reads the same registry.</p>
            </div>
            <div className="card card-pad card-hover col-2">
              <h3 className="h3">Auditable</h3>
              <p className="body" style={{ marginTop: 8, fontSize: "0.9rem" }}>The stamp lives in a Soroban contract. Anyone can check any wallet.</p>
            </div>
            <div className="card card-pad card-hover col-2">
              <h3 className="h3">Revocable</h3>
              <p className="body" style={{ marginTop: 8, fontSize: "0.9rem" }}>Registry admin can revoke. Expiry is enforced on every check.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPATIBLE ASSETS — divider rows ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container assets-grid">
          <div>
            <h2 className="h2" style={{ maxWidth: "14ch" }}>One stamp. Every regulated asset.</h2>
            <p className="body" style={{ marginTop: 16, maxWidth: "40ch" }}>
              Stellar is becoming the settlement layer for tokenized real-world assets. StellarPass is the
              identity check those assets call before they move.
            </p>
          </div>
          <div className="rows">
            {ASSETS.map((a) => (
              <div key={a.name} className="row-item">
                <span className="row gap-3"><span className="dot" style={{ background: "var(--accent-line)" }} />{a.name}</span>
                <span className="mono dim" style={{ fontSize: "0.74rem" }}>{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA — centered manifesto ===== */}
      <section className="section">
        <div className="container-tight center">
          <h2 className="h2">Get your StellarPass.</h2>
          <p className="lead" style={{ margin: "16px auto 0" }}>
            Under two minutes. Your identity stays private, and your wallet walks away with an on-chain stamp.
          </p>
          <div className="row gap-3" style={{ justifyContent: "center", marginTop: 28 }}>
            <Link href="/verify" className="btn btn-primary">Get verified <IconArrow /></Link>
            <Link href="/demo" className="btn btn-ghost">See the RWA demo</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
