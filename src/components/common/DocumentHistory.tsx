import React from 'react';
import { Timeline, Typography, Avatar } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

const { Text, Title } = Typography;

interface HistoryEntry {
    id: string;
    createdAt: string;
    createdBy: {
        id: string;
        name: string;
        workEmail: string;
    };
    content: any;
}

interface DocumentHistoryProps {
    history: HistoryEntry[];
    isLoading: boolean;
    onSelectVersion: (entry: HistoryEntry) => void;
}

const DocumentHistory: React.FC<DocumentHistoryProps> = ({ history, isLoading, onSelectVersion }) => {
    if (isLoading) {
        return <div className="p-4 text-center text-slate-500" style={{ color: 'var(--text-slate-400)' }}>Loading history...</div>;
    }

    if (!history || history.length === 0) {
        return <div className="p-4 text-center text-slate-500" style={{ color: 'var(--text-slate-400)' }}>No history available</div>;
    }

    return (
        <div className="p-4">
            <Title level={5} className="mb-4" style={{ color: 'var(--text-slate-900)' }}>Version History</Title>
            <Timeline
                mode="left"
                items={history.map((entry) => ({
                    dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
                    children: (
                        <div
                            className=" p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                            style={{ '--hover-bg': 'var(--bg-slate-50)', '--hover-border': 'var(--border-slate-200)' } as any}
                            onClick={() => onSelectVersion(entry)}
                        >
                            <div className="flex items-center gap-2 mb-0.5">
                                <Avatar size={20} icon={<UserOutlined />} className="bg-blue-500" style={{ backgroundColor: 'var(--premium-blue)' }} />
                                <Text strong className="text-xs" style={{ color: 'var(--text-slate-900)' }}>{entry.createdBy.name}</Text>
                            </div>
                            <div className="text-[10px] text-slate-500 mb-1 ml-7" style={{ color: 'var(--text-slate-600)' }}>
                                {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                            </div>
                        </div>
                    ),
                }))}
            />
        </div>
    );
};

export default DocumentHistory;
