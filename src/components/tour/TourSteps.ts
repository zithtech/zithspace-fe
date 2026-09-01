import { Step } from 'react-joyride';

export interface RouteStep extends Step {
  route?: string;
  skipNextOnNext?: boolean;
}

export const qaWorkflowSteps: RouteStep[] = [
  {
    target: 'body',
    route: '/qa-workspace/test-scope',
    title: 'Welcome to QA guide',
    content: 'This tour will walk you through the complete Quality Assurance lifecycle. You will learn how to define settings, write cases, execute runs, track bugs, and submit for final approval.',
    placement: 'center',
  },
  {
    target: '[data-tour="settings-scope-type"]',
    route: '/qa-workspace/settings',
    title: 'Scope Type',
    content: 'Click "Scope Type" in the sidebar to view the scope configurations.',
    placement: 'right',
    skipNextOnNext: true,
  },
  {
    target: '[data-tour="settings-create-btn"]', // The "+ New Scope Type" button
    route: '/qa-workspace/settings',
    title: 'Create Scope Type',
    content: 'Use this button to define a new Scope Type to categorize your Test Scopes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-scope-priority-status"]',
    route: '/qa-workspace/settings',
    title: 'Priority & Status',
    content: 'You can also customize the Priorities and Statuses for your Test Scopes here.',
    placement: 'right',
    skipNextOnNext: true,
  },
  {
    target: '[data-tour="settings-create-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Priority/Status',
    content: 'Use this button to add a new Priority or Status to your Test Scopes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-cases"]',
    route: '/qa-workspace/settings',
    title: 'Modules',
    content: 'Manage the Modules used to organize your Test Cases here.',
    placement: 'right',
    skipNextOnNext: true,
  },
  {
    target: '[data-tour="settings-create-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Module',
    content: 'Use this button to add a new Module to your project.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-bugs"]',
    route: '/qa-workspace/settings',
    title: 'Bug Definitions',
    content: 'Define the default Bug properties (Severity, Type, Priority). Default templates are already created for you!',
    placement: 'right',
    skipNextOnNext: true,
  },
  {
    target: '[data-tour="settings-create-btn"]',
    route: '/qa-workspace/settings',
    title: 'Create Bug Definition',
    content: 'Use this button to define a new Severity, Type, or Priority for your Bugs.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="test-scope"]',
    route: '/qa-workspace/test-scope',
    title: 'Create Scope',
    content: 'Define what needs to be tested based on the configurations you just reviewed. Test Scope establishes the requirements and areas that need QA validation.',
    placement: 'right',
  },
  {
    target: '[data-tour="test-cases"]',
    route: '/qa-workspace/test-cases',
    title: 'Test Cases & Module Cases',
    content: 'Create the parent test scenarios. Once you create a case, you can add detailed Module Test Cases inside it to define specific step-by-step instructions.',
    placement: 'right',
  },
  {
    target: '[data-tour="test-suites"]',
    route: '/qa-workspace/test-suites',
    title: 'Test Suites',
    content: 'Organize your related Test Cases into reusable suites for structured test execution.',
    placement: 'right',
  },
  {
    target: '[data-tour="test-runs"]',
    route: '/qa-workspace/test-runs',
    title: 'Test Runs',
    content: 'Execute your suites and record outcomes. If a run fails, the failed case is automatically logged as a bug in the Bug List.',
    placement: 'right',
  },
  {
    target: '[data-tour="new-bug-btn"]',
    route: '/qa-workspace/bug-list',
    title: 'Bug Tracking & Tickets',
    content: 'Review bugs generated from failed runs. You can easily turn these bugs into engineering tickets using Manual entry, AI generation, or Mapping to existing tickets.',
    placement: 'right',
  },
  {
    target: '[data-tour="qa-submission"]',
    route: '/qa-workspace/qa-submissions',
    title: 'QA Submission',
    content: 'Submit the completed QA cycle for review once testing and bug resolution are complete.',
    placement: 'right',
  },
  {
    target: '[data-tour="qa-signoff"]',
    route: '/qa-workspace/approvals',
    title: 'QA Sign-off',
    content: 'Complete the QA lifecycle with a formal sign-off once the required validation is complete.',
    placement: 'right',
  },
  {
    target: 'body',
    title: 'You are all set!',
    content: 'You are now ready to manage your entire QA lifecycle. Use these tools to ensure top-notch quality for your products.',
    placement: 'center',
  }
];

export const sprintSteps: RouteStep[] = [
  {
    target: '[data-tour="sprint-plan"]',
    route: '/sprints',
    content: 'Welcome to Sprint Planning. Here you can plan and track the progress of your active sprints.',
    placement: 'bottom',
  }
];
