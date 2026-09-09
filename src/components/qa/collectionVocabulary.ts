/**
 * The industries a collection can be for, and the icon each one wears.
 *
 * ONE SOURCE, because two forms now ask the question: the full collection form,
 * and the short "where does this playbook belong?" step in the authoring flow.
 * A second copy is how the two would start offering different lists, and a
 * near-miss spelling between them is exactly what splits one audience's shelf
 * in two.
 *
 * A STARTING VOCABULARY, NOT A CLOSED SET. The API stores whatever comes back,
 * and every industry already in use is merged in beside these. The point is
 * only that the common answer is one click.
 */

export const INDUSTRIES: { name: string; icon: string }[] = [
  { name: "Fintech & Payments", icon: "Landmark" },
  { name: "E-commerce & Marketplace", icon: "ShoppingCart" },
  { name: "School & College Management", icon: "GraduationCap" },
  { name: "Healthcare & Patient Data", icon: "HeartPulse" },
  { name: "HR & Payroll Platforms", icon: "Users" },
  { name: "SaaS & Multi-tenant Admin", icon: "Building2" },
  { name: "Banking & Lending", icon: "Landmark" },
  { name: "Insurance & Claims", icon: "ShieldCheck" },
  { name: "Logistics & Delivery", icon: "Boxes" },
  { name: "Travel & Booking", icon: "Globe" },
  { name: "Real Estate & Property", icon: "Building2" },
  { name: "Media & Streaming", icon: "Layers" },
  { name: "Government & Public Sector", icon: "Landmark" },
  { name: "Manufacturing & Supply Chain", icon: "Boxes" },
];

/** A one-line description, so the dropdown explains itself. */
export const INDUSTRY_HINTS: Record<string, string> = {
  "Fintech & Payments": "Money movement, ledgers, KYC, reconciliation",
  "E-commerce & Marketplace": "Catalog, cart, checkout, fulfilment, returns",
  "School & College Management": "Admissions, attendance, grading, fees",
  "Healthcare & Patient Data": "Records, appointments, consent, access rules",
  "HR & Payroll Platforms": "Onboarding, leave, attendance, payroll runs",
  "SaaS & Multi-tenant Admin": "Tenancy, roles, subscriptions, boundaries",
  "Banking & Lending": "Accounts, applications, credit decisions, statements",
  "Insurance & Claims": "Quotes, policies, claims intake, adjudication",
  "Logistics & Delivery": "Routing, tracking, proof of delivery, exceptions",
  "Travel & Booking": "Search, availability, booking, cancellation",
  "Real Estate & Property": "Listings, viewings, offers, tenancy",
  "Media & Streaming": "Catalog, playback, entitlements, recommendations",
  "Government & Public Sector": "Forms, eligibility, case handling, records",
  "Manufacturing & Supply Chain": "Inventory, orders, production, dispatch",
};

/**
 * The curated list plus everything already in use, merged case-insensitively so
 * "fintech" and "Fintech" are one answer. What is already STORED wins, because
 * matching the existing spelling is the whole job.
 */
export function INDUSTRY_OPTIONS(
  inUse: string[] = []
): { value: string; label: string; description?: string }[] {
  const seen = new Map<string, { value: string; label: string; description?: string }>();
  for (const used of inUse) {
    seen.set(used.trim().toLowerCase(), {
      value: used,
      label: used,
      description: INDUSTRY_HINTS[used],
    });
  }
  for (const entry of INDUSTRIES) {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.set(key, {
      value: entry.name,
      label: entry.name,
      description: INDUSTRY_HINTS[entry.name],
    });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The icon follows the INDUSTRY, since the name is free text and cannot be
 * matched against anything.
 *
 * A collection that already has an icon keeps it when its industry is one the
 * list does not know, so a pack for an industry somebody typed themselves is
 * not silently restyled the next time anyone opens it.
 */
export function iconForIndustry(industry: string, current?: string | null): string {
  const match = INDUSTRIES.find(
    (i) => i.name.toLowerCase() === industry.trim().toLowerCase()
  );
  return match?.icon ?? current ?? "Layers";
}
