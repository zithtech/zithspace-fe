// One-shot: wire slugifyCode auto-fill into every catalog modal.
// - Imports the helper
// - Adds a Form.useWatch("name") + useEffect that fills Code from Name in CREATE mode
// - Stops auto-filling once the user manually types in the Code field
// - Resets the "manually edited" flag when the modal opens for a new record
//
// Variants modal is intentionally skipped — it has a smarter suggestion
// (planCode + cycle) baked in already.
//
// Idempotent: skips any file that already imports slugifyCode.

const fs = require("fs");
const path = require("path");

const PRICING_DIR = "/Users/zithmi/z-space/zithspace-fe/src/app/pricing-and-plans";
const FILES = [
  "catalog/sections/page.tsx",
  "catalog/modules/page.tsx",
  "catalog/pages/page.tsx",
  "catalog/features/page.tsx",
  "catalog/limits/page.tsx",
  "plans/page.tsx",
  "addons/page.tsx",
];

const AUTOFILL_BLOCK = `
  // Auto-fill code from name (create mode only, until the user edits code manually)
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const codeAutofillNameWatch = Form.useWatch("name", form);
  useEffect(() => {
    if (editing) return;
    if (codeManuallyEdited) return;
    const auto = slugifyCode(codeAutofillNameWatch || "");
    if ((form.getFieldValue("code") || "") !== auto) {
      form.setFieldValue("code", auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeAutofillNameWatch, editing, codeManuallyEdited]);
`;

function transform(content) {
  if (content.includes("slugifyCode")) return null; // idempotent skip

  // 1) Import — after the first @/services/pricing/... import in the file.
  content = content.replace(
    /(import [^;]+ from "@\/services\/pricing\/[^"]+";)/,
    `$1\nimport { slugifyCode } from "@/lib/codeSlugify";`
  );

  // 2) State + effect — right after `const [saving, setSaving] = useState(false);`
  content = content.replace(
    /(const \[saving, setSaving\] = useState\(false\);)/,
    `$1\n${AUTOFILL_BLOCK}`
  );

  // 3) Reset the manual-edit flag at the top of openCreate.
  content = content.replace(
    /(function openCreate\(\)\s*\{[\s\S]*?setEditing\(null\);)/,
    `$1\n    setCodeManuallyEdited(false);`
  );

  // 4) Attach onChange to the Code <Input/>. The Code Input is the unique one
  // that has both a placeholder= and disabled={!!editing} on the same tag.
  // Non-greedy [^<>]*? so we stop at the right place inside addons (which uses
  // a JSX-expression placeholder).
  content = content.replace(
    /(<Input\b[^<>]*?placeholder=[^<>]*?disabled=\{!!editing\})(?!\s+onChange=\{\(\)\s*=>\s*setCodeManuallyEdited)(\s*\/>)/g,
    `$1 onChange={() => setCodeManuallyEdited(true)}$2`
  );

  return content;
}

let changed = 0;
for (const rel of FILES) {
  const file = path.join(PRICING_DIR, rel);
  const original = fs.readFileSync(file, "utf8");
  const next = transform(original);
  if (next === null) {
    console.log(`· ${rel} (already wired)`);
    continue;
  }
  if (next === original) {
    console.log(`! ${rel} (no replacements made — anchors not found)`);
    continue;
  }
  fs.writeFileSync(file, next);
  changed++;
  console.log(`✓ ${rel}`);
}

console.log(`\nDone. ${changed} files updated.`);
