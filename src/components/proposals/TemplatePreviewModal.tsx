'use client';

import React from 'react';
import { Modal, Button } from 'antd';
import {
  CloseOutlined, EditOutlined, ArrowRightOutlined, BlockOutlined,
  IdcardOutlined, FileTextOutlined, ProfileOutlined, DollarOutlined,
  UnorderedListOutlined, ClockCircleOutlined, HighlightOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { resolveTheme } from './themePresets';
import type { LibraryTemplate } from '@/store/proposalLibraryStore';

const BLOCK_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cover:     { label: 'Cover',     icon: <IdcardOutlined />,        color: '#3B82F6' },
  text:      { label: 'Text',      icon: <FileTextOutlined />,      color: '#64748b' },
  section:   { label: 'Section',   icon: <ProfileOutlined />,       color: '#64748b' },
  pricing:   { label: 'Pricing',   icon: <DollarOutlined />,        color: '#059669' },
  scope:     { label: 'Scope',     icon: <UnorderedListOutlined />, color: '#7c3aed' },
  timeline:  { label: 'Timeline',  icon: <ClockCircleOutlined />,   color: '#d97706' },
  signature: { label: 'Signature', icon: <HighlightOutlined />,     color: '#db2777' },
  component: { label: 'Component', icon: <AppstoreOutlined />,      color: '#6366f1' },
};
const metaFor = (type: string) => BLOCK_META[type] || { label: type || 'Block', icon: <BlockOutlined />, color: '#64748b' };
const blockLabel = (b: any): string => (b?.data?.heading || b?.data?.title || metaFor(b?.type).label);

export interface TemplatePreviewModalProps {
  open: boolean;
  template: LibraryTemplate | null;
  canEdit?: boolean;
  canUse?: boolean;
  onClose: () => void;
  onEdit: (t: LibraryTemplate) => void;
  onUse: (t: LibraryTemplate) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  open, template, canEdit, canUse, onClose, onEdit, onUse,
}) => {
  const theme = template ? resolveTheme(template.themeId) : null;
  const blocks = template?.blocks?.length ? template.blocks : [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={560}
      destroyOnClose
      className="tplprev-modal"
      styles={{ content: { padding: 0, overflow: 'hidden', borderRadius: 18 } }}
    >
      {template && (
        <div className="tplprev">
          {/* Header */}
          <div className="tplprev__head">
            <div className="tplprev__avatar" style={{ background: theme ? `linear-gradient(135deg, ${theme.from}, ${theme.to})` : '#3B82F6' }}>
              <BlockOutlined />
            </div>
            <div className="tplprev__headtext">
              <div className="tplprev__title">{template.name}</div>
              <div className="tplprev__sub">{template.description || 'Template preview'}</div>
            </div>
            <button type="button" className="tplprev__close" onClick={onClose} aria-label="Close"><CloseOutlined /></button>
          </div>

          {/* Meta pills */}
          <div className="tplprev__meta">
            <span className="tplprev__pill">
              <span className="tplprev__pill-ic" style={{ background: 'rgba(37,99,235,0.10)', color: '#2563eb' }}><BlockOutlined /></span>
              <strong>{blocks.length}</strong>&nbsp;{blocks.length === 1 ? 'block' : 'blocks'}
            </span>
            {theme && (
              <span className="tplprev__pill">
                <span className="tplprev__swatch" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }} />
                {theme.label}
              </span>
            )}
            <span className="tplprev__pill">
              Updated&nbsp;<strong>{template.updatedAt ? dayjs(template.updatedAt).format('MMM D, YYYY') : '—'}</strong>
            </span>
          </div>

          {/* Block timeline */}
          <div className="tplprev__body">
            {blocks.length === 0 ? (
              <div className="tplprev__empty">This template has no saved layout.</div>
            ) : (
              <div className="tplprev__list">
                {blocks.map((b: any, idx: number) => {
                  const m = metaFor(b?.type);
                  return (
                    <div key={b.id || idx} className="tplprev__row">
                      <span className="tplprev__idx">{idx + 1}</span>
                      <span className="tplprev__row-ic" style={{ background: `${m.color}1a`, color: m.color }}>{m.icon}</span>
                      <div className="tplprev__row-text">
                        <div className="tplprev__row-name">{blockLabel(b)}</div>
                        <div className="tplprev__row-type">{m.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="tplprev__foot">
            <Button onClick={onClose} className="tplprev__btn">Close</Button>
            <div className="tplprev__foot-right">
              {canEdit && <Button icon={<EditOutlined />} onClick={() => onEdit(template)} className="tplprev__btn">Edit</Button>}
              {canUse && <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => onUse(template)} className="tplprev__cta">Use Template</Button>}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .tplprev { display: flex; flex-direction: column; max-height: 82vh; }

        .tplprev__head {
          display: flex; align-items: center; gap: 13px;
          padding: 20px 22px 18px; border-bottom: 1px solid var(--border-color);
        }
        .tplprev__avatar {
          flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; color: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .tplprev__headtext { flex: 1; min-width: 0; }
        .tplprev__title { font-size: 16.5px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tplprev__sub { font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tplprev__close {
          flex-shrink: 0; border: none; background: transparent; width: 30px; height: 30px; border-radius: 8px;
          color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background .15s ease, color .15s ease;
        }
        .tplprev__close:hover { background: rgba(127,127,127,0.14); color: var(--text-primary); }

        .tplprev__meta { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 22px 6px; }
        .tplprev__pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 11px 5px 6px; border-radius: 999px;
          border: 1px solid var(--border-color); background: transparent;
          font-size: 12px; font-weight: 600; color: var(--text-secondary);
        }
        .tplprev__pill strong { color: var(--text-primary); }
        .tplprev__pill-ic { width: 20px; height: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
        .tplprev__swatch { width: 16px; height: 16px; border-radius: 5px; margin-right: 3px; box-shadow: inset 0 0 0 1px rgba(127,127,127,0.25); }

        .tplprev__body { padding: 10px 22px 4px; overflow-y: auto; }
        .tplprev__empty { color: var(--text-secondary); font-size: 13px; padding: 24px 0; text-align: center; }
        .tplprev__list { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 4px 0 8px; }
        .tplprev__list::before {
          content: ''; position: absolute; left: 13px; top: 12px; bottom: 12px; width: 2px;
          background: var(--border-color); border-radius: 2px; z-index: 0;
        }
        .tplprev__row {
          position: relative; z-index: 1; display: flex; align-items: center; gap: 11px;
          padding: 9px 11px; border-radius: 11px; border: 1px solid var(--border-color);
          background: var(--bg-secondary); transition: border-color .15s ease, transform .12s ease;
        }
        .tplprev__row:hover { border-color: rgba(59,130,246,0.45); transform: translateX(2px); }
        .tplprev__idx {
          flex-shrink: 0; width: 18px; height: 18px; border-radius: 6px; font-size: 10.5px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-primary); color: var(--text-secondary);
          box-shadow: 0 0 0 3px var(--bg-secondary);
        }
        .tplprev__row-ic { flex-shrink: 0; width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .tplprev__row-text { flex: 1; min-width: 0; }
        .tplprev__row-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tplprev__row-type { font-size: 11.5px; color: var(--text-secondary); margin-top: 1px; }

        .tplprev__foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 22px; margin-top: 10px; border-top: 1px solid var(--border-color);
        }
        .tplprev__foot-right { display: flex; gap: 10px; }
        .tplprev-modal .tplprev__btn { border-radius: 10px; height: 38px; font-weight: 600; }
        .tplprev-modal .tplprev__cta { border-radius: 10px; height: 38px; font-weight: 600; padding: 0 18px; }
      `}</style>
    </Modal>
  );
};

export default TemplatePreviewModal;
