// Ticket-related type definitions

export interface TicketDetailsProps {
  ticketId: string;
}

export interface TicketDetails {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  platform: string;
  stack?: string;
  project: string | {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  priority: string;
  type: string;
  taskLevel: string;
  status: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
  reportTo:
    | {
        id: string;
        name: string;
        position?: string;
      }
    | string;
  storyPoint?: number;
  estimateHours?: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  currentStep?: string;
  completedSteps?: number;
  totalSteps?: number;
  releasePlan?: string;
  // Archive fields
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: {
    id: string;
    name: string;
    email: string;
  };
  comments?: Array<{
    id: string;
    userId:
      | string
      | {
          id: string;
          name: string;
          email: string;
        };
    userName?: string;
    comment: string;
    timestamp: string;
  }>;
}

export interface TicketComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

export interface RelatedLinkFormData {
  description: string;
  url: string;
}

export type LinkType = "ui_design" | "scope_doc" | "sample_response" | "dev_doc";
