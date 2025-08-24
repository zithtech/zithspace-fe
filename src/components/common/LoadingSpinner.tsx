import React from 'react';
import { Space, Typography } from 'antd';

const { Text } = Typography;

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium' 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f5f5f5'
    }}>
      <Space direction="vertical" align="center" size={16}>
        <div 
          style={{ 
            width: spinnerSize, 
            height: spinnerSize, 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1677ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} 
        />
        <Text type="secondary" style={{ fontSize: 14 }}>
          {message}
        </Text>
      </Space>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
