"use client";

import React, { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Badge,
  Segmented,
  Table,
  Dropdown,
  message,
  Modal,
} from "antd";
import {
  PlusOutlined,
  AppstoreOutlined,
  TableOutlined,
  MoreOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import NewCompanyDetails from "./newCompanyDetials";
import {
  useCompanies,
  useDeleteCompany,
  useToggleActiveCompany,
} from "@/hooks/useCompanies";

import { Company } from "@/types/company";
import {
  PhoneOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  AuditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const { Title, Text } = Typography;

// interface CompanyPageProps {
//   onPreview?: (type: "company", data: any) => void;
// }

interface CompanyPageProps {
  onPreview: (type: "company", data: any) => void;
}

export default function CompanyPage({ onPreview }: CompanyPageProps) {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    isActive: undefined as boolean | undefined,
  });
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useCompanies(filters);
  const toggleActiveMutation = useToggleActiveCompany();
  const deleteMutation = useDeleteCompany();

  const companies = data?.data || [];

  const handleCreate = () => {
    setMode("create");
    setEditingId(null);
  };

  const handleEdit = (id: number) => {
    setMode("edit");
    setEditingId(id);
  };

  const handleBack = () => {
    setMode("list");
    setEditingId(null);
    refetch();
  };

  // In the handleSetActive function:
  const handleSetActive = async (id: number) => {
    try {
      await toggleActiveMutation.mutateAsync(id);
      // Add toast for success
      toast.success("Company set as active successfully!");
    } catch (error) {
      console.log("Error at handleSetActive companypage", error);
      toast.error("Failed to set company as active");
    }
  };

  const handlePreview = (data: Company) => {
    if (onPreview) {
      onPreview("company", data);
    } else {
      message.info("Preview function not implemented");
    }
  };

  // const handleSearch = (value: string) => {
  //   setFilters({ ...filters, search: value, page: 1 });
  // };

  // const handleFilterActive = (value: boolean | undefined) => {
  //   setFilters({ ...filters, isActive: value, page: 1 });
  // };

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Title level={4}>Error loading companies</Title>
          <Text type="danger">{(error as Error).message}</Text>
          <br />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (mode === "create" || mode === "edit") {
    return (
      <NewCompanyDetails
        mode={mode}
        editingId={editingId}
        onBack={handleBack}
        onPreview={onPreview}
      />
    );
  }

  // Table columns
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => phone || "-",
    },
    {
      title: "Address",
      key: "address",
      render: (_: any, record: Company) => {
        const addressLines = formatCompanyAddress(record);
        return addressLines.length > 0 ? (
          <div>
            {addressLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        ) : (
          "-"
        );
      },
    },
    {
      title: "CIN",
      dataIndex: "cin",
      key: "cin",
      render: (cin: string) => cin || "-",
    },
    {
      title: "GST",
      dataIndex: "gst",
      key: "gst",
      render: (gst: string) => gst || "-",
    },
    {
      title: "Status",
      key: "isActive",
      render: (_: any, record: Company) =>
        record.isActive ? (
          <Badge status="success" text="Active" />
        ) : (
          <Badge status="default" text="Inactive" />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Company) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record.id)}>
            Edit
          </Button>
          <Button
            size="small"
            onClick={() => handleToggleActive(record.id)}
            loading={togglingId === record.id}
            type={record.isActive ? "default" : "primary"}
            danger={record.isActive}
          >
            {record.isActive ? " Inactive" : " Active"}
          </Button>
        </Space>
      ),
    },
  ];

  const formatCompanyAddress = (c: Company) => {
    const line1 = [c.plotNo, c.floorNo, c.buildingName]
      .filter(Boolean)
      .join(", ");
    const line2 = [c.street, c.area].filter(Boolean).join(", ");
    const line3 = [c.city, c.pincode && `- ${c.pincode}`, c.country]
      .filter(Boolean)
      .join(" ");
    return [line1, line2, line3].filter(Boolean);
  };

  const handleToggleActive = async (id: number) => {
    try {
      setTogglingId(id); // 👈 only this card loading

      await toggleActiveMutation.mutateAsync(id);

      toast.success("Company status updated successfully ");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null); // 👈 loading stop
    }
  };

  return (
    <div>
      <Card style={{ marginLeft: 5, marginTop: -16 }} size="small">
        <Toaster position="top-right" reverseOrder={false} />
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingTop: 8,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
              Company Configuration
            </Title>
            <Text type="secondary">
              Manage company details for payslips and official documents
            </Text>
          </div>

          <Space>
            <Segmented
              options={[
                { label: "Card", value: "card", icon: <AppstoreOutlined /> },
                { label: "Table", value: "table", icon: <TableOutlined /> },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as "card" | "table")}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              loading={isLoading}
            >
              Create Company
            </Button>
          </Space>
        </div>

        {/* Filters */}
        {/* <Space style={{ marginBottom: 16 }}>
          <Button.Group>
            <Button
              type={filters.isActive === undefined ? "primary" : "default"}
              onClick={() => handleFilterActive(undefined)}
            >
              All
            </Button>
            <Button
              type={filters.isActive === true ? "primary" : "default"}
              onClick={() => handleFilterActive(true)}
            >
              Active
            </Button>
            <Button
              type={filters.isActive === false ? "primary" : "default"}
              onClick={() => handleFilterActive(false)}
            >
              Inactive
            </Button>
          </Button.Group>
        </Space> */}

        {/* Content */}
        {viewMode === "card" ? (
          <>
            {isLoading && <Card loading />}

            {!isLoading && companies.length > 0 && (
              //               <div
              //                 style={{
              //                   display: "grid",
              //                   gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              //                   gap: 16,
              //                 }}
              //               >
              //                 {companies.map((c) => {
              //                   const content = (
              //                     <>
              //                       {/* Logo, Name & Actions - REORGANIZED SECTION */}
              // <div
              //   style={{
              //     display: "flex",
              //     alignItems: "flex-start",
              //     justifyContent: "space-between",
              //     marginBottom: 16,
              //   }}
              // >
              //                         {/* Left side: Logo and Company Info */}
              //                         <div
              //                           style={{
              //                             display: "flex",
              //                             alignItems: "flex-start",
              //                             flex: 1,
              //                           }}
              //                         >
              //                           {/* Logo */}
              //                           {c.logo && (
              //                             <div
              //                               style={{
              //                                 marginRight: 16,
              //                                 flexShrink: 0,
              //                               }}
              //                             >
              //                               <img
              //                                 src={c.logo}
              //                                 alt={c.name}
              //                                 style={{
              //                                   width: 80,
              //                                   height: 80,
              //                                   objectFit: "contain",
              //                                   borderRadius: 10,
              //                                   border: "1px solid #f0f0f0",
              //                                   boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              //                                 }}
              //                               />
              //                             </div>
              //                           )}

              //                           {/* Company Name and Email (vertical alignment) */}
              //                           <div
              //                             style={{
              //                               display: "flex",
              //                               flexDirection: "column",
              //                               justifyContent: "center",
              //                               height: 80, // Match logo height
              //                             }}
              //                           >
              //                             {/* <Title
              //                               level={4}
              //                               style={{
              //                                 margin: 0,
              //                                 marginBottom: 4,
              //                                 color: "#1a1a1a",
              //                                 fontWeight: 600,
              //                               }}
              //                             >
              //                               {c.name}
              //                             </Title> */}
              //                             <Title
              //   level={4}
              //   style={{
              //     margin: 0,
              //     marginBottom: 4,
              //     color: "#1a1a1a",
              //     fontWeight: 600,
              //     whiteSpace: "normal",      // allow wrap
              //     wordBreak: "break-word",  // long words
              //     lineHeight: 1.3,
              //   }}
              // >
              //   {c.name}
              // </Title>

              //                             {/* <Text
              //                               type="secondary"
              //                               style={{
              //                                 fontSize: 14,
              //                                 color: "#595959",
              //                               }}
              //                             >
              //                               {c.email}
              //                             </Text> */}

              //                             <Text
              //   type="secondary"
              //   style={{
              //     fontSize: 14,
              //     color: "#595959",
              //     whiteSpace: "normal",
              //     wordBreak: "break-all",   // 🔥 email-ku MUST
              //     lineHeight: 1.3,
              //   }}
              // >
              //   {c.email}
              // </Text>

              //                           </div>
              //                         </div>

              //                         {/* Right side: Action Buttons */}
              //                         <div
              //                           style={{
              //                             display: "flex",
              //                             flexDirection: "column",
              //                             gap: 8,
              //                             alignItems: "flex-end",
              //                           }}
              //                         >
              //                           {/* Dropdown Menu */}
              //                           <Dropdown
              //                             menu={{
              //                               items: [
              //                                 {
              //                                   key: "toggle",
              //                                   label: c.isActive
              //                                     ? "Inactivate"
              //                                     : "Set Active",
              //                                   icon: c.isActive ? (
              //                                     <PauseCircleOutlined />
              //                                   ) : (
              //                                     <CheckCircleOutlined />
              //                                   ),
              //                                   danger: c.isActive,
              //                                   onClick: () => handleToggleActive(c.id),
              //                                 },
              //                                 {
              //                                   key: "edit",
              //                                   label: "Edit",
              //                                   icon: <EditOutlined />,
              //                                   onClick: () => handleEdit(c.id),
              //                                 },
              //                                 // {
              //                                 //   key: "preview",
              //                                 //   label: "Preview",
              //                                 //   onClick: () => handlePreview(c),
              //                                 // },
              //                                 {
              //                                   key: "delete",
              //                                   label: (
              //                                     <div
              //                                       onClick={() => {
              //                                         setCompanyToDelete(c);
              //                                         setDeleteModalVisible(true);
              //                                       }}
              //                                     >
              //                                       <DeleteOutlined
              //                                         style={{ marginRight: 8 }}
              //                                       />
              //                                       Delete
              //                                     </div>
              //                                   ),
              //                                   danger: true,
              //                                 },
              //                               ],
              //                             }}
              //                             trigger={["click"]}
              //                             placement="bottomRight"
              //                           >
              //                             <MoreOutlined
              //                               style={{
              //                                 fontSize: 20,
              //                                 cursor: "pointer",
              //                                 color: "#8c8c8c",
              //                                 marginTop: "20px",
              //                                 borderRadius: 4,
              //                                 transition: "all 0.2s",
              //                               }}
              //                               onMouseEnter={(e) =>
              //                                 (e.currentTarget.style.backgroundColor =
              //                                   "#f5f5f5")
              //                               }
              //                               onMouseLeave={(e) =>
              //                                 (e.currentTarget.style.backgroundColor =
              //                                   "transparent")
              //                               }
              //                             />
              //                           </Dropdown>
              //                         </div>
              //                       </div>

              //                       {/* Rest of the content remains the same */}
              //                       {/* Contact & Details Section */}
              //                       <div style={{ marginTop: 12 }}>
              //                         {/* Phone with icon */}
              //                         {c.phone && (
              //                           <div
              //                             style={{
              //                               display: "flex",
              //                               alignItems: "center",
              //                               marginBottom: 10,
              //                             }}
              //                           >
              //                             <PhoneOutlined
              //                               style={{
              //                                 marginRight: 12,
              //                                 color: "#1890ff",
              //                                 fontSize: 16,
              //                                 backgroundColor: "#e6f7ff",
              //                                 padding: 6,
              //                                 borderRadius: 6,
              //                               }}
              //                             />
              //                             <div>
              //                               <Text
              //                                 type="secondary"
              //                                 style={{
              //                                   fontSize: 12,
              //                                   color: "#8c8c8c",
              //                                   display: "block",
              //                                   marginBottom: 2,
              //                                 }}
              //                               >
              //                                 Phone
              //                               </Text>
              //                               <Text
              //                                 style={{
              //                                   fontSize: 14,
              //                                   color: "#1a1a1a",
              //                                   fontWeight: 500,
              //                                 }}
              //                               >
              //                                 {c.phone}
              //                               </Text>
              //                             </div>
              //                           </div>
              //                         )}

              //                         {/* Address with icon */}
              //                         {formatCompanyAddress(c).length > 0 && (
              //                           <div
              //                             style={{
              //                               display: "flex",
              //                               alignItems: "flex-start",
              //                               marginBottom: 0,
              //                             }}
              //                           >
              //                             <EnvironmentOutlined
              //                               style={{
              //                                 marginRight: 12,
              //                                 color: "#52c41a",
              //                                 fontSize: 16,
              //                                 marginTop: 2,
              //                                 backgroundColor: "#f6ffed",
              //                                 padding: 6,
              //                                 borderRadius: 6,
              //                               }}
              //                             />
              //                             <div>
              //                               <Text
              //                                 style={{
              //                                   fontSize: 13,
              //                                   fontWeight: 600,
              //                                   color: "#1a1a1a",
              //                                   display: "block",
              //                                   marginBottom: 4,
              //                                 }}
              //                               >
              //                                 Address
              //                               </Text>
              //                               <div
              //                                 style={{
              //                                   backgroundColor: "white",
              //                                   padding: "6px 10px",
              //                                   borderRadius: 6,
              //                                   border: "1px solid #f0f0f0",
              //                                 }}
              //                               >
              //                                 {formatCompanyAddress(c).map((line, idx) => (
              //                                   <Text
              //                                     key={idx}
              //                                     style={{
              //                                       display: "block",
              //                                       fontSize: 13,
              //                                       lineHeight: "1.4",
              //                                       marginBottom: 2,
              //                                       color: "#595959",
              //                                     }}
              //                                   >
              //                                     {line}
              //                                   </Text>
              //                                 ))}
              //                               </div>
              //                             </div>
              //                           </div>
              //                         )}

              //                         {/* CIN & GST in a grid layout */}
              //                         <div
              //                           style={{
              //                             display: "grid",
              //                             gridTemplateColumns: "1fr 1fr",
              //                             gap: 10,
              //                             marginTop: 3,
              //                             paddingTop: 12,
              //                             borderTop: "1px solid #e8e8e8",

              //                           }}
              //                         >
              //                           {/* CIN */}
              //                           {c.cin && (
              //                             <div
              //                               style={{
              //                                 backgroundColor: "#f9f0ff",
              //                                 padding: 10,
              //                                 borderRadius: 8,
              //                                 border: "1px solid #d3adf7",
              //                               }}
              //                             >
              //                               <div
              //                                 style={{
              //                                   display: "flex",
              //                                   alignItems: "center",
              //                                   marginBottom: 4,
              //                                 }}
              //                               >
              //                                 <IdcardOutlined
              //                                   style={{
              //                                     marginRight: 8,
              //                                     color: "#722ed1",
              //                                     fontSize: 14,
              //                                   }}
              //                                 />
              //                                 <Text
              //                                   style={{
              //                                     fontSize: 11,
              //                                     fontWeight: 600,
              //                                     color: "#722ed1",
              //                                     textTransform: "uppercase",
              //                                     letterSpacing: "0.5px",
              //                                   }}
              //                                 >
              //                                   CIN
              //                                 </Text>
              //                               </div>
              //                               <Text
              //                                 style={{
              //                                   fontSize: 13,
              //                                   fontWeight: 600,
              //                                   color: "#1a1a1a",
              //                                   wordBreak: "break-word",
              //                                 }}
              //                               >
              //                                 {c.cin}
              //                               </Text>
              //                             </div>
              //                           )}

              //                           {/* GST */}
              //                           {c.gst && (
              //                             <div
              //                               style={{
              //                                 backgroundColor: "#fff7e6",
              //                                 padding: 10,
              //                                 borderRadius: 8,
              //                                 border: "1px solid #ffd591",
              //                               }}
              //                             >
              //                               <div
              //                                 style={{
              //                                   display: "flex",
              //                                   alignItems: "center",
              //                                   marginBottom: 4,
              //                                 }}
              //                               >
              //                                 <AuditOutlined
              //                                   style={{
              //                                     marginRight: 8,
              //                                     color: "#fa8c16",
              //                                     fontSize: 14,
              //                                   }}
              //                                 />
              //                                 <Text
              //                                   style={{
              //                                     fontSize: 11,
              //                                     fontWeight: 600,
              //                                     color: "#fa8c16",
              //                                     textTransform: "uppercase",
              //                                     letterSpacing: "0.5px",
              //                                   }}
              //                                 >
              //                                   GST
              //                                 </Text>
              //                               </div>
              //                               <Text
              //                                 style={{
              //                                   fontSize: 13,
              //                                   fontWeight: 600,
              //                                   color: "#1a1a1a",
              //                                   wordBreak: "break-word",
              //                                 }}
              //                               >
              //                                 {c.gst}
              //                               </Text>
              //                             </div>
              //                           )}
              //                         </div>
              //                       </div>
              //                     </>
              //                   );
              //                   const card = (
              //                   //   <Card
              //     style={{
              //   border: c.isActive
              //     ? "2px solid #0852d2ff"
              //     : "1px solid #c0bebeff",
              //   position: "relative",
              //   transition: "all 0.3s",
              //   borderRadius: 8,
              //   minHeight: 280,
              //   height: "100%",
              // }}
              //                   //   >
              //                 <Card
              // style={{
              //   border: c.isActive
              //     ? "2px solid #0852d2ff"
              //     : "1px solid #c0bebeff",
              //   position: "relative",
              //   transition: "all 0.3s",
              //   borderRadius: 8,
              //   minHeight: 280,
              //   overflow: "hidden",   // 👈 must
              // }}
              // >

              //                       {content}
              //                     </Card>
              //                   );

              //                   return c.isActive ? (
              //                     <Badge.Ribbon key={c.id} text="Active" color="blue">
              //                       {card}
              //                     </Badge.Ribbon>
              //                   ) : (
              //                     <React.Fragment key={c.id}>{card}</React.Fragment>
              //                   );
              //                 })}

              //    <Card
              //               hoverable
              //               onClick={handleCreate}
              //               style={{
              //                 border: "2px dashed #d9d9d9",
              //                 backgroundColor: "#fafafa",
              //                 display: "flex",
              //                 alignItems: "center",
              //                 justifyContent: "center",
              //                 minHeight: 280,
              //                 height: "100%",
              //                 borderRadius: 8,
              //                 transition: "all 0.3s",
              //               }}
              //               bodyStyle={{
              //                 display: "flex",
              //                 flexDirection: "column",
              //                 alignItems: "center",
              //                 justifyContent: "center",
              //                 height: "100%",
              //                 padding: 20,
              //                 textAlign: "center",
              //               }}
              //             >
              //               <div
              //                 style={{
              //                   width: 48,
              //                   height: 48,
              //                   borderRadius: "50%",
              //                   backgroundColor: "#e6f7ff",
              //                   display: "flex",
              //                   alignItems: "center",
              //                   justifyContent: "center",
              //                   marginBottom: 12,
              //                 }}
              //               >
              //                 <PlusOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              //               </div>
              //               <Title
              //                 level={5}
              //                 style={{
              //                   marginBottom: 6,
              //                   fontSize: 16,
              //                   color: "#262626", // Dark gray for title
              //                 }}
              //               >
              //                 Add New Company
              //               </Title>
              //               <Text
              //                 style={{
              //                   fontSize: 12,
              //                   lineHeight: 1.4,
              //                   color: "#595959", // Dark gray for description
              //                 }}
              //               >
              //                Create company profile with required details
              //               </Text>
              //             </Card>
              //               </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {companies.map((c) => {
                  const content = (
                    <>
                      {/* Logo, Name & Actions - REORGANIZED SECTION */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: 16,
                        }}
                      >
                        {/* Left side: Logo and Company Info */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            flex: 1,
                            minWidth: 0, // 🔥 IMPORTANT: Prevents overflow
                          }}
                        >
                          {/* Logo */}
                          {c.logo && (
                            <div
                              style={{
                                marginRight: 16,
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={c.logo}
                                alt={c.name}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "contain",
                                  borderRadius: 10,
                                  border: "1px solid #f0f0f0",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                              />
                            </div>
                          )}

                          {/* Company Name and Email (vertical alignment) */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              height: 80, // Match logo height
                              flex: 1,
                              minWidth: 0, // 🔥 IMPORTANT: Allows text wrapping
                              overflow: "hidden", // 🔥 Prevents content from pushing outside
                            }}
                          >
                            <Title
                              level={4}
                              style={{
                                margin: 0,
                                marginBottom: 4,
                                color: "#1a1a1a",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                width: "100%",
                                lineHeight: 1.3,
                              }}
                              title={c.name} // Shows full name on hover
                              ellipsis={{ tooltip: c.name }}
                            >
                              {c.name}
                            </Title>

                            <Text
                              type="secondary"
                              style={{
                                fontSize: 14,
                                color: "#595959",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                width: "100%",
                                lineHeight: 1.3,
                              }}
                              title={c.email} // Shows full email on hover
                              ellipsis={{ tooltip: c.email }}
                            >
                              {c.email}
                            </Text>
                          </div>
                        </div>

                        {/* Right side: Action Buttons */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            alignItems: "flex-end",
                            flexShrink: 0, // 🔥 Prevents button from shrinking
                          }}
                        >
                          {/* Dropdown Menu */}
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: "toggle",
                                  label: c.isActive
                                    ? "Inactivate"
                                    : "Set Active",
                                  icon: c.isActive ? (
                                    <PauseCircleOutlined />
                                  ) : (
                                    <CheckCircleOutlined />
                                  ),
                                  danger: c.isActive,
                                  onClick: () => handleToggleActive(c.id),
                                },
                                {
                                  key: "edit",
                                  label: "Edit",
                                  icon: <EditOutlined />,
                                  onClick: () => handleEdit(c.id),
                                },
                                {
                                  key: "delete",
                                  label: (
                                    <div
                                      onClick={() => {
                                        setCompanyToDelete(c);
                                        setDeleteModalVisible(true);
                                      }}
                                    >
                                      <DeleteOutlined
                                        style={{ marginRight: 8 }}
                                      />
                                      Delete
                                    </div>
                                  ),
                                  danger: true,
                                },
                              ],
                            }}
                            trigger={["click"]}
                            placement="bottomRight"
                          >
                            <MoreOutlined
                              style={{
                                fontSize: 20,
                                cursor: "pointer",
                                color: "#8c8c8c",
                                marginTop: "20px",
                                borderRadius: 4,
                                transition: "all 0.2s",
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#f5f5f5")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            />
                          </Dropdown>
                        </div>
                      </div>

                      {/* Rest of the content remains the same */}
                      {/* Contact & Details Section */}
                      <div style={{ marginTop: 12 }}>
                        {/* Phone with icon */}
                        {c.phone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <PhoneOutlined
                              style={{
                                marginRight: 12,
                                color: "#1890ff",
                                fontSize: 16,
                                backgroundColor: "#e6f7ff",
                                padding: 6,
                                borderRadius: 6,
                              }}
                            />
                            <div>
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: 12,
                                  color: "#8c8c8c",
                                  display: "block",
                                  marginBottom: 2,
                                }}
                              >
                                Phone
                              </Text>
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: "#1a1a1a",
                                  fontWeight: 500,
                                }}
                              >
                                {c.phone}
                              </Text>
                            </div>
                          </div>
                        )}

                        {/* Address with icon */}
                        {formatCompanyAddress(c).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              marginBottom: 0,
                            }}
                          >
                            <EnvironmentOutlined
                              style={{
                                marginRight: 12,
                                color: "#52c41a",
                                fontSize: 16,
                                marginTop: 2,
                                backgroundColor: "#f6ffed",
                                padding: 6,
                                borderRadius: 6,
                              }}
                            />
                            <div
                              style={{
                                flex: 1,
                                minWidth: 0, // 🔥 Prevents address from overflowing
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                  display: "block",
                                  marginBottom: 4,
                                }}
                              >
                                Address
                              </Text>
                              <div
                                style={{
                                  backgroundColor: "white",
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #f0f0f0",
                                }}
                              >
                                {formatCompanyAddress(c).map((line, idx) => (
                                  <Text
                                    key={idx}
                                    style={{
                                      display: "block",
                                      fontSize: 13,
                                      lineHeight: "1.4",
                                      marginBottom: 2,
                                      color: "#595959",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {line}
                                  </Text>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CIN & GST in a grid layout */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                            marginTop: 3,
                            paddingTop: 12,
                            borderTop: "1px solid #e8e8e8",
                          }}
                        >
                          {/* CIN */}
                          {c.cin && (
                            <div
                              style={{
                                backgroundColor: "#f9f0ff",
                                padding: 10,
                                borderRadius: 8,
                                border: "1px solid #d3adf7",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  marginBottom: 4,
                                }}
                              >
                                <IdcardOutlined
                                  style={{
                                    marginRight: 8,
                                    color: "#722ed1",
                                    fontSize: 14,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#722ed1",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  CIN
                                </Text>
                              </div>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                  wordBreak: "break-word",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                title={c.cin}
                              >
                                {c.cin}
                              </Text>
                            </div>
                          )}

                          {/* GST */}
                          {c.gst && (
                            <div
                              style={{
                                backgroundColor: "#fff7e6",
                                padding: 10,
                                borderRadius: 8,
                                border: "1px solid #ffd591",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  marginBottom: 4,
                                }}
                              >
                                <AuditOutlined
                                  style={{
                                    marginRight: 8,
                                    color: "#fa8c16",
                                    fontSize: 14,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#fa8c16",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  GST
                                </Text>
                              </div>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                  wordBreak: "break-word",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                title={c.gst}
                              >
                                {c.gst}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                  const card = (
                    <Card
                      style={{
                        border: c.isActive
                          ? "2px solid #0852d2ff"
                          : "1px solid #c0bebeff",
                        position: "relative",
                        transition: "all 0.3s",
                        borderRadius: 8,
                        minHeight: 280,
                        overflow: "hidden",
                      }}
                    >
                      {content}
                    </Card>
                  );

                  return c.isActive ? (
                    <Badge.Ribbon key={c.id} text="Active" color="blue">
                      {card}
                    </Badge.Ribbon>
                  ) : (
                    <React.Fragment key={c.id}>{card}</React.Fragment>
                  );
                })}

                <Card
                  hoverable
                  onClick={handleCreate}
                  style={{
                    border: "2px dashed #d9d9d9",
                    backgroundColor: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                    height: "100%",
                    borderRadius: 8,
                    transition: "all 0.3s",
                  }}
                  bodyStyle={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "#e6f7ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <PlusOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                  </div>
                  <Title
                    level={5}
                    style={{
                      marginBottom: 6,
                      fontSize: 16,
                      color: "#262626",
                    }}
                  >
                    Add New Company
                  </Title>
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 1.4,
                      color: "#595959",
                    }}
                  >
                    Create company profile with required details
                  </Text>
                </Card>
              </div>
            )}
          </>
        ) : (
          <Table
            dataSource={companies}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={
              data?.pagination
                ? {
                    current: data.pagination.current,
                    pageSize: data.pagination.pageSize,
                    total: data.pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} companies`,
                  }
                : false
            }
          />
        )}
      </Card>

      <Modal
        title="Delete Company Permanently"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={() => {
          if (!companyToDelete) return;
          deleteMutation.mutate(companyToDelete.id, {
            onSuccess: () => {
              toast.success(
                `Company "${companyToDelete.name}" deleted successfully`,
              );
              setDeleteModalVisible(false);
              setCompanyToDelete(null);
              refetch(); // optional: refetch list
            },
            onError: () => {
              toast.error("Failed to delete company");
            },
          });
        }}
        okButtonProps={{ danger: true }}
        okText="Delete"
        cancelText="Cancel"
      >
        <Text>
          Are you sure you want to delete{" "}
          <strong>{companyToDelete?.name}</strong>? This action cannot be
          undone.
        </Text>
      </Modal>
    </div>
  );
}
