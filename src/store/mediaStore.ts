import { create } from 'zustand';

interface MediaState {
    micEnabled: boolean;
    camEnabled: boolean;
    localStream: MediaStream | null;
    screenShareStream: MediaStream | null;
    sessionId: string | null;
    remoteTracks: Map<string, MediaStreamTrack>;
    callStatus: 'idle' | 'connecting' | 'connected' | 'error';

    toggleMic: () => void;
    toggleCam: () => void;
    setLocalStream: (stream: MediaStream | null) => void;
    setScreenShareStream: (stream: MediaStream | null) => void;

    setSessionId: (id: string | null) => void;
    setCallStatus: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
    addRemoteTrack: (track: MediaStreamTrack, streamId: string) => void;
    removeRemoteTrack: (trackId: string) => void;
    resetCall: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
    micEnabled: true,
    camEnabled: true,
    localStream: null,
    screenShareStream: null,
    sessionId: null,
    remoteTracks: new Map(),
    callStatus: 'idle',

    toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),
    toggleCam: () => set((state) => ({ camEnabled: !state.camEnabled })),

    setLocalStream: (stream) => set({ localStream: stream }),
    setScreenShareStream: (stream) => set({ screenShareStream: stream }),

    setSessionId: (id) => set({ sessionId: id }),
    setCallStatus: (status) => set({ callStatus: status }),

    addRemoteTrack: (track, streamId) => set((state) => {
        const newTracks = new Map(state.remoteTracks);
        newTracks.set(track.id, track);
        return { remoteTracks: newTracks };
    }),

    removeRemoteTrack: (trackId) => set((state) => {
        const newTracks = new Map(state.remoteTracks);
        newTracks.delete(trackId);
        return { remoteTracks: newTracks };
    }),

    resetCall: () => set({
        sessionId: null,
        callStatus: 'idle',
        remoteTracks: new Map(),
        localStream: null
    })
}));
