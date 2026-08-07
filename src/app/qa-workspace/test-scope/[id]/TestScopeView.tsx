"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api as axios } from "@/lib/axios";
import { MembersService } from "@/services/membersService";
import { useTicketDrawer } from "@/context/TicketDrawerContext";

import {
  Target,
  FileText,
  CheckSquare,
  Check,
  Monitor,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  User,
  Layers,
  Activity,
  Tag,
  X,
  ZoomIn,
  Link2,
  ExternalLink,
} from "lucide-react";
import { InboxOutlined, DownOutlined, FilePdfOutlined } from "@ant-design/icons";
import { Drawer, Button, Dropdown, MenuProps, message } from "antd";
import { saveAs } from "file-saver";
import TiptapViewer from "@/components/common/TiptapViewer";

export function SectionTitle({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
        {icon && <span className="text-indigo-500">{icon}</span>}
        {title}
      </h2>
      {hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  hint,
  padded = true,
  allowBreak,
}: {
  title?: string;
  children: React.ReactNode;
  hint?: string;
  padded?: boolean;
  allowBreak?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm ${allowBreak ? '' : 'break-inside-avoid'}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</span>
          {hint ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
          ) : null}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

const hasContent = (html?: string) => !!(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/** Accept links pasted without a scheme so they still resolve. */
const normaliseUrl = (raw: string) => {
  const url = (raw || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const hostOf = (url: string) => {
  try { return new URL(normaliseUrl(url)).hostname.replace(/^www\./, ''); } catch { return url; }
};

/**
 * Rewrite well-known links to their embeddable form — plain share URLs from
 * Figma and Google Workspace refuse to render inside an iframe.
 */
const toEmbedUrl = (raw: string) => {
  const url = normaliseUrl(raw);
  try {
    const parsed = new URL(url);
    if (/(^|\.)figma\.com$/.test(parsed.hostname) && !parsed.pathname.startsWith('/embed')) {
      return `https://www.figma.com/embed?embed_host=zukvo&url=${encodeURIComponent(url)}`;
    }
    if (/(^|\.)docs\.google\.com$/.test(parsed.hostname)) {
      return url.replace(/\/(edit|view)(\?[^#]*)?(#.*)?$/, '/preview');
    }
  } catch {
    /* fall through to the raw url */
  }
  return url;
};

/**
 * Opens a reference link inside the page. Many sites send X-Frame-Options or a
 * frame-ancestors CSP, which we cannot detect directly — so if the frame never
 * reports a load we surface an "open in a new tab" fallback instead of a blank pane.
 */
function LinkPreviewDrawer({
  target, onClose,
}: { target: { label: string; url: string } | null; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const url = target ? normaliseUrl(target.url) : '';
  const embedUrl = target ? toEmbedUrl(target.url) : '';

  useEffect(() => {
    if (!target) return;
    setLoaded(false);
    setBlocked(false);
    const timer = setTimeout(() => setBlocked(prev => (prev ? prev : true)), 4500);
    return () => clearTimeout(timer);
  }, [target]);

  const showFallback = blocked && !loaded;

  return (
    <Drawer
      placement="right"
      width="72%"
      open={!!target}
      onClose={onClose}
      closable={false}
      styles={{ body: { padding: 0, background: 'var(--bg-pure-white)' }, header: { display: 'none' } }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.12em] font-semibold text-zinc-500 dark:text-zinc-400">
              {target?.label}
            </div>
            <div className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200" title={url}>
              {hostOf(url)}
            </div>
          </div>
          <Button
            size="small"
            onClick={() => { navigator.clipboard.writeText(url); message.success('Link copied'); }}
          >
            Copy link
          </Button>
          <Button size="small" type="primary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            Open in new tab
          </Button>
          <button
            onClick={onClose}
            className="ml-1 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950">
          {target && !showFallback && (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={target.label}
              className="h-full w-full border-0"
              onLoad={() => { setLoaded(true); setBlocked(false); }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          )}

          {target && !loaded && !showFallback && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              Loading preview…
            </div>
          )}

          {showFallback && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <ExternalLink size={22} className="text-zinc-400 dark:text-zinc-600" />
              <p className="m-0 max-w-md text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-medium">{hostOf(url)}</span> doesn&apos;t allow being embedded in another page.
              </p>
              <p className="m-0 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
                This is a restriction set by the site, not by Zukvo. Open it in a new tab to view the document.
              </p>
              <Button type="primary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
                Open in new tab
              </Button>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

/**
 * Scope Definition as one continuous document, matching the single-editor
 * create page. `outScope` is only surfaced for older scopes that were authored
 * when it was a separate field — new scopes never populate it.
 */
export function ScopeDocument({
  inScope, outScope, forExport,
}: { inScope?: string; outScope?: string; forExport?: boolean }) {
  const hasIn = hasContent(inScope);
  const hasLegacyOut = hasContent(outScope);

  if (!hasIn && !hasLegacyOut) {
    return (
      <div className={`rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/40 px-6 py-10 text-center ${forExport ? '' : 'break-inside-avoid'}`}>
        <FileText size={20} className="mx-auto mb-2 text-zinc-400 dark:text-zinc-600" />
        <p className="m-0 text-sm text-zinc-500 dark:text-zinc-400">No scope definition captured for this test scope.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden ${forExport ? '' : 'break-inside-avoid'}`}>
      {hasIn && (
        <div className="px-6 py-6 md:px-8 md:py-7">
          <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
            <TiptapViewer content={inScope || ''} />
          </div>
        </div>
      )}

      {hasLegacyOut && (
        <div className={hasIn ? "border-t border-zinc-200 dark:border-zinc-800" : ""}>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/80 px-6 py-2.5 md:px-8">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-zinc-500 dark:text-zinc-400">
              Out of Scope
            </span>
          </div>
          <div className="px-6 py-6 md:px-8 md:py-7">
            <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
              <TiptapViewer content={outScope || ''} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
        {/* Header bar */}
        <div className="flex items-center justify-between bg-zinc-900/95 px-4 py-2.5">
          <span className="text-sm font-medium text-zinc-200 truncate max-w-[60vw]">{name}</span>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {/* Image */}
        <div className="bg-zinc-950 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            className="max-w-[90vw] max-h-[80vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

/** Scroll-spy logic */
function getScrollParent(node: Element | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

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
      { root, rootMargin: `-${Math.round(offset)}px 0px -62% 0px`, threshold: 0 }
    );
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
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

    const target = root ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      target.removeEventListener("scroll", handleScroll);
    };
  }, [key, offset, root]);

  return active;
}

function SectionTabs({
  sections,
  activeId,
  offset,
  scrollRoot,
}: {
  sections: { id: string; label: string }[];
  activeId: string;
  offset: number;
  scrollRoot: HTMLElement | null;
}) {
  const navRef = useRef<HTMLElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const btn = btnRefs.current[activeId];
    if (btn) btn.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  useEffect(() => {
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleClick = (id: string) => {
    if (animRef.current != null) cancelAnimationFrame(animRef.current);

    const desired = offset + 12;
    const scroller: HTMLElement | Window = scrollRoot ?? window;
    const getTop = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY);
    const setTop = (top: number) =>
      scrollRoot ? scrollRoot.scrollTo({ top }) : window.scrollTo({ top });

    const targetFor = (el: HTMLElement): number => {
      const rootTop = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
      return getTop() + (el.getBoundingClientRect().top - rootTop - desired);
    };

    const cancel = () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      scroller.removeEventListener("wheel", cancel);
      scroller.removeEventListener("touchstart", cancel);
    };
    scroller.addEventListener("wheel", cancel, { passive: true });
    scroller.addEventListener("touchstart", cancel, { passive: true });

    let frames = 0;
    let settled = 0;
    const tick = () => {
      const el = document.getElementById(id);
      if (!el) {
        cancel();
        return;
      }
      const diff = targetFor(el) - getTop();
      frames += 1;
      if (Math.abs(diff) <= 1.5) {
        settled += 1;
        if (settled >= 5 || frames > 220) {
          setTop(getTop() + diff);
          cancel();
          return;
        }
      } else {
        settled = 0;
      }
      setTop(getTop() + diff * 0.2);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  return (
    <nav
      ref={navRef}
      className="flex gap-0.5 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sections.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            ref={(el) => {
              btnRefs.current[s.id] = el;
            }}
            onClick={() => handleClick(s.id)}
            className={[
              "relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
              active
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
            ].join(" ")}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function SectionAnchor({
  id,
  offset,
  children,
}: {
  id: string;
  offset: number;
  children: React.ReactNode;
}) {
  return (
    <div id={id} style={{ scrollMarginTop: offset + 12 }}>
      {children}
    </div>
  );
}

const SECTIONS = [
  { id: "product-info", label: "Product Information" },
  { id: "requirements", label: "Requirement References" },
  { id: "scope-def", label: "Scope Definition" },
  { id: "testing-types", label: "Testing Types" },
  { id: "environment", label: "Environment Details" },
  { id: "dependencies", label: "Dependencies" },
  { id: "acceptance", label: "Acceptance Criteria" },
  { id: "exit", label: "Exit Criteria" },
  { id: "linked-items", label: "Linked Items" },
  { id: "approver", label: "Approver" },
];

function HeaderChip({ icon, label, children }: { icon: React.ReactNode; label?: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400">
      {icon}
      {label && <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}:</span>}
      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{children}</span>
    </div>
  );
}

async function downloadTestScopePdf(scopeId: string, el: HTMLElement, fname: string) {
  const htmlPayload = el.outerHTML;
  const response = await axios.post(
    `/api/v2/qa/test-scopes/${scopeId}/export-pdf`,
    { htmlPayload },
    {
      responseType: "blob",
      timeout: 60000
    }
  );

  let blob = response.data;
  if (!(blob instanceof Blob)) {
    blob = new Blob([blob], { type: 'application/pdf' });
  }

  try {
    saveAs(blob, fname);
  } catch (err) {
    console.error("file-saver failed, using fallback:", err);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', fname);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

function DrawerTicketItem({ ticket }: { ticket: any }) {
  const [ticketData, setTicketData] = useState<any>(typeof ticket === 'object' ? ticket : null);

  useEffect(() => {
    if (typeof ticket === 'string') {
      axios.get(`/api/tickets/${ticket}`)
        .then((res: any) => {
          setTicketData(res.data?.data || res.data || { name: ticket });
        })
        .catch((err) => {
          console.error("Failed to fetch ticket:", err);
          setTicketData({ name: ticket });
        });
    } else {
      setTicketData(ticket);
    }
  }, [ticket]);

  if (!ticketData) {
    return <span className="text-sm font-medium text-zinc-500 animate-pulse">Loading ticket...</span>;
  }

  const titlePart = ticketData.title || ticketData.name || ticketData.link || ticketData.id || ticket;
  const displayText = ticketData.ticketNumber
    ? `${ticketData.ticketNumber} - ${titlePart}`
    : titlePart;

  return (
    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
      {displayText}
    </span>
  );
}

function TestScopeExport({
  data,
  sprintsMap,
  usersMap,
  positionsMap
}: {
  data: any;
  sprintsMap: Record<string, string>;
  usersMap: Record<string, string>;
  positionsMap: Record<string, string>;
}) {
  const d = data.details || {};
  return (
    <div className="bg-zinc-50 dark:bg-[#0B0F1A]">
      <div className="px-8 pt-8 pb-4">
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-slate-500 dark:text-slate-400">
              Test Scope {d.product ? `› ${d.product}` : ''}
            </div>
            <div className="mt-1.5 flex flex-col mb-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[19px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {data.name || "Test Scope Details"}
                </h1>
                <Tag color={data.status === 'Approved' ? 'green' : data.status === 'Rejected' ? 'red' : 'blue'}>
                  {data.status || 'Pending'}
                </Tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-4 space-y-6">
        <section className="space-y-4">
          <SectionTitle title="Product Information" icon={<Target size={18} />} />
          <Panel padded={false} allowBreak={false}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
              {[
                { label: 'Product', value: d.product || '—' },
                { label: 'Sprint', value: sprintsMap[d.sprint] || d.sprint || '—' },
                { label: 'Release Version', value: d.releaseVersion || '—' },
                { label: 'Modules', value: d.modules?.length ? d.modules.join(', ') : '—' },
                { label: 'Features', value: d.features?.length ? d.features.join(', ') : '—' },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</div>
                  <div className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{item.value}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Requirement References" icon={<Link2 size={18} />} />
          <Panel padded={false} allowBreak={false}>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
              {[
                { label: 'PRD', key: 'prd', text: 'View PRD' },
                { label: 'Figma', key: 'figma', text: 'View Figma' },
                { label: 'API Documentation', key: 'apiDoc', text: 'View API Doc' },
                { label: 'User Story', key: 'userStory', text: 'View User Story' },
                { label: 'Epic', key: 'epic', text: 'View Epic' },
                { label: 'Dev Ticket', key: 'devTicket', text: 'View Ticket' },
              ].map((field) => {
                const url = d.reqReferences?.[field.key];
                return (
                  <div key={field.key} className="px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{field.label}</div>
                    {field.key === 'devTicket' ? (
                      url && Array.isArray(url) && url.length > 0
                        ? (
                          <ul className="space-y-1">
                            {url.map((tk: any, i: number) => {
                              const titlePart = tk.title || tk.name || tk.link || tk.id || tk;
                              const displayText = tk.ticketNumber ? `${tk.ticketNumber} - ${titlePart}` : titlePart;
                              return (
                                <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                                  • {displayText}
                                </li>
                              );
                            })}
                          </ul>
                        )
                        : <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>
                    ) : (
                      url
                        ? <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">Link Attached</span>
                        : <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Scope Definition" icon={<FileText size={18} />} />
          <ScopeDocument inScope={d.inScope} outScope={d.outScope} forExport />
        </section>

        {d.testingTypes?.length > 0 && (
          <section className="space-y-4">
            <SectionTitle title="Testing Types" icon={<CheckSquare size={18} />} />
            <Panel allowBreak={false}>
              <div className="flex flex-wrap gap-2">
                {d.testingTypes.map((t: string) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {t}
                  </span>
                ))}
              </div>
            </Panel>
          </section>
        )}

        <section className="space-y-4">
          <SectionTitle title="Environment Details" icon={<Monitor size={18} />} />
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden break-inside-avoid">
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
              {[
                { label: 'Environment', value: d.environment?.type || '—' },
                { label: 'Build Version', value: d.environment?.buildVersion || '—' },
                { label: 'API Version', value: d.environment?.apiVersion || '—' },
                { label: 'Database', value: d.environment?.database || '—' },
                { label: 'Browser', value: d.environment?.browser?.length ? d.environment.browser.join(', ') : '—' },
                { label: 'OS', value: d.environment?.os?.length ? d.environment.os.join(', ') : '—' },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</div>
                  <div className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{item.value}</div>
                </div>
              ))}
            </div>
            {d.environment?.device?.length ? (
              <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-4">
                <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-2">Device</div>
                <div className="flex flex-wrap gap-2">
                  {d.environment.device.map((dev: string) => (
                    <span key={dev} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{dev}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Dependencies" icon={<AlertCircle size={18} />} />
          <Panel padded={false} allowBreak={false}>
            {d.dependencies?.length ? (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {d.dependencies.map((dep: any, i: number) => {
                  const statusColor =
                    dep.status === 'ready' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                      : dep.status === 'blocked' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
                  return (
                    <li key={i} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{dep.name}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>{dep.status}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No dependencies listed.</div>
            )}
          </Panel>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Acceptance Criteria" icon={<CheckCircle size={18} />} />
          <Panel padded={false} allowBreak={false}>
            {d.acceptanceCriteria?.length ? (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {d.acceptanceCriteria.map((ac: any, i: number) => {
                  const text = typeof ac === 'string' ? ac : ac.text;
                  return (
                    <li key={i} className="flex items-start gap-3 px-5 py-3">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-zinc-700 dark:text-zinc-300" />
                      <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">{text}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No acceptance criteria defined.</div>
            )}
          </Panel>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Exit Criteria" icon={<CheckCircle2 size={18} />} />
          <Panel allowBreak={false}>
            {d.exitCriteria?.length ? (
              <ul className="space-y-2">
                {d.exitCriteria.map((t: any, i: number) => {
                  const label = typeof t === 'string' ? t : (t.text || t.label || t.value || JSON.stringify(t));
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      <span className="mt-2 flex-shrink-0 w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            ) : <span className="text-sm text-zinc-400 dark:text-zinc-500">No exit criteria defined.</span>}
          </Panel>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Linked Items" icon={<Link2 size={18} />} />
          <Panel padded={false} allowBreak={false}>
            {(() => {
              const fields = [
                { key: 'testSuites', label: 'Test Suites' },
                { key: 'testCases', label: 'Test Cases' },
                { key: 'bugSheets', label: 'Bug Sheets' },
                { key: 'devTickets', label: 'Dev Tickets' },
                { key: 'sprints', label: 'Sprints' },
              ].filter(f => {
                const item = d.linkedItems?.[f.key];
                if (Array.isArray(item)) return item.length > 0;
                return item?.link || item?.name;
              });
              if (fields.length === 0) return <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No linked items.</div>;
              return (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {fields.map(field => {
                    const item = d.linkedItems?.[field.key];
                    const itemsArray = Array.isArray(item) ? item : [item];

                    return (
                      <li key={field.key} className="flex items-start gap-6 px-5 py-3">
                        <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 w-28 flex-shrink-0 mt-0.5">{field.label}</span>
                        <div className="flex flex-col gap-1">
                          {field.key === 'devTickets' ? (
                            <ul className="space-y-1">
                              {itemsArray.map((tk: any, i: number) => {
                                const titlePart = tk.title || tk.name || tk.link || tk.id || tk;
                                const displayText = tk.ticketNumber ? `${tk.ticketNumber} - ${titlePart}` : titlePart;
                                return (
                                  <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                                    • {displayText}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            itemsArray.map((it, idx) => (
                              <div key={idx}>
                                {it.link
                                  ? (it.name
                                    ? <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate block">{it.name}</span>
                                    : <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate block">{it.name}</span>)
                                  : <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate block">{it.name}</span>
                                }
                              </div>
                            ))
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </Panel>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Approver" icon={<CheckSquare size={18} />} />
          <Panel padded={false} allowBreak={false}>
            <div className="px-5 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1">
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 block mb-1.5">Approver</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                      <User size={14} />
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {d.approvalWorkflow?.user
                        ? (typeof d.approvalWorkflow.user === 'object'
                          ? (d.approvalWorkflow.user.name || d.approvalWorkflow.user.full_name)
                          : (usersMap[d.approvalWorkflow.user] || d.approvalWorkflow.user))
                        : "Not assigned"}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 block mb-1.5">Position / Role</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {d.approvalWorkflow?.position
                      ? (typeof d.approvalWorkflow.position === 'object'
                        ? d.approvalWorkflow.position.title
                        : (positionsMap[d.approvalWorkflow.position] || d.approvalWorkflow.position))
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 block mb-1.5">Status</span>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {d.approvalWorkflow?.status === 'approved' ? (
                      <><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-emerald-700 dark:text-emerald-400">Approved</span></>
                    ) : d.approvalWorkflow?.status === 'rejected' ? (
                      <><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className="text-rose-700 dark:text-rose-400">Rejected</span></>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-amber-700 dark:text-amber-400">Pending</span></>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <div className="pt-8 pb-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Generated from <span className="text-[#3b82f6]">Zukvo</span>
        </div>
      </div>
    </div>
  );
}

function TestScopeExportRunner({
  data,
  sprintsMap,
  usersMap,
  positionsMap,
  onDone,
}: {
  data: any;
  sprintsMap: Record<string, string>;
  usersMap: Record<string, string>;
  positionsMap: Record<string, string>;
  onDone: (ok: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ranRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      const el = ref.current;
      if (!el) {
        doneRef.current(false);
        return;
      }
      let ok = true;
      try {
        const safe = (data.name || "test-scope")
          .replace(/[^\w.-]+/g, "_")
          .replace(/^_+|_+$/g, "");
        const filename = `${safe || "test-scope"}.pdf`;

        // Wait a tiny bit for render
        await new Promise(r => setTimeout(r, 100));
        await downloadTestScopePdf(data.id, el, filename);
      } catch (err) {
        console.error("Test Scope export failed", err);
        ok = false;
      } finally {
        doneRef.current(ok);
      }
    })();
  }, [data]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: -10000,
        width: 1000,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <div ref={ref} className="bg-zinc-50 dark:bg-[#0B0F1A]">
        <TestScopeExport data={data} sprintsMap={sprintsMap} usersMap={usersMap} positionsMap={positionsMap} />
      </div>
    </div>
  );
}

export default function TestScopeView({ id }: { id: string }) {
  const { open: openTicketDrawer } = useTicketDrawer();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(148);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const [sprintsMap, setSprintsMap] = useState<Record<string, string>>({});
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [previewImg, setPreviewImg] = useState<{ src: string; name: string } | null>(null);
  const [devTicketsDrawerOpen, setDevTicketsDrawerOpen] = useState(false);
  const [drawerTickets, setDrawerTickets] = useState<any[]>([]);
  const [linkPreview, setLinkPreview] = useState<{ label: string; url: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const hideExportMsg = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Fetch Sprints
    axios.get("/api/release-plans").then((res: any) => {
      const data = Array.isArray(res) ? res : (res.data || []);
      const map: Record<string, string> = {};
      data.forEach((s: any) => { if (s.id) map[s.id] = s.name; });
      setSprintsMap(map);
    }).catch(console.error);

    // Fetch Positions
    axios.get('/api/positions').then((res: any) => {
      const data = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      const map: Record<string, string> = {};
      data.forEach((p: any) => { if (p.id) map[p.id] = p.title; });
      setPositionsMap(map);
    }).catch(console.error);

    // Fetch Users
    MembersService.getMembersForSelect().then((data: any[]) => {
      const map: Record<string, string> = {};
      data.forEach((u: any) => {
        if (u.value || u.id) {
          map[u.value || u.id] = u.label || u.name || u.full_name || u.email;
        }
      });
      setUsersMap(map);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    axios.get(`/api/v2/qa/test-scopes/${id}`)
      .then((res: any) => {
        if (active) setData(res.data?.data || res.data || res);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    setScrollRoot(getScrollParent(el));
    const update = () => setStickyH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const activeId = useScrollSpy(
    SECTIONS.map((s) => s.id),
    stickyH + 4,
    scrollRoot
  );

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading details...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load test scope details.</div>;
  }

  const d = data.details || {};

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const plannedRange =
    data.start_date || data.end_date
      ? `${formatDate(data.start_date) || 'TBD'} – ${formatDate(data.end_date) || 'TBD'}`
      : "Dates not set";

  const handleDownloadClick = () => {
    setIsExporting(true);
    hideExportMsg.current = message.loading("Preparing PDF...", 0);
  };

  const handleExportDone = (ok: boolean) => {
    hideExportMsg.current?.();
    hideExportMsg.current = null;
    if (ok) message.success("Download completed successfully.");
    else message.error("Couldn't generate the PDF");
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A]">
      {isExporting && (
        <TestScopeExportRunner
          data={data}
          sprintsMap={sprintsMap}
          usersMap={usersMap}
          positionsMap={positionsMap}
          onDone={handleExportDone}
        />
      )}
      {previewImg && (
        <ImageModal src={previewImg.src} name={previewImg.name} onClose={() => setPreviewImg(null)} />
      )}
      <div
        ref={stickyRef}
        className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0B0F1A]/90 backdrop-blur-md w-full"
      >
        <div className="mx-auto max-w-7xl px-6 pt-3 pb-2.5">
          {/* Back · breadcrumb · scope name · status — one line, all centred on
              a shared 32px axis so the mixed type sizes don't read as uneven. */}
          <div className="flex items-center gap-3 min-h-[32px]">
            <button
              onClick={() => router.push("/qa-workspace/test-scope")}
              className="inline-flex h-8 items-center gap-1.5 -ml-2 px-2 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <span className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-700 flex-shrink-0" />

            <div className="flex h-8 items-center gap-2 min-w-0 flex-1">
              <span className="hidden sm:inline-flex items-center text-[11px] leading-none uppercase tracking-[0.12em] font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
                Test Scope
              </span>
              {d.product ? (
                <>
                  <span className="hidden sm:inline-flex items-center text-slate-300 dark:text-slate-700 flex-shrink-0">›</span>
                  <span className="hidden sm:inline-flex items-center text-[11px] leading-none uppercase tracking-[0.12em] font-medium text-slate-700 dark:text-slate-300 flex-shrink-0 max-w-[180px] truncate">
                    {d.product}
                  </span>
                </>
              ) : null}
              <span className="hidden sm:inline-flex items-center text-slate-300 dark:text-slate-700 flex-shrink-0">›</span>
              <h1 className="m-0 text-[19px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-50 truncate">
                {data.name || "Test Scope Details"}
              </h1>
              <Tag
                color={data.status === 'Approved' ? 'green' : data.status === 'Rejected' ? 'red' : 'blue'}
                className="flex-shrink-0"
                style={{ margin: 0, lineHeight: '20px' }}
              >
                {data.status || 'Pending'}
              </Tag>
            </div>

            <Button
              type="primary"
              onClick={handleDownloadClick}
              loading={isExporting}
              icon={!isExporting && <FilePdfOutlined />}
              className="text-xs font-medium inline-flex items-center gap-1.5 flex-shrink-0"
              style={{ height: 32 }}
            >
              {isExporting ? "Downloading..." : "Download"}
            </Button>
          </div>

          <div className="mt-2.5 mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={<Calendar size={14} />} label="Planned">
                {plannedRange}
              </HeaderChip>
              {data.type ? (
                <HeaderChip icon={<Layers size={14} />}>
                  {data.type}
                </HeaderChip>
              ) : null}
              {data.priority ? (
                <HeaderChip icon={<Activity size={14} />} label="Priority">
                  <span className={data.priority === 'HIGH' ? 'text-rose-600 dark:text-rose-400' : ''}>{data.priority}</span>
                </HeaderChip>
              ) : null}
              {data.qa_owner ? (
                <HeaderChip icon={<User size={14} />} label="QA Owner">
                  {data.qa_owner}
                </HeaderChip>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200/70 dark:border-slate-800/70">
          <div className="mx-auto max-w-7xl">
            <SectionTabs
              sections={SECTIONS}
              activeId={activeId}
              offset={stickyH}
              scrollRoot={scrollRoot}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6 pb-24">

        <SectionAnchor id="product-info" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Product Information" icon={<Target size={18} />} />
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
                {[
                  { label: 'Product', value: d.product || '—' },
                  { label: 'Sprint', value: sprintsMap[d.sprint] || d.sprint || '—' },
                  { label: 'Release Version', value: d.releaseVersion || '—' },
                  { label: 'Modules', value: d.modules?.length ? d.modules.join(', ') : '—' },
                  { label: 'Features', value: d.features?.length ? d.features.join(', ') : '—' },
                ].map((item) => (
                  <div key={item.label} className="px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</div>
                    <div className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SectionAnchor>

        <SectionAnchor id="requirements" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Requirement References" icon={<Link2 size={18} />} />
            <Panel padded={false}>
              <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
                {[
                  { label: 'PRD', key: 'prd', text: 'View PRD' },
                  { label: 'Figma', key: 'figma', text: 'View Figma' },
                  { label: 'API Documentation', key: 'apiDoc', text: 'View API Doc' },
                  { label: 'User Story', key: 'userStory', text: 'View User Story' },
                  { label: 'Epic', key: 'epic', text: 'View Epic' },
                  { label: 'Dev Ticket', key: 'devTicket', text: 'View Ticket' },
                ].map((field) => {
                  const url = d.reqReferences?.[field.key];
                  return (
                    <div key={field.key} className="px-5 py-4">
                      <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{field.label}</div>
                      {field.key === 'devTicket' ? (
                        url && Array.isArray(url) && url.length > 0 ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDrawerTickets(url);
                              setDevTicketsDrawerOpen(true);
                            }}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            View Ticket
                          </button>
                        ) : <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>
                      ) : (
                        url ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              <Link2 size={13} className="text-zinc-400 dark:text-zinc-500" />
                              Link Attached
                            </span>
                            <button
                              onClick={() => setLinkPreview({ label: field.label, url })}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-400 dark:hover:border-blue-800 dark:hover:bg-blue-500/10"
                            >
                              <ExternalLink size={11} /> Open
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          </section>
        </SectionAnchor>

        <SectionAnchor id="scope-def" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Scope Definition" icon={<FileText size={18} />} />
            <ScopeDocument inScope={d.inScope} outScope={d.outScope} />
          </section>
        </SectionAnchor>

        <SectionAnchor id="testing-types" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Testing Types" icon={<CheckSquare size={18} />} />
            <Panel>
              {d.testingTypes?.length ? (
                <div className="flex flex-wrap gap-2">
                  {d.testingTypes.map((t: any) => {
                    const label = typeof t === 'string' ? t : (t.text || t.label || t.value || JSON.stringify(t));
                    return (
                      <span key={label} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        {label}
                      </span>
                    );
                  })}
                </div>
              ) : <span className="text-sm text-zinc-400 dark:text-zinc-500">No testing types specified.</span>}
            </Panel>
          </section>
        </SectionAnchor>

        <SectionAnchor id="environment" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Environment Details" icon={<Monitor size={18} />} />
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
                {[
                  { label: 'Environment', value: d.environment?.type || '—' },
                  { label: 'Build Version', value: d.environment?.buildVersion || '—' },
                  { label: 'API Version', value: d.environment?.apiVersion || '—' },
                  { label: 'Database', value: d.environment?.database || '—' },
                  { label: 'Browser', value: d.environment?.browser?.length ? d.environment.browser.join(', ') : '—' },
                  { label: 'OS', value: d.environment?.os?.length ? d.environment.os.join(', ') : '—' },
                ].map((item) => (
                  <div key={item.label} className="px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</div>
                    <div className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{item.value}</div>
                  </div>
                ))}
              </div>
              {d.environment?.device?.length ? (
                <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-2">Device</div>
                  <div className="flex flex-wrap gap-2">
                    {d.environment.device.map((dev: string) => (
                      <span key={dev} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{dev}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </SectionAnchor>

        <SectionAnchor id="dependencies" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Dependencies" icon={<AlertCircle size={18} />} />
            <Panel padded={false}>
              {d.dependencies?.length ? (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {d.dependencies.map((dep: any, i: number) => {
                    const statusColor =
                      dep.status === 'ready' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        : dep.status === 'blocked' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
                    return (
                      <li key={i} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{dep.name}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>{dep.status}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No dependencies listed.</div>
              )}
            </Panel>
          </section>
        </SectionAnchor>

        <SectionAnchor id="acceptance" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Acceptance Criteria" icon={<CheckCircle size={18} />} />
            <Panel padded={false}>
              {d.acceptanceCriteria?.length ? (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {d.acceptanceCriteria.map((ac: any, i: number) => {
                    const text = typeof ac === 'string' ? ac : ac.text;
                    const checked = typeof ac === 'string' ? false : ac.checked;
                    return (
                      <li key={i} className="flex items-start gap-3 px-5 py-3">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-zinc-700 dark:text-zinc-300" />
                        <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">{text}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No acceptance criteria defined.</div>
              )}
            </Panel>
          </section>
        </SectionAnchor>

        <SectionAnchor id="exit" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Exit Criteria" icon={<CheckCircle2 size={18} />} />
            <Panel>
              {d.exitCriteria?.length ? (
                <ul className="space-y-2">
                  {d.exitCriteria.map((t: any, i: number) => {
                    const label = typeof t === 'string' ? t : (t.text || t.label || t.value || JSON.stringify(t));
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        <span className="mt-2 flex-shrink-0 w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                        {label}
                      </li>
                    );
                  })}
                </ul>
              ) : <span className="text-sm text-zinc-400 dark:text-zinc-500">No exit criteria defined.</span>}
            </Panel>
          </section>
        </SectionAnchor>

        <SectionAnchor id="linked-items" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Linked Items" icon={<Link2 size={18} />} />
            <Panel padded={false}>
              {(() => {
                const fields = [
                  { key: 'testSuites', label: 'Test Suites' },
                  { key: 'testCases', label: 'Test Cases' },
                  { key: 'bugSheets', label: 'Bug Sheets' },
                  { key: 'devTickets', label: 'Dev Tickets' },
                  { key: 'sprints', label: 'Sprints' },
                ].filter(f => {
                  const item = d.linkedItems?.[f.key];
                  if (Array.isArray(item)) return item.length > 0;
                  return item?.link || item?.name;
                });
                if (fields.length === 0) return <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No linked items.</div>;
                return (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {fields.map(field => {
                      const item = d.linkedItems?.[field.key];
                      const itemsArray = Array.isArray(item) ? item : [item];

                      return (
                        <li key={field.key} className="flex items-start gap-6 px-5 py-3">
                          <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 w-28 flex-shrink-0 mt-0.5">{field.label}</span>
                          <div className="flex flex-col gap-1">
                            {field.key === 'devTickets' ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setDrawerTickets(itemsArray);
                                  setDevTicketsDrawerOpen(true);
                                }}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-left"
                              >
                                View Ticket
                              </button>
                            ) : (
                              itemsArray.map((it, idx) => (
                                <div key={idx}>
                                  {it.link
                                    ? (it.name
                                      ? <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate block">{it.name}</span>
                                      : <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium truncate block">Link Attached</span>)
                                    : <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate block">{it.name}</span>
                                  }
                                </div>
                              ))
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </Panel>
          </section>
        </SectionAnchor>

        <SectionAnchor id="approver" offset={stickyH}>
          <section className="space-y-4">
            <SectionTitle title="Approver" icon={<CheckSquare size={18} />} />
            <Panel padded={false}>
              <div className="px-5 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 block mb-1.5">Approver</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {d.approvalWorkflow?.user
                          ? (typeof d.approvalWorkflow.user === 'object'
                            ? (d.approvalWorkflow.user.name || d.approvalWorkflow.user.full_name)
                            : (usersMap[d.approvalWorkflow.user] || d.approvalWorkflow.user))
                          : "Not assigned"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 block mb-1.5">Position / Role</span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {d.approvalWorkflow?.position
                        ? (typeof d.approvalWorkflow.position === 'object'
                          ? d.approvalWorkflow.position.title
                          : (positionsMap[d.approvalWorkflow.position] || d.approvalWorkflow.position))
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 block mb-1.5">Status</span>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      {d.approvalWorkflow?.status === 'approved' ? (
                        <><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-emerald-700 dark:text-emerald-400">Approved</span></>
                      ) : d.approvalWorkflow?.status === 'rejected' ? (
                        <><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className="text-rose-700 dark:text-rose-400">Rejected</span></>
                      ) : (
                        <><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-amber-700 dark:text-amber-400">Pending</span></>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          </section>
        </SectionAnchor>

      </div>

      <Drawer
        title="Development Tickets"
        placement="right"
        width={400}
        onClose={() => setDevTicketsDrawerOpen(false)}
        open={devTicketsDrawerOpen}
      >
        <div className="flex flex-col gap-3">
          {drawerTickets.length > 0 ? (
            drawerTickets.map((ticket, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-2">
                <DrawerTicketItem ticket={ticket} />
              </div>
            ))
          ) : (
            <span className="text-sm text-zinc-500">No tickets selected.</span>
          )}
        </div>
      </Drawer>

      <LinkPreviewDrawer target={linkPreview} onClose={() => setLinkPreview(null)} />
    </div>
  );
}
