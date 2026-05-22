"use client";

import React, { useEffect, useState } from "react";
import { Modal, Input, message } from "antd";
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";

const T = {
  border: "#e5e7eb",
  borderSoft: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#4338ca",
  accentBg: "#eef2ff",
  accentBorder: "#c7d2fe",
  warnBg: "#fef3c7",
  warnBorder: "#fde68a",
  warnText: "#92400e",
};

const MIN_LENGTH = 10;

export default function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { changePassword, user } = useClientPortalAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState<{ c: boolean; n: boolean; cf: boolean }>({
    c: false,
    n: false,
    cf: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setShow({ c: false, n: false, cf: false });
      setSubmitting(false);
    }
  }, [open]);

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;
  const sameAsOld = next.length > 0 && next === current;
  const canSubmit =
    current.length > 0 &&
    next.length >= MIN_LENGTH &&
    confirm === next &&
    !sameAsOld &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await changePassword(current, next);
      message.success("Password updated");
      onClose();
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.error || err?.message || "Could not change password";
      message.error(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => (submitting ? undefined : onClose())}
      footer={null}
      closable={false}
      width={460}
      centered
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: T.accentBg,
            border: `1px solid ${T.accentBorder}`,
            color: T.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <KeyRound size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              color: T.text,
              letterSpacing: "-0.015em",
            }}
          >
            Change password
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              color: T.textSubtle,
              fontWeight: 500,
            }}
          >
            Confirm your current password, then choose a new one.
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 22px 4px", display: "flex", flexDirection: "column", gap: 12 }}>
        {user?.mustChangePassword && (
          <div
            style={{
              padding: "10px 12px",
              background: T.warnBg,
              border: `1px solid ${T.warnBorder}`,
              borderRadius: 8,
              color: T.warnText,
              fontSize: 12.5,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Your account is using a temporary password. Choose a new one to
              continue using the portal.
            </span>
          </div>
        )}

        <Field label="Current password">
          <Input.Password
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            visibilityToggle={{
              visible: show.c,
              onVisibleChange: (v) => setShow((s) => ({ ...s, c: v })),
            }}
            iconRender={(visible) =>
              visible ? <EyeOff size={14} /> : <Eye size={14} />
            }
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
        </Field>

        <Field
          label="New password"
          hint={`Minimum ${MIN_LENGTH} characters`}
          error={tooShort ? `Must be at least ${MIN_LENGTH} characters` : sameAsOld ? "Must differ from the current password" : undefined}
        >
          <Input.Password
            value={next}
            onChange={(e) => setNext(e.target.value)}
            visibilityToggle={{
              visible: show.n,
              onVisibleChange: (v) => setShow((s) => ({ ...s, n: v })),
            }}
            iconRender={(visible) =>
              visible ? <EyeOff size={14} /> : <Eye size={14} />
            }
            placeholder="Choose a strong new password"
            autoComplete="new-password"
            status={tooShort || sameAsOld ? "error" : undefined}
          />
        </Field>

        <Field
          label="Confirm new password"
          error={mismatch ? "Passwords don't match" : undefined}
        >
          <Input.Password
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            visibilityToggle={{
              visible: show.cf,
              onVisibleChange: (v) => setShow((s) => ({ ...s, cf: v })),
            }}
            iconRender={(visible) =>
              visible ? <EyeOff size={14} /> : <Eye size={14} />
            }
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            status={mismatch ? "error" : undefined}
            onPressEnter={handleSubmit}
          />
        </Field>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            color: T.textSubtle,
            paddingTop: 2,
          }}
        >
          <ShieldCheck size={12} />
          Your password is hashed at rest. Other devices stay signed in until
          they refresh.
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 22px 16px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button
          onClick={onClose}
          disabled={submitting}
          style={{
            padding: "8px 14px",
            background: "#fff",
            border: `1px solid ${T.border}`,
            color: T.textMuted,
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: "8px 14px",
            background: canSubmit
              ? "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)"
              : "#cbd5e1",
            border: "1px solid #3730a3",
            color: "#fff",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </div>
    </Modal>
  );
}

const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, hint, error, children }) => (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 4,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: T.textSubtle,
        }}
      >
        {label}
      </div>
      {hint && !error && (
        <div style={{ fontSize: 10.5, color: T.textFaint }}>{hint}</div>
      )}
    </div>
    {children}
    {error && (
      <div style={{ marginTop: 4, fontSize: 11.5, color: "#b91c1c" }}>
        {error}
      </div>
    )}
  </div>
);
