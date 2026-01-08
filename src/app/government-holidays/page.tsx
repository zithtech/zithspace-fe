"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Settings2 } from "lucide-react";
import {
  Card,
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
  Typography,
  Popconfirm,
  Switch,
  InputNumber,
  Divider,
  Segmented,
  Tabs,
  Checkbox,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  ScheduleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

const { Text } = Typography;
const tamilNaduHolidays = [
  {
    holiday_id: 1,
    name: "Pongal",
    from_date: "2026-01-14",
    to_date: "2026-01-14",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Fixed",
  },
  {
    holiday_id: 2,
    name: "Thai Pongal",
    from_date: "2026-01-15",
    to_date: "2026-01-15",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Fixed",
  },
  {
    holiday_id: 3,
    name: "Mattu Pongal",
    from_date: "2026-01-16",
    to_date: "2026-01-16",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Fixed",
  },
  {
    holiday_id: 4,
    name: "Tamil New Year",
    from_date: "2026-04-14",
    to_date: "2026-04-14",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Fixed",
  },
  {
    holiday_id: 5,
    name: "May Day",
    from_date: "2026-05-01",
    to_date: "2026-05-01",
    country: "IN",
    state: "TN",
    type: "National",
    rule: "Fixed",
  },
  {
    holiday_id: 6,
    name: "Kamarajar Birthday",
    from_date: "2026-07-15",
    to_date: "2026-07-15",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Fixed",
  },
  {
    holiday_id: 7,
    name: "Aadi Perukku",
    from_date: "2026-08-03",
    to_date: "2026-08-03",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Variable",
  },
  {
    holiday_id: 8,
    name: "Krishna Jayanthi",
    from_date: "2026-08-29",
    to_date: "2026-08-29",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Variable",
  },
  {
    holiday_id: 9,
    name: "Vinayagar Chaturthi",
    from_date: "2026-09-14",
    to_date: "2026-09-14",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Variable",
  },
  {
    holiday_id: 10,
    name: "Milad-un-Nabi",
    from_date: "2026-09-26",
    to_date: "2026-09-26",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Variable",
  },
  {
    holiday_id: 11,
    name: "Gandhi Jayanthi",
    from_date: "2026-10-02",
    to_date: "2026-10-02",
    country: "IN",
    state: "TN",
    type: "National",
    rule: "Fixed",
  },
  {
    holiday_id: 12,
    name: "Ayudha Pooja",
    from_date: "2026-10-19",
    to_date: "2026-10-19",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Variable",
  },
  {
    holiday_id: 13,
    name: "Vijaya Dashami",
    from_date: "2026-10-20",
    to_date: "2026-10-20",
    country: "IN",
    state: "TN",
    type: "State",
    rule: "Variable",
  },
  {
    holiday_id: 14,
    name: "Deepavali",
    from_date: "2026-11-08",
    to_date: "2026-11-08",
    country: "IN",
    state: "TN",
    type: "National",
    rule: "Variable",
  },
  {
    holiday_id: 15,
    name: "Christmas",
    from_date: "2026-12-25",
    to_date: "2026-12-25",
    country: "IN",
    state: "TN",
    type: "National",
    rule: "Fixed",
  },
];

export default function GovernmentHolidaysPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [apiHolidaysSource, setApiHolidaysSource] =
    useState<any[]>(tamilNaduHolidays);
  // Holidays State
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [modalCountry, setModalCountry] = useState("");
  const [modalYear, setModalYear] = useState("2026");
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<number[]>([]);
  const [holidayTableData, setHolidayTableData] = useState<any[]>([]);

  // Edit Holiday State
  const [editHolidayModalVisible, setEditHolidayModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [editBaseDays, setEditBaseDays] = useState(1);
  const [editExtraDays, setEditExtraDays] = useState(0);
  const [editExtraPosition, setEditExtraPosition] = useState<
    "before" | "after"
  >("after");

  //   const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/holidays");
        setApiHolidaysSource(response.data);
      } catch (error) {
        console.log("error to be finded in fetchHolidays", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, [api]);

  // Filter holidays for modal based on country
  const filteredModalHolidays = apiHolidaysSource.filter(
    (h) => h.country === modalCountry
  );

  const handleEditHoliday = (record: any) => {
    setEditingHoliday(record);
    setEditBaseDays(record.base);
    setEditExtraDays(record.extra);
    setEditExtraPosition(record.extraPosition || "after");
    setEditHolidayModalVisible(true);
  };

  const handleSaveHolidayAdjustment = () => {
    if (!editingHoliday) return;

    const base = Number(editBaseDays) || 1;
    const extra = Number(editExtraDays) || 0;
    const position = editExtraPosition;
    const total = base + extra;

    // Use originalFromDate if available, otherwise fallback to current fromDate (for migration/safety)
    const originalStart =
      editingHoliday.originalFromDate || editingHoliday.fromDate;

    let newFromDate = originalStart;
    let newToDate;

    if (position === "before") {
      // If extra days are before, shift start date back. End date is determined by base days from original start.
      newFromDate = dayjs(originalStart)
        .subtract(extra, "day")
        .format("YYYY-MM-DD");
      newToDate = dayjs(originalStart)
        .add(Math.max(0, base - 1), "day")
        .format("YYYY-MM-DD");
    } else {
      // If extra days are after, start date is original. End date extends by base + extra.
      newFromDate = originalStart;
      newToDate = dayjs(originalStart)
        .add(Math.max(0, base + extra - 1), "day")
        .format("YYYY-MM-DD");
    }

    setHolidayTableData((prev) =>
      prev.map((row) =>
        row.key === editingHoliday.key
          ? {
              ...row,
              base: base,
              extra: extra,
              extraPosition: position,
              total: total,
              fromDate: newFromDate,
              toDate: newToDate,
              originalFromDate: originalStart, // Ensure original date is preserved
            }
          : row
      )
    );
    api.success({
      message: "Holiday duration adjusted",
      placement: "bottomRight",
      duration: 1,
    });
    setEditHolidayModalVisible(false);
  };

  const handleDeleteHoliday = (recordKey: number) => {
    setHolidayTableData((prev) => prev.filter((row) => row.key !== recordKey));
    api.success({
      message: "Holiday deleted successfully",
      placement: "bottomRight",
      duration: 1,
    });
  };

  const handleStatusChange = (checked: boolean, recordKey: number) => {
    const holiday = holidayTableData.find((h) => h.key === recordKey);
    const name = holiday ? holiday.holidayName : "Holiday";

    setHolidayTableData((prev) =>
      prev.map((row) =>
        row.key === recordKey ? { ...row, status: checked } : row
      )
    );

    if (checked) {
      api.success({
        message: `${name} Activated Sucessfully`,
        placement: "bottomRight",
        duration: 1,
      });
    } else {
      api.info({
        message: `${name} Deactivated Sucessfully`,
        placement: "bottomRight",
        duration: 1,
      });
    }
  };

  const handleAddHolidays = () => {
    const existingKeys = new Set(holidayTableData.map((r) => r.key));
    const newHolidayIds = selectedHolidayIds.filter(
      (id) => !existingKeys.has(id)
    );

    if (newHolidayIds.length === 0) {
      api.warning({
        message: "Data Already Added",
        description: "You have already added the selected holidays.",
        placement: "bottomRight",
        duration: 1,
      });
      return;
    }

    const selected = apiHolidaysSource.filter((h) =>
      newHolidayIds.includes(h.holiday_id)
    );

    const newRows = selected.map((holiday) => ({
      key: holiday.holiday_id,
      holidayName: holiday.name,
      fromDate: holiday.from_date,
      toDate: holiday.to_date,
      originalFromDate: holiday.from_date,
      original: 1,
      base: 1,
      extra: 0,
      extraPosition: "after",
      total: 1,
      location: holiday.country === "IN" ? "India" : "USA",
      type: holiday.type,
      rule: holiday.rule,
      status: true,
    }));

    setHolidayTableData((prev) => [...prev, ...newRows]);

    setHolidayModalVisible(false);
    setSelectedHolidayIds([]);
    api.success({
      message: "Holidays added successfully",
      placement: "bottomRight",
      duration: 1,
    });
  };

  const holidayColumns = [
    {
      title: "Holiday Name",
      dataIndex: "holidayName",
      key: "holidayName",
      render: (text: string, record: any) => (
        <Space>
          <Text strong>{text}</Text>
          {(record.base !== record.original || record.extra !== 0) && (
            <Tag color="orange">Adjusted</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "From Date",
      dataIndex: "fromDate",
      key: "fromDate",
      render: (date: string) => (
        <Text>{date ? dayjs(date).format("MMM DD, YYYY") : "-"}</Text>
      ),
    },
    {
      title: "To Date",
      dataIndex: "toDate",
      key: "toDate",
      render: (date: string) => (
        <Text>{date ? dayjs(date).format("MMM DD, YYYY") : "-"}</Text>
      ),
    },
    {
      title: "Base",
      dataIndex: "base",
      key: "base",
      align: "center" as const,
      render: (val: number, record: any) => {
        const diff = val - record.original;
        return (
          <Space size={2}>
            <Text>{val}</Text>
            {diff !== 0 && (
              <Text
                type={diff > 0 ? "success" : "danger"}
                style={{ fontSize: 11 }}
              >
                ({diff > 0 ? `+${diff}` : diff})
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Extra",
      dataIndex: "extra",
      key: "extra",
      align: "center" as const,
      render: (val: number) => (
        <Text type={val > 0 ? "success" : val < 0 ? "danger" : "secondary"}>
          {val > 0 ? `+${val}` : val}
        </Text>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (val: any) => <Text>{val}</Text>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Rule",
      dataIndex: "rule",
      key: "rule",
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record: any) => (
        <Switch
          checked={status}
          //  disabled={!isAdmin}
          onChange={(checked) => handleStatusChange(checked, record.key)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: any, record: any) => (
        <Space style={{ gap: 20 }}>
           <Tooltip title="Edit Leave Type">
          <Button
            size="small"
            icon={<Settings2 size={16} />}
            onClick={() => handleEditHoliday(record)}
          ></Button>
          </Tooltip>
          <Popconfirm
            title="Delete this holiday?"
            onConfirm={() => handleDeleteHoliday(record.key)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modalTableColumns = [
    {
      title: "Select",
      dataIndex: "select",
      key: "Select",
      width: 50,
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedHolidayIds.includes(record.holiday_id)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedHolidayIds((prev) =>
              checked
                ? [...prev, record.holiday_id]
                : prev.filter((id) => id !== record.holiday_id)
            );
          }}
        />
      ),
    },
    {
      title: "Holiday Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "From Date",
      dataIndex: "from_date",
      key: "from_date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "To Date",
      dataIndex: "to_date",
      key: "to_date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Rule",
      dataIndex: "rule",
      key: "rule",
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          {contextHolder}

          <div style={{ marginBottom: 16 }}>
            <Tabs
              activeKey={
                pathname.includes("leave-adjustments")
                  ? "adjustments"
                  : pathname.includes("leaves")
                  ? "leaves"
                  : pathname.includes("leave-configuration")
                  ? "configuration"
                  : "holidays"
              }
              onChange={(key) => {
                if (key === "leaves") router.push("/leaves");
                if (key === "holidays") router.push("/government-holidays");
                if (key === "adjustments") router.push("/leave-adjustments");
                if (key === "configuration") router.push("/leave-configuration");
              }}
              items={[
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
                  <ScheduleOutlined
                    style={{ color: "#1a64c4ff", fontSize: 20 }}
                  />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Government Holidays
                  </Typography.Title>
                </Space>
                <div style={{ marginLeft: 28, marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Manage official government holidays for your organization
                  </Text>
                </div>
                <div style={{ marginTop: 8, marginLeft: 28 }}>
                  <Space>
                    <Tag color="processing">
                      Total: {holidayTableData.length}
                    </Tag>
                    <Tag color="success">
                      Active: {holidayTableData.filter((h) => h.status).length}
                    </Tag>
                    <Tag color="default">
                      Inactive:{" "}
                      {holidayTableData.filter((h) => !h.status).length}
                    </Tag>
                  </Space>
                </div>
              </div>

              <Button
                type="primary"
                style={{ height: 40 }}
                onClick={() => setHolidayModalVisible(true)}
              >
                + Apply Government Holidays
              </Button>
            </div>
            <Divider />
            <Table
              columns={holidayColumns as any}
              dataSource={holidayTableData}
              rowKey="key"
              pagination={{ pageSize: 8 }}
              //   scroll={{ y: 300 }}
              style={{ borderRadius: 8 }}
            />
          </Card>

          {/* Modals */}
          <Modal
            title="Apply Government Holidays"
            open={holidayModalVisible}
            onCancel={() => setHolidayModalVisible(false)}
            width={760}
            style={{ bottom: 20 }}
            footer={[
              <Button
                key="cancel"
                onClick={() => setHolidayModalVisible(false)}
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                disabled={selectedHolidayIds.length === 0}
                onClick={handleAddHolidays}
              >
                Add Holidays
              </Button>,
            ]}
          >
            <Card
              size="small"
              style={{
                marginBottom: 12,
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
              <Row gutter={12} align="middle">
                <Col span={6}>
                  <Typography.Text strong>Country</Typography.Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={modalCountry}
                    onChange={setModalCountry}
                    options={[
                      { label: "India", value: "IN" },
                      { label: "USA", value: "US" },
                    ]}
                  />
                </Col>
                <Col span={6}>
                  <Typography.Text strong>Year</Typography.Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={modalYear}
                    onChange={setModalYear}
                    options={[
                      { label: "2025", value: 2025 },
                      { label: "2026", value: 2026 },
                    ]}
                  />
                </Col>
                <Col span={6} />
                <Col span={6} style={{ textAlign: "right" }}>
                  <Space>
                    <Button
                      size="small"
                      onClick={() =>
                        setSelectedHolidayIds(
                          filteredModalHolidays.map((h) => h.holiday_id)
                        )
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedHolidayIds([])}
                    >
                      Deselect
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
            <Table
              loading={loading}
              columns={modalTableColumns}
              dataSource={filteredModalHolidays}
              rowKey="holiday_id"
              pagination={false}
              scroll={{ y: 300 }}
              size="middle"
              bordered
              style={{ borderRadius: 8 }}
            />
          </Modal>

          <Modal
            title={
              <Space>
                <ClockCircleOutlined />
                <span>Update Holidays</span>
              </Space>
            }
            open={editHolidayModalVisible}
            onCancel={() => setEditHolidayModalVisible(false)}
            onOk={handleSaveHolidayAdjustment}
            okText="Update Holidays"
            width={500}
          >
            {/* Edit Modal Content */}
            <p style={{ marginBottom: 16, color: "#666" }}>
              Adjust base leave days and add extra leave for this holiday.
            </p>

            {editingHoliday && (
              <>
                <Card
                  style={{ background: "#f5f5f5", marginBottom: 24 }}
                  size="small"
                  bordered={false}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        {editingHoliday.holidayName}
                      </Typography.Text>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {dayjs(editingHoliday.fromDate).format("MMM DD, YYYY")}
                      </div>
                    </div>
                    <Tag color="blue">{editingHoliday.type}</Tag>
                  </div>
                </Card>

                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={12}>
                    <Typography.Text strong>Base Leave Days</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      <InputNumber
                        min={1}
                        max={365}
                        value={editBaseDays}
                        onChange={(val) => setEditBaseDays(val || 1)}
                        style={{ width: "100%" }}
                        addonBefore="Days"
                        disabled
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>Extra Leave</Typography.Text>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <InputNumber
                        min={-10}
                        max={10}
                        value={editExtraDays}
                        onChange={(val) => setEditExtraDays(val || 0)}
                        style={{ flex: 1 }}
                        addonBefore="Days"
                      />
                    </div>
                  </Col>
                </Row>
                <div style={{ marginBottom: 24 }}>
                  <Typography.Text strong>Extra Leave Position</Typography.Text>
                  <Select
                    value={editExtraPosition}
                    onChange={setEditExtraPosition}
                    style={{ width: "100%", marginTop: 8 }}
                    options={[
                      { label: "Add After Holiday", value: "after" },
                      { label: "Add Before Holiday", value: "before" },
                    ]}
                  />
                </div>

                <Card size="small" title="New Duration Summary">
                  <Row
                    gutter={16}
                    style={{ textAlign: "center", marginBottom: 12 }}
                  >
                    <Col span={8}>
                      <Statistic title="Base" value={editBaseDays} />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Extra"
                        value={editExtraDays}
                        prefix={editExtraDays > 0 ? "+" : ""}
                        valueStyle={{
                          color: editExtraDays !== 0 ? "#faad14" : "inherit",
                        }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Total Duration"
                        value={editBaseDays + editExtraDays}
                        suffix="Days"
                        valueStyle={{ color: "#1677ff", fontWeight: "bold" }}
                      />
                    </Col>
                  </Row>
                  <div
                    style={{
                      textAlign: "center",
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: 12,
                    }}
                  >
                    <Typography.Text type="secondary">
                      Effective Dates
                    </Typography.Text>
                    <div
                      style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}
                    >
                      {(() => {
                        const base = Number(editBaseDays) || 1;
                        const extra = Number(editExtraDays) || 0;
                        const start =
                          editingHoliday.originalFromDate ||
                          editingHoliday.fromDate;
                        let from, to;
                        if (editExtraPosition === "before") {
                          from = dayjs(start).subtract(extra, "day");
                          to = dayjs(start).add(Math.max(0, base - 1), "day");
                        } else {
                          from = dayjs(start);
                          to = dayjs(start).add(
                            Math.max(0, base + extra - 1),
                            "day"
                          );
                        }
                        return `${from.format("MMM DD")} - ${to.format(
                          "MMM DD, YYYY"
                        )}`;
                      })()}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
