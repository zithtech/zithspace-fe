/**
 * Product resolution — which SURFACE is this request coming through?
 *
 * Zukvo and Testiez are one app, one deploy, one database, and the same rows.
 * The only thing that differs is the front door:
 *
 *     {tenant}.zukvo.com    → the full suite
 *     {tenant}.testiez.com  → the standalone QA product
 *
 * The tenant slug namespace is shared, so `acme.zukvo.com` and
 * `acme.testiez.com` are the SAME tenant looking at the SAME data through
 * different shells. That is what makes "upgrade from Testiez to the full
 * suite" a single row insert rather than a migration.
 *
 * WHY THE HOST AND NOT A COLUMN ON THE TENANT:
 *   A tenant can legitimately need both doors — a company on the full suite
 *   that also hands its outsourced QA vendor a Testiez-branded login. Product
 *   is a property of the request, not of the customer.
 *
 * This file is deliberately free of React and browser globals so the Edge
 * middleware and the client can share one implementation. Two copies of
 * host-parsing logic that drift apart is exactly how a surface leaks.
 */

export type ProductKey = "zukvo" | "testiez";

/**
 * Nav module keys a surface is allowed to render.
 *
 * These mirror `ModuleType` in components/layout/navigationConfig.tsx. They are
 * typed as plain strings here on purpose: navigationConfig pulls in React and
 * the whole lucide icon set, and this module has to stay importable from Edge
 * middleware.
 */
export type NavModuleKey =
  | "MY_HUB"
  | "HOME"
  | "WORK"
  | "HRMS"
  | "FINANCE"
  | "ADMIN"
  | "REC_SUITE";

export interface ProductManifest {
  key: ProductKey;
  /** Shown in the browser title, emails and the shell header. */
  name: string;
  /** Where a logged-in user lands, and where denied routes redirect to. */
  homeRoute: string;
}

const ZUKVO: ProductManifest = {
  key: "zukvo",
  name: "Zukvo",
  homeRoute: "/dashboard",
};

/**
 * Testiez is a DELIVERY product, not a QA-tool-only product: it ships Tickets,
 * Projects, Document Hub and Time Tracking alongside QA Space, because a QA
 * engagement needs somewhere to file the bugs and something to test against.
 *
 * What it drops is the people-and-money half of the suite — MY_HUB, HRMS,
 * FINANCE, REC_SUITE — plus the commercial pieces of Work (Proposals, Leads,
 * BidIq, Squads) and the HR-facing Timesheet and Daily Updates.
 *
 * Those exclusions are per-ITEM, not per-module: Testiez keeps WORK and ADMIN
 * but only some of their contents. That is what the `products` field on NavItem
 * expresses — see navigationConfig.tsx.
 */
const TESTIEZ: ProductManifest = {
  key: "testiez",
  name: "Testiez",
  homeRoute: "/dashboard",
};

export const PRODUCTS: Record<ProductKey, ProductManifest> = {
  zukvo: ZUKVO,
  testiez: TESTIEZ,
};

export const DEFAULT_PRODUCT: ProductKey = "zukvo";

/**
 * Resolve the product from a hostname.
 *
 * Accepts a bare hostname or a host:port pair. Anything unrecognised falls
 * back to Zukvo — an unknown host should show the full suite and let auth do
 * its job, never silently downgrade someone into the QA-only shell.
 *
 * Local development:
 *   {tenant}.testiez.localhost:3005  → testiez
 *   testiez.localhost:3005           → testiez, no tenant (the brand root)
 *   {tenant}.localhost:3005          → zukvo
 *   zukvo.localhost:3005             → zukvo, no tenant (the brand root)
 *   localhost:3005                   → zukvo
 * which composes with the existing `{tenant}.localhost` tenant detection in
 * TenantContext rather than replacing it.
 *
 * The Zukvo arms below are redundant with the fallback and say so on purpose:
 * BRAND_LABELS is derived from the same names, and a brand that appears only as
 * an unwritten default is one nobody thinks to add to that list.
 */
export function productFromHostname(hostname: string | null | undefined): ProductKey {
  if (!hostname) return DEFAULT_PRODUCT;

  const host = hostname.toLowerCase().split(":")[0].replace(/\.$/, "");

  if (host === "testiez.com" || host.endsWith(".testiez.com")) return "testiez";
  if (host === "testiez.localhost" || host.endsWith(".testiez.localhost")) return "testiez";

  if (host === "zukvo.com" || host.endsWith(".zukvo.com")) return "zukvo";
  if (host === "zukvo.localhost" || host.endsWith(".zukvo.localhost")) return "zukvo";

  return DEFAULT_PRODUCT;
}

/**
 * Host labels that name a BRAND rather than a tenant.
 *
 * `testiez.localhost` and `acme.localhost` are the same shape — two labels, the
 * second being `localhost` — so nothing but this list can tell the Testiez
 * brand root apart from a workspace called "testiez". Without it the leftmost
 * label is taken as a slug and the app goes looking for a tenant named after
 * the product. See tenantSlugFromHostname in context/TenantContext.tsx.
 */
export const BRAND_LABELS: readonly string[] = Object.keys(PRODUCTS);

/**
 * The brand's MARKETING site — a different origin from the app.
 *
 * Needed wherever the app has to hand someone back to a page that can help
 * them when the app itself cannot: the workspace picker at /signin, and signup.
 * Per-brand for the same reason the app URL is: sending a Testiez customer to
 * zukvo.com names a product they have never heard of.
 */
export function marketingUrlFor(product: ProductKey): string {
  if (product === "testiez") {
    return process.env.NEXT_PUBLIC_TESTIEZ_MARKETING_URL || "https://testiez.com";
  }
  return process.env.NEXT_PUBLIC_MARKETING_URL || "https://zukvo.com";
}

export function manifestFor(product: ProductKey): ProductManifest {
  return PRODUCTS[product] ?? PRODUCTS[DEFAULT_PRODUCT];
}

export function manifestForHostname(hostname: string | null | undefined): ProductManifest {
  return manifestFor(productFromHostname(hostname));
}


/** Header the Edge middleware stamps so server components can read the product. */
export const PRODUCT_HEADER = "x-zukvo-product";
