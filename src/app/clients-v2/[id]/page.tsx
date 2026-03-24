"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Tabs,
  Button,
  Descriptions,
  Tag,
  Space,
  Spin,
  message,
  Input,
  Select,
  Checkbox,
  notification,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  UserOutlined,
  SolutionOutlined,
  ProjectOutlined,
  DollarOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";

import ContactsTab from "./Tabs/ContactsTab";
import AllocationsTab from "./Tabs/AllocationsTab";
import DocumentsTab from "./Tabs/DocumentsTab";
import ProjectsTab from "./Tabs/ProjectsTab";

const { Title, Text } = Typography;
const { Option } = Select;

const EditableText = ({
  value,
  field,
  onUpdate,
  activeField,
  setActiveField,
  isEditMode,
}: {
  value: string;
  field: string;
  onUpdate: (f: string, v: any) => void;
  activeField: string | null;
  setActiveField: (f: string | null) => void;
  isEditMode: boolean;
}) => {
  const isEditing = activeField === field;
  return (
    <Space size="small">
      <Text
        editable={
          isEditMode
            ? {
                editing: isEditing,
                onStart: () => setActiveField(field),
                onChange: (newVal: any) => {
                  onUpdate(field, newVal);
                  setActiveField(null);
                },
                onCancel: () => setActiveField(null),
                onEnd: () => setActiveField(null),
                triggerType: ["text", "icon"],
                enterIcon: <CheckOutlined />,
                text: value || undefined,
              }
            : false
        }
      >
        {value || "N/A"}
      </Text>
    </Space>
  );
};

const EditableSelect = ({
  value,
  field,
  options,
  renderTag,
  onUpdate,
  activeField,
  setActiveField,
  isEditMode,
}: {
  value: string;
  field: string;
  options: any[];
  renderTag?: (val: string) => React.ReactNode;
  onUpdate: (f: string, v: any) => void;
  activeField: string | null;
  setActiveField: (f: string | null) => void;
  isEditMode: boolean;
}) => {
  const isEditing = activeField === field;
  const [tempValue, setTempValue] = useState(value);

  // Keep tempValue synchronized with incoming value prop if it changes
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <Space.Compact style={{ width: "100%" }}>
        <Select
          autoFocus
          value={tempValue}
          options={options}
          onChange={(val) => setTempValue(val)}
          style={{ width: "100%", minWidth: "120px" }}
          open
        />
        <Button
          icon={<CheckOutlined />}
          type="primary"
          onClick={() => {
            onUpdate(field, tempValue);
            setActiveField(null);
          }}
        />
        <Button
          icon={<CloseOutlined />}
          onClick={() => {
            setTempValue(value);
            setActiveField(null);
          }}
        />
      </Space.Compact>
    );
  }

  return (
    <Space
      style={{ cursor: isEditMode ? "pointer" : "default" }}
      onClick={() => isEditMode && setActiveField(field)}
    >
      {renderTag ? renderTag(value) : <Text>{value || "N/A"}</Text>}
      {isEditMode && (
        <EditOutlined style={{ fontSize: "14px", color: "#1677ff" }} />
      )}
    </Space>
  );
};

const EditableTextArea = ({
  value,
  field,
  onUpdate,
  activeField,
  setActiveField,
  isEditMode,
}: {
  value: string;
  field: string;
  onUpdate: (f: string, v: any) => void;
  activeField: string | null;
  setActiveField: (f: string | null) => void;
  isEditMode: boolean;
}) => {
  const isEditing = activeField === field;
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <div style={{ width: "100%" }}>
        <Input.TextArea
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ marginBottom: 8 }}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => {
              onUpdate(field, tempValue);
              setActiveField(null);
            }}
          >
            Save
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              setTempValue(value);
              setActiveField(null);
            }}
          >
            Cancel
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div
      style={{
        cursor: isEditMode ? "pointer" : "default",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
      onClick={() => isEditMode && setActiveField(field)}
    >
      {value || "N/A"}{" "}
      {isEditMode && (
        <EditOutlined
          style={{ fontSize: "14px", color: "#1677ff", marginLeft: 8 }}
        />
      )}
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => (
  <Card
    className="premium-card"
    bordered={false}
    style={{
      height: "100%",
    }}
    bodyStyle={{ padding: "12px" }}
  >
    <Row align="middle" justify="space-between" wrap={false}>
      <Col>
        <div style={{ color: "#595959", fontSize: 14, fontWeight: 500 }}>
          {title}
        </div>
      </Col>
      <Col>
        <Row align="middle" gutter={12} wrap={false}>
          <Col>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "8px",
                background: `${color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color,
                fontSize: 18,
              }}
            >
              {icon}
            </div>
          </Col>
          <Col>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#262626" }}>
              {value}
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  </Card>
);

export default function ClientV2DetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { tenantId } = useTenant();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [editModes, setEditModes] = useState({
    basic: false,
    operational: false,
    finance: false,
    banking: false,
  });

  const handleEditModeChange = (
    section: keyof typeof editModes,
    checked: boolean,
  ) => {
    setEditModes((prev) => ({ ...prev, [section]: checked }));
    if (!checked) {
      setActiveField(null);
    }
  };

  const fetchClientDetails = async () => {
    if (!tenantId || !params.id) return;

    // Only show loading spinner if we don't have any client data yet
    if (!client) {
      setLoading(true);
    }

    try {
      const [clientData, projectsData] = await Promise.all([
        api.get(`/api/clients-v2/${params.id}`),
        api.get(`/api/clients-v2/${params.id}/projects`).catch(() => []),
      ]);

      if (clientData) {
        // Merge projects into client data so the existing calculation works
        setClient({ ...clientData, projects: projectsData || [] });
      } else {
        message.error("Failed to fetch client details");
        router.push("/clients-v2");
      }
    } catch (err) {
      console.error(err);
      message.error("Error fetching details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [tenantId, params.id]);

  const handleUpdateField = async (field: string, value: any) => {
    try {
      if (client[field] === value) return; // No change

      const payload = { [field]: value };

      // api.put returns the actual updated client object directly
      const updatedClient = await api.put(
        `/api/clients-v2/${client.id}`,
        payload,
      );

      if (updatedClient) {
        setClient((prev: any) => ({ ...prev, [field]: value }));
        notify.success({
          message: "Updated Successfully ",
          description: `The ${field} has been updated.`,
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Update Failed",
        description: "Failed to update the field.",
        placement: "top",
      });
      fetchClientDetails(); // Revert on failure
    } finally {
      setActiveField(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!client) return null;

  // Calculate Stats
  const activeContacts =
    client.contacts?.filter((c: any) => c.status === "Active").length || 0;
  const totalAllocations = client.allocations?.length || 0;
  const activeAllocations =
    client.allocations?.filter((a: any) => a.status === "Active").length || 0;
  const totalProjects = client.projects?.length || 0;
  // Sums total project budget
  const totalProjectBudget =
    client.projects?.reduce(
      (sum: number, p: any) => sum + (Number(p.budget) || 0),
      0,
    ) || 0;

  return (
    <MainLayout>
      {contextHolder}
      <div
        style={{
          padding: "10px",
          maxWidth: 1400,
          margin: "0 auto",
          height: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <Space size="middle" align="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/clients-v2")}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {client.companyName}
                  </Title>
                  <Tag color="blue">{client.clientCode}</Tag>
                  <Tag color={client.status === "Active" ? "green" : "default"}>
                    {client.status}
                  </Tag>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#8c8c8c",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <Space size={4}>
                    <GlobalOutlined />
                    <Text type="secondary">{client.clientType || "N/A"}</Text>
                  </Space>
                  <Divider type="vertical" />
                  <Space size={4}>
                    <SafetyCertificateOutlined />
                    <Text type="secondary">{client.industry || "N/A"}</Text>
                  </Space>
                </div>
              </div>
            </Space>
          </div>

          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/clients-v2/create?id=${client.id}`)}
          >
            Edit Client
          </Button>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: <span style={{ fontWeight: 500 }}>Overview</span>,
              children: (
                <div style={{ gap: "13px" }}>
                  {/* Top Stats Row */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={6}>
                      <StatCard
                        title="Active Contacts"
                        value={activeContacts}
                        icon={<UserOutlined />}
                        color="#872eec"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <StatCard
                        title="Allocations"
                        value={`${totalAllocations} / ${activeAllocations}`}
                        icon={<SolutionOutlined />}
                        color="#1890ff"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <StatCard
                        title="Total Projects"
                        value={totalProjects}
                        icon={<ProjectOutlined />}
                        color="#faad14"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <StatCard
                        title="Total Budget"
                        value={`$${totalProjectBudget.toLocaleString()}`}
                        icon={<DollarOutlined />}
                        color="#52c41a"
                      />
                    </Col>
                  </Row>

                  {/* Main Content Grid */}
                  <Row gutter={[16, 16]}>
                    {/* Left Side - Basic Details (Large Card) */}
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <IdcardOutlined
                                style={{ fontSize: 18, color: "#1677ff" }}
                              />
                              <span style={{ fontWeight: 600 }}>
                                Basic Details
                              </span>
                            </Space>
                            <Checkbox
                              onChange={(e) =>
                                handleEditModeChange("basic", e.target.checked)
                              }
                            >
                              Enable Edit
                            </Checkbox>
                          </div>
                        }
                        className="premium-card"
                        bordered={false}
                        style={{
                          height: "100%",
                        }}
                        bodyStyle={{ padding: "16px 24px" }}
                      >
                        <Descriptions
                          size="small"
                          layout="vertical"
                          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                          colon={false}
                          labelStyle={{ color: "#8c8c8c", fontSize: 13 }}
                          contentStyle={{
                            fontWeight: 500,
                            fontSize: 15,
                            paddingBottom: 16,
                          }}
                        >
                          <Descriptions.Item label="Legal Name">
                            <EditableText
                              value={client.legalName}
                              field="legalName"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.basic}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Client Type">
                            <EditableSelect
                              value={client.clientType}
                              field="clientType"
                              onUpdate={handleUpdateField}
                              options={[
                                { value: "B2B", label: "B2B" },
                                { value: "B2C", label: "B2C" },
                                { value: "Enterprise", label: "Enterprise" },
                                { value: "Government", label: "Government" },
                                { value: "Non-Profit", label: "Non-Profit" },
                              ]}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.basic}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Industry">
                            <EditableText
                              value={client.industry}
                              field="industry"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.basic}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Company Size">
                            <EditableText
                              value={client.companySize}
                              field="companySize"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.basic}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Website">
                            <EditableText
                              value={client.website}
                              field="website"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.basic}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>

                    {/* Right Side - Operational Details (New Card) */}
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <GlobalOutlined
                                style={{ fontSize: 18, color: "#13c2c2" }}
                              />
                              <span style={{ fontWeight: 600 }}>
                                Operational Details
                              </span>
                            </Space>
                            <Checkbox
                              onChange={(e) =>
                                handleEditModeChange(
                                  "operational",
                                  e.target.checked,
                                )
                              }
                            >
                              Enable Edit
                            </Checkbox>
                          </div>
                        }
                        className="premium-card"
                        bordered={false}
                        style={{
                          height: "100%",
                        }}
                        bodyStyle={{ padding: "16px 24px" }}
                      >
                        <Descriptions
                          size="small"
                          layout="vertical"
                          column={{ xxl: 4, xl: 4, lg: 4, md: 2, sm: 1, xs: 1 }}
                          colon={false}
                          labelStyle={{ color: "#8c8c8c", fontSize: 13 }}
                          contentStyle={{
                            fontWeight: 500,
                            fontSize: 15,
                            paddingBottom: 16,
                          }}
                        >
                          <Descriptions.Item label="Client Status">
                            <EditableSelect
                              value={client.status}
                              field="status"
                              onUpdate={handleUpdateField}
                              options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" },
                                { value: "Prospect", label: "Prospect" },
                              ]}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.operational}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Risk Level">
                            <EditableSelect
                              value={client.riskLevel}
                              field="riskLevel"
                              onUpdate={handleUpdateField}
                              options={[
                                { value: "High", label: "High" },
                                { value: "Medium", label: "Medium" },
                                { value: "Low", label: "Low" },
                              ]}
                              renderTag={(val) => {
                                let color = "default";
                                if (val === "High") color = "red";
                                if (val === "Medium") color = "orange";
                                if (val === "Low") color = "green";
                                return <Tag color={color}>{val || "N/A"}</Tag>;
                              }}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.operational}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Client Segment">
                            <EditableText
                              value={client.clientSegment}
                              field="clientSegment"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.operational}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Billing Contact Email">
                            <EditableText
                              value={client.billingContactEmail}
                              field="billingContactEmail"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.operational}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Billing Address" span={4}>
                            <EditableTextArea
                              value={client.billingAddress}
                              field="billingAddress"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.operational}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>

                  {/* Bottom Section - Bank & Finance */}
                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    {/* Left - Banking Information */}
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <BankOutlined
                                style={{ fontSize: 18, color: "#52c41a" }}
                              />
                              <span style={{ fontWeight: 600 }}>
                                Banking Information
                              </span>
                            </Space>
                            <Checkbox
                              onChange={(e) =>
                                handleEditModeChange(
                                  "banking",
                                  e.target.checked,
                                )
                              }
                            >
                              Enable Edit
                            </Checkbox>
                          </div>
                        }
                        className="premium-card"
                        bordered={false}
                        style={{
                          height: "100%",
                        }}
                        bodyStyle={{ padding: "16px 24px" }}
                      >
                        <Descriptions
                          size="small"
                          layout="vertical"
                          column={{
                            xxl: 3,
                            xl: 3,
                            lg: 3,
                            md: 3,
                            sm: 2,
                            xs: 1,
                          }}
                          colon={false}
                          labelStyle={{ color: "#8c8c8c", fontSize: 12 }}
                          contentStyle={{
                            fontWeight: 500,
                            fontSize: 14,
                            paddingBottom: 16,
                          }}
                        >
                          <Descriptions.Item label="Bank Name">
                            <EditableText
                              value={client.bankName}
                              field="bankName"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.banking}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Account Number">
                            <EditableText
                              value={client.bankAccountNumber}
                              field="bankAccountNumber"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.banking}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="IFSC / SWIFT">
                            <EditableText
                              value={client.ifscSwift}
                              field="ifscSwift"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.banking}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Payment Mode">
                            <EditableSelect
                              value={client.preferredPaymentMode}
                              field="preferredPaymentMode"
                              onUpdate={handleUpdateField}
                              options={[
                                {
                                  value: "Bank Transfer",
                                  label: "Bank Transfer",
                                },
                                {
                                  value: "Credit Card",
                                  label: "Credit Card",
                                },
                                { value: "PayPal", label: "PayPal" },
                                { value: "Stripe", label: "Stripe" },
                                { value: "Cheque", label: "Cheque" },
                              ]}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.banking}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>

                    {/* Right - Finance & Compliance */}
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <SafetyCertificateOutlined
                                style={{ fontSize: 18, color: "#faad14" }}
                              />
                              <span style={{ fontWeight: 600 }}>
                                Finance Configuration
                              </span>
                            </Space>
                            <Checkbox
                              onChange={(e) =>
                                handleEditModeChange(
                                  "finance",
                                  e.target.checked,
                                )
                              }
                            >
                              Enable Edit
                            </Checkbox>
                          </div>
                        }
                        className="premium-card"
                        bordered={false}
                        style={{
                          height: "100%",
                        }}
                        bodyStyle={{ padding: "16px 24px" }}
                      >
                        <Descriptions
                          size="small"
                          layout="vertical"
                          column={{
                            xxl: 3,
                            xl: 3,
                            lg: 3,
                            md: 3,
                            sm: 2,
                            xs: 1,
                          }}
                          colon={false}
                          labelStyle={{ color: "#8c8c8c", fontSize: 12 }}
                          contentStyle={{
                            fontWeight: 500,
                            fontSize: 14,
                            paddingBottom: 16,
                          }}
                        >
                          <Descriptions.Item label="Default Currency">
                            <EditableText
                              value={client.defaultCurrency}
                              field="defaultCurrency"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.finance}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Contract Value">
                            <EditableText
                              value={client.contractValue}
                              field="contractValue"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.finance}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Credit Limit">
                            <EditableText
                              value={client.creditLimit}
                              field="creditLimit"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.finance}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Tax ID (GST/VAT)">
                            <EditableText
                              value={client.gstVatTaxId}
                              field="gstVatTaxId"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.finance}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="PAN">
                            <EditableText
                              value={client.pan}
                              field="pan"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.finance}
                            />
                          </Descriptions.Item>
                          <Descriptions.Item label="Payment Terms">
                            <EditableText
                              value={client.paymentTerms}
                              field="paymentTerms"
                              onUpdate={handleUpdateField}
                              activeField={activeField}
                              setActiveField={setActiveField}
                              isEditMode={editModes.finance}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: "2",
              label: <span style={{ fontWeight: 500 }}>Contacts</span>,
              children: (
                <ContactsTab
                  clientId={client.id}
                  contacts={client.contacts || []}
                  onRefresh={fetchClientDetails}
                />
              ),
            },
            {
              key: "3",
              label: (
                <span style={{ fontWeight: 500 }}>Employee Allocation</span>
              ),
              children: (
                <AllocationsTab
                  clientId={client.id}
                  allocations={client.allocations || []}
                  onRefresh={fetchClientDetails}
                />
              ),
            },
            {
              key: "4",
              label: <span style={{ fontWeight: 500 }}>Projects</span>,
              children: (
                <ProjectsTab
                  clientId={client.id}
                  onRefresh={fetchClientDetails}
                />
              ),
            },
            {
              key: "5",
              label: <span style={{ fontWeight: 500 }}>Documents</span>,
              children: (
                <DocumentsTab
                  clientId={client.id}
                  documents={client.documents || []}
                  onRefresh={fetchClientDetails}
                />
              ),
            },
          ]}
        />
      </div>
    </MainLayout>
  );
}
