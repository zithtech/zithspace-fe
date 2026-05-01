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
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  TrendingUp,
  Target,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Users,
  RefreshCw,
  ChevronLeft,
  Cpu,
  Activity,
  Flame,
  ArrowUpRight,
  BarChart3,
  Gauge,
  MapPin,
} from "lucide-react";
import {
  Typography,
  Row,
  Col,
  Button,
  Empty,
  Spin,
  Progress,
  Tooltip,
  Modal,
  DatePicker,
  InputNumber,
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
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"client" | "custom" | null>(null);
  const [customDates, setCustomDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [customCost, setCustomCost] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollSkills = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = dir === "right" ? 160 : -160;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (lead?.id && !aiData && !fetchingAI && !hasAttempted) {
      const getAIIntelligence = async () => {
        setFetchingAI(true);
        setHasAttempted(true);
        try {
          const result = await LeadService.analyze(id as string);
          setAiData(result);
        } catch (error) {
          console.error("AI Fetch error:", error);
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
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
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
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
            <Empty description="Lead Intelligence Not Found" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const openOptionModal = () => {
    setSelectedOption(null);
    setCustomDates(null);
    setCustomCost(null);
    setOptionModalOpen(true);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedOption) return;

    let payload: { selection: "client" | "custom"; duration?: string; cost?: string | number; startDate?: string; endDate?: string };

    if (selectedOption === "client") {
      payload = {
        selection: "client",
        duration: lead.duration,
        cost: lead.budget,
      };
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
      const res = await ProposalService.generateContentOnly(id as string, payload);
      if (res && res.blocks) {
        sessionStorage.setItem("pending_proposal_data", JSON.stringify({ ...res, selection: payload }));
        setOptionModalOpen(false);
        router.push(`/proposals/builder`);
      }
    } catch (error) {
      console.error("Proposal generation failed:", error);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const customDays = customDates ? customDates[1].diff(customDates[0], "day") : 0;
  const customValid = !!customDates && customCost !== null && customCost > 0 && customDays > 0;

  const calculateFinalScore = () => {
    if (lead.ai_score && lead.ai_score > 0) return Math.round(lead.ai_score);
    let baseScore = 45;
    if (lead.client_payment_verified) baseScore += 25;
    if (lead.client_rating && parseFloat(lead.client_rating) > 4.5) baseScore += 15;
    if (lead.budget && parseFloat(lead.budget.replace(/[^0-9.]/g, "")) > 2000) baseScore += 10;
    if ((lead.skills || []).length > 3) baseScore += 10;
    const hash = Array.from(lead.id as string).reduce((a, b) => a + b.charCodeAt(0), 0);
    const final = baseScore + (hash % 11 - 5);
    return Math.min(98, Math.max(15, final));
  };

  const calculateLeadIntelligence = () => {
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

  const baselineHours = aiData?.estimatedHours || calculateLeadIntelligence();
  const getMarketRate = () => {
    const level = (lead.experience_level || "intermediate").toLowerCase();
    if (level.includes("expert")) return 45;
    if (level.includes("entry") || level.includes("beginner")) return 15;
    return 28;
  };

  const clientBudgetNum = parseFloat(lead.budget?.replace(/[^0-9.]/g, "") || "0") || 50;
  const suggestedBudgetVal = aiData?.suggestedBid || Math.round(clientBudgetNum * 0.9);
  const projectMarketValue = aiData?.marketValue || baselineHours * getMarketRate();
  const anchorPrice = aiData?.anchorPrice || Math.max(10, Math.round(clientBudgetNum * 1.05));
  const avgBidVal = aiData?.avgBidPrediction || Math.max(5, Math.round(clientBudgetNum * 0.85));

  const budgetGap = aiData?.gaps?.budget ?? Math.max(0, Math.round(((projectMarketValue - clientBudgetNum) / clientBudgetNum) * 100));
  const score = aiData?.strategicScore ?? calculateFinalScore();

  const realTeamSize = aiData?.gaps?.teamSize || Math.max(1, Math.min(4, Math.ceil(baselineHours / 160)));
  const realRevisions = aiData?.gaps?.revisions || Math.max(3, Math.min(10, Math.round((lead.skills?.length || 2) * 1.2)));

  const isUnderpriced = budgetGap > 40;
  const budgetStatus = aiData?.complexity ? `${aiData.complexity} / ${budgetGap > 200 ? "High Gap" : "Balanced"}` : (budgetGap > 200 ? "High Reality Gap" : "Market Balanced");

  const decisionStatus = score > 70 ? "Worth Applying" : score > 40 ? "Evaluate Further" : "Not Recommended";
  const decisionSub = score > 70 ? "Strong client signals — apply within 4h." : "Mixed signals — review requirements carefully.";
  const verdictTone = score > 70 ? "go" : score > 40 ? "review" : "skip";

  const coachSummary = aiData?.summary || "AI is analyzing project signals to provide a winning bid strategy...";

  const expertRange = `${Math.round(baselineHours * 0.7)}-${Math.round(baselineHours * 0.9)}`;
  const intermediateRange = `${Math.round(baselineHours * 0.9)}-${Math.round(baselineHours * 1.15)}`;
  const beginnerRange = `${Math.round(baselineHours * 1.15)}-${Math.round(baselineHours * 1.4)}`;

  const generateLeadRisks = () => {
    if (aiData?.risks) {
      return aiData.risks.map((r: any) => ({
        ...r,
        icon: r.type === "red" ? <AlertCircle size={14} /> : r.type === "yellow" ? <AlertTriangle size={14} /> : <Info size={14} />,
      }));
    }
    const risks: { type: "red" | "yellow" | "grey"; title: string; desc: string; icon: any }[] = [];
    if (!lead.client_payment_verified) {
      risks.push({ type: "red", title: "Unverified Payment", desc: "Client has not verified a payment method yet.", icon: <AlertCircle size={14} /> });
    }
    if (budgetGap > 40) {
      risks.push({ type: "yellow", title: "Budget Variance", desc: `Client budget is ${budgetGap}% below market average.`, icon: <DollarSign size={14} /> });
    }
    if (!lead.client_rating || parseFloat(lead.client_rating) < 4.5) {
      risks.push({ type: "yellow", title: "Limited History", desc: lead.client_rating ? `Client rating is ${lead.client_rating}` : "First-time hirer on the platform.", icon: <Users size={14} /> });
    }
    if (lead.duration && (lead.duration.toLowerCase().includes("week") || lead.duration.toLowerCase().includes("day"))) {
      risks.push({ type: "grey", title: "Aggressive Timeline", desc: `Project duration (${lead.duration}) is relatively short.`, icon: <Clock size={14} /> });
    }
    if (risks.length === 0) {
      risks.push({ type: "grey", title: "Clean Signals", desc: "No immediate risk factors detected for this lead.", icon: <ShieldCheck size={14} /> });
    }
    return risks.slice(0, 3);
  };

  const dynamicRisks = generateLeadRisks();

  const clientQualityScore = aiData?.clientQualityScore || Math.round(
    (lead.client_payment_verified ? 40 : 0) +
    (lead.client_rating ? (parseFloat(lead.client_rating) / 5) * 40 : 10) +
    (lead.client_spend ? 20 : 0)
  );
  const budgetFairnessScore = aiData?.budgetFairnessScore || Math.max(10, Math.min(100, 100 - budgetGap * 0.8));

  const complexity = aiData?.complexity || (baselineHours < 80 ? "EASY" : baselineHours < 240 ? "MEDIUM" : "COMPLEX");
  const complexityAccent = complexity === "EASY" ? "#10b981" : complexity === "MEDIUM" ? "#f59e0b" : "#ef4444";

  const verdictGradient =
    verdictTone === "go"
      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
      : verdictTone === "review"
      ? "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)"
      : "linear-gradient(135deg, #475569 0%, #334155 100%)";

  const skillsList: string[] = Array.isArray(lead.skills)
    ? lead.skills
    : typeof lead.skills === "string"
    ? (lead.skills as string).split(",")
    : [];

  const SectionHeader = ({
    icon,
    accent,
    title,
    subtitle,
    rightSlot,
  }: {
    icon: React.ReactNode;
    accent: string;
    title: string;
    subtitle?: string;
    rightSlot?: React.ReactNode;
  }) => (
    <div className="bidiq-section-head">
      <div className="bidiq-section-head-left">
        <span className="bidiq-section-icon" style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}26` }}>
          {icon}
        </span>
        <div className="bidiq-section-text">
          <span className="bidiq-section-title">{title}</span>
          {subtitle && <span className="bidiq-section-sub">{subtitle}</span>}
        </div>
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="bidiq-canvas">
          {/* TOP NAV */}
          <div className="bidiq-topbar">
            <div className="bidiq-topbar-inner">
              <div className="bidiq-topbar-left">
                <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => router.back()} className="bidiq-back-btn">
                  Back
                </Button>
                <div className="bidiq-topbar-divider" />
                <div className="bidiq-brand">
                  <div className="bidiq-brand-icon">
                    <Zap size={14} />
                  </div>
                  <span className="bidiq-brand-text">BidiQ</span>
                  <span className="bidiq-brand-tag">Intelligence</span>
                </div>
                <div className="bidiq-topbar-divider" />
                <div className="bidiq-breadcrumb">
                  <span className="bidiq-crumb">Leads</span>
                  <ChevronRight size={12} className="bidiq-crumb-sep" />
                  <span className="bidiq-crumb-current">{lead.title}</span>
                </div>
              </div>
              <div className="bidiq-topbar-right">
                <div className={`bidiq-ai-status ${fetchingAI ? "is-loading" : aiData ? "is-ready" : "is-fallback"}`}>
                  {fetchingAI ? (
                    <>
                      <RefreshCw size={11} className="spin" />
                      <span>AI analyzing</span>
                    </>
                  ) : aiData ? (
                    <>
                      <Sparkles size={11} />
                      <span>AI insights ready</span>
                    </>
                  ) : (
                    <>
                      <Activity size={11} />
                      <span>Heuristic mode</span>
                    </>
                  )}
                </div>
                <Button
                  className="bidiq-cta-btn"
                  onClick={openOptionModal}
                  loading={generatingProposal}
                  icon={!generatingProposal ? <Sparkles size={14} /> : undefined}
                >
                  {generatingProposal ? "Generating..." : "Generate Proposal"}
                  {!generatingProposal && <ArrowUpRight size={14} />}
                </Button>
              </div>
            </div>
          </div>

          <div className="bidiq-body">
            {/* HERO */}
            <div className="bidiq-hero">
              <div className="bidiq-hero-bg" aria-hidden />
              <div className="bidiq-hero-grid">
                <div className="bidiq-hero-main">
                  <div className="bidiq-hero-meta">
                    <span className="bidiq-platform-pill">
                      <span className="bidiq-platform-dot" />
                      {lead.platform || "Upwork"}
                    </span>
                    <span className="bidiq-meta-sep" />
                    <span className="bidiq-meta-item">
                      <MapPin size={11} />
                      {lead.client_location || "Remote"}
                    </span>
                    <span className="bidiq-meta-sep" />
                    <span className="bidiq-meta-item">
                      <Clock size={11} />
                      Posted {dayjs(lead.posted_on).fromNow()}
                    </span>
                    {lead.client_payment_verified && (
                      <>
                        <span className="bidiq-meta-sep" />
                        <span className="bidiq-meta-item bidiq-meta-verified">
                          <ShieldCheck size={11} />
                          Payment Verified
                        </span>
                      </>
                    )}
                  </div>

                  <Title level={2} className="bidiq-hero-title">
                    {lead.title}
                  </Title>

                  <div className="bidiq-hero-client">
                    <div className="bidiq-hero-client-avatar">
                      {(lead.client_name || "C").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="bidiq-hero-client-info">
                      <span className="bidiq-hero-client-name">{lead.client_name || "Anonymous Client"}</span>
                      <span className="bidiq-hero-client-sub">
                        {lead.client_rating ? `${lead.client_rating} ★` : "New client"}
                        {lead.client_spend ? ` · ${lead.client_spend} spent` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bidiq-hero-kpis">
                  {[
                    { label: "Budget", value: lead.budget ? `$${clientBudgetNum.toLocaleString()}` : "—", icon: <DollarSign size={15} />, accent: "#10b981" },
                    { label: "Timeline", value: lead.duration || "—", icon: <Clock size={15} />, accent: "#6366f1" },
                    { label: "AI Score", value: `${score}`, suffix: "%", icon: <Gauge size={15} />, accent: score > 70 ? "#10b981" : score > 40 ? "#f59e0b" : "#ef4444" },
                    { label: "Complexity", value: complexity, icon: <Activity size={15} />, accent: complexityAccent },
                  ].map((m, i) => (
                    <div key={i} className="bidiq-kpi-tile">
                      <div className="bidiq-kpi-icon" style={{ background: `linear-gradient(135deg, ${m.accent} 0%, ${m.accent}cc 100%)`, boxShadow: `0 6px 16px ${m.accent}33` }}>
                        {m.icon}
                      </div>
                      <div className="bidiq-kpi-text">
                        <span className="bidiq-kpi-label">{m.label}</span>
                        <span className="bidiq-kpi-value">
                          {m.value}
                          {m.suffix && <span className="bidiq-kpi-suffix">{m.suffix}</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SKILLS BAND */}
              <div className="bidiq-skills-band">
                <div className="bidiq-skills-band-head">
                  <span className="bidiq-skills-label">
                    <Cpu size={12} /> Stack Required
                  </span>
                  <div className="bidiq-skills-controls">
                    <button onClick={() => scrollSkills("left")} aria-label="Scroll left">
                      <ChevronLeft size={13} />
                    </button>
                    <button onClick={() => scrollSkills("right")} aria-label="Scroll right">
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <div ref={scrollRef} className="bidiq-skills-row hide-scrollbar">
                  {skillsList.length > 0 ? (
                    skillsList.map((skill: string) => (
                      <span key={skill} className="bidiq-skill-pill">
                        <span className="bidiq-skill-dot" />
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="bidiq-skill-pill bidiq-skill-empty">No specific skills extracted</span>
                  )}
                </div>
              </div>
            </div>

            {/* MAIN GRID */}
            <Row gutter={[20, 20]} className="bidiq-grid">
              {/* LEFT COLUMN — VERDICT + RISKS */}
              <Col xs={24} lg={8}>
                <div className="bidiq-stack">
                  {/* AI VERDICT */}
                  <div className="bidiq-verdict-card" style={{ background: verdictGradient }}>
                    <div className="bidiq-verdict-glow" aria-hidden />
                    <div className="bidiq-verdict-head">
                      <span className="bidiq-verdict-pill">
                        <Sparkles size={11} /> AI VERDICT
                      </span>
                      <span className="bidiq-verdict-conf">
                        {aiData ? "AI confidence" : "Heuristic"} · {Math.min(98, Math.max(45, score + 5))}%
                      </span>
                    </div>

                    <div className="bidiq-verdict-body">
                      <div className="bidiq-verdict-text">
                        <div className="bidiq-verdict-title">{decisionStatus}</div>
                        <div className="bidiq-verdict-sub">{decisionSub}</div>
                      </div>
                      <div className="bidiq-verdict-gauge">
                        <Progress
                          type="circle"
                          percent={score}
                          strokeColor="#fff"
                          trailColor="rgba(255,255,255,0.18)"
                          strokeWidth={9}
                          size={92}
                          format={(p) => (
                            <div className="bidiq-gauge-text">
                              <div className="bidiq-gauge-num">{p}</div>
                              <div className="bidiq-gauge-pct">/ 100</div>
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    <div className="bidiq-verdict-meters">
                      {[
                        { label: "Win Rate", val: `${score}%`, icon: <TrendingUp size={11} /> },
                        { label: "Client", val: `${clientQualityScore}`, icon: <Users size={11} /> },
                        { label: "Budget Fit", val: `${Math.round(budgetFairnessScore)}`, icon: <DollarSign size={11} /> },
                      ].map((m, i) => (
                        <div key={i} className="bidiq-verdict-meter">
                          <div className="bidiq-verdict-meter-label">
                            {m.icon}
                            {m.label}
                          </div>
                          <div className="bidiq-verdict-meter-val">{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RISKS */}
                  <div className="bidiq-card">
                    <SectionHeader
                      icon={<AlertTriangle size={14} />}
                      accent="#f59e0b"
                      title="Risk Signals"
                      subtitle="Watch-outs detected from project context"
                      rightSlot={
                        <span className="bidiq-section-pill" style={{ background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                          {dynamicRisks.length} flagged
                        </span>
                      }
                    />
                    <div className="bidiq-risk-stack">
                      {dynamicRisks.map((risk: any, idx: number) => (
                        <div key={idx} className={`bidiq-risk-row tone-${risk.type}`}>
                          <div className="bidiq-risk-icon">{risk.icon}</div>
                          <div className="bidiq-risk-text">
                            <div className="bidiq-risk-title">{risk.title}</div>
                            <div className="bidiq-risk-desc">{risk.desc}</div>
                          </div>
                          <div className={`bidiq-risk-badge tone-${risk.type}`}>
                            {risk.type === "red" ? "HIGH" : risk.type === "yellow" ? "MED" : "LOW"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>

              {/* MIDDLE COLUMN — SUMMARY + REALITY GAP */}
              <Col xs={24} lg={8}>
                <div className="bidiq-stack">
                  {/* SMART SUMMARY */}
                  <div className="bidiq-card bidiq-summary-card">
                    <SectionHeader
                      icon={<Sparkles size={14} />}
                      accent="#6366f1"
                      title="Smart Summary"
                      subtitle="AI-extracted insights from the job description"
                      rightSlot={
                        fetchingAI ? (
                          <span className="bidiq-loading-pill">
                            <RefreshCw size={11} className="spin" /> Generating
                          </span>
                        ) : null
                      }
                    />

                    <div className="bidiq-summary-body">
                      {fetchingAI && !aiData ? (
                        <div className="bidiq-summary-skeleton">
                          <div className="sk-line" style={{ width: "92%" }} />
                          <div className="sk-line" style={{ width: "78%" }} />
                          <div className="sk-line" style={{ width: "85%" }} />
                          <div className="sk-line" style={{ width: "60%" }} />
                        </div>
                      ) : aiData ? (
                        <div className="bidiq-summary-quote">
                          <span className="bidiq-quote-mark">"</span>
                          <Text>{coachSummary}</Text>
                        </div>
                      ) : lead?.ai_summary && typeof lead.ai_summary === "string" && lead.ai_summary !== "NO" ? (
                        <ul className="bidiq-summary-list">
                          {(lead.ai_summary as string)
                            .split("•")
                            .filter(Boolean)
                            .map((point: string, index: number) => (
                              <li key={index}>
                                <CheckCircle2 size={13} />
                                <span>{point.trim()}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="bidiq-empty-mini">
                          <Info size={14} />
                          <span>Summary not yet generated</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REALITY GAP */}
                  <div className="bidiq-card">
                    <SectionHeader
                      icon={<Target size={14} />}
                      accent="#ec4899"
                      title="Reality Gap"
                      subtitle="Client expectations vs. market reality"
                      rightSlot={
                        <span
                          className="bidiq-section-pill"
                          style={{
                            background: isUnderpriced ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                            color: isUnderpriced ? "#dc2626" : "#10b981",
                          }}
                        >
                          {budgetStatus}
                        </span>
                      }
                    />

                    <div className="bidiq-gap-table">
                      <div className="bidiq-gap-th">
                        <span>Metric</span>
                        <span>Client</span>
                        <span>Reality</span>
                        <span>Δ</span>
                      </div>
                      {[
                        { icon: <DollarSign size={13} />, name: "Budget", client: `$${clientBudgetNum.toLocaleString()}`, reality: `$${projectMarketValue.toLocaleString()}`, delta: `+${budgetGap}%`, accent: "#f59e0b" },
                        { icon: <Clock size={13} />, name: "Timeline", client: lead.duration || "3 mo", reality: `${Math.ceil(baselineHours / 32)}-${Math.ceil(baselineHours / 28)} wk`, delta: "+85%", accent: "#ef4444" },
                        { icon: <Users size={13} />, name: "Team Size", client: "1 dev", reality: `${realTeamSize} devs`, delta: `+${realTeamSize}`, accent: "#6366f1" },
                        { icon: <RefreshCw size={13} />, name: "Revisions", client: "2 rd", reality: `${realRevisions} rd`, delta: `+${Math.round((realRevisions / 2) * 100 - 100)}%`, accent: "#ec4899" },
                      ].map((item, idx) => (
                        <div key={idx} className="bidiq-gap-row">
                          <div className="bidiq-gap-name">
                            <span className="bidiq-gap-iconbox" style={{ background: `${item.accent}14`, color: item.accent }}>
                              {item.icon}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          <span className="bidiq-gap-client">{item.client}</span>
                          <span className="bidiq-gap-reality">{item.reality}</span>
                          <span className="bidiq-gap-delta" style={{ background: `${item.accent}15`, color: item.accent }}>
                            {item.delta}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bidiq-advise">
                      <div className="bidiq-advise-icon">
                        <TrendingUp size={13} />
                      </div>
                      <div className="bidiq-advise-text">
                        <span className="bidiq-advise-tag">Advice</span>
                        Suggest <b>${(suggestedBudgetVal / 1000).toFixed(1)}k</b> for the complete project to align with market rate.
                      </div>
                    </div>
                  </div>
                </div>
              </Col>

              {/* RIGHT COLUMN — EFFORT + BUDGET + COMPETITION */}
              <Col xs={24} lg={8}>
                <div className="bidiq-stack">
                  {/* EFFORT */}
                  <div className="bidiq-card">
                    <SectionHeader
                      icon={<BarChart3 size={14} />}
                      accent={complexityAccent}
                      title="Effort Estimation"
                      subtitle="Total hours by skill tier"
                      rightSlot={
                        <span className="bidiq-section-pill" style={{ background: `${complexityAccent}15`, color: complexityAccent, border: `1px solid ${complexityAccent}30` }}>
                          {complexity}
                        </span>
                      }
                    />
                    <div className="bidiq-effort-stack">
                      {[
                        { label: "Beginner", val: beginnerRange, color: "#ef4444", pct: 90, icon: <Zap size={12} /> },
                        { label: "Intermediate", val: intermediateRange, color: "#f59e0b", pct: 65, icon: <Sparkles size={12} /> },
                        { label: "Expert", val: expertRange, color: "#10b981", pct: 35, icon: <ShieldCheck size={12} /> },
                      ].map((item, idx) => (
                        <div key={idx} className="bidiq-effort-row">
                          <div className="bidiq-effort-row-head">
                            <span className="bidiq-effort-label">
                              <span style={{ color: item.color, display: "inline-flex" }}>{item.icon}</span>
                              {item.label}
                            </span>
                            <span className="bidiq-effort-value">
                              <b>{item.val}</b> <span className="bidiq-effort-unit">hrs</span>
                            </span>
                          </div>
                          <div className="bidiq-effort-bar">
                            <div
                              className="bidiq-effort-bar-fill"
                              style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bidiq-effort-foot">
                      <span>Baseline</span>
                      <span>
                        <b>{baselineHours}</b> hrs total
                      </span>
                    </div>
                  </div>

                  {/* BUDGET REALITY */}
                  <div className="bidiq-card">
                    <SectionHeader
                      icon={<DollarSign size={14} />}
                      accent="#10b981"
                      title="Budget Reality Check"
                      subtitle="Market-aligned pricing strategy"
                    />

                    <div className="bidiq-budget-bars">
                      <div className="bidiq-budget-bar-item">
                        <div className="bidiq-budget-bar-head">
                          <span className="bidiq-budget-bar-label">Client Budget</span>
                          <span className="bidiq-budget-bar-val">${clientBudgetNum.toLocaleString()}</span>
                        </div>
                        <div className="bidiq-effort-bar">
                          <div className="bidiq-effort-bar-fill" style={{ width: "45%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
                        </div>
                      </div>
                      <div className="bidiq-budget-bar-item">
                        <div className="bidiq-budget-bar-head">
                          <span className="bidiq-budget-bar-label">Suggested Bid</span>
                          <span className="bidiq-budget-bar-val">${suggestedBudgetVal.toLocaleString()}</span>
                        </div>
                        <div className="bidiq-effort-bar">
                          <div className="bidiq-effort-bar-fill" style={{ width: "90%", background: "linear-gradient(90deg, #10b981, #34d399)" }} />
                        </div>
                      </div>
                    </div>

                    <div className="bidiq-pricing-segments">
                      {["Underpriced", "Fair", "High Value"].map((label) => {
                        const isActive = (label === "Underpriced" && isUnderpriced) || (label === "Fair" && !isUnderpriced);
                        return (
                          <div key={label} className={`bidiq-segment ${isActive ? "is-active" : ""}`}>
                            {label}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bidiq-tip">
                      <div className="bidiq-tip-icon">
                        <CheckCircle2 size={13} />
                      </div>
                      <div>
                        <span className="bidiq-tip-tag">Bidding tip</span>
                        Anchor at <b>${anchorPrice.toLocaleString()}</b> for Phase 1 to leave negotiation room.
                      </div>
                    </div>
                  </div>

                  {/* COMPETITION */}
                  <div className="bidiq-card">
                    <SectionHeader
                      icon={<Flame size={14} />}
                      accent="#ef4444"
                      title="Competition"
                      subtitle="How your bid stacks against the market"
                    />
                    <div className="bidiq-comp-grid">
                      <Tooltip title="Predicted average bid from similar listings">
                        <div className="bidiq-comp-tile">
                          <span className="bidiq-comp-label">Avg. Bid</span>
                          <span className="bidiq-comp-val">${avgBidVal.toLocaleString()}</span>
                          <span className="bidiq-comp-foot">across {(baselineHours % 35) + 15} bidders</span>
                        </div>
                      </Tooltip>
                      <Tooltip title="Skill match against this job">
                        <div className="bidiq-comp-tile">
                          <span className="bidiq-comp-label">Skill Match</span>
                          <span className="bidiq-comp-val" style={{ color: "#10b981" }}>
                            {lead.skill_analysis?.matchPercentage || 100}%
                          </span>
                          <span className="bidiq-comp-foot">{(lead.skill_analysis?.matchedSkills || []).length || skillsList.length} matched</span>
                        </div>
                      </Tooltip>
                    </div>
                    <div className="bidiq-comp-cta">
                      <Zap size={12} />
                      <span>
                        Bid near <b>${avgBidVal.toLocaleString()}</b> to remain competitive while preserving margin.
                      </span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* PROPOSAL OPTION MODAL */}
          <Modal
            open={optionModalOpen}
            onCancel={() => !generatingProposal && setOptionModalOpen(false)}
            footer={null}
            width={680}
            centered
            destroyOnClose
            className="bidiq-option-modal"
            closable={!generatingProposal}
            maskClosable={!generatingProposal}
          >
            <div className="bidiq-opt-header">
              <div className="bidiq-opt-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="bidiq-opt-title">Generate Proposal</div>
                <div className="bidiq-opt-sub">
                  Pick the duration & cost the proposal should be built around
                </div>
              </div>
            </div>

            <div className="bidiq-opt-grid">
              {/* OPTION 1: CLIENT */}
              <button
                type="button"
                onClick={() => setSelectedOption("client")}
                className={`bidiq-opt-card ${selectedOption === "client" ? "is-selected" : ""}`}
                disabled={generatingProposal}
              >
                <div className="bidiq-opt-card-head">
                  <span className="bidiq-opt-tag client">
                    <Users size={11} /> CLIENT'S TERMS
                  </span>
                  {selectedOption === "client" && (
                    <span className="bidiq-opt-check">
                      <CheckCircle2 size={16} />
                    </span>
                  )}
                </div>
                <div className="bidiq-opt-name">As Client Posted</div>
                <div className="bidiq-opt-rows">
                  <div className="bidiq-opt-row">
                    <span className="bidiq-opt-row-l">
                      <Clock size={12} /> Duration
                    </span>
                    <span className="bidiq-opt-row-v">{lead.duration || "Not specified"}</span>
                  </div>
                  <div className="bidiq-opt-row">
                    <span className="bidiq-opt-row-l">
                      <DollarSign size={12} /> Cost
                    </span>
                    <span className="bidiq-opt-row-v">
                      {lead.budget ? `$${clientBudgetNum.toLocaleString()}` : "Not specified"}
                    </span>
                  </div>
                </div>
                <div className="bidiq-opt-foot">Match the client's expectations exactly</div>
              </button>

              {/* OPTION 2: CUSTOM */}
              <div
                className={`bidiq-opt-card ${selectedOption === "custom" ? "is-selected" : ""}`}
                onClick={() => !generatingProposal && setSelectedOption("custom")}
              >
                <div className="bidiq-opt-card-head">
                  <span className="bidiq-opt-tag custom">
                    <Sparkles size={11} /> YOUR PLAN
                  </span>
                  {selectedOption === "custom" && (
                    <span className="bidiq-opt-check">
                      <CheckCircle2 size={16} />
                    </span>
                  )}
                </div>
                <div className="bidiq-opt-name">Set Your Own Terms</div>
                <div className="bidiq-opt-fields">
                  <div className="bidiq-opt-field">
                    <label>Project window</label>
                    <DatePicker.RangePicker
                      style={{ width: "100%", borderRadius: 8 }}
                      value={customDates as any}
                      onChange={(dates) => setCustomDates(dates as any)}
                      disabled={generatingProposal}
                      onClick={(e) => { e.stopPropagation(); setSelectedOption("custom"); }}
                    />
                    {customDays > 0 && (
                      <div className="bidiq-opt-hint">
                        ≈ {customDays} day{customDays !== 1 ? "s" : ""} ({Math.round(customDays / 7)}w)
                      </div>
                    )}
                  </div>
                  <div className="bidiq-opt-field">
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
                <div className="bidiq-opt-foot">Override with your scope-driven plan</div>
              </div>
            </div>

            {selectedOption && (
              <div className="bidiq-opt-note">
                <div className="bidiq-opt-note-icon">
                  <Info size={14} />
                </div>
                <div className="bidiq-opt-note-text">
                  <b>Note:</b> The proposal will be created based on the {selectedOption === "client" ? "client's posted" : "values you've entered"} duration and cost. AI will use these as constraints when shaping scope, deliverables, and milestones.
                </div>
              </div>
            )}

            <div className="bidiq-opt-footer">
              <Button
                onClick={() => setOptionModalOpen(false)}
                disabled={generatingProposal}
                style={{ borderRadius: 10, height: 40, fontWeight: 600, padding: "0 18px" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmGenerate}
                loading={generatingProposal}
                disabled={!selectedOption || (selectedOption === "custom" && !customValid)}
                className="bidiq-cta-btn"
                style={{ minWidth: 200 }}
                icon={!generatingProposal ? <Sparkles size={14} /> : undefined}
              >
                {generatingProposal ? "Generating Proposal..." : "Create Proposal"}
                {!generatingProposal && <ArrowUpRight size={14} />}
              </Button>
            </div>
          </Modal>

          <style dangerouslySetInnerHTML={{
            __html: `
            .bidiq-canvas {
              background: var(--bg-pure-white);
              min-height: 100vh;
              padding-bottom: 60px;
              font-family: 'Inter', -apple-system, sans-serif;
            }

            /* TOP BAR */
            .bidiq-topbar {
              position: sticky; top: 0; z-index: 50;
              background: rgba(255,255,255,0.85);
              backdrop-filter: saturate(180%) blur(12px);
              -webkit-backdrop-filter: saturate(180%) blur(12px);
              border-bottom: 1px solid var(--border-slate-100);
            }
            .bidiq-topbar-inner {
              display: flex; align-items: center; justify-content: space-between;
              padding: 10px 24px; height: 60px;
            }
            .bidiq-topbar-left, .bidiq-topbar-right {
              display: flex; align-items: center; gap: 14px;
            }
            .bidiq-back-btn {
              display: inline-flex; align-items: center; gap: 4px;
              color: var(--text-slate-500); font-weight: 600; height: 32px;
              border-radius: 8px; padding: 0 10px;
            }
            .bidiq-back-btn:hover { background: var(--bg-slate-50) !important; color: var(--text-slate-900) !important; }
            .bidiq-topbar-divider { width: 1px; height: 22px; background: var(--border-slate-100); }
            .bidiq-brand { display: inline-flex; align-items: center; gap: 8px; }
            .bidiq-brand-icon {
              width: 26px; height: 26px; border-radius: 8px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              color: #fff; display: inline-flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 10px rgba(99,102,241,0.35);
            }
            .bidiq-brand-text { font-weight: 900; font-size: 15px; color: var(--text-slate-900); letter-spacing: -0.02em; }
            .bidiq-brand-tag {
              padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 800;
              background: rgba(99,102,241,0.1); color: #6366f1; letter-spacing: 0.05em; text-transform: uppercase;
              border: 1px solid rgba(99,102,241,0.2);
            }
            .bidiq-breadcrumb { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
            .bidiq-crumb { color: var(--text-slate-500); font-weight: 600; }
            .bidiq-crumb-sep { color: var(--text-slate-400); }
            .bidiq-crumb-current { color: var(--text-slate-900); font-weight: 700; max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .bidiq-ai-status {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
              border: 1px solid; background: var(--bg-slate-50);
            }
            .bidiq-ai-status.is-loading { color: #6366f1; border-color: rgba(99,102,241,0.25); background: rgba(99,102,241,0.06); }
            .bidiq-ai-status.is-ready { color: #10b981; border-color: rgba(16,185,129,0.25); background: rgba(16,185,129,0.06); }
            .bidiq-ai-status.is-fallback { color: #94a3b8; border-color: var(--border-slate-100); background: var(--bg-slate-50); }
            .bidiq-cta-btn {
              height: 36px; border-radius: 10px; padding: 0 14px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
              color: #fff !important; border: none !important;
              font-weight: 700; font-size: 13px;
              box-shadow: 0 6px 16px -4px rgba(99,102,241,0.45);
              display: inline-flex; align-items: center; gap: 6px;
              transition: transform 0.18s ease, box-shadow 0.18s ease;
            }
            .bidiq-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -6px rgba(99,102,241,0.55) !important; }

            /* BODY */
            .bidiq-body { padding: 24px 32px 0; }

            /* HERO */
            .bidiq-hero {
              position: relative;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 20px;
              padding: 22px 24px;
              margin-bottom: 22px;
              overflow: hidden;
              box-shadow: 0 1px 3px 0 rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06);
            }
            .bidiq-hero-bg {
              position: absolute; inset: 0; pointer-events: none;
              background:
                radial-gradient(40% 60% at 100% 0%, rgba(139,92,246,0.07) 0%, transparent 60%),
                radial-gradient(40% 60% at 0% 100%, rgba(99,102,241,0.06) 0%, transparent 60%);
            }
            .bidiq-hero-grid {
              position: relative;
              display: grid; grid-template-columns: 1fr auto; gap: 28px;
              align-items: flex-start;
            }
            @media (max-width: 991px) {
              .bidiq-hero-grid { grid-template-columns: 1fr; }
            }
            .bidiq-hero-meta {
              display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
              margin-bottom: 10px;
            }
            .bidiq-platform-pill {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 4px 10px; border-radius: 999px;
              background: rgba(99,102,241,0.08); color: #6366f1;
              border: 1px solid rgba(99,102,241,0.18);
              font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;
            }
            .bidiq-platform-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
            .bidiq-meta-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--border-slate-200); }
            .bidiq-meta-item {
              display: inline-flex; align-items: center; gap: 4px;
              font-size: 12px; color: var(--text-slate-500); font-weight: 500;
            }
            .bidiq-meta-verified { color: #10b981; font-weight: 700; }
            .bidiq-hero-title {
              color: var(--text-slate-900) !important;
              font-weight: 800 !important;
              letter-spacing: -0.025em !important;
              margin: 0 0 14px 0 !important;
              font-size: 24px !important;
              line-height: 1.25 !important;
              max-width: 720px;
            }
            .bidiq-hero-client {
              display: inline-flex; align-items: center; gap: 12px;
              padding: 8px 14px 8px 8px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              border-radius: 999px;
            }
            .bidiq-hero-client-avatar {
              width: 32px; height: 32px; border-radius: 50%;
              background: linear-gradient(135deg, #6366f1, #ec4899);
              color: #fff; font-weight: 800; font-size: 13px;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
            }
            .bidiq-hero-client-info { display: flex; flex-direction: column; line-height: 1.3; }
            .bidiq-hero-client-name { font-weight: 700; font-size: 13px; color: var(--text-slate-900); }
            .bidiq-hero-client-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 500; }
            .bidiq-hero-kpis {
              display: grid; grid-template-columns: repeat(2, minmax(150px, 1fr));
              gap: 10px; min-width: 340px;
            }
            @media (max-width: 991px) { .bidiq-hero-kpis { grid-template-columns: repeat(2, 1fr); min-width: 0; } }
            @media (max-width: 600px) { .bidiq-hero-kpis { grid-template-columns: 1fr 1fr; } }
            .bidiq-kpi-tile {
              display: flex; align-items: center; gap: 10px;
              padding: 12px 14px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 14px;
              transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
            }
            .bidiq-kpi-tile:hover {
              transform: translateY(-2px);
              border-color: var(--border-slate-200);
              box-shadow: 0 8px 20px -10px rgba(15,23,42,0.08);
            }
            .bidiq-kpi-icon {
              width: 36px; height: 36px; border-radius: 10px;
              display: inline-flex; align-items: center; justify-content: center;
              color: #fff; flex-shrink: 0;
            }
            .bidiq-kpi-text { display: flex; flex-direction: column; line-height: 1.1; min-width: 0; }
            .bidiq-kpi-label {
              font-size: 10px; font-weight: 800; color: var(--text-slate-400);
              letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px;
            }
            .bidiq-kpi-value {
              font-size: 18px; font-weight: 800; color: var(--text-slate-900);
              letter-spacing: -0.02em; line-height: 1.05;
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .bidiq-kpi-suffix { font-size: 12px; color: var(--text-slate-400); margin-left: 2px; }

            /* SKILLS BAND */
            .bidiq-skills-band {
              position: relative;
              margin-top: 18px;
              padding-top: 16px;
              border-top: 1px dashed var(--border-slate-100);
            }
            .bidiq-skills-band-head {
              display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
            }
            .bidiq-skills-label {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 10px; font-weight: 800; color: var(--text-slate-400);
              letter-spacing: 0.08em; text-transform: uppercase;
            }
            .bidiq-skills-controls { display: inline-flex; gap: 4px; }
            .bidiq-skills-controls button {
              width: 24px; height: 24px; border-radius: 7px;
              background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
              color: #6366f1; cursor: pointer;
              display: inline-flex; align-items: center; justify-content: center;
              transition: background 0.15s ease;
            }
            .bidiq-skills-controls button:hover { background: rgba(99,102,241,0.08); }
            .bidiq-skills-row {
              display: flex; gap: 6px;
              overflow-x: auto; scroll-behavior: smooth;
              padding-bottom: 4px;
            }
            .bidiq-skill-pill {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 5px 11px; border-radius: 999px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              color: var(--text-slate-700);
              font-size: 11px; font-weight: 700;
              flex-shrink: 0;
              transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
            }
            .bidiq-skill-pill:hover {
              background: rgba(99,102,241,0.08);
              border-color: rgba(99,102,241,0.2);
              color: #4f46e5;
            }
            .bidiq-skill-dot { width: 5px; height: 5px; border-radius: 50%; background: #6366f1; }
            .bidiq-skill-empty { color: var(--text-slate-400); font-style: italic; }

            /* GENERIC CARD + SECTION HEADERS */
            .bidiq-grid { margin-top: 0; }
            .bidiq-stack { display: flex; flex-direction: column; gap: 18px; }
            .bidiq-card {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 18px;
              padding: 18px 20px;
              transition: border-color 0.18s ease, box-shadow 0.18s ease;
            }
            .bidiq-card:hover { border-color: var(--border-slate-200); box-shadow: 0 1px 3px 0 rgba(15,23,42,0.03); }
            .bidiq-section-head {
              display: flex; align-items: flex-start; justify-content: space-between;
              gap: 12px; margin-bottom: 14px;
            }
            .bidiq-section-head-left { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
            .bidiq-section-icon {
              width: 32px; height: 32px; border-radius: 9px;
              display: inline-flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .bidiq-section-text { display: flex; flex-direction: column; min-width: 0; }
            .bidiq-section-title { font-size: 13px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.005em; }
            .bidiq-section-sub { font-size: 11px; color: var(--text-slate-400); font-weight: 500; margin-top: 2px; line-height: 1.3; }
            .bidiq-section-pill {
              display: inline-flex; align-items: center;
              padding: 3px 9px; border-radius: 999px;
              font-size: 10px; font-weight: 800; letter-spacing: 0.03em;
              white-space: nowrap;
            }
            .bidiq-loading-pill {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 3px 10px; border-radius: 999px;
              background: rgba(99,102,241,0.08); color: #6366f1;
              border: 1px solid rgba(99,102,241,0.2);
              font-size: 10px; font-weight: 800;
            }

            /* VERDICT CARD */
            .bidiq-verdict-card {
              position: relative; overflow: hidden;
              border-radius: 20px; padding: 20px;
              color: #fff;
              box-shadow: 0 10px 30px -10px rgba(99,102,241,0.45);
            }
            .bidiq-verdict-glow {
              position: absolute; inset: 0; pointer-events: none;
              background:
                radial-gradient(40% 60% at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 50%),
                radial-gradient(50% 50% at 0% 100%, rgba(255,255,255,0.1) 0%, transparent 60%);
            }
            .bidiq-verdict-head {
              display: flex; align-items: center; justify-content: space-between;
              margin-bottom: 14px; position: relative;
            }
            .bidiq-verdict-pill {
              display: inline-flex; align-items: center; gap: 5px;
              padding: 4px 9px; border-radius: 999px;
              background: rgba(255,255,255,0.16);
              border: 1px solid rgba(255,255,255,0.22);
              color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
            }
            .bidiq-verdict-conf { font-size: 10px; font-weight: 700; opacity: 0.85; }
            .bidiq-verdict-body {
              display: flex; align-items: center; justify-content: space-between;
              gap: 16px; position: relative;
            }
            .bidiq-verdict-text { flex: 1; min-width: 0; }
            .bidiq-verdict-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
            .bidiq-verdict-sub { font-size: 12px; opacity: 0.92; margin-top: 4px; font-weight: 500; line-height: 1.4; }
            .bidiq-verdict-gauge { flex-shrink: 0; }
            .bidiq-gauge-text { color: #fff; }
            .bidiq-gauge-num { font-size: 22px; font-weight: 900; line-height: 1; }
            .bidiq-gauge-pct { font-size: 9px; opacity: 0.7; margin-top: 2px; }
            .bidiq-verdict-meters {
              display: grid; grid-template-columns: repeat(3, 1fr);
              gap: 6px; margin-top: 18px; position: relative;
            }
            .bidiq-verdict-meter {
              padding: 8px 10px; border-radius: 10px;
              background: rgba(255,255,255,0.12);
              border: 1px solid rgba(255,255,255,0.16);
            }
            .bidiq-verdict-meter-label {
              display: inline-flex; align-items: center; gap: 4px;
              font-size: 9px; font-weight: 800; opacity: 0.85;
              letter-spacing: 0.04em; text-transform: uppercase;
              margin-bottom: 4px;
            }
            .bidiq-verdict-meter-val { font-size: 14px; font-weight: 800; }

            /* RISKS */
            .bidiq-risk-stack { display: flex; flex-direction: column; gap: 8px; }
            .bidiq-risk-row {
              display: flex; align-items: flex-start; gap: 10px;
              padding: 10px 12px; border-radius: 12px;
              border: 1px solid;
            }
            .bidiq-risk-row.tone-red { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.18); }
            .bidiq-risk-row.tone-yellow { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.18); }
            .bidiq-risk-row.tone-grey { background: var(--bg-slate-50); border-color: var(--border-slate-100); }
            .bidiq-risk-icon {
              width: 26px; height: 26px; border-radius: 7px;
              display: inline-flex; align-items: center; justify-content: center;
              flex-shrink: 0; background: var(--bg-pure-white);
            }
            .bidiq-risk-row.tone-red .bidiq-risk-icon { color: #dc2626; }
            .bidiq-risk-row.tone-yellow .bidiq-risk-icon { color: #d97706; }
            .bidiq-risk-row.tone-grey .bidiq-risk-icon { color: #64748b; }
            .bidiq-risk-text { flex: 1; min-width: 0; }
            .bidiq-risk-title { font-size: 12px; font-weight: 800; color: var(--text-slate-900); margin-bottom: 2px; }
            .bidiq-risk-desc { font-size: 11px; color: var(--text-slate-500); line-height: 1.4; }
            .bidiq-risk-badge {
              padding: 2px 7px; border-radius: 999px;
              font-size: 9px; font-weight: 900; letter-spacing: 0.05em;
              align-self: center; flex-shrink: 0;
            }
            .bidiq-risk-badge.tone-red { background: #fee2e2; color: #dc2626; }
            .bidiq-risk-badge.tone-yellow { background: #fef3c7; color: #d97706; }
            .bidiq-risk-badge.tone-grey { background: #e2e8f0; color: #64748b; }

            /* SUMMARY */
            .bidiq-summary-card { position: relative; }
            .bidiq-summary-body { min-height: 80px; }
            .bidiq-summary-quote {
              position: relative; padding: 14px 16px 14px 36px;
              background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.04));
              border: 1px solid rgba(99,102,241,0.16);
              border-radius: 12px; font-size: 13px; line-height: 1.55;
              color: var(--text-slate-700); font-weight: 500;
            }
            .bidiq-quote-mark {
              position: absolute; top: 4px; left: 12px;
              font-size: 36px; color: #6366f1; font-family: Georgia, serif; line-height: 1;
              opacity: 0.5;
            }
            .bidiq-summary-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
            .bidiq-summary-list li {
              display: flex; gap: 9px; align-items: flex-start;
              font-size: 12px; line-height: 1.5; color: var(--text-slate-700);
            }
            .bidiq-summary-list svg { color: #6366f1; margin-top: 3px; flex-shrink: 0; }
            .bidiq-summary-skeleton { display: flex; flex-direction: column; gap: 8px; padding: 6px 0; }
            .sk-line {
              height: 11px; border-radius: 6px;
              background: linear-gradient(90deg, var(--bg-slate-50) 0%, var(--border-slate-100) 50%, var(--bg-slate-50) 100%);
              background-size: 200% 100%;
              animation: skShimmer 1.4s ease-in-out infinite;
            }
            @keyframes skShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .bidiq-empty-mini {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 10px 14px; background: var(--bg-slate-50);
              border: 1px dashed var(--border-slate-200); border-radius: 10px;
              font-size: 12px; color: var(--text-slate-500); font-weight: 500;
            }

            /* REALITY GAP TABLE */
            .bidiq-gap-table { display: flex; flex-direction: column; gap: 4px; }
            .bidiq-gap-th {
              display: grid; grid-template-columns: 1.4fr 0.9fr 0.9fr 0.5fr;
              padding: 0 12px 6px; gap: 8px;
              border-bottom: 1px dashed var(--border-slate-100);
              margin-bottom: 4px;
            }
            .bidiq-gap-th span {
              font-size: 9px; font-weight: 800; color: var(--text-slate-400);
              letter-spacing: 0.06em; text-transform: uppercase;
            }
            .bidiq-gap-th span:nth-child(2),
            .bidiq-gap-th span:nth-child(3) { text-align: right; }
            .bidiq-gap-th span:nth-child(4) { text-align: center; }
            .bidiq-gap-row {
              display: grid; grid-template-columns: 1.4fr 0.9fr 0.9fr 0.5fr;
              align-items: center; gap: 8px;
              padding: 9px 12px; border-radius: 10px;
              border: 1px solid var(--border-slate-100);
              transition: background 0.15s ease;
            }
            .bidiq-gap-row:hover { background: var(--bg-slate-50); }
            .bidiq-gap-name { display: flex; align-items: center; gap: 9px; min-width: 0; }
            .bidiq-gap-name span:last-child { font-size: 12px; font-weight: 700; color: var(--text-slate-900); }
            .bidiq-gap-iconbox {
              width: 26px; height: 26px; border-radius: 7px;
              display: inline-flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .bidiq-gap-client {
              font-size: 11px; color: var(--text-slate-400);
              text-decoration: line-through; text-align: right; font-weight: 600;
            }
            .bidiq-gap-reality {
              font-size: 12px; font-weight: 800; color: var(--text-slate-900); text-align: right;
            }
            .bidiq-gap-delta {
              display: inline-flex; align-items: center; justify-content: center;
              padding: 3px 6px; border-radius: 6px;
              font-size: 10px; font-weight: 900;
              justify-self: center;
              white-space: nowrap;
            }
            .bidiq-advise {
              margin-top: 12px; display: flex; gap: 10px; align-items: center;
              padding: 10px 12px; border-radius: 10px;
              background: linear-gradient(135deg, rgba(99,102,241,0.04), rgba(236,72,153,0.04));
              border: 1px solid rgba(99,102,241,0.16);
            }
            .bidiq-advise-icon {
              width: 28px; height: 28px; border-radius: 8px;
              background: rgba(99,102,241,0.12); color: #6366f1;
              display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
            }
            .bidiq-advise-text { font-size: 11px; color: var(--text-slate-700); line-height: 1.4; font-weight: 500; }
            .bidiq-advise-tag {
              display: inline-block; padding: 1px 7px; border-radius: 999px;
              background: rgba(99,102,241,0.12); color: #6366f1;
              font-size: 9px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;
              margin-right: 6px;
            }

            /* EFFORT */
            .bidiq-effort-stack { display: flex; flex-direction: column; gap: 12px; }
            .bidiq-effort-row-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
            .bidiq-effort-label {
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 11px; font-weight: 700; color: var(--text-slate-700);
            }
            .bidiq-effort-value { font-size: 11px; color: var(--text-slate-500); }
            .bidiq-effort-value b { font-size: 12px; color: var(--text-slate-900); font-weight: 800; }
            .bidiq-effort-unit { color: var(--text-slate-400); }
            .bidiq-effort-bar {
              height: 8px; border-radius: 999px;
              background: var(--bg-slate-50);
              overflow: hidden;
              position: relative;
            }
            .bidiq-effort-bar-fill {
              height: 100%; border-radius: 999px;
              transition: width 0.4s ease;
            }
            .bidiq-effort-foot {
              display: flex; justify-content: space-between; align-items: center;
              margin-top: 14px; padding-top: 12px;
              border-top: 1px dashed var(--border-slate-100);
              font-size: 11px; color: var(--text-slate-500); font-weight: 600;
            }
            .bidiq-effort-foot b { color: var(--text-slate-900); font-weight: 800; }

            /* BUDGET BARS */
            .bidiq-budget-bars { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }
            .bidiq-budget-bar-item { }
            .bidiq-budget-bar-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
            .bidiq-budget-bar-label { font-size: 11px; font-weight: 700; color: var(--text-slate-700); }
            .bidiq-budget-bar-val { font-size: 13px; font-weight: 800; color: var(--text-slate-900); }
            .bidiq-pricing-segments { display: flex; gap: 4px; margin-bottom: 12px; }
            .bidiq-segment {
              flex: 1; text-align: center; padding: 6px 4px;
              border-radius: 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.03em;
              background: var(--bg-slate-50); color: var(--text-slate-400);
              border: 1px solid var(--border-slate-100);
            }
            .bidiq-segment.is-active {
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              color: #fff; border-color: transparent;
              box-shadow: 0 4px 10px -2px rgba(99,102,241,0.35);
            }
            .bidiq-tip {
              display: flex; gap: 10px; align-items: center;
              padding: 10px 12px; border-radius: 10px;
              background: rgba(16,185,129,0.06);
              border: 1px solid rgba(16,185,129,0.18);
              font-size: 11px; color: var(--text-slate-700); line-height: 1.4;
            }
            .bidiq-tip-icon {
              width: 28px; height: 28px; border-radius: 8px;
              background: rgba(16,185,129,0.12); color: #10b981;
              display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
            }
            .bidiq-tip-tag {
              display: inline-block; padding: 1px 7px; border-radius: 999px;
              background: rgba(16,185,129,0.14); color: #10b981;
              font-size: 9px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;
              margin-right: 6px;
            }

            /* COMPETITION */
            .bidiq-comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .bidiq-comp-tile {
              padding: 12px 14px; border-radius: 12px;
              background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
              display: flex; flex-direction: column; gap: 4px;
              transition: background 0.15s ease, border-color 0.15s ease;
            }
            .bidiq-comp-tile:hover { background: rgba(99,102,241,0.04); border-color: rgba(99,102,241,0.16); }
            .bidiq-comp-label {
              font-size: 9px; font-weight: 800; color: var(--text-slate-400);
              letter-spacing: 0.06em; text-transform: uppercase;
            }
            .bidiq-comp-val { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
            .bidiq-comp-foot { font-size: 10px; color: var(--text-slate-400); font-weight: 600; }
            .bidiq-comp-cta {
              margin-top: 12px; padding: 10px 12px; border-radius: 10px;
              background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.18);
              display: flex; align-items: center; gap: 8px;
              font-size: 11px; color: var(--text-slate-700); font-weight: 500;
            }
            .bidiq-comp-cta svg { color: #6366f1; flex-shrink: 0; }

            /* UTIL */
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .spin { animation: spin 1.2s linear infinite; }
            @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

            /* OPTION MODAL */
            .bidiq-option-modal .ant-modal-content {
              border-radius: 18px !important;
              padding: 24px !important;
              overflow: hidden;
            }
            .bidiq-opt-header {
              display: flex; align-items: flex-start; gap: 12px;
              margin-bottom: 18px;
            }
            .bidiq-opt-icon {
              width: 40px; height: 40px; border-radius: 12px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              color: #fff; display: inline-flex; align-items: center; justify-content: center;
              box-shadow: 0 6px 14px -4px rgba(99,102,241,0.45);
              flex-shrink: 0;
            }
            .bidiq-opt-title {
              font-size: 18px; font-weight: 800; color: var(--text-slate-900);
              letter-spacing: -0.01em;
            }
            .bidiq-opt-sub {
              font-size: 12px; color: var(--text-slate-500); font-weight: 500; margin-top: 2px;
            }
            .bidiq-opt-grid {
              display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
              margin-bottom: 14px;
            }
            @media (max-width: 720px) { .bidiq-opt-grid { grid-template-columns: 1fr; } }
            .bidiq-opt-card {
              text-align: left;
              background: var(--bg-pure-white);
              border: 1.5px solid var(--border-slate-100);
              border-radius: 14px;
              padding: 16px;
              cursor: pointer;
              transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
              display: flex; flex-direction: column; gap: 10px;
              font-family: inherit;
            }
            button.bidiq-opt-card { width: 100%; }
            .bidiq-opt-card:hover {
              border-color: rgba(99,102,241,0.4);
              box-shadow: 0 6px 18px -8px rgba(99,102,241,0.2);
            }
            .bidiq-opt-card.is-selected {
              border-color: #6366f1;
              box-shadow: 0 0 0 4px rgba(99,102,241,0.12), 0 8px 22px -8px rgba(99,102,241,0.35);
              background: linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04));
            }
            .bidiq-opt-card-head {
              display: flex; justify-content: space-between; align-items: center;
            }
            .bidiq-opt-tag {
              display: inline-flex; align-items: center; gap: 4px;
              padding: 3px 9px; border-radius: 999px;
              font-size: 9px; font-weight: 800; letter-spacing: 0.06em;
              border: 1px solid;
            }
            .bidiq-opt-tag.client { background: rgba(16,185,129,0.08); color: #10b981; border-color: rgba(16,185,129,0.22); }
            .bidiq-opt-tag.custom { background: rgba(99,102,241,0.08); color: #6366f1; border-color: rgba(99,102,241,0.22); }
            .bidiq-opt-check { color: #6366f1; display: inline-flex; }
            .bidiq-opt-name {
              font-size: 15px; font-weight: 800; color: var(--text-slate-900);
              letter-spacing: -0.01em;
            }
            .bidiq-opt-rows { display: flex; flex-direction: column; gap: 6px; }
            .bidiq-opt-row {
              display: flex; justify-content: space-between; align-items: center;
              padding: 8px 10px; border-radius: 8px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
            }
            .bidiq-opt-row-l {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 11px; font-weight: 700; color: var(--text-slate-500);
            }
            .bidiq-opt-row-v {
              font-size: 12px; font-weight: 800; color: var(--text-slate-900);
            }
            .bidiq-opt-fields { display: flex; flex-direction: column; gap: 10px; }
            .bidiq-opt-field { display: flex; flex-direction: column; gap: 5px; }
            .bidiq-opt-field label {
              font-size: 10px; font-weight: 800; color: var(--text-slate-500);
              letter-spacing: 0.04em; text-transform: uppercase;
            }
            .bidiq-opt-hint {
              font-size: 10px; color: #6366f1; font-weight: 700;
            }
            .bidiq-opt-foot {
              font-size: 11px; color: var(--text-slate-400); font-weight: 500;
              padding-top: 6px; border-top: 1px dashed var(--border-slate-100);
              margin-top: auto;
            }
            .bidiq-opt-note {
              display: flex; gap: 10px; align-items: flex-start;
              padding: 12px 14px; border-radius: 12px;
              background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(236,72,153,0.05));
              border: 1px solid rgba(99,102,241,0.2);
              margin-bottom: 14px;
            }
            .bidiq-opt-note-icon {
              width: 26px; height: 26px; border-radius: 8px;
              background: rgba(99,102,241,0.14); color: #6366f1;
              display: inline-flex; align-items: center; justify-content: center;
              flex-shrink: 0; margin-top: 1px;
            }
            .bidiq-opt-note-text {
              font-size: 12px; color: var(--text-slate-700); line-height: 1.5; font-weight: 500;
            }
            .bidiq-opt-note-text b { color: #6366f1; font-weight: 800; }
            .bidiq-opt-footer {
              display: flex; justify-content: flex-end; gap: 10px;
              padding-top: 14px;
              border-top: 1px solid var(--border-slate-100);
            }
            [data-theme='dark'] .bidiq-option-modal .ant-modal-content { background: #161b22 !important; }
            [data-theme='dark'] .bidiq-opt-title { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-opt-sub { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-opt-card { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-opt-card.is-selected { background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06)) !important; border-color: #6366f1 !important; }
            [data-theme='dark'] .bidiq-opt-name { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-opt-row { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-opt-row-v { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-opt-row-l { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-opt-foot { color: #6e7681 !important; border-top-color: #30363d !important; }
            [data-theme='dark'] .bidiq-opt-note { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.25) !important; }
            [data-theme='dark'] .bidiq-opt-note-text { color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-opt-footer { border-top-color: #30363d !important; }

            /* DARK THEME */
            [data-theme='dark'] .bidiq-canvas { background: #0d1117 !important; }
            [data-theme='dark'] .bidiq-topbar { background: rgba(13,17,23,0.85) !important; border-bottom-color: #30363d !important; }
            [data-theme='dark'] .bidiq-back-btn:hover { background: #1c2128 !important; color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-topbar-divider { background: #30363d !important; }
            [data-theme='dark'] .bidiq-brand-text { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-crumb { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-crumb-current { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-ai-status.is-fallback { background: #161b22 !important; border-color: #30363d !important; color: #8b949e !important; }
            [data-theme='dark'] .bidiq-hero { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-hero-title { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-meta-item { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-hero-client { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-hero-client-name { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-hero-client-sub { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-kpi-tile { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-kpi-tile:hover { border-color: #3d444d !important; }
            [data-theme='dark'] .bidiq-kpi-value { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-kpi-label { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-skill-pill { background: #0d1117 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-skills-controls button { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-card { background: #161b22 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-card:hover { border-color: #3d444d !important; }
            [data-theme='dark'] .bidiq-section-title { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-section-sub { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-risk-row.tone-grey { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-risk-row.tone-red { background: rgba(239,68,68,0.1) !important; border-color: rgba(239,68,68,0.25) !important; }
            [data-theme='dark'] .bidiq-risk-row.tone-yellow { background: rgba(245,158,11,0.1) !important; border-color: rgba(245,158,11,0.25) !important; }
            [data-theme='dark'] .bidiq-risk-icon { background: #161b22 !important; }
            [data-theme='dark'] .bidiq-risk-title { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-risk-desc { color: #8b949e !important; }
            [data-theme='dark'] .bidiq-summary-quote { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.25) !important; color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-summary-list li { color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-empty-mini { background: #0d1117 !important; border-color: #30363d !important; color: #8b949e !important; }
            [data-theme='dark'] .sk-line { background: linear-gradient(90deg, #161b22 0%, #21262d 50%, #161b22 100%) !important; background-size: 200% 100% !important; }
            [data-theme='dark'] .bidiq-gap-row { border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-gap-row:hover { background: #0d1117 !important; }
            [data-theme='dark'] .bidiq-gap-name span:last-child { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-gap-reality { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-gap-client { color: #6e7681 !important; }
            [data-theme='dark'] .bidiq-gap-th { border-bottom-color: #30363d !important; }
            [data-theme='dark'] .bidiq-effort-bar { background: #0d1117 !important; }
            [data-theme='dark'] .bidiq-effort-foot { border-top-color: #30363d !important; color: #8b949e !important; }
            [data-theme='dark'] .bidiq-effort-foot b { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-effort-label { color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-effort-value b { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-budget-bar-label { color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-budget-bar-val { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-segment { background: #0d1117 !important; border-color: #30363d !important; color: #6e7681 !important; }
            [data-theme='dark'] .bidiq-tip { background: rgba(16,185,129,0.1) !important; border-color: rgba(16,185,129,0.25) !important; color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-comp-tile { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .bidiq-comp-val { color: #f0f6fc !important; }
            [data-theme='dark'] .bidiq-comp-cta { background: rgba(99,102,241,0.1) !important; border-color: rgba(99,102,241,0.25) !important; color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-advise { background: rgba(99,102,241,0.06) !important; border-color: rgba(99,102,241,0.2) !important; }
            [data-theme='dark'] .bidiq-advise-text { color: #c9d1d9 !important; }
            [data-theme='dark'] .bidiq-skills-band { border-top-color: #30363d !important; }
            [data-theme='dark'] .bidiq-meta-sep { background: #30363d !important; }
            `,
          }} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
