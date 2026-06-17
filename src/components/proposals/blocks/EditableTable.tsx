'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { nanoid } from 'nanoid';
import {
  Plus, X, AlignLeft, AlignCenter, AlignRight, Maximize2, Minimize2,
  ChevronUp, ChevronDown, Bold, Italic, Underline, Table as TableIcon,
} from 'lucide-react';

interface Col { id: string; label: string; width: number; align?: 'left' | 'center' | 'right' }
interface Row { id: string; height: number; cells: Record<string, string> }

const ALIGN_ICON: Record<string, React.ReactNode> = {
  left: <AlignLeft size={11} />, center: <AlignCenter size={11} />, right: <AlignRight size={11} />,
};
const TEXT_COLORS = ['#0f172a', '#2563eb', '#059669', '#475569', '#ef4444'];

export const makeDefaultTable = () => ({
  columns: [
    { id: nanoid(), label: 'Item', width: 220, align: 'left' as const },
    { id: nanoid(), label: 'Detail', width: 220, align: 'left' as const },
    { id: nanoid(), label: 'Value', width: 140, align: 'right' as const },
  ],
  rows: [
    { id: nanoid(), height: 40, cells: {} },
    { id: nanoid(), height: 40, cells: {} },
    { id: nanoid(), height: 40, cells: {} },
  ],
});

// ── Rich-text cell: contentEditable + a selection toolbar (B / I / U / colour) ──
const CellEditor: React.FC<{ html: string; align?: string; onChange: (html: string) => void }> = ({ html, align, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tb, setTb] = useState<{ top: number; left: number } | null>(null);

  // Sync external HTML in only when this cell isn't being edited (avoids caret jumps).
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== (html || '')) el.innerHTML = html || '';
  });

  const save = () => onChange(ref.current?.innerHTML || '');
  const updateToolbar = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !ref.current || !ref.current.contains(sel.anchorNode)) {
      setTb(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) { setTb(null); return; }
    setTb({ top: rect.top - 44, left: rect.left + rect.width / 2 });
  };
  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    save();
    updateToolbar();
  };

  return (
    <>
      <div
        ref={ref}
        className="etbl-cell"
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        onInput={save}
        onMouseUp={updateToolbar}
        onKeyUp={updateToolbar}
        onDoubleClick={updateToolbar}
        onBlur={() => setTimeout(() => setTb(null), 200)}
        onClick={(e) => e.stopPropagation()}
        style={{ textAlign: align as any }}
      />
      {tb && createPortal(
        <div className="etbl-fmt" style={{ top: tb.top, left: tb.left }} onMouseDown={(e) => e.preventDefault()}>
          <button type="button" onClick={() => exec('bold')} title="Bold"><Bold size={13} /></button>
          <button type="button" onClick={() => exec('italic')} title="Italic"><Italic size={13} /></button>
          <button type="button" onClick={() => exec('underline')} title="Underline"><Underline size={13} /></button>
          <span className="etbl-fmt-sep" />
          {TEXT_COLORS.map((c) => (
            <button key={c} type="button" className="etbl-swatch" style={{ background: c }} title="Text colour" onClick={() => exec('foreColor', c)} />
          ))}
        </div>,
        document.body,
      )}
    </>
  );
};

interface Props { value: any; editable?: boolean; onChange?: (v: any) => void }

export const EditableTable: React.FC<Props> = ({ value, editable, onChange }) => {
  const columns: Col[] = value?.columns || [];
  const rows: Row[] = value?.rows || [];

  const [maximized, setMaximized] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const valueRef = useRef(value); valueRef.current = value;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;

  const setColumns = (c: Col[]) => onChange?.({ ...value, columns: c });
  const setRows = (r: Row[]) => onChange?.({ ...value, rows: r });
  const addColumn = () => setColumns([...columns, { id: nanoid(), label: `Column ${columns.length + 1}`, width: 160, align: 'left' }]);
  const removeColumn = (id: string) => setColumns(columns.filter((c) => c.id !== id));
  const addRow = () => setRows([...rows, { id: nanoid(), height: 40, cells: {} }]);
  const removeRow = (id: string) => setRows(rows.filter((r) => r.id !== id));
  const setLabel = (id: string, label: string) => setColumns(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  const cycleAlign = (id: string) => setColumns(columns.map((c) => {
    if (c.id !== id) return c;
    const n = c.align === 'left' ? 'center' : c.align === 'center' ? 'right' : 'left';
    return { ...c, align: n as Col['align'] };
  }));
  const setCell = (rowId: string, colId: string, v: string) =>
    setRows(rows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: v } } : r)));

  // ── resize (stable global listeners) ──
  const drag = useRef<{ type: 'col' | 'row'; id: string; start: number; startSize: number } | null>(null);
  const raf = useRef<number | null>(null);
  const handlers = useRef<{ move: (e: MouseEvent) => void; end: () => void } | null>(null);
  if (!handlers.current) {
    const move = (e: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const v = valueRef.current;
        if (d.type === 'col') {
          const w = Math.max(60, Math.round(d.startSize + (e.clientX - d.start)));
          onChangeRef.current?.({ ...v, columns: (v.columns || []).map((c: Col) => (c.id === d.id ? { ...c, width: w } : c)) });
        } else {
          const h = Math.max(28, Math.round(d.startSize + (e.clientY - d.start)));
          onChangeRef.current?.({ ...v, rows: (v.rows || []).map((r: Row) => (r.id === d.id ? { ...r, height: h } : r)) });
        }
      });
    };
    const end = () => {
      drag.current = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    handlers.current = { move, end };
  }
  const startResize = (e: React.MouseEvent, type: 'col' | 'row', id: string, startSize: number) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { type, id, start: type === 'col' ? e.clientX : e.clientY, startSize };
    document.addEventListener('mousemove', handlers.current!.move);
    document.addEventListener('mouseup', handlers.current!.end);
    document.body.style.cursor = type === 'col' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // ── read-only ──
  if (!editable) {
    return (
      <div className="etbl-wrap" style={{ overflowX: 'auto' }}>
        <table className="etbl">
          <colgroup>{columns.map((c) => <col key={c.id} style={{ width: c.width }} />)}</colgroup>
          <thead><tr>{columns.map((c) => <th key={c.id} className="etbl-th" style={{ textAlign: c.align || 'left' }}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ height: r.height }}>
                {columns.map((c) => (
                  <td key={c.id} className="etbl-td" style={{ textAlign: c.align || 'left', height: r.height }}>
                    <span style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: r.cells[c.id] || '' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── editable table markup (used inline + maximized) ──
  const tableMarkup = (
    <div className="etbl-scroll" onClick={(e) => e.stopPropagation()}>
      <table className="etbl etbl--edit">
        <colgroup>
          {columns.map((c) => <col key={c.id} style={{ width: c.width }} />)}
          <col style={{ width: 34 }} />
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} className="etbl-th">
                <div className="etbl-th-inner">
                  <input
                    className="etbl-hinput"
                    value={col.label}
                    placeholder="Column"
                    onChange={(e) => setLabel(col.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ textAlign: col.align || 'left' }}
                  />
                  <span className="etbl-col-tools">
                    <button type="button" className="etbl-mini" title="Alignment" onClick={(e) => { e.stopPropagation(); cycleAlign(col.id); }}>{ALIGN_ICON[col.align || 'left']}</button>
                    {columns.length > 1 && (
                      <button type="button" className="etbl-mini etbl-mini--del" title="Delete column" onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}><X size={11} /></button>
                    )}
                  </span>
                </div>
                <span className="etbl-col-resize" onMouseDown={(e) => startResize(e, 'col', col.id, col.width)} />
              </th>
            ))}
            <th className="etbl-th etbl-actions">
              <button type="button" className="etbl-add" title="Add column" onClick={(e) => { e.stopPropagation(); addColumn(); }}><Plus size={13} /></button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ height: row.height }}>
              {columns.map((col) => (
                <td key={col.id} className="etbl-td" style={{ height: row.height }}>
                  <CellEditor html={row.cells[col.id] || ''} align={col.align || 'left'} onChange={(v) => setCell(row.id, col.id, v)} />
                  <span className="etbl-row-resize" onMouseDown={(e) => startResize(e, 'row', row.id, row.height)} />
                </td>
              ))}
              <td className="etbl-td etbl-actions">
                {rows.length > 1 && (
                  <button type="button" className="etbl-del-row" title="Delete row" onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}><X size={12} /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="etbl-add-row" onClick={(e) => { e.stopPropagation(); addRow(); }}>
        <Plus size={13} /> Add row
      </button>
    </div>
  );

  const toolbar = (
    <div className="etbl-toolbar" onClick={(e) => e.stopPropagation()}>
      <span className="etbl-title"><TableIcon size={13} /> Table · {columns.length}×{rows.length}</span>
      <span style={{ flex: 1 }} />
      <button type="button" className="etbl-tbtn" title={collapsed ? 'Expand' : 'Minimize'} onClick={() => setCollapsed((c) => !c)}>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      <button type="button" className="etbl-tbtn" title="Maximize" onClick={() => setMaximized(true)}>
        <Maximize2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="etbl-wrap" onClick={(e) => e.stopPropagation()}>
      {toolbar}
      {!collapsed && !maximized && tableMarkup}
      {!collapsed && maximized && <div className="etbl-stub">Editing in full screen…</div>}

      {maximized && createPortal(
        <div className="etbl-overlay" onMouseDown={() => setMaximized(false)}>
          <div className="etbl-overlay-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="etbl-overlay-head">
              <span><TableIcon size={15} /> Table editor</span>
              <button type="button" className="etbl-tbtn" title="Exit full screen" onClick={() => setMaximized(false)}><Minimize2 size={16} /></button>
            </div>
            <div className="etbl-overlay-body">{tableMarkup}</div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
