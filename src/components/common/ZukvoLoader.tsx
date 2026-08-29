"use client";

/**
 * ZukvoLoader — the branded loading state.
 *
 * The Zukvo mark is a figure mid-stride with a briefcase, so instead of a
 * generic spinner it is animated as what it already is: running. The figure
 * bobs and leans through a stride cycle, its ground shadow squashes in sync
 * (small when the figure is at the top of the bob), the ground scrolls beneath
 * it and speed lines stream past — so the motion reads as forward travel rather
 * than a bouncing image.
 *
 * Sizes escalate with how much of the screen is waiting:
 *   sm  inline, beside a label — a section fetching its own data
 *   md  a panel, a table body, a modal
 *   lg  the whole page
 *
 * Honours prefers-reduced-motion by falling back to a gentle pulse.
 *
 * Self-contained: the stylesheet ships with the component, so dropping it
 * anywhere works without touching globals.css.
 */

import React from "react";
import Image from "next/image";
import { useProduct } from "@/context/ProductContext";

export type ZukvoLoaderSize = "sm" | "md" | "lg";

export interface ZukvoLoaderProps {
  /** How much of the screen is waiting. Default "md". */
  size?: ZukvoLoaderSize;
  /** Shown beside (sm) or beneath (md/lg) the runner. */
  message?: string;
  /**
   * Fill the available space:
   *   true         the content area beneath the app header — a page inside MainLayout
   *   "viewport"   the whole screen, with a background — pre-auth screens that
   *                render before the app chrome exists
   */
  fullscreen?: boolean | "viewport";
  className?: string;
}

const RUNNER_PX: Record<ZukvoLoaderSize, number> = { sm: 30, md: 56, lg: 88 };

export default function ZukvoLoader({
  size = "md",
  message,
  fullscreen = false,
  className,
}: ZukvoLoaderProps) {
  // NOTE: the stride animation was choreographed around the Zukvo mark — a
  // figure mid-run with a briefcase. Swapping in another product's mark keeps
  // the brand correct (which is the bug worth fixing) but the motion no longer
  // illustrates the artwork. Testiez likely wants its own loader motion; that
  // is a design decision, not one to make silently here.
  const { brand } = useProduct();
  const px = RUNNER_PX[size];
  const showScenery = size !== "sm";
  const fill = fullscreen === "viewport" ? " zl--viewport" : fullscreen ? " zl--fullscreen" : "";

  return (
    <div
      className={`zl zl--${size}${fill}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      style={{ ["--zl-runner" as any]: `${px}px` }}
    >
      {/* Inline rather than injected in an effect, so the first paint is already
          styled — a loader that flashes unstyled defeats its own purpose. This
          is also how the rest of QA Space carries its page styles. */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="zl__stage">
        {showScenery && (
          <div className="zl__speed" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}

        <div className="zl__runner" aria-hidden="true">
          <Image src={brand.mark} alt="" width={px} height={px} priority unoptimized />
        </div>

        <div className="zl__shadow" aria-hidden="true" />
        {showScenery && <div className="zl__ground" aria-hidden="true" />}
      </div>

      {message && <span className="zl__label">{message}</span>}
      {!message && <span className="zl__sr">Loading</span>}

      {size === "lg" && (
        <div className="zl__bar" aria-hidden="true">
          <span />
        </div>
      )}
    </div>
  );
}

export interface ZukvoLoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  size?: ZukvoLoaderSize;
  message?: string;
  /** Keeps a region that is empty on first load tall enough to centre in. */
  minHeight?: number;
  className?: string;
}

/**
 * Blurs a region and floats the runner over it while it refreshes.
 *
 * Preferable to a spinner boxed inside a table body: the whole region visibly
 * goes inert, and the content stays in place instead of collapsing and
 * reflowing when the rows come back.
 *
 * Wrap only the part that is actually refreshing. Wrapping filters or a search
 * box would blur and disable them mid-keystroke, which is worse than no loader
 * at all.
 */
export function ZukvoLoadingOverlay({
  loading,
  children,
  size = "md",
  message,
  minHeight,
  className,
}: ZukvoLoadingOverlayProps) {
  return (
    <div
      className={`zlo${loading ? " is-loading" : ""}${className ? ` ${className}` : ""}`}
      style={minHeight ? { minHeight } : undefined}
      aria-busy={loading}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* inert rather than merely dimmed — clicking a blurred row would be a bug */}
      <div className="zlo__content">{children}</div>

      {loading && (
        <div className="zlo__veil">
          <ZukvoLoader size={size} message={message} />
        </div>
      )}
    </div>
  );
}

const STYLES = `
.zl {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 8px; color: var(--text-slate-500);
}
.zl--sm { flex-direction: row; gap: 10px; padding: 4px 0; }
/* Inside MainLayout the 64px app header is already on screen. */
.zl--fullscreen { min-height: calc(100vh - 64px); }
/* Before the app chrome exists there is nothing else to sit under, and nothing
   painting a background either — so this variant provides both. */
.zl--viewport { min-height: 100vh; width: 100%; background: var(--bg-pure-white); }

/* ── Overlay ──────────────────────────────────────────────────────── */
.zlo { position: relative; }
.zlo__content { transition: filter .18s ease, opacity .18s ease; }
.zlo.is-loading .zlo__content {
  filter: blur(3px); opacity: .5;
  /* Inert while refreshing — a blurred row must not be clickable. */
  pointer-events: none; user-select: none;
}
.zlo__veil {
  position: absolute; inset: 0; z-index: 5;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, .40);
  animation: zlo-fade .18s ease both;
}
[data-theme='dark'] .zlo__veil { background: rgba(11, 15, 26, .40); }
@keyframes zlo-fade { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .zlo__content { transition: none; }
  .zlo__veil { animation: none; }
}

.zl__stage {
  position: relative; flex-shrink: 0;
  width: calc(var(--zl-runner) * 2.4);
  height: calc(var(--zl-runner) * 1.35);
  display: flex; align-items: flex-end; justify-content: center;
}
.zl--sm .zl__stage { width: var(--zl-runner); height: calc(var(--zl-runner) * 1.1); }

/* The figure: two footfalls per cycle, so it reads as running rather than
   hopping. ~0.31s per step is a realistic running cadence. */
.zl__runner {
  position: relative; z-index: 2;
  width: var(--zl-runner); height: var(--zl-runner);
  margin-bottom: calc(var(--zl-runner) * 0.15);
  transform-origin: 50% 90%;
  animation: zl-stride .62s ease-in-out infinite;
}
.zl__runner img { width: 100%; height: 100%; object-fit: contain; display: block; }
/* The mark is solid black — flip it so it stays visible on a dark canvas. */
[data-theme='dark'] .zl__runner img { filter: invert(1); }

/* Contact patch under the figure. It shrinks as the figure rises, which is what
   sells the bob as a stride, and its centre sits on the ground line so the
   figure reads as grounded rather than floating.
   --text-slate-900 flips light in dark mode, so this becomes a soft glow there —
   deliberate: a dark shadow would be invisible against the dark canvas. */
.zl__shadow {
  position: absolute; z-index: 1; bottom: calc(var(--zl-runner) * 0.085);
  width: calc(var(--zl-runner) * 0.62); height: calc(var(--zl-runner) * 0.075);
  border-radius: 999px; background: var(--text-slate-900, #0f172a);
  filter: blur(2px); transform-origin: 50% 50%;
  animation: zl-shadow .62s ease-in-out infinite;
}

.zl__ground {
  position: absolute; left: 0; right: 0; bottom: calc(var(--zl-runner) * 0.12);
  height: 2px; color: var(--border-slate-200, #e2e8f0);
  background-image: repeating-linear-gradient(90deg, currentColor 0 9px, transparent 9px 20px);
  animation: zl-ground .62s linear infinite;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent);
}

/* Streaks passing the runner — the sense of forward travel. */
.zl__speed { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.zl__speed span {
  position: absolute; height: 2px; border-radius: 999px;
  background: linear-gradient(90deg, transparent, #3B82F6);
  opacity: 0; animation: zl-streak 1.05s linear infinite;
}
.zl__speed span:nth-child(1) { top: 24%; width: 26%; animation-delay: 0s; }
.zl__speed span:nth-child(2) { top: 44%; width: 34%; animation-delay: .22s; }
.zl__speed span:nth-child(3) { top: 62%; width: 20%; animation-delay: .46s; }
.zl__speed span:nth-child(4) { top: 78%; width: 30%; animation-delay: .70s; }

.zl__label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -.01em; }
.zl--lg .zl__label { font-size: 13.5px; }

/* Indeterminate progress — only on the full-page variant. */
.zl__bar {
  width: 168px; height: 3px; border-radius: 999px; overflow: hidden;
  background: var(--border-slate-100, #f1f5f9);
}
.zl__bar > span {
  display: block; width: 42%; height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #3B82F6, #10b981);
  animation: zl-bar 1.15s cubic-bezier(.65, 0, .35, 1) infinite;
}

.zl__sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* Two footfalls per cycle — a tall drive off one leg, then a shorter one off
   the other. The uneven beats are what stop it reading as a bouncing image. */
@keyframes zl-stride {
  0%   { transform: translateY(0)    rotate(-1.5deg); }
  28%  { transform: translateY(-18%) rotate(1.5deg); }
  50%  { transform: translateY(-4%)  rotate(2.5deg); }
  76%  { transform: translateY(-12%) rotate(0deg); }
  100% { transform: translateY(0)    rotate(-1.5deg); }
}
@keyframes zl-shadow {
  0%   { transform: scaleX(1);   opacity: .20; }
  28%  { transform: scaleX(.60); opacity: .07; }
  50%  { transform: scaleX(.92); opacity: .17; }
  76%  { transform: scaleX(.70); opacity: .10; }
  100% { transform: scaleX(1);   opacity: .20; }
}
/* Two dash periods per cycle, so the ground keeps pace with the two footfalls. */
@keyframes zl-ground {
  to { background-position-x: -40px; }
}
@keyframes zl-streak {
  0%   { transform: translateX(115%); opacity: 0; }
  18%  { opacity: .85; }
  70%  { opacity: .5; }
  100% { transform: translateX(-135%); opacity: 0; }
}
@keyframes zl-bar {
  0%   { transform: translateX(-105%); }
  100% { transform: translateX(255%); }
}

/* A running figure is a lot of motion — offer a calm equivalent. */
@media (prefers-reduced-motion: reduce) {
  .zl__runner { animation: zl-pulse 1.6s ease-in-out infinite; }
  .zl__shadow { animation: none; opacity: .14; }
  .zl__ground, .zl__speed { display: none; }
  .zl__bar > span { animation-duration: 2.4s; }
  @keyframes zl-pulse {
    0%, 100% { opacity: .55; transform: none; }
    50%      { opacity: 1;   transform: none; }
  }
}
`;
