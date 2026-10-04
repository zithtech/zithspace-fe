'use client';

/**
 * The composer — one component behind both "New agreement" and "Edit".
 *
 * LAYOUT: a form rail on the left, a live document preview on the right. The
 * preview is an <iframe srcDoc>, and that is deliberate: the server returns a
 * complete document with its own @page rules and letterhead styling, and
 * dropping that into the app's DOM would let two stylesheets fight over it.
 * Inside an iframe what you see is exactly what the PDF renderer sees.
 *
 * THE PREVIEW IS ALWAYS SERVER-RENDERED, never assembled here. A preview drawn
 * by different code from the PDF is a preview that will eventually lie.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  Globe,
  KeyRound,
  Link2Off,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Modal } from 'antd';
import { message } from '@/providers/AntdGlobalProvider';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import DocumentPreview from '@/components/project-agreements/DocumentPreview';
import AgreementContentEditor from '@/components/project-agreements/AgreementContentEditor';
import PasswordUnlockModal from '@/components/project-agreements/PasswordUnlockModal';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AGREEMENT_STATUS_META,
  Agreement,
  AgreementPayload,
  AgreementStatus,
  AgreementTemplate,
  ProjectAgreementsService,
  Branding,
  ClientContact,
  ClientOption,
  DocumentType,
  ProjectOption,
  SUMMARY_FIELDS,
  SUMMARY_FIELD_KEYS,
  SummaryFieldKey,
  TemplatePlaceholder,
  CURRENCIES,
  formatMoneyWithWords,
  unlockTemplate,
  isPasswordLockError,
  getLockScope,
  getSecuritySettings,
  PasswordProtectionMode,
} from '@/services/projectAgreementsService';

interface Props {
  /** Present when editing; absent when composing a new document. */
  agreement?: Agreement | null;
  readOnly?: boolean;
}

const STATUS_OPTIONS = (Object.keys(AGREEMENT_STATUS_META) as AgreementStatus[]).map((s) => ({
  value: s,
  label: AGREEMENT_STATUS_META[s].label,
}));

/** YYYY-MM-DD → "14 Sep 2026". Mirrors formatDate() in render.service.ts. */
const formatDate = (value?: string | null): string => {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
};

/**
 * Does this HTML actually say anything?
 *
 * An "empty" editor is not an empty string — BlockNote serialises a blank
 * document as a paragraph wrapped in its own block markup. Stripping tags and
 * non-breaking spaces is what separates "nothing written yet" from "one word".
 */
const hasContent = (html: string): boolean =>
  html.replace(/<[^>]*>/g, '').replace(/&nbsp;|\u00a0/g, '').trim().length > 0;

export default function AgreementComposer({ agreement, readOnly = false }: Props) {
  const router = useRouter();
  const isEdit = Boolean(agreement);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  /** The kind of document. Mandatory — see Settings › Doc Types. */
  const [documentTypeId, setDocumentTypeId] = useState(agreement?.documentTypeId ?? '');
  const [projectId, setProjectId] = useState(agreement?.projectId ?? '');
  /**
   * The client the document is addressed to.
   *
   * `clientCompany` is a SNAPSHOT, not a lookup: it is what prints, so a client
   * renamed next year must not rewrite a document signed this one. The id is
   * only there to reopen the composer on the right row and to fetch contacts.
   */
  const [clientId, setClientId] = useState(agreement?.clientId ?? '');
  const [clientCompany, setClientCompany] = useState(agreement?.clientCompany ?? '');
  const [clientContactId, setClientContactId] = useState(agreement?.clientContactId ?? '');
  const [templateId, setTemplateId] = useState(agreement?.templateId ?? '');
  const [title, setTitle] = useState(agreement?.title ?? '');
  const [summaryTitle, setSummaryTitle] = useState(agreement?.summaryTitle ?? '');
  const [documentNumber, setDocumentNumber] = useState(agreement?.documentNumber ?? '');
  const [status, setStatus] = useState<AgreementStatus>(agreement?.status ?? 'draft');
  const [effectiveDate, setEffectiveDate] = useState(agreement?.effectiveDate ?? '');
  const [expiryDate, setExpiryDate] = useState(agreement?.expiryDate ?? '');
  const [partyName, setPartyName] = useState(agreement?.partyName ?? '');
  const [partyEmail, setPartyEmail] = useState(agreement?.partyEmail ?? '');
  const [notes, setNotes] = useState(agreement?.notes ?? '');
  const [partyPhone, setPartyPhone] = useState(agreement?.partyPhone ?? '');
  const [documentDate, setDocumentDate] = useState(
    agreement?.documentDate ?? new Date().toISOString().slice(0, 10)
  );
  const [kickoffDate, setKickoffDate] = useState(agreement?.kickoffDate ?? '');
  const [totalValue, setTotalValue] = useState(agreement?.totalValue ?? '');
  const [valueCurrency, setValueCurrency] = useState(agreement?.valueCurrency ?? 'INR');
  /**
   * Which summary rows print. A stored null means "all of them", which is the
   * default the renderer applies too — so a row added to the product later
   * appears on existing documents rather than only on new ones.
   */
  const [summaryFields, setSummaryFields] = useState<SummaryFieldKey[]>(
    agreement?.summaryFields ?? SUMMARY_FIELD_KEYS
  );
  const [signatoryName, setSignatoryName] = useState(agreement?.signatoryName ?? '');
  const [signatoryPosition, setSignatoryPosition] = useState(agreement?.signatoryPosition ?? '');
  const [clientSignatoryPosition, setClientSignatoryPosition] = useState(
    agreement?.clientSignatoryPosition ?? ''
  );
  const [clientSignatoryName, setClientSignatoryName] = useState(
    agreement?.clientSignatoryName ?? agreement?.partyName ?? ''
  );
  /**
   * Whether the person has named their own counter-signatory.
   *
   * Until they do, the field FOLLOWS the Client name — typing "Globex Inc" into
   * Client fills the signature side too, which is what it would have printed
   * anyway. Once they type their own, it stops following: correcting the client
   * name must not overwrite the individual who actually signs.
   */
  const clientSignatoryTouched = useRef(
    Boolean(agreement?.clientSignatoryName && agreement.clientSignatoryName !== agreement.partyName)
  );
  /**
   * The entity each side signs FOR.
   *
   * PREFILLED on a new document — ours from the letterhead once branding
   * loads, theirs from the client as soon as one is picked — so the sign-off
   * is complete without typing. The `touched` refs are what stop the prefill
   * from overwriting a value somebody has set by hand, the same guard
   * clientSignatoryName uses.
   *
   * An EXISTING document is never backfilled: a blank stored value means
   * "follow the letterhead at print time", and quietly stamping today's
   * company name onto it on the next save would freeze it.
   */
  const [signatoryCompany, setSignatoryCompany] = useState(agreement?.signatoryCompany ?? '');
  const signatoryCompanyTouched = useRef(Boolean(agreement));
  const [clientSignatoryCompany, setClientSignatoryCompany] = useState(
    agreement?.clientSignatoryCompany ?? ''
  );
  const clientSignatoryCompanyTouched = useRef(Boolean(agreement));

  const [showSignatures, setShowSignatures] = useState(agreement?.showSignatures ?? true);
  const [isPasswordProtected, setIsPasswordProtected] = useState(agreement?.isPasswordProtected ?? false);
  const [passwordMode, setPasswordMode] = useState<'INHERIT_TENANT' | 'CUSTOM' | 'NONE'>(agreement?.passwordMode ?? 'INHERIT_TENANT');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(agreement?.values ?? {});
  const [tenantSecurityMode, setTenantSecurityMode] = useState<PasswordProtectionMode | null>(null);

  /* ── The document body ─────────────────────────────────────────────────
   * THE BODY IS THE DOCUMENT. A template seeds it and is then let go of —
   * `detached` records that the person has taken the wording over, so changing
   * a placeholder afterwards offers to re-apply rather than silently
   * overwriting what they wrote. */
  const [bodyHtml, setBodyHtml] = useState(agreement?.contentHtml ?? '');
  const [seedKey, setSeedKey] = useState(0);
  const [detached, setDetached] = useState(Boolean(agreement));
  const [branding, setBranding] = useState<Branding | null>(null);

  // Whether the person has typed their own document name. Without this, picking
  // a second template would either clobber a name they wrote or leave the first
  // template's name on a document cut from a different one.
  const titleTouched = useRef(Boolean(agreement?.title));

  /**
   * The paginated preview, as a PDF object URL.
   *
   * A PDF rather than more HTML because the pane has to show every page with
   * its own header and footer, and only the printer knows where the pages
   * break. Kept in a ref alongside so the previous URL can be revoked — one
   * leaked document per keystroke adds up fast.
   */
  const [previewPdf, setPreviewPdf] = useState<{ url: string; pageCount: number } | null>(null);
  const previewPdfUrl = useRef<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  // Off by default: the editor is already a real A4 sheet with the letterhead
  // on it, so most of the time the paginated view is a second opinion rather
  // than a necessity — and it buys the editor the full width.
  const [showPreview, setShowPreview] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTemplateLocked, setIsTemplateLocked] = useState(false);
  const [templateLockScope, setTemplateLockScope] = useState<'TENANT' | 'AGREEMENT' | 'TEMPLATE'>('TENANT');
  const pendingApplyTemplateRef = useRef<{ id: string; nextValues: Record<string, string>; force: boolean } | null>(null);

  /* ── Reference data ──────────────────────────────────────────────────── */

  useEffect(() => {
    ProjectAgreementsService.listProjects()
      .then(setProjects)
      .catch((e: any) => message.error(e?.message || 'Could not load projects'));

    // Only published templates: a draft is wording somebody is still working
    // on, and raising a contract from it is how half-written clauses ship.
    // activeOnly: a retired kind stays on the documents that cite it but must
    // not be offered for a new one.
    ProjectAgreementsService.listDocumentTypes({ activeOnly: true })
      .then(setDocumentTypes)
      .catch((e: any) => message.error(e?.message || 'Could not load document types'));

    ProjectAgreementsService.listClients()
      .then(setClients)
      .catch((e: any) => message.error(e?.message || 'Could not load clients'));

    ProjectAgreementsService.listTemplates({ publishedOnly: true })
      .then(setTemplates)
      .catch((e: any) => message.error(e?.message || 'Could not load templates'));

    // The editor draws the letterhead itself so the sheet looks like the page
    // it will print as.
    ProjectAgreementsService.getBranding()
      .then((b) => {
        setBranding(b);
        // Prefill our side of the sign-off from the letterhead. Guarded, so a
        // company typed before this request came back survives.
        if (!signatoryCompanyTouched.current && b.companyName) {
          setSignatoryCompany(b.companyName);
        }
      })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Whoever is at the chosen client.
   *
   * Refetched rather than cached per client: a contact added in another tab
   * while the composer is open should appear the moment the client is
   * reselected, and the list is one small request.
   */
  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      return;
    }
    let cancelled = false;
    setContactsLoading(true);
    ProjectAgreementsService.listClientContacts(clientId)
      .then(({ contacts: rows }) => {
        if (!cancelled) setContacts(rows);
      })
      .catch((e: any) => {
        if (!cancelled) {
          setContacts([]);
          message.error(e?.message || 'Could not load that client\u2019s contacts');
        }
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // A new document gets the next free reference offered up front; an existing
  // one keeps whatever it was given.
  useEffect(() => {
    if (isEdit || documentNumber) return;
    ProjectAgreementsService.nextDocumentNumber()
      .then(({ documentNumber: next }) => setDocumentNumber(next))
      .catch(() => {
        // Not fatal — the field is optional and can be typed by hand.
      });
  }, [isEdit, documentNumber]);

  // Fetching the full template (its body and placeholders) is separate from the
  // list, which carries them too — but the list is filtered to published and an
  // agreement being edited may cite one that has since been archived.
  const fetchTemplate = useCallback((id: string) => {
    setIsTemplateLocked(false);
    ProjectAgreementsService.getTemplate(id)
      .then((t) => {
        setTemplate(t);
        // Adopt the template's name unless the person has named it themselves.
        if (!titleTouched.current) setTitle(t.name);
        setValues((prev) => {
          const next = { ...prev };
          for (const p of t.placeholders) {
            if (next[p.key] === undefined && p.defaultValue) next[p.key] = p.defaultValue;
          }
          return next;
        });
      })
      .catch((e: any) => {
        if (isPasswordLockError(e)) {
          setIsTemplateLocked(true);
          setTemplateLockScope(getLockScope(e));
        } else {
          message.error(e?.message || 'Could not load that template');
        }
      });
  }, []);

  useEffect(() => {
    if (!templateId) {
      setTemplate(null);
      return;
    }
    fetchTemplate(templateId);
  }, [templateId, fetchTemplate]);

  /**
   * Pour a template's wording into the editor.
   *
   * Asks first whenever there is something to lose. `force` skips the question
   * for the one case where there is nothing: seeding a template the person has
   * just picked on an empty document.
   */
  const executeApplyTemplate = async (id: string, nextValues: Record<string, string>, force = false) => {
    try {
      const { bodyHtml: seeded } = await ProjectAgreementsService.composeBody({
        templateId: id,
        projectId: projectId || null,
        values: nextValues,
      });
      setBodyHtml(seeded);
      // Force the editor to re-read: it treats `value` as a seed, not a
      // controlled prop, so nothing else would make it reload.
      setSeedKey((k) => k + 1);
      setDetached(false);
    } catch (err: any) {
      if (isPasswordLockError(err)) {
        pendingApplyTemplateRef.current = { id, nextValues, force };
        setIsTemplateLocked(true);
        setTemplateLockScope(getLockScope(err));
      } else {
        message.error(err?.message || 'Could not apply that template');
      }
    }
  };

  const applyTemplate = useCallback(
    async (id: string, nextValues: Record<string, string>, force = false) => {
      if (!force && hasContent(bodyHtml)) {
        Modal.confirm({
          title: 'Replace Current Wording?',
          content: 'Applying this template will replace the wording you have written. This cannot be undone.',
          okText: 'Replace Wording',
          okButtonProps: { danger: true },
          cancelText: 'Cancel',
          centered: true,
          onOk: () => executeApplyTemplate(id, nextValues, force),
        });
        return;
      }
      await executeApplyTemplate(id, nextValues, force);
    },
    [bodyHtml, projectId]
  );

  const handleTemplateUnlock = async (password: string) => {
    if (!templateId && !pendingApplyTemplateRef.current?.id) return;
    const targetId = templateId || pendingApplyTemplateRef.current?.id;
    if (!targetId) return;
    const result = await unlockTemplate(targetId, password);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`pa_unlock_${targetId}`, result.unlockToken);
    }
    setIsTemplateLocked(false);
    fetchTemplate(targetId);
    if (pendingApplyTemplateRef.current) {
      const p = pendingApplyTemplateRef.current;
      pendingApplyTemplateRef.current = null;
      await applyTemplate(p.id, p.nextValues, p.force);
    }
  };

  const handleTemplateCancel = () => {
    setIsTemplateLocked(false);
    setTemplateId('');
    setTemplate(null);
    pendingApplyTemplateRef.current = null;
  };

  // Picking a template on an untouched document seeds it immediately; on a
  // started one, applyTemplate asks first.
  const pickTemplate = (id: string) => {
    if (!id) {
      setTemplateId('');
      setTemplate(null);
      return;
    }
    setTemplateId(id);
    applyTemplate(id, values, !hasContent(bodyHtml));
  };

  /**
   * A template field changed.
   *
   * While the template still drives the wording, re-pour it so the page keeps
   * up as you type. Once the body has been taken over by hand, DO NOT — that
   * would throw away the person's edits because they corrected a date. The
   * panel grows an "Apply" button instead.
   */
  const reseed = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setFieldValue = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (detached || !templateId) return;
    if (reseed.current) clearTimeout(reseed.current);
    reseed.current = setTimeout(() => applyTemplate(templateId, next, true), 500);
  };

  useEffect(
    () => () => {
      if (reseed.current) clearTimeout(reseed.current);
      if (previewPdfUrl.current) URL.revokeObjectURL(previewPdfUrl.current);
    },
    []
  );

  /* ── Live preview ────────────────────────────────────────────────────── */

  // The preview follows the editor, not the template — the body is the document.
  const previewKey = useMemo(
    () =>
      JSON.stringify({
        projectId, title, summaryTitle, documentNumber, bodyHtml,
        clientCompany, partyName, partyEmail, partyPhone,
        documentDate, kickoffDate, totalValue, valueCurrency, summaryFields,
        signatoryName, signatoryPosition, signatoryCompany,
        clientSignatoryName, clientSignatoryPosition, clientSignatoryCompany,
        showSignatures,
      }),
    [projectId, title, summaryTitle, documentNumber, bodyHtml, clientCompany,
     partyName, partyEmail, partyPhone,
     documentDate, kickoffDate, totalValue, valueCurrency, summaryFields,
     signatoryName, signatoryPosition, signatoryCompany,
     clientSignatoryName, clientSignatoryPosition, clientSignatoryCompany,
     showSignatures]
  );
  const debouncedKey = useDebounce(previewKey, 450);
  const previewSeq = useRef(0);

  /**
   * Everything the renderer needs, in one place.
   *
   * Shared by the live preview and the download so the file someone saves can
   * never be a different document from the one they were just looking at.
   */
  const renderPayload = useCallback(
    () => ({
      // No templateId: the server must render the body we hold, not go back
      // to the template and undo everything typed since.
      projectId: projectId || null,
      title: title || 'Untitled Agreement',
      summaryTitle: summaryTitle || null,
      documentNumber: documentNumber || null,
      bodyHtml,
      values: {},
      client: partyName || null,
      clientCompany: clientCompany || null,
      clientEmail: partyEmail || null,
      clientPhone: partyPhone || null,
      kickoffDate: kickoffDate || null,
      documentDate: documentDate || null,
      totalValue: totalValue || null,
      valueCurrency: valueCurrency || null,
      summaryFields,
      signatoryName: signatoryName || null,
      signatoryPosition: signatoryPosition || null,
      signatoryCompany: signatoryCompany || null,
      clientSignatoryName: clientSignatoryName || null,
      clientSignatoryPosition: clientSignatoryPosition || null,
      clientSignatoryCompany: clientSignatoryCompany || null,
      showSignatures,
    }),
    [projectId, title, summaryTitle, documentNumber, bodyHtml, clientCompany,
     partyName, partyEmail,
     partyPhone, kickoffDate, documentDate, totalValue, valueCurrency, summaryFields,
     signatoryName, signatoryPosition, signatoryCompany,
     clientSignatoryName, clientSignatoryPosition, clientSignatoryCompany,
     showSignatures]
  );

  /** The name the file lands under — the reference if there is one. */
  const downloadName = (documentNumber || title || 'agreement').trim();

  /**
   * Save the document as a PDF, whether or not the preview pane is open.
   *
   * Reuses the preview's bytes when they are current — the common case, and it
   * makes the download instant. Otherwise it renders once, saves, and throws
   * the object URL away rather than caching a file nothing is showing.
   */
  const downloadPdf = useCallback(async () => {
    if (!hasContent(bodyHtml)) {
      message.error('Write the agreement, or apply a template, before downloading');
      return;
    }

    const save = (url: string) => {
      const name = downloadName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || 'agreement'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    if (previewPdf && previewPdfUrl.current && !previewing) {
      save(previewPdfUrl.current);
      return;
    }

    setDownloading(true);
    let fresh: string | null = null;
    try {
      const rendered = await ProjectAgreementsService.previewPdf(renderPayload());
      fresh = rendered.url;
      save(fresh);
    } catch (err: any) {
      message.error(err?.message || 'Could not render the PDF');
    } finally {
      // Give the click a tick to start the save before the URL goes away.
      if (fresh) setTimeout(() => URL.revokeObjectURL(fresh!), 10_000);
      setDownloading(false);
    }
  }, [bodyHtml, downloadName, previewPdf, previewing, renderPayload]);

  const refreshPreview = useCallback(async () => {
    if (!hasContent(bodyHtml)) {
      setPreviewPdf(null);
      return;
    }
    const seq = ++previewSeq.current;
    setPreviewing(true);
    try {
      const rendered = await ProjectAgreementsService.previewPdf(renderPayload());

      // A response a newer keystroke has already superseded is thrown away —
      // including its object URL, which nothing else will ever revoke.
      if (seq !== previewSeq.current) {
        URL.revokeObjectURL(rendered.url);
        return;
      }
      if (previewPdfUrl.current) URL.revokeObjectURL(previewPdfUrl.current);
      previewPdfUrl.current = rendered.url;
      setPreviewPdf(rendered);
    } catch (err: any) {
      if (seq === previewSeq.current) {
        message.error(err?.message || 'Could not render the preview');
      }
    } finally {
      if (seq === previewSeq.current) setPreviewing(false);
    }
  }, [bodyHtml, renderPayload]);

  useEffect(() => {
    // Only while the pane is open. Rendering a PDF on every keystroke behind a
    // closed preview is pure waste, and it is the one expensive thing here.
    if (!showPreview) return;
    refreshPreview();
    // refreshPreview is intentionally not a dependency: debouncedKey already
    // represents every input it reads, and adding it would fire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKey, showPreview]);

  /* ── Save ────────────────────────────────────────────────────────────── */

  const placeholders: TemplatePlaceholder[] = template?.placeholders ?? [];

  /** The reasons this document cannot be saved yet, in the order to report them. */
  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    // A project is optional on purpose — an NDA, an MSA or the proposal that
    // wins the work is all signed before there is a project to hang it on.
    if (!documentTypeId) next.documentTypeId = 'Pick the type of document';
    if (!title.trim()) next.title = 'Give the document a name';
    // A template is optional; wording is not. You can start from a template or
    // from nothing, but an empty contract is never what someone meant to save.
    if (!hasContent(bodyHtml)) next.bodyHtml = 'Write the agreement, or apply a template';
    if (expiryDate && effectiveDate && expiryDate < effectiveDate) {
      next.expiryDate = 'Expiry cannot be before the effective date';
    }
    if (partyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partyEmail)) {
      next.partyEmail = 'Enter a valid email address';
    }
    // Required placeholders only bite once the document leaves draft — the
    // server enforces the same rule, this is just the earlier, kinder message.
    // Only while the template still drives the wording. Once the body has been
    // taken over by hand, a blank field is not evidence of a blank contract —
    // the person may well have typed the value straight into the text.
    if (status !== 'draft' && !detached) {
      for (const p of placeholders) {
        if (p.required && !String(values[p.key] ?? '').trim()) {
          next[`v_${p.key}`] = `${p.label} is required`;
        }
      }
    }
    setErrors(next);
    return next;
  };

  const handleSave = async () => {
    const problems = validate();
    if (Object.keys(problems).length > 0) {
      // NAME the first problem rather than saying "check the highlighted
      // fields". The field it highlights is not always on screen — the body
      // error lives in the editor pane, and the split layout stops drawing
      // that pane below 1500px — so a generic message leaves the button
      // looking simply broken.
      message.error(Object.values(problems)[0]);
      requestAnimationFrame(() => {
        document
          .querySelector('.pa-compose .pa-error')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    if (isPasswordProtected && passwordMode === 'CUSTOM' && !agreement && !customPassword.trim()) {
      message.error('Please enter a custom password or select Global Company Password');
      return;
    }

    const payload: AgreementPayload = {
      documentTypeId,
      projectId: projectId || null,
      templateId: templateId || null,
      title: title.trim(),
      summaryTitle: summaryTitle.trim() || null,
      documentNumber: documentNumber.trim() || null,
      status,
      effectiveDate: effectiveDate || null,
      expiryDate: expiryDate || null,
      clientId: clientId || null,
      clientCompany: clientCompany.trim() || null,
      clientContactId: clientContactId || null,
      partyName: partyName.trim() || null,
      partyEmail: partyEmail.trim() || null,
      partyPhone: partyPhone.trim() || null,
      documentDate: documentDate || null,
      kickoffDate: kickoffDate || null,
      totalValue: String(totalValue).trim() || null,
      valueCurrency: valueCurrency.trim() || null,
      // All rows selected is stored as null, so the default keeps following
      // the product rather than freezing today's list onto the row.
      summaryFields:
        summaryFields.length === SUMMARY_FIELD_KEYS.length ? null : summaryFields,
      signatoryName: signatoryName.trim() || null,
      signatoryPosition: signatoryPosition.trim() || null,
      signatoryCompany: signatoryCompany.trim() || null,
      clientSignatoryName: clientSignatoryName.trim() || null,
      clientSignatoryPosition: clientSignatoryPosition.trim() || null,
      clientSignatoryCompany: clientSignatoryCompany.trim() || null,
      showSignatures,
      isPasswordProtected,
      passwordMode,
      customPassword: customPassword.trim() || undefined,
      notes: notes.trim() || null,
      values,
      // ALWAYS. The editor holds the document; the template was only ever a
      // starting point, and re-rendering from it here would discard every edit
      // made since it was applied.
      useCustomContent: true,
      contentHtml: bodyHtml,
    };

    setSaving(true);
    try {
      const saved = agreement
        ? await ProjectAgreementsService.updateAgreement(agreement.id, payload)
        : await ProjectAgreementsService.createAgreement(payload);
      message.success(agreement ? 'Agreement updated' : 'Agreement created');
      router.push(`/project-agreements/agreements/${saved.id}`);
    } catch (err: any) {
      message.error(err?.message || 'Could not save this agreement');
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */

  const projectOptions = projects
    .filter((p: any) => {
      if (!clientId) return true;
      if (p.clientId === clientId) return true;
      if (Array.isArray(p.clients) && p.clients.some((c: any) => c.id === clientId)) return true;
      return false;
    })
    .map((p) => ({
      value: p.id,
      label: p.name,
      description: p.code ?? undefined,
    }));

  const documentTypeOptions = useMemo(() => {
    const opts = documentTypes.map((t) => ({
      value: t.id,
      label: t.name,
      description: t.code,
    }));
    // A document already raised under a type since deactivated would otherwise
    // vanish from its own picker and read as unset.
    if (
      agreement?.documentTypeId &&
      !documentTypes.some((t) => t.id === agreement.documentTypeId)
    ) {
      opts.unshift({
        value: agreement.documentTypeId,
        label: agreement.documentTypeName ?? 'Current type',
        description: 'No longer offered',
      });
    }
    return opts;
  }, [documentTypes, agreement?.documentTypeId, agreement?.documentTypeName]);

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.companyName,
        description: c.clientCode ?? undefined,
      })),
    [clients]
  );

  /** A contact's printable name, however completely the record was filled in. */
  const contactName = (c: ClientContact): string =>
    (c.displayName || [c.firstName, c.lastName].filter(Boolean).join(' ') || '').trim();

  const contactOptions = useMemo(
    () =>
      contacts.map((c) => ({
        value: c.id,
        label: contactName(c) || 'Unnamed contact',
        // Designation and email are how you tell two people apart in a picker;
        // the primary flag is what you are usually looking for.
        description: [
          c.isPrimary ? 'Primary' : null,
          c.designation,
          c.officialEmail,
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
      })),
    [contacts]
  );

  /**
   * Picking a client REPLACES the counterparty block.
   *
   * The contact is cleared rather than carried over — a contact belongs to one
   * client, and silently keeping the previous client's person on the document
   * is how an agreement gets addressed to the wrong company.
   */
  const pickClient = (id: string) => {
    setClientId(id);
    setClientContactId('');
    const picked = clients.find((c) => c.id === id);
    setClientCompany(picked?.companyName ?? '');
    if (!picked) {
      // Cleared. The typed counterparty details stay: they may have been
      // entered by hand, and clearing a picker should not erase them.
      return;
    }
    // Their side of the sign-off follows the client, unless it has been set
    // by hand — the entity that signs is usually the entity on the document.
    if (!clientSignatoryCompanyTouched.current) {
      setClientSignatoryCompany(picked.companyName);
    }
  };

  /** Picking a contact fills in who the document is addressed to. */
  const pickContact = (id: string) => {
    setClientContactId(id);
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    setPartyName(contactName(c));
    // Falls back through the record the way somebody would read it off a card.
    setPartyEmail(c.officialEmail || c.secondaryEmail || '');
    setPartyPhone(c.mobileNumber || c.alternatePhone || c.officeLandline || '');
    // The signature side follows the Client name until it has been set by
    // hand — same rule as typing the name directly.
    if (!clientSignatoryTouched.current) {
      setClientSignatoryName(contactName(c));
      // Their designation IS the authority they sign under, which is the whole
      // point of recording it on the contact.
      if (c.designation) setClientSignatoryPosition(c.designation);
    }
  };

  /**
   * Country first, then the symbol and code — you pick a currency by knowing
   * where the counterparty is, not by remembering that MYR is the ringgit.
   */
  const currencyOptions = useMemo(
    () =>
      CURRENCIES.map((c) => ({
        value: c.code,
        label: `${c.country} — ${c.symbol}`,
        description: `${c.code} · ${c.major}`,
      })),
    []
  );

  /** "$1,500 (One Thousand Five Hundred Dollars Only)", as the document prints it. */
  const moneyPreview = useMemo(
    () => formatMoneyWithWords(totalValue, valueCurrency),
    [totalValue, valueCurrency]
  );

  const templateOptions = useMemo(() => {
    const opts = templates.map((t) => ({
      value: t.id,
      label: t.name,
      description: t.category ?? undefined,
    }));
    // An archived template an existing document still cites would otherwise
    // vanish from its own picker.
    if (template && !templates.some((t) => t.id === template.id)) {
      opts.unshift({
        value: template.id,
        label: template.name,
        description: 'No longer published',
      });
    }
    return opts;
  }, [templates, template]);

  /**
   * The summary block as the editor should draw it.
   *
   * Mirrors summaryHtml() on the server, including dropping a row that has no
   * value — the whole point is that the sheet you type on shows the rows the
   * PDF will actually carry.
   */
  const summaryRows = useMemo(() => {
    const project = projects.find((p) => p.id === projectId);
    const contacts = [partyEmail, partyPhone].filter(Boolean).join('  ·  ');
    const value: Record<SummaryFieldKey, string> = {
      // No fallback to the document name — an empty Title drops its row, the
      // same rule every other summary row follows.
      title: summaryTitle,
      client: partyName,
      kickoff: formatDate(kickoffDate),
      value: formatMoneyWithWords(totalValue, valueCurrency),
      contacts,
      date: formatDate(documentDate),
      reference: documentNumber,
      project: project ? (project.code ? `${project.name} (${project.code})` : project.name) : '',
      company: clientCompany,
    };
    return SUMMARY_FIELDS.filter((f) => summaryFields.includes(f.key) && value[f.key].trim()).map(
      (f) => ({ key: f.key, label: f.label, value: value[f.key] })
    );
  }, [projects, projectId, summaryTitle, partyName, partyEmail, partyPhone, kickoffDate,
      totalValue, valueCurrency, documentDate, documentNumber, summaryFields, clientCompany]);

  return (
    <>
      <div className="pa-header">
        <div className="pa-header-about">
          <button
            type="button"
            className="pa-btn"
            style={{ width: 32, padding: 0, justifyContent: 'center' }}
            onClick={() => router.push('/project-agreements/agreements')}
            aria-label="Back to agreements"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="pa-header-title">
              {isEdit ? title || 'Edit agreement' : 'New agreement'}
            </div>
            <div className="pa-header-sub">
              {template
                ? `${template.name} · v${template.version}`
                : 'Pick a project and a template to begin'}
            </div>
          </div>
        </div>
        <div className="pa-header-actions">
          <button
            type="button"
            className={`pa-btn ${showPreview ? 'is-on' : ''}`}
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
            title="Show the paginated document, header and footer on every page"
          >
            <Eye size={14} /> Preview
          </button>
          {showPreview && (
            <button
              type="button"
              className="pa-btn"
              onClick={refreshPreview}
              disabled={previewing}
              title="Re-render the preview"
              aria-label="Refresh preview"
              style={{ width: 32, padding: 0, justifyContent: 'center' }}
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            type="button"
            className="pa-btn"
            onClick={downloadPdf}
            disabled={downloading}
            title="Save this document as a PDF"
          >
            <Download size={14} /> {downloading ? 'Preparing…' : 'Download'}
          </button>
          {!readOnly && (
            <button
              type="button"
              className="pa-btn pa-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create agreement'}
            </button>
          )}
        </div>
      </div>

      <div className={`pa-compose ${showPreview ? 'is-split' : ''}`}>
        <div className="pa-split-form">
          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Document</div>
            </div>
            <div className="pa-card-body" style={{ display: 'grid', gap: 12 }}>
              <div className="pa-field">
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
                  width={340}
                />
                <span className="pa-hint">Managed in Settings › Doc Types.</span>
                {errors.documentTypeId && (
                  <span className="pa-error">{errors.documentTypeId}</span>
                )}
              </div>

              {/* The counterparty, picked rather than typed. Sits above Project
                  so that picking a client can filter the available projects. */}
              <div className="pa-field">
                <span className="pa-label">Client — optional</span>
                <SearchableDropdown
                  value={clientId}
                  onChange={(v: any) => pickClient(v ?? '')}
                  options={clientOptions}
                  placeholder="Not linked to a client"
                  searchPlaceholder="Find an active client"
                  itemNoun="clients"
                  disabled={readOnly}
                  allowClear
                  width={340}
                />
                <span className="pa-hint">Active clients only. Prints as the Company row.</span>
              </div>

              {clientId && (
                <div className="pa-field">
                  <span className="pa-label">Send to</span>
                  <SearchableDropdown
                    value={clientContactId}
                    onChange={(v: any) => pickContact(v ?? '')}
                    options={contactOptions}
                    placeholder={
                      contactsLoading
                        ? 'Loading contacts…'
                        : contactOptions.length
                          ? 'Pick who this is addressed to'
                          : 'This client has no contacts yet'
                    }
                    searchPlaceholder="Find a contact"
                    itemNoun="contacts"
                    loading={contactsLoading}
                    disabled={readOnly || contactsLoading || contactOptions.length === 0}
                    allowClear
                    width={340}
                  />
                  <span className="pa-hint">Fills the client name, email and phone below.</span>
                </div>
              )}

              <div className="pa-field">
                <span className="pa-label">Project — optional</span>
                <SearchableDropdown
                  value={projectId}
                  onChange={(v: any) => setProjectId(v ?? '')}
                  options={projectOptions}
                  placeholder="Not tied to a project"
                  searchPlaceholder="Find a project"
                  itemNoun="projects"
                  disabled={readOnly}
                  allowClear
                  width={340}
                />
                <span className="pa-hint">Fills the {'{{project_*}}'} tokens.</span>
                {errors.projectId && <span className="pa-error">{errors.projectId}</span>}
              </div>

              <div className="pa-field">
                <span className="pa-label">Template — optional</span>
                <SearchableDropdown
                  value={templateId}
                  onChange={(v: any) => pickTemplate(v ?? '')}
                  options={templateOptions}
                  placeholder="Start blank, or pick a template"
                  searchPlaceholder="Find a template"
                  itemNoun="templates"
                  disabled={readOnly}
                  width={340}
                />
                {detached && templateId ? (
                  <div className="pa-detached">
                    <Link2Off size={13} />
                    <span>
                      You have edited this document, so it is now its own — the template is
                      kept only as a record of where it came from.
                    </span>
                    <button
                      type="button"
                      className="pa-btn"
                      onClick={() => applyTemplate(templateId, values)}
                      disabled={readOnly}
                    >
                      <FileDown size={13} /> Re-apply
                    </button>
                  </div>
                ) : (
                  <span className="pa-hint">
                    {templates.length === 0
                      ? 'No published templates yet.'
                      : 'Fills the page; every word stays editable.'}
                  </span>
                )}
              </div>

              <div className="pa-field">
                <span className="pa-label">Document name</span>
                <input
                  className="pa-input"
                  value={title}
                  onChange={(e) => {
                    titleTouched.current = true;
                    setTitle(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''));
                  }}
                  placeholder="Master Services Agreement"
                  disabled={readOnly}
                />
                <span className="pa-hint">Printed top-left of every page.</span>
                {errors.title && <span className="pa-error">{errors.title}</span>}
              </div>

              <div className="pa-field">
                <span className="pa-label">Title</span>
                <input
                  className="pa-input"
                  value={summaryTitle}
                  onChange={(e) => setSummaryTitle(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''))}
                  placeholder="What this agreement is for"
                  disabled={readOnly}
                />
                <span className="pa-hint">The summary Title row. Blank drops it.</span>
              </div>

              <div className="pa-grid-2">
                <div className="pa-field">
                  <span className="pa-label">Reference</span>
                  <input
                    className="pa-input"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''))}
                    placeholder="AGR-2026-0001"
                    disabled={readOnly}
                  />
                </div>
                <div className="pa-field">
                  <span className="pa-label">Status</span>
                  <SearchableDropdown
                    value={status}
                    onChange={(v: any) => setStatus((v ?? 'draft') as AgreementStatus)}
                    options={STATUS_OPTIONS}
                    hideAvatar
                    allowClear={false}
                    disabled={readOnly}
                    width={220}
                  />
                </div>
              </div>

              <div className="pa-grid-2">
                <div className="pa-field">
                  <span className="pa-label">Effective date</span>
                  <input
                    type="date"
                    className="pa-input"
                    value={effectiveDate ?? ''}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="pa-field">
                  <span className="pa-label">Expiry date</span>
                  <input
                    type="date"
                    className="pa-input"
                    value={expiryDate ?? ''}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={readOnly}
                  />
                  {errors.expiryDate && <span className="pa-error">{errors.expiryDate}</span>}
                </div>
              </div>

              <div className="pa-grid-2">
                <div className="pa-field">
                  <span className="pa-label">Client</span>
                  <input
                    className="pa-input"
                    value={partyName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
                      setPartyName(val);
                      if (!clientSignatoryTouched.current) setClientSignatoryName(val);
                    }}
                    placeholder="Client or vendor name"
                    disabled={readOnly}
                  />
                </div>
                <div className="pa-field">
                  <span className="pa-label">Client email</span>
                  <input
                    className="pa-input"
                    value={partyEmail}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s/g, '');
                      setPartyEmail(val);
                      if (errors.partyEmail) {
                        const next = { ...errors };
                        delete next.partyEmail;
                        setErrors(next);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                        setErrors((prev) => ({ ...prev, partyEmail: 'Enter a valid email address' }));
                      }
                    }}
                    placeholder="legal@client.com"
                    disabled={readOnly}
                  />
                  {errors.partyEmail && <span className="pa-error">{errors.partyEmail}</span>}
                </div>
              </div>

              <div className="pa-grid-2">
                <div className="pa-field">
                  <span className="pa-label">Client phone</span>
                  <input
                    className="pa-input"
                    value={partyPhone}
                    onChange={(e) => setPartyPhone(e.target.value.replace(/[^0-9+\s-]/g, '').substring(0, 15))}
                    placeholder="+91 80 4567 8900"
                    disabled={readOnly}
                  />
                </div>
                <div className="pa-field">
                  <span className="pa-label">Document date</span>
                  <input
                    type="date"
                    className="pa-input"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="pa-field">
                <span className="pa-label">Project kick-off</span>
                <input
                  type="date"
                  className="pa-input"
                  value={kickoffDate}
                  onChange={(e) => setKickoffDate(e.target.value)}
                  disabled={readOnly}
                />
              </div>

              {/* Its own row: the currency picker needs the width to show the
                  country beside the symbol, and the figure-and-words preview
                  underneath is a full line of text. */}
              <div className="pa-field">
                <span className="pa-label">Total project value</span>
                <div className="pa-money">
                  <SearchableDropdown
                    value={valueCurrency}
                    onChange={(v: any) => setValueCurrency(v ?? 'INR')}
                    options={currencyOptions}
                    placeholder="Currency"
                    searchPlaceholder="Find a country or currency"
                    itemNoun="currencies"
                    hideAvatar
                    disabled={readOnly}
                    width={320}
                  />
                  <input
                    className="pa-input"
                    inputMode="decimal"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    placeholder="2400000"
                    aria-label="Amount"
                    disabled={readOnly}
                  />
                </div>
                {moneyPreview ? (
                  // Exactly the string the summary row will print, so a typo in
                  // the figure is caught here rather than on the signed PDF.
                  <span className="pa-money-preview">{moneyPreview}</span>
                ) : (
                  <span className="pa-hint">Prints the symbol, figure and words.</span>
                )}
              </div>
            </div>
          </section>

          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Sign-off</div>
              <label className="pa-switch">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  disabled={readOnly}
                />
                <span>Print</span>
              </label>
            </div>
            {showSignatures && (
              <div className="pa-card-body" style={{ display: 'grid', gap: 12 }}>
                <p className="pa-hint" style={{ marginTop: 0 }}>
                  Blank fields print a rule to sign by hand.
                </p>

                <div className="pa-signblock">
                  {/* The heading is the COMPANY, and it is what prints — so it
                      tracks the field below rather than the letterhead alone. */}
                  <div className="pa-signblock-head">
                    For {signatoryCompany.trim() || branding?.companyName || 'us'}
                  </div>
                  <div className="pa-grid-2">
                    <div className="pa-field">
                      <span className="pa-label">Name</span>
                      <input
                        className="pa-input"
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''))}
                        placeholder="Who signs"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="pa-field">
                      <span className="pa-label">Position</span>
                      <input
                        className="pa-input"
                        value={signatoryPosition}
                        onChange={(e) => setSignatoryPosition(e.target.value.replace(/[^a-zA-Z\s-]/g, ''))}
                        placeholder="Director"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div className="pa-field" style={{ marginTop: 12 }}>
                    <span className="pa-label">Company name</span>
                    <input
                      className="pa-input"
                      value={signatoryCompany}
                      onChange={(e) => {
                        signatoryCompanyTouched.current = true;
                        setSignatoryCompany(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''));
                      }}
                      placeholder={branding?.companyName || 'Your company'}
                      disabled={readOnly}
                    />
                    <span className="pa-hint">Blank follows your letterhead.</span>
                  </div>
                </div>

                <div className="pa-signblock">
                  <div className="pa-signblock-head">
                    For {clientSignatoryCompany.trim() || partyName || 'the client'}
                  </div>
                  {/* Mirrors our side: name, the authority they sign under,
                      then the entity they sign for. */}
                  <div className="pa-grid-2">
                    <div className="pa-field">
                      <span className="pa-label">Name</span>
                      <input
                        className="pa-input"
                        value={clientSignatoryName}
                        onChange={(e) => {
                          clientSignatoryTouched.current = true;
                          setClientSignatoryName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''));
                        }}
                        placeholder={partyName || 'Who signs on their side'}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="pa-field">
                      <span className="pa-label">Position</span>
                      <input
                        className="pa-input"
                        value={clientSignatoryPosition}
                        onChange={(e) => setClientSignatoryPosition(e.target.value.replace(/[^a-zA-Z\s-]/g, ''))}
                        placeholder="Director"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div className="pa-field" style={{ marginTop: 12 }}>
                    <span className="pa-label">Company name</span>
                    <input
                      className="pa-input"
                      value={clientSignatoryCompany}
                      onChange={(e) => {
                        clientSignatoryCompanyTouched.current = true;
                        setClientSignatoryCompany(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''));
                      }}
                      placeholder={clientCompany || partyName || 'Their company'}
                      disabled={readOnly}
                    />
                    <span className="pa-hint">Blank prints the Company, then the Client name.</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="pa-card">
            <div className="pa-card-head">
              <div className="pa-card-title">Summary block</div>
              <button
                type="button"
                className="pa-btn"
                onClick={() =>
                  setSummaryFields(
                    summaryFields.length === SUMMARY_FIELD_KEYS.length ? [] : SUMMARY_FIELD_KEYS
                  )
                }
                disabled={readOnly}
              >
                {summaryFields.length === SUMMARY_FIELD_KEYS.length ? 'None' : 'All'}
              </button>
            </div>
            <div className="pa-card-body">
              <p className="pa-hint" style={{ marginTop: 0 }}>
                Rows printed under the letterhead. An empty row is left out.
              </p>
              <div className="pa-rowpick">
                {SUMMARY_FIELDS.map((f) => {
                  const on = summaryFields.includes(f.key);
                  return (
                    <label key={f.key} className={`pa-rowpick-item ${on ? 'is-on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={readOnly}
                        onChange={() =>
                          setSummaryFields((prev) =>
                            prev.includes(f.key)
                              ? prev.filter((k) => k !== f.key)
                              : SUMMARY_FIELD_KEYS.filter((k) => k === f.key || prev.includes(k))
                          )
                        }
                      />
                      <span className="pa-rowpick-label">{f.label}</span>
                      <span className="pa-rowpick-hint">{f.hint}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pa-field">
                <span className="pa-label">Internal notes</span>
                <textarea
                  className="pa-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Never printed on the document."
                  disabled={readOnly}
                />
              </div>
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
                Locks viewing, editing, signing, and deleting behind a secure password prompt.
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
                          placeholder={isEdit ? '(Leave blank to keep existing password)' : 'Enter custom password'}
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
                      <span className="pa-hint">Min 6 characters recommended. Unique to this agreement.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {placeholders.length > 0 && (
            <section className="pa-card">
              <div className="pa-card-head">
                <div className="pa-card-title">Template fields</div>
                {detached ? (
                  <button
                    type="button"
                    className="pa-btn"
                    onClick={() => applyTemplate(templateId, values)}
                    disabled={readOnly}
                    title="Re-apply the template with these values"
                  >
                    <FileDown size={13} /> Apply
                  </button>
                ) : (
                  <span className="pa-hint">{placeholders.length} fields</span>
                )}
              </div>
              <div className="pa-card-body" style={{ display: 'grid', gap: 12 }}>
                {placeholders.map((p) => (
                  <div className="pa-field" key={p.key}>
                    <span className="pa-label">
                      {p.label}
                      {p.required && <span style={{ color: '#ef4444' }}> *</span>}
                    </span>
                    {p.dataType === 'textarea' ? (
                      <textarea
                        className="pa-textarea"
                        value={values[p.key] ?? ''}
                        onChange={(e) => setFieldValue(p.key, e.target.value)}
                        disabled={readOnly}
                      />
                    ) : (
                      <input
                        className="pa-input"
                        type={p.dataType === 'date' ? 'date' : p.dataType === 'number' ? 'number' : 'text'}
                        value={values[p.key] ?? ''}
                        onChange={(e) => setFieldValue(p.key, e.target.value)}
                        disabled={readOnly}
                      />
                    )}
                    {errors[`v_${p.key}`] && (
                      <span className="pa-error">{errors[`v_${p.key}`]}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {templateId && placeholders.length === 0 && (
            <div className="pa-empty-note">
              <Wand2 size={15} />
              This template has no fill-in fields — everything it needs comes from the
              project and your letterhead.
            </div>
          )}
        </div>

        <div className="pa-editor-pane">
          <div className="pa-preview-bar">
            <FileText size={13} />
            <span className="pa-preview-label">Document</span>
            {errors.bodyHtml && <span className="pa-error">{errors.bodyHtml}</span>}
            <span className="pa-preview-tools pa-editor-hint">
              A4 · letterhead repeats on every page
            </span>
          </div>
          <AgreementContentEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            seedKey={seedKey}
            branding={branding}
            documentTitle={title}
            summaryRows={summaryRows}
            signoff={
              showSignatures
                ? {
                    ours: {
                      // Mirrors signoffHtml(): the company override wins, then
                      // the letterhead, then a generic word.
                      heading: `For ${signatoryCompany.trim() || branding?.companyName || 'us'}`,
                      // "Ithyaz - CEO", the way signoffHtml() composes it.
                      who: [signatoryName.trim(), signatoryPosition.trim()]
                        .filter(Boolean)
                        .join(' - '),
                    },
                    theirs: {
                      heading: `For ${clientSignatoryCompany.trim() || partyName || 'the client'}`,
                      // Mirrors signoffHtml(): their name falls back to the
                      // Client, and the position joins it the way ours does.
                      who: [
                        (clientSignatoryName || partyName).trim(),
                        clientSignatoryPosition.trim(),
                      ]
                        .filter(Boolean)
                        .join(' - '),
                    },
                  }
                : null
            }
            editable={!readOnly}
            onDirty={() => setDetached(true)}
          />
        </div>

        {showPreview && (
          <DocumentPreview
            html=""
            pdfUrl={previewPdf?.url ?? null}
            pageCount={previewPdf?.pageCount ?? 0}
            downloadName={downloadName}
            label="Pages"
            title={title || 'Agreement preview'}
            loading={previewing}
            emptyHint="Write the agreement, or apply a template, to see it paginated here."
          />
        )}
      </div>

      <PasswordUnlockModal
        open={isTemplateLocked}
        documentTitle={template?.name || 'Agreement Template'}
        scope={templateLockScope}
        onUnlock={handleTemplateUnlock}
        onCancel={handleTemplateCancel}
      />
    </>
  );
}
