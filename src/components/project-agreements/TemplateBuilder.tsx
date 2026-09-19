'use client';

/**
 * The template builder — the composer's page, with the composer's A4 sheet.
 *
 * SAME SURFACE AS THE AGREEMENT, minus the form rail. A template is the
 * document before it has answers, so it is written on the same paper: the real
 * letterhead, the real page-break guides, the same editor. Authoring a
 * contract in a plain box and discovering its shape only at preview time is
 * how clauses end up straddling a page break nobody saw.
 *
 * The composer's left rail has nothing to say here — there is no project,
 * client or value yet — so the only two things a template needs of its own,
 * the document type and its name, sit in a meta bar under the header.
 *
 * PLACEHOLDERS ARE DERIVED FROM THE BODY, not maintained separately. Whatever
 * {{tokens}} the wording contains is exactly the set of fields the composer
 * will ask for — so an author cannot leave a field behind that nothing uses, or
 * type a token the composer never offers to fill. The panel on the right lets
 * you relabel and reorder what the body already references; it does not let you
 * invent a field the text does not mention.
 *
 * Tokens the server resolves on its own (project_*, company_*, today) are shown
 * as insertable chips rather than form fields, because the composer already
 * knows their answers.
 *
 * A template's DESCRIPTION is still stored and still shown in the list; it has
 * no input here on purpose, and an existing one is carried through a save
 * untouched rather than being blanked by its own absence.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, FileText, Plus, Save, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import AgreementContentEditor, {
  AgreementContentEditorRef,
} from '@/components/project-agreements/AgreementContentEditor';
import DocumentPreview from '@/components/project-agreements/DocumentPreview';
import { usePermission } from '@/hooks/usePermission';
import {
  AUTO_TOKENS,
  AgreementTemplate,
  Branding,
  DocumentType,
  ProjectAgreementsService,
  TemplatePayload,
  TemplatePlaceholder,
  TemplateStatus,
  humanise,
  manualTokensIn,
} from '@/services/projectAgreementsService';

interface Props {
  templateId?: string;
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Single line' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'currency', label: 'Currency' },
];

export default function TemplateBuilder({ templateId }: Props) {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;
  const editorRef = useRef<AgreementContentEditorRef>(null);

  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(templateId);

  const [name, setName] = useState('');
  /** The kind of document. Mandatory — this replaced the free-text category. */
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  /** The sheet draws the real letterhead, so the template looks like its output. */
  const [branding, setBranding] = useState<Branding | null>(null);
  /**
   * The category this template was created with, before Doc Types existed.
   * Carried through saves as provenance; never shown and never edited.
   */
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [status, setStatus] = useState<TemplateStatus>('draft');
  const [version, setVersion] = useState(1);
  const [fieldMeta, setFieldMeta] = useState<Record<string, TemplatePlaceholder>>({});

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const readOnly = savedId
    ? !perms.canUpdateAgreementTemplate
    : !perms.canCreateAgreementTemplate;

  useEffect(() => {
    // activeOnly: a retired kind stays on the templates citing it but is not
    // offered for a new one.
    ProjectAgreementsService.listDocumentTypes({ activeOnly: true })
      .then(setDocumentTypes)
      .catch((e: any) => toast.error(e?.message || 'Could not load document types'));

    ProjectAgreementsService.getBranding()
      .then(setBranding)
      .catch(() => {
        // Decoration only — a missing letterhead must not stop authoring.
      });
  }, []);

  const documentTypeOptions = useMemo(() => {
    const opts = documentTypes.map((t) => ({
      value: t.id,
      label: t.name,
      description: t.code,
    }));
    // A template already on a type since deactivated keeps it in its own picker.
    if (documentTypeId && !documentTypes.some((t) => t.id === documentTypeId)) {
      opts.unshift({
        value: documentTypeId,
        label: 'Current type',
        description: 'No longer offered',
      });
    }
    return opts;
  }, [documentTypes, documentTypeId]);

  useEffect(() => {
    if (!templateId) return;
    ProjectAgreementsService.getTemplate(templateId)
      .then((t: AgreementTemplate) => {
        setName(t.name);
        setCategory(t.category ?? '');
        setDocumentTypeId(t.documentTypeId ?? '');
        setDescription(t.description ?? '');
        setBodyHtml(t.bodyHtml);
        setStatus(t.status);
        setVersion(t.version);
        setFieldMeta(Object.fromEntries(t.placeholders.map((p) => [p.key, p])));
      })
      .catch((e: any) => {
        toast.error(e?.message || 'Could not load that template');
        router.replace('/project-agreements/templates');
      })
      .finally(() => setLoading(false));
  }, [templateId, router]);

  /** The fields the wording actually asks for, in the order it asks for them. */
  const fields: TemplatePlaceholder[] = useMemo(
    () =>
      manualTokensIn(bodyHtml).map((key, index) => {
        const existing = fieldMeta[key];
        return {
          key,
          label: existing?.label ?? humanise(key),
          dataType: existing?.dataType ?? 'text',
          source: existing?.source ?? 'manual',
          required: existing?.required ?? false,
          defaultValue: existing?.defaultValue ?? null,
          displayOrder: index,
        };
      }),
    [bodyHtml, fieldMeta]
  );

  const patchField = (key: string, patch: Partial<TemplatePlaceholder>) =>
    setFieldMeta((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? fields.find((f) => f.key === key)!), ...patch },
    }));

  const insertToken = (key: string) => {
    if (readOnly) return;
    editorRef.current?.insertTextAtCursor(`{{${key}}}`);
  };

  const addField = () => {
    const raw = window.prompt(
      'Field name — lowercase letters, numbers and underscores (e.g. contract_value)'
    );
    if (!raw) return;
    const key = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]+/, '');
    if (!key) {
      toast.error('That is not a usable field name');
      return;
    }
    insertToken(key);
  };

  const payload = (nextStatus: TemplateStatus): TemplatePayload => ({
    name: name.trim(),
    documentTypeId,
    category: category.trim() || null,
    description: description.trim() || null,
    bodyHtml,
    status: nextStatus,
    placeholders: fields.map(({ key, label, dataType, source, required, defaultValue, displayOrder }) => ({
      key,
      label,
      dataType,
      source,
      required,
      defaultValue,
      displayOrder,
    })),
  });

  const save = async (nextStatus: TemplateStatus) => {
    if (!name.trim()) {
      toast.error('Give the template a name');
      return;
    }
    if (!documentTypeId) {
      toast.error('Pick the type of document');
      return;
    }
    if (!bodyHtml.replace(/<[^>]*>/g, '').trim()) {
      toast.error('The template has no wording yet');
      return;
    }

    setSaving(true);
    try {
      const body = payload(nextStatus);
      const saved = savedId
        ? await ProjectAgreementsService.updateTemplate(savedId, body)
        : await ProjectAgreementsService.createTemplate(body);

      setSavedId(saved.id);
      setStatus(saved.status);
      setVersion(saved.version);
      setFieldMeta(Object.fromEntries(saved.placeholders.map((p) => [p.key, p])));
      toast.success(nextStatus === 'published' ? 'Template published' : 'Template saved');

      if (!savedId) {
        // Put the new id in the URL so a refresh reopens the same template
        // rather than a blank builder.
        router.replace(`/project-agreements/templates/builder?id=${saved.id}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not save this template');
    } finally {
      setSaving(false);
    }
  };

  const openPreview = async () => {
    try {
      setPreviewOpen(true);
      setPreviewHtml('');
      const html = await ProjectAgreementsService.previewAgreement({
        templateId: savedId ?? null,
        title: name || 'Untitled Agreement',
        bodyHtml,
        values: {},
        // A template has no signatories, so it prints no sign-off — see the
        // drawer for the reasoning.
        showSignatures: false,
      });
      setPreviewHtml(html);
    } catch (err: any) {
      toast.error(err?.message || 'Could not render the preview');
      setPreviewOpen(false);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ZukvoLoader size="md" />
      </div>
    );
  }

  return (
    <>
      <div className="pa-header">
        <div className="pa-header-about">
          <button
            type="button"
            className="pa-btn"
            style={{ width: 32, padding: 0, justifyContent: 'center' }}
            onClick={() => router.push('/project-agreements/templates')}
            aria-label="Back to templates"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="pa-header-title">{savedId ? name || 'Template' : 'New template'}</div>
            <div className="pa-header-sub">
              {savedId ? `Version ${version} · ${status}` : 'Draft — publish it to use it'}
            </div>
          </div>
        </div>
        <div className="pa-header-actions">
          <button type="button" className="pa-btn" onClick={openPreview}>
            <Eye size={14} /> Preview
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                className="pa-btn"
                onClick={() => save(status === 'published' ? 'published' : 'draft')}
                disabled={saving}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
              {status !== 'published' && (
                <button
                  type="button"
                  className="pa-btn pa-btn-success"
                  onClick={() => save('published')}
                  disabled={saving}
                >
                  <Send size={14} /> Publish
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* The only two things a template has of its own. Everything else the
          composer's rail asks for belongs to the document, not the template. */}
      <div className="tl-filter-row pa-builder-meta">
        <div className="pa-field pa-builder-meta-field">
          <span className="pa-label">
            Document type <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <SearchableDropdown
            value={documentTypeId}
            onChange={(v: any) => setDocumentTypeId(v ?? '')}
            options={documentTypeOptions}
            placeholder="What kind of document is this?"
            searchPlaceholder="Find a type"
            itemNoun="types"
            disabled={readOnly}
            width={320}
          />
        </div>
        <div className="pa-field pa-builder-meta-field">
          <span className="pa-label">
            Document name <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input
            className="pa-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Standard Statement of Work"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="pa-builder">
        <div className="pa-editor-pane">
          <div className="pa-preview-bar">
            <FileText size={13} />
            <span className="pa-preview-label">Wording</span>
            <span className="pa-preview-tools pa-editor-hint">
              A4 · letterhead repeats on every page
            </span>
          </div>
          <AgreementContentEditor
            ref={editorRef}
            value={bodyHtml}
            onChange={setBodyHtml}
            branding={branding}
            // The sheet's header shows what the document will be called. A
            // template has no document name of its own, so it borrows its own.
            documentTitle={name || 'Untitled template'}
            editable={!readOnly}
          />
        </div>

        <aside className="pa-builder-side">
          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Automatic tokens</div>
            </div>
            <div className="pa-card-body">
              <p className="pa-hint" style={{ marginTop: 0 }}>
                Filled in from the project and your letterhead — the composer never asks.
              </p>
              <div className="pa-token-row">
                {AUTO_TOKENS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className="pa-token"
                    onClick={() => insertToken(t.key)}
                    disabled={readOnly}
                    title={`Insert {{${t.key}}}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Fill-in fields</div>
              {!readOnly && (
                <button type="button" className="pa-btn" onClick={addField}>
                  <Plus size={13} /> Add
                </button>
              )}
            </div>
            <div className="pa-card-body" style={{ display: 'grid', gap: 12 }}>
              {fields.length === 0 ? (
                <p className="pa-hint" style={{ margin: 0 }}>
                  No fill-in fields yet. Add one to insert it at your cursor.
                </p>
              ) : (
                fields.map((f) => (
                  <div key={f.key} className="pa-field-row">
                    <code className="pa-field-key">{`{{${f.key}}}`}</code>
                    <input
                      className="pa-input"
                      value={f.label}
                      onChange={(e) => patchField(f.key, { label: e.target.value })}
                      placeholder="Label shown in the composer"
                      disabled={readOnly}
                    />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <SearchableDropdown
                        value={f.dataType}
                        onChange={(v: any) => patchField(f.key, { dataType: v })}
                        options={TYPE_OPTIONS}
                        hideAvatar
                        allowClear={false}
                        disabled={readOnly}
                        width={200}
                        style={{ flex: 1 }}
                      />
                      <label className="pa-required-toggle">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => patchField(f.key, { required: e.target.checked })}
                          disabled={readOnly}
                        />
                        Required
                      </label>
                    </div>
                    <input
                      className="pa-input"
                      value={f.defaultValue ?? ''}
                      onChange={(e) => patchField(f.key, { defaultValue: e.target.value || null })}
                      placeholder="Default value (optional)"
                      disabled={readOnly}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      {previewOpen && (
        <div className="pa-preview-modal" onClick={() => setPreviewOpen(false)}>
          <div className="pa-preview-modal-inner" onClick={(e) => e.stopPropagation()}>
            <DocumentPreview
              html={previewHtml}
              label="Template preview"
              title={name || 'Template preview'}
              loading={!previewHtml}
              emptyHint="Rendering the template…"
              actions={
                <button type="button" className="pa-btn" onClick={() => setPreviewOpen(false)}>
                  Close
                </button>
              }
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .pa-builder {
          flex: 1; min-height: 0;
          display: grid;
          grid-template-columns: 1fr minmax(300px, 360px);
        }
        /* Two controls on the band the list pages use for their filters, so the
           builder wears the same chrome as everything else in the module. */
        .pa-builder-meta { align-items: flex-end; gap: 14px; }
        .pa-builder-meta-field { min-width: 0; }
        .pa-builder-meta-field:last-child { flex: 1 1 260px; max-width: 420px; }
        .pa-builder-side {
          overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 14px;
          background: var(--bg-slate-50, #f8fafc);
        }
        .pa-token-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .pa-token {
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11.5px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .pa-token:hover:not(:disabled) { border-color: #bfdbfe; color: #3b82f6; }
        .pa-token:disabled { opacity: 0.5; cursor: not-allowed; }
        .pa-field-row {
          display: grid; gap: 8px;
          padding: 10px; border-radius: 10px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
        }
        .pa-field-key {
          font-size: 11px; font-weight: 700; color: #3b82f6;
          background: rgba(59,130,246,0.08);
          padding: 2px 7px; border-radius: 5px;
          justify-self: start;
        }
        .pa-required-toggle {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-600);
          white-space: nowrap; cursor: pointer;
        }
        .pa-preview-modal {
          position: fixed; inset: 0; z-index: 1200;
          background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .pa-preview-modal-inner {
          width: min(1000px, 100%); height: min(90vh, 100%);
          background: var(--bg-pure-white);
          border-radius: 12px; overflow: hidden;
          display: flex; flex-direction: column;
        }
        @media (max-width: 1100px) {
          .pa-builder { grid-template-columns: 1fr; }
          .pa-builder > .pa-editor-pane { min-height: 70vh; }
          .pa-builder-side { border-top: 1px solid var(--border-slate-200); }
          .pa-builder-meta { flex-wrap: wrap; }
          .pa-builder-meta-field:last-child { max-width: none; }
        }
      `}</style>
    </>
  );
}
