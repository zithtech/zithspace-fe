
import { apiClient } from '@/lib/axios';
import { Repository, TicketCodeMetadata, TicketBranch, TicketPullRequest } from '@/types/ticket';

class CodeIntegrationService {
    /**
     * Get all repositories for the tenant
     */
    async getRepositories(): Promise<Repository[]> {
        const response = await apiClient.get('/api/repositories');
        return response.data.data;
    }

    /**
     * Create a new repository
     */
    async createRepository(data: { name: string; url: string; description?: string }): Promise<Repository> {
        const response = await apiClient.post('/api/repositories', data);
        return response.data.data;
    }

    /**
     * Get code metadata (branches, PRs) for a ticket
     */
    async getTicketCodeMetadata(ticketId: string): Promise<TicketCodeMetadata> {
        const response = await apiClient.get(`/api/tickets/${ticketId}/code`);
        return response.data.data;
    }

    /**
     * Link a branch to a ticket
     */
    async addBranch(ticketId: string, data: { repositoryId: string; name: string; url?: string }): Promise<TicketBranch> {
        const response = await apiClient.post(`/api/tickets/${ticketId}/code/branches`, data);
        return response.data.data;
    }

    /**
     * Unlink a branch
     */
    async removeBranch(ticketId: string, branchId: string): Promise<void> {
        await apiClient.delete(`/api/tickets/${ticketId}/code/branches/${branchId}`);
    }

    /**
     * Link a PR to a ticket
     */
    async addPullRequest(ticketId: string, data: { repositoryId: string; url: string; title?: string; number?: number; state?: string; branchName?: string; branchUrl?: string }): Promise<TicketPullRequest> {
        const response = await apiClient.post(`/api/tickets/${ticketId}/code/pull-requests`, data);
        return response.data.data;
    }

    /**
     * Unlink a PR
     */
    async removePullRequest(ticketId: string, prId: string): Promise<void> {
        await apiClient.delete(`/api/tickets/${ticketId}/code/pull-requests/${prId}`);
    }
}

export default new CodeIntegrationService();
