/**
 * The playbook template, and the prompt that goes with it.
 *
 * WHY THIS EXISTS: authoring a playbook inside the app is slow and, done with
 * Zai, costs tokens per recommendation. A QA who already has an AI subscription
 * can do the writing there for free — provided we hand them the exact shape we
 * accept. So: download the template, paste it into any AI platform with the
 * prompt, paste the answer back into Import.
 *
 * The shape is deliberately IDENTICAL to what POST /playbooks/import validates,
 * so there is no translation layer to drift out of step with the API.
 */

import {
  LEVEL_ORDER,
  REFERENCE_TYPE_ORDER,
  REFERENCE_TYPES,
  type PlaybookLevel,
} from "@/components/qa/playbookShared";

/** Filled in from the live vocabularies, so the prompt can never go stale. */
export interface TemplateVocabulary {
  levels: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  risks: string[];
}

/** One worked example — a real recommendation, not lorem. */
export const TEMPLATE_EXAMPLE = {
  playbooks: [
    {
      category: "Authentication",
      name: "Login",
      summary:
        "What to test when testing a login feature — the fields, the account states, sessions and the security checks a senior QA would insist on.",
      overview:
        "Login is the door to everything else, so it is tested in three passes: **the form** (what a user can type and what the screen says back), **the account** (locked, unverified, disabled, expired) and **the session** (what the successful login actually issued).\n\nThe defects that reach production are almost never in the happy path.",
      version: "1.0",
      sections: [
        {
          title: "Basic Testing",
          description: "The screen itself, before any credential is correct.",
          items: [
            {
              title: "Username / email field is visible and usable",
              what_to_test:
                "Confirm the field is present, labelled, focusable, and accepts typed input. Check the placeholder text and the input type.",
              preconditions: [
                "The login page is open at its own URL in a supported browser, at default zoom",
                "No session is active — cookies and local storage cleared, or a private window",
              ],
              steps: [],
              examples: [
                {
                  input: 'Field label reads "Email" or "Username"',
                  verdict: "Never a raw key like usr_id",
                },
                {
                  input: 'input type="email" on an email-only field',
                  verdict: "Mobile shows the right keyboard",
                },
              ],
              expected:
                "The field is visible, has a clear label, receives focus on click and on tab, and accepts typing.",
              edge_cases: [
                "Reached by keyboard alone: Tab lands on it before the password field, focus is visible",
                "Autofill from a password manager populates it without breaking the label or layout",
                "A screen reader announces the field by its label, not only by its placeholder",
              ],
              why_it_matters:
                "A field a keyboard or screen-reader user cannot reach is a login nobody in that group can complete.",
              level: "junior",
              category: "ui",
              risk: "medium",
              references: [
                {
                  type: "standard",
                  name: "WCAG 2.2 — Labels or Instructions (3.3.2)",
                  description:
                    "Why a placeholder is not a label, and what a form field owes a screen-reader user.",
                  url: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html",
                },
              ],
              applies_when: {},
            },
          ],
          sections: [
            {
              title: "Input Validation",
              description: "What the field accepts, and what it says when it should not.",
              items: [
                {
                  title: "Email format validation",
                  what_to_test: "Enter valid and invalid email formats and submit.",
                  preconditions: [],
                  steps: [],
                  examples: [
                    { input: "user@@example.com", verdict: "Rejected with a clear message" },
                    { input: "user+tag@example.co.uk", verdict: "Accepted" },
                  ],
                  expected:
                    "Valid formats are accepted; invalid ones are refused before any authentication attempt, with a message naming the problem.",
                  edge_cases: [
                    "254-character address",
                    "Leading and trailing whitespace on paste",
                    "Unicode domain (münchen.de)",
                  ],
                  why_it_matters:
                    "Validation done only on the server turns a typo into a failed login attempt, and enough of those lock the account.",
                  level: "junior",
                  category: "input_validation",
                  risk: "medium",
                  references: [],
                  applies_when: {},
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** The downloadable file: the shape, with one worked example inside it. */
export function templateJson(): string {
  return JSON.stringify(TEMPLATE_EXAMPLE, null, 2);
}

/**
 * The prompt to paste into an AI platform alongside the template.
 *
 * Built from the live vocabularies rather than a hardcoded list: a category
 * added to the API would otherwise silently produce imports that fail
 * validation, and the author would have no way to know why.
 */
export function templatePrompt(vocab: TemplateVocabulary, subject = "the feature you name"): string {
  const levels = (vocab.levels.length ? vocab.levels.map((l) => l.value) : LEVEL_ORDER).join(", ");
  const categories = vocab.categories.length
    ? vocab.categories.map((c) => `${c.value} (${c.label})`).join(", ")
    : "ui, input_validation, functional, boundary, account_state, api, auth, session, security, performance, browser_device, accessibility";
  const risks = (vocab.risks.length ? vocab.risks : ["low", "medium", "high", "critical"]).join(", ");
  const referenceTypes = REFERENCE_TYPE_ORDER.map(
    (type) => `${type} (${REFERENCE_TYPES[type].label} — ${REFERENCE_TYPES[type].hint})`
  ).join("\n  ");

  return `You are a senior QA engineer writing QA playbooks.

A playbook answers "what should I test here?" for one feature. It is filed under a
CATEGORY, and holds SECTIONS, each holding RECOMMENDATION CASES:

  Category  →  Playbook  →  Section  →  Recommendation case

Write playbooks for: ${subject}

Return ONLY a JSON object — no markdown fences, no commentary — in exactly this shape:

{
  "playbooks": [
    {
      "category": "Authentication",              // the group it is filed under
      "name": "Login",                           // the feature
      "summary": "one line a QA reads on the catalog card",
      "overview": "markdown: how to use this playbook, what it assumes, where the real defects are",
      "version": "1.0",
      "sections": [
        {
          "title": "Basic Testing",
          "description": "one line on what this group is for",
          "items": [ /* recommendation cases — see below */ ],
          "sections": [ { "title": "Sub-section", "description": "", "items": [ /* … */ ] } ]
        }
      ]
    }
  ]
}

A recommendation case:

{
  "title": "short imperative title naming the check, not the outcome",
  "what_to_test": "the action a tester performs, concrete enough to follow without asking",
  "preconditions": ["the state the system must already be in for this to mean anything"],
  "steps": ["one action per item, imperative, no leading numbers — [] for a single check"],
  "examples": [{"input": "a concrete value or condition", "verdict": "what should happen"}],
  "expected": "the single observable outcome that means this passed",
  "edge_cases": ["a variant worth a second pass — empty, maximum, unicode, concurrent, offline"],
  "why_it_matters": "one sentence on what breaks in production when this is skipped",
  "level": "one of: ${levels}",
  "category": "one of: ${categories}",
  "risk": "one of: ${risks}",
  "references": [
    {
      "type": "one of the reference types below",
      "name": "what it is called",
      "description": "one line on what the reader gets from it",
      "url": "a real URL, or omit this key"
    }
  ],
  "applies_when": {}
}

Reference types — vary them, they answer the same question differently:
  ${referenceTypes}

RULES
- "level", "category" and "risk" must be values from the lists above, exactly. Anything
  else is rejected on import.
- Every playbook needs at least one section, and every section at least one item.
- Sections nest ONE level deep. No deeper.
- "examples" are inputs WITH a verdict. "edge_cases" are situations to go and look at.
  Do not mix them.
- "why_it_matters" must name a real consequence, never "it is important to test this".
- References: only URLs you are confident exist. A named standard with no URL beats an
  invented link. "url" must be a PLAIN URL string — "https://example.com/page" — never a
  markdown link like "[text](https://example.com/page)".
- Cover the feature properly: the happy path is the smallest part of it. Include the
  negative cases, the account states, the boundaries, the session and the security checks.
- Aim for 20 to 60 recommendation cases per playbook, spread across levels.

Return the JSON and nothing else.`;
}

/* ── Inside one playbook ─────────────────────────────────────────────────── */

/**
 * The same idea, one level down: the author already has a playbook open, so the
 * category and the name are settled and only the SECTIONS are wanted. Keeping
 * this separate from the catalog template means the AI is not asked to invent
 * filing it would then be told to ignore.
 */
export const SECTIONS_TEMPLATE_EXAMPLE = {
  sections: TEMPLATE_EXAMPLE.playbooks[0].sections,
};

export function sectionsTemplateJson(): string {
  return JSON.stringify(SECTIONS_TEMPLATE_EXAMPLE, null, 2);
}

export function sectionsTemplatePrompt(
  vocab: TemplateVocabulary,
  playbook: { name: string; category: string; summary?: string }
): string {
  const base = templatePrompt(vocab, playbook.name || "the feature named below");

  /* Reuses the catalog prompt's field-by-field spec — one definition of a
     recommendation case, not two that drift — and swaps the envelope. */
  const body = base
    .slice(base.indexOf("A recommendation case:"))
    .replace(/\nReturn the JSON and nothing else\.$/, "");

  return `You are a senior QA engineer writing sections for an existing QA playbook.

The playbook already exists and is filed:

  Category:  ${playbook.category || "(not set)"}
  Playbook:  ${playbook.name || "(not named yet)"}${
    playbook.summary ? `\n  Summary:   ${playbook.summary}` : ""
  }

Do NOT invent a category or rename the playbook. Write only what goes INSIDE it:
sections, each holding recommendation cases.

Return ONLY a JSON object — no markdown fences, no commentary — in exactly this shape:

{
  "sections": [
    {
      "title": "Basic Testing",
      "description": "one line on what this group is for",
      "items": [ /* recommendation cases — see below */ ],
      "sections": [ { "title": "Sub-section", "description": "", "items": [ /* … */ ] } ]
    }
  ]
}

${body}
- Sections nest ONE level deep. No deeper.
- Do not repeat what the playbook already covers; write the sections that are missing.

Return the JSON and nothing else.`;
}

/** Hands the file to the browser without a round trip. */
export function downloadTemplate(filename = "qa-playbook-template.json"): void {
  saveFile(templateJson(), filename);
}

function saveFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadSectionsTemplate(filename = "qa-playbook-sections-template.json"): void {
  saveFile(sectionsTemplateJson(), filename);
}

/** Levels are only used for the prompt's fallback list. */
export type { PlaybookLevel };
