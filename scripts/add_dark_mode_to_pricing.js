// One-shot: add Tailwind dark: variants to every custom utility I used in the
// /pricing-and-plans tree. AntD components inherit dark mode from
// ThemeConfigProvider already, so we only touch the custom Tailwind classes.
//
// Idempotent: each regex has a negative lookahead that skips if the dark
// variant is already present. Safe to run multiple times.
//
// Inverted slate scale (matches AntD dark token palette):
//   slate-900 ↔ slate-100, slate-800 ↔ slate-200, slate-700 ↔ slate-300,
//   slate-600/500 → slate-400, slate-400 → slate-500, slate-300 → slate-600
// Containers use #131B2D to match AntD Modal.contentBg / Card token.

const fs = require("fs");
const path = require("path");

const ROOT = "/Users/zithmi/z-space/zithspace-fe/src/app/pricing-and-plans";

// Each entry: [pattern, replacement, description]
// Lookbehind (?<![\w:-]) ensures we don't catch text-slate-700 inside e.g. "hover:text-slate-700".
// Lookahead  (?!\s+dark:<prefix>) ensures we don't add a second dark variant.
const TRANSFORMS = [
  // ---- Backgrounds ----
  [
    /(?<![\w:-])bg-white\b(?!\s+dark:bg)/g,
    "bg-white dark:bg-[#131B2D]",
    "bg-white",
  ],
  [
    /(?<![\w:-])bg-slate-50\/60\b(?!\s+dark:bg)/g,
    "bg-slate-50/60 dark:bg-slate-900/40",
    "bg-slate-50/60",
  ],
  [
    /(?<![\w:-])bg-slate-50\b(?![\/])(?!\s+dark:bg)/g,
    "bg-slate-50 dark:bg-slate-900/40",
    "bg-slate-50",
  ],
  // ---- Borders ----
  [
    /(?<![\w:-])border-slate-200\b(?!\s+dark:border)/g,
    "border-slate-200 dark:border-slate-800",
    "border-slate-200",
  ],
  [
    /(?<![\w:-])border-slate-100\b(?!\s+dark:border)/g,
    "border-slate-100 dark:border-slate-800/60",
    "border-slate-100",
  ],
  [
    /(?<![\w:-])border-slate-300\b(?!\s+dark:border)/g,
    "border-slate-300 dark:border-slate-700",
    "border-slate-300",
  ],
  [
    /(?<![\w:-])divide-slate-200\b(?!\s+dark:divide)/g,
    "divide-slate-200 dark:divide-slate-800",
    "divide-slate-200",
  ],
  [
    /(?<![\w:-])divide-slate-100\b(?!\s+dark:divide)/g,
    "divide-slate-100 dark:divide-slate-800/60",
    "divide-slate-100",
  ],
  // ---- Text (light → dark inversion) ----
  [
    /(?<![\w:-])text-slate-900\b(?!\s+dark:text)/g,
    "text-slate-900 dark:text-slate-100",
    "text-slate-900",
  ],
  [
    /(?<![\w:-])text-slate-800\b(?!\s+dark:text)/g,
    "text-slate-800 dark:text-slate-200",
    "text-slate-800",
  ],
  [
    /(?<![\w:-])text-slate-700\b(?!\s+dark:text)/g,
    "text-slate-700 dark:text-slate-300",
    "text-slate-700",
  ],
  [
    /(?<![\w:-])text-slate-600\b(?!\s+dark:text)/g,
    "text-slate-600 dark:text-slate-400",
    "text-slate-600",
  ],
  [
    /(?<![\w:-])text-slate-500\b(?!\s+dark:text)/g,
    "text-slate-500 dark:text-slate-400",
    "text-slate-500",
  ],
  [
    /(?<![\w:-])text-slate-400\b(?!\s+dark:text)/g,
    "text-slate-400 dark:text-slate-500",
    "text-slate-400",
  ],
  [
    /(?<![\w:-])text-slate-300\b(?!\s+dark:text)/g,
    "text-slate-300 dark:text-slate-600",
    "text-slate-300",
  ],
  // ---- Hover / group-hover variants (must be after the base ones) ----
  [
    /\bhover:bg-white\b(?!\s+dark:hover:bg)/g,
    "hover:bg-white dark:hover:bg-slate-800",
    "hover:bg-white",
  ],
  [
    /\bhover:border-slate-300\b(?!\s+dark:hover:border)/g,
    "hover:border-slate-300 dark:hover:border-slate-700",
    "hover:border-slate-300",
  ],
  [
    /\bhover:text-slate-900\b(?!\s+dark:hover:text)/g,
    "hover:text-slate-900 dark:hover:text-slate-100",
    "hover:text-slate-900",
  ],
  [
    /\bhover:text-slate-700\b(?!\s+dark:hover:text)/g,
    "hover:text-slate-700 dark:hover:text-slate-300",
    "hover:text-slate-700",
  ],
  [
    /\bgroup-hover:text-slate-500\b(?!\s+dark:group-hover:text)/g,
    "group-hover:text-slate-500 dark:group-hover:text-slate-400",
    "group-hover:text-slate-500",
  ],
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

function transform(content) {
  let result = content;
  const counts = {};
  for (const [re, repl, label] of TRANSFORMS) {
    const before = result.length;
    let n = 0;
    result = result.replace(re, () => {
      n++;
      return repl;
    });
    if (n) counts[label] = n;
  }
  return { result, counts };
}

const files = walk(ROOT);
let totalFiles = 0;
let totalEdits = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const { result, counts } = transform(original);
  const editCount = Object.values(counts).reduce((a, b) => a + b, 0);
  if (result !== original) {
    fs.writeFileSync(file, result);
    totalFiles++;
    totalEdits += editCount;
    const rel = file.replace("/Users/zithmi/z-space/zithspace-fe/src/app/pricing-and-plans/", "");
    console.log(`✓ ${rel} (${editCount})`);
  }
}

// Also process the FE services dir (none used Tailwind, but harmless)
// and the layout/sidebar which lives in app/pricing-and-plans already.

console.log(`\nDone. ${totalEdits} replacements across ${totalFiles} files.`);
