"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Settings2,Columns3Cog } from 'lucide-react';
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
} from "antd";
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
import leaveService, { Leave, ApplyLeaveData } from "@/services/leaveService";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;

const LEAVE_TYPES = [
  "Work From Home",
  "Casual Leave",
  "Sick Leave",
];

const subOriginData: Record<string, string[]> = {
  Grade: ["Entry Level", "Associate", "Senior Associate", "Manager", "Senior Manager", "Director"],
  Employee: ["IT", "Non-IT", "Contract"],
  Department: ["Engineering", "Product", "Human Resources", "Finance", "Operations"],
  "Sub-department": ["Frontend Development", "Backend Development", "DevOps", "Product Design", "Product Analytics", "Talent Acquisition", "Employee Relations"],
  Position: ["Software Engineer", "Senior Software Engineer", "Engineering Manager", "Backend Developer", "Engineering Director", "Product Manager", "Head of Product", "HR Specialist", "HR Manager", "Intern", "Full Time", "Contract"],
};

interface PositionRecord {
  key: string;
  position: string;
  status: string;
  leaveType?: string | string[];
  unit?: number;
  period?: string;
  carryForward?: number;
  totalLeaves?: number;
  subOrigin?: string;
}

export default function positionConfiguration(){
    const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const originType = Form.useWatch("position", form);
  const leaveConfigs = Form.useWatch("leaveConfigs", form);
  const [loading, setLoading] = useState(false);    
  const [viewType, setViewType] = useState("table");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editMode, setEditMode] = useState<"group" | "single">("group");
  const [currentRecord, setCurrentRecord] = useState<PositionRecord | null>(null);

  const [dataSource, setDataSource] = useState<PositionRecord[]>([]);

  useEffect(() => {
    setDataSource([
      {
        key: "1",
        position: "Position",
        subOrigin: "Intern",
        status: "Active",
        leaveType: "Casual Leave",
        unit: 1,
        period: "MONTH",
        carryForward: 0,
        totalLeaves: 12,
      },
      {
        key: "2",
        position: "Position",
        subOrigin: "Intern",
        status: "Active",
        leaveType: "Sick Leave",
        unit: 0.5,
        period: "MONTH",
        carryForward: 0,
        totalLeaves: 6,
      },
      {
        key: "3",
        position: "Position",
        subOrigin: "Full Time",
        status: "Active",
        leaveType: "Casual Leave",
        unit: 1.5,
        period: "MONTH",
        carryForward: 5,
        totalLeaves: 18,
      },
      {
        key: "4",
        position: "Position",
        subOrigin: "Full Time",
        status: "Active",
        leaveType: "Sick Leave",
        unit: 1,
        period: "MONTH",
        carryForward: 10,
        totalLeaves: 12,
      },
      {
        key: "5",
        position: "Position",
        subOrigin: "Full Time",
        status: "Active",
        leaveType: "Work From Home",
        unit: 1,
        period: "MONTH",
        carryForward: 10,
        totalLeaves: 15,
      },
      {
        key: "6",
        position: "Position",
        subOrigin: "Contract",
        status: "Inactive",
        leaveType: "Casual Leave",
        unit: 1,
        period: "MONTH",
        carryForward: 0,
        totalLeaves: 0,
      },
    ]);
  }, []);

  const uniqueDataSource = Object.values(
    dataSource.reduce((acc, item) => {
      const key = `${item.position}-${item.subOrigin}`;
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
    }, {} as Record<string, PositionRecord>)
  );

  const columns = [
    {
      title: "Orgin",
      dataIndex: "position",
      key: "position",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Sub-Orgin",
      dataIndex: "subOrigin",
      key: "subOrigin",
      render: (text: string) => <Text strong>{text || "-"}</Text>,
    },
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      key: "leaveType",
      render: (text: string | string[]) => {
        const tagStyle: React.CSSProperties = {
          fontSize: 11,
          whiteSpace: "normal",
          height: "auto",
          lineHeight: 1.3,
          padding: "1px 6px",
        };
        const tags = Array.isArray(text) ? text : (text ? [text] : []);
        const visibleTags = tags.slice(0, 4);
        const hiddenTags = tags.slice(2);

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {visibleTags.map((t) => (
              <Tag color="blue" key={t} style={tagStyle}>
                {t}
              </Tag>
            ))}
            {hiddenTags.length > 0 && (
              <Tooltip title={hiddenTags.join(", ")}>
                <Tag color="blue" style={tagStyle}>
                  +{hiddenTags.length} More
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
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
              title="Are you sure you want to delete?"
              onConfirm={() => handleDelete(record.key)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
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
      (item) => item.position === record.position && item.subOrigin === record.subOrigin
    );

    setEditingKey(record.key);

    const leaveConfigsForForm = configsForPosition.map((config) => ({
      leaveType: config.leaveType,
      unit: config.unit,
      period: config.period,
      carryForward: config.carryForward,
      status: config.status === "Active",
    }));

    form.setFieldsValue({
      position: record.position,
      subOrigin: record.subOrigin,
      leaveConfigs: leaveConfigsForForm.length > 0 ? leaveConfigsForForm : [{}],
    });
    setIsModalVisible(true);
  };

  const handleDrawerEdit = (record: any) => {
    setEditMode("single");
    setEditingKey(record.key);
    form.setFieldsValue({
      position: record.position,
      leaveConfigs: [{
        leaveType: record.leaveType,
        unit: record.unit,
        period: record.period,
        carryForward: record.carryForward,
        status: record.status === "Active",
      }],
    });
    setIsModalVisible(true);
  };

  const handleDelete = (key: string) => {
    setDataSource((prev) => prev.filter((item) => item.key !== key));
    api.success({
      message: "Configuration deleted successfully",
      placement: "bottomRight",
    });
  };

  const handleSave = (values: any) => {
    const { position, subOrigin, leaveConfigs } = values;
    
    const newEntries = leaveConfigs.map((config: any) => ({
      position,
      subOrigin,
      leaveType: config.leaveType,
      unit: config.unit,
      period: config.period,
      carryForward: config.carryForward,
      status: config.status ? "Active" : "Inactive",
      totalLeaves: config.unit,
    }));

    if (editingKey) {
      if (editMode === "single") {
        setDataSource((prev) =>
          prev.map((item) =>
            item.key === editingKey ? { ...item, ...newEntries[0] } : item
          )
        );
      } else {
        // We are editing. The position is `position`.
        setDataSource((prev) => {
          // Remove old entries for this position
          const otherPositionsData = prev.filter(item => 
            item.position !== position || item.subOrigin !== subOrigin);
          // Add new entries
          const entriesWithKeys = newEntries.map((entry: any) => ({
            ...entry,
            key: Date.now().toString() + Math.random(),
          }));
          return [...otherPositionsData, ...entriesWithKeys];
        });
      }
      api.success({
        message: "Configuration updated successfully",
        placement: "bottomRight",
      });
    } else {
      const entriesWithKeys = newEntries.map((entry: any) => ({
        ...entry,
        key: Date.now().toString() + Math.random(),
      }));
      setDataSource((prev) => [...prev, ...entriesWithKeys]);
      api.success({
        message: "Configuration added successfully",
        placement: "bottomRight",
      });
    }
    setIsModalVisible(false);
    form.resetFields();
    setEditingKey(null);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{ padding: 24 }}> 
          <div>
        
          </div>
           <div style={{ marginBottom: 16 }}>  
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
    {
      key: "dashboard",
      label: (
        <span>
          <AppstoreOutlined /> Dashboard
        </span>
      ),
    },
    {
      key: "leaves",
      label: (
        <span>
          <ClockCircleOutlined /> My Leave Status
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
          <SettingOutlined /> Leave Configuration
        </span>
      ),
    },
    {
      key: "positions",
      label: (
        <span>
          <ApartmentOutlined /> Position Configuration
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
  ]}
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
                  <ApartmentOutlined style={{ color: "#1a64c4ff", fontSize: 20 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Position Configuration
                  </Typography.Title>
                </Space>
                <div style={{ marginLeft: 28, marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Configure leave types and assign limits per position.
                  </Text>
                </div>
              </div>
<div
  style={{
    display: "flex",
    gap: 12,
    margin: "8px 0 0 28px",
    alignItems: "center",
    flexWrap: "wrap",
  }}
>
  {/* Search */}
  <Input.Search
    size="large"
    placeholder="Search Leave Types...."
    allowClear
    style={{ width: 360 }}
    onChange={(e) => setSearchText(e.target.value)}
  />

  {/* View Switch */}
  <Segmented
    size="large"
    options={[
      {
        label: (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BarsOutlined />
            Table
          </span>
        ),
        value: "table",
      },
      {
        label: (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
    size="large"
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
                onRow={(record) => ({
                  onClick: (event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest(".ant-btn")) {
                      return;
                    }
                    handleView(record);
                  },
                  style: { cursor: "pointer" },
                })}
                columns={columns}
                dataSource={uniqueDataSource.filter(
                  (item) =>
                    item.position
                      ?.toLowerCase()
                      .includes(searchText.toLowerCase()) ||
                    (Array.isArray(item.leaveType)
                      ? item.leaveType.some((t: string) =>
                          t.toLowerCase().includes(searchText.toLowerCase())
                        )
                      : item.leaveType
                          ?.toLowerCase()
                          .includes(searchText.toLowerCase()))
                )}
                style={{ marginTop: 24 }}
                pagination={{ pageSize: 6 }}
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
                          t.toLowerCase().includes(searchText.toLowerCase())
                        )
                      : item.leaveType
                          ?.toLowerCase()
                          .includes(searchText.toLowerCase()))
                )}
                renderItem={(item) => (
                  <List.Item>
                    <Card
                      hoverable
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest(".ant-card-actions")) {
                          return;
                        }
                        handleView(item);
                      }}
                      actions={[
                        <Tooltip title="View" key="view">
                          <EyeOutlined onClick={() => handleView(item)} />
                        </Tooltip>,
                        <Tooltip title="Edit" key="edit">
                          <EditOutlined onClick={() => handleEdit(item)} />
                        </Tooltip>,
                        <Tooltip title="Delete" key="delete">
                          <Popconfirm
                            title="Are you sure you want to delete?"
                            onConfirm={() => handleDelete(item.key)}
                            okText="Yes"
                            cancelText="No"
                            key="delete"
                          >
                            <DeleteOutlined style={{ color: "red" }} />
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
      <span style={{ fontWeight: 600 }}>{item.position}</span>
      <Tag
        color={item.status === "Active" ? "green" : "red"}
        style={{ marginRight: 0 }}
      >
        {item.status}
      </Tag>
    </div>
  }
  description={
    <div style={{ marginTop: 12 }}>
      <Text
        type="secondary"
        style={{ fontSize: 12, display: "block", marginBottom: 6 }}
      >
        Leave Types
      </Text>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {(() => {
          const tags = Array.isArray(item.leaveType)
            ? item.leaveType
            : item.leaveType
            ? [item.leaveType]
            : [];

          const visibleTags = tags.slice(0, 3);
          const hiddenTags = tags.slice(3);

          return (
            <>
              {visibleTags.map((t) => (
                <Tag
                  key={t}
                  color="blue"
                  style={{
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </Tag>
              ))}

              {hiddenTags.length > 0 && (
                <Tooltip title={hiddenTags.join(", ")}>
                  <Tag
                    color="default"
                    style={{
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    +{hiddenTags.length} more
                  </Tag>
                </Tooltip>
              )}
            </>
          );
        })()}
      </div>
    </div>
  }
/>

                    </Card>
                  </List.Item>
                )}
                style={{ marginTop: 24 }}
                pagination={{ pageSize: 6 }}
              />
            )}
          </Card>

        <Modal
  title={editingKey ? "Edit Position Configuration" : "Add Position Configuration"}
  open={isModalVisible}
  onCancel={() => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingKey(null);
  }}
  onOk={() => form.submit()}
  destroyOnClose
  width={500}
>
  <Form form={form} layout="vertical" onFinish={handleSave}>
    {/* Origin and Sub-Origin */}
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
            options={["Grade", "Employee", "Department", "Sub-department", "Position"].map(p => ({
              label: p,
              value: p,
            }))}
            onChange={() => {
              form.setFieldsValue({ subOrigin: undefined });
            }}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="subOrigin" 
        label="Sub-Orgin"
        rules={[{ required: true, message: "Please select a Sub-origin type" }]}
        >
          <Select
            placeholder="Select Name"
            disabled={!originType}
            options={(subOriginData[originType] || []).map(opt => ({
              label: opt,
              value: opt,
            }))}
          />
        </Form.Item>
      </Col>
    </Row>

    {/* Dynamic Leave Config */}
    <Form.List name="leaveConfigs" initialValue={[{}]}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => {
            const selectedInOtherRows = (leaveConfigs || [])
              .filter((_: any, index: number) => index !== name)
              .flatMap((item: any) => {
                const types = item?.leaveType;
                if (Array.isArray(types)) return types;
                if (typeof types === "string") return [types];
                return [];
              });

            return (
            <div
              key={key}
              style={{
                border: "1px solid #e5e5e5",
                padding: 12,
                borderRadius: 6,
                marginBottom: 12,
              }}
            >
              {/* Leave Type + Unit + Period */}
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
                    style={{width:100}}
                  >
                    <Select
                      options={[
                        { label: "Per Month", value: "MONTH" },
                        { label: "Per Year", value: "YEAR" },
                      ]} 
                    />
                  </Form.Item>
                </Col>

                <Col span={2} style={{ marginTop: 26,left:50 }}>
                  {fields.length > 1 && (
                    <Popconfirm
                      title="Are you sure you want to delete?"
                      onConfirm={() => remove(name)}
                    >
                      <Button danger>
                        <DeleteOutlined />
                      </Button>
                    </Popconfirm>
                  )}
                </Col>
              </Row>

              {/* Carry Forward + Status */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    {...restField}
                    name={[name, "carryForward"]}
                    label="Carry Forward"
                  >
                    <InputNumber min={0} style={{ width: "100%" }} disabled={!editingKey} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 16,
                    }}
                  >
                    <span>Status</span>
                    <Form.Item
                      {...restField}
                      name={[name, "status"]}
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Switch/>
                    </Form.Item>
                  </div>
                  <div style={{ fontSize: 10, marginTop: 4 }}>
                    Leave type is active
                  </div>
                </Col>
              </Row>
            </div>
          )})}

          <Button type="dashed" block onClick={() => add()}>
            + Add Another Leave Type
          </Button>
        </>
      )}
    </Form.List>
  </Form>
</Modal>

<Drawer
  title={currentRecord ? `${currentRecord.position} - ${currentRecord.subOrigin}` : "Details"}
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
        render: (text: string | string[]) => {
          const tags = Array.isArray(text) ? text : (text ? [text] : []);
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {tags.map((t) => (
                <Tag color="blue" key={t}>
                  {t}
                </Tag>
              ))}
            </div>
          );
        },
      },
      {
        title: "Unit",
        dataIndex: "unit",
        key: "unit",
      },
      {
        title: "Per Month",
        key: "perMonth",
        render: (_: any, record: PositionRecord) => {
          const effectiveUnit = (record.unit || 0) + (record.carryForward || 0);
          if (record.period === "MONTH") return <Text>{effectiveUnit} <Tag style={{ borderRadius: 10 }} color="blue">day</Tag></Text>;
          if (record.period === "YEAR") return <Text>{(effectiveUnit / 12).toFixed(1)} <Tag style={{ borderRadius: 10 }} color="blue">day</Tag></Text>;
          return <Text>-</Text>;
        },
      },
      {
        title: "Per Year",
        key: "perYear",
        render: (_: any, record: PositionRecord) => {
          const effectiveUnit = (record.unit || 0) + (record.carryForward || 0);
          if (record.period === "MONTH") return <Text>{effectiveUnit * 12} <Tag style={{ borderRadius: 10 }} color="blue">days</Tag></Text>;
          if (record.period === "YEAR") return <Text>{effectiveUnit} <Tag style={{ borderRadius: 10 }} color="blue">days</Tag></Text>;
          return <Text>-</Text>;
        },
      },
      {
        title: "Carry Forward",
        dataIndex: "carryForward",
        key: "carryForward",
        render: (val: number) => (
          <Tag color={val > 0 ? "blue" : "default"}>{val || 0}</Tag>
        ),
      },
      {
        title: "Total",
        key: "total",
        render: (_: any, record: PositionRecord) => {
          const effectiveUnit = (record.unit || 0) + (record.carryForward || 0);
          let total = 0;
          if (record.period === "MONTH") total = effectiveUnit * 12;
          else if (record.period === "YEAR") total = effectiveUnit;
          return <Text strong>{total}</Text>;
        },
      },
      {
        title: "Action",
        key: "action",
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
                onConfirm={() => handleDelete(record.key)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ]}
    dataSource={dataSource.filter((item) => item.position === currentRecord?.position && item.subOrigin === currentRecord?.subOrigin)}
    pagination={false}
  />
</Drawer>


        </div>
        </MainLayout>
      </ProtectedRoute>
    );
       
}    