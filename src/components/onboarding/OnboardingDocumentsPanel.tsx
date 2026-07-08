'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  DatePicker,
  Empty,
  Input,
  Modal,
  Drawer,
  Popconfirm,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InboxOutlined,
  PlusOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  AlertCircle,
  CheckCircle2,

  Clock,
  FileText,
  FolderOpen,
} from 'lucide-react';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { EmployeeOnboardingService, EmployeeDocumentService } from '@/services/onboardingService';
import type { EmployeeDocument, DocumentStats } from '@/services/onboardingService';

import { drawerFormStyles } from '@/components/common/DrawerSection';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';

const { Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

// ── 15 HR document type suggestions ─────────────────────────────────────────
const DOC_SUGGESTIONS = [
  'Offer Letter',
  'Appointment Letter',
  'Salary Revision Letter',
  'Promotion Letter',
  'Relieving Letter',
  'Service Certificate',
  'Experience Letter',
  'NDA',
  'Joining Letter',
  'Increment Letter',
  'Warning Letter',
  'Termination Letter',
  'PF Declaration',
  'Gratuity Form',
  'ID Proof',
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  uploaded: { color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'Uploaded' },
  pending: { color: '#d97706', bg: 'rgba(217,119,6,0.1)', label: 'Pending' },
  expired: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', label: 'Expired' },
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="ob-doc-stat">
      <div className="ob-doc-stat-icon" style={{ color, background: bg }}>
        {icon}
      </div>
      <div>
        <div className="ob-doc-stat-num" style={{ color }}>
          {value}
        </div>
        <div className="ob-doc-stat-label">{label}</div>
      </div>
    </div>
  );
}

// ── Wizard dialog ─────────────────────────────────────────────────────────────
interface WizardProps {
  open: boolean;
  employees: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddDocumentWizard({ open, employees, onClose, onSuccess }: WizardProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customType, setCustomType] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setSelectedEmployee(null);
    setSelectedType(null);
    setCustomType('');
    setFileList([]);
    setNotes('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finalDocType = selectedType === '__custom__' ? customType : selectedType;
  const canStep1 = !!selectedEmployee;
  const canStep2 = !!finalDocType && (selectedType !== '__custom__' || customType.trim().length > 0);
  const canStep3 = fileList.length > 0 && canStep2;

  const handleUpload = async () => {
    if (!selectedEmployee || !finalDocType || fileList.length === 0) return;
    setUploading(true);
    try {
      const file = fileList[0].originFileObj as File;
      await EmployeeDocumentService.uploadDocument({
        file,
        employeeId: selectedEmployee,
        documentName: finalDocType,
        documentType: finalDocType,
        notes: notes || undefined,
      });
      message.success('Document uploaded successfully');
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const employeeOptions = employees.map((e: any) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName}`.trim(),
    description: e.positionTitle || (typeof e.position === 'string' ? e.position : e.position?.title) || e.jobTitle || undefined,
    avatarUrl: e.avatarUrl || null,
  }));

  const selectedEmpObj = employeeOptions.find((e) => e.value === selectedEmployee);

  return (
    <Drawer
      rootClassName="leave-drawer-root"
      className="mm-drawer"
      width={720}
      open={open}
      onClose={handleClose}
      closable={false}
      destroyOnClose
      styles={{
        body: { padding: 0, background: "var(--customers-page-bg)" },
        header: { display: "none" },
        footer: { display: "none" },
        mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
      }}
      footer={null}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <style>{drawerFormStyles}</style>
        {/* Header */}
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(59,130,246,0.10)',
                color: '#3b82f6',
                border: '1px solid var(--border-blue-200)',
              }}
            >
              <FileTextOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Add Document
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Upload an HR document for an employee
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="mm-drawer-icon-btn"
              style={{
                background: "var(--bg-slate-50)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                width: 30,
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              <CloseOutlined style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ background: 'var(--customers-page-bg)' }}>
          <div className="ob-doc-wizard-body" style={{ gap: 24, display: 'flex', flexDirection: 'column' }}>
            {/* Employee */}
            <div>
              <div className="ob-doc-field-label">Search and select an employee</div>
              <SearchableDropdown
                placeholder="Type to search employees…"
                width="100%"
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                options={employeeOptions}
                allowClear
                showSelectedAvatar
              />

              {selectedEmpObj && (
                <div className="ob-doc-emp-preview" style={{ marginTop: 12 }}>
                  <Avatar size={40} src={selectedEmpObj.avatarUrl || undefined} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontWeight: 700 }}>
                    {selectedEmpObj.label?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-slate-900)' }}>{selectedEmpObj.label}</div>
                    {selectedEmpObj.description && (
                      <div style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>{selectedEmpObj.description}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Document type */}
            <div>
              <div className="ob-doc-field-label">Select a document type</div>
              <div className="ob-doc-type-grid">
                {DOC_SUGGESTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`ob-doc-type-chip ${selectedType === t ? 'is-selected' : ''}`}
                    onClick={() => { setSelectedType(t); setCustomType(''); }}
                  >
                    <FileTextOutlined style={{ fontSize: 12 }} />
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  className={`ob-doc-type-chip ob-doc-type-chip--custom ${selectedType === '__custom__' ? 'is-selected' : ''}`}
                  onClick={() => setSelectedType('__custom__')}
                >
                  <PlusOutlined style={{ fontSize: 12 }} />
                  Custom type
                </button>
              </div>

              {selectedType === '__custom__' && (
                <Input
                  placeholder="Enter document type name…"
                  size="large"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  style={{ marginTop: 12 }}
                />
              )}
            </div>

            {/* Upload */}
            <div>
              <div className="ob-doc-field-label">Upload File</div>
              <Dragger
                multiple={false}
                maxCount={1}
                fileList={fileList}
                beforeUpload={(file: RcFile) => {
                  setFileList([{ uid: file.uid, name: file.name, status: 'done', originFileObj: file }]);
                  return false;
                }}
                onRemove={() => setFileList([])}
                className="ob-doc-dragger"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#3b82f6', fontSize: 36 }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 600 }}>
                  Click or drag a file here
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                  PDF, DOCX, JPG, PNG — max 20 MB
                </p>
              </Dragger>
            </div>

            {/* Notes */}
            <div>
              <div className="ob-doc-field-label">Notes (optional)</div>
              <Input.TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes…"
              />
            </div>
          </div>
        </div>

        <div
          className="customer-drawer-footer"
          style={{
            padding: "16px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: "var(--bg-secondary)",
          }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            disabled={!canStep3}
            loading={uploading}
            onClick={handleUpload}
          >
            Upload Document
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function OnboardingDocumentsPanel() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({ total: 0, uploaded: 0, pending: 0, expired: 0 });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await EmployeeDocumentService.listDocuments({
        employeeId: filterEmployee,
        documentType: filterType,
        status: filterStatus,
        search: search || undefined,
      });
      setDocuments(result.data || []);
      setStats(result.stats || { total: 0, uploaded: 0, pending: 0, expired: 0 });
    } catch (err: any) {
      message.error(err?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterType, filterStatus, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Load onboarded employees for the wizard
  useEffect(() => {
    EmployeeOnboardingService.getAllEmployees()
      .then((res: any) => {
        const data = res?.data || res || [];

        // Map to what the UI expects (firstName, lastName, avatarUrl, positionTitle)
        const mapped = Array.isArray(data) ? data.map((e: any) => {
          return {
            ...e,
            firstName: e.firstName || e.first_name || '',
            lastName: e.lastName || e.last_name || '',
            avatarUrl: e.profile_pic || e.avatarUrl || null,
            positionTitle: e.position?.title || e.positionTitle || e.jobTitle || '',
          };
        }) : [];

        setEmployees(mapped);
      })
      .catch((err: any) => {
        console.error("Failed to fetch employees:", err);
      });
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await EmployeeDocumentService.deleteDocument(id);
      message.success('Document deleted');
      fetchDocuments();
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const docTypeOptions = useMemo(() => {
    const types = new Set(DOC_SUGGESTIONS);
    documents.forEach((d) => types.add(d.documentType));
    return Array.from(types).sort();
  }, [documents]);

  const employeeOptions = useMemo(() => {
    return employees.map((e: any) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}`.trim() || e.name || 'Unknown',
      description: e.positionTitle || (typeof e.position === 'string' ? e.position : e.position?.title) || e.jobTitle || undefined,
      avatarUrl: e.avatarUrl || null,
    }));
  }, [employees]);

  // Expired check (if status still says uploaded but expiry has passed)
  const effectiveStatus = (doc: EmployeeDocument) => {
    if (doc.status === 'uploaded' && doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
      return 'expired';
    }
    return doc.status;
  };

  return (
    <div className="ob-doc-wrap">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="ob-doc-header">
        <div>
          <h1 className="ob-doc-title">Documents</h1>
          <p className="ob-doc-subtitle">Manage HR documents for employees</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="ob-doc-add-btn"
          onClick={() => setWizardOpen(true)}
        >
          Add Document
        </Button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="ob-doc-stats">
        <StatCard
          icon={<FolderOpen size={18} />}
          value={stats.total}
          label="Total Documents"
          color="#3b82f6"
          bg="rgba(59,130,246,0.1)"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          value={stats.uploaded}
          label="Uploaded"
          color="#059669"
          bg="rgba(5,150,105,0.1)"
        />
        <StatCard
          icon={<Clock size={18} />}
          value={stats.pending}
          label="Pending"
          color="#d97706"
          bg="rgba(217,119,6,0.1)"
        />
        <StatCard
          icon={<AlertCircle size={18} />}
          value={stats.expired}
          label="Expired"
          color="#dc2626"
          bg="rgba(220,38,38,0.1)"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="ob-doc-filters">
        <Input
          placeholder="Search by name or document…"
          prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 240 }}
        />
        <SearchableDropdown
          placeholder="All employees"
          width={220}
          value={filterEmployee}
          onChange={setFilterEmployee}
          allowClear
          options={employeeOptions}
          showSelectedAvatar
        />
        <SearchableDropdown
          placeholder="All types"
          width={180}
          value={filterType}
          onChange={setFilterType}
          allowClear
          options={docTypeOptions.map((t) => ({ value: t, label: t }))}
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="ob-doc-table-wrap">
        {/* Header row */}
        <div className="ob-doc-table-head">
          <div className="ob-doc-col ob-doc-col--employee">Employee</div>
          <div className="ob-doc-col ob-doc-col--name">Document Name</div>
          <div className="ob-doc-col ob-doc-col--type">Type</div>
          <div className="ob-doc-col ob-doc-col--date">Upload Date</div>
          <div className="ob-doc-col ob-doc-col--by">Uploaded By</div>
          <div className="ob-doc-col ob-doc-col--status">Status</div>
          <div className="ob-doc-col ob-doc-col--actions">Actions</div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="ob-doc-center">
            <Space direction="vertical" align="center">
              <Spin size="large" />
              <div style={{ color: 'var(--text-slate-500)', fontSize: 13, marginTop: 4 }}>Loading documents…</div>
            </Space>
          </div>
        ) : documents.length === 0 ? (
          <div className="ob-doc-center">
            <Empty
              image={<FileOutlined style={{ fontSize: 48, color: 'var(--text-slate-300)' }} />}
              description={
                <Text style={{ color: 'var(--text-slate-400)', fontSize: 13 }}>
                  No documents found. Click <strong>Add Document</strong> to upload the first one.
                </Text>
              }
            />
          </div>
        ) : (
          documents.map((doc) => {
            const st = effectiveStatus(doc);
            const stCfg = STATUS_CONFIG[st] || STATUS_CONFIG.uploaded;
            return (
              <div key={doc.id} className="ob-doc-row">
                {/* Employee */}
                <div className="ob-doc-col ob-doc-col--employee">
                  <Avatar size={30} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {doc.employeeName?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <span className="ob-doc-emp-name">{doc.employeeName || '—'}</span>
                </div>
                {/* Document Name */}
                <div className="ob-doc-col ob-doc-col--name">
                  <FilePdfOutlined style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span className="ob-doc-doc-name">{doc.documentName}</span>
                </div>
                {/* Type */}
                <div className="ob-doc-col ob-doc-col--type">
                  <span className="ob-doc-type-badge">{doc.documentType}</span>
                </div>
                {/* Date */}
                <div className="ob-doc-col ob-doc-col--date ob-doc-muted">
                  {doc.uploadedAt ? dayjs(doc.uploadedAt).format('MMM D, YYYY') : '—'}
                </div>
                {/* By */}
                <div className="ob-doc-col ob-doc-col--by ob-doc-muted">
                  {doc.uploadedByName || '—'}
                </div>
                {/* Status */}
                <div className="ob-doc-col ob-doc-col--status">
                  <span
                    className="ob-doc-status-badge"
                    style={{ color: stCfg.color, background: stCfg.bg }}
                  >
                    {stCfg.label}
                  </span>
                </div>
                {/* Actions */}
                <div className="ob-doc-col ob-doc-col--actions">
                  <Tooltip title="Download">
                    <a href={doc.documentUrl} download className="ob-doc-action-btn">
                      <DownloadOutlined />
                    </a>
                  </Tooltip>
                  <Popconfirm
                    title="Delete this document?"
                    description="This cannot be undone."
                    onConfirm={() => handleDelete(doc.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      type="button"
                      className="ob-doc-action-btn ob-doc-action-btn--danger"
                      disabled={deleting === doc.id}
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Wizard ──────────────────────────────────────────────────────── */}
      <AddDocumentWizard
        open={wizardOpen}
        employees={employees}
        onClose={() => setWizardOpen(false)}
        onSuccess={fetchDocuments}
      />

      {/* ── Styles ──────────────────────────────────────────────────────── */}
      <style jsx global>{`
        /* ── Wrap ── */
        .ob-doc-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          min-height: 0;
          padding-bottom: 24px;
        }

        /* ── Header ── */
        .ob-doc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 0 2px;
        }
        .ob-doc-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.025em;
          line-height: 1.1;
        }
        .ob-doc-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--text-slate-500);
        }
        .ob-doc-add-btn {
          height: 40px !important;
          font-weight: 700 !important;
          border-radius: 10px !important;
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
          white-space: nowrap;
        }
        .ob-doc-add-btn:hover {
          background: #2563eb !important;
          border-color: #2563eb !important;
        }

        /* ── Stats ── */
        .ob-doc-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) { .ob-doc-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .ob-doc-stats { grid-template-columns: 1fr; } }

        .ob-doc-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          background: var(--bg-pure-white);
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
        }
        .ob-doc-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ob-doc-stat-num {
          font-size: 26px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.03em;
        }
        .ob-doc-stat-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-slate-400);
          margin-top: 3px;
        }

        /* ── Filters ── */
        .ob-doc-filters {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
        }

        /* ── Table ── */
        .ob-doc-table-wrap {
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          background: var(--bg-pure-white);
          overflow: hidden;
          flex: 1;
        }
        .ob-doc-table-head {
          display: flex;
          align-items: center;
          padding: 0 14px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          min-height: 42px;
        }
        .ob-doc-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-slate-100);
          transition: background 0.12s ease;
        }
        .ob-doc-row:last-child { border-bottom: none; }
        .ob-doc-row:hover { background: var(--bg-slate-50); }

        .ob-doc-col {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }
        .ob-doc-table-head .ob-doc-col {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-slate-400);
        }
        .ob-doc-col--employee { flex: 1.4; min-width: 0; }
        .ob-doc-col--name    { flex: 1.6; min-width: 0; }
        .ob-doc-col--type    { flex: 1.2; min-width: 0; }
        .ob-doc-col--date    { flex: 0 0 110px; }
        .ob-doc-col--by      { flex: 1; min-width: 0; }
        .ob-doc-col--status  { flex: 0 0 90px; }
        .ob-doc-col--actions { flex: 0 0 90px; justify-content: flex-end; }

        .ob-doc-emp-name, .ob-doc-doc-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ob-doc-muted {
          font-size: 12.5px;
          color: var(--text-slate-500);
        }
        .ob-doc-type-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: var(--bg-slate-100);
          color: var(--text-slate-600);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ob-doc-status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .ob-doc-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-secondary);
          color: var(--text-slate-600);
          cursor: pointer;
          transition: all .12s ease;
          text-decoration: none;
        }
        .ob-doc-action-btn:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .ob-doc-action-btn--danger:hover { color: #dc2626; border-color: #fecaca; background: #fff1f2; }
        .ob-doc-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ob-doc-center {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          min-height: 280px;
        }

        /* ── Wizard ── */
        .ob-doc-wizard-modal .ant-modal-content { border-radius: 16px; overflow: hidden; padding: 0; }
        .ob-doc-wizard { display: flex; flex-direction: column; }

        .ob-doc-wizard-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 24px 0;
        }
        .ob-doc-wizard-head-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .ob-doc-wizard-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.02em;
        }
        .ob-doc-wizard-sub {
          font-size: 12.5px;
          color: var(--text-slate-500);
          margin-top: 2px;
        }

        .ob-doc-steps { padding: 18px 24px 4px; }

        .ob-doc-wizard-body {
          padding: 16px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ob-doc-field-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-slate-500);
          margin-bottom: 8px;
        }

        .ob-doc-emp-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          background: var(--bg-slate-50);
        }

        /* doc type chip grid */
        .ob-doc-type-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .ob-doc-type-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border: 1.5px solid var(--border-slate-200);
          border-radius: 999px;
          background: var(--bg-pure-white);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-700);
          cursor: pointer;
          transition: all .14s ease;
        }
        .ob-doc-type-chip:hover {
          border-color: #93c5fd;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .ob-doc-type-chip.is-selected {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
        }
        .ob-doc-type-chip--custom {
          border-style: dashed;
          color: var(--text-slate-500);
        }
        .ob-doc-type-chip--custom.is-selected {
          border-style: solid;
          border-color: #f59e0b;
          background: #fffbeb;
          color: #92400e;
        }

        .ob-doc-dragger {
          border-radius: 10px !important;
        }

        .ob-doc-extra-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .ob-doc-extra-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ob-doc-wizard-summary {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ob-doc-wizard-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid var(--border-slate-100);
        }
      `}</style>
    </div>
  );
}
