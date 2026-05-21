'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useProposalStore, BlockType } from '@/store/proposalStore';
import { BLOCK_LABEL, getBlockStatus } from './blockStatus';
import {
  Search,
  Sparkles,
  Save,
  Eye,
  Download,
  Plus,
  ArrowRightCircle,
  CornerDownLeft,
} from 'lucide-react';

type Command = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string[];
  run: () => void;
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
  onExport: () => void;
  onOpenZai: () => void;
  onJumpToBlock: (id: string) => void;
}

const groupOrder = ['Actions', 'Add Block', 'Jump to Section'];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onSave,
  onTogglePreview,
  onExport,
  onOpenZai,
  onJumpToBlock,
}) => {
  const { blocks, addBlock } = useProposalStore();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'zai',
        group: 'Actions',
        label: 'Generate with Zai',
        hint: 'Full document',
        icon: <Sparkles size={14} />,
        keywords: ['ai', 'zai', 'generate', 'write'],
        run: onOpenZai,
      },
      {
        id: 'save',
        group: 'Actions',
        label: 'Save proposal',
        icon: <Save size={14} />,
        keywords: ['save'],
        run: onSave,
      },
      {
        id: 'preview',
        group: 'Actions',
        label: 'Toggle live preview',
        icon: <Eye size={14} />,
        keywords: ['preview', 'view'],
        run: onTogglePreview,
      },
      {
        id: 'export',
        group: 'Actions',
        label: 'Export proposal',
        hint: 'PDF · DOCX',
        icon: <Download size={14} />,
        keywords: ['export', 'pdf', 'word', 'docx', 'download'],
        run: onExport,
      },
    ];

    const blockTypes: BlockType[] = ['cover', 'text', 'scope', 'timeline', 'pricing', 'signature', 'section'];
    const adds: Command[] = blockTypes.map((t) => ({
      id: `add-${t}`,
      group: 'Add Block',
      label: `Add ${BLOCK_LABEL[t]} block`,
      icon: <Plus size={14} />,
      keywords: ['add', 'insert', 'new', t],
      run: () => addBlock(t),
    }));

    const jumps: Command[] = blocks.map((b, idx) => ({
      id: `jump-${b.id}`,
      group: 'Jump to Section',
      label: `${String(idx + 1).padStart(2, '0')} · ${BLOCK_LABEL[b.type]}`,
      hint: getBlockStatus(b),
      icon: <ArrowRightCircle size={14} />,
      keywords: ['jump', 'go', b.type, BLOCK_LABEL[b.type]],
      run: () => onJumpToBlock(b.id),
    }));

    return [...base, ...adds, ...jumps];
  }, [blocks, addBlock, onOpenZai, onSave, onTogglePreview, onExport, onJumpToBlock]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = [c.label, c.group, c.hint, ...(c.keywords || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, commands]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach((c) => {
      const arr = map.get(c.group) || [];
      arr.push(c);
      map.set(c.group, arr);
    });
    return groupOrder
      .map((g) => ({ group: g, items: map.get(g) || [] }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIdx(0);
  }, [filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[activeIdx];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, filtered, activeIdx, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-cmd-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  if (!open) return null;

  let runningIdx = -1;

  return (
    <div className="pb-cmdk" onMouseDown={onClose}>
      <div className="pb-cmdk__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pb-cmdk__input-row">
          <Search size={16} className="pb-cmdk__search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, or search…"
            className="pb-cmdk__input"
          />
          <kbd className="pb-cmdk__esc">ESC</kbd>
        </div>

        <div ref={listRef} className="pb-cmdk__list">
          {grouped.length === 0 ? (
            <div className="pb-cmdk__empty">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="pb-cmdk__group">
                <div className="pb-cmdk__group-head">{group}</div>
                {items.map((cmd) => {
                  runningIdx += 1;
                  const idx = runningIdx;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-cmd-idx={idx}
                      className={`pb-cmdk__item ${isActive ? 'pb-cmdk__item--active' : ''}`}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        cmd.run();
                        onClose();
                      }}
                    >
                      <span className="pb-cmdk__item-icon">{cmd.icon}</span>
                      <span className="pb-cmdk__item-label">{cmd.label}</span>
                      {cmd.hint && <span className="pb-cmdk__item-hint">{cmd.hint}</span>}
                      {isActive && (
                        <span className="pb-cmdk__item-enter">
                          <CornerDownLeft size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="pb-cmdk__footer">
          <div className="pb-cmdk__footer-hints">
            <span>
              <kbd className="pb-rail__kbd">↑</kbd>
              <kbd className="pb-rail__kbd">↓</kbd>
              <span className="pb-cmdk__hint-label">to navigate</span>
            </span>
            <span>
              <kbd className="pb-rail__kbd">↵</kbd>
              <span className="pb-cmdk__hint-label">to select</span>
            </span>
            <span>
              <kbd className="pb-rail__kbd">ESC</kbd>
              <span className="pb-cmdk__hint-label">to close</span>
            </span>
          </div>
          <span className="pb-cmdk__brand">
            <Sparkles size={11} />
            Zai · Command
          </span>
        </div>
      </div>
    </div>
  );
};
