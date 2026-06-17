"use client";

import React, { useState, useEffect } from "react";
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
  Activity,
  Flame,
  ArrowUpRight,
  Gauge,
  MapPin,
  Layers,
  Brain,
  Briefcase,
  Calendar,
  FileText,
  X,
  Eye,
  ExternalLink,
  Edit3,
} from "lucide-react";
import {
  Button,
  Empty,
  Skeleton,
  Tooltip,
  Modal,
  Drawer,
  DatePicker,
  InputNumber,
  Segmented,
} from "antd";
import { ProposalLivePreview } from "@/components/proposals/ProposalLivePreview";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type VerdictTone = "go" | "review" | "skip";

const verdictPalette: Record<VerdictTone, { bg: string; border: string; accent: string; pillBg: string; }> = {
  go:     { bg: "#ecfdf5", border: "rgba(16, 185, 129, 0.22)", accent: "#047857", pillBg: "rgba(16, 185, 129, 0.12)" },
  review: { bg: "#eff6ff", border: "rgba(59, 130, 246, 0.22)", accent: "#1d4ed8", pillBg: "rgba(59, 130, 246, 0.14)" },
  skip:   { bg: "var(--bg-slate-50)", border: "var(--border-slate-100)", accent: "#475569", pillBg: "rgba(100, 116, 139, 0.12)" },
};

export default function BidiqIntelligencePage() {
  const { id } = useParams();
  const router = useRouter();
  const { leads, loading, fetchLeads } = useLeads();
  const lead = leads.find((l) => l.id === id);
  const [aiData, setAiData] = useState<any>(null);
  const [fetchingAI, setFetchingAI] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"client" | "custom" | null>(null);
  const [customDates, setCustomDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [customCost, setCustomCost] = useState<number | null>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalStep, setProposalStep] = useState<0 | 1>(0);
  const [proposalDrawerOpen, setProposalDrawerOpen] = useState(false);
  const [proposalDetail, setProposalDetail] = useState<any>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalView, setProposalView] = useState<"preview" | "sections">("preview");

  const openProposalDrawer = async () => {
    if (!lead?.proposal_id) return;
    setProposalDrawerOpen(true);
    if (proposalDetail?.id === lead.proposal_id) return;
    setProposalLoading(true);
    try {
      const res: any = await ProposalService.getProposalById(lead.proposal_id);
      setProposalDetail(res?.data?.data || res?.data || res);
    } catch (err) {
      console.error("Failed to fetch proposal:", err);
    } finally {
      setProposalLoading(false);
    }
  };

  const closeProposalFlow = () => {
    if (generatingProposal) return;
    setProposalModalOpen(false);
    // Reset after the modal animates out so the UI doesn't flash mid-close.
    setTimeout(() => {
      setProposalStep(0);
      setSelectedOption(null);
      setCustomDates(null);
      setCustomCost(null);
    }, 200);
  };

  const goToOptionStep = () => {
    // Default to "client" terms — most common starting point.
    setSelectedOption("client");
    setCustomDates(null);
    setCustomCost(null);
    setProposalStep(1);
  };

  const openProposalFlow = () => {
    setProposalStep(0);
    setSelectedOption(null);
    setCustomDates(null);
    setCustomCost(null);
    setProposalModalOpen(true);
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading || !lead) {
    if (loading) {
      return (
        <ProtectedRoute>
          <MainLayout>
            <div className="biq-page">
              <div className="biq-topbar">
                <Skeleton.Input active size="small" style={{ width: 320 }} />
              </div>
              <div className="biq-body">
                <Skeleton active paragraph={{ rows: 4 }} />
                <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 20 }} />
                <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 20 }} />
              </div>
              {bidiqStyles}
            </div>
          </MainLayout>
        </ProtectedRoute>
      );
    }
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="biq-page biq-empty">
            <Empty description="Lead intelligence not found">
              <Button type="primary" className="biq-primary-btn" onClick={() => router.push("/leads")}>
                Back to leads
              </Button>
            </Empty>
            {bidiqStyles}
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const handleConfirmGenerate = async () => {
    if (!selectedOption) return;
    let payload: { selection: "client" | "custom"; duration?: string; cost?: string | number; startDate?: string; endDate?: string };
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
      const res = await ProposalService.generateContentOnly(id as string, payload);
      if (res && res.blocks) {
        sessionStorage.setItem("pending_proposal_data", JSON.stringify({ ...res, selection: payload }));
        setProposalModalOpen(false);
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
  const decisionSub = score > 70 ? "Strong client signals — apply within 4h." : score > 40 ? "Mixed signals — review requirements carefully." : "Low success probability — consider skipping.";
  const verdictTone: VerdictTone = score > 70 ? "go" : score > 40 ? "review" : "skip";
  const verdictColors = verdictPalette[verdictTone];

  const coachSummary = aiData?.summary || "AI is analyzing project signals to provide a winning bid strategy...";

  const expertRange = `${Math.round(baselineHours * 0.7)}-${Math.round(baselineHours * 0.9)}`;
  const intermediateRange = `${Math.round(baselineHours * 0.9)}-${Math.round(baselineHours * 1.15)}`;
  const beginnerRange = `${Math.round(baselineHours * 1.15)}-${Math.round(baselineHours * 1.4)}`;

  const generateLeadRisks = () => {
    if (aiData?.risks) {
      return aiData.risks.map((r: any) => ({
        ...r,
        icon: r.type === "red" ? <AlertCircle size={13} /> : r.type === "yellow" ? <AlertTriangle size={13} /> : <Info size={13} />,
      }));
    }
    const risks: { type: "red" | "yellow" | "grey"; title: string; desc: string; icon: any }[] = [];
    if (!lead.client_payment_verified) {
      risks.push({ type: "red", title: "Unverified payment", desc: "Client has not verified a payment method yet.", icon: <AlertCircle size={13} /> });
    }
    if (budgetGap > 40) {
      risks.push({ type: "yellow", title: "Budget variance", desc: `Client budget is ${budgetGap}% below market average.`, icon: <DollarSign size={13} /> });
    }
    if (!lead.client_rating || parseFloat(lead.client_rating) < 4.5) {
      risks.push({ type: "yellow", title: "Limited history", desc: lead.client_rating ? `Client rating is ${lead.client_rating}` : "First-time hirer on the platform.", icon: <Users size={13} /> });
    }
    if (lead.duration && (lead.duration.toLowerCase().includes("week") || lead.duration.toLowerCase().includes("day"))) {
      risks.push({ type: "grey", title: "Aggressive timeline", desc: `Project duration (${lead.duration}) is relatively short.`, icon: <Clock size={13} /> });
    }
    if (risks.length === 0) {
      risks.push({ type: "grey", title: "Clean signals", desc: "No immediate risk factors detected for this lead.", icon: <ShieldCheck size={13} /> });
    }
    return risks.slice(0, 4);
  };

  const dynamicRisks = generateLeadRisks();

  const clientQualityScore = aiData?.clientQualityScore || Math.round(
    (lead.client_payment_verified ? 40 : 0) +
    (lead.client_rating ? (parseFloat(lead.client_rating) / 5) * 40 : 10) +
    (lead.client_spend ? 20 : 0)
  );
  const budgetFairnessScore = aiData?.budgetFairnessScore || Math.max(10, Math.min(100, 100 - budgetGap * 0.8));

  const complexity = aiData?.complexity || (baselineHours < 80 ? "Easy" : baselineHours < 240 ? "Medium" : "Complex");
  const complexityAccent = complexity.toLowerCase().includes("easy") ? "#10b981" : complexity.toLowerCase().includes("medium") ? "#3b82f6" : "#3b82f6";

  const skillsList: string[] = Array.isArray(lead.skills)
    ? lead.skills
    : typeof lead.skills === "string"
    ? (lead.skills as string).split(",")
    : [];

  const summaryPoints: string[] | null =
    !aiData && lead?.ai_summary && typeof lead.ai_summary === "string" && lead.ai_summary !== "NO"
      ? (lead.ai_summary as string).split("•").map((p) => p.trim()).filter(Boolean)
      : null;

  const SectionHead: React.FC<{
    icon: React.ReactNode;
    accent: string;
    title: string;
    sub?: string;
    right?: React.ReactNode;
  }> = ({ icon, accent, title, sub, right }) => (
    <header className="biq-section-head">
      <div className="biq-section-head-left">
        <span
          className="biq-section-icon"
          style={{
            background: `${accent}14`,
            color: accent,
            border: `1px solid ${accent}26`,
          }}
        >
          {icon}
        </span>
        <div className="biq-section-head-text">
          <span className="biq-section-title">{title}</span>
          {sub && <span className="biq-section-sub">{sub}</span>}
        </div>
      </div>
      {right && <div className="biq-section-head-right">{right}</div>}
    </header>
  );

  const scoreDeg = `${(score / 100) * 264}`;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="biq-page">
          {/* ============== Top bar ============== */}
          <div className="biq-topbar">
            <div className="biq-topbar-left">
              <Button
                icon={<ArrowLeft size={14} />}
                onClick={() => router.back()}
                className="biq-back-btn"
                aria-label="Back"
              />
              <div className="biq-brand">
                <div className="biq-brand-mark">
                  <Zap size={13} />
                </div>
                <span className="biq-brand-text">BidIq</span>
                <span className="biq-brand-tag">Intelligence</span>
              </div>
              <span className="biq-topbar-sep" />
              <div className="biq-crumbs">
                <button type="button" className="biq-crumb" onClick={() => router.push("/leads")}>
                  <Layers size={12} /> Leads
                </button>
                <ChevronRight size={12} className="biq-crumb-sep" />
                <span className="biq-crumb-current" title={lead.title}>{lead.title}</span>
              </div>
            </div>

            <div className="biq-topbar-right">
              <div className={`biq-ai-status ${fetchingAI ? "is-loading" : aiData ? "is-ready" : "is-fallback"}`}>
                {fetchingAI ? (
                  <>
                    <RefreshCw size={11} className="biq-spin" />
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
              {lead.proposal_id ? (
                <Button
                  className="biq-primary-btn biq-primary-btn-view"
                  onClick={openProposalDrawer}
                  icon={<Eye size={14} />}
                >
                  View Proposal
                  <ArrowUpRight size={13} />
                </Button>
              ) : (
                <Button
                  className="biq-primary-btn"
                  onClick={openProposalFlow}
                  loading={generatingProposal}
                  icon={!generatingProposal ? <Sparkles size={14} /> : undefined}
                >
                  {generatingProposal ? "Generating…" : "Generate Proposal"}
                  {!generatingProposal && <ArrowUpRight size={13} />}
                </Button>
              )}
            </div>
          </div>

          {/* ============== Body ============== */}
          <div className="biq-body">
            {/* ----------- Hero ----------- */}
            <section className="biq-hero">
              <div className="biq-hero-meta">
                <span className="biq-meta-pill biq-meta-platform">
                  <span className="biq-meta-dot" />
                  {lead.platform || "Upwork"}
                </span>
                {lead.client_location && (
                  <>
                    <span className="biq-meta-sep" />
                    <span className="biq-meta-item">
                      <MapPin size={11} />
                      {lead.client_location}
                    </span>
                  </>
                )}
                {lead.posted_on && (
                  <>
                    <span className="biq-meta-sep" />
                    <span className="biq-meta-item">
                      <Clock size={11} />
                      Posted {dayjs(lead.posted_on).fromNow()}
                    </span>
                  </>
                )}
                {lead.client_payment_verified && (
                  <>
                    <span className="biq-meta-sep" />
                    <span className="biq-meta-item biq-meta-verified">
                      <ShieldCheck size={11} />
                      Payment verified
                    </span>
                  </>
                )}
              </div>

              <h1 className="biq-hero-title">{lead.title}</h1>

              <div className="biq-hero-client">
                <div className="biq-hero-avatar">
                  {(lead.client_name || "C").slice(0, 1).toUpperCase()}
                </div>
                <div className="biq-hero-client-text">
                  <span className="biq-hero-client-name">{lead.client_name || "Anonymous client"}</span>
                  <span className="biq-hero-client-sub">
                    {lead.client_rating ? `${lead.client_rating} ★` : "New client"}
                    {lead.client_spend ? ` · ${lead.client_spend} spent` : ""}
                  </span>
                </div>
              </div>

              {/* KPI tiles */}
              <div className="biq-kpi-grid">
                {[
                  { label: "Budget", value: lead.budget ? `$${clientBudgetNum.toLocaleString()}` : "—", icon: <DollarSign size={13} />, accent: "#10b981" },
                  { label: "Timeline", value: lead.duration || "—", icon: <Clock size={13} />, accent: "#3b82f6" },
                  { label: "AI Score", value: `${score}%`, icon: <Gauge size={13} />, accent: verdictColors.accent },
                  { label: "Complexity", value: complexity, icon: <Activity size={13} />, accent: complexityAccent },
                ].map((m, i) => (
                  <div key={i} className="biq-kpi" style={{ ["--biq-kpi-accent" as any]: m.accent }}>
                    <span className="biq-kpi-icon">{m.icon}</span>
                    <div className="biq-kpi-body">
                      <span className="biq-kpi-label">{m.label}</span>
                      <span className="biq-kpi-value">{m.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {skillsList.length > 0 && (
                <div className="biq-hero-skills">
                  <span className="biq-hero-skills-label">Skills required</span>
                  <div className="biq-hero-skills-list">
                    {skillsList.slice(0, 14).map((s) => (
                      <span key={s} className="biq-skill-chip">{s.trim()}</span>
                    ))}
                    {skillsList.length > 14 && (
                      <span className="biq-skill-chip biq-skill-more">+{skillsList.length - 14}</span>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ----------- Verdict banner ----------- */}
            <section
              className={`biq-verdict biq-verdict-${verdictTone}`}
              style={{
                background: verdictColors.bg,
                borderColor: verdictColors.border,
              }}
            >
              <div className="biq-verdict-gauge">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(15, 23, 42, 0.08)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={verdictColors.accent}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${scoreDeg} 264`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="biq-verdict-gauge-text">
                  <span className="biq-verdict-num" style={{ color: verdictColors.accent }}>{score}</span>
                  <span className="biq-verdict-pct">/ 100</span>
                </div>
              </div>

              <div className="biq-verdict-text">
                <span className="biq-verdict-pill" style={{ background: verdictColors.pillBg, color: verdictColors.accent }}>
                  <Sparkles size={10} /> AI Verdict
                </span>
                <h2 className="biq-verdict-decision" style={{ color: verdictColors.accent }}>{decisionStatus}</h2>
                <p className="biq-verdict-sub">{decisionSub}</p>
              </div>

              <div className="biq-verdict-meters">
                {[
                  { label: "Win rate", val: `${score}%`, icon: <TrendingUp size={11} /> },
                  { label: "Client quality", val: `${clientQualityScore}`, icon: <Users size={11} /> },
                  { label: "Budget fit", val: `${Math.round(budgetFairnessScore)}`, icon: <DollarSign size={11} /> },
                ].map((m, i) => (
                  <div key={i} className="biq-verdict-meter">
                    <span className="biq-verdict-meter-label">
                      {m.icon}
                      {m.label}
                    </span>
                    <span className="biq-verdict-meter-val" style={{ color: verdictColors.accent }}>
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ----------- Smart summary ----------- */}
            <section className="biq-card">
              <SectionHead
                icon={<Brain size={14} />}
                accent="#3b82f6"
                title="Smart summary"
                sub="What this lead is really about, in plain English"
                right={
                  fetchingAI ? (
                    <span className="biq-loading-pill">
                      <RefreshCw size={11} className="biq-spin" /> Generating
                    </span>
                  ) : null
                }
              />
              <div className="biq-card-body">
                {fetchingAI && !aiData ? (
                  <div className="biq-summary-skeleton">
                    <div className="biq-sk-line" style={{ width: "92%" }} />
                    <div className="biq-sk-line" style={{ width: "78%" }} />
                    <div className="biq-sk-line" style={{ width: "85%" }} />
                    <div className="biq-sk-line" style={{ width: "60%" }} />
                  </div>
                ) : aiData ? (
                  <p className="biq-summary-text">{coachSummary}</p>
                ) : summaryPoints && summaryPoints.length > 0 ? (
                  <ul className="biq-summary-list">
                    {summaryPoints.map((point, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={13} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="biq-empty-mini">
                    <Info size={14} />
                    <span>Summary not generated yet — run BidIq analysis again to refresh.</span>
                  </div>
                )}
              </div>
            </section>

            {/* ----------- Reality gap ----------- */}
            <section className="biq-card">
              <SectionHead
                icon={<Target size={14} />}
                accent="#10b981"
                title="Reality gap"
                sub="What the client posted vs what the work actually needs"
                right={
                  <span
                    className="biq-section-tag"
                    style={{
                      background: isUnderpriced ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
                      color: isUnderpriced ? "#1d4ed8" : "#047857",
                      borderColor: isUnderpriced ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    {budgetStatus}
                  </span>
                }
              />
              <div className="biq-card-body">
                <div className="biq-gap-table">
                  <div className="biq-gap-th">
                    <span>Metric</span>
                    <span>Client posted</span>
                    <span>Market reality</span>
                    <span className="biq-gap-th-delta">Δ</span>
                  </div>
                  {[
                    { icon: <DollarSign size={12} />, name: "Budget", client: `$${clientBudgetNum.toLocaleString()}`, reality: `$${projectMarketValue.toLocaleString()}`, delta: `+${budgetGap}%`, accent: "#3b82f6" },
                    { icon: <Clock size={12} />, name: "Timeline", client: lead.duration || "3 mo", reality: `${Math.ceil(baselineHours / 32)}-${Math.ceil(baselineHours / 28)} wk`, delta: "+85%", accent: "#3b82f6" },
                    { icon: <Users size={12} />, name: "Team size", client: "1 dev", reality: `${realTeamSize} devs`, delta: `+${realTeamSize}`, accent: "#3b82f6" },
                    { icon: <RefreshCw size={12} />, name: "Revisions", client: "2 rd", reality: `${realRevisions} rd`, delta: `+${Math.round((realRevisions / 2) * 100 - 100)}%`, accent: "#10b981" },
                  ].map((row, i) => (
                    <div key={i} className="biq-gap-row">
                      <div className="biq-gap-name">
                        <span
                          className="biq-gap-icon"
                          style={{ background: `${row.accent}14`, color: row.accent }}
                        >
                          {row.icon}
                        </span>
                        <span>{row.name}</span>
                      </div>
                      <span className="biq-gap-client">{row.client}</span>
                      <span className="biq-gap-reality">{row.reality}</span>
                      <span className="biq-gap-delta" style={{ background: `${row.accent}14`, color: row.accent, border: `1px solid ${row.accent}26` }}>
                        {row.delta}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="biq-advise">
                  <span className="biq-advise-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563eb" }}>
                    <TrendingUp size={13} />
                  </span>
                  <div className="biq-advise-body">
                    <span className="biq-advise-tag">Recommendation</span>
                    <span className="biq-advise-text">
                      Quote around <b>${(suggestedBudgetVal / 1000).toFixed(1)}k</b> for the full project to align with market rate.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------- Two-col: Effort + Risks ----------- */}
            <div className="biq-row biq-row-60-40">
              <section className="biq-card">
                <SectionHead
                  icon={<Layers size={14} />}
                  accent={complexityAccent}
                  title="Effort estimation"
                  sub="Total hours by skill tier"
                  right={
                    <span
                      className="biq-section-tag"
                      style={{
                        background: `${complexityAccent}14`,
                        color: complexityAccent,
                        borderColor: `${complexityAccent}33`,
                      }}
                    >
                      {complexity}
                    </span>
                  }
                />
                <div className="biq-card-body">
                  <div className="biq-effort-stack">
                    {[
                      { label: "Beginner", val: beginnerRange, color: "#3b82f6", pct: 90, icon: <Zap size={11} /> },
                      { label: "Intermediate", val: intermediateRange, color: "#3b82f6", pct: 65, icon: <Sparkles size={11} /> },
                      { label: "Expert", val: expertRange, color: "#10b981", pct: 35, icon: <ShieldCheck size={11} /> },
                    ].map((row, i) => (
                      <div key={i} className="biq-effort-row">
                        <div className="biq-effort-row-head">
                          <span className="biq-effort-label">
                            <span style={{ color: row.color, display: "inline-flex" }}>{row.icon}</span>
                            {row.label}
                          </span>
                          <span className="biq-effort-val">
                            <b>{row.val}</b>
                            <span className="biq-effort-unit"> hrs</span>
                          </span>
                        </div>
                        <div className="biq-bar-track">
                          <div
                            className="biq-bar-fill"
                            style={{ width: `${row.pct}%`, background: row.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="biq-effort-foot">
                    <span className="biq-effort-foot-label">Baseline total</span>
                    <span className="biq-effort-foot-val">
                      <b>{baselineHours}</b> hrs
                    </span>
                  </div>
                </div>
              </section>

              <section className="biq-card">
                <SectionHead
                  icon={<AlertTriangle size={14} />}
                  accent="#3b82f6"
                  title="Risk signals"
                  sub="What might go wrong"
                  right={
                    <span className="biq-section-tag" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#1d4ed8", borderColor: "rgba(59, 130, 246, 0.25)" }}>
                      {dynamicRisks.length} flagged
                    </span>
                  }
                />
                <div className="biq-card-body">
                  <div className="biq-risk-stack">
                    {dynamicRisks.map((risk: any, idx: number) => (
                      <div key={idx} className={`biq-risk-row tone-${risk.type}`}>
                        <span className={`biq-risk-icon tone-${risk.type}`}>{risk.icon}</span>
                        <div className="biq-risk-text">
                          <span className="biq-risk-title">{risk.title}</span>
                          <span className="biq-risk-desc">{risk.desc}</span>
                        </div>
                        <span className={`biq-risk-badge tone-${risk.type}`}>
                          {risk.type === "red" ? "HIGH" : risk.type === "yellow" ? "MED" : "LOW"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* ----------- Two-col: Budget reality + Competition ----------- */}
            <div className="biq-row biq-row-60-40">
              <section className="biq-card">
                <SectionHead
                  icon={<DollarSign size={14} />}
                  accent="#10b981"
                  title="Budget reality check"
                  sub="What to quote, anchored to market"
                />
                <div className="biq-card-body">
                  <div className="biq-budget-bars">
                    <div className="biq-budget-bar-item">
                      <div className="biq-budget-bar-head">
                        <span className="biq-budget-bar-label">Client budget</span>
                        <span className="biq-budget-bar-val">${clientBudgetNum.toLocaleString()}</span>
                      </div>
                      <div className="biq-bar-track">
                        <div className="biq-bar-fill" style={{ width: "45%", background: "#3b82f6" }} />
                      </div>
                    </div>
                    <div className="biq-budget-bar-item">
                      <div className="biq-budget-bar-head">
                        <span className="biq-budget-bar-label">Suggested bid</span>
                        <span className="biq-budget-bar-val">${suggestedBudgetVal.toLocaleString()}</span>
                      </div>
                      <div className="biq-bar-track">
                        <div className="biq-bar-fill" style={{ width: "90%", background: "#10b981" }} />
                      </div>
                    </div>
                  </div>

                  <div className="biq-segments">
                    {["Underpriced", "Fair", "High value"].map((label) => {
                      const isActive = (label === "Underpriced" && isUnderpriced) || (label === "Fair" && !isUnderpriced);
                      return (
                        <span key={label} className={`biq-segment ${isActive ? "is-active" : ""}`}>
                          {label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="biq-tip">
                    <span className="biq-tip-icon">
                      <CheckCircle2 size={12} />
                    </span>
                    <span className="biq-tip-text">
                      Anchor at <b>${anchorPrice.toLocaleString()}</b> for Phase 1 to leave negotiation room.
                    </span>
                  </div>
                </div>
              </section>

              <section className="biq-card">
                <SectionHead
                  icon={<Flame size={14} />}
                  accent="#3b82f6"
                  title="Competition"
                  sub="How your bid stacks"
                />
                <div className="biq-card-body">
                  <div className="biq-comp-grid">
                    <Tooltip title="Predicted average bid from similar listings">
                      <div className="biq-comp-tile">
                        <span className="biq-comp-label">Avg. bid</span>
                        <span className="biq-comp-val">${avgBidVal.toLocaleString()}</span>
                        <span className="biq-comp-foot">across {(baselineHours % 35) + 15} bidders</span>
                      </div>
                    </Tooltip>
                    <Tooltip title="Skill match against this job">
                      <div className="biq-comp-tile">
                        <span className="biq-comp-label">Skill match</span>
                        <span className="biq-comp-val" style={{ color: "#047857" }}>
                          {lead.skill_analysis?.matchPercentage || 100}%
                        </span>
                        <span className="biq-comp-foot">
                          {(lead.skill_analysis?.matchedSkills || []).length || skillsList.length} matched
                        </span>
                      </div>
                    </Tooltip>
                  </div>
                  <div className="biq-comp-cta">
                    <Zap size={12} />
                    <span>
                      Bid near <b>${avgBidVal.toLocaleString()}</b> to remain competitive while preserving margin.
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>

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
                    <div className="biq-pinfo-snapshot-title" title={lead.title}>
                      {lead.title}
                    </div>
                    <div className="biq-pinfo-snapshot-grid">
                      <div className="biq-pinfo-snapshot-item">
                        <span className="biq-pinfo-snapshot-label">
                          <DollarSign size={10} /> Client budget
                        </span>
                        <span className="biq-pinfo-snapshot-value">
                          {lead.budget ? `$${clientBudgetNum.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div className="biq-pinfo-snapshot-item">
                        <span className="biq-pinfo-snapshot-label">
                          <Clock size={10} /> Duration
                        </span>
                        <span className="biq-pinfo-snapshot-value">
                          {lead.duration || "Flexible"}
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
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#3b82f6" }}>
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
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#10b981" }}>
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
                      <div className="biq-pinfo-cap" style={{ ["--cap-accent" as any]: "#3b82f6" }}>
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
                            <span className="biq-opt-row-v">{lead.duration || "Not specified"}</span>
                          </div>
                          <div className="biq-opt-row">
                            <span className="biq-opt-row-l">
                              <DollarSign size={11} /> Cost
                            </span>
                            <span className="biq-opt-row-v">
                              {lead.budget ? `$${clientBudgetNum.toLocaleString()}` : "Not specified"}
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
          </Modal>

          {/* ============== Proposal preview Drawer ============== */}
          <Drawer
            open={proposalDrawerOpen}
            onClose={() => setProposalDrawerOpen(false)}
            width="min(1080px, 92vw)"
            closable={false}
            className="biq-prop-drawer"
            styles={{ body: { padding: 0 }, header: { display: "none" } }}
          >
            {(() => {
              let blocks: any[] = [];
              if (proposalDetail) {
                try {
                  blocks = typeof proposalDetail.blocks_data === "string"
                    ? JSON.parse(proposalDetail.blocks_data)
                    : proposalDetail.blocks_data || proposalDetail.blocks || [];
                } catch {
                  blocks = [];
                }
              }
              const blockTypeMeta: Record<string, { label: string; icon: React.ReactNode; accent: string }> = {
                scope:      { label: "Scope",       icon: <Briefcase size={13} />,  accent: "#3b82f6" },
                pricing:    { label: "Pricing",     icon: <DollarSign size={13} />, accent: "#10b981" },
                cost:       { label: "Cost",        icon: <DollarSign size={13} />, accent: "#10b981" },
                timeline:   { label: "Timeline",    icon: <Calendar size={13} />,   accent: "#10b981" },
                milestones: { label: "Milestones",  icon: <Calendar size={13} />,   accent: "#10b981" },
                terms:      { label: "Terms",       icon: <FileText size={13} />,   accent: "#64748b" },
                pitch:      { label: "Pitch",       icon: <Sparkles size={13} />,   accent: "#3b82f6" },
                intro:      { label: "Introduction",icon: <Sparkles size={13} />,   accent: "#3b82f6" },
                summary:    { label: "Summary",     icon: <Brain size={13} />,      accent: "#0ea5e9" },
              };
              const metaFor = (type: string) =>
                blockTypeMeta[type?.toLowerCase()] || { label: type || "Section", icon: <FileText size={13} />, accent: "#64748b" };

              return (
                <div className="biq-prop-shell">
                  {/* Drawer header */}
                  <div className="biq-prop-head">
                    <div className="biq-prop-head-icon">
                      <FileText size={16} />
                    </div>
                    <div className="biq-prop-head-text">
                      <span className="biq-prop-eyebrow">
                        <Sparkles size={10} /> Proposal preview
                      </span>
                      <h2 className="biq-prop-title">
                        {proposalDetail?.title || (proposalLoading ? "Loading proposal…" : "Proposal")}
                      </h2>
                      {proposalDetail?.client_name && (
                        <span className="biq-prop-client">For {proposalDetail.client_name}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="biq-prop-close"
                      onClick={() => setProposalDrawerOpen(false)}
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Inner top bar — view toggle + edit / management CTA */}
                  <div className="biq-prop-topbar">
                    <div className="biq-prop-topbar-meta">
                      {proposalDetail?.status && (
                        <span className="biq-prop-status-pill">
                          <span className="biq-prop-status-dot" />
                          {String(proposalDetail.status).toUpperCase()}
                        </span>
                      )}
                      {proposalDetail && (
                        <span className="biq-prop-topbar-info">
                          {blocks.length} section{blocks.length === 1 ? "" : "s"}
                          {(proposalDetail.updated_at || proposalDetail.updatedAt) && (
                            <> · Updated {dayjs(proposalDetail.updated_at || proposalDetail.updatedAt).fromNow()}</>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="biq-prop-topbar-actions">
                      <Segmented
                        size="small"
                        value={proposalView}
                        onChange={(v) => setProposalView(v as "preview" | "sections")}
                        options={[
                          { label: "Live preview", value: "preview", icon: <Eye size={12} /> },
                          { label: "Sections", value: "sections", icon: <FileText size={12} /> },
                        ]}
                        className="biq-prop-segmented"
                        disabled={!proposalDetail}
                      />
                      <Button
                        className="biq-secondary-btn"
                        icon={<ExternalLink size={13} />}
                        onClick={() => router.push("/proposals")}
                        disabled={!proposalDetail && !lead.proposal_id}
                      >
                        All proposals
                      </Button>
                      <Button
                        type="primary"
                        className="biq-primary-btn"
                        icon={<Edit3 size={13} />}
                        onClick={() => lead.proposal_id && router.push(`/proposals/builder?id=${lead.proposal_id}`)}
                        disabled={!lead.proposal_id}
                      >
                        Edit in proposal management
                        <ArrowUpRight size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Drawer body */}
                  <div className="biq-prop-body">
                    {proposalLoading && !proposalDetail ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <Skeleton active paragraph={{ rows: 3 }} />
                        <Skeleton active paragraph={{ rows: 4 }} />
                        <Skeleton active paragraph={{ rows: 4 }} />
                      </div>
                    ) : !proposalDetail ? (
                      <Empty description={<span style={{ color: "var(--text-slate-500)" }}>Proposal not found.</span>} />
                    ) : (
                      <>
                        {/* Summary card */}
                        <div className="biq-prop-summary">
                          <div className="biq-prop-summary-grid">
                            <div className="biq-prop-summary-item">
                              <span className="biq-prop-meta-label">Client</span>
                              <span className="biq-prop-meta-value">{proposalDetail.client_name || "—"}</span>
                            </div>
                            <div className="biq-prop-summary-item">
                              <span className="biq-prop-meta-label">Status</span>
                              <span className="biq-prop-meta-value">{proposalDetail.status || "Draft"}</span>
                            </div>
                            <div className="biq-prop-summary-item">
                              <span className="biq-prop-meta-label">Sections</span>
                              <span className="biq-prop-meta-value">{blocks.length}</span>
                            </div>
                            <div className="biq-prop-summary-item">
                              <span className="biq-prop-meta-label">Created</span>
                              <span className="biq-prop-meta-value">
                                {proposalDetail.created_at || proposalDetail.createdAt
                                  ? dayjs(proposalDetail.created_at || proposalDetail.createdAt).format("MMM D, YYYY")
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {proposalView === "preview" ? (
                          /* Full live preview — mirrors Proposal Management */
                          <div className="biq-prop-preview-sheet">
                            <ProposalLivePreview
                              title={proposalDetail.title}
                              blocksData={proposalDetail.blocks_data ?? proposalDetail.blocks}
                            />
                          </div>
                        ) : (
                          /* Compact sections list */
                          <div className="biq-prop-sections">
                            <div className="biq-prop-sections-head">
                              <FileText size={11} /> Sections in this proposal
                            </div>
                            {blocks.length === 0 ? (
                              <Empty
                                description={<span style={{ color: "var(--text-slate-500)" }}>No sections yet.</span>}
                              />
                            ) : (
                              <div className="biq-prop-sections-list">
                                {blocks.map((block: any, idx: number) => {
                                  const meta = metaFor(block.type);
                                  const blockTitle =
                                    block.title ||
                                    block.data?.title ||
                                    block.data?.heading ||
                                    meta.label;
                                  return (
                                    <div key={idx} className="biq-prop-section">
                                      <span
                                        className="biq-prop-section-icon"
                                        style={{
                                          background: `${meta.accent}14`,
                                          color: meta.accent,
                                          border: `1px solid ${meta.accent}26`,
                                        }}
                                      >
                                        {meta.icon}
                                      </span>
                                      <div className="biq-prop-section-text">
                                        <span className="biq-prop-section-title">{blockTitle}</span>
                                        <span className="biq-prop-section-type">{meta.label}</span>
                                      </div>
                                      <span className="biq-prop-section-index">#{idx + 1}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </Drawer>

          {bidiqStyles}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

/* ===================================================================== */
/*                             Scoped styles                              */
/* ===================================================================== */
const bidiqStyles = (
  <style dangerouslySetInnerHTML={{
    __html: `
      /* Page shell */
      .biq-page {
        background: var(--bg-primary);
        min-height: calc(100vh - 64px);
        margin: 0 -24px;
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
      }
      .biq-empty {
        display: flex; align-items: center; justify-content: center;
        min-height: calc(100vh - 64px);
      }

      /* ===================== Top bar ===================== */
      .biq-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        background: var(--bg-pure-white);
        border-bottom: 1px solid var(--border-slate-100);
        padding: 12px 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .biq-topbar-left,
      .biq-topbar-right {
        display: flex; align-items: center; gap: 12px;
        min-width: 0;
      }
      .biq-back-btn.ant-btn {
        width: 32px !important; height: 32px !important;
        padding: 0 !important;
        border-radius: 4px !important;
        border: 1px solid var(--border-slate-100) !important;
        background: var(--bg-pure-white) !important;
        color: var(--text-slate-700) !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .biq-back-btn.ant-btn:hover {
        border-color: var(--border-slate-200) !important;
        color: var(--text-slate-900) !important;
      }
      .biq-brand { display: inline-flex; align-items: center; gap: 8px; }
      .biq-brand-mark {
        width: 24px; height: 24px;
        border-radius: 7px;
        background: #2563eb;
        color: #fff;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .biq-brand-text {
        font-size: 14px; font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.015em;
      }
      .biq-brand-tag {
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 9px; font-weight: 800;
        letter-spacing: 0.06em; text-transform: uppercase;
        background: rgba(59, 130, 246,0.1); color: #2563eb;
        border: 1px solid rgba(59, 130, 246,0.2);
      }
      .biq-topbar-sep {
        width: 1px; height: 18px;
        background: var(--border-slate-100);
      }
      .biq-crumbs { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
      .biq-crumb {
        background: none; border: 0; padding: 0; cursor: pointer;
        font: inherit;
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 12px; font-weight: 600;
        color: var(--text-slate-500);
      }
      .biq-crumb:hover { color: var(--text-slate-900); }
      .biq-crumb-sep { color: var(--text-slate-400); }
      .biq-crumb-current {
        font-size: 13px; font-weight: 700;
        color: var(--text-slate-900);
        max-width: 480px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .biq-ai-status {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid;
      }
      .biq-ai-status.is-loading { color: #2563eb; border-color: rgba(59, 130, 246,0.25); background: rgba(59, 130, 246,0.06); }
      .biq-ai-status.is-ready { color: #047857; border-color: rgba(16,185,129,0.25); background: rgba(16,185,129,0.06); }
      .biq-ai-status.is-fallback { color: var(--text-slate-500); border-color: var(--border-slate-100); background: var(--bg-slate-50); }
      .biq-spin { animation: biq-spin 1s linear infinite; }
      @keyframes biq-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

      /* Buttons */
      .biq-primary-btn.ant-btn {
        height: 34px !important;
        border-radius: 9px !important;
        padding: 0 14px !important;
        background: #2563eb !important;
        color: #fff !important;
        border: 0 !important;
        font-weight: 700 !important;
        font-size: 13px !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .biq-primary-btn.ant-btn:hover { background: #4338ca !important; }
      .biq-secondary-btn.ant-btn {
        height: 34px !important;
        border-radius: 9px !important;
        padding: 0 14px !important;
        background: var(--bg-pure-white) !important;
        border: 1px solid var(--border-slate-100) !important;
        color: var(--text-slate-700) !important;
        font-weight: 600 !important;
      }
      .biq-secondary-btn.ant-btn:hover {
        border-color: var(--border-slate-200) !important;
        color: var(--text-slate-900) !important;
      }

      /* ===================== Body ===================== */
      .biq-body {
        padding: 20px 32px 60px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* ----------- Hero ----------- */
      .biq-hero {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        padding: 22px 24px;
      }
      .biq-hero-meta {
        display: flex; align-items: center; flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 12px;
        font-size: 12px;
        color: var(--text-slate-500);
      }
      .biq-meta-pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .biq-meta-platform {
        background: rgba(59, 130, 246,0.08);
        color: #2563eb;
        border: 1px solid rgba(59, 130, 246,0.2);
      }
      .biq-meta-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: #2563eb;
      }
      .biq-meta-sep {
        width: 3px; height: 3px;
        border-radius: 50%;
        background: var(--border-slate-200);
      }
      .biq-meta-item {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 12px;
        color: var(--text-slate-500);
        font-weight: 500;
      }
      .biq-meta-verified { color: #047857; font-weight: 700; }
      .biq-hero-title {
        margin: 0 0 14px;
        font-size: 22px;
        font-weight: 800;
        line-height: 1.3;
        color: var(--text-slate-900);
        letter-spacing: -0.02em;
      }
      .biq-hero-client {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 18px;
      }
      .biq-hero-avatar {
        width: 36px; height: 36px;
        border-radius: 4px;
        background: #3b82f6;
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 13px;
        flex-shrink: 0;
      }
      .biq-hero-client-text { display: flex; flex-direction: column; }
      .biq-hero-client-name {
        font-size: 13px; font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
      }
      .biq-hero-client-sub {
        font-size: 11.5px;
        color: var(--text-slate-500);
      }

      /* KPI tiles */
      .biq-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 18px;
      }
      @media (max-width: 900px) {
        .biq-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 520px) {
        .biq-kpi-grid { grid-template-columns: 1fr; }
      }
      .biq-kpi {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
      }
      .biq-kpi-icon {
        width: 30px; height: 30px;
        border-radius: 4px;
        background: color-mix(in oklab, var(--biq-kpi-accent) 14%, transparent);
        color: var(--biq-kpi-accent);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-kpi-body { display: flex; flex-direction: column; min-width: 0; }
      .biq-kpi-label {
        font-size: 10px; font-weight: 800;
        letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .biq-kpi-value {
        font-size: 15px; font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.01em;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      /* Skills */
      .biq-hero-skills {
        display: flex; flex-direction: column; gap: 8px;
        padding-top: 14px;
        border-top: 1px dashed var(--border-slate-100);
      }
      .biq-hero-skills-label {
        font-size: 10px; font-weight: 800;
        letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .biq-hero-skills-list {
        display: flex; flex-wrap: wrap; gap: 5px;
      }
      .biq-skill-chip {
        display: inline-flex; align-items: center;
        padding: 3px 10px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        color: var(--text-slate-700);
        font-size: 11.5px; font-weight: 600;
        border-radius: 999px;
      }
      .biq-skill-more {
        background: rgba(59, 130, 246,0.08);
        color: #2563eb;
        border-color: rgba(59, 130, 246,0.22);
      }

      /* ----------- Verdict banner ----------- */
      .biq-verdict {
        display: grid;
        grid-template-columns: 130px 1fr auto;
        gap: 24px;
        align-items: center;
        padding: 22px 24px;
        border: 1px solid;
        border-radius: 4px;
      }
      @media (max-width: 820px) {
        .biq-verdict {
          grid-template-columns: 1fr;
          gap: 16px;
          text-align: center;
        }
        .biq-verdict-gauge { margin: 0 auto; }
        .biq-verdict-meters { justify-content: center; }
      }
      .biq-verdict-gauge {
        position: relative;
        width: 120px; height: 120px;
      }
      .biq-verdict-gauge svg {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
      }
      .biq-verdict-gauge-text {
        position: absolute; inset: 0;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
      }
      .biq-verdict-num {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.025em;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .biq-verdict-pct {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-slate-500);
        margin-top: 4px;
      }
      .biq-verdict-text {
        min-width: 0;
        display: flex; flex-direction: column; gap: 4px;
      }
      .biq-verdict-pill {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        align-self: flex-start;
      }
      .biq-verdict-decision {
        margin: 6px 0 2px;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }
      .biq-verdict-sub {
        margin: 0;
        font-size: 13px;
        color: var(--text-slate-600);
        line-height: 1.5;
      }
      .biq-verdict-meters {
        display: flex;
        gap: 24px;
        align-items: center;
        flex-shrink: 0;
      }
      .biq-verdict-meter {
        display: flex; flex-direction: column; gap: 3px;
        min-width: 80px;
        padding: 0 14px;
        border-left: 1px solid rgba(15, 23, 42, 0.08);
      }
      .biq-verdict-meter:first-child { border-left: 0; padding-left: 0; }
      .biq-verdict-meter-label {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .biq-verdict-meter-val {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.015em;
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
      }

      /* ----------- Card ----------- */
      .biq-card {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        overflow: hidden;
      }
      .biq-section-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .biq-section-head-left {
        display: flex; align-items: center; gap: 10px;
        min-width: 0;
      }
      .biq-section-icon {
        width: 28px; height: 28px;
        border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-section-head-text {
        display: flex; flex-direction: column;
        min-width: 0;
      }
      .biq-section-title {
        font-size: 13px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        line-height: 1.2;
      }
      .biq-section-sub {
        font-size: 11.5px;
        color: var(--text-slate-500);
        margin-top: 1px;
      }
      .biq-section-tag {
        display: inline-flex; align-items: center;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        border: 1px solid;
        white-space: nowrap;
      }
      .biq-loading-pill {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 700;
        background: rgba(59, 130, 246,0.08);
        color: #2563eb;
        border: 1px solid rgba(59, 130, 246,0.22);
      }
      .biq-card-body { padding: 16px 18px 18px; }

      /* ----------- Summary ----------- */
      .biq-summary-text {
        margin: 0;
        font-size: 14px;
        line-height: 1.7;
        color: var(--text-slate-700);
      }
      .biq-summary-list {
        list-style: none;
        margin: 0; padding: 0;
        display: flex; flex-direction: column; gap: 9px;
      }
      .biq-summary-list li {
        display: flex; align-items: flex-start; gap: 8px;
        font-size: 13.5px;
        line-height: 1.6;
        color: var(--text-slate-700);
      }
      .biq-summary-list li svg {
        color: #10b981;
        flex-shrink: 0;
        margin-top: 4px;
      }
      .biq-summary-skeleton {
        display: flex; flex-direction: column; gap: 9px;
      }
      .biq-sk-line {
        height: 11px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--bg-slate-50) 0%, var(--border-slate-100) 50%, var(--bg-slate-50) 100%);
        background-size: 200% 100%;
        animation: biq-shimmer 1.4s ease-in-out infinite;
      }
      @keyframes biq-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .biq-empty-mini {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 14px;
        background: var(--bg-slate-50);
        border: 1px dashed var(--border-slate-100);
        border-radius: 4px;
        font-size: 12.5px;
        color: var(--text-slate-500);
      }

      /* ----------- Reality Gap ----------- */
      .biq-gap-table {
        display: flex; flex-direction: column;
        margin-bottom: 14px;
      }
      .biq-gap-th,
      .biq-gap-row {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1.2fr 0.7fr;
        align-items: center;
        gap: 8px;
        padding: 10px 4px;
      }
      .biq-gap-th {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-slate-500);
        border-bottom: 1px solid var(--border-slate-100);
        padding-bottom: 8px;
      }
      .biq-gap-th-delta { text-align: right; }
      .biq-gap-row {
        border-bottom: 1px solid var(--border-slate-100);
      }
      .biq-gap-row:last-child { border-bottom: 0; }
      .biq-gap-name {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-slate-900);
      }
      .biq-gap-icon {
        width: 24px; height: 24px;
        border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-gap-client {
        font-size: 12.5px;
        font-weight: 500;
        color: var(--text-slate-500);
        font-variant-numeric: tabular-nums;
      }
      .biq-gap-reality {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900);
        font-variant-numeric: tabular-nums;
      }
      .biq-gap-delta {
        justify-self: end;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
      }

      /* Advise pill */
      .biq-advise {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 12px 14px;
        background: rgba(59, 130, 246, 0.06);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 4px;
      }
      .biq-advise-icon {
        width: 26px; height: 26px;
        border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-advise-body {
        display: flex; flex-direction: column; gap: 2px;
        min-width: 0;
      }
      .biq-advise-tag {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #2563eb;
      }
      .biq-advise-text {
        font-size: 13px;
        color: var(--text-slate-700);
        line-height: 1.5;
      }
      .biq-advise-text b { color: var(--text-slate-900); font-weight: 700; }

      /* ----------- Row layouts ----------- */
      .biq-row {
        display: grid;
        gap: 16px;
        min-width: 0;
      }
      .biq-row-60-40 {
        grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
      }
      .biq-row-60-40 > .biq-card { min-width: 0; }
      @media (max-width: 900px) {
        .biq-row-60-40 { grid-template-columns: 1fr; }
      }

      /* ----------- Effort ----------- */
      .biq-effort-stack {
        display: flex; flex-direction: column;
        gap: 12px;
        margin-bottom: 12px;
      }
      .biq-effort-row { display: flex; flex-direction: column; gap: 6px; }
      .biq-effort-row-head {
        display: flex; justify-content: space-between; align-items: center;
      }
      .biq-effort-label {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-slate-700);
      }
      .biq-effort-val {
        font-size: 13px;
        color: var(--text-slate-500);
        font-variant-numeric: tabular-nums;
      }
      .biq-effort-val b {
        color: var(--text-slate-900);
        font-weight: 700;
      }
      .biq-effort-unit { color: var(--text-slate-400); }
      .biq-bar-track {
        height: 6px;
        background: var(--bg-slate-50);
        border-radius: 999px;
        overflow: hidden;
        border: 1px solid var(--border-slate-100);
      }
      .biq-bar-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        transition: width .4s ease;
      }
      .biq-effort-foot {
        display: flex; justify-content: space-between; align-items: center;
        padding-top: 12px;
        border-top: 1px solid var(--border-slate-100);
      }
      .biq-effort-foot-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .biq-effort-foot-val {
        font-size: 14px;
        color: var(--text-slate-700);
        font-variant-numeric: tabular-nums;
      }
      .biq-effort-foot-val b {
        font-size: 18px;
        font-weight: 800;
        color: var(--text-slate-900);
        margin-right: 2px;
      }

      /* ----------- Risks ----------- */
      .biq-risk-stack { display: flex; flex-direction: column; gap: 8px; }
      .biq-risk-row {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 11px 12px;
        border-radius: 4px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
      }
      .biq-risk-row.tone-red { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.18); }
      .biq-risk-row.tone-yellow { background: rgba(59, 130, 246, 0.06); border-color: rgba(59, 130, 246, 0.18); }
      .biq-risk-row.tone-grey { background: var(--bg-slate-50); border-color: var(--border-slate-100); }
      .biq-risk-icon {
        width: 24px; height: 24px;
        border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-risk-icon.tone-red { background: rgba(59, 130, 246, 0.12); color: #1d4ed8; }
      .biq-risk-icon.tone-yellow { background: rgba(59, 130, 246, 0.12); color: #1d4ed8; }
      .biq-risk-icon.tone-grey { background: rgba(100, 116, 139, 0.12); color: #475569; }
      .biq-risk-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .biq-risk-title {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
      }
      .biq-risk-desc {
        font-size: 11.5px;
        color: var(--text-slate-500);
        line-height: 1.45;
      }
      .biq-risk-badge {
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.08em;
        flex-shrink: 0;
      }
      .biq-risk-badge.tone-red { background: rgba(59, 130, 246, 0.14); color: #1d4ed8; }
      .biq-risk-badge.tone-yellow { background: rgba(59, 130, 246, 0.14); color: #1d4ed8; }
      .biq-risk-badge.tone-grey { background: rgba(100, 116, 139, 0.14); color: #475569; }

      /* ----------- Budget ----------- */
      .biq-budget-bars { display: flex; flex-direction: column; gap: 14px; margin-bottom: 14px; }
      .biq-budget-bar-item { display: flex; flex-direction: column; gap: 6px; }
      .biq-budget-bar-head {
        display: flex; justify-content: space-between; align-items: center;
      }
      .biq-budget-bar-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-slate-700);
      }
      .biq-budget-bar-val {
        font-size: 13px;
        font-weight: 800;
        color: var(--text-slate-900);
        font-variant-numeric: tabular-nums;
      }
      .biq-segments {
        display: flex;
        margin-bottom: 14px;
        gap: 6px;
      }
      .biq-segment {
        flex: 1;
        text-align: center;
        padding: 6px 8px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-slate-500);
        letter-spacing: 0.02em;
      }
      .biq-segment.is-active {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        border-color: rgba(59, 130, 246, 0.25);
      }
      .biq-tip {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 13px;
        background: rgba(16, 185, 129, 0.06);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 4px;
      }
      .biq-tip-icon {
        width: 22px; height: 22px;
        border-radius: 6px;
        background: rgba(16, 185, 129, 0.14);
        color: #047857;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-tip-text {
        font-size: 12.5px;
        color: var(--text-slate-700);
      }
      .biq-tip-text b { color: var(--text-slate-900); font-weight: 700; }

      /* ----------- Competition ----------- */
      .biq-comp-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 12px;
      }
      .biq-comp-tile {
        padding: 12px 14px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        display: flex; flex-direction: column; gap: 3px;
      }
      .biq-comp-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .biq-comp-val {
        font-size: 18px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.015em;
        font-variant-numeric: tabular-nums;
      }
      .biq-comp-foot {
        font-size: 10.5px;
        color: var(--text-slate-500);
        font-weight: 500;
      }
      .biq-comp-cta {
        display: flex; align-items: center; gap: 6px;
        padding: 9px 12px;
        background: rgba(59, 130, 246, 0.06);
        border: 1px solid rgba(59, 130, 246, 0.18);
        border-radius: 4px;
        font-size: 12px;
        color: var(--text-slate-700);
      }
      .biq-comp-cta svg { color: #1d4ed8; flex-shrink: 0; }
      .biq-comp-cta b { color: var(--text-slate-900); font-weight: 700; }

      /* ===================== Modal ===================== */
      .biq-modal .ant-modal-content {
        padding: 22px 24px !important;
        border-radius: 4px !important;
        border: 1px solid var(--border-slate-100);
        background: var(--bg-pure-white);
      }
      .biq-modal .ant-modal-body { padding: 0 !important; }
      .biq-modal-head {
        display: flex; align-items: center; gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border-slate-100);
        margin-bottom: 18px;
      }
      .biq-modal-icon {
        width: 36px; height: 36px;
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        display: flex; align-items: center; justify-content: center;
      }
      .biq-modal-head-text { display: flex; flex-direction: column; }
      .biq-modal-title {
        font-size: 16px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.01em;
      }
      .biq-modal-sub {
        font-size: 12px;
        color: var(--text-slate-500);
      }

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
        border-radius: 4px;
        padding: 14px;
        text-align: left;
        cursor: pointer;
        transition: border-color .15s ease, background .15s ease;
        font-family: inherit;
        display: flex; flex-direction: column; gap: 10px;
      }
      .biq-opt-card:hover {
        border-color: rgba(59, 130, 246, 0.35);
      }
      .biq-opt-card.is-selected {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.04);
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
        background: rgba(59, 130, 246, 0.08);
        color: #0369a1;
        border-color: rgba(59, 130, 246, 0.22);
      }
      .biq-opt-tag-custom {
        background: rgba(59, 130, 246, 0.08);
        color: #6d28d9;
        border-color: rgba(59, 130, 246, 0.22);
      }
      .biq-opt-check { color: #2563eb; }
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
        border-radius: 4px;
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
        background: rgba(59, 130, 246, 0.06);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 4px;
        color: var(--text-slate-700);
        font-size: 12px;
        line-height: 1.5;
      }
      .biq-opt-note svg { color: #2563eb; margin-top: 3px; flex-shrink: 0; }
      .biq-opt-note b { color: var(--text-slate-900); font-weight: 700; }

      .biq-modal-footer {
        display: flex; justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border-slate-100);
      }

      /* ===================== Pre-flight Proposal Info Modal ===================== */
      .biq-pinfo-modal .ant-modal-content {
        padding: 0 !important;
        border-radius: 4px !important;
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
        border-radius: 4px;
        background: #3b82f6;
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-pinfo-head-text { flex: 1; min-width: 0; padding-right: 40px; }
      .biq-pinfo-eyebrow {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.08);
        color: #2563eb;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: 1px solid rgba(59, 130, 246, 0.2);
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
        border-radius: 4px;
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
        background: #2563eb;
        border-color: #2563eb;
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
        border-radius: 4px;
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
        border-radius: 4px;
        background: var(--bg-pure-white);
        transition: border-color .15s ease;
      }
      .biq-pinfo-cap:hover {
        border-color: color-mix(in oklab, var(--cap-accent) 30%, var(--border-slate-100));
      }
      .biq-pinfo-cap-icon {
        width: 28px; height: 28px;
        border-radius: 4px;
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

      /* ===================== Proposal preview Drawer ===================== */
      .biq-prop-drawer .ant-drawer-content {
        background: var(--bg-pure-white);
      }
      .biq-prop-drawer .ant-drawer-body {
        padding: 0 !important;
        background: var(--bg-primary);
      }
      .biq-prop-shell {
        display: flex; flex-direction: column;
        min-height: 100%;
      }

      .biq-prop-head {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 22px 24px 18px;
        position: relative;
        background: var(--bg-pure-white);
        border-bottom: 1px solid var(--border-slate-100);
      }
      .biq-prop-head-icon {
        width: 44px; height: 44px;
        border-radius: 4px;
        background: #3b82f6;
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-prop-head-text { flex: 1; min-width: 0; padding-right: 40px; }
      .biq-prop-eyebrow {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.08);
        color: #2563eb;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: 1px solid rgba(59, 130, 246, 0.2);
        margin-bottom: 8px;
      }
      .biq-prop-title {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.015em;
        line-height: 1.3;
        word-break: break-word;
      }
      .biq-prop-client {
        font-size: 12px;
        color: var(--text-slate-500);
        font-weight: 500;
      }
      .biq-prop-close {
        position: absolute;
        top: 18px; right: 18px;
        width: 30px; height: 30px;
        border-radius: 4px;
        border: 1px solid var(--border-slate-100);
        background: var(--bg-pure-white);
        color: var(--text-slate-500);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: color .15s ease, border-color .15s ease;
      }
      .biq-prop-close:hover {
        color: var(--text-slate-900);
        border-color: var(--border-slate-200);
      }

      .biq-prop-topbar {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
        padding: 12px 20px;
        background: var(--bg-pure-white);
        border-bottom: 1px solid var(--border-slate-100);
        flex-wrap: wrap;
      }
      .biq-prop-topbar-meta {
        display: flex; align-items: center; gap: 10px;
        min-width: 0;
      }
      .biq-prop-status-pill {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.1);
        color: #047857;
        border: 1px solid rgba(16, 185, 129, 0.22);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
      }
      .biq-prop-status-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: #10b981;
      }
      .biq-prop-topbar-info {
        font-size: 11.5px;
        color: var(--text-slate-500);
        font-weight: 500;
      }
      .biq-prop-topbar-actions {
        display: flex; align-items: center; gap: 8px;
      }

      .biq-prop-body {
        padding: 20px 24px 32px;
        display: flex; flex-direction: column; gap: 16px;
      }

      /* Summary tiles */
      .biq-prop-summary {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        padding: 14px 16px;
      }
      .biq-prop-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px 14px;
      }
      @media (max-width: 560px) {
        .biq-prop-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      .biq-prop-summary-item {
        display: flex; flex-direction: column; gap: 3px;
        min-width: 0;
      }
      .biq-prop-meta-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .biq-prop-meta-value {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Sections list */
      .biq-prop-sections {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        overflow: hidden;
      }
      .biq-prop-sections-head {
        display: flex; align-items: center; gap: 5px;
        padding: 12px 16px;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-slate-500);
        border-bottom: 1px solid var(--border-slate-100);
        background: var(--bg-slate-50);
      }
      .biq-prop-sections-list {
        display: flex; flex-direction: column;
      }
      .biq-prop-section {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-slate-100);
        transition: background .15s ease;
      }
      .biq-prop-section:last-child { border-bottom: 0; }
      .biq-prop-section:hover { background: var(--bg-slate-50); }
      .biq-prop-section-icon {
        width: 28px; height: 28px;
        border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .biq-prop-section-text {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column; gap: 2px;
      }
      .biq-prop-section-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .biq-prop-section-type {
        font-size: 11px;
        color: var(--text-slate-500);
        font-weight: 500;
        text-transform: capitalize;
      }
      .biq-prop-section-index {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-slate-400);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }

      /* Live preview sheet — flat document surface */
      .biq-prop-preview-sheet {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        padding: 24px 28px;
      }

      /* Top-bar segmented (Live preview / Sections) */
      .biq-prop-segmented.ant-segmented {
        background: var(--bg-slate-50) !important;
        border: 1px solid var(--border-slate-100) !important;
        padding: 2px !important;
        border-radius: 4px !important;
      }
      .biq-prop-segmented.ant-segmented .ant-segmented-item {
        border-radius: 6px !important;
        font-weight: 600 !important;
        font-size: 11.5px !important;
        color: var(--text-slate-500) !important;
      }
      .biq-prop-segmented.ant-segmented .ant-segmented-item-selected {
        background: var(--bg-pure-white) !important;
        color: var(--text-slate-900) !important;
      }
      .biq-prop-segmented.ant-segmented .ant-segmented-item-label {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 0 10px !important;
      }

      /* "View Proposal" pill — switch from indigo to teal/emerald */
      .biq-primary-btn-view.ant-btn {
        background: #047857 !important;
      }
      .biq-primary-btn-view.ant-btn:hover {
        background: #065f46 !important;
      }

      /* ===================== Dark theme ===================== */
      [data-theme='dark'] .biq-topbar,
      [data-theme='dark'] .biq-hero,
      [data-theme='dark'] .biq-card,
      [data-theme='dark'] .biq-modal .ant-modal-content,
      [data-theme='dark'] .biq-pinfo-modal .ant-modal-content,
      [data-theme='dark'] .biq-opt-card,
      [data-theme='dark'] .biq-pinfo-cap,
      [data-theme='dark'] .biq-pinfo-close,
      [data-theme='dark'] .biq-back-btn.ant-btn,
      [data-theme='dark'] .biq-secondary-btn.ant-btn {
        background: var(--bg-secondary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .biq-pinfo-snapshot {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }
      [data-theme='dark'] .biq-prop-drawer .ant-drawer-content,
      [data-theme='dark'] .biq-prop-head,
      [data-theme='dark'] .biq-prop-topbar,
      [data-theme='dark'] .biq-prop-summary,
      [data-theme='dark'] .biq-prop-sections,
      [data-theme='dark'] .biq-prop-close {
        background: var(--bg-secondary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .biq-prop-drawer .ant-drawer-body {
        background: var(--bg-primary) !important;
      }
      [data-theme='dark'] .biq-prop-sections-head {
        background: var(--bg-primary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .biq-prop-section:hover {
        background: var(--bg-primary) !important;
      }
      [data-theme='dark'] .biq-prop-preview-sheet {
        background: var(--bg-secondary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .biq-prop-segmented.ant-segmented {
        background: var(--bg-primary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .biq-prop-segmented.ant-segmented .ant-segmented-item-selected {
        background: var(--bg-secondary) !important;
      }
      [data-theme='dark'] .biq-kpi,
      [data-theme='dark'] .biq-comp-tile,
      [data-theme='dark'] .biq-opt-rows,
      [data-theme='dark'] .biq-skill-chip,
      [data-theme='dark'] .biq-segment,
      [data-theme='dark'] .biq-empty-mini {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }
      [data-theme='dark'] .biq-risk-row.tone-grey {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }
      [data-theme='dark'] .biq-verdict-meter { border-left-color: rgba(255,255,255,0.06); }
    `,
  }} />
);
