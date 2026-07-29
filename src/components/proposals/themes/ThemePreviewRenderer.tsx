import React, { useMemo } from 'react';
import { generateCoverHtml } from '@/app/proposals/preview/PdfRenderer';

interface ThemePreviewRendererProps {
  theme: string;
}

export const ThemePreviewRenderer: React.FC<ThemePreviewRendererProps> = ({ theme }) => {
  const html = useMemo(() => {
    // Generate dummy data that looks good for a preview
    const dummyCoverBlock = {
      type: 'cover',
      data: {
        theme,
        title: 'PROJECT PROPOSAL',
        clientName: 'Acme Corporation',
        clientCompany: 'Acme Corp',
        clientEmail: 'contact@acmecorp.com',
        clientPhone: '(555) 123-4567',
        clientAddress: '123 Innovation Way, Tech City',
        senderName: 'Jane Smith',
        senderTitle: 'Lead Strategist',
        senderCompany: 'Salford & Co.',
        senderEmail: 'jane@salford.co',
        senderPhone: '(555) 987-6543',
        senderWebsite: 'www.salford.co'
      }
    };

    return generateCoverHtml(dummyCoverBlock);
  }, [theme]);

  return (
    <div 
      className="theme-preview-container"
      style={{ width: '100%', height: '100%' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
