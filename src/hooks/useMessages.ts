import { useQuery } from '@tanstack/react-query';
import { messageService, Message } from '@/services/messageService';

export const useMessages = (channelId: string) => {
    return useQuery({
        queryKey: ['messages', channelId],
        queryFn: () => messageService.getMessages(channelId),
        enabled: !!channelId,
        staleTime: 1000 * 60, // 1 minute
    });
};
