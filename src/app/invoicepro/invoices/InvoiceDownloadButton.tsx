// "use client";

// import { useMemo } from "react";
// import { Button } from "antd";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import InvoicePDF from "./InvoicePDF";

// export default function InvoiceDownloadButton({ invoice, settings }: any) {
//   const document = useMemo(
//     () => <InvoicePDF invoice={invoice} settings={settings} />,
//     [invoice, settings]
//   );

//   return (
//     <PDFDownloadLink
//       document={document}
//       fileName={`invoice_${invoice.invoice_number}.pdf`}
//     >
//       {({ loading, error }) => {
//         if (error) {
//           console.error(error);
//           return <Button danger>PDF Error</Button>;
//         }

//         return (
//           <Button type="primary" disabled={loading}>
//             {loading ? "Preparing PDF…" : "Download PDF"}
//           </Button>
//         );
//       }}
//     </PDFDownloadLink>
//   );
// }

// "use client";

// import { useMemo } from "react";
// import { Button } from "antd";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import InvoicePDF from "./InvoicePDF";

// export default function InvoiceDownloadButton({ invoice, settings }: any) {
//   const document = useMemo(() => {
//     if (!invoice || !invoice.invoice_number) {
//       console.warn("Missing invoice data");
//       return null;
//     }
//     return <InvoicePDF invoice={invoice} settings={settings || {}} />;
//   }, [invoice, settings]);

//   if (!document) {
//     return <Button disabled>Invalid Invoice Data</Button>;
//   }

//   return (
//     <PDFDownloadLink
//       document={document}
//       fileName={`invoice_${invoice.invoice_number}.pdf`}
//     >
//       {({ loading }) => (
//         <Button type="primary" disabled={loading} style={{ minWidth: 140 }}>
//           {loading ? "Generating PDF..." : "Download PDF"}
//         </Button>
//       )}
//     </PDFDownloadLink>
//   );
// }

// "use client";

// import { Button } from "antd";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { useState } from "react";
// import InvoicePDF from "./InvoicePDF"; // Adjust path as needed

// interface InvoiceDownloadButtonProps {
//   invoice: any;
//   settings: any;
// }

// export default function InvoiceDownloadButton({
//   invoice,
//   settings,
// }: InvoiceDownloadButtonProps) {
//   const [isLoading, setIsLoading] = useState(false);

//   return (
//     <PDFDownloadLink
//       document={<InvoicePDF invoice={invoice} settings={settings} />}
//       fileName={`invoice_${invoice.invoice_number}.pdf`}
//       style={{ textDecoration: "none" }}
//     >
//       {({ loading }) => (
//         <Button
//           type="primary"
//           loading={loading}
//           icon={loading ? undefined : undefined}
//         >
//           {loading ? "Generating PDF..." : "Download PDF"}
//         </Button>
//       )}
//     </PDFDownloadLink>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "antd";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import InvoicePDF from "./InvoicePDF";
// import { imageToBase64 } from "@/utils/imageToBase64";

// interface Props {
//   invoice: any;
//   settings: any;
// }

// export default function InvoiceDownloadButton({ invoice, settings }: Props) {
//   const [pdfSettings, setPdfSettings] = useState<any>(null);
//   const [preparing, setPreparing] = useState(true);

//   useEffect(() => {
//     const prepareImages = async () => {
//       try {
//         const logoBase64 = settings?.general?.company_logo
//           ? await imageToBase64(settings.general.company_logo)
//           : null;

//         const qrBase64 = settings?.payments?.qr_code
//           ? await imageToBase64(settings.payments.qr_code)
//           : null;

//         setPdfSettings({
//           ...settings,
//           general: { ...settings.general, company_logo: logoBase64 },
//           payments: { ...settings.payments, qr_code: qrBase64 },
//         });
//       } catch (err) {
//         console.error("Failed to convert images", err);
//         setPdfSettings(settings);
//       } finally {
//         setPreparing(false);
//       }
//     };

//     prepareImages();
//   }, [settings]);

//   if (preparing) return <Button loading>Preparing PDF…</Button>;

//   return (
//     <PDFDownloadLink
//       document={<InvoicePDF invoice={invoice} settings={pdfSettings} />}
//       fileName={`invoice_${invoice?.invoice_number || "001"}.pdf`}
//     >
//       {({ loading, error }) => {
//         if (loading) return <Button loading>Generating PDF…</Button>;
//         if (error) return <Button danger>PDF Error</Button>;
//         return <Button type="primary">Download PDF</Button>;
//       }}
//     </PDFDownloadLink>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "antd";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import InvoicePDF from "./InvoicePDF";

// /* =========================================
//    IMAGE CONVERTERS (REQUIRED FOR react-pdf)
// ========================================= */

// // AVIF / JPG / PNG → PNG
// const toPngBase64 = (base64: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.src = base64;

//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width || 300;
//       canvas.height = img.height || 300;

//       const ctx = canvas.getContext("2d");
//       if (!ctx) return reject("Canvas error");

//       ctx.drawImage(img, 0, 0);
//       resolve(canvas.toDataURL("image/png"));
//     };

//     img.onerror = () => reject("Image load failed");
//   });
// };

// // SVG → PNG (FOR QR CODE)
// const svgToPngBase64 = (svgBase64: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.src = svgBase64;

//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       canvas.width = 300;
//       canvas.height = 300;

//       const ctx = canvas.getContext("2d");
//       if (!ctx) return reject("Canvas error");

//       ctx.drawImage(img, 0, 0, 300, 300);
//       resolve(canvas.toDataURL("image/png"));
//     };

//     img.onerror = () => reject("SVG load failed");
//   });
// };

// /* =========================================
//    COMPONENT
// ========================================= */

// interface Props {
//   invoice: any;
//   settings: any; // can be object OR array
// }

// export default function InvoiceDownloadButton({ invoice, settings }: Props) {
//   const [pdfSettings, setPdfSettings] = useState<any>(null);
//   const [preparing, setPreparing] = useState(true);

//   useEffect(() => {
//     const prepareSettings = async () => {
//       if (!settings) return;

//       // Settings may be array or object
//       const s = Array.isArray(settings) ? settings[0] : settings;
//       if (!s?.general) return;

//       let logo = s.general.company_logo;
//       let qr = s.payments?.qr_code;

//       // 🔥 LOGO FIX: AVIF → PNG
//       if (logo?.startsWith("data:image/avif")) {
//         logo = await toPngBase64(logo);
//       }

//       // 🔥 QR FIX: SVG → PNG
//       if (qr?.startsWith("data:image/svg+xml")) {
//         qr = await svgToPngBase64(qr);
//       }

//       // 🔍 DEBUG (MUST SEE PNG)
//       console.log("FINAL LOGO:", logo);
//       console.log("FINAL QR:", qr);

//       setPdfSettings({
//         ...s,
//         general: {
//           ...s.general,
//           company_logo: logo,
//         },
//         payments: {
//           ...s.payments,
//           qr_code: qr,
//         },
//       });

//       setPreparing(false);
//     };

//     prepareSettings();
//   }, [settings]);

//   if (preparing || !pdfSettings) {
//     return <Button loading>Preparing PDF…</Button>;
//   }

//   return (
//     <PDFDownloadLink
//       document={<InvoicePDF invoice={invoice} settings={pdfSettings} />}
//       fileName={`invoice_${invoice?.invoice_number || "001"}.pdf`}
//       style={{ textDecoration: "none" }}
//     >
//       {({ loading, error }) => {
//         if (loading) return <Button loading>Generating PDF…</Button>;
//         if (error) return <Button danger>PDF Error</Button>;

//         return <Button type="primary">Download</Button>;
//       }}
//     </PDFDownloadLink>
//   );
// }

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
  invoice_page_descriptions: any
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
    />
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
