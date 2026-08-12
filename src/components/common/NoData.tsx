'use client';

import React from 'react';

export interface NoDataProps {
  /** The main heading, defaults to "No Data Found" */
  title?: string;
  /** The descriptive text beneath the title */
  description?: React.ReactNode;
  /** Custom accent color, defaults to the Zukvo blue */
  accent?: string;
  className?: string;
}

/**
 * NoData — A premium empty state component.
 * 
 * Features a glassmorphism bin, a floating document, and the Zukvo runner 
 * playfully escaping along a dotted flight path, set against concentric ripples.
 */
export default function NoData({
  title = "No Data Found",
  description = "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  accent = "#6366F1", // A rich indigo/blue that adapts well
  className = "",
}: NoDataProps) {
  return (
    <div className={`nd-wrap ${className}`} style={{ ['--nd-accent' as any]: accent }}>
      <div className="nd-stage">
        {/* Background Ripples centered on the bucket base (Y=133) */}
        <div className="nd-ripples">
          <div className="nd-ripple nd-ripple-1" />
          <div className="nd-ripple nd-ripple-2" />
          <div className="nd-ripple nd-ripple-3" />
          <div className="nd-ripple nd-ripple-4" />
        </div>

        {/* SVG defining the bucket, document, flight path */}
        <svg className="nd-illustration" viewBox="-20 0 240 200" style={{ overflow: 'visible', position: 'absolute', inset: 0, zIndex: 1 }}>
          <defs>
            <linearGradient id="nd-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-slate-400)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--text-slate-400)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="nd-glass-dark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-slate-400)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--text-slate-400)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Flight Path (looping from bucket to top right) */}
          <path 
            d="M 100,60 C 130,-10 180,-10 170,30 C 160,60 130,50 150,20 C 160,5 180,5 190,10" 
            fill="none" 
            stroke="var(--nd-accent)" 
            strokeWidth="1.5" 
            strokeDasharray="4 4" 
            strokeLinecap="round" 
            style={{ opacity: 0.6 }}
          />

          {/* Paper airplane attached perfectly so the line joins its center notch */}
          <g 
            transform="translate(194, -6) rotate(55)" 
            stroke="var(--nd-accent)" 
            fill="none" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </g>
          
          {/* Back Rim of the dustbin */}
          <path 
            d="M 60,60 A 40 12 0 0 1 140 60" 
            fill="none" 
            stroke="var(--nd-border-tint)" 
            strokeWidth="1.5" 
          />

          {/* Document bouncing up and down inside the dustbin */}
          <g className="nd-doc-anim">
            <g transform="translate(100, 70) rotate(12)">
              <rect x="-24" y="-36" width="48" height="64" rx="4" fill="var(--nd-accent)" stroke="var(--bg-pure-white, #ffffff)" strokeWidth="2" />
              <text fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                <tspan x="0" y="-2">NO</tspan>
                <tspan x="0" y="12">DATA</tspan>
              </text>
            </g>
          </g>

          {/* Front Body of the dustbin (trapezoid frustum with curved bottom and top) */}
          <path 
            d="M 60,60 A 40 12 0 0 0 140 60 L 128,130 A 28 8 0 0 1 72 130 Z" 
            fill="url(#nd-glass)" 
            className="nd-bin-body"
            stroke="var(--nd-border-tint)" 
            strokeWidth="1.5" 
          />
          
          {/* Recycle Icon */}
          <g transform="translate(88, 82) scale(1)" stroke="var(--nd-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M7 15.3 2.3 11 7 6.7"/>
            <path d="m11.5 9.6-4.2-2.2A4.4 4.4 0 0 1 5 3.1L6.7 5"/>
            <path d="m17 15.3 4.7-4.3-4.7-4.3"/>
            <path d="m12.5 9.6 4.2-2.2a4.4 4.4 0 0 0 2.3-4.3L17.3 5"/>
            <path d="M7 21h10"/>
            <path d="M12 18v-4.4c0-2.3 2-4.1 4.3-4.1h2.2"/>
          </g>

          {/* Base Rings / Stand */}
          <ellipse cx="100" cy="130" rx="36" ry="10" fill="none" stroke="var(--nd-border-tint)" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="100" cy="133" rx="44" ry="12" fill="none" stroke="var(--nd-border-tint)" strokeWidth="1.5" opacity="0.3" />

        </svg>
      </div>

      <div className="nd-title">{title}</div>
      <div className="nd-desc">{description}</div>

      <style>{`
        .nd-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          position: relative;
          text-align: center;
          overflow: hidden;
          min-height: 400px;
          border-radius: 16px;
          background: transparent;
          --nd-border-tint: color-mix(in srgb, var(--text-slate-400) 60%, transparent);
        }
        
        [data-theme='dark'] .nd-wrap,
        html.dark .nd-wrap {
          --nd-border-tint: color-mix(in srgb, var(--text-slate-400) 40%, transparent);
        }

        /* ── Ripples ──────────────────────────────────────────────────────── */
        .nd-ripples {
          position: absolute;
          top: 133px;
          left: 120px;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 200px;
          z-index: 0;
          pointer-events: none;
        }
        .nd-ripple {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          border: 1px solid color-mix(in srgb, var(--text-slate-400) 25%, transparent);
          border-radius: 50%;
        }
        .nd-ripple-1 { width: 140px; height: 35px; opacity: 0.8; }
        .nd-ripple-2 { width: 240px; height: 60px; opacity: 0.6; }
        .nd-ripple-3 { width: 340px; height: 85px; opacity: 0.4; }
        .nd-ripple-4 { width: 440px; height: 110px; opacity: 0.2; }

        /* ── Stage ───────────────────────────────────────────────────────── */
        .nd-stage {
          position: relative;
          width: 240px;
          height: 200px;
          margin-bottom: 24px;
          z-index: 1;
        }
        
        /* ── SVG Bucket ──────────────────────────────────────────────────── */
        .nd-doc-anim {
          animation: nd-bob 4s ease-in-out infinite;
          transform-origin: 100px 70px;
        }
        
        @keyframes nd-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        
        [data-theme='dark'] .nd-bin-body,
        html.dark .nd-bin-body {
          fill: url(#nd-glass-dark);
        }

        /* ── Typography ──────────────────────────────────────────────────── */
        .nd-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin-bottom: 12px;
          z-index: 2;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .nd-title,
        html.dark .nd-title {
          color: var(--text-slate-200);
        }

        .nd-desc {
          font-size: 14px;
          color: var(--text-slate-500, #64748b);
          max-width: 320px;
          line-height: 1.5;
          z-index: 2;
          transition: color 0.3s ease;
        }
        [data-theme='dark'] .nd-desc,
        html.dark .nd-desc {
          color: var(--text-slate-400);
        }
      `}</style>
    </div>
  );
}
