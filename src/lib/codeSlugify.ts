/**
 * Convert a human name into a UPPER_SNAKE_CASE code that satisfies the
 * `^[A-Z][A-Z0-9_]*$` constraint enforced by the pricing tables.
 *
 *   "Time Management"           → "TIME_MANAGEMENT"
 *   "Sprint AI"                 → "SPRINT_AI"
 *   "Multi-Currency  Pricing"   → "MULTI_CURRENCY_PRICING"
 *   "  CRM  "                   → "CRM"
 *   "User's Plan!"              → "USER_S_PLAN"
 *   "123 Test"                  → "TEST"   (must start with a letter)
 */
export function slugifyCode(name: string): string {
  if (!name) return "";
  let s = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_") // anything not A-Z/0-9 → underscore
    .replace(/^_+|_+$/g, "");    // trim leading / trailing underscores
  // Must start with a letter — drop any leading digits + their trailing underscore
  s = s.replace(/^[0-9]+_?/, "");
  return s;
}
