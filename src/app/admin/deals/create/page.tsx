"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  message,
  Divider,
  Tag,
  Breadcrumb,
  Tooltip,
} from "antd";
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  PlusOutlined,
  UserOutlined,
  BankOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  PartitionOutlined,
  TagOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { dealService, CreateDealPayload } from "@/services/dealService";
import pipelineStageService, { PipelineStage } from "@/services/pipelineStageService";
import { EmployeeService } from "@/services/employeeServices";
import MainLayout from "@/components/layout/MainLayout";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateDealPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const router = useRouter();

  const selectedCurrency = Form.useWatch("currency", form);
  const selectedSource = Form.useWatch("source", form);

  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };

  const getCurrencySymbol = (code: string) => currencySymbols[code] || "$";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Stages
      try {
        const stagesRes = await pipelineStageService.getAll();
        setStages(stagesRes || []);
        
        // Set default stage if available
        if (stagesRes && stagesRes.length > 0) {
          const defaultStage = stagesRes.find((s: any) => s.isDefault);
          if (defaultStage) {
            form.setFieldsValue({
              stageId: defaultStage.id,
              probability: defaultStage.probability,
            });
          }
        }
      } catch (err: any) {
        console.error("Error fetching stages:", err);
        message.error("Failed to load pipeline stages");
      }

      // Fetch Employees/Members
      try {
        const employeesRes = await EmployeeService.getEmployeesForSelect();
        setEmployees(employeesRes || []);
      } catch (err: any) {
        console.error("Error fetching members:", err);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [form]);

  const onStageChange = (stageId: string) => {
    const selectedStage = stages.find((s) => s.id === stageId);
    if (selectedStage) {
      form.setFieldsValue({ probability: selectedStage.probability });
    }
  };

  const handleFinish = async (values: any, status: string = "Active") => {
    setLoading(true);
    try {
      const { sourceDetails, notes, ...rest } = values;
      
      // Combine sourceDetails into notes if present
      let finalNotes = notes || "";
      if (sourceDetails) {
        const sourceLabel = values.source || "Source";
        finalNotes = `[${sourceLabel} Details: ${sourceDetails}]\n${finalNotes}`;
      }

      const payload: CreateDealPayload = {
        ...rest,
        notes: finalNotes || null,
        status,
        expectedClosingDate: values.expectedClosingDate?.toISOString(),
      };
      
      await dealService.createDeal(payload);
      message.success(`Deal ${status === "Draft" ? "saved as draft" : "created"} successfully`);
      router.push("/admin/deals");
    } catch (error: any) {
      console.error("Error creating deal:", error);
      message.error(error.message || "An error occurred while creating the deal");
    } finally {
      setLoading(false);
    }
  };

  const glassStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '24px',
    height: '100%',
  };

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <Space style={{ marginBottom: '16px' }}>
      <span style={{ 
        fontSize: '20px', 
        color: '#1890ff', 
        background: 'rgba(24, 144, 255, 0.1)', 
        padding: '8px', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </span>
      <Title level={4} style={{ margin: 0 }}>{title}</Title>
    </Space>
  );

  return (
    <MainLayout>
      <div style={{ 
        padding: "32px 24px", 
        minHeight: '100vh', 
        background: '#ffffff' 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Breadcrumbs */}
          <Breadcrumb style={{ marginBottom: '16px' }}>
            <Breadcrumb.Item>
              <a onClick={() => router.push('/admin/dashboard')}>Dashboard</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <a onClick={() => router.push('/admin/deals')}>Deals</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Create New Deal</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            marginBottom: "32px" 
          }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()}
              style={{ 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Space direction="vertical" size={0}>
              <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Initiate New Deal</Title>
              <Text type="secondary">Capture lead information and set up your sales pipeline</Text>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleFinish(values, "Active")}
            initialValues={{ currency: "USD", probability: 0 }}
          >
            <Row gutter={[24, 24]}>
              {/* Left Column: Core Info */}
              <Col xs={24} lg={16}>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                  <div style={glassStyle}>
                    {sectionHeader(<UserOutlined />, "Client Information")}
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="clientName"
                          label="Primary Contact Name"
                          rules={[{ required: true, message: "Please enter client name" }]}
                        >
                          <Input size="large" placeholder="Full name of the contact" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="companyName" label="Company / Organization">
                          <Input size="large" prefix={<BankOutlined style={{ color: '#bfbfbf' }} />} placeholder="Company name" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="email"
                          label="Email Address"
                          rules={[{ type: "email", message: "Please enter a valid email" }]}
                        >
                          <Input size="large" placeholder="contact@example.com" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="phone" label="Phone Number">
                          <Input size="large" placeholder="+1 (555) 000-0000" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div style={glassStyle}>
                    {sectionHeader(<DollarOutlined />, "Deal Specifics")}
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          name="title"
                          label="Deal Opportunity Title"
                          rules={[{ required: true, message: "Please enter deal title" }]}
                        >
                          <Input size="large" placeholder="e.g. Enterprise Cloud License - Q3" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="estimatedValue" 
                          label="Estimated Deal Value"
                        >
                          <InputNumber
                            size="large"
                            style={{ width: "100%" }}
                            prefix={<span>{getCurrencySymbol(selectedCurrency)}</span>}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(value) => value!.replace(/[^0-9.]/g, "")}
                            placeholder="Enter amount"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="currency" label="Currency">
                          <Select size="large">
                            <Option value="USD">🇺🇸 USD - US Dollar</Option>
                            <Option value="EUR">🇪🇺 EUR - Euro</Option>
                            <Option value="GBP">🇬🇧 GBP - British Pound</Option>
                            <Option value="INR">🇮🇳 INR - Indian Rupee</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="expectedClosingDate" label="Expected Closing Date">
                          <DatePicker size="large" style={{ width: "100%" }} suffixIcon={<CalendarOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="probability" label={
                          <Space>
                            Probability of Success
                            <Tooltip title="Likelihood of winning this deal (0-100%)">
                              <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
                            </Tooltip>
                          </Space>
                        }>
                          <InputNumber
                            size="large"
                            min={0}
                            max={100}
                            formatter={(value) => `${value}%`}
                            parser={(value) => value!.replace("%", "") as any}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Space>
              </Col>

              {/* Right Column: Pipeline & Assignment */}
              <Col xs={24} lg={8}>
                <Space direction="vertical" size={24} style={{ width: "100%", height: '100%' }}>
                  <div style={glassStyle}>
                    {sectionHeader(<PartitionOutlined />, "Sales Pipeline")}
                    <Form.Item
                      name="stageId"
                      label="Initial Stage"
                      rules={[{ required: true, message: "Please select a stage" }]}
                    >
                      <Select 
                        size="large" 
                        placeholder="Select pipeline stage" 
                        onChange={onStageChange}
                        dropdownStyle={{ borderRadius: '12px' }}
                      >
                        {stages.map((stage) => (
                          <Option key={stage.id} value={stage.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: stage.color }} />
                              {stage.name}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Divider dashed style={{ margin: '24px 0' }} />

                    {sectionHeader(<TeamOutlined />, "Team Assignment")}
                    <Form.Item 
                      name="assigneeIds" 
                      label="Assigned Team Members"
                      help="Assign one or more users to handle this deal."
                    >
                      <Select 
                        size="large"
                        mode="multiple" 
                        placeholder="Select members" 
                        showSearch 
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        dropdownStyle={{ borderRadius: '12px' }}
                      >
                        {employees.map((emp: any) => (
                          <Option key={emp.value} value={emp.value} label={emp.label}>
                            <Space>
                              <div style={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                background: '#f0f0f0', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '10px'
                              }}>
                                <UserOutlined />
                              </div>
                              {emp.label}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div style={glassStyle}>
                    {sectionHeader(<TagOutlined />, "Classification")}
                    <Form.Item name="source" label="Deal Source">
                      <Select size="large" placeholder="Where did this come from?">
                        <Option value="Referral">🤝 Referral</Option>
                        <Option value="Website">🌐 Website</Option>
                        <Option value="LinkedIn">💼 LinkedIn</Option>
                        <Option value="Email">📧 Email Campaign</Option>
                        <Option value="Cold Call">📞 Cold Call</Option>
                        <Option value="Other">❓ Other</Option>
                      </Select>
                    </Form.Item>

                    {selectedSource && (
                      <Form.Item 
                        name="sourceDetails" 
                        label={`${selectedSource} Details`}
                        rules={[{ required: true, message: `Please enter ${selectedSource.toLowerCase()} details` }]}
                        initialValue=""
                      >
                        <Input 
                          size="large" 
                          placeholder={
                            selectedSource === "Website" ? "https://example.com" :
                            selectedSource === "LinkedIn" ? "LinkedIn profile or post URL" :
                            selectedSource === "Referral" ? "Who referred this deal?" :
                            selectedSource === "Email" ? "Campaign name or subject" :
                            `Enter ${selectedSource.toLowerCase()} details`
                          } 
                        />
                      </Form.Item>
                    )}

                    <Form.Item name="tags" label="Categorization Tags">
                      <Select 
                        size="large"
                        mode="tags" 
                        placeholder="Type and press Enter" 
                        style={{ width: "100%" }} 
                        tokenSeparators={[',']}
                      />
                    </Form.Item>
                  </div>
                </Space>
              </Col>

              {/* Bottom: Notes */}
              <Col span={24}>
                <div style={glassStyle}>
                  {sectionHeader(<FileTextOutlined />, "Discovery Notes")}
                  <Form.Item name="notes">
                    <TextArea 
                      rows={6} 
                      placeholder="Add background info, pain points, or key requirements discussed during discovery..." 
                      style={{ borderRadius: '12px' }}
                    />
                  </Form.Item>
                </div>
              </Col>
            </Row>

            {/* Sticky Footer for Actions */}
            <div style={{ 
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: '#ffffff',
              margin: '32px -24px -32px -24px',
              padding: '16px 24px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              display: "flex", 
              justifyContent: "flex-end", 
              gap: "16px",
              boxShadow: 'none'
            }}>
              <Button
                size="large"
                icon={<SaveOutlined />}
                onClick={() => handleFinish(form.getFieldsValue(), "Draft")}
                disabled={loading}
                style={{ borderRadius: '10px', minWidth: '160px' }}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={loading}
                style={{ 
                  borderRadius: '10px', 
                  minWidth: '200px',
                  height: '48px'
                }}
              >
                Launch Deal
              </Button>
            </div>
          </Form>
        </div>
      </div>

      <style jsx global>{`
        .ant-form-item-label > label {
          font-weight: 500;
          color: #595959;
          font-size: 13px;
        }
        .ant-input, .ant-input-number, .ant-select-selector, .ant-picker {
          border-radius: 10px !important;
          border-color: #d9d9d9 !important;
        }
        .ant-input:focus, .ant-input-number:focus, .ant-select-selector:focus {
          border-color: #1890ff !important;
          outline: none;
        }
        .ant-card-head {
          border-bottom: none;
          padding-top: 24px;
        }
        .ant-card-head-title {
          font-size: 18px;
          font-weight: 600;
        }
      `}</style>
    </MainLayout>
  );
};

export default CreateDealPage;
