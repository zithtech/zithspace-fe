'use client';

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Tabs,
  Button,
  Tag,
  Space,
  Spin,
  message,
  Breadcrumb,
  Empty,
  Row,
  Col,
  Table,
  Descriptions,
  Divider,
  theme,
  Dropdown
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SnippetsOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  HistoryOutlined,
  UserOutlined,
  PrinterOutlined,
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

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [messageApi, contextHolder] = message.useMessage();
  const { token } = theme.useToken();

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

  const handleTabChange = (key: string) => {
    if (key === 'overview') {
      setActiveTab('overview');
      return;
    }

    // Force overview tab and scroll
    setActiveTab('overview');

    // Smooth scroll to the section
    setTimeout(() => {
      const element = document.getElementById(`scroll-section-${key}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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

        if (isPreview) {
          let total = 0;
          pricingItems.forEach((item: any) => {
            total += (Number(item.price) || 0) * (Number(item.quantity) || 0);
          });

          return (
            <div style={{ marginTop: 20 }}>
              {pricingItems.map((item: any, i: number) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  {hasValue(item.name) && (
                    <Title level={5} style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '15px' }}>
                      {item.name}
                    </Title>
                  )}
                  <Text style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                    This item includes {item.quantity || 0} units at a rate of ${Number(item.price || 0).toLocaleString()} per unit, totaling <Text strong style={{ color: 'var(--text-primary)' }}>${(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}</Text>.
                  </Text>
                </div>
              ))}
              <Divider style={{ margin: '24px 0', borderColor: 'var(--border-color)' }} />
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>GRAND TOTAL INVESTMENT</Text>
                <Title level={2} style={{ margin: '4px 0 0 0', color: 'var(--premium-blue)', fontWeight: 800 }}>${total.toLocaleString()}</Title>
              </div>
            </div>
          );
        }
        return (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)', padding: '2px' }}>
            <Table
              pagination={false}
              dataSource={pricingItems}
              columns={[
                { title: 'Item Description', dataIndex: 'name', key: 'name', render: (t) => <Text strong style={{ color: 'var(--text-primary)' }}>{t || '-'}</Text> },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', align: 'center', render: (t) => <Text style={{ color: 'var(--text-secondary)' }}>{t}</Text> },
                { title: 'Unit Price', dataIndex: 'price', key: 'price', align: 'right', render: (val) => <Text style={{ color: 'var(--text-secondary)' }}>${Number(val).toLocaleString()}</Text> },
                { title: 'Total', key: 'total', align: 'right', render: (_, r: any) => <Text strong style={{ color: 'var(--text-primary)' }}>${(Number(r.price) * Number(r.quantity)).toLocaleString()}</Text> }
              ]}
              summary={(pageData: any) => {
                let total = 0;
                pageData.forEach((item: any) => {
                  total += (Number(item.price) || 0) * (Number(item.quantity) || 0);
                });
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right"><Text strong style={{ color: 'var(--text-primary)' }}>Grand Total</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right"><Title level={4} style={{ margin: 0, color: 'var(--premium-blue)' }}>${total.toLocaleString()}</Title></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
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
                  <div style={{ padding: 16, background: isPreview ? 'transparent' : '#f8fafc', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
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
                  <div style={{ padding: 16, background: isPreview ? 'transparent' : '#f8fafc', borderRadius: 12, border: isPreview ? 'none' : '1px solid var(--border-color)' }}>
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
                <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #3b82f6' }}>
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
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #e2e8f0' }}>
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
          <div style={{ padding: isPreview ? '0 0 24px 0' : '24px', background: isPreview ? 'transparent' : 'var(--bg-secondary)', borderRadius: 16, minHeight: isPreview ? 'auto' : 400, display: 'flex', flexDirection: 'column', border: isPreview ? 'none' : '1px solid var(--border-color)', boxShadow: isPreview ? 'none' : 'var(--box-shadow)' }}>
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

  const tabItems = [
    {
      key: 'overview',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SnippetsOutlined /> Overview</span>,
      forceRender: true,
      children: (
        <div id="proposal-document-sheet" style={{ padding: '0', background: 'white' }}>
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              background: 'transparent',
              padding: '24px 32px'
            }}
          >
            {/* Metadata Title */}
            <div id="scroll-section-overview" style={{ marginBottom: 40, borderBottom: '2px solid var(--border-color)', paddingBottom: 24, scrollMarginTop: 160 }}>
              <Text strong style={{ color: 'var(--premium-blue)', fontSize: 12, letterSpacing: '1.5px', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>PROPOSAL OVERVIEW</Text>
              <Title level={2} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.02em' }}>{proposal.title}</Title>
              <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block', opacity: 0.8 }}>Complete sequential display of all project details and contractual terms.</Text>
            </div>

            {/* Sequential Blocks */}
            {blocks.filter(b => !isBlockEmpty(b)).map((block: any, idx: number) => (
              <div key={idx} id={`scroll-section-block-${idx}`} style={{ marginBottom: 32, scrollMarginTop: 160 }}>
                {block.type !== 'cover' && (
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--premium-blue)', opacity: 0.7, fontSize: '0.85rem' }}>{getTabIcon(block.type)}</span>
                      {getBlockTitle(block).toUpperCase()}
                    </Title>
                    <Divider style={{ flex: 1, marginLeft: 16, minWidth: 16, borderColor: 'var(--border-color)', opacity: 0.3 }} />
                  </div>
                )}
                <div style={{ paddingLeft: 0 }}>
                  {renderBlockContent(block, true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },

    ...blocks.filter(b => !isBlockEmpty(b)).map((block: any, idx: number) => ({
      key: `block-${idx}`,
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{getTabIcon(block.type)} {getBlockTitle(block)}</span>,
      children: (
        <div style={{ padding: '24px 32px' }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>{getBlockTitle(block)}</Title>
            <Button icon={<PrinterOutlined />}>Print Section</Button>
          </div>
          {renderBlockContent(block)}
        </div>
      )
    }))
  ];


  return (
    <MainLayout>
      {contextHolder}
      <div style={{ background: 'var(--bg-pure-white)', minHeight: 'calc(100vh - 64px)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="premium-tabs"
          style={{ marginTop: 0 }}
          renderTabBar={(props, DefaultTabBar) => (
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: 'var(--bg-pure-white)',
              borderBottom: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              {/* Header section inside the sticky wrapper */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                padding: '24px 32px 16px 32px'
              }}>
                <div>
                  <Space size={12} align="center">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => router.push("/proposals")}
                      style={{ borderRadius: 10, height: 44, width: 44 }}
                    />
                    <div style={{ background: "var(--bg-blue-50)", padding: 10, borderRadius: 12, color: "var(--premium-blue)", display: 'flex' }}>
                      <SnippetsOutlined style={{ fontSize: 24 }} />
                    </div>
                    <div>
                      <Breadcrumb items={[{ title: <span style={{ color: 'var(--text-secondary)' }}>Work</span> }, { title: <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Proposals</span>, onClick: () => router.push('/proposals') }, { title: <span style={{ color: 'var(--text-primary)' }}>{proposal.title}</span> }]} />
                      <Title level={2} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{proposal.title}</Title>
                    </div>
                  </Space>
                </div>
                <Space>
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
                    <Button icon={<DownloadOutlined />} size="large">Export</Button>
                  </Dropdown>
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => router.push(`/proposals/builder?id=${proposal.id}`)}
                    style={{ borderRadius: 10, fontWeight: 600 }}
                  >
                    Edit Proposal
                  </Button>
                </Space>
              </div>

              {/* Tab Bar section inside the sticky wrapper */}
              <div style={{ padding: '0 32px' }}>
                <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
              </div>
            </div>
          )}
        />
      </div>
    </MainLayout>
  );
}

