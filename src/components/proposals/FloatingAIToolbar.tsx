'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, message, Spin } from 'antd';
import {
  Sparkles,
  Wand2,
  Scissors,
  Expand,
  Briefcase,
  Check,
  X,
} from 'lucide-react';
import { ProposalService } from '@/services/proposalService';
import { useProposalStore } from '@/store/proposalStore';

type QuickAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'rewrite',
    label: 'Rewrite',
    icon: <Wand2 size={12} />,
    prompt: 'Rewrite this passage to be clearer and more polished. Preserve the meaning exactly.',
  },
  {
    key: 'shorten',
    label: 'Shorten',
    icon: <Scissors size={12} />,
    prompt: 'Make this passage significantly shorter while preserving the key point.',
  },
  {
    key: 'expand',
    label: 'Expand',
    icon: <Expand size={12} />,
    prompt: 'Expand this passage with more detail and persuasive context.',
  },
  {
    key: 'formal',
    label: 'Formal',
    icon: <Briefcase size={12} />,
    prompt: 'Rewrite this passage in a more formal, professional tone for a client proposal.',
  },
];

const MIN_SELECTION_CHARS = 2;
const TOOLBAR_OFFSET = 52;

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const FloatingAIToolbar: React.FC = () => {
  const updateBlock = useProposalStore((s) => s.updateBlock);

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const toolbarRef = useRef<HTMLDivElement>(null);
  // The active selection is captured in a ref so async action handlers always
  // act on the snapshot taken when the toolbar appeared, even if the user's
  // live selection changes mid-flight.
  const savedSelection = useRef<{ text: string; blockId: string } | null>(null);

  const closeAll = useCallback(() => {
    setVisible(false);
    setSuggestion(null);
    setShowCustom(false);
    setCustomPrompt('');
    setLoading(false);
    savedSelection.current = null;
  }, []);

  // Read the current document selection and decide whether to show the toolbar.
  const updateFromSelection = useCallback(() => {
    // While a suggestion or loading state is open, don't let selection changes
    // dismiss the toolbar — the user is interacting with the popup.
    if (loading || suggestion || showCustom) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setVisible(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < MIN_SELECTION_CHARS) {
      setVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const el = (anchor.nodeType === Node.ELEMENT_NODE
      ? (anchor as HTMLElement)
      : anchor.parentElement) as HTMLElement | null;

    // Selection must live inside a canvas block — ignore selections in the
    // right panel, header, etc.
    const canvas = document.getElementById('proposal-builder-canvas');
    if (!el || !canvas || !canvas.contains(el)) {
      setVisible(false);
      return;
    }
    const blockEl = el.closest('[data-block-id]') as HTMLElement | null;
    if (!blockEl) {
      setVisible(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    const id = blockEl.getAttribute('data-block-id');
    if (!id) {
      setVisible(false);
      return;
    }

    savedSelection.current = { text, blockId: id };
    setPos({
      top: Math.max(8, rect.top - TOOLBAR_OFFSET),
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  }, [loading, suggestion, showCustom]);

  useEffect(() => {
    const handler = () => {
      // Defer so the browser's selection has settled by the time we read it.
      window.setTimeout(updateFromSelection, 0);
    };
    document.addEventListener('mouseup', handler);
    document.addEventListener('keyup', handler);
    return () => {
      document.removeEventListener('mouseup', handler);
      document.removeEventListener('keyup', handler);
    };
  }, [updateFromSelection]);

  // Hide when the canvas scrolls (the rect goes stale).
  useEffect(() => {
    const scroller = document.querySelector('.builder-canvas-wrapper');
    if (!scroller) return;
    const handler = () => {
      if (loading || suggestion) return;
      setVisible(false);
    };
    scroller.addEventListener('scroll', handler, { passive: true });
    return () => scroller.removeEventListener('scroll', handler);
  }, [loading, suggestion]);

  // Dismiss on outside click.
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) return;
      // Don't auto-close while loading or while showing a suggestion.
      if (loading || suggestion) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length >= MIN_SELECTION_CHARS) return;
      closeAll();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible, loading, suggestion, closeAll]);

  const runAction = async (instruction: string) => {
    const snapshot = savedSelection.current;
    if (!snapshot) return;
    const block = useProposalStore.getState().blocks.find((b) => b.id === snapshot.blockId);
    if (!block) return;

    setLoading(true);
    setSuggestion(null);
    try {
      const fullPrompt = [
        'You are rewriting ONE specific passage inside a larger proposal block.',
        'Return ONLY the rewritten passage as plain text — no quotes, no markdown, no commentary, no surrounding HTML.',
        '',
        `Passage to rewrite: "${snapshot.text}"`,
        '',
        `Instruction: ${instruction}`,
      ].join('\n');

      const res: any = await ProposalService.refineBlock({
        blockId: snapshot.blockId,
        blockType: block.type,
        currentData: { selection: snapshot.text, fullBlock: block.data },
        userPrompt: fullPrompt,
      });

      const payload = res?.data?.data ?? res?.data ?? res;
      let suggested = '';
      if (typeof payload === 'string') {
        suggested = payload;
      } else if (payload && typeof payload === 'object') {
        const firstStr = Object.values(payload).find(
          (v) => typeof v === 'string' && (v as string).trim().length > 0,
        );
        suggested = (firstStr as string) || '';
      }
      suggested = stripHtml(suggested).trim().replace(/^["']|["']$/g, '').trim();

      if (!suggested) {
        message.error('Zai returned nothing usable for that selection.');
        setLoading(false);
        return;
      }
      setSuggestion(suggested);
    } catch (err) {
      console.error('Floating AI refine error:', err);
      message.error('Zai could not refine this passage.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    const snapshot = savedSelection.current;
    if (!snapshot || !suggestion) return;
    const block = useProposalStore.getState().blocks.find((b) => b.id === snapshot.blockId);
    if (!block) return;

    const patch: Record<string, any> = {};
    let replaced = false;

    Object.entries(block.data).forEach(([key, value]) => {
      if (typeof value !== 'string') return;

      // Plain text match — easy case.
      if (value.includes(snapshot.text)) {
        patch[key] = value.replace(snapshot.text, suggestion);
        replaced = true;
        return;
      }

      // HTML field: the selection may straddle inline tags. Build a regex that
      // tolerates tag boundaries between whitespace tokens.
      const stripped = stripHtml(value);
      if (!stripped.includes(snapshot.text)) return;
      const pattern = escapeRegExp(snapshot.text).replace(/\\\s+/g, '(?:\\s|<[^>]+>)*');
      try {
        const re = new RegExp(pattern);
        if (re.test(value)) {
          patch[key] = value.replace(re, suggestion);
          replaced = true;
        }
      } catch {
        // Ignore — fall through to the warning below.
      }
    });

    if (!replaced) {
      message.warning('Could not pinpoint the exact location — try selecting a smaller phrase.');
      return;
    }

    updateBlock(snapshot.blockId, patch);
    message.success('Applied Zai suggestion');
    window.getSelection()?.removeAllRanges();
    closeAll();
  };

  const dismissSuggestion = () => {
    window.getSelection()?.removeAllRanges();
    closeAll();
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="pb-ai-toolbar"
      style={{ top: pos.top, left: pos.left }}
      // Don't let toolbar interaction clear the selection.
      onMouseDown={(e) => e.preventDefault()}
    >
      {suggestion ? (
        <div className="pb-ai-toolbar__suggestion">
          <div className="pb-ai-toolbar__suggestion-head">
            <Sparkles size={12} />
            <span>Zai suggests</span>
          </div>
          <div className="pb-ai-toolbar__suggestion-body">{suggestion}</div>
          <div className="pb-ai-toolbar__suggestion-actions">
            <Button size="small" type="primary" icon={<Check size={12} />} onClick={applySuggestion}>
              Replace
            </Button>
            <Button size="small" icon={<X size={12} />} onClick={dismissSuggestion}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : loading ? (
        <div className="pb-ai-toolbar__loading">
          <Spin size="small" />
          <span>Zai is thinking…</span>
        </div>
      ) : showCustom ? (
        <div className="pb-ai-toolbar__custom">
          <Input
            size="small"
            autoFocus
            placeholder="Tell Zai what to do…"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onPressEnter={() => customPrompt.trim() && runAction(customPrompt.trim())}
            style={{ width: 240 }}
          />
          <Button
            size="small"
            type="primary"
            icon={<Sparkles size={12} />}
            disabled={!customPrompt.trim()}
            onClick={() => runAction(customPrompt.trim())}
          >
            Go
          </Button>
          <Button size="small" type="text" icon={<X size={12} />} onClick={() => setShowCustom(false)} />
        </div>
      ) : (
        <div className="pb-ai-toolbar__actions">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              className="pb-ai-toolbar__btn"
              onClick={() => runAction(a.prompt)}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
          <span className="pb-ai-toolbar__sep" />
          <button
            type="button"
            className="pb-ai-toolbar__btn pb-ai-toolbar__btn--custom"
            onClick={() => setShowCustom(true)}
          >
            <Sparkles size={12} />
            <span>Custom…</span>
          </button>
        </div>
      )}
    </div>
  );
};
