"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Settings2, Columns3Cog } from "lucide-react";
import {
  Card,
  Tabs,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  message,
  notification,
  Space,
  Statistic,
  Row,
  Col,
  Badge,
  Typography,
  Tooltip,
  Popconfirm,
  Switch,
  Checkbox,
  List,
  InputNumber,
  Divider,
  Segmented,
  Avatar,
  Drawer,
  Collapse,
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
  BarsOutlined,
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
import { useLeaveTypes } from "@/hooks/useLeaveTypes";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;
const subOriginData: Record<string, string[]> = {};

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
  const [activeKey, setActiveKey] = useState<
    string | string[] | number | number[]
  >(fields.length > 0 ? fields[0].key : []);
  const prevFieldsLength = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevFieldsLength.current) {
      const lastField = fields[fields.length - 1];
      setActiveKey(lastField.key);
    }
    prevFieldsLength.current = fields.length;
  }, [fields.length]);
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

  const switchTitle = {
    fontSize: 14,
    fontWeight: 600,
  };

  const switchDesc = {
    fontSize: 12,
    color: "#8c8c8c",
    marginTop: 2,
  };

  return (
    <>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        items={fields.map(({ key, name, ...restField }) => {
         const leaveConfigs = form.getFieldValue("leaveConfigs") || [];

const selectedInOtherRows = leaveConfigs
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
            label:
              leaveTypes.find((t) => t.value === currentLeaveType)?.label ||
              `Leave Type ${name + 1}`,
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
  <Col span={12}>
    <Form.Item
      {...restField}
      name={[name, "leaveType"]}
      label="Leave Type"
      rules={[{ required: true }]}
    >
      <Select
        size="small"
        style={{ width: "100%",height:30 }}
        placeholder="Leave Type"
        options={leaveTypes.filter(
          (type) => !selectedInOtherRows.includes(type.value)
        )}
      />
    </Form.Item>
  </Col>

  <Col span={12}>
    <Form.Item
      {...restField}
      name={[name, "unit"]}
      label="Unit"
      rules={[
        { required: true, message: "Please enter a unit." },
        { type: "number", message: "Unit must be a number." },
      ]}
    >
      <InputNumber min={0} style={{ width: "100%" }} />
    </Form.Item>
  </Col>
</Row>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "period"]}
                      label="Period"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={[
                          { label: "Month", value: "MONTH" },
                          { label: "Year", value: "YEAR" },
                        ]}
                        onChange={() => {
                          form.setFieldValue(["leaveConfigs", name, "months"], undefined);
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.leaveConfigs?.[name]?.period !== curr.leaveConfigs?.[name]?.period}>
                      {() => {
                        const period = form.getFieldValue(["leaveConfigs", name, "period"]);
                        const isYear = period === "YEAR";
                        return (
                          <Form.Item
                            {...restField}
                            name={[name, "months"]}
                            label={isYear ? "Years" : "Months"}
                            rules={[{ required: true, message: `Enter ${isYear ? "years" : "months"}` }]}
                          >
                            <InputNumber min={1} style={{ width: "100%" }} />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </Col>
                </Row>
                {/* Carry Forward */}
                <div style={switchRowCard}>
                  <div>
                    <div style={switchTitle}>Carry Forward</div>
                    <div style={switchDesc}>
                      Allow unused leaves to carry forward
                    </div>
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

                {/* Status */}
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
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasApprovalRights =
    (user as any)?.role === "super_admin" || (user as any)?.role === "admin";

  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const originType = Form.useWatch("position", form);
  // const leaveConfigs = Form.useWatch("leaveConfigs", form);
  // const [loading, setLoading] = useState(false); // Replaced by hook's loading
  const [viewType, setViewType] = useState("table");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editMode, setEditMode] = useState<"group" | "single">("group");
  const [currentRecord, setCurrentRecord] = useState<PositionRecord | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [members, setMembers] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [dataSource, setDataSource] = useState<PositionRecord[]>([]);

  const { leaveOrigins, loading, refetch } = useLeaveOrigins();
  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { departments, loading: departmentsLoading } = useDepartments();
  const { subDepartments, loading: subDepartmentsLoading } =
    useSubDepartments();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  const { leaveTypes: apiLeaveTypes, fetchLeaveTypes } = useLeaveTypes();

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const [leaveTypeOptions, setLeaveTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (apiLeaveTypes) {
      const options = apiLeaveTypes
        .filter((lt) => lt.isActive)
        .map((lt) => ({ label: lt.name, value: lt.id }));
      setLeaveTypeOptions(options);
    }
  }, [apiLeaveTypes]);

  useEffect(() => {
    if (leaveOrigins) {
      const formattedData: PositionRecord[] = leaveOrigins.flatMap((origin) =>
        origin.leaveTypes.map((type) => ({
          key: type.id,
          position: origin.origin,
          subOriginId: origin.subOriginId,
          status: type.status,
          leaveType: type.leaveType?.name, // Display Name
          leaveTypeId: type.leaveTypeId, // ID for logic
          unit: Number(type.unit),
          period: type.period,
          carryForward: type.carryForward,
          totalLeaves: Number(type.unit), // Assuming total is unit for now, adjust logic if needed
          accrualInterval: type.accrualInterval,
        })),
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
        api.error({
          message: "Failed to load members",
          placement: "topRight",
        });
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
      {} as Record<string, PositionRecord>,
    ),
  );

  const usedSubOriginIds = uniqueDataSource
    .filter((item) => item.position === originType)
    .map((item) => item.subOriginId);

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
        if (record.position === "User")
          label = members.find((m) => m.value === text)?.label || text;
        else if (record.position === "Grade")
          label = grades.find((g) => g.id === text)?.name || text;
        else if (record.position === "Department")
          label = departments.find((d) => d.id === text)?.name || text;
        else if (record.position === "Sub-department")
          label = subDepartments.find((sd) => sd.id === text)?.name || text;
        else if (record.position === "Position")
          label = positions.find((p) => p.id === text)?.title || text;
        return <Text strong>{label || "-"}</Text>;
      },
    },
    {
      title: "Active Leave",
      key: "activeLeave",
      align: "center",
      render: (_: any, record: PositionRecord) => {
        const group = dataSource.filter(
          (i) =>
            i.position === record.position &&
            i.subOriginId === record.subOriginId,
        );
        const count = group.filter((i) => i.status === "Active").length;
        return <Tag color="green">{count}</Tag>;
      },
    },
    {
      title: "Inactive Leave",
      key: "inactiveLeave",
      align: "center",
      render: (_: any, record: PositionRecord) => {
        const group = dataSource.filter(
          (i) =>
            i.position === record.position &&
            i.subOriginId === record.subOriginId,
        );
        const count = group.filter((i) => i.status !== "Active").length;
        return <Tag color="red">{count}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this entire position configuration?"
              onConfirm={() => handleDeleteOrigin(record)}
              okButtonProps={{
                loading:
                  deletingKey === `${record.position}-${record.subOriginId}`,
              }}
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
  ];

  const handleView = (record: PositionRecord) => {
    setIsDrawerVisible(true);
    setCurrentRecord(record);
  };

  const handleEdit = (record: any) => {
    setEditMode("group");
    const configsForPosition = dataSource.filter(
      (item) =>
        item.position === record.position &&
        item.subOriginId === record.subOriginId,
    );

    setEditingKey(record.key);

    const leaveConfigsForForm = configsForPosition.map((config) => ({
      id: config.key, // Pass the ID so we know to update instead of create
      leaveType: config.leaveTypeId, // Use ID for the form Select
      unit: config.unit,
      months: config.accrualInterval,
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
    setEditMode("single");
    setEditingKey(record.key);
    form.setFieldsValue({
      position: record.position,
      leaveConfigs: [
        {
          id: record.key, // Pass the ID here as well
          leaveType: record.leaveTypeId, // Use ID for the form Select
          unit: record.unit,
          months: record.accrualInterval,
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
      // This makes the actual API call to delete the leave type.
      await leaveOriginService.deleteLeaveType(key);

      refetch(); // Refetch data from the server to update the UI.

      api.success({
        message: "Leave Type deleted successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Failed to delete leave type:", error);
      api.error({
        message: "Failed to delete leave type",
        placement: "topRight",
      });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteOrigin = async (record: PositionRecord) => {
    const groupKey = `${record.position}-${record.subOriginId}`;
    const originToDelete = leaveOrigins.find(
      (o) =>
        o.origin === record.position && o.subOriginId === record.subOriginId,
    );

    if (!originToDelete) {
      api.error({
        message: "Could not find the origin to delete.",
        placement: "topRight",
      });
      return;
    }

    setDeletingKey(groupKey);
    try {
      await leaveOriginService.deleteStructure(originToDelete.id);

      refetch();

      api.success({
        message: "Position Configuration deleted successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Failed to delete origin:", error);
      api.error({ message: "Failed to delete origin", placement: "topRight" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleSave = async (values: any) => {
    const { position, subOriginId, leaveConfigs } = values;

    if (!editingKey && leaveOrigins) {
      const exists = leaveOrigins.some(
        (item) => item.origin === position && item.subOriginId === subOriginId,
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
      // 1. Find or Create Structure
      // Check if this structure already exists in our fetched data
      let structure = leaveOrigins.find(
        (item) => item.origin === position && item.subOriginId === subOriginId,
      );

      if (!structure) {
        // Create new structure if it doesn't exist
        await leaveOriginService.createStructure({
          origin: position,
          subOriginId: subOriginId,
          leaveTypes: leaveConfigs.map((config: any) => ({
            leaveTypeId: config.leaveType, // Form value is ID
            unit: config.unit,
            period: config.period,
           accrualInterval: Number(config.months),
            carryForward: config.carryForward ?? false,
            status: config.status ? "Active" : "Inactive",
          })),
        });
      } else {
        // 2. Update/Add Leave Types for existing structure
      const leaveTypesPayload = leaveConfigs.map((config: any) => ({
  id: config.id,
  leaveTypeId: config.leaveType,
  unit: config.unit,
  period: config.period,
  accrualInterval: Number(config.months), // ⭐ important
  carryForward: config.carryForward ?? false,
  status: config.status ? "Active" : "Inactive",
}));

        await leaveOriginService.updateStructure(structure.id, {
          leaveTypes: leaveTypesPayload,
        });
      }

      api.success({
        message: "Configuration saved successfully",
        placement: "topRight",
      });

      setIsModalVisible(false);
      form.resetFields();
      setEditingKey(null);
      refetch(); // Refresh data from server
    } catch (error) {
      console.error(error);
      api.error({
        message: "Failed to save configuration",
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };
  console.log("suborgini data", uniqueDataSource);
  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{ padding: 24 }}>
          <div>
            <Tabs
              activeKey="positions"
              onChange={(key) => {
                const routes: any = {
                  dashboard: "/leaves-dashboard",
                  // leaves: "/leaves",
                  holidays: "/government-holidays",
                  adjustments: "/leave-adjustments",
                  configuration: "/leave-type",
                  positions: "/leave-policy",
                  addLeaves: "/add-goverment-leaves",
                  "apply-leave": "/apply-leave",
                  approvals: "/leave-approvals",
                };
                if (routes[key]) router.push(routes[key]);
              }}
              items={[
                {
                  key: "dashboard",
                  label: (
                    <span>
                      <AppstoreOutlined /> Dashboard
                    </span>
                  ),
                },
                // {
                //   key: "leaves",
                //   label: (
                //     <span>
                //       <ClockCircleOutlined /> My Leave Status
                //     </span>
                //   ),
                // },
                {
                  key: "apply-leave",
                  label: (
                    <span>
                      <PlusOutlined /> Apply leave
                    </span>
                  ),
                },
                hasApprovalRights && {
                  key: "approvals",
                  label: (
                    <span>
                      <CheckCircleOutlined /> Approvals
                    </span>
                  ),
                },
                {
                  key: "holidays",
                  label: (
                    <span>
                      <ScheduleOutlined /> Government Holidays
                    </span>
                  ),
                },
                {
                  key: "adjustments",
                  label: (
                    <span>
                      <EditOutlined /> Leave Adjustment
                    </span>
                  ),
                },
                {
                  key: "configuration",
                  label: (
                    <span>
                      <SettingOutlined /> Leave Type
                    </span>
                  ),
                },
                {
                  key: "positions",
                  label: (
                    <span>
                      <ApartmentOutlined /> Leave Policy
                    </span>
                  ),
                },
                {
                  key: "addLeaves",
                  label: (
                    <span>
                      <PlusOutlined /> Add Government Leaves
                    </span>
                  ),
                },
              ].filter(Boolean) as any}
            />
          </div>
          <Card>
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
                  <ApartmentOutlined
                    style={{ color: "#1a64c4ff", fontSize: 20 }}
                  />
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
                  <Space>
                    <Tag color="processing" style={{ borderRadius: 12 }}>
                      Total Origin : {uniqueDataSource.length}
                    </Tag>
                    <Tag
                      style={{ borderRadius: 12 }}
                      icon={<CheckCircleOutlined />}
                      color="success"
                    >
                      Active :{" "}
                      {
                        uniqueDataSource.filter(
                          (item) => item.status === "Active",
                        ).length
                      }
                    </Tag>
                    <Tag
                      style={{ borderRadius: 12 }}
                      icon={<CloseCircleOutlined />}
                      color="error"
                    >
                      Inactive :{" "}
                      {
                        uniqueDataSource.filter(
                          (item) => item.status !== "Active",
                        ).length
                      }
                    </Tag>
                  </Space>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  margin: "0 0 0 28px",
                  marginBottom: 20,
                }}
              >
                {/* Search */}
                <Input.Search
                  placeholder="Search Leave Types...."
                  allowClear
                  style={{ width: 360 }}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                {/* View Switch */}
                <Segmented
                  options={[
                    {
                      label: (
                        <span>
                          <BarsOutlined />
                          Table
                        </span>
                      ),
                      value: "table",
                    },
                    {
                      label: (
                        <span>
                          <AppstoreOutlined />
                          Card
                        </span>
                      ),
                      value: "card",
                    },
                  ]}
                  value={viewType}
                  onChange={(value) => setViewType(value as string)}
                />

                {/* Button */}
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
              </div>
            </div>
            {viewType === "table" ? (
              <Table
                columns={columns}
                dataSource={uniqueDataSource.filter(
                  (item) =>
                    item.position
                      ?.toLowerCase()
                      .includes(searchText.toLowerCase()) ||
                    (Array.isArray(item.leaveType)
                      ? item.leaveType.some((t: string) =>
                          t.toLowerCase().includes(searchText.toLowerCase()),
                        )
                      : item.leaveType
                          ?.toLowerCase()
                          .includes(searchText.toLowerCase())),
                )}
                size="small"
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            ) : (
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={uniqueDataSource.filter(
                  (item) =>
                    item.position
                      ?.toLowerCase()
                      .includes(searchText.toLowerCase()) ||
                    (Array.isArray(item.leaveType)
                      ? item.leaveType.some((t: string) =>
                          t.toLowerCase().includes(searchText.toLowerCase()),
                        )
                      : item.leaveType
                          ?.toLowerCase()
                          .includes(searchText.toLowerCase())),
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
                        <Tooltip title="Edit" key="edit">
                          <EditOutlined onClick={() => handleEdit(item)} />
                        </Tooltip>,
                        <Tooltip title="Delete" key="delete">
                          <Popconfirm
                            title="Delete this entire position configuration?"
                            onConfirm={() => handleDeleteOrigin(item)}
                            okButtonProps={{
                              loading:
                                deletingKey ===
                                `${item.position}-${item.subOriginId}`,
                            }}
                            okText="Yes"
                            cancelText="No"
                            key="delete"
                            disabled={!!deletingKey}
                          >
                            <DeleteOutlined
                              style={{ color: deletingKey ? "grey" : "red" }}
                            />
                          </Popconfirm>
                        </Tooltip>,
                      ]}
                    >
                      <Card.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: "#4ea6f8",
                              fontWeight: 600,
                            }}
                          >
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
                            <span style={{ fontWeight: 600 }}>
                              {item.position}
                            </span>
                            {(() => {
                              const group = dataSource.filter(
                                (i) =>
                                  i.position === item.position &&
                                  i.subOriginId === item.subOriginId,
                              );
                              const activeCount = group.filter(
                                (i) => i.status === "Active",
                              ).length;
                              const inactiveCount = group.filter(
                                (i) => i.status !== "Active",
                              ).length;
                              return (
                                <Space size={6}>
                                  <Tag color="green">Active: {activeCount}</Tag>
                                  <Tag color="red">
                                    Inactive: {inactiveCount}
                                  </Tag>
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
                pagination={{ pageSize: 9 }}
              />
            )}
          </Card>

          <Modal
            title={
              editingKey
                ? "Edit Position Configuration"
                : "Add Position Configuration"
            }
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
              {/* Origin and Sub-Origin */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="position"
                    label="Orgin"
                    rules={[
                      {
                        required: true,
                        message: "Please select an origin type",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select Type"
                      disabled={!!editingKey}
                      options={[
                        "Grade",
                        "Department",
                        "Sub-department",
                        "Position",
                        "User",
                      ].map((p) => ({
                        label: p,
                        value: p,
                      }))}
                      onChange={() => {
                        form.setFieldsValue({ subOriginId: undefined });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="subOriginId"
                    label="Sub-Orgin"
                    rules={[
                      {
                        required: true,
                        message: "Please select a Sub-origin type",
                      },
                    ]}
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
                          ? members
                              .filter(
                                (m) =>
                                  editingKey ||
                                  !usedSubOriginIds.includes(m.value),
                              )
                              .map((m) => ({ label: m.label, value: m.value }))
                          : originType === "Grade"
                            ? grades
                                .filter(
                                  (g) =>
                                    editingKey ||
                                    !usedSubOriginIds.includes(g.id),
                                )
                                .map((g) => ({ label: g.name, value: g.id }))
                            : originType === "Department"
                              ? departments
                                  .filter(
                                    (d) =>
                                      editingKey ||
                                      !usedSubOriginIds.includes(d.id),
                                  )
                                  .map((d) => ({
                                    label: d.name,
                                    value: d.id,
                                  }))
                              : originType === "Sub-department"
                                ? subDepartments
                                    .filter(
                                      (sd) =>
                                        editingKey ||
                                        !usedSubOriginIds.includes(sd.id),
                                    )
                                    .map((sd) => ({
                                      label: sd.name,
                                      value: sd.id,
                                    }))
                                : originType === "Position"
                                  ? positions
                                      .filter(
                                        (p) =>
                                          editingKey ||
                                          !usedSubOriginIds.includes(p.id),
                                      )
                                      .map((p) => ({
                                        label: p.title,
                                        value: p.id,
                                      }))
                                  : (subOriginData[originType] || []).map(
                                      (opt) => ({
                                        label: opt,
                                        value: opt,
                                      }),
                                    )
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Dynamic Leave Config */}
              <Form.List name="leaveConfigs" initialValue={[{}]}>
  {(fields, { add, remove }) => (
    <LeaveConfigListContent
      fields={fields}
      add={add}
      remove={remove}
      form={form}
      editingKey={editingKey}
      leaveTypes={leaveTypeOptions}
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
                      return (
                        members.find((m) => m.value === text)?.label || text
                      );
                    if (currentRecord.position === "Grade")
                      return grades.find((g) => g.id === text)?.name || text;
                    if (currentRecord.position === "Department")
                      return (
                        departments.find((d) => d.id === text)?.name || text
                      );
                    if (currentRecord.position === "Sub-department")
                      return (
                        subDepartments.find((sd) => sd.id === text)?.name ||
                        text
                      );
                    if (currentRecord.position === "Position")
                      return (
                        positions.find((p) => p.id === text)?.title || text
                      );
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
                {
                  title: "Leave Type",
                  dataIndex: "leaveType",
                  key: "leaveType",
                  align: "center",
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  align: "center",
                  render: (status: string) => (
                    <Tag color={status === "Active" ? "green" : "red"}>
                      {status}
                    </Tag>
                  ),
                },
                {
                  title: "Unit",
                  dataIndex: "unit",
                  key: "unit",
                  align: "center",
                },
                // {
                //   title: "Per Month",
                //   key: "perMonth",
                //   align: "center",
                //   render: (_: any, record: PositionRecord) => {
                //     const effectiveUnit = record.unit || 0;
                //     if (record.period === "MONTH")
                //       return (
                //         <Text>
                //           {effectiveUnit}{" "}
                //           <Tag style={{ borderRadius: 10 }} color="blue">
                //             day
                //           </Tag>
                //         </Text>
                //       );
                //     if (record.period === "YEAR")
                //       return (
                //         <Text>
                //           {(effectiveUnit / 12).toFixed(1)}{" "}
                //           <Tag style={{ borderRadius: 10 }} color="blue">
                //             day
                //           </Tag>
                //         </Text>
                //       );
                //     return <Text>-</Text>;
                //   },
                // },
                // {
                //   title: "Per Year",
                //   key: "perYear",
                //   align: "center",
                //   render: (_: any, record: PositionRecord) => {
                //     const effectiveUnit = record.unit || 0;
                //     if (record.period === "MONTH")
                //       return (
                //         <Text>
                //           {effectiveUnit * 12}{" "}
                //           <Tag style={{ borderRadius: 10 }} color="blue">
                //             days
                //           </Tag>
                //         </Text>
                //       );
                //     if (record.period === "YEAR")
                //       return (
                //         <Text>
                //           {effectiveUnit}{" "}
                //           <Tag style={{ borderRadius: 10 }} color="blue">
                //             days
                //           </Tag>
                //         </Text>
                //       );
                //     return <Text>-</Text>;
                //   },
                // },
                {
  title: "Every",
  dataIndex: "accrualInterval",
  render: (value:number) => (
    <Tag color="purple">
      Every {value} months
    </Tag>
  )
},
                {
                  title: "Carry Forward",
                  dataIndex: "carryForward",
                  key: "carryForward",
                  align: "center",
                  render: (val: boolean) => (
                    <Tag color={val ? "blue" : "default"}>
                      {val ? "Yes" : "No"}
                    </Tag>
                  ),
                },
                // {
                //   title: "Total",
                //   key: "total",
                //   align: "center",
                //   render: (_: any, record: PositionRecord) => {
                //     const effectiveUnit = record.unit || 0;
                //     let total = 0;
                //     if (record.period === "MONTH") total = effectiveUnit * 12;
                //     else if (record.period === "YEAR") total = effectiveUnit;
                //     return <Text strong>{total}</Text>;
                //   },
                // },
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
                          okButtonProps={{
                            loading: deletingKey === record.key,
                          }}
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
                  item.subOriginId === currentRecord?.subOriginId,
              )}
              pagination={false}
            />
          </Drawer>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
