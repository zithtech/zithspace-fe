"use client";

import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Select, DatePicker, 
  Space, Tag, Typography, Spin, 
  Empty
} from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { 
  DollarOutlined, RiseOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, FilterOutlined, FireOutlined 
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { dealService, ForecastData } from '@/services/dealService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ForecastDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ForecastData | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    fetchStages();
    loadForecastData();
  }, [filters]);

  const fetchStages = async () => {
    try {
      const stageData = await dealService.getPipelineStages();
      setStages(stageData);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const loadForecastData = async () => {
    setLoading(true);
    try {
      const forecast = await dealService.getForecastData(filters);
      setData(forecast);
    } catch (error) {
      console.error('Failed to load forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const columns = [
    {
      title: 'Deal Name',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => <Tag color="blue">{stage}</Tag>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob: number) => `${prob}%`,
    },
    {
      title: 'Weighted Value',
      dataIndex: 'weightedValue',
      key: 'weightedValue',
      render: (val: number) => <Text type="success">{formatCurrency(val)}</Text>,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    }
  ];

  const chartColors = ['#1890ff', '#2fc25b', '#facc14', '#f04864', '#8543e0', '#13c2c2', '#fa8c16', '#a0d911'];

  return (
    <MainLayout>
      <div style={{ padding: '16px', background: '#fff', minHeight: '100vh' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Space align="center" size={10}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: '#fff0f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FireOutlined style={{ color: '#eb2f96', fontSize: 18 }} />
              </div>
              <Title level={3} style={{ margin: 0 }}>Sales Forecast Dashboard</Title>
            </Space>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>Gain insights into your pipeline and predicted revenue</Text>
          </Col>
          <Col>
            <Space>
              <RangePicker 
                onChange={(dates: any) => {
                  if (dates) {
                    setFilters({ 
                      ...filters, 
                      startDate: dates[0].format('YYYY-MM-DD'), 
                      endDate: dates[1].format('YYYY-MM-DD') 
                    });
                  } else {
                    const { startDate, endDate, ...rest } = filters;
                    setFilters(rest);
                  }
                }} 
              />
              <Select 
                placeholder="Filter by Stage" 
                style={{ width: 180 }}
                allowClear
                onChange={(val) => setFilters({ ...filters, stageId: val })}
              >
                {stages.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>

        <Spin spinning={loading}>
          {data ? (
            <>
              {/* Metric Cards */}
              <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered style={{ borderColor: '#f0f0f0' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                    <Statistic 
                      title="Total Pipeline" 
                      value={data.metrics.totalPipelineValue} 
                      precision={0}
                      prefix={<DollarOutlined />}
                      formatter={(val: any) => formatCurrency(val)}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered style={{ borderColor: '#f0f0f0' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                    <Statistic 
                      title="Weighted Revenue" 
                      value={data.metrics.weightedRevenue} 
                      precision={0}
                      prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                      formatter={(val: any) => formatCurrency(val)}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered style={{ borderColor: '#f0f0f0' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                    <Statistic 
                      title="Won Revenue" 
                      value={data.metrics.wonRevenue} 
                      precision={0}
                      prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                      formatter={(val: any) => formatCurrency(val)}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered style={{ borderColor: '#f0f0f0' }} styles={{ body: { padding: '16px' } }} className="stat-card">
                    <Statistic 
                      title="Lost Revenue" 
                      value={data.metrics.lostRevenue} 
                      precision={0}
                      prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
                      formatter={(val: any) => formatCurrency(val)}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Charts Row */}
              <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col xs={24} lg={12}>
                  <Card title="Revenue by Stage" bordered style={{ borderColor: '#f0f0f0', borderRadius: '12px' }}>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.charts.revenueByStage}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="stage" />
                          <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                          <ChartTooltip 
                            formatter={(value: any) => formatCurrency(value)}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.charts.revenueByStage.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Monthly Forecast (Weighted)" bordered style={{ borderColor: '#f0f0f0', borderRadius: '12px' }}>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.charts.monthlyForecast}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                          <ChartTooltip 
                            formatter={(value: any) => formatCurrency(value)}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#1890ff" 
                            strokeWidth={3} 
                            dot={{ r: 6 }} 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Deals Table */}
              <Card title="Detailed Pipeline List" bordered style={{ borderColor: '#f0f0f0', borderRadius: '12px' }}>
                <Table 
                  columns={columns} 
                  dataSource={data.deals} 
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </>
          ) : (
            <Empty description="No forecast data available for the selected filters" />
          )}
        </Spin>
      </div>

      <style jsx global>{`
        .stat-card {
           border-radius: 12px;
           box-shadow: 0 2px 8px rgba(0,0,0,0.05);
           transition: transform 0.2s;
        }
        .stat-card:hover {
           transform: translateY(-4px);
        }
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0 !important;
          background: transparent !important;
        }
      `}</style>
    </MainLayout>
  );
};

export default ForecastDashboard;
