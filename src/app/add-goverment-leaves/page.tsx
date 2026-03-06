"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Button,
  Typography,
  Space,
  Tabs,
  Divider,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Collapse,
} from "antd";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  SettingOutlined,
  ApartmentOutlined,
  PlusOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { Country, State } from "country-state-city";
import { FixedHolidayService, FixedHoliday } from "@/services/addHolidays";

const { Text } = Typography;

const OPTIONS = [
  { label: "All", value: "ALL" },
  { label: "Public", value: "Public" },
  { label: "National", value: "National" },
  { label: "State", value: "State" },
];

const HolidayCollapse = ({ fields, add, remove, form }: any) => {
  const [activeKey, setActiveKey] = useState<string | string[]>([]);
  const prevLengthRef = useRef(fields.length);

  useEffect(() => {
    if (fields.length > prevLengthRef.current) {
      const lastKey = fields[fields.length - 1].key.toString();
      setActiveKey(lastKey);
    }
    prevLengthRef.current = fields.length;
  }, [fields.length]);

  useEffect(() => {
    if (fields.length > 0 && activeKey.length === 0) {
      setActiveKey(fields[0].key.toString());
    }
  }, []);

  const items = fields.map(
    ({ key, name, ...restField }: any, index: number) => ({
      key: key.toString(),
      label: `Holiday ${index + 1}`,
      extra:
        fields.length > 1 ? (
          <DeleteOutlined
            onClick={(e) => {
              e.stopPropagation();
              remove(name);
            }}
            style={{ color: "red" }}
          />
        ) : null,
      children: (
        <>
          <Form.Item
            {...restField}
            name={[name, "holidayName"]}
            label="Holiday Name"
            rules={[{ required: true, message: "Please input holiday name!" }]}
          >
            <Input placeholder="Enter holiday name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                {...restField}
                name={[name, "country"]}
                label="Country"
                rules={[{ required: true, message: "Please select country!" }]}
              >
                <Select
                  placeholder="Select Country"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={Country.getAllCountries().map((c) => ({
                    label: c.name,
                    value: c.isoCode,
                  }))}
                  onChange={() => {
                    const holidays = form.getFieldValue("holidays");
                    if (holidays && holidays[name]) {
                      holidays[name].state = undefined;
                      form.setFieldsValue({ holidays });
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.holidays?.[name]?.country !==
                    currentValues.holidays?.[name]?.country ||
                  prevValues.holidays?.[name]?.state !==
                    currentValues.holidays?.[name]?.state
                }
              >
                {() => {
                  const countryCode = form.getFieldValue([
                    "holidays",
                    name,
                    "country",
                  ]);
                  const states = countryCode
                    ? State.getStatesOfCountry(countryCode)
                    : [];
                  const stateOptions = states.map((s) => ({
                    label: s.name,
                    value: s.isoCode,
                  }));

                  if (stateOptions.length > 0) {
                    stateOptions.unshift({ label: "All States", value: "ALL" });
                  } else if (countryCode) {
                    stateOptions.push({ label: "No State", value: "NO_STATE" });
                  }

                  const currentStateValue =
                    form.getFieldValue(["holidays", name, "state"]) || [];
                  const isAllSelected = currentStateValue.includes("ALL");

                  const handleStateChange = (selectedValues: string[]) => {
                    const allStateCodes = states.map((s) => s.isoCode);
                    const prevValues =
                      form.getFieldValue(["holidays", name, "state"]) || [];

                    if (selectedValues.includes("ALL")) {
                      if (!prevValues.includes("ALL")) {
                        return ["ALL", ...allStateCodes];
                      } else {
                        const realStates = selectedValues.filter(
                          (v) => v !== "ALL",
                        );
                        if (realStates.length < allStateCodes.length) {
                          return realStates;
                        } else {
                          return selectedValues;
                        }
                      }
                    } else {
                      if (prevValues.includes("ALL")) {
                        return [];
                      } else {
                        if (
                          selectedValues.length === allStateCodes.length &&
                          allStateCodes.length > 0
                        ) {
                          return ["ALL", ...selectedValues];
                        } else {
                          return selectedValues;
                        }
                      }
                    }
                  };

                  return (
                    <Form.Item
                      {...restField}
                      name={[name, "state"]}
                      label="State"
                      rules={[
                        { required: true, message: "Please select state!" },
                      ]}
                      getValueFromEvent={handleStateChange}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Select State"
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={stateOptions}
                        disabled={!countryCode}
                        maxTagCount={2}
                        listHeight={200}
                        dropdownRender={(menu) => (
                          <div>
                            {menu}
                            {isAllSelected && (
                              <div
                                style={{
                                  padding: "8px",
                                  fontSize: 12,
                                  color: "#666",
                                }}
                              >
                                ✓ All states selected
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                {...restField}
                name={[name, "fromDate"]}
                label="From Date"
                rules={[
                  { required: true, message: "Please select from date!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                {...restField}
                name={[name, "toDate"]}
                label="To Date"
                rules={[{ required: true, message: "Please select to date!" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                {...restField}
                name={[name, "type"]}
                label="Type"
                rules={[{ required: true, message: "Please select type!" }]}
              >
                <Select
                  size="small"
                  placeholder="Select Type"
                  options={OPTIONS}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                {...restField}
                name={[name, "rule"]}
                label="Rule"
                rules={[{ required: true, message: "Please input rule!" }]}
              >
                <Input size="small" placeholder="Rule code / note" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    }),
  );

  return (
    <>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        items={items}
      />
      <Button
        type="dashed"
        block
        onClick={() => add()}
        icon={<PlusOutlined />}
        style={{ marginTop: 16 }}
      >
        Add Another Holiday
      </Button>
    </>
  );
};

export default function governmentLeaves() {
  const { user } = useAuth();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<FixedHoliday[]>([]);
  const [editingKey, setEditingKey] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allHolidays, setAllHolidays] = useState<FixedHoliday[]>([]);
  const [filterCountry, setFilterCountry] = useState<string | null>("IN"); // Default to India
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<dayjs.Dayjs | null>(dayjs()); // Default to current month
  const [form] = Form.useForm();

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await FixedHolidayService.getFixedHolidays();
      setAllHolidays(data);
    } catch (error) {
      message.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    let filtered = [...allHolidays];

    if (filterCountry) {
      filtered = filtered.filter((h) => h.country === filterCountry);
    }

    if (filterState) {
      filtered = filtered.filter((h) => {
        const states = Array.isArray(h.state)
          ? h.state
          : h.state
            ? [h.state]
            : [];
        return states.includes("ALL") || states.includes(filterState);
      });
    }

    if (filterMonth) {
      const targetMonth = filterMonth.month();
      const targetYear = filterMonth.year();
      filtered = filtered.filter((h) => {
        if (!h.fromDate) return false;
        const date = dayjs(h.fromDate);
        return date.month() === targetMonth && date.year() === targetYear;
      });
    }

    setDataSource(filtered);
  }, [allHolidays, filterCountry, filterState, filterMonth]);

  const showModal = () => {
    setIsModalOpen(true);
    setEditingKey(null);
  };

  const handleEdit = (record: FixedHoliday) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      holidays: [
        {
          ...record,
          fromDate: record.fromDate ? dayjs(record.fromDate) : null,
          toDate: record.toDate ? dayjs(record.toDate) : null,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    try {
      setLoading(true);
      await FixedHolidayService.deleteFixedHoliday(id as string);
      message.success("Deleted successfully");
      setAllHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      message.error("Failed to delete holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);
        const holidays = values.holidays || [];
        try {
          if (editingKey) {
            const editedItem = holidays[0];
            const payload = {
              ...editedItem,
              fromDate: editedItem.fromDate
                ? editedItem.fromDate.format("YYYY-MM-DD")
                : null,
              toDate: editedItem.toDate
                ? editedItem.toDate.format("YYYY-MM-DD")
                : null,
            };
            const updatedHoliday = await FixedHolidayService.updateFixedHoliday(
              editingKey as string,
              payload,
            );
            setAllHolidays((prev) =>
              prev.map((h) => (h.id === editingKey ? updatedHoliday : h)),
            );
            message.success("Government leave updated successfully");
          } else {
            const promises = holidays.map((holiday: any) => {
              const payload = {
                ...holiday,
                fromDate: holiday.fromDate
                  ? holiday.fromDate.format("YYYY-MM-DD")
                  : null,
                toDate: holiday.toDate
                  ? holiday.toDate.format("YYYY-MM-DD")
                  : null,
              };
              return FixedHolidayService.createFixedHoliday(payload);
            });
            const newHolidays = await Promise.all(promises);
            setAllHolidays((prev) => [...prev, ...newHolidays]);
            message.success("Government leaves added successfully");
            // If new holidays were added, adjust filters to show them
            if (newHolidays.length > 0) {
              const firstNewHoliday = newHolidays[0];
              setFilterCountry(firstNewHoliday.country);
              // Clear state filter to ensure visibility, as it might not match the new country
              setFilterState(null);
              if (firstNewHoliday.fromDate)
                setFilterMonth(dayjs(firstNewHoliday.fromDate));
            }
          }
          setIsModalOpen(false);
          form.resetFields();
          setEditingKey(null);
        } catch (error) {
          message.error("Operation failed");
          console.error(error);
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingKey(null);
  };

  const columns: ColumnsType<FixedHoliday> = [
    {
      title: "Holiday Name",
      dataIndex: "holidayName",
      key: "holidayName",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (code: string) => {
        const countryName = Country.getCountryByCode(code)?.name || code;
        return <Tag color="geekblue">{countryName}</Tag>;
      },
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (stateCodes: string | string[], record: FixedHoliday) => {
        const codes = Array.isArray(stateCodes)
          ? stateCodes
          : stateCodes
            ? [stateCodes]
            : [];
        if (codes.includes("ALL")) {
          return <Tag color="blue">All States</Tag>;
        }
        const stateNames = codes.map((code) => {
          if (code === "NO_STATE") return "No State";
          return (
            State.getStateByCodeAndCountry(code, record.country)?.name || code
          );
        });
        const visibleTags = stateNames.slice(0, 2);
        const hiddenTags = stateNames.slice(2);
        return (
          <Space size={[0, 4]} wrap>
            {visibleTags.map((name) => (
              <Tag key={name} color="blue">
                {name}
              </Tag>
            ))}
            {hiddenTags.length > 0 && (
              <Tooltip title={hiddenTags.join(", ")}>
                <Tag color="blue">+{hiddenTags.length} More</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "From Date",
      dataIndex: "fromDate",
      key: "fromDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "To Date",
      dataIndex: "toDate",
      key: "toDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Rule",
      dataIndex: "rule",
      key: "rule",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "blue" }} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete the holiday"
            description="Are you sure to delete this holiday?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "red" }} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          {/* Tabs Navigation */}
          <div>
            <Tabs
              activeKey="addLeaves"
              onChange={(key) => {
                const routes: any = {
                  dashboard: "/leaves-dashboard",
                  // leaves: "/leaves",
                  holidays: "/government-holidays",
                  adjustments: "/leave-adjustments",
                  configuration: "/leave-type",
                  positions: "/leave-policy",
                  addLeaves: "/add-goverment-leaves",
                  applyleave: "/apply-leave",
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
                //       <ClockCircleOutlined /> Apply Leave
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
                    Added the Goverment Holidays
                  </Typography.Title>
                </Space>
                <div style={{ marginLeft: 28, marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Handle special employee-specific leave cases, comp-offs, and
                    manual corrections.
                  </Text>
                </div>
                <div style={{ marginTop: 8, marginLeft: 28 }}>
                  <Space>
                    <Tag color="processing" style={{ borderRadius: 10 }}>
                      Total leave: {allHolidays.length}
                    </Tag>
                    <Tag color="success" style={{ borderRadius: 10 }}>
                      Total Month: {dataSource.length}
                    </Tag>
                  </Space>
                </div>
              </div>

              <Space>
                <Select
                  placeholder="Select Country"
                  style={{ width: 150 }}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={Country.getAllCountries().map((c) => ({
                    label: c.name,
                    value: c.isoCode,
                  }))}
                  onChange={(val) => {
                    setFilterCountry(val);
                    setFilterState(null);
                  }}
                  value={filterCountry}
                />
                <Select
                  placeholder="Select State"
                  style={{ width: 150 }}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={
                    filterCountry
                      ? State.getStatesOfCountry(filterCountry).map((s) => ({
                          label: s.name,
                          value: s.isoCode,
                        }))
                      : []
                  }
                  onChange={setFilterState}
                  value={filterState}
                  disabled={!filterCountry}
                />
                <DatePicker
                  picker="month"
                  placeholder="Select Month"
                  style={{ width: 150 }}
                  onChange={setFilterMonth}
                  value={filterMonth}
                  format="MMMM"
                />
                <Button
                  icon={<PlusOutlined />}
                  style={{ height: 40 }}
                  type="primary"
                  onClick={showModal}
                >
                  Add goverment leaves
                </Button>
              </Space>
            </div>
            <Divider />
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
        <Modal
          title={
            editingKey ? "Edit Government Leaves" : "Add Government Leaves"
          }
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            name="add_leave_form"
            initialValues={{ holidays: [{}] }}
          >
            <Form.List name="holidays">
              {(fields, { add, remove }) => (
                <HolidayCollapse
                  fields={fields}
                  add={add}
                  remove={remove}
                  form={form}
                />
              )}
            </Form.List>
          </Form>
        </Modal>
      </MainLayout>
    </ProtectedRoute>
  );
}
