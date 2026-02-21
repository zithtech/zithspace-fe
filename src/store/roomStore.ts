import { create } from 'zustand';

interface Participant {
    userId: string;
    name: string;
    role: 'host' | 'participant';
    hasAudio: boolean;
    hasVideo: boolean;
    isScreenSharing: boolean;
}

interface RoomState {
    roomId: string | null;
    isInMeeting: boolean;
    participants: Participant[];

    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    setParticipants: (participants: Participant[]) => void;
    updateParticipant: (userId: string, updates: Partial<Participant>) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    roomId: null,
    isInMeeting: false,
    participants: [],

    joinRoom: (roomId) => set({ roomId, isInMeeting: true }),
    leaveRoom: () => set({ roomId: null, isInMeeting: false, participants: [] }),

    setParticipants: (participants) => set({ participants }),

    updateParticipant: (userId, updates) =>
        set((state) => ({
            participants: state.participants.map((p) =>
                p.userId === userId ? { ...p, ...updates } : p
            ),
        })),
}));
