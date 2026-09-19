import { portalApi } from "@/lib/portalAxios";

/**
 * Agreements as the client sees them.
 *
 * TWO STATUSES, deliberately. `status` is where the document stands and
 * `viewStatus` is whether anyone on the client's side has opened it — separate
 * facts that a single field cannot carry. Drafts never reach this endpoint;
 * the server filters them in SQL.
 */

/** Never 'draft' — the server will not serve one. */
export type PortalAgreementStatus = "pending" | "active" | "expired" | "terminated";
export type PortalViewStatus = "VIEWED" | "NOT_VIEWED";

export interface PortalAgreementListItem {
  id: string;
  title: string;
  documentNumber: string | null;
  documentTypeName: string | null;
  documentTypeCode: string | null;
  status: PortalAgreementStatus | string;
  effectiveDate: string | null;
  expiryDate: string | null;
  documentDate: string | null;
  totalValue: string | null;
  valueCurrency: string | null;
  projectName: string | null;
  /** When it was first opened here. null means never. */
  portalViewedAt: string | null;
  viewStatus: PortalViewStatus;
  viewStatusLabel: string;
  pdfUrl: string | null;
  updatedAt: string;
}

export interface PortalAgreementDetail extends PortalAgreementListItem {
  /** The stored snapshot — the wording as it was agreed. */
  contentHtml: string;
}

export interface PortalAgreementStats {
  total: number;
  pending: number;
  active: number;
  notViewed: number;
}

export const portalAgreementService = {
  list: (): Promise<{ items: PortalAgreementListItem[]; stats: PortalAgreementStats }> =>
    portalApi.get("/api/client-portal/agreements"),

  /** Opening it is what marks it viewed — first time only. */
  detail: (id: string): Promise<PortalAgreementDetail> =>
    portalApi.get(`/api/client-portal/agreements/${id}`),
};

export default portalAgreementService;
