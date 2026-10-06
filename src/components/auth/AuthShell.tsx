'use client';

import React from 'react';
import Image from 'next/image';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useProduct } from '@/context/ProductContext';

// ---------------------------------------------------------------------------
// The auth surface is a split canvas: an art panel that carries the brand's
// forward lean, and a bare form column with no card and no input boxes. The
// only chrome on the right-hand side is type and a single hairline per field.
// ---------------------------------------------------------------------------

const shellStyles = `
/* --- canvas ------------------------------------------------------------ */
.zk-auth {
  --zk-ink:        #E8EDF5;
  --zk-ash:        #94A3B8;
  --zk-ash-dim:    #6B7A93;
  --zk-ash-faint:  #4A566B;
  --zk-hairline:   rgba(148, 163, 184, 0.16);
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  background: #07090d;
  color: var(--zk-ink);
  overflow: hidden;
}

/* --- art panel --------------------------------------------------------- */
.zk-auth__art {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid var(--zk-hairline);
  background:
    radial-gradient(ellipse 70% 60% at 30% 40%, rgba(37, 99, 235, 0.16) 0%, transparent 70%),
    linear-gradient(145deg, #090b10 0%, #11151d 55%, #080a0f 100%);
}
.zk-auth__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.045) 1px, transparent 1px);
  background-size: 88px 88px;
  -webkit-mask-image: radial-gradient(ellipse 75% 70% at 35% 45%, #000 10%, transparent 80%);
          mask-image: radial-gradient(ellipse 75% 70% at 35% 45%, #000 10%, transparent 80%);
}
/* The mark, blown up until only its silhouette survives. It runs off two
   edges on purpose, so the wordmark baked into the artwork stays off-canvas. */
.zk-auth__ghost {
  position: absolute;
  left: -20%;
  bottom: -46%;
  width: 78%;
  min-width: 480px;
  height: auto;
  opacity: 0.03;
  pointer-events: none;
}
.zk-auth__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 100% 100% at 40% 50%, transparent 45%, rgba(3, 6, 12, 0.7) 100%);
}
.zk-auth__artfoot {
  position: absolute;
  left: 56px;
  bottom: 44px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: var(--zk-ash-faint);
  letter-spacing: 0.02em;
}
.zk-auth__artfoot::before {
  content: '';
  width: 40px;
  height: 1px;
  background: var(--zk-hairline);
}

/* --- the track: lines the light runs along ----------------------------- */
@keyframes zk-run {
  0%   { transform: translateX(-30%); opacity: 0; }
  12%  { opacity: 1; }
  72%  { opacity: 1; }
  100% { transform: translateX(340%); opacity: 0; }
}
@keyframes zk-breathe {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
.zk-track { position: absolute; height: 1px; border-radius: 1px; overflow: visible; }
.zk-track__rail {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.16) 30%, rgba(148, 163, 184, 0.16) 70%, transparent);
}
.zk-track__pulse {
  position: absolute;
  top: -0.5px;
  left: 0;
  width: 30%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--zk-accent) 65%, #dbeafe);
  box-shadow: 0 0 12px 1px var(--zk-accent-glow);
  animation: zk-run linear infinite;
}
.zk-spark {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: var(--zk-accent);
  box-shadow: 0 0 10px 2px var(--zk-accent-glow);
  animation: zk-breathe 5s ease-in-out infinite;
}

/* --- form column ------------------------------------------------------- */
.zk-auth__panel {
  position: relative;
  flex: 0 0 min(560px, 46vw);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 56px;
  background: #090b10;
}
.zk-auth__inner { width: 100%; max-width: 380px; margin: 0 auto; }
.zk-auth__lockup { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
.zk-auth__heading {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #F8FAFC;
  white-space: nowrap;
}
.zk-auth__sub {
  margin: 12px 0 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--zk-ash);
}
.zk-auth__body { margin-top: 36px; }
.zk-auth__panelfoot { display: none; margin-top: 40px; font-size: 12px; color: var(--zk-ash-faint); }

@media (max-width: 960px) {
  .zk-auth__art { display: none; }
  /* No art panel to lean on, so the canvas carries the glow itself. */
  .zk-auth__panel {
    flex: 1 1 auto;
    padding: 40px 24px;
    background:
      radial-gradient(ellipse 130% 40% at 50% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 70%),
      #090b10;
  }
  .zk-auth__panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
    background-size: 72px 72px;
    -webkit-mask-image: radial-gradient(ellipse 90% 45% at 50% 8%, #000 0%, transparent 75%);
            mask-image: radial-gradient(ellipse 90% 45% at 50% 8%, #000 0%, transparent 75%);
    pointer-events: none;
  }
  .zk-auth__inner { position: relative; }
  .zk-auth__panelfoot { display: block; text-align: center; }
  .zk-auth__lockup { justify-content: center; }
  .zk-auth__heading, .zk-auth__sub { text-align: center; }
  .zk-auth__heading { font-size: 28px; }
}

@media (prefers-reduced-motion: reduce) {
  .zk-track__pulse, .zk-spark { animation: none; }
  .zk-track__pulse { opacity: 0.5; transform: translateX(120%); }
}
`;

// globals.css forces .ant-input backgrounds with !important, so the bare-field
// treatment has to be reasserted at higher specificity under .zk-auth.
const fieldStyles = `
/* Fields are a hairline and nothing else — no box, no fill, no radius. */
.zk-auth .ant-input,
.zk-auth .ant-input-affix-wrapper,
.zk-auth .ant-input-password {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 9px 0 !important;
  font-size: 15px;
  color: var(--zk-ink) !important;
  transition: border-color .25s ease;
}
.zk-auth .ant-input-affix-wrapper .ant-input {
  border: none !important;
  padding: 0 !important;
}
.zk-auth .ant-input:hover,
.zk-auth .ant-input-affix-wrapper:hover {
  border-bottom-color: rgba(148, 163, 184, 0.34) !important;
}
.zk-auth .ant-input::placeholder,
.zk-auth .ant-input-affix-wrapper input::placeholder {
  color: #445064 !important;
}

/* The focus sweep: a line of accent drawn left-to-right under the field. */
.zk-auth .ant-form-item-control-input:has(input.ant-input) { position: relative; }
.zk-auth .ant-form-item-control-input:has(input.ant-input)::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--zk-accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform .45s cubic-bezier(.2,.8,.2,1);
  pointer-events: none;
}
.zk-auth .ant-form-item-control-input:has(input.ant-input):focus-within::after {
  transform: scaleX(1);
}

/* Labels read as small caps set above the line. */
.zk-auth .ant-form-item-label { padding-bottom: 2px !important; }
.zk-auth .ant-form-item-label > label {
  height: auto !important;
  font-size: 10.5px !important;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--zk-ash-dim) !important;
  transition: color .25s ease;
}
.zk-auth .ant-form-item:focus-within .ant-form-item-label > label { color: var(--zk-accent) !important; }
.zk-auth .ant-form-item-explain-error { font-size: 12px; margin-top: 6px; }
.zk-auth .ant-checkbox-wrapper { color: var(--zk-ash); font-size: 13px; }
.zk-auth .ant-input-password-icon { color: #445064 !important; }
.zk-auth .ant-input-password-icon:hover { color: var(--zk-ash) !important; }
.zk-auth input:-webkit-autofill,
.zk-auth input:-webkit-autofill:hover,
.zk-auth input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #090b10 inset !important;
  -webkit-text-fill-color: var(--zk-ink) !important;
  caret-color: var(--zk-ink);
}

/* --- the primary action: a bar whose arrow leans forward on hover ------ */
.zk-auth .zk-submit {
  height: 54px !important;
  border: none !important;
  border-radius: 12px !important;
  background: var(--zk-accent) !important;
  color: #fff !important;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  box-shadow: 0 10px 30px -12px var(--zk-accent-glow) !important;
  transition: background .2s ease, box-shadow .2s ease, transform .2s ease;
}
.zk-auth .zk-submit:hover:not(:disabled) {
  background: var(--zk-accent-hi) !important;
  box-shadow: 0 16px 36px -12px var(--zk-accent-glow) !important;
  transform: translateY(-1px);
}
.zk-auth .zk-submit .anticon { transition: transform .25s cubic-bezier(.2,.8,.2,1); }
.zk-auth .zk-submit:hover:not(:disabled) .anticon { transform: translateX(3px); }

/* Quiet counterpart to .zk-submit. */
.zk-auth .zk-ghost {
  height: 54px !important;
  background: transparent !important;
  border: 1px solid var(--zk-hairline) !important;
  border-radius: 12px !important;
  color: var(--zk-ash) !important;
  box-shadow: none !important;
  transition: border-color .2s ease, color .2s ease;
}
.zk-auth .zk-ghost:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.34) !important;
  color: var(--zk-ink) !important;
}

/* SSO reduced to two unlabelled discs. */
.zk-auth .zk-social {
  width: 46px !important;
  height: 46px !important;
  padding: 0 !important;
  border-radius: 999px !important;
  background: transparent !important;
  border: 1px solid var(--zk-hairline) !important;
  box-shadow: none !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color .2s ease, transform .2s ease, background .2s ease;
}
.zk-auth .zk-social:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.06) !important;
  border-color: rgba(148, 163, 184, 0.32) !important;
  transform: translateY(-2px);
}

.zk-auth .zk-link { color: var(--zk-accent-hi); text-decoration: none; transition: color .2s ease; }
.zk-auth .zk-link:hover { color: #93C5FD !important; }

.zk-auth .ant-alert {
  background: rgba(59, 130, 246, 0.07) !important;
  border: 1px solid var(--zk-hairline) !important;
  border-radius: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .zk-auth .zk-submit, .zk-auth .zk-social, .zk-auth .ant-form-item-control-input::after { transition: none; }
  .zk-auth .zk-submit:hover, .zk-auth .zk-social:hover { transform: none; }
}
`;

/** Rails the light runs along, positioned as percentages of the art panel. */
const TRACKS = [
  { top: '22%', left: '-10%', width: '62%', dur: '11s', delay: '0s' },
  { top: '38%', left: '6%',  width: '46%', dur: '15s', delay: '3.4s' },
  { top: '54%', left: '-4%', width: '78%', dur: '9s',  delay: '1.6s' },
  { top: '68%', left: '18%', width: '40%', dur: '17s', delay: '6s' },
  { top: '81%', left: '2%',  width: '55%', dur: '13s', delay: '2.2s' },
];

const SPARKS = [
  { top: '30%', left: '72%', delay: '0s' },
  { top: '46%', left: '24%', delay: '1.8s' },
  { top: '74%', left: '64%', delay: '3.1s' },
];

function ArtPanel({
  mark,
  invertMark,
  legalName,
}: {
  mark: React.ComponentProps<typeof Image>['src'];
  invertMark: boolean;
  legalName: string;
}) {
  return (
    <div className="zk-auth__art" aria-hidden>
      <div className="zk-auth__grid" />

      {/* The track, sheared to the mark's forward lean. */}
      <div style={{ position: 'absolute', inset: 0, transform: 'rotate(-7deg)' }}>
        {TRACKS.map((track) => (
          <div
            key={track.top}
            className="zk-track"
            style={{ top: track.top, left: track.left, width: track.width }}
          >
            <span className="zk-track__rail" />
            <span
              className="zk-track__pulse"
              style={{ animationDuration: track.dur, animationDelay: track.delay }}
            />
          </div>
        ))}
        {SPARKS.map((spark) => (
          <span
            key={spark.top}
            className="zk-spark"
            style={{ top: spark.top, left: spark.left, animationDelay: spark.delay }}
          />
        ))}
      </div>

      {/* The mark, blown up and dropped almost to nothing. */}
      <Image
        className="zk-auth__ghost"
        src={mark}
        alt=""
        style={invertMark ? { filter: 'invert(1)' } : undefined}
      />

      <div className="zk-auth__vignette" />
      <div className="zk-auth__artfoot">
        © {new Date().getFullYear()} {legalName}
      </div>
    </div>
  );
}

// The auth pages own a fixed dark surface, independent of the user's app theme.
export const authTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#3B82F6',
    colorText: '#E8EDF5',
    colorTextSecondary: '#94A3B8',
    colorTextPlaceholder: '#445064',
    colorBorder: 'rgba(148, 163, 184, 0.16)',
    colorBgContainer: 'transparent',
    borderRadius: 12,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Input: {
      colorBgContainer: 'transparent',
      colorBorder: 'rgba(148, 163, 184, 0.18)',
      activeShadow: 'none',
      controlHeight: 44,
      borderRadius: 0,
      paddingInline: 0,
    },
    Form: {
      itemMarginBottom: 22,
      verticalLabelPadding: '0 0 2px',
    },
    Checkbox: {
      colorBgContainer: 'transparent',
      colorBorder: 'rgba(148, 163, 184, 0.28)',
      borderRadius: 4,
    },
    Button: {
      controlHeight: 54,
      borderRadius: 12,
      fontWeight: 600,
      primaryShadow: 'none',
    },
  },
};

/**
 * Kept for the pages that still pass it to their CTA. The look now lives in
 * `.zk-submit`, so this only needs to not fight it.
 */
export const authSubmitStyle: React.CSSProperties = {
  fontSize: 15,
  border: 'none',
};

interface AuthShellProps {
  /** Large line at the top of the form column. Defaults to "Welcome back". */
  heading?: React.ReactNode;
  /** Quiet line under the heading, e.g. "Reset your password". */
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The chrome shared by every auth screen: art panel on the left, bare form
 * column on the right, brand lockup and footer.
 */
export default function AuthShell({ heading = 'Welcome back', subtitle, children }: AuthShellProps) {
  const { brand, manifest, product } = useProduct();
  // Zukvo's mark is drawn dark-on-light, so it has to be inverted for the
  // charcoal canvas. Testiez ships artwork cut for dark surfaces already.
  const invertMark = product === 'zukvo';

  return (
    <ConfigProvider theme={{ ...authTheme, token: { ...authTheme.token, colorPrimary: brand.accent } }}>
      <div
        className="zk-auth zk-login"
        style={
          {
            '--zk-accent': brand.accent,
            '--zk-accent-hi': '#60A5FA',
            '--zk-accent-glow': 'rgba(59, 130, 246, 0.55)',
          } as React.CSSProperties
        }
      >
        <style>{shellStyles + fieldStyles}</style>

        <ArtPanel mark={brand.mark} invertMark={invertMark} legalName={brand.legalName} />

        <div className="zk-auth__panel">
          <div className="zk-auth__inner">
            {/* Where a product has real wordmark artwork it is used instead of
                type, because a wordmark is a drawing, not a font. */}
            <div className="zk-auth__lockup">
              <Image
                src={brand.mark}
                alt=""
                width={34}
                height={34}
                style={{ objectFit: 'contain', filter: invertMark ? 'invert(1)' : undefined }}
              />
              {brand.wordmarkLight ? (
                <Image
                  src={brand.wordmarkLight}
                  alt={manifest.name}
                  height={22}
                  style={{ objectFit: 'contain', width: 'auto' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#F8FAFC',
                  }}
                >
                  {manifest.name}
                </span>
              )}
            </div>

            {heading && <h1 className="zk-auth__heading">{heading}</h1>}
            {subtitle && <p className="zk-auth__sub">{subtitle}</p>}

            <div className="zk-auth__body">{children}</div>

            <div className="zk-auth__panelfoot">
              © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
