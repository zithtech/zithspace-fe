import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { AuthProvider } from '@/context/AuthContext';
import { TenantProvider } from '@/context/TenantContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Z Internal App',
  description: 'Internal management application for Z',
};


const theme = {
  token: {
    // Primary colors
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    
    // Layout
    borderRadius: 6,
    wireframe: false,
    
    // Typography
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // Spacing (more compact)
    padding: 12,
    paddingXS: 4,
    paddingSM: 8,
    paddingLG: 16,
    paddingXL: 20,
    
    // Component sizes (more compact)
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,
    
    // Modern shadows
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  components: {
    // Table customization for compact design
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      rowHoverBg: '#f5f5f5',
      cellPaddingBlock: 8,
      cellPaddingInline: 12,
    },
    // Form customization
    Form: {
      itemMarginBottom: 16,
      verticalLabelPadding: '0 0 4px',
    },
    // Button customization
    Button: {
      paddingInline: 16,
      paddingBlock: 4,
    },
    // Input customization
    Input: {
      paddingBlock: 6,
      paddingInline: 12,
    },
    // Modal customization
    Modal: {
      titleFontSize: 16,
      contentBg: '#ffffff',
    },
    // Card customization
    Card: {
      paddingLG: 16,
      headerBg: '#fafafa',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <TenantProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </TenantProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
