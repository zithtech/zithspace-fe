import { api } from '@/lib/axios';

export interface CallSession {
    sessionId: string;
    sessionDescription: RTCSessionDescriptionInit;
}

export interface CallTrack {
    trackName: string;
    mid?: string;
}

class CallService {
    private peerConnection: RTCPeerConnection | null = null;
    private sessionId: string | null = null;
    private baseUrl = 'https://zithspace-stream.keerthivasannagarajan.workers.dev'; // Update with actual worker URL

    constructor() {
        // Initialize if needed
    }

    async createSession(): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/calls/session`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to create call session');
        }

        const data = await response.json();
        this.sessionId = data.sessionId;
        return data;
    }

    async initializePeerConnection(sessionDescription: RTCSessionDescriptionInit) {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.cloudflare.com:3478'
                }
            ],
            bundlePolicy: 'max-bundle'
        });

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sessionDescription));

        // Handle ICE candidates if needed (Cloudflare Calls usually handles this via the session)
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send candidate to server if required by specific Calls implementation
                // For basic Calls, the initial offer/answer might be enough
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.track);
            // Dispatch to store
            // useMediaStore.getState().addRemoteTrack(event.track, event.streams[0]);
        };
    }

    async addTrack(track: MediaStreamTrack) {
        if (!this.peerConnection) return;
        this.peerConnection.addTrack(track);
    }

    async connect() {
        if (!this.peerConnection || !this.sessionId) return;

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Send answer to server
        await fetch(`${this.baseUrl}/calls/tracks`, {
            method: 'POST',
            body: JSON.stringify({
                sessionId: this.sessionId,
                sessionDescription: answer,
                tracks: [] // Add track info if needed
            })
        });
    }

    endCall() {
        this.peerConnection?.close();
        this.peerConnection = null;
        this.sessionId = null;
    }
}

export const callService = new CallService();
