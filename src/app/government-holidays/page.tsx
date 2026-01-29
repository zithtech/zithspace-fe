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
  ApartmentOutlined,
  AppstoreOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter, usePathname } from "next/navigation";
import { Country, ICountry } from "country-state-city";
import { FixedHolidayService, FixedHoliday } from "@/services/addHolidays";
import {
  useCompanyGovernmentHolidays,
} from "@/hooks/useCompanyGovernmentHolidays";
import { CompanyGovernmentHoliday, CreateHolidayPayload, UpdateHolidayPayload } from "@/services/companyGovernmentHolidayService";

const { Text } = Typography;

export default function GovernmentHolidaysPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
  const {
    holidays,
    loading: holidaysLoading,
    error,
    fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  } = useCompanyGovernmentHolidays();
  const [dataSource, setDataSource] = useState<CompanyGovernmentHoliday[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [apiHolidaysSource, setApiHolidaysSource] =useState<FixedHoliday[]>([]);
  // Holidays State
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [modalCountry, setModalCountry] = useState("IN");
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<(number | string)[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  // Edit Holiday State
  const [editHolidayModalVisible, setEditHolidayModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyGovernmentHoliday | null>(null);
  const [editBaseDays, setEditBaseDays] = useState(1);
  const [editExtraDays, setEditExtraDays] = useState(0);
  const [editExtraPosition, setEditExtraPosition] = useState< 
    "before" | "after"
  >("after");

  //   const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    const fetchSourceHolidays = async () => {
      setModalLoading(true);
      try {
        const data = await FixedHolidayService.getFixedHolidays();
        setApiHolidaysSource(data);
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
        message.error("Failed to fetch source holidays");
      } finally {
        setModalLoading(false);
      }
    };
    fetchSourceHolidays();
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    // Keep the local dataSource in sync with the data from the hook
    setDataSource(holidays);
  }, [holidays]);

  // Filter holidays for modal based on country
  const filteredModalHolidays = apiHolidaysSource.filter(
    (h) => {
      const isCountryMatch = h.country === modalCountry;
      const isAlreadyAdded = holidays.some(
        (added) =>
          added.holidayName === h.holidayName &&
          added.country === h.country &&
          dayjs(added.fromDate).isSame(dayjs(h.fromDate), "day")
      );
      return isCountryMatch && !isAlreadyAdded;
    }
  );

  const handleEditHoliday = (record: CompanyGovernmentHoliday) => {
    setEditingHoliday(record);
    setEditBaseDays(record.baseLeave);
    setEditExtraDays(record.extraLeave);
    setEditExtraPosition(record.rule === 'before' ? 'before' : 'after');
    setEditHolidayModalVisible(true);
  };

  const handleSaveHolidayAdjustment = async () => {
    if (!editingHoliday) return;

    const base = Number(editBaseDays) || 1;
    const extra = Number(editExtraDays) || 0;
    const position = editExtraPosition;
    const total = base + extra;

    const originalHoliday = apiHolidaysSource.find(
      (h) =>
        h.holidayName === editingHoliday.holidayName &&
        h.country === editingHoliday.country
    );

    if (!originalHoliday) {
      api.error({
        message: "Cannot Adjust Holiday",
        description: "Could not find the original holiday definition to calculate date adjustments. The holiday might have been removed from the source list.",
        placement: "topRight",
      });
      return;
    }

    const originalStart = originalHoliday.fromDate;

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

    const payload: UpdateHolidayPayload = {
      baseLeave: base,
      extraLeave: extra,
      totalLeave: total,
      fromDate: newFromDate,
      toDate: newToDate,
      rule: position,
    };

    try {
      await updateHoliday(editingHoliday.id, payload);
      api.success({
        message: "Holiday duration adjusted",
        placement: "topRight",
        duration: 1,
      });
      setEditHolidayModalVisible(false);
    } catch (error: any) {
      api.error({
        message: "Failed to save adjustment",
        description: error.message || "An unexpected error occurred.",
        placement: "topRight",
      });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      api.success({
        message: "Holiday deleted successfully",
        placement: "topRight",
        duration: 1,
      });
    } catch (error: any) {
      message.error(error.message || "Failed to delete holiday.");
    }
  };

  const handleStatusChange = (checked: boolean, recordKey: number | string) => {
    const holiday = holidays.find((h) => h.id === recordKey);
    const name = holiday ? holiday.holidayName : "Holiday"; 

    updateHoliday(recordKey as string, { status: checked ? 'ACTIVE' : 'INACTIVE' }).catch((err) => {
      message.error(err.message || "Failed to update status.");
      // Re-fetch to revert UI state on error
      fetchHolidays();
    });


    if (checked) {
      api.success({
        message: `${name} Activated Sucessfully`,
        placement: "topRight",
        duration: 1,
      });
    } else {
      api.info({
        message: `${name} Deactivated Sucessfully`,
        placement: "topRight",
        duration: 1,
      });
    }
  };

  const handleFloaterChange = (checked: boolean, record: CompanyGovernmentHoliday) => {
    updateHoliday(record.id, { isFloater: checked }).catch((err) => {
      message.error(err.message || "Failed to update floater status.");
      fetchHolidays();
    });
  };

  const handleAddHolidays = async () => {
    setIsAdding(true);

    const creationPromises = selectedHolidayIds.map((holidayId) => {
      const holidayData = apiHolidaysSource.find((h) => h.id === holidayId);
      if (!holidayData) {
        // This case should ideally not happen if UI is in sync
        return Promise.reject(
          new Error(`Holiday with id ${holidayId} not found.`),
        );
      }
      const payload: CreateHolidayPayload = {
        holidayName: holidayData.holidayName,
        country: holidayData.country,
        fromDate: holidayData.fromDate,
        toDate: holidayData.toDate,
        baseLeave: 1,
        extraLeave: 0,
        totalLeave: 1,
        type: holidayData.type,
        isFloater: false, // Defaulting to false
        rule: holidayData.rule,
        status: "ACTIVE",
      };
      return createHoliday(payload);
    });

    try {
      await Promise.all(creationPromises);
      api.success({ message: "Holidays added successfully!" });
      // After successful creation, refetch the list of holidays to update the table.
      await fetchHolidays();
    } catch (error: any) {
      api.error({ message: "Failed to add holidays", description: error.message });
    } finally {
      setIsAdding(false);
      setHolidayModalVisible(false);
      setSelectedHolidayIds([]);
    }
  };


  const holidayColumns = [
    {
      title: "Holiday Name",
      dataIndex: "holidayName",
      key: "holidayName",
      render: (text: string, record: CompanyGovernmentHoliday) => (
        <Space>
          <Text strong>{text}</Text>
          {(record.baseLeave !== 1 || record.extraLeave !== 0) && (
            <Tag color="orange">Adjusted</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (isoCode: string) => <Text>{Country.getCountryByCode(isoCode)?.name || isoCode}</Text>,
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
      dataIndex: "baseLeave",
      key: "baseLeave",
      align: "center" as const,
      render: (val: number) => {
        const diff = val - 1;
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
      dataIndex: "extraLeave",
      key: "extraLeave",
      align: "center" as const,
      render: (val: number) => (
        <Text type={val > 0 ? "success" : val < 0 ? "danger" : "secondary"}>
          {val > 0 ? `+${val}` : val}
        </Text>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalLeave",
      key: "totalLeave",
      render: (val: any) => <Text>{val}</Text>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Floater Leave",
      dataIndex: "isFloater",
      key: "isFloater",
      align: "center" as const,
      render: (isFloater: boolean, record: CompanyGovernmentHoliday) => (
        <Switch
          checked={isFloater}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          style={{ backgroundColor: isFloater ? '#52c41a' : '#f5222d' }}
          onChange={(checked) => handleFloaterChange(checked, record)}
        />
      ),
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
      render: (status: 'ACTIVE' | 'INACTIVE', record: CompanyGovernmentHoliday) => (
        <Switch
          checked={status === 'ACTIVE'}
          //  disabled={!isAdmin}
          onChange={(checked) => handleStatusChange(checked, record.id)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: any, record: CompanyGovernmentHoliday) => (
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
            onConfirm={() => handleDeleteHoliday(record.id)}
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
          checked={selectedHolidayIds.includes(record.id)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedHolidayIds((prev) =>
              checked
                ? [...prev, record.id]
                : prev.filter((id) => id !== record.id)
            );
          }}
        />
      ),
    },
    {
      title: "Holiday Name",
      dataIndex: "holidayName",
      key: "holidayName",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "From Date",
      dataIndex: "fromDate",
      key: "fromDate",
    render: (date: string | Date) => (
  <Text>
    {date ? dayjs(typeof date === 'string' ? date : date.toISOString()).format("MMM DD, YYYY") : "-"}
  </Text>
),

    },
    {
      title: "To Date",
      dataIndex: "toDate",
      key: "toDate",
render: (date: string | Date) => (
  <Text>
    {date ? dayjs(typeof date === 'string' ? date : date.toISOString()).format("MMM DD, YYYY") : "-"}
  </Text>
),

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
                  : pathname.includes("leaves-dashboard")
                  ? "dashboard"
                  : pathname.includes("leaves")
                  ? "leaves"
                  : pathname.includes("leave-configuration")
                  ? "configuration"
                  : pathname.includes("position-configuration")
                  ? "positions"
                  : "holidays"
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
                      <ClockCircleOutlined /> Apply Leave
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
                      Total: {holidays.length}
                    </Tag>
                    <Tag color="success">
                      Active: {holidays.filter((h) => h.status === 'ACTIVE').length}
                    </Tag>
                    <Tag color="default">
                      Inactive:{" "}
                      {holidays.filter((h) => h.status === 'INACTIVE').length}
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
  loading={holidaysLoading}
  columns={holidayColumns as any}
  dataSource={dataSource}
  rowKey="id"
  pagination={{ pageSize: 10 }}
  key={dataSource.length}  // Keep the re-render strategy, but based on the new dataSource
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
                loading={isAdding}
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
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={Country.getAllCountries().map((c: ICountry) => ({
                      label: c.name,
                      value: c.isoCode,
                    }))}
                  />
                </Col>
                {/* <Col span={6}>
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
                </Col> */}
                <Col span={9} />
                <Col span={9} style={{ textAlign: "right" }}>
                  <Space>
                    <Button
                      size="small"
                      onClick={() =>
                        setSelectedHolidayIds(
                          filteredModalHolidays.map((h) => h.id)
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
              loading={modalLoading}
              columns={modalTableColumns}
              dataSource={filteredModalHolidays}
              rowKey="id"
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
                        if (!editingHoliday) return "";

                        const originalHoliday = apiHolidaysSource.find(
                          (h) =>
                            h.holidayName === editingHoliday.holidayName &&
                            h.country === editingHoliday.country
                        );

                        const start = originalHoliday
                          ? originalHoliday.fromDate
                          : editingHoliday.fromDate;
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
