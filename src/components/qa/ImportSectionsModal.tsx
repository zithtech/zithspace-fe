"use client";

/**
 * Paste sections into the playbook that is already open.
 *
 * The catalog's Upload creates whole playbooks; this one does not create
 * anything. The author has a playbook open — its category and name are settled —
 * so a paste here lands INSIDE it, as sections and recommendation cases on the
 * draft they are editing. Nothing reaches the API until they press Save
 * playbook, which is what makes "replace everything" a safe thing to offer.
 */

import React, { useMemo, useRef, useState } from "react";
import { Button, Modal, message } from "antd";
import {
  AlertCircle,
  ClipboardPaste,
  FileJson,
  FileUp,
  Layers,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  emptyDraftItem,
  REFERENCE_TYPE_ORDER,
  type DraftItem,
  type DraftSection,
  type PlaybookReference,
} from "@/components/qa/playbookShared";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Where the paste is going, shown so the author can see it is the right one. */
  playbookName: string;
  category: string;
  /** How many sections the draft already has — decides what "replace" costs. */
  existingSections: number;
  existingItems: number;
  /** The closed vocabularies, so an unknown level or category is repaired. */
  levels: string[];
  categories: string[];
  risks: string[];
  onApply: (sections: DraftSection[], mode: "append" | "replace") => void;
}

/** Markdown-wrapped links are what chat models emit; unwrap rather than drop. */
function cleanUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  let url = value.trim();
  const markdown = url.match(/^\[[^\]]*\]\((.+)\)$/);
  if (markdown) url = markdown[1].trim();
  if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1).trim();
  return /^https?:\/\//i.test(url) ? url : "";
}

const asStrings = (value: unknown, cap: number): string[] =>
  Array.isArray(value)
    ? value
        .slice(0, cap)
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
    : [];

export default function ImportSectionsModal({
  open,
  onClose,
  playbookName,
  category,
  existingSections,
  existingItems,
  levels,
  categories,
  risks,
  onApply,
}: Props) {
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const fileRef = useRef<HTMLInputElement | null>(null);

  /**
   * Everything is repaired rather than refused: this lands on a draft the
   * author is about to review field by field, so a recommendation with an
   * unknown level is more useful sitting there at the default than thrown away
   * with the twenty around it.
   */
  const parsed = useMemo(() => {
    const text = raw.trim();
    if (!text) return { sections: [] as DraftSection[], error: null as string | null };

    const unfenced = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    try {
      const data = JSON.parse(unfenced);
      const rawSections: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.sections)
        ? data.sections
        : Array.isArray(data?.playbooks?.[0]?.sections)
        ? data.playbooks[0].sections // a whole playbook pasted — take its body
        : [];

      if (rawSections.length === 0) {
        return {
          sections: [],
          error: 'No sections found. The JSON needs a "sections" array.',
        };
      }

      const toItem = (row: any): DraftItem => {
        const base = emptyDraftItem(String(row?.title ?? "").trim() || "Untitled recommendation");
        const references: PlaybookReference[] = Array.isArray(row?.references)
          ? row.references
              .slice(0, 12)
              .map((ref: any) => ({
                type: REFERENCE_TYPE_ORDER.includes(ref?.type) ? ref.type : "qa_guide",
                name: String(ref?.name ?? "").trim(),
                description: String(ref?.description ?? "").trim(),
                url: cleanUrl(ref?.url) || null,
              }))
              .filter((ref: PlaybookReference) => ref.name)
          : [];

        return {
          ...base,
          what_to_test: String(row?.what_to_test ?? "").trim(),
          expected: String(row?.expected ?? "").trim(),
          why_it_matters: String(row?.why_it_matters ?? "").trim(),
          steps: asStrings(row?.steps, 40),
          preconditions: asStrings(row?.preconditions, 20),
          edge_cases: asStrings(row?.edge_cases, 30),
          examples: Array.isArray(row?.examples)
            ? row.examples
                .slice(0, 40)
                .map((ex: any) =>
                  ex && typeof ex === "object"
                    ? { input: String(ex.input ?? ""), verdict: String(ex.verdict ?? "") }
                    : String(ex ?? "")
                )
                .filter((ex: any) => (typeof ex === "string" ? ex : ex.input))
            : [],
          references,
          level: (levels.includes(row?.level) ? row.level : "junior") as DraftItem["level"],
          category: categories.includes(row?.category) ? row.category : "functional",
          risk: (risks.includes(row?.risk) ? row.risk : "medium") as DraftItem["risk"],
          applies_when:
            row?.applies_when && typeof row.applies_when === "object" ? row.applies_when : {},
        };
      };

      const toSection = (row: any, depth: number): DraftSection => ({
        title: String(row?.title ?? "").trim() || "Untitled section",
        description: String(row?.description ?? "").trim(),
        items: Array.isArray(row?.items) ? row.items.map(toItem) : [],
        // The reader renders one level of nesting, so anything deeper is
        // flattened into this section rather than silently lost on save.
        sections:
          depth === 0 && Array.isArray(row?.sections)
            ? row.sections.map((child: any) => toSection(child, 1))
            : [],
      });

      return { sections: rawSections.map((row) => toSection(row, 0)), error: null };
    } catch (err: any) {
      return {
        sections: [] as DraftSection[],
        error: `That is not valid JSON — ${err?.message ?? "check the paste is complete"}.`,
      };
    }
  }, [raw, levels, categories, risks]);

  const totals = useMemo(() => {
    const count = (list: DraftSection[]): number =>
      list.reduce((sum, section) => sum + section.items.length + count(section.sections), 0);
    return { sections: parsed.sections.length, items: count(parsed.sections) };
  }, [parsed]);

  const close = () => {
    setRaw("");
    setMode("append");
    onClose();
  };

  const apply = () => {
    if (parsed.sections.length === 0) return;
    onApply(parsed.sections, mode);
    message.success(
      mode === "append"
        ? `Added ${totals.sections} section${totals.sections === 1 ? "" : "s"} · ${totals.items} recommendations`
        : `Replaced the outline with ${totals.sections} section${totals.sections === 1 ? "" : "s"}`
    );
    close();
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      width={680}
      centered
      className="pb-modal pb-import"
      title={
        <div className="pb-modal__head">
          <span className="pb-modal__badge">
            <FileUp size={17} />
          </span>
          <div>
            <div className="pb-modal__title">Upload into this playbook</div>
            <div className="pb-modal__sub">
              Sections and recommendation cases land in{" "}
              <b>{category || "this category"}</b> → <b>{playbookName || "this playbook"}</b>.
              Nothing is saved until you press Save playbook.
            </div>
          </div>
        </div>
      }
      footer={
        <div className="pb-modal__foot">
          <span className="pb-modal__hint">
            {parsed.error
              ? "Fix the paste to continue"
              : totals.sections > 0
              ? `${totals.sections} section${totals.sections === 1 ? "" : "s"} · ${totals.items} recommendations`
              : "Nothing pasted yet"}
          </span>
          <Button className="pb-btn" onClick={close}>
            Cancel
          </Button>
          <Button
            type="primary"
            className="pb-btn"
            icon={mode === "append" ? <Plus size={14} /> : <RefreshCw size={14} />}
            disabled={totals.sections === 0 || !!parsed.error}
            onClick={apply}
          >
            {mode === "append" ? "Add to playbook" : "Replace outline"}
          </Button>
        </div>
      }
    >
      <div className="pb-import">
        <div className="pb-import__actions">
          <Button
            className="pb-btn"
            icon={<FileJson size={14} />}
            onClick={() => fileRef.current?.click()}
          >
            Choose a .json file
          </Button>
          <Button
            className="pb-btn"
            icon={<ClipboardPaste size={14} />}
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (!text.trim()) return message.info("The clipboard is empty");
                setRaw(text);
              } catch {
                message.info("Paste into the box below with ⌘V");
              }
            }}
          >
            Paste from clipboard
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.txt"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setRaw(String(reader.result ?? ""));
                reader.onerror = () => message.error("Could not read that file");
                reader.readAsText(file);
              }
              e.target.value = "";
            }}
          />
        </div>

        <textarea
          className="pb-import__box"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'{\n  "sections": [\n    { "title": "Basic Testing", "items": [ … ] }\n  ]\n}'}
          spellCheck={false}
        />

        {parsed.error ? (
          <div className="pb-import__error">
            <AlertCircle size={14} />
            {parsed.error}
          </div>
        ) : totals.sections > 0 ? (
          <>
            <div className="pb-import__totals">
              <span>
                <b>{totals.sections}</b> section{totals.sections === 1 ? "" : "s"}
              </span>
              <i>›</i>
              <span>
                <b>{totals.items}</b> recommendation{totals.items === 1 ? "" : "s"}
              </span>
            </div>

            {/* Adding versus replacing is the only real decision here, so it is
                made explicit rather than assumed. */}
            <div className="pb-import__modes">
              <button
                type="button"
                className={`pb-import__mode ${mode === "append" ? "is-on" : ""}`}
                onClick={() => setMode("append")}
              >
                <Plus size={14} />
                <b>Add to what is there</b>
                <em>
                  Keeps the {existingSections} section{existingSections === 1 ? "" : "s"} and{" "}
                  {existingItems} recommendation{existingItems === 1 ? "" : "s"} already in the
                  outline
                </em>
              </button>
              <button
                type="button"
                className={`pb-import__mode ${mode === "replace" ? "is-on" : ""}`}
                onClick={() => setMode("replace")}
              >
                <RefreshCw size={14} />
                <b>Replace the outline</b>
                <em>
                  Drops the current {existingSections} section
                  {existingSections === 1 ? "" : "s"} from the draft — reversible until you save
                </em>
              </button>
            </div>

            <div className="pb-import__preview">
              {parsed.sections.map((section, i) => (
                <div className="pb-import__row" key={i}>
                  <b>{section.title}</b>
                  <em>
                    <Layers size={11} />
                    {section.items.length + section.sections.reduce((n, c) => n + c.items.length, 0)}{" "}
                    recommendations
                    {section.sections.length > 0 ? ` · ${section.sections.length} sub-sections` : ""}
                  </em>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="pb-import__hint">
            Copy the prompt from the Template button, give it to any AI platform, and paste
            what it writes back here.
          </p>
        )}
      </div>
    </Modal>
  );
}
