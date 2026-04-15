import React from 'react';
import { CoverBlock, CoverBlockSettings } from './CoverBlock';
import { TextBlock, TextBlockSettings } from './TextBlock';
import { PricingBlock, PricingBlockSettings } from './PricingBlock';
import { SignatureBlock, SignatureBlockSettings } from './SignatureBlock';
import { ScopeBlock, ScopeBlockSettings } from './ScopeBlock';
import { TimelineBlock, TimelineBlockSettings } from './TimelineBlock';
import { BlockType } from '@/store/proposalStore';

export const BlockRenderer: React.FC<{ type: BlockType; data: any }> = ({ type, data }) => {
  switch (type) {
    case 'cover': return <CoverBlock data={data} />;
    case 'text': return <TextBlock data={data} />;
    case 'pricing': return <PricingBlock data={data} />;
    case 'signature': return <SignatureBlock data={data} />;
    case 'scope': return <ScopeBlock data={data} />;
    case 'timeline': return <TimelineBlock data={data} />;
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
    default: return null;
  }
};
