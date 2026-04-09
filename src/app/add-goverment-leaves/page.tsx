"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Button,
  Typography,
  Space,
  Divider,
  Table,
  Tag,
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
  Drawer,
} from "antd";
import {
  Globe,
  MapPin,
  Calendar,
  Plus,
  Search,
  Settings2,
  Trash2,
  Edit3,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  Info,
  CheckCircle2,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { Country, State } from "country-state-city";
import { FixedHolidayService, FixedHoliday } from "@/services/addHolidays";

const { Text, Title } = Typography;

const OPTIONS = [
  { label: "Public", value: "Public" },
  { label: "National", value: "National" },
  { label: "State", value: "State" },
  { label: "Company", value: "Company" },
];

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color, background: `${color}12`, padding: 12, borderRadius: 12 }}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

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

  const items = fields.map(({ key, name, ...restField }: any, index: number) => ({
    key: key.toString(),
    label: (
      <Space>
        <div style={{ background: "var(--bg-slate-100)", width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--text-slate-500)" }}>
          {index + 1}
        </div>
        <Text strong style={{ color: "var(--text-slate-900)" }}>{form.getFieldValue(["holidays", name, "holidayName"]) || `New Holiday`}</Text>
      </Space>
    ),
    extra: fields.length > 1 ? (
      <Button
        type="text"
        danger
        icon={<Trash2 size={16} />}
        onClick={(e) => { e.stopPropagation(); remove(name); }}
      />
    ) : null,
    children: (
      <div style={{ padding: "0 4px" }}>
        <Form.Item
          {...restField}
          name={[name, "holidayName"]}
          label="Holiday Name"
          rules={[{ required: true, message: "Please input holiday name!" }]}
        >
          <Input placeholder="Enter holiday name" style={{ borderRadius: 8 }} />
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
                style={{ borderRadius: 8 }}
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                options={Country.getAllCountries().map((c) => ({ label: c.name, value: c.isoCode }))}
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
                prevValues.holidays?.[name]?.country !== currentValues.holidays?.[name]?.country
              }
            >
              {() => {
                const countryCode = form.getFieldValue(["holidays", name, "country"]);
                const states = countryCode ? State.getStatesOfCountry(countryCode) : [];
                const stateOptions = states.map((s) => ({ label: s.name, value: s.isoCode }));

                if (stateOptions.length > 0) {
                  stateOptions.unshift({ label: "All States", value: "ALL" });
                } else if (countryCode) {
                  stateOptions.push({ label: "No State", value: "NO_STATE" });
                }

                return (
                  <Form.Item
                    {...restField}
                    name={[name, "state"]}
                    label="State"
                    rules={[{ required: true, message: "Please select state!" }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select State"
                      showSearch
                      style={{ borderRadius: 8 }}
                      options={stateOptions}
                      disabled={!countryCode}
                      maxTagCount="responsive"
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
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
              rules={[{ required: true, message: "Please select from date!" }]}
            >
              <DatePicker style={{ width: "100%", borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              {...restField}
              name={[name, "toDate"]}
              label="To Date"
              rules={[{ required: true, message: "Please select to date!" }]}
            >
              <DatePicker style={{ width: "100%", borderRadius: 8 }} />
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
              <Select placeholder="Select Type" options={OPTIONS} style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              {...restField}
              name={[name, "rule"]}
              label="Rule / Note"
              rules={[{ required: true, message: "Please input rule!" }]}
            >
              <Input placeholder="Rule code or note" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    ),
  }));

  return (
    <>
      <Collapse
        accordion
        activeKey={activeKey}
        onChange={setActiveKey}
        items={items}
        expandIcon={({ isActive }) => <ChevronRight size={16} style={{ transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />}
        style={{ background: "transparent", border: "none" }}
      />
      <Button
        type="dashed"
        block
        onClick={() => add()}
        icon={<Plus size={16} />}
        style={{ marginTop: 16, height: 44, borderRadius: 12, borderColor: "var(--border-slate-200)", color: "var(--text-slate-500)", background: "transparent" }}
      >
        Add Another Holiday
      </Button>
    </>
  );
};

export default function GovernmentLeavesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { canManageLeaves } = usePermission();
  const router = useRouter();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dataSource, setDataSource] = useState<FixedHoliday[]>([]);
  const [editingKey, setEditingKey] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allHolidays, setAllHolidays] = useState<FixedHoliday[]>([]);
  const [filterCountry, setFilterCountry] = useState<string | null>("IN");
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<dayjs.Dayjs | null>(dayjs());
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

  useEffect(() => { fetchHolidays(); }, []);

  useEffect(() => {
    let filtered = [...allHolidays];
    if (filterCountry) filtered = filtered.filter((h) => h.country === filterCountry);
    if (filterState) {
      filtered = filtered.filter((h) => {
        const states = Array.isArray(h.state) ? h.state : h.state ? [h.state] : [];
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

  const showDrawer = () => {
    setIsDrawerOpen(true);
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ holidays: [{ country: "IN", type: "Public" }] });
  };

  const handleEdit = (record: FixedHoliday) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      holidays: [{
        ...record,
        fromDate: record.fromDate ? dayjs(record.fromDate) : null,
        toDate: record.toDate ? dayjs(record.toDate) : null,
      }],
    });
    setIsDrawerOpen(true);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const holidays = values.holidays || [];

      if (editingKey) {
        const editedItem = holidays[0];
        const payload = {
          ...editedItem,
          fromDate: editedItem.fromDate?.format("YYYY-MM-DD"),
          toDate: editedItem.toDate?.format("YYYY-MM-DD"),
        };
        const updated = await FixedHolidayService.updateFixedHoliday(editingKey as string, payload);
        setAllHolidays(prev => prev.map(h => (h.id === editingKey ? updated : h)));
        message.success("Update successful");
      } else {
        const promises = holidays.map((h: any) => FixedHolidayService.createFixedHoliday({
          ...h,
          fromDate: h.fromDate?.format("YYYY-MM-DD"),
          toDate: h.toDate?.format("YYYY-MM-DD"),
        }));
        const newHolidays = await Promise.all(promises);
        setAllHolidays(prev => [...prev, ...newHolidays]);
        message.success(`${newHolidays.length} holidays added`);
      }
      setIsDrawerOpen(false);
      form.resetFields();
    } catch (error) {
      message.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<FixedHoliday> = [
    {
      title: "Holiday Name",
      dataIndex: "holidayName",
      key: "holidayName",
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-blue-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--premium-blue)" }}>
            <Calendar size={14} />
          </div>
          <Text strong style={{ color: "var(--text-slate-900)" }}>{text}</Text>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_, record) => {
        const countryName = Country.getCountryByCode(record.country)?.name || record.country;
        return (
          <Space direction="vertical" size={2}>
            <Tag color="blue" style={{ borderRadius: 6, margin: 0, background: "var(--bg-blue-50)", color: "var(--premium-blue)", border: 0 }}>{countryName}</Tag>
            <Text style={{ fontSize: 11, color: "var(--text-slate-500)" }}>
              {Array.isArray(record.state) ? record.state.join(", ") : record.state || "All Regions"}
            </Text>
          </Space>
        );
      }
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-200)" }}>
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{dayjs(record.fromDate).format("MMM DD")}</Text>
          </div>
          <ArrowRight size={14} color="var(--text-slate-400)" />
          <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-200)" }}>
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{dayjs(record.toDate).format("MMM DD, YYYY")}</Text>
          </div>
        </div>
      )
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag style={{ borderRadius: 20, background: "var(--bg-slate-100)", border: "1px solid var(--border-slate-200)", color: "var(--text-slate-500)", fontWeight: 500 }}>
          {type}
        </Tag>
      )
    },
    {
      title: "Rule / Note",
      dataIndex: "rule",
      key: "rule",
      render: (text) => <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{text || "—"}</Text>
    },
    {
      title: "Actions",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="text"
            size="small"
            icon={<Edit3 size={16} />}
            onClick={() => handleEdit(record)}
            style={{ color: "var(--premium-blue)", background: "var(--bg-blue-50)", borderRadius: 6 }}
          />
          <Popconfirm
            title="Delete holiday?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={16} />}
              style={{ background: "#fef2f2", borderRadius: 6 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (authLoading) return null;
  if (!canManageLeaves) {
    router.push('/dashboard');
    return null;
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "var(--bg-secondary)", minHeight: "calc(100vh - 64px)" }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Space size={14} align="center">
                <div style={{ background: "var(--bg-blue-50)", padding: 12, borderRadius: 14, color: "var(--premium-blue)", display: "flex" }}>
                  <Settings2 size={28} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Holiday Configuration</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Manage global government holiday data sources and regional settings.</Text>
                </div>
              </Space>
            </div>
            <Button
              icon={<Plus size={18} />}
              type="primary"
              onClick={showDrawer}
              style={{ height: 44, borderRadius: 12, fontWeight: 600, padding: "0 24px", background: "var(--premium-blue)" }}
            >
              Add Holiday Source
            </Button>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <StatCard label="Global Holiday Base" value={allHolidays.length} icon={Globe} color="#2563eb" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Regional Context" value={dataSource.length} icon={MapPin} color="#7c3aed" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Monthly Focus" value={filterMonth?.format("MMMM") || "All Time"} icon={Calendar} color="#10b981" />
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0 24px 0", borderColor: "var(--border-slate-100)" }} />

          {/* Filters */}
          <div style={{ marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-slate-500)", fontSize: 14, fontWeight: 500, marginRight: 8 }}>
              <Filter size={18} /> Filters:
            </div>
            <Select
              placeholder="Country"
              style={{ width: 180 }}
              showSearch
              allowClear
              options={Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }))}
              onChange={val => { setFilterCountry(val); setFilterState(null); }}
              value={filterCountry}
              className="premium-select"
            />
            {/* <Select
              placeholder="State / Region"
              style={{ width: 220 }}
              showSearch
              allowClear
              disabled={!filterCountry}
              options={filterCountry ? State.getStatesOfCountry(filterCountry).map(s => ({ label: s.name, value: s.isoCode })) : []}
              onChange={setFilterState}
              value={filterState}
              className="premium-select"
            /> */}
            <Select
              placeholder="State / Region"
              style={{ width: 220 }}
              showSearch
              allowClear
              disabled={!filterCountry}
              options={
                filterCountry
                  ? State.getStatesOfCountry(filterCountry).map(s => ({
                    label: s.name,
                    value: s.isoCode
                  }))
                  : []
              }
              optionFilterProp="label"
              onChange={setFilterState}
              value={filterState}
              className="premium-select"
            />
            <DatePicker
              picker="month"
              placeholder="Target Month"
              style={{ width: 180 }}
              onChange={setFilterMonth}
              value={filterMonth}
              format="MMMM YYYY"
              className="premium-select"
            />
          </div>

          <Card
            bordered={false}
            style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", overflow: "hidden" }}
            bodyStyle={{ padding: "0" }}
          >
            <Table
              loading={loading}
              columns={columns as any}
              dataSource={dataSource}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, position: ["bottomRight"], style: { padding: "12px 24px", margin: 0 } }}
              rowClassName={() => "history-table-row"}
              scroll={{ x: 1000 }}
            />
          </Card>

          <Drawer
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)" }}>
                  {editingKey ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <Text strong style={{ fontSize: 18, color: "var(--text-slate-900)" }}>{editingKey ? "Edit Holiday Source" : "Add Holiday Sources"}</Text>
              </div>
            }
            width={520}
            onClose={() => setIsDrawerOpen(false)}
            open={isDrawerOpen}
            headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
            bodyStyle={{ padding: "24px", background: "var(--bg-pure-white)" }}
            footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "16px 8px" }}>
                <Button onClick={() => setIsDrawerOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading} style={{ borderRadius: 8, padding: "0 24px", background: "var(--premium-blue)" }}>
                  {editingKey ? "Update Holiday" : "Create Holidays"}
                </Button>
              </div>
            }
          >
            <Form form={form} layout="vertical" initialValues={{ holidays: [{}] }}>
              <Form.List name="holidays">
                {(fields, { add, remove }) => (
                  <HolidayCollapse fields={fields} add={add} remove={remove} form={form} />
                )}
              </Form.List>
            </Form>
          </Drawer>

          <style dangerouslySetInnerHTML={{
            __html: `
            .history-table-row:hover { background-color: var(--bg-slate-50) !important; }
            .ant-table-thead > tr > th {
              background-color: var(--bg-slate-100) !important;
              color: var(--text-slate-500) !important;
              font-weight: 600 !important;
              border-bottom: 2px solid var(--border-slate-200) !important;
              padding: 12px 20px !important;
            }
            .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-50) !important; padding: 16px 20px !important; color: var(--text-slate-900) !important; }
            .premium-select .ant-select-selector { border-radius: 12px !important; height: 44px !important; display: flex !important; alignItems: center !important; background: var(--bg-pure-white) !important; border: 1px solid var(--border-slate-200) !important; }
            .ant-collapse > .ant-collapse-item { border: 1px solid var(--border-slate-100); border-radius: 12px !important; margin-bottom: 12px; overflow: hidden; background: var(--bg-pure-white); }
            .ant-collapse > .ant-collapse-item > .ant-collapse-header { background: var(--bg-slate-50); padding: 12px 16px; color: var(--text-slate-900) !important; }
            .ant-pagination-item a { color: var(--text-slate-500) !important; }
            .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
          `}} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
