"use client";

/**
 * Import playbooks written outside the app.
 *
 * The flow this belongs to: download the template → paste it into any AI
 * platform with the prompt → paste the answer back here. Authoring inside the
 * app costs tokens per recommendation; a QA who already pays for an AI
 * subscription can do the writing there instead and bring the result over.
 *
 * Nothing is created until the paste has parsed and the author has seen exactly
 * what it will make: Category → Playbook → recommendation cases.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Modal, message } from "antd";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardPaste,
  FileJson,
  FileText,
  FileUp,
  Layers,
  Library,
  PenLine,
  SlidersHorizontal,
  Target,
  Sparkles,
  X,
} from "lucide-react";

import { api as axios } from "@/lib/axios";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

interface ParsedItem {
  title?: string;
}
interface ParsedSection {
  title?: string;
  items?: ParsedItem[];
  sections?: ParsedSection[];
}
interface ParsedPlaybook {
  name?: string;
  category?: string;
  summary?: string;
  sections?: ParsedSection[];
}

/** One field the API refused, with the path into the pasted JSON. */
interface ValidationDetail {
  path: string;
  message: string;
}

interface ImportResult {
  created: { id: string; slug: string; name: string; category: string; itemCount: number }[];
  failed: { index: number; name: string; error: string }[];
  itemCount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * What Zai is doing with the document, and roughly when.
 *
 * PACED, NOT REPORTED: the endpoint answers in one shot, so these are an honest
 * description of the work rather than server progress. The last stage is held
 * until the response lands, so it never claims to be finished before it is.
 */
/** Openers that show the shape of a brief worth writing playbooks from. */
const BRIEF_STARTERS = [
  {
    label: "User management",
    text: "I have user management — create, edit, deactivate and delete users. Fields: name, age, email, phone. Only admins can delete. Email must be unique.",
  },
  {
    label: "Checkout",
    text: "Checkout with card and wallet payments, discount codes, and a 30-day refund window. Orders can be cancelled before dispatch.",
  },
  {
    label: "File upload",
    text: "Users upload files up to 25 MB (PDF, PNG, DOCX). Uploads are virus-scanned, and a failed scan quarantines the file and notifies the owner.",
  },
];

const PLAYBOOK_PRESETS = [1, 3, 5, 10];
const MAX_PLAYBOOKS = 100;

/**
 * How many playbooks to plan — presets, or a number up to 100.
 *
 * This is real cost, not a display option: the plan is one call and then EVERY
 * playbook is a call of its own, so twenty here is twenty-one requests and the
 * best part of ten minutes. The note under it says so once the number is large
 * enough for that to matter.
 */
function PlaybookCountPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const custom = !PLAYBOOK_PRESETS.includes(value);

  return (
    <div className="pb-import__countwrap">
      <div className="pb-import__count">
        <span className="pb-ask__label" style={{ marginBottom: 0 }}>
          <Layers size={13} />
          How many playbooks
        </span>

        <div className="pb-import__countright">
          <div className="pb-seg">
            {PLAYBOOK_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`pb-seg__btn ${value === n ? "is-on" : ""}`}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <div className={`pb-import__countnum ${custom ? "is-on" : ""}`}>
            <input
              type="number"
              min={1}
              max={MAX_PLAYBOOKS}
              value={value}
              aria-label="Number of playbooks"
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                onChange(Math.min(Math.max(1, Math.round(next)), MAX_PLAYBOOKS));
              }}
            />
            <span>of {MAX_PLAYBOOKS}</span>
          </div>
        </div>
      </div>

      <span className="pb-ask__help">
        A ceiling, not a target — Zai writes fewer when there are fewer features to
        cover.
        {value > 10 ? (
          <b className="pb-import__countwarn">
            {" "}
            {value} playbooks is {value + 1} AI calls and can run past ten minutes. Keep
            this window open while it works.
          </b>
        ) : null}
      </span>
    </div>
  );
}

/** Rows in the read panel: the plan, then one per playbook being written. */
interface ReadStep {
  label: string;
  hint: string;
  state: "pending" | "active" | "done" | "failed";
}

/** Recommendations anywhere in a section tree. */
function countItems(sections: ParsedSection[] = []): number {
  return sections.reduce(
    (sum, section) => sum + (section.items?.length ?? 0) + countItems(section.sections ?? []),
    0
  );
}

export default function ImportPlaybooksModal({ open, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"describe" | "document" | "paste">("describe");
  /** What the author typed when there is no document at all. */
  const [brief, setBrief] = useState("");
  const [raw, setRaw] = useState("");
  /** The PRD being read, and where Zai has got to with it. */
  const [docSource, setDocSource] = useState<"upload" | "hub">("upload");
  const [doc, setDoc] = useState<File | null>(null);
  const [hubId, setHubId] = useState<string | null>(null);
  const [hubFileId, setHubFileId] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [maxPlaybooks, setMaxPlaybooks] = useState(3);
  const [reading, setReading] = useState(false);
  const [steps, setSteps] = useState<ReadStep[]>([]);
  const docRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  /** Per-playbook state while the batch runs. Real, not paced: one request each. */
  const [progress, setProgress] = useState<
    { name: string; category: string; items: number; state: "pending" | "active" | "done" | "failed"; note?: string }[]
  >([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rejected, setRejected] = useState<ValidationDetail[] | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  /**
   * Parsed on every keystroke rather than behind a "Validate" button: the
   * author finds out the paste is truncated while they can still fix it, not
   * after pressing Import.
   *
   * A fenced ```json block is unwrapped — every AI platform adds one sooner or
   * later, and refusing the paste over three backticks would be pedantry.
   */
  /* Hubs first; the files inside one only when it is picked. Both are only
     fetched while the document tab is open — the modal is opened far more often
     to paste JSON than to read a hub. */
  const { data: hubs = [], isLoading: loadingHubs } = useQuery<any[]>({
    queryKey: ["documenthub", "list", "for-playbooks"],
    queryFn: async () => {
      const response: any = await axios.get("/api/documenthub", {
        params: { limit: 100 },
      });
      return response?.data ?? response?.hubs ?? (Array.isArray(response) ? response : []);
    },
    enabled: open && tab === "document" && docSource === "hub",
    staleTime: 5 * 60 * 1000,
  });

  const { data: hub, isLoading: loadingHub } = useQuery<any>({
    queryKey: ["documenthub", "detail", hubId],
    queryFn: () => axios.get(`/api/documenthub/${hubId}`),
    enabled: !!hubId && tab === "document" && docSource === "hub",
    staleTime: 60 * 1000,
  });

  /**
   * Only `file` nodes, and only those that actually carry a document.
   *
   * A hub's tree also holds sections and folders. Neither has content to read,
   * so neither is offered — picking one would either fail on the server or,
   * worse, look like it worked and produce nothing.
   */
  const hubFiles = useMemo(
    () =>
      ((hub?.treeNodes ?? []) as any[])
        .filter((node) => node?.type === "file" && node?.documentId)
        .map((node) => ({
          value: node.documentId as string,
          label: node.title || "Untitled page",
        })),
    [hub]
  );

  const parsed = useMemo(() => {
    const text = raw.trim();
    if (!text) return { playbooks: [] as ParsedPlaybook[], error: null as string | null };

    const unfenced = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    try {
      const data = JSON.parse(unfenced);
      const playbooks: ParsedPlaybook[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.playbooks)
        ? data.playbooks
        : data && typeof data === "object" && data.name
        ? [data] // a single playbook, pasted on its own
        : [];

      if (playbooks.length === 0) {
        return {
          playbooks: [],
          error: 'No playbooks found. The JSON needs a "playbooks" array, or be one playbook.',
        };
      }
      return { playbooks, error: null };
    } catch (err: any) {
      return {
        playbooks: [] as ParsedPlaybook[],
        error: `That is not valid JSON — ${err?.message ?? "check the paste is complete"}.`,
      };
    }
  }, [raw]);

  const totals = useMemo(() => {
    const categories = new Set(parsed.playbooks.map((p) => p.category || "Uncategorised"));
    return {
      categories: categories.size,
      playbooks: parsed.playbooks.length,
      items: parsed.playbooks.reduce((sum, p) => sum + countItems(p.sections ?? []), 0),
    };
  }, [parsed]);

  /* Reported, not timed: the plan is one step, then one per playbook. */
  const readDone = steps.filter((s) => s.state === "done" || s.state === "failed").length;
  const readPercent = steps.length === 0 ? 0 : Math.round((readDone / steps.length) * 100);

  const done = progress.filter((row) => row.state === "done" || row.state === "failed").length;
  const percent = progress.length === 0 ? 0 : Math.round((done / progress.length) * 100);
  const activeRow = progress.find((row) => row.state === "active");

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.onerror = () => message.error("Could not read that file");
    reader.readAsText(file);
  };

  const close = () => {
    setRaw("");
    setResult(null);
    setRejected(null);
    setProgress([]);
    setDoc(null);
    setHint("");
    setTab("paste");
    setDocSource("upload");
    setHubId(null);
    setHubFileId(null);
    setBrief("");
    setTab("describe");
    onClose();
  };

  /**
   * Reads the document and puts what Zai wrote into the paste box, rather than
   * creating anything: the preview, the counts and the import below are the
   * same ones a hand-pasted batch goes through, and a model reading a PRD is
   * exactly the case where a person should look before rows appear.
   */
  /**
   * Two passes, and the panel shows both.
   *
   * PLAN once — filing, sections and the title of every recommendation — then
   * WRITE one playbook per request. Asking for everything in a single
   * completion put several hundred JSON objects past any output cap: it either
   * truncated or never came back, which is what left the old panel sitting on
   * "Writing the recommendations" with nothing to show for it.
   *
   * Every row below is reported, not timed.
   */
  const readDocument = async () => {
    const fromDescription = tab === "describe";
    const fromHub = docSource === "hub";
    if (fromDescription ? brief.trim().length < 15 : fromHub ? !hubFileId : !doc) return;

    const form = new FormData();
    if (fromDescription) form.append("brief", brief.trim());
    else if (fromHub) form.append("document_id", hubFileId as string);
    else form.append("file", doc as File);
    if (hint.trim()) form.append("hint", hint.trim());
    form.append("max_playbooks", String(maxPlaybooks));

    setReading(true);
    setSteps([
      {
        label: fromDescription ? "Reading what you described" : "Reading the document",
        hint: "Working out what is testable in it, and planning the playbooks",
        state: "active",
      },
    ]);

    try {
      const planned: any = await axios.post("/api/v2/qa/playbooks/ai/from-document", form, {
        headers: { "Content-Type": "multipart/form-data" },
        /* Measured: a one-page PRD plans in ~80s on deepseek-v4-pro, and the
           budget scales with how many playbooks were asked for. Five minutes
           leaves room for a long document without hanging forever. */
        timeout: 300000,
      });

      const outline: any[] = planned?.outline ?? [];
      const document: string = planned?.document ?? "";

      if (outline.length === 0) {
        message.error(
          fromDescription
            ? "Zai could not turn that into playbooks — try describing it in a little more detail"
            : "Zai found nothing testable in that document"
        );
        return;
      }

      setSteps([
        {
          label: "Read the document",
          hint: `Planned ${outline.length} playbook${outline.length === 1 ? "" : "s"}`,
          state: "done",
        },
        ...outline.map((row: any) => ({
          label: row.name,
          hint: `${row.category} · ${(row.sections ?? []).reduce(
            (sum: number, section: any) => sum + (section.item_titles?.length ?? 0),
            0
          )} recommendations planned`,
          state: "pending" as const,
        })),
      ]);

      const written: any[] = [];

      for (let index = 0; index < outline.length; index += 1) {
        setSteps((rows) =>
          rows.map((row, i) => (i === index + 1 ? { ...row, state: "active" } : row))
        );

        try {
          const response: any = await axios.post(
            "/api/v2/qa/playbooks/ai/from-document/expand",
            { document, outline: outline[index] },
            /* ~70s per playbook measured; six minutes covers a slow one
               without abandoning work that is nearly finished. */
            { timeout: 360000 }
          );
          if (response?.playbook) {
            written.push(response.playbook);
            const count = countItems(response.playbook.sections ?? []);
            setSteps((rows) =>
              rows.map((row, i) =>
                i === index + 1
                  ? { ...row, state: "done", hint: `Written · ${count} recommendations` }
                  : row
              )
            );
          }
        } catch (err: any) {
          /* One playbook failing must not cost the others — the rest are still
             written and the author imports what came back. */
          const reason =
            err?.response?.data?.error || err?.message || "Zai could not write this one";
          setSteps((rows) =>
            rows.map((row, i) => (i === index + 1 ? { ...row, state: "failed", hint: reason } : row))
          );
        }
      }

      if (written.length === 0) {
        message.error("Zai could not write any playbooks from that document");
        return;
      }

      setRaw(JSON.stringify({ playbooks: written }, null, 2));
      setTab("paste");
      message.success(
        `Zai wrote ${written.length} playbook${written.length === 1 ? "" : "s"} — review them below`
      );
    } catch (err: any) {
      message.error(
        err?.response?.data?.error || err?.message || "Could not read that document"
      );
    } finally {
      setReading(false);
    }
  };


  const runImport = async () => {
    if (parsed.playbooks.length === 0) return;

    setImporting(true);
    setRejected(null);
    setProgress(
      parsed.playbooks.map((playbook) => ({
        name: playbook.name || "Untitled playbook",
        category: playbook.category || "No category",
        items: countItems(playbook.sections ?? []),
        state: "pending" as const,
      }))
    );

    const created: ImportResult["created"] = [];
    const failed: ImportResult["failed"] = [];
    const details: ValidationDetail[] = [];

    for (let index = 0; index < parsed.playbooks.length; index += 1) {
      const playbook = parsed.playbooks[index];
      setProgress((rows) =>
        rows.map((row, i) => (i === index ? { ...row, state: "active" } : row))
      );

      try {
        const response: any = await axios.post("/api/v2/qa/playbooks/import", {
          playbooks: [playbook],
        });

        const madeIt = response?.created?.[0];
        const refused = response?.failed?.[0];

        if (madeIt) {
          created.push({ ...madeIt, index });
          setProgress((rows) =>
            rows.map((row, i) =>
              i === index
                ? { ...row, state: "done", items: madeIt.itemCount, note: "Created" }
                : row
            )
          );
        } else {
          const reason = refused?.error || "Nothing was created";
          failed.push({ index, name: playbook.name || `Playbook ${index + 1}`, error: reason });
          setProgress((rows) =>
            rows.map((row, i) => (i === index ? { ...row, state: "failed", note: reason } : row))
          );
        }
      } catch (err: any) {
        /* A rejected playbook names the exact fields. Paths come back indexed
           against the one-playbook request, so they are rewritten to the real
           position in the paste — otherwise every error would read
           "playbooks.0" whichever one failed. */
        const fields = err?.response?.data?.details;
        if (Array.isArray(fields)) {
          fields.forEach((field: ValidationDetail) =>
            details.push({
              ...field,
              path: String(field.path ?? "").replace(/^playbooks\.0/, `playbooks.${index}`),
            })
          );
        }
        const reason =
          (Array.isArray(fields) && fields.length > 0
            ? `${fields.length} field${fields.length === 1 ? "" : "s"} rejected`
            : null) ||
          err?.response?.data?.error ||
          err?.message ||
          "Could not import this playbook";

        failed.push({ index, name: playbook.name || `Playbook ${index + 1}`, error: reason });
        setProgress((rows) =>
          rows.map((row, i) => (i === index ? { ...row, state: "failed", note: reason } : row))
        );
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });

    if (details.length > 0) setRejected(details.slice(0, 12));
    setResult({
      created,
      failed,
      itemCount: created.reduce((sum, row) => sum + (row.itemCount ?? 0), 0),
    });
    setImporting(false);

    if (created.length > 0) {
      message.success(
        `Imported ${created.length} playbook${created.length === 1 ? "" : "s"} · ${created.reduce(
          (sum, row) => sum + (row.itemCount ?? 0),
          0
        )} recommendations`
      );
    } else {
      message.error("Nothing was imported — see the reasons below");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        if (!importing && !reading) close();
      }}
      maskClosable={!importing && !reading}
      closable={!importing && !reading}
      width={720}
      centered
      className="pb-modal pb-import"
      title={
        <div className="pb-modal__head">
          <span className="pb-modal__badge">
            <FileUp size={17} />
          </span>
          <div>
            <div className="pb-modal__title">Import playbooks</div>
            <div className="pb-modal__sub">
              Paste what an AI platform wrote from the template. Category → Playbook →
              recommendation cases, created for you.
            </div>
          </div>
        </div>
      }
      footer={
        reading ? (
          <div className="pb-modal__foot">
            <span className="pb-modal__hint">
              Reading{" "}
              {docSource === "hub"
                ? hubFiles.find((f) => f.value === hubFileId)?.label ?? "the page"
                : doc?.name}{" "}
              — this takes a couple of minutes
            </span>
            <Button className="pb-btn" disabled>
              Cancel
            </Button>
            <Button type="primary" className="pb-btn" loading>
              Reading
            </Button>
          </div>
        ) : importing ? (
          <div className="pb-modal__foot">
            <span className="pb-modal__hint">
              {done} of {progress.length} done — do not close this window
            </span>
            <Button className="pb-btn" disabled>
              Cancel
            </Button>
            <Button type="primary" className="pb-btn" loading>
              Importing
            </Button>
          </div>
        ) : result ? (
          <div className="pb-modal__foot">
            <span className="pb-modal__hint">
              {result.created.length} imported
              {result.failed.length > 0 ? ` · ${result.failed.length} skipped` : ""}
            </span>
            <Button className="pb-btn" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <div className="pb-modal__foot">
            <span className="pb-modal__hint">
              {parsed.error
                ? "Fix the paste to continue"
                : totals.playbooks > 0
                ? `${totals.playbooks} playbook${totals.playbooks === 1 ? "" : "s"} · ${
                    totals.items
                  } recommendations`
                : tab === "describe"
                ? "Describe it, and Zai writes the playbooks"
                : tab === "document"
                ? "Zai reads it, you review before anything is created"
                : "Nothing pasted yet"}
            </span>
            <Button className="pb-btn" onClick={close}>
              Cancel
            </Button>
            {/* Import is the paste step's action: the other two tabs produce
                a paste, they do not create anything themselves. */}
            {(tab === "paste" || totals.playbooks > 0) && (
              <Button
                type="primary"
                className="pb-btn"
                icon={<Check size={14} />}
                loading={importing}
                disabled={totals.playbooks === 0 || !!parsed.error}
                onClick={runImport}
              >
                Import {totals.playbooks || ""}
              </Button>
            )}
          </div>
        )
      }
    >
      {importing ? (
        <div className="pb-import__running">
          <div className="pb-import__runhead">
            <div className="pb-import__runspin">
              <FileUp size={19} />
            </div>
            <div className="pb-import__runtext">
              <div className="pb-import__runtitle">
                Creating {progress.length} playbook{progress.length === 1 ? "" : "s"}
              </div>
              <div className="pb-import__runsub">
                {activeRow
                  ? `Writing “${activeRow.name}” — its sections and ${activeRow.items} recommendation${
                      activeRow.items === 1 ? "" : "s"
                    }`
                  : "Filing each one under its category"}
              </div>
            </div>
            <div className="pb-import__runpct">{percent}%</div>
          </div>

          <div className="pb-zai__track">
            <span className="pb-zai__trackfill is-blue" style={{ width: `${percent}%` }} />
          </div>

          <ol className="pb-import__stages">
            {progress.map((row, i) => (
              <li key={i} className={`pb-import__stage is-${row.state}`}>
                <span className="pb-import__stageicon">
                  {row.state === "done" ? (
                    <Check size={13} />
                  ) : row.state === "failed" ? (
                    <AlertCircle size={13} />
                  ) : (
                    <BookOpen size={13} />
                  )}
                </span>
                <span className="pb-import__stagetext">
                  <b>
                    <span className="pb-import__cat">{row.category}</span>
                    {row.name}
                  </b>
                  <em>
                    {row.state === "done"
                      ? `Created · ${row.items} recommendations`
                      : row.state === "failed"
                      ? row.note
                      : row.state === "active"
                      ? `Writing ${row.items} recommendations…`
                      : `${row.items} recommendations queued`}
                  </em>
                  {row.state === "active" && (
                    <span className="pb-zai__stagelines is-blue">
                      <span style={{ width: "88%" }} />
                      <span style={{ width: "62%" }} />
                    </span>
                  )}
                </span>
                {row.state === "active" && <span className="pb-zai__stagedots is-blue" aria-hidden />}
              </li>
            ))}
          </ol>

          <p className="pb-import__runfoot">
            Each playbook is written on its own — one that fails does not take the others
            with it. Keep this open until it finishes.
          </p>
        </div>
      ) : result ? (
        <div className="pb-import__done">
          {result.created.length > 0 && (
            <div className="pb-import__group">
              <h4>
                <Check size={13} /> Created
              </h4>
              {result.created.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  className="pb-import__row is-ok"
                  onClick={() => {
                    close();
                    router.push(`/qa-workspace/playbooks/${row.slug}`);
                  }}
                >
                  <span className="pb-import__cat">{row.category}</span>
                  <b>{row.name}</b>
                  <em>{row.itemCount} recommendations</em>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="pb-import__group">
              <h4 className="is-bad">
                <AlertCircle size={13} /> Skipped
              </h4>
              {/* One bad playbook does not lose the rest — the reason is here so
                  the prompt can be corrected rather than re-run blind. */}
              {result.failed.map((row) => (
                <div className="pb-import__row is-bad" key={row.index}>
                  <b>{row.name || `Playbook ${row.index + 1}`}</b>
                  <em>{row.error}</em>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : reading ? (
        /* The PRD being read. Same panel language as the import run and the Zai
           draft, so the three long operations in this product look alike. */
        <div className="pb-import__running">
          <div className="pb-import__runhead">
            <div className="pb-import__runspin">
              <Sparkles size={19} />
            </div>
            <div className="pb-import__runtext">
              <div className="pb-import__runtitle">
                Reading {docSource === "hub" ? hubFiles.find((f) => f.value === hubFileId)?.label ?? "the page" : doc?.name}
              </div>
              <div className="pb-import__runsub">
                {steps.find((s) => s.state === "active")?.label
                  ? `Writing “${steps.find((s) => s.state === "active")?.label}”`
                  : "Planning what is testable in it"}
              </div>
            </div>
            <div className="pb-import__runpct">{readPercent}%</div>
          </div>

          <div className="pb-zai__track">
            <span className="pb-zai__trackfill" style={{ width: `${readPercent}%` }} />
          </div>

          <ol className="pb-import__stages">
            {steps.map((step, i) => (
              <li key={`${step.label}-${i}`} className={`pb-import__stage is-${step.state}`}>
                <span className="pb-import__stageicon">
                  {step.state === "done" ? (
                    <Check size={13} />
                  ) : step.state === "failed" ? (
                    <AlertCircle size={13} />
                  ) : i === 0 ? (
                    <FileText size={13} />
                  ) : (
                    <BookOpen size={13} />
                  )}
                </span>
                <span className="pb-import__stagetext">
                  <b>{step.label}</b>
                  <em>{step.hint}</em>
                  {step.state === "active" && (
                    <span className="pb-zai__stagelines">
                      <span style={{ width: "86%" }} />
                      <span style={{ width: "60%" }} />
                    </span>
                  )}
                </span>
                {step.state === "active" && <span className="pb-zai__stagedots" aria-hidden />}
              </li>
            ))}
          </ol>

          <p className="pb-import__runfoot">
            Nothing is created yet — you will review what Zai wrote before importing it.
          </p>
        </div>
      ) : (
        <div className="pb-import">
          {/* Two ways in: JSON someone already has, or a requirements document
              Zai reads into playbooks. */}
          {/* Describe first: it is the shortest path from "I have a feature" to
              playbooks, and needs nothing prepared beforehand. */}
          <div className="pb-seg pb-import__tabs" role="group" aria-label="Source">
            <button
              type="button"
              className={`pb-seg__btn ${tab === "describe" ? "is-on" : ""}`}
              onClick={() => setTab("describe")}
            >
              <PenLine size={13} />
              Type it
            </button>
            <button
              type="button"
              className={`pb-seg__btn ${tab === "document" ? "is-on" : ""}`}
              onClick={() => setTab("document")}
            >
              <FileText size={13} />
              From a document
            </button>
            <button
              type="button"
              className={`pb-seg__btn ${tab === "paste" ? "is-on" : ""}`}
              onClick={() => setTab("paste")}
            >
              <ClipboardPaste size={13} />
              Paste JSON
            </button>
          </div>

          {tab === "describe" ? (
            <>
              <label className="pb-ask__field">
                <span className="pb-ask__label">
                  <PenLine size={13} />
                  What are you testing?
                  <em>required</em>
                </span>
                <textarea
                  className="pb-import__brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={"e.g. I have user management — create, edit and delete users.\nFields: name, age, email, phone. Admins can bulk-import from CSV."}
                  maxLength={4000}
                  spellCheck={false}
                />
                <span className="pb-ask__help">
                  The fields, the rules and who can do what. Zai writes the playbooks from
                  this, and asks the questions your description leaves open rather than
                  assuming answers.
                </span>
              </label>

              <div className="pb-ask__suggest">
                <span className="pb-ask__suggestlabel">Try</span>
                {BRIEF_STARTERS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    className="pb-ask__chip"
                    onClick={() => setBrief(starter.text)}
                  >
                    {starter.label}
                  </button>
                ))}
              </div>

              <PlaybookCountPicker value={maxPlaybooks} onChange={setMaxPlaybooks} />

              <Button
                type="primary"
                className="pb-btn"
                icon={<Sparkles size={14} />}
                disabled={brief.trim().length < 15}
                onClick={readDocument}
              >
                Generate playbooks
              </Button>
            </>
          ) : tab === "document" ? (
            <>
              {/* Two sources, one job: a file off this machine, or a page that
                  is already in Document Hub. */}
              <div className="pb-seg pb-import__tabs" role="group" aria-label="Document source">
                <button
                  type="button"
                  className={`pb-seg__btn ${docSource === "upload" ? "is-on" : ""}`}
                  onClick={() => setDocSource("upload")}
                >
                  <FileUp size={13} />
                  Upload from system
                </button>
                <button
                  type="button"
                  className={`pb-seg__btn ${docSource === "hub" ? "is-on" : ""}`}
                  onClick={() => setDocSource("hub")}
                >
                  <Library size={13} />
                  Document Hub
                </button>
              </div>

              {docSource === "hub" ? (
                <div className="pb-import__hub">
                  <label className="pb-ask__field">
                    <span className="pb-ask__label">
                      <Library size={13} />
                      Hub
                    </span>
                    <SearchableDropdown
                      value={hubId}
                      onChange={(value: string) => {
                        setHubId(value || null);
                        setHubFileId(null);
                      }}
                      options={(hubs ?? []).map((row: any) => ({
                        value: row.id,
                        label: row.name,
                        description: row.project?.name || undefined,
                      }))}
                      loading={loadingHubs}
                      placeholder="Choose a hub"
                      searchPlaceholder="Search hubs"
                    />
                  </label>

                  <label className="pb-ask__field">
                    <span className="pb-ask__label">
                      <FileText size={13} />
                      Page
                      <em>required</em>
                    </span>
                    <SearchableDropdown
                      value={hubFileId}
                      onChange={(value: string) => setHubFileId(value || null)}
                      options={hubFiles}
                      loading={loadingHub}
                      disabled={!hubId}
                      placeholder={hubId ? "Choose a page to read" : "Choose a hub first"}
                      searchPlaceholder="Search pages"
                    />
                    <span className="pb-ask__help">
                      {hubId && !loadingHub && hubFiles.length === 0
                        ? "This hub has no pages yet — only pages can be read, not sections or folders."
                        : "Only pages are listed. Sections and folders hold no content to read."}
                    </span>
                  </label>
                </div>
              ) : (
              <>
              <div
                className={`pb-import__drop ${doc ? "is-set" : ""}`}
                onClick={() => docRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) setDoc(file);
                }}
              >
                <span className="pb-import__dropicon">
                  <FileText size={20} />
                </span>
                {doc ? (
                  <>
                    <b>{doc.name}</b>
                    <em>{(doc.size / 1024).toFixed(0)} KB · click to choose another</em>
                    <button
                      type="button"
                      className="pb-import__dropclear"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDoc(null);
                      }}
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <b>Drop a PRD here, or click to choose</b>
                    <em>PDF, Word, Markdown or text — up to 15 MB</em>
                  </>
                )}
              </div>
              <input
                ref={docRef}
                type="file"
                accept=".pdf,.docx,.doc,.md,.markdown,.txt,application/pdf,text/plain,text/markdown"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setDoc(file);
                  e.target.value = "";
                }}
              />
              </>
              )}

              {/* Everything below is optional, and says so once rather than
                  hedging every field with "optional". */}
              <div className="pb-import__optional">
                <div className="pb-import__optionalhead">
                  <SlidersHorizontal size={13} />
                  Fine-tune
                  <span>optional</span>
                </div>

                <label className="pb-ask__field">
                  <span className="pb-ask__label">
                    <Target size={13} />
                    What should Zai focus on?
                  </span>
                  <input
                    className="pb-ask__input ant-input"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="e.g. only the checkout and refund flows"
                    maxLength={400}
                  />
                  <span className="pb-ask__help">
                    Narrows a long document to the part you are about to test. Leave it
                    empty and Zai covers whatever it finds.
                  </span>
                </label>

                <PlaybookCountPicker value={maxPlaybooks} onChange={setMaxPlaybooks} />
              </div>

              <Button
                type="primary"
                className="pb-btn"
                icon={<Sparkles size={14} />}
                disabled={docSource === "hub" ? !hubFileId : !doc}
                onClick={readDocument}
              >
                Read the document
              </Button>
            </>
          ) : (
          <>
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
                if (file) readFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <textarea
            className="pb-import__box"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'{\n  "playbooks": [\n    { "category": "Authentication", "name": "Login", … }\n  ]\n}'}
            spellCheck={false}
          />

          {rejected && rejected.length > 0 && (
            <div className="pb-import__rejected">
              <h4>
                <AlertCircle size={13} /> The API refused these fields
              </h4>
              {rejected.map((detail, i) => (
                <div className="pb-import__reject" key={i}>
                  <code>{detail.path}</code>
                  <span>{detail.message}</span>
                </div>
              ))}
            </div>
          )}

          {parsed.error ? (
            <div className="pb-import__error">
              <AlertCircle size={14} />
              {parsed.error}
            </div>
          ) : totals.playbooks > 0 ? (
            <>
              <div className="pb-import__totals">
                <span>
                  <b>{totals.categories}</b> categor{totals.categories === 1 ? "y" : "ies"}
                </span>
                <i>›</i>
                <span>
                  <b>{totals.playbooks}</b> playbook{totals.playbooks === 1 ? "" : "s"}
                </span>
                <i>›</i>
                <span>
                  <b>{totals.items}</b> recommendation{totals.items === 1 ? "" : "s"}
                </span>
              </div>

              {/* What it will create, before it creates it. */}
              <div className="pb-import__preview">
                {parsed.playbooks.map((playbook, i) => (
                  <div className="pb-import__row" key={i}>
                    <span className="pb-import__cat">{playbook.category || "No category"}</span>
                    <b>{playbook.name || `Playbook ${i + 1}`}</b>
                    <em>
                      <Layers size={11} />
                      {countItems(playbook.sections ?? [])} recommendations ·{" "}
                      {(playbook.sections ?? []).length} sections
                    </em>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="pb-import__hint">
              Download the template from the Playbooks page, paste it into any AI platform
              with the prompt, then bring the answer back here — or upload a PRD and let Zai
              read it.
            </p>
          )}
          </>
          )}
        </div>
      )}
    </Modal>
  );
}
