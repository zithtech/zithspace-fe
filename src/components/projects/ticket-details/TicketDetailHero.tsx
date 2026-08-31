"use client";

import React from "react";
import { Button, Tooltip } from "antd";
import { ArrowLeft, History, Pencil, Calendar, Clock3, Target, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { TicketDetails } from "@/types/ticket";
import { getStatusLabel } from "@/utils/ticketUtils";
import { Pill, PriorityMeter, PersonChip, statusTone } from "./ticketDetailUI";

interface TicketDetailHeroProps {
  ticket: TicketDetails;
  onEdit: () => void;
  onBack?: () => void;
  onOpenHistory?: () => void;
  canViewHistory?: boolean;
  isEditing?: boolean;
}

const projectName = (project: TicketDetails["project"]) =>
  typeof project === "string" ? project : project?.name || "Unassigned project";

export default function TicketDetailHero({
  ticket,
  onEdit,
  onBack,
  onOpenHistory,
  canViewHistory,
  isEditing,
}: TicketDetailHeroProps) {
  const router = useRouter();
  const handleBack = () => (onBack ? onBack() : router.back());

  const completed = Number((ticket as any).completedSteps || 0);
  const total = Number((ticket as any).totalSteps || 11);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const storyPoint = Number(ticket?.storyPoint || 0);
  const assignee = ticket?.assignee as any;

  const duration =
    ticket?.startDate && ticket?.endDate
      ? `${dayjs(ticket.startDate).format("MMM D")} – ${dayjs(ticket.endDate).format("MMM D, YYYY")}`
      : "Not scheduled";

  return (
    <>
      <div className="tdx-topbar">
        <div className="tdx-topbar__left">
          <button type="button" className="tdx-back" onClick={handleBack} aria-label="Go back">
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <nav className="tdx-crumbs" aria-label="Breadcrumb">
            <span className="tdx-crumbs__item">{projectName(ticket.project)}</span>
            <span className="tdx-crumbs__sep">/</span>
            <span className="tdx-crumbs__item tdx-crumbs__item--current">{ticket.ticketNumber}</span>
          </nav>
        </div>

        <div className="tdx-topbar__right">
          {canViewHistory && (
            <Tooltip title="Activity history">
              <Button className="tdx-ghost-btn" onClick={onOpenHistory} icon={<History size={14} strokeWidth={1.9} />}>
                History
              </Button>
            </Tooltip>
          )}
          {isEditing ? (
            <span className="tdx-editing-chip">
              <i /> Editing
            </span>
          ) : (
            <Button type="primary" className="tdx-primary-btn" onClick={onEdit} icon={<Pencil size={13} strokeWidth={2.1} />}>
              Edit ticket
            </Button>
          )}
        </div>
      </div>

      {!isEditing && (
      <header className="tdx-hero">
        <div className="tdx-hero__body">
          <div className="tdx-hero__eyebrow">
            <Pill mono strong tone="blue">
              {ticket.ticketNumber}
            </Pill>
            {ticket?.type && <Pill>{ticket.type}</Pill>}
            {ticket?.platform && <Pill>{ticket.platform}</Pill>}
            {ticket?.taskLevel && <Pill>{ticket.taskLevel}</Pill>}
          </div>

          <h1 className="tdx-hero__title">{ticket.title}</h1>

          <div className="tdx-hero__facts">
            <span className="tdx-fact">
              <span className={`tdx-status-dot tdx-status-dot--${statusTone(ticket.status)}`} />
              <Pill tone={statusTone(ticket.status)} strong>
                {getStatusLabel(ticket.status)}
              </Pill>
            </span>
            <span className="tdx-fact__divider" />
            <PriorityMeter priority={ticket.priority} />
            <span className="tdx-fact__divider" />
            <PersonChip
              name={assignee?.name}
              role={assignee?.position || "Member"}
              avatarUrl={assignee?.avatarUrl}
            />
          </div>
        </div>

        <div className="tdx-hero__stats">
          <div className="tdx-stat">
            <span className="tdx-stat__label">
              <Target size={12} strokeWidth={2} /> Story points
            </span>
            <span className="tdx-stat__value">
              {storyPoint}
              <em>/5</em>
            </span>
            <span className="tdx-stat__meter">
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className={n <= storyPoint ? "is-on" : ""} />
              ))}
            </span>
          </div>

          <div className="tdx-stat">
            <span className="tdx-stat__label">
              <Clock3 size={12} strokeWidth={2} /> Estimate
            </span>
            <span className="tdx-stat__value">
              {ticket?.estimateHours || 0}
              <em>h</em>
            </span>
            <span className="tdx-stat__sub">Planned effort</span>
          </div>

          <div className="tdx-stat">
            <span className="tdx-stat__label">
              <GitBranch size={12} strokeWidth={2} /> Workflow
            </span>
            <span className="tdx-stat__value">
              {completed}
              <em>/{total}</em>
            </span>
            <span className="tdx-stat__meter tdx-stat__meter--bar">
              <i style={{ width: `${pct}%` }} />
            </span>
          </div>

          <div className="tdx-stat">
            <span className="tdx-stat__label">
              <Calendar size={12} strokeWidth={2} /> Duration
            </span>
            <span className="tdx-stat__value tdx-stat__value--text">{duration}</span>
            <span className="tdx-stat__sub">
              Created {ticket?.createdAt ? dayjs(ticket.createdAt).format("MMM D, YYYY") : "—"}
            </span>
          </div>
        </div>
      </header>
      )}

      <style jsx global>{`
        /* ---------- Sticky command bar ---------- */
        .tdx-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          height: 56px;
          margin: 0 -28px 20px;
          padding: 0 28px;
          background: var(--tdx-canvas);
          background: color-mix(in srgb, var(--tdx-canvas) 82%, transparent);
          backdrop-filter: saturate(180%) blur(12px);
          -webkit-backdrop-filter: saturate(180%) blur(12px);
          border-bottom: 1px solid var(--tdx-line-soft);
        }
        .tdx-topbar__left,
        .tdx-topbar__right {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .tdx-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          border: 1px solid var(--tdx-line);
          background: var(--tdx-surface);
          color: var(--tdx-ink-2);
          cursor: pointer;
          transition: all 0.16s ease;
          flex-shrink: 0;
        }
        .tdx-back:hover {
          color: var(--tdx-accent);
          border-color: var(--tdx-accent-line);
          background: var(--tdx-accent-soft);
          transform: translateX(-1px);
        }
        .tdx-crumbs {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          font-size: 12.5px;
        }
        .tdx-crumbs__item {
          color: var(--tdx-ink-3);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tdx-crumbs__item--current {
          color: var(--tdx-ink);
          font-weight: 600;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
          font-size: 12px;
        }
        .tdx-crumbs__sep {
          color: var(--tdx-ink-3);
          opacity: 0.5;
        }

        .tdx-ghost-btn.ant-btn {
          height: 32px;
          border-radius: 9px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--tdx-ink-2);
          border-color: var(--tdx-line);
          background: var(--tdx-surface);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: none;
        }
        .tdx-ghost-btn.ant-btn:hover {
          color: var(--tdx-accent) !important;
          border-color: var(--tdx-accent-line) !important;
          background: var(--tdx-accent-soft) !important;
        }
        .tdx-editing-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--tdx-accent);
          background: var(--tdx-accent-soft);
          border: 1px solid var(--tdx-accent-line);
        }
        .tdx-editing-chip i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--tdx-accent);
          animation: tdxPulse 1.8s ease-in-out infinite;
        }

        .tdx-primary-btn.ant-btn {
          height: 32px;
          border-radius: 9px;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08), 0 4px 12px -4px rgba(59, 130, 246, 0.45);
        }

        /* ---------- Hero ---------- */
        .tdx-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
          background: var(--tdx-surface);
          border: 1px solid var(--tdx-line-soft);
          border-radius: 16px;
          box-shadow: var(--tdx-shadow);
          overflow: hidden;
          margin-bottom: 20px;
        }
        .tdx-hero::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: linear-gradient(180deg, var(--tdx-accent) 0%, var(--tdx-done) 100%);
          opacity: 0.9;
        }
        .tdx-hero__body {
          padding: 22px 24px 4px 27px;
        }
        .tdx-hero__eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .tdx-hero__title {
          margin: 0 0 16px;
          font-size: 26px;
          line-height: 1.28;
          font-weight: 680;
          letter-spacing: -0.022em;
          color: var(--tdx-ink);
          max-width: 46ch;
        }
        .tdx-hero__facts {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .tdx-fact {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .tdx-fact__divider {
          width: 1px;
          height: 18px;
          background: var(--tdx-line);
        }
        .tdx-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tdx-status-dot--blue {
          background: var(--tdx-accent);
          box-shadow: 0 0 0 3px var(--tdx-accent-soft);
        }
        .tdx-status-dot--green {
          background: var(--tdx-done);
          box-shadow: 0 0 0 3px var(--tdx-done-soft);
        }
        .tdx-status-dot--ash {
          background: var(--tdx-ink-3);
          box-shadow: 0 0 0 3px var(--tdx-inset);
        }

        /* ---------- Stat strip ---------- */
        .tdx-hero__stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-top: 1px solid var(--tdx-line-soft);
          background: var(--tdx-inset);
        }
        .tdx-stat {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 18px;
          border-right: 1px solid var(--tdx-line-soft);
          min-width: 0;
        }
        .tdx-stat:last-child {
          border-right: none;
        }
        .tdx-stat__label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--tdx-ink-3);
        }
        .tdx-stat__value {
          font-size: 19px;
          font-weight: 660;
          letter-spacing: -0.02em;
          color: var(--tdx-ink);
          line-height: 1.1;
        }
        .tdx-stat__value em {
          font-style: normal;
          font-size: 13px;
          font-weight: 500;
          color: var(--tdx-ink-3);
          margin-left: 1px;
        }
        .tdx-stat__value--text {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.005em;
          line-height: 1.35;
        }
        .tdx-stat__sub {
          font-size: 11px;
          color: var(--tdx-ink-3);
        }
        .tdx-stat__meter {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 4px;
        }
        .tdx-stat__meter i {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: var(--tdx-line);
        }
        .tdx-stat__meter i.is-on {
          background: var(--tdx-accent);
        }
        .tdx-stat__meter--bar {
          border-radius: 2px;
          background: var(--tdx-line);
          overflow: hidden;
        }
        .tdx-stat__meter--bar i {
          flex: none;
          background: linear-gradient(90deg, var(--tdx-accent) 0%, var(--tdx-done) 100%);
          transition: width 0.4s ease;
        }

        @media (max-width: 1100px) {
          .tdx-hero__stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .tdx-stat:nth-child(2n) {
            border-right: none;
          }
          .tdx-stat:nth-child(-n + 2) {
            border-bottom: 1px solid var(--tdx-line-soft);
          }
        }
        @media (max-width: 640px) {
          .tdx-topbar {
            margin: 0 -14px 16px;
            padding: 0 14px;
          }
          .tdx-hero__title {
            font-size: 21px;
          }
          .tdx-hero__body {
            padding: 18px 16px 4px 19px;
          }
        }
      `}</style>
    </>
  );
}
