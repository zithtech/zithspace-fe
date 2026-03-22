"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    Row,
    Col,
    Space,
    Typography,
    Tabs,
    Button,
    Avatar,
    Table,
    Tag,
    Modal,
    Form,
    Input,
    Dropdown,
    Upload,
    notification,
    Tooltip,
    Breadcrumb,
    Spin,
    Timeline,
    Drawer,
    Collapse,
    Divider,
    Select,
} from "antd";
import {
    EditOutlined,
    ArrowLeftOutlined,
    PlusOutlined,
    EyeOutlined,
    DeleteOutlined,
    GlobalOutlined,
    DownloadOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
    ImplementationPartnerService,
    ImplementationPartner,
    ImplementationContactPerson,
    ImplementationDocument,
} from "@/services/implementationPartner.service";
import { RecruitmentClientService } from "@/services/recruitmentClient.service";
import { VendorService } from "@/services/vendor.service";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function ViewPartnerPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [partner, setPartner] = useState<ImplementationPartner | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [addingContact, setAddingContact] = useState(false);
    const [contactForm] = Form.useForm();

    const [documentPreview, setDocumentPreview] = useState<{ url: string; visible: boolean; type: string }>({
        url: "",
        visible: false,
        type: "",
    });

    // Client state
    const [assignedClients, setAssignedClients] = useState<any[]>([]);
    const [allClients, setAllClients] = useState<any[]>([]);
    const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);

    // Vendor state
    const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [isVendorDrawerOpen, setIsVendorDrawerOpen] = useState(false);
    const [loadingVendors, setLoadingVendors] = useState(false);

    // Redesign search/select state
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    const fetchPartnerData = async () => {
        try {
            setLoading(true);
            const data = await ImplementationPartnerService.getPartnerById(id);

            // Map documents to match Attachment pattern if needed
            if (data.documents && Array.isArray(data.documents)) {
                data.documents = data.documents.map((doc: any) => ({
                    ...doc,
                    id: doc.id,
                    fileName: doc.documentType ? `${doc.documentType} Document` : "Document",
                    category: doc.documentType || "Other",
                }));
            }

            setPartner(data);
            fetchAssignedClients();
        } catch (err) {
            notification.error({ message: "Failed to load partner information" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPartnerData();
            fetchAssignedClients();
            fetchAssignedVendors();
        }
    }, [id]);

    const fetchAssignedVendors = async () => {
        try {
            const data = await ImplementationPartnerService.getAssignedVendors(id);
            setAssignedVendors(data);
        } catch (error) {
            console.error("Failed to fetch assigned vendors");
        }
    };

    const fetchAllVendors = async () => {
        try {
            setLoadingVendors(true);
            const response = await VendorService.getVendors({ limit: 100 });
            setAllVendors(response.data);
        } catch (error) {
            notification.error({ message: "Failed to fetch vendors" });
        } finally {
            setLoadingVendors(false);
        }
    };

    const fetchAllRelationsForDrawers = async () => {
        try {
            await Promise.all([
                fetchAllClients(),
                fetchAllVendors()
            ]);
        } catch (error) {
            console.error("Failed to fetch relations for drawers", error);
        }
    };

    const handleAssignVendor = async (vendorId: string) => {
        try {
            await ImplementationPartnerService.assignVendor(id, vendorId);
            notification.success({ message: "Vendor Assigned Successfully" });
            fetchAssignedVendors();
            setSelectedVendorId(null);
        } catch (error) {
            notification.error({ message: "Failed to Assign Vendor" });
        }
    };

    const handleRemoveVendor = (vendorId: string) => {
        Modal.confirm({
            title: "Remove Vendor",
            content: "Are you sure you want to remove this vendor from the implementation partner?",
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.removeVendor(id, vendorId);
                    notification.success({ message: "Vendor Removed Successfully" });
                    fetchAssignedVendors();
                } catch (error) {
                    notification.error({ message: "Failed to Remove Vendor" });
                }
            },
        });
    };

    const fetchAssignedClients = async () => {
        try {
            const data = await ImplementationPartnerService.getAssignedClients(id);
            setAssignedClients(data);
        } catch (error) {
            console.error("Failed to fetch assigned clients");
        }
    };

    const fetchAllClients = async () => {
        try {
            setLoadingClients(true);
            const response = await RecruitmentClientService.getClients({ limit: 100 });
            setAllClients(response.data);
        } catch (error) {
            notification.error({ message: "Failed to fetch clients" });
        } finally {
            setLoadingClients(false);
        }
    };

    const handleAssignClient = async (clientId: string) => {
        try {
            await ImplementationPartnerService.assignClient(id, clientId);
            notification.success({ message: "Client Assigned Successfully" });
            fetchAssignedClients();
            setSelectedClientId(null);
        } catch (error) {
            notification.error({ message: "Failed to Assign Client" });
        }
    };

    const handleRemoveClient = (clientId: string) => {
        Modal.confirm({
            title: "Remove Client",
            content: "Are you sure you want to remove this client from the implementation partner?",
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.removeClient(id, clientId);
                    notification.success({ message: "Client Removed Successfully" });
                    fetchAssignedClients();
                } catch (error) {
                    notification.error({ message: "Failed to Remove Client" });
                }
            },
        });
    };

    const handleAddContact = async (values: Partial<ImplementationContactPerson>) => {
        setAddingContact(true);
        try {
            await ImplementationPartnerService.addContact(id, values);
            notification.success({ message: "Contact Added Successfully" });
            setIsContactModalOpen(false);
            contactForm.resetFields();
            fetchPartnerData();
        } catch (error) {
            notification.error({ message: "Failed to Add Contact" });
        } finally {
            setAddingContact(false);
        }
    };

    const handleDeleteContact = (contactId: string) => {
        Modal.confirm({
            title: "Delete Contact",
            content: "Are you sure you want to delete this contact?",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.deleteContact(contactId);
                    notification.success({ message: "Contact Deleted Successfully" });
                    fetchPartnerData();
                } catch (error) {
                    notification.error({ message: "Failed to Delete Contact" });
                }
            },
        });
    };

    const handleDeleteDocument = (documentId: string) => {
        Modal.confirm({
            title: "Delete Document",
            content: "Are you sure you want to delete this document?",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.deleteDocument(documentId);
                    notification.success({ message: "Document Deleted Successfully" });
                    fetchPartnerData();
                } catch (error) {
                    notification.error({ message: "Failed to Delete Document" });
                }
            },
        });
    };

    const getInitials = (name: string) => {
        if (!name) return "";
        return name.substring(0, 2).toUpperCase();
    };

    if (loading || !partner) {
        return (
            <MainLayout>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fff" }}>
                    <Spin size="large" tip="Loading partner details..." />
                </div>
            </MainLayout>
        );
    }

    // Define table columns
    const contactColumns = [
        { title: "Contact Name", dataIndex: "personName", key: "personName" },
        { title: "Designation", dataIndex: "designation", key: "designation", render: (val: string) => val || "N/A" },
        { title: "Email", dataIndex: "email", key: "email", render: (val: string) => val || "N/A" },
        { title: "Phone", dataIndex: "phone", key: "phone", render: (val: string) => val || "N/A" },
        {
            title: "LinkedIn",
            dataIndex: "linkedInUrl",
            key: "linkedInUrl",
            render: (url: string) =>
                url ? (
                    <Button type="text" icon={<EyeOutlined />} onClick={() => window.open(url, "_blank")} />
                ) : (
                    "N/A"
                ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteContact(record.id)} />
            ),
        },
    ];

    const documentColumns = [
        { title: "Document Name", dataIndex: "fileName", key: "fileName" },
        {
            title: "Uploaded Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (val: string) => val ? new Date(val).toLocaleDateString() : "N/A",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                const url = record.documentUrl || record.fileUrl;
                                setDocumentPreview({ url, visible: true, type: "pdf" });
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Download">
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                                const url = record.documentUrl || record.fileUrl;
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", record.fileName || "document");
                                link.setAttribute("target", "_blank");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteDocument(record.id)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const clientColumns = [
        { title: "Client Name", dataIndex: "clientName", key: "clientName" },
        { title: "Industry", dataIndex: "industry", key: "industry", render: (val: string) => val || "N/A" },
        { 
            title: "Website", 
            dataIndex: "website", 
            key: "website", 
            render: (url: string) => url ? <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer">{url}</a> : "N/A" 
        },
        { title: "Email", dataIndex: "companyEmail", key: "companyEmail", render: (val: string) => val || "N/A" },
        { title: "Location", key: "location", render: (_: any, record: any) => [record.city, record.country].filter(Boolean).join(", ") || "N/A" },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: any) => (
                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveClient(record.id)} />
            ),
        },
    ];


    const vendorColumns = [
        { title: "Vendor Name", dataIndex: "companyName", key: "companyName" },
        { 
            title: "Website", 
            dataIndex: "website", 
            key: "website", 
            render: (url: string) => url ? <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer">{url}</a> : "N/A" 
        },
        { title: "Contact", dataIndex: "companyPhone", key: "companyPhone", render: (val: string) => val || "N/A" },
        { title: "Location Status", key: "locationStatus", render: (_: any, record: any) => [record.city, record.country].filter(Boolean).join(", ") || "N/A" },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: any) => (
                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveVendor(record.id)} />
            ),
        },
    ];


    // Primary Business Details
    const businessDetail = partner.businessDetails?.[0] || {};
    const relations = partner.relations?.[0] || {};

    // Format Address
    const locationParts = [partner.city, partner.country].filter(Boolean);
    const locationString = locationParts.length > 0 ? locationParts.join(", ") : "N/A";

    const renderFieldValue = (label: string, value: any, isBoolean: boolean = false) => {
        let displayValue = value;
        if (isBoolean) {
            displayValue = value ? "True" : "False";
        } else if (value === undefined || value === null || value === "") {
            displayValue = "N/A";
        } else if (typeof value === "number" && value === 0) {
            displayValue = "0";
        }

        return (
            <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 2 }}>
                    {label}
                </Text>
                <Text strong style={{ fontSize: 13 }}>{displayValue}</Text>
            </div>
        );
    };

    const handleDocumentUpload = async (info: any) => {
        const file = info.file;
        if (file.status === 'uploading') return;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file.originFileObj);
            reader.onload = async () => {
                const base64 = reader.result as string;
                await ImplementationPartnerService.addDocument(id, {
                    base64,
                    fileName: file.name,
                    documentType: "Other"
                });
                notification.success({ message: "Document Uploaded Successfully" });
                fetchPartnerData();
            };
        } catch (error) {
            notification.error({ message: "Failed to upload document" });
        }
    };

    return (
        <MainLayout>
            <div style={{ padding: "24px", background: "#fff", minHeight: "100vh" }}>
                <style>{`
          .ant-tabs-tab-btn {
            font-weight: 600 !important;
          }
        `}
                </style>

                <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                    <Breadcrumb style={{ marginBottom: 16 }}>
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href="/implementation-partner">Implementation Partners</Breadcrumb.Item>
                        <Breadcrumb.Item>View Partner</Breadcrumb.Item>
                    </Breadcrumb>

                    <Card style={{ borderRadius: 8, marginBottom: 24, padding: "8px 0", border: "1px solid #f0f0f0" }} bodyStyle={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Space size="large" align="start">
                                <Button
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => router.push("/implementation-partner")}
                                    style={{ marginTop: 4, border: "none", boxShadow: "none", background: "transparent" }}
                                />
                                <Space size="middle">
                                    <Avatar
                                        size={64}
                                        style={{ backgroundColor: "#1677ff", fontSize: 24, fontWeight: "bold" }}
                                    >
                                        {getInitials(partner.companyName)}
                                    </Avatar>
                                    <div>
                                        <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
                                            {partner.companyName}
                                        </Title>
                                        <Text type="secondary">
                                            {partner.industry || "N/A"} • {locationString}
                                        </Text>
                                    </div>
                                </Space>
                            </Space>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => router.push(`/implementation-partner/edit/${id}`)}
                            >
                                Edit
                            </Button>
                        </div>
                    </Card>

                    <Card style={{ borderRadius: 8, minHeight: 600, border: "1px solid #f0f0f0" }} bodyStyle={{ padding: 0 }}>
                        <Tabs defaultActiveKey="overview" tabBarStyle={{ padding: "0 24px", margin: 0 }}>
                            {/* 1. Overview Tab */}
                            <TabPane tab="Overview" key="overview">
                                <div style={{ padding: "16px 24px" }}>
                                    <Card
                                        title="Company Details"
                                        bordered={false}
                                        style={{ background: "#fff", border: "1px solid #f0f0f0", maxWidth: 1300 }}
                                        bodyStyle={{ padding: "16px 24px" }}
                                    >
                                        <Row gutter={[16, 12]}>
                                            <Col span={6}>{renderFieldValue("Company Name", partner.companyName)}</Col>
                                            <Col span={6}>{renderFieldValue("Industry", partner.industry)}</Col>
                                            <Col span={6}>{renderFieldValue("Website", partner.website)}</Col>
                                            <Col span={6}>{renderFieldValue("Email", partner.companyEmail)}</Col>

                                            <Col span={6}>{renderFieldValue("Phone", partner.companyPhone)}</Col>
                                            <Col span={6}>{renderFieldValue("Address", locationString)}</Col>
                                            <Col span={6}>{renderFieldValue("Business Type", businessDetail.businessType)}</Col>
                                            <Col span={6}>{renderFieldValue("Year Established", businessDetail.yearEstabliliesh)}</Col>

                                             <Col span={6}>{renderFieldValue("Total Employees", businessDetail.totalEmployees)}</Col>
                                             <Col span={6}>{renderFieldValue("Tax ID", businessDetail.taxId)}</Col>
                                             <Col span={6}>{renderFieldValue("Assigned Clients", assignedClients.length)}</Col>
                                             <Col span={6}>{renderFieldValue("Visa Sponsorship", relations.supportsVisaSponsorship, true)}</Col>
                                            <Col span={6}>
                                                {relations.supportsVisaSponsorship
                                                    ? renderFieldValue("Visa Types", relations.visaTypesSupported)
                                                    : renderFieldValue("Visa Types", "N/A")}
                                            </Col>
                                        </Row>

                                        <div style={{ marginTop: 16 }}>
                                            <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>
                                                Additional Notes
                                            </Text>
                                            <div
                                                style={{
                                                    background: "#fff",
                                                    padding: "12px 16px",
                                                    borderRadius: 6,
                                                    border: "1px solid #f0f0f0",
                                                    minHeight: 80,
                                                    fontSize: 13
                                                }}
                                            >
                                                {partner.notes || <Text type="secondary">No additional notes provided.</Text>}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </TabPane>

                            {/* 2. Contact Tab */}
                            <TabPane tab="Contact" key="contact">
                                <div style={{ padding: 24 }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsContactModalOpen(true)}>
                                            Add Contact
                                        </Button>
                                    </div>
                                    <Table
                                        dataSource={partner.contactPersons || []}
                                        columns={contactColumns}
                                        rowKey={(record) => record.id || Math.random().toString()}
                                        pagination={false}
                                    />
                                </div>
                            </TabPane>

                            {/* 3. Client Tab */}
                            <TabPane tab="Client" key="client">
                                <div style={{ padding: 24 }}>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                      <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />} 
                                    onClick={() => {
                                        fetchAllRelationsForDrawers();
                                        setIsClientDrawerOpen(true);
                                    }}
                                >
                                    Upload
                                </Button>
                                    </div>
                                    <Table
                                        dataSource={assignedClients}
                                        columns={clientColumns}
                                        rowKey="id"
                                        pagination={false}
                                        locale={{ emptyText: <div style={{ padding: 40 }}><Text type="secondary">No clients linked yet.</Text></div> }}
                                    />
                                </div>
                            </TabPane>

                            {/* 4. Vendor Tab */}
                            <TabPane tab="Vendor" key="vendor">
                                <div style={{ padding: 24 }}>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button 
                                            type="primary" 
                                            icon={<PlusOutlined />} 
                                            onClick={() => {
                                                fetchAllRelationsForDrawers();
                                                setIsVendorDrawerOpen(true);
                                            }}
                                        >
                                            Upload
                                        </Button>
                                    </div>
                                    <Table
                                        dataSource={assignedVendors}
                                        columns={vendorColumns}
                                        rowKey="id"
                                        pagination={false}
                                        locale={{ emptyText: <div style={{ padding: 40 }}><Text type="secondary">No vendors linked yet.</Text></div> }}
                                    />
                                </div>
                            </TabPane>

                            {/* 5. Jobs Tab */}
                            <TabPane tab="Jobs" key="jobs">
                                <div style={{ padding: 24 }}>
                                    <Card>
                                        <Space direction="vertical" align="center" style={{ width: "100%" }}>
                                            <Text type="secondary" style={{ fontSize: 16 }}>
                                                Active Jobs
                                            </Text>
                                            <Title level={2} style={{ margin: 0, color: "#1677ff" }}>
                                                0
                                            </Title>
                                        </Space>
                                    </Card>
                                </div>
                            </TabPane>

                            {/* 6. Documents Tab */}
                            <TabPane tab="Documents" key="documents">
                                <div style={{ padding: 24 }}>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
                                        <Upload
                                            customRequest={({ onSuccess }) => onSuccess && onSuccess("ok")}
                                            onChange={handleDocumentUpload}
                                            showUploadList={false}
                                        >
                                            <Button type="primary" icon={<UploadOutlined />}>
                                                Upload Document
                                            </Button>
                                        </Upload>
                                    </div>
                                    <Table
                                        dataSource={partner.documents || []}
                                        columns={documentColumns}
                                        rowKey={(record) => record.id || Math.random().toString()}
                                        pagination={false}
                                    />
                                </div>
                            </TabPane>

                            {/* 7. Activity Timeline Tab */}
                            <TabPane tab="Activity Timeline" key="activity">
                                <div style={{ padding: 24 }}>
                                    <Timeline>
                                        <Timeline.Item color="green">
                                            Partner profile created on {new Date(partner.createdAt).toLocaleString()}
                                        </Timeline.Item>
                                        <Timeline.Item>
                                            Status set to {partner.status ? "Active" : "Inactive"}
                                        </Timeline.Item>
                                        <Timeline.Item>
                                            Last updated on {new Date(partner.updatedAt).toLocaleString()}
                                        </Timeline.Item>
                                        {(partner.documents || []).length > 0 && (
                                            <Timeline.Item color="blue">
                                                {(partner.documents || []).length} documents uploaded
                                            </Timeline.Item>
                                        )}
                                        {(partner.contactPersons || []).length > 0 && (
                                            <Timeline.Item color="blue">
                                                {(partner.contactPersons || []).length} contact persons added
                                            </Timeline.Item>
                                        )}
                                    </Timeline>
                                </div>
                            </TabPane>
                        </Tabs>
                    </Card>
                </div>

                {/* Add Contact Modal */}
                <Modal
                    title="Add New Contact"
                    open={isContactModalOpen}
                    onCancel={() => {
                        setIsContactModalOpen(false);
                        contactForm.resetFields();
                    }}
                    onOk={() => contactForm.submit()}
                    confirmLoading={addingContact}
                >
                    <Form form={contactForm} layout="vertical" onFinish={handleAddContact}>
                        <Form.Item name="personName" label="Contact Name" rules={[{ required: true, message: "Please enter name" }]}>
                            <Input placeholder="Enter name" />
                        </Form.Item>
                        <Form.Item name="designation" label="Designation">
                            <Input placeholder="Enter designation" />
                        </Form.Item>
                        <Form.Item name="email" label="Email">
                            <Input type="email" placeholder="Enter email" />
                        </Form.Item>
                        <Form.Item name="phone" label="Phone">
                            <Input placeholder="Enter phone number" />
                        </Form.Item>
                        <Form.Item name="linkedInUrl" label="LinkedIn URL">
                            <Input placeholder="Enter LinkedIn URL" />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Document Preview Modal */}
                <Modal
                    title="Document Preview"
                    open={documentPreview.visible}
                    onCancel={() => setDocumentPreview({ url: "", visible: false, type: "" })}
                    footer={null}
                    width={800}
                    bodyStyle={{ height: "600px", overflow: "auto" }}
                >
                    {documentPreview.url ? (
                        <iframe
                            src={documentPreview.url}
                            width="100%"
                            height="100%"
                            style={{ border: "none" }}
                            title="Document Preview"
                        />
                    ) : (
                        <div style={{ textAlign: "center", padding: 50 }}>
                            <Text type="secondary">No preview available for this document</Text>
                        </div>
                    )}
                </Modal>

                {/* Select Clients Drawer */}
                <Drawer
                    title={<Title level={4} style={{ margin: 0 }}>Select Clients</Title>}
                    width={600}
                    open={isClientDrawerOpen}
                    onClose={() => setIsClientDrawerOpen(false)}
                >
                    <div style={{ marginBottom: 24 }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Search and Select Client</Text>
                        <Select
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Type to search clients..."
                            optionFilterProp="children"
                            onChange={(value) => setSelectedClientId(value)}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={allClients.map(c => ({
                                value: c.id,
                                label: `${c.clientName} (${c.website || 'No website'})`,
                            }))}
                            allowClear
                        />
                    </div>

                    {selectedClientId && (
                        <Card 
                            title={<Title level={5} style={{ margin: 0 }}>Client details</Title>}
                            extra={
                                <Button 
                                    type="primary" 
                                    size="small"
                                    icon={<PlusOutlined />} 
                                    onClick={() => handleAssignClient(selectedClientId)}
                                    disabled={assignedClients.some(c => c.id === selectedClientId)}
                                >
                                    {assignedClients.some(c => c.id === selectedClientId) ? "Already Linked" : "Add Client"}
                                </Button>
                            }
                            style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                        >
                            {(() => {
                                const client = allClients.find(c => c.id === selectedClientId);
                                if (!client) return null;
                                return (
                                    <div style={{ padding: '4px 0' }}>
                                        <Row gutter={[16, 12]}>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Email</Text>
                                                <Text strong style={{ fontSize: 13 }}>{client.companyEmail || "N/A"}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Phone</Text>
                                                <Text strong style={{ fontSize: 13 }}>{client.companyPhone || "N/A"}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Industry</Text>
                                                <Text strong style={{ fontSize: 13 }}>{client.industry || "N/A"}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Type</Text>
                                                <Text strong style={{ fontSize: 13 }}>{client.accountType || "N/A"}</Text>
                                            </Col>
                                            <Col span={24}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Address</Text>
                                                <Text strong style={{ fontSize: 13 }}>{[client.street, client.city, client.state, client.country].filter(Boolean).join(", ") || "N/A"}</Text>
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>Contact Details</Title>
                                        {client.contacts?.length ? (
                                            client.contacts.map((contact: any, index: number) => (
                                                <div key={index} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                                                    <Text strong style={{ display: 'block' }}>{contact.personName}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{contact.designation || "N/A"} • {contact.email || "N/A"} • {contact.phone || "N/A"}</Text>
                                                </div>
                                            ))
                                        ) : (
                                            <Text type="secondary">No contact persons listed.</Text>
                                        )}
                                    </div>
                                );
                            })()}
                        </Card>
                    )}
                </Drawer>

                {/* Select Vendors Drawer */}
                <Drawer
                    title={<Title level={4} style={{ margin: 0 }}>Select Vendors</Title>}
                    width={600}
                    open={isVendorDrawerOpen}
                    onClose={() => setIsVendorDrawerOpen(false)}
                >
                    <div style={{ marginBottom: 24 }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Search and Select Vendor</Text>
                        <Select
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Type to search vendors..."
                            optionFilterProp="children"
                            onChange={(value) => setSelectedVendorId(value)}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={allVendors.map(v => ({
                                value: v.id,
                                label: `${v.companyName} (${v.website || 'No website'})`,
                            }))}
                            allowClear
                        />
                    </div>

                    {selectedVendorId && (
                        <Card 
                            title={<Title level={5} style={{ margin: 0 }}>Vendor details</Title>}
                            extra={
                                <Button 
                                    type="primary" 
                                    size="small"
                                    icon={<PlusOutlined />} 
                                    onClick={() => handleAssignVendor(selectedVendorId)}
                                    disabled={assignedVendors.some(v => v.id === selectedVendorId)}
                                >
                                    {assignedVendors.some(v => v.id === selectedVendorId) ? "Already Linked" : "Add Vendor"}
                                </Button>
                            }
                            style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                        >
                            {(() => {
                                const vendor = allVendors.find(v => v.id === selectedVendorId);
                                if (!vendor) return null;
                                return (
                                    <div style={{ padding: '4px 0' }}>
                                        <Row gutter={[16, 12]}>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Email</Text>
                                                <Text strong style={{ fontSize: 13 }}>{vendor.companyEmail || "N/A"}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Phone</Text>
                                                <Text strong style={{ fontSize: 13 }}>{vendor.companyPhone || "N/A"}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Industry</Text>
                                                <Text strong style={{ fontSize: 13 }}>{vendor.industry || "N/A"}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Location</Text>
                                                <Text strong style={{ fontSize: 13 }}>{[vendor.city, vendor.country].filter(Boolean).join(", ") || "N/A"}</Text>
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>Contact Details</Title>
                                        {vendor.contactPersons?.length ? (
                                            vendor.contactPersons.map((contact: any, index: number) => (
                                                <div key={index} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                                                    <Text strong style={{ display: 'block' }}>{contact.personName}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{contact.designation || "N/A"} • {contact.email || "N/A"} • {contact.phone || "N/A"}</Text>
                                                </div>
                                            ))
                                        ) : (
                                            <Text type="secondary">No contact persons listed.</Text>
                                        )}
                                    </div>
                                );
                            })()}
                        </Card>
                    )}
                </Drawer>
            </div>
        </MainLayout>
    );
}
