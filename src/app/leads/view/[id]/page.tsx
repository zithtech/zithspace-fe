"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Tabs,
  Button,
  Tag,
  Space,
  Spin,
  Row,
  Col,
  Divider,
  Breadcrumb,
  Empty,
  Tooltip,
  message,
  Modal,
  Steps,
  Form,
  Input,
} from "antd";
import {
  ArrowLeft,
  Layers,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Globe,
  Star,
  Sparkles,
  Search,
  Brain,
  Clock,
  DollarSign,
  UserCheck,
  BarChart3,
  Terminal,
  Copy,
  RotateCcw,
  ChevronDown,
  Rocket,
  Info,
  Layout as LayoutIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function LeadProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { lead, loading, error, fetchLeadById, onboardLead, analyzeLead, updateLead } = useLeads();
  const { user } = useAuth();
  const [onboarding, setOnboarding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [initForm] = Form.useForm();


  useEffect(() => {
    if (params.id) {
      fetchLeadById(params.id as string);
    }
  }, [params.id, fetchLeadById]);

  const handleOnboard = async (values: any) => {
    try {
      setOnboarding(true);
      // message.loading({ content: 'Initializing...', key: 'onboard' });
      
      // Trigger onboarding process with the edited values directly
      // This creates the project/client with overrides but keeps the lead record as is
      const res = await onboardLead(params.id as string, values);
      if (res) {
        message.success({ content: 'PROJECT INITIALIZED SUCCESSFULLY', key: 'onboard' });
        setIsModalOpen(false);
        setTimeout(() => {
          router.push('/projects/manage');
        }, 800);
      }
    } catch (err: any) {
      console.error("Onboard Error:", err);
      message.error({ content: err.message || "Failed to initialize project", key: 'onboard' });
    } finally {
      setOnboarding(false);
    }
  };

  if (loading && !lead) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <div style={{ marginTop: 24, fontSize: 16, fontWeight: 500, color: 'var(--text-slate-400)', letterSpacing: '0.05em' }}>
                SYNTHESIZING LEAD INTELLIGENCE...
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error || (!loading && !lead)) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Empty
              description={<span style={{ color: 'var(--text-slate-500)' }}>{error || "Lead Intelligence Not Found"}</span>}
              image={Empty.PRESENTED_IMAGE_DEFAULT}
            >
              <Button
                type="primary"
                onClick={() => router.push('/leads')}
                style={{ borderRadius: 8, height: 40, padding: '0 24px' }}
              >
                Return to Lead Management
              </Button>
            </Empty>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!lead) return null;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="lead-intelligence-hub">
          {/* Top Header - Minimal */}
          <div className="hub-header">
            <Row justify="space-between" align="middle">
              <Col>
                <Space size={16}>
                  <Button
                    icon={<ArrowLeft size={16} />}
                    onClick={() => router.push("/leads")}
                    className="hub-back-btn"
                  />
                  <div>
                    <Text className="hub-category">JOB DETAIL</Text>
                    <Title level={3} className="hub-main-title">{lead.title}</Title>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space size={12}>
                  {lead.status && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--bg-blue-50)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>STATUS:</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--premium-blue)', textTransform: 'uppercase' }}>
                        {lead.status}
                      </span>
                    </div>
                  )}
                  {lead.job_link && (
                    <Button
                      type="primary"
                      icon={<ExternalLink size={16} />}
                      href={lead.job_link}
                      target="_blank"
                      style={{
                        borderRadius: '10px',
                        height: '40px',
                        padding: '0 20px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--premium-blue)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      Redirect {lead.platform || 'Upwork'}
                    </Button>
                  )}
                  {/* <Button
                    type="primary"
                    icon={<Brain size={18} />}
                    loading={analyzing}
                    onClick={async () => {
                      try {
                        setAnalyzing(true);
                        await analyzeLead(params.id as string);
                        message.success('AI ANALYSIS COMPLETE');
                        fetchLeadById(params.id as string);
                      } catch (err: any) {
                        message.error(err.message);
                      } finally {
                        setAnalyzing(false);
                      }
                    }}
                    style={{
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--premium-blue)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Analyze Lead
                  </Button> */}
                  <Button
                    type="primary"
                    icon={<Rocket size={18} />}
                    loading={onboarding}
                    onClick={() => {
                      initForm.setFieldsValue({
                        client_name: lead.client_name,
                        client_mail: lead.client_mail,
                        client_phone: lead.client_phone,
                        client_location: lead.client_location,
                        summary: lead.summary,
                        budget: lead.budget,
                        experience_level: lead.experience_level,
                      });
                      setIsModalOpen(true);
                      setCurrentStep(0);
                    }}
                    style={{
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      border: 'none',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      padding: '0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Initialize Project
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          <div className="hub-content">
            <Row gutter={[16, 16]}>
              {/* LEFT COLUMN: IDENTITY & PERSONA */}
              <Col xs={24} xl={6}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div className="identity-section-hub" style={{ padding: '0 0 24px 0' }}>
                    <div className="client-profile-header">
                      <div className="avatar-hub">
                        {lead.client_name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="client-details-hub">
                        <Title level={4} className="client-name-hub">{lead.client_name}</Title>
                        <Space className="client-meta-hub">
                          <MapPin size={12} /> <Text>{lead.client_location || 'Global Territory'}</Text>
                        </Space>
                      </div>
                    </div>
                    <Space wrap style={{ marginTop: 16 }}>
                      <Tag className="platform-tag-hub">{lead.platform || 'UPWORK'}</Tag>
                      <Tag className="rating-tag-hub"><Star size={12} fill="#fbbf24" color="#fbbf24" /> {lead.client_rating || '5.0'}</Tag>
                    </Space>
                    <div className="spend-box-hub">
                      <Text className="spend-label">ESTIMATED BUDGET</Text>
                      <Title level={3} className="spend-value" style={{ color: '#10b981', fontWeight: 800 }}>{lead.budget || 'N/A'}</Title>
                    </div>
                  </div>

                  <Divider className="hub-divider spend-divider" />

                  <Card bordered={false} className="borderless-card" title="Contact info">
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div className="contact-badge-v2">
                        <Mail size={16} />
                        <Text ellipsis className="contact-text">{lead.client_mail || 'N/A'}</Text>
                      </div>
                      <div className="contact-badge-v2">
                        <Phone size={16} />
                        <span className="contact-text">{lead.client_phone || 'N/A'}</span>
                      </div>
                    </Space>
                  </Card>

                  <Divider className="hub-divider" />

                  <Card bordered={false} className="borderless-card" title="Trust & verification">
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <div className={`trust-badge-v2 ${lead.client_payment_verified ? 'verified' : 'unverified'}`}>
                        {lead.client_payment_verified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        <Text className="trust-text">Payment {lead.client_payment_verified ? 'Verified' : 'Unverified'}</Text>
                      </div>
                      <div className={`trust-badge-v2 ${lead.client_phone_verified ? 'verified' : 'unverified'}`}>
                        {lead.client_phone_verified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        <Text className="trust-text">Phone {lead.client_phone_verified ? 'Verified' : 'Unverified'}</Text>
                      </div>
                    </Space>
                  </Card>

                  <Divider className="hub-divider" />

                  <Card bordered={false} className="borderless-card" title="Documents vault">
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      {lead.documents && lead.documents.length > 0 ? (
                        lead.documents.map((doc: any, i: number) => {
                          const docObj = typeof doc === 'string' ? { name: doc, url: doc } : doc;
                          return (
                            <div key={i} className="doc-item-hub">
                              <FileText size={14} color="var(--premium-blue)" />
                              <Text ellipsis className="doc-name-hub">{docObj.name || 'Attachment'}</Text>
                              <Button type="link" size="small" href={docObj.url} target="_blank" icon={<ExternalLink size={12} />} />
                            </div>
                          );
                        })
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>No documents found</Text>
                      )}
                    </Space>
                  </Card>
                </Space>
              </Col>

              {/* CENTER COLUMN: MAIN DATA & STRATEGY */}
              <Col xs={24} xl={12} className="hub-center-col-border">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {/* Job Specification Card */}
                  <Card bordered={false} className="main-spec-card borderless-card">
                    <Space className="spec-meta" size={12}>
                      <Tag className="spec-tag">{lead.experience_level || 'Expert'}</Tag>
                      <Space className="spec-posted"><Clock size={12} /> Posted {dayjs(lead.posted_on).fromNow()}</Space>
                      <Space className="spec-posted"><Calendar size={12} /> {lead.duration || 'Flexible'}</Space>
                    </Space>

                    <Title level={2} className="spec-title">{lead.title}</Title>

                    <div className="spec-summary-hub">
                      <Title level={5} className="hub-section-titles">Job Summary</Title>
                      <Text className={`spec-text-flow ${!isExpanded ? 'clamped' : ''}`}>
                        {lead.summary || 'Awaiting detailed brief...'}
                      </Text>
                      <Button
                        type="link"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="description-toggle-btn"
                        icon={<ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />}
                      >
                        {isExpanded ? 'Show less' : 'Read full description'}
                      </Button>
                    </div>

                    <Divider className="hub-divider-light" />

                    <Row gutter={[16, 16]}>
                      <Col span={14}>
                        <div className="architecture-hub">
                          <Text className="arch-label">SKILLS</Text>
                          <Space wrap size={8} style={{ marginTop: 12 }}>
                            {(lead.skills || []).slice(0, isSkillsExpanded ? undefined : 6).map((skill: string) => (
                              <Tag key={skill} className="arch-tag">{skill}</Tag>
                            ))}
                          </Space>
                          {lead.skills && lead.skills.length > 6 && (
                            <div style={{ marginTop: 8 }}>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                                className="description-toggle-btn"
                                style={{ padding: 0, height: 'auto', fontSize: 11 }}
                              >
                                {isSkillsExpanded ? 'Show less' : `+${lead.skills.length - 6} more`}
                              </Button>
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col span={10}>
                        <div className="skill-alignment-box">
                          <Text className="arch-label">SKILL MATCHING</Text>
                          <div className="alignment-stats">
                            <div className="alignment-score">{lead.skill_analysis?.matchPercentage || 0}%</div>
                          </div>
                          {lead.skill_analysis?.missingSkills && (
                            <Space size={4} wrap style={{ marginTop: 8 }}>
                              {lead.skill_analysis.missingSkills.slice(0, 2).map((s: string) => <Tag color="error" key={s} style={{ fontSize: 9 }}>Gap: {s}</Tag>)}
                            </Space>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <Divider className="hub-divider" />

                  {/* Sequence Timeline Node (Previously in Overview) */}
                  <Card bordered={false} className="timeline-hub-card borderless-card" title="Sequence Timeline">
                    <Row gutter={24}>
                      <Col span={12}>
                        <div className="timeline-hub-item">
                          <Calendar size={16} color="var(--premium-blue)" />
                          <div>
                            <Text className="hub-label">IMPLEMENTATION CYCLE</Text>
                            <Text className="hub-value">
                              {lead.timeline_start ? `${dayjs(lead.timeline_start).format('MMM DD')} — ${dayjs(lead.timeline_end).format('MMM DD')}` : 'Pending Schedule'}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="timeline-hub-item">
                          {/* <Zap size={16} color="#f59e0b" /> */}
                          {/* <div>
                            <Text className="hub-label">STATUS</Text>
                            <Text className="hub-value">{lead.actions_item || 'Manual Orchestration'}</Text>
                          </div> */}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                  {/* 
                  <Divider className="hub-divider spend-divider" />
                  <Card bordered={false} className="strategy-canvas-hub borderless-card"
                    title={<Space><div className="engine-pulse"></div> AI Strategy Canvas</Space>}
                    extra={<Text className="canvas-meta">Template: {lead.template_used || 'AUTO'}</Text>}
                  >
                    <div className="canvas-content-hub">
                      <Text className="canvas-proposal-text">
                        {lead.proposal_text || "Initialize generator for strategic synthesis..."}
                      </Text>
                    </div>
                    <div className="canvas-footer-hub">
                      <Space size={20}>
                        <div><Text className="arch-label">CONFIDENCE</Text><Text strong>98.4%</Text></div>
                        <div><Text className="arch-label">EST. EFFORT</Text><Text strong>{lead.hour_based_amount || '--'} hrs</Text></div>
                      </Space>
                      <Button type="primary" icon={<ExternalLink size={14} />} onClick={() => router.push(`/proposals/create?leadId=${lead.id}`)}>Open Builder</Button>
                    </div>
                  </Card>
                  */}

                </Space>
              </Col>

              {/* RIGHT COLUMN: METRICS & NOTES */}
              <Col xs={24} xl={6} className="hub-right-col-border">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Card bordered={false} className="insights-card-hub borderless-card"
                    title="Smart insights"
                    extra={<Sparkles size={16} color="var(--premium-blue)" />}
                  >
                    <div className="win-prob-wrapper-hub" style={{ margin: '8px 0' }}>
                      <div className="donut-hub-v2">
                        <Text className="donut-val-v2">{Math.round(lead.ai_score || 0)}%</Text>
                        <Text className="donut-sub-v2">WIN PROB.</Text>
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--border-color)" strokeWidth="6" />
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--premium-blue)" strokeWidth="6"
                            strokeDasharray={`${(lead.ai_score || 0) * 2.82} 282`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                        </svg>
                      </div>
                    </div>

                    <div className="insight-row-hub">
                      <Text type="secondary">Competition</Text>
                      <Tag color="orange" style={{ borderRadius: 6, fontWeight: 700 }}>MEDIUM</Tag>
                    </div>
                    <div className="insight-score-hub">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: 600 }}>Client Quality Score</Text>
                        <Text style={{ fontSize: 11, fontWeight: 800, color: 'var(--premium-blue)' }}>8.2/10</Text>
                      </div>
                      <div className="score-track-hub"><div className="score-fill-hub blue" style={{ width: '82%' }}></div></div>
                    </div>
                  </Card>

                  <Divider className="hub-divider" />

                  {/* Budget Card (Requirements Tab) */}
                  <Card bordered={false} className="budget-card-hub borderless-card" title="Financial breakdown">
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <div className="budget-metrics-grid">
                        <div className="budget-metric-item">
                          <Text className="arch-label">TOTAL SPENT</Text>
                          <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{lead.client_spend || 'N/A'}</Title>
                        </div>
                        <div className="metric-divider-v-small"></div>
                        <div className="budget-metric-item">
                          <Text className="arch-label">ESTIMATED BUDGET</Text>
                          <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{lead.budget || 'N/A'}</Title>
                        </div>
                      </div>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Text className="arch-label">RATE ($)</Text>
                          <Text className="hub-value-v2">{lead.hourly_rate || lead.hour_based_amount || 'Fix'}</Text>
                        </Col>
                        <Col span={12}>
                          <Text className="arch-label">JOB TYPE</Text>
                          <Text className="hub-value-v2">{lead.job_type || 'Hourly'}</Text>
                        </Col>
                      </Row>
                      {/* {lead.job_link && (
                        <Button block icon={<ExternalLink size={14} />} href={lead.job_link} target="_blank" className="hub-action-btn">
                          Platform Direct
                        </Button>
                      )} */}
                    </Space>
                  </Card>

                  <Divider className="hub-divider" />

                  {/* Internal Notes (Intelligence Tab) */}
                  <Card bordered={false} className="notes-card-hub borderless-card" title={<Space><FileText size={14} /> Internal notes</Space>}>
                    <div className="notes-display-hub" style={{ minHeight: 60 }}>
                      <Text style={{ fontStyle: 'italic', color: '#64748b' }}>
                        {lead.internal_notes || "No internal strategic notes recorded for this entity."}
                      </Text>
                    </div>
                  </Card>
                </Space>
              </Col>
            </Row>
          </div>

          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                }}>
                  <Rocket size={18} color="#fff" />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Initialize Project</Title>
                  <Text style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Convert lead to active client & project</Text>
                </div>
              </div>
            }
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={[
              <Button 
                key="cancel" 
                onClick={() => setIsModalOpen(false)} 
                style={{ 
                  borderRadius: '10px', 
                  height: '42px', 
                  padding: '0 20px',
                  fontWeight: 600,
                  border: '1px solid #e2e8f0'
                }}
              >
                Cancel
              </Button>,
              currentStep > 0 && (
                <Button 
                  key="back" 
                  onClick={() => setCurrentStep(currentStep - 1)} 
                  style={{ 
                    borderRadius: '10px', 
                    height: '42px', 
                    padding: '0 20px',
                    fontWeight: 600
                  }}
                >
                  Back
                </Button>
              ),
              currentStep < 1 ? (
                <Button 
                  key="next"
                  type="primary" 
                  onClick={async () => {
                    try {
                      await initForm.validateFields(['client_name', 'client_mail']);
                      setCurrentStep(1);
                    } catch (err) {}
                  }}
                  style={{ 
                    borderRadius: '10px', 
                    height: '42px', 
                    padding: '0 24px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  key="create"
                  type="primary" 
                  loading={onboarding}
                  onClick={() => initForm.submit()}
                  style={{ 
                    borderRadius: '10px', 
                    height: '42px', 
                    padding: '0 28px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Create Project
                </Button>
              )
            ]}
            width={580}
            centered
            className="premium-modal-v2"
          >
            <div style={{ padding: '4px 0' }}>
              <Steps
                current={currentStep}
                items={[
                  { 
                    title: <span style={{ fontWeight: 700 }}>Client Profile</span>, 
                    icon: <UserCheck size={20} />,
                    description: <span style={{ fontSize: '11px' }}>Identify identity</span>
                  },
                  { 
                    title: <span style={{ fontWeight: 700 }}>Project Scope</span>, 
                    icon: <Briefcase size={20} />,
                    description: <span style={{ fontSize: '11px' }}>Define requirements</span>
                  },
                ]}
                style={{ marginBottom: 24 }}
                className="premium-steps"
              />
              
              <Form
                form={initForm}
                layout="vertical"
                onFinish={handleOnboard}
                onFinishFailed={(errorInfo) => {
                  console.error('Validation Failed:', errorInfo);
                  message.error("Please fill all required fields correctly");
                }}
                requiredMark={false}
              >
                {currentStep === 0 && (
                  <div className="step-content animate-fade-in">
                    <div style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-blue-50)', borderRadius: '12px', border: '1px solid var(--border-blue-200)' }}>
                      <Space align="start" size={12}>
                        <div style={{ color: 'var(--premium-blue)', marginTop: '2px' }}><Info size={16} /></div>
                        <div>
                          <Text strong style={{ display: 'block', fontSize: '13px' }}>Client Verification</Text>
                          <Text style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Confirm the client's contact information. This will be used for invoicing and communication.</Text>
                        </div>
                      </Space>
                    </div>

                    <Row gutter={12}>
                      <Col span={24}>
                        <Form.Item 
                          name="client_name" 
                          label={<span className="form-label-premium">Full Name / Company</span>} 
                          rules={[{ required: true, message: 'Please enter client name' }]}
                        >
                          <Input prefix={<UserCheck size={14} color="var(--text-secondary)" />} placeholder="e.g. John Doe / Acme Corp" className="premium-input-v2" />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item 
                          name="client_mail" 
                          label={<span className="form-label-premium">Primary Email Address</span>} 
                          rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
                        >
                          <Input prefix={<Mail size={14} color="var(--text-secondary)" />} placeholder="client@example.com" className="premium-input-v2" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name="client_phone" 
                          label={<span className="form-label-premium">Contact Number</span>}
                        >
                          <Input prefix={<Phone size={14} color="var(--text-secondary)" />} placeholder="+1 (555) 000-0000" className="premium-input-v2" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name="client_location" 
                          label={<span className="form-label-premium">Client Location</span>}
                        >
                          <Input prefix={<Globe size={14} color="var(--text-secondary)" />} placeholder="e.g. New York, USA" className="premium-input-v2" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="step-content animate-fade-in">
                    <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <Space align="start" size={8}>
                        <div style={{ color: '#10b981', marginTop: '2px' }}><Zap size={14} /></div>
                        <div>
                          <Text strong style={{ display: 'block', fontSize: '13px' }}>Project Definition</Text>
                          <Text style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Define the scope and budget for this project. These details can be refined later in the project dashboard.</Text>
                        </div>
                      </Space>
                    </div>

                    <Form.Item 
                      name="title" 
                      label={<span className="form-label-premium">Project Title</span>} 
                      rules={[{ required: true, message: 'Please enter project title' }]}
                    >
                      <Input prefix={<LayoutIcon size={14} color="var(--text-secondary)" />} placeholder="e.g. Full Stack Dashboard Development" className="premium-input-v2" />
                    </Form.Item>
                    
                    <Form.Item 
                      name="summary" 
                      label={<span className="form-label-premium">Strategic Summary</span>}
                    >
                      <Input.TextArea rows={4} placeholder="Briefly describe the project goals and delivery expectations..." className="premium-input-v2" />
                    </Form.Item>
                    
                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item 
                          name="budget" 
                          label={<span className="form-label-premium">Estimated Budget</span>}
                        >
                          <Input prefix={<DollarSign size={16} color="var(--text-secondary)" />} placeholder="e.g. $5,000" className="premium-input-v2" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name="experience_level" 
                          label={<span className="form-label-premium">Expertise Level</span>}
                        >
                          <Input prefix={<Star size={16} color="var(--text-secondary)" />} placeholder="e.g. Expert / Senior" className="premium-input-v2" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )}
              </Form>
            </div>
          </Modal>

          <style dangerouslySetInnerHTML={{
            __html: `
            .premium-modal-v2 .ant-modal-content {
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
              border: 1px solid var(--border-color);
              background: var(--bg-pure-white);
            }
            .premium-modal-v2 .ant-modal-header {
              margin-bottom: 16px;
              border-bottom: none;
            }
            .form-label-premium {
              font-size: 11px;
              font-weight: 800;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 6px;
              display: block;
            }
            .premium-input-v2 {
              border-radius: 12px !important;
              padding: 10px 16px !important;
              border: 1.5px solid var(--border-color) !important;
              background: var(--bg-pure-white) !important;
              transition: all 0.2s ease !important;
            }
            .premium-input-v2:hover {
              border-color: var(--border-hover) !important;
            }
            .premium-input-v2:focus, .premium-input-v2-focused {
              border-color: var(--premium-blue) !important;
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
              background: var(--bg-pure-white) !important;
            }
            .premium-steps .ant-steps-item-icon {
              width: 38px !important;
              height: 38px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 10px !important;
              font-size: 16px !important;
              position: relative !important;
            }
            .premium-steps .ant-steps-item-icon svg {
              width: 18px !important;
              height: 18px !important;
              position: absolute !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
            }
            .premium-steps .ant-steps-item-process .ant-steps-item-icon {
              background: var(--premium-blue) !important;
              border-color: var(--premium-blue) !important;
            }
            .premium-steps .ant-steps-item-process .ant-steps-item-icon svg {
              color: #fff !important;
              stroke: #fff !important;
            }
            .premium-steps .ant-steps-item-finish .ant-steps-item-icon {
              border-color: #10b981 !important;
              color: #10b981 !important;
            }
            .premium-steps .ant-steps-item-finish .ant-steps-item-icon svg {
              color: #10b981 !important;
              stroke: #10b981 !important;
            }
            .premium-steps .ant-steps-item-wait .ant-steps-item-icon svg {
              color: var(--text-secondary) !important;
              stroke: var(--text-secondary) !important;
            }
            .premium-steps .ant-steps-item-title {
              font-weight: 700 !important;
              line-height: 1.2 !important;
            }
            .animate-fade-in {
              animation: modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes modalFadeIn {
              from { opacity: 0; transform: translateY(15px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .lead-intelligence-hub {
              background: var(--bg-pure-white); /* Match layout to remove top/bottom bars */
              min-height: 100%; 
              padding-bottom: 60px;
              font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
              margin: 0 -8px -60px -8px; /* Cancel layout padding and bottom gap */
            }


            .hub-header {
              background: var(--bg-pure-white); padding: 12px 24px; border-bottom: 1px solid var(--border-color);
              position: sticky; top: 0; z-index: 100; margin-bottom: 16px;
            }

            .hub-category { font-size: 10px; font-weight: 800; color: var(--text-slate-400); letter-spacing: 0.1em; display: block; }
            .hub-main-title { margin: 4px 0 0 0 !important; font-size: 18px !important; font-weight: 700 !important; color: #1e293b; }

            .hub-content { padding: 0 24px; background: var(--bg-pure-white); }
            
            .borderless-card { border: none !important; box-shadow: none !important; background: transparent !important; border-radius: 0 !important; }
            .ant-card-head { border-bottom: none !important; padding: 0 !important; min-height: auto !important; margin-bottom: 16px !important; }
            .ant-card-head-title { font-size: 11px !important; font-weight: 800 !important; color: #94a3b8 !important; letter-spacing: 0.1em; text-transform: uppercase; }
            .ant-card-body { padding: 0 !important; }

            .hub-divider { margin: 12px 0 16px 0 !important; border-top: 2px solid var(--border-color) !important; }
            .hub-divider-light { margin: 8px 0 12px 0 !important; border-top: 1.5px solid var(--border-color) !important; }
            .spend-divider { margin: -15px 0 12px 0 !important; }
            
            .hub-center-col-border {
              border-left: 2px solid var(--border-color);
              border-right: 2px solid var(--border-color);
              padding: 0 24px !important;
            }
            .hub-right-col-border {
              padding-left: 24px !important;
            }

            .avatar-hub { width: 50px; height: 50px; border-radius: 12px; background: #3b82f6; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; }
            .client-profile-header { display: flex; gap: 16px; align-items: center; }
            .client-name-hub { margin: 0 !important; font-size: 16px !important; font-weight: 800; }
            .client-meta-hub { font-size: 12px; color: #94a3b8; }
            
            .platform-tag-hub {
              padding: 4px 12px !important; border-radius: 8px !important; border: 1px solid #e2e8f0 !important;
              background: #f8fafc !important; font-size: 12px !important; font-weight: 700 !important; color: #334155 !important;
              height: auto !important; margin: 0 !important;
            }
            .rating-tag-hub {
              display: flex !important; align-items: center !important; gap: 6px !important; 
              padding: 4px 10px !important; border-radius: 8px !important; border: 1px solid #e2e8f0 !important; 
              background: #fff !important; color: #334155 !important; font-weight: 700 !important; font-size: 12px !important;
              background: #fff !important; color: #334155 !important; font-weight: 600 !important; font-size: 12px !important;
              height: auto !important; margin: 0 !important;
            }

            .spend-box-hub { margin-top: 8px; padding-top: 8px; }
            .spend-label { font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
            .spend-value { margin: 4px 0 0 0 !important; color: #10b981 !important; font-weight: 600 !important; font-size: 20px !important; margin-bottom: 0 !important; }

            .budget-metrics-grid { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
            .budget-metric-item { flex: 1; }
            .metric-divider-v-small { width: 1px; height: 25px; background: var(--border-color); }

            .contact-badge-v2 { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; background: #f0f7ff; color: #2563eb; border: 1px solid #dbeafe; }
            .contact-text { color: #1e293b !important; font-size: 13px !important; font-weight: 600 !important; }
            .trust-badge-v2 { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; border: 1px solid transparent; transition: all 0.2s ease; }
            .trust-badge-v2.verified { background: rgba(16, 185, 129, 0.05); color: #059669; border-color: rgba(16, 185, 129, 0.1); }
            .trust-badge-v2.unverified { background: #f8fafc; color: #94a3b8; border-color: #f1f5f9; }
            .trust-text { color: inherit !important; font-size: 13px !important; font-weight: 600 !important; }

            .doc-item-hub { display: flex; align-items: center; gap: 8px; padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
            .doc-name-hub { flex: 1; font-size: 12px; font-weight: 600; }

            /* CENTER COLUMN */
            .spec-tag { background: #eff6ff; color: #2563eb; border: none; font-weight: 700; border-radius: 12px; padding: 2px 12px; font-size: 11px; }
            .spec-posted { font-size: 11px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; }
            .spec-title { margin: 12px 0 !important; font-size: 22px !important; font-weight: 700 !important; line-height: 1.3; color: #1e293b; }
            .hub-section-titles { font-size: 11px !important; font-weight: 800; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px !important; }
            .spec-text-flow { font-size: 15px; color: #475569; line-height: 1.7; display: block; transition: all 0.3s ease; }
            .spec-text-flow.clamped {
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .description-toggle-btn {
              padding: 0 !important;
              height: auto !important;
              font-weight: 700 !important;
              font-size: 14px !important;
              color: var(--premium-blue) !important;
              margin-top: 12px !important;
              display: flex !important;
              align-items: center !important;
              gap: 4px !important;
            }

            .arch-label { font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase; display: block; }
            .arch-tag { background: #fff; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; border-radius: 8px; padding: 4px 12px; font-size: 12px; }

            .skill-alignment-box { padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; margin-left: auto; width: 100%; max-width: 200px; text-align: right; }
            .alignment-stats { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 4px; }
            .alignment-score { font-size: 24px; font-weight: 800; color: #3b82f6; }
            .alignment-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
            .alignment-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); }

            .timeline-hub-item { display: flex; gap: 12px; align-items: center; }
            .hub-label { font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
            .hub-value { font-size: 13px; font-weight: 600; color: #1e293b; display: block; }

            .canvas-proposal-text { font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-wrap; display: block; max-height: 240px; overflow-y: auto; padding-right: 8px; }
            .canvas-footer-hub { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(59, 130, 246, 0.1); display: flex; justify-content: space-between; align-items: center; }

            /* RIGHT COLUMN */
            .win-prob-wrapper-hub { display: flex; justify-content: center; margin: 12px 0; }
            .donut-hub-v2 { width: 100px; height: 100px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .donut-val-v2 { font-size: 24px; font-weight: 700; color: #1e293b; line-height: 1; }
            .donut-sub-v2 { font-size: 9px; font-weight: 800; color: #94a3b8; }
            .donut-hub-v2 svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

            .insight-row-hub { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 12px; font-weight: 600; }
            .score-track-hub { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; margin-top: 4px; }
            .score-fill-hub { height: 100%; background: #3b82f6; border-radius: 10px; }

            .hub-value-v2 { font-size: 14px; font-weight: 600; color: #1e293b; display: block; margin-top: 4px; }
            .hub-action-btn { margin-top: 12px; height: 40px; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; }

            .notes-display-hub { padding: 12px; background: var(--bg-blue-50); border: 1px solid var(--border-blue-200); border-radius: 12px; min-height: 60px; font-size: 13px; line-height: 1.6; }

            [data-theme='dark'] .lead-intelligence-hub { background: var(--bg-pure-white) !important; }
            [data-theme='dark'] .hub-header { background: var(--bg-pure-white) !important; border-color: #1F2937 !important; }
            [data-theme='dark'] .hub-content { background: var(--bg-pure-white) !important; }
            [data-theme='dark'] .identity-section-hub, 
            [data-theme='dark'] .borderless-card,
            [data-theme='dark'] .ant-card-head { background: transparent !important; }
            
            [data-theme='dark'] .ant-card-head-title { color: #94A3B8 !important; }
            [data-theme='dark'] .hub-divider { border-top-color: #1F2937 !important; }
            [data-theme='dark'] .hub-divider-light { border-top-color: #161B22 !important; }
            [data-theme='dark'] .hub-center-col-border { border-left-color: #1F2937 !important; border-right-color: #1F2937 !important; }

            [data-theme='dark'] .doc-item-hub { background: #161B22 !important; border-color: #1F2937 !important; }
            [data-theme='dark'] .skill-alignment-box { background: #161B22 !important; border-color: #1F2937 !important; }
            [data-theme='dark'] .notes-display-hub { background: rgba(59, 130, 246, 0.05) !important; border-color: rgba(59, 130, 246, 0.2) !important; color: #CBD5E1 !important; }
            
            [data-theme='dark'] .spec-title { color: #F1F5F9 !important; }
            [data-theme='dark'] .spec-text-flow { color: #94A3B8 !important; }
            [data-theme='dark'] .hub-label { color: #64748B !important; }
            [data-theme='dark'] .hub-value { color: #F1F5F9 !important; }
            [data-theme='dark'] .hub-value-v2 { color: #F1F5F9 !important; }
            [data-theme='dark'] .arch-label { color: #64748B !important; }
            [data-theme='dark'] .arch-tag { background: #161B22 !important; border-color: #374151 !important; color: #CBD5E1 !important; }
            [data-theme='dark'] .donut-val-v2 { color: #F1F5F9 !important; }
            
            /* Action Button Dark Mode */
            [data-theme='dark'] .hub-action-btn { background: #161B22 !important; border-color: #374151 !important; color: #CBD5E1 !important; }
            [data-theme='dark'] .hub-action-btn:hover { border-color: var(--premium-blue) !important; color: var(--premium-blue) !important; }
            
            /* Contact Info Dark Mode */
            [data-theme='dark'] .contact-badge-v2 { background: rgba(59, 130, 246, 0.1) !important; color: var(--premium-blue) !important; border-color: rgba(59, 130, 246, 0.2) !important; }
            [data-theme='dark'] .contact-text { color: #CBD5E1 !important; }
            `}} />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
}

