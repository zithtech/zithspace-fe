// "use client";

// import React, { useState, useEffect } from "react";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Card,
//   Table,
//   Button,
//   Input,
//   Select,
//   Space,
//   Typography,
//   Tag,
//   Modal,
//   Form,
//   Alert,
//   Dropdown,
//   Row,
//   Col,
//   Statistic,
//   Segmented,
//   Avatar,
//   DatePicker,
// } from "antd";
// import {
//   PlusOutlined,
//   SearchOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   MoreOutlined,
//   ShopOutlined,
//   EyeOutlined,
//   MailOutlined,
//   PhoneOutlined,
//   UserOutlined,
//   AppstoreOutlined,
//   BarsOutlined,
//   TeamOutlined,
//   ExclamationCircleOutlined,
//   CalendarOutlined,
//   UserAddOutlined,
//   EnvironmentOutlined,
//   FileTextOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import {
//   ClientService,
//   Client,
//   CreateClientData,
//   UpdateClientData,
// } from "@/services/clientService";
// import type { ColumnsType } from "antd/es/table";
// import { useRBAC } from "@/lib/rbac";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// export default function ClientsPage() {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();
//   const [form] = Form.useForm();

//   // State management
//   const [clients, setClients] = useState<Client[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [stats, setStats] = useState<any>(null);

//   // Pagination and filtering
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string | undefined>(
//     undefined,
//   );

//   // Modal states
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [modalType, setModalType] = useState<
//     "add" | "edit" | "delete" | "view"
//   >("add");
//   const [selectedClient, setSelectedClient] = useState<Client | null>(null);
//   const [formLoading, setFormLoading] = useState(false);

//   const [viewMode, setViewMode] = useState<"card" | "list">("card");

//   // RBAC permissions
//   const rbac = useRBAC(user?.role as any);
//   const canManage = rbac?.canManageMembers;

//   // Check permissions
//   useEffect(() => {
//     if (user && !["super_admin", "admin", "user"].includes(user.role)) {
//       router.push("/dashboard");
//     }
//   }, [user, router]);

//   // Fetch clients
//   const fetchClients = async () => {
//     try {
//       setLoading(true);

//       const response = await ClientService.getClients({
//         page: pagination.current,
//         limit: pagination.pageSize,
//         search: searchTerm,
//         status: statusFilter,
//       });

//       setClients(response.data);
//       setPagination((prev) => ({
//         ...prev,
//         total: response.pagination.total,
//       }));
//     } catch (error) {
//       console.error("Failed to fetch clients:", error);
//       if (error instanceof Error) {
//         setError(error.message);
//       } else {
//         setError("Failed to fetch clients");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch stats
//   const fetchStats = async () => {
//     try {
//       const data = await ClientService.getClientStats();
//       setStats(data);
//     } catch (error) {
//       console.error("Failed to fetch stats:", error);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchClients();
//       fetchStats();
//     }
//   }, [user, pagination.current, pagination.pageSize, searchTerm, statusFilter]);

//   // Handle form submission
//   const handleSubmit = async (values: any) => {
//     try {
//       setFormLoading(true);
//       setError("");

//       const formData: CreateClientData = {
//         name: values.name,
//         email: values.email,
//         phone: values.phone,
//         company: values.company,
//         address: values.address,
//         contactPerson: values.contactPerson,
//         notes: values.notes,
//       };

//       if (modalType === "edit" && selectedClient) {
//         await ClientService.updateClient(
//           selectedClient.id,
//           formData as UpdateClientData,
//         );
//         setSuccess("Client updated successfully");
//       } else {
//         await ClientService.createClient(formData);
//         setSuccess("Client created successfully");
//       }

//       setIsModalVisible(false);
//       form.resetFields();
//       setSelectedClient(null);
//       fetchClients();
//       fetchStats();
//     } catch (error: any) {
//       console.error("Failed to submit client form:", error);
//       if (error instanceof Error) {
//         setError(error.message);
//       } else {
//         setError("Operation failed");
//       }
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   // Handle delete
//   const handleDelete = async () => {
//     if (!selectedClient) return;

//     try {
//       setFormLoading(true);
//       await ClientService.deleteClient(selectedClient.id);
//       setSuccess("Client deleted successfully");
//       setIsModalVisible(false);
//       setSelectedClient(null);
//       fetchClients();
//       fetchStats();
//     } catch (error: any) {
//       console.error("Failed to delete client:", error);
//       if (error instanceof Error) {
//         setError(error.message);
//       } else {
//         setError("Delete failed");
//       }
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   // Modal handlers
//   const showAddModal = () => {
//     setModalType("add");
//     form.resetFields();
//     setSelectedClient(null);
//     setIsModalVisible(true);
//   };

//   const showEditModal = (client: Client) => {
//     setModalType("edit");
//     setSelectedClient(client);
//     form.setFieldsValue({
//       name: client.name,
//       email: client.email,
//       phone: client.phone,
//       company: client.company,
//       address: client.address,
//       contactPerson: client.contactPerson,
//       notes: client.notes,
//     });
//     setIsModalVisible(true);
//   };

//   const showViewModal = (client: Client) => {
//     setModalType("view");
//     setSelectedClient(client);
//     setIsModalVisible(true);
//   };

//   const showDeleteModal = (client: Client) => {
//     setModalType("delete");
//     setSelectedClient(client);
//     setIsModalVisible(true);
//   };

//   // Table columns
//   const columns: ColumnsType<Client> = [
//     {
//       title: "Client",
//       key: "client",
//       width: 200,
//       render: (_, record: Client) => (
//         <Space>
//           <div
//             style={{
//               width: 40,
//               height: 40,
//               borderRadius: 20,
//               background: record.isActive ? "#52c41a" : "#ff4d4f",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               color: "#fff",
//               fontSize: 14,
//               fontWeight: 600,
//             }}
//           >
//             {record.name.charAt(0).toUpperCase()}
//           </div>
//           <div>
//             <Text strong style={{ fontSize: 13 }}>
//               {record.name}
//             </Text>
//             <br />
//             {record.company && (
//               <Text type="secondary" style={{ fontSize: 11 }}>
//                 {record.company}
//               </Text>
//             )}
//           </div>
//         </Space>
//       ),
//     },
//     {
//       title: "Contact",
//       key: "contact",
//       width: 200,
//       render: (_, record: Client) => (
//         <div>
//           <Space size={4}>
//             <MailOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
//             <Text style={{ fontSize: 12 }}>{record.email}</Text>
//           </Space>
//           <br />
//           {record.phone && (
//             <Space size={4}>
//               <PhoneOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
//               <Text type="secondary" style={{ fontSize: 11 }}>
//                 {record.phone}
//               </Text>
//             </Space>
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "Contact Person",
//       dataIndex: "contactPerson",
//       key: "contactPerson",
//       width: 150,
//       render: (contactPerson: string) => (
//         <Space size={4}>
//           <UserOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
//           <Text style={{ fontSize: 12 }}>{contactPerson || "-"}</Text>
//         </Space>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "isActive",
//       key: "isActive",
//       width: 100,
//       render: (isActive: boolean) => (
//         <Tag
//           color={isActive ? "green" : "red"}
//           style={{ fontSize: 11, fontWeight: 500 }}
//         >
//           {isActive ? "ACTIVE" : "INACTIVE"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       width: 120,
//       render: (date: string) => (
//         <Text type="secondary" style={{ fontSize: 11 }}>
//           {dayjs(date).format("MMM DD, YYYY")}
//         </Text>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 80,
//       align: "center",
//       fixed: "right",
//       render: (_, record: Client) => {
//         const menuItems = [
//           {
//             key: "view",
//             icon: <EyeOutlined />,
//             label: "View",
//             onClick: () => showViewModal(record),
//           },
//           ...(canManage
//             ? [
//                 {
//                   key: "edit",
//                   icon: <EditOutlined />,
//                   label: "Edit",
//                   onClick: () => showEditModal(record),
//                 },
//                 {
//                   key: "delete",
//                   icon: <DeleteOutlined />,
//                   label: "Delete",
//                   danger: true,
//                   onClick: () => showDeleteModal(record),
//                 },
//               ]
//             : []),
//         ];

//         return (
//           <Dropdown
//             menu={{ items: menuItems }}
//             trigger={["click"]}
//             placement="bottomRight"
//           >
//             <Button type="text" icon={<MoreOutlined />} size="small" />
//           </Dropdown>
//         );
//       },
//     },
//   ];

//   // Clear messages
//   useEffect(() => {
//     if (success || error) {
//       const timer = setTimeout(() => {
//         setSuccess("");
//         setError("");
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, error]);

//   if (!user) {
//     return null;
//   }
//   return (
//     <MainLayout>
//       <div style={{ padding: 20 }}>
//         {/* Header */}
//         <div style={{ marginBottom: 20 }}>
//           {/* <Space
//             align="center"
//             style={{ width: "100%", justifyContent: "space-between" }}
//           >
//             <Space align="center">
//               <ShopOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Client Management
//               </Title>
//             </Space>
//             {canManage && (
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={showAddModal}
//                 size="middle"
//               >
//                 Add Client
//               </Button>
//             )}
//           </Space> */}
//           <Row align="middle" justify="space-between">
//             {/* Left side - Title */}
//             <Col>
//               <Space align="center">
//                 <ShopOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//                 <Title level={3} style={{ margin: 0 }}>
//                   Client Management
//                 </Title>
//               </Space>
//             </Col>

//             {/* Right side - Toggle + Add Button */}
//             <Col>
//               <Space>
//                 {/* Card / List Button Toggle */}
//                 <div
//                   style={{
//                     display: "flex",
//                     background: "#f5f5f5",
//                     borderRadius: 10,
//                     padding: 2,
//                     boxShadow: "inset 0 0 0 1px #d9d9d9",
//                   }}
//                 >
//                   {/* Card View Button */}
//                   <Button
//                     type="text"
//                     icon={<AppstoreOutlined />}
//                     onClick={() => setViewMode("card")}
//                     style={{
//                       borderRadius: 8,
//                       padding: "4px 14px",
//                       fontWeight: 500,
//                       background:
//                         viewMode === "card" ? "#1677ff" : "transparent",
//                       color: viewMode === "card" ? "#fff" : "#595959",
//                       transition: "all 0.25s ease",
//                     }}
//                   >
//                     Card
//                   </Button>

//                   {/* List View Button */}
//                   <Button
//                     type="text"
//                     icon={<BarsOutlined />}
//                     onClick={() => setViewMode("list")}
//                     style={{
//                       borderRadius: 8,
//                       padding: "4px 14px",
//                       fontWeight: 500,
//                       background:
//                         viewMode === "list" ? "#1677ff" : "transparent",
//                       color: viewMode === "list" ? "#fff" : "#595959",
//                       transition: "all 0.25s ease",
//                     }}
//                   >
//                     List
//                   </Button>
//                 </div>

//                 {/* Add Client Button */}
//                 {canManage && (
//                   <Button
//                     type="primary"
//                     icon={<PlusOutlined />}
//                     onClick={showAddModal}
//                   >
//                     Add Client
//                   </Button>
//                 )}
//               </Space>
//             </Col>
//           </Row>
//         </div>

//         {/* Alerts */}
//         {error && (
//           <Alert
//             message={error}
//             type="error"
//             showIcon
//             closable
//             style={{ marginBottom: 16, fontSize: 13 }}
//             onClose={() => setError("")}
//           />
//         )}
//         {success && (
//           <Alert
//             message={success}
//             type="success"
//             showIcon
//             closable
//             style={{ marginBottom: 16, fontSize: 13 }}
//             onClose={() => setSuccess("")}
//           />
//         )}

//         {/* Stats Cards */}
//         {stats && (
//           <Row gutter={16} style={{ marginBottom: 16 }}>
//             <Col xs={24} sm={8}>
//               <Card size="small">
//                 <Statistic
//                   title="Total Clients"
//                   value={stats.overview.totalClients}
//                   valueStyle={{ color: "#1677ff" }}
//                 />
//               </Card>
//             </Col>
//             <Col xs={24} sm={8}>
//               <Card size="small">
//                 <Statistic
//                   title="Active Clients"
//                   value={stats.overview.activeClients}
//                   valueStyle={{ color: "#52c41a" }}
//                 />
//               </Card>
//             </Col>
//             <Col xs={24} sm={8}>
//               <Card size="small">
//                 <Statistic
//                   title="Inactive Clients"
//                   value={stats.overview.inactiveClients}
//                   valueStyle={{ color: "#ff4d4f" }}
//                 />
//               </Card>
//             </Col>
//           </Row>
//         )}

//         {/* Filters Card */}
//         <Card size="small" style={{ marginBottom: 16 }}>
//           <Space wrap size={12}>
//             <Input
//               placeholder="Search clients..."
//               prefix={<SearchOutlined />}
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{ width: 240 }}
//               allowClear
//             />

//             <Select
//               placeholder="Filter by status"
//               value={statusFilter}
//               onChange={setStatusFilter}
//               style={{ width: 150 }}
//               allowClear
//             >
//               <Option value="active">Active</Option>
//               <Option value="inactive">Inactive</Option>
//             </Select>
//           </Space>
//         </Card>

//         {viewMode === "card" ? (
//           <Row gutter={[24, 24]}>
//             {loading
//               ? [1, 2, 3, 4].map((i) => (
//                   <Col xs={24} sm={12} lg={8} xl={6} key={i}>
//                     <Card
//                       loading
//                       style={{
//                         height: 320,
//                         borderRadius: 18,
//                       }}
//                     />
//                   </Col>
//                 ))
//               : clients.map((client) => (
//                   <Col xs={24} sm={12} lg={8} xl={6} key={client.id}>
//                     <Card
//                       hoverable
//                       className="client-card"
//                       onClick={() => showViewModal(client)}
//                       style={{
//                         height: "100%",
//                         borderRadius: 18,
//                         display: "flex",
//                         flexDirection: "column",
//                         overflow: "hidden",
//                         border: "1px solid rgba(22,119,255,0.15)",
//                         boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
//                         transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
//                         background:
//                           "linear-gradient(180deg, #ffffff 0%, #fafcff 100%)",
//                       }}
//                       bodyStyle={{
//                         flex: 1,
//                         display: "flex",
//                         flexDirection: "column",
//                         padding: 18,
//                       }}
//                     >
//                       {/* ===== HEADER ===== */}
//                       <div
//                         style={{
//                           display: "flex",
//                           marginBottom: 18,
//                           alignItems: "center",
//                         }}
//                       >
//                         <Avatar
//                           size={52}
//                           style={{
//                             background:
//                               "linear-gradient(135deg, #1677ff, #69b1ff)",
//                             //boxShadow: "0 8px 20px rgba(22,119,255,0.4)",
//                             fontWeight: "bold",
//                             fontSize: 18,
//                           }}
//                         >
//                           {client.name?.[0]?.toUpperCase()}
//                         </Avatar>

//                         <div style={{ marginLeft: 14, flex: 1 }}>
//                           <Title
//                             level={5}
//                             style={{
//                               margin: 0,
//                               lineHeight: 1.3,
//                               fontWeight: 600,
//                             }}
//                             ellipsis={{ tooltip: client.name }}
//                           >
//                             {client.name}
//                           </Title>

//                           {client.company && (
//                             <Text type="secondary" style={{ fontSize: 12 }}>
//                               {client.company}
//                             </Text>
//                           )}

//                           <div style={{ marginTop: 6 }}>
//                             <Tag
//                               color={client.isActive ? "green" : "red"}
//                               style={{
//                                 fontWeight: 600,
//                                 borderRadius: 6,
//                               }}
//                             >
//                               {client.isActive ? "ACTIVE" : "INACTIVE"}
//                             </Tag>
//                           </div>
//                         </div>
//                       </div>

//                       {/* ===== CLIENT INFO ===== */}
//                       <div
//                         style={{
//                           background: "rgba(245,248,250,0.9)",
//                           backdropFilter: "blur(6px)",
//                           padding: 14,
//                           borderRadius: 12,
//                           marginBottom: 18,
//                           flex: 1,
//                           border: "1px solid #e6f4ff",
//                         }}
//                       >
//                         <Space direction="vertical" size={8}>
//                           <Space>
//                             <MailOutlined style={{ color: "#1677ff" }} />
//                             <Text style={{ fontSize: 13 }}>
//                               {client.email || "—"}
//                             </Text>
//                           </Space>

//                           {client.phone && (
//                             <Space>
//                               <PhoneOutlined style={{ color: "#1677ff" }} />
//                               <Text style={{ fontSize: 13 }}>
//                                 {client.phone}
//                               </Text>
//                             </Space>
//                           )}

//                           {client.contactPerson && (
//                             <Space>
//                               <UserOutlined style={{ color: "#1677ff" }} />
//                               <Text style={{ fontSize: 13 }}>
//                                 {client.contactPerson}
//                               </Text>
//                             </Space>
//                           )}
//                         </Space>
//                       </div>

//                       {/* ===== FOOTER ===== */}
//                       <div
//                         style={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                         }}
//                       >
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                           {dayjs(client.createdAt).format("MMM DD, YYYY")}
//                         </Text>

//                         <Space>
//                           {canManage && (
//                             <>
//                               <Button
//                                 type="text"
//                                 icon={<EditOutlined />}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   showEditModal(client);
//                                 }}
//                               />
//                               <Button
//                                 type="text"
//                                 danger
//                                 icon={<DeleteOutlined />}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   showDeleteModal(client);
//                                 }}
//                               />
//                             </>
//                           )}
//                         </Space>
//                       </div>
//                     </Card>
//                   </Col>
//                 ))}
//           </Row>
//         ) : (
//           <Card size="small">
//             <Table
//               columns={columns}
//               dataSource={clients}
//               rowKey="id"
//               loading={loading}
//               onRow={(record) => ({
//                 onClick: () => showViewModal(record),
//               })}
//               pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], //                 current: pagination.current,
//                 pageSize: pagination.pageSize,
//                 total: pagination.total,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) =>
//                   `${range[0]}-${range[1]} of ${total} clients`,
//                 onChange: (page, pageSize) =>
//                   setPagination((prev) => ({
//                     ...prev,
//                     current: page,
//                     pageSize: pageSize || 10,
//                   })),
//               }}
//               size="small"
//               scroll={{ x: 900 }}
//             />
//           </Card>
//         )}

//         {/*Modal*/}
//         <Modal
//           open={isModalVisible}
//           onCancel={() => {
//             setIsModalVisible(false);
//             form.resetFields();
//             setSelectedClient(null);
//           }}
//           footer={null}
//           width={700}
//           centered
//           destroyOnClose
//           styles={{
//             content: {
//               borderRadius: 20,
//               padding: 0,
//               overflow: "hidden",
//             },
//           }}
//         >
//           {selectedClient && modalType === "view" && (
//             <>
//               {/* ===== CLIENT HEADER (same as project modal header) ===== */}
//               <div
//                 className="client-view-header"
//                 style={{
//                   padding: "22px 24px",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 16,
//                 }}
//               >
//                 {/* Avatar */}
//                 <Avatar
//                   size={52}
//                   style={{
//                     background:
//                       "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
//                     fontWeight: 700,
//                     fontSize: 20,
//                   }}
//                 >
//                   {selectedClient.name?.[0]?.toUpperCase()}
//                 </Avatar>

//                 {/* Text block */}
//                 <div style={{ flex: 1 }}>
//                   {/* Name + Status (same row) */}
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "baseline", // 🔥 name straight, tag slightly lower
//                       gap: 8,
//                     }}
//                   >
//                     <Title level={4} style={{ margin: 0, color: "black" }}>
//                       {selectedClient.name}
//                     </Title>

                    
//                     <Tag
//                       color={selectedClient.isActive ? "green" : "red"}
//                       style={{
//                         fontWeight: 500,
//                         fontSize: 11, // 🔽 smaller text
//                         padding: "1px 5px", // 🔽 less height & width
//                         borderRadius: 3,
//                         //lineHeight: "14px", 
//                         display: "inline-block",
//                       }}
//                     >
//                       {selectedClient.isActive ? "ACTIVE" : "INACTIVE"}
//                     </Tag>
//                   </div>

//                   {/* Email below */}
//                   <Text style={{ color: "black", fontSize: 13 }}>
//                     {selectedClient.email || "—"}
//                   </Text>
//                 </div>
//               </div>

//               {/* ===== BODY ===== */}
            
//               <div style={{ padding: 24, background: "#fafcff" }}>
//                 <Row gutter={[16, 16]} align="stretch">
//                   {selectedClient.company && (
//                     <Col span={12}>
//                       <Card
//                         size="small"
//                         bordered={false}
//                         className="client-view-card"
//                       >
//                         <Text strong>Company</Text>
//                         <div style={{ marginTop: 6 }}>
//                           {selectedClient.company}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {selectedClient.contactPerson && (
//                     <Col span={12}>
//                       <Card
//                         size="small"
//                         bordered={false}
//                         className="client-view-card"
//                       >
//                         <Text strong>Contact Person</Text>
//                         <div style={{ marginTop: 6 }}>
//                           {selectedClient.contactPerson}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {selectedClient.phone && (
//                     <Col span={12}>
//                       <Card
//                         size="small"
//                         bordered={false}
//                         className="client-view-card"
//                       >
//                         <Text strong>Phone</Text>
//                         <div style={{ marginTop: 6 }}>
//                           {selectedClient.phone}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {selectedClient.address && (
//                     <Col span={24}>
//                       <Card
//                         size="small"
//                         bordered={false}
//                         className="client-view-card"
//                       >
//                         <Text strong>Address</Text>
//                         <div style={{ marginTop: 6 }}>
//                           {selectedClient.address}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {selectedClient.notes && (
//                     <Col span={12}>
//                       <Card
//                         size="small"
//                         bordered={false}
//                         className="client-view-card"
//                       >
//                         <Text strong>Notes</Text>
//                         <div style={{ marginTop: 6 }}>
//                           {selectedClient.notes}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   <Col span={12}>
//                     <Card
//                       size="small"
//                       bordered={false}
//                       className="client-view-card"
//                     >
//                       <Text strong>Created</Text>
//                       <div style={{ marginTop: 6, color: "#595959" }}>
//                         {dayjs(selectedClient.createdAt).format(
//                           "MMM DD, YYYY HH:mm",
//                         )}
//                       </div>
//                     </Card>
//                   </Col>

//                   {selectedClient.createdBy && (
//                     <Col span={12}>
//                       <Card
//                         size="small"
//                         bordered={false}
//                         className="client-view-card"
//                       >
//                         <Text strong>Created By</Text>
//                         <div style={{ marginTop: 6, color: "#595959" }}>
//                           {selectedClient.createdBy.name}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}
//                 </Row>
//               </div>

//               {/* ===== FOOTER ===== */}
//               <div
//                 style={{
//                   padding: "14px 20px",
//                   borderTop: "1px solid #f0f0f0",
//                   background: "#fff",
//                   display: "flex",
//                   justifyContent: "flex-end",
//                   gap: 10,
//                 }}
//               >
//                 <Button
//                   onClick={() => setIsModalVisible(false)}
//                   className="client-view-close-btn"
//                 >
//                   Close
//                 </Button>
//               </div>
//             </>
//           )}
//         </Modal>
//       </div>
//     </MainLayout>
//   );
// }

// "use client";

// import React, { useState, useEffect } from "react";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Card,
//   Table,
//   Button,
//   Input,
//   Select,
//   Space,
//   Typography,
//   Tag,
//   Modal,
//   Alert,
//   Row,
//   Col,
//   Statistic,
//   Avatar,
//   DatePicker,
// } from "antd";
// import {
//   SearchOutlined,
//   EyeOutlined,
//   TeamOutlined,
//   CalendarOutlined,
//   ShopOutlined,
//   MailOutlined,
//   PhoneOutlined,
//   UserOutlined,
//   AppstoreOutlined,
//   BarsOutlined,
//   EnvironmentOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import {
//   ClientService,
//   Client,
// } from "@/services/clientService";
// import type { ColumnsType } from "antd/es/table";
// import { useRBAC } from "@/lib/rbac";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;
// const { Option } = Select;

// export default function ClientsPage() {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();

//   // State management
//   const [clients, setClients] = useState<Client[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [stats, setStats] = useState<any>(null);

//   // Pagination and filtering
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string | undefined>(
//     undefined,
//   );

//   const [viewMode, setViewMode] = useState<"card" | "list">("card");

//   // View Client Modal (READ-ONLY)
//   const [viewClient, setViewClient] = useState<Client | null>(null);
//   const [viewModalOpen, setViewModalOpen] = useState(false);

//   // RBAC permissions
//   const rbac = useRBAC(user?.role as any);
//   const canManage = rbac?.canManageMembers;

//   // Check permissions
//   useEffect(() => {
//     if (user && !["super_admin", "admin", "user"].includes(user.role)) {
//       router.push("/dashboard");
//     }
//   }, [user, router]);

//   // Fetch clients
//   const fetchClients = async () => {
//     try {
//       setLoading(true);

//       const response = await ClientService.getClients({
//         page: pagination.current,
//         limit: pagination.pageSize,
//         search: searchTerm,
//         status: statusFilter,
//       });

//       setClients(response.data);
//       setPagination((prev) => ({
//         ...prev,
//         total: response.pagination.total,
//       }));
//     } catch (error) {
//       console.error("Failed to fetch clients:", error);
//       if (error instanceof Error) {
//         setError(error.message);
//       } else {
//         setError("Failed to fetch clients");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch stats
//   const fetchStats = async () => {
//     try {
//       const data = await ClientService.getClientStats();
//       setStats(data);
//     } catch (error) {
//       console.error("Failed to fetch stats:", error);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchClients();
//       fetchStats();
//     }
//   }, [user, pagination.current, pagination.pageSize, searchTerm, statusFilter]);

//   // Status color mapping
//   const getStatusColor = (isActive: boolean) => {
//     return isActive ? "green" : "red";
//   };

//   // Table columns (read-only)
//   const columns: ColumnsType<Client> = [
//     {
//       title: "Client",
//       key: "client",
//       width: 200,
//       render: (_, record: Client) => (
//         <Space>
//           <div
//             style={{
//               width: 40,
//               height: 40,
//               borderRadius: 20,
//               background: record.isActive ? "#52c41a" : "#ff4d4f",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               color: "#fff",
//               fontSize: 14,
//               fontWeight: 600,
//             }}
//           >
//             {record.name.charAt(0).toUpperCase()}
//           </div>
//           <div>
//             <Text strong style={{ fontSize: 13 }}>
//               {record.name}
//             </Text>
//             <br />
//             {record.company && (
//               <Text type="secondary" style={{ fontSize: 11 }}>
//                 {record.company}
//               </Text>
//             )}
//           </div>
//         </Space>
//       ),
//     },
//     {
//       title: "Contact",
//       key: "contact",
//       width: 200,
//       render: (_, record: Client) => (
//         <div>
//           <Space size={4}>
//             <MailOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
//             <Text style={{ fontSize: 12 }}>{record.email}</Text>
//           </Space>
//           <br />
//           {record.phone && (
//             <Space size={4}>
//               <PhoneOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
//               <Text type="secondary" style={{ fontSize: 11 }}>
//                 {record.phone}
//               </Text>
//             </Space>
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "Contact Person",
//       dataIndex: "contactPerson",
//       key: "contactPerson",
//       width: 150,
//       render: (contactPerson: string) => (
//         <Space size={4}>
//           <UserOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
//           <Text style={{ fontSize: 12 }}>{contactPerson || "-"}</Text>
//         </Space>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "isActive",
//       key: "isActive",
//       width: 100,
//       render: (isActive: boolean) => (
//         <Tag
//           color={getStatusColor(isActive)}
//           style={{ fontSize: 11, fontWeight: 500 }}
//         >
//           {isActive ? "ACTIVE" : "INACTIVE"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       width: 120,
//       render: (date: string) => (
//         <Text type="secondary" style={{ fontSize: 11 }}>
//           {dayjs(date).format("MMM DD, YYYY")}
//         </Text>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 80,
//       align: "center",
//       fixed: "right",
//       render: (_, record: Client) => (
//         <Button
//           type="text"
//           icon={<EyeOutlined />}
//           onClick={(e) => {
//             e.stopPropagation();
//             showViewModal(record);
//           }}
//         />
//       ),
//     },
//   ];

//   // Clear messages
//   useEffect(() => {
//     if (success || error) {
//       const timer = setTimeout(() => {
//         setSuccess("");
//         setError("");
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, error]);

//   const showViewModal = (client: Client) => {
//     setViewClient(client);
//     setViewModalOpen(true);
//   };

//   if (!user) {
//     return null;
//   }

//   return (
//     <MainLayout>
//       <div style={{ padding: 20 }}>
//         {/* Header */}
//         <div style={{ marginBottom: 20 }}>
//           <Row align="middle" justify="space-between">
//             {/* Left side - Title */}
//             <Col>
//               <Space align="center">
//                 <ShopOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//                 <Title level={3} style={{ margin: 0 }}>
//                   Clients
//                 </Title>
//               </Space>
//             </Col>

//             {/* Right side - Toggle */}
//             <Col>
//               <div
//                 style={{
//                   display: "flex",
//                   background: "#f5f5f5",
//                   borderRadius: 10,
//                   padding: 2,
//                   boxShadow: "inset 0 0 0 1px #d9d9d9",
//                 }}
//               >
//                 {/* Card View Button */}
//                 <Button
//                   type="text"
//                   icon={<AppstoreOutlined />}
//                   onClick={() => setViewMode("card")}
//                   style={{
//                     borderRadius: 8,
//                     padding: "4px 14px",
//                     fontWeight: 500,
//                     background:
//                       viewMode === "card" ? "#1677ff" : "transparent",
//                     color: viewMode === "card" ? "#fff" : "#595959",
//                     transition: "all 0.25s ease",
//                   }}
//                 >
//                   Card
//                 </Button>

//                 {/* List View Button */}
//                 <Button
//                   type="text"
//                   icon={<BarsOutlined />}
//                   onClick={() => setViewMode("list")}
//                   style={{
//                     borderRadius: 8,
//                     padding: "4px 14px",
//                     fontWeight: 500,
//                     background:
//                       viewMode === "list" ? "#1677ff" : "transparent",
//                     color: viewMode === "list" ? "#fff" : "#595959",
//                     transition: "all 0.25s ease",
//                   }}
//                 >
//                   List
//                 </Button>
//               </div>
//             </Col>
//           </Row>
//         </div>

//         {/* Alerts */}
//         {error && (
//           <Alert
//             message={error}
//             type="error"
//             showIcon
//             closable
//             style={{ marginBottom: 16, fontSize: 13 }}
//             onClose={() => setError("")}
//           />
//         )}
//         {success && (
//           <Alert
//             message={success}
//             type="success"
//             showIcon
//             closable
//             style={{ marginBottom: 16, fontSize: 13 }}
//             onClose={() => setSuccess("")}
//           />
//         )}

//         {/* Stats Cards */}
//         {stats && (
//           <Row gutter={16} style={{ marginBottom: 16 }}>
//             <Col xs={24} sm={8}>
//               <Card size="small">
//                 <Statistic
//                   title="Total Clients"
//                   value={stats.overview.totalClients}
//                   valueStyle={{ color: "#1677ff" }}
//                 />
//               </Card>
//             </Col>
//             <Col xs={24} sm={8}>
//               <Card size="small">
//                 <Statistic
//                   title="Active Clients"
//                   value={stats.overview.activeClients}
//                   valueStyle={{ color: "#52c41a" }}
//                 />
//               </Card>
//             </Col>
//             <Col xs={24} sm={8}>
//               <Card size="small">
//                 <Statistic
//                   title="Inactive Clients"
//                   value={stats.overview.inactiveClients}
//                   valueStyle={{ color: "#ff4d4f" }}
//                 />
//               </Card>
//             </Col>
//           </Row>
//         )}

//         {/* Filters Card */}
//         <Card size="small" style={{ marginBottom: 16 }}>
//           <Space wrap size={12}>
//             <Input
//               placeholder="Search clients..."
//               prefix={<SearchOutlined />}
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{ width: 240 }}
//               allowClear
//             />

//             <Select
//               placeholder="Filter by status"
//               value={statusFilter}
//               onChange={setStatusFilter}
//               style={{ width: 150 }}
//               allowClear
//             >
//               <Option value="active">Active</Option>
//               <Option value="inactive">Inactive</Option>
//             </Select>
//           </Space>
//         </Card>

//         {/* All Clients Section */}
//         <div style={{ marginBottom: 16 }}>
//           <Text strong style={{ fontSize: 15 }}>
//             <TeamOutlined style={{ marginRight: 6 }} />
//             All Clients
//           </Text>
//         </div>

//         {/* Clients Card View - Same style as Projects */}
//         {viewMode === "card" ? (
//           <Row gutter={[24, 24]}>
//             {loading
//               ? [1, 2, 3, 4].map((i) => (
//                   <Col xs={24} sm={12} lg={8} xl={6} key={i}>
//                     <Card
//                       loading
//                       style={{
//                         height: 180,
//                         borderRadius: 12,
//                       }}
//                     />
//                   </Col>
//                 ))
//               : clients.map((client) => (
//                   <Col xs={24} sm={12} lg={8} xl={6} key={client.id}>
//                     <Card
//                       hoverable
//                       onClick={() => showViewModal(client)}
//                       style={{
//                         borderRadius: 12,
//                         border: "1px solid #f0f0f0",
//                         transition: "all 0.2s",
//                         height: "100%",
//                       }}
//                       styles={{ body: { padding: "16px 18px" } }}
//                     >
//                       {/* Line 1: Avatar + Name + Status Tag */}
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "space-between",
//                           marginBottom: 12,
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: 8,
//                             flex: 1,
//                             minWidth: 0,
//                           }}
//                         >

//                              <Avatar
//                   size={32}
//                   style={{
//                     background:
//                       "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
//                     fontWeight: 600,
//                     fontSize: 14,
//                   }}
//                 >
//                   {client.name?.[0]?.toUpperCase()}
//                 </Avatar>
//                           <Text strong ellipsis style={{ fontSize: 15 }}>
//                             {client.name}
//                           </Text>
                          
//                           <Tag
//                             color={getStatusColor(client.isActive)}
//                             style={{
//                               margin: 0,
//                               fontSize: 10,
//                               borderRadius: 3,
//                               padding: "1px 5px",
//                               flexShrink: 0,
//                               lineHeight: 1.2,
//                               height: "auto",
//                             }}
//                           >
//                             {client.isActive ? "ACTIVE" : "INACTIVE"}
//                           </Tag>
//                         </div>
//                       </div>

//                       {/* Line 2: Company Name */}
//                       {client.company && (
//                         <div
//                           style={{
//                             marginBottom: 12,
//                             fontSize: 13,
//                             color: "#595959",
//                             display: "flex",
//                             alignItems: "center",
//                             gap: 6,
//                           }}
//                         >
//                           <ShopOutlined
//                             style={{ color: "#8c8c8c", fontSize: 12 }}
//                           />
//                           <Text style={{ fontSize: 13 }}>
//                             {client.company}
//                           </Text>
//                         </div>
//                       )}

//                       {/* Line 3: Contact Info */}
//                       <div
//                         style={{
//                           display: "flex",
//                           flexDirection: "column",
//                           gap: 6,
//                           marginTop: 8,
//                           paddingTop: 8,
//                           fontSize: 12,
//                           color: "#8c8c8c",
//                         }}
//                       >
//                         <span>
//                           <MailOutlined style={{ marginRight: 4, fontSize: 11 }} />
//                           {client.email || "—"}
//                         </span>
//                         {client.phone && (
//                           <span>
//                             <PhoneOutlined style={{ marginRight: 4, fontSize: 11 }} />
//                             {client.phone}
//                           </span>
//                         )}
//                         {client.contactPerson && (
//                           <span>
//                             <UserOutlined style={{ marginRight: 4, fontSize: 11 }} />
//                             {client.contactPerson}
//                           </span>
//                         )}
//                         {client.address && (
//                           <span>
//                             <EnvironmentOutlined style={{ marginRight: 4, fontSize: 11 }} />
//                             <Text ellipsis style={{ fontSize: 11, color: "#8c8c8c" }}>
//                               {client.address}
//                             </Text>
//                           </span>
//                         )}
//                       </div>

//                       {/* Line 4: Created Date */}
//                       <div
//                         style={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                           marginTop: 12,
//                           paddingTop: 8,
//                           borderTop: "1px dashed #f0f0f0",
//                         }}
//                       >
//                         <Text type="secondary" style={{ fontSize: 11 }}>
//                           <CalendarOutlined style={{ marginRight: 4 }} />
//                           {dayjs(client.createdAt).format("MMM DD, YYYY")}
//                         </Text>
//                       </div>
//                     </Card>
//                   </Col>
//                 ))}
//           </Row>
//         ) : (
//           <Card size="small">
//             <Table
//               columns={columns}
//               dataSource={clients}
//               rowKey="id"
//               loading={loading}
//               onRow={(record) => ({
//                 onClick: () => showViewModal(record),
//               })}
//               pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], //                 current: pagination.current,
//                 pageSize: pagination.pageSize,
//                 total: pagination.total,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) =>
//                   `${range[0]}-${range[1]} of ${total} clients`,
//                 onChange: (page, pageSize) =>
//                   setPagination((prev) => ({
//                     ...prev,
//                     current: page,
//                     pageSize: pageSize || 10,
//                   })),
//               }}
//               size="small"
//               scroll={{ x: 900 }}
//             />
//           </Card>
//         )}

//         {/* View Modal (Read-only) - Same style as Projects */}
//         <Modal
//           open={viewModalOpen}
//           onCancel={() => {
//             setViewModalOpen(false);
//             setViewClient(null);
//           }}
//           footer={null}
//           width={760}
//           centered
//           destroyOnClose
//           styles={{
//             content: {
//               borderRadius: 20,
//               padding: 0,
//               overflow: "hidden",
//             },
//           }}
//         >
//           {viewClient && (
//             <>
//               {/* Header */}
//               <div
//                 style={{
//                   padding: "22px 24px",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 16,
//                 }}
//               >
//                 <Avatar
//                   size={52}
//                   style={{
//                     background: viewClient.isActive
//                       ? "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)"
//                       : "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
//                     fontWeight: 700,
//                     fontSize: 20,
//                   }}
//                 >
//                   {viewClient.name?.[0]?.toUpperCase()}
//                 </Avatar>

//                 <div style={{ flex: 1 }}>
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "baseline",
//                       gap: 8,
//                     }}
//                   >
//                     <Title level={4} style={{ margin: 0, color: "black" }}>
//                       {viewClient.name}
//                     </Title>

//                     <Tag
//                       color={getStatusColor(viewClient.isActive)}
//                       style={{
//                         fontWeight: 600,
//                         fontSize: 11,
//                         padding: "2px 6px",
//                         borderRadius: 4,
//                         width: "fit-content",
//                         display: "inline-block",
//                       }}
//                     >
//                       {viewClient.isActive ? "ACTIVE" : "INACTIVE"}
//                     </Tag>
//                   </div>

//                   <Text style={{ color: "black", fontSize: 13 }}>
//                     {viewClient.email || "—"}
//                   </Text>
//                 </div>
//               </div>

//               {/* Body */}
//               <div style={{ padding: 24, background: "#fafcff" }}>
//                 <Row gutter={[16, 16]}>
//                   {viewClient.company && (
//                     <Col span={12}>
//                       <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                         <Space>
//                           <ShopOutlined style={{ color: "#1677ff" }} />
//                           <Text strong>Company</Text>
//                         </Space>
//                         <div style={{ marginTop: 6 }}>
//                           {viewClient.company}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {viewClient.contactPerson && (
//                     <Col span={12}>
//                       <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                         <Space>
//                           <UserOutlined style={{ color: "#1677ff" }} />
//                           <Text strong>Contact Person</Text>
//                         </Space>
//                         <div style={{ marginTop: 6 }}>
//                           {viewClient.contactPerson}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {viewClient.phone && (
//                     <Col span={12}>
//                       <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                         <Space>
//                           <PhoneOutlined style={{ color: "#1677ff" }} />
//                           <Text strong>Phone</Text>
//                         </Space>
//                         <div style={{ marginTop: 6 }}>
//                           {viewClient.phone}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {viewClient.address && (
//                     <Col span={12}>
//                       <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                         <Space>
//                           <EnvironmentOutlined style={{ color: "#1677ff" }} />
//                           <Text strong>Address</Text>
//                         </Space>
//                         <div style={{ marginTop: 6 }}>
//                           {viewClient.address}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   {viewClient.notes && (
//                     <Col span={24}>
//                       <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                         <Space>
//                           <MailOutlined style={{ color: "#1677ff" }} />
//                           <Text strong>Notes</Text>
//                         </Space>
//                         <div style={{ marginTop: 6, color: "#595959" }}>
//                           {viewClient.notes}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}

//                   <Col span={12}>
//                     <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                       <Space>
//                         <CalendarOutlined style={{ color: "#1677ff" }} />
//                         <Text strong>Created</Text>
//                       </Space>
//                       <div style={{ marginTop: 6, color: "#595959" }}>
//                         {dayjs(viewClient.createdAt).format("MMM DD, YYYY HH:mm")}
//                       </div>
//                     </Card>
//                   </Col>

//                   {viewClient.createdBy && (
//                     <Col span={12}>
//                       <Card size="small" bordered={false} style={{ background: "#fff" }}>
//                         <Space>
//                           <UserOutlined style={{ color: "#1677ff" }} />
//                           <Text strong>Created By</Text>
//                         </Space>
//                         <div style={{ marginTop: 6, color: "#595959" }}>
//                           {viewClient.createdBy.name}
//                         </div>
//                       </Card>
//                     </Col>
//                   )}
//                 </Row>
//               </div>

//               {/* Footer */}
//               <div
//                 style={{
//                   padding: "14px 20px",
//                   borderTop: "1px solid #f0f0f0",
//                   background: "#fff",
//                   display: "flex",
//                   justifyContent: "flex-end",
//                   alignItems: "center",
//                 }}
//               >
//                 <Button
//                   onClick={() => {
//                     setViewModalOpen(false);
//                     setViewClient(null);
//                   }}
//                 >
//                   Close
//                 </Button>
//               </div>
//             </>
//           )}
//         </Modal>
//       </div>
//     </MainLayout>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Modal,
  Alert,
  Row,
  Col,
  Statistic,
  Avatar,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
  CalendarOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  ClientService,
  Client,
} from "@/services/clientService";
import type { ColumnsType } from "antd/es/table";
import { usePermission } from "@/hooks/usePermission";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ClientsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State management
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState<any>(null);

  // Pagination and filtering
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // View Client Modal (READ-ONLY)
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // RBAC permissions
  const { canReadClient, canManageClients: canManage } = usePermission();

  // Check permissions
  useEffect(() => {
    if (user && !canReadClient) {
      router.push("/dashboard");
    }
  }, [user, canReadClient, router]);

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);

      const response = await ClientService.getClients({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm,
        status: statusFilter,
      });

      setClients(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to fetch clients");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await ClientService.getClientStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchStats();
    }
  }, [user, pagination.current, pagination.pageSize, searchTerm, statusFilter]);

  // Status color mapping
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "green" : "red";
  };

  // Table columns (read-only)
  const columns: ColumnsType<Client> = [
    {
      title: "Client",
      key: "client",
      width: 200,
      render: (_, record: Client) => (
        <Space>
          <Avatar
            size={32}
            style={{
              background: record.isActive ? "#52c41a" : "#ff4d4f",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {record.name}
            </Text>
            <br />
            {record.company && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.company}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 200,
      render: (_, record: Client) => (
        <div>
          <Space size={4}>
            <MailOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
            <Text style={{ fontSize: 12 }}>{record.email}</Text>
          </Space>
          <br />
          {record.phone && (
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.phone}
              </Text>
            </Space>
          )}
        </div>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      key: "contactPerson",
      width: 150,
      render: (contactPerson: string) => (
        <Space size={4}>
          <UserOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
          <Text style={{ fontSize: 12 }}>{contactPerson || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag
          color={getStatusColor(isActive)}
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {dayjs(date).format("MMM DD, YYYY")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record: Client) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            showViewModal(record);
          }}
        />
      ),
    },
  ];

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const showViewModal = (client: Client) => {
    setViewClient(client);
    setViewModalOpen(true);
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Row align="middle" justify="space-between">
            {/* Left side - Title */}
            <Col>
              <Space align="center">
                <ShopOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                <Title level={3} style={{ margin: 0 }}>
                  Clients
                </Title>
              </Space>
            </Col>

            {/* Right side - Toggle */}
            <Col>
              <div
                style={{
                  display: "flex",
                  background: "#f5f5f5",
                  borderRadius: 10,
                  padding: 2,
                  boxShadow: "inset 0 0 0 1px #d9d9d9",
                }}
              >
                {/* Card View Button */}
                <Button
                  type="text"
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("card")}
                  style={{
                    borderRadius: 8,
                    padding: "4px 14px",
                    fontWeight: 500,
                    background:
                      viewMode === "card" ? "#1677ff" : "transparent",
                    color: viewMode === "card" ? "#fff" : "#595959",
                    transition: "all 0.25s ease",
                  }}
                >
                  Card
                </Button>

                {/* List View Button */}
                <Button
                  type="text"
                  icon={<BarsOutlined />}
                  onClick={() => setViewMode("list")}
                  style={{
                    borderRadius: 8,
                    padding: "4px 14px",
                    fontWeight: 500,
                    background:
                      viewMode === "list" ? "#1677ff" : "transparent",
                    color: viewMode === "list" ? "#fff" : "#595959",
                    transition: "all 0.25s ease",
                  }}
                >
                  List
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setError("")}
          />
        )}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Stats Cards */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Clients"
                  value={stats.overview.totalClients}
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Active Clients"
                  value={stats.overview.activeClients}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Inactive Clients"
                  value={stats.overview.inactiveClients}
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters Card */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap size={12}>
            <Input
              placeholder="Search clients..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />

            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Space>
        </Card>


        {/* Clients Card View - EXACT same style as Projects */}
        {viewMode === "card" ? (
          <Row gutter={[24, 24]}>
            {loading
              ? [1, 2, 3, 4,5].map((i) => (
                  <Col xs={24} sm={12} lg={8} xl={8} key={i}>
                    <Card
                      loading
                      style={{
                        height: 180,
                        borderRadius: 12,
                      }}
                    />
                  </Col>
                ))
              : clients.map((client) => (
                  <Col xs={24} sm={8} lg={8} xl={6} key={client.id}>
                    <Card
                      hoverable
                      onClick={() => showViewModal(client)}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #f0f0f0",
                        transition: "all 0.2s",
                        height: "100%",
                      }}
                      styles={{ body: { padding: "16px 18px" } }}
                    >
                      {/* LINE 1: Avatar + Name + Status Tag */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Avatar
                            size={32}
                            style={{
                              // background: client.isActive ? "#52c41a" : "#ff4d4f",
                               background:
                              "linear-gradient(135deg, #1677ff, #69b1ff)",
                              fontWeight: 600,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {client.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Text strong ellipsis style={{ fontSize: 15 }}>
                            {client.name}
                          </Text>
                          
                          <Tag
                            color={client.isActive ? "green" : "red"}
                            style={{
                              margin: 0,
                              fontSize: 10,
                              borderRadius: 3,
                              padding: "1px 5px",
                              flexShrink: 0,
                              lineHeight: 1.2,
                              height: "auto",
                            }}
                          >
                            {client.isActive ? "ACTIVE" : "INACTIVE"}
                          </Tag>
                        </div>
                      </div>

                      {/* LINE 2: Company Name (like Project Manager in projects) */}
                      {client.company && (
                        <div
                          style={{
                            marginBottom: 12,
                            fontSize: 13,
                            color: "#595959",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <ShopOutlined
                            style={{ color: "#8c8c8c", fontSize: 12 }}
                          />
                          <Text style={{ fontSize: 13 }}>
                            {client.company}
                          </Text>
                        </div>
                      )}

                      {/* LINE 3: Email and Contact Info (like Members + Dates in projects) */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                          paddingTop: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            fontSize: 12,
                            color: "#8c8c8c",
                          }}
                        >
                          <span>
                            <MailOutlined style={{ marginRight: 4 }} />
                            {client.email || "—"}
                          </span>
                          {client.phone && (
                            <span>
                              <PhoneOutlined style={{ marginRight: 4 }} />
                              {client.phone}
                            </span>
                          )}
                        </div>

                        {/* Created Date on right side */}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {dayjs(client.createdAt).format("MMM DD")}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
          </Row>
        ) : (
          <Card size="small">
            <Table
              columns={columns}
              dataSource={clients}
              rowKey="id"
              loading={loading}
              onRow={(record) => ({
                onClick: () => showViewModal(record),
              })}
              pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} clients`,
                onChange: (page, pageSize) =>
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || 20,
                  })),
              }}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        )}

        {/* View Modal (Read-only) */}
        <Modal
          open={viewModalOpen}
          onCancel={() => {
            setViewModalOpen(false);
            setViewClient(null);
          }}
          footer={null}
          width={760}
          centered
          destroyOnClose
          styles={{
            content: {
              borderRadius: 20,
              padding: 0,
              overflow: "hidden",
            },
          }}
        >
          {viewClient && (
            <>
              {/* Header */}
              <div
                style={{
                  padding: "22px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Avatar
                  size={52}
                  style={{
                    background: viewClient.isActive
                      ? "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)"
                      : "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {viewClient.name?.[0]?.toUpperCase()}
                </Avatar>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <Title level={4} style={{ margin: 0, color: "black" }}>
                      {viewClient.name}
                    </Title>

                    <Tag
                      color={viewClient.isActive ? "green" : "red"}
                      style={{
                        fontWeight: 600,
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 4,
                        width: "fit-content",
                        display: "inline-block",
                      }}
                    >
                      {viewClient.isActive ? "ACTIVE" : "INACTIVE"}
                    </Tag>
                  </div>

                  <Text style={{ color: "black", fontSize: 13 }}>
                    {viewClient.email || "—"}
                  </Text>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 24, background: "#fafcff" }}>
                <Row gutter={[16, 16]}>
                  {viewClient.company && (
                    <Col span={12}>
                      <Card size="small" bordered={false} style={{ background: "#fff" }}>
                        <Space>
                          <ShopOutlined style={{ color: "#1677ff" }} />
                          <Text strong>Company</Text>
                        </Space>
                        <div style={{ marginTop: 6 }}>
                          {viewClient.company}
                        </div>
                      </Card>
                    </Col>
                  )}

                  {viewClient.contactPerson && (
                    <Col span={12}>
                      <Card size="small" bordered={false} style={{ background: "#fff" }}>
                        <Space>
                          <UserOutlined style={{ color: "#1677ff" }} />
                          <Text strong>Contact Person</Text>
                        </Space>
                        <div style={{ marginTop: 6 }}>
                          {viewClient.contactPerson}
                        </div>
                      </Card>
                    </Col>
                  )}

                  {viewClient.phone && (
                    <Col span={12}>
                      <Card size="small" bordered={false} style={{ background: "#fff" }}>
                        <Space>
                          <PhoneOutlined style={{ color: "#1677ff" }} />
                          <Text strong>Phone</Text>
                        </Space>
                        <div style={{ marginTop: 6 }}>
                          {viewClient.phone}
                        </div>
                      </Card>
                    </Col>
                  )}

                  {viewClient.address && (
                    <Col span={12}>
                      <Card size="small" bordered={false} style={{ background: "#fff" }}>
                        <Space>
                          <EnvironmentOutlined style={{ color: "#1677ff" }} />
                          <Text strong>Address</Text>
                        </Space>
                        <div style={{ marginTop: 6 }}>
                          {viewClient.address}
                        </div>
                      </Card>
                    </Col>
                  )}

                  {viewClient.notes && (
                    <Col span={24}>
                      <Card size="small" bordered={false} style={{ background: "#fff" }}>
                        <Space>
                          <MailOutlined style={{ color: "#1677ff" }} />
                          <Text strong>Notes</Text>
                        </Space>
                        <div style={{ marginTop: 6, color: "#595959" }}>
                          {viewClient.notes}
                        </div>
                      </Card>
                    </Col>
                  )}

                  <Col span={12}>
                    <Card size="small" bordered={false} style={{ background: "#fff" }}>
                      <Space>
                        <CalendarOutlined style={{ color: "#1677ff" }} />
                        <Text strong>Created</Text>
                      </Space>
                      <div style={{ marginTop: 6, color: "#595959" }}>
                        {dayjs(viewClient.createdAt).format("MMM DD, YYYY HH:mm")}
                      </div>
                    </Card>
                  </Col>

                  {viewClient.createdBy && (
                    <Col span={12}>
                      <Card size="small" bordered={false} style={{ background: "#fff" }}>
                        <Space>
                          <UserOutlined style={{ color: "#1677ff" }} />
                          <Text strong>Created By</Text>
                        </Space>
                        <div style={{ marginTop: 6, color: "#595959" }}>
                          {viewClient.createdBy.name}
                        </div>
                      </Card>
                    </Col>
                  )}
                </Row>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #f0f0f0",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <Button
                  onClick={() => {
                    setViewModalOpen(false);
                    setViewClient(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}