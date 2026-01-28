import { api } from '@/lib/axios';

export interface User {
    id: string;
    name: string;
    email: string;
    workEmail?: string;
    avatar?: string;
}

export const userService = {
    searchUsers: async (query: string): Promise<User[]> => {
        return await api.get<User[]>(`/api/members?search=${encodeURIComponent(query)}`);
    },

    getUsers: async (): Promise<User[]> => {
        return await api.get<User[]>('/api/members');
    }
};
