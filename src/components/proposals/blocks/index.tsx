import React from 'react';
import { CoverBlock, CoverBlockSettings } from './CoverBlock';
import { TextBlock, TextBlockSettings } from './TextBlock';
import { PricingBlock, PricingBlockSettings } from './PricingBlock';
import { SignatureBlock, SignatureBlockSettings } from './SignatureBlock';
import { ScopeBlock, ScopeBlockSettings } from './ScopeBlock';
import { TimelineBlock, TimelineBlockSettings } from './TimelineBlock';
import { ComposerBlockView, TwoColumnSettings, ParagraphSettings } from '../library/composerComponents';
import { BlockType } from '@/store/proposalStore';

// Component kinds edited in the right-side panel instead of inline on the canvas.
const PANEL_EDITED_KINDS = ['paragraph', 'twoColumn'];

export const BlockRenderer: React.FC<{ type: BlockType; data: any; editable?: boolean; onChange?: (patch: any) => void }> = ({ type, data, editable, onChange }) => {
  switch (type) {
    case 'cover': return <CoverBlock data={data} />;
    case 'text': return <TextBlock data={data} editable={editable} onUpdate={onChange} />;
    case 'pricing': return <PricingBlock data={data} />;
    case 'signature': return <SignatureBlock data={data} />;
    case 'scope': return <ScopeBlock data={data} />;
    case 'timeline': return <TimelineBlock data={data} />;
    case 'section': return <TextBlock data={data} editable={editable} onUpdate={onChange} />;
    case 'component': {
      if (!data?.kind) return null;
      // Paragraph / Two Columns are edited in the right panel → read-only here.
      const inline = !!editable && !PANEL_EDITED_KINDS.includes(data.kind);
      return (
        <div className="cmp-doc" style={{ padding: '4px 0' }}>
          <ComposerBlockView
            component={data}
            editable={inline}
            onChange={inline && onChange ? (props) => onChange({ props }) : undefined}
          />
        </div>
      );
    }
    default: return null;
  }
};

export const BlockSettingsRenderer: React.FC<{ type: BlockType; data: any; onUpdate: (data: any) => void }> = ({ type, data, onUpdate }) => {
  switch (type) {
    case 'cover': return <CoverBlockSettings data={data} onUpdate={onUpdate} />;
    case 'text': return <TextBlockSettings data={data} onUpdate={onUpdate} />;
    case 'pricing': return <PricingBlockSettings data={data} onUpdate={onUpdate} />;
    case 'signature': return <SignatureBlockSettings data={data} onUpdate={onUpdate} />;
    case 'scope': return <ScopeBlockSettings data={data} onUpdate={onUpdate} />;
    case 'timeline': return <TimelineBlockSettings data={data} onUpdate={onUpdate} />;
    case 'section': return <TextBlockSettings data={data} onUpdate={onUpdate} />;
    case 'component':
      if (data?.kind === 'twoColumn') return <TwoColumnSettings props={data.props || {}} onChange={(patch) => onUpdate({ props: { ...(data.props || {}), ...patch } })} />;
      if (data?.kind === 'paragraph') return <ParagraphSettings props={data.props || {}} onChange={(patch) => onUpdate({ props: { ...(data.props || {}), ...patch } })} />;
      return (
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary, #64748b)', lineHeight: 1.55, padding: '2px 0' }}>
          Edit this component’s text directly on the canvas.
        </div>
      );
    default: return null;
  }
};
