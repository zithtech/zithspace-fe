'use client';

/**
 * One agreement, in a drawer over the list.
 *
 * VIEWING IS NOT NAVIGATION. Checking what a contract says is something you do
 * while working through a list — reading three in a row and going back to the
 * list between each is the same list, re-fetched, re-scrolled, re-filtered.
 * A drawer keeps the list exactly where it was underneath.
 *
 * EDITING still takes the whole screen. The composer is a two-column authoring
 * surface with a live A4 preview; squeezing it into a drawer would make it
 * worse at the only thing it does.
 *
 * Details on the left, the document on the right — the same arrangement the
 * standalone page used, because it is the right one: the metadata is a short
 * column and the document is a tall page.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from 'antd';
import {
  Building2,
  CalendarCheck,
  CalendarX,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Hash,
  Layers,
  Link2,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import DocumentPreview from '@/components/project-agreements/DocumentPreview';
import {
  DetailHero,
  DetailNote,
  DetailRow,
  DetailSection,
} from '@/components/project-agreements/detailChrome';
import { usePermission } from '@/hooks/usePermission';
import {
  AGREEMENT_STATUS_META,
  Agreement,
  AgreementStatus,
  ProjectAgreementsService,
  amountInWords,
  formatMoney,
} from '@/services/projectAgreementsService';

const STATUS_OPTIONS = (Object.keys(AGREEMENT_STATUS_META) as AgreementStatus[]).map((s) => ({
  value: s,
  label: AGREEMENT_STATUS_META[s].label,
}));

interface Props {
  /** The agreement to show. null closes the drawer. */
  id: string | null;
  onClose: () => void;
  /** Fired when the record changed under the list — status, or a delete. */
  onChanged?: () => void;
}

export default function AgreementDetailDrawer({ id, onClose, onChanged }: Props) {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  /**
   * The stored document as real pages.
   *
   * The same preview-pdf endpoint the composer uses, fed this agreement's own
   * fields — so viewing a saved contract shows the same paginated document
   * that creating one did. Nothing is stored; the link button is the path that
   * writes to R2.
   */
  const [preview, setPreview] = useState<{ url: string; pageCount: number } | null>(null);
  const previewUrl = useRef<string | null>(null);

  const revoke = () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
  };

  const load = useCallback(async (agreementId: string) => {
    setLoading(true);
    try {
      const record = await ProjectAgreementsService.getAgreement(agreementId);
      setAgreement(record);

      const rendered = await ProjectAgreementsService.previewPdf({
        projectId: record.projectId,
        title: record.title,
        documentNumber: record.documentNumber,
        // The stored snapshot, already substituted — never re-rendered from the
        // template, which may have moved on since this was signed.
        bodyHtml: record.contentHtml,
        client: record.partyName,
        clientCompany: record.clientCompany,
        clientEmail: record.partyEmail,
        clientPhone: record.partyPhone,
        kickoffDate: record.kickoffDate,
        documentDate: record.documentDate,
        totalValue: record.totalValue,
        valueCurrency: record.valueCurrency,
        summaryFields: record.summaryFields,
        signatoryName: record.signatoryName,
        signatoryPosition: record.signatoryPosition,
        signatoryCompany: record.signatoryCompany,
        clientSignatoryName: record.clientSignatoryName,
        clientSignatoryPosition: record.clientSignatoryPosition,
        clientSignatoryCompany: record.clientSignatoryCompany,
        showSignatures: record.showSignatures,
      });
      revoke();
      previewUrl.current = rendered.url;
      setPreview(rendered);
    } catch (err: any) {
      toast.error(err?.message || 'Could not load that agreement');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose]);

  useEffect(() => {
    if (!id) {
      // Drop the previous document rather than leaving it behind the next
      // open — a drawer that briefly shows the last contract you looked at is
      // worse than one that shows a spinner.
      revoke();
      setAgreement(null);
      setPreview(null);
      return;
    }
    load(id);
  }, [id, load]);

  useEffect(() => revoke, []);

  const handleStatus = async (next: AgreementStatus) => {
    if (!agreement) return;
    try {
      const updated = await ProjectAgreementsService.setAgreementStatus(agreement.id, next);
      setAgreement(updated);
      toast.success(`Marked ${AGREEMENT_STATUS_META[next].label.toLowerCase()}`);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Could not change the status');
    }
  };

  const fileName = agreement
    ? `${(agreement.documentNumber || agreement.title || 'agreement')
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')}.pdf`
    : 'agreement.pdf';

  /**
   * Save the file. The pane has already rendered these bytes, so this is
   * instant and cannot hand back a different document from the one on screen.
   */
  const handleDownload = () => {
    if (!preview?.url) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /**
   * A SHAREABLE copy, which is a different job from downloading one: this
   * renders to R2 and records the URL, so the link survives being pasted into
   * a ticket. The download above never touches the server.
   */
  const handleStorePdf = async () => {
    if (!agreement) return;
    setPdfBusy(true);
    try {
      const { pdfUrl } = await ProjectAgreementsService.generatePdf(agreement.id);
      setAgreement({ ...agreement, pdfUrl });
      toast.success('Shareable link ready — see Latest PDF');
    } catch (err: any) {
      toast.error(err?.message || 'Could not generate the PDF');
    } finally {
      setPdfBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!agreement) return;
    if (!window.confirm(`Delete "${agreement.title}"?`)) return;
    try {
      await ProjectAgreementsService.deleteAgreement(agreement.id);
      toast.success('Agreement deleted');
      onClose();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete that agreement');
    }
  };

  const meta = agreement ? AGREEMENT_STATUS_META[agreement.status] : null;

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
      {/* The drawer's own header, built from pa-header so it matches every
          other surface in the module rather than antd's default. */}
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
            <div className="pa-header-title">{agreement?.title || 'Agreement'}</div>
            <div className="pa-header-sub">
              {agreement
                ? [
                    agreement.documentTypeName,
                    agreement.documentNumber || 'No reference',
                    agreement.projectName,
                    agreement.templateName
                      ? `${agreement.templateName} v${agreement.templateVersion ?? 1}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : 'Loading…'}
            </div>
          </div>
        </div>

        {agreement && (
          <div className="pa-header-actions">
            {meta && (
              <span className="pa-chip" style={{ background: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
            )}
            {perms.canUpdateAgreement && (
              <SearchableDropdown
                value={agreement.status}
                onChange={(v: any) => v && handleStatus(v as AgreementStatus)}
                options={STATUS_OPTIONS}
                hideAvatar
                allowClear={false}
                width={200}
                style={{ minWidth: 150 }}
              />
            )}
            <button
              type="button"
              className="pa-btn"
              onClick={handleDownload}
              disabled={!preview?.url}
              title="Save this document as a PDF"
            >
              <Download size={14} /> Download
            </button>
            <button
              type="button"
              className="pa-btn"
              onClick={handleStorePdf}
              disabled={pdfBusy}
              title="Create a shareable link to a stored copy"
              aria-label="Create a shareable link"
              style={{ width: 32, padding: 0, justifyContent: 'center' }}
            >
              {pdfBusy ? <ZukvoLoader size="sm" /> : <Link2 size={14} />}
            </button>
            {perms.canUpdateAgreement && (
              <button
                type="button"
                className="pa-btn pa-btn-primary"
                onClick={() =>
                  // Editing leaves the drawer: the composer needs the screen.
                  router.push(`/project-agreements/agreements/${agreement.id}?edit=1`)
                }
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            {perms.canDeleteAgreement && (
              <button type="button" className="pa-btn pa-btn-danger" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {loading || !agreement ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <ZukvoLoader size="md" />
        </div>
      ) : (
        <div className="pa-detail">
          <aside className="pa-detail-side">
            {/* The figure and the same figure in words — the pair a reader
                checks against each other before anything else. */}
            <DetailHero
              eyebrow="Total project value"
              value={formatMoney(agreement.totalValue, agreement.valueCurrency)}
              caption={amountInWords(agreement.totalValue, agreement.valueCurrency)}
              tint={meta?.color}
            />

            <DetailSection title="Document">
              <DetailRow
                icon={<Layers size={13} />}
                label="Type"
                value={agreement.documentTypeName}
                sub={agreement.documentTypeCode}
              />
              <DetailRow
                icon={<Hash size={13} />}
                label="Reference"
                value={agreement.documentNumber}
                mono
              />
              <DetailRow
                icon={<FileText size={13} />}
                label="Project"
                value={agreement.projectName}
                sub={agreement.projectCode}
              />
              <DetailRow
                icon={<FileSignature size={13} />}
                label="Template"
                value={agreement.templateName}
                sub={
                  agreement.templateName ? `v${agreement.templateVersion ?? 1}` : null
                }
              />
            </DetailSection>

            <DetailSection title="Counterparty">
              <DetailRow
                icon={<Building2 size={13} />}
                label="Company"
                value={agreement.clientCompany}
              />
              <DetailRow
                icon={<User size={13} />}
                label="Contact"
                value={agreement.partyName}
              />
              <DetailRow
                icon={<Mail size={13} />}
                label="Email"
                value={agreement.partyEmail}
              />
              <DetailRow
                icon={<Phone size={13} />}
                label="Phone"
                value={agreement.partyPhone}
              />
            </DetailSection>

            <DetailSection title="Dates">
              <DetailRow
                icon={<CalendarCheck size={13} />}
                label="Effective"
                value={formatDate(agreement.effectiveDate)}
              />
              <DetailRow
                icon={<CalendarX size={13} />}
                label="Expires"
                value={formatDate(agreement.expiryDate)}
              />
              <DetailRow
                icon={<Clock size={13} />}
                label="Kick-off"
                value={formatDate(agreement.kickoffDate)}
              />
            </DetailSection>

            <DetailSection title="Sign-off">
              {/* Fixed labels, not the company names: a label column is 74px
                  wide and "Zithtech Solutions Pvt Ltd" truncated to that says
                  less than "Our side" does. The company goes in the value,
                  where it has room. */}
              <DetailRow
                icon={<FileSignature size={13} />}
                label="Our side"
                value={agreement.signatoryName}
                sub={[agreement.signatoryPosition, agreement.signatoryCompany]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <DetailRow
                icon={<FileSignature size={13} />}
                label="Their side"
                value={agreement.clientSignatoryName}
                sub={[
                  agreement.clientSignatoryPosition,
                  agreement.clientSignatoryCompany || agreement.clientCompany,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </DetailSection>

            <DetailNote title="Internal notes" text={agreement.notes} />

            <DetailSection title="History">
              <DetailRow label="Created" value={formatDate(agreement.createdAt)} />
              <DetailRow label="Last updated" value={formatDate(agreement.updatedAt)} />
              {/* The question people chase up about: has it actually reached
                  a human on their side? */}
              <DetailRow
                icon={<Eye size={13} />}
                label="Client viewed"
                value={formatDate(agreement.portalViewedAt)}
              />
            </DetailSection>

            {agreement.pdfUrl && (
              <a
                className="pa-dt-link"
                href={agreement.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 size={13} /> Open the stored PDF
              </a>
            )}
          </aside>

          <DocumentPreview
            html=""
            pdfUrl={preview?.url ?? null}
            pageCount={preview?.pageCount ?? 0}
            downloadName={agreement.documentNumber || agreement.title}
            label="Pages"
            title={agreement.title}
            emptyHint="This agreement has no rendered content."
            // A whole A4 sheet in view: the drawer is for reading a document,
            // and a page cropped at the fold is not one.
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
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}
