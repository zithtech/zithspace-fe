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
 * Testiez falls back to the Zukvo values so a deployment that has not set the
 * Testiez vars behaves exactly as it does today — no worse, and no surprise
 * blank host.
 */
const TESTIEZ_APP_URL = process.env.NEXT_PUBLIC_TESTIEZ_APP_URL || APP_URL;

const CONFIGS: Record<ProductKey, OAuthConfig> = {
  zukvo: {
    googleClientId: GOOGLE_CLIENT_ID,
    msClientId: MS_CLIENT_ID,
    appUrl: APP_URL,
  },
  testiez: {
    googleClientId:
      process.env.NEXT_PUBLIC_TESTIEZ_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
    msClientId: process.env.NEXT_PUBLIC_TESTIEZ_MS_CLIENT_ID || MS_CLIENT_ID,
    appUrl: TESTIEZ_APP_URL,
  },
};

export function oauthConfigFor(product: ProductKey): OAuthConfig {
  return CONFIGS[product] ?? CONFIGS.zukvo;
}

export const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

export const MS_SCOPE = "openid profile email User.Read";
