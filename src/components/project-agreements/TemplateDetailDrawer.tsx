'use client';

/**
 * One template, in a drawer over the list — the same arrangement the agreement
 * drawer uses, for the same reason: deciding which template to raise a
 * contract from means reading two or three of them, and a full page round trip
 * between each loses the list you were working through.
 *
 * WHAT IS RENDERED IS THE TEMPLATE, TOKENS AND ALL. The server substitutes an
 * unanswered {{token}} with a blank rule, so a preview here shows the shape of
 * the document and where its gaps are — which is exactly what you want to see
 * before choosing it. It is not a filled-in contract, and should not pretend
 * to be.
 *
 * EDITING leaves the drawer for the builder, which needs the screen.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from 'antd';
import {
  Archive,
  CheckCircle2,
  Clock,
  Copy,
  FileSignature,
  Hash,
  Layers,
  Pencil,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import DocumentPreview from '@/components/project-agreements/DocumentPreview';
import {
  DetailNote,
  DetailRow,
  DetailSection,
} from '@/components/project-agreements/detailChrome';
import { usePermission } from '@/hooks/usePermission';
import {
  AgreementTemplate,
  ProjectAgreementsService,
  TEMPLATE_STATUS_META,
  TemplateStatus,
} from '@/services/projectAgreementsService';

interface Props {
  /** The template to show. null closes the drawer. */
  id: string | null;
  onClose: () => void;
  /** Fired when the record changed under the list — a status flip. */
  onChanged?: () => void;
}

export default function TemplateDetailDrawer({ id, onClose, onChanged }: Props) {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (templateId: string) => {
      setLoading(true);
      try {
        const record = await ProjectAgreementsService.getTemplate(templateId);
        setTemplate(record);
        // HTML rather than a PDF: a template is read for its wording, and the
        // continuous sheet renders in a fraction of the time the printer takes.
        setHtml(
          await ProjectAgreementsService.previewAgreement({
            templateId: record.id,
            title: record.name,
            bodyHtml: record.bodyHtml,
            values: {},
            // NO SIGN-OFF on a template. The block names who signs and for
            // which company, and a template knows neither — printing an empty
            // one suggests the wording ends there when it does not.
            showSignatures: false,
          })
        );
      } catch (err: any) {
        toast.error(err?.message || 'Could not load that template');
        onClose();
      } finally {
        setLoading(false);
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!id) {
      setTemplate(null);
      setHtml('');
      return;
    }
    load(id);
  }, [id, load]);

  const setStatus = async (next: TemplateStatus) => {
    if (!template) return;
    setBusy(true);
    try {
      const updated = await ProjectAgreementsService.setTemplateStatus(template.id, next);
      setTemplate({ ...template, ...updated });
      toast.success(next === 'published' ? 'Template published' : `Template moved to ${next}`);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Could not change the status');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const copy = await ProjectAgreementsService.duplicateTemplate(template.id);
      toast.success('Template duplicated');
      router.push(`/project-agreements/templates/builder?id=${copy.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not duplicate that template');
    } finally {
      setBusy(false);
    }
  };

  const meta = template ? TEMPLATE_STATUS_META[template.status] : null;
  const required = template?.placeholders.filter((p) => p.required).length ?? 0;

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      placement="right"
      width="min(1180px, 95vw)"
      closable={false}
      destroyOnHidden
      rootClassName="pa-drawer"
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      title={null}
    >
      <div className="pa-header">
        <div className="pa-header-about">
          <button
            type="button"
            className="pa-btn"
            style={{ width: 32, padding: 0, justifyContent: 'center' }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={15} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="pa-header-title">{template?.name || 'Template'}</div>
            <div className="pa-header-sub">
              {template
                ? [
                    template.documentTypeName || 'No type',
                    `Version ${template.version}`,
                    template.agreementCount
                      ? `${template.agreementCount} document${template.agreementCount === 1 ? '' : 's'}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : 'Loading…'}
            </div>
          </div>
        </div>

        {template && (
          <div className="pa-header-actions">
            {meta && (
              <span className="pa-chip" style={{ background: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
            )}
            {perms.canUpdateAgreementTemplate &&
              (template.status === 'published' ? (
                <button
                  type="button"
                  className="pa-btn"
                  onClick={() => setStatus('archived')}
                  disabled={busy}
                  title="Take it out of the composer"
                >
                  <Archive size={14} /> Archive
                </button>
              ) : (
                <button
                  type="button"
                  className="pa-btn pa-btn-success"
                  onClick={() => setStatus('published')}
                  disabled={busy}
                  title="Make it available in the composer"
                >
                  <CheckCircle2 size={14} /> Publish
                </button>
              ))}
            {perms.canCreateAgreementTemplate && (
              <button
                type="button"
                className="pa-btn"
                onClick={duplicate}
                disabled={busy}
                title="Start a new draft from this wording"
                aria-label="Duplicate"
                style={{ width: 32, padding: 0, justifyContent: 'center' }}
              >
                <Copy size={14} />
              </button>
            )}
            {perms.canUpdateAgreementTemplate && (
              <button
                type="button"
                className="pa-btn pa-btn-primary"
                onClick={() =>
                  router.push(`/project-agreements/templates/builder?id=${template.id}`)
                }
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        )}
      </div>

      {loading || !template ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <ZukvoLoader size="md" />
        </div>
      ) : (
        <div className="pa-detail">
          <aside className="pa-detail-side">
            <DetailSection title="Template">
              <DetailRow
                icon={<Layers size={13} />}
                label="Type"
                value={template.documentTypeName}
                sub={template.documentTypeCode}
              />
              <DetailRow
                icon={<Hash size={13} />}
                label="Version"
                value={`v${template.version}`}
                mono
              />
              <DetailRow
                icon={<FileSignature size={13} />}
                label="Raised from it"
                value={
                  template.agreementCount
                    ? `${template.agreementCount} agreement${template.agreementCount === 1 ? '' : 's'}`
                    : 'Not used yet'
                }
              />
              <DetailRow
                icon={<Clock size={13} />}
                label="Last updated"
                value={formatDate(template.updatedAt)}
              />
            </DetailSection>

            <DetailNote title="Description" text={template.description} />

            {/* The fields the composer will ask for, in the order it asks.
                This is the practical question about a template: how much work
                is raising one from it. */}
            <section className="pa-dt-section">
              <div className="pa-dt-section-title">
                Fill-in fields
                {template.placeholders.length > 0 && (
                  <span className="pa-dt-section-count">{template.placeholders.length}</span>
                )}
              </div>
              {template.placeholders.length === 0 ? (
                <p className="pa-dt-note">
                  None — everything it needs comes from the project and your letterhead.
                </p>
              ) : (
                <>
                  <div className="pa-token-list">
                    {template.placeholders.map((p) => (
                      <span
                        key={p.key}
                        className={`pa-token-chip ${p.required ? 'is-required' : ''}`}
                        title={`{{${p.key}}}${p.required ? ' · required' : ''}`}
                      >
                        {p.label}
                        {p.required && <b>*</b>}
                      </span>
                    ))}
                  </div>
                  {required > 0 && (
                    <span className="pa-dt-foot">
                      {required} required before a document leaves draft
                    </span>
                  )}
                </>
              )}
            </section>
          </aside>

          <DocumentPreview
            html={html}
            label="Wording"
            title={template.name}
            loading={loading}
            emptyHint="This template has no wording yet."
            fit="page"
          />
        </div>
      )}
    </Drawer>
  );
}

/** '' rather than an em-dash: DetailRow drops a row with nothing to say. */
function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
