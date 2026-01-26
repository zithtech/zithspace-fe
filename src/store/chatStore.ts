import { create } from 'zustand';

export interface Channel {
    id: string;
    name?: string;
    description?: string;
    type: 'CHANNEL' | 'DM' | 'GROUP';
    lastMessageAt?: string;
    members?: Array<{
        userId: string;
        role: string;
        user?: {
            id: string;
            name: string;
            workEmail: string;
            avatar?: string;
        };
    }>;
}

export interface Message {
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    user?: {
        name: string;
        // avatar?
    };
}

interface ChatState {
    channels: Channel[];
    activeChannelId: string | null;
    messages: Record<string, Message[]>; // channelId -> messages
    isLoading: boolean;

    setChannels: (channels: Channel[]) => void;
    setActiveChannel: (channelId: string) => void;
    addMessage: (channelId: string, message: Message) => void;
    setMessages: (channelId: string, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    channels: [],
    activeChannelId: null,
    messages: {},
    isLoading: false,

    setChannels: (channels) => set({ channels }),
    setActiveChannel: (activeChannelId) => set({ activeChannelId }),

    addMessage: (channelId, message) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [channelId]: [...(state.messages[channelId] || []), message],
            },
        })),

    setMessages: (channelId, messages) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [channelId]: messages,
            },
        })),
}));
