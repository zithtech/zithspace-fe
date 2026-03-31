"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Button,
  Row,
  Col,
  Space,
  Tag,
  Avatar,
  Tabs,
  Divider,
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  TimePicker,
  Timeline,
} from "antd";
import {
  LeftOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DownloadOutlined,
  HistoryOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  AppstoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useGeneralCandidate, useGeneralCandidates } from "@/hooks/useGeneralCandidate";
import { GeneralCandidateResponse } from "@/services/generalCandidateService";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

export default function CandidateProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: candidate, isLoading } = useGeneralCandidate(id as string);
  const { updateCandidate } = useGeneralCandidates();

  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isInterviewModalVisible, setIsInterviewModalVisible] = useState(false);
  const [statusForm] = Form.useForm();
  const [interviewForm] = Form.useForm();

  if (isLoading) return null; // Or skeleton

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPLIED": return "default";
      case "SHORTLISTED": return "purple";
      case "INTERVIEW": return "processing";
      case "OFFERED": return "warning";
      case "JOINED": return "success";
      case "REJECTED": return "error";
      default: return "default";
    }
  };

  const handleStatusUpdate = async (values: any) => {
    try {
      await updateCandidate({ id: id as string, data: { status: values.status } });
      setIsStatusModalVisible(false);
    } catch (error) { }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: "30px", background: "#ffffff", minHeight: "100vh" }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={<LeftOutlined style={{ fontSize: '20px' }} />} 
              onClick={() => router.push("/Candidate-management2")}
              style={{ marginRight: '12px', padding: 0, height: 'auto', border: 'none', background: 'transparent' }}
            />
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Candidate Profile</Title>
          </div>

          {/* Header Section */}
          <Card
            bordered={false}
            style={{ borderRadius: '16px', marginBottom: '24px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Space size={24} align="start">
                  <Avatar
                    size={80}
                    style={{ backgroundColor: '#f56a00', fontSize: '32px' }}
                  >
                    {candidate?.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Space size={12} align="center">
                      <Title level={2} style={{ margin: 0 }}>{candidate?.fullName}</Title>
                      <Tag color={getStatusColor(candidate?.status || "")} style={{ borderRadius: '6px', fontSize: '14px', padding: '2px 10px', textTransform: 'capitalize' }}>
                        {candidate?.status?.toLowerCase()}
                      </Tag>
                    </Space>
                    <div style={{ marginTop: '8px' }}>
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary"><UserOutlined /> {candidate?.currentCompany || "No Company"}</Text>
                        <Text type="secondary"><EnvironmentOutlined /> {candidate?.location || "No Location"}</Text>
                        <Text type="secondary"><CalendarOutlined /> Added {dayjs(candidate?.createdAt).format('MMM D, YYYY')}</Text>
                      </Space>
                    </div>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => router.push(`/Candidate-management2/edit/${id}`)}
                    style={{ borderRadius: '8px' }}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => setIsStatusModalVisible(true)}
                    style={{ borderRadius: '8px' }}
                  >
                    Change Status
                  </Button>
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={() => setIsInterviewModalVisible(true)}
                    style={{ borderRadius: '8px', backgroundColor: '#2563eb' }}
                  >
                    Schedule Interview
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabs Layout */}
          <Card
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
            bodyStyle={{ padding: '0px' }}
          >
            <Tabs defaultActiveKey="1" className="candidate-tabs" tabBarStyle={{ padding: '0 24px', margin: 0 }}>
              <TabPane tab="Overview" key="1">
                <div style={{ padding: '32px' }}>
                  <Row gutter={[48, 32]}>
                    <Col span={12}>
                      <Title level={5}>Basic Information</Title>
                      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: '16px' }}>
                        <Row><Col span={8}><Text type="secondary">Email</Text></Col><Col span={16}><Text strong>{candidate?.email}</Text></Col></Row>
                        <Row><Col span={8}><Text type="secondary">Phone</Text></Col><Col span={16}><Text strong>{candidate?.phone}</Text></Col></Row>
                        <Row><Col span={8}><Text type="secondary">Location</Text></Col><Col span={16}><Text strong>{candidate?.location || "N/A"}</Text></Col></Row>
                        <Row><Col span={8}><Text type="secondary">Experience</Text></Col><Col span={16}><Text strong>{candidate?.totalExperience} Years</Text></Col></Row>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Title level={5}>Professional Details</Title>
                      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: '16px' }}>
                        <Row><Col span={8}><Text type="secondary">Current Salary</Text></Col><Col span={16}><Text strong>${candidate?.currentSalary?.toLocaleString()}</Text></Col></Row>
                        <Row><Col span={8}><Text type="secondary">Expected Salary</Text></Col><Col span={16}><Text strong>${candidate?.expectedSalary?.toLocaleString()}</Text></Col></Row>
                        <Row><Col span={8}><Text type="secondary">Notice Period</Text></Col><Col span={16}><Tag color="blue">{candidate?.noticePeriod || "N/A"}</Tag></Col></Row>
                      </Space>
                    </Col>
                    <Col span={24}>
                      <Divider />
                      <Title level={5}>Skills</Title>
                      <div style={{ marginTop: '16px' }}>
                        <Space size={[8, 12]} wrap>
                          {candidate?.skills?.map(skill => (
                            <Tag key={skill} style={{ borderRadius: '12px', padding: '4px 12px', fontSize: '14px', fontWeight: 500 }} color="blue" bordered={false}>
                              {skill}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </Col>
                  </Row>
                </div>
              </TabPane>

              <TabPane tab="Resume" key="2">
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  {candidate?.resumeUrl ? (
                    <div style={{ background: '#f1f5f9', padding: '40px', borderRadius: '12px' }}>
                      <FileTextOutlined style={{ fontSize: '48px', color: '#64748b', marginBottom: '16px' }} />
                      <Title level={4}>Resume Preview</Title>
                      <Text type="secondary">You can view and download the candidate's resume below.</Text>
                      <div style={{ marginTop: '24px' }}>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          href={candidate.resumeUrl}
                          target="_blank"
                          style={{ borderRadius: '8px', height: '40px' }}
                        >
                          Download Resume
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary">No resume uploaded.</Text>
                  )}
                </div>
              </TabPane>

              <TabPane tab="Jobs Applied" key="3">
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <AppstoreOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#64748b' }}>No jobs applied yet</Title>
                </div>
              </TabPane>

              <TabPane tab="Interview" key="4">
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <CalendarOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#64748b' }}>No interviews scheduled</Title>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => setIsInterviewModalVisible(true)}
                    style={{ marginTop: '16px' }}
                  >
                    Schedule First Interview
                  </Button>
                </div>
              </TabPane>

              <TabPane tab="Notes & Activity" key="5">
                <div style={{ padding: '32px' }}>
                  <Timeline mode="left">
                    <Timeline.Item label={dayjs(candidate?.createdAt).format('MMM D, HH:mm')} color="green">
                      Candidate record created
                    </Timeline.Item>
                    <Timeline.Item label={dayjs(candidate?.updatedAt).format('MMM D, HH:mm')}>
                      Record updated
                    </Timeline.Item>
                  </Timeline>
                </div>
              </TabPane>

              <TabPane tab="Documents" key="6">
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#64748b' }}>No additional documents</Title>
                  <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: '16px' }}>
                    Upload Document
                  </Button>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </div>

        {/* Status Update Modal */}
        <Modal
          title="Update Candidate Status"
          visible={isStatusModalVisible}
          onCancel={() => setIsStatusModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsStatusModalVisible(false)}>Cancel</Button>,
            <Button key="submit" type="primary" onClick={() => statusForm.submit()} style={{ backgroundColor: '#2563eb' }}>Update</Button>
          ]}
          style={{ borderRadius: '12px' }}
        >
          <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate} initialValues={{ status: candidate?.status }}>
            <Form.Item name="status" label="Select New Status" rules={[{ required: true }]}>
              <Select size="large">
                <Option value="APPLIED">Applied</Option>
                <Option value="SHORTLISTED">Shortlisted</Option>
                <Option value="INTERVIEW">Interview</Option>
                <Option value="OFFERED">Offered</Option>
                <Option value="JOINED">Joined</Option>
                <Option value="REJECTED">Rejected</Option>
              </Select>
            </Form.Item>
            <Form.Item name="remarks" label="Remarks">
              <TextArea rows={4} placeholder="Add any notes about this status change..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Schedule Interview Modal */}
        <Modal
          title="Schedule Interview"
          visible={isInterviewModalVisible}
          onCancel={() => setIsInterviewModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsInterviewModalVisible(false)}>Cancel</Button>,
            <Button key="submit" type="primary" onClick={() => interviewForm.submit()} style={{ backgroundColor: '#2563eb' }}>Schedule</Button>
          ]}
          width={600}
        >
          <Form form={interviewForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="time" label="Time" rules={[{ required: true }]}>
                  <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="interviewer" label="Interviewer" rules={[{ required: true }]}>
                  <Select placeholder="Select interviewer" size="large">
                    <Option value="hr_manager">HR Manager</Option>
                    <Option value="tech_lead">Tech Lead</Option>
                    <Option value="cto">CTO</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="mode" label="Mode" rules={[{ required: true }]}>
                  <Select size="large">
                    <Option value="ONLINE">Online (GMeet/Zoom)</Option>
                    <Option value="OFFLINE">Offline (In-Person)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="link" label="Meeting Link (if online)">
                  <Input prefix={<LinkOutlined />} placeholder="https://meet.google.com/..." size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        <style jsx global>{`
          .candidate-tabs .ant-tabs-tab {
            padding: 16px 0;
            font-weight: 500;
          }
          .candidate-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #2563eb;
          }
          .candidate-tabs .ant-tabs-ink-bar {
            background: #2563eb;
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
