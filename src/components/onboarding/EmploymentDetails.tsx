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
} from "antd";
import {
  BankOutlined,
  ProjectOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import { Clock, Settings, Info, CheckCircle2 } from "lucide-react";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { MembersService } from "@/services/membersService";
import { ProjectService } from "@/services/projectService";
import { add } from "@dnd-kit/utilities";
import form from "antd/es/form";
import { PositionService } from "@/services/positionService";
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

  const [shiftData, setShiftData] = useState<any>({});
  const [workShift, setWorkShift] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [commonStart, setCommonStart] = useState<any>(null);
  const [commonEnd, setCommonEnd] = useState<any>(null);

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
            setSelectedDays(weekDays);
            const newShiftData: any = {};
            weekDays.forEach((day) => {
              newShiftData[day] = { start: parsed.start, end: parsed.end };
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

    const newData: any = {};
    weekDays.forEach((day) => {
      newData[day] = {
        start,
        end,
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
            setShiftData((prev: any) => ({
              ...prev,
              [record.day]: {
                ...prev[record.day],
                start: time ? time.format("HH:mm") : null,
              },
            }));
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
            setShiftData((prev: any) => ({
              ...prev,
              [record.day]: {
                ...prev[record.day],
                end: time ? time.format("HH:mm") : null,
              },
            }));
          }}
        />
      ),
    },
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
        };
      });

      payload = {
        type: "all",
        start: commonStart.format("HH:mm"),
        end: commonEnd.format("HH:mm"),
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
    setWorkShift(displayString);
    setOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", paddingBottom: "24px" }}>
      {contextHolder}

      {/* Work Details */}
      <Card
        title={<Space><BankOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Work Details</span></Space>}
        bordered={false}
        style={{ background: "transparent", border: "none" }}
        styles={{ body: { padding: "24px 40px" } }}
      >
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
            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Position</span>}
                name="positionId"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select
                  placeholder="Select Position"
                  loading={loading}
                  options={positions.map((pos) => ({
                    label: pos.name,
                    value: pos.id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Employee Type</span>}
                name="employeeType"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Type">
                  <Option value="Full Time">Full Time</Option>
                  <Option value="Part Time">Part Time</Option>
                  <Option value="Internship">Intern</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Work Location</span>}
                name="workLocation"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Enter Location" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Work Type</span>}
                name="workType"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select
                  placeholder="Select Work Type"
                  onChange={(value) => {
                    setWorkType(value);
                    setHybridMode("General");
                    setSelectedDays([]);
                    setGeneralDays(null);
                    setGeneralHours(null);
                  }}
                >
                  <Option value="Work From Home">Work From Home</Option>
                  <Option value="Work From Office">Work From Office</Option>
                  <Option value="Hybrid">Hybrid</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Work Joining Date</span>}
                name="employeeJoiningDate"
                rules={[{ required: true, message: "Required" }]}
              >
                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Notice Period</span>}
                name="noticePeriod"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input type="number" placeholder="Notice Period" />
              </Form.Item>
            </Col>

            <Col span={24}>
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

            <Col span={24}>
              <Form.Item name="workShift" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Work Shift</span>}
                required
                validateStatus={workForm.getFieldError("workShift")?.length ? "error" : ""}
                help={workForm.getFieldError("workShift")?.[0]}
              >
                <Input
                  placeholder="Select Work Shift"
                  readOnly
                  value={workShift}
                  onClick={() => setOpen(true)}
                  style={{ cursor: "pointer" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Employee Timeline */}
      <Card
        title={<Space><CalendarOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Employee Timeline</span></Space>}
        bordered={false}
        style={{ background: "transparent", border: "none" }}
        styles={{ body: { padding: "8px 40px 24px" } }}
      >
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
            <Col span={12}>
              <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Training Completion" name="trainingCompletion" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Reporting Manager" name="reportingManager" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select Manager" optionFilterProp="children">
                  {members?.map((member) => (
                    <Select.Option key={member.value} value={member.value}>{member.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Projects" name="projects" rules={[{ required: true }]}>
                <Select mode="multiple" allowClear placeholder="Select Projects" maxTagCount="responsive">
                  {projects.map((project) => (
                    <Select.Option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
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
                <Col span={8} key={day.value}>
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
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>Work Shift Configuration</div>
              <div style={{ fontSize: "12px", fontWeight: 400, color: "#64748b" }}>Define daily hours &amp; weekly schedule.</div>
            </div>
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOpen(false)} style={{ borderRadius: "8px" }}>Cancel</Button>,
          <Button key="save" type="primary" onClick={handleSave} style={{ borderRadius: "8px", background: "#3b82f6", border: "none" }}>Save Shift</Button>,
        ]}
        width={560}
        styles={{
          header: { borderBottom: "1px solid #f1f5f9", padding: "12px 20px" },
          body: { padding: "16px 20px" }
        }}
      >
        <div style={{ background: "#f8fafc", padding: "9px 12px", borderRadius: "8px", border: "1px solid #f1f5f9", marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Info size={14} style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.5" }}>
              Set a shift per day, or apply a common time to all selected days. Used for attendance &amp; monthly hours.
            </div>
          </div>
        </div>
        {/* ✅ Select All + Common Time */}
        <Row gutter={12} style={{ marginBottom: 12 }} align="middle">
          <Col>
            <Checkbox
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All
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

        <Table
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
