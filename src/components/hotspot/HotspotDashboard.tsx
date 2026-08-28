'use client';
import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Input } from 'antd';
import { Flame, Search, X } from 'lucide-react';
import OpeningV2Service, { OpeningListItem, WorkMode } from '@/services/openingV2Service';
import { OpeningStyles, PALETTE, PanelHeader, WORK_MODE_LABELS } from '@/components/openings/ui';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import HotspotCard from './HotspotCard';
import ApplyModal from './ApplyModal';
import HotspotJobDrawer from './HotspotJobDrawer';

/**
 * The board is a bounded set — roles a company has open internally, not a
 * search index — so it is fetched once and filtered in the browser.
 *
 * That is what lets the Position and Department dropdowns be built from the
 * openings themselves: every option is guaranteed to match something, and
 * picking one can never return an empty grid. It also makes all four filters
 * instant. The cap is generous; a tenant with more internal postings than this
 * open at once would need server-side paging instead.
 */
const FETCH_LIMIT = 200;

const WORK_MODES: WorkMode[] = ['remote', 'hybrid', 'office'];

export default function HotspotDashboard() {
  const { message } = App.useApp();

  const [openings, setOpenings] = useState<OpeningListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState<WorkMode | null>(null);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState<OpeningListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Openings that are actively posted internally.
      const res = await OpeningV2Service.list({
        status: ['internal_posting'],
        pageSize: FETCH_LIMIT,
      });
      setOpenings(res.items);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the internal job board');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Filter options, derived from the openings themselves ──────────────────

  const positionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    openings.forEach((o) => counts.set(o.jobTitle, (counts.get(o.jobTitle) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([title, count]) => ({
        value: title,
        label: title,
        description: `${count} opening${count === 1 ? '' : 's'}`,
      }));
  }, [openings]);

  const departmentOptions = useMemo(() => {
    const byId = new Map<string, { name: string; count: number }>();
    openings.forEach((o) => {
      if (!o.departmentId || !o.departmentName) return;
      const seen = byId.get(o.departmentId);
      byId.set(o.departmentId, {
        name: o.departmentName,
        count: (seen?.count ?? 0) + 1,
      });
    });
    return [...byId.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name))
      .map(([id, d]) => ({
        value: id,
        label: d.name,
        description: `${d.count} opening${d.count === 1 ? '' : 's'}`,
      }));
  }, [openings]);

  const workModeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    openings.forEach((o) => counts.set(o.workMode, (counts.get(o.workMode) ?? 0) + 1));
    return WORK_MODES.filter((m) => counts.has(m)).map((m) => ({
      value: m,
      label: WORK_MODE_LABELS[m] ?? m,
      description: `${counts.get(m)} opening${counts.get(m) === 1 ? '' : 's'}`,
    }));
  }, [openings]);

  // ── The filtered grid ─────────────────────────────────────────────────────

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return openings.filter((o) => {
      if (position && o.jobTitle !== position) return false;
      if (departmentId && o.departmentId !== departmentId) return false;
      if (workMode && o.workMode !== workMode) return false;
      if (!q) return true;

      // Skills are part of the haystack on purpose — "react" should surface a
      // role that needs React even when the title says "Frontend Engineer".
      return [
        o.jobTitle,
        o.openingCode,
        o.clientName,
        o.departmentName,
        o.location,
        ...(o.requiredSkills ?? []),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [openings, search, position, departmentId, workMode]);

  const activeFilters = [search, position, departmentId, workMode].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setPosition(null);
    setDepartmentId(null);
    setWorkMode(null);
  };

  const handleApply = (opening: OpeningListItem) => {
    setSelectedOpening(opening);
    setApplyModalOpen(true);
    setDrawerOpen(false);
  };

  const handleCardClick = (opening: OpeningListItem) => {
    setSelectedOpening(opening);
    setDrawerOpen(true);
  };

  return (
    <div className="omp hotspot-dashboard">
      <OpeningStyles />
      <PanelHeader
        icon={<Flame />}
        color="#F97316"
        tint="rgba(249, 115, 22, 0.1)"
        title="Openings"
        subtitle="Explore and apply to opportunities within the company"
        sidebarEvent="open-hotspot-sidebar"
      />

      <div className="hsj-toolbar">
        <div className="hsj-tool hsj-tool-search">
          <Input
            allowClear
            prefix={<Search size={14} className="hsj-search-icon" />}
            placeholder="Search roles, skills, teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="hsj-divider" />

        <div className="hsj-tool">
          <SearchableDropdown
            triggerLabel="Position"
            value={position}
            onChange={(v) => setPosition((v as string) || null)}
            options={positionOptions}
            placeholder="Any position"
            searchPlaceholder="Find a position…"
            itemNoun="positions"
            hideAvatar
            width={280}
          />
        </div>

        <span className="hsj-divider" />

        <div className="hsj-tool">
          <SearchableDropdown
            triggerLabel="Department"
            value={departmentId}
            onChange={(v) => setDepartmentId((v as string) || null)}
            options={departmentOptions}
            placeholder="Any department"
            searchPlaceholder="Find a department…"
            itemNoun="departments"
            hideAvatar
            width={260}
          />
        </div>

        <span className="hsj-divider" />

        <div className="hsj-tool">
          <SearchableDropdown
            triggerLabel="Work type"
            value={workMode}
            onChange={(v) => setWorkMode((v as WorkMode) || null)}
            options={workModeOptions}
            placeholder="Anywhere"
            itemNoun="types"
            hideAvatar
            width={220}
          />
        </div>

        {activeFilters > 0 && (
          <>
            <span className="hsj-divider" />
            <button className="hsj-clear" onClick={clearFilters}>
              <X size={13} />
              Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
            </button>
          </>
        )}

        {!loading && (
          <span className="hsj-count">
            {visible.length} role{visible.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="omp-empty">
          <ZukvoLoader size="md" />
        </div>
      ) : visible.length === 0 ? (
        <div style={{ gridColumn: '1 / -1' }}>
          <NoData description={
            <div className="omp-empty pp-empty">
              <div className="omp-empty-title pp-empty-title">
                {activeFilters > 0 ? 'No matching roles' : 'No Internal Openings'}
              </div>
              <div className="omp-empty-sub pp-empty-sub">
                {activeFilters > 0
                  ? 'Try a different search, position, department or work type.'
                  : 'There are currently no internal job postings available.'}
              </div>
            </div>
          } />
        </div>
      ) : (
        <div className="hotspot-grid">
          {visible.map((opening) => (
            <HotspotCard
              key={opening.id}
              opening={opening}
              onClick={() => handleCardClick(opening)}
              onApply={() => handleApply(opening)}
            />
          ))}
        </div>
      )}

      <HotspotJobDrawer
        open={drawerOpen}
        opening={selectedOpening}
        onClose={() => setDrawerOpen(false)}
        onApply={() => handleApply(selectedOpening!)}
      />

      {selectedOpening && (
        <ApplyModal
          open={applyModalOpen}
          opening={selectedOpening}
          onClose={() => setApplyModalOpen(false)}
        />
      )}

      <style jsx>{`
        /* Sits inside the /hotspot shell, which already supplies the gutter and
           stretches .omp-header edge-to-edge — so no negative margins here. */
        .hotspot-dashboard {
          padding: 0 0 40px 0;
        }
        .hotspot-dashboard :global(.omp-header) {
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }

        /* Control strip: left-aligned, full width, divided. */
        .hsj-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 0 0 10px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .hsj-tool {
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .hsj-tool-search {
          flex: 1 1 220px;
          max-width: 340px;
        }
        .hsj-tool-search :global(.ant-input-affix-wrapper) {
          border-radius: 8px;
        }
        .hsj-toolbar :global(.hsj-search-icon) {
          color: var(--text-slate-400);
        }
        .hsj-divider {
          width: 1px;
          align-self: stretch;
          min-height: 26px;
          background: var(--border-slate-200);
        }
        .hsj-clear {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-500);
        }
        .hsj-clear:hover {
          color: ${PALETTE.blue};
        }
        .hsj-count {
          margin-left: auto;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-slate-400);
          white-space: nowrap;
        }
        @media (max-width: 900px) {
          /* Stacked, the vertical rules divide nothing — drop them. */
          .hsj-divider {
            display: none;
          }
          .hsj-tool-search {
            max-width: none;
          }
          .hsj-count {
            margin-left: 0;
          }
        }

        .hotspot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 16px;
          align-items: start;
        }
      `}</style>
    </div>
  );
}
