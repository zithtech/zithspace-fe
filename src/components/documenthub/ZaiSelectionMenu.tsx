"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input, message, Spin } from "antd";
import { ThunderboltOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import { BlockNoteEditor } from "@blocknote/core";
import { documentHubService as DocumentHubService } from "@/services/documentHub";

const PURPLE = "#722ed1";
const PURPLE_DEEP = "#391085";

const SUGGESTIONS = [
  { key: "detailed", label: "Need detailed points", instruction: "Expand this into detailed bullet points covering the key ideas. Use a <ul> with concise <li> items." },
  { key: "shorter", label: "Shorten the points", instruction: "Make this much shorter and more concise. Keep only the most important information." },
  { key: "simple", label: "Very normal English", instruction: "Rewrite this in very simple, plain English so a non-technical reader can understand it." },
  { key: "technical", label: "Technical terms (software dev)", instruction: "Rewrite this using precise software development terminology, suitable for an engineering audience." },
];

interface AnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
}

interface ZaiSelectionMenuProps {
  editor: BlockNoteEditor | null;
  /** The element wrapping the editor — selection events are scoped to this. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Called after a successful rewrite so the host can mark the doc dirty. */
  onChange?: () => void;
}

export const ZaiSelectionMenu: React.FC<ZaiSelectionMenuProps> = ({
  editor,
  containerRef,
  onChange,
}) => {
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Snapshot the selection at the moment the user opens the popup, so we can
  // restore / use it after focus moves into the popup input.
  const savedSelectionRef = useRef<{ text: string } | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Track selection inside the editor container.
  useEffect(() => {
    if (!editor || !containerRef.current) return;
    const container = containerRef.current;

    const computeAnchor = (): AnchorRect | null => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
      const range = sel.getRangeAt(0);
      // Confirm the selection lives inside the editor container.
      if (!container.contains(range.commonAncestorContainer)) return null;
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return null;
      const text = sel.toString().trim();
      if (!text) return null;
      return {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
      };
    };

    const update = () => {
      // Don't recompute while the popup is open — we want the anchor to stay put.
      if (popupOpen) return;
      const next = computeAnchor();
      setAnchor(next);
    };

    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, [editor, containerRef, popupOpen]);

  // Hide on outside click while popup is open (but not when clicking inside it).
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current && popupRef.current.contains(target)) return;
      if (buttonRef.current && buttonRef.current.contains(target)) return;
      setPopupOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popupOpen]);

  const handleOpenPopup = () => {
    if (!editor) return;
    const text = editor.getSelectedText().trim();
    if (!text) {
      const sel = window.getSelection();
      const fallback = sel ? sel.toString().trim() : "";
      if (!fallback) {
        messageApi.warning("Select some text first.");
        return;
      }
      savedSelectionRef.current = { text: fallback };
    } else {
      savedSelectionRef.current = { text };
    }
    setPopupOpen(true);
    setInstruction("");
  };

  const applyRewrite = async (instructionText: string) => {
    const trimmed = instructionText.trim();
    if (!editor || !savedSelectionRef.current || !trimmed) {
      messageApi.warning("Tell Zai what to do with the selection.");
      return;
    }
    const text = savedSelectionRef.current.text;
    if (!text) {
      messageApi.warning("Selection is empty.");
      return;
    }

    setBusy(true);
    try {
      const { rewrittenHtml } = await DocumentHubService.rewriteAiSelection({
        text,
        instruction: trimmed,
      });

      if (!rewrittenHtml) {
        messageApi.error("Zai returned an empty response.");
        return;
      }

      const newBlocks = await editor.tryParseHTMLToBlocks(rewrittenHtml);
      if (!newBlocks.length) {
        messageApi.error("Could not parse Zai's response.");
        return;
      }

      // BlockNote replaces whole blocks. For a partial selection within a single
      // block this still swaps that block out, which is acceptable.
      const { blocks: selectedBlocks } = editor.getSelection() ?? {
        blocks: [] as any[],
      };
      const targetBlocks = selectedBlocks.length
        ? selectedBlocks
        : [editor.getTextCursorPosition().block];

      editor.replaceBlocks(targetBlocks, newBlocks as any);

      onChange?.();
      messageApi.success("Selection rewritten");
      setPopupOpen(false);
      setAnchor(null);
      setInstruction("");
    } catch (err: any) {
      console.error("Rewrite failed", err);
      messageApi.error(err?.message || "Failed to rewrite");
    } finally {
      setBusy(false);
    }
  };

  // Compute popup position: prefer below the selection, but flip above when
  // there isn't enough room. Clamped to the viewport on all sides.
  const popupPos = useMemo(() => {
    if (!anchor) return null;
    const POPUP_W = 360;
    // Conservative height estimate covering the header + chips + input rows.
    // The popup grows slightly when "Zai is rewriting…" is shown but this is
    // close enough for placement decisions.
    const POPUP_H_ESTIMATE = 360;
    const margin = 8;
    const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

    let left = anchor.right - POPUP_W;
    if (left < margin) left = margin;
    if (left + POPUP_W > viewportW - margin) left = viewportW - margin - POPUP_W;

    const spaceBelow = viewportH - anchor.bottom - margin;
    const spaceAbove = anchor.top - margin;

    let top: number;
    if (spaceBelow >= POPUP_H_ESTIMATE || spaceBelow >= spaceAbove) {
      // Plenty of room below, or below is at least as good as above.
      top = anchor.bottom + 8;
      // Final clamp in case the estimate underestimated and the popup would
      // still overflow — pin it within the viewport.
      const maxTop = viewportH - margin - POPUP_H_ESTIMATE;
      if (top > maxTop) top = Math.max(margin, maxTop);
    } else {
      // Flip above the selection.
      top = anchor.top - POPUP_H_ESTIMATE - 8;
      if (top < margin) top = margin;
    }
    return { top, left };
  }, [anchor]);

  const buttonPos = useMemo(() => {
    if (!anchor) return null;
    const BTN_W = 88;
    const BTN_H = 28;
    const margin = 8;
    const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

    let left = anchor.right - BTN_W;
    if (left < margin) left = margin;
    if (left + BTN_W > viewportW - margin) left = viewportW - margin - BTN_W;

    let top = anchor.bottom + 6;
    // If the button itself would clip below the viewport, flip it above.
    if (top + BTN_H > viewportH - margin) {
      top = anchor.top - BTN_H - 6;
      if (top < margin) top = margin;
    }
    return { top, left };
  }, [anchor]);

  if (!editor) return null;

  return (
    <>
      {contextHolder}

      <style>{`
        @keyframes zai-sel-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes zai-sel-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Floating Zai button */}
      {anchor && !popupOpen && buttonPos && (
        <button
          ref={buttonRef}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleOpenPopup}
          style={{
            position: "fixed",
            top: buttonPos.top,
            left: buttonPos.left,
            zIndex: 2000,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 999,
            border: "none",
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow:
              "0 4px 12px rgba(114, 46, 209, 0.32), inset 0 1px 0 rgba(255,255,255,0.2)",
            animation: "zai-sel-fade-in 0.15s ease-out",
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 12 }} />
          Ask Zai
        </button>
      )}

      {/* Popup */}
      {popupOpen && popupPos && (
        <div
          ref={popupRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: popupPos.top,
            left: popupPos.left,
            width: 360,
            zIndex: 2001,
            background: "var(--bg-pure-white)",
            border: "1px solid var(--border-slate-200)",
            borderRadius: 14,
            boxShadow:
              "0 20px 48px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            animation: "zai-sel-fade-in 0.18s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThunderboltOutlined />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Ask Zai about your selection</span>
            </div>
            <button
              onClick={() => setPopupOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
                fontSize: 13,
                padding: 4,
              }}
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "12px 14px 14px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-slate-400)",
                marginBottom: 6,
              }}
            >
              Quick actions
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.key}
                  disabled={busy}
                  onClick={() => applyRewrite(s.instruction)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 11.5,
                    borderRadius: 999,
                    border: "1px solid var(--border-slate-200)",
                    background: "var(--bg-pure-white)",
                    color: "var(--text-slate-700)",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (busy) return;
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

            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-slate-400)",
                marginBottom: 6,
              }}
            >
              Or describe your own
            </div>
            <Input
              autoFocus
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Convert to technical terms of software development"
              disabled={busy}
              onPressEnter={() => applyRewrite(instruction)}
              suffix={
                busy ? (
                  <Spin size="small" />
                ) : (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyRewrite(instruction)}
                    disabled={!instruction.trim()}
                    style={{
                      background: instruction.trim()
                        ? `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`
                        : "var(--bg-slate-50)",
                      color: instruction.trim() ? "#fff" : "var(--text-slate-400)",
                      border: "none",
                      borderRadius: 8,
                      width: 28,
                      height: 24,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: instruction.trim() ? "pointer" : "not-allowed",
                      fontSize: 12,
                    }}
                  >
                    <SendOutlined />
                  </button>
                )
              }
              style={{ borderRadius: 10, fontSize: 13 }}
            />

            {busy && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "var(--text-slate-600)",
                }}
              >
                <Spin size="small" />
                <span>Zai is rewriting your selection…</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ZaiSelectionMenu;
