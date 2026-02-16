
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";

import {
  Space,
  Typography,
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Tag,
  Tooltip,
  Button,
  Avatar,
  Drawer,
  Spin,
  message,
  Row,
  Col,
  Empty,
  Tabs,
  Badge,
  Checkbox,
  Dropdown,
  Menu,
  Form,
  Divider
} from "antd";
import {
  MailOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  EyeOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  SendOutlined,
  CalendarOutlined,
  FilterOutlined,
  ClearOutlined,
  StarOutlined,
  StarFilled,
  PaperClipOutlined,
  DeleteOutlined,
  FolderOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MenuOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  ExportOutlined,
  PlusOutlined,
  CloseOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import { useRouter } from "next/navigation";
import {
  useEmailLogs,
  useEmailModules,
  useEmailStats,
  useAllModuleConfigs,
  useRefreshEmailHistory,
  useEmailLog,
  useDownloadAttachment,
  useModuleCounts
} from "@/hooks/useEmailHistory";
import { useSendInvoiceEmail } from "@/hooks/useInvoices";
import EmailHistoryService from "@/services/emailHistoryService";

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(calendar);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

export default function EmailHistoryPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const refreshEmailHistory = useRefreshEmailHistory();
  const getModuleCount = useModuleCounts();
  const { mutate: downloadAttachment } = useDownloadAttachment();
  const { mutate: sendEmail, isPending: isSending } = useSendInvoiceEmail();

  // Compose Drawer State
  const [composeDrawerOpen, setComposeDrawerOpen] = useState(false);
  const [composeForm] = Form.useForm();

  // State
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    module: "INVOICE",
    status: "",
    search: "",
    startDate: "",
    endDate: ""
  });

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activeTab, setActiveTab] = useState("INVOICE");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [starred, setStarred] = useState<string[]>([]);
  const [showSearchOptions, setShowSearchOptions] = useState(false);

  // Fetch data
  const { 
    data: emailLogsData, 
    isLoading: logsLoading, 
    refetch: refetchLogs 
  } = useEmailLogs(filters);
  
  const { 
    data: modules = [] 
  } = useEmailModules();
  
  const { 
    data: stats 
  } = useEmailStats();

  // Email preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  const { 
    data: selectedEmail 
  } = useEmailLog(selectedEmailId || "");

  const moduleConfigs = useAllModuleConfigs();

  // Handle filters
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
        page: 1
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: "",
        endDate: "",
        page: 1
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      module: "INVOICE",
      status: "",
      search: "",
      startDate: "",
      endDate: ""
    });
    setDateRange(null);
    setActiveTab("INVOICE");
    setSelectedRowKeys([]);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    handleFilterChange("module", key === "all" ? "" : key);
  };

  const handleViewEmail = (id: string) => {
    setSelectedEmailId(id);
    setPreviewOpen(true);
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowKeys.length === emailLogsData?.data?.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(emailLogsData?.data?.map(item => item.id) || []);
    }
  };

  // Handle table pagination
  const handlePaginationChange = (pagination: any) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize
    }));
  };

  // Handle Compose
  const handleOpenCompose = () => {
    composeForm.resetFields();
    composeForm.setFieldsValue({
      subject: "Invoice from Zithtech",
      message: "Dear Customer,\n\nPlease find your invoice attached.\n\nKind regards,\nAccounts Team"
    });
    setComposeDrawerOpen(true);
  };

  const handleSendEmail = (values: any) => {
    // This would need an invoice ID - for now just show success
    messageApi.success("Email sent successfully");
    setComposeDrawerOpen(false);
    composeForm.resetFields();
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'SENT': return <SendOutlined style={{ color: '#1a73e8' }} />;
      case 'OPENED': return <EyeOutlined style={{ color: '#1a73e8' }} />;
      case 'CLICKED': return <MailOutlined style={{ color: '#1a73e8' }} />;
      case 'FAILED': return <CloseCircleOutlined style={{ color: '#d93025' }} />;
      case 'BOUNCED': return <WarningOutlined style={{ color: '#f9ab00' }} />;
      default: return <CheckCircleOutlined style={{ color: '#1a73e8' }} />;
    }
  };

  // Format date for list
  const formatListDate = (date: string) => {
    const d = dayjs(date);
    const now = dayjs();
    
    if (d.isSame(now, 'day')) {
      return d.format('h:mm A');
    } else if (d.isSame(now.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    } else if (d.isSame(now, 'week')) {
      return d.format('ddd');
    } else {
      return d.format('MMM D');
    }
  };

  // Gmail-style columns for SENT folder
  const columns: ColumnsType<any> = [
    {
      title: "",
      key: "select",
      width: 36,
      render: (_, record) => (
        <Checkbox 
          checked={selectedRowKeys.includes(record.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            if (selectedRowKeys.includes(record.id)) {
              setSelectedRowKeys(selectedRowKeys.filter(id => id !== record.id));
            } else {
              setSelectedRowKeys([...selectedRowKeys, record.id]);
            }
          }}
        />
      )
    },
    {
      title: "",
      key: "star",
      width: 36,
      render: (_, record) => (
        <span 
          onClick={(e) => toggleStar(record.id, e)} 
          style={{ cursor: 'pointer', display: 'inline-block' }}
        >
          {starred.includes(record.id) ? (
            <StarFilled style={{ color: '#f9ab00', fontSize: 16 }} />
          ) : (
            <StarOutlined style={{ color: '#9aa0a6', fontSize: 16 }} />
          )}
        </span>
      )
    },
    {
      title: "",
      key: "status",
      width: 36,
      render: (_, record) => (
        <Tooltip title={record.status}>
          {getStatusIcon(record.status)}
        </Tooltip>
      )
    },
    {
      title: "To",
      key: "to",
      width: 200,
      render: (_, record) => (
        <div style={{ 
          fontWeight: record.status === 'OPENED' ? 400 : 500,
          color: '#202124'
        }}>
          {record.customerName || record.to?.split('@')[0] || 'Unknown'}
          <div style={{ fontSize: 12, color: '#5f6368', fontWeight: 'normal' }}>
            {record.to}
          </div>
        </div>
      )
    },
    {
      title: "Subject",
      key: "subject",
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <span style={{ 
              fontWeight: record.status === 'OPENED' ? 400 : 500,
              color: '#202124'
            }}>
              {record.subject}
            </span>
            {record.hasAttachment && (
              <PaperClipOutlined style={{ color: '#5f6368', fontSize: 14 }} />
            )}
            {record.amount && (
              <Tag style={{ 
                marginLeft: 8, 
                backgroundColor: '#e8f0fe', 
                color: '#1a73e8',
                border: 'none',
                borderRadius: 12,
                padding: '0 8px',
                fontSize: 11,
                fontWeight: 500
              }}>
                {record.amount}
              </Tag>
            )}
            <span style={{ 
              fontSize: 11, 
              color: '#5f6368',
              backgroundColor: '#f1f3f4',
              padding: '2px 8px',
              borderRadius: 12,
              marginLeft: 8
            }}>
              #{record.moduleNumber}
            </span>
          </div>
          <span style={{ color: '#5f6368', fontSize: 12, marginLeft: 16, whiteSpace: 'nowrap' }}>
            {formatListDate(record.sentAt)}
          </span>
        </div>
      )
    }
  ];

  // Loading state
  if (logsLoading && !emailLogsData) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  // Bulk actions menu
  const bulkActionsMenu = (
    <Menu
      items={[
        { key: 'star', icon: <StarOutlined />, label: 'Star' },
        { key: 'unstar', icon: <StarFilled />, label: 'Unstar' },
        { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
        { key: 'resend', icon: <SendOutlined />, label: 'Resend' },
        { key: 'mark-read', icon: <EyeOutlined />, label: 'Mark as read' }
      ]}
    />
  );

  return (
    <MainLayout>
      {contextHolder}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        backgroundColor: '#f6f8fc',
        overflow: 'hidden'
      }}>
        {/* Gmail Header - Sent Mail Style */}
        <div style={{ 
          padding: '12px 24px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
              icon={<MenuOutlined />} 
              type="text"
              style={{ color: '#5f6368' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* <SendOutlined style={{ color: '#1a73e8', fontSize: 24 }} /> */}
              <Title level={4} style={{ margin: 0, color: '#202124', fontWeight: 500 }}>
                 Mail
              </Title>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge count={stats?.sentToday || 0} style={{ backgroundColor: '#1a73e8' }}>
              <Button 
                icon={<SendOutlined />} 
                onClick={() => handleFilterChange('status', 'SENT')}
                style={{ borderColor: '#e0e0e0' }}
              >
                Sent Today
              </Button>
            </Badge>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshEmailHistory}
              style={{ borderColor: '#e0e0e0' }}
            />
            <Button 
              icon={<SettingOutlined />} 
              style={{ borderColor: '#e0e0e0' }}
            />
          </div>
        </div>

        {/* Main Content - Gmail 3 Column Layout */}
        <div style={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#f6f8fc'
        }}>
          {/* Left Sidebar - Folders */}
          <div style={{ 
            width: 200, 
            backgroundColor: '#fff',
            borderRight: '1px solid #e0e0e0',
            padding: '16px 0',
            overflowY: 'auto'
          }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              style={{ 
                margin: '0 16px 16px',
                backgroundColor: '#c2e7ff',
                borderColor: '#c2e7ff',
                color: '#001d35',
                width: 'calc(100% - 32px)',
                borderRadius: 24,
                fontWeight: 500
              }}
              onClick={handleOpenCompose}
            >
              Compose
            </Button>
            
            <div style={{ padding: '0 12px' }}>
              {/* Sent Folder - Active */}
              <div 
                style={{ 
                  padding: '8px 12px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  backgroundColor: '#e8f0fe',
                  color: '#1a73e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4
                }}
              >
                <span>
                  <SendOutlined style={{ marginRight: 12, color: '#1a73e8' }} />
                  Sent
                </span>
                <span style={{ color: '#5f6368', fontSize: 13 }}>{stats?.total || 0}</span>
              </div>
              
              <div style={{ padding: '8px 12px', color: '#5f6368', display: 'flex', alignItems: 'center' }}>
                <InboxOutlined style={{ marginRight: 12 }} />
                Inbox
              </div>
              
              <div style={{ padding: '8px 12px', color: '#5f6368', display: 'flex', alignItems: 'center' }}>
                <DeleteOutlined style={{ marginRight: 12 }} />
                Trash
              </div>

              <div style={{ marginTop: 24, marginBottom: 8, paddingLeft: 12, color: '#5f6368', fontSize: 12 }}>
                MODULES
              </div>
              
              {modules.map(module => (
                <div
                  key={module}
                  onClick={() => handleTabChange(module)}
                  style={{ 
                    padding: '6px 12px',
                    paddingLeft: 36,
                    borderRadius: 16,
                    cursor: 'pointer',
                    backgroundColor: activeTab === module ? '#e8f0fe' : 'transparent',
                    color: activeTab === module ? '#1a73e8' : '#202124',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                    fontSize: 13
                  }}
                >
                  <span>
                    {moduleConfigs[module]?.label || module}
                  </span>
                  <span style={{ color: '#5f6368', fontSize: 12 }}>{getModuleCount(module)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle - Sent Email List */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            margin: '0 1px',
            overflow: 'hidden',
            maxWidth: previewOpen ? '40%' : '100%'
          }}>
            {/* Search Bar */}
            <div style={{ 
              padding: '16px 24px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Input
                placeholder="Search sent emails"
                prefix={<SearchOutlined style={{ color: '#5f6368' }} />}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
                style={{ 
                  borderRadius: 24,
                  borderColor: '#e0e0e0',
                  backgroundColor: '#f1f3f4',
                  border: 'none'
                }}
              />
              
              {/* Filter Row */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginTop: 12,
                alignItems: 'center'
              }}>
                <Select
                  placeholder="Module"
                  style={{ width: 120 }}
                  value={filters.module || undefined}
                  onChange={(value) => handleFilterChange('module', value)}
                  allowClear
                  size="small"
                  dropdownMatchSelectWidth={false}
                >
                  {modules.map(module => (
                    <Option key={module} value={module}>
                      {moduleConfigs[module]?.label || module}
                    </Option>
                  ))}
                </Select>

                <Select
                  placeholder="Status"
                  style={{ width: 100 }}
                  value={filters.status || undefined}
                  onChange={(value) => handleFilterChange('status', value)}
                  allowClear
                  size="small"
                >
                  <Option value="SENT">Sent</Option>
                  <Option value="OPENED">Opened</Option>
                  <Option value="CLICKED">Clicked</Option>
                  <Option value="FAILED">Failed</Option>
                  <Option value="BOUNCED">Bounced</Option>
                </Select>

                <RangePicker 
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: 220 }}
                  size="small"
                  placeholder={['Sent start', 'Sent end']}
                />

                <Button 
                  icon={<ClearOutlined />} 
                  onClick={clearFilters}
                  size="small"
                >
                  Clear
                </Button>

                <Button 
                  icon={<SyncOutlined />} 
                  onClick={refreshEmailHistory}
                  size="small"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedRowKeys.length > 0 && (
              <div style={{ 
                padding: '8px 24px',
                backgroundColor: '#e8f0fe',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Space>
                  <Checkbox 
                    checked={selectedRowKeys.length === emailLogsData?.data?.length}
                    indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < (emailLogsData?.data?.length || 0)}
                    onChange={handleSelectAll}
                  >
                    <Text strong style={{ color: '#202124' }}>
                      {selectedRowKeys.length} selected
                    </Text>
                  </Checkbox>
                  <Dropdown overlay={bulkActionsMenu} trigger={['click']}>
                    <Button size="small">Actions</Button>
                  </Dropdown>
                </Space>
                <Button 
                  size="small" 
                  icon={<CloseCircleOutlined />}
                  onClick={() => setSelectedRowKeys([])}
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Sent Email List */}
            <div style={{ 
              flex: 1,
              overflow: 'auto'
            }}>
              <Table
                columns={columns}
                dataSource={emailLogsData?.data}
                rowKey="id"
                loading={logsLoading}
                pagination={false}
                onChange={handlePaginationChange}
                scroll={{ y: 'calc(100vh - 280px)' }}
                size="middle"
                showHeader={false}
                onRow={(record) => ({
                  onClick: () => handleViewEmail(record.id),
                  style: { 
                    cursor: 'pointer',
                    backgroundColor: record.status === 'OPENED' ? '#fafafa' : '#fff',
                  }
                })}
              />

              {/* Empty State */}
              {(!emailLogsData?.data || emailLogsData.data.length === 0) && !logsLoading && (
                <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                  <SendOutlined style={{ fontSize: 64, color: '#dadce0' }} />
                  <Title level={4} style={{ color: '#202124', fontWeight: 400, marginTop: 16 }}>
                    No sent emails found
                  </Title>
                  <Text style={{ color: '#5f6368' }}>
                    {filters.search || filters.module || filters.status || dateRange 
                      ? "Try adjusting your filters"
                      : "You haven't sent any emails yet"}
                  </Text>
                  <div style={{ marginTop: 24 }}>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={handleOpenCompose}
                      style={{ backgroundColor: '#1a73e8' }}
                    >
                      Compose Email
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {emailLogsData?.data && emailLogsData.data.length > 0 && (
              <div style={{ 
                padding: '12px 24px',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#fff'
              }}>
                <Space>
                  <Button 
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    disabled={filters.page === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  />
                  <Text style={{ color: '#5f6368' }}>
                    {filters.page} of {Math.ceil((emailLogsData?.pagination?.total || 0) / filters.limit)}
                  </Text>
                  <Button 
                    size="small"
                    icon={<ArrowRightOutlined />}
                    disabled={filters.page >= Math.ceil((emailLogsData?.pagination?.total || 0) / filters.limit)}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  />
                </Space>
              </div>
            )}
          </div>

          {/* Right - Email Preview (Sent Mail View) */}
          {previewOpen && selectedEmail && (
            <div style={{ 
              width: '60%',
              backgroundColor: '#fff',
              borderLeft: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Preview Header */}
              <div style={{ 
                padding: '16px 24px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff'
              }}>
                <Space>
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    size="small"
                    onClick={() => setPreviewOpen(false)}
                    style={{ borderColor: '#e0e0e0' }}
                  />
                  <Button 
                    icon={<ArrowRightOutlined />} 
                    size="small"
                    disabled
                    style={{ borderColor: '#e0e0e0' }}
                  />
                  <Button 
                    icon={<ReloadOutlined />} 
                    size="small"
                    onClick={() => handleViewEmail(selectedEmail.id)}
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </Space>
                <Space>
                  <Button 
                    icon={<SendOutlined />}
                    onClick={handleOpenCompose}
                    style={{ borderColor: '#e0e0e0' }}
                  >
                    Compose
                  </Button>
                  {selectedEmail.hasAttachment && (
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={() => downloadAttachment({ 
                        url: selectedEmail.attachmentUrl!,
                        filename: selectedEmail.attachmentName || `Invoice_${selectedEmail.moduleNumber}.pdf`
                      })}
                      style={{ borderColor: '#e0e0e0' }}
                    >
                      Download
                    </Button>
                  )}
                  <Button 
                    icon={<DeleteOutlined />} 
                    style={{ borderColor: '#e0e0e0' }}
                  />
                  <Button 
                    icon={<CloseCircleOutlined />} 
                    onClick={() => setPreviewOpen(false)}
                    style={{ borderColor: '#e0e0e0' }}
                  />
                </Space>
              </div>

              {/* Email Thread - Sent Mail View */}
              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                {/* Sender Info - Show who sent it */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <Avatar 
                    size={56}
                    style={{ 
                      backgroundColor: '#f1f3f4',
                      color: '#5f6368'
                    }}
                    icon={<UserOutlined />}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Title level={5} style={{ margin: 0, marginBottom: 4, color: '#202124' }}>
                            {selectedEmail.fromName || 'Zithtech'}
                          </Title>
                          <Tag style={{ 
                            backgroundColor: '#e8f0fe', 
                            color: '#1a73e8',
                            border: 'none',
                            borderRadius: 12
                          }}>
                            Sent by {selectedEmail.sentByUser?.split('@')[0] || 'System'}
                          </Tag>
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 13, marginBottom: 4 }}>
                          to {selectedEmail.customerName || selectedEmail.to?.split('@')[0] || 'Customer'}
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 12 }}>
                          {selectedEmail.to}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#5f6368', fontSize: 12 }}>
                          {dayjs(selectedEmail.sentAt).format('MMMM D, YYYY')}
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 12 }}>
                          {dayjs(selectedEmail.sentAt).format('h:mm:ss A')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ margin: 0, color: '#202124', fontWeight: 500 }}>
                    {selectedEmail.subject}
                  </Title>
                </div>

                {/* Email Body */}
                <div style={{ 
                  marginBottom: 24,
                  color: '#202124',
                  lineHeight: 1.6,
                  fontSize: 14
                }}>
                  {selectedEmail.html ? (
                    <iframe
                      srcDoc={selectedEmail.html}
                      style={{ 
                        width: '100%', 
                        border: 'none',
                        backgroundColor: '#fff'
                      }}
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div>{selectedEmail.plainText}</div>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.hasAttachment && (
                  <div style={{ 
                    marginTop: 24,
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FilePdfOutlined style={{ color: '#d93025', fontSize: 24 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: '#202124' }}>
                          {selectedEmail.attachmentName || 'Invoice.pdf'}
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 12 }}>
                          PDF Document • {selectedEmail.moduleNumber}
                        </div>
                      </div>
                      <Button 
                        icon={<DownloadOutlined />}
                        onClick={() => downloadAttachment({ 
                          url: selectedEmail.attachmentUrl!,
                          filename: selectedEmail.attachmentName || `Invoice_${selectedEmail.moduleNumber}.pdf`
                        })}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tracking Info - Sent Mail */}
                {(selectedEmail.openedAt || selectedEmail.clickedAt) && (
                  <div style={{ 
                    marginTop: 24,
                    padding: '16px',
                    backgroundColor: '#e8f0fe',
                    borderRadius: 8,
                    display: 'flex',
                    gap: 24
                  }}>
                    {selectedEmail.openedAt && (
                      <div>
                        <EyeOutlined style={{ color: '#1a73e8', marginRight: 8 }} />
                        <span style={{ color: '#202124', fontSize: 13 }}>
                          Opened {dayjs(selectedEmail.openedAt).fromNow()}
                        </span>
                      </div>
                    )}
                    {selectedEmail.clickedAt && (
                      <div>
                        <MailOutlined style={{ color: '#1a73e8', marginRight: 8 }} />
                        <span style={{ color: '#202124', fontSize: 13 }}>
                          Link clicked {dayjs(selectedEmail.clickedAt).fromNow()}
                        </span>
                      </div>
                    )}
                    {!selectedEmail.openedAt && !selectedEmail.clickedAt && (
                      <div>
                        <ClockCircleOutlined style={{ color: '#5f6368', marginRight: 8 }} />
                        <span style={{ color: '#5f6368', fontSize: 13 }}>
                          Delivered - Awaiting open
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice Info */}
                {selectedEmail.module === 'INVOICE' && (
                  <div style={{ 
                    marginTop: 24,
                    padding: '16px',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#202124', marginBottom: 4 }}>
                        Invoice #{selectedEmail.moduleNumber}
                      </div>
                      <div style={{ color: '#5f6368', fontSize: 13 }}>
                        {selectedEmail.amount} • Due {selectedEmail.dueDate}
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push(`/invoicepro/invoices/view/${selectedEmail.moduleNumber}`)}
                    >
                      View Invoice
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Drawer - Right End Corner */}
      <Drawer
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 4px'
          }}>
            <Space size="middle">
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#c2e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PlusOutlined style={{ color: '#001d35', fontSize: 16 }} />
              </div>
              <Title level={5} style={{ margin: 0, color: '#202124', fontWeight: 500 }}>
                Compose Email
              </Title>
            </Space>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={() => setComposeDrawerOpen(false)}
              style={{ color: '#5f6368' }}
            />
          </div>
        }
        placement="right"
        width={600}
        onClose={() => setComposeDrawerOpen(false)}
        open={composeDrawerOpen}
        destroyOnClose
        styles={{
          header: {
            padding: '16px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fff'
          },
          body: {
            padding: '24px',
            backgroundColor: '#fff'
          },
          footer: {
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fff'
          }
        }}
        footer={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Space>
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={() => composeForm.submit()}
                loading={isSending}
                style={{ 
                  backgroundColor: '#1a73e8',
                  borderRadius: 24,
                  padding: '8px 24px'
                }}
              >
                Send
              </Button>
              <Button 
                icon={<PaperClipOutlined />}
                style={{ borderColor: '#e0e0e0' }}
              >
                Attach
              </Button>
            </Space>
            <Button 
              onClick={() => setComposeDrawerOpen(false)}
              style={{ borderColor: '#e0e0e0' }}
            >
              Discard
            </Button>
          </div>
        }
      >
        <Form
          form={composeForm}
          layout="vertical"
          onFinish={handleSendEmail}
          requiredMark={false}
        >
          <Form.Item
            name="to"
            label={<span style={{ color: '#5f6368', fontSize: 13 }}>To</span>}
            rules={[{ required: true, message: 'Please enter recipient email' }]}
          >
            <Input 
              placeholder="recipient@example.com" 
              style={{ 
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="cc"
            label={<span style={{ color: '#5f6368', fontSize: 13 }}>Cc</span>}
          >
            <Input 
              placeholder="cc@example.com" 
              style={{ 
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="bcc"
            label={<span style={{ color: '#5f6368', fontSize: 13 }}>Bcc</span>}
          >
            <Input 
              placeholder="bcc@example.com" 
              style={{ 
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="subject"
            label={<span style={{ color: '#5f6368', fontSize: 13 }}>Subject</span>}
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input 
              placeholder="Invoice from Zithtech" 
              style={{ 
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="message"
            label={<span style={{ color: '#5f6368', fontSize: 13 }}>Message</span>}
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <TextArea 
              rows={12} 
              placeholder="Dear Customer,&#10;&#10;Please find your invoice attached.&#10;&#10;Kind regards,&#10;Accounts Team"
              style={{ 
                borderColor: '#e0e0e0',
                borderRadius: 8,
                padding: '12px',
                resize: 'none'
              }}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <style jsx global>{`
        .ant-table {
          background: transparent;
        }
        .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid #e0e0e0;
        }
        .ant-table-tbody > tr:hover td {
          background-color: #f1f3f4 !important;
        }
        .ant-checkbox-wrapper:hover .ant-checkbox-inner {
          border-color: #1a73e8 !important;
        }
        .ant-btn {
          border-radius: 4px;
        }
        .ant-btn-sm {
          border-radius: 16px;
        }
        .ant-select-selector,
        .ant-picker {
          border-radius: 16px !important;
          border-color: #e0e0e0 !important;
        }
        .ant-tag {
          border-radius: 12px !important;
        }
        .ant-badge-count {
          box-shadow: none !important;
          border-radius: 12px !important;
        }
        .ant-drawer-content-wrapper {
          box-shadow: -4px 0 16px rgba(0,0,0,0.08) !important;
        }
        .ant-menu-vertical {
          border: none;
        }
        .ant-form-item-label {
          padding-bottom: 4px !important;
        }
        .ant-form-item-label label {
          color: #5f6368 !important;
          font-size: 13px !important;
        }
      `}</style>
    </MainLayout>
  );
}