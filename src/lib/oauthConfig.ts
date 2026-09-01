/**
 * OAuth provider config, per brand surface.
 *
 * WHY THIS FILE EXISTS
 *   Zukvo and Testiez are one deploy behind two domains, so `NEXT_PUBLIC_APP_URL`
 *   — a single build-time value — can only ever name ONE brand's app host. The
 *   login page used it unconditionally, which meant a customer on
 *   `acme.testiez.com` clicking "Sign in with Google" was redirected to the
 *   Zukvo app domain to authenticate, and landed back on `acme.zukvo.com`:
 *   the wrong brand door, on a domain they were never sold.
 *
 *   Resolving the host through the RESOLVED PRODUCT instead keeps each brand on
 *   its own domain for the whole round trip. This mirrors `tenantOrigin()` in
 *   the backend's config/brand.ts, which already picks between FRONTEND_URL and
 *   TESTIEZ_FRONTEND_URL the same way.
 *
 * ONE OAUTH CLIENT, BOTH BRANDS
 *   Both surfaces share a single Google client and a single Azure app
 *   registration. That is a deliberate choice: it means the Testiez host only
 *   has to be added to the existing Authorized JavaScript origins and redirect
 *   URIs rather than standing up a second set of apps.
 *
 *   The cost is that the provider's own consent screen is branded for whichever
 *   app was registered — a Testiez customer sees that name when they approve
 *   access. Splitting later is a config change, not a code change: give the two
 *   `NEXT_PUBLIC_TESTIEZ_*_CLIENT_ID` vars their own values and every call site
 *   picks them up, because none of them hardcode an id any more.
 */

import type { ProductKey } from "./product";

export interface SsoAvailability {
  google: boolean;
  microsoft: boolean;
  any: boolean;
}

export interface OAuthConfig {
  googleClientId: string;
  msClientId: string;
  /** The brand's app origin — where OAuth round trips start and end. */
  appUrl: string;
}

// Shared defaults. Kept as literals so behaviour is unchanged when the env vars
// are absent, which is how every existing deployment is configured today.
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "945644412981-eu93b14d7jr5d0gd5s04758lu6mupad8.apps.googleusercontent.com";

const MS_CLIENT_ID =
  process.env.NEXT_PUBLIC_MS_CLIENT_ID || "2de414d6-6eff-4c4a-9480-f124cc8d4796";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

/**
 * The app URL still falls back, because getting it wrong only means a redirect
 * to the other brand's host — bad, but recoverable, and a blank host would
 * break login outright for a deployment mid-migration.
 *
 * The CLIENT IDS deliberately do NOT fall back. Testiez is its own product with
 * its own OAuth apps; borrowing Zukvo's would work mechanically but the consent
 * dialog is branded from the app registration, so a Testiez customer would be
 * asked to grant access to "Zukvo". Unset means unconfigured, and the login page
 * hides the buttons rather than showing a control that names the other brand.
 */
const TESTIEZ_APP_URL = process.env.NEXT_PUBLIC_TESTIEZ_APP_URL || APP_URL;

const CONFIGS: Record<ProductKey, OAuthConfig> = {
  zukvo: {
    googleClientId: GOOGLE_CLIENT_ID,
    msClientId: MS_CLIENT_ID,
    appUrl: APP_URL,
  },
  testiez: {
    googleClientId: process.env.NEXT_PUBLIC_TESTIEZ_GOOGLE_CLIENT_ID || "",
    msClientId: process.env.NEXT_PUBLIC_TESTIEZ_MS_CLIENT_ID || "",
    appUrl: TESTIEZ_APP_URL,
  },
};

export function oauthConfigFor(product: ProductKey): OAuthConfig {
  return CONFIGS[product] ?? CONFIGS.zukvo;
}

/** Whether this surface can offer each provider at all. */
export function ssoAvailability(product: ProductKey) {
  const cfg = oauthConfigFor(product);
  return {
    google: cfg.googleClientId.length > 0,
    microsoft: cfg.msClientId.length > 0,
    any: cfg.googleClientId.length > 0 || cfg.msClientId.length > 0,
  };
}

export const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

export const MS_SCOPE = "openid profile email User.Read";
