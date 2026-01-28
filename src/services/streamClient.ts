import { useChatStore } from '@/store/chatStore';
import { messageService } from '@/services/messageService';

type MessageCallback = (userName: string, content: string) => void;
type ConnectionCallback = (connected: boolean) => void;
type NotificationCallback = (notification: any) => void;

class StreamClient {
    private socket: WebSocket | null = null;
    private userSocket: WebSocket | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private userReconnectTimer: NodeJS.Timeout | null = null;
    private url: string;
    private channelId: string | null = null;
    private connectionType: 'channel' | 'room' = 'channel';
    private currentUserId: string | null = null;
    private onMessageReceived: MessageCallback | null = null;
    private onConnectionChange: ConnectionCallback | null = null;
    private onNotificationReceived: NotificationCallback | null = null;
    private _isConnected: boolean = false;

    constructor() {
        this.url = process.env.NEXT_PUBLIC_STREAM_URL || 'wss://zithspace-stream.partners-58b.workers.dev';
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    setCurrentUser(userId: string) {
        this.currentUserId = userId;
    }

    onNewMessage(callback: MessageCallback) {
        this.onMessageReceived = callback;
    }

    onConnection(callback: ConnectionCallback) {
        this.onConnectionChange = callback;
    }

    onNotification(callback: NotificationCallback) {
        this.onNotificationReceived = callback;
    }

    connectUser(userId: string) {
        if (this.userSocket) {
            this.userSocket.close();
        }

        const wsUrl = `${this.url}/ws/user/${userId}`;
        this.userSocket = new WebSocket(wsUrl);

        this.userSocket.onopen = () => {
            console.log('Connected to user notification stream');
            if (this.userReconnectTimer) {
                clearTimeout(this.userReconnectTimer);
                this.userReconnectTimer = null;
            }
        };

        this.userSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'NOTIFICATION' && this.onNotificationReceived) {
                    this.onNotificationReceived(data.payload);
                }
            } catch (err) {
                // Silent
            }
        };

        this.userSocket.onclose = () => {
            console.log('Disconnected from user notification stream');
            this.userReconnectTimer = setTimeout(() => {
                this.connectUser(userId);
            }, 5000);
        };
    }

    connect(type: 'channel' | 'room', id: string) {
        if (this.socket) {
            this.socket.close();
        }

        this.channelId = id;
        this.connectionType = type;
        const wsUrl = `${this.url}/ws/${type}/${id}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            this._isConnected = true;
            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (err) {
                // Silent
            }
        };

        this.socket.onclose = () => {
            this._isConnected = false;
            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
            if (this.channelId) {
                this.reconnectTimer = setTimeout(() => {
                    if (this.channelId) {
                        this.connect(this.connectionType, this.channelId);
                    }
                }, 3000);
            }
        };

        this.socket.onerror = () => { };
    }

    sendMessage(content: string, userId: string, userName: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'CHAT_MESSAGE',
                payload: { content, userId, userName, createdAt: new Date().toISOString() }
            }));
        }
    }

    private async handleMessage(data: any) {
        const messageType = data.type;
        const payload = data.payload || data;

        if (messageType === 'CHAT_MESSAGE') {
            const isFromOther = payload.userId !== this.currentUserId;

            if (isFromOther && this.channelId) {
                // Show notification
                if (this.onMessageReceived) {
                    this.onMessageReceived(payload.userName || 'Someone', payload.content || '');
                }

                // Append message directly to store instead of refetching
                // This avoids race conditions where API returns stale data
                const newMessage = {
                    id: payload.id || `socket-${Date.now()}`, // Use payload ID if available, else temp
                    channelId: this.channelId,
                    userId: payload.userId,
                    content: payload.content,
                    type: 'text',
                    createdAt: payload.createdAt || new Date().toISOString(),
                    updatedAt: payload.createdAt || new Date().toISOString(),
                    user: {
                        id: payload.userId,
                        name: payload.userName || 'Unknown',
                        workEmail: '' // Not available in socket payload but not critical for display
                    }
                };

                useChatStore.getState().addMessage(this.channelId, newMessage as any);
            }
        }
    }

    disconnect() {
        this.channelId = null;
        this.onMessageReceived = null;
        this._isConnected = false;
        if (this.onConnectionChange) {
            this.onConnectionChange(false);
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    disconnectUser() {
        if (this.userSocket) {
            this.userSocket.close();
            this.userSocket = null;
        }
        if (this.userReconnectTimer) {
            clearTimeout(this.userReconnectTimer);
            this.userReconnectTimer = null;
        }
    }
}

export const streamClient = new StreamClient();
