





// "use client";
// import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
// import { 
//   PlusOutlined, 
//   EditOutlined, 
//   DeleteOutlined, 
//   ReloadOutlined,
//   DownOutlined,
//   RightOutlined
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { useApproverTypeMap } from "@/hooks/usereimbursementcreate"; // Keep this import
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useState, useMemo } from "react";

// export default function EmployeeTab() {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState("");
//   const [expandedRows, setExpandedRows] = useState<string[]>([]);

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch
//   } = useAllReimbursements();

//   const deleteMutation = useDeleteReimbursement();

//   // Keep approver type map
//   const approverTypeMap = useApproverTypeMap();

//   console.log('📊 Raw reimbursements data:', reimbursements);
//   console.log('📊 Approver Type Map:', approverTypeMap);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return reimbursements;

//     return reimbursements.filter((record: ReimbursementResponse) => {
//       // Get approver type for items for search
//       const childMatch = record.items?.some(item => {
//         const approverType = item.category ? 
//           approverTypeMap.get(item.category.toLowerCase()) : '';

//         return item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//                item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
//                item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
//                approverType?.toLowerCase().includes(searchText.toLowerCase());
//       });

//       // Search in parent
//       const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
//                          record.totalAmount?.toString().includes(searchText);

//       return parentMatch || childMatch;
//     });
//   }, [reimbursements, searchText, approverTypeMap]);

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
//   }, [reimbursements]);

//   const totalItems = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   }, [reimbursements]);

//   // Check if actions should be enabled (DRAFT or SUBMITTED)
//   const isActionsEnabled = (status: string) => {
//     return status === "DRAFT" || status === "SUBMITTED";
//   };

//   // Keep approver type tag function
//   const getApproverTypeTag = (category: string) => {
//     if (!category) return <Tag color="default">N/A</Tag>;

//     const approverType = approverTypeMap.get(category.toLowerCase());

//     if (!approverType) return <Tag color="default">Not Configured</Tag>;

//     switch(approverType?.toUpperCase()) {
//       case 'MANAGER':
//         return <Tag color="blue">Manager</Tag>;
//       case 'FINANCE':
//         return <Tag color="purple">Finance</Tag>;
//       case 'HR':
//         return <Tag color="green">HR</Tag>;
//       default:
//         return <Tag color="cyan">{approverType}</Tag>;
//     }
//   };

//   // Expanded row renderer for ALL child items - WITH APPROVER TYPE COLUMN
//   const expandedRowRender = (record: ReimbursementResponse) => {
//     const items = record.items || [];

//     // Child table columns - WITH APPROVER TYPE
//     const childColumns = [
//       {
//         title: "Category",
//         key: "category",
//         width: 120,
//         render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
//       },
//       {
//         title: "Date",
//         key: "date",
//         width: 120,
//         render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
//       },
//       {
//         title: "Amount",
//         key: "amount",
//         width: 100,
//         render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
//       },
//       {
//         title: "Bill No",
//         dataIndex: "billNo",
//         key: "billNo",
//         width: 100,
//       },
//       {
//         title: "Description",
//         dataIndex: "description",
//         key: "description",
//         ellipsis: true,
//         width:150,
//       },
//       // APPROVER TYPE COLUMN - KEPT
//       {
//         title: "Approvers",
//         key: "approverType",
//         width: 130,
//         render: (_: any, item: any) => getApproverTypeTag(item.category),
//       },
//       // {
//       //   title: "Attachments",
//       //   key: "attachments",
//       //   width: 100,
//       //   render: (_: any, item: any) => {
//       //     const count = item.attachments?.length || 0;
//       //     return count > 0 ? <Tag color="green">{count} file(s)</Tag> : <Tag color="default">0</Tag>;
//       //   },
//       // },
//       {
//   title: "Attachments",
//   key: "attachments",
//   width: 100,
//   render: (_: any, item: any) => {
//     // Make sure we're counting correctly
//     const attachments = item.attachments || [];
//     const count = attachments.length;

//     console.log(`Item ${item.id} attachments:`, attachments); // Debug log

//     if (count === 0) {
//       return <Tag color="default">0</Tag>;
//     } else if (count === 1) {
//       return <Tag color="green">1 file</Tag>;
//     } else {
//       return <Tag color="green">{count} files</Tag>;
//     }
//   },
// },
//     ];

//     return (
//       <div className="pl-8 pr-4 py-2 bg-gray-50">
//         <Table
//           columns={childColumns}
//           dataSource={items} // Show ALL items
//           rowKey={(item) => item.id || `item-${Math.random()}`}
//           pagination={false}
//           size="small"
//           bordered={false}
//           className="child-table"
//         />
//       </div>
//     );
//   };

//   // Parent table columns - Summary view
//   const columns = [
//     {
//       title: "Created Date",
//       key: "createdAt",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => 
//         dayjs(record.createdAt).format('DD MMM YYYY'),
//     },
//     {
//       title: "Total Items",
//       key: "itemCount",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => (
//         <Tag color="blue">{record.items?.length || 0}</Tag>
//       ),
//     },
//     {
//       title: "Total Amount",
//       key: "totalAmount",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => (
//         <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;

//         if (status === "DRAFT") return <Tag>Draft</Tag>;
//         if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
//         if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
//         if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
//         if (status === "PAID") return <Tag color="purple">Paid</Tag>;

//         return <Tag>{status}</Tag>;
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const enabled = isActionsEnabled(record.status);

//         return (
//           <Space size={4}>
//             <Button 
//               type="text" 
//               size="small" 
//               icon={<EditOutlined />} 
//               onClick={() => handleEdit(record.id)}
//               disabled={deleteMutation.isPending || !enabled}
//               title={!enabled ? "Cannot edit in current status" : ""}
//             />
//             <Popconfirm
//               title="Delete Reimbursement"
//               description="Are you sure you want to delete this reimbursement?"
//               onConfirm={() => handleDelete(record.id)}
//               okText="Yes, Delete"
//               cancelText="Cancel"
//               okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//               disabled={!enabled}
//             >
//               <Button 
//                 type="text" 
//                 size="small" 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 disabled={deleteMutation.isPending || !enabled}
//                 title={!enabled ? "Cannot delete in current status" : ""}
//               />
//             </Popconfirm>
//           </Space>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-2">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>

//         <Space size={8}>
//           <Input.Search
//             placeholder="Search by category, bill no, status, approver..."
//             allowClear
//             size="middle"
//             style={{ width: 280 }}
//             onChange={(e) => setSearchText(e.target.value)}
//           />
//           <Button
//             type="primary"
//             size="middle"
//             icon={<PlusOutlined />}
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </Space>
//       </div>

//       {/* Summary tags */}
//       <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Parent Table with Expandable Child Rows - WITH APPROVER TYPE IN EXPANDED VIEW */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || deleteMutation.isPending}
//         size="small"
//         bordered
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandedRowKeys: expandedRows,
//           onExpand: (expanded, record) => {
//             if (expanded) {
//               setExpandedRows([...expandedRows, record.id]);
//             } else {
//               setExpandedRows(expandedRows.filter(id => id !== record.id));
//             }
//           },
//           expandIcon: ({ expanded, onExpand, record }) => (
//             <Button
//               type="text"
//               size="small"
//               icon={expanded ? <DownOutlined /> : <RightOutlined />}
//               onClick={(e) => onExpand(record, e)}
//               className="mr-2"
//             />
//           ),
//           // Always show expand icon to see all items
//           rowExpandable: () => true,
//         }}
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} reimbursements`,
//         }}
//       />
//     </div>
//   );
// }


"use client";
import { Button, Table, Tag, Popconfirm, Space, Input, Modal } from "antd";
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
import { useRouter } from "next/navigation";
import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
import { useApproverTypeMap } from "@/hooks/usereimbursementcreate";
import { ReimbursementResponse } from "@/services/reimbursementcreateService";
import dayjs from "dayjs";
import { useState, useMemo } from "react";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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

  console.log('📊 Raw reimbursements data:', reimbursements);
  console.log('📊 Approver Type Map:', approverTypeMap);

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

  // Handle approver click - Manager page maari
  const handleApproverClick = (item: any, record: any) => {
    console.log("Clicked Approver Item:", item);
    console.log("Approver Details:", item.approverDetails);

    // Get approver name from column
    const approverTag = getApproverTypeTag(item.category);
    let columnApproverName = '';
    if (approverTag && typeof approverTag === 'object') {
      columnApproverName = approverTag.props?.children || '';
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

  const totalItems = useMemo(() => {
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
        return <Tag color="blue">Manager</Tag>;
      case 'FINANCE':
        return <Tag color="purple">Finance</Tag>;
      case 'HR':
        return <Tag color="green">HR</Tag>;
      default:
        return <Tag color="cyan">{approverType}</Tag>;
    }
  };

  const expandedRowRender = (record: ReimbursementResponse) => {
    const items = record.items || [];

    const childColumns = [
      {
        title: "Category",
        key: "category",
        width: 120,
        render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
      },
      {
        title: "Date",
        key: "date",
        width: 120,
        render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
      },
      {
        title: "Amount",
        key: "amount",
        width: 100,
        render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
      },
      {
        title: "Bill No",
        dataIndex: "billNo",
        key: "billNo",
        width: 100,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        width: 150,
      },
      // View Button Column - Manager page maari
      {
        title: "Approver",
        key: "approver",
        width: 100,
        render: (_: any, item: any) => {
          return (
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleApproverClick(item, record)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              View
            </Button>
          );
        },
      },
      {
        title: "Attachments",
        key: "attachments",
        width: 100,
        render: (_: any, item: any) => {
          const attachments = item.attachments || [];
          const count = attachments.length;

          if (count === 0) {
            return <Tag color="default">0</Tag>;
          } else if (count === 1) {
            return <Tag color="green">1 file</Tag>;
          } else {
            return <Tag color="green">{count} files</Tag>;
          }
        },
      },
    ];

    return (
      <div className="pl-8 pr-4 py-2 bg-gray-50">
        <Table
          columns={childColumns}
          dataSource={items}
          rowKey={(item) => item.id || `item-${Math.random()}`}
          pagination={false}
          size="small"
          bordered={false}
          className="child-table"
        />
      </div>
    );
  };

  const columns = [
    {
      title: "Created Date",
      key: "createdAt",
      width: 120,
      render: (_: any, record: ReimbursementResponse) =>
        dayjs(record.createdAt).format('DD MMM YYYY'),
    },
    {
      title: "Total Items",
      key: "itemCount",
      width: 100,
      render: (_: any, record: ReimbursementResponse) => (
        <Tag color="blue">{record.items?.length || 0}</Tag>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => (
        <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => {
        const status = record.status;

        if (status === "DRAFT") return <Tag>Draft</Tag>;
        if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
        if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
        if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
        if (status === "PAID") return <Tag color="purple">Paid</Tag>;

        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => {
        const enabled = isActionsEnabled(record.status);

        return (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
              disabled={deleteMutation.isPending || !enabled}
              title={!enabled ? "Cannot edit in current status" : ""}
            />
            <Popconfirm
              title="Delete Reimbursement"
              description="Are you sure you want to delete this reimbursement?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
              disabled={!enabled}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={deleteMutation.isPending || !enabled}
                title={!enabled ? "Cannot delete in current status" : ""}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            My Reimbursements
          </h2>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </div>

        <Space size={8}>
          <Input.Search
            placeholder="Search by category, bill no, status..."
            allowClear
            size="middle"
            style={{ width: 280 }}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            onClick={() => router.push("/reimburseCreate")}
          >
            Create New
          </Button>
        </Space>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Total Reimbursements: {reimbursements.length}
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Total Items: {totalItems}
        </Tag>
        <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
          Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
        </Tag>
      </div>

      <ZukvoLoadingOverlay loading={loading || deleteMutation.isPending} message="">
          <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredData}
                  size="small"
                  bordered
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
                        onClick={(e) => onExpand(record, e)}
                        className="mr-2"
                      />
                    ),
                    rowExpandable: () => true,
                  }}
                  pagination={{
                    pageSize: 10,
                    size: "small",
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} reimbursements`,
                  }}
                />
          </ZukvoLoadingOverlay>

      {/* Approver Modal - Manager page maari */}
      <Modal
        title="Approver"
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
          >
            Close
          </Button>
        ]}
        width={300}
      >
        {selectedApproverItem && (
          <div className="py-6 text-center">
            {selectedApproverItem.approverDetails?.name ? (
              // Approver details irundha - name mattum
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserOutlined className="text-2xl text-blue-600" />
                </div>
                <p className="text-gray-500 text-sm mb-1">Approver Name</p>
                <p className="text-xl font-semibold text-blue-600">
                  {selectedApproverItem.approverDetails.name}
                </p>
              </div>
            ) : (
              // Approver details illana - column name mattum
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserOutlined className="text-2xl text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-1">Approver Name</p>
                <p className="text-xl font-semibold text-blue-600">
                  {selectedApproverItem.columnApproverName || selectedApproverItem.category || 'N/A'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}


















