"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Card,
  Space,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Divider,
  message,
  Popconfirm,
  Avatar,
  Row,
  Col,
  Badge,
  Timeline,
  Drawer
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { useSalaryWorkflows } from "@/hooks/useSalaryWorkflows";
import { useRoles } from "@/hooks/useRoles";
import { useMembersSelect } from "@/hooks/useMembersSelect";
import { Workflow } from "@/services/salaryApprovalService";

const { Title, Text } = Typography;
const { Option } = Select;

export default function SalaryApproverSettings() {
  const { workflows, loading, saveWorkflow, deleteWorkflow } = useSalaryWorkflows();
  const { roles } = useRoles();
  const { users } = useMembersSelect();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewDrawerVisible, setIsViewDrawerVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    const payload = {
      id: editingWorkflow?.id,
      name: values.name,
      description: values.description,
      steps: values.steps.map((s: any, index: number) => ({
        ...s,
        stepOrder: index + 1
      }))
    };

    const success = await saveWorkflow(payload);
    if (success) {
      setIsModalVisible(false);
    }
  };

  const showEditModal = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    form.setFieldsValue({
      name: workflow.name,
      description: workflow.description,
      steps: workflow.steps
    });
    setIsModalVisible(true);
  };

  const columns = [
    { title: "Workflow Name", dataIndex: "name", key: "name" },
    {
      title: "Steps",
      render: (_: any, record: Workflow) => (
        <Space split={<ArrowRightOutlined style={{ fontSize: 12, color: "#bfbfbf" }} />}>
          {record.steps.map((step: any, index: number) => {
            let label = step.approverType;
            if (step.approverType === 'ROLE' && step.role?.name) label = step.role.name;
            else if (step.approverType === 'SPECIFIC_USER' && step.specificUser?.name) label = step.specificUser.name;

            return (
              <div key={step.id || step.stepOrder} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Badge 
                  count={index + 1} 
                  style={{ backgroundColor: '#1890ff', marginRight: 8, fontSize: 10 }} 
                  size="small"
                />
                <span style={{ 
                  padding: '2px 10px', 
                  borderRadius: '14px', 
                  backgroundColor: '#f0f2f5', 
                  fontSize: 13,
                  border: '1px solid #d9d9d9',
                  color: '#595959' 
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </Space>
      )
    },
    {
      title: "Actions",
      render: (_: any, record: Workflow) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined style={{ color: '#1890ff', fontSize: 18 }} />} 
            onClick={() => {
              setEditingWorkflow(record);
              setIsViewDrawerVisible(true);
            }} 
            title="View Details"
          />
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#8c8c8c' }} />} 
            onClick={() => showEditModal(record)} 
            title="Edit"
          />
          <Popconfirm 
            title="Are you sure you want to delete this workflow?" 
            onConfirm={() => deleteWorkflow(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} danger title="Delete" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '0 24px 24px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, padding: '24px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Space align="center" size="middle">
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '12px', 
            backgroundColor: '#e6f7ff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid #91d5ff'
          }}>
            <SettingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>Salary Approval Workflows</Title>
            <Text type="secondary">Define and manage multi-step approval processes</Text>
          </div>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => {
            setEditingWorkflow(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Create Workflow
        </Button>
      </div>

      <Table
        dataSource={workflows}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        style={{ marginTop: 8 }}
      />

      {/* View Drawer */}
      <Drawer
        title={<Space><EyeOutlined style={{ color: '#1890ff' }} /> Workflow Details</Space>}
        open={isViewDrawerVisible}
        onClose={() => setIsViewDrawerVisible(false)}
        width={500}
      >
        {editingWorkflow && (
          <div style={{ padding: '0 0 12px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 4 }}>{editingWorkflow.name}</Title>
              <Text type="secondary">{editingWorkflow.description || "No description provided"}</Text>
              <div style={{ marginTop: 12 }}>
                <Tag color="blue">Version {editingWorkflow.version}</Tag>
                <Tag color={editingWorkflow.isActive ? "green" : "red"}>{editingWorkflow.isActive ? "Active" : "Inactive"}</Tag>
              </div>
            </div>

            <Divider orientation="left" style={{ fontSize: 13, color: '#8c8c8c', margin: '32px 0 16px 0' }}>Approval Sequence</Divider>
            
            <Timeline
              mode="left"
              items={editingWorkflow.steps.map((step) => {
                const stepLabel = (step.approverType === 'ROLE' ? `Role: ${step.role?.name || 'Unknown'}` : `User: ${step.specificUser?.name || 'Unknown'}`);
                const subLabel = (step.approverType === 'SPECIFIC_USER' ? step.specificUser?.workEmail || "" : "");

                return {
                  label: `Step ${step.stepOrder}`,
                  children: (
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 14 }}>{stepLabel}</Text>
                      {subLabel && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{subLabel}</div>}
                    </div>
                  ),
                  color: '#1890ff'
                };
              })}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title={editingWorkflow ? "Edit Approval Workflow" : "Create Approval Workflow"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText={editingWorkflow ? "Update Workflow" : "Create Workflow"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ steps: [{ stepOrder: 1, approverType: 'ROLE' }] }}>
          <Form.Item name="name" label="Workflow Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Finance & HR Approval" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Describe the purpose of this workflow" rows={2} />
          </Form.Item>

          <Divider orientation="left">Approval Steps</Divider>

          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }} key={key}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ paddingTop: 8 }}>
                        <Avatar size={24} style={{ backgroundColor: '#1677ff' }}>{index + 1}</Avatar>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'approverType']}
                              label="Approver Type"
                              rules={[{ required: true }]}
                            >
                              <Select placeholder="Select type">
                                <Option value="ROLE">Role Based</Option>
                                <Option value="SPECIFIC_USER">Specific User</Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                              prevValues.steps?.[name]?.approverType !== curValues.steps?.[name]?.approverType
                            }
                          >
                            {({ getFieldValue }) => {
                              const type = getFieldValue(['steps', name, 'approverType']);
                              if (type === 'ROLE') {
                                return (
                                  <Col span={10}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'roleId']}
                                      label="Select Role"
                                      rules={[{ required: true }]}
                                    >
                                      <Select placeholder="Select role">
                                        {roles.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                );
                              }
                              if (type === 'SPECIFIC_USER') {
                                return (
                                  <Col span={10}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'specificUserId']}
                                      label="Select User"
                                      rules={[{ required: true }]}
                                    >
                                      <Select placeholder="Search user" showSearch>
                                        {users.map(u => <Option key={u.value} value={u.value}>{u.label} ({u.email})</Option>)}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                );
                              }
                              return null;
                            }}
                          </Form.Item>

                          <Col span={2} style={{ paddingTop: 32 }}>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              disabled={fields.length === 1}
                            />
                          </Col>
                        </Row>
                      </div>
                    </div>
                    <Form.Item {...restField} name={[name, 'stepOrder']} hidden initialValue={index + 1}>
                      <Input type="hidden" />
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Approval Step
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
