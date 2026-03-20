import React from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, Divider, Badge, Grid } from 'antd';
import {
    BellOutlined,
    MailOutlined,
    MessageOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    CalendarOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { Inbox } from '@novu/nextjs';
import { ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TimeTrackerPopover } from '@/components/time-tracking/TimeTrackerPopover';

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface TopNavProps {
    activeModule: ModuleType;
    onModuleChange: (module: ModuleType) => void;
    user: any;
    handleLogout: () => void;
    collapsed: boolean;
}

export default function TopNav({
    activeModule,
    onModuleChange,
    user,
    handleLogout,
    collapsed,
}: TopNavProps) {
    const router = useRouter();
    const { hasPermission, hasAnyPermission } = useAuth();
    const screens = useBreakpoint();

    // Breakpoints logic
    const isMobile = !screens.md;
    const isSmallMobile = !screens.sm;

    // Filter modules by permission
    const visibleModules = NAVIGATION_CONFIG.filter(module => {
        if (!module.requiredPermission && !module.requiredAnyPermission) return true;
        if (module.requiredPermission) return hasPermission(module.requiredPermission);
        if (module.requiredAnyPermission) return hasAnyPermission(...module.requiredAnyPermission);
        return false;
    });

    const handleModuleClick = (moduleKey: ModuleType) => {
        onModuleChange(moduleKey);
        const moduleConfig = NAVIGATION_CONFIG.find(m => m.key === moduleKey);
        if (moduleConfig) {
            if (moduleConfig.defaultPath) {
                router.push(moduleConfig.defaultPath);
            } else if (moduleConfig.items.length > 0) {
                const firstItem = moduleConfig.items[0];
                if (firstItem.path) {
                    router.push(firstItem.path);
                } else if (firstItem.children && firstItem.children.length > 0) {
                    const firstChild = firstItem.children[0];
                    if (firstChild.path) router.push(firstChild.path);
                }
            }
        }
    };

    // User dropdown menu
    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Profile",
            onClick: () => router.push("/profile"),
        },
        {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Settings",
            onClick: () => router.push("/settings"),
        },
        // On mobile, show module selector in user dropdown
        ...(isMobile ? [
            { type: "divider" as const },
            {
                key: "modules",
                label: "Switch Module",
                children: visibleModules.map(module => ({
                    key: module.key,
                    icon: module.icon,
                    label: module.label,
                    onClick: () => handleModuleClick(module.key as ModuleType),
                }))
            }
        ] : []),
        { type: "divider" as const },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Logout",
            onClick: handleLogout,
        },
    ];

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "super_admin": return "#ff4d4f";
            case "admin": return "#faad14";
            default: return "#52c41a";
        }
    };

    const menuItems = visibleModules.map(module => ({
        key: module.key,
        label: (
            <span style={{
                fontWeight: 600,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                {module.icon}
                {module.label}
            </span>
        ),
    }));

    return (
        <Header
            style={{
                padding: isMobile ? "0 12px" : "0 20px",
                background: "#fff",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 64,
                position: "fixed",
                top: 0,
                right: 0,
                left: 0,
                zIndex: 1000,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
        >
            {/* Left Side: Logo & Module Selector */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', flex: 1, minWidth: 0 }}>
                {/* Logo Area */}
                <div
                    style={{
                        width: isMobile ? 'auto' : (collapsed ? 80 : 240),
                        marginRight: isMobile ? 12 : 0,
                        height: '100%',
                        transition: "all 0.2s",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isMobile ? "flex-start" : "center"
                    }}
                >
                    <Text
                        strong
                        style={{
                            fontSize: isMobile ? 20 : 24,
                            color: "#1677ff",
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {isMobile ? 'Z' : (collapsed ? 'Z' : 'Zithtech')}
                    </Text>
                </div>

                {/* Module Selector - Hidden on Mobile, moved to dropdown/hamburger if needed */}
                {!isMobile && (
                    <Menu
                        mode="horizontal"
                        selectedKeys={[activeModule]}
                        onClick={({ key }) => handleModuleClick(key as ModuleType)}
                        items={menuItems}
                        style={{
                            borderBottom: 'none',
                            flex: 1,
                            maxWidth: 600,
                            background: 'transparent'
                        }}
                    />
                )}
                
                {isMobile && (
                    <Dropdown
                        menu={{ 
                            items: visibleModules.map(m => ({
                                key: m.key,
                                icon: m.icon,
                                label: m.label,
                                onClick: () => handleModuleClick(m.key as ModuleType)
                            })),
                            selectedKeys: [activeModule]
                        }}
                        trigger={["click"]}
                    >
                        <Button type="text" icon={<AppstoreOutlined />} style={{ fontWeight: 600 }}>
                            {!isSmallMobile && activeModule}
                        </Button>
                    </Dropdown>
                )}
            </div>

            {/* Right Side: User Actions */}
            <Space size={isSmallMobile ? 4 : 12} align="center" style={{ flexShrink: 0 }}>
                {!isSmallMobile && (
                    <>
                        <TimeTrackerPopover />
                        <Button
                            type="text"
                            icon={<MailOutlined />}
                            onClick={() => router.push('/mail')}
                        />
                        <Button
                            type="text"
                            icon={<CalendarOutlined />}
                            onClick={() => router.push('/calendar')}
                        />
                        <Button
                            type="text"
                            icon={<MessageOutlined />}
                            onClick={() => router.push('/chat')}
                        />
                    </>
                )}

                <div>
                    <Inbox
                        applicationIdentifier="67g_5lVLFWvd"
                        subscriberId={user?.id}
                        socketUrl="wss://socket.novu.co"
                        appearance={{
                            variables: {
                                colorPrimary: "#DD2450",
                                colorForeground: "#0E121B"
                            }
                        }}
                    />
                </div>

                <Divider type="vertical" style={{ margin: isSmallMobile ? "0 4px" : "0 8px" }} />

                {/* User dropdown */}
                {user && (
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={["click"]}
                    >
                        <Space className="user-dropdown" style={{ cursor: "pointer", padding: "4px 4px", borderRadius: 6 }}>
                            <Avatar size={isSmallMobile ? "small" : "default"} style={{ backgroundColor: getRoleBadgeColor(user.role) }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            {!isSmallMobile && (
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                    <Text strong style={{ fontSize: 13 }}>{user.name}</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{user.role}</Text>
                                </div>
                            )}
                        </Space>
                    </Dropdown>
                )}
            </Space>

            <style jsx global>{`
                .ant-menu-horizontal {
                    line-height: 62px !important;
                }
                .user-dropdown:hover {
                    background-color: rgba(0,0,0,0.025);
                }
                @media (max-width: 576px) {
                    .ant-layout-header {
                        padding: 0 8px !important;
                    }
                }
            `}</style>
        </Header >
    );
}
