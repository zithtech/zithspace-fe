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
    Tooltip,
    Breadcrumb,
    Spin,
    Timeline,
    Drawer,
    Collapse,
    Divider,
    Select,
    App,
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
    const { modal, notification: antdNotification } = App.useApp();

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
            antdNotification.error({ message: "Failed to load partner information" });
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
            console.error("Failed to fetch assigned vendors", error);
        }
    };

    const fetchAllVendors = async () => {
        try {
            setLoadingVendors(true);
            const response = await VendorService.getVendors({ limit: 100 });
            setAllVendors(response.data);
        } catch (error) {
            antdNotification.error({ message: "Failed to fetch vendors" });
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
            antdNotification.success({ message: "Vendor Assigned Successfully" });
            fetchAssignedVendors();
            setSelectedVendorId(null);
        } catch (error) {
            antdNotification.error({ message: "Failed to Assign Vendor" });
        }
    };

    const handleRemoveVendor = (vendorId: string) => {
        modal.confirm({
            title: "Remove Vendor",
            content: "Are you sure you want to remove this vendor from the implementation partner?",
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.removeVendor(id, vendorId);
                    antdNotification.success({ message: "Vendor Removed Successfully" });
                    fetchAssignedVendors();
                } catch (error) {
                    antdNotification.error({ message: "Failed to Remove Vendor" });
                }
            },
        });
    };

    const fetchAssignedClients = async () => {
        try {
            const data = await ImplementationPartnerService.getAssignedClients(id);
            setAssignedClients(data);
        } catch (error) {
            console.error("Failed to fetch assigned clients", error);
        }
    };

    const fetchAllClients = async () => {
        try {
            setLoadingClients(true);
            const response = await RecruitmentClientService.getClients({ limit: 100 });
            setAllClients(response.data);
        } catch (error) {
            antdNotification.error({ message: "Failed to fetch clients" });
        } finally {
            setLoadingClients(false);
        }
    };

    const handleAssignClient = async (clientId: string) => {
        try {
            await ImplementationPartnerService.assignClient(id, clientId);
            antdNotification.success({ message: "Client Assigned Successfully" });
            fetchAssignedClients();
            setSelectedClientId(null);
        } catch (error) {
            antdNotification.error({ message: "Failed to Assign Client" });
        }
    };

    const handleRemoveClient = (clientId: string) => {
        modal.confirm({
            title: "Remove Client",
            content: "Are you sure you want to remove this client from the implementation partner?",
            okText: "Remove",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.removeClient(id, clientId);
                    antdNotification.success({ message: "Client Removed Successfully" });
                    fetchAssignedClients();
                } catch (error) {
                    antdNotification.error({ message: "Failed to Remove Client" });
                }
            },
        });
    };

    const handleAddContact = async (values: Partial<ImplementationContactPerson>) => {
        setAddingContact(true);
        try {
            await ImplementationPartnerService.addContact(id, values);
            antdNotification.success({ message: "Contact Added Successfully" });
            setIsContactModalOpen(false);
            contactForm.resetFields();
            fetchPartnerData();
        } catch (error) {
            antdNotification.error({ message: "Failed to Add Contact" });
        } finally {
            setAddingContact(false);
        }
    };

    const handleDeleteContact = (contactId: string) => {
        modal.confirm({
            title: "Delete Contact",
            content: "Are you sure you want to delete this contact?",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.deleteContact(contactId);
                    antdNotification.success({ message: "Contact Deleted Successfully" });
                    fetchPartnerData();
                } catch (error) {
                    antdNotification.error({ message: "Failed to Delete Contact" });
                }
            },
        });
    };

    const handleDeleteDocument = (documentId: string) => {
        modal.confirm({
            title: "Delete Document",
            content: "Are you sure you want to delete this document?",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await ImplementationPartnerService.deleteDocument(documentId);
                    antdNotification.success({ message: "Document Deleted Successfully" });
                    fetchPartnerData();
                } catch (error) {
                    antdNotification.error({ message: "Failed to Delete Document" });
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
            <div style={{ marginBottom: 6 }}>
                <Text type="secondary" style={{ display: "block", fontSize: 10, marginBottom: 0 }}>
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
                antdNotification.success({ message: "Document Uploaded Successfully" });
                fetchPartnerData();
            };
        } catch (error) {
            antdNotification.error({ message: "Failed to upload document" });
        }
    };

    return (
        <MainLayout>
            <App>
                <div style={{ padding: "24px", background: "#ffffff", minHeight: "100vh" }}>
                    <style>{`
              .ant-tabs-tab-btn {
                font-weight: 600 !important;
                font-size: 13px !important;
              }
              .ant-tabs-nav::before {
                border-bottom: 1px solid #f0f0f0 !important;
              }
            `}
                    </style>

                    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                        <Breadcrumb style={{ marginBottom: 16, fontSize: "12px" }}>
                            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                            <Breadcrumb.Item href="/implementation-partner">Implementation Partners</Breadcrumb.Item>
                            <Breadcrumb.Item>View Partner</Breadcrumb.Item>
                        </Breadcrumb>

                        <Card style={{ borderRadius: 8, marginBottom: 24, padding: "8px 0", border: "1px solid #f0f0f0", boxShadow: "none" }} bodyStyle={{ padding: "16px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Space size="large" align="center">
                                    <Button
                                        icon={<ArrowLeftOutlined />}
                                        onClick={() => router.push("/implementation-partner")}
                                        style={{ border: "1px solid #f0f0f0", borderRadius: "6px" }}
                                    />
                                    <Space size="middle">
                                        <Avatar
                                            size={64}
                                            style={{ backgroundColor: "#1677ff", fontSize: 24, fontWeight: "bold" }}
                                        >
                                            {getInitials(partner.companyName)}
                                        </Avatar>
                                        <div>
                                            <Title level={4} style={{ margin: 0, fontWeight: 600, marginBottom: 2 }}>
                                                {partner.companyName}
                                            </Title>
                                            <Text type="secondary" style={{ fontSize: "13px" }}>
                                                {partner.industry || "N/A"} • {locationString}
                                            </Text>
                                        </div>
                                    </Space>
                                </Space>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => router.push(`/implementation-partner/edit/${id}`)}
                                    style={{ borderRadius: "6px" }}
                                >
                                    Edit Partner
                                </Button>
                            </div>
                        </Card>

                        <Card style={{ borderRadius: 8, minHeight: 600, border: "1px solid #f0f0f0", boxShadow: "none" }} bodyStyle={{ padding: 0 }}>
                            <Tabs defaultActiveKey="overview" tabBarStyle={{ padding: "0 24px", margin: 0 }}>
                                <TabPane tab="Overview" key="overview">
                                    <div style={{ padding: "16px 24px" }}>
                                        <div
                                            style={{ 
                                                background: "#fafafa", 
                                                border: "1px solid #f0f0f0", 
                                                borderRadius: "8px", 
                                                padding: "16px 20px"
                                            }}
                                        >
                                            <div style={{ marginBottom: 16, borderBottom: "1px solid #f0f0f0", paddingBottom: 8 }}>
                                                <Title level={5} style={{ margin: 0, fontSize: 14 }}>Company Details</Title>
                                            </div>
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

                                            <div style={{ marginTop: 24, borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
                                                <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Additional Notes
                                                </Text>
                                                <div
                                                    style={{
                                                        background: "#ffffff",
                                                        padding: "16px",
                                                        borderRadius: 8,
                                                        border: "1px solid #f0f0f0",
                                                        minHeight: 100,
                                                        fontSize: 13,
                                                        lineHeight: '1.6',
                                                        color: '#595959'
                                                    }}
                                                >
                                                    {partner.notes || <Text type="secondary" italic>No additional notes provided.</Text>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabPane>

                                {/* 2. Contact Tab */}
                                <TabPane tab="Contact Persons" key="contact">
                                    <div style={{ padding: 24 }}>
                                        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Title level={5} style={{ margin: 0 }}>Primary Contact Information</Title>
                                            <Button 
                                                type="primary" 
                                                icon={<PlusOutlined />} 
                                                onClick={() => setIsContactModalOpen(true)}
                                                style={{ borderRadius: '6px' }}
                                            >
                                                Add Contact
                                            </Button>
                                        </div>
                                        <Table
                                            dataSource={partner.contactPersons || []}
                                            columns={contactColumns}
                                            rowKey={(record: any) => record.id || Math.random().toString()}
                                            pagination={false}
                                            size="middle"
                                            style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
                                        />
                                    </div>
                                </TabPane>


                                <TabPane tab="Linked Clients" key="client">
                                    <div style={{ padding: 24 }}>
                                        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Title level={5} style={{ margin: 0 }}>Associated Recruitment Clients</Title>
                                            <Button 
                                                type="primary" 
                                                icon={<PlusOutlined />} 
                                                onClick={() => {
                                                    fetchAllRelationsForDrawers();
                                                    setIsClientDrawerOpen(true);
                                                }}
                                                style={{ borderRadius: '6px' }}
                                            >
                                                Link Client
                                            </Button>
                                        </div>
                                        <Table
                                            dataSource={assignedClients}
                                            columns={clientColumns}
                                            rowKey="id"
                                            pagination={false}
                                            size="middle"
                                            style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
                                            locale={{ emptyText: <div style={{ padding: 40 }}><Text type="secondary">No clients linked yet.</Text></div> }}
                                        />
                                    </div>
                                </TabPane>

                                {/* 4. Vendor Tab */}
                                <TabPane tab="Linked Vendors" key="vendor">
                                    <div style={{ padding: 24 }}>
                                        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Title level={5} style={{ margin: 0 }}>Associated Prime Vendors</Title>
                                            <Button 
                                                type="primary" 
                                                icon={<PlusOutlined />} 
                                                onClick={() => {
                                                    fetchAllRelationsForDrawers();
                                                    setIsVendorDrawerOpen(true);
                                                }}
                                                style={{ borderRadius: '6px' }}
                                            >
                                                Link Vendor
                                            </Button>
                                        </div>
                                        <Table
                                            dataSource={assignedVendors}
                                            columns={vendorColumns}
                                            rowKey="id"
                                            pagination={false}
                                            size="middle"
                                            style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
                                            locale={{ emptyText: <div style={{ padding: 40 }}><Text type="secondary">No vendors linked yet.</Text></div> }}
                                        />
                                    </div>
                                </TabPane>

                                {/* 5. Jobs Tab */}
                                <TabPane tab="Active Jobs" key="jobs">
                                    <div style={{ padding: 24 }}>
                                        <div style={{ 
                                            padding: '40px', 
                                            textAlign: 'center', 
                                            background: '#fafafa', 
                                            borderRadius: '8px', 
                                            border: '1px solid #f0f0f0' 
                                        }}>
                                            <Space direction="vertical" align="center" size="small">
                                                <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Total Active Jobs
                                                </Text>
                                                <Title level={2} style={{ margin: 0, color: "#1677ff", fontWeight: 700 }}>
                                                    0
                                                </Title>
                                                <Button type="link" style={{ fontSize: '13px' }}>View Requisitions</Button>
                                            </Space>
                                        </div>
                                    </div>
                                </TabPane>

                                {/* 6. Documents Tab */}
                                <TabPane tab="Documents" key="documents">
                                    <div style={{ padding: 24 }}>
                                        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Title level={5} style={{ margin: 0 }}>Supporting Documents</Title>
                                            <Upload
                                                customRequest={({ onSuccess }) => onSuccess && onSuccess("ok")}
                                                onChange={handleDocumentUpload}
                                                showUploadList={false}
                                            >
                                                <Button type="primary" icon={<UploadOutlined />} style={{ borderRadius: '6px' }}>
                                                    Upload Document
                                                </Button>
                                            </Upload>
                                        </div>
                                        <Table
                                            dataSource={partner.documents || []}
                                            columns={documentColumns}
                                            rowKey={(record: any) => record.id || Math.random().toString()}
                                            pagination={false}
                                            size="middle"
                                            style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
                                        />
                                    </div>
                                </TabPane>

                                {/* 7. Activity Timeline Tab */}
                                <TabPane tab="Activity Timeline" key="activity">
                                    <div style={{ padding: 24 }}>
                                        <Timeline
                                            items={[
                                                {
                                                    color: "green",
                                                    children: `Partner profile created on ${new Date(partner.createdAt).toLocaleString()}`,
                                                },
                                                {
                                                    children: `Status set to ${partner.status ? "Active" : "Inactive"}`,
                                                },
                                                {
                                                    children: `Last updated on ${new Date(partner.updatedAt).toLocaleString()}`,
                                                },
                                                ...((partner.documents || []).length > 0 ? [{
                                                    color: "blue",
                                                    children: `${(partner.documents || []).length} documents uploaded`,
                                                }] : []),
                                                ...((partner.contactPersons || []).length > 0 ? [{
                                                    color: "blue",
                                                    children: `${(partner.contactPersons || []).length} contact persons added`,
                                                }] : []),
                                            ]}
                                        />
                                    </div>
                                </TabPane>
                            </Tabs>
                        </Card>
                    </div>

                    {/* Add Contact Modal */}
                    <Modal
                        title={<Text strong style={{ fontSize: 16 }}>Add New Contact</Text>}
                        open={isContactModalOpen}
                        onCancel={() => {
                            setIsContactModalOpen(false);
                            contactForm.resetFields();
                        }}
                        onOk={() => contactForm.submit()}
                        confirmLoading={addingContact}
                        okButtonProps={{ style: { borderRadius: '6px' } }}
                        cancelButtonProps={{ style: { borderRadius: '6px' } }}
                    >
                        <Form form={contactForm} layout="vertical" onFinish={handleAddContact} style={{ marginTop: 16 }} requiredMark="optional">
                            <Form.Item name="personName" label="Contact Name" rules={[{ required: true, message: "Please enter name" }]}>
                                <Input placeholder="Enter name" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                            <Form.Item name="designation" label="Designation">
                                <Input placeholder="Enter designation" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                            <Form.Item name="email" label="Email">
                                <Input type="email" placeholder="Enter email" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                            <Form.Item name="phone" label="Phone">
                                <Input placeholder="Enter phone number" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                            <Form.Item name="linkedInUrl" label="LinkedIn URL">
                                <Input placeholder="Enter LinkedIn URL" style={{ borderRadius: '6px' }} />
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
                        title={<Title level={5} style={{ margin: 0, fontWeight: 600 }}>Link Recruitment Client</Title>}
                        width={500}
                        open={isClientDrawerOpen}
                        onClose={() => setIsClientDrawerOpen(false)}
                        styles={{ header: { borderBottom: '1px solid #f0f0f0', background: '#fafafa' } }}
                    >
                        <div style={{ marginBottom: 24 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Search and Select Client</Text>
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
                                                client.contacts.map((contact: any, idx: number) => (
                                                    <div key={idx} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
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
                        title={<Title level={5} style={{ margin: 0, fontWeight: 600 }}>Link Prime Vendor</Title>}
                        width={500}
                        open={isVendorDrawerOpen}
                        onClose={() => setIsVendorDrawerOpen(false)}
                        styles={{ header: { borderBottom: '1px solid #f0f0f0', background: '#fafafa' } }}
                    >
                        <div style={{ marginBottom: 24 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Search and Select Vendor</Text>
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
                                                vendor.contactPersons.map((contact: any, idx: number) => (
                                                    <div key={idx} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
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
            </App>
        </MainLayout>
    );
}
