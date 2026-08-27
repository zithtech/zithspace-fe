"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Upload, DatePicker, Modal, Dropdown, Drawer, App, Tooltip, Popover, Popconfirm } from "antd";
import {
  Target, CheckSquare, FileText, Link2, Monitor, AlertCircle, CheckCircle, CheckCircle2,
  Sparkles, Copy, ChevronDown, Maximize, Zap, Wand2, UploadCloud, File as FileIcon,
  Image as ImageIcon, Trash2, Eye, Download, X, ClipboardList, Paperclip, ShieldCheck,
  ExternalLink, Plus, Check, Save, Layers, ListChecks, Gauge, SpellCheck,
  PenTool, Braces, FileSpreadsheet,
} from "lucide-react";
import { ArrowLeftOutlined, CloseOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { api as axios } from "@/lib/axios";
import dayjs from "dayjs";
import { useActivitySource } from "@/hooks/useActivitySource";
import TiptapViewer from "@/components/common/TiptapViewer";
import DocumentEditor from "@/components/common/DocumentEditor";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { MembersService } from "@/services/membersService";
import { ProjectService } from "@/services/projectService";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import debounce from "lodash/debounce";

const { Dragger } = Upload;

/* Bug sheets and dev tickets are hidden from Linked Items for now. The fields
   and their save paths still work — flip this to bring them back. */
const SHOW_BUG_AND_TICKET_LINKS = false;

/* ────────────────────────────────────────────────────────────────────────────
   Section registry — drives the left rail, the scroll-spy and the progress ring
   ──────────────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "sec-basics", label: "Basic Information", icon: ClipboardList, required: true },
  { id: "sec-product", label: "Product Information", icon: Target },
  { id: "sec-requirements", label: "Requirement References", icon: Link2 },
  { id: "sec-scope", label: "Scope Definition", icon: FileText },
  { id: "sec-testing", label: "Testing Types", icon: CheckSquare },
  { id: "sec-environment", label: "Environment", icon: Monitor },
  { id: "sec-dependencies", label: "Dependencies", icon: AlertCircle },
  { id: "sec-acceptance", label: "Acceptance Criteria", icon: CheckCircle },
  { id: "sec-exit", label: "Exit Criteria", icon: CheckCircle2 },
  { id: "sec-linked", label: "Linked Items", icon: Layers },
  { id: "sec-attachments", label: "Attachments", icon: Paperclip },
  { id: "sec-approval", label: "Approval Workflow", icon: ShieldCheck },
];

const TESTING_TYPES = [
  "Smoke Testing", "Sanity Testing", "Functional Testing", "GUI Testing",
  "UI Testing", "Positive Testing", "Negative Testing", "Validation Testing",
  "Data Verification Testing", "Integration Testing", "System Testing",
  "End-to-End Testing", "Regression Testing", "Retesting", "Exploratory Testing",
  "Compatibility Testing", "Cross-Browser Testing", "User Acceptance Testing",
  "Performance Testing", "Security Testing",
];

type ZaiField = 'inScope' | 'outScope' | 'description';

const ZAI_FIELD_LABEL: Record<ZaiField, string> = {
  inScope: 'Scope Definition',
  outScope: 'Out of Scope',
  description: 'Description',
};

const EXIT_CRITERIA = [
  "All Critical Tests Passed",
  "No Critical Bugs",
  "No High Severity Bugs",
  "Regression Passed",
  "Product Owner Approved",
];

/** Nearest scrollable ancestor, or null when the window scrolls. */
function getScrollParent(node: Element | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

/** Returns the id of the section currently sitting below the sticky header. */
function useScrollSpy(ids: string[], offset: number, root: HTMLElement | null): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { root, rootMargin: `-${Math.round(offset)}px 0px -60% 0px`, threshold: 0 }
    );
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);
    els.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      const scrollHeight = root ? root.scrollHeight : document.documentElement.scrollHeight;
      const clientHeight = root ? root.clientHeight : window.innerHeight;
      const scrollTop = root ? root.scrollTop : window.scrollY;
      if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 2) {
        const lastId = ids[ids.length - 1];
        if (lastId) setActive(lastId);
      }
    };

    const target: any = root ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      target.removeEventListener("scroll", handleScroll);
    };
  }, [key, offset, root]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}

function ImageModal({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-zinc-900/95 px-4 py-2.5">
          <span className="text-sm font-medium text-zinc-200 truncate max-w-[60vw]">{name}</span>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="bg-zinc-950 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={name} className="max-w-[90vw] max-h-[80vh] object-contain" />
        </div>
      </div>
    </div>
  );
}

/* ── Presentational primitives ─────────────────────────────────────────────── */

function SectionCard({
  id, icon: Icon, index, title, description, badge, action, children,
}: {
  id: string;
  icon: React.ElementType;
  index: number;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="ts-card scroll-mt-40">
      <header className="ts-card__head">
        <span className="ts-card__icon"><Icon size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ts-card__step">{String(index).padStart(2, "0")}</span>
            <h3 className="ts-card__title">{title}</h3>
            {badge}
          </div>
          {description ? <p className="ts-card__desc">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2 flex-shrink-0">{action}</div> : null}
      </header>
      <div className="ts-card__body">{children}</div>
    </section>
  );
}

function Field({
  label, required, hint, error, className, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="ts-label">
        {label}
        {required && <span className="ts-req">*</span>}
      </label>
      {children}
      {error ? <p className="ts-error">{error}</p> : hint ? <p className="ts-hint">{hint}</p> : null}
    </div>
  );
}

function Chip({
  active, onClick, onRemove, children,
}: {
  active: boolean;
  onClick: () => void;
  /** Present on user-added entries — removes them from the list entirely. */
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`ts-chip${active ? " ts-chip--on" : ""}${onRemove ? " ts-chip--custom" : ""}`}>
      <button type="button" onClick={onClick} className="ts-chip__main">
        <span className="ts-chip__box">{active ? <Check size={11} strokeWidth={3.5} /> : null}</span>
        <span className="truncate">{children}</span>
      </button>
      {onRemove ? (
        <button
          type="button"
          className="ts-chip__remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove custom entry"
        >
          <X size={11} strokeWidth={2.8} />
        </button>
      ) : null}
    </div>
  );
}

/** Inline "add your own" row revealed from a section header. */
function InlineAdd({
  placeholder, value, onChange, onAdd, onCancel,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="ts-inlineadd">
      <Input
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onAdd}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
        style={{ flex: 1 }}
      />
      <Button type="primary" ghost icon={<Plus size={14} />} onClick={onAdd} disabled={!value.trim()}>Add</Button>
      <Button type="text" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

/** Selected values of a multi-select, shown as removable tokens under the trigger. */
function TokenList({ values, onRemove }: { values: string[]; onRemove: (val: string) => void }) {
  if (!values.length) return null;
  return (
    <div className="ts-tokens">
      {values.map((val) => (
        <span key={val} className="ts-token">
          <span className="truncate">{val}</span>
          <button type="button" onClick={() => onRemove(val)} aria-label={`Remove ${val}`}>
            <X size={11} strokeWidth={2.8} />
          </button>
        </span>
      ))}
    </div>
  );
}

function CountPill({ n, noun }: { n: number; noun: string }) {
  if (!n) return null;
  return <span className="ts-count">{n} {noun}</span>;
}

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-[68px] h-[68px] flex-shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" strokeWidth="5" className="ts-ring__track" />
        <circle
          cx="34" cy="34" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          className="ts-ring__bar"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[15px] font-semibold ts-text">{value}%</span>
      </div>
    </div>
  );
}

function UploadZone({
  label, hint, onChange, fileList, compact,
}: { label: string; hint?: string; onChange: (info: any) => void; fileList: any[]; compact?: boolean }) {
  return (
    <Dragger
      className="custom-upload-dragger"
      fileList={fileList}
      onChange={onChange}
      beforeUpload={() => false}
      multiple
      showUploadList={false}
    >
      {compact ? (
        <div className="ts-drop ts-drop--compact">
          <Plus size={14} />
          <span>Add more files</span>
        </div>
      ) : (
        <div className="ts-drop">
          <span className="ts-drop__icon"><UploadCloud size={18} /></span>
          <div className="text-left">
            <p className="ts-drop__title"><span>Click to upload</span> or drag &amp; drop</p>
            <p className="ts-drop__hint">{hint || `${label} · max 50MB`}</p>
          </div>
        </div>
      )}
    </Dragger>
  );
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const isImageFile = (file: any) =>
  !!(file?.type?.startsWith?.('image/') || /^data:image\//.test(file?.url || file?.thumbUrl || ''));

/** Per-category icon so the bays are scannable at a glance. */
const ATTACHMENT_ICONS: Record<string, React.ElementType> = {
  screenshots: ImageIcon,
  designFiles: PenTool,
  sampleData: Braces,
  excelFiles: FileSpreadsheet,
  pdfs: FileText,
};

/** One upload category: header, dropzone, image tiles and file rows. */
function AttachmentBay({
  field, files, isCustom, onUpload, onRemoveFile, onClear, onRemoveCategory, onPreview,
}: {
  field: { key: string; label: string; hint: string };
  files: any[];
  isCustom: boolean;
  onUpload: (info: any) => void;
  onRemoveFile: (uid: string) => void;
  onClear: () => void;
  onRemoveCategory: () => void;
  onPreview: (src: string, name: string) => void;
}) {
  const Icon = ATTACHMENT_ICONS[field.key] || Paperclip;
  const totalSize = files.reduce((n: number, f: any) => n + (f.size || 0), 0);
  const images = files.filter(f => isImageFile(f) && (f.url || f.thumbUrl));
  const rest = files.filter(f => !images.includes(f));

  return (
    <div className={`ts-bay${files.length ? ' ts-bay--filled' : ''}`}>
      <div className="ts-bay__head">
        <span className="ts-bay__icon"><Icon size={14} /></span>
        <span className="ts-bay__label">{field.label}</span>
        {files.length > 0 ? (
          <span className="ts-bay__meta">{files.length} file{files.length === 1 ? '' : 's'}{totalSize ? ` · ${formatBytes(totalSize)}` : ''}</span>
        ) : (
          <span className="ts-bay__meta ts-bay__meta--empty">Empty</span>
        )}
        <div className="ts-bay__actions">
          {files.length > 0 && (
            <Tooltip title="Remove all files">
              <button type="button" onClick={onClear} aria-label={`Clear ${field.label}`}><Trash2 size={13} /></button>
            </Tooltip>
          )}
          {isCustom && (
            <Tooltip title="Remove this category">
              <button type="button" onClick={onRemoveCategory} aria-label={`Remove ${field.label}`}><X size={13} /></button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="ts-bay__body">
        <UploadZone
          label={field.label}
          hint={field.hint}
          fileList={files}
          onChange={onUpload}
          compact={files.length > 0}
        />

        {images.length > 0 && (
          <div className="ts-thumbs">
            {images.map((file: any) => (
              <div key={file.uid} className="ts-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url || file.thumbUrl} alt={file.name} />
                <div className="ts-thumb__veil">
                  <button type="button" onClick={() => onPreview(file.url || file.thumbUrl, file.name)} aria-label="Preview"><Eye size={14} /></button>
                  <button type="button" onClick={() => onRemoveFile(file.uid)} aria-label="Remove"><Trash2 size={14} /></button>
                </div>
                <span className="ts-thumb__name">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="flex flex-col gap-2">
            {rest.map((file: any) => (
              <FileRow
                key={file.uid}
                file={file}
                thumb={field.key === 'pdfs'
                  ? <FileText size={16} style={{ color: 'var(--ts-red)' }} />
                  : <Icon size={16} />}
                onRemove={() => onRemoveFile(file.uid)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileRow({
  file, thumb, onPreview, onRemove,
}: { file: any; thumb?: React.ReactNode; onPreview?: () => void; onRemove: () => void }) {
  return (
    <div className="ts-file">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="ts-file__thumb">{thumb}</div>
        <div className="flex flex-col min-w-0">
          <span className="ts-file__name">{file.name}</span>
          <div className="flex items-center gap-2 ts-file__meta">
            {file.size ? <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span> : null}
            {file.status === 'uploading' ? <span className="ts-file__state">Uploading…</span> : <span className="ts-file__ready">Ready</span>}
          </div>
        </div>
      </div>
      <div className="ts-file__actions">
        {onPreview ? (
          <Tooltip title="Preview"><Button type="text" size="small" icon={<Eye size={15} />} onClick={onPreview} /></Tooltip>
        ) : null}
        <Tooltip title="Download">
          <Button
            type="text"
            size="small"
            icon={<Download size={15} />}
            onClick={() => {
              if (file.url) {
                const a = document.createElement('a');
                a.href = file.url;
                a.download = file.name;
                a.click();
              }
            }}
          />
        </Tooltip>
        <Tooltip title="Remove"><Button type="text" danger size="small" icon={<Trash2 size={15} />} onClick={onRemove} /></Tooltip>
      </div>
    </div>
  );
}

export interface ScopeDocEditorRef {
  /** Insert an HTML fragment after the current cursor block (used by ZAI). */
  insertHtmlAtCursor: (html: string) => Promise<void>;
}

/**
 * Scope editor built on the same BlockNote instance the Document Hub uses —
 * slash commands, drag handles, nested blocks and the inline Zai rewrite menu.
 * Used both inline in the Scope Definition card and full-height in the Expand drawer.
 *
 * The scope stores In/Out Scope as HTML (rendered by TiptapViewer on the detail
 * page and in the PDF export), so this bridges at the boundary: HTML → blocks on
 * mount, debounced blocks → HTML on change. Content is seeded once per mount, so
 * external writes (ZAI replace/append) remount the editor via a changing `key`.
 */
const ScopeDocEditor = React.forwardRef<ScopeDocEditorRef, {
  html: string;
  onChangeHtml: (html: string) => void;
  /** Fixed height for inline use; omit to fill the parent (drawer). */
  height?: number;
}>(({ html, onChangeHtml, height }, ref) => {
  const editor = useCreateBlockNote();
  const [ready, setReady] = useState(false);
  const seededRef = useRef(false);
  const onChangeRef = useRef(onChangeHtml);
  onChangeRef.current = onChangeHtml;

  // Push edits back out as HTML, debounced so we don't serialise on every keypress.
  const flush = useMemo(
    () =>
      debounce(async (ed: any) => {
        try {
          const out = await ed.blocksToHTMLLossy(ed.document);
          onChangeRef.current(out);
        } catch (err) {
          console.error('Failed to serialise scope content:', err);
        }
      }, 400),
    []
  );

  // Seed the editor from the stored HTML — once, on mount.
  // Note: no cancellation flag here. Strict Mode double-invokes effects, and
  // gating setReady on a flag the first cleanup flips leaves the overlay stuck
  // forever, since the second pass short-circuits on `seededRef`.
  useEffect(() => {
    if (!editor) return;
    if (seededRef.current) { setReady(true); return; }
    seededRef.current = true;
    (async () => {
      try {
        const source = (html || '').trim();
        if (source) {
          const blocks = await editor.tryParseHTMLToBlocks(source);
          if (blocks.length) editor.replaceBlocks(editor.document, blocks as any);
        }
      } catch (err) {
        console.error('Failed to load scope content into the editor:', err);
      } finally {
        setReady(true);
      }
    })();
  }, [editor, html]);

  useEffect(() => () => { flush.flush(); }, [flush]);

  React.useImperativeHandle(ref, () => ({
    insertHtmlAtCursor: async (fragment: string) => {
      if (!editor || !fragment?.trim()) return;
      try {
        const blocks = await editor.tryParseHTMLToBlocks(fragment);
        if (!blocks.length) return;
        const anchor = editor.getTextCursorPosition()?.block ?? editor.document[editor.document.length - 1];
        editor.insertBlocks(blocks as any, anchor, 'after');
        flush(editor);
      } catch (err) {
        console.error('Failed to insert content at cursor:', err);
      }
    },
  }), [editor, flush]);

  const rewriteViaScopeApi = React.useCallback(
    async ({ text, instruction }: { text: string; instruction: string }) => {
      const res: any = await axios.post('/api/v2/qa/test-scopes/ai-rewrite', { text, instruction });
      const payload = res?.data?.data ?? res?.data ?? res;
      return { rewrittenHtml: payload?.rewrittenHtml || '' };
    },
    []
  );

  return (
    <div
      className={`ts-docsurface${height ? ' ts-docsurface--inline' : ''}`}
      style={height ? { height } : undefined}
    >
      {!ready && <div className="ts-docsurface__loading"><ZukvoLoader size="sm" message="Preparing editor…" /></div>}
      <DocumentEditor
        editor={editor}
        viewMode="edit"
        bare
        onChange={() => { if (ready) flush(editor); }}
        onAiRewrite={rewriteViaScopeApi}
      />
    </div>
  );
});
ScopeDocEditor.displayName = 'ScopeDocEditor';

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function EditScopePage() {
  const { message } = App.useApp();
  useActivitySource({ section: "WORK", module: "QA", page: "EditTestScope" });

  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { canUpdateScope } = usePermission();
  const { user, isLoading } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_qa_space_scope_prime');

  /** Flips once the saved scope has been merged into the form. */
  const [dataLoaded, setDataLoaded] = useState(false);

  const [generatingInScope, setGeneratingInScope] = useState(false);
  const [generatingOutScope, setGeneratingOutScope] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [polishingDescription, setPolishingDescription] = useState(false);
  const [isZaiModalVisible, setIsZaiModalVisible] = useState(false);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiTargetField, setZaiTargetField] = useState<ZaiField | null>(null);
  const [zaiAction, setZaiAction] = useState<'generate' | 'optimize' | 'enhance'>('generate');
  const [zaiView, setZaiView] = useState<'prompt' | 'preview'>('prompt');
  const [zaiGeneratedContent, setZaiGeneratedContent] = useState('');
  /** Whether this run should read the linked PRD, or draft from context alone. */
  const [zaiUsePrd, setZaiUsePrd] = useState(false);
  const [prdPopoverOpen, setPrdPopoverOpen] = useState(false);
  /** Optional steering text for the PRD run — the PRD itself is the brief. */
  const [prdContext, setPrdContext] = useState('');

  const [isExpandDrawerVisible, setIsExpandDrawerVisible] = useState(false);
  const [previewImg, setPreviewImg] = useState<{ src: string; name: string } | null>(null);

  const inScopeRef = React.useRef<ScopeDocEditorRef>(null);
  /**
   * Bumped whenever content is written from outside the editor (ZAI apply, or a
   * drawer session ending) so the inline editor remounts and reseeds from state.
   */
  const [paneVersion, setPaneVersion] = useState(0);
  const bumpPane = () => setPaneVersion(v => v + 1);

  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingDevTickets, setLoadingDevTickets] = useState(false);
  const [devTickets, setDevTickets] = useState<any[]>([]);
  const [loadingBugSheets, setLoadingBugSheets] = useState(false);
  const [bugSheets, setBugSheets] = useState<any[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [testCases, setTestCases] = useState<any[]>([]);
  /** Every suite and run in the workspace — the scope links to these, not URLs. */
  const [testSuites, setTestSuites] = useState<any[]>([]);
  const [loadingTestSuites, setLoadingTestSuites] = useState(false);
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [loadingTestRuns, setLoadingTestRuns] = useState(false);
  /** Document Hub documents, for pointing the PRD reference at a real doc. */
  const [prdMode, setPrdMode] = useState<'document' | 'link'>('document');
  const [hubDocs, setHubDocs] = useState<any[]>([]);
  const [loadingHubDocs, setLoadingHubDocs] = useState(false);

  const [positionsList, setPositionsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [newDepName, setNewDepName] = useState('');
  const [newDepStatus, setNewDepStatus] = useState('pending');
  const [newAcInput, setNewAcInput] = useState('');
  const [scopeSettings, setScopeSettings] = useState<any[]>([]);

  // User-added entries for the fixed option lists, kept per session
  const [customTestingTypes, setCustomTestingTypes] = useState<string[]>([]);
  const [customExitCriteria, setCustomExitCriteria] = useState<string[]>([]);
  const [customAttachmentFields, setCustomAttachmentFields] = useState<{ key: string; label: string; hint: string }[]>([]);
  const [addingKind, setAddingKind] = useState<'testing' | 'exit' | 'attachment' | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Sticky chrome measurement + scroll-spy wiring
  const stickyRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<any>(null);
  const [stickyH, setStickyH] = useState(112);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const activeSection = useScrollSpy(SECTIONS.map(s => s.id), stickyH + 8, scrollRoot);

  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'Feature Release',
    priority: 'Medium',
    status: 'Draft',
    qa_owner: '',
    start_date: null,
    end_date: null,
    details: {
      description: '',
      reviewer: '',
      product: 'Zukvo',
      modules: [],
      features: [],
      sprint: undefined,
      releaseVersion: '',
      reqReferences: {
        prd: '',
        figma: '',
        apiDoc: '',
        userStory: '',
        epic: '',
        devTicket: '',
        additionalDocs: []
      },
      inScope: '',
      outScope: '',
      testingTypes: [],
      environment: {
        type: undefined,
        buildVersion: '',
        apiVersion: '',
        database: undefined,
        browser: [],
        os: [],
        device: []
      },
      dependencies: [],
      acceptanceCriteria: [],
      exitCriteria: [],
      linkedItems: {
        testSuites: [],
        testRuns: [],
        testCases: { name: '', link: '' },
        bugSheets: { name: '', link: '' },
        devTickets: [],
        sprints: { name: '', link: '' },
        custom: []
      },
      attachments: {
        screenshots: [],
        designFiles: [],
        sampleData: [],
        excelFiles: [],
        pdfs: []
      },
      approvalWorkflow: { position: undefined, user: undefined, status: 'pending' }
    }
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isCorrectingAcGrammar, setIsCorrectingAcGrammar] = useState(false);
  const firstRender = useRef(true);
  const skipDirtyRef = useRef(false);
  const saveRef = useRef<() => void>(() => { });

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (skipDirtyRef.current) { skipDirtyRef.current = false; return; }
    setIsDirty(true);
  }, [formData]);

  /* Editing an existing scope: owner, reviewer and product all come from the
     saved record, so none of the create-time defaults apply here. */

  // Warn before losing unsaved edits
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ⌘/Ctrl + S saves
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    setScrollRoot(getScrollParent(el));
    const update = () => setStickyH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // dataLoaded is a dep because the header only mounts once the scope is in
  }, [isLoading, canUpdateScope, dataLoaded]);

  useEffect(() => {
    if (!isLoading && canUpdateScope && id) {
      fetchSprintsSearch("");
      fetchDevTicketsSearch("");
      fetchBugSheetsSearch("");
      fetchPositionsAndUsers();
      fetchScopeSettings();
      fetchUserProjects();
      fetchScopeData();
    }
  }, [isLoading, canUpdateScope, id]);

  /**
   * Load the saved scope and merge it over the empty shape, so any key the
   * record predates (a newer nested field) still has its default.
   */
  const fetchScopeData = async () => {
    try {
      const res: any = await axios.get(`/api/v2/qa/test-scopes/${id}`);
      const data = res?.data?.data || res?.data || res;
      if (!data) return;

      let detailsObj: any = {};
      try {
        detailsObj = typeof data.details === 'string'
          ? (data.details ? JSON.parse(data.details) : {})
          : (data.details || {});
      } catch {
        detailsObj = {};
      }

      skipDirtyRef.current = true;
      setFormData((prev: any) => ({
        ...prev,
        ...data,
        start_date: data.start_date ? dayjs(data.start_date) : null,
        end_date: data.end_date ? dayjs(data.end_date) : null,
        details: {
          ...prev.details,
          ...detailsObj,
          reqReferences: { ...prev.details?.reqReferences, ...(detailsObj.reqReferences || {}) },
          environment: { ...prev.details?.environment, ...(detailsObj.environment || {}) },
          linkedItems: { ...prev.details?.linkedItems, ...(detailsObj.linkedItems || {}) },
          attachments: { ...prev.details?.attachments, ...(detailsObj.attachments || {}) },
          approvalWorkflow: { ...prev.details?.approvalWorkflow, ...(detailsObj.approvalWorkflow || {}) },
        },
      }));
      // Values saved from a previous session that aren't in the built-in lists
      // must reappear as chips/bays, otherwise editing would silently drop them.
      const savedTypes: string[] = detailsObj.testingTypes || [];
      setCustomTestingTypes(savedTypes.filter(t => !TESTING_TYPES.includes(t)));

      const savedExit: string[] = detailsObj.exitCriteria || [];
      setCustomExitCriteria(savedExit.filter(c => !EXIT_CRITERIA.includes(c)));

      const builtInBays = ['screenshots', 'designFiles', 'sampleData', 'excelFiles', 'pdfs'];
      setCustomAttachmentFields(
        Object.keys(detailsObj.attachments || {})
          .filter(k => !builtInBays.includes(k))
          .map(k => ({ key: k, label: k, hint: 'max 50MB' }))
      );

      // Reseed the rich-text editor with the loaded scope definition
      bumpPane();
    } catch (e: any) {
      console.error("Failed to load scope:", e);
      message.error("Failed to load scope data");
    } finally {
      setDataLoaded(true);
    }
  };

  /**
   * Active projects the signed-in user belongs to (PM or member; managers see all).
   * The scope stores the project *name*, so options are keyed by label.
   */
  const fetchUserProjects = async () => {
    try {
      setLoadingProjects(true);
      const res: any = await ProjectService.getUserProjects();
      const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      const opts = list
        .map((p: any) => ({
          value: String(p.label ?? p.name ?? ''),
          label: String(p.label ?? p.name ?? ''),
          description: p.code || undefined,
        }))
        .filter(o => o.value);
      setProjectOptions(opts);
    } catch (err) {
      // No project access (or none assigned) — the field falls back to free text.
      console.error("Failed to fetch user projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchScopeSettings = async () => {
    try {
      const res = await axios.get('/api/v2/qa/test-scopes/settings');
      let data: any[] = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.data?.data)) data = res.data.data;
      setScopeSettings(data);
    } catch (err) {
      // Silently fall back to empty
    }
  };

  const fetchPositionsAndUsers = async () => {
    try {
      const posRes: any = await axios.get('/api/positions');
      setPositionsList(posRes.data || posRes || []);

      const membersRes = await MembersService.getMembers({ limit: 500 });
      setUsersList(membersRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Dynamic Search Handlers ---
  const fetchSprintsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingSprints(true);
        const res: any = await axios.get("/api/release-plans", { params: { search, limit: 10, project_id: formData.details.product || undefined } });
        const fetchedSprints = Array.isArray(res) ? res : (res.data || []);
        setSprints(fetchedSprints);
      } catch (err) {
        console.error("Failed to fetch sprints:", err);
      } finally {
        setLoadingSprints(false);
      }
    }, 400),
    [formData.details.product]
  );

  const fetchDevTicketsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingDevTickets(true);
        const res: any = await axios.get("/api/tickets", { params: { search, limit: 10 } });
        const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        setDevTickets(data);
      } catch (err) {
        console.error("Failed to fetch dev tickets:", err);
      } finally {
        setLoadingDevTickets(false);
      }
    }, 400),
    [formData.details.product]
  );

  const fetchBugSheetsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingBugSheets(true);
        const res: any = await axios.get("/api/bug-list/sheets/all", { params: { search, limit: 10 } });
        const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        setBugSheets(data);
      } catch (err) {
        console.error("Failed to fetch bug sheets:", err);
      } finally {
        setLoadingBugSheets(false);
      }
    }, 400),
    [formData.details.product]
  );

  // The tenant's module list, offered on the Product & Modules step.
  const [qaModules, setQaModules] = useState<any[]>([]);
  useEffect(() => {
    axios.get('/api/v2/qa/modules')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        setQaModules(Array.isArray(list) ? list : []);
      })
      .catch(() => { /* typing a module still works without the list */ });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingTestSuites(true);
        setLoadingTestRuns(true);
        setLoadingHubDocs(true);
        setLoadingTestCases(true);
        const [suiteRes, runRes, docRes, parentRes]: any[] = await Promise.all([
          axios.get('/api/v2/qa/suites/all?limit=1000' + (formData.details.product ? `&project_id=${encodeURIComponent(formData.details.product)}` : '')),
          axios.get('/api/v2/qa/runs/all?limit=1000' + (formData.details.product ? `&project_id=${encodeURIComponent(formData.details.product)}` : '')),
          axios.get('/api/v2/qa/test-scopes/documents?limit=1000'),
          // Parent cases (modules/scenarios) only — child cases are linked
          // through their parent, not scoped individually.
          axios.get('/api/v2/qa/parents?limit=1000' + (formData.details.product ? `&project_id=${encodeURIComponent(formData.details.product)}` : '')),
        ]);
        const unwrap = (r: any) => (Array.isArray(r) ? r : (r?.data?.data || r?.data || []));
        setTestSuites(unwrap(suiteRes));
        setTestRuns(unwrap(runRes));
        setHubDocs(unwrap(docRes));
        setTestCases(unwrap(parentRes));
      } catch (err) {
        console.error('Failed to fetch test suites and runs:', err);
      } finally {
        setLoadingTestSuites(false);
        setLoadingTestRuns(false);
        setLoadingHubDocs(false);
        setLoadingTestCases(false);
      }
    })();
  }, [formData.details.product]);

  const fetchTestCasesSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingTestCases(true);
        // Parent test cases only — the children belonging to a parent are
        // covered by linking the parent, so they are never listed here.
        const res: any = await axios.get('/api/v2/qa/parents', {
          params: search ? { search } : undefined,
        });
        setTestCases(Array.isArray(res) ? res : (res?.data?.data || res?.data || []));
      } catch (err) {
        console.error("Failed to fetch parent test cases:", err);
      } finally {
        setLoadingTestCases(false);
      }
    }, 400),
    [formData.details.product]
  );

  const fetchTestSuitesSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingTestSuites(true);
        const res: any = await axios.get('/api/v2/qa/suites/all', {
          params: search ? { search, limit: 50 } : { limit: 1000 },
        });
        setTestSuites(Array.isArray(res) ? res : (res?.data?.data || res?.data || []));
      } catch (err) {
        console.error("Failed to fetch test suites:", err);
      } finally {
        setLoadingTestSuites(false);
      }
    }, 400),
    [formData.details.product]
  );

  const fetchTestRunsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingTestRuns(true);
        const res: any = await axios.get('/api/v2/qa/runs/all', {
          params: search ? { search, limit: 50 } : { limit: 1000 },
        });
        setTestRuns(Array.isArray(res) ? res : (res?.data?.data || res?.data || []));
      } catch (err) {
        console.error("Failed to fetch test runs:", err);
      } finally {
        setLoadingTestRuns(false);
      }
    }, 400),
    [formData.details.product]
  );

  const d = formData.details;

  // Which sections are "filled in" — powers the rail ticks and the progress ring
  const completion = useMemo(() => {
    const hasHtml = (html?: string) => !!(html || '').replace(/<[^>]*>/g, '').trim();
    const li = d.linkedItems || {};
    const att = d.attachments || {};
    const refs = d.reqReferences || {};
    return {
      "sec-basics": !!formData.name?.trim() && !!formData.status,
      "sec-product": !!d.product && (d.modules?.length > 0),
      "sec-requirements": !!(refs.prd || refs.figma || refs.apiDoc || refs.userStory || refs.epic || (Array.isArray(refs.devTicket) ? refs.devTicket.length : refs.devTicket) || refs.additionalDocs?.length),
      "sec-scope": hasHtml(d.inScope),
      "sec-testing": (d.testingTypes?.length || 0) > 0,
      "sec-environment": !!d.environment?.type,
      "sec-dependencies": (d.dependencies?.length || 0) > 0,
      "sec-acceptance": (d.acceptanceCriteria?.length || 0) > 0,
      "sec-exit": (d.exitCriteria?.length || 0) > 0,
      "sec-linked": !!(li.bugSheets?.link || li.devTickets?.length || li.sprints?.link || li.testCases?.link || (Array.isArray(li.testSuites) ? li.testSuites.length : li.testSuites?.name) || (Array.isArray(li.testRuns) ? li.testRuns.length : li.testRuns?.name) || li.custom?.length),
      "sec-attachments": Object.values(att).some((v: any) => Array.isArray(v) && v.length > 0),
      "sec-approval": !!d.approvalWorkflow?.user,
    } as Record<string, boolean>;
  }, [formData, d]);

  const doneCount = Object.values(completion).filter(Boolean).length;
  const progress = Math.round((doneCount / SECTIONS.length) * 100);

  if (isLoading) return null;
  if (!canUpdateScope) return <div className="p-10 text-center text-slate-500">Unauthorized</div>;
  if (!dataLoaded) {
    return (
      <MainLayout>
        <ZukvoLoader size="lg" fullscreen message="Loading the scope…" />
      </MainLayout>
    );
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const root = scrollRoot;
    if (root) {
      const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - stickyH - 16;
      root.scrollTo({ top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: el.offsetTop - stickyH - 16, behavior: 'smooth' });
    }
  };

  const updateRoot = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
  };

  const updateDetail = (field: string, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      details: { ...prev.details, [field]: val }
    }));
  };

  const handleCorrectAcGrammar = async () => {
    const criteria = formData.details.acceptanceCriteria || [];
    if (criteria.length === 0) return;
    
    setIsCorrectingAcGrammar(true);
    try {
      const combinedText = criteria.map((c: any, i: number) => `${i + 1}. ${typeof c === 'string' ? c : c.text}`).join('\n');
      const res: any = await axios.post('/api/v2/qa/test-scopes/enhance-text', { text: combinedText });
      
      const correctedText = typeof res === 'string' ? res : (res?.text || res?.data?.text || res?.data?.data?.text);
      
      if (correctedText) {
        const lines = correctedText.split('\n');
        const updatedCriteria = lines
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean);
        
        updateDetail('acceptanceCriteria', updatedCriteria);
        message.success('Grammar corrected successfully');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to correct grammar');
    } finally {
      setIsCorrectingAcGrammar(false);
    }
  };

  const toggleInArray = (field: string, val: string) => {
    const current: string[] = formData.details[field] || [];
    updateDetail(field, current.includes(val) ? current.filter(v => v !== val) : [...current, val]);
  };

  const openCustomAdd = (kind: 'testing' | 'exit' | 'attachment') => {
    setAddingKind(prev => (prev === kind ? null : kind));
    setCustomDraft('');
  };

  const cancelCustomAdd = () => { setAddingKind(null); setCustomDraft(''); };

  /** Add a custom option to a chip list and select it straight away. */
  const commitCustomChip = (kind: 'testing' | 'exit') => {
    const label = customDraft.trim();
    if (!label) return;

    const isTesting = kind === 'testing';
    const base = isTesting ? TESTING_TYPES : EXIT_CRITERIA;
    const custom = isTesting ? customTestingTypes : customExitCriteria;
    const field = isTesting ? 'testingTypes' : 'exitCriteria';
    const existing = [...base, ...custom].find(v => v.toLowerCase() === label.toLowerCase());

    if (existing) {
      const selected: string[] = formData.details[field] || [];
      if (!selected.includes(existing)) updateDetail(field, [...selected, existing]);
      message.info(`"${existing}" is already in the list — selected it for you.`);
    } else {
      if (isTesting) setCustomTestingTypes(prev => [...prev, label]);
      else setCustomExitCriteria(prev => [...prev, label]);
      updateDetail(field, [...(formData.details[field] || []), label]);
    }
    setCustomDraft('');
  };

  /** Drop a custom option from the list and from the current selection. */
  const removeCustomChip = (kind: 'testing' | 'exit', label: string) => {
    const isTesting = kind === 'testing';
    const field = isTesting ? 'testingTypes' : 'exitCriteria';
    if (isTesting) setCustomTestingTypes(prev => prev.filter(v => v !== label));
    else setCustomExitCriteria(prev => prev.filter(v => v !== label));
    updateDetail(field, (formData.details[field] || []).filter((v: string) => v !== label));
  };

  const commitCustomAttachment = () => {
    const label = customDraft.trim();
    if (!label) return;
    const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
    const taken = [...attachmentFields, ...customAttachmentFields].some(
      f => f.key === key || f.label.toLowerCase() === label.toLowerCase()
    );
    if (taken) {
      message.info(`"${label}" already has an upload area.`);
      return;
    }
    setCustomAttachmentFields(prev => [...prev, { key, label, hint: 'Custom category · max 50MB' }]);
    setCustomDraft('');
  };

  /** Remove a custom upload area along with anything uploaded into it. */
  const removeCustomAttachment = (key: string) => {
    setCustomAttachmentFields(prev => prev.filter(f => f.key !== key));
    setFormData((prev: any) => {
      const next = { ...(prev.details.attachments || {}) };
      delete next[key];
      return { ...prev, details: { ...prev.details, attachments: next } };
    });
  };

  const handleExpandContent = () => {
    setIsExpandDrawerVisible(true);
  };

  /** Close the drawer and remount the inline editor so it reseeds from the edits. */
  const closeExpandDrawer = () => {
    bumpPane();
    setIsExpandDrawerVisible(false);
  };

  // ── ZAI helpers (defined AFTER updateDetail so the closure is live) ──────────

  /**
   * Zai can only read a PRD that lives in the Document Hub — a pasted link is
   * just a URL the server has no way to open. So every "using PRD" affordance
   * keys off the document id, not off the PRD field being non-empty.
   */
  const prdDocumentId = formData.details.reqReferences?.prdDocumentId || '';
  const prdDocumentTitle = formData.details.reqReferences?.prdDocumentTitle || '';

  const setZaiGenerating = (field: ZaiField, busy: boolean) => {
    if (field === 'inScope') setGeneratingInScope(busy);
    else if (field === 'outScope') setGeneratingOutScope(busy);
    else setGeneratingDescription(busy);
  };

  const isZaiGenerating = (field: ZaiField | null) =>
    field === 'inScope' ? generatingInScope
      : field === 'outScope' ? generatingOutScope
      : field === 'description' ? generatingDescription
        : false;

  const handleGenerateScopeWithAI = (
    field: ZaiField,
    action: 'generate' | 'optimize' | 'enhance' = 'generate',
    /* Callers that offer a plain and a PRD-backed action pass this explicitly;
       everyone else keeps the old behaviour of using the PRD when there is one. */
    usePrd: boolean = !!prdDocumentId,
  ) => {
    setZaiTargetField(field);
    setZaiAction(action);
    setZaiPrompt("");
    setZaiView('prompt');
    setZaiGeneratedContent("");
    setZaiUsePrd(usePrd && !!prdDocumentId);
    setIsZaiModalVisible(true);
  };

  /**
   * The one call that talks to Zai. Both entry points land here: the full modal
   * (prompt → preview) and the PRD popover, which skips the prompt step and
   * drops the user straight into the preview with the result.
   */
  const runZaiGeneration = async (opts: {
    field: ZaiField;
    action: 'generate' | 'optimize' | 'enhance';
    usePrd: boolean;
    prompt: string;
  }) => {
    const { field, action, usePrd, prompt } = opts;
    setZaiGenerating(field, true);

    try {
      let existingContent = '';
      if (field === 'inScope') existingContent = formData.details.inScope || '';
      else if (field === 'outScope') existingContent = formData.details.outScope || '';
      else if (field === 'description') existingContent = formData.details.description || '';

      const payload = {
        field,
        action,
        existingContent,
        scopeName: formData.name,
        projectOverview: formData.details.projectOverview || formData.details.description,
        modules: formData.details.modules,
        testingTypes: formData.details.testingTypes,
        userPrompt: prompt,
        // When a PRD document is linked, the server reads it and drafts from
        // its wording rather than from the thin context fields alone. Sent only
        // when this run asked for it, so "Create with ZAI" and "Create with Zai
        // using PRD" are genuinely different actions rather than the same call.
        prdDocumentId: usePrd ? prdDocumentId || undefined : undefined,
      };
      const res = await axios.post('/api/v2/qa/test-scopes/generate-ai', payload);

      let htmlContent = '';
      let isSuccess = false;

      if (typeof res === 'string') {
        htmlContent = res;
        isSuccess = true;
      } else if (res && typeof res === 'object') {
        isSuccess = res.success === true || res.status === 200 || true;
        if (typeof res.data === 'string') {
          htmlContent = res.data;
        } else if (typeof res.data?.data === 'string') {
          htmlContent = res.data.data;
        }
      }

      if (isSuccess && htmlContent.trim().length > 0) {
        const safeHtml = htmlContent.replace(/<\/?(section|div|article|main|aside)[^>]*>/gi, '');
        // Mirror the run into the modal's state so Regenerate and Edit Prompt
        // keep working even when the run started outside the modal.
        setZaiTargetField(field);
        setZaiAction(action);
        setZaiUsePrd(usePrd);
        setZaiPrompt(prompt);
        setZaiGeneratedContent(safeHtml);
        setZaiView('preview');
        setIsZaiModalVisible(true);
      } else {
        message.error('Failed to generate scope content: AI returned empty or invalid format.');
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || 'Failed to generate scope via ZAI');
    } finally {
      setZaiGenerating(field, false);
    }
  };

  const submitZaiPrompt = async () => {
    if (!zaiTargetField || !zaiPrompt.trim()) return;
    await runZaiGeneration({
      field: zaiTargetField,
      action: zaiAction,
      usePrd: zaiUsePrd,
      prompt: zaiPrompt,
    });
  };

  /**
   * PRD path: the document is the brief, so there is no prompt to compose and
   * nothing to suggest. The popover collects optional steering text and goes
   * straight to the result.
   */
  const handleGenerateFromPrd = async () => {
    if (!prdDocumentId) return;
    setPrdPopoverOpen(false);
    await runZaiGeneration({
      field: 'inScope',
      action: 'generate',
      usePrd: true,
      prompt: prdContext.trim(),
    });
  };

  const handleZaiInsert = (action: 'replace' | 'append' | 'insert') => {
    if (!zaiTargetField) return;

    // The description is a plain textarea — strip any markup and join with newlines.
    const isPlain = zaiTargetField === 'description';
    const generated = isPlain
      ? zaiGeneratedContent.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
      : zaiGeneratedContent;
    const joiner = isPlain ? '\n\n' : '<br/>';

    const field = zaiTargetField;
    // Cursor insert goes straight into the live editor; replace/append rewrite the
    // stored HTML and remount the editor so it reseeds from it.
    if (action === 'insert' && !isPlain && inScopeRef.current) {
      inScopeRef.current.insertHtmlAtCursor(generated);
    } else if (action === 'replace') {
      updateDetail(field, generated);
      if (!isPlain) bumpPane();
    } else {
      const current = formData.details[field] || '';
      updateDetail(field, current + (current ? joiner : '') + generated);
      if (!isPlain) bumpPane();
    }

    message.success(`${ZAI_FIELD_LABEL[zaiTargetField]} updated successfully.`);
    setIsZaiModalVisible(false);
  };

  const handleZaiCopy = () => {
    navigator.clipboard.writeText(zaiGeneratedContent);
    message.success('Copied to clipboard!');
  };

  /** Light-touch grammar pass over the Description field. */
  const handlePolishDescription = async () => {
    const current = (formData.details.description || '').trim();
    if (!current || polishingDescription) return;
    setPolishingDescription(true);
    try {
      const res: any = await axios.post('/api/v2/qa/test-scopes/enhance-text', { text: current });
      const corrected =
        typeof res === 'string' ? res
          : res?.data?.data?.text ?? res?.data?.text ?? res?.data?.data ?? '';

      if (typeof corrected === 'string' && corrected.trim() && corrected.trim() !== current) {
        updateDetail('description', corrected.trim());
        message.success('Grammar polished');
      } else {
        message.info('Already looks good');
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || "Couldn't polish the description");
    } finally {
      setPolishingDescription(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const updateReqRef = (field: string, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        reqReferences: {
          ...prev.details.reqReferences,
          [field]: val
        }
      }
    }));
  };

  const updateEnvironment = (field: string, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        environment: {
          ...(prev.details.environment || {}),
          [field]: val
        }
      }
    }));
  };

  const updateLinkedItem = (field: string, prop: 'name' | 'link', val: string) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        linkedItems: {
          ...(prev.details.linkedItems || {}),
          [field]: {
            ...(prev.details.linkedItems?.[field] || {}),
            [prop]: val
          }
        }
      }
    }));
  };

  /**
   * Linked suites/runs are stored as an array of { name, link }. Scopes saved
   * before they became multi-select hold a single object, so both shapes are
   * read here rather than migrating the stored JSON.
   */
  const asLinkedIds = (v: any): string[] | undefined => {
    if (Array.isArray(v)) return v.map((i: any) => String(i.link)).filter(Boolean);
    return v?.link ? [String(v.link)] : undefined;
  };

  const updateLinkedItemArray = (field: string, val: any[]) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        linkedItems: {
          ...(prev.details.linkedItems || {}),
          [field]: val
        }
      }
    }));
  };

  const updateCustomLink = (idx: number, prop: string, val: string) => {
    setFormData((prev: any) => {
      const custom = [...(prev.details.linkedItems?.custom || [])];
      custom[idx] = { ...custom[idx], [prop]: val };
      return {
        ...prev,
        details: {
          ...prev.details,
          linkedItems: {
            ...prev.details.linkedItems,
            custom
          }
        }
      };
    });
  };

  const addCustomLink = () => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        linkedItems: {
          ...prev.details.linkedItems,
          custom: [...(prev.details.linkedItems?.custom || []), { label: '', name: '', link: '' }]
        }
      }
    }));
  };

  const removeCustomLink = (idx: number) => {
    setFormData((prev: any) => {
      const custom = [...(prev.details.linkedItems?.custom || [])];
      custom.splice(idx, 1);
      return {
        ...prev,
        details: {
          ...prev.details,
          linkedItems: {
            ...prev.details.linkedItems,
            custom
          }
        }
      };
    });
  };

  const updateAttachmentFiles = async (field: string, info: any) => {
    const processFile = (file: any) => {
      return new Promise((resolve) => {
        if (file.url || file.thumbUrl) {
          resolve(file);
        } else if (file.originFileObj) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => {
            resolve({ ...file, url: reader.result, status: 'done' });
          };
          reader.onerror = () => resolve(file);
        } else {
          resolve(file);
        }
      });
    };

    const processedFiles = await Promise.all(info.fileList.map(processFile));

    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        attachments: {
          ...(prev.details.attachments || {}),
          [field]: processedFiles
        }
      }
    }));
  };

  const clearAttachmentCategory = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        attachments: { ...(prev.details.attachments || {}), [field]: [] }
      }
    }));
  };

  const handleRemoveAttachment = (field: string, uid: string) => {
    setFormData((prev: any) => {
      const currentFiles = prev.details.attachments?.[field] || [];
      return {
        ...prev,
        details: {
          ...prev.details,
          attachments: {
            ...(prev.details.attachments || {}),
            [field]: currentFiles.filter((f: any) => f.uid !== uid)
          }
        }
      };
    });
  };

  const updateAdditionalDocs = async (info: any) => {
    const processFile = (file: any) => {
      return new Promise((resolve) => {
        if (file.url || file.thumbUrl) {
          resolve(file);
        } else if (file.originFileObj) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => resolve({ ...file, url: reader.result, status: 'done' });
          reader.onerror = () => resolve(file);
        } else {
          resolve(file);
        }
      });
    };
    const processedFiles = await Promise.all(info.fileList.map(processFile));
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        reqReferences: {
          ...prev.details.reqReferences,
          additionalDocs: processedFiles
        }
      }
    }));
  };

  const handleRemoveAdditionalDoc = (uid: string) => {
    setFormData((prev: any) => {
      const currentFiles = prev.details.reqReferences?.additionalDocs || [];
      return {
        ...prev,
        details: {
          ...prev.details,
          reqReferences: {
            ...prev.details.reqReferences,
            additionalDocs: currentFiles.filter((f: any) => f.uid !== uid)
          }
        }
      };
    });
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setNameError("Test Scope Name is required");
      message.error("Test Scope Name is required");
      scrollToSection('sec-basics');
      setTimeout(() => nameInputRef.current?.focus?.(), 350);
      return;
    }
    if (!formData.status) {
      message.error("Status is required");
      scrollToSection('sec-basics');
      return;
    }
    setNameError(null);

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        start_date: formData.start_date ? dayjs(formData.start_date).format('YYYY-MM-DD') : null,
        end_date: formData.end_date ? dayjs(formData.end_date).format('YYYY-MM-DD') : null,
      };

      await axios.put(`/api/v2/qa/test-scopes/${id}`, payload);
      setIsDirty(false);
      message.success(`Scope updated successfully`);
      router.push("/qa-workspace/test-scope");
    } catch (error) {
      console.error(error);
      message.error("Failed to update Test Scope");
    } finally {
      setSubmitting(false);
    }
  };

  saveRef.current = handleSave;

  const handleRequestApproval = async () => {
    if (!formData.name?.trim()) {
      setNameError("Test Scope Name is required");
      message.error("Test Scope Name is required");
      scrollToSection('sec-basics');
      setTimeout(() => nameInputRef.current?.focus?.(), 350);
      return;
    }
    setNameError(null);

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        status: 'In Review',
        details: {
          ...(formData.details || {}),
          approvalWorkflow: {
            ...(formData.details?.approvalWorkflow || {}),
            status: 'pending'
          }
        },
        start_date: formData.start_date ? dayjs(formData.start_date).format('YYYY-MM-DD') : null,
        end_date: formData.end_date ? dayjs(formData.end_date).format('YYYY-MM-DD') : null,
      };

      await axios.put(`/api/v2/qa/test-scopes/${id}`, payload);
      setIsDirty(false);
      message.success(`Scope updated and approval requested successfully`);
      router.push("/qa-workspace/test-scope");
    } catch (error) {
      console.error(error);
      message.error("Failed to request approval for Test Scope");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived option lists ──────────────────────────────────────────────────────
  const scopeTypeOpts = scopeSettings.filter(s => s.category === 'scope_type').length > 0
    ? scopeSettings.filter(s => s.category === 'scope_type').map(s => ({ value: s.value, label: s.label }))
    : [{ value: 'Feature Release', label: 'Feature Release' }, { value: 'Integration', label: 'Integration' }, { value: 'Bug Fix', label: 'Bug Fix' }];

  const priorityOpts = scopeSettings.filter(s => s.category === 'priority').length > 0
    ? scopeSettings.filter(s => s.category === 'priority').map(s => ({ value: s.value, label: s.label }))
    : [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Critical', label: 'Critical' }];

  const scopeStatusOpts = scopeSettings.filter(s => s.category === 'status').map(s => ({ value: s.value, label: s.label }));

  const selectedApproverPosition = formData.details.approvalWorkflow?.position;
  const filteredUsersList = selectedApproverPosition
    ? usersList.filter(u => u.position?.id === selectedApproverPosition || u.positionId === selectedApproverPosition)
    : usersList;

  const userOptions = filteredUsersList.map(u => ({
    value: u.id,
    label: u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
    avatarUrl: u.avatarUrl || u.avatar || u.profile_picture || u.profilePicture || null,
  }));

  const positionOptions = positionsList.map(p => ({ value: p.id, label: p.title }));

  // Keep a manually typed product visible in the list alongside the user's projects
  const currentProduct = formData.details.product;
  const productOptions = currentProduct && !projectOptions.some(p => p.value === currentProduct)
    ? [...projectOptions, { value: currentProduct, label: currentProduct, description: 'Custom entry' }]
    : projectOptions;

  const sprintOptions = sprints.map(s => ({ value: s.id || s.name, label: s.name }));

  /* The workspace's own module list — the same one QA Space → Settings curates.
     Anything typed here that isn't on it is registered on save. */
  const moduleOpts = qaModules.map((m: any) => ({
    value: String(m.module_name),
    label: String(m.module_name),
  }));
  const customModules = (formData.details.modules || []).filter((m: string) => !moduleOpts.find(o => o.value === m)).map((m: string) => ({ value: m, label: m }));
  const allModuleOpts = [...moduleOpts, ...customModules];

  const featuresMap: Record<string, string[]> = {
    'Home': ['Dashboard', 'Announcements', 'Quick Links'],
    'Work': ['Tasks', 'Projects', 'Time Tracking', 'Sprint Planning'],
    'Admin': ['User Management', 'Roles & Permissions', 'Global Settings', 'Audit Logs'],
    'HRMS': ['Leaves', 'Attendance', 'Payroll', 'Employee Directory'],
    'Finance': ['Invoices', 'Expenses', 'Financial Reports', 'Budgeting'],
    'My Hub': ['Profile', 'Preferences', 'My Tasks', 'My Requests']
  };
  const featureOpts = (formData.details.modules || []).flatMap((mod: string) =>
    (featuresMap[mod] || []).map(f => ({ value: f, label: f }))
  );
  const customFeatures = (formData.details.features || []).filter((f: string) => !featureOpts.find((o: { value: string; }) => o.value === f)).map((f: string) => ({ value: f, label: f }));
  const allFeatureOpts = [...featureOpts, ...customFeatures];

  const statusOptions = [
    { value: 'ready', label: 'Ready', badge: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> },
    { value: 'pending', label: 'Pending', badge: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748b' }} /> },
    { value: 'blocked', label: 'Blocked', badge: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> }
  ];

  const depDotColor = (s: string) => s === 'ready' ? '#10b981' : s === 'blocked' ? '#ef4444' : '#64748b';

  const browserListOptions = [
    'Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Brave', 'Arc', 'Vivaldi',
    'Internet Explorer', 'Samsung Internet', 'UC Browser', 'Yandex', 'Tor Browser'
  ].map(b => ({ label: b, value: b }));

  const osListOptions = [
    'Windows 11', 'Windows 10', 'Windows 8', 'Windows 7', 'macOS', 'Ubuntu', 'Debian',
    'Fedora', 'CentOS', 'Red Hat', 'Linux Mint', 'Android', 'iOS', 'iPadOS', 'ChromeOS'
  ].map(o => ({ label: o, value: o }));

  const linkFieldSuffix = (val?: string) =>
    val && /^https?:\/\//i.test(val) ? (
      <a href={val} target="_blank" rel="noreferrer" className="ts-open" title="Open link">
        <ExternalLink size={13} />
      </a>
    ) : <span />;

  const attachmentFields = [
    { key: 'screenshots', label: 'Screenshots', hint: 'PNG, JPG · max 50MB' },
    { key: 'designFiles', label: 'Design Files', hint: 'Figma exports, Sketch · max 50MB' },
    { key: 'sampleData', label: 'Sample Data', hint: 'CSV, JSON · max 50MB' },
    { key: 'excelFiles', label: 'Excel Files', hint: 'XLS, XLSX · max 50MB' },
    { key: 'pdfs', label: 'PDFs', hint: 'PDF documents · max 50MB' },
  ];

  // Built-in option lists plus anything the user added this session
  const allAttachmentFields = [...attachmentFields, ...customAttachmentFields];
  const allTestingTypes = [...TESTING_TYPES, ...customTestingTypes];
  const allExitCriteria = [...EXIT_CRITERIA, ...customExitCriteria];

  const totalAttachments = allAttachmentFields.reduce((n, f) => n + (formData.details.attachments?.[f.key]?.length || 0), 0);
  const totalAttachmentSize = allAttachmentFields.reduce(
    (n, f) => n + (formData.details.attachments?.[f.key] || []).reduce((s: number, file: any) => s + (file.size || 0), 0),
    0
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      {previewImg && (
        <ImageModal src={previewImg.src} name={previewImg.name} onClose={() => setPreviewImg(null)} />
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        .ts-create {
          --ts-page: #F4F7FB;
          --ts-surface: #FFFFFF;
          --ts-surface-soft: #F8FAFC;
          --ts-border: #E4EAF2;
          --ts-border-soft: #EDF1F7;
          --ts-text: #0F172A;
        /* Toggle and control sit on one line — the mode is a property of the
           field, not a step before it. */
        .ts-prd { display: flex; align-items: center; gap: 8px; }
        .ts-prd__control { flex: 1; min-width: 0; }
        .ts-prd__modes {
          display: inline-flex; flex-shrink: 0; overflow: hidden; height: 34px;
          border: 1px solid var(--ts-border); border-radius: 8px;
        }
        @media (max-width: 640px) {
          .ts-prd { flex-direction: column; align-items: stretch; }
          .ts-prd__modes { align-self: flex-start; }
        }
        .ts-prd__modes button {
          display: inline-flex; align-items: center;
          padding: 0 12px; border: none; background: transparent; cursor: pointer;
          font-size: 11px; font-weight: 600; color: var(--ts-text-3);
          transition: background .15s ease, color .15s ease;
        }
        .ts-prd__modes button + button { border-left: 1px solid var(--ts-border); }
        .ts-prd__modes button.is-active { background: rgba(59,130,246,.1); color: #2563eb; }

          --ts-text-2: #475569;
          --ts-text-3: #94A3B8;
          --ts-blue: #3B82F6;
          --ts-blue-strong: #2563EB;
          --ts-blue-soft: #EFF6FF;
          --ts-blue-border: #BFDBFE;
          --ts-green: #10B981;
          --ts-green-soft: #ECFDF5;
          --ts-red: #EF4444;
          --ts-red-soft: #FEF2F2;
          background: var(--ts-page);
          min-height: 100%;
          /* cancel MainLayout's 8px gutters so the workspace runs edge to edge */
          margin: 0 -8px;
          width: calc(100% + 16px);
        }
        [data-theme='dark'] .ts-create {
          --ts-page: #0B0F1A;
          --ts-surface: #121826;
          --ts-surface-soft: #161E2E;
          --ts-border: #232C3D;
          --ts-border-soft: #1C2434;
          --ts-text: #E9EEF6;
          --ts-text-2: #A8B3C4;
          --ts-text-3: #6E7A8C;
          --ts-blue-soft: rgba(59,130,246,0.14);
          --ts-blue-border: rgba(59,130,246,0.38);
          --ts-green-soft: rgba(16,185,129,0.14);
          --ts-red-soft: rgba(239,68,68,0.12);
        }
        .ts-create .ts-text { color: var(--ts-text); }

        /* ── Sticky page chrome ─────────────────────────────────────── */
        .ts-create .ts-topbar {
          background: var(--ts-page);
          background: color-mix(in srgb, var(--ts-page) 88%, transparent);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--ts-border);
        }
        .ts-create .ts-crumb {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          font-weight: 600; color: var(--ts-text-3);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ts-create .ts-crumb button { color: inherit; }
        .ts-create .ts-crumb button:hover { color: var(--ts-blue); }
        .ts-create .ts-title {
          font-size: 20px; line-height: 1.2; font-weight: 700;
          letter-spacing: -0.02em; color: var(--ts-text); margin: 0;
        }
        .ts-create .ts-sub { font-size: 12.5px; color: var(--ts-text-3); margin: 3px 0 0; }
        .ts-create .ts-sub--meta {
          margin: 0; text-align: right; line-height: 1.45;
          max-width: 300px; text-wrap: balance;
        }
        .ts-create .ts-sub--meta strong { font-weight: 700; color: var(--ts-text-2); }
        /* The descriptive tail only earns its place on genuinely wide screens */
        .ts-create .ts-sub__tail { display: none; }
        @media (min-width: 1440px) { .ts-create .ts-sub__tail { display: inline; } }
        .ts-create .ts-dirty {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          border: 1px solid var(--ts-blue-border);
        }
        [data-theme='dark'] .ts-create .ts-dirty { color: #93C5FD; }
        .ts-create .ts-dirty__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .ts-create .ts-progressbar { height: 3px; background: var(--ts-border-soft); }
        .ts-create .ts-progressbar span {
          display: block; height: 100%;
          background: linear-gradient(90deg, var(--ts-blue), var(--ts-green));
          transition: width .35s cubic-bezier(.4,0,.2,1);
        }

        /* ── Left rail ──────────────────────────────────────────────── */
        .ts-create .ts-rail {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(15,23,42,.04);
          overflow: hidden;
        }
        .ts-create .ts-rail__top {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-create .ts-ring__track { stroke: var(--ts-border); }
        .ts-create .ts-ring__bar { stroke: var(--ts-blue); transition: stroke-dashoffset .4s cubic-bezier(.4,0,.2,1); }
        .ts-create .ts-rail__nav { padding: 8px; display: flex; flex-direction: column; gap: 2px; max-height: calc(100vh - 330px); overflow-y: auto; }
        .ts-create .ts-rail__nav::-webkit-scrollbar { width: 6px; }
        .ts-create .ts-rail__nav::-webkit-scrollbar-thumb { background: var(--ts-border); border-radius: 999px; }
        .ts-create .ts-navitem {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 7px 10px; border-radius: 9px;
          font-size: 12.5px; font-weight: 500; color: var(--ts-text-2);
          text-align: left; transition: background .15s, color .15s;
        }
        .ts-create .ts-navitem:hover { background: var(--ts-surface-soft); color: var(--ts-text); }
        .ts-create .ts-navitem--active { background: var(--ts-blue-soft); color: var(--ts-blue-strong); font-weight: 600; }
        [data-theme='dark'] .ts-create .ts-navitem--active { color: #93C5FD; }
        .ts-create .ts-navitem__tick {
          margin-left: auto; width: 15px; height: 15px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--ts-border); color: transparent; flex-shrink: 0;
        }
        .ts-create .ts-navitem__tick--done { background: var(--ts-green); border-color: var(--ts-green); color: #fff; }

        /* ── Section cards ──────────────────────────────────────────── */
        .ts-create .ts-card {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(15,23,42,.04);
          overflow: hidden;
        }
        .ts-create .ts-card__head {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 20px;
          background: var(--ts-surface-soft);
          border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-create .ts-card__icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          border: 1px solid var(--ts-blue-border);
        }
        [data-theme='dark'] .ts-create .ts-card__icon { color: #93C5FD; }
        .ts-create .ts-card__step {
          font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
          color: var(--ts-text-3); font-variant-numeric: tabular-nums;
        }
        .ts-create .ts-card__title { margin: 0; font-size: 14.5px; font-weight: 650; color: var(--ts-text); letter-spacing: -0.01em; }
        .ts-create .ts-card__desc { margin: 2px 0 0; font-size: 12px; color: var(--ts-text-3); }
        .ts-create .ts-card__body { padding: 20px; }
        .ts-create .ts-count {
          font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
          background: var(--ts-green-soft); color: #047857; border: 1px solid transparent;
        }
        [data-theme='dark'] .ts-create .ts-count { color: #6EE7B7; }

        /* ── Fields ─────────────────────────────────────────────────── */
        .ts-create .ts-label {
          display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600;
          color: var(--ts-text-2); letter-spacing: .005em;
        }
        .ts-create .ts-req { color: var(--ts-red); margin-left: 3px; }
        .ts-create .ts-hint { margin: 5px 0 0; font-size: 11.5px; color: var(--ts-text-3); }
        .ts-create .ts-error { margin: 5px 0 0; font-size: 11.5px; color: var(--ts-red); font-weight: 500; }

        .ts-create input.ant-input:not(.ant-input-sm),
        .ts-create .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-sm),
        .ts-create .ant-picker,
        .ts-create .sd-trigger {
          min-height: 40px !important;
          border-radius: 10px !important;
        }
        .ts-create input.ant-input:not(.ant-input-sm),
        .ts-create .ant-picker,
        .ts-create .sd-trigger {
          height: 40px !important;
          display: flex; align-items: center;
        }
        .ts-create .ant-input-affix-wrapper input.ant-input { height: auto !important; min-height: 0 !important; }
        .ts-create textarea.ant-input { min-height: 84px; border-radius: 10px !important; padding: 10px 12px; }
        .ts-create .ant-btn { border-radius: 9px; }
        .ts-create .ts-open { color: var(--ts-text-3); display: inline-flex; }
        .ts-create .ts-open:hover { color: var(--ts-blue); }

        .custom-upload-dragger .ant-upload-drag { border: none !important; background: transparent !important; }
        .custom-upload-dragger .ant-upload { padding: 0 !important; }

        /* ── Expand drawer: Doc Hub (BlockNote) writing surface ─────── */
        .ts-drawer-hint {
          font-size: 11.5px; color: var(--text-slate-400);
          padding: 3px 9px; border-radius: 999px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
          white-space: nowrap;
        }
        .ts-drawer-hint strong { font-weight: 700; color: var(--text-slate-600); }
        .ts-docsurface { position: relative; height: 100%; padding: 20px 12px 28px; overflow: hidden; }
        /* Leave BlockNote's 54px inline padding alone — the drag handle and the
           "+" add-block button are drawn inside that gutter and vanish without it. */
        .ts-docsurface__loading {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: var(--text-slate-400);
          background: var(--bg-pure-white);
        }
        /* Inline variant — sits inside the Scope Definition card like a form control */
        .ts-create .ts-docsurface--inline {
          padding: 10px 0 14px;
          border: 1px solid var(--ts-border);
          border-radius: 12px;
          background: var(--ts-surface);
          transition: border-color .15s ease;
        }
        .ts-create .ts-docsurface--inline:focus-within { border-color: var(--ts-blue-border); }
        .ts-create .ts-docsurface--inline .ts-docsurface__loading { background: var(--ts-surface); border-radius: 12px; }
        .ts-create .ts-docsurface--paused {
          display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; color: var(--ts-text-3); background: var(--ts-surface-soft);
        }

        /* ── Selected-value tokens (modules / features) ─────────────── */
        .ts-create .ts-tokens { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .ts-create .ts-token {
          display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
          padding: 3px 5px 3px 9px; border-radius: 999px;
          font-size: 11.5px; font-weight: 600; line-height: 1.5;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          border: 1px solid var(--ts-blue-border);
        }
        [data-theme='dark'] .ts-create .ts-token { color: #93C5FD; }
        .ts-create .ts-token button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 15px; height: 15px; border-radius: 999px; flex-shrink: 0;
          color: inherit; opacity: .6; transition: opacity .15s, background .15s;
        }
        .ts-create .ts-token button:hover { opacity: 1; background: rgba(59,130,246,.18); }

        /* ── Chips (testing types / exit criteria) ──────────────────── */
        .ts-create .ts-chip {
          display: flex; align-items: center;
          padding: 0 4px 0 12px; border-radius: 10px;
          border: 1px solid var(--ts-border); background: var(--ts-surface);
          font-size: 12.5px; font-weight: 500; color: var(--ts-text-2);
          transition: all .15s ease; text-align: left; width: 100%;
        }
        .ts-create .ts-chip__main {
          display: flex; align-items: center; gap: 8px;
          flex: 1; min-width: 0; padding: 9px 0; color: inherit; text-align: left;
        }
        .ts-create .ts-chip__remove {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 6px; flex-shrink: 0;
          color: var(--ts-text-3); opacity: .7; transition: all .15s ease;
        }
        .ts-create .ts-chip__remove:hover { opacity: 1; color: var(--ts-red); background: var(--ts-red-soft); }
        .ts-create .ts-chip--custom { padding-right: 4px; }
        .ts-create .ts-chip:hover { border-color: var(--ts-blue-border); background: var(--ts-surface-soft); color: var(--ts-text); }
        .ts-create .ts-chip--on {
          border-color: var(--ts-blue); background: var(--ts-blue-soft);
          color: var(--ts-blue-strong); font-weight: 600;
        }
        [data-theme='dark'] .ts-create .ts-chip--on { color: #93C5FD; }
        .ts-create .ts-chip__box {
          width: 16px; height: 16px; border-radius: 5px; flex-shrink: 0;
          border: 1.5px solid var(--ts-border); background: var(--ts-surface);
          display: inline-flex; align-items: center; justify-content: center; color: #fff;
          transition: all .15s ease;
        }
        .ts-create .ts-chip--on .ts-chip__box { background: var(--ts-blue); border-color: var(--ts-blue); }

        /* ── Inline "add your own" row ──────────────────────────────── */
        .ts-create .ts-inlineadd {
          display: flex; align-items: center; gap: 10px;
          padding: 12px; margin-bottom: 16px; border-radius: 10px;
          border: 1px dashed var(--ts-blue-border); background: var(--ts-blue-soft);
        }

        /* ── List rows (dependencies / criteria / custom links) ─────── */
        .ts-create .ts-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          border: 1px solid var(--ts-border-soft); background: var(--ts-surface-soft);
        }
        .ts-create .ts-row:hover { border-color: var(--ts-border); }
        .ts-create .ts-row__text { font-size: 13px; color: var(--ts-text); flex: 1; word-break: break-word; }
        .ts-create .ts-dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }
        .ts-create .ts-statuspill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; text-transform: capitalize;
          padding: 3px 10px; border-radius: 999px;
          background: var(--ts-surface); border: 1px solid var(--ts-border); color: var(--ts-text-2);
        }
        .ts-create .ts-empty {
          padding: 18px; border-radius: 10px; border: 1px dashed var(--ts-border);
          text-align: center; font-size: 12.5px; color: var(--ts-text-3);
          background: var(--ts-surface-soft);
        }
        .ts-create .ts-addbar {
          display: flex; gap: 10px; align-items: center;
          padding-top: 12px; margin-top: 12px; border-top: 1px dashed var(--ts-border);
        }

        /* ── Dropzones + file rows ──────────────────────────────────── */
        /* ── Attachment bays ────────────────────────────────────────── */
        .ts-create .ts-bay {
          border: 1px solid var(--ts-border); border-radius: 12px;
          background: var(--ts-surface); overflow: hidden;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .ts-create .ts-bay:hover { border-color: var(--ts-blue-border); }
        .ts-create .ts-bay--filled { box-shadow: 0 1px 2px rgba(15,23,42,.04); }
        .ts-create .ts-bay__head {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 12px; background: var(--ts-surface-soft);
          border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-create .ts-bay__icon {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
        }
        [data-theme='dark'] .ts-create .ts-bay__icon { color: #93C5FD; }
        .ts-create .ts-bay__label {
          font-size: 12.5px; font-weight: 650; color: var(--ts-text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ts-create .ts-bay__meta {
          font-size: 11px; font-weight: 600; color: var(--ts-blue-strong);
          background: var(--ts-blue-soft); padding: 2px 7px; border-radius: 999px;
          white-space: nowrap;
        }
        [data-theme='dark'] .ts-create .ts-bay__meta { color: #93C5FD; }
        .ts-create .ts-bay__meta--empty {
          color: var(--ts-text-3); background: transparent;
          padding: 0; font-weight: 500;
        }
        .ts-create .ts-bay__actions {
          margin-left: auto; display: flex; align-items: center; gap: 2px;
          opacity: 0; transition: opacity .15s ease;
        }
        .ts-create .ts-bay:hover .ts-bay__actions,
        .ts-create .ts-bay__actions:focus-within { opacity: 1; }
        .ts-create .ts-bay__actions button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 7px; color: var(--ts-text-3);
          transition: all .15s ease;
        }
        .ts-create .ts-bay__actions button:hover { color: var(--ts-red); background: var(--ts-red-soft); }
        .ts-create .ts-bay__body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

        /* Image tiles for anything that renders as a picture */
        .ts-create .ts-thumbs {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px;
        }
        .ts-create .ts-thumb {
          position: relative; border-radius: 9px; overflow: hidden;
          border: 1px solid var(--ts-border-soft); background: var(--ts-surface-soft);
          aspect-ratio: 4 / 3;
        }
        .ts-create .ts-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ts-create .ts-thumb__veil {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(15,23,42,.62); opacity: 0; transition: opacity .15s ease;
        }
        .ts-create .ts-thumb:hover .ts-thumb__veil { opacity: 1; }
        .ts-create .ts-thumb__veil button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,.16); color: #fff; transition: background .15s ease;
        }
        .ts-create .ts-thumb__veil button:hover { background: rgba(255,255,255,.32); }
        .ts-create .ts-thumb__veil button:last-child:hover { background: var(--ts-red); }
        .ts-create .ts-thumb__name {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 10px 6px 4px; font-size: 10px; color: #fff;
          background: linear-gradient(to top, rgba(15,23,42,.78), transparent);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .ts-create .ts-drop {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 12px;
          border: 1.5px dashed var(--ts-border); background: var(--ts-surface-soft);
          transition: all .18s ease; cursor: pointer;
        }
        .ts-create .ts-drop:hover { border-color: var(--ts-blue); background: var(--ts-blue-soft); }
        .ts-create .ts-drop--compact {
          justify-content: center; gap: 7px; padding: 8px 12px;
          font-size: 12px; font-weight: 600; color: var(--ts-text-2);
          background: transparent;
        }
        .ts-create .ts-drop--compact:hover { color: var(--ts-blue-strong); }
        [data-theme='dark'] .ts-create .ts-drop--compact:hover { color: #93C5FD; }
        /* antd flags an active drag on the wrapper */
        .ts-create .ant-upload-drag-hover .ts-drop { border-color: var(--ts-blue); background: var(--ts-blue-soft); }
        .ts-create .ts-drop__icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--ts-surface); border: 1px solid var(--ts-border); color: var(--ts-blue);
        }
        .ts-create .ts-drop__title { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--ts-text-2); }
        .ts-create .ts-drop__title span { color: var(--ts-blue-strong); }
        [data-theme='dark'] .ts-create .ts-drop__title span { color: #93C5FD; }
        .ts-create .ts-drop__hint { margin: 2px 0 0; font-size: 11px; color: var(--ts-text-3); }
        .ts-create .ts-file {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 8px 10px; border-radius: 10px;
          border: 1px solid var(--ts-border-soft); background: var(--ts-surface);
        }
        .ts-create .ts-file:hover { border-color: var(--ts-blue-border); }
        .ts-create .ts-file__thumb {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: var(--ts-surface-soft); border: 1px solid var(--ts-border-soft); color: var(--ts-text-3);
        }
        .ts-create .ts-file__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ts-create .ts-file__name { font-size: 12.5px; font-weight: 550; color: var(--ts-text); }
        .ts-create .ts-file__meta { font-size: 11px; color: var(--ts-text-3); }
        .ts-create .ts-file__ready { color: var(--ts-green); font-weight: 600; }
        .ts-create .ts-file__state { color: var(--ts-blue); font-weight: 600; }
        .ts-create .ts-file__actions { display: flex; align-items: center; gap: 2px; opacity: .55; transition: opacity .15s; }
        .ts-create .ts-file:hover .ts-file__actions { opacity: 1; }

        /* ── Editor panes ───────────────────────────────────────────── */
        .ts-create .ts-editorhead {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 8px;
        }
        .ts-create .ts-editortag {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12.5px; font-weight: 650; color: var(--ts-text);
        }
        .ts-create .ts-minibtn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; padding: 4px 9px; border-radius: 8px;
          color: var(--ts-text-2); border: 1px solid var(--ts-border); background: var(--ts-surface);
          transition: all .15s ease;
        }
        .ts-create .ts-minibtn:hover { color: var(--ts-blue-strong); border-color: var(--ts-blue-border); background: var(--ts-blue-soft); }
        .ts-create .ts-minibtn--ai { color: var(--ts-blue-strong); border-color: var(--ts-blue-border); background: var(--ts-blue-soft); }
        [data-theme='dark'] .ts-create .ts-minibtn--ai { color: #93C5FD; }
        .ts-create .ts-minibtn:disabled { opacity: .6; cursor: not-allowed; }
      `}} />

      <div className="ts-create">
        {/* ── Sticky header ─────────────────────────────────────────── */}
        <div ref={stickyRef} className="ts-topbar sticky top-0 z-30">
          <div className="mx-auto max-w-[1560px] px-5 xl:px-7 pt-3 pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-2.5 min-w-0">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.back()}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="ts-crumb">
                    <button onClick={() => router.push('/qa-workspace/test-scope')}>QA Workspace</button>
                    <span>›</span>
                    <button onClick={() => router.push('/qa-workspace/test-scope')}>Test Scopes</button>
                    <span>›</span>
                    <span style={{ color: 'var(--ts-text-2)' }}>Edit</span>
                  </div>
                  <h1 className="ts-title mt-1.5">{formData.name?.trim() || 'Edit Test Scope'}</h1>
                </div>
              </div>

              {/* Status + actions live on the right so the title block stays clean */}
              <div className="flex items-center gap-5 flex-shrink-0">
                {/* <p className="ts-sub ts-sub--meta hidden lg:block">
                  <strong>{doneCount} of {SECTIONS.length}</strong> sections filled
                  <span className="ts-sub__tail"> · define what gets tested, where, and when it&apos;s done.</span>
                </p> */}
                <div className="flex items-center gap-2.5">
                  {isDirty && (
                    <span className="ts-dirty hidden sm:inline-flex">
                      <span className="ts-dirty__dot" />Unsaved changes
                    </span>
                  )}
                  <Button onClick={() => router.back()}>Cancel</Button>
                  <Tooltip title="⌘S / Ctrl+S">
                    <Button type="primary" icon={<Save size={15} />} onClick={handleSave} loading={submitting}>
                      Save Changes
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          <div className="ts-progressbar"><span style={{ width: `${progress}%` }} /></div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1560px] px-5 xl:px-7 py-6">
          <div className="flex items-start gap-6">

            {/* Left rail */}
            <aside
              className="hidden xl:block w-[252px] flex-shrink-0 self-start"
              style={{ position: 'sticky', top: stickyH + 20 }}
            >
              <div className="ts-rail">
                <div className="ts-rail__top">
                  <ProgressRing value={progress} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold ts-text">Scope readiness</div>
                    <div className="text-[11.5px]" style={{ color: 'var(--ts-text-3)' }}>
                      {doneCount}/{SECTIONS.length} sections complete
                    </div>
                  </div>
                </div>
                <nav className="ts-rail__nav">
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const done = completion[s.id];
                    return (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className={`ts-navitem${activeSection === s.id ? ' ts-navitem--active' : ''}`}
                      >
                        <Icon size={14} className="flex-shrink-0" />
                        <span className="truncate">{s.label}</span>
                        {s.required && !done ? <span className="ts-req ml-auto">*</span> : null}
                        <span className={`ts-navitem__tick${done ? ' ts-navitem__tick--done' : ''}`}>
                          <Check size={9} strokeWidth={4} />
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Form column */}
            <main className="flex-1 min-w-0 flex flex-col gap-5 pb-24">

              {/* 01 — Basic Information */}
              <SectionCard
                id="sec-basics"
                index={1}
                icon={ClipboardList}
                title="Basic Information"
                description="Name the scope, set its priority and who owns it."
              >
                {/* Row 1 → Name (70%) + Scope Type (30%) */}
                <div className="grid grid-cols-1 md:grid-cols-10 gap-x-5 gap-y-4 mb-4">
                  <Field label="Test Scope Name" required className="md:col-span-7" error={nameError || undefined}>
                    <Input
                      ref={nameInputRef}
                      placeholder="e.g. Checkout revamp — release 2.4 regression"
                      value={formData.name}
                      status={nameError ? 'error' : undefined}
                      onChange={(e) => { setNameError(null); updateRoot('name', e.target.value); }}
                    />
                  </Field>
                  <Field label="Scope Type" className="md:col-span-3">
                    <SearchableDropdown
                      options={scopeTypeOpts}
                      value={formData.type}
                      onChange={v => updateRoot('type', v)}
                      placeholder="Select Type"
                      style={{ width: '100%' }}
                    />
                  </Field>
                </div>

                {/* Rows 2 & 3 → 3 fields each */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-x-5 gap-y-4">
                  <Field label="Priority" className="xl:col-span-2">
                    <SearchableDropdown
                      options={priorityOpts}
                      value={formData.priority}
                      onChange={v => updateRoot('priority', v)}
                      placeholder="Select Priority"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Status" required className="xl:col-span-2">
                    <SearchableDropdown
                      options={scopeStatusOpts}
                      value={formData.status}
                      onChange={v => updateRoot('status', v)}
                      placeholder="Select Status"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="QA Owner" className="xl:col-span-2">
                    <SearchableDropdown
                      options={userOptions.map(opt => ({ ...opt, value: opt.label }))}
                      value={formData.qa_owner}
                      onChange={(val) => updateRoot('qa_owner', val)}
                      placeholder="Select QA Owner"
                      showSelectedAvatar
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Reviewer" className="xl:col-span-2">
                    <SearchableDropdown
                      options={userOptions.map(opt => ({ ...opt, value: opt.label }))}
                      value={formData.details.reviewer}
                      onChange={(val) => updateDetail('reviewer', val)}
                      placeholder="Select Reviewer"
                      showSelectedAvatar
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Planned Start Date" className="xl:col-span-2">
                    <DatePicker style={{ width: '100%' }} value={formData.start_date} onChange={(v) => updateRoot('start_date', v)} />
                  </Field>
                  <Field label="Planned End Date" className="xl:col-span-2">
                    <DatePicker style={{ width: '100%' }} value={formData.end_date} onChange={(v) => updateRoot('end_date', v)} />
                  </Field>
                </div>

                {/* Description — AI actions sit on the label row, right aligned */}
                <div className="mt-4">
                  <div className="ts-editorhead">
                    <label className="ts-label" style={{ margin: 0 }}>Description</label>
                    <div className="flex items-center gap-2">
                      {hasPrime && (
                        <button
                          type="button"
                          className="ts-minibtn ts-minibtn--ai"
                          disabled={generatingDescription}
                          onClick={(e) => { e.preventDefault(); handleGenerateScopeWithAI('description'); }}
                        >
                          <Sparkles size={12} /> {generatingDescription ? 'Generating\u2026' : (prdDocumentId ? 'Create with Zai using PRD' : 'Create with Zai')}
                        </button>
                      )}
                      <Tooltip title={!(formData.details.description || '').trim() ? 'Write something first' : 'Fix grammar & typos — keeps your wording'}>
                        <button
                          type="button"
                          className="ts-minibtn"
                          disabled={polishingDescription || !(formData.details.description || '').trim()}
                          onClick={(e) => { e.preventDefault(); handlePolishDescription(); }}
                        >
                          <SpellCheck size={12} /> {polishingDescription ? 'Polishing…' : 'Grammar'}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  {/* autoSize keeps the whole description visible — AI output never scrolls out of view */}
                  <Input.TextArea
                    autoSize={{ minRows: 3 }}
                    placeholder="Brief description"
                    value={formData.details.description}
                    onChange={(e) => updateDetail('description', e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <p className="ts-hint">A short summary that helps a reviewer grasp the scope in one read.</p>
                </div>
              </SectionCard>

              {/* 02 — Product Information */}
              <SectionCard
                id="sec-product"
                index={2}
                icon={Target}
                title="Product Information"
                description="Which product areas this scope covers."
                badge={<CountPill n={(formData.details.modules?.length || 0)} noun="modules" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-4">
                  <Field
                    label="Product"
                    hint={loadingProjects
                      ? 'Loading your projects…'
                      : projectOptions.length > 0
                        ? `${projectOptions.length} active project${projectOptions.length === 1 ? '' : 's'} you belong to`
                        : 'No active projects found — type to enter one.'}
                  >
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.details.product}
                      onChange={v => updateDetail('product', v)}
                      placeholder="Select Product"
                      searchPlaceholder="Search your projects…"
                      itemNoun="projects"
                      loading={loadingProjects}
                      freeText
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Module" hint="Not in the list? Type it in the dropdown and pick “Use …”.">
                    <SearchableDropdown
                      mode="multiple"
                      options={allModuleOpts}
                      value={formData.details.modules}
                      onChange={v => updateDetail('modules', v)}
                      placeholder="Select or type Modules"
                      searchPlaceholder="Search or type a new module…"
                      itemNoun="modules"
                      freeText={true}
                      style={{ width: '100%' }}
                    />
                    <TokenList
                      values={formData.details.modules || []}
                      onRemove={(val) => updateDetail('modules', (formData.details.modules || []).filter((m: string) => m !== val))}
                    />
                  </Field>
                  <Field
                    label="Features"
                    hint={(formData.details.modules?.length > 0)
                      ? 'Suggestions follow your selected modules — typing adds a new one.'
                      : undefined}
                  >
                    <SearchableDropdown
                      mode="multiple"
                      options={allFeatureOpts}
                      value={formData.details.features}
                      onChange={v => updateDetail('features', v)}
                      placeholder={!(formData.details.modules?.length > 0) ? "Select a Module first" : "Select or type Features"}
                      searchPlaceholder="Search or type a new feature…"
                      itemNoun="features"
                      disabled={!(formData.details.modules?.length > 0)}
                      freeText={true}
                      style={{ width: '100%' }}
                    />
                    <TokenList
                      values={formData.details.features || []}
                      onRemove={(val) => updateDetail('features', (formData.details.features || []).filter((f: string) => f !== val))}
                    />
                  </Field>
                  <Field label="Sprint">
                    <SearchableDropdown
                      options={sprintOptions}
                      value={formData.details.sprint}
                      onChange={v => updateDetail('sprint', v)}
                      onSearch={fetchSprintsSearch}
                      placeholder="Select Sprint"
                      loading={loadingSprints}
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Release Version">
                    <Input
                      placeholder="e.g. v2.1.0"
                      value={formData.details.releaseVersion}
                      onChange={(e) => updateDetail('releaseVersion', e.target.value)}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* 03 — Requirement References */}
              <SectionCard
                id="sec-requirements"
                index={3}
                icon={Link2}
                title="Requirement References"
                description="Everything QA needs to understand the feature."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-4">
                  {/* The PRD is the one reference Zai can actually read, so it
                      can point at a Document Hub doc instead of a URL. Pasting a
                      link still works for PRDs that live elsewhere. */}
                  <Field label="PRD" className="md:col-span-2">
                    <div className="ts-prd">
                      <div className="ts-prd__modes">
                        {(['document', 'link'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            className={prdMode === m ? 'is-active' : ''}
                            onClick={() => setPrdMode(m)}
                          >
                            {m === 'document' ? 'Document Hub' : 'Link'}
                          </button>
                        ))}
                      </div>
                      <div className="ts-prd__control">
                      {prdMode === 'document' ? (
                        <SearchableDropdown
                          options={hubDocs.map((d: any) => ({
                            value: String(d.id),
                            label: d.title || 'Untitled document',
                            description: [d.hub_name, d.updated_at ? `updated ${new Date(d.updated_at).toLocaleDateString()}` : null].filter(Boolean).join(' \u00b7 '),
                          }))}
                          value={formData.details.reqReferences?.prdDocumentId || undefined}
                          onChange={(v: any) => {
                            const doc = hubDocs.find((d: any) => String(d.id) === v);
                            updateReqRef('prdDocumentId', v || '');
                            updateReqRef('prdDocumentTitle', doc?.title || '');
                            // Keep the link field in step so exports and the
                            // detail view still have somewhere to point.
                            updateReqRef('prd', v ? `/documenthub/${v}` : '');
                          }}
                          loading={loadingHubDocs}
                          placeholder={hubDocs.length ? 'Search documents\u2026' : 'No documents in the hub yet'}
                          itemNoun="documents"
                          hideAvatar
                          width={460}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <Input
                          placeholder="Paste PRD link"
                          value={formData.details.reqReferences?.prd}
                          onChange={e => {
                            updateReqRef('prd', e.target.value);
                            updateReqRef('prdDocumentId', '');
                            updateReqRef('prdDocumentTitle', '');
                          }}
                          prefix={<Link2 size={14} style={{ color: 'var(--ts-text-3)' }} />}
                          suffix={linkFieldSuffix(formData.details.reqReferences?.prd)}
                        />
                      )}
                      </div>
                    </div>
                  </Field>

                  {[
                    { key: 'figma', label: 'Figma' },
                    { key: 'apiDoc', label: 'API Documentation' },
                    { key: 'userStory', label: 'User Story' },
                    { key: 'epic', label: 'Epic' },
                  ].map(ref => (
                    <Field key={ref.key} label={ref.label}>
                      <Input
                        placeholder={`Paste ${ref.label} link`}
                        value={formData.details.reqReferences?.[ref.key]}
                        onChange={e => updateReqRef(ref.key, e.target.value)}
                        prefix={<Link2 size={14} style={{ color: 'var(--ts-text-3)' }} />}
                        suffix={linkFieldSuffix(formData.details.reqReferences?.[ref.key])}
                      />
                    </Field>
                  ))}
                  <Field label="Development Tickets">
                    <SearchableDropdown
                      mode="multiple"
                      freeText
                      options={devTickets.map(t => ({
                        label: `${t.ticketNumber || t.id.substring(0, 8)} - ${t.title}`,
                        value: String(t.id),
                        description: t.status || '',
                        badge: <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>T</span>
                      }))}
                      onSearch={fetchDevTicketsSearch}
                      loading={loadingDevTickets}
                      placeholder="Search or paste Tickets…"
                      value={
                        Array.isArray(formData.details.reqReferences?.devTicket)
                          ? formData.details.reqReferences.devTicket.map((t: any) => typeof t === 'string' ? t : String(t.link || t.id))
                          : formData.details.reqReferences?.devTicket
                            ? [String(formData.details.reqReferences.devTicket)]
                            : undefined
                      }
                      onChange={v => {
                        if (!v || v.length === 0) {
                          updateReqRef('devTicket', []);
                        } else {
                          const updated = v.map((idVal: string) => {
                            const selected = devTickets.find(t => String(t.id) === idVal);
                            if (selected) {
                              return {
                                name: `${selected.ticketNumber || selected.id.substring(0, 8)} - ${selected.title}`,
                                link: String(selected.id)
                              };
                            }
                            return { name: idVal, link: idVal };
                          });
                          updateReqRef('devTicket', updated);
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <label className="ts-label">Additional Documents</label>
                  <UploadZone
                    label="Additional Documents"
                    hint="Specs, notes, exports · max 50MB"
                    fileList={formData.details.reqReferences?.additionalDocs || []}
                    onChange={updateAdditionalDocs}
                  />
                  {(formData.details.reqReferences?.additionalDocs || []).length > 0 && (
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {(formData.details.reqReferences?.additionalDocs || []).map((file: any) => (
                        <FileRow
                          key={file.uid}
                          file={file}
                          thumb={<FileIcon size={16} />}
                          onRemove={() => handleRemoveAdditionalDoc(file.uid)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* 04 — Scope Definition */}
              <SectionCard
                id="sec-scope"
                index={4}
                icon={FileText}
                title="Scope Definition"
                description="Everything this scope covers — type / for blocks, select text for Zai."
                action={
                  <>
                    <button
                      type="button"
                      className="ts-minibtn"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExpandContent(); }}
                    >
                      <Maximize size={12} /> Expand
                    </button>

                    {/* Drafting from the PRD is the whole reason for linking one,
                        so it gets its own button rather than hiding inside the
                        generic Zai flow. With a PRD linked it opens a small
                        composer; without one it stays visible but disabled, since
                        a disabled control with a reason is how the option gets
                        discovered in the first place. */}
                    {hasPrime && (
                      prdDocumentId ? (
                      <Popover
                        open={prdPopoverOpen}
                        onOpenChange={(o) => {
                          setPrdPopoverOpen(o);
                          if (o) setPrdContext('');
                        }}
                        trigger="click"
                        placement="bottomRight"
                        arrow={false}
                        overlayClassName="zprd-pop"
                        content={
                          <div className="zprd" onClick={(e) => e.stopPropagation()}>
                            <div className="zprd__head">
                              <span className="zprd__orb"><Sparkles size={13} /></span>
                              <div className="zprd__headtext">
                                <div className="zprd__title">Create with Zai using PRD</div>
                                <div className="zprd__doc" title={prdDocumentTitle || undefined}>
                                  <FileText size={11} />
                                  <span>{prdDocumentTitle || 'Linked document'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="zprd__label">
                              Add context <span className="zprd__opt">optional</span>
                            </div>
                            <Input.TextArea
                              className="zprd__ta"
                              rows={3}
                              value={prdContext}
                              onChange={(e) => setPrdContext(e.target.value)}
                              placeholder="e.g. focus on the checkout flow, skip the admin screens"
                              onPressEnter={(e) => {
                                // Enter sends, Shift+Enter keeps writing.
                                if (!e.shiftKey) {
                                  e.preventDefault();
                                  handleGenerateFromPrd();
                                }
                              }}
                            />

                            <div className="zprd__foot">
                              <span className="zprd__hint">Zai reads the PRD — this only steers it.</span>
                              <Button
                                type="primary"
                                size="small"
                                loading={generatingInScope}
                                icon={!generatingInScope ? <Sparkles size={12} /> : null}
                                onClick={handleGenerateFromPrd}
                              >
                                Generate
                              </Button>
                            </div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          className="ts-minibtn ts-minibtn--ai"
                          disabled={generatingInScope}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <FileText size={12} /> {generatingInScope ? 'Generating…' : 'Create with Zai using PRD'}
                        </button>
                      </Popover>
                    ) : (
                      <Tooltip
                        placement="bottomRight"
                        overlayClassName="zprd-tip"
                        title={
                          <div className="zprd-tip__in">
                            <div className="zprd-tip__title">
                              <span className="zprd-tip__icon"><FileText size={12} /></span>
                              Needs a PRD from the Document Hub
                            </div>
                            <p className="zprd-tip__body">
                              Zai drafts this section from the document itself. Link one here to turn it on:
                            </p>
                            <div className="zprd-tip__path">
                              <span className="zprd-tip__step">Requirement References</span>
                              <span className="zprd-tip__sep">›</span>
                              <span className="zprd-tip__step">PRD</span>
                              <span className="zprd-tip__sep">›</span>
                              <span className="zprd-tip__step zprd-tip__step--goal">Document Hub</span>
                            </div>
                            <p className="zprd-tip__note">
                              <Link2 size={11} />
                              <span>A pasted link won&apos;t do — Zai can only read a document stored in the hub.</span>
                            </p>
                          </div>
                        }
                      >
                        {/* A disabled button fires no mouse events, so the tooltip
                            needs a wrapper that is still interactive. */}
                        <span style={{ display: 'inline-flex' }}>
                          <button type="button" className="ts-minibtn ts-minibtn--ai" disabled>
                            <FileText size={12} /> Create with Zai using PRD
                          </button>
                        </span>
                      </Tooltip>
                    ))}

                    {hasPrime && (() => {
                      const scopeVal = formData.details.inScope || '';
                      const hasContent = scopeVal.trim() !== '' && scopeVal !== '<p></p>';
                      return hasContent ? (
                        <Dropdown
                          menu={{
                            /* These stay PRD-free: in this section the PRD is
                               read only through the button that says so. */
                            items: [
                              {
                                key: 'optimize',
                                label: 'Optimize',
                                icon: <Wand2 size={14} />,
                                onClick: () => handleGenerateScopeWithAI('inScope', 'optimize', false)
                              },
                              {
                                key: 'enhance',
                                label: 'Enhance',
                                icon: <Sparkles size={14} />,
                                onClick: () => handleGenerateScopeWithAI('inScope', 'enhance', false)
                              },
                              {
                                key: 'regenerate',
                                label: 'Regenerate',
                                icon: <FileText size={14} />,
                                onClick: () => handleGenerateScopeWithAI('inScope', 'generate', false)
                              }
                            ]
                          }}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <button
                            type="button"
                            className="ts-minibtn ts-minibtn--ai"
                            disabled={generatingInScope}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <Sparkles size={12} /> {generatingInScope ? 'Working…' : 'ZAI Options'} <ChevronDown size={12} />
                          </button>
                        </Dropdown>
                      ) : (
                        <button
                          type="button"
                          className="ts-minibtn ts-minibtn--ai"
                          disabled={generatingInScope}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateScopeWithAI('inScope', 'generate', false); }}
                        >
                          <Sparkles size={12} /> {generatingInScope ? 'Generating…' : 'Create with ZAI'}
                        </button>
                      );
                    })()}
                  </>
                }
              >
                {isExpandDrawerVisible ? (
                  <div className="ts-docsurface ts-docsurface--inline ts-docsurface--paused" style={{ height: 420 }}>
                    <span>Editing in the expanded view…</span>
                  </div>
                ) : (
                  <ScopeDocEditor
                    key={`scope-${paneVersion}`}
                    ref={inScopeRef}
                    html={formData.details.inScope}
                    onChangeHtml={html => updateDetail('inScope', html)}
                    height={420}
                  />
                )}
              </SectionCard>

              {/* 05 — Testing Types */}
              <SectionCard
                id="sec-testing"
                index={5}
                icon={CheckSquare}
                title="Testing Types"
                description="Select every kind of testing this scope includes."
                badge={<CountPill n={formData.details.testingTypes?.length || 0} noun="selected" />}
                action={
                  <>
                    <button
                      type="button"
                      className="ts-minibtn"
                      onClick={() => updateDetail('testingTypes', allTestingTypes.every(t => (formData.details.testingTypes || []).includes(t)) ? [] : [...allTestingTypes])}
                    >
                      {allTestingTypes.every(t => (formData.details.testingTypes || []).includes(t)) ? 'Clear all' : 'Select all'}
                    </button>
                    <button
                      type="button"
                      className={`ts-minibtn${addingKind === 'testing' ? ' ts-minibtn--ai' : ''}`}
                      onClick={() => openCustomAdd('testing')}
                    >
                      <Plus size={12} /> Custom type
                    </button>
                  </>
                }
              >
                {addingKind === 'testing' && (
                  <InlineAdd
                    placeholder="e.g. Contract Testing, Chaos, Data Migration…"
                    value={customDraft}
                    onChange={setCustomDraft}
                    onAdd={() => commitCustomChip('testing')}
                    onCancel={cancelCustomAdd}
                  />
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                  {allTestingTypes.map(type => (
                    <Chip
                      key={type}
                      active={(formData.details.testingTypes || []).includes(type)}
                      onClick={() => toggleInArray('testingTypes', type)}
                      onRemove={customTestingTypes.includes(type) ? () => removeCustomChip('testing', type) : undefined}
                    >
                      {type}
                    </Chip>
                  ))}
                </div>
              </SectionCard>

              {/* 06 — Environment */}
              <SectionCard
                id="sec-environment"
                index={6}
                icon={Monitor}
                title="Environment Details"
                description="Where the testing runs and against which build."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-5 gap-y-4">
                  <Field label="Environment">
                    <SearchableDropdown
                      options={[{ label: 'Dev', value: 'Dev' }, { label: 'Staging', value: 'Staging' }, { label: 'Beta', value: 'Beta' }, { label: 'Production', value: 'Production' }]}
                      value={formData.details.environment?.type}
                      onChange={v => updateEnvironment('type', v)}
                      placeholder="Select Environment"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Build Version">
                    <Input placeholder="e.g. v1.0.45" value={formData.details.environment?.buildVersion} onChange={e => updateEnvironment('buildVersion', e.target.value)} />
                  </Field>
                  <Field label="API Version">
                    <Input placeholder="e.g. v2" value={formData.details.environment?.apiVersion} onChange={e => updateEnvironment('apiVersion', e.target.value)} />
                  </Field>
                  <Field label="Database">
                    <SearchableDropdown
                      options={[{ label: 'MySQL', value: 'MySQL' }, { label: 'PostgreSQL', value: 'PostgreSQL' }, { label: 'MongoDB', value: 'MongoDB' }, { label: 'Redis', value: 'Redis' }]}
                      value={formData.details.environment?.database}
                      onChange={v => updateEnvironment('database', v)}
                      placeholder="Select Database"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Browser">
                    <SearchableDropdown
                      mode="multiple"
                      options={browserListOptions}
                      value={formData.details.environment?.browser}
                      onChange={v => updateEnvironment('browser', v)}
                      placeholder="Select Browsers"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="OS">
                    <SearchableDropdown
                      mode="multiple"
                      options={osListOptions}
                      value={formData.details.environment?.os}
                      onChange={v => updateEnvironment('os', v)}
                      placeholder="Select OS"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Device" className="md:col-span-2">
                    <SearchableDropdown
                      mode="multiple"
                      options={[{ label: 'Desktop', value: 'Desktop' }, { label: 'Mobile', value: 'Mobile' }, { label: 'Tablet', value: 'Tablet' }]}
                      value={formData.details.environment?.device}
                      onChange={v => updateEnvironment('device', v)}
                      placeholder="Select or type devices"
                      style={{ width: '100%' }}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* 07 — Dependencies */}
              <SectionCard
                id="sec-dependencies"
                index={7}
                icon={AlertCircle}
                title="Dependencies"
                description="Things that must be ready before testing can start."
                badge={<CountPill n={formData.details.dependencies?.length || 0} noun="tracked" />}
              >
                {(formData.details.dependencies || []).length === 0 ? (
                  <div className="ts-empty">No dependencies yet — add the first one below.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(formData.details.dependencies || []).map((dep: any, idx: number) => (
                      <div className="ts-row" key={idx}>
                        <span className="ts-dot" style={{ background: depDotColor(dep.status) }} />
                        <span className="ts-row__text">{dep.name}</span>
                        <span className="ts-statuspill">{dep.status}</span>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 size={15} />}
                          onClick={() => {
                            const newDeps = [...(formData.details.dependencies || [])];
                            newDeps.splice(idx, 1);
                            updateDetail('dependencies', newDeps);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="ts-addbar flex-wrap">
                  <Input
                    placeholder="Dependency name (e.g. Payments API deployed to staging)"
                    value={newDepName}
                    onChange={(e) => setNewDepName(e.target.value)}
                    onPressEnter={() => {
                      if (newDepName.trim()) {
                        updateDetail('dependencies', [...(formData.details.dependencies || []), { name: newDepName.trim(), status: newDepStatus }]);
                        setNewDepName('');
                        setNewDepStatus('pending');
                      }
                    }}
                    style={{ flex: 1, minWidth: 220 }}
                  />
                  <SearchableDropdown
                    options={statusOptions}
                    value={newDepStatus}
                    onChange={val => setNewDepStatus(val)}
                    placeholder="Status"
                    style={{ width: 150 }}
                  />
                  <Button type="primary" ghost icon={<Plus size={14} />} onClick={() => {
                    if (newDepName.trim()) {
                      updateDetail('dependencies', [...(formData.details.dependencies || []), { name: newDepName.trim(), status: newDepStatus }]);
                      setNewDepName('');
                      setNewDepStatus('pending');
                    }
                  }}>Add</Button>
                </div>
              </SectionCard>

              {/* 08 — Acceptance Criteria */}
              <SectionCard
                id="sec-acceptance"
                index={8}
                icon={CheckCircle}
                title="Acceptance Criteria"
                description="Conditions the build must meet for this scope to pass."
                badge={<CountPill n={formData.details.acceptanceCriteria?.length || 0} noun="criteria" />}
                action={
                  (formData.details.acceptanceCriteria || []).length > 0 && (
                    <Popconfirm
                      title="Correct Grammar"
                      description="Do you want to correct the grammar?"
                      onConfirm={handleCorrectAcGrammar}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        size="small" 
                        type="default" 
                        icon={<CheckCircleOutlined />}
                        loading={isCorrectingAcGrammar}
                      >
                        Correct Grammar
                      </Button>
                    </Popconfirm>
                  )
                }
              >
                {(formData.details.acceptanceCriteria || []).length === 0 ? (
                  <div className="ts-empty">Nothing captured yet — type a criterion below and press Enter.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(formData.details.acceptanceCriteria || []).map((ac: any, idx: number) => {
                      const text = typeof ac === 'string' ? ac : ac.text;
                      return (
                        <div key={idx} className="ts-row">
                          <CheckCircle2 size={15} style={{ color: 'var(--ts-green)', flexShrink: 0 }} />
                          <span className="ts-row__text">{text}</span>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<Trash2 size={15} />}
                            onClick={() => {
                              const updated = [...(formData.details.acceptanceCriteria || [])];
                              updated.splice(idx, 1);
                              updateDetail('acceptanceCriteria', updated);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="ts-addbar">
                  <Input
                    prefix={<ListChecks size={14} style={{ color: 'var(--ts-text-3)' }} />}
                    placeholder="Type a criterion and press Enter…"
                    value={newAcInput}
                    onChange={(e) => setNewAcInput(e.target.value)}
                    onPressEnter={() => {
                      if (newAcInput.trim()) {
                        updateDetail('acceptanceCriteria', [...(formData.details.acceptanceCriteria || []), newAcInput.trim()]);
                        setNewAcInput('');
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button type="primary" ghost icon={<Plus size={14} />} onClick={() => {
                    if (newAcInput.trim()) {
                      updateDetail('acceptanceCriteria', [...(formData.details.acceptanceCriteria || []), newAcInput.trim()]);
                      setNewAcInput('');
                    }
                  }}>Add</Button>
                </div>
              </SectionCard>

              {/* 09 — Exit Criteria */}
              <SectionCard
                id="sec-exit"
                index={9}
                icon={Gauge}
                title="Exit Criteria"
                description="When is testing considered complete?"
                badge={<CountPill n={formData.details.exitCriteria?.length || 0} noun="selected" />}
                action={
                  <button
                    type="button"
                    className={`ts-minibtn${addingKind === 'exit' ? ' ts-minibtn--ai' : ''}`}
                    onClick={() => openCustomAdd('exit')}
                  >
                    <Plus size={12} /> Custom criterion
                  </button>
                }
              >
                {addingKind === 'exit' && (
                  <InlineAdd
                    placeholder="e.g. Performance budget met, Security sign-off received…"
                    value={customDraft}
                    onChange={setCustomDraft}
                    onAdd={() => commitCustomChip('exit')}
                    onCancel={cancelCustomAdd}
                  />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {allExitCriteria.map(type => (
                    <Chip
                      key={type}
                      active={(formData.details.exitCriteria || []).includes(type)}
                      onClick={() => toggleInArray('exitCriteria', type)}
                      onRemove={customExitCriteria.includes(type) ? () => removeCustomChip('exit', type) : undefined}
                    >
                      {type}
                    </Chip>
                  ))}
                </div>
              </SectionCard>

              {/* 10 — Linked Items */}
              <SectionCard
                id="sec-linked"
                index={10}
                icon={Layers}
                title="Linked Items"
                description="Connect related tickets, sheets, sprints and docs."
                action={
                  <button type="button" className="ts-minibtn" onClick={addCustomLink}>
                    <Plus size={12} /> Custom link
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  {SHOW_BUG_AND_TICKET_LINKS && (
                  <Field label="Linked Bug Sheets">
                    <SearchableDropdown
                      options={bugSheets.map(b => ({
                        label: b.name,
                        value: String(b.id),
                        description: b.folderName || 'Bug Sheet',
                        badge: <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>B</span>
                      }))}
                      value={formData.details.linkedItems?.bugSheets?.link ? String(formData.details.linkedItems.bugSheets.link) : undefined}
                      onChange={v => {
                        if (!v) {
                          updateLinkedItem('bugSheets', 'name', '');
                          updateLinkedItem('bugSheets', 'link', '');
                        } else {
                          const selected = bugSheets.find(b => String(b.id) === v);
                          if (selected) {
                            updateLinkedItem('bugSheets', 'name', selected.name);
                            updateLinkedItem('bugSheets', 'link', String(selected.id));
                          }
                        }
                      }}
                      onSearch={fetchBugSheetsSearch}
                      loading={loadingBugSheets}
                      placeholder="Search Bug Sheets…"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  )}

                  {SHOW_BUG_AND_TICKET_LINKS && (
                  <Field label="Linked Development Tickets">
                    <SearchableDropdown
                      mode="multiple"
                      freeText
                      options={devTickets.map(t => ({
                        label: `${t.ticketNumber || t.id.substring(0, 8)} - ${t.title}`,
                        value: String(t.id),
                        description: t.status || '',
                        badge: <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>T</span>
                      }))}
                      value={
                        Array.isArray(formData.details.linkedItems?.devTickets)
                          ? formData.details.linkedItems.devTickets.map((t: any) => String(t.link))
                          : formData.details.linkedItems?.devTickets?.link
                            ? [String(formData.details.linkedItems.devTickets.link)]
                            : undefined
                      }
                      onChange={(v: string[]) => {
                        if (!v || v.length === 0) {
                          updateLinkedItemArray('devTickets', []);
                        } else {
                          const updated = v.map((idVal) => {
                            const selected = devTickets.find(t => String(t.id) === idVal);
                            if (selected) {
                              return {
                                name: `${selected.ticketNumber || selected.id.substring(0, 8)} - ${selected.title}`,
                                link: String(selected.id)
                              };
                            }
                            return { name: idVal, link: idVal };
                          });
                          updateLinkedItemArray('devTickets', updated);
                        }
                      }}
                      onSearch={fetchDevTicketsSearch}
                      loading={loadingDevTickets}
                      placeholder="Search Dev Tickets…"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  )}

                  <Field label="Linked Sprints">
                    <SearchableDropdown
                      options={sprints.map(s => ({
                        label: s.name,
                        value: String(s.id || s.name),
                        description: s.description || '',
                        badge: <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>S</span>
                      }))}
                      value={formData.details.linkedItems?.sprints?.link ? String(formData.details.linkedItems.sprints.link) : undefined}
                      onChange={v => {
                        if (!v) {
                          updateLinkedItem('sprints', 'name', '');
                          updateLinkedItem('sprints', 'link', '');
                        } else {
                          const selected = sprints.find(s => String(s.id || s.name) === v);
                          if (selected) {
                            updateLinkedItem('sprints', 'name', selected.name);
                            updateLinkedItem('sprints', 'link', String(selected.id || selected.name));
                          }
                        }
                      }}
                      onSearch={fetchSprintsSearch}
                      loading={loadingSprints}
                      placeholder="Search Sprints…"
                      style={{ width: '100%' }}
                    />
                  </Field>

                  {/* Parent cases only. A parent stands for every child case
                      beneath it, so listing the children here would just be
                      noise the QA already covered by picking the parent. */}
                  <Field label="Linked Test Cases">
                    <SearchableDropdown
                      options={testCases.map((tc: any) => ({
                        label: tc.title || tc.name || tc.id,
                        value: String(tc.id),
                        description: [
                          tc.module_name && tc.module_name !== 'Unassigned' ? tc.module_name : null,
                          tc.feature,
                          `${tc.child_count ?? 0} case${Number(tc.child_count) === 1 ? '' : 's'}`,
                          tc.status,
                        ].filter(Boolean).join(' · '),
                        badge: <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>TC</span>
                      }))}
                      value={formData.details.linkedItems?.testCases?.link ? String(formData.details.linkedItems.testCases.link) : undefined}
                      onChange={v => {
                        if (!v) {
                          updateLinkedItem('testCases', 'name', '');
                          updateLinkedItem('testCases', 'link', '');
                        } else {
                          const selected = testCases.find((tc: any) => String(tc.id) === v);
                          if (selected) {
                            updateLinkedItem('testCases', 'name', selected.title || selected.name || selected.id);
                            updateLinkedItem('testCases', 'link', String(selected.id));
                          }
                        }
                      }}
                      onSearch={fetchTestCasesSearch}
                      loading={loadingTestCases}
                      placeholder="Search parent test cases…"
                      style={{ width: '100%' }}
                    />
                  </Field>

                  {/* Suites and runs are multi-select: a scope is normally
                      validated by several of each, and forcing one meant the
                      rest went unrecorded. Both read through a normaliser so
                      scopes saved under the old single-value shape still load. */}
                  <Field label="Linked Test Suites" className="md:col-span-2">
                    <SearchableDropdown
                      mode="multiple"
                      renderTags
                      options={testSuites.map((s: any) => ({
                        label: s.suite_name || 'Untitled suite',
                        value: String(s.id),
                        description: [
                          s.parent_title,
                          s.module_name && s.module_name !== 'Unassigned' ? s.module_name : null,
                          `${s.case_count ?? 0} case${Number(s.case_count) === 1 ? '' : 's'}`,
                        ].filter(Boolean).join(' \u00b7 '),
                        badge: (
                          <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>TS</span>
                        ),
                      }))}
                      value={asLinkedIds(formData.details.linkedItems?.testSuites)}
                      onChange={(v: string[]) =>
                        updateLinkedItemArray(
                          'testSuites',
                          (v || []).map((id) => {
                            const hit = testSuites.find((s: any) => String(s.id) === id);
                            return { name: hit?.suite_name || 'Untitled suite', link: id };
                          }),
                        )
                      }
                      onSearch={fetchTestSuitesSearch}
                      loading={loadingTestSuites}
                      placeholder={testSuites.length ? 'Search test suites\u2026' : 'No test suites created yet'}
                      itemNoun="suites"
                      /* The overlay takes this width verbatim \u2014 names plus their
                         scenario and case count need the room. */
                      width={560}
                      style={{ width: '100%' }}
                    />
                  </Field>

                  <Field label="Linked Test Runs" className="md:col-span-2">
                    <SearchableDropdown
                      mode="multiple"
                      renderTags
                      options={testRuns.map((r: any) => ({
                        label: r.run_name || 'Untitled run',
                        value: String(r.id),
                        description: [
                          r.suite_name,
                          r.execution_type,
                          r.total_cases !== undefined
                            ? `${r.passed_count ?? 0}/${r.total_cases ?? 0} passed`
                            : null,
                        ].filter(Boolean).join(' \u00b7 '),
                        badge: (
                          <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>TR</span>
                        ),
                      }))}
                      value={asLinkedIds(formData.details.linkedItems?.testRuns)}
                      onChange={(v: string[]) =>
                        updateLinkedItemArray(
                          'testRuns',
                          (v || []).map((id) => {
                            const hit = testRuns.find((r: any) => String(r.id) === id);
                            return { name: hit?.run_name || 'Untitled run', link: id };
                          }),
                        )
                      }
                      onSearch={fetchTestRunsSearch}
                      loading={loadingTestRuns}
                      placeholder={testRuns.length ? 'Search test runs\u2026' : 'No test runs recorded yet'}
                      itemNoun="runs"
                      width={560}
                      style={{ width: '100%' }}
                    />
                  </Field>
                </div>

                {(formData.details.linkedItems?.custom || []).length > 0 && (
                  <div className="mt-5 flex flex-col gap-3">
                    {(formData.details.linkedItems?.custom || []).map((item: any, idx: number) => (
                      <div key={`custom-${idx}`} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                        <Field label="Custom Label" className="sm:w-[26%]">
                          <Input placeholder="e.g. Wiki Page" value={item.label} onChange={e => updateCustomLink(idx, 'label', e.target.value)} />
                        </Field>
                        <Field label="Name" className="sm:w-[26%]">
                          <Input placeholder="Name" value={item.name} onChange={e => updateCustomLink(idx, 'name', e.target.value)} />
                        </Field>
                        <Field label="Link URL" className="flex-1">
                          <Input
                            placeholder="URL"
                            value={item.link}
                            onChange={e => updateCustomLink(idx, 'link', e.target.value)}
                            prefix={<Link2 size={14} style={{ color: 'var(--ts-text-3)' }} />}
                            suffix={linkFieldSuffix(item.link)}
                          />
                        </Field>
                        <Button danger icon={<Trash2 size={15} />} onClick={() => removeCustomLink(idx)} className="sm:mb-0" />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* 11 — Attachments */}
              <SectionCard
                id="sec-attachments"
                index={11}
                icon={Paperclip}
                title="Attachments"
                description="Screenshots, design files, sample data and reports."
                badge={
                  totalAttachments > 0
                    ? <CountPill n={totalAttachments} noun={`file${totalAttachments === 1 ? '' : 's'} · ${formatBytes(totalAttachmentSize)}`} />
                    : undefined
                }
                action={
                  <button
                    type="button"
                    className={`ts-minibtn${addingKind === 'attachment' ? ' ts-minibtn--ai' : ''}`}
                    onClick={() => openCustomAdd('attachment')}
                  >
                    <Plus size={12} /> Custom category
                  </button>
                }
              >
                {addingKind === 'attachment' && (
                  <InlineAdd
                    placeholder="e.g. Test Reports, Logs, Video Recordings…"
                    value={customDraft}
                    onChange={setCustomDraft}
                    onAdd={commitCustomAttachment}
                    onCancel={cancelCustomAdd}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
                  {allAttachmentFields.map((field) => (
                    <AttachmentBay
                      key={field.key}
                      field={field}
                      files={formData.details.attachments?.[field.key] || []}
                      isCustom={customAttachmentFields.some(f => f.key === field.key)}
                      onUpload={info => updateAttachmentFiles(field.key, info)}
                      onRemoveFile={uid => handleRemoveAttachment(field.key, uid)}
                      onClear={() => clearAttachmentCategory(field.key)}
                      onRemoveCategory={() => removeCustomAttachment(field.key)}
                      onPreview={(src, name) => setPreviewImg({ src, name })}
                    />
                  ))}
                </div>
              </SectionCard>

              {/* 12 — Approval Workflow */}
              <SectionCard
                id="sec-approval"
                index={12}
                icon={ShieldCheck}
                title="Approval Workflow"
                description="Route this scope to the right approver before execution."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-5 gap-y-4 items-end">
                  <Field label="Approver Position">
                    <SearchableDropdown
                      options={positionOptions}
                      value={formData.details.approvalWorkflow?.position}
                      onChange={(val) => {
                        setFormData((prev: any) => {
                          const newDetails = { ...prev.details };
                          newDetails.approvalWorkflow = { ...newDetails.approvalWorkflow, position: val, user: undefined };
                          return { ...prev, details: newDetails };
                        });
                      }}
                      placeholder="Select Position"
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Approver">
                    <SearchableDropdown
                      options={userOptions}
                      value={formData.details.approvalWorkflow?.user}
                      onChange={(val) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          details: {
                            ...prev.details,
                            approvalWorkflow: {
                              ...(prev.details.approvalWorkflow || {}),
                              user: val
                            }
                          }
                        }));
                      }}
                      placeholder="Select Approver"
                      showSelectedAvatar
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <Field label="Approval Status">
                    <SearchableDropdown
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' }
                      ]}
                      value={formData.details.approvalWorkflow?.status}
                      onChange={(val) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          details: {
                            ...prev.details,
                            approvalWorkflow: {
                              ...(prev.details.approvalWorkflow || {}),
                              status: val
                            }
                          }
                        }));
                      }}
                      placeholder="Status"
                      hideAvatar
                      style={{ width: '100%' }}
                    />
                  </Field>
                  <div>
                    <Button type="primary" block icon={<ShieldCheck size={15} />} style={{ height: 40 }} onClick={handleRequestApproval} loading={submitting}>
                      Request Approval
                    </Button>
                  </div>
                </div>
              </SectionCard>

              {/* Footer action strip */}
              <div className="flex items-center justify-between gap-4 flex-wrap px-1">
                <p className="text-[12px] m-0" style={{ color: 'var(--ts-text-3)' }}>
                  {isDirty ? 'Changes are kept in this tab until you save.' : 'No changes to save.'}
                </p>
                <div className="flex items-center gap-2.5">
                  <Button onClick={() => router.back()}>Cancel</Button>
                  <Button type="primary" icon={<Save size={15} />} onClick={handleSave} loading={submitting}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      <Drawer
        {...commonDrawerProps}
        onClose={closeExpandDrawer}
        open={isExpandDrawerVisible}
        width={980}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-slate-100)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-slate-900)' }}>Scope Definition</h2>
            <span className="ts-drawer-hint">Type <strong>/</strong> for blocks · select text for Zai</span>
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={closeExpandDrawer} />
        </div>
        <div style={{ height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
          {isExpandDrawerVisible && (
            <ScopeDocEditor
              html={formData.details.inScope}
              onChangeHtml={(html) => updateDetail('inScope', html)}
            />
          )}
        </div>
      </Drawer>

      <Modal
        title={null}
        open={isZaiModalVisible}
        onCancel={() => setIsZaiModalVisible(false)}
        width={800}
        footer={null}
        destroyOnHidden
        centered
        closable={false}
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(8, 12, 24, 0.55)' },
          content: { padding: 0, borderRadius: 22, overflow: 'hidden', background: 'transparent', boxShadow: '0 30px 80px rgba(8,12,24,0.45)' },
          body: { padding: 0 },
        }}
        wrapClassName="zai-modal-wrap"
      >
        <div className="zai-modal">
          {/* Hero */}
          <div className="zai-hero">
            <div className="zai-hero__bg" />
            <div className="zai-hero__content">
              <div className="zai-hero__brand">
                <div className="zai-orb">
                  <Sparkles size={20} />
                </div>
                <div className="zai-hero__title-wrap">
                  <div className="zai-hero__eyebrow">
                    <span className="zai-pill"><Zap size={10} strokeWidth={2.5} />ZAI · Smart Generation</span>
                  </div>
                  <h2 className="zai-hero__title">
                    Create with <span className="zai-grad">Zai</span>
                  </h2>
                  <p className="zai-hero__sub">
                    Describe what you want ZAI to generate for the {zaiTargetField ? ZAI_FIELD_LABEL[zaiTargetField] : ''} section.
                  </p>
                  {/* Which source Zai is working from is the one thing the user
                      cannot infer from the prompt box — so say it outright. */}
                  {zaiUsePrd && (
                    <p className="zai-hero__source">
                      <FileText size={11} />
                      Drafting from PRD: <strong>{prdDocumentTitle || 'linked document'}</strong>
                    </p>
                  )}
                </div>
              </div>
              <button className="zai-close" onClick={() => setIsZaiModalVisible(false)} aria-label="Close">×</button>
            </div>
          </div>

          {/* Body */}
          <div className="zai-body">
            {zaiView === 'prompt' ? (
              <>
                <div className="zai-prompt">
                  <div className="zai-prompt__label">
                    <Wand2 size={14} />
                    <span>Instruction</span>
                  </div>
                  <div className="zai-prompt__row">
                    <Input.TextArea
                      rows={2}
                      placeholder="e.g. Generate a bulleted list of features targeting the login workflow..."
                      value={zaiPrompt}
                      onChange={(e) => setZaiPrompt(e.target.value)}
                      className="zai-textarea"
                      bordered={false}
                    />
                    <Button
                      type="primary"
                      onClick={submitZaiPrompt}
                      loading={isZaiGenerating(zaiTargetField)}
                      className="zai-cta"
                      icon={!isZaiGenerating(zaiTargetField) ? <Sparkles size={14} /> : null}
                    >
                      {isZaiGenerating(zaiTargetField) ? 'Zai is thinking…' : 'Generate Content'}
                    </Button>
                  </div>

                  {/* Suggestions are prompt starters — meaningless on a PRD run,
                      where the document is the brief and the box only steers it. */}
                  <div className="zai-template-list" style={{ marginTop: 24, display: zaiUsePrd ? 'none' : undefined }}>
                    <div className="zai-template-list__heading">
                      <span className="zai-suggestions__label">Try one of these</span>
                    </div>
                    <div className="zai-template-grid">
                      {(zaiTargetField === 'description' ? [
                        { title: "Executive Summary", body: "Write a concise summary of what this release covers and why it is being tested, aimed at a reviewer who has not seen the feature before.", icon: '📝' },
                        { title: "Risk Framing", body: "Summarise the scope with an emphasis on the riskiest areas and what could break in production if they are not covered.", icon: '⚠️' },
                        { title: "Release Note Style", body: "Describe this test scope the way a release note would: what changed, which modules are affected, and how it will be validated.", icon: '🚀' },
                        { title: "Stakeholder Brief", body: "Write a short, non-technical description a product owner can read in one pass to understand what QA will verify.", icon: '🤝' }
                      ] : [
                        { title: "Edge Cases", body: "Generate a comprehensive bulleted list of edge cases for the login workflow, focusing on invalid inputs, timeout scenarios, and concurrent session handling.", icon: '📋' },
                        { title: "Performance", body: "Define performance boundaries and limits, including expected response times under peak load, database query optimization targets, and acceptable API latency thresholds.", icon: '⚡' },
                        { title: "Standard Workflows", body: "Outline standard login workflows, covering successful authentication paths, password reset flows, MFA integration steps, and SSO provider redirection sequences.", icon: '🔐' },
                        { title: "Security Requirements", body: "List security testing requirements focusing on vulnerability assessments, penetration testing for API endpoints, data encryption standards, and role-based access control.", icon: '🛡️' }
                      ]).map((t) => {
                        const active = zaiPrompt === t.body;
                        return (
                          <button
                            key={t.title}
                            type="button"
                            className={`zai-template-card ${active ? 'zai-template-card--active' : ''}`}
                            onClick={() => setZaiPrompt(t.body)}
                          >
                            <div className="zai-template-card__head">
                              <span className="zai-template-card__icon">{t.icon}</span>
                              <span className="zai-template-card__title">{t.title}</span>
                              <span className="zai-template-card__use">{active ? 'Selected' : 'Use this'}</span>
                            </div>
                            <p className="zai-template-card__body">{t.body}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="zai-compare">
                  <div className="zai-pane zai-pane--new" style={{ width: '100%' }}>
                    <div className="zai-pane__head" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="zai-pane__dot zai-pane__dot--new" />
                        <span className="zai-pane__title zai-pane__title--new">Zai&apos;s Generation</span>
                        <span className="zai-pane__badge">Ready</span>
                      </div>
                      <Button type="link" size="small" onClick={() => setZaiView('prompt')} style={{ padding: 0 }}>
                        Edit Prompt
                      </Button>
                    </div>
                    <div className="zai-pane__body zai-pane__body--new" style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto', padding: 24 }}>
                      <TiptapViewer content={zaiGeneratedContent} />
                    </div>
                  </div>
                </div>

                <div className="zai-footer">
                  <div className="zai-footer__hint">
                    Review the generated content. You can replace, append, or insert at cursor.
                  </div>
                  <div className="zai-footer__actions">
                    <Button icon={<Copy size={14} />} onClick={handleZaiCopy} className="zai-btn-ghost">Copy</Button>
                    <Button onClick={() => submitZaiPrompt()} loading={isZaiGenerating(zaiTargetField)} className="zai-btn-ghost">
                      Regenerate
                    </Button>
                    <Dropdown menu={{
                      items: [
                        { key: 'append', label: 'Append to end', onClick: () => handleZaiInsert('append') },
                        // Cursor insertion only applies to the rich-text panes
                        ...(zaiTargetField === 'description'
                          ? []
                          : [{ key: 'insert', label: 'Insert at cursor', onClick: () => handleZaiInsert('insert') }])
                      ]
                    }}>
                      <Button
                        type="primary"
                        onClick={() => handleZaiInsert('replace')}
                        className="zai-btn-apply"
                      >
                        Replace Content <ChevronDown size={14} style={{ marginLeft: 4 }} />
                      </Button>
                    </Dropdown>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
