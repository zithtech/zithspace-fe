"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Empty, notification, Modal, Input } from "antd";
import {
  ArrowLeft,
  CheckSquare,
  CheckCircle2,
  XCircle,
  Hourglass,
  Calendar,
  FileText,
  Download,
  Link2,
  ExternalLink,
  Activity,
  Users,
  User as UserIcon } from "lucide-react";
import {
  portalApprovalsService,
  PortalApprovalDetail,
  PortalApprovalApprover } from "@/services/portalApprovalsService";
import {

  p,
  TONE,
  STATUS_META,
  SUBJECT_LABEL,
  fmtDate,
  fmtDateTime,
  fmtRelative } from "../_ui";

/* --------------------------------------------------------------- */

export default function PortalApprovalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState<PortalApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();
  const [decisionOpen, setDecisionOpen] = useState<
    null | "approved" | "rejected"
  >(null);

  const load = async () => {
    if (!id) return;
    try {
      setData(await portalApprovalsService.detail(id));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center" }}
      >
        <LoadingSpinner size="large" fullScreen={false} />
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Approval not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => router.push("/portal/approvals")}
            style={{
              padding: "8px 14px",
              background: p.text,
              color: "#ffffff",
              border: `1px solid ${p.text}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer" }}
          >
            Back to approvals
          </button>
        </div>
      </div>
    );
  }

  const st = STATUS_META[data.status] || STATUS_META.open;
  const StIcon = st.icon;
  const isMyTurn =
    data.me && !data.me.decision && data.status === "open";
  const isApproverButDecided = data.me && data.me.decision;

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1080 }}>
      {contextHolder}

      <button
        type="button"
        onClick={() => router.push("/portal/approvals")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          background: "transparent",
          border: "none",
          color: p.textMuted,
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 14 }}
      >
        <ArrowLeft size={14} />
        Back to approvals
      </button>

      {/* Header */}
      <div
        style={{
          padding: 24,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16 }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: isMyTurn ? p.warningBg : p.accentBg,
              color: isMyTurn ? p.warningText : p.accentText,
              border: `1px solid ${
                isMyTurn ? p.warningBorder : p.accentBorder
              }`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0 }}
          >
            <CheckSquare size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap" }}
            >
              <span
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 11.5,
                  padding: "1px 7px",
                  background: p.surfaceMuted,
                  border: `1px solid ${p.border}`,
                  borderRadius: 6,
                  color: p.textMuted }}
              >
                {data.approvalNumber}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  background: TONE[st.tone].bg,
                  border: `1px solid ${TONE[st.tone].border}`,
                  color: TONE[st.tone].text,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500 }}
              >
                <StIcon size={11} />
                {st.label}
              </span>
              <span
                style={{
                  padding: "2px 9px",
                  background: p.purpleBg,
                  border: `1px solid ${p.purpleBorder}`,
                  color: p.purpleText,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500 }}
              >
                {SUBJECT_LABEL[data.subjectType] || data.subjectType}
              </span>
            </div>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: 22,
                fontWeight: 600,
                color: p.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.25 }}
            >
              {data.title}
            </h1>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                fontSize: 12.5,
                color: p.textSubtle }}
            >
              {data.subjectLabel && <span>{data.subjectLabel}</span>}
              {data.projectName && (
                <span>
                  📁 {data.projectName}
                  {data.projectCode ? ` · ${data.projectCode}` : ""}
                </span>
              )}
              {data.requestedByName && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4 }}
                >
                  <UserIcon size={11} />
                  Requested by {data.requestedByName}
                </span>
              )}
              {data.dueDate && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    color:
                      new Date(data.dueDate) < new Date() &&
                      data.status === "open"
                        ? p.dangerText
                        : p.textSubtle,
                    fontWeight:
                      new Date(data.dueDate) < new Date() &&
                      data.status === "open"
                        ? 600
                        : 500 }}
                >
                  <Calendar size={11} />
                  Due {fmtDateTime(data.dueDate)}
                </span>
              )}
            </div>
            {data.description && (
              <div
                style={{
                  marginTop: 14,
                  fontSize: 13.5,
                  color: p.textMuted,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap" }}
              >
                {data.description}
              </div>
            )}
            {data.previewUrl && (
              <a
                href={data.previewUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  borderRadius: 8,
                  color: p.accentText,
                  fontSize: 12.5,
                  textDecoration: "none",
                  fontWeight: 500 }}
              >
                <Link2 size={13} />
                Open preview
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Your decision banner */}
        {isMyTurn && (
          <div
            style={{
              marginTop: 18,
              padding: "16px 18px",
              background: p.warningBg,
              border: `1px solid ${p.warningBorder}`,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Hourglass size={18} color={p.warningText} />
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: p.warningText }}
                >
                  Awaiting your sign-off
                </div>
                <div style={{ fontSize: 12, color: p.warningText }}>
                  Review the materials below. Your decision is recorded
                  permanently — please be deliberate.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setDecisionOpen("rejected")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "#ffffff",
                  color: p.dangerText,
                  border: `1px solid ${p.dangerBorder}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer" }}
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => setDecisionOpen("approved")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: p.success,
                  color: "#ffffff",
                  border: `1px solid ${p.success}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer" }}
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
            </div>
          </div>
        )}
        {isApproverButDecided && data.me?.decision && (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              background:
                data.me.decision === "approved" ? p.successBg : p.dangerBg,
              border: `1px solid ${
                data.me.decision === "approved"
                  ? p.successBorder
                  : p.dangerBorder
              }`,
              borderRadius: 10,
              color:
                data.me.decision === "approved"
                  ? p.successText
                  : p.dangerText,
              fontSize: 13 }}
          >
            You {data.me.decision} this {fmtRelative(data.me.decidedAt)}
            {data.me.decisionNote && (
              <span style={{ fontStyle: "italic" }}>
                {" "}— &ldquo;{data.me.decisionNote}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "flex-start" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.attachments.length > 0 && (
            <Card title={`Attachments · ${data.attachments.length}`} icon={FileText}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {data.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 11px",
                      background: p.surfaceMuted,
                      border: `1px solid ${p.border}`,
                      borderRadius: 8,
                      color: p.accentText,
                      textDecoration: "none",
                      fontSize: 12.5,
                      fontWeight: 500 }}
                  >
                    <FileText size={12} />
                    {a.file_name}
                    <Download size={11} />
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card
            title={`Approvers · ${data.approvers.length}`}
            icon={Users}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6 }}
            >
              {data.approvers.map((ap) => (
                <ApproverRow key={ap.id} ap={ap} />
              ))}
            </div>
          </Card>

          {data.events.length > 0 && (
            <Card title="Activity" icon={Activity}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                {data.events.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      fontSize: 12,
                      color: p.textMuted,
                      padding: "3px 0" }}
                  >
                    <span style={{ color: p.text, fontWeight: 500 }}>
                      {describeEvent(e)}
                    </span>
                    <span style={{ color: p.textFaint }}>
                      {" "}— {fmtDateTime(e.createdAt)}
                      {e.actorPortalName
                        ? ` · ${e.actorPortalName}`
                        : e.actorStaffName
                        ? ` · ${e.actorStaffName}`
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Progress" icon={CheckSquare}>
            <ProgressBar data={data} />
          </Card>
        </div>
      </div>

      <DecisionModal
        decision={decisionOpen}
        onCancel={() => setDecisionOpen(null)}
        onConfirm={async (note) => {
          if (!decisionOpen || !data) return;
          try {
            await portalApprovalsService.decide(data.id, decisionOpen, note);
            notify.success({
              message:
                decisionOpen === "approved"
                  ? "Thank you — approved"
                  : "Decision recorded" });
            setDecisionOpen(null);
            load();
          } catch (err: any) {
            notify.error({
              message: "Decision failed",
              description: err?.message });
          }
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- */

function ProgressBar({ data }: { data: PortalApprovalDetail }) {
  const required = data.approvers.filter((a) => a.required);
  const decidedApprove = required.filter((a) => a.decision === "approved").length;
  const decidedReject = required.filter((a) => a.decision === "rejected").length;
  const pending = required.length - decidedApprove - decidedReject;
  const pct =
    required.length > 0 ? Math.round((decidedApprove / required.length) * 100) : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12.5,
          color: p.textMuted,
          marginBottom: 6 }}
      >
        <span>{decidedApprove} of {required.length} required approved</span>
        <span style={{ fontWeight: 600, color: p.text }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 6,
          background: p.neutralBg,
          borderRadius: 999,
          overflow: "hidden",
          display: "flex" }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: p.success,
            transition: "width 200ms ease" }}
        />
        <div
          style={{
            width: `${required.length > 0
              ? Math.round((decidedReject / required.length) * 100)
              : 0
            }%`,
            background: p.danger }}
        />
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontSize: 12,
          color: p.textSubtle }}
      >
        <span>
          <CheckCircle2
            size={11}
            style={{ verticalAlign: -1, marginRight: 4, color: p.successText }}
          />
          {decidedApprove} approved
        </span>
        <span>
          <XCircle
            size={11}
            style={{ verticalAlign: -1, marginRight: 4, color: p.dangerText }}
          />
          {decidedReject} rejected
        </span>
        <span>
          <Hourglass
            size={11}
            style={{ verticalAlign: -1, marginRight: 4, color: p.warningText }}
          />
          {pending} pending
        </span>
      </div>
    </div>
  );
}

function ApproverRow({ ap }: { ap: PortalApprovalApprover }) {
  const name =
    ap.portalUserName || ap.portalUserEmail || ap.staffUserName || "?";
  const tone =
    ap.decision === "approved"
      ? TONE.success
      : ap.decision === "rejected"
      ? TONE.danger
      : TONE.warning;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        background: p.surfaceMuted,
        border: `1px solid ${p.border}`,
        borderRadius: 9 }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: p.purpleBg,
            border: `1px solid ${p.purpleBorder}`,
            color: p.purpleText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0 }}
        >
          {name
            .split(" ")
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: p.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" }}
          >
            {name}
          </div>
          {ap.decisionNote && (
            <div
              style={{
                marginTop: 3,
                fontSize: 11.5,
                color: p.textMuted,
                fontStyle: "italic" }}
            >
              &ldquo;{ap.decisionNote}&rdquo;
            </div>
          )}
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 9px",
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          color: tone.text,
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 500,
          flexShrink: 0 }}
      >
        {ap.decision === "approved" ? (
          <CheckCircle2 size={11} />
        ) : ap.decision === "rejected" ? (
          <XCircle size={11} />
        ) : (
          <Hourglass size={11} />
        )}
        {ap.decision === "approved"
          ? `Approved ${fmtRelative(ap.decidedAt)}`
          : ap.decision === "rejected"
          ? `Rejected ${fmtRelative(ap.decidedAt)}`
          : "Pending"}
      </span>
    </div>
  );
}

function describeEvent(e: any): string {
  switch (e.eventType) {
    case "created":
      return "Approval requested";
    case "approver_added":
      return "Approver added";
    case "approver_removed":
      return "Approver removed";
    case "approver_decision":
      return `Approver ${e.payload?.decision || "decided"}`;
    case "cancelled":
      return "Cancelled";
    default:
      return e.eventType;
  }
}

/* --------------------------------------------------------------- */

function Card({
  title,
  icon: Icon,
  children }: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        overflow: "hidden" }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 6 }}
      >
        <Icon size={12} />
        {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function DecisionModal({
  decision,
  onCancel,
  onConfirm }: {
  decision: "approved" | "rejected" | null;
  onCancel: () => void;
  onConfirm: (note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    setNote("");
  }, [decision]);
  if (!decision) return null;
  const isApprove = decision === "approved";
  return (
    <Modal
      open={!!decision}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={460}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0 },
        body: { padding: 0 } }}
    >
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          gap: 12,
          alignItems: "flex-start" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: isApprove ? p.successBg : p.dangerBg,
            color: isApprove ? p.successText : p.dangerText,
            border: `1px solid ${
              isApprove ? p.successBorder : p.dangerBorder
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center" }}
        >
          {isApprove ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: p.text }}>
            {isApprove ? "Approve" : "Reject"}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle }}
          >
            {isApprove
              ? "Your approval is final and goes into the audit trail."
              : "Add a note so we know what to fix."}
          </div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <Input.TextArea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isApprove
              ? "Optional note"
              : "What's wrong? What needs to change?"
          }
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${p.border}` }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              color: p.textMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              try {
                await onConfirm(note.trim() || undefined);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting || (!isApprove && !note.trim())}
            style={{
              padding: "8px 14px",
              background: isApprove ? p.success : p.danger,
              color: "#ffffff",
              border: `1px solid ${isApprove ? p.success : p.danger}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor:
                submitting || (!isApprove && !note.trim())
                  ? "not-allowed"
                  : "pointer",
              opacity:
                submitting || (!isApprove && !note.trim()) ? 0.6 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6 }}
          >
            {isApprove ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {submitting ? "Submitting…" : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
