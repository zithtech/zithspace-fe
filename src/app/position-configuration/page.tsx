"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  List,
  InputNumber,
  Divider,
  Avatar,
  Drawer,
  Collapse,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SettingOutlined,
  AppstoreOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useLeaveOrigins } from "@/hooks/useLeaveOrigins";
import { leaveOriginService } from "@/services/leaveOriginService";
import { MembersService } from "@/services/membersService";
import { useGrades } from "@/hooks/useGrades";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions } from "@/hooks/usePositions";

const { Text } = Typography;

const LEAVE_TYPES = ["Work From Home", "Casual Leave", "Sick Leave"];

const subOriginData: Record<string, string[]> = {};

interface PositionRecord {
  key: string;
  position: string;
  status: string;
  leaveType?: string | string[];
  unit?: number;
  period?: string;
  carryForward?: boolean;
  totalLeaves?: number;
  subOriginId?: string;
}

const switchRowCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  border: "1px solid #f0f0f0",
  borderRadius: 8,
  marginBottom: 12,
  background: "#fafafa",
};

const switchTitle = { fontSize: 14, fontWeight: 600 };
const switchDesc = { fontSize: 12, color: "#8c8c8c", marginTop: 2 };

const LeaveConfigListContent = ({
  fields,
  add,
  remove,
  leaveConfigs,
  editingKey,
}: {
  fields: any[];
  add: () => void;
  remove: (index: number | number[]) => void;
  leaveConfigs: any[];
  editingKey: string | null;
}) => {
  const [activeKey, setActiveKey] = useState<string | string[] | number | number[]>(
    fields.length > 0 ? fields[0].key : []
  );
  const prevFieldsLength = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevFieldsLength.current) {
      const lastField = fields[fields.length - 1];
      setActiveKey(lastField.key);
    }
    prevFieldsLength.current = fields.length;
  }, [fields.length]);

  return (
    <>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        items={fields.map(({ key, name, ...restField }) => {
          const selectedInOtherRows = (leaveConfigs || [])
            .filter((_: any, index: number) => index !== name)
            .flatMap((item: any) => {
              const types = item?.leaveType;
              if (Array.isArray(types)) return types;
              if (typeof types === "string") return [types];
              return [];
            });

          const currentLeaveType = leaveConfigs?.[name]?.leaveType;

          return {
            key: key,
            label: currentLeaveType || `Leave Type ${name + 1}`,
            extra:
              fields.length > 1 ? (
                <Popconfirm
                  title="Are you sure you want to delete?"
                  onConfirm={() => remove(name)}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <DeleteOutlined
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "red" }}
                  />
                </Popconfirm>
              ) : null,
            children: (
              <>
                <Form.Item name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "leaveType"]}
                      label="Leave Type"
                      rules={[{ required: true }]}
                    >
                      <Select
                        size="small"
                        style={{ width: "100%" }}
                        placeholder="Leave Type"
                        options={LEAVE_TYPES.filter(
                          (type) => !selectedInOtherRows.includes(type)
                        ).map((l) => ({ label: l, value: l }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, "unit"]}
                      label="Unit"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, "period"]}
                      label="Period"
                      rules={[{ required: true }]}
                      style={{ width: 100 }}
                    >
                      <Select
                        options={[
                          { label: "Per Month", value: "MONTH" },
                          { label: "Per Year", value: "YEAR" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={switchRowCard}>
                  <div>
                    <div style={switchTitle}>Carry Forward</div>
                    <div style={switchDesc}>Allow unused leaves to carry forward</div>
                  </div>
                  <Form.Item
                    {...restField}
                    name={[name, "carryForward"]}
                    valuePropName="checked"
                    noStyle
                  >
                    <Switch disabled={!editingKey} />
                  </Form.Item>
                </div>
                <div style={{ ...switchRowCard, marginBottom: 0 }}>
                  <div>
                    <div style={switchTitle}>Status</div>
                    <div style={switchDesc}>Leave type is active</div>
                  </div>
                  <Form.Item
                    {...restField}
                    name={[name, "status"]}
                    valuePropName="checked"
                    initialValue={true}
                    noStyle
                  >
                    <Switch />
                  </Form.Item>
                </div>
              </>
            ),
          };
        })}
      />
      <Button
        type="dashed"
        block
        onClick={() => add()}
        style={{ marginTop: 12 }}
      >
        + Add Another Leave Type
      </Button>
    </>
  );
};

export default function positionConfiguration() {
  const { isLoading: authLoading } = useAuth();
  const {
    canManageOrg,
    canReadLeave,
    canCreateLeave,
    canManageLeaves,
    canReadLeaveDashboard,
    canReadLeaveType,
    canReadLeavePolicy,
    canReadLeaveHoliday,
    canReadLeaveAdjustment,
    canCreateLeavePolicy,
    canUpdateLeavePolicy,
    canDeleteLeavePolicy,
  } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const originType = Form.useWatch("position", form);
  const leaveConfigs = Form.useWatch("leaveConfigs", form);
  const [viewType] = useState("table");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PositionRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const hasAccess = canManageOrg || canManageLeaves || canReadLeavePolicy;

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push("/dashboard");
    }
  }, [authLoading, hasAccess, router]);

  const [members, setMembers] = useState<{ value: string; label: string }[]>([]);
  const [dataSource, setDataSource] = useState<PositionRecord[]>([]);

  const { leaveOrigins, loading, refetch } = useLeaveOrigins();
  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { departments, loading: departmentsLoading } = useDepartments();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  useEffect(() => {
    if (leaveOrigins) {
      const formattedData: PositionRecord[] = leaveOrigins.flatMap((origin: any) =>
        (origin.leaveTypes || []).map((type: any) => ({
          key: type.id,
          position: origin.origin,
          subOriginId: origin.subOriginId,
          status: type.status,
          leaveType: type.leaveType,
          unit: Number(type.unit),
          period: type.period,
          carryForward: type.carryForward,
          totalLeaves: Number(type.unit),
        }))
      );
      setDataSource(formattedData);
    }
  }, [leaveOrigins]);

  useEffect(() => {
    const fetchMembersForSelect = async () => {
      try {
        const memberData = await MembersService.getMembersForSelect();
        setMembers(memberData);
      } catch (error) {
        console.error("Failed to fetch members for select:", error);
        api.error({ message: "Failed to load members", placement: "topRight" });
      }
    };
    fetchMembersForSelect();
  }, []);

  const uniqueDataSource = Object.values(
    dataSource.reduce(
      (acc, item) => {
        const key = `${item.position}-${item.subOriginId}`;
        if (!acc[key]) {
          acc[key] = {
            ...item,
            leaveType: Array.isArray(item.leaveType)
              ? item.leaveType
              : item.leaveType
                ? [item.leaveType]
                : [],
          };
        } else {
          const existingTypes = acc[key].leaveType as string[];
          const newType = Array.isArray(item.leaveType)
            ? item.leaveType[0]
            : item.leaveType;
          if (newType && !existingTypes.includes(newType)) {
            existingTypes.push(newType);
          }
        }
        return acc;
      },
      {} as Record<string, PositionRecord>
    )
  );

  const columns: ColumnsType<PositionRecord> = [
    {
      title: "Orgin",
      dataIndex: "position",
      key: "position",
      align: "center",
      sorter: (a, b) => a.position.localeCompare(b.position),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Sub-Orgin",
      dataIndex: "subOriginId",
      key: "subOriginId",
      align: "center",
      render: (text: string, record: PositionRecord) => {
        let label = text;
        if (record.position === "User") label = members.find((m) => m.value === text)?.label || text;
        else if (record.position === "Grade") label = grades.find((g: any) => g.id === text)?.name || text;
        else if (record.position === "Department") label = departments.find((d: any) => d.id === text)?.name || text;
        else if (record.position === "Sub-department") label = subDepartments.find((sd: any) => sd.id === text)?.name || text;
        else if (record.position === "Position") label = positions.find((p: any) => p.id === text)?.title || text;
        return <Text strong>{label || "-"}</Text>;
      },
    },
    {
      title: "Active Leave",
      key: "activeLeave",
      align: "center",
      render: (_: any, record: PositionRecord) => {
        const group = dataSource.filter(
          (i) => i.position === record.position && i.subOriginId === record.subOriginId
        );
        return <Tag color="green">{group.filter((i) => i.status === "Active").length}</Tag>;
      },
    },
    {
      title: "Inactive Leave",
      key: "inactiveLeave",
      align: "center",
      render: (_: any, record: PositionRecord) => {
        const group = dataSource.filter(
          (i) => i.position === record.position && i.subOriginId === record.subOriginId
        );
        return <Tag color="red">{group.filter((i) => i.status !== "Active").length}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          {(canManageOrg || canManageLeaves || canUpdateLeavePolicy) && (
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {(canManageOrg || canManageLeaves || canDeleteLeavePolicy) && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete this entire position configuration?"
                onConfirm={() => handleDeleteOrigin(record)}
                okButtonProps={{ loading: deletingKey === `${record.position}-${record.subOriginId}` }}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} disabled={!!deletingKey} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (record: PositionRecord) => {
    setIsDrawerVisible(true);
    setCurrentRecord(record);
  };

  const handleEdit = (record: any) => {
    const configsForPosition = dataSource.filter(
      (item) => item.position === record.position && item.subOriginId === record.subOriginId
    );
    setEditingKey(record.key);
    const leaveConfigsForForm = configsForPosition.map((config) => ({
      id: config.key,
      leaveType: config.leaveType,
      unit: config.unit,
      period: config.period,
      carryForward: config.carryForward,
      status: config.status === "Active",
    }));
    form.setFieldsValue({
      position: record.position,
      subOriginId: record.subOriginId,
      leaveConfigs: leaveConfigsForForm.length > 0 ? leaveConfigsForForm : [{}],
    });
    setIsModalVisible(true);
  };

  const handleDrawerEdit = (record: any) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      position: record.position,
      leaveConfigs: [
        {
          id: record.key,
          leaveType: record.leaveType,
          unit: record.unit,
          period: record.period,
          carryForward: record.carryForward,
          status: record.status === "Active",
        },
      ],
    });
    setIsModalVisible(true);
  };

  const handleDeleteLeaveType = async (key: string) => {
    setDeletingKey(key);
    try {
      await leaveOriginService.deleteLeaveType(key);
      refetch();
      api.success({ message: "Leave Type deleted successfully", placement: "topRight" });
    } catch (error) {
      console.error("Failed to delete leave type:", error);
      api.error({ message: "Failed to delete leave type", placement: "topRight" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteOrigin = async (record: PositionRecord) => {
    const groupKey = `${record.position}-${record.subOriginId}`;
    const originToDelete = leaveOrigins?.find(
      (o: any) => o.origin === record.position && o.subOriginId === record.subOriginId
    );
    if (!originToDelete) {
      api.error({ message: "Could not find the origin to delete.", placement: "topRight" });
      return;
    }
    setDeletingKey(groupKey);
    try {
      await leaveOriginService.deleteStructure(originToDelete.id);
      refetch();
      api.success({ message: "Position Configuration deleted successfully", placement: "topRight" });
    } catch (error) {
      console.error("Failed to delete origin:", error);
      api.error({ message: "Failed to delete origin", placement: "topRight" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSave = async (values: any) => {
    const { position, subOriginId, leaveConfigs: configs } = values;
    if (!editingKey && leaveOrigins) {
      const exists = leaveOrigins.some(
        (item: any) => item.origin === position && item.subOriginId === subOriginId
      );
      if (exists) {
        api.error({
          message: "Configuration Already Exists",
          description: "This Origin and Sub-Origin combination already exists.",
          placement: "topRight",
        });
        return;
      }
    }
    setIsSaving(true);
    try {
      const structure = leaveOrigins?.find(
        (item: any) => item.origin === position && item.subOriginId === subOriginId
      );
      if (!structure) {
        await leaveOriginService.createStructure({
          origin: position,
          subOriginId: subOriginId,
          leaveTypes: configs.map((config: any) => ({
            leaveType: config.leaveType,
            unit: config.unit,
            period: config.period,
            carryForward: config.carryForward ?? false,
            status: config.status ? "Active" : "Inactive",
          })),
        });
      } else {
        await leaveOriginService.updateStructure(structure.id, {
          leaveTypes: configs.map((config: any) => ({
            id: config.id,
            leaveType: config.leaveType,
            unit: config.unit,
            period: config.period,
            carryForward: config.carryForward ?? false,
            status: config.status ? "Active" : "Inactive",
          })),
        });
      }
      api.success({ message: "Configuration saved successfully", placement: "topRight" });
      setIsModalVisible(false);
      form.resetFields();
      setEditingKey(null);
      refetch();
    } catch (error) {
      console.error(error);
      api.error({ message: "Failed to save configuration", placement: "topRight" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ padding: 100, textAlign: 'center' }}>
            <Spin size="large">
              <div style={{ padding: 20 }} />
            </Spin>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <MainLayout>
      {contextHolder}
      <div>
        <div style={{ marginTop: 20 }}>
          <Tabs
            activeKey={
              pathname.includes("government-holidays")
                ? "holidays"
                : pathname.includes("leaves-dashboard")
                  ? "dashboard"
                  : pathname.includes("leave-adjustments")
                    ? "adjustments"
                    : pathname.includes("leave-configuration")
                      ? "configuration"
                      : pathname.includes("position-configuration")
                        ? "positions"
                        : "leaves"
            }
            onChange={(key) => {
              if (key === "dashboard") router.push("/leaves-dashboard");
              if (key === "leaves") router.push("/leaves");
              if (key === "holidays") router.push("/government-holidays");
              if (key === "adjustments") router.push("/leave-adjustments");
              if (key === "configuration") router.push("/leave-configuration");
              if (key === "positions") router.push("/position-configuration");
              if (key === "addLeaves") router.push("/add-goverment-leaves");
            }}
            items={[
              ...(canReadLeaveDashboard ? [{ key: "dashboard", label: <span><AppstoreOutlined /> Dashboard</span> }] : []),
              ...(canReadLeave ? [{ key: "leaves", label: <span><ClockCircleOutlined /> My Leave Status</span> }] : []),
              ...((canReadLeaveHoliday || canManageLeaves) ? [{ key: "holidays", label: <span><ScheduleOutlined /> Government Holidays</span> }] : []),
              ...((canReadLeaveAdjustment || canManageLeaves) ? [{ key: "adjustments", label: <span><EditOutlined /> Leave Adjustment</span> }] : []),
              ...((canReadLeaveType || canManageLeaves) ? [{ key: "configuration", label: <span><SettingOutlined /> Leave Types</span> }] : []),
              ...((canReadLeavePolicy || canManageLeaves) ? [{ key: "positions", label: <span><ApartmentOutlined /> Leave Policy</span> }] : []),
              ...((canReadLeaveHoliday || canManageLeaves) ? [{ key: "addLeaves", label: <span><PlusOutlined /> Add Government Leaves</span> }] : []),
            ]}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <Space align="center" size={8}>
              <ApartmentOutlined style={{ color: "#1a64c4ff", fontSize: 20 }} />
              <Typography.Title level={4} style={{ margin: 0 }}>
                Leave Policy
              </Typography.Title>
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Configure leave types and assign limits per position.
              </Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Space style={{ marginTop: 8 }}>
                <Tag color="processing" style={{ borderRadius: 12 }}>
                  Total Origin : {uniqueDataSource.length}
                </Tag>
                <Tag style={{ borderRadius: 12 }} icon={<CheckCircleOutlined />} color="success">
                  Active : {uniqueDataSource.filter((item) => item.status === "Active").length}
                </Tag>
                <Tag style={{ borderRadius: 12 }} icon={<CloseCircleOutlined />} color="error">
                  Inactive : {uniqueDataSource.filter((item) => item.status !== "Active").length}
                </Tag>
              </Space>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, margin: "0 0 0 28px", marginBottom: 20 }}>
            <Input.Search
              placeholder="Search Leave Types...."
              allowClear
              style={{ width: 360 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {(canManageOrg || canManageLeaves || canCreateLeavePolicy) && (
              <Button
                type="primary"
                style={{ width: 200 }}
                onClick={() => {
                  setEditingKey(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                + Add Configuration
              </Button>
            )}
          </div>
        </div>

        <Divider style={{ marginTop: 5 }} />

        {viewType === "table" ? (
          <Table
            columns={columns}
            dataSource={uniqueDataSource.filter(
              (item) =>
                item.position?.toLowerCase().includes(searchText.toLowerCase()) ||
                (Array.isArray(item.leaveType)
                  ? item.leaveType.some((t: string) =>
                    t.toLowerCase().includes(searchText.toLowerCase())
                  )
                  : item.leaveType?.toLowerCase().includes(searchText.toLowerCase()))
            )}
            size="small"
            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10 }}
            loading={loading}
          />
        ) : (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={uniqueDataSource.filter(
              (item) =>
                item.position?.toLowerCase().includes(searchText.toLowerCase()) ||
                (Array.isArray(item.leaveType)
                  ? item.leaveType.some((t: string) =>
                    t.toLowerCase().includes(searchText.toLowerCase())
                  )
                  : item.leaveType?.toLowerCase().includes(searchText.toLowerCase()))
            )}
            loading={loading}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  actions={[
                    <Tooltip title="View" key="view">
                      <EyeOutlined onClick={() => handleView(item)} />
                    </Tooltip>,
                    (canManageOrg || canManageLeaves || canUpdateLeavePolicy) ? (
                      <Tooltip title="Edit" key="edit">
                        <EditOutlined onClick={() => handleEdit(item)} />
                      </Tooltip>
                    ) : null,
                    (canManageOrg || canManageLeaves || canDeleteLeavePolicy) ? (
                      <Tooltip title="Delete" key="delete">
                        <Popconfirm
                          title="Delete this entire position configuration?"
                          onConfirm={() => handleDeleteOrigin(item)}
                          okButtonProps={{
                            loading: deletingKey === `${item.position}-${item.subOriginId}`,
                          }}
                          okText="Yes"
                          cancelText="No"
                          disabled={!!deletingKey}
                        >
                          <DeleteOutlined style={{ color: deletingKey ? "grey" : "red" }} />
                        </Popconfirm>
                      </Tooltip>
                    ) : null,
                  ].filter(Boolean) as any[]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: "#4ea6f8", fontWeight: 600 }}>
                        {item.position?.[0]?.toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{item.position}</span>
                        {(() => {
                          const group = dataSource.filter(
                            (i) =>
                              i.position === item.position &&
                              i.subOriginId === item.subOriginId
                          );
                          const activeCount = group.filter((i) => i.status === "Active").length;
                          const inactiveCount = group.filter((i) => i.status !== "Active").length;
                          return (
                            <Space size={6}>
                              <Tag color="green">Active: {activeCount}</Tag>
                              <Tag color="red">Inactive: {inactiveCount}</Tag>
                            </Space>
                          );
                        })()}
                      </div>
                    }
                    description={null}
                  />
                </Card>
              </List.Item>
            )}
            style={{ marginTop: 24 }}
            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 9 }}
          />
        )}

        <Modal
          title={editingKey ? "Edit Position Configuration" : "Add Position Configuration"}
          open={isModalVisible}
          onCancel={() => {
            if (isSaving) return;
            setIsModalVisible(false);
            form.resetFields();
            setEditingKey(null);
          }}
          onOk={() => form.submit()}
          destroyOnClose
          confirmLoading={isSaving}
          cancelButtonProps={{ disabled: isSaving }}
          width={500}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="position"
                  label="Orgin"
                  rules={[{ required: true, message: "Please select an origin type" }]}
                >
                  <Select
                    placeholder="Select Type"
                    disabled={!!editingKey}
                    options={["Grade", "Department", "Sub-department", "Position", "User"].map(
                      (p) => ({ label: p, value: p })
                    )}
                    onChange={() => form.setFieldsValue({ subOriginId: undefined })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="subOriginId"
                  label="Sub-Orgin"
                  rules={[{ required: true, message: "Please select a Sub-origin type" }]}
                >
                  <Select
                    placeholder="Select Name"
                    disabled={!originType || !!editingKey}
                    loading={
                      originType === "Grade"
                        ? gradesLoading
                        : originType === "Department"
                          ? departmentsLoading
                          : originType === "Sub-department"
                            ? subDepartmentsLoading
                            : originType === "Position"
                              ? positionsLoading
                              : false
                    }
                    options={
                      originType === "User"
                        ? members.map((m) => ({ label: m.label, value: m.value }))
                        : originType === "Grade"
                          ? grades.map((g: any) => ({ label: g.name, value: g.id }))
                          : originType === "Department"
                            ? departments.map((d: any) => ({ label: d.name, value: d.id }))
                            : originType === "Sub-department"
                              ? subDepartments.map((sd: any) => ({ label: sd.name, value: sd.id }))
                              : originType === "Position"
                                ? positions.map((p: any) => ({ label: p.title, value: p.id }))
                                : (subOriginData[originType] || []).map((opt) => ({
                                  label: opt,
                                  value: opt,
                                }))
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.List name="leaveConfigs" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <LeaveConfigListContent
                  fields={fields}
                  add={add}
                  remove={remove}
                  leaveConfigs={leaveConfigs}
                  editingKey={editingKey}
                />
              )}
            </Form.List>
          </Form>
        </Modal>

        <Drawer
          title={
            currentRecord
              ? `${currentRecord.position} - ${(() => {
                const text = currentRecord.subOriginId;
                if (currentRecord.position === "User")
                  return members.find((m) => m.value === text)?.label || text;
                if (currentRecord.position === "Grade")
                  return grades.find((g: any) => g.id === text)?.name || text;
                if (currentRecord.position === "Department")
                  return departments.find((d: any) => d.id === text)?.name || text;
                if (currentRecord.position === "Sub-department")
                  return subDepartments.find((sd: any) => sd.id === text)?.name || text;
                if (currentRecord.position === "Position")
                  return positions.find((p: any) => p.id === text)?.title || text;
                return text;
              })()}`
              : "Details"
          }
          placement="right"
          width={900}
          open={isDrawerVisible}
          onClose={() => {
            setIsDrawerVisible(false);
            setCurrentRecord(null);
          }}
        >
          <Table
            columns={[
              { title: "Leave Type", dataIndex: "leaveType", key: "leaveType", align: "center" },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                align: "center",
                render: (status: string) => (
                  <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
                ),
              },
              { title: "Unit", dataIndex: "unit", key: "unit", align: "center" },
              {
                title: "Per Month",
                key: "perMonth",
                align: "center",
                render: (_: any, record: PositionRecord) => {
                  const u = record.unit || 0;
                  if (record.period === "MONTH")
                    return <Text>{u} <Tag style={{ borderRadius: 10 }} color="blue">day</Tag></Text>;
                  if (record.period === "YEAR")
                    return <Text>{(u / 12).toFixed(1)} <Tag style={{ borderRadius: 10 }} color="blue">day</Tag></Text>;
                  return <Text>-</Text>;
                },
              },
              {
                title: "Per Year",
                key: "perYear",
                align: "center",
                render: (_: any, record: PositionRecord) => {
                  const u = record.unit || 0;
                  if (record.period === "MONTH")
                    return <Text>{u * 12} <Tag style={{ borderRadius: 10 }} color="blue">days</Tag></Text>;
                  if (record.period === "YEAR")
                    return <Text>{u} <Tag style={{ borderRadius: 10 }} color="blue">days</Tag></Text>;
                  return <Text>-</Text>;
                },
              },
              {
                title: "Carry Forward",
                dataIndex: "carryForward",
                key: "carryForward",
                align: "center",
                render: (val: boolean) => (
                  <Tag color={val ? "blue" : "default"}>{val ? "Yes" : "No"}</Tag>
                ),
              },
              {
                title: "Total",
                key: "total",
                align: "center",
                render: (_: any, record: PositionRecord) => {
                  const u = record.unit || 0;
                  const total = record.period === "MONTH" ? u * 12 : record.period === "YEAR" ? u : 0;
                  return <Text strong>{total}</Text>;
                },
              },
              {
                title: "Action",
                key: "action",
                align: "center",
                render: (_: any, record: any) => (
                  <Space>
                    <Tooltip title="Edit">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleDrawerEdit(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Popconfirm
                        title="Are you sure to delete this leave type?"
                        onConfirm={() => handleDeleteLeaveType(record.key)}
                        okButtonProps={{ loading: deletingKey === record.key }}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={!!deletingKey}
                        />
                      </Popconfirm>
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
            dataSource={dataSource.filter(
              (item) =>
                item.position === currentRecord?.position &&
                item.subOriginId === currentRecord?.subOriginId
            )}
            pagination={false}
          />
        </Drawer>
      </div>
    </MainLayout>
  );
}
