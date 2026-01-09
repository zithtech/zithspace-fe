// import {
//   Document,
//   Page,
//   View,
//   Text,
//   Image,
//   StyleSheet,
// } from "@react-pdf/renderer";

// /**
//  * IMPORTANT RULES (react-pdf)
//  * - No gap
//  * - No boxShadow
//  * - No objectFit
//  * - Images must be base64 or absolute URL
//  */

// const styles = StyleSheet.create({
//   page: {
//     padding: 32,
//     fontSize: 10,
//     fontFamily: "Helvetica",
//     lineHeight: 1.4,
//   },

//   /* ---------- HEADER ---------- */

//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 24,
//   },

//   companyRow: {
//     flexDirection: "row",
//   },

//   logo: {
//     width: 48,
//     height: 48,
//     marginRight: 12,
//   },

//   companyName: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },

//   invoiceTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },

//   rightAlign: {
//     textAlign: "right",
//   },

//   muted: {
//     color: "#666",
//   },

//   /* ---------- INFO CARDS ---------- */

//   grid: {
//     flexDirection: "row",
//     marginBottom: 24,
//   },

//   col: {
//     flex: 1,
//   },

//   card: {
//     backgroundColor: "#f9f9f9",
//     padding: 10,
//     borderRadius: 4,
//     marginTop: 6,
//   },

//   sectionTitle: {
//     fontSize: 10,
//     fontWeight: "bold",
//     color: "#555",
//   },

//   /* ---------- TABLE ---------- */

//   tableHeader: {
//     flexDirection: "row",
//     backgroundColor: "#f0f0f0",
//     borderTopWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: "#ddd",
//   },

//   tableRow: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderColor: "#eee",
//   },

//   cellItem: {
//     flex: 3,
//     padding: 6,
//   },

//   cellQty: {
//     flex: 1,
//     padding: 6,
//     textAlign: "center",
//   },

//   cellPrice: {
//     flex: 2,
//     padding: 6,
//     textAlign: "right",
//   },

//   cellTotal: {
//     flex: 2,
//     padding: 6,
//     textAlign: "right",
//   },

//   /* ---------- FOOTER SECTION ---------- */

//   footerRow: {
//     flexDirection: "row",
//     marginTop: 20,
//   },

//   bankBox: {
//     flex: 2,
//     backgroundColor: "#fafafa",
//     padding: 10,
//     borderRadius: 4,
//   },

//   qrBox: {
//     width: 110,
//     alignItems: "center",
//     marginLeft: 12,
//   },

//   qrImage: {
//     width: 80,
//     height: 80,
//     marginTop: 6,
//   },

//   totalsBox: {
//     flex: 1,
//     marginLeft: "auto",
//     backgroundColor: "#fafafa",
//     padding: 10,
//     borderRadius: 4,
//   },

//   totalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 4,
//   },

//   grandTotal: {
//     fontSize: 14,
//     fontWeight: "bold",
//   },

//   notes: {
//     marginTop: 24,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderColor: "#eee",
//   },
// });

// export default function InvoicePDF({ invoice, settings }: any) {
//   const subtotal = invoice.items.reduce(
//     (sum: number, i: any) => sum + i.qty * i.price,
//     0
//   );

//   const tax = invoice.items.reduce((sum: number, i: any) => {
//     const rate = parseFloat(String(i.tax || 0)) / 100;
//     return sum + i.qty * i.price * rate;
//   }, 0);

//   const discount = invoice.discount || 0;
//   const total = subtotal + tax - discount;

//   return (
//     <Document>
//       <Page size="A4" style={styles.page} wrap>
//         {/* ---------- HEADER ---------- */}
//         <View style={styles.header}>
//           <View style={styles.companyRow}>
//             {settings?.general?.company_logo && (
//               <Image
//                 src={{ uri: settings.general.company_logo }}
//                 style={styles.logo}
//               />
//             )}
//             <View>
//               <Text style={styles.companyName}>
//                 {settings.general.company_name}
//               </Text>
//               <Text style={styles.muted}>
//                 {settings.general.company_address}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.rightAlign}>
//             <Text style={styles.invoiceTitle}>INVOICE</Text>
//             <Text style={styles.muted}>#{invoice.invoice_number}</Text>
//           </View>
//         </View>

//         {/* ---------- BILL TO + INFO ---------- */}
//         <View style={styles.grid}>
//           <View style={styles.col}>
//             <Text style={styles.sectionTitle}>BILL TO</Text>
//             <View style={styles.card}>
//               <Text>{invoice.customer?.name}</Text>
//               <Text>{invoice.customer?.address}</Text>
//               <Text>{invoice.customer?.city}</Text>
//               <Text>{invoice.customer?.email}</Text>
//             </View>
//           </View>

//           <View style={[styles.col, styles.rightAlign]}>
//             <Text style={styles.sectionTitle}>INVOICE INFO</Text>
//             <View style={styles.card}>
//               <Text>Invoice Date: {invoice.invoice_date}</Text>
//               <Text>Due Date: {invoice.due_date}</Text>
//               <Text>Type: {invoice.type}</Text>
//             </View>
//           </View>
//         </View>

//         {/* ---------- ITEMS TABLE ---------- */}
//         <View>
//           <View style={styles.tableHeader}>
//             <Text style={styles.cellItem}>Item</Text>
//             <Text style={styles.cellQty}>Qty</Text>
//             <Text style={styles.cellPrice}>Price</Text>
//             <Text style={styles.cellTotal}>Total</Text>
//           </View>

//           {invoice.items.map((item: any, i: number) => (
//             <View key={i} style={styles.tableRow} wrap={false}>
//               <Text style={styles.cellItem}>{item.item}</Text>
//               <Text style={styles.cellQty}>{item.qty}</Text>
//               <Text style={styles.cellPrice}>
//                 {invoice.currency} {item.price.toFixed(2)}
//               </Text>
//               <Text style={styles.cellTotal}>
//                 {invoice.currency} {(item.qty * item.price).toFixed(2)}
//               </Text>
//             </View>
//           ))}
//         </View>

//         {/* ---------- BANK + QR + TOTALS ---------- */}
//         <View style={styles.footerRow}>
//           {settings?.payments && (
//             <View style={styles.bankBox}>
//               <Text style={styles.sectionTitle}>Bank Details</Text>
//               <Text>Account Name: {settings.payments.account_name}</Text>
//               <Text>Account No: {settings.payments.account_number}</Text>
//               <Text>IFSC: {settings.payments.ifsc_code}</Text>
//               <Text>Branch: {settings.payments.branch_name}</Text>
//             </View>
//           )}

//           {settings?.payments?.qr_code && (
//             <View style={styles.qrBox}>
//               <Text style={styles.sectionTitle}>Pay via QR</Text>
//               <Image
//                 src={{ uri: settings.payments.qr_code }}
//                 style={styles.qrImage}
//               />
//             </View>
//           )}

//           <View style={styles.totalsBox}>
//             <View style={styles.totalRow}>
//               <Text>Subtotal</Text>
//               <Text>
//                 {invoice.currency} {subtotal.toFixed(2)}
//               </Text>
//             </View>

//             {discount > 0 && (
//               <View style={styles.totalRow}>
//                 <Text>Discount</Text>
//                 <Text>
//                   -{invoice.currency} {discount.toFixed(2)}
//                 </Text>
//               </View>
//             )}

//             {tax > 0 && (
//               <View style={styles.totalRow}>
//                 <Text>Tax</Text>
//                 <Text>
//                   {invoice.currency} {tax.toFixed(2)}
//                 </Text>
//               </View>
//             )}

//             <View style={styles.totalRow}>
//               <Text style={styles.grandTotal}>Total</Text>
//               <Text style={styles.grandTotal}>
//                 {invoice.currency} {total.toFixed(2)}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* ---------- NOTES ---------- */}
//         {invoice.notes && (
//           <View style={styles.notes}>
//             <Text style={styles.sectionTitle}>Notes & Terms</Text>
//             <Text>{invoice.notes}</Text>
//           </View>
//         )}
//       </Page>
//     </Document>
//   );
// }

// import {
//   Document,
//   Page,
//   View,
//   Text,
//   StyleSheet,
//   Image,
// } from "@react-pdf/renderer";

// const styles = StyleSheet.create({
//   page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 24,
//   },
//   companyRow: { flexDirection: "row" },
//   logo: { width: 48, height: 48, marginRight: 12 },
//   companyName: { fontSize: 16, fontWeight: "bold" },
//   invoiceTitle: { fontSize: 20, fontWeight: "bold" },
//   rightAlign: { textAlign: "right" },
//   muted: { color: "#666" },
//   grid: { flexDirection: "row", marginBottom: 24 },
//   col: { flex: 1 },
//   card: {
//     backgroundColor: "#f9f9f9",
//     padding: 10,
//     borderRadius: 4,
//     marginTop: 6,
//   },
//   sectionTitle: { fontSize: 10, fontWeight: "bold", color: "#555" },
//   tableHeader: {
//     flexDirection: "row",
//     backgroundColor: "#f0f0f0",
//     borderTopWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: "#ddd",
//   },
//   tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
//   cellItem: { flex: 3, padding: 6 },
//   cellQty: { flex: 1, padding: 6, textAlign: "center" },
//   cellPrice: { flex: 2, padding: 6, textAlign: "right" },
//   cellTotal: { flex: 2, padding: 6, textAlign: "right" },
//   footerRow: { flexDirection: "row", marginTop: 20 },
//   bankBox: {
//     flex: 2,
//     backgroundColor: "#fafafa",
//     padding: 10,
//     borderRadius: 4,
//   },
//   qrBox: { width: 110, alignItems: "center", marginLeft: 12 },
//   qrImage: { width: 80, height: 80, marginTop: 6 },
//   totalsBox: {
//     flex: 1,
//     marginLeft: "auto",
//     backgroundColor: "#fafafa",
//     padding: 10,
//     borderRadius: 4,
//   },
//   totalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 4,
//   },
//   grandTotal: { fontSize: 14, fontWeight: "bold" },
//   notes: {
//     marginTop: 24,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderColor: "#eee",
//   },
// });

// // **CRITICAL: Safe data sanitization function**
// const sanitizeData = (data: any) => {
//   if (!data) return null;

//   return {
//     invoice_number: String(data.invoice_number || "INV-001"),
//     invoice_date: String(
//       data.invoice_date || new Date().toISOString().split("T")[0]
//     ),
//     due_date: String(
//       data.due_date ||
//         new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//           .toISOString()
//           .split("T")[0]
//     ),
//     type: String(data.type || "Standard"),
//     currency: String(data.currency || "₹"),
//     discount: Number(data.discount || 0),
//     notes: String(data.notes || ""),

//     customer: {
//       name: String(data.customer?.name || "Customer Name"),
//       address: String(data.customer?.address || ""),
//       city: String(data.customer?.city || ""),
//       email: String(data.customer?.email || ""),
//     },

//     items: Array.isArray(data.items)
//       ? data.items.map((item: any) => ({
//           item: String(item.item || "Item"),
//           qty: Number(item.qty || 1),
//           price: Number(item.price || 0),
//           tax: String(item.tax || "0%"),
//         }))
//       : [{ item: "Sample Item", qty: 1, price: 100, tax: "0%" }],
//   };
// };

// export default function InvoicePDF({ invoice, settings }: any) {
//   // **SANITIZE ALL DATA FIRST**
//   const safeInvoice = sanitizeData(invoice);
//   const safeSettings = {
//     general: {
//       company_name: String(settings?.general?.company_name || "Your Company"),
//       company_address: String(
//         settings?.general?.company_address || "Your Address"
//       ),
//       company_logo: settings?.general?.company_logo || "",
//     },
//     payments: settings?.payments || null,
//   };

//   // **SAFE CALCULATIONS**
//   const subtotal = safeInvoice!.items.reduce((sum: number, i: any) => {
//     return sum + i.qty * i.price;
//   }, 0);

//   const tax = safeInvoice!.items.reduce((sum: number, i: any) => {
//     const rate = parseFloat(String(i.tax || "0").replace("%", "")) / 100;
//     return sum + i.qty * i.price * rate;
//   }, 0);

//   const discount = safeInvoice!.discount;
//   const total = subtotal + tax - discount;

//   // **SAFE IMAGE RENDER - NO IMAGES = NO ERROR**
//   const SafeImage = ({ src, style, fallback }: any) => {
//     if (!src || typeof src !== "string") {
//       return <Text style={style}>[LOGO]</Text>;
//     }

//     // Only render if valid base64 or http URL
//     if (
//       src.startsWith("data:image/") ||
//       src.startsWith("http://") ||
//       src.startsWith("https://")
//     ) {
//       try {
//         return <Image source={{ uri: src }} style={style} />;
//       } catch {
//         return <Text style={style}>[LOGO]</Text>;
//       }
//     }
//     return <Text style={style}>[LOGO]</Text>;
//   };

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         {/* HEADER */}
//         <View style={styles.header}>
//           <View style={styles.companyRow}>
//             <SafeImage
//               src={safeSettings.general.company_logo}
//               style={styles.logo}
//               fallback="[LOGO]"
//             />
//             <View>
//               <Text style={styles.companyName}>
//                 {safeSettings.general.company_name}
//               </Text>
//               <Text style={styles.muted}>
//                 {safeSettings.general.company_address}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.rightAlign}>
//             <Text style={styles.invoiceTitle}>INVOICE</Text>
//             <Text style={styles.muted}>#{safeInvoice!.invoice_number}</Text>
//           </View>
//         </View>

//         {/* BILL TO + INFO */}
//         <View style={styles.grid}>
//           <View style={styles.col}>
//             <Text style={styles.sectionTitle}>BILL TO</Text>
//             <View style={styles.card}>
//               <Text>{safeInvoice!.customer.name}</Text>
//               {safeInvoice!.customer.address && (
//                 <Text>{safeInvoice!.customer.address}</Text>
//               )}
//               {safeInvoice!.customer.city && (
//                 <Text>{safeInvoice!.customer.city}</Text>
//               )}
//               {safeInvoice!.customer.email && (
//                 <Text>{safeInvoice!.customer.email}</Text>
//               )}
//             </View>
//           </View>

//           <View style={[styles.col, styles.rightAlign]}>
//             <Text style={styles.sectionTitle}>INVOICE INFO</Text>
//             <View style={styles.card}>
//               <Text>Invoice Date: {safeInvoice!.invoice_date}</Text>
//               <Text>Due Date: {safeInvoice!.due_date}</Text>
//               <Text>Type: {safeInvoice!.type}</Text>
//             </View>
//           </View>
//         </View>

//         {/* ITEMS TABLE */}
//         <View>
//           <View style={styles.tableHeader}>
//             <Text style={styles.cellItem}>Item</Text>
//             <Text style={styles.cellQty}>Qty</Text>
//             <Text style={styles.cellPrice}>Price</Text>
//             <Text style={styles.cellTotal}>Total</Text>
//           </View>

//           {safeInvoice!.items.map((item: any, index: number) => (
//             <View key={index} style={styles.tableRow}>
//               <Text style={styles.cellItem}>{item.item}</Text>
//               <Text style={styles.cellQty}>{item.qty}</Text>
//               <Text style={styles.cellPrice}>
//                 {safeInvoice!.currency} {Number(item.price).toFixed(2)}
//               </Text>
//               <Text style={styles.cellTotal}>
//                 {safeInvoice!.currency} {(item.qty * item.price).toFixed(2)}
//               </Text>
//             </View>
//           ))}
//         </View>

//         {/* TOTALS */}
//         <View style={styles.footerRow}>
//           {safeSettings.payments && (
//             <View style={styles.bankBox}>
//               <Text style={styles.sectionTitle}>Bank Details</Text>
//               <Text>Account: {safeSettings.payments.account_name}</Text>
//               <Text>Number: {safeSettings.payments.account_number}</Text>
//               <Text>IFSC: {safeSettings.payments.ifsc_code}</Text>
//             </View>
//           )}

//           <View style={styles.totalsBox}>
//             <View style={styles.totalRow}>
//               <Text>Subtotal</Text>
//               <Text>
//                 {safeInvoice!.currency} {subtotal.toFixed(2)}
//               </Text>
//             </View>

//             {discount > 0 && (
//               <View style={styles.totalRow}>
//                 <Text>Discount</Text>
//                 <Text>
//                   -{safeInvoice!.currency} {discount.toFixed(2)}
//                 </Text>
//               </View>
//             )}

//             {tax > 0 && (
//               <View style={styles.totalRow}>
//                 <Text>Tax</Text>
//                 <Text>
//                   {safeInvoice!.currency} {tax.toFixed(2)}
//                 </Text>
//               </View>
//             )}

//             <View style={styles.totalRow}>
//               <Text style={styles.grandTotal}>TOTAL</Text>
//               <Text style={styles.grandTotal}>
//                 {safeInvoice!.currency} {total.toFixed(2)}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* NOTES */}
//         {safeInvoice!.notes && (
//           <View style={styles.notes}>
//             <Text style={styles.sectionTitle}>Notes</Text>
//             <Text>{safeInvoice!.notes}</Text>
//           </View>
//         )}
//       </Page>
//     </Document>
//   );
// }

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  companyAddress: {
    color: "#666",
    fontSize: 9,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
  },
  invoiceNumber: {
    color: "#666",
    fontSize: 11,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  col: { flex: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#000",
  },
  customerInfo: {
    marginBottom: 3,
    color: "#555",
    fontSize: 9,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoRow: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cellItem: { flex: 3, paddingRight: 8 },
  cellQty: { flex: 0.8, textAlign: "center" },
  cellPrice: { flex: 1.2, textAlign: "right" },
  cellTax: { flex: 0.8, textAlign: "center" },
  cellTotal: { flex: 1.2, textAlign: "right", fontWeight: "bold" },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fafafa",
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  summaryLabel: { flex: 4.8, textAlign: "right", fontWeight: "bold" },
  summaryValue: { flex: 1.2, textAlign: "right" },
  footerSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  bankCard: {
    flex: 2,
    backgroundColor: "#fafafa",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  qrCard: {
    flex: 0.8,
    backgroundColor: "#fafafa",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  qrImage: { width: 75, height: 75 },
  bankRow: {
    marginBottom: 4,
    flexDirection: "row",
    fontSize: 9,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  notesCard: {
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 4,
    marginTop: 6,
  },
});

const sanitizeData = (data: any) => {
  return {
    invoice_number: String(data.invoice_number || "INV-001"),
    invoice_date:
      data.invoice_date ||
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    due_date:
      data.due_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      ),
    type: String(data.type || "Standard"),
    currency: String(data.currency || "₹"),
    discount: Number(data.discount || 0),
    notes: String(data.notes || ""),
    terms: String(data.terms || ""),
    customer_snapshot: {
      name: String(
        data.customer_snapshot?.name || data.customer?.name || "Customer Name"
      ),
      address: String(
        data.customer_snapshot?.address || data.customer?.address || ""
      ),
      city: String(data.customer_snapshot?.city || data.customer?.city || ""),
      state: String(data.customer_snapshot?.state || ""),
      email: String(
        data.customer_snapshot?.email || data.customer?.email || ""
      ),
      taxId: String(data.customer_snapshot?.taxId || ""),
    },
    items: Array.isArray(data.items)
      ? data.items.map((item: any) => ({
          item: String(item.item || "Item"),
          description: String(item.description || ""),
          qty: Number(item.qty || 1),
          price: Number(item.price || 0),
          tax: String(item.tax || "0%"),
        }))
      : [{ item: "Item", qty: 1, price: 0, tax: "0%", description: "" }],
  };
};

const SafeImage = ({ src, style }: any) => {
  if (!src)
    return (
      <View style={style}>
        <Text style={{ fontSize: 40 }}>[LOGO]</Text>
      </View>
    );

  try {
    return <Image source={{ uri: src }} style={style} />;
  } catch {
    return (
      <View style={style}>
        <Text style={{ fontSize: 40 }}>[LOGO]</Text>
      </View>
    );
  }
};

export default function InvoicePDF({ invoice, settings }: any) {
  const safeInvoice = sanitizeData(invoice);
  const safeSettings = {
    general: {
      company_name: String(settings?.general?.company_name || "Your Company"),
      company_address: String(settings?.general?.company_address || ""),
      company_logo: settings?.general?.company_logo || null,
    },
    payments: settings?.payments || null,
  };

  const itemsWithTax = safeInvoice.items.map((item: any) => {
    const subtotal = item.qty * item.price;
    const taxRate = parseFloat(item.tax.replace("%", "")) / 100;
    return {
      ...item,
      subtotal,
      taxAmount: subtotal * taxRate,
      total: subtotal * (1 + taxRate),
    };
  });

  const subtotal = itemsWithTax.reduce(
    (acc: number, i: any) => acc + i.subtotal,
    0
  );
  const totalTax = itemsWithTax.reduce(
    (acc: number, i: any) => acc + i.taxAmount,
    0
  );
  const discount = safeInvoice.discount;
  const total = subtotal + totalTax - discount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.companyRow}>
            <SafeImage
              src={safeSettings.general.company_logo}
              style={styles.logo}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>
                {safeSettings.general.company_name}
              </Text>
              {safeSettings.general.company_address && (
                <Text style={styles.companyAddress}>
                  {safeSettings.general.company_address}
                </Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              #{safeInvoice.invoice_number}
            </Text>
          </View>
        </View>

        {/* BILL TO + INFO */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <View style={styles.card}>
              <Text style={styles.customerName}>
                {safeInvoice.customer_snapshot.name}
              </Text>
              {safeInvoice.customer_snapshot.address && (
                <Text style={styles.customerInfo}>
                  {safeInvoice.customer_snapshot.address}
                </Text>
              )}
              {(safeInvoice.customer_snapshot.city ||
                safeInvoice.customer_snapshot.state) && (
                <Text style={styles.customerInfo}>
                  {safeInvoice.customer_snapshot.city}
                  {safeInvoice.customer_snapshot.state &&
                    `, ${safeInvoice.customer_snapshot.state}`}
                </Text>
              )}
              {safeInvoice.customer_snapshot.email && (
                <Text style={styles.customerInfo}>
                  {safeInvoice.customer_snapshot.email}
                </Text>
              )}
              {safeInvoice.customer_snapshot.taxId && (
                <Text style={styles.customerInfo}>
                  Tax ID: {safeInvoice.customer_snapshot.taxId}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={[styles.sectionTitle, { textAlign: "right" }]}>
              INVOICE INFO
            </Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={{ flex: 1.5, fontWeight: "bold" }}>
                  Invoice Date:
                </Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {safeInvoice.invoice_date}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ flex: 1.5, fontWeight: "bold" }}>Due Date:</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {safeInvoice.due_date}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ flex: 1.5, fontWeight: "bold" }}>Type:</Text>
                <Text style={{ flex: 1, textAlign: "right", color: "#1890ff" }}>
                  {safeInvoice.type}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.cellItem}>Item</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Price</Text>
            <Text style={styles.cellTax}>Tax</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>

          {safeInvoice.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.cellItem}>
                <Text style={{ fontWeight: "bold" }}>{item.item}</Text>
                {item.description && (
                  <Text style={{ fontSize: 8, color: "#666", marginTop: 1 }}>
                    {item.description}
                  </Text>
                )}
              </Text>
              <Text style={styles.cellQty}>{item.qty}</Text>
              <Text style={styles.cellPrice}>
                {safeInvoice.currency} {item.price.toFixed(2)}
              </Text>
              <Text style={styles.cellTax}>{item.tax}</Text>
              <Text style={styles.cellTotal}>
                {safeInvoice.currency} {item.total.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* SUMMARY */}
          <View style={styles.tableRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.cellTotal}>
              {safeInvoice.currency} {subtotal.toFixed(2)}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.cellTotal}>
                -{safeInvoice.currency} {discount.toFixed(2)}
              </Text>
            </View>
          )}
          {totalTax > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.cellTotal}>
                {safeInvoice.currency} {totalTax.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text
              style={{
                flex: 4.8,
                textAlign: "right",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                flex: 1.2,
                textAlign: "right",
                fontSize: 15,
                fontWeight: "bold",
                color: "#1890ff",
              }}
            >
              {safeInvoice.currency} {total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* BANK + QR */}
        {safeSettings.payments && (
          <View style={styles.footerSection}>
            <View style={styles.bankCard}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <View style={styles.bankRow}>
                <Text style={{ width: 85, fontWeight: "bold" }}>Account:</Text>
                <Text>{safeSettings.payments.account_name}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={{ width: 85, fontWeight: "bold" }}>Number:</Text>
                <Text>{safeSettings.payments.account_number}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={{ width: 85, fontWeight: "bold" }}>IFSC:</Text>
                <Text>{safeSettings.payments.ifsc_code}</Text>
              </View>
              {safeSettings.payments.branch_name && (
                <View style={styles.bankRow}>
                  <Text style={{ width: 85, fontWeight: "bold" }}>Branch:</Text>
                  <Text>{safeSettings.payments.branch_name}</Text>
                </View>
              )}
            </View>

            {safeSettings.payments.qr_code && (
              <View style={styles.qrCard}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: "center", marginBottom: 4 },
                  ]}
                >
                  QR Pay
                </Text>
                <SafeImage
                  src={safeSettings.payments.qr_code}
                  style={styles.qrImage}
                />
                <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
                  Scan to Pay
                </Text>
              </View>
            )}
          </View>
        )}

        {/* NOTES */}
        {(safeInvoice.notes || safeInvoice.terms) && (
          <View style={styles.notesSection}>
            {safeInvoice.notes && (
              <>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.notesCard}>
                  <Text style={{ fontSize: 9 }}>{safeInvoice.notes}</Text>
                </View>
              </>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
