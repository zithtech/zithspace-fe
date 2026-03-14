"use client";

import React, { useState } from "react";
import {
    Form,
    Input,
    Select,
    DatePicker,
    InputNumber,
    Switch,
    Button,
    Card,
    Row,
    Col,
    Typography,
    Divider,
    message,
} from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";

const { Title } = Typography;
const { Option } = Select;

export default function CreateClientV2Page() {
    const [form] = Form.useForm();
    const router = useRouter();
    const { tenantId } = useTenant();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Format dates if needed
            const payload = { ...values };
            const data = await api.post("/api/clients-v2", payload);
            message.success("Client successfully created!");
            router.push("/clients-v2");
        } catch (err) {
            console.error(err);
            message.error("An error occurred while creating the client");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", height: "calc(100vh - 100px)", overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 16 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
                    <Title level={2} style={{ margin: 0 }}>Create New Client (V2)</Title>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ defaultCurrency: "USD", isActive: true, status: "Prospect" }}
                >
                    <Card title="1. Basic Details & Classification" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}>
                                    <Input placeholder="Enter company name" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="legalName" label="Legal Name">
                                    <Input placeholder="Enter legal business name" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="clientType" label="Client Type" rules={[{ required: true }]}>
                                    <Select placeholder="Select type">
                                        <Option value="Direct">Direct</Option>
                                        <Option value="Partner">Partner</Option>
                                        <Option value="Reseller">Reseller</Option>
                                        <Option value="Vendor">Vendor</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="industry" label="Industry">
                                    <Input placeholder="e.g. Technology, Healthcare" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="companySize" label="Company Size">
                                    <Select placeholder="Select size">
                                        <Option value="1-10">1-10</Option>
                                        <Option value="11-50">11-50</Option>
                                        <Option value="51-200">51-200</Option>
                                        <Option value="200+">200+</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="yearOfIncorporation" label="Year of Incorporation">
                                    <Input placeholder="YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="country" label="Country">
                                    <Input placeholder="Country" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="website" label="Website">
                                    <Input placeholder="https://..." />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="2. Compliance & Finance" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item name="gstVatTaxId" label="GST / VAT / Tax ID">
                                    <Input placeholder="Tax ID" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="registrationNumber" label="Registration Number">
                                    <Input placeholder="Company Registration No." />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="pan" label="PAN (India)">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="dunsNumber" label="DUNS Number">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="defaultCurrency" label="Default Currency">
                                    <Select>
                                        <Option value="USD">USD</Option>
                                        <Option value="EUR">EUR</Option>
                                        <Option value="GBP">GBP</Option>
                                        <Option value="INR">INR</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="contractValue" label="Contract Value">
                                    <InputNumber style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="paymentTerms" label="Payment Terms">
                                    <Select placeholder="e.g. Net 30">
                                        <Option value="Net 15">Net 15</Option>
                                        <Option value="Net 30">Net 30</Option>
                                        <Option value="Net 60">Net 60</Option>
                                        <Option value="Due on Receipt">Due on Receipt</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="creditLimit" label="Credit Limit">
                                    <InputNumber style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="3. Operational Details" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item name="status" label="Client Status">
                                    <Select>
                                        <Option value="Prospect">Prospect</Option>
                                        <Option value="Active">Active</Option>
                                        <Option value="Inactive">Inactive</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="riskLevel" label="Risk Level">
                                    <Select placeholder="Select risk">
                                        <Option value="Low">Low</Option>
                                        <Option value="Medium">Medium</Option>
                                        <Option value="High">High</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="clientSegment" label="Client Segment">
                                    <Input placeholder="e.g. Enterprise, SMB" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="billingAddress" label="Billing Address">
                                    <Input.TextArea rows={3} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="billingContactEmail" label="Billing Contact Email">
                                    <Input type="email" placeholder="finance@company.com" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="4. Banking Information" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item name="bankName" label="Bank Name">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="bankAccountNumber" label="Account Number">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="ifscSwift" label="IFSC / SWIFT Code">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="currencyOfPayment" label="Currency of Payment">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="preferredPaymentMode" label="Preferred Payment Mode">
                                    <Select placeholder="Select Mode">
                                        <Option value="Wire Transfer">Wire Transfer</Option>
                                        <Option value="ACH">ACH</Option>
                                        <Option value="Credit Card">Credit Card</Option>
                                        <Option value="Cheque">Cheque</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
                        <Button onClick={() => router.back()}>Cancel</Button>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                            Save Client
                        </Button>
                    </div>
                </Form>
            </div>
        </MainLayout>
    );
}
