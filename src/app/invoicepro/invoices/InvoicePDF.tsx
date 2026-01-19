import { currencyOptions } from "@/utils/currencyOptions";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 14,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    width: "65%",
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1677ff",
  },
  companyAddress: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
    maxWidth: 220,
  },
  headerRight: {
    width: "35%",
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
  },
  spacer: {
    width: 16,
  },
  label: {
    fontSize: 9,
    color: "#888",
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#fcfcfc",
    borderRadius: 6,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#ededed",
    minHeight: 85,
  },
  cardLine: {
    marginBottom: 5,
  },
  customerName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderWidth: 0.5,
    borderColor: "#e5e5e5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#eaeaea",
  },
  commonCell: {
    paddingVertical: 8,
    borderRightWidth: 0.5,
    borderRightColor: "#eaeaea",
  },
  cellItem: {
    flex: 3,
    paddingLeft: 6,
  },
  cellQty: {
    flex: 0.7,
    textAlign: "center",
  },
  cellPrice: {
    flex: 1.2,
    textAlign: "right",
    paddingRight: 6,
  },
  cellTax: {
    flex: 0.8,
    textAlign: "center",
  },
  cellTotal: {
    flex: 1.3,
    textAlign: "right",
    fontWeight: "bold",
    paddingRight: 6,
    borderRightWidth: 0,
  },
  footer: {
    flexDirection: "row",
    marginTop: 24,
  },
  leftColumn: {
    flex: 2,
    marginRight: 16,
  },
  rightColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 6,
    marginLeft: 2,
    textTransform: "uppercase",
  },
  sectionsign: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 6,
    marginLeft: 10,
    textTransform: "uppercase",
  },
  bankCard: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#e5e5e5",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fcfcfc",
    minHeight: 100,
    justifyContent: "flex-start",
  },
  bankInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  row: {
    fontSize: 9,
    marginBottom: 3,
  },
  bold: {
    fontWeight: "bold",
  },
  qrBoxNew: {
    width: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: 78,
    height: 78,
  },
  qrText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  signatureCard: {
    borderWidth: 0.5,
    borderColor: "#e5e5e5",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fcfcfc",
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  signatureImage: {
    width: 100,
    height: 45,
    objectFit: "contain",
  },
  signatureText: {
    fontSize: 8,
    color: "#666",
    marginTop: 4,
  },
  notesRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 16,
  },
  notesBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#ededed",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fcfcfc",
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#000",
  },
  notesText: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.4,
  },
});

/* ===================== HELPERS ===================== */
const stripHtml = (html: string) =>
  html ? html.replace(/<[^>]*>?/gm, "") : "";

// const sanitize = (invoice: any) => {
//   const items = (invoice.items || []).map((i: any) => {
//     const qty = Number(i.qty || 0);
//     const price = Number(i.price || 0);
//     const tax = Number(i.tax || 0);
//     const line = qty * price;

//     return {
//       ...i,
//       qty,
//       price,
//       tax,
//       total: line + (line * tax) / 100,
//     };
//   });

//   const subtotal = items.reduce((a: number, b: any) => a + b.qty * b.price, 0);
//   const taxTotal = items.reduce(
//     (a: number, b: any) => a + (b.qty * b.price * b.tax) / 100,
//     0
//   );

//   return {
//     ...invoice,
//     items,
//     subtotal,
//     total: subtotal + taxTotal,
//     notes: stripHtml(invoice.notes || ""),
//     terms: stripHtml(invoice.terms || ""),
//   };
// };

const sanitize = (invoice: any, invoice_page_descriptions: any) => {
  // ✅ 1. Get raw HTML description using invoice number
  const rawDescription =
    invoice_page_descriptions?.[invoice.invoice_number] || "";

  // ✅ 2. Clean HTML
  const cleanDescription = getCleanText(rawDescription);

  // ✅ 3. Sanitize items
  const items = (invoice.items || []).map((i: any) => {
    const qty = Number(i.qty || 0);
    const price = Number(i.price || 0);
    const tax = Number(i.tax || 0);
    const line = qty * price;

    return {
      ...i,
      qty,
      price,
      tax,
      total: line + (line * tax) / 100,
    };
  });

  const subtotal = items.reduce((a: number, b: any) => a + b.qty * b.price, 0);

  const taxTotal = items.reduce(
    (a: number, b: any) => a + (b.qty * b.price * b.tax) / 100,
    0,
  );

  // ✅ 4. Return final sanitized invoice
  return {
    ...invoice,
    items,
    description: cleanDescription, // 🔥 IMPORTANT
    subtotal,
    total: subtotal + taxTotal,
    notes: stripHtml(invoice.notes || ""),
    terms: stripHtml(invoice.terms || ""),
  };
};

const isImage = (src?: string) => !!src && src.startsWith("data:image");

const formatDate = (date?: string, format = "DD/MM/YYYY") => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return format
    .replace("DD", day)
    .replace("MM", month)
    .replace("YYYY", String(year))
    .replace("MMM", monthNames[d.getMonth()]);
};

const getCurrencySymbol = (currencyCode?: string) => {
  return (
    currencyOptions.find((c) => c.value === currencyCode)?.symbol ||
    currencyCode ||
    ""
  );
};

const getCleanText = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

/* ===================== COMPONENT ===================== */
export default function InvoicePDF({
  invoice,
  settings,
  invoice_page_descriptions,
}: any) {
  const d = sanitize(invoice, invoice_page_descriptions);
  const totalQty = d.items.reduce((a: number, b: any) => a + b.qty, 0);

  const hasTax = d.items.some((i: any) => i.tax > 0);

  // FIXED: Removed boolean from array to prevent Type Error
  const dynamicCellItem = [
    styles.commonCell,
    styles.cellItem,
    !hasTax ? { flex: 3.8 } : {},
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isImage(settings?.general?.company_logo) && (
              <Image src={settings.general.company_logo} style={styles.logo} />
            )}
            <View>
              <Text style={styles.companyName}>
                {settings?.general?.company_name}
              </Text>
              <Text style={styles.companyAddress}>
                {settings?.general?.company_address}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              Invoice #{d.invoice_number}
            </Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Bill To</Text>
            <View style={styles.card}>
              <Text style={styles.customerName}>
                {d.customer_snapshot?.name}
              </Text>
              <Text style={styles.cardLine}>
                {d.customer_snapshot?.address}
              </Text>
              <Text style={styles.cardLine}>{d.customer_snapshot?.city}</Text>
              <Text style={styles.cardLine}>{d.customer_snapshot?.email}</Text>
            </View>
          </View>
          <View style={styles.spacer} />
          <View style={styles.infoCol}>
            <Text style={[styles.label, { textAlign: "right" }]}>
              Invoice Info
            </Text>
            <View style={styles.card}>
              <Text style={styles.cardLine}>
                Invoice Date:{" "}
                {formatDate(d.invoice_date, settings?.general?.date_format)}
              </Text>
              <Text style={styles.cardLine}>
                Due Date:{" "}
                {formatDate(d.due_date, settings?.general?.date_format)}
              </Text>
              <Text style={styles.cardLine}>Type: Standard</Text>
            </View>
          </View>
        </View>

        {/* DESCRIPTION */}
        {d.description && (
          <View style={{ marginBottom: 18 }}>
            <Text style={styles.label}>Description</Text>

            <View
              style={{
                borderWidth: 0.5,
                borderColor: "#ededed",
                borderRadius: 6,
                padding: 10,
                backgroundColor: "#fcfcfc",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  color: "#555",
                  lineHeight: 1.4,
                }}
              >
                {d.description}
              </Text>
            </View>
          </View>
        )}

        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <Text style={dynamicCellItem}>Item</Text>
          <Text style={[styles.commonCell, styles.cellQty]}>Qty</Text>
          <Text style={[styles.commonCell, styles.cellPrice]}>Price</Text>
          {hasTax && (
            <Text style={[styles.commonCell, styles.cellTax]}>Tax</Text>
          )}
          <Text style={[styles.commonCell, styles.cellTotal]}>Total</Text>
        </View>

        {/* TABLE BODY */}
        {d.items.map((i: any, idx: number) => (
          <View key={idx} style={styles.tableRow}>
            <View style={dynamicCellItem}>
              <Text style={{ fontWeight: "bold" }}>{i.item}</Text>
              {i.description && (
                <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
                  {stripHtml(i.description)}
                </Text>
              )}
            </View>
            <Text style={[styles.commonCell, styles.cellQty]}>{i.qty}</Text>
            <Text style={[styles.commonCell, styles.cellPrice]}>
              {getCurrencySymbol(d.currency)} {i.price.toFixed(2)}
            </Text>
            {hasTax && (
              <Text style={[styles.commonCell, styles.cellTax]}>{i.tax}%</Text>
            )}
            <Text style={[styles.commonCell, styles.cellTotal]}>
              {getCurrencySymbol(d.currency)} {i.total.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* SUB TOTAL */}
        <View style={styles.tableRow}>
          <View style={dynamicCellItem}>
            <Text style={{ textAlign: "right", paddingRight: 5 }}>
              Subtotal
            </Text>
          </View>
          <Text style={[styles.commonCell, styles.cellQty]} />
          <Text style={[styles.commonCell, styles.cellPrice]} />
          {hasTax && <Text style={[styles.commonCell, styles.cellTax]} />}
          <Text style={[styles.commonCell, styles.cellTotal]}>
            {getCurrencySymbol(d.currency)} {d.subtotal.toFixed(2)}
          </Text>
        </View>

        {/* GRAND TOTAL */}
        <View style={[styles.tableRow, { backgroundColor: "#fafafa" }]}>
          <View style={dynamicCellItem}>
            <Text
              style={{
                fontWeight: "bold",
                textAlign: "right",
                paddingRight: 5,
              }}
            >
              Total
            </Text>
          </View>
          <Text
            style={[styles.commonCell, styles.cellQty, { fontWeight: "bold" }]}
          >
            {totalQty}
          </Text>
          <Text style={[styles.commonCell, styles.cellPrice]} />
          {hasTax && <Text style={[styles.commonCell, styles.cellTax]} />}
          <Text
            style={[
              styles.commonCell,
              styles.cellTotal,
              { fontSize: 13, color: "#1677ff" },
            ]}
          >
            {getCurrencySymbol(d.currency)} {d.total.toFixed(2)}
          </Text>
        </View>

        {/* BANK & SIGNATURE */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.leftColumn}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <View style={styles.bankCard} wrap={false}>
              <View style={styles.bankInfo}>
                <Text style={styles.row}>
                  <Text style={styles.bold}>Bank Name: </Text>
                  {settings?.payments?.account_name}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}>Account Number: </Text>
                  {settings?.payments?.account_number}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}>IFSC Code: </Text>
                  {settings?.payments?.ifsc_code}
                </Text>
                <Text style={styles.row}>
                  <Text style={styles.bold}>Branch: </Text>
                  {settings?.payments?.branch_name}
                </Text>
              </View>
              {isImage(settings?.payments?.qr_code) && (
                <View style={styles.qrBoxNew}>
                  <Image
                    src={settings.payments.qr_code}
                    style={styles.qrImage}
                  />
                  <Text style={styles.qrText}>Scan to Pay</Text>
                </View>
              )}
            </View>
          </View>

          {isImage(settings?.general?.company_signature) && (
            <View style={styles.rightColumn}>
              <Text style={styles.sectionsign}>Authorized Signature</Text>
              <View style={styles.signatureCard}>
                <Image
                  src={settings.general.company_signature}
                  style={styles.signatureImage}
                />
                <Text style={styles.signatureText}>Digitally signed</Text>
              </View>
            </View>
          )}
        </View>

        {/* NOTES & TERMS */}
        {(d.notes || d.terms) && (
          <View style={styles.notesRow}>
            {d.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Notes</Text>
                <Text style={styles.notesText}>{d.notes}</Text>
              </View>
            )}
            {d.terms && (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Terms and Conditions</Text>
                <Text style={styles.notesText}>{d.terms}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
