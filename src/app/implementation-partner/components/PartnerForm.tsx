"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Select,
  Switch,
  Upload,
  message,
  notification,
  Divider,
  Breadcrumb,
  Spin,
  App,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ImplementationPartnerService } from "@/services/implementationPartner.service";
import AttachmentSection, { AttachmentItem } from "../../recruitment/job-requisitions/components/AttachmentSection";

const { Title, Text } = Typography;
const { Option } = Select;

interface PartnerFormProps {
  id?: string;
  mode: "create" | "edit" | "view";
}

export default function PartnerForm({ id, mode }: PartnerFormProps) {
  const router = useRouter();
  const { notification: antdNotification } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const isEdit = mode === "edit";
  const isView = mode === "view";

  useEffect(() => {
    if (id && (isEdit || isView)) {
      fetchPartnerData(id);
    }
  }, [id, mode]);

  const fetchPartnerData = async (partnerId: string) => {
    setFetching(true);
    try {
      const partner = await ImplementationPartnerService.getPartnerById(partnerId);
      
      if (partner.documents && Array.isArray(partner.documents)) {
        partner.documents = partner.documents.map((doc: any) => ({
          id: doc.id,
          fileName: doc.documentType ? `${doc.documentType} Document` : "Document",
          fileUrl: doc.documentUrl,
          category: doc.documentType || "Other",
          isNew: false,
        }));
      }

      form.setFieldsValue(partner);
    } catch (err) {
      console.error("Failed to fetch partner data", err);
      antdNotification.error({ message: "Failed to load partner information" });
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Get all fields including unregistered ones to catch documents
      const allValues = form.getFieldsValue(true);
      const payload = { ...values, documents: allValues.documents || [] };

      // Map documents to backend format
      if (payload.documents && Array.isArray(payload.documents)) {
        payload.documents = payload.documents.map((doc: any) => ({
          documentType: doc.category || "Other",
          fileName: doc.fileName || "document.pdf",
          base64: doc.isNew ? doc.fileUrl : undefined,
          documentUrl: !doc.isNew ? doc.fileUrl : undefined,
        }));
      }

      if (isEdit && id) {
        await ImplementationPartnerService.updatePartner(id, payload);
        antdNotification.success({ message: "Partner Updated Successfully" });
      } else {
        await ImplementationPartnerService.createPartner(payload);
        antdNotification.success({ message: "Partner Created Successfully" });
      }
      router.push("/implementation-partner");
    } catch (err) {
      console.error("Failed to save partner", err);
      antdNotification.error({ message: "Failed to save implementation partner" });
    } finally {
      setLoading(false);
    }
  };


  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: "#f5f5f5" }}>
        <Spin size="large" tip="Loading partner details..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#ffffff", minHeight: "calc(100vh - 64px)", paddingBottom: "100px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Breadcrumb style={{ marginBottom: 16, fontSize: "12px" }}>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href="/implementation-partner">Implementation Partners</Breadcrumb.Item>
          <Breadcrumb.Item>{isEdit ? "Edit Partner" : isView ? "View Partner" : "Add Partner"}</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Space size="middle">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push("/implementation-partner")}
              style={{ borderRadius: "6px", border: "1px solid #f0f0f0" }}
            />
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                {isEdit ? "Edit Implementation Partner" : isView ? "Partner Details" : "Add Implementation Partner"}
              </Title>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                {isView ? "Review technical and business details of the partner." : "Complete the information sections below."}
              </Text>
            </div>
          </Space>
          
          {!isView && (
            <Space>
              <Button onClick={() => form.resetFields()} style={{ borderRadius: "6px" }}>Reset</Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={loading}
                onClick={() => form.submit()}
                style={{ borderRadius: "6px" }}
              >
                {isEdit ? "Update Partner" : "Save Partner"}
              </Button>
            </Space>
          )}
          {isView && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => router.push(`/implementation-partner/edit/${id}`)}
              style={{ borderRadius: "6px" }}
            >
              Edit Partner
            </Button>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={isView}
          initialValues={{ status: true, contactPersons: [{}], documents: [] }}
          requiredMark="optional"
        >
          {/* Section 1: Basic Information */}
          <Card 
            title={<Space><InfoCircleOutlined style={{ color: '#1677ff' }} />Basic Information</Space>} 
            style={{ marginBottom: 20, borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: 'none' }}
            headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: "Please enter company name" }]}
                >
                  <Input placeholder="Enter company name" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="industry" label="Industry">
                  <Input placeholder="Enter industry" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="website" label="Website URL">
                  <Input placeholder="e.g. www.partner.com" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="companyEmail" label="Company Email">
                  <Input placeholder="e.g. contact@partner.com" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="companyPhone" label="Company Phone">
                  <Input placeholder="e.g. +1 234 567 890" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </Col>
            </Row>
            <Divider dashed style={{ margin: '16px 0' }} />
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item name="street" label="Street Name">
                  <Input placeholder="Enter street name" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item name="city" label="City">
                  <Input placeholder="Enter city" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="country" label="Country">
                  <Input placeholder="Enter country" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="zipCode" label="Zip Code">
                  <Input placeholder="Enter zip code" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>
            </Row>
            </Card>

            {/* Section 2: Contact Persons */}
            <Card 
              title={<Space><PlusOutlined style={{ color: '#1677ff' }} />Contact Person Details</Space>} 
              style={{ marginBottom: 20, borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: 'none' }}
              headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
            >
              <Form.List name="contactPersons">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: fields.length > 1 ? '1px dashed #f0f0f0' : 'none' }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'personName']} label="Contact Name" rules={[{ required: true, message: 'Required' }]}>
                              <Input placeholder="Contact name" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'designation']} label="Designation">
                              <Input placeholder="e.g. Manager" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'email']} label="Email">
                              <Input placeholder="Email address" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'phone']} label="Phone Number">
                              <Input placeholder="Phone number" style={{ borderRadius: '6px' }} />
                            </Form.Item>
                          </Col>
                          <Col span={13}>
                            <Form.Item {...restField} name={[name, 'linkedInUrl']} label="LinkedIn Profile">
                              <Input placeholder="https://..." style={{ borderRadius: '6px' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </Card>

          {/* Section 3: Business Details */}
          <Card 
            title="Business Details" 
            style={{ marginBottom: 20, borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: 'none' }}
            headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          >
            <Form.List name="businessDetails">
              {(fields, { add }) => (
                <>
                  {fields.length === 0 && !isView && add()}
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={24} key={key}>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'registrationNumber']} label="Registration Number">
                          <Input placeholder="Reg #" style={{ borderRadius: '6px' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'taxId']} label="Tax ID / PAN">
                          <Input placeholder="Tax ID" style={{ borderRadius: '6px' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'businessType']} label="Business Type">
                          <Select placeholder="Select type" style={{ borderRadius: '6px' }}>
                            <Option value="Corporation">Corporation</Option>
                            <Option value="LLC">LLC</Option>
                            <Option value="Proprietorship">Proprietorship</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'yearEstabliliesh']} label="Year Established">
                          <Input type="number" placeholder="YYYY" style={{ borderRadius: '6px' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'totalEmployees']} label="Total Employees">
                          <Input type="number" placeholder="Count" style={{ borderRadius: '6px' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
            </Form.List>
          </Card>

          {/* Section 4 & 5: Relations & Associations */}
          <Card 
            title="Relationships & Associations" 
            style={{ marginBottom: 20, borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: 'none' }}
            headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          >
            <Form.List name="relations">
              {(fields, { add }) => (
                <>
                  {fields.length === 0 && !isView && add()}
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'linkedVendor']} label="Linked Vendor">
                            <Input placeholder="Vendor name" style={{ borderRadius: '6px' }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'linkedClient']} label="Linked Client">
                            <Input placeholder="Client name" style={{ borderRadius: '6px' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Divider orientation="left" style={{ margin: '12px 0', fontSize: '13px', color: '#1677ff' }}>Work Authorization Support</Divider>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'supportsVisaSponsorship']} label="Supports Visa Sponsorship" valuePropName="checked">
                            <Switch checkedChildren="Yes" unCheckedChildren="No" />
                          </Form.Item>
                        </Col>
                        <Form.Item noStyle dependencies={[['relations', name, 'supportsVisaSponsorship']]}>
                          {() => {
                            const supports = form.getFieldValue(['relations', name, 'supportsVisaSponsorship']);
                            return supports ? (
                              <Col span={12}>
                                <Form.Item {...restField} name={[name, 'visaTypesSupported']} label="Visa Types Supported">
                                  <Input placeholder="e.g. H1B, L1, OPT" style={{ borderRadius: '6px' }} />
                                </Form.Item>
                              </Col>
                            ) : null;
                          }}
                        </Form.Item>
                      </Row>
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </Card>

          {/* Section 7: Documents */}
          <div style={{ marginBottom: 20 }}>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.documents !== curr.documents}>
              {({ getFieldValue, setFieldsValue }) => (
                <div style={{ 
                  padding: '24px', 
                  background: '#fafafa', 
                  borderRadius: '8px', 
                  border: '1px solid #f0f0f0' 
                }}>
                  <AttachmentSection
                    attachments={getFieldValue("documents") || []}
                    onAttachmentsChange={(newAttachments) => {
                      form.setFieldsValue({ documents: newAttachments });
                    }}
                    title="Supporting Documents"
                    categories={[
                      { key: "Registration Certificate", label: "Registration Certificate" },
                      { key: "Tax Document", label: "Tax Document" },
                      { key: "Business ID", label: "Business ID" },
                      { key: "Agreement", label: "Agreement" },
                      { key: "Other", label: "Other" },
                    ]}
                    loading={loading}
                  />
                </div>
              )}
            </Form.Item>
          </div>

          {/* Section 8: Notes */}
          <Card 
            title="Additional Notes" 
            style={{ marginBottom: 20, borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: 'none' }}
            headStyle={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          >
            <Form.Item name="notes">
              <Input.TextArea rows={4} placeholder="Enter any additional notes..." style={{ borderRadius: '6px' }} />
            </Form.Item>
          </Card>

          {!isView && (
            <div style={{ textAlign: "right", marginTop: 32, paddingBottom: 48 }}>
              <Space size="large">
                <Button size="large" onClick={() => router.push("/implementation-partner")} style={{ borderRadius: '6px' }}>Cancel</Button>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={loading}
                  onClick={() => form.submit()}
                  style={{ minWidth: 150, borderRadius: '6px' }}
                >
                  {isEdit ? "Update Partner" : "Save Partner"}
                </Button>
              </Space>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}
