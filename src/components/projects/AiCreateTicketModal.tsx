"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  notification,
  Avatar,
  Upload,
  Tooltip,
  App,
} from "antd";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  ThunderboltOutlined,
  SendOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  CloseOutlined,
  RocketOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useCreateTicket } from "@/hooks/useTickets";
import TicketService, { Ticket } from "@/services/ticketService";
import { ProjectService } from "@/services/projectService";
import TiptapEditor from "@/components/common/TiptapEditor";

const { Text, Title, Paragraph } = Typography;

type Step = "input" | "generating" | "preview" | "creating";
type AiPriority = "Low" | "Medium" | "High";
// How the engineer plans to do the actual coding for this ticket. The hours
// estimate scales with the chosen approach.
//   ai     — codes with AI assistance (Copilot/Cursor/etc.) — much faster
//   hybrid — mix of AI + manual (default; matches Zai's baseline estimate)
//   manual — codes by hand without AI tools — slower
type HoursMode = "ai" | "hybrid" | "manual";

// Multipliers applied to the AI-generated baseline (which represents "hybrid").
// Tuned so a 20h hybrid task → ~4h with AI assistance, ~28h fully manual.
const HOURS_MODE_MULTIPLIER: Record<HoursMode, number> = {
  ai: 0.2,
  hybrid: 1,
  manual: 1.4,
};

const computeHoursForMode = (baseline: number, mode: HoursMode): number => {
  if (!baseline || baseline <= 0) return 0;
  return Math.max(1, Math.round(baseline * HOURS_MODE_MULTIPLIER[mode]));
};

interface AiSubtask {
  title: string;
  hours: number;
}

interface AiTicketDraft {
  title: string;
  description: string;
  priority: AiPriority;
  subtasks: AiSubtask[];
  totalHours: number;
}

interface AiCreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onTicketCreated?: (ticket: Ticket) => void;
}

// Map AI priority to the system's P1/P2/P3 convention used by createTicket.
const aiPriorityToBackend: Record<AiPriority, string> = {
  High: "P1",
  Medium: "P2",
  Low: "P3",
};

const PRIORITY_DOT: Record<AiPriority, string> = {
  High: "#f5222d",
  Medium: "#faad14",
  Low: "#52c41a",
};

const PURPLE = "#722ed1";
const PURPLE_DEEP = "#391085";

export const AiCreateTicketModal: React.FC<AiCreateTicketModalProps> = ({
  open,
  onClose,
  projectId,
  onTicketCreated,
}) => {
  const [step, setStep] = useState<Step>("input");
  const [titleInput, setTitleInput] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [draft, setDraft] = useState<AiTicketDraft | null>(null);
  const [aiSource, setAiSource] = useState<"gemini" | "mock" | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  // AI's proposed subtasks held aside until the user opts in (or adds manually).
  const [aiSuggestedSubtasks, setAiSuggestedSubtasks] = useState<AiSubtask[]>([]);
  // Tracks the "Looks big — break into subtasks?" prompt lifecycle.
  const [subtaskSuggestion, setSubtaskSuggestion] = useState<"pending" | "accepted" | "dismissed">("pending");
  // Original AI hours estimate, kept around so "AI" mode can restore it.
  const [aiEstimatedHours, setAiEstimatedHours] = useState<number>(0);
  // Project member list for the assignee dropdown.
  const [projectMembers, setProjectMembers] = useState<Array<{ value: string; label: string }>>([]);
  // Selected assignee — kept separate from `draft` since the AI doesn't generate it.
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  // Which estimation strategy the user picked. Defaults to "hybrid" — Zai's
  // number is shown but the user is free to tweak it.
  const [hoursMode, setHoursMode] = useState<HoursMode>("hybrid");

  const { message, notification: api } = App.useApp();
  const createTicketMutation = useCreateTicket();

  // Reset to input view whenever the modal closes so it opens fresh next time.
  useEffect(() => {
    if (!open) {
      // Slight delay so the close animation doesn't show a state flicker.
      const t = setTimeout(() => {
        setStep("input");
        setTitleInput("");
        setDescription("");
        setFiles([]);
        setDraft(null);
        setAiSource(null);
        setFallbackReason(null);
        setAiSuggestedSubtasks([]);
        setSubtaskSuggestion("pending");
        setAiEstimatedHours(0);
        setHoursMode("hybrid");
        setAssigneeId(undefined);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Fetch the project's members once when the modal opens, so the Assignee
  // dropdown is populated by the time the user reaches the preview step.
  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;
    ProjectService.getProjectMembers(projectId)
      .then((members) => {
        if (cancelled) return;
        setProjectMembers(Array.isArray(members) ? members : []);
      })
      .catch((err) => {
        console.error("Failed to load project members:", err);
        if (!cancelled) setProjectMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const canGenerate = useMemo(() => description.trim().length >= 5, [description]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      api.error({ message: "Add a few more details before generating" });
      return;
    }
    setStep("generating");
    try {
      const result = await TicketService.generateAiTicketDraft({
        description: description.trim(),
        title: titleInput.trim() || undefined,
      });
      // Hold AI's subtask suggestions aside; the user opts in via the banner
      // (auto-shown for big tickets) or by clicking "Add subtask" manually.
      setAiSuggestedSubtasks(result.subtasks);
      setDraft({
        title: result.title,
        description: result.description,
        priority: result.priority,
        subtasks: [],
        totalHours: result.totalHours,
      });
      setAiEstimatedHours(result.totalHours);
      setHoursMode("hybrid");
      setSubtaskSuggestion("pending");
      setAiSource(result.source);
      setFallbackReason(result.fallbackReason ?? null);
      setStep("preview");
    } catch (err: any) {
      api.error({ message: err?.message || "Failed to generate ticket" });
      setStep("input");
    }
  };

  const handleBack = () => {
    setStep("input");
  };

  const updateDraft = <K extends keyof AiTicketDraft>(key: K, value: AiTicketDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const updateSubtask = (idx: number, value: string) => {
    setDraft((d) => {
      if (!d) return d;
      const next = [...d.subtasks];
      next[idx] = { ...next[idx], title: value };
      return { ...d, subtasks: next };
    });
  };

  const updateSubtaskHours = (idx: number, hours: number) => {
    setDraft((d) => {
      if (!d) return d;
      const next = [...d.subtasks];
      next[idx] = { ...next[idx], hours: Math.max(0, Math.round(hours || 0)) };
      return { ...d, subtasks: next };
    });
  };

  const addSubtask = () => {
    // Default new subtasks to a sensible 4h estimate so the field never lands at 0.
    setDraft((d) => (d ? { ...d, subtasks: [...d.subtasks, { title: "", hours: 4 }] } : d));
  };

  const removeSubtask = (idx: number) => {
    setDraft((d) => {
      if (!d) return d;
      return { ...d, subtasks: d.subtasks.filter((_, i) => i !== idx) };
    });
  };

  const handleHoursModeChange = (mode: HoursMode) => {
    setHoursMode(mode);
    setDraft((d) => {
      if (!d) return d;
      // Recompute the estimate from the AI baseline using the mode's multiplier.
      // The user can still tweak the number after switching.
      return { ...d, totalHours: computeHoursForMode(aiEstimatedHours, mode) };
    });
  };

  const acceptSubtaskSuggestion = () => {
    setDraft((d) => {
      if (!d) return d;
      // Merge AI suggestions with anything the user already added manually.
      // De-dupe by title so accepting twice won't repeat entries.
      const seenTitles = new Set<string>();
      const merged: AiSubtask[] = [];
      for (const s of [...d.subtasks, ...aiSuggestedSubtasks]) {
        const key = s.title.trim().toLowerCase();
        if (!key || seenTitles.has(key)) continue;
        seenTitles.add(key);
        merged.push(s);
      }
      return { ...d, subtasks: merged };
    });
    setSubtaskSuggestion("accepted");
  };

  const replaceSubtasks = (next: AiSubtask[]) => {
    setDraft((d) => (d ? { ...d, subtasks: next } : d));
    // Once the user has explicitly regenerated, the size-based suggestion banner
    // is no longer relevant — they've already taken the matter into their own hands.
    setSubtaskSuggestion("accepted");
  };

  const dismissSubtaskSuggestion = () => setSubtaskSuggestion("dismissed");

  const [isRegeneratingSubtasks, setIsRegeneratingSubtasks] = useState(false);

  /**
   * Regenerate the entire subtask list with a caller-specified shape (N × H hours).
   * The request flows through the same Gemini-backed endpoint as the initial draft.
   */
  const regenerateSubtasks = async (count: number, hoursEach: number) => {
    if (!draft) return;
    const seed = [titleInput, description].filter(Boolean).join("\n\n").trim() || draft.title;
    if (!seed) {
      api.error({ message: "Cannot regenerate without the original description" });
      return;
    }
    setIsRegeneratingSubtasks(true);
    try {
      const result = await TicketService.generateAiSubtasks({
        description: seed,
        count,
        hoursEach,
      });
      replaceSubtasks(result.subtasks);
      api.success({
        message: `Regenerated ${result.subtasks.length} subtasks`,
        description: `Each ~${hoursEach}h · total ${result.subtasks.reduce((a, s) => a + s.hours, 0)}h`,
      });
    } catch (err: any) {
      api.error({ message: err?.message || "Failed to regenerate subtasks" });
    } finally {
      setIsRegeneratingSubtasks(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      api.error({ message: "Title is required" });
      return;
    }
    setStep("creating");

    const cleanSubtasks = draft.subtasks
      .map((s) => ({ title: s.title.trim(), hours: Math.max(0, Math.round(s.hours || 0)) }))
      .filter((s) => s.title);

    try {
      // 1. Create parent ticket.
      const parent = await createTicketMutation.mutateAsync({
        title: draft.title.trim(),
        description: draft.description,
        project: projectId,
        status: "not_started",
        priority: aiPriorityToBackend[draft.priority],
        type: "Task",
        estimateHours: draft.totalHours,
        assignee: assigneeId || undefined,
      });

      // 2. Create subtasks sequentially with parentId pointing at the parent.
      // Sequential (not parallel) keeps ticket numbering deterministic and lets
      // each subtask carry its own estimateHours.
      for (const subtask of cleanSubtasks) {
        try {
          await createTicketMutation.mutateAsync({
            title: subtask.title,
            project: projectId,
            parentId: parent.id,
            status: "not_started",
            priority: aiPriorityToBackend[draft.priority],
            type: "Task",
            estimateHours: subtask.hours > 0 ? subtask.hours : undefined,
          });
        } catch (subErr: any) {
          // A subtask failure shouldn't roll back the parent — surface a soft warning.
          console.error("Subtask create failed:", subErr);
          api.warning({
            message: "Some subtasks could not be created",
            description: subErr?.message,
          });
        }
      }

      console.log("[Zai] Structured ticket created:", { parent, subtasks: cleanSubtasks });
      // Removed local success message, let handleTicketCreated in TicketList handle it
      
      if (onTicketCreated) onTicketCreated(parent);
      onClose();
    } catch (err: any) {
      message.error(err?.message || "Failed to create ticket");
      setStep("preview");
    }
  };

  return (
    <Modal
      open={open}
      // Block onCancel (covers Esc key and mask click) while AI is mid-flight
      // so the user can't accidentally drop the in-progress request.
      onCancel={() => {
        if (step === "generating" || step === "creating") return;
        onClose();
      }}
      keyboard={step !== "generating" && step !== "creating"}
      footer={null}
      // Stay compact while gathering input / waiting on Zai; expand to a
      // two-column preview only once we have a draft to show.
      width={step === "preview" || step === "creating" ? 1200 : 640}
      centered
      maskClosable={step !== "creating" && step !== "generating"}
      closable={false}
      destroyOnHidden
      styles={{
        content: { borderRadius: 16, padding: 0, overflow: "hidden" },
        header: { display: "none" },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(114,46,209,0.04) 0%, rgba(255,255,255,0) 100%)",
        }}
      >
        <Space size={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 6px 16px rgba(114,46,209,0.25)",
            }}
          >
            {step === "preview" || step === "creating" ? (
              <RocketOutlined style={{ fontSize: 18 }} />
            ) : (
              <ThunderboltOutlined style={{ fontSize: 18 }} />
            )}
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
              {step === "preview" || step === "creating" ? "Review your ticket" : "Create with Zai"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {step === "preview" || step === "creating"
                ? "Edit anything before creating"
                : "Describe the work in plain English"}
            </Text>
          </div>
        </Space>
        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined />}
          onClick={onClose}
          disabled={step === "creating" || step === "generating"}
        />
      </div>

      {/* Body */}
      <div 
        style={{ 
          padding: "20px 24px 24px", 
          height: step === "input" ? "min(520px, calc(100vh - 160px))" : "min(680px, calc(100vh - 160px))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {step === "input" && (
          <InputStep
            titleInput={titleInput}
            description={description}
            files={files}
            onTitleChange={setTitleInput}
            onDescriptionChange={setDescription}
            onFilesChange={setFiles}
          />
        )}

        {step === "generating" && <GeneratingStep />}

        {(step === "preview" || step === "creating") && draft && (
          <PreviewStep
            draft={draft}
            source={aiSource}
            fallbackReason={fallbackReason}
            onChange={updateDraft}
            onSubtaskChange={updateSubtask}
            onSubtaskHoursChange={updateSubtaskHours}
            onAddSubtask={addSubtask}
            onRemoveSubtask={removeSubtask}
            suggestionStatus={subtaskSuggestion}
            suggestionCount={aiSuggestedSubtasks.length}
            onAcceptSuggestion={acceptSubtaskSuggestion}
            onDismissSuggestion={dismissSubtaskSuggestion}
            hoursMode={hoursMode}
            aiEstimatedHours={aiEstimatedHours}
            onHoursModeChange={handleHoursModeChange}
            onRegenerateSubtasks={regenerateSubtasks}
            isRegeneratingSubtasks={isRegeneratingSubtasks}
            projectMembers={projectMembers}
            assigneeId={assigneeId}
            onAssigneeChange={setAssigneeId}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-secondary, #fafafa)",
        }}
      >
        <div>
          {(step === "preview" || step === "creating") && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              disabled={step === "creating"}
              style={{ borderRadius: 8 }}
            >
              Back
            </Button>
          )}
        </div>
        <Space size={8}>
          {step === "input" && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
                border: "none",
                borderRadius: 8,
                height: 38,
                padding: "0 20px",
                fontWeight: 600,
              }}
            >
              Generate
            </Button>
          )}
          {step === "generating" && (
            <Button
              type="primary"
              icon={<LoadingOutlined />}
              loading
              style={{ borderRadius: 8, height: 38, padding: "0 20px", fontWeight: 600 }}
            >
              Generating…
            </Button>
          )}
          {(step === "preview" || step === "creating") && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={step === "creating"}
              onClick={handleCreateTicket}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: 8,
                height: 38,
                padding: "0 20px",
                fontWeight: 600,
              }}
            >
              Create Ticket
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

/* ---------------------------- Step components ---------------------------- */

const InputStep: React.FC<{
  titleInput: string;
  description: string;
  files: UploadFile[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onFilesChange: (f: UploadFile[]) => void;
}> = ({ titleInput, description, files, onTitleChange, onDescriptionChange, onFilesChange }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto", height: "100%", width: "100%" }}>
      {/* Hint banner */}
      <div
        style={{
          background: "rgba(114, 46, 209, 0.06)",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(114, 46, 209, 0.15)",
        }}
      >
        <Space align="start" size={10}>
          <Avatar size={28} style={{ backgroundColor: PURPLE, fontSize: 14 }} icon={<ThunderboltOutlined />} />
          <Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Try: <Text strong>“Login button on mobile flickers when tapped — fix urgently”</Text> or{" "}
            <Text strong>“Build a dashboard analytics page for project managers”</Text>.
          </Text>
        </Space>
      </div>

      {/* Title (optional) */}
      <div>
        <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500, #64748b)" }}>
          Title <Text type="secondary" style={{ fontWeight: 400 }}>(optional)</Text>
        </Text>
        <Input
          value={titleInput}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Give it a short heading, or skip and let Zai title it"
          style={{ marginTop: 6, borderRadius: 10, height: 40 }}
          maxLength={120}
        />
      </div>

      {/* Description (required) — same Tiptap editor used by the manual create flow */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500, #64748b)", flexShrink: 0 }}>
          Description <Text style={{ color: "#ef4444" }}>*</Text>
        </Text>
        <div
          className="tiptap-minimized-wrapper"
          style={{
            marginTop: 6,
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            background: "var(--bg-pure-white, #fff)",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto" }}>
            <TiptapEditor
              content={description}
              placeholder="Explain the issue or requirement in plain English..."
              minHeight={140}
              maxHeight={9999} // Let the parent scroll instead
              onChange={onDescriptionChange}
            />
          </div>
        </div>
      </div>

      {/* Attachments (optional, V1 stores client-side only) */}
      <div>
        <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500, #64748b)" }}>
          Attachments <Text type="secondary" style={{ fontWeight: 400 }}>(optional)</Text>
        </Text>
        <div style={{ marginTop: 6 }}>
          <Upload
            multiple
            beforeUpload={() => false}
            fileList={files}
            onChange={({ fileList }) => onFilesChange(fileList)}
            listType="text"
          >
            <Button icon={<PaperClipOutlined />} style={{ borderRadius: 8 }}>
              Add files
            </Button>
          </Upload>
        </div>
      </div>
    </div>
  );
};

const LOADING_MESSAGES = [
  "Reading your description…",
  "Distilling the goal into a crisp title…",
  "Structuring the description…",
  "Calibrating priority…",
  "Breaking the work into subtasks…",
  "Polishing the draft…",
];

const GeneratingStep: React.FC = () => {
  const [msgIdx, setMsgIdx] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    const startedAt = Date.now();
    const tickTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 100) / 10);
    }, 100);
    return () => {
      clearInterval(msgTimer);
      clearInterval(tickTimer);
    };
  }, []);

  return (
    <>
      {/* Local keyframes — kept inline so the modal is self-contained. */}
      <style>{`
        @keyframes zai-orb-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(114,46,209,0.35), 0 0 0 0 rgba(114,46,209,0.45); }
          50%      { transform: scale(1.06); box-shadow: 0 12px 40px rgba(114,46,209,0.45), 0 0 0 18px rgba(114,46,209,0); }
        }
        @keyframes zai-orb-spin { to { transform: rotate(360deg); } }
        @keyframes zai-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes zai-fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes zai-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 24px 48px",
          gap: 24,
          position: "relative",
        }}
      >
        {/* Orb with rotating conic gradient ring + pulsing core */}
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, ${PURPLE}, #c084fc, ${PURPLE_DEEP}, ${PURPLE})`,
              animation: "zai-orb-spin 2.4s linear infinite",
              filter: "blur(2px)",
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              animation: "zai-orb-pulse 1.8s ease-in-out infinite",
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 36 }} />
          </div>
        </div>

        {/* Rotating status text */}
        <div style={{ textAlign: "center", minHeight: 56 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Zai is generating your ticket
          </Title>
          <div
            key={msgIdx}
            style={{
              marginTop: 6,
              fontSize: 13.5,
              color: "var(--text-secondary, #64748b)",
              animation: "zai-fade-up 0.45s ease-out both",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span>{LOADING_MESSAGES[msgIdx]}</span>
            <span style={{ display: "inline-flex", gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: PURPLE,
                    display: "inline-block",
                    animation: `zai-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                  }}
                />
              ))}
            </span>
          </div>
        </div>

        {/* Indeterminate progress bar */}
        <div
          style={{
            width: "min(420px, 80%)",
            height: 4,
            borderRadius: 999,
            background: "rgba(114,46,209,0.12)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "40%",
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent 0%, ${PURPLE} 50%, transparent 100%)`,
              animation: "zai-bar 1.6s ease-in-out infinite",
            }}
          />
        </div>

        <Text type="secondary" style={{ fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {elapsed.toFixed(1)}s elapsed · powered by Gemini
        </Text>

        {/* Soft reassurance once we cross 10s — Gemini may be retrying on 429. */}
        {elapsed > 10 && (
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              maxWidth: 360,
              textAlign: "center",
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(114,46,209,0.06)",
              border: "1px dashed rgba(114,46,209,0.25)",
            }}
          >
            Taking a moment longer than usual — sometimes Gemini retries when busy. Hang tight, your draft is on the way.
          </Text>
        )}
      </div>
    </>
  );
};

const PreviewStep: React.FC<{
  draft: AiTicketDraft;
  source: "gemini" | "mock" | null;
  fallbackReason: string | null;
  onChange: <K extends keyof AiTicketDraft>(key: K, value: AiTicketDraft[K]) => void;
  onSubtaskChange: (idx: number, value: string) => void;
  onSubtaskHoursChange: (idx: number, hours: number) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (idx: number) => void;
  suggestionStatus: "pending" | "accepted" | "dismissed";
  suggestionCount: number;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  hoursMode: HoursMode;
  aiEstimatedHours: number;
  onHoursModeChange: (mode: HoursMode) => void;
  onRegenerateSubtasks: (count: number, hoursEach: number) => Promise<void> | void;
  isRegeneratingSubtasks: boolean;
  projectMembers: Array<{ value: string; label: string }>;
  assigneeId: string | undefined;
  onAssigneeChange: (id: string | undefined) => void;
}> = ({
  draft,
  source,
  fallbackReason,
  onChange,
  onSubtaskChange,
  onSubtaskHoursChange,
  onAddSubtask,
  onRemoveSubtask,
  suggestionStatus,
  suggestionCount,
  onAcceptSuggestion,
  onDismissSuggestion,
  hoursMode,
  aiEstimatedHours,
  onHoursModeChange,
  onRegenerateSubtasks,
  isRegeneratingSubtasks,
  projectMembers,
  assigneeId,
  onAssigneeChange,
}) => {
  // Local controls for the "N subtasks × H hours" custom-shape regenerator.
  const [shapeCount, setShapeCount] = React.useState<number>(
    Math.max(2, Math.min(8, draft.subtasks.length || 5)),
  );
  const [shapeHours, setShapeHours] = React.useState<number>(4);
  // Show the "Looks big — break it down?" banner only for high-effort tickets
  // the user hasn't decided on yet, and only when there are suggestions to offer.
  const showSuggestionBanner =
    suggestionStatus === "pending" && draft.totalHours > 12 && suggestionCount > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {source === "mock" && (
        <div
          style={{
            fontSize: 11,
            color: "#92400e",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            padding: "6px 10px",
            borderRadius: 8,
            gridColumn: "1 / -1",
            flexShrink: 0
          }}
        >
          {fallbackReason
            ? <>Heuristic draft used — Gemini fell back. Reason: <code>{fallbackReason}</code></>
            : <>Heuristic draft (no AI key configured) — set <code>GEMINI_API_KEY</code> in the backend env to use Gemini.</>}
        </div>
      )}

      {/* Two-column layout: form fields left, subtasks panel right.
          Cap heights on each column so the modal stops growing tall. */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flex: 1, minHeight: 0 }}>
        <div style={{ flex: "1.15", display: "flex", flexDirection: "column", gap: 16, minWidth: 0, height: "100%", overflowY: "auto", paddingRight: 8 }}>

      {/* Title */}
      <div>
        <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500, #64748b)" }}>Title</Text>
        <Input
          value={draft.title}
          onChange={(e) => onChange("title", e.target.value)}
          style={{ marginTop: 6, borderRadius: 10, height: 40, fontWeight: 600 }}
        />
      </div>

      {/* Description — Tiptap renders the AI's bulleted/numbered HTML and stays editable */}
      <div>
        <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500, #64748b)" }}>Description</Text>
        <div
          className="tiptap-minimized-wrapper"
          style={{
            marginTop: 6,
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            background: "var(--bg-pure-white, #fff)",
          }}
        >
          <TiptapEditor
            content={draft.description}
            minHeight={160}
            maxHeight={360}
            onChange={(html) => onChange("description", html)}
          />
        </div>
      </div>

      {/* Priority + Assignee — two dropdowns sharing one row in the left column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-slate-500, #64748b)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Priority
          </Text>
          <SearchableDropdown
            value={draft.priority}
            onChange={(v) => onChange("priority", v as AiPriority)}
            style={{ marginTop: 6, height: 38, width: "100%", borderRadius: 10 }}
            options={(["High", "Medium", "Low"] as AiPriority[]).map((p) => ({
              value: p,
              label: p,
              badge: (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: PRIORITY_DOT[p],
                    display: "inline-block",
                  }}
                />
              ),
            }))}
          />
        </div>

        <div>
          <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-slate-500, #64748b)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Assignee
          </Text>
          <SearchableDropdown
            value={assigneeId}
            onChange={(v) => onAssigneeChange(v as string | undefined)}
            placeholder="Select assignee"
            style={{ marginTop: 6, height: 38, width: "100%", borderRadius: 10 }}
            options={projectMembers.map((m) => ({
              value: m.value,
              label: m.label,
            }))}
          />
        </div>
      </div>

        </div>
        {/* Right column: ticket meta + subtasks panel */}
        <div
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
            paddingLeft: 20,
            borderLeft: "1px solid var(--border-color)",
            alignSelf: "stretch",
            height: "100%",
            overflowY: "auto",
            paddingRight: 8
          }}
        >

      {/* Total Hours card — compact 2-row layout: inline-editable hero + chips.
          The hero number IS the input (no separate override row); InputNumber is
          styled borderless and oversized so it reads as a value but stays editable. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 14,
          background: "var(--bg-secondary, #fafafa)",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Row 1: label + inline editable hero number + baseline reference */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ClockCircleOutlined style={{ fontSize: 18, color: PURPLE }} />
          <div style={{ display: "flex", alignItems: "baseline", flex: 1, gap: 6, minWidth: 0 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-slate-500, #64748b)",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                whiteSpace: "nowrap",
              }}
            >
              Total Hours
            </Text>
          </div>
          <InputNumber
            value={draft.totalHours || undefined}
            onChange={(v) => onChange("totalHours", typeof v === "number" && v > 0 ? Math.round(v) : 0)}
            min={0}
            max={1000}
            step={1}
            precision={0}
            variant="borderless"
            controls={false}
            formatter={(v) => (v == null || v === ("" as any) ? "" : `${v}h`)}
            parser={(v) => (Number(String(v ?? "").replace(/[^\d]/g, "")) || 0) as 0}
            style={{
              width: 90,
              fontSize: 24,
              fontWeight: 800,
              color: "var(--text-primary)",
              padding: 0,
              textAlign: "right",
            }}
          />
          <Tooltip title={`Zai's baseline estimate: ${aiEstimatedHours || 0}h`}>
            <Text type="secondary" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
              base {aiEstimatedHours || 0}h
            </Text>
          </Tooltip>
        </div>

        {/* Row 2: Mode chips with each strategy's hour value preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {(["ai", "hybrid", "manual"] as HoursMode[]).map((m) => {
            const selected = hoursMode === m;
            const v = computeHoursForMode(aiEstimatedHours, m);
            const label = m === "ai" ? "AI" : m === "hybrid" ? "Hybrid" : "Manual";
            return (
              <Tooltip
                key={m}
                title={
                  m === "ai"
                    ? "Coded with AI tools (Copilot, Cursor, etc.)"
                    : m === "hybrid"
                      ? "Mix of AI + hand-written code (default)"
                      : "Hand-written, no AI tools"
                }
              >
                <button
                  type="button"
                  onClick={() => onHoursModeChange(m)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 8px",
                    borderRadius: 8,
                    border: selected ? `1px solid ${PURPLE}` : "1px solid var(--border-color)",
                    background: selected
                      ? `linear-gradient(135deg, ${PURPLE}1A 0%, ${PURPLE_DEEP}11 100%)`
                      : "var(--bg-pure-white, #fff)",
                    color: selected ? PURPLE : "var(--text-secondary, #64748b)",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    fontSize: 11,
                    fontWeight: selected ? 700 : 600,
                  }}
                >
                  {m === "ai" && <ThunderboltOutlined style={{ fontSize: 11 }} />}
                  <span style={{ textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 12,
                      padding: "1px 6px",
                      borderRadius: 6,
                      background: selected ? `${PURPLE}1F` : "var(--bg-slate-100, #f1f5f9)",
                      color: selected ? PURPLE : "var(--text-slate-500, #64748b)",
                    }}
                  >
                    {v}h
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Big-task suggestion banner: appears only when totalHours > 12 and Zai
          has subtasks ready to propose. User can accept (loads them) or dismiss. */}
      {showSuggestionBanner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(114,46,209,0.08) 0%, rgba(114,46,209,0.04) 100%)",
            border: "1px solid rgba(114,46,209,0.25)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              flexShrink: 0,
            }}
          >
            <ThunderboltOutlined />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 13, display: "block" }}>
              Looks like a big task — {draft.totalHours}h estimated.
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Want me to break it into {suggestionCount} subtasks?
            </Text>
          </div>
          <Space size={6}>
            <Button size="small" onClick={onDismissSuggestion} style={{ borderRadius: 6 }}>
              No thanks
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={onAcceptSuggestion}
              style={{
                borderRadius: 6,
                background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
                border: "none",
                fontWeight: 600,
              }}
            >
              Yes, suggest
            </Button>
          </Space>
        </div>
      )}

      {/* Subtasks */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500, #64748b)" }}>
            Subtasks <Text type="secondary" style={{ fontWeight: 400 }}>({draft.subtasks.length})</Text>
          </Text>
          <Button size="small" type="text" icon={<PlusOutlined />} onClick={onAddSubtask}>
            Add subtask
          </Button>
        </div>

        {/* Custom-shape regenerator: ask Zai for N subtasks of H hours each */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            marginBottom: 10,
            borderRadius: 10,
            background: "rgba(114,46,209,0.04)",
            border: "1px dashed rgba(114,46,209,0.25)",
          }}
        >
          <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            <ThunderboltOutlined style={{ color: PURPLE, marginRight: 6 }} />
            Break into
          </Text>
          <InputNumber
            value={shapeCount}
            onChange={(v) => setShapeCount(typeof v === "number" ? Math.max(2, Math.min(12, Math.round(v))) : 2)}
            min={2}
            max={12}
            step={1}
            precision={0}
            size="small"
            style={{ width: 64 }}
          />
          <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>subtasks of</Text>
          <InputNumber
            value={shapeHours}
            onChange={(v) => setShapeHours(typeof v === "number" ? Math.max(1, Math.min(40, Math.round(v))) : 1)}
            min={1}
            max={40}
            step={1}
            precision={0}
            size="small"
            formatter={(v) => (v == null || v === ("" as any) ? "" : `${v}h`)}
            parser={(v) => (Number(String(v ?? "").replace(/[^\d]/g, "")) || 0) as 0}
            style={{ width: 70 }}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            = {shapeCount * shapeHours}h total
          </Text>
          <Button
            size="small"
            type="primary"
            loading={isRegeneratingSubtasks}
            onClick={() => onRegenerateSubtasks(shapeCount, shapeHours)}
            style={{
              marginLeft: "auto",
              borderRadius: 6,
              background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
              border: "none",
              fontWeight: 600,
            }}
          >
            {isRegeneratingSubtasks ? "Regenerating…" : "Regenerate with Zai"}
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 360,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {draft.subtasks.length === 0 && (
            <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
              No subtasks. Click “Add subtask” to add one.
            </Paragraph>
          )}
          {draft.subtasks.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "var(--bg-secondary, #fafafa)",
                padding: "6px 8px 6px 10px",
                borderRadius: 10,
                border: "1px solid var(--border-color)",
              }}
            >
              <Text style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, width: 22 }}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <Input
                value={s.title}
                onChange={(e) => onSubtaskChange(i, e.target.value)}
                placeholder="Subtask description"
                variant="borderless"
                style={{ flex: 1, padding: "4px 6px" }}
              />
              <Tooltip title="Estimated hours for this subtask">
                <InputNumber
                  value={s.hours || undefined}
                  onChange={(v) => onSubtaskHoursChange(i, typeof v === "number" ? v : 0)}
                  min={0}
                  max={1000}
                  step={1}
                  precision={0}
                  size="small"
                  formatter={(v) => (v == null || v === ("" as any) ? "" : `${v}h`)}
                  parser={(v) => (Number(String(v ?? "").replace(/[^\d]/g, "")) || 0) as 0}
                  style={{ width: 70 }}
                />
              </Tooltip>
              <Tooltip title="Remove">
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined style={{ fontSize: 12 }} />}
                  onClick={() => onRemoveSubtask(i)}
                />
              </Tooltip>
            </div>
          ))}
          {draft.subtasks.length > 0 && (
            <Text
              type="secondary"
              style={{ fontSize: 11, marginTop: 4, textAlign: "right", display: "block" }}
            >
              Subtask subtotal:{" "}
              <Text strong>{draft.subtasks.reduce((acc, s) => acc + (s.hours || 0), 0)}h</Text>{" "}
              · Ticket estimate <Text strong>{draft.totalHours}h</Text>
            </Text>
          )}
        </div>
      </div>

        </div>
      </div>
    </div>
  );
};
