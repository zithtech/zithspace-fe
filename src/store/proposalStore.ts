import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type BlockType = 'cover' | 'text' | 'pricing' | 'signature' | 'scope' | 'timeline' | 'section';

export interface ProposalBlock {
  id: string;
  type: BlockType;
  data: any;
}

interface ProposalState {
  blocks: ProposalBlock[];
  selectedBlockId: string | null;
  addBlock: (type: BlockType, index?: number) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, data: any) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  setSelectedBlockId: (id: string | null) => void;
  setBlocks: (blocks: ProposalBlock[]) => void;
}

const getDefaultDataForType = (type: BlockType) => {
  switch (type) {
    case 'cover':
      return {
        title: '',
        projectSummary: '',
        clientName: '',
        clientCompany: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
        senderName: '',
        senderCompany: '',
        senderContact: '',
        senderEmail: '',
        senderAddress: '',
        logoUrl: '',
        date: '',
        validUntil: '',
      };
    case 'text':
      return {
        heading: '',
        content: '',
      };
    case 'section':
      return {
        heading: '',
        content: '',
      };
    case 'pricing':
      return {
        title: '',
        currency: 'USD',
        items: [],
        taxRate: 0,
      };
    case 'signature':
      return {
        title: '',
        ipClause: '',
        revisionClause: '',
        terminationClause: '',
        ndaClause: '',
        companyName: '',
        clientName: '',
        companySigner: '',
        clientSigner: '',
      };
    case 'scope':
      return {
        title: '',
        milestones: [],
        terms: [],
      };
    case 'timeline':
      return {
        title: '',
        startDate: '',
        finalDate: '',
        dependencyNotes: '',
        phases: [],
      };
    default:
      return {};
  }
};

export const useProposalStore = create<ProposalState>((set) => ({
  blocks: [],
  selectedBlockId: null,
  
  addBlock: (type, index) => set((state) => {
    // Unique blocks should only have one instance
    const uniqueTypes: BlockType[] = ['cover', 'pricing', 'signature', 'timeline', 'scope'];
    
    if (uniqueTypes.includes(type)) {
      const existingBlock = state.blocks.find(b => b.type === type);
      if (existingBlock) {
        // Just select the existing one instead of adding a new one
        return { selectedBlockId: existingBlock.id };
      }
    }

    const newBlock: ProposalBlock = {
      id: nanoid(),
      type,
      data: getDefaultDataForType(type),
    };
    const newBlocks = [...state.blocks];
    if (index !== undefined && index >= 0) {
      newBlocks.splice(index, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    return { blocks: newBlocks, selectedBlockId: newBlock.id };
  }),

  
  removeBlock: (id) => set((state) => ({
    blocks: state.blocks.filter((b) => b.id !== id),
    selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
  })),
  
  updateBlock: (id, data) => set((state) => ({
    blocks: state.blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)),
  })),
  
  reorderBlocks: (activeId, overId) => set((state) => {
    const oldIndex = state.blocks.findIndex((b) => b.id === activeId);
    const newIndex = state.blocks.findIndex((b) => b.id === overId);
    if (oldIndex === -1 || newIndex === -1) return state;
    
    const newBlocks = [...state.blocks];
    const [movedBlock] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, movedBlock);
    
    return { blocks: newBlocks };
  }),
  
  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  
  setBlocks: (blocks) => set({ blocks }),
}));
