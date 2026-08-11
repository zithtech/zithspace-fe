import LoadingSpinner from "@/components/common/LoadingSpinner";
import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { MembersService } from '@/services/membersService';


interface UserSearchProps {
    placeholder?: string;
    style?: React.CSSProperties;
    onChange?: (value: string) => void;
    value?: string;
}

export default function UserSearch({ placeholder, style, onChange, value }: UserSearchProps) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

    const fetchUsers = async (search?: string) => {
        setLoading(true);
        try {
            // Note: getMembersForSelect doesn't support search param yet in the service definition I saw,
            // but usually it should. For now I'll fetch all and filter client side if needed, 
            // or just fetch all since it's likely a small team for now.
            // If the list is huge, we should implement server-side search.
            const members = await MembersService.getMembersForSelect();
            setOptions(members.map(m => ({ value: m.value, label: m.label })));
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <Select
            showSearch
            value={value}
            placeholder={placeholder || "Select a user"}
            style={style}
            defaultActiveFirstOption={false}
            filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={onChange}
            notFoundContent={loading ? <LoadingSpinner size="small" fullScreen={false} /> : null}
            options={options}
        />
    );
}
