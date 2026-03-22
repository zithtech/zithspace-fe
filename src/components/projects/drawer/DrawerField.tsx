import React, { ReactNode } from 'react';
import { Typography, Row, Col, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DrawerFieldProps {
    label: string;
    children: ReactNode;
    action?: ReactNode;
    // Optional: make row clickable or show hover state
    interactive?: boolean;
    // Layout mode: default is horizontal (sidebar style), vertical is for main content areas
    layout?: 'horizontal' | 'vertical';
    // Visual variant: table style for sidebar lists
    variant?: 'default' | 'table';
}

export const DrawerField: React.FC<DrawerFieldProps> = ({
    label,
    children,
    action,
    interactive = true,
    layout = 'horizontal',
    variant = 'default'
}) => {
    const isHorizontal = layout === 'horizontal';
    const isTable = variant === 'table';

    if (isTable) {
        return (
            <div 
                className={`drawer-field table-variant ${interactive ? 'interactive' : ''}`}
                style={{
                    display: 'flex',
                    borderBottom: '1px solid #f0f0f0',
                    minHeight: 32,
                    transition: 'background-color 0.2s',
                    overflow: 'hidden'
                }}
            >
                {/* Table Label Column */}
                <div style={{
                    flex: '0 0 110px',
                    background: '#fafafa',
                    padding: '6px 10px',
                    borderRight: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start'
                }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, color: '#595959' }}>
                        {label}
                    </Text>
                </div>

                {/* Table Value Column */}
                <div style={{
                    flex: 1,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background: '#fff',
                    minWidth: 0
                }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                        {children}
                    </div>
                    {action && (
                        <div className="field-action" style={{ marginLeft: 'auto', opacity: 0, transition: 'opacity 0.2s' }}>
                            {action}
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .drawer-field.interactive:hover {
                        background-color: #f5f5f5;
                    }
                    .drawer-field:hover .field-action {
                        opacity: 1;
                    }
                    :global(.drawer-field.table-variant .ant-typography) {
                        margin-bottom: 0 !important;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div
            className={`drawer-field ${interactive ? 'interactive' : ''} ${layout}`}
            style={{
                marginBottom: 4, 
                padding: '2px 0', 
                display: 'flex',
                flexDirection: isHorizontal ? 'row' : 'column',
                alignItems: isHorizontal ? 'center' : 'flex-start',
                justifyContent: isHorizontal ? 'space-between' : 'flex-start',
                minHeight: 28, 
                borderRadius: 4,
                transition: 'background-color 0.2s',
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: isHorizontal ? 'auto' : '100%',
                flex: isHorizontal ? '0 0 100px' : 'none',
                marginRight: isHorizontal ? 8 : 0, 
                marginBottom: isHorizontal ? 0 : 4 
            }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                    {label}
                </Text>
                {action && (
                    <div className="field-action" style={{ marginLeft: 6, opacity: 0, transition: 'opacity 0.2s' }}>
                        {action}
                    </div>
                )}
            </div>

            <div className="field-value" style={{
                flex: 1,
                display: 'flex',
                justifyContent: isHorizontal ? 'flex-end' : 'flex-start',
                textAlign: isHorizontal ? 'right' : 'left',
                width: '100%',
                minWidth: 0 // Prevent overflow
            }}>
                {children}
            </div>

            <style jsx>{`
                .drawer-field.interactive:hover {
                    background-color: transparent; 
                }
                .drawer-field:hover .field-action {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};
