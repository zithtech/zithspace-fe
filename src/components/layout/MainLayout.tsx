'use client';
import { dashboardService, DashboardData } from "@/services/dashboardService";
import React, { useState,useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
  Drawer,
  List,
  Card,

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
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
   const [open, setOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
      null
    );
      const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null
      );
      const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

      useEffect(() => {
        if (
          dashboardData?.projectProgress &&
          dashboardData.projectProgress.length > 0 &&
          !selectedProjectId
        ) {
          setSelectedProjectId(dashboardData.projectProgress[0].id);
        }
      }, [dashboardData,selectedProjectId]);

      useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getDashboardSummary();
      setDashboardData(res);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  fetchDashboard();
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
          key: '/projects/tickets',
          icon: <UnorderedListOutlined />,
          label: 'Tickets',
          onClick: () => handleNavigation('/projects/tickets'),
        },
        {
          key: '/projects/plans',
          icon: <CalendarOutlined />,
          label: 'Plans',
          onClick: () => handleNavigation('/projects/plans'),
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
   const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };
if (!mounted) return null;

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sider
       onCollapse={(value) => setCollapsed(value)}
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
          overflow: "hidden"
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
          inlineCollapsed={collapsed} 
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
      <Layout style={{ marginLeft: collapsed ? 80 : 240 }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 20px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 65,
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 240,
            zIndex: 99,
            transition: 'left 0.2s',
          }}
          
        >
          {/* Left side - Collapse button */}
         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
</div>


          {/* Right side - User actions */}
          <Space size={16} align="center">
            {/* Notifications */}
            <Button
            onClick={showDrawer}
              type="text"
              icon={<BellOutlined />}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            /> 
  <Drawer
  title={
    <Space>
      <BellOutlined style={{ color: "#1677ff" }} />
      <Text strong>Notifications</Text>
    </Space>
  }
  placement="right"
  onClose={onClose}
  open={open}
  width={380}
  
  style={{
    marginTop:70   }}
>
  {/* Recent Activities */}
  

  <Card
  style={{ borderColor: "#8ac1ebff",
        borderRadius: 5,}}
    title={
      <Space>
        <ClockCircleOutlined style={{ color: "#52c41a" }} />
        <Text>Recent Activities</Text>
      </Space>
    }
    size="small"
   
    extra={
      <Button type="link" size="small">
        View All
      </Button>
    }
    styles={{
      body: {
        padding: 0,
        maxHeight: "calc(100vh - 180px)",
        overflowY: "auto",

      },
    }}
  >
    {dashboardData?.recentActivities?.length ? (
      <List
     
        size="small"
        itemLayout="horizontal"
        dataSource={dashboardData.recentActivities}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
             
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={32}
                  style={{
                    backgroundColor: "#1677ff",
                    fontSize: 12,
                    fontWeight: 600,
                    
                  }}
                >
                  {item.avatar}
                </Avatar>
              }
              title={
                <Text style={{ fontSize: 13 }}>
                  <Text strong>{item.user}</Text> {item.action}{" "}
                  <Text strong>{item.target}</Text>
                </Text>
              }
              description={
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {formatTimeAgo(item.time)}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    ) : (
      <div
        style={{
          padding: 32,
          textAlign: "center",
        }}
      >
        <Text type="secondary">No recent activities</Text>
      </div>
    )}
  </Card>
</Drawer>

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
            height: 'calc(100vh - 75px)', 
            marginTop: 64,
             overflow: 'hidden',
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
