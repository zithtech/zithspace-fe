'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Divider,
  Badge,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ControlOutlined,
  InboxOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useTrashTickets } from '@/hooks/useTrash';
import { useBuckets } from '@/hooks/useBuckets';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const { tenantId } = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch data (only render badges after mount to prevent hydration errors)
  const { data: trashData } = useTrashTickets({});
  const { data: buckets } = useBuckets(tenantId || '');
  
  const trashCount = trashData?.pagination?.total || 0;
  const bucketCount = buckets?.length || 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Navigation items with modern icons
  const getNavigationItems = () => [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => handleNavigation('/dashboard'),
    },
    {
      key: '/members',
      icon: <TeamOutlined />,
      label: 'Members',
      // disabled: user?.role === 'user',
      onClick: () => handleNavigation('/members'),
      // style: user?.role === 'user' ? { color: '#bfbfbf' } : undefined,
    },
    {
      key: 'projects-group',
      icon: <ProjectOutlined />,
      label: 'Projects & Tickets',
      children: [
        {
          key: '/projects',
          icon: <ProjectOutlined />,
          label: 'Overview',
          onClick: () => handleNavigation('/projects'),
        },
        {
          key: '/projects/manage',
          icon: <ProjectOutlined />,
          label: 'Projects',
          onClick: () => handleNavigation('/projects/manage'),
        },
        // {
        //   key: '/projects/dashboard',
        //   icon: <FileTextOutlined />,
        //   label: 'Ticket Dashboard',
        //   onClick: () => handleNavigation('/projects/dashboard'),
        // },
        {
          key: '/projects/create',
          icon: <PlusCircleOutlined />,
          label: 'Create Ticket',
          onClick: () => handleNavigation('/projects/create'),
        },
        {
          key: '/projects/select',
          icon: <UnorderedListOutlined />,
          label: 'Tickets',
          onClick: () => handleNavigation('/projects/select'),
        },
        {
          key: '/projects/plans',
          icon: <CalendarOutlined />,
          label: 'Plans',
          onClick: () => handleNavigation('/projects/plans'),
        },
        {
          key: '/projects/buckets',
          icon: <InboxOutlined />,
          label: isMounted && bucketCount > 0 ? (
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Buckets</span>
              <Badge count={bucketCount} showZero={false} style={{ backgroundColor: '#1677ff' }} />
            </Space>
          ) : 'Buckets',
          onClick: () => handleNavigation('/projects/buckets'),
        },
        {
          key: '/projects/trash',
          icon: <DeleteOutlined />,
          label: isMounted && trashCount > 0 ? (
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Trash</span>
              <Badge count={trashCount} showZero={false} style={{ backgroundColor: '#ff4d4f' }} />
            </Space>
          ) : 'Trash',
          onClick: () => handleNavigation('/projects/trash'),
        },
        {
          key: '/projects/archived',
          icon: <FolderOpenOutlined />,
          label: 'Archived',
          onClick: () => handleNavigation('/projects/archived'),
        },
        {
          key: '/projects/settings',
          icon: <ControlOutlined />,
          label: 'Settings',
          onClick: () => handleNavigation('/projects/settings'),
        },
      ],
    },
    {
      key: 'daily-updates-group',
      icon: <FileTextOutlined />,
      label: 'Daily Updates',
      children: [
        {
          key: '/daily-updates/submit',
          icon: <PlusCircleOutlined />,
          label: 'Submit Update',
          onClick: () => handleNavigation('/daily-updates/submit'),
        },
        {
          key: '/daily-updates/view',
          icon: <UnorderedListOutlined />,
          label: 'View Updates',
          onClick: () => handleNavigation('/daily-updates/view'),
        },
      ],
    },
    {
      key: '/clients',
      icon: <UserOutlined />,
      label: 'Clients',
      onClick: () => handleNavigation('/clients'),
    },
    {
      key: '/attendance',
      icon: <ClockCircleOutlined />,
      label: 'Attendance',
      onClick: () => handleNavigation('/attendance'),
    },
    {
      key: '/leaves',
      icon: <FileTextOutlined />,
      label: 'Leave & Permission',
      onClick: () => handleNavigation('/leaves'),
    },
    {
      key: '/accounts',
      icon: <DollarOutlined />,
      label: 'Accounts',
      disabled: user?.role !== 'super_admin',
      onClick: () => handleNavigation('/accounts'),
      style: user?.role !== 'super_admin' ? { color: '#bfbfbf' } : undefined,
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#ff4d4f';
      case 'admin':
        return '#faad14';
      default:
        return '#52c41a';
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {!collapsed ? (
            <Text
              strong
              style={{
                fontSize: 18,
                color: '#1677ff',
                fontWeight: 600,
              }}
            >
              Z
            </Text>
          ) : (
            <Text
              strong
              style={{
                fontSize: 20,
                color: '#1677ff',
                fontWeight: 700,
              }}
            >
              Z
            </Text>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          style={{
            border: 'none',
            marginTop: 8,
          }}
          items={getNavigationItems()}
        />

        {/* User info in sidebar (when expanded) */}
        {!collapsed && user && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              padding: 12,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 13 }}>
                {user.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user.position}
              </Text>
              <Badge
                color={getRoleBadgeColor(user.role)}
                text={user.role}
                style={{ fontSize: 11 }}
              />
            </Space>
          </div>
        )}
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 20px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 240,
            zIndex: 99,
            transition: 'left 0.2s',
          }}
        >
          {/* Left side - Collapse button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: 16,
              width: 40,
              height: 40,
            }}
          />

          {/* Right side - User actions */}
          <Space size={16} align="center">
            {/* Notifications */}
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />

            <Divider type="vertical" />

            {/* User dropdown */}
            {user && (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Space
                  align="center"
                  style={{
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 6,
                    transition: 'background-color 0.2s',
                  }}
                  className="user-dropdown"
                >
                  <Avatar
                    style={{
                      backgroundColor: getRoleBadgeColor(user.role),
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ lineHeight: 1.2 }}>
                      <Text strong>
                        {user.name}
                      </Text>
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {user.role}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: 0,
            padding: 0,
            background: '#f5f5f5',
            height: 'calc(100vh - 64px)',
            marginTop: 64,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      <style jsx>{`
        .user-dropdown:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </Layout>
  );
}
