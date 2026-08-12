'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { App, InputNumber, Modal, Switch, Input, Tooltip } from 'antd';
import { ArrowRight, Bot, CalendarClock, Globe, Hand, Lock, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

import OpeningV2Service from '@/services/openingV2Service';
import { PALETTE, TINT } from './ui';

// Phase 4 — posting to the internal job board.
//
// The window length and auto-move flag are CAPTURED ON THE POSTING at this
// moment, so the tenant defaults are offered as a starting point but changing
// them here only affects this posting. That is why the modal exists at all
// rather than firing the default straight away.
//
// The design goal is that nobody has to do date arithmetic in their head: pick a
// length, see the exact day it closes and what happens on that day.

const PRESETS = [7, 15, 30, 45];

export default function PostInternalModal({
  open,
  openingId,
  onClose,
  onPosted,
}: {
  open: boolean;
  openingId: string;
  onClose: () => void;
  onPosted: () => void;
}) {
  const { message } = App.useApp();
  const [days, setDays] = useState<number>(15);
  const [autoMove, setAutoMove] = useState(true);
  const [note, setNote] = useState('');
  const [defaults, setDefaults] = useState<{ days: number; autoMove: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNote('');
    OpeningV2Service.getPostingSettings()
      .then((s) => {
        setDefaults({ days: s.internalPostingDays, autoMove: s.autoMoveToExternal });
        setDays(s.internalPostingDays);
        setAutoMove(s.autoMoveToExternal);
      })
      .catch(() => {
        // Settings are only a starting point — the backend applies its own
        // defaults if we send nothing.
        setDefaults(null);
      });
  }, [open]);

  const closesOn = useMemo(() => dayjs().add(days || 0, 'day'), [days]);

  const submit = async () => {
    setSaving(true);
    try {
      await OpeningV2Service.postInternally(openingId, {
        days,
        autoMove,
        note: note.trim() || null,
      });
      message.success(
        autoMove
          ? `Posted internally for ${days} day(s), then moves to external`
          : `Posted internally for ${days} day(s)`
      );
      onPosted();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not post the opening');
    } finally {
      setSaving(false);
    }
  };

  const overridden = defaults && (days !== defaults.days || autoMove !== defaults.autoMove);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={saving}
      okText="Post internally"
      title="Post to the internal job board"
      width={560}
      className="ompi-modal"
    >
      <div className="ompi">
        {/* What is about to happen, as a picture rather than a paragraph. */}
        <div className="ompi-timeline">
          <div className="ompi-stage is-now">
            <span className="ompi-stage-dot" style={{ background: TINT.blue, color: PALETTE.blue }}>
              <Lock size={14} />
            </span>
            <div className="ompi-stage-text">
              <div className="ompi-stage-title">Internal posting</div>
              <div className="ompi-stage-sub">Employees only · from today</div>
            </div>
          </div>

          <div className="ompi-connector">
            <span className="ompi-connector-line" />
            <span className="ompi-connector-label">{days || 0} days</span>
            <ArrowRight size={13} className="ompi-connector-arrow" />
          </div>

          <div className={`ompi-stage${autoMove ? '' : ' is-muted'}`}>
            <span
              className="ompi-stage-dot"
              style={
                autoMove
                  ? { background: TINT.green, color: PALETTE.green }
                  : { background: TINT.lightGray, color: PALETTE.lightGray }
              }
            >
              {autoMove ? <Globe size={14} /> : <Hand size={14} />}
            </span>
            <div className="ompi-stage-text">
              <div className="ompi-stage-title">
                {autoMove ? 'External posting' : 'Waits for you'}
              </div>
              <div className="ompi-stage-sub">
                {closesOn.format('ddd, D MMM YYYY')}
              </div>
            </div>
          </div>
        </div>

        {/* Window length */}
        <div className="ompi-block">
          <div className="ompi-block-head">
            <span className="ompi-label">
              <CalendarClock size={13} /> Window length
            </span>
            {defaults && days !== defaults.days && (
              <Tooltip title={`Reset to the tenant default (${defaults.days} days)`}>
                <button className="ompi-reset" onClick={() => setDays(defaults.days)}>
                  <RotateCcw size={11} /> Reset
                </button>
              </Tooltip>
            )}
          </div>

          <div className="ompi-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`ompi-preset${days === p ? ' is-on' : ''}`}
                onClick={() => setDays(p)}
              >
                {p} days
                {defaults?.days === p && <span className="ompi-preset-flag">default</span>}
              </button>
            ))}
            <InputNumber
              min={1}
              max={365}
              value={days}
              onChange={(v) => setDays(v ?? 1)}
              className="ompi-number"
              addonAfter="days"
            />
          </div>

          <div className="ompi-hint">
            Only employees can see this opening until{' '}
            <strong>{closesOn.format('D MMM YYYY')}</strong>.
          </div>
        </div>

        {/* Auto-move */}
        <div className="ompi-block">
          <div className="ompi-switch-row">
            <div>
              <span className="ompi-label">
                <Bot size={13} /> Auto-move to external
              </span>
              <div className="ompi-hint" style={{ marginTop: 4 }}>
                {autoMove ? (
                  <>
                    On <strong>{closesOn.format('D MMM')}</strong> this publishes externally on its
                    own. A scheduled job runs hourly.
                  </>
                ) : (
                  <>
                    The window will close and the opening will sit until someone publishes it
                    externally by hand.
                  </>
                )}
              </div>
            </div>
            <Switch checked={autoMove} onChange={setAutoMove} />
          </div>
        </div>

        {/* Note */}
        <div className="ompi-block">
          <span className="ompi-label">Note</span>
          <Input
            className="ompi-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — e.g. IJP first, per policy"
          />
        </div>

        {overridden && (
          <div className="ompi-override">
            Using different settings for this posting only — the tenant defaults
            {defaults ? ` (${defaults.days} days, auto-move ${defaults.autoMove ? 'on' : 'off'})` : ''}{' '}
            are unchanged.
          </div>
        )}
      </div>

      <style jsx global>{`
        .ompi-modal .ant-modal-body { padding-top: 8px; }
        .ompi { display: flex; flex-direction: column; gap: 16px; }

        /* Timeline */
        .ompi-timeline {
          display: flex; align-items: center; gap: 10px; padding: 14px 16px;
          border: 1px solid var(--border-slate-200); border-radius: 10px;
          background: var(--bg-slate-50);
        }
        .ompi-stage { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
        .ompi-stage.is-muted .ompi-stage-title { color: var(--text-slate-500); }
        .ompi-stage-dot {
          width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ompi-stage-text { min-width: 0; }
        .ompi-stage-title {
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2;
          white-space: nowrap;
        }
        .ompi-stage-sub { font-size: 11px; color: var(--text-slate-500); margin-top: 2px; white-space: nowrap; }
        .ompi-connector {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          flex-shrink: 0; padding: 0 4px;
        }
        .ompi-connector-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-slate-400); white-space: nowrap;
        }
        .ompi-connector-line { display: none; }
        .ompi-connector-arrow { color: var(--text-slate-300); }

        /* Blocks */
        .ompi-block { display: flex; flex-direction: column; gap: 8px; }
        .ompi-block-head { display: flex; align-items: center; justify-content: space-between; }
        .ompi-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-500);
        }
        .ompi-hint { font-size: 11.5px; color: var(--text-slate-500); line-height: 1.5; }
        .ompi-reset {
          display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent;
          font-size: 11px; color: ${PALETTE.blue}; cursor: pointer; padding: 2px 4px;
        }
        .ompi-reset:hover { text-decoration: underline; }

        /* Presets */
        .ompi-presets { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .ompi-preset {
          position: relative; padding: 6px 12px; border-radius: 8px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 12px; font-weight: 600; color: var(--text-slate-700);
        }
        .ompi-preset:hover { border-color: ${PALETTE.blue}66; }
        .ompi-preset.is-on {
          border-color: ${PALETTE.blue}; background: ${TINT.blue}; color: var(--text-slate-900);
        }
        .ompi-preset-flag {
          margin-left: 6px; font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--text-slate-400);
        }
        .ompi-number { width: 132px; }
        .ompi-number .ant-input-number-input { font-size: 12px; }

        .ompi-switch-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
        .ompi-switch-row > div:first-child { flex: 1; }

        .ompi-note.ant-input { font-size: 12.5px; }

        .ompi-override {
          font-size: 11.5px; color: var(--text-slate-600); line-height: 1.5;
          padding: 10px 12px; border-radius: 8px;
          background: ${TINT.blue}; border: 1px solid ${PALETTE.blue}33;
        }

        @media (max-width: 560px) {
          .ompi-timeline { flex-direction: column; align-items: stretch; gap: 12px; }
          .ompi-connector { flex-direction: row; justify-content: center; }
          .ompi-connector-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </Modal>
  );
}
