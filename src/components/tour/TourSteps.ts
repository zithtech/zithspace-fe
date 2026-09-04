import { Step } from 'react-joyride';

export interface RouteStep extends Step {
  route?: string;
  skipNextOnNext?: boolean;
  hideNextButton?: boolean;
  clickOnNext?: boolean;
  disableActive?: boolean;
  showProjectTourBtn?: boolean;
  showRoleTourBtn?: boolean;
  showOrgTourBtn?: boolean;
  spotlightClicks?: boolean;
}

export const qaWorkflowSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/qa-workspace/test-scope',
    title: 'Welcome to QA guide',
    content: 'This tour will walk you through the complete Quality Assurance lifecycle. You will learn how to define settings, write cases, execute runs, track bugs, and submit for final approval.\n\nBefore moving forward, make sure you have created your Project first; otherwise, you can view the Project Tour.',
    placement: 'center',
    showProjectTourBtn: true,
  },
  {
    target: '[data-tour="settings-scope-scope_type"], [data-tour="settings-scope-type"]',
    route: '/qa-workspace/settings',
    title: 'Scope Type',
    content: 'Configure different types of scopes (e.g. Web, Mobile, API, Security) to categorize your testing domains.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-scope-type-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Scope Type',
    content: 'Use this button to define a new Scope Type to categorize your Test Scopes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-scope-priority"]',
    route: '/qa-workspace/settings',
    title: 'Scope Priority',
    content: 'Customize priority levels (e.g. High, Medium, Low, Critical) for your Test Scopes to guide team focus.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-scope-priority-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Scope Priority',
    content: 'Use this button to add custom Priority designations for your Test Scopes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-scope-status"]',
    route: '/qa-workspace/settings',
    title: 'Scope Status',
    content: 'Define lifecycle status workflows for Test Scopes (e.g. Draft, In Progress, In Review, Ready).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-scope-status-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Scope Status',
    content: 'Use this button to configure new custom status stages for your Test Scopes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-cases-modules"], [data-tour="settings-cases"]',
    route: '/qa-workspace/settings',
    title: 'Test Case Modules',
    content: 'Manage the functional modules and components used to organize Test Cases into logical groups.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-module-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Module',
    content: 'Use this button to create and register a new functional module for your project.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-bug-severity"]',
    route: '/qa-workspace/settings',
    title: 'Bug Severity',
    content: 'Set up tenant-scoped bug severity options (e.g. Blocker, Critical, Major, Minor, Trivial) to evaluate defect impact.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-bug-severity-btn"], [data-tour="settings-create-bug-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Severity',
    content: 'Use this button to define a new Severity level for triage in the bug tracker.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-bug-type"]',
    route: '/qa-workspace/settings',
    title: 'Bug Type',
    content: 'Organize defect taxonomy across UI, Functional, Performance, Security, and API types.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-bug-type-btn"], [data-tour="settings-create-bug-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Bug Type',
    content: 'Use this button to add a new bug classification category tailored to your applications.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-bug-priority"]',
    route: '/qa-workspace/settings',
    title: 'Bug Priority',
    content: 'Define bug resolution priorities to communicate fix urgency across engineering teams.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-create-bug-priority-btn"], [data-tour="settings-create-bug-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Bug Priority',
    content: 'Use this button to define customized bug resolution priority options.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="test-scope"]',
    route: '/qa-workspace/test-scope',
    title: 'Create Scope',
    content: 'Define what needs to be tested based on the configurations you just reviewed. Test Scope establishes the requirements and areas that need QA validation.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="approvals-tab-scopes"]',
    route: '/qa-workspace/approvals',
    title: 'Scope Approval',
    content: 'Once a Test Scope is created, submit it for Manager review. Click here to open the Scope Approvals queue where managers can evaluate, approve, or request revisions.',
    placement: 'right',
    spotlightClicks: true,
    clickOnNext: true,
  },
  {
    target: '[data-tour="test-cases"]',
    route: '/qa-workspace/test-cases',
    title: 'Create Test Case',
    content: 'Create high-level parent Test Cases to organize testing for specific features or functional domains.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="create-module-case-btn"]',
    route: '/qa-workspace/test-cases',
    title: 'Module Test Cases',
    content: 'Inside each parent Test Case, create granular Module Test Cases with detailed preconditions, execution steps, and expected outcomes before assembling Test Suites.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="test-suites"]',
    route: '/qa-workspace/test-suites',
    title: 'Test Suites',
    content: 'Organize your related Test Cases into reusable suites for structured test execution.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="test-runs"]',
    route: '/qa-workspace/test-runs',
    title: 'Create Test Run',
    content: 'Execute your test suites and track live testing outcomes. Click here to initialize a new test execution run.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-run-details-btn"]',
    route: '/qa-workspace/test-runs',
    title: 'Execution & Case Details',
    content: 'Open the test run to inspect execution cases. Click "Details" to review preconditions, reproduction steps, and expected outcomes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-run-pass-btn"]',
    route: '/qa-workspace/test-runs',
    title: 'Mark as Passed',
    content: 'Click "Pass" when the observed application behavior successfully satisfies all test criteria and expected results.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-run-fail-btn"]',
    route: '/qa-workspace/test-runs',
    title: 'Mark as Failed',
    content: 'Click "Fail" if an error, broken flow, or deviation from expected behavior is observed during testing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-run-blocked-btn"]',
    route: '/qa-workspace/test-runs',
    title: 'Mark as Blocked',
    content: 'Click "Blocked" when third-party downtime, missing permissions, or upstream dependencies prevent executing this test case.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-run-fail-buglist"]',
    route: '/qa-workspace/test-runs',
    title: 'Add to Buglist',
    content: 'If any test case fails during execution, click "Add to Buglist" to immediately convert the failed test into a bug in your bug tracker.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-project-select"]',
    route: '/qa-workspace/bug-list',
    title: 'Choose Project',
    content: 'Select your active Project to view its associated bug collections, folders, sheets, and defect metrics.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="bug-create-folder-btn"]',
    route: '/qa-workspace/bug-list',
    title: 'Create Folder',
    content: 'Create organized folders and collections to group your bug sheets by release, sprint, or component.',
    placement: 'right',
  },
  {
    target: '[data-tour="bug-create-sheet-btn"]',
    route: '/qa-workspace/bug-list',
    title: 'Create Sheet',
    content: 'Add dedicated bug sheets inside folders to capture and triage defects for specific testing cycles.',
    placement: 'right',
  },
  {
    target: '[data-tour="bug-sheet-node"]',
    route: '/qa-workspace/bug-list',
    title: 'Select Sheet',
    content: 'Click on the sheet to open it. Selecting an active sheet displays its defect table and enables bug creation.',
    placement: 'right',
    spotlightClicks: true,
    clickOnNext: true,
  },
  {
    target: '[data-tour="bug-quick-add"]',
    route: '/qa-workspace/bug-list',
    title: 'Quick Add Bug',
    content: 'Type a bug title directly into this field and press Enter to instantly log a defect without opening a drawer.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="new-bug-btn"]',
    route: '/qa-workspace/bug-list',
    title: 'Full Bug Creation',
    content: 'Click "+ New Bug" to capture detailed defect reports including severity, reproduction steps, screenshots, logs, and module tagging.',
    placement: 'right',
  },
  {
    target: '[data-tour="bug-row-actions"], [data-tour="bug-list-table"]',
    route: '/qa-workspace/bug-list',
    title: 'Edit, Archive & Recurring',
    content: 'Manage the full bug lifecycle: edit details, mark defects as Recurring to preserve issue history across runs, or archive resolved bugs.',
    placement: 'left',
  },
  {
    target: '[data-tour="bug-list-ticket"]',
    route: '/qa-workspace/bug-list',
    title: 'Convert to Tickets',
    content: 'Convert bugs into actionable developer tickets using Manual entry, AI generation, or mapping to existing tasks.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-submission"]',
    route: '/qa-workspace/qa-submissions',
    title: 'QA Submission',
    content: 'Submit the completed QA cycle for review once testing and bug resolution are complete.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-signoff"]',
    route: '/qa-workspace/approvals',
    title: 'QA Sign-off',
    content: 'Complete the QA lifecycle with a formal sign-off once the required validation is complete.',
    placement: 'bottom',
  },
  {
    target: 'body',
    title: 'You are all set!',
    content: 'You are now ready to manage your entire QA lifecycle. Use these tools to ensure top-notch quality for your products.',
    placement: 'center',
  }
];

export const ticketsTourSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/dashboard',
    title: 'Welcome to Tickets & Sprints',
    content: 'This tour will guide you step by step through ticket configurations, sprint planning, and the complete task lifecycle. Before moving forward, make sure you have created your Project first; otherwise, you can view the Project Tour.',
    placement: 'center',
    showProjectTourBtn: true,
  },
  {
    target: '[data-tour="tickets-setting-platform"]',
    route: '/tickets/settings',
    title: 'Platforms Configuration',
    content: 'Configure core team platforms and delivery departments for your organization.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-create-platform-btn"]',
    route: '/tickets/settings',
    title: 'Add Platform',
    content: 'Use this button to add a new Platform option to your workspace.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-stack"]',
    route: '/tickets/settings',
    title: 'Technology Stacks',
    content: 'Manage available technology stacks used for project tagging and ticket filtering.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-create-stack-btn"]',
    route: '/tickets/settings',
    title: 'Add Technology Stack',
    content: 'Use this button to add a new Tech Stack classification.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-priority"]',
    route: '/tickets/settings',
    title: 'Priorities & Urgency',
    content: 'Define priority levels and visual indicators for your tickets.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-create-priority-btn"]',
    route: '/tickets/settings',
    title: 'Add Priority',
    content: 'Use this button to define a new Priority level for tickets.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-taskLevel"]',
    route: '/tickets/settings',
    title: 'Complexity & Story Points',
    content: 'Configure task difficulty levels and story point weighting for estimation.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-create-taskLevel-btn"]',
    route: '/tickets/settings',
    title: 'Add Complexity Level',
    content: 'Use this button to define a new task complexity rating.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-taskType"]',
    route: '/tickets/settings',
    title: 'Work Types',
    content: 'Define classifications for your tasks (e.g. Feature, Bug, Maintenance, Refactor).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-create-taskType-btn"]',
    route: '/tickets/settings',
    title: 'Add Work Type',
    content: 'Use this button to add a new Work Type categorization.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-status"]',
    route: '/tickets/settings',
    title: 'Lifecycle Statuses',
    content: 'Set up your workflow lifecycle stages (To Do, In Progress, Code Review, Completed).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-setting-create-status-btn"]',
    route: '/tickets/settings',
    title: 'Add Lifecycle Status',
    content: 'Use this button to define a new lifecycle status for your workflow.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-create-sprint"]',
    route: '/tickets/plans',
    title: 'Plan New Sprint',
    content: 'Click "Plan New Sprint" to start a new sprint cycle for your project with defined timelines and objectives.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-activate-sprint"]',
    route: '/tickets/plans',
    title: 'Activate Sprint',
    content: 'Click "Start Sprint" to activate your planned sprint. Note: Only one sprint can be active per project at any time. Complete your active sprint before activating another.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-project-view"]',
    route: '/tickets/select',
    title: 'Select Project & Sprint Board',
    content: 'Switch projects and access your active sprint board or backlog view.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-create"]',
    route: '/tickets/select',
    title: 'Create Tickets',
    content: 'Create tickets using Instant Creation for fast typing, Manual Creation for full details, or AI generation with Zai. Note: New tickets start in the Backlog by default.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-recent-created-btn"]',
    route: '/tickets/select',
    title: 'Created Ticket Overview',
    content: 'Click this created ticket button to immediately open its details drawer.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-drawer-add-sprint"]',
    route: '/tickets/select',
    title: 'Add to Sprint',
    content: 'Click "Add to Sprint" to immediately move this ticket from the backlog into your active sprint.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-drawer-create-doc"]',
    route: '/tickets/select',
    title: 'Create & Link Docs',
    content: 'Click "Create Doc" to link or generate a new Document Hub wiki, runbook, or technical spec for this ticket.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-drawer-share"]',
    route: '/tickets/select',
    title: 'Share Ticket',
    content: 'Copy and share the ticket link with teammates or external collaborators.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-drawer-details"]',
    route: '/tickets/select',
    title: 'Fill Ticket Details',
    content: 'Fill out your ticket specifications here — add detailed descriptions with Zai AI, set story points, assign developers, configure priorities, and create subtasks.',
    placement: 'center',
  },
  {
    target: '[data-tour="tickets-drawer-close"]',
    route: '/tickets/select',
    title: 'Close Details Drawer',
    content: 'Click the close button or click Next to save changes and return to your tickets board.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="topnav-time-tracker"]',
    title: 'Time Tracking in Top Navigation',
    content: 'Track work duration in real-time right from the top navigation bar. Click the tracker to open the popover, select your project and ticket, and start the timer.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-burndown"]',
    route: '/tickets/select',
    title: 'Sprint Burndown',
    content: 'Click here to view full reports of the sprint, track progress, and analyze velocity.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-trash-archive"]',
    route: '/tickets/select',
    title: 'Trash & Archive',
    content: 'Move completed or unwanted tickets to the Archive or Trash to maintain a clean board.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-buckets-create"]',
    route: '/tickets/buckets',
    title: 'Buckets',
    content: 'Buckets allow you to organize tasks outside of sprints. You can create them from the Buckets page or during sprint completion.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tickets-complete-sprint"]',
    route: '/tickets/select',
    title: 'Complete Sprint',
    content: 'When your sprint finishes, click "Complete Sprint" directly from the active sprint header to resolve remaining tasks and complete the sprint.',
    placement: 'bottom',
  },
  {
    target: 'body',
    title: 'You are all set!',
    content: 'You are now ready to manage your entire Project & Ticket lifecycle. Plan sprints, track progress, and ship with confidence!',
    placement: 'center',
  }
];

export const documentHubTourSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/documenthub',
    title: 'Welcome to Document Hub',
    content: 'Document Hub is your central knowledge base for engineering specs, architecture wikis, runbooks, and project documentation.',
    placement: 'center',
  },
  {
    target: '[data-tour="dochub-create-hub-btn"]',
    route: '/documenthub',
    title: 'Create Document Hub',
    content: 'Click here to create a new Document Hub. Start from scratch with a blank hub or generate a structured template with Zai AI.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-workspace-new-btn"]',
    title: 'Create Folders & Documents',
    content: 'Inside any hub, use "+ New" to organize content into nested folders and rich BlockNote documents with embeds, callouts, and diagrams.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-preview-btn"]',
    title: 'Preview & Split View',
    content: 'Easily switch between Edit, Preview, and Split views to review how your formatted markdown, media embeds, and tables look in real time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-history-btn"]',
    title: 'Version History',
    content: 'Access complete document revision history. Inspect previous versions, compare changes, and restore any earlier snapshot with 1 click.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-link-project"]',
    route: '/documenthub',
    title: 'Link Project',
    content: 'Attach your Document Hub to a specific project to group all relevant engineering specifications, wikis, and architecture docs.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-link-ticket"]',
    route: '/documenthub',
    title: 'Link Ticket',
    content: 'Associate your Document Hub directly with a ticket so developers and QA have immediate technical context right where they work.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-visibility-btn"]',
    route: '/documenthub',
    title: 'Manage Visibility',
    content: 'Set visibility levels to Public (accessible by everyone in the workspace) or Private (restricted to invited team members).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-share-btn"]',
    route: '/documenthub',
    title: 'Share & Collaborate',
    content: 'Share documentation with teammates, manage view or edit permissions, and generate shareable links for reviews.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-star-btn"]',
    route: '/documenthub',
    title: 'Star & Unstar Hubs',
    content: 'Star your most important or frequently visited document hubs to pin them to your favorites for instant 1-click access.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dochub-upload-import"]',
    route: '/documenthub',
    title: 'Cloud Import & Upload',
    content: 'Easily upload files from My Computer or import existing docs directly from Google Drive, Notion, Zoho WorkDrive, and Microsoft OneDrive.',
    placement: 'bottom',
  },
  {
    target: 'body',
    route: '/documenthub',
    title: 'You are all set with Document Hub!',
    content: 'You are ready to create, organize, and collaborate on documentation with your team!',
    placement: 'center',
  }
];

export const manualProjectTourSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/projects/manage',
    title: 'Welcome to Projects',
    content: 'Projects are the cornerstone of your workspace. Here you can organize deliverables, define milestones, manage teams, and plan sprints.',
    placement: 'center',
  },
  {
    target: '[data-tour="project-create-btn"]',
    route: '/projects/manage',
    title: 'Create Your Project',
    content: 'Click "+ Add Project" to open the creation drawer and configure your project workspace.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="project-form-details"]',
    title: 'Project Details & Code',
    content: 'Define your Project Name, unique uppercase issue key prefix (e.g. WEB or QA), status, and description.',
    placement: 'left',
  },
  {
    target: '[data-tour="project-form-team"]',
    title: 'Team & Responsibility',
    content: 'Assign the Project Manager/Lead and select team members who will have access to contribute and track work.',
    placement: 'left',
  },
  {
    target: '[data-tour="project-form-timeline"]',
    title: 'Timeline & Repositories',
    content: 'Set estimated start and completion dates and attach repository URLs (GitHub, GitLab) for code and commit tracking.',
    placement: 'left',
  },
  {
    target: '[data-tour="project-filters-btn"]',
    route: '/projects/manage',
    title: 'Filter & Search Projects',
    content: 'Quickly filter your projects by status (Planning, Active, Completed, On Hold), manager, and date ranges.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="project-row-actions"]',
    route: '/projects/manage',
    title: 'Project Actions (3-Dot Menu)',
    content: 'Click the 3-dot menu on any project to View the project overview board, Edit/Configure team settings, or safely Delete.',
    placement: 'left',
  },
  {
    target: 'body',
    route: '/projects/manage',
    title: 'Project Setup Ready!',
    content: 'You are now ready to manage your projects, plan sprints, and track deliverables with your team!',
    placement: 'center',
  }
];

export const importMigrationTourSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/integrations',
    title: 'Welcome to Integrations & Migration',
    content: 'Already using other tools? Seamlessly migrate your projects, issues, sprints, and calendars directly into your workspace.',
    placement: 'center',
  },
  {
    target: '[data-tour="integration-issue-trackers"]',
    route: '/integrations',
    title: 'Connect Jira or Linear',
    content: 'Connect your Atlassian Jira workspace (via Domain & API token) or Linear workspace (via OAuth / API Key) depending on what your team uses.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="integration-migration-btn"], [data-tour="integration-issue-trackers"]',
    route: '/integrations',
    title: 'Start Migration',
    content: 'Once connected, click "Start Migration" to import your boards, sprints, and issues. Migration takes a few minutes depending on your content size. You can skip or complete the tour while migration runs in the background!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="integration-mail-calendar"]',
    route: '/integrations',
    title: 'Mail & Calendar Sync',
    content: 'Connect Google Workspace, Microsoft 365, or Zoho Mail to sync all your team meetings, calendar events, and inboxes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="calendar-sync-btn"], [data-tour="calendar-create-event-btn"]',
    route: '/calendar',
    title: 'Calendar Sync & Event Scheduling',
    content: 'After connecting your provider, use the Sync button to fetch your latest calendar events and click "New event" to schedule meetings, invite attendees, and create video links.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="mail-compose-btn"], [data-tour="mail-sync-btn"], [data-tour="mail-connect-empty-btn"]',
    route: '/mail',
    title: 'Mailbox, Sync & Compose Mail',
    content: 'After connecting your mail provider from Integrations, use the Sync button to fetch incoming emails and click "Compose" to write and send messages with AI assistance.',
    placement: 'bottom',
  },
  {
    target: 'body',
    route: '/mail',
    title: 'You are all set with Integrations!',
    content: 'Your workspace is connected and ready to sync, communicate, and migrate data across all your favorite tools.',
    placement: 'center',
  }
];

export const adminSettingsTourSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/settings',
    title: 'Welcome to System Settings & Admin',
    content: 'This tour will guide you through setting up your workspace identity, company details, working shifts, mail integrations, AI configurations, and managing granular roles & permissions.',
    placement: 'center',
  },
  {
    target: '[data-tour="settings-tab-system"]',
    route: '/settings',
    title: 'System Information Tab',
    content: 'This tab houses your primary workspace identity, branding configurations, and regional preferences.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-company-name"]',
    route: '/settings',
    title: 'Company Name',
    content: 'Type and update your official company or workspace display name directly here.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-company-logo"]',
    route: '/settings',
    title: 'Company Logo',
    content: 'Upload and crop your brand logo. It will appear across top navigation, invoice exports, and outgoing emails.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-logo-crop-btn"], [data-tour="settings-company-logo"]',
    route: '/settings',
    title: 'Edit & Crop Logo',
    content: 'Click the edit icon to crop your logo, adjust dimensions, or remove backgrounds from your saved logo versions.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-save-branding-btn"]',
    route: '/settings',
    title: 'Save Changes',
    content: 'Click "Save Branding Changes" to apply and update your company name, active logo, and branding settings across the workspace.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-tab-company"]',
    route: '/settings',
    title: 'Company Details Tab',
    content: 'Switch to this tab to manage legal business entity records, office locations, and attendance shifts.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-company-details-card"]',
    route: '/settings',
    title: 'Company Details',
    content: 'Review and edit your registered legal company name, GST/Tax identification number, and official address.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-add-branch-btn"]',
    route: '/settings',
    title: 'Add Branch',
    content: 'Click "+ Add Branch" to add multiple regional offices and physical work locations for your team.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-tab-mail"]',
    route: '/settings',
    title: 'Mail Configuration Tab',
    content: 'Manage email dispatch channels, active senders, and outgoing communication settings.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-mail-active-sender"], [data-tour="settings-mail-connect-empty"]',
    route: '/settings',
    title: 'Active Sender',
    content: 'Select the active sender email account. You must connect your mail in Integrations first, and a verification email is sent to verify and activate your dispatch connection.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="settings-tab-ai"]',
    route: '/settings',
    title: 'AI Provider Tab',
    content: 'Manage your workspace AI intelligence models, provider keys, and generation settings.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="ai-settings-config-mode"]',
    route: '/settings',
    title: 'Configuration Mode',
    content: 'Choose between 2 available modes: 1) Platform Mode — use our built-in pre-configured AI models; or 2) Bring Your Own API Key (BYOK) — connect your own OpenAI, Anthropic, or Gemini API keys to control models, temperature, and tokens.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="ai-settings-bundled-model"]',
    route: '/settings',
    title: 'Bundled Model (Platform Mode)',
    content: 'In Platform mode, select a pre-configured bundled model to power all workspace writing assistance, summarization, and ticket intelligence.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="ai-settings-provider-credentials"], [data-tour="ai-mode-byo"]',
    route: '/settings',
    title: 'Provider & Credentials (BYOK Mode)',
    content: 'When selecting "Bring your own key", you can choose your provider (OpenAI, Anthropic, Gemini, DeepSeek, etc.) and paste your private API key.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="ai-settings-save-btn"]',
    route: '/settings',
    title: 'Save AI Configuration',
    content: 'Click "Save Configuration" to activate and persist your selected AI provider and model preferences.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: 'body',
    route: '/settings',
    title: 'You are all set with System Settings!',
    content: 'Your workspace settings, company structure, mail integrations, and AI configurations are now fully configured.',
    placement: 'center',
  }
];

export const rolesTourSteps: RouteStep[] = [
  {
    target: '[data-tour="roles-create-btn"]',
    route: '/roles',
    title: 'Create Custom Roles',
    content: 'Click "Create Role" to define new roles for departments, contractors, or specialized team leads with customized scopes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="roles-sidebar-views"]',
    route: '/roles',
    title: 'Roles & RBAC Overview',
    content: 'View and filter all workspace roles — categorized into built-in System roles and custom organizational roles.',
    placement: 'right',
  },
  {
    target: '[data-tour="roles-search-input"]',
    route: '/roles',
    title: 'Search & Quick Filters',
    content: 'Quickly find roles by name, slug, or description, and switch between List and Grid view formats.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="roles-table-perms"]',
    route: '/roles',
    title: 'Granular Permissions Matrix',
    content: 'Click "Edit permissions" on any role to open the access control drawer and configure create, read, update, and delete access across every module.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="roles-table-members"]',
    route: '/roles',
    title: 'Assign & Manage Members',
    content: 'Easily assign teammates to roles or update their assigned role directly from the Manage Members drawer.',
    placement: 'bottom',
  },
  {
    target: 'body',
    route: '/roles',
    title: 'You are all set with Roles & RBAC!',
    content: 'Your workspace custom roles, module access permissions, and member assignments are now configured.',
    placement: 'center',
  }
];

export const orgStructureTourSteps: RouteStep[] = [
  // 1. Greeting
  {
    target: 'body',
    route: '/org-structure/overview',
    title: 'Welcome to Organization Structure',
    content: 'Model and explore your complete company hierarchy — from employment types and seniority grades to departments, sub-departments, and positions.',
    placement: 'center',
  },
  // 2. Employment Type in side nav
  {
    target: '[data-tour="org-nav-employment-types"]',
    route: '/org-structure/overview',
    title: 'Employment Types Navigation',
    content: 'Access the Employment Types section to define contract arrangements like Full-Time, Part-Time, Contractor, and Intern.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 3. Open Employment Type & highlight create button
  {
    target: '[data-tour="org-employment-types-create-btn"]',
    route: '/org-structure/employment-types',
    title: 'Create Employment Type',
    content: 'Click "+ New Type" to add employment categories with customized rules and descriptions.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  // 4. Grades in side nav
  {
    target: '[data-tour="org-nav-grades"]',
    route: '/org-structure/employment-types',
    title: 'Grades Navigation',
    content: 'Switch to the Grades module to configure compensation bands and seniority tiers.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 5. Open Grades & highlight create button
  {
    target: '[data-tour="org-grades-create-btn"]',
    route: '/org-structure/grades',
    title: 'Create Grade',
    content: 'Click "+ New Grade" to define compensation tiers, seniority codes (e.g. G1, G2), and hierarchy levels.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  // 6. Departments in side nav
  {
    target: '[data-tour="org-nav-departments"]',
    route: '/org-structure/grades',
    title: 'Departments Navigation',
    content: 'Switch to Departments to manage functional business units and team divisions.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 7. Open Departments & highlight create button
  {
    target: '[data-tour="org-departments-create-btn"]',
    route: '/org-structure/departments',
    title: 'Create Department',
    content: 'Click "+ New Department" to establish core functional units like Engineering, Design, Sales, or HR.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  // 8. Sub-Departments in side nav
  {
    target: '[data-tour="org-nav-sub-departments"]',
    route: '/org-structure/departments',
    title: 'Sub-Departments Navigation',
    content: 'Switch to Sub-Departments to organize specialized pods and squads under parent departments.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 9. Open Sub-Departments & highlight create button
  {
    target: '[data-tour="org-sub-departments-create-btn"]',
    route: '/org-structure/sub-departments',
    title: 'Create Sub-Department',
    content: 'Click "+ New Sub-Department" to nest specialized pods and teams under parent departments.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  // 10. Positions in side nav
  {
    target: '[data-tour="org-nav-positions"]',
    route: '/org-structure/sub-departments',
    title: 'Positions Navigation',
    content: 'Switch to Positions to configure exact job designations and reporting roles.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 11. Open Positions & highlight create button
  {
    target: '[data-tour="org-positions-create-btn"]',
    route: '/org-structure/positions',
    title: 'Create Position',
    content: 'Click "+ New Position" to create specific job designations linked directly to a grade, department, and employment type.',
    placement: 'bottom',
    spotlightClicks: true,
  },
  // 12. Overview in side nav
  {
    target: '[data-tour="org-nav-overview"]',
    route: '/org-structure/positions',
    title: 'Overview Navigation',
    content: 'Return to the Overview dashboard to inspect your complete company hierarchy.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 13. Grade Distribution
  {
    target: '[data-tour="org-overview-grades-list"]',
    route: '/org-structure/overview',
    title: 'Grade Distribution',
    content: 'Select any seniority grade level on the left to inspect mapped positions, departments, and sub-department counts.',
    placement: 'right',
    spotlightClicks: true,
  },
  // 14. Hierarchy Visualization
  {
    target: '[data-tour="org-overview-tree"]',
    route: '/org-structure/overview',
    title: 'Hierarchy Visualization & Search',
    content: 'Expand the visual organizational chart to trace reporting relationships and search designations by title or department in real time.',
    placement: 'left',
  },
  // 15. Final Completion
  {
    target: 'body',
    route: '/org-structure/overview',
    title: 'You are all set with Org Structure!',
    content: 'Your company hierarchy, grades, departments, and position definitions are ready for employee assignments.',
    placement: 'center',
  }
];

export const membersTourSteps: RouteStep[] = [
  // Step 1: Greeting
  {
    target: 'body',
    route: '/members',
    title: 'Welcome to Members Directory',
    content: 'Manage your complete workspace team directory: onboard employees, configure access privileges, assign organizational positions, and set up working shifts.',
    placement: 'center',
  },
  // Step 2: Create Member button
  {
    target: '[data-tour="members-create-btn"]',
    route: '/members',
    title: 'Add Member',
    content: 'Click "+ Add Member" to open the member invitation drawer and onboard a new teammate to your organization.',
    placement: 'right',
    spotlightClicks: true,
  },
  // Step 3: Profile Details
  {
    target: '[data-tour="member-drawer-profile-details"]',
    route: '/members',
    title: 'Profile Details',
    content: 'Enter the teammate’s full name, official work email, personal email, and 10-digit contact phone number. If HRMS onboarding is enabled, you can also auto-populate details from an existing employee profile.',
    placement: 'left',
    spotlightClicks: true,
  },
  // Step 4: Access (with role tour & org tour jump buttons)
  {
    target: '[data-tour="member-drawer-access"]',
    route: '/members',
    title: 'Access, Roles & Positions',
    content: '• System & Custom Roles: Choose built-in System Roles (User, Admin, Super Admin). If you need custom roles with tailored permission policies, create them in the Roles & Permissions page (use the tour button below).\n\n• Positions & Hierarchy: Select an existing position mapped from your Org Structure (view tour below), or switch to "Custom Title" to type a specific job designation.\n\n• Reports To: Assign their direct reporting manager for workflow and approval hierarchies.',
    placement: 'left',
    spotlightClicks: true,
    showRoleTourBtn: true,
    showOrgTourBtn: true,
  },
  // Step 5: Schedule
  {
    target: '[data-tour="member-drawer-schedule"]',
    route: '/members',
    title: 'Schedule & Working Hours',
    content: 'Configure their work schedule: assign an attendance shift timing, select active working days of the week, set default status (Active / Inactive), and define minimum required working hours per day.',
    placement: 'left',
    spotlightClicks: true,
  },
  // Step 6: Choose which mail to send Welcome Notification
  {
    target: '[data-tour="member-drawer-welcome-notification"]',
    route: '/members',
    title: 'Welcome Notification Dispatch',
    content: 'Select whether the invitation email should be sent to their Work Email or Personal Email. A temporary password and onboarding link will be generated and dispatched so the member can set a new password on their first login.',
    placement: 'left',
    spotlightClicks: true,
  },
  // Step 7: Add member submit button
  {
    target: '[data-tour="member-drawer-submit-btn"]',
    route: '/members',
    title: 'Submit & Add Member',
    content: 'Click "Add Member" to save the member profile, provision their account in your database, and trigger the welcome notification email.',
    placement: 'top',
    spotlightClicks: true,
  },
  // Step 8: You can also make inactive
  {
    target: '[data-tour="members-table-status"], [data-tour="members-table"]',
    route: '/members',
    title: 'Active & Inactive Status',
    content: 'Manage member account availability directly from the directory table. You can switch members between Active and Inactive whenever an employee is on leave or offboards, instantly granting or revoking system access.',
    placement: 'bottom',
  },
  // Step 9: Actions
  {
    target: '[data-tour="members-table-actions"], [data-tour="members-table"]',
    route: '/members',
    title: 'Member Action Menu',
    content: 'Click the action menu (•••) on any row to edit member profile details, inspect complete transaction and audit history logs, or delete/move members to trash.',
    placement: 'left',
  },
  // Step 10: Filters
  {
    target: '[data-tour="members-sidebar-filters"], [data-tour="members-search-bar"]',
    route: '/members',
    title: 'Directory Filters & Search',
    content: 'Filter directory records instantly by Role, Position, or Reporting Manager from the sidebar, or use the top search bar to find members by name, email, or designation.',
    placement: 'right',
  },
  // Final Completion
  {
    target: 'body',
    route: '/members',
    title: 'You are all set with Members!',
    content: 'Your workspace team directory, user roles, working shifts, and member access management are now completely configured and ready for collaboration.',
    placement: 'center',
  }
];



