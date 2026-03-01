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
  TrophyOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";

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
  const [additionalForm] = Form.useForm();
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
        joiningDate: data.joiningDate ? dayjs(data.joiningDate) : null,
        trainingCompletion: data.trainingCompletion
          ? dayjs(data.trainingCompletion)
          : null,
      });

      additionalForm.setFieldsValue(data);

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
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        padding: "10px",
      }}
    >
      {/* first div */}
      <div style={{ width: "35%" }}>
        <Form
          layout="vertical"
          size="small"
          form={workForm}
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setEmploymentData((pre: any) => {
              return {
                ...pre,
                ...allValues,
                employeeJoiningDate:
                  allValues.employeeJoiningDate?.format("YYYY-MM-DD"),
              };
            })
          }
          style={{
            width: "100%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e6f0ff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            //height: "350px",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
              paddingBottom: 10,
            }}
          >
            <BankOutlined />
            Work Details
          </div>

          <Row gutter={[12, 0]}>
            {/* Department */}
            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item
                label={<span style={{ fontSize: 11 }}> Position</span>}
                name="department"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 10 }}
              >
                <Select
                  placeholder="Select Position"
                  loading={loading}
                  style={{ width: "100% ", height: 30 }}
                  options={positions.map((pos) => ({
                    label: pos.name,
                    value: pos.id,
                  }))}
                />
              </Form.Item>
            </Col>

            {/* Employee Type */}
            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item
                label={<span style={{ fontSize: 11 }}>* Employee Type</span>}
                name="employeeType"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 10 }}
              >
                <Select
                  placeholder="Select Type"
                  style={{ width: "100%", height: 30, fontSize: 11 }}
                >
                  <Option value="Full Time">Full Time</Option>
                  <Option value="Part Time">Part Time</Option>
                  <Option value="Internship">Intern</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            {/* Work Type Column */}
            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item
                label={<span style={{ fontSize: 11 }}>* Work Type</span>}
                name="workType"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 10 }}
              >
                <Select
                  placeholder="Select Work Type"
                  style={{ height: 30, fontSize: 11 }}
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
              {workType === "Hybrid" && (
                <>
                  <Divider style={{ margin: "10px 0" }} />

                  <div style={{ fontSize: 11, marginBottom: 6 }}>
                    Hybrid Mode
                  </div>

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
                        setTempSelectedDays(selectedDays); // preload existing days
                        setIsHybridModalOpen(true); // 🔥 OPEN MODAL AUTOMATICALLY
                      } else {
                        setSelectedDays([]); // clear if back to general
                        setGeneralDays(null);
                        setGeneralHours(null);
                      }
                    }}
                  />
                </>
              )}

              {workType === "Hybrid" && hybridMode === "Fixed" && (
                <div style={{ marginTop: 10 }}>
                  {selectedDays.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      <div>
                        Selected Days: {selectedDays.join(", ").toUpperCase()}
                      </div>
                      <div>Total Days: {selectedDays.length}</div>
                      <div>Total Hours: {selectedDays.length * 8} hrs</div>
                    </div>
                  )}
                </div>
              )}

              {workType === "Hybrid" && hybridMode === "General" && (
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <Input
                    type="number"
                    placeholder="Days"
                    value={generalDays ?? ""}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      setGeneralDays(days);
                      setGeneralHours(days ? days * 8 : 0); // auto calculate hours
                    }}
                    style={{ fontSize: 11, height: 25 }}
                  />

                  <Input
                    type="number"
                    placeholder="Hrs"
                    value={generalHours ?? ""}
                    addonAfter="hrs"
                    onChange={(e) => {
                      setGeneralHours(Number(e.target.value));
                    }}
                    style={{ fontSize: 11, height: 25 }}
                  />
                </div>
              )}
            </Col>

            {/* Work Location Column */}
            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item
                label={<span style={{ fontSize: 11 }}>* Work Location</span>}
                name="workLocation"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 10 }}
              >
                <Input
                  placeholder="Enter Location"
                  style={{ width: "100%", height: 30, fontSize: 11 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Work Shift */}

          <Form.Item name="workShift" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Work Shift</span>}
            required
            help={workForm.getFieldError("workShift")?.[0]}
            validateStatus={
              workForm.getFieldError("workShift")?.length ? "error" : ""
            }
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="Select Work Shift"
              readOnly
              value={workShift}
              onClick={() => setOpen(true)}
              style={{ height: 35, cursor: "pointer" }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}> Work Joining Date </span>}
            name="employeeJoiningDate"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <DatePicker
              format="DD-MM-YYYY"
              placeholder="Select date"
              style={{ width: "100%", height: 30, fontSize: 11 }}
            />
          </Form.Item>
        </Form>
      </div>
      {/* second div */}
      <div style={{ width: "35%" }}>
        <Form
          layout="vertical"
          size="small"
          form={empoyeeTimelineForm}
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setEmploymentData((pre: any) => {
              return {
                ...pre,
                ...allValues,
                trainingCompletion:
                  allValues.trainingCompletion?.format("YYYY-MM-DD"),
                joiningDate: allValues.joiningDate?.format("YYYY-MM-DD"),
              };
            })
          }
          style={{
            width: "100%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e6f0ff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* ===== Employee Timeline ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <CalendarOutlined />
            Employee Timeline
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Form.Item
              label={<span style={{ fontSize: 11 }}>* Joining Date</span>}
              name="joiningDate"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1, marginBottom: 12 }}
            >
              <DatePicker
                placeholder="Select date"
                style={{ width: "100%", height: 25, fontSize: 11 }}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ fontSize: 11 }}>* Training Completion</span>
              }
              name="trainingCompletion"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1, marginBottom: 12 }}
            >
              <DatePicker
                placeholder="Select date"
                style={{ width: "100%", height: 25, fontSize: 11 }}
              />
            </Form.Item>
          </div>

          {/* ===== Project Details ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              marginTop: 4,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <ProjectOutlined />
            Project Details
          </div>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Projects</span>}
            name="projects"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              mode="multiple" // ✅ enable multi select
              allowClear
              placeholder="Select Projects"
              style={{
                width: "100%",
                height: 25,
                fontSize: 11,
              }}
              maxTagCount="responsive" // keeps UI clean
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Reporting Manager</span>}
            name="reportingManager"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              showSearch
              placeholder="Select Manager"
              style={{ height: 25, fontSize: 11 }}
              optionFilterProp="children"
            >
              {members?.map((member) => (
                <Select.Option key={member.id} value={member.label}>
                  {member.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Team */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Team</span>}
            name="team"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select Team"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="Frontend">Frontend</Option>
              <Option value="Backend">Backend</Option>
              <Option value="Design">Design</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
      {/* third div */}
      <div style={{ width: "30%" }}>
        <Form
          layout="vertical"
          size="small"
          form={additionalForm}
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setEmploymentData((pre: any) => {
              return { ...pre, ...allValues };
            })
          }
          style={{
            width: "100%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e6f0ff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <TrophyOutlined />
            Additional Details
          </div>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Promotion Status</span>}
            name="promotionStatus"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select Status"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="Eligible">Eligible</Option>
              <Option value="Not Eligible">Not Eligible</Option>
              <Option value="Promoted">Promoted</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Employee Grade</span>}
            name="employeeGrade"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Select Grade"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="Grade A">Grade A</Option>
              <Option value="Grade B">Grade B</Option>
              <Option value="Grade C">Grade C</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: "#1677ff" }} />
            <span>Configure Hybrid Working Days</span>
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
            background: "#fafafa",
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FieldTimeOutlined style={{ color: "black" }} />
            <span>Set Work Shift</span>
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button onClick={() => setOpen(false)}>Close</Button>,
          <Button onClick={handleSave}>Save</Button>,
        ]}
        width={800}
      >
        {/* ✅ Select All + Common Time */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
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
        />
      </Modal>
    </div>
  );
});
export default EmploymentDetails;
