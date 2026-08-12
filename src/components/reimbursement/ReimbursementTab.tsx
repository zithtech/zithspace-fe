
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
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService"; // Import the service
// import {
//   useReimbursementConfigs,
//   useCreateReimbursementConfig,
//   useUpdateReimbursementConfig,
//   useDeleteReimbursementConfig,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// // Remove static CATEGORY_TYPES - we'll fetch dynamically

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
//   categoryOptions, // Add this prop
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: { name: string; code: string }[]; // Add this type
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
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
//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

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
//                       rules={[
//                         {
//                           required: true,
//                           message: "Please select category type",
//                         },
//                       ]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                       >
//                         {categoryOptions
//                           .filter(
//                             (opt) => !selectedInOtherRows.includes(opt.name),
//                           )
//                           .map((opt) => (
//                             <Option key={opt.code} value={opt.name}>
//                               {opt.name}
//                             </Option>
//                           ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label="Amount"
//                         rules={[
//                           { required: true, message: "Please enter amount" },
//                         ]}
                      
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
//                       rules={[
//                         { required: true, message: "Please select period" },
//                       ]}
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
//                       border: "1px dashed #d9d9d9",
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
//   const [categoryOptions, setCategoryOptions] = useState<
//     { name: string; code: string }[]
//   >([]); // State for dynamic options

//   // Hooks for data
//   const { data: configs, isLoading, refetch } = useReimbursementConfigs();

//   console.log("Configs data from API:", configs);

//   const createConfig = useCreateReimbursementConfig();
//   const updateConfig = useUpdateReimbursementConfig();
//   const deleteConfig = useDeleteReimbursementConfig();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } =
//     useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   // Fetch category options from Settings service
//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         // Filter only active settings if needed
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
//         console.log("Fetched category options:", options);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         // Convert to SubOriginOption format
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
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
//     return members.reduce(
//       (acc, member) => {
//         acc[member.id] = member.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [members]);

//   const gradesMap = useMemo(() => {
//     return grades.reduce(
//       (acc, grade) => {
//         acc[grade.id] = grade.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [grades]);

//   const departmentsMap = useMemo(() => {
//     return departments.reduce(
//       (acc, dept) => {
//         acc[dept.id] = dept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [departments]);

//   const subDepartmentsMap = useMemo(() => {
//     return subDepartments.reduce(
//       (acc, subDept) => {
//         acc[subDept.id] = subDept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [subDepartments]);

//   const positionsMap = useMemo(() => {
//     return positions.reduce(
//       (acc, pos) => {
//         acc[pos.id] = pos.title;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
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
//   }, [
//     configs,
//     membersMap,
//     gradesMap,
//     departmentsMap,
//     subDepartmentsMap,
//     positionsMap,
//     getSubOriginLabel,
//   ]);

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
//         subOriginLabel =
//           subDepartmentsMap[config.subOrigin] || config.subOrigin;
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
//         monthlyAmount: config.monthlyAmount
//           ? Number(config.monthlyAmount)
//           : undefined,
//         yearlyAmount: config.yearlyAmount
//           ? Number(config.yearlyAmount)
//           : undefined,
//       };
//     });
//   }, [
//     configs,
//     membersMap,
//     gradesMap,
//     departmentsMap,
//     subDepartmentsMap,
//     positionsMap,
//   ]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];

//     switch (originType) {
//       case "User":
//         return members.map((m) => ({
//           label: m.name,
//           value: m.id, // Send ID as value
//         }));
//       case "Grade":
//         return grades.map((g) => ({
//           label: g.name,
//           value: g.id, // Send ID as value
//         }));
//       case "Department":
//         return departments.map((d) => ({
//           label: d.name,
//           value: d.id, // Send ID as value
//         }));
//       case "Sub-department":
//         return subDepartments.map((sd) => ({
//           label: sd.name,
//           value: sd.id, // Send ID as value
//         }));
//       case "Position":
//         return positions.map((p) => ({
//           label: p.title,
//           value: p.id, // Send ID as value
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
//       render: (text: string) => {
//         // Capitalize first letter
//         const capitalizedText = text
//           ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
//           : "-";
//         return <Tag color="blue">{capitalizedText}</Tag>;
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
//     const group = groupedData.find((g) =>
//       g.configurations.some((c) => c.key === record.key),
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
//         categoryConfigs: [
//           {
//             id: record.key,
//             categoryType: record.categoryType,
//             amount: record.amount,
//             period: record.period,
//             status: record.status === "ACTIVE",
//           },
//         ],
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
//   const filterOption = (
//     input: string,
//     option?: { label: string; value: string },
//   ) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 0 }}>
//         {/* Header Section - Left and Right side */}

//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             marginBottom: "8px",
//           }}
//         >
//           {/* Left side - Title and Tags */}
//           <div>
//             <Space align="center" style={{ marginBottom: "4px" }}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Config
//               </Title>
//             </Space>
//             <Text
//               type="secondary"
//               style={{
//                 display: "block",
//                 marginBottom: "8px",
//                 marginLeft: "20px",
//                 fontSize: "12px",
//               }}
//             >
//               Configure amounts by position/grade/dept
//             </Text>

//             {/* Tags */}
//             <Space size={12}>
//               <Tag
//                 color="processing"
//                 style={{
//                   marginLeft: "20px",
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//               >
//                 Total: {dataSource.length}
//               </Tag>
//               <Tag
//                 color="success"
//                 style={{
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//                 icon={<PlusOutlined style={{ fontSize: "10px" }} />}
//               >
//                 Active: {activeConfigs.length}
//               </Tag>
//               <Tag
//                 color="error"
//                 style={{
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//                 icon={<DeleteOutlined style={{ fontSize: "10px" }} />}
//               >
//                 Inactive: {inactiveConfigs.length}
//               </Tag>
//             </Space>
//           </div>

//           {/* Right side - Search and Add Button */}
//           <Space size={12}>
//             <Input.Search
//               placeholder="Search by origin or category..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setIsModalVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         {/* Table - with all original columns */}
//         <Table
//           columns={columns}
//           dataSource={dataSource.filter(
//             (item) =>
//               item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//               item.categoryType
//                 ?.toLowerCase()
//                 .includes(searchText.toLowerCase()),
//           )}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="key"
//           bordered
//         />

//         {/* Create/Edit Modal - Like Position Configuration */}
//         <Modal
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             if (isSaving) return;
//             setIsModalVisible(false);
//             form.resetFields();
//             setEditingKey(null);
//           }}
//           onOk={() => form.submit()}
//           destroyOnHidden
//           confirmLoading={isSaving}
//           cancelButtonProps={{ disabled: isSaving }}
//           width={650}
//           okText={editingKey ? "Update" : "Create"}
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             {/* Origin and Sub-Origin */}
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="origin"
//                   label="Origin"
//                   rules={[{ required: true, message: "Please select origin" }]}
//                 >
//                   <Select
//                     placeholder="Select Origin"
//                     disabled={!!editingKey}
//                     onChange={() => {
//                       form.setFieldsValue({ subOriginId: undefined });
//                     }}
//                   >
//                     <Option value="Grade">Grade</Option>
//                     <Option value="Department">Department</Option>
//                     <Option value="Sub-department">Sub-department</Option>
//                     <Option value="Position">Position</Option>
//                     <Option value="User">User</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>

//               <Col span={12}>
//                 <Form.Item
//                   name="subOriginId"
//                   label="Sub-Origin"
//                   rules={[
//                     { required: true, message: "Please select sub-origin" },
//                   ]}
//                 >
//                   <Select
//                     placeholder="Select Sub-Origin"
//                     disabled={!originType || !!editingKey}
//                     loading={getSubOriginLoading()}
//                     showSearch
//                     filterOption={filterOption}
//                     options={getSubOriginOptions()}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             {/* Dynamic Category Config - Now with dynamic options */}
//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions} // Pass dynamic options
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Modal>
//       </div>
//     </ProtectedRoute>
//   );
// }








// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
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
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigs,
//   useCreateReimbursementConfig,
//   useUpdateReimbursementConfig,
//   useDeleteReimbursementConfig,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryType: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string; // Add for reference
//   ruleId?: string;   // Add for reference
// }

// interface GroupedReimbursement {
//   key: string;
//   origin: string;
//   subOriginId: string;
//   subOriginLabel: string;
//   configurations: ReimbursementRecord[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

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

// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: { name: string; code: string }[];
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
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

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

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
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={12}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryType"]}
//                       label="Category Type"
//                       rules={[
//                         {
//                           required: true,
//                           message: "Please select category type",
//                         },
//                       ]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                       >
//                         {categoryOptions
//                           .filter(
//                             (opt) => !selectedInOtherRows.includes(opt.name),
//                           )
//                           .map((opt) => (
//                             <Option key={opt.code} value={opt.name}>
//                               {opt.name}
//                             </Option>
//                           ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label="Amount"
//                       rules={[
//                         { required: true, message: "Please enter amount" },
//                       ]}
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
//                       rules={[
//                         { required: true, message: "Please select period" },
//                       ]}
//                     >
//                       <Select placeholder="Period">
//                         <Option value="MONTH">Per Month</Option>
//                         <Option value="YEAR">Per Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f5f5f5",
//                       marginBottom: 12,
//                       border: "1px dashed #d9d9d9",
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
//   const [categoryOptions, setCategoryOptions] = useState<
//     { name: string; code: string }[]
//   >([]);

//   const { data: configs, isLoading, refetch } = useReimbursementConfigs();
//   const createConfig = useCreateReimbursementConfig();
//   const updateConfig = useUpdateReimbursementConfig();
//   const deleteConfig = useDeleteReimbursementConfig();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } =
//     useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

//   const membersMap = useMemo(() => {
//     return members.reduce(
//       (acc, member) => {
//         acc[member.id] = member.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [members]);

//   const gradesMap = useMemo(() => {
//     return grades.reduce(
//       (acc, grade) => {
//         acc[grade.id] = grade.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [grades]);

//   const departmentsMap = useMemo(() => {
//     return departments.reduce(
//       (acc, dept) => {
//         acc[dept.id] = dept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [departments]);

//   const subDepartmentsMap = useMemo(() => {
//     return subDepartments.reduce(
//       (acc, subDept) => {
//         acc[subDept.id] = subDept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [subDepartments]);

//   const positionsMap = useMemo(() => {
//     return positions.reduce(
//       (acc, pos) => {
//         acc[pos.id] = pos.title;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [positions]);

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
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//       });
//     });

//     return Object.values(groups);
//   }, [configs, getSubOriginLabel]);

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];

//     const configArray = Array.isArray(configs) ? configs : [];

//     return configArray.map((config) => {
//       let subOriginLabel = config.subOrigin;

//       if (config.origin === "User") {
//         subOriginLabel = membersMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Grade") {
//         subOriginLabel = gradesMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Department") {
//         subOriginLabel = departmentsMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Sub-department") {
//         subOriginLabel =
//           subDepartmentsMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Position") {
//         subOriginLabel = positionsMap[config.subOrigin] || config.subOrigin;
//       }

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
//         monthlyAmount: config.monthlyAmount
//           ? Number(config.monthlyAmount)
//           : undefined,
//         yearlyAmount: config.yearlyAmount
//           ? Number(config.yearlyAmount)
//           : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//       };
//     });
//   }, [configs, membersMap, gradesMap, departmentsMap, subDepartmentsMap, positionsMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];

//     switch (originType) {
//       case "User":
//         return members.map((m) => ({
//           label: m.name,
//           value: m.id,
//         }));
//       case "Grade":
//         return grades.map((g) => ({
//           label: g.name,
//           value: g.id,
//         }));
//       case "Department":
//         return departments.map((d) => ({
//           label: d.name,
//           value: d.id,
//         }));
//       case "Sub-department":
//         return subDepartments.map((sd) => ({
//           label: sd.name,
//           value: sd.id,
//         }));
//       case "Position":
//         return positions.map((p) => ({
//           label: p.title,
//           value: p.id,
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
//       render: (text: string) => {
//         const capitalizedText = text
//           ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
//           : "-";
//         return <Tag color="blue">{capitalizedText}</Tag>;
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

//     const group = groupedData.find((g) =>
//       g.configurations.some((c) => c.key === record.key),
//     );

//     if (group) {
//       const configsForForm = group.configurations.map((config) => ({
//         id: config.key,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
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
//       form.setFieldsValue({
//         origin: record.origin,
//         subOriginId: record.subOriginId,
//         categoryConfigs: [
//           {
//             id: record.key,
//             policyId: record.policyId,
//             ruleId: record.ruleId,
//             categoryType: record.categoryType,
//             amount: record.amount,
//             period: record.period,
//             status: record.status === "ACTIVE",
//           },
//         ],
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

//   // ============== CRITICAL FIX: handleSave function ==============
//   // const handleSave = async (values: any) => {
//   //   setIsSaving(true);
//   //   try {
//   //     const { origin, subOriginId, categoryConfigs } = values;

//   //     if (editingKey) {
//   //       // UPDATE MODE
//   //       for (const config of categoryConfigs) {
//   //         if (config.id) {
//   //           // Update existing configuration
//   //           await updateConfig.mutateAsync({
//   //             id: config.id,
//   //             data: {
//   //               origin,
//   //               subOrigin: subOriginId,
//   //               categoryType: config.categoryType,
//   //               amount: Number(config.amount),
//   //               period: config.period,
//   //               status: config.status ? "ACTIVE" : "INACTIVE",
//   //               // The service will add default approvers
//   //             },
//   //           });
//   //         } else {
//   //           // Create new configuration under same origin/subOrigin
//   //           await createConfig.mutateAsync({
//   //             origin,
//   //             subOrigin: subOriginId,
//   //             categoryType: config.categoryType,
//   //             amount: Number(config.amount),
//   //             period: config.period,
//   //             status: config.status ? "ACTIVE" : "INACTIVE",
//   //             // The service will add default approvers
//   //           });
//   //         }
//   //       }
//   //     } else {
//   //       // CREATE MODE
//   //       for (const config of categoryConfigs) {
//   //         await createConfig.mutateAsync({
//   //           origin,
//   //           subOrigin: subOriginId,
//   //           categoryType: config.categoryType,
//   //           amount: Number(config.amount),
//   //           period: config.period,
//   //           status: config.status ? "ACTIVE" : "INACTIVE",
//   //           // The service will add default approvers
//   //         });
//   //       }
//   //     }

//   //     api.success({
//   //       message: "Configuration saved successfully",
//   //       placement: "topRight",
//   //     });

//   //     setIsModalVisible(false);
//   //     form.resetFields();
//   //     setEditingKey(null);
//   //     await refetch();
//   //   } catch (error: any) {
//   //     console.error("Save error:", error);
//   //     api.error({
//   //       message: error.message || "Failed to save configuration",
//   //       placement: "topRight",
//   //     });
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };
// const handleSave = async (values: any) => {
//   setIsSaving(true);
//   try {
//     const { origin, subOriginId, categoryConfigs } = values;

//     if (editingKey) {
//       // UPDATE MODE - Handle updates one by one
//       for (const config of categoryConfigs) {
//         if (config.id) {
//           // Update existing configuration
//           await updateConfig.mutateAsync({
//             id: config.id,
//             data: {
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryType,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//             },
//           });
//         } else {
//           // Create new configuration under same origin/subOrigin
//           await createConfig.mutateAsync({
//             origin,
//             subOrigin: subOriginId,
//             categoryType: config.categoryType,
//             amount: Number(config.amount),
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//           });
//         }
//       }
//     } else {
//       // CREATE MODE - Create all configurations
//       // You can use bulk create for better performance
//       const configsToCreate = categoryConfigs.map((config: any) => ({
//         origin,
//         subOrigin: subOriginId,
//         categoryType: config.categoryType,
//         amount: Number(config.amount),
//         period: config.period,
//         status: config.status ? "ACTIVE" : "INACTIVE",
//       }));
      
//       // Create all configs (the service will handle the items array)
//       for (const config of configsToCreate) {
//         await createConfig.mutateAsync(config);
//       }
//     }

//     api.success({
//       message: "Configuration saved successfully",
//       placement: "topRight",
//     });

//     setIsModalVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     await refetch();
//   } catch (error: any) {
//     console.error("Save error:", error);
//     api.error({
//       message: error.message || "Failed to save configuration",
//       placement: "topRight",
//     });
//   } finally {
//     setIsSaving(false);
//   }
// };

//   // ============== END OF CRITICAL FIX ==============

//   const filterOption = (
//     input: string,
//     option?: { label: string; value: string },
//   ) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 0 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             marginBottom: "8px",
//           }}
//         >
//           <div>
//             <Space align="center" style={{ marginBottom: "4px" }}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Config
//               </Title>
//             </Space>
//             <Text
//               type="secondary"
//               style={{
//                 display: "block",
//                 marginBottom: "8px",
//                 marginLeft: "20px",
//                 fontSize: "12px",
//               }}
//             >
//               Configure amounts by position/grade/dept
//             </Text>

//             <Space size={12}>
//               <Tag
//                 color="processing"
//                 style={{
//                   marginLeft: "20px",
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//               >
//                 Total: {dataSource.length}
//               </Tag>
//               <Tag
//                 color="success"
//                 style={{
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//                 icon={<PlusOutlined style={{ fontSize: "10px" }} />}
//               >
//                 Active: {activeConfigs.length}
//               </Tag>
//               <Tag
//                 color="error"
//                 style={{
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//                 icon={<DeleteOutlined style={{ fontSize: "10px" }} />}
//               >
//                 Inactive: {inactiveConfigs.length}
//               </Tag>
//             </Space>
//           </div>

//           <Space size={12}>
//             <Input.Search
//               placeholder="Search by origin or category..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setIsModalVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={dataSource.filter(
//             (item) =>
//               item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//               item.categoryType
//                 ?.toLowerCase()
//                 .includes(searchText.toLowerCase()),
//           )}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="key"
//           bordered
//         />

//         <Modal
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             if (isSaving) return;
//             setIsModalVisible(false);
//             form.resetFields();
//             setEditingKey(null);
//           }}
//           onOk={() => form.submit()}
//           destroyOnHidden
//           confirmLoading={isSaving}
//           cancelButtonProps={{ disabled: isSaving }}
//           width={650}
//           okText={editingKey ? "Update" : "Create"}
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="origin"
//                   label="Origin"
//                   rules={[{ required: true, message: "Please select origin" }]}
//                 >
//                   <Select
//                     placeholder="Select Origin"
//                     disabled={!!editingKey}
//                     onChange={() => {
//                       form.setFieldsValue({ subOriginId: undefined });
//                     }}
//                   >
//                     <Option value="Grade">Grade</Option>
//                     <Option value="Department">Department</Option>
//                     <Option value="Sub-department">Sub-department</Option>
//                     <Option value="Position">Position</Option>
//                     <Option value="User">User</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>

//               <Col span={12}>
//                 <Form.Item
//                   name="subOriginId"
//                   label="Sub-Origin"
//                   rules={[
//                     { required: true, message: "Please select sub-origin" },
//                   ]}
//                 >
//                   <Select
//                     placeholder="Select Sub-Origin"
//                     disabled={!originType || !!editingKey}
//                     loading={getSubOriginLoading()}
//                     showSearch
//                     filterOption={filterOption}
//                     options={getSubOriginOptions()}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Modal>
//       </div>
//     </ProtectedRoute>
//   );
// }
















// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
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
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigs,
//   useCreateReimbursementConfig,
//   useUpdateReimbursementConfig,
//   useDeleteReimbursementConfig,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryType: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
// }

// interface GroupedReimbursement {
//   key: string;
//   origin: string;
//   subOriginId: string;
//   subOriginLabel: string;
//   configurations: ReimbursementRecord[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   approveId?: string | null;
// }

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

// // Simple Approval Levels Component - Only Level, Position, Employee
// const ApprovalLevelsContent = ({
//   value = [],
//   onChange,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});
  
//   // Use your existing positions hook
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   // Fetch employees when position changes
//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       approveId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     onChange?.(newRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].approveId = null; // Clear employee when position changes
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 16 }}>
//       {(value || []).map((row, index) => (
//         <div key={index} style={{ marginBottom: 16 }}>
//           <Row gutter={16} align="middle">
//             <Col span={6}>
//               <Form.Item label="Level" required style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Level"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={8}>
//               <Form.Item label="Position" required style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: `${pos.title}`,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={8}>
//               <Form.Item label="Employee"  style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select employee"
//                   value={row.approveId}
//                   onChange={(val) => updateApproverRow(index, 'approveId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={2} style={{ textAlign: 'right' }}>
//               <Button 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 onClick={() => removeApproverRow(index)}
//                 disabled={(value?.length || 0) <= 1}
//                 size="small"
//               />
//             </Col>
//           </Row>
//         </div>
//       ))}

//       <Button 
//         type="dashed" 
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//       >
//         + Add Approval Level
//       </Button>
//     </div>
//   );
// };

// // Category Config List Component
// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: { name: string; code: string }[];
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
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

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

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
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={12}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryType"]}
//                       label="Category Type"
//                       rules={[
//                         {
//                           required: true,
//                           message: "Please select category type",
//                         },
//                       ]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                       >
//                         {categoryOptions
//                           .filter(
//                             (opt) => !selectedInOtherRows.includes(opt.name),
//                           )
//                           .map((opt) => (
//                             <Option key={opt.code} value={opt.name}>
//                               {opt.name}
//                             </Option>
//                           ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label="Amount"
//                       rules={[
//                         { required: true, message: "Please enter amount" },
//                       ]}
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
//                       rules={[
//                         { required: true, message: "Please select period" },
//                       ]}
//                     >
//                       <Select placeholder="Period">
//                         <Option value="MONTH">Per Month</Option>
//                         <Option value="YEAR">Per Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f5f5f5",
//                       marginBottom: 12,
//                       border: "1px dashed #d9d9d9",
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
//   const [categoryOptions, setCategoryOptions] = useState<
//     { name: string; code: string }[]
//   >([]);
//   const [approvers, setApprovers] = useState<ApproverRow[]>([
//     { level: 1, positionId: '', : null },
//   ]);

//   const { data: configs, isLoading, refetch } = useReimbursementConfigs();
//   const createConfig = useCreateReimbursementConfig();
//   const updateConfig = useUpdateReimbursementConfig();
//   const deleteConfig = useDeleteReimbursementConfig();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } =
//     useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

//   const membersMap = useMemo(() => {
//     return members.reduce(
//       (acc, member) => {
//         acc[member.id] = member.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [members]);

//   const gradesMap = useMemo(() => {
//     return grades.reduce(
//       (acc, grade) => {
//         acc[grade.id] = grade.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [grades]);

//   const departmentsMap = useMemo(() => {
//     return departments.reduce(
//       (acc, dept) => {
//         acc[dept.id] = dept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [departments]);

//   const subDepartmentsMap = useMemo(() => {
//     return subDepartments.reduce(
//       (acc, subDept) => {
//         acc[subDept.id] = subDept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [subDepartments]);

//   const positionsMap = useMemo(() => {
//     return positions.reduce(
//       (acc, pos) => {
//         acc[pos.id] = pos.title;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [positions]);

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
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//       });
//     });

//     return Object.values(groups);
//   }, [configs, getSubOriginLabel]);

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];

//     const configArray = Array.isArray(configs) ? configs : [];

//     return configArray.map((config) => {
//       let subOriginLabel = config.subOrigin;

//       if (config.origin === "User") {
//         subOriginLabel = membersMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Grade") {
//         subOriginLabel = gradesMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Department") {
//         subOriginLabel = departmentsMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Sub-department") {
//         subOriginLabel =
//           subDepartmentsMap[config.subOrigin] || config.subOrigin;
//       } else if (config.origin === "Position") {
//         subOriginLabel = positionsMap[config.subOrigin] || config.subOrigin;
//       }

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
//         monthlyAmount: config.monthlyAmount
//           ? Number(config.monthlyAmount)
//           : undefined,
//         yearlyAmount: config.yearlyAmount
//           ? Number(config.yearlyAmount)
//           : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//       };
//     });
//   }, [configs, membersMap, gradesMap, departmentsMap, subDepartmentsMap, positionsMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];

//     switch (originType) {
//       case "User":
//         return members.map((m) => ({
//           label: m.name,
//           value: m.id,
//         }));
//       case "Grade":
//         return grades.map((g) => ({
//           label: g.name,
//           value: g.id,
//         }));
//       case "Department":
//         return departments.map((d) => ({
//           label: d.name,
//           value: d.id,
//         }));
//       case "Sub-department":
//         return subDepartments.map((sd) => ({
//           label: sd.name,
//           value: sd.id,
//         }));
//       case "Position":
//         return positions.map((p) => ({
//           label: p.title,
//           value: p.id,
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
//       render: (text: string) => {
//         const capitalizedText = text
//           ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
//           : "-";
//         return <Tag color="blue">{capitalizedText}</Tag>;
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

//     const group = groupedData.find((g) =>
//       g.configurations.some((c) => c.key === record.key),
//     );

//     if (group) {
//       const configsForForm = group.configurations.map((config) => ({
//         id: config.key,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
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
//       form.setFieldsValue({
//         origin: record.origin,
//         subOriginId: record.subOriginId,
//         categoryConfigs: [
//           {
//             id: record.key,
//             policyId: record.policyId,
//             ruleId: record.ruleId,
//             categoryType: record.categoryType,
//             amount: record.amount,
//             period: record.period,
//             status: record.status === "ACTIVE",
//           },
//         ],
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
//         for (const config of categoryConfigs) {
//           if (config.id) {
//             await updateConfig.mutateAsync({
//               id: config.id,
//               data: {
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryType,
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approvers.map(a => ({
//                   level: a.level,
//                   approverType: 'specific_employee',
//                   approverId: a.employeeId,
//                 })),
//               },
//             });
//           } else {
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryType,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approvers.map(a => ({
//                 level: a.level,
//                 approverType: 'specific_employee',
//                 approverId: a.employeeId,
//               })),
//             });
//           }
//         }
//       } else {
//         for (const config of categoryConfigs) {
//           await createConfig.mutateAsync({
//             origin,
//             subOrigin: subOriginId,
//             categoryType: config.categoryType,
//             amount: Number(config.amount),
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//             approvers: approvers.map(a => ({
//               level: a.level,
//               approverType: 'specific_employee',
//               approverId: a.employeeId,
//             })),
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
//       setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//       await refetch();
//     } catch (error: any) {
//       console.error("Save error:", error);
//       api.error({
//         message: error.message || "Failed to save configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const filterOption = (
//     input: string,
//     option?: { label: string; value: string },
//   ) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 0 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             marginBottom: "8px",
//           }}
//         >
//           <div>
//             <Space align="center" style={{ marginBottom: "4px" }}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Config
//               </Title>
//             </Space>
//             <Text
//               type="secondary"
//               style={{
//                 display: "block",
//                 marginBottom: "8px",
//                 marginLeft: "20px",
//                 fontSize: "12px",
//               }}
//             >
//               Configure amounts by position/grade/dept
//             </Text>

//             <Space size={12}>
//               <Tag
//                 color="processing"
//                 style={{
//                   marginLeft: "20px",
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//               >
//                 Total: {dataSource.length}
//               </Tag>
//               <Tag
//                 color="success"
//                 style={{
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//                 icon={<PlusOutlined style={{ fontSize: "10px" }} />}
//               >
//                 Active: {activeConfigs.length}
//               </Tag>
//               <Tag
//                 color="error"
//                 style={{
//                   borderRadius: "999px",
//                   fontSize: "12px",
//                   padding: "0 8px",
//                 }}
//                 icon={<DeleteOutlined style={{ fontSize: "10px" }} />}
//               >
//                 Inactive: {inactiveConfigs.length}
//               </Tag>
//             </Space>
//           </div>

//           <Space size={12}>
//             <Input.Search
//               placeholder="Search by origin or category..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setIsModalVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={dataSource.filter(
//             (item) =>
//               item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//               item.categoryType
//                 ?.toLowerCase()
//                 .includes(searchText.toLowerCase()),
//           )}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="key"
//           bordered
//         />

//         <Modal
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             if (isSaving) return;
//             setIsModalVisible(false);
//             form.resetFields();
//             setEditingKey(null);
//             setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//           }}
//           onOk={() => form.submit()}
//           destroyOnHidden
//           confirmLoading={isSaving}
//           cancelButtonProps={{ disabled: isSaving }}
//           width={900}
//           okText={editingKey ? "Update" : "Create"}
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="origin"
//                   label="Origin"
//                   rules={[{ required: true, message: "Please select origin" }]}
//                 >
//                   <Select
//                     placeholder="Select Origin"
//                     disabled={!!editingKey}
//                     onChange={() => {
//                       form.setFieldsValue({ subOriginId: undefined });
//                     }}
//                   >
//                     <Option value="Grade">Grade</Option>
//                     <Option value="Department">Department</Option>
//                     <Option value="Sub-department">Sub-department</Option>
//                     <Option value="Position">Position</Option>
//                     <Option value="User">User</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>

//               <Col span={12}>
//                 <Form.Item
//                   name="subOriginId"
//                   label="Sub-Origin"
//                   rules={[
//                     { required: true, message: "Please select sub-origin" },
//                   ]}
//                 >
//                   <Select
//                     placeholder="Select Sub-Origin"
//                     disabled={!originType || !!editingKey}
//                     loading={getSubOriginLoading()}
//                     showSearch
//                     filterOption={filterOption}
//                     options={getSubOriginOptions()}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                 />
//               )}
//             </Form.List>

//             <ApprovalLevelsContent 
//               value={approvers}
//               onChange={setApprovers}
//             />
//           </Form>
//         </Modal>
//       </div>
//     </ProtectedRoute>
//   );
// }












// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
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
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryType: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface GroupedReimbursement {
//   key: string;
//   origin: string;
//   subOriginId: string;
//   subOriginLabel: string;
//   configurations: ReimbursementRecord[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

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

// // Approval Levels Component
// const ApprovalLevelsContent = ({
//   value = [],
//   onChange,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});
  
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
    
//     // Reorder levels
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
    
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 16, marginBottom: 16 }}>
//       <Title level={5}>Approval Workflow</Title>
//       <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
//         Configure approval levels for this configuration
//       </Text>
      
//       {(value || []).map((row, index) => (
//         <Card key={index} size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
//           <Row gutter={16} align="middle">
//             <Col span={4}>
//               <Form.Item label="Level" required style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Level"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={8}>
//               <Form.Item label="Position" required style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={8}>
//               <Form.Item label="Employee" style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select employee (optional)"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={4} style={{ textAlign: 'right' }}>
//               <Button 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 onClick={() => removeApproverRow(index)}
//                 disabled={(value?.length || 0) <= 1}
//                 size="small"
//               />
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//       >
//         Add Approval Level
//       </Button>
//     </div>
//   );
// };

// // Category Config List Component
// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: { name: string; code: string }[];
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
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
//       <Title level={5}>Category Configurations</Title>
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

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           return {
//             key: key,
//             label: currentCategoryType || `Category ${name + 1}`,
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
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryType"]}
//                       label="Category Type"
//                       rules={[
//                         {
//                           required: true,
//                           message: "Please select category type",
//                         },
//                       ]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                       >
//                         {categoryOptions
//                           .filter(
//                             (opt) => !selectedInOtherRows.includes(opt.name),
//                           )
//                           .map((opt) => (
//                             <Option key={opt.code} value={opt.name}>
//                               {opt.name}
//                             </Option>
//                           ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label="Amount"
//                       rules={[
//                         { required: true, message: "Please enter amount" },
//                       ]}
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
//                       rules={[
//                         { required: true, message: "Please select period" },
//                       ]}
//                     >
//                       <Select placeholder="Period">
//                         <Option value="MONTH">Per Month</Option>
//                         <Option value="YEAR">Per Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f5f5f5",
//                       marginBottom: 12,
//                       border: "1px dashed #d9d9d9",
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
//         + Add Another Category
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
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<
//     { name: string; code: string }[]
//   >([]);
//   const [approvers, setApprovers] = useState<ApproverRow[]>([
//     { level: 1, positionId: '', employeeId: null },
//   ]);

//   // Use the correctly named hooks
//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

//   const membersMap = useMemo(() => {
//     return members.reduce(
//       (acc, member) => {
//         acc[member.id] = member.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [members]);

//   const gradesMap = useMemo(() => {
//     return grades.reduce(
//       (acc, grade) => {
//         acc[grade.id] = grade.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [grades]);

//   const departmentsMap = useMemo(() => {
//     return departments.reduce(
//       (acc, dept) => {
//         acc[dept.id] = dept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [departments]);

//   const subDepartmentsMap = useMemo(() => {
//     return subDepartments.reduce(
//       (acc, subDept) => {
//         acc[subDept.id] = subDept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [subDepartments]);

//   const positionsMap = useMemo(() => {
//     return positions.reduce(
//       (acc, pos) => {
//         acc[pos.id] = pos.title;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [positions]);

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

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];

//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;

//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryType: config.categoryType,
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];

//     switch (originType) {
//       case "User":
//         return members.map((m) => ({
//           label: m.name,
//           value: m.id,
//         }));
//       case "Grade":
//         return grades.map((g) => ({
//           label: g.name,
//           value: g.id,
//         }));
//       case "Department":
//         return departments.map((d) => ({
//           label: d.name,
//           value: d.id,
//         }));
//       case "Sub-department":
//         return subDepartments.map((sd) => ({
//           label: sd.name,
//           value: sd.id,
//         }));
//       case "Position":
//         return positions.map((p) => ({
//           label: p.title,
//           value: p.id,
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
//       render: (text: string) => {
//         const capitalizedText = text
//           ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
//           : "-";
//         return <Tag color="blue">{capitalizedText}</Tag>;
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
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleEdit = (record: ReimbursementRecord) => {
//     setEditingKey(record.id);
    
//     // Find if there are multiple configs for the same origin/subOrigin
//     const sameOriginConfigs = dataSource.filter(
//       item => item.origin === record.origin && item.subOriginId === record.subOriginId
//     );

//     if (sameOriginConfigs.length > 1) {
//       // Multiple configs for same origin/subOrigin
//       const configsForForm = sameOriginConfigs.map((config) => ({
//         id: config.id,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         categoryType: config.categoryType,
//         amount: config.amount,
//         period: config.period,
//         status: config.status === "ACTIVE",
//       }));

//       form.setFieldsValue({
//         origin: record.origin,
//         subOriginId: record.subOriginId,
//         categoryConfigs: configsForForm,
//       });

//       // Set approvers from the first config (assuming all have same approvers)
//       if (sameOriginConfigs[0].approvers) {
//         const approverRows = sameOriginConfigs[0].approvers.map((a: any) => ({
//           level: a.level,
//           positionId: a.position?.id || a.positionId,
//           employeeId: a.employee?.id || a.employeeId,
//         }));
//         setApprovers(approverRows);
//       }
//     } else {
//       // Single config
//       form.setFieldsValue({
//         origin: record.origin,
//         subOriginId: record.subOriginId,
//         categoryConfigs: [
//           {
//             id: record.id,
//             policyId: record.policyId,
//             ruleId: record.ruleId,
//             categoryType: record.categoryType,
//             amount: record.amount,
//             period: record.period,
//             status: record.status === "ACTIVE",
//           },
//         ],
//       });

//       // Set approvers
//       if (record.approvers) {
//         const approverRows = record.approvers.map((a: any) => ({
//           level: a.level,
//           positionId: a.position?.id || a.positionId,
//           employeeId: a.employee?.id || a.employeeId,
//         }));
//         setApprovers(approverRows);
//       }
//     }

//     setIsModalVisible(true);
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
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
//       setDeletingId(null);
//     }
//   };

//   const handleSave = async (values: any) => {
//     setIsSaving(true);
//     try {
//       const { origin, subOriginId, categoryConfigs } = values;

//       // Prepare approvers data
//       const approversData = approvers
//         .filter(a => a.positionId) // Only include rows with position selected
//         .map(a => ({
//           level: a.level,
//           approverType: a.employeeId ? 'specific_employee' : 'position',
//           approverId: a.employeeId || a.positionId,
//         }));
//          console.log('=== SAVE PAYLOAD ===');
//     console.log('Form Values:', values);
//     console.log('Approvers Data:', approversData);
//     console.log('Editing Key:', editingKey);

//       if (editingKey) {
//         // Update existing configurations
//         for (const config of categoryConfigs) {
//           if (config.id) {
//             await updateConfig.mutateAsync({
//               id: config.id,
//               data: {
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryType,
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               },
//             });
//           } else {
//             // Create new config if no ID (shouldn't happen in edit mode)
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryType,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
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
//             amount: Number(config.amount),
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//             approvers: approversData,
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
//       setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//       await refetch();
//     } catch (error: any) {
//       console.error("Save error:", error);
//       api.error({
//         message: error.message || "Failed to save configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const filterOption = (
//     input: string,
//     option?: { label: string; value: string },
//   ) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.categoryType?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center">
//               <WalletOutlined style={{ fontSize: "24px", color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//             <Text type="secondary" style={{ marginLeft: 32 }}>
//               Configure reimbursement amounts by grade, department, position, or user
//             </Text>
//           </div>

//           <Space size={12}>
//             <Input.Search
//               placeholder="Search configurations..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//                 setIsModalVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 16 }}>
//           <Space size={12}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Modal
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             if (isSaving) return;
//             setIsModalVisible(false);
//             form.resetFields();
//             setEditingKey(null);
//             setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//           }}
//           onOk={() => form.submit()}
//           destroyOnClose
//           confirmLoading={isSaving}
//           cancelButtonProps={{ disabled: isSaving }}
//           width={1000}
//           okText={editingKey ? "Update" : "Create"}
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="origin"
//                   label="Origin"
//                   rules={[{ required: true, message: "Please select origin" }]}
//                 >
//                   <Select
//                     placeholder="Select Origin"
//                     disabled={!!editingKey}
//                     onChange={() => {
//                       form.setFieldsValue({ subOriginId: undefined });
//                     }}
//                   >
//                     <Option value="Grade">Grade</Option>
//                     <Option value="Department">Department</Option>
//                     <Option value="Sub-department">Sub-department</Option>
//                     <Option value="Position">Position</Option>
//                     <Option value="User">User</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>

//               <Col span={12}>
//                 <Form.Item
//                   name="subOriginId"
//                   label="Sub-Origin"
//                   rules={[
//                     { required: true, message: "Please select sub-origin" },
//                   ]}
//                 >
//                   <Select
//                     placeholder="Select Sub-Origin"
//                     disabled={!originType || !!editingKey}
//                     loading={getSubOriginLoading()}
//                     showSearch
//                     filterOption={filterOption}
//                     options={getSubOriginOptions()}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                 />
//               )}
//             </Form.List>

//             <ApprovalLevelsContent 
//               value={approvers}
//               onChange={setApprovers}
//             />
//           </Form>
//         </Modal>
//       </div>
//     </ProtectedRoute>
//   );
// }

















// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
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
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// // Updated interface to include categoryTypeId
// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryTypeId: string;  // Changed from categoryType
//   categoryTypeName?: string; // For display purposes
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface GroupedReimbursement {
//   key: string;
//   origin: string;
//   subOriginId: string;
//   subOriginLabel: string;
//   configurations: ReimbursementRecord[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// // New interface for category options with ID
// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

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

// // Approval Levels Component
// const ApprovalLevelsContent = ({
//   value = [],
//   onChange,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});
  
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
    
//     // Reorder levels
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
    
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 16, marginBottom: 16 }}>
//       <Title level={5}>Approval Workflow</Title>
//       <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
//         Configure approval levels for this configuration
//       </Text>
      
//       {(value || []).map((row, index) => (
//         <Card key={index} size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
//           <Row gutter={16} align="middle">
//             <Col span={4}>
//               <Form.Item label="Level" required style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Level"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={8}>
//               <Form.Item label="Position" required style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={8}>
//               <Form.Item label="Employee" style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select employee (optional)"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={4} style={{ textAlign: 'right' }}>
//               <Button 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 onClick={() => removeApproverRow(index)}
//                 disabled={(value?.length || 0) <= 1}
//                 size="small"
//               />
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//       >
//         Add Approval Level
//       </Button>
//     </div>
//   );
// };

// // Updated Category Config List Component with categoryTypeId
// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   originType,
//   subOriginOptions,
//   subOriginLoading,
//   filterOption,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   originType?: string;
//   subOriginOptions: { label: string; value: string }[];
//   subOriginLoading: boolean;
//   filterOption: (input: string, option?: { label: string; value: string }) => boolean;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
//   const prevFieldsLength = useRef(fields.length);

//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length]);

//   // Get selected subOriginIds from other rows
//   const getSelectedSubOriginIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.subOriginId)
//       .filter(Boolean);
//   };

//   // Get selected categoryTypeIds from other rows
//   const getSelectedCategoryTypeIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryTypeId)
//       .filter(Boolean);
//   };

//   // Find category name by ID for display
//   const getCategoryNameById = (id: string) => {
//     const category = categoryOptions.find(opt => opt.id === id);
//     return category?.name || 'Unknown';
//   };

//   return (
//     <>
//       <Title level={5}>Category Configurations</Title>
//       <Collapse
//         accordion
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }) => {
//           const selectedSubOriginIds = getSelectedSubOriginIds(name);
//           const selectedCategoryTypeIds = getSelectedCategoryTypeIds(name);

//           const currentSubOriginId = categoryConfigs?.[name]?.subOriginId;
//           const currentCategoryTypeId = categoryConfigs?.[name]?.categoryTypeId;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           // Filter subOrigin options to exclude already selected ones
//           const filteredSubOriginOptions = subOriginOptions.filter(
//             option => !selectedSubOriginIds.includes(option.value)
//           );

//           // Filter category options to exclude already selected ones
//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryTypeIds.includes(option.id)
//           );

//           return {
//             key: key,
//             label: (
//               <Space>
//                 <Tag color="blue">
//                   {currentCategoryTypeId 
//                     ? getCategoryNameById(currentCategoryTypeId) 
//                     : 'New Category'}
//                 </Tag>
//                 <Text type="secondary">
//                   {currentSubOriginId 
//                     ? subOriginOptions.find(opt => opt.value === currentSubOriginId)?.label 
//                     : 'Select Sub-Origin'}
//                 </Text>
//               </Space>
//             ),
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
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "subOriginId"]}
//                       label="Sub-Origin"
//                       rules={[
//                         {
//                           required: true,
//                           message: "Please select sub-origin",
//                         },
//                       ]}
//                     >
//                       <Select
//                         placeholder="Select Sub-Origin"
//                         disabled={!originType || !!editingKey}
//                         loading={subOriginLoading}
//                         showSearch
//                         filterOption={filterOption}
//                         options={filteredSubOriginOptions}
//                       />
//                     </Form.Item>
//                   </Col>

//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryTypeId"]}
//                       label="Category Type"
//                       rules={[
//                         {
//                           required: true,
//                           message: "Please select category type",
//                         },
//                       ]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.id} label={opt.name}>
//                             {opt.name} ({opt.code})
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
//                       rules={[
//                         { required: true, message: "Please enter amount" },
//                       ]}
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
//                 </Row>

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "period"]}
//                       label="Period"
//                       rules={[
//                         { required: true, message: "Please select period" },
//                       ]}
//                     >
//                       <Select placeholder="Period">
//                         <Option value="MONTH">Per Month</Option>
//                         <Option value="YEAR">Per Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={8}>
//                     <div style={{ ...switchRowCard, marginTop: 30 }}>
//                       <div>
//                         <div style={switchTitle}>Status</div>
//                         <div style={switchDesc}>Category type is active</div>
//                       </div>

//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f5f5f5",
//                       marginBottom: 12,
//                       border: "1px dashed #d9d9d9",
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
//         disabled={!originType}
//       >
//         + Add Another Category
//       </Button>
//       {!originType && (
//         <Text type="secondary" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
//           Please select an origin first to add categories
//         </Text>
//       )}
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
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
//   const [approvers, setApprovers] = useState<ApproverRow[]>([
//     { level: 1, positionId: '', employeeId: null },
//   ]);

//   // Use the correctly named hooks
//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   // Fetch category options with IDs
//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
        
//         // Create a map for easy lookup
//         const map: Record<string, string> = {};
//         options.forEach(opt => {
//           map[opt.id] = opt.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

//   const membersMap = useMemo(() => {
//     return members.reduce(
//       (acc, member) => {
//         acc[member.id] = member.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [members]);

//   const gradesMap = useMemo(() => {
//     return grades.reduce(
//       (acc, grade) => {
//         acc[grade.id] = grade.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [grades]);

//   const departmentsMap = useMemo(() => {
//     return departments.reduce(
//       (acc, dept) => {
//         acc[dept.id] = dept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [departments]);

//   const subDepartmentsMap = useMemo(() => {
//     return subDepartments.reduce(
//       (acc, subDept) => {
//         acc[subDept.id] = subDept.name;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [subDepartments]);

//   const positionsMap = useMemo(() => {
//     return positions.reduce(
//       (acc, pos) => {
//         acc[pos.id] = pos.title;
//         return acc;
//       },
//       {} as Record<string, string>,
//     );
//   }, [positions]);

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

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];

//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;

//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryTypeId: config.categoryType, // Store ID
//         categoryTypeName: categoryMap[config.categoryType] || config.categoryType, // For display
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel, categoryMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];

//     switch (originType) {
//       case "User":
//         return members.map((m) => ({
//           label: m.name,
//           value: m.id,
//         }));
//       case "Grade":
//         return grades.map((g) => ({
//           label: g.name,
//           value: g.id,
//         }));
//       case "Department":
//         return departments.map((d) => ({
//           label: d.name,
//           value: d.id,
//         }));
//       case "Sub-department":
//         return subDepartments.map((sd) => ({
//           label: sd.name,
//           value: sd.id,
//         }));
//       case "Position":
//         return positions.map((p) => ({
//           label: p.title,
//           value: p.id,
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
//       key: "categoryType",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const categoryName = record.categoryTypeName || record.categoryTypeId;
//         return <Tag color="blue">{categoryName}</Tag>;
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
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleEdit = (record: ReimbursementRecord) => {
//     setEditingKey(record.id);
    
//     // Find if there are multiple configs for the same origin
//     const sameOriginConfigs = dataSource.filter(
//       item => item.origin === record.origin
//     );

//     if (sameOriginConfigs.length > 1) {
//       // Multiple configs for same origin (different subOrigins)
//       const configsForForm = sameOriginConfigs.map((config) => ({
//         id: config.id,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         subOriginId: config.subOriginId,
//         categoryTypeId: config.categoryTypeId, // Use ID
//         amount: config.amount,
//         period: config.period,
//         status: config.status === "ACTIVE",
//       }));

//       form.setFieldsValue({
//         origin: record.origin,
//         categoryConfigs: configsForForm,
//       });

//       // Set approvers from the first config
//       if (sameOriginConfigs[0].approvers) {
//         const approverRows = sameOriginConfigs[0].approvers.map((a: any) => ({
//           level: a.level,
//           positionId: a.position?.id || a.positionId,
//           employeeId: a.employee?.id || a.employeeId,
//         }));
//         setApprovers(approverRows);
//       }
//     } else {
//       // Single config
//       form.setFieldsValue({
//         origin: record.origin,
//         categoryConfigs: [
//           {
//             id: record.id,
//             policyId: record.policyId,
//             ruleId: record.ruleId,
//             subOriginId: record.subOriginId,
//             categoryTypeId: record.categoryTypeId, // Use ID
//             amount: record.amount,
//             period: record.period,
//             status: record.status === "ACTIVE",
//           },
//         ],
//       });

//       // Set approvers
//       if (record.approvers) {
//         const approverRows = record.approvers.map((a: any) => ({
//           level: a.level,
//           positionId: a.position?.id || a.positionId,
//           employeeId: a.employee?.id || a.employeeId,
//         }));
//         setApprovers(approverRows);
//       }
//     }

//     setIsModalVisible(true);
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
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
//       setDeletingId(null);
//     }
//   };

//   const handleSave = async (values: any) => {
//     setIsSaving(true);
//     try {
//       const { origin, categoryConfigs } = values;

//       // Prepare approvers data
//       const approversData = approvers
//         .filter(a => a.positionId)
//         .map(a => ({
//           level: a.level,
//           approverType: a.employeeId ? 'specific_employee' : 'position',
//           approverId: a.employeeId || a.positionId,
//         }));

//       console.log('=== SAVE PAYLOAD ===');
//       console.log('Origin:', origin);
//       console.log('Category Configs:', categoryConfigs.map((config: any) => ({
//         subOriginId: config.subOriginId,
//         categoryTypeId: config.categoryTypeId, // Using ID
//         amount: config.amount,
//         period: config.period,
//         status: config.status
//       })));
//       console.log('Approvers Data:', approversData);
//       console.log('Editing Key:', editingKey);

//       if (editingKey) {
//         // Update existing configurations
//         for (const config of categoryConfigs) {
//           if (config.id) {
//             await updateConfig.mutateAsync({
//               id: config.id,
//               data: {
//                 origin,
//                 subOrigin: config.subOriginId,
//                 categoryType: config.categoryTypeId, // Send ID to backend
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               },
//             });
//           } else {
//             // Create new config if no ID
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: config.subOriginId,
//               categoryType: config.categoryTypeId, // Send ID to backend
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
//             });
//           }
//         }
//       } else {
//         // Create new configurations
//         for (const config of categoryConfigs) {
//           await createConfig.mutateAsync({
//             origin,
//             subOrigin: config.subOriginId,
//             categoryType: config.categoryTypeId, // Send ID to backend
//             amount: Number(config.amount),
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//             approvers: approversData,
//           });
//         }
//       }

//       api.success({
//         message: "Configuration saved successfully",
//         description: `Saved ${categoryConfigs.length} category configuration(s)`,
//         placement: "topRight",
//       });

//       setIsModalVisible(false);
//       form.resetFields();
//       setEditingKey(null);
//       setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//       await refetch();
//     } catch (error: any) {
//       console.error("Save error:", error);
//       api.error({
//         message: error.message || "Failed to save configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const filterOption = (
//     input: string,
//     option?: { label: string; value: string },
//   ) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         (item.categoryTypeName || item.categoryTypeId)?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center">
//               <WalletOutlined style={{ fontSize: "24px", color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//             <Text type="secondary" style={{ marginLeft: 32 }}>
//               Configure reimbursement amounts by grade, department, position, or user
//             </Text>
//           </div>

//           <Space size={12}>
//             <Input.Search
//               placeholder="Search configurations..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//                 setIsModalVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 16 }}>
//           <Space size={12}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Modal
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             if (isSaving) return;
//             setIsModalVisible(false);
//             form.resetFields();
//             setEditingKey(null);
//             setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//           }}
//           onOk={() => form.submit()}
//           destroyOnClose
//           confirmLoading={isSaving}
//           cancelButtonProps={{ disabled: isSaving }}
//           width={1000}
//           okText={editingKey ? "Update" : "Create"}
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="origin"
//                   label="Origin"
//                   rules={[{ required: true, message: "Please select origin" }]}
//                 >
//                   <Select
//                     placeholder="Select Origin"
//                     disabled={!!editingKey}
//                     onChange={() => {
//                       form.setFieldsValue({ categoryConfigs: [{}] });
//                     }}
//                   >
//                     <Option value="Grade">Grade</Option>
//                     <Option value="Department">Department</Option>
//                     <Option value="Sub-department">Sub-department</Option>
//                     <Option value="Position">Position</Option>
//                     <Option value="User">User</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   originType={originType}
//                   subOriginOptions={getSubOriginOptions()}
//                   subOriginLoading={getSubOriginLoading()}
//                   filterOption={filterOption}
//                 />
//               )}
//             </Form.List>

//             <ApprovalLevelsContent 
//               value={approvers}
//               onChange={setApprovers}
//             />
//           </Form>
//         </Modal>
//       </div>
//     </ProtectedRoute>
//   );
// }




// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
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
//   Divider,
//   Spin,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
//   UserOutlined,
//   ReloadOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryTypeId: string;
//   categoryTypeName?: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

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

// // Approval Levels Component
// const ApprovalLevelsContent = ({
//   value = [],
//   onChange,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});
  
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 16 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Space>
//           <UserOutlined style={{ color: '#1677ff' }} />
//           <Title level={5} style={{ margin: 0 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing">{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 12, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff'
//           }}
//         >
//           <Row gutter={16} align="middle">
//             <Col span={3}>
//               <Form.Item label="Level" required style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Level"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={8}>
//               <Form.Item label="Position" required style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={8}>
//               <Form.Item label="Employee (Optional)" style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={5} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove approver level">
//                 <Button 
//                   danger 
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                   size="small"
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 8 }}
//       >
//         Add Approval Level
//       </Button>
//     </div>
//   );
// };

// // Category Config List Component
// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   approvers,
//   onApproversChange,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   approvers: ApproverRow[];
//   onApproversChange: (value: ApproverRow[]) => void;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
//   const prevFieldsLength = useRef(fields.length);

//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length]);

//   const getSelectedCategoryTypeIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryTypeId)
//       .filter(Boolean);
//   };

//   const getCategoryNameById = (id: string) => {
//     const category = categoryOptions.find(opt => opt.id === id);
//     return category?.name || 'Unknown';
//   };

//   return (
//     <Card 
//       style={{ 
//         marginBottom: 16,
//         border: '1px solid #f0f0f0',
//         borderRadius: 8
//       }}
//     >
//       <Title level={5}>Category Configurations</Title>
      
//       <Collapse
//         accordion
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }) => {
//           const selectedCategoryTypeIds = getSelectedCategoryTypeIds(name);
//           const currentCategoryTypeId = categoryConfigs?.[name]?.categoryTypeId;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryTypeIds.includes(option.id)
//           );

//           return {
//             key: key,
//             label: (
//               <Space>
//                 <Tag color="blue">
//                   {currentCategoryTypeId 
//                     ? getCategoryNameById(currentCategoryTypeId) 
//                     : 'New Category'}
//                 </Tag>
//               </Space>
//             ),
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
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryTypeId"]}
//                       label="Category Type"
//                       rules={[{ required: true, message: "Please select category type" }]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.id} label={opt.name}>
//                             {opt.name} ({opt.code})
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

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <div style={{ ...switchRowCard, marginTop: 0 }}>
//                       <div>
//                         <div style={switchTitle}>Status</div>
//                         <div style={switchDesc}>Category type is active</div>
//                       </div>
//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "linear-gradient(135deg, #f6f9fc 0%, #e6f7ff 100%)",
//                       marginTop: 12,
//                       border: "1px solid #91d5ff",
//                       borderRadius: 8,
//                     }}
//                   >
//                     <Row gutter={16}>
//                       <Col span={12}>
//                         <Space direction="vertical" size={2}>
//                           <Text type="secondary">Monthly Amount</Text>
//                           <div>
//                             <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
//                               ₹{previewAmounts.monthly.toFixed(2)}
//                             </Text>
//                           </div>
//                         </Space>
//                       </Col>
//                       <Col span={12}>
//                         <Space direction="vertical" size={2}>
//                           <Text type="secondary">Yearly Amount</Text>
//                           <div>
//                             <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
//                               ₹{previewAmounts.yearly.toFixed(2)}
//                             </Text>
//                           </div>
//                         </Space>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}
//               </>
//             ),
//           };
//         })}
//       />

//       <Button type="dashed" block onClick={() => add()} style={{ marginTop: 12 }}>
//         + Add Another Category
//       </Button>

//       <Divider style={{ margin: '24px 0 16px 0' }} />

//       <ApprovalLevelsContent 
//         value={approvers}
//         onChange={onApproversChange}
//       />
//     </Card>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const subOriginId = Form.useWatch("subOriginId", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
//   const [approvers, setApprovers] = useState<ApproverRow[]>([
//     { level: 1, positionId: '', employeeId: null },
//   ]);

//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
        
//         const map: Record<string, string> = {};
//         options.forEach(opt => {
//           map[opt.id] = opt.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

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

//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") return membersMap[subOriginId] || subOriginId;
//     if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
//     if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
//     if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
//     if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
//     return subOriginId;
//   };

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];
//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;
//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryTypeId: config.categoryType,
//         categoryTypeName: categoryMap[config.categoryType] || config.categoryType,
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel, categoryMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];
//     switch (originType) {
//       case "User": return members.map((m) => ({ label: m.name, value: m.id }));
//       case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
//       case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
//       case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
//       case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
//       default: return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade": return gradesLoading;
//       case "Department": return departmentsLoading;
//       case "Sub-department": return subDepartmentsLoading;
//       case "Position": return positionsLoading;
//       default: return false;
//     }
//   };

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
//       key: "categoryType",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const categoryName = record.categoryTypeName || record.categoryTypeId;
//         return <Tag color="blue">{categoryName}</Tag>;
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
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   // const handleEdit = (record: ReimbursementRecord) => {
//   //   setEditingKey(record.id);
    
//   //   const sameOriginSubConfigs = dataSource.filter(
//   //     item => item.origin === record.origin && item.subOriginId === record.subOriginId
//   //   );

//   //   const configsForForm = sameOriginSubConfigs.map((config) => ({
//   //     id: config.id,
//   //     policyId: config.policyId,
//   //     ruleId: config.ruleId,
//   //     categoryTypeId: config.categoryTypeId,
//   //     amount: config.amount,
//   //     period: config.period,
//   //     status: config.status === "ACTIVE",
//   //   }));

//   //   form.setFieldsValue({
//   //     origin: record.origin,
//   //     subOriginId: record.subOriginId,
//   //     categoryConfigs: configsForForm,
//   //   });

//   //   if (sameOriginSubConfigs[0]?.approvers) {
//   //     const approverRows = sameOriginSubConfigs[0].approvers.map((a: any) => ({
//   //       level: a.level,
//   //       positionId: a.position?.id || a.positionId,
//   //       employeeId: a.employee?.id || a.employeeId,
//   //     }));
//   //     setApprovers(approverRows);
//   //   }

//   //   setIsModalVisible(true);
//   // };
// const handleEdit = (record: ReimbursementRecord) => {
//   setEditingKey(record.id);
  
//   // Find ONLY the selected config, not all with same origin/subOrigin
//   const selectedConfig = dataSource.find(item => item.id === record.id);
  
//   if (!selectedConfig) return;

//   // Prepare form values for just this single config
//   const configsForForm = [{
//     id: selectedConfig.id,
//     policyId: selectedConfig.policyId,
//     ruleId: selectedConfig.ruleId,
//     categoryTypeId: selectedConfig.categoryTypeId,
//     amount: selectedConfig.amount,
//     period: selectedConfig.period,
//     status: selectedConfig.status === "ACTIVE",
//   }];

//   form.setFieldsValue({
//     origin: selectedConfig.origin,
//     subOriginId: selectedConfig.subOriginId,
//     categoryConfigs: configsForForm,
//   });

//   // Set approvers from this config
//   if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//     const approverRows = selectedConfig.approvers.map((a: any) => ({
//       level: a.level,
//       positionId: a.position?.id || a.positionId,
//       employeeId: a.employee?.id || a.employeeId,
//     }));
//     setApprovers(approverRows);
//   } else {
//     // Reset to default if no approvers
//     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//   }

//   setIsModalVisible(true);
// };
//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       await refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // const handleSave = async (values: any) => {
//   //   setIsSaving(true);
//   //   try {
//   //     const { origin, subOriginId, categoryConfigs } = values;

//   //     if (!origin || !subOriginId) {
//   //       throw new Error("Please select both Origin and Sub-Origin");
//   //     }

//   //     if (!categoryConfigs || categoryConfigs.length === 0) {
//   //       throw new Error("Please add at least one category configuration");
//   //     }

//   //     const approversData = approvers
//   //       .filter(a => a.positionId)
//   //       .map(a => ({
//   //         level: a.level,
//   //         approverType: a.employeeId ? 'specific_employee' : 'position',
//   //         approverId: a.employeeId || a.positionId,
//   //       }));

//   //     if (editingKey) {
//   //       // Update existing configurations
//   //       for (const config of categoryConfigs) {
//   //         if (config.id) {
//   //           try {
//   //             await updateConfig.mutateAsync({
//   //               id: config.id,
//   //               data: {
//   //                 origin,
//   //                 subOrigin: subOriginId,
//   //                 categoryType: config.categoryTypeId,
//   //                 amount: Number(config.amount),
//   //                 period: config.period,
//   //                 status: config.status ? "ACTIVE" : "INACTIVE",
//   //                 approvers: approversData,
//   //               },
//   //             });
//   //           } catch (error) {
//   //             console.error("Error updating config:", error);
//   //             throw error;
//   //           }
//   //         } else {
//   //           try {
//   //             await createConfig.mutateAsync({
//   //               origin,
//   //               subOrigin: subOriginId,
//   //               categoryType: config.categoryTypeId,
//   //               amount: Number(config.amount),
//   //               period: config.period,
//   //               status: config.status ? "ACTIVE" : "INACTIVE",
//   //               approvers: approversData,
//   //             });
//   //           } catch (error) {
//   //             console.error("Error creating config:", error);
//   //             throw error;
//   //           }
//   //         }
//   //       }
//   //     } else {
//   //       // Create new configurations
//   //       for (const config of categoryConfigs) {
//   //         try {
//   //           await createConfig.mutateAsync({
//   //             origin,
//   //             subOrigin: subOriginId,
//   //             categoryType: config.categoryTypeId,
//   //             amount: Number(config.amount),
//   //             period: config.period,
//   //             status: config.status ? "ACTIVE" : "INACTIVE",
//   //             approvers: approversData,
//   //           });
//   //         } catch (error) {
//   //           console.error("Error creating config:", error);
//   //           throw error;
//   //         }
//   //       }
//   //     }

//   //     api.success({
//   //       message: "Configuration saved successfully",
//   //       description: `Saved ${categoryConfigs.length} category configuration(s) for ${origin}`,
//   //       placement: "topRight",
//   //     });

//   //     setIsModalVisible(false);
//   //     form.resetFields();
//   //     setEditingKey(null);
//   //     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
      
//   //     // Wait for refetch to complete
//   //     await refetch();
      
//   //   } catch (error: any) {
//   //     console.error("Save error:", error);
//   //     api.error({
//   //       message: error.message || "Failed to save configuration",
//   //       description: error.response?.data?.message || "Please try again",
//   //       placement: "topRight",
//   //     });
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };
//   // In your component, update the handleSave function:

// const handleSave = async (values: any) => {
//   setIsSaving(true);
//   try {
//     const { origin, subOriginId, categoryConfigs } = values;

//     if (!origin || !subOriginId) {
//       throw new Error("Please select both Origin and Sub-Origin");
//     }

//     if (!categoryConfigs || categoryConfigs.length === 0) {
//       throw new Error("Please add at least one category configuration");
//     }

//     const approversData = approvers
//       .filter(a => a.positionId)
//       .map(a => ({
//         level: a.level,
//         approverType: a.employeeId ? 'specific_employee' : 'position',
//         approverId: a.employeeId || a.positionId,
//       }));

//     console.log('Saving data:', {
//       origin,
//       subOrigin: subOriginId,
//       categoryConfigs,
//       approversData
//     });

//     let successCount = 0;
//     let errorCount = 0;

//     if (editingKey) {
//       // Update existing configurations
//       for (const config of categoryConfigs) {
//         try {
//           if (config.id) {
//             await updateConfig.mutateAsync({
//               id: config.id,
//               data: {
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryTypeId,
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               },
//             });
//             successCount++;
//           } else {
//             // Create new config if no ID
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryTypeId,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
//             });
//             successCount++;
//           }
//         } catch (error) {
//           console.error(`Error processing config ${config.categoryTypeId}:`, error);
//           errorCount++;
//         }
//       }
//     } else {
//       // Create new configurations
//       for (const config of categoryConfigs) {
//         try {
//           await createConfig.mutateAsync({
//             origin,
//             subOrigin: subOriginId,
//             categoryType: config.categoryTypeId,
//             amount: Number(config.amount),
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//             approvers: approversData,
//           });
//           successCount++;
//         } catch (error) {
//           console.error(`Error creating config ${config.categoryTypeId}:`, error);
//           errorCount++;
//         }
//       }
//     }

//     if (errorCount > 0) {
//       api.warning({
//         message: "Partial success",
//         description: `${successCount} configuration(s) saved successfully, ${errorCount} failed`,
//         placement: "topRight",
//       });
//     } else {
//       api.success({
//         message: "Configuration saved successfully",
//         description: `Saved ${successCount} category configuration(s) for ${origin}`,
//         placement: "topRight",
//       });
//     }

//     setIsModalVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
    
//     // Wait for refetch to complete
//     await refetch();
    
//   } catch (error: any) {
//     console.error("Save error:", error);
//     api.error({
//       message: error.message || "Failed to save configuration",
//       description: error.response?.data?.message || "Please try again",
//       placement: "topRight",
//     });
//   } finally {
//     setIsSaving(false);
//   }
// };

//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         (item.categoryTypeName || item.categoryTypeId)?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   // Manual refresh function
//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       api.success({
//         message: "Data refreshed successfully",
//         placement: "topRight",
//       });
//     } catch (error) {
//       api.error({
//         message: "Failed to refresh data",
//         placement: "topRight",
//       });
//     }
//   };

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center">
//               <WalletOutlined style={{ fontSize: "24px", color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
          
//           </div>

//           <Space size={12}>
//             <Tooltip title="Refresh data">
//               <Button 
//                 icon={<ReloadOutlined />} 
//                 onClick={handleRefresh}
//                 loading={isLoading}
//               />
//             </Tooltip>
//             <Input.Search
//               placeholder="Search configurations..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//                 setIsModalVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 16 }}>
//           <Space size={12}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Modal
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             if (isSaving) return;
//             setIsModalVisible(false);
//             form.resetFields();
//             setEditingKey(null);
//             setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//           }}
//           onOk={() => form.submit()}
//           destroyOnClose
//           confirmLoading={isSaving}
//           cancelButtonProps={{ disabled: isSaving }}
//           width={1000}
//           okText={editingKey ? "Update" : "Create"}
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Card style={{ marginBottom: 16, background: '#f5f5f5' }}>
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
//                         form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
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
              
//               {originType && subOriginId && (
//                 <div style={{ 
//                   marginTop: 8, 
//                   padding: 8, 
//                   background: '#e6f7ff', 
//                   borderRadius: 4,
//                   border: '1px solid #91d5ff'
//                 }}>
//                   <Text strong>Selected: </Text>
//                   <Tag color="blue">{originType}</Tag>
//                   <Tag color="green">
//                     {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
//                   </Tag>
//                 </div>
//               )}
//             </Card>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   approvers={approvers}
//                   onApproversChange={setApprovers}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Modal>
//       </div>
//     </ProtectedRoute>
//   );
// }











// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
// import ProtectedRoute from "@/components/common/ProtectedRoute";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Drawer,
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
//   Divider,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryTypeId: string;
//   categoryTypeName?: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

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

// // Approval Levels Component
// const ApprovalLevelsContent = ({
//   value = [],
//   onChange,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});
  
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 16 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Space>
//           <UserOutlined style={{ color: '#1677ff' }} />
//           <Title level={5} style={{ margin: 0 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing">{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 12, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff'
//           }}
//         >
//           <Row gutter={16} align="middle">
//             <Col span={3}>
//               <Form.Item label="Level" required style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Level"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={8}>
//               <Form.Item label="Position" required style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={8}>
//               <Form.Item label="Employee (Optional)" style={{ marginBottom: 0 }}>
//                 <Select
//                   placeholder="Select employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={5} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove approver level">
//                 <Button 
//                   danger 
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                   size="small"
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 8 }}
//       >
//         Add Approval Level
//       </Button>
//     </div>
//   );
// };

// // Category Config List Component
// const CategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   approvers,
//   onApproversChange,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   approvers: ApproverRow[];
//   onApproversChange: (value: ApproverRow[]) => void;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
//   const prevFieldsLength = useRef(fields.length);

//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length]);

//   const getSelectedCategoryTypeIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryTypeId)
//       .filter(Boolean);
//   };

//   const getCategoryNameById = (id: string) => {
//     const category = categoryOptions.find(opt => opt.id === id);
//     return category?.name || 'Unknown';
//   };

//   return (
//     <Card 
//       style={{ 
//         marginBottom: 16,
//         border: '1px solid #f0f0f0',
//         borderRadius: 8
//       }}
//     >
//       <Title level={5}>Category Configurations</Title>
      
//       <Collapse
//         accordion
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }) => {
//           const selectedCategoryTypeIds = getSelectedCategoryTypeIds(name);
//           const currentCategoryTypeId = categoryConfigs?.[name]?.categoryTypeId;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryTypeIds.includes(option.id)
//           );

//           return {
//             key: key,
//             label: (
//               <Space>
//                 <Tag color="blue">
//                   {currentCategoryTypeId 
//                     ? getCategoryNameById(currentCategoryTypeId) 
//                     : 'New Category'}
//                 </Tag>
//               </Space>
//             ),
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
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryTypeId"]}
//                       label="Category Type"
//                       rules={[{ required: true, message: "Please select category type" }]}
//                     >
//                       <Select
//                         placeholder="Select Category Type"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.id} label={opt.name}>
//                             {opt.name} ({opt.code})
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

//                 <Row gutter={16}>
//                   <Col span={8}>
//                     <div style={{ ...switchRowCard, marginTop: 0 }}>
//                       <div>
//                         <div style={switchTitle}>Status</div>
//                         <div style={switchDesc}>Category type is active</div>
//                       </div>
//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "linear-gradient(135deg, #f6f9fc 0%, #e6f7ff 100%)",
//                       marginTop: 12,
//                       border: "1px solid #91d5ff",
//                       borderRadius: 8,
//                     }}
//                   >
//                     <Row gutter={16}>
//                       <Col span={12}>
//                         <Space direction="vertical" size={2}>
//                           <Text type="secondary">Monthly Amount</Text>
//                           <div>
//                             <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
//                               ₹{previewAmounts.monthly.toFixed(2)}
//                             </Text>
//                           </div>
//                         </Space>
//                       </Col>
//                       <Col span={12}>
//                         <Space direction="vertical" size={2}>
//                           <Text type="secondary">Yearly Amount</Text>
//                           <div>
//                             <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
//                               ₹{previewAmounts.yearly.toFixed(2)}
//                             </Text>
//                           </div>
//                         </Space>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}
//               </>
//             ),
//           };
//         })}
//       />

//       <Button type="dashed" block onClick={() => add()} style={{ marginTop: 12 }}>
//         + Add Another Category
//       </Button>

//       <Divider style={{ margin: '24px 0 16px 0' }} />

//       <ApprovalLevelsContent 
//         value={approvers}
//         onChange={onApproversChange}
//       />
//     </Card>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const subOriginId = Form.useWatch("subOriginId", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isDrawerVisible, setIsDrawerVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
//   const [approvers, setApprovers] = useState<ApproverRow[]>([
//     { level: 1, positionId: '', employeeId: null },
//   ]);

//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
        
//         const map: Record<string, string> = {};
//         options.forEach(opt => {
//           map[opt.id] = opt.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

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

//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") return membersMap[subOriginId] || subOriginId;
//     if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
//     if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
//     if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
//     if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
//     return subOriginId;
//   };

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];
//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;
//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryTypeId: config.categoryType,
//         categoryTypeName: categoryMap[config.categoryType] || config.categoryType,
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel, categoryMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];
//     switch (originType) {
//       case "User": return members.map((m) => ({ label: m.name, value: m.id }));
//       case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
//       case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
//       case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
//       case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
//       default: return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade": return gradesLoading;
//       case "Department": return departmentsLoading;
//       case "Sub-department": return subDepartmentsLoading;
//       case "Position": return positionsLoading;
//       default: return false;
//     }
//   };
//   const capitalizeFirstLetter = (str: string) => {
//   if (!str) return str;
//   return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// };

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
//   title: "Category Type",
//   key: "categoryType",
//   align: "center",
//   render: (_: any, record: ReimbursementRecord) => {
//     const categoryName = record.categoryTypeName || record.categoryTypeId;
//     return <Tag color="blue">{capitalizeFirstLetter(categoryName)}</Tag>;
//   },
// },
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
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleEdit = (record: ReimbursementRecord) => {
//     setEditingKey(record.id);
    
//     const selectedConfig = dataSource.find(item => item.id === record.id);
    
//     if (!selectedConfig) return;

//     const configsForForm = [{
//       id: selectedConfig.id,
//       policyId: selectedConfig.policyId,
//       ruleId: selectedConfig.ruleId,
//       categoryTypeId: selectedConfig.categoryTypeId,
//       amount: selectedConfig.amount,
//       period: selectedConfig.period,
//       status: selectedConfig.status === "ACTIVE",
//     }];

//     form.setFieldsValue({
//       origin: selectedConfig.origin,
//       subOriginId: selectedConfig.subOriginId,
//       categoryConfigs: configsForForm,
//     });

//     if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//       const approverRows = selectedConfig.approvers.map((a: any) => ({
//         level: a.level,
//         positionId: a.position?.id || a.positionId,
//         employeeId: a.employee?.id || a.employeeId,
//       }));
//       setApprovers(approverRows);
//     } else {
//       setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//     }

//     setIsDrawerVisible(true);
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       await refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleSave = async (values: any) => {
//     setIsSaving(true);
//     try {
//       const { origin, subOriginId, categoryConfigs } = values;

//       if (!origin || !subOriginId) {
//         throw new Error("Please select both Origin and Sub-Origin");
//       }

//       if (!categoryConfigs || categoryConfigs.length === 0) {
//         throw new Error("Please add at least one category configuration");
//       }

//       const approversData = approvers
//         .filter(a => a.positionId)
//         .map(a => ({
//           level: a.level,
//           approverType: a.employeeId ? 'specific_employee' : 'position',
//           approverId: a.employeeId || a.positionId,
//         }));

//       let successCount = 0;
//       let errorCount = 0;

//       if (editingKey) {
//         for (const config of categoryConfigs) {
//           try {
//             if (config.id) {
//               await updateConfig.mutateAsync({
//                 id: config.id,
//                 data: {
//                   origin,
//                   subOrigin: subOriginId,
//                   categoryType: config.categoryTypeId,
//                   amount: Number(config.amount),
//                   period: config.period,
//                   status: config.status ? "ACTIVE" : "INACTIVE",
//                   approvers: approversData,
//                 },
//               });
//               successCount++;
//             } else {
//               await createConfig.mutateAsync({
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryTypeId,
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               });
//               successCount++;
//             }
//           } catch (error) {
//             console.error(`Error processing config ${config.categoryTypeId}:`, error);
//             errorCount++;
//           }
//         }
//       } else {
//         for (const config of categoryConfigs) {
//           try {
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryTypeId,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
//             });
//             successCount++;
//           } catch (error) {
//             console.error(`Error creating config ${config.categoryTypeId}:`, error);
//             errorCount++;
//           }
//         }
//       }

//       if (errorCount > 0) {
//         api.warning({
//           message: "Partial success",
//           description: `${successCount} configuration(s) saved successfully, ${errorCount} failed`,
//           placement: "topRight",
//         });
//       } else {
//         api.success({
//           message: "Configuration saved successfully",
//           description: `Saved ${successCount} category configuration(s) for ${origin}`,
//           placement: "topRight",
//         });
//       }

//       setIsDrawerVisible(false);
//       form.resetFields();
//       setEditingKey(null);
//       setApprovers([{ level: 1, positionId: '', employeeId: null }]);
      
//       await refetch();
      
//     } catch (error: any) {
//       console.error("Save error:", error);
//       api.error({
//         message: error.message || "Failed to save configuration",
//         description: error.response?.data?.message || "Please try again",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         (item.categoryTypeName || item.categoryTypeId)?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       api.success({
//         message: "Data refreshed successfully",
//         placement: "topRight",
//       });
//     } catch (error) {
//       api.error({
//         message: "Failed to refresh data",
//         placement: "topRight",
//       });
//     }
//   };

//   const handleCloseDrawer = () => {
//     if (isSaving) return;
//     setIsDrawerVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//   };

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center">
//               <WalletOutlined style={{ fontSize: "24px", color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//           </div>

//           <Space size={12}>
//             <Tooltip title="Refresh data">
//               <Button 
//                 icon={<ReloadOutlined />} 
//                 onClick={handleRefresh}
//                 loading={isLoading}
//               />
//             </Tooltip>
//             <Input.Search
//               placeholder="Search configurations..."
//               allowClear
//               style={{ width: 300 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//                 setIsDrawerVisible(true);
//               }}
//             >
//               Add Configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 16 }}>
//           <Space size={12}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="middle"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} items`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Drawer
//           title={
//             <Space>
//               <WalletOutlined />
//               {editingKey
//                 ? "Edit Reimbursement Configuration"
//                 : "Add Reimbursement Configuration"}
//             </Space>
//           }
//           placement="right"
//           width={1000}
//           onClose={handleCloseDrawer}
//           open={isDrawerVisible}
//           destroyOnClose
//           extra={
//             <Space>
//               <Button onClick={handleCloseDrawer} icon={<CloseOutlined />} disabled={isSaving}>
//                 Cancel
//               </Button>
//               <Button 
//                 type="primary" 
//                 onClick={() => form.submit()} 
//                 loading={isSaving}
//               >
//                 {editingKey ? "Update" : "Create"}
//               </Button>
//             </Space>
//           }
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Card style={{ marginBottom: 16, background: '#f5f5f5' }}>
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
//                         form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
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
              
//               {originType && subOriginId && (
//                 <div style={{ 
//                   marginTop: 8, 
//                   padding: 8, 
//                   background: '#e6f7ff', 
//                   borderRadius: 4,
//                   border: '1px solid #91d5ff'
//                 }}>
//                   <Text strong>Selected: </Text>
//                   <Tag color="blue">{originType}</Tag>
//                   <Tag color="green">
//                     {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
//                   </Tag>
//                 </div>
//               )}
//             </Card>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   approvers={approvers}
//                   onApproversChange={setApprovers}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Drawer>
//       </div>
//     </ProtectedRoute>
//   );
// }
























// "use client";

// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useAuth } from "@/context/AuthContext";
// import ProtectedRoute from "@/components/common/ProtectedRoute";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Drawer,
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
//   Divider,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryTypeId: string;
//   categoryTypeName?: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

// // Compact styles
// const compactSwitchCard = {
//   display: "flex",
//   justifyContent: "space-between",
//   alignItems: "center",
//   padding: "6px 8px",
//   border: "1px solid #f0f0f0",
//   borderRadius: 6,
//   marginBottom: 8,
//   background: "#fafafa",
// };

// const switchTitle = {
//   fontSize: 13,
//   fontWeight: 500,
// };

// const switchDesc = {
//   fontSize: 11,
//   color: "#8c8c8c",
//   marginTop: 1,
// };

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

// // Compact Approval Levels Component
// const CompactApprovalLevelsContent = ({
//   value = [],
//   onChange,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});
  
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 12 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//         <Space size={4}>
//           <UserOutlined style={{ color: '#1677ff', fontSize: 14 }} />
//           <Title level={5} style={{ margin: 0, fontSize: 14 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing" style={{ fontSize: 11 }}>{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 8, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff',
//             fontSize: 12
//           }}
//           bodyStyle={{ padding: '8px' }}
//         >
//           <Row gutter={8} align="middle">
//             <Col span={3}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   size="small"
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Lvl"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={3} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove">
//                 <Button 
//                   danger 
//                   size="small"
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 4, fontSize: 12 }}
//       >
//         Add Level
//       </Button>
//     </div>
//   );
// };

// // Compact Category Config List Component
// const CompactCategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   approvers,
//   onApproversChange,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   approvers: ApproverRow[];
//   onApproversChange: (value: ApproverRow[]) => void;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
//   const prevFieldsLength = useRef(fields.length);

//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length]);

//   const getSelectedCategoryTypeIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryTypeId)
//       .filter(Boolean);
//   };

//   const getCategoryNameById = (id: string) => {
//     const category = categoryOptions.find(opt => opt.id === id);
//     return category?.name || 'Unknown';
//   };

//   return (
//     <Card 
//       size="small"
//       style={{ 
//         marginBottom: 12,
//         border: '1px solid #f0f0f0',
//         borderRadius: 6
//       }}
//       bodyStyle={{ padding: '12px' }}
//     >
//       <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14 }}>Category Configurations</Title>
      
//       <Collapse
//         accordion
//         size="small"
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }) => {
//           const selectedCategoryTypeIds = getSelectedCategoryTypeIds(name);
//           const currentCategoryTypeId = categoryConfigs?.[name]?.categoryTypeId;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryTypeIds.includes(option.id)
//           );

//           return {
//             key: key,
//             label: (
//               <Space size={4}>
//                 <Tag color="blue" style={{ fontSize: 11 }}>
//                   {currentCategoryTypeId 
//                     ? getCategoryNameById(currentCategoryTypeId) 
//                     : 'New Category'}
//                 </Tag>
//               </Space>
//             ),
//             extra:
//               fields.length > 1 ? (
//                 <Popconfirm
//                   title="Delete?"
//                   onConfirm={() => remove(name)}
//                   onCancel={(e) => e?.stopPropagation()}
//                 >
//                   <DeleteOutlined
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ color: "red", fontSize: 12 }}
//                   />
//                 </Popconfirm>
//               ) : null,
//             children: (
//               <div style={{ padding: '4px 0' }}>
//                 <Form.Item name={[name, "id"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryTypeId"]}
//                       label={<span style={{ fontSize: 12 }}>Category Type</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select
//                         size="small"
//                         placeholder="Select"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.id} label={opt.name}>
//                             {opt.name}
//                           </Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label={<span style={{ fontSize: 12 }}>Amount</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <InputNumber
//                         size="small"
//                         min={0}
//                         precision={2}
//                         style={{ width: "100%" }}
//                         placeholder="Amount"
//                         prefix="₹"
//                       />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "period"]}
//                       label={<span style={{ fontSize: 12 }}>Period</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select size="small" placeholder="Period">
//                         <Option value="MONTH">Month</Option>
//                         <Option value="YEAR">Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <div style={{ ...compactSwitchCard, marginTop: 0 }}>
//                       <div>
//                         <div style={switchTitle}>Active</div>
//                         <div style={switchDesc}>Enable this category</div>
//                       </div>
//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch size="small" />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f6f9fc",
//                       marginTop: 8,
//                       border: "1px solid #91d5ff",
//                       borderRadius: 4,
//                     }}
//                     bodyStyle={{ padding: '6px' }}
//                   >
//                     <Row gutter={8}>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Monthly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                             ₹{previewAmounts.monthly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Yearly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
//                             ₹{previewAmounts.yearly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}
//               </div>
//             ),
//           };
//         })}
//       />

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={() => add()} 
//         style={{ marginTop: 8, fontSize: 12 }}
//         icon={<PlusOutlined />}
//       >
//         Add Category
//       </Button>

//       <Divider style={{ margin: '12px 0 8px 0' }} />

//       <CompactApprovalLevelsContent 
//         value={approvers}
//         onChange={onApproversChange}
//       />
//     </Card>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const subOriginId = Form.useWatch("subOriginId", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isDrawerVisible, setIsDrawerVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
//   const [approvers, setApprovers] = useState<ApproverRow[]>([
//     { level: 1, positionId: '', employeeId: null },
//   ]);

//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
        
//         const map: Record<string, string> = {};
//         options.forEach(opt => {
//           map[opt.id] = opt.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

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

//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") return membersMap[subOriginId] || subOriginId;
//     if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
//     if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
//     if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
//     if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
//     return subOriginId;
//   };

//   // const dataSource: ReimbursementRecord[] = useMemo(() => {
//   //   if (!configs) return [];
//   //   return configs.map((config) => {
//   //     const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//   //     const amount = Number(config.amount) || 0;
//   //     return {
//   //       key: config.id,
//   //       id: config.id,
//   //       origin: config.origin,
//   //       subOrigin: subOriginLabel,
//   //       subOriginId: config.subOrigin,
//   //       categoryTypeId: config.categoryType,
//   //       categoryTypeName: categoryMap[config.categoryType] || config.categoryType,
//   //       amount: amount,
//   //       period: config.period,
//   //       status: config.status,
//   //       monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//   //       yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//   //       policyId: config.policyId,
//   //       ruleId: config.ruleId,
//   //       approvers: config.approvers,
//   //     };
//   //   });
//   // }, [configs, getSubOriginLabel, categoryMap]);
// const dataSource: ReimbursementRecord[] = useMemo(() => {
//   if (!configs) return [];
//   return configs.map((config) => {
//     const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//     const amount = Number(config.amount) || 0;
    
//     // Log to see config structure
//     console.log('Config from API:', config);
    
//     return {
//       key: config.id,
//       id: config.id,
//       origin: config.origin,
//       subOrigin: subOriginLabel,
//       subOriginId: config.subOrigin,
//       categoryTypeId: config.categoryType,
//       categoryTypeName: categoryMap[config.categoryType] || config.categoryType,
//       amount: amount,
//       period: config.period,
//       status: config.status,
//       monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//       yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//       policyId: config.policyId,
//       ruleId: config.ruleId,
//       approvers: config.approvers, // Make sure this is being passed correctly
//     };
//   });
// }, [configs, getSubOriginLabel, categoryMap]);
//   const getSubOriginOptions = () => {
//     if (!originType) return [];
//     switch (originType) {
//       case "User": return members.map((m) => ({ label: m.name, value: m.id }));
//       case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
//       case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
//       case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
//       case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
//       default: return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade": return gradesLoading;
//       case "Department": return departmentsLoading;
//       case "Sub-department": return subDepartmentsLoading;
//       case "Position": return positionsLoading;
//       default: return false;
//     }
//   };

//   const capitalizeFirstLetter = (str: string) => {
//     if (!str) return str;
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   };

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
//       key: "categoryType",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const categoryName = record.categoryTypeName || record.categoryTypeId;
//         return <Tag color="blue">{capitalizeFirstLetter(categoryName)}</Tag>;
//       },
//     },
//     {
//       title: "Period",
//       dataIndex: "period",
//       key: "period",
//       align: "center",
//       render: (period: string) => (
//         <Tag color={period === "MONTH" ? "green" : "orange"}>
//           {period === "MONTH" ? "Month" : "Year"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Monthly",
//       key: "monthlyAmount",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const amounts = calculateAmounts(record.amount, record.period);
//         return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
//       },
//     },
//     {
//       title: "Yearly",
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
//         <Space size={4}>
//           <Tooltip title="Edit">
//             <Button
//               type="text"
//               size="small"
//               icon={<EditOutlined />}
//               onClick={() => handleEdit(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Delete this configuration?"
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 size="small"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   // const handleEdit = (record: ReimbursementRecord) => {
//   //   setEditingKey(record.id);
    
//   //   const selectedConfig = dataSource.find(item => item.id === record.id);
    
//   //   if (!selectedConfig) return;

//   //   const configsForForm = [{
//   //     id: selectedConfig.id,
//   //     policyId: selectedConfig.policyId,
//   //     ruleId: selectedConfig.ruleId,
//   //     categoryTypeId: selectedConfig.categoryTypeId,
//   //     amount: selectedConfig.amount,
//   //     period: selectedConfig.period,
//   //     status: selectedConfig.status === "ACTIVE",
//   //   }];

//   //   form.setFieldsValue({
//   //     origin: selectedConfig.origin,
//   //     subOriginId: selectedConfig.subOriginId,
//   //     categoryConfigs: configsForForm,
//   //   });

//   //   if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//   //     const approverRows = selectedConfig.approvers.map((a: any) => ({
//   //       level: a.level,
//   //       positionId: a.position?.id || a.positionId,
//   //       employeeId: a.employee?.id || a.employeeId,
//   //     }));
//   //     setApprovers(approverRows);
//   //   } else {
//   //     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//   //   }

//   //   setIsDrawerVisible(true);
//   // };
// const handleEdit = (record: ReimbursementRecord) => {
//   setEditingKey(record.id);
  
//   const selectedConfig = dataSource.find(item => item.id === record.id);
  
//   if (!selectedConfig) return;

//   // Set form values for the selected config
//   const configsForForm = [{
//     id: selectedConfig.id,
//     policyId: selectedConfig.policyId,
//     ruleId: selectedConfig.ruleId,
//     categoryTypeId: selectedConfig.categoryTypeId,
//     amount: selectedConfig.amount,
//     period: selectedConfig.period,
//     status: selectedConfig.status === "ACTIVE",
//   }];

//   form.setFieldsValue({
//     origin: selectedConfig.origin,
//     subOriginId: selectedConfig.subOriginId,
//     categoryConfigs: configsForForm,
//   });

//   // Log to see what approvers data we have
//   console.log('Selected config approvers:', selectedConfig.approvers);

//   // Handle different possible data structures
//   if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//     const approverRows = selectedConfig.approvers.map((a: any) => {
//       // Try different possible paths to get positionId
//       let positionId = '';
//       if (a.positionId) positionId = a.positionId;
//       else if (a.position?.id) positionId = a.position.id;
//       else if (a.approverId && a.approverType === 'position') positionId = a.approverId;
      
//       // Try different possible paths to get employeeId
//       let employeeId = null;
//       if (a.employeeId) employeeId = a.employeeId;
//       else if (a.employee?.id) employeeId = a.employee.id;
//       else if (a.approverId && a.approverType === 'specific_employee') employeeId = a.approverId;
      
//       return {
//         level: a.level || 1,
//         positionId: positionId,
//         employeeId: employeeId,
//       };
//     });
    
//     console.log('Mapped approver rows:', approverRows);
//     setApprovers(approverRows);
//   } else {
//     console.log('No approvers found, setting default');
//     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//   }

//   setIsDrawerVisible(true);
// };
//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       await refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleSave = async (values: any) => {
//     setIsSaving(true);
//     try {
//       const { origin, subOriginId, categoryConfigs } = values;

//       if (!origin || !subOriginId) {
//         throw new Error("Please select both Origin and Sub-Origin");
//       }

//       if (!categoryConfigs || categoryConfigs.length === 0) {
//         throw new Error("Please add at least one category configuration");
//       }

//       const approversData = approvers
//         .filter(a => a.positionId)
//         .map(a => ({
//           level: a.level,
//           approverType: a.employeeId ? 'specific_employee' : 'position',
//           approverId: a.employeeId || a.positionId,
//         }));

//       let successCount = 0;
//       let errorCount = 0;

//       if (editingKey) {
//         for (const config of categoryConfigs) {
//           try {
//             if (config.id) {
//               await updateConfig.mutateAsync({
//                 id: config.id,
//                 data: {
//                   origin,
//                   subOrigin: subOriginId,
//                   categoryType: config.categoryTypeId,
//                   amount: Number(config.amount),
//                   period: config.period,
//                   status: config.status ? "ACTIVE" : "INACTIVE",
//                   approvers: approversData,
//                 },
//               });
//               successCount++;
//             } else {
//               await createConfig.mutateAsync({
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryTypeId,
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               });
//               successCount++;
//             }
//           } catch (error) {
//             console.error(`Error processing config ${config.categoryTypeId}:`, error);
//             errorCount++;
//           }
//         }
//       } else {
//         for (const config of categoryConfigs) {
//           try {
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryTypeId,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
//             });
//             successCount++;
//           } catch (error) {
//             console.error(`Error creating config ${config.categoryTypeId}:`, error);
//             errorCount++;
//           }
//         }
//       }

//       if (errorCount > 0) {
//         api.warning({
//           message: "Partial success",
//           description: `${successCount} saved, ${errorCount} failed`,
//           placement: "topRight",
//         });
//       } else {
//         api.success({
//           message: "Saved successfully",
//           description: `${successCount} configuration(s) saved`,
//           placement: "topRight",
//         });
//       }

//       setIsDrawerVisible(false);
//       form.resetFields();
//       setEditingKey(null);
//       setApprovers([{ level: 1, positionId: '', employeeId: null }]);
      
//       await refetch();
      
//     } catch (error: any) {
//       console.error("Save error:", error);
//       api.error({
//         message: error.message || "Failed to save",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         (item.categoryTypeName || item.categoryTypeId)?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       api.success({
//         message: "Data refreshed",
//         placement: "topRight",
//       });
//     } catch (error) {
//       api.error({
//         message: "Failed to refresh",
//         placement: "topRight",
//       });
//     }
//   };

//   const handleCloseDrawer = () => {
//     if (isSaving) return;
//     setIsDrawerVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//   };

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center" size={8}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//           </div>

//           <Space size={8}>
//             <Tooltip title="Refresh">
//               <Button 
//                 size="small"
//                 icon={<ReloadOutlined />} 
//                 onClick={handleRefresh}
//                 loading={isLoading}
//               />
//             </Tooltip>
//             <Input.Search
//               placeholder="Search..."
//               allowClear
//               size="small"
//               style={{ width: 200 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               size="small"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setApprovers([{ level: 1, positionId: '', employeeId: null }]);
//                 setIsDrawerVisible(true);
//               }}
//             >
//               Add configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 12 }}>
//           <Space size={8}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="small"
//           pagination={{
//             pageSize: 10,
//             size: "small",
//             showTotal: (total) => `Total ${total}`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Drawer
//           title={
//             <Space size={4}>
//               <WalletOutlined style={{ fontSize: 14 }} />
//               <span style={{ fontSize: 14 }}>
//                 {editingKey ? "Edit Configuration" : "Add Configuration"}
//               </span>
//             </Space>
//           }
//           placement="right"
//           width={500}
//           onClose={handleCloseDrawer}
//           open={isDrawerVisible}
//           destroyOnClose
//           headerStyle={{ padding: '12px 16px' }}
//           bodyStyle={{ padding: '16px' }}
//           extra={
//             <Space size={4}>
//               <Button size="small" onClick={handleCloseDrawer} icon={<CloseOutlined />} disabled={isSaving}>
//                 Cancel
//               </Button>
//               <Button 
//                 size="small"
//                 type="primary" 
//                 onClick={() => form.submit()} 
//                 loading={isSaving}
//               >
//                 {editingKey ? "Update" : "Create"}
//               </Button>
//             </Space>
//           }
//         >
//           <Form 
//             form={form} 
//             layout="vertical" 
//             onFinish={handleSave}
//             size="small"
//           >
//             <Card 
//               size="small"
//               style={{ marginBottom: 12, background: '#f5f5f5' }}
//               bodyStyle={{ padding: '12px' }}
//             >
//               <Row gutter={8}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="origin"
//                     label={<span style={{ fontSize: 12 }}>Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!!editingKey}
//                       onChange={() => {
//                         form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
//                       }}
//                     >
//                       <Option value="Grade">Grade</Option>
//                       <Option value="Department">Department</Option>
//                       <Option value="Sub-department">Sub-dept</Option>
//                       <Option value="Position">Position</Option>
//                       <Option value="User">User</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     name="subOriginId"
//                     label={<span style={{ fontSize: 12 }}>Sub-Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!originType || !!editingKey}
//                       loading={getSubOriginLoading()}
//                       showSearch
//                       filterOption={filterOption}
//                       options={getSubOriginOptions()}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>
              
//               {originType && subOriginId && (
//                 <div style={{ 
//                   marginTop: 4, 
//                   padding: 4, 
//                   background: '#e6f7ff', 
//                   borderRadius: 4,
//                   border: '1px solid #91d5ff',
//                   fontSize: 12
//                 }}>
//                   <Text strong style={{ fontSize: 11 }}>Selected: </Text>
//                   <Tag color="blue" style={{ fontSize: 10 }}>{originType}</Tag>
//                   <Tag color="green" style={{ fontSize: 10 }}>
//                     {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
//                   </Tag>
//                 </div>
//               )}
//             </Card>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CompactCategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   approvers={approvers}
//                   onApproversChange={setApprovers}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Drawer>
//       </div>
//     </ProtectedRoute>
//   );
// }



// "use client";

// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import ProtectedRoute from "@/components/common/ProtectedRoute";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Drawer,
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
//   Divider,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryTypeId: string;
//   categoryTypeName?: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

// // Compact styles
// const compactSwitchCard = {
//   display: "flex",
//   justifyContent: "space-between",
//   alignItems: "center",
//   padding: "6px 8px",
//   border: "1px solid #f0f0f0",
//   borderRadius: 6,
//   marginBottom: 8,
//   background: "#fafafa",
// };

// const switchTitle = {
//   fontSize: 13,
//   fontWeight: 500,
// };

// const switchDesc = {
//   fontSize: 11,
//   color: "#8c8c8c",
//   marginTop: 1,
// };

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

// // Compact Approval Levels Component
// const CompactApprovalLevelsContent = ({
//   value = [],
//   onChange,
//   positions,
//   positionsLoading,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 12 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//         <Space size={4}>
//           <UserOutlined style={{ color: '#1677ff', fontSize: 14 }} />
//           <Title level={5} style={{ margin: 0, fontSize: 14 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing" style={{ fontSize: 11 }}>{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 8, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff',
//             fontSize: 12
//           }}
//           bodyStyle={{ padding: '8px' }}
//         >
//           <Row gutter={8} align="middle">
//             <Col span={3}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   size="small"
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Lvl"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={3} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove">
//                 <Button 
//                   danger 
//                   size="small"
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 4, fontSize: 12 }}
//       >
//         Add Level
//       </Button>
//     </div>
//   );
// };

// // Compact Category Config List Component with per-category approvers
// const CompactCategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   categoryApproversMap,
//   onCategoryApproversChange,
//   positions,
//   positionsLoading,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   categoryApproversMap: Record<number, ApproverRow[]>;
//   onCategoryApproversChange: (index: number, approvers: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
  
//   const prevFieldsLength = useRef(fields.length);

//   // Handle new category addition
//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
      
//       // Initialize approvers for new category
//       const newIndex = fields.length - 1;
//       const defaultApprovers = [{ level: 1, positionId: '', employeeId: null }];
      
//       // Update parent with initial approvers
//       onCategoryApproversChange(newIndex, defaultApprovers);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length, onCategoryApproversChange]);

//   const getSelectedCategoryTypeIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryTypeId)
//       .filter(Boolean);
//   };

//   const getCategoryNameById = (id: string) => {
//     const category = categoryOptions.find(opt => opt.id === id);
//     return category?.name || 'Unknown';
//   };

//   // Get current approvers for a category
//   const getCurrentApprovers = (index: number) => {
//     return categoryApproversMap[index] || [{ level: 1, positionId: '', employeeId: null }];
//   };

//   return (
//     <Card 
//       size="small"
//       style={{ 
//         marginBottom: 12,
//         border: '1px solid #f0f0f0',
//         borderRadius: 6
//       }}
//       bodyStyle={{ padding: '12px' }}
//     >
//       <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14 }}>Category Configurations</Title>
      
//       <Collapse
//         accordion
//         size="small"
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }, index) => {
//           const selectedCategoryTypeIds = getSelectedCategoryTypeIds(name);
//           const currentCategoryTypeId = categoryConfigs?.[name]?.categoryTypeId;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;
//           const currentApprovers = getCurrentApprovers(index);

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryTypeIds.includes(option.id)
//           );

//           return {
//             key: key,
//             label: (
//               <Space size={4}>
//                 <Tag color="blue" style={{ fontSize: 11 }}>
//                   {currentCategoryTypeId 
//                     ? getCategoryNameById(currentCategoryTypeId) 
//                     : 'New Category'}
//                 </Tag>
//                 {currentApprovers.length > 0 && (
//                   <Tag color="purple" style={{ fontSize: 10 }}>
//                     {currentApprovers.length} Approver(s)
//                   </Tag>
//                 )}
//               </Space>
//             ),
//             extra:
//               fields.length > 1 ? (
//                 <Popconfirm
//                   title="Delete?"
//                   onConfirm={() => remove(name)}
//                   onCancel={(e) => e?.stopPropagation()}
//                 >
//                   <DeleteOutlined
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ color: "red", fontSize: 12 }}
//                   />
//                 </Popconfirm>
//               ) : null,
//             children: (
//               <div style={{ padding: '4px 0' }}>
//                 <Form.Item name={[name, "id"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryTypeId"]}
//                       label={<span style={{ fontSize: 12 }}>Category Type</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select
//                         size="small"
//                         placeholder="Select"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.id} label={opt.name}>
//                             {opt.name}
//                           </Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label={<span style={{ fontSize: 12 }}>Amount</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <InputNumber
//                         size="small"
//                         min={0}
//                         precision={2}
//                         style={{ width: "100%" }}
//                         placeholder="Amount"
//                         prefix="₹"
//                       />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "period"]}
//                       label={<span style={{ fontSize: 12 }}>Period</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select size="small" placeholder="Period">
//                         <Option value="MONTH">Month</Option>
//                         <Option value="YEAR">Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <div style={{ ...compactSwitchCard, marginTop: 0 }}>
//                       <div>
//                         <div style={switchTitle}>Active</div>
//                         <div style={switchDesc}>Enable this category</div>
//                       </div>
//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch size="small" />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f6f9fc",
//                       marginTop: 8,
//                       border: "1px solid #91d5ff",
//                       borderRadius: 4,
//                     }}
//                     bodyStyle={{ padding: '6px' }}
//                   >
//                     <Row gutter={8}>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Monthly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                             ₹{previewAmounts.monthly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Yearly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
//                             ₹{previewAmounts.yearly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}

//                 <Divider style={{ margin: '12px 0 8px 0' }} />

//                 <CompactApprovalLevelsContent 
//                   value={currentApprovers}
//                   onChange={(newApprovers) => onCategoryApproversChange(index, newApprovers)}
//                   positions={positions}
//                   positionsLoading={positionsLoading}
//                 />
//               </div>
//             ),
//           };
//         })}
//       />

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={() => add()} 
//         style={{ marginTop: 8, fontSize: 12 }}
//         icon={<PlusOutlined />}
//       >
//         Add Category
//       </Button>
//     </Card>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const subOriginId = Form.useWatch("subOriginId", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isDrawerVisible, setIsDrawerVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  
//   // Store approvers per category index
//   const [categoryApproversMap, setCategoryApproversMap] = useState<Record<number, ApproverRow[]>>({});

//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
        
//         const map: Record<string, string> = {};
//         options.forEach(opt => {
//           map[opt.id] = opt.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

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

//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") return membersMap[subOriginId] || subOriginId;
//     if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
//     if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
//     if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
//     if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
//     return subOriginId;
//   };

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];
//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;
      
//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryTypeId: config.categoryType,
//         categoryTypeName: categoryMap[config.categoryType] || config.categoryType,
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel, categoryMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];
//     switch (originType) {
//       case "User": return members.map((m) => ({ label: m.name, value: m.id }));
//       case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
//       case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
//       case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
//       case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
//       default: return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade": return gradesLoading;
//       case "Department": return departmentsLoading;
//       case "Sub-department": return subDepartmentsLoading;
//       case "Position": return positionsLoading;
//       default: return false;
//     }
//   };

//   const capitalizeFirstLetter = (str: string) => {
//     if (!str) return str;
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   };

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
//       key: "categoryType",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const categoryName = record.categoryTypeName || record.categoryTypeId;
//         return <Tag color="blue">{capitalizeFirstLetter(categoryName)}</Tag>;
//       },
//     },
//     {
//       title: "Period",
//       dataIndex: "period",
//       key: "period",
//       align: "center",
//       render: (period: string) => (
//         <Tag color={period === "MONTH" ? "green" : "orange"}>
//           {period === "MONTH" ? "Month" : "Year"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Monthly",
//       key: "monthlyAmount",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const amounts = calculateAmounts(record.amount, record.period);
//         return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
//       },
//     },
//     {
//       title: "Yearly",
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
//         <Space size={4}>
//           <Tooltip title="Edit">
//             <Button
//               type="text"
//               size="small"
//               icon={<EditOutlined />}
//               onClick={() => handleEdit(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Delete this configuration?"
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 size="small"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleCategoryApproversChange = useCallback((index: number, approvers: ApproverRow[]) => {
//     setCategoryApproversMap(prev => ({
//       ...prev,
//       [index]: approvers
//     }));
//   }, []);

//   const handleEdit = (record: ReimbursementRecord) => {
//     setEditingKey(record.id);
    
//     const selectedConfig = dataSource.find(item => item.id === record.id);
    
//     if (!selectedConfig) return;

//     // Prepare form values for the selected config
//     const configsForForm = [{
//       id: selectedConfig.id,
//       policyId: selectedConfig.policyId,
//       ruleId: selectedConfig.ruleId,
//       categoryTypeId: selectedConfig.categoryTypeId,
//       amount: selectedConfig.amount,
//       period: selectedConfig.period,
//       status: selectedConfig.status === "ACTIVE",
//     }];

//     form.setFieldsValue({
//       origin: selectedConfig.origin,
//       subOriginId: selectedConfig.subOriginId,
//       categoryConfigs: configsForForm,
//     });

//     // Store approvers for this category
//     if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//       const mappedApprovers = selectedConfig.approvers.map((a: any) => ({
//         level: a.level,
//         positionId: a.approverType === 'position' ? a.approverId : '',
//         employeeId: a.approverType === 'specific_employee' ? a.approverId : null,
//       }));
      
//       setCategoryApproversMap({ 0: mappedApprovers });
//     } else {
//       setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//     }

//     setIsDrawerVisible(true);
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       await refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // const handleSave = async (values: any) => {
//   //   setIsSaving(true);
//   //   try {
//   //     const { origin, subOriginId, categoryConfigs } = values;

//   //     if (!origin || !subOriginId) {
//   //       throw new Error("Please select both Origin and Sub-Origin");
//   //     }

//   //     if (!categoryConfigs || categoryConfigs.length === 0) {
//   //       throw new Error("Please add at least one category configuration");
//   //     }

//   //     let successCount = 0;
//   //     let errorCount = 0;

//   //     if (editingKey) {
//   //       // Update existing configurations
//   //       for (let i = 0; i < categoryConfigs.length; i++) {
//   //         const config = categoryConfigs[i];
//   //         const categoryApprovers = categoryApproversMap[i] || [];
          
//   //         const approversData = categoryApprovers
//   //           .filter(a => a.positionId)
//   //           .map(a => ({
//   //             level: a.level,
//   //             approverType: a.employeeId ? 'specific_employee' : 'position',
//   //             approverId: a.employeeId || a.positionId,
//   //           }));

//   //         try {
//   //           if (config.id) {
//   //             await updateConfig.mutateAsync({
//   //               id: config.id,
//   //               data: {
//   //                 origin,
//   //                 subOrigin: subOriginId,
//   //                 categoryType: config.categoryTypeId,
//   //                 amount: Number(config.amount),
//   //                 period: config.period,
//   //                 status: config.status ? "ACTIVE" : "INACTIVE",
//   //                 approvers: approversData,
//   //               },
//   //             });
//   //             successCount++;
//   //           } else {
//   //             await createConfig.mutateAsync({
//   //               origin,
//   //               subOrigin: subOriginId,
//   //               categoryType: config.categoryTypeId,
//   //               amount: Number(config.amount),
//   //               period: config.period,
//   //               status: config.status ? "ACTIVE" : "INACTIVE",
//   //               approvers: approversData,
//   //             });
//   //             successCount++;
//   //           }
//   //         } catch (error) {
//   //           console.error(`Error processing config ${config.categoryTypeId}:`, error);
//   //           errorCount++;
//   //         }
//   //       }
//   //     } else {
//   //       // Create new configurations
//   //       for (let i = 0; i < categoryConfigs.length; i++) {
//   //         const config = categoryConfigs[i];
//   //         const categoryApprovers = categoryApproversMap[i] || [];
          
//   //         const approversData = categoryApprovers
//   //           .filter(a => a.positionId)
//   //           .map(a => ({
//   //             level: a.level,
//   //             approverType: a.employeeId ? 'specific_employee' : 'position',
//   //             approverId: a.employeeId || a.positionId,
//   //           }));

//   //         try {
//   //           await createConfig.mutateAsync({
//   //             origin,
//   //             subOrigin: subOriginId,
//   //             categoryType: config.categoryTypeId,
//   //             amount: Number(config.amount),
//   //             period: config.period,
//   //             status: config.status ? "ACTIVE" : "INACTIVE",
//   //             approvers: approversData,
//   //           });
//   //           successCount++;
//   //         } catch (error) {
//   //           console.error(`Error creating config ${config.categoryTypeId}:`, error);
//   //           errorCount++;
//   //         }
//   //       }
//   //     }

//   //     // if (errorCount > 0) {
//   //     //   api.warning({
//   //     //     message: "Partial success",
//   //     //     description: `${successCount} saved, ${errorCount} failed`,
//   //     //     placement: "topRight",
//   //     //   });
//   //     // } else {
//   //     //   api.success({
//   //     //     message: "Saved successfully",
//   //     //     description: `${successCount} configuration(s) saved`,
//   //     //     placement: "topRight",
//   //     //   });
//   //     // }

//   //     setIsDrawerVisible(false);
//   //     form.resetFields();
//   //     setEditingKey(null);
//   //     setCategoryApproversMap({});
      
//   //     await refetch();
      
//   //   } catch (error: any) {
//   //     console.error("Save error:", error);
//   //     api.error({
//   //       message: error.message || "Failed to save",
//   //       placement: "topRight",
//   //     });
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };

//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         (item.categoryTypeName || item.categoryTypeId)?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       api.success({
//         message: "Data refreshed",
//         placement: "topRight",
//       });
//     } catch (error) {
//       api.error({
//         message: "Failed to refresh",
//         placement: "topRight",
//       });
//     }
//   };

//   const handleCloseDrawer = () => {
//     if (isSaving) return;
//     setIsDrawerVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setCategoryApproversMap({});
//   };

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center" size={8}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//           </div>

//           <Space size={8}>
//             <Tooltip title="Refresh">
//               <Button 
//                 size="small"
//                 icon={<ReloadOutlined />} 
//                 onClick={handleRefresh}
//                 loading={isLoading}
//               />
//             </Tooltip>
//             <Input.Search
//               placeholder="Search..."
//               allowClear
//               size="small"
//               style={{ width: 200 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               size="small"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//                 setIsDrawerVisible(true);
//               }}
//             >
//               Add configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 12 }}>
//           <Space size={8}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="small"
//           pagination={{
//             pageSize: 10,
//             size: "small",
//             showTotal: (total) => `Total ${total}`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Drawer
//           title={
//             <Space size={4}>
//               <WalletOutlined style={{ fontSize: 14 }} />
//               <span style={{ fontSize: 14 }}>
//                 {editingKey ? "Edit Configuration" : "Add Configuration"}
//               </span>
//             </Space>
//           }
//           placement="right"
//           width={600}
//           onClose={handleCloseDrawer}
//           open={isDrawerVisible}
//           destroyOnClose
//           headerStyle={{ padding: '12px 16px' }}
//           bodyStyle={{ padding: '16px' }}
//           extra={
//             <Space size={4}>
//               <Button size="small" onClick={handleCloseDrawer} icon={<CloseOutlined />} disabled={isSaving}>
//                 Cancel
//               </Button>
//               <Button 
//                 size="small"
//                 type="primary" 
//                 onClick={() => form.submit()} 
//                 loading={isSaving}
//               >
//                 {editingKey ? "Update" : "Create"}
//               </Button>
//             </Space>
//           }
//         >
//           <Form 
//             form={form} 
//             layout="vertical" 
//             onFinish={handleSave}
//             size="small"
//           >
//             <Card 
//               size="small"
//               style={{ marginBottom: 12, background: '#f5f5f5' }}
//               bodyStyle={{ padding: '12px' }}
//             >
//               <Row gutter={8}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="origin"
//                     label={<span style={{ fontSize: 12 }}>Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!!editingKey}
//                       onChange={() => {
//                         form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
//                         setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//                       }}
//                     >
//                       <Option value="Grade">Grade</Option>
//                       <Option value="Department">Department</Option>
//                       <Option value="Sub-department">Sub-dept</Option>
//                       <Option value="Position">Position</Option>
//                       <Option value="User">User</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     name="subOriginId"
//                     label={<span style={{ fontSize: 12 }}>Sub-Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!originType || !!editingKey}
//                       loading={getSubOriginLoading()}
//                       showSearch
//                       filterOption={filterOption}
//                       options={getSubOriginOptions()}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>
              
//               {originType && subOriginId && (
//                 <div style={{ 
//                   marginTop: 4, 
//                   padding: 4, 
//                   background: '#e6f7ff', 
//                   borderRadius: 4,
//                   border: '1px solid #91d5ff',
//                   fontSize: 12
//                 }}>
//                   <Text strong style={{ fontSize: 11 }}>Selected: </Text>
//                   <Tag color="blue" style={{ fontSize: 10 }}>{originType}</Tag>
//                   <Tag color="green" style={{ fontSize: 10 }}>
//                     {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
//                   </Tag>
//                 </div>
//               )}
//             </Card>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CompactCategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   categoryApproversMap={categoryApproversMap}
//                   onCategoryApproversChange={handleCategoryApproversChange}
//                   positions={positions}
//                   positionsLoading={positionsLoading}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Drawer>
//       </div>
//     </ProtectedRoute>
//   );
// }







// "use client";

// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import ProtectedRoute from "@/components/common/ProtectedRoute";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Drawer,
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
//   Divider,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryTypeId: string;
//   categoryTypeName?: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

// // Compact styles
// const compactSwitchCard = {
//   display: "flex",
//   justifyContent: "space-between",
//   alignItems: "center",
//   padding: "6px 8px",
//   border: "1px solid #f0f0f0",
//   borderRadius: 6,
//   marginBottom: 8,
//   background: "#fafafa",
// };

// const switchTitle = {
//   fontSize: 13,
//   fontWeight: 500,
// };

// const switchDesc = {
//   fontSize: 11,
//   color: "#8c8c8c",
//   marginTop: 1,
// };

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

// // Compact Approval Levels Component
// const CompactApprovalLevelsContent = ({
//   value = [],
//   onChange,
//   positions,
//   positionsLoading,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionId 
//       });
//       setEmployeesByPosition(prev => ({ ...prev, [positionId]: members }));
//     } catch (error) {
//       console.error("Failed to fetch employees:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 12 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//         <Space size={4}>
//           <UserOutlined style={{ color: '#1677ff', fontSize: 14 }} />
//           <Title level={5} style={{ margin: 0, fontSize: 14 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing" style={{ fontSize: 11 }}>{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 8, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff',
//             fontSize: 12
//           }}
//           bodyStyle={{ padding: '8px' }}
//         >
//           <Row gutter={8} align="middle">
//             <Col span={3}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   size="small"
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Lvl"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={3} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove">
//                 <Button 
//                   danger 
//                   size="small"
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 4, fontSize: 12 }}
//       >
//         Add Level
//       </Button>
//     </div>
//   );
// };

// // Compact Category Config List Component with per-category approvers
// const CompactCategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   categoryApproversMap,
//   onCategoryApproversChange,
//   positions,
//   positionsLoading,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   categoryApproversMap: Record<number, ApproverRow[]>;
//   onCategoryApproversChange: (index: number, approvers: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
  
//   const prevFieldsLength = useRef(fields.length);

//   // Handle new category addition
//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
      
//       // Initialize approvers for new category
//       const newIndex = fields.length - 1;
//       const defaultApprovers = [{ level: 1, positionId: '', employeeId: null }];
      
//       // Update parent with initial approvers
//       onCategoryApproversChange(newIndex, defaultApprovers);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length, onCategoryApproversChange]);

//   const getSelectedCategoryTypeIds = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryTypeId)
//       .filter(Boolean);
//   };

//   const getCategoryNameById = (id: string) => {
//     const category = categoryOptions.find(opt => opt.id === id);
//     return category?.name || 'Unknown';
//   };

//   // Get current approvers for a category
//   const getCurrentApprovers = (index: number) => {
//     return categoryApproversMap[index] || [{ level: 1, positionId: '', employeeId: null }];
//   };

//   return (
//     <Card 
//       size="small"
//       style={{ 
//         marginBottom: 12,
//         border: '1px solid #f0f0f0',
//         borderRadius: 6
//       }}
//       bodyStyle={{ padding: '12px' }}
//     >
//       <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14 }}>Category Configurations</Title>
      
//       <Collapse
//         accordion
//         size="small"
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }, index) => {
//           const selectedCategoryTypeIds = getSelectedCategoryTypeIds(name);
//           const currentCategoryTypeId = categoryConfigs?.[name]?.categoryTypeId;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;
//           const currentApprovers = getCurrentApprovers(index);

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryTypeIds.includes(option.id)
//           );

//           return {
//             key: key,
//             label: (
//               <Space size={4}>
//                 <Tag color="blue" style={{ fontSize: 11 }}>
//                   {currentCategoryTypeId 
//                     ? getCategoryNameById(currentCategoryTypeId) 
//                     : 'New Category'}
//                 </Tag>
//                 {currentApprovers.length > 0 && (
//                   <Tag color="purple" style={{ fontSize: 10 }}>
//                     {currentApprovers.length} Approver(s)
//                   </Tag>
//                 )}
//               </Space>
//             ),
//             extra:
//               fields.length > 1 ? (
//                 <Popconfirm
//                   title="Delete?"
//                   onConfirm={() => remove(name)}
//                   onCancel={(e) => e?.stopPropagation()}
//                 >
//                   <DeleteOutlined
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ color: "red", fontSize: 12 }}
//                   />
//                 </Popconfirm>
//               ) : null,
//             children: (
//               <div style={{ padding: '4px 0' }}>
//                 <Form.Item name={[name, "id"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryTypeId"]}
//                       label={<span style={{ fontSize: 12 }}>Category Type</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select
//                         size="small"
//                         placeholder="Select"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.id} label={opt.name}>
//                             {opt.name}
//                           </Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label={<span style={{ fontSize: 12 }}>Amount</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <InputNumber
//                         size="small"
//                         min={0}
//                         precision={2}
//                         style={{ width: "100%" }}
//                         placeholder="Amount"
//                         prefix="₹"
//                       />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "period"]}
//                       label={<span style={{ fontSize: 12 }}>Period</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select size="small" placeholder="Period">
//                         <Option value="MONTH">Month</Option>
//                         <Option value="YEAR">Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <div style={{ ...compactSwitchCard, marginTop: 0 }}>
//                       <div>
//                         <div style={switchTitle}>Active</div>
//                         <div style={switchDesc}>Enable this category</div>
//                       </div>
//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch size="small" />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f6f9fc",
//                       marginTop: 8,
//                       border: "1px solid #91d5ff",
//                       borderRadius: 4,
//                     }}
//                     bodyStyle={{ padding: '6px' }}
//                   >
//                     <Row gutter={8}>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Monthly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                             ₹{previewAmounts.monthly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Yearly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
//                             ₹{previewAmounts.yearly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}

//                 <Divider style={{ margin: '12px 0 8px 0' }} />

//                 <CompactApprovalLevelsContent 
//                   value={currentApprovers}
//                   onChange={(newApprovers) => onCategoryApproversChange(index, newApprovers)}
//                   positions={positions}
//                   positionsLoading={positionsLoading}
//                 />
//               </div>
//             ),
//           };
//         })}
//       />

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={() => add()} 
//         style={{ marginTop: 8, fontSize: 12 }}
//         icon={<PlusOutlined />}
//       >
//         Add Category
//       </Button>
//     </Card>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const subOriginId = Form.useWatch("subOriginId", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isDrawerVisible, setIsDrawerVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  
//   // Store approvers per category index
//   const [categoryApproversMap, setCategoryApproversMap] = useState<Record<number, ApproverRow[]>>({});

//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
        
//         const map: Record<string, string> = {};
//         options.forEach(opt => {
//           map[opt.id] = opt.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

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

//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") return membersMap[subOriginId] || subOriginId;
//     if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
//     if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
//     if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
//     if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
//     return subOriginId;
//   };

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];
//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;
      
//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryTypeId: config.categoryType,
//         categoryTypeName: categoryMap[config.categoryType] || config.categoryType,
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel, categoryMap]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];
//     switch (originType) {
//       case "User": return members.map((m) => ({ label: m.name, value: m.id }));
//       case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
//       case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
//       case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
//       case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
//       default: return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade": return gradesLoading;
//       case "Department": return departmentsLoading;
//       case "Sub-department": return subDepartmentsLoading;
//       case "Position": return positionsLoading;
//       default: return false;
//     }
//   };

//   const capitalizeFirstLetter = (str: string) => {
//     if (!str) return str;
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   };

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
//       key: "categoryType",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const categoryName = record.categoryTypeName || record.categoryTypeId;
//         return <Tag color="blue">{capitalizeFirstLetter(categoryName)}</Tag>;
//       },
//     },
//     {
//       title: "Period",
//       dataIndex: "period",
//       key: "period",
//       align: "center",
//       render: (period: string) => (
//         <Tag color={period === "MONTH" ? "green" : "orange"}>
//           {period === "MONTH" ? "Month" : "Year"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Monthly",
//       key: "monthlyAmount",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const amounts = calculateAmounts(record.amount, record.period);
//         return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
//       },
//     },
//     {
//       title: "Yearly",
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
//         <Space size={4}>
//           <Tooltip title="Edit">
//             <Button
//               type="text"
//               size="small"
//               icon={<EditOutlined />}
//               onClick={() => handleEdit(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Delete this configuration?"
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 size="small"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleCategoryApproversChange = useCallback((index: number, approvers: ApproverRow[]) => {
//     setCategoryApproversMap(prev => ({
//       ...prev,
//       [index]: approvers
//     }));
//   }, []);

//   const handleEdit = (record: ReimbursementRecord) => {
//     setEditingKey(record.id);
    
//     const selectedConfig = dataSource.find(item => item.id === record.id);
    
//     if (!selectedConfig) return;

//     // Prepare form values for the selected config
//     const configsForForm = [{
//       id: selectedConfig.id,
//       policyId: selectedConfig.policyId,
//       ruleId: selectedConfig.ruleId,
//       categoryTypeId: selectedConfig.categoryTypeId,
//       amount: selectedConfig.amount,
//       period: selectedConfig.period,
//       status: selectedConfig.status === "ACTIVE",
//     }];

//     form.setFieldsValue({
//       origin: selectedConfig.origin,
//       subOriginId: selectedConfig.subOriginId,
//       categoryConfigs: configsForForm,
//     });

//     // Store approvers for this category
//     if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//       const mappedApprovers = selectedConfig.approvers.map((a: any) => ({
//         level: a.level,
//         positionId: a.approverType === 'position' ? a.approverId : '',
//         employeeId: a.approverType === 'specific_employee' ? a.approverId : null,
//       }));
      
//       setCategoryApproversMap({ 0: mappedApprovers });
//     } else {
//       setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//     }

//     setIsDrawerVisible(true);
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       await refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // const handleSave = async (values: any) => {
//   //   setIsSaving(true);
//   //   try {
//   //     const { origin, subOriginId, categoryConfigs } = values;

//   //     if (!origin || !subOriginId) {
//   //       throw new Error("Please select both Origin and Sub-Origin");
//   //     }

//   //     if (!categoryConfigs || categoryConfigs.length === 0) {
//   //       throw new Error("Please add at least one category configuration");
//   //     }

//   //     let successCount = 0;
//   //     let errorCount = 0;

//   //     if (editingKey) {
//   //       // Update existing configurations
//   //       for (let i = 0; i < categoryConfigs.length; i++) {
//   //         const config = categoryConfigs[i];
//   //         const categoryApprovers = categoryApproversMap[i] || [];
          
//   //         const approversData = categoryApprovers
//   //           .filter(a => a.positionId)
//   //           .map(a => ({
//   //             level: a.level,
//   //             approverType: a.employeeId ? 'specific_employee' : 'position',
//   //             approverId: a.employeeId || a.positionId,
//   //           }));

//   //         try {
//   //           if (config.id) {
//   //             await updateConfig.mutateAsync({
//   //               id: config.id,
//   //               data: {
//   //                 origin,
//   //                 subOrigin: subOriginId,
//   //                 categoryType: config.categoryTypeId,
//   //                 amount: Number(config.amount),
//   //                 period: config.period,
//   //                 status: config.status ? "ACTIVE" : "INACTIVE",
//   //                 approvers: approversData,
//   //               },
//   //             });
//   //             successCount++;
//   //           } else {
//   //             await createConfig.mutateAsync({
//   //               origin,
//   //               subOrigin: subOriginId,
//   //               categoryType: config.categoryTypeId,
//   //               amount: Number(config.amount),
//   //               period: config.period,
//   //               status: config.status ? "ACTIVE" : "INACTIVE",
//   //               approvers: approversData,
//   //             });
//   //             successCount++;
//   //           }
//   //         } catch (error) {
//   //           console.error(`Error processing config ${config.categoryTypeId}:`, error);
//   //           errorCount++;
//   //         }
//   //       }
//   //     } else {
//   //       // Create new configurations
//   //       for (let i = 0; i < categoryConfigs.length; i++) {
//   //         const config = categoryConfigs[i];
//   //         const categoryApprovers = categoryApproversMap[i] || [];
          
//   //         const approversData = categoryApprovers
//   //           .filter(a => a.positionId)
//   //           .map(a => ({
//   //             level: a.level,
//   //             approverType: a.employeeId ? 'specific_employee' : 'position',
//   //             approverId: a.employeeId || a.positionId,
//   //           }));

//   //         try {
//   //           await createConfig.mutateAsync({
//   //             origin,
//   //             subOrigin: subOriginId,
//   //             categoryType: config.categoryTypeId,
//   //             amount: Number(config.amount),
//   //             period: config.period,
//   //             status: config.status ? "ACTIVE" : "INACTIVE",
//   //             approvers: approversData,
//   //           });
//   //           successCount++;
//   //         } catch (error) {
//   //           console.error(`Error creating config ${config.categoryTypeId}:`, error);
//   //           errorCount++;
//   //         }
//   //       }
//   //     }

//   //     // if (errorCount > 0) {
//   //     //   api.warning({
//   //     //     message: "Partial success",
//   //     //     description: `${successCount} saved, ${errorCount} failed`,
//   //     //     placement: "topRight",
//   //     //   });
//   //     // } else {
//   //     //   api.success({
//   //     //     message: "Saved successfully",
//   //     //     description: `${successCount} configuration(s) saved`,
//   //     //     placement: "topRight",
//   //     //   });
//   //     // }

//   //     setIsDrawerVisible(false);
//   //     form.resetFields();
//   //     setEditingKey(null);
//   //     setCategoryApproversMap({});
      
//   //     await refetch();
      
//   //   } catch (error: any) {
//   //     console.error("Save error:", error);
//   //     api.error({
//   //       message: error.message || "Failed to save",
//   //       placement: "topRight",
//   //     });
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };
// const handleSave = async (values: any) => {
//   setIsSaving(true);
//   try {
//     const { origin, subOriginId, categoryConfigs } = values;

//     if (!origin || !subOriginId) {
//       throw new Error("Please select both Origin and Sub-Origin");
//     }

//     if (!categoryConfigs || categoryConfigs.length === 0) {
//       throw new Error("Please add at least one category configuration");
//     }

//     let successCount = 0;
//     let errorCount = 0;

//     if (editingKey) {
//       // Update existing configurations
//       for (let i = 0; i < categoryConfigs.length; i++) {
//         const config = categoryConfigs[i];
//         const categoryApprovers = categoryApproversMap[i] || [];
        
//         const approversData = categoryApprovers
//           .filter(a => a.positionId)
//           .map(a => {
//             // 🔴 THIS IS THE KEY CHANGE - Find the position title
//             const selectedPosition = positions.find(p => p.id === a.positionId);
//             const positionTitle = selectedPosition?.title || a.positionId;
            
//             return {
//               level: a.level,
//               // Use the position title as approverType instead of hardcoded 'position'
//               approverType: a.employeeId ? 'specific_employee' : positionTitle,
//               approverId: a.employeeId || a.positionId,
//             };
//           });

//         try {
//           if (config.id) {
//             await updateConfig.mutateAsync({
//               id: config.id,
//               data: {
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryTypeId,
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               },
//             });
//             successCount++;
//           } else {
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryTypeId,
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
//             });
//             successCount++;
//           }
//         } catch (error) {
//           console.error(`Error processing config ${config.categoryTypeId}:`, error);
//           errorCount++;
//         }
//       }
//     } else {
//       // Create new configurations
//       for (let i = 0; i < categoryConfigs.length; i++) {
//         const config = categoryConfigs[i];
//         const categoryApprovers = categoryApproversMap[i] || [];
        
//         const approversData = categoryApprovers
//           .filter(a => a.positionId)
//           .map(a => {
//             // 🔴 THIS IS THE KEY CHANGE - Find the position title
//             const selectedPosition = positions.find(p => p.id === a.positionId);
//             const positionTitle = selectedPosition?.title || a.positionId;
            
//             return {
//               level: a.level,
//               // Use the position title as approverType instead of hardcoded 'position'
//               approverType: a.employeeId ? 'specific_employee' : positionTitle,
//               approverId: a.employeeId || a.positionId,
//             };
//           });

//         try {
//           await createConfig.mutateAsync({
//             origin,
//             subOrigin: subOriginId,
//             categoryType: config.categoryTypeId,
//             amount: Number(config.amount),
//             period: config.period,
//             status: config.status ? "ACTIVE" : "INACTIVE",
//             approvers: approversData,
//           });
//           successCount++;
//         } catch (error) {
//           console.error(`Error creating config ${config.categoryTypeId}:`, error);
//           errorCount++;
//         }
//       }
//     }

//     setIsDrawerVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setCategoryApproversMap({});
    
//     await refetch();
    
//   } catch (error: any) {
//     console.error("Save error:", error);
//     api.error({
//       message: error.message || "Failed to save",
//       placement: "topRight",
//     });
//   } finally {
//     setIsSaving(false);
//   }
// };
//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         (item.categoryTypeName || item.categoryTypeId)?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       api.success({
//         message: "Data refreshed",
//         placement: "topRight",
//       });
//     } catch (error) {
//       api.error({
//         message: "Failed to refresh",
//         placement: "topRight",
//       });
//     }
//   };

//   const handleCloseDrawer = () => {
//     if (isSaving) return;
//     setIsDrawerVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setCategoryApproversMap({});
//   };

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 24 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center" size={8}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//           </div>

//           <Space size={8}>
//             <Tooltip title="Refresh">
//               <Button 
//                 size="small"
//                 icon={<ReloadOutlined />} 
//                 onClick={handleRefresh}
//                 loading={isLoading}
//               />
//             </Tooltip>
//             <Input.Search
//               placeholder="Search..."
//               allowClear
//               size="small"
//               style={{ width: 200 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               size="small"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//                 setIsDrawerVisible(true);
//               }}
//             >
//               Add configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 12 }}>
//           <Space size={8}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="small"
//           pagination={{
//             pageSize: 10,
//             size: "small",
//             showTotal: (total) => `Total ${total}`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Drawer
//           title={
//             <Space size={4}>
//               <WalletOutlined style={{ fontSize: 14 }} />
//               <span style={{ fontSize: 14 }}>
//                 {editingKey ? "Edit Configuration" : "Add Configuration"}
//               </span>
//             </Space>
//           }
//           placement="right"
//           width={600}
//           onClose={handleCloseDrawer}
//           open={isDrawerVisible}
//           destroyOnClose
//           headerStyle={{ padding: '12px 16px' }}
//           bodyStyle={{ padding: '16px' }}
//           extra={
//             <Space size={4}>
//               <Button size="small" onClick={handleCloseDrawer} icon={<CloseOutlined />} disabled={isSaving}>
//                 Cancel
//               </Button>
//               <Button 
//                 size="small"
//                 type="primary" 
//                 onClick={() => form.submit()} 
//                 loading={isSaving}
//               >
//                 {editingKey ? "Update" : "Create"}
//               </Button>
//             </Space>
//           }
//         >
//           <Form 
//             form={form} 
//             layout="vertical" 
//             onFinish={handleSave}
//             size="small"
//           >
//             <Card 
//               size="small"
//               style={{ marginBottom: 12, background: '#f5f5f5' }}
//               bodyStyle={{ padding: '12px' }}
//             >
//               <Row gutter={8}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="origin"
//                     label={<span style={{ fontSize: 12 }}>Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!!editingKey}
//                       onChange={() => {
//                         form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
//                         setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//                       }}
//                     >
//                       <Option value="Grade">Grade</Option>
//                       <Option value="Department">Department</Option>
//                       <Option value="Sub-department">Sub-dept</Option>
//                       <Option value="Position">Position</Option>
//                       <Option value="User">User</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     name="subOriginId"
//                     label={<span style={{ fontSize: 12 }}>Sub-Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!originType || !!editingKey}
//                       loading={getSubOriginLoading()}
//                       showSearch
//                       filterOption={filterOption}
//                       options={getSubOriginOptions()}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>
              
//               {originType && subOriginId && (
//                 <div style={{ 
//                   marginTop: 4, 
//                   padding: 4, 
//                   background: '#e6f7ff', 
//                   borderRadius: 4,
//                   border: '1px solid #91d5ff',
//                   fontSize: 12
//                 }}>
//                   <Text strong style={{ fontSize: 11 }}>Selected: </Text>
//                   <Tag color="blue" style={{ fontSize: 10 }}>{originType}</Tag>
//                   <Tag color="green" style={{ fontSize: 10 }}>
//                     {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
//                   </Tag>
//                 </div>
//               )}
//             </Card>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CompactCategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   categoryApproversMap={categoryApproversMap}
//                   onCategoryApproversChange={handleCategoryApproversChange}
//                   positions={positions}
//                   positionsLoading={positionsLoading}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Drawer>
//       </div>
//     </ProtectedRoute>
//   );
// }









// "use client";

// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import ProtectedRoute from "@/components/common/ProtectedRoute";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Drawer,
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
//   Divider,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   WalletOutlined,
//   UserOutlined,
//   ReloadOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { useGrades } from "@/hooks/useGrades";
// import { useDepartments } from "@/hooks/useDepartments";
// import { useSubDepartments } from "@/hooks/useSubDepartments";
// import { usePositions } from "@/hooks/usePositions";
// import { MembersService } from "@/services/membersService";
// import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
// import {
//   useReimbursementConfigurations,
//   useCreateReimbursementConfiguration,
//   useUpdateReimbursementConfiguration,
//   useDeleteReimbursementConfiguration,
// } from "@/hooks/usereimbursementconfig";

// const { Text, Title } = Typography;
// const { Option } = Select;

// interface ReimbursementRecord {
//   key: string;
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryType: string; // Now stores the name directly
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   policyId?: string;
//   ruleId?: string;
//   approvers?: any[];
// }

// interface SubOriginOption {
//   id: string;
//   name: string;
//   originType: string;
// }

// interface ApproverRow {
//   level: number;
//   positionId: string;
//   employeeId?: string | null;
// }

// interface CategoryOption {
//   id: string;
//   name: string;
//   code: string;
// }

// // Compact styles
// const compactSwitchCard = {
//   display: "flex",
//   justifyContent: "space-between",
//   alignItems: "center",
//   padding: "6px 8px",
//   border: "1px solid #f0f0f0",
//   borderRadius: 6,
//   marginBottom: 8,
//   background: "#fafafa",
// };

// const switchTitle = {
//   fontSize: 13,
//   fontWeight: 500,
// };

// const switchDesc = {
//   fontSize: 11,
//   color: "#8c8c8c",
//   marginTop: 1,
// };

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

// // Compact Approval Levels Component
// const CompactApprovalLevelsContent = ({
//   value = [],
//   onChange,
//   positions,
//   positionsLoading,
  
  
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});



// const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//   if (!positionId) return;
  
//   try {
//     setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
    
//     console.log("========== EMPLOYEE FETCH START ==========");
//     console.log("🔍 Position ID received:", positionId);
    
//     // Get position name
//     const selectedPosition = positions.find(p => p.id === positionId);
//     const positionName = selectedPosition?.title;
//     console.log("🔍 Position name:", positionName);
    
//     if (!positionName) {
//       console.log("❌ Position name not found");
//       return;
//     }
    
//     // Call API with position NAME instead of ID
//     const members = await MembersService.getMembersForSelect({ 
//       position: positionName  // Send name instead of ID
//     });
    
//     console.log("🔍 Members received:", members);
    
//     setEmployeesByPosition(prev => ({ 
//       ...prev, 
//       [positionId]: members 
//     }));
    
//   } catch (error) {
//     console.error("❌ ERROR:", error);
//   } finally {
//     setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//   }
// };
// // Add this debug useEffect
// useEffect(() => {
//   console.log("📊 employeesByPosition state updated:", employeesByPosition);
  
//   // Check if any position has employees
//   Object.keys(employeesByPosition).forEach(positionId => {
//     const employees = employeesByPosition[positionId];
//     console.log(`📊 Position ${positionId}: ${employees?.length || 0} employees`);
//   });
// }, [employeesByPosition]);

// // Run this in your browser console
// const checkMembers = async () => {
//   const allMembers = await MembersService.getMembersForSelect();
//   console.log('All members:', allMembers);
  
//   // Check specifically for Associate position
//   const associateMembers = allMembers.filter(m => m.position === 'Associate');
//   console.log('Members with Associate position:', associateMembers);
// }

// checkMembers();








//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 12 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//         <Space size={4}>
//           <UserOutlined style={{ color: '#1677ff', fontSize: 14 }} />
//           <Title level={5} style={{ margin: 0, fontSize: 14 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing" style={{ fontSize: 11 }}>{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 8, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff',
//             fontSize: 12
//           }}
//           bodyStyle={{ padding: '8px' }}
//         >
//           <Row gutter={8} align="middle">
//             <Col span={3}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   size="small"
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Lvl"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             {/* <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={row.positionId ? (employeesByPosition[row.positionId] || []).map(emp => ({
//                     label: emp.label,
//                     value: emp.value,
//                   })) : []}
//                 />
//          </Form.Item>
//             </Col> */}
//             <Col span={9}>
//   <Form.Item style={{ marginBottom: 0 }}>
//     <Select
//       size="small"
//       placeholder="Employee"
//       value={row.employeeId}
//       onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//       style={{ width: '100%' }}
//       showSearch
//       loading={loadingEmployees[index]}
//       disabled={!row.positionId}
//       allowClear
//       notFoundContent={loadingEmployees[index] ? "Loading..." : "No employees found"}
//       filterOption={(input, option) => 
//         (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//       }
//       options={(() => {
//         // Debug log to see what's available
//         console.log(`🔍 Row ${index} - Position ID:`, row.positionId);
//         console.log(`🔍 Row ${index} - Employees for this position:`, employeesByPosition[row.positionId]);
        
//         if (!row.positionId) return [];
        
//         const employees = employeesByPosition[row.positionId] || [];
        
//         // Map employees to options format
//         return employees.map(emp => ({
//           label: emp.label,  // This should be the employee name
//           value: emp.value,   // This should be the employee ID
//           email: emp.email    // Optional: you can use this for filtering
//         }));
//       })()}
//     />
//     {/* Add a small debug indicator (optional - remove in production) */}
//     {row.positionId && employeesByPosition[row.positionId]?.length === 0 && !loadingEmployees[index] && (
//       <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
//         No employees with this position
//       </div>
//     )}
//   </Form.Item>
// </Col>

//             <Col span={3} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove">
//                 <Button 
//                   danger 
//                   size="small"
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 4, fontSize: 12 }}
//       >
//         Add Level
//       </Button>
//     </div>
//   );
// };

// // Compact Category Config List Component with per-category approvers
// const CompactCategoryConfigListContent = ({
//   fields,
//   add,
//   remove,
//   categoryConfigs,
//   editingKey,
//   categoryOptions,
//   categoryApproversMap,
//   onCategoryApproversChange,
//   positions,
//   positionsLoading,
// }: {
//   fields: any[];
//   add: () => void;
//   remove: (index: number | number[]) => void;
//   categoryConfigs: any[];
//   editingKey: string | null;
//   categoryOptions: CategoryOption[];
//   categoryApproversMap: Record<number, ApproverRow[]>;
//   onCategoryApproversChange: (index: number, approvers: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
// }) => {
//   const [activeKey, setActiveKey] = useState<
//     string | string[] | number | number[]
//   >(fields.length > 0 ? fields[0].key : []);
  
//   const prevFieldsLength = useRef(fields.length);

//   // Handle new category addition
//   useEffect(() => {
//     if (fields.length > prevFieldsLength.current) {
//       const lastField = fields[fields.length - 1];
//       setActiveKey(lastField.key);
      
//       // Initialize approvers for new category
//       const newIndex = fields.length - 1;
//       const defaultApprovers = [{ level: 1, positionId: '', employeeId: null }];
      
//       // Update parent with initial approvers
//       onCategoryApproversChange(newIndex, defaultApprovers);
//     }
//     prevFieldsLength.current = fields.length;
//   }, [fields.length, onCategoryApproversChange]);

//   const getSelectedCategoryNames = (currentIndex: number) => {
//     return (categoryConfigs || [])
//       .filter((_: any, index: number) => index !== currentIndex)
//       .map((item: any) => item?.categoryType)
//       .filter(Boolean);
//   };

//   // Get current approvers for a category
//   const getCurrentApprovers = (index: number) => {
//     return categoryApproversMap[index] || [{ level: 1, positionId: '', employeeId: null }];
//   };

//   return (
//     <Card 
//       size="small"
//       style={{ 
//         marginBottom: 12,
//         border: '1px solid #f0f0f0',
//         borderRadius: 6
//       }}
//       bodyStyle={{ padding: '12px' }}
//     >
//       <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14 }}>Category Configurations</Title>
      
//       <Collapse
//         accordion
//         size="small"
//         activeKey={activeKey}
//         onChange={setActiveKey}
//         items={fields.map(({ key, name, ...restField }, index) => {
//           const selectedCategoryNames = getSelectedCategoryNames(name);
//           const currentCategoryType = categoryConfigs?.[name]?.categoryType;
//           const currentAmount = categoryConfigs?.[name]?.amount;
//           const currentPeriod = categoryConfigs?.[name]?.period;
//           const currentApprovers = getCurrentApprovers(index);

//           const previewAmounts =
//             currentAmount && currentPeriod
//               ? calculateAmounts(currentAmount, currentPeriod)
//               : null;

//           // Filter out already selected categories by NAME
//           const filteredCategoryOptions = categoryOptions.filter(
//             option => !selectedCategoryNames.includes(option.name)
//           );

//           return {
//             key: key,
//             label: (
//               <Space size={4}>
//                 <Tag color="blue" style={{ fontSize: 11 }}>
//                   {currentCategoryType || 'New Category'}
//                 </Tag>
//                 {currentApprovers.length > 0 && (
//                   <Tag color="purple" style={{ fontSize: 10 }}>
//                     {currentApprovers.length} Approver(s)
//                   </Tag>
//                 )}
//               </Space>
//             ),
//             extra:
//               fields.length > 1 ? (
//                 <Popconfirm
//                   title="Delete?"
//                   onConfirm={() => remove(name)}
//                   onCancel={(e) => e?.stopPropagation()}
//                 >
//                   <DeleteOutlined
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ color: "red", fontSize: 12 }}
//                   />
//                 </Popconfirm>
//               ) : null,
//             children: (
//               <div style={{ padding: '4px 0' }}>
//                 <Form.Item name={[name, "id"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "policyId"]} hidden>
//                   <Input />
//                 </Form.Item>
//                 <Form.Item name={[name, "ruleId"]} hidden>
//                   <Input />
//                 </Form.Item>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "categoryType"]}
//                       label={<span style={{ fontSize: 12 }}>Category Type</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select
//                         size="small"
//                         placeholder="Select"
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) => 
//                           (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                         }
//                       >
//                         {filteredCategoryOptions.map((opt) => (
//                           <Option key={opt.id} value={opt.name} label={opt.name}>
//                             {opt.name}
//                           </Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "amount"]}
//                       label={<span style={{ fontSize: 12 }}>Amount</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <InputNumber
//                         size="small"
//                         min={0}
//                         precision={2}
//                         style={{ width: "100%" }}
//                         placeholder="Amount"
//                         prefix="₹"
//                       />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, "period"]}
//                       label={<span style={{ fontSize: 12 }}>Period</span>}
//                       rules={[{ required: true, message: "Required" }]}
//                       style={{ marginBottom: 8 }}
//                     >
//                       <Select size="small" placeholder="Period">
//                         <Option value="MONTH">Month</Option>
//                         <Option value="YEAR">Year</Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Row gutter={8}>
//                   <Col span={24}>
//                     <div style={{ ...compactSwitchCard, marginTop: 0 }}>
//                       <div>
//                         <div style={switchTitle}>Active</div>
//                         <div style={switchDesc}>Enable this category</div>
//                       </div>
//                       <Form.Item
//                         {...restField}
//                         name={[name, "status"]}
//                         valuePropName="checked"
//                         initialValue={true}
//                         noStyle
//                       >
//                         <Switch size="small" />
//                       </Form.Item>
//                     </div>
//                   </Col>
//                 </Row>

//                 {previewAmounts && (
//                   <Card
//                     size="small"
//                     style={{
//                       background: "#f6f9fc",
//                       marginTop: 8,
//                       border: "1px solid #91d5ff",
//                       borderRadius: 4,
//                     }}
//                     bodyStyle={{ padding: '6px' }}
//                   >
//                     <Row gutter={8}>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Monthly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                             ₹{previewAmounts.monthly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                       <Col span={12}>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Yearly:</Text>
//                         <div>
//                           <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
//                             ₹{previewAmounts.yearly.toFixed(2)}
//                           </Text>
//                         </div>
//                       </Col>
//                     </Row>
//                   </Card>
//                 )}

//                 <Divider style={{ margin: '12px 0 8px 0' }} />

//                 <CompactApprovalLevelsContent 
//                   value={currentApprovers}
//                   onChange={(newApprovers) => onCategoryApproversChange(index, newApprovers)}
//                   positions={positions}
//                   positionsLoading={positionsLoading}
//                 />
//               </div>
//             ),
//           };
//         })}
//       />

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={() => add()} 
//         style={{ marginTop: 8, fontSize: 12 }}
//         icon={<PlusOutlined />}
//       >
//         Add Category
//       </Button>
//     </Card>
//   );
// };

// export default function ReimbursementConfigurationPage() {
//   const { user } = useAuth();
//   const [api, contextHolder] = notification.useNotification();
//   const [form] = Form.useForm();
//   const originType = Form.useWatch("origin", form);
//   const subOriginId = Form.useWatch("subOriginId", form);
//   const categoryConfigs = Form.useWatch("categoryConfigs", form);

//   const [isDrawerVisible, setIsDrawerVisible] = useState(false);
//   const [editingKey, setEditingKey] = useState<string | null>(null);
//   const [searchText, setSearchText] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [members, setMembers] = useState<SubOriginOption[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  
//   // Store approvers per category index
//   const [categoryApproversMap, setCategoryApproversMap] = useState<Record<number, ApproverRow[]>>({});

//   const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
//   const createConfig = useCreateReimbursementConfiguration();
//   const updateConfig = useUpdateReimbursementConfiguration();
//   const deleteConfig = useDeleteReimbursementConfiguration();

//   const { dataSource: grades, loading: gradesLoading } = useGrades();
//   const { departments, loading: departmentsLoading } = useDepartments();
//   const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
//   const { dataSource: positions, loading: positionsLoading } = usePositions();

//   useEffect(() => {
//     const fetchCategoryOptions = async () => {
//       try {
//         const settings = await ReimbursementSettingsService.getSettings();
//         const activeSettings = settings.filter((s) => s.isActive);
//         const options = activeSettings.map((s) => ({
//           id: s.id,
//           name: s.name,
//           code: s.code,
//         }));
//         setCategoryOptions(options);
//       } catch (error) {
//         console.error("Failed to fetch category options:", error);
//       }
//     };

//     fetchCategoryOptions();
//   }, []);

//   useEffect(() => {
//     const fetchMembersForSelect = async () => {
//       try {
//         const memberData = await MembersService.getMembersForSelect();
//         const formattedMembers = memberData.map((m: any) => ({
//           id: m.value,
//           name: m.label,
//           originType: "User",
//         }));
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error("Failed to fetch members for select:", error);
//       }
//     };
//     fetchMembersForSelect();
//   }, []);

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

//   const getSubOriginLabel = (origin: string, subOriginId: string) => {
//     if (origin === "User") return membersMap[subOriginId] || subOriginId;
//     if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
//     if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
//     if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
//     if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
//     return subOriginId;
//   };

//   const dataSource: ReimbursementRecord[] = useMemo(() => {
//     if (!configs) return [];
//     return configs.map((config) => {
//       const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
//       const amount = Number(config.amount) || 0;
      
//       return {
//         key: config.id,
//         id: config.id,
//         origin: config.origin,
//         subOrigin: subOriginLabel,
//         subOriginId: config.subOrigin,
//         categoryType: config.categoryType, // This is the name directly from backend
//         amount: amount,
//         period: config.period,
//         status: config.status,
//         monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
//         yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
//         policyId: config.policyId,
//         ruleId: config.ruleId,
//         approvers: config.approvers,
//       };
//     });
//   }, [configs, getSubOriginLabel]);

//   const getSubOriginOptions = () => {
//     if (!originType) return [];
//     switch (originType) {
//       case "User": return members.map((m) => ({ label: m.name, value: m.id }));
//       case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
//       case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
//       case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
//       case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
//       default: return [];
//     }
//   };

//   const getSubOriginLoading = () => {
//     switch (originType) {
//       case "Grade": return gradesLoading;
//       case "Department": return departmentsLoading;
//       case "Sub-department": return subDepartmentsLoading;
//       case "Position": return positionsLoading;
//       default: return false;
//     }
//   };

//   const capitalizeFirstLetter = (str: string) => {
//     if (!str) return str;
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   };

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
//       render: (text: string) => (
//         <Tag color="blue">{capitalizeFirstLetter(text)}</Tag>
//       ),
//     },
//     {
//       title: "Period",
//       dataIndex: "period",
//       key: "period",
//       align: "center",
//       render: (period: string) => (
//         <Tag color={period === "MONTH" ? "green" : "orange"}>
//           {period === "MONTH" ? "Month" : "Year"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Monthly",
//       key: "monthlyAmount",
//       align: "center",
//       render: (_: any, record: ReimbursementRecord) => {
//         const amounts = calculateAmounts(record.amount, record.period);
//         return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
//       },
//     },
//     {
//       title: "Yearly",
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
//         <Space size={4}>
//           <Tooltip title="Edit">
//             <Button
//               type="text"
//               size="small"
//               icon={<EditOutlined />}
//               onClick={() => handleEdit(record)}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Delete this configuration?"
//               onConfirm={() => handleDelete(record.id)}
//               okButtonProps={{ loading: deletingId === record.id }}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 type="text"
//                 size="small"
//                 danger
//                 icon={<DeleteOutlined />}
//                 disabled={!!deletingId}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const handleCategoryApproversChange = useCallback((index: number, approvers: ApproverRow[]) => {
//     setCategoryApproversMap(prev => ({
//       ...prev,
//       [index]: approvers
//     }));
//   }, []);

//   // const handleEdit = (record: ReimbursementRecord) => {
//   //   setEditingKey(record.id);
    
//   //   const selectedConfig = dataSource.find(item => item.id === record.id);
    
//   //   if (!selectedConfig) return;

//   //   // Prepare form values for the selected config - using categoryType (name) directly
//   //   const configsForForm = [{
//   //     id: selectedConfig.id,
//   //     policyId: selectedConfig.policyId,
//   //     ruleId: selectedConfig.ruleId,
//   //     categoryType: selectedConfig.categoryType, // Store name directly
//   //     amount: selectedConfig.amount,
//   //     period: selectedConfig.period,
//   //     status: selectedConfig.status === "ACTIVE",
//   //   }];

//   //   form.setFieldsValue({
//   //     origin: selectedConfig.origin,
//   //     subOriginId: selectedConfig.subOriginId,
//   //     categoryConfigs: configsForForm,
//   //   });

//   //   // Store approvers for this category
//   //   if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//   //     const mappedApprovers = selectedConfig.approvers.map((a: any) => ({
//   //       level: a.level,
//   //       positionId: a.approverType === 'position' ? a.approverId : '',
//   //       employeeId: a.approverType === 'specific_employee' ? a.approverId : null,
//   //     }));
      
//   //     setCategoryApproversMap({ 0: mappedApprovers });
//   //   } else {
//   //     setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//   //   }

//   //   setIsDrawerVisible(true);
//   // };







// const handleEdit = (record: ReimbursementRecord) => {
//   setEditingKey(record.id);
  
//   const selectedConfig = dataSource.find(item => item.id === record.id);
  
//   if (!selectedConfig) return;

//   // Prepare form values for the selected config
//   const configsForForm = [{
//     id: selectedConfig.id,
//     policyId: selectedConfig.policyId,
//     ruleId: selectedConfig.ruleId,
//     categoryType: selectedConfig.categoryType,
//     amount: selectedConfig.amount,
//     period: selectedConfig.period,
//     status: selectedConfig.status === "ACTIVE",
//   }];

//   form.setFieldsValue({
//     origin: selectedConfig.origin,
//     subOriginId: selectedConfig.subOriginId,
//     categoryConfigs: configsForForm,
//   });

//   // FIX: Map approvers correctly - already have data, just map it
//   if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
//     const mappedApprovers = selectedConfig.approvers.map((a: any) => {
//       console.log('Approver data:', a); // Check what data you have
      
//       // Simple mapping - whatever data you have, just pass it
//       return {
//         level: a.level,
//         positionId: a.approverId || '', // If approverId is position ID or employee ID
//         employeeId: a.approverType === 'specific_employee' ? a.approverId : null,
//       };
//     });
    
//     setCategoryApproversMap({ 0: mappedApprovers });
//   } else {
//     setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//   }

//   setIsDrawerVisible(true);
// };






//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await deleteConfig.mutateAsync(id);
//       api.success({
//         message: "Configuration deleted successfully",
//         placement: "topRight",
//       });
//       await refetch();
//     } catch (error: any) {
//       api.error({
//         message: error.message || "Failed to delete configuration",
//         placement: "topRight",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleSave = async (values: any) => {
//     setIsSaving(true);
//     try {
//       const { origin, subOriginId, categoryConfigs } = values;

//       if (!origin || !subOriginId) {
//         throw new Error("Please select both Origin and Sub-Origin");
//       }

//       if (!categoryConfigs || categoryConfigs.length === 0) {
//         throw new Error("Please add at least one category configuration");
//       }

//       let successCount = 0;
//       let errorCount = 0;

//       if (editingKey) {
//         // Update existing configurations
//         for (let i = 0; i < categoryConfigs.length; i++) {
//           const config = categoryConfigs[i];
//           const categoryApprovers = categoryApproversMap[i] || [];
          
//           const approversData = categoryApprovers
//             .filter(a => a.positionId)
//             .map(a => {
//               const selectedPosition = positions.find(p => p.id === a.positionId);
//               const positionTitle = selectedPosition?.title || a.positionId;
              
//               return {
//                 level: a.level,
//                 approverType: a.employeeId ? 'specific_employee' : positionTitle,
//                 approverId: a.employeeId || a.positionId,
//               };
//             });

//           try {
//             if (config.id) {
//               await updateConfig.mutateAsync({
//                 id: config.id,
//                 data: {
//                   origin,
//                   subOrigin: subOriginId,
//                   categoryType: config.categoryType, // Send name directly
//                   amount: Number(config.amount),
//                   period: config.period,
//                   status: config.status ? "ACTIVE" : "INACTIVE",
//                   approvers: approversData,
//                 },
//               });
//               successCount++;
//             } else {
//               await createConfig.mutateAsync({
//                 origin,
//                 subOrigin: subOriginId,
//                 categoryType: config.categoryType, // Send name directly
//                 amount: Number(config.amount),
//                 period: config.period,
//                 status: config.status ? "ACTIVE" : "INACTIVE",
//                 approvers: approversData,
//               });
//               successCount++;
//             }
//           } catch (error) {
//             console.error(`Error processing config ${config.categoryType}:`, error);
//             errorCount++;
//           }
//         }
//       } else {
//         // Create new configurations
//         for (let i = 0; i < categoryConfigs.length; i++) {
//           const config = categoryConfigs[i];
//           const categoryApprovers = categoryApproversMap[i] || [];
          
//           const approversData = categoryApprovers
//             .filter(a => a.positionId)
//             .map(a => {
//               const selectedPosition = positions.find(p => p.id === a.positionId);
//               const positionTitle = selectedPosition?.title || a.positionId;
              
//               return {
//                 level: a.level,
//                 approverType: a.employeeId ? 'specific_employee' : positionTitle,
//                 approverId: a.employeeId || a.positionId,
//               };
//             });

//           try {
//             await createConfig.mutateAsync({
//               origin,
//               subOrigin: subOriginId,
//               categoryType: config.categoryType, // Send name directly
//               amount: Number(config.amount),
//               period: config.period,
//               status: config.status ? "ACTIVE" : "INACTIVE",
//               approvers: approversData,
//             });
//             successCount++;
//           } catch (error) {
//             console.error(`Error creating config ${config.categoryType}:`, error);
//             errorCount++;
//           }
//         }
//       }

//       setIsDrawerVisible(false);
//       form.resetFields();
//       setEditingKey(null);
//       setCategoryApproversMap({});
      
//       await refetch();
      
//     } catch (error: any) {
//       console.error("Save error:", error);
//       api.error({
//         message: error.message || "Failed to save",
//         placement: "topRight",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const filterOption = (input: string, option?: { label: string; value: string }) => {
//     if (!option) return false;
//     return option.label.toLowerCase().includes(input.toLowerCase());
//   };

//   const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
//   const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

//   const filteredData = useMemo(() => {
//     return dataSource.filter(
//       (item) =>
//         item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.categoryType?.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [dataSource, searchText]);

//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       api.success({
//         message: "Data refreshed",
//         placement: "topRight",
//       });
//     } catch (error) {
//       api.error({
//         message: "Failed to refresh",
//         placement: "topRight",
//       });
//     }
//   };

//   const handleCloseDrawer = () => {
//     if (isSaving) return;
//     setIsDrawerVisible(false);
//     form.resetFields();
//     setEditingKey(null);
//     setCategoryApproversMap({});
//   };

//   return (
//     <ProtectedRoute>
//       {contextHolder}
//       <div style={{ padding: 20 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 16,
//           }}
//         >
//           <div>
//             <Space align="center" size={8}>
//               <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Reimbursement Configuration
//               </Title>
//             </Space>
//           </div>

//           <Space size={8}>
//             <Tooltip title="Refresh">
//               <Button 
//                 size="small"
//                 icon={<ReloadOutlined />} 
//                 onClick={handleRefresh}
//                 loading={isLoading}
//               />
//             </Tooltip>
//             <Input.Search
//               placeholder="Search..."
//               allowClear
//               size="small"
//               style={{ width: 200 }}
//               onChange={(e) => setSearchText(e.target.value)}
//             />
//             <Button
//               type="primary"
//               size="small"
//               icon={<PlusOutlined />}
//               onClick={() => {
//                 setEditingKey(null);
//                 form.resetFields();
//                 setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//                 setIsDrawerVisible(true);
//               }}
//             >
//               Add configuration
//             </Button>
//           </Space>
//         </div>

//         <div style={{ marginBottom: 12 }}>
//           <Space size={8}>
//             <Tag color="processing">Total: {dataSource.length}</Tag>
//             <Tag color="success">Active: {activeConfigs.length}</Tag>
//             <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           size="small"
//           pagination={{
//             pageSize: 10,
//             size: "small",
//             showTotal: (total) => `Total ${total}`,
//           }}
//           loading={isLoading}
//           rowKey="id"
//           bordered
//         />

//         <Drawer
//           title={
//             <Space size={4}>
//               <WalletOutlined style={{ fontSize: 14 }} />
//               <span style={{ fontSize: 14 }}>
//                 {editingKey ? "Edit Configuration" : "Add Configuration"}
//               </span>
//             </Space>
//           }
//           placement="right"
//           width={600}
//           onClose={handleCloseDrawer}
//           open={isDrawerVisible}
//           destroyOnClose
//           headerStyle={{ padding: '12px 16px' }}
//           bodyStyle={{ padding: '16px' }}
//           extra={
//             <Space size={4}>
//               <Button size="small" onClick={handleCloseDrawer} icon={<CloseOutlined />} disabled={isSaving}>
//                 Cancel
//               </Button>
//               <Button 
//                 size="small"
//                 type="primary" 
//                 onClick={() => form.submit()} 
//                 loading={isSaving}
//               >
//                 {editingKey ? "Update" : "Create"}
//               </Button>
//             </Space>
//           }
//         >
//           <Form 
//             form={form} 
//             layout="vertical" 
//             onFinish={handleSave}
//             size="small"
//           >
//             <Card 
//               size="small"
//               style={{ marginBottom: 12, background: '#f5f5f5' }}
//               bodyStyle={{ padding: '12px' }}
//             >
//               <Row gutter={8}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="origin"
//                     label={<span style={{ fontSize: 12 }}>Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!!editingKey}
//                       onChange={() => {
//                         form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
//                         setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
//                       }}
//                     >
//                       <Option value="Grade">Grade</Option>
//                       <Option value="Department">Department</Option>
//                       <Option value="Sub-department">Sub-dept</Option>
//                       <Option value="Position">Position</Option>
//                       <Option value="User">User</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     name="subOriginId"
//                     label={<span style={{ fontSize: 12 }}>Sub-Origin</span>}
//                     rules={[{ required: true, message: "Required" }]}
//                     style={{ marginBottom: 8 }}
//                   >
//                     <Select
//                       size="small"
//                       placeholder="Select"
//                       disabled={!originType || !!editingKey}
//                       loading={getSubOriginLoading()}
//                       showSearch
//                       filterOption={filterOption}
//                       options={getSubOriginOptions()}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>
              
//               {originType && subOriginId && (
//                 <div style={{ 
//                   marginTop: 4, 
//                   padding: 4, 
//                   background: '#e6f7ff', 
//                   borderRadius: 4,
//                   border: '1px solid #91d5ff',
//                   fontSize: 12
//                 }}>
//                   <Text strong style={{ fontSize: 11 }}>Selected: </Text>
//                   <Tag color="blue" style={{ fontSize: 10 }}>{originType}</Tag>
//                   <Tag color="green" style={{ fontSize: 10 }}>
//                     {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
//                   </Tag>
//                 </div>
//               )}
//             </Card>

//             <Form.List name="categoryConfigs" initialValue={[{}]}>
//               {(fields, { add, remove }) => (
//                 <CompactCategoryConfigListContent
//                   fields={fields}
//                   add={add}
//                   remove={remove}
//                   categoryConfigs={categoryConfigs}
//                   editingKey={editingKey}
//                   categoryOptions={categoryOptions}
//                   categoryApproversMap={categoryApproversMap}
//                   onCategoryApproversChange={handleCategoryApproversChange}
//                   positions={positions}
//                   positionsLoading={positionsLoading}
//                 />
//               )}
//             </Form.List>
//           </Form>
//         </Drawer>
//       </div>
//     </ProtectedRoute>
//   );
// }woeking approve type 












"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Drawer,
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
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
  UserOutlined,
  ReloadOutlined,
  CloseOutlined,
  InfoCircleOutlined 
} from "@ant-design/icons";
import { useGrades } from "@/hooks/useGrades";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions } from "@/hooks/usePositions";
import { MembersService } from "@/services/membersService";
import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
import {
  useReimbursementConfigurations,
  useCreateReimbursementConfiguration,
  useUpdateReimbursementConfiguration,
  useDeleteReimbursementConfiguration,
} from "@/hooks/usereimbursementconfig";

const { Text, Title } = Typography;
const { Option } = Select;

interface ReimbursementRecord {
  key: string;
  id: string;
  origin: string;
  subOrigin: string;
  subOriginId: string;
  categoryType: string;
  amount: number;
  period: "MONTH" | "YEAR";
  status: string;
  monthlyAmount?: number;
  yearlyAmount?: number;
  policyId?: string;
  ruleId?: string;
  approvers?: any[];
}

interface SubOriginOption {
  id: string;
  name: string;
  originType: string;
}

interface ApproverRow {
  level: number;
  positionId: string;
  employeeId?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  code: string;
}

const compactSwitchCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 8px",
  border: "1px solid #f0f0f0",
  borderRadius: 6,
  marginBottom: 8,
  background: "#fafafa",
};

const switchTitle = {
  fontSize: 13,
  fontWeight: 500,
};

const switchDesc = {
  fontSize: 11,
  color: "#8c8c8c",
  marginTop: 1,
};

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

// const CompactApprovalLevelsContent = ({
//   value = [],
//   onChange,
//   positions,
//   positionsLoading,
//   onEmployeesFetched,
// }: {
//   value?: ApproverRow[];
//   onChange?: (value: ApproverRow[]) => void;
//   positions: any[];
//   positionsLoading: boolean;
//   onEmployeesFetched?: (positionId: string, employees: any[]) => void;
// }) => {
//   const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
//   const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});

//   const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
//     if (!positionId) return;
    
//     try {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
      
//       console.log("========== EMPLOYEE FETCH START ==========");
//       console.log("🔍 Position ID received:", positionId);
      
//       const selectedPosition = positions.find(p => p.id === positionId);
//       const positionName = selectedPosition?.title;
//       console.log("🔍 Position name:", positionName);
      
//       if (!positionName) {
//         console.log("❌ Position name not found");
//         return;
//       }
      
//       const members = await MembersService.getMembersForSelect({ 
//         position: positionName
//       });
      
//       console.log("🔍 Members received:", members);
      
//       setEmployeesByPosition(prev => ({ 
//         ...prev, 
//         [positionId]: members 
//       }));

//       // Call the callback to update parent component
//       if (onEmployeesFetched) {
//         onEmployeesFetched(positionId, members);
//       }
      
//     } catch (error) {
//       console.error("❌ ERROR:", error);
//     } finally {
//       setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
//     }
//   };

//   useEffect(() => {
//     console.log("📊 employeesByPosition state updated:", employeesByPosition);
    
//     Object.keys(employeesByPosition).forEach(positionId => {
//       const employees = employeesByPosition[positionId];
//       console.log(`📊 Position ${positionId}: ${employees?.length || 0} employees`);
//     });
//   }, [employeesByPosition]);

//   const addApproverRow = () => {
//     const newRow: ApproverRow = {
//       level: (value?.length || 0) + 1,
//       positionId: '',
//       employeeId: null,
//     };
//     onChange?.([...(value || []), newRow]);
//   };

//   const removeApproverRow = (index: number) => {
//     const newRows = [...(value || [])];
//     newRows.splice(index, 1);
//     const reorderedRows = newRows.map((row, idx) => ({
//       ...row,
//       level: idx + 1,
//     }));
//     onChange?.(reorderedRows);
//   };

//   const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
//     const newRows = [...(value || [])];
//     newRows[index] = { ...newRows[index], [field]: fieldValue };
    
//     if (field === 'positionId') {
//       newRows[index].employeeId = null;
//       fetchEmployeesForPosition(fieldValue, index);
//     }
    
//     onChange?.(newRows);
//   };

//   return (
//     <div style={{ marginTop: 12 }}>



//         <div style={{ 
//         marginBottom: 12, 
//         padding: '8px 12px', 
//         background: '#e6f7ff', 
//         border: '1px solid #91d5ff',
//         borderRadius: 6,
//         fontSize: 12
//       }}>
//         <Space align="center" size={8}>
//           <InfoCircleOutlined style={{ color: '#1890ff' }} />
//           <Text style={{ fontSize: 12 }}>
//             <Text strong style={{ color: '#1890ff' }}>Level 1 Approval:</Text> Always the employee's reporting manager
//           </Text>
//         </Space>
//       </div>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//         <Space size={4}>
//           <UserOutlined style={{ color: '#1677ff', fontSize: 14 }} />
//           <Title level={5} style={{ margin: 0, fontSize: 14 }}>Approval Workflow</Title>
//         </Space>
//         <Tag color="processing" style={{ fontSize: 11 }}>{value?.length || 0} Level(s)</Tag>
//       </div>
      
//       {(value || []).map((row, index) => (
//         <Card 
//           key={index} 
//           size="small" 
//           style={{ 
//             marginBottom: 8, 
//             background: '#fafafa',
//             borderLeft: '3px solid #1677ff',
//             fontSize: 12
//           }}
//           bodyStyle={{ padding: '8px' }}
//         >
//           <Row gutter={8} align="middle">
//             <Col span={3}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <InputNumber
//                   size="small"
//                   min={1}
//                   max={10}
//                   value={row.level}
//                   onChange={(val) => updateApproverRow(index, 'level', val)}
//                   style={{ width: '100%' }}
//                   placeholder="Lvl"
//                 />
//               </Form.Item>
//             </Col>
            
//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Position"
//                   value={row.positionId}
//                   onChange={(val) => updateApproverRow(index, 'positionId', val)}
//                   style={{ width: '100%' }}
//                   loading={positionsLoading}
//                   showSearch
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={positions.map(pos => ({
//                     label: pos.title,
//                     value: pos.id,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={9}>
//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Select
//                   size="small"
//                   placeholder="Employee"
//                   value={row.employeeId}
//                   onChange={(val) => updateApproverRow(index, 'employeeId', val)}
//                   style={{ width: '100%' }}
//                   showSearch
//                   loading={loadingEmployees[index]}
//                   disabled={!row.positionId}
//                   allowClear
//                   notFoundContent={loadingEmployees[index] ? "Loading..." : "No employees found"}
//                   filterOption={(input, option) => 
//                     (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
//                   }
//                   options={(() => {
//                     console.log(`🔍 Row ${index} - Position ID:`, row.positionId);
//                     console.log(`🔍 Row ${index} - Employees for this position:`, employeesByPosition[row.positionId]);
                    
//                     if (!row.positionId) return [];
                    
//                     const employees = employeesByPosition[row.positionId] || [];
                    
//                     return employees.map(emp => ({
//                       label: emp.label,
//                       value: emp.value,
//                       email: emp.email
//                     }));
//                   })()}
//                 />
//                 {row.positionId && employeesByPosition[row.positionId]?.length === 0 && !loadingEmployees[index] && (
//                   <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
//                     No employees with this position
//                   </div>
//                 )}
//               </Form.Item>
//             </Col>

//             <Col span={3} style={{ textAlign: 'right' }}>
//               <Tooltip title="Remove">
//                 <Button 
//                   danger 
//                   size="small"
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeApproverRow(index)}
//                   disabled={(value?.length || 0) <= 1}
//                 />
//               </Tooltip>
//             </Col>
//           </Row>
//         </Card>
//       ))}

//       <Button 
//         type="dashed" 
//         size="small"
//         block 
//         onClick={addApproverRow}
//         icon={<PlusOutlined />}
//         style={{ marginTop: 4, fontSize: 12 }}
//       >
//         Add Level
//       </Button>
//     </div>
//   );
// };
const CompactApprovalLevelsContent = ({
  value = [],
  onChange,
  positions,
  positionsLoading,
  onEmployeesFetched,
}: {
  value?: ApproverRow[];
  onChange?: (value: ApproverRow[]) => void;
  positions: any[];
  positionsLoading: boolean;
  onEmployeesFetched?: (positionId: string, employees: any[]) => void;
}) => {
  const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
  const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});

  const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
    if (!positionId) return;
    
    try {
      setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
      
      console.log("========== EMPLOYEE FETCH START ==========");
      console.log("🔍 Position ID received:", positionId);
      
      const selectedPosition = positions.find(p => p.id === positionId);
      const positionName = selectedPosition?.title;
      console.log("🔍 Position name:", positionName);
      
      if (!positionName) {
        console.log("❌ Position name not found");
        return;
      }
      
      const members = await MembersService.getMembersForSelect({ 
        position: positionName
      });
      
      console.log("🔍 Members received:", members);
      
      setEmployeesByPosition(prev => ({ 
        ...prev, 
        [positionId]: members 
      }));

      // Call the callback to update parent component
      if (onEmployeesFetched) {
        onEmployeesFetched(positionId, members);
      }
      
    } catch (error) {
      console.error("❌ ERROR:", error);
    } finally {
      setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
    }
  };

  useEffect(() => {
    console.log("📊 employeesByPosition state updated:", employeesByPosition);
    
    Object.keys(employeesByPosition).forEach(positionId => {
      const employees = employeesByPosition[positionId];
      console.log(`📊 Position ${positionId}: ${employees?.length || 0} employees`);
    });
  }, [employeesByPosition]);

  const addApproverRow = () => {
    const newRow: ApproverRow = {
      level: (value?.length || 0) + 1,
      positionId: '',
      employeeId: null,
    };
    onChange?.([...(value || []), newRow]);
  };

  const removeApproverRow = (index: number) => {
    const newRows = [...(value || [])];
    newRows.splice(index, 1);
    const reorderedRows = newRows.map((row, idx) => ({
      ...row,
      level: idx + 1,
    }));
    onChange?.(reorderedRows);
  };

  const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
    const newRows = [...(value || [])];
    newRows[index] = { ...newRows[index], [field]: fieldValue };
    
    if (field === 'positionId') {
      newRows[index].employeeId = null;
      fetchEmployeesForPosition(fieldValue, index);
    }
    
    onChange?.(newRows);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ 
        marginBottom: 12, 
        padding: '8px 12px', 
        background: '#e6f7ff', 
        border: '1px solid #91d5ff',
        borderRadius: 6,
        fontSize: 12
      }}>
        <Space align="center" size={8}>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: 12 }}>
            <Text strong style={{ color: '#1890ff' }}>Level 1 Approval:</Text> Always the employee's reporting manager
          </Text>
        </Space>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space size={4}>
          <UserOutlined style={{ color: '#1677ff', fontSize: 14 }} />
          <Title level={5} style={{ margin: 0, fontSize: 14 }}>Approval Workflow</Title>
        </Space>
        <Tag color="processing" style={{ fontSize: 11 }}>{value?.length || 0} Level(s)</Tag>
      </div>
      
      {(value || []).map((row, index) => {
        // Level 1 should be disabled, Level 2+ should be enabled
        const isLevelOne = row.level === 1;
        
        return (
          <Card 
            key={index} 
            size="small" 
            style={{ 
              marginBottom: 8, 
              background: isLevelOne ? '#f5f5f5' : '#fafafa',
              borderLeft: isLevelOne ? '3px solid #d9d9d9' : '3px solid #1677ff',
              fontSize: 12,
              opacity: isLevelOne ? 0.8 : 1
            }}
            bodyStyle={{ padding: '8px' }}
          >
            <Row gutter={8} align="middle">
              <Col span={3}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <InputNumber
                    size="small"
                    min={1}
                    max={10}
                    value={row.level}
                    disabled={isLevelOne} // Disable only Level 1
                    onChange={(val) => updateApproverRow(index, 'level', val)}
                    style={{ 
                      width: '100%',
                      backgroundColor: isLevelOne ? '#f5f5f5' : '#ffffff'
                    }}
                    placeholder="Lvl"
                  />
                </Form.Item>
              </Col>
              
              <Col span={9}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Select
                    size="small"
                    placeholder="Position"
                    value={row.positionId}
                    disabled={isLevelOne} // Disable only Level 1
                    onChange={(val) => updateApproverRow(index, 'positionId', val)}
                    style={{ width: '100%' }}
                    loading={positionsLoading}
                    showSearch
                    filterOption={(input, option) => 
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={positions.map(pos => ({
                      label: pos.title,
                      value: pos.id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col span={9}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Select
                    size="small"
                    placeholder="Employee"
                    value={row.employeeId}
                    disabled={isLevelOne || !row.positionId} // Disable only Level 1
                    onChange={(val) => updateApproverRow(index, 'employeeId', val)}
                    style={{ width: '100%' }}
                    showSearch
                    loading={loadingEmployees[index]}
                    allowClear
                    notFoundContent={loadingEmployees[index] ? "Loading..." : "No employees found"}
                    filterOption={(input, option) => 
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={(() => {
                      console.log(`🔍 Row ${index} - Position ID:`, row.positionId);
                      console.log(`🔍 Row ${index} - Employees for this position:`, employeesByPosition[row.positionId]);
                      
                      if (!row.positionId) return [];
                      
                      const employees = employeesByPosition[row.positionId] || [];
                      
                      return employees.map(emp => ({
                        label: emp.label,
                        value: emp.value,
                        email: emp.email
                      }));
                    })()}
                  />
                  {row.positionId && employeesByPosition[row.positionId]?.length === 0 && !loadingEmployees[index] && !isLevelOne && (
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                      No employees with this position
                    </div>
                  )}
                </Form.Item>
              </Col>

              <Col span={3} style={{ textAlign: 'right' }}>
                <Tooltip title={isLevelOne ? "Level 1 cannot be removed" : "Remove"}>
                  <Button 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeApproverRow(index)}
                    disabled={(value?.length || 0) <= 1 || isLevelOne} // Disable remove for Level 1
                  />
                </Tooltip>
              </Col>
            </Row>
            
            {/* Optional: Add a small indicator for Level 1 */}
            {isLevelOne && (
              <div style={{ 
                marginTop: 4, 
                fontSize: 10, 
                color: '#8c8c8c',
                fontStyle: 'italic'
              }}>
                {/* ⓘ Level 1 is automatically assigned to reporting manager */}
              </div>
            )}
          </Card>
        );
      })}

      <Button 
        type="dashed" 
        size="small"
        block 
        onClick={addApproverRow}
        icon={<PlusOutlined />}
        style={{ marginTop: 4, fontSize: 12 }}
      >
        Add Level
      </Button>
    </div>
  );
};
const CompactCategoryConfigListContent = ({
  fields,
  add,
  remove,
  categoryConfigs,
  editingKey,
  categoryOptions,
  categoryApproversMap,
  onCategoryApproversChange,
  positions,
  positionsLoading,
  onEmployeesFetched,
}: {
  fields: any[];
  add: () => void;
  remove: (index: number | number[]) => void;
  categoryConfigs: any[];
  editingKey: string | null;
  categoryOptions: CategoryOption[];
  categoryApproversMap: Record<number, ApproverRow[]>;
  onCategoryApproversChange: (index: number, approvers: ApproverRow[]) => void;
  positions: any[];
  positionsLoading: boolean;
  onEmployeesFetched?: (positionId: string, employees: any[]) => void;
}) => {
  const [activeKey, setActiveKey] = useState<
    string | string[] | number | number[]
  >(fields.length > 0 ? fields[0].key : []);
  
  const prevFieldsLength = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevFieldsLength.current) {
      const lastField = fields[fields.length - 1];
      setActiveKey(lastField.key);
      
      const newIndex = fields.length - 1;
      const defaultApprovers = [{ level: 1, positionId: '', employeeId: null }];
      
      onCategoryApproversChange(newIndex, defaultApprovers);
    }
    prevFieldsLength.current = fields.length;
  }, [fields.length, onCategoryApproversChange]);

  const getSelectedCategoryNames = (currentIndex: number) => {
    return (categoryConfigs || [])
      .filter((_: any, index: number) => index !== currentIndex)
      .map((item: any) => item?.categoryType)
      .filter(Boolean);
  };

  const getCurrentApprovers = (index: number) => {
    return categoryApproversMap[index] || [{ level: 1, positionId: '', employeeId: null }];
  };

  return (
    <Card 
      size="small"
      style={{ 
        marginBottom: 12,
        border: '1px solid #f0f0f0',
        borderRadius: 6
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14 }}>Category Configurations</Title>
      
      <Collapse
        accordion
        size="small"
        activeKey={activeKey}
        onChange={setActiveKey}
        items={fields.map(({ key, name, ...restField }, index) => {
          const selectedCategoryNames = getSelectedCategoryNames(name);
          const currentCategoryType = categoryConfigs?.[name]?.categoryType;
          const currentAmount = categoryConfigs?.[name]?.amount;
          const currentPeriod = categoryConfigs?.[name]?.period;
          const currentApprovers = getCurrentApprovers(index);

          const previewAmounts =
            currentAmount && currentPeriod
              ? calculateAmounts(currentAmount, currentPeriod)
              : null;

          const filteredCategoryOptions = categoryOptions.filter(
            option => !selectedCategoryNames.includes(option.name)
          );

          return {
            key: key,
            label: (
              <Space size={4}>
                <Tag color="blue" style={{ fontSize: 11 }}>
                  {currentCategoryType || 'New Category'}
                </Tag>
                {currentApprovers.length > 0 && (
                  <Tag color="purple" style={{ fontSize: 10 }}>
                    {currentApprovers.length} Approver(s)
                  </Tag>
                )}
              </Space>
            ),
            extra:
              fields.length > 1 ? (
                <Popconfirm
                  title="Delete?"
                  onConfirm={() => remove(name)}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <DeleteOutlined
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "red", fontSize: 12 }}
                  />
                </Popconfirm>
              ) : null,
            children: (
              <div style={{ padding: '4px 0' }}>
                <Form.Item name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[name, "policyId"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[name, "ruleId"]} hidden>
                  <Input />
                </Form.Item>

                <Row gutter={8}>
                  <Col span={24}>
                    <Form.Item
                      {...restField}
                      name={[name, "categoryType"]}
                      label={<span style={{ fontSize: 12 }}>Category Type</span>}
                      rules={[{ required: true, message: "Required" }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        size="small"
                        placeholder="Select"
                        style={{ width: "100%" }}
                        showSearch
                        filterOption={(input, option) => 
                          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {filteredCategoryOptions.map((opt) => (
                          <Option key={opt.id} value={opt.name} label={opt.name}>
                            {opt.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "amount"]}
                      label={<span style={{ fontSize: 12 }}>Amount</span>}
                      rules={[{ required: true, message: "Required" }]}
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber
                        size="small"
                        min={0}
                        precision={2}
                        style={{ width: "100%" }}
                        placeholder="Amount"
                        prefix="₹"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "period"]}
                      label={<span style={{ fontSize: 12 }}>Period</span>}
                      rules={[{ required: true, message: "Required" }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Select size="small" placeholder="Period">
                        <Option value="MONTH">Month</Option>
                        <Option value="YEAR">Year</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={24}>
                    <div style={{ ...compactSwitchCard, marginTop: 0 }}>
                      <div>
                        <div style={switchTitle}>Active</div>
                        <div style={switchDesc}>Enable this category</div>
                      </div>
                      <Form.Item
                        {...restField}
                        name={[name, "status"]}
                        valuePropName="checked"
                        initialValue={true}
                        noStyle
                      >
                        <Switch size="small" />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>

                {previewAmounts && (
                  <Card
                    size="small"
                    style={{
                      background: "#f6f9fc",
                      marginTop: 8,
                      border: "1px solid #91d5ff",
                      borderRadius: 4,
                    }}
                    bodyStyle={{ padding: '6px' }}
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Monthly:</Text>
                        <div>
                          <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
                            ₹{previewAmounts.monthly.toFixed(2)}
                          </Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Yearly:</Text>
                        <div>
                          <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
                            ₹{previewAmounts.yearly.toFixed(2)}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                <Divider style={{ margin: '12px 0 8px 0' }} />

                <CompactApprovalLevelsContent 
                  value={currentApprovers}
                  onChange={(newApprovers) => onCategoryApproversChange(index, newApprovers)}
                  positions={positions}
                  positionsLoading={positionsLoading}
                  onEmployeesFetched={onEmployeesFetched}
                />
              </div>
            ),
          };
        })}
      />

      <Button 
        type="dashed" 
        size="small"
        block 
        onClick={() => add()} 
        style={{ marginTop: 8, fontSize: 12 }}
        icon={<PlusOutlined />}
      >
        Add Category
      </Button>
    </Card>
  );
};

export default function ReimbursementConfigurationPage() {
  const { user } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const originType = Form.useWatch("origin", form);
  const subOriginId = Form.useWatch("subOriginId", form);
  const categoryConfigs = Form.useWatch("categoryConfigs", form);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [members, setMembers] = useState<SubOriginOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [globalEmployeesByPosition, setGlobalEmployeesByPosition] = useState<Record<string, any[]>>({});
  
  const [categoryApproversMap, setCategoryApproversMap] = useState<Record<number, ApproverRow[]>>({});

  const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
  const createConfig = useCreateReimbursementConfiguration();
  const updateConfig = useUpdateReimbursementConfiguration();
  const deleteConfig = useDeleteReimbursementConfiguration();

  const { allGrades: grades = [], loading: gradesLoading } = useGrades();
  const { allDepartments: departments = [], loading: departmentsLoading } = useDepartments();
  const { allSubDepartments: subDepartments = [], loading: subDepartmentsLoading } = useSubDepartments();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  useEffect(() => {
    const fetchCategoryOptions = async () => {
      try {
        const settings = await ReimbursementSettingsService.getSettings();
        const activeSettings = settings.filter((s) => s.isActive);
        const options = activeSettings.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }));
        setCategoryOptions(options);
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
        const formattedMembers = memberData.map((m: any) => ({
          id: m.value,
          name: m.label,
          originType: "User",
        }));
        setMembers(formattedMembers);
      } catch (error) {
        console.error("Failed to fetch members for select:", error);
      }
    };
    fetchMembersForSelect();
  }, []);

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

  const getSubOriginLabel = (origin: string, subOriginId: string) => {
    if (origin === "User") return membersMap[subOriginId] || subOriginId;
    if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
    if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
    if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
    if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
    return subOriginId;
  };

  const dataSource: ReimbursementRecord[] = useMemo(() => {
    if (!configs) return [];
    return configs.map((config) => {
      const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
      const amount = Number(config.amount) || 0;
      
      return {
        key: config.id,
        id: config.id,
        origin: config.origin,
        subOrigin: subOriginLabel,
        subOriginId: config.subOrigin,
        categoryType: config.categoryType,
        amount: amount,
        period: config.period,
        status: config.status,
        monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
        yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
        policyId: config.policyId,
        ruleId: config.ruleId,
        approvers: config.approvers,
      };
    });
  }, [configs, getSubOriginLabel]);

  const getSubOriginOptions = () => {
    if (!originType) return [];
    switch (originType) {
      case "User": return members.map((m) => ({ label: m.name, value: m.id }));
      case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
      case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
      case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
      case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
      default: return [];
    }
  };

  const getSubOriginLoading = () => {
    switch (originType) {
      case "Grade": return gradesLoading;
      case "Department": return departmentsLoading;
      case "Sub-department": return subDepartmentsLoading;
      case "Position": return positionsLoading;
      default: return false;
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

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
      render: (text: string) => (
        <Tag color="blue">{capitalizeFirstLetter(text)}</Tag>
      ),
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      align: "center",
      render: (period: string) => (
        <Tag color={period === "MONTH" ? "green" : "orange"}>
          {period === "MONTH" ? "Month" : "Year"}
        </Tag>
      ),
    },
    {
      title: "Monthly",
      key: "monthlyAmount",
      align: "center",
      render: (_: any, record: ReimbursementRecord) => {
        const amounts = calculateAmounts(record.amount, record.period);
        return <Text>₹{amounts.monthly.toFixed(2)}</Text>;
      },
    },
    {
      title: "Yearly",
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
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this configuration?"
              onConfirm={() => handleDelete(record.id)}
              okButtonProps={{ loading: deletingId === record.id }}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!!deletingId}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleCategoryApproversChange = useCallback((index: number, approvers: ApproverRow[]) => {
    setCategoryApproversMap(prev => ({
      ...prev,
      [index]: approvers
    }));
  }, []);

  const handleEmployeesFetched = useCallback((positionId: string, employees: any[]) => {
    setGlobalEmployeesByPosition(prev => ({
      ...prev,
      [positionId]: employees
    }));
  }, []);

  const handleEdit = (record: ReimbursementRecord) => {
    setEditingKey(record.id);
    
    const selectedConfig = dataSource.find(item => item.id === record.id);
    
    if (!selectedConfig) return;

    const configsForForm = [{
      id: selectedConfig.id,
      policyId: selectedConfig.policyId,
      ruleId: selectedConfig.ruleId,
      categoryType: selectedConfig.categoryType,
      amount: selectedConfig.amount,
      period: selectedConfig.period,
      status: selectedConfig.status === "ACTIVE",
    }];

    form.setFieldsValue({
      origin: selectedConfig.origin,
      subOriginId: selectedConfig.subOriginId,
      categoryConfigs: configsForForm,
    });

    if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
      const mappedApprovers = selectedConfig.approvers.map((a: any) => {
        console.log('Approver data:', a);
        
        const isEmployeeName = a.approverType !== 'specific_employee' && 
                              !positions.some(p => p.title === a.approverType);
        
        if (isEmployeeName) {
          return {
            level: a.level,
            positionId: '',
            employeeId: a.approverId,
          };
        } else if (a.approverType === 'specific_employee') {
          return {
            level: a.level,
            positionId: '',
            employeeId: a.approverId,
          };
        } else {
          const position = positions.find(p => p.title === a.approverType);
          return {
            level: a.level,
            positionId: position?.id || a.approverId,
            employeeId: null,
          };
        }
      });
      
      setCategoryApproversMap({ 0: mappedApprovers });
    } else {
      setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
    }

    setIsDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteConfig.mutateAsync(id);
      api.success({
        message: "Configuration deleted successfully",
        placement: "topRight",
      });
      await refetch();
    } catch (error: any) {
      api.error({
        message: error.message || "Failed to delete configuration",
        placement: "topRight",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (values: any) => {
    setIsSaving(true);
    try {
      const { origin, subOriginId, categoryConfigs } = values;

      if (!origin || !subOriginId) {
        throw new Error("Please select both Origin and Sub-Origin");
      }

      if (!categoryConfigs || categoryConfigs.length === 0) {
        throw new Error("Please add at least one category configuration");
      }

      let successCount = 0;
      let errorCount = 0;

      if (editingKey) {
        for (let i = 0; i < categoryConfigs.length; i++) {
          const config = categoryConfigs[i];
          const categoryApprovers = categoryApproversMap[i] || [];
          
          const approversData = categoryApprovers
            .filter(a => a.positionId)
            .map(a => {
              const selectedPosition = positions.find(p => p.id === a.positionId);
              const positionTitle = selectedPosition?.title || a.positionId;
              
              if (a.employeeId) {
                const employees = globalEmployeesByPosition[a.positionId] || [];
                const selectedEmployee = employees.find(emp => emp.value === a.employeeId);
                
                return {
                  level: a.level,
                  approverType: selectedEmployee?.label || 'specific_employee',
                  approverId: a.employeeId,
                };
              } else {
                return {
                  level: a.level,
                  approverType: positionTitle,
                  approverId: a.positionId,
                };
              }
            });

          try {
            if (config.id) {
              await updateConfig.mutateAsync({
                id: config.id,
                data: {
                  origin,
                  subOrigin: subOriginId,
                  categoryType: config.categoryType,
                  amount: Number(config.amount),
                  period: config.period,
                  status: config.status ? "ACTIVE" : "INACTIVE",
                  approvers: approversData,
                },
              });
              successCount++;
            } else {
              await createConfig.mutateAsync({
                origin,
                subOrigin: subOriginId,
                categoryType: config.categoryType,
                amount: Number(config.amount),
                period: config.period,
                status: config.status ? "ACTIVE" : "INACTIVE",
                approvers: approversData,
              });
              successCount++;
            }
          } catch (error) {
            console.error(`Error processing config ${config.categoryType}:`, error);
            errorCount++;
          }
        }
      } else {
        for (let i = 0; i < categoryConfigs.length; i++) {
          const config = categoryConfigs[i];
          const categoryApprovers = categoryApproversMap[i] || [];
          
          const approversData = categoryApprovers
            .filter(a => a.positionId)
            .map(a => {
              const selectedPosition = positions.find(p => p.id === a.positionId);
              const positionTitle = selectedPosition?.title || a.positionId;
              
              if (a.employeeId) {
                const employees = globalEmployeesByPosition[a.positionId] || [];
                const selectedEmployee = employees.find(emp => emp.value === a.employeeId);
                
                return {
                  level: a.level,
                  approverType: selectedEmployee?.label || 'specific_employee',
                  approverId: a.employeeId,
                };
              } else {
                return {
                  level: a.level,
                  approverType: positionTitle,
                  approverId: a.positionId,
                };
              }
            });

          try {
            await createConfig.mutateAsync({
              origin,
              subOrigin: subOriginId,
              categoryType: config.categoryType,
              amount: Number(config.amount),
              period: config.period,
              status: config.status ? "ACTIVE" : "INACTIVE",
              approvers: approversData,
            });
            successCount++;
          } catch (error) {
            console.error(`Error creating config ${config.categoryType}:`, error);
            errorCount++;
          }
        }
      }

      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
      setCategoryApproversMap({});
      
      await refetch();
      
    } catch (error: any) {
      console.error("Save error:", error);
      api.error({
        message: error.message || "Failed to save",
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) return false;
    return option.label.toLowerCase().includes(input.toLowerCase());
  };

  const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
  const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

  const filteredData = useMemo(() => {
    return dataSource.filter(
      (item) =>
        item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.categoryType?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [dataSource, searchText]);

  const handleRefresh = async () => {
    try {
      await refetch();
      api.success({
        message: "Data refreshed",
        placement: "topRight",
      });
    } catch (error) {
      api.error({
        message: "Failed to refresh",
        placement: "topRight",
      });
    }
  };

  const handleCloseDrawer = () => {
    if (isSaving) return;
    setIsDrawerVisible(false);
    form.resetFields();
    setEditingKey(null);
    setCategoryApproversMap({});
  };

  return (
    <ProtectedRoute>
      {contextHolder}
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <Space align="center" size={8}>
              <WalletOutlined style={{ fontSize: "20px", color: "#1677ff" }} />
              <Title level={4} style={{ margin: 0 }}>
                Reimbursement Configuration
              </Title>
            </Space>
          </div>

          <Space size={8}>
            <Tooltip title="Refresh">
              <Button 
                size="small"
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={isLoading}
              />
            </Tooltip>
            <Input.Search
              placeholder="Search..."
              allowClear
              size="small"
              style={{ width: 200 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingKey(null);
                form.resetFields();
                setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
                setIsDrawerVisible(true);
              }}
            >
              Add configuration
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Space size={8}>
            <Tag color="processing">Total: {dataSource.length}</Tag>
            <Tag color="success">Active: {activeConfigs.length}</Tag>
            <Tag color="error">Inactive: {inactiveConfigs.length}</Tag>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          size="small"
          pagination={{
            pageSize: 10,
            size: "small",
            showTotal: (total) => `Total ${total}`,
          }}
          loading={isLoading}
          rowKey="id"
          bordered
        />

        <Drawer
          title={
            <Space size={4}>
              <WalletOutlined style={{ fontSize: 14 }} />
              <span style={{ fontSize: 14 }}>
                {editingKey ? "Edit Configuration" : "Add Configuration"}
              </span>
            </Space>
          }
          placement="right"
          width={600}
          onClose={handleCloseDrawer}
          open={isDrawerVisible}
          destroyOnClose
          headerStyle={{ padding: '12px 16px' }}
          bodyStyle={{ padding: '16px' }}
          extra={
            <Space size={4}>
              <Button size="small" onClick={handleCloseDrawer} icon={<CloseOutlined />} disabled={isSaving}>
                Cancel
              </Button>
              <Button 
                size="small"
                type="primary" 
                onClick={() => form.submit()} 
                loading={isSaving}
              >
                {editingKey ? "Update" : "Create"}
              </Button>
            </Space>
          }
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSave}
            size="small"
          >
            <Card 
              size="small"
              style={{ marginBottom: 12, background: '#f5f5f5' }}
              bodyStyle={{ padding: '12px' }}
            >
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    name="origin"
                    label={<span style={{ fontSize: 12 }}>Origin</span>}
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      size="small"
                      placeholder="Select"
                      disabled={!!editingKey}
                      onChange={() => {
                        form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
                        setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
                      }}
                    >
                      <Option value="Grade">Grade</Option>
                      <Option value="Department">Department</Option>
                      <Option value="Sub-department">Sub-dept</Option>
                      <Option value="Position">Position</Option>
                      <Option value="User">User</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="subOriginId"
                    label={<span style={{ fontSize: 12 }}>Sub-Origin</span>}
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      size="small"
                      placeholder="Select"
                      disabled={!originType || !!editingKey}
                      loading={getSubOriginLoading()}
                      showSearch
                      filterOption={filterOption}
                      options={getSubOriginOptions()}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              {originType && subOriginId && (
                <div style={{ 
                  marginTop: 4, 
                  padding: 4, 
                  background: '#e6f7ff', 
                  borderRadius: 4,
                  border: '1px solid #91d5ff',
                  fontSize: 12
                }}>
                  <Text strong style={{ fontSize: 11 }}>Selected: </Text>
                  <Tag color="blue" style={{ fontSize: 10 }}>{originType}</Tag>
                  <Tag color="green" style={{ fontSize: 10 }}>
                    {getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}
                  </Tag>
                </div>
              )}
            </Card>

            <Form.List name="categoryConfigs" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <CompactCategoryConfigListContent
                  fields={fields}
                  add={add}
                  remove={remove}
                  categoryConfigs={categoryConfigs}
                  editingKey={editingKey}
                  categoryOptions={categoryOptions}
                  categoryApproversMap={categoryApproversMap}
                  onCategoryApproversChange={handleCategoryApproversChange}
                  positions={positions}
                  positionsLoading={positionsLoading}
                  onEmployeesFetched={handleEmployeesFetched}
                />
              )}
            </Form.List>
          </Form>
        </Drawer>
      </div>
    </ProtectedRoute>
  );
}























































































































































