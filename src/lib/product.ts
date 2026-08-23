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

/**
 * THE single vocabulary for "what may this tenant reach".
 *
 * MUST STAY IN SYNC with `Capability` in
 * zukvo-be/src/modules/entitlements/entitlements.service.ts — the server is
 * authoritative, and a key that exists on only one side either hides something
 * the API still serves, or shows something the API will refuse.
 *
 * Two dimensions use this same list, and both have to pass:
 *   SURFACE   what this brand's front door offers — ProductManifest.capabilities
 *   TENANT    what the customer actually bought   — user.capabilities from /auth/me
 *
 * The effective set is the intersection. That is what keeps a full-suite tenant
 * from seeing Payroll just because they walked in through testiez.com.
 */
export type Capability =
  | "home"
  | "my_hub"
  | "work"
  | "hrms"
  | "finance"
  | "admin"
  | "rec_suite"
  | "proposals"
  | "leads"
  | "squads"
  | "timesheet"
  | "daily_updates"
  | "clients"
  | "chrome_extension"
  | "chat"
  | "skills"
  | "bookmarks";

const ALL_CAPABILITIES: readonly Capability[] = [
  "home",
  "my_hub",
  "work",
  "hrms",
  "finance",
  "admin",
  "rec_suite",
  "proposals",
  "leads",
  "squads",
  "timesheet",
  "daily_updates",
  "clients",
  "chrome_extension",
  "chat",
  "skills",
  "bookmarks",
];

export interface ProductManifest {
  key: ProductKey;
  /** Shown in the browser title, emails and the shell header. */
  name: string;
  /** Where a logged-in user lands, and where denied routes redirect to. */
  homeRoute: string;
  /**
   * What this SURFACE offers, before asking what the tenant bought. Intersected
   * with the tenant's own capabilities to get the effective set.
   */
  capabilities: readonly Capability[];
}

const ZUKVO: ProductManifest = {
  key: "zukvo",
  name: "Zukvo",
  homeRoute: "/dashboard",
  capabilities: ALL_CAPABILITIES,
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
  // Home, Work and Admin — and none of the Work/Admin features sold separately
  // (Proposals, Leads, Squads, Timesheet, Daily Updates, Clients, Chrome
  // Extension) nor the Zukvo-only standalone pages (Chat, Skills, Bookmarks).
  capabilities: ["home", "work", "admin"],
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
 *   {tenant}.localhost:3005          → zukvo
 * which composes with the existing `{tenant}.localhost` tenant detection in
 * TenantContext rather than replacing it.
 */
export function productFromHostname(hostname: string | null | undefined): ProductKey {
  if (!hostname) return DEFAULT_PRODUCT;

  const host = hostname.toLowerCase().split(":")[0].replace(/\.$/, "");

  if (host === "testiez.com" || host.endsWith(".testiez.com")) return "testiez";
  if (host === "testiez.localhost" || host.endsWith(".testiez.localhost")) return "testiez";

  return DEFAULT_PRODUCT;
}

export function manifestFor(product: ProductKey): ProductManifest {
  return PRODUCTS[product] ?? PRODUCTS[DEFAULT_PRODUCT];
}

export function manifestForHostname(hostname: string | null | undefined): ProductManifest {
  return manifestFor(productFromHostname(hostname));
}

/**
 * The effective capability set: what this SURFACE offers, intersected with what
 * the TENANT bought.
 *
 * `tenantCapabilities` comes from /auth/me. An empty array means a session
 * issued before entitlements existed — treated as "unknown, allow" so a stale
 * token degrades to the surface's own list rather than an empty app. The API
 * enforces the real thing regardless, so the worst case is a visible link that
 * returns 403.
 */
export function effectiveCapabilities(
  product: ProductKey,
  tenantCapabilities: readonly string[] | undefined
): Set<Capability> {
  const surface = manifestFor(product).capabilities;
  if (!tenantCapabilities?.length) return new Set(surface);
  return new Set(surface.filter((c) => tenantCapabilities.includes(c)));
}

/** Header the Edge middleware stamps so server components can read the product. */
export const PRODUCT_HEADER = "x-zukvo-product";
