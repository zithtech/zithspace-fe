
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
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
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  Row,
  Col,
  InputNumber,
  Collapse,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
  UserOutlined,
  ReloadOutlined,
  CloseOutlined,
  InfoCircleOutlined 
} from "@ant-design/icons";
import { 
  ShieldCheck, 
  Settings, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Search, 
  Plus, 
  RefreshCw, 
  Users, 
  ClipboardList,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  User,
  Activity,
  FileBadge
} from "lucide-react";
import { useGrades } from "@/hooks/useGrades";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions } from "@/hooks/usePositions";
import { MembersService } from "@/services/membersService";
import { ReimbursementSettingsService } from "@/services/reimbursementsettingsService";
import {
  useReimbursementConfigurations,
  useCreateReimbursementConfiguration,
  useUpdateReimbursementConfiguration,
  useDeleteReimbursementConfiguration,
} from "@/hooks/usereimbursementconfig";

const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
  <Card 
    bodyStyle={{ padding: "16px 20px" }} 
    style={{ 
      borderRadius: 12, 
      border: "1px solid #f1f5f9", 
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
        {subValue && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{subValue}</div>}
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);
const { Option } = Select;

interface ReimbursementRecord {
  key: string;
  id: string;
  origin: string;
  subOrigin: string;
  subOriginId: string;
  categoryType: string;
  amount: number;
  period: "MONTH" | "YEAR";
  status: string;
  monthlyAmount?: number;
  yearlyAmount?: number;
  policyId?: string;
  ruleId?: string;
  approvers?: any[];
}

interface SubOriginOption {
  id: string;
  name: string;
  originType: string;
}

interface ApproverRow {
  level: number;
  positionId: string;
  employeeId?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  code: string;
}

const compactSwitchCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 8px",
  border: "1px solid #f0f0f0",
  borderRadius: 6,
  marginBottom: 8,
  background: "#fafafa",
};

const switchTitle = {
  fontSize: 13,
  fontWeight: 500,
};

const switchDesc = {
  fontSize: 11,
  color: "#8c8c8c",
  marginTop: 1,
};

const calculateAmounts = (amount: any, period: "MONTH" | "YEAR") => {
  const numAmount = Number(amount) || 0;
  if (period === "MONTH") {
    return {
      monthly: numAmount,
      yearly: numAmount * 12,
    };
  } else {
    return {
      monthly: numAmount / 12,
      yearly: numAmount,
    };
  }
};
const CompactApprovalLevelsContent = ({
  value = [],
  onChange,
  positions,
  positionsLoading,
  onEmployeesFetched,
}: {
  value?: ApproverRow[];
  onChange?: (value: ApproverRow[]) => void;
  positions: any[];
  positionsLoading: boolean;
  onEmployeesFetched?: (positionId: string, employees: any[]) => void;
}) => {
  const [employeesByPosition, setEmployeesByPosition] = useState<Record<string, any[]>>({});
  const [loadingEmployees, setLoadingEmployees] = useState<Record<string, boolean>>({});

  const fetchEmployeesForPosition = async (positionId: string, rowIndex: number) => {
    if (!positionId) return;
    
    try {
      setLoadingEmployees(prev => ({ ...prev, [rowIndex]: true }));
      
      console.log("========== EMPLOYEE FETCH START ==========");
      console.log("🔍 Position ID received:", positionId);
      
      const selectedPosition = positions.find(p => p.id === positionId);
      const positionName = selectedPosition?.title;
      console.log("🔍 Position name:", positionName);
      
      if (!positionName) {
        console.log("❌ Position name not found");
        return;
      }
      
      const members = await MembersService.getMembersForSelect({ 
        position: positionName
      });
      
      console.log("🔍 Members received:", members);
      
      setEmployeesByPosition(prev => ({ 
        ...prev, 
        [positionId]: members 
      }));

      // Call the callback to update parent component
      if (onEmployeesFetched) {
        onEmployeesFetched(positionId, members);
      }
      
    } catch (error) {
      console.error("❌ ERROR:", error);
    } finally {
      setLoadingEmployees(prev => ({ ...prev, [rowIndex]: false }));
    }
  };

  useEffect(() => {
    console.log("📊 employeesByPosition state updated:", employeesByPosition);
    
    Object.keys(employeesByPosition).forEach(positionId => {
      const employees = employeesByPosition[positionId];
      console.log(`📊 Position ${positionId}: ${employees?.length || 0} employees`);
    });
  }, [employeesByPosition]);

  const addApproverRow = () => {
    const newRow: ApproverRow = {
      level: (value?.length || 0) + 1,
      positionId: '',
      employeeId: null,
    };
    onChange?.([...(value || []), newRow]);
  };

  const removeApproverRow = (index: number) => {
    const newRows = [...(value || [])];
    newRows.splice(index, 1);
    const reorderedRows = newRows.map((row, idx) => ({
      ...row,
      level: idx + 1,
    }));
    onChange?.(reorderedRows);
  };

  const updateApproverRow = (index: number, field: keyof ApproverRow, fieldValue: any) => {
    const newRows = [...(value || [])];
    newRows[index] = { ...newRows[index], [field]: fieldValue };
    
    if (field === 'positionId') {
      newRows[index].employeeId = null;
      fetchEmployeesForPosition(fieldValue, index);
    }
    
    onChange?.(newRows);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px', 
        background: '#eff6ff', 
        border: '1px solid #dbeafe',
        borderRadius: 12,
        fontSize: 13,
        color: '#1e40af',
        display: "flex",
        alignItems: "flex-start",
        gap: 10
      }}>
        <InfoCircleOutlined style={{ color: '#3b82f6', marginTop: 3 }} />
        <div>
          <Text strong style={{ color: '#1e40af' }}>Level 1 Approval:</Text>
          <div style={{ fontSize: 12, color: '#60a5fa' }}>Automatically assigned to the employee's reporting manager.</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space size={8}>
          <div style={{ background: "#f8fafc", padding: 6, borderRadius: 8, color: "#64748b" }}>
            <ClipboardList size={16} />
          </div>
          <Text strong style={{ fontSize: 13 }}>Approval Workflow</Text>
        </Space>
        <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{value?.length || 0} LEVELS</Tag>
      </div>
      
      {(value || []).map((row, index) => {
        const isLevelOne = row.level === 1;
        
        return (
          <div 
            key={index}
            style={{ 
              marginBottom: 12, 
              background: isLevelOne ? '#f8fafc' : '#ffffff',
              border: '1px solid #f1f5f9',
              borderRadius: 12,
              padding: '12px',
              position: "relative",
              boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
            }}
          >
            <Row gutter={12} align="middle">
              <Col span={3}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2 }}>LVL</div>
                  <Text strong style={{ fontSize: 16, color: isLevelOne ? "#94a3b8" : "#2563eb" }}>{row.level}</Text>
                </div>
              </Col>
              
              <Col span={9}>
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Position</span>} style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Select Position"
                    value={row.positionId}
                    disabled={isLevelOne}
                    onChange={(val) => updateApproverRow(index, 'positionId', val)}
                    style={{ width: '100%', height: 36 }}
                    loading={positionsLoading}
                    showSearch
                    optionFilterProp="label"
                    options={positions.map(pos => ({
                      label: pos.title,
                      value: pos.id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col span={9}>
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Employee</span>} style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Select Employee"
                    value={row.employeeId}
                    disabled={isLevelOne || !row.positionId}
                    onChange={(val) => updateApproverRow(index, 'employeeId', val)}
                    style={{ width: '100%', height: 36 }}
                    showSearch
                    loading={loadingEmployees[index]}
                    allowClear
                    optionFilterProp="label"
                    options={employeesByPosition[row.positionId] || []}
                  />
                </Form.Item>
              </Col>

              <Col span={3} style={{ textAlign: 'right', paddingTop: 20 }}>
                <Popconfirm
                  title="Remove Level"
                  description="Remove this approval level?"
                  onConfirm={() => removeApproverRow(index)}
                  disabled={isLevelOne}
                >
                  <Button 
                    type="text" 
                    danger 
                    size="small"
                    icon={<Trash2 size={16} />}
                    disabled={isLevelOne}
                    style={{ borderRadius: 6 }}
                  />
                </Popconfirm>
              </Col>
            </Row>
          </div>
        );
      })}

      <Button 
        type="dashed" 
        block 
        onClick={addApproverRow}
        icon={<Plus size={14} />}
        style={{ borderRadius: 8, height: 36, marginTop: 8, borderStyle: "dashed", color: "#2563eb" }}
      >
        Add Approval Level
      </Button>
    </div>
  );
};
const CompactCategoryConfigListContent = ({
  fields,
  add,
  remove,
  categoryConfigs,
  editingKey,
  categoryOptions,
  categoryApproversMap,
  onCategoryApproversChange,
  positions,
  positionsLoading,
  onEmployeesFetched,
}: {
  fields: any[];
  add: () => void;
  remove: (index: number | number[]) => void;
  categoryConfigs: any[];
  editingKey: string | null;
  categoryOptions: CategoryOption[];
  categoryApproversMap: Record<number, ApproverRow[]>;
  onCategoryApproversChange: (index: number, approvers: ApproverRow[]) => void;
  positions: any[];
  positionsLoading: boolean;
  onEmployeesFetched?: (positionId: string, employees: any[]) => void;
}) => {
  const [activeKey, setActiveKey] = useState<
    string | string[] | number | number[]
  >(fields.length > 0 ? fields[0].key : []);
  
  const prevFieldsLength = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevFieldsLength.current) {
      const lastField = fields[fields.length - 1];
      setActiveKey(lastField.key);
      
      const newIndex = fields.length - 1;
      const defaultApprovers = [{ level: 1, positionId: '', employeeId: null }];
      
      onCategoryApproversChange(newIndex, defaultApprovers);
    }
    prevFieldsLength.current = fields.length;
  }, [fields.length, onCategoryApproversChange]);

  const getSelectedCategoryNames = (currentIndex: number) => {
    return (categoryConfigs || [])
      .filter((_: any, index: number) => index !== currentIndex)
      .map((item: any) => item?.categoryType)
      .filter(Boolean);
  };

  const getCurrentApprovers = (index: number) => {
    return categoryApproversMap[index] || [{ level: 1, positionId: '', employeeId: null }];
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        items={fields.map(({ key, name, ...restField }, index) => {
          const selectedCategoryNames = getSelectedCategoryNames(name);
          const currentCategoryType = categoryConfigs?.[name]?.categoryType;
          const currentAmount = categoryConfigs?.[name]?.amount;
          const currentPeriod = categoryConfigs?.[name]?.period;
          const currentApprovers = getCurrentApprovers(index);
          const isActive = categoryConfigs?.[name]?.status !== false;

          const previewAmounts =
            currentAmount && currentPeriod
              ? calculateAmounts(currentAmount, currentPeriod)
              : null;

          const filteredCategoryOptions = categoryOptions.filter(
            option => !selectedCategoryNames.includes(option.name)
          );

          return {
            key: key,
            label: (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 8 }}>
                <Space size={12}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    background: "#f8fafc", 
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Layers size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{currentCategoryType || 'Untitled Category'}</Text>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{currentApprovers.length} Levels Defined</div>
                  </div>
                </Space>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {previewAmounts && (
                    <Tag color="green" style={{ border: 0, borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                      ₹{previewAmounts.monthly}/MO
                    </Tag>
                  )}
                  {!isActive && <Tag color="error" style={{ borderRadius: 6, border: 0, fontSize: 10, fontWeight: 700 }}>INACTIVE</Tag>}
                </div>
              </div>
            ),
            extra:
              fields.length > 1 ? (
                <Popconfirm
                  title="Remove set"
                  description="Remove this category config?"
                  onConfirm={(e) => { e?.stopPropagation(); remove(name); }}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <Button 
                    type="text" 
                    danger 
                    size="small"
                    icon={<Trash2 size={16} />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderRadius: 6 }}
                  />
                </Popconfirm>
              ) : null,
            children: (
              <div style={{ padding: '8px 0' }}>
                <Form.Item name={[name, "id"]} hidden><Input /></Form.Item>
                <Form.Item name={[name, "policyId"]} hidden><Input /></Form.Item>
                <Form.Item name={[name, "ruleId"]} hidden><Input /></Form.Item>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      {...restField}
                      name={[name, "categoryType"]}
                      label={<Text strong style={{ fontSize: 12 }}>Category Type</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select
                        placeholder="Select"
                        style={{ height: 40 }}
                        showSearch
                        optionFilterProp="label"
                        options={filteredCategoryOptions.map(opt => ({
                          label: opt.name,
                          value: opt.name
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "amount"]}
                      label={<Text strong style={{ fontSize: 12 }}>Amount</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        style={{ width: "100%", height: 36 }}
                        placeholder="0.00"
                        prefix="₹"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "period"]}
                      label={<Text strong style={{ fontSize: 12 }}>Period</Text>}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Select placeholder="Period" style={{ height: 36 }}>
                        <Option value="MONTH">Month</Option>
                        <Option value="YEAR">Year</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #f1f5f9", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <Text strong style={{ fontSize: 13 }}>Active</Text>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Enable this category</div>
                    </div>
                    <Form.Item
                      {...restField}
                      name={[name, "status"]}
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Switch size="small" />
                    </Form.Item>
                  </div>
                </div>

                <Divider style={{ margin: '20px 0 16px 0' }} />

                <CompactApprovalLevelsContent 
                  value={currentApprovers}
                  onChange={(newApprovers) => onCategoryApproversChange(index, newApprovers)}
                  positions={positions}
                  positionsLoading={positionsLoading}
                  onEmployeesFetched={onEmployeesFetched}
                />
              </div>
            ),
          };
        })}
      />

      <Button 
        type="dashed" 
        block 
        onClick={() => add()} 
        style={{ borderRadius: 10, height: 40, marginTop: 12, borderStyle: "dashed", color: "#2563eb", fontWeight: 600 }}
        icon={<Plus size={16} />}
      >
        Add Another Category Config
      </Button>
    </div>
  );
};

export default function ReimbursementConfigurationPage() {
  const { user } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const originType = Form.useWatch("origin", form);
  const subOriginId = Form.useWatch("subOriginId", form);
  const categoryConfigs = Form.useWatch("categoryConfigs", form);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [members, setMembers] = useState<SubOriginOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [globalEmployeesByPosition, setGlobalEmployeesByPosition] = useState<Record<string, any[]>>({});
  
  const [categoryApproversMap, setCategoryApproversMap] = useState<Record<number, ApproverRow[]>>({});

  const { data: configs, isLoading, refetch } = useReimbursementConfigurations();
  const createConfig = useCreateReimbursementConfiguration();
  const updateConfig = useUpdateReimbursementConfiguration();
  const deleteConfig = useDeleteReimbursementConfiguration();

  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { departments, loading: departmentsLoading } = useDepartments();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  useEffect(() => {
    const fetchCategoryOptions = async () => {
      try {
        const settings = await ReimbursementSettingsService.getSettings();
        const activeSettings = settings.filter((s) => s.isActive);
        const options = activeSettings.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }));
        setCategoryOptions(options);
      } catch (error) {
        console.error("Failed to fetch category options:", error);
      }
    };

    fetchCategoryOptions();
  }, []);

  useEffect(() => {
    const fetchMembersForSelect = async () => {
      try {
        const memberData = await MembersService.getMembersForSelect();
        const formattedMembers = memberData.map((m: any) => ({
          id: m.value,
          name: m.label,
          originType: "User",
        }));
        setMembers(formattedMembers);
      } catch (error) {
        console.error("Failed to fetch members for select:", error);
      }
    };
    fetchMembersForSelect();
  }, []);

  const membersMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.id] = member.name;
      return acc;
    }, {} as Record<string, string>);
  }, [members]);

  const gradesMap = useMemo(() => {
    return grades.reduce((acc, grade) => {
      acc[grade.id] = grade.name;
      return acc;
    }, {} as Record<string, string>);
  }, [grades]);

  const departmentsMap = useMemo(() => {
    return departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {} as Record<string, string>);
  }, [departments]);

  const subDepartmentsMap = useMemo(() => {
    return subDepartments.reduce((acc, subDept) => {
      acc[subDept.id] = subDept.name;
      return acc;
    }, {} as Record<string, string>);
  }, [subDepartments]);

  const positionsMap = useMemo(() => {
    return positions.reduce((acc, pos) => {
      acc[pos.id] = pos.title;
      return acc;
    }, {} as Record<string, string>);
  }, [positions]);

  const getSubOriginLabel = (origin: string, subOriginId: string) => {
    if (origin === "User") return membersMap[subOriginId] || subOriginId;
    if (origin === "Grade") return gradesMap[subOriginId] || subOriginId;
    if (origin === "Department") return departmentsMap[subOriginId] || subOriginId;
    if (origin === "Sub-department") return subDepartmentsMap[subOriginId] || subOriginId;
    if (origin === "Position") return positionsMap[subOriginId] || subOriginId;
    return subOriginId;
  };

  const dataSource: ReimbursementRecord[] = useMemo(() => {
    if (!configs) return [];
    return configs.map((config) => {
      const subOriginLabel = getSubOriginLabel(config.origin, config.subOrigin);
      const amount = Number(config.amount) || 0;
      
      return {
        key: config.id,
        id: config.id,
        origin: config.origin,
        subOrigin: subOriginLabel,
        subOriginId: config.subOrigin,
        categoryType: config.categoryType,
        amount: amount,
        period: config.period,
        status: config.status,
        monthlyAmount: config.monthlyAmount ? Number(config.monthlyAmount) : undefined,
        yearlyAmount: config.yearlyAmount ? Number(config.yearlyAmount) : undefined,
        policyId: config.policyId,
        ruleId: config.ruleId,
        approvers: config.approvers,
      };
    });
  }, [configs, getSubOriginLabel]);

  const getSubOriginOptions = () => {
    if (!originType) return [];
    switch (originType) {
      case "User": return members.map((m) => ({ label: m.name, value: m.id }));
      case "Grade": return grades.map((g) => ({ label: g.name, value: g.id }));
      case "Department": return departments.map((d) => ({ label: d.name, value: d.id }));
      case "Sub-department": return subDepartments.map((sd) => ({ label: sd.name, value: sd.id }));
      case "Position": return positions.map((p) => ({ label: p.title, value: p.id }));
      default: return [];
    }
  };

  const getSubOriginLoading = () => {
    switch (originType) {
      case "Grade": return gradesLoading;
      case "Department": return departmentsLoading;
      case "Sub-department": return subDepartmentsLoading;
      case "Position": return positionsLoading;
      default: return false;
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const columns: ColumnsType<ReimbursementRecord> = [
    {
      title: "Origin",
      dataIndex: "origin",
      key: "origin",
      sorter: (a, b) => a.origin.localeCompare(b.origin),
      render: (text: string) => (
        <Space size={8}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
          <Text strong style={{ color: "#1e293b" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Sub-Origin",
      dataIndex: "subOrigin",
      key: "subOrigin",
      render: (text: string) => <Text style={{ color: "#64748b" }}>{text || "-"}</Text>,
    },
    {
      title: "Category Type",
      dataIndex: "categoryType",
      key: "categoryType",
      render: (text: string) => (
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, border: 0 }}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      render: (period: string) => (
        <Tag color={period === "MONTH" ? "cyan" : "geekblue"} style={{ borderRadius: 20, border: 0, fontWeight: 600 }}>
          {period}
        </Tag>
      ),
    },
    {
      title: "Monthly",
      key: "monthlyAmount",
      render: (_: any, record: ReimbursementRecord) => {
        const amounts = calculateAmounts(record.amount, record.period);
        return <Text strong style={{ color: "#1e293b" }}>₹{amounts.monthly.toLocaleString()}</Text>;
      },
    },
    {
      title: "Yearly",
      key: "yearlyAmount",
      render: (_: any, record: ReimbursementRecord) => {
        const amounts = calculateAmounts(record.amount, record.period);
        return <Text strong style={{ color: "#1e293b" }}>₹{amounts.yearly.toLocaleString()}</Text>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "success" : "error"} style={{ borderRadius: 20, border: 0, fontWeight: 600 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ReimbursementRecord) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<Edit size={16} style={{ color: "#64748b" }} />}
            onClick={() => handleEdit(record)}
            className="action-btn"
          />
          <Popconfirm
            title="Delete classification"
            description="Are you sure you want to delete this configuration?"
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ loading: deletingId === record.id, danger: true, style: { borderRadius: 6 } }}
            cancelButtonProps={{ style: { borderRadius: 6 } }}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={16} />}
              disabled={!!deletingId}
              className="action-btn-danger"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCategoryApproversChange = useCallback((index: number, approvers: ApproverRow[]) => {
    setCategoryApproversMap(prev => ({
      ...prev,
      [index]: approvers
    }));
  }, []);

  const handleEmployeesFetched = useCallback((positionId: string, employees: any[]) => {
    setGlobalEmployeesByPosition(prev => ({
      ...prev,
      [positionId]: employees
    }));
  }, []);

  const handleEdit = (record: ReimbursementRecord) => {
    setEditingKey(record.id);
    
    const selectedConfig = dataSource.find(item => item.id === record.id);
    
    if (!selectedConfig) return;

    const configsForForm = [{
      id: selectedConfig.id,
      policyId: selectedConfig.policyId,
      ruleId: selectedConfig.ruleId,
      categoryType: selectedConfig.categoryType,
      amount: selectedConfig.amount,
      period: selectedConfig.period,
      status: selectedConfig.status === "ACTIVE",
    }];

    form.setFieldsValue({
      origin: selectedConfig.origin,
      subOriginId: selectedConfig.subOriginId,
      categoryConfigs: configsForForm,
    });

    if (selectedConfig.approvers && selectedConfig.approvers.length > 0) {
      const mappedApprovers = selectedConfig.approvers.map((a: any) => {
        console.log('Approver data:', a);
        
        const isEmployeeName = a.approverType !== 'specific_employee' && 
                              !positions.some(p => p.title === a.approverType);
        
        if (isEmployeeName) {
          return {
            level: a.level,
            positionId: '',
            employeeId: a.approverId,
          };
        } else if (a.approverType === 'specific_employee') {
          return {
            level: a.level,
            positionId: '',
            employeeId: a.approverId,
          };
        } else {
          const position = positions.find(p => p.title === a.approverType);
          return {
            level: a.level,
            positionId: position?.id || a.approverId,
            employeeId: null,
          };
        }
      });
      
      setCategoryApproversMap({ 0: mappedApprovers });
    } else {
      setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
    }

    setIsDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteConfig.mutateAsync(id);
      api.success({
        message: "Configuration deleted successfully",
        placement: "topRight",
      });
      await refetch();
    } catch (error: any) {
      api.error({
        message: error.message || "Failed to delete configuration",
        placement: "topRight",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (values: any) => {
    setIsSaving(true);
    try {
      const { origin, subOriginId, categoryConfigs } = values;

      if (!origin || !subOriginId) {
        throw new Error("Please select both Origin and Sub-Origin");
      }

      if (!categoryConfigs || categoryConfigs.length === 0) {
        throw new Error("Please add at least one category configuration");
      }

      let successCount = 0;
      let errorCount = 0;

      if (editingKey) {
        for (let i = 0; i < categoryConfigs.length; i++) {
          const config = categoryConfigs[i];
          const categoryApprovers = categoryApproversMap[i] || [];
          
          const approversData = categoryApprovers
            .filter(a => a.positionId)
            .map(a => {
              const selectedPosition = positions.find(p => p.id === a.positionId);
              const positionTitle = selectedPosition?.title || a.positionId;
              
              if (a.employeeId) {
                const employees = globalEmployeesByPosition[a.positionId] || [];
                const selectedEmployee = employees.find(emp => emp.value === a.employeeId);
                
                return {
                  level: a.level,
                  approverType: selectedEmployee?.label || 'specific_employee',
                  approverId: a.employeeId,
                };
              } else {
                return {
                  level: a.level,
                  approverType: positionTitle,
                  approverId: a.positionId,
                };
              }
            });

          try {
            if (config.id) {
              await updateConfig.mutateAsync({
                id: config.id,
                data: {
                  origin,
                  subOrigin: subOriginId,
                  categoryType: config.categoryType,
                  amount: Number(config.amount),
                  period: config.period,
                  status: config.status ? "ACTIVE" : "INACTIVE",
                  approvers: approversData,
                },
              });
              successCount++;
            } else {
              await createConfig.mutateAsync({
                origin,
                subOrigin: subOriginId,
                categoryType: config.categoryType,
                amount: Number(config.amount),
                period: config.period,
                status: config.status ? "ACTIVE" : "INACTIVE",
                approvers: approversData,
              });
              successCount++;
            }
          } catch (error) {
            console.error(`Error processing config ${config.categoryType}:`, error);
            errorCount++;
          }
        }
      } else {
        for (let i = 0; i < categoryConfigs.length; i++) {
          const config = categoryConfigs[i];
          const categoryApprovers = categoryApproversMap[i] || [];
          
          const approversData = categoryApprovers
            .filter(a => a.positionId)
            .map(a => {
              const selectedPosition = positions.find(p => p.id === a.positionId);
              const positionTitle = selectedPosition?.title || a.positionId;
              
              if (a.employeeId) {
                const employees = globalEmployeesByPosition[a.positionId] || [];
                const selectedEmployee = employees.find(emp => emp.value === a.employeeId);
                
                return {
                  level: a.level,
                  approverType: selectedEmployee?.label || 'specific_employee',
                  approverId: a.employeeId,
                };
              } else {
                return {
                  level: a.level,
                  approverType: positionTitle,
                  approverId: a.positionId,
                };
              }
            });

          try {
            await createConfig.mutateAsync({
              origin,
              subOrigin: subOriginId,
              categoryType: config.categoryType,
              amount: Number(config.amount),
              period: config.period,
              status: config.status ? "ACTIVE" : "INACTIVE",
              approvers: approversData,
            });
            successCount++;
          } catch (error) {
            console.error(`Error creating config ${config.categoryType}:`, error);
            errorCount++;
          }
        }
      }

      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
      setCategoryApproversMap({});
      
      await refetch();
      
    } catch (error: any) {
      console.error("Save error:", error);
      api.error({
        message: error.message || "Failed to save",
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) return false;
    return option.label.toLowerCase().includes(input.toLowerCase());
  };

  const activeConfigs = dataSource.filter((item) => item.status === "ACTIVE");
  const inactiveConfigs = dataSource.filter((item) => item.status !== "ACTIVE");

  const filteredData = useMemo(() => {
    return dataSource.filter(
      (item) =>
        item.origin?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.subOrigin?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.categoryType?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [dataSource, searchText]);

  const handleRefresh = async () => {
    try {
      await refetch();
      api.success({
        message: "Data refreshed",
        placement: "topRight",
      });
    } catch (error) {
      api.error({
        message: "Failed to refresh",
        placement: "topRight",
      });
    }
  };

  const handleCloseDrawer = () => {
    if (isSaving) return;
    setIsDrawerVisible(false);
    form.resetFields();
    setEditingKey(null);
    setCategoryApproversMap({});
  };

  return (
    <ProtectedRoute>
      {contextHolder}
      <div style={{ padding: "8px 0" }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Space size={16} align="center">
              <div style={{ 
                background: "#eff6ff", 
                padding: 12, 
                borderRadius: 12, 
                color: "#2563eb",
                display: "flex",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
              }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Reimbursement Policies</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Define classification-based limits and multi-level approval workflows.</Text>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Input 
              placeholder="Search policies..." 
              prefix={<Search size={18} style={{ color: "#94a3b8" }} />}
              style={{ width: 250, borderRadius: 10, height: 44 }}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button 
              icon={<RefreshCw size={18} style={{ color: "#64748b" }} />} 
              onClick={handleRefresh}
              loading={isLoading}
              style={{ borderRadius: 10, height: 44, width: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
            />
            <Button 
              type="primary" 
              size="large" 
              icon={<Plus size={18} />} 
              style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
              onClick={() => {
                setEditingKey(null);
                form.resetFields();
                setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
                setIsDrawerVisible(true);
              }}
            >
              Add Policy
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <StatCard 
              label="Total Policies" 
              value={dataSource.length} 
              icon={ClipboardList} 
              color="#3b82f6" 
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard 
              label="Active Configs" 
              value={activeConfigs.length} 
              icon={CheckCircle} 
              color="#10b981" 
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard 
              label="Inactive Configs" 
              value={inactiveConfigs.length} 
              icon={XCircle} 
              color="#ef4444" 
            />
          </Col>
        </Row>

        {/* Main Table */}
        <Card 
          bodyStyle={{ padding: 0 }} 
          style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            size="middle"
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} configurations`,
              style: { padding: "16px 24px" }
            }}
          />
        </Card>

        <Drawer
          title={
            <Space size={12}>
              <div style={{ background: "#eff6ff", padding: 8, borderRadius: 10, color: "#2563eb", display: "flex" }}>
                <Activity size={20} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{editingKey ? "Edit Policy" : "Create New Policy"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Define limits and approval levels</div>
              </div>
            </Space>
          }
          placement="right"
          width={650}
          onClose={handleCloseDrawer}
          open={isDrawerVisible}
          destroyOnClose
          headerStyle={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}
          bodyStyle={{ padding: 0, background: "#fcfcfc" }}
          extra={
            <Space size={12}>
              <Button onClick={handleCloseDrawer} style={{ borderRadius: 8 }} disabled={isSaving}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={() => form.submit()} 
                loading={isSaving}
                style={{ borderRadius: 8, minWidth: 100, fontWeight: 600 }}
              >
                {editingKey ? "Update Policy" : "Save Policy"}
              </Button>
            </Space>
          }
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSave}
            style={{ padding: 24 }}
          >
            {/* Origin Selection Block */}
            <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #f1f5f9", marginBottom: 24, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <FileBadge size={18} style={{ color: "#3b82f6" }} />
                <Text strong style={{ fontSize: 14 }}>Configuration Scope</Text>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="origin"
                    label={<Text strong style={{ fontSize: 12 }}>Origin</Text>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select
                      placeholder="Select Origin"
                      disabled={!!editingKey}
                      style={{ height: 40 }}
                      onChange={() => {
                        form.setFieldsValue({ subOriginId: undefined, categoryConfigs: [{}] });
                        setCategoryApproversMap({ 0: [{ level: 1, positionId: '', employeeId: null }] });
                      }}
                    >
                      <Option value="Grade">Grade</Option>
                      <Option value="Department">Department</Option>
                      <Option value="Sub-department">Sub-department</Option>
                      <Option value="Position">Position</Option>
                      <Option value="User">User</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="subOriginId"
                    label={<Text strong style={{ fontSize: 12 }}>Sub-Origin</Text>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select
                      placeholder="Select"
                      disabled={!originType || !!editingKey}
                      loading={getSubOriginLoading()}
                      showSearch
                      style={{ height: 40 }}
                      filterOption={filterOption}
                      options={getSubOriginOptions()}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              {originType && subOriginId && (
                <div style={{ 
                  marginTop: 12, 
                  padding: "10px 14px", 
                  background: "#eff6ff", 
                  borderRadius: 10,
                  border: "1px solid #dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <Space>
                    <Users size={16} style={{ color: "#3b82f6" }} />
                    <Text style={{ fontSize: 13, color: "#1e3a8a" }}>
                      Applying to <Text strong style={{ color: "#1e3a8a" }}>{getSubOriginOptions().find(opt => opt.value === subOriginId)?.label}</Text> ({originType})
                    </Text>
                  </Space>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 14, color: "#1e293b", display: "block", marginBottom: 16 }}>Configuration Sets</Text>
              <Form.List name="categoryConfigs" initialValue={[{}]}>
                {(fields, { add, remove }) => (
                  <CompactCategoryConfigListContent
                    fields={fields}
                    add={add}
                    remove={remove}
                    categoryConfigs={categoryConfigs}
                    editingKey={editingKey}
                    categoryOptions={categoryOptions}
                    categoryApproversMap={categoryApproversMap}
                    onCategoryApproversChange={handleCategoryApproversChange}
                    positions={positions}
                    positionsLoading={positionsLoading}
                    onEmployeesFetched={handleEmployeesFetched}
                  />
                )}
              </Form.List>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{ __html: `
          .action-btn:hover {
            background: #f1f5f9 !important;
            color: #2563eb !important;
          }
          .action-btn-danger:hover {
            background: #fff1f2 !important;
          }
          .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #64748b !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
            padding: 16px !important;
          }
          .ant-table-row:hover > td {
            background: #f8fafc !important;
          }
          .ant-table-cell {
            padding: 16px !important;
          }
          .ant-input:focus, .ant-input-focused, .ant-select-selector:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
          .ant-drawer-header {
            background: #ffffff !important;
          }
          .ant-collapse {
            background: transparent !important;
            border: none !important;
          }
          .ant-collapse-item {
            background: #ffffff !important;
            border: 1px solid #f1f5f9 !important;
            border-radius: 12px !important;
            margin-bottom: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
          }
          .ant-collapse-header {
            padding: 12px 16px !important;
            align-items: center !important;
          }
        `}} />
      </div>
    </ProtectedRoute>
  );
}























































































































































