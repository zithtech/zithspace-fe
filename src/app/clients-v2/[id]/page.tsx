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
} from "antd";
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Building2,
  Globe,
  ShieldCheck,
  Users,
  Layers,
  DollarSign,
  Briefcase,
  Mail,
  MapPin,
  ExternalLink,
  Plus,
  Settings2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";

import ContactsTab from "./Tabs/ContactsTab";
import AllocationsTab from "./Tabs/AllocationsTab";
import DocumentsTab from "./Tabs/DocumentsTab";
import ProjectsTab from "./Tabs/ProjectsTab";

const { Title, Text } = Typography;

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
                enterIcon: <Check size={14} />,
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
          icon={<Check size={14} />}
          type="primary"
          onClick={() => {
            onUpdate(field, tempValue);
            setActiveField(null);
          }}
        />
        <Button
          icon={<X size={14} />}
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
        <Edit2 size={12} style={{ color: "#3b82f6" }} />
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
            icon={<Check size={14} />}
            onClick={() => {
              onUpdate(field, tempValue);
              setActiveField(null);
            }}
          >
            Save
          </Button>
          <Button
            size="small"
            icon={<X size={14} />}
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
      <Text>{value || "N/A"}</Text>
      {isEditMode && (
        <Edit2 size={12} style={{ color: "#3b82f6", marginLeft: 8 }} />
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card 
    bodyStyle={{ padding: "16px 20px" }} 
    style={{ 
      borderRadius: 12, 
      border: "1px solid #f1f5f9", 
      height: "100%"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} />
      </div>
    </div>
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

    if (!client) {
      setLoading(true);
    }

    try {
      const [clientData, projectsData] = await Promise.all([
        api.get(`/api/clients-v2/${params.id}`),
        api.get(`/api/clients-v2/${params.id}/projects`).catch(() => []),
      ]);

      if (clientData) {
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
      if (client[field] === value) return;

      const payload = { [field]: value };
      const updatedClient = await api.put(
        `/api/clients-v2/${client.id}`,
        payload,
      );

      if (updatedClient) {
        setClient((prev: any) => ({ ...prev, [field]: value }));
        notify.success({
          message: "Updated Successfully",
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
      fetchClientDetails();
    } finally {
      setActiveField(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!client) return null;

  const activeContacts = client.contacts?.filter((c: any) => c.status === "Active").length || 0;
  const totalAllocations = client.allocations?.length || 0;
  const activeAllocations = client.allocations?.filter((a: any) => a.status === "Active").length || 0;
  const totalProjects = client.projects?.length || 0;
  const totalProjectBudget = client.projects?.reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), 0) || 0;

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{ 
          margin: "0 -24px", 
          padding: "20px 24px", 
          background: "#ffffff", 
          minHeight: "calc(100vh - 64px)" 
        }}>
          
          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <Button 
                  icon={<ArrowLeft size={18} />} 
                  onClick={() => router.push("/clients-v2")}
                  style={{ borderRadius: 10, height: 44, width: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                />
                <div style={{ 
                  background: "#eff6ff", 
                  padding: 10, 
                  borderRadius: 12, 
                  color: "#2563eb",
                  display: "flex"
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{client.companyName}</Title>
                    <Tag style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }} color={client.status === "Active" ? "success" : "default"}>
                      {client.status?.toUpperCase()}
                    </Tag>
                    <Tag 
                      style={{ borderRadius: 6, fontWeight: 500, border: 0 }}
                      color={client.riskLevel === "High" ? "error" : client.riskLevel === "Medium" ? "warning" : "success"}
                    >
                      {client.riskLevel?.toUpperCase()} RISK
                    </Tag>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <Space size={4} style={{ color: "#64748b", fontSize: 13 }}>
                      <Globe size={14} />
                      {client.clientType || "N/A"}
                    </Space>
                    <Space size={4} style={{ color: "#64748b", fontSize: 13 }}>
                      <ShieldCheck size={14} />
                      {client.industry || "N/A"}
                    </Space>
                    <Space size={4} style={{ color: "#64748b", fontSize: 13 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Code:</Text>
                        <Text strong style={{ fontSize: 13 }}>{client.clientCode}</Text>
                    </Space>
                  </div>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<Edit2 size={18} />} 
                style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                onClick={() => router.push(`/clients-v2/create?id=${client.id}`)}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          <Tabs
            defaultActiveKey="1"
            className="premium-tabs"
            items={[
              {
                key: "1",
                label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Layers size={16} /> Overview</span>,
                children: (
                  <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                    <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                      <Col xs={24} sm={6}>
                        <StatCard 
                          label="Active Contacts" 
                          value={activeContacts} 
                          icon={Users} 
                          color="#3b82f6" 
                        />
                      </Col>
                      <Col xs={24} sm={6}>
                        <StatCard 
                          label="Resource Allocations" 
                          value={`${activeAllocations} / ${totalAllocations}`} 
                          icon={Briefcase} 
                          color="#10b981" 
                        />
                      </Col>
                      <Col xs={24} sm={6}>
                        <StatCard 
                          label="Total Projects" 
                          value={totalProjects} 
                          icon={Layers} 
                          color="#f59e0b" 
                        />
                      </Col>
                      <Col xs={24} sm={6}>
                        <StatCard 
                          label="Projected Budget" 
                          value={`$${totalProjectBudget.toLocaleString()}`} 
                          icon={DollarSign} 
                          color="#8b5cf6" 
                        />
                      </Col>
                    </Row>

                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={12}>
                                <div style={{ background: "#f0f9ff", padding: 8, borderRadius: 8, color: "#0ea5e9", display: "flex" }}>
                                  <Building2 size={18} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 16 }}>Corporate Profile</span>
                              </Space>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Edit Mode</Text>
                                <Checkbox 
                                  className="premium-checkbox"
                                  onChange={(e) => handleEditModeChange("basic", e.target.checked)} 
                                />
                              </div>
                            </div>
                          }
                          style={{ borderRadius: 16, border: "1px solid #f1f5f9", height: "100%" }}
                          bodyStyle={{ padding: "24px" }}
                        >
                          <Descriptions
                            size="small"
                            layout="vertical"
                            column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
                            colon={false}
                            labelStyle={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em" }}
                            contentStyle={{ fontWeight: 500, fontSize: 15, paddingBottom: 24 }}
                          >
                            <Descriptions.Item label="Legal Entity Name">
                              <EditableText
                                value={client.legalName}
                                field="legalName"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Descriptions.Item>
                            <Descriptions.Item label="Client Category">
                              <EditableSelect
                                value={client.clientType}
                                field="clientType"
                                onUpdate={handleUpdateField}
                                options={[
                                  { value: "Direct", label: "Direct" },
                                  { value: "Partner", label: "Partner" },
                                  { value: "Reseller", label: "Reseller" },
                                  { value: "Vendor", label: "Vendor" },
                                ]}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Descriptions.Item>
                            <Descriptions.Item label="Industry Sector">
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
                            <Descriptions.Item label="Website URL">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <EditableText
                                        value={client.website}
                                        field="website"
                                        onUpdate={handleUpdateField}
                                        activeField={activeField}
                                        setActiveField={setActiveField}
                                        isEditMode={editModes.basic}
                                    />
                                    {client.website && (
                                        <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer">
                                            <ExternalLink size={14} style={{ color: "#3b82f6" }} />
                                        </a>
                                    )}
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label="Registration No">
                              <EditableText
                                value={client.registrationNumber}
                                field="registrationNumber"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      </Col>

                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={12}>
                                <div style={{ background: "#fdf2f8", padding: 8, borderRadius: 8, color: "#db2777", display: "flex" }}>
                                  <Globe size={18} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 16 }}>Operations & Risk</span>
                              </Space>
                              <Checkbox 
                                className="premium-checkbox"
                                onChange={(e) => handleEditModeChange("operational", e.target.checked)} 
                              />
                            </div>
                          }
                          style={{ borderRadius: 16, border: "1px solid #f1f5f9", height: "100%" }}
                          bodyStyle={{ padding: "24px" }}
                        >
                          <Descriptions
                            size="small"
                            layout="vertical"
                            column={3}
                            colon={false}
                            labelStyle={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em" }}
                            contentStyle={{ fontWeight: 500, fontSize: 15, paddingBottom: 24 }}
                          >
                            <Descriptions.Item label="Account Status">
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
                                renderTag={(val) => (
                                    <Tag style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }} color={val === "Active" ? "success" : "default"}>
                                        {val?.toUpperCase()}
                                    </Tag>
                                )}
                              />
                            </Descriptions.Item>
                            <Descriptions.Item label="Risk Exposure">
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
                                  let color = "success";
                                  if (val === "High") color = "error";
                                  if (val === "Medium") color = "warning";
                                  return <Tag style={{ borderRadius: 6, fontWeight: 500, border: 0 }} color={color}>{val?.toUpperCase()}</Tag>;
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
                            <Descriptions.Item label="Client Code">
                               <Text strong style={{ fontSize: 15 }}>{client.clientCode}</Text>
                             </Descriptions.Item>
                             <Descriptions.Item label="Billing Contact">
                                <Space size={8}>
                                    <Mail size={14} style={{ color: "#64748b" }} />
                                    <EditableText
                                        value={client.billingContactEmail}
                                        field="billingContactEmail"
                                        onUpdate={handleUpdateField}
                                        activeField={activeField}
                                        setActiveField={setActiveField}
                                        isEditMode={editModes.operational}
                                    />
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Billing Address">
                                <Space size={8} align="start">
                                    <MapPin size={14} style={{ color: "#64748b", marginTop: 4 }} />
                                    <EditableTextArea
                                        value={client.billingAddress}
                                        field="billingAddress"
                                        onUpdate={handleUpdateField}
                                        activeField={activeField}
                                        setActiveField={setActiveField}
                                        isEditMode={editModes.operational}
                                    />
                                </Space>
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      </Col>

                      {/* Financial Detail Cards */}
                      <Col xs={24} lg={12}>
                        <Card
                            title={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Space size={12}>
                                        <div style={{ background: "#f0fdf4", padding: 8, borderRadius: 8, color: "#16a34a", display: "flex" }}>
                                            <ShieldCheck size={18} />
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: 16 }}>Compliance & Finance</span>
                                    </Space>
                                    <Checkbox 
                                        className="premium-checkbox"
                                        onChange={(e) => handleEditModeChange("finance", e.target.checked)} 
                                    />
                                </div>
                            }
                            style={{ borderRadius: 16, border: "1px solid #f1f5f9" }}
                            bodyStyle={{ padding: "24px" }}
                        >
                            <Descriptions
                                size="small"
                                layout="vertical"
                                column={3}
                                colon={false}
                                labelStyle={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
                                contentStyle={{ fontWeight: 600, fontSize: 14, paddingBottom: 20 }}
                            >
                                <Descriptions.Item label="GST/VAT/Tax ID">
                                    <EditableText value={client.gstVatTaxId} field="gstVatTaxId" onUpdate={handleUpdateField} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.finance} />
                                </Descriptions.Item>
                                <Descriptions.Item label="PAN (Tax) ID">
                                    <EditableText value={client.pan} field="pan" onUpdate={handleUpdateField} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.finance} />
                                </Descriptions.Item>
                                <Descriptions.Item label="DUNS Number">
                                    <EditableText value={client.dunsNumber} field="dunsNumber" onUpdate={handleUpdateField} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.finance} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Credit Limit">
                                    <EditableText value={client.creditLimit ? `$${Number(client.creditLimit).toLocaleString()}` : "N/A"} field="creditLimit" onUpdate={(f, v) => handleUpdateField(f, v.replace(/[^0-9.]/g, ''))} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.finance} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Payment Terms">
                                    <EditableSelect 
                                        value={client.paymentTerms} 
                                        field="paymentTerms" 
                                        onUpdate={handleUpdateField} 
                                        activeField={activeField} 
                                        setActiveField={setActiveField} 
                                        isEditMode={editModes.finance}
                                        options={[
                                            { value: "Net 15", label: "Net 15" },
                                            { value: "Net 30", label: "Net 30" },
                                            { value: "Net 60", label: "Net 60" },
                                            { value: "Due on Receipt", label: "Due on Receipt" },
                                        ]}
                                    />
                                </Descriptions.Item>
                                <Descriptions.Item label="Main Currency">
                                    <Tag color="cyan" style={{ border: 0, fontWeight: 600 }}>{client.defaultCurrency || "USD"}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                      </Col>

                      <Col xs={24} lg={12}>
                        <Card
                            title={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Space size={12}>
                                        <div style={{ background: "#faf5ff", padding: 8, borderRadius: 8, color: "#9333ea", display: "flex" }}>
                                            <DollarSign size={18} />
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: 16 }}>Banking Information</span>
                                    </Space>
                                    <Checkbox 
                                        className="premium-checkbox"
                                        onChange={(e) => handleEditModeChange("banking", e.target.checked)} 
                                    />
                                </div>
                            }
                            style={{ borderRadius: 16, border: "1px solid #f1f5f9" }}
                            bodyStyle={{ padding: "24px" }}
                        >
                            <Descriptions
                                size="small"
                                layout="vertical"
                                column={2}
                                colon={false}
                                labelStyle={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
                                contentStyle={{ fontWeight: 600, fontSize: 14, paddingBottom: 20 }}
                            >
                                <Descriptions.Item label="Bank Name">
                                    <EditableText value={client.bankName} field="bankName" onUpdate={handleUpdateField} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.banking} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Account Number">
                                    <EditableText value={client.bankAccountNumber} field="bankAccountNumber" onUpdate={handleUpdateField} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.banking} />
                                </Descriptions.Item>
                                <Descriptions.Item label="IFSC / SWIFT Code">
                                    <EditableText value={client.ifscSwift} field="ifscSwift" onUpdate={handleUpdateField} activeField={activeField} setActiveField={setActiveField} isEditMode={editModes.banking} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Preferred Mode">
                                    <EditableSelect 
                                        value={client.preferredPaymentMode} 
                                        field="preferredPaymentMode" 
                                        onUpdate={handleUpdateField} 
                                        activeField={activeField} 
                                        setActiveField={setActiveField} 
                                        isEditMode={editModes.banking}
                                        renderTag={(val) => <Tag color="purple" style={{ border: 0, fontWeight: 600 }}>{val || "NONE"}</Tag>}
                                        options={[
                                            { value: "Wire Transfer", label: "Wire Transfer" },
                                            { value: "ACH", label: "ACH" },
                                            { value: "Credit Card", label: "Credit Card" },
                                            { value: "Cheque", label: "Cheque" },
                                        ]}
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
                label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={16} /> Contacts</span>,
                children: <ContactsTab clientId={params.id as string} contacts={client.contacts || []} onRefresh={fetchClientDetails} />,
              },
              {
                key: "3",
                label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Briefcase size={16} /> Allocations</span>,
                children: <AllocationsTab clientId={params.id as string} allocations={client.allocations || []} onRefresh={fetchClientDetails} />,
              },
              {
                key: "4",
                label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Layers size={16} /> Projects</span>,
                children: <ProjectsTab clientId={params.id as string} onRefresh={fetchClientDetails} />,
              },
              {
                key: "5",
                label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Settings2 size={16} /> Documents</span>,
                children: <DocumentsTab clientId={params.id as string} documents={client.documents || []} onRefresh={fetchClientDetails} />,
              },
            ]}
          />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .premium-tabs .ant-tabs-nav {
            margin-bottom: 24px !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          .premium-tabs .ant-tabs-tab {
            padding: 12px 16px !important;
            margin: 0 16px 0 0 !important;
            color: #64748b !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
          }
          .premium-tabs .ant-tabs-tab-active {
            color: #3b82f6 !important;
          }
          .premium-tabs .ant-tabs-tab:hover {
            color: #3b82f6 !important;
          }
          .premium-tabs .ant-tabs-ink-bar {
            background: #3b82f6 !important;
            height: 3px !important;
          }
          .premium-checkbox .ant-checkbox-inner {
            border-radius: 4px !important;
          }
          .premium-checkbox .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #3b82f6 !important;
            border-color: #3b82f6 !important;
          }
          .ant-descriptions-item-label {
            padding-bottom: 4px !important;
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
