import React, { useState } from 'react';
import { useProposalStore } from '@/store/proposalStore';
import { BlockSettingsRenderer } from './blocks';
import { Empty, Upload, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Sparkles, Building2, Layers, Palette, History } from 'lucide-react';
import { AIEnhanceButton } from './AIEnhanceButton';
import { THEME_PRESETS, FONT_PRESETS } from './themePresets';

type PanelTab = 'content' | 'style' | 'ai';

const SectionLabel: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({ children, accent }) => (
  <span className="pb-section-label">
    {accent && <span className="pb-section-label__dot" />}
    {children}
  </span>
);

export const BlockProperties = () => {
  const { blocks, selectedBlockId, updateBlock, setSelectedBlockId, documentTheme, setDocumentTheme } = useProposalStore();

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const otherBlocks = blocks.filter((b) => b.id !== selectedBlockId);
  const coverBlock = blocks.find((b) => b.type === 'cover');

  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!selectedBlockId) return;
    requestAnimationFrame(() => {
      if (activeRef.current && containerRef.current) {
        activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, [selectedBlockId]);

  const handleUpdateBranding = (data: any) => {
    if (coverBlock) {
      updateBlock(coverBlock.id, data);
    }
  };

  return (
    <div ref={containerRef} className="no-scrollbar pb-props">
      {/* Main Content Panel (Always Visible) */}
      {(() => {
        const activeCard = selectedBlock && (
          <div key={selectedBlock.id} ref={activeRef} className="active-block-properties">
            <div className="pb-props__active-head">
              <div className="pb-props__active-title">
                <Sparkles size={14} className="pb-props__active-icon" />
                <span>
                  <span className="pb-props__active-type">{selectedBlock.type}</span>
                  <span className="pb-props__active-suffix">settings</span>
                </span>
              </div>
              <span className="pb-props__active-chip">Active</span>
            </div>
            <BlockSettingsRenderer
              type={selectedBlock.type}
              data={selectedBlock.data}
              onUpdate={(data) => updateBlock(selectedBlock.id, data)}
            />
          </div>
        );

        const brandingCard = (
          <div className="pb-props__card">
            <div className="pb-props__card-head">
              <div className="pb-props__card-title">
                <Building2 size={14} />
                <span>Branding &amp; Identity</span>
              </div>
              <AIEnhanceButton
                originalData={{
                  company: coverBlock?.data?.senderCompany,
                  name: coverBlock?.data?.senderName,
                  contact: coverBlock?.data?.senderContact,
                  email: coverBlock?.data?.senderEmail,
                }}
                blockType="branding (agency details)"
                onApply={(newBrand) =>
                  handleUpdateBranding({
                    senderCompany: newBrand.company || coverBlock?.data?.senderCompany,
                    senderName: newBrand.name || coverBlock?.data?.senderName,
                    senderContact: newBrand.contact || coverBlock?.data?.senderContact,
                    senderEmail: newBrand.email || coverBlock?.data?.senderEmail,
                  })
                }
              />
            </div>

            <div className="pb-props__brand-row">
              <Upload
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => handleUpdateBranding({ logoUrl: e.target?.result as string });
                  reader.readAsDataURL(file);
                  return false;
                }}
              >
                <div className="pb-props__logo">
                  {coverBlock?.data?.logoUrl ? (
                    <img src={coverBlock.data.logoUrl} alt="Logo" />
                  ) : (
                    <UploadOutlined />
                  )}
                </div>
              </Upload>
              <div className="pb-props__brand-org">
                <SectionLabel>Organization</SectionLabel>
                <Input
                  placeholder="Agency Name"
                  value={coverBlock?.data?.senderCompany}
                  onChange={(e) => handleUpdateBranding({ senderCompany: e.target.value })}
                />
              </div>
            </div>

            <div className="pb-props__brand-contact">
              <div>
                <SectionLabel>Point of Contact</SectionLabel>
                <Input
                  placeholder="Name"
                  value={coverBlock?.data?.senderName}
                  onChange={(e) => handleUpdateBranding({ senderName: e.target.value })}
                />
              </div>
              <div className="pb-props__brand-grid">
                <Input
                  placeholder="Phone"
                  value={coverBlock?.data?.senderContact}
                  onChange={(e) => handleUpdateBranding({ senderContact: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={coverBlock?.data?.senderEmail}
                  onChange={(e) => handleUpdateBranding({ senderEmail: e.target.value })}
                />
              </div>
              <div>
                <SectionLabel>Business Address</SectionLabel>
                <Input.TextArea
                  placeholder="Street, City, State, ZIP"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  value={coverBlock?.data?.senderAddress}
                  onChange={(e) => handleUpdateBranding({ senderAddress: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

        const isCoverActive = selectedBlock?.type === 'cover';

        return (
          <div className="pb-props__panel">
            {isCoverActive ? (
              <>
                {brandingCard}
                {activeCard}
              </>
            ) : (
              <>
                {activeCard}
                {brandingCard}
              </>
            )}

      {/* 3. Other blocks */}
      {otherBlocks.length > 0 && (
        <div className="pb-props__others">
          <div className="pb-props__others-head">
            <Layers size={12} />
            <SectionLabel>Other Sections</SectionLabel>
          </div>
          {otherBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className="pb-props__other-row"
              onClick={() => setSelectedBlockId(block.id)}
            >
              <span className="pb-props__other-type">{block.type}</span>
              <span className="pb-props__other-cta">Edit →</span>
            </button>
          ))}
        </div>
      )}

            {blocks.length === 0 && (
              <div className="pb-props__empty">
                <Empty description="Add blocks to start editing" />
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
