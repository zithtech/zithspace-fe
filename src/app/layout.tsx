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
      <body className="antialiased">
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
