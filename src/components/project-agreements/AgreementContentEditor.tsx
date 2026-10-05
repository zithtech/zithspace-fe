'use client';

/**
 * The agreement's wording, edited on an A4 sheet.
 *
 * BlockNote, the same engine Document Hub uses, so the authoring feel — slash
 * menu, drag handles, block selection — is the one people already know.
 *
 * WHAT THE PAGE CHROME IS, AND WHAT IT IS NOT:
 *   The letterhead at the top and the dashed rules further down are DECORATION.
 *   They live in a layer behind the editor and are `pointer-events: none`, so
 *   they can never be selected, deleted, or serialised into the document. The
 *   editor's content is only ever the body.
 *
 *   The rules mark where each A4 page will actually break, measured from the
 *   real content height. They are a guide, not a guarantee: the PDF is
 *   paginated by Chrome, which will also avoid splitting a heading from its
 *   paragraph or a table row down the middle. The preview pane beside this
 *   editor is the faithful view; this one is for writing in.
 *
 * HTML IS THE INTERCHANGE FORMAT, because that is what the template body, the
 * stored snapshot and the PDF renderer all speak. BlockNote parses HTML
 * lossily, so the conversion runs ONCE on load and once per external reseed —
 * never on a keystroke, which would rewrite the document under the cursor.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { Branding, SUMMARY_PAIRS } from '@/services/projectAgreementsService';

/** A4 at 96dpi, and the letterhead bands the renderer reserves (see render.service.ts). */
const PAGE_H = 1123;   // 297mm
const HEADER_H = 91;   // 24mm band
const FOOTER_H = 61;   // 16mm band
const PAGE_MARGIN = 45; // 12mm
/** Body height available on one printed page. */
const CONTENT_H = PAGE_H - PAGE_MARGIN * 2 - HEADER_H - FOOTER_H;

interface Props {
  /** The document body as HTML. Only read on mount and when `seedKey` changes. */
  value: string;
  onChange: (html: string) => void;
  /** Bump to force a reload of `value` — e.g. a template was applied. */
  seedKey?: number;
  branding: Branding | null;
  /** Printed top-left of every page. */
  documentTitle: string;
  /**
   * The label/value rows printed under the letterhead, already formatted.
   *
   * Formatted by the CALLER rather than here: the composer holds the raw
   * values, and passing rendered rows keeps this component a view. Decoration,
   * like the letterhead around it — the server still renders the real block.
   */
  summaryRows?: Array<{ key: string; label: string; value: string }>;
  /**
   * The sign-off columns as they will print. Null hides the block, matching
   * showSignatures on the document.
   */
  signoff?: {
    ours: { heading: string; who: string };
    theirs: { heading: string; who: string };
  } | null;
  editable?: boolean;
  /** Fires the first time the person edits, so the host can detach the template. */
  onDirty?: () => void;
}

/**
 * What a host can ask the sheet to do.
 *
 * Only insertion, and only at the cursor: the template builder drops
 * {{tokens}} into the wording from a panel beside it, and a token appended to
 * the end of the document is not where anybody meant to put it.
 */
export interface AgreementContentEditorRef {
  insertTextAtCursor: (text: string) => void;
  focus: () => void;
}

function AgreementContentEditor(
  {
    value,
    onChange,
    seedKey = 0,
    branding,
    documentTitle,
    summaryRows = [],
    signoff = null,
    editable = true,
    onDirty,
  }: Props,
  ref: React.Ref<AgreementContentEditorRef>
) {
  const editor = useCreateBlockNote();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  /**
   * Suppress the onChange that BlockNote fires synchronously from inside
   * replaceBlocks. Without it, loading a template would immediately report the
   * document as user-edited and detach it.
   */
  const loading = useRef(false);
  const dirtyReported = useRef(false);

  /* ── HTML in ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      loading.current = true;
      try {
        const blocks = value.trim()
          ? await editor.tryParseHTMLToBlocks(value)
          : [{ type: 'paragraph' as const, content: [] as any }];
        if (cancelled) return;
        editor.replaceBlocks(editor.document, blocks as any);
      } catch (err) {
        console.error('[project-agreements] could not load the body into the editor:', err);
      } finally {
        // Release on the next tick: replaceBlocks' onChange lands synchronously,
        // but BlockNote also settles selection a frame later.
        requestAnimationFrame(() => {
          loading.current = false;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // `value` is deliberately absent: this is a SEED, not a controlled input.
    // Re-running it on every keystroke would replace the document under the
    // cursor. The host bumps seedKey when it genuinely wants a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, seedKey]);

  /* ── HTML out ────────────────────────────────────────────────────────── */
  const handleChange = useCallback(async () => {
    if (loading.current) return;
    if (!dirtyReported.current) {
      dirtyReported.current = true;
      onDirty?.();
    }
    try {
      onChange(await editor.blocksToHTMLLossy(editor.document));
    } catch (err) {
      console.error('[project-agreements] could not serialise the body:', err);
    }
  }, [editor, onChange, onDirty]);

  /* ── Where the pages break ───────────────────────────────────────────── */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const measure = () => {
      const pages = Math.max(1, Math.ceil(el.scrollHeight / CONTENT_H));
      setPageCount((prev) => (prev === pages ? prev : pages));
    };
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      insertTextAtCursor: (text: string) => {
        editor.focus();
        // insertInlineContent lands at the selection, which is what "at the
        // cursor" has to mean; appending to the document would not be.
        editor.insertInlineContent([text]);
        // The insert is a real edit, so report it like one — otherwise the
        // host never learns the body changed.
        void handleChange();
      },
      focus: () => editor.focus(),
    }),
    [editor, handleChange]
  );

  const guides = useMemo(
    () =>
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
        page: i + 2,
        top: CONTENT_H * (i + 1),
      })),
    [pageCount]
  );

  return (
    <div className="pa-sheet-scroll">
      <div className="pa-sheet-paper">
        {/* Letterhead — decoration, never content. */}
        <div className="pa-sheet-head" aria-hidden="true">
          <div className="pa-sheet-doc">{documentTitle || 'Untitled Agreement'}</div>
          <div className="pa-sheet-brand">
            <div className="pa-sheet-lockup">
              {branding?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt="" />
              )}
              {branding?.companyName && <span>{branding.companyName}</span>}
            </div>
            {branding?.tagline && <div className="pa-sheet-tag">{branding.tagline}</div>}
          </div>
        </div>

        {summaryRows.length > 0 && (
          <div className="pa-sheet-summary-box" aria-hidden="true">
            <table className="pa-sheet-summary">
              <tbody>
                {pairRows(summaryRows).map((row) =>
                  row.length === 2 ? (
                    <tr key={row[0].key}>
                      <th scope="row">{row[0].label}</th>
                      <td>{row[0].value}</td>
                      <th scope="row" className="pa-sheet-summary-split">
                        {row[1].label}
                      </th>
                      <td>{row[1].value}</td>
                    </tr>
                  ) : (
                    <tr key={row[0].key}>
                      <th scope="row">{row[0].label}</th>
                      <td colSpan={3}>{row[0].value}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="pa-sheet-body" ref={bodyRef}>
          {/* The break markers sit behind the text and cannot be clicked. */}
          <div className="pa-sheet-guides" aria-hidden="true">
            {guides.map((g) => (
              <div key={g.page} className="pa-sheet-guide" style={{ top: g.top }}>
                <span>Page {g.page}</span>
              </div>
            ))}
          </div>

          <BlockNoteView
            editor={editor}
            editable={editable}
            onChange={handleChange}
            theme="light"
            className="pa-bn"
          />
        </div>

        {signoff && (
          <table className="pa-sheet-signoff" aria-hidden="true">
            <tbody>
              <tr>
                <td>
                  <div className="pa-sheet-sign-head">{signoff.ours.heading}</div>
                  <div className="pa-sheet-sign-slot">
                    {branding?.signatureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="pa-sheet-sign-mark" src={branding.signatureUrl} alt="" />
                    )}
                  </div>
                  <SignWho value={signoff.ours.who} />
                </td>
                <td className="pa-sheet-signoff-split">
                  <div className="pa-sheet-sign-head">{signoff.theirs.heading}</div>
                  <div className="pa-sheet-sign-slot" />
                  <SignWho value={signoff.theirs.who} />
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="pa-sheet-foot" aria-hidden="true">
          <div className="pa-sheet-foot-row">
            {branding?.phone && <span>{branding.phone}</span>}
            {branding?.email && <span>{branding.email}</span>}
            {branding?.website && <span>{stripScheme(branding.website)}</span>}
            {branding?.location && <span>{branding.location}</span>}
          </div>
          <div className="pa-sheet-foot-note">
            Page 1 of {pageCount} · header and footer repeat on every page
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pa-sheet-scroll {
          flex: 1; min-height: 0;
          overflow-y: auto; overflow-x: auto;
          padding: 20px 16px 40px;
          background: var(--bg-slate-100, #f1f5f9);
          text-align: center;
        }
        /* A true 210mm sheet — the width the PDF actually uses, so a line that
           fits here fits there. */
        .pa-sheet-paper {
          display: inline-block;
          vertical-align: top;
          text-align: left;
          width: 210mm;
          min-height: 297mm;
          padding: 12mm 18mm;
          background: #ffffff;
          border: 1px solid var(--border-slate-200);
          border-radius: 3px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          color: #0f172a;
        }

        /* ── Letterhead decoration ───────────────────────────────────── */
        .pa-sheet-head, .pa-sheet-foot { pointer-events: none; user-select: none; }
        .pa-sheet-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12mm;
          min-height: 24mm;
          padding-bottom: 3mm;
          /* Matches --pa-rule in render.service.ts: the letterhead rules are
             page furniture, heavier than any hairline inside the content. */
          border-bottom: 1.5px solid #475569;
        }
        .pa-sheet-doc {
          font-size: 15pt; font-weight: 700; letter-spacing: -0.01em;
          line-height: 1.2; color: #0f172a; min-width: 0; word-break: break-word;
        }
        .pa-sheet-brand {
          display: flex; flex-direction: column; align-items: flex-end;
          flex-shrink: 0; text-align: right;
        }
        .pa-sheet-lockup { display: flex; align-items: center; gap: 1.2mm; }
        .pa-sheet-lockup img { height: 10mm; max-width: 34mm; object-fit: contain; display: block; }
        .pa-sheet-lockup span { font-size: 12pt; font-weight: 700; line-height: 1.15; white-space: nowrap; }
        .pa-sheet-tag { margin-top: 1mm; font-size: 8pt; line-height: 1.3; color: #64748b; max-width: 64mm; }

        .pa-sheet-foot {
          min-height: 16mm; padding-top: 3.5mm; padding-bottom: 2mm;
          border-top: 1.5px solid #475569; text-align: center;
        }
        .pa-sheet-foot-row {
          display: flex; align-items: center; justify-content: center;
          flex-wrap: wrap; gap: 0 4mm; font-size: 8.5pt; color: #64748b;
        }
        .pa-sheet-foot-note {
          margin-top: 1.5mm; font-size: 7.5pt; color: #94a3b8;
        }

        /* The summary block — the same boxed panel the renderer prints. */
        .pa-sheet-summary-box {
          margin: 7mm 0 0;
          border: 1px solid #e2e8f0; border-radius: 2.5mm;
          overflow: hidden; background: #ffffff;
          pointer-events: none; user-select: none;
        }
        .pa-sheet-summary {
          width: 100%; margin: 0; border-collapse: collapse; font-size: 10pt;
        }
        .pa-sheet-summary th, .pa-sheet-summary td {
          padding: 2.2mm 4mm; text-align: left; vertical-align: top;
          border: none; border-bottom: 1px solid #e2e8f0;
        }
        .pa-sheet-summary tr:last-child th,
        .pa-sheet-summary tr:last-child td { border-bottom: none; }
        .pa-sheet-summary th {
          width: 46mm; font-weight: 600; color: #64748b; white-space: nowrap;
          background: #f8fafc; border-right: 1px solid #e2e8f0;
        }
        .pa-sheet-summary td { color: #0f172a; font-weight: 500; }
        .pa-sheet-summary th.pa-sheet-summary-split { border-left: 1px solid #e2e8f0; }

        /* The sign-off, matching the renderer's two columns. */
        .pa-sheet-signoff {
          width: 100%; margin: 12mm 0 8mm; border-collapse: collapse;
          pointer-events: none; user-select: none;
        }
        .pa-sheet-signoff td {
          width: 50%; padding: 0 8mm 0 0; border: none; vertical-align: top;
        }
        .pa-sheet-signoff td.pa-sheet-signoff-split { padding: 0 0 0 8mm; }
        .pa-sheet-sign-head {
          font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 2mm;
        }
        .pa-sheet-sign-slot {
          height: 20mm; border-bottom: 1px solid #0f172a;
          display: flex; align-items: flex-end; overflow: hidden;
        }
        .pa-sheet-sign-mark {
          max-height: 18mm; max-width: 55mm; object-fit: contain;
          object-position: left bottom; display: block; margin-bottom: 1mm;
        }
        .pa-sheet-sign-who {
          margin-top: 2.5mm; font-size: 10pt; font-weight: 600; color: #0f172a;
        }
        .pa-sheet-sign-rule { display: block; height: 3.6mm; border-bottom: 1px solid #64748b; }

        /* ── Body + page-break guides ────────────────────────────────── */
        .pa-sheet-body { position: relative; padding: 9mm 0 8mm; min-height: 40mm; }
        .pa-sheet-guides { position: absolute; inset: 0; pointer-events: none; }
        .pa-sheet-guide {
          position: absolute; left: -6mm; right: -6mm;
          border-top: 1px dashed #cbd5e1;
        }
        .pa-sheet-guide span {
          position: absolute; right: 0; top: -9px;
          padding: 1px 6px; border-radius: 999px;
          background: var(--bg-slate-100, #f1f5f9);
          border: 1px solid #e2e8f0;
          font-size: 9px; font-weight: 700; letter-spacing: 0.04em;
          text-transform: uppercase; color: #94a3b8;
        }

        /* ── BlockNote, sized to print type rather than UI type ──────── */
        .pa-bn .bn-editor {
          padding: 0 !important;
          background: transparent !important;
          font-size: 11pt;
          line-height: 1.6;
          color: #0f172a;
        }
        .pa-bn .bn-container { background: transparent !important; }
        /* The sheet already carries the page margin; BlockNote's own gutter
           would indent the text a second time. */
        .pa-bn .bn-block-outer { max-width: 100%; }
      `}</style>
    </div>
  );
}

export default forwardRef(AgreementContentEditor);

const stripScheme = (url: string) => url.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');

/** The signatory line under the rule — "Ithyaz - CEO", or a rule to complete
 *  by hand. The same choice signoffHtml() makes on the server. */
function SignWho({ value }: { value: string }) {
  return (
    <div className="pa-sheet-sign-who">
      {value.trim() ? value : <span className="pa-sheet-sign-rule" />}
    </div>
  );
}

/**
 * Group the rows that SUMMARY_PAIRS says share a line. Mirrors summaryHtml()
 * on the server: a partner is found ANYWHERE in the list, not just in the next
 * slot — 'kickoff' and 'date' are third and sixth in the field order. The pair
 * renders at the first member's position.
 */
type Row = { key: string; label: string; value: string };
function pairRows(rows: Row[]): Row[][] {
  const consumed = new Set<string>();
  const out: Row[][] = [];

  for (const row of rows) {
    if (consumed.has(row.key)) continue;
    const pair = SUMMARY_PAIRS.find(([a]) => a === row.key);
    const partner = pair && rows.find((r) => r.key === pair[1] && !consumed.has(r.key));
    if (partner) {
      consumed.add(partner.key);
      out.push([row, partner]);
    } else {
      out.push([row]);
    }
  }
  return out;
}
