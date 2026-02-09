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
}

export const DrawerField: React.FC<DrawerFieldProps> = ({
    label,
    children,
    action,
    interactive = true,
    layout = 'horizontal'
}) => {
    const isHorizontal = layout === 'horizontal';

    return (
        <div
            className={`drawer-field ${interactive ? 'interactive' : ''} ${layout}`}
            style={{
                marginBottom: 8, // Reduced from 16
                padding: '4px 0', // Minimal padding
                display: 'flex',
                flexDirection: isHorizontal ? 'row' : 'column',
                alignItems: isHorizontal ? 'center' : 'flex-start',
                justifyContent: isHorizontal ? 'space-between' : 'flex-start',
                minHeight: 32,
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
                marginRight: isHorizontal ? 12 : 0,
                marginBottom: isHorizontal ? 0 : 8
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
                    background-color: transparent; // Remove bg hover for cleaner look, or keep subtle
                }
                .drawer-field:hover .field-action {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};
