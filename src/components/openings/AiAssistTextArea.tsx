'use client';

import React, { useState } from 'react';
import { Button, Checkbox, Input, Modal, Skeleton, Tooltip } from 'antd';
import { Database, Plus, RefreshCw, Sparkles, SpellCheck2, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';

import OpeningV2Service, {
  type AssistContext,
  type AssistField,
  type SuggestionGroup,
} from '@/services/openingV2Service';
import { PALETTE, TINT } from './ui';

// A textarea with two AI affordances, and a deliberate difference between them:
//
//   Grammar         — fixes mistakes and returns the user's own words. One click,
//                     no dialog, and an Undo appears because a silent rewrite of
//                     someone's text is the fastest way to lose their trust.
//   Enhance content — opens the suggestion picker first. The model proposes
//                     skills and themes for the job title; the user ticks what
//                     they want (or nothing) and only then is anything written.
//
// Both are additive: the field stays a plain textarea and works untouched if AI
// is unavailable.

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  field: AssistField;
  /** Read fresh at click time — the form is still being filled in. */
  getContext: () => AssistContext;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export default function AiAssistTextArea({
  value = '',
  onChange,
  field,
  getContext,
  rows = 4,
  placeholder,
  disabled,
}: Props) {
  const [grammarBusy, setGrammarBusy] = useState(false);
  const [enhanceBusy, setEnhanceBusy] = useState(false);
  const [previous, setPrevious] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [groups, setGroups] = useState<SuggestionGroup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [cached, setCached] = useState(false);
  // Items the user typed. Tracked apart from `groups` so only these are sent
  // back to be saved — the AI's own items are already in the cache.
  const [custom, setCustom] = useState<Record<string, string[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const requireTitle = (): AssistContext | null => {
    const ctx = getContext();
    if (!ctx.jobTitle?.trim()) {
      toast.error('Enter a job title first — the suggestions are based on it');
      return null;
    }
    return ctx;
  };

  const runGrammar = async () => {
    if (!(value || '').trim()) {
      toast.error('Write something first');
      return;
    }
    setGrammarBusy(true);
    try {
      const result = await OpeningV2Service.aiGrammar(value);
      if (!result.changed) {
        toast.success('No grammar issues found');
        return;
      }
      setPrevious(value);
      onChange?.(result.text);
      toast.success('Grammar corrected');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not run the grammar check');
    } finally {
      setGrammarBusy(false);
    }
  };

  const loadSuggestions = async (ctx: AssistContext, refresh = false) => {
    setLoadingSuggestions(true);
    try {
      const result = await OpeningV2Service.aiSuggestions(field, ctx, refresh);
      setGroups(result.groups);
      setCached(result.cached);
      if (refresh) toast.success('Suggestions regenerated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load suggestions');
      if (!refresh) setPickerOpen(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const openPicker = async () => {
    const ctx = requireTitle();
    if (!ctx) return;

    setPickerOpen(true);
    setSelected([]);
    setCustom({});
    setDrafts({});
    await loadSuggestions(ctx);
  };

  const regenerate = async () => {
    const ctx = requireTitle();
    if (!ctx) return;
    await loadSuggestions(ctx, true);
  };

  /**
   * Add a user-typed item to a group. It goes straight into `groups` so it is
   * visible and tickable, and into `custom` so it can be persisted on confirm.
   */
  const addCustom = (groupKey: string) => {
    const raw = (drafts[groupKey] ?? '').trim();
    if (!raw) return;

    const group = groups.find((g) => g.key === groupKey);
    if (group?.items.some((i) => i.toLowerCase() === raw.toLowerCase())) {
      toast.error('That is already in the list');
      setDrafts((prev) => ({ ...prev, [groupKey]: '' }));
      return;
    }

    setGroups((prev) =>
      prev.map((g) => (g.key === groupKey ? { ...g, items: [...g.items, raw] } : g))
    );
    setCustom((prev) => ({ ...prev, [groupKey]: [...(prev[groupKey] ?? []), raw] }));
    // Tick it — someone who just typed it clearly wants it included.
    setSelected((prev) => [...prev, raw]);
    setDrafts((prev) => ({ ...prev, [groupKey]: '' }));
  };

  const runEnhance = async () => {
    const ctx = requireTitle();
    if (!ctx) return;

    setEnhanceBusy(true);
    try {
      const customItems = Object.entries(custom)
        .filter(([, items]) => items.length > 0)
        .map(([groupKey, items]) => ({ groupKey, items }));

      const { text, missing } = await OpeningV2Service.aiEnhance({
        field,
        currentText: value || null,
        selected,
        customItems,
        context: ctx,
      });
      setPrevious(value);
      onChange?.(text);
      setPickerOpen(false);
      toast.success((value || '').trim() ? 'Content enhanced' : 'Content generated');
      // Be honest when a selection did not make it in, rather than letting the
      // user discover it by reading.
      if (missing.length) {
        toast(
          `${missing.length} selected item(s) did not make it in: ${missing.slice(0, 3).join(', ')}${
            missing.length > 3 ? '…' : ''
          }`,
          { icon: '⚠️', duration: 6000 }
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not generate the content');
    } finally {
      setEnhanceBusy(false);
    }
  };

  const toggle = (item: string) =>
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );

  const undo = () => {
    if (previous === null) return;
    onChange?.(previous);
    setPrevious(null);
    toast.success('Reverted');
  };

  return (
    <div className="omai">
      <div className="omai-bar">
        {previous !== null && (
          <Tooltip title="Undo the AI change">
            <Button size="small" type="text" icon={<Undo2 size={13} />} onClick={undo}>
              Undo
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Fix spelling and grammar only — your wording is kept">
          <Button
            size="small"
            icon={<SpellCheck2 size={13} />}
            loading={grammarBusy}
            disabled={disabled}
            onClick={runGrammar}
          >
            Grammar
          </Button>
        </Tooltip>
        <Tooltip title="Pick suggested skills and themes, then write the content">
          <Button
            size="small"
            icon={<Sparkles size={13} />}
            disabled={disabled}
            onClick={openPicker}
            className="omai-enhance"
          >
            Enhance content
          </Button>
        </Tooltip>
      </div>

      <Input.TextArea
        // Fixed rows hid most of a generated description behind a scrollbar.
        // autoSize grows the field with the content, up to a sane ceiling.
        autoSize={{ minRows: rows, maxRows: 30 }}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          onChange?.(e.target.value);
          // Once the user edits by hand, the old snapshot is no longer "the
          // thing they had before the AI" — drop the undo rather than lie.
          if (previous !== null) setPrevious(null);
        }}
      />

      <Modal
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        onOk={runEnhance}
        confirmLoading={enhanceBusy}
        okText={(value || '').trim() ? 'Enhance content' : 'Generate content'}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 8px 12px' }}>
            <div className="omai-title-icon">
              <Sparkles size={16} />
            </div>
            <span className="omai-title-text">
              Suggestions for “{getContext().jobTitle || 'this role'}”
            </span>
          </div>
        }
        width={880}
        className="omai-modal"
        styles={{ body: { maxHeight: '62vh', overflowY: 'auto', paddingRight: 6 } }}
      >
        {loadingSuggestions ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <div className="omai-picker">
            <div className="omai-picker-top">
              <div className="omai-picker-hint">
                Tick what you want covered, or select nothing and let it write from the job
                title alone.
                {(value || '').trim() && ' Your existing draft is kept and improved.'}
              </div>
              <div className="omai-picker-source">
                {cached && (
                  <Tooltip title="Reused from the saved list for this job title — no AI call was made">
                    <span className="omai-cached">
                      <Database size={11} /> Saved list
                    </span>
                  </Tooltip>
                )}
                <Tooltip title="Ask the AI again and replace the saved list for this title">
                  <Button
                    size="small"
                    type="text"
                    icon={<RefreshCw size={12} />}
                    onClick={regenerate}
                    loading={loadingSuggestions}
                  >
                    Regenerate
                  </Button>
                </Tooltip>
              </div>
            </div>

            {groups.map((group) => (
              <div className="omai-group" data-key={group.key} key={group.key}>
                <div className="omai-group-head">
                  <span className="omai-group-label">{group.label}</span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      const all = group.items.every((i) => selected.includes(i));
                      setSelected((prev) =>
                        all
                          ? prev.filter((x) => !group.items.includes(x))
                          : [...new Set([...prev, ...group.items])]
                      );
                    }}
                  >
                    {group.items.every((i) => selected.includes(i)) ? 'Clear' : 'Select all'}
                  </Button>
                </div>
                <div className="omai-chips">
                  {group.items.map((item) => (
                    <label
                      key={item}
                      className={`omai-chip${selected.includes(item) ? ' is-on' : ''}${
                        (custom[group.key] ?? []).includes(item) ? ' is-custom' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selected.includes(item)}
                        onChange={() => toggle(item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                <div className="omai-add">
                  <Input
                    size="small"
                    placeholder={`Add your own${
                      group.key === 'skills'
                        ? ' skill…'
                        : group.key === 'focusAreas'
                          ? ' area…'
                          : ' point…'
                    }`}
                    value={drafts[group.key] ?? ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [group.key]: e.target.value }))
                    }
                    onPressEnter={(e) => {
                      e.preventDefault();
                      addCustom(group.key);
                    }}
                  />
                  <Button
                    size="small"
                    icon={<Plus size={12} />}
                    disabled={!(drafts[group.key] ?? '').trim()}
                    onClick={() => addCustom(group.key)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}

            <div className="omai-picker-foot">
              {selected.length} selected · nothing is written until you confirm
              {Object.values(custom).some((i) => i.length > 0) &&
                ' · your added items are saved to this job title'}
            </div>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .omai { position: relative; }
        .omai-bar {
          display: flex; justify-content: flex-end; align-items: center; gap: 6px;
          margin-bottom: 6px;
          margin-top: -38px;
          position: relative;
          z-index: 2;
        }
        .omai-bar .ant-btn { height: 26px; font-size: 11.5px; border-radius: 6px; }
        .omai-enhance.ant-btn { color: ${PALETTE.blue}; border-color: ${PALETTE.blue}55; }
        .omai-enhance.ant-btn:hover { border-color: ${PALETTE.blue}; }
        .omai-picker { display: flex; flex-direction: column; gap: 18px; padding-top: 4px; }
        .omai-picker-top { display: flex; align-items: flex-start; gap: 12px; }
        .omai-picker-hint { font-size: 12px; color: var(--text-slate-500); line-height: 1.5; flex: 1; }
        .omai-picker-source { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .omai-cached {
          display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 7px;
          border-radius: 6px; font-size: 10.5px; font-weight: 700; white-space: nowrap;
          color: ${PALETTE.ash}; background: ${TINT.ash};
        }
        .omai-add { display: flex; gap: 6px; margin-top: 8px; max-width: 380px; }
        .omai-add .ant-input { font-size: 12px; }
        .omai-chip.is-custom { border-style: dashed; }
        .omai-group-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .omai-group-label {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--text-slate-400);
        }
        .omai-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .omai-modal { max-width: calc(100vw - 32px); }
        .omai-chip {
          display: inline-flex; align-items: flex-start; gap: 6px; padding: 6px 10px;
          border: 1px solid var(--border-slate-200); border-radius: 8px;
          background: var(--bg-pure-white); cursor: pointer; font-size: 12px;
          color: var(--text-slate-700); max-width: 100%; line-height: 1.45;
        }
        /* Full-width sentences read better one per line than as ragged chips. */
        .omai-group[data-key='points'] .omai-chips { flex-direction: column; flex-wrap: nowrap; }
        .omai-group[data-key='points'] .omai-chip { width: 100%; }
        .omai-chip:hover { background: var(--bg-slate-50); }
        .omai-chip.is-on {
          border-color: ${PALETTE.blue}; background: ${TINT.blue}; color: var(--text-slate-900);
        }
        .omai-picker-foot {
          font-size: 11.5px; color: var(--text-slate-400); border-top: 1px solid var(--border-slate-100);
          padding-top: 12px;
        }
        
        .omai-title-icon {
          width: 32px; height: 32px; border-radius: 10px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.9);
          color: #2563eb; display: flex; align-items: center; justify-content: center;
        }
        .omai-title-text {
          font-size: 18px; font-weight: 700; letter-spacing: -0.01em;
          background: linear-gradient(90deg, #0f172a 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        [data-theme='dark'] .omai-title-icon {
          background: #1e293b;
          border: 1px solid #334155;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          color: #38bdf8;
        }
        [data-theme='dark'] .omai-title-text {
          background: none;
          -webkit-background-clip: unset;
          -webkit-text-fill-color: unset;
          color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
