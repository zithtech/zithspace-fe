
import { Layout, Menu, Button } from 'antd';
import { NavItem, ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
import { usePathname, useRouter } from 'next/navigation';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const { Sider } = Layout;

interface SideNavProps {
    activeModule: ModuleType;
    collapsed: boolean;
    onCollapse: () => void;
}

export default function SideNav({ activeModule, collapsed, onCollapse }: SideNavProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const { hasPermission, hasAnyPermission } = useAuth();

    const currentModuleConfig = NAVIGATION_CONFIG.find(m => m.key === activeModule);
    const items = currentModuleConfig?.items || [];

    // Filter nav items recursively based on requiredPermission / requiredAnyPermission
    const filterItemsByPermission = (navItems: NavItem[]): NavItem[] => {
        return navItems
            .filter(item => {
                // No permission requirement = always visible
                if (!item.requiredPermission && !item.requiredAnyPermission) return true;
                
                // Check single permission
                if (item.requiredPermission) {
                    return hasPermission(item.requiredPermission);
                }
                
                // Check any of multiple permissions
                if (item.requiredAnyPermission) {
                    return hasAnyPermission(...item.requiredAnyPermission);
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
                menuItem.children = mapItemsToMenu(item.children);
            } else if (item.path) {
                menuItem.onClick = () => router.push(item.path);
            }

            return menuItem;
        });
    };

    const menuItems = mapItemsToMenu(filteredItems);

    // Find the key of the parent that contains the current path
    const findParentKey = () => {
        for (const item of filteredItems) {
            if (item.children) {
                const found = item.children.find((child: any) => child.path === pathname);
                if (found) return item.key;
            }
        }
        return undefined;
    };

    // Handle open keys change (for submenu expansion)
    const handleOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

    // Get selected key based on current pathname
    const getSelectedKey = () => {
        // Find if current pathname matches any menu item
        const findKey = (items: any[]): string | undefined => {
            for (const item of items) {
                if (item.path === pathname) {
                    return item.key;
                }
                if (item.children) {
                    const childKey = findKey(item.children);
                    if (childKey) return childKey;
                }
            }
            return undefined;
        };
        
        const selectedKey = findKey(filteredItems);
        return selectedKey ? [selectedKey] : [pathname];
    };

    // Update openKeys when pathname changes or collapsed state changes
    useEffect(() => {
        if (!collapsed) {
            const parentKey = findParentKey();
            if (parentKey) {
                setOpenKeys([parentKey]);
            }
        } else {
            setOpenKeys([]); // Close all submenus when collapsed
        }
    }, [pathname, collapsed]);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            collapsedWidth={65} // Icons only mode width
            theme="light"
            style={{
                background: "#fff",
                borderRight: "1px solid #f0f0f0",
                position: "fixed",
                left: 0,
                top: 64,
                bottom: 0,
                height: "calc(100vh - 64px)",
                zIndex: 99,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Collapse Toggle Button at Top */}
            <div style={{
                padding: '12px 8px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-end',
            }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={onCollapse}
                    style={{
                        fontSize: 18,
                        width: 32,
                        height: 32,
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
                    inlineCollapsed={collapsed} // This controls icon-only mode
                    selectedKeys={getSelectedKey()}
                    openKeys={openKeys}
                    onOpenChange={handleOpenChange}
                    style={{ 
                        borderRight: 'none',
                        background: 'transparent',
                    }}
                    items={menuItems}
                    theme="light"
                />
            </div>
        </Sider>
    );
}