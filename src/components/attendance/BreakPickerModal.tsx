'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, TimePicker } from 'antd';
import { PauseCircleOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { BREAK_TYPES, getBreakType, tintOf } from './breakTypes';

const { TextArea } = Input;

// Maximum allowed Permission window.
const PERMISSION_MAX_MINUTES = 150; // 2h 30m

// Premium break picker — shown when a user taps Pause. Pick a reason from a
// tactile card grid, optionally add a note, then start the break.
export default function BreakPickerModal({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (breakType: string, reason?: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [fromTime, setFromTime] = useState<Dayjs | null>(null);
  const [toTime, setToTime] = useState<Dayjs | null>(null);

  // Reset whenever the modal re-opens.
  useEffect(() => {
    if (open) {
      setSelected(null);
      setReason('');
      setFromTime(null);
      setToTime(null);
    }
  }, [open]);

  const chosen = getBreakType(selected || undefined);
  const accent = chosen?.color || '#3B82F6';

  // Permission needs an explicit from–to window.
  const isPermission = chosen?.value === 'permission';
  const permMinutes = isPermission && fromTime && toTime ? toTime.diff(fromTime, 'minute') : 0;
  const durLabel =
    permMinutes > 0
      ? `${Math.floor(permMinutes / 60) ? `${Math.floor(permMinutes / 60)}h ` : ''}${permMinutes % 60}m`
      : '';
  const permOverCap = permMinutes > PERMISSION_MAX_MINUTES;
  const permValid =
    !isPermission || (!!fromTime && !!toTime && permMinutes > 0 && !permOverCap);

  const buildReason = (): string | undefined => {
    const note = reason.trim();
    if (isPermission && fromTime && toTime) {
      const win = `${fromTime.format('HH:mm')}–${toTime.format('HH:mm')} (within ${durLabel})`;
      return note ? `${win} · ${note}` : win;
    }
    return note || undefined;
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={520}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0 },
        content: { padding: 0, overflow: 'hidden', borderRadius: 16 },
        mask: { backdropFilter: 'blur(3px)', background: 'rgba(15,23,42,0.5)' },
      }}
    >
      <div className="bpm">
        {/* Header */}
        <div className="bpm-head" style={{ background: `linear-gradient(135deg, ${tintOf(accent)}, transparent)` }}>
          <div className="bpm-head-icon" style={{ background: tintOf(accent), color: accent }}>
            <PauseCircleOutlined />
          </div>
          <div className="bpm-head-text">
            <div className="bpm-title">Take a break</div>
            <div className="bpm-sub">What are you stepping away for?</div>
          </div>
          <button type="button" className="bpm-close" onClick={onCancel}><CloseOutlined /></button>
        </div>

        {/* Break type grid */}
        <div className="bpm-grid">
          {BREAK_TYPES.map((b) => {
            const active = selected === b.value;
            return (
              <button
                key={b.value}
                type="button"
                className={`bpm-card ${active ? 'is-active' : ''}`}
                onClick={() => {
                  setSelected(b.value);
                  if (b.value === 'permission' && !fromTime) setFromTime(dayjs());
                }}
                style={active ? { borderColor: b.color, boxShadow: `0 0 0 3px ${tintOf(b.color)}` } : undefined}
              >
                <span className="bpm-card-icon" style={{ background: tintOf(b.color), color: b.color }}>
                  {b.icon}
                </span>
                <span className="bpm-card-label">{b.label}</span>
                {active && <span className="bpm-card-tick" style={{ background: b.color }} />}
              </button>
            );
          })}
        </div>

        {/* Permission window (from – to) */}
        {isPermission && (
          <div className="bpm-perm">
            <div className="bpm-perm-row">
              <div className="bpm-perm-field">
                <label className="bpm-perm-label"><ClockCircleOutlined /> From</label>
                <TimePicker
                  value={fromTime}
                  onChange={setFromTime}
                  format="HH:mm"
                  className="bpm-time"
                  placeholder="Start"
                  needConfirm={false}
                  allowClear={false}
                />
              </div>
              <span className="bpm-perm-sep">→</span>
              <div className="bpm-perm-field">
                <label className="bpm-perm-label"><ClockCircleOutlined /> To</label>
                <TimePicker
                  value={toTime}
                  onChange={setToTime}
                  format="HH:mm"
                  className="bpm-time"
                  placeholder="End"
                  needConfirm={false}
                  allowClear={false}
                />
              </div>
              {durLabel && (
                <span
                  className="bpm-perm-dur"
                  style={
                    permOverCap
                      ? { background: 'rgba(239,68,68,0.10)', color: '#ef4444' }
                      : { background: tintOf(accent), color: accent }
                  }
                >
                  within {durLabel}
                </span>
              )}
            </div>
            <div className="bpm-perm-hint">Maximum permission window is 2h 30m.</div>
            {fromTime && toTime && permMinutes <= 0 && (
              <div className="bpm-perm-warn">End time must be after the start time.</div>
            )}
            {permOverCap && (
              <div className="bpm-perm-warn">Permission can’t exceed 2h 30m.</div>
            )}
          </div>
        )}

        {/* Optional reason */}
        <div className="bpm-reason">
          <div className="bpm-reason-label">
            Add a note {chosen?.reasonHint ? <span style={{ color: accent }}>· recommended for {chosen.label}</span> : <span className="bpm-optional">(optional)</span>}
          </div>
          <TextArea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={chosen?.value === 'permission' ? 'e.g. Stepping out for a personal errand' : 'Anything your team should know…'}
            maxLength={300}
          />
        </div>

        {/* Footer */}
        <div className="bpm-foot">
          <Button onClick={onCancel} className="bpm-btn-cancel">Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            disabled={!selected || !permValid}
            onClick={() => selected && permValid && onConfirm(selected, buildReason())}
            className="bpm-btn-start"
            style={selected ? { background: accent, borderColor: accent } : undefined}
          >
            Start break
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .bpm { background: var(--bg-pure-white); }
        .bpm-head {
          display: flex; align-items: center; gap: 14px; padding: 20px 22px 18px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .bpm-head-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .bpm-head-text { flex: 1; min-width: 0; }
        .bpm-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .bpm-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 1px; }
        .bpm-close {
          width: 30px; height: 30px; border-radius: 8px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; transition: all .15s;
        }
        .bpm-close:hover { background: var(--bg-slate-50); color: var(--text-slate-700); }

        .bpm-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 18px 22px 6px;
        }
        .bpm-card {
          position: relative; display: flex; align-items: center; gap: 11px;
          padding: 12px 14px; border-radius: 12px; cursor: pointer; text-align: left;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          transition: border-color .12s ease, box-shadow .12s ease, transform .08s ease;
        }
        .bpm-card:hover { border-color: var(--border-slate-300, #cbd5e1); transform: translateY(-1px); }
        .bpm-card.is-active { transform: translateY(-1px); }
        .bpm-card-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .bpm-card-label { font-size: 13px; font-weight: 600; color: var(--text-slate-800); line-height: 1.2; }
        .bpm-card-tick {
          position: absolute; top: 9px; right: 9px; width: 8px; height: 8px; border-radius: 50%;
        }

        .bpm-perm { padding: 16px 22px 0; }
        .bpm-perm-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
        .bpm-perm-field { display: flex; flex-direction: column; gap: 6px; }
        .bpm-perm-label {
          font-size: 11.5px; font-weight: 700; color: var(--text-slate-600);
          display: inline-flex; align-items: center; gap: 5px;
        }
        .bpm-perm-label .anticon { color: var(--text-slate-400); }
        .bpm-time.ant-picker { height: 40px; border-radius: 10px !important; width: 132px; }
        .bpm-perm-sep { color: var(--text-slate-400); font-size: 16px; padding-bottom: 9px; }
        .bpm-perm-dur {
          margin-left: auto; align-self: center; padding: 6px 13px; border-radius: 999px;
          font-size: 12px; font-weight: 800; letter-spacing: -0.01em;
        }
        .bpm-perm-hint { color: var(--text-slate-400); font-size: 11px; font-weight: 500; margin-top: 8px; }
        .bpm-perm-warn { color: #ef4444; font-size: 11.5px; font-weight: 600; margin-top: 6px; }

        .bpm-reason { padding: 14px 22px 6px; }
        .bpm-reason-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); margin-bottom: 7px; }
        .bpm-reason .bpm-optional { color: var(--text-slate-400); font-weight: 500; }
        .bpm-reason textarea.ant-input {
          border-radius: 10px !important; border: 1px solid var(--border-color) !important;
          background: var(--bg-pure-white) !important;
        }

        .bpm-foot {
          display: flex; align-items: center; justify-content: flex-end; gap: 10px;
          padding: 16px 22px 20px; margin-top: 8px;
        }
        .bpm-btn-cancel { border-radius: 9px !important; height: 40px !important; font-weight: 600 !important; padding: 0 18px !important; }
        .bpm-btn-start {
          border-radius: 9px !important; height: 40px !important; font-weight: 700 !important; padding: 0 22px !important;
          box-shadow: 0 6px 16px rgba(15,23,42,0.12) !important;
        }
        .bpm-btn-start:disabled { opacity: 0.45; box-shadow: none !important; }
      `}</style>
    </Modal>
  );
}
