"use client";

import React from "react";
import dayjs from "dayjs";
import { SlidersHorizontal, Users } from "lucide-react";
import { TicketDetails } from "@/types/ticket";
import { getStatusLabel } from "@/utils/ticketUtils";
import { SectionCard, PropertyRow, Pill, PriorityMeter, PersonChip, statusTone } from "./ticketDetailUI";

const nameOf = (value: any): string | undefined => {
  if (!value) return undefined;
  return typeof value === "string" ? value : value?.name || undefined;
};

export function TicketProperties({ ticket }: { ticket: TicketDetails }) {
  const releasePlan = (ticket as any)?.releasePlan;

  return (
    <SectionCard title="Properties" icon={<SlidersHorizontal size={13} strokeWidth={2} />} flush>
      <div className="tdx-props tdx-props--padded">
        <PropertyRow label="Status">
          <Pill tone={statusTone(ticket.status)} strong>
            {getStatusLabel(ticket.status)}
          </Pill>
        </PropertyRow>
        <PropertyRow label="Priority">
          <PriorityMeter priority={ticket.priority} />
        </PropertyRow>
        <PropertyRow label="Project">
          <Pill tone="blue">{nameOf(ticket.project) || "Unassigned"}</Pill>
        </PropertyRow>
        <PropertyRow label="Platform">{ticket?.platform || <span className="tdx-muted">Not specified</span>}</PropertyRow>
        <PropertyRow label="Task type">{ticket?.type || <span className="tdx-muted">Not specified</span>}</PropertyRow>
        <PropertyRow label="Task level">{ticket?.taskLevel || <span className="tdx-muted">Not specified</span>}</PropertyRow>
        <PropertyRow label="Story points">
          {ticket?.storyPoint || 0}
          <span className="tdx-muted">/5</span>
        </PropertyRow>
        <PropertyRow label="Estimate">{ticket?.estimateHours || 0}h</PropertyRow>
        <PropertyRow label="Duration">
          {ticket?.startDate && ticket?.endDate ? (
            `${dayjs(ticket.startDate).format("MMM D")} – ${dayjs(ticket.endDate).format("MMM D, YYYY")}`
          ) : (
            <span className="tdx-muted">Not scheduled</span>
          )}
        </PropertyRow>
        {releasePlan && (
          <PropertyRow label="Release plan">
            <Pill tone="green">{releasePlan}</Pill>
          </PropertyRow>
        )}
      </div>

      <style jsx global>{`
        .tdx-props--padded {
          padding: 6px 0;
        }
        .tdx-props--padded .tdx-prop {
          border-radius: 0;
          margin: 0;
        }
        .tdx-muted {
          color: var(--tdx-ink-3);
          font-weight: 450;
        }
      `}</style>
    </SectionCard>
  );
}

export function TicketPeople({ ticket }: { ticket: TicketDetails }) {
  const assignee = ticket?.assignee as any;
  const createdBy = ticket?.createdBy as any;
  const reportTo = nameOf(ticket?.reportTo);

  return (
    <SectionCard title="People" icon={<Users size={13} strokeWidth={2} />} flush>
      <div className="tdx-props tdx-props--padded">
        <PropertyRow label="Assignee">
          <PersonChip name={assignee?.name} role={assignee?.position || "Member"} avatarUrl={assignee?.avatarUrl} />
        </PropertyRow>
        <PropertyRow label="Reports to">
          <PersonChip name={reportTo} role="Reviewer" fallbackLabel="Not assigned" />
        </PropertyRow>
        <PropertyRow label="Created by">
          <PersonChip name={createdBy?.name} role={createdBy?.position || "Member"} avatarUrl={createdBy?.avatarUrl} fallbackLabel="Unknown" />
        </PropertyRow>
        <PropertyRow label="Created">
          {ticket?.createdAt ? (
            dayjs(ticket.createdAt).format("MMM D, YYYY · HH:mm")
          ) : (
            <span className="tdx-muted">Unknown</span>
          )}
        </PropertyRow>
      </div>
    </SectionCard>
  );
}

export default TicketProperties;
