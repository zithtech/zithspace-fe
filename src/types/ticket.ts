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

// Code Integration Types

export interface Repository {
  id: string;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketBranch {
  id: string;
  ticketId: string;
  repositoryId: string;
  name: string;
  url?: string;
  isDefault: boolean;
  repository?: Repository;
  createdAt: string;
}

export interface TicketPullRequest {
  id: string;
  ticketId: string;
  repositoryId: string;
  title?: string;
  url: string;
  branchName?: string;
  branchUrl?: string;
  number?: number;
  state: string;
  repository?: Repository;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCodeMetadata {
  branches: TicketBranch[];
  pullRequests: TicketPullRequest[];
}
