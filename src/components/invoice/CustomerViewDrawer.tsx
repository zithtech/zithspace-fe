"use client";

import { FC } from "react";
import { Drawer, Typography, Tooltip } from "antd";
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  User,
  Globe,
  X,
  Copy,
} from "lucide-react";
import { Customer } from "@/services/customersService";

const { Text } = Typography;

interface CustomerViewDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerViewDrawer: FC<CustomerViewDrawerProps> = ({
  open,
  onClose,
  customer,
}) => {
  if (!customer) return null;

  const copy = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  };

  const fullAddress = [
    customer.address,
    customer.city,
    customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <style>{`
        [data-theme='dark'] .customer-drawer-card {
          background: transparent !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .customer-drawer-header {
          background: #0b0f19 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .customer-drawer-card > div:first-child,
        [data-theme='dark'] .customer-drawer-card .divide-y > * {
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .customer-view-drawer-root .ant-drawer-content,
        [data-theme='dark'] .customer-view-drawer-root .ant-drawer-body {
          background: #020617 !important;
        }
      `}</style>
      <Drawer
      rootClassName="customer-view-drawer-root"
      open={open}
      onClose={onClose}
      width={720}
      closable={false}
      styles={{
        body: { padding: 0, background: "var(--customers-page-bg)" },
        header: { display: "none" },
        wrapper: { boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.08)" },
        mask: {
          backdropFilter: "blur(2px)",
          background: "rgba(15, 23, 42, 0.35)",
        },
      }}
    >
      <div className="h-full flex flex-col">
        {/* HEADER */}
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background:
              "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              {customer.companyName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <div
                className="text-[16px] font-semibold leading-tight truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {customer.companyName || "Customer"}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
                  style={
                    customer.isActive
                      ? {
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                        }
                      : {
                          background: "var(--bg-slate-50)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-color)",
                        }
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: customer.isActive ? "#10b981" : "#94a3b8",
                    }}
                  />
                  {customer.isActive ? "Active" : "Inactive"}
                </span>
                {customer.country && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
                    style={{
                      background: "var(--bg-slate-50)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <Globe size={10} />
                    {customer.country}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Quick contact strip */}
          <div className="grid grid-cols-2 gap-3">
            <ContactCell
              icon={Mail}
              label="Email"
              value={customer.email}
              onCopy={() => copy(customer.email)}
              hrefPrefix="mailto:"
            />
            <ContactCell
              icon={Phone}
              label="Phone"
              value={customer.phone}
              onCopy={() => copy(customer.phone)}
              hrefPrefix="tel:"
            />
          </div>

          {/* Primary contact */}
          <Section icon={User} title="Primary contact" subtitle="Direct channels">
            <Row label="Email" value={customer.email} mono={false} onCopy={() => copy(customer.email)} />
            <Row label="Phone" value={customer.phone} mono={false} onCopy={() => copy(customer.phone)} />
          </Section>

          {/* Compliance & Tax */}
          <Section
            icon={ShieldCheck}
            title="Compliance & tax"
            subtitle="Identifiers used on invoices"
          >
            <Row label="Tax ID" value={customer.taxId} mono onCopy={() => copy(customer.taxId)} />
            <Row label="GSTIN" value={customer.gstin} mono onCopy={() => copy(customer.gstin)} />
            <Row label="PAN" value={customer.pan} mono onCopy={() => copy(customer.pan)} />
          </Section>

          {/* Billing address */}
          <Section icon={MapPin} title="Billing address" subtitle="Where invoices are sent">
            <div className="px-4 py-3.5">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Address
              </div>
              <div
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {fullAddress || (
                  <span style={{ color: "var(--text-secondary)" }}>
                    No address provided
                  </span>
                )}
              </div>
            </div>
            <div
              className="grid grid-cols-2"
              style={{ borderTop: "1px solid var(--border-color)" }}
            >
              <div
                className="px-4 py-3"
                style={{ borderRight: "1px solid var(--border-color)" }}
              >
                <div
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  City
                </div>
                <div
                  className="text-[13px] mt-0.5"
                  style={{ color: customer.city ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {customer.city || "—"}
                </div>
              </div>
              <div className="px-4 py-3">
                <div
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Country
                </div>
                <div
                  className="text-[13px] mt-0.5"
                  style={{ color: customer.country ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {customer.country || "—"}
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Drawer>
    </>
  );
};

const Section = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div
    className="customer-drawer-card rounded-none overflow-hidden"
    style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
    }}
  >
    <div
      className="px-4 py-3 flex items-center gap-2.5 border-b"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          background: "var(--bg-blue-50)",
          color: "var(--text-blue-700)",
          border: "1px solid var(--border-blue-200)",
        }}
      >
        <Icon size={13} strokeWidth={2.25} />
      </div>
      <span
        className="text-[13px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </span>
      {subtitle && (
        <>
          <span
            className="h-3.5 w-px"
            style={{ background: "var(--border-color)" }}
          />
          <span
            className="text-[11px] uppercase tracking-[0.08em]"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </span>
        </>
      )}
    </div>
    <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
      {children}
    </div>
  </div>
);

const Row = ({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  onCopy?: () => void;
}) => {
  const has = !!value;
  return (
    <div
      className="px-4 py-3 flex items-center justify-between gap-3 group"
      style={{ borderBottom: "1px solid var(--border-color)" }}
    >
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-[13px] truncate text-right"
          style={{
            color: has ? "var(--text-primary)" : "var(--text-secondary)",
            fontFamily: mono && has
              ? "ui-monospace, SFMono-Regular, Menlo, monospace"
              : undefined,
            fontWeight: has ? 500 : 400,
          }}
        >
          {value || "—"}
        </span>
        {has && onCopy && (
          <Tooltip title="Copy">
            <button
              type="button"
              onClick={onCopy}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-slate-50)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <Copy size={12} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const ContactCell = ({
  icon: Icon,
  label,
  value,
  onCopy,
  hrefPrefix,
}: {
  icon: any;
  label: string;
  value?: string | null;
  onCopy: () => void;
  hrefPrefix?: string;
}) => {
  const has = !!value;
  return (
    <div
      className="rounded-xl px-3.5 py-3 flex items-center gap-3 group"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "var(--bg-slate-50)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <Icon size={15} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </div>
        {has ? (
          <a
            href={hrefPrefix ? `${hrefPrefix}${value}` : undefined}
            className="text-[13px] font-medium truncate block hover:underline"
            style={{ color: "var(--text-primary)" }}
            title={value || ""}
          >
            {value}
          </a>
        ) : (
          <div
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            —
          </div>
        )}
      </div>
      {has && (
        <Tooltip title="Copy">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onCopy();
            }}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-slate-50)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Copy size={13} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default CustomerViewDrawer;
