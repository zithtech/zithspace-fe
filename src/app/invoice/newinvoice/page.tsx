import { Suspense } from "react";
import NewInvoiceClient from "./NewInvoiceClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewInvoiceClient />
    </Suspense>
  );
}
