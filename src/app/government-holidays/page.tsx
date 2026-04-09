"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Settings2,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Globe,
  Clock,
  Check,
  X,
  ArrowRight
} from "lucide-react";
import {
  Card,
  Select,
  Button,
  Table,
  Tag,
  message,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Popconfirm,
  Switch,
  InputNumber,
  Checkbox,
  Tooltip,
  Drawer,
  Input,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Country, ICountry } from "country-state-city";
import { FixedHolidayService, FixedHoliday } from "@/services/addHolidays";
import { useCompanyGovernmentHolidays } from "@/hooks/useCompanyGovernmentHolidays";
import {
  CompanyGovernmentHoliday,
  CreateHolidayPayload,
  UpdateHolidayPayload,
} from "@/services/companyGovernmentHolidayService";

const { Text, Title } = Typography;

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

export default function GovernmentHolidaysPage() {
  const { isLoading: authLoading } = useAuth();
  const { canManageLeaves } = usePermission();
  const router = useRouter();
  const [api, contextHolder] = notification.useNotification();

  const {
    holidays,
    loading: holidaysLoading,
    fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  } = useCompanyGovernmentHolidays();

  const [dataSource, setDataSource] = useState<CompanyGovernmentHoliday[]>([]);
  const [searchText, setSearchText] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [apiHolidaysSource, setApiHolidaysSource] = useState<FixedHoliday[]>([]);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [modalCountry, setModalCountry] = useState("IN");
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<(number | string)[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editHolidayModalVisible, setEditHolidayModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyGovernmentHoliday | null>(null);
  const [editBaseDays, setEditBaseDays] = useState(1);
  const [editExtraDays, setEditExtraDays] = useState(0);
  const [editExtraPosition, setEditExtraPosition] = useState<"before" | "after">("after");

  useEffect(() => {
    if (!authLoading && !canManageLeaves) {
      router.push('/dashboard');
    }
  }, [authLoading, canManageLeaves, router]);

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
    if (searchText) {
      const filtered = holidays.filter(h =>
        h.holidayName.toLowerCase().includes(searchText.toLowerCase()) ||
        (Country.getCountryByCode(h.country)?.name || "").toLowerCase().includes(searchText.toLowerCase())
      );
      setDataSource(filtered);
    } else {
      setDataSource(holidays);
    }
  }, [holidays, searchText]);

  if (authLoading || !canManageLeaves) return null;

  const filteredModalHolidays = apiHolidaysSource.filter((h) => {
    const isCountryMatch = h.country === modalCountry;
    const isAlreadyAdded = holidays.some(
      (added) =>
        added.holidayName === h.holidayName &&
        added.country === h.country &&
        dayjs(added.fromDate).isSame(dayjs(h.fromDate), "day"),
    );
    return isCountryMatch && !isAlreadyAdded;
  });

  const handleEditHoliday = (record: CompanyGovernmentHoliday) => {
    setEditingHoliday(record);
    setEditBaseDays(record.baseLeave);
    setEditExtraDays(record.extraLeave);
    setEditExtraPosition(record.rule === "before" ? "before" : "after");
    setEditHolidayModalVisible(true);
  };

  const handleSaveHolidayAdjustment = async () => {
    if (!editingHoliday) return;

    const base = Number(editBaseDays) || 1;
    const extra = Number(editExtraDays) || 0;
    const position = editExtraPosition;
    const total = base + extra;

    const originalHoliday = apiHolidaysSource.find(
      (h) => h.holidayName === editingHoliday.holidayName && h.country === editingHoliday.country
    );

    if (!originalHoliday) {
      api.error({ message: "Cannot Adjust Holiday", description: "Original holiday definition not found." });
      return;
    }

    const originalStart = originalHoliday.fromDate;
    let newFromDate = originalStart;
    let newToDate;

    if (position === "before") {
      newFromDate = dayjs(originalStart).subtract(extra, "day").format("YYYY-MM-DD");
      newToDate = dayjs(originalStart).add(Math.max(0, base - 1), "day").format("YYYY-MM-DD");
    } else {
      newFromDate = originalStart;
      newToDate = dayjs(originalStart).add(Math.max(0, base + extra - 1), "day").format("YYYY-MM-DD");
    }

    try {
      await updateHoliday(editingHoliday.id, {
        baseLeave: base,
        extraLeave: extra,
        totalLeave: total,
        fromDate: newFromDate,
        toDate: newToDate,
        rule: position,
      });
      api.success({ message: "Holiday adjusted successfully" });
      setEditHolidayModalVisible(false);
    } catch (error: any) {
      api.error({ message: "Adjustment failed", description: error.message });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      api.success({ message: "Holiday deleted successfully" });
    } catch (error: any) {
      message.error(error.message || "Failed to delete holiday");
    }
  };

  const handleStatusChange = (checked: boolean, recordKey: string) => {
    const holiday = holidays.find((h) => h.id === recordKey);
    const name = holiday ? holiday.holidayName : "Holiday";

    updateHoliday(recordKey, { status: checked ? "ACTIVE" : "INACTIVE" }).catch(() => {
      message.error("Status update failed");
      fetchHolidays();
    });

    if (checked) api.success({ message: `${name} Activated` });
    else api.info({ message: `${name} Deactivated` });
  };

  const handleFloaterChange = (checked: boolean, record: CompanyGovernmentHoliday) => {
    updateHoliday(record.id, { isFloater: checked }).catch(() => message.error("Floater update failed"));
  };

  const handleAddHolidays = async () => {
    setIsAdding(true);
    const creationPromises = selectedHolidayIds.map((holidayId) => {
      const holidayData = apiHolidaysSource.find((h) => h.id === holidayId);
      if (!holidayData) return Promise.reject(new Error("Holiday not found"));
      return createHoliday({
        holidayName: holidayData.holidayName,
        country: holidayData.country,
        fromDate: holidayData.fromDate,
        toDate: holidayData.toDate,
        baseLeave: 1,
        extraLeave: 0,
        totalLeave: 1,
        type: holidayData.type,
        isFloater: false,
        rule: holidayData.rule,
        status: "ACTIVE",
      });
    });

    try {
      await Promise.all(creationPromises);
      api.success({ message: "Holidays added successfully" });
      fetchHolidays();
    } catch (error: any) {
      api.error({ message: "Addition failed", description: error.message });
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
        <Space size={8}>
          <Text strong style={{ color: "var(--text-slate-900)", fontSize: 14 }}>{text}</Text>
          {(record.baseLeave !== 1 || record.extraLeave !== 0) && (
            <Tag style={{ borderRadius: 6, background: "var(--bg-yellow-50)", border: "1px solid var(--border-yellow-200)", color: "var(--text-yellow-600)", fontSize: 11 }}>Adjusted</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (isoCode: string) => (
        <Space size={6}>
          <Globe size={14} color="var(--text-slate-400)" />
          <Text style={{ color: "var(--text-slate-500)" }}>{Country.getCountryByCode(isoCode)?.name || isoCode}</Text>
        </Space>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      width: 260,
      render: (_: any, record: CompanyGovernmentHoliday) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-100)" }}>
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{dayjs(record.fromDate).format("MMM DD")}</Text>
          </div>
          <ArrowRight size={14} color="var(--text-slate-400)" />
          <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-100)" }}>
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{dayjs(record.toDate).format("MMM DD, YYYY")}</Text>
          </div>
        </div>
      )
    },
    {
      title: "Total Days",
      dataIndex: "totalLeave",
      key: "totalLeave",
      align: "center" as const,
      render: (val: number) => (
        <Tag style={{ borderRadius: 20, background: "var(--bg-blue-50)", border: "1px solid var(--border-slate-100)", color: "var(--premium-blue)", fontWeight: 600, padding: "0 12px" }}>
          {val} {val === 1 ? 'Day' : 'Days'}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <Tag style={{ borderRadius: 6, background: "var(--bg-slate-50)", border: "1px solid var(--border-slate-100)", color: "var(--text-slate-500)" }}>{text}</Tag>,
    },
    {
      title: "Floater",
      dataIndex: "isFloater",
      key: "isFloater",
      align: "center" as const,
      render: (isFloater: boolean, record: CompanyGovernmentHoliday) => (
        <Switch
          checked={isFloater}
          checkedChildren={<Check size={12} />}
          unCheckedChildren={<X size={12} />}
          style={{ backgroundColor: isFloater ? "var(--text-holiday)" : "var(--bg-slate-100)" }}
          onChange={(checked) => handleFloaterChange(checked, record)}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: CompanyGovernmentHoliday) => (
        <Switch checked={status === "ACTIVE"} onChange={(checked) => handleStatusChange(checked, record.id)} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: CompanyGovernmentHoliday) => (
        <Space size={4}>
          <Tooltip title="Adjust Duration">
            <Button
              type="text"
              size="small"
              icon={<Settings2 size={16} color="#64748b" />}
              style={{ borderRadius: 6 }}
              onClick={() => handleEditHoliday(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Holiday?"
            onConfirm={() => handleDeleteHoliday(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<Trash2 size={16} />} style={{ borderRadius: 6 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modalTableColumns = [
    {
      title: "Select",
      key: "select",
      width: 50,
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedHolidayIds.includes(record.id)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedHolidayIds((prev) => checked ? [...prev, record.id] : prev.filter((id) => id !== record.id));
          }}
        />
      ),
    },
    {
      title: "Holiday Name",
      dataIndex: "holidayName",
      key: "holidayName",
      render: (text: string) => <Text strong style={{ color: "var(--text-slate-900)" }}>{text}</Text>,
    },
    {
      title: "Date",
      dataIndex: "fromDate",
      render: (date: any) => <Text style={{ color: "var(--text-slate-500)" }}>{dayjs(date).format("MMM DD, YYYY")}</Text>,
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (text: string) => <Tag style={{ borderRadius: 6 }}>{text}</Tag>,
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "var(--bg-secondary)", minHeight: "calc(100vh - 64px)" }}>
          {contextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Space size={14} align="center">
                <div style={{ background: "var(--bg-blue-50)", padding: 12, borderRadius: 14, color: "var(--premium-blue)", display: "flex" }}>
                  <Calendar size={28} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Government Holidays</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Manage official government holidays for your organization.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                placeholder="Search holidays..."
                prefix={<Search size={16} color="var(--text-slate-400)" />}
                style={{ width: 280, borderRadius: 12, height: 44, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)", color: "var(--text-slate-900)" }}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                style={{ borderRadius: 12, height: 44, padding: "0 24px", fontWeight: 600, background: "var(--premium-blue)" }}
                onClick={() => setHolidayModalVisible(true)}
              >
                Apply Holidays
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <Row gutter={[24, 24]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <StatCard label="Total Holidays" value={holidays.length} icon={Calendar} color="#7c3aed" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Active Policies" value={holidays.filter(h => h.status === 'ACTIVE').length} icon={CheckCircle2} color="#10b981" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Inactive" value={holidays.filter(h => h.status === "INACTIVE").length} icon={AlertCircle} color="#ef4444" />
            </Col>
          </Row>

          <Card
            bordered={false}
            style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", overflow: "hidden" }}
            bodyStyle={{ padding: "0" }}
          >
            <Table
              loading={holidaysLoading}
              columns={holidayColumns as any}
              dataSource={dataSource}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, position: ["bottomRight"], style: { padding: "12px 24px", margin: 0 } }}
              rowClassName={() => "history-table-row"}
            />
          </Card>

          {/* Apply Holidays Drawer */}
          <Drawer
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)" }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 18, color: "var(--text-slate-900)", display: "block" }}>Apply Government Holidays</Text>
                  <Text style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>Choose from official regional holiday lists</Text>
                </div>
              </div>
            }
            open={holidayModalVisible}
            onClose={() => setHolidayModalVisible(false)}
            width={720}
            headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
            bodyStyle={{ background: "var(--bg-pure-white)" }}
            footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Button onClick={() => setHolidayModalVisible(false)}>Cancel</Button>
                <Button type="primary" loading={isAdding} disabled={selectedHolidayIds.length === 0} onClick={handleAddHolidays}>
                  Add Selected Holidays ({selectedHolidayIds.length})
                </Button>
              </div>
            }
          >
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 8, color: "var(--text-slate-600)" }}>Select Region</Text>
              <Select
                style={{ width: "100%" }}
                size="large"
                value={modalCountry}
                onChange={setModalCountry}
                showSearch
                options={Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }))}
              />
            </div>

            <Table
              loading={modalLoading}
              columns={modalTableColumns}
              dataSource={filteredModalHolidays}
              rowKey="id"
              pagination={false}
              scroll={{ y: "calc(100vh - 400px)" }}
              size="middle"
              style={{ border: "1px solid #f1f5f9", borderRadius: 12, overflow: "hidden" }}
            />
          </Drawer>

          {/* Update Duration Drawer */}
          <Drawer
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "var(--bg-slate-50)", padding: 8, borderRadius: 10, color: "var(--text-slate-500)" }}>
                  <Clock size={20} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 18, color: "var(--text-slate-900)", display: "block" }}>Update Holiday Duration</Text>
                  <Text style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>Adjust base leave and extra positioning</Text>
                </div>
              </div>
            }
            open={editHolidayModalVisible}
            onClose={() => setEditHolidayModalVisible(false)}
            width={480}
            headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
            bodyStyle={{ background: "var(--bg-pure-white)" }}
            footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Button onClick={() => setEditHolidayModalVisible(false)}>Cancel</Button>
                <Button type="primary" onClick={handleSaveHolidayAdjustment}>Update Holiday</Button>
              </div>
            }
          >
            {editingHoliday && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ padding: 16, background: "var(--bg-slate-50)", borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
                  <Text strong style={{ fontSize: 16, color: "var(--text-slate-900)", display: "block" }}>{editingHoliday.holidayName}</Text>
                  <Text style={{ color: "var(--text-slate-500)" }}>{dayjs(editingHoliday.fromDate).format("MMMM DD, YYYY")}</Text>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 8, color: "var(--text-slate-900)" }}>Base Leave Days</Text>
                    <InputNumber value={editBaseDays} disabled style={{ width: "100%", background: "var(--bg-pure-white)", color: "var(--text-slate-900)" }} size="large" />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 8, color: "var(--text-slate-900)" }}>Extra Leave</Text>
                    <InputNumber value={editExtraDays} onChange={val => setEditExtraDays(val || 0)} style={{ width: "100%", background: "var(--bg-pure-white)", color: "var(--text-slate-900)" }} size="large" />
                  </Col>
                </Row>

                <div>
                  <Text strong style={{ display: "block", marginBottom: 8, color: "var(--text-slate-900)" }}>Extra Leave Position</Text>
                  <Select
                    value={editExtraPosition}
                    onChange={setEditExtraPosition}
                    style={{ width: "100%" }}
                    size="large"
                    options={[
                      { label: "Add After Holiday", value: "after" },
                      { label: "Add Before Holiday", value: "before" },
                    ]}
                  />
                </div>

                <div style={{ marginTop: "auto", padding: 20, background: "var(--bg-blue-50)", borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
                  <Text strong style={{ color: "var(--premium-blue)", display: "block", marginBottom: 8 }}>New Duration Summary</Text>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <Text style={{ fontSize: 12, color: "var(--premium-blue)", opacity: 0.8 }}>FROM</Text>
                      <div style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>{dayjs(editingHoliday.fromDate).format("MMM DD")}</div>
                    </div>
                    <ArrowRight size={20} color="var(--premium-blue)" />
                    <div style={{ textAlign: "right" }}>
                      <Text style={{ fontSize: 12, color: "var(--premium-blue)", opacity: 0.8 }}>TO</Text>
                      <div style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>{dayjs(editingHoliday.toDate).format("MMM DD, YYYY")}</div>
                    </div>
                  </div>
                  <Divider style={{ margin: "12px 0", borderColor: "var(--border-slate-100)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--text-slate-900)" }}>
                    <span>Total Duration:</span>
                    <span>{Number(editBaseDays) + Number(editExtraDays)} Days</span>
                  </div>
                </div>
              </div>
            )}
          </Drawer>

          <style dangerouslySetInnerHTML={{
            __html: `
            .history-table-row:hover { background-color: var(--bg-slate-50) !important; }
            .ant-table-thead > tr > th {
              background-color: var(--bg-slate-50) !important;
              color: var(--text-slate-500) !important;
              font-weight: 600 !important;
              padding: 12px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
            }
            .ant-table-tbody > tr > td { padding: 14px 16px !important; border-bottom: 1px solid var(--border-slate-100) !important; color: var(--text-slate-900) !important; }
            .ant-pagination-item a { color: var(--text-slate-500) !important; }
            .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
          `}} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
