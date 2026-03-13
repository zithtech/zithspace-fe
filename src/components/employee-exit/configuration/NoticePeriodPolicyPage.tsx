'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  message,
  notification,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { NoticePolicy, NoticePolicyService, NoticePolicyPayload } from '@/services/noticePolicyService';
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position } from '@/services/positionService';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function NoticePeriodPolicyPage() {
  const [form] = Form.useForm();
  const [policies, setPolicies] = useState<NoticePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<NoticePolicy | null>(null);
  const [grades, setGrades] = useState<GradeAPIResponse[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [levelOptions, setLevelOptions] = useState<{ label: string; value: string }[]>([]);
  const [levelType, setLevelType] = useState<string>('');

  const [notificationApi, notificationContextHolder] = notification.useNotification();

  useEffect(() => {
    fetchPolicies();
    fetchGradesAndPositions();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      console.log('Fetching policies...');
      const data = await NoticePolicyService.getAll();
      console.log('Fetched policies:', data);
      setPolicies(data || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      notificationApi.error({
        message: 'Error',
        description: 'Failed to fetch policies: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGradesAndPositions = async () => {
    try {
      const [gradesData, positionsData] = await Promise.all([
        GradeService.getAllGrades(),
        PositionService.getAll(),
      ]);
      setGrades(gradesData || []);
      setPositions(positionsData || []);
    } catch (error: any) {
      console.error('Error fetching levels:', error);
    }
  };

  useEffect(() => {
    if (levelType === 'Grades') {
      setLevelOptions(grades.map(g => ({ label: g.name, value: g.id })));
    } else if (levelType === 'Positions') {
      setLevelOptions(positions.map(p => ({ label: p.title, value: p.id })));
    } else {
      setLevelOptions([]);
    }
  }, [levelType, grades, positions]);

  const handleAdd = () => {
    setEditingPolicy(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setModalVisible(true);
    setLevelType('');
  };

  const handleEdit = (record: NoticePolicy) => {
    setEditingPolicy(record);
    setLevelType(record.levelType);
    form.setFieldsValue({
      policy_name: record.policyName,
      code: record.code,
      description: record.description,
      level_type: record.levelType,
      level_id: record.levelId,
      notice_period_days: record.noticePeriodDays,
      probotion_period_days: record.probationPeriodDays,
      probation_notice_days: record.probationNoticeDays,
      buyout_calculating_type: record.buyoutCalculatingType === 'Gross',
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await NoticePolicyService.delete(id);
      notificationApi.success({
        message: 'Success',
        description: 'Policy deleted successfully'
      });
      fetchPolicies();
    } catch (error: any) {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to delete policy: ' + error.message
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: NoticePolicyPayload = {
        policy_name: values.policy_name,
        code: values.code,
        description: values.description,
        level_type: values.level_type,
        level_id: values.level_id,
        notice_period_days: values.notice_period_days,
        probotion_period_days: values.probotion_period_days,
        probation_notice_days: values.probation_notice_days,
        buyout_calculating_type: values.buyout_calculating_type ? 'Gross' : 'Basic',
        status: values.status,
      };

      if (editingPolicy) {
        await NoticePolicyService.update(editingPolicy.id, payload);
        notificationApi.success({
          message: 'Success',
          description: 'Policy updated successfully'
        });
      } else {
        await NoticePolicyService.create(payload);
        notificationApi.success({
          message: 'Success',
          description: 'Policy created successfully'
        });
      }
      setModalVisible(false);
      fetchPolicies();
    } catch (error: any) {
      // Use the message from the server if available
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save policy';
      notificationApi.error({
        message: 'Error',
        description: errorMsg
      });
    }
  };

  const updateGeneratedCode = () => {
    const name = form.getFieldValue('policy_name') || '';
    const levelId = form.getFieldValue('level_id') || '';
    
    if (name) {
      let code = name.toUpperCase().replace(/\s+/g, '_');
      // If we have a level id, append a suffix to ensure uniqueness per level
      if (levelId) {
        const shortId = levelId.toString().slice(-4).toUpperCase();
        code = `${code}_${shortId}`;
      }
      form.setFieldsValue({ code });
    }
  };

  const getLevelName = (levelType: string, levelId: string) => {
    if (levelType === 'Grades') {
      return grades.find(g => g.id === levelId)?.name || levelId;
    }
    if (levelType === 'Positions') {
      return positions.find(p => p.id === levelId)?.title || levelId;
    }
    return levelId;
  };

  const columns = [
    {
      title: 'Policy Name',
      dataIndex: 'policyName',
      key: 'policyName',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Level Values',
      key: 'levelId',
      render: (record: NoticePolicy) => getLevelName(record.levelType, record.levelId),
    },
    {
      title: 'Notice Period Days',
      dataIndex: 'noticePeriodDays',
      key: 'noticePeriodDays',
    },
    {
      title: 'Probation Notice Days',
      dataIndex: 'probationNoticeDays',
      key: 'probationNoticeDays',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: NoticePolicy) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this policy?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px 0' }}>
      {notificationContextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>Notice Period Policy</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add New Rule
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={policies}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      <Modal
        title={editingPolicy ? 'Edit Policy' : 'Add Policy'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={800}
        okText={editingPolicy ? 'Update' : 'Save'}
      >
        <div style={{ marginBottom: 20 }}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            This form is used to create a Notice Period Policy that defines notice period rules for employees based on their level (Grade or Position).
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="policy_name"
                label="Policy Name"
                rules={[{ required: true, message: 'Please enter policy name' }]}
              >
                <Input placeholder="Enter policy name" onChange={updateGeneratedCode} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Please enter code' }]}
              >
                <Input placeholder="Auto-generated code" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="level_type"
                label="Level Type"
                rules={[{ required: true, message: 'Please select level type' }]}
              >
                <Select
                  placeholder="Select level type"
                  onChange={(val) => {
                    setLevelType(val);
                    form.setFieldsValue({ level_id: undefined });
                    updateGeneratedCode();
                  }}
                >
                  <Select.Option value="Grades">Grades</Select.Option>
                  <Select.Option value="Positions">Positions</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="level_id"
                label="Level Values"
                rules={[{ required: true, message: 'Please select level value' }]}
              >
                <Select
                  placeholder="Select value"
                  showSearch
                  optionFilterProp="children"
                  options={levelOptions}
                  disabled={!levelType}
                  onChange={updateGeneratedCode}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="notice_period_days"
                label="Notice Period Days"
                rules={[{ required: true, message: 'Please enter days' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter days" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="probotion_period_days"
                label="Probation Period Days"
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter days" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="probation_notice_days"
                label="Probation Notice Days"
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter days" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="buyout_calculating_type"
                label="Buyout Type"
                valuePropName="checked"
              >
                <Switch checkedChildren="Gross" unCheckedChildren="Basic" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="status"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea rows={3} placeholder="Enter description (optional)" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
