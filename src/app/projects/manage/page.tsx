// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Table,
//   Button,
//   Input,
//   Select,
//   Space,
//   Modal,
//   Form,
//   Alert,
//   Popconfirm,
//   Tag,
//   DatePicker,
//   Card,
//   Row,
//   Col,
//   Tooltip,
//   Avatar,
//   Typography,
//   message,
//   Segmented,
// } from "antd";
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   EyeOutlined,
//   TeamOutlined,
//   CalendarOutlined,
//   ProjectOutlined,
//   AppstoreOutlined,
//   BarsOutlined,
//   UserOutlined,
// } from "@ant-design/icons";
// import type { ColumnsType } from "antd/es/table";
// import dayjs from "dayjs";
// import {
//   ProjectService,
//   Project,
//   CreateProjectData,
//   UpdateProjectData,
//   ProjectsFilters,
// } from "@/services/projectService";
// import { MembersService } from "@/services/membersService";
// import { useAuth } from "@/context/AuthContext";
// import { RBAC } from "@/lib/rbac";
// import MainLayout from "@/components/layout/MainLayout";

// const { Title, Text } = Typography;
// const { Search } = Input;
// const { Option } = Select;
// const { RangePicker } = DatePicker;

// interface Member {
//   value: string;
//   label: string;
//   position: string;
// }

// const ProjectsManagePage: React.FC = () => {
//   const { user, isLoading } = useAuth();
//   const [form] = Form.useForm();

//   // State management
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editingProject, setEditingProject] = useState<Project | null>(null);
//   const [members, setMembers] = useState<Member[]>([]);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });

//   const [viewMode, setViewMode] = useState<"card" | "table">("card");

//   // View Project Modal (READ-ONLY)
//   const [viewProject, setViewProject] = useState<Project | null>(null);
//   const [viewModalOpen, setViewModalOpen] = useState(false);

//   // Filters
//   const [filters, setFilters] = useState<ProjectsFilters>({
//     page: 1,
//     limit: 10,
//   });

//   // Load data
//   const loadProjects = async () => {
//     try {
//       setLoading(true);
//       const response = await ProjectService.getProjects(filters);
//       setProjects(response.data);
//       console.log({ projects: response.data });
//       setPagination({
//         current: response.pagination.current,
//         pageSize: response.pagination.pageSize,
//         total: response.pagination.total,
//       });
//     } catch (error) {
//       message.error("Failed to load projects");
//       console.error("Error loading projects:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadMembers = async () => {
//     try {
//       const membersList = await MembersService.getMembersForSelect();
//       setMembers(membersList);
//     } catch (error) {
//       message.error("Failed to load members");
//       console.error("Error loading members:", error);
//     }
//   };

//   useEffect(() => {
//     loadProjects();
//     loadMembers();
//   }, [filters]);

//   // Handle project manager change - automatically add to team members
//   const handleProjectManagerChange = (projectManagerId: string) => {
//     const teamMemberIds = form.getFieldValue("teamMemberIds") || [];

//     if (projectManagerId && !teamMemberIds.includes(projectManagerId)) {
//       // Add project manager to team members if not already included
//       form.setFieldsValue({
//         teamMemberIds: [...teamMemberIds, projectManagerId],
//       });
//     }
//   };

//   // Handle team members change - prevent removing project manager
//   const handleTeamMembersChange = (selectedIds: string[]) => {
//     const projectManagerId = form.getFieldValue("projectManagerId");

//     if (projectManagerId && !selectedIds.includes(projectManagerId)) {
//       // If project manager was removed, add them back
//       message.warning("Project Manager must be included in the team");
//       form.setFieldsValue({
//         teamMemberIds: [...selectedIds, projectManagerId],
//       });
//     }
//   };

//   // Handle table pagination
//   const handleTableChange = (pagination: any) => {
//     setFilters((prev) => ({
//       ...prev,
//       page: pagination.current,
//       limit: pagination.pageSize,
//     }));
//   };

//   // Handle search
//   const handleSearch = (value: string) => {
//     setFilters((prev) => ({
//       ...prev,
//       search: value || undefined,
//       page: 1,
//     }));
//   };

//   // Handle status filter
//   const handleStatusFilter = (status: string) => {
//     setFilters((prev) => ({
//       ...prev,
//       status: status || undefined,
//       page: 1,
//     }));
//   };

//   // Handle project manager filter
//   const handleProjectManagerFilter = (projectManager: string) => {
//     setFilters((prev) => ({
//       ...prev,
//       projectManagerId: projectManager || undefined,
//       page: 1,
//     }));
//   };

//   // Handle date range filter
//   const handleDateRangeFilter = (dates: any) => {
//     if (dates && dates.length === 2) {
//       setFilters((prev) => ({
//         ...prev,
//         startDate: dates[0].format("YYYY-MM-DD"),
//         endDate: dates[1].format("YYYY-MM-DD"),
//         page: 1,
//       }));
//     } else {
//       setFilters((prev) => ({
//         ...prev,
//         startDate: undefined,
//         endDate: undefined,
//         page: 1,
//       }));
//     }
//   };

//   // Handle create/edit project
//   const handleSubmit = async (values: any) => {
//     try {
//       setError("");
//       const projectData = {
//         ...values,
//         startDate: values.startDate.format("YYYY-MM-DD"),
//         endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
//         code: values.code || null,
//         repositories: values.repositories || null,
//       };

//       if (editingProject) {
//         await ProjectService.updateProject(
//           editingProject.id,
//           projectData as UpdateProjectData,
//         );
//         setSuccess("Project updated successfully");
//       } else {
//         await ProjectService.createProject(projectData as CreateProjectData);
//         setSuccess("Project created successfully");
//       }

//       setModalVisible(false);
//       setEditingProject(null);
//       form.resetFields();
//       loadProjects();
//     } catch (error: any) {
//       setError(error.message || "Failed to save project");
//     }
//   };

//   // Handle delete project
//   const handleDelete = async (id: string) => {
//     try {
//       setError("");
//       await ProjectService.deleteProject(id);
//       setSuccess("Project deleted successfully");
//       loadProjects();
//     } catch (error: any) {
//       setError(error.message || "Failed to delete project");
//     }
//   };

//   // Handle edit
//   const handleEdit = (project: Project) => {
//     setEditingProject(project);
//     form.setFieldsValue({
//       ...project,
//       startDate: dayjs(project.startDate),
//       endDate: project.endDate ? dayjs(project.endDate) : null,
//       projectManagerId: project.projectManager.id,
//       teamMemberIds: project.members.map((member) => member.user.id),
//     });
//     setModalVisible(true);
//   };

//   // Handle add new
//   const handleAdd = () => {
//     setEditingProject(null);
//     form.resetFields();
//     form.setFieldsValue({
//       status: "planning",
//       defaultPriority: "medium",
//     });
//     setModalVisible(true);
//   };

//   // Status color mapping
//   const getStatusColor = (status: string) => {
//     const colors = {
//       planning: "blue",
//       active: "green",
//       "on-hold": "orange",
//       completed: "purple",
//       cancelled: "red",
//     };
//     return colors[status as keyof typeof colors] || "default";
//   };

//   // Priority color mapping
//   const getPriorityColor = (priority: string) => {
//     const colors = {
//       high: "red",
//       medium: "orange",
//       low: "green",
//     };
//     return colors[priority as keyof typeof colors] || "default";
//   };

//   // Table columns
//   const columns: ColumnsType<Project> = [
//     {
//       title: "Project",
//       key: "project",
//       render: (_, record) => (
//         <div>
//           <div className="font-medium">{record.name}</div>
//           <div className="text-sm text-gray-500">{record.code}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Description",
//       dataIndex: "description",
//       key: "description",
//       ellipsis: true,
//       render: (text) => (
//         <Tooltip title={text}>
//           <span>{text}</span>
//         </Tooltip>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status.toUpperCase().replace("-", " ")}
//         </Tag>
//       ),
//     },
//     {
//       title: "Project Manager",
//       key: "projectManager",
//       render: (_, record) => (
//         <div className="flex items-center space-x-2">
//           <Avatar size="small">{record?.projectManager?.name.charAt(0)}</Avatar>
//           <div>
//             <div className="font-medium">{record?.projectManager?.name}</div>
//             <div className="text-sm text-gray-500">
//               {record.projectManager?.position}
//             </div>
//           </div>
//         </div>
//       ),
//     },
//     {
//       title: "Team",
//       key: "teamMembers",
//       render: (_, record) => (
//         <div className="flex items-center space-x-1">
//           <TeamOutlined />
//           <span>{record?.members?.length || 0} members</span>
//         </div>
//       ),
//     },
//     {
//       title: "Priority",
//       dataIndex: "defaultPriority",
//       key: "defaultPriority",
//       render: (priority) => (
//         <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
//       ),
//     },
//     {
//       title: "Dates",
//       key: "dates",
//       render: (_, record) => (
//         <div className="text-sm">
//           <div>Start: {dayjs(record?.startDate).format("MMM DD, YYYY")}</div>
//           {record.endDate && (
//             <div>End: {dayjs(record?.endDate).format("MMM DD, YYYY")}</div>
//           )}
//         </div>
//       ),
//     },
//     // {
//     //   title: 'Statistics',
//     //   key: 'statistics',
//     //   render: (_, record) => (
//     //     <div className="text-sm">
//     //       <div>Total: {record.statistics.totalTickets}</div>
//     //       <div>Completed: {record.statistics.completedTickets}</div>
//     //     </div>
//     //   ),
//     // },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, record) => (
//         <Space>
//           <Tooltip title="View Details">
//             <Button
//               type="text"
//               icon={<EyeOutlined />}
//               onClick={() => openViewModal(record)}
//             />
//           </Tooltip>
//           {user?.role &&
//             RBAC.hasPermission(user.role as any, "projects", "update") && (
//               <Tooltip title="Edit">
//                 <Button
//                   type="text"
//                   icon={<EditOutlined />}
//                   onClick={() => handleEdit(record)}
//                 />
//               </Tooltip>
//             )}
//           {user?.role &&
//             RBAC.hasPermission(user.role as any, "projects", "delete") && (
//               <Popconfirm
//                 title="Are you sure you want to delete this project?"
//                 description="This action cannot be undone and may affect related tickets."
//                 onConfirm={() => handleDelete(record.id)}
//                 okText="Yes"
//                 cancelText="No"
//               >
//                 <Tooltip title="Delete">
//                   <Button type="text" danger icon={<DeleteOutlined />} />
//                 </Tooltip>
//               </Popconfirm>
//             )}
//         </Space>
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

//   // Don't render if no user and not loading
//   if (!user && !isLoading) {
//     return null;
//   }

//   // Check permissions
//   if (
//     user &&
//     (!user.role || !RBAC.hasPermission(user.role as any, "projects", "read"))
//   ) {
//     return (
//       <MainLayout>
//         <div style={{ padding: 20 }}>
//           <div className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <h3 className="text-lg font-medium text-gray-900">
//                 Access Denied
//               </h3>
//               <p className="text-gray-500">
//                 You don't have permission to view projects.
//               </p>
//             </div>
//           </div>
//         </div>
//       </MainLayout>
//     );
//   }
//   const openViewModal = (project: Project) => {
//     setViewProject(project);
//     setViewModalOpen(true);
//   };

//   return (
//     <MainLayout>
//       <div style={{ padding: 20 }}>
//         {/* Header */}
//         <div style={{ marginBottom: 20 }}>
//           <Space
//             align="center"
//             style={{ width: "100%", justifyContent: "space-between" }}
//           >
//             {/* Left title */}
//             <Space align="center">
//               <ProjectOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Projects Management
//               </Title>
//             </Space>

//             {/* Right controls */}
//             <Space>
//               {/* Card / List Toggle */}
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
//                     background: viewMode === "card" ? "#1677ff" : "transparent",
//                     color: viewMode === "card" ? "#fff" : "#595959",
//                     transition: "all 0.25s ease",
//                   }}
//                 >
//                   Card
//                 </Button>

//                 {/* Table View Button */}
//                 <Button
//                   type="text"
//                   icon={<BarsOutlined />}
//                   onClick={() => setViewMode("table")}
//                   style={{
//                     borderRadius: 8,
//                     padding: "4px 14px",
//                     fontWeight: 500,
//                     background:
//                       viewMode === "table" ? "#1677ff" : "transparent",
//                     color: viewMode === "table" ? "#fff" : "#595959",
//                     transition: "all 0.25s ease",
//                   }}
//                 >
//                   List
//                 </Button>
//               </div>

//               {/* Add Project */}
//               {user?.role &&
//                 RBAC.hasPermission(user.role as any, "projects", "create") && (
//                   <Button
//                     type="primary"
//                     icon={<PlusOutlined />}
//                     onClick={handleAdd}
//                   >
//                     Add Project
//                   </Button>
//                 )}
//             </Space>
//           </Space>
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

//         {/* Filters Card */}
//         <Card
//           size="small"
//           style={{ marginBottom: 16 }}
//           styles={{ body: { padding: 16 } }}
//         >
//           <div className="flex items-center gap-2">
//             <Input
//               placeholder="Search projects..."
//               prefix={<SearchOutlined />}
//               value={filters.search || ""}
//               onChange={(e) => handleSearch(e.target.value)}
//               style={{ width: 240 }}
//               allowClear
//             />

//             <Select
//               placeholder="Filter by status"
//               value={filters.status}
//               onChange={handleStatusFilter}
//               style={{ width: 200 }}
//               allowClear
//             >
//               <Option value="planning">Planning</Option>
//               <Option value="active">Active</Option>
//               <Option value="on-hold">On Hold</Option>
//               <Option value="completed">Completed</Option>
//               <Option value="cancelled">Cancelled</Option>
//             </Select>

//             <Select
//               placeholder="Filter by project manager"
//               value={filters.projectManagerId}
//               onChange={handleProjectManagerFilter}
//               style={{ width: 250 }}
//               allowClear
//               showSearch
//               filterOption={(input, option) => {
//                 const member = members.find((m) => m.value === option?.value);
//                 return member
//                   ? member.label.toLowerCase().includes(input.toLowerCase()) ||
//                       member.position
//                         .toLowerCase()
//                         .includes(input.toLowerCase())
//                   : false;
//               }}
//             >
//               {members.map((member) => (
//                 <Option key={member.value} value={member.value}>
//                   {member.label} - {member.position}
//                 </Option>
//               ))}
//             </Select>

//             <RangePicker
//               placeholder={["Start Date", "End Date"]}
//               onChange={handleDateRangeFilter}
//               style={{ width: 250 }}
//             />
//           </div>
//         </Card>

//         {/* Projects Table */}

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
//               : projects.map((project) => (
//                   <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
//                     <Card
//                       hoverable
//                       className="project-card"
//                       onClick={() => openViewModal(project)}
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
//                           {project.name?.[0]?.toUpperCase()}
//                         </Avatar>

//                         <div style={{ marginLeft: 14, flex: 1 }}>
//                           <Title
//                             level={5}
//                             style={{
//                               margin: 0,
//                               lineHeight: 1.3,
//                               fontWeight: 600,
//                             }}
//                             ellipsis={{ tooltip: project.name }}
//                           >
//                             {project.name}
//                           </Title>

//                           {project.code && (
//                             <Text type="secondary" style={{ fontSize: 12 }}>
//                               {project.code}
//                             </Text>
//                           )}

//                           <div style={{ marginTop: 6 }}>
//                             <Tag
//                               color={getStatusColor(project.status)}
//                               style={{
//                                 fontWeight: 600,
//                                 borderRadius: 6,
//                               }}
//                             >
//                               {project.status.toUpperCase().replace("-", " ")}
//                             </Tag>
//                           </div>
//                         </div>
//                       </div>

//                       {/* ===== PROJECT INFO ===== */}
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
//                             <UserOutlined style={{ color: "#1677ff" }} />
//                             <Text style={{ fontSize: 13 }}>
//                               {project.projectManager?.name || "—"}
//                             </Text>
//                           </Space>

//                           <Space>
//                             <TeamOutlined style={{ color: "#1677ff" }} />
//                             <Text style={{ fontSize: 13 }}>
//                               {project.members?.length || 0} members
//                             </Text>
//                           </Space>

//                           <Space>
//                             <CalendarOutlined style={{ color: "#1677ff" }} />
//                             <Text style={{ fontSize: 13 }}>
//                               {dayjs(project.startDate).format("MMM DD, YYYY")}
//                             </Text>
//                           </Space>

//                           {project.endDate && (
//                             <Space>
//                               <CalendarOutlined style={{ color: "#1677ff" }} />
//                               <Text style={{ fontSize: 13 }}>
//                                 {dayjs(project.endDate).format("MMM DD, YYYY")}
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
//                         <Tag
//                           color={getPriorityColor(project.defaultPriority)}
//                           style={{
//                             fontWeight: 600,
//                             borderRadius: 6,
//                           }}
//                         >
//                           {project.defaultPriority.toUpperCase()}
//                         </Tag>

//                         <Space>
//                           {user?.role &&
//                             RBAC.hasPermission(
//                               user.role as any,
//                               "projects",
//                               "update",
//                             ) && (
//                               <Button
//                                 type="text"
//                                 icon={<EditOutlined />}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleEdit(project);
//                                 }}
//                               />
//                             )}

//                           {user?.role &&
//                             RBAC.hasPermission(
//                               user.role as any,
//                               "projects",
//                               "delete",
//                             ) && (
//                               <Button
//                                 type="text"
//                                 danger
//                                 icon={<DeleteOutlined />}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleDelete(project.id);
//                                 }}
//                               />
//                             )}
//                         </Space>
//                       </div>
//                     </Card>
//                   </Col>
//                 ))}
//           </Row>
//         ) : (
//           /* ===== TABLE VIEW ===== */
//           <Card size="small">
//             <Table
//               columns={columns}
//               dataSource={projects}
//               rowKey="id"
//               loading={loading}
//               pagination={{
//                 current: pagination.current,
//                 pageSize: pagination.pageSize,
//                 total: pagination.total,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) =>
//                   `${range[0]}-${range[1]} of ${total} projects`,
//               }}
//               scroll={{ x: 1200 }}
//               onRow={(record) => ({
//                 onClick: () => {
//                   openViewModal(record); // 👈 modal open
//                 },
//               })}
//             />
//           </Card>
//         )}

//         {/* Create/Edit Modal */}
//         <Modal
//           title={editingProject ? "Edit Project" : "Create New Project"}
//           open={modalVisible}
//           onCancel={() => {
//             setModalVisible(false);
//             setEditingProject(null);
//             form.resetFields();
//           }}
//           footer={null}
//           width={800}
//         >
//           <Form
//             form={form}
//             layout="vertical"
//             onFinish={handleSubmit}
//             initialValues={{
//               status: "planning",
//               defaultPriority: "medium",
//             }}
//           >
//             <Row gutter={16}>
//               <Col xs={24} sm={12}>
//                 <Form.Item
//                   name="name"
//                   label="Project Name"
//                   rules={[
//                     { required: true, message: "Please enter project name" },
//                     { min: 2, message: "Name must be at least 2 characters" },
//                   ]}
//                 >
//                   <Input placeholder="Enter project name" />
//                 </Form.Item>
//               </Col>
//               <Col xs={24} sm={12}>
//                 <Form.Item
//                   name="status"
//                   label="Status"
//                   rules={[{ required: true, message: "Please select status" }]}
//                 >
//                   <Select placeholder="Select status">
//                     <Option value="planning">Planning</Option>
//                     <Option value="active">Active</Option>
//                     <Option value="on-hold">On Hold</Option>
//                     <Option value="completed">Completed</Option>
//                     <Option value="cancelled">Cancelled</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.Item
//               name="description"
//               label="Description"
//               rules={[{ required: true, message: "Please enter description" }]}
//             >
//               <Input.TextArea
//                 rows={3}
//                 placeholder="Enter project description"
//               />
//             </Form.Item>

//             <Row gutter={16}>
//               <Col xs={24} sm={12}>
//                 <Form.Item
//                   name="projectManagerId"
//                   label="Project Manager"
//                   rules={[
//                     {
//                       required: true,
//                       message: "Please select project manager",
//                     },
//                   ]}
//                 >
//                   <Select
//                     placeholder="Select project manager"
//                     onChange={handleProjectManagerChange}
//                     showSearch
//                     filterOption={(input, option) => {
//                       const member = members.find(
//                         (m) => m.value === option?.value,
//                       );
//                       return member
//                         ? member.label
//                             .toLowerCase()
//                             .includes(input.toLowerCase()) ||
//                             member.position
//                               .toLowerCase()
//                               .includes(input.toLowerCase())
//                         : false;
//                     }}
//                   >
//                     {members.map((member) => (
//                       <Option key={member.value} value={member.value}>
//                         {member.label} - {member.position}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
//               <Col xs={24} sm={12}>
//                 <Form.Item
//                   name="defaultPriority"
//                   label="Default Priority"
//                   rules={[
//                     {
//                       required: true,
//                       message: "Please select default priority",
//                     },
//                   ]}
//                 >
//                   <Select placeholder="Select default priority">
//                     <Option value="high">High</Option>
//                     <Option value="medium">Medium</Option>
//                     <Option value="low">Low</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.Item
//               name="teamMemberIds"
//               label="Team Members"
//               help="Project Manager will be automatically included in the team"
//             >
//               <Select
//                 mode="multiple"
//                 placeholder="Select team members"
//                 onChange={handleTeamMembersChange}
//                 showSearch
//                 filterOption={(input, option) => {
//                   const member = members.find((m) => m.value === option?.value);
//                   return member
//                     ? member.label
//                         .toLowerCase()
//                         .includes(input.toLowerCase()) ||
//                         member.position
//                           .toLowerCase()
//                           .includes(input.toLowerCase())
//                     : false;
//                 }}
//               >
//                 {members.map((member) => (
//                   <Option key={member.value} value={member.value}>
//                     {member.label} - {member.position}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>

//             <Row gutter={16}>
//               <Col xs={24} sm={12}>
//                 <Form.Item
//                   name="startDate"
//                   label="Start Date"
//                   rules={[
//                     { required: true, message: "Please select start date" },
//                   ]}
//                 >
//                   <DatePicker style={{ width: "100%" }} />
//                 </Form.Item>
//               </Col>
//               <Col xs={24} sm={12}>
//                 <Form.Item name="endDate" label="End Date">
//                   <DatePicker style={{ width: "100%" }} />
//                 </Form.Item>
//               </Col>
//             </Row>

//             <div className="flex justify-end space-x-2">
//               <Button
//                 onClick={() => {
//                   setModalVisible(false);
//                   setEditingProject(null);
//                   form.resetFields();
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button type="primary" htmlType="submit">
//                 {editingProject ? "Update" : "Create"} Project
//               </Button>
//             </div>
//           </Form>
//         </Modal>

//         {/*Modal*/}
//         <Modal
//           open={viewModalOpen}
//           onCancel={() => {
//             setViewModalOpen(false);
//             setViewProject(null);
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
//           {viewProject && (
//             <>
//               {/* ===== HEADER ===== */}

//               <div
//                 className="view-modal-header"
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
//                     background:
//                       "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
//                     fontWeight: 700,
//                     fontSize: 20,
//                   }}
//                 >
//                   {viewProject.name?.[0]?.toUpperCase()}
//                 </Avatar>

//                 {/* Text block */}
//                 <div style={{ flex: 1 }}>
//                   {/* Name + Tag in same row */}
//                   <div
//                     style={{
//                       display: "flex",
//                       //alignItems: "center",
//                       alignItems: "baseline",
//                       gap: 8,
//                     }}
//                   >
//                     <Title level={4} style={{ margin: 0, color: "black" }}>
//                       {viewProject.name}
//                     </Title>

//                     <Tag
//                       color={getStatusColor(viewProject.status)}
//                       style={{
//                         fontWeight: 600,
//                         fontSize: 11,
//                         padding: "2px 6px",
//                         borderRadius: 4,
//                         width: "fit-content",
//                         display: "inline-block",

//                       }}
//                     >
//                       {viewProject.status.toUpperCase()}
//                     </Tag>
//                   </div>

//                   {/* ID below */}
//                   <Text style={{ color: "black", fontSize: 13 }}>
//                     {viewProject.code || "—"}
//                   </Text>
//                 </div>
//               </div>

//               {/* ===== BODY ===== */}
//               <div style={{ padding: 24, background: "#fafcff" }}>
//                 <Row gutter={[16, 16]}>
//                   <Col span={12}>
//                     <Card size="small" bordered={false} className="view-card">
//                       <Space>
//                         <UserOutlined style={{ color: "#1677ff" }} />
//                         <Text strong>Project Manager</Text>
//                       </Space>
//                       <div style={{ marginTop: 6 }}>
//                         {viewProject.projectManager?.name || "—"}
//                       </div>
//                     </Card>
//                   </Col>

//                   <Col span={12}>
//                     <Card size="small" bordered={false} className="view-card">
//                       <Space>
//                         <TeamOutlined style={{ color: "#1677ff" }} />
//                         <Text strong>Team Members</Text>
//                       </Space>
//                       <div style={{ marginTop: 6 }}>
//                         {viewProject.members?.length || 0} members
//                       </div>
//                     </Card>
//                   </Col>

//                   <Col span={12}>
//                     <Card size="small" bordered={false} className="view-card">
//                       <Space>
//                         <CalendarOutlined style={{ color: "#1677ff" }} />
//                         <Text strong>Start Date</Text>
//                       </Space>
//                       <div style={{ marginTop: 6 }}>
//                         {dayjs(viewProject.startDate).format("MMM DD, YYYY")}
//                       </div>
//                     </Card>
//                   </Col>

//                   <Col span={12}>
//                     <Card size="small" bordered={false} className="view-card">
//                       <Space>
//                         <CalendarOutlined style={{ color: "#1677ff" }} />
//                         <Text strong>End Date</Text>
//                       </Space>
//                       <div style={{ marginTop: 6 }}>
//                         {viewProject.endDate
//                           ? dayjs(viewProject.endDate).format("MMM DD, YYYY")
//                           : "—"}
//                       </div>
//                     </Card>
//                   </Col>

//                   <Col span={24}>
//                     <Card size="small" bordered={false} className="view-card">
//                       <Text strong>Description</Text>
//                       <div style={{ marginTop: 8, color: "#595959" }}>
//                         {viewProject.description || "No description provided."}
//                       </div>
//                     </Card>
//                   </Col>
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
//                   alignItems: "center",
//                 }}
//               >
//                 <Button
//                   onClick={() => setViewModalOpen(false)}
//                   className="view-close-btn"
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
// };

// export default ProjectsManagePage;
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Alert,
  Popconfirm,
  Tag,
  DatePicker,
  Card,
  Row,
  Col,
  Tooltip,
  Avatar,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
  CalendarOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  BarsOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ProjectService,
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectsFilters,
} from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import { useAuth } from "@/context/AuthContext";
import { RBAC } from "@/lib/rbac";
import MainLayout from "@/components/layout/MainLayout";

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Member {
  value: string;
  label: string;
  position: string;
}

const ProjectsManagePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [form] = Form.useForm();

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // View Project Modal (READ-ONLY)
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<ProjectsFilters>({
    page: 1,
    limit: 10,
  });

  // Load data
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.getProjects(filters);
      setProjects(response.data);
      console.log({ projects: response.data });
      setPagination({
        current: response.pagination.current,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total,
      });
    } catch (error) {
      message.error("Failed to load projects");
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const membersList = await MembersService.getMembersForSelect();
      setMembers(membersList);
    } catch (error) {
      message.error("Failed to load members");
      console.error("Error loading members:", error);
    }
  };

  useEffect(() => {
    loadProjects();
    loadMembers();
  }, [filters]);

  // Handle project manager change - automatically add to team members
  const handleProjectManagerChange = (projectManagerId: string) => {
    const teamMemberIds = form.getFieldValue("teamMemberIds") || [];

    if (projectManagerId && !teamMemberIds.includes(projectManagerId)) {
      // Add project manager to team members if not already included
      form.setFieldsValue({
        teamMemberIds: [...teamMemberIds, projectManagerId],
      });
    }
  };

  // Handle team members change - prevent removing project manager
  const handleTeamMembersChange = (selectedIds: string[]) => {
    const projectManagerId = form.getFieldValue("projectManagerId");

    if (projectManagerId && !selectedIds.includes(projectManagerId)) {
      // If project manager was removed, add them back
      message.warning("Project Manager must be included in the team");
      form.setFieldsValue({
        teamMemberIds: [...selectedIds, projectManagerId],
      });
    }
  };

  // Handle table pagination
  const handleTableChange = (pagination: any) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  // Handle project manager filter
  const handleProjectManagerFilter = (projectManager: string) => {
    setFilters((prev) => ({
      ...prev,
      projectManagerId: projectManager || undefined,
      page: 1,
    }));
  };

  // Handle date range filter
  const handleDateRangeFilter = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
        page: 1,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      }));
    }
  };

  // Handle create/edit project
  const handleSubmit = async (values: any) => {
    try {
      setError("");
      const projectData = {
        ...values,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        code: values.code || null,
        repositories: values.repositories || null,
      };

      if (editingProject) {
        await ProjectService.updateProject(
          editingProject.id,
          projectData as UpdateProjectData,
        );
        setSuccess("Project updated successfully");
      } else {
        await ProjectService.createProject(projectData as CreateProjectData);
        setSuccess("Project created successfully");
      }

      setModalVisible(false);
      setEditingProject(null);
      form.resetFields();
      loadProjects();
    } catch (error: any) {
      setError(error.message || "Failed to save project");
    }
  };

  // Handle delete project
  const handleDelete = async (id: string) => {
    try {
      setError("");
      await ProjectService.deleteProject(id);
      setSuccess("Project deleted successfully");
      loadProjects();
    } catch (error: any) {
      setError(error.message || "Failed to delete project");
    }
  };

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      startDate: dayjs(project.startDate),
      endDate: project.endDate ? dayjs(project.endDate) : null,
      projectManagerId: project.projectManager.id,
      teamMemberIds: project.members.map((member) => member.user.id),
    });
    setModalVisible(true);
  };

  // Handle add new
  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({
      status: "planning",
      defaultPriority: "medium",
    });
    setModalVisible(true);
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      planning: "blue",
      active: "green",
      "on-hold": "orange",
      completed: "purple",
      cancelled: "red",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "red",
      medium: "orange",
      low: "green",
    };
    return colors[priority as keyof typeof colors] || "default";
  };

  // Table columns
  const columns: ColumnsType<Project> = [
    {
      title: "Project",
      key: "project",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-sm text-gray-500">{record.code}</div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase().replace("-", " ")}
        </Tag>
      ),
    },
    {
      title: "Project Manager",
      key: "projectManager",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Avatar size="small">{record?.projectManager?.name.charAt(0)}</Avatar>
          <div>
            <div className="font-medium">{record?.projectManager?.name}</div>
            <div className="text-sm text-gray-500">
              {record.projectManager?.position}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Team",
      key: "teamMembers",
      render: (_, record) => (
        <div className="flex items-center space-x-1">
          <TeamOutlined />
          <span>{record?.members?.length || 0} members</span>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "defaultPriority",
      key: "defaultPriority",
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      render: (_, record) => (
        <div className="text-sm">
          <div>Start: {dayjs(record?.startDate).format("MMM DD, YYYY")}</div>
          {record.endDate && (
            <div>End: {dayjs(record?.endDate).format("MMM DD, YYYY")}</div>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            />
          </Tooltip>
          {user?.role &&
            RBAC.hasPermission(user.role as any, "projects", "update") && (
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            )}
          {user?.role &&
            RBAC.hasPermission(user.role as any, "projects", "delete") && (
              <Popconfirm
                title="Are you sure you want to delete this project?"
                description="This action cannot be undone and may affect related tickets."
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
        </Space>
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

  // Don't render if no user and not loading
  if (!user && !isLoading) {
    return null;
  }

  // Check permissions
  if (
    user &&
    (!user.role || !RBAC.hasPermission(user.role as any, "projects", "read"))
  ) {
    return (
      <MainLayout>
        <div style={{ padding: 20 }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="text-gray-500">
                You don't have permission to view projects.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const openViewModal = (project: Project) => {
    setViewProject(project);
    setViewModalOpen(true);
  };

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            {/* Left title */}
            <Space align="center">
              <ProjectOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Projects Management
              </Title>
            </Space>

            {/* Right controls */}
            <Space>
              {/* Card / List Toggle */}
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
                    background: viewMode === "card" ? "#1677ff" : "transparent",
                    color: viewMode === "card" ? "#fff" : "#595959",
                    transition: "all 0.25s ease",
                  }}
                >
                  Card
                </Button>

                {/* Table View Button */}
                <Button
                  type="text"
                  icon={<BarsOutlined />}
                  onClick={() => setViewMode("table")}
                  style={{
                    borderRadius: 8,
                    padding: "4px 14px",
                    fontWeight: 500,
                    background:
                      viewMode === "table" ? "#1677ff" : "transparent",
                    color: viewMode === "table" ? "#fff" : "#595959",
                    transition: "all 0.25s ease",
                  }}
                >
                  List
                </Button>
              </div>

              {/* Add Project */}
              {user?.role &&
                RBAC.hasPermission(user.role as any, "projects", "create") && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                  >
                    Add Project
                  </Button>
                )}
            </Space>
          </Space>
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

        {/* Filters Card */}
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search projects..."
              prefix={<SearchOutlined />}
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />

            <Select
              placeholder="Filter by status"
              value={filters.status}
              onChange={handleStatusFilter}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="planning">Planning</Option>
              <Option value="active">Active</Option>
              <Option value="on-hold">On Hold</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>

            <Select
              placeholder="Filter by project manager"
              value={filters.projectManagerId}
              onChange={handleProjectManagerFilter}
              style={{ width: 250 }}
              allowClear
              showSearch
              filterOption={(input, option) => {
                const member = members.find((m) => m.value === option?.value);
                return member
                  ? member.label.toLowerCase().includes(input.toLowerCase()) ||
                      member.position
                        .toLowerCase()
                        .includes(input.toLowerCase())
                  : false;
              }}
            >
              {members.map((member) => (
                <Option key={member.value} value={member.value}>
                  {member.label} - {member.position}
                </Option>
              ))}
            </Select>

            <RangePicker
              placeholder={["Start Date", "End Date"]}
              onChange={handleDateRangeFilter}
              style={{ width: 250 }}
            />
          </div>
        </Card>

        {/* All Projects Section - DASHBOARD STYLE CARDS */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 15 }}>
            <ProjectOutlined style={{ marginRight: 6 }} />
            All Projects
          </Text>
        </div>

        {/* Projects Card View - DASHBOARD STYLE */}
        {/* Projects Card View - DASHBOARD STYLE */}
        {viewMode === "card" ? (
          <Row gutter={[24, 24]}>
            {loading
              ? [1, 2, 3, 4, 5].map((i) => (
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
              : projects.map((project) => {
                  const memberCount = project.members?.length || 0;

                  return (
                    <Col xs={24} sm={12} lg={8} xl={8} key={project.id}>
                      <Card
                        hoverable
                        onClick={() => openViewModal(project)}
                        style={{
                          borderRadius: 12,
                          border: "1px solid #f0f0f0",
                          transition: "all 0.2s",
                          height: "100%",
                        }}
                        styles={{ body: { padding: "16px 18px" } }}
                      >
                        {/* ===== LINE 1: Project Icon + Name + Status Tag on Left, Arrow on Right ===== */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 12,
                          }}
                        >
                          {/* Left side: Project Icon + Name + Status Tag */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <ProjectOutlined
                              style={{
                                color: "#1677ff",
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            />
                            <Text strong ellipsis style={{ fontSize: 15 }}>
                              {project.name}
                            </Text>
                           
                            <Tag
                              color={getStatusColor(project.status)}
                              style={{
                                margin: 0,
                                fontSize: 10, // Reduced from 11 to 10
                                borderRadius: 3, // Reduced from 4 to 3
                                padding: "1px 5px", // Reduced padding
                                flexShrink: 0,
                                lineHeight: 1.2, // Added for smaller height
                                height: "auto", // Auto height
                              }}
                            >
                              {project.status.toUpperCase().replace("-", " ")}
                            </Tag>
                          </div>

                          {/* Right side: Arrow only */}
            
                        </div>

                        {/* ===== LINE 2: Project Manager Name ===== */}
                        {project.projectManager && (
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
                            <UserOutlined
                              style={{ color: "#8c8c8c", fontSize: 12 }}
                            />
                            <Text style={{ fontSize: 13 }}>
                              {project.projectManager.name}
                            </Text>
                          </div>
                        )}

                        {/* ===== LINE 3: Members + Start/End Date with Priority Tag on Right ===== */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 8,
                            paddingTop: 8,
                          }}
                        >
                          {/* Left side: Members + Dates */}
                          <div
                            style={{
                              display: "flex",
                              gap: 16,
                              fontSize: 12,
                              color: "#8c8c8c",
                            }}
                          >
                            <span>
                              <TeamOutlined style={{ marginRight: 4 }} />
                              {memberCount}{" "}
                              {memberCount === 1 ? "member" : "members"}
                            </span>
                            <span>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {dayjs(project.startDate).format("MMM DD")}
                              {project.endDate &&
                                ` - ${dayjs(project.endDate).format("MMM DD")}`}
                            </span>
                          </div>

                          {/* Right side: Priority Tag */}
                         
                          <Tag
                            color={getPriorityColor(project.defaultPriority)}
                            style={{
                              margin: 0,
                              fontSize: 10, // Same as status tag
                              borderRadius: 3, // Same as status tag
                              padding: "1px 5px", // Same as status tag
                              fontWeight: 500,
                              flexShrink: 0,
                              lineHeight: 1.2, // Same as status tag
                              height: "auto", // Same as status tag
                            }}
                          >
                            {project.defaultPriority.toUpperCase()}
                          </Tag>
                        </div>

                        {/* ===== OPTIONAL: Action Buttons (if needed) ===== */}
                        {user?.role &&
                          (RBAC.hasPermission(
                            user.role as any,
                            "projects",
                            "update",
                          ) ||
                            RBAC.hasPermission(
                              user.role as any,
                              "projects",
                              "delete",
                            )) && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 4,
                                marginTop: 12,
                                paddingTop: 8,
                                borderTop: "1px dashed #f0f0f0",
                              }}
                            >
                              {user?.role &&
                                RBAC.hasPermission(
                                  user.role as any,
                                  "projects",
                                  "update",
                                ) && (
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(project);
                                    }}
                                  />
                                )}

                              {user?.role &&
                                RBAC.hasPermission(
                                  user.role as any,
                                  "projects",
                                  "delete",
                                ) && (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(project.id);
                                    }}
                                  />
                                )}
                            </div>
                          )}
                      </Card>
                    </Col>
                  );
                })}
          </Row>
        ) : (
          /* ===== TABLE VIEW ===== */
          <Card size="small">
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} projects`,
              }}
              scroll={{ x: 1200 }}
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => {
                  openViewModal(record);
                },
              })}
            />
          </Card>
        )}

        {/* Create/Edit Modal */}
        <Modal
          title={editingProject ? "Edit Project" : "Create New Project"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingProject(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: "planning",
              defaultPriority: "medium",
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Project Name"
                  rules={[
                    { required: true, message: "Please enter project name" },
                    { min: 2, message: "Name must be at least 2 characters" },
                  ]}
                >
                  <Input placeholder="Enter project name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select placeholder="Select status">
                    <Option value="planning">Planning</Option>
                    <Option value="active">Active</Option>
                    <Option value="on-hold">On Hold</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="cancelled">Cancelled</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please enter description" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter project description"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="projectManagerId"
                  label="Project Manager"
                  rules={[
                    {
                      required: true,
                      message: "Please select project manager",
                    },
                  ]}
                >
                  <Select
                    placeholder="Select project manager"
                    onChange={handleProjectManagerChange}
                    showSearch
                    filterOption={(input, option) => {
                      const member = members.find(
                        (m) => m.value === option?.value,
                      );
                      return member
                        ? member.label
                            .toLowerCase()
                            .includes(input.toLowerCase()) ||
                            member.position
                              .toLowerCase()
                              .includes(input.toLowerCase())
                        : false;
                    }}
                  >
                    {members.map((member) => (
                      <Option key={member.value} value={member.value}>
                        {member.label} - {member.position}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="defaultPriority"
                  label="Default Priority"
                  rules={[
                    {
                      required: true,
                      message: "Please select default priority",
                    },
                  ]}
                >
                  <Select placeholder="Select default priority">
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="teamMemberIds"
              label="Team Members"
              help="Project Manager will be automatically included in the team"
            >
              <Select
                mode="multiple"
                placeholder="Select team members"
                onChange={handleTeamMembersChange}
                showSearch
                filterOption={(input, option) => {
                  const member = members.find((m) => m.value === option?.value);
                  return member
                    ? member.label
                        .toLowerCase()
                        .includes(input.toLowerCase()) ||
                        member.position
                          .toLowerCase()
                          .includes(input.toLowerCase())
                    : false;
                }}
              >
                {members.map((member) => (
                  <Option key={member.value} value={member.value}>
                    {member.label} - {member.position}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  rules={[
                    { required: true, message: "Please select start date" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="endDate" label="End Date">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingProject(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProject ? "Update" : "Create"} Project
              </Button>
            </div>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          open={viewModalOpen}
          onCancel={() => {
            setViewModalOpen(false);
            setViewProject(null);
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
          {viewProject && (
            <>
              {/* ===== HEADER ===== */}
              <div
                className="view-modal-header"
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
                    background:
                      "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {viewProject.name?.[0]?.toUpperCase()}
                </Avatar>

                {/* Text block */}
                <div style={{ flex: 1 }}>
                  {/* Name + Tag in same row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <Title level={4} style={{ margin: 0, color: "black" }}>
                      {viewProject.name}
                    </Title>

                    <Tag
                      color={getStatusColor(viewProject.status)}
                      style={{
                        fontWeight: 600,
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 4,
                        width: "fit-content",
                        display: "inline-block",
                      }}
                    >
                      {viewProject.status.toUpperCase()}
                    </Tag>
                  </div>

                  {/* ID below */}
                  <Text style={{ color: "black", fontSize: 13 }}>
                    {viewProject.code || "—"}
                  </Text>
                </div>
              </div>

              {/* ===== BODY ===== */}
              <div style={{ padding: 24, background: "#fafcff" }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" bordered={false} className="view-card">
                      <Space>
                        <UserOutlined style={{ color: "#1677ff" }} />
                        <Text strong>Project Manager</Text>
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        {viewProject.projectManager?.name || "—"}
                      </div>
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card size="small" bordered={false} className="view-card">
                      <Space>
                        <TeamOutlined style={{ color: "#1677ff" }} />
                        <Text strong>Team Members</Text>
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        {viewProject.members?.length || 0} members
                      </div>
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card size="small" bordered={false} className="view-card">
                      <Space>
                        <CalendarOutlined style={{ color: "#1677ff" }} />
                        <Text strong>Start Date</Text>
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        {dayjs(viewProject.startDate).format("MMM DD, YYYY")}
                      </div>
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card size="small" bordered={false} className="view-card">
                      <Space>
                        <CalendarOutlined style={{ color: "#1677ff" }} />
                        <Text strong>End Date</Text>
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        {viewProject.endDate
                          ? dayjs(viewProject.endDate).format("MMM DD, YYYY")
                          : "—"}
                      </div>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card size="small" bordered={false} className="view-card">
                      <Text strong>Description</Text>
                      <div style={{ marginTop: 8, color: "#595959" }}>
                        {viewProject.description || "No description provided."}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* ===== FOOTER ===== */}
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
                  onClick={() => setViewModalOpen(false)}
                  className="view-close-btn"
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
};

export default ProjectsManagePage;
