import React, { useState } from "react";
import { Collapse, Modal, Image } from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  ClusterOutlined,
} from "@ant-design/icons";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContactPerson {
  id: string;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
  contactRole: string;
}

interface DocumentItem {
  id: string;
  url: string;
}

interface Experience {
  id: string;
  companyName: string;
  location: string;
  industry: string;
  address: string;
  doj: string;
  lwd: string;
  designation: string;
  employmentType: string;
  contacts?: ContactPerson[];
  experienceLetter?: DocumentItem;
  offerLetter?: DocumentItem;
  serviceLetter?: DocumentItem;
  relievingLetter?: DocumentItem;
  form16?: DocumentItem[];
  payslips?: DocumentItem[];
}

interface ProfileHistory {
  history: Experience[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url);

const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

const isDocxUrl = (url: string) => /\.(docx?|xlsx?|pptx?)(\?.*)?$/i.test(url);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEmploymentType = (type: string) =>
  type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const getFileName = (url: string) =>
  url.split("/").pop()?.split("?")[0] ?? "Document";

// ─── Document Viewer ──────────────────────────────────────────────────────────

const DocumentViewer: React.FC<{ url: string; label: string }> = ({
  url,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const isImg = isImageUrl(url);
  const isPdf = isPdfUrl(url);
  const isDocx = isDocxUrl(url);

  return (
    <>
      <div className="doc-item" onClick={() => setOpen(true)}>
        <span className="doc-icon">
          {isImg ? (
            <FileImageOutlined style={{ color: "#22c55e" }} />
          ) : (
            <FilePdfOutlined style={{ color: "#ef4444" }} />
          )}
        </span>
        <span className="doc-name">{label || getFileName(url)}</span>
        <span className="doc-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={(e) => e.stopPropagation()}
          >
            <DownloadOutlined />
          </a>
        </span>
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={isImg ? 600 : 900}
        centered
        title={label || getFileName(url)}
        destroyOnClose
      >
        {isImg && (
          <Image
            src={url}
            alt={label}
            style={{ width: "100%", borderRadius: 8 }}
            preview={false}
          />
        )}
        {isPdf && (
          <iframe
            src={url}
            style={{ width: "100%", height: 600, border: "none" }}
            title={label}
          />
        )}
        {isDocx && (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
            style={{ width: "100%", height: 600, border: "none" }}
            title={label}
          />
        )}
        {!isImg && !isPdf && !isDocx && (
          <div style={{ textAlign: "center", padding: 32, color: "#8c8c8c" }}>
            <FileTextOutlined style={{ fontSize: 48 }} />
            <p style={{ marginTop: 12 }}>
              Preview not available.{" "}
              <a href={url} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── Document Section ─────────────────────────────────────────────────────────

const DocumentSection: React.FC<{
  title: string;
  docs: DocumentItem[];
  labelPrefix?: string;
}> = ({ title, docs, labelPrefix }) => {
  if (!docs || !docs.length) return null;
  return (
    <div className="doc-section">
      <div className="doc-section-header">
        <FolderOpenOutlined />
        <span>{title}</span>
      </div>
      <div className="doc-list">
        {docs.map((doc, i) => (
          <DocumentViewer
            key={doc.id || i}
            url={doc.url}
            label={
              labelPrefix ? `${labelPrefix} ${i + 1}` : getFileName(doc.url)
            }
          />
        ))}
      </div>
    </div>
  );
};

// ─── Info Row ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
}> = ({ icon, label, value }) => (
  <div className="info-row">
    <span className="info-icon">{icon}</span>
    <div className="info-content">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || "—"}</span>
    </div>
  </div>
);

// ─── Nested Contact Details ───────────────────────────────────────────────────

const ContactDetails: React.FC<{ contacts: ContactPerson[] }> = ({
  contacts,
}) => {
  if (!contacts || contacts.length === 0) return null;

  const contactItems = contacts.map((c, i) => ({
    key: `contact-${i}`,
    label: (
      <span>
        Contact {i + 1}
        {c.contactName && (
          <span style={{ color: "#8c8c8c", fontWeight: 400, marginLeft: 4 }}>
            — {c.contactName}
          </span>
        )}
      </span>
    ),
    children: (
      <div style={{ padding: "4px 0" }}>
        <InfoRow
          icon={<UserOutlined />}
          label="Contact Role"
          value={c.contactRole}
        />
        <InfoRow
          icon={<UserOutlined />}
          label="Contact Person Name"
          value={c.contactName}
        />
        <InfoRow
          icon={<PhoneOutlined />}
          label="Contact Number"
          value={c.contactNumber}
        />
        <InfoRow
          icon={<MailOutlined />}
          label="Contact Email"
          value={c.contactEmail}
        />
      </div>
    ),
  }));

  return (
    <div className="nested-contact-wrap">
      <Collapse
        size="small"
        defaultActiveKey={["contact-0"]}
        items={contactItems}
      />
    </div>
  );
};

// ─── Experience Panel Content ─────────────────────────────────────────────────

const ExperiencePanel: React.FC<{ experience: Experience }> = ({
  experience,
}) => {
  // Normalize single-item docs to array for DocumentSection
  const toArray = (doc?: DocumentItem | null): DocumentItem[] =>
    doc && doc.url ? [doc] : [];

  const expLetters = toArray(experience.experienceLetter);
  const offerLetters = toArray(experience.offerLetter);
  const serviceLetters = toArray(experience.serviceLetter);
  const relievingLetters = toArray(experience.relievingLetter);
  const form16s = experience.form16 ?? [];
  const payslips = experience.payslips ?? [];

  const hasDocuments =
    expLetters.length ||
    offerLetters.length ||
    serviceLetters.length ||
    relievingLetters.length ||
    form16s.length ||
    payslips.length;

  const hasContacts = experience.contacts && experience.contacts.length > 0;

  return (
    <div className="experience-panel">
      {/* Top 3-column grid */}
      <div className="panel-grid">
        {/* Company Details */}
        <div className="panel-card">
          <div className="card-title">
            <BankOutlined />
            Company Details
          </div>
          <InfoRow
            icon={<BankOutlined />}
            label="Previous Company"
            value={experience.companyName}
          />
          <InfoRow
            icon={<EnvironmentOutlined />}
            label="Location"
            value={experience.location}
          />
          <InfoRow
            icon={<ClusterOutlined />}
            label="Industry / Domain"
            value={experience.industry}
          />
          <InfoRow
            icon={<EnvironmentOutlined />}
            label="Company Address"
            value={experience.address}
          />
        </div>

        {/* Tenure Details */}
        <div className="panel-card">
          <div className="card-title">
            <CalendarOutlined />
            Tenure Details
          </div>
          <InfoRow
            icon={<CalendarOutlined />}
            label="Date of Joining"
            value={formatDate(experience.doj)}
          />
          <InfoRow
            icon={<CalendarOutlined />}
            label="Last Working Day"
            value={formatDate(experience.lwd)}
          />
          <InfoRow
            icon={<IdcardOutlined />}
            label="Designation"
            value={experience.designation}
          />
          <InfoRow
            icon={<IdcardOutlined />}
            label="Employment Type"
            value={formatEmploymentType(experience.employmentType)}
          />
        </div>

        {/* Documents — scrollable */}
        <div className="panel-card docs-card">
          <div className="card-title">
            <FileTextOutlined />
            Documents
          </div>
          <div className="docs-scroll-area">
            {hasDocuments ? (
              <>
                <DocumentSection
                  title="Experience Letter"
                  docs={expLetters}
                  labelPrefix="Experience Letter"
                />
                <DocumentSection
                  title="Offer Letter"
                  docs={offerLetters}
                  labelPrefix="Offer Letter"
                />
                <DocumentSection
                  title="Service Letter"
                  docs={serviceLetters}
                  labelPrefix="Service Letter"
                />
                <DocumentSection
                  title="Relieving Letter"
                  docs={relievingLetters}
                  labelPrefix="Relieving Letter"
                />
                <DocumentSection
                  title="Form 16"
                  docs={form16s}
                  labelPrefix="Form 16"
                />
                <DocumentSection
                  title="Payslips"
                  docs={payslips}
                  labelPrefix="Payslip"
                />
              </>
            ) : (
              <div className="no-docs">No documents uploaded</div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Contact Details — only if contacts exist */}
      {hasContacts && (
        <div className="contact-section">
          <div className="contact-section-label">
            <UserOutlined style={{ marginRight: 6 }} />
            Contact Details
          </div>
          <ContactDetails contacts={experience.contacts!} />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PreviousExperience: React.FC<{ profile: any }> = ({ profile }) => {
  // Support both { history: [...] } and direct array
  const experiences: Experience[] = Array.isArray(profile)
    ? profile
    : (profile?.history ?? []);

  const [activeKey, setActiveKey] = useState<string | string[]>(
    experiences.length > 0 ? ["exp-0"] : [],
  );

  const experienceItems = experiences.map((exp, i) => ({
    key: `exp-${i}`,
    label: (
      <span>
        <BankOutlined style={{ marginRight: 8 }} />
        {exp.companyName && (
          <span style={{ color: "#8c8c8c", fontWeight: 400, marginLeft: 4 }}>
            {exp.companyName}
          </span>
        )}
      </span>
    ),
    children: <ExperiencePanel experience={exp} />,
  }));

  return (
    <>
      <style>{`
        .exp-root {
          // padding: 10px;
          background: white;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .experience-panel {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .panel-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          align-items: stretch;
        }

        @media (max-width: 1024px) {
          .panel-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .panel-grid { grid-template-columns: 1fr; }
        }

        .panel-card {
          background: #ffffff;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          padding: 16px;
          box-shadow: none;
        }

        /* Documents card uses flex column so scroll area fills remaining height */
        .docs-card {
          display: flex;
          flex-direction: column;
        }

        /* Scrollable area inside documents card */
        .docs-scroll-area {
          flex: 1;
          overflow-y: auto;
          max-height: 260px;
          padding-right: 4px;
        }

        .docs-scroll-area::-webkit-scrollbar {
          width: 5px;
        }

        .docs-scroll-area::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 4px;
        }

        .docs-scroll-area::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 4px;
        }

        .docs-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #bfbfbf;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: #1677ff;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px solid #fafafa;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-icon {
          color: #8c8c8c;
          font-size: 13px;
          margin-top: 2px;
          width: 16px;
          flex-shrink: 0;
        }

        .info-content {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 11px;
          color: #8c8c8c;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .info-value {
          font-size: 13px;
          color: #262626;
          font-weight: 600;
          margin-top: 1px;
          word-break: break-word;
        }

        .no-docs {
          color: #bfbfbf;
          font-size: 13px;
          padding: 24px 0;
          text-align: center;
        }

        .doc-section {
          margin-bottom: 10px;
        }

        .doc-section:last-child {
          margin-bottom: 0;
        }

        .doc-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #595959;
          margin-bottom: 5px;
        }

        .doc-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .doc-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #fafafa;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .doc-item:hover {
          background: #e6f4ff;
          border-color: #91caff;
        }

        .doc-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .doc-name {
          flex: 1;
          font-size: 12px;
          color: #434343;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-actions a {
          color: #8c8c8c;
          font-size: 13px;
        }

        .doc-actions a:hover {
          color: #1677ff;
        }

        /* Nested contact section inside company panel */
        .contact-section {
          background: #ffffff;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          padding: 16px;
          box-shadow: none;
        }

        .contact-section-label {
          font-size: 13px;
          font-weight: 600;
          color: #434343;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .nested-contact-wrap .ant-collapse {
          background: transparent;
        }
      `}</style>

      <div className="exp-root">
        {experienceItems.length > 0 ? (
          <Collapse
            accordion
            activeKey={activeKey}
            onChange={(key) => setActiveKey(key)}
            items={experienceItems}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 48, color: "#bfbfbf" }}>
            No previous experience records found.
          </div>
        )}
      </div>
    </>
  );
};

export default PreviousExperience;
