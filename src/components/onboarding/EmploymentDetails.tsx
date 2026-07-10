"use client";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Checkbox,
  Divider,
  Modal,
  Typography,
  Row,
  Col,
  Space,
  Card,
  notification,
  message,
  Table,
  TimePicker,
  Button,
  InputNumber,
  Collapse,
} from "antd";
import { useTheme } from "@/context/ThemeContext";
import {
  BankOutlined,
  ProjectOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import { Clock, Settings, Info, CheckCircle2, Check, X, Pencil } from "lucide-react";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { MembersService } from "@/services/membersService";
import { ProjectService } from "@/services/projectService";
import { add } from "@dnd-kit/utilities";
import form from "antd/es/form";
import { PositionService } from "@/services/positionService";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
// import { Model } from "mongoose";

const EmploymentDetails = forwardRef(({ data }: any, ref: any) => {
  // Employement data
  const [employmentData, setEmploymentData] = useState<any>({});
  const [workType, setWorkType] = useState<string>();
  const [hybridMode, setHybridMode] = useState<"General" | "Fixed">("General");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [generalDays, setGeneralDays] = useState<number | null>(null);
  const [generalHours, setGeneralHours] = useState<number | null>(null);

  const [isHybridModalOpen, setIsHybridModalOpen] = useState(false);
  const [tempSelectedDays, setTempSelectedDays] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [workForm] = Form.useForm();
  const [empoyeeTimelineForm] = Form.useForm();
  const { Option } = Select;
  const { Title, Text } = Typography;
  const [api, contextHolder] = notification.useNotification();
  //const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [isWorkShiftExpanded, setIsWorkShiftExpanded] = useState(false);
  const [isEditingAvg, setIsEditingAvg] = useState(false);
  const [editedAvg, setEditedAvg] = useState<number | null>(null);

  const [shiftData, setShiftData] = useState<any>({});
  const [workShift, setWorkShift] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [commonStart, setCommonStart] = useState<any>(null);
  const [commonEnd, setCommonEnd] = useState<any>(null);
  const [commonAvg, setCommonAvg] = useState<number | null>(null);
  const { theme } = useTheme();

  const calculateAvg = (start: any, end: any): number => {
    if (!start || !end) return 0;
    const s = typeof start === 'string' ? dayjs(start, "HH:mm") : start;
    const e = typeof end === 'string' ? dayjs(end, "HH:mm") : end;
    let diffHrs = e.diff(s, "hour", true);
    if (diffHrs < 0) diffHrs += 24;
    let deduction = 0;
    if (diffHrs > 8) deduction = 1.5;
    else if (diffHrs >= 4) deduction = 1.0;
    else deduction = 0.5;
    return Number(Math.max(0, diffHrs - deduction).toFixed(1));
  };

  const calculateDailyTotals = () => {
    let dTotal = 0;
    let dAvg = 0;
    if (selectedDays.length > 0) {
      // Show hours for a single day rather than summing all days
      const firstDay = selectedDays[0];
      const shift = shiftData[firstDay];
      if (shift && shift.start && shift.end) {
        const s = typeof shift.start === 'string' ? dayjs(shift.start, "HH:mm") : shift.start;
        const e = typeof shift.end === 'string' ? dayjs(shift.end, "HH:mm") : shift.end;
        let diffHrs = e.diff(s, "hour", true);
        if (diffHrs < 0) diffHrs += 24;
        dTotal = diffHrs;
        dAvg = shift.avg !== undefined ? shift.avg : calculateAvg(shift.start, shift.end);
      }
    }
    return { dTotal, dAvg };
  };

  const handleSaveAvg = () => {
    if (editedAvg !== null && selectedDays.length > 0) {
      const newShiftData = { ...shiftData };
      selectedDays.forEach((day) => {
        if (newShiftData[day]) {
          newShiftData[day] = { ...newShiftData[day], avg: editedAvg };
        }
      });
      setShiftData(newShiftData);

      // Save to parent via workForm & employmentData
      const payloadType = selectAll ? "all" : "custom";
      const payload = {
        type: payloadType,
        data: payloadType === "custom" ? newShiftData : undefined,
        start: payloadType === "all" ? commonStart?.format("HH:mm") : undefined,
        end: payloadType === "all" ? commonEnd?.format("HH:mm") : undefined,
        avg: payloadType === "all" ? editedAvg : undefined,
      };
      const workShiftValue = JSON.stringify(payload);
      workForm.setFieldsValue({ workShift: workShiftValue });
      setEmploymentData((pre: any) => ({ ...pre, workShift: workShiftValue }));
    }
    setIsEditingAvg(false);
  };

  const [projects, setProjects] = useState<any[]>([]);

  const [error, setError] = useState("");

  const [dayTimes, setDayTimes] = useState({
    Monday: { start: null, end: null },
    Tuesday: { start: null, end: null },
    Wednesday: { start: null, end: null },
    Thursday: { start: null, end: null },
    Friday: { start: null, end: null },
    Saturday: { start: null, end: null },
    Sunday: { start: null, end: null },
  });

  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    console.log("Employment Data:", employmentData);
  }, [employmentData]);

  useEffect(() => {
    if (data && Object.keys(data).length) {
      setEmploymentData(data);
      setWorkType(data.workType);
      setHybridMode(data.hybridMode || "General");
      setSelectedDays(data.fixedDays || []);
      setGeneralDays(data.totalDays || null);
      setGeneralHours(data.totalHours || null);
      setTempSelectedDays(data.fixedDays || []);

      workForm.setFieldsValue({
        ...data,
        employeeJoiningDate: data.employeeJoiningDate
          ? dayjs(data.employeeJoiningDate)
          : null,
      });

      empoyeeTimelineForm.setFieldsValue({
        ...data,
        reportingManager: data.reportingManager || undefined,
        joiningDate: data.joiningDate ? dayjs(data.joiningDate) : null,
        trainingCompletion: data.trainingCompletion
          ? dayjs(data.trainingCompletion)
          : null,
      });

      // Parse workShift for display and modal state
      if (data.workShift) {
        setIsWorkShiftExpanded(true);
        try {
          const parsed =
            typeof data.workShift === "string"
              ? JSON.parse(data.workShift)
              : data.workShift;

          if (parsed.type === "all") {
            setWorkShift("All Days");
            setSelectAll(true);
            setCommonStart(parsed.start ? dayjs(parsed.start, "HH:mm") : null);
            setCommonEnd(parsed.end ? dayjs(parsed.end, "HH:mm") : null);
            setCommonAvg(parsed.avg || null);
            setSelectedDays(weekDays);
            const newShiftData: any = {};
            weekDays.forEach((day) => {
              newShiftData[day] = { start: parsed.start, end: parsed.end, avg: parsed.avg || null };
            });
            setShiftData(newShiftData);
          } else if (parsed.type === "custom") {
            const days = Object.keys(parsed.data || {});
            setWorkShift(days.join(", "));
            setSelectAll(false);
            setCommonStart(null);
            setCommonEnd(null);
            setSelectedDays(days);
            setShiftData(parsed.data || {});
          } else {
            setWorkShift(data.workShift);
          }
        } catch (e) {
          setWorkShift(data.workShift);
        }
      }
    }
  }, [data]);

  interface Position {
    id: string;
    name: string;
  }

  useEffect(() => {
    const fetchMembersForSelect = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setMembers(data);
      } catch (error) {
        message.error("Failed to load members");
      }
    };
    fetchMembersForSelect();

    const fetchPositions = async () => {
      try {
        setLoading(true);
        const data = await PositionService.getAll();
        const mapData = data.map((pos) => ({
          id: pos.id,
          name: pos.title,
        }));
        setPositions(mapData); // 🔥 store in state
        console.log("Fetched Positions:", mapData); // 🔥 debug log
      } catch (error) {
        console.error("Failed to fetch positions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        const response = await ProjectService.getProjects({
          page: 1,
          limit: 20,
        });

        if (response?.data) {
          setProjects(response.data);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await Promise.all([
          workForm.validateFields(),
          empoyeeTimelineForm.validateFields(),
        ]);
        return true;
      } catch (error) {
        console.error("Validation failed:", error);
        return false;
      }
    },
    getData: () => {
      if (workType === "Hybrid" && hybridMode === "Fixed") {
        return {
          ...employmentData,
          workType: "Hybrid",
          hybridMode: "Fixed",
          fixedDays: selectedDays,
          totalDays: selectedDays.length,
          totalHours: selectedDays.length * 8,
        };
      }

      if (workType === "Hybrid" && hybridMode === "General") {
        return {
          ...employmentData,
          workType: "Hybrid",
          hybridMode: "General",
          totalDays: generalDays,
          totalHours: generalHours,
        };
      }

      return {
        ...employmentData,
        workType,
      };
    },
  }));

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);

    if (checked) {
      setSelectedDays(weekDays);
    } else {
      setSelectedDays([]);
      setShiftData({});
      setCommonStart(null);
      setCommonEnd(null);
      setCommonAvg(null);
    }
  };
  const handleCheckboxChange = (day: string, checked: boolean) => {
    let updatedDays;
    if (checked) {
      updatedDays = [...selectedDays, day];
    } else {
      updatedDays = selectedDays.filter((d) => d !== day);
      setShiftData((prev: any) => {
        const newData = { ...prev };
        delete newData[day];
        return newData;
      });
    }

    setSelectedDays(updatedDays);
    setSelectAll(updatedDays.length === weekDays.length);
  };

  const handleTimeChange = (day: string, type: "start" | "end", time: any) => {
    setShiftData({
      ...shiftData,
      [day]: {
        ...shiftData[day],
        [type]: time,
      },
    });
  };

  const applyCommonTime = (start: any, end: any) => {
    if (!start || !end) return;

    const avg = calculateAvg(start, end);
    setCommonAvg(avg);

    const newData: any = {};
    weekDays.forEach((day) => {
      newData[day] = {
        start,
        end,
        avg,
      };
    });

    setShiftData(newData);
  };

  const columns = [
    {
      title: "",
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedDays.includes(record.day)}
          onChange={(e) => {
            const checked = e.target.checked;

            if (checked) {
              setSelectedDays([...selectedDays, record.day]);
              // initialize shiftData for that day if not exists
              setShiftData((prev: any) => ({
                ...prev,
                [record.day]: prev[record.day] || { start: null, end: null },
              }));
            } else {
              setSelectedDays(selectedDays.filter((d) => d !== record.day));
              // optionally clear shiftData for unselected day
              setShiftData((prev: any) => {
                const copy = { ...prev };
                delete copy[record.day];
                return copy;
              });
            }
          }}
        />
      ),
    },
    {
      title: "Week Day",
      dataIndex: "day",
      render: (text: string) => <span style={{ fontWeight: 600, color: theme === "dark" ? "#f1f5f9" : "#334155" }}>{text}</span>
    },
    {
      title: "Start Time",
      render: (_: any, record: any) => (
        <TimePicker
          format="HH:mm"
          value={
            shiftData[record.day]?.start
              ? dayjs(shiftData[record.day].start, "HH:mm")
              : null
          }
          disabled={!selectedDays.includes(record.day)}
          onChange={(time) => {
            setShiftData((prev: any) => {
              const currentEnd = prev[record.day]?.end;
              const formattedStart = time ? time.format("HH:mm") : null;
              return {
                ...prev,
                [record.day]: {
                  ...prev[record.day],
                  start: formattedStart,
                  avg: calculateAvg(formattedStart, currentEnd),
                },
              };
            });
          }}
        />
      ),
    },
    {
      title: "End Time",
      render: (_: any, record: any) => (
        <TimePicker
          format="HH:mm"
          value={
            shiftData[record.day]?.end
              ? dayjs(shiftData[record.day].end, "HH:mm")
              : null
          }
          disabled={!selectedDays.includes(record.day)}
          onChange={(time) => {
            setShiftData((prev: any) => {
              const currentStart = prev[record.day]?.start;
              const formattedEnd = time ? time.format("HH:mm") : null;
              return {
                ...prev,
                [record.day]: {
                  ...prev[record.day],
                  end: formattedEnd,
                  avg: calculateAvg(currentStart, formattedEnd),
                },
              };
            });
          }}
        />
      ),
    },
    {
      title: "Daily Hours",
      render: (_: any, record: any) => {
        const start = shiftData[record.day]?.start;
        const end = shiftData[record.day]?.end;
        if (start && end) {
          const s = typeof start === 'string' ? dayjs(start, "HH:mm") : start;
          const e = typeof end === 'string' ? dayjs(end, "HH:mm") : end;
          let diffHrs = e.diff(s, "hour", true);
          if (diffHrs < 0) diffHrs += 24;
          const totalHoursStr = diffHrs.toFixed(1);

          return (
            <div style={{ fontSize: "12px", color: theme === "dark" ? "#cbd5e1" : "#64748b", background: theme === "dark" ? "#1e293b" : "#f8fafc", padding: "4px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", border: `1px solid ${theme === "dark" ? "#334155" : "#f1f5f9"}`, whiteSpace: "nowrap" }}>
              <span style={{ color: theme === "dark" ? "#f1f5f9" : "#0f172a", fontWeight: 600 }}>{totalHoursStr}h</span> <span style={{ marginLeft: "4px" }}>total</span>
              <span style={{ margin: "0 6px", color: theme === "dark" ? "#475569" : "#cbd5e1" }}>|</span>
              <InputNumber
                size="small"
                value={shiftData[record.day]?.avg !== undefined ? shiftData[record.day].avg : calculateAvg(start, end)}
                onChange={(val) => {
                  setShiftData((prev: any) => ({
                    ...prev,
                    [record.day]: {
                      ...prev[record.day],
                      avg: val,
                    }
                  }));
                }}
                style={{ width: "60px", marginRight: "4px" }}
                step={0.5}
                min={0}
              /> <span style={{ color: theme === "dark" ? "#f1f5f9" : "#0f172a", fontWeight: 600 }}>h</span> <span style={{ marginLeft: "4px" }}>avg</span>
            </div>
          );
        }
        return <span style={{ color: theme === "dark" ? "#475569" : "#cbd5e1", fontSize: "12px", fontStyle: "italic" }}>Not set</span>;
      }
    }
  ];

  const dataSource = weekDays.map((day) => ({
    key: day,
    day,
  }));

  const handleSave = () => {
    let payload: any;
    let displayString = "";

    if (selectAll && commonStart && commonEnd) {
      // ✅ "All" Format
      const allDaysData: any = {};
      weekDays.forEach((day) => {
        allDaysData[day] = {
          start: commonStart.format("HH:mm"),
          end: commonEnd.format("HH:mm"),
          avg: commonAvg !== null ? commonAvg : calculateAvg(commonStart, commonEnd),
        };
      });

      payload = {
        type: "all",
        start: commonStart.format("HH:mm"),
        end: commonEnd.format("HH:mm"),
        avg: commonAvg !== null ? commonAvg : calculateAvg(commonStart, commonEnd),
        days: weekDays,
        data: allDaysData,
      };
      displayString = "All Days";
    } else {
      // ✅ "Custom" Format (Specific Days)
      const perDayData: any = {};

      if (selectedDays.length === 0) {
        message.error("Please select at least one day.");
        return;
      }

      for (const day of selectedDays) {
        const dayShift = shiftData[day];
        if (dayShift && dayShift.start && dayShift.end) {
          // Ensure we send strings "HH:mm"
          perDayData[day] = {
            start:
              typeof dayShift.start === "string"
                ? dayShift.start
                : dayjs(dayShift.start).format("HH:mm"),
            end:
              typeof dayShift.end === "string"
                ? dayShift.end
                : dayjs(dayShift.end).format("HH:mm"),
            avg: dayShift.avg !== undefined ? dayShift.avg : calculateAvg(dayShift.start, dayShift.end),
          };
        } else {
          message.error(`Please set start and end time for ${day}.`);
          return;
        }
      }

      payload = {
        type: "custom",
        data: perDayData,
      };
      displayString = selectedDays.join(", ");
    }
    console.log("Modal data to save:", payload);
    const workShiftValue = JSON.stringify(payload);
    workForm.setFieldsValue({ workShift: workShiftValue });
    setEmploymentData((pre: any) => ({ ...pre, workShift: workShiftValue }));
    setWorkShift(displayString);
    setOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", paddingBottom: "24px" }}>
      {contextHolder}

      {/* Work Details */}
      <div style={{ background: "transparent", border: "1px solid var(--border-slate-100)", borderRadius: "0px" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-slate-100)", fontSize: "16px", fontWeight: 600 }}>
          <Space><BankOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Work Details</span></Space>
        </div>
        <div style={{ padding: "24px 40px" }}>
          <Form
            layout="vertical"
            form={workForm}
            requiredMark={false}
            onValuesChange={(_, allValues) =>
              setEmploymentData((pre: any) => ({
                ...pre,
                ...allValues,
                employeeJoiningDate: allValues.employeeJoiningDate?.format("YYYY-MM-DD"),
              }))
            }
          >
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Position</span>}
                  name="positionId"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <SearchableDropdown
                    style={{ height: '40px', minHeight: '40px' }}
                    placeholder="Select Position"
                    options={positions.map((pos) => ({
                      label: pos.name,
                      value: pos.id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Employee Type</span>}
                  name="employeeType"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <SearchableDropdown
                    style={{ height: '40px', minHeight: '40px' }}
                    placeholder="Select Type"
                    options={[
                      { label: "Full Time", value: "Full Time" },
                      { label: "Part Time", value: "Part Time" },
                      { label: "Intern", value: "Internship" }
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Work Location</span>}
                  name="workLocation"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter Location" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Work Type</span>}
                  name="workType"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <SearchableDropdown
                    style={{ height: '40px', minHeight: '40px' }}
                    placeholder="Select Work Type"
                    onChange={(value) => {
                      setWorkType(value);
                      setHybridMode("General");
                      setSelectedDays([]);
                      setGeneralDays(null);
                      setGeneralHours(null);
                    }}
                    options={[
                      { label: "Work From Home", value: "Work From Home" },
                      { label: "Work From Office", value: "Work From Office" },
                      { label: "Hybrid", value: "Hybrid" }
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Work Joining Date</span>}
                  name="employeeJoiningDate"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Notice Period</span>}
                  name="noticePeriod"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input type="number" placeholder="Notice Period" />
                </Form.Item>
              </Col>

              <Col xs={24} md={24}>
                {workType === "Hybrid" && (
                  <div style={{ background: "transparent", padding: "16px 0", borderBottom: "1px solid var(--border-slate-100)", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 500 }}>Hybrid Mode:</span>
                      <Switch
                        checkedChildren="Fixed"
                        unCheckedChildren="General"
                        checked={hybridMode === "Fixed"}
                        onChange={(checked) => {
                          const mode = checked ? "Fixed" : "General";
                          setHybridMode(mode);
                          if (mode === "Fixed") {
                            setGeneralDays(null);
                            setGeneralHours(null);
                            setIsHybridModalOpen(true);
                          } else {
                            setSelectedDays([]);
                          }
                        }}
                      />
                    </div>

                    {hybridMode === "Fixed" ? (
                      selectedDays.length > 0 && (
                        <div style={{ fontSize: "13px", color: "var(--text-slate-500)" }}>
                          Selected Days: <strong>{selectedDays.join(", ").toUpperCase()}</strong> |
                          Total: <strong>{selectedDays.length} days</strong> ({selectedDays.length * 8} hrs)
                        </div>
                      )
                    ) : (
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span>General Availability:</span>
                        <Input
                          type="number"
                          placeholder="Days"
                          value={generalDays ?? ""}
                          onChange={(e) => {
                            const days = Number(e.target.value);
                            setGeneralDays(days);
                            setGeneralHours(days ? days * 8 : 0);
                          }}
                          style={{ width: "100px" }}
                        />
                        <Input
                          type="number"
                          placeholder="Hours"
                          value={generalHours ?? ""}
                          suffix="hrs"
                          onChange={(e) => setGeneralHours(Number(e.target.value))}
                          style={{ width: "120px" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Col>

              <Col xs={24} md={24}>
                <Form.Item name="workShift" hidden>
                  <Input />
                </Form.Item>
                <Collapse
                  activeKey={isWorkShiftExpanded ? ['1'] : []}
                  ghost
                  className="work-shift-collapse"
                  style={{ background: "transparent", padding: 0 }}
                  expandIconPosition="end"
                  onChange={(keys) => setIsWorkShiftExpanded(keys.length > 0)}
                  items={[{
                    key: '1',
                    label: <span style={{ fontWeight: 500 }}>Work Shift</span>,
                    extra: isWorkShiftExpanded && selectedDays.length > 0 ? (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {isEditingAvg ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ fontSize: "12px", color: theme === "dark" ? "#cbd5e1" : "#64748b", background: theme === "dark" ? "#1e293b" : "#f8fafc", padding: "2px 8px", borderRadius: "6px", border: `1px solid ${theme === "dark" ? "#334155" : "#f1f5f9"}`, display: "flex", alignItems: "center" }}>
                              <InputNumber
                                value={editedAvg}
                                onChange={(val) => setEditedAvg(val)}
                                size="small"
                                style={{ width: "60px", marginRight: "4px" }}
                                step={0.5}
                              />
                              <span>avg</span>
                            </div>
                            <div
                              onClick={handleSaveAvg}
                              style={{ background: "#10b981", color: "white", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <Check size={14} />
                            </div>
                            <div
                              onClick={() => setIsEditingAvg(false)}
                              style={{ background: "#f1f5f9", color: "#64748b", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <X size={14} />
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{ fontSize: "12px", color: theme === "dark" ? "#cbd5e1" : "#64748b", background: theme === "dark" ? "#1e293b" : "#f8fafc", padding: "4px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", border: `1px solid ${theme === "dark" ? "#334155" : "#f1f5f9"}`, pointerEvents: "none" }}
                          >
                            <span style={{ color: theme === "dark" ? "#f1f5f9" : "#0f172a", fontWeight: 600 }}>{calculateDailyTotals().dTotal.toFixed(1)}h</span> <span style={{ marginLeft: "4px" }}>total</span>
                            <span style={{ margin: "0 6px", color: theme === "dark" ? "#475569" : "#cbd5e1" }}>|</span>
                            <span style={{ color: theme === "dark" ? "#f1f5f9" : "#0f172a", fontWeight: 600 }}>{calculateDailyTotals().dAvg.toFixed(1)}h</span> <span style={{ marginLeft: "4px", marginRight: "8px" }}>avg</span>
                            <div 
                              onClick={(e) => { e.stopPropagation(); setIsEditingAvg(true); setEditedAvg(calculateDailyTotals().dAvg); }}
                              style={{ pointerEvents: "auto", cursor: "pointer", display: "flex", alignItems: "center", color: "#94a3b8" }}
                              title="Edit Average Hours"
                            >
                              <Pencil size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null,
                    children: (
                      <div style={{ padding: "8px 0" }}>
                        <Form.Item
                          required
                          validateStatus={workForm.getFieldError("workShift")?.length ? "error" : ""}
                          help={workForm.getFieldError("workShift")?.[0]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder="Select Work Shift"
                            readOnly
                            value={workShift}
                            onClick={() => setOpen(true)}
                            style={{ cursor: "pointer" }}
                          />
                        </Form.Item>
                      </div>
                    )
                  }]}
                />
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* Employee Timeline */}
      <div style={{ background: "transparent", border: "1px solid var(--border-slate-100)", borderRadius: "0px" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-slate-100)", fontSize: "16px", fontWeight: 600 }}>
          <Space><CalendarOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Employee Timeline</span></Space>
        </div>
        <div style={{ padding: "8px 40px 24px" }}>
          <Form
            layout="vertical"
            form={empoyeeTimelineForm}
            requiredMark={false}
            onValuesChange={(_, allValues) =>
              setEmploymentData((pre: any) => ({
                ...pre,
                ...allValues,
                trainingCompletion: allValues.trainingCompletion?.format("YYYY-MM-DD"),
                joiningDate: allValues.joiningDate?.format("YYYY-MM-DD"),
              }))
            }
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Training Completion" name="trainingCompletion" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Reporting Manager" name="reportingManager" rules={[{ required: true }]}>
                  <SearchableDropdown
                    style={{ height: '40px', minHeight: '40px' }}
                    placeholder="Select Manager"
                    options={members || []}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Projects" name="projects" rules={[{ required: true }]}>
                  <SearchableDropdown
                    style={{ minHeight: '40px' }}
                    mode="multiple"
                    placeholder="Select Projects"
                    options={projects.map((project) => ({
                      label: `${project.name} (${project.code})`,
                      value: project.id
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: "var(--premium-blue)" }} />
            <span style={{ color: "var(--text-slate-900)" }}>Configure Hybrid Working Days</span>
          </div>
        }
        open={isHybridModalOpen}
        onCancel={() => setIsHybridModalOpen(false)}
        onOk={() => {
          setSelectedDays(tempSelectedDays);
          setIsHybridModalOpen(false);
        }}
        okText="Save"
        centered
      >
        <Card
          bordered={false}
          style={{
            background: "var(--bg-slate-50)",
            borderRadius: 10,
          }}
        >
          <Title level={5} style={{ marginBottom: 15 }}>
            Select Working Days
          </Title>

          <Checkbox.Group
            style={{ width: "100%" }}
            value={tempSelectedDays}
            onChange={(checkedValues: any) => {
              setTempSelectedDays(checkedValues);
            }}
          >
            <Row gutter={[12, 12]}>
              {[
                { label: "Mon", value: "Mon" },
                { label: "Tue", value: "Tue" },
                { label: "Wed", value: "Wed" },
                { label: "Thu", value: "Thu" },
                { label: "Fri", value: "Fri" },
                { label: "Sat", value: "Sat" },
                { label: "Sun", value: "Sun" },
              ].map((day) => (
                <Col xs={24} md={8} key={day.value}>
                  <Checkbox value={day.value}>{day.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>

          <Divider />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <Text strong>Total Days: {tempSelectedDays.length}</Text>
            <Text strong>Total Hours: {tempSelectedDays.length * 8} hrs</Text>
          </div>
        </Card>
      </Modal>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "2px 0" }}>
            <div style={{ padding: "7px", background: "#eff6ff", borderRadius: "8px", color: "#3b82f6", display: "inline-flex" }}>
              <Clock size={17} />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: theme === "dark" ? "#f1f5f9" : "#1e293b", lineHeight: 1.2 }}>Work Shift Configuration</div>
              <div style={{ fontSize: "12px", fontWeight: 400, color: theme === "dark" ? "#94a3b8" : "#64748b" }}>Define daily hours &amp; weekly schedule.</div>
            </div>
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOpen(false)} style={{ borderRadius: "8px" }}>Cancel</Button>,
          <Button key="save" type="primary" onClick={handleSave} style={{ borderRadius: "8px", background: "#3b82f6", border: "none" }}>Save Shift</Button>,
        ]}
        className="work-shift-modal"
        centered
        width={800}
        styles={{
          header: { background: "transparent", borderBottom: `1px solid ${theme === "dark" ? "#1e293b" : "#f1f5f9"}`, padding: "12px 20px" },
          footer: { background: "transparent", borderTop: "none" },
          body: { padding: "4px 16px 12px 16px", maxHeight: "65vh", overflowY: "auto" }
        }}
      >
        <div style={{ background: theme === "dark" ? "#1e293b" : "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: `1px solid ${theme === "dark" ? "#334155" : "#f1f5f9"}`, marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Info size={14} style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "11.5px", color: theme === "dark" ? "#cbd5e1" : "#64748b", lineHeight: "1.5" }}>
              Set a shift per day, or apply a common time to all selected days. Used for attendance &amp; monthly hours.
            </div>
          </div>
        </div>
        {/* ✅ Select All + Common Time */}
        <div style={{ padding: "10px 14px", background: theme === "dark" ? "#0f172a" : "linear-gradient(to right, #f8fafc, #f1f5f9)", borderRadius: "10px", border: `1px solid ${theme === "dark" ? "#1e293b" : "#e2e8f0"}`, marginBottom: "12px", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Global Schedule Configuration</div>
          <Row gutter={12} align="middle" wrap={false}>
            <Col>
              <Checkbox
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                <span style={{ whiteSpace: "nowrap", color: theme === "dark" ? "#f1f5f9" : "inherit" }}>Select All</span>
              </Checkbox>
            </Col>

            {selectAll && (
              <>
                <Col>
                  <TimePicker
                    format="HH:mm"
                    placeholder="Common Start"
                    value={commonStart}
                    onChange={(time) => {
                      setCommonStart(time);
                      applyCommonTime(time, commonEnd);
                    }}
                  />
                </Col>
                <Col>
                  <TimePicker
                    format="HH:mm"
                    placeholder="Common End"
                    value={commonEnd}
                    onChange={(time) => {
                      setCommonEnd(time);
                      applyCommonTime(commonStart, time);
                    }}
                  />
                </Col>

              </>
            )}
          </Row>
        </div>

        <style>{`
          .custom-shift-table .ant-table-thead > tr > th {
            background: transparent !important;
            color: ${theme === "dark" ? "#94a3b8" : "#64748b"} !important;
            font-weight: 600 !important;
            border-bottom: 2px solid ${theme === "dark" ? "#1e293b" : "#e2e8f0"} !important;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            padding: 8px 10px !important;
          }
          .custom-shift-table .ant-table-tbody > tr > td {
            border-bottom: 1px dashed ${theme === "dark" ? "#334155" : "#e2e8f0"} !important;
            padding: 5px 10px !important;
          }
          .custom-shift-table .ant-table-tbody > tr:hover > td {
            background: ${theme === "dark" ? "#0f172a" : "#f8fafc"} !important;
          }
          .work-shift-modal .ant-modal-body::-webkit-scrollbar {
            display: none;
          }
          .work-shift-modal .ant-modal-body {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <Table
          className="custom-shift-table"
          columns={columns}
          dataSource={weekDays.map((day) => ({
            key: day,
            day,
          }))}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
});
export default EmploymentDetails;
