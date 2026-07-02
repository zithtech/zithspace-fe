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
    pagebreak: { mode: ["css"], avoid: ['tr', '.break-inside-avoid', 'section', 'li'] },
  };
}

export async function downloadReportPdf(sprintId: string, el: HTMLElement, filename: string): Promise<void> {
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
    saveAs(blob, filename);
  } catch (err) {
    console.error("file-saver failed, using fallback:", err);
    // Fallback to native anchor tag
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export async function downloadReportDocx(el: HTMLElement, filename: string): Promise<void> {
  const clone = el.cloneNode(true) as HTMLElement;
  el.parentNode?.appendChild(clone);

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
