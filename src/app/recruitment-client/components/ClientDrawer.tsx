"use client";

import React, { useState, useEffect } from "react";
import {
  Drawer,
  Form,
  Input,
  Button,
  Row,
  Col,
  Space,
  Typography,
  Select,
  Divider,
  message,
  notification,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { RecruitmentClientService, RecruitmentClient } from "@/services/recruitmentClient.service";
import { ImplementationPartnerService, ImplementationPartner } from "@/services/implementationPartner.service";
import { VendorService, Vendor } from "@/services/vendor.service";

const { Title, Text } = Typography;
const { Option } = Select;

interface ClientDrawerProps {
  open: boolean;
  onClose: () => void;
  clientId?: string | null;
  editData?: RecruitmentClient | null;
  onSuccess?: () => void;
}

export default function ClientDrawer({ open, onClose, clientId, editData, onSuccess }: ClientDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<ImplementationPartner[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const isEdit = !!clientId || !!editData;

  useEffect(() => {
    if (open) {
      fetchInitialData();
      if (editData) {
        form.setFieldsValue({
          ...editData,
          businessDetails: editData.businessDetails?.length ? editData.businessDetails : [{}],
          hiringPreferences: editData.hiringPreferences?.length ? editData.hiringPreferences : [{}],
        });
      } else if (clientId) {
        fetchClientData(clientId);
      } else {
        form.resetFields();
        form.setFieldsValue({
            status: true,
            businessDetails: [{}],
            hiringPreferences: [{}],
        });
      }
    }
  }, [open, clientId, editData]);

  const fetchInitialData = async () => {
    try {
      const partnersRes = await ImplementationPartnerService.getPartners({ limit: 100 });
      setPartners(partnersRes.data);
      const vendorsRes = await VendorService.getVendors({ limit: 100 });
      setVendors(vendorsRes.data);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  };

  const fetchClientData = async (id: string) => {
    setLoading(true);
    try {
      const client = await RecruitmentClientService.getClientById(id);
      form.setFieldsValue({
          ...client,
          // Ensure arrays are not empty for the form
          businessDetails: client.businessDetails?.length ? client.businessDetails : [{}],
          hiringPreferences: client.hiringPreferences?.length ? client.hiringPreferences : [{}],
      });
    } catch (err) {
      console.error("Failed to fetch client data", err);
      message.error("Failed to load client information");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Clean data before sending
      if (isEdit) {
        const id = clientId || editData?.id;
        await RecruitmentClientService.updateClient(id!, values);
        notification.success({ message: "Client Updated Successfully" });
      } else {
        await RecruitmentClientService.createClient(values);
        notification.success({ message: "Client Created Successfully" });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to save client", err);
      message.error("Failed to save recruitment client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={isEdit ? "Edit Client" : "Add Client"}
      width={720}
      onClose={onClose}
      open={open}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={() => form.submit()}
          >
            {isEdit ? "Update Client" : "Save Client"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        {/* Section 1: Basic Information */}
        <Title level={5}>1. Basic Information</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="clientName"
              label="Client Name"
              rules={[{ required: true, message: "Please enter client name" }]}
            >
              <Input placeholder="Enter client name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="accountType" label="Account Type">
              <Select placeholder="Select type">
                <Option value="Direct Client">Direct Client</Option>
                <Option value="Indirect Client">Indirect Client</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="industry" label="Industry">
              <Input placeholder="Enter industry" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="website" label="Website">
              <Input placeholder="www.example.com" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="companyEmail" label="Company Email">
              <Input placeholder="contact@company.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyPhone" label="Company Phone">
              <Input placeholder="+1 234 567 890" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Section 2: Address Details */}
        <Title level={5}>2. Address Details</Title>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="street" label="Street">
              <Input placeholder="Enter street address" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="state" label="State">
              <Input placeholder="State" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="zipCode" label="Zip Code">
              <Input placeholder="Zip Code" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="country" label="Country">
              <Select placeholder="Select country">
                <Option value="India">India</Option>
                <Option value="America">America</Option>
                <Option value="Russia">Russia</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Section 3: Business Details */}
        <Title level={5}>3. Business Details</Title>
        <Form.List name="businessDetails">
          {(fields) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key}>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'companyName']} label="Company Size">
                      <Select placeholder="Select size">
                        <Option value="1-200">1–200</Option>
                        <Option value="200-500">200–500</Option>
                        <Option value="500-1000">500–1000</Option>
                        <Option value="1000+">1000+</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'yearEstablished']} label="Year Established">
                      <Input type="number" placeholder="YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'revenueRange']} label="Revenue Range">
                      <Input placeholder="e.g. $10M - $50M" />
                    </Form.Item>
                  </Col>
                </Row>
              ))}
            </>
          )}
        </Form.List>

        <Divider />

        {/* Section 4: Hiring Preferences */}
        <Title level={5}>4. Hiring Preferences</Title>
        <Form.List name="hiringPreferences">
          {(fields) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key}>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'employmentType']} label="Employment Types">
                      <Select placeholder="Select type">
                        <Option value="Full Time">Full Time</Option>
                        <Option value="Contract">Contract</Option>
                        <Option value="Part Time">Part Time</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'workType']} label="Work Type">
                      <Select placeholder="Select type">
                        <Option value="Remote">Remote</Option>
                        <Option value="Onsite">Onsite</Option>
                        <Option value="Hybrid">Hybrid</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item {...restField} name={[name, 'hiringLocation']} label="Hiring Locations">
                      <Input placeholder="e.g. Hyderabad, NY" />
                    </Form.Item>
                  </Col>
                </Row>
              ))}
            </>
          )}
        </Form.List>

        <Divider />

        {/* Section 5: Relationships */}
        <Title level={5}>5. Relationships</Title>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="implementationPartnerId" label="Linked Implementation Partner">
                <Select mode="multiple" showSearch placeholder="Search partner" optionFilterProp="children" allowClear>
                  {partners.map(p => (
                    <Option key={p.id} value={p.id}>{p.companyName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="primeVendorId" label="Linked Prime Vendor">
                <Select mode="multiple" showSearch placeholder="Search vendor" optionFilterProp="children" allowClear>
                  {vendors.map(v => (
                    <Option key={v.id} value={v.id}>{v.companyName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Section 6: Contact Persons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>6. Contact Persons</Title>
        </div>
        
        <Form.List name="contacts">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ 
                  background: '#f9f9f9', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  marginBottom: 16,
                  position: 'relative'
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'personName']}
                        label="Contact Name"
                        rules={[{ required: true, message: 'Please enter contact name' }]}
                      >
                        <Input placeholder="Enter contact name" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'designation']}
                        label="Designation"
                      >
                        <Input placeholder="Enter designation" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'email']}
                        label="Email"
                      >
                        <Input placeholder="Enter email" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'phone']}
                        label="Phone"
                      >
                        <Input placeholder="Enter phone" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        {...restField}
                        name={[name, 'linkedInUrl']}
                        label="LinkedIn Profile URL"
                      >
                        <Input placeholder="https://linkedin.com/in/username" />
                      </Form.Item>
                    </Col>
                  </Row>
                  {fields.length > 1 && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => remove(name)}
                      style={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
              >
                Add Contact Person
              </Button>
            </>
          )}
        </Form.List>

        <Divider />

        {/* Section 7: Notes */}
        <Title level={5}>7. Notes</Title>
        <Form.Item name="notes">
          <Input.TextArea rows={4} placeholder="Enter any notes..." />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
