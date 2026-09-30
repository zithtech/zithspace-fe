/**
 * Client-side export of the sprint report to PDF / DOCX.
 *
 * Both formats capture the *rendered* export layout (see SprintReportExport) so
 * the file looks exactly like the on-screen report. PDF uses html2pdf.js (already
 * a project dependency) directly. DOCX embeds the same rendered pages as images,
 * since a true Word reconstruction of the Tailwind + Recharts UI isn't faithful.
 *
 * html2pdf.js references `window`, so it is imported dynamically (client only).
 */
import { Document, ImageRun, Packer, PageOrientation, Paragraph } from "docx";
import { saveAs } from "file-saver";

// A4 portrait in mm and at 96dpi (px) — used to slice/scale page images.
const A4_MM = { w: 210, h: 297 };
const A4_PX = { w: 794, h: 1123 };

import { api } from "@/lib/axios";

function baseOptions(el: HTMLElement, filename: string) {
  const bg = getComputedStyle(el).backgroundColor || "#ffffff";
  return {
    margin: 0,
    filename,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: bg,
      logging: false,
      windowWidth: el.scrollWidth,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: {
      // ⚠️  Do NOT add 'legacy' here.
      // Legacy mode scans ahead for elements that would be cut at a page boundary
      // and injects large blank whitespace to push them down — creating full-page
      // blank gaps. CSS-only mode respects our explicit page-break-before:always
      // on continuation card breakers without adding phantom whitespace.
      mode: ['css'],
      avoid: ['.rpt-stat-card', '.rpt-tier-card', '.rpt-module-card', '.rpt-section-card'],
    },
  };
}


export async function downloadReportPdf(sprintIdOrEl: string | HTMLElement, elOrFilename: HTMLElement | string, filename?: string): Promise<void> {
  let sprintId: string | undefined;
  let el: HTMLElement;
  let fname: string;

  if (typeof sprintIdOrEl === 'string') {
    sprintId = sprintIdOrEl;
    el = elOrFilename as HTMLElement;
    fname = filename as string;
  } else {
    el = sprintIdOrEl;
    fname = elOrFilename as string;
  }

  if (sprintId) {
    // Extract the HTML payload
    const htmlPayload = el.outerHTML;

    // Send to backend Puppeteer service with a longer timeout
    const response = await api.post(
      `/api/sprint-report/${sprintId}/export-pdf`,
      { htmlPayload },
      { 
        responseType: "blob",
        timeout: 60000 // 60 seconds to allow for Puppeteer rendering
      }
    );

    // Ensure we have a Blob
    let blob = response.data;
    if (!(blob instanceof Blob)) {
      blob = new Blob([blob], { type: 'application/pdf' });
    }

    // Attempt saveAs
    try {
      saveAs(blob, fname);
    } catch (err) {
      console.error("file-saver failed, using fallback:", err);
      // Fallback to native anchor tag
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', fname);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  } else {
    // Fallback for non-sprint reports (html2pdf)
    const { clone, wrapper } = isolateClone(el);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await (html2pdf() as any).set(baseOptions(clone, fname)).from(clone).save();
    } finally {
      wrapper.remove();
    }
  }
}

// ── splitTablesForPages ─────────────────────────────────────────────────────
// html2pdf renders the page as one big canvas image then slices it into pages.
// CSS "display:table-header-group" has ZERO effect on canvas rendering.
//
// Strategy:
//  1. Detect which rows cross an A4 page boundary (≈ 1100 px).
//  2. Rebuild chunk[0] inside the original rpt-table-wrap in-place.
//  3. For chunk[1+]: create a brand-new <section> card (mirrors the parent
//     section visually) and insert it AFTER the parent section in the DOM.
//     This closes the original card cleanly, and opens a fresh card on the
//     new page — exactly like an invoice continuation page.
//  4. A zero-height page-break element placed just before each continuation
//     card forces the PDF renderer to start a fresh page — no blank gap,
//     because the continuation card is now a sibling of the parent section
//     (not nested inside it).
//
// A4 height at 96 dpi = 1123px.  We use 900px so each chunk's rows fit
// inside a continuation card that also has 76px of overhead (16px paddingTop
// + ~40px thead + 20px paddingBottom).  900 + 76 = 976px < 1123px — safe.
// At 1100 the card was 1176px > 1123px, causing the last rows to spill to
// the next page WITHOUT a header (the "no header on page N" bug).
const A4_PAGE_H = 900;

function splitTablesForPages(root: HTMLElement): void {
  const wrapperTop = root.getBoundingClientRect().top;

  // Snapshot the list BEFORE we start mutating (insertions would otherwise
  // cause the live NodeList to pick up new tables we create).
  const tableWraps = Array.from(
    root.querySelectorAll<HTMLElement>(".rpt-table-wrap")
  );

  for (const wrap of tableWraps) {
    const table = wrap.querySelector<HTMLTableElement>("table");
    const thead = table?.querySelector<HTMLElement>("thead");
    const tbody = table?.querySelector<HTMLElement>("tbody");
    if (!table || !thead || !tbody) continue;

    const rows = Array.from(
      tbody.querySelectorAll<HTMLTableRowElement>(":scope > tr")
    );
    if (rows.length === 0) continue;

    // ── 1. Detect page-break positions ──────────────────────────────────────
    const breakBeforeRow = new Set<number>();

    let currentPageTop =
      A4_PAGE_H *
      Math.floor(
        (rows[0].getBoundingClientRect().top - wrapperTop) / A4_PAGE_H
      );

    for (let i = 0; i < rows.length; i++) {
      const rowBottom = rows[i].getBoundingClientRect().bottom - wrapperTop;
      const nextPageEnd = currentPageTop + A4_PAGE_H;

      if (rowBottom > nextPageEnd) {
        breakBeforeRow.add(i);
        currentPageTop = nextPageEnd;
        while (rowBottom > currentPageTop + A4_PAGE_H) currentPageTop += A4_PAGE_H;
      }
    }

    if (breakBeforeRow.size === 0) continue;

    // ── 2. Build row chunks ──────────────────────────────────────────────────
    const chunks: HTMLTableRowElement[][] = [];
    let current: HTMLTableRowElement[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (breakBeforeRow.has(i) && current.length > 0) {
        chunks.push(current);
        current = [];
      }
      current.push(rows[i]);
    }
    if (current.length > 0) chunks.push(current);

    // ── 2b. Forward-merge tiny intermediate chunks ──────────────────────────
    //
    // A tiny intermediate chunk (1–2 rows) gets its own page-break-before:always
    // card.  When the NEXT card ALSO has page-break-before, page N shows just
    // those 1–2 rows at the top and a huge blank below it.
    //
    // Fix: forward-merge chunks with < MIN_ROWS rows into the NEXT chunk.
    // Those rows become the FIRST rows of the next card, so they appear at
    // the TOP of that card's page (with a header) instead of on a separate
    // near-empty page.
    //
    // We use a SMALL threshold (< 3 = only 1 or 2 rows) so we never add
    // more than ~140–180 px to the next chunk, keeping its card height safely
    // below the A4 limit even after the 76 px card overhead is included.
    const MIN_ROWS_FORWARD = 3;

    let mi = 1;
    while (mi < chunks.length - 1) {
      if (chunks[mi].length < MIN_ROWS_FORWARD) {
        // Prepend this chunk's rows to the NEXT chunk.
        chunks[mi + 1] = [...chunks[mi], ...chunks[mi + 1]];
        chunks.splice(mi, 1);
        // Recheck same index (now pointing at the next chunk)
      } else {
        mi++;
      }
    }

    if (chunks.length <= 1) continue;


    // ── 3. Rebuild chunk[0] inside the original wrap (in-place) ─────────────
    {
      const firstTbody = document.createElement("tbody");
      chunks[0].forEach((r) => firstTbody.appendChild(r.cloneNode(true)));
      const firstTable = table.cloneNode(false) as HTMLTableElement;
      firstTable.appendChild(thead.cloneNode(true));
      firstTable.appendChild(firstTbody);
      wrap.innerHTML = "";
      wrap.appendChild(firstTable);
    }

    // ── 4. Find where to insert continuation cards ───────────────────────────
    // Insert AFTER the nearest parent <section> (closes the original card).
    // Fall back to after the wrap itself if no section parent exists.
    const parentSection = wrap.closest<HTMLElement>("section");
    const anchor      = parentSection ?? wrap;
    const anchorParent = anchor.parentNode;
    if (!anchorParent) continue;
    const anchorNextSibling = anchor.nextSibling;

    // ── 5. Create one continuation card per remaining chunk ──────────────────
    // ⚠️  Do NOT add page-break-before:always here.
    // A forced break pushes the continuation to the top of the next page but
    // ALSO forces the remaining space on the current page to be blank.
    // When a chunk has only 1-2 rows (e.g. the last ticket), the forced break
    // produces a nearly-full blank page.  Instead, just flow continuation cards
    // sequentially — html2pdf's canvas slicer handles page boundaries, and the
    // cloned <thead> still appears at the top of each continuation card.
    const fragment = document.createDocumentFragment();

    for (let ci = 1; ci < chunks.length; ci++) {
      // ── Continuation card ────────────────────────────────────────────────
      // page-break-before:always goes on the CARD itself (not a separate
      // zero-height breaker), so:
      //  • html2pdf in css mode sees the break and slices the canvas here.
      //  • The card (with its cloned thead) starts at the very top of the
      //    next page — header never stuck at the bottom of the previous page.
      //  • margin-top:0 cancels the space-y-4 sibling gap so there's no
      //    extra whitespace pushed before the card on the new page.
      const card = document.createElement("section");
      if (parentSection) {
        card.className = parentSection.className;
      } else {
        card.style.cssText =
          "border:1px solid #e2e8f0;border-radius:12px;background:white;padding:20px;";
      }
      // Force a new page BEFORE this card, then give the header breathing room.
      card.style.pageBreakBefore = "always";
      (card.style as any).breakBefore = "page";
      card.style.marginTop = "0";          // cancel space-y-4
      card.style.paddingTop = "16px";      // breathing room above the header row

      const newWrap = document.createElement("div");
      newWrap.className = wrap.className;

      const newTable = table.cloneNode(false) as HTMLTableElement;
      const newThead = thead.cloneNode(true) as HTMLElement;
      const newTbody = document.createElement("tbody");
      chunks[ci].forEach((r) => newTbody.appendChild(r.cloneNode(true)));

      newTable.appendChild(newThead);
      newTable.appendChild(newTbody);
      newWrap.appendChild(newTable);
      card.appendChild(newWrap);

      fragment.appendChild(card);
    } // end for ci


    // Insert continuation cards after the original section (not inside it).
    if (anchorNextSibling) {
      anchorParent.insertBefore(fragment, anchorNextSibling);
    } else {
      anchorParent.appendChild(fragment);
    }
  } // end for wrap
}




function isolateClone(el: HTMLElement): { clone: HTMLElement; wrapper: HTMLElement } {
  const clone = el.cloneNode(true) as HTMLElement;
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.pointerEvents = "none";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Must be in DOM before splitting so getBoundingClientRect() returns real values.
  splitTablesForPages(clone);

  return { clone, wrapper };
}


export async function reportToPdfBlob(el: HTMLElement, filename: string): Promise<Blob> {
  const { clone, wrapper } = isolateClone(el);
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const worker = (html2pdf() as any).set(baseOptions(clone, filename)).from(clone);
    return await worker.outputPdf("blob");
  } finally {
    wrapper.remove();
  }
}

export async function downloadReportDocx(el: HTMLElement, filename: string): Promise<void> {
  const { clone, wrapper } = isolateClone(el);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    // Render once to a single tall canvas, then paginate it into A4-sized slices.
    const worker = (html2pdf() as any).set(baseOptions(clone, filename)).from(clone).toCanvas();
    const canvas: HTMLCanvasElement = await worker.get("canvas");

    const pages = sliceCanvasToPages(canvas);
    const children: Paragraph[] = pages.map(
      (p) =>
        new Paragraph({
          children: [
            new ImageRun({
              type: "jpg",
              data: p.bytes,
              transformation: { width: p.width, height: p.height },
            }),
          ],
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.PORTRAIT },
              margin: { top: 0, right: 0, bottom: 0, left: 0 },
            },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
  } finally {
    clone.remove();
  }
}



type PageImage = { bytes: Uint8Array; width: number; height: number };

/** Slice a full-height canvas into A4-proportioned page images. */
function sliceCanvasToPages(canvas: HTMLCanvasElement): PageImage[] {
  const pageW = canvas.width;
  const pageH = Math.floor(pageW * (A4_MM.h / A4_MM.w));
  const pages: PageImage[] = [];

  for (let y = 0; y < canvas.height; y += pageH) {
    const h = Math.min(pageH, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = pageW;
    slice.height = h;
    const ctx = slice.getContext("2d");
    if (!ctx) continue;
    ctx.drawImage(canvas, 0, y, pageW, h, 0, 0, pageW, h);
    const dataUrl = slice.toDataURL("image/jpeg", 0.95);
    pages.push({
      bytes: dataUrlToUint8(dataUrl),
      width: A4_PX.w,
      height: Math.round(A4_PX.w * (h / pageW)),
    });
  }

  return pages;
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
