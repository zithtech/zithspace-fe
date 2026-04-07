"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  List,
  message,
  Col,
  Row,
  Drawer,
  Empty,
  Tooltip,
  Progress,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ProjectOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMilestones } from "@/hooks/useMilestones";
import { ProjectService } from "@/services/projectService";
import ReleasePlanService, { ReleasePlan } from "@/services/releasePlanService";
import { Milestone } from "@/services/milestoneService";
import MainLayout from "@/components/layout/MainLayout";

const { Title, Text } = Typography;

export default function MilestonesPage() {
  const [form] = Form.useForm();
  const {
    milestones,
    isLoading,
    createMilestone,
    deleteMilestone,
    updateMilestoneSprints,
    isCreating,
    isUpdatingSprints,
  } = useMilestones();

  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pointInput, setPointInput] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  
  // Sprint selection state per milestone
  const [projectSprints, setProjectSprints] = useState<Record<string, ReleasePlan[]>>({});
  const [selectedSprints, setSelectedSprints] = useState<Record<string, string[]>>({});
  
  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentSprint, setCurrentSprint] = useState<ReleasePlan | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await ProjectService.getUserProjects();
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadSprintsForProject = async (projectId: string) => {
    if (projectSprints[projectId]) return;
    try {
      const data = await ReleasePlanService.getAvailableSprints(projectId);
      setProjectSprints(prev => ({ ...prev, [projectId]: data }));
    } catch (error) {
      console.error("Failed to load sprints:", error);
    }
  };

  const handleAddPoint = () => {
    if (pointInput.trim()) {
      setPoints([...points, pointInput.trim()]);
      setPointInput("");
    }
  };

  const handleRemovePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleCreate = async (values: any) => {
    try {
      await createMilestone({
        ...values,
        points,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
        sprintIds: values.sprintIds,
      });
      setIsModalOpen(false);
      form.resetFields();
      setPoints([]);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Watch projectId for conditional sprint fetching
  const watchedProjectId = Form.useWatch("projectId", form);

  useEffect(() => {
    if (watchedProjectId) {
      loadSprintsForProject(watchedProjectId);
    }
  }, [watchedProjectId]);

  const handleSprintSelectChange = (milestoneId: string, sprintIds: string[]) => {
    setSelectedSprints(prev => ({ ...prev, [milestoneId]: sprintIds }));
  };

  const handleAddSprint = async (milestoneId: string) => {
    const sprintIds = selectedSprints[milestoneId];
    if (!sprintIds || sprintIds.length === 0) {
      message.warning("Please select at least one sprint");
      return;
    }
    try {
      await updateMilestoneSprints({ id: milestoneId, sprintIds });
    } catch (error) {
      // Error handled by hook
    }
  };

  const openSprintDrawer = async (sprintId: string) => {
    setDrawerVisible(true);
    setDrawerLoading(true);
    try {
      const data = await ReleasePlanService.getReleasePlanById(sprintId);
      setCurrentSprint(data);
    } catch (error) {
      message.error("Failed to load sprint details");
    } finally {
      setDrawerLoading(false);
    }
  };

  const columns = [
    {
      title: "Milestone Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Milestone) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {dayjs(record.startDate).format("MMM D")} - {dayjs(record.endDate).format("MMM D, YYYY")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Points / Tickets",
      dataIndex: "points",
      key: "points",
      render: (points: string[]) => (
        <Space wrap>
          {points.map((p, i) => (
            <Tag key={i} color="blue" style={{ borderRadius: "4px" }}>{p}</Tag>
          ))}
          {points.length === 0 && <Text type="secondary" italic>No points</Text>}
        </Space>
      ),
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      render: (name: string, record: Milestone) => (
        <Space>
          <ProjectOutlined style={{ color: "#1890ff" }} />
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Sprint",
      key: "sprints",
      width: 350,
      render: (_: any, record: Milestone) => {
        const milestoneSprints = record.sprints || [];
        const currentSelection = selectedSprints[record.id] || milestoneSprints.map(s => s.id);
        
        return (
          <Space.Compact style={{ width: "100%" }}>
            <Select
              mode="multiple"
              placeholder="Select Sprints"
              style={{ width: "calc(100% - 100px)" }}
              value={currentSelection}
              onFocus={() => loadSprintsForProject(record.projectId)}
              onChange={(vals) => handleSprintSelectChange(record.id, vals)}
              options={projectSprints[record.projectId]?.map(s => ({
                label: s.version,
                value: s.id
              }))}
              tagRender={({ label, value, closable, onClose }) => (
                <Tag
                  color="green"
                  closable={closable}
                  onClose={onClose}
                  style={{ marginRight: 3, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSprintDrawer(value as string);
                  }}
                >
                  {label}
                </Tag>
              )}
            />
            <Button 
              type="primary" 
              onClick={() => handleAddSprint(record.id)}
              loading={isUpdatingSprints}
              icon={<PlusOutlined />}
            >
              Add Sprint
            </Button>
          </Space.Compact>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: Milestone) => (
        <Space>
          <Tooltip title="Delete Milestone">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteMilestone(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: "32px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Milestones Management</Title>
            <Text type="secondary">Define key milestones and assign them to your project sprints.</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{ height: "46px", borderRadius: "8px", fontWeight: "600" }}
          >
            Create Milestone
          </Button>
        </div>

        {/* Table */}
        <Card
          variant="outlined"
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}
        >
          <Table
            columns={columns}
            dataSource={milestones}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: <Empty description="No milestones created yet" style={{ padding: "40px" }} />
            }}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          title={<Title level={4} style={{ margin: 0 }}>Create New Milestone</Title>}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: "20px" }}>
            <Form.Item label="Milestone Title" name="title" rules={[{ required: true }]}>
              <Input placeholder="Enter milestone title" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Project" name="projectId" rules={[{ required: true }]}>
                  <Select placeholder="Select project" size="large">
                    {projects.map((p) => (
                      <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Sprint" name="sprintIds">
                  <Select
                    mode="multiple"
                    placeholder="Select sprints"
                    size="large"
                    disabled={!watchedProjectId}
                    options={projectSprints[watchedProjectId]?.map(s => ({
                      label: s.version,
                      value: s.id
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Timeline" name="dates" rules={[{ required: true }]}>
                  <DatePicker.RangePicker style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Points / Tickets">
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Add a point (e.g. feature name, ticket ID)"
                  value={pointInput}
                  onChange={(e) => setPointInput(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleAddPoint();
                  }}
                />
                <Button type="primary" onClick={handleAddPoint}>Add</Button>
              </Space.Compact>
              {points.length > 0 && (
                <div style={{ marginTop: "12px", maxHeight: "150px", overflowY: "auto", padding: "8px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <List
                    size="small"
                    dataSource={points}
                    renderItem={(item, index) => (
                      <List.Item
                        actions={[
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemovePoint(index)} />
                        ]}
                      >
                        {item}
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} placeholder="Optional description..." />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: "24px" }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isCreating}
                style={{ height: "48px", borderRadius: "8px" }}
              >
                Create Milestone
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Sprint Overview Drawer */}
        <Drawer
          title={
            <Space>
              <RocketOutlined style={{ color: "#1890ff" }} />
              <span style={{ fontWeight: 700 }}>{currentSprint?.version}</span>
              <Tag color={currentSprint?.status === 'active' ? 'processing' : 'default'} style={{ marginLeft: 8 }}>
                {currentSprint?.status?.toUpperCase()}
              </Tag>
            </Space>
          }
          placement="right"
          width={600}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          destroyOnClose
        >
          {drawerLoading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Loading sprint details...</div>
          ) : currentSprint ? (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card bodyStyle={{ padding: "16px" }} style={{ borderRadius: "8px", background: "#f0f7ff", border: "none" }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>PROGRESS</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Progress percent={currentSprint.progress} size="small" status="active" />
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>TIMELINE</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Text strong>
                        {currentSprint.startDate ? dayjs(currentSprint.startDate).format("MMM D") : "TBD"} - 
                        {currentSprint.endDate ? dayjs(currentSprint.endDate).format("MMM D, YYYY") : "TBD"}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              <div>
                <Title level={5}>Goal</Title>
                <Text>{currentSprint.goal || "No goal specified"}</Text>
              </div>

              <div>
                <Title level={5}>Tickets ({currentSprint.tickets?.length || 0})</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={currentSprint.tickets}
                  renderItem={(ticket) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color="blue">{ticket.ticketNumber}</Tag>
                            <Text strong>{ticket.title}</Text>
                          </Space>
                        }
                        description={
                          <Space split={<Text type="secondary">|</Text>}>
                            <Tag color={ticket.priority === 'High' ? 'red' : 'orange'}>{ticket.priority}</Tag>
                            <Text type="secondary">{ticket.status}</Text>
                            {ticket.assignee && <Text type="secondary">Assigned to: {ticket.assignee.name}</Text>}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: "No tickets in this sprint" }}
                />
              </div>
            </Space>
          ) : (
            <Empty description="Sprint details not found" />
          )}
        </Drawer>
        
        <style jsx global>{`
          .ant-table-thead > tr > th {
            background: #f9fafb !important;
            font-weight: 600 !important;
          }
          .ant-select-multiple .ant-select-selection-item {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #166534;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
