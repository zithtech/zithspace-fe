'use client';

/**
 * Letterhead — the header and footer every generated agreement wears.
 *
 * Header: the document's own name sits top-left (it comes from the document,
 * not from here); the logo, company name and tagline sit top-right, the tagline
 * under the name. Footer: phone · email · website.
 *
 * The preview is the SERVER's renderer over sample wording, for the same reason
 * the composer's is: a letterhead drawn twice is a letterhead that will drift.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Globe,
  Image as ImageIcon,
  PenLine,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import DocumentPreview from '@/components/project-agreements/DocumentPreview';
import { usePermission } from '@/hooks/usePermission';
import { Branding, ProjectAgreementsService } from '@/services/projectAgreementsService';

const EMPTY: Branding = {
  companyName: '',
  tagline: '',
  logoUrl: null,
  signatureUrl: null,
  phone: '',
  email: '',
  website: '',
  location: '',
  footerNote: '',
};

export default function LetterheadSettings() {
  const perms = usePermission() as unknown as Record<string, any>;
  const canEdit = Boolean(perms.canManageAgreements);
  const fileRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const [signUploading, setSignUploading] = useState(false);

  const [form, setForm] = useState<Branding>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(true);

  /**
   * The logo as the server last told us it was.
   *
   * A seeded logo is a base64 data URI, not a URL — 80KB of it in this tenant's
   * case. Posting that back on every save is pure waste, so `save()` sends
   * `logoUrl` only when it actually changed (i.e. the person pressed Remove);
   * the API treats an omitted field as "leave it alone".
   */
  const loadedLogo = useRef<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      setPreviewHtml(await ProjectAgreementsService.previewLetterhead());
    } catch {
      // A failed preview should not take the form down with it.
      setPreviewHtml('');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    ProjectAgreementsService.getBranding()
      .then((b) => {
        setForm({ ...EMPTY, ...b });
        loadedLogo.current = b.logoUrl ?? null;
      })
      .catch((e: any) => toast.error(e?.message || 'Could not load your letterhead'))
      .finally(() => setLoading(false));
    loadPreview();
  }, [loadPreview]);

  const patch = (p: Partial<Branding>) => setForm((f) => ({ ...f, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      const { logoUrl, ...rest } = form;
      const saved = await ProjectAgreementsService.saveBranding(
        logoUrl === loadedLogo.current ? rest : { ...rest, logoUrl }
      );
      setForm({ ...EMPTY, ...saved });
      loadedLogo.current = saved.logoUrl ?? null;
      toast.success('Letterhead saved');
      // Re-render rather than patching the preview locally: the server decides
      // how a bare "acme.com" becomes a link, and this is the only honest way
      // to see the result.
      loadPreview();
    } catch (err: any) {
      toast.error(err?.message || 'Could not save your letterhead');
    } finally {
      setSaving(false);
    }
  };

  const onPickLogo = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Pick an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logos must be 5MB or smaller');
      return;
    }

    setUploading(true);
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read that file'));
        reader.readAsDataURL(file);
      });
      const saved = await ProjectAgreementsService.uploadLogo(dataUri);
      setForm((f) => ({ ...f, logoUrl: saved.logoUrl }));
      loadedLogo.current = saved.logoUrl ?? null;
      toast.success('Logo updated');
      loadPreview();
    } catch (err: any) {
      toast.error(err?.message || 'Could not upload that logo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onPickSignature = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Pick an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Signatures must be 5MB or smaller');
      return;
    }

    setSignUploading(true);
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read that file'));
        reader.readAsDataURL(file);
      });
      const saved = await ProjectAgreementsService.uploadSignature(dataUri);
      setForm((f) => ({ ...f, signatureUrl: saved.signatureUrl }));
      toast.success('Signature updated');
      loadPreview();
    } catch (err: any) {
      toast.error(err?.message || 'Could not upload that signature');
    } finally {
      setSignUploading(false);
      if (signRef.current) signRef.current.value = '';
    }
  };

  const onRemoveSignature = async () => {
    try {
      const saved = await ProjectAgreementsService.removeSignature();
      setForm((f) => ({ ...f, signatureUrl: saved.signatureUrl }));
      toast.success('Signature removed');
      loadPreview();
    } catch (err: any) {
      toast.error(err?.message || 'Could not remove the signature');
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <ZukvoLoader size="md" />
      </div>
    );
  }

  /**
   * What the letterhead currently carries, as the same chips the list pages
   * wear. There is no table here to match — a letterhead is one record — but
   * the strip answers the question you open this page with: which parts are
   * actually set, and which will print blank.
   */
  const pieces: Array<[string, boolean]> = [
    ['Logo', Boolean(form.logoUrl)],
    ['Company name', Boolean(form.companyName?.trim())],
    ['Tagline', Boolean(form.tagline?.trim())],
    ['Contact strip', Boolean(form.phone?.trim() || form.email?.trim() || form.website?.trim())],
    ['Signature', Boolean(form.signatureUrl)],
  ];
  const setCount = pieces.filter(([, on]) => on).length;

  return (
    <>
      <div className="tl-section-head">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{ background: '#3b82f6', boxShadow: '0 0 0 3px #3b82f633' }}
            />
            <span className="tl-sprint-title">
              {form.companyName?.trim() || 'Your letterhead'}
            </span>
            <span className="tl-sprint-tags">
              {pieces.map(([label, on]) => {
                const color = on ? '#16a34a' : '#94a3b8';
                return (
                  <span
                    key={label}
                    className="tl-sprint-tag"
                    style={{ color, background: `${color}1a`, borderColor: `${color}40` }}
                  >
                    {label}
                  </span>
                );
              })}
            </span>
          </div>
          {/* The tab's own actions: the Settings shell's header is shared by
              both tabs, so Save has to live with what it saves. */}
          <div className="tl-sprint-actions">
            <button type="button" className="pa-btn" onClick={loadPreview}>
              <RefreshCw size={14} /> Refresh preview
            </button>
            {canEdit && (
              <button
                type="button"
                className="pa-btn pa-btn-primary"
                onClick={save}
                disabled={saving}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        </div>
        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <b>{setCount}</b> of {pieces.length} parts set
          </span>
          <span className="tl-sprint-meta">
            Anything left blank simply does not print
          </span>
        </div>
      </div>

      <div className="pa-split">
        <div className="pa-split-form">
          {!canEdit && (
            <div className="pa-empty-note">
              You can see the letterhead but not change it — that needs the
              Project Agreements manage permission.
            </div>
          )}

          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Header · top right</div>
            </div>
            <div className="pa-card-body" style={{ display: 'grid', gap: 12 }}>
              <div className="pa-field">
                <span className="pa-label">Logo</span>
                <div className="pa-logo-row">
                  <div className="pa-logo-frame">
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoUrl} alt="Company logo" />
                    ) : (
                      <ImageIcon size={20} />
                    )}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        type="button"
                        className="pa-btn"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
                      </button>
                      {form.logoUrl && (
                        <button
                          type="button"
                          className="pa-btn pa-btn-danger"
                          onClick={() => patch({ logoUrl: null })}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                      <span className="pa-hint">PNG or SVG, 5MB max. Wide marks read best.</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  hidden
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                />
              </div>

              <div className="pa-field">
                <span className="pa-label">Company name</span>
                <input
                  className="pa-input"
                  value={form.companyName ?? ''}
                  onChange={(e) => patch({ companyName: e.target.value })}
                  placeholder="Acme Technologies Pvt Ltd"
                  disabled={!canEdit}
                />
              </div>

              <div className="pa-field">
                <span className="pa-label">Tagline</span>
                <input
                  className="pa-input"
                  value={form.tagline ?? ''}
                  onChange={(e) => patch({ tagline: e.target.value })}
                  placeholder="Engineering that ships"
                  disabled={!canEdit}
                />
                <span className="pa-hint">Printed under the company name.</span>
              </div>
            </div>
          </section>

          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Footer</div>
            </div>
            <div className="pa-card-body" style={{ display: 'grid', gap: 12 }}>
              <div className="pa-field">
                <span className="pa-label pa-label-icon">
                  <Phone size={12} />
                  Phone
                </span>
                <input
                  className="pa-input"
                  value={form.phone ?? ''}
                  onChange={(e) => patch({ phone: e.target.value })}
                  placeholder="+91 80 4567 8900"
                  disabled={!canEdit}
                />
              </div>
              <div className="pa-field">
                <span className="pa-label pa-label-icon">
                  <Mail size={12} />
                  Email
                </span>
                <input
                  className="pa-input"
                  value={form.email ?? ''}
                  onChange={(e) => patch({ email: e.target.value })}
                  placeholder="contracts@acme.com"
                  disabled={!canEdit}
                />
              </div>
              <div className="pa-field">
                <span className="pa-label pa-label-icon">
                  <Globe size={12} />
                  Website
                </span>
                <input
                  className="pa-input"
                  value={form.website ?? ''}
                  onChange={(e) => patch({ website: e.target.value })}
                  placeholder="acme.com"
                  disabled={!canEdit}
                />
                <span className="pa-hint">
                  Rendered as a link — https:// is added if you leave it out.
                </span>
              </div>
              <div className="pa-field">
                <span className="pa-label pa-label-icon">
                  <MapPin size={12} />
                  Location
                </span>
                <input
                  className="pa-input"
                  value={form.location ?? ''}
                  onChange={(e) => patch({ location: e.target.value })}
                  placeholder="Chennai-91, India"
                  disabled={!canEdit}
                />
                <span className="pa-hint">
                  Where the company is — printed last in the footer, after a pin.
                </span>
              </div>
              <div className="pa-field">
                <span className="pa-label">Footer note</span>
                <input
                  className="pa-input"
                  value={form.footerNote ?? ''}
                  onChange={(e) => patch({ footerNote: e.target.value })}
                  placeholder="CIN U72900KA2019PTC000000 · GSTIN 29AAAAA0000A1Z5"
                  disabled={!canEdit}
                />
                <span className="pa-hint">Optional small print under the contact line.</span>
              </div>
            </div>
          </section>
          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Signature</div>
            </div>
            <div className="pa-card-body">
              <p className="pa-hint" style={{ marginTop: 0 }}>
                Printed on our side only; theirs stays blank to sign.
              </p>
              <div className="pa-logo-row" style={{ marginTop: 12 }}>
                <div className="pa-sign-frame">
                  {form.signatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.signatureUrl} alt="Authorised signature" />
                  ) : (
                    <PenLine size={20} />
                  )}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      className="pa-btn"
                      onClick={() => signRef.current?.click()}
                      disabled={signUploading}
                    >
                      <Upload size={14} /> {signUploading ? 'Uploading…' : 'Upload'}
                    </button>
                    {form.signatureUrl && (
                      <button type="button" className="pa-btn pa-btn-danger" onClick={onRemoveSignature}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                    <span className="pa-hint">
                      PNG with a transparent background reads best on paper. 5MB max.
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={signRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                hidden
                onChange={(e) => onPickSignature(e.target.files?.[0])}
              />
            </div>
          </section>
        </div>

        <DocumentPreview
          html={previewHtml}
          label="Letterhead preview"
          title="Letterhead preview"
          loading={previewLoading}
          emptyHint="Save your letterhead to see it on a sample agreement here."
        />
      </div>

      <style jsx global>{`
        .pa-label-icon { display: inline-flex; align-items: center; gap: 5px; }
        .pa-label-icon svg { opacity: 0.8; }
        .pa-logo-row { display: flex; align-items: flex-start; gap: 12px; }
        .pa-logo-frame {
          width: 130px; height: 66px; flex-shrink: 0;
          border: 1px dashed var(--border-slate-200); border-radius: 10px;
          display: grid; place-items: center; overflow: hidden;
          background: var(--bg-slate-50, #f8fafc); color: var(--text-slate-400);
        }
        .pa-logo-frame img { max-width: 100%; max-height: 100%; object-fit: contain; }
        /* Wider and shorter than the logo frame — a signature is a wide mark,
           and it sits on a line rather than in a box. */
        .pa-sign-frame {
          width: 190px; height: 66px; flex-shrink: 0;
          border: 1px dashed var(--border-slate-200); border-radius: 10px;
          display: flex; align-items: flex-end; justify-content: flex-start;
          padding: 6px 10px; overflow: hidden;
          background: var(--bg-pure-white); color: var(--text-slate-400);
        }
        .pa-sign-frame svg { margin: auto; }
        .pa-sign-frame img { max-width: 100%; max-height: 100%; object-fit: contain; object-position: left bottom; }
      `}</style>
    </>
  );
}
