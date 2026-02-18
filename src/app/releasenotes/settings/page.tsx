// // "use client";

// // import { useState, useEffect } from "react";
// // import MainLayout from "@/components/layout/MainLayout";
// // import {
// //   Space,
// //   Typography,
// //   Tabs,
// //   Button,
// //   Table,
// //   Card,
// //   Tag,
// //   Input,
// //   Select,
// //   Row,
// //   Col,
// //   Popconfirm,
// //   message,
// //   Tooltip,
// //   Badge,
// //   Modal,
// //   Form,
// //   theme,
// //   Alert
// // } from "antd";
// // import {
// //   SettingOutlined,
// //   PlusOutlined,
// //   EditOutlined,
// //   DeleteOutlined,
// //   SearchOutlined,
// //   ReloadOutlined,
// //   EnvironmentOutlined,
// //   CheckCircleOutlined,
// //   StopOutlined,
// //   WarningOutlined
// // } from "@ant-design/icons";
// // import type { TabsProps } from "antd";
// // import type { ColumnsType } from "antd/es/table";
// // import { useQueryClient } from "@tanstack/react-query";

// // // Import your existing hooks
// // import {
// //   useEnviroments,
// //   useCreateEnviroment,
// //   useUpdateEnviroment,
// //   useDeleteEnviroment,
// //   enviromentKeys
// // } from "@/hooks/useenviroments";

// // const { Title, Text } = Typography;
// // const { Option } = Select;

// // // Environment Form Modal Component
// // interface EnvironmentFormProps {
// //   open: boolean;
// //   onCancel: () => void;
// //   onSubmit: (values: any) => void;
// //   initialValues?: any;
// //   title: string;
// //   loading?: boolean;
// // }

// // const EnvironmentFormModal = ({
// //   open,
// //   onCancel,
// //   onSubmit,
// //   initialValues,
// //   title,
// //   loading
// // }: EnvironmentFormProps) => {
// //   const [form] = Form.useForm();
// //   const { token } = theme.useToken();
// //   const [error, setError] = useState<string | null>(null);

// //   // Transform name to code format
// //   const transformToCode = (name: string): string => {
// //     return name
// //       .toUpperCase()
// //       .replace(/\s+/g, '_')
// //       .replace(/[^A-Z0-9_]/g, '');
// //   };

// //   // Handle name field change
// //   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const name = e.target.value;
// //     const code = transformToCode(name);
// //     form.setFieldValue('code', code);
// //     // Clear any previous code error when name changes
// //     const codeError = form.getFieldError('code');
// //     if (codeError.length > 0) {
// //       form.validateFields(['code']);
// //     }
// //   };

// //   // Handle manual code change
// //   const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const code = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
// //     form.setFieldValue('code', code);
// //   };

// //   // Reset form when modal opens/closes
// //   useEffect(() => {
// //     if (open) {
// //       setError(null);
// //       if (initialValues) {
// //         form.setFieldsValue(initialValues);
// //       } else {
// //         form.resetFields();
// //         form.setFieldsValue({ status: 'active' });
// //       }
// //     }
// //   }, [open, initialValues, form]);

// //   const handleSubmit = async (values: any) => {
// //     try {
// //       setError(null);
// //       await onSubmit(values);
// //     } catch (err: any) {
// //       // Handle duplicate code error specifically
// //       if (err?.response?.data?.error?.includes('code already exists')) {
// //         setError('This environment code already exists. Please use a different code.');
// //         form.setFields([
// //           {
// //             name: 'code',
// //             errors: ['Code already exists']
// //           }
// //         ]);
// //       } else {
// //         setError(err?.response?.data?.error || 'Failed to save environment');
// //       }
// //     }
// //   };

// //   return (
// //     <Modal
// //       title={
// //         <Space>
// //           <EnvironmentOutlined style={{ color: token.colorPrimary }} />
// //           <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>
// //         </Space>
// //       }
// //       open={open}
// //       onCancel={onCancel}
// //       onOk={() => form.submit()}
// //       okText={initialValues ? "Update" : "Create"}
// //       cancelText="Cancel"
// //       width={520}
// //       confirmLoading={loading}
// //       styles={{
// //         body: { paddingTop: 24, paddingBottom: 8 }
// //       }}
// //     >
// //       {error && (
// //         <Alert
// //           message="Error"
// //           description={error}
// //           type="error"
// //           showIcon
// //           icon={<WarningOutlined />}
// //           style={{ marginBottom: 24 }}
// //           closable
// //           onClose={() => setError(null)}
// //         />
// //       )}

// //       <Form
// //         form={form}
// //         layout="vertical"
// //         onFinish={handleSubmit}
// //         initialValues={{ status: 'active' }}
// //       >
// //         <Form.Item
// //           name="name"
// //           label="Name"
// //           rules={[
// //             { required: true, message: 'Please enter environment name' },
// //             { min: 3, message: 'Name must be at least 3 characters' },
// //             { max: 50, message: 'Name cannot exceed 50 characters' },
// //             {
// //               validator: (_, value) => {
// //                 if (value && value.trim().length === 0) {
// //                   return Promise.reject('Name cannot be empty');
// //                 }
// //                 return Promise.resolve();
// //               }
// //             }
// //           ]}
// //           validateTrigger="onBlur"
// //         >
// //           <Input
// //             placeholder="e.g., Development, Staging, Production"
// //             onChange={handleNameChange}
// //             size="large"
// //             allowClear
// //             autoFocus
// //           />
// //         </Form.Item>

// //         <Form.Item
// //           name="code"
// //           label="Code"
// //           rules={[
// //             { required: true, message: 'Please enter environment code' },
// //             {
// //               pattern: /^[A-Z0-9_]+$/,
// //               message: 'Code must be uppercase letters, numbers, and underscore only'
// //             },
// //             { min: 2, message: 'Code must be at least 2 characters' },
// //             { max: 20, message: 'Code cannot exceed 20 characters' },
// //             {
// //               validator: async (_, value) => {
// //                 if (value && value.length > 0) {
// //                   // Check if code has valid format
// //                   if (!/^[A-Z0-9_]+$/.test(value)) {
// //                     return Promise.reject('Invalid code format');
// //                   }
// //                 }
// //                 return Promise.resolve();
// //               }
// //             }
// //           ]}
// //           validateTrigger="onBlur"
// //           help="Auto-generated from name. Can be edited manually."
// //         >
// //           <Input
// //             placeholder="Auto-generated from name (e.g., DEVELOPMENT)"
// //             onChange={handleCodeChange}
// //             size="large"
// //             style={{ textTransform: 'uppercase' }}
// //             allowClear
// //           />
// //         </Form.Item>

// //         <Form.Item
// //           name="status"
// //           label="Status"
// //           rules={[{ required: true, message: 'Please select status' }]}
// //         >
// //           <Select size="large" placeholder="Select status">
// //             <Option value="active">
// //               <Space>
// //                 <CheckCircleOutlined style={{ color: '#52c41a' }} />
// //                 <span>Active</span>
// //               </Space>
// //             </Option>
// //             <Option value="inactive">
// //               <Space>
// //                 <StopOutlined style={{ color: '#ff4d4f' }} />
// //                 <span>Inactive</span>
// //               </Space>
// //             </Option>
// //           </Select>
// //         </Form.Item>

// //         {/* Live preview of code format */}
// //         <Form.Item shouldUpdate noStyle>
// //           {({ getFieldValue }) => {
// //             const code = getFieldValue('code');
// //             if (code && code.length > 0) {
// //               return (
// //                 <div style={{
// //                   marginTop: -12,
// //                   marginBottom: 12,
// //                   padding: '8px 12px',
// //                   background: token.colorBgLayout,
// //                   borderRadius: token.borderRadius,
// //                   fontSize: 12
// //                 }}>
// //                   <Text type="secondary">Code preview: </Text>
// //                   <Tag color="blue" style={{ fontFamily: 'monospace' }}>{code}</Tag>
// //                 </div>
// //               );
// //             }
// //             return null;
// //           }}
// //         </Form.Item>
// //       </Form>
// //     </Modal>
// //   );
// // };

// // // Main Settings Page
// // export default function SettingsPage() {
// //   const [activeTab, setActiveTab] = useState("environment");
// //   const [searchText, setSearchText] = useState("");
// //   const [statusFilter, setStatusFilter] = useState<string>("all");
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [pageSize, setPageSize] = useState(10);

// //   // Modal state
// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [editingEnvironment, setEditingEnvironment] = useState<any>(null);
// //   const [apiError, setApiError] = useState<string | null>(null);

// //   const queryClient = useQueryClient();
// //   const { token } = theme.useToken();

// //   // Queries
// //   const { data: environmentsData, isLoading, error } = useEnviroments({
// //     page: currentPage,
// //     limit: pageSize,
// //     search: searchText || undefined,
// //     status: statusFilter !== "all" ? statusFilter : undefined
// //   });

// //   // Mutations
// //   const createMutation = useCreateEnviroment();
// //   const updateMutation = useUpdateEnviroment();
// //   const deleteMutation = useDeleteEnviroment();

// //   // Handle API response structure
// //   const environments = environmentsData?.data?.data || [];
// //   const totalCount = environmentsData?.data?.pagination?.total || 0;

// //   // Table columns
// //   const columns: ColumnsType<any> = [
// //     {
// //       title: "Name",
// //       dataIndex: "name",
// //       key: "name",
// //       render: (text: string, record: any) => (
// //         <Space>
// //           <div style={{
// //             width: 32,
// //             height: 32,
// //             borderRadius: 6,
// //             background: token.colorPrimaryBg,
// //             display: 'flex',
// //             alignItems: 'center',
// //             justifyContent: 'center',
// //             color: token.colorPrimary
// //           }}>
// //             <EnvironmentOutlined />
// //           </div>
// //           <div>
// //             <div style={{ fontWeight: 500 }}>{text}</div>
// //             <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.id?.slice(0, 8)}</Text>
// //           </div>
// //         </Space>
// //       ),
// //       sorter: (a, b) => a.name.localeCompare(b.name),
// //     },
// //     {
// //       title: "Code",
// //       dataIndex: "code",
// //       key: "code",
// //       render: (code: string) => (
// //         <Tag color="blue" style={{ fontFamily: 'monospace', padding: '4px 8px' }}>
// //           {code}
// //         </Tag>
// //       ),
// //     },
// //     {
// //       title: "Status",
// //       dataIndex: "status",
// //       key: "status",
// //       render: (status: string) => (
// //         <Badge
// //           status={status === 'active' ? 'success' : 'default'}
// //           text={
// //             <Text style={{
// //               color: status === 'active' ? token.colorSuccess : token.colorTextSecondary,
// //               textTransform: 'capitalize'
// //             }}>
// //               {status}
// //             </Text>
// //           }
// //         />
// //       ),
// //       filters: [
// //         { text: 'Active', value: 'active' },
// //         { text: 'Inactive', value: 'inactive' },
// //       ],
// //       onFilter: (value, record) => record.status === value,
// //     },
// //     {
// //       title: "Created",
// //       dataIndex: "createdAt",
// //       key: "createdAt",
// //       render: (date: string) => (
// //         <Text type="secondary">
// //           {date ? new Date(date).toLocaleDateString('en-US', {
// //             year: 'numeric',
// //             month: 'short',
// //             day: 'numeric'
// //           }) : '-'}
// //         </Text>
// //       ),
// //       sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
// //     },
// //     {
// //       title: "Actions",
// //       key: "actions",
// //       width: 120,
// //       render: (_: any, record: any) => (
// //         <Space size="small">
// //           <Tooltip title="Edit Environment">
// //             <Button
// //               type="text"
// //               icon={<EditOutlined />}
// //               onClick={() => handleEdit(record)}
// //               size="middle"
// //               style={{ color: token.colorPrimary }}
// //             />
// //           </Tooltip>
// //           <Tooltip title="Delete Environment">
// //             <Popconfirm
// //               title="Delete Environment"
// //               description="Are you sure you want to delete this environment?"
// //               onConfirm={() => handleDelete(record.id)}
// //               okText="Yes"
// //               cancelText="No"
// //               okButtonProps={{ danger: true }}
// //               placement="left"
// //             >
// //               <Button
// //                 type="text"
// //                 danger
// //                 icon={<DeleteOutlined />}
// //                 size="middle"
// //               />
// //             </Popconfirm>
// //           </Tooltip>
// //         </Space>
// //       ),
// //     },
// //   ];

// //   // Handlers
// //   const handleCreate = () => {
// //     setEditingEnvironment(null);
// //     setApiError(null);
// //     setModalOpen(true);
// //   };

// //   const handleEdit = (record: any) => {
// //     setEditingEnvironment(record);
// //     setApiError(null);
// //     setModalOpen(true);
// //   };

// //   const handleDelete = async (id: string) => {
// //     try {
// //       await deleteMutation.mutateAsync(id);
// //       message.success("Environment deleted successfully");
// //     } catch (error: any) {
// //       message.error(error?.response?.data?.error || "Failed to delete environment");
// //     }
// //   };

// //   const handleModalSubmit = async (values: any) => {
// //     try {
// //       setApiError(null);
// //       if (editingEnvironment) {
// //         await updateMutation.mutateAsync({
// //           id: editingEnvironment.id,
// //           data: values
// //         });
// //         message.success("Environment updated successfully");
// //         setModalOpen(false);
// //         setEditingEnvironment(null);
// //       } else {
// //         await createMutation.mutateAsync(values);
// //         message.success("Environment created successfully");
// //         setModalOpen(false);
// //         setEditingEnvironment(null);
// //       }
// //     } catch (error: any) {
// //       // Re-throw the error to be handled by the modal
// //       throw error;
// //     }
// //   };

// //   const handleRefresh = () => {
// //     queryClient.invalidateQueries({ queryKey: enviromentKeys.lists() });
// //     message.success("Refreshed successfully");
// //   };

// //   const handleSearch = (value: string) => {
// //     setSearchText(value);
// //     setCurrentPage(1);
// //   };

// //   const handleStatusFilter = (value: string) => {
// //     setStatusFilter(value);
// //     setCurrentPage(1);
// //   };

// //   const handleTableChange = (pagination: any) => {
// //     setCurrentPage(pagination.current);
// //     setPageSize(pagination.pageSize);
// //   };

// //   // Show API error if any
// //   useEffect(() => {
// //     if (error) {
// //       setApiError('Failed to load environments');
// //     }
// //   }, [error]);

// //   // Tab items configuration
// //   const items: TabsProps['items'] = [
// //     {
// //       key: 'environment',
// //       label: (
// //         <Space>
// //           <EnvironmentOutlined />
// //           <span>Environment</span>
// //           {environments.length > 0 && (
// //             <Badge count={environments.length} style={{ backgroundColor: token.colorPrimary }} />
// //           )}
// //         </Space>
// //       ),
// //       children: (
// //         <Card
// //           bordered={false}
// //           styles={{ body: { padding: '24px 0' } }}
// //         >
// //           {/* API Error Alert */}
// //           {apiError && (
// //             <Alert
// //               message="Error"
// //               description={apiError}
// //               type="error"
// //               showIcon
// //               style={{ marginBottom: 24 }}
// //               closable
// //               onClose={() => setApiError(null)}
// //             />
// //           )}

// //           {/* Header with Actions */}
// //           <Row justify="space-between" align="middle" style={{ marginBottom: 24 }} gutter={[16, 16]}>
// //             <Col xs={24} sm={24} md={16} lg={12}>
// //               <Space direction="horizontal" wrap size="middle">
// //                 <Input
// //                   placeholder="Search by name or code..."
// //                   prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
// //                   onChange={(e) => handleSearch(e.target.value)}
// //                   style={{ width: 280 }}
// //                   allowClear
// //                   size="large"
// //                 />
// //                 <Select
// //                   defaultValue="all"
// //                   style={{ width: 150 }}
// //                   onChange={handleStatusFilter}
// //                   size="large"
// //                   options={[
// //                     { value: 'all', label: 'All Status' },
// //                     { value: 'active', label: 'Active' },
// //                     { value: 'inactive', label: 'Inactive' },
// //                   ]}
// //                 />
// //               </Space>
// //             </Col>
// //             <Col xs={24} sm={24} md={8} lg={12} style={{ textAlign: 'right' }}>
// //               <Space wrap>
// //                 <Tooltip title="Refresh">
// //                   <Button
// //                     icon={<ReloadOutlined />}
// //                     onClick={handleRefresh}
// //                     size="large"
// //                   />
// //                 </Tooltip>
// //                 <Button
// //                   type="primary"
// //                   icon={<PlusOutlined />}
// //                   onClick={handleCreate}
// //                   size="large"
// //                 >
// //                   Create Environment
// //                 </Button>
// //               </Space>
// //             </Col>
// //           </Row>

// //           {/* Table */}
// //           <Table
// //             columns={columns}
// //             dataSource={environments}
// //             loading={isLoading || createMutation.isPending || updateMutation.isPending}
// //             rowKey="id"
// //             onChange={handleTableChange}
// //             pagination={{
// //               current: currentPage,
// //               pageSize: pageSize,
// //               total: totalCount,
// //               showSizeChanger: true,
// //               showQuickJumper: true,
// //               showTotal: (total) => `Total ${total} environments`,
// //               pageSizeOptions: ['10', '20', '50', '100'],
// //             }}
// //             locale={{
// //               emptyText: (
// //                 <div style={{ padding: '48px 0' }}>
// //                   <EnvironmentOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />
// //                   <Title level={4} style={{ marginTop: 16, color: token.colorTextSecondary }}>
// //                     No environments found
// //                   </Title>
// //                   <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
// //                     {searchText || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by creating your first environment'}
// //                   </Text>
// //                   <Button type="primary" onClick={handleCreate} style={{ marginTop: 8 }}>
// //                     Create your first environment
// //                   </Button>
// //                 </div>
// //               )
// //             }}
// //           />
// //         </Card>
// //       ),
// //     },
// //     {
// //       key: 'general',
// //       label: (
// //         <Space>
// //           <SettingOutlined />
// //           <span>General</span>
// //         </Space>
// //       ),
// //       children: (
// //         <Card bordered={false}>
// //           <div style={{
// //             textAlign: 'center',
// //             padding: '64px 0',
// //             background: token.colorBgLayout,
// //             borderRadius: token.borderRadiusLG
// //           }}>
// //             <SettingOutlined style={{ fontSize: 64, color: token.colorTextQuaternary }} />
// //             <Title level={4} style={{ marginTop: 24, color: token.colorTextSecondary }}>
// //               General Settings Coming Soon
// //             </Title>
// //             <Text type="secondary">
// //               This section is under development. Check back later!
// //             </Text>
// //           </div>
// //         </Card>
// //       ),
// //     },
// //   ];

// //   return (
// //     <MainLayout>
// //       <div>
// //         {/* Page Header */}
// //         <div style={{ marginBottom: 24 }}>
// //           <Space align="center" size="middle">
// //             <div style={{
// //               width: 48,
// //               height: 48,
// //               borderRadius: 12,
// //               background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 100%)`,
// //               display: 'flex',
// //               alignItems: 'center',
// //               justifyContent: 'center',
// //               color: 'white',
// //               fontSize: 24
// //             }}>
// //               <SettingOutlined />
// //             </div>
// //             <div>
// //               <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
// //                 Settings
// //               </Title>
// //               <Text type="secondary">
// //                 Manage your application settings and configurations
// //               </Text>
// //             </div>
// //           </Space>
// //         </div>

// //         {/* Tabs Card */}
// //         <Card
// //           style={{
// //             borderRadius: token.borderRadiusLG,
// //             boxShadow: token.boxShadow
// //           }}
// //         >
// //           <Tabs
// //             defaultActiveKey="environment"
// //             items={items}
// //             onChange={(key) => setActiveTab(key)}
// //             size="large"
// //             indicator={{ size: (origin) => origin - 20 }}
// //           />
// //         </Card>

// //         {/* Environment Form Modal */}
// //         <EnvironmentFormModal
// //           open={modalOpen}
// //           onCancel={() => {
// //             setModalOpen(false);
// //             setEditingEnvironment(null);
// //             setApiError(null);
// //           }}
// //           onSubmit={handleModalSubmit}
// //           initialValues={editingEnvironment}
// //           title={editingEnvironment ? "Edit Environment" : "Create New Environment"}
// //           loading={createMutation.isPending || updateMutation.isPending}
// //         />
// //       </div>
// //     </MainLayout>
// //   );
// // }

// // app/settings/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Space,
//   Typography,
//   Tabs,
//   Button,
//   Table,
//   Card,
//   Tag,
//   Input,
//   Select,
//   Row,
//   Col,
//   Popconfirm,
//   message,
//   Tooltip,
//   Badge,
//   Modal,
//   Form,
//   theme,
//   Alert
// } from "antd";
// import {
//   SettingOutlined,
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   EnvironmentOutlined,
//   CheckCircleOutlined,
//   StopOutlined,
//   WarningOutlined
// } from "@ant-design/icons";
// import type { TabsProps } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import { useQueryClient } from "@tanstack/react-query";

// // Import your existing hooks
// import {
//   useEnviroments,
//   useCreateEnviroment,
//   useUpdateEnviroment,
//   useDeleteEnviroment,
//   enviromentKeys
// } from "@/hooks/useenviroments";

// const { Title, Text } = Typography;
// const { Option } = Select;

// // Environment Form Modal Component
// interface EnvironmentFormProps {
//   open: boolean;
//   onCancel: () => void;
//   onSubmit: (values: any) => void;
//   initialValues?: any;
//   title: string;
//   loading?: boolean;
// }

// const EnvironmentFormModal = ({
//   open,
//   onCancel,
//   onSubmit,
//   initialValues,
//   title,
//   loading
// }: EnvironmentFormProps) => {
//   const [form] = Form.useForm();
//   const { token } = theme.useToken();
//   const [error, setError] = useState<string | null>(null);

//   // Transform name to code format
//   const transformToCode = (name: string): string => {
//     return name
//       .toUpperCase()
//       .replace(/\s+/g, '_')
//       .replace(/[^A-Z0-9_]/g, '');
//   };

//   // Handle name field change
//   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const name = e.target.value;
//     const code = transformToCode(name);
//     form.setFieldValue('code', code);
//     // Clear any previous code error when name changes
//     const codeError = form.getFieldError('code');
//     if (codeError.length > 0) {
//       form.validateFields(['code']);
//     }
//   };

//   // Handle manual code change
//   const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const code = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
//     form.setFieldValue('code', code);
//   };

//   // Reset form when modal opens/closes
//   useEffect(() => {
//     if (open) {
//       setError(null);
//       if (initialValues) {
//         form.setFieldsValue(initialValues);
//       } else {
//         form.resetFields();
//         form.setFieldsValue({ status: 'active' });
//       }
//     }
//   }, [open, initialValues, form]);

//   const handleSubmit = async (values: any) => {
//     try {
//       setError(null);
//       await onSubmit(values);
//     } catch (err: any) {
//       // Handle duplicate code error specifically
//       if (err?.response?.data?.error?.includes('code already exists')) {
//         setError('This environment code already exists. Please use a different code.');
//         form.setFields([
//           {
//             name: 'code',
//             errors: ['Code already exists']
//           }
//         ]);
//       } else {
//         setError(err?.response?.data?.error || 'Failed to save environment');
//       }
//     }
//   };

//   return (
//     <Modal
//       title={
//         <Space>
//           <EnvironmentOutlined style={{ color: token.colorPrimary }} />
//           <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>
//         </Space>
//       }
//       open={open}
//       onCancel={onCancel}
//       onOk={() => form.submit()}
//       okText={initialValues ? "Update" : "Create"}
//       cancelText="Cancel"
//       width={520}
//       confirmLoading={loading}
//       styles={{
//         body: { paddingTop: 24, paddingBottom: 8 }
//       }}
//     >
//       {error && (
//         <Alert
//           message="Error"
//           description={error}
//           type="error"
//           showIcon
//           icon={<WarningOutlined />}
//           style={{ marginBottom: 24 }}
//           closable
//           onClose={() => setError(null)}
//         />
//       )}

//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={handleSubmit}
//         initialValues={{ status: 'active' }}
//       >
//         <Form.Item
//           name="name"
//           label="Name"
//           rules={[
//             { required: true, message: 'Please enter environment name' },
//             { min: 3, message: 'Name must be at least 3 characters' },
//             { max: 50, message: 'Name cannot exceed 50 characters' },
//             {
//               validator: (_, value) => {
//                 if (value && value.trim().length === 0) {
//                   return Promise.reject('Name cannot be empty');
//                 }
//                 return Promise.resolve();
//               }
//             }
//           ]}
//           validateTrigger="onBlur"
//         >
//           <Input
//             placeholder="e.g., Development, Staging, Production"
//             onChange={handleNameChange}
//             size="large"
//             allowClear
//             autoFocus
//           />
//         </Form.Item>

//         <Form.Item
//           name="code"
//           label="Code"
//           rules={[
//             { required: true, message: 'Please enter environment code' },
//             {
//               pattern: /^[A-Z0-9_]+$/,
//               message: 'Code must be uppercase letters, numbers, and underscore only'
//             },
//             { min: 2, message: 'Code must be at least 2 characters' },
//             { max: 20, message: 'Code cannot exceed 20 characters' }
//           ]}
//           validateTrigger="onBlur"
//           help="Auto-generated from name. Can be edited manually."
//         >
//           <Input
//             placeholder="Auto-generated from name (e.g., DEVELOPMENT)"
//             onChange={handleCodeChange}
//             size="large"
//             style={{ textTransform: 'uppercase' }}
//             allowClear
//           />
//         </Form.Item>

//         <Form.Item
//           name="status"
//           label="Status"
//           rules={[{ required: true, message: 'Please select status' }]}
//         >
//           <Select size="large" placeholder="Select status">
//             <Option value="active">
//               <Space>
//                 <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                 <span>Active</span>
//               </Space>
//             </Option>
//             <Option value="inactive">
//               <Space>
//                 <StopOutlined style={{ color: '#ff4d4f' }} />
//                 <span>Inactive</span>
//               </Space>
//             </Option>
//           </Select>
//         </Form.Item>

//         {/* Live preview of code format */}
//         <Form.Item shouldUpdate noStyle>
//           {({ getFieldValue }) => {
//             const code = getFieldValue('code');
//             if (code && code.length > 0) {
//               return (
//                 <div style={{
//                   marginTop: -12,
//                   marginBottom: 12,
//                   padding: '8px 12px',
//                   background: token.colorBgLayout,
//                   borderRadius: token.borderRadius,
//                   fontSize: 12
//                 }}>
//                   <Text type="secondary">Code preview: </Text>
//                   <Tag color="blue" style={{ fontFamily: 'monospace' }}>{code}</Tag>
//                 </div>
//               );
//             }
//             return null;
//           }}
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// };

// // Main Settings Page
// export default function SettingsPage() {
//   const [activeTab, setActiveTab] = useState("environment");
//   const [searchText, setSearchText] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Modal state
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingEnvironment, setEditingEnvironment] = useState<any>(null);
//   const [apiError, setApiError] = useState<string | null>(null);

//   const queryClient = useQueryClient();
//   const { token } = theme.useToken();

//   // Queries
//   const { data: environmentsData, isLoading, error, refetch } = useEnviroments({
//     page: currentPage,
//     limit: pageSize,
//     search: searchText || undefined,
//     status: statusFilter !== "all" ? statusFilter : undefined
//   });

//   // 🔍 DEBUG: Log the actual data structure
//   useEffect(() => {
//     console.log("📦 Full environmentsData:", environmentsData);
//     if (environmentsData) {
//       console.log("🔍 Data structure:", {
//         type: typeof environmentsData,
//         isArray: Array.isArray(environmentsData),
//         keys: Object.keys(environmentsData),
//         data: environmentsData
//       });

//       // Check if data property exists
//       if (environmentsData.data) {
//         console.log("📊 environmentsData.data:", environmentsData.data);
//         console.log("📊 isArray:", Array.isArray(environmentsData.data));
//       }
//     }
//   }, [environmentsData]);

//   // Mutations
//   const createMutation = useCreateEnviroment();
//   const updateMutation = useUpdateEnviroment();
//   const deleteMutation = useDeleteEnviroment();

//   // ✅ FIXED: Correct data access based on your service
//   // Try different paths and see which one works
//   let environments: any[] = [];
//   let totalCount = 0;

//   if (environmentsData) {
//     // Try different possible paths
//     if (Array.isArray(environmentsData)) {
//       // Case 1: Direct array
//       environments = environmentsData;
//       totalCount = environments.length;
//     } else if (environmentsData.data && Array.isArray(environmentsData.data)) {
//       // Case 2: { data: [...] }
//       environments = environmentsData.data;
//       totalCount = environmentsData.pagination?.total || environments.length;
//     } else if (environmentsData.data?.data && Array.isArray(environmentsData.data.data)) {
//       // Case 3: { data: { data: [...] } }
//       environments = environmentsData.data.data;
//       totalCount = environmentsData.data.pagination?.total || environments.length;
//     } else if (environmentsData.environments && Array.isArray(environmentsData.environments)) {
//       // Case 4: { environments: [...] }
//       environments = environmentsData.environments;
//       totalCount = environments.length;
//     }
//   }

//   // Force refresh after mutations
//   useEffect(() => {
//     if (createMutation.isSuccess || updateMutation.isSuccess || deleteMutation.isSuccess) {
//       refetch();
//     }
//   }, [createMutation.isSuccess, updateMutation.isSuccess, deleteMutation.isSuccess, refetch]);

//   // Table columns
//   const columns: ColumnsType<any> = [
//     {
//       title: "Name",
//       dataIndex: "name",
//       key: "name",
//       render: (text: string, record: any) => (
//         <Space>
//           <div style={{
//             width: 32,
//             height: 32,
//             borderRadius: 6,
//             background: token.colorPrimaryBg,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             color: token.colorPrimary
//           }}>
//             <EnvironmentOutlined />
//           </div>
//           <div>
//             <div style={{ fontWeight: 500 }}>{text}</div>
//             <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.id?.slice(0, 8)}</Text>
//           </div>
//         </Space>
//       ),
//       sorter: (a, b) => a.name.localeCompare(b.name),
//     },
//     {
//       title: "Code",
//       dataIndex: "code",
//       key: "code",
//       render: (code: string) => (
//         <Tag color="blue" style={{ fontFamily: 'monospace', padding: '4px 8px' }}>
//           {code}
//         </Tag>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status: string) => (
//         <Badge
//           status={status === 'active' ? 'success' : 'default'}
//           text={
//             <Text style={{
//               color: status === 'active' ? token.colorSuccess : token.colorTextSecondary,
//               textTransform: 'capitalize'
//             }}>
//               {status}
//             </Text>
//           }
//         />
//       ),
//       filters: [
//         { text: 'Active', value: 'active' },
//         { text: 'Inactive', value: 'inactive' },
//       ],
//       onFilter: (value, record) => record.status === value,
//     },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       render: (date: string) => (
//         <Text type="secondary">
//           {date ? new Date(date).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//           }) : '-'}
//         </Text>
//       ),
//       sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 120,
//       render: (_: any, record: any) => (
//         <Space size="small">
//           <Tooltip title="Edit Environment">
//             <Button
//               type="text"
//               icon={<EditOutlined />}
//               onClick={() => handleEdit(record)}
//               size="middle"
//               style={{ color: token.colorPrimary }}
//             />
//           </Tooltip>
//           <Tooltip title="Delete Environment">
//             <Popconfirm
//               title="Delete Environment"
//               description="Are you sure you want to delete this environment?"
//               onConfirm={() => handleDelete(record.id)}
//               okText="Yes"
//               cancelText="No"
//               okButtonProps={{ danger: true }}
//               placement="left"
//             >
//               <Button
//                 type="text"
//                 danger
//                 icon={<DeleteOutlined />}
//                 size="middle"
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   // Handlers
//   const handleCreate = () => {
//     setEditingEnvironment(null);
//     setApiError(null);
//     setModalOpen(true);
//   };

//   const handleEdit = (record: any) => {
//     setEditingEnvironment(record);
//     setApiError(null);
//     setModalOpen(true);
//   };

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//       message.success("Environment deleted successfully");
//       refetch(); // Force refresh
//     } catch (error: any) {
//       message.error(error?.response?.data?.error || "Failed to delete environment");
//     }
//   };

//   const handleModalSubmit = async (values: any) => {
//     try {
//       setApiError(null);
//       if (editingEnvironment) {
//         await updateMutation.mutateAsync({
//           id: editingEnvironment.id,
//           data: values
//         });
//         message.success("Environment updated successfully");
//       } else {
//         await createMutation.mutateAsync(values);
//         message.success("Environment created successfully");
//       }
//       setModalOpen(false);
//       setEditingEnvironment(null);
//       refetch(); // Force refresh immediately
//     } catch (error: any) {
//       throw error;
//     }
//   };

//   const handleRefresh = () => {
//     queryClient.invalidateQueries({ queryKey: enviromentKeys.lists() });
//     refetch();
//     message.success("Refreshed successfully");
//   };

//   const handleSearch = (value: string) => {
//     setSearchText(value);
//     setCurrentPage(1);
//   };

//   const handleStatusFilter = (value: string) => {
//     setStatusFilter(value);
//     setCurrentPage(1);
//   };

//   const handleTableChange = (pagination: any) => {
//     setCurrentPage(pagination.current);
//     setPageSize(pagination.pageSize);
//   };

//   // Show API error if any
//   useEffect(() => {
//     if (error) {
//       setApiError('Failed to load environments');
//       console.error("Query error:", error);
//     }
//   }, [error]);

//   // Tab items configuration
//   const items: TabsProps['items'] = [
//     {
//       key: 'environment',
//       label: (
//         <Space>
//           <EnvironmentOutlined />
//           <span>Environment</span>
//           {environments.length > 0 && (
//             <Badge count={environments.length} style={{ backgroundColor: token.colorPrimary }} />
//           )}
//         </Space>
//       ),
//       children: (
//         <Card
//           bordered={false}
//           styles={{ body: { padding: '24px 0' } }}
//         >

//           {/* Header with Actions */}
//           <Row justify="space-between" align="middle" style={{ marginBottom: 24 }} gutter={[16, 16]}>
//             <Col xs={24} sm={24} md={16} lg={12}>
//               <Space direction="horizontal" wrap size="middle">
//                 <Input
//                   placeholder="Search by name or code..."
//                   prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
//                   onChange={(e) => handleSearch(e.target.value)}
//                   style={{ width: 280 }}
//                   allowClear
//                   size="large"
//                 />
//                 <Select
//                   defaultValue="all"
//                   style={{ width: 150 }}
//                   onChange={handleStatusFilter}
//                   size="large"
//                   options={[
//                     { value: 'all', label: 'All Status' },
//                     { value: 'active', label: 'Active' },
//                     { value: 'inactive', label: 'Inactive' },
//                   ]}
//                 />
//               </Space>
//             </Col>
//             <Col xs={24} sm={24} md={8} lg={12} style={{ textAlign: 'right' }}>
//               <Space wrap>
//                 <Tooltip title="Refresh">
//                   <Button
//                     icon={<ReloadOutlined />}
//                     onClick={handleRefresh}
//                     size="large"
//                   />
//                 </Tooltip>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   onClick={handleCreate}
//                   size="large"
//                 >
//                   Create Environment
//                 </Button>
//               </Space>
//             </Col>
//           </Row>

//           {/* Table */}
//           <Table
//             columns={columns}
//             dataSource={environments}
//             loading={isLoading || createMutation.isPending || updateMutation.isPending}
//             rowKey="id"
//             onChange={handleTableChange}
//             pagination={{
//               current: currentPage,
//               pageSize: pageSize,
//               total: totalCount,
//               showSizeChanger: true,
//               showQuickJumper: true,
//               showTotal: (total) => `Total ${total} environments`,
//               pageSizeOptions: ['10', '20', '50', '100'],
//             }}
//             locale={{
//               emptyText: (
//                 <div style={{ padding: '48px 0' }}>
//                   <EnvironmentOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />
//                   <Title level={4} style={{ marginTop: 16, color: token.colorTextSecondary }}>
//                     {environmentsData ? 'No environments found' : 'Loading...'}
//                   </Title>
//                   <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
//                     {environmentsData
//                       ? (searchText || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by creating your first environment')
//                       : 'Please check console for errors'}
//                   </Text>
//                   <Button type="primary" onClick={handleCreate} style={{ marginTop: 8 }}>
//                     Create your first environment
//                   </Button>
//                 </div>
//               )
//             }}
//           />
//         </Card>
//       ),
//     },
//     {
//       key: 'general',
//       label: (
//         <Space>
//           <SettingOutlined />
//           <span>General</span>
//         </Space>
//       ),
//       children: (
//         <Card bordered={false}>
//           <div style={{
//             textAlign: 'center',
//             padding: '64px 0',
//             background: token.colorBgLayout,
//             borderRadius: token.borderRadiusLG
//           }}>
//             <SettingOutlined style={{ fontSize: 64, color: token.colorTextQuaternary }} />
//             <Title level={4} style={{ marginTop: 24, color: token.colorTextSecondary }}>
//               General Settings Coming Soon
//             </Title>
//             <Text type="secondary">
//               This section is under development. Check back later!
//             </Text>
//           </div>
//         </Card>
//       ),
//     },
//   ];

//   return (
//     <MainLayout>
//       <div>
//         {/* Page Header */}
//         <div style={{ marginBottom: 24 }}>

//             <Space align="center" style={{ marginBottom: 8 }}>
//                           <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//                            <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
//                 Settings
//               </Title>
//               <Text type="secondary">
//                 Manage your application settings and configurations
//               </Text>

//                         </Space>
//         </div>

//         {/* Tabs Card */}
//         <Card
//           style={{
//             borderRadius: token.borderRadiusLG,
//             boxShadow: token.boxShadow
//           }}
//         >
//           <Tabs
//             defaultActiveKey="environment"
//             items={items}
//             onChange={(key) => setActiveTab(key)}
//             size="large"
//             indicator={{ size: (origin) => origin - 20 }}
//           />
//         </Card>

//         {/* Environment Form Modal */}
//         <EnvironmentFormModal
//           open={modalOpen}
//           onCancel={() => {
//             setModalOpen(false);
//             setEditingEnvironment(null);
//             setApiError(null);
//           }}
//           onSubmit={handleModalSubmit}
//           initialValues={editingEnvironment}
//           title={editingEnvironment ? "Edit Environment" : "Create New Environment"}
//           loading={createMutation.isPending || updateMutation.isPending}
//         />
//       </div>
//     </MainLayout>
//   );
// }

// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Tabs,
  Button,
  Table,
  Card,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Popconfirm,
  message,
  Tooltip,
  Badge,
  Modal,
  Form,
  theme,
  Alert,
  Statistic,
} from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  StopOutlined,
  WarningOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQueryClient } from "@tanstack/react-query";

// Import your existing hooks
import {
  useEnviroments,
  useCreateEnviroment,
  useUpdateEnviroment,
  useDeleteEnviroment,
  enviromentKeys,
} from "@/hooks/useenviroments";

const { Title, Text } = Typography;
const { Option } = Select;

// Environment Form Modal Component
const EnvironmentFormModal = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  title,
  loading,
}: any) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const [error, setError] = useState<string | null>(null);

  const transformToCode = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const code = transformToCode(name);
    form.setFieldValue("code", code);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
    form.setFieldValue("code", code);
  };

  useEffect(() => {
    if (open) {
      setError(null);
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({ status: "active" });
      }
    }
  }, [open, initialValues, form]);

  const handleSubmit = async (values: any) => {
    try {
      setError(null);
      await onSubmit(values);
    } catch (err: any) {
      if (err?.response?.data?.error?.includes("code already exists")) {
        setError("Code already exists");
        form.setFields([{ name: "code", errors: ["Code already exists"] }]);
      } else {
        setError(err?.response?.data?.error || "Failed to save");
      }
    }
  };

  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined style={{ color: token.colorPrimary }} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={initialValues ? "Update" : "Create"}
      cancelText="Cancel"
      width={480}
      confirmLoading={loading}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: "active" }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder="e.g., Development" onChange={handleNameChange} />
        </Form.Item>

        <Form.Item
          name="code"
          label="Code"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input
            placeholder="DEVELOPMENT"
            onChange={handleCodeChange}
            style={{ textTransform: "uppercase" }}
          />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select placeholder="Select status">
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Settings Page
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("environment");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { token } = theme.useToken();

  // Queries
  const {
    data: environmentsData,
    isLoading,
    error,
    refetch,
  } = useEnviroments({
    page: currentPage,
    limit: pageSize,
    search: searchText || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Mutations
  const createMutation = useCreateEnviroment();
  const updateMutation = useUpdateEnviroment();
  const deleteMutation = useDeleteEnviroment();

  // ✅ FIXED: Correct data access
  let environments: any[] = [];
  let totalCount = 0;

  if (environmentsData) {
    if (Array.isArray(environmentsData)) {
      environments = environmentsData;
      totalCount = environments.length;
    } else if (environmentsData.data && Array.isArray(environmentsData.data)) {
      environments = environmentsData.data;
      totalCount = environmentsData.pagination?.total || environments.length;
    }
  }

  // Calculate stats
  const totalEnvironments = environments.length;
  const activeEnvironments = environments.filter(
    (env) => env.status === "active",
  ).length;
  const inactiveEnvironments = environments.filter(
    (env) => env.status === "inactive",
  ).length;

  // Force refresh after mutations
  useEffect(() => {
    if (
      createMutation.isSuccess ||
      updateMutation.isSuccess ||
      deleteMutation.isSuccess
    ) {
      refetch();
    }
  }, [
    createMutation.isSuccess,
    updateMutation.isSuccess,
    deleteMutation.isSuccess,
    refetch,
  ]);

  // Table columns - Clean like the screenshot
  const columns: ColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: token.colorPrimary }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={status === "active" ? "success" : "default"}
          text={status}
        />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Text type="secondary">
          {date
            ? new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "-"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete"
            description="Are you sure?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handlers
  const handleCreate = () => {
    setEditingEnvironment(null);
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingEnvironment(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success("Deleted successfully");
      refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Delete failed");
    }
  };

  const handleModalSubmit = async (values: any) => {
    try {
      if (editingEnvironment) {
        await updateMutation.mutateAsync({
          id: editingEnvironment.id,
          data: values,
        });
        message.success("Updated successfully");
      } else {
        await createMutation.mutateAsync(values);
        message.success("Created successfully");
      }
      setModalOpen(false);
      setEditingEnvironment(null);
      refetch();
    } catch (error: any) {
      throw error;
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: enviromentKeys.lists() });
    refetch();
    message.success("Refreshed");
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Show API error if any
  useEffect(() => {
    if (error) {
      setApiError("Failed to load environments");
    }
  }, [error]);

  // Tab items configuration
  const items: TabsProps["items"] = [
    {
      key: "environment",
      label: (
        <Space>
          <EnvironmentOutlined />
          <span>Environment</span>
        </Space>
      ),
      children: (
        <div>
          {/* Stats Cards - Like the screenshot */}
          {/* <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Environments"
                  value={totalEnvironments}
                  prefix={<ApartmentOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Active"
                  value={activeEnvironments}
                  valueStyle={{ color: "#3f8600" }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Inactive"
                  value={inactiveEnvironments}
                  valueStyle={{ color: "#cf1322" }}
                  prefix={<StopOutlined />}
                />
              </Card>
            </Col>
          </Row> */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col>
              <Tag
                color="blue"
                style={{ padding: "8px 16px", fontSize: 14 }}
                icon={<ApartmentOutlined />}
              >
                Total: {totalEnvironments}
              </Tag>
            </Col>

            <Col>
              <Tag
                color="green"
                style={{ padding: "8px 16px", fontSize: 14 }}
                icon={<CheckCircleOutlined />}
              >
                Active: {activeEnvironments}
              </Tag>
            </Col>

            <Col>
              <Tag
                color="red"
                style={{ padding: "8px 16px", fontSize: 14 }}
                icon={<StopOutlined />}
              >
                Inactive: {inactiveEnvironments}
              </Tag>
            </Col>
          </Row>

          {/* Header with Actions */}
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Col>
              <Space size="middle">
                <Input
                  placeholder="Search environments..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 240 }}
                  allowClear
                />
                <Select
                  defaultValue="all"
                  style={{ width: 120 }}
                  onChange={handleStatusFilter}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Tooltip title="Refresh">
                  <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                </Tooltip>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  Create Environment
                </Button>
              </Space>
            </Col>
          </Row>

          {/* API Error Alert */}
          {apiError && (
            <Alert
              message={apiError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              closable
              onClose={() => setApiError(null)}
            />
          )}

          {/* Table */}
          <Table
            columns={columns}
            dataSource={environments}
            loading={isLoading}
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
              pageSizeOptions: ["10", "20", "50"],
            }}
          />
        </div>
      ),
    },
    {
      key: "general",
      label: (
        <Space>
          <SettingOutlined />
          <span>General</span>
        </Space>
      ),
      children: (
        <Card>
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <SettingOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />
            <Title level={4} style={{ marginTop: 16, color: "#999" }}>
              General Settings Coming Soon
            </Title>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div>
        {/* Simple Header */}
        <div style={{ marginBottom: 24 }}>
          <Space align="center" size="middle">
            <SettingOutlined
              style={{ fontSize: 28, color: token.colorPrimary }}
            />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Settings
              </Title>
              <Text type="secondary">Manage your application settings</Text>
            </div>
          </Space>
        </div>

        {/* Tabs Card */}
        <Card
          style={{
            marginLeft: "20px",
            marginRight: "20px",
          }}
        >
          <Tabs
            defaultActiveKey="environment"
            items={items}
            onChange={setActiveTab}
          />
        </Card>

        {/* Modal */}
        <EnvironmentFormModal
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingEnvironment(null);
          }}
          onSubmit={handleModalSubmit}
          initialValues={editingEnvironment}
          title={editingEnvironment ? "Edit Environment" : "Create Environment"}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
