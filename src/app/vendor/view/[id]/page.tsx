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
  Vendor,
  VendorContactPerson,
  VendorDocument,
  VendorService,
} from "@/services/vendor.service";
import { ImplementationPartnerService } from "@/services/implementationPartner.service";
import { RecruitmentClientService } from "@/services/recruitmentClient.service";
import { SearchOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function ViewVendorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
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

  // Relations state
  const [assignedPartners, setAssignedPartners] = useState<any[]>([]);
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [isPartnerDrawerOpen, setIsPartnerDrawerOpen] = useState(false);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [fetchingRelations, setFetchingRelations] = useState(false);
  const [linkingRelation, setLinkingRelation] = useState(false);

  // Search state for modals
  const [partnerSearch, setPartnerSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Redesign search/select state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const data = await VendorService.getVendorById(id);

      // Map documents to match Attachment pattern if needed
      if (data.documents && Array.isArray(data.documents)) {
        data.documents = data.documents.map((doc: any) => ({
          ...doc,
          id: doc.id,
          fileName: doc.documentType ? `${doc.documentType} Document` : "Document",
          category: doc.documentType || "Other",
        }));
      }

      setVendor(data);
    } catch (err) {
      notification.error({ message: "Failed to load vendor information" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedRelations = async () => {
    try {
      setFetchingRelations(true);
      const [partners, clients] = await Promise.all([
        VendorService.getAssignedPartners(id),
        VendorService.getAssignedClients(id)
      ]);
      setAssignedPartners(partners);
      setAssignedClients(clients);
    } catch (error) {
      console.error("Fetch relations error:", error);
    } finally {
      setFetchingRelations(false);
    }
  };

  const fetchAllForDrawers = async () => {
    try {
      const [partnersRes, clientsRes] = await Promise.all([
        ImplementationPartnerService.getPartners({ limit: 1000 }),
        RecruitmentClientService.getClients({ limit: 1000 })
      ]);
      setAllPartners(partnersRes.data);
      setAllClients(clientsRes.data);
    } catch (error) {
      notification.error({ message: "Failed to fetch data for selection" });
    }
  };

  useEffect(() => {
    if (id) {
      fetchVendorData();
      fetchAssignedRelations();
    }
  }, [id]);

  const handleAddContact = async (values: Partial<VendorContactPerson>) => {
    setAddingContact(true);
    try {
      await VendorService.addContact(id, values);
      notification.success({ message: "Contact Added Successfully" });
      setIsContactModalOpen(false);
      contactForm.resetFields();
      fetchVendorData();
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
          await VendorService.deleteContact(contactId);
          notification.success({ message: "Contact Deleted Successfully" });
          fetchVendorData();
        } catch (error) {
          notification.error({ message: "Failed to Delete Contact" });
        }
      },
    });
  };


  const handleLinkPartner = async (partnerId: string) => {
    setLinkingRelation(true);
    try {
      await VendorService.assignPartner(id, partnerId);
      notification.success({ message: "Partner linked successfully" });
      fetchAssignedRelations();
      setSelectedPartnerId(null);
    } catch (error) {
      notification.error({ message: "Failed to link partner" });
    } finally {
      setLinkingRelation(false);
    }
  };

  const handleLinkClient = async (clientId: string) => {
    setLinkingRelation(true);
    try {
      await VendorService.assignClient(id, clientId);
      notification.success({ message: "Client linked successfully" });
      fetchAssignedRelations();
      setSelectedClientId(null);
    } catch (error) {
      notification.error({ message: "Failed to link client" });
    } finally {
      setLinkingRelation(false);
    }
  };

  const handleRemovePartner = (partnerId: string) => {
    Modal.confirm({
      title: "Remove Partner",
      content: "Are you sure you want to remove this implementation partner?",
      onOk: async () => {
        try {
          await VendorService.removePartner(id, partnerId);
          notification.success({ message: "Partner removed" });
          fetchAssignedRelations();
        } catch (error) {
          notification.error({ message: "Failed to remove partner" });
        }
      }
    });
  };

  const handleRemoveClient = (clientId: string) => {
    Modal.confirm({
      title: "Remove Client",
      content: "Are you sure you want to remove this client?",
      onOk: async () => {
        try {
          await VendorService.removeClient(id, clientId);
          notification.success({ message: "Client removed" });
          fetchAssignedRelations();
        } catch (error) {
          notification.error({ message: "Failed to remove client" });
        }
      }
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
          await VendorService.deleteDocument(documentId);
          notification.success({ message: "Document Deleted Successfully" });
          fetchVendorData();
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

  if (loading || !vendor) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fff" }}>
          <Spin size="large" tip="Loading vendor details..." />
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

  const partnerColumns = [
    { title: "Company Name", dataIndex: "companyName", key: "companyName" },
    { title: "Industry", dataIndex: "industry", key: "industry" },
    { title: "Email", dataIndex: "companyEmail", key: "companyEmail" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => router.push(`/implementation-partner/view/${record.id}`)} />
          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemovePartner(record.id)} />
        </Space>
      ),
    },
  ];

  const clientColumns = [
    { title: "Client Name", dataIndex: "clientName", key: "clientName" },
    { title: "Industry", dataIndex: "industry", key: "industry" },
    { title: "Email", dataIndex: "companyEmail", key: "companyEmail" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => router.push(`/recruitment-client/view/${record.id}`)} />
          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveClient(record.id)} />
        </Space>
      ),
    },
  ];

  const documentColumns = [
    { title: "Document Type", dataIndex: "category", key: "category" },
    { title: "File Name", dataIndex: "fileName", key: "fileName" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => window.open(record.documentUrl, "_blank")} />
          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteDocument(record.id)} />
        </Space>
      ),
    },
  ];

  // Primary Business Details
  const businessDetail = vendor.businessDetails?.[0] || {};
  const relations = vendor.relations?.[0] || {};

  // Format Address
  const locationParts = [vendor.city, vendor.country].filter(Boolean);
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
        await VendorService.addDocument(id, {
          base64,
          fileName: file.name,
          documentType: "Other"
        });
        notification.success({ message: "Document Uploaded Successfully" });
        fetchVendorData();
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
            <Breadcrumb.Item href="/vendor">Vendors</Breadcrumb.Item>
            <Breadcrumb.Item>View Vendor</Breadcrumb.Item>
          </Breadcrumb>

          <Card style={{ borderRadius: 8, marginBottom: 24, padding: "8px 0", border: "1px solid #f0f0f0" }} bodyStyle={{ padding: "16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Space size="large" align="start">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/vendor")}
                  style={{ marginTop: 4, border: "none", boxShadow: "none", background: "transparent" }}
                />
                <Space size="middle">
                  <Avatar
                    size={64}
                    style={{ backgroundColor: "#1677ff", fontSize: 24, fontWeight: "bold" }}
                  >
                    {getInitials(vendor.companyName)}
                  </Avatar>
                  <div>
                    <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
                      {vendor.companyName}
                    </Title>
                    <Text type="secondary">
                      {vendor.industry || "N/A"} • {locationString}
                    </Text>
                  </div>
                </Space>
              </Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => router.push(`/vendor/edit/${id}`)}
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
                      <Col span={6}>{renderFieldValue("Company Name", vendor.companyName)}</Col>
                      <Col span={6}>{renderFieldValue("Industry", vendor.industry)}</Col>
                      <Col span={6}>{renderFieldValue("Website", vendor.website)}</Col>
                      <Col span={6}>{renderFieldValue("Email", vendor.companyEmail)}</Col>

                      <Col span={6}>{renderFieldValue("Phone", vendor.companyPhone)}</Col>
                      <Col span={6}>{renderFieldValue("Address", locationString)}</Col>
                      <Col span={6}>{renderFieldValue("Business Type", businessDetail.businessType)}</Col>
                      <Col span={6}>{renderFieldValue("Year Established", businessDetail.yearEstabliliesh)}</Col>

                      <Col span={6}>{renderFieldValue("Total Employees", businessDetail.totalEmployees)}</Col>
                      <Col span={6}>{renderFieldValue("Tax ID", businessDetail.taxId)}</Col>
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
                        {vendor.notes || <Text type="secondary">No additional notes provided.</Text>}
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
                    dataSource={vendor.contactPersons || []}
                    columns={contactColumns}
                    rowKey={(record) => record.id || Math.random().toString()}
                    pagination={false}
                  />
                </div>
              </TabPane>

              {/* 3. Client Tab */}
              <TabPane tab="Client" key="client">
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <Title level={4} style={{ margin: 0 }}>Linked Clients</Title>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        fetchAllForDrawers();
                        setIsClientDrawerOpen(true);
                      }}
                    >
                      Add Client
                    </Button>
                  </div>
                  <Table
                    dataSource={assignedClients}
                    columns={clientColumns}
                    rowKey="id"
                    loading={fetchingRelations}
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: "No clients linked yet." }}
                  />
                </div>
              </TabPane>

              {/* 4. Implementation Partner Tab */}
              <TabPane tab="Implementation Partner" key="implementation-partner">
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <Title level={4} style={{ margin: 0 }}>Implementation Partners</Title>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        fetchAllForDrawers();
                        setIsPartnerDrawerOpen(true);
                      }}
                    >
                      Upload
                    </Button>
                  </div>
                  <Table
                    dataSource={assignedPartners}
                    columns={partnerColumns}
                    rowKey="id"
                    loading={fetchingRelations}
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: "No implementation partners linked yet." }}
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
                    dataSource={vendor.documents || []}
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
                      Vendor profile created on {new Date(vendor.createdAt).toLocaleString()}
                    </Timeline.Item>
                    <Timeline.Item>
                      Status set to {vendor.status ? "Active" : "Inactive"}
                    </Timeline.Item>
                    <Timeline.Item>
                      Last updated on {new Date(vendor.updatedAt).toLocaleString()}
                    </Timeline.Item>
                    {(vendor.documents || []).length > 0 && (
                      <Timeline.Item color="blue">
                        {(vendor.documents || []).length} documents uploaded
                      </Timeline.Item>
                    )}
                    {(vendor.contactPersons || []).length > 0 && (
                      <Timeline.Item color="blue">
                        {(vendor.contactPersons || []).length} contact persons added
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



        {/* Implementation Partner Selection Modal */}
        <Drawer
          title={<Title level={4} style={{ margin: 0 }}>Select Implementation Partners</Title>}
          open={isPartnerDrawerOpen}
          onClose={() => setIsPartnerDrawerOpen(false)}
          width={600}
        >
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Search and Select Partner</Text>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Type to search partners..."
              optionFilterProp="children"
              onChange={(value) => setSelectedPartnerId(value)}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={allPartners.map(p => ({
                value: p.id,
                label: `${p.companyName} (${p.website || 'No website'})`,
              }))}
              allowClear
            />
          </div>

          {selectedPartnerId && (
            <Card 
              title={<Title level={5} style={{ margin: 0 }}>Partner details</Title>}
              extra={
                <Button 
                  type="primary" 
                  size="small"
                  icon={<PlusOutlined />} 
                  onClick={() => handleLinkPartner(selectedPartnerId)}
                  disabled={assignedPartners.some(p => p.id === selectedPartnerId)}
                  loading={linkingRelation}
                >
                  {assignedPartners.some(p => p.id === selectedPartnerId) ? "Already Linked" : "Add Partner"}
                </Button>
              }
              style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
            >
              {(() => {
                const partner = allPartners.find(p => p.id === selectedPartnerId);
                if (!partner) return null;
                return (
                  <div style={{ padding: '4px 0' }}>
                    <Row gutter={[16, 12]}>
                      <Col span={12}>
                        <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Email</Text>
                        <Text strong style={{ fontSize: 13 }}>{partner.companyEmail || "N/A"}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Phone</Text>
                        <Text strong style={{ fontSize: 13 }}>{partner.companyPhone || "N/A"}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Industry</Text>
                        <Text strong style={{ fontSize: 13 }}>{partner.industry || "N/A"}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Location</Text>
                        <Text strong style={{ fontSize: 13 }}>{[partner.city, partner.country].filter(Boolean).join(", ") || "N/A"}</Text>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '16px 0' }} />

                    <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>Contact Details</Title>
                    {partner.contactPersons?.length ? (
                      partner.contactPersons.map((contact: any, index: number) => (
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

        {/* Client Selection Modal */}
        <Drawer
          title={<Title level={4} style={{ margin: 0 }}>Select Clients</Title>}
          open={isClientDrawerOpen}
          onClose={() => setIsClientDrawerOpen(false)}
          width={600}
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
                  onClick={() => handleLinkClient(selectedClientId)}
                  disabled={assignedClients.some(c => c.id === selectedClientId)}
                  loading={linkingRelation}
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
                        <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 2 }}>Location</Text>
                        <Text strong style={{ fontSize: 13 }}>{[client.city, client.country].filter(Boolean).join(", ") || "N/A"}</Text>
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
      </div>
    </MainLayout>
  );
}
