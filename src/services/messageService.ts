import { api } from '@/lib/axios';

export interface Message {
    id: string;
    channelId: string;
    userId: string;
    content: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        workEmail: string;
    };
}

export const messageService = {
    getMessages: async (channelId: string): Promise<Message[]> => {
        // Add timestamp to prevent browser caching
        return await api.get<Message[]>(`/api/channels/${channelId}/messages?_t=${Date.now()}`);
    },

    sendMessage: async (channelId: string, content: string): Promise<Message> => {
        return await api.post<Message>(`/api/channels/${channelId}/messages`, { content });
    },
};
