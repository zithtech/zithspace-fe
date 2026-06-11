import type { ProposalBlock, BlockType } from '@/store/proposalStore';

export type BlockStatus = 'empty' | 'drafting' | 'ready';

const REQUIRED_FIELDS: Partial<Record<BlockType, string[]>> = {
  cover: ['title', 'clientName'],
  text: ['heading', 'content'],
  section: ['heading', 'content'],
  pricing: ['title'],
  signature: ['title'],
  scope: ['title'],
  timeline: ['title'],
};

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').trim();

const isFilledString = (v: unknown): boolean =>
  typeof v === 'string' && stripHtml(v).length > 0;

const isFilledArray = (v: unknown): boolean => Array.isArray(v) && v.length > 0;

export const getBlockStatus = (block: ProposalBlock): BlockStatus => {
  const data = block.data || {};

  const anyContent =
    Object.values(data).some(isFilledString) ||
    Object.values(data).some(isFilledArray);

  if (!anyContent) return 'empty';

  const required = REQUIRED_FIELDS[block.type] || [];
  if (required.length === 0) return 'ready';

  const allRequiredFilled = required.every((key) => {
    const v = data[key];
    if (isFilledString(v)) return true;
    if (isFilledArray(v)) return true;
    return false;
  });

  return allRequiredFilled ? 'ready' : 'drafting';
};

export const BLOCK_LABEL: Record<BlockType, string> = {
  cover: 'Cover',
  text: 'Summary',
  section: 'Section',
  scope: 'Scope of Work',
  timeline: 'Timeline',
  pricing: 'Pricing',
  signature: 'Signature',
  component: 'Component',
};

export const STATUS_LABEL: Record<BlockStatus, string> = {
  empty: 'Empty',
  drafting: 'Drafting',
  ready: 'Ready',
};
