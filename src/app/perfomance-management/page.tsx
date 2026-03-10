// "use client";

// import React, { useState } from "react";
// import { Card, Row, Col, Typography, Table } from "antd";
// import MainLayout from "@/components/layout/MainLayout";

// const { Title } = Typography;

// export default function PerformanceManagePage() {
//   const [loading, setLoading] = useState(false);

//   return (
//     <MainLayout>
//       <div style={{ padding: "24px" }}>
//         <Title level={2}>Performance Management</Title>
//         <p>Welcome to Performance Management Dashboard</p>

//         <Row gutter={[16, 16]}>
//           <Col span={6}>
//             <Card title="Total Tickets" bordered={false}>
//               <h2>0</h2>
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card title="Attendance" bordered={false}>
//               <h2>0%</h2>
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card title="Daily Updates" bordered={false}>
//               <h2>0</h2>
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card title="Leaves" bordered={false}>
//               <h2>0</h2>
//             </Card>
//           </Col>
//         </Row>

//         <Card style={{ marginTop: 24 }} title="Coming Soon">
//           <p>Performance management features will be available soon.</p>
//         </Card>
//       </div>
//     </MainLayout>
//   );
// }

// "use client";

// import React, { useState, useEffect } from "react";
// import { Card, Row, Col, Typography, Select, Space, Spin, Tag, Button } from "antd";
// import { UserOutlined, CalendarOutlined, FilterOutlined } from "@ant-design/icons";
// import MainLayout from "@/components/layout/MainLayout";
// import { MembersService } from "@/services/membersService";
// import { usePerformance } from "@/hooks/userPerformance"; // 👈 Import hook
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const { Option } = Select;
// const { Title, Text } = Typography;

// export default function PerformanceManagePage() {
//   const [loading, setLoading] = useState(false);
//   const [members, setMembers] = useState<any[]>([]);
//   const [selectedMember, setSelectedMember] = useState<string>();
//   const [selectedMonth, setSelectedMonth] = useState<string>("3");
//   const [selectedYear, setSelectedYear] = useState<string>("2026");

//   // Filters for API
//   const [appliedFilters, setAppliedFilters] = useState<{
//     userId?: string;
//     month?: string;
//     year?: string;
//   }>({});

//   // Use the performance hook
//   const { data: performanceData, isLoading: performanceLoading } = usePerformance(appliedFilters);

//   // Fetch members on page load
//   useEffect(() => {
//     fetchMembers();
//   }, []);

//   const fetchMembers = async () => {
//     try {
//       setLoading(true);
//       // Get members with role = "user"
//       const membersData = await MembersService.getMembersForSelect({
//         role: "user"
//       });

//       setMembers(membersData || []);
//     } catch (error) {
//       console.error("Failed to fetch members:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Apply filters
//   const handleApply = () => {
//     if (selectedMember && selectedMonth && selectedYear) {
//       setAppliedFilters({
//         userId: selectedMember, // member id = user id
//         month: selectedMonth,
//         year: selectedYear
//       });
//     }
//   };

//   // Month options
//   const months = [
//     { value: "1", label: "January" },
//     { value: "2", label: "February" },
//     { value: "3", label: "March" },
//     { value: "4", label: "April" },
//     { value: "5", label: "May" },
//     { value: "6", label: "June" },
//     { value: "7", label: "July" },
//     { value: "8", label: "August" },
//     { value: "9", label: "September" },
//     { value: "10", label: "October" },
//     { value: "11", label: "November" },
//     { value: "12", label: "December" },
//   ];

//   const years = ["2024", "2025", "2026"];

//   const selectedMemberDetails = members.find(m => m.value === selectedMember);

//   // Ticket data from API
//   const ticketSummary = performanceData?.tickets?.summary || {
//     total: 0,
//     completed: 0,
//     inProgress: 0,
//     pending: 0
//   };

//   const ticketDistribution = performanceData?.tickets?.distribution || [];

//   return (
//     <MainLayout>
//       <div style={{ padding: "24px" }}>
//         {/* Header */}
//         <div style={{ marginBottom: 24 }}>
//           <Title level={2}>Performance Management</Title>
//           <Text type="secondary">View employee performance metrics</Text>
//         </div>

//         {/* Dropdowns Section with Apply Button */}
//         <Card style={{ marginBottom: 24 }}>
//           <Space size="middle" wrap>
//             {/* Employee Dropdown */}
//             <Space>
//               <UserOutlined />
//               <Select
//                 placeholder="Select Employee"
//                 style={{ width: 250 }}
//                 value={selectedMember}
//                 onChange={setSelectedMember}
//                 loading={loading}
//                 allowClear
//                 showSearch
//                 filterOption={(input, option) =>
//                   String(option?.children).toLowerCase().includes(input.toLowerCase())
//                 }
//               >
//                 {members.map((member) => (
//                   <Option key={member.value} value={member.value}>
//                     {member.label}
//                   </Option>
//                 ))}
//               </Select>
//             </Space>

//             {/* Month Dropdown */}
//             <Space>
//               <CalendarOutlined />
//               <Select
//                 placeholder="Month"
//                 style={{ width: 120 }}
//                 value={selectedMonth}
//                 onChange={setSelectedMonth}
//               >
//                 {months.map((month) => (
//                   <Option key={month.value} value={month.value}>
//                     {month.label}
//                   </Option>
//                 ))}
//               </Select>
//             </Space>

//             {/* Year Dropdown */}
//             <Space>
//               <CalendarOutlined />
//               <Select
//                 placeholder="Year"
//                 style={{ width: 100 }}
//                 value={selectedYear}
//                 onChange={setSelectedYear}
//               >
//                 {years.map((year) => (
//                   <Option key={year} value={year}>{year}</Option>
//                 ))}
//               </Select>
//             </Space>

//             {/* Apply Button */}
//             <Button
//               type="primary"
//               icon={<FilterOutlined />}
//               onClick={handleApply}
//               disabled={!selectedMember || !selectedMonth || !selectedYear}
//               loading={performanceLoading}
//             >
//               Apply Filters
//             </Button>

//             {/* Selected Info */}
//             {selectedMemberDetails && (
//               <Tag color="success">
//                 Selected: {selectedMemberDetails.label}
//               </Tag>
//             )}
//           </Space>
//         </Card>

//         {/* Performance Cards */}
//         <Spin spinning={performanceLoading || loading}>
//           <Row gutter={[16, 16]}>
//             {/* Tickets Card - Main Focus */}
//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 title={
//                   <Space>
//                     <span>🎫 Tickets</span>
//                     <Tag color="blue">Total: {ticketSummary.total}</Tag>
//                   </Space>
//                 }
//                 bordered={false}
//                 style={{ height: '100%' }}
//               >
//                 <div style={{ textAlign: 'center', marginBottom: 16 }}>
//                   <Title level={1} style={{ color: '#1890ff', margin: 0 }}>
//                     {ticketSummary.total}
//                   </Title>
//                   <Text type="secondary">Total Tickets</Text>
//                 </div>

//                 <Row gutter={8}>
//                   <Col span={8}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Tag color="green" style={{ fontSize: 16, padding: '4px 8px' }}>
//                         {ticketSummary.completed}
//                       </Tag>
//                       <div>
//                         <Text type="secondary">Completed</Text>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={8}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Tag color="orange" style={{ fontSize: 16, padding: '4px 8px' }}>
//                         {ticketSummary.inProgress}
//                       </Tag>
//                       <div>
//                         <Text type="secondary">In Progress</Text>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={8}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Tag color="red" style={{ fontSize: 16, padding: '4px 8px' }}>
//                         {ticketSummary.pending}
//                       </Tag>
//                       <div>
//                         <Text type="secondary">Pending</Text>
//                       </div>
//                     </div>
//                   </Col>
//                 </Row>

//                 {/* Progress Bar */}
//                 {ticketSummary.total > 0 && (
//                   <div style={{ marginTop: 16 }}>
//                     <div style={{
//                       height: 8,
//                       background: '#f0f0f0',
//                       borderRadius: 4,
//                       overflow: 'hidden'
//                     }}>
//                       <div style={{
//                         width: `${(ticketSummary.completed / ticketSummary.total) * 100}%`,
//                         height: '100%',
//                         background: '#52c41a'
//                       }} />
//                     </div>
//                     <div style={{ marginTop: 8, textAlign: 'center' }}>
//                       <Text strong style={{ color: '#52c41a' }}>
//                         {Math.round((ticketSummary.completed / ticketSummary.total) * 100)}% Complete
//                       </Text>
//                     </div>
//                   </div>
//                 )}
//               </Card>
//             </Col>

//             {/* Other Cards - Placeholder */}
//             <Col xs={24} sm={12} md={6}>
//               <Card title="⏰ Attendance" bordered={false}>
//                 <Title level={2}>0%</Title>
//                 <Text type="secondary">Present: 0 days</Text>
//               </Card>
//             </Col>
//             <Col xs={24} sm={12} md={6}>
//               <Card title="📅 Daily Updates" bordered={false}>
//                 <Title level={2}>0</Title>
//                 <Text type="secondary">BOD: 0 | EOD: 0</Text>
//               </Card>
//             </Col>
//             <Col xs={24} sm={12} md={6}>
//               <Card title="🏖 Leaves" bordered={false}>
//                 <Title level={2}>0</Title>
//                 <Text type="secondary">Taken: 0 | Permissions: 0</Text>
//               </Card>
//             </Col>
//           </Row>

//           {/* Ticket Distribution Chart */}
//           {ticketDistribution.length > 0 && (
//             <Card style={{ marginTop: 24 }} title="Ticket Distribution">
//               <Row gutter={24}>
//                 <Col span={12}>
//                   <div style={{ height: 300 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie
//                           data={ticketDistribution}
//                           cx="50%"
//                           cy="50%"
//                           innerRadius={60}
//                           outerRadius={100}
//                           paddingAngle={5}
//                           dataKey="value"
//                           label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                         >
//                           {ticketDistribution.map((entry: any, index: number) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                         <Legend />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </Col>
//                 <Col span={12}>
//                   <div style={{ padding: '20px' }}>
//                     <Title level={4}>Summary</Title>
//                     <p>Total Tickets: <strong>{ticketSummary.total}</strong></p>
//                     <p>✅ Completed: <strong style={{ color: '#52c41a' }}>{ticketSummary.completed}</strong></p>
//                     <p>🔄 In Progress: <strong style={{ color: '#faad14' }}>{ticketSummary.inProgress}</strong></p>
//                     <p>⏳ Pending: <strong style={{ color: '#f5222d' }}>{ticketSummary.pending}</strong></p>
//                   </div>
//                 </Col>
//               </Row>
//             </Card>
//           )}
//         </Spin>

//         {/* Info Card */}
//         <Card style={{ marginTop: 24 }}>
//           <Space direction="vertical">
//             <Text type="secondary">
//               {members.length} employees available • Select employee and month/year, then click Apply
//             </Text>
//             {selectedMember && selectedMonth && selectedYear && (
//               <Tag color="blue">
//                 Showing data for: {selectedMemberDetails?.label} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
//               </Tag>
//             )}
//           </Space>
//         </Card>
//       </div>
//     </MainLayout>
//   );
// }tickets

// "use client";

// import React, { useState, useEffect } from "react";
// import { Card, Row, Col, Typography, Select, Space, Spin, Tag, Button, Table } from "antd";
// import { UserOutlined, CalendarOutlined, FilterOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
// import MainLayout from "@/components/layout/MainLayout";
// import { MembersService } from "@/services/membersService";
// import { usePerformance } from "@/hooks/userPerformance";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import dayjs from "dayjs";

// const { Option } = Select;
// const { Title, Text } = Typography;

// export default function PerformanceManagePage() {
//   const [loading, setLoading] = useState(false);
//   const [members, setMembers] = useState<any[]>([]);
//   const [selectedMember, setSelectedMember] = useState<string>();
//   const [selectedMonth, setSelectedMonth] = useState<string>("3");
//   const [selectedYear, setSelectedYear] = useState<string>("2026");

//   // Filters for API
//   const [appliedFilters, setAppliedFilters] = useState<{
//     userId?: string;
//     month?: string;
//     year?: string;
//   }>({});

//   // Use the performance hook
//   const { data: performanceData, isLoading: performanceLoading } = usePerformance(appliedFilters);

//   // Fetch members on page load
//   useEffect(() => {
//     fetchMembers();
//   }, []);

//   const fetchMembers = async () => {
//     try {
//       setLoading(true);
//       const membersData = await MembersService.getMembersForSelect({
//         role: "user"
//       });
//       setMembers(membersData || []);
//     } catch (error) {
//       console.error("Failed to fetch members:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Apply filters
//   const handleApply = () => {
//     if (selectedMember && selectedMonth && selectedYear) {
//       setAppliedFilters({
//         userId: selectedMember,
//         month: selectedMonth,
//         year: selectedYear
//       });
//     }
//   };

//   // Month options
//   const months = [
//     { value: "1", label: "January" },
//     { value: "2", label: "February" },
//     { value: "3", label: "March" },
//     { value: "4", label: "April" },
//     { value: "5", label: "May" },
//     { value: "6", label: "June" },
//     { value: "7", label: "July" },
//     { value: "8", label: "August" },
//     { value: "9", label: "September" },
//     { value: "10", label: "October" },
//     { value: "11", label: "November" },
//     { value: "12", label: "December" },
//   ];

//   const years = ["2024", "2025", "2026"];

//   const selectedMemberDetails = members.find(m => m.value === selectedMember);

//   // Ticket data from API
//   const ticketSummary = performanceData?.tickets?.summary || {
//     total: 0,
//     completed: 0,
//     inProgress: 0,
//     pending: 0
//   };

//   const ticketDistribution = performanceData?.tickets?.distribution || [];

//   // Daily Updates data from API
//   const dailyUpdatesSummary = performanceData?.dailyUpdates?.summary || {
//     bod: 0,
//     eod: 0,
//     total: 0
//   };

//   // 📅 Get only the updates that exist (not all dates)
//   const existingUpdates = performanceData?.dailyUpdates?.logs || [];

//   // Table columns for Daily Updates - Only show dates that have updates
//   const dailyUpdateColumns = [
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//       render: (text: string) => (
//         <Space>
//           <CalendarOutlined />
//           <Text strong>{dayjs(text).format("DD MMM YYYY")}</Text>
//           <Tag color="blue">{dayjs(text).format("dddd")}</Tag>
//         </Space>
//       ),
//     },
//     {
//       title: 'BOD (Morning Update)',
//       dataIndex: 'bod',
//       key: 'bod',
//       align: 'center' as const,
//       render: (bod: boolean) => bod ? (
//         <Tag color="green" icon={<CheckCircleOutlined />}>✓ Submitted</Tag>
//       ) : (
//         <Tag color="red" icon={<CloseCircleOutlined />}>✗ Not Submitted</Tag>
//       ),
//     },
//     {
//       title: 'EOD (Evening Update)',
//       dataIndex: 'eod',
//       key: 'eod',
//       align: 'center' as const,
//       render: (eod: boolean) => eod ? (
//         <Tag color="green" icon={<CheckCircleOutlined />}>✓ Submitted</Tag>
//       ) : (
//         <Tag color="red" icon={<CloseCircleOutlined />}>✗ Not Submitted</Tag>
//       ),
//     },
//     {
//       title: 'Update Type',
//       dataIndex: 'type',
//       key: 'type',
//       align: 'center' as const,
//       render: (type: string, record: any) => {
//         if (record.bod && record.eod) {
//           return <Tag color="purple">Both BOD & EOD</Tag>;
//         } else if (record.bod) {
//           return <Tag color="blue">Only BOD</Tag>;
//         } else if (record.eod) {
//           return <Tag color="orange">Only EOD</Tag>;
//         } else {
//           return <Tag color="default">No Update</Tag>;
//         }
//       },
//     },
//   ];

//   return (
//     <MainLayout>
//       <div style={{ padding: "24px" }}>
//         {/* Header */}
//         <div style={{ marginBottom: 24 }}>
//           <Title level={2}>Performance Management</Title>
//           <Text type="secondary">View employee performance metrics</Text>
//         </div>

//         {/* Dropdowns Section with Apply Button */}
//         <Card style={{ marginBottom: 24 }}>
//           <Space size="middle" wrap>
//             {/* Employee Dropdown */}
//             <Space>
//               <UserOutlined />
//               <Select
//                 placeholder="Select Employee"
//                 style={{ width: 250 }}
//                 value={selectedMember}
//                 onChange={setSelectedMember}
//                 loading={loading}
//                 allowClear
//                 showSearch
//                 filterOption={(input, option) =>
//                   String(option?.children).toLowerCase().includes(input.toLowerCase())
//                 }
//               >
//                 {members.map((member) => (
//                   <Option key={member.value} value={member.value}>
//                     {member.label}
//                   </Option>
//                 ))}
//               </Select>
//             </Space>

//             {/* Month Dropdown */}
//             <Space>
//               <CalendarOutlined />
//               <Select
//                 placeholder="Month"
//                 style={{ width: 120 }}
//                 value={selectedMonth}
//                 onChange={setSelectedMonth}
//               >
//                 {months.map((month) => (
//                   <Option key={month.value} value={month.value}>
//                     {month.label}
//                   </Option>
//                 ))}
//               </Select>
//             </Space>

//             {/* Year Dropdown */}
//             <Space>
//               <CalendarOutlined />
//               <Select
//                 placeholder="Year"
//                 style={{ width: 100 }}
//                 value={selectedYear}
//                 onChange={setSelectedYear}
//               >
//                 {years.map((year) => (
//                   <Option key={year} value={year}>{year}</Option>
//                 ))}
//               </Select>
//             </Space>

//             {/* Apply Button */}
//             <Button
//               type="primary"
//               icon={<FilterOutlined />}
//               onClick={handleApply}
//               disabled={!selectedMember || !selectedMonth || !selectedYear}
//               loading={performanceLoading}
//             >
//               Apply Filters
//             </Button>

//             {/* Selected Info */}
//             {selectedMemberDetails && (
//               <Tag color="success">
//                 Selected: {selectedMemberDetails.label}
//               </Tag>
//             )}
//           </Space>
//         </Card>

//         {/* Performance Cards */}
//         <Spin spinning={performanceLoading || loading}>
//           <Row gutter={[16, 16]}>
//             {/* Tickets Card */}
//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 title={
//                   <Space>
//                     <span>🎫 Tickets</span>
//                     <Tag color="blue">Total: {ticketSummary.total}</Tag>
//                   </Space>
//                 }
//                 bordered={false}
//                 style={{ height: '100%' }}
//               >
//                 <div style={{ textAlign: 'center', marginBottom: 16 }}>
//                   <Title level={1} style={{ color: '#1890ff', margin: 0 }}>
//                     {ticketSummary.total}
//                   </Title>
//                   <Text type="secondary">Total Tickets</Text>
//                 </div>

//                 <Row gutter={8}>
//                   <Col span={8}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Tag color="green" style={{ fontSize: 16, padding: '4px 8px' }}>
//                         {ticketSummary.completed}
//                       </Tag>
//                       <div>
//                         <Text type="secondary">Completed</Text>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={8}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Tag color="orange" style={{ fontSize: 16, padding: '4px 8px' }}>
//                         {ticketSummary.inProgress}
//                       </Tag>
//                       <div>
//                         <Text type="secondary">In Progress</Text>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={8}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Tag color="red" style={{ fontSize: 16, padding: '4px 8px' }}>
//                         {ticketSummary.pending}
//                       </Tag>
//                       <div>
//                         <Text type="secondary">Pending</Text>
//                       </div>
//                     </div>
//                   </Col>
//                 </Row>

//                 {/* Progress Bar */}
//                 {ticketSummary.total > 0 && (
//                   <div style={{ marginTop: 16 }}>
//                     <div style={{
//                       height: 8,
//                       background: '#f0f0f0',
//                       borderRadius: 4,
//                       overflow: 'hidden'
//                     }}>
//                       <div style={{
//                         width: `${(ticketSummary.completed / ticketSummary.total) * 100}%`,
//                         height: '100%',
//                         background: '#52c41a'
//                       }} />
//                     </div>
//                     <div style={{ marginTop: 8, textAlign: 'center' }}>
//                       <Text strong style={{ color: '#52c41a' }}>
//                         {Math.round((ticketSummary.completed / ticketSummary.total) * 100)}% Complete
//                       </Text>
//                     </div>
//                   </div>
//                 )}
//               </Card>
//             </Col>

//             {/* Attendance Card - Placeholder */}
//             <Col xs={24} sm={12} md={6}>
//               <Card title="⏰ Attendance" bordered={false} style={{ height: '100%' }}>
//                 <div style={{ textAlign: 'center' }}>
//                   <Title level={1} style={{ color: '#fa8c16', margin: 0 }}>0%</Title>
//                   <Text type="secondary">Present: 0 days</Text>
//                 </div>
//               </Card>
//             </Col>

//             {/* 📅 Daily Updates Card - With BOD & EOD */}
//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 title={
//                   <Space>
//                     <span>📅 Daily Updates</span>
//                     <Tag color="purple">Total: {dailyUpdatesSummary.total}</Tag>
//                   </Space>
//                 }
//                 bordered={false}
//                 style={{ height: '100%' }}
//               >
//                 <Row gutter={16}>
//                   <Col span={12}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
//                         {dailyUpdatesSummary.bod}
//                       </Title>
//                       <div>
//                         <Tag color="blue" style={{ marginTop: 8 }}>BOD</Tag>
//                       </div>
//                       <Text type="secondary" style={{ fontSize: 12 }}>
//                         Morning Updates
//                       </Text>
//                     </div>
//                   </Col>
//                   <Col span={12}>
//                     <div style={{ textAlign: 'center' }}>
//                       <Title level={2} style={{ color: '#722ed1', margin: 0 }}>
//                         {dailyUpdatesSummary.eod}
//                       </Title>
//                       <div>
//                         <Tag color="purple" style={{ marginTop: 8 }}>EOD</Tag>
//                       </div>
//                       <Text type="secondary" style={{ fontSize: 12 }}>
//                         Evening Updates
//                       </Text>
//                     </div>
//                   </Col>
//                 </Row>

//                 {/* Progress - Days with Updates */}
//                 {(() => {
//                   const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
//                   const daysWithUpdates = Math.max(dailyUpdatesSummary.bod, dailyUpdatesSummary.eod);
//                   const percentage = Math.round((daysWithUpdates / daysInMonth) * 100) || 0;

//                   return (
//                     <div style={{ marginTop: 16 }}>
//                       <div style={{
//                         height: 8,
//                         background: '#f0f0f0',
//                         borderRadius: 4,
//                         overflow: 'hidden'
//                       }}>
//                         <div style={{
//                           width: `${percentage}%`,
//                           height: '100%',
//                           background: '#722ed1'
//                         }} />
//                       </div>
//                       <div style={{ marginTop: 8, textAlign: 'center' }}>
//                         <Text strong style={{ color: '#722ed1' }}>
//                           {percentage}% Days with Updates
//                         </Text>
//                       </div>
//                     </div>
//                   );
//                 })()}
//               </Card>
//             </Col>

//             {/* Leaves Card - Placeholder */}
//             <Col xs={24} sm={12} md={6}>
//               <Card title="🏖 Leaves" bordered={false} style={{ height: '100%' }}>
//                 <div style={{ textAlign: 'center' }}>
//                   <Title level={1} style={{ color: '#52c41a', margin: 0 }}>0</Title>
//                   <Text type="secondary">Taken: 0 | Permissions: 0</Text>
//                 </div>
//               </Card>
//             </Col>
//           </Row>

//           {/* Ticket Distribution Chart */}
//           {ticketDistribution.length > 0 && (
//             <Card style={{ marginTop: 24 }} title="Ticket Distribution">
//               <Row gutter={24}>
//                 <Col xs={24} md={12}>
//                   <div style={{ height: 300 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie
//                           data={ticketDistribution}
//                           cx="50%"
//                           cy="50%"
//                           innerRadius={60}
//                           outerRadius={100}
//                           paddingAngle={5}
//                           dataKey="value"
//                           label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                         >
//                           {ticketDistribution.map((entry: any, index: number) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                         <Legend />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </Col>
//                 <Col xs={24} md={12}>
//                   <div style={{ padding: '20px' }}>
//                     <Title level={4}>Summary</Title>
//                     <p>Total Tickets: <strong>{ticketSummary.total}</strong></p>
//                     <p>✅ Completed: <strong style={{ color: '#52c41a' }}>{ticketSummary.completed}</strong></p>
//                     <p>🔄 In Progress: <strong style={{ color: '#faad14' }}>{ticketSummary.inProgress}</strong></p>
//                     <p>⏳ Pending: <strong style={{ color: '#f5222d' }}>{ticketSummary.pending}</strong></p>
//                   </div>
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           {/* 📅 Daily Updates Log - Only shows dates with updates */}
//           {existingUpdates.length > 0 && (
//             <Card
//               style={{ marginTop: 24 }}
//               title={
//                 <Space>
//                   <span>📋 Daily Updates Log</span>
//                   <Tag color="purple">Total Updates: {existingUpdates.length}</Tag>
//                   <Tag color="blue">BOD: {dailyUpdatesSummary.bod}</Tag>
//                   <Tag color="purple">EOD: {dailyUpdatesSummary.eod}</Tag>
//                 </Space>
//               }
//             >
//               <Table
//                 columns={dailyUpdateColumns}
//                 dataSource={existingUpdates}
//                 rowKey="key"
//                 pagination={{ pageSize: 10 }}
//                 size="middle"
//               />
//             </Card>
//           )}

//           {/* Show message if no updates */}
//           {existingUpdates.length === 0 && appliedFilters.userId && (
//             <Card style={{ marginTop: 24 }}>
//               <Text type="secondary">No daily updates found for this employee in {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</Text>
//             </Card>
//           )}
//         </Spin>

//         {/* Info Card */}
//         <Card style={{ marginTop: 24 }}>
//           <Space direction="vertical">
//             <Text type="secondary">
//               {members.length} employees available • Select employee and month/year, then click Apply
//             </Text>
//             {selectedMember && selectedMonth && selectedYear && (
//               <Tag color="blue">
//                 Showing data for: {selectedMemberDetails?.label} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
//               </Tag>
//             )}
//           </Space>
//         </Card>
//       </div>
//     </MainLayout>
//   );
// }left and right side

// "use client";

// import React, { useState, useEffect } from "react";
// import { Card, Row, Col, Typography, Select, Space, Spin, Tag, Button, Table, Avatar, Statistic, Progress, Divider } from "antd";
// import {
//   UserOutlined,
//   CalendarOutlined,
//   FilterOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   TagOutlined,
//   ClockCircleOutlined,
//   FileTextOutlined,
//   RiseOutlined,
//   FallOutlined,
//   MinusOutlined
// } from "@ant-design/icons";
// import MainLayout from "@/components/layout/MainLayout";
// import { MembersService } from "@/services/membersService";
// import { usePerformance } from "@/hooks/userPerformance";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// import dayjs from "dayjs";

// const { Option } = Select;
// const { Title, Text } = Typography;

// export default function PerformanceManagePage() {
//   const [loading, setLoading] = useState(false);
//   const [members, setMembers] = useState<any[]>([]);
//   const [selectedMember, setSelectedMember] = useState<string>();
//   const [selectedMonth, setSelectedMonth] = useState<string>("3");
//   const [selectedYear, setSelectedYear] = useState<string>("2026");

//   // Filters for API
//   const [appliedFilters, setAppliedFilters] = useState<{
//     userId?: string;
//     month?: string;
//     year?: string;
//   }>({});

//   // Use the performance hook
//   const { data: performanceData, isLoading: performanceLoading } = usePerformance(appliedFilters);

//   // Fetch members on page load
//   useEffect(() => {
//     fetchMembers();
//   }, []);

//   const fetchMembers = async () => {
//     try {
//       setLoading(true);
//       const membersData = await MembersService.getMembersForSelect({
//         role: "user"
//       });
//       setMembers(membersData || []);
//     } catch (error) {
//       console.error("Failed to fetch members:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Apply filters
//   const handleApply = () => {
//     if (selectedMember && selectedMonth && selectedYear) {
//       setAppliedFilters({
//         userId: selectedMember,
//         month: selectedMonth,
//         year: selectedYear
//       });
//     }
//   };

//   // Month options
//   const months = [
//     { value: "1", label: "January" },
//     { value: "2", label: "February" },
//     { value: "3", label: "March" },
//     { value: "4", label: "April" },
//     { value: "5", label: "May" },
//     { value: "6", label: "June" },
//     { value: "7", label: "July" },
//     { value: "8", label: "August" },
//     { value: "9", label: "September" },
//     { value: "10", label: "October" },
//     { value: "11", label: "November" },
//     { value: "12", label: "December" },
//   ];

//   const years = ["2024", "2025", "2026"];

//   const selectedMemberDetails = members.find(m => m.value === selectedMember);

//   // Ticket data from API
//   const ticketSummary = performanceData?.tickets?.summary || {
//     total: 0,
//     completed: 0,
//     inProgress: 0,
//     pending: 0
//   };

//   const ticketDistribution = performanceData?.tickets?.distribution || [];

//   // Daily Updates data from API
//   const dailyUpdatesSummary = performanceData?.dailyUpdates?.summary || {
//     bod: 0,
//     eod: 0,
//     total: 0
//   };

//   // 📅 Get only the updates that exist
//   const existingUpdates = performanceData?.dailyUpdates?.logs || [];

//   // Table columns for Daily Updates
//   const dailyUpdateColumns = [
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//       width: 100,
//       render: (text: string) => dayjs(text).format("DD MMM"),
//     },
//     {
//       title: 'BOD',
//       dataIndex: 'bod',
//       key: 'bod',
//       width: 70,
//       align: 'center' as const,
//       render: (bod: boolean) => bod ? '✅' : '❌',
//     },
//     {
//       title: 'EOD',
//       dataIndex: 'eod',
//       key: 'eod',
//       width: 70,
//       align: 'center' as const,
//       render: (eod: boolean) => eod ? '✅' : '❌',
//     },
//     {
//       title: 'Status',
//       dataIndex: 'type',
//       key: 'type',
//       width: 100,
//       render: (type: string, record: any) => {
//         if (record.bod && record.eod) return 'Complete';
//         if (record.bod) return 'BOD Only';
//         if (record.eod) return 'EOD Only';
//         return 'Missed';
//       },
//     },
//   ];

//   // Calculate summary statistics
//   const completionRate = ticketSummary.total > 0
//     ? Math.round((ticketSummary.completed / ticketSummary.total) * 100)
//     : 0;

//   const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
//   const updateRate = Math.round((dailyUpdatesSummary.total / daysInMonth) * 100) || 0;

//   const performanceScore = Math.round((completionRate + updateRate) / 2);

//   return (
//     <MainLayout>
//       <div style={{ padding: "16px", background: '#f0f2f5', minHeight: '100vh' }}>
//         {/* Simple Header */}
//         <div style={{ marginBottom: 16 }}>
//           <Title level={3} style={{ margin: 0 }}>Performance Management</Title>
//           <Text type="secondary">Track employee performance metrics</Text>
//         </div>

//         {/* Compact Filters */}
//         <Card size="small" style={{ marginBottom: 16 }}>
//           <Space wrap>
//             <Select
//               placeholder="Select Employee"
//               style={{ width: 200 }}
//               size="small"
//               value={selectedMember}
//               onChange={setSelectedMember}
//               loading={loading}
//               allowClear
//               showSearch
//             >
//               {members.map((member) => (
//                 <Option key={member.value} value={member.value}>{member.label}</Option>
//               ))}
//             </Select>

//             <Select
//               placeholder="Month"
//               style={{ width: 100 }}
//               size="small"
//               value={selectedMonth}
//               onChange={setSelectedMonth}
//             >
//               {months.map((month) => (
//                 <Option key={month.value} value={month.value}>{month.label}</Option>
//               ))}
//             </Select>

//             <Select
//               placeholder="Year"
//               style={{ width: 80 }}
//               size="small"
//               value={selectedYear}
//               onChange={setSelectedYear}
//             >
//               {years.map((year) => (
//                 <Option key={year} value={year}>{year}</Option>
//               ))}
//             </Select>

//             <Button
//               type="primary"
//               size="small"
//               icon={<FilterOutlined />}
//               onClick={handleApply}
//               disabled={!selectedMember || !selectedMonth || !selectedYear}
//               loading={performanceLoading}
//             >
//               Apply
//             </Button>

//             {selectedMemberDetails && (
//               <Tag color="processing">{selectedMemberDetails.label}</Tag>
//             )}
//           </Space>
//         </Card>

//         {/* Main Content - Full Width Compact */}
//         <Spin spinning={performanceLoading || loading}>
//           {/* Summary Stats Row */}
//           {selectedMember && (
//             <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
//               <Col span={6}>
//                 <Card size="small">
//                   <Statistic
//                     title="Performance"
//                     value={performanceScore}
//                     suffix="%"
//                     valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
//                   />
//                 </Card>
//               </Col>
//               <Col span={6}>
//                 <Card size="small">
//                   <Statistic
//                     title="Tickets"
//                     value={ticketSummary.completed}
//                     suffix={`/ ${ticketSummary.total}`}
//                     valueStyle={{ fontSize: 20 }}
//                   />
//                 </Card>
//               </Col>
//               <Col span={6}>
//                 <Card size="small">
//                   <Statistic
//                     title="Updates"
//                     value={dailyUpdatesSummary.total}
//                     suffix={`/ ${daysInMonth}`}
//                     valueStyle={{ fontSize: 20 }}
//                   />
//                 </Card>
//               </Col>
//               <Col span={6}>
//                 <Card size="small">
//                   <Statistic
//                     title="BOD/EOD"
//                     value={`${dailyUpdatesSummary.bod}/${dailyUpdatesSummary.eod}`}
//                     valueStyle={{ fontSize: 20 }}
//                   />
//                 </Card>
//               </Col>
//             </Row>
//           )}

//           {/* Tickets Overview */}
//           <Card
//             size="small"
//             title={
//               <Space size={4}>
//                 <TagOutlined />
//                 <span style={{ fontSize: 14 }}>Tickets Overview</span>
//               </Space>
//             }
//             extra={<Tag color="blue">Total: {ticketSummary.total}</Tag>}
//             style={{ marginBottom: 16 }}
//           >
//             <Row gutter={[8, 8]}>
//               <Col span={8}>
//                 <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4 }}>
//                   <Text type="secondary" style={{ fontSize: 12 }}>Completed</Text>
//                   <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
//                     {ticketSummary.completed}
//                   </div>
//                   <Progress percent={completionRate} size="small" showInfo={false} strokeColor="#52c41a" />
//                 </div>
//               </Col>
//               <Col span={8}>
//                 <div style={{ background: '#fff7e6', padding: 8, borderRadius: 4 }}>
//                   <Text type="secondary" style={{ fontSize: 12 }}>In Progress</Text>
//                   <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fa8c16' }}>
//                     {ticketSummary.inProgress}
//                   </div>
//                 </div>
//               </Col>
//               <Col span={8}>
//                 <div style={{ background: '#fff1f0', padding: 8, borderRadius: 4 }}>
//                   <Text type="secondary" style={{ fontSize: 12 }}>Pending</Text>
//                   <div style={{ fontSize: 18, fontWeight: 'bold', color: '#f5222d' }}>
//                     {ticketSummary.pending}
//                   </div>
//                 </div>
//               </Col>
//             </Row>

//             {/* Mini Chart */}
//             {ticketDistribution.length > 0 && (
//               <div style={{ marginTop: 12, height: 150 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={ticketDistribution}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" tick={{ fontSize: 10 }} />
//                     <YAxis tick={{ fontSize: 10 }} />
//                     <Tooltip />
//                     <Bar dataKey="value">
//                       {ticketDistribution.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             )}
//           </Card>

//           {/* Daily Updates Log */}
//           {existingUpdates.length > 0 && (
//             <Card
//               size="small"
//               title={
//                 <Space size={4}>
//                   <FileTextOutlined />
//                   <span style={{ fontSize: 14 }}>Daily Updates Log</span>
//                 </Space>
//               }
//               extra={
//                 <Space size={4}>
//                   <Tag color="blue">BOD: {dailyUpdatesSummary.bod}</Tag>
//                   <Tag color="purple">EOD: {dailyUpdatesSummary.eod}</Tag>
//                 </Space>
//               }
//             >
//               <Table
//                 columns={dailyUpdateColumns}
//                 dataSource={existingUpdates}
//                 rowKey="key"
//                 pagination={{ pageSize: 5 }}
//                 size="small"
//               />
//             </Card>
//           )}

//           {/* Employee Summary - Compact */}
//           {selectedMemberDetails && (
//             <Card size="small" style={{ marginTop: 16 }}>
//               <Space>
//                 <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
//                 <div>
//                   <Text strong>{selectedMemberDetails.label}</Text>
//                   <div>
//                     <Tag color="blue" style={{ fontSize: 11 }}>Tickets: {ticketSummary.total}</Tag>
//                     <Tag color="purple" style={{ fontSize: 11 }}>Updates: {dailyUpdatesSummary.total}</Tag>
//                     <Tag color="green" style={{ fontSize: 11 }}>Score: {performanceScore}%</Tag>
//                   </div>
//                 </div>
//               </Space>
//             </Card>
//           )}
//         </Spin>
//       </div>
//     </MainLayout>
//   );
// }

// "use client";

// import React, { useState, useEffect } from "react";
// import { Card, Row, Col, Typography, Select, Space, Spin, Tag, Button, Table, Avatar, Statistic, Progress } from "antd";
// import {
//   UserOutlined,
//   CalendarOutlined,
//   FilterOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   TagOutlined,
//   ClockCircleOutlined,
//   FileTextOutlined,
//   RiseOutlined,
//   FallOutlined,
//   MinusOutlined
// } from "@ant-design/icons";
// import MainLayout from "@/components/layout/MainLayout";
// import { MembersService } from "@/services/membersService";
// import { usePerformance } from "@/hooks/userPerformance";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// import dayjs from "dayjs";

// const { Option } = Select;
// const { Title, Text } = Typography;

// export default function PerformanceManagePage() {
//   const [loading, setLoading] = useState(false);
//   const [members, setMembers] = useState<any[]>([]);
//   const [selectedMember, setSelectedMember] = useState<string>();
//   const [selectedMonth, setSelectedMonth] = useState<string>("3");
//   const [selectedYear, setSelectedYear] = useState<string>("2026");

//   // Filters for API
//   const [appliedFilters, setAppliedFilters] = useState<{
//     userId?: string;
//     month?: string;
//     year?: string;
//   }>({});

//   // Use the performance hook
//   const { data: performanceData, isLoading: performanceLoading } = usePerformance(appliedFilters);

//   // Fetch members on page load
//   useEffect(() => {
//     fetchMembers();
//   }, []);

//   const fetchMembers = async () => {
//     try {
//       setLoading(true);
//       const membersData = await MembersService.getMembersForSelect({
//         role: "user"
//       });
//       setMembers(membersData || []);
//     } catch (error) {
//       console.error("Failed to fetch members:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Apply filters
//   const handleApply = () => {
//     if (selectedMember && selectedMonth && selectedYear) {
//       setAppliedFilters({
//         userId: selectedMember,
//         month: selectedMonth,
//         year: selectedYear
//       });
//     }
//   };

//   // Month options
//   const months = [
//     { value: "1", label: "January" },
//     { value: "2", label: "February" },
//     { value: "3", label: "March" },
//     { value: "4", label: "April" },
//     { value: "5", label: "May" },
//     { value: "6", label: "June" },
//     { value: "7", label: "July" },
//     { value: "8", label: "August" },
//     { value: "9", label: "September" },
//     { value: "10", label: "October" },
//     { value: "11", label: "November" },
//     { value: "12", label: "December" },
//   ];

//   const years = ["2024", "2025", "2026"];

//   const selectedMemberDetails = members.find(m => m.value === selectedMember);

//   // Ticket data from API
//   const ticketSummary = performanceData?.tickets?.summary || {
//     total: 0,
//     completed: 0,
//     inProgress: 0,
//     pending: 0
//   };

//   const ticketDistribution = performanceData?.tickets?.distribution || [];

//   // Daily Updates data from API
//   const dailyUpdatesSummary = performanceData?.dailyUpdates?.summary || {
//     bod: 0,
//     eod: 0,
//     total: 0
//   };

//   // Get the updates that exist
//   const existingUpdates = performanceData?.dailyUpdates?.logs || [];

//   // Table columns for Daily Updates
//   const dailyUpdateColumns = [
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//       width: 100,
//       render: (text: string) => dayjs(text).format("DD MMM"),
//     },
//     {
//       title: 'BOD',
//       dataIndex: 'bod',
//       key: 'bod',
//       width: 60,
//       align: 'center' as const,
//       render: (bod: boolean) => bod ? '✅' : '❌',
//     },
//     {
//       title: 'EOD',
//       dataIndex: 'eod',
//       key: 'eod',
//       width: 60,
//       align: 'center' as const,
//       render: (eod: boolean) => eod ? '✅' : '❌',
//     },
//     {
//       title: 'Status',
//       dataIndex: 'type',
//       key: 'type',
//       width: 90,
//       render: (type: string, record: any) => {
//         if (record.bod && record.eod) return 'Complete';
//         if (record.bod) return 'BOD Only';
//         if (record.eod) return 'EOD Only';
//         return 'Missed';
//       },
//     },
//   ];

//   // Calculate summary statistics
//   const completionRate = ticketSummary.total > 0
//     ? Math.round((ticketSummary.completed / ticketSummary.total) * 100)
//     : 0;

//   const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
//   const updateRate = Math.round((dailyUpdatesSummary.total / daysInMonth) * 100) || 0;

//   const performanceScore = Math.round((completionRate + updateRate) / 2);

//   return (
//     <MainLayout>
//       <div style={{ padding: "16px", minHeight: '100vh' }}>
//         {/* Header */}
//         <div style={{ marginBottom: 16 }}>
//           <Title level={3} style={{ margin: 0 }}>Performance Management</Title>
//           <Text type="secondary">Track employee performance metrics</Text>
//         </div>

//         {/* Filters */}
//         <Card size="small" style={{ marginBottom: 16 }}>
//           <Space wrap>
//             <Select
//               placeholder="Select Employee"
//               style={{ width: 200 }}
//               size="small"
//               value={selectedMember}
//               onChange={setSelectedMember}
//               loading={loading}
//               allowClear
//               showSearch
//             >
//               {members.map((member) => (
//                 <Option key={member.value} value={member.value}>{member.label}</Option>
//               ))}
//             </Select>

//             <Select
//               placeholder="Month"
//               style={{ width: 100 }}
//               size="small"
//               value={selectedMonth}
//               onChange={setSelectedMonth}
//             >
//               {months.map((month) => (
//                 <Option key={month.value} value={month.value}>{month.label}</Option>
//               ))}
//             </Select>

//             <Select
//               placeholder="Year"
//               style={{ width: 80 }}
//               size="small"
//               value={selectedYear}
//               onChange={setSelectedYear}
//             >
//               {years.map((year) => (
//                 <Option key={year} value={year}>{year}</Option>
//               ))}
//             </Select>

//             <Button
//               type="primary"
//               size="small"
//               icon={<FilterOutlined />}
//               onClick={handleApply}
//               disabled={!selectedMember || !selectedMonth || !selectedYear}
//               loading={performanceLoading}
//             >
//               Apply
//             </Button>

//             {selectedMemberDetails && (
//               <Tag color="processing">{selectedMemberDetails.label}</Tag>
//             )}
//           </Space>
//         </Card>

//         {/* Main Content - 70/30 Layout */}
//         <Spin spinning={performanceLoading || loading}>
//           <Row gutter={[16, 16]}>
//             {/* LEFT COLUMN - 70% - Detailed View */}
//             <Col xs={24} lg={17}>
//               {/* Quick Stats Row */}
//               {selectedMember && (
//                 <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
//                   <Col span={6}>
//                     <Card size="small">
//                       <Statistic
//                         title="Performance"
//                         value={performanceScore}
//                         suffix="%"
//                         valueStyle={{ fontSize: 18, fontWeight: 'bold' }}
//                       />
//                     </Card>
//                   </Col>
//                   <Col span={6}>
//                     <Card size="small">
//                       <Statistic
//                         title="Completed"
//                         value={ticketSummary.completed}
//                         suffix={`/ ${ticketSummary.total}`}
//                         valueStyle={{ fontSize: 18 }}
//                       />
//                     </Card>
//                   </Col>
//                   <Col span={6}>
//                     <Card size="small">
//                       <Statistic
//                         title="Updates"
//                         value={dailyUpdatesSummary.total}
//                         suffix={`/ ${daysInMonth}`}
//                         valueStyle={{ fontSize: 18 }}
//                       />
//                     </Card>
//                   </Col>
//                   <Col span={6}>
//                     <Card size="small">
//                       <Statistic
//                         title="BOD/EOD"
//                         value={`${dailyUpdatesSummary.bod}/${dailyUpdatesSummary.eod}`}
//                         valueStyle={{ fontSize: 18 }}
//                       />
//                     </Card>
//                   </Col>
//                 </Row>
//               )}

//               {/* Tickets Overview - Full Width in Left Column */}
//               <Card
//                 size="small"
//                 title={
//                   <Space size={4}>
//                     <TagOutlined />
//                     <span style={{ fontSize: 14 }}>Tickets Overview</span>
//                   </Space>
//                 }
//                 extra={<Tag color="blue">Total: {ticketSummary.total}</Tag>}
//                 style={{ marginBottom: 16 }}
//               >
//                 <Row gutter={[8, 8]}>
//                   <Col span={8}>
//                     <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4 }}>
//                       <Text type="secondary" style={{ fontSize: 12 }}>Completed</Text>
//                       <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
//                         {ticketSummary.completed}
//                       </div>
//                       <Progress percent={completionRate} size="small" showInfo={false} strokeColor="#52c41a" />
//                     </div>
//                   </Col>
//                   <Col span={8}>
//                     <div style={{ background: '#fff7e6', padding: 8, borderRadius: 4 }}>
//                       <Text type="secondary" style={{ fontSize: 12 }}>In Progress</Text>
//                       <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
//                         {ticketSummary.inProgress}
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={8}>
//                     <div style={{ background: '#fff1f0', padding: 8, borderRadius: 4 }}>
//                       <Text type="secondary" style={{ fontSize: 12 }}>Pending</Text>
//                       <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f5222d' }}>
//                         {ticketSummary.pending}
//                       </div>
//                     </div>
//                   </Col>
//                 </Row>

//                 {/* Bar Chart */}
//                 {ticketDistribution.length > 0 && (
//                   <div style={{ marginTop: 12, height: 180 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                       <BarChart data={ticketDistribution}>
//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis dataKey="name" tick={{ fontSize: 11 }} />
//                         <YAxis tick={{ fontSize: 11 }} />
//                         <Tooltip />
//                         <Bar dataKey="value">
//                           {ticketDistribution.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Bar>
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </div>
//                 )}
//               </Card>

//               {/* Daily Updates Log - Full Width in Left Column */}
//               {existingUpdates.length > 0 && (
//                 <Card
//                   size="small"
//                   title={
//                     <Space size={4}>
//                       <FileTextOutlined />
//                       <span style={{ fontSize: 14 }}>Daily Updates Log</span>
//                     </Space>
//                   }
//                   extra={
//                     <Space size={4}>
//                       <Tag color="blue">BOD: {dailyUpdatesSummary.bod}</Tag>
//                       <Tag color="purple">EOD: {dailyUpdatesSummary.eod}</Tag>
//                     </Space>
//                   }
//                 >
//                   <Table
//                     columns={dailyUpdateColumns}
//                     dataSource={existingUpdates}
//                     rowKey="key"
//                     pagination={{ pageSize: 5 }}
//                     size="small"
//                   />
//                 </Card>
//               )}
//             </Col>

//             {/* RIGHT COLUMN - 30% - Summary View */}
//             <Col xs={24} lg={7}>
//               {/* Employee Profile Card */}
//               {selectedMemberDetails && (
//                 <Card size="small" style={{ marginBottom: 16, textAlign: 'center' }}>
//                   <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#87d068', marginBottom: 8 }} />
//                   <Title level={5} style={{ margin: '4px 0' }}>{selectedMemberDetails.label}</Title>
//                   <Tag color="blue">Active Member</Tag>

//                   <div style={{ marginTop: 12 }}>
//                     <Row gutter={8}>
//                       <Col span={12}>
//                         <Statistic title="Tickets" value={ticketSummary.total} suffix="total" size="small" />
//                       </Col>
//                       <Col span={12}>
//                         <Statistic title="Updates" value={dailyUpdatesSummary.total} suffix="days" />
//                       </Col>
//                     </Row>
//                   </div>
//                 </Card>
//               )}

//               {/* Performance Summary Card */}
//               <Card
//                 size="small"
//                 title="Performance Summary"
//                 style={{ marginBottom: 16 }}
//               >
//                 <Space direction="vertical" size="middle" style={{ width: '100%' }}>
//                   <div>
//                     <Text type="secondary" style={{ fontSize: 12 }}>Ticket Completion</Text>
//                     <Progress
//                       percent={completionRate}
//                       size="small"
//                       strokeColor="#52c41a"
//                       format={(percent) => `${percent}%`}
//                     />
//                   </div>

//                   <div>
//                     <Text type="secondary" style={{ fontSize: 12 }}>Update Rate</Text>
//                     <Progress
//                       percent={updateRate}
//                       size="small"
//                       strokeColor="#1890ff"
//                       format={(percent) => `${percent}%`}
//                     />
//                   </div>

//                   <div>
//                     <Text type="secondary" style={{ fontSize: 12 }}>BOD Completion</Text>
//                     <Progress
//                       percent={dailyUpdatesSummary.total > 0 ? Math.round((dailyUpdatesSummary.bod / dailyUpdatesSummary.total) * 100) : 0}
//                       size="small"
//                       strokeColor="#722ed1"
//                     />
//                   </div>

//                   <div>
//                     <Text type="secondary" style={{ fontSize: 12 }}>EOD Completion</Text>
//                     <Progress
//                       percent={dailyUpdatesSummary.total > 0 ? Math.round((dailyUpdatesSummary.eod / dailyUpdatesSummary.total) * 100) : 0}
//                       size="small"
//                       strokeColor="#fa8c16"
//                     />
//                   </div>
//                 </Space>
//               </Card>

//               {/* Quick Stats Card */}
//               <Card size="small">
//                 <Statistic
//                   title="Overall Performance"
//                   value={performanceScore}
//                   suffix="%"
//                   valueStyle={{ fontSize: 32, fontWeight: 'bold', color: '#722ed1' }}
//                 />
//                 <div style={{ marginTop: 8 }}>
//                   <Row gutter={8}>
//                     <Col span={12}>
//                       <Tag color="green" style={{ width: '100%', textAlign: 'center' }}>
//                         ✅ {ticketSummary.completed} Done
//                       </Tag>
//                     </Col>
//                     <Col span={12}>
//                       <Tag color="blue" style={{ width: '100%', textAlign: 'center' }}>
//                         📅 {dailyUpdatesSummary.total} Updates
//                       </Tag>
//                     </Col>
//                   </Row>
//                 </div>
//               </Card>
//             </Col>
//           </Row>
//         </Spin>
//       </div>
//     </MainLayout>
//   );
// }working

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Space,
  Spin,
  Tag,
  Button,
  Table,
  Avatar,
  Statistic,
  Progress,
} from "antd";
import {
  UserOutlined,
  FilterOutlined,
  TagOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import { MembersService } from "@/services/membersService";
import { usePerformance } from "@/hooks/userPerformance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import dayjs from "dayjs";

const { Option } = Select;
const { Title, Text } = Typography;

export default function PerformanceManagePage() {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>();
  const [selectedMonth, setSelectedMonth] = useState<string>("3");
  const [selectedYear, setSelectedYear] = useState<string>("2026");

  // Filters for API
  const [appliedFilters, setAppliedFilters] = useState<{
    userId?: string;
    month?: string;
    year?: string;
  }>({});

  // Use the performance hook
  const { data: performanceData, isLoading: performanceLoading } =
    usePerformance(appliedFilters);

  // Fetch members on page load
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const membersData = await MembersService.getMembersForSelect({
        role: "user",
      });
      setMembers(membersData || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const handleApply = () => {
    if (selectedMember && selectedMonth && selectedYear) {
      setAppliedFilters({
        userId: selectedMember,
        month: selectedMonth,
        year: selectedYear,
      });
    }
  };

  // Month options
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = ["2024", "2025", "2026"];

  const selectedMemberDetails = members.find((m) => m.value === selectedMember);

  // Ticket data from API
  const ticketSummary = performanceData?.tickets?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  };

  const ticketDistribution = performanceData?.tickets?.distribution || [];

  // Daily Updates data from API
  const dailyUpdatesSummary = performanceData?.dailyUpdates?.summary || {
    bod: 0,
    eod: 0,
    total: 0,
  };

  // Get the updates that exist
  const existingUpdates = performanceData?.dailyUpdates?.logs || [];

  // Table columns for Daily Updates
  const dailyUpdateColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (text: string) => dayjs(text).format("DD MMM"),
    },
    {
      title: "BOD",
      dataIndex: "bod",
      key: "bod",
      width: 60,
      align: "center" as const,
      render: (bod: boolean) => (bod ? "✅" : "❌"),
    },
    {
      title: "EOD",
      dataIndex: "eod",
      key: "eod",
      width: 60,
      align: "center" as const,
      render: (eod: boolean) => (eod ? "✅" : "❌"),
    },
    {
      title: "Status",
      dataIndex: "type",
      key: "type",
      width: 90,
      render: (type: string, record: any) => {
        if (record.bod && record.eod) return "Complete";
        if (record.bod) return "BOD Only";
        if (record.eod) return "EOD Only";
        return "Missed";
      },
    },
  ];

  // Calculate summary statistics
  const completionRate =
    ticketSummary.total > 0
      ? Math.round((ticketSummary.completed / ticketSummary.total) * 100)
      : 0;

//   const daysInMonth = new Date(
//     parseInt(selectedYear),
//     parseInt(selectedMonth),
//     0,
//   ).getDate();
const daysInMonth = dayjs(`${selectedYear}-${selectedMonth}-01`).daysInMonth();
  const updateRate =
    Math.round((dailyUpdatesSummary.total / daysInMonth) * 100) || 0;

  const performanceScore = Math.round((completionRate + updateRate) / 2);

  // BOD and EOD out of format
  const bodOutOf = `${dailyUpdatesSummary.bod}/${daysInMonth}`;
  const eodOutOf = `${dailyUpdatesSummary.eod}/${daysInMonth}`;

  useEffect(() => {
    console.log("🔍 Debug: selectedMember", selectedMember);
    console.log("🔍 Debug: performanceData", performanceData);
    console.log("🔍 Debug: ticketSummary", ticketSummary);
    console.log("🔍 Debug: existingUpdates", existingUpdates);
    console.log("🔍 Debug: performanceLoading", performanceLoading);
  }, [
    selectedMember,
    performanceData,
    performanceLoading,
    ticketSummary,
    existingUpdates,
  ]);

  return (
    <MainLayout>
      <div style={{ padding: "16px", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            Performance Management
          </Title>
          <Text type="secondary">Track employee performance metrics</Text>
        </div>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Select Employee"
              style={{ width: 200 }}
              size="small"
              value={selectedMember}
              onChange={setSelectedMember}
              loading={loading}
              allowClear
              showSearch
            >
              {members.map((member) => (
                <Option key={member.value} value={member.value}>
                  {member.label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Month"
              style={{ width: 100 }}
              size="small"
              value={selectedMonth}
              onChange={setSelectedMonth}
            >
              {months.map((month) => (
                <Option key={month.value} value={month.value}>
                  {month.label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Year"
              style={{ width: 80 }}
              size="small"
              value={selectedYear}
              onChange={setSelectedYear}
            >
              {years.map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              size="small"
              icon={<FilterOutlined />}
              onClick={handleApply}
              disabled={!selectedMember || !selectedMonth || !selectedYear}
              loading={performanceLoading}
            >
              Apply
            </Button>

            {selectedMemberDetails && (
              <Tag color="processing">{selectedMemberDetails.label}</Tag>
            )}
          </Space>
        </Card>

        {/* Main Content - 70/30 Layout */}
        <Spin spinning={performanceLoading || loading}>
          <Row gutter={[16, 16]}>
            {/* LEFT COLUMN - 70% - Detailed View */}
            <Col xs={24} lg={17}>
              {/* Top 4 Cards Row - Inside Left Column */}
              {selectedMember && (
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Total Tickets"
                        value={ticketSummary.total}
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#1890ff",
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          Completed: {ticketSummary.completed}
                        </Text>
                        <Progress
                          percent={completionRate}
                          size="small"
                          showInfo={false}
                          strokeColor="#52c41a"
                        />
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Attendance"
                        value={0}
                        suffix={`/ ${daysInMonth}`}
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#722ed1",
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">0% present</Text>
                        <Progress
                          percent={0}
                          size="small"
                          showInfo={false}
                          strokeColor="#722ed1"
                        />
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Daily Updates"
                        value={dailyUpdatesSummary.total}
                        suffix={`/ ${daysInMonth}`}
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#fa8c16",
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Space
                          direction="vertical"
                          size={4}
                          style={{ width: "100%" }}
                        >
                          <Text type="secondary">BOD: {bodOutOf}</Text>
                          <Text type="secondary">EOD: {eodOutOf}</Text>
                          <Progress
                            percent={updateRate}
                            size="small"
                            showInfo={false}
                            strokeColor="#fa8c16"
                          />
                        </Space>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Leaves"
                        value={0}
                        suffix="/ 0"
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#f5222d",
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">0 remaining</Text>
                        <Progress
                          percent={0}
                          size="small"
                          showInfo={false}
                          strokeColor="#f5222d"
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Tickets Overview */}
              <Card
                size="small"
                title={
                  <Space size={4}>
                    <TagOutlined />
                    <span style={{ fontSize: 14 }}>Tickets Overview</span>
                  </Space>
                }
                extra={<Tag color="blue">Total: {ticketSummary.total}</Tag>}
                style={{ marginBottom: 16 }}
              >
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <div
                      style={{
                        background: "#f6ffed",
                        padding: 8,
                        borderRadius: 4,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Completed
                      </Text>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#52c41a",
                        }}
                      >
                        {ticketSummary.completed}
                      </div>
                      <Progress
                        percent={completionRate}
                        size="small"
                        showInfo={false}
                        strokeColor="#52c41a"
                      />
                    </div>
                  </Col>
                  <Col span={8}>
                    <div
                      style={{
                        background: "#fff7e6",
                        padding: 8,
                        borderRadius: 4,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        In Progress
                      </Text>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#fa8c16",
                        }}
                      >
                        {ticketSummary.inProgress}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div
                      style={{
                        background: "#fff1f0",
                        padding: 8,
                        borderRadius: 4,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Pending
                      </Text>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#f5222d",
                        }}
                      >
                        {ticketSummary.pending}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Bar Chart */}
                {ticketDistribution.length > 0 && (
                  <div style={{ marginTop: 12, height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value">
                          {ticketDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Daily Updates Log */}
              {existingUpdates.length > 0 && (
                <Card
                  size="small"
                  title={
                    <Space size={4}>
                      <FileTextOutlined />
                      <span style={{ fontSize: 14 }}>Daily Updates Log</span>
                    </Space>
                  }
                  extra={
                    <Space size={4}>
                      <Tag color="blue">BOD: {dailyUpdatesSummary.bod}</Tag>
                      <Tag color="purple">EOD: {dailyUpdatesSummary.eod}</Tag>
                    </Space>
                  }
                >
                  <Table
                    columns={dailyUpdateColumns}
                    dataSource={existingUpdates}
                    rowKey="key"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>
              )}
            </Col>

            {/* RIGHT COLUMN - 30% - Summary View */}
            <Col xs={24} lg={7}>
              {/* Employee Profile Card */}
              {selectedMemberDetails && (
                <Card
                  size="small"
                  style={{ marginBottom: 16, textAlign: "center" }}
                >
                  <Avatar
                    size={64}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#87d068", marginBottom: 8 }}
                  />
                  <Title level={5} style={{ margin: "4px 0" }}>
                    {selectedMemberDetails.label}
                  </Title>
                  <Tag color="blue">Active Member</Tag>

                  <div style={{ marginTop: 12 }}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Statistic
                          title="Tickets"
                          value={ticketSummary.total}
                          suffix="total"
                          // Remove the size prop or use one of these alternatives:
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Updates"
                          value={dailyUpdatesSummary.total}
                          suffix="days"
                        />
                      </Col>
                    </Row>
                  </div>
                </Card>
              )}

              {/* Performance Summary Card */}
              <Card
                size="small"
                title="Performance Summary"
                style={{ marginBottom: 16 }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ticket Completion
                    </Text>
                    <Progress
                      percent={completionRate}
                      size="small"
                      strokeColor="#52c41a"
                      format={(percent) => `${percent}%`}
                    />
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Update Rate
                    </Text>
                    <Progress
                      percent={updateRate}
                      size="small"
                      strokeColor="#1890ff"
                      format={(percent) => `${percent}%`}
                    />
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      BOD Completion
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>{bodOutOf}</Text>
                      <Text>
                        {dailyUpdatesSummary.total > 0
                          ? Math.round(
                              (dailyUpdatesSummary.bod /
                                dailyUpdatesSummary.total) *
                                100,
                            )
                          : 0}
                        %
                      </Text>
                    </div>
                    <Progress
                      percent={
                        dailyUpdatesSummary.total > 0
                          ? Math.round(
                              (dailyUpdatesSummary.bod /
                                dailyUpdatesSummary.total) *
                                100,
                            )
                          : 0
                      }
                      size="small"
                      strokeColor="#722ed1"
                      showInfo={false}
                    />
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      EOD Completion
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>{eodOutOf}</Text>
                      <Text>
                        {dailyUpdatesSummary.total > 0
                          ? Math.round(
                              (dailyUpdatesSummary.eod /
                                dailyUpdatesSummary.total) *
                                100,
                            )
                          : 0}
                        %
                      </Text>
                    </div>
                    <Progress
                      percent={
                        dailyUpdatesSummary.total > 0
                          ? Math.round(
                              (dailyUpdatesSummary.eod /
                                dailyUpdatesSummary.total) *
                                100,
                            )
                          : 0
                      }
                      size="small"
                      strokeColor="#fa8c16"
                      showInfo={false}
                    />
                  </div>
                </Space>
              </Card>

              {/* Quick Stats Card */}
              <Card size="small">
                <Statistic
                  title="Overall Performance"
                  value={performanceScore}
                  suffix="%"
                  valueStyle={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "#722ed1",
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Tag
                        color="green"
                        style={{ width: "100%", textAlign: "center" }}
                      >
                        ✅ {ticketSummary.completed} Done
                      </Tag>
                    </Col>
                    <Col span={12}>
                      <Tag
                        color="blue"
                        style={{ width: "100%", textAlign: "center" }}
                      >
                        📅 {dailyUpdatesSummary.total} Updates
                      </Tag>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </MainLayout>
  );
}
