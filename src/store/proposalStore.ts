import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type BlockType = 'cover' | 'text' | 'pricing' | 'signature' | 'scope' | 'timeline';

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
        title: 'Project Proposal', 
        projectSummary: 'A comprehensive plan to redesign your e-commerce experience.',
        clientName: 'Jane Doe',
        clientCompany: 'Acme Corp',
        clientEmail: 'jane@acme.com',
        clientPhone: '(555) 987-6543',
        clientAddress: '123 Business St, New York, NY 10001',
        senderName: 'John Smith',
        senderCompany: 'Your Agency LLC',
        senderContact: '(555) 123-4567',
        senderEmail: 'contact@youragency.com',
        senderAddress: '123 Agency St, City, State 12345',
        logoUrl: 'https://placehold.co/100x100?text=Logo',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    case 'text':
      return { 
        heading: 'Executive Summary',
        content: 'Write your proposal content here. Explain the objectives, scope, and timeline.' 
      };
    case 'pricing':
      return { 
        title: 'Investment',
        currency: 'USD',
        items: [
          { id: nanoid(), name: 'UI/UX Design', description: 'Wireframes and visual design', price: 1500, quantity: 1 },
          { id: nanoid(), name: 'Frontend Development', description: 'React/Next.js implementation', price: 3000, quantity: 1 }
        ],
        taxRate: 0 
      };
    case 'signature':
      return { 
        title: 'Terms & Conditions',
        ipClause: 'Ownership of all final designs, code, and deliverables fully transfers to the client only upon receipt of complete and final payment.',
        revisionClause: 'A standard "revision" is defined as minor adjustments to existing elements. Major structural or conceptual changes will require a separate change order.',
        terminationClause: 'Either party may cancel this agreement with 7 days written notice. The client will be invoiced for all work proportionally completed up to the cancellation date.',
        ndaClause: 'Both parties agree to maintain strict confidentiality regarding all proprietary business data, strategies, and intellectual property shared during this engagement.',
        companyName: 'Your Company', 
        clientName: 'Client Name',
        companySigner: 'John Doe',
        clientSigner: 'Jane Doe',
      };
    case 'scope':
      return {
        title: 'Scope of Work',
        milestones: [
          { 
            id: nanoid(), 
            title: 'Phase 1: UI/UX Design', 
            deliverables: 'Responsive Dashboard, Figma Prototypes', 
            tasks: 'User research and journey mapping\nWireframing primary screens\nHigh-fidelity visual design' 
          },
          { 
            id: nanoid(), 
            title: 'Phase 2: Frontend Development', 
            deliverables: 'Source Code, React Application', 
            tasks: 'Setup Next.js environment\nComponent architecture and development\nAPI Integration and testing' 
          }
        ],
        terms: [
          { id: nanoid(), title: 'Exclusions', description: 'Logo design is not included.\nBackend database setup is excluded from this phase.', color: '#ef4444' },
          { id: nanoid(), title: 'Revision Terms', description: 'Includes exactly 2 rounds of design revisions.', color: '#3b82f6' }
        ]
      };
    case 'timeline':
      return {
        title: 'Timeline & Schedule',
        startDate: new Date().toISOString().split('T')[0],
        finalDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dependencyNotes: 'Please note: All deadlines are dependent on timely client feedback. Delays in review periods will result in corresponding delays to the schedule.',
        phases: [
          { id: nanoid(), title: 'Phase 1: UI/UX Design', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], reviewPeriod: '3 Days', description: 'Deliverables must be reviewed within 72 hours to maintain our swift momentum.' },
          { id: nanoid(), title: 'Phase 2: Frontend Development', deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], reviewPeriod: '5 Days', description: 'Development kicks off firmly only upon final design approval from key stakeholders.' }
        ]
      };
    default:
      return {};
  }
};

export const useProposalStore = create<ProposalState>((set) => ({
  blocks: [],
  selectedBlockId: null,
  
  addBlock: (type, index) => set((state) => {
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
