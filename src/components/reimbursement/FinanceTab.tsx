






"use client";
import { Button, Table, Tag, Input, Space, Modal, message, Drawer, Typography, Card, Row, Col } from "antd";
import {
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  FileOutlined,
  DollarOutlined,
  DownOutlined,
  RightOutlined,
  EyeOutlined
} from "@ant-design/icons";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  Eye,
  Check,
  X,
  CreditCard,
  ClipboardCheck,
  Layers
} from "lucide-react";
import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
import { useMemo, useState, useEffect } from "react";
import { useApproverTypeMap } from "@/hooks/usereimbursementcreate";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
  <Card
    bodyStyle={{ padding: "16px 20px" }}
    style={{
      borderRadius: 12,
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
          {subValue && <Text type="secondary" style={{ fontSize: 12 }}>({subValue})</Text>}
        </div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

export default function ManagerReimbursementsPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Approve confirmation modal
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [itemToApprove, setItemToApprove] = useState<any>(null);

  // Paid confirmation modal
  const [paidModalVisible, setPaidModalVisible] = useState(false);
  const [itemToMarkPaid, setItemToMarkPaid] = useState<any>(null);

  // Approver modal
  const [approverModalVisible, setApproverModalVisible] = useState(false);
  const [selectedApproverItem, setSelectedApproverItem] = useState<any>(null);

  // Drawer state for View
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState<any>(null);

  // Expanded items for multiple files
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const {
    data: reimbursements = [],
    isLoading: loading,
    refetch,
    isRefetching
  } = useManagerApprovals();

  const approveMutation = useApproveItem();
  const rejectMutation = useRejectItem();
  const markAsPaidMutation = useMarkAsPaid();

  console.log('📊 Raw reimbursements data:', reimbursements);
  const approverTypeMap = useApproverTypeMap();

  useEffect(() => {
    if (reimbursements && reimbursements.length > 0) {
      console.log("========== FRONTEND APPROVER DEBUG ==========");

      const sample = reimbursements.slice(0, 3);
      sample.forEach((reb: any) => {
        if (reb.items && reb.items.length > 0) {
          reb.items.forEach((item: any) => {
            console.log(`Item ${item.id}:`, {
              itemId: item.id,
              approverStatus: item.approverStatus,
              approverDetails: item.approverDetails
            });
          });
        }
      });
    }
  }, [reimbursements]);

  const transformedData = useMemo(() => {
    if (!reimbursements || !Array.isArray(reimbursements)) {
      return [];
    }

    return reimbursements.map((reimbursement: any) => {
      const employeeName = reimbursement.employeeName ||
        reimbursement.createdBy?.name ||
        'N/A';
      const employeeCode = reimbursement.employeeCode ||
        reimbursement.createdBy?.employee?.employee_code ||
        'N/A';

      return {
        id: reimbursement.id,
        key: reimbursement.id,
        employeeName: employeeName,
        employeeCode: employeeCode,
        status: reimbursement.status,
        totalAmount: reimbursement.totalAmount || 0,
        submittedAt: reimbursement.submittedAt,
        createdAt: reimbursement.createdAt,
        items: (reimbursement.items || []).map((item: any, index: number) => ({
          ...item,
          key: `${reimbursement.id}-${item.id || index}`,
          reimbursementId: reimbursement.id,
          approvalStatus: item.approverStatus || 'PENDING',
          paymentStatus: item.reimbursementItemStatus || 'UNPAID',
          amount: Number(item.amount) || 0,
        })),
      };
    });
  }, [reimbursements]);

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

  const filteredData = useMemo(() => {
    if (!searchText) return transformedData;

    return transformedData.filter((record: any) => {
      const parentMatch = record.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.employeeCode?.toLowerCase().includes(searchText.toLowerCase());

      const childMatch = record.items?.some((item: any) =>
        item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase())
      );

      return parentMatch || childMatch;
    });
  }, [transformedData, searchText]);

  const handleViewClick = (record: any) => {
    setSelectedViewRecord(record);
    setViewDrawerVisible(true);
  };

  const handleApproverClick = (item: any, record: any, approverName: string) => {
    console.log("Clicked Approver Item:", item);
    console.log("Approver Name from column:", approverName);
    console.log("Approver Name type:", typeof approverName);

    setSelectedApproverItem({
      ...item,
      employeeName: record.employeeName,
      columnApproverName: approverName || item.category || 'N/A' // Fallback
    });
    setApproverModalVisible(true);
  };


  const handleApproveClick = (item: any, record: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }
    setItemToApprove({ ...item, employeeName: record.employeeName });
    setApproveModalVisible(true);
  };

  const confirmApprove = () => {
    if (!itemToApprove?.id) {
      message.error("No item selected");
      return;
    }

    approveMutation.mutate(itemToApprove.id, {
      onSuccess: () => {
        message.success("Item approved successfully");
        setApproveModalVisible(false);
        setItemToApprove(null);
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
        }, 100);
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to approve item");
        setApproveModalVisible(false);
        setItemToApprove(null);
      }
    });
  };

  const handlePaidClick = (item: any, record: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }

    setItemToMarkPaid({ ...item, employeeName: record.employeeName });
    setPaidModalVisible(true);
  };

  const confirmPaid = () => {
    if (!itemToMarkPaid?.id) {
      message.error("No item selected");
      return;
    }

    markAsPaidMutation.mutate(itemToMarkPaid.id, {
      onSuccess: () => {
        message.success("Item marked as paid successfully");
        setPaidModalVisible(false);
        setItemToMarkPaid(null);
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
        }, 100);
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to mark item as paid");
        setPaidModalVisible(false);
        setItemToMarkPaid(null);
      }
    });
  };

  const handleRejectClick = (item: any, record: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }
    setSelectedItem({ ...item, employeeName: record.employeeName });
    setRejectModalVisible(true);
  };

  const confirmReject = () => {
    if (!selectedItem?.id) {
      message.error("No item selected");
      return;
    }

    rejectMutation.mutate({
      id: selectedItem.id,
      remarks: rejectRemarks || "Rejected by manager"
    }, {
      onSuccess: () => {
        message.success("Item rejected successfully");
        setRejectModalVisible(false);
        setRejectRemarks("");
        setSelectedItem(null);
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
        }, 500);
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to reject item");
        setRejectModalVisible(false);
        setRejectRemarks("");
        setSelectedItem(null);
      }
    });
  };

  const toggleExpand = (itemKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const handleFileClick = (file: any) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  const handleDownload = (file: any) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Downloading ${file.fileName}`);
  };

  const getIframeUrl = (file: any): string => {
    const fileName = file.fileName?.toLowerCase() || '';
    const fileType = file.fileType || '';

    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
    }

    if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
      fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
      fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
    }

    if (fileType?.startsWith('image/') ||
      fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') || fileName.endsWith('.gif')) {
      return file.fileUrl;
    }

    return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
  };

  const getFileIcon = (file: any) => {
    const fileName = file.fileName?.toLowerCase() || '';
    const fileType = file.fileType || '';

    if (fileName.endsWith('.pdf') || fileType === 'application/pdf')
      return <FileOutlined className="text-red-500" />;
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx'))
      return <FileOutlined className="text-blue-500" />;
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx'))
      return <FileOutlined className="text-green-500" />;
    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx'))
      return <FileOutlined className="text-orange-500" />;
    if (fileType?.startsWith('image/'))
      return <FileOutlined className="text-purple-500" />;

    return <FileOutlined className="text-gray-500" />;
  };

  const getApprovalStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <Tag color="green" style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}>APPROVED</Tag>;
      case 'REJECTED':
        return <Tag color="red" style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}>REJECTED</Tag>;
      case 'PENDING':
        return <Tag color="gold" style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}>PENDING</Tag>;
      default:
        return <Tag style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}>{(status || 'Unknown').toUpperCase()}</Tag>;
    }
  };

  const getPaymentStatusTag = (status: string, item: any, record: any) => {
    const isPaid = status === 'PAID';

    if (isPaid) {
      return <Tag color="green">Paid</Tag>;
    }

    if (item.approvalStatus === 'APPROVED') {
      return (
        <Tag
          color="blue"
          className="cursor-pointer hover:bg-blue-100 transition-colors"
          icon={<DollarOutlined />}
          onClick={() => handlePaidClick(item, record)}
        >
          Unpaid
        </Tag>
      );
    }

    return <Tag color="gray">Unpaid</Tag>;
  };

  const expandedRowRender = (record: any) => {
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
        render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text || '-'}</Text>
      },
      {
        title: "Documents",
        key: "documents",
        width: 220,
        render: (_: any, item: any) => {
          const attachments = item.attachments || [];
          const itemKey = item.key;
          const isExpanded = expandedItems[itemKey];

          if (attachments.length === 0) {
            return <Text type="secondary" style={{ fontSize: 11 }}>No files</Text>;
          }

          if (attachments.length === 1) {
            const file = attachments[0];
            const fileName = file.fileName || 'Document';

            return (
              <Button
                type="link"
                size="small"
                icon={<FileText size={14} />}
                onClick={() => handleFileClick(file)}
                style={{ height: "auto", padding: 0, fontSize: 12, display: "flex", alignItems: "center" }}
              >
                {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
              </Button>
            );
          }

          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  type="link"
                  size="small"
                  icon={<FileText size={14} />}
                  onClick={() => handleFileClick(attachments[0])}
                  style={{ height: "auto", padding: 0, fontSize: 12 }}
                >
                  {attachments[0].fileName?.length > 15
                    ? attachments[0].fileName.substring(0, 15) + '...'
                    : attachments[0].fileName}
                </Button>
                <Tag
                  color="blue"
                  style={{ borderRadius: 6, cursor: "pointer", margin: 0, fontSize: 10 }}
                  onClick={() => toggleExpand(itemKey)}
                >
                  +{attachments.length - 1}
                </Tag>
              </div>

              {isExpanded && (
                <div style={{ paddingLeft: 12, marginTop: 8, borderLeft: "2px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 4 }}>
                  {attachments.slice(1).map((file: any, index: number) => (
                    <Button
                      key={index}
                      type="link"
                      size="small"
                      icon={<FileText size={12} />}
                      onClick={() => handleFileClick(file)}
                      style={{ height: "auto", padding: 0, fontSize: 11, textAlign: "left" }}
                    >
                      {file.fileName?.length > 20 ? file.fileName.substring(0, 20) + '...' : file.fileName}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: "Approver",
        key: "approver",
        width: 100,
        render: (_: any, item: any) => {
          const approverTag = getApproverTypeTag(item.category);
          let approverName = '';
          if (approverTag && typeof approverTag === 'object') {
            approverName = (approverTag as any).props?.children || '';
          }

          return (
            <Button
              type="text"
              size="small"
              icon={<Eye size={16} style={{ color: "#3b82f6" }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleApproverClick(item, record, approverName);
              }}
              style={{ borderRadius: 6 }}
            >
              View
            </Button>
          );
        },
      },
      {
        title: "Payment",
        key: "paymentStatus",
        width: 120,
        render: (_: any, item: any) => {
          const isPaid = item.paymentStatus === 'PAID';
          if (isPaid) return <Tag color="green" style={{ borderRadius: 20 }}>PAID</Tag>;

          if (item.approvalStatus === 'APPROVED') {
            return (
              <Tag
                color="blue"
                style={{ borderRadius: 20, cursor: "pointer" }}
                icon={<CreditCard size={12} />}
                onClick={() => handlePaidClick(item, record)}
              >
                PAY NOW
              </Tag>
            );
          }
          return <Tag style={{ borderRadius: 20 }}>UNPAID</Tag>;
        },
      },
      {
        title: "Action",
        key: "action",
        width: 180,
        align: "right" as const,
        render: (_: any, item: any) => {
          const isPending = item.approvalStatus === 'PENDING';

          if (!isPending) {
            return (
              <span style={{ color: "#94a3b8", fontSize: 12 }}>
                {item.approvalStatus}
              </span>
            );
          }

          return (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<Check size={16} style={{ color: "#10b981" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproveClick(item, record);
                }}
                className="action-btn"
              >
                Approve
              </Button>

              <Button
                type="text"
                size="small"
                danger
                icon={<X size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectClick(item, record);
                }}
                className="action-btn-danger"
              >
                Reject
              </Button>
            </Space>
          );
        },
      },
    ];

    return (
      <div style={{ padding: "12px 24px 24px 64px", background: "#f8fafc" }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardCheck size={16} style={{ color: "#64748b" }} />
          <Text strong style={{ color: "#64748b", fontSize: 13 }}>Team Member's Expense Items</Text>
        </div>
        <Table
          columns={childColumns}
          dataSource={items}
          rowKey={(item) => item.key || `item-${Math.random()}`}
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
      title: "Team Member",
      key: "employee",
      width: 250,
      render: (_: any, record: any) => (
        <Space size={12}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#f0f9ff",
            color: "#0369a1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14
          }}>
            {record.employeeName?.charAt(0)}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{record.employeeName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.employeeCode}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Created Date",
      key: "createdAt",
      width: 150,
      render: (_: any, record: any) => {
        const date = record.submittedAt || record.createdAt;
        return (
          <Text style={{ color: "#64748b", fontSize: 13 }}>
            {date ? dayjs(date).format('DD MMM YYYY') : '—'}
          </Text>
        );
      },
    },
    {
      title: "Requested Amount",
      key: "totalAmount",
      width: 150,
      render: (_: any, record: any) => (
        <Text strong style={{ color: "#2563eb", fontSize: 15 }}>
          ₹{Number(record.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: "Claim Status",
      key: "status",
      width: 150,
      render: (_: any, record: any) => {
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
      title: "Action",
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<Eye size={18} style={{ color: "#3b82f6" }} />}
          onClick={(e) => {
            e.stopPropagation();
            handleViewClick(record);
          }}
          className="action-btn"
          style={{ borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          View
        </Button>
      ),
    },
  ];

  const totalItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      return sum + (reimbursement.items?.length || 0);
    }, 0);
  }, [transformedData]);

  const pendingItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const pendingInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.approvalStatus === 'PENDING'
      ).length || 0;
      return sum + pendingInThisReimbursement;
    }, 0);
  }, [transformedData]);

  const approvedItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const approvedInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.approvalStatus === 'APPROVED'
      ).length || 0;
      return sum + approvedInThisReimbursement;
    }, 0);
  }, [transformedData]);

  const rejectedItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const rejectedInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.approvalStatus === 'REJECTED'
      ).length || 0;
      return sum + rejectedInThisReimbursement;
    }, 0);
  }, [transformedData]);

  const totalAmount = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      return sum + (Number(reimbursement.totalAmount) || 0);
    }, 0);
  }, [transformedData]);

  const unpaidItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const unpaidInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.paymentStatus !== 'PAID'
      ).length || 0;
      return sum + unpaidInThisReimbursement;
    }, 0);
  }, [transformedData]);

  const paidItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const paidInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.paymentStatus === 'PAID'
      ).length || 0;
      return sum + paidInThisReimbursement;
    }, 0);
  }, [transformedData]);

  const approvedAmount = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const approvedItemsAmount = reimbursement.items
        ?.filter((item: any) => item.approvalStatus === 'APPROVED')
        .reduce((itemSum: number, item: any) => itemSum + (Number(item.amount) || 0), 0) || 0;
      return sum + approvedItemsAmount;
    }, 0);
  }, [transformedData]);

  const pendingAmount = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const pendingItemsAmount = reimbursement.items
        ?.filter((item: any) => item.approvalStatus === 'PENDING')
        .reduce((itemSum: number, item: any) => itemSum + (Number(item.amount) || 0), 0) || 0;
      return sum + pendingItemsAmount;
    }, 0);
  }, [transformedData]);

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
              <ShieldCheck size={28} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Reimbursement Approvals</Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>Review and process team expense claims and reimbursement requests.</Text>
            </div>
          </Space>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            placeholder="Search by member or bill..."
            prefix={<Search size={18} style={{ color: "#94a3b8" }} />}
            style={{ width: 300, borderRadius: 10, height: 44 }}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button
            icon={<RefreshCw size={18} style={{ color: "#64748b" }} />}
            onClick={() => refetch()}
            loading={loading || isRefetching}
            style={{ borderRadius: 10, height: 44, width: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <StatCard
            label="Pending Requests"
            value={pendingItems}
            subValue={`₹${pendingAmount.toLocaleString()}`}
            icon={Clock}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            label="Approved Volume"
            value={`₹${approvedAmount.toLocaleString()}`}
            subValue={`${approvedItems} items`}
            icon={CheckCircle}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            label="Total Requests"
            value={transformedData.length}
            icon={ClipboardCheck}
            color="#3b82f6"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            label="Pending Payment"
            value={unpaidItems}
            icon={CreditCard}
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
          loading={loading || isRefetching || approveMutation.isPending || rejectMutation.isPending || markAsPaidMutation.isPending}
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
              <User size={18} />
            </div>
            <span style={{ fontWeight: 700 }}>Approver Information</span>
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
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, background: "#f0f9ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <User size={32} style={{ color: "#0369a1" }} />
            </div>
            <Text style={{ color: "#64748b", fontSize: 13, display: "block", marginBottom: 4 }}>
              {selectedApproverItem.approverDetails?.name ? "Designated Approver" : "Role-based Approver"}
            </Text>
            <Title level={4} style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>
              {selectedApproverItem.approverDetails?.name || selectedApproverItem.columnApproverName || selectedApproverItem.category || 'N/A'}
            </Title>
          </div>
        )}
      </Modal>

      <Modal
        title="Confirm Approval"
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setItemToApprove(null);
        }}
        okText="Yes, Approve"
        cancelText="Cancel"
        okButtonProps={{ type: "primary", style: { background: "#10b981", borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        confirmLoading={approveMutation.isPending}
        centered
      >
        <div style={{ padding: "16px 0" }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Are you sure you want to approve this item?</p>
          {itemToApprove && (
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 8 }}><Text type="secondary">Employee:</Text> <Text strong>{itemToApprove.employeeName}</Text></div>
              <div style={{ marginBottom: 8 }}><Text type="secondary">Category:</Text> <Text strong>{itemToApprove.category}</Text></div>
              <div><Text type="secondary">Amount:</Text> <Text strong style={{ color: "#10b981" }}>₹{Number(itemToApprove.amount).toFixed(2)}</Text></div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Confirm Payment"
        open={paidModalVisible}
        onOk={confirmPaid}
        onCancel={() => {
          setPaidModalVisible(false);
          setItemToMarkPaid(null);
        }}
        okText="Mark as Paid"
        cancelText="Cancel"
        okButtonProps={{ type: "primary", style: { background: "#3b82f6", borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        confirmLoading={markAsPaidMutation.isPending}
        centered
      >
        <div style={{ padding: "16px 0" }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Confirm payment for this expense item?</p>
          {itemToMarkPaid && (
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 8 }}><Text type="secondary">Employee:</Text> <Text strong>{itemToMarkPaid.employeeName}</Text></div>
              <div style={{ marginBottom: 8 }}><Text type="secondary">Category:</Text> <Text strong>{itemToMarkPaid.category}</Text></div>
              <div><Text type="secondary">Amount:</Text> <Text strong style={{ color: "#2563eb" }}>₹{Number(itemToMarkPaid.amount).toFixed(2)}</Text></div>
            </div>
          )}
        </div>
      </Modal>

      <Drawer
        title={
          <Space size={12}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 10, color: "#2563eb", display: "flex" }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{previewFile?.fileName || 'Document Preview'}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Review attachment before approval</div>
            </div>
          </Space>
        }
        placement="right"
        width="60%"
        onClose={() => setPreviewVisible(false)}
        open={previewVisible}
        destroyOnClose
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(previewFile)}
            style={{ borderRadius: 8 }}
          >
            Download
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        {previewFile && (
          <iframe
            src={getIframeUrl(previewFile)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={previewFile.fileName}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            referrerPolicy="no-referrer"
            allow="autoplay *; fullscreen *"
          />
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <AlertTriangle size={18} style={{ color: "#ef4444" }} />
            <span>Reject Item</span>
          </Space>
        }
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectRemarks("");
          setSelectedItem(null);
        }}
        okText="Reject Item"
        okButtonProps={{ danger: true, style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        confirmLoading={rejectMutation.isPending}
        centered
      >
        <div style={{ padding: "16px 0" }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>Reason for Rejection</Text>
          <Input.TextArea
            rows={4}
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="Please provide a reason for the employee..."
            style={{ borderRadius: 10 }}
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
            The employee will see this remark in their reimbursement status.
          </Text>
        </div>
      </Modal>

      {/* View Details Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 10, color: "#2563eb", display: "flex" }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Reimbursement Details</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>Reference ID: {selectedViewRecord?.id?.substring(0, 8).toUpperCase()}</div>
            </div>
          </div>
        }
        placement="right"
        onClose={() => {
          setViewDrawerVisible(false);
          setSelectedViewRecord(null);
        }}
        open={viewDrawerVisible}
        width={850}
        styles={{
          header: { borderBottom: "1px solid #f1f5f9", padding: "16px 24px" },
          body: { padding: 0, background: "#f8fafc" }
        }}
      >
        {selectedViewRecord && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header Stats in Drawer */}
            <div style={{ padding: "24px", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Requested By</Text>
                    <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{selectedViewRecord.employeeName}</Text>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{selectedViewRecord.employeeCode}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Total Amount</Text>
                    <Text strong style={{ fontSize: 18, color: "#2563eb" }}>₹{Number(selectedViewRecord.totalAmount).toLocaleString("en-IN")}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Claim Status</Text>
                    {getApprovalStatusTag(selectedViewRecord.status)}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Items Table */}
            <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={18} style={{ color: "#64748b" }} />
                <Text strong style={{ fontSize: 15, color: "#1e293b" }}>Expense Items</Text>
                <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{selectedViewRecord.items?.length || 0} ITEMS</Tag>
              </div>
              
              <Table
                columns={[
                  {
                    title: "Category",
                    key: "category",
                    render: (_: any, item: any) => (
                      <Space>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Layers size={14} />
                        </div>
                        <Text strong style={{ fontSize: 13 }}>{item.category}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: "Date",
                    key: "date",
                    render: (_: any, item: any) => <Text style={{ fontSize: 13 }}>{dayjs(item.date).format('DD MMM YYYY')}</Text>,
                  },
                  {
                    title: "Amount",
                    key: "amount",
                    render: (_: any, item: any) => <Text strong style={{ color: "#2563eb" }}>₹{Number(item.amount).toFixed(2)}</Text>,
                  },
                  {
                    title: "Bill Details",
                    key: "bill",
                    render: (_: any, item: any) => (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{item.billNo || 'No Bill #'}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{item.description}</div>
                      </div>
                    ),
                  },
                  {
                    title: "Status",
                    key: "status",
                    render: (_: any, item: any) => getApprovalStatusTag(item.approvalStatus),
                  },
                  {
                    title: "Docs",
                    key: "docs",
                    width: 100,
                    render: (_: any, item: any) => {
                      const count = item.attachments?.length || 0;
                      return (
                        <Button 
                          type="link" 
                          size="small" 
                          disabled={count === 0}
                          onClick={() => {
                            if (count > 0) {
                              setPreviewFile(item.attachments[0]);
                              setPreviewVisible(true);
                            }
                          }}
                        >
                          {count} {count === 1 ? 'File' : 'Files'}
                        </Button>
                      );
                    }
                  }
                ]}
                dataSource={selectedViewRecord.items}
                pagination={false}
                rowKey="key"
                className="view-drawer-table"
                style={{ background: "#ffffff", borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9" }}
              />

              <div style={{ marginTop: 24, padding: "20px", background: "#f1f5f9", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Clock size={16} style={{ color: "#64748b" }} />
                  <Text strong style={{ fontSize: 13, color: "#475569" }}>Submission Timeline</Text>
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Submitted on <Text strong>{dayjs(selectedViewRecord.submittedAt || selectedViewRecord.createdAt).format('DD MMMM YYYY [at] hh:mm A')}</Text>
                </div>
              </div>
            </div>
            
            <div style={{ padding: "16px 24px", background: "#ffffff", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
              <Button onClick={() => setViewDrawerVisible(false)} style={{ borderRadius: 8 }}>
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .action-btn:hover {
          background: #f1f5f9 !important;
          color: #10b981 !important;
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
        .child-table .ant-table-cell {
          padding: 12px 16px !important;
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




