"use client";

import React from "react";
import { Check, Route } from "lucide-react";
import { TicketDetails } from "@/types/ticket";
import { SectionCard } from "./ticketDetailUI";

interface WorkflowProgressProps {
  ticket: TicketDetails;
}

const workflowSteps = [
  "Scope Document",
  "KT (Knowledge Transfer)",
  "Developer Doc",
  "Grooming",
  "Dev Code Work Effort",
  "Designer Approval",
  "Testing",
  "Unit Testing",
  "Code Review",
  "Push to Live",
  "Live Test",
];

const RING = { size: 54, stroke: 4 };

export default function WorkflowProgress({ ticket }: WorkflowProgressProps) {
  const completedSteps = Number((ticket as any).completedSteps || 0);
  const totalSteps = Number((ticket as any).totalSteps || workflowSteps.length);
  const pct = totalSteps > 0 ? Math.min(100, Math.round((completedSteps / totalSteps) * 100)) : 0;

  const radius = (RING.size - RING.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <SectionCard
      title="Workflow"
      icon={<Route size={13} strokeWidth={2} />}
      count={`${completedSteps}/${totalSteps}`}
    >
      <div className="tdx-wf__summary">
        <div className="tdx-ring" style={{ width: RING.size, height: RING.size }}>
          <svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`}>
            <circle
              cx={RING.size / 2}
              cy={RING.size / 2}
              r={radius}
              fill="none"
              strokeWidth={RING.stroke}
              className="tdx-ring__track"
            />
            <circle
              cx={RING.size / 2}
              cy={RING.size / 2}
              r={radius}
              fill="none"
              strokeWidth={RING.stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(-90 ${RING.size / 2} ${RING.size / 2})`}
              className="tdx-ring__value"
            />
          </svg>
          <span className="tdx-ring__label">{pct}%</span>
        </div>

        <div className="tdx-wf__summary-text">
          <span className="tdx-wf__headline">
            {completedSteps === 0
              ? "Not started"
              : completedSteps >= totalSteps
                ? "All steps complete"
                : workflowSteps[completedSteps] || "In progress"}
          </span>
          <span className="tdx-wf__sub">
            {completedSteps >= totalSteps
              ? `${totalSteps} of ${totalSteps} steps done`
              : `${totalSteps - completedSteps} step${totalSteps - completedSteps === 1 ? "" : "s"} remaining`}
          </span>
        </div>
      </div>

      <ol className="tdx-wf__list">
        {workflowSteps.map((step, index) => {
          const state = index < completedSteps ? "done" : index === completedSteps ? "current" : "todo";
          return (
            <li key={step} className={`tdx-wf__step is-${state}`}>
              <span className="tdx-wf__marker">
                {state === "done" ? <Check size={10} strokeWidth={3.2} /> : <i />}
              </span>
              <span className="tdx-wf__label">{step}</span>
              {state === "current" && <span className="tdx-wf__badge">Current</span>}
            </li>
          );
        })}
      </ol>

      <style jsx global>{`
        .tdx-wf__summary {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 16px;
          margin-bottom: 4px;
          border-bottom: 1px solid var(--tdx-line-soft);
        }
        .tdx-ring {
          position: relative;
          flex-shrink: 0;
        }
        .tdx-ring__track {
          stroke: var(--tdx-line);
        }
        .tdx-ring__value {
          stroke: var(--tdx-accent);
          transition: stroke-dasharray 0.5s ease;
        }
        .tdx-ring__label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--tdx-ink);
        }
        .tdx-wf__summary-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .tdx-wf__headline {
          font-size: 13px;
          font-weight: 650;
          color: var(--tdx-ink);
          letter-spacing: -0.01em;
        }
        .tdx-wf__sub {
          font-size: 11.5px;
          color: var(--tdx-ink-3);
        }

        .tdx-wf__list {
          list-style: none;
          margin: 0;
          padding: 4px 0 0;
          position: relative;
        }
        .tdx-wf__step {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px 6px 0;
          border-radius: 8px;
        }
        /* connector rail */
        .tdx-wf__step::before {
          content: "";
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 1.5px;
          background: var(--tdx-line);
        }
        .tdx-wf__step:first-child::before {
          top: 50%;
        }
        .tdx-wf__step:last-child::before {
          bottom: 50%;
        }
        .tdx-wf__step.is-done::before,
        .tdx-wf__step.is-current::before {
          background: var(--tdx-done);
        }
        .tdx-wf__step.is-current::before {
          background: linear-gradient(180deg, var(--tdx-done) 0%, var(--tdx-line) 55%);
        }
        .tdx-wf__step:first-child.is-current::before {
          background: var(--tdx-line);
        }

        .tdx-wf__marker {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--tdx-surface);
          border: 1.5px solid var(--tdx-line);
          color: transparent;
        }
        .tdx-wf__marker i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--tdx-line);
          display: block;
        }
        .tdx-wf__step.is-done .tdx-wf__marker {
          background: var(--tdx-done);
          border-color: var(--tdx-done);
          color: #fff;
        }
        .tdx-wf__step.is-current .tdx-wf__marker {
          border-color: var(--tdx-accent);
          box-shadow: 0 0 0 3px var(--tdx-accent-soft);
        }
        .tdx-wf__step.is-current .tdx-wf__marker i {
          background: var(--tdx-accent);
          animation: tdxPulse 1.8s ease-in-out infinite;
        }
        @keyframes tdxPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.65;
          }
        }

        .tdx-wf__label {
          font-size: 12.5px;
          color: var(--tdx-ink-3);
          line-height: 1.35;
        }
        .tdx-wf__step.is-done .tdx-wf__label {
          color: var(--tdx-ink-2);
        }
        .tdx-wf__step.is-current .tdx-wf__label {
          color: var(--tdx-ink);
          font-weight: 650;
        }
        .tdx-wf__badge {
          margin-left: auto;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--tdx-accent);
          background: var(--tdx-accent-soft);
          border: 1px solid var(--tdx-accent-line);
          padding: 2px 6px;
          border-radius: 5px;
          white-space: nowrap;
        }
      `}</style>
    </SectionCard>
  );
}
