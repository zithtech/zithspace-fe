"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Typography,
  message,
  Spin,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UserAddOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";

const { Title, Text } = Typography;
const { Option } = Select;

function CreateClientV2Content() {
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setIsEditMode(true);
      setClientId(id);
      setLoading(true);
      const fetchClientData = async () => {
        try {
          const data = await api.get(`/api/clients-v2/${id}`);
          form.setFieldsValue(data);
        } catch (err) {
          console.error(err);
          message.error("Failed to load client data for editing.");
          router.push("/clients-v2");
        } finally {
          setLoading(false);
        }
      };
      fetchClientData();
    }
  }, [searchParams, form, router]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = { ...values };
      if (isEditMode && clientId) {
        await api.put(`/api/clients-v2/${clientId}`, payload);
        message.success("Client successfully updated!");
        router.push(`/clients-v2/${clientId}`);
      } else {
        await api.post("/api/clients-v2", payload);
        message.success("Client successfully created!");
        router.push("/clients-v2");
      }
    } catch (err) {
      console.error(err);
      message.error(
        `An error occurred while ${isEditMode ? "updating" : "creating"
        } the client`,
      );
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = [
    { value: "USD", label: "US Dollar", symbol: "$", minor: "Cent" },
    { value: "INR", label: "Indian Rupee", symbol: "₹", minor: "Paise" },
    { value: "EUR", label: "Euro", symbol: "€", minor: "Cent" },
    { value: "GBP", label: "British Pound", symbol: "£", minor: "Pence" },
    { value: "JPY", label: "Japanese Yen", symbol: "¥", minor: "" },
    { value: "AUD", label: "Australian Dollar", symbol: "A$", minor: "Cent" },
    { value: "CAD", label: "Canadian Dollar", symbol: "C$", minor: "Cent" },
    { value: "CNY", label: "Chinese Yuan", symbol: "¥", minor: "Fen" },
  ];

  return (
    <MainLayout>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            tip={isEditMode ? "Updating Client..." : "Creating Client..."}
          />
        </div>
      )}
      <div
        style={{
          padding: "24px",
          maxWidth: 1400,
          margin: "0 auto",
          height: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingBottom: 20,
            justifyContent: "space-between",
            position: "sticky",
            top: -20,
            paddingTop: 20,
            marginTop: -20,
            zIndex: 1000,
            backgroundColor: "white",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            />
            <UserAddOutlined style={{ fontSize: 28, color: "#1677ff" }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                {isEditMode ? "Edit Client" : "Create New Client"}
              </Title>
              <Text type="secondary">
                {isEditMode
                  ? "Update the client's details below."
                  : "Fill in the details below to create a new client profile."}
              </Text>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 16,
            }}
          >
            <Button onClick={() => router.back()}>Cancel</Button>

            <Button
              type="primary"
              onClick={() => form.submit()}
              icon={<SaveOutlined />}
              loading={loading}
            >
              {isEditMode ? "Save Changes" : "Save Client"}
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ defaultCurrency: "USD", status: "Prospect" }}
        >
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card
                title={
                  <div>
                    <div>Basic Details</div>
                    {/* <Text type="secondary" style={{ fontSize: 12 }}>
                      Core information about the company.
                    </Text> */}
                  </div>
                }
                bordered={false}
                style={{
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="companyName"
                      label="Company Name"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Enter company name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="legalName" label="Legal Name">
                      <Input placeholder="Enter legal business name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="clientType"
                      label="Client Type"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Select type">
                        <Option value="Direct">Direct</Option>
                        <Option value="Partner">Partner</Option>
                        <Option value="Reseller">Reseller</Option>
                        <Option value="Vendor">Vendor</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="industry" label="Industry">
                      <Input placeholder="e.g. Technology, Healthcare" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="companySize" label="Company Size">
                      <Select placeholder="Select size">
                        <Option value="1-10">1-10</Option>
                        <Option value="11-50">11-50</Option>
                        <Option value="51-200">51-200</Option>
                        <Option value="200+">200+</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="yearOfIncorporation"
                      label="Year of Incorporation"
                    >
                      <Input placeholder="YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="country" label="Country">
                      <Input placeholder="Country" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="website" label="Website">
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title={
                  <div>
                    <div>Compliance & Finance</div>
                    {/* <Text type="secondary" style={{ fontSize: 12 }}>
                      Tax, registration, and financial details.
                    </Text> */}
                  </div>
                }
                bordered={false}
                style={{
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="gstVatTaxId" label="GST / VAT / Tax ID">
                      <Input placeholder="Tax ID" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="registrationNumber"
                      label="Registration Number"
                    >
                      <Input placeholder="Company Registration No." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="pan" label="PAN (India)">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="dunsNumber" label="DUNS Number">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="defaultCurrency" label="Default Currency">
                      <Select>
                        <Option value="USD">USD</Option>
                        <Option value="EUR">EUR</Option>
                        <Option value="GBP">GBP</Option>
                        <Option value="INR">INR</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="contractValue" label="Contract Value">
                      <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="paymentTerms" label="Payment Terms">
                      <Select placeholder="e.g. Net 30">
                        <Option value="Net 15">Net 15</Option>
                        <Option value="Net 30">Net 30</Option>
                        <Option value="Net 60">Net 60</Option>
                        <Option value="Due on Receipt">Due on Receipt</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="creditLimit" label="Credit Limit">
                      <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card
                title={
                  <div>
                    <div>Operational Details</div>
                    {/* <Text type="secondary" style={{ fontSize: 12 }}>
                      Client status, risk, and billing contacts.
                    </Text> */}
                  </div>
                }
                bordered={false}
                style={{
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="status" label="Client Status">
                      <Select>
                        <Option value="Prospect">Prospect</Option>
                        <Option value="Active">Active</Option>
                        <Option value="Inactive">Inactive</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="riskLevel" label="Risk Level">
                      <Select placeholder="Select risk">
                        <Option value="Low">Low</Option>
                        <Option value="Medium">Medium</Option>
                        <Option value="High">High</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="clientSegment" label="Client Segment">
                      <Input placeholder="e.g. Enterprise, SMB" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="billingAddress" label="Billing Address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="billingContactEmail"
                      label="Billing Contact Email"
                    >
                      <Input type="email" placeholder="finance@company.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title={
                  <div>
                    <div>Banking Information</div>
                    {/* <Text type="secondary" style={{ fontSize: 12 }}>
                      Client's primary bank account for payments.
                    </Text> */}
                  </div>
                }
                bordered={false}
                style={{
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="bankName" label="Bank Name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="bankAccountNumber" label="Account Number">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ifscSwift" label="IFSC / SWIFT Code">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    {/* <Form.Item
                      name="currencyOfPayment"
                      label="Currency of Payment"
                    >
                      <Input />
                    </Form.Item> */}
                    <Form.Item
                      name="currencyOfPayment"
                      label="Currency of Payment"
                    >
                      <Select
                        placeholder="Select Currency"
                        showSearch
                        optionFilterProp="children"
                      >
                        {currencyOptions.map((currency) => (
                          <Option key={currency.value} value={currency.value}>
                            {currency.value} {currency.symbol}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="preferredPaymentMode"
                      label="Preferred Payment Mode"
                    >
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
            </Col>
          </Row>
        </Form>
      </div>
    </MainLayout>
  );
}

export default function CreateClientV2Page() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Loading..." />
      </div>
    }>
      <CreateClientV2Content />
    </Suspense>
  );
}
