'use client';

import React from 'react';
import { Modal, Input, Button } from 'antd';
import { CloseOutlined, BlockOutlined, FontColorsOutlined, CheckCircleFilled } from '@ant-design/icons';
import { LayoutTemplate } from 'lucide-react';
import { resolveTheme, resolveFont } from './themePresets';

export interface SaveAsTemplateModalProps {
  open: boolean;
  /** Visual variant — affects default copy + primary button label. */
  variant?: 'create' | 'edit' | 'save';
  title?: string;
  subtitle?: string;
  okText?: string;
  /** Number of composed blocks (sections + components) being saved. */
  blockCount: number;
  themeId?: string;
  fontId?: string;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  saving?: boolean;
  onCancel: () => void;
  onSave: () => void;
}

const COPY = {
  create: { title: 'Create Template', subtitle: 'Turn this layout into a reusable starting point.', ok: 'Create Template' },
  edit:   { title: 'Save Template',   subtitle: 'Update this reusable template.',                   ok: 'Save Template' },
  save:   { title: 'Save as Template', subtitle: 'Reuse this layout to start future proposals in seconds.', ok: 'Save as Template' },
};

export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  open, variant = 'save', title, subtitle, okText,
  blockCount, themeId, fontId, name, onNameChange, description, onDescriptionChange,
  saving, onCancel, onSave,
}) => {
  const copy = COPY[variant];
  const theme = themeId ? resolveTheme(themeId) : null;
  const font = fontId ? resolveFont(fontId) : null;
  const canSave = name.trim().length > 0 && blockCount > 0;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      centered
      width={508}
      destroyOnClose
      maskClosable={!saving}
      className="tplsave-modal"
      styles={{ content: { padding: 0, overflow: 'hidden', borderRadius: 18 } }}
    >
      <div className="tplsave">
        {/* Header */}
        <div className="tplsave__head">
          <div className="tplsave__badge"><LayoutTemplate size={20} strokeWidth={2.2} /></div>
          <div className="tplsave__headtext">
            <div className="tplsave__title">{title || copy.title}</div>
            <div className="tplsave__sub">{subtitle || copy.subtitle}</div>
          </div>
          <button type="button" className="tplsave__close" onClick={onCancel} aria-label="Close" disabled={saving}>
            <CloseOutlined />
          </button>
        </div>

        {/* Summary pills */}
        <div className="tplsave__summary">
          <div className="tplsave__pill">
            <span className="tplsave__pill-ic" style={{ background: 'rgba(37,99,235,0.10)', color: '#2563eb' }}><BlockOutlined /></span>
            <span><strong>{blockCount}</strong> {blockCount === 1 ? 'block' : 'blocks'}</span>
          </div>
          {theme && (
            <div className="tplsave__pill">
              <span className="tplsave__swatch" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }} />
              <span>{theme.label}</span>
            </div>
          )}
          {font && (
            <div className="tplsave__pill">
              <span className="tplsave__pill-ic" style={{ background: 'rgba(100,116,139,0.10)', color: '#475569' }}><FontColorsOutlined /></span>
              <span>{font.label}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="tplsave__body">
          <div className="tplsave__field">
            <label className="tplsave__label">Template name <span className="tplsave__req">*</span></label>
            <Input
              size="large"
              placeholder="e.g. SaaS Onboarding Proposal"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={120}
              autoFocus
              onPressEnter={() => canSave && !saving && onSave()}
            />
          </div>
          <div className="tplsave__field">
            <label className="tplsave__label">Description <span className="tplsave__opt">Optional</span></label>
            <Input.TextArea
              placeholder="A short note on when to reach for this template…"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={300}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="tplsave__foot">
          <div className="tplsave__hint">
            <CheckCircleFilled style={{ color: '#10b981' }} /> Saved to your Template Library
          </div>
          <div className="tplsave__actions">
            <Button onClick={onCancel} disabled={saving} className="tplsave__cancel">Cancel</Button>
            <Button
              type="primary"
              onClick={onSave}
              loading={saving}
              disabled={!canSave}
              className="tplsave__cta"
            >
              {okText || copy.ok}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tplsave { display: flex; flex-direction: column; }

        /* Header — flat, follows the themed modal surface */
        .tplsave__head {
          display: flex; align-items: center; gap: 13px;
          padding: 20px 22px 18px;
          border-bottom: 1px solid var(--border-color);
        }
        .tplsave__badge {
          flex-shrink: 0; width: 40px; height: 40px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(59,130,246,0.12); color: #3B82F6;
        }
        .tplsave__headtext { flex: 1; min-width: 0; }
        .tplsave__title { font-size: 16.5px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; line-height: 1.2; }
        .tplsave__sub { font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; line-height: 1.35; }
        .tplsave__close {
          flex-shrink: 0; border: none; background: transparent;
          width: 30px; height: 30px; border-radius: 8px; color: var(--text-secondary); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: background .15s ease, color .15s ease;
        }
        .tplsave__close:hover:not(:disabled) { background: rgba(127,127,127,0.14); color: var(--text-primary); }
        .tplsave__close:disabled { opacity: .5; cursor: not-allowed; }

        .tplsave__summary { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 22px 4px; }
        .tplsave__pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 11px 5px 6px; border-radius: 999px;
          background: transparent; border: 1px solid var(--border-color);
          font-size: 12.5px; font-weight: 600; color: var(--text-secondary);
        }
        .tplsave__pill strong { color: var(--text-primary); }
        .tplsave__pill-ic { width: 20px; height: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
        .tplsave__swatch { width: 18px; height: 18px; border-radius: 6px; box-shadow: inset 0 0 0 1px rgba(127,127,127,0.25); }

        .tplsave__body { padding: 14px 22px 4px; display: flex; flex-direction: column; gap: 14px; }
        .tplsave__field { display: flex; flex-direction: column; gap: 6px; }
        .tplsave__label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
        .tplsave__req { color: #ef4444; }
        .tplsave__opt { font-size: 11px; font-weight: 500; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0px 7px; border-radius: 999px; }
        .tplsave-modal .tplsave__field .ant-input,
        .tplsave-modal .tplsave__field .ant-input-affix-wrapper,
        .tplsave-modal .tplsave__field textarea.ant-input { border-radius: 10px; }

        .tplsave__foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 22px; margin-top: 12px;
          border-top: 1px solid var(--border-color);
        }
        .tplsave__hint { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-secondary); font-weight: 500; }
        .tplsave__actions { display: flex; align-items: center; gap: 10px; }
        .tplsave-modal .tplsave__cancel { border-radius: 10px; height: 38px; font-weight: 600; }
        .tplsave-modal .tplsave__cta { border-radius: 10px; height: 38px; font-weight: 600; padding: 0 20px; }

        @media (max-width: 560px) {
          .tplsave__foot { flex-direction: column; align-items: stretch; }
          .tplsave__actions { justify-content: flex-end; }
        }
      `}</style>
    </Modal>
  );
};

export default SaveAsTemplateModal;
