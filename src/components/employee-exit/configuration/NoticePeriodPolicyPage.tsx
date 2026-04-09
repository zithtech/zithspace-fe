'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  notification,
  Popconfirm,
  Tooltip,
  Drawer,
  Divider,
} from 'antd';
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Search,
  Settings2,
  Trash2,
  Edit,
} from 'lucide-react';
import { NoticePolicy, NoticePolicyService, NoticePolicyPayload } from '@/services/noticePolicyService';
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position } from '@/services/positionService';

const { Title, Text } = Typography;
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
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [notificationApi, notificationContextHolder] = notification.useNotification();

  useEffect(() => {
    fetchPolicies();
    fetchGradesAndPositions();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await NoticePolicyService.getAll();
      setPolicies(data || []);
    } catch (error: any) {
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
      process.env.NODE_ENV === 'development' && console.error('Error fetching levels:', error);
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
    setIsSaving(true);
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
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save policy';
      notificationApi.error({
        message: 'Error',
        description: errorMsg
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeneratedCode = () => {
    const name = form.getFieldValue('policy_name') || '';
    const levelId = form.getFieldValue('level_id') || '';

    if (name) {
      let code = name.toUpperCase().replace(/\s+/g, '_');
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
      render: (text: string, record: NoticePolicy) => (
        <Space size={12}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--bg-blue-50)",
            color: "var(--premium-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14
          }}>
            <Clock size={18} />
          </div>
          <div>
            <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 14 }}>{text}</Text>
            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Applicable Level',
      key: 'levelId',
      render: (record: NoticePolicy) => (
        <Space direction="vertical" size={0}>
          <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
            {record.levelType}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {getLevelName(record.levelType, record.levelId)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Notice Period',
      key: 'noticePeriodDays',
      render: (record: NoticePolicy) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "4px 8px", background: "var(--bg-green-50)", borderRadius: 6, color: "#16a34a", fontWeight: 700 }}>
            {record.noticePeriodDays} Days
          </div>
          <ArrowRight size={14} style={{ color: "var(--text-slate-400)" }} />
          <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Standard</Text>
        </div>
      ),
    },
    {
      title: 'Calculation',
      key: 'calculation',
      render: (record: NoticePolicy) => (
        <Space size={16}>
          <Tooltip title="Buyout Calculation Type">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} style={{ color: "var(--premium-blue)" }} />
              <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{record.buyoutCalculatingType}</Text>
            </div>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        <Tag
          style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          color={status ? "success" : "default"}
        >
          {status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (record: NoticePolicy) => (
        <Space size={4}>
          <Tooltip title="Edit Rules">
            <Button
              type="text"
              icon={<Edit size={18} style={{ color: 'var(--text-slate-400)' }} />}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <Popconfirm
            title="Delete this policy?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Rule">
              <Button
                type="text"
                danger
                icon={<Trash2 size={18} />}
                className="action-btn-danger"
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input
            placeholder="Search rules..."
            prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
            style={{ width: 280, borderRadius: 10, height: 40 }}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center", background: "var(--premium-blue)" }}
        >
          Add New Rule
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={policies.filter(p =>
          (p.policyName || "").toLowerCase().includes(searchText.toLowerCase()) ||
          (p.code || "").toLowerCase().includes(searchText.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, position: ["bottomRight"] }}
        size="middle"
        style={{ background: "var(--bg-pure-white)", borderRadius: 16, border: "1px solid var(--border-slate-100)", overflow: "hidden", boxShadow: "var(--shadow-premium-sm)" }}
      />

      <Drawer
        title={
          <Space size={12}>
            <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)", display: "flex" }}>
              <Settings2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                {editingPolicy ? "Edit Rule" : "Create New Rule"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>
                Configure notice periods and level mappings
              </div>
            </div>
          </Space>
        }
        width={520}
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
            <Button onClick={() => setModalVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
            <Button
              type="primary"
              loading={isSaving}
              onClick={handleSave}
              style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
            >
              {editingPolicy ? 'Update Configuration' : 'Save Configuration'}
            </Button>
          </div>
        }
        className="config-drawer"
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ background: "var(--bg-pure-white)" }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: "var(--text-slate-900)" }}>Notice Strategy</Title>
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  name="policy_name"
                  label={<Text strong style={{ fontSize: 13 }}>Policy Name</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. Executive Notice" onChange={updateGeneratedCode} />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="code"
                  label={<Text strong style={{ fontSize: 13 }}>Reference Code</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Auto-gen" disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="level_type"
                  label={<Text strong style={{ fontSize: 13 }}>Mapping Level</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    placeholder="Select level"
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
              <Col span={12}>
                <Form.Item
                  name="level_id"
                  label={<Text strong style={{ fontSize: 13 }}>Specific Entity</Text>}
                  rules={[{ required: true, message: 'Required' }]}
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
          </div>

          <Divider />

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: "var(--text-slate-900)" }}>Period Durations</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="notice_period_days"
                  label={<Text strong style={{ fontSize: 13 }}>Notice Days</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 60" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="probotion_period_days"
                  label={<Text strong style={{ fontSize: 13 }}>Probation</Text>}
                >
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="Days" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="probation_notice_days"
                  label={<Text strong style={{ fontSize: 13 }}>Prob. Notice</Text>}
                >
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="Days" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          <div style={{ background: "var(--bg-secondary)", padding: 20, borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
            <Title level={5} style={{ marginBottom: 20, fontSize: 14, color: "var(--text-slate-900)" }}>Policy Controls</Title>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Gross Buyout</Text>
                <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Calculate buyout based on Gross instead of Basic.</Text>
              </div>
              <Form.Item name="buyout_calculating_type" valuePropName="checked" noStyle>
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </div>

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Active Policy</Text>
                <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Allow this rule to be applied to new requests.</Text>
              </div>
              <Form.Item name="status" valuePropName="checked" noStyle>
                <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
              </Form.Item>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Additional Context</Text>}>
              <TextArea rows={3} placeholder="Provide details about this policy rule..." />
            </Form.Item>
          </div>
        </Form>
      </Drawer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .action-btn:hover { background: var(--bg-secondary) !important; color: var(--premium-blue) !important; }
        .action-btn-danger:hover { background: #fff1f2 !important; }
        .ant-table-thead > tr > th {
          background: var(--bg-secondary) !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
        }
        .ant-table-row:hover > td { background: var(--bg-secondary) !important; }
        .config-drawer .ant-drawer-header { border-bottom: 1px solid var(--border-slate-100) !important; padding: 24px !important; }
        .config-drawer .ant-drawer-footer { border-top: 1px solid var(--border-slate-100) !important; padding: 16px 24px !important; }
      `}} />
    </div>
  );
}
