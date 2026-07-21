import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import QueryProvider from "@/providers/QueryProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import "./globals.css";

import { ThemeProvider } from "@/context/ThemeContext";
import ThemeConfigProvider from "@/providers/ThemeConfigProvider";
import { LayoutProvider } from "@/context/LayoutContext";
import { TicketDrawerProvider } from "@/context/TicketDrawerContext";
import AppSetupGuard from "@/components/common/AppSetupGuard";

import iconLight from "./icon-light.png";
import iconDark from "./icon-dark.png";

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <style dangerouslySetInnerHTML={{ __html: `
          .ant-input, .ant-input-affix-wrapper, .ant-select-selector, .ant-picker, .ant-input-number-input, .ant-input-number-affix-wrapper {
            background-color: transparent !important;
            background: transparent !important;
          }
        ` }} />
        <AntdRegistry>
          <ThemeProvider>
            <ThemeConfigProvider>
              <App>
                <TenantProvider>
                  <AuthProvider>
                    <QueryProvider>
                      <SocketProvider>
                        <LayoutProvider>
                          <TicketDrawerProvider>
                            <AppSetupGuard>{children}</AppSetupGuard>
                          </TicketDrawerProvider>
                        </LayoutProvider>
                      </SocketProvider>
                    </QueryProvider>
                  </AuthProvider>
                </TenantProvider>
              </App>
            </ThemeConfigProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
