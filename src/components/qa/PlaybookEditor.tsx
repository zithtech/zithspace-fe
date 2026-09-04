"use client";

/**
 * The playbook author form — used by both /playbooks/create and
 * /playbooks/[slug]/edit.
 *
 * Layout deliberately mirrors the reader: outline on the left, the selected
 * node's fields on the right. Someone who has read a playbook already knows
 * where they are when they start writing one.
 *
 * The whole document is held in state and saved in one call. A playbook is
 * edited as a document, so a per-field autosave would let an author end up with
 * half of their reordering applied.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Input, Popconfirm, message } from "antd";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  History,
  Copy,
  Download,
  FileUp,
  Layers,
  Link as LinkIcon,
  ListChecks,
  Lock,
  Plus,
  Save,
  Tags,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { api as axios } from "@/lib/axios";
// The preview renders the reader's own components — see PlaybookCards.tsx.
import {
  PlaybookCatalogCard,
  PlaybookItemCard,
  PlaybookOverview,
  draftToItem,
} from "@/components/qa/PlaybookCards";
import ZaiRecommendationModal from "@/components/qa/ZaiRecommendationModal";
import ImportSectionsModal from "@/components/qa/ImportSectionsModal";
import {
  downloadSectionsTemplate,
  sectionsTemplatePrompt,
} from "@/components/qa/playbookTemplate";
import {
  BodyHeader,
  ChipPicker,
  Field,
  FieldGroup,
  ListEditor,
  ListRow,
} from "@/components/qa/PlaybookFormBits";
import {
  PLAYBOOK_STYLES,
  LEVEL_ORDER,
  LEVEL_LABELS,
  VISIBILITY_LABELS,
  REFERENCE_TYPES,
  REFERENCE_TYPE_ORDER,
  emptyDraftItem,
  emptyDraftSection,
  type DraftItem,
  type DraftSection,
  type PlaybookReference,
  type PlaybookDetail,
  type PlaybookSummary,
  type PlaybookVisibility,
} from "@/components/qa/playbookShared";

const { TextArea } = Input;

type Selection =
  | { kind: "meta" }
  | { kind: "section"; path: number[] }
  | { kind: "item"; path: number[]; index: number };

interface MetaState {
  name: string;
  category: string;
  summary: string;
  overview: string;
  version: string;
  changelog: string;
  visibility: PlaybookVisibility;
  price_credits: string;
  price_amount: string;
  price_currency: string;
}

interface Props {
  mode: "create" | "edit";
  /** The playbook being edited, already loaded. Omitted when creating. */
  initial?: PlaybookDetail;
  /** Category to start a new playbook in, when the author came from one. */
  defaultCategory?: string;
  /** Vocabularies from GET /playbooks/meta, so nothing is hardcoded twice. */
  meta?: {
    levels: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    risks: string[];
    visibilities: { value: string; label: string }[];
    canPublish: boolean;
  };
}

/** Walk an index path to the section it addresses. */
function sectionAt(sections: DraftSection[], path: number[]): DraftSection | undefined {
  let node: DraftSection | undefined;
  let list = sections;
  for (const index of path) {
    node = list[index];
    if (!node) return undefined;
    list = node.sections;
  }
  return node;
}

export default function PlaybookEditor({ mode, initial, meta, defaultCategory }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [metaState, setMetaState] = useState<MetaState>(() => ({
    name: initial?.name ?? "",
    category: initial?.category ?? defaultCategory ?? "",
    summary: initial?.summary ?? "",
    overview: initial?.overview ?? "",
    version: initial?.version ?? "1.0",
    changelog: "",
    visibility: initial?.visibility ?? (meta?.canPublish ? "public" : "workspace"),
    price_credits: initial?.priceCredits != null ? String(initial.priceCredits) : "",
    price_amount: initial?.priceAmount != null ? String(initial.priceAmount) : "",
    price_currency: initial?.priceCurrency ?? "USD",
  }));

  /* The reader's tree carries database ids; the editor works in plain drafts so
     a new section is no different from a loaded one. */
  const [sections, setSections] = useState<DraftSection[]>(() => {
    if (!initial) return [emptyDraftSection("Basic Testing")];
    const toDraft = (s: any): DraftSection => ({
      key: s.key,
      title: s.title,
      description: s.description ?? "",
      items: (s.items ?? []).map((i: any) => ({
        key: i.key,
        title: i.title,
        what_to_test: i.whatToTest ?? "",
        examples: i.examples ?? [],
        expected: i.expected ?? "",
        steps: i.steps ?? [],
        level: i.level,
        category: i.category,
        risk: i.risk,
        why_it_matters: i.whyItMatters ?? "",
        preconditions: i.preconditions ?? [],
        edge_cases: i.edgeCases ?? [],
        references: i.references ?? [],
        applies_when: i.appliesWhen ?? {},
      })),
      sections: (s.sections ?? []).map(toDraft),
    });
    return initial.sections.map(toDraft);
  });

  const [selection, setSelection] = useState<Selection>({ kind: "meta" });
  const [saving, setSaving] = useState(false);
  /** Why the last Save attempt did not go through, shown in the header strip. */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  /**
   * Where a Zai draft will land. `replaceIndex` is set when the author asked
   * from inside a recommendation they had already added but not written — the
   * draft fills that blank one instead of leaving it behind as a stray.
   */
  const [zaiTarget, setZaiTarget] = useState<{ path: number[]; replaceIndex?: number } | null>(null);

  const acceptZaiDraft = (item: DraftItem) => {
    if (!zaiTarget) return;
    const { path, replaceIndex } = zaiTarget;
    if (replaceIndex != null) {
      updateItem(path, replaceIndex, item);
      setSelection({ kind: "item", path, index: replaceIndex });
    } else {
      editSection(path, (s) => ({ ...s, items: [...s.items, item] }));
      setSelection({ kind: "item", path, index: sectionAt(sections, path)?.items.length ?? 0 });
    }
    setZaiTarget(null);
  };

  /**
   * One stable id per previewable node, shared by the preview's refs and the
   * highlight test. A string rather than the Selection object so the scroll
   * effect below fires on a change of *node*, never on a change of content.
   */
  const selectionKey = useMemo(() => {
    if (selection.kind === "meta") return "meta";
    if (selection.kind === "section") return `s-${selection.path.join("-")}`;
    return `i-${selection.path.join("-")}::${selection.index}`;
  }, [selection]);

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Bring the edited node into view when the selection moves. Deliberately not
     keyed on content: scrolling the preview on every keystroke would fight the
     author for control of the pane. */
  useEffect(() => {
    if (!showPreview) return;
    const node = nodeRefs.current[selectionKey];
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectionKey, showPreview]);

  const canPublish = meta?.canPublish ?? false;
  const levelOptions = meta?.levels ?? LEVEL_ORDER.map((v) => ({ value: v, label: LEVEL_LABELS[v] }));
  // Memoised so the label map below is not rebuilt on every keystroke.
  const categoryOptions = useMemo(() => meta?.categories ?? [], [meta]);
  const riskOptions = meta?.risks ?? ["low", "medium", "high", "critical"];

  /* The card labels a category the same way the reader does, so a preview never
     shows the raw `input_validation` key the reader would render as a label. */
  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categoryOptions) map[c.value] = c.label;
    return map;
  }, [categoryOptions]);

  const itemCount = useMemo(() => {
    const count = (list: DraftSection[]): number =>
      list.reduce((total, s) => total + s.items.length + count(s.sections), 0);
    return count(sections);
  }, [sections]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const walk = (list: DraftSection[]) =>
      list.forEach((s) => {
        s.items.forEach((i) => {
          counts[i.level] = (counts[i.level] ?? 0) + 1;
        });
        walk(s.sections);
      });
    walk(sections);
    return counts;
  }, [sections]);

  /** The catalog card's own props, built from the draft so the preview is real. */
  const previewSummary: PlaybookSummary = useMemo(
    () => ({
      id: initial?.id ?? "preview",
      slug: initial?.slug ?? "preview",
      name: metaState.name,
      category: metaState.category,
      summary: metaState.summary,
      version: metaState.version || "1.0",
      visibility: metaState.visibility,
      status: initial?.status ?? "draft",
      isOwn: true,
      locked: false,
      priceCredits: metaState.price_credits ? Number(metaState.price_credits) : null,
      priceAmount: metaState.price_amount || null,
      priceCurrency: metaState.price_currency,
      lastUpdatedAt: new Date().toISOString(),
      itemCount,
      levelCounts,
      categories: [],
    }),
    [metaState, itemCount, levelCounts, initial]
  );

  /**
   * Mutations rebuild only the nodes along the path they touch; every untouched
   * section and item keeps its identity.
   *
   * This matters because the preview renders the WHOLE playbook live. With a
   * deep clone per keystroke, typing one character in one recommendation would
   * hand every other card new props and re-render all of them — on a
   * Login-sized playbook, 157 of them. Structural sharing plus the memoised
   * card means a keystroke re-renders exactly the card being edited.
   */
  const editSection = useCallback(
    (path: number[], updater: (section: DraftSection) => DraftSection) => {
      const walk = (list: DraftSection[], remaining: number[]): DraftSection[] => {
        const [head, ...rest] = remaining;
        return list.map((section, i) => {
          if (i !== head) return section;
          if (rest.length === 0) return updater(section);
          return { ...section, sections: walk(section.sections, rest) };
        });
      };
      setSections((prev) => walk(prev, path));
    },
    []
  );

  const addSection = () => {
    setSections((prev) => [...prev, emptyDraftSection()]);
    setSelection({ kind: "section", path: [sections.length] });
  };

  const addSubSection = (path: number[]) => {
    editSection(path, (s) => ({ ...s, sections: [...s.sections, emptyDraftSection("New sub-section")] }));
    setSelection({ kind: "section", path: [...path, sectionAt(sections, path)?.sections.length ?? 0] });
  };

  const addItem = (path: number[]) => {
    editSection(path, (s) => ({ ...s, items: [...s.items, emptyDraftItem()] }));
    setSelection({ kind: "item", path, index: sectionAt(sections, path)?.items.length ?? 0 });
  };

  const removeSection = (path: number[]) => {
    const index = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    if (parentPath.length === 0) {
      setSections((prev) => prev.filter((_, i) => i !== index));
    } else {
      editSection(parentPath, (s) => ({ ...s, sections: s.sections.filter((_, i) => i !== index) }));
    }
    setSelection({ kind: "meta" });
  };

  const removeItem = (path: number[], index: number) => {
    editSection(path, (s) => ({ ...s, items: s.items.filter((_, i) => i !== index) }));
    setSelection({ kind: "section", path });
  };

  const updateSection = (path: number[], patch: Partial<DraftSection>) =>
    editSection(path, (s) => ({ ...s, ...patch }));

  const updateItem = (path: number[], index: number, patch: Partial<DraftItem>) =>
    editSection(path, (s) => ({
      ...s,
      items: s.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  /**
   * The prompt names the playbook it is writing for, so nothing comes back that
   * has to be re-filed — the category and the name are already decided here.
   */
  const copyPrompt = async () => {
    const prompt = sectionsTemplatePrompt(
      {
        levels: levelOptions,
        categories: categoryOptions,
        risks: riskOptions,
      },
      {
        name: metaState.name,
        category: metaState.category,
        summary: metaState.summary,
      }
    );
    try {
      await navigator.clipboard.writeText(prompt);
      message.success("Prompt copied — paste it into any AI platform");
    } catch {
      message.error("Could not reach the clipboard. Download the template instead.");
    }
  };

  /* ── Saving ────────────────────────────────────────────────────────────── */

  /**
   * A blocked save has to say what is missing AND where it is. A toast alone
   * left authors clicking Save on a 100-recommendation playbook with no idea
   * which node was incomplete — it read as a dead button.
   */
  const validate = (): { message: string; go: Selection } | null => {
    if (!metaState.name.trim())
      return { message: "The playbook needs a name", go: { kind: "meta" } };
    if (!metaState.category.trim())
      return { message: "The playbook needs a category", go: { kind: "meta" } };
    if (!metaState.summary.trim())
      return { message: "The playbook needs a one-line summary", go: { kind: "meta" } };
    if (sections.length === 0)
      return { message: "Add at least one section", go: { kind: "meta" } };
    if (itemCount === 0)
      return {
        message: "Add at least one recommendation",
        go: { kind: "section", path: [0] },
      };

    const walk = (
      list: DraftSection[],
      parentPath: number[] = []
    ): { message: string; go: Selection } | null => {
      for (let index = 0; index < list.length; index += 1) {
        const section = list[index];
        const path = [...parentPath, index];
        if (!section.title.trim())
          return { message: "Every section needs a title", go: { kind: "section", path } };
        for (let i = 0; i < section.items.length; i += 1) {
          if (!section.items[i].title.trim())
            return {
              message: `A recommendation in "${section.title}" needs a title`,
              go: { kind: "item", path, index: i },
            };
        }
        const nested = walk(section.sections, path);
        if (nested) return nested;
      }
      return null;
    };
    return walk(sections);
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setSaveError(problem.message);
      setSelection(problem.go);
      message.error(problem.message);
      return;
    }
    setSaveError(null);

    const metaBody = {
      name: metaState.name.trim(),
      category: metaState.category.trim(),
      summary: metaState.summary.trim(),
      overview: metaState.overview,
      version: metaState.version.trim() || "1.0",
      visibility: metaState.visibility,
      price_credits:
        metaState.visibility === "premium" && metaState.price_credits
          ? Number(metaState.price_credits)
          : null,
      price_amount:
        metaState.visibility === "premium" && metaState.price_amount
          ? Number(metaState.price_amount)
          : null,
      price_currency: metaState.price_currency || "USD",
    };

    // Strip database-shaped keys: on create there are none, and on edit letting
    // stale keys through would tie new content to old audit references.
    const contentBody = {
      sections,
      version: metaBody.version,
      changelog: metaState.changelog.trim() || null,
    };

    try {
      setSaving(true);
      let id = initial?.id;
      let slug = initial?.slug;

      if (mode === "create") {
        const created: any = await axios.post("/api/v2/qa/playbooks", metaBody);
        id = created.id;
        slug = created.slug;
      } else {
        const updated: any = await axios.put(`/api/v2/qa/playbooks/${id}`, metaBody);
        slug = updated?.slug ?? slug;
      }

      await axios.put(`/api/v2/qa/playbooks/${id}/content`, contentBody);

      /* The catalog holds its list for five minutes, so without this a playbook
         you just created is missing from the page you land on next — the cache
         answers before the new row ever gets asked for. Everything under the
         "qa/playbooks" prefix goes: the catalog, the detail, the request
         queues' copy of it. */
      await queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });

      message.success(mode === "create" ? "Playbook created" : "Playbook saved");
      router.push(`/qa-workspace/playbooks/${slug}`);
    } catch (err: any) {
      const reason =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not save the playbook";
      setSaveError(reason);
      message.error(reason);
    } finally {
      setSaving(false);
    }
  };

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  const isOn = (target: Selection) => JSON.stringify(selection) === JSON.stringify(target);

  const renderTree = (list: DraftSection[], parentPath: number[] = []) =>
    list.map((section, index) => {
      const path = [...parentPath, index];
      const depth = parentPath.length;
      return (
        <div className="pb-tree__group" key={path.join("-")}>
          <button
            type="button"
            className={`pb-tree__row ${depth > 0 ? "is-sub" : ""} ${
              isOn({ kind: "section", path }) ? "is-on" : ""
            }`}
            onClick={() => setSelection({ kind: "section", path })}
          >
            <GripVertical size={12} />
            <span className="pb-tree__label">{section.title || "Untitled section"}</span>
            <span className="pb-nav__count">{section.items.length}</span>
          </button>

          {section.items.map((item, itemIndex) => (
            <button
              type="button"
              key={`${path.join("-")}-i${itemIndex}`}
              className={`pb-tree__row ${depth > 0 ? "is-subitem" : "is-item"} ${
                isOn({ kind: "item", path, index: itemIndex }) ? "is-on" : ""
              }`}
              onClick={() => setSelection({ kind: "item", path, index: itemIndex })}
            >
              <ChevronRight size={11} />
              <span className="pb-tree__label">{item.title || "Untitled recommendation"}</span>
            </button>
          ))}

          <button
            type="button"
            className={`pb-tree__add ${depth > 0 ? "is-sub" : ""}`}
            title="One thing to test, with examples and an expected result — the unit a reader picks to generate a test case from."
            onClick={() => addItem(path)}
          >
            <Plus size={12} /> Recommendation
          </button>

          {depth === 0 && renderTree(section.sections, path)}
          {depth === 0 && (
            <button
              type="button"
              className="pb-tree__add"
              title="A group inside this section — Positive and Negative inside Functional Testing."
              onClick={() => addSubSection(path)}
            >
              <Plus size={12} /> Sub-section
            </button>
          )}
        </div>
      );
    });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PLAYBOOK_STYLES }} />

      <div className="dh-shell">
        <main className="dh-main">
          <div className="saas-header-container sc-header">
            <div className="sc-header-controls">
              <Button
                type="text"
                icon={<ArrowLeft size={17} />}
                onClick={() => router.push("/qa-workspace/playbooks")}
              >
                Playbooks
              </Button>
              <span className="pb-tag">
                {mode === "create" ? "New playbook" : `Editing v${metaState.version}`}
              </span>
              <span className="pb-tag">
                {sections.length} {sections.length === 1 ? "section" : "sections"} ·{" "}
                {itemCount} {itemCount === 1 ? "recommendation" : "recommendations"}
              </span>
            </div>

            <div className="sc-header-right">
              <span className={`pb-tier pb-tier--${metaState.visibility}`}>
                {VISIBILITY_LABELS[metaState.visibility]}
              </span>
              <Button
                className="pb-btn"
                icon={showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? "Hide preview" : "Live preview"}
              </Button>

              {/* Writing recommendations by hand is slow and, through Zai, costs
                  tokens each. The template asks an AI platform for the sections
                  of THIS playbook — its category and name are already settled —
                  and Upload drops the answer into the draft. */}
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    {
                      key: "prompt",
                      icon: <Copy size={14} />,
                      label: "Copy the AI prompt",
                      onClick: copyPrompt,
                    },
                    {
                      key: "file",
                      icon: <Download size={14} />,
                      label: "Download template (.json)",
                      onClick: () => {
                        downloadSectionsTemplate();
                        message.success("Template downloaded");
                      },
                    },
                  ],
                }}
              >
                <Button className="pb-btn" icon={<Download size={15} />}>
                  Template
                </Button>
              </Dropdown>

              <Button
                className="pb-btn"
                icon={<FileUp size={15} />}
                onClick={() => setImportOpen(true)}
              >
                Upload
              </Button>
              <Button
                type="primary"
                className="pb-btn"
                icon={<Save size={15} />}
                loading={saving}
                onClick={save}
              >
                Save playbook
              </Button>
            </div>
          </div>

          {saveError && (
            <div className="pb-saveerror" role="alert">
              <AlertCircle size={14} />
              <span>{saveError}</span>
              <button
                type="button"
                className="pb-saveerror__close"
                onClick={() => setSaveError(null)}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="pb-edit">
            <nav className="pb-edit__nav">
              <div className="pb-tree__head">Outline</div>
              <button
                type="button"
                className={`pb-tree__row ${isOn({ kind: "meta" }) ? "is-on" : ""}`}
                onClick={() => setSelection({ kind: "meta" })}
              >
                <BookOpen size={13} />
                <span className="pb-tree__label">Playbook details</span>
              </button>

              {renderTree(sections)}

              {/* The one structural act on this rail, so it does not look like a
                  third "+" row: a section is the level a reader navigates by, and
                  the copy says so rather than assuming the author knows. */}
              <button type="button" className="pb-tree__addmain" onClick={addSection}>
                <span className="pb-tree__addmain__badge">
                  <Plus size={15} />
                </span>
                <span className="pb-tree__addmain__text">
                  <b>Add section</b>
                  <em>
                    A top-level group a reader jumps to — Basic Testing, Session &amp;
                    Logout. Recommendations and sub-sections live inside one.
                  </em>
                </span>
              </button>
            </nav>

            <div className="pb-edit__body">
              {selection.kind === "meta" && (
                <div className="pb-form">
                  <BodyHeader
                    crumbs={["Playbook"]}
                    title={metaState.name || "Untitled playbook"}
                    description="What this playbook covers, and who can see it. These fields are what a QA reads on the catalog card before they open it."
                    completeness={{
                      filled: [metaState.name, metaState.category, metaState.summary, metaState.overview].filter(
                        (v) => v.trim()
                      ).length,
                      total: 4,
                    }}
                  />

                  <FieldGroup
                    icon={<BookOpen size={15} />}
                    title="Identity"
                    description="How this playbook is named and filed in the catalog."
                  >
                    <div className="pb-form__grid">
                      <Field label="Name" required value={metaState.name} max={160}>
                        <Input
                          value={metaState.name}
                          onChange={(e) => setMetaState({ ...metaState, name: e.target.value })}
                          placeholder="e.g., File Upload"
                          size="large"
                          maxLength={160}
                        />
                      </Field>
                      <Field
                        label="Category"
                        required
                        hint="Groups the playbook in the catalog — reuse an existing name to file it alongside its siblings."
                      >
                        <Input
                          value={metaState.category}
                          onChange={(e) => setMetaState({ ...metaState, category: e.target.value })}
                          placeholder="e.g., Data Management"
                          size="large"
                          maxLength={80}
                        />
                      </Field>
                    </div>

                    <Field
                      label="Summary"
                      required
                      value={metaState.summary}
                      max={600}
                      hint="One line. It is the only description shown on the card, so say what a QA gets."
                    >
                      <Input
                        value={metaState.summary}
                        onChange={(e) => setMetaState({ ...metaState, summary: e.target.value })}
                        placeholder="One line describing what a QA gets from this playbook"
                        size="large"
                        maxLength={600}
                      />
                    </Field>
                  </FieldGroup>

                  <FieldGroup
                    icon={<FileText size={15} />}
                    title="Overview"
                    description="Shown above the sections when someone opens the playbook."
                  >
                    <Field
                      label="Overview"
                      hint={
                        <>
                          Supports <code className="pb-code">**bold**</code>,{" "}
                          <code className="pb-code">`code`</code>, <code className="pb-code">- bullets</code>{" "}
                          and fenced code blocks. Watch it render in the preview as you type.
                        </>
                      }
                    >
                      <TextArea
                        value={metaState.overview}
                        onChange={(e) => setMetaState({ ...metaState, overview: e.target.value })}
                        placeholder="How to use this playbook, what it assumes, where the real defects tend to be…"
                        autoSize={{ minRows: 8, maxRows: 24 }}
                      />
                    </Field>
                  </FieldGroup>

                  <FieldGroup
                    icon={<History size={15} />}
                    title="Version"
                    description="Every save records a version, so a reader can see what changed and when."
                  >
                    <div className="pb-form__grid">
                      <Field label="Version">
                        <Input
                          value={metaState.version}
                          onChange={(e) => setMetaState({ ...metaState, version: e.target.value })}
                          placeholder="1.0"
                          size="large"
                        />
                      </Field>
                      <Field label="What changed" hint="Recorded in the change history against this version.">
                        <Input
                          value={metaState.changelog}
                          onChange={(e) => setMetaState({ ...metaState, changelog: e.target.value })}
                          placeholder="e.g., Added session security scenarios"
                          size="large"
                        />
                      </Field>
                    </div>
                  </FieldGroup>

                  <FieldGroup
                    icon={<Lock size={15} />}
                    title="Visibility & access"
                    description="Who can see this playbook, and on what terms."
                  >
                    {canPublish ? (
                      <Field
                        label="Visibility"
                        hint="Public is free for every workspace. Premium is listed everywhere with the body locked until access is granted."
                      >
                        <SearchableDropdown
                          value={metaState.visibility}
                          onChange={(value: string) =>
                            setMetaState({ ...metaState, visibility: value as PlaybookVisibility })
                          }
                          options={[
                            { value: "public", label: "Public", description: "Free for every workspace" },
                            {
                              value: "premium",
                              label: "Premium",
                              description: "Listed everywhere, unlocked on purchase or grant",
                            },
                          ]}
                          placeholder="Select visibility"
                        />
                      </Field>
                    ) : (
                      <Field
                        label="Visibility"
                        hint="Playbooks you create stay private to your workspace. Publishing to every workspace is done by Testiez."
                      >
                        <Input value="My workspace" size="large" disabled />
                      </Field>
                    )}

                    {canPublish && metaState.visibility === "premium" && (
                      <div className="pb-form__grid">
                        <Field label="Price in credits">
                          <Input
                            value={metaState.price_credits}
                            onChange={(e) => setMetaState({ ...metaState, price_credits: e.target.value })}
                            placeholder="e.g., 250"
                            size="large"
                          />
                        </Field>
                        <Field
                          label="Or a price in money"
                          hint="Shown on the locked card. Access is granted by Testiez on request."
                        >
                          <Input
                            value={metaState.price_amount}
                            onChange={(e) => setMetaState({ ...metaState, price_amount: e.target.value })}
                            placeholder="e.g., 49.00"
                            size="large"
                            prefix={metaState.price_currency}
                          />
                        </Field>
                      </div>
                    )}
                  </FieldGroup>
                </div>
              )}

              {selection.kind === "section" &&
                (() => {
                  const section = sectionAt(sections, selection.path);
                  if (!section) return null;
                  const isSub = selection.path.length > 1;
                  const parent = isSub ? sectionAt(sections, selection.path.slice(0, -1)) : undefined;

                  return (
                    <div className="pb-form">
                      <BodyHeader
                        crumbs={[
                          metaState.name || "Playbook",
                          ...(parent ? [parent.title || "Untitled section"] : []),
                          isSub ? "Sub-section" : "Section",
                        ]}
                        title={section.title || "Untitled section"}
                        description="A section groups recommendations that belong together. Its description sets up what the group is for."
                        actions={
                          <Popconfirm
                            title="Delete this section?"
                            description="Its recommendations are deleted with it."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => removeSection(selection.path)}
                          >
                            <Button size="small" danger icon={<Trash2 size={13} />}>
                              Delete
                            </Button>
                          </Popconfirm>
                        }
                      />

                      <FieldGroup
                        icon={<Layers size={15} />}
                        title={isSub ? "Sub-section" : "Section"}
                        description="What the reader sees as the heading and the lead-in above the cards."
                      >
                        <Field label="Title" required>
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(selection.path, { title: e.target.value })}
                            placeholder="e.g., Boundary & Edge Cases"
                            size="large"
                            maxLength={200}
                          />
                        </Field>

                        <Field
                          label="Description"
                          hint="Optional. A sentence or two on what this group is for and why it earns its place."
                        >
                          <TextArea
                            value={section.description ?? ""}
                            onChange={(e) => updateSection(selection.path, { description: e.target.value })}
                            placeholder="What this section is for, in a sentence or two"
                            autoSize={{ minRows: 3, maxRows: 10 }}
                          />
                        </Field>
                      </FieldGroup>

                      <FieldGroup
                        icon={<ListChecks size={15} />}
                        title="Contents"
                        description={`${section.items.length} recommendation${
                          section.items.length === 1 ? "" : "s"
                        }${isSub ? "" : `, ${section.sections.length} sub-section${section.sections.length === 1 ? "" : "s"}`}`}
                      >
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button icon={<Plus size={14} />} onClick={() => addItem(selection.path)}>
                            Add recommendation
                          </Button>
                          <button
                            type="button"
                            className="pb-zaibtn"
                            onClick={() => setZaiTarget({ path: selection.path })}
                          >
                            <Sparkles size={14} />
                            Draft with Zai
                          </button>
                          {!isSub && (
                            <Button icon={<Plus size={14} />} onClick={() => addSubSection(selection.path)}>
                              Add sub-section
                            </Button>
                          )}
                        </div>
                      </FieldGroup>
                    </div>
                  );
                })()}

              {selection.kind === "item" &&
                (() => {
                  const section = sectionAt(sections, selection.path);
                  const item = section?.items[selection.index];
                  if (!item) return null;
                  const patch = (p: Partial<DraftItem>) => updateItem(selection.path, selection.index, p);

                  return (
                    <div className="pb-form">
                      <BodyHeader
                        crumbs={[
                          metaState.name || "Playbook",
                          section?.title || "Untitled section",
                          "Recommendation",
                        ]}
                        title={item.title || "Untitled recommendation"}
                        description="These are the fields the reader shows, in this order. Why it matters is what stops a junior QA skipping the check."
                        completeness={{
                          filled: [
                            item.title,
                            item.what_to_test,
                            item.expected,
                            item.why_it_matters,
                          ].filter((v) => v.trim()).length,
                          total: 4,
                        }}
                        actions={
                          <>
                            {/* Available whatever state the recommendation is in:
                                Zai is as useful for replacing a draft that missed
                                as it is for filling a blank one. */}
                            <button
                              type="button"
                              className="pb-zaibtn pb-zaibtn--sm"
                              onClick={() =>
                                setZaiTarget({
                                  path: selection.path,
                                  replaceIndex: selection.index,
                                })
                              }
                            >
                              <Sparkles size={13} />
                              Draft with Zai
                            </button>
                            <Popconfirm
                              title="Delete this recommendation?"
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => removeItem(selection.path, selection.index)}
                            >
                              <Button size="small" danger icon={<Trash2 size={13} />}>
                                Delete
                              </Button>
                            </Popconfirm>
                          </>
                        }
                      />

                      <FieldGroup
                        icon={<Target size={15} />}
                        title="The check"
                        description="What a tester does, and what tells them it passed."
                      >
                        <Field label="Title" required value={item.title} max={240}>
                          <Input
                            value={item.title}
                            onChange={(e) => patch({ title: e.target.value })}
                            placeholder="e.g., Email format validation"
                            size="large"
                            maxLength={240}
                          />
                        </Field>

                        <Field
                          label="What to test"
                          hint="The action, concretely enough that someone could follow it without asking you."
                        >
                          <TextArea
                            value={item.what_to_test}
                            onChange={(e) => patch({ what_to_test: e.target.value })}
                            placeholder="Enter valid and invalid email formats."
                            autoSize={{ minRows: 3, maxRows: 12 }}
                          />
                        </Field>

                        <Field label="Expected" hint="The observable outcome that means this passed.">
                          <TextArea
                            value={item.expected}
                            onChange={(e) => patch({ expected: e.target.value })}
                            placeholder="The application accepts valid formats and shows a clear message for invalid ones."
                            autoSize={{ minRows: 2, maxRows: 10 }}
                          />
                        </Field>

                        <Field
                          label="Why it matters"
                          hint="What breaks in production when this is skipped. This is the line that teaches."
                        >
                          <TextArea
                            value={item.why_it_matters}
                            onChange={(e) => patch({ why_it_matters: e.target.value })}
                            placeholder="Invalid input should be handled before authentication is attempted."
                            autoSize={{ minRows: 2, maxRows: 10 }}
                          />
                        </Field>
                      </FieldGroup>

                      <FieldGroup
                        icon={<Tags size={15} />}
                        title="Classification"
                        description="Drives the level and category filters, and the badges on the card."
                      >
                        <Field
                          label="Level"
                          hint="Junior items are not the easy ones — they are the ones that catch the most reported bugs."
                        >
                          <ChipPicker
                            value={item.level}
                            options={levelOptions}
                            onChange={(value) => patch({ level: value as any })}
                          />
                        </Field>

                        <Field label="Risk">
                          <ChipPicker
                            value={item.risk}
                            options={riskOptions.map((r) => ({
                              value: r,
                              label: r.charAt(0).toUpperCase() + r.slice(1),
                            }))}
                            onChange={(value) => patch({ risk: value as any })}
                          />
                        </Field>

                        <Field label="Category">
                          <SearchableDropdown
                            value={item.category}
                            onChange={(value: string) => patch({ category: value })}
                            options={categoryOptions}
                            placeholder="Select a category"
                            searchPlaceholder="Search categories"
                          />
                        </Field>
                      </FieldGroup>

                      <FieldGroup
                        icon={<ListChecks size={15} />}
                        title="Detail"
                        description="Optional, and what separates a recommendation from a one-line reminder."
                      >
                        <ListEditor
                          label="Preconditions"
                          count={item.preconditions.length}
                          addLabel="Add precondition"
                          onAdd={() => patch({ preconditions: [...item.preconditions, ""] })}
                          emptyText="No setup needed. Add one where the check only means something from a particular starting state."
                          hint="The state the system must already be in — a token issued and unused, a locked account, a seeded order. Kept out of the steps so nobody skips it."
                        >
                          {item.preconditions.map((pre, i) => (
                            <ListRow
                              key={i}
                              index={i}
                              onRemove={() =>
                                patch({
                                  preconditions: item.preconditions.filter((_, j) => j !== i),
                                })
                              }
                            >
                              <Input
                                value={pre}
                                onChange={(e) => {
                                  const preconditions = [...item.preconditions];
                                  preconditions[i] = e.target.value;
                                  patch({ preconditions });
                                }}
                                onPressEnter={() => {
                                  if (i === item.preconditions.length - 1)
                                    patch({ preconditions: [...item.preconditions, ""] });
                                }}
                                placeholder="A reset token has been issued and not yet used"
                              />
                            </ListRow>
                          ))}
                        </ListEditor>

                        <ListEditor
                          label="Steps"
                          count={item.steps.length}
                          addLabel="Add step"
                          onAdd={() => patch({ steps: [...item.steps, ""] })}
                          emptyText="No steps — the reader will use What to test plus the examples. Add steps for a scenario worth walking through."
                          hint="Press Enter in the last step to add another."
                        >
                          {item.steps.map((step, i) => (
                            <ListRow
                              key={i}
                              index={i}
                              numbered
                              onRemove={() => patch({ steps: item.steps.filter((_, j) => j !== i) })}
                            >
                              <Input
                                value={step}
                                onChange={(e) => {
                                  const steps = [...item.steps];
                                  steps[i] = e.target.value;
                                  patch({ steps });
                                }}
                                onPressEnter={() => {
                                  if (i === item.steps.length - 1) patch({ steps: [...item.steps, ""] });
                                }}
                                placeholder="One action per step"
                              />
                            </ListRow>
                          ))}
                        </ListEditor>

                        <ListEditor
                          label="Examples"
                          count={item.examples.length}
                          addLabel="Add example"
                          onAdd={() => patch({ examples: [...item.examples, ""] })}
                          emptyText="No examples yet. Concrete inputs are what turn a rule into something a tester can run."
                          hint="A verdict turns the row into an input → outcome pair. Leave it blank for a plain example."
                        >
                          {item.examples.map((example, i) => {
                            const input = typeof example === "string" ? example : example.input;
                            const verdict = typeof example === "string" ? "" : example.verdict;
                            const setExample = (nextInput: string, nextVerdict: string) => {
                              const examples = [...item.examples];
                              examples[i] = nextVerdict ? { input: nextInput, verdict: nextVerdict } : nextInput;
                              patch({ examples });
                            };
                            return (
                              <ListRow
                                key={i}
                                index={i}
                                onRemove={() => patch({ examples: item.examples.filter((_, j) => j !== i) })}
                              >
                                <Input
                                  value={input}
                                  onChange={(e) => setExample(e.target.value, verdict)}
                                  placeholder="user@gmail.com"
                                />
                                <Input
                                  value={verdict}
                                  onChange={(e) => setExample(input, e.target.value)}
                                  placeholder="Valid (optional)"
                                  style={{ maxWidth: 220 }}
                                />
                              </ListRow>
                            );
                          })}
                        </ListEditor>

                        <ListEditor
                          label="Edge cases"
                          count={item.edge_cases.length}
                          addLabel="Add edge case"
                          onAdd={() => patch({ edge_cases: [...item.edge_cases, ""] })}
                          emptyText="None listed. Add the variants worth a second pass once the happy path holds."
                          hint="Situations to go and look at — empty, maximum length, unicode, concurrent, offline, back button. An input with a verdict belongs in Examples instead."
                        >
                          {item.edge_cases.map((edge, i) => (
                            <ListRow
                              key={i}
                              index={i}
                              onRemove={() =>
                                patch({ edge_cases: item.edge_cases.filter((_, j) => j !== i) })
                              }
                            >
                              <Input
                                value={edge}
                                onChange={(e) => {
                                  const edge_cases = [...item.edge_cases];
                                  edge_cases[i] = e.target.value;
                                  patch({ edge_cases });
                                }}
                                onPressEnter={() => {
                                  if (i === item.edge_cases.length - 1)
                                    patch({ edge_cases: [...item.edge_cases, ""] });
                                }}
                                placeholder="Two tabs submitting the same token at once"
                              />
                            </ListRow>
                          ))}
                        </ListEditor>

                        <ListEditor
                          label="Applies when"
                          count={Object.keys(item.applies_when).length}
                          addLabel="Add condition"
                          onAdd={() => patch({ applies_when: { ...item.applies_when, "": [] } })}
                          emptyText="Always applies. Add a condition if this only matters for products with a particular mechanism."
                          hint="Marks the recommendation conditional, so a team whose product has no OAuth knows to skip it rather than write cases for it."
                        >
                          {Object.entries(item.applies_when).map(([key, values], i) => (
                            <ListRow
                              key={i}
                              index={i}
                              onRemove={() => {
                                const next = { ...item.applies_when };
                                delete next[key];
                                patch({ applies_when: next });
                              }}
                            >
                              <Input
                                value={key}
                                onChange={(e) => {
                                  const next: Record<string, string[]> = {};
                                  Object.entries(item.applies_when).forEach(([k, v], j) => {
                                    next[j === i ? e.target.value : k] = v;
                                  });
                                  patch({ applies_when: next });
                                }}
                                placeholder="auth"
                                style={{ maxWidth: 190 }}
                              />
                              <Input
                                value={(values ?? []).join(", ")}
                                onChange={(e) =>
                                  patch({
                                    applies_when: {
                                      ...item.applies_when,
                                      [key]: e.target.value
                                        .split(",")
                                        .map((v) => v.trim())
                                        .filter(Boolean),
                                    },
                                  })
                                }
                                placeholder="oauth, mfa"
                              />
                            </ListRow>
                          ))}
                        </ListEditor>
                      </FieldGroup>

                      <FieldGroup
                        icon={<LinkIcon size={15} />}
                        title="Reference / learn more"
                        description="Where this came from, and where a reader goes to go deeper."
                      >
                        <ListEditor
                          label="References"
                          count={item.references.length}
                          addLabel="Add reference"
                          onAdd={() =>
                            patch({
                              references: [
                                ...item.references,
                                { type: "qa_guide", name: "", description: "", url: "" },
                              ],
                            })
                          }
                          emptyText="None yet. A guide, the security standard and something live to try it on answer the same question differently — give the reader more than one."
                          hint="A reference with no link is fine — “OWASP ASVS §2.1” points somewhere real without one."
                        >
                          {item.references.map((ref, i) => {
                            const setRef = (next: Partial<PlaybookReference>) => {
                              const references = [...item.references];
                              references[i] = { ...references[i], ...next };
                              patch({ references });
                            };
                            return (
                              <div className="pb-ref__row" key={i}>
                                <ListRow
                                  index={i}
                                  onRemove={() =>
                                    patch({
                                      references: item.references.filter((_, j) => j !== i),
                                    })
                                  }
                                >
                                  <div className="pb-ref__grid">
                                    <SearchableDropdown
                                      value={ref.type}
                                      onChange={(value: string) =>
                                        setRef({ type: (value as any) || "qa_guide" })
                                      }
                                      options={REFERENCE_TYPE_ORDER.map((type) => ({
                                        value: type,
                                        label: `${REFERENCE_TYPES[type].emoji}  ${REFERENCE_TYPES[type].label}`,
                                        description: REFERENCE_TYPES[type].hint,
                                      }))}
                                      placeholder="Type"
                                      allowClear={false}
                                      hideAvatar
                                      width={280}
                                    />
                                    <Input
                                      value={ref.name}
                                      onChange={(e) => setRef({ name: e.target.value })}
                                      placeholder="Katalon — 100 Login Page Test Cases"
                                      maxLength={200}
                                    />
                                    <Input
                                      value={ref.url ?? ""}
                                      onChange={(e) => setRef({ url: e.target.value })}
                                      placeholder="https://…  (optional)"
                                      maxLength={600}
                                    />
                                    <Input
                                      value={ref.description ?? ""}
                                      onChange={(e) => setRef({ description: e.target.value })}
                                      placeholder="One line on what the reader gets from it"
                                      maxLength={600}
                                    />
                                  </div>
                                </ListRow>
                              </div>
                            );
                          })}
                        </ListEditor>
                      </FieldGroup>
                    </div>
                  );
                })()}
            </div>

            {showPreview && (
              <aside className="pb-preview">
                <div className="pb-preview__head">
                  <Eye size={13} />
                  <span className="pb-preview__title">Live preview</span>
                  <span className="pb-preview__what">
                    {itemCount} recommendation{itemCount === 1 ? "" : "s"}
                  </span>
                </div>

                {/* The whole playbook as a reader gets it. The node being edited
                    is ringed and scrolled to, so the author keeps the context of
                    what sits either side of it. */}
                <div
                  ref={(el) => { nodeRefs.current["meta"] = el; }}
                  className={`pb-pnode ${selectionKey === "meta" ? "is-editing" : ""}`}
                >
                  <PlaybookCatalogCard playbook={previewSummary} />
                  {metaState.overview.trim() ? (
                    <div style={{ marginTop: 12 }}>
                      <PlaybookOverview text={metaState.overview} />
                    </div>
                  ) : (
                    <div className="pb-preview__empty" style={{ marginTop: 12 }}>
                      The overview appears above the sections when someone opens this
                      playbook. Write one to see it here.
                    </div>
                  )}
                </div>

                {sections.length === 0 && (
                  <div className="pb-preview__empty">
                    Nothing yet. Add a section to start building the playbook.
                  </div>
                )}

                {sections.map((section, si) => {
                  const sKey = `s-${si}`;
                  return (
                    <section className="pb-section" key={sKey}>
                      <div
                        ref={(el) => { nodeRefs.current[sKey] = el; }}
                        className={`pb-pnode ${selectionKey === sKey ? "is-editing" : ""}`}
                      >
                        <div className="pb-section__head">
                          <h3 className="pb-section__title">
                            {section.title || "Untitled section"}
                          </h3>
                        </div>
                        {section.description && (
                          <p className="pb-section__desc">{section.description}</p>
                        )}
                      </div>

                      {section.items.length === 0 && section.sections.length === 0 && (
                        <div className="pb-preview__empty">No recommendations in this section yet.</div>
                      )}

                      {section.items.map((item, ii) => {
                        const iKey = `i-${si}::${ii}`;
                        return (
                          <div
                            key={iKey}
                            ref={(el) => { nodeRefs.current[iKey] = el; }}
                            className={`pb-pnode ${selectionKey === iKey ? "is-editing" : ""}`}
                          >
                            <PlaybookItemCard
                              item={draftToItem(item, iKey)}
                              categoryLabels={categoryLabels}
                            />
                          </div>
                        );
                      })}

                      {section.sections.map((sub, subi) => {
                        const subKey = `s-${si}-${subi}`;
                        return (
                          <div className="pb-section__sub" key={subKey}>
                            <div
                              ref={(el) => { nodeRefs.current[subKey] = el; }}
                              className={`pb-pnode ${selectionKey === subKey ? "is-editing" : ""}`}
                            >
                              <div className="pb-section__head">
                                <h3 className="pb-section__title is-sub">
                                  {sub.title || "Untitled sub-section"}
                                </h3>
                              </div>
                              {sub.description && (
                                <p className="pb-section__desc">{sub.description}</p>
                              )}
                            </div>

                            {sub.items.length === 0 && (
                              <div className="pb-preview__empty">Nothing here yet.</div>
                            )}

                            {sub.items.map((item, ii) => {
                              const iKey = `i-${si}-${subi}::${ii}`;
                              return (
                                <div
                                  key={iKey}
                                  ref={(el) => { nodeRefs.current[iKey] = el; }}
                                  className={`pb-pnode ${selectionKey === iKey ? "is-editing" : ""}`}
                                >
                                  <PlaybookItemCard
                                    item={draftToItem(item, iKey)}
                                    categoryLabels={categoryLabels}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </section>
                  );
                })}
              </aside>
            )}
          </div>
        </main>
      </div>

      <ImportSectionsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        playbookName={metaState.name}
        category={metaState.category}
        existingSections={sections.length}
        existingItems={itemCount}
        levels={levelOptions.map((l) => l.value)}
        categories={categoryOptions.map((c) => c.value)}
        risks={riskOptions}
        onApply={(incoming, mode) => {
          /* Straight onto the draft: the author reviews it in the outline and
             the live preview, and Save playbook is still what commits it. */
          setSections((prev) => (mode === "append" ? [...prev, ...incoming] : incoming));
          setSelection({
            kind: "section",
            path: [mode === "append" ? sections.length : 0],
          });
        }}
      />

      <ZaiRecommendationModal
        open={!!zaiTarget}
        onClose={() => setZaiTarget(null)}
        playbookName={metaState.name}
        sectionTitle={zaiTarget ? sectionAt(sections, zaiTarget.path)?.title ?? "" : ""}
        categoryLabels={categoryLabels}
        categoryOptions={categoryOptions}
        levelOptions={levelOptions}
        onAccept={acceptZaiDraft}
      />
    </>
  );
}
