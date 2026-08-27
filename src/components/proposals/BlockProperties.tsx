import NoData from "@/components/common/NoData";
import React, { useState } from 'react';
import { useProposalStore } from '@/store/proposalStore';
import { BlockSettingsRenderer } from './blocks';
import { Empty, Upload, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Building2, Layers, Palette, History, LayoutTemplate, Type as TypeIcon, DollarSign, PenLine, ListChecks, CalendarRange } from 'lucide-react';
import { AIEnhanceButton } from './AIEnhanceButton';
import { THEME_PRESETS, FONT_PRESETS } from './themePresets';

type PanelTab = 'content' | 'style' | 'ai';

const BLOCK_META: Record<string, { label: string; icon: React.ReactNode }> = {
  cover:     { label: 'Cover',     icon: <LayoutTemplate size={14} /> },
  text:      { label: 'Text',      icon: <TypeIcon size={14} /> },
  pricing:   { label: 'Pricing',   icon: <DollarSign size={14} /> },
  signature: { label: 'Signature', icon: <PenLine size={14} /> },
  scope:     { label: 'Scope',     icon: <ListChecks size={14} /> },
  timeline:  { label: 'Timeline',  icon: <CalendarRange size={14} /> },
  section:   { label: 'Section',   icon: <Layers size={14} /> },
};
const blockMeta = (t: string) => BLOCK_META[t] || { label: t, icon: <Layers size={14} /> };

const SectionLabel: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({ children, accent }) => (
  <span className="pb-section-label">
    {accent && <span className="pb-section-label__dot" />}
    {children}
  </span>
);

export const BlockProperties = () => {
  const { blocks, selectedBlockId, updateBlock, updateCoverData, setSelectedBlockId, documentTheme, setDocumentTheme } = useProposalStore();

  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [websiteError, setWebsiteError] = useState<string>('');

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('');
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError('Invalid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (val: string) => {
    if (!val) {
      setPhoneError('');
      return true;
    }
    const phoneRegex = /^[+]?[0-9\s\-()]{7,15}$/;
    if (!phoneRegex.test(val)) {
      setPhoneError('Invalid phone');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateWebsite = (val: string) => {
    if (!val) {
      setWebsiteError('');
      return true;
    }
    const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-./?%&=]*)?$/;
    if (!urlPattern.test(val)) {
      setWebsiteError('Invalid website URL');
      return false;
    }
    setWebsiteError('');
    return true;
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const otherBlocks = blocks.filter((b) => b.id !== selectedBlockId);
  const coverBlock = blocks.find((b) => b.type === 'cover');

  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!selectedBlockId) return;
    requestAnimationFrame(() => {
      // For the cover, keep the panel at the top so "Branding & Identity"
      // (rendered first) stays in view instead of jumping to the cover settings.
      const isCover = blocks.find((b) => b.id === selectedBlockId)?.type === 'cover';
      if (isCover && containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (activeRef.current && containerRef.current) {
        activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, [selectedBlockId]);

  const handleUpdateBranding = (data: any) => {
    updateCoverData(data);
  };

  return (
    <div ref={containerRef} className="no-scrollbar pb-props">
      {/* Main Content Panel (Always Visible) */}
      {(() => {
        const activeCard = selectedBlock && (
          <div key={selectedBlock.id} ref={activeRef} className="active-block-properties">
            <div className="pb-props__active-head">
              <div className="pb-props__active-title">
                <span className="pb-props__active-ic">{blockMeta(selectedBlock.type).icon}</span>
                <span>
                  <span className="pb-props__active-type">{blockMeta(selectedBlock.type).label}</span>
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

            </div>

            <div className="pb-props__brand-row">
              <div style={{ position: 'relative' }}>
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
                {coverBlock?.data?.logoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateBranding({ logoUrl: null });
                    }}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      padding: 0,
                      lineHeight: 1,
                      zIndex: 10,
                    }}
                    title="Remove Logo"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="pb-props__brand-org">
                <SectionLabel>Organization</SectionLabel>
                <Input
                  placeholder="Agency Name"
                  value={coverBlock?.data?.senderCompany}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    handleUpdateBranding({ senderCompany: cleanVal });
                  }}
                />
              </div>
            </div>

            <div className="pb-props__brand-contact">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <SectionLabel>Website URL</SectionLabel>
                <Input
                  placeholder="Website URL"
                  status={websiteError ? 'error' : undefined}
                  value={coverBlock?.data?.senderWebsite}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateBranding({ senderWebsite: val });
                    validateWebsite(val);
                  }}
                  onBlur={(e) => validateWebsite(e.target.value)}
                />
                {websiteError && <span style={{ fontSize: '10.5px', color: '#ff4d4f', fontWeight: 500 }}>{websiteError}</span>}
              </div>
              <div className="pb-props__brand-grid">
                <div>
                  <SectionLabel>Point of Contact</SectionLabel>
                  <Input
                    placeholder="Name"
                    value={coverBlock?.data?.senderName}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      handleUpdateBranding({ senderName: cleanVal });
                    }}
                  />
                </div>
                <div>
                  <SectionLabel>Position</SectionLabel>
                  <Input
                    placeholder="Position/Role"
                    value={coverBlock?.data?.senderPosition}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      handleUpdateBranding({ senderPosition: cleanVal });
                    }}
                  />
                </div>
              </div>
              <div className="pb-props__brand-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Input
                    placeholder="Phone"
                    status={phoneError ? 'error' : undefined}
                    value={coverBlock?.data?.senderContact}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateBranding({ senderContact: val });
                      validatePhone(val);
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                  />
                  {phoneError && <span style={{ fontSize: '10.5px', color: '#ff4d4f', fontWeight: 500 }}>{phoneError}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Input
                    placeholder="Email"
                    status={emailError ? 'error' : undefined}
                    value={coverBlock?.data?.senderEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateBranding({ senderEmail: val });
                      validateEmail(val);
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                  />
                  {emailError && <span style={{ fontSize: '10.5px', color: '#ff4d4f', fontWeight: 500 }}>{emailError}</span>}
                </div>
              </div>
              <div>
                <SectionLabel>Business Address</SectionLabel>
                <Input.TextArea
                  placeholder="Street, City, State, ZIP"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  value={coverBlock?.data?.senderAddress}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^a-zA-Z0-9\s\-.,()?!:;&'"]/g, '');
                    handleUpdateBranding({ senderAddress: cleanVal });
                  }}
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
            <span className="pb-props__others-count">{otherBlocks.length}</span>
          </div>
          {otherBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className="pb-props__other-row"
              onClick={() => setSelectedBlockId(block.id)}
            >
              <span className="pb-props__other-ic">{blockMeta(block.type).icon}</span>
              <span className="pb-props__other-type">{blockMeta(block.type).label}</span>
              <span className="pb-props__other-cta">Edit →</span>
            </button>
          ))}
        </div>
      )}

            {blocks.length === 0 && (
              <div className="pb-props__empty">
                <NoData description="Add blocks to start editing" />
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
