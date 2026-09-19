import { api, apiClient } from "@/lib/axios";

/**
 * Project Agreements — agreement templates and the documents raised from them
 * against a project.
 *
 * TWO KINDS OF ENDPOINT LIVE HERE, and they are called differently on purpose:
 *
 *   JSON   goes through `api`, which unwraps the { success, data } envelope.
 *   HTML   goes through `apiClient` directly. The preview endpoints return a
 *          whole rendered document, not an envelope, so `api` would look for
 *          `.success` on a string and throw.
 */

const BASE = "/api/project-agreements";

export type TemplateStatus = "draft" | "published" | "archived";
export type DocumentTypeStatus = "active" | "inactive";
export type AgreementStatus = "draft" | "pending" | "active" | "expired" | "terminated";
export type PlaceholderType = "text" | "textarea" | "number" | "date" | "currency";
export type PlaceholderSource = "manual" | "project" | "company";

export interface TemplatePlaceholder {
  id?: string;
  templateId?: string;
  key: string;
  label: string;
  dataType: PlaceholderType;
  source: PlaceholderSource;
  required: boolean;
  defaultValue: string | null;
  displayOrder: number;
}

/**
 * A kind of document — Proposal, MSA, NDA, Change Order.
 *
 * `code` is the stable machine name and `name` is free to change, which is why
 * they are two fields. Managed in Settings › Document Types.
 */
export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: DocumentTypeStatus;
  /** Live templates and agreements citing it — both block a delete. */
  templateCount?: number;
  agreementCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTypePayload {
  name: string;
  code: string;
  description?: string | null;
  status: DocumentTypeStatus;
}

export interface AgreementTemplate {
  id: string;
  name: string;
  /** Required. Nullable only on rows predating migration 011. */
  documentTypeId: string | null;
  documentTypeName: string | null;
  documentTypeCode: string | null;
  /** The free text this replaced. Kept as provenance, no longer surfaced. */
  category: string | null;
  description: string | null;
  bodyHtml: string;
  status: TemplateStatus;
  version: number;
  placeholders: TemplatePlaceholder[];
  agreementCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The summary block printed under the letterhead. Mirrors SUMMARY_FIELDS on the
 * server — one ordered registry, so the composer offers exactly the rows the
 * renderer knows how to print.
 */
export const SUMMARY_FIELDS = [
  { key: 'title', label: 'Title', hint: 'The document name' },
  { key: 'client', label: 'Client', hint: 'Counterparty name' },
  { key: 'kickoff', label: 'Project Kick-off', hint: 'Kick-off date' },
  { key: 'value', label: 'Total Project Value', hint: 'Contract value' },
  { key: 'contacts', label: 'Client Contacts', hint: 'Email and phone' },
  // Key stays 'date' — renaming it would orphan stored summaryFields arrays.
  { key: 'date', label: 'Issue Date', hint: 'When the paper was issued' },
  { key: 'reference', label: 'Reference', hint: 'Document number' },
  { key: 'project', label: 'Project', hint: 'Project name and code' },
  // Appended, never inserted — the key order is the print order.
  { key: 'company', label: 'Company', hint: 'Client company name' },
] as const;

/**
 * Rows that share a line, split by a divider. Mirrors SUMMARY_PAIRS on the
 * server, so the editor sheet groups exactly as the renderer does. A pair
 * collapses to a single full-width row when only one half has a value.
 */
export const SUMMARY_PAIRS: ReadonlyArray<readonly [string, string]> = [['kickoff', 'date']];

export type SummaryFieldKey = (typeof SUMMARY_FIELDS)[number]['key'];
export const SUMMARY_FIELD_KEYS = SUMMARY_FIELDS.map((f) => f.key) as SummaryFieldKey[];

export interface Agreement {
  id: string;
  /** Required. Nullable only on rows predating migration 011. */
  documentTypeId: string | null;
  /** Snapshot — renaming a type never relabels a signed document. */
  documentTypeName: string | null;
  documentTypeCode: string | null;
  /** null when the document is not raised against a project. */
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  templateId: string | null;
  templateName: string | null;
  templateVersion: number | null;
  /** The DOCUMENT NAME — printed top-left of every page. */
  title: string;
  /** The summary block's Title row. Falls back to `title` when blank. */
  summaryTitle: string | null;
  documentNumber: string | null;
  contentHtml: string;
  status: AgreementStatus;
  effectiveDate: string | null;
  expiryDate: string | null;
  documentDate: string | null;
  kickoffDate: string | null;
  /** Decimal string — numeric arrives as text so large values stay exact. */
  totalValue: string | null;
  valueCurrency: string | null;
  /** The client this document is addressed to, when one was picked. */
  clientId: string | null;
  /** The client's COMPANY, snapshot at save time. Prints as its own row. */
  clientCompany: string | null;
  /** The contact it is addressed to, when one was picked. */
  clientContactId: string | null;
  partyName: string | null;
  partyEmail: string | null;
  partyPhone: string | null;
  /** Our signatory — name and the authority they sign under. */
  signatoryName: string | null;
  signatoryPosition: string | null;
  /** The entity WE sign for. Falls back to the letterhead's company name. */
  signatoryCompany: string | null;
  /** Theirs. Falls back to partyName when blank. */
  clientSignatoryName: string | null;
  /** The authority THEY sign under — their half of "Name - Position". */
  clientSignatoryPosition: string | null;
  /** The entity THEY sign for. Falls back to partyName. */
  clientSignatoryCompany: string | null;
  showSignatures: boolean;
  /** Which summary rows to print. null means all of them. */
  summaryFields: SummaryFieldKey[] | null;
  notes: string | null;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  /** When the client first opened it in the portal. null means never. */
  portalViewedAt: string | null;
  values?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementStats {
  total: number;
  draft: number;
  pending: number;
  active: number;
  expired: number;
  terminated: number;
  /** Live documents lapsing inside EXPIRING_SOON_DAYS. */
  expiringSoon: number;
  /** Raised before Document Types existed and never reclassified. */
  untyped: number;
  /** Count per document type id — what the rail counts each type by. */
  byType: Record<string, number>;
}

/** Mirrors EXPIRING_SOON_DAYS on the server. */
export const EXPIRING_SOON_DAYS = 30;

export interface Branding {
  companyName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  /** The authorised signature image, printed in our side of the sign-off. */
  signatureUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  /** Free-text "where we are" line, e.g. "Chennai-91, India". */
  location: string | null;
  footerNote: string | null;
  updatedAt?: string;
}

/** A row in the composer's client picker. */
export interface ClientOption {
  id: string;
  companyName: string;
  clientCode: string | null;
  status: string | null;
  website: string | null;
  billingAddress: string | null;
}

/** Somebody at that client the document can be addressed to. */
export interface ClientContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  designation: string | null;
  department: string | null;
  contactType: string | null;
  isPrimary: boolean | null;
  officialEmail: string | null;
  secondaryEmail: string | null;
  mobileNumber: string | null;
  alternatePhone: string | null;
  officeLandline: string | null;
  status: string | null;
}

export interface ProjectOption {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  managerName: string | null;
  managerEmail: string | null;
}

export interface TemplatePayload {
  name: string;
  documentTypeId: string;
  category?: string | null;
  description?: string | null;
  bodyHtml: string;
  status: TemplateStatus;
  placeholders: Array<Omit<TemplatePlaceholder, "id" | "templateId">>;
}

export interface AgreementPayload {
  /** Mandatory: every document has a kind, and it is known at creation. */
  documentTypeId: string;
  /** Optional — an NDA or MSA is signed before there is a project to tie it to. */
  projectId?: string | null;
  templateId?: string | null;
  title: string;
  summaryTitle?: string | null;
  documentNumber?: string | null;
  contentHtml?: string;
  useCustomContent?: boolean;
  status: AgreementStatus;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  documentDate?: string | null;
  kickoffDate?: string | null;
  totalValue?: string | number | null;
  valueCurrency?: string | null;
  clientId?: string | null;
  clientCompany?: string | null;
  clientContactId?: string | null;
  partyName?: string | null;
  partyEmail?: string | null;
  partyPhone?: string | null;
  signatoryName?: string | null;
  signatoryPosition?: string | null;
  /** The entity WE sign for. Blank falls back to the letterhead's company. */
  signatoryCompany?: string | null;
  clientSignatoryName?: string | null;
  clientSignatoryPosition?: string | null;
  /** The entity THEY sign for. Blank falls back to the Client name. */
  clientSignatoryCompany?: string | null;
  showSignatures?: boolean;
  summaryFields?: SummaryFieldKey[] | null;
  notes?: string | null;
  values: Record<string, string>;
}

const query = (params: Record<string, any>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export const ProjectAgreementsService = {
  /* ── Templates ─────────────────────────────────────────────────────── */

  listTemplates: (params: {
    status?: TemplateStatus;
    search?: string;
    publishedOnly?: boolean;
  } = {}): Promise<AgreementTemplate[]> =>
    api.get(`${BASE}/templates${query(params)}`),

  getTemplate: (id: string): Promise<AgreementTemplate> =>
    api.get(`${BASE}/templates/${id}`),

  createTemplate: (payload: TemplatePayload): Promise<AgreementTemplate> =>
    api.post(`${BASE}/templates`, payload),

  updateTemplate: (id: string, payload: TemplatePayload): Promise<AgreementTemplate> =>
    api.put(`${BASE}/templates/${id}`, payload),

  setTemplateStatus: (id: string, status: TemplateStatus): Promise<AgreementTemplate> =>
    api.post(`${BASE}/templates/${id}/status`, { status }),

  duplicateTemplate: (id: string): Promise<AgreementTemplate> =>
    api.post(`${BASE}/templates/${id}/duplicate`, {}),

  deleteTemplate: (id: string): Promise<{ id: string }> =>
    api.delete(`${BASE}/templates/${id}`),

  /* ── Agreements ────────────────────────────────────────────────────── */

  listAgreements: (params: {
    projectId?: string;
    /** Every document addressed to one client. */
    clientId?: string;
    status?: AgreementStatus;
    templateId?: string;
    documentTypeId?: string;
    search?: string;
    /** Live documents lapsing within N days. */
    expiringWithinDays?: number;
  } = {}): Promise<{ items: Agreement[]; stats: AgreementStats }> =>
    api.get(`${BASE}/agreements${query(params)}`),

  getAgreement: (id: string): Promise<Agreement> =>
    api.get(`${BASE}/agreements/${id}`),

  createAgreement: (payload: AgreementPayload): Promise<Agreement> =>
    api.post(`${BASE}/agreements`, payload),

  updateAgreement: (id: string, payload: AgreementPayload): Promise<Agreement> =>
    api.put(`${BASE}/agreements/${id}`, payload),

  setAgreementStatus: (id: string, status: AgreementStatus): Promise<Agreement> =>
    api.post(`${BASE}/agreements/${id}/status`, { status }),

  deleteAgreement: (id: string): Promise<{ id: string }> =>
    api.delete(`${BASE}/agreements/${id}`),

  /** A template's wording with tokens filled — seeds the composer's editor. */
  composeBody: (payload: {
    templateId: string;
    projectId?: string | null;
    values?: Record<string, string>;
  }): Promise<{ bodyHtml: string; templateName: string; templateVersion: number }> =>
    api.post(`${BASE}/agreements/compose-body`, payload),

  nextDocumentNumber: (): Promise<{ documentNumber: string }> =>
    api.get(`${BASE}/agreements/next-number`),

  generatePdf: (id: string): Promise<{ pdfUrl: string }> =>
    api.post(`${BASE}/agreements/${id}/pdf`, {}),

  /* ── Rendered documents (HTML, not JSON) ───────────────────────────── */

  /** The stored document, letterhead and all. */
  agreementHtml: async (id: string): Promise<string> => {
    const res = await apiClient.get(`${BASE}/agreements/${id}/html`, {
      responseType: "text",
      transformResponse: [(d: any) => d],
    });
    return res.data as string;
  },

  /** Live preview while composing — nothing is stored. */
  previewAgreement: async (payload: {
    templateId?: string | null;
    projectId?: string | null;
    title?: string;
    documentNumber?: string | null;
    bodyHtml?: string;
    values?: Record<string, string>;
    /* The summary block under the letterhead. */
    client?: string | null;
    clientEmail?: string | null;
    clientPhone?: string | null;
    kickoffDate?: string | null;
    totalValue?: string | number | null;
    valueCurrency?: string | null;
    documentDate?: string | null;
    summaryFields?: SummaryFieldKey[] | null;
    /**
     * Whether to print the sign-off block. Defaults to true server-side, so a
     * surface that must not show one has to say so — the template previews do.
     */
    showSignatures?: boolean;
  }): Promise<string> => {
    const res = await apiClient.post(`${BASE}/agreements/preview`, payload, {
      responseType: "text",
      transformResponse: [(d: any) => d],
    });
    return res.data as string;
  },

  /**
   * The same document as REAL PAGES — a PDF, rendered by the same printer that
   * produces the download, so the preview cannot disagree with it about where
   * the pages break or which header sits on page three.
   *
   * Returns an object URL the caller must revoke; holding on to them leaks a
   * document per keystroke.
   */
  previewPdf: async (payload: {
    templateId?: string | null;
    projectId?: string | null;
    title?: string;
    summaryTitle?: string | null;
    documentNumber?: string | null;
    bodyHtml?: string;
    values?: Record<string, string>;
    client?: string | null;
    clientCompany?: string | null;
    clientEmail?: string | null;
    clientPhone?: string | null;
    kickoffDate?: string | null;
    totalValue?: string | number | null;
    valueCurrency?: string | null;
    documentDate?: string | null;
    summaryFields?: SummaryFieldKey[] | null;
    signatoryName?: string | null;
    signatoryPosition?: string | null;
    signatoryCompany?: string | null;
    clientSignatoryName?: string | null;
    clientSignatoryPosition?: string | null;
    clientSignatoryCompany?: string | null;
    showSignatures?: boolean;
  }): Promise<{ url: string; pageCount: number }> => {
    const res = await apiClient.post(`${BASE}/agreements/preview-pdf`, payload, {
      responseType: 'blob',
    });
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
    return {
      url: URL.createObjectURL(blob),
      pageCount: Number(res.headers?.['x-page-count']) || 1,
    };
  },

  /** The letterhead over sample wording, for the branding page. */
  previewLetterhead: async (): Promise<string> => {
    const res = await apiClient.get(`${BASE}/branding/preview`, {
      responseType: "text",
      transformResponse: [(d: any) => d],
    });
    return res.data as string;
  },

  /* ── Branding ──────────────────────────────────────────────────────── */

  getBranding: (): Promise<Branding> => api.get(`${BASE}/branding`),

  saveBranding: (payload: Partial<Branding>): Promise<Branding> =>
    api.put(`${BASE}/branding`, payload),

  /** `image` is a data: URI — the server validates type and size. */
  uploadLogo: (image: string): Promise<Branding> =>
    api.post(`${BASE}/branding/logo`, { image }),

  /** The authorised signature image, printed in the sign-off block. */
  uploadSignature: (image: string): Promise<Branding> =>
    api.post(`${BASE}/branding/signature`, { image }),

  removeSignature: (): Promise<Branding> => api.delete(`${BASE}/branding/signature`),

  /* ── Projects ──────────────────────────────────────────────────────── */

  /* ── Settings › Document Types ─────────────────────────────────────── */

  listDocumentTypes: (params: {
    search?: string;
    status?: DocumentTypeStatus;
    /** The pickers pass this; the settings tab wants everything. */
    activeOnly?: boolean;
  } = {}): Promise<DocumentType[]> =>
    api.get(`${BASE}/document-types${query(params)}`),

  createDocumentType: (payload: DocumentTypePayload): Promise<DocumentType> =>
    api.post(`${BASE}/document-types`, payload),

  updateDocumentType: (id: string, payload: DocumentTypePayload): Promise<DocumentType> =>
    api.put(`${BASE}/document-types/${id}`, payload),

  deleteDocumentType: (id: string): Promise<{ id: string }> =>
    api.delete(`${BASE}/document-types/${id}`),

  /* ── Clients ───────────────────────────────────────────────────────── */

  /** Active clients a document can be addressed to. */
  listClients: (search?: string): Promise<ClientOption[]> =>
    api.get(`${BASE}/clients${query({ search })}`),

  /** One client plus everyone at it the document could be sent to. */
  listClientContacts: (
    id: string
  ): Promise<{ client: ClientOption; contacts: ClientContact[] }> =>
    api.get(`${BASE}/clients/${id}/contacts`),

  listProjects: (search?: string): Promise<ProjectOption[]> =>
    api.get(`${BASE}/projects${query({ search })}`),

  getProjectContext: (
    id: string
  ): Promise<{ project: ProjectOption; tokens: Record<string, string> }> =>
    api.get(`${BASE}/projects/${id}`),
};

/* ── Shared display helpers ────────────────────────────────────────────── */

export {
  CURRENCIES,
  currencyOf,
  formatMoney,
  formatMoneyWithWords,
  amountInWords,
} from "./agreementMoney";
export type { CurrencyDef } from "./agreementMoney";


/**
 * Status colours. Blue for in-flight, green for live, ash for finished, and a
 * light red reserved for terminated — the palette the rest of the app uses.
 */
export const AGREEMENT_STATUS_META: Record<
  AgreementStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  pending: { label: "Pending", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  active: { label: "Active", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  expired: { label: "Expired", color: "#94a3b8", bg: "rgba(148,163,184,0.16)" },
  terminated: { label: "Terminated", color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
};

/** Active is green, inactive is ash — the palette every status chip uses. */
export const DOCUMENT_TYPE_STATUS_META: Record<
  DocumentTypeStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  inactive: { label: "Inactive", color: "#94a3b8", bg: "rgba(148,163,184,0.16)" },
};

/**
 * "Test Proposal" → "TEST_PROPOSAL".
 *
 * Offered as you type the name and then left alone: a code is what other
 * systems key on, so it must not quietly follow a rename.
 */
export const codeFromName = (name: string): string =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

export const TEMPLATE_STATUS_META: Record<
  TemplateStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  published: { label: "Published", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  archived: { label: "Archived", color: "#94a3b8", bg: "rgba(148,163,184,0.16)" },
};

/** Tokens the composer resolves itself — never rendered as form fields. */
export const AUTO_TOKENS: Array<{ key: string; label: string }> = [
  { key: "company_name", label: "Company name" },
  { key: "company_tagline", label: "Company tagline" },
  { key: "company_phone", label: "Company phone" },
  { key: "company_email", label: "Company email" },
  { key: "company_website", label: "Company website" },
  { key: "company_location", label: "Company location" },
  { key: "project_name", label: "Project name" },
  { key: "project_code", label: "Project code" },
  { key: "project_description", label: "Project description" },
  { key: "project_status", label: "Project status" },
  { key: "project_start_date", label: "Project start date" },
  { key: "project_end_date", label: "Project end date" },
  { key: "project_manager", label: "Project manager" },
  { key: "project_manager_email", label: "Project manager email" },
  { key: "today", label: "Today's date" },
];

/** Every {{token}} a body references. Mirrors tokensIn() on the server. */
export const tokensIn = (html: string): string[] => {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html ?? "")) !== null) found.add(m[1]);
  return [...found];
};

const AUTO_KEYS = new Set(AUTO_TOKENS.map((t) => t.key));

/** The tokens a person actually has to answer, in body order. */
export const manualTokensIn = (html: string): string[] =>
  tokensIn(html).filter((k) => !AUTO_KEYS.has(k));

export const humanise = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
