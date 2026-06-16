
import { Layout, Menu, Button } from 'antd';
import { NavItem, ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
import { usePathname, useRouter } from 'next/navigation';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const { Sider } = Layout;

interface SideNavProps {
    activeModule: ModuleType;
    collapsed: boolean;
    onCollapse: () => void;
}

export default function SideNav({ activeModule, collapsed, onCollapse }: SideNavProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const { hasPermission, hasAnyPermission, planAllows } = useAuth();

    const currentModuleConfig = NAVIGATION_CONFIG.find(m => m.key === activeModule);
    const items = currentModuleConfig?.items || [];

    // Filter nav items recursively based on requiredPermission / requiredAnyPermission
    const filterItemsByPermission = (navItems: NavItem[]): NavItem[] => {
        return navItems
            .filter(item => {
                // No permission requirement = always visible
                if (!item.requiredPermission && !item.requiredAnyPermission) return true;

                // Visible only if RBAC permits AND the tenant's plan includes it (intersection).
                if (item.requiredPermission) {
                    return hasPermission(item.requiredPermission) && planAllows(item.requiredPermission);
                }

                // Any-of: at least one permission must be both RBAC-permitted and plan-allowed.
                if (item.requiredAnyPermission) {
                    return item.requiredAnyPermission.some((p) => hasPermission(p) && planAllows(p));
                }

                return false;
            })
            .map(item => {
                // Recursively filter children
                if (item.children) {
                    return {
                        ...item,
                        children: filterItemsByPermission(item.children)
                    };
                }
                return item;
            })
            .filter(item => {
                // Remove parent items with no visible children
                if (item.children) {
                    return item.children.length > 0;
                }
                return true;
            });
    };

    const filteredItems = filterItemsByPermission(items);

    // Helper to map Items to Antd Menu format
    const mapItemsToMenu = (navItems: any[]) => {
        return navItems.map(item => {
            const menuItem: any = {
                key: item.key,
                icon: item.icon,
                label: item.label,
                disabled: item.disabled,
            };

            if (item.children) {
                const mappedChildren = mapItemsToMenu(item.children);
                // When collapsed, the children render in a hover flyout — give it a
                // titled header (the parent's name) for a premium SaaS feel.
                // When expanded, keep the plain inline submenu (no redundant header).
                menuItem.children = collapsed
                    ? [{ key: `${item.key}__group`, type: 'group', label: item.label, children: mappedChildren }]
                    : mappedChildren;
                // Premium flyout: scope the collapsed submenu popup for styling
                menuItem.popupClassName = 'sidebar-flyout-popup';
            } else if (item.path) {
                menuItem.onClick = () => router.push(item.path);
            }

            return menuItem;
        });
    };

    const menuItems = mapItemsToMenu(filteredItems);

    // Find all parent keys of the current path
    const findParentKeys = (items: any[], currentPath: string): string[] => {
        for (const item of items) {
            if (item.path && currentPath.startsWith(item.path)) {
                return []; // Target found, no parent key at this level
            }
            if (item.children) {
                const childKeys = findParentKeys(item.children, currentPath);
                if (childKeys !== null) {
                    return [item.key, ...childKeys];
                }
            }
        }
        return null as any;
    };

    // Handle open keys change (for submenu expansion)
    const handleOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

    const getSelectedKey = () => {
        const findExactKey = (items: any[]): string | undefined => {
            for (const item of items) {
                if (item.path && pathname === item.path) return item.key;
                if (item.children) {
                    const childKey = findExactKey(item.children);
                    if (childKey) return childKey;
                }
            }
            return undefined;
        };

        const findStartsWithKey = (items: any[]): string | undefined => {
            let bestMatch: string | undefined;
            let maxLen = 0;
            const search = (nodes: any[]) => {
                for (const item of nodes) {
                    if (item.path && pathname.startsWith(item.path) && item.path.length > maxLen) {
                        bestMatch = item.key;
                        maxLen = item.path.length;
                    }
                    if (item.children) search(item.children);
                }
            };
            search(items);
            return bestMatch;
        };

        const selectedKey = findExactKey(filteredItems) || findStartsWithKey(filteredItems);
        return selectedKey ? [selectedKey] : [pathname];
    };

    // Update openKeys when pathname changes or collapsed state changes
    useEffect(() => {
        if (!collapsed) {
            const keys = findParentKeys(filteredItems, pathname);
            if (keys && keys.length > 0) {
                setOpenKeys((prev) => {
                    const newKeys = [...prev];
                    let changed = false;
                    keys.forEach(k => {
                        if (!newKeys.includes(k)) {
                            newKeys.push(k);
                            changed = true;
                        }
                    });
                    return changed ? newKeys : prev;
                });
            }
        } else {
            setOpenKeys([]); // Close all submenus when collapsed
        }
    }, [pathname, collapsed, activeModule]);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={200}
            collapsedWidth={52}
            theme={theme as "light" | "dark"}
            className="glass-panel sidebar-sider"
            style={{
                background: "transparent",
                borderRight: "1px solid var(--border-color) !important",
                position: "fixed",
                left: 0,
                top: 54,
                bottom: 0,
                height: "calc(100vh - 54px)",
                zIndex: 99,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Collapse Toggle Button at Top */}
            <div style={{
                padding: '8px 8px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-end',
                flexShrink: 0,
            }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={onCollapse}
                    style={{
                        fontSize: 16,
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
            </div>

            {/* Scroll container with custom scrollbar */}
            <div className="sidebar-scroll-container">
                <Menu
                    mode="inline"
                    inlineIndent={14}
                    inlineCollapsed={collapsed} // This controls icon-only mode
                    selectedKeys={getSelectedKey()}
                    openKeys={openKeys}
                    onOpenChange={handleOpenChange}
                    style={{
                        borderRight: 'none',
                        background: 'transparent',
                    }}
                    items={menuItems}
                    theme={theme as "light" | "dark"}
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                /* Scoped Sidebar Menu Overrides */
                .sidebar-sider .ant-menu-item,
                .sidebar-sider .ant-menu-submenu-title {
                    width: calc(100% - 20px) !important;
                    margin-inline: auto !important;
                    margin-block: 2px !important;
                    border-radius: 10px !important;
                    height: 38px !important;
                    line-height: 38px !important;
                }

                /* Center icons when collapsed */
                .sidebar-sider.ant-layout-sider-collapsed .ant-menu-item,
                .sidebar-sider.ant-layout-sider-collapsed .ant-menu-submenu-title {
                    width: 40px !important;
                    margin-inline: auto !important;
                    padding-inline: 0 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                }

                /* Ensure icons themselves are visible and centered */
                .sidebar-sider.ant-layout-sider-collapsed .ant-menu-item .anticon,
                .sidebar-sider.ant-layout-sider-collapsed .ant-menu-submenu-title .anticon {
                    margin: 0 !important;
                    font-size: 17px !important;
                    display: inline-flex !important;
                }

                /* Lucide icon defaults — premium, consistent sizing */
                .sidebar-sider .nav-lucide-icon {
                    width: 15px;
                    height: 15px;
                    vertical-align: -0.125em;
                    flex-shrink: 0;
                }
                .sidebar-sider.ant-layout-sider-collapsed .nav-lucide-icon {
                    width: 16px !important;
                    height: 16px !important;
                    margin: 0 !important;
                }

                /* HIDE the text labels specifically when collapsed */
                .sidebar-sider.ant-layout-sider-collapsed .ant-menu-title-content {
                    display: none !important;
                }

                /* ===== Premium active / hover treatment ===== */
                /* Remove Ant's default animated right border indicator */
                .sidebar-sider .ant-menu-item::after,
                .sidebar-sider .ant-menu-submenu-title::after {
                    display: none !important;
                }

                /* Hover — subtle accent wash */
                .sidebar-sider .ant-menu-item:not(.ant-menu-item-selected):hover,
                .sidebar-sider .ant-menu-submenu-title:hover {
                    background: color-mix(in srgb, var(--premium-blue) 8%, transparent) !important;
                    color: var(--premium-blue) !important;
                }

                /* Selected — accent-tinted pill with bold text + accent icon */
                .sidebar-sider .ant-menu-item-selected {
                    position: relative;
                    background: color-mix(in srgb, var(--premium-blue) 14%, transparent) !important;
                    color: var(--premium-blue) !important;
                    font-weight: 600 !important;
                    box-shadow: 0 2px 8px -3px color-mix(in srgb, var(--premium-blue) 50%, transparent);
                }
                .sidebar-sider .ant-menu-item-selected .anticon,
                .sidebar-sider .ant-menu-item-selected .nav-lucide-icon,
                .sidebar-sider .ant-menu-item-selected svg {
                    color: var(--premium-blue) !important;
                }

                /* Left accent indicator bar */
                .sidebar-sider .ant-menu-item-selected::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 11px;
                    bottom: 11px;
                    width: 3px;
                    border-radius: 0 3px 3px 0;
                    background: linear-gradient(180deg, #3B82F6 0%, #6366F1 100%);
                }

                /* Dark theme accent tints */
                [data-theme='dark'] .sidebar-sider .ant-menu-item-selected {
                    background: color-mix(in srgb, var(--premium-blue) 22%, transparent) !important;
                    color: #93C5FD !important;
                }
                [data-theme='dark'] .sidebar-sider .ant-menu-item-selected .anticon,
                [data-theme='dark'] .sidebar-sider .ant-menu-item-selected .nav-lucide-icon,
                [data-theme='dark'] .sidebar-sider .ant-menu-item-selected svg {
                    color: #93C5FD !important;
                }
                [data-theme='dark'] .sidebar-sider .ant-menu-item:not(.ant-menu-item-selected):hover,
                [data-theme='dark'] .sidebar-sider .ant-menu-submenu-title:hover {
                    background: rgba(59, 130, 246, 0.14) !important;
                    color: #E2E8F0 !important;
                }
            `}} />
        </Sider>
    );
}










