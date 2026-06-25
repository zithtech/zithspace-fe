"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Space, Tag, Typography, Card, message, Tooltip, Input, Select, Row, Col, Statistic, Avatar, Divider, Flex } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ThunderboltOutlined,
  FireOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { dealService, Deal } from "@/services/dealService";
import MainLayout from "@/components/layout/MainLayout";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const DealsListPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsData, stagesData] = await Promise.all([
        dealService.getAllDeals(),
        dealService.getPipelineStages()
      ]);
      setDeals(dealsData);
      setStages(stagesData);
    } catch (error: any) {
      console.error("Error fetching deals:", error);
      message.error(error.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await dealService.deleteDeal(id);
      message.success("Deal deleted successfully");
      fetchData();
    } catch (error: any) {
      message.error(error.message || "An error occurred while deleting the deal");
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalValue = deals.reduce((sum, d) => sum + (Number(d.estimatedValue) || 0), 0);
    const wonDeals = deals.filter(d => d.status === 'Won');
    const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.estimatedValue) || 0), 0);
    const activeDeals = deals.filter(d => d.status === 'Active');

    return {
      totalValue,
      totalCount: deals.length,
      wonCount: wonDeals.length,
      wonValue,
      activeCount: activeDeals.length
    };
  }, [deals]);

  // Filtering logic
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = searchText === "" ||
        deal.title.toLowerCase().includes(searchText.toLowerCase()) ||
        deal.clientName?.toLowerCase().includes(searchText.toLowerCase()) ||
        deal.companyName?.toLowerCase().includes(searchText.toLowerCase());

      const matchesStage = !selectedStage || deal.stageId === selectedStage;
      const matchesStatus = !selectedStatus || deal.status === selectedStatus;

      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [deals, searchText, selectedStage, selectedStatus]);

  const columns = [
    {
      title: "Title & Client",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Deal) => (
        <Space>
          <Avatar
            shape="square"
            style={{ backgroundColor: '#f0f2f5', color: '#1890ff' }}
            icon={<SolutionOutlined style={{ fontSize: '16px' }} />}
          />
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: '14px' }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>{record.clientName || record.companyName}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (stage: any) => (
        <Tag
          color={stage?.color || "blue"}
          style={{ borderRadius: '12px', padding: '0 12px', border: 'none' }}
        >
          {stage?.name || "Unknown"}
        </Tag>
      ),
    },
    {
      title: "Value",
      dataIndex: "estimatedValue",
      key: "estimatedValue",
      sorter: (a: Deal, b: Deal) => Number(a.estimatedValue) - Number(b.estimatedValue),
      render: (value: number, record: Deal) => (
        <Text strong>
          {record.currency || "USD"} {Number(value || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Team",
      dataIndex: "assignees",
      key: "assignees",
      render: (assignees: any[]) => {
        if (!assignees || assignees.length === 0) return <Text type="secondary">None</Text>;
        return (
          <Avatar.Group maxCount={3} size="small">
            {assignees.map(a => (
              <Tooltip title={a.user.name} key={a.userId}>
                <Avatar style={{ backgroundColor: '#87d068' }}>{a.user.name[0]}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      }
    },
    {
      title: "Expected Closing",
      dataIndex: "expectedClosingDate",
      key: "expectedClosingDate",
      render: (date: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
          <Text type="secondary">{date ? dayjs(date).format("MMM DD, YYYY") : "Not set"}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "processing";
        let icon = null;
        if (status === "Won") {
          color = "success";
          icon = <CheckCircleOutlined />;
        }
        if (status === "Lost") color = "error";
        if (status === "Draft") color = "default";
        return (
          <Tag color={color} icon={icon} style={{ borderRadius: '4px' }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      align: 'right' as const,
      render: (_: any, record: Deal) => (
        <Space size={8}>
          <Tooltip title="View Details">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/deals/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => router.push(`/admin/deals/${record.id}?edit=true`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <TimeTrackingHeader
          style={{ padding: '8.5px 32px' }}
          icon={<FireOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Deals & Leads"
          description="Manage your sales pipeline and track opportunities"
          extra={
            <Space>
              <Button
                size="large"
                onClick={() => router.push("/admin/deals/forecast")}
                icon={<ThunderboltOutlined />}
              >
                Sales Forecast
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => router.push("/admin/deals/create")}
                style={{ background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', border: 'none', borderRadius: '8px' }}
              >
                Create New Deal
              </Button>
            </Space>
          }
        />

        <div style={{ padding: "16px 32px 32px 32px" }}>

          {/* Stats Row */}
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col span={6}>
              <Card bordered style={{ borderColor: 'var(--border-slate-100)', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                <Statistic
                  title={<Text style={{ color: 'var(--text-slate-500)' }}>Total Pipeline Value</Text>}
                  value={metrics.totalValue}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: 'var(--premium-blue)' }} />}
                  valueStyle={{ color: 'var(--premium-blue)', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered style={{ borderColor: 'var(--border-slate-100)', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                <Statistic
                  title={<Text style={{ color: 'var(--text-slate-500)' }}>Won Revenue</Text>}
                  value={metrics.wonValue}
                  precision={2}
                  prefix={<CheckCircleOutlined style={{ color: 'var(--text-holiday)' }} />}
                  valueStyle={{ color: 'var(--text-holiday)', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered style={{ borderColor: 'var(--border-slate-100)', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                <Statistic
                  title={<Text style={{ color: 'var(--text-slate-500)' }}>Active Deals</Text>}
                  value={metrics.activeCount}
                  prefix={<ClockCircleOutlined style={{ color: 'var(--text-slate-400)' }} />}
                  valueStyle={{ fontWeight: 700, color: 'var(--text-slate-900)' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered style={{ borderColor: 'var(--border-slate-100)', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                <Statistic
                  title={<Text style={{ color: 'var(--text-slate-500)' }}>Conversion Rate</Text>}
                  value={metrics.totalCount > 0 ? (metrics.wonCount / metrics.totalCount) * 100 : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: 'var(--text-slate-700)', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters & Table Card */}
          <Card bordered style={{ borderColor: 'var(--border-slate-100)', borderRadius: '12px', background: 'var(--bg-pure-white)' }}>
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={12} align="middle">
                <Col span={8}>
                  <Input
                    placeholder="Search deals, clients or companies..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                </Col>
                <Col span={5}>
                  <Select
                    placeholder="Filter by Stage"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={setSelectedStage}
                    suffixIcon={<FilterOutlined />}
                  >
                    {stages.map(stage => (
                      <Option key={stage.id} value={stage.id}>
                        <Badge color={stage.color} text={stage.name} />
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={5}>
                  <Select
                    placeholder="Filter by Status"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={setSelectedStatus}
                  >
                    <Option value="Active">Active</Option>
                    <Option value="Won">Won</Option>
                    <Option value="Lost">Lost</Option>
                    <Option value="Draft">Draft</Option>
                  </Select>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <Text type="secondary">{filteredDeals.length} opportunities found</Text>
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={filteredDeals}
              rowKey="id"
              loading={loading}
              pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} deals`
              }}
              className="custom-table"
              onRow={(record) => ({
                onClick: () => router.push(`/admin/deals/${record.id}`),
                style: { cursor: 'pointer' }
              })}
            />
          </Card>

          <style jsx global>{`
          .stat-card {
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: transform 0.2s;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
          }
          .stat-card:hover {
            transform: translateY(-4px);
          }
          .custom-table .ant-table-thead > tr > th {
            background: var(--bg-table-header) !important;
            border-bottom: 2px solid var(--border-slate-100) !important;
            color: var(--text-slate-900) !important;
          }
          .custom-table .ant-table-row:hover > td {
            background: var(--bg-slate-50) !important;
          }
        `}</style>
        </div>
      </div>
    </MainLayout>
  );
};

// Internal icon for Avatar
const SolutionOutlined = (props: any) => (
  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024" {...props}>
    <path d="M688 312v400c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V312c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8zm-416 0v400c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V312c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8zm160 0v400c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V312c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8zM512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
  </svg>
);

const Badge = ({ color, text }: { color: string, text: string }) => (
  <Space size={8}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    <span>{text}</span>
  </Space>
);

export default DealsListPage;
