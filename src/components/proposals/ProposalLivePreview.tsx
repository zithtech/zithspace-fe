"use client";

import NoData from "@/components/common/NoData";
import React from "react";
import {
  Typography,
  Table,
  Tag,
  Row,
  Col,
  Divider,
  Descriptions,
  Empty,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import TiptapViewer from "@/components/common/TiptapViewer";
import { ComposerBlockView } from "./library/composerComponents";
import { sigFamily } from "./blocks/SignatureBlock";
import { currencySymbol } from "@/utils/currencies";

const { Title, Text } = Typography;

const TYPE_ORDER: Record<string, number> = {
  cover: 1,
  text: 2,
  scope: 3,
  timeline: 4,
  pricing: 5,
  signature: 6,
  section: 7,
};

const hasValue = (val: any) => {
  if (val === null || val === undefined) return false;
  const str = val.toString().trim();
  return str.length > 0 && str !== "<p></p>" && str !== "<p><br></p>";
};

const isBlockEmpty = (block: any) => {
  const data = block.data || {};
  switch (block.type) {
    case "cover":
      return false;
    case "text":
    case "section":
      return !(hasValue(data.content) || hasValue(data.text) || hasValue(data.heading));
    case "scope": {
      const milestones = (data.milestones || []).filter(
        (m: any) => hasValue(m.title) || hasValue(m.deliverables) || hasValue(m.tasks)
      );
      const terms = (data.terms || []).filter(
        (t: any) => hasValue(t.title) || hasValue(t.description)
      );
      return milestones.length === 0 && terms.length === 0;
    }
    case "timeline":
      return (data.phases || []).filter((p: any) => hasValue(p.title)).length === 0;
    case "pricing":
      return (data.items || []).filter(
        (item: any) => hasValue(item.name) || Number(item.price) > 0
      ).length === 0;
    case "signature":
      return !(
        hasValue(data.ipClause) ||
        hasValue(data.revisionClause) ||
        hasValue(data.terminationClause) ||
        hasValue(data.ndaClause) ||
        hasValue(data.companyName) ||
        hasValue(data.clientName) ||
        hasValue(data.companySigner) ||
        hasValue(data.signatoryName)
      );
    default:
      return false;
  }
};

const getBlockTitle = (b: any) => {
  if (b.type === "cover") return "Cover";
  const data = b.data || {};
  const customTitle = b.title || data.title || data.heading;
  if (customTitle) return customTitle;
  switch (b.type) {
    case "timeline":
      return "Timeline and Schedule";
    case "pricing":
      return "Pricing";
    case "text":
      return "Summary";
    case "scope":
      return "Scope of Work";
    case "signature":
      return "Agreement & Sign-off";
    case "section":
      return "Additional Details";
    default:
      return b.type;
  }
};

const getBlockIcon = (type: string) => {
  switch (type) {
    case "pricing":
      return <DollarOutlined />;
    case "scope":
      return <FileTextOutlined />;
    case "signature":
      return <SafetyCertificateOutlined />;
    case "timeline":
      return <CalendarOutlined />;
    default:
      return <SnippetsOutlined />;
  }
};

const renderBlockContent = (block: any) => {
  const data = block.data || {};

  switch (block.type) {
    case "text":
    case "section":
      if (!hasValue(data.content) && !hasValue(data.text)) return null;
      return (
        <div className="cmp-doc" style={{ color: "var(--text-primary)" }}>
          <TiptapViewer content={data.content || data.text || ""} />
        </div>
      );

    case "pricing": {
      const pricingItems = (data.items || []).filter(
        (item: any) => hasValue(item.name) || Number(item.price) > 0
      );
      if (pricingItems.length === 0) return null;

      const subtotal = pricingItems.reduce(
        (sum: number, item: any) =>
          sum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      );
      const discountAmount = data.discount || 0;
      const discountedSubtotal = Math.max(0, subtotal - discountAmount);
      const tax = discountedSubtotal * ((data.taxRate || 0) / 100);
      const total = discountedSubtotal + tax;
      const currency = currencySymbol(data.currency);

      return (
        <div style={{ marginTop: 12 }}>
          <Table
            dataSource={pricingItems}
            pagination={false}
            rowKey={(row, idx) => row.id || String(idx)}
            size="middle"
            className="plp-pricing-table"
            columns={[
              {
                title: "Description",
                dataIndex: "name",
                key: "name",
                render: (text: string, record: any) => (
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                      {text}
                    </div>
                    {record.description && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {record.description}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Qty",
                dataIndex: "quantity",
                key: "quantity",
                width: 60,
                align: "center",
                render: (val: number) => (
                  <span style={{ color: "var(--text-secondary)" }}>{val}</span>
                ),
              },
              {
                title: "Price",
                dataIndex: "price",
                key: "price",
                width: 100,
                align: "right",
                render: (val: number) => (
                  <span style={{ color: "var(--text-secondary)" }}>
                    {currency}
                    {Number(val).toLocaleString()}
                  </span>
                ),
              },
              {
                title: "Total",
                key: "total",
                width: 100,
                align: "right",
                render: (_: any, record: any) => (
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {currency}
                    {(Number(record.price || 0) * Number(record.quantity || 1)).toLocaleString()}
                  </span>
                ),
              },
            ]} locale={{ emptyText: <NoData /> }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <div style={{ width: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <Text style={{ color: "var(--text-secondary)", fontSize: 13 }}>Subtotal</Text>
                <Text style={{ color: "var(--text-primary)", fontSize: 13 }}>
                  {currency}
                  {subtotal.toLocaleString()}
                </Text>
              </div>
              {discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    color: "#10b981",
                  }}
                >
                  <Text style={{ color: "inherit", fontSize: 13 }}>Discount</Text>
                  <Text style={{ color: "inherit", fontSize: 13 }}>
                    -{currency}
                    {discountAmount.toLocaleString()}
                  </Text>
                </div>
              )}
              {(data.taxRate || 0) > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}
                >
                  <Text style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    Tax ({data.taxRate}%)
                  </Text>
                  <Text style={{ color: "var(--text-primary)", fontSize: 13 }}>
                    {currency}
                    {tax.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              )}
              <Divider style={{ margin: "10px 0", borderColor: "var(--border-color)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <Text strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>
                  Total Investment
                </Text>
                <Text strong style={{ fontSize: "1.05rem", color: "#4f46e5" }}>
                  {currency}
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case "timeline": {
      const phases = (data.phases || []).filter((p: any) => hasValue(p.title));
      if (phases.length === 0 && !hasValue(data.dependencyNotes)) return null;
      return (
        <div style={{ marginTop: 12 }}>
          {phases.map((phase: any, i: number) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <Title
                level={5}
                style={{
                  margin: "0 0 6px 0",
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontSize: 14,
                }}
              >
                {phase.title}
              </Title>
              <Text style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                Scheduled for completion
                {phase.deadline ? " by " : ""}
                <Text strong style={{ color: "var(--text-primary)" }}>
                  {phase.deadline || "TBD"}
                </Text>
                {phase.reviewPeriod
                  ? `, followed by a ${phase.reviewPeriod} review and feedback window.`
                  : "."}
              </Text>
            </div>
          ))}
          {hasValue(data.dependencyNotes) && (
            <div
              style={{
                marginTop: 20,
                padding: 14,
                background: "var(--bg-slate-50)",
                borderRadius: 8,
                borderLeft: "3px solid #4f46e5",
              }}
            >
              <Text
                strong
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 11,
                  color: "#4f46e5",
                  letterSpacing: 1,
                }}
              >
                DEPENDENCY NOTES
              </Text>
              <TiptapViewer content={data.dependencyNotes} />
            </div>
          )}
        </div>
      );
    }

    case "scope": {
      const milestones = (data.milestones || []).filter(
        (m: any) => hasValue(m.title) || hasValue(m.deliverables) || hasValue(m.tasks)
      );
      const scopeTerms = (data.terms || []).filter(
        (term: any) => hasValue(term.title) || hasValue(term.description)
      );
      if (milestones.length === 0 && scopeTerms.length === 0) return null;
      return (
        <div style={{ marginTop: 12 }}>
          {milestones.map((m: any, i: number) => (
            <div key={i} style={{ marginBottom: 22 }}>
              {hasValue(m.title) && (
                <Title
                  level={5}
                  style={{
                    margin: "0 0 8px 0",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontSize: 14,
                  }}
                >
                  {m.title}
                </Title>
              )}
              {hasValue(m.deliverables) && (
                <div style={{
                  marginBottom: 12,
                  background: "rgba(16, 185, 129, 0.05)",
                  borderLeft: "3px solid #10b981",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }}>
                  <Text strong style={{ color: "var(--text-primary)", fontSize: 13 }}>
                    Key Deliverables
                  </Text>
                  <Text style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                    {m.deliverables}
                  </Text>
                </div>
              )}
              {hasValue(m.tasks) && (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    background: "var(--bg-slate-50)",
                    padding: 12,
                    borderRadius: 8,
                    borderLeft: "3px solid var(--border-slate-200)",
                  }}
                >
                  {m.tasks}
                </div>
              )}
            </div>
          ))}

          {scopeTerms.length > 0 && (
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
              <Title
                level={5}
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                BOUNDARIES &amp; EXCLUSIONS
              </Title>
              {scopeTerms.map((term: any, idx: number) => {
                const hexColor =
                  term.color ||
                  (term.title?.toLowerCase().includes("exclusion") ? "#ef4444" : "#4f46e5");
                return (
                  <div
                    key={term.id || idx}
                    style={{
                      padding: "6px 12px",
                      background: "var(--bg-pure-white)",
                      borderRadius: 8,
                      borderLeft: `3px solid ${hexColor}`,
                      border: "1px solid var(--border-slate-100)",
                    }}
                  >
                    {hasValue(term.title) && (
                      <Text strong style={{ color: hexColor, marginBottom: 2, display: "block" }}>
                        {term.title}
                      </Text>
                    )}
                    {hasValue(term.description) && <TiptapViewer content={term.description || ""} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    case "cover": {
      const logo = data.logoUrl || data.logo;
      return (
        <div style={{ padding: "8px 0 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                width="120"
                crossOrigin="anonymous"
                style={{ height: 42, width: "auto", objectFit: "contain", display: "inline-block" }}
              />
            ) : (
              <div
                style={{ height: 42, width: 42, background: "var(--bg-slate-50)", borderRadius: 8 }}
              />
            )}
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ color: "var(--text-secondary)", fontSize: 10 }}>
                DATE
              </Text>
              <Title level={5} style={{ margin: 0, color: "var(--text-primary)", fontSize: 12 }}>
                {data.date ? dayjs(data.date).format("MMMM D, YYYY") : "—"}
              </Title>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                color: "#4f46e5",
                letterSpacing: 2,
                fontSize: 11,
                fontWeight: 700,
                display: "block",
                marginBottom: 6,
              }}
            >
              BUSINESS PROPOSAL
            </span>
            <Title
              level={2}
              style={{
                fontSize: 26,
                marginTop: 0,
                marginBottom: 6,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {data.title || "Untitled Project"}
            </Title>
            {data.projectSummary && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  maxWidth: 660,
                  lineHeight: 1.55,
                }}
                dangerouslySetInnerHTML={{ __html: data.projectSummary }}
              />
            )}
          </div>

          <Row gutter={32}>
            {hasValue(data.clientName) && (
              <Col xs={24} md={12}>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: "var(--text-secondary)",
                  }}
                >
                  PREPARED FOR
                </Text>
                <Title level={5} style={{ margin: 0, color: "var(--text-primary)", fontSize: 15 }}>
                  {data.clientName}
                </Title>
                {hasValue(data.clientCompany) && (
                  <Text
                    strong
                    style={{ display: "block", marginTop: 4, color: "var(--text-primary)" }}
                  >
                    {data.clientCompany}
                  </Text>
                )}
                {hasValue(data.clientAddress) && (
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 6, color: "var(--text-secondary)" }}
                  >
                    {data.clientAddress}
                  </Text>
                )}
                {(hasValue(data.clientEmail) || hasValue(data.clientPhone)) && (
                  <Text type="secondary" style={{ display: "block", color: "var(--text-secondary)" }}>
                    {data.clientEmail}
                    {hasValue(data.clientEmail) && hasValue(data.clientPhone) ? " • " : ""}
                    {data.clientPhone}
                  </Text>
                )}
              </Col>
            )}
            {hasValue(data.senderName) && (
              <Col xs={24} md={12}>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: "var(--text-secondary)",
                  }}
                >
                  PREPARED BY
                </Text>
                <Title level={5} style={{ margin: 0, color: "var(--text-primary)", fontSize: 15 }}>
                  {data.senderName}
                  {hasValue(data.senderPosition) && (
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: "normal", marginLeft: 6 }}>
                      ({data.senderPosition})
                    </Text>
                  )}
                </Title>
                {hasValue(data.senderCompany) && (
                  <Text
                    strong
                    style={{ display: "block", marginTop: 4, color: "var(--text-primary)" }}
                  >
                    {data.senderCompany}
                  </Text>
                )}
                {hasValue(data.senderAddress) && (
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 6, color: "var(--text-secondary)" }}
                  >
                    {data.senderAddress}
                  </Text>
                )}
                {hasValue(data.senderWebsite) && (
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 2, color: "var(--text-secondary)" }}
                  >
                    {data.senderWebsite}
                  </Text>
                )}
                {(hasValue(data.senderEmail) || hasValue(data.senderContact)) && (
                  <Text type="secondary" style={{ display: "block", color: "var(--text-secondary)" }}>
                    {[data.senderEmail, data.senderContact].filter(hasValue).join(" • ")}
                  </Text>
                )}
              </Col>
            )}
          </Row>
        </div>
      );
    }

    case "signature": {
      const sigDate = data.date ? dayjs(data.date).format("MMM D, YYYY") : "Date";
      const sigCol = (forName: string, fallback: string, signer: string, signature: string, signatureFont: string) => (
        <div>
          <Text strong style={{ fontSize: 15, color: "var(--text-primary)" }}>For: {forName || fallback}</Text>
          <div style={{ height: 64, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
            {signature ? (
              <span style={{ fontFamily: sigFamily(signatureFont), fontSize: 38, lineHeight: 1, color: "var(--text-primary)", paddingBottom: 4, whiteSpace: "nowrap" }}>
                {signature}
              </span>
            ) : null}
          </div>
          <div style={{ borderBottom: "1.5px solid var(--border-color)" }} />
          <div style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}>{signer || "Authorized Signer"}</div>
          <div style={{ marginTop: 4, color: "var(--text-secondary)", fontSize: 13 }}>{data.date ? `Date: ${sigDate}` : "Date"}</div>
          {hasValue(data.place) && (
            <div style={{ marginTop: 2, color: "var(--text-secondary)", fontSize: 13 }}>Place: {data.place}</div>
          )}
        </div>
      );
      return (
        <Row gutter={[48, 32]}>
          <Col xs={24} md={12}>{sigCol(data.companyName, "Your Company", data.companySigner, data.companySignature, data.companySignatureFont)}</Col>
          <Col xs={24} md={12}>{sigCol(data.clientName, "Client Name", data.clientSigner, data.clientSignature, data.clientSignatureFont)}</Col>
        </Row>
      );
    }

    case "component":
      if (!data?.kind) return null;
      return <div className="cmp-doc"><ComposerBlockView component={data} editable={false} /></div>;

    default:
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <NoData description={`Details for ${block.type} section`} />
        </div>
      );
  }
};

interface ProposalLivePreviewProps {
  title?: string;
  blocksData: any;
  className?: string;
}

export const ProposalLivePreview: React.FC<ProposalLivePreviewProps> = ({
  title,
  blocksData,
  className,
}) => {
  let raw: any[] = [];
  try {
    raw = typeof blocksData === "string" ? JSON.parse(blocksData) : blocksData || [];
  } catch {
    raw = [];
  }
  const filtered = [...raw].filter((b: any) => !isBlockEmpty(b));
  // Keep the author's exact order when composed components are present; otherwise
  // normalise legacy proposals by TYPE_ORDER.
  const blocks = filtered.some((b: any) => b?.type === 'component')
    ? filtered
    : filtered.sort((a: any, b: any) => (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99));

  if (blocks.length === 0) {
    return (
      <div className={className} style={{ padding: 32 }}>
        <NoData description={
                        <span style={{ color: "var(--text-slate-500)" }}>
                          No content has been added to this proposal yet.
                        </span>
                      } />
      </div>
    );
  }

  return (
    <div className={`plp-root ${className || ""}`}>
      {title && (
        <div className="plp-header">
          <Text className="plp-eyebrow">PROPOSAL OVERVIEW</Text>
          <Title level={3} className="plp-title">
            {title}
          </Title>
          <Text className="plp-sub">
            Complete sequential preview of all project details and contractual terms.
          </Text>
        </div>
      )}

      <div className="plp-blocks">
        {blocks.map((block: any, idx: number) => (
          <section key={idx} className="plp-block">
            {block.type !== "cover" && block.type !== "component" && (
              <div className="plp-block-head">
                <span className="plp-block-icon">{getBlockIcon(block.type)}</span>
                <span className="plp-block-title">{getBlockTitle(block).toUpperCase()}</span>
                <span className="plp-block-rule" />
              </div>
            )}
            <div className="plp-block-body">{renderBlockContent(block)}</div>
          </section>
        ))}
      </div>

      <style jsx global>{`
        .plp-root {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
          color: var(--text-primary);
        }
        .plp-header {
          padding-bottom: 18px;
          margin-bottom: 22px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .plp-eyebrow {
          color: #4f46e5 !important;
          font-size: 11px !important;
          letter-spacing: 0.15em !important;
          font-weight: 800 !important;
          display: block !important;
          margin-bottom: 4px !important;
        }
        .plp-title.ant-typography {
          margin: 0 !important;
          font-weight: 800 !important;
          letter-spacing: -0.02em !important;
          color: var(--text-slate-900) !important;
        }
        .plp-sub {
          display: block !important;
          margin-top: 4px !important;
          color: var(--text-slate-500) !important;
          font-size: 12.5px !important;
        }

        .plp-blocks {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .plp-block {
          /* flat — no shadow */
        }
        .plp-block-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .plp-block-icon {
          color: #4f46e5;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .plp-block-title {
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-slate-700);
        }
        .plp-block-rule {
          flex: 1;
          height: 1px;
          background: var(--border-slate-100);
        }
        .plp-block-body { padding: 4px 0 0; }

        /* Pricing table */
        .plp-pricing-table .ant-table { background: transparent !important; }
        .plp-pricing-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          font-weight: 700 !important;
          font-size: 10.5px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .plp-pricing-table .ant-table-thead > tr > th::before { display: none !important; }
        .plp-pricing-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 12px 14px !important;
        }
      `}</style>
    </div>
  );
};

export default ProposalLivePreview;
