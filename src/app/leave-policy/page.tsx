"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Settings2,
  ShieldCheck,
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  ArrowRight,
  User,
  GraduationCap,
  Building2,
  Network,
  Briefcase,
  Layers,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Zap,
  Maximize2
} from "lucide-react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Drawer,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  InputNumber,
  Divider,
  Segmented,
  Avatar,
  Collapse,
  Empty
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLeaveOrigins } from "@/hooks/useLeaveOrigins";
import { leaveOriginService } from "@/services/leaveOriginService";
import { MembersService } from "@/services/membersService";
import { useGrades } from "@/hooks/useGrades";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions } from "@/hooks/usePositions";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import { usePermission } from "@/hooks/usePermission";

const { TextArea } = Input;
const { Text, Title } = Typography;

interface PositionRecord {
  key: string;
  position: string;
  status: string;
  leaveType?: string | string[];
  leaveTypeId?: string;
  unit?: number;
  period?: string;
  carryForward?: boolean;
  totalLeaves?: number;
  subOriginId?: string;
  accrualInterval?: number;
}

const LeaveConfigListContent = ({
  fields,
  add,
  remove,
  form,
  editingKey,
  leaveTypes,
}: {
  fields: any[];
  add: () => void;
  remove: (index: number | number[]) => void;
  form: any;
  editingKey: string | null;
  leaveTypes: { label: string; value: string }[];
}) => {
  const [activeKey, setActiveKey] = useState<string | string[] | number | number[]>(fields.length > 0 ? fields[0].key : []);
  const prevFieldsLength = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevFieldsLength.current) {
      const lastField = fields[fields.length - 1];
      setActiveKey(lastField.key);
    }
    prevFieldsLength.current = fields.length;
  }, [fields.length]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text strong style={{ color: "#334155", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.025em" }}>Current Rules</Text>
        <Button
          type="link"
          icon={<Plus size={14} />}
          onClick={() => add()}
          size="small"
          style={{ padding: 0 }}
        >
          Add Rule
        </Button>
      </div>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        expandIcon={({ isActive }) => <ChevronRight size={14} style={{ transform: isActive ? "rotate(90deg)" : "rotate(0deg)", transition: "0.2s" }} />}
        style={{ background: "transparent", border: "none" }}
        items={fields.map(({ key, name, ...restField }) => {
          const leaveConfigs = form.getFieldValue("leaveConfigs") || [];
          const currentLeaveType = leaveConfigs?.[name]?.leaveType;
          const label = leaveTypes.find((t) => t.value === currentLeaveType)?.label || `Rule ${name + 1}`;

          return {
            key: key,
            label: <Text strong style={{ color: currentLeaveType ? "var(--text-slate-900)" : "var(--text-slate-400)" }}>{label}</Text>,
            extra: (
              <Popconfirm
                title="Remove this rule?"
                onConfirm={() => remove(name)}
                onCancel={(e) => e?.stopPropagation()}
              >
                <Trash2
                  size={14}
                  style={{ color: "var(--text-slate-400)", transition: "0.2s" }}
                  onMouseEnter={(e: any) => e.target.style.color = "#ef4444"}
                  onMouseLeave={(e: any) => e.target.style.color = "var(--text-slate-400)"}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            ),
            children: (
              <div style={{ padding: "0 8px" }}>
                <Form.Item name={[name, "id"]} hidden><Input /></Form.Item>
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, "leaveType"]}
                      label="Type"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Select Type" options={leaveTypes} />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "unit"]}
                      label="Unit Value"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "period"]}
                      label="Frequency"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={[
                          { label: "Every Month", value: "MONTH" },
                          { label: "Every Year", value: "YEAR" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "months"]}
                      label="Interval (Months/Years)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: "flex", flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-slate-50)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-slate-100)" }}>
                    <div>
                      <Text strong style={{ fontSize: 13, display: "block", color: "var(--text-slate-900)" }}>Rule Status</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>Enable this leave type.</Text>
                    </div>
                    <Form.Item {...restField} name={[name, "status"]} valuePropName="checked" noStyle initialValue={true}>
                      <Switch size="small" />
                    </Form.Item>
                  </div>

                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-slate-50)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-slate-100)" }}>
                    <div>
                      <Text strong style={{ fontSize: 13, display: "block", color: "var(--text-slate-900)" }}>Carry Forward</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>Allow transfer.</Text>
                    </div>
                    <Form.Item {...restField} name={[name, "carryForward"]} valuePropName="checked" noStyle>
                      <Switch size="small" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            ),
            style: {
              marginBottom: 8,
              background: "var(--bg-pure-white)",
              borderRadius: 12,
              border: "1px solid var(--border-slate-100)",
              overflow: "hidden"
            }
          };
        })}
      />
    </div>
  );
};

export default function LeavePolicyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const { 
    canReadLeavePolicy, 
    canCreateLeavePolicy,
    canUpdateLeavePolicy,
    canDeleteLeavePolicy,
    canManageLeaves 
  } = usePermission();
  const hasAccess = canManageLeaves || canReadLeavePolicy;

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard');
    }
  }, [hasAccess, router]);

  const [viewType, setViewType] = useState<string>("table");
  const [searchText, setSearchText] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<PositionRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [members, setMembers] = useState<{ value: string; label: string }[]>([]);
  const [dataSource, setDataSource] = useState<PositionRecord[]>([]);

  const { leaveOrigins, loading, refetch } = useLeaveOrigins();
  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { departments, loading: departmentsLoading } = useDepartments();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
  const { dataSource: positions, loading: positionsLoading } = usePositions();
  const { leaveTypes: apiLeaveTypes, fetchLeaveTypes } = useLeaveTypes();

  const originType = Form.useWatch("position", form);

  useEffect(() => { fetchLeaveTypes(); }, [fetchLeaveTypes]);

  const leaveTypeOptions = useMemo(() => {
    return apiLeaveTypes ? apiLeaveTypes.filter(lt => lt.isActive).map(lt => ({ label: lt.name, value: lt.id })) : [];
  }, [apiLeaveTypes]);

  useEffect(() => {
    if (leaveOrigins) {
      const formattedData: PositionRecord[] = leaveOrigins.flatMap((origin) =>
        origin.leaveTypes.map((type) => ({
          key: type.id,
          position: origin.origin,
          subOriginId: origin.subOriginId,
          status: type.status,
          leaveType: type.leaveType?.name,
          leaveTypeId: type.leaveTypeId,
          unit: Number(type.unit),
          period: type.period,
          carryForward: type.carryForward,
          totalLeaves: Number(type.unit),
          accrualInterval: type.accrualInterval,
        }))
      );
      setDataSource(formattedData);
    }
  }, [leaveOrigins]);

  useEffect(() => {
    MembersService.getMembersForSelect().then(setMembers).catch(console.error);
  }, []);

  const uniqueDataSource = useMemo(() => {
    const acc: Record<string, PositionRecord> = {};
    dataSource.forEach(item => {
      const key = `${item.position}-${item.subOriginId}`;
      if (!acc[key]) {
        acc[key] = { ...item, leaveType: item.leaveType ? [item.leaveType as string] : [] };
      } else {
        const existingTypes = acc[key].leaveType as string[];
        if (item.leaveType && !existingTypes.includes(item.leaveType as string)) {
          existingTypes.push(item.leaveType as string);
        }
      }
    });
    return Object.values(acc);
  }, [dataSource]);

  const getSubOriginLabel = (origin: string, subOriginId?: string) => {
    let label = subOriginId || "";
    if (origin === "User") label = members.find(m => String(m.value) === String(subOriginId))?.label as string || label;
    else if (origin === "Grade") label = grades.find(g => String(g.id) === String(subOriginId))?.name || label;
    else if (origin === "Department") label = departments.find(d => String(d.id) === String(subOriginId))?.name || label;
    else if (origin === "Sub-department") label = subDepartments.find(sd => String(sd.id) === String(subOriginId))?.name || label;
    else if (origin === "Position") label = positions.find(p => String(p.id) === String(subOriginId))?.title || label;
    return String(label);
  };

  const filteredDataSource = useMemo(() => {
    if (!searchText) return uniqueDataSource;
    const lowerSearch = searchText.toLowerCase();

    return uniqueDataSource.filter((item) => {
      const label = getSubOriginLabel(item.position, item.subOriginId);
      return item.position.toLowerCase().includes(lowerSearch) ||
        label.toLowerCase().includes(lowerSearch);
    });
  }, [uniqueDataSource, searchText, members, grades, departments, subDepartments, positions]);

  const columns: ColumnsType<PositionRecord> = [
    {
      title: "Origin & Category",
      dataIndex: "position",
      key: "position",
      width: "30%",
      render: (origin: string, record: PositionRecord) => {
        const label = getSubOriginLabel(origin, record.subOriginId);

        const Icon = origin === "User" ? User : origin === "Department" ? Building2 : origin === "Position" ? Briefcase : origin === "Grade" ? GraduationCap : Layers;

        return (
          <Space size={12}>
            <div style={{ background: "var(--bg-slate-50)", padding: 8, borderRadius: 10, color: "var(--text-slate-400)", display: "flex" }}>
              <Icon size={18} />
            </div>
            <div>
              <Text strong style={{ display: "block", color: "var(--text-slate-900)" }}>{label}</Text>
              <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{origin}</Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: "Allocated Policies",
      key: "policies",
      render: (_, record) => {
        const types = record.leaveType as string[];
        return (
          <Space size={4} wrap>
            {types.slice(0, 3).map((t, idx) => <Tag key={idx} color="blue" style={{ borderRadius: 6, border: 0, background: "var(--bg-blue-50)", color: "var(--premium-blue)", fontWeight: 500 }}>{t}</Tag>)}
            {types.length > 3 && <Text style={{ fontSize: 11, color: "var(--text-slate-500)" }}>+{types.length - 3} more</Text>}
          </Space>
        );
      }
    },
    {
      title: "Utilization Status",
      key: "status",
      render: (_, record) => {
        const group = dataSource.filter(i => i.position === record.position && i.subOriginId === record.subOriginId);
        const active = group.filter(i => i.status === "Active").length;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ProgressCircle percent={(active / group.length) * 100} size={16} />
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{active} Active / {group.length} Total</Text>
          </div>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button type="text" icon={<Maximize2 size={18} color="#64748b" />} onClick={() => { setCurrentRecord(record); setIsDetailVisible(true); }} className="action-btn" />
          </Tooltip>
          {(canManageLeaves || canUpdateLeavePolicy) && (
            <Tooltip title="Edit Config">
              <Button type="text" icon={<Edit2 size={18} color="#64748b" />} onClick={() => handleEdit(record)} className="action-btn" />
            </Tooltip>
          )}
          {(canManageLeaves || canDeleteLeavePolicy) && (
            <Popconfirm title="Delete configuration?" onConfirm={() => handleDeleteOrigin(record)} okButtonProps={{ danger: true }}>
              <Button type="text" danger icon={<Trash2 size={18} />} className="action-btn-danger" />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const handleEdit = (record: PositionRecord) => {
    const configs = dataSource.filter(i => i.position === record.position && i.subOriginId === record.subOriginId);
    setEditingKey(record.key);
    form.setFieldsValue({
      position: record.position,
      subOriginId: record.subOriginId,
      leaveConfigs: configs.map(c => ({
        id: c.key,
        leaveType: c.leaveTypeId,
        unit: c.unit,
        months: c.accrualInterval,
        period: c.period,
        carryForward: c.carryForward,
        status: c.status === "Active",
      }))
    });
    setIsDrawerVisible(true);
  };

  const handleDeleteOrigin = async (record: PositionRecord) => {
    const originToDelete = leaveOrigins.find(o => o.origin === record.position && o.subOriginId === record.subOriginId);
    if (!originToDelete) return;
    setDeletingKey(`${record.position}-${record.subOriginId}`);
    try {
      await leaveOriginService.deleteStructure(originToDelete.id);
      api.success({ message: "Configuration Removed", placement: "topRight" });
      refetch();
    } catch {
      api.error({ message: "Action Failed", placement: "topRight" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSave = async (values: any) => {
    const { position, subOriginId, leaveConfigs } = values;
    setIsSaving(true);
    try {
      let structure = leaveOrigins.find(o => o.origin === position && o.subOriginId === subOriginId);
      const payload = {
        leaveTypes: leaveConfigs.map((c: any) => ({
          id: c.id,
          leaveTypeId: c.leaveType,
          unit: c.unit,
          period: c.period,
          accrualInterval: Number(c.months),
          carryForward: c.carryForward ?? false,
          status: c.status ? "Active" : "Inactive",
        }))
      };
      if (!structure) {
        await leaveOriginService.createStructure({ origin: position, subOriginId, ...payload });
      } else {
        await leaveOriginService.updateStructure(structure.id, payload);
      }
      api.success({ message: "Policy Configured", placement: "topRight" });
      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
      refetch();
    } catch {
      api.error({ message: "Sync Error", placement: "topRight" });
    } finally {
      setIsSaving(false);
    }
  };

  const ProgressCircle = ({ percent, size }: { percent: number; size: number }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `conic-gradient(#22c55e ${percent}%, #e2e8f0 0)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ width: size - 4, height: size - 4, borderRadius: "50%", background: "var(--bg-pure-white)" }} />
    </div>
  );

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ color, background: `${color}12`, padding: 12, borderRadius: 12 }}><Icon size={24} /></div>
      </div>
    </Card>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "var(--bg-secondary)", minHeight: "calc(100vh - 64px)" }}>
          {contextHolder}

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Space size={14} align="center">
                <div style={{ background: "var(--bg-blue-50)", padding: 12, borderRadius: 14, color: "var(--premium-blue)", display: "flex" }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Leave Policies</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Map leave rules to organizational structures like Departments, Grades, or Roles.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                placeholder="Search origins..."
                prefix={<Search size={16} color="var(--text-slate-400)" />}
                style={{ width: 280, borderRadius: 12, height: 44, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)", color: "var(--text-slate-900)" }}
                onChange={e => setSearchText(e.target.value)}
              />
              <div style={{ background: "var(--bg-slate-100)", padding: "4px", borderRadius: 12, display: "flex", alignItems: "center", height: 44, border: "1px solid var(--border-slate-200)" }}>
                <Segmented
                  options={[
                    { label: <div style={{ display: "flex", alignItems: "center", height: 36, padding: "0 10px", color: "var(--text-slate-900)" }}><LayoutList size={14} /></div>, value: "table" },
                    { label: <div style={{ display: "flex", alignItems: "center", height: 36, padding: "0 10px", color: "var(--text-slate-900)" }}><LayoutGrid size={14} /></div>, value: "card" }
                  ]}
                  value={viewType}
                  onChange={v => setViewType(v as string)}
                  style={{ background: "transparent", border: "none" }}
                />
              </div>
              {(canManageLeaves || canCreateLeavePolicy) && (
                <Button
                  type="primary"
                  size="large"
                  icon={<Plus size={18} />}
                  style={{ borderRadius: 12, height: 44, padding: "0 24px", fontWeight: 600, background: "var(--premium-blue)" }}
                  onClick={() => { setEditingKey(null); form.resetFields(); setIsDrawerVisible(true); }}
                >
                  Add Mapping
                </Button>
              )}
            </div>
          </div>

          {/* Metrics */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}><StatCard label="Total Configurations" value={uniqueDataSource.length} icon={Layers} color="#3b82f6" /></Col>
            <Col xs={24} sm={8}><StatCard label="Active Mappings" value={dataSource.filter(i => i.status === "Active").length} icon={CheckCircle2} color="#10b981" /></Col>
            <Col xs={24} sm={8}><StatCard label="Policy Conflicts" value={0} icon={AlertCircle} color="#f59e0b" /></Col>
          </Row>

          {/* Content */}
          {uniqueDataSource.length === 0 ? <Empty style={{ marginTop: 100 }} description="No leave policies configured yet." /> : (
            viewType === "table" ? (
              <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 20, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", overflow: "hidden", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" }}>
                <Table
                  columns={columns}
                  dataSource={uniqueDataSource.filter(i => i.position.toLowerCase().includes(searchText.toLowerCase()))}
                  loading={loading}
                  pagination={{ pageSize: 12, position: ["bottomRight"] }}
                />
              </Card>
            ) : (
              <Row gutter={[24, 24]}>
                {filteredDataSource.map((item, idx) => (
                  <Col xs={24} sm={12} lg={8} key={idx}>
                    <Card
                      hoverable
                      className="policy-card"
                      bodyStyle={{ padding: 24 }}
                      style={{ borderRadius: 20, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                        <div style={{ background: "var(--bg-slate-50)", padding: 10, borderRadius: 12, color: "var(--text-slate-400)" }}>
                          {item.position === "User" ? <User size={20} /> : item.position === "Department" ? <Building2 size={20} /> : <Briefcase size={20} />}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {(canManageLeaves || canUpdateLeavePolicy) && (
                            <Button type="text" icon={<Edit2 size={16} />} onClick={() => handleEdit(item)} className="small-action-btn" />
                          )}
                          <Button type="text" onClick={() => { setCurrentRecord(item); setIsDetailVisible(true); }} icon={<Maximize2 size={16} />} className="small-action-btn" />
                        </div>
                      </div>
                      <Title level={5} style={{ margin: "0 0 4px 0", color: "var(--text-slate-900)" }}>
                        {item.position === "User" ? members.find(m => m.value === item.subOriginId)?.label : item.subOriginId}
                      </Title>
                      <Text style={{ fontSize: 13, display: "block", marginBottom: 16, color: "var(--text-slate-500)" }}>{item.position} Configuration</Text>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                        {(item.leaveType as string[]).map((t, i) => <Tag key={i} style={{ borderRadius: 6, margin: 0, background: "var(--bg-slate-50)", border: 0, color: "var(--text-slate-500)" }}>{t}</Tag>)}
                      </div>

                      <div style={{ background: "var(--bg-slate-50)", padding: "12px 16px", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 12, fontWeight: 500, color: "var(--text-slate-500)" }}>Utilization Balance</Text>
                        <Tag color="success" style={{ borderRadius: 8, margin: 0, fontWeight: 700 }}>ACTIVE</Tag>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )
          )}
        </div>

        {/* Configuration Drawer */}
        <Drawer
          title={<div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)" }}><Settings2 size={20} /></div><div><Text strong style={{ fontSize: 18, color: "var(--text-slate-900)", display: "block" }}>{editingKey ? "Edit Configuration" : "New Policy Mapping"}</Text><Text style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>{editingKey ? "Modify existing leave allocation rules" : "Assign leave rules to a new team or role"}</Text></div></div>}
          width={520}
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
          bodyStyle={{ background: "var(--bg-pure-white)" }}
          footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
          footer={<div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}><Button onClick={() => setIsDrawerVisible(false)} style={{ borderRadius: 10, height: 40 }}>Cancel</Button><Button type="primary" loading={isSaving} onClick={() => form.submit()} style={{ borderRadius: 10, height: 40, padding: "0 24px", fontWeight: 600 }}>Save Changes</Button></div>}
          className="policy-drawer"
        >
          <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, color: "var(--text-slate-700)" }}>Target Identity</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="position" label={<Text strong style={{ fontSize: 13 }}>Origin Type</Text>} rules={[{ required: true }]}>
                    <Select disabled={!!editingKey} options={["Grade", "Department", "Sub-department", "Position", "User"].map(v => ({ label: v, value: v }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="subOriginId" label={<Text strong style={{ fontSize: 13 }}>Specific Selection</Text>} rules={[{ required: true }]}>
                    <Select
                      disabled={!originType || !!editingKey}
                      options={
                        originType === "User"
                          ? members
                          : originType === "Grade"
                            ? grades.map((g: any) => ({ label: g.name, value: g.id }))
                            : originType === "Department"
                              ? departments.map((d: any) => ({ label: d.name, value: d.id }))
                              : originType === "Sub-department"
                                ? subDepartments.map((sd: any) => ({ label: sd.name, value: sd.id }))
                                : originType === "Position"
                                  ? positions.map((p: any) => ({ label: p.title, value: p.id }))
                                  : []
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            <Form.List name="leaveConfigs">
              {(fields, { add, remove }) => <LeaveConfigListContent fields={fields} add={add} remove={remove} form={form} editingKey={editingKey} leaveTypes={leaveTypeOptions} />}
            </Form.List>
          </Form>
        </Drawer>

        {/* View Detail Drawer */}
        <Drawer
          title="Policy Breakdown"
          width={800}
          open={isDetailVisible}
          onClose={() => setIsDetailVisible(false)}
          headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
          bodyStyle={{ padding: 0, background: "var(--bg-pure-white)" }}
        >
          <div style={{ padding: 24, background: "var(--bg-slate-50)", borderBottom: "1px solid var(--border-slate-100)" }}>
            <Title level={4} style={{ margin: 0, color: "var(--text-slate-900)" }}>Allocation Overview</Title>
            <Text style={{ color: "var(--text-slate-500)" }}>Detailed rules for {currentRecord?.subOriginId}</Text>
          </div>
          <Table
            pagination={false}
            columns={[
              { title: "LEAVE TYPE", dataIndex: "leaveType", key: "leaveType", render: t => <Text strong color="#1e293b">{t}</Text> },
              { title: "UNIT", dataIndex: "unit", key: "unit", align: "center", render: u => <Tag color="blue" style={{ borderRadius: 6 }}>{u} Units</Tag> },
              { title: "EVERY", dataIndex: "accrualInterval", render: m => <Text>{m} Months</Text> },
              { title: "CARRY FORWARD", dataIndex: "carryForward", render: c => c ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#94a3b8" /> },
              { title: "STATUS", dataIndex: "status", render: s => <Tag color={s === "Active" ? "green" : "red"}>{s}</Tag> }
            ]}
            dataSource={dataSource.filter(i => i.position === currentRecord?.position && i.subOriginId === currentRecord?.subOriginId)}
          />
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
          .action-btn:hover { background: var(--bg-slate-50) !important; border-radius: 8px; color: var(--premium-blue) !important; }
          .action-btn-danger:hover { background: #fee2e2 !important; border-radius: 8px; }
          .small-action-btn { background: var(--bg-pure-white) !important; color: var(--text-slate-400) !important; border: 1px solid var(--border-slate-100) !important; border-radius: 10px !important; width: 32px !important; height: 32px !important; display: flex !important; align-items: center; justify-content: center; }
          .small-action-btn:hover { color: var(--premium-blue) !important; border-color: var(--premium-blue) !important; }
          .policy-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .policy-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1) !important; border-color: var(--border-slate-200) !important; }
          .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; color: var(--text-slate-500) !important; font-size: 11px !important; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-slate-100) !important; }
          .ant-table-tbody > tr > td { color: var(--text-slate-900) !important; border-bottom: 1px solid var(--border-slate-100) !important; }
          .policy-drawer .ant-drawer-header { padding: 24px !important; border-bottom: 1px solid var(--border-slate-100) !important; }
          .policy-drawer .ant-drawer-footer { padding: 16px 24px !important; border-top: 1px solid var(--border-slate-100) !important; }
          .ant-pagination-item a { color: var(--text-slate-500) !important; }
          .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
