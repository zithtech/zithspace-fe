"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  Row,
  Col,
  Select,
  InputNumber,
  Upload,
  Space,
} from "antd";
import {
  LeftOutlined,
  InboxOutlined,
  GithubOutlined,
  LinkedinOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useGeneralCandidate, useGeneralCandidates } from "@/hooks/useGeneralCandidate";
import { message } from "antd";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

export default function EditCandidatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const { data: candidate, isLoading: isFetching } = useGeneralCandidate(id as string);
  const { updateCandidate, isUpdating } = useGeneralCandidates();
  const [resumeData, setResumeData] = useState<{ base64: string; fileName: string } | null>(null);

  useEffect(() => {
    if (candidate) {
      form.setFieldsValue(candidate);
    }
  }, [candidate, form]);

  const onFinish = async (values: any) => {
    try {
      const payload = {
        ...values,
        resume: resumeData,
      };
      await updateCandidate({ id: id as string, data: payload });
      router.push(`/Candidate-management2/${id}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleResumeUpload = (info: any) => {
    const { file } = info;
    if (file.status === 'done' || file.originFileObj) {
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj || file);
      reader.onload = () => {
        setResumeData({
          base64: reader.result as string,
          fileName: file.name,
        });
        message.success(`${file.name} uploaded successfully`);
      };
    }
  };

  if (isFetching) return null;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: "30px", background: "#ffffff", minHeight: "100vh" }}>
          <Row justify="center">
            <Col xs={24} lg={20} xl={16}>
              <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="text" 
                  icon={<LeftOutlined style={{ fontSize: '20px' }} />} 
                  onClick={() => router.push(`/Candidate-management2/${id}`)}
                  style={{ marginRight: '16px', padding: 0, height: 'auto', border: 'none', background: 'transparent' }}
                />
                <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Edit Candidate</Title>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark="optional"
              >
                {/* Basic Details */}
                <Card 
                  title={<span style={{ fontWeight: 600 }}>Basic Details</span>} 
                  bordered={false} 
                  style={{ borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        label="Full Name"
                        name="fullName"
                        rules={[{ required: true, message: 'Please enter full name' }]}
                      >
                        <Input placeholder="e.g. John Doe" size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Please enter email' },
                          { type: 'email', message: 'Please enter a valid email' }
                        ]}
                      >
                        <Input placeholder="john@example.com" size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Phone Number"
                        name="phone"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                      >
                        <Input placeholder="+1 (555) 000-0000" size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Location"
                        name="location"
                      >
                        <Input placeholder="City, State, Country" size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Professional Details */}
                <Card 
                  title={<span style={{ fontWeight: 600 }}>Professional Details</span>} 
                  bordered={false} 
                  style={{ borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        label="Total Experience (years)"
                        name="totalExperience"
                      >
                        <InputNumber style={{ width: '100%', borderRadius: '8px' }} size="large" min={0} placeholder="5" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Current Company"
                        name="currentCompany"
                      >
                        <Input placeholder="Acme Inc." size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label="Skills"
                        name="skills"
                      >
                        <Select
                          mode="tags"
                          placeholder="Type a skill and press Enter"
                          size="large"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Current Salary"
                        name="currentSalary"
                      >
                        <InputNumber 
                          style={{ width: '100%', borderRadius: '8px' }} 
                          size="large" 
                          min={0} 
                          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Expected Salary"
                        name="expectedSalary"
                      >
                        <InputNumber 
                          style={{ width: '100%', borderRadius: '8px' }} 
                          size="large" 
                          min={0} 
                          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Notice Period"
                        name="noticePeriod"
                      >
                        <Select size="large" style={{ borderRadius: '8px' }}>
                          <Option value="IMMEDIATE">Immediate</Option>
                          <Option value="15_DAYS">15 Days</Option>
                          <Option value="30_DAYS">30 Days</Option>
                          <Option value="60_DAYS">60 Days</Option>
                          <Option value="90_DAYS">90 Days</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Social Links */}
                <Card 
                  title={<span style={{ fontWeight: 600 }}>Social & Portfolio Links</span>} 
                  bordered={false} 
                  style={{ borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                >
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item
                        label="LinkedIn URL"
                        name="linkedinUrl"
                      >
                        <Input prefix={<LinkedinOutlined style={{ color: '#0077b5' }} />} size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label="GitHub URL"
                        name="githubUrl"
                      >
                        <Input prefix={<GithubOutlined />} size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label="Portfolio URL"
                        name="portfolioUrl"
                      >
                        <Input prefix={<GlobalOutlined style={{ color: '#10b981' }} />} size="large" style={{ borderRadius: '8px' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Resume Upload */}
                <Card 
                  title={<span style={{ fontWeight: 600 }}>Update Resume</span>} 
                  bordered={false} 
                  style={{ borderRadius: '12px', marginBottom: '32px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                >
                  {candidate?.resumeUrl && (
                    <div style={{ marginBottom: '16px' }}>
                      <Text type="secondary">Current Resume: </Text>
                      <Button type="link" href={candidate.resumeUrl} target="_blank">View Current Resume</Button>
                    </div>
                  )}
                  <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={() => false}
                    onChange={handleResumeUpload}
                    maxCount={1}
                    accept=".pdf,.doc,.docx"
                    style={{ background: '#ffffff', borderRadius: '12px', padding: '24px' }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#2563eb' }} />
                    </p>
                    <p className="ant-upload-text">Upload a new resume to replace the current one</p>
                  </Dragger>
                </Card>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '50px' }}>
                  <Button 
                    size="large" 
                    onClick={() => router.push(`/Candidate-management2/${id}`)}
                    style={{ borderRadius: '8px', padding: '0 24px', height: '46px' }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    size="large" 
                    htmlType="submit" 
                    loading={isUpdating}
                    style={{ borderRadius: '8px', padding: '0 32px', height: '46px', fontWeight: 600, backgroundColor: '#2563eb' }}
                  >
                    Update Candidate
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
