import React from 'react';
import { Sparkles } from 'lucide-react';

export const BlockGhostHint: React.FC<{ label?: string }> = ({ label = 'Edit in the side panel or use Enhance with Zai to fill this section.' }) => (
  <div className="block-ghost-hint">
    <span className="block-ghost-hint__icon"><Sparkles size={11} /></span>
    <span className="block-ghost-hint__text">{label}</span>
  </div>
);

export const BlockGhostText: React.FC<{
  children: React.ReactNode;
  size?: 'h1' | 'h2' | 'h3' | 'body' | 'small';
  block?: boolean;
}> = ({ children, size = 'body', block = false }) => {
  const Tag: any = block ? 'div' : 'span';
  return <Tag className={`block-ghost-text block-ghost-text--${size}`}>{children}</Tag>;
};

export const BlockGhostLine: React.FC<{ width?: string }> = ({ width = '100%' }) => (
  <div className="block-ghost-line" style={{ width }} />
);
