
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






// import { Layout, Menu, Button } from 'antd';
// import { ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
// import { usePathname, useRouter } from 'next/navigation';
// import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
// import { useEffect, useState } from 'react';

// const { Sider } = Layout;

// interface SideNavProps {
//     activeModule: ModuleType;
//     collapsed: boolean;
//     onCollapse: () => void;
// }

// export default function SideNav({ activeModule, collapsed, onCollapse }: SideNavProps) {
//     const router = useRouter();
//     const pathname = usePathname();
//     const [openKeys, setOpenKeys] = useState<string[]>([]);

//     const currentModuleConfig = NAVIGATION_CONFIG.find(m => m.key === activeModule);
//     const items = currentModuleConfig?.items || [];

//     // Helper to map Items to Antd Menu format
//     const mapItemsToMenu = (navItems: any[], isParent: boolean = false) => {
//         return navItems.map(item => {
//             const menuItem: any = {
//                 key: item.key,
//                 disabled: item.disabled,
//             };

//             // For parent items when collapsed
//             if (isParent && collapsed) {
//                 menuItem.label = (
//                     <div style={{ 
//                         display: 'flex', 
//                         flexDirection: 'column', 
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         gap: '4px'
//                     }}>
//                         <span style={{ fontSize: '20px' }}>{item.icon}</span>
//                         <span style={{ fontSize: '10px', lineHeight: '1.2' }}>{item.label}</span>
//                     </div>
//                 );
//                 // Don't set icon property for parent items when collapsed
//                 // (we're rendering it in label)
//             } else {
//                 menuItem.label = item.label;
//                 menuItem.icon = item.icon; // Set icon for all other cases
//             }

//             if (item.children) {
//                 // For children, pass isParent = false
//                 menuItem.children = mapItemsToMenu(item.children, false);
//             } else if (item.path) {
//                 menuItem.onClick = () => router.push(item.path);
//             }

//             return menuItem;
//         });
//     };

//     // Pass true for root level items (parents)
//     const menuItems = mapItemsToMenu(items, true);

//     // Find the key of the parent that contains the current path
//     const findParentKey = () => {
//         for (const item of items) {
//             if (item.children) {
//                 const found = item.children.find((child: any) => child.path === pathname);
//                 if (found) return item.key;
//             }
//         }
//         return undefined;
//     };

//     // Handle open keys change (for submenu expansion)
//     const handleOpenChange = (keys: string[]) => {
//         setOpenKeys(keys);
//     };

//     // Get selected key based on current pathname
//     const getSelectedKey = () => {
//         // Find if current pathname matches any menu item
//         const findKey = (items: any[]): string | undefined => {
//             for (const item of items) {
//                 if (item.path === pathname) {
//                     return item.key;
//                 }
//                 if (item.children) {
//                     const childKey = findKey(item.children);
//                     if (childKey) return childKey;
//                 }
//             }
//             return undefined;
//         };
        
//         const selectedKey = findKey(items);
//         return selectedKey ? [selectedKey] : [pathname];
//     };

//     // Update openKeys when pathname changes or collapsed state changes
//     useEffect(() => {
//         if (!collapsed) {
//             const parentKey = findParentKey();
//             if (parentKey) {
//                 setOpenKeys([parentKey]);
//             }
//         } else {
//             setOpenKeys([]); // Close all submenus when collapsed
//         }
//     }, [pathname, collapsed]);

//     return (
//         <Sider
//             trigger={null}
//             collapsible
//             collapsed={collapsed}
//             width={240}
//             collapsedWidth={80} // Icons only mode width
//             theme="light"
//             style={{
//                 background: "#fff",
//                 borderRight: "1px solid #f0f0f0",
//                 position: "fixed",
//                 left: 0,
//                 top: 64,
//                 bottom: 0,
//                 height: "calc(100vh - 64px)",
//                 zIndex: 99,
//                 overflow: 'hidden',
//                 display: 'flex',
//                 flexDirection: 'column'
//             }}
//         >
//             {/* Collapse Toggle Button at Top */}
//             <div style={{
//                 padding: '12px 8px',
//                 borderBottom: '1px solid #f0f0f0',
//                 display: 'flex',
//                 justifyContent: collapsed ? 'center' : 'flex-end',
//             }}>
//                 <Button
//                     type="text"
//                     icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//                     onClick={onCollapse}
//                     style={{
//                         fontSize: 18,
//                         width: 32,
//                         height: 32,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                     }}
//                 />
//             </div>
            
//             {/* Scroll container with custom scrollbar */}
//             <div className="sidebar-scroll-container">
//                 <Menu
//                     mode="inline"
//                     inlineCollapsed={collapsed} // This controls icon-only mode
//                     selectedKeys={getSelectedKey()}
//                     openKeys={openKeys}
//                     onOpenChange={handleOpenChange}
//                     style={{ 
//                         borderRight: 'none',
//                         background: 'transparent',
//                     }}
//                     items={menuItems}
//                     theme="light"
//                 />
//             </div>

//             {/* Add custom CSS for collapsed parent items */}
//             <style jsx global>{`
//                 /* Parent items when collapsed - icon above text */
//                 .ant-layout-sider-collapsed .ant-menu-submenu-title {
//                     height: auto !important;
//                     padding: 8px 0 !important;
//                     margin: 4px 0 !important;
//                     line-height: 1.2 !important;
//                     display: flex !important;
//                     flex-direction: column !important;
//                     align-items: center !important;
//                 }
                
//                 /* Child items should remain normal with icon */
//                 .ant-layout-sider-collapsed .ant-menu-item {
//                     height: 40px !important;
//                     padding: 0 16px !important;
//                     margin: 0 !important;
//                     line-height: 40px !important;
//                     display: flex !important;
//                     align-items: center !important;
//                 }
                
//                 /* Ensure child item icons are visible */
//                 .ant-layout-sider-collapsed .ant-menu-item .anticon {
//                     margin-right: 10px !important;
//                     font-size: 16px !important;
//                     display: inline-block !important;
//                 }
                
               
//             `}</style>
//         </Sider>
//     );
// }

// import { Layout, Menu, Button } from 'antd';
// import { ModuleType, NAVIGATION_CONFIG } from './navigationConfig';
// import { usePathname, useRouter } from 'next/navigation';
// import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
// import { useEffect, useState } from 'react';

// const { Sider } = Layout;

// interface SideNavProps {
//     activeModule: ModuleType;
//     collapsed: boolean;
//     onCollapse: () => void;
// }

// export default function SideNav({ activeModule, collapsed, onCollapse }: SideNavProps) {
//     const router = useRouter();
//     const pathname = usePathname();
//     const [openKeys, setOpenKeys] = useState<string[]>([]);

//     const currentModuleConfig = NAVIGATION_CONFIG.find(m => m.key === activeModule);
//     const items = currentModuleConfig?.items || [];

//     // Helper to map Items to Antd Menu format
//     const mapItemsToMenu = (navItems: any[], isParent: boolean = false) => {
//         return navItems.map(item => {
//             const menuItem: any = {
//                 key: item.key,
//                 disabled: item.disabled,
//             };

//             // For parent items when collapsed
//             if (isParent && collapsed) {
//                 menuItem.label = (
//                     <div style={{ 
//                         display: 'flex', 
//                         flexDirection: 'column', 
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         gap: '4px'
//                     }}>
//                         <span style={{ fontSize: '20px' }}>{item.icon}</span>
//                         <span style={{ fontSize: '10px', lineHeight: '1.2' }}>{item.label}</span>
//                     </div>
//                 );
//                 // Don't set icon property for parent items when collapsed
//                 // (we're rendering it in label)
//             } else {
//                 menuItem.label = item.label;
//                 menuItem.icon = item.icon; // Set icon for all other cases
//             }

//             if (item.children) {
//                 // For children, pass isParent = false
//                 menuItem.children = mapItemsToMenu(item.children, false);
//             } else if (item.path) {
//                 menuItem.onClick = () => router.push(item.path);
//             }

//             return menuItem;
//         });
//     };

//     // Pass true for root level items (parents)
//     const menuItems = mapItemsToMenu(items, true);

//     // Find the key of the parent that contains the current path
//     const findParentKey = () => {
//         for (const item of items) {
//             if (item.children) {
//                 const found = item.children.find((child: any) => child.path === pathname);
//                 if (found) return item.key;
//             }
//         }
//         return undefined;
//     };

//     // Handle open keys change (for submenu expansion)
//     const handleOpenChange = (keys: string[]) => {
//         setOpenKeys(keys);
//     };

//     // Get selected key based on current pathname
//     const getSelectedKey = () => {
//         // Find if current pathname matches any menu item
//         const findKey = (items: any[]): string | undefined => {
//             for (const item of items) {
//                 if (item.path === pathname) {
//                     return item.key;
//                 }
//                 if (item.children) {
//                     const childKey = findKey(item.children);
//                     if (childKey) return childKey;
//                 }
//             }
//             return undefined;
//         };
        
//         const selectedKey = findKey(items);
//         return selectedKey ? [selectedKey] : [pathname];
//     };

//     // Update openKeys when pathname changes or collapsed state changes
//     useEffect(() => {
//         if (!collapsed) {
//             const parentKey = findParentKey();
//             if (parentKey) {
//                 setOpenKeys([parentKey]);
//             }
//         } else {
//             setOpenKeys([]); // Close all submenus when collapsed
//         }
//     }, [pathname, collapsed]);

//     return (
//         <Sider
//             trigger={null}
//             collapsible
//             collapsed={collapsed}
//             width={240}
//             collapsedWidth={80} // Icons only mode width
//             theme="light"
//             style={{
//                 background: "#fff",
//                 borderRight: "1px solid #f0f0f0",
//                 position: "fixed",
//                 left: 0,
//                 top: 64,
//                 bottom: 0,
//                 height: "calc(100vh - 64px)",
//                 zIndex: 99,
//                 overflow: 'hidden',
//                 display: 'flex',
//                 flexDirection: 'column'
//             }}
//         >
//             {/* Collapse Toggle Button at Top */}
//             <div style={{
//                 padding: '12px 8px',
//                 borderBottom: '1px solid #f0f0f0',
//                 display: 'flex',
//                 justifyContent: collapsed ? 'center' : 'flex-end',
//             }}>
//                 <Button
//                     type="text"
//                     icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//                     onClick={onCollapse}
//                     style={{
//                         fontSize: 18,
//                         width: 32,
//                         height: 32,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                     }}
//                 />
//             </div>
            
//             {/* Scroll container with custom scrollbar */}
//             <div className="sidebar-scroll-container">
//                 <Menu
//                     mode="inline"
//                     inlineCollapsed={collapsed} // This controls icon-only mode
//                     selectedKeys={getSelectedKey()}
//                     openKeys={openKeys}
//                     onOpenChange={handleOpenChange}
//                     style={{ 
//                         borderRight: 'none',
//                         background: 'transparent',
//                     }}
//                     items={menuItems}
//                     theme="light"
//                 />
//             </div>

//             {/* FIXED CSS - All items get proper styling */}
//           {/* FIXED CSS - Reduced spacing between icon and text */}
// <style jsx global>{`
//     /* Parent items when collapsed - icon above text with reduced gap */
//     .ant-layout-sider-collapsed .ant-menu-submenu-title {
//         height: auto !important;
//         padding: 4px 0 !important; /* Reduced from 8px */
//         margin: 2px 0 !important;  /* Reduced from 4px */
//         line-height: 1!important;
//         display: flex !important;
//         flex-direction: column !important;
//         align-items: center !important;
//         gap: 1px !important; /* Add explicit gap control */
//     }
    
//     /* FIX: Single items (without children) should also show icon+text with reduced gap */
//     .ant-layout-sider-collapsed .ant-menu-item {
//         height: auto !important;
//         padding: 4px 0 !important; /* Reduced from 8px */
//         margin: 2px 0 !important;  /* Reduced from 4px */
//         line-height: 1!important;
//         display: flex !important;
//         flex-direction: column !important;
//         align-items: center !important;
//         gap: 1px !important; /* Add explicit gap control */
//     }
//       /* Hover effect for collapsed mode with equal spacing */
//     .ant-layout-sider-collapsed .ant-menu-submenu-title:hover,
//     .ant-layout-sider-collapsed .ant-menu-item:hover {
//         background-color: rgba(0, 0, 0, 0.04) !important; /* Light grey hover */
//         border-radius: 6px !important; /* Optional: rounded corners */
//     }


    
   
    
//     /* Icon size adjustment */
//     .ant-layout-sider-collapsed .ant-menu-submenu-title span[style*="fontSize: '20px'"],
//     .ant-layout-sider-collapsed .ant-menu-item span[style*="fontSize: '20px'"] {
//         font-size: 18px !important; /* Slightly smaller icon */
//         line-height: 1 !important;
//          margin-bottom: -2px !important; /* Pull text up */
//     }
    
//     /* Text label adjustment */
//     .ant-layout-sider-collapsed .ant-menu-submenu-title span[style*="fontSize: '10px'"],
//     .ant-layout-sider-collapsed .ant-menu-item span[style*="fontSize: '10px'"] {
//         font-size: 9px !important; /* Slightly smaller text */
//         line-height: 1 !important;
//          margin-bottom: -2px !important; /* Pull text up */
//     }
//         /* Target the container div specifically */
//     .ant-layout-sider-collapsed .ant-menu-submenu-title > div,
//     .ant-layout-sider-collapsed .ant-menu-item > div {
//         gap: 0px !important;
//         margin: 0 !important;
//         padding: 0 !important;
//     }
    
//     /* Remove any extra spacing from Ant Design defaults */
//     .ant-layout-sider-collapsed .ant-menu-item .anticon,
//     .ant-layout-sider-collapsed .ant-menu-submenu-title .anticon {
//         margin: 0 !important;
//         line-height: 1 !important;
//     }

//     /* Submenu popup items (child items) should remain normal */
//     .ant-menu-submenu-popup .ant-menu-item {
//         height: 36px !important; /* Slightly reduced from 40px */
//         padding: 0 12px !important;
//         line-height: 36px !important;
//         display: flex !important;
//         align-items: center !important;
//         flex-direction: row !important;
//     }
    
//     .ant-menu-submenu-popup .ant-menu-item .anticon {
//         margin-right: 8px !important;
//         font-size: 14px !important;
//         display: inline-block !important;
//     }
// `}</style>










//         </Sider>
//     );
// }




