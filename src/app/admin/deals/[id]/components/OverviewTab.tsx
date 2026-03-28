'use client';

import React from 'react';
import { Card, Descriptions, Tag, Typography, Space } from 'antd';
import { Deal } from '@/services/dealService';
import { MailOutlined, PhoneOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface OverviewTabProps {
  deal: Deal;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ deal }) => {
  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(5px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card 
          title={<Space><UserOutlined style={{ color: '#1890ff' }} /> Client Information</Space>} 
          variant="borderless" 
          style={glassStyle}
        >
          <Descriptions column={1} labelStyle={{ color: '#8c8c8c' }} contentStyle={{ fontWeight: 500 }}>
            <Descriptions.Item label="Client Name">{deal.clientName}</Descriptions.Item>
            <Descriptions.Item label="Company">{deal.companyName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Email">
              {deal.email ? (
                <Space>
                  <MailOutlined style={{ color: '#8c8c8c' }} />
                  <a href={`mailto:${deal.email}`}>{deal.email}</a>
                </Space>
              ) : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {deal.phone ? (
                <Space>
                  <PhoneOutlined style={{ color: '#8c8c8c' }} />
                  {deal.phone}
                </Space>
              ) : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card 
          title={<Space><BankOutlined style={{ color: '#1890ff' }} /> Deal Information</Space>} 
          variant="borderless" 
          style={glassStyle}
        >
          <Descriptions column={1} labelStyle={{ color: '#8c8c8c' }} contentStyle={{ fontWeight: 500 }}>
            <Descriptions.Item label="Estimated Value">
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {deal.currency} {deal.estimatedValue?.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Win Probability">
              <Tag 
                color={deal.probability && deal.probability > 70 ? 'green' : (deal.probability && deal.probability > 30 ? 'blue' : 'orange')}
                style={{ borderRadius: '10px', border: 'none' }}
              >
                {deal.probability}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Expected Closing">
              <Text strong>{deal.expectedClosingDate ? dayjs(deal.expectedClosingDate).format('MMM DD, YYYY') : 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Source">
              <Tag style={{ borderRadius: '10px' }}>{deal.source || 'Direct'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <Card 
        title="Internal Notes" 
        variant="borderless" 
        style={{ ...glassStyle, marginTop: '24px' }}
      >
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.02)', 
          padding: '16px', 
          borderRadius: '8px', 
          borderLeft: '4px solid #1890ff',
          minHeight: '80px'
        }}>
          <Typography.Paragraph style={{ margin: 0, fontSize: '14px', fontStyle: deal.notes ? 'normal' : 'italic', color: deal.notes ? 'inherit' : '#8c8c8c' }}>
            {deal.notes || 'No internal notes have been added to this deal yet.'}
          </Typography.Paragraph>
        </div>
      </Card>

      {deal.tags && deal.tags.length > 0 && (
        <div style={{ marginTop: '24px', paddingLeft: '8px' }}>
          <Title level={5} style={{ marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8c8c8c' }}>Tags</Title>
          <Space wrap>
            {deal.tags.map(tag => (
              <Tag key={tag} color="blue" style={{ borderRadius: '12px', padding: '2px 12px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
