"use client";

import { useEffect, useState } from "react";
import { Button } from "antd";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";

/* =========================================
   IMAGE CONVERTERS (REQUIRED FOR react-pdf)
========================================= */

// AVIF / JPG / PNG → PNG
const toPngBase64 = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 300;
      canvas.height = img.height || 300;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas error");

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject("Image load failed");
  });
};

// SVG → PNG (FOR QR CODE)
const svgToPngBase64 = (svgBase64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = svgBase64;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas error");

      ctx.drawImage(img, 0, 0, 300, 300);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject("SVG load failed");
  });
};

/* =========================================
   BULK / PROGRAMMATIC PDF DOWNLOAD
========================================= */

export const downloadInvoicePDF = async (
  invoice: any,
  settings: any,
  invoice_page_descriptions: any,
) => {
  if (!settings) return;

  const s = Array.isArray(settings) ? settings[0] : settings;
  if (!s?.general) return;

  let logo = s.general.company_logo;
  let qr = s.payments?.qr_code;

  // FIX LOGO (AVIF → PNG)
  if (logo?.startsWith("data:image/avif")) {
    logo = await toPngBase64(logo);
  }

  // FIX QR (SVG → PNG)
  if (qr?.startsWith("data:image/svg+xml")) {
    qr = await svgToPngBase64(qr);
  }

  const pdfSettings = {
    ...s,
    general: {
      ...s.general,
      company_logo: logo,
    },
    payments: {
      ...s.payments,
      qr_code: qr,
    },
  };

  // GENERATE PDF
  const blob = await pdf(
    <InvoicePDF
      invoice={invoice}
      settings={pdfSettings}
      invoice_page_descriptions={invoice_page_descriptions}
    />,
  ).toBlob();

  // FORCE DOWNLOAD
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `invoice_${invoice?.invoice_number || "001"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};

/* =========================================
   SINGLE DOWNLOAD BUTTON COMPONENT
========================================= */

interface Props {
  invoice: any;
  settings: any;
  invoice_page_descriptions: any;
}

export default function InvoiceDownloadButton({
  invoice,
  settings,
  invoice_page_descriptions,
}: Props) {
  const [pdfSettings, setPdfSettings] = useState<any>(null);
  const [preparing, setPreparing] = useState(true);

  useEffect(() => {
    const prepareSettings = async () => {
      if (!settings) return;

      const s = Array.isArray(settings) ? settings[0] : settings;
      if (!s?.general) return;

      let logo = s.general.company_logo;
      let qr = s.payments?.qr_code;

      if (logo?.startsWith("data:image/avif")) {
        logo = await toPngBase64(logo);
      }

      if (qr?.startsWith("data:image/svg+xml")) {
        qr = await svgToPngBase64(qr);
      }

      setPdfSettings({
        ...s,
        general: {
          ...s.general,
          company_logo: logo,
        },
        payments: {
          ...s.payments,
          qr_code: qr,
        },
      });

      setPreparing(false);
    };

    prepareSettings();
  }, [settings]);

  if (preparing || !pdfSettings) {
    return <Button loading>Preparing PDF…</Button>;
  }

  return (
    <PDFDownloadLink
      document={
        <InvoicePDF
          invoice={invoice}
          settings={pdfSettings}
          invoice_page_descriptions={invoice_page_descriptions}
        />
      }
      fileName={`invoice_${invoice?.invoice_number || "001"}.pdf`}
      style={{ textDecoration: "none" }}
    >
      {({ loading, error }) => {
        if (loading) return <Button loading>Generating PDF…</Button>;
        if (error) return <Button danger>PDF Error</Button>;

        return <Button type="primary">Download</Button>;
      }}
    </PDFDownloadLink>
  );
}
