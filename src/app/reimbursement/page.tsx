"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReimbursementPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reimbursement/my-reimbursements");
  }, [router]);

  return null;
}
