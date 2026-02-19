import { Layout, Menu, Button } from 'antd';
import { ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
import { usePathname, useRouter } from 'next/navigation';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

const { Sider } = Layout;

interface SideNavProps {
    activeModule: ModuleType;
    collapsed: boolean;
    onCollapse: () => void;
}

export default function SideNav({ activeModule, collapsed, onCollapse }: SideNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const currentModuleConfig = NAVIGATION_CONFIG.find(m => m.key === activeModule);
    const items = currentModuleConfig?.items || [];

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

    const menuItems = mapItemsToMenu(items);

    // Determine open keys based on pathname (auto-expand submenu)
    const getOpenKeys = () => {
        if (collapsed) return [];
        // Find the parent group key if the current path is inside a submenu
        const foundGroup = items.find(item =>
            item.children?.some((child: any) => child.path === pathname)
        );
        return foundGroup ? [foundGroup.key] : [];
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            theme="light"
            style={{
                background: "#fff",
                borderRight: "1px solid #f0f0f0",
                position: "fixed",
                left: 0,
                top: 64, // Below TopNav
                bottom: 0,
                height: "calc(100vh - 64px)",
                zIndex: 99,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Collapse Toggle Button at Top */}
            <div style={{
                padding: '8px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-end',
            }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={onCollapse}
                    style={{
                        fontSize: 16,
                        width: 32,
                        height: 32,
                    }}
                />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Menu
                    mode="inline"
                    selectedKeys={[pathname]}
                    defaultOpenKeys={getOpenKeys()}
                    style={{ borderRight: 'none' }}
                    items={menuItems}
                />
            </div>


        </Sider>
    );
}
