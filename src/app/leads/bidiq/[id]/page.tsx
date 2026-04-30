"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import LeadService from "@/services/leadService";
import { ProposalService } from "@/services/proposalService";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  ArrowLeft,
  Zap,
  Copy,
  Bookmark,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  TrendingUp,
  Cpu,
  Target,
  BarChart3,
  ThumbsUp,
  Briefcase,
  AlertCircle,
  FileText,
  MousePointer2,
  ShieldCheck,
  ChevronRight,
  Layers,
  Calendar,
  Users,
  RefreshCw,
  ChevronLeft
} from "lucide-react";
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Button,
  Divider,
  Empty,
  Spin,
  Progress,
  Tabs
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function BidiqIntelligencePage() {
  const { id } = useParams();
  const router = useRouter();
  const { leads, loading, fetchLeads } = useLeads();
  const lead = leads.find((l) => l.id === id);
  const [aiData, setAiData] = useState<any>(null);
  const [fetchingAI, setFetchingAI] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollSkills = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = dir === 'right' ? 120 : -120;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []); // Only fetch once on mount to avoid loops

  useEffect(() => {
    if (lead?.id && !aiData && !fetchingAI && !hasAttempted) {
      const getAIIntelligence = async () => {
        setFetchingAI(true);
        setHasAttempted(true); // Mark as attempted immediately to lock the loop
        try {
          const result = await LeadService.analyze(id as string);
          setAiData(result);
        } catch (error) {
          console.error("AI Fetch error:", error);
          // If it fails, we don't retry until manual refresh to stop blinking
        } finally {
          setFetchingAI(false);
        }
      };
      getAIIntelligence();
    }
  }, [lead?.id, id, aiData, fetchingAI, hasAttempted]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Spin size="large" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!lead) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Empty description="Lead Intelligence Not Found" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // --- DYNAMIC AI SCORING ---

  const handleGenerateProposal = async () => {
    try {
      setGeneratingProposal(true);
      const res = await ProposalService.generateContentOnly(id as string);

      if (res && res.blocks) {
        // Store in sessionStorage for the builder to pick up
        sessionStorage.setItem('pending_proposal_data', JSON.stringify(res));

        // Redirect to builder WITHOUT an ID (Treat as new proposal)
        router.push(`/proposals/builder`);
      }
    } catch (error) {
      console.error("Proposal generation failed:", error);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const calculateFinalScore = () => {
    if (lead.ai_score && lead.ai_score > 0) return Math.round(lead.ai_score);

    // Fallback: Calculate score from lead signals
    let baseScore = 45; // Neutral baseline
    if (lead.client_payment_verified) baseScore += 25;
    if (lead.client_rating && parseFloat(lead.client_rating) > 4.5) baseScore += 15;
    if (lead.budget && parseFloat(lead.budget.replace(/[^0-9.]/g, '')) > 2000) baseScore += 10;
    if ((lead.skills || []).length > 3) baseScore += 10;

    // Deterministic ID-based variance (+/- 5)
    const hash = Array.from(lead.id as string).reduce((a, b) => a + b.charCodeAt(0), 0);
    const final = baseScore + (hash % 11 - 5);

    return Math.min(98, Math.max(15, final)); // Cap between 15 and 98
  };

  // --- DYNAMIC ANALYTICS ENGINE ---
  const calculateLeadIntelligence = () => {
    let durationHours = 40;
    if (lead.duration) {
      const dur = lead.duration.toLowerCase();
      if (dur.includes('month')) durationHours = (parseFloat(dur) || 1) * 160;
      else if (dur.includes('week')) durationHours = (parseFloat(dur) || 1) * 40;
    }

    const budgetNum = lead.budget ? parseFloat(lead.budget.replace(/[^0-9.]/g, '')) : 0;
    const budgetEffortFactor = budgetNum > 0 ? (budgetNum / 55) : durationHours;
    const skillsCount = (lead.skills || []).length;
    const skillMultiplier = 1 + (skillsCount * 0.12);
    const combinedBase = (durationHours * 0.6) + (budgetEffortFactor * 0.4);
    const hash = Array.from(lead.id as string).reduce((a, b) => a + b.charCodeAt(0), 0);
    const variance = 0.9 + (hash % 20) / 100;

    return Math.round(combinedBase * skillMultiplier * variance);
  };

  // --- HYBRID ANALYTICS ENGINE (AI + Manual Fallback) ---
  const baselineHours = aiData?.estimatedHours || calculateLeadIntelligence();
  const getMarketRate = () => {
    const level = (lead.experience_level || 'intermediate').toLowerCase();
    if (level.includes('expert')) return 45;
    if (level.includes('entry') || level.includes('beginner')) return 15;
    return 28;
  };

  const clientBudgetNum = parseFloat(lead.budget?.replace(/[^0-9.]/g, '') || '0') || 50;

  const suggestedBudgetVal = aiData?.suggestedBid || Math.round(clientBudgetNum * 0.9);
  const projectMarketValue = aiData?.marketValue || (baselineHours * getMarketRate());
  const anchorPrice = aiData?.anchorPrice || Math.max(10, Math.round(clientBudgetNum * 1.05));
  const avgBidVal = aiData?.avgBidPrediction || Math.max(5, Math.round(clientBudgetNum * 0.85));

  const budgetGap = aiData?.gaps?.budget ?? Math.max(0, Math.round(((projectMarketValue - clientBudgetNum) / clientBudgetNum) * 100));
  const score = aiData?.strategicScore ?? calculateFinalScore();

  const realityTimeline = aiData?.gaps?.timeline || `${Math.ceil(baselineHours / 32)}-${Math.ceil(baselineHours / 28)} wk`;
  const realTeamSize = aiData?.gaps?.teamSize || Math.max(1, Math.min(4, Math.ceil(baselineHours / 160)));
  const realRevisions = aiData?.gaps?.revisions || Math.max(3, Math.min(10, Math.round((lead.skills?.length || 2) * 1.2)));

  const isUnderpriced = budgetGap > 40;
  const budgetStatus = aiData?.complexity ? `${aiData.complexity} / ${budgetGap > 200 ? 'High Gap' : 'Balanced'}` : (budgetGap > 200 ? 'High Reality Gap' : 'Market Balanced');
  const budgetStatusType = isUnderpriced ? 'warning' : 'success';

  const decisionStatus = score > 70 ? "Worth Applying" : score > 40 ? "Evaluate Further" : "Not Recommended";
  const decisionSub = score > 70 ? "Strong client signals — apply within 4h." : "Mixed signals — review requirements carefully.";

  // AI Summary Logic
  const coachSummary = aiData?.summary || "AI is analyzing project signals to provide a winning bid strategy...";

  // Effort Ranges for Visualization
  const expertRange = `${Math.round(baselineHours * 0.7)}-${Math.round(baselineHours * 0.9)}`;
  const intermediateRange = `${Math.round(baselineHours * 0.9)}-${Math.round(baselineHours * 1.15)}`;
  const beginnerRange = `${Math.round(baselineHours * 1.15)}-${Math.round(baselineHours * 1.4)}`;

  // --- DYNAMIC RISK ANALYSIS ---
  const generateLeadRisks = () => {
    // If AI provided risks, use them!
    if (aiData?.risks) {
      return aiData.risks.map((r: any) => ({
        ...r,
        icon: r.type === 'red' ? <AlertCircle size={14} /> : r.type === 'yellow' ? <AlertTriangle size={14} /> : <Info size={14} />
      }));
    }

    const risks: { type: 'red' | 'yellow' | 'grey'; title: string; desc: string; icon: any }[] = [];

    // 1. Payment Security (Fallback)
    if (!lead.client_payment_verified) {
      risks.push({
        type: 'red',
        title: 'Unverified Payment',
        desc: 'Client has not verified a payment method yet.',
        icon: <AlertCircle size={14} />
      });
    }

    // 2. Budget Health (Medium/High Risk)
    if (budgetGap > 40) {
      risks.push({
        type: 'yellow',
        title: 'Budget Variance',
        desc: `Client budget is ${budgetGap}% below market average.`,
        icon: <DollarSign size={14} />
      });
    }

    // 3. Client Reputation (Warning)
    if (!lead.client_rating || parseFloat(lead.client_rating) < 4.5) {
      risks.push({
        type: 'yellow',
        title: 'Limited History',
        desc: lead.client_rating ? `Client rating is ${lead.client_rating}` : 'First-time hirer on the platform.',
        icon: <Users size={14} />
      });
    }

    // 4. Timeline Pressure (Info/Warning)
    if (lead.duration && (lead.duration.toLowerCase().includes('week') || lead.duration.toLowerCase().includes('day'))) {
      risks.push({
        type: 'grey',
        title: 'Aggressive Timeline',
        desc: `Project duration (${lead.duration}) is relatively short.`,
        icon: <Clock size={14} />
      });
    }

    // Default if no risks found
    if (risks.length === 0) {
      risks.push({
        type: 'grey',
        title: 'Clean Signals',
        desc: 'No immediate risk factors detected for this lead.',
        icon: <ShieldCheck size={14} />
      });
    }

    return risks.slice(0, 3); // Keep it compact
  };

  const dynamicRisks = generateLeadRisks();
  const bidsCount = aiData?.predictedBidsCount || ((baselineHours % 35) + 15);

  // Reality Gap Extension Logic
  const clientQualityScore = aiData?.clientQualityScore || Math.round(
    (lead.client_payment_verified ? 40 : 0) +
    (lead.client_rating ? (parseFloat(lead.client_rating) / 5) * 40 : 10) +
    (lead.client_spend ? 20 : 0)
  );

  const budgetFairnessScore = aiData?.budgetFairnessScore || Math.max(10, Math.min(100, 100 - (budgetGap * 0.8)));

  // Complexity Mapping
  const complexity = aiData?.complexity || (baselineHours < 80 ? 'EASY' : baselineHours < 240 ? 'MEDIUM' : 'COMPLEX');
  const complexityColor = complexity === 'EASY' ? '#dcfce7' : complexity === 'MEDIUM' ? '#fef3c7' : '#fee2e2';
  const complexityText = complexity === 'EASY' ? '#166534' : complexity === 'MEDIUM' ? '#92400e' : '#991b1b';

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bidiq-premium-canvas">
          {/* Top Navigation Bar */}
          <div className="bidiq-navbar">
            <Row justify="space-between" align="middle" style={{ height: '100%' }}>
              <Col>
                <Space size={24}>
                  <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => router.back()} className="nav-back-btn">Back to Jobs</Button>
                  <div className="navbar-logo">
                    <Zap size={20} fill="#6366f1" color="#6366f1" />
                    <span className="logo-text">BidiQ</span>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space size={20}>
                  <Button
                    icon={<Sparkles size={16} />}
                    className="proposal-gen-btn"
                    onClick={handleGenerateProposal}
                    loading={generatingProposal}
                  >
                    {generatingProposal ? "Generating..." : "Generate Proposal"}
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
          <div className="bidiq-dashboard-body">
            {/* FULL WIDTH HEADER CARD */}
            <div className="glass-card header-intelligence-card">
              <Row align="middle" gutter={24}>
                {/* COLUMN 1: JOB BASICS */}
                <Col xs={24} lg={8}>
                  <Space size={2} direction="vertical">
                    <Space size={8} split={<Text type="secondary" style={{ fontSize: 10 }}>•</Text>} style={{ marginBottom: 2 }}>
                      <Text strong className="h-platform">{lead.platform || 'Upwork'}</Text>
                      <Text className="h-sub-info">{lead.client_location || 'US'} • {dayjs(lead.posted_on).fromNow()}</Text>
                    </Space>
                    <Title level={4} className="header-job-title" style={{ margin: 0 }}>{lead.title}</Title>
                    <div className="h-budget-pill">{lead.budget || '50'} <span className="h-budget-type">{lead.job_type || 'fixed'}</span></div>
                  </Space>
                </Col>

                {/* COLUMN 2: CENTER METRICS */}
                <Col xs={24} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="header-metric-tiles">
                    <div className="h-metric-tile time">
                      <Clock size={14} color="#6366f1" />
                      <div>
                        <Text className="h-tile-label">TIME</Text>
                        <Text className="h-tile-val">{lead.duration || '3mo'}</Text>
                      </div>
                    </div>
                    <div className="h-metric-tile budget">
                      <DollarSign size={14} color="#10b981" />
                      <div>
                        <Text className="h-tile-label">BUDGET</Text>
                        <Text className="h-tile-val">{lead.budget || '50'}</Text>
                      </div>
                    </div>
                    <div className="h-metric-tile score">
                      <TrendingUp size={14} color="#f59e0b" />
                      <div>
                        <Text className="h-tile-label">SCORE</Text>
                        <Text className="h-tile-val">{score}%</Text>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* COLUMN 3: RIGHT SKILLS */}
                <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
                  <div className="h-skill-stack">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Text style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>STACK REQUIREMENTS</Text>
                      <Space size={4}>
                        <Button
                          type="text"
                          size="small"
                          icon={<ChevronLeft size={12} color="#6366f1" />}
                          onClick={() => scrollSkills('left')}
                          style={{ padding: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<ChevronRight size={12} color="#6366f1" />}
                          onClick={() => scrollSkills('right')}
                          style={{ padding: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                      </Space>
                    </div>
                    <div ref={scrollRef} className="hide-scrollbar" style={{
                      display: 'flex',
                      overflowX: 'auto',
                      gap: '6px',
                      paddingBottom: '8px',
                      width: '100%',
                      scrollBehavior: 'smooth'
                    }}>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        {(Array.isArray(lead.skills) ? lead.skills : (typeof lead.skills === 'string' ? (lead.skills as string).split(',') : [])).map((skill: string) => (
                          <div key={skill} className="h-skill-pill" style={{ flexShrink: 0 }}>
                            <Cpu size={10} color="#6366f1" />
                            <span className="h-pill-text">{skill.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '0 0 32px 0', borderTop: '1.5px solid #e2e8f0' }} />

            <Row gutter={[48, 24]} style={{ marginTop: 0 }}>
              {/* COLUMN 1: STRATEGY & RISKS */}
              <Col xs={24} lg={8} className="vertical-divide-col">
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <div className="decision-score-premium-card">
                    <div className="premium-card-header" style={{ marginBottom: 12 }}>
                      <Space size={8} className="p-card-label">
                        <Sparkles size={14} /> AI VERDICT
                      </Space>
                    </div>

                    <div className="premium-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="p-status-section" style={{ flex: 1, paddingRight: 16 }}>
                        <Title level={4} className="p-status-title" style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700 }}>{decisionStatus}</Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, display: 'block', marginTop: 4 }}>{decisionSub}</Text>
                      </div>

                      <div className="score-gauge-area" style={{ flexShrink: 0 }}>
                        <Progress
                          type="circle"
                          percent={score}
                          strokeColor="#fff"
                          trailColor="rgba(255,255,255,0.2)"
                          strokeWidth={10}
                          size={75}
                          format={(p) => (
                            <div style={{ color: '#fff' }}>
                              <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{p}%</div>
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    <div className="compact-metric-row" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      {[
                        { label: 'WIN', val: `${score}%`, color: 'rgba(255,255,255,0.15)' },
                        { label: 'CLIENT', val: `${clientQualityScore}/100`, color: 'rgba(255,255,255,0.15)' },
                        { label: 'BUDGET', val: `${Math.round(budgetFairnessScore)}/100`, color: 'rgba(255,255,255,0.15)' }
                      ].map((m, i) => (
                        <div key={i} style={{ flex: 1, background: m.color, padding: '6px 8px', borderRadius: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{m.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0', borderTop: '1.5px solid #e2e8f0' }} />

                  <div className="glass-card risk-signals-card">
                    <div className="section-title-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <AlertTriangle size={18} color="#f59e0b" />
                      <Title level={5} className="section-title" style={{ margin: 0 }}>Risk Signals</Title>
                    </div>
                    <Text className="section-subtitle" style={{ display: 'block', marginLeft: 28 }}>Potential project bottlenecks</Text>
                    <div className="risk-stack" style={{ marginTop: 16 }}>
                      {dynamicRisks.map((risk: any, idx: number) => (
                        <div key={idx} className={`risk-item ${risk.type}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ flexShrink: 0, marginTop: 2 }}>{risk.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div className="risk-header" style={{ margin: 0, display: 'inline' }}>{risk.title}: </div>
                            <span className="risk-desc" style={{ margin: 0 }}>{risk.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Space>
              </Col>

              {/* COLUMN 2: INTELLIGENCE & GAP */}
              <Col xs={24} lg={8} className="vertical-divide-col">
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <div className="glass-card smart-summary-card">
                    <div className="section-title-row"><Title level={5} className="section-title">Smart Summary</Title></div>
                    <Text className="section-subtitle">AI-extracted insights from the job description</Text>

                    <div className="summary-points-list" style={{ marginTop: 16, minHeight: 60, position: 'relative' }}>
                      {fetchingAI && !aiData && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 5, borderRadius: 8 }}>
                          <RefreshCw className="animate-spin" size={18} color="#6366f1" />
                        </div>
                      )}

                      {aiData ? (
                        <div className="point-item" style={{ alignItems: 'flex-start' }}>
                          <Sparkles size={16} color="#6366f1" style={{ marginTop: 2 }} />
                          <Text style={{ fontSize: 13, lineHeight: '1.5', fontWeight: 500 }}>{coachSummary}</Text>
                        </div>
                      ) : (lead?.ai_summary && typeof lead.ai_summary === 'string' && lead.ai_summary !== 'NO') ? (
                        (lead.ai_summary as string).split('•').filter(Boolean).map((point: string, index: number) => (
                          <div key={index} className="point-item">
                            <CheckCircle2 size={16} color="#6366f1" />
                            <Text style={{ fontSize: 13, lineHeight: '1.5' }}>{point.trim()}</Text>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                          {!fetchingAI && <Empty description="Metadata not found" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                        </div>
                      )}
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0', borderTop: '1.5px solid #e2e8f0' }} />

                  <div className="glass-card reality-gap-card" style={{ borderRadius: 16, padding: '12px 14px' }}>
                    <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <div className="title-stack">
                        <Title level={5} style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#1e293b' }}>Reality Gap</Title>
                        <Text style={{ fontSize: 10, color: '#94a3b8', display: 'block', lineHeight: 1 }}>Client expectations vs market reality</Text>
                      </div>
                      <Tag style={{
                        border: 'none',
                        background: isUnderpriced ? '#fee2e2' : '#dcfce7',
                        color: isUnderpriced ? '#ef4444' : '#10b981',
                        fontWeight: 900, fontSize: 8, borderRadius: 10, padding: '2px 8px'
                      }}>
                        <Space size={4}>
                          <TrendingUp size={10} />
                          {aiData?.complexity ? `${aiData.complexity} ${isUnderpriced ? 'GAP' : 'OK'}` : (isUnderpriced ? 'HIGH GAP' : 'MARKET OK')}
                        </Space>
                      </Tag>
                    </div>

                    {/* Unified Grid Header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr 1fr 60px',
                      marginTop: 12,
                      padding: '0 10px',
                      marginBottom: 4,
                      textAlign: 'right'
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1', textAlign: 'left' }}>METRIC</Text>
                      <Text style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1' }}>CLIENT</Text>
                      <Text style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1' }}>REALITY</Text>
                      <Text style={{ fontSize: 9, fontWeight: 900, color: '#cbd5e1' }}>Δ</Text>
                    </div>

                    <div className="gap-metric-stack" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { icon: <DollarSign size={14} />, name: 'Budget', client: `$${clientBudgetNum.toLocaleString()}`, reality: `$${projectMarketValue.toLocaleString()}`, delta: `+${budgetGap}%`, color: 'orange', isPrice: true },
                        { icon: <Clock size={14} />, name: 'Timeline', client: lead.duration || '3 mo', reality: `${Math.ceil(baselineHours / 32)}-${Math.ceil(baselineHours / 28)} wk`, delta: '+85%', color: 'red' },
                        { icon: <Users size={14} />, name: 'Team Size', client: '1 dev', reality: `${realTeamSize} devs`, delta: `+${realTeamSize}`, color: 'yellow' },
                        { icon: <AlertCircle size={14} />, name: 'Revisions', client: '2 rd', reality: `${realRevisions} rd`, delta: `+${Math.round((realRevisions / 2) * 100 - 100)}%`, color: 'red' }
                      ].map((item, idx: number) => (
                        <div key={idx} style={{
                          display: 'grid',
                          gridTemplateColumns: '110px 1fr 1fr 60px',
                          alignItems: 'center',
                          borderRadius: 10,
                          padding: '8px 10px',
                          border: '1px solid var(--border-slate-100)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-pure-white)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: item.color === 'red' ? '#ef4444' : item.color === 'orange' ? '#f59e0b' : '#eab308',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>{item.icon}</div>
                            <Text style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-slate-900)' }}>{item.name}</Text>
                          </div>
                          <Text style={{ fontSize: 11, color: 'var(--text-slate-400)', textDecoration: 'line-through', textAlign: 'right' }}>{item.client}</Text>
                          <Text style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-slate-900)', textAlign: 'right' }}>{item.reality}</Text>
                          <Tag style={{
                            margin: 0, border: 'none', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                            fontSize: 8, fontWeight: 900, borderRadius: 4, width: 'fit-content', marginLeft: 'auto'
                          }}>{item.delta}</Tag>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      marginTop: 10, padding: '10px', borderRadius: 10,
                      display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-slate-100)'
                    }}>
                      <div style={{ width: 26, height: 26, background: 'var(--bg-pure-white)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><TrendingUp size={14} /></div>
                      <Text style={{ fontSize: 10, color: 'var(--text-slate-500)', lineHeight: 1.4 }}>
                        <b style={{ color: '#6366f1' }}>Advise:</b> Suggest <b>${(suggestedBudgetVal / 1000).toFixed(1)}k</b> for the complete project.
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>
              <Col xs={24} lg={8}>
                <Space direction="vertical" size={0} style={{ width: '100% ' }}>
                  <div className="glass-card effort-estimation-card" style={{ borderRadius: 16, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                      <Title level={5} className="section-title" style={{ margin: 0, fontSize: 13, fontWeight: 900 }}>Effort Estimation</Title>
                      <Tag style={{ border: 'none', background: complexityColor, color: complexityText, fontWeight: 800, fontSize: 8, borderRadius: 10, padding: '0 6px', margin: 0 }}>{complexity}</Tag>
                    </div>
                    <Text className="section-subtitle" style={{ fontSize: 10, display: 'block', marginBottom: 8, lineHeight: 1 }}>Hours by skill level</Text>

                    <div className="estimation-stack">
                      {[
                        { label: 'Beginner', val: beginnerRange, color: '#ef4444', pct: 90, icon: <Zap size={12} /> },
                        { label: 'Intermediate', val: intermediateRange, color: '#f59e0b', pct: 65, icon: <Sparkles size={12} /> },
                        { label: 'Expert', val: expertRange, color: '#10b981', pct: 35, icon: <ShieldCheck size={12} /> }
                      ].map((item, idx) => (
                        <div key={idx} style={{ marginBottom: idx === 2 ? 0 : 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                            <Space size={4} style={{ rowGap: 0 }}><span style={{ color: '#64748b', display: 'flex' }}>{item.icon}</span><Text className="premium-form-label" style={{ fontWeight: 700, fontSize: 10 }}>{item.label}</Text></Space>
                            <Text style={{ fontSize: 10 }}><span className="premium-title" style={{ fontWeight: 700 }}>{item.val}</span> <span className="premium-text-sec">hrs</span></Text>
                          </div>
                          <Progress percent={item.pct} showInfo={false} strokeColor={item.color} strokeWidth={6} style={{ height: 6, margin: 0, padding: 0, top: -2 }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0', borderTop: '1.5px solid #e2e8f0' }} />

                  <div className="glass-card budget-reality-card" style={{ borderRadius: 16, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                      <Title level={5} className="section-title" style={{ margin: 0, fontSize: 13, fontWeight: 900 }}>Budget Reality Check</Title>
                      <Tag style={{ border: 'none', background: '#fef3c7', color: '#d97706', fontWeight: 800, fontSize: 8, borderRadius: 10, padding: '0 6px', margin: 0 }}>{budgetStatus}</Tag>
                    </div>
                    <Text className="section-subtitle" style={{ fontSize: 10, display: 'block', marginBottom: 8, lineHeight: 1 }}>Market-aligned pricing</Text>

                    <div className="reality-check-stack">
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                          <Text className="premium-form-label" style={{ fontSize: 10, fontWeight: 700 }}>Client Budget</Text>
                          <Text className="premium-title" style={{ fontSize: 12, fontWeight: 700 }}>${clientBudgetNum.toLocaleString()}</Text>
                        </div>
                        <Progress percent={45} showInfo={false} strokeColor="#f59e0b" strokeWidth={8} style={{ height: 8, margin: 0, padding: 0, top: -2 }} />
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                          <Text className="premium-form-label" style={{ fontSize: 10, fontWeight: 700 }}>Suggested Budget</Text>
                          <Text className="premium-title" style={{ fontSize: 12, fontWeight: 700 }}>${suggestedBudgetVal.toLocaleString()}</Text>
                        </div>
                        <Progress percent={90} showInfo={false} strokeColor="#10b981" strokeWidth={8} style={{ height: 8, margin: 0, padding: 0, top: -2 }} />
                      </div>

                      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, fontSize: 9, background: isUnderpriced ? '#fff1f1' : 'var(--bg-slate-50)', color: isUnderpriced ? '#ef4444' : 'var(--text-slate-400)', fontWeight: 900, border: isUnderpriced ? '1px solid #fee2e2' : '1px solid var(--border-slate-100)' }}>Underpriced</div>
                        <div style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, fontSize: 9, background: isUnderpriced ? 'var(--bg-slate-50)' : '#f59e0b', color: isUnderpriced ? 'var(--text-slate-400)' : '#fff', fontWeight: 900, border: isUnderpriced ? '1px solid var(--border-slate-100)' : 'none' }}>Fair</div>
                        <div style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, fontSize: 9, background: 'var(--bg-slate-50)', color: 'var(--text-slate-400)', fontWeight: 900, border: '1px solid var(--border-slate-100)' }}>High Value</div>
                      </div>

                      <div className="premium-insight-banner" style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <Text style={{ fontSize: 10, fontWeight: 700 }} className="premium-text-sec">
                          <b style={{ color: '#10b981' }}>Bidding Tip:</b> Start with <Text strong style={{ color: '#10b981' }}>${anchorPrice.toLocaleString()}</Text> for Phase 1.
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0', borderTop: '1.5px solid #e2e8f0' }} />

                  <div className="glass-card competition-card" style={{ borderRadius: 16, padding: '10px 14px' }}>
                    <div className="competition-insights-stack" style={{ marginTop: 8 }}>
                      <Row gutter={6}>
                        <Col span={12}><div style={{ padding: 6, borderRadius: 8, background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-100)' }}><Text style={{ fontSize: 7, fontWeight: 800, color: 'var(--text-slate-400)', display: 'block' }}>AVG. BID</Text><Text style={{ fontWeight: 700, fontSize: 11, display: 'block', color: 'var(--text-slate-900)' }}>${avgBidVal.toLocaleString()}</Text></div></Col>
                        <Col span={12}><div style={{ padding: 6, borderRadius: 8, background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-100)' }}><Text style={{ fontSize: 7, fontWeight: 800, color: 'var(--text-slate-400)', display: 'block' }}>MATCH</Text><Text style={{ fontWeight: 700, fontSize: 11, color: '#10b981', display: 'block' }}>{lead.skill_analysis?.matchPercentage || 100}%</Text></div></Col>
                      </Row>
                    </div>
                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-slate-100)' }}>
                      <Text style={{ fontSize: 9, fontWeight: 800, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={11} /> Bid near <b>${avgBidVal.toLocaleString()}</b>.</Text>
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            .bidiq-premium-canvas { background: var(--bg-pure-white); min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
            .bidiq-navbar { background: var(--bg-pure-white); height: 64px; padding: 0; border-bottom: 1px solid var(--border-slate-100); position: sticky; top: 0; z-index: 1000; }
            .nav-back-btn { font-weight: 600; color: var(--text-slate-500); display: flex; align-items: center; padding-left: 24px; }
            .navbar-logo { display: flex; align-items: center; gap: 8px; border-left: 1px solid var(--border-slate-100); padding-left: 24px; padding-right: 24px; }
            .logo-text { font-weight: 900; font-size: 20px; color: var(--text-slate-900); letter-spacing: -0.02em; }
            .nav-action-link { font-weight: 700; color: #3b82f6; }
            .proposal-gen-btn { height: 40px; border-radius: 10px; font-weight: 700; border: 1.5px solid #6366f1; color: #6366f1; }
            .apply-now-btn { height: 40px; border-radius: 10px; font-weight: 700; background: #6366f1; border: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

            .bidiq-dashboard-body { padding: 20px 32px; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            
              /* HEADER CARD STYLES - ULTRA COMPACT */
            .header-intelligence-card { background: var(--bg-pure-white); border-radius: 16px !important; padding: 8px 0 !important; border: 1px solid var(--border-slate-100) !important; box-shadow: 0 2px 12px -4px rgba(0,0,0,0.04) !important; margin-bottom: 12px !important; }
            .h-platform { color: #6366f1; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 800; }
            .h-sub-info { color: var(--text-slate-400); font-size: 11px; }
            .header-job-title { color: var(--text-slate-900) !important; font-weight: 700 !important; margin: 0 !important; font-size: 16px !important; line-height: 1.2 !important; }
            .h-budget-pill { display: inline-flex; align-items: center; gap: 4px; background: var(--bg-slate-50); padding: 2px 8px; border-radius: 6px; color: var(--text-slate-900); font-weight: 700; font-size: 11px; border: 1px solid var(--border-slate-100); }
            .h-budget-type { color: var(--text-slate-400); font-weight: 600; font-size: 9px; text-transform: uppercase; }
            .h-skill-tag { border-radius: 4px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-100); color: var(--text-slate-500); font-weight: 600; font-size: 9px; margin: 1px; padding: 0 4px; }

            .header-metric-tiles { display: flex; gap: 8px; }
            .h-metric-tile { min-width: 90px; padding: 4px 10px; border-radius: 10px; display: flex; align-items: center; gap: 6px; }
            .h-metric-tile.time { background: #f5f3ff; } .h-metric-tile.budget { background: #f0fdf4; } .h-metric-tile.score { background: #fff7ed; }
            .h-tile-label { font-size: 8px; font-weight: 800; color: #94a3b8; display: block; }
            .h-tile-val { font-size: 13px; color: #1e293b; display: block; font-weight: 800; }

            .h-skill-pill { display: inline-flex; align-items: center; gap: 6px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); padding: 4px 10px; border-radius: 8px; }
            .h-pill-text { font-size: 10px; font-weight: 800; color: var(--text-slate-700); text-transform: uppercase; }

            .glass-card { background: transparent; border-radius: 0 !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
            .section-title { margin: 0 !important; color: var(--text-slate-900) !important; font-size: 15px !important; font-weight: 700 !important; }
            .section-subtitle { font-size: 12px; color: var(--text-slate-400); display: block; margin-top: 2px; }

            .vertical-divide-col { border-right: 1.5px solid var(--border-slate-100); }
            @media (max-width: 991px) { .vertical-divide-col { border-right: none; border-bottom: 1.5px solid var(--border-slate-100); padding-bottom: 24px; } }

            .decision-score-premium-card { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important; border-radius: 20px; padding: 20px; border: none; position: relative; overflow: hidden; color: #fff !important; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2); }
            .premium-card-header { margin-bottom: 16px; }
            .p-card-label { font-size: 10px; font-weight: 800; color: #fff !important; opacity: 0.9; letter-spacing: 0.1em; }
            .premium-card-body { display: flex; gap: 20px; align-items: center; }
            .p-gauge-inner { display: flex; flex-direction: column; line-height: 1; align-items: center; color: #fff !important; }
            .p-gauge-total { font-size: 10px; opacity: 0.6; }
            .p-status-title { color: #fff !important; margin: 0 !important; font-weight: 700 !important; letter-spacing: -0.01em; }

            .summary-tabs .ant-tabs-nav::before { border-bottom: none; }
            .summary-tabs .ant-tabs-tab-btn { font-size: 12px; font-weight: 700; color: #94a3b8; }
            .summary-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #6366f1 !important; }
            .summary-tabs .ant-tabs-ink-bar { background: #6366f1; }
            .point-item { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }

            .gap-row-card { background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            
            .risk-stack { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
            .risk-item { padding: 10px 14px; border-radius: 12px; border: 1px solid transparent; }
            .risk-item.red { background: #fee2e2; border-color: #fecaca; }
            .risk-item.yellow { background: #fef3c7; border-color: #fde68a; }
            .risk-item.grey { background: var(--bg-slate-50); border-color: var(--border-slate-100); }
            .risk-header { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 12px; color: var(--text-slate-900); margin-bottom: 2px; }
            .risk-desc { font-size: 11px; color: var(--text-slate-500); }

            /* DARK THEME OVERRIDES */
            [data-theme='dark'] .bidiq-premium-canvas { background: #0d1117 !important; }
            [data-theme='dark'] .bidiq-navbar { background: #161b22 !important; border-bottom-color: #30363d !important; }
            [data-theme='dark'] .navbar-logo { border-left-color: #30363d !important; }
            [data-theme='dark'] .header-intelligence-card { background: #161b22 !important; border-color: #30363d !important; box-shadow: none !important; }
            [data-theme='dark'] .h-platform { color: #818cf8 !important; }
            [data-theme='dark'] .h-budget-pill { background: #0d1117 !important; border-color: #30363d !important; color: #f0f6fc !important; }
            [data-theme='dark'] .h-skill-pill { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .h-pill-text { color: #8b949e !important; }
            [data-theme='dark'] .h-metric-tile.time { background: rgba(99, 102, 241, 0.1) !important; }
            [data-theme='dark'] .h-metric-tile.budget { background: rgba(16, 185, 129, 0.1) !important; }
            [data-theme='dark'] .h-metric-tile.score { background: rgba(245, 158, 11, 0.1) !important; }
            [data-theme='dark'] .h-tile-val { color: #f0f6fc !important; }
            [data-theme='dark'] .vertical-divide-col { border-right-color: #30363d !important; }
            [data-theme='dark'] .reality-gap-card { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .gap-metric-stack > div { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .grc-name { color: #f0f6fc !important; }
            [data-theme='dark'] .effort-estimation-card { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .budget-reality-card { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .competition-card { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .competition-card .ant-col div { background: #0d1117 !important; }
            [data-theme='dark'] .risk-item.grey { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .risk-item.red { background: rgba(239, 68, 68, 0.1) !important; border-color: rgba(239, 68, 68, 0.2) !important; }
            [data-theme='dark'] .risk-item.yellow { background: rgba(245, 158, 11, 0.1) !important; border-color: rgba(245, 158, 11, 0.2) !important; }
            [data-theme='dark'] .risk-desc { color: #8b949e !important; }
            [data-theme='dark'] .mini-insight { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .mini-val { color: #f0f6fc !important; }
            [data-theme='dark'] .ant-divider { border-top-color: #30363d !important; }
            [data-theme='dark'] .gap-metric-stack div span:nth-child(2) { color: #f0f6fc !important; }
            [data-theme='dark'] .reality-gap-card .title-stack span:first-child { color: #f0f6fc !important; }
            [data-theme='dark'] .reality-gap-card div:last-child { background: rgba(99, 102, 241, 0.1) !important; border-color: rgba(99, 102, 241, 0.2) !important; }
            [data-theme='dark'] .reality-gap-card div:last-child span { color: #c9d1d9 !important; }
          `
          }} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
