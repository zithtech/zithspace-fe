import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, Divider, Badge, Grid, Input, Tooltip, Empty, Modal, theme } from 'antd';
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
  AppstoreOutlined,
  StarFilled,
  StarOutlined,
  FolderOutlined,
  DeleteOutlined,
  RightOutlined,
  PlusOutlined,
  MoreOutlined,
} from '@ant-design/icons';

interface ShortcutItem {
  id: string;
  name: string;
  path: string;
}
import { Inbox } from '@novu/nextjs';
import { ModuleType, NAVIGATION_CONFIG, NAV_MOBILE_BREAKPOINT } from './navigationConfig';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIsBreakpoint } from '@/hooks/use-is-breakpoint';
import { TimeTrackerPopover } from '@/components/time-tracking/TimeTrackerPopover';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import ThemeToggle from "./ThemeToggle";

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
  const { token } = theme.useToken();
  const { isPopoverOpen, setPopoverOpen } = useTimeTrackerStore();
  const screens = useBreakpoint();
  const isCustomBreakpoint = useIsBreakpoint("max", 1214); // true when width <= 1213

  // Bookmarks state
  const [shortcutPopoverVisible, setShortcutPopoverVisible] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('nav_shortcuts') || '[]'); } catch { return []; }
  });
  const [hoveredShortcutId, setHoveredShortcutId] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newShortcutName, setNewShortcutName] = useState('');
  const [newShortcutPath, setNewShortcutPath] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleSaveBookmark = () => {
    if (!newShortcutName.trim() || !newShortcutPath.trim()) return;
    const item: ShortcutItem = { id: Date.now().toString(), name: newShortcutName.trim(), path: newShortcutPath.trim() };
    const updated = [...shortcuts, item];
    setShortcuts(updated);
    localStorage.setItem('nav_shortcuts', JSON.stringify(updated));
    setNewShortcutName('');
    setNewShortcutPath('');
    setIsAddMode(false);
  };

  const handleDeleteBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalOpen(true);
    Modal.confirm({
      title: 'Delete Bookmark',
      content: 'Are you sure you want to delete this bookmark?',
      onOk: () => {
        const updated = shortcuts.filter(s => s.id !== id);
        setShortcuts(updated);
        localStorage.setItem('nav_shortcuts', JSON.stringify(updated));
        setDeleteModalOpen(false);
      },
      onCancel: () => setDeleteModalOpen(false),
    });
  };

  // Breakpoints logic
  const isMobile = useIsBreakpoint("max", NAV_MOBILE_BREAKPOINT + 1);
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

  const menuItems = visibleModules.map((module, index) => ({
    key: module.key,
    label: (
      <div style={{
        fontWeight: 600,
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
        position: 'relative',
        transition: 'all 0.3s'
      }}>
        <span className="module-icon" style={{ fontSize: '16px', display: 'flex' }}>{module.icon}</span>
        <span className={`module-text module-text-${index}`} style={{ fontSize: '13px', letterSpacing: '0.3px' }}>{module.label}</span>
        {activeModule === module.key && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '12px',
            right: '12px',
            height: '3px',
            background: '#1677ff',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(22, 119, 255, 0.2)'
          }} />
        )}
      </div>
    ),
  }));

  const renderShortcutsDropdownContent = (isModal = false) => (
    <div
      style={{
        width: isModal ? "100%" : 300,
        backgroundColor: "var(--bg-pure-white)",
        boxShadow: isModal ? "none" : "0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 12px 48px 16px rgba(0, 0, 0, 0.03)",
        borderRadius: isModal ? 0 : 8,
        border: isModal ? "none" : "1px solid var(--border-color)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <StarFilled style={{ color: "#1677ff" }} />
          <Text strong>Bookmarks</Text>
        </Space>
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {shortcuts.length > 0 ? (
          shortcuts.map((item: ShortcutItem) => (
            <div
              key={item.id}
              className="shortcut-item"
              onMouseEnter={() => setHoveredShortcutId(item.id)}
              onMouseLeave={() => setHoveredShortcutId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <div
                onClick={() => {
                  router.push(item.path);
                  setShortcutPopoverVisible(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <FolderOutlined
                  style={{ color: "#8c8c8c", fontSize: 16 }}
                />
                <Text
                  style={{ fontSize: 13, color: "var(--text-primary)" }}
                  ellipsis
                >
                  {item.name}
                </Text>
              </div>

              {hoveredShortcutId === item.id ? (
                <Tooltip title="Delete Bookmark">
                  <Button
                    type="text"
                    shape="circle"
                    icon={
                      <DeleteOutlined
                        style={{ fontSize: 14, color: "#8c8c8c" }}
                      />
                    }
                    size="small"
                    onClick={(e) => handleDeleteBookmark(item.id, e)}
                  />
                </Tooltip>
              ) : (
                <RightOutlined
                  style={{ fontSize: 10, color: "#bfbfbf" }}
                />
              )}
            </div>
          ))
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No bookmarks"
            style={{ padding: "20px 0" }}
          />
        )}
      </div>

      <div
        style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border-color)",
          background: "var(--bg-slate-50)",
        }}
      >
        {isAddMode ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              placeholder="Name"
              value={newShortcutName}
              onChange={(e) => setNewShortcutName(e.target.value)}
              size="small"
            />
            <Input
              placeholder="URL"
              value={newShortcutPath}
              onChange={(e) => setNewShortcutPath(e.target.value)}
              size="small"
            />
            <Space
              style={{ justifyContent: "flex-end", width: "100%" }}
            >
              <Button
                size="small"
                onClick={() => setIsAddMode(false)}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={handleSaveBookmark}
              >
                Save
              </Button>
            </Space>
          </Space>
        ) : (
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setIsAddMode(true)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "4px 0",
            }}
          >
            Add Bookmark
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Header
      className="glass-panel"
      style={{
        padding: isMobile ? "0 16px" : "0 24px 0 0",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: "var(--shadow-sm)"
      }}
    >
      {/* Left Side: Logo & Module Selector */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', flex: 1, minWidth: 0 }}>
        {/* Logo Area */}
        <div
          style={{
            width: isMobile ? 'auto' : (collapsed ? 65 : 200),
            minWidth: isMobile ? 'auto' : (collapsed ? 65 : 200),
            marginRight: isMobile ? 12 : 0,
            paddingLeft: (!isMobile && !collapsed) ? 24 : 0,
            height: '100%',
            transition: "all 0.2s",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            // justifyContent: "flex-start"
            justifyContent: (collapsed && !isMobile) ? "center" : "flex-start"
          }}
        >
          {user?.tenantLogo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={user.tenantLogo}
                alt={user.tenantName || 'Logo'}
                style={{
                  height: isMobile ? 32 : 40,
                  width: 'auto',
                  maxWidth: isMobile ? 120 : 200,
                  objectFit: 'contain'
                }}
              />
              {!collapsed && user?.tenantName && (
                <Text
                  strong
                  style={{
                    fontSize: 18,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    background: "linear-gradient(135deg, var(--premium-blue) 0%, #1D4ED8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 700
                  }}
                >
                  {user?.tenantName}
                </Text>
              )}
            </div>
          ) : (
            <Text
              strong
              style={{
                fontSize: isMobile ? 22 : 26,
                background: "linear-gradient(135deg, #1677ff 0%, #003eb3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.5px"
              }}
            >
              {collapsed ? (user?.tenantName?.charAt(0) || 'Z') : (user?.tenantName || 'Zithtech')}
            </Text>
          )}
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
              maxWidth: 700,
              background: 'transparent',
              marginLeft: 25,
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
            <Button type="text" icon={<AppstoreOutlined />} style={{ fontWeight: 600, marginLeft: 20 }}>
              {!isSmallMobile && activeModule}
            </Button>
          </Dropdown>
        )}
      </div>

      {/* Right Side: User Actions */}
      <Space size={isSmallMobile ? 4 : 12} align="center" style={{ flexShrink: 0 }}>
        {!isCustomBreakpoint ? (
          <>
            <ThemeToggle />
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
            <div className="novu-inbox-wrapper">
              <Inbox
                applicationIdentifier="67g_5lVLFWvd"
                subscriberId={user?.id}
                socketUrl="wss://socket.novu.co"
                appearance={{
                  variables: {
                    colorPrimary: "#3B82F6",
                    colorForeground: token.colorText,
                    colorBackground: token.colorBgElevated,
                    colorCounter: "#EF4444",
                    colorCounterForeground: "#FFFFFF",
                  },
                  elements: {
                    notification: {
                      background: token.colorBgElevated,
                    },
                    popoverContent: {
                      background: token.colorBgElevated,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      color: token.colorText,
                    },
                  }
                }}
              />
            </div>
            <Dropdown
              open={shortcutPopoverVisible && !isCustomBreakpoint}
              onOpenChange={(visible) => {
                if (!visible && deleteModalOpen) return;
                setShortcutPopoverVisible(visible);
                if (!visible) {
                  setIsAddMode(false);
                  setNewShortcutName("");
                  setNewShortcutPath("");
                }
              }}
              popupRender={() => renderShortcutsDropdownContent(false)}
              trigger={["click"]}
            >
              <Button
                type="text"
                icon={
                  (shortcutPopoverVisible && !isCustomBreakpoint) ? (
                    <StarFilled style={{ color: "#1677ff" }} />
                  ) : (
                    <StarOutlined />
                  )
                }
              />
            </Dropdown>
          </>
        ) : (
          <Space size={isSmallMobile ? 4 : 8}>
            <ThemeToggle />
            <Inbox
              applicationIdentifier="67g_5lVLFWvd"
              subscriberId={user?.id}
              socketUrl="wss://socket.novu.co"
              appearance={{
                variables: {
                  colorPrimary: "#3B82F6",
                  colorForeground: token.colorText,
                  colorBackground: token.colorBgElevated,
                  colorCounter: "#EF4444",
                  colorCounterForeground: "#FFFFFF",
                },
                elements: {
                  popoverContent: {
                    background: token.colorBgElevated,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    color: token.colorText,
                  },
                }
              }}
            />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'timer',
                    label: <TimeTrackerPopover isMenuItem />,
                    onClick: () => setPopoverOpen(true)
                  },
                  {
                    key: 'mail',
                    label: 'Mail',
                    icon: <MailOutlined />,
                    onClick: () => router.push('/mail')
                  },
                  {
                    key: 'calendar',
                    label: 'Calendar',
                    icon: <CalendarOutlined />,
                    onClick: () => router.push('/calendar')
                  },
                  {
                    key: 'chat',
                    label: 'Messages',
                    icon: <MessageOutlined />,
                    onClick: () => router.push('/chat')
                  },
                  {
                    key: 'bookmarks',
                    label: 'Bookmarks',
                    icon: <StarOutlined />,
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                      setShortcutPopoverVisible(true);
                    }
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" icon={<MoreOutlined style={{ fontSize: 20 }} />} />
            </Dropdown>
          </Space>
        )}

        {/* Mobile Bookmark Modal - Ensuring bookmarks only show when specifically clicked on mobile */}
        {isCustomBreakpoint && (
          <Modal
            open={shortcutPopoverVisible}
            onCancel={() => {
              if (deleteModalOpen) return;
              setShortcutPopoverVisible(false);
              setIsAddMode(false);
            }}
            footer={null}
            title={null}
            closable={false}
            width={320}
            centered
            styles={{ body: { padding: 0 } }}
          >
            {renderShortcutsDropdownContent(true)}
          </Modal>
        )}


        {/* Mobile Timer Modal - Rendering form content directly for seamless mobile use */}
        {isCustomBreakpoint && (
          <Modal
            open={isPopoverOpen}
            onCancel={() => setPopoverOpen(false)}
            footer={null}
            title={<div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>Time Tracker</div>}
            closable={true}
            width={360}
            centered
            styles={{ body: { padding: "20px 24px" } }}
          >
            <TimeTrackerPopover showContentOnly />
          </Modal>
        )}

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
                  {user.role && user.role.toLowerCase() !== user.name.toLowerCase() && (
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                      {user.role.replace('_', ' ')}
                    </Text>
                  )}
                </div>
              )}
            </Space>
          </Dropdown>
        )}
      </Space>

      <style jsx global>{`
                .ant-menu-horizontal {
                    line-height: 64px !important;
                    border-bottom: none !important;
                }
                .ant-menu-horizontal .ant-menu-item {
                    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
                    padding: 0 !important;
                    margin: 0 4px !important;
                }
                .ant-menu-horizontal .ant-menu-item:after {
                    display: none !important;
                }
                .ant-menu-horizontal .ant-menu-item-selected {
                    color: #1677ff !important;
                }
                .ant-menu-horizontal .ant-menu-item:hover {
                    background: rgba(22, 119, 255, 0.06) !important;
                    border-radius: 12px;
                }
                .user-dropdown {
                    transition: all 0.2s;
                }
                .user-dropdown:hover {
                    background-color: rgba(0,0,0,0.05);
                }
                .ant-header {
                    transition: all 0.3s ease;
                }
                .module-text {
                    transition: all 0.2s ease;
                }
                @media (max-width: 1100px) {
                    .module-text-4 { display: none !important; }
                }
                @media (max-width: 1000px) {
                    .module-text-3 { display: none !important; }
                }
                @media (max-width: 900px) {
                    .module-text-2 { display: none !important; }
                }
                @media (max-width: 800px) {
                    .module-text-1 { display: none !important; }
                }
                @media (max-width: 700px) {
                    .module-text-0 { display: none !important; }
                }
                /* Hide the default Ant Design horizontal menu bottom bar */
                .ant-menu-horizontal > .ant-menu-item::after, 
                .ant-menu-horizontal > .ant-menu-submenu::after {
                    display: none !important;
                }
                @media (max-width: 576px) {
                    .ant-layout-header {
                        padding: 0 16px !important;
                    }
                }
            `}</style>
    </Header >
  );
}
