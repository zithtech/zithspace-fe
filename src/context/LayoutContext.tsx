"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface LayoutContextType {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleCollapsed: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [collapsed, setCollapsedState] = useState<boolean>(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // 1. Initialize from localStorage (Instant UI)
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            setCollapsedState(JSON.parse(saved));
        }
        setIsInitialized(true);
    }, []);

    // 2. Sync from Backend after mount & auth
    useEffect(() => {
        if (isAuthenticated && user) {
            const fetchPreferences = async () => {
                try {
                    const response = await axios.get('/api/user/preferences');
                    if (response.data.success && response.data.data.sidebarCollapsed !== undefined) {
                        const backendValue = response.data.data.sidebarCollapsed;
                        setCollapsedState(backendValue);
                        localStorage.setItem('sidebar-collapsed', JSON.stringify(backendValue));
                    }
                } catch (error) {
                    console.error('Failed to fetch user preferences:', error);
                }
            };
            fetchPreferences();
        }
    }, [isAuthenticated, user]);

    const setCollapsed = (value: boolean) => {
        setCollapsedState(value);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(value));

        // Async sync to backend
        if (isAuthenticated) {
            axios.patch('/api/user/preferences', { sidebarCollapsed: value })
                .catch(err => console.error('Failed to sync preference to backend:', err));
        }
    };

    const toggleCollapsed = () => {
        const newValue = !collapsed;
        setCollapsed(newValue);
    };

    return (
        <LayoutContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
