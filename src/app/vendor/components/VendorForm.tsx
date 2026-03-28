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
import { VendorService } from "@/services/vendor.service";
import AttachmentSection, { AttachmentItem } from "../../recruitment/job-requisitions/components/AttachmentSection";

const { Title, Text } = Typography;
const { Option } = Select;

interface VendorFormProps {
  id?: string;
  mode: "create" | "edit" | "view";
}

export default function VendorForm({ id, mode }: VendorFormProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const isEdit = mode === "edit";
  const isView = mode === "view";

  useEffect(() => {
    if (id && (isEdit || isView)) {
      fetchVendorData(id);
    }
  }, [id, mode]);

  const fetchVendorData = async (vendorId: string) => {
    setFetching(true);
    try {
      const vendor = await VendorService.getVendorById(vendorId);
      
      if (vendor.documents && Array.isArray(vendor.documents)) {
        vendor.documents = vendor.documents.map((doc: any) => ({
          id: doc.id,
          fileName: doc.documentType ? `${doc.documentType} Document` : "Document",
          fileUrl: doc.documentUrl,
          category: doc.documentType || "Other",
          isNew: false,
        }));
      }

      form.setFieldsValue(vendor);
    } catch (err) {
      console.error("Failed to fetch vendor data", err);
      message.error("Failed to load vendor information");
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
        await VendorService.updateVendor(id, payload);
        notification.success({ message: "Vendor Updated Successfully" });
      } else {
        await VendorService.createVendor(payload);
        notification.success({ message: "Vendor Created Successfully" });
      }
      router.push("/vendor");
    } catch (err) {
      console.error("Failed to save vendor", err);
      message.error("Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };


  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: "#f5f5f5" }}>
        <Spin size="large" tip="Loading vendor details..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "white", minHeight: "calc(100vh - 64px)", paddingBottom: "100px" }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/vendor">Vendors</Breadcrumb.Item>
        <Breadcrumb.Item>{isEdit ? "Edit Vendor" : isView ? "View Vendor" : "Add Vendor"}</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space size="middle">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push("/vendor")}
              style={{ borderRadius: "8px" }}
            />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                {isEdit ? "Edit Vendor" : isView ? "Vendor Details" : "Add Vendor"}
              </Title>
              <Text type="secondary">
                {isView ? "Review technical and business details of the vendor." : "Complete the information sections below."}
              </Text>
            </div>
          </Space>
          
          {!isView && (
            <Space>
              <Button onClick={() => form.resetFields()}>Reset</Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={loading}
                onClick={() => form.submit()}
              >
                {isEdit ? "Update Vendor" : "Save Vendor"}
              </Button>
            </Space>
          )}
          {isView && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => router.push(`/vendor/edit/${id}`)}>
              Edit Vendor
            </Button>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={isView}
          initialValues={{ status: true, contactPersons: [{}], documents: [] }}
        >
          {/* Section 1: Basic Information */}
          <Card title={<Space><InfoCircleOutlined />Basic Information</Space>} style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: "Please enter company name" }]}
                >
                  <Input placeholder="Enter company name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="industry" label="Industry">
                  <Input placeholder="Enter industry" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="website" label="Website URL">
                  <Input placeholder="e.g. www.vendor.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="companyEmail" label="Company Email">
                  <Input placeholder="e.g. contact@vendor.com" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="companyPhone" label="Company Phone">
                  <Input placeholder="e.g. +1 234 567 890" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </Col>
            </Row>
            <Divider dashed />
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item name="street" label="Street Name">
                  <Input placeholder="Enter street name" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item name="city" label="City">
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="country" label="Country">
                  <Input placeholder="Enter country" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="zipCode" label="Zip Code">
                  <Input placeholder="Enter zip code" />
                </Form.Item>
              </Col>
            </Row>
            </Card>

            {/* Section 2: Contact Persons */}
            <Card title={<Space><PlusOutlined />Contact Person Details</Space>} style={{ marginBottom: 24, borderRadius: '8px' }}>
              <Form.List name="contactPersons">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: fields.length > 1 ? '1px dashed #f0f0f0' : 'none' }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'personName']} label="Contact Name" rules={[{ required: true, message: 'Required' }]}>
                              <Input placeholder="Contact name" />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'designation']} label="Designation">
                              <Input placeholder="e.g. Manager" />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'email']} label="Email">
                              <Input placeholder="Email address" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'phone']} label="Phone Number">
                              <Input placeholder="Phone number" />
                            </Form.Item>
                          </Col>
                          <Col span={13}>
                            <Form.Item {...restField} name={[name, 'linkedInUrl']} label="LinkedIn Profile">
                              <Input placeholder="https://..." />
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
          <Card title="Business Details" style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Form.List name="businessDetails">
              {(fields, { add }) => (
                <>
                  {fields.length === 0 && !isView && add()}
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={24} key={key}>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'registrationNumber']} label="Registration Number">
                          <Input placeholder="Reg #" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'taxId']} label="Tax ID / PAN">
                          <Input placeholder="Tax ID" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'businessType']} label="Business Type">
                          <Select placeholder="Select type">
                            <Option value="Corporation">Corporation</Option>
                            <Option value="LLC">LLC</Option>
                            <Option value="Proprietorship">Proprietorship</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'yearEstabliliesh']} label="Year Established">
                          <Input type="number" placeholder="YYYY" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'totalEmployees']} label="Total Employees">
                          <Input type="number" placeholder="Count" />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
            </Form.List>
          </Card>

          {/* Section 4 & 5: Relations & Associations */}
          <Card title="Relationships & Associations" style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Form.List name="relations">
              {(fields, { add }) => (
                <>
                  {fields.length === 0 && !isView && add()}
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'linkedVendor']} label="Linked Vendor">
                            <Input placeholder="Vendor name" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'linkedClient']} label="Linked Client">
                            <Input placeholder="Client name" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Divider orientation="left" style={{ margin: '12px 0' }}>Work Authorization Support</Divider>
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
                                  <Input placeholder="e.g. H1B, L1, OPT" />
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
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.documents !== curr.documents}>
            {({ getFieldValue, setFieldsValue }) => (
              <AttachmentSection
                attachments={getFieldValue("documents") || []}
                onAttachmentsChange={(newAttachments) => {
                  form.setFieldsValue({ documents: newAttachments });
                }}
                title="Documents"
                categories={[
                  { key: "Registration Certificate", label: "Registration Certificate" },
                  { key: "Tax Document", label: "Tax Document" },
                  { key: "Business ID", label: "Business ID" },
                  { key: "Agreement", label: "Agreement" },
                  { key: "Other", label: "Other" },
                ]}
                loading={loading}
              />
            )}
          </Form.Item>

          {/* Section 8: Notes */}
          <Card title="Additional Notes" style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Form.Item name="notes">
              <Input.TextArea rows={4} placeholder="Enter any additional notes..." />
            </Form.Item>
          </Card>

          {!isView && (
            <div style={{ textAlign: "right", marginTop: 24, paddingBottom: 48 }}>
              <Space size="large">
                <Button size="large" onClick={() => router.push("/vendor")}>Cancel</Button>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={loading}
                  onClick={() => form.submit()}
                  style={{ minWidth: 150 }}
                >
                  {isEdit ? "Update Vendor" : "Save Vendor"}
                </Button>
              </Space>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}
