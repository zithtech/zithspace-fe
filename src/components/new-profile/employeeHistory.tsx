import React, { useState } from "react";
import { Collapse, Tag, Modal, Image } from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  UserOutlined,
  PhoneOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  ClusterOutlined,
} from "@ant-design/icons";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Experience {
  employeeId: string;
  companyName: string;
  location: string;
  industry: string;
  companyAddress: string;
  joiningDate: string;
  lastWorkingDate: string;
  designation: string;
  employmentType: string;
  contacts?: ContactPerson[];
}

interface Document {
  employeeId: string;
  documentType:
    | "PAYSLIP"
    | "FORM_16"
    | "EXPERIENCE_LETTER"
    | "OFFER_LETTER"
    | "SERVICE_LETTER"
    | "RELIEVING_LETTER";
  documentUrl: string;
}

interface ContactPerson {
  contactPersonType: string;
  contactPersonName: string;
  contactPersonNumber: string;
}

interface ProfilePayload {
  experiences: Experience[];
  documents: Document[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url);

const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEmploymentType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
        {!isImg && !isPdf && (
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
  docs: Document[];
  labelPrefix?: string;
}> = ({ title, docs, labelPrefix }) => {
  if (!docs.length) return null;
  return (
    <div className="doc-section">
      <div className="doc-section-header">
        <FolderOpenOutlined />
        <span>{title}</span>
        {/* <Tag color="blue" style={{ marginLeft: 8 }}>
          {docs.length}
        </Tag> */}
      </div>
      <div className="doc-list">
        {docs.map((doc, i) => (
          <DocumentViewer
            key={i}
            url={doc.documentUrl}
            label={
              labelPrefix
                ? `${labelPrefix} ${i + 1}`
                : getFileName(doc.documentUrl)
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
        {c.contactPersonName && (
          <span style={{ color: "#8c8c8c", fontWeight: 400, marginLeft: 4 }}>
            — {c.contactPersonName}
          </span>
        )}
      </span>
    ),
    children: (
      <div style={{ padding: "4px 0" }}>
        <InfoRow
          icon={<UserOutlined />}
          label="Contact Person Type"
          value={c.contactPersonType}
        />
        <InfoRow
          icon={<UserOutlined />}
          label="Contact Person Name"
          value={c.contactPersonName}
        />
        <InfoRow
          icon={<PhoneOutlined />}
          label="Contact Number"
          value={c.contactPersonNumber}
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

const ExperiencePanel: React.FC<{
  experience: Experience;
  documents: Document[];
}> = ({ experience, documents }) => {
  const payslips = documents.filter((d) => d.documentType === "PAYSLIP");
  const form16s = documents.filter((d) => d.documentType === "FORM_16");
  const expLetters = documents.filter(
    (d) => d.documentType === "EXPERIENCE_LETTER",
  );
  const offerLetters = documents.filter(
    (d) => d.documentType === "OFFER_LETTER",
  );
  const serviceLetters = documents.filter(
    (d) => d.documentType === "SERVICE_LETTER",
  );
  const relievingLetters = documents.filter(
    (d) => d.documentType === "RELIEVING_LETTER",
  );

  const hasDocuments =
    payslips.length ||
    form16s.length ||
    expLetters.length ||
    offerLetters.length ||
    serviceLetters.length ||
    relievingLetters.length;

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
            value={experience.companyAddress}
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
            value={formatDate(experience.joiningDate)}
          />
          <InfoRow
            icon={<CalendarOutlined />}
            label="Last Working Day"
            value={formatDate(experience.lastWorkingDate)}
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

const PreviousExperience: React.FC<{ payload: ProfilePayload }> = ({
  payload,
}) => {
  const { experiences = [], documents = [] } = payload;

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
    children: <ExperiencePanel experience={exp} documents={documents} />,
  }));

  return (
    <>
      <style>{`
        .exp-root {
          padding: 24px;
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
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 16px;
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

        /* fontWeight 600 on all values */
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
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 16px;
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

// ─── Sample Payload ───────────────────────────────────────────────────────────

const SAMPLE_PAYLOAD: ProfilePayload = {
  experiences: [
    {
      employeeId: "EMPLOYEE_UUID_1",
      companyName: "ABC Technologies",
      location: "Chennai",
      industry: "IT Services",
      companyAddress: "Tidel Park, Chennai",
      joiningDate: "2022-01-10",
      lastWorkingDate: "2023-12-31",
      designation: "Software Engineer",
      employmentType: "FULL_TIME",
      contacts: [
        {
          contactPersonType: "HR Manager",
          contactPersonName: "Priya Sharma",
          contactPersonNumber: "+91 98765 43210",
        },
        {
          contactPersonType: "Reporting Manager",
          contactPersonName: "Rahul Verma",
          contactPersonNumber: "+91 91234 56789",
        },
      ],
    },
    {
      employeeId: "EMPLOYEE_UUID_2",
      companyName: "XYZ Solutions",
      location: "Bengaluru",
      industry: "Product",
      companyAddress: "Koramangala, Bengaluru",
      joiningDate: "2020-03-01",
      lastWorkingDate: "2021-12-31",
      designation: "Junior Developer",
      employmentType: "FULL_TIME",
      contacts: [],
    },
  ],
  documents: [
    // Experience Letter
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "EXPERIENCE_LETTER",
      documentUrl: "https://s3.bucket/experience-letter.pdf",
    },
    // Offer Letter
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "OFFER_LETTER",
      documentUrl: "https://s3.bucket/offer-letter.pdf",
    },
    // Service Letter
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "SERVICE_LETTER",
      documentUrl: "https://s3.bucket/service-letter.pdf",
    },
    // Relieving Letter
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "RELIEVING_LETTER",
      documentUrl: "https://s3.bucket/relieving-letter.pdf",
    },
    // Form 16
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "FORM_16",
      documentUrl: "https://s3.bucket/form16-2022-23.pdf",
    },
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "FORM_16",
      documentUrl: "https://s3.bucket/form16-2023-24.pdf",
    },
    // Payslips
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "PAYSLIP",
      documentUrl: "https://s3.bucket/payslip-jan-2024.pdf",
    },
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "PAYSLIP",
      documentUrl: "https://s3.bucket/payslip-feb-2024.pdf",
    },
    {
      employeeId: "EMPLOYEE_UUID_1",
      documentType: "PAYSLIP",
      documentUrl: "https://s3.bucket/payslip-mar-2024.pdf",
    },
  ],
};

export default function App() {
  return <PreviousExperience payload={SAMPLE_PAYLOAD} />;
}
