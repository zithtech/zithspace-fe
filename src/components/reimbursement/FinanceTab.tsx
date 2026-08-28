"use client";
// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Drawer } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   DollarOutlined,
//   DownOutlined,
//   RightOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useApproverTypeMap } from "@/hooks/usereimbursementcreate"; 
// import { useQueryClient } from "@tanstack/react-query";
// import dayjs from "dayjs";

// export default function ManagerReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");
//   const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
//   // Approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);
  
//   // Paid confirmation modal
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [itemToMarkPaid, setItemToMarkPaid] = useState<any>(null);
  
//   // Expanded items for multiple files
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();
//   const markAsPaidMutation = useMarkAsPaid();

//   console.log('📊 Raw reimbursements data:', reimbursements);
//    const approverTypeMap = useApproverTypeMap();



//    // Add this useEffect - COMPLETELY SAFE, just console logs
// useEffect(() => {
//   if (reimbursements && reimbursements.length > 0) {
//     console.log("========== FRONTEND APPROVER DEBUG ==========");
    
//     // Just log the first few items to check
//     const sample = reimbursements.slice(0, 3);
//     sample.forEach((reb: any) => {
//       if (reb.items && reb.items.length > 0) {
//         reb.items.forEach((item: any) => {
//           console.log(`Item ${item.id}:`, {
//             itemId: item.id,
//             approverStatus: item.approverStatus,
//             approverDetails: item.approverDetails
//           });
//         });
//       }
//     });
//   }
// }, [reimbursements]);

//   // Transform data for parent-child structure
//   // const transformedData = useMemo(() => {
//   //   if (!reimbursements || !Array.isArray(reimbursements)) {
//   //     return [];
//   //   }
    
//   //   return reimbursements.map((reimbursement: any) => {
//   //     const employeeName = reimbursement.employeeName || 
//   //                         reimbursement.createdBy?.name || 
//   //                         'N/A';
//   //     const employeeCode = reimbursement.employeeCode || 
//   //                         reimbursement.createdBy?.employee?.employee_code || 
//   //                         'N/A';
//   //     console.log(`📅 Reimbursement ${reimbursement.id}:`, {
//   //     submittedAt: reimbursement.submittedAt,
//   //     createdAt: reimbursement.createdAt,
//   //     fromObject: reimbursement
//   //   });
      
//   //     return {
//   //       id: reimbursement.id,
//   //       key: reimbursement.id,
//   //       employeeName: employeeName,
//   //       employeeCode: employeeCode,
//   //       status: reimbursement.status,
//   //       totalAmount: reimbursement.totalAmount || 0,
//   //       submittedAt: reimbursement.submittedAt, // Add this
//   //       createdAt: reimbursement.createdAt,     // Add this
//   //       items: (reimbursement.items || []).map((item: any, index: number) => ({
//   //         ...item,
//   //         key: `${reimbursement.id}-${item.id || index}`,
//   //         reimbursementId: reimbursement.id,
//   //         // Use approverStatus for approval status
//   //         approvalStatus: item.approverStatus || 'PENDING',
//   //         // Use reimbursementItemStatus for payment status
//   //         paymentStatus: item.reimbursementItemStatus || 'UNPAID',
//   //       })),
//   //     };
//   //   });
//   // }, [reimbursements]);
// const transformedData = useMemo(() => {
//   if (!reimbursements || !Array.isArray(reimbursements)) {
//     return [];
//   }
  
//   return reimbursements.map((reimbursement: any) => {
//     const employeeName = reimbursement.employeeName || 
//                         reimbursement.createdBy?.name || 
//                         'N/A';
//     const employeeCode = reimbursement.employeeCode || 
//                         reimbursement.createdBy?.employee?.employee_code || 
//                         'N/A';
    
//     // ✅ Debug log to check items count
//     console.log(`Reimbursement ${reimbursement.id}:`, {
//       itemCount: reimbursement.items?.length || 0,
//       items: reimbursement.items?.map((i: any) => ({
//         id: i.id,
//         amount: i.amount,
//         approvalStatus: i.approverStatus,
//         paymentStatus: i.reimbursementItemStatus
//       }))
//     });
    
//     return {
//       id: reimbursement.id,
//       key: reimbursement.id,
//       employeeName: employeeName,
//       employeeCode: employeeCode,
//       status: reimbursement.status,
//       totalAmount: reimbursement.totalAmount || 0,
//       submittedAt: reimbursement.submittedAt,
//       createdAt: reimbursement.createdAt,
//       items: (reimbursement.items || []).map((item: any, index: number) => ({
//         ...item,
//         key: `${reimbursement.id}-${item.id || index}`,
//         reimbursementId: reimbursement.id,
//         approvalStatus: item.approverStatus || 'PENDING',
//         paymentStatus: item.reimbursementItemStatus || 'UNPAID',
//         // ✅ Ensure amount is a number
//         amount: Number(item.amount) || 0,
//       })),
//     };
//   });
// }, [reimbursements]);


//    const getApproverTypeTag = (category: string) => {
//       if (!category) return <Tag color="default">N/A</Tag>;
      
//       const approverType = approverTypeMap.get(category.toLowerCase());
      
//       if (!approverType) return <Tag color="default">Not Configured</Tag>;
      
//       switch(approverType?.toUpperCase()) {
//         case 'MANAGER':
//           return <Tag color="blue">Manager</Tag>;
//         case 'FINANCE':
//           return <Tag color="purple">Finance</Tag>;
//         case 'HR':
//           return <Tag color="green">HR</Tag>;
//         default:
//           return <Tag color="cyan">{approverType}</Tag>;
//       }
//     };

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
    
//     return transformedData.filter((record: any) => {
//       // Search in parent
//       const parentMatch = record.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//                          record.employeeCode?.toLowerCase().includes(searchText.toLowerCase());
      
//       // Search in child items
//       const childMatch = record.items?.some((item: any) => 
//         item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.description?.toLowerCase().includes(searchText.toLowerCase())
//       );
      
//       return parentMatch || childMatch;
//     });
//   }, [transformedData, searchText]);

//   // Handle approve button click
//   const handleApproveClick = (item: any, record: any) => {
//     if (!item.id) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setItemToApprove({ ...item, employeeName: record.employeeName });
//     setApproveModalVisible(true);
//   };

//   // Confirm approve
//   const confirmApprove = () => {
//     if (!itemToApprove?.id) {
//       message.error("No item selected");
//       return;
//     }
    
//     approveMutation.mutate(itemToApprove.id, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//       }
//     });
//   };

//   // Handle paid button click
//   const handlePaidClick = (item: any, record: any) => {
//     if (!item.id) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     setItemToMarkPaid({ ...item, employeeName: record.employeeName });
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!itemToMarkPaid?.id) {
//       message.error("No item selected");
//       return;
//     }
    
//     markAsPaidMutation.mutate(itemToMarkPaid.id, {
//       onSuccess: () => {
//         message.success("Item marked as paid successfully");
//         setPaidModalVisible(false);
//         setItemToMarkPaid(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark item as paid");
//         setPaidModalVisible(false);
//         setItemToMarkPaid(null);
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (item: any, record: any) => {
//     if (!item.id) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setSelectedItem({ ...item, employeeName: record.employeeName });
//     setRejectModalVisible(true);
//   };

//   // Confirm reject
//   const confirmReject = () => {
//     if (!selectedItem?.id) {
//       message.error("No item selected");
//       return;
//     }
    
//     rejectMutation.mutate({
//       id: selectedItem.id,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: () => {
//         message.success("Item rejected successfully");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Toggle expand/collapse for multiple files
//   const toggleExpand = (itemKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemKey]: !prev[itemKey]
//     }));
//   };

//   // Handle file click
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag for APPROVAL status
//   const getApprovalStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       case 'PENDING':
//         return <Tag color="gold">Pending</Tag>;
//       default:
//         return <Tag color="default">{status || 'Unknown'}</Tag>;
//     }
//   };

//   // Get tag for PAYMENT status
//   const getPaymentStatusTag = (status: string, item: any, record: any) => {
//     const isPaid = status === 'PAID';
    
//     if (isPaid) {
//       return <Tag color="green">Paid</Tag>;
//     }
    
//     // Only show clickable Unpaid if the item is APPROVED
//     if (item.approvalStatus === 'APPROVED') {
//       return (
//         <Tag 
//           color="blue" 
//           className="cursor-pointer hover:bg-blue-100 transition-colors"
//           icon={<DollarOutlined />}
//           onClick={() => handlePaidClick(item, record)}
//         >
//           Unpaid
//         </Tag>
//       );
//     }
    
//     // If not approved, show disabled Unpaid
//     return <Tag color="gray">Unpaid</Tag>;
//   };

//   // Expanded row renderer for child items
//   const expandedRowRender = (record: any) => {
//     const items = record.items || [];
    
//     // Child table columns
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
//       },
//       {
//         title: "Documents",
//         key: "documents",
//         width: 250,
//         render: (_: any, item: any) => {
//           const attachments = item.attachments || [];
//           const itemKey = item.key;
//           const isExpanded = expandedItems[itemKey];
          
//           if (attachments.length === 0) {
//             return <span className="text-gray-400">—</span>;
//           }
          
//           if (attachments.length === 1) {
//             const file = attachments[0];
//             const fileName = file.fileName || '';
            
//             return (
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(file)}
//                 onClick={() => handleFileClick(file)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//               </Button>
//             );
//           }
          
//           const firstFile = attachments[0];
//           const remainingFiles = attachments.slice(1);
//           const fileName = firstFile.fileName || '';
          
//           return (
//             <div className="flex flex-col">
//               <div className="flex items-center gap-1">
//                 <Button
//                   type="link"
//                   size="small"
//                   icon={getFileIcon(firstFile)}
//                   onClick={() => handleFileClick(firstFile)}
//                   className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//                 >
//                   {fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName}
//                 </Button>
                
//                 <Tag 
//                   color="blue" 
//                   className="cursor-pointer hover:bg-blue-100 transition-colors"
//                   onClick={() => toggleExpand(itemKey)}
//                 >
//                   +{remainingFiles.length}
//                 </Tag>
//               </div>
              
//               {isExpanded && (
//                 <div className="flex flex-col gap-1 pl-6 mt-2 border-l-2 border-gray-200">
//                   {remainingFiles.map((file: any, index: number) => (
//                     <Button
//                       key={index}
//                       type="link"
//                       size="small"
//                       icon={getFileIcon(file)}
//                       onClick={() => handleFileClick(file)}
//                       className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//                     >
//                       {file.fileName?.length > 20 
//                         ? file.fileName.substring(0, 20) + '...' 
//                         : file.fileName}
//                     </Button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           );
//         },
//       },
   
//       {
//         title: "Approval Status",
//         key: "approvalStatus",
//         width: 120,
//         render: (_: any, item: any) => getApprovalStatusTag(item.approvalStatus),
//       },
//        {
//         title: "Approvers",
//         key: "approverType",
//         width: 130,
//         render: (_: any, item: any) => getApproverTypeTag(item.category),
//       },
//       {
//         title: "Payment Status",
//         key: "paymentStatus",
//         width: 120,
//         render: (_: any, item: any) => getPaymentStatusTag(item.paymentStatus, item, record),
//       },
//       {
//         title: "Action",
//         key: "action",
//         width: 150,
//         render: (_: any, item: any) => {
//           const isPending = item.approvalStatus === 'PENDING';
//           const isApproved = item.approvalStatus === 'APPROVED';
//           const isRejected = item.approvalStatus === 'REJECTED';
          
//           if (isApproved || isRejected) {
//             return (
//               <Space size={4}>
//                 <Button
//                   type="text"
//                   size="small"
//                   icon={<CheckOutlined />}
//                   className="text-gray-400 cursor-not-allowed"
//                   disabled={true}
//                 >
//                   Approve
//                 </Button>
//                 <Button
//                   type="text"
//                   size="small"
//                   icon={<CloseOutlined />}
//                   className="text-gray-400 cursor-not-allowed"
//                   disabled={true}
//                 >
//                   Reject
//                 </Button>
//               </Space>
//             );
//           }
          
//           return (
//             <Space size={4}>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CheckOutlined />}
//                 className="text-green-600 hover:text-green-800"
//                 onClick={() => handleApproveClick(item, record)}
//                 loading={approveMutation.isPending && approveMutation.variables === item.id}
//               >
//                 Approve
//               </Button>
              
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CloseOutlined />}
//                 className="text-red-600 hover:text-red-800"
//                 onClick={() => handleRejectClick(item, record)}
//                 loading={rejectMutation.isPending && selectedItem?.id === item.id}
//               >
//                 Reject
//               </Button>
//             </Space>
//           );
//         },
//       },
//     ];
    
//     return (
//       <div className="pl-8 pr-4 py-2 bg-gray-50">
//         <Table
//           columns={childColumns}
//           dataSource={items}
//           rowKey={(item) => item.key || `item-${Math.random()}`}
//           pagination={false}
//           size="small"
//           bordered={false}
//           className="child-table"
         
//         />
//       </div>
//     );
//   };
//   // Expanded row renderer for child items


//   // Parent table columns
//   const columns = [
//     // {
//     //   title: "Employee",
//     //   key: "employee",
//     //   width: 200,
//     //   render: (_: any, record: any) => (
//     //     <div>
//     //       <div className="font-medium">{record.employeeName}</div>
//     //     </div>
//     //   ),
//     // },
//       {
//     title: "Created Date",
//     key: "createdAt",
//     width: 120,
//     render: (_: any, record: any) => {
//       // First try to get from reimbursement object
//       const date = record.submittedAt || record.createdAt;
//       return date ? dayjs(date).format('DD MMM YYYY') : '—';
//     },
//   },
//     {
//       title: "Total Items",
//       key: "itemCount",
//       width: 100,
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.items?.length || 0}</Tag>
//       ),
//     },
//     {
//       title: "Total Amount",
//       key: "totalAmount",
//       width: 120,
//       render: (_: any, record: any) => (
//         <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Reimbursement Status",
//       key: "status",
//       width: 150,
//       render: (_: any, record: any) => {
//         const status = record.status;
//         if (status === "DRAFT") return <Tag>Draft</Tag>;
//         if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
//         if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
//         if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
//         if (status === "PAID") return <Tag color="purple">Paid</Tag>;
//         return <Tag>{status}</Tag>;
//       },
//     },
//   ];





  

//   // Calculate summary stats
//   // const totalItems = useMemo(() => {
//   //   return transformedData.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   // }, [transformedData]);

//   // const pendingItems = useMemo(() => {
//   //   return transformedData.reduce((sum, r) => 
//   //     sum + (r.items?.filter((i: any) => i.approvalStatus === 'PENDING').length || 0), 0);
//   // }, [transformedData]);

//   // const approvedItems = useMemo(() => {
//   //   return transformedData.reduce((sum, r) => 
//   //     sum + (r.items?.filter((i: any) => i.approvalStatus === 'APPROVED').length || 0), 0);
//   // }, [transformedData]);

//   // const totalAmount = useMemo(() => {
//   //   return transformedData.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
//   // }, [transformedData]);

//   // const unpaidItems = useMemo(() => {
//   //   return transformedData.reduce((sum, r) => 
//   //     sum + (r.items?.filter((i: any) => i.paymentStatus !== 'PAID').length || 0), 0);
//   // }, [transformedData]);

//   // const paidItems = useMemo(() => {
//   //   return transformedData.reduce((sum, r) => 
//   //     sum + (r.items?.filter((i: any) => i.paymentStatus === 'PAID').length || 0), 0);
//   // }, [transformedData]);






//    const totalItems = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       return sum + (reimbursement.items?.length || 0);
//     }, 0);
//   }, [transformedData]);

//   // ✅ CORRECT: Pending items count (approval pending)
//   const pendingItems = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const pendingInThisReimbursement = reimbursement.items?.filter(
//         (item: any) => item.approvalStatus === 'PENDING'
//       ).length || 0;
//       return sum + pendingInThisReimbursement;
//     }, 0);
//   }, [transformedData]);

//   // ✅ CORRECT: Approved items count
//   const approvedItems = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const approvedInThisReimbursement = reimbursement.items?.filter(
//         (item: any) => item.approvalStatus === 'APPROVED'
//       ).length || 0;
//       return sum + approvedInThisReimbursement;
//     }, 0);
//   }, [transformedData]);

//   // ✅ CORRECT: Rejected items count
//   const rejectedItems = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const rejectedInThisReimbursement = reimbursement.items?.filter(
//         (item: any) => item.approvalStatus === 'REJECTED'
//       ).length || 0;
//       return sum + rejectedInThisReimbursement;
//     }, 0);
//   }, [transformedData]);

//   // ✅ CORRECT: Total amount (sum of all items)
//   const totalAmount = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       return sum + (Number(reimbursement.totalAmount) || 0);
//     }, 0);
//   }, [transformedData]);

//   // ✅ CORRECT: Unpaid items count
//   const unpaidItems = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const unpaidInThisReimbursement = reimbursement.items?.filter(
//         (item: any) => item.paymentStatus !== 'PAID'
//       ).length || 0;
//       return sum + unpaidInThisReimbursement;
//     }, 0);
//   }, [transformedData]);

//   // ✅ CORRECT: Paid items count
//   const paidItems = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const paidInThisReimbursement = reimbursement.items?.filter(
//         (item: any) => item.paymentStatus === 'PAID'
//       ).length || 0;
//       return sum + paidInThisReimbursement;
//     }, 0);
//   }, [transformedData]);

//   // ✅ NEW: Approved amount total
//   const approvedAmount = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const approvedItemsAmount = reimbursement.items
//         ?.filter((item: any) => item.approvalStatus === 'APPROVED')
//         .reduce((itemSum: number, item: any) => itemSum + (Number(item.amount) || 0), 0) || 0;
//       return sum + approvedItemsAmount;
//     }, 0);
//   }, [transformedData]);

//   // ✅ NEW: Pending amount total
//   const pendingAmount = useMemo(() => {
//     return transformedData.reduce((sum, reimbursement) => {
//       const pendingItemsAmount = reimbursement.items
//         ?.filter((item: any) => item.approvalStatus === 'PENDING')
//         .reduce((itemSum: number, item: any) => itemSum + (Number(item.amount) || 0), 0) || 0;
//       return sum + pendingItemsAmount;
//     }, 0);
//   }, [transformedData]);

//   return (
//     <div className="p-2">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
//           </h2>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading || isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>
        
//         <Input.Search
//           placeholder="Search by employee, category, bill no..."
//           allowClear
//           size="middle"
//           style={{ width: 300 }}
//           onChange={(e) => setSearchText(e.target.value)}
//         />
//       </div>

//       {/* Summary tags */}
//       {/* <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {transformedData.length}
//         </Tag>
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
        
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Approved: {approvedItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Unpaid: {unpaidItems}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Paid: {paidItems}
//         </Tag>
//       </div> */}
//         <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Reimbursements: {transformedData.length}
//         </Tag>
//         <Tag color="geekblue" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
//           Pending: {pendingItems} (₹{pendingAmount.toFixed(2)})
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Approved: {approvedItems} (₹{approvedAmount.toFixed(2)})
//         </Tag>
//         <Tag color="red" className="!px-2 !py-0.5 !text-xs">
//           Rejected: {rejectedItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toFixed(2)}
//         </Tag>
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Unpaid: {unpaidItems}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Paid: {paidItems}
//         </Tag>
//       </div>

//       {/* Main Table with Expandable Child Rows */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching || approveMutation.isPending || rejectMutation.isPending || markAsPaidMutation.isPending}
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
//           // Always show expand icon since we want to see items
//           rowExpandable: () => true,
//         }}
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} reimbursements`,
//         }}
//       />

//       {/* Approve Modal */}
//       <Modal
//         title="Confirm Approval"
//         open={approveModalVisible}
//         onOk={confirmApprove}
//         onCancel={() => {
//           setApproveModalVisible(false);
//           setItemToApprove(null);
//         }}
//         okText="Yes, Approve"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-green-600 hover:bg-green-700" }}
//         confirmLoading={approveMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base mb-2">Are you sure you want to approve this item?</p>
//           {itemToApprove && (
//             <div className="bg-gray-50 p-3 rounded-md">
//               <p><span className="font-medium">Employee:</span> {itemToApprove.employeeName}</p>
//               <p><span className="font-medium">Category:</span> {itemToApprove.category}</p>
//               <p><span className="font-medium">Amount:</span> ₹{Number(itemToApprove.amount).toFixed(2)}</p>
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* Paid Modal */}
//       <Modal
//         title="Confirm Payment"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setItemToMarkPaid(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-blue-600 hover:bg-blue-700" }}
//         confirmLoading={markAsPaidMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base mb-2">Are you sure you want to mark this item as paid?</p>
//           {itemToMarkPaid && (
//             <div className="bg-gray-50 p-3 rounded-md">
//               <p><span className="font-medium">Employee:</span> {itemToMarkPaid.employeeName}</p>
//               <p><span className="font-medium">Category:</span> {itemToMarkPaid.category}</p>
//               <p><span className="font-medium">Amount:</span> ₹{Number(itemToMarkPaid.amount).toFixed(2)}</p>
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* Preview Drawer */}
//       <Drawer
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         placement="right"
//         width="50%"
//         onClose={() => setPreviewVisible(false)}
//         open={previewVisible}
//         destroyOnClose
//         styles={{ body: { padding: 0, height: 'calc(100vh - 55px)' } }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Drawer>

//       {/* Reject Modal */}
//       <Modal
//         title="Reject Item"
//         open={rejectModalVisible}
//         onOk={confirmReject}
//         onCancel={() => {
//           setRejectModalVisible(false);
//           setRejectRemarks("");
//           setSelectedItem(null);
//         }}
//         okText="Reject"
//         okButtonProps={{ danger: true }}
//         confirmLoading={rejectMutation.isPending}
//       >
//         <div className="py-4">
//           <label className="block mb-2 text-sm font-medium">
//             Remarks (Optional)
//           </label>
//           <Input.TextArea
//             rows={4}
//             value={rejectRemarks}
//             onChange={(e) => setRejectRemarks(e.target.value)}
//             placeholder="Enter reason for rejection..."
//           />
//         </div>
//       </Modal>
//     </div>
//   );
// }







import { Button, Table, Tag, Input, Space, Modal, message, Drawer } from "antd";
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
import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
import { useMemo, useState, useEffect } from "react";
import { useApproverTypeMap } from "@/hooks/usereimbursementcreate"; 
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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
    
    switch(approverType?.toUpperCase()) {
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
    switch(status?.toUpperCase()) {
      case 'APPROVED':
        return <Tag color="green">Approved</Tag>;
      case 'REJECTED':
        return <Tag color="red">Rejected</Tag>;
      case 'PENDING':
        return <Tag color="gold">Pending</Tag>;
      default:
        return <Tag color="default">{status || 'Unknown'}</Tag>;
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
      },
      {
        title: "Documents",
        key: "documents",
        width: 250,
        render: (_: any, item: any) => {
          const attachments = item.attachments || [];
          const itemKey = item.key;
          const isExpanded = expandedItems[itemKey];
          
          if (attachments.length === 0) {
            return <span className="text-gray-400">—</span>;
          }
          
          if (attachments.length === 1) {
            const file = attachments[0];
            const fileName = file.fileName || '';
            
            return (
              <Button
                type="link"
                size="small"
                icon={getFileIcon(file)}
                onClick={() => handleFileClick(file)}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
              </Button>
            );
          }
          
          const firstFile = attachments[0];
          const remainingFiles = attachments.slice(1);
          const fileName = firstFile.fileName || '';
          
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Button
                  type="link"
                  size="small"
                  icon={getFileIcon(firstFile)}
                  onClick={() => handleFileClick(firstFile)}
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                >
                  {fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName}
                </Button>
                
                <Tag 
                  color="blue" 
                  className="cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleExpand(itemKey)}
                >
                  +{remainingFiles.length}
                </Tag>
              </div>
              
              {isExpanded && (
                <div className="flex flex-col gap-1 pl-6 mt-2 border-l-2 border-gray-200">
                  {remainingFiles.map((file: any, index: number) => (
                    <Button
                      key={index}
                      type="link"
                      size="small"
                      icon={getFileIcon(file)}
                      onClick={() => handleFileClick(file)}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
                    >
                      {file.fileName?.length > 20 
                        ? file.fileName.substring(0, 20) + '...' 
                        : file.fileName}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: "Approval Status",
        key: "approvalStatus",
        width: 120,
        render: (_: any, item: any) => getApprovalStatusTag(item.approvalStatus),
      },
//   {
//   title: "Approvers",
//   key: "approverType",
//   width: 130,
//   render: (_: any, item: any) => {
//     // Ithu column la show aagura tag - "Abinash"
//     const approverTag = getApproverTypeTag(item.category);
    
//     // Tag la irundhu text mathiram eduppom - correct way
//     let approverName = '';
//     if (approverTag && typeof approverTag === 'object') {
//       // Tag component ah irundha, athoda children eduppom
//       approverName = approverTag.props?.children || '';
//     }
    
//     console.log("Approver name extracted:", approverName); // Debug
    
//     return (
//       <div 
//         className="cursor-pointer hover:opacity-80 transition-opacity"
//         onClick={() => handleApproverClick(item, record, approverName)}
//       >
//         {approverTag}
//       </div>
//     );
//   },
// },
{
  title: "Approver",
  key: "approver",
  width: 100,
  render: (_: any, item: any) => {
    // Get the approver name for display
    const approverTag = getApproverTypeTag(item.category);
    let approverName = '';
    if (approverTag && typeof approverTag === 'object') {
      approverName = approverTag.props?.children || '';
    }
    
    return (
      <Button 
        type="primary"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleApproverClick(item, record, approverName)}
        className="bg-blue-500 hover:bg-blue-600"
      >
        View
      </Button>
    );
  },
},
      {
        title: "Payment Status",
        key: "paymentStatus",
        width: 120,
        render: (_: any, item: any) => getPaymentStatusTag(item.paymentStatus, item, record),
      },
      {
        title: "Action",
        key: "action",
        width: 150,
        render: (_: any, item: any) => {
          const isPending = item.approvalStatus === 'PENDING';
          const isApproved = item.approvalStatus === 'APPROVED';
          const isRejected = item.approvalStatus === 'REJECTED';
          
          if (isApproved || isRejected) {
            return (
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  className="text-gray-400 cursor-not-allowed"
                  disabled={true}
                >
                  Approve
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  className="text-gray-400 cursor-not-allowed"
                  disabled={true}
                >
                  Reject
                </Button>
              </Space>
            );
          }
          
          return (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                className="text-green-600 hover:text-green-800"
                onClick={() => handleApproveClick(item, record)}
                loading={approveMutation.isPending && approveMutation.variables === item.id}
              >
                Approve
              </Button>
              
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                className="text-red-600 hover:text-red-800"
                onClick={() => handleRejectClick(item, record)}
                loading={rejectMutation.isPending && selectedItem?.id === item.id}
              >
                Reject
              </Button>
            </Space>
          );
        },
      },
    ];
    
    return (
      <div className="pl-8 pr-4 py-2 bg-gray-50">
        <Table
          columns={childColumns}
          dataSource={items}
          rowKey={(item) => item.key || `item-${Math.random()}`}
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
      render: (_: any, record: any) => {
        const date = record.submittedAt || record.createdAt;
        return date ? dayjs(date).format('DD MMM YYYY') : '—';
      },
    },
    {
      title: "Total Items",
      key: "itemCount",
      width: 100,
      render: (_: any, record: any) => (
        <Tag color="blue">{record.items?.length || 0}</Tag>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      width: 120,
      render: (_: any, record: any) => (
        <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      title: "Reimbursement Status",
      key: "status",
      width: 150,
      render: (_: any, record: any) => {
        const status = record.status;
        if (status === "DRAFT") return <Tag>Draft</Tag>;
        if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
        if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
        if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
        if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        return <Tag>{status}</Tag>;
      },
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
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Team Reimbursements
          </h2>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={loading || isRefetching}
            size="small"
          >
            Refresh
          </Button>
        </div>
        
        <Input.Search
          placeholder="Search by employee, category, bill no..."
          allowClear
          size="middle"
          style={{ width: 300 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Reimbursements: {transformedData.length}
        </Tag>
        <Tag color="geekblue" className="!px-2 !py-0.5 !text-xs">
          Total Items: {totalItems}
        </Tag>
        <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
          Pending: {pendingItems} (₹{pendingAmount.toFixed(2)})
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Approved: {approvedItems} (₹{approvedAmount.toFixed(2)})
        </Tag>
        <Tag color="red" className="!px-2 !py-0.5 !text-xs">
          Rejected: {rejectedItems}
        </Tag>
        <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
          Total Amount: ₹{totalAmount.toFixed(2)}
        </Tag>
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Unpaid: {unpaidItems}
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Paid: {paidItems}
        </Tag>
      </div>

      <ZukvoLoadingOverlay loading={loading || isRefetching || approveMutation.isPending || rejectMutation.isPending || markAsPaidMutation.isPending} message="">
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

      {/* Approver Modal - Only shows the name */}
  
{/* <Modal
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
    <div className="py-4 text-center">
      <p className="text-gray-500 mb-1">Approver Name</p>
      <p className="text-lg font-semibold text-blue-600">
        {selectedApproverItem.columnApproverName || selectedApproverItem.category || 'N/A'}
      </p>
    </div>
  )}
</Modal> */}
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
    <div className="py-4 text-center">
      <p className="text-gray-500 mb-1">Approver Name</p>
      <p className="text-lg font-semibold text-blue-600">
        {selectedApproverItem.columnApproverName || selectedApproverItem.category || 'N/A'}
      </p>
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
        okButtonProps={{ type: "primary", className: "bg-green-600 hover:bg-green-700" }}
        confirmLoading={approveMutation.isPending}
      >
        <div className="py-4">
          <p className="text-base mb-2">Are you sure you want to approve this item?</p>
          {itemToApprove && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Employee:</span> {itemToApprove.employeeName}</p>
              <p><span className="font-medium">Category:</span> {itemToApprove.category}</p>
              <p><span className="font-medium">Amount:</span> ₹{Number(itemToApprove.amount).toFixed(2)}</p>
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
        okText="Yes, Mark as Paid"
        cancelText="Cancel"
        okButtonProps={{ type: "primary", className: "bg-blue-600 hover:bg-blue-700" }}
        confirmLoading={markAsPaidMutation.isPending}
      >
        <div className="py-4">
          <p className="text-base mb-2">Are you sure you want to mark this item as paid?</p>
          {itemToMarkPaid && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Employee:</span> {itemToMarkPaid.employeeName}</p>
              <p><span className="font-medium">Category:</span> {itemToMarkPaid.category}</p>
              <p><span className="font-medium">Amount:</span> ₹{Number(itemToMarkPaid.amount).toFixed(2)}</p>
            </div>
          )}
        </div>
      </Modal>

      <Drawer
        title={
          <Space>
            <span>{previewFile?.fileName || 'Document Preview'}</span>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(previewFile)}
            >
              Download
            </Button>
          </Space>
        }
        placement="right"
        width="50%"
        onClose={() => setPreviewVisible(false)}
        open={previewVisible}
        destroyOnClose
        styles={{ body: { padding: 0, height: 'calc(100vh - 55px)' } }}
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
        title="Reject Item"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectRemarks("");
          setSelectedItem(null);
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
      >
        <div className="py-4">
          <label className="block mb-2 text-sm font-medium">
            Remarks (Optional)
          </label>
          <Input.TextArea
            rows={4}
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </div>
      </Modal>
    </div>
  );
}




