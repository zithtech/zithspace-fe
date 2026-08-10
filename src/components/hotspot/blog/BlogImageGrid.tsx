'use client';

import React from 'react';
import { Image } from 'antd';
import type { BlogImage } from '@/services/hotspotBlogService';

// Instagram's collage rules, which exist because they read well:
//   1 image  — full width at its own aspect ratio, capped in height
//   2        — side by side, square
//   3        — one tall on the left, two stacked on the right
//   4        — 2×2 grid
//   5+       — 2×2 grid with a "+N" veil on the last tile
//
// SIZING RULE FOR THIS FILE — do not reintroduce `height: 100%`:
//   An earlier version sized the tiles with a chain of percentage heights
//   (tile auto -> .ant-image 100% -> img 100%). In a grid whose row height is
//   itself derived from content, that percentage has nothing definite to
//   resolve against, and the images collapsed to zero height — they simply did
//   not appear. Every tile here is now either intrinsically sized (the single
//   image) or has a definite aspect-ratio box its image fills by absolute
//   positioning. No percentage resolves against an auto height anywhere.
const MAX_TILES = 4;

export default function BlogImageGrid({ images }: { images: BlogImage[] }) {
  if (images.length === 0) return null;

  const shown = images.slice(0, MAX_TILES);
  const overflow = images.length - shown.length;
  const layout =
    images.length === 1 ? 'one' : images.length === 2 ? 'two' : images.length === 3 ? 'three' : 'four';

  return (
    <div className={`hsb-grid is-${layout}`}>
      <Image.PreviewGroup>
        {shown.map((img, i) => (
          <div className="hsb-tile" key={img.id}>
            <Image
              src={img.fileUrl}
              alt={img.fileName}
              rootClassName="hsb-imgroot"
              className="hsb-img"
            />
            {overflow > 0 && i === shown.length - 1 && (
              <span className="hsb-more">+{overflow}</span>
            )}
          </div>
        ))}
        {/* Images past the fold are still registered with the preview group, so
            "+3" opens a lightbox that can actually reach them. */}
        <div className="hsb-hidden" aria-hidden>
          {images.slice(MAX_TILES).map((img) => (
            <Image key={img.id} src={img.fileUrl} alt={img.fileName} />
          ))}
        </div>
      </Image.PreviewGroup>

      <style jsx>{`
        .hsb-grid {
          display: grid;
          gap: 2px;
          background: var(--bg-slate-100);
          border-top: 1px solid var(--border-slate-100);
          border-bottom: 1px solid var(--border-slate-100);
        }
        .hsb-grid.is-one { grid-template-columns: 1fr; }
        .hsb-grid.is-two { grid-template-columns: 1fr 1fr; }
        .hsb-grid.is-three { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .hsb-grid.is-three .hsb-tile:first-child { grid-row: span 2; }
        .hsb-grid.is-four { grid-template-columns: 1fr 1fr; }

        .hsb-tile { position: relative; overflow: hidden; background: var(--bg-slate-50); }

        /* ── Single image: intrinsic height, no percentages at all ────────── */
        .hsb-grid.is-one .hsb-tile :global(.hsb-imgroot) { display: block; width: 100%; }
        .hsb-grid.is-one .hsb-tile :global(.hsb-img) {
          display: block;
          width: 100%;
          height: auto;
          max-height: 440px;
          object-fit: contain;
          cursor: zoom-in;
        }

        /* ── Multi-image: a definite aspect box the image fills absolutely ── */
        .hsb-grid.is-two .hsb-tile,
        .hsb-grid.is-four .hsb-tile,
        .hsb-grid.is-three .hsb-tile { aspect-ratio: 1 / 1; }
        /* The tall left tile spans two square rows, so its box is definite too. */
        .hsb-grid.is-three .hsb-tile:first-child { aspect-ratio: auto; }

        .hsb-grid:not(.is-one) .hsb-tile :global(.hsb-imgroot) {
          position: absolute;
          inset: 0;
          display: block;
        }
        .hsb-grid:not(.is-one) .hsb-tile :global(.hsb-img) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: zoom-in;
          display: block;
        }

        .hsb-more {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.55);
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          pointer-events: none;
        }
        .hsb-hidden { display: none; }
      `}</style>
    </div>
  );
}
