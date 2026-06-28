"use client";

import { useEffect, useRef } from "react";
import createGlobe, { type COBEOptions } from "cobe";

// cobe's bundled types omit onRender (it exists at runtime); extend locally.
type GlobeOptions = COBEOptions & {
  onRender: (state: Record<string, number>) => void;
};

/**
 * WireframeDottedGlobe — a dotted-sphere globe rendered with cobe.
 * Tuned monochrome (black dots on white) to sit quietly behind the hero.
 * Auto-rotates; collapses to a static frame under prefers-reduced-motion.
 */
export function GlobeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    const onResize = () => {
      width = canvas.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    const opts: GlobeOptions = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.18,
      dark: 0, // light render
      diffuse: 0.9,
      mapSamples: 22000, // dense dots = wireframe feel
      mapBrightness: 5.6, // strong dots so they read on white
      mapBaseBrightness: 0,
      baseColor: [1, 1, 1], // white sphere body (invisible on white page)
      markerColor: [0, 0, 0], // black landmass dots
      glowColor: [1, 1, 1], // no colored glow
      opacity: 0.62,
      markers: [],
      scale: 1,
      onRender: (state) => {
        if (!reduce) phiRef.current += 0.0035;
        state.phi = phiRef.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    };

    const globe = createGlobe(canvas, opts);

    // fade in once the first frame is painted
    requestAnimationFrame(() => {
      if (canvas) canvas.style.opacity = "1";
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        width: "100%",
        height: "100%",
        opacity: 0,
        transition: "opacity 1.2s ease",
        contain: "layout paint size",
      }}
    />
  );
}
