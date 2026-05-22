"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Input, Button, Typography, message, Select, Spin } from "antd";
import {
  ThunderboltOutlined,
  SendOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  TagOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import TicketService, { Ticket } from "@/services/ticketService";
import { documentHubService as DocumentHubService } from "@/services/documentHub";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const { Text, Title } = Typography;
const { TextArea } = Input;

const PURPLE = "#722ed1";
const PURPLE_DEEP = "#391085";

type Step = "input" | "generating";

interface AiCreateHubModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (hubId: string) => void;
  /** Pre-fill the prompt textarea (e.g. with ticket context). */
  defaultPrompt?: string;
  /** When provided, the created hub is linked to this project. */
  defaultProjectId?: string;
  /** When provided, the created hub is linked to this ticket. */
  defaultTicketId?: string;
  /**
   * When set, the modal is opened from inside a specific ticket: the ticket
   * picker is hidden, the prompt is left blank, and only ticket-scoped
   * suggestions are shown. Generation requires the ticket to have a
   * description.
   */
  lockedTicket?: Ticket | null;
}

const LOADING_MESSAGES = [
  "Reading your prompt…",
  "Crafting a hub name…",
  "Outlining the documentation structure…",
  "Drafting the first document…",
  "Polishing content…",
];

const PROMPT_SUGGESTIONS = [
  "API documentation for our payments service",
  "Onboarding guide for new engineers",
  "Architecture overview for the inventory module",
];

// Detect whether the AI returned HTML markup (so we can parse it accordingly).
const looksLikeHtml = (text: string): boolean => /<\/?[a-z][\s\S]*?>/i.test(text);

// Markdown-ish fallback: headings (#), bullets (-/*), numbered (1.), paragraphs.
const markdownToBlocks = (text: string): any[] => {
  if (!text || !text.trim()) {
    return [{ type: "paragraph", content: "" }];
  }

  const lines = text.split(/\r?\n/);
  const blocks: any[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      blocks.push({
        type: "heading",
        props: { level },
        content: heading[2],
      });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      blocks.push({
        type: "bulletListItem",
        content: bullet[1],
      });
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      blocks.push({
        type: "numberedListItem",
        content: numbered[1],
      });
      continue;
    }

    blocks.push({ type: "paragraph", content: line });
  }

  return blocks.length ? blocks : [{ type: "paragraph", content: "" }];
};

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
        @keyframes zai-hub-orb-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(114,46,209,0.35), 0 0 0 0 rgba(114,46,209,0.45); }
          50%      { transform: scale(1.06); box-shadow: 0 12px 40px rgba(114,46,209,0.45), 0 0 0 18px rgba(114,46,209,0); }
        }
        @keyframes zai-hub-orb-spin { to { transform: rotate(360deg); } }
        @keyframes zai-hub-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes zai-hub-fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
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
        }}
      >
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, ${PURPLE}, #c084fc, ${PURPLE_DEEP}, ${PURPLE})`,
              animation: "zai-hub-orb-spin 2.4s linear infinite",
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
              animation: "zai-hub-orb-pulse 1.8s ease-in-out infinite",
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 36 }} />
          </div>
        </div>

        <div style={{ textAlign: "center", minHeight: 56 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Zai is generating your document hub
          </Title>
          <div
            key={msgIdx}
            style={{
              marginTop: 6,
              fontSize: 13.5,
              color: "var(--text-secondary, #64748b)",
              animation: "zai-hub-fade-up 0.45s ease-out both",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span>{LOADING_MESSAGES[msgIdx]}</span>
          </div>
        </div>

        <div
          style={{
            width: "min(360px, 100%)",
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
              animation: "zai-hub-bar 1.6s ease-in-out infinite",
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

const SUGGESTION_TEMPLATES = [
  { key: "scope", label: "Create Scope Doc", prefix: "Create a Scope document" },
  { key: "design", label: "Technical Design", prefix: "Create a Technical Design document" },
  { key: "api", label: "API Reference", prefix: "Create an API Reference document" },
  { key: "test", label: "Test Plan", prefix: "Create a Test Plan document" },
  { key: "release", label: "Release Notes", prefix: "Create Release Notes" },
];

const LOCKED_TICKET_SUGGESTIONS = [
  { key: "scope", label: "Create Scope Doc", prefix: "Create a Scope document" },
  { key: "test-scope", label: "Create Test Scope", prefix: "Create a Test Scope document" },
];

const stripHtml = (html?: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
};

export const AiCreateHubModal: React.FC<AiCreateHubModalProps> = ({
  open,
  onClose,
  onCreated,
  defaultPrompt,
  defaultProjectId,
  defaultTicketId,
  lockedTicket,
}) => {
  const [step, setStep] = useState<Step>("input");
  // When opened from inside a specific ticket, the textarea starts blank
  // (no ticket number prefill); otherwise reflect the caller's defaultPrompt.
  const [prompt, setPrompt] = useState(lockedTicket ? "" : defaultPrompt || "");

  useEffect(() => {
    if (open) setPrompt(lockedTicket ? "" : defaultPrompt || "");
  }, [open, defaultPrompt, lockedTicket]);

  const lockedTicketDescriptionText = useMemo(
    () => stripHtml(lockedTicket?.description),
    [lockedTicket]
  );
  const lockedTicketHasDescription = lockedTicketDescriptionText.length > 0;
  const [messageApi, contextHolder] = message.useMessage();
  // Headless editor used only to convert AI-returned HTML into BlockNote blocks.
  const parserEditor = useCreateBlockNote();

  // Ticket dropdown state
  const [ticketSearch, setTicketSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ticketOptions, setTicketOptions] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketLoading, setSelectedTicketLoading] = useState(false);
  // Track the latest in-flight request so older responses don't overwrite newer state.
  const fetchSeqRef = useRef(0);
  const selectedFetchSeqRef = useRef(0);

  // Debounce: wait 350ms after the user stops typing before firing the request.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(ticketSearch.trim()), 350);
    return () => clearTimeout(handle);
  }, [ticketSearch]);

  // Fetch tickets when modal opens or debounced search changes.
  useEffect(() => {
    if (!open) return;
    const seq = ++fetchSeqRef.current;
    setTicketsLoading(true);
    TicketService.getTickets({
      search: debouncedSearch || undefined,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    })
      .then((res) => {
        if (fetchSeqRef.current !== seq) return;
        setTicketOptions(res.data || []);
      })
      .catch((err) => {
        if (fetchSeqRef.current !== seq) return;
        console.error("Failed to fetch tickets", err);
        setTicketOptions([]);
      })
      .finally(() => {
        if (fetchSeqRef.current === seq) setTicketsLoading(false);
      });
  }, [open, debouncedSearch]);

  const ticketDescriptionText = useMemo(
    () => stripHtml(selectedTicket?.description),
    [selectedTicket]
  );
  const ticketHasDescription = ticketDescriptionText.length > 0;

  useEffect(() => {
    if (!open) {
      // Reset on close
      const t = setTimeout(() => {
        setStep("input");
        setPrompt("");
        setSelectedTicket(null);
        setTicketSearch("");
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      messageApi.warning("Please describe what you want to document.");
      return;
    }

    // When invoked from inside a ticket, generation is grounded in the
    // ticket's description — block if it's missing rather than producing
    // a hallucinated draft from just the title.
    if (lockedTicket && !lockedTicketHasDescription) {
      messageApi.error("Ticket description is mandatory to generate.");
      return;
    }

    const effectivePrompt = lockedTicket
      ? `${trimmed}${lockedTicket.title ? ` — ${lockedTicket.title}` : ""}.\n\nContext:\n${lockedTicketDescriptionText}\n\nDo not include any ticket number, ticket ID, or ticket reference in the generated content.`
      : trimmed;

    setStep("generating");

    try {
      // Dedicated documentation endpoint — returns hubName, fileTitle, contentHtml.
      const draft = await DocumentHubService.generateAiDocumentDraft({
        prompt: effectivePrompt,
      });

      const hubName = (draft.hubName || trimmed).slice(0, 80);
      const firstFileTitle = (draft.fileTitle || "Overview").slice(0, 60);

      const hub = await DocumentHubService.createDocumentHub({
        name: hubName,
        projectId: defaultProjectId,
        ticketId: defaultTicketId,
        visibility: 'public',
      });

      // Server already cleans ticket artifacts; parse the HTML into BlockNote blocks.
      const rawContent = draft.contentHtml || "";
      let blocks: any[];
      if (looksLikeHtml(rawContent)) {
        try {
          blocks = await parserEditor.tryParseHTMLToBlocks(rawContent);
        } catch (err) {
          console.error("HTML parse failed, falling back to markdown", err);
          blocks = markdownToBlocks(rawContent || trimmed);
        }
      } else {
        blocks = markdownToBlocks(rawContent || trimmed);
      }
      if (!blocks.length) blocks = [{ type: "paragraph", content: "" }];

      // Prepend the file title as the document's top heading. The server
      // prompt forbids <h1> in the body, so we always inject the title block
      // here for visual hierarchy. Skip if the AI already happens to start
      // with a heading whose text matches the title (avoid duplicates).
      const firstBlock = blocks[0];
      const firstBlockText =
        firstBlock?.type === "heading" && Array.isArray(firstBlock.content)
          ? firstBlock.content
              .map((n: any) => (typeof n === "string" ? n : n?.text ?? ""))
              .join("")
              .trim()
              .toLowerCase()
          : typeof firstBlock?.content === "string"
            ? firstBlock.content.trim().toLowerCase()
            : "";
      const titleLower = firstFileTitle.trim().toLowerCase();
      if (firstBlock?.type !== "heading" || firstBlockText !== titleLower) {
        blocks = [
          { type: "heading", props: { level: 1 }, content: firstFileTitle },
          ...blocks,
        ];
      }

      // The backend auto-creates a "Getting Started" file when a hub is made.
      // Reuse it (rename + replace content) so we end up with a single doc.
      const fullHub = await DocumentHubService.getDocumentHub(hub.id);
      const existingFile = fullHub.treeNodes?.find(
        (n) => n.type === "file" && n.documentId
      );

      let targetDocId: string | null = null;
      let targetNodeId: string | null = null;

      if (existingFile && existingFile.documentId) {
        targetDocId = existingFile.documentId;
        targetNodeId = existingFile.id;
      } else {
        const fileNode = await DocumentHubService.createTreeNode({
          documentHubId: hub.id,
          type: "file",
          title: firstFileTitle,
        });
        targetDocId = fileNode.documentId;
        targetNodeId = fileNode.id;
      }

      if (targetNodeId && existingFile) {
        try {
          await DocumentHubService.updateTreeNode(targetNodeId, {
            title: firstFileTitle,
          });
        } catch (err) {
          console.error("Failed to rename auto-created file", err);
        }
      }

      if (targetDocId) {
        await DocumentHubService.updateDocument(targetDocId, {
          content: blocks,
        });
      }

      messageApi.success("Document Hub generated");
      onCreated(hub.id);
    } catch (error) {
      console.error("AI hub generation failed", error);
      messageApi.error("Failed to generate. Please try again.");
      setStep("input");
    }
  };

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
        width={640}
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
            position: "relative",
            padding: "20px 24px 16px",
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 18 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
                Create with Zai
              </Title>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
                Describe the documentation you need, Zai will draft it for you.
              </Text>
            </div>
          </div>
        </div>

        {/* Body */}
        {step === "input" && (
          <div style={{ padding: "20px 24px 22px" }}>
            {/* Ticket picker — hidden when launched from inside a ticket. */}
            {!lockedTicket && (
              <>
            <Text
              strong
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 8,
                color: "var(--text-slate-700)",
              }}
            >
              Link a ticket{" "}
              <span style={{ fontWeight: 400, color: "var(--text-slate-400)" }}>
                (optional)
              </span>
            </Text>
            <Select
              showSearch
              allowClear
              value={selectedTicket?.id}
              placeholder="Search tickets by number or title…"
              filterOption={false}
              onSearch={setTicketSearch}
              onChange={(value) => {
                if (!value) {
                  setSelectedTicket(null);
                  return;
                }
                // Show the list-row data immediately, then fetch the full ticket
                // (the list endpoint may not include the description field).
                const stub = ticketOptions.find((x) => x.id === value) || null;
                setSelectedTicket(stub);
                const seq = ++selectedFetchSeqRef.current;
                setSelectedTicketLoading(true);
                TicketService.getTicketById(value)
                  .then((full) => {
                    if (selectedFetchSeqRef.current !== seq) return;
                    setSelectedTicket(full);
                  })
                  .catch((err) => {
                    if (selectedFetchSeqRef.current !== seq) return;
                    console.error("Failed to fetch ticket detail", err);
                  })
                  .finally(() => {
                    if (selectedFetchSeqRef.current === seq) {
                      setSelectedTicketLoading(false);
                    }
                  });
              }}
              onClear={() => {
                setSelectedTicket(null);
                selectedFetchSeqRef.current++;
                setSelectedTicketLoading(false);
              }}
              loading={ticketsLoading}
              notFoundContent={
                ticketsLoading ? (
                  <div style={{ textAlign: "center", padding: 8 }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-slate-400)" }}>
                    No tickets found
                  </span>
                )
              }
              suffixIcon={<TagOutlined style={{ color: "var(--text-slate-400)" }} />}
              style={{ width: "100%", marginBottom: 14 }}
              size="large"
              options={ticketOptions.map((t) => ({
                value: t.id,
                label: (
                  <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-slate-700)",
                        lineHeight: 1.2,
                      }}
                    >
                      {t.ticketNumber}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-slate-400)",
                        lineHeight: 1.2,
                        maxWidth: 480,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                ),
              }))}
            />

            {/* Ticket-aware suggestions / warning */}
            {selectedTicket && (
              <div style={{ marginBottom: 16 }}>
                {selectedTicketLoading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--bg-slate-50)",
                      border: "1px solid var(--border-slate-200)",
                      color: "var(--text-slate-600)",
                      fontSize: 12,
                    }}
                  >
                    <Spin size="small" />
                    <span>Loading ticket description…</span>
                  </div>
                ) : ticketHasDescription ? (
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
                      Suggestions for this ticket
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 6,
                      }}
                    >
                      {SUGGESTION_TEMPLATES.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => {
                            const ctx = `${s.prefix} for ticket ${selectedTicket.ticketNumber} — ${selectedTicket.title}.\n\nContext from ticket description:\n${ticketDescriptionText}`;
                            setPrompt(ctx);
                          }}
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
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      color: "#b45309",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <WarningOutlined />
                    <span>Description needed</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "var(--text-slate-400)",
                        fontWeight: 400,
                      }}
                    >
                      This ticket has no description — Zai needs more context.
                    </span>
                  </div>
                )}
              </div>
            )}
              </>
            )}

            {/* Locked-ticket suggestions / warning (shown when launched
                from inside a specific ticket). */}
            {lockedTicket && (
              <div style={{ marginBottom: 16 }}>
                {lockedTicketHasDescription ? (
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
                      Suggestions for this ticket
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 6,
                      }}
                    >
                      {LOCKED_TICKET_SUGGESTIONS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setPrompt(s.prefix)}
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
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      color: "#b45309",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <WarningOutlined />
                    <span>Description is mandatory</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "var(--text-slate-400)",
                        fontWeight: 400,
                      }}
                    >
                      Add a description to this ticket before generating.
                    </span>
                  </div>
                )}
              </div>
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
              What should this hub contain?
            </Text>
            <TextArea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. API documentation for our payments service covering authentication, endpoints, error codes, and webhooks."
              autoSize={{ minRows: 5, maxRows: 10 }}
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

            {!lockedTicket && (
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
            )}

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
                <ArrowLeftOutlined style={{ marginRight: 4, transform: "rotate(-90deg)" }} />
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
                  disabled={!prompt.trim() || (!!lockedTicket && !lockedTicketHasDescription)}
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

export default AiCreateHubModal;
