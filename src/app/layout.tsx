import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider,App } from "antd";
import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import QueryProvider from "@/providers/QueryProvider";
import { SocketProvider } from '@/providers/SocketProvider';
import './globals.css';
import { App as AntdApp } from "antd";

import { ThemeProvider } from "@/context/ThemeContext";
import ThemeConfigProvider from "@/providers/ThemeConfigProvider";
import { LayoutProvider } from "@/context/LayoutContext";
import { TicketDrawerProvider } from "@/context/TicketDrawerContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AntdApp>
          <AntdRegistry>
            <ThemeProvider>
              <ThemeConfigProvider>
                <App>
                  <TenantProvider>
                    <AuthProvider>
                      <QueryProvider>
                        <SocketProvider>
                          <LayoutProvider>
                            <TicketDrawerProvider>{children}</TicketDrawerProvider>
                          </LayoutProvider>
                        </SocketProvider>
                      </QueryProvider>
                    </AuthProvider>
                  </TenantProvider>
                </App>
              </ThemeConfigProvider>
            </ThemeProvider>
          </AntdRegistry>
        </AntdApp>
      </body>
    </html>
  );
}
