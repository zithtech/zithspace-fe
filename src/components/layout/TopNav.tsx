import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, Divider, Badge, Grid, Input, Tooltip, Empty, Modal, theme } from 'antd';
import { App } from 'antd';
import {
  Mail,
  MessageSquareText,
  CircleUser,
  Settings,
  LogOut,
  CalendarDays,
  LayoutGrid,
  Folder,
  Trash2,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Sparkles,
  History,
  Bookmark,
  BookmarkCheck,
  // Module icons (top navbar)
  Sparkle,
  Briefcase,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
  Timer,
} from 'lucide-react';

const MODULE_ICONS: Record<string, React.ComponentType<any>> = {
  MY_HUB: LayoutGrid,
  HOME: Sparkle,
  WORK: Briefcase,
  ADMIN: ShieldCheck,
  HRMS: UsersRound,
  FINANCE: Wallet,
};

const MODULE_ACCENT: Record<string, string> = {
  MY_HUB: '#3b82f6',   // blue
  HOME: '#3b82f6',     // indigo
  WORK: '#3b82f6',     // sky
  ADMIN: '#3b82f6',    // emerald
  HRMS: '#3b82f6',     // amber
  FINANCE: '#3b82f6',  // violet
};

interface ShortcutItem {
  id: string;
  name: string;
  path: string;
}
import { Inbox } from '@novu/nextjs';
import { Permissions } from '@/types/permissions';
import { NavItem, ModuleType, NAVIGATION_CONFIG, NAV_MOBILE_BREAKPOINT } from './navigationConfig';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useIsBreakpoint } from '@/hooks/use-is-breakpoint';
import { TimeTrackerPopover } from '@/components/time-tracking/TimeTrackerPopover';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { HistoryOutlined } from '@ant-design/icons';

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
  const pathname = usePathname();
  const isRouteActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + '/');
  const { hasPermission, hasAnyPermission, hasAnySubscriptionFeature } = useAuth();
  const {
    canReadMail,
    canReadCalendar,
    canReadSkills,
    canReadChat,
    canReadNotification,
    canReadBookmark,
    canCreateBookmark,
    canDeleteBookmark,
    canReadTimeTracking,
    canCreateTimeTracking,
    canReadActivityLogAll
  } = usePermission();
  const { token } = theme.useToken();
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const { modal } = App.useApp();

  const novuAppearance = {
    baseTheme: isDark ? { variables: {} } : undefined,
    variables: {
      colorPrimary: "#3B82F6",
      colorPrimaryForeground: "#FFFFFF",
      colorForeground: isDark ? "#F1F5F9" : "#0F172A",
      colorSecondaryForeground: isDark ? "#94A3B8" : "#475569",
      colorBackground: isDark ? "#0F172A" : "#FFFFFF",
      colorSecondary: isDark ? "#1E293B" : "#F1F5F9",
      colorNeutral: isDark ? "#F8FAFC" : "#0F172A",
      colorCounter: "#EF4444",
      colorCounterForeground: "#FFFFFF",
      colorBorder: isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(15, 23, 42, 0.08)",
      colorRing: isDark ? "rgba(59, 130, 246, 0.45)" : "rgba(59, 130, 246, 0.35)",
    },
    elements: {
      popoverContent: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        border: isDark ? "1px solid rgba(148, 163, 184, 0.16)" : "1px solid rgba(15, 23, 42, 0.08)",
        color: isDark ? "#F1F5F9" : "#0F172A",
        boxShadow: isDark
          ? "0 12px 32px -10px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.35)"
          : "0 12px 32px -10px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.06)",
        borderRadius: 12,
        overflow: "hidden",
      },
      inboxHeader: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        borderBottom: isDark ? "1px solid rgba(148, 163, 184, 0.12)" : "1px solid rgba(15, 23, 42, 0.06)",
        color: isDark ? "#F1F5F9" : "#0F172A",
      },
      notification: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        borderBottom: isDark ? "1px solid rgba(148, 163, 184, 0.08)" : "1px solid rgba(15, 23, 42, 0.04)",
      },
      notificationDot: { background: "#3B82F6" },
      notificationSubject: { color: isDark ? "#F1F5F9" : "#0F172A" },
      notificationBody: { color: isDark ? "#CBD5E1" : "#475569" },
      notificationDate: { color: isDark ? "#94A3B8" : "#64748B" },
      notificationPrimaryAction: {
        background: "#3B82F6",
        color: "#FFFFFF",
      },
      notificationSecondaryAction: {
        background: isDark ? "#1E293B" : "#F1F5F9",
        color: isDark ? "#F1F5F9" : "#0F172A",
      },
      tabsList: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        borderBottom: isDark ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(15, 23, 42, 0.05)",
      },
      tabsTrigger: {
        color: isDark ? "#94A3B8" : "#64748B",
      },
      inboxStatus__dropdownTrigger: {
        color: isDark ? "#F1F5F9" : "#0F172A",
      },
      moreActionsDropdownTrigger: {
        color: isDark ? "#94A3B8" : "#64748B",
      },
      moreActionsDropdownContent: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        border: isDark ? "1px solid rgba(148, 163, 184, 0.16)" : "1px solid rgba(15, 23, 42, 0.08)",
        color: isDark ? "#F1F5F9" : "#0F172A",
      },
      moreActionsDropdownItem: {
        color: isDark ? "#E2E8F0" : "#0F172A",
      },
      empty: {
        color: isDark ? "#94A3B8" : "#64748B",
      },
      emptyText: {
        color: isDark ? "#94A3B8" : "#64748B",
      },
      preferencesHeader: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        color: isDark ? "#F1F5F9" : "#0F172A",
      },
      workflowContainer: {
        background: isDark ? "#0F172A" : "#FFFFFF",
        borderBottom: isDark ? "1px solid rgba(148, 163, 184, 0.08)" : "1px solid rgba(15, 23, 42, 0.04)",
      },
      workflowLabel: {
        color: isDark ? "#F1F5F9" : "#0F172A",
      },
      workflowDescription: {
        color: isDark ? "#94A3B8" : "#64748B",
      },
    },
  };
  const { isPopoverOpen, setPopoverOpen, activeEntry } = useTimeTrackerStore();
  const timerState = !activeEntry ? "idle" : activeEntry.status === "RUNNING" ? "running" : "paused";
  const screens = useBreakpoint();
  const isCustomBreakpoint = useIsBreakpoint("max", 1290); // true when width <= 1289

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
  const deleteModalOpenRef = React.useRef(false);

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
    deleteModalOpenRef.current = true;
    setDeleteModalOpen(true);
    modal.confirm({
      title: 'Delete Bookmark',
      content: 'Are you sure you want to delete this bookmark?',
      onOk: () => {
        const updated = shortcuts.filter(s => s.id !== id);
        setShortcuts(updated);
        localStorage.setItem('nav_shortcuts', JSON.stringify(updated));
        deleteModalOpenRef.current = false;
        setDeleteModalOpen(false);
      },
      onCancel: () => {
        deleteModalOpenRef.current = false;
        setDeleteModalOpen(false);
      },
    });
  };

  // Breakpoints logic
  const isMobile = useIsBreakpoint("max", 790);
  const isSmallMobile = !screens.sm;

  // Filter modules by permission (chip visibility).
  // requiredChipAnyPermission, when present, controls chip visibility on its own
  // — decoupled from route access (which stays on requiredAnyPermission). This
  // lets us hide HRMS/FINANCE chips from normal users while their routes remain
  // reachable via My Hub shortcuts.
  const visibleModules = NAVIGATION_CONFIG.filter(module => {
    // 1. If subscription is required for this module, check it FIRST
    if (module.requiredSubscriptionFeature) {
      if (!hasAnySubscriptionFeature(...module.requiredSubscriptionFeature)) {
        return false;
      }
    }

    // 2. Then check RBAC permissions
    if (module.requiredChipAnyPermission) return hasAnyPermission(...module.requiredChipAnyPermission);
    if (!module.requiredPermission && !module.requiredAnyPermission) return true;
    if (module.requiredPermission) return hasPermission(module.requiredPermission);
    if (module.requiredAnyPermission) return hasAnyPermission(...module.requiredAnyPermission);
    return false;
  });

  const getFirstAllowedPath = (items: NavItem[]): string | undefined => {
    for (const item of items) {
      // 1. Subscription Check
      if (item.requiredSubscriptionFeature && !hasAnySubscriptionFeature(...item.requiredSubscriptionFeature)) {
        continue;
      }

      // 2. RBAC Check
      let hasItemPermission = true;
      if (item.requiredPermission) {
        hasItemPermission = hasPermission(item.requiredPermission);
      } else if (item.requiredAnyPermission) {
        hasItemPermission = hasAnyPermission(...item.requiredAnyPermission);
      }

      if (!hasItemPermission) {
        continue;
      }

      if (item.children && item.children.length > 0) {
        const childPath = getFirstAllowedPath(item.children);
        if (childPath) return childPath;
      } else if (item.path) {
        return item.path;
      }
    }
    return undefined;
  };

  const handleModuleClick = (moduleKey: ModuleType) => {
    onModuleChange(moduleKey);
    const moduleConfig = NAVIGATION_CONFIG.find(m => m.key === moduleKey);
    if (moduleConfig) {
      const firstAllowedPath = getFirstAllowedPath(moduleConfig.items);
      if (firstAllowedPath) {
        router.push(firstAllowedPath);
      } else if (moduleConfig.defaultPath) {
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
      icon: <CircleUser size={16} strokeWidth={1.75} />,
      label: "Profile",
      onClick: () => router.push("/profile"),
    },
    // {
    //   key: "settings",
    //   icon: <Settings size={16} strokeWidth={1.75} />,
    //   label: "Settings",
    //   onClick: () => router.push("/settings"),
    // },
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
      icon: <LogOut size={16} strokeWidth={1.75} />,
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

  const menuItems = visibleModules.map((module, index) => {
    const ModuleIcon = MODULE_ICONS[module.key] || LayoutGrid;
    const accent = MODULE_ACCENT[module.key] || '#1677ff';
    const isActive = activeModule === module.key;
    return {
      key: module.key,
      label: (
        <div
          className={`module-pill${isActive ? ' module-pill-active' : ''}`}
          style={{ ['--module-accent' as any]: accent }}
        >
          <span className="module-pill-icon">
            <ModuleIcon size={17} strokeWidth={isActive ? 2 : 1.75} />
          </span>
          <span className={`module-text module-text-${index}`}>
            {module.label}
          </span>
        </div>
      ),
    };
  });

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
          <BookmarkCheck size={16} strokeWidth={1.75} color="#1677ff" />
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
                <Folder size={16} strokeWidth={1.75} color="#8c8c8c" />
                <Text
                  style={{ fontSize: 13, color: "var(--text-primary)" }}
                  ellipsis
                >
                  {item.name}
                </Text>
              </div>

              {hoveredShortcutId === item.id ? (
                canDeleteBookmark && (
                  <Tooltip title="Delete Bookmark">
                    <Button
                      type="text"
                      shape="circle"
                      icon={
                        <Trash2 size={14} strokeWidth={1.75} color="#8c8c8c" />
                      }
                      size="small"
                      onClick={(e) => handleDeleteBookmark(item.id, e)}
                    />
                  </Tooltip>
                )
              ) : (
                <ChevronRight size={12} strokeWidth={2} color="#bfbfbf" />
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
          canCreateBookmark && (
            <Button
              type="text"
              icon={<Plus size={14} strokeWidth={2} />}
              onClick={() => setIsAddMode(true)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "4px 0",
              }}
            >
              Add Bookmark
            </Button>
          )
        )}
      </div>
    </div>
  );

  return (
    <Header
      className="main-top-nav"
      style={{
        padding: isMobile ? "0 16px" : "0 24px 0 0",
        background: "var(--bg-pure-white)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      {/* Left Side: Logo & Module Selector */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', flex: 1, minWidth: 0 }}>
        {/* Logo Area */}
        <div
          style={{
            width: isMobile ? 'auto' : (collapsed ? 52 : 200),
            minWidth: isMobile ? 'auto' : (collapsed ? 52 : 200),
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="brand-badge">
                {(user?.tenantName?.charAt(0) || 'Z').toUpperCase()}
              </div>
              {!collapsed && (
                <Text
                  strong
                  className="brand-name"
                  style={{ fontSize: isMobile ? 17 : 19 }}
                >
                  {user?.tenantName || 'Zithtech'}
                </Text>
              )}
            </div>
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
              marginLeft: 14,
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
            <Button type="text" icon={<LayoutGrid size={16} strokeWidth={1.75} />} style={{ fontWeight: 600, marginLeft: 20 }}>
              {!isSmallMobile && activeModule}
            </Button>
          </Dropdown>
        )}
      </div>

      {/* Right Side: User Actions */}
      <Space size={isSmallMobile ? 4 : 8} align="center" style={{ flexShrink: 0 }}>
        {!isCustomBreakpoint ? (
          <>
            <ThemeToggle />
            {canReadTimeTracking && canCreateTimeTracking && <TimeTrackerPopover />}


            {canReadMail && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Mail</span>
                    <span className="navbar-tooltip-sub">Inbox & messages</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
              >
                <Button
                  type="text"
                  className={`nav-action-btn${isRouteActive('/mail') ? ' nav-action-btn-active' : ''}`}
                  icon={<Mail size={17} strokeWidth={isRouteActive('/mail') ? 2 : 1.75} />}
                  onClick={() => router.push('/mail')}
                />
              </Tooltip>
            )}
            {canReadCalendar && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Calendar</span>
                    <span className="navbar-tooltip-sub">Schedule & events</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
              >
                <Button
                  type="text"
                  className={`nav-action-btn${isRouteActive('/calendar') ? ' nav-action-btn-active' : ''}`}
                  icon={<CalendarDays size={17} strokeWidth={isRouteActive('/calendar') ? 2 : 1.75} />}
                  onClick={() => router.push('/calendar')}
                />
              </Tooltip>
            )}
            {canReadSkills && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Skills</span>
                    <span className="navbar-tooltip-sub">Learning & growth</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
              >
                <Button
                  type="text"
                  className={`nav-action-btn${isRouteActive('/skills') ? ' nav-action-btn-active' : ''}`}
                  icon={<Sparkles size={17} strokeWidth={isRouteActive('/skills') ? 2 : 1.75} />}
                  onClick={() => router.push('/skills')}
                />
              </Tooltip>
            )}

            {canReadChat && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Messages</span>
                    <span className="navbar-tooltip-sub">Team chat</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
              >
                <Button
                  type="text"
                  className={`nav-action-btn${isRouteActive('/chat') ? ' nav-action-btn-active' : ''}`}
                  icon={<MessageSquareText size={17} strokeWidth={isRouteActive('/chat') ? 2 : 1.75} />}
                  onClick={() => router.push('/chat')}
                />
              </Tooltip>
            )}
            {canReadActivityLogAll && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Activity</span>
                    <span className="navbar-tooltip-sub">Transaction history</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
              >
                <Button
                  type="text"
                  className={`nav-action-btn${isRouteActive('/activity') ? ' nav-action-btn-active' : ''}`}
                  icon={<History size={17} strokeWidth={isRouteActive('/activity') ? 2 : 1.75} />}
                  onClick={() => router.push('/activity')}
                />
              </Tooltip>
            )}
            {/* {canReadNotification && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Notifications</span>
                    <span className="navbar-tooltip-sub">Alerts & updates</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
              >
                <div className={`nav-action-btn-inbox novu-inbox-wrapper ${isDark ? "novu-inbox-dark" : "novu-inbox-light"}`}>
                  <Inbox
                    applicationIdentifier="67g_5lVLFWvd"
                    subscriberId={user?.id}
                    socketUrl="wss://socket.novu.co"
                    appearance={novuAppearance}
                  />
                </div>
              </Tooltip>
            )} */}
            {canReadBookmark && (
              <Tooltip
                title={
                  <div className="navbar-tooltip">
                    <span className="navbar-tooltip-title">Bookmarks</span>
                    <span className="navbar-tooltip-sub">Saved shortcuts</span>
                  </div>
                }
                placement="bottom"
                classNames={{ root: "navbar-icon-tooltip" }}
                mouseEnterDelay={0.1}
                zIndex={1100}
                open={shortcutPopoverVisible ? false : undefined}
              >
                <Dropdown
                  open={shortcutPopoverVisible && !isCustomBreakpoint}
                  onOpenChange={(visible) => {
                    if (!visible && deleteModalOpenRef.current) return;
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
                    className={`nav-action-btn${(shortcutPopoverVisible && !isCustomBreakpoint) ? ' nav-action-btn-active' : ''}`}
                    icon={
                      (shortcutPopoverVisible && !isCustomBreakpoint) ? (
                        <Bookmark size={17} strokeWidth={2} fill="#1677ff" color="#1677ff" />
                      ) : (
                        <Bookmark size={17} strokeWidth={1.75} />
                      )
                    }
                  />
                </Dropdown>
              </Tooltip>
            )}
          </>
        ) : (
          <Space size={isSmallMobile ? 4 : 8}>
            <ThemeToggle />
            {canReadNotification && (
              <div className={`novu-inbox-wrapper ${isDark ? "novu-inbox-dark" : "novu-inbox-light"}`}>
                <Inbox
                  applicationIdentifier="67g_5lVLFWvd"
                  subscriberId={user?.id}
                  socketUrl="wss://socket.novu.co"
                  appearance={novuAppearance}
                />
              </div>
            )}
            <Dropdown
              menu={{
                items: [
                  ...(hasPermission(Permissions.TIME_TRACKING_READ) && hasPermission(Permissions.TIME_TRACKING_CREATE) ? [{
                    key: 'timer',
                    label: <TimeTrackerPopover isMenuItem />,
                    onClick: () => setPopoverOpen(true)
                  }] : []),
                  ...(hasPermission(Permissions.MAIL_READ) ? [{
                    key: 'mail',
                    label: 'Mail',
                    icon: <Mail size={16} strokeWidth={1.75} />,
                    onClick: () => router.push('/mail')
                  }] : []),
                  ...(hasPermission(Permissions.CALENDAR_READ) ? [{
                    key: 'calendar',
                    label: 'Calendar',
                    icon: <CalendarDays size={16} strokeWidth={1.75} />,
                    onClick: () => router.push('/calendar')
                  }] : []),
                  ...(hasPermission(Permissions.CHAT_READ) ? [{
                    key: 'chat',
                    label: 'Messages',
                    icon: <MessageSquareText size={16} strokeWidth={1.75} />,
                    onClick: () => router.push('/chat')
                  }] : []),
                  ...(hasPermission(Permissions.BOOKMARK_READ) ? [{
                    key: 'bookmarks',
                    label: 'Bookmarks',
                    icon: <Bookmark size={16} strokeWidth={1.75} />,
                    onClick: (e: any) => {
                      e.domEvent.stopPropagation();
                      setShortcutPopoverVisible(true);
                    }
                  }] : [])
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" icon={<MoreHorizontal size={20} strokeWidth={1.75} />} />
            </Dropdown>
          </Space>
        )}

        {/* Mobile Bookmark Modal - Ensuring bookmarks only show when specifically clicked on mobile */}
        {isCustomBreakpoint && (
          <Modal
            open={shortcutPopoverVisible}
            onCancel={() => {
              if (deleteModalOpenRef.current) return;
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
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border-slate-100)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-slate-900)"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Timer size={14} />
                  {timerState === "running"
                    ? "Running timer"
                    : timerState === "paused"
                      ? "Paused timer"
                      : "Start a timer"}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => {
                    setPopoverOpen(false);
                    router.push("/time-tracking");
                  }}
                  style={{ marginRight: 24 }}
                />
              </div>
            }
            closeIcon={<X size={16} color="var(--text-slate-400)" />}
            width={360}
            centered
            className="ttp-mobile-modal"
            styles={{
              body: { padding: "14px", background: "var(--bg-pure-white)" },
              header: { background: "transparent", padding: "14px 14px 0", margin: 0 }
            }}
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
            popupRender={(menu) => (
              <div style={{ boxShadow: 'none', border: '1px solid var(--border-slate-200)', borderRadius: 8, background: 'var(--bg-pure-white)' }}>
                {menu}
              </div>
            )}
          >
            <Space
              style={{
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 8,
              }}
            >
              <Avatar
                size={isSmallMobile ? 28 : 32}
                style={{
                  background: user.avatarUrl ? 'transparent' : 'var(--bg-slate-200)',
                  color: 'var(--text-slate-700)',
                  fontSize: 14,
                  fontWeight: 700
                }}
                src={user.avatarUrl}
              >
                {!user.avatarUrl && user.name?.charAt(0).toUpperCase()}
              </Avatar>
              {!isSmallMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, marginLeft: 6 }}>
                  <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{user.name}</Text>
                  {user.role && (
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
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
                    line-height: 60px !important;
                    border-bottom: none !important;
                    background: transparent !important;
                  }
                .ant-menu-horizontal .ant-menu-item {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    padding: 0 !important;
                    margin: 0 2px !important;
                    background: transparent !important;
                }
                .ant-menu-horizontal .ant-menu-item:after,
                .ant-menu-horizontal .ant-menu-item-selected:after {
                    display: none !important;
                }
                .ant-menu-horizontal .ant-menu-item:hover {
                    background: transparent !important;
                }
                .ant-menu-horizontal .ant-menu-item-selected {
                    color: inherit !important;
                }

                /* Module pill — premium per-module accent highlighting */
                .module-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 10px;
                    height: 32px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 12.5px;
                    letter-spacing: 0.2px;
                    color: #475569;
                    border: 1px solid transparent;
                    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
                    position: relative;
                }
                .module-pill .module-pill-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    color: inherit;
                    transition: color 0.2s ease;
                }
                .module-pill:hover {
                    background: rgba(15, 23, 42, 0.04);
                    color: var(--module-accent);
                }
                .module-pill:hover .module-pill-icon {
                    color: var(--module-accent);
                }
                /* Active module — soft accent-tinted pill (matches reference) */
                .module-pill-active {
                    background: color-mix(in srgb, var(--module-accent) 12%, transparent);
                    color: var(--module-accent);
                    border-color: color-mix(in srgb, var(--module-accent) 20%, transparent);
                }
                .module-pill-active:hover {
                    background: color-mix(in srgb, var(--module-accent) 16%, transparent);
                }
                .module-pill-active .module-pill-icon {
                    color: var(--module-accent);
                }

                /* Brand badge (logo) — compact indigo→blue square */
                .brand-badge {
                    width: 34px;
                    height: 34px;
                    border-radius: 0px;
                    background: #3B82F6;
                    color: #ffffff;
                    font-weight: 800;
                    font-size: 16px;
                    line-height: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    letter-spacing: -0.5px;
                    box-shadow: 0 4px 12px -3px rgba(79, 70, 229, 0.45);
                }
                /* Wordmark — solid dark text (matches reference, not gradient) */
                .brand-name {
                    color: var(--text-primary);
                    font-weight: 700 !important;
                    letter-spacing: -0.3px;
                    white-space: nowrap;
                    line-height: 1;
                }
                .ant-menu-horizontal .ant-menu-item:active .module-pill {
                    transform: scale(0.97);
                }
                /* Dark theme */
                [data-theme='dark'] .module-pill {
                    color: #94A3B8;
                }
                [data-theme='dark'] .module-pill:hover {
                    background: rgba(148, 163, 184, 0.08);
                }
                [data-theme='dark'] .module-pill-active {
                    background: color-mix(in srgb, var(--module-accent) 22%, transparent);
                    border-color: color-mix(in srgb, var(--module-accent) 35%, transparent);
                }
                [data-theme='dark'] .module-pill-active:hover {
                    background: color-mix(in srgb, var(--module-accent) 28%, transparent);
                }
                .user-dropdown-premium:hover {
                    background-color: #fff !important;
                    border-color: rgba(0,0,0,0.06) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    transform: translateY(-1px);
                }
                [data-theme='dark'] .user-dropdown-premium:hover {
                    background-color: rgba(255,255,255,0.05) !important;
                    border-color: rgba(255,255,255,0.1) !important;
                }
                .ant-header {
                    transition: all 0.3s ease;
                }
                .module-text {
                    transition: all 0.2s ease;
                }
                @media (max-width: 1200px) {
                    .module-text-4 { display: none !important; }
                }
                @media (max-width: 1120px) {
                    .module-text-3 { display: none !important; }
                }
                @media (max-width: 1040px) {
                    .module-text-2 { display: none !important; }
                }
                @media (max-width: 960px) {
                    .module-text-1 { display: none !important; }
                }
                @media (max-width: 880px) {
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

                /* Premium nav action buttons (top navbar right side) */
                .nav-action-btn.ant-btn,
                .nav-action-btn {
                    width: 32px !important;
                    height: 32px !important;
                    min-width: 32px !important;
                    padding: 0 !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 0px !important;
                    color: #475569;
                    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
                }
                .nav-action-btn.ant-btn:hover,
                .nav-action-btn:hover {
                    background: rgba(22, 119, 255, 0.08) !important;
                    color: #1677ff !important;
                }
                .nav-action-btn.ant-btn:active,
                .nav-action-btn:active {
                    transform: scale(0.96);
                }
                .nav-action-btn.nav-action-btn-active,
                .nav-action-btn-active.ant-btn {
                    background: rgba(22, 119, 255, 0.12) !important;
                    color: #1677ff !important;
                }
                .nav-action-btn.nav-action-btn-active:hover,
                .nav-action-btn-active.ant-btn:hover {
                    background: rgba(22, 119, 255, 0.16) !important;
                }
                /* Novu inbox bell wrapped as nav-action-btn */
                .nav-action-btn-inbox {
                    position: relative;
                    width: 32px !important;
                    height: 32px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 9px !important;
                }
                .nav-action-btn-inbox .nv-button,
                .nav-action-btn-inbox button {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    outline: none !important;
                    width: 32px !important;
                    height: 32px !important;
                    padding: 0 !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 0px !important;
                    color: #475569;
                    transition: background-color 0.2s ease, color 0.2s ease;
                }
                .nav-action-btn-inbox .nv-button:hover,
                .nav-action-btn-inbox button:hover {
                    background: rgba(22, 119, 255, 0.08) !important;
                    color: #1677ff !important;
                    box-shadow: none !important;
                    outline: none !important;
                }
                .nav-action-btn-inbox .nv-button:focus,
                .nav-action-btn-inbox button:focus,
                .nav-action-btn-inbox .nv-button:focus-visible,
                .nav-action-btn-inbox button:focus-visible {
                    box-shadow: none !important;
                    outline: none !important;
                    border: none !important;
                }
                .nav-action-btn-inbox svg {
                    width: 17px !important;
                    height: 17px !important;
                    stroke-width: 1.75 !important;
                }
                /* Dark theme tints */
                [data-theme='dark'] .nav-action-btn,
                [data-theme='dark'] .nav-action-btn.ant-btn {
                    color: #94A3B8;
                }
                [data-theme='dark'] .nav-action-btn:hover,
                [data-theme='dark'] .nav-action-btn.ant-btn:hover {
                    background: rgba(59, 130, 246, 0.14) !important;
                    color: #E2E8F0 !important;
                }
                [data-theme='dark'] .nav-action-btn.nav-action-btn-active,
                [data-theme='dark'] .nav-action-btn-active.ant-btn {
                    background: rgba(59, 130, 246, 0.20) !important;
                    color: #93C5FD !important;
                }

                /* Premium navbar icon tooltip */
                .navbar-icon-tooltip {
                    --tooltip-bg: rgba(15, 23, 42, 0.95);
                    --tooltip-fg: #f8fafc;
                    --tooltip-sub: rgba(248, 250, 252, 0.65);
                    z-index: 1100 !important;
                }
                .navbar-icon-tooltip .ant-tooltip-arrow::before,
                .navbar-icon-tooltip .ant-tooltip-arrow::after {
                    background: var(--tooltip-bg) !important;
                }
                .navbar-icon-tooltip .ant-tooltip-inner {
                    background: var(--tooltip-bg) !important;
                    color: var(--tooltip-fg) !important;
                    backdrop-filter: blur(10px) saturate(160%);
                    -webkit-backdrop-filter: blur(10px) saturate(160%);
                    padding: 8px 12px !important;
                    border-radius: 10px !important;
                    box-shadow:
                        0 8px 24px -8px rgba(0, 0, 0, 0.35),
                        0 2px 6px rgba(0, 0, 0, 0.18),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    min-width: 0;
                    font-size: 12px !important;
                    line-height: 1.35 !important;
                }
                .navbar-tooltip {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1px;
                }
                .navbar-tooltip-title {
                    font-weight: 600;
                    font-size: 12.5px;
                    letter-spacing: 0.1px;
                    color: var(--tooltip-fg);
                }
                .navbar-tooltip-sub {
                    font-size: 11px;
                    font-weight: 400;
                    color: var(--tooltip-sub);
                    letter-spacing: 0.15px;
                }
                /* Animation polish */
                .navbar-icon-tooltip.ant-tooltip {
                    animation-duration: 0.18s !important;
                }

                /* Novu Inbox dark-mode polish */
                .novu-inbox-dark .nv-popoverContent,
                [data-theme='dark'] .nv-popoverContent {
                    background: #0F172A !important;
                    border: 1px solid rgba(148, 163, 184, 0.16) !important;
                    color: #F1F5F9 !important;
                    box-shadow:
                        0 12px 32px -10px rgba(0, 0, 0, 0.6),
                        0 4px 12px rgba(0, 0, 0, 0.35) !important;
                }
                [data-theme='dark'] .nv-inboxHeader,
                [data-theme='dark'] .nv-tabsList,
                [data-theme='dark'] .nv-preferencesHeader,
                [data-theme='dark'] .nv-notification,
                [data-theme='dark'] .nv-workflowContainer,
                [data-theme='dark'] .nv-moreActionsDropdownContent {
                    background: #0F172A !important;
                    color: #F1F5F9 !important;
                }
                [data-theme='dark'] .nv-inboxHeader {
                    border-bottom: 1px solid rgba(148, 163, 184, 0.12) !important;
                }
                [data-theme='dark'] .nv-tabsList {
                    border-bottom: 1px solid rgba(148, 163, 184, 0.10) !important;
                }
                [data-theme='dark'] .nv-notification {
                    border-bottom: 1px solid rgba(148, 163, 184, 0.08) !important;
                }
                [data-theme='dark'] .nv-notification:hover {
                    background: rgba(59, 130, 246, 0.08) !important;
                }
                [data-theme='dark'] .nv-notificationSubject,
                [data-theme='dark'] .nv-tabsTrigger[data-state="active"],
                [data-theme='dark'] .nv-inboxStatus__dropdownTrigger,
                [data-theme='dark'] .nv-workflowLabel {
                    color: #F1F5F9 !important;
                }
                [data-theme='dark'] .nv-notificationBody {
                    color: #CBD5E1 !important;
                }
                [data-theme='dark'] .nv-notificationDate,
                [data-theme='dark'] .nv-tabsTrigger,
                [data-theme='dark'] .nv-workflowDescription,
                [data-theme='dark'] .nv-emptyText,
                [data-theme='dark'] .nv-moreActionsDropdownTrigger {
                    color: #94A3B8 !important;
                }
                [data-theme='dark'] .nv-tabsTrigger:hover {
                    color: #E2E8F0 !important;
                    background: rgba(148, 163, 184, 0.06) !important;
                }
                [data-theme='dark'] .nv-notificationSecondaryAction {
                    background: #1E293B !important;
                    color: #F1F5F9 !important;
                    border-color: rgba(148, 163, 184, 0.12) !important;
                }
                [data-theme='dark'] .nv-notificationPrimaryAction {
                    background: #3B82F6 !important;
                    color: #FFFFFF !important;
                }
                [data-theme='dark'] .nv-moreActionsDropdownContent {
                    border: 1px solid rgba(148, 163, 184, 0.16) !important;
                    box-shadow:
                        0 8px 24px -8px rgba(0, 0, 0, 0.55),
                        0 2px 8px rgba(0, 0, 0, 0.3) !important;
                }
                [data-theme='dark'] .nv-moreActionsDropdownItem:hover {
                    background: rgba(59, 130, 246, 0.12) !important;
                }
                [data-theme='dark'] .nav-action-btn-inbox .nv-button,
                [data-theme='dark'] .nav-action-btn-inbox button {
                    color: #94A3B8;
                }
                [data-theme='dark'] .nav-action-btn-inbox .nv-button:hover,
                [data-theme='dark'] .nav-action-btn-inbox button:hover {
                    background: rgba(59, 130, 246, 0.14) !important;
                    color: #E2E8F0 !important;
                    box-shadow: none !important;
                    outline: none !important;
                }
                [data-theme='dark'] .nv-button:hover {
                    background: rgba(148, 163, 184, 0.08) !important;
                }
                /* Custom scrollbar inside dark popover */
                [data-theme='dark'] .nv-popoverContent ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                [data-theme='dark'] .nv-popoverContent ::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.2);
                    border-radius: 4px;
                }
                [data-theme='dark'] .nv-popoverContent ::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.35);
                }
                [data-theme='dark'] .nv-popoverContent ::-webkit-scrollbar-track {
                    background: transparent;
                }

                /* Mobile Timer Modal Polish */
                .ttp-mobile-modal .ant-modal-content {
                  padding: 0 !important;
                  border-radius: 16px !important;
                  background: var(--bg-pure-white) !important;
                  border: 1px solid var(--border-slate-100) !important;
                  box-shadow: 0 12px 32px -8px rgba(15, 23, 42, 0.18), 0 8px 16px -8px rgba(15, 23, 42, 0.12) !important;
                }
                [data-theme='dark'] .ttp-mobile-modal .ant-modal-content {
                  border-color: #27273a !important;
                }
            `}</style>
    </Header >
  );
}
