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
import { ArrowLeft, Eye, EyeOff, FileText, Globe, KeyRound, Plus, Save, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Modal, Input } from 'antd';
import { message } from '@/providers/AntdGlobalProvider';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import AgreementContentEditor, {
  AgreementContentEditorRef,
} from '@/components/project-agreements/AgreementContentEditor';
import DocumentPreview from '@/components/project-agreements/DocumentPreview';
import { usePermission } from '@/hooks/usePermission';
import PasswordUnlockModal from '@/components/project-agreements/PasswordUnlockModal';
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
  getLockScope,
  isPasswordLockError,
  unlockTemplate,
  getSecuritySettings,
  PasswordProtectionMode,
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
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'INHERIT_TENANT' | 'CUSTOM' | 'NONE'>('INHERIT_TENANT');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [fieldMeta, setFieldMeta] = useState<Record<string, TemplatePlaceholder>>({});

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [tenantSecurityMode, setTenantSecurityMode] = useState<PasswordProtectionMode | null>(null);

  const readOnly = savedId
    ? !perms.canUpdateAgreementTemplate
    : !perms.canCreateAgreementTemplate;

  useEffect(() => {
    // activeOnly: a retired kind stays on the templates citing it but is not
    // offered for a new one.
    ProjectAgreementsService.listDocumentTypes({ activeOnly: true })
      .then(setDocumentTypes)
      .catch((e: any) => message.error(e?.message || 'Could not load document types'));

    ProjectAgreementsService.getBranding()
      .then(setBranding)
      .catch(() => {
        // Decoration only — a missing letterhead must not stop authoring.
      });

    getSecuritySettings()
      .then((sec) => {
        setTenantSecurityMode(sec.passwordProtectionMode);
        if (sec.passwordProtectionMode === 'PER_AGREEMENT') {
          setPasswordMode('CUSTOM');
        } else if (sec.passwordProtectionMode === 'TENANT_GLOBAL') {
          setPasswordMode('INHERIT_TENANT');
        }
      })
      .catch(() => {});
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

  const [isLocked, setIsLocked] = useState(false);
  const [lockScope, setLockScope] = useState<'TENANT' | 'AGREEMENT' | 'TEMPLATE'>('TENANT');

  const loadTemplate = (id: string) => {
    setLoading(true);
    setIsLocked(false);
    ProjectAgreementsService.getTemplate(id)
      .then((t: AgreementTemplate) => {
        setName(t.name);
        setCategory(t.category ?? '');
        setDocumentTypeId(t.documentTypeId ?? '');
        setDescription(t.description ?? '');
        setBodyHtml(t.bodyHtml);
        setStatus(t.status);
        setVersion(t.version);
        setIsPasswordProtected(t.isPasswordProtected ?? false);
        setPasswordMode(t.passwordMode ?? 'INHERIT_TENANT');
        setFieldMeta(Object.fromEntries(t.placeholders.map((p) => [p.key, p])));
      })
      .catch((e: any) => {
        if (isPasswordLockError(e)) {
          setIsLocked(true);
          setLockScope(getLockScope(e));
        } else {
          message.error(e?.message || 'Could not load that template');
          router.replace('/project-agreements/templates');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!templateId) return;
    loadTemplate(templateId);
  }, [templateId, router]);

  const handleUnlock = async (password: string) => {
    if (!templateId) return;
    const result = await unlockTemplate(templateId, password);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`pa_unlock_${templateId}`, result.unlockToken);
    }
    loadTemplate(templateId);
  };

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

  const openAddFieldModal = () => {
    setNewFieldName('');
    setAddFieldModalOpen(true);
  };

  const handleAddFieldSubmit = () => {
    const raw = newFieldName.trim();
    if (!raw) {
      message.error('Please enter a field name');
      return;
    }
    const key = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]+/, '');
    if (!key) {
      message.error('That is not a usable field name. Use lowercase letters, numbers, or underscores.');
      return;
    }
    insertToken(key);
    setNewFieldName('');
    setAddFieldModalOpen(false);
  };

  const payload = (nextStatus: TemplateStatus): TemplatePayload => ({
    name: name.trim(),
    documentTypeId,
    category: category.trim() || null,
    description: description.trim() || null,
    bodyHtml,
    status: nextStatus,
    isPasswordProtected,
    passwordMode,
    customPassword: customPassword.trim() || undefined,
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
      message.error('Give the template a name');
      return;
    }
    if (!documentTypeId) {
      message.error('Pick the type of document');
      return;
    }
    if (!bodyHtml.replace(/<[^>]*>/g, '').trim()) {
      message.error('The template has no wording yet');
      return;
    }
    if (isPasswordProtected && passwordMode === 'CUSTOM' && !savedId && !customPassword.trim()) {
      message.error('Please enter a custom password or switch to Global Company Password');
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
      message.success(nextStatus === 'published' ? 'Template published' : 'Template saved');

      if (!savedId) {
        // Put the new id in the URL so a refresh reopens the same template
        // rather than a blank builder.
        router.replace(`/project-agreements/templates/builder?id=${saved.id}`);
      }
    } catch (err: any) {
      message.error(err?.message || 'Could not save this template');
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
      message.error(err?.message || 'Could not render the preview');
      setPreviewOpen(false);
    }
  };

  if (isLocked) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <PasswordUnlockModal
          open={isLocked}
          documentTitle={name || 'Template'}
          scope={lockScope}
          onUnlock={handleUnlock}
          onCancel={() => {
            setIsLocked(false);
            router.replace('/project-agreements/templates');
          }}
        />
      </div>
    );
  }

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
      <div className="tl-filter-row pa-builder-meta" style={{ gap: 16, alignItems: 'flex-start', padding: '12px 16px' }}>
        <div className="pa-field pa-builder-meta-field" style={{ minWidth: 220 }}>
          <span className="pa-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <FileText size={14} style={{ color: '#2563eb' }} />
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
            width={280}
          />
        </div>
        <div className="pa-field pa-builder-meta-field" style={{ flex: 1, minWidth: 240 }}>
          <span className="pa-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            Document name <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input
            className="pa-input"
            value={name}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '');
              setName(val);
            }}
            placeholder="e.g. Standard Statement of Work"
            disabled={readOnly}
            style={{ height: 38, borderRadius: 8, fontSize: 13, fontWeight: 500 }}
          />
        </div>
        <div className="pa-field pa-builder-meta-field" style={{ minWidth: 260 }}>
          <span className="pa-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <ShieldCheck size={14} style={{ color: isPasswordProtected ? '#2563eb' : '#64748b' }} />
            Password Protection
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: readOnly ? 'default' : 'pointer' }}>
              <input
                type="checkbox"
                checked={isPasswordProtected}
                disabled={readOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsPasswordProtected(checked);
                  if (checked) {
                    if (tenantSecurityMode === 'PER_AGREEMENT') {
                      setPasswordMode('CUSTOM');
                    } else if (tenantSecurityMode === 'TENANT_GLOBAL') {
                      setPasswordMode('INHERIT_TENANT');
                    } else if (!passwordMode) {
                      setPasswordMode('INHERIT_TENANT');
                    }
                  }
                }}
                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Enable</span>
            </label>
            {isPasswordProtected && (
              <SearchableDropdown
                value={passwordMode}
                onChange={(v: any) => setPasswordMode(v ?? (tenantSecurityMode === 'PER_AGREEMENT' ? 'CUSTOM' : 'INHERIT_TENANT'))}
                options={
                  tenantSecurityMode === 'PER_AGREEMENT'
                    ? [{ value: 'CUSTOM', label: 'Custom Password' }]
                    : tenantSecurityMode === 'TENANT_GLOBAL'
                    ? [{ value: 'INHERIT_TENANT', label: 'Global Company Password' }]
                    : [
                        { value: 'INHERIT_TENANT', label: 'Global Company Password' },
                        { value: 'CUSTOM', label: 'Custom Password' },
                      ]
                }
                hideAvatar
                allowClear={false}
                disabled={readOnly}
                width={190}
              />
            )}
          </div>
        </div>
        {isPasswordProtected && passwordMode === 'CUSTOM' && (
          <div className="pa-field pa-builder-meta-field" style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span className="pa-label" style={{ margin: 0, fontWeight: 600 }}>Custom Password</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
                    let p = '';
                    for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                    setCustomPassword(p);
                    setShowCustomPassword(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: 0,
                  }}
                  title="Generate random password"
                >
                  <Sparkles size={12} /> Auto
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showCustomPassword ? 'text' : 'password'}
                className="pa-input"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder={savedId ? '(Unchanged)' : 'Enter password'}
                disabled={readOnly}
                style={{ height: 38, borderRadius: 8, paddingRight: 36, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={() => setShowCustomPassword(!showCustomPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: 0,
                  display: 'flex',
                }}
                title={showCustomPassword ? 'Hide password' : 'Show password'}
              >
                {showCustomPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}
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
                <button type="button" className="pa-btn" onClick={openAddFieldModal}>
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

          <section className="pa-card">
            <div className="pa-card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="pa-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} style={{ color: isPasswordProtected ? '#2563eb' : '#64748b' }} />
                Security & Password Protection
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: isPasswordProtected
                    ? passwordMode === 'CUSTOM'
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(148, 163, 184, 0.15)',
                  color: isPasswordProtected
                    ? passwordMode === 'CUSTOM'
                      ? '#22c55e'
                      : '#3b82f6'
                    : 'var(--text-slate-500, #64748b)',
                  border: isPasswordProtected
                    ? passwordMode === 'CUSTOM'
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                {isPasswordProtected
                  ? passwordMode === 'CUSTOM'
                    ? 'Custom Lock'
                    : 'Global Lock'
                  : 'Unprotected'}
              </span>
            </div>
            <div className="pa-card-body" style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: readOnly ? 'default' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPasswordProtected}
                  disabled={readOnly}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsPasswordProtected(checked);
                    if (checked) {
                      if (tenantSecurityMode === 'PER_AGREEMENT') {
                        setPasswordMode('CUSTOM');
                      } else if (tenantSecurityMode === 'TENANT_GLOBAL') {
                        setPasswordMode('INHERIT_TENANT');
                      } else if (!passwordMode) {
                        setPasswordMode('INHERIT_TENANT');
                      }
                    }
                  }}
                  style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                />
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-slate-900, #1e293b)' }}>
                  Require Password Protection
                </span>
              </label>
              <span className="pa-hint" style={{ marginTop: -8 }}>
                Locks opening or creating agreements from this template behind a password prompt.
              </span>

              {isPasswordProtected && (
                <div
                  style={{
                    display: 'grid',
                    gap: 14,
                    marginTop: 4,
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <div className="pa-field">
                    <span className="pa-label">Protection Mode</span>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          tenantSecurityMode === 'PER_AGREEMENT' || tenantSecurityMode === 'TENANT_GLOBAL'
                            ? '1fr'
                            : '1fr 1fr',
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      {tenantSecurityMode !== 'PER_AGREEMENT' && (
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => setPasswordMode('INHERIT_TENANT')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: passwordMode === 'INHERIT_TENANT' ? '2px solid #2563eb' : '1px solid var(--border-slate-300, #cbd5e1)',
                            backgroundColor: passwordMode === 'INHERIT_TENANT' ? 'var(--bg-pure-white, rgba(37, 99, 235, 0.12))' : 'transparent',
                            cursor: readOnly ? 'default' : 'pointer',
                            fontWeight: passwordMode === 'INHERIT_TENANT' ? 600 : 500,
                            fontSize: 12,
                            color: passwordMode === 'INHERIT_TENANT' ? '#3b82f6' : 'var(--text-slate-700, #475569)',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Globe size={16} color={passwordMode === 'INHERIT_TENANT' ? '#3b82f6' : 'var(--text-slate-400, #64748b)'} />
                          <div>
                            <div>Global Company Password</div>
                            <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-slate-400, #64748b)' }}>
                              Uses tenant key
                            </div>
                          </div>
                        </button>
                      )}

                      {tenantSecurityMode !== 'TENANT_GLOBAL' && (
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => setPasswordMode('CUSTOM')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: passwordMode === 'CUSTOM' ? '2px solid #2563eb' : '1px solid var(--border-slate-300, #cbd5e1)',
                            backgroundColor: passwordMode === 'CUSTOM' ? 'var(--bg-pure-white, rgba(37, 99, 235, 0.12))' : 'transparent',
                            cursor: readOnly ? 'default' : 'pointer',
                            fontWeight: passwordMode === 'CUSTOM' ? 600 : 500,
                            fontSize: 12,
                            color: passwordMode === 'CUSTOM' ? '#3b82f6' : 'var(--text-slate-700, #475569)',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <KeyRound size={16} color={passwordMode === 'CUSTOM' ? '#3b82f6' : 'var(--text-slate-400, #64748b)'} />
                          <div>
                            <div>Custom Password</div>
                            <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-slate-400, #64748b)' }}>
                              Unique password
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {passwordMode === 'CUSTOM' && (
                    <div className="pa-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className="pa-label" style={{ margin: 0 }}>Set Custom Password</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
                              let p = '';
                              for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                              setCustomPassword(p);
                              setShowCustomPassword(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: 0,
                            }}
                          >
                            <Sparkles size={12} /> Auto-generate
                          </button>
                        )}
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCustomPassword ? 'text' : 'password'}
                          className="pa-input"
                          value={customPassword}
                          onChange={(e) => setCustomPassword(e.target.value)}
                          placeholder={savedId ? '(Leave blank to keep existing password)' : 'Enter custom password'}
                          disabled={readOnly}
                          style={{ paddingRight: 36 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomPassword(!showCustomPassword)}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: 0,
                            display: 'flex',
                          }}
                          title={showCustomPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCustomPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <span className="pa-hint">Min 6 characters recommended. Unique to this template.</span>
                    </div>
                  )}
                </div>
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

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: '#0f172a' }} />
            <span>Add Fill-in Field</span>
          </div>
        }
        open={addFieldModalOpen}
        onOk={handleAddFieldSubmit}
        onCancel={() => setAddFieldModalOpen(false)}
        okText="Insert Field"
        cancelText="Cancel"
        destroyOnClose
        centered
        width={440}
      >
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
            Define a unique field key. Fill-in fields are completed when generating an agreement from this template.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Field Name / Key
            </label>
            <Input
              autoFocus
              placeholder="e.g. contract_value, payment_terms, start_date"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onPressEnter={handleAddFieldSubmit}
            />
          </div>
          {newFieldName.trim() && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Inserted Token: </span>
              <code style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', background: '#e2e8f0', padding: '2px 8px', borderRadius: 4 }}>
                {`{{${newFieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]+/, '') || 'field_key'}}}`}
              </code>
            </div>
          )}
        </div>
      </Modal>

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
          .pa-builder {
            display: flex; flex-direction: column;
            overflow-y: auto; overflow-x: hidden;
          }
          .pa-builder > .pa-editor-pane { flex: none; min-height: 70vh; order: 2; border-top: 1px solid var(--border-slate-200); }
          .pa-builder-side { flex: none; overflow-y: visible; order: 1; }
          .pa-builder-meta { flex-wrap: wrap; }
          .pa-builder-meta-field:last-child { max-width: none; }
        }
      `}</style>
    </>
  );
}
