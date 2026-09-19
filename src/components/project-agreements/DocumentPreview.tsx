'use client';

/**
 * The document preview pane — the right-hand half of every Project Agreements
 * screen (composer, letterhead, template builder, saved document).
 *
 * WHY THIS IS A COMPONENT AND NOT FOUR COPIES OF AN <iframe>:
 * it used to be exactly that, with the chrome styled in AgreementComposer's
 * styled-jsx block. styled-jsx `global` styles only exist while the component
 * that declares them is mounted, so the Letterhead page — which reused the
 * class names without mounting the composer — rendered with NO styles at all:
 * no grid, no pane, a 290px-wide iframe with one character per line. Owning the
 * markup here means a caller cannot pick up half a design by accident.
 *
 * FIDELITY IS THE POINT. The paper is rendered at true A4 width and then SCALED
 * to fit the pane, rather than letting the document reflow into whatever width
 * the pane happens to be. A preview that rewraps is a preview whose line breaks,
 * page breaks and widows are all different from the PDF it is previewing.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import { Download, ExternalLink, FileText, Maximize2, Minus, Plus } from 'lucide-react';
import ZukvoLoader from '@/components/common/ZukvoLoader';

/**
 * A4 (210mm ≈ 794px at 96dpi) plus the 16px the preview document sets as its
 * own body padding on each side. Rendering the iframe at exactly this width is
 * what stops `.pa-page`'s `max-width: 100%` from squeezing the sheet.
 */
const PAPER_W = 794 + 32;
/** A4 height (297mm ≈ 1123px at 96dpi), plus the same body padding. */
const PAPER_H = 1123 + 32;

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1, 1.25, 1.5];
const MIN_ZOOM = ZOOM_STEPS[0];
const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

interface Props {
  /** A complete HTML document. Empty string renders the empty state. */
  html: string;
  /**
   * An object URL for a rendered PDF. When present this WINS over `html`: the
   * pane shows real pages, each with its own header and footer, because the
   * printer produced them. `html` stays the fallback for surfaces that only
   * need one continuous sheet (the letterhead editor).
   */
  pdfUrl?: string | null;
  /** Pages in that PDF, shown in the toolbar. */
  pageCount?: number;
  /** Filename for the download, without the extension. */
  downloadName?: string;
  /** Label in the toolbar, e.g. "Live preview". */
  label: string;
  /** Accessible name for the frame — usually the document's own title. */
  title: string;
  /** Shows a spinner in the toolbar without tearing down the current page. */
  loading?: boolean;
  /** What to say when there is nothing to show yet. */
  emptyHint?: string;
  /** Extra toolbar controls, rendered before the zoom group. */
  actions?: React.ReactNode;
  /**
   * What "fit" means here.
   *
   * 'width' fills the pane with the sheet's width and lets the document scroll
   * inside it — right for a narrow authoring column beside a form.
   *
   * 'page' fits a WHOLE A4 page, both dimensions, so you see the sheet as a
   * sheet: margins, how full it is, where the letterhead sits. Right for a
   * reading surface with room to spare, which is what a drawer is.
   */
  fit?: 'width' | 'page';
}

export default function DocumentPreview({
  html,
  pdfUrl = null,
  pageCount = 0,
  downloadName,
  label,
  title,
  loading = false,
  emptyHint = 'Nothing to preview yet.',
  actions,
  fit = 'width',
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useStageSize(stageRef);

  // `null` means "fit" — recomputed as the pane resizes. A number is a zoom the
  // person chose, and is left alone until they press Fit again.
  const [zoom, setZoom] = useState<number | null>(null);

  const fitZoom = useMemo(() => {
    if (!stage.width) return 1;
    // 24px of breathing room so the sheet never touches the pane edge.
    const byWidth = (stage.width - 24) / PAPER_W;
    if (fit === 'width' || !stage.height) return clamp(byWidth, 0.25, 1);
    // Whichever dimension runs out first decides — that is what makes the
    // whole page visible rather than most of it.
    const byHeight = (stage.height - 24) / PAPER_H;
    return clamp(Math.min(byWidth, byHeight), 0.25, 1);
  }, [stage.width, stage.height, fit]);

  const scale = zoom ?? fitZoom;
  const stageH = Math.max(stage.height, 320);
  const scaledW = PAPER_W * scale;
  /**
   * How tall the paper is drawn.
   *
   * In page mode it is one A4 sheet, so the frame has real proportions and the
   * document scrolls inside it. In width mode the paper fills the pane's
   * height, which is the behaviour the composer's narrow column wants.
   */
  const paperH = fit === 'page' ? PAPER_H * scale : stageH;
  const frameH = fit === 'page' ? PAPER_H : stageH / scale;

  /* ── Open in a new tab ─────────────────────────────────────────────────
   * The frame is `sandbox=""` with a srcDoc, so there is no URL to hand to
   * window.open. A blob URL is the way, and it must be revoked or every
   * keystroke in the composer leaks a document. */
  const blobUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    },
    []
  );

  const isPdf = Boolean(pdfUrl);

  /**
   * Save the rendered PDF.
   *
   * The bytes are already here — the pane is showing them — so this costs
   * nothing and needs no round trip. An <a download> on the same blob URL the
   * viewer is using is the whole mechanism; the anchor is created, clicked and
   * dropped rather than kept in the DOM.
   */
  const download = () => {
    if (!pdfUrl) return;
    const name = (downloadName || title || 'agreement')
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${name || 'agreement'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const openInTab = () => {
    if (isPdf) {
      window.open(pdfUrl!, '_blank', 'noopener');
      return;
    }
    if (!html) return;
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(blobUrl.current, '_blank', 'noopener');
  };

  const step = (direction: 1 | -1) => {
    const current = scale;
    const next =
      direction === 1
        ? ZOOM_STEPS.find((z) => z > current + 0.001) ?? MAX_ZOOM
        : [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001) ?? MIN_ZOOM;
    setZoom(next);
  };

  const isFit = zoom === null;

  return (
    <div className="pa-preview">
      <div className="pa-preview-bar">
        <FileText size={13} />
        <span className="pa-preview-label">{label}</span>
        {loading && (
          <span className="pa-preview-spinner">
            <ZukvoLoader size="sm" />
          </span>
        )}

        <div className="pa-preview-tools">
          {actions}
          {isPdf ? (
            <span className="pa-pagecount">
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
          ) : (
          <div className="pa-zoom">
            <Tooltip title="Zoom out">
              <button
                type="button"
                className="pa-zoom-btn"
                onClick={() => step(-1)}
                disabled={!html || scale <= MIN_ZOOM + 0.001}
                aria-label="Zoom out"
              >
                <Minus size={13} />
              </button>
            </Tooltip>
            <span className="pa-zoom-value">{Math.round(scale * 100)}%</span>
            <Tooltip title="Zoom in">
              <button
                type="button"
                className="pa-zoom-btn"
                onClick={() => step(1)}
                disabled={!html || scale >= MAX_ZOOM - 0.001}
                aria-label="Zoom in"
              >
                <Plus size={13} />
              </button>
            </Tooltip>
            <Tooltip title="Fit to width">
              <button
                type="button"
                className={`pa-zoom-btn ${isFit ? 'is-on' : ''}`}
                onClick={() => setZoom(null)}
                disabled={!html}
                aria-label="Fit to width"
                aria-pressed={isFit}
              >
                <Maximize2 size={12} />
              </button>
            </Tooltip>
          </div>
          )}
          {isPdf && (
            <Tooltip title="Download as PDF">
              <button
                type="button"
                className="pa-zoom-btn"
                onClick={download}
                aria-label="Download as PDF"
              >
                <Download size={13} />
              </button>
            </Tooltip>
          )}
          <Tooltip title="Open in a new tab">
            <button
              type="button"
              className="pa-zoom-btn"
              onClick={openInTab}
              disabled={!isPdf && !html}
              aria-label="Open in a new tab"
            >
              <ExternalLink size={13} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div
        className={`pa-preview-stage ${isPdf ? 'is-pdf' : ''} ${fit === 'page' ? 'is-page' : ''}`}
        ref={stageRef}
      >
        {isPdf ? (
          /* The browser's own PDF viewer. It already paginates, scrolls and
             zooms, so the scaling maths below stays out of its way; #toolbar=0
             hides its chrome so the pane keeps one toolbar rather than two. */
          <iframe
            className="pa-preview-pdf"
            // view=Fit shows a whole page; FitH fills the width and crops the
            // bottom. The drawer reads documents, so it asks for the page.
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=${fit === 'page' ? 'Fit' : 'FitH'}`}
            title={title}
          />
        ) : html ? (
          <div
            className="pa-preview-scaler"
            style={{ width: scaledW, height: paperH }}
          >
            <iframe
              className="pa-preview-frame"
              srcDoc={html}
              title={title}
              // Our own server's HTML, but it carries whatever a template author
              // wrote. No allow-scripts means nothing in it can run.
              sandbox=""
              style={{
                width: PAPER_W,
                // The document scrolls inside the paper, not around it.
                height: frameH,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        ) : (
          <div className="pa-preview-empty">
            <div className="pa-preview-empty-icon">
              <FileText size={22} strokeWidth={1.5} />
            </div>
            <p>{emptyHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The pane's size, and nothing else.
 *
 * Deliberately NOT the shared useElementRect: that one also listens to
 * capture-phase scroll and stores x/y, so every scroll of the form rail beside
 * this pane would push new state and re-render a frame whose size had not
 * changed. Width and height are the only things the zoom maths reads.
 */
function useStageSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize((prev) =>
        // Sub-pixel jitter must not re-render: the frame is repainted whenever
        // this state changes.
        Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : { width, height }
      );
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
