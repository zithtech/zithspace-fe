import type { Metadata } from "next";
import { headers } from "next/headers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import { ProductProvider } from "@/context/ProductContext";
import { DEFAULT_PRODUCT, PRODUCT_HEADER, ProductKey } from "@/lib/product";
import QueryProvider from "@/providers/QueryProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import AntdGlobalProvider from "@/providers/AntdGlobalProvider";
import "./globals.css";

import { ThemeProvider } from "@/context/ThemeContext";
import ThemeConfigProvider from "@/providers/ThemeConfigProvider";
import { LayoutProvider } from "@/context/LayoutContext";
import { TicketDrawerProvider } from "@/context/TicketDrawerContext";
import AppSetupGuard from "@/components/common/AppSetupGuard";
import WorkspaceNotFoundGuard from "@/components/common/WorkspaceNotFoundGuard";

import iconLight from "./icon-light.png";
import iconDark from "./icon-dark.png";

/**
 * Tab icon and title follow the product. A Testiez customer looking at a Zukvo
 * favicon is as jarring as a Zukvo logo on the login screen — the tab is the
 * most persistently visible piece of branding there is.
 *
 * Zukvo ships light/dark variants of its mark; Testiez uses the single favicon
 * from its marketing site, which is cut to read on both.
 */
export async function generateMetadata(): Promise<Metadata> {
  const product =
    ((await headers()).get(PRODUCT_HEADER) as ProductKey | null) ?? DEFAULT_PRODUCT;

  if (product === "testiez") {
    return {
      title: "Testiez",
      icons: { icon: [{ url: "/testiez-favicon.png" }] },
    };
  }

  return {
    icons: {
      icon: [
        {
          url: iconLight.src,
          media: "(prefers-color-scheme: light)",
        },
        {
          url: iconDark.src,
          media: "(prefers-color-scheme: dark)",
        },
      ],
    },
  };
}

import { TourProvider } from "@/context/TourContext";
import { ProductTour } from "@/components/tour/ProductTour";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Product is resolved from the Host by the Edge middleware and passed down
  // here rather than sniffed on the client, so the very first painted frame is
  // already the right brand. See src/lib/product.ts.
  const product = ((await headers()).get(PRODUCT_HEADER) as ProductKey | null) ?? DEFAULT_PRODUCT;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Signature-style fonts for the proposal Signature block */}
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script:wght@600&family=Great+Vibes&family=Sacramento&family=Mr+Dafoe&family=Alex+Brush&family=Pinyon+Script&family=Parisienne&family=Mrs+Saint+Delafield&family=Monsieur+La+Doulaise&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <style dangerouslySetInnerHTML={{
          __html: `
          .ant-input, .ant-input-affix-wrapper, .ant-select-selector, .ant-picker, .ant-input-number-input, .ant-input-number-affix-wrapper {
            background-color: transparent !important;
            background: transparent !important;
          }
        ` }} />
        <AntdRegistry>
          {/* ProductProvider is outermost of the app providers on purpose. The
              product is known from the request before anything else, and both
              the Ant Design theme (accent colour) and ZukvoLoader (brand mark,
              used as the global spin indicator) read from it — so it has to sit
              above ThemeConfigProvider, not inside it. */}
          <ProductProvider initialProduct={product}>
            <ThemeProvider>
              <ThemeConfigProvider>
                <App>
                  <AntdGlobalProvider />
                  <TenantProvider>
                    {/* Outside AuthProvider on purpose: if the workspace in the
                        host does not exist there is nothing to authenticate
                        against, and the answer should not wait on a login
                        round trip that cannot succeed. */}
                    <WorkspaceNotFoundGuard>
                      <AuthProvider>
                        <QueryProvider>
                          <SocketProvider>
                            <LayoutProvider>
                              <TicketDrawerProvider>
                              <TourProvider>
                                <AppSetupGuard>{children}</AppSetupGuard>
                                </TourProvider>
                              </TicketDrawerProvider>
                            </LayoutProvider>
                          </SocketProvider>
                        </QueryProvider>
                      </AuthProvider>
                    </WorkspaceNotFoundGuard>
                  </TenantProvider>
                </App>
              </ThemeConfigProvider>
            </ThemeProvider>
          </ProductProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
