"use client";

import React, { useMemo, useState } from "react";
import { Input, Tooltip } from "antd";
import { Search, ChevronDown, Users, Building2, UserRound } from "lucide-react";
import { PlaceholderGroup } from "@/services/mailTemplateService";

/**
 * The placeholder catalogue, as clickable chips.
 *
 * Grouped rather than flat because a template is addressed either to someone
 * at a client or to someone on the team, and the two draw from different
 * records: seeing "Client Contacts" and "Members" as separate sections is what
 * tells the writer which set applies to the mail they are writing.
 *
 * Clicking a chip inserts it wherever the cursor last was — subject line or
 * body — which is quicker and far less error-prone than typing
 * `{{client_designation}}` by hand.
 */
export default function PlaceholderPanel({
  groups,
  usedTokens,
  onInsert,
  primaryGroup,
  title = "Placeholders",
  subtitle = "Click one to drop it in. Each recipient sees their own values.",
}: {
  groups: PlaceholderGroup[];
  /** Tokens already in the template, so used chips can read as used. */
  usedTokens: string[];
  onInsert: (token: string) => void;
  /**
   * The group this screen is really about — listed first and open, with the
   * rest folded away. On a signature that is My Details; the client and member
   * groups are still valid there, just rarely what you came for.
   */
  primaryGroup?: PlaceholderGroup["key"];
  title?: string;
  subtitle?: string;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    primaryGroup
      ? Object.fromEntries(
          groups.filter((g) => g.key !== primaryGroup).map((g) => [g.key, true])
        )
      : {}
  );

  const used = useMemo(() => new Set(usedTokens), [usedTokens]);

  /** The primary group first; the rest keep the order the server sent. */
  const ordered = useMemo(() => {
    if (!primaryGroup) return groups;
    return [...groups].sort(
      (a, b) => Number(b.key === primaryGroup) - Number(a.key === primaryGroup)
    );
  }, [groups, primaryGroup]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ordered;
    return ordered
      .map((g) => ({
        ...g,
        fields: g.fields.filter(
          (f) =>
            f.label.toLowerCase().includes(term) ||
            f.field.toLowerCase().includes(term) ||
            f.hint.toLowerCase().includes(term)
        ),
      }))
      .filter((g) => g.fields.length > 0);
  }, [ordered, search]);

  return (
    <div className="mt-placeholders">
      <div className="mt-ph-head">
        <div>
          <div className="mt-ph-title">{title}</div>
          <div className="mt-ph-sub">{subtitle}</div>
        </div>
      </div>

      <div className="mt-ph-search">
        <Search size={13} />
        <Input
          variant="borderless"
          placeholder="Find a placeholder…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ fontSize: 12.5, padding: 0 }}
        />
      </div>

      {filtered.length === 0 && (
        <div className="mt-ph-empty">No placeholder matches “{search}”.</div>
      )}

      {filtered.map((group) => {
        // A search is an explicit request to see what matched, so it wins over
        // a fold the reader has not touched since.
        const isCollapsed = search.trim() ? false : collapsed[group.key];
        const GroupIcon =
          group.key === "member" ? Users : group.key === "sender" ? UserRound : Building2;
        return (
          <section key={group.key} className="mt-ph-group">
            <button
              type="button"
              className="mt-ph-group-head"
              onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
              aria-expanded={!isCollapsed}
            >
              <span className="mt-ph-group-icon">
                <GroupIcon size={13} strokeWidth={2} />
              </span>
              <span className="mt-ph-group-titles">
                <span className="mt-ph-group-label">{group.label}</span>
                <span className="mt-ph-group-desc">{group.description}</span>
              </span>
              <span className="mt-ph-group-count">{group.fields.length}</span>
              <ChevronDown
                size={14}
                className={`mt-ph-chevron ${isCollapsed ? "is-collapsed" : ""}`}
              />
            </button>

            {!isCollapsed && (
              <div className="mt-ph-chips">
                {group.fields.map((f) => (
                  <Tooltip key={f.field} title={`${f.hint} — inserts {{${f.field}}}`}>
                    <button
                      type="button"
                      className={`mt-ph-chip ${used.has(f.field) ? "is-used" : ""}`}
                      onClick={() => onInsert(f.field)}
                    >
                      <span className="mt-ph-chip-label">{f.label}</span>
                      <code>{`{{${f.field}}}`}</code>
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
