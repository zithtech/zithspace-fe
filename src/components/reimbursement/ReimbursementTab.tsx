

// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import ProtectedRoute from "@/components/common/ProtectedRoute";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Modal,
//   notification,
//   Space,
//   Typography,
//   Tooltip,
//   Popconfirm,
//   Switch,
//   Row,
//   Col,
//   InputNumber,
//   Collapse,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import {
//   useReimbursementConfigs,
//   useCreateReimbursementConfig,
//   useUpdateReimbursementConfig,
//   useDeleteReimbursementConfig,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// // Category Types (7 sample default values)
// const CATEGORY_TYPES = [
//   "Medical",
//   "Travel",
//   "Food",
//   "Accommodation",
//   "Education",
//   "Transportation",
//   "Communication",
// ];

// interface ReimbursementRecord {
//   key: string;
//   origin: string;
//   subOrigin: string; // Display name
//   subOriginId: string; // ID sent to backend
//   categoryType: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
// }

// // Interface for grouped data (for editing like Position Configuration)
// interface GroupedReimbursement {
//   key: string;
//   origin: string;
//   subOriginId: string;
//   subOriginLabel: string;
//   configurations: ReimbursementRecord[];
// }

// // Interface for sub-origin options
// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// // Styles for switch cards (from Position Configuration)
// const switchRowCard = {
//   display: "flex",
//   justifyContent: "space-between",
//   alignItems: "center",
//   padding: "10px 12px",
//   border: "1px solid #f0f0f0",
//   borderRadius: 8,
//   marginBottom: 12,
//   background: "#fafafa",
// };

// const switchTitle = {
//   fontSize: 14,
//   fontWeight: 600,
// };

// const switchDesc = {
//   fontSize: 12,
//   color: "#8c8c8c",
//   marginTop: 2,
// };

// // Calculate monthly/yearly amounts
// const calculateAmounts = (amount: any, period: "MONTH" | "YEAR") => {
//   const numAmount = Number(amount) || 0;
  
//   if (period === "MONTH") {
//     return {
//       monthly: numAmount,
//       yearly: numAmount * 12,
//     };
//   } else {
//     return {
//       monthly: numAmount / 12,
//       yearly: numAmount,
//     };
//   }
// };

// // Category Config List Component with monthly/yearly preview
// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
// }) => {
//   const [activeKey, setActiveKey] = useState<string | string[] | number | number[]>(
//     fields.length > 0 ? fields[0].key : []
//   );
//   const prevFieldsLength = useRef(fields.length);

//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length]);

//   return (
//     <>
//       <Collapse
//         accordion
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }) => {
//           const selectedInOtherRows = (categoryConfigs || [])
//             .filter((_: any, index: number) => index !== name)
//             .map((item: any) => item?.categoryType)
//             .filter(Boolean);

//           const currentCategoryType = categoryConfigs?.[name]?.categoryType;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;
          
//           // Calculate preview amounts if both amount and period exist
//           const previewAmounts = currentAmount && currentPeriod 
//             ? calculateAmounts(currentAmount, currentPeriod)
//             : null;

//           return {
//             key: key,
//             label: currentCategoryType || `Category Type ${name + 1}`,
//             extra:
//               fields.length > 1 ? (
//                 <Popconfirm
//                   title="Are you sure you want to delete?"
//                   onConfirm={() => remove(name)}
//                   onCancel={(e) => e?.stopPropagation()}
//                 >
//                   <DeleteOutlined
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ color: "red" }}
//                   />
//                 </Popconfirm>
//               ) : null,
//             children: (
//               <>
//                 <Form.Item name={[name, "id"]} hidden>
//                   <Input />
//                 </Form.Item>
                
//                 <Row gutter={12}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryType"]}
//                       label="Category Type"
//                       rules={[{ required: true, message: "Please select category type" }]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                       >
//                         {CATEGORY_TYPES.filter(
//                           (type) => !selectedInOtherRows.includes(type)
//                         ).map((type) => (
//                           <Option key={type} value={type}>
//                             {type}
//                           </Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
                  
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label="Amount"
//                       rules={[{ required: true, message: "Please enter amount" }]}
//                     >
//                       <InputNumber
//                         min={0}
//                         precision={2}
//                         style={{ width: "100%" }}
//                         placeholder="Amount"
//                         prefix="₹"
//                       />
//                     </Form.Item>
//                   </Col>
                  
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "period"]}
//                       label="Period"
//                       rules={[{ required: true, message: "Please select period" }]}
//                     >
//                       <Select placeholder="Period">
//                         <Option value="MONTH">Per Month</Option>
//                         <Option value="YEAR">Per Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 {/* Monthly/Yearly Preview */}
//                 {previewAmounts && (
//                   <Card 
//                     size="small" 
//                     style={{ 
//                       background: "#f5f5f5", 
//                       marginBottom: 12,
//                       border: "1px dashed #d9d9d9"
//                     }}
//                   >
//                     <Row gutter={16}>
//                       <Col span={12}>
//                         <Text type="secondary">Monthly:</Text>
//                         <div>
//                           <Text strong style={{ color: "#1890ff" }}>
//                             ₹{previewAmounts.monthly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                       <Col span={12}>
//                         <Text type="secondary">Yearly:</Text>
//                         <div>
//                           <Text strong style={{ color: "#52c41a" }}>
//                             ₹{previewAmounts.yearly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}

//                 {/* Status Switch - same style as Position Configuration */}
//                 <div style={{ ...switchRowCard, marginBottom: 0 }}>
//                   <div>
//                     <div style={switchTitle}>Status</div>
//                     <div style={switchDesc}>Category type is active</div>
//                   </div>

//                   <Form.Item
//                     {...restField}
//                     name={[name, "status"]}
//                     valuePropName="checked"
//                     initialValue={true}
//                     noStyle
//                   >
//                     <Switch />
//                   </Form.Item>
//                 </div>
//               </>
//             ),
//           };
//         })}
//       />
//       <Button
//         type="dashed"
//         block
//         onClick={() => add()}
//         style={{ marginTop: 12 }}
//       >
//         + Add Another Category Type
//       </Button>
//     </>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingKey, setDeletingKey] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);

//   // Hooks for data
//   const { data: configs, isLoading, refetch } = useReimbursementConfigs();
  
//   console.log("Configs data from API:", configs);

//   const createConfig = useCreateReimbursementConfig();
//   const updateConfig = useUpdateReimbursementConfig();
//   const deleteConfig = useDeleteReimbursementConfig();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         // Convert to SubOriginOption format
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User"
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

//   // Create lookup maps for faster access
//   const membersMap = useMemo(() => {
//     return members.reduce((acc, member) => {
//       acc[member.id] = member.name;
//       return acc;
//     }, {} as Record<string, string>);
//   }, [members]);

//   const gradesMap = useMemo(() => {
//     return grades.reduce((acc, grade) => {
//       acc[grade.id] = grade.name;
//       return acc;
//     }, {} as Record<string, string>);
//   }, [grades]);

//   const departmentsMap = useMemo(() => {
//     return departments.reduce((acc, dept) => {
//       acc[dept.id] = dept.name;
//       return acc;
//     }, {} as Record<string, string>);
//   }, [departments]);

//   const subDepartmentsMap = useMemo(() => {
//     return subDepartments.reduce((acc, subDept) => {
//       acc[subDept.id] = subDept.name;
//       return acc;
//     }, {} as Record<string, string>);
//   }, [subDepartments]);

//   const positionsMap = useMemo(() => {
//     return positions.reduce((acc, pos) => {
//       acc[pos.id] = pos.title;
//       return acc;
//     }, {} as Record<string, string>);
//   }, [positions]);

//   // Helper function to get sub-origin label
//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") {
//       return membersMap[subOriginId] || subOriginId;
//     } else if (origin === "Grade") {
//       return gradesMap[subOriginId] || subOriginId;
//     } else if (origin === "Department") {
//       return departmentsMap[subOriginId] || subOriginId;
//     } else if (origin === "Sub-department") {
//       return subDepartmentsMap[subOriginId] || subOriginId;
//     } else if (origin === "Position") {
//       return positionsMap[subOriginId] || subOriginId;
//     }
//     return subOriginId;
//   };

//   // Group configurations by origin and subOrigin (for editing like Position Configuration)
//   const groupedData = useMemo(() => {
//     if (!configs) return [];
    
//     const groups: Record<string, GroupedReimbursement> = {};
    
//     configs.forEach((config) => {
//       const groupKey = `${config.origin}-${config.subOrigin}`;
      
//       if (!groups[groupKey]) {
//         groups[groupKey] = {
//           key: groupKey,
//           origin: config.origin,
//           subOriginId: config.subOrigin,
//           subOriginLabel: getSubOriginLabel(config.origin, config.subOrigin),
//           configurations: [],
//         };
//       }
      
//       groups[groupKey].configurations.push({
//         key: config.id,
//         origin: config.origin,
//         subOrigin: getSubOriginLabel(config.origin, config.subOrigin),
//         subOriginId: config.subOrigin,
//         categoryType: config.categoryType,
//         amount: config.amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount,
//         yearlyAmount: config.yearlyAmount,
//       });
//     });
    
//     return Object.values(groups);
//   }, [configs, membersMap, gradesMap, departmentsMap, subDepartmentsMap, positionsMap, getSubOriginLabel]);

//   // Transform data for table with proper mapping (keeping all original columns)
//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) {
//       console.log("No configs available yet");
//       return [];
//     }
    
//     // Ensure configs is an array
//     const configArray = Array.isArray(configs) ? configs : [];
    
//     if (configArray.length === 0) {
//       console.log("Configs array is empty");
//       return [];
//     }

//     console.log("Transforming configs:", configArray);

//     return configArray.map((config) => {
//       // Get the label for sub-origin based on origin type
//       let subOriginLabel = config.subOrigin;
      
//       if (config.origin === "User") {
//         subOriginLabel = membersMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Grade") {
//         subOriginLabel = gradesMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Department") {
//         subOriginLabel = departmentsMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Sub-department") {
//         subOriginLabel = subDepartmentsMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Position") {
//         subOriginLabel = positionsMap[config.subOrigin] || config.subOrigin;
//       }

//       // Ensure amount is a number
//       const amount = Number(config.amount) || 0;

//       return {
//         key: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryType: config.categoryType,
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//       };
//     });
//   }, [configs, membersMap, gradesMap, departmentsMap, subDepartmentsMap, positionsMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];

//     switch (originType) {
//       case "User":
//         return members.map((m) => ({ 
//           label: m.name, 
//           value: m.id // Send ID as value
//         }));
//       case "Grade":
//         return grades.map((g) => ({ 
//           label: g.name, 
//           value: g.id // Send ID as value
//         }));
//       case "Department":
//         return departments.map((d) => ({ 
//           label: d.name, 
//           value: d.id // Send ID as value
//         }));
//       case "Sub-department":
//         return subDepartments.map((sd) => ({ 
//           label: sd.name, 
//           value: sd.id // Send ID as value
//         }));
//       case "Position":
//         return positions.map((p) => ({ 
//           label: p.title, 
//           value: p.id // Send ID as value
//         }));
//       default:
//         return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade":
//         return gradesLoading;
//       case "Department":
//         return departmentsLoading;
//       case "Sub-department":
//         return subDepartmentsLoading;
//       case "Position":
//         return positionsLoading;
//       default:
//         return false;
//     }
//   };

//   // Original columns - keeping all existing columns
//   const columns: ColumnsType<ReimbursementRecord> = [
//     {
//       title: "Origin",
//       dataIndex: "origin",
//       key: "origin",
//       align: "center",
//       sorter: (a, b) => a.origin.localeCompare(b.origin),
//       render: (text: string) => <Text strong>{text}</Text>,
//     },
//     {
//       title: "Sub-Origin",
//       dataIndex: "subOrigin",
//       key: "subOrigin",
//       align: "center",
//       render: (text: string) => <Text>{text || "-"}</Text>,
//     },
//     {
//       title: "Category Type",
//       dataIndex: "categoryType",
//       key: "categoryType",
//       align: "center",
//       render: (text: string) => <Tag color="blue">{text}</Tag>,
//     },
//     {
//       title: "Amount",
//       dataIndex: "amount",
//       key: "amount",
//       align: "center",
//       render: (amount: any) => {
//         const numAmount = Number(amount) || 0;
//         return `₹${numAmount}`;
//       },
//     },
//     {
//       title: "Period",
//       dataIndex: "period",
//       key: "period",
//       align: "center",
//       render: (period: string) => (
//         <Tag color={period === "MONTH" ? "green" : "orange"}>
//           {period === "MONTH" ? "Per Month" : "Per Year"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Monthly Amount",
//       key: "monthlyAmount",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const amounts = calculateAmounts(record.amount, record.period);
//         return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
//       },
//     },
//     {
//       title: "Yearly Amount",
//       key: "yearlyAmount",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const amounts = calculateAmounts(record.amount, record.period);
//         return <Text>₹{amounts.yearly.toFixed(2)}</Text>;
//       },
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       align: "center",
//       render: (status: string) => (
//         <Tag color={status === "ACTIVE" ? "success" : "error"}>{status}</Tag>
//       ),
//     },
//     {
//       title: "Action",
//       key: "action",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => (
//         <Space>
//           <Tooltip title="Edit">
//             <Button
//               type="text"
//               icon={<EditOutlined />}
//               onClick={() => handleEdit(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Delete this reimbursement configuration?"
//               onConfirm={() => handleDelete(record.key)}
//               okButtonProps={{ loading: deletingKey === record.key }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingKey}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleEdit = (record: ReimbursementRecord) => {
//     setEditingKey(record.key);
    
//     // Find the group that contains this record (for editing multiple configs under same origin)
//     const group = groupedData.find(g => 
//       g.configurations.some(c => c.key === record.key)
//     );
    
//     if (group) {
//       // Format all configurations in the group for the form (like Position Configuration)
//       const configsForForm = group.configurations.map((config) => ({
//         id: config.key,
//         categoryType: config.categoryType,
//         amount: config.amount,
//         period: config.period,
//         status: config.status === "ACTIVE",
//       }));

//       form.setFieldsValue({
//         origin: group.origin,
//         subOriginId: group.subOriginId,
//         categoryConfigs: configsForForm.length > 0 ? configsForForm : [{}],
//       });
//     } else {
//       // Fallback to single config edit
//       form.setFieldsValue({
//         origin: record.origin,
//         subOriginId: record.subOriginId,
//         categoryConfigs: [{
//           id: record.key,
//           categoryType: record.categoryType,
//           amount: record.amount,
//           period: record.period,
//           status: record.status === "ACTIVE",
//         }],
//       });
//     }
    
//     setIsModalVisible(true);
//   };

//   const handleDelete = async (key: string) => {
//     setDeletingKey(key);
//     try {
//       await deleteConfig.mutateAsync(key);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingKey(null);
//     }
//   };

//   const handleSave = async (values: any) => {
//     setIsSaving(true);
//     try {
//       const { origin, subOriginId, categoryConfigs } = values;
      
//       if (editingKey) {
//         // Update existing configurations
//         for (const config of categoryConfigs) {
//           if (config.id) {
//             // Update existing
//             await updateConfig.mutateAsync({
//               id: config.id,
//               data: {
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryType,
//                 amount: config.amount,
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//               },
//             });
//           } else {
//             // Create new
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryType,
//               amount: config.amount,
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//             });
//           }
//         }
//       } else {
//         // Create new configurations
//         for (const config of categoryConfigs) {
//           await createConfig.mutateAsync({
//             origin,
//             subOrigin: subOriginId,
//             categoryType: config.categoryType,
//             amount: config.amount,
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//           });
//         }
//       }

//       api.success({
//         message: "Configuration saved successfully",
//         placement: "topRight",
//       });

//       setIsModalVisible(false);
//       form.resetFields();
//       setEditingKey(null);
//       refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to save configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // Custom filter function for Select components
//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   return (
//     <ProtectedRoute>
    
//         {contextHolder}
//         <div style={{ padding: 0 }}>
//           {/* Main Card */}
//           {/* <Card style={{ marginTop: 0 }}> */}
//             {/* Header Section - Left and Right side */}
//             <div style={{ 
//               display: "flex", 
//               justifyContent: "space-between", 
//               alignItems: "flex-start",
//               marginBottom: "16px"
//             }}>
//               {/* Left side - Title and Tags */}
//               <div>
//                 <Space align="center" style={{ marginBottom: "8px" }}>
//                   <WalletOutlined style={{ fontSize: "28px", color: "#1677ff" }} />
//                   <Title level={3} style={{ margin: 0 }}>
//                     Reimbursement Configuration
//                   </Title>
//                 </Space>
//                 <Text type="secondary" style={{ display: "block", marginBottom: "12px", marginLeft: "28px" }}>
//                   Configure reimbursement amounts and rules based on position, grade, or department
//                 </Text>
                
//                 {/* Tags */}
//                 <Space size={16}>
//                   <Tag color="processing" style={{ marginLeft: "28px", borderRadius: "999px" }}>
//                     Total Configs: {dataSource.length}
//                   </Tag>
//                   <Tag 
//                     color="success" 
//                     style={{ borderRadius: "999px"}}
//                     icon={<PlusOutlined />}
//                   >
//                     Active: {activeConfigs.length}
//                   </Tag>
//                   <Tag 
//                     color="error" 
//                     style={{ borderRadius: "999px" }}
//                     icon={<DeleteOutlined />}
//                   >
//                     Inactive: {inactiveConfigs.length}
//                   </Tag>
//                 </Space>
//               </div>

//               {/* Right side - Search and Add Button */}
//               <Space size={12}>
//                 <Input.Search
//                   placeholder="Search by origin or category..."
//                   allowClear
//                   style={{ width: 300 }}
//                   onChange={(e) => setSearchText(e.target.value)}
//                 />
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   onClick={() => {
//                     setEditingKey(null);
//                     form.resetFields();
//                     setIsModalVisible(true);
//                   }}
//                 >
//                   Add Configuration
//                 </Button>
//               </Space>
//             </div>

//             {/* Table - with all original columns */}
//             <Table
//               columns={columns}
//               dataSource={dataSource.filter(
//                 (item) =>
//                   item.origin
//                     ?.toLowerCase()
//                     .includes(searchText.toLowerCase()) ||
//                   item.categoryType
//                     ?.toLowerCase()
//                     .includes(searchText.toLowerCase()),
//               )}
//               size="middle"
//               pagination={{ 
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showTotal: (total) => `Total ${total} items`
//               }}
//               loading={isLoading}
//               rowKey="key"
//               bordered
//             />
//           {/* </Card> */}

//           {/* Create/Edit Modal - Like Position Configuration */}
//           <Modal
//             title={
//               <Space>
//                 <WalletOutlined />
//                 {editingKey
//                   ? "Edit Reimbursement Configuration"
//                   : "Add Reimbursement Configuration"}
//               </Space>
//             }
//             open={isModalVisible}
//             onCancel={() => {
//               if (isSaving) return;
//               setIsModalVisible(false);
//               form.resetFields();
//               setEditingKey(null);
//             }}
//             onOk={() => form.submit()}
//             destroyOnHidden
//             confirmLoading={isSaving}
//             cancelButtonProps={{ disabled: isSaving }}
//             width={650}
//             okText={editingKey ? "Update" : "Create"}
//           >
//             <Form form={form} layout="vertical" onFinish={handleSave}>
//               {/* Origin and Sub-Origin */}
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="origin"
//                     label="Origin"
//                     rules={[{ required: true, message: "Please select origin" }]}
//                   >
//                     <Select
//                       placeholder="Select Origin"
//                       disabled={!!editingKey}
//                       onChange={() => {
//                         form.setFieldsValue({ subOriginId: undefined });
//                       }}
//                     >
//                       <Option value="Grade">Grade</Option>
//                       <Option value="Department">Department</Option>
//                       <Option value="Sub-department">Sub-department</Option>
//                       <Option value="Position">Position</Option>
//                       <Option value="User">User</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     name="subOriginId"
//                     label="Sub-Origin"
//                     rules={[{ required: true, message: "Please select sub-origin" }]}
//                   >
//                     <Select
//                       placeholder="Select Sub-Origin"
//                       disabled={!originType || !!editingKey}
//                       loading={getSubOriginLoading()}
//                       showSearch
//                       filterOption={filterOption}
//                       options={getSubOriginOptions()}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>

//               {/* Dynamic Category Config - Like Position Configuration */}
//               <Form.List name="categoryConfigs" initialValue={[{}]}>
//                 {(fields, { add, remove }) => (
//                   <CategoryConfigListContent
//                     fields={fields}
//                     add={add}
//                     remove={remove}
//                     categoryConfigs={categoryConfigs}
//                     editingKey={editingKey}
//                   />
//                 )}
//               </Form.List>
//             </Form>
//           </Modal>
//         </div>
     
//     </ProtectedRoute>
//   );
// }
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  notification,
  Space,
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  Row,
  Col,
  InputNumber,
  Collapse,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useGrades } from "@/hooks/useGrades";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions } from "@/hooks/usePositions";
import { MembersService } from "@/services/membersService";
import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService"; // Import the service
import {
  useReimbursementConfigs,
  useCreateReimbursementConfig,
  useUpdateReimbursementConfig,
  useDeleteReimbursementConfig,
} from "@/hooks/usereimbursementconfig";

const { Text, Title } = Typography;
const { Option } = Select;

// Remove static CATEGORY_TYPES - we'll fetch dynamically

interface ReimbursementRecord {
  key: string;
  origin: string;
  subOrigin: string; // Display name
  subOriginId: string; // ID sent to backend
  categoryType: string;
  amount: number;
  period: "MONTH" | "YEAR";
  status: string;
  monthlyAmount?: number;
  yearlyAmount?: number;
}

// Interface for grouped data (for editing like Position Configuration)
interface GroupedReimbursement {
  key: string;
  origin: string;
  subOriginId: string;
  subOriginLabel: string;
  configurations: ReimbursementRecord[];
}

// Interface for sub-origin options
interface SubOriginOption {
  id: string;
  name: string;
  originType: string;
}

// Styles for switch cards (from Position Configuration)
const switchRowCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  border: "1px solid #f0f0f0",
  borderRadius: 8,
  marginBottom: 12,
  background: "#fafafa",
};

const switchTitle = {
  fontSize: 14,
  fontWeight: 600,
};

const switchDesc = {
  fontSize: 12,
  color: "#8c8c8c",
  marginTop: 2,
};

// Calculate monthly/yearly amounts
const calculateAmounts = (amount: any, period: "MONTH" | "YEAR") => {
  const numAmount = Number(amount) || 0;
  
  if (period === "MONTH") {
    return {
      monthly: numAmount,
      yearly: numAmount * 12,
    };
  } else {
    return {
      monthly: numAmount / 12,
      yearly: numAmount,
    };
  }
};

// Category Config List Component with monthly/yearly preview
const CategoryConfigListContent = ({
  fields,
  add,
  remove,
  categoryConfigs,
  editingKey,
  categoryOptions, // Add this prop
}: {
  fields: any[];
  add: () => void;
  remove: (index: number | number[]) => void;
  categoryConfigs: any[];
  editingKey: string | null;
  categoryOptions: { name: string; code: string }[]; // Add this type
}) => {
  const [activeKey, setActiveKey] = useState<string | string[] | number | number[]>(
    fields.length > 0 ? fields[0].key : []
  );
  const prevFieldsLength = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevFieldsLength.current) {
      const lastField = fields[fields.length - 1];
      setActiveKey(lastField.key);
    }
    prevFieldsLength.current = fields.length;
  }, [fields.length]);

  return (
    <>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        items={fields.map(({ key, name, ...restField }) => {
          const selectedInOtherRows = (categoryConfigs || [])
            .filter((_: any, index: number) => index !== name)
            .map((item: any) => item?.categoryType)
            .filter(Boolean);

          const currentCategoryType = categoryConfigs?.[name]?.categoryType;
          const currentAmount = categoryConfigs?.[name]?.amount;
          const currentPeriod = categoryConfigs?.[name]?.period;
          
          // Calculate preview amounts if both amount and period exist
          const previewAmounts = currentAmount && currentPeriod 
            ? calculateAmounts(currentAmount, currentPeriod)
            : null;

          return {
            key: key,
            label: currentCategoryType || `Category Type ${name + 1}`,
            extra:
              fields.length > 1 ? (
                <Popconfirm
                  title="Are you sure you want to delete?"
                  onConfirm={() => remove(name)}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <DeleteOutlined
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "red" }}
                  />
                </Popconfirm>
              ) : null,
            children: (
              <>
                <Form.Item name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "categoryType"]}
                      label="Category Type"
                      rules={[{ required: true, message: "Please select category type" }]}
                    >
                      <Select
                        placeholder="Select Category Type"
                        style={{ width: "100%" }}
                      >
                        {categoryOptions
                          .filter(
                            (opt) => !selectedInOtherRows.includes(opt.name)
                          )
                          .map((opt) => (
                            <Option key={opt.code} value={opt.name}>
                              {opt.name}
                            </Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "amount"]}
                      label="Amount"
                      rules={[{ required: true, message: "Please enter amount" }]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        style={{ width: "100%" }}
                        placeholder="Amount"
                        prefix="₹"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "period"]}
                      label="Period"
                      rules={[{ required: true, message: "Please select period" }]}
                    >
                      <Select placeholder="Period">
                        <Option value="MONTH">Per Month</Option>
                        <Option value="YEAR">Per Year</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Monthly/Yearly Preview */}
                {previewAmounts && (
                  <Card 
                    size="small" 
                    style={{ 
                      background: "#f5f5f5", 
                      marginBottom: 12,
                      border: "1px dashed #d9d9d9"
                    }}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">Monthly:</Text>
                        <div>
                          <Text strong style={{ color: "#1890ff" }}>
                            ₹{previewAmounts.monthly.toFixed(2)}
                          </Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Yearly:</Text>
                        <div>
                          <Text strong style={{ color: "#52c41a" }}>
                            ₹{previewAmounts.yearly.toFixed(2)}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Status Switch - same style as Position Configuration */}
                <div style={{ ...switchRowCard, marginBottom: 0 }}>
                  <div>
                    <div style={switchTitle}>Status</div>
                    <div style={switchDesc}>Category type is active</div>
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, "status"]}
                    valuePropName="checked"
                    initialValue={true}
                    noStyle
                  >
                    <Switch />
                  </Form.Item>
                </div>
              </>
            ),
          };
        })}
      />
      <Button
        type="dashed"
        block
        onClick={() => add()}
        style={{ marginTop: 12 }}
      >
        + Add Another Category Type
      </Button>
    </>
  );
};

export default function ReimbursementConfigurationPage() {
  const { user } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const originType = Form.useWatch("origin", form);
  const categoryConfigs = Form.useWatch("categoryConfigs", form);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [members, setMembers] = useState<SubOriginOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ name: string; code: string }[]>([]); // State for dynamic options

  // Hooks for data
  const { data: configs, isLoading, refetch } = useReimbursementConfigs();
  
  console.log("Configs data from API:", configs);

  const createConfig = useCreateReimbursementConfig();
  const updateConfig = useUpdateReimbursementConfig();
  const deleteConfig = useDeleteReimbursementConfig();

  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { departments, loading: departmentsLoading } = useDepartments();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  // Fetch category options from Settings service
  useEffect(() => {
    const fetchCategoryOptions = async () => {
      try {
        const settings = await ReimbursementSettingsService.getSettings();
        // Filter only active settings if needed
        const activeSettings = settings.filter(s => s.isActive);
        const options = activeSettings.map(s => ({
          name: s.name,
          code: s.code
        }));
        setCategoryOptions(options);
        console.log("Fetched category options:", options);
      } catch (error) {
        console.error("Failed to fetch category options:", error);
      }
    };

    fetchCategoryOptions();
  }, []);

  useEffect(() => {
    const fetchMembersForSelect = async () => {
      try {
        const memberData = await MembersService.getMembersForSelect();
        // Convert to SubOriginOption format
        const formattedMembers = memberData.map((m: any) => ({
          id: m.value,
          name: m.label,
          originType: "User"
        }));
        setMembers(formattedMembers);
      } catch (error) {
        console.error("Failed to fetch members for select:", error);
      }
    };
    fetchMembersForSelect();
  }, []);

  // Create lookup maps for faster access
  const membersMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.id] = member.name;
      return acc;
    }, {} as Record<string, string>);
  }, [members]);

  const gradesMap = useMemo(() => {
    return grades.reduce((acc, grade) => {
      acc[grade.id] = grade.name;
      return acc;
    }, {} as Record<string, string>);
  }, [grades]);

  const departmentsMap = useMemo(() => {
    return departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {} as Record<string, string>);
  }, [departments]);

  const subDepartmentsMap = useMemo(() => {
    return subDepartments.reduce((acc, subDept) => {
      acc[subDept.id] = subDept.name;
      return acc;
    }, {} as Record<string, string>);
  }, [subDepartments]);

  const positionsMap = useMemo(() => {
    return positions.reduce((acc, pos) => {
      acc[pos.id] = pos.title;
      return acc;
    }, {} as Record<string, string>);
  }, [positions]);

  // Helper function to get sub-origin label
  const getSubOriginLabel = (origin: string, subOriginId: string) => {
    if (origin === "User") {
      return membersMap[subOriginId] || subOriginId;
    } else if (origin === "Grade") {
      return gradesMap[subOriginId] || subOriginId;
    } else if (origin === "Department") {
      return departmentsMap[subOriginId] || subOriginId;
    } else if (origin === "Sub-department") {
      return subDepartmentsMap[subOriginId] || subOriginId;
    } else if (origin === "Position") {
      return positionsMap[subOriginId] || subOriginId;
    }
    return subOriginId;
  };

  // Group configurations by origin and subOrigin (for editing like Position Configuration)
  const groupedData = useMemo(() => {
    if (!configs) return [];
    
    const groups: Record<string, GroupedReimbursement> = {};
    
    configs.forEach((config) => {
      const groupKey = `${config.origin}-${config.subOrigin}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          origin: config.origin,
          subOriginId: config.subOrigin,
          subOriginLabel: getSubOriginLabel(config.origin, config.subOrigin),
          configurations: [],
        };
      }
      
      groups[groupKey].configurations.push({
        key: config.id,
        origin: config.origin,
        subOrigin: getSubOriginLabel(config.origin, config.subOrigin),
        subOriginId: config.subOrigin,
        categoryType: config.categoryType,
        amount: config.amount,
        period: config.period,
        status: config.status,
        monthlyAmount: config.monthlyAmount,
        yearlyAmount: config.yearlyAmount,
      });
    });
    
    return Object.values(groups);
  }, [configs, membersMap, gradesMap, departmentsMap, subDepartmentsMap, positionsMap, getSubOriginLabel]);

  // Transform data for table with proper mapping (keeping all original columns)
  const dataSource: ReimbursementRecord[] = useMemo(() => {
    if (!configs) {
      console.log("No configs available yet");
      return [];
    }
    
    // Ensure configs is an array
    const configArray = Array.isArray(configs) ? configs : [];
    
    if (configArray.length === 0) {
      console.log("Configs array is empty");
      return [];
    }

    console.log("Transforming configs:", configArray);

    return configArray.map((config) => {
      // Get the label for sub-origin based on origin type
      let subOriginLabel = config.subOrigin;
      
      if (config.origin === "User") {
        subOriginLabel = membersMap[config.subOrigin] || config.subOrigin;
      } else if (config.origin === "Grade") {
        subOriginLabel = gradesMap[config.subOrigin] || config.subOrigin;
      } else if (config.origin === "Department") {
        subOriginLabel = departmentsMap[config.subOrigin] || config.subOrigin;
      } else if (config.origin === "Sub-department") {
        subOriginLabel = subDepartmentsMap[config.subOrigin] || config.subOrigin;
      } else if (config.origin === "Position") {
        subOriginLabel = positionsMap[config.subOrigin] || config.subOrigin;
      }

      // Ensure amount is a number
      const amount = Number(config.amount) || 0;

      return {
        key: config.id,
        origin: config.origin,
        subOrigin: subOriginLabel,
        subOriginId: config.subOrigin,
        categoryType: config.categoryType,
        amount: amount,
        period: config.period,
        status: config.status,
        monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
        yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
      };
    });
  }, [configs, membersMap, gradesMap, departmentsMap, subDepartmentsMap, positionsMap]);

  const getSubOriginOptions = () => {
    if (!originType) return [];

    switch (originType) {
      case "User":
        return members.map((m) => ({ 
          label: m.name, 
          value: m.id // Send ID as value
        }));
      case "Grade":
        return grades.map((g) => ({ 
          label: g.name, 
          value: g.id // Send ID as value
        }));
      case "Department":
        return departments.map((d) => ({ 
          label: d.name, 
          value: d.id // Send ID as value
        }));
      case "Sub-department":
        return subDepartments.map((sd) => ({ 
          label: sd.name, 
          value: sd.id // Send ID as value
        }));
      case "Position":
        return positions.map((p) => ({ 
          label: p.title, 
          value: p.id // Send ID as value
        }));
      default:
        return [];
    }
  };

  const getSubOriginLoading = () => {
    switch (originType) {
      case "Grade":
        return gradesLoading;
      case "Department":
        return departmentsLoading;
      case "Sub-department":
        return subDepartmentsLoading;
      case "Position":
        return positionsLoading;
      default:
        return false;
    }
  };

  // Original columns - keeping all existing columns
  const columns: ColumnsType<ReimbursementRecord> = [
    {
      title: "Origin",
      dataIndex: "origin",
      key: "origin",
      align: "center",
      sorter: (a, b) => a.origin.localeCompare(b.origin),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Sub-Origin",
      dataIndex: "subOrigin",
      key: "subOrigin",
      align: "center",
      render: (text: string) => <Text>{text || "-"}</Text>,
    },
    {
      title: "Category Type",
      dataIndex: "categoryType",
      key: "categoryType",
      align: "center",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "center",
      render: (amount: any) => {
        const numAmount = Number(amount) || 0;
        return `₹${numAmount}`;
      },
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      align: "center",
      render: (period: string) => (
        <Tag color={period === "MONTH" ? "green" : "orange"}>
          {period === "MONTH" ? "Per Month" : "Per Year"}
        </Tag>
      ),
    },
    {
      title: "Monthly Amount",
      key: "monthlyAmount",
      align: "center",
      render: (_: any, record: ReimbursementRecord) => {
        const amounts = calculateAmounts(record.amount, record.period);
        return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
      },
    },
    {
      title: "Yearly Amount",
      key: "yearlyAmount",
      align: "center",
      render: (_: any, record: ReimbursementRecord) => {
        const amounts = calculateAmounts(record.amount, record.period);
        return <Text>₹{amounts.yearly.toFixed(2)}</Text>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "success" : "error"}>{status}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_: any, record: ReimbursementRecord) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this reimbursement configuration?"
              onConfirm={() => handleDelete(record.key)}
              okButtonProps={{ loading: deletingKey === record.key }}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={!!deletingKey}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: ReimbursementRecord) => {
    setEditingKey(record.key);
    
    // Find the group that contains this record (for editing multiple configs under same origin)
    const group = groupedData.find(g => 
      g.configurations.some(c => c.key === record.key)
    );
    
    if (group) {
      // Format all configurations in the group for the form (like Position Configuration)
      const configsForForm = group.configurations.map((config) => ({
        id: config.key,
        categoryType: config.categoryType,
        amount: config.amount,
        period: config.period,
        status: config.status === "ACTIVE",
      }));

      form.setFieldsValue({
        origin: group.origin,
        subOriginId: group.subOriginId,
        categoryConfigs: configsForForm.length > 0 ? configsForForm : [{}],
      });
    } else {
      // Fallback to single config edit
      form.setFieldsValue({
        origin: record.origin,
        subOriginId: record.subOriginId,
        categoryConfigs: [{
          id: record.key,
          categoryType: record.categoryType,
          amount: record.amount,
          period: record.period,
          status: record.status === "ACTIVE",
        }],
      });
    }
    
    setIsModalVisible(true);
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      await deleteConfig.mutateAsync(key);
      api.success({
        message: "Configuration deleted successfully",
        placement: "topRight",
      });
      refetch();
    } catch (error: any) {
      api.error({
        message: error.message || "Failed to delete configuration",
        placement: "topRight",
      });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSave = async (values: any) => {
    setIsSaving(true);
    try {
      const { origin, subOriginId, categoryConfigs } = values;
      
      if (editingKey) {
        // Update existing configurations
        for (const config of categoryConfigs) {
          if (config.id) {
            // Update existing
            await updateConfig.mutateAsync({
              id: config.id,
              data: {
                origin,
                subOrigin: subOriginId,
                categoryType: config.categoryType,
                amount: config.amount,
                period: config.period,
                status: config.status ? "ACTIVE" : "INACTIVE",
              },
            });
          } else {
            // Create new
            await createConfig.mutateAsync({
              origin,
              subOrigin: subOriginId,
              categoryType: config.categoryType,
              amount: config.amount,
              period: config.period,
              status: config.status ? "ACTIVE" : "INACTIVE",
            });
          }
        }
      } else {
        // Create new configurations
        for (const config of categoryConfigs) {
          await createConfig.mutateAsync({
            origin,
            subOrigin: subOriginId,
            categoryType: config.categoryType,
            amount: config.amount,
            period: config.period,
            status: config.status ? "ACTIVE" : "INACTIVE",
          });
        }
      }

      api.success({
        message: "Configuration saved successfully",
        placement: "topRight",
      });

      setIsModalVisible(false);
      form.resetFields();
      setEditingKey(null);
      refetch();
    } catch (error: any) {
      api.error({
        message: error.message || "Failed to save configuration",
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Custom filter function for Select components
  const filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) return false;
    return option.label.toLowerCase().includes(input.toLowerCase());
  };

  const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
  const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

  return (
    <ProtectedRoute>
        {contextHolder}
        <div style={{ padding: 0 }}>
          {/* Header Section - Left and Right side */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            marginBottom: "16px"
          }}>
            {/* Left side - Title and Tags */}
            <div>
              <Space align="center" style={{ marginBottom: "8px" }}>
                <WalletOutlined style={{ fontSize: "28px", color: "#1677ff" }} />
                <Title level={3} style={{ margin: 0 }}>
                  Reimbursement Configuration
                </Title>
              </Space>
              <Text type="secondary" style={{ display: "block", marginBottom: "12px", marginLeft: "28px" }}>
                Configure reimbursement amounts and rules based on position, grade, or department
              </Text>
              
              {/* Tags */}
              <Space size={16}>
                <Tag color="processing" style={{ marginLeft: "28px", borderRadius: "999px" }}>
                  Total Configs: {dataSource.length}
                </Tag>
                <Tag 
                  color="success" 
                  style={{ borderRadius: "999px"}}
                  icon={<PlusOutlined />}
                >
                  Active: {activeConfigs.length}
                </Tag>
                <Tag 
                  color="error" 
                  style={{ borderRadius: "999px" }}
                  icon={<DeleteOutlined />}
                >
                  Inactive: {inactiveConfigs.length}
                </Tag>
              </Space>
            </div>

            {/* Right side - Search and Add Button */}
            <Space size={12}>
              <Input.Search
                placeholder="Search by origin or category..."
                allowClear
                style={{ width: 300 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingKey(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                Add Configuration
              </Button>
            </Space>
          </div>

          {/* Table - with all original columns */}
          <Table
            columns={columns}
            dataSource={dataSource.filter(
              (item) =>
                item.origin
                  ?.toLowerCase()
                  .includes(searchText.toLowerCase()) ||
                item.categoryType
                  ?.toLowerCase()
                  .includes(searchText.toLowerCase()),
            )}
            size="middle"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`
            }}
            loading={isLoading}
            rowKey="key"
            bordered
          />

          {/* Create/Edit Modal - Like Position Configuration */}
          <Modal
            title={
              <Space>
                <WalletOutlined />
                {editingKey
                  ? "Edit Reimbursement Configuration"
                  : "Add Reimbursement Configuration"}
              </Space>
            }
            open={isModalVisible}
            onCancel={() => {
              if (isSaving) return;
              setIsModalVisible(false);
              form.resetFields();
              setEditingKey(null);
            }}
            onOk={() => form.submit()}
            destroyOnHidden
            confirmLoading={isSaving}
            cancelButtonProps={{ disabled: isSaving }}
            width={650}
            okText={editingKey ? "Update" : "Create"}
          >
            <Form form={form} layout="vertical" onFinish={handleSave}>
              {/* Origin and Sub-Origin */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="origin"
                    label="Origin"
                    rules={[{ required: true, message: "Please select origin" }]}
                  >
                    <Select
                      placeholder="Select Origin"
                      disabled={!!editingKey}
                      onChange={() => {
                        form.setFieldsValue({ subOriginId: undefined });
                      }}
                    >
                      <Option value="Grade">Grade</Option>
                      <Option value="Department">Department</Option>
                      <Option value="Sub-department">Sub-department</Option>
                      <Option value="Position">Position</Option>
                      <Option value="User">User</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="subOriginId"
                    label="Sub-Origin"
                    rules={[{ required: true, message: "Please select sub-origin" }]}
                  >
                    <Select
                      placeholder="Select Sub-Origin"
                      disabled={!originType || !!editingKey}
                      loading={getSubOriginLoading()}
                      showSearch
                      filterOption={filterOption}
                      options={getSubOriginOptions()}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Dynamic Category Config - Now with dynamic options */}
              <Form.List name="categoryConfigs" initialValue={[{}]}>
                {(fields, { add, remove }) => (
                  <CategoryConfigListContent
                    fields={fields}
                    add={add}
                    remove={remove}
                    categoryConfigs={categoryConfigs}
                    editingKey={editingKey}
                    categoryOptions={categoryOptions} // Pass dynamic options
                  />
                )}
              </Form.List>
            </Form>
          </Modal>
        </div>
    </ProtectedRoute>
  );
}