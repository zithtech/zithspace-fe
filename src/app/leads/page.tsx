"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Settings,
  Trash2,
  Mail,
  Phone,
  Clock,
  Link as LinkIcon,
  Calendar,
  Globe,
  Linkedin,
  Layers,
  FileText,
  DollarSign,
  User,
  Users,
  PlusCircle,
  X,
  ExternalLink,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sparkles,
  MoreVertical,
  ChevronRight,
  Edit2,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Brain,
  CheckCircle,
  ArrowUpRight,
  ListFilter,
  Download,
  Info,
  UploadCloud,
  FileUp,
  Link2,
  File,
  Paperclip,
  History,
  UserPlus,
  FolderPlus,
  FileEdit,
  Send,
  Handshake,
  Trophy,
  XCircle,
  UserCheck,
  Flag,
  Compass,
  Megaphone,
  Rocket,
  Award,
  Star
} from "lucide-react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Drawer,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  InputNumber,
  Divider,
  DatePicker,
  Avatar,
  Empty,
  Spin,
  Tabs,
  Dropdown,
  Modal,
  App,
  Skeleton,
  Popover,
  Segmented,
  Pagination,
  Switch,
  Upload,
  Timeline,
  type MenuProps
} from "antd";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { TablePreferenceService } from "@/services/tablePreferenceService";
import dayjs from "dayjs";
import { useLeads } from "@/hooks/useLeads";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import { Lead } from "@/services/leadService";
import { ProposalService } from "@/services/proposalService";
import {
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  FileOutlined,
  CalendarOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  SendOutlined,
  LinkOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { MailService } from "@/services/mailService";
import { api, apiClient } from "@/lib/axios";
import { useActivitySource } from "@/hooks/useActivitySource";

const DocumentRow = ({ field, remove, handleFileUpload, messageApi }: any) => {
  const { name, ...restField } = field;

  // Use useWatch to make the rows reactive to form changes
  const docType = Form.useWatch(['documents', name, 'type']) || 'link';
  const url = Form.useWatch(['documents', name, 'url']);
  const fileName = Form.useWatch(['documents', name, 'name']);

  return (
    <div className="doc-row-container">
      <Row gutter={16} align="middle">
        <Col span={24} style={{ marginBottom: 12 }}>
          <Form.Item name={[name, 'type']} initialValue="file" noStyle>
            <Segmented
              size="small"
              options={[
                { label: 'File', value: 'file', icon: <File size={12} /> },
                { label: 'Link', value: 'link', icon: <Link2 size={12} /> },
              ]}
              className="doc-type-segmented"
            />
          </Form.Item>
        </Col>

        <Col span={21}>
          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Missing name' }]} style={{ marginBottom: 8 }}>
            <Input
              placeholder="Document Title (e.g. Project Brief)"
              className="premium-input"
            />
          </Form.Item>

          {docType === 'link' ? (
            <Form.Item {...restField} name={[name, 'url']} rules={[{ required: true, message: 'Missing URL' }]} style={{ marginBottom: 0 }}>
              <Input
                prefix={<Link2 size={14} style={{ color: '#94a3b8' }} />}
                placeholder="https://example.com/document"
                className="premium-input"
              />
            </Form.Item>
          ) : (
            <div className="doc-upload-area">
              {url ? (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div className="doc-file-icon-box">
                    <FileText size={24} style={{ color: '#6366f1' }} />
                  </div>
                  <div className="doc-file-name">
                    {fileName || 'Document Uploaded'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Tooltip title="View">
                      <Button
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={async () => {
                          if (!url) return messageApi.warning('No file to view');
                          if (url.startsWith('data:')) {
                            try {
                              const parts = url.split(',');
                              const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
                              const b64 = parts[1];
                              const bin = atob(b64);
                              const u8 = new Uint8Array(bin.length);
                              for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                              const blob = new Blob([u8], { type: mime });
                              const blobUrl = URL.createObjectURL(blob);
                              window.open(blobUrl, '_blank');
                            } catch (e) {
                              window.open(url, '_blank');
                            }
                            return;
                          }
                          const loadingKey = 'view-doc';
                          try {
                            messageApi.loading({ content: 'Preparing document...', key: loadingKey });
                            const response = await apiClient.get(`/api/leads/attachments/download`, {
                              params: { url, filename: fileName || 'document', mode: 'inline' },
                              responseType: 'blob'
                            });
                            const blobUrl = URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
                            window.open(blobUrl, '_blank');
                            messageApi.destroy(loadingKey);
                          } catch (err) {
                            console.error('View error:', err);
                            messageApi.error({ content: 'Failed to open document', key: loadingKey });
                          }
                        }}
                        className="doc-action-btn"
                      />
                    </Tooltip>

                    <Upload
                      beforeUpload={(file) => {
                        const isLt10M = file.size / 1024 / 1024 < 10;
                        if (!isLt10M) {
                          messageApi.error('File must be smaller than 10MB!');
                          return Upload.LIST_IGNORE;
                        }
                        handleFileUpload(file, name);
                        return false;
                      }}
                      showUploadList={false}
                    >
                      <Tooltip title="Change File">
                        <Button
                          size="small"
                          icon={<RefreshCw size={14} />}
                          className="doc-action-btn"
                        />
                      </Tooltip>
                    </Upload>
                  </div>
                </div>
              ) : (
                <Upload
                  beforeUpload={(file) => {
                    const isLt10M = file.size / 1024 / 1024 < 10;
                    if (!isLt10M) {
                      messageApi.error('File must be smaller than 10MB!');
                      return Upload.LIST_IGNORE;
                    }
                    handleFileUpload(file, name);
                    return false;
                  }}
                  showUploadList={false}
                >
                  <div className="doc-upload-label">
                    <div className="doc-upload-icon-circle">
                      <UploadCloud size={24} />
                    </div>
                    <div className="doc-upload-text">
                      <span className="doc-upload-primary">Click to upload document</span>
                      <span className="doc-upload-secondary">PDF, DOCX, Images up to 10MB</span>
                    </div>
                  </div>
                </Upload>
              )}
              <Form.Item {...restField} name={[name, 'url']} rules={[{ required: true, message: 'Please upload a file' }]} hidden noStyle>
                <Input hidden />
              </Form.Item>
            </div>
          )}
        </Col>

        <Col span={3} style={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title="Remove Document">
            <Button
              type="text"
              danger
              icon={<Trash2 size={18} />}
              onClick={() => remove(name)}
              className="doc-remove-btn"
            />
          </Tooltip>
        </Col>
      </Row>
    </div>
  );
};
import { LeadMailDrawer } from "@/components/leads/LeadMailDrawer";
import { WebsiteLeadDrawer } from "@/components/leads/WebsiteLeadDrawer";

const { TextArea } = Input;
const { Text, Title } = Typography;

// Table settings — density + column visibility, persisted per-user in DB.
type LmDensity = "compact" | "comfortable" | "spacious";
const LM_TABLE_KEY = "leads_v1";
const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: "title", label: "Lead" },
  { key: "status", label: "Stage" },
  { key: "platform", label: "Source" },
  { key: "budget", label: "Value" },
  { key: "bidiq", label: "BidIq" },
  { key: "proposal", label: "Proposal" },
  { key: "mail", label: "Mail" },
  { key: "company", label: "Company" },
  { key: "created_by", label: "Owner" },
  { key: "priority", label: "Priority" },
  { key: "last_activity", label: "Last Activity" },
  { key: "actions_item", label: "Workflow Action" },
  { key: "ai_score", label: "AI Score" },
  { key: "created_at", label: "Created" },
  { key: "table-actions", label: "Actions" },
];

const DEFAULT_HIDDEN_COLS: Record<string, boolean> = {
  actions_item: true,
  ai_score: true,
  bidiq: true,
  proposal: true,
  mail: true,
  created_at: true,
};

// Brand glyphs (simple-icons paths, CC0). Use currentColor so the parent tints them.
const UpworkGlyph = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.139c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
  </svg>
);

const FreelancerGlyph = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m11.103 14.045 4.751-.866-3.04 2.696Zm2.707-4.545.65 1.802 2.745.305-2.746 2.066L20.13 9.55l1.327-3.176-2.927-.077ZM2.543 11.39l4.598 1.793-.41 1.553Zm15.214 6.853-3.353-1.474-2.057 2.318-1.43-1.474-7.165-1.318 9.06 6.722ZM0 .063l4.84 6.296 9.227 1.518L18.93.064l-3.483 3.04L11.103 0 7.06 3.04Z" />
  </svg>
);

const FiverrGlyph = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.004 15.588a.995.995 0 1 0 0 1.99.995.995 0 0 0 0-1.99zm-6.465-6.46h-2.973v-.348c0-.85.589-1.337 1.621-1.337h1.071V5.114h-1.404c-2.451 0-3.916 1.348-3.916 3.621v.391h-2.682v-.348c0-.85.589-1.337 1.621-1.337h.428V5.114h-.762c-2.451 0-3.916 1.348-3.916 3.621v.391H4.553v2.331h1.074v6.535h2.973v-6.535h2.682v6.535h2.973v-6.535h2.973v4.176c0 1.561.999 2.359 2.987 2.359h1.391v-2.337h-.832c-.581 0-.762-.165-.762-.671v-2.992h1.594V9.128h-1.594z" />
  </svg>
);

// Slim form for own-website inquiries (Zukvo, Zithtech). Skips gig-platform
// fields (skills, budget, AI score) and leads with the company-side block.
const WebsiteLeadFields = ({ configStatuses }: { configStatuses: any[] }) => {
  const sectionCard: React.CSSProperties = {
    marginBottom: 20,
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid var(--border-slate-100)',
  };
  const sectionHead: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 };
  const stepBadge = (color: string, n: string): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: `${color}14`, color, border: `1px solid ${color}33`,
  });
  const labelStyle = { fontSize: 12, color: '#64748b' } as const;

  return (
    <>
      {/* 01 — Source */}
      <div style={sectionCard}>
        <div style={sectionHead}>
          <span style={stepBadge('#6366f1', '01')}>01</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={15} color="#6366f1" />
              <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inquiry Source</span>
            </div>
            <Text className="premium-text-sec" style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Which website did this come from</Text>
          </div>
        </div>
        <Form.Item name="websiteSource" label={<Text strong style={labelStyle}>Website</Text>} initialValue="zukvo">
          <Select style={{ borderRadius: 8 }}>
            <Select.Option value="zukvo">Zukvo</Select.Option>
            <Select.Option value="zithtech">Zithtech</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>
      </div>

      {/* 02 — Contact */}
      <div style={sectionCard}>
        <div style={sectionHead}>
          <span style={stepBadge('#0ea5e9', '02')}>02</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={15} color="#0ea5e9" />
              <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</span>
            </div>
            <Text className="premium-text-sec" style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Who reached out — name, email, phone, location</Text>
          </div>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="clientName" label={<Text strong style={labelStyle}>Full Name</Text>} rules={[{ required: true }]}>
              <Input placeholder="e.g. Priya Shah" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="clientMail" label={<Text strong style={labelStyle}>Email</Text>} rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="priya@acme.com" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="clientPhone"
              label={<Text strong style={labelStyle}>Phone</Text>}
              getValueFromEvent={(e) => {
                const value = e.target.value;
                let sanitized = value.replace(/[^0-9\s\-()+]/g, '');
                if (sanitized.includes('+')) {
                  const hasPlusAtStart = sanitized.startsWith('+');
                  sanitized = sanitized.replace(/\+/g, '');
                  if (hasPlusAtStart) {
                    sanitized = '+' + sanitized;
                  }
                }
                let digitsCount = 0;
                let limited = '';
                for (let i = 0; i < sanitized.length; i++) {
                  const char = sanitized[i];
                  if (/\d/.test(char)) {
                    if (digitsCount < 15) {
                      digitsCount++;
                      limited += char;
                    }
                  } else {
                    limited += char;
                  }
                }
                return limited;
              }}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.resolve();
                    }
                    const digits = value.replace(/\D/g, '');
                    if (digits.length < 7) {
                      return Promise.reject(new Error('Phone number must contain at least 7 digits.'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input placeholder="+91 …" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="clientLocation" label={<Text strong style={labelStyle}>Location</Text>}>
              <Input placeholder="City, Country" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 03 — Company */}
      <div style={sectionCard}>
        <div style={sectionHead}>
          <span style={stepBadge('#f59e0b', '03')}>03</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={15} color="#f59e0b" />
              <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</span>
            </div>
            <Text className="premium-text-sec" style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Where they work and how big the team is</Text>
          </div>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="company" label={<Text strong style={labelStyle}>Company Name</Text>}>
              <Input placeholder="e.g. Acme Inc" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyDomain" label={<Text strong style={labelStyle}>Domain</Text>}>
              <Input placeholder="acme.com" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="companySize" label={<Text strong style={labelStyle}>Team Size</Text>}>
          <Select placeholder="Select range" style={{ borderRadius: 8 }} allowClear>
            <Select.Option value="1-10">1 – 10</Select.Option>
            <Select.Option value="11-50">11 – 50</Select.Option>
            <Select.Option value="51-200">51 – 200</Select.Option>
            <Select.Option value="201-500">201 – 500</Select.Option>
            <Select.Option value="501-1000">501 – 1,000</Select.Option>
            <Select.Option value="1000+">1,000+</Select.Option>
          </Select>
        </Form.Item>
      </div>

      {/* 04 — Inquiry */}
      <div style={sectionCard}>
        <div style={sectionHead}>
          <span style={stepBadge('#10b981', '04')}>04</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} color="#10b981" />
              <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inquiry</span>
            </div>
            <Text className="premium-text-sec" style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>What they said and where it sits in your pipeline</Text>
          </div>
        </div>
        <Form.Item name="title" label={<Text strong style={labelStyle}>Subject / Topic</Text>} rules={[{ required: true }]}>
          <Input placeholder="e.g. Quote request — invoice module" style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="inquiryMessage" label={<Text strong style={labelStyle}>Message</Text>}>
          <TextArea rows={4} placeholder="Their message verbatim — keep it untouched for context." style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="status" label={<Text strong style={labelStyle}>Stage</Text>}>
          <Select placeholder="Select stage" style={{ borderRadius: 8 }}>
            {configStatuses.map((s: any) => (
              <Select.Option key={s.id} value={s.name}>
                <Space>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                  {s.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="platform" hidden initialValue="Website">
          <Input />
        </Form.Item>
      </div>
    </>
  );
};

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 26;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function LeadsPage() {
  useActivitySource({ section: "WORK", module: "Leads", page: "LeadsList" });
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const {
    canReadLead,
    canCreateLead,
    canUpdateLead,
    canDeleteLead,
    canManageLeads,
    canCreateProposal
  } = usePermission();

  const [form] = Form.useForm();
  const { message: messageApi, modal } = App.useApp();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(12);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(15);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filterCreatedBy, setFilterCreatedBy] = useState<string | null>(null);
  const [filterMailStatus, setFilterMailStatus] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<"all" | "hot" | "today" | "with_proposal">("all");
  const [sortKey, setSortKey] = useState<"newest" | "oldest" | "value_high" | "value_low" | "score" | "activity">("newest");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [statusEditId, setStatusEditId] = useState<string | null>(null);
  const [actionEditId, setActionEditId] = useState<string | null>(null);
  const [bidiqPreviewLead, setBidiqPreviewLead] = useState<Lead | null>(null);
  const [tableDensity, setTableDensity] = useState<LmDensity>("compact");
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>(DEFAULT_HIDDEN_COLS);
  const [isMailDrawerVisible, setIsMailDrawerVisible] = useState(false);
  const [selectedLeadForMail, setSelectedLeadForMail] = useState<Lead | null>(null);
  const [invoiceMailSettings, setInvoiceMailSettings] = useState<any>(null);

  // Website-lead detail drawer (compact CRM-style)
  const [websiteDrawerOpen, setWebsiteDrawerOpen] = useState(false);
  const [websiteDrawerLead, setWebsiteDrawerLead] = useState<Lead | null>(null);

  // Timeline state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeTimelineLead, setActiveTimelineLead] = useState<Lead | null>(null);

  const openTimeline = async (lead: Lead) => {
    setActiveTimelineLead(lead);
    setTimelineOpen(true);
    setTimelineLoading(true);
    try {
      const res = await apiClient.get(`/api/leads/${lead.id}/timeline`);
      setTimelineData(res.data?.data || []);
    } catch {
      messageApi.error('Failed to load timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  // Gate persistence until the initial DB load completes; otherwise the persist
  // effects fire on first mount with the empty defaults and clobber whatever
  // the user previously saved.
  const [tablePrefsLoaded, setTablePrefsLoaded] = useState(false);
  const tablePrefsSaveTimer = useRef<number | null>(null);

  // Load saved preferences from the backend on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saved, invoiceSettings] = await Promise.all([
          TablePreferenceService.get<{
            density?: LmDensity;
            hiddenCols?: Record<string, boolean>;
          }>(LM_TABLE_KEY),
          MailService.getInvoiceMailSettings()
        ]);

        if (cancelled) return;

        if (saved?.density && ["compact", "comfortable", "spacious"].includes(saved.density)) {
          setTableDensity(saved.density);
        }
        if (saved?.hiddenCols && typeof saved.hiddenCols === "object") {
          setHiddenCols(saved.hiddenCols);
        }

        if (invoiceSettings) {
          const settings = invoiceSettings.settings || [];
          setInvoiceMailSettings(settings.find((s: any) => s.is_default_invoice_mail) || settings[0] || null);
        }
      } catch (err) {
        // 404 / no prefs yet is fine — keep defaults.
        console.warn("Failed to load table preferences or invoice settings", err);
      } finally {
        if (!cancelled) setTablePrefsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist any change (debounced) to the backend after the initial load.
  useEffect(() => {
    if (!tablePrefsLoaded) return;
    if (tablePrefsSaveTimer.current !== null) {
      window.clearTimeout(tablePrefsSaveTimer.current);
    }
    tablePrefsSaveTimer.current = window.setTimeout(() => {
      TablePreferenceService.save(LM_TABLE_KEY, {
        density: tableDensity,
        hiddenCols,
      }).catch((err) => console.warn("Failed to save table preferences", err));
    }, 300);
    return () => {
      if (tablePrefsSaveTimer.current !== null) {
        window.clearTimeout(tablePrefsSaveTimer.current);
        tablePrefsSaveTimer.current = null;
      }
    };
  }, [tablePrefsLoaded, tableDensity, hiddenCols]);

  const openBidiqPreview = (lead: Lead) => setBidiqPreviewLead(lead);
  const closeBidiqPreview = () => setBidiqPreviewLead(null);
  const launchBidiq = () => {
    if (!bidiqPreviewLead) return;
    const id = bidiqPreviewLead.id;
    setBidiqPreviewLead(null);
    router.push(`/leads/bidiq/${id}`);
  };

  // Proposal flow state & handlers
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalStep, setProposalStep] = useState<0 | 1>(0);
  const [selectedOption, setSelectedOption] = useState<"client" | "custom" | null>(null);
  const [customDates, setCustomDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [customCost, setCustomCost] = useState<number | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [selectedProposalLead, setSelectedProposalLead] = useState<Lead | null>(null);

  const openProposalFlow = (lead: Lead) => {
    setSelectedProposalLead(lead);
    setProposalStep(0);
    setSelectedOption(null);
    setCustomDates(null);
    setCustomCost(null);
    setProposalModalOpen(true);
  };

  const closeProposalFlow = () => {
    if (generatingProposal) return;
    setProposalModalOpen(false);
    setTimeout(() => {
      setProposalStep(0);
      setSelectedOption(null);
      setCustomDates(null);
      setCustomCost(null);
      setSelectedProposalLead(null);
    }, 200);
  };

  const goToOptionStep = () => {
    setSelectedOption("client");
    setCustomDates(null);
    setCustomCost(null);
    setProposalStep(1);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedProposalLead || !selectedOption) return;
    const lead = selectedProposalLead;
    const id = lead.id;
    let payload: { selection: "client" | "custom"; duration?: string; cost?: string | number; startDate?: string; endDate?: string };

    const clientBudgetNum = parseFloat(lead.budget?.replace(/[^0-9.]/g, "") || "0") || 50;

    if (selectedOption === "client") {
      payload = { selection: "client", duration: lead.duration, cost: lead.budget };
    } else {
      if (!customDates || customCost === null) return;
      const [start, end] = customDates;
      const days = end.diff(start, "day");
      const weeks = Math.round(days / 7);
      payload = {
        selection: "custom",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        duration: weeks > 0 ? `${weeks} week${weeks > 1 ? "s" : ""}` : `${days} day${days > 1 ? "s" : ""}`,
        cost: customCost,
      };
    }
    try {
      setGeneratingProposal(true);
      const res = await ProposalService.generateContentOnly(id, payload);
      if (res && res.blocks) {
        sessionStorage.setItem("pending_proposal_data", JSON.stringify({ ...res, selection: payload }));
        setProposalModalOpen(false);
        router.push(`/proposals/builder`);
      }
    } catch (error) {
      console.error("Proposal generation failed:", error);
      messageApi.error("Proposal generation failed");
    } finally {
      setGeneratingProposal(false);
    }
  };

  const clientBudgetNum = selectedProposalLead ? (parseFloat(selectedProposalLead.budget?.replace(/[^0-9.]/g, "") || "0") || 50) : 50;

  const suggestedBudgetVal = selectedProposalLead
    ? Math.round(clientBudgetNum * 0.9)
    : 0;

  const calculateLeadIntelligence = (lead: Lead) => {
    let durationHours = 40;
    if (lead.duration) {
      const dur = lead.duration.toLowerCase();
      if (dur.includes("month")) durationHours = (parseFloat(dur) || 1) * 160;
      else if (dur.includes("week")) durationHours = (parseFloat(dur) || 1) * 40;
    }
    const budgetNum = lead.budget ? parseFloat(lead.budget.replace(/[^0-9.]/g, "")) : 0;
    const budgetEffortFactor = budgetNum > 0 ? budgetNum / 55 : durationHours;
    const skillsCount = (lead.skills || []).length;
    const skillMultiplier = 1 + skillsCount * 0.12;
    const combinedBase = durationHours * 0.6 + budgetEffortFactor * 0.4;
    const hash = Array.from(lead.id as string).reduce((a, b) => a + b.charCodeAt(0), 0);
    const variance = 0.9 + (hash % 20) / 100;
    return Math.round(combinedBase * skillMultiplier * variance);
  };

  const baselineHours = selectedProposalLead ? calculateLeadIntelligence(selectedProposalLead) : 0;
  const customDays = customDates ? customDates[1].diff(customDates[0], "day") : 0;
  const customValid = !!customDates && customCost !== null && customCost > 0 && customDays > 0;

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user && !canReadLead) {
      router.push("/dashboard");
    }
  }, [user, isLoading, canReadLead, router]);

  // Use the custom hook for backend connectivity
  const { leads, loading: leadsLoading, error, fetchLeads, createLead, updateLead, deleteLead } = useLeads();
  const { statuses: configStatuses, actions: configActions, platforms: configPlatforms, fetchStatuses, fetchActions, fetchPlatforms, loading: settingsLoading } = useLeadSettings();

  const loading = leadsLoading || settingsLoading;

  const handleView = (record: Lead) => {
    if (record.lead_source_kind === 'website') {
      setWebsiteDrawerLead(record);
      setWebsiteDrawerOpen(true);
      return;
    }
    router.push(`/leads/view/${record.id}`);
  };

  // Load leads and settings on component mount
  useEffect(() => {
    fetchLeads();
    fetchStatuses();
    fetchActions();
    fetchPlatforms();
  }, [fetchLeads, fetchStatuses, fetchActions, fetchPlatforms]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead(leadId, { status: newStatus });
      messageApi.success('Status Updated');
    } catch (error) {
      messageApi.error('Failed to update status');
    }
  };

  const handleActionChange = async (leadId: string, newAction: string) => {
    try {
      await updateLead(leadId, { actions: newAction });
      messageApi.success('Action Updated');
    } catch (error) {
      messageApi.error('Failed to update action');
    }
  };

  const renderActionIcon = (iconName?: string): React.ReactElement => {
    switch (iconName) {
      case 'phone': return <PhoneOutlined />;
      case 'mail': return <MailOutlined />;
      case 'clock': return <ClockCircleOutlined />;
      case 'user': return <UserOutlined />;
      case 'file': return <FileOutlined />;
      case 'calendar': return <CalendarOutlined />;
      case 'message': return <MessageOutlined />;
      case 'video': return <VideoCameraOutlined />;
      case 'check': return <CheckCircleOutlined />;
      case 'close': return <CloseCircleOutlined />;
      case 'team': return <TeamOutlined />;
      case 'send': return <SendOutlined />;
      case 'link': return <LinkOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const AVATAR_PALETTE = [
    { bg: "#eff6ff", color: "#3b82f6" },
  ];

  const getAvatarStyle = (key: string) => {
    return AVATAR_PALETTE[0];
  };

  const getAIScoreLevel = (score?: number) => {
    if (score === undefined || score === null) return null;
    const minimal = { color: "var(--text-slate-600)", bg: "var(--bg-slate-50)" };
    if (score >= 80) return { label: "Hot", ...minimal, icon: <Flame size={11} /> };
    if (score >= 60) return { label: "Warm", ...minimal, icon: <TrendingUp size={11} /> };
    if (score >= 40) return { label: "Mild", ...minimal, icon: <Activity size={11} /> };
    return { label: "Cold", ...minimal, icon: <Activity size={11} /> };
  };

  const formatRelativeTime = (date?: string) => {
    if (!date) return "";
    const diff = dayjs().diff(dayjs(date), "hour");
    if (diff < 1) return "just now";
    if (diff < 24) return `${diff}h ago`;
    const days = Math.floor(diff / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return dayjs(date).format("MMM D");
  };

  const getLeadActionMenu = (record: Lead) => {
    const menuItems: MenuProps['items'] = [
      { key: 'view', label: 'View Details', icon: <Eye size={16} /> },
      canUpdateLead && { key: 'edit', label: 'Edit Lead', icon: <Settings size={16} /> },
      { key: 'timeline', label: 'View Timeline', icon: <History size={16} /> },
      (canUpdateLead || canDeleteLead) && { type: 'divider' },
      canDeleteLead && { key: 'delete', label: 'Delete Lead', danger: true, icon: <Trash2 size={16} /> }
    ].filter(Boolean) as MenuProps['items'];

    return (
      <Dropdown
        menu={{
          items: menuItems,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === 'view') handleView(record);
            if (key === 'edit') handleEdit(record);
            if (key === 'timeline') openTimeline(record);
            if (key === 'delete') {
              modal.confirm({
                title: "Are you sure you want to delete this lead?",
                content: "This action cannot be undone.",
                okText: "Delete",
                cancelText: "Cancel",
                okButtonProps: { danger: true },
                onOk: () => handleDelete(record.id)
              });
            }
          }
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <button type="button" onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-slate-400)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }} className="hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <EllipsisOutlined style={{ fontSize: 16 }} />
        </button>
      </Dropdown>
    );
  };

  const getLeadStatusPill = (record: Lead) => {
    const status = record.status;
    const cfg = configStatuses.find(s => s.name === status);
    const color = cfg?.color || '#6366f1';
    return (
      <span
        className="lm-status-pill"
        style={{
          backgroundColor: `${color}12`,
          color: color,
          border: `1px solid ${color}25`,
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        <span className="lm-status-pill-text">{status}</span>
      </span>
    );
  };

  // Resolve the creator name from whatever the backend returned. Do NOT fall
  // back to the currently-signed-in user — that's misleading for leads we
  // didn't create. Legacy rows with no creator on record return an empty string.
  const getLeadCreator = (lead: Lead): string => {
    const r = lead as any;
    return r.created_by_name || r.creator_name || r.owner_name || "";
  };

  const columns = [
    {
      title: "Lead",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Lead) => {
        const avatar = getAvatarStyle(record.client_name || record.id);
        const scoreLevel = getAIScoreLevel(record.ai_score);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              className="lead-avatar"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: avatar.bg,
                color: avatar.color || "var(--text-slate-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 11,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {getInitials(record.client_name)}
              {scoreLevel?.label === "Hot" && (
                <div style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff",
                  color: "var(--text-slate-600)"
                }}>
                  <Flame size={7} />
                </div>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                {(() => {
                  const fullTitle = text || "";
                  const isLong = fullTitle.length > 28;
                  const display = isLong ? `${fullTitle.slice(0, 28)}…` : fullTitle;
                  const titleNode = (
                    <Text
                      strong
                      style={{
                        color: "var(--text-slate-900)",
                        fontSize: 12.5,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em",
                        cursor: isLong ? "help" : "default",
                      }}
                    >
                      {display}
                    </Text>
                  );
                  if (!isLong) return titleNode;
                  return (
                    <Tooltip
                      placement="topLeft"
                      mouseEnterDelay={0.15}
                      classNames={{ root: "lm-title-tooltip-overlay" }}
                      title={
                        <div className="lm-title-tooltip">
                          <div className="lm-title-tooltip-eyebrow">Lead title</div>
                          <div className="lm-title-tooltip-text">{fullTitle}</div>
                          {(record.client_name || record.posted_on) && (
                            <div className="lm-title-tooltip-sub">
                              {record.client_name && <span>{record.client_name}</span>}
                              {record.client_name && record.posted_on && <span className="lm-title-tooltip-dot" />}
                              {record.posted_on && <span>Posted {formatRelativeTime(record.posted_on)}</span>}
                            </div>
                          )}
                        </div>
                      }
                    >
                      {titleNode}
                    </Tooltip>
                  );
                })()}
                {record.client_payment_verified && (
                  <span title="Payment Verified" style={{ display: "inline-flex", color: "#10b981" }}>
                    <CheckCircle size={13} />
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-slate-400)", lineHeight: 1.2, marginTop: 1 }}>
                <span style={{ fontWeight: 500 }}>{record.client_name}</span>
                {record.posted_on && (
                  <>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <span style={{ color: "#94a3b8" }}>{formatRelativeTime(record.posted_on)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Source",
      dataIndex: "platform",
      key: "platform",
      width: 130,
      render: (platform: string) => {
        const p = platform || "Upwork";
        const palette: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
          Upwork: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <UpworkGlyph size={11} /> },
          LinkedIn: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <Linkedin size={11} strokeWidth={2.4} /> },
          Freelancer: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <FreelancerGlyph size={11} /> },
          Fiverr: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <FiverrGlyph size={11} /> },
          Zukvo: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <Sparkles size={11} strokeWidth={2.2} /> },
          Zithtech: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <Layers size={11} strokeWidth={2.2} /> },
          Website: { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <Globe size={11} strokeWidth={2.2} /> },
        };
        const meta = palette[p] || { bg: "var(--bg-slate-50)", color: "var(--text-slate-600)", border: "var(--border-slate-200)", icon: <Briefcase size={11} strokeWidth={2.2} /> };
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 7px",
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 600,
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
            }}
          >
            {meta.icon}
            {p}
          </span>
        );
      },
    },
    {
      title: "Stage",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string, record: Lead) => {
        const cfg = configStatuses.find(s => s.name === status);
        const color = cfg?.color || '#6366f1';
        const isEditing = statusEditId === record.id;

        if (isEditing) {
          return (
            <Select
              value={status}
              defaultOpen
              autoFocus
              style={{ width: '100%' }}
              bordered={false}
              className="status-select-premium lm-status-select"
              classNames={{ popup: { root: "lm-status-dropdown" } }}
              onChange={(value) => { handleStatusChange(record.id, value); setStatusEditId(null); }}
              onBlur={() => setStatusEditId(null)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              popupMatchSelectWidth={false}
              suffixIcon={null}
              optionLabelProp="label"
              options={configStatuses.map(s => {
                const c = s.color || "#6366f1";
                return {
                  value: s.name,
                  label: (
                    <span
                      className="lm-status-pill"
                      style={{
                        backgroundColor: `${c}12`,
                        color: c,
                        border: `1px solid ${c}25`,
                      }}
                    >
                      <span className="lm-status-pill-text">{s.name}</span>
                    </span>
                  ),
                  data: { color: c, name: s.name },
                };
              })}
              optionRender={(opt) => {
                const d: any = (opt.data as any)?.data || (opt as any).data || {};
                const c = d.color || "#6366f1";
                const selected = (opt.value as string) === status;
                return (
                  <div className={`lm-dd-row${selected ? " is-selected" : ""}`}>
                    <span className="lm-dd-dot" style={{ background: c, boxShadow: `0 0 0 3px ${c}26` }} />
                    <span className="lm-dd-text" style={{ color: selected ? "var(--text-slate-900)" : "var(--text-slate-700)" }}>
                      {d.name || (opt.value as string)}
                    </span>
                    {selected && <CheckCircle2 size={13} className="lm-dd-check" style={{ color: c }} />}
                  </div>
                );
              }}
            />
          );
        }

        return (
          <button
            type="button"
            className="lm-status-pill"
            onClick={(e) => {
              e.stopPropagation();
              setStatusEditId(record.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              ["--pill-color" as any]: "var(--text-slate-500)",
              backgroundColor: "var(--bg-slate-50)",
              color: "var(--text-slate-500)",
              border: `1px solid var(--border-slate-200)`,
            }}
            title="Click to change status"
          >
            <span className="lm-status-pill-text">{status || "—"}</span>
            <Edit2 size={10} className="lm-status-pill-edit" />
          </button>
        );
      },
    },
    {
      title: "Workflow Action",
      dataIndex: "actions_item",
      key: "actions_item",
      width: 150,
      render: (action: string, record: Lead) => {
        const cfg = configActions.find(a => a.name === action);
        const color = cfg?.color || "#6366f1";
        const isEditing = actionEditId === record.id;

        if (isEditing) {
          return (
            <Select
              defaultValue={action}
              defaultOpen
              autoFocus
              allowClear
              placeholder="Choose action"
              style={{ width: "100%" }}
              bordered={false}
              className="status-select-premium lm-status-select"
              classNames={{ popup: { root: "lm-status-dropdown" } }}
              onChange={(value) => { handleActionChange(record.id, value || ""); setActionEditId(null); }}
              onBlur={() => setActionEditId(null)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              popupMatchSelectWidth={false}
              suffixIcon={null}
              optionLabelProp="label"
              options={configActions.map(a => {
                const c = a.color || "#6366f1";
                return {
                  value: a.name,
                  label: (
                    <span
                      className="lm-status-pill lm-action-pill"
                      style={{
                        backgroundColor: `${c}12`,
                        color: c,
                        border: `1px solid ${c}25`,
                      }}
                    >
                      <span className="lm-action-pill-icon" style={{ background: `${c}22`, color: c }}>
                        {React.cloneElement(renderActionIcon(a.icon) as React.ReactElement, { style: { fontSize: 11 } })}
                      </span>
                      <span className="lm-status-pill-text">{a.name}</span>
                    </span>
                  ),
                  data: { color: c, name: a.name, icon: a.icon },
                };
              })}
              optionRender={(opt) => {
                const d: any = (opt.data as any)?.data || (opt as any).data || {};
                const c = d.color || "#6366f1";
                const selected = (opt.value as string) === action;
                return (
                  <div className={`lm-dd-row${selected ? " is-selected" : ""}`}>
                    <span className="lm-dd-icon" style={{ background: `${c}14`, color: c, border: `1px solid ${c}26` }}>
                      {React.cloneElement(renderActionIcon(d.icon) as React.ReactElement, { style: { fontSize: 12 } })}
                    </span>
                    <span className="lm-dd-text" style={{ color: selected ? "var(--text-slate-900)" : "var(--text-slate-700)" }}>
                      {d.name || (opt.value as string)}
                    </span>
                    {selected && <CheckCircle2 size={13} className="lm-dd-check" style={{ color: c }} />}
                  </div>
                );
              }}
            />
          );
        }

        if (!action) {
          return (
            <button
              type="button"
              className="lm-status-pill lm-status-pill-empty"
              onClick={(e) => { e.stopPropagation(); setActionEditId(record.id); }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Click to set action"
            >
              <PlusCircle size={11} />
              Set action
            </button>
          );
        }

        return (
          <button
            type="button"
            className="lm-status-pill lm-action-pill"
            onClick={(e) => { e.stopPropagation(); setActionEditId(record.id); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              ["--pill-color" as any]: "var(--text-slate-500)",
              backgroundColor: "var(--bg-slate-50)",
              color: "var(--text-slate-500)",
              border: `1px solid var(--border-slate-200)`,
            }}
            title="Click to change action"
          >
            <span
              className="lm-action-pill-icon"
              style={{ background: `${color}22`, color }}
            >
              {React.cloneElement(renderActionIcon(cfg?.icon || "") as React.ReactElement, { style: { fontSize: 11 } })}
            </span>
            <span className="lm-status-pill-text">{action}</span>
            <Edit2 size={10} className="lm-status-pill-edit" />
          </button>
        );
      },
    },
    {
      title: "Value",
      key: "budget",
      width: 110,
      render: (_: unknown, record: Lead) => {
        const value = record.budget || (record.hour_based_amount ? `${record.hour_based_amount}/hr` : null);
        if (!value) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        const isHourly = String(value).includes("/hr");
        return (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <DollarSign size={13} style={{ color: "var(--text-slate-400)", alignSelf: "center" }} />
            <Text strong style={{ color: "var(--text-slate-900)", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
              {String(value).replace(/^\$/, "").replace("/hr", "")}
            </Text>
            {isHourly && (
              <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>/hr</Text>
            )}
          </div>
        );
      },
    },
    {
      title: "AI Score",
      dataIndex: "ai_score",
      key: "ai_score",
      width: 110,
      render: (score: number | undefined) => {
        const level = getAIScoreLevel(score);
        if (!level) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: level.bg,
              color: level.color,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.03em",
              border: `1px solid ${level.color}25`,
            }}
          >
            {level.icon}
            <span>{level.label}</span>
            <span style={{ opacity: 0.7, fontWeight: 600 }}>{score}</span>
          </div>
        );
      },
    },
    {
      title: "BidIq",
      key: "bidiq",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: Lead) => {
        // Website-sourced leads (Zukvo / Zithtech inquiries) don't go through
        // the gig-platform proposal flow, so BidIQ doesn't apply.
        if (record.lead_source_kind === "website") {
          return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        }

        const hasBidiq =
          (record.ai_score && record.ai_score > 0) ||
          !!record.skill_analysis ||
          !!record.ai_summary;

        return (
          canManageLeads && (
            <Button
              type="link"
              icon={hasBidiq ? <Eye size={13} /> : <Zap size={13} />}
              onClick={(e) => {
                e.stopPropagation();
                if (hasBidiq) {
                  router.push(`/leads/bidiq/${record.id}`);
                } else {
                  openBidiqPreview(record);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: hasBidiq ? "#10b981" : "var(--premium-blue)",
                fontWeight: 700,
                fontSize: 11.5,
                padding: 0,
              }}
            >
              {hasBidiq ? "View BidIq" : "BidIq"}
            </Button>
          )
        );
      },
    },
    {
      title: "Proposal",
      key: "proposal",
      width: 140,
      render: (_: unknown, record: Lead) => (
        canCreateProposal && (
          record.proposal_id ? (
            <Button
              type="link"
              icon={<FileText size={13} />}
              onClick={(e) => { e.stopPropagation(); router.push(`/proposals/builder?id=${record.proposal_id}`); }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#10b981",
                fontWeight: 700,
                fontSize: 11.5,
                padding: 0
              }}
            >
              View Proposal
            </Button>
          ) : (
            <Button
              type="link"
              icon={<Sparkles size={13} />}
              onClick={(e) => { e.stopPropagation(); openProposalFlow(record); }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--premium-blue)",
                fontWeight: 700,
                fontSize: 11.5,
                padding: 0
              }}
            >
              Generate
            </Button>
          )
        )
      ),
    },
    {
      title: "Mail",
      key: "mail",
      width: 140,
      render: (_: unknown, record: Lead) => {
        const isSent = !!record.last_mail_at || !!record.is_mail_sent;
        const lastMailAt = record.last_mail_at;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              type="link"
              icon={isSent ? <CheckCircle size={13} /> : <Mail size={13} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLeadForMail(record);
                setIsMailDrawerVisible(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: isSent ? "#10b981" : "var(--premium-blue)",
                fontWeight: 700,
                fontSize: 11.5,
                padding: 0,
                height: "auto"
              }}
            >
              {isSent ? "Sent" : "Send Mail"}
            </Button>
            {lastMailAt && (
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, paddingLeft: 20, marginTop: -2 }}>
                {dayjs(lastMailAt).format("MMM D, YYYY")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Company",
      dataIndex: "client_name",
      key: "company",
      width: 180,
      render: (clientName: string) => (
        <Text style={{ color: "var(--text-slate-700)", fontSize: 11.5, fontWeight: 600 }} ellipsis>
          {clientName || "—"}
        </Text>
      ),
    },
    {
      title: "Owner",
      key: "created_by",
      width: 160,
      render: (_: unknown, record: Lead) => {
        const r = record as any;
        const rawName: string | undefined =
          r.created_by_name || r.creator_name || r.owner_name;
        const name = rawName || "Unknown";
        // "you" annotation only when the signed-in user truly created this row.
        const isYou = !!user?.name && rawName === user.name;
        const initials = name.trim().charAt(0).toUpperCase() || "—";
        const palette = getAvatarStyle(name);
        return (
          <div className="lm-creator-cell">
            <span
              className="lm-creator-avatar"
              style={{ background: palette.bg, color: palette.color || "var(--text-slate-600)", border: "none" }}
            >
              {initials}
            </span>
            <div className="lm-creator-text">
              <span className="lm-creator-name">
                {name}
                {isYou && <span className="lm-creator-you"> · you</span>}
              </span>
              {r.created_by_email && (
                <span className="lm-creator-email">{r.created_by_email}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Priority",
      key: "priority",
      width: 120,
      render: (_: unknown, record: Lead) => {
        const score = record.ai_score;
        let label = "Low";
        let color = "#94a3b8";
        if (score == null) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        if (score >= 80) { label = "High"; color = "var(--text-slate-500)"; }
        else if (score >= 60) { label = "Medium"; color = "var(--text-slate-400)"; }
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {label}
          </span>
        );
      },
    },
    {
      title: "Last Activity",
      key: "last_activity",
      width: 120,
      render: (_: unknown, record: Lead) => {
        const ts = record.last_mail_at || record.updated_at || record.created_at;
        if (!ts) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        return (
          <Tooltip title={dayjs(ts).format("MMM D, YYYY · h:mm A")} placement="topLeft">
            <span style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
              {formatRelativeTime(ts)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (value: string) => {
        if (!value) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        const d = dayjs(value);
        return (
          <Tooltip title={d.format("MMM D, YYYY · h:mm A")} placement="topLeft">
            <div className="lm-created-cell">
              <span className="lm-created-date">{d.format("MMM D, YYYY")}</span>
              <span className="lm-created-rel">{formatRelativeTime(value)}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "table-actions",
      align: "right" as const,
      width: 80,
      fixed: "right" as const,
      render: (_: unknown, record: Lead) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: 'View Details',
            icon: <Eye size={16} />,
          },
          canUpdateLead && {
            key: 'edit',
            label: 'Edit Lead',
            icon: <Settings size={16} />,
          },
          {
            key: 'timeline',
            label: 'View Timeline',
            icon: <History size={16} />,
          },
          (canUpdateLead || canDeleteLead) && {
            type: 'divider',
          },
          canDeleteLead && {
            key: 'delete',
            label: 'Delete Lead',
            danger: true,
            icon: <Trash2 size={16} />,
          }
        ].filter(Boolean) as MenuProps['items'];

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'view') handleView(record);
                if (key === 'edit') handleEdit(record);
                if (key === 'timeline') {
                  openTimeline(record);
                }
                if (key === 'delete') {
                  modal.confirm({
                    title: "Are you sure you want to delete this lead?",
                    content: "This action cannot be undone.",
                    okText: "Delete",
                    cancelText: "Cancel",
                    okButtonProps: { danger: true },
                    onOk: () => handleDelete(record.id)
                  });
                }
              }
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreVertical size={20} style={{ color: "var(--text-slate-400)" }} />}
              className="action-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  const handleEdit = (record: Lead) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      clientName: record.client_name,
      clientMail: record.client_mail,
      clientPhone: record.client_phone,
      clientLocation: record.client_location,
      title: record.title,
      summary: record.summary,
      skills: record.skills,
      duration: record.duration,
      hourBasedAmount: record.hour_based_amount,
      jobLink: record.job_link,
      estOrProjectDuration: record.est_project_duration,
      status: record.status,
      actions: record.actions_item,
      timeline: record.timeline_start && record.timeline_end
        ? [dayjs(record.timeline_start), dayjs(record.timeline_end)]
        : null,
      postedOn: record.posted_on ? dayjs(record.posted_on) : null,
      documents: Array.isArray(record.documents)
        ? record.documents.map(doc =>
          typeof doc === 'string' ? { name: doc, url: doc } : doc
        )
        : record.documents,
      platform: ['Upwork', 'LinkedIn', 'Freelancer', 'Fiverr', 'Website'].includes(record.platform || '') ? record.platform : 'Other',
      customPlatform: !['Upwork', 'LinkedIn', 'Freelancer', 'Fiverr', 'Website'].includes(record.platform || '') ? record.platform : '',
      experienceLevel: record.experience_level,
      jobType: record.job_type,
      budget: record.budget,
      clientRating: record.client_rating,
      clientSpend: record.client_spend,
      clientPaymentVerified: record.client_payment_verified,
      clientPhoneVerified: record.client_phone_verified,
      ai_summary: record.ai_summary,

      // Lead source kind + shared company block
      leadSourceKind: record.lead_source_kind || 'platform',
      company: record.company,
      companyDomain: record.company_domain,
      companySize: record.company_size,
      inquiryMessage: record.inquiry_message,
      websiteSource: record.website_source,
    });
    setIsDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      messageApi.success("Lead moved to Trash");
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: `Delete ${selectedRowKeys.length} lead${selectedRowKeys.length > 1 ? "s" : ""}?`,
      content: "Selected leads will be moved to Trash. This action can be reverted from there.",
      okText: "Move to Trash",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((id) => deleteLead(String(id))));
          messageApi.success(`${selectedRowKeys.length} lead${selectedRowKeys.length > 1 ? "s" : ""} moved to Trash`);
          setSelectedRowKeys([]);
        } catch (err) {
          // Error surfaced via hook
        }
      },
    });
  };

  const handleSaveLead = async (values: any) => {
    try {
      // Map custom platform if 'Other' is selected
      const finalValues = { ...values };
      if (values.platform === 'Other') {
        finalValues.platform = values.customPlatform;
      }
      delete finalValues.customPlatform;

      // Website leads: derive a recognizable source label from the picked site,
      // so the table / sidebar Source column reflects Zukvo / Zithtech directly.
      if (finalValues.leadSourceKind === 'website') {
        const map: Record<string, string> = { zukvo: 'Zukvo', zithtech: 'Zithtech' };
        finalValues.platform = map[finalValues.websiteSource] || 'Website';
      }

      if (editingKey) {
        await updateLead(editingKey, finalValues);
        messageApi.success("Lead Updated");
      } else {
        await createLead(finalValues);
        messageApi.success("Lead Created");
      }
      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const handleFileUpload = async (file: any, index: number) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      form.setFieldValue(['documents', index, 'url'], base64);
      form.setFieldValue(['documents', index, 'type'], 'file');
      if (!form.getFieldValue(['documents', index, 'name'])) {
        form.setFieldValue(['documents', index, 'name'], file.name);
      }
      messageApi.success(`${file.name} attached locally`);
    };
    reader.readAsDataURL(file);
  };

  const parseBudgetValue = (lead: Lead): number => {
    const raw = lead.budget || lead.hourly_rate || "";
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  const filteredLeads = useMemo(() => {
    const weekAgo = dayjs().subtract(7, 'day');
    const filtered = leads.filter(item => {
      // Search matching
      const matchesSearch = !searchText ||
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchText.toLowerCase());

      // Status matching — "Converted Clients" also catches anything with a proposal,
      // so the table reflects the same count shown in the sidebar.
      const matchesStatus =
        !filterStatus ||
        item.status === filterStatus ||
        (filterStatus === "Converted Clients" && !!item.proposal_id);

      // Action matching
      const matchesAction = !filterAction || item.actions_item === filterAction;

      // Platform matching
      const matchesPlatform = !filterPlatform || item.platform === filterPlatform;

      // Date Range matching
      let matchesDateRange = true;
      if (filterDateRange && item.posted_on) {
        const postedOn = dayjs(item.posted_on);
        const [start, end] = filterDateRange;
        matchesDateRange = postedOn.isAfter(start.startOf('day')) && postedOn.isBefore(end.endOf('day'));
      }

      // Created-by matching
      const matchesCreatedBy =
        !filterCreatedBy ||
        getLeadCreator(item) === filterCreatedBy;

      // Mail status matching
      let matchesMailStatus = true;
      if (filterMailStatus === 'sent') {
        matchesMailStatus = !!item.last_mail_at || !!item.is_mail_sent;
      } else if (filterMailStatus === 'not_sent') {
        matchesMailStatus = !item.last_mail_at && !item.is_mail_sent;
      }

      // Segment matching
      let matchesSegment = true;
      if (activeSegment === "hot") {
        matchesSegment = (item.ai_score || 0) >= 80;
      } else if (activeSegment === "today") {
        const startOfDay = dayjs().startOf('day');
        const endOfDay = dayjs().endOf('day');
        const dt = dayjs(item.created_at || item.posted_on);
        matchesSegment = (dt.isAfter(startOfDay) || dt.isSame(startOfDay)) && (dt.isBefore(endOfDay) || dt.isSame(endOfDay));
      } else if (activeSegment === "with_proposal") {
        matchesSegment = !!item.proposal_id;
      }

      return matchesSearch && matchesStatus && matchesAction && matchesPlatform && matchesDateRange && matchesCreatedBy && matchesSegment && matchesMailStatus;
    });

    const sorted = [...filtered];
    const tsOf = (l: Lead, field: "created_at" | "updated_at"): number =>
      dayjs(l[field] || l.posted_on || 0).valueOf();
    switch (sortKey) {
      case "oldest":
        sorted.sort((a, b) => tsOf(a, "created_at") - tsOf(b, "created_at"));
        break;
      case "value_high":
        sorted.sort((a, b) => parseBudgetValue(b) - parseBudgetValue(a));
        break;
      case "value_low":
        sorted.sort((a, b) => parseBudgetValue(a) - parseBudgetValue(b));
        break;
      case "score":
        sorted.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
        break;
      case "activity":
        sorted.sort((a, b) => tsOf(b, "updated_at") - tsOf(a, "updated_at"));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => tsOf(b, "created_at") - tsOf(a, "created_at"));
        break;
    }
    return sorted;
  }, [leads, searchText, filterStatus, filterAction, filterPlatform, filterDateRange, filterCreatedBy, activeSegment, user, filterMailStatus, sortKey]);

  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      const name = getLeadCreator(l);
      if (name) set.add(name);
    });
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, user]);

  const stageDropdownOptions = useMemo(() => {
    return (configStatuses || [])
      .filter((s: any) => s.is_active)
      .map((s: any) => {
        const c = s.color || "#6366f1";
        return {
          value: s.name,
          label: s.name,
          badge: (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: c,
              }}
            />
          ),
        };
      });
  }, [configStatuses]);

  const actionDropdownOptions = useMemo(() => {
    return (configActions || [])
      .filter((a: any) => a.is_active)
      .map((a: any) => {
        return {
          value: a.name,
          label: a.name,
          badge: renderActionIcon(a.icon),
        };
      });
  }, [configActions]);

  const creatorDropdownOptions = useMemo(() => {
    return creatorOptions.map(name => {
      const palette = getAvatarStyle(name);
      return {
        value: name,
        label: name,
        badge: (
          <span
            className="lm-creator-avatar"
            style={{
              background: palette.bg,
              width: 20,
              height: 20,
              fontSize: 9,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              borderRadius: '50%',
              fontWeight: 700
            }}
          >
            {getInitials(name)}
          </span>
        )
      };
    });
  }, [creatorOptions]);

  const sortDropdownOptions = useMemo(() => [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "value_high", label: "Value: high → low" },
    { value: "value_low", label: "Value: low → high" },
    { value: "score", label: "AI score: highest" },
    { value: "activity", label: "Recently active" },
  ], []);

  const mailDropdownOptions = useMemo(() => [
    {
      value: "sent",
      label: "Sent",
      badge: <CheckCircle size={14} style={{ color: '#10b981' }} />
    },
    {
      value: "not_sent",
      label: "Not Sent",
      badge: <Mail size={14} style={{ color: '#94a3b8' }} />
    }
  ], []);

  // Icon-key → render fn map. Mirrors the catalogue in /leads/settings so we
  // can resolve whatever the admin saved on a platform's logo_url ("icon:upwork")
  // or a status's icon column ("trophy").
  const PLATFORM_ICON_RESOLVERS: Record<string, { brand: string; render: React.ReactNode }> = {
    upwork: { brand: "#14a800", render: <UpworkGlyph /> },
    linkedin: { brand: "#0a66c2", render: <Linkedin size={13} strokeWidth={2.4} /> },
    freelancer: { brand: "#29b2fe", render: <FreelancerGlyph /> },
    fiverr: { brand: "#1dbf73", render: <FiverrGlyph /> },
    toptal: { brand: "#204ecf", render: <span style={{ fontSize: 11, fontWeight: 900 }}>T</span> },
    guru: { brand: "#ff7a18", render: <span style={{ fontSize: 11, fontWeight: 900 }}>G</span> },
    peopleperhour: { brand: "#ff7c00", render: <span style={{ fontSize: 11, fontWeight: 900 }}>P</span> },
    hubstaff: { brand: "#3aabea", render: <span style={{ fontSize: 11, fontWeight: 900 }}>H</span> },
    indeed: { brand: "#003a9b", render: <span style={{ fontSize: 11, fontWeight: 900 }}>I</span> },
    globe: { brand: "#6366f1", render: <Globe size={13} strokeWidth={2.2} /> },
    sparkles: { brand: "#8b5cf6", render: <Sparkles size={13} strokeWidth={2.2} /> },
    briefcase: { brand: "#475569", render: <Briefcase size={13} strokeWidth={2.2} /> },
    star: { brand: "#f59e0b", render: <Star size={13} strokeWidth={2.2} /> },
    zap: { brand: "#ec4899", render: <Zap size={13} strokeWidth={2.2} /> },
  };

  const STATUS_ICON_RESOLVERS: Record<string, React.ReactNode> = {
    flag: <Flag size={13} strokeWidth={2.2} />,
    target: <Target size={13} strokeWidth={2.2} />,
    compass: <Compass size={13} strokeWidth={2.2} />,
    sparkles: <Sparkles size={13} strokeWidth={2.2} />,
    megaphone: <Megaphone size={13} strokeWidth={2.2} />,
    handshake: <Handshake size={13} strokeWidth={2.2} />,
    rocket: <Rocket size={13} strokeWidth={2.2} />,
    "shield-check": <ShieldCheck size={13} strokeWidth={2.2} />,
    trophy: <Trophy size={13} strokeWidth={2.2} />,
    award: <Award size={13} strokeWidth={2.2} />,
  };

  const resolvePlatformBadge = (plat: any): { color: string; icon: React.ReactNode } => {
    const logoUrl: string | undefined = plat?.logo_url;
    if (logoUrl && logoUrl.startsWith("icon:")) {
      const key = logoUrl.slice(5);
      const meta = PLATFORM_ICON_RESOLVERS[key];
      if (meta) return { color: meta.brand, icon: meta.render };
    }
    if (logoUrl) {
      return {
        color: "#6366f1",
        icon: <img src={logoUrl} alt="" style={{ width: 13, height: 13, objectFit: "contain" }} />,
      };
    }
    return { color: "#6366f1", icon: <Briefcase size={13} strokeWidth={2.2} /> };
  };

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    leads.forEach(l => {
      const p = (l.platform || "").trim();
      if (!p) return;
      counts.set(p, (counts.get(p) || 0) + 1);
    });

    // Only show platforms the admin has set as active. Unmatched leads bucket
    // into "Others" so they're still navigable.
    const activePlatforms = (configPlatforms || []).filter((p: any) => p.is_active);
    const consumed = new Set<string>();
    const rows = activePlatforms.map((plat: any) => {
      const c = counts.get(plat.name) || 0;
      consumed.add(plat.name);
      const badge = resolvePlatformBadge(plat);
      return { name: plat.name, count: c, color: badge.color, icon: badge.icon };
    });
    let other = 0;
    counts.forEach((c, name) => { if (!consumed.has(name)) other += c; });
    if (other > 0) {
      rows.push({ name: "Others", count: other, color: "#94a3b8", icon: <Briefcase size={13} strokeWidth={2.2} /> });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, configPlatforms]);

  const pipelineOptions = useMemo(() => {
    const byStatus = new Map<string, number>();
    let convertedCount = 0;
    leads.forEach(l => {
      const s = (l.status || "").trim().toLowerCase();
      if (s) byStatus.set(s, (byStatus.get(s) || 0) + 1);
      if (l.proposal_id) convertedCount += 1;
    });
    const activeStatuses = (configStatuses || []).filter((s: any) => s.is_active);
    return activeStatuses.map((stage: any) => {
      const lowered = stage.name.toLowerCase();
      let count = byStatus.get(lowered) || 0;
      // Keep the historical Converted Clients behaviour: any lead with a
      // proposal counts toward that stage even if its status text differs.
      if (lowered === "converted clients") {
        count = Math.max(count, convertedCount);
      }
      const icon =
        STATUS_ICON_RESOLVERS[stage.icon || ""] ||
        <Activity size={13} strokeWidth={2.2} />;
      return {
        id: stage.id || stage.name,
        name: stage.name,
        color: stage.color || "#6366f1",
        icon,
        count,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, configStatuses]);

  const pipelineTotal = useMemo(
    () => pipelineOptions.reduce((acc, o) => acc + o.count, 0),
    [pipelineOptions]
  );

  const segmentCounts = useMemo(() => {
    const weekAgo = dayjs().subtract(7, 'day');
    return {
      all: leads.length,
      hot: leads.filter(l => (l.ai_score || 0) >= 80).length,
      week: leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(weekAgo)).length,
      won: leads.filter(l => {
        const s = (l.status || "").toLowerCase();
        return s.includes("won") || s.includes("accept") || s.includes("close") || !!l.proposal_id;
      }).length,
    };
  }, [leads]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (filterStatus) chips.push({ key: "status", label: `Status: ${filterStatus}`, onClear: () => setFilterStatus(null) });
    if (filterPlatform) chips.push({ key: "platform", label: `Platform: ${filterPlatform}`, onClear: () => setFilterPlatform(null) });
    if (filterAction) chips.push({ key: "action", label: `Action: ${filterAction}`, onClear: () => setFilterAction(null) });
    if (filterDateRange) chips.push({
      key: "date",
      label: `${filterDateRange[0].format("MMM D")} – ${filterDateRange[1].format("MMM D")}`,
      onClear: () => setFilterDateRange(null),
    });
    if (filterCreatedBy) chips.push({
      key: "createdBy",
      label: `Created by: ${filterCreatedBy}`,
      onClear: () => setFilterCreatedBy(null),
    });
    if (searchText) chips.push({ key: "search", label: `“${searchText}”`, onClear: () => setSearchText("") });
    return chips;
  }, [filterStatus, filterPlatform, filterAction, filterDateRange, filterCreatedBy, searchText]);

  const leadsToday = useMemo(() => {
    const today = dayjs().startOf('day');
    return leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(today)).length;
  }, [leads]);

  const leadsThisWeek = useMemo(() => {
    const weekAgo = dayjs().subtract(7, 'day');
    return leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(weekAgo)).length;
  }, [leads]);

  const hotLeadsCount = useMemo(() => {
    return leads.filter(l => (l.ai_score || 0) >= 80).length;
  }, [leads]);

  const pipelineRate = useMemo(() => {
    if (!leads.length) return 0;
    const withProposal = leads.filter(l => !!l.proposal_id).length;
    return Math.round((withProposal / leads.length) * 100);
  }, [leads]);

  const pipelineRateTrend = useMemo(() => {
    if (!leads.length) return [0, 0, 0, 0, 0, 0, 0];
    const trend: number[] = [];
    const now = dayjs();
    for (let i = 6; i >= 0; i--) {
      const dayBoundary = now.subtract(i, 'day').endOf('day');
      const leadsUpToDay = leads.filter(l => {
        const dt = dayjs(l.created_at || l.posted_on);
        return dt.isBefore(dayBoundary) || dt.isSame(dayBoundary);
      });
      if (leadsUpToDay.length === 0) {
        trend.push(0);
      } else {
        const proposalsUpToDay = leadsUpToDay.filter(l => !!l.proposal_id).length;
        trend.push(Math.round((proposalsUpToDay / leadsUpToDay.length) * 100));
      }
    }
    if (trend[trend.length - 1] === 0 && pipelineRate > 0) {
      trend[trend.length - 1] = pipelineRate;
    }
    return trend;
  }, [leads, pipelineRate]);

  const hotLeadsTrend = useMemo(() => {
    if (!leads.length) return [0, 0, 0, 0, 0, 0, 0];
    const trend: number[] = [];
    const now = dayjs();
    for (let i = 6; i >= 0; i--) {
      const dayBoundary = now.subtract(i, 'day').endOf('day');
      const leadsUpToDay = leads.filter(l => {
        const dt = dayjs(l.created_at || l.posted_on);
        return dt.isBefore(dayBoundary) || dt.isSame(dayBoundary);
      });
      const hotLeadsUpToDay = leadsUpToDay.filter(l => (l.ai_score || 0) >= 80).length;
      trend.push(hotLeadsUpToDay);
    }
    if (trend[trend.length - 1] === 0 && hotLeadsCount > 0) {
      trend[trend.length - 1] = hotLeadsCount;
    }
    return trend;
  }, [leads, hotLeadsCount]);

  const totalLeadsTrend = useMemo(() => {
    if (!leads.length) return [0, 0, 0, 0, 0, 0, 0];
    const trend: number[] = [];
    const now = dayjs();
    for (let i = 6; i >= 0; i--) {
      const dayBoundary = now.subtract(i, 'day').endOf('day');
      const leadsUpToDay = leads.filter(l => {
        const dt = dayjs(l.created_at || l.posted_on);
        return dt.isBefore(dayBoundary) || dt.isSame(dayBoundary);
      });
      trend.push(leadsUpToDay.length);
    }
    if (trend[trend.length - 1] === 0 && leads.length > 0) {
      trend[trend.length - 1] = leads.length;
    }
    return trend;
  }, [leads]);

  const newLeadsTrend = useMemo(() => {
    if (!leads.length) return [0, 0, 0, 0, 0, 0, 0];
    const trend: number[] = [];
    const now = dayjs();
    for (let i = 6; i >= 0; i--) {
      const startOfDay = now.subtract(i, 'day').startOf('day');
      const endOfDay = now.subtract(i, 'day').endOf('day');
      const newLeadsThatDay = leads.filter(l => {
        const dt = dayjs(l.created_at || l.posted_on);
        return (dt.isAfter(startOfDay) || dt.isSame(startOfDay)) && (dt.isBefore(endOfDay) || dt.isSame(endOfDay));
      }).length;
      trend.push(newLeadsThatDay);
    }
    return trend;
  }, [leads]);

  const totalClients = useMemo(() => {
    return new Set(leads.map(l => l.client_name)).size;
  }, [leads]);

  interface LmStatCardProps {
    label: string;
    value: React.ReactNode;
    icon: React.ComponentType<any>;
    accent: string;
    trend?: { value: number; label: string; positive?: boolean };
    subtle?: string;
    loading?: boolean;
    chart?: React.ReactNode;
  }

  const StatCard: React.FC<LmStatCardProps> = ({
    label,
    value,
    icon: Icon,
    accent,
    trend,
    subtle,
    loading,
    chart,
  }) => (
    <div className="lm-stat-card" style={{ ["--lm-accent" as any]: accent }}>
      <div className="lm-stat-head">
        <div
          className="lm-stat-icon"
          style={{
            background: `${accent}12`,
            color: accent,
            boxShadow: `inset 0 0 0 1px ${accent}26`,
          }}
        >
          <Icon size={16} color={accent} />
        </div>
        <Text className="lm-stat-label">{label}</Text>
        <div className="lm-stat-value-wrap">
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 64, height: 22 }} />
          ) : (
            <span className="lm-stat-value">{value}</span>
          )}
          {trend && (
            <span className={`lm-trend ${trend.positive ? "up" : "down"}`}>
              {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span className="lm-trend-value">
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            </span>
          )}
        </div>
      </div>
      {subtle && <Text className="lm-stat-subtle">{subtle}</Text>}
      {chart && <div className="lm-stat-chart">{chart}</div>}
    </div>
  );

  interface LmMiniBarProps {
    segments: { value: number; color: string; label: string }[];
  }
  const MiniBar: React.FC<LmMiniBarProps> = ({ segments }) => {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    return (
      <div className="lm-minibar">
        <div className="lm-minibar-track">
          {segments.map((s, i) => (
            <Tooltip key={i} title={`${s.label}: ${s.value}`}>
              <span
                className="lm-minibar-seg"
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              />
            </Tooltip>
          ))}
        </div>
        <div className="lm-minibar-legend">
          {segments.map((s, i) => (
            <span key={i} className="lm-minibar-legend-item">
              <span className="lm-minibar-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="lm-page">
          <div className="lm-ambient" />

          <div className="lm-shell">
            <aside className="lm-sidebar">
              <div className="lm-sidebar-top">
                <div className="lm-side-head">
                  <div className="lm-side-logo"><Layers size={20} /></div>
                  <div className="lm-side-head-text">
                    <div className="lm-side-title">Leads</div>
                    <div className="lm-side-subtitle">Management · Pipeline</div>
                  </div>
                </div>

                {canCreateLead && (
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    className="lm-create-btn"
                    onClick={() => {
                      setEditingKey(null);
                      form.resetFields();
                      form.setFieldsValue({ platform: 'Upwork', customPlatform: '', leadSourceKind: 'platform' });
                      const defaultStatus = configStatuses.find(s => s.is_default);
                      if (defaultStatus) {
                        form.setFieldsValue({ status: defaultStatus.name });
                      }
                      setIsDrawerVisible(true);
                    }}
                    block
                  >
                    New Lead
                  </Button>
                )}
              </div>

              <div className="lm-side-scroll">
                <div className="lm-side-section-label">Views</div>
                <div className="lm-side-list">
                  {[
                    { key: 'all', label: 'All Leads', icon: <Layers size={14} />, count: leads.length, color: '#3b82f6' },
                    { key: 'hot', label: 'Hot Leads', icon: <Flame size={14} />, count: hotLeadsCount, color: '#ef4444' },
                    { key: 'today', label: 'Added Today', icon: <Zap size={14} />, count: leadsToday, color: '#f59e0b' },
                    { key: 'with_proposal', label: 'With Proposal', icon: <FileText size={14} />, count: leads.filter(l => !!l.proposal_id).length, color: '#10b981' },
                  ].map((v) => {
                    const active = activeSegment === v.key || (!activeSegment && v.key === 'all') || (activeSegment === 'all' && v.key === 'all');
                    const isActive = v.key === 'all'
                      ? (!filterPlatform && !filterStatus && activeSegment === 'all')
                      : v.key === 'hot'
                        ? activeSegment === 'hot'
                        : v.key === 'today'
                          ? activeSegment === 'today'
                          : v.key === 'with_proposal'
                            ? activeSegment === 'with_proposal'
                            : false;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        className={`lm-view-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => {
                          setFilterPlatform(null);
                          setFilterStatus(null);
                          if (v.key === 'all') {
                            setActiveSegment('all');
                          } else if (v.key === 'hot') {
                            setActiveSegment('hot');
                          } else if (v.key === 'today') {
                            setActiveSegment('today');
                          } else if (v.key === 'with_proposal') {
                            setActiveSegment('with_proposal');
                          }
                        }}
                      >
                        <span className="lm-view-icon" style={{ color: isActive ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                        <span className="lm-view-label">{v.label}</span>
                        <span className="lm-view-count">{v.count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="lm-side-section-label">Sources</div>
                <div className="lm-side-list">
                  {sourceOptions.map(opt => {
                    const isActive = filterPlatform === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        className={`lm-view-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => { setFilterPlatform(prev => (prev === opt.name ? null : opt.name)); setActiveSegment('all'); }}
                      >
                        <span className="lm-view-icon" style={{ color: isActive ? 'var(--text-slate-600)' : 'var(--text-slate-400)' }}>{opt.icon}</span>
                        <span className="lm-view-label">{opt.name}</span>
                        <span className="lm-view-count">{opt.count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="lm-side-section-label">Pipeline</div>
                <div className="lm-side-list">
                  {pipelineOptions.map(opt => {
                    const isActive = filterStatus === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        className={`lm-view-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => { setFilterStatus(prev => (prev === opt.name ? null : opt.name)); setActiveSegment('all'); }}
                      >
                        <span className="lm-view-icon" style={{ color: isActive ? 'var(--text-slate-600)' : 'var(--text-slate-400)' }}>{opt.icon}</span>
                        <span className="lm-view-label">{opt.name}</span>
                        <span className="lm-view-count">{opt.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="lm-main">
              <div className="lm-topbar">
                <Input
                  placeholder="Search subject, target…"
                  prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
                  suffix={<span className="lm-kbd">⌘K</span>}
                  className="lm-search-input"
                  style={{ width: 600, borderRadius: 8, height: 34 }}
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  allowClear
                />
                <div className="lm-topbar-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Popover
                    trigger={["click"]}
                    placement="bottomRight"
                    classNames={{ root: "lm-toolbar-popover" }}
                    content={
                      <div className="lm-filters-popover-body">
                        <div className="lm-popover-section-label">
                          <Filter size={11} />
                          <span>Workflow</span>
                        </div>
                        <Select
                          placeholder="Any workflow"
                          className="lm-filter-select"
                          style={{ width: "100%" }}
                          allowClear
                          value={filterAction}
                          onChange={setFilterAction}
                        >
                          {configActions.map(a => (
                            <Select.Option key={a.id} value={a.name}>
                              <Space size={6}>
                                {renderActionIcon(a.icon)}
                                {a.name}
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>

                        <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                          <User size={11} />
                          <span>Created by</span>
                        </div>
                        <Select
                          placeholder="Anyone"
                          className="lm-filter-select"
                          style={{ width: "100%" }}
                          allowClear
                          value={filterCreatedBy}
                          onChange={setFilterCreatedBy}
                          showSearch
                          filterOption={(input, option) =>
                            String((option as any)?.value || "").toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {creatorOptions.map((name) => {
                            const palette = getAvatarStyle(name);
                            return (
                              <Select.Option key={name} value={name}>
                                <Space size={8}>
                                  <span
                                    className="lm-creator-avatar"
                                    style={{ background: palette.bg, width: 20, height: 20, fontSize: 9 }}
                                  >
                                    {getInitials(name)}
                                  </span>
                                  <span style={{ fontSize: 12.5 }}>{name}</span>
                                </Space>
                              </Select.Option>
                            );
                          })}
                        </Select>

                        <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                          <Mail size={11} />
                          <span>Mail status</span>
                        </div>
                        <Select
                          placeholder="Any"
                          className="lm-filter-select"
                          style={{ width: "100%" }}
                          allowClear
                          value={filterMailStatus}
                          onChange={setFilterMailStatus}
                        >
                          <Select.Option value="sent">
                            <Space size={6}><CheckCircle size={14} style={{ color: '#10b981' }} /> Sent</Space>
                          </Select.Option>
                          <Select.Option value="not_sent">
                            <Space size={6}><Mail size={14} style={{ color: '#94a3b8' }} /> Not Sent</Space>
                          </Select.Option>
                        </Select>

                        <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                          <Clock size={11} />
                          <span>Posted on</span>
                        </div>
                        <DatePicker.RangePicker
                          className="lm-filter-date"
                          style={{ width: "100%" }}
                          value={filterDateRange}
                          onChange={(dates) => setFilterDateRange(dates as any)}
                        />

                        <div className="lm-popover-footer">
                          <button
                            type="button"
                            className="lm-popover-reset"
                            onClick={() => {
                              setFilterStatus(null);
                              setFilterPlatform(null);
                              setFilterAction(null);
                              setFilterDateRange(null);
                              setFilterCreatedBy(null);
                              setFilterMailStatus(null);
                            }}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <Button
                      icon={<Filter size={13} />}
                      className="lm-filter-settings-btn lm-toolbar-filters-btn"
                    >
                      Filters
                      {(() => {
                        const n =
                          (filterAction ? 1 : 0) +
                          (filterCreatedBy ? 1 : 0) +
                          (filterMailStatus ? 1 : 0) +
                          (filterDateRange ? 1 : 0);
                        return n > 0 ? <span className="lm-toolbar-pill">{n}</span> : null;
                      })()}
                    </Button>
                  </Popover>

                  <Button
                    className="lm-filter-settings-btn lm-toolbar-filters-btn"
                    onClick={() => {
                      const headers = ["Lead", "Company", "Stage", "Source", "Value", "Owner", "Priority", "Last Activity", "Created"];
                      const rows = filteredLeads.map(l => {
                        const score = l.ai_score;
                        const priority = score == null ? "" : score >= 80 ? "High" : score >= 60 ? "Medium" : "Low";
                        return [
                          l.title || "",
                          l.client_name || "",
                          l.status || "",
                          l.platform || "",
                          l.budget || (l.hour_based_amount ? `${l.hour_based_amount}/hr` : ""),
                          getLeadCreator(l) || "",
                          priority,
                          l.last_mail_at || l.updated_at || l.created_at || "",
                          l.created_at || "",
                        ];
                      });
                      const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
                      const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `leads-${dayjs().format("YYYY-MM-DD")}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={13} />
                    Export
                  </Button>

                  <div className="lm-segmented">
                    <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                    <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                  </div>
                </div>
              </div>

              {/* Saved-View Segments */}
              {/* <div className="lead-segments" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {([
              { key: "all", label: "All Leads", icon: <Layers size={13} />, count: segmentCounts.all },
              { key: "hot", label: "Hot", icon: <Flame size={13} />, count: segmentCounts.hot, accent: "#ef4444" },
              { key: "week", label: "This Week", icon: <Activity size={13} />, count: segmentCounts.week, accent: "#f59e0b" },
              { key: "won", label: "Won / Closed", icon: <CheckCircle size={13} />, count: segmentCounts.won, accent: "#10b981" },
            ] as const).map(seg => {
              const isActive = activeSegment === seg.key;
              const accent = (seg as any).accent || "#6366f1";
              return (
                <button
                  key={seg.key}
                  onClick={() => setActiveSegment(seg.key)}
                  className={`lead-segment-btn${isActive ? " is-active" : ""}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    height: 32,
                    borderRadius: 999,
                    border: `1px solid ${isActive ? accent : "#e2e8f0"}`,
                    background: isActive ? `${accent}10` : "#fff",
                    color: isActive ? accent : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {seg.icon}
                  {seg.label}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 20,
                      height: 18,
                      padding: "0 6px",
                      borderRadius: 999,
                      background: isActive ? accent : "#f1f5f9",
                      color: isActive ? "#fff" : "#64748b",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {seg.count}
                  </span>
                </button>
              );
            })}
          </div> */}

              <div className="lm-stat-grid">
                <StatCard
                  label="Total Leads"
                  value={leads.length}
                  icon={Layers}
                  accent="#6366f1"
                  subtle={leads.length > 0 ? `${leadsThisWeek} added in the last 7 days` : "No leads yet"}
                  loading={leads.length === 0 && loading}
                  chart={
                    leads.length > 0 ? (
                      <div className="lm-stat-spark-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
                        <span className="lm-progress-label" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-slate-400)' }}>7-day trend</span>
                        <AreaSparkline values={totalLeadsTrend} color="#6366f1" />
                      </div>
                    ) : null
                  }
                />
                <StatCard
                  label="New Today"
                  value={leadsToday}
                  icon={Zap}
                  accent="#f59e0b"
                  subtle={leadsToday > 0 ? "Fresh activity in the last 24h" : "No new leads today"}
                  loading={leads.length === 0 && loading}
                  chart={
                    leads.length > 0 ? (
                      <div className="lm-stat-spark-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
                        <span className="lm-progress-label" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-slate-400)' }}>7-day trend</span>
                        <AreaSparkline values={newLeadsTrend} color="#f59e0b" />
                      </div>
                    ) : null
                  }
                />
                <StatCard
                  label="Hot Leads"
                  value={hotLeadsCount}
                  icon={Flame}
                  accent="#ef4444"
                  subtle={
                    leads.length > 0
                      ? `${Math.round((hotLeadsCount / leads.length) * 100)}% of pipeline · ${totalClients} clients`
                      : "AI score ≥ 80"
                  }
                  loading={leads.length === 0 && loading}
                  chart={
                    leads.length > 0 ? (
                      <div className="lm-stat-spark-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
                        <span className="lm-progress-label" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-slate-400)' }}>7-day trend</span>
                        <AreaSparkline values={hotLeadsTrend} color="#ef4444" />
                      </div>
                    ) : null
                  }
                />
                <StatCard
                  label="Pipeline Rate"
                  value={`${pipelineRate}%`}
                  icon={Target}
                  accent="#10b981"
                  subtle={leads.length > 0 ? "Leads with proposals out" : "Send your first proposal"}
                  loading={leads.length === 0 && loading}
                  chart={
                    leads.length > 0 ? (
                      <div className="lm-stat-spark-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
                        <span className="lm-progress-label" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-slate-400)' }}>7-day trend</span>
                        <AreaSparkline values={pipelineRateTrend} color="#10b981" />
                      </div>
                    ) : null
                  }
                />
              </div>



              {/* Compact toolbar — Sort + Filters + Export + Settings */}
              <div className="lm-table-toolbar">
                <span className="lm-toolbar-count">
                  <b>{filteredLeads.length}</b> of <b>{leads.length}</b> leads
                </span>

                <span className="lm-toolbar-spacer" />

                <SearchableDropdown
                  placeholder="Stage"
                  options={stageDropdownOptions}
                  value={filterStatus || undefined}
                  onChange={(v) => {
                    setFilterStatus(v || null);
                    setFilterPlatform(null);
                  }}
                  style={{ height: 32, minWidth: 120, width: 120, borderRadius: 4 }}
                  width={200}
                />

                <SearchableDropdown
                  placeholder="Action"
                  options={actionDropdownOptions}
                  value={filterAction || undefined}
                  onChange={(v) => setFilterAction(v || null)}
                  style={{ height: 32, minWidth: 140, width: 140, borderRadius: 4 }}
                  width={220}
                />

                <SearchableDropdown
                  placeholder="Created by"
                  options={creatorDropdownOptions}
                  value={filterCreatedBy || undefined}
                  onChange={(v) => setFilterCreatedBy(v || null)}
                  style={{ height: 32, minWidth: 130, width: 130, borderRadius: 4 }}
                  width={220}
                />

                <SearchableDropdown
                  placeholder="Sort"
                  options={sortDropdownOptions}
                  value={sortKey}
                  onChange={(v) => {
                    if (v) setSortKey(v as any);
                  }}
                  style={{ height: 32, minWidth: 150, width: 150, borderRadius: 8 }}
                  width={200}
                  allowClear={false}
                />

                <Popover
                  trigger={["click"]}
                  placement="bottomRight"
                  classNames={{ root: "lm-toolbar-popover" }}
                  content={
                    <div className="lm-filters-popover-body">
                      <div className="lm-popover-section-label">
                        <Filter size={11} />
                        <span>Workflow</span>
                      </div>
                      <SearchableDropdown
                        placeholder="Any workflow"
                        options={actionDropdownOptions}
                        value={filterAction || undefined}
                        onChange={(v) => setFilterAction(v || null)}
                        style={{ width: "100%", borderRadius: 8, height: 36 }}
                        width={220}
                      />

                      <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                        <User size={11} />
                        <span>Created by</span>
                      </div>
                      <SearchableDropdown
                        placeholder="Anyone"
                        options={creatorDropdownOptions}
                        value={filterCreatedBy || undefined}
                        onChange={(v) => setFilterCreatedBy(v || null)}
                        style={{ width: "100%", borderRadius: 8, height: 36 }}
                        width={220}
                      />

                      <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                        <Mail size={11} />
                        <span>Mail status</span>
                      </div>
                      <SearchableDropdown
                        placeholder="Any mail status"
                        options={mailDropdownOptions}
                        value={filterMailStatus || undefined}
                        onChange={(v) => setFilterMailStatus(v || null)}
                        style={{ width: "100%", borderRadius: 8, height: 36 }}
                        width={220}
                      />

                      <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                        <Clock size={11} />
                        <span>Posted on</span>
                      </div>
                      <DatePicker.RangePicker
                        className="lm-filter-date"
                        style={{ width: "100%" }}
                        value={filterDateRange}
                        onChange={(dates) => setFilterDateRange(dates as any)}
                      />

                      <div className="lm-popover-footer">
                        <button
                          type="button"
                          className="lm-popover-reset"
                          onClick={() => {
                            setFilterStatus(null);
                            setFilterPlatform(null);
                            setFilterAction(null);
                            setFilterDateRange(null);
                            setFilterCreatedBy(null);
                            setFilterMailStatus(null);
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  }
                >
                  <Button
                    icon={<Filter size={13} />}
                    className="lm-filter-settings-btn lm-toolbar-filters-btn"
                  >
                    Filters
                    {(() => {
                      const n =
                        (filterAction ? 1 : 0) +
                        (filterCreatedBy ? 1 : 0) +
                        (filterMailStatus ? 1 : 0) +
                        (filterDateRange ? 1 : 0);
                      return n > 0 ? <span className="lm-toolbar-pill">{n}</span> : null;
                    })()}
                  </Button>
                </Popover>

                <Button
                  className="lm-filter-settings-btn lm-toolbar-filters-btn lm-toolbar-export-btn"
                  onClick={() => {
                    const headers = ["Lead", "Company", "Stage", "Source", "Value", "Owner", "Priority", "Last Activity", "Created"];
                    const rows = filteredLeads.map(l => {
                      const score = l.ai_score;
                      const priority = score == null ? "" : score >= 80 ? "High" : score >= 60 ? "Medium" : "Low";
                      return [
                        l.title || "",
                        l.client_name || "",
                        l.status || "",
                        l.platform || "",
                        l.budget || (l.hour_based_amount ? `${l.hour_based_amount}/hr` : ""),
                        getLeadCreator(l) || "",
                        priority,
                        l.last_mail_at || l.updated_at || l.created_at || "",
                        l.created_at || "",
                      ];
                    });
                    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
                    const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `leads-${dayjs().format("YYYY-MM-DD")}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={13} />
                  Export
                </Button>

                <Popover
                  trigger={["click"]}
                  placement="bottomRight"
                  classNames={{ root: "lm-table-settings-popover" }}
                  content={
                    <div style={{ width: 240 }}>
                      <div className="lm-popover-section-label">
                        <Settings size={11} />
                        <span>Density</span>
                      </div>
                      <Segmented
                        block
                        value={tableDensity}
                        onChange={(v) => setTableDensity(v as LmDensity)}
                        options={[
                          { label: "Compact", value: "compact" },
                          { label: "Cozy", value: "comfortable" },
                          { label: "Roomy", value: "spacious" },
                        ]}
                      />
                      <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                        <Layers size={11} />
                        <span>Columns</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                          {TOGGLEABLE_COLUMNS.length - TOGGLEABLE_COLUMNS.filter(c => hiddenCols[c.key]).length} of {TOGGLEABLE_COLUMNS.length}
                        </span>
                      </div>
                      <div className="lm-col-toggle-list">
                        {TOGGLEABLE_COLUMNS.map((c) => (
                          <label key={c.key} className="lm-col-toggle-row">
                            <span>{c.label}</span>
                            <Switch
                              size="small"
                              checked={!hiddenCols[c.key]}
                              onChange={(checked) =>
                                setHiddenCols((prev) => ({ ...prev, [c.key]: !checked }))
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <div className="lm-popover-footer">
                        <button
                          type="button"
                          className="lm-popover-reset"
                          onClick={() => {
                            setHiddenCols(DEFAULT_HIDDEN_COLS);
                            setTableDensity("comfortable");
                          }}
                        >
                          Reset to defaults
                        </button>
                        <span className="lm-popover-saved">Saved automatically</span>
                      </div>
                    </div>
                  }
                >
                  <Tooltip title="Table settings">
                    <Button
                      icon={<Settings size={14} />}
                      className="lm-filter-settings-btn"
                      aria-label="Table settings"
                    />
                  </Tooltip>
                </Popover>
              </div>

              {/* Active filter chips */}
              {activeFilterChips.length > 0 && (
                <div className="lead-filter-chips" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <ListFilter size={12} /> Active
                  </span>
                  {activeFilterChips.map(chip => (
                    <span
                      key={chip.key}
                      className="lead-filter-chip"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 6px 4px 10px",
                        borderRadius: 999,
                        background: "rgba(99, 102, 241, 0.08)",
                        color: "#4f46e5",
                        border: "1px solid rgba(99, 102, 241, 0.18)",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {chip.label}
                      <button
                        onClick={chip.onClear}
                        aria-label={`Clear ${chip.key}`}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "rgba(99, 102, 241, 0.15)",
                          border: "none",
                          color: "#4f46e5",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {selectedRowKeys.length > 0 && (
                <div className="lm-bulk-bar">
                  <div className="lm-bulk-bar-left">
                    <span className="lm-bulk-count">
                      <span className="lm-bulk-count-dot" />
                      {selectedRowKeys.length} selected
                    </span>
                    <span className="lm-bulk-divider" />
                    <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                      Apply a bulk action or clear the selection.
                    </Text>
                  </div>
                  <div className="lm-bulk-bar-right">
                    <Button
                      size="small"
                      className="lm-bulk-btn"
                      onClick={() => setSelectedRowKeys([])}
                    >
                      Clear
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<Trash2 size={13} />}
                      className="lm-bulk-btn lm-bulk-btn-danger"
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              <div className="lm-body">
                {view === 'list' ? (
                <div className="lm-table-card" data-density={tableDensity}>
                  {loading && leads.length === 0 ? (
                    <div className="leads-skeleton" style={{ padding: "8px 0" }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "16px 20px",
                            borderBottom: "1px solid var(--border-slate-100)",
                          }}
                        >
                          <div className="sk-shimmer" style={{ width: 18, height: 18, borderRadius: 4 }} />
                          <div className="sk-shimmer" style={{ width: 38, height: 38, borderRadius: 12 }} />
                          <div style={{ flex: 1 }}>
                            <div className="sk-shimmer" style={{ width: "55%", height: 12, borderRadius: 6, marginBottom: 8 }} />
                            <div className="sk-shimmer" style={{ width: "35%", height: 10, borderRadius: 6 }} />
                          </div>
                          <div className="sk-shimmer" style={{ width: 80, height: 22, borderRadius: 999 }} />
                          <div className="sk-shimmer" style={{ width: 90, height: 22, borderRadius: 999 }} />
                          <div className="sk-shimmer" style={{ width: 60, height: 22, borderRadius: 999 }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table
                      columns={columns.filter((c: any) => !hiddenCols[c.key as string])}
                      dataSource={filteredLeads.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)}
                      rowKey="id"
                      size="middle"
                      scroll={{ x: "max-content" }}
                      rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        columnWidth: 48,
                      }}
                      pagination={false}
                      className="lm-table premium-table"
                      rowClassName={() => "lm-row"}
                      onRow={(record) => ({
                        onClick: () => handleView(record),
                        style: { cursor: 'pointer' }
                      })}
                      locale={{
                        emptyText: (
                          <div style={{ padding: "60px 24px", textAlign: "center" }}>
                            <div
                              style={{
                                width: 64,
                                height: 64,
                                margin: "0 auto 16px",
                                borderRadius: 18,
                                background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#6366f1",
                              }}
                            >
                              <Layers size={28} />
                            </div>
                            <Title level={5} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
                              {leads.length === 0 ? "No leads yet" : "No matching leads"}
                            </Title>
                            <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginTop: 4, marginBottom: 16 }}>
                              {leads.length === 0
                                ? "Add your first opportunity to start tracking your pipeline."
                                : "Try clearing filters or switching to a different view."}
                            </Text>
                            {leads.length === 0 ? (
                              <Button
                                type="primary"
                                icon={<Plus size={14} />}
                                onClick={() => {
                                  setEditingKey(null);
                                  form.resetFields();
                                  form.setFieldsValue({ platform: 'Upwork', customPlatform: '', leadSourceKind: 'platform' });
                                  const defaultStatus = configStatuses.find(s => s.is_default);
                                  if (defaultStatus) form.setFieldsValue({ status: defaultStatus.name });
                                  setIsDrawerVisible(true);
                                }}
                                style={{
                                  borderRadius: 8,
                                  height: 36,
                                  fontWeight: 700,
                                  background: "#6366f1",
                                  border: "none",
                                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                                }}
                              >
                                Add First Lead
                              </Button>
                            ) : (
                              <Button
                                icon={<RefreshCw size={14} />}
                                onClick={() => {
                                  setFilterStatus(null);
                                  setFilterAction(null);
                                  setFilterPlatform(null);
                                  setFilterDateRange(null);
                                  setFilterCreatedBy(null);
                                  setFilterMailStatus(null);
                                  setSearchText("");
                                  setActiveSegment("all");
                                }}
                                style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
                              >
                                Clear all filters
                              </Button>
                            )}
                          </div>
                        ),
                      }}
                    />
                  )}

                </div>
              ) : (
                <div className="lm-grid-view">
                  {loading && leads.length === 0 ? (
                    <div className="lm-grid">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="lm-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div className="sk-shimmer" style={{ width: 36, height: 36, borderRadius: 10 }} />
                            <div style={{ flex: 1 }}>
                              <div className="sk-shimmer" style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 8 }} />
                              <div className="sk-shimmer" style={{ width: '40%', height: 12, borderRadius: 4 }} />
                            </div>
                          </div>
                          <div className="sk-shimmer" style={{ width: '100%', height: 12, borderRadius: 4, marginTop: 'auto' }} />
                        </div>
                      ))}
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="lm-grid-empty" style={{ padding: "60px 24px", textAlign: "center", background: "var(--bg-pure-white)", borderRadius: 16, border: "1px solid var(--border-slate-200)" }}>
                      <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: 18, background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                        <Layers size={28} />
                      </div>
                      <Typography.Title level={5} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
                        {leads.length === 0 ? "No leads yet" : "No matching leads"}
                      </Typography.Title>
                      <Typography.Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginTop: 4, marginBottom: 16 }}>
                        {leads.length === 0 ? "Add your first opportunity to start tracking your pipeline." : "Try clearing filters or switching to a different view."}
                      </Typography.Text>
                      {leads.length === 0 && (
                        <Button type="primary" icon={<Plus size={14} />} onClick={() => setIsDrawerVisible(true)} style={{ borderRadius: 8, height: 36, fontWeight: 700, background: "#6366f1", border: "none" }}>Add First Lead</Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="lm-grid">
                        {filteredLeads.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize).map(record => {
                          const r = record as any;
                          const name = record.title || record.client_name || r.first_name || 'Unnamed Lead';
                          const initials = getInitials(name);
                          const palette = getAvatarStyle(name);
                          const statusCfg = configStatuses.find(s => s.name === record.status);
                          const statusColor = statusCfg?.color || '#6366f1';
                          const scoreLevel = getAIScoreLevel(record.ai_score);
                          const ownerName = getLeadCreator(record) || 'Unknown';
                          const ownerPalette = getAvatarStyle(ownerName);
                          const isSent = !!record.last_mail_at || !!record.is_mail_sent;

                          const formatDate = (date: any) => {
                            if (!date) return '—';
                            const d = dayjs(date);
                            if (!d.isValid()) return '—';
                            return d.format('MMM D, YYYY · h:mm A');
                          };

                          const ownerInitials = ownerName.trim().split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase() || '—';

                          return (
                            <div key={record.id} className="lm-card" style={{ padding: 0, gap: 0 }} onClick={() => handleView(record)}>
                              {/* LAYER 1: Header (Lead, Company, Owner, Actions) */}
                              <div className="lm-card-head" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-slate-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="lm-card-avatar" style={{ background: palette.bg, color: palette.color, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initials}</div>
                                <div className="lm-card-title-group" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                                  <h4 className="lm-card-title" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={name}>{name}</h4>
                                  <span className="lm-card-subtitle" style={{ fontSize: '12px', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span>Client: <span style={{ fontWeight: 700, color: 'var(--text-slate-800)' }}>{record.client_name || '—'}</span></span>
                                    <span style={{ color: 'var(--border-slate-300)' }}>|</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{
                                        width: 16, height: 16, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, background: ownerPalette.bg, color: ownerPalette.color
                                      }}>
                                        {ownerInitials}
                                      </span>
                                      <span style={{ fontWeight: 600, color: 'var(--text-slate-700)' }}>{ownerName}</span>
                                    </span>
                                  </span>
                                </div>
                                <div className="lm-card-actions" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                                  {getLeadActionMenu(record)}
                                </div>
                              </div>

                              {/* LAYER 2: Details & Actions */}
                              <div className="lm-card-footer" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--border-slate-100)', marginTop: 0, backgroundColor: 'var(--bg-slate-50)' }}>
                                {/* Source */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: 'var(--text-slate-400)', fontWeight: 500, fontSize: '12px' }}>Source:</span>
                                  <span style={{ fontWeight: 600, color: 'var(--text-slate-900)', fontSize: '12px' }}>{record.platform || 'Upwork'}</span>
                                </div>

                                <span style={{ color: 'var(--border-slate-300)' }}>|</span>

                                {/* Value */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: 'var(--text-slate-400)', fontWeight: 500, fontSize: '12px' }}>Value:</span>
                                  <span style={{ fontWeight: 600, color: 'var(--text-slate-900)', fontSize: '12px' }}>
                                    {record.budget ? `$${record.budget}` : (record.hour_based_amount ? `$${record.hour_based_amount}/hr` : '—')}
                                  </span>
                                </div>

                                <span style={{ color: 'var(--border-slate-300)' }}>|</span>

                                {/* Status */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: 'var(--text-slate-400)', fontWeight: 500, fontSize: '12px' }}>Status:</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'var(--bg-slate-100)', color: 'var(--text-slate-700)', border: '1px solid var(--border-slate-200)' }}>
                                    <Clock size={11} style={{ color: 'var(--text-slate-400)' }} />
                                    {record.status || '—'}
                                  </span>
                                </div>

                                {/* BidIq Action */}
                                {canManageLeads && record.lead_source_kind !== "website" && (() => {
                                  const hasBidiq = (record.ai_score && record.ai_score > 0) || !!record.skill_analysis || !!record.ai_summary;
                                  return (
                                    <>
                                      <span style={{ color: 'var(--border-slate-300)' }}>|</span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); if (hasBidiq) { router.push(`/leads/bidiq/${record.id}`); } else { openBidiqPreview(record); } }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 700, color: hasBidiq ? '#10b981' : 'var(--premium-blue)' }}
                                      >
                                        {hasBidiq ? <Eye size={13} /> : <Zap size={13} />}
                                        {hasBidiq ? 'View BidIq' : 'BidIq'}
                                      </button>
                                    </>
                                  );
                                })()}

                                {/* Proposal Action */}
                                {canCreateProposal && (
                                  <>
                                    <span style={{ color: 'var(--border-slate-300)' }}>|</span>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); record.proposal_id ? router.push(`/proposals/builder?id=${record.proposal_id}`) : openProposalFlow(record); }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 700, color: record.proposal_id ? '#10b981' : 'var(--premium-blue)' }}
                                    >
                                      {record.proposal_id ? <FileText size={13} /> : <Sparkles size={13} />}
                                      {record.proposal_id ? 'View Proposal' : 'Generate'}
                                    </button>
                                  </>
                                )}

                                {/* Mail Action */}
                                <span style={{ color: 'var(--border-slate-300)' }}>|</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedLeadForMail(record); setIsMailDrawerVisible(true); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 700, color: isSent ? '#10b981' : 'var(--premium-blue)' }}
                                >
                                  {isSent ? <CheckCircle size={13} style={{ color: '#10b981' }} /> : <Mail size={13} />}
                                  {isSent ? 'Sent' : 'Send Mail'}
                                </button>

                                {/* Timeline View Action */}
                                <span style={{ color: 'var(--border-slate-300)' }}>|</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openTimeline(record); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 700, color: 'var(--text-slate-500)' }}
                                >
                                  <History size={13} />
                                  Timeline
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
              </div>
              {filteredLeads.length > 0 && (
                <div className="lm-bottom-bar lm-bottom-bar--sticky">
                  <div className="lm-bottom-info">
                    Showing <strong>{(tablePage - 1) * tablePageSize + 1}–{Math.min(tablePage * tablePageSize, filteredLeads.length)}</strong> of <strong>{filteredLeads.length}</strong>
                    {selectedRowKeys.length > 0 && <span className="lm-bottom-sel"> · {selectedRowKeys.length} selected</span>}
                  </div>
                  <div className="lm-pager">
                    <button type="button" className="lm-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                    {Array.from({ length: Math.ceil(filteredLeads.length / tablePageSize) }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                      <button key={p} type="button" className={`lm-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                    ))}
                    <button type="button" className="lm-pager-btn" disabled={tablePage >= Math.ceil(filteredLeads.length / tablePageSize)} onClick={() => setTablePage((p) => Math.min(Math.ceil(filteredLeads.length / tablePageSize), p + 1))}>›</button>
                    <Select
                      className="lm-pagesize"
                      value={tablePageSize}
                      onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                      options={[15, 30, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                      popupMatchSelectWidth={120}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BidIq Preview Modal */}
        <Modal
          open={!!bidiqPreviewLead}
          onCancel={closeBidiqPreview}
          footer={null}
          width={680}
          centered
          closable={false}
          className="lm-bidiq-modal"
        >
          {bidiqPreviewLead && (
            <div className="lm-bidiq-content">
              {/* Header */}
              <div className="lm-bidiq-head">
                <div className="lm-bidiq-icon">
                  <Zap size={20} />
                </div>
                <div className="lm-bidiq-head-text">
                  <div className="lm-bidiq-eyebrow">
                    <Sparkles size={11} /> AI Win-Rate Engine
                  </div>
                  <h2 className="lm-bidiq-title">BidIq · Pre-flight check</h2>
                  <p className="lm-bidiq-sub">
                    Before you spend time crafting a proposal, BidIq runs a smart
                    analysis on this lead and shows you whether it's worth the bid.
                  </p>
                </div>
                <button
                  type="button"
                  className="lm-bidiq-close"
                  onClick={closeBidiqPreview}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lead snapshot */}
              <div className="lm-bidiq-snapshot">
                <div className="lm-bidiq-snapshot-head">
                  <Layers size={11} /> Lead snapshot
                </div>
                <div className="lm-bidiq-snapshot-title" title={bidiqPreviewLead.title}>
                  {bidiqPreviewLead.title}
                </div>
                <div className="lm-bidiq-snapshot-grid">
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <DollarSign size={10} /> Budget
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.budget ||
                        (bidiqPreviewLead.hour_based_amount
                          ? `$${bidiqPreviewLead.hour_based_amount}/hr`
                          : "—")}
                    </span>
                  </div>
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <Clock size={10} /> Duration
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.duration || "Flexible"}
                    </span>
                  </div>
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <Layers size={10} /> Platform
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.platform || "—"}
                    </span>
                  </div>
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <ShieldCheck size={10} /> Experience
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.experience_level || "Any"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="lm-bidiq-caps">
                <div className="lm-bidiq-caps-head">What BidIq will do for you</div>
                <div className="lm-bidiq-caps-grid">
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#6366f1" }}>
                    <div className="lm-bidiq-cap-icon">
                      <Target size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Win-probability score</span>
                      <span className="lm-bidiq-cap-text">
                        Predicts your chance of winning based on fit, history, and lead signals.
                      </span>
                    </div>
                  </div>
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#10b981" }}>
                    <div className="lm-bidiq-cap-icon">
                      <DollarSign size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Smart pricing &amp; effort</span>
                      <span className="lm-bidiq-cap-text">
                        Recommended quote and estimated hours, anchored to the brief and budget.
                      </span>
                    </div>
                  </div>
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#ef4444" }}>
                    <div className="lm-bidiq-cap-icon">
                      <AlertCircle size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Risk &amp; red-flag detection</span>
                      <span className="lm-bidiq-cap-text">
                        Aggressive timelines, scope creep, low-trust clients — all surfaced.
                      </span>
                    </div>
                  </div>
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#8b5cf6" }}>
                    <div className="lm-bidiq-cap-icon">
                      <Brain size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Proposal-ready draft</span>
                      <span className="lm-bidiq-cap-text">
                        Tailored proposal with deliverables, milestones, and a tight scope.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="lm-bidiq-footer">
                <span className="lm-bidiq-footnote">
                  <ShieldCheck size={12} /> No data leaves your workspace.
                </span>
                <div className="lm-bidiq-footer-actions">
                  <Button onClick={closeBidiqPreview} className="lm-bidiq-cancel">
                    Maybe later
                  </Button>
                  <Button
                    type="primary"
                    onClick={launchBidiq}
                    className="lm-bidiq-launch"
                    icon={<Zap size={14} />}
                  >
                    Launch BidIq
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* ============== Proposal flow Modal (2 steps in one shell) ============== */}
        <Modal
          open={proposalModalOpen}
          onCancel={closeProposalFlow}
          footer={null}
          width={680}
          centered
          closable={false}
          className="biq-pinfo-modal"
          maskClosable={!generatingProposal}
        >
          {selectedProposalLead && (
            <div className="biq-pinfo-content">
              {/* Header — stays identical across both steps */}
              <div className="biq-pinfo-head">
                <div className="biq-pinfo-icon">
                  <Sparkles size={20} />
                </div>
                <div className="biq-pinfo-head-text">
                  <div className="biq-pinfo-eyebrow">
                    <Brain size={11} /> AI Proposal Builder
                  </div>
                  <h2 className="biq-pinfo-title">Generate proposal</h2>
                  <p className="biq-pinfo-sub">
                    Two quick steps — review what BidIq will produce, then choose how to anchor it.
                  </p>
                  <div className="biq-pinfo-steps">
                    <span className={`biq-pinfo-step ${proposalStep === 0 ? "is-active" : "is-done"}`}>
                      <span className="biq-pinfo-step-dot">1</span>
                      <span>Review</span>
                    </span>
                    <span className="biq-pinfo-step-sep" />
                    <span className={`biq-pinfo-step ${proposalStep === 1 ? "is-active" : ""}`}>
                      <span className="biq-pinfo-step-dot">2</span>
                      <span>Choose terms</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="biq-pinfo-close"
                  onClick={closeProposalFlow}
                  aria-label="Close"
                  disabled={generatingProposal}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body — swaps based on step */}
              {proposalStep === 0 ? (
                <>
                  {/* Lead snapshot */}
                  <div className="biq-pinfo-snapshot">
                    <div className="biq-pinfo-snapshot-head">
                      <Layers size={11} /> Lead snapshot
                    </div>
                    <div className="biq-pinfo-snapshot-title" title={selectedProposalLead.title}>
                      {selectedProposalLead.title}
                    </div>
                    <div className="biq-pinfo-snapshot-grid">
                      <div className="biq-pinfo-snapshot-item">
                        <span className="biq-pinfo-snapshot-label">
                          <DollarSign size={10} /> Client budget
                        </span>
                        <span className="biq-pinfo-snapshot-value">
                          {selectedProposalLead.budget ? `$${clientBudgetNum.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div className="biq-pinfo-snapshot-item">
                        <span className="biq-pinfo-snapshot-label">
                          <Clock size={10} /> Duration
                        </span>
                        <span className="biq-pinfo-snapshot-value">
                          {selectedProposalLead.duration || "Flexible"}
                        </span>
                      </div>
                      <div className="biq-pinfo-snapshot-item">
                        <span className="biq-pinfo-snapshot-label">
                          <Sparkles size={10} /> Suggested bid
                        </span>
                        <span className="biq-pinfo-snapshot-value">
                          ${suggestedBudgetVal.toLocaleString()}
                        </span>
                      </div>
                      <div className="biq-pinfo-snapshot-item">
                        <span className="biq-pinfo-snapshot-label">
                          <Layers size={10} /> Effort baseline
                        </span>
                        <span className="biq-pinfo-snapshot-value">{baselineHours} hrs</span>
                      </div>
                    </div>
                  </div>

                  {/* What the proposal will include */}
                  <div className="biq-pinfo-caps">
                    <div className="biq-pinfo-caps-head">What the proposal will include</div>
                    <div className="biq-pinfo-caps-grid">
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#6366f1" }}>
                        <div className="biq-pinfo-cap-icon">
                          <Briefcase size={14} />
                        </div>
                        <div className="biq-pinfo-cap-body">
                          <span className="biq-pinfo-cap-title">Scope &amp; deliverables</span>
                          <span className="biq-pinfo-cap-text">
                            Clear breakdown of what's being built, written in client-ready language.
                          </span>
                        </div>
                      </div>
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#8b5cf6" }}>
                        <div className="biq-pinfo-cap-icon">
                          <Calendar size={14} />
                        </div>
                        <div className="biq-pinfo-cap-body">
                          <span className="biq-pinfo-cap-title">Milestones &amp; timeline</span>
                          <span className="biq-pinfo-cap-text">
                            Phased plan with realistic dates derived from the effort baseline.
                          </span>
                        </div>
                      </div>
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#10b981" }}>
                        <div className="biq-pinfo-cap-icon">
                          <DollarSign size={14} />
                        </div>
                        <div className="biq-pinfo-cap-body">
                          <span className="biq-pinfo-cap-title">Pricing &amp; payment terms</span>
                          <span className="biq-pinfo-cap-text">
                            Quote with payment schedule, anchored to the chosen duration and cost.
                          </span>
                        </div>
                      </div>
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#f59e0b" }}>
                        <div className="biq-pinfo-cap-icon">
                          <FileText size={14} />
                        </div>
                        <div className="biq-pinfo-cap-body">
                          <span className="biq-pinfo-cap-title">Personalized pitch</span>
                          <span className="biq-pinfo-cap-text">
                            Tailored intro that speaks to this client's signals and the job context.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2 — Choose terms */}
                  <div className="biq-pinfo-options">
                    <div className="biq-pinfo-caps-head">Choose how to anchor the proposal</div>
                    <div className="biq-opt-grid">
                      <button
                        type="button"
                        onClick={() => setSelectedOption("client")}
                        className={`biq-opt-card ${selectedOption === "client" ? "is-selected" : ""}`}
                        disabled={generatingProposal}
                      >
                        <div className="biq-opt-card-head">
                          <span className="biq-opt-tag biq-opt-tag-client">
                            <Users size={10} /> Client&apos;s terms
                          </span>
                          {selectedOption === "client" && (
                            <span className="biq-opt-check">
                              <CheckCircle2 size={14} />
                            </span>
                          )}
                        </div>
                        <div className="biq-opt-name">As client posted</div>
                        <div className="biq-opt-rows">
                          <div className="biq-opt-row">
                            <span className="biq-opt-row-l">
                              <Clock size={11} /> Duration
                            </span>
                            <span className="biq-opt-row-v">{selectedProposalLead.duration || "Not specified"}</span>
                          </div>
                          <div className="biq-opt-row">
                            <span className="biq-opt-row-l">
                              <DollarSign size={11} /> Cost
                            </span>
                            <span className="biq-opt-row-v">
                              {selectedProposalLead.budget ? `$${clientBudgetNum.toLocaleString()}` : "Not specified"}
                            </span>
                          </div>
                        </div>
                        <div className="biq-opt-foot">Match the client&apos;s expectations exactly.</div>
                      </button>

                      <div
                        className={`biq-opt-card ${selectedOption === "custom" ? "is-selected" : ""}`}
                        onClick={() => !generatingProposal && setSelectedOption("custom")}
                      >
                        <div className="biq-opt-card-head">
                          <span className="biq-opt-tag biq-opt-tag-custom">
                            <Sparkles size={10} /> Your plan
                          </span>
                          {selectedOption === "custom" && (
                            <span className="biq-opt-check">
                              <CheckCircle2 size={14} />
                            </span>
                          )}
                        </div>
                        <div className="biq-opt-name">Set your own terms</div>
                        <div className="biq-opt-fields">
                          <div className="biq-opt-field">
                            <label>Project window</label>
                            <DatePicker.RangePicker
                              style={{ width: "100%", borderRadius: 8 }}
                              value={customDates as any}
                              onChange={(dates) => setCustomDates(dates as any)}
                              disabled={generatingProposal}
                              onClick={(e) => { e.stopPropagation(); setSelectedOption("custom"); }}
                            />
                            {customDays > 0 && (
                              <div className="biq-opt-hint">
                                ≈ {customDays} day{customDays !== 1 ? "s" : ""} ({Math.round(customDays / 7)}w)
                              </div>
                            )}
                          </div>
                          <div className="biq-opt-field">
                            <label>Your cost (USD)</label>
                            <InputNumber
                              style={{ width: "100%", borderRadius: 8 }}
                              min={0}
                              value={customCost as any}
                              onChange={(v) => setCustomCost(v as any)}
                              placeholder="e.g. 4500"
                              formatter={(value) => (value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                              parser={(value) => Number((value || "").replace(/\$\s?|,/g, "")) as any}
                              disabled={generatingProposal}
                              onClick={(e) => { e.stopPropagation(); setSelectedOption("custom"); }}
                            />
                          </div>
                        </div>
                        <div className="biq-opt-foot">Override with your scope-driven plan.</div>
                      </div>
                    </div>

                    {selectedOption && (
                      <div className="biq-opt-note">
                        <Info size={12} />
                        <span>
                          <b>Note:</b> The proposal will be created based on the {selectedOption === "client" ? "client's posted" : "values you've entered"} duration and cost. AI will use these as constraints when shaping scope, deliverables, and milestones.
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Footer — swaps actions per step */}
              <div className="biq-pinfo-footer">
                <span className="biq-pinfo-footnote">
                  <ShieldCheck size={12} />
                  {proposalStep === 0
                    ? "Editable end-to-end in the proposal builder."
                    : "AI will use these as constraints for scope and milestones."}
                </span>
                <div className="biq-pinfo-footer-actions">
                  {proposalStep === 0 ? (
                    <>
                      <Button onClick={closeProposalFlow} className="biq-secondary-btn">
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        onClick={goToOptionStep}
                        className="biq-primary-btn"
                        icon={<Sparkles size={13} />}
                      >
                        Continue
                        <ArrowUpRight size={13} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setProposalStep(0)}
                        className="biq-secondary-btn"
                        disabled={generatingProposal}
                      >
                        Back
                      </Button>
                      <Button
                        type="primary"
                        loading={generatingProposal}
                        disabled={!selectedOption || (selectedOption === "custom" && !customValid)}
                        onClick={handleConfirmGenerate}
                        className="biq-primary-btn"
                        icon={!generatingProposal ? <Sparkles size={13} /> : undefined}
                      >
                        {generatingProposal ? "Generating proposal…" : "Create proposal"}
                        {!generatingProposal && <ArrowUpRight size={13} />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Lead Form Drawer */}
        <Drawer
          title={
            <div className="lead-drawer-header" style={{ position: "relative", overflow: "hidden", margin: "-16px -24px", padding: "20px 24px" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(120% 80% at 100% 0%, rgba(139,92,246,0.10) 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, rgba(99,102,241,0.08) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px -6px rgba(99, 102, 241, 0.5)",
                    flexShrink: 0,
                  }}
                >
                  {editingKey ? <Edit2 size={20} /> : <Sparkles size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div className="premium-title" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-slate-900)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                      {editingKey ? "Edit Opportunity" : "New Lead Entry"}
                    </div>
                    <span
                      className="lead-drawer-badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(99, 102, 241, 0.1)",
                        color: "#6366f1",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <Sparkles size={10} /> AI-ready
                    </span>
                  </div>
                  <div className="premium-text-sec" style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                    {editingKey
                      ? "Refine details and re-sync this opportunity to your pipeline"
                      : "4 quick sections — client, job, platform & docs. Takes under a minute."}
                  </div>
                </div>
              </div>
            </div>
          }
          width={540}
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          className="premium-drawer lead-drawer"
          headerStyle={{ borderBottom: '1px solid var(--border-slate-100)', padding: '16px 24px', background: 'var(--bg-pure-white)' }}
          bodyStyle={{ padding: '24px', background: 'var(--bg-pure-white)' }}
          footerStyle={{ borderTop: '1px solid var(--border-slate-100)', padding: '14px 24px', background: 'var(--bg-pure-white)' }}
          footer={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                <ShieldCheck size={13} style={{ color: "#10b981" }} />
                Auto-saved to your secure workspace
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setIsDrawerVisible(false)} style={{ borderRadius: 10, height: 40, fontWeight: 600, padding: "0 18px" }} className="premium-btn-cancel">Cancel</Button>
                {((editingKey && canUpdateLead) || (!editingKey && canCreateLead)) && (
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                    className="lead-drawer-submit"
                    style={{
                      borderRadius: 10,
                      height: 40,
                      padding: "0 22px",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      border: "none",
                      fontWeight: 700,
                      boxShadow: "0 6px 16px -4px rgba(99, 102, 241, 0.45)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {editingKey ? "Update Lead" : "Create Lead"}
                    <ArrowUpRight size={15} />
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLead} requiredMark={false} className="lead-drawer-form">
            {/* Lead-kind picker — switches the form between online platforms and own-website inquiries */}
            <Form.Item name="leadSourceKind" initialValue="platform" style={{ marginBottom: 18 }}>
              <Segmented
                block
                size="large"
                options={[
                  {
                    value: 'platform',
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                          <Briefcase size={14} />
                          Online Platform
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-slate-500)', fontWeight: 500, marginTop: 2 }}>
                          Upwork · LinkedIn · Freelancer · Fiverr
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'website',
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                          <Globe size={14} />
                          Website Inquiry
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-slate-500)', fontWeight: 500, marginTop: 2 }}>
                          Zukvo · Zithtech contact forms
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Form.Item>

            {(Form.useWatch('leadSourceKind', form) || 'platform') === 'website' ? (
              <WebsiteLeadFields configStatuses={configStatuses} />
            ) : (
              <>
                {/* Client Details Section */}
                <div className="premium-drawer-section lead-section-card" style={{
                  marginBottom: 20,
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-slate-100)'
                }}>
                  <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <span className="lead-section-step" style={{
                      width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(99, 102, 241, 0.08)", color: "#6366f1",
                      border: "1px solid rgba(99, 102, 241, 0.18)",
                    }}>01</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <User size={15} color="#6366f1" />
                        <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client Information</span>
                      </div>
                      <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Who you're pitching — contact, location, and trust signals</Text>
                    </div>
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="clientName" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Client Name</Text>} rules={[{ required: true }]}>
                        <Input placeholder="e.g. John Doe" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="clientMail" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Email Address</Text>} rules={[{ required: true, type: 'email' }]}>
                        <Input placeholder="john@example.com" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="clientPhone"
                        label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Phone Number</Text>}
                        getValueFromEvent={(e) => {
                          const value = e.target.value;
                          let sanitized = value.replace(/[^0-9\s\-()+]/g, '');
                          if (sanitized.includes('+')) {
                            const hasPlusAtStart = sanitized.startsWith('+');
                            sanitized = sanitized.replace(/\+/g, '');
                            if (hasPlusAtStart) {
                              sanitized = '+' + sanitized;
                            }
                          }
                          let digitsCount = 0;
                          let limited = '';
                          for (let i = 0; i < sanitized.length; i++) {
                            const char = sanitized[i];
                            if (/\d/.test(char)) {
                              if (digitsCount < 15) {
                                digitsCount++;
                                limited += char;
                              }
                            } else {
                              limited += char;
                            }
                          }
                          return limited;
                        }}
                        rules={[
                          {
                            validator: (_, value) => {
                              if (!value || value.trim() === '') {
                                return Promise.resolve();
                              }
                              const digits = value.replace(/\D/g, '');
                              if (digits.length < 7) {
                                return Promise.reject(new Error('Phone number must contain at least 7 digits.'));
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                      >
                        <Input placeholder="+1 234..." style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="clientLocation" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Location</Text>}>
                        <Input placeholder="City, Country" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="clientRating" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Client Rating</Text>}>
                        <Input placeholder="e.g. 4.9/5" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="clientSpend" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Total Spend</Text>}>
                        <Input placeholder="e.g. $10k+" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="clientPaymentVerified" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Payment Verified</Text>}>
                        <Select className="lead-verified-select" style={{ borderRadius: 8 }} suffixIcon={<ChevronRight size={13} color="#94a3b8" />}>
                          <Select.Option value={true}>
                            <Space size={6}><CheckCircle size={13} style={{ color: "#10b981" }} /> <span style={{ fontWeight: 600 }}>Verified</span></Space>
                          </Select.Option>
                          <Select.Option value={false}>
                            <Space size={6}><AlertCircle size={13} style={{ color: "#94a3b8" }} /> <span style={{ fontWeight: 600 }}>Not Verified</span></Space>
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="clientPhoneVerified" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Phone Verified</Text>}>
                        <Select className="lead-verified-select" style={{ borderRadius: 8 }} suffixIcon={<ChevronRight size={13} color="#94a3b8" />}>
                          <Select.Option value={true}>
                            <Space size={6}><CheckCircle size={13} style={{ color: "#10b981" }} /> <span style={{ fontWeight: 600 }}>Verified</span></Space>
                          </Select.Option>
                          <Select.Option value={false}>
                            <Space size={6}><AlertCircle size={13} style={{ color: "#94a3b8" }} /> <span style={{ fontWeight: 600 }}>Not Verified</span></Space>
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* Job Details Section */}
                <div className="premium-drawer-section-alt lead-section-card" style={{
                  marginBottom: 20,
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-slate-100)'
                }}>
                  <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <span className="lead-section-step" style={{
                      width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                    }}>02</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Briefcase size={15} color="#f59e0b" />
                        <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Job Specification</span>
                      </div>
                      <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Scope, skills, and budget — what success looks like</Text>
                    </div>
                  </div>
                  <Form.Item name="title" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Title</Text>} rules={[{ required: true }]}>
                    <Input placeholder="e.g. Senior Frontend Engineer" style={{ borderRadius: 8 }} />
                  </Form.Item>
                  <Form.Item name="summary" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Description</Text>}>
                    <TextArea
                      rows={4}
                      placeholder="Enter the full job description or client request..."
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="ai_summary"
                    label={
                      <Space size={6}>
                        <span className="lead-ai-chip" style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 999,
                          background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                          color: "#6366f1", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em",
                          textTransform: "uppercase", border: "1px solid rgba(99,102,241,0.25)",
                        }}>
                          <Sparkles size={10} /> AI
                        </span>
                        <Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Intelligence Summary</Text>
                      </Space>
                    }
                  >
                    <TextArea
                      rows={4}
                      placeholder="Paste the job description or key notes — AI will distill this into actionable insights..."
                      className="lead-ai-textarea"
                      style={{
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(139,92,246,0.03) 100%)",
                        border: "1px solid rgba(99, 102, 241, 0.18)",
                      }}
                    />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="skills" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Required Skills</Text>}>
                        <Select mode="tags" style={{ width: '100%' }} placeholder="Add skills..." tokenSeparators={[',']} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="duration" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Duration</Text>}>
                        <Input placeholder="e.g. 3 Months" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="hourBasedAmount" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Hourly ($)</Text>}>
                        <InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="budget" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Budget ($)</Text>}>
                        <Input placeholder="e.g. 5000" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="estOrProjectDuration" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Type</Text>}>
                        <Input placeholder="Fixed/Hourly" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* Timeline & Meta Section */}
                <div className="premium-drawer-section lead-section-card" style={{
                  marginBottom: 20,
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-slate-100)'
                }}>
                  <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <span className="lead-section-step" style={{
                      width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(16, 185, 129, 0.08)", color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}>03</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LinkIcon size={15} color="#10b981" />
                        <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Platform & Status</span>
                      </div>
                      <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Where this came from and where it sits in your pipeline</Text>
                    </div>
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="platform" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Platform</Text>} initialValue="Upwork">
                        <Select placeholder="Select Platform" style={{ borderRadius: 8 }}>
                          <Select.Option value="Upwork">Upwork</Select.Option>
                          <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                          <Select.Option value="Freelancer">Freelancer</Select.Option>
                          <Select.Option value="Fiverr">Fiverr</Select.Option>
                          <Select.Option value="Website">Website</Select.Option>
                          <Select.Option value="Other">Other</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="status" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Current Status</Text>}>
                        <Select placeholder="Select Status" style={{ borderRadius: 8 }}>
                          {configStatuses.map(s => (
                            <Select.Option key={s.id} value={s.name}>
                              <Space>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                                {s.name}
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="jobLink" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Link</Text>}>
                    <Input placeholder="https://..." style={{ borderRadius: 8 }} />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="postedOn" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Posted On</Text>} initialValue={dayjs()}>
                        <DatePicker style={{ width: '100%', borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="actions" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Next Action Items</Text>}>
                        <Select placeholder="Select Action" allowClear style={{ borderRadius: 8 }}>
                          {configActions.map(a => (
                            <Select.Option key={a.id} value={a.name}>
                              <Space>
                                {renderActionIcon(a.icon)}
                                <span style={{ color: a.color }}>{a.name}</span>
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* Documents Section */}
                <div className="premium-drawer-section-alt lead-section-card" style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-slate-100)'
                }}>
                  <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <span className="lead-section-step" style={{
                      width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(236, 72, 153, 0.08)", color: "#ec4899",
                      border: "1px solid rgba(236, 72, 153, 0.2)",
                    }}>04</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={15} color="#ec4899" />
                        <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Supporting Documents</span>
                        <span style={{
                          padding: "1px 7px", borderRadius: 999, background: "#f1f5f9",
                          color: "#64748b", fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}>Optional</span>
                      </div>
                      <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Briefs, mockups, or contract drafts shared by the client</Text>
                    </div>
                  </div>
                  <Form.List name="documents">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map((field) => (
                          <DocumentRow
                            key={field.key}
                            field={field}
                            remove={remove}
                            handleFileUpload={handleFileUpload}
                            messageApi={messageApi}
                          />
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => add({ type: 'file' })}
                          block
                          icon={<PlusCircle size={16} />}
                          className="doc-add-btn"
                        >
                          Add Supporting Document
                        </Button>
                      </>
                    )}
                  </Form.List>
                </div>
              </>
            )}
          </Form>
        </Drawer>

        <LeadMailDrawer
          visible={isMailDrawerVisible}
          onClose={() => {
            setIsMailDrawerVisible(false);
            setSelectedLeadForMail(null);
          }}
          lead={selectedLeadForMail}
          fromEmail={invoiceMailSettings?.email}
          onSuccess={fetchLeads}
        />

        <WebsiteLeadDrawer
          open={websiteDrawerOpen}
          onClose={() => {
            setWebsiteDrawerOpen(false);
            setWebsiteDrawerLead(null);
          }}
          lead={websiteDrawerLead}
          configStatuses={configStatuses}
        />

        {/* ----------------------- Timeline Drawer ----------------------- */}
        <Drawer
          className="lm-timeline-drawer"
          title={
            <div className="ltl-header">
              <div className="ltl-header-main">
                <div className="ltl-eyebrow">
                  <span className="ltl-dot" />
                  <span>Activity</span>
                </div>
                <div className="ltl-title">Lead Timeline</div>
                <div className="ltl-subtitle">
                  {/* <span className="ltl-subtitle-strong">
                    {activeTimelineLead?.client_name || "Client"}
                  </span> */}
                  {activeTimelineLead?.title && (
                    <>
                      <span className="ltl-sep">·</span>
                      <span className="ltl-subtitle-mute">{activeTimelineLead.title}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ltl-header-meta">
                <div className="ltl-stat-chip">
                  <History size={13} />
                  <span className="ltl-stat-num">{timelineData.length}</span>
                  <span className="ltl-stat-label">
                    event{timelineData.length === 1 ? "" : "s"}
                  </span>
                </div>
                {activeTimelineLead?.posted_on && (
                  <div className="ltl-since">
                    Since {dayjs(activeTimelineLead.posted_on).format("DD MMM YYYY")}
                  </div>
                )}
              </div>
            </div>
          }
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          width={420}
          styles={{ body: { padding: '24px 20px' } }}
        >
          {timelineLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : timelineData.length === 0 ? (
            <Empty description="No activity recorded yet" />
          ) : (
            <Timeline
              mode="left"
              items={timelineData.map((item: any) => {
                const actionMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                  CREATED_LEAD: { label: 'Lead Created', color: '#6366f1', icon: <Layers size={13} /> },
                  UPDATED_LEAD: { label: 'Lead Updated', color: '#f59e0b', icon: <FileEdit size={13} /> },
                  CREATED_BIDIQ: { label: 'BidIQ Analyzed', color: '#8b5cf6', icon: <Zap size={13} /> },
                  CREATED_PROPOSAL: { label: 'Proposal Created', color: '#10b981', icon: <FileText size={13} /> },
                  CLIENT_CREATED: { label: 'Client Created', color: '#3b82f6', icon: <UserPlus size={13} /> },
                  PROJECT_CREATED: { label: 'Project Created', color: '#06b6d4', icon: <FolderPlus size={13} /> },
                  MAIL_SENT: { label: 'Email Sent', color: '#ec4899', icon: <Send size={13} /> },
                };
                const meta = actionMeta[item.action] || { label: item.action, color: '#94a3b8', icon: <Activity size={13} /> };
                const user = item.performedByUser;
                const userName = user?.name || user?.email || 'System';

                return {
                  color: meta.color,
                  dot: (
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: `${meta.color}18`,
                      border: `1.5px solid ${meta.color}50`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: meta.color
                    }}>
                      {meta.icon}
                    </div>
                  ),
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-slate-900, #0f172a)' }}>
                          {meta.label}
                        </span>
                        <Tag color={meta.color} style={{ fontSize: 10, padding: '0 6px', lineHeight: '18px', border: 'none', background: `${meta.color}18`, color: meta.color }}>
                          {item.action}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>by <strong style={{ color: '#475569' }}>{userName}</strong></span>
                        <span>·</span>
                        <span>{dayjs(item.createdAt).format('DD MMM YYYY, h:mm A')}</span>
                      </div>
                      {item.metadata && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '4px 8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                          {item.action === 'MAIL_SENT' && `To: ${(item.metadata.to || []).join(', ')} · Subject: ${item.metadata.subject || ''}`}
                          {item.action === 'CLIENT_CREATED' && `Client: ${item.metadata.clientName || item.metadata.clientId}`}
                          {item.action === 'PROJECT_CREATED' && `Project: ${item.metadata.projectName || item.metadata.projectId}`}
                          {item.action === 'CREATED_PROPOSAL' && `${item.metadata.ai_generated ? '✨ AI Generated · ' : ''}${item.metadata.title || ''}`}
                          {item.action === 'CREATED_BIDIQ' && `BidIQ Score: ${item.metadata.score ?? '—'}`}
                        </div>
                      )}
                    </div>
                  ),
                };
              })}
            />
          )}
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
            /* ====================================================== */
            /*                Leads Management — Premium               */
            /* ====================================================== */
            .lm-page {
              position: relative;
              background: var(--bg-pure-white);
              height: calc(100vh - 64px);
              overflow: hidden;
            }
            .lm-ambient {
              display: none;
            }
            
            /* Custom Table Footer */
            .lm-bottom-bar {
              display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
              padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
            }
            .lm-bottom-bar--sticky {
              position: sticky; bottom: 0; z-index: 30; padding: 12px 14px 12px 32px;
              margin: 16px 0 0 -18px;
              background: var(--bg-pure-white);
              border-top: 1px solid var(--border-slate-200);
              box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
            }
            .lm-bottom-info { font-size: 12px; color: var(--text-slate-500); }
            .lm-bottom-info strong { color: var(--text-slate-700); font-weight: 700; }
            .lm-bottom-sel { color: #3B82F6; font-weight: 600; }
            .lm-pager { display: flex; align-items: center; gap: 3px; }
            .lm-pager-btn, .lm-pager-num {
              min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
              background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
            }
            .lm-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            .lm-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
            .lm-pagesize { margin-left: 5px; }
            .lm-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
            .lm-body {
              position: relative;
              z-index: 1;
              padding: 10px 0 20px 0;
            }

            /* ---------- Shell (sidebar + main) ---------- */
            .lm-shell {
              display: flex;
              margin: 0 -16px;
              height: 100%;
              background: var(--bg-pure-white);
            }
            .lm-main {
              flex: 1;
              min-width: 0;
              padding: 8px 18px 0;
              display: flex;
              flex-direction: column;
              height: 100%;
            }
            .lm-body {
              flex: 1;
              min-height: 0;
              overflow-y: auto;
            }

            .lm-sidebar {
              width: 240px;
              flex-shrink: 0;
              border-right: 1px solid var(--border-slate-200);
              background: var(--bg-pure-white);
              display: flex;
              flex-direction: column;
              position: sticky;
              top: 0;
              height: calc(100vh - 64px);
            }
            .lm-sidebar-top {
              padding: 14px 14px 12px 18px;
              border-bottom: 1px solid var(--border-slate-200);
            }
            .lm-side-head {
              display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
            }
            .lm-side-logo {
              flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            }
            .lm-side-logo .anticon, .lm-side-logo svg { font-size: 24px !important; color: var(--text-slate-900) !important; width: 24px; height: 24px; }
            .lm-side-head-text { display: flex; flex-direction: column; min-width: 0; }
            .lm-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
            .lm-side-subtitle {
              font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
              text-transform: uppercase; letter-spacing: 0.07em;
            }
            .lm-create-btn {
              height: 32px !important; border-radius: 0 !important; font-weight: 600 !important; font-size: 12.5px !important;
              background: #3B82F6 !important;
              border: none !important; box-shadow: none !important;
              margin-bottom: 4px;
            }
            .lm-create-btn:hover { background: #2563EB !important; }
            .lm-create-btn .anticon, .lm-create-btn svg { font-size: 12px !important; width: 12px; height: 12px; }
            .lm-side-scroll {
              flex: 1;
              min-height: 0;
              overflow-y: auto;
              overflow-x: hidden;
              padding: 10px 10px 6px 16px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .lm-side-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
            .lm-side-section-label {
              font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
              color: var(--text-slate-400); padding: 12px 8px 0; margin: 16px 0 6px;
              border-top: 1px solid var(--border-slate-200);
            }
            .lm-side-scroll > .lm-side-section-label:first-child { margin-top: 6px; border-top: none; padding-top: 0; }
            .lm-side-list { display: flex; flex-direction: column; gap: 1px; }
            .lm-view-item {
              display: flex; align-items: center; gap: 10px; width: 100%;
              padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
              cursor: pointer; transition: background .12s ease; text-align: left;
            }
            .lm-view-item:hover { background: var(--bg-slate-50); }
            .lm-view-item.is-active { background: var(--bg-blue-50); }
            .lm-view-item.is-active .lm-view-label { color: var(--text-slate-900); font-weight: 600; }
            .lm-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
            .lm-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
            .lm-view-count {
              font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
              min-width: 18px; text-align: right;
            }
            .lm-view-item.is-active .lm-view-count {
              color: #3B82F6; font-weight: 700;
              background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
            }
            .lm-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
            .lm-side-sd { border-radius: 0 !important; }
            .lm-clear-filters {
              display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
              background: none; border: none; cursor: pointer; padding: 3px;
              font-size: 12px; font-weight: 600; color: #ef4444;
            }

            .lm-topbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 20px;
            }
            .lm-kbd {
              font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
              background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
              border-radius: 5px; padding: 1px 6px;
            }

            /* ---------- Compact toolbar above the table ---------- */
            .lm-table-toolbar {
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 8px 12px;
              margin-bottom: 14px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 10px;
            }
            .lm-toolbar-count {
              font-size: 12.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }
            .lm-toolbar-count b {
              color: var(--text-slate-900);
              font-weight: 700;
              font-variant-numeric: tabular-nums;
            }
            .lm-toolbar-spacer { flex: 1 1 auto; }
            .lm-table-toolbar .lm-toolbar-filters-btn.ant-btn,
            .lm-table-toolbar button.lm-toolbar-filters-btn.ant-btn,
            .lm-topbar-actions .lm-toolbar-filters-btn.ant-btn,
            .lm-topbar-actions button.lm-toolbar-filters-btn.ant-btn {
              width: auto !important;
              min-width: 0 !important;
              padding: 0 12px !important;
              gap: 6px !important;
              font-size: 12.5px !important;
              font-weight: 600 !important;
              color: var(--text-slate-700) !important;
              white-space: nowrap !important;
              flex-shrink: 0 !important;
            }
            .lm-table-toolbar .lm-toolbar-export-btn.ant-btn,
            .lm-table-toolbar button.lm-toolbar-export-btn.ant-btn {
              background: var(--bg-slate-50) !important;
            }
            .lm-table-toolbar .lm-toolbar-export-btn.ant-btn:hover,
            .lm-table-toolbar button.lm-toolbar-export-btn.ant-btn:hover {
              background: var(--bg-slate-100) !important;
              border-color: var(--border-slate-200) !important;
            }
            .lm-toolbar-sort-current {
              color: var(--text-slate-900);
              font-weight: 700;
            }
            .lm-table-toolbar {
              flex-wrap: wrap;
            }
            .lm-toolbar-pill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 18px;
              height: 18px;
              padding: 0 5px;
              margin-left: 4px;
              border-radius: 999px;
              background: rgba(99, 102, 241, 0.14);
              color: #4f46e5;
              font-size: 10px;
              font-weight: 800;
              font-variant-numeric: tabular-nums;
            }
            .lm-toolbar-popover .ant-popover-inner {
              border-radius: 0 !important;
            }
            .lm-filters-popover-body {
              width: 260px;
            }

            /* Dark theme — small refinements (most colors handled by CSS vars) */
            [data-theme='dark'] .lm-side-row:hover {
              background: rgba(255, 255, 255, 0.04);
            }
            [data-theme='dark'] .lm-side-row.is-active {
              background: rgba(99, 102, 241, 0.18);
              color: #a5b4fc;
            }
            [data-theme='dark'] .lm-side-row.is-active .lm-side-row-count {
              color: #a5b4fc;
            }

            /* ---------- Header buttons / search ---------- */
            .lm-search-input.ant-input-affix-wrapper {
              height: 38px !important;
              border-radius: 10px !important;
              background: transparent !important;
              border: 1px solid var(--border-slate-100) !important;
              transition: all .2s ease;
            }
            .lm-search-input.ant-input-affix-wrapper:focus-within {
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
              background: var(--bg-pure-white) !important;
            }
            .lm-search-input .ant-input {
              background: transparent !important;
              font-size: 13px;
              font-weight: 500;
            }
            .lm-secondary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .lm-secondary-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }
            .lm-primary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              padding: 0 18px !important;
              font-weight: 700 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              border: 0 !important;
              box-shadow: 0 6px 16px -8px rgba(99, 102, 241, 0.6) !important;
            }
            .lm-primary-btn:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .2s ease;
            }

            /* ---------- Stat grid ---------- */
            .lm-stat-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 14px;
            }
            @media (max-width: 1100px) {
              .lm-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 600px) {
              .lm-stat-grid { grid-template-columns: 1fr; }
            }
            .lm-stat-card {
              position: relative;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 0;
              padding: 10px 12px 10px;
              overflow: hidden;
              transition: border-color .15s ease;
            }
            .lm-stat-card:hover {
              border-color: var(--border-slate-200);
            }
            .lm-stat-card:hover .lm-stat-accent { opacity: 1; }
            .lm-stat-accent {
              position: absolute;
              left: 0; right: 0; bottom: 0;
              height: 2px;
              opacity: 0.55;
              transition: opacity .25s ease;
              pointer-events: none;
            }
            .lm-stat-head {
              display: flex;
              align-items: center;
              gap: 8px;
              min-width: 0;
            }
            .lm-stat-icon {
              width: 24px; height: 24px;
              border-radius: 7px;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .lm-stat-icon svg { width: 13px; height: 13px; }
            .lm-stat-label {
              flex: 1;
              min-width: 0;
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-500);
              letter-spacing: 0.04em;
              text-transform: uppercase;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .lm-stat-value-wrap {
              display: flex;
              align-items: center;
              gap: 6px;
              flex-shrink: 0;
            }
            .lm-stat-value {
              font-size: 18px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.02em;
              line-height: 1;
              font-variant-numeric: tabular-nums;
            }
            .lm-trend {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 7px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              line-height: 1;
              white-space: nowrap;
            }
            .lm-trend.up { background: rgba(16,185,129,0.1); color: #047857; }
            .lm-trend.down { background: rgba(239,68,68,0.1); color: #b91c1c; }
            .lm-trend-value { letter-spacing: 0.01em; }
            .lm-stat-subtle {
              display: block;
              font-size: 10.5px;
              color: var(--text-slate-500);
              margin-top: 4px;
              padding-left: 32px;
              font-weight: 500;
              line-height: 1.35;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .lm-stat-chart {
              margin-top: 6px;
              padding-top: 6px;
              padding-left: 32px;
              border-top: 1px dashed var(--border-slate-100);
            }

            /* MiniBar */
            .lm-minibar { display: flex; flex-direction: column; gap: 7px; }
            .lm-minibar-track {
              height: 6px;
              background: var(--bg-slate-50);
              border-radius: 999px;
              display: flex;
              overflow: hidden;
              border: 1px solid var(--border-slate-100);
            }
            .lm-minibar-seg {
              display: block;
              height: 100%;
              transition: width .4s ease;
            }
            .lm-minibar-seg + .lm-minibar-seg {
              border-left: 1px solid var(--bg-pure-white);
            }
            .lm-minibar-legend {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }
            .lm-minibar-legend-item {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              font-size: 11px;
              color: var(--text-slate-600);
              font-weight: 500;
            }
            .lm-minibar-dot {
              width: 7px; height: 7px;
              border-radius: 2px;
              display: inline-block;
            }

            /* Inline progress (hot / pipeline) */
            .lm-progress-row {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .lm-progress-track {
              flex: 1;
              height: 6px;
              background: var(--bg-slate-50);
              border-radius: 999px;
              overflow: hidden;
              border: 1px solid var(--border-slate-100);
            }
            .lm-progress-fill {
              display: block;
              height: 100%;
              border-radius: 999px;
              transition: width .4s ease;
            }
            .lm-progress-label {
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-700);
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
            }

            /* ---------- Section divider ---------- */
            .lm-section-divider {
              position: relative;
              margin: 4px 0 16px;
              height: 18px;
              display: flex;
              align-items: center;
            }
            .lm-section-divider::before {
              content: "";
              position: absolute;
              left: 0; right: 0;
              top: 50%;
              height: 1px;
              background: linear-gradient(
                90deg,
                transparent 0%,
                var(--border-slate-100) 18%,
                var(--border-slate-100) 82%,
                transparent 100%
              );
              transform: translateY(-0.5px);
              pointer-events: none;
            }
            .lm-section-divider-label {
              position: relative;
              z-index: 1;
              background: var(--bg-primary);
              padding: 0 12px;
              margin-left: 4px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--text-slate-500);
            }

            /* ---------- Inline-edit status pill ---------- */
            .lm-status-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px 4px 12px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              cursor: pointer;
              transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
              font-family: inherit;
              outline: none;
              max-width: 100%;
            }
            .lm-status-pill:hover {
              filter: brightness(0.97);
              transform: translateY(-0.5px);
              box-shadow: 0 4px 10px -4px rgba(15, 23, 42, 0.12);
            }
            .lm-status-pill:focus-visible {
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
            }
            .lm-status-pill-text {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1;
            }
            .lm-status-pill-edit {
              opacity: 0;
              transform: translateX(-3px);
              transition: opacity 0.15s ease, transform 0.15s ease;
              flex-shrink: 0;
            }
            .lm-status-pill:hover .lm-status-pill-edit {
              opacity: 0.75;
              transform: translateX(0);
            }
            .lm-status-select.ant-select .ant-select-selector {
              padding: 0 !important;
              height: auto !important;
              background: transparent !important;
            }

            /* ---------- Bulk action bar ---------- */
            .lm-bulk-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 10px 14px;
              margin-bottom: 12px;
              background: linear-gradient(
                90deg,
                rgba(99, 102, 241, 0.08) 0%,
                rgba(139, 92, 246, 0.05) 100%
              );
              border: 1px solid rgba(99, 102, 241, 0.2);
              border-radius: 12px;
              animation: lmBulkSlide 0.2s ease-out;
            }
            @keyframes lmBulkSlide {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .lm-bulk-bar-left,
            .lm-bulk-bar-right {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .lm-bulk-count {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 999px;
              background: #fff;
              border: 1px solid rgba(99, 102, 241, 0.3);
              color: #4f46e5;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.01em;
            }
            .lm-bulk-count-dot {
              width: 6px; height: 6px;
              border-radius: 50%;
              background: #6366f1;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
            }
            .lm-bulk-divider {
              width: 1px; height: 16px;
              background: rgba(99, 102, 241, 0.2);
            }
            .lm-bulk-btn {
              height: 30px !important;
              border-radius: 8px !important;
              font-weight: 600 !important;
              font-size: 12px !important;
              padding: 0 12px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }
            .lm-bulk-btn-danger {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
              border: 0 !important;
              color: #fff !important;
              box-shadow: 0 4px 12px -4px rgba(239, 68, 68, 0.5) !important;
            }
            .lm-bulk-btn-danger:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .15s ease;
            }
            [data-theme='dark'] .lm-bulk-bar {
              background: linear-gradient(
                90deg,
                rgba(99, 102, 241, 0.12) 0%,
                rgba(139, 92, 246, 0.08) 100%
              );
              border-color: rgba(99, 102, 241, 0.3);
            }
            [data-theme='dark'] .lm-bulk-count {
              background: #161b22;
              color: #a5b4fc;
              border-color: rgba(99, 102, 241, 0.4);
            }

            /* ---------- Premium table card ---------- */
            .lm-table-card {
              position: relative;
              background: var(--bg-pure-white);
              border-radius: 0;
              border: 1px solid var(--border-slate-200);
              overflow: hidden;
            }
            /* Hide horizontal scrollbar but keep scroll functionality */
            .lm-table.ant-table-wrapper .ant-table-content::-webkit-scrollbar,
            .lm-table.ant-table-wrapper .ant-table-body::-webkit-scrollbar {
              display: none !important;
            }
            .lm-table.ant-table-wrapper .ant-table-content,
            .lm-table.ant-table-wrapper .ant-table-body {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
            .lm-table.ant-table-wrapper .ant-table {
              background: transparent !important;
              font-size: 12px;
            }
            .lm-table.ant-table-wrapper .ant-table-thead > tr > th {
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-400) !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              font-size: 10px !important;
              letter-spacing: 0.04em !important;
              padding: 6px 10px !important;
              border-bottom: 1px solid var(--border-slate-200) !important;
              white-space: nowrap !important;
            }
            .lm-table.ant-table-wrapper .ant-table-thead > tr > th::before { display: none !important; }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 6.5px 10px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              transition: background .15s ease;
              position: relative;
            }
            .lm-table.ant-table-wrapper .lm-row > td:nth-child(2)::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: linear-gradient(180deg, #3b82f6, #2563eb);
              opacity: 0;
              transition: opacity .2s ease;
              pointer-events: none;
            }
            .lm-table.ant-table-wrapper .lm-row:hover > td {
              background: var(--bg-slate-50) !important;
            }
            .lm-table.ant-table-wrapper .lm-row:hover > td:nth-child(2)::before {
              opacity: 1;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
              background: rgba(99, 102, 241, 0.06) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected:hover > td {
              background: rgba(99, 102, 241, 0.1) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td:nth-child(2)::before {
              opacity: 1;
            }

            /* Fixed column background overrides (Light Mode) */
            .lm-table.ant-table-wrapper .ant-table-tbody > tr > td.ant-table-cell-fix-right {
              background: var(--bg-pure-white) !important;
            }
            .lm-table.ant-table-wrapper .lm-row:hover > td.ant-table-cell-fix-right {
              background: var(--bg-slate-50) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td.ant-table-cell-fix-right {
              background: rgba(99, 102, 241, 0.06) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected:hover > td.ant-table-cell-fix-right {
              background: rgba(99, 102, 241, 0.1) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-thead > tr > th.ant-table-cell-fix-right {
              background: var(--bg-slate-50) !important;
            }

            /* Selection checkbox column */
            .lm-table.ant-table-wrapper .ant-table-selection-column {
              padding-left: 16px !important;
              padding-right: 8px !important;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-wrapper .ant-checkbox-inner {
              border-radius: 5px !important;
              border-color: #cbd5e1 !important;
              transition: all 0.15s ease;
              width: 17px;
              height: 17px;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-wrapper:hover .ant-checkbox-inner {
              border-color: #8b5cf6 !important;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-checked .ant-checkbox-inner {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              border-color: #6366f1 !important;
              box-shadow: 0 2px 6px -2px rgba(99, 102, 241, 0.45);
            }
            .lm-table.ant-table-wrapper .ant-checkbox-indeterminate .ant-checkbox-inner::after {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-checked::after {
              border-color: #8b5cf6 !important;
            }

            /* Pagination polish */
            .lm-table.ant-table-wrapper .ant-pagination {
              padding: 12px 16px;
              margin: 0 !important;
            }

            /* Dark theme — table */
            [data-theme='dark'] .lm-table-card {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-thead > tr > th {
              background: var(--bg-primary) !important;
              color: var(--text-slate-400) !important;
              border-bottom-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              border-bottom-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .lm-row:hover > td {
              background: var(--bg-primary) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
              background: rgba(99, 102, 241, 0.12) !important;
            }

            /* Fixed column background overrides (Dark Mode) */
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td.ant-table-cell-fix-right {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .lm-row:hover > td.ant-table-cell-fix-right {
              background: var(--bg-primary) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td.ant-table-cell-fix-right {
              background: rgba(99, 102, 241, 0.12) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected:hover > td.ant-table-cell-fix-right {
              background: rgba(99, 102, 241, 0.18) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-thead > tr > th.ant-table-cell-fix-right {
              background: var(--bg-primary) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-checkbox-wrapper .ant-checkbox-inner {
              background: var(--bg-primary) !important;
              border-color: #30363d !important;
            }

            /* ---------- Flat filter bar (replaces the boxy filter card) ---------- */
            .lm-filter-bar {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 14px;
              margin-bottom: 16px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              flex-wrap: wrap;
            }
            .lm-filter-bar-label {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              padding-right: 4px;
            }
            .lm-filter-bar-label svg { color: var(--text-slate-400); }
            .lm-filter-bar-spacer { flex: 1 1 auto; }
            .lm-filter-bar-count {
              font-size: 12px;
              color: var(--text-slate-500);
              font-weight: 500;
              padding: 0 4px;
            }
            .lm-filter-bar-count b {
              color: var(--text-slate-900);
              font-weight: 700;
              font-variant-numeric: tabular-nums;
            }

            /* Filter selects */
            .lm-filter-select.ant-select .ant-select-selector {
              height: 38px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: transparent !important;
              padding: 0 12px !important;
              display: flex; align-items: center;
              font-size: 13px;
              font-weight: 600;
            }
            .lm-filter-select.ant-select:hover .ant-select-selector {
              border-color: rgba(99, 102, 241, 0.35) !important;
            }
            .lm-filter-select.ant-select-focused .ant-select-selector {
              border-color: #6366f1 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
            }
            .lm-filter-select .ant-select-selection-placeholder,
            .lm-filter-select .ant-select-selection-item {
              line-height: 36px !important;
              font-size: 13px;
              font-weight: 600;
            }
            .lm-filter-status-chip {
              display: inline-block;
              padding: 2px 9px;
              border-radius: 999px;
              font-weight: 700;
              font-size: 10px;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }

            /* Date range picker */
            .lm-filter-date.ant-picker {
              height: 38px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: transparent !important;
              padding: 0 12px !important;
            }
            .lm-filter-date.ant-picker .ant-picker-input > input {
              font-weight: 600;
              font-size: 13px;
            }
            .lm-filter-date.ant-picker:hover {
              border-color: rgba(99, 102, 241, 0.35) !important;
            }
            .lm-filter-date.ant-picker-focused {
              border-color: #6366f1 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
            }
            .lm-filter-date.ant-picker input { font-size: 12.5px !important; }

            /* Clear button */
            .lm-filter-clear-btn.ant-btn {
              height: 32px !important;
              border-radius: 8px !important;
              padding: 0 12px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-600) !important;
              font-weight: 600 !important;
              font-size: 12.5px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }
            .lm-filter-clear-btn.ant-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }

            /* Settings button inside the filter bar */
            .lm-filter-settings-btn.ant-btn {
              height: 32px !important;
              width: 32px !important;
              padding: 0 !important;
              border-radius: 4px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-500) !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: color .15s ease, border-color .15s ease;
            }
            .lm-filter-settings-btn.ant-btn:hover {
              color: #4f46e5 !important;
              border-color: rgba(99, 102, 241, 0.35) !important;
            }

            /* ---------- Enhanced inline-edit dropdowns (Status / Workflow) ---------- */
            .lm-status-dropdown.ant-select-dropdown {
              padding: 6px !important;
              border-radius: 12px !important;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              box-shadow: 0 16px 36px -16px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.05) !important;
              min-width: 220px;
            }
            .lm-status-dropdown .ant-select-item {
              padding: 0 !important;
              border-radius: 8px !important;
              margin-bottom: 2px !important;
              background: transparent !important;
            }
            .lm-status-dropdown .ant-select-item:last-child { margin-bottom: 0 !important; }
            .lm-status-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
              background: var(--bg-slate-50) !important;
            }
            .lm-status-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
              background: rgba(99, 102, 241, 0.06) !important;
            }
            .lm-status-dropdown .ant-select-item-option-content {
              padding: 0 !important;
            }

            .lm-dd-row {
              display: flex;
              align-items: center;
              gap: 9px;
              padding: 8px 10px;
              border-radius: 8px;
              min-height: 34px;
              cursor: pointer;
            }
            .lm-dd-dot {
              width: 8px; height: 8px;
              border-radius: 50%;
              flex-shrink: 0;
            }
            .lm-dd-icon {
              width: 22px; height: 22px;
              border-radius: 6px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .lm-dd-text {
              flex: 1;
              min-width: 0;
              font-size: 12.5px;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .lm-dd-row.is-selected .lm-dd-text { font-weight: 700; }
            .lm-dd-check { flex-shrink: 0; }

            [data-theme='dark'] .lm-status-dropdown.ant-select-dropdown {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .lm-status-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
              background: var(--bg-primary) !important;
            }

            /* Created by + Created cells */
            .lm-creator-cell {
              display: flex;
              align-items: center;
              gap: 6px;
              min-width: 0;
            }
            .lm-creator-avatar {
              width: 20px; height: 20px;
              border-radius: 6px;
              color: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 0.02em;
              flex-shrink: 0;
            }
            .lm-creator-text {
              display: flex; flex-direction: column;
              min-width: 0;
            }
            .lm-creator-name {
              font-size: 11.5px;
              font-weight: 500;
              color: var(--text-slate-700);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 130px;
            }
            .lm-creator-you {
              font-size: 10px;
              color: var(--text-slate-500);
              font-weight: 600;
              letter-spacing: 0.02em;
              text-transform: uppercase;
            }
            .lm-creator-email {
              font-size: 10.5px;
              color: var(--text-slate-500);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 130px;
            }

            .lm-created-cell {
              display: flex; flex-direction: column;
              gap: 1px;
            }
            .lm-created-date {
              font-size: 12.5px;
              font-weight: 600;
              color: var(--text-slate-900);
              font-variant-numeric: tabular-nums;
            }
            .lm-created-rel {
              font-size: 10.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }

            /* Workflow Action pill — small icon prefix */
            .lm-action-pill {
              padding: 4px 10px 4px 6px;
              gap: 7px;
            }
            .lm-action-pill-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              border-radius: 6px;
              flex-shrink: 0;
            }

            /* ---------- Table settings popover (used inline now) ---------- */

            .lm-table-settings-popover .ant-popover-inner {
              padding: 14px !important;
              border-radius: 14px !important;
              border: 1px solid var(--border-slate-100) !important;
            }
            .lm-popover-section-label {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 10.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--text-slate-500);
              margin-bottom: 8px;
            }
            .lm-popover-section-label svg { color: var(--text-slate-400); }
            .lm-col-toggle-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              padding: 5px 8px;
              border-radius: 7px;
              transition: background .12s ease;
              font-size: 12.5px;
              color: var(--text-slate-700);
              cursor: pointer;
            }
            .lm-col-toggle-row:hover { background: var(--bg-slate-50); }
            .lm-col-toggle-list {
              display: flex;
              flex-direction: column;
              gap: 4px;
              max-height: 224px; /* ~7 rows before scroll */
              overflow-y: auto;
              padding-right: 4px;
              margin-right: -4px;
              scrollbar-width: thin;
              scrollbar-color: #cbd5e1 transparent;
            }
            .lm-col-toggle-list::-webkit-scrollbar {
              width: 6px;
            }
            .lm-col-toggle-list::-webkit-scrollbar-track {
              background: transparent;
            }
            .lm-col-toggle-list::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 3px;
            }
            .lm-col-toggle-list::-webkit-scrollbar-thumb:hover {
              background: #cbd5e1;
            }
            [data-theme='dark'] .lm-col-toggle-list {
              scrollbar-color: #30363d transparent;
            }
            [data-theme='dark'] .lm-col-toggle-list::-webkit-scrollbar-thumb {
              background: #30363d;
            }
            [data-theme='dark'] .lm-col-toggle-list::-webkit-scrollbar-thumb:hover {
              background: #484f58;
            }
            .lm-popover-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid var(--border-slate-100);
            }
            .lm-popover-reset {
              background: none;
              border: 0;
              padding: 0;
              cursor: pointer;
              color: #4f46e5;
              font-size: 14px;
              font-weight: 700;
              font-family: inherit;
            }
            .lm-popover-reset:hover { color: #4338ca; }
            .lm-popover-saved {
              font-size: 10.5px;
              color: var(--text-slate-400);
              font-weight: 500;
            }

            /* Density — vertical row padding inside the table card */
            .lm-table-card[data-density='compact'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 6px 12px !important;
            }
            .lm-table-card[data-density='comfortable'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 12px 14px !important;
            }
            .lm-table-card[data-density='spacious'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 18px 16px !important;
            }

            [data-theme='dark'] .lm-table-settings-btn.ant-btn {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-table-settings-popover .ant-popover-inner {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-col-toggle-row:hover {
              background: var(--bg-primary);
            }

            /* ---------- Timeline drawer header (premium) ---------- */
            .lm-timeline-drawer .ant-drawer-header {
              padding: 18px 24px !important;
              border-bottom: 1px solid #ececf1 !important;
              background: #ffffff !important;
            }
            .lm-timeline-drawer .ant-drawer-title {
              flex: 1;
              min-width: 0;
            }
            .lm-timeline-drawer .ant-drawer-close {
              color: #6b7280 !important;
            }
            .ltl-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 18px;
              width: 100%;
            }
            .ltl-header-main {
              display: flex;
              flex-direction: column;
              gap: 4px;
              min-width: 0;
            }
            .ltl-eyebrow {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: #6366f1;
            }
            .ltl-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #6366f1;
              display: inline-block;
            }
            .ltl-title {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: -0.01em;
              line-height: 1.3;
            }
            .ltl-subtitle {
              font-size: 12.5px;
              color: #6b7280;
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              min-width: 0;
              max-width: 320px;
            }
            .ltl-subtitle-strong {
              color: #0f172a;
              font-weight: 600;
              white-space: nowrap;
            }
            .ltl-subtitle-mute {
              color: #6b7280;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              min-width: 0;
            }
            .ltl-sep {
              color: #cbd5e1;
              flex-shrink: 0;
            }
            .ltl-header-meta {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 6px;
              flex-shrink: 0;
            }
            .ltl-stat-chip {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 11px;
              border: 1px solid #e5e7f0;
              border-radius: 999px;
              background: #fbfbfd;
              color: #475569;
              font-size: 12px;
              font-weight: 600;
            }
            .ltl-stat-chip svg { color: #6366f1; }
            .ltl-stat-num {
              color: #0f172a;
              font-weight: 700;
              font-variant-numeric: tabular-nums;
            }
            .ltl-stat-label {
              color: #6b7280;
              font-weight: 500;
            }
            .ltl-since {
              font-size: 10.5px;
              font-weight: 600;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }

            [data-theme='dark'] .lm-timeline-drawer .ant-drawer-header {
              background: #11151d !important;
              border-bottom-color: #21262d !important;
            }
            [data-theme='dark'] .ltl-title { color: #e6edf3; }
            [data-theme='dark'] .ltl-subtitle { color: #8b949e; }
            [data-theme='dark'] .ltl-subtitle-strong { color: #e6edf3; }
            [data-theme='dark'] .ltl-subtitle-mute { color: #8b949e; }
            [data-theme='dark'] .ltl-sep { color: #30363d; }
            [data-theme='dark'] .ltl-stat-chip {
              background: #161b22;
              border-color: #21262d;
              color: #c9d1d9;
            }
            [data-theme='dark'] .ltl-stat-chip svg { color: #a5b4fc; }
            [data-theme='dark'] .ltl-stat-num { color: #e6edf3; }
            [data-theme='dark'] .ltl-stat-label { color: #8b949e; }
            [data-theme='dark'] .ltl-since { color: #6e7681; }

            /* ---------- Lead title tooltip (Document Hub style) ---------- */
            .lm-title-tooltip-overlay .ant-tooltip-inner {
              background: rgba(15, 23, 42, 0.96) !important;
              border-radius: 10px !important;
              padding: 10px 12px !important;
              box-shadow: 0 10px 32px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
              min-width: 220px;
              max-width: 360px;
            }
            .lm-title-tooltip-overlay .ant-tooltip-arrow::before,
            .lm-title-tooltip-overlay .ant-tooltip-arrow::after {
              background: rgba(15, 23, 42, 0.96) !important;
            }
            .lm-title-tooltip { padding: 2px 0; }
            .lm-title-tooltip-eyebrow {
              font-size: 9.5px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: rgba(255, 255, 255, 0.62);
              margin-bottom: 5px;
            }
            .lm-title-tooltip-text {
              font-size: 13px;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.95);
              line-height: 1.4;
              letter-spacing: -0.005em;
              word-break: break-word;
            }
            .lm-title-tooltip-sub {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              font-size: 10.5px;
              color: rgba(255, 255, 255, 0.62);
              font-weight: 500;
            }
            .lm-title-tooltip-dot {
              width: 3px; height: 3px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.3);
            }

            /* ---------- BidIq preview modal ---------- */
            .lm-bidiq-modal .ant-modal-content {
              padding: 0 !important;
              border-radius: 16px !important;
              border: 1px solid var(--border-slate-100);
              overflow: hidden;
              background: var(--bg-pure-white);
              box-shadow: none !important;
            }
            .lm-bidiq-modal .ant-modal-body { padding: 0 !important; }

            .lm-bidiq-content { display: flex; flex-direction: column; }

            .lm-bidiq-head {
              display: flex;
              align-items: flex-start;
              gap: 14px;
              padding: 22px 24px 18px;
              position: relative;
              border-bottom: 1px solid var(--border-slate-100);
            }
            .lm-bidiq-icon {
              width: 44px; height: 44px;
              border-radius: 12px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: #fff;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .lm-bidiq-head-text { flex: 1; min-width: 0; padding-right: 40px; }
            .lm-bidiq-eyebrow {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 3px 8px;
              border-radius: 999px;
              background: rgba(99, 102, 241, 0.08);
              color: #4f46e5;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              border: 1px solid rgba(99, 102, 241, 0.2);
              margin-bottom: 8px;
            }
            .lm-bidiq-title {
              margin: 0 0 4px;
              font-size: 18px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.015em;
            }
            .lm-bidiq-sub {
              margin: 0;
              font-size: 12.5px;
              color: var(--text-slate-500);
              line-height: 1.5;
            }
            .lm-bidiq-close {
              position: absolute;
              top: 16px; right: 16px;
              width: 30px; height: 30px;
              border-radius: 8px;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              color: var(--text-slate-500);
              cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              transition: color .15s ease, border-color .15s ease;
            }
            .lm-bidiq-close:hover {
              color: var(--text-slate-900);
              border-color: var(--border-slate-200);
            }

            .lm-bidiq-snapshot {
              margin: 18px 24px 0;
              padding: 14px 16px;
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              background: var(--bg-slate-50);
            }
            .lm-bidiq-snapshot-head {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              margin-bottom: 8px;
            }
            .lm-bidiq-snapshot-title {
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              margin-bottom: 12px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .lm-bidiq-snapshot-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px 14px;
            }
            @media (max-width: 560px) {
              .lm-bidiq-snapshot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            .lm-bidiq-snapshot-item {
              display: flex; flex-direction: column; gap: 3px;
              min-width: 0;
            }
            .lm-bidiq-snapshot-label {
              display: inline-flex; align-items: center; gap: 4px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--text-slate-500);
            }
            .lm-bidiq-snapshot-value {
              font-size: 13px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .lm-bidiq-caps {
              padding: 18px 24px 0;
            }
            .lm-bidiq-caps-head {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              margin-bottom: 12px;
            }
            .lm-bidiq-caps-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            @media (max-width: 560px) {
              .lm-bidiq-caps-grid { grid-template-columns: 1fr; }
            }
            .lm-bidiq-cap {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              padding: 12px 14px;
              border: 1px solid var(--border-slate-100);
              border-radius: 11px;
              background: var(--bg-pure-white);
              transition: border-color .15s ease;
            }
            .lm-bidiq-cap:hover {
              border-color: color-mix(in oklab, var(--cap-accent) 30%, var(--border-slate-100));
            }
            .lm-bidiq-cap-icon {
              width: 28px; height: 28px;
              border-radius: 8px;
              background: color-mix(in oklab, var(--cap-accent) 12%, transparent);
              color: var(--cap-accent);
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .lm-bidiq-cap-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .lm-bidiq-cap-title {
              font-size: 12.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
            }
            .lm-bidiq-cap-text {
              font-size: 11.5px;
              color: var(--text-slate-500);
              line-height: 1.45;
            }

            .lm-bidiq-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              padding: 18px 24px 22px;
              margin-top: 18px;
              border-top: 1px solid var(--border-slate-100);
              flex-wrap: wrap;
            }
            .lm-bidiq-footnote {
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }
            .lm-bidiq-footnote svg { color: #10b981; }
            .lm-bidiq-footer-actions { display: flex; gap: 8px; }
            .lm-bidiq-cancel.ant-btn {
              height: 36px !important;
              border-radius: 9px !important;
              font-weight: 600 !important;
              padding: 0 14px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
            }
            .lm-bidiq-cancel.ant-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }
            .lm-bidiq-launch.ant-btn {
              height: 36px !important;
              border-radius: 9px !important;
              font-weight: 700 !important;
              padding: 0 16px !important;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              border: 0 !important;
              color: #fff !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .lm-bidiq-launch.ant-btn:hover {
              filter: brightness(1.05);
            }

            [data-theme='dark'] .lm-bidiq-modal .ant-modal-content {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-bidiq-snapshot,
            [data-theme='dark'] .lm-bidiq-cap,
            [data-theme='dark'] .lm-bidiq-close,
            [data-theme='dark'] .lm-bidiq-cancel.ant-btn {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-100) !important;
            }

            /* ---------- Dark theme overrides for new lm-* ---------- */
            [data-theme='dark'] .lm-stat-card {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .lm-search-input.ant-input-affix-wrapper {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-secondary-btn {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-section-divider-label {
              background: var(--bg-primary);
            }

            .premium-table .ant-table { background: transparent; }
            .premium-table .ant-table-thead > tr > th { 
              background: #f8fafc; 
              color: #64748b; 
              font-weight: 700; 
              font-size: 11px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              border-bottom: 1px solid #f1f5f9;
              padding: 16px 20px;
            }
            .premium-table .ant-table-tbody > tr > td { 
              padding: 16px 20px; 
              border-bottom: 1px solid #f8fafc;
              transition: all 0.2s ease;
            }
            .premium-table .ant-table-tbody > tr:hover > td { 
              background: #fdfdff !important; 
            }
            .premium-table .ant-table-tbody > tr:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            }
            
            .status-select-premium .ant-select-selector, .action-select-premium .ant-select-selector {
              padding: 0 !important;
              height: auto !important;
            }
            
            .premium-pagination .ant-pagination-item-active {
              border-color: #6366f1;
            }
            .premium-pagination .ant-pagination-item-active a {
              color: #6366f1;
            }
            
            .action-btn:hover {
              background: #f1f5f9 !important;
              color: #6366f1 !important;
            }
            
            .leads-table-container {
              animation: slideUp 0.4s ease-out;
            }

            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }

            .stat-card-premium {
              transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
            }
            .stat-card-premium:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.04) !important;
              border-color: #e2e8f0 !important;
            }

            .lead-segment-btn {
              outline: none;
            }
            .lead-segment-btn:hover:not(.is-active) {
              background: #f8fafc !important;
              border-color: #cbd5e1 !important;
              color: #1e293b !important;
            }
            .lead-segment-btn.is-active {
              box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
            }

            .lead-filter-chip button:hover {
              background: rgba(99, 102, 241, 0.25) !important;
            }

            .lead-avatar {
              transition: transform 0.18s ease;
            }
            .premium-table .ant-table-tbody > tr:hover .lead-avatar {
              transform: scale(1.05);
            }

            .sk-shimmer {
              background: linear-gradient(90deg, #f1f5f9 0%, #f8fafc 50%, #f1f5f9 100%);
              background-size: 200% 100%;
              animation: skShimmer 1.4s ease-in-out infinite;
            }
            @keyframes skShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }

            /* LEAD DRAWER ENHANCEMENTS */
            .lead-drawer .ant-drawer-header { padding: 0 !important; }
            .lead-drawer .ant-drawer-header-title { padding: 16px 24px; }
            .lead-drawer .ant-drawer-close {
              border-radius: 8px;
              transition: background 0.15s ease;
            }
            .lead-drawer .ant-drawer-close:hover {
              background: #f1f5f9;
            }

            .lead-section-card {
              background: var(--bg-pure-white);
              transition: border-color 0.18s ease, box-shadow 0.18s ease;
            }
            .lead-section-card:hover {
              border-color: #e2e8f0 !important;
              box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);
            }

            .lead-drawer-form .ant-form-item-label > label {
              font-weight: 700 !important;
              text-transform: none;
              letter-spacing: 0;
            }

            .lead-drawer-form .ant-input,
            .lead-drawer-form .ant-input-number,
            .lead-drawer-form .ant-input-number-input,
            .lead-drawer-form .ant-input-affix-wrapper,
            .lead-drawer-form .ant-select-selector,
            .lead-drawer-form .ant-picker {
              border-radius: 10px !important;
              border: 1px solid #e2e8f0 !important;
              transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
            }
            .lead-drawer-form .ant-input:hover,
            .lead-drawer-form .ant-input-number:hover,
            .lead-drawer-form .ant-input-affix-wrapper:hover,
            .lead-drawer-form .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
            .lead-drawer-form .ant-picker:hover {
              border-color: #c7d2fe !important;
            }
            .lead-drawer-form .ant-input:focus,
            .lead-drawer-form .ant-input-number-focused,
            .lead-drawer-form .ant-input-affix-wrapper-focused,
            .lead-drawer-form .ant-select-focused .ant-select-selector,
            .lead-drawer-form .ant-picker-focused {
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
            }

            .lead-ai-textarea:focus,
            .lead-ai-textarea.ant-input-focused {
              background: #fff !important;
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
            }

            .lead-drawer-form .ant-select-selection-item {
              font-weight: 600;
            }

            .lead-drawer-form .ant-select-selection-overflow .ant-select-selection-item {
              background: rgba(99, 102, 241, 0.08) !important;
              color: #4f46e5 !important;
              border: 1px solid rgba(99, 102, 241, 0.2) !important;
              border-radius: 999px !important;
              padding: 0 10px !important;
              font-weight: 700;
              font-size: 11px;
            }

            .lead-drawer-submit:hover {
              transform: translateY(-1px);
              box-shadow: 0 10px 24px -6px rgba(99, 102, 241, 0.55) !important;
            }
            .lead-drawer-submit {
              transition: transform 0.18s ease, box-shadow 0.18s ease;
            }

            /* DARK DRAWER ENHANCEMENTS */
            [data-theme='dark'] .lead-drawer .ant-drawer-close:hover { background: #1c2128 !important; }
            [data-theme='dark'] .lead-section-card { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .lead-section-card:hover { border-color: #3d444d !important; }
            [data-theme='dark'] .lead-drawer-form .ant-input,
            [data-theme='dark'] .lead-drawer-form .ant-input-number,
            [data-theme='dark'] .lead-drawer-form .ant-input-number-input,
            [data-theme='dark'] .lead-drawer-form .ant-input-affix-wrapper,
            [data-theme='dark'] .lead-drawer-form .ant-select-selector,
            [data-theme='dark'] .lead-drawer-form .ant-picker {
              background: #0d1117 !important;
              border-color: #30363d !important;
              color: #c9d1d9 !important;
            }
            [data-theme='dark'] .lead-drawer-form .ant-input:hover,
            [data-theme='dark'] .lead-drawer-form .ant-input-affix-wrapper:hover,
            [data-theme='dark'] .lead-drawer-form .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
            [data-theme='dark'] .lead-drawer-form .ant-picker:hover {
              border-color: rgba(99, 102, 241, 0.4) !important;
            }

            /* DARK SEGMENT/CHIP/SKELETON */
            [data-theme='dark'] .lead-segment-btn { background: #161b22 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
            [data-theme='dark'] .lead-segment-btn:hover:not(.is-active) { background: #1c2128 !important; border-color: #3d444d !important; color: #f0f6fc !important; }
            [data-theme='dark'] .lead-filter-chip { background: rgba(99, 102, 241, 0.15) !important; border-color: rgba(99, 102, 241, 0.3) !important; color: #a5b4fc !important; }
            [data-theme='dark'] .sk-shimmer { background: linear-gradient(90deg, #161b22 0%, #21262d 50%, #161b22 100%); background-size: 200% 100%; }

            /* DARK THEME OVERRIDES */
            [data-theme='dark'] .leads-page-wrapper { background: #0d1117 !important; }
            [data-theme='dark'] .premium-table .ant-table-thead > tr > th { 
              background: #161b22 !important; 
              color: #8b949e !important; 
              border-bottom-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-table .ant-table-tbody > tr > td { 
              border-bottom-color: #21262d !important; 
              color: #c9d1d9 !important;
            }
            [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td { 
              background: #1c2128 !important; 
            }
            [data-theme='dark'] .stat-card-premium { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .leads-table-container { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .leads-filter-card { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .hub-divider-premium { 
              border-top-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-title { color: #f0f6fc !important; }
            [data-theme='dark'] .premium-text-sec { color: #8b949e !important; }
            [data-theme='dark'] .premium-input-search { 
              background: #0d1117 !important; 
              border-color: #30363d !important; 
              color: #c9d1d9 !important; 
            }

            /* DARK DRAWER OVERRIDES */
            [data-theme='dark'] .premium-drawer .ant-drawer-content { background: #161b22 !important; }
            [data-theme='dark'] .premium-drawer .ant-drawer-header { 
              background: #161b22 !important; 
              border-bottom-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer .ant-drawer-footer { 
              background: #0d1117 !important; 
              border-top-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer-section { 
              background: #0d1117 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer-section-alt { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-form-label { color: #8b949e !important; }
            [data-theme='dark'] .premium-section-title { color: #f0f6fc !important; }
            [data-theme='dark'] .premium-btn-cancel { 
              background: #21262d !important; 
              border-color: #30363d !important; 
              color: #c9d1d9 !important; 
            }
            [data-theme='dark'] .premium-drawer .ant-select-selector,
            [data-theme='dark'] .premium-drawer .ant-input,
            [data-theme='dark'] .premium-drawer .ant-input-number,
            [data-theme='dark'] .premium-drawer .ant-picker {
              background: #0d1117 !important;
              border-color: #30363d !important;
              color: #c9d1d9 !important;
            }

            /* Autofill fix for dark mode */
            [data-theme='dark'] .premium-drawer .ant-input:-webkit-autofill,
            [data-theme='dark'] .premium-drawer .ant-input:-webkit-autofill:hover,
            [data-theme='dark'] .premium-drawer .ant-input:-webkit-autofill:focus,
            [data-theme='dark'] .premium-drawer input:-webkit-autofill,
            [data-theme='dark'] .premium-drawer input:-webkit-autofill:hover,
            [data-theme='dark'] .premium-drawer input:-webkit-autofill:focus,
            [data-theme='dark'] .premium-drawer textarea:-webkit-autofill,
            [data-theme='dark'] .premium-drawer textarea:-webkit-autofill:hover,
            [data-theme='dark'] .premium-drawer textarea:-webkit-autofill:focus,
            [data-theme='dark'] .premium-drawer select:-webkit-autofill,
            [data-theme='dark'] .premium-drawer select:-webkit-autofill:hover,
            [data-theme='dark'] .premium-drawer select:-webkit-autofill:focus {
              -webkit-text-fill-color: #c9d1d9 !important;
              -webkit-box-shadow: 0 0 0px 1000px #0d1117 inset !important;
              transition: background-color 5000s ease-in-out 0s;
            }

            /* Supporting Documents Section */
            .doc-row-container {
              margin-bottom: 16px;
              padding: 16px;
              background: #fff;
              border-radius: 16px;
              border: 1px solid #eef2f6;
              box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .doc-type-segmented.ant-segmented {
              background: var(--bg-slate-50) !important;
              padding: 3px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              transition: all 0.2s ease;
            }
            .doc-type-segmented .ant-segmented-item {
              border-radius: 7px !important;
              transition: all 0.2s ease !important;
            }
            .doc-type-segmented .ant-segmented-item-label {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 6px !important;
              padding: 0 16px !important;
              min-height: 28px !important;
              font-weight: 700 !important;
              font-size: 11px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.03em !important;
              color: var(--text-slate-500) !important;
            }
            .doc-type-segmented .ant-segmented-item-selected {
              background: #fff !important;
              box-shadow: 0 2px 8px -2px rgba(99, 102, 241, 0.15) !important;
            }
            .doc-type-segmented .ant-segmented-item-selected .ant-segmented-item-label {
              color: #6366f1 !important;
            }
            .doc-type-segmented .ant-segmented-thumb {
              border-radius: 7px !important;
              background: #fff !important;
              box-shadow: 0 2px 8px -2px rgba(99, 102, 241, 0.15) !important;
            }
            .doc-upload-area {
              border: 1px dashed #cbd5e1;
              border-radius: 12px;
              padding: 16px;
              background: #f8fafc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 120px;
              position: relative;
              transition: all 0.3s ease;
            }
            .doc-upload-area:hover {
              border-color: #6366f1;
              background: rgba(99, 102, 241, 0.02);
            }
            .doc-file-icon-box {
              width: 48px;
              height: 48px;
              border-radius: 10px;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 12px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .doc-file-name {
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 12px;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .doc-action-btn {
              border-radius: 6px !important;
            }
            .doc-change-label {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
              cursor: pointer;
              color: #64748b;
              background: #fff;
              transition: all 0.2s ease;
            }
            .doc-change-label:hover {
              border-color: #6366f1;
              color: #6366f1;
            }
            .doc-upload-label {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              width: 100%;
              height: 100%;
            }
            .doc-upload-icon-circle {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: rgba(99, 102, 241, 0.08);
              color: #6366f1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 10px;
            }
            .doc-upload-text {
              text-align: center;
            }
            .doc-upload-primary {
              display: block;
              font-size: 13px;
              font-weight: 700;
              color: #475569;
              margin-bottom: 2px;
            }
            .doc-upload-secondary {
              display: block;
              font-size: 11px;
              color: #94a3b8;
            }
            .doc-remove-btn {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 36px !important;
              height: 36px !important;
              border-radius: 8px !important;
            }
            .doc-add-btn {
              margin-top: 4px !important;
              border-radius: 12px !important;
              height: 44px !important;
              color: #6366f1 !important;
              border-color: #e0e7ff !important;
              background: #f8faff !important;
              font-weight: 600 !important;
              font-size: 14px !important;
              transition: all 0.2s ease !important;
            }
            .doc-add-btn:hover {
              color: #4f46e5 !important;
              background: #f0f4ff !important;
              border-color: #c7d2fe !important;
              transform: translateY(-1px);
            }

            .premium-input {
              border-radius: 10px !important;
              border: 1px solid #e2e8f0 !important;
            }

            /* Dark mode for Supporting Documents */
            [data-theme='dark'] .doc-row-container {
              background: #161b22;
              border-color: #30363d;
            }
            [data-theme='dark'] .doc-type-segmented.ant-segmented {
              background: #0d1117 !important;
              border-color: #30363d !important;
            }
            [data-theme='dark'] .doc-type-segmented .ant-segmented-item-selected,
            [data-theme='dark'] .doc-type-segmented .ant-segmented-thumb {
              background: #1c2128 !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
            }
            [data-theme='dark'] .doc-type-segmented .ant-segmented-item-selected .ant-segmented-item-label {
              color: #a5b4fc !important;
            }
            [data-theme='dark'] .doc-type-segmented .ant-segmented-item-label {
              color: #8b949e !important;
            }
            [data-theme='dark'] .doc-upload-area {
              border-color: #30363d;
              background: #0d1117;
            }
            [data-theme='dark'] .doc-upload-area:hover {
              border-color: #6366f1;
              background: rgba(99, 102, 241, 0.05);
            }
            [data-theme='dark'] .doc-file-icon-box {
              background: #1c2128;
            }
            [data-theme='dark'] .doc-file-name {
              color: #f0f6fc;
            }
            [data-theme='dark'] .doc-change-label {
              background: #161b22;
              border-color: #30363d;
              color: #8b949e;
            }
            [data-theme='dark'] .doc-change-label:hover {
              border-color: #6366f1;
              color: #a5b4fc;
            }
            [data-theme='dark'] .doc-upload-primary {
              color: #c9d1d9;
            }
            [data-theme='dark'] .doc-upload-secondary {
              color: #6e7681;
            }
            [data-theme='dark'] .doc-add-btn {
              background: rgba(99, 102, 241, 0.05) !important;
              border-color: rgba(99, 102, 241, 0.2) !important;
              color: #a5b4fc !important;
            }
            [data-theme='dark'] .doc-add-btn:hover {
              background: rgba(99, 102, 241, 0.1) !important;
              border-color: rgba(99, 102, 241, 0.3) !important;
            }
             [data-theme='dark'] .premium-input {
              background: #0d1117 !important;
              border-color: #30363d !important;
              color: #c9d1d9 !important;
            }

            @media (max-width: 820px) {
              .lm-shell {
                flex-direction: column;
              }
              .lm-sidebar {
                position: sticky;
                top: 0;
                z-index: 90;
                height: auto;
                max-height: none;
                border-right: 0;
                border-bottom: 1px solid var(--border-slate-200);
                display: flex;
                flex-direction: column;
                align-items: stretch;
                padding: 10px 16px;
                background: var(--bg-pure-white);
                overflow: hidden;
                width: 100%;
                box-sizing: border-box;
              }
              .lm-sidebar-top {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0;
                border-bottom: 0;
              }
              .lm-side-head {
                margin-bottom: 0;
              }
              .lm-create-btn {
                margin-bottom: 0;
              }
              .lm-side-scroll {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 8px;
                padding: 10px 0 0 0;
                margin-top: 10px;
                border-top: 1px solid var(--border-slate-100);
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                width: 100%;
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .lm-side-scroll::-webkit-scrollbar {
                display: none;
              }
              .lm-side-section + .lm-side-section {
                border-top: 1px solid var(--border-slate-100) !important;
                padding-top: 10px !important;
                margin-top: 4px !important;
                width: 100%;
              }
              .lm-side-section::-webkit-scrollbar {
                display: none;
              }
              .lm-side-section-label {
                display: none;
              }
              .lm-side-list {
                display: flex;
                flex-direction: row;
                gap: 6px;
              }
              .lm-view-item {
                width: auto !important;
                flex-shrink: 0;
                margin: 0 !important;
                height: 32px;
                padding: 0 10px;
                border-radius: 6px;
              }
              .lm-main {
                padding: 10px 16px 16px 16px;
              }
              .lm-topbar {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
              }
              .lm-topbar-actions {
                width: 100%;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
              }
              .lm-search-input.ant-input-affix-wrapper {
                width: 100% !important;
              }
            }

            @media (max-width: 640px) {
              .lm-grid {
                grid-template-columns: 1fr;
              }
            }

            .lm-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              margin-bottom: 24px;
            }
            .lm-card {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              border-radius: 0px;
              padding: 12px 14px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .lm-card:hover {
              box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
              border-color: #cbd5e1;
            }
            .lm-card-head {
              display: flex;
              align-items: flex-start;
              gap: 12px;
            }
            .lm-card-avatar {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 14px;
              flex-shrink: 0;
            }
            .lm-card-title-group {
              flex: 1;
              min-width: 0;
              display: flex;
              flex-direction: column;
            }
            .lm-card-title {
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              color: var(--text-slate-900);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .lm-card-subtitle {
              font-size: 11.5px;
              color: var(--text-slate-500);
            }
            .lm-card-actions {
              margin-left: auto;
              margin-top: -4px;
              margin-right: -4px;
            }
            .lm-card-body {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .lm-card-row {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12.5px;
              color: var(--text-slate-600);
            }
            .lm-card-text {
              flex: 1;
              min-width: 0;
            }
            .lm-card-details {
              display: flex;
              flex-direction: column;
              gap: 0;
            }
            .lm-card-detail-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 7px 0;
              border-bottom: 1px solid var(--border-slate-50);
            }
            .lm-card-detail-row:last-child {
              border-bottom: none;
            }
            .lm-card-detail-label {
              font-size: 11.5px;
              font-weight: 600;
              color: var(--text-slate-400);
              text-transform: uppercase;
              letter-spacing: 0.04em;
              flex-shrink: 0;
              min-width: 60px;
            }
            .lm-card-footer {
              margin-top: auto;
              padding-top: 12px;
              border-top: 1px solid var(--border-slate-100);
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }
            .lm-card-action-btns {
              display: flex;
              align-items: center;
              gap: 4px;
              flex-wrap: wrap;
            }
            .lm-card-action-btn {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 4px 10px;
              border-radius: 6px;
              border: 1px solid var(--border-slate-200);
              background: var(--bg-pure-white);
              font-size: 11.5px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s ease;
              white-space: nowrap;
            }
            .lm-card-action-btn:hover {
              background: var(--bg-slate-50);
              border-color: currentColor;
            }
            .lm-card-tags {
              display: flex;
              align-items: center;
              gap: 6px;
              flex-wrap: wrap;
            }
            .lm-card-date {
              font-size: 11px;
              color: var(--text-slate-400);
              font-weight: 500;
              white-space: nowrap;
            }
            .lm-grid-pagination {
              display: flex;
              justify-content: flex-end;
              margin-top: 24px;
            }
            .lm-segmented {
              display: flex;
              align-items: center;
              background: var(--bg-slate-50);
              padding: 4px;
              border-radius: 8px;
              border: 1px solid var(--border-slate-200);
              gap: 4px;
            }
            .lm-segmented button {
              background: transparent;
              border: none;
              border-radius: 6px;
              padding: 4px 10px;
              color: var(--text-slate-500);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            }
            .lm-segmented button:hover {
              color: var(--text-slate-800);
            }
            .lm-segmented button.is-active {
              background: var(--bg-pure-white);
              color: #6366f1;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              font-weight: 600;
            }

            /* ===================== Pre-flight Proposal Info Modal ===================== */
            .biq-pinfo-modal .ant-modal-content {
              padding: 0 !important;
              border-radius: 16px !important;
              border: 1px solid var(--border-slate-100);
              overflow: hidden;
              background: var(--bg-pure-white);
              box-shadow: none !important;
            }
            .biq-pinfo-modal .ant-modal-body { padding: 0 !important; }

            .biq-pinfo-content { display: flex; flex-direction: column; }

            .biq-pinfo-head {
              display: flex; align-items: flex-start;
              gap: 14px;
              padding: 22px 24px 18px;
              position: relative;
              border-bottom: 1px solid var(--border-slate-100);
            }
            .biq-pinfo-icon {
              width: 44px; height: 44px;
              border-radius: 12px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: #fff;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .biq-pinfo-head-text { flex: 1; min-width: 0; padding-right: 40px; }
            .biq-pinfo-eyebrow {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 3px 8px;
              border-radius: 999px;
              background: rgba(99, 102, 241, 0.08);
              color: #4f46e5;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              border: 1px solid rgba(99, 102, 241, 0.2);
              margin-bottom: 8px;
            }
            .biq-pinfo-title {
              margin: 0 0 4px;
              font-size: 18px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.015em;
            }
            .biq-pinfo-sub {
              margin: 0;
              font-size: 12.5px;
              color: var(--text-slate-500);
              line-height: 1.5;
            }
            .biq-pinfo-close {
              position: absolute;
              top: 16px; right: 16px;
              width: 30px; height: 30px;
              border-radius: 8px;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              color: var(--text-slate-500);
              cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              transition: color .15s ease, border-color .15s ease;
            }
            .biq-pinfo-close:hover {
              color: var(--text-slate-900);
              border-color: var(--border-slate-200);
            }
            .biq-pinfo-close:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            /* Step indicator */
            .biq-pinfo-steps {
              display: flex; align-items: center; gap: 8px;
              margin-top: 10px;
            }
            .biq-pinfo-step {
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-400);
              letter-spacing: 0.02em;
              transition: color .15s ease;
            }
            .biq-pinfo-step-dot {
              width: 18px; height: 18px;
              border-radius: 999px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              color: var(--text-slate-500);
              display: inline-flex; align-items: center; justify-content: center;
              font-size: 10px;
              font-weight: 800;
              line-height: 1;
            }
            .biq-pinfo-step.is-active { color: var(--text-slate-900); }
            .biq-pinfo-step.is-active .biq-pinfo-step-dot {
              background: #4f46e5;
              border-color: #4f46e5;
              color: #fff;
            }
            .biq-pinfo-step.is-done { color: #047857; }
            .biq-pinfo-step.is-done .biq-pinfo-step-dot {
              background: rgba(16, 185, 129, 0.12);
              border-color: rgba(16, 185, 129, 0.25);
              color: #047857;
            }
            .biq-pinfo-step-sep {
              width: 28px;
              height: 1px;
              background: var(--border-slate-100);
            }

            /* Options slot inside the shell */
            .biq-pinfo-options {
              padding: 18px 24px 0;
            }
            .biq-pinfo-options .biq-pinfo-caps-head {
              margin-bottom: 12px;
            }
            .biq-pinfo-options .biq-opt-note {
              margin-top: 12px;
            }

            .biq-pinfo-snapshot {
              margin: 18px 24px 0;
              padding: 14px 16px;
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              background: var(--bg-slate-50);
            }
            .biq-pinfo-snapshot-head {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              margin-bottom: 8px;
            }
            .biq-pinfo-snapshot-title {
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              margin-bottom: 12px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .biq-pinfo-snapshot-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px 14px;
            }
            @media (max-width: 560px) {
              .biq-pinfo-snapshot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            .biq-pinfo-snapshot-item {
              display: flex; flex-direction: column; gap: 3px;
              min-width: 0;
            }
            .biq-pinfo-snapshot-label {
              display: inline-flex; align-items: center; gap: 4px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--text-slate-500);
            }
            .biq-pinfo-snapshot-value {
              font-size: 13px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .biq-pinfo-caps { padding: 18px 24px 0; }
            .biq-pinfo-caps-head {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              margin-bottom: 12px;
            }
            .biq-pinfo-caps-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            @media (max-width: 560px) {
              .biq-pinfo-caps-grid { grid-template-columns: 1fr; }
            }
            .biq-pinfo-cap {
              display: flex; align-items: flex-start; gap: 10px;
              padding: 12px 14px;
              border: 1px solid var(--border-slate-100);
              border-radius: 11px;
              background: var(--bg-pure-white);
              transition: border-color .15s ease;
            }
            .biq-pinfo-cap:hover {
              border-color: color-mix(in oklab, var(--cap-accent) 30%, var(--border-slate-100));
            }
            .biq-pinfo-cap-icon {
              width: 28px; height: 28px;
              border-radius: 8px;
              background: color-mix(in oklab, var(--cap-accent) 12%, transparent);
              color: var(--cap-accent);
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .biq-pinfo-cap-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .biq-pinfo-cap-title {
              font-size: 12.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
            }
            .biq-pinfo-cap-text {
              font-size: 11.5px;
              color: var(--text-slate-500);
              line-height: 1.45;
            }

            .biq-pinfo-footer {
              display: flex; align-items: center; justify-content: space-between;
              gap: 10px;
              padding: 18px 24px 22px;
              margin-top: 18px;
              border-top: 1px solid var(--border-slate-100);
              flex-wrap: wrap;
            }
            .biq-pinfo-footnote {
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }
            .biq-pinfo-footnote svg { color: #10b981; }
            .biq-pinfo-footer-actions { display: flex; gap: 8px; }

            .biq-opt-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
            }
            @media (max-width: 640px) {
              .biq-opt-grid { grid-template-columns: 1fr; }
            }
            .biq-opt-card {
              position: relative;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              padding: 14px;
              text-align: left;
              cursor: pointer;
              transition: border-color .15s ease, background .15s ease;
              font-family: inherit;
              display: flex; flex-direction: column; gap: 10px;
            }
            .biq-opt-card:hover {
              border-color: rgba(99, 102, 241, 0.35);
            }
            .biq-opt-card.is-selected {
              border-color: #6366f1;
              background: rgba(99, 102, 241, 0.04);
            }
            .biq-opt-card-head {
              display: flex; align-items: center; justify-content: space-between;
            }
            .biq-opt-tag {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 3px 9px;
              border-radius: 999px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              border: 1px solid;
            }
            .biq-opt-tag-client {
              background: rgba(14, 165, 233, 0.08);
              color: #0369a1;
              border-color: rgba(14, 165, 233, 0.22);
            }
            .biq-opt-tag-custom {
              background: rgba(139, 92, 246, 0.08);
              color: #6d28d9;
              border-color: rgba(139, 92, 246, 0.22);
            }
            .biq-opt-check { color: #4f46e5; }
            .biq-opt-name {
              font-size: 14px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
            }
            .biq-opt-rows {
              display: flex; flex-direction: column; gap: 6px;
              padding: 10px 12px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              border-radius: 10px;
            }
            .biq-opt-row {
              display: flex; justify-content: space-between; align-items: center;
              font-size: 12.5px;
            }
            .biq-opt-row-l {
              display: inline-flex; align-items: center; gap: 4px;
              color: var(--text-slate-500);
              font-weight: 600;
            }
            .biq-opt-row-v {
              color: var(--text-slate-900);
              font-weight: 700;
            }
            .biq-opt-fields { display: flex; flex-direction: column; gap: 10px; }
            .biq-opt-field { display: flex; flex-direction: column; gap: 5px; }
            .biq-opt-field label {
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-500);
              letter-spacing: 0.02em;
            }
            .biq-opt-hint {
              font-size: 11px;
              color: var(--text-slate-500);
              margin-top: 2px;
            }
            .biq-opt-foot {
              font-size: 11.5px;
              color: var(--text-slate-500);
            }
            .biq-opt-note {
              display: flex; align-items: flex-start; gap: 8px;
              padding: 11px 13px;
              margin-top: 14px;
              background: rgba(99, 102, 241, 0.06);
              border: 1px solid rgba(99, 102, 241, 0.2);
              border-radius: 11px;
              color: var(--text-slate-700);
              font-size: 12px;
              line-height: 1.5;
            }
            .biq-opt-note svg { color: #4f46e5; margin-top: 3px; flex-shrink: 0; }
            .biq-opt-note b { color: var(--text-slate-900); font-weight: 700; }

            .biq-modal-footer {
              display: flex; justify-content: flex-end;
              gap: 8px;
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid var(--border-slate-100);
            }

            [data-theme='dark'] .biq-pinfo-modal .ant-modal-content,
            [data-theme='dark'] .biq-opt-card,
            [data-theme='dark'] .biq-pinfo-cap,
            [data-theme='dark'] .biq-pinfo-close {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .biq-pinfo-snapshot {
              background: var(--bg-primary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .biq-opt-rows {
              background: var(--bg-primary);
              border-color: var(--border-slate-100);
            }
          `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
