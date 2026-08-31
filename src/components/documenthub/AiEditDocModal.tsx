"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Input, Button, Typography, message } from "antd";
import {
  ThunderboltOutlined,
  SendOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { documentHubService as DocumentHubService } from "@/services/documentHub";
import { useAuth } from "@/context/AuthContext";

const { Text, Title } = Typography;
const { TextArea } = Input;

const PURPLE = "#722ed1";
const PURPLE_DEEP = "#391085";

type Step = "input" | "generating";
type ApplyMode = "replace" | "update" | "append";

interface AiEditDocModalProps {
  open: boolean;
  onClose: () => void;
  editor: BlockNoteEditor<any, any, any> | null;
  /** Called after content is applied so the host can mark the doc dirty. */
  onApplied?: () => void;
}

const LOADING_MESSAGES = [
  "Reading your prompt…",
  "Drafting documentation prose…",
  "Structuring the page…",
  "Polishing content…",
];

const PROMPT_SUGGESTIONS = [
  "Add a section explaining how it works",
  "Document the API endpoints in detail",
  "Add common pitfalls and best practices",
];

const MODE_OPTIONS: { key: ApplyMode; label: string; description: string }[] = [
  {
    key: "replace",
    label: "Overwrite",
    description: "Replace all existing content with the new one",
  },
  {
    key: "update",
    label: "Update",
    description: "Rewrite the page using existing content as context",
  },
  {
    key: "append",
    label: "Append",
    description: "Add the new content at the end of the page",
  },
];

const looksLikeHtml = (text: string): boolean =>
  /<\/?[a-z][\s\S]*?>/i.test(text);

/** A doc counts as empty if it has zero blocks or only empty paragraph(s). */
const isEditorEmpty = (editor: BlockNoteEditor | null): boolean => {
  if (!editor) return true;
  const doc = editor.document;
  if (!doc || doc.length === 0) return true;
  return doc.every((b: any) => {
    if (b.type !== "paragraph") return false;
    const c = b.content;
    if (!c) return true;
    if (typeof c === "string") return c.trim() === "";
    if (Array.isArray(c)) {
      return c.every((n: any) => {
        const t = typeof n === "string" ? n : n?.text ?? "";
        return !t || !t.toString().trim();
      });
    }
    return true;
  });
};

/** Best-effort plain-text serialization of the editor's blocks for AI context. */
const serializeBlocksToText = (editor: BlockNoteEditor): string => {
  const lines: string[] = [];
  const walk = (blocks: any[]) => {
    for (const b of blocks) {
      const text = (() => {
        const c = b.content;
        if (!c) return "";
        if (typeof c === "string") return c;
        if (Array.isArray(c)) {
          return c
            .map((n: any) => (typeof n === "string" ? n : n?.text ?? ""))
            .join("");
        }
        return "";
      })();
      if (b.type === "heading") {
        const level = b.props?.level ?? 1;
        lines.push(`${"#".repeat(level)} ${text}`);
      } else if (b.type === "bulletListItem") {
        lines.push(`- ${text}`);
      } else if (b.type === "numberedListItem") {
        lines.push(`1. ${text}`);
      } else if (text) {
        lines.push(text);
      }
      if (Array.isArray(b.children) && b.children.length > 0) walk(b.children);
    }
  };
  walk(editor.document);
  return lines.join("\n");
};

/* -------------------------------------------------------------------------- */
/*  Generating animation                                                       */
/* -------------------------------------------------------------------------- */

const GeneratingView: React.FC = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
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
      <style>{`
        @keyframes zai-edit-orb-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(114,46,209,0.35), 0 0 0 0 rgba(114,46,209,0.45); }
          50%      { transform: scale(1.06); box-shadow: 0 12px 40px rgba(114,46,209,0.45), 0 0 0 18px rgba(114,46,209,0); }
        }
        @keyframes zai-edit-orb-spin { to { transform: rotate(360deg); } }
        @keyframes zai-edit-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 24px 40px",
          gap: 22,
        }}
      >
        <div style={{ position: "relative", width: 88, height: 88 }}>
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, ${PURPLE}, #c084fc, ${PURPLE_DEEP}, ${PURPLE})`,
              animation: "zai-edit-orb-spin 2.4s linear infinite",
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
              animation: "zai-edit-orb-pulse 1.8s ease-in-out infinite",
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 32 }} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
            Zai is generating content
          </Title>
          <div
            key={msgIdx}
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "var(--text-secondary, #64748b)",
            }}
          >
            {LOADING_MESSAGES[msgIdx]}
          </div>
        </div>
        <div
          style={{
            width: "min(320px, 100%)",
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
              background: `linear-gradient(90deg, transparent 0%, ${PURPLE} 50%, transparent 100%)`,
              animation: "zai-edit-bar 1.6s ease-in-out infinite",
            }}
          />
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-secondary, #94a3b8)",
          }}
        >
          <ClockCircleOutlined />
          <span>{elapsed.toFixed(1)}s</span>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  Modal                                                                      */
/* -------------------------------------------------------------------------- */

export const AiEditDocModal: React.FC<AiEditDocModalProps> = ({
  open,
  onClose,
  editor,
  onApplied,
}) => {
  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_document_hub_documenthub_prime');

  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<ApplyMode>("replace");
  const [messageApi, contextHolder] = message.useMessage();

  // Headless editor used only to convert AI HTML to BlockNote blocks.
  const parserEditor = useCreateBlockNote();

  // Recompute "is empty" when the modal opens so the chips reflect the
  // current state of the doc (e.g. user just deleted everything).
  const docIsEmpty = useMemo(() => isEditorEmpty(editor), [editor, open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("input");
        setPrompt("");
        setMode("replace");
      }, 200);
      return () => clearTimeout(t);
    } else {
      // When the modal opens on an empty doc, force replace (only sensible
      // option) so the user can't accidentally pick a hidden chip.
      if (docIsEmpty) setMode("replace");
    }
  }, [open, docIsEmpty]);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      messageApi.warning("Tell Zai what to add or change.");
      return;
    }
    if (!editor) return;

    setStep("generating");

    try {
      // For "update" mode, give the AI the current page text so it can
      // refine rather than start from scratch.
      let serverPrompt = trimmed;
      if (mode === "update" && !docIsEmpty) {
        const existing = serializeBlocksToText(editor).slice(0, 6000);
        serverPrompt = [
          "Refine and rewrite the documentation page below according to this instruction:",
          trimmed,
          "",
          "Current page content:",
          existing,
          "",
          "Return the FULL updated page as the documentation content.",
        ].join("\n");
      }

      const draft = await DocumentHubService.generateAiDocumentDraft({
        prompt: serverPrompt,
      });

      // Parse HTML response into BlockNote blocks.
      const rawContent = draft.contentHtml || "";
      let newBlocks: any[];
      if (looksLikeHtml(rawContent)) {
        try {
          newBlocks = await parserEditor.tryParseHTMLToBlocks(rawContent);
        } catch (err) {
          console.error("HTML parse failed", err);
          newBlocks = [{ type: "paragraph", content: rawContent }];
        }
      } else {
        newBlocks = [{ type: "paragraph", content: rawContent }];
      }
      if (!newBlocks.length) {
        newBlocks = [{ type: "paragraph", content: "" }];
      }

      // Apply according to the selected mode.
      if (mode === "append" && !docIsEmpty) {
        const lastBlock = editor.document[editor.document.length - 1];
        if (lastBlock) {
          editor.insertBlocks(newBlocks as any, lastBlock, "after");
        } else {
          editor.replaceBlocks(editor.document, newBlocks as any);
        }
      } else {
        // replace + update (and the empty-doc case)
        editor.replaceBlocks(editor.document, newBlocks as any);
      }

      onApplied?.();
      messageApi.success(
        mode === "append"
          ? "Content appended"
          : mode === "update"
            ? "Page updated"
            : "Page replaced",
      );
      onClose();
    } catch (err: any) {
      console.error("AI edit generation failed", err);
      messageApi.error(err?.message || "Failed to generate. Please try again.");
      setStep("input");
    }
  };

  if (!hasPrime) return null;

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={() => {
          if (step === "generating") return;
          onClose();
        }}
        footer={null}
        width={600}
        centered
        closable={step !== "generating"}
        maskClosable={step !== "generating"}
        destroyOnHidden
        styles={{
          mask: { backdropFilter: "blur(6px)", background: "rgba(15, 23, 42, 0.45)" },
          content: { borderRadius: 18, padding: 0, overflow: "hidden" },
          body: { padding: 0 },
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 16 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
                Generate with Zai
              </Title>
              <Text style={{ fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>
                {docIsEmpty
                  ? "Describe what to add to this empty page."
                  : "Choose how to apply the new content, then describe what to write."}
              </Text>
            </div>
          </div>
        </div>

        {/* Body */}
        {step === "input" && (
          <div style={{ padding: "18px 22px 20px" }}>
            {/* Mode chips — only when the doc already has content */}
            {!docIsEmpty && (
              <>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-slate-400)",
                  }}
                >
                  Apply as
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                >
                  {MODE_OPTIONS.map((opt) => {
                    const active = mode === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setMode(opt.key)}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: active
                            ? `1.5px solid ${PURPLE}`
                            : "1px solid var(--border-slate-200)",
                          background: active
                            ? "rgba(114, 46, 209, 0.06)"
                            : "var(--bg-pure-white)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                        onMouseEnter={(e) => {
                          if (active) return;
                          e.currentTarget.style.background = "var(--bg-slate-50)";
                          e.currentTarget.style.borderColor = "var(--border-slate-200)";
                        }}
                        onMouseLeave={(e) => {
                          if (active) return;
                          e.currentTarget.style.background = "var(--bg-pure-white)";
                          e.currentTarget.style.borderColor = "var(--border-slate-200)";
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: active ? PURPLE : "var(--text-slate-700)",
                          }}
                        >
                          {opt.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-slate-400)",
                            lineHeight: 1.3,
                          }}
                        >
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <Text
              strong
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 8,
                color: "var(--text-slate-700)",
              }}
            >
              What should Zai write?
            </Text>
            <TextArea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "append"
                  ? "e.g. Add a section explaining common pitfalls and best practices."
                  : mode === "update"
                    ? "e.g. Make the tone more formal and add code examples."
                    : "e.g. Document the authentication flow with example requests."
              }
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{
                borderRadius: 12,
                fontSize: 13.5,
                padding: "12px 14px",
                resize: "none",
              }}
              onPressEnter={(e) => {
                if ((e as any).metaKey || (e as any).ctrlKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            <div style={{ marginTop: 12 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-slate-400)",
                }}
              >
                Try
              </Text>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {PROMPT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    style={{
                      padding: "5px 10px",
                      fontSize: 11.5,
                      borderRadius: 999,
                      border: "1px solid var(--border-slate-200)",
                      background: "var(--bg-pure-white)",
                      color: "var(--text-slate-700)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-slate-50)";
                      e.currentTarget.style.borderColor = PURPLE;
                      e.currentTarget.style.color = PURPLE;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-pure-white)";
                      e.currentTarget.style.borderColor = "var(--border-slate-200)";
                      e.currentTarget.style.color = "var(--text-slate-700)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 18,
                paddingTop: 14,
                borderTop: "1px solid var(--border-slate-200)",
              }}
            >
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                Press ⌘ + Enter to generate
              </Text>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  onClick={onClose}
                  style={{ borderRadius: 10, height: 36, fontWeight: 500 }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  style={{
                    borderRadius: 10,
                    height: 36,
                    fontWeight: 600,
                    paddingInline: 18,
                    background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(114, 46, 209, 0.32)",
                  }}
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "generating" && <GeneratingView />}
      </Modal>
    </>
  );
};

export default AiEditDocModal;
