'use client';

import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Tag,
  Space,
  Spin,
  message,
  Empty,
  Row,
  Col,
  Table,
  Descriptions,
  Divider,
  Dropdown,
  Drawer
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SnippetsOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  UserOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { ProposalService } from "@/services/proposalService";
import MainLayout from "@/components/layout/MainLayout";
import dayjs from "dayjs";
import TiptapViewer from '@/components/common/TiptapViewer';

const { Title, Text } = Typography;

const STATUS_META: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  draft:    { label: 'Draft',    color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)' },
  sent:     { label: 'Sent',     color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  ring: 'rgba(59,130,246,0.25)' },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.10)',  ring: 'rgba(16,185,129,0.25)' },
  declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   ring: 'rgba(239,68,68,0.25)'  },
};

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const handleExport = async (format: 'pdf' | 'word') => {
    const key = 'exporting';
    try {
      messageApi.open({ key, type: 'loading', content: `Asking server to prepare ${format.toUpperCase()}...`, duration: 0 });

      const response = await ProposalService.requestProposalExport(params.id as string);
      const resData = response?.data?.data || response?.data || response;
      const { pdfUrl, docxUrl } = resData || {};

      const fileUrl = format === 'pdf' ? pdfUrl : docxUrl;

      if (!fileUrl) throw new Error("Server didn't return a file URL");

      // Open in new tab or trigger download
      if (format === 'pdf') {
        window.open(fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', proposal.title || 'Proposal');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      messageApi.open({ key, type: 'success', content: 'Export complete!', duration: 3 });
    } catch (err: any) {
      console.error("Export Failed:", err);
      messageApi.open({ key, type: 'error', content: `Export Failed: ${err.message}` });
    }
  };

  const fetchProposalDetails = async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      const data = await ProposalService.getProposalById(params.id as string);
      setProposal(data.data || data); // Handle both wrapped and unwrapped data
    } catch (err) {
      console.error(err);
      message.error("Error fetching proposal details");
      router.push("/proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposalDetails();
  }, [params.id]);

  // Scroll-based section highlighting using Intersection Observer
  useEffect(() => {
    const sections = document.querySelectorAll('[id^="scroll-section-"]');
    if (sections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -50% 0px', // More conservative margins
      threshold: [0, 0.1, 0.5] // Multiple thresholds for better detection
    };

    const observer = new IntersectionObserver((entries) => {
      // Find the most intersecting section
      let mostIntersectingEntry = null;
      let maxRatio = 0;

      for (const entry of entries) {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostIntersectingEntry = entry;
        }
      }

      if (mostIntersectingEntry && mostIntersectingEntry.intersectionRatio > 0.1) {
        const sectionId = mostIntersectingEntry.target.id.replace('scroll-section-', '');
        setActiveSection(sectionId);
      }
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [proposal]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-pure-white)' }}>
        <Spin size="large" tip="Loading proposal..." />
      </div>
    );
  }

  if (!proposal) return null;

  // Handle building the tabs from blocks_data
  let rawBlocks = [];
  try {
    rawBlocks = typeof proposal.blocks_data === 'string'
      ? JSON.parse(proposal.blocks_data)
      : proposal.blocks_data || [];
  } catch (e) {
    console.error('Failed to parse blocks data:', e);
  }

  // Strictly enforce the requested order
  const TYPE_ORDER: Record<string, number> = {
    'cover': 1,
    'text': 2,
    'scope': 3,
    'timeline': 4,
    'pricing': 5,
    'signature': 6,
    'section': 7
  };

  const blocks = [...rawBlocks].sort((a, b) => (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99));

  const getBlockTitle = (b: any) => {
    if (b.type === 'cover') return 'Cover';

    const data = b.data || {};
    const customTitle = b.title || data.title || data.heading;
    if (customTitle) return customTitle;

    switch (b.type) {
      case 'timeline': return 'Timeline and Schedule';
      case 'pricing': return 'Pricing';
      case 'text': return 'Summary';
      case 'scope': return 'Scope of Work';
      case 'signature': return 'Agreement & Sign-off';
      case 'section': return 'Additional Details';
      default: return b.type;
    }
  };

  const hasValue = (val: any) => {
    if (val === null || val === undefined) return false;
    const str = val.toString().trim();
    return str.length > 0 && str !== '<p></p>' && str !== '<p><br></p>';
  };

  const isBlockEmpty = (block: any) => {
    const data = block.data || {};

    switch (block.type) {
      case 'cover': return false;
      case 'text':
      case 'section':
        return !(hasValue(data.content) || hasValue(data.text) || hasValue(data.heading));
      case 'scope':
        const milestones = (data.milestones || []).filter((m: any) =>
          hasValue(m.title) || hasValue(m.deliverables) || hasValue(m.tasks)
        );
        const terms = (data.terms || []).filter((t: any) =>
          hasValue(t.title) || hasValue(t.description)
        );
        return milestones.length === 0 && terms.length === 0;
      case 'timeline':
        return (data.phases || []).filter((p: any) => hasValue(p.title)).length === 0;
      case 'pricing':
        return (data.items || []).filter((item: any) => hasValue(item.name) || (Number(item.price) > 0)).length === 0;
      case 'signature':
        return !(hasValue(data.ipClause) || hasValue(data.revisionClause) || hasValue(data.terminationClause) || hasValue(data.ndaClause) || hasValue(data.companyName) || hasValue(data.clientName) || hasValue(data.companySigner) || hasValue(data.signatoryName));
      default:
        return false;
    }
  };

  const renderBlockContent = (block: any, isPreview: boolean = false) => {
    const data = block.data || {};

    switch (block.type) {
      case 'text':
        if (!hasValue(data.content) && !hasValue(data.text)) return null;
        return (
          <div style={{ padding: isPreview ? '0' : '24px', background: isPreview ? 'transparent' : 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
            <TiptapViewer content={data.content || data.text || ''} />
          </div>
        );

      case 'pricing': {
        const pricingItems = (data.items || []).filter((item: any) => hasValue(item.name) || (Number(item.price) > 0));
        if (pricingItems.length === 0) return null;

        const subtotal = pricingItems.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
        const discountAmount = data.discount || 0;
        const discountedSubtotal = Math.max(0, subtotal - discountAmount);
        const tax = discountedSubtotal * ((data.taxRate || 0) / 100);
        const total = discountedSubtotal + tax;
        const currency = data.currency === 'USD' ? '$' : (data.currency || '$');

        return (
          <div style={{ marginTop: 20 }}>
            <Table
              dataSource={pricingItems}
              pagination={false}
              rowKey="id"
              bordered={false}
              size="middle"
              className="preview-pricing-table"
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text: string, record: any) => (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{text}</div>
                      {record.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.description}</div>}
                    </div>
                  )
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 60,
                  align: 'center',
                  render: (val) => <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
                },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  key: 'price',
                  width: 100,
                  align: 'right',
                  render: (val) => <span style={{ color: 'var(--text-secondary)' }}>{currency}{Number(val).toLocaleString()}</span>
                },
                {
                  title: 'Total',
                  key: 'total',
                  width: 100,
                  align: 'right',
                  render: (_, record: any) => (
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {currency}{(Number(record.price || 0) * Number(record.quantity || 1)).toLocaleString()}
                    </span>
                  )
                }
              ]}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <div style={{ width: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Subtotal</Text>
                  <Text style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{currency}{subtotal.toLocaleString()}</Text>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#10b981' }}>
                    <Text style={{ color: 'inherit', fontSize: '13px' }}>Discount</Text>
                    <Text style={{ color: 'inherit', fontSize: '13px' }}>-{currency}{discountAmount.toLocaleString()}</Text>
                  </div>
                )}
                {(data.taxRate || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tax ({data.taxRate}%)</Text>
                    <Text style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{currency}{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </div>
                )}
                <Divider style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <Text strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Total Investment</Text>
                  <Text strong style={{ fontSize: '1.1rem', color: 'var(--premium-blue)' }}>
                    {currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </div>
              </div>
            </div>

            <style jsx global>{`
              .preview-pricing-table .ant-table {
                background: transparent !important;
              }
              .preview-pricing-table .ant-table-thead > tr > th {
                background: rgba(0, 0, 0, 0.02) !important;
                border-bottom: 1px solid var(--border-color) !important;
                font-size: 11px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                padding: 12px 16px !important;
              }
              [data-theme='dark'] .preview-pricing-table .ant-table-thead > tr > th {
                background: rgba(255, 255, 255, 0.03) !important;
              }
              .preview-pricing-table .ant-table-tbody > tr > td {
                border-bottom: 1px solid var(--border-color) !important;
                padding: 12px 16px !important;
              }
            `}</style>
          </div>
        );
      }

      case 'signature':
        return (
          <div style={{ padding: isPreview ? 0 : '24px', background: isPreview ? 'transparent' : 'var(--bg-secondary)', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
            {/* Extended Legal Clauses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '48px' }}>
              {hasValue(data.ipClause) && (
                <div>
                  <Title level={5} style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px' }}>Intellectual Property (IP)</Title>
                  <TiptapViewer content={data.ipClause} />
                </div>
              )}
              {hasValue(data.revisionClause) && (
                <div>
                  <Title level={5} style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px' }}>Revision Policy</Title>
                  <TiptapViewer content={data.revisionClause} />
                </div>
              )}
              {hasValue(data.terminationClause) && (
                <div>
                  <Title level={5} style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px' }}>Termination Clause</Title>
                  <TiptapViewer content={data.terminationClause} />
                </div>
              )}
              {hasValue(data.ndaClause) && (
                <div>
                  <Title level={5} style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px' }}>Confidentiality Agreement</Title>
                  <TiptapViewer content={data.ndaClause} />
                </div>
              )}
              {hasValue(data.legalClause) && (
                <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 8, borderLeft: '4px solid var(--premium-blue)' }}>
                  <TiptapViewer content={data.legalClause} />
                </div>
              )}
            </div>

            <Divider style={{ margin: '40px 0', borderColor: 'var(--border-color)' }} />
            {/* Signatory boxes follow... */}
            <Row gutter={[48, 32]}>
              {(data.companyName?.trim() || data.companySigner?.trim()) && (
                <Col xs={24} md={12}>
                  <div style={{ padding: 16, background: isPreview ? 'transparent' : 'var(--bg-primary)', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
                    <Title level={5} style={{ color: 'var(--text-primary)', marginBottom: 16 }}>For: {data.companyName || 'The Provider'}</Title>
                    <Descriptions column={1}>
                      <Descriptions.Item label={<span style={{ color: 'var(--text-secondary)' }}>Signatory</span>}><Text style={{ color: 'var(--text-primary)' }}>{data.companySigner || 'Authorized Representative'}</Text></Descriptions.Item>
                      <Descriptions.Item label={<span style={{ color: 'var(--text-secondary)' }}>Status</span>}><Tag color="success">Authorised</Tag></Descriptions.Item>
                    </Descriptions>
                  </div>
                </Col>
              )}
              {(data.clientName?.trim() || data.signatoryName?.trim() || data.clientSigner?.trim()) && (
                <Col xs={24} md={12}>
                  <div style={{ padding: 16, background: isPreview ? 'transparent' : 'var(--bg-primary)', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
                    <Title level={5} style={{ color: 'var(--text-primary)', marginBottom: 16 }}>For: {data.clientName || 'The Client'}</Title>
                    <Descriptions column={1}>
                      <Descriptions.Item label={<span style={{ color: 'var(--text-secondary)' }}>Signatory</span>}><Text style={{ color: 'var(--text-primary)' }}>{data.signatoryName || data.clientSigner || 'Pending'}</Text></Descriptions.Item>
                      <Descriptions.Item label={<span style={{ color: 'var(--text-secondary)' }}>Status</span>}>
                        <Tag color={data.signed ? 'success' : 'processing'}>{data.signed ? 'Signed' : 'Awaiting Signature'}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        );

      case 'timeline': {
        const timelinePhases = (data.phases || []).filter((p: any) => hasValue(p.title));
        if (timelinePhases.length === 0 && !hasValue(data.dependencyNotes)) return null;

        if (isPreview) {
          return (
            <div style={{ marginTop: 20 }}>
              {timelinePhases.map((phase: any, i: number) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <Title level={5} style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '15px' }}>
                    {phase.title}
                  </Title>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                    Scheduled for completion{phase.deadline ? ` by ` : ''}<Text strong style={{ color: 'var(--text-primary)' }}>{phase.deadline || 'TBD'}</Text>
                    {phase.reviewPeriod ? `, followed by a ${phase.reviewPeriod} review and feedback window.` : '.'}
                  </Text>
                </div>
              ))}
              {hasValue(data.dependencyNotes) && (
                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '4px solid #3b82f6' }}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: '12px', color: 'var(--premium-blue)', letterSpacing: '1px' }}>DEPENDENCY NOTES</Text>
                  <TiptapViewer content={data.dependencyNotes} />
                </div>
              )}
            </div>
          );
        }
        return (
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <Table
              pagination={false}
              dataSource={timelinePhases}
              columns={[
                { title: 'Phase', dataIndex: 'title', key: 'title', render: (t) => <Text style={{ color: 'var(--text-primary)' }}>{t}</Text> },
                { title: 'Deadline', dataIndex: 'deadline', key: 'deadline', render: (t) => <Text style={{ color: 'var(--text-secondary)' }}>{t || 'TBD'}</Text> },
                { title: 'Review Period', dataIndex: 'reviewPeriod', key: 'reviewPeriod', render: (t) => <Text style={{ color: 'var(--text-secondary)' }}>{t || '-'}</Text> }
              ]}
            />
            {hasValue(data.dependencyNotes) && <div style={{ marginTop: 20, color: 'var(--text-secondary)' }}><TiptapViewer content={data.dependencyNotes} /></div>}
          </div>
        );
      }

      case 'scope': {
        const milestones = (data.milestones || []).filter((m: any) => hasValue(m.title) || hasValue(m.deliverables) || hasValue(m.tasks));
        const scopeTerms = (data.terms || []).filter((term: any) => hasValue(term.title) || hasValue(term.description));
        if (milestones.length === 0 && scopeTerms.length === 0) return null;

        if (isPreview) {
          return (
            <div style={{ marginTop: 20 }}>
              {milestones.map((m: any, i: number) => (
                <div key={i} style={{ marginBottom: 32 }}>
                  {hasValue(m.title) && (
                    <Title level={5} style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '15px' }}>
                      {m.title}
                    </Title>
                  )}
                  {hasValue(m.deliverables) && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Key Deliverables:</Text>
                      <Text style={{ marginLeft: 8, color: 'var(--text-secondary)', fontSize: '15px' }}>{m.deliverables}</Text>
                    </div>
                  )}
                  {hasValue(m.tasks) && (
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--border-color)' }}>
                      {m.tasks}
                    </div>
                  )}
                </div>
              ))}

              {/* Scope Terms (Exclusions, etc) */}
              {scopeTerms.length > 0 && (
                <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Title level={5} style={{ fontSize: 13, letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 8 }}>BOUNDARIES & EXCLUSIONS</Title>
                  {scopeTerms.map((term: any) => {
                    const hexColor = term.color || (term.title?.toLowerCase().includes('exclusion') ? '#ef4444' : '#3b82f6');
                    return (
                      <div key={term.id} style={{ padding: '4px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: `4px solid ${hexColor}` }}>
                        {hasValue(term.title) && <Text strong style={{ color: hexColor, marginBottom: '2px', display: 'block' }}>{term.title}</Text>}
                        {hasValue(term.description) && <TiptapViewer content={term.description || ''} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        return (
          <div>
            <Row gutter={[24, 24]}>
              {milestones.map((m: any, i: number) => (
                <Col span={12} key={i}>
                  <div style={{ height: '100%', padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                    {hasValue(m.title) && <Title level={5} style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{m.title}</Title>}
                    {hasValue(m.deliverables) && (
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ color: 'var(--text-primary)' }}>Deliverables:</Text> <Text style={{ color: 'var(--text-secondary)' }}>{m.deliverables}</Text>
                      </div>
                    )}
                    {hasValue(m.tasks) && (
                      <>
                        <Divider style={{ margin: '8px 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />
                        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{m.tasks}</div>
                      </>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        );
      }

      case 'cover': {
        const logo = data.logoUrl || data.logo;
        return (
          <div style={{ padding: isPreview ? '0 0 24px 0' : '24px', background: isPreview ? 'transparent' : 'var(--bg-secondary)', borderRadius: 14, minHeight: isPreview ? 'auto' : 400, display: 'flex', flexDirection: 'column', border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
              {logo ? <img src={logo} alt="Logo" width="120" crossOrigin="anonymous" style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'inline-block' }} /> : <div style={{ height: 48, width: 48, background: 'var(--bg-blue-50)', borderRadius: 8 }} />}
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>DATE</Text>
                <Title level={5} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 13 }}>{dayjs(data.date).format('MMMM D, YYYY')}</Title>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: 32 }}>
              <span style={{ color: 'var(--premium-blue)', letterSpacing: 2, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>BUSINESS PROPOSAL</span>
              <Title level={1} style={{ fontSize: 32, marginTop: 0, marginBottom: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{data.title || 'Untitled Project'}</Title>
              {data.projectSummary && <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 660, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: data.projectSummary }} />}
            </div>

            <Row gutter={48}>
              {hasValue(data.clientName) && (
                <Col span={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-secondary)' }}>PREPARED FOR</Text>
                  <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>{data.clientName}</Title>
                  {hasValue(data.clientCompany) && <Text strong style={{ display: 'block', marginTop: 4, color: 'var(--text-primary)' }}>{data.clientCompany}</Text>}
                  {hasValue(data.clientAddress) && <Text type="secondary" style={{ display: 'block', marginTop: 8, color: 'var(--text-secondary)' }}>{data.clientAddress}</Text>}
                  {(hasValue(data.clientEmail) || hasValue(data.clientPhone)) && (
                    <Text type="secondary" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                      {data.clientEmail}{hasValue(data.clientEmail) && hasValue(data.clientPhone) ? ' • ' : ''}{data.clientPhone}
                    </Text>
                  )}
                </Col>
              )}
              {hasValue(data.senderName) && (
                <Col span={12}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-secondary)' }}>PREPARED BY</Text>
                  <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>{data.senderName}</Title>
                  {hasValue(data.senderCompany) && <Text strong style={{ display: 'block', marginTop: 4, color: 'var(--text-primary)' }}>{data.senderCompany}</Text>}
                  {hasValue(data.senderAddress) && <Text type="secondary" style={{ display: 'block', marginTop: 8, color: 'var(--text-secondary)' }}>{data.senderAddress}</Text>}
                  {(hasValue(data.senderEmail) || hasValue(data.senderContact)) && (
                    <Text type="secondary" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                      {data.senderEmail}{hasValue(data.senderEmail) && hasValue(data.senderContact) ? ' • ' : ''}{data.senderContact}
                    </Text>
                  )}
                </Col>
              )}
            </Row>

            {!isPreview && (
              <>
                <Divider style={{ margin: '24px 0', borderColor: 'var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <CalendarOutlined style={{ color: 'var(--premium-blue)', fontSize: 12 }} />
                    <Text type="secondary" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Valid until: <Text strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>{dayjs(data.validUntil).format('MMM D, YYYY')}</Text></Text>
                  </Space>
                  <Tag color="blue" style={{ fontSize: 10 }}>Professional Proposal</Tag>
                </div>
              </>
            )}
          </div>
        );
      }

      case 'section':
        return (
          <div style={{ padding: isPreview ? '0' : '20px', background: isPreview ? 'transparent' : 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
            <TiptapViewer content={data.content || data.text || ''} />
          </div>
        );

      default:
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Empty description={`Details for ${block.type} section`} />
          </div>
        );
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <DollarOutlined />;
      case 'scope': return <FileTextOutlined />;
      case 'signature': return <SafetyCertificateOutlined />;
      case 'timeline': return <CalendarOutlined />;
      default: return <SnippetsOutlined />;
    }
  };

  // Section anchors for the custom tab strip. Each entry maps to a
  // `#scroll-section-${key}` element rendered inside the overview body.
  const visibleBlocks = blocks.filter((b) => !isBlockEmpty(b));
  const sections: { key: string; icon: React.ReactNode; label: string }[] = [
    { key: 'overview', icon: <SnippetsOutlined />, label: 'Overview' },
    ...visibleBlocks.map((block: any, idx: number) => ({
      key: `block-${idx}`,
      icon: getTabIcon(block.type),
      label: getBlockTitle(block),
    })),
  ];

  const handleSectionJump = (key: string) => {
    setActiveSection(key);
    requestAnimationFrame(() => {
      const el = document.getElementById(`scroll-section-${key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const overviewContent = (
    <div id="proposal-document-sheet" className="pd-sheet">
      <div className="pd-sheet__inner">
        {/* Sheet header */}
        <div id="scroll-section-overview" className="pd-sheet__head" style={{ scrollMarginTop: 200 }}>
          <span className="pd-sheet__eyebrow">Proposal Overview</span>
          <h1 className="pd-sheet__title">{proposal.title}</h1>
          <p className="pd-sheet__sub">Complete sequential display of all project details and contractual terms.</p>
        </div>

        {/* Sequential Blocks */}
        {visibleBlocks.map((block: any, idx: number) => (
          <section key={idx} id={`scroll-section-block-${idx}`} className="pd-section" style={{ scrollMarginTop: 200 }}>
            {block.type !== 'cover' && (
              <header className="pd-section__head">
                <span className="pd-section__icon">{getTabIcon(block.type)}</span>
                <span className="pd-section__title">{getBlockTitle(block).toUpperCase()}</span>
                <span className="pd-section__rule" />
              </header>
            )}
            <div className="pd-section__body">
              {renderBlockContent(block, true)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );


  const statusKey = (proposal.status || '').toLowerCase();
  const statusMeta = STATUS_META[statusKey as keyof typeof STATUS_META];
  const creator = proposal.createdBy;

  return (
    <MainLayout>
      {contextHolder}
      <div style={{ background: 'var(--bg-pure-white)', minHeight: 'calc(100vh - 52px)' }}>
        <div className="pd-sticky">
          {/* Title row */}
          <div className="pd-header">
            <div className="pd-header__left">
              <button
                type="button"
                className="pd-back"
                onClick={() => router.push('/proposals')}
                aria-label="Back to proposals"
              >
                <ArrowLeftOutlined />
              </button>
              <div className="pd-header__brand">
                <SnippetsOutlined />
              </div>
              <div className="pd-header__text">
                <h1 className="pd-header__title">{proposal.title}</h1>
                <span className="pd-header__divider" aria-hidden="true" />
                <span className="pd-header__sub">Proposal details</span>
              </div>
            </div>
            <div className="pd-header__actions">
              <Dropdown
                menu={{
                  items: [
                    { key: 'pdf', label: 'Download PDF', icon: <FilePdfOutlined /> },
                    { key: 'word', label: 'Download Word', icon: <FileWordOutlined /> },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'pdf') handleExport('pdf');
                    else if (key === 'word') handleExport('word');
                  }
                }}
                placement="bottomRight"
              >
                <Button icon={<DownloadOutlined />} className="pd-btn">Export</Button>
              </Dropdown>
              <Button
                icon={<EyeOutlined />}
                className="pd-btn"
                onClick={() => setDocDrawerOpen(true)}
              >
                Preview
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                className="pd-btn pd-btn--primary"
                onClick={() => router.push(`/proposals/builder?id=${proposal.id}`)}
              >
                Edit Proposal
              </Button>
            </div>
          </div>

          {/* Metadata strip */}
          <div className="pd-meta">
                  <div className="pd-meta__item">
                    <span className="pd-meta__label">Status</span>
                    {statusMeta ? (
                      <span
                        className="pd-status"
                        style={{
                          color: statusMeta.color,
                          background: statusMeta.bg,
                          borderColor: statusMeta.ring,
                        }}
                      >
                        <span
                          className="pd-status__dot"
                          style={{ background: statusMeta.color, boxShadow: `0 0 0 3px ${statusMeta.bg}` }}
                        />
                        {statusMeta.label}
                      </span>
                    ) : (
                      <span className="pd-meta__value pd-meta__value--mono">—</span>
                    )}
                  </div>
                  <span className="pd-meta__sep" />
                  <div className="pd-meta__item">
                    <span className="pd-meta__label">Client</span>
                    <span className="pd-meta__value">
                      <UserOutlined className="pd-meta__icon" />
                      {proposal.client_name || '—'}
                    </span>
                  </div>
                  <span className="pd-meta__sep" />
                  <div className="pd-meta__item">
                    <span className="pd-meta__label">Created by</span>
                    {creator?.name ? (
                      <span className="pd-meta__value pd-meta__creator">
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt={creator.name} className="pd-meta__avatar" />
                        ) : (
                          <span className="pd-meta__avatar pd-meta__avatar--initials">
                            {(creator.name || '—').split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        )}
                        {creator.name}
                      </span>
                    ) : (
                      <span className="pd-meta__value pd-meta__value--mono">—</span>
                    )}
                  </div>
                  <span className="pd-meta__sep" />
                  <div className="pd-meta__item">
                    <span className="pd-meta__label">Created</span>
                    <span className="pd-meta__value pd-meta__value--mono">
                      {proposal.created_at ? dayjs(proposal.created_at).format('MMM D, YYYY') : '—'}
                    </span>
                  </div>
                  <span className="pd-meta__sep" />
                  <div className="pd-meta__item">
                    <span className="pd-meta__label">Updated</span>
                    <span className="pd-meta__value pd-meta__value--mono">
                      {proposal.updated_at
                        ? dayjs(proposal.updated_at).format('MMM D · h:mm A')
                        : '—'}
                    </span>
                  </div>
                </div>

          {/* Custom tab strip (section anchors) — bound to activeSection so
              both click and scroll keep the indicator in sync. */}
          <div className="pd-tabs pd-tabs--custom" role="tablist">
            {sections.map((s) => {
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`pd-tab ${isActive ? 'pd-tab--active' : ''}`}
                  onClick={() => handleSectionJump(s.key)}
                >
                  <span className="pd-tab__icon">{s.icon}</span>
                  <span className="pd-tab__label">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document body */}
        {overviewContent}
      </div>

      {/* Document Preview Drawer */}
      <Drawer
        title={<span style={{ color: 'var(--text-slate-900)' }}>Live Preview</span>}
        placement="right"
        width={850}
        onClose={() => setDocDrawerOpen(false)}
        open={docDrawerOpen}
        styles={{
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          header: { background: 'var(--bg-pure-white)', borderBottom: '1px solid var(--border-color)' },
          mask: { background: 'rgba(15, 23, 42, 0.42)' },
        }}
      >
        <iframe
          src={`/proposals/preview?theme=${typeof window !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'light' : 'light'}&proposalId=${params.id}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Proposal Preview"
        />
      </Drawer>
    </MainLayout>
  );
}

