"use client";

import React from "react";
import { FileText } from "lucide-react";
import TiptapViewer from "@/components/common/TiptapViewer";
import { TicketDetails } from "@/types/ticket";
import { SectionCard, EmptyState } from "./ticketDetailUI";

export default function TicketDescription({ ticket }: { ticket: TicketDetails }) {
  const hasContent = Boolean(
    ticket.description && String(ticket.description).replace(/<[^>]*>/g, "").trim().length > 0,
  );

  return (
    <SectionCard title="Description" icon={<FileText size={13} strokeWidth={2} />}>
      {hasContent ? (
        <div className="tdx-prose">
          <TiptapViewer content={ticket.description} minHeight={80} />
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={20} strokeWidth={1.6} />}
          title="No description yet"
          hint="Add context so anyone picking this up knows what to do."
        />
      )}

      <style jsx global>{`
        .tdx-prose {
          font-size: 13.5px;
          line-height: 1.7;
          color: var(--tdx-ink-2);
        }
        .tdx-prose h1,
        .tdx-prose h2,
        .tdx-prose h3,
        .tdx-prose h4 {
          color: var(--tdx-ink);
          letter-spacing: -0.012em;
          margin-top: 22px;
          margin-bottom: 6px;
        }
        .tdx-prose h1:first-child,
        .tdx-prose h2:first-child,
        .tdx-prose h3:first-child,
        .tdx-prose h4:first-child {
          margin-top: 0;
        }
        .tdx-prose h3,
        .tdx-prose h4 {
          font-size: 14px;
          font-weight: 650;
        }
        .tdx-prose p {
          margin: 0 0 10px;
        }
        .tdx-prose hr {
          border: none;
          border-top: 1px solid var(--tdx-line-soft);
          margin: 18px 0;
        }
        .tdx-prose a {
          color: var(--tdx-accent);
          text-decoration: none;
          border-bottom: 1px solid var(--tdx-accent-line);
        }
        .tdx-prose a:hover {
          border-bottom-color: var(--tdx-accent);
        }
        .tdx-prose code {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
          font-size: 12px;
          padding: 1px 5px;
          border-radius: 5px;
          background: var(--tdx-inset);
          border: 1px solid var(--tdx-line-soft);
          color: var(--tdx-ink);
        }
        .tdx-prose blockquote {
          margin: 12px 0;
          padding: 2px 0 2px 14px;
          border-left: 2px solid var(--tdx-accent-line);
          color: var(--tdx-ink-2);
        }
      `}</style>
    </SectionCard>
  );
}
