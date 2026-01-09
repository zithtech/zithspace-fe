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

"use client";

import { Button } from "antd";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF"; // Adjust path

interface Props {
  invoice: any;
  settings: any;
}

export default function InvoiceDownloadButton({ invoice, settings }: Props) {
  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} settings={settings} />}
      fileName={`invoice_${invoice.invoice_number || "001"}.pdf`}
      style={{ textDecoration: "none" }}
    >
      {({ blob, url, loading, error }: any) => {
        if (loading) return <Button loading>Generating PDF...</Button>;
        if (error) return <Button disabled>PDF Error</Button>;
        return (
          <Button type="primary" icon={null}>
            Download PDF
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
}
