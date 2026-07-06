'use client';

import React from 'react';

// Renders a My Hub self-service panel WITHOUT its feature's own sidebar/layout.
// The feature pages (leaves-v2, attendance, etc.) normally get their padding and
// sticky-header spacing from their own layout.tsx. When we reuse just the panel
// under My Hub, we reproduce that spacing here so the content looks identical —
// minus the feature's admin left rail. The `[class*="-header"]` rule matches the
// panel header classes (lv-header, adb-header, cio-header, pr-header, …).
export default function MyHubContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="mh-page">
      <div className="mh-page-content">{children}</div>

      <style jsx global>{`
        .mh-page {
          margin: 0 -8px;
          min-height: calc(100vh - 64px);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
        }
        .mh-page-content {
          flex: 1;
          min-height: 0;
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        /* Stretch panel headers to the edges and keep them sticky, mirroring the
           feature layouts' content shells. */
        .mh-page-content > * > [class*="-header"] {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          position: sticky;
          top: 0;
          z-index: 98;
          background: var(--bg-pure-white);
          padding-top: 12px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        .mh-page-content > * > [class*="-header"] + * {
          margin-top: 16px !important;
        }
        @media (max-width: 1024px) {
          .mh-page-content {
            padding: 0 16px;
          }
          .mh-page-content > * > [class*="-header"] {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
