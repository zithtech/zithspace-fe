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
} from "antd";
import {
  ArrowLeft,
  Layers,
  FileText,
  ShieldCheck,
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
  const { lead, loading, error, fetchLeadById } = useLeads();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("1");

  useEffect(() => {
    if (params.id) {
      fetchLeadById(params.id as string);
    }
  }, [params.id, fetchLeadById]);

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
        <div className="lead-profile-container">
          
          {/* Glass Header - Compressed */}
          <div className="glass-header">
            <div className="breadcrumb-nav">
              <Breadcrumb separator={<span style={{ color: 'var(--text-slate-400)', opacity: 0.5 }}>&gt;</span>}>
                <Breadcrumb.Item>
                  <span onClick={() => router.push('/leads')} className="breadcrumb-link" style={{ cursor: 'pointer' }}>Leads</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  <span className="breadcrumb-current" style={{ color: 'var(--premium-blue)', fontWeight: 700 }}>{lead.client_name}</span>
                </Breadcrumb.Item>
              </Breadcrumb>
            </div>

            <Row justify="space-between" align="middle">
              <Col>
                <Space size={16} align="center">
                  <Button 
                    icon={<ArrowLeft size={16} />} 
                    onClick={() => router.push("/leads")}
                    className="back-btn"
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: 'wrap' }}>
                      <Title level={1} style={{ margin: 0, fontWeight: 800, color: "var(--text-slate-900)", fontSize: 26 }}>
                        {lead.title}
                      </Title>
                      <Tag className="status-badge" color={lead.status === 'Open' ? 'green' : lead.status === 'In Progress' ? 'blue' : 'default'}>
                        {lead.status?.toUpperCase()}
                      </Tag>
                    </div>
                    <div className="meta-info">
                      <Space size={16}>
                        <Space size={4}><Globe size={12} /> <Text className="meta-text">{lead.platform || "Upwork"}</Text></Space>
                        <Space size={4}><Calendar size={12} /> <Text className="meta-text">Posted {lead.posted_on ? dayjs(lead.posted_on).fromNow() : 'N/A'}</Text></Space>
                        <Space size={4}><Briefcase size={12} /> <Text className="meta-text">{lead.job_type || 'N/A'}</Text></Space>
                      </Space>
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Main Content Area - Full Width */}
          <div className="profile-content">
            <Row gutter={[20, 20]}>
              <Col span={24}>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  className="modern-tabs"
                  items={[
                    {
                      key: "1",
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Layers size={14} /> Overview
                        </div>
                      ),
                      children: (
                         <div className="tab-pane fade-in">
                           {/* Row 1: 1:2 Sidebar Layout */}
                           <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
                             {/* Sidebar: Client Details */}
                             <Col xs={24} lg={8}>
                               <Card className="premium-section-card" style={{ height: '100%' }} title={<Space><ShieldCheck size={14} /> Client Identity</Space>}>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                   <div className="data-field">
                                     <Text className="label">CLIENT NAME</Text>
                                     <Text className="value" style={{ fontSize: 15 }}>{lead.client_name}</Text>
                                   </div>
                                   <div className="data-field">
                                     <Text className="label">COMMUNICATION</Text>
                                     <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                       <Space className="value"><Mail size={12} /> {lead.client_mail}</Space>
                                       {lead.client_phone && <Space className="value"><Phone size={12} /> {lead.client_phone}</Space>}
                                     </Space>
                                   </div>
                                   <div className="data-field">
                                     <Text className="label">GLOBAL PRESENCE</Text>
                                     <Space className="value"><MapPin size={12} /> {lead.client_location || 'Global Territory'}</Space>
                                   </div>
                                   {lead.platform && (
                                     <div className="data-field">
                                       <Text className="label">SOURCE NODE</Text>
                                       <Tag color="blue" style={{ borderRadius: 4, margin: 0, fontWeight: 700, fontSize: 10 }}>{lead.platform.toUpperCase()}</Tag>
                                     </div>
                                   )}
                                 </div>
                               </Card>
                             </Col>

                             {/* Main Center: AI Score & Timeline stacked */}
                             <Col xs={24} lg={16}>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                 {/* AI Score Node */}
                                 <Card className="ai-score-internal-card" style={{ padding: '14px 16px' }}>
                                   <div className="glow-orb"></div>
                                   <Row align="middle" gutter={20}>
                                     <Col span={10}>
                                       <Text className="ai-label">INTEL MATCH SCORE</Text>
                                       <div className="score-container">
                                         <Title className="score-number">{Math.round(lead.ai_score || 0)}</Title>
                                         <Text className="score-denominator">/100</Text>
                                       </div>
                                       <div className="progress-track" style={{ height: 6 }}>
                                         <div 
                                           className="progress-fill" 
                                           style={{ 
                                             width: `${lead.ai_score || 0}%`, 
                                             background: (lead.ai_score || 0) > 70 ? 'var(--premium-blue)' : (lead.ai_score || 0) > 40 ? '#f59e0b' : '#ef4444' 
                                           }} 
                                         />
                                       </div>
                                     </Col>
                                     <Col span={14}>
                                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                            <Sparkles size={12} color="var(--premium-blue)" />
                                            <Text strong style={{ fontSize: 10, color: 'var(--premium-blue)' }}>AI INSIGHT</Text>
                                          </div>
                                          <Text style={{ fontSize: 11, color: 'var(--text-slate-600)', lineHeight: 1.3 }}>
                                            This lead shows a {(lead.ai_score || 0) > 80 ? 'high compatibility' : 'potential engagement'} index based on historical conversion vectors and skill alignment.
                                          </Text>
                                        </div>
                                     </Col>
                                   </Row>
                                 </Card>

                                 {/* Sequence Timeline Node */}
                                 <Card className="timeline-internal-card" title={<Space><Clock size={16} /> Sequence Timeline</Space>}>
                                    <Row gutter={24}>
                                      <Col span={12}>
                                         <div className="timeline-item-compact">
                                            <div className="item-icon"><Calendar size={16} /></div>
                                            <div className="item-details">
                                               <Text className="item-label">Implementation Cycle</Text>
                                               <Text className="item-value">
                                                  {lead.timeline_start ? (
                                                    `${dayjs(lead.timeline_start).format('MMM DD')} — ${dayjs(lead.timeline_end).format('MMM DD, YYYY')}`
                                                  ) : 'Pending Schedule'}
                                               </Text>
                                            </div>
                                         </div>
                                      </Col>
                                      <Col span={12}>
                                         <div className="timeline-item-compact">
                                            <div className="item-icon pulse"><Zap size={16} /></div>
                                            <div className="item-details">
                                               <Text className="item-label">Strategic Next Step</Text>
                                               <Text className="item-value">{lead.actions_item || 'Awaiting Orchestration'}</Text>
                                            </div>
                                         </div>
                                      </Col>
                                    </Row>
                                 </Card>
                               </div>
                             </Col>
                           </Row>

                           {/* Row 3: Job Specification */}
                           <Card className="premium-section-card" title={<Space><FileText size={16} /> Job Specification</Space>}>
                             <div className="summary-box">
                               <Text className="summary-text">{lead.summary || "No description provided."}</Text>
                             </div>
                             <div className="skills-cloud">
                               <Text className="label" style={{ marginBottom: 12, display: 'block' }}>REQUIRED SKILLS</Text>
                               <Space wrap size={[6, 10]}>
                                 {(lead.skills || []).map(skill => (
                                   <Tag key={skill} className="skill-tag">{skill}</Tag>
                                 ))}
                               </Space>
                             </div>
                           </Card>
                         </div>
                      )
                    },
                    {
                      key: "2",
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Briefcase size={14} /> Requirements
                        </div>
                      ),
                      children: (
                        <div className="tab-pane fade-in">
                          <Row gutter={[20, 20]}>
                            <Col xs={24} lg={16}>
                              <Card className="premium-section-card no-padding" style={{ height: '100%' }}>
                                <div className="card-header-minimal" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <BarChart3 size={14} /> Project Intelligence Metrics
                                </div>
                                <div style={{ padding: 20 }}>
                                  <Row gutter={[24, 20]}>
                                    {[
                                      { label: 'ESTIMATED BUDGET', value: lead.budget, icon: <DollarSign size={14} />, color: '#3b82f6', highlight: true },
                                      { label: 'WORK ARCHITECTURE', value: lead.job_type, icon: <Briefcase size={14} />, color: '#6366f1' },
                                      { label: 'REQUISITE EXPERIENCE', value: lead.experience_level, icon: <UserCheck size={14} />, color: '#10b981' },
                                      { label: 'PROJECT DURATION', value: lead.duration, icon: <Clock size={14} />, color: '#f59e0b' },
                                      { label: 'BILLED RATE ($)', value: lead.hourly_rate || lead.hour_based_amount, icon: <Zap size={14} />, color: '#8b5cf6' },
                                      { label: 'POSTED ON', value: lead.posted_on ? dayjs(lead.posted_on).format('MMM DD, YYYY') : null, icon: <Calendar size={14} />, color: '#64748b' }
                                    ].map((item, idx) => (
                                      <Col xs={12} sm={8} key={idx}>
                                        <div className="stat-field-premium">
                                          <Space size={6} style={{ marginBottom: 4 }}>
                                            <div style={{ color: item.color, display: 'flex' }}>{item.icon}</div>
                                            <Text className="label" style={{ margin: 0, fontSize: 8, fontWeight: 700, letterSpacing: '0.05em' }}>{item.label}</Text>
                                          </Space>
                                          <Text style={{ 
                                            display: 'block', 
                                            fontSize: 15, 
                                            fontWeight: 700, 
                                            color: item.highlight ? 'var(--premium-blue)' : 'var(--text-main)',
                                            marginLeft: 20
                                          }}>
                                            {item.value || 'N/A'}
                                          </Text>
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                </div>
                              </Card>
                            </Col>

                            {lead.job_link && (
                              <Col xs={24} lg={8}>
                                <Card className="external-source-card-v2" style={{ height: '100%' }}>
                                  <div className="source-grid-bg"></div>
                                  <div className="source-content">
                                    <div className="source-icon-wrapper">
                                      <ExternalLink size={20} />
                                    </div>
                                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                      <Text className="source-tag">ORIGIN PLATFORM</Text>
                                      <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)', fontSize: 18 }}>{lead.platform || 'Upwork'}</Title>
                                    </div>
                                    <Button 
                                      type="primary" 
                                      href={lead.job_link} 
                                      target="_blank" 
                                      block 
                                      icon={<Sparkles size={14} />}
                                      className="source-action-btn"
                                    >
                                      Access Intelligence
                                    </Button>
                                  </div>
                                </Card>
                              </Col>
                            )}
                          </Row>
                        </div>
                      )
                    },
                    {
                      key: "3",
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Star size={14} /> Persona
                        </div>
                      ),
                      children: (
                        <div className="tab-pane fade-in">
                          <Row gutter={[20, 20]}>
                            <Col xs={24} sm={12}>
                                <Card className="metric-card-premium">
                                  <div className="metric-header">
                                    <Star size={12} className="metric-icon" color="#fbbf24" fill="#fbbf24" />
                                    <Text className="metric-label">CLIENT RATING</Text>
                                  </div>
                                  <div className="metric-body">
                                    <Text className="metric-value-large">{lead.client_rating || '0.0'}</Text>
                                    <div className="rating-stars-wrapper">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          size={14} 
                                          fill={i < Math.floor(Number(lead.client_rating) || 0) ? "#fbbf24" : "transparent"} 
                                          color={i < Math.floor(Number(lead.client_rating) || 0) ? "#fbbf24" : "#e2e8f0"} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card className="metric-card-premium spend-vault">
                                  <div className="metric-header">
                                    <DollarSign size={12} className="metric-icon" color="#3b82f6" />
                                    <Text className="metric-label">TOTAL SPEND</Text>
                                  </div>
                                   <div className="metric-body">
                                    <Text className="metric-value-large highlight">{lead.client_spend || 'N/A'}</Text>
                                    <Text className="metric-subtext-v2">Cumulative Platform Investment</Text>
                                  </div>
                                </Card>
                             </Col>
                             <Col span={24}>
                               <Card className="premium-section-card no-padding" style={{ overflow: 'hidden' }}>
                                 <div className="card-header-minimal" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                   <ShieldCheck size={14} /> Trust & Authentication Ledger
                                 </div>
                                 <div style={{ padding: 16 }}>
                                   <Row gutter={16}>
                                     {[
                                       { title: 'Payment Architecture', status: lead.client_payment_verified ? 'Authenticated' : 'Unverified', verified: lead.client_payment_verified, desc: 'Verified identity and billing instrument.' },
                                       { title: 'Phone Validation', status: lead.client_phone_verified ? 'Validated' : 'Pending', verified: lead.client_phone_verified, desc: 'Successful multi-factor phone verification.' }
                                     ].map((v, i) => (
                                       <Col xs={24} md={12} key={i}>
                                         <div className={`verification-card-v2 ${v.verified ? 'is-verified' : 'is-pending'}`}>
                                           <div className="v2-icon-box">
                                             {v.verified ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                           </div>
                                           <div className="v2-info">
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                               <Text className="v2-title">{v.title}</Text>
                                               <Tag className={`v2-tag ${v.verified ? 'active' : 'inactive'}`}>{v.status}</Tag>
                                             </div>
                                             <Text className="v2-desc">{v.desc}</Text>
                                           </div>
                                         </div>
                                       </Col>
                                     ))}
                                   </Row>
                                 </div>
                               </Card>
                             </Col>
                          </Row>
                        </div>
                      )
                    },
                    {
                      key: "4",
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Zap size={14} /> Synthetic
                        </div>
                      ),
                      children: (
                        <div className="tab-pane fade-in">
                           <Card className="strategy-canvas-premium no-padding">
                             <div className="neural-header">
                               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                 <div className="engine-node pulse">
                                   <Zap size={14} fill="currentColor" />
                                 </div>
                                 <div>
                                   <Text className="engine-label" style={{ color: 'var(--text-main)', fontSize: 13 }}>AI Strategy Canvas</Text>
                                 </div>
                               </div>
                             </div>

                             <div className="canvas-body">
                               <div className="code-accent"></div>
                               <div className="proposal-text-flow">
                                 {lead.proposal_text || "No strategy architecture has been synthesized for this intelligence node. Initialize manual generation sequence."}
                               </div>
                             </div>

                             <div className="canvas-footer">
                               <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                 <div className="confidence-meter">
                                   <div className="meter-label">AI CONFIDENCE INDEX</div>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                     <Text className="meter-value">98.4%</Text>
                                     <div className="meter-track">
                                       <div className="meter-fill" style={{ width: '98.4%' }}></div>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="template-box">
                                   <div className="meter-label">CORE TEMPLATE</div>
                                   <Text style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{lead.template_used || 'DYNAMIC_A1'}</Text>
                                 </div>
                               </div>
                               <Space>
                                 <Button 
                                   type="primary" 
                                   icon={<Mail size={16} />} 
                                   className="canvas-deploy-btn"
                                 >
                                   Execute Deployment
                                 </Button>
                               </Space>
                             </div>
                           </Card>
                        </div>
                      )
                    },
                    {
                      key: "5",
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} /> Documents
                        </div>
                      ),
                      children: (
                        <div className="tab-pane fade-in">
                           <Card className="premium-section-card no-padding" style={{ overflow: 'hidden' }}>
                             <div className="card-header-minimal" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <Layers size={14} /> Document Vault
                             </div>
                             <div style={{ padding: 24 }}>
                               {lead.documents && lead.documents.length > 0 ? (
                                 <Row gutter={[16, 16]}>
                                   {lead.documents.map((doc: any, i: number) => {
                                     const docObj = typeof doc === 'string' ? { name: doc, url: doc } : doc;
                                     return (
                                     <Col xs={24} sm={12} md={8} xl={6} key={i}>
                                       <div className="document-vault-card">
                                          <div className="doc-icon-box"><FileText size={20} /></div>
                                          <div className="doc-info">
                                            <Text strong className="doc-name-small" ellipsis>{docObj.name || 'Secure Attachment'}</Text>
                                            <Text type="secondary" style={{fontSize: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Encrypted Asset</Text>
                                          </div>
                                          <Button 
                                            type="text" 
                                            shape="circle"
                                            icon={<ExternalLink size={14} />} 
                                            href={docObj.url} 
                                            target="_blank"
                                            className="doc-action-btn"
                                          />
                                       </div>
                                     </Col>
                                     );
                                   })}
                                 </Row>
                               ) : (
                                 <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                   <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5 }}>
                                     <Layers size={24} />
                                   </div>
                                   <Text style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>No encrypted assets found</Text>
                                 </div>
                               )}
                             </div>
                           </Card>
                        </div>
                      )
                    },
                    {
                      key: "6",
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Brain size={14} /> Intelligence
                        </div>
                      ),
                      children: (
                        <div className="tab-pane fade-in">
                          <Row gutter={[20, 20]}>
                            {lead.skill_analysis && (
                              <Col span={24}>
                                <Card className="premium-section-card no-padding" style={{ overflow: 'hidden' }}>
                                  <div className="card-header-minimal" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Zap size={14} /> Skill Alignment Matrix
                                  </div>
                                  <div style={{ padding: 24 }}>
                                    <Row gutter={[32, 32]} align="middle">
                                      <Col xs={24} md={6}>
                                        <div style={{ textAlign: 'center' }}>
                                          <div className="skill-match-dial">
                                            <div className="dial-percentage">{lead.skill_analysis.matchPercentage}%</div>
                                            <div className="dial-label">ALIGNMENT</div>
                                          </div>
                                        </div>
                                      </Col>
                                      <Col xs={24} md={18}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                              <div style={{ color: '#10b981' }}><CheckCircle2 size={16} /></div>
                                              <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Verified Capabilities</Text>
                                            </div>
                                            <Space wrap size={[8, 8]}>
                                              {lead.skill_analysis.matchedSkills.length > 0 ? (
                                                lead.skill_analysis.matchedSkills.map((skill: string) => (
                                                  <Tag key={skill} className="skill-tag match-premium">{skill}</Tag>
                                                ))
                                              ) : <Text type="secondary" italic>No verified capabilities mapped</Text>}
                                            </Space>
                                          </div>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                              <div style={{ color: '#f59e0b' }}><AlertCircle size={16} /></div>
                                              <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Capability Gaps</Text>
                                            </div>
                                            <Space wrap size={[8, 8]}>
                                              {lead.skill_analysis.missingSkills.length > 0 ? (
                                                lead.skill_analysis.missingSkills.map((skill: string) => (
                                                  <Tag key={skill} className="skill-tag gap-premium">{skill}</Tag>
                                                ))
                                              ) : <Text type="secondary" italic>Complete capability coverage</Text>}
                                            </Space>
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
                                  </div>
                                </Card>
                              </Col>
                            )}
                            
                            <Col span={24}>
                              <Card className="intelligence-summary-card">
                                <div className="summary-header">
                                  <Sparkles size={16} color="var(--premium-blue)" /> <span>AI Intelligence Summary</span>
                                </div>
                                <div className="summary-content">
                                  {lead.ai_summary || lead.summary ? (
                                    <>
                                      {!lead.ai_summary && <div className="extracted-badge">EXTRACTED FROM LISTING</div>}
                                      <Text className="summary-text-flow">
                                        {lead.ai_summary || lead.summary}
                                      </Text>
                                    </>
                                  ) : (
                                    <div className="empty-intelligence">
                                      <Sparkles size={32} className="empty-icon" />
                                      <Text>No intelligence details extracted for this lead node.</Text>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                            
                            <Col span={24}>
                              <Card className="notes-vault-card">
                                <div className="notes-header">
                                  <FileText size={16} /> <span>Internal Intelligence Notes</span>
                                </div>
                                <div className="notes-content">
                                  {lead.internal_notes ? (
                                    <Text className="notes-text-flow">{lead.internal_notes}</Text>
                                  ) : (
                                    <div className="empty-notes">
                                      <FileText size={24} className="empty-icon" />
                                      <Text>No internal notes recorded for this lead node.</Text>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          </Row>
                        </div>
                      )
                    }
                  ]}
                />
              </Col>
            </Row>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            :root {
              --glass-bg: rgba(255, 255, 255, 0.7);
              --glass-border: rgba(255, 255, 255, 0.8);
              --premium-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
              --card-bg: #ffffff;
              --input-bg: #f8fafc;
              --text-main: #1e293b;
              --text-muted: #64748b;
              --border-premium: #f1f5f9;
            }

            [data-theme='dark'] {
              --glass-bg: rgba(15, 23, 42, 0.7);
              --glass-border: rgba(30, 41, 59, 0.8);
              --premium-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);
              --card-bg: #161b22;
              --input-bg: #1e293b;
              --text-main: #f1f5f9;
              --text-muted: #94a3b8;
              --border-premium: #334155;
            }

            .lead-profile-container {
              margin: 0 -24px;
              padding: 0 24px 24px 24px;
              background: var(--bg-primary);
              min-height: 100vh;
            }

            .glass-header {
              padding: 20px 32px;
              margin: 0 -24px 24px -24px;
              background: var(--glass-bg);
              backdrop-filter: blur(20px);
              border-bottom: 1px solid var(--glass-border);
              position: sticky;
              top: 0;
              z-index: 100;
              box-shadow: 0 2px 10px -2px rgba(0,0,0,0.05);
            }

            .breadcrumb-nav { margin-bottom: 12px; }
            .breadcrumb-link { cursor: pointer; color: var(--text-muted); font-size: 11px; }
            .breadcrumb-current { color: var(--text-main); font-weight: 600; font-size: 11px; }

            .back-btn {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              border: 1px solid var(--border-premium);
              background: var(--card-bg) !important;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .status-badge { font-size: 10px; font-weight: 800; padding: 2px 10px; border-radius: 20px; border: none; }
            .meta-text { color: var(--text-muted); font-size: 12px; font-weight: 500; }

            .primary-action-btn { height: 38px; border-radius: 10px; padding: 0 20px !important; font-weight: 700 !important; font-size: 13px; }
            .secondary-action-btn { height: 38px; border-radius: 10px; color: var(--premium-blue); font-weight: 600; font-size: 13px; }

            .modern-tabs .ant-tabs-nav { margin-bottom: 20px !important; }
            .modern-tabs .ant-tabs-tab { padding: 10px 4px !important; margin-right: 32px !important; }
            .modern-tabs .ant-tabs-tab-btn { font-size: 14px !important; font-weight: 600 !important; }

            .premium-section-card {
              border-radius: 16px;
              border: 1px solid var(--border-premium) !important;
              background: var(--card-bg) !important;
              box-shadow: var(--premium-shadow);
            }
            .premium-section-card .ant-card-head { border-bottom: 1px solid var(--border-premium); padding: 8px 16px; min-height: 40px; }
            .premium-section-card .ant-card-head-title { font-size: 13px; font-weight: 700; color: var(--text-main); }
            .premium-section-card .ant-card-body { padding: 16px; }

            /* Internal Stats Styling */
            .ai-score-internal-card {
              border-radius: 16px;
              background: var(--card-bg) !important;
              border: 1px solid var(--border-premium) !important;
              padding: 16px;
              position: relative;
              overflow: hidden;
              box-shadow: var(--premium-shadow);
              height: 100%;
            }
            .ai-label { color: var(--text-muted); font-size: 9px; font-weight: 800; letter-spacing: 0.1em; display: block; margin-bottom: 8px; }
            .score-container { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
            .score-number { color: var(--premium-blue) !important; font-size: 40px !important; margin: 0 !important; font-weight: 800 !important; line-height: 1; }
            .score-denominator { color: var(--text-muted); font-size: 12px; opacity: 0.6; }
            .progress-track { width: 100%; height: 5px; background: var(--border-slate-100); border-radius: 10px; overflow: hidden; }

            .timeline-internal-card { height: 100%; border-radius: 16px; border: 1px solid var(--border-premium) !important; background: var(--card-bg) !important; }
            .timeline-internal-card .ant-card-head { border-bottom: 1px solid var(--border-premium); padding: 8px 16px; min-height: 38px; }
            .timeline-internal-card .ant-card-head-title { font-size: 12px; font-weight: 700; }
            
            .timeline-item-compact { display: flex; gap: 8px; align-items: center; padding: 4px 0; }
            .item-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--bg-blue-50); color: var(--premium-blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .item-label { display: block; font-size: 8px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px; }
            .item-value { font-size: 12px; font-weight: 700; color: var(--text-main); }

            .data-field .label { display: block; font-size: 9px; font-weight: 800; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 2px; }
            .data-field .value { font-size: 13px; font-weight: 600; color: var(--text-main); }

            .summary-box { background: var(--input-bg); padding: 12px; border-radius: 12px; border: 1px solid var(--border-premium); margin-bottom: 16px; }
            .summary-text { font-size: 14px; line-height: 1.6; color: var(--text-main); }

            .stat-field .label { font-size: 9px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block; }
            .stat-field .stat-value { font-size: 16px; font-weight: 700; }
            .stat-field .stat-value.highlight { color: var(--premium-blue); }

             .metric-card-premium {
               border-radius: 16px;
               border: 1px solid var(--border-premium) !important;
               background: var(--card-bg) !important;
               box-shadow: var(--premium-shadow);
               height: 100%;
               padding: 16px;
             }
             .metric-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
             .metric-icon { opacity: 0.8; }
             .metric-label { font-size: 9px; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; margin: 0; }
             .metric-body { display: flex; flex-direction: column; align-items: flex-start; }
             .metric-value-large { font-size: 32px; font-weight: 800; color: var(--text-main); line-height: 1; margin-bottom: 8px; }
             .metric-value-large.highlight { color: var(--premium-blue); }
             .rating-stars-wrapper { display: flex; gap: 2px; }
             .metric-subtext-v2 { font-size: 11px; color: var(--text-muted); opacity: 0.6; font-weight: 500; }
 
             .verification-card-v2 {
               display: flex;
               gap: 12px;
               padding: 12px;
               background: var(--bg-slate-50);
               border: 1px solid var(--border-premium);
               border-radius: 12px;
               transition: all 0.3s ease;
               margin-bottom: 8px;
             }
             .verification-card-v2.is-verified { border-left: 3px solid #10b981; }
             .verification-card-v2.is-pending { border-left: 3px solid #f59e0b; }
             .v2-icon-box {
               width: 32px;
               height: 32px;
               border-radius: 8px;
               display: flex;
               align-items: center;
               justify-content: center;
             }
             .is-verified .v2-icon-box { background: #ecfdf5; color: #10b981; }
             .is-pending .v2-icon-box { background: #fffbeb; color: #f59e0b; }
             .v2-info { flex: 1; }
             .v2-title { font-size: 12px; font-weight: 700; color: var(--text-main); }
             .v2-tag { font-size: 8px; font-weight: 800; text-transform: uppercase; border-radius: 4px; padding: 1px 6px; border: none; }
             .v2-tag.active { background: #d1fae5; color: #065f46; }
             .v2-tag.inactive { background: #fef3c7; color: #92400e; }
             .v2-desc { display: block; font-size: 11px; color: var(--text-muted); line-height: 1.4; }

            .card-header-minimal { padding: 8px 16px; background: var(--bg-slate-50); border-bottom: 1px solid var(--border-premium); font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
 
            .stat-field-premium .label { display: block; filter: grayscale(1); opacity: 0.8; }
 
            .external-source-card-v2 {
              border-radius: 20px;
              border: 1px solid var(--border-premium) !important;
              background: var(--card-bg) !important;
              overflow: hidden;
              position: relative;
              box-shadow: var(--premium-shadow);
            }
            .source-grid-bg {
              position: absolute;
              top: 0; left: 0; right: 0; height: 80px;
              background: linear-gradient(135deg, var(--bg-blue-50) 0%, transparent 100%);
              background-image: radial-gradient(var(--premium-blue) 0.5px, transparent 0.5px);
              background-size: 12px 12px;
              opacity: 0.1;
            }
            .source-content {
              padding: 24px 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
              z-index: 1;
            }
            .source-icon-wrapper {
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: #fff;
              border: 1px solid var(--border-premium);
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
              color: var(--premium-blue);
              box-shadow: 0 4px 10px -2px rgba(59, 130, 246, 0.15);
            }
            .source-tag { display: block; font-size: 8px; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 4px; }
            .source-action-btn { height: 40px; border-radius: 12px; font-weight: 700; background: var(--premium-blue); border: none; box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.4); }
 
            .strategy-canvas-premium {
              border-radius: 20px;
              background: var(--card-bg) !important;
              border: 1px solid var(--border-premium) !important;
              overflow: hidden;
              box-shadow: var(--premium-shadow);
            }
            .neural-header {
              padding: 12px 16px;
              background: var(--bg-slate-50);
              border-bottom: 1px solid var(--border-premium);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .engine-node {
              width: 32px;
              height: 32px;
              background: var(--premium-blue);
              color: #fff;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            .engine-label { display: block; font-size: 10px; font-weight: 800; color: var(--premium-blue); letter-spacing: 0.1em; }
            .engine-status { display: block; font-size: 11px; color: var(--text-muted); font-weight: 500; }
            .meta-metric { text-align: right; }
            .m-label { display: block; font-size: 8px; font-weight: 800; color: var(--text-muted); opacity: 0.6; }
            .m-value { font-size: 12px; font-weight: 700; color: var(--text-main); font-family: 'JetBrains Mono', monospace; }

            .canvas-body {
              padding: 20px 24px;
              min-height: 250px;
              position: relative;
              background: var(--card-bg);
            }
            .code-accent {
              position: absolute;
              top: 16px; left: 16px;
              width: 2px; height: 40px;
              background: var(--premium-blue);
              opacity: 0.3;
            }
            .proposal-text-flow {
              font-size: 14px;
              line-height: 1.6;
              color: var(--text-main);
              max-width: 800px;
              margin: 0 auto;
              white-space: pre-wrap;
            }

            .canvas-footer {
              padding: 16px 20px;
              background: var(--card-bg);
              border-top: 1px solid var(--border-premium);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .meter-label { font-size: 9px; font-weight: 800; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 4px; }
            .meter-value { font-size: 13px; font-weight: 800; color: var(--premium-blue); }
            .meter-track { width: 100px; height: 6px; background: var(--bg-slate-50); border-radius: 10px; overflow: hidden; }
            .meter-fill { height: 100%; background: var(--premium-blue); border-radius: 10px; }

            .canvas-deploy-btn {
              height: 38px;
              padding: 0 20px !important;
              border-radius: 10px;
              font-weight: 700 !important;
              background: var(--premium-blue);
              border: none;
              box-shadow: 0 4px 12px -4px rgba(59, 130, 246, 0.4);
            }
            .canvas-secondary-btn {
              width: 38px;
              height: 38px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--card-bg);
              border: 1px solid var(--border-premium) !important;
              color: var(--text-muted);
              transition: all 0.2s;
            }
            .canvas-secondary-btn:hover { border-color: var(--premium-blue) !important; color: var(--premium-blue); }

            .proposal-canvas.compact { border-radius: 16px; }
            .proposal-canvas.compact .proposal-editor-mask { padding: 24px; min-height: 300px; }
            .proposal-canvas.compact .proposal-footer { padding: 12px 24px; }

            /* Documents & Intelligence Premium CSS */
            .document-vault-card {
              display: flex; gap: 12px; align-items: center; padding: 12px;
              background: var(--bg-slate-50); border: 1px solid var(--border-premium);
              border-radius: 12px; transition: all 0.2s;
            }
            .document-vault-card:hover { border-color: var(--premium-blue); box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.15); transform: translateY(-2px); }
            .doc-icon-box {
              width: 40px; height: 40px; border-radius: 10px; background: #fff;
              display: flex; align-items: center; justify-content: center; color: var(--premium-blue);
              border: 1px solid var(--border-premium); flex-shrink: 0;
            }
            .doc-info { flex: 1; overflow: hidden; }
            .doc-name-small { display: block; font-size: 13px; color: var(--text-main); line-height: 1.2; margin-bottom: 2px; }
            .doc-action-btn { color: var(--text-muted); }
            .doc-action-btn:hover { color: var(--premium-blue); background: var(--bg-blue-50); }

            .skill-tag { border: none; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
            .skill-tag.match-premium { background: var(--bg-slate-50); color: var(--text-main); border: 1px solid var(--border-premium); }
            .skill-tag.gap-premium { background: #fffbeb; color: #b45309; }

            .intelligence-summary-card {
              border-radius: 20px; border: 1px solid var(--border-blue-100) !important;
              background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-blue-50) 100%) !important;
              box-shadow: var(--premium-shadow); overflow: hidden;
            }
            .intelligence-summary-card .summary-header {
              padding: 16px 24px; border-bottom: 1px solid rgba(59, 130, 246, 0.1);
              display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 13px; color: var(--premium-blue);
            }
            .intelligence-summary-card .summary-content { padding: 24px; }
            .extracted-badge { display: inline-block; padding: 4px 10px; font-size: 9px; font-weight: 800; border-radius: 6px; background: rgba(59, 130, 246, 0.1); color: var(--premium-blue); margin-bottom: 16px; letter-spacing: 0.1em; }
            .summary-text-flow { font-size: 15px; line-height: 1.8; color: var(--text-main); white-space: pre-wrap; display: block; }
            
            .empty-intelligence { text-align: center; padding: 32px 0; }
            .empty-intelligence .empty-icon { color: var(--premium-blue); opacity: 0.2; margin-bottom: 12px; }
            .empty-intelligence Text { font-size: 13px; font-weight: 500; color: var(--text-muted); }

            .notes-vault-card {
              border-radius: 20px; border: 1px solid var(--border-premium) !important;
              background: var(--card-bg) !important; box-shadow: var(--premium-shadow); overflow: hidden;
            }
            .notes-vault-card .notes-header {
              padding: 16px 24px; background: var(--bg-slate-50); border-bottom: 1px solid var(--border-premium);
              display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 13px; color: var(--text-main);
            }
            .notes-vault-card .notes-content { padding: 24px; }
            .notes-text-flow { font-size: 14px; line-height: 1.7; color: var(--text-main); white-space: pre-wrap; display: block; }
            
            .empty-notes { text-align: center; padding: 32px 0; }
            .empty-notes .empty-icon { color: var(--text-muted); opacity: 0.2; margin-bottom: 12px; }
            .empty-notes Text { font-size: 13px; font-weight: 500; color: var(--text-muted); }

            .proposal-body { font-size: 14px; line-height: 1.7; }

            .document-card-compact { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--input-bg); border-radius: 10px; border: 1px solid var(--border-premium); }
            .doc-name-small { font-size: 12px; }
            
            /* Skill Analysis & Intelligence Styling */
            .skill-match-dial {
              width: 140px;
              height: 140px;
              border-radius: 50%;
              border: 8px solid #f1f5f9;
              border-top-color: var(--premium-blue);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              background: #fff;
              box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1);
            }
            .dial-percentage { font-size: 32px; font-weight: 800; color: var(--premium-blue); line-height: 1; }
            .dial-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
            
            .skill-tag.matched { background: #ecfdf5 !important; color: #10b981 !important; border: 1px solid #a7f3d0 !important; font-weight: 600; }
            .skill-tag.missing { background: #fef2f2 !important; color: #ef4444 !important; border: 1px solid #fecade !important; font-weight: 600; }
            
            .notes-display-box {
              background: var(--input-bg);
              padding: 24px;
              border-radius: 12px;
              border: 1px solid var(--border-premium);
              min-height: 120px;
              font-size: 14px;
              line-height: 1.7;
              position: relative;
            }
            .notes-display-box::before {
              content: '"';
              position: absolute;
              top: 10px;
              left: 10px;
              font-size: 40px;
              color: var(--premium-blue);
              opacity: 0.1;
              font-family: serif;
            }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .fade-in { animation: fadeIn 0.4s ease forwards; }
          `}} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
