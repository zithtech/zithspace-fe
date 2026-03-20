import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layout,
  Menu,
  Button,
  Space,
  Typography,
  Dropdown,
  Avatar,
  Divider,
  Input,
  Badge,
  Empty,
  List,
  Tooltip,
  Modal,
} from "antd";
import {
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  HistoryOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  FolderOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Inbox } from "@novu/nextjs";
import { ModuleType, NAVIGATION_CONFIG } from "./navigationConfig";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { searchablePages } from "@/app/shorts";
import { ShortcutService } from "@/services/ShortcutService";

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
  const [showSearch, setShowSearch] = useState<any>(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const searchInputRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  interface ShortcutItem {
    id: string;
    name: string;
    path: string;
  }

  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newShortcutName, setNewShortcutName] = useState("");
  const [newShortcutPath, setNewShortcutPath] = useState("");
  const [shortcutPopoverVisible, setShortcutPopoverVisible] = useState(false);
  const [hoveredShortcutId, setHoveredShortcutId] = useState<string | null>(
    null,
  );

  // ✅ FIX: Use state-based modal instead of Modal.confirm()
  // Modal.confirm() causes the Dropdown to close (its overlay triggers onOpenChange(false))
  // By controlling the Modal with state and rendering it outside the Dropdown,
  // we avoid that interference entirely.
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Filter modules by permission
  const visibleModules = NAVIGATION_CONFIG.filter((module) => {
    if (!module.requiredPermission && !module.requiredAnyPermission)
      return true;
    if (module.requiredPermission)
      return hasPermission(module.requiredPermission);
    if (module.requiredAnyPermission)
      return hasAnyPermission(...module.requiredAnyPermission);
    return false;
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
      case "super_admin":
        return "#ff4d4f";
      case "admin":
        return "#faad14";
      default:
        return "#52c41a";
    }
  };

  const loadShortcuts = useCallback(async () => {
    console.log("loadShortcuts function called");
    try {
      const response = await ShortcutService.getShortcuts();
      console.log(" RESPONSE DATA:", response.data);

      const rawData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

      const formattedData = rawData.map((item: any) => ({
        id: item.id,
        name: item.title,
        path: item.path,
      }));

      console.log("Formatted Shortcuts:", formattedData);
      setShortcuts(formattedData);
    } catch (error) {
      console.log(error, "loadShortcuts() error");
      console.error("Failed to fetch shortcuts", error);
      setShortcuts([]);
    }
  }, []);

  useEffect(() => {
    if (shortcutPopoverVisible) {
      loadShortcuts();
    }
  }, [shortcutPopoverVisible, loadShortcuts]);

  const handleSaveBookmark = async () => {
    if (!newShortcutName || !newShortcutPath) return;

    const newShortcutData = {
      name: newShortcutName,
      path: newShortcutPath,
    };

    try {
      await ShortcutService.createShortcut(newShortcutData);
      await loadShortcuts();
      setNewShortcutName("");
      setNewShortcutPath("");
      setIsAddMode(false);
    } catch (error) {
      console.error("Failed to create shortcut", error);
    }
  };

  // ✅ FIX: Instead of calling Modal.confirm() directly (which closes the Dropdown),
  // we just set state here. The actual Modal is rendered outside the Dropdown below.
  const handleDeleteBookmark = (shortcutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTargetId(shortcutId);
    setDeleteModalOpen(true);
  };

  // ✅ FIX: Separated confirm handler — runs after user clicks OK in the Modal
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await ShortcutService.deleteShortcut(String(deleteTargetId));
      await loadShortcuts();
    } catch (error) {
      console.error("Failed to delete shortcut", error);
    } finally {
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;

      // If the click is inside the dropdown overlay, do nothing to allow the click event to fire
      if (target.closest && target.closest('.ant-dropdown')) {
        return;
      }

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
        setSearchValue("");
      }
    }

    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  useEffect(() => {
    if (searchValue.trim()) {
      const lowercasedValue = searchValue.toLowerCase().trim();
      const filtered = searchablePages
        .map((item) => ({
          ...item,
          pageName: item.pageName?.trim() || "",
          url: item.url?.trim() || "",
          tags: Array.isArray(item.tags)
            ? item.tags.flatMap((t) => t.split(",").map((s) => s.trim()))
            : [],
        }))
        .filter((item: any) => {
          if (!item.pageName || !item.url) return false;

          const nameMatch = item.pageName
            .toLowerCase()
            .includes(lowercasedValue);
          const tagMatch = item.tags.some((tag: any) =>
            tag.toLowerCase().includes(lowercasedValue),
          );

          return nameMatch || tagMatch;
        });
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchValue]);

  const pathname = usePathname();

  useEffect(() => {
    if (isNavigating) {
      setSearchValue("");
      setIsDropdownOpen(false);
      setShowSearch(false);
      setIsNavigating(false);
    }
  }, [pathname]);

  const handleSearchNavigate = (url: string) => {
    if (url) {
      if (url === pathname) {
        setSearchValue("");
        setIsDropdownOpen(false);
        setShowSearch(false);
        setIsNavigating(false);
        return;
      }
      setIsNavigating(true);
      router.push(url);
    }
  };

  const handleSearchOpenChange = (open: boolean) => {
    // Only allow manual open (onFocus) or closing when empty/not hovering, to prevent instant close issues.
    if (!open && searchContainerRef.current?.matches(":focus-within")) {
      return;
    }
    setIsDropdownOpen(open);
  };

  const menuItems = visibleModules.map((module) => ({
    key: module.key,
    label: (
      <span
        style={{
          fontWeight: 600,
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {module.icon}
        {module.label}
      </span>
    ),
  }));

  console.log(user?.id);

  return (
    <>
      {/* ✅ FIX: Modal is rendered OUTSIDE the Dropdown so its overlay does not
          trigger the Dropdown's onOpenChange(false), which was the root cause
          of the delete appearing to do nothing (dropdown closed, state reset). */}
      <Modal
        title="Delete Bookmark"
        open={deleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this bookmark?</p>
      </Modal>

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
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Left Side: Logo & Collapse & Modules */}
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          {/* Logo Area */}
          <div
            style={{
              width: collapsed ? 80 : 240,
              height: "100%",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: collapsed ? 45 : "120px",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                strong
                style={{
                  fontSize: 24,
                  color: "#1677ff",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {collapsed ? "Z" : "Zithtech"}
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

              const moduleConfig = NAVIGATION_CONFIG.find(
                (m) => m.key === moduleKey,
              );
              if (moduleConfig) {
                if (moduleConfig.defaultPath) {
                  router.push(moduleConfig.defaultPath);
                } else if (moduleConfig.items.length > 0) {
                  const firstItem = moduleConfig.items[0];
                  if (firstItem.path) {
                    router.push(firstItem.path);
                  } else if (
                    firstItem.children &&
                    firstItem.children.length > 0
                  ) {
                    const firstChild = firstItem.children[0];
                    if (firstChild.path) router.push(firstChild.path);
                  }
                }
              }
            }}
            items={menuItems}
            style={{
              borderBottom: "none",
              flex: 1,
              maxWidth: 600,
              background: "transparent",
            }}
          />
        </div>

        {/* Right Side: User Actions */}
        <Space size={16} align="center">
          {/* Search Section */}
          <div
            ref={searchContainerRef}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showSearch ? (
              <Dropdown
                open={isDropdownOpen}
                onOpenChange={handleSearchOpenChange}
                dropdownRender={() => (
                  <div
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking inside the dropdown
                    style={{
                      width: 400,
                      backgroundColor: "white",
                      boxShadow:
                        "0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 12px 48px 16px rgba(0, 0, 0, 0.03)",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                      maxHeight: "60vh",
                      overflowY: "auto",
                    }}
                  >
                    {searchValue.trim().length > 0 ? (
                      searchResults.length > 0 ? (
                        <List
                          dataSource={searchResults}
                          renderItem={(item) => (
                            <List.Item
                              onClick={() => handleSearchNavigate(item.url)}
                              className="search-result-item"
                              style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                              }}
                            >
                              <Space>
                                <HistoryOutlined style={{ color: "#8c8c8c" }} />
                                <Text>{item.pageName}</Text>
                              </Space>
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="No results found"
                          style={{ padding: "20px 0" }}
                        />
                      )
                    ) : (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <Text type="secondary">
                          Search for modules, pages, and more.
                        </Text>
                      </div>
                    )}
                  </div>
                )}
                placement="bottomRight"
              >
                <Input
                  ref={searchInputRef}
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  style={{ width: 400, height: 36, borderRadius: 20 }}
                  prefix={<SearchOutlined style={{ color: "#aaa" }} />}
                  suffix={
                    isNavigating ? (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid #aaa",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    ) : null
                  }
                  allowClear
                />
              </Dropdown>
            ) : (
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setShowSearch(true)}
              />
            )}
          </div>

          <Button
            type="text"
            icon={<MailOutlined />}
            onClick={() => router.push("/mail")}
          />

          <Button
            type="text"
            icon={<CalendarOutlined />}
            onClick={() => router.push("/calendar")}
          />

          <Button
            type="text"
            icon={<MessageOutlined />}
            onClick={() => router.push("/chat")}
          />

          <div>
            <Inbox
              applicationIdentifier="67g_5lVLFWvd"
              subscriberId={user?.id}
              socketUrl="wss://socket.novu.co"
              appearance={{
                variables: {
                  colorPrimary: "#DD2450",
                  colorForeground: "#0E121B",
                },
              }}
            />
          </div>

          <Dropdown
            open={shortcutPopoverVisible}
            onOpenChange={(visible) => {
              // ✅ FIX: Only allow closing via onOpenChange when the delete modal
              // is NOT open. This prevents the modal's backdrop click from
              // collapsing the dropdown and resetting add/hover state.
              if (!visible && deleteModalOpen) return;
              setShortcutPopoverVisible(visible);
              if (!visible) {
                setIsAddMode(false);
                setNewShortcutName("");
                setNewShortcutPath("");
              }
            }}
            dropdownRender={() => (
              <div
                style={{
                  width: 300,
                  backgroundColor: "white",
                  boxShadow:
                    "0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 12px 48px 16px rgba(0, 0, 0, 0.03)",
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
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

                {/* Bookmark List */}
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
                            style={{ fontSize: 13, color: "#262626" }}
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

                {/* Add/Form Section */}
                <div
                  style={{
                    padding: "8px 16px",
                    borderTop: "1px solid #f0f0f0",
                    background: "#fafafa",
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
            )}
            trigger={["click"]}
          >
            <Button
              type="text"
              icon={
                shortcutPopoverVisible ? (
                  <StarFilled style={{ color: "#1677ff" }} />
                ) : (
                  <StarOutlined />
                )
              }
            />
          </Dropdown>

          <Divider type="vertical" />

          {/* User dropdown */}
          {user && (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Space
                className="user-dropdown"
                style={{
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                <Avatar
                  style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                  }}
                >
                  <Text strong style={{ fontSize: 13 }}>
                    {user.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {user.role}
                  </Text>
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
            background-color: rgba(0, 0, 0, 0.025);
          }
          .shortcut-item:hover {
            background-color: #f5f5f5;
          }
          .search-result-item:hover {
            background-color: #f5f5f5;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </Header>
    </>
  );
}
