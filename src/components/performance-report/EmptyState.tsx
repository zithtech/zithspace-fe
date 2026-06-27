'use client';

import React from 'react';

// Premium empty state for a report stage with no records. Box-shaped to match
// the report aesthetic — a glowing accent tile over a soft radial wash, with
// layered cards behind it for depth.
export default function EmptyState({
  icon,
  title,
  subtitle,
  accent = '#3B82F6',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="pes-wrap" style={{ ['--accent' as any]: accent }}>
      <div className="pes-stage">
        <span className="pes-card pes-card--l" />
        <span className="pes-card pes-card--r" />
        <span className="pes-tile">{icon}</span>
        <span className="pes-glow" />
      </div>
      <div className="pes-title">{title}</div>
      {subtitle && <div className="pes-sub">{subtitle}</div>}

      <style jsx>{`
        .pes-wrap {
          flex: 1;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 56px 24px;
          border: 1px solid #eef2f7;
          background:
            radial-gradient(
              130% 90% at 50% 0%,
              color-mix(in srgb, var(--accent) 7%, #fff) 0%,
              #ffffff 58%
            );
          position: relative;
          overflow: hidden;
        }
        /* faint dotted texture */
        .pes-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px);
          background-size: 18px 18px;
          -webkit-mask-image: radial-gradient(60% 50% at 50% 38%, #000 0%, transparent 75%);
          mask-image: radial-gradient(60% 50% at 50% 38%, #000 0%, transparent 75%);
          pointer-events: none;
        }

        .pes-stage {
          position: relative;
          width: 120px;
          height: 92px;
          margin-bottom: 18px;
          z-index: 1;
        }
        /* layered "record" cards peeking from behind the tile */
        .pes-card {
          position: absolute;
          width: 56px;
          height: 64px;
          left: 50%;
          top: 50%;
          background: #ffffff;
          border: 1px solid #e9eef5;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
        }
        .pes-card--l {
          transform: translate(-50%, -52%) rotate(-11deg) translateX(-16px);
          opacity: 0.7;
        }
        .pes-card--r {
          transform: translate(-50%, -52%) rotate(11deg) translateX(16px);
          opacity: 0.7;
        }
        .pes-tile {
          position: absolute;
          width: 64px;
          height: 64px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--accent) 16%, #fff),
            color-mix(in srgb, var(--accent) 8%, #fff)
          );
          border: 1px solid color-mix(in srgb, var(--accent) 24%, #fff);
          box-shadow: 0 12px 28px color-mix(in srgb, var(--accent) 24%, transparent);
          z-index: 2;
        }
        .pes-glow {
          position: absolute;
          width: 130px;
          height: 130px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--accent) 22%, transparent) 0%,
            transparent 65%
          );
          filter: blur(6px);
          z-index: 0;
        }

        .pes-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          z-index: 1;
        }
        .pes-sub {
          font-size: 12.5px;
          color: #64748b;
          margin-top: 5px;
          max-width: 380px;
          line-height: 1.55;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
