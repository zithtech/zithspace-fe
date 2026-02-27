import React from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, Divider, Badge } from 'antd';
import {
    BellOutlined,
    MailOutlined,
    MessageOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { Inbox } from '@novu/nextjs';
import { ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

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

    // Filter modules the current user is allowed to see
    const visibleModules = NAVIGATION_CONFIG.filter(module => {
        if (module.requiredPermission && !hasPermission(module.requiredPermission)) return false;
        if (module.requiredAnyPermission && !hasAnyPermission(...module.requiredAnyPermission)) return false;
        return true;
    });

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
        {
            type: "divider" as const,
        },
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

    console.log(user?.id)

    return (
        <Header
            style={{
                padding: "0 20px",
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
            {/* Left Side: Logo & Collapse & Modules */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                {/* Logo Area - Fixed 80px to match sidebar icon column */}
                <div
                    style={{
                        width: collapsed ? 80 : 240,
                        height: '100%',
                        transition: "all 0.2s",
                        flexShrink: 0,
                    }}
                >
                    <div style={{
                        width: collapsed ? 45 : '120px',
                        height: '100%',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <Text
                            strong
                            style={{
                                fontSize: 24,
                                color: "#1677ff",
                                fontWeight: 700,
                                lineHeight: 1,
                            }}
                        >
                            {collapsed ? 'Z' : 'Zithtech'}
                        </Text>
                    </div>
                </div>



                {/* Module Selector */}
                <Menu
                    mode="horizontal"
                    selectedKeys={[activeModule]}
                    onClick={({ key }) => {
                        const moduleKey = key as ModuleType;
                        onModuleChange(moduleKey);

                        // Find module config and navigate to default path
                        const moduleConfig = NAVIGATION_CONFIG.find(m => m.key === moduleKey);
                        if (moduleConfig) {
                            if (moduleConfig.defaultPath) {
                                router.push(moduleConfig.defaultPath);
                            } else if (moduleConfig.items.length > 0) {
                                // Fallback to first item's path if available
                                const firstItem = moduleConfig.items[0];
                                if (firstItem.path) {
                                    router.push(firstItem.path);
                                } else if (firstItem.children && firstItem.children.length > 0) {
                                    // Check first child if group
                                    const firstChild = firstItem.children[0];
                                    if (firstChild.path) router.push(firstChild.path);
                                }
                            }
                        }
                    }}
                    items={menuItems}
                    style={{
                        borderBottom: 'none',
                        flex: 1,
                        maxWidth: 600,
                        background: 'transparent'
                    }}
                />
            </div>

            {/* Right Side: User Actions */}
            <Space size={16} align="end">
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
                {/* <Button
                    type="text"
                    icon={<BellOutlined />}
                /> */}

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

                <Divider type="vertical" />

                {/* User dropdown */}
                {user && (
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={["click"]}
                    >
                        <Space className="user-dropdown" style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>
                            <Avatar style={{ backgroundColor: getRoleBadgeColor(user.role) }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                <Text strong style={{ fontSize: 13 }}>{user.name}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{user.role}</Text>
                            </div>
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
      `}</style>
        </Header >
    );
}
