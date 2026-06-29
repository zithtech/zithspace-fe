'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Switch, InputNumber, TimePicker, message, Spin, Tag, Tooltip, Drawer } from 'antd';
import dayjs from 'dayjs';
import {
  CalendarCheck,
  CalendarOff,
  Timer,
  NotebookPen,
  Ticket,
  Save,
  RotateCcw,
  Scale,
  Clock,
  CalendarClock,
  Info,
  ListChecks,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import PerformanceReportService, {
  ModuleKey,
  PerfReportSettings,
  TicketStatusUsage,
} from '@/services/performanceReportService';
import { suggestStatusMark, normalizeStatus } from './ticketPoints';

const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  pink: '#EC4899',
  cyan: '#06B6D4',
  slate: '#64748B',
} as const;

// Static presentation metadata for each scoring module. Keys must match the
// backend MODULE_KEYS; descriptions mirror the product spec for the Settings
// page so admins know exactly what each toggle contributes to the score.
const MODULE_META: Record<
  ModuleKey,
  { label: string; icon: React.ReactNode; color: string; description: string }
> = {
  attendance: {
    label: 'Attendance',
    icon: <CalendarCheck size={20} />,
    color: PALETTE.blue,
    description: 'Punch-in/out punctuality and total regular hours present.',
  },
  leaves: {
    label: 'Leaves',
    icon: <CalendarOff size={20} />,
    color: PALETTE.green,
    description: 'Planned vs. unplanned leaves and loss-of-pay (LOP) data.',
  },
  time_tracking: {
    label: 'Time Tracking',
    icon: <Timer size={20} />,
    color: PALETTE.amber,
    description: 'Actual time logged on specific projects, tasks, or clients.',
  },
  daily_updates: {
    label: 'Daily Updates',
    icon: <NotebookPen size={20} />,
    color: PALETTE.violet,
    description: 'Compliance & quality of BOD plans & EOD status reports.',
  },
  tickets: {
    label: 'Tickets',
    icon: <Ticket size={20} />,
    color: PALETTE.pink,
    description: 'Ticket resolution times, volume, and customer satisfaction (CSAT).',
  },
};

// Sub-selectable parts of a module, stored in that module's free-form `config`
// jsonb on the backend. Daily Updates is split into BOD / EOD; admins may keep
// both or just one. Each option defaults to ON when absent from config.
const MODULE_SUBOPTIONS: Partial<
  Record<ModuleKey, Array<{ key: string; label: string; hint: string }>>
> = {
  daily_updates: [
    { key: 'bod', label: 'BOD', hint: 'Beginning-of-Day plans' },
    { key: 'eod', label: 'EOD', hint: 'End-of-Day status reports' },
  ],
};

/** Resolve a module's sub-option on/off map from its config (default ON). */
function readSubSelection(
  moduleKey: ModuleKey,
  config: Record<string, unknown>
): Record<string, boolean> {
  const opts = MODULE_SUBOPTIONS[moduleKey];
  if (!opts) return {};
  const out: Record<string, boolean> = {};
  for (const o of opts) out[o.key] = config?.[o.key] !== false;
  return out;
}

// Editable, in-memory shape of a module row.
interface DraftModule {
  moduleKey: ModuleKey;
  isEnabled: boolean;
  weight: number;
  config: Record<string, unknown>;
}

export default function SettingsPanel() {
  const { canUpdatePerformanceReportSetting } = usePermission();
  const readOnly = !canUpdatePerformanceReportSetting;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverSnapshot, setServerSnapshot] = useState<PerfReportSettings | null>(null);

  // ── editable draft state ───────────────────────────────────────────────────
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [generationTime, setGenerationTime] = useState('23:59');
  const [modules, setModules] = useState<DraftModule[]>([]);

  // ── status-marks editor (Tickets module) ───────────────────────────────────
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [statusList, setStatusList] = useState<TicketStatusUsage[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  // Working copy edited inside the drawer (normalized status → cap). Applied to
  // the Tickets module config on "Apply".
  const [statusDraft, setStatusDraft] = useState<Record<string, number>>({});

  const hydrate = useCallback((s: PerfReportSettings) => {
    setServerSnapshot(s);
    setAutoGenerate(s.autoGenerateEnabled);
    setGenerationTime(s.generationTime);
    setModules(
      s.modules.map((m) => ({
        moduleKey: m.moduleKey,
        isEnabled: m.isEnabled,
        weight: Number(m.weight),
        config: m.config ?? {},
      }))
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await PerformanceReportService.getSettings();
      hydrate(s);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  // ── derived ────────────────────────────────────────────────────────────────
  const enabledModules = useMemo(() => modules.filter((m) => m.isEnabled), [modules]);
  const totalWeight = useMemo(
    () => enabledModules.reduce((acc, m) => acc + (m.weight || 0), 0),
    [enabledModules]
  );
  const weightBalanced = Math.abs(totalWeight - 100) < 0.01 || enabledModules.length === 0;

  // Every enabled module that has sub-options (e.g. Daily Updates → BOD/EOD) must
  // keep at least one selected — an enabled module measuring nothing is invalid.
  const subSelectionValid = useMemo(
    () =>
      modules.every((m) => {
        if (!m.isEnabled || !MODULE_SUBOPTIONS[m.moduleKey]) return true;
        const sel = readSubSelection(m.moduleKey, m.config);
        return Object.values(sel).some(Boolean);
      }),
    [modules]
  );

  const dirty = useMemo(() => {
    if (!serverSnapshot) return false;
    if (serverSnapshot.autoGenerateEnabled !== autoGenerate) return true;
    if (serverSnapshot.generationTime !== generationTime) return true;
    return serverSnapshot.modules.some((sm) => {
      const d = modules.find((m) => m.moduleKey === sm.moduleKey);
      return (
        !d ||
        d.isEnabled !== sm.isEnabled ||
        Number(d.weight) !== Number(sm.weight) ||
        JSON.stringify(d.config ?? {}) !== JSON.stringify(sm.config ?? {})
      );
    });
  }, [serverSnapshot, autoGenerate, generationTime, modules]);

  // ── mutations ──────────────────────────────────────────────────────────────
  const patchModule = (key: ModuleKey, patch: Partial<DraftModule>) => {
    setModules((prev) => prev.map((m) => (m.moduleKey === key ? { ...m, ...patch } : m)));
  };

  // Toggle one sub-option (e.g. BOD/EOD) inside a module's config.
  const toggleSubOption = (key: ModuleKey, subKey: string, value: boolean) => {
    setModules((prev) =>
      prev.map((m) =>
        m.moduleKey === key ? { ...m, config: { ...m.config, [subKey]: value } } : m
      )
    );
  };

  // Currently-saved status→cap map on the Tickets module config.
  const ticketsModule = modules.find((m) => m.moduleKey === 'tickets');
  const savedStatusMarks = (ticketsModule?.config?.statusMarks ?? {}) as Record<string, number>;
  const statusMarkCount = Object.keys(savedStatusMarks).length;

  // Open the editor: fetch the tenant's live statuses, then seed the working copy
  // from saved marks, falling back to a suggested mark for any unconfigured one.
  const openStatusEditor = async () => {
    setStatusDrawerOpen(true);
    setStatusLoading(true);
    try {
      const list = await PerformanceReportService.getTicketStatuses();
      setStatusList(list);
      const draft: Record<string, number> = { ...savedStatusMarks };
      for (const s of list) {
        const key = normalizeStatus(s.status);
        if (draft[key] === undefined) draft[key] = suggestStatusMark(s.status);
      }
      setStatusDraft(draft);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load ticket statuses');
    } finally {
      setStatusLoading(false);
    }
  };

  const setStatusMark = (status: string, value: number) => {
    setStatusDraft((prev) => ({ ...prev, [normalizeStatus(status)]: value }));
  };

  // Write the working copy into the Tickets module config (persisted on Save).
  const applyStatusMarks = () => {
    patchModule('tickets', {
      config: { ...(ticketsModule?.config ?? {}), statusMarks: statusDraft },
    });
    setStatusDrawerOpen(false);
  };

  // Split 100 evenly across currently-enabled modules (last one absorbs the
  // rounding remainder) so the total always lands exactly on 100.
  const distributeEvenly = () => {
    const enabled = modules.filter((m) => m.isEnabled);
    if (enabled.length === 0) {
      message.info('Enable at least one module first');
      return;
    }
    const base = Math.floor((100 / enabled.length) * 100) / 100;
    let assigned = 0;
    const next = modules.map((m) => {
      if (!m.isEnabled) return m;
      return { ...m, weight: base };
    });
    enabled.forEach((m, i) => {
      assigned += base;
      if (i === enabled.length - 1) {
        const idx = next.findIndex((n) => n.moduleKey === m.moduleKey);
        next[idx] = { ...next[idx], weight: Math.round((base + (100 - assigned)) * 100) / 100 };
      }
    });
    setModules(next);
  };

  const save = async () => {
    if (!weightBalanced) {
      message.error('Weights of enabled modules must sum to 100');
      return;
    }
    if (!subSelectionValid) {
      message.error('Daily Updates needs at least one of BOD or EOD selected');
      return;
    }
    setSaving(true);
    try {
      const saved = await PerformanceReportService.saveSettings({
        autoGenerateEnabled: autoGenerate,
        generationDay: 'last_day',
        generationTime,
        modules: modules.map((m) => ({
          moduleKey: m.moduleKey,
          isEnabled: m.isEnabled,
          weight: m.weight,
          config: m.config ?? {},
        })),
      });
      hydrate(saved);
      message.success('Performance report settings saved');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="prs-wrap">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="prs-head">
        <div>
          <h2 className="prs-title">Settings</h2>
          <p className="prs-sub">
            Choose what goes into the monthly performance report and how heavily each
            area counts toward the final score.
          </p>
        </div>
        <div className="prs-head-actions">
          <Button
            icon={<RotateCcw size={15} />}
            onClick={load}
            disabled={saving || !dirty}
          >
            Reset
          </Button>
          <Tooltip title={readOnly ? 'You don’t have permission to edit settings' : ''}>
            <Button
              type="primary"
              icon={<Save size={15} />}
              loading={saving}
              onClick={save}
              disabled={readOnly || !dirty || !weightBalanced || !subSelectionValid}
            >
              Save changes
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Automation card ─────────────────────────────────────────────────── */}
      <section className="prs-card prs-auto">
        <div className="prs-auto-row">
          <div className="prs-auto-icon"><CalendarClock size={20} /></div>
          <div className="prs-auto-text">
            <div className="prs-auto-title">Automatic monthly generation</div>
            <div className="prs-auto-desc">
              On the <strong>last day of every month</strong>, a background job compiles
              each employee’s score from the enabled modules and files it under
              Generated Reports.
            </div>
          </div>
          <Switch
            checked={autoGenerate}
            onChange={setAutoGenerate}
            disabled={readOnly}
          />
        </div>

        <div className="prs-auto-schedule" data-off={!autoGenerate}>
          <div className="prs-schedule-item">
            <Clock size={14} />
            <span>Runs at</span>
            <TimePicker
              value={dayjs(generationTime, 'HH:mm')}
              format="HH:mm"
              allowClear={false}
              minuteStep={1}
              disabled={readOnly || !autoGenerate}
              onChange={(v) => v && setGenerationTime(v.format('HH:mm'))}
              size="small"
              style={{ width: 96 }}
            />
            <span>on the last calendar day</span>
          </div>
        </div>
      </section>

      {/* ── Modules ─────────────────────────────────────────────────────────── */}
      <div className="prs-section-head">
        <div className="prs-section-left">
          <Scale size={16} />
          <span className="prs-section-title">Scoring modules</span>
          <Tooltip title="Enabled modules are blended into one score using these weights. Disabled modules are excluded entirely.">
            <Info size={13} style={{ color: 'var(--text-slate-400)' }} />
          </Tooltip>
        </div>

        <div className="prs-weight-summary">
          <Button
            size="small"
            type="text"
            onClick={distributeEvenly}
            disabled={readOnly || enabledModules.length === 0}
          >
            Distribute evenly
          </Button>
          <Tag
            color={weightBalanced ? 'green' : 'red'}
            style={{ fontWeight: 700, marginInlineEnd: 0 }}
          >
            Total {Number(totalWeight.toFixed(2))} / 100
          </Tag>
        </div>
      </div>

      <div className="prs-grid">
        {modules.map((m) => {
          const meta = MODULE_META[m.moduleKey];
          const subOpts = MODULE_SUBOPTIONS[m.moduleKey];
          const sel = subOpts ? readSubSelection(m.moduleKey, m.config) : null;
          const noneSelected = sel ? !Object.values(sel).some(Boolean) : false;
          return (
            <div
              key={m.moduleKey}
              className={`prs-mod ${m.isEnabled ? 'is-on' : 'is-off'}`}
              style={{ ['--accent' as any]: meta.color }}
            >
              <div className="prs-mod-top">
                <div className="prs-mod-icon">{meta.icon}</div>
                <div className="prs-mod-headtext">
                  <div className="prs-mod-name">{meta.label}</div>
                  <div className="prs-mod-desc">{meta.description}</div>
                </div>
                <Switch
                  checked={m.isEnabled}
                  onChange={(v) => patchModule(m.moduleKey, { isEnabled: v })}
                  disabled={readOnly}
                />
              </div>

              {subOpts && sel && (
                <div
                  className="prs-mod-subs"
                  style={{ opacity: m.isEnabled ? 1 : 0.5 }}
                >
                  <span className="prs-mod-subs-label">Include</span>
                  <div className="prs-mod-subs-chips">
                    {subOpts.map((o) => (
                      <Tooltip key={o.key} title={o.hint}>
                        <Tag.CheckableTag
                          checked={!!sel[o.key]}
                          onChange={(checked) =>
                            !readOnly && m.isEnabled && toggleSubOption(m.moduleKey, o.key, checked)
                          }
                          className="prs-sub-chip"
                          style={{
                            ['--accent' as any]: meta.color,
                            cursor: readOnly || !m.isEnabled ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {o.label}
                        </Tag.CheckableTag>
                      </Tooltip>
                    ))}
                  </div>
                  {m.isEnabled && noneSelected && (
                    <span className="prs-mod-subs-warn">pick at least one</span>
                  )}
                </div>
              )}

              {m.moduleKey === 'tickets' && (
                <div className="prs-mod-subs" style={{ opacity: m.isEnabled ? 1 : 0.5 }}>
                  <span className="prs-mod-subs-label">Status marks</span>
                  <Button
                    size="small"
                    icon={<ListChecks size={13} />}
                    onClick={openStatusEditor}
                    disabled={!m.isEnabled}
                  >
                    Configure
                  </Button>
                  <span className="prs-mod-subs-hint">
                    {statusMarkCount > 0 ? `${statusMarkCount} configured` : 'caps each status'}
                  </span>
                </div>
              )}

              <div className="prs-mod-foot">
                <span className="prs-mod-weight-label">Weight</span>
                <InputNumber
                  min={0}
                  max={100}
                  step={5}
                  value={m.weight}
                  disabled={readOnly || !m.isEnabled}
                  onChange={(v) => patchModule(m.moduleKey, { weight: Number(v ?? 0) })}
                  formatter={(v) => `${v}%`}
                  parser={(v) => Number((v ?? '').toString().replace('%', ''))}
                  size="small"
                  style={{ width: 96 }}
                />
                <div className="prs-mod-bar">
                  <div
                    className="prs-mod-bar-fill"
                    style={{
                      width: `${Math.min(m.weight, 100)}%`,
                      background: m.isEnabled ? meta.color : '#cbd5e1',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!weightBalanced && (
        <div className="prs-warn">
          Enabled modules currently total <strong>{Number(totalWeight.toFixed(2))}%</strong>.
          Adjust the weights so they add up to <strong>100%</strong> before saving — or use
          “Distribute evenly”.
        </div>
      )}

      {/* ── Ticket status marks editor ──────────────────────────────────────── */}
      <Drawer
        title="Ticket status marks"
        placement="right"
        width={440}
        open={statusDrawerOpen}
        onClose={() => setStatusDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setStatusDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={applyStatusMarks} disabled={readOnly}>
              Apply
            </Button>
          </div>
        }
      >
        <p className="prs-sm-intro">
          A completed ticket can score at most this mark for its status. Your{' '}
          <strong>final/delivered status should be 100</strong>; earlier stages (review,
          testing, dev complete…) are lower so unfinished work can’t earn full points.
          Applied on top of the time-efficiency score.
        </p>

        {statusLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : statusList.length === 0 ? (
          <div className="prs-sm-empty">No ticket statuses found for this workspace yet.</div>
        ) : (
          <div className="prs-sm-list">
            {statusList.map((s) => {
              const key = normalizeStatus(s.status);
              const val = statusDraft[key] ?? suggestStatusMark(s.status);
              const color = val >= 90 ? '#10b981' : val >= 75 ? '#f59e0b' : '#ef4444';
              return (
                <div key={key} className="prs-sm-row">
                  <div className="prs-sm-status">
                    <span className="prs-sm-dot" style={{ background: color }} />
                    <span className="prs-sm-name">{s.status}</span>
                    <span className="prs-sm-count">{s.count}</span>
                  </div>
                  <InputNumber
                    min={0}
                    max={100}
                    step={1}
                    value={val}
                    disabled={readOnly}
                    onChange={(v) => setStatusMark(s.status, Number(v ?? 0))}
                    formatter={(v) => `${v}%`}
                    parser={(v) => Number((v ?? '').toString().replace('%', ''))}
                    size="small"
                    style={{ width: 88 }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Drawer>

      <style jsx global>{`
        .prs-wrap { display: flex; flex-direction: column; gap: 18px; padding-bottom: 32px; max-width: 1080px; }
        .prs-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .prs-title { margin: 0; font-size: 19px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .prs-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-slate-500); max-width: 560px; line-height: 1.5; }
        .prs-head-actions { display: flex; gap: 8px; flex-shrink: 0; }

        .prs-card { border: 1px solid var(--border-slate-200); border-radius: 14px; background: var(--bg-secondary); }
        .prs-auto { padding: 16px 18px; }
        .prs-auto-row { display: flex; align-items: flex-start; gap: 14px; }
        .prs-auto-icon {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6;
        }
        .prs-auto-text { flex: 1; min-width: 0; }
        .prs-auto-title { font-size: 14.5px; font-weight: 700; color: var(--text-slate-900); }
        .prs-auto-desc { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; line-height: 1.5; }
        .prs-auto-schedule {
          margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border-slate-200);
          transition: opacity .15s ease;
        }
        .prs-auto-schedule[data-off='true'] { opacity: .45; }
        .prs-schedule-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-slate-700); font-weight: 500; }
        .prs-schedule-item svg { color: var(--text-slate-400); }

        .prs-section-head { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
        .prs-section-left { display: flex; align-items: center; gap: 8px; }
        .prs-section-left svg { color: var(--text-slate-700); }
        .prs-section-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); }
        .prs-weight-summary { display: flex; align-items: center; gap: 8px; }

        .prs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
        .prs-mod {
          border: 1px solid var(--border-slate-200); border-radius: 14px; background: var(--bg-secondary); padding: 14px 16px;
          display: flex; flex-direction: column; gap: 12px; transition: border-color .15s ease, box-shadow .15s ease, opacity .15s ease;
        }
        .prs-mod.is-on { border-color: color-mix(in srgb, var(--accent) 35%, #e2e8f0); }
        .prs-mod.is-on:hover { box-shadow: 0 2px 10px rgba(15,23,42,0.06); }
        .prs-mod.is-off { opacity: .62; }
        .prs-mod-top { display: flex; align-items: flex-start; gap: 12px; }
        .prs-mod-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--accent) 12%, #fff);
          color: var(--accent);
        }
        .prs-mod-headtext { flex: 1; min-width: 0; }
        .prs-mod-name { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .prs-mod-desc { font-size: 12px; color: var(--text-slate-500); margin-top: 2px; line-height: 1.45; }
        .prs-mod-subs {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 8px 10px; border-radius: 10px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
        }
        .prs-mod-subs-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400); }
        .prs-mod-subs-chips { display: flex; gap: 6px; }
        .prs-sub-chip {
          margin-inline-end: 0; padding: 1px 12px; font-size: 12px; font-weight: 600;
          border-radius: 999px; border: 1px solid var(--border-slate-200); background: var(--bg-secondary); color: var(--text-slate-700);
          transition: all .12s ease;
        }
        .prs-sub-chip.ant-tag-checkable-checked {
          background: color-mix(in srgb, var(--accent) 12%, #fff) !important;
          border-color: color-mix(in srgb, var(--accent) 45%, #e2e8f0) !important;
          color: var(--accent) !important;
        }
        .prs-mod-subs-warn { font-size: 11.5px; font-weight: 600; color: #dc2626; }
        .prs-mod-subs-hint { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); }

        /* Status-marks drawer */
        .prs-sm-intro { font-size: 12.5px; color: var(--text-slate-700); line-height: 1.6; margin: 0 0 16px; }
        .prs-sm-empty { font-size: 13px; color: var(--text-slate-400); padding: 24px 0; text-align: center; }
        .prs-sm-list { display: flex; flex-direction: column; }
        .prs-sm-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 2px; border-bottom: 1px solid var(--border-slate-100);
        }
        .prs-sm-status { display: flex; align-items: center; gap: 9px; min-width: 0; }
        .prs-sm-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .prs-sm-name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .prs-sm-count {
          font-size: 10.5px; font-weight: 700; color: var(--text-slate-500);
          background: var(--bg-slate-100); border-radius: 999px; padding: 0 7px;
        }
        .prs-mod-foot { display: flex; align-items: center; gap: 10px; }
        .prs-mod-weight-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400); }
        .prs-mod-bar { flex: 1; height: 6px; border-radius: 4px; background: var(--bg-slate-100); overflow: hidden; }
        .prs-mod-bar-fill { height: 100%; border-radius: 4px; transition: width .2s ease, background .2s ease; }

        .prs-warn {
          border: 1px solid #fde68a; background: #fffbeb; color: #92400e;
          border-radius: 12px; padding: 12px 14px; font-size: 12.5px; line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
