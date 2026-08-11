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
  Tooltip,
  Breadcrumb,
  Timeline,
  notification,
  Divider,
  Drawer,
  Collapse,
  Select
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import {
  RecruitmentClientService,
  RecruitmentClient
} from "@/services/recruitmentClient.service";
import { ImplementationPartnerService, ImplementationPartner } from "@/services/implementationPartner.service";
import { VendorService, Vendor } from "@/services/vendor.service";
import ClientDrawer from "../../components/ClientDrawer";
import ZukvoLoader from "@/components/common/ZukvoLoader";


const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function ViewClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [client, setClient] = useState<RecruitmentClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [contactForm] = Form.useForm();

  // Implementation Tab state
  const [assignedPartners, setAssignedPartners] = useState<ImplementationPartner[]>([]);
  const [isPartnerDrawerOpen, setIsPartnerDrawerOpen] = useState(false);
  const [allPartners, setAllPartners] = useState<ImplementationPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [linkingPartner, setLinkingPartner] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState("");

  // Vendor Tab state
  const [assignedVendors, setAssignedVendors] = useState<Vendor[]>([]);
  const [isVendorDrawerOpen, setIsVendorDrawerOpen] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [linkingVendor, setLinkingVendor] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");

  // Redesign search/select state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const data = await RecruitmentClientService.getClientById(id);
      setClient(data);
      // Also fetch relations
      fetchAssignedRelations();
    } catch (err) {
      notification.error({ message: "Failed to load client information" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedRelations = async () => {
    try {
      const parts = await RecruitmentClientService.getAssignedPartners(id);
      setAssignedPartners(parts);
      const vends = await RecruitmentClientService.getAssignedVendors(id);
      setAssignedVendors(vends);
    } catch (err) {
      console.error("Failed to fetch assigned relations", err);
    }
  };

  const fetchAllRelationsForDrawers = async () => {
    try {
      setLoadingPartners(true);
      setLoadingVendors(true);
      const [partsRes, vendsRes] = await Promise.all([
        ImplementationPartnerService.getPartners({ limit: 1000 }),
        VendorService.getVendors({ limit: 1000 })
      ]);
      setAllPartners(partsRes.data);
      setAllVendors(vendsRes.data);
    } catch (err) {
      console.error("Failed to fetch all relations", err);
    } finally {
      setLoadingPartners(false);
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const handleAddContact = async (values: any) => {
    setAddingContact(true);
    try {
      await RecruitmentClientService.addContact(id, values);
      notification.success({ message: "Contact Added Successfully" });
      setIsContactModalOpen(false);
      contactForm.resetFields();
      fetchClientData();
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
          await RecruitmentClientService.deleteContact(id, contactId);
          notification.success({ message: "Contact Deleted Successfully" });
          fetchClientData();
        } catch (error) {
          notification.error({ message: "Failed to Delete Contact" });
        }
      }
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.substring(0, 2).toUpperCase();
  };

  if (loading || !client) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fff" }}>
          <ZukvoLoader message="Loading client details..." size="lg" />
        </div>
      </MainLayout>
    );
  }

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
        )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteContact(record.id)} />
      )
    },
  ];

  const implementationColumns = [
    { title: "Partner Name", dataIndex: "companyName", key: "companyName" },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (url: string) => url ? <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer">{url}</a> : "N/A"
    },
    {
      title: "Contact",
      dataIndex: "companyEmail",
      key: "companyEmail",
      render: (email: string, record: any) => (
        <div>
          <div>{email || "N/A"}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.companyPhone || ""}</div>
        </div>
      )
    },
    { title: "Location", key: "location", render: (record: any) => [record.city, record.state, record.country].filter(Boolean).join(", ") || "N/A" },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemovePartner(record.id)} />
      )
    },
  ];

  const vendorColumns = [
    { title: "Name", dataIndex: "companyName", key: "companyName" },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (url: string) => url ? <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer">{url}</a> : "N/A"
    },
    { title: "Location", key: "location", render: (record: any) => [record.city, record.state, record.country].filter(Boolean).join(", ") || "N/A" },
    {
      title: "Contact Person",
      key: "contact",
      render: (record: any) => {
        const contact = record.contactPersons?.[0];
        return contact ? `${contact.personName} (${contact.email || 'N/A'})` : "N/A";
      }
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveVendor(record.id)} />
      )
    },
  ];

  const handleLinkPartner = async (partnerId: string) => {
    setLinkingPartner(true);
    try {
      await RecruitmentClientService.assignPartner(id, partnerId);
      notification.success({ message: "Partner added successfully" });
      fetchAssignedRelations();
      setSelectedPartnerId(null);
    } catch (err) {
      notification.error({ message: "Failed to add partner" });
    } finally {
      setLinkingPartner(false);
    }
  };

  const handleRemovePartner = (partnerId: string) => {
    Modal.confirm({
      title: 'Remove Implementation Partner',
      content: 'Are you sure you want to remove this implementation partner from this client?',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await RecruitmentClientService.removePartner(id, partnerId);
          notification.success({ message: "Partner removed successfully" });
          fetchAssignedRelations();
        } catch (err) {
          notification.error({ message: "Failed to remove partner" });
        }
      }
    });
  };

  const handleLinkVendor = async (vendorId: string) => {
    setLinkingVendor(true);
    try {
      await RecruitmentClientService.assignVendor(id, vendorId);
      notification.success({ message: "Vendor added successfully" });
      fetchAssignedRelations();
      setSelectedVendorId(null);
    } catch (err) {
      notification.error({ message: "Failed to add vendor" });
    } finally {
      setLinkingVendor(false);
    }
  };

  const handleRemoveVendor = (vendorId: string) => {
    Modal.confirm({
      title: 'Remove Vendor',
      content: 'Are you sure you want to remove this vendor from this client?',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await RecruitmentClientService.removeVendor(id, vendorId);
          notification.success({ message: "Vendor removed successfully" });
          fetchAssignedRelations();
        } catch (err) {
          notification.error({ message: "Failed to remove vendor" });
        }
      }
    });
  };

  const businessDetail = client.businessDetails?.[0] || {};
  const hiringPref = client.hiringPreferences?.[0] || {};

  const locationParts = [client.city, client.country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : "N/A";

  const renderFieldValue = (label: string, value: any) => {
    let displayValue = value;
    if (value === undefined || value === null || value === "") {
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

  return (
    <MainLayout>
      <div style={{ padding: "24px", background: "white", minHeight: "calc(100vh - 64px)", paddingBottom: "100px" }}>
        <style>{`
          .ant-tabs-tab-btn {
            font-weight: 600 !important;
          }
        `}
        </style>

        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item href="/recruitment-client">Recruitment Clients</Breadcrumb.Item>
            <Breadcrumb.Item>View Client</Breadcrumb.Item>
          </Breadcrumb>

          <Card style={{ borderRadius: 8, marginBottom: 24, padding: "8px 0", border: "1px solid #f0f0f0" }} bodyStyle={{ padding: "16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Space size="large" align="start">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/recruitment-client")}
                  style={{ marginTop: 4, border: "none", boxShadow: "none", background: "transparent" }}
                />
                <Space size="middle">
                  <Avatar
                    size={64}
                    style={{ backgroundColor: "#1677ff", fontSize: 24, fontWeight: "bold" }}
                  >
                    {getInitials(client.clientName || "")}
                  </Avatar>
                  <div>
                    <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
                      {client.clientName}
                    </Title>
                    <Space>
                      <Tag color={client.status ? "green" : "red"}>
                        {client.status ? "Active" : "Inactive"}
                      </Tag>
                      <Text type="secondary">
                        {client.industry || "N/A"} • <EnvironmentOutlined /> {locationString}
                      </Text>
                    </Space>
                  </div>
                </Space>
              </Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditDrawerOpen(true)}
              >
                Edit Client
              </Button>
            </div>
          </Card>

          <Card style={{ borderRadius: 8, minHeight: 600, border: "1px solid #f0f0f0" }} bodyStyle={{ padding: 0 }}>
            <Tabs defaultActiveKey="overview" tabBarStyle={{ padding: "0 24px", margin: 0 }}>
              <TabPane tab="Overview" key="overview">
                <div style={{ padding: "24px" }}>
                  <Row gutter={[24, 24]}>
                    <Col span={24}>
                      <Card title="Basic Information" bordered={false} className="detail-card" style={{ border: "1px solid #f0f0f0" }}>
                        <Row gutter={[16, 12]}>
                          <Col span={6}>{renderFieldValue("Client Name", client.clientName)}</Col>
                          <Col span={6}>{renderFieldValue("Account Type", client.accountType)}</Col>
                          <Col span={6}>{renderFieldValue("Industry", client.industry)}</Col>
                          <Col span={6}>{renderFieldValue("Website", client.website)}</Col>
                          <Col span={6}>{renderFieldValue("Company Email", client.companyEmail)}</Col>
                          <Col span={6}>{renderFieldValue("Company Phone", client.companyPhone)}</Col>
                          <Col span={6}>{renderFieldValue("Location", locationString)}</Col>
                          <Col span={6}>{renderFieldValue("Status", client.status ? "Active" : "Inactive")}</Col>
                        </Row>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="Business Details" bordered={false} style={{ border: "1px solid #f0f0f0", height: "100%" }}>
                        <Row gutter={[16, 12]}>
                          <Col span={12}>{renderFieldValue("Company Name", businessDetail.companyName)}</Col>
                          <Col span={12}>{renderFieldValue("Year Established", businessDetail.yearEstablished)}</Col>
                          <Col span={12}>{renderFieldValue("Revenue Range", businessDetail.revenueRange)}</Col>
                        </Row>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="Hiring Preferences" bordered={false} style={{ border: "1px solid #f0f0f0", height: "100%" }}>
                        <Row gutter={[16, 12]}>
                          <Col span={12}>{renderFieldValue("Employment Type", hiringPref.employmentType)}</Col>
                          <Col span={12}>{renderFieldValue("Work Type", hiringPref.workType)}</Col>
                          <Col span={12}>{renderFieldValue("Hiring Location", hiringPref.hiringLocation)}</Col>
                        </Row>
                      </Card>
                    </Col>

                    <Col span={24}>
                      <Card title="Relationships" bordered={false} style={{ border: "1px solid #f0f0f0" }}>
                        <Row gutter={[16, 12]}>
                          <Col span={8}>{renderFieldValue("Implementation Partners", assignedPartners.length ? assignedPartners.map(p => p.companyName).join(", ") : "N/A")}</Col>
                          <Col span={8}>{renderFieldValue("Prime Vendors", assignedVendors.length ? assignedVendors.map(v => v.companyName).join(", ") : "N/A")}</Col>
                          <Col span={8}>{renderFieldValue("Total Contacts", client.contacts?.length || "0")}</Col>
                        </Row>
                      </Card>
                    </Col>

                    <Col span={24}>
                      <Card title="Additional Notes" bordered={false} style={{ border: "1px solid #f0f0f0" }}>
                        <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", minHeight: "80px" }}>
                          {client.notes || "No additional notes provided."}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </TabPane>

              <TabPane tab="Contact" key="contact">
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <Title level={4} style={{ margin: 0 }}>Client Contacts</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsContactModalOpen(true)}>
                      Add Contact
                    </Button>
                  </div>
                  <Table
                    dataSource={client.contacts || []}
                    columns={contactColumns}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
              </TabPane>

              <TabPane tab="Jobs" key="jobs">
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Title level={2} style={{ color: "#1677ff" }}>0</Title>
                  <Text type="secondary">Active Jobs / Tickets</Text>
                </div>
              </TabPane>

              <TabPane tab="Implementation" key="implementation">
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <Title level={4} style={{ margin: 0 }}>Implementation Partners</Title>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        fetchAllRelationsForDrawers();
                        setIsPartnerDrawerOpen(true);
                      }}
                    >
                      Add Implementation
                    </Button>
                  </div>
                  <Table
                    dataSource={assignedPartners}
                    columns={implementationColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: <Text type="secondary">No implementation partners linked yet.</Text> }}
                  />
                </div>
              </TabPane>

              <TabPane tab="Vendors" key="vendor">
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <Title level={4} style={{ margin: 0 }}>Linked Vendors</Title>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        fetchAllRelationsForDrawers();
                        setIsVendorDrawerOpen(true);
                      }}
                    >
                      Add Vendor
                    </Button>
                  </div>
                  <Table
                    dataSource={assignedVendors}
                    columns={vendorColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: <Text type="secondary">No vendors linked yet.</Text> }}
                  />
                </div>
              </TabPane>

              <TabPane tab="Submissions" key="submissions">
                <div style={{ padding: 48, textAlign: "center" }}>
                  <Title level={2} style={{ color: "#1677ff" }}>0</Title>
                  <Text type="secondary">Total Submissions</Text>
                </div>
              </TabPane>

              <TabPane tab="Activity Timeline" key="activity">
                <div style={{ padding: 24 }}>
                  <Timeline>
                    <Timeline.Item color="green">
                      Client profile created on {new Date(client.createdAt || Date.now()).toLocaleDateString()}
                    </Timeline.Item>
                    <Timeline.Item>
                      Status: {client.status ? "Active" : "Inactive"}
                    </Timeline.Item>
                    <Timeline.Item>
                      Last updated: {new Date(client.updatedAt || Date.now()).toLocaleDateString()}
                    </Timeline.Item>
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
        </Modal>        <Drawer
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
                label: `${p.companyName} (${p.website || 'No website'})`
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
                  loading={linkingPartner}
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

        <Drawer
          title={<Title level={4} style={{ margin: 0 }}>Select Vendors</Title>}
          open={isVendorDrawerOpen}
          onClose={() => setIsVendorDrawerOpen(false)}
          width={600}
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
                label: `${v.companyName} (${v.website || 'No website'})`
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
                  onClick={() => handleLinkVendor(selectedVendorId)}
                  disabled={assignedVendors.some(v => v.id === selectedVendorId)}
                  loading={linkingVendor}
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

        {/* Edit Drawer */}
        <ClientDrawer
          open={isEditDrawerOpen}
          onClose={() => {
            setIsEditDrawerOpen(false);
            fetchClientData();
          }}
          editData={client}
          onSuccess={fetchClientData}
        />
      </div>
    </MainLayout>
  );
}
