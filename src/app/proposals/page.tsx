'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Card,
  message,
  Empty,
  theme,
  Dropdown,
  Modal,
  Tooltip,
  Breadcrumb,
  Popconfirm,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SnippetsOutlined,
  EyeOutlined,
  FileWordOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ProposalsListPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const router = useRouter();
  const { token } = theme.useToken();
  const [modal, contextHolder] = Modal.useModal();

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await ProposalService.getProposals();
      console.log('📊 [PROPOSAL API RESPONSE]:', data);

      if (Array.isArray(data)) {
        setProposals(data);
      } else if (data && Array.isArray(data.data)) {
        setProposals(data.data);
      } else {
        setProposals([]);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err.status !== 401) {
        message.error('Failed to load proposals');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await ProposalService.deleteProposal(id);
      message.success('Proposal deleted');
      fetchProposals();
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Failed to delete proposal');
    }
  };


  const getStatusTag = (status: string) => {
    const s = status?.toLowerCase();
    const tagStyles = {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    };

    switch (s) {
      case 'sent':
        return <Tag icon={<ClockCircleOutlined />} style={{ ...tagStyles, background: `${token.colorInfo}15`, color: token.colorInfo }}>Sent</Tag>;
      case 'accepted':
        return <Tag icon={<CheckCircleOutlined />} style={{ ...tagStyles, background: `${token.colorSuccess}15`, color: token.colorSuccess }}>Accepted</Tag>;
      case 'draft':
        return <Tag style={{ ...tagStyles, background: token.colorFillTertiary, color: token.colorTextDescription }}>Draft</Tag>;
      case 'declined':
        return <Tag style={{ ...tagStyles, background: `${token.colorError}15`, color: token.colorError }}>Declined</Tag>;
      default:
        return <Tag style={{ ...tagStyles, background: token.colorFillQuaternary, color: token.colorTextTertiary }}>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'PROPOSAL NAME',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => {
        let displayTitle = text;
        if (!text || text === 'Updated Proposal') {
          try {
            const blocks = typeof record.blocks_data === 'string'
              ? JSON.parse(record.blocks_data)
              : (record.blocks_data || []);
            const coverData = blocks.find((b: any) => b.type === 'cover')?.data;
            if (coverData?.title) displayTitle = coverData.title;
          } catch (e) { }
        }

        return (
          <Space size="middle">
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: token.colorFillTertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: token.colorPrimary,
              fontSize: 18
            }}>
              <SnippetsOutlined />
            </div>
            <div>
              <Text strong style={{ display: 'block', fontSize: 15 }}>{displayTitle || 'Untitled Proposal'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Created {dayjs(record.created_at).format('MMM D, YYYY')}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'CLIENT',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text: string) => <Text style={{ fontWeight: 500 }}>{text || '—'}</Text>
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'LAST UPDATED',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => dayjs(date).format('MMM D, h:mm A')
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => router.push(`/proposals/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => router.push(`/proposals/builder?id=${record.id}`)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'pdf',
                  label: 'Export PDF',
                  icon: <FilePdfOutlined />,
                },
                {
                  key: 'word',
                  label: 'Export Word',
                  icon: <FileWordOutlined />,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'pdf') handleExport(record.id, 'pdf');
                else if (key === 'word') handleExport(record.id, 'word');
              }
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<DownloadOutlined style={{ color: token.colorPrimary }} />} />
          </Dropdown>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Proposal"
              description="Are you sure you want to delete this proposal?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const [messageApi, messageHolder] = message.useMessage();
  const [downloadingProposal, setDownloadingProposal] = useState<any>(null);

  const handleExport = async (id: string, format: 'pdf' | 'word') => {
    const key = 'exporting';
    try {
      messageApi.open({ key, type: 'loading', content: `Downloading ${format.toUpperCase()}...`, duration: 0 });

      const response = await ProposalService.requestProposalExport(id);
      const resData = response?.data?.data || response?.data || response;
      const { pdfUrl, docxUrl } = resData || {};

      const fileUrl = format === 'pdf' ? pdfUrl : docxUrl;

      if (!fileUrl) throw new Error("Server didn't return a file URL");

      if (format === 'pdf') {
        window.open(fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', 'Proposal');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      messageApi.open({ key, type: 'success', content: 'Export complete!', duration: 3 });
    } catch (err: any) {
      console.error("Export Failed:", err);
      messageApi.open({ key, type: 'error', content: `Export Failed: ${err.message}` });
    }
  };

  const filteredProposals = proposals.filter(p =>
    p.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchText.toLowerCase())
  );


  return (
    <MainLayout>
      {contextHolder}
      {messageHolder}

      <div style={{
        padding: '16px 24px',
        minHeight: '100vh',
        background: token.colorBgLayout
      }}>
        {/* Compact Header Section */}
        <div style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Breadcrumb
              items={[{ title: 'Work' }, { title: 'Proposals' }]}
              style={{ marginBottom: 6, fontSize: '11px' }}
            />
            <Title level={4} style={{
              margin: 0,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontSize: '22px',
              color: token.colorText
            }}>
              Proposals
            </Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            onClick={() => router.push('/proposals/builder')}
            style={{
              height: 40,
              padding: '0 20px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '14px',
              background: token.colorPrimary,
              boxShadow: `0 4px 6px -1px ${token.colorPrimary}40`,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            New Proposal
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { label: 'Total', value: proposals.length, icon: <SnippetsOutlined />, color: token.colorPrimary, bg: `${token.colorPrimary}15` },
            { label: 'Drafts', value: proposals.filter(p => p.status === 'draft').length, icon: <ClockCircleOutlined />, color: token.colorTextSecondary, bg: token.colorFillTertiary },
            { label: 'Accepted', value: proposals.filter(p => p.status === 'accepted').length, icon: <CheckCircleOutlined />, color: token.colorSuccess, bg: `${token.colorSuccess}15` },
          ].map((stat, idx) => (
            <Col xs={24} sm={8} key={idx}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: stat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: stat.color
                  }}>
                    {stat.icon}
                  </div>
                  <div>
                    <Text strong style={{
                      fontSize: '10px',
                      color: token.colorTextTertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '0px'
                    }}>
                      {stat.label}
                    </Text>
                    <Title level={4} style={{ margin: 0, fontWeight: 800, color: token.colorText, fontSize: '18px' }}>
                      {stat.value}
                    </Title>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01)',
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
          styles={{ body: { padding: '0' } }}
        >
          <div style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Input
              placeholder="Filter by name..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                width: 280,
                height: 36,
                borderRadius: 8,
                background: token.colorFillQuaternary,
                border: `1px solid ${token.colorBorderSecondary}`,
                fontSize: '13px'
              }}
            />
            <Space size="middle">
              <Button type="text" size="small" icon={<ClockCircleOutlined />} style={{ fontWeight: 600, color: token.colorTextDescription, fontSize: '12px' }}>Recent</Button>
              <Text style={{ fontWeight: 700, color: token.colorText, fontSize: '12px' }}>{filteredProposals.length} Items</Text>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredProposals}
            loading={loading}
            rowKey="id"
            size="middle"
            pagination={{
              pageSize: 10,
              style: { padding: '16px 24px', margin: 0 },
              showSizeChanger: false
            }}
            rowClassName={() => 'proposal-table-row-compact'}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '30px 0' }}
                  description={<Text strong style={{ color: token.colorTextTertiary, fontSize: '13px' }}>No proposals</Text>}
                />
              )
            }}
          />
        </Card>

        <style jsx global>{`
          .proposal-table-row-compact {
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .proposal-table-row-compact:hover {
            background-color: ${token.colorFillQuaternary} !important;
          }
          .ant-table-thead > tr > th {
            background: ${token.colorBgContainer} !important;
            color: ${token.colorTextTertiary} !important;
            font-size: 10px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            border-bottom: 1px solid ${token.colorBorderSecondary} !important;
            padding: 10px 24px !important;
          }
          .ant-table-tbody > tr > td {
            padding: 12px 24px !important;
            border-bottom: 1px solid ${token.colorBorderSecondary} !important;
            font-size: 13px !important;
            color: ${token.colorTextSecondary} !important;
          }
          .ant-avatar {
            width: 32px !important;
            height: 32px !important;
            line-height: 32px !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
