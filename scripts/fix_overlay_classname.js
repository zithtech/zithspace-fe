// One-shot: convert deprecated `overlayClassName="X"` and `overlayClassName={expr}`
// usages to the AntD v5 replacement `classNames={{ root: "X" }}` / `classNames={{ root: expr }}`.
//
// Idempotent — if a line already uses `classNames=`, it's skipped.

const fs = require("fs");
const path = require("path");

const FILES = [
  "src/app/(documenthub)/documenthub/page.tsx",
  "src/components/projects/buckets/MoveToSprintAction.tsx",
  "src/components/projects/drawer/TicketDetailDrawer.tsx",
  "src/components/time-tracking/TimeTrackerPopover.tsx",
];

const ROOT = "/Users/zithmi/z-space/zithspace-fe";

const STRING_RE = /overlayClassName="([^"]+)"/g;
const EXPR_RE = /overlayClassName=\{([^}]+)\}/g;

let totalFiles = 0;
let totalReplacements = 0;

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.log(`! ${rel} (file not found)`);
    continue;
  }
  let content = fs.readFileSync(file, "utf8");
  let count = 0;
  content = content.replace(STRING_RE, (_match, cls) => {
    count++;
    return `classNames={{ root: "${cls}" }}`;
  });
  content = content.replace(EXPR_RE, (_match, expr) => {
    count++;
    return `classNames={{ root: ${expr.trim()} }}`;
  });
  if (count > 0) {
    fs.writeFileSync(file, content);
    totalFiles++;
    totalReplacements += count;
    console.log(`✓ ${rel} (${count})`);
  } else {
    console.log(`· ${rel} (no changes)`);
  }
}

console.log(`\nDone. ${totalReplacements} replacements across ${totalFiles} files.`);
