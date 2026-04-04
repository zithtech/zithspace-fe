


"use client";

import { Button, Table, Tag, Popconfirm, Space, Input, Modal, Typography, Card, Row, Col } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DownOutlined,
  RightOutlined,
  UserOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { 
  Receipt, 
  Search, 
  Plus, 
  RefreshCw, 
  DollarSign, 
  Layers, 
  ClipboardList,
  Eye,
  Trash2,
  Edit3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
import { useApproverTypeMap } from "@/hooks/usereimbursementcreate";
import { ReimbursementResponse } from "@/services/reimbursementcreateService";
import dayjs from "dayjs";
import { useState, useMemo } from "react";

const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card 
    bodyStyle={{ padding: "16px 20px" }} 
    style={{ 
      borderRadius: 12, 
      border: "1px solid #f1f5f9", 
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

export default function EmployeeTab() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Approver modal state
  const [approverModalVisible, setApproverModalVisible] = useState(false);
  const [selectedApproverItem, setSelectedApproverItem] = useState<any>(null);

  const {
    data: reimbursements = [],
    isLoading: loading,
    refetch
  } = useAllReimbursements();

  const deleteMutation = useDeleteReimbursement();

  const approverTypeMap = useApproverTypeMap();

  const filteredData = useMemo(() => {
    if (!searchText) return reimbursements;

    return reimbursements.filter((record: ReimbursementResponse) => {
      const childMatch = record.items?.some(item => {
        const approverType = item.category ?
          approverTypeMap.get(item.category.toLowerCase()) : '';

        return item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
          approverType?.toLowerCase().includes(searchText.toLowerCase());
      });

      const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.totalAmount?.toString().includes(searchText);

      return parentMatch || childMatch;
    });
  }, [reimbursements, searchText, approverTypeMap]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/reimburseCreate?id=${id}`);
  };

  // Handle approver click
  const handleApproverClick = (item: any, record: any) => {
    const approverTag = getApproverTypeTag(item.category);
    let columnApproverName = '';
    if (approverTag && typeof approverTag === 'object') {
      columnApproverName = (approverTag as any).props?.children || '';
    }

    setSelectedApproverItem({
      ...item,
      employeeName: record.employeeName || 'N/A',
      columnApproverName: columnApproverName // Store column name
    });
    setApproverModalVisible(true);
  };

  const totalAmount = useMemo(() => {
    return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  }, [reimbursements]);

  const totalItemsCount = useMemo(() => {
    return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
  }, [reimbursements]);

  const isActionsEnabled = (status: string) => {
    return status === "DRAFT" || status === "SUBMITTED";
  };

  const getApproverTypeTag = (category: string) => {
    if (!category) return <Tag color="default">N/A</Tag>;

    const approverType = approverTypeMap.get(category.toLowerCase());

    if (!approverType) return <Tag color="default">Not Configured</Tag>;

    switch (approverType?.toUpperCase()) {
      case 'MANAGER':
        return <Tag color="blue" style={{ borderRadius: 6 }}>Manager</Tag>;
      case 'FINANCE':
        return <Tag color="purple" style={{ borderRadius: 6 }}>Finance</Tag>;
      case 'HR':
        return <Tag color="green" style={{ borderRadius: 6 }}>HR</Tag>;
      default:
        return <Tag color="cyan" style={{ borderRadius: 6 }}>{approverType}</Tag>;
    }
  };

  const expandedRowRender = (record: ReimbursementResponse) => {
    const items = record.items || [];

    const childColumns = [
      {
        title: "Category",
        key: "category",
        width: 150,
        render: (_: any, item: any) => (
          <Space>
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 6, 
              background: "#eff6ff", 
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12
            }}>
              <Layers size={14} />
            </div>
            <Text strong style={{ fontSize: 13, color: "#1e293b" }}>{item.category}</Text>
          </Space>
        ),
      },
      {
        title: "Date",
        key: "date",
        width: 120,
        render: (_: any, item: any) => (
          <Text style={{ color: "#64748b", fontSize: 13 }}>
            {dayjs(item.date).format('DD MMM YYYY')}
          </Text>
        ),
      },
      {
        title: "Amount",
        key: "amount",
        width: 120,
        render: (_: any, item: any) => (
          <Text strong style={{ color: "#0f172a", fontSize: 13 }}>
            ₹{Number(item.amount).toFixed(2)}
          </Text>
        ),
      },
      {
        title: "Bill No",
        dataIndex: "billNo",
        key: "billNo",
        width: 100,
        render: (text: string) => <Text style={{ color: "#64748b", fontSize: 13 }}>{text || '-'}</Text>
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        width: 200,
        render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text || '-'}</Text>
      },
      {
        title: "Approver",
        key: "approver",
        width: 100,
        render: (_: any, item: any) => {
          return (
            <Button
              type="text"
              size="small"
              icon={<Eye size={16} style={{ color: "#3b82f6" }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleApproverClick(item, record);
              }}
              style={{ borderRadius: 6 }}
            >
              View
            </Button>
          );
        },
      },
      {
        title: "Files",
        key: "attachments",
        width: 100,
        render: (_: any, item: any) => {
          const count = item.attachments?.length || 0;
          return (
            <Tag color={count > 0 ? "green" : "default"} style={{ borderRadius: 6, margin: 0 }}>
              {count} {count === 1 ? 'file' : 'files'}
            </Tag>
          );
        },
      },
    ];

    return (
      <div style={{ padding: "12px 24px 24px 64px", background: "#f8fafc" }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={16} style={{ color: "#64748b" }} />
          <Text strong style={{ color: "#64748b", fontSize: 13 }}>Expense Items</Text>
        </div>
        <Table
          columns={childColumns}
          dataSource={items}
          rowKey={(item) => item.id || `item-${Math.random()}`}
          pagination={false}
          size="small"
          bordered={false}
          className="child-table"
          style={{ 
            background: "#ffffff", 
            borderRadius: 12, 
            overflow: "hidden",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)" 
          }}
        />
      </div>
    );
  };

  const columns = [
    {
      title: "Created Date",
      key: "createdAt",
      width: 150,
      render: (_: any, record: ReimbursementResponse) => (
        <Space size={12}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: "#f0f9ff", 
            color: "#0369a1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Receipt size={16} />
          </div>
          <Text strong style={{ color: "#1e293b", fontSize: 14 }}>
            {dayjs(record.createdAt).format('DD MMM YYYY')}
          </Text>
        </Space>
      ),
    },
    {
      title: "Expenses",
      key: "itemCount",
      width: 100,
      render: (_: any, record: ReimbursementResponse) => (
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
          {record.items?.length || 0} Items
        </Tag>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      width: 150,
      render: (_: any, record: ReimbursementResponse) => (
        <Text strong style={{ color: "#2563eb", fontSize: 15 }}>
          ₹{Number(record.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => {
        const status = record.status;
        let color = "default";
        if (status === "SUBMITTED") color = "processing";
        if (status === "APPROVED") color = "success";
        if (status === "REJECTED") color = "error";
        if (status === "PAID") color = "purple";

        return (
          <Tag
            style={{ borderRadius: 20, padding: "0 12px", fontWeight: 600, border: 0 }}
            color={color}
          >
            {(status || 'UNKNOWN').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "right" as const,
      render: (_: any, record: ReimbursementResponse) => {
        const enabled = isActionsEnabled(record.status);

        return (
          <Space size={4}>
            <Button
              type="text"
              icon={<Edit3 size={18} style={{ color: enabled ? "#64748b" : "#cbd5e1" }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record.id);
              }}
              disabled={deleteMutation.isPending || !enabled}
              className="action-btn"
            />
            <Popconfirm
              title="Delete Reimbursement"
              description="Are you sure you want to delete this record?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
              disabled={!enabled}
            >
              <Button
                type="text"
                danger
                icon={<Trash2 size={18} style={{ color: enabled ? "#ef4444" : "#cbd5e1" }} />}
                disabled={deleteMutation.isPending || !enabled}
                onClick={(e) => e.stopPropagation()}
                className="action-btn-danger"
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Space size={16} align="center">
            <div style={{ 
              background: "#eff6ff", 
              padding: 12, 
              borderRadius: 12, 
              color: "#2563eb",
              display: "flex",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}>
              <Receipt size={28} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>My Reimbursements</Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>Track and manage your expense claims and reimbursement status.</Text>
            </div>
          </Space>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Input 
            placeholder="Search reimbursements..." 
            prefix={<Search size={18} style={{ color: "#94a3b8" }} />}
            style={{ width: 300, borderRadius: 10, height: 44 }}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button 
            icon={<RefreshCw size={18} style={{ color: "#64748b" }} />} 
            onClick={() => refetch()}
            loading={loading}
            style={{ borderRadius: 10, height: 44, width: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<Plus size={18} />} 
            style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
            onClick={() => router.push("/reimburseCreate")}
          >
            Create New Claim
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <StatCard 
            label="Total Claims" 
            value={reimbursements.length} 
            icon={Layers} 
            color="#3b82f6" 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            label="Total Expense Items" 
            value={totalItemsCount} 
            icon={ClipboardList} 
            color="#10b981" 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            label="Total Amount" 
            value={`₹${totalAmount.toLocaleString("en-IN")}`} 
            icon={DollarSign} 
            color="#8b5cf6" 
          />
        </Col>
      </Row>

      {/* Main Table */}
      <Card 
        bodyStyle={{ padding: 0 }} 
        style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading || deleteMutation.isPending}
          size="middle"
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            expandedRowKeys: expandedRows,
            onExpand: (expanded, record) => {
              if (expanded) {
                setExpandedRows([...expandedRows, record.id]);
              } else {
                setExpandedRows(expandedRows.filter(id => id !== record.id));
              }
            },
            expandIcon: ({ expanded, onExpand, record }) => (
              <Button
                type="text"
                size="small"
                icon={expanded ? <DownOutlined /> : <RightOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(record, e);
                }}
                style={{ borderRadius: 6 }}
              />
            ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} claims`,
            style: { padding: "16px 24px" }
          }}
        />
      </Card>

      {/* Approver Modal */}
      <Modal
        title={
          <Space>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 10, color: "#2563eb", display: "flex" }}>
              <UserOutlined />
            </div>
            <span style={{ fontWeight: 700 }}>Approver Details</span>
          </Space>
        }
        open={approverModalVisible}
        onCancel={() => {
          setApproverModalVisible(false);
          setSelectedApproverItem(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setApproverModalVisible(false);
              setSelectedApproverItem(null);
            }}
            style={{ borderRadius: 8 }}
          >
            Close
          </Button>
        ]}
        width={350}
        centered
      >
        {selectedApproverItem && (
          <div className="py-6 text-center">
            {selectedApproverItem.approverDetails?.name ? (
              <div>
                <div style={{ width: 80, height: 80, background: "#f0f9ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyCenter: "center", margin: "0 auto 16px" }}>
                  <UserOutlined style={{ fontSize: 32, color: "#0369a1" }} />
                </div>
                <Text style={{ color: "#64748b", fontSize: 13, display: "block", marginBottom: 4 }}>Designated Approver</Text>
                <Title level={4} style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>
                  {selectedApproverItem.approverDetails.name}
                </Title>
              </div>
            ) : (
              <div>
                <div style={{ width: 80, height: 80, background: "#f8fafc", borderRadius: "50%", display: "flex", alignItems: "center", justifyCenter: "center", margin: "0 auto 16px" }}>
                  <UserOutlined style={{ fontSize: 32, color: "#94a3b8" }} />
                </div>
                <Text style={{ color: "#64748b", fontSize: 13, display: "block", marginBottom: 4 }}>Role-based Approver</Text>
                <Title level={4} style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>
                  {selectedApproverItem.columnApproverName || selectedApproverItem.category || 'N/A'}
                </Title>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .action-btn:hover {
          background: #f1f5f9 !important;
          color: #2563eb !important;
        }
        .action-btn-danger:hover {
          background: #fff1f2 !important;
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          padding: 16px !important;
        }
        .ant-table-row:hover > td {
          background: #f8fafc !important;
        }
        .ant-table-cell {
          padding: 16px !important;
        }
        .child-table .ant-table-thead > tr > th {
          background: #ffffff !important;
          font-size: 10px !important;
        }
        .ant-input:focus, .ant-input-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
      `}} />
    </div>
  );
}


















