import { api } from '@/lib/axios';
import { Channel } from '@/store/chatStore';

interface CreateChannelData {
    name?: string;
    description?: string;
    type?: 'CHANNEL' | 'DM' | 'GROUP';
    members?: string[];
}

export interface PublicChannel extends Channel {
    isMember: boolean;
    memberCount: number;
}

export const channelService = {
    getChannels: async (): Promise<Channel[]> => {
        return await api.get<Channel[]>('/api/channels');
    },

    getChannel: async (id: string): Promise<Channel> => {
        return await api.get<Channel>(`/api/channels/${id}`);
    },

    createChannel: async (data: CreateChannelData): Promise<Channel> => {
        return await api.post<Channel>('/api/channels', data);
    },

    discoverChannels: async (): Promise<PublicChannel[]> => {
        return await api.get<PublicChannel[]>('/api/channels/discover');
    },

    joinChannel: async (channelId: string): Promise<Channel> => {
        return await api.post<Channel>(`/api/channels/${channelId}/join`, {});
    },

    addMembers: async (channelId: string, memberIds: string[]): Promise<Channel> => {
        return await api.post<Channel>(`/api/channels/${channelId}/members`, { memberIds });
    },
};
