"use client";

/**
 * The whole create-ticket flow in ONE popup.
 *
 * A single antd Modal stays mounted for the entire journey; only the body
 * below the persistent wizard bar swaps as you move between steps. Nothing
 * closes and reopens, so switching destination (Zukvo ⇄ Linear) is just a
 * click on the "Destination" pill.
 *
 *   Step 1 Destination → Step 2 Method → Step 3 Compose
 */

import React, { useCallback, useEffect, useState } from "react";
import { useProduct } from "@/context/ProductContext";
import { Modal } from "antd";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import type { BugListItem } from "@/services/bugListService";
import { LinearService } from "@/services/linearService";
import { JiraService } from "@/services/jiraService";
import {
  ZukvoLogo,
  TestiezLogo,
  LinearMark,
  JiraMark,
  TicketFlowBar,
  ticketFlowModalProps,
  ticketFlowStyles,
  tfWrapClass,
  TICKET_FLOW_STEPS,
} from "./ticket-flow";
import DestinationStep from "./DestinationStep";
import BulkTicketModal, { ModePicker } from "./BulkTicketModal";
import AiReviewModal from "./AiReviewModal";
import { LinearTicketModal } from "./LinearTicketModal";
import { JiraTicketModal } from "./JiraTicketModal";

type Destination = "zukvo" | "linear" | "jira";
type Method = "manual" | "ai" | "map";

export interface CreateTicketWizardProps {
  open: boolean;
  onClose: () => void;
  /** The bugs the user selected in the table. */
  bugs: BugListItem[];
  /** Number of selected bugs — kept separate so step 1 can render before bugs resolve. */
  count: number;
  bugIds: string[];
  prefilledProjectId?: string;
  /** Fired after Linear successfully creates an issue. */
  onLinearSuccess: () => void;
  onManageIntegrations?: () => void;
}

export default function CreateTicketWizard({
  open,
  onClose,
  bugs,
  count,
  bugIds,
  prefilledProjectId,
  onLinearSuccess,
  onManageIntegrations,
}: CreateTicketWizardProps) {
  const { isTestiez } = useProduct();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Same plan gating BulkTicketModal applied to its own picker. Linear stays
  // ungated, as it was before the flow was merged into one popup.
  const hasPrime = !user?.subscriptionFeatures
    ? true
    : user.subscriptionFeatures.includes("work_qa_space_bug_list_prime");
  const hasGrid = !user?.subscriptionFeatures
    ? true
    : user.subscriptionFeatures.includes("work_qa_space_bug_list_grid");

  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState<Destination>("zukvo");
  const [method, setMethod] = useState<Method | null>(null);

  const [linearConnected, setLinearConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);

  // Every fresh open starts at the beginning.
  useEffect(() => {
    if (open) {
      setStep(0);
      setDestination("zukvo");
      setMethod(null);
      LinearService.getStatus().then(res => setLinearConnected(res.connected)).catch(() => setLinearConnected(false));
      JiraService.getStatus().then(res => setJiraConnected(res.connected)).catch(() => setJiraConnected(false));
    }
  }, [open]);

  const goToStep = useCallback((next: number) => {
    setStep(next);
    if (next < 2) setMethod(null);
  }, []);

  const pickDestination = (dest: Destination) => {
    setDestination(dest);
    setStep(1);
  };

  const pickMethod = (m: Method) => {
    setMethod(m);
    setStep(2);
  };

  const isLinear = destination === "linear";
  const isJira = destination === "jira";

  // Step 3 is the widest — the hand-pick workspace is two-pane.
  const width = step === 2 && destination === "zukvo" && method !== "ai" ? 1060 : 940;

  return (
    <Modal
      {...ticketFlowModalProps}
      open={open}
      onCancel={onClose}
      width={width}
      maskClosable={step === 0}
      wrapClassName={tfWrapClass(theme)}
    >
      <style>{ticketFlowStyles}</style>

      <div className="tf">
        <TicketFlowBar
          mark={isLinear ? <LinearMark size={18} /> : isJira ? <JiraMark size={18} /> : (isTestiez ? <TestiezLogo size={18} /> : <ZukvoLogo size={18} />)}
          label={step === 0 ? "Create tickets" : isLinear ? "Linear" : isJira ? "Jira" : (isTestiez ? "Testiez Tickets" : "Zukvo Tickets")}
          steps={TICKET_FLOW_STEPS}
          current={step}
          onStepClick={goToStep}
          onBack={step > 0 ? () => goToStep(step - 1) : undefined}
          onClose={onClose}
        />

        {step === 0 && (
          <DestinationStep
            count={count}
            onPick={pickDestination}
            onPickAi={(dest) => {
              setDestination(dest);
              setMethod("ai");
              setStep(2);
            }}
            onClose={onClose}
            onManageIntegrations={onManageIntegrations}
            linearConnected={linearConnected}
            jiraConnected={jiraConnected}
          />
        )}

        {step === 1 && (
          <ModePicker
            brand={destination}
            count={count}
            createdCount={0}
            onClose={onClose}
            onManual={() => pickMethod("manual")}
            onAi={() => pickMethod("ai")}
            onMap={() => pickMethod("map")}
            hideMap={isLinear || isJira}
            hasPrime={isLinear || isJira ? undefined : hasPrime}
            hasGrid={isLinear || isJira ? undefined : hasGrid}
          />
        )}

        {step === 2 && method === "ai" && (
          <AiReviewModal
            embedded
            open={open}
            onClose={onClose}
            bugs={bugs}
            integration={destination}
            projectId={prefilledProjectId}
          />
        )}

        {step === 2 && method !== "ai" && destination === "zukvo" && (
          <BulkTicketModal
            embedded
            forcedMode={method === "map" ? "map" : "manual"}
            open={open}
            bugs={bugs}
            prefilledProjectId={prefilledProjectId}
            onClose={onClose}
            onPickAi={() => pickMethod("ai")}
            onBack={() => goToStep(1)}
          />
        )}

        {step === 2 && method === "manual" && destination === "linear" && (
          <LinearTicketModal
            embedded
            open={open}
            onCancel={onClose}
            bugIds={bugIds}
            onSuccess={onLinearSuccess}
          />
        )}

        {step === 2 && method === "manual" && destination === "jira" && (
          <JiraTicketModal
            embedded
            open={open}
            onCancel={onClose}
            bugIds={bugIds}
            onSuccess={onLinearSuccess}
          />
        )}
      </div>
    </Modal>
  );
}
