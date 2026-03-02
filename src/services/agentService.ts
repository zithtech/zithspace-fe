import { apiClient } from '@/lib/axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: string[];
}

export interface ChatResponse {
  message: string;
  threadId: string;
  steps?: number;
}

export interface ChatHistoryResponse {
  threadId: string;
  messages: ChatMessage[];
}

class AgentService {
  /**
   * Send a message to the agent (non-streaming)
   */
  async chat(message: string, threadId?: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/agent/chat', {
      message,
      stream: false,
      threadId,
    });
    return response.data;
  }

  /**
   * Send a message to the agent with streaming response
   */
  async chatStream(
    message: string,
    onChunk: (chunk: string) => void,
    onToolCall: (tools: string[]) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    threadId?: string
  ): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');

      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${baseURL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId || '',
        },
        body: JSON.stringify({
          message,
          stream: true,
          threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                onChunk(data.content);
              } else if (data.type === 'tool_call') {
                onToolCall(data.tools);
              } else if (data.type === 'error') {
                onError(data.message);
                return;
              } else if (data.type === 'done') {
                onComplete();
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Stream error');
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(threadId?: string): Promise<ChatHistoryResponse> {
    const endpoint = threadId ? `/agent/history/${threadId}` : '/agent/history';
    const response = await apiClient.get<ChatHistoryResponse>(endpoint);
    return response.data;
  }

  /**
   * Clear conversation history
   */
  async clearHistory(threadId?: string): Promise<void> {
    const endpoint = threadId ? `/agent/history/${threadId}` : '/agent/history';
    await apiClient.delete(endpoint);
  }
}

export const agentService = new AgentService();
