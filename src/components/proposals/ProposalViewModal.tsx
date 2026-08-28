'use client';

import NoData from "@/components/common/NoData";
import React from 'react';
import { 
  Modal, 
  Tabs, 
  Typography, 
  Tag, 
  Space, 
  Empty, 
  Divider,
  Descriptions,
  Table
} from 'antd';
import { 
  FileTextOutlined, 
  DollarOutlined, 
  SafetyCertificateOutlined, 
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ProposalViewModalProps {
  visible: boolean;
  onClose: () => void;
  proposal: any;
}

export const ProposalViewModal: React.FC<ProposalViewModalProps> = ({ visible, onClose, proposal }) => {
  if (!proposal) return null;

  // Attempt to parse blocks_data if it's a string (though the service usually parses it)
  let blocks = [];
  try {
    blocks = typeof proposal.blocks_data === 'string' 
      ? JSON.parse(proposal.blocks_data) 
      : proposal.blocks_data || [];
  } catch (e) {
    console.error('Failed to parse blocks data:', e);
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pricing': return <DollarOutlined />;
      case 'scope': return <FileTextOutlined />;
      case 'signature': return <SafetyCertificateOutlined />;
      case 'timeline': return <HistoryOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const renderBlockContent = (block: any) => {
    // Dynamically render based on block type
    switch (block.type) {
      case 'text':
        return <div dangerouslySetInnerHTML={{ __html: block.content }} style={{ padding: '16px', background: '#f8fafc', borderRadius: 8 }} />;
      
      case 'pricing':
        return (
          <div style={{ padding: '16px' }}>
            <Title level={5}>Budget & Line Items</Title>
            <Table 
              pagination={false}
              size="small"
              dataSource={block.items || []}
              columns={[
                { title: 'Item', dataIndex: 'name', key: 'name' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Price', dataIndex: 'price', key: 'price', render: (val: any) => `$${Number(val).toLocaleString()}` },
                { title: 'Total', key: 'total', render: (_, r: any) => `$${(Number(r.price) * Number(r.quantity)).toFixed(2)}` }
              ]} locale={{ emptyText: <NoData /> }}
            />
          </div>
        );

      case 'signature':
        return (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Signatory Name">{block.signatoryName || 'Pending'}</Descriptions.Item>
            <Descriptions.Item label="Signatory Title">{block.signatoryTitle || 'Pending'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={block.signed ? 'success' : 'warning'}>{block.signed ? 'Signed' : 'Not Signed'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        );

      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <NoData description={`Details for ${block.type} block`} />
            <pre style={{ textAlign: 'left', background: '#eee', padding: 10 }}>
              {JSON.stringify(block.data || block, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const tabItems = blocks.map((block: any, index: number) => ({
    key: String(index),
    label: (
      <span>
        {getIconForType(block.type)}
        {block.title || block.type.charAt(0).toUpperCase() + block.type.slice(1)}
      </span>
    ),
    children: (
      <div style={{ minHeight: 300, paddingTop: 16 }}>
        <Title level={4} style={{ marginBottom: 24 }}>{block.title || `Section ${index + 1}`}</Title>
        {renderBlockContent(block)}
      </div>
    )
  }));

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Proposal View: {proposal.title}</Title>
          <Text type="secondary">ID: {proposal.id} • Created {dayjs(proposal.created_at).format('MMM D, YYYY')}</Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { padding: '0 24px 24px 24px' } }}
    >
      <Divider style={{ marginTop: 12 }} />
      
      <div style={{ marginBottom: 20 }}>
        <Space size="large">
          <Space>
            <UserOutlined style={{ color: '#94a3b8' }} />
            <Text strong>Client:</Text>
            <Text>{proposal.client_name || 'N/A'}</Text>
          </Space>
          <Space>
            <Text strong>Status:</Text>
            <Tag color={proposal.status === 'accepted' ? 'success' : 'processing'}>
              {proposal.status?.toUpperCase() || 'DRAFT'}
            </Tag>
          </Space>
        </Space>
      </div>

      {blocks.length > 0 ? (
        <Tabs 
          defaultActiveKey="0" 
          items={tabItems} 
          type="card" 
          className="premium-tabs"
        />
      ) : (
        <NoData description="No details found in this proposal." />
      )}
    </Modal>
  );
};
