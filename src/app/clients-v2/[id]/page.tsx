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
} from "antd";
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";

import ContactsTab from "./Tabs/ContactsTab";
import AllocationsTab from "./Tabs/AllocationsTab";
import DocumentsTab from "./Tabs/DocumentsTab";
import ProjectsTab from "./Tabs/ProjectsTab";

const { Title, Text } = Typography;

const EditableText = ({ value, field, onUpdate }: { value: string, field: string, onUpdate: (f: string, v: any) => void }) => {
    return (
        <Space size="small">
            <Text
                editable={{
                    onChange: (newVal) => onUpdate(field, newVal),
                    triggerType: ['text', 'icon'],
                    enterIcon: <CheckOutlined />,
                    text: value || undefined
                }}
            >
                {value || "N/A"}
            </Text>
        </Space>
    );
};

const EditableSelect = ({ value, field, options, renderTag, onUpdate }: { value: string, field: string, options: any[], renderTag?: (val: string) => React.ReactNode, onUpdate: (f: string, v: any) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    // Keep tempValue synchronized with incoming value prop if it changes
    useEffect(() => {
        setTempValue(value);
    }, [value]);

    if (isEditing) {
        return (
            <Space.Compact style={{ width: '100%' }}>
                <Select
                    autoFocus
                    value={tempValue}
                    options={options}
                    onChange={(val) => setTempValue(val)}
                    style={{ width: '100%', minWidth: '120px' }}
                    open
                />
                <Button icon={<CheckOutlined />} type="primary" onClick={() => {
                    onUpdate(field, tempValue);
                    setIsEditing(false);
                }} />
                <Button icon={<CloseOutlined />} onClick={() => {
                    setTempValue(value);
                    setIsEditing(false);
                }} />
            </Space.Compact>
        );
    }

    return (
        <Space style={{ cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
            {renderTag ? renderTag(value) : <Text>{value || "N/A"}</Text>}
            <EditOutlined style={{ fontSize: '14px', color: '#1677ff' }} />
        </Space>
    );
};

export default function ClientV2DetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { tenantId } = useTenant();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchClientDetails = async () => {
        if (!tenantId || !params.id) return;

        // Only show loading spinner if we don't have any client data yet
        if (!client) {
            setLoading(true);
        }

        try {
            const data = await api.get(`/api/clients-v2/${params.id}`);

            if (data) {
                setClient(data);
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
            const updatedClient = await api.put(`/api/clients-v2/${client.id}`, payload);

            if (updatedClient) {
                setClient((prev: any) => ({ ...prev, [field]: value }));
                message.success("Updated successfully");
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to update");
            fetchClientDetails(); // Revert on failure
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

    return (
        <MainLayout>
            <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", height: "calc(100vh - 100px)", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                    <Space size="middle">
                        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/clients-v2")} />
                        <Title level={2} style={{ margin: 0 }}>
                            {client.companyName}
                        </Title>
                        <Tag color={client.status === "Active" ? "green" : "default"}>{client.status}</Tag>
                        <Tag color="blue">{client.clientCode}</Tag>
                    </Space>
                    <Button type="primary" icon={<EditOutlined />}>
                        Edit Client
                    </Button>
                </div>

                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: "1",
                            label: "Overview",
                            children: (
                                <>
                                    <Card title="Basic Details" style={{ marginBottom: 24 }}>
                                        <Descriptions column={3}>
                                            <Descriptions.Item label="Legal Name">
                                                <EditableText value={client.legalName} field="legalName" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Client Type">
                                                <EditableSelect
                                                    value={client.clientType}
                                                    field="clientType"
                                                    onUpdate={handleUpdateField}
                                                    options={[
                                                        { value: 'B2B', label: 'B2B' },
                                                        { value: 'B2C', label: 'B2C' },
                                                        { value: 'Enterprise', label: 'Enterprise' },
                                                        { value: 'Government', label: 'Government' },
                                                        { value: 'Non-Profit', label: 'Non-Profit' },
                                                    ]}
                                                />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Industry">
                                                <EditableText value={client.industry} field="industry" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Company Size">
                                                <EditableText value={client.companySize} field="companySize" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Risk Level">
                                                <EditableSelect
                                                    value={client.riskLevel}
                                                    field="riskLevel"
                                                    onUpdate={handleUpdateField}
                                                    options={[
                                                        { value: 'High', label: 'High' },
                                                        { value: 'Medium', label: 'Medium' },
                                                        { value: 'Low', label: 'Low' },
                                                    ]}
                                                    renderTag={(val) => (
                                                        <Tag color={val === "High" ? "red" : val === "Medium" ? "orange" : "green"}>
                                                            {val || "N/A"}
                                                        </Tag>
                                                    )}
                                                />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Website">
                                                <EditableText value={client.website} field="website" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>

                                    <Card title="Finance & Compliance" style={{ marginBottom: 24 }}>
                                        <Descriptions column={3}>
                                            <Descriptions.Item label="Default Currency">
                                                <EditableText value={client.defaultCurrency} field="defaultCurrency" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Contract Value">
                                                <EditableText value={client.contractValue} field="contractValue" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Credit Limit">
                                                <EditableText value={client.creditLimit} field="creditLimit" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Tax ID (GST/VAT)">
                                                <EditableText value={client.gstVatTaxId} field="gstVatTaxId" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="PAN">
                                                <EditableText value={client.pan} field="pan" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Payment Terms">
                                                <EditableText value={client.paymentTerms} field="paymentTerms" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>

                                    <Card title="Banking Information">
                                        <Descriptions column={3}>
                                            <Descriptions.Item label="Bank Name">
                                                <EditableText value={client.bankName} field="bankName" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Account Number">
                                                <EditableText value={client.bankAccountNumber} field="bankAccountNumber" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="IFSC / SWIFT">
                                                <EditableText value={client.ifscSwift} field="ifscSwift" onUpdate={handleUpdateField} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Payment Mode">
                                                <EditableSelect
                                                    value={client.preferredPaymentMode}
                                                    field="preferredPaymentMode"
                                                    onUpdate={handleUpdateField}
                                                    options={[
                                                        { value: 'Bank Transfer', label: 'Bank Transfer' },
                                                        { value: 'Credit Card', label: 'Credit Card' },
                                                        { value: 'PayPal', label: 'PayPal' },
                                                        { value: 'Stripe', label: 'Stripe' },
                                                        { value: 'Cheque', label: 'Cheque' },
                                                    ]}
                                                />
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                </>
                            ),
                        },
                        {
                            key: "2",
                            label: "Contacts",
                            children: <ContactsTab clientId={client.id} contacts={client.contacts || []} onRefresh={fetchClientDetails} />,
                        },
                        {
                            key: "3",
                            label: "Employee Allocations",
                            children: <AllocationsTab clientId={client.id} allocations={client.allocations || []} onRefresh={fetchClientDetails} />,
                        },
                        {
                            key: "4",
                            label: "Projects",
                            children: <ProjectsTab clientId={client.id} onRefresh={fetchClientDetails} />,
                        },
                        {
                            key: "5",
                            label: "Documents",
                            children: <DocumentsTab clientId={client.id} documents={client.documents || []} onRefresh={fetchClientDetails} />,
                        },
                    ]}
                />
            </div>
        </MainLayout>
    );
}
