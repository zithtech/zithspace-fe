"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Button,
  Space,
  Typography,
  Form,
  Avatar,
  List,
  Input,
  Select,
  DatePicker,
  Radio,
  Row,
  Col,
  Tag,
  Divider,
  App,
  Spin,
  Empty,
  Card,
  Switch
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  WarningOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import {
  Clock,
  Trash2,
  Plus,
  Save,
  Send,
  Calendar,
  Smile,
  Meh,
  Frown,
  Activity,
  FileText,
  Zap
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { useMembers } from "@/hooks/useGlobalData";
import { ProjectService } from "@/services/projectService";
import DailyUpdateService from "@/services/dailyUpdateService";
import TicketService from "@/services/ticketService";
import {
  ProjectUpdate,
  Task,
  WorkStatus,
  calculateHours,
  formatHours,
} from "@/types/dailyUpdate";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { commonDrawerProps, drawerFormStyles as formStyles, SectionCard, SectionHeader } from "@/components/common/DrawerSection";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_OPTIONS = [
  { label: "⏳ Pending", value: "pending" },
  { label: "⚙️ In Progress", value: "in_progress" },
  { label: "✅ Dev Complete", value: "dev_complete" },
  { label: "🧪 In Testing", value: "in_testing" },
  { label: "🚀 Pushed to Staging", value: "pushed_to_staging" },
  { label: "🎉 Pushed to Production", value: "pushed_to_production" },
  { label: "✅ Completed", value: "completed" },
];

interface ManageTimeDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ViewMode = "user-list" | "form";

export default function ManageTimeDrawer({ open, onClose, onSuccess }: ManageTimeDrawerProps) {
  const { notification, message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: members = [], isLoading: loadingMembers } = useMembers();

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTickets, setProjectTickets] = useState<Record<string, any[]>>({});
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([
    {
      projectId: "",
      projectName: "",
      startTime: dayjs().set('hour', 9).set('minute', 0).toISOString(),
      endTime: dayjs().set('hour', 18).set('minute', 0).toISOString(),
      hoursWorked: 9,
      tasks: [{ type: "manual", description: "", status: "in_progress" }],
      blockers: "",
      notes: "",
    },
  ]);

  const filteredMembers = useMemo(() => {
    return members.filter(m =>
      m.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  useEffect(() => {
    if (open) {
      setSelectedUser(null);
      setSearchQuery("");
      setProjectUpdates([{
        projectId: "",
        projectName: "",
        startTime: dayjs().set('hour', 9).set('minute', 0).toISOString(),
        endTime: dayjs().set('hour', 18).set('minute', 0).toISOString(),
        hoursWorked: 9,
        tasks: [{ type: "manual", description: "", status: "in_progress" }],
        blockers: "",
        notes: "",
      }]);
      form.resetFields();
    }
  }, [open, form]);

  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchProjectTickets = async (projectId: string) => {
    if (projectTickets[projectId]) return;
    try {
      const tickets = await TicketService.getProjectTickets(projectId);
      setProjectTickets(prev => ({ ...prev, [projectId]: tickets }));
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  const handleUserChange = (userId: string) => {
    const user = members.find(m => m.value === userId);
    if (user) {
      setSelectedUser(user);
      fetchProjects();
      form.setFieldsValue({
        date: dayjs(),
        mood: "neutral",
        updateType: dayjs().hour() < 14 ? "BOD" : "EOD",
        is_missed: false,
        missedDate: null
      });
    }
  };

  useEffect(() => {
    const isMissed = form.getFieldValue('is_missed');
    const targetDate = isMissed ? form.getFieldValue('missedDate') : form.getFieldValue('date');

    if (targetDate && projectUpdates.length > 0) {
      const newUpdates = projectUpdates.map(update => {
        const start = dayjs(update.startTime);
        const end = dayjs(update.endTime);

        // Only update if the date part is different
        if (!start.isSame(targetDate, 'day') || !end.isSame(targetDate, 'day')) {
          return {
            ...update,
            startTime: start.year(targetDate.year()).month(targetDate.month()).date(targetDate.date()).toISOString(),
            endTime: end.year(targetDate.year()).month(targetDate.month()).date(targetDate.date()).toISOString(),
          };
        }
        return update;
      });

      // Compare to avoid infinite loop
      if (JSON.stringify(newUpdates) !== JSON.stringify(projectUpdates)) {
        setProjectUpdates(newUpdates);
      }
    }
  }, [form.getFieldValue('is_missed'), form.getFieldValue('missedDate'), form.getFieldValue('date'), projectUpdates]);

  const handleProjectChange = async (index: number, projectId: string) => {
    const project = projects.find(p => p.value === projectId);
    const newUpdates = [...projectUpdates];
    newUpdates[index].projectId = projectId;
    newUpdates[index].projectName = project?.label || "";
    setProjectUpdates(newUpdates);
    if (projectId) await fetchProjectTickets(projectId);
  };

  const handleTimeChange = (index: number, field: "startTime" | "endTime", value: Dayjs | null) => {
    const newUpdates = [...projectUpdates];
    newUpdates[index][field] = value ? value.toISOString() : "";
    if (newUpdates[index].startTime && newUpdates[index].endTime) {
      newUpdates[index].hoursWorked = calculateHours(newUpdates[index].startTime, newUpdates[index].endTime);
    }
    setProjectUpdates(newUpdates);
  };

  const handleAddTask = (projectIndex: number) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].tasks.push({ type: "manual", description: "", status: "in_progress" });
    setProjectUpdates(newUpdates);
  };

  const handleRemoveTask = (projectIndex: number, taskIndex: number) => {
    const newUpdates = [...projectUpdates];
    if (newUpdates[projectIndex].tasks.length > 1) {
      newUpdates[projectIndex].tasks.splice(taskIndex, 1);
      setProjectUpdates(newUpdates);
    }
  };

  const handleTaskTypeChange = (pIdx: number, tIdx: number, type: "ticket" | "manual") => {
    const newUpdates = [...projectUpdates];
    const status = newUpdates[pIdx].tasks[tIdx].status;
    newUpdates[pIdx].tasks[tIdx] = type === "ticket"
      ? { type: "ticket", ticketId: "", ticketNumber: "", ticketTitle: "", status }
      : { type: "manual", description: "", status };
    setProjectUpdates(newUpdates);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const isMissed = values.is_missed;
      const submissionDate = isMissed ? values.missedDate : values.date;
      const dateStr = submissionDate.format("YYYY-MM-DD");

      const data = {
        userId: selectedUser.value,
        date: dateStr,
        mood: values.mood,
        updateType: values.updateType,
        projectUpdates,
        generalNotes: values.generalNotes,
        is_missed: isMissed,
        missed_updateAt: isMissed ? dateStr : null,
      };

      await DailyUpdateService.createUpdate(data);
      notification.success({
        message: "Success",
        description: `Daily update for ${selectedUser.label} submitted successfully!`
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error?.name === 'ValidationError') return; // Handled by Antd
      notification.error({
        message: "Error",
        description: error.message || "Failed to submit update"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalHours = projectUpdates.reduce((sum, update) => sum + (update.hoursWorked || 0), 0);

  return (
    <Drawer
      {...commonDrawerProps}
      open={open}
      onClose={onClose}
    >
      <style>{formStyles}</style>
      <div className="daily-update-drawer-container customer-drawer-form" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Custom Header */}
        <div className="customer-drawer-header" style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--border-color)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div className="sp-drawer-header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "var(--bg-slate-50)", padding: 8, borderRadius: 6, color: "var(--text-slate-600)", display: "flex", border: "1px solid var(--border-slate-200)" }}>
              <Activity size={20} />
            </div>
            <span className="sp-drawer-title" style={{ fontWeight: 700, fontSize: 15, color: "var(--text-slate-900)", whiteSpace: "nowrap" }}>Manage Team Time Update</span>
          </div>

          <div className="sp-drawer-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {selectedUser && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "var(--bg-pure-white)",
                borderRadius: 8,
                border: "1px solid var(--border-slate-200)",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}>
                <Clock size={16} color="var(--text-slate-500)" />
                <Text strong style={{ color: "var(--text-slate-700)", fontSize: 13 }}>Total: {totalHours}h</Text>
              </div>
            )}
            <Space>
              <Button onClick={onClose} style={{ borderRadius: 8 }}>Cancel</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                icon={<SendOutlined />}
                disabled={!selectedUser}
                style={{ borderRadius: 8, background: "#1677ff", borderColor: "#1677ff", color: "#ffffff" }}
              >
                Submit Update
              </Button>
            </Space>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          .daily-update-drawer-container .ant-form-item-label > label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-slate-600);
          }
          .mood-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
            color: var(--text-slate-600) !important;
            height: 38px !important;
            border-radius: 8px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 1;
          }
          .mood-btn-active-happy { background: var(--bg-slate-50) !important; border-color: var(--border-slate-300) !important; color: #a16207 !important; }
          .mood-btn-active-neutral { background: var(--bg-slate-50) !important; border-color: var(--border-slate-300) !important; color: var(--text-slate-700) !important; }
          .mood-btn-active-stressed { background: var(--bg-slate-50) !important; border-color: var(--border-slate-300) !important; color: #9a3412 !important; }
          .mood-btn-active-blocked { background: var(--bg-slate-50) !important; border-color: var(--border-slate-300) !important; color: #991b1b !important; }
          
          .project-card-premium {
            border: 1px solid var(--border-slate-200) !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            transition: all 0.3s ease !important;
            background: var(--bg-pure-white) !important;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
          }
          .project-card-premium:hover {
            border-color: var(--border-slate-300) !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
          }
          .project-card-premium .ant-card-head {
            background: var(--bg-table-header);
            border-bottom: 1px solid var(--border-slate-200);
          }
          
          @media (max-width: 768px) {
            .ant-drawer-content-wrapper {
              width: 100% !important;
            }
            .customer-drawer-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              padding: 16px !important;
              gap: 12px !important;
            }
            .sp-drawer-header-left {
              width: 100% !important;
              justify-content: flex-start !important;
            }
            .sp-drawer-header-right {
              width: 100% !important;
              justify-content: space-between !important;
              flex-wrap: wrap !important;
              gap: 12px !important;
            }
            .sp-drawer-header-right .ant-space {
              width: 100% !important;
              justify-content: flex-end !important;
            }
            .sp-drawer-title {
              white-space: normal !important;
              line-height: 1.3 !important;
            }
            
            .sp-task-row {
              flex-direction: column !important;
              align-items: stretch !important;
              border: 1px solid var(--border-slate-200) !important;
              padding: 12px !important;
              border-radius: 0 !important;
              background: var(--bg-slate-50) !important;
              gap: 8px !important;
            }
            .sp-task-row > * {
              width: 100% !important;
            }
            .sp-task-delete-btn {
              text-align: right !important;
              display: block !important;
              width: fit-content !important;
              margin-left: auto !important;
            }
          }

          /* Force flat sharp borders inside the drawer */
          .daily-update-drawer-container .ant-select-selector:not(.member-select-dropdown .ant-select-selector),
          .daily-update-drawer-container .ant-input,
          .daily-update-drawer-container .ant-picker,
          .daily-update-drawer-container .ant-btn,
          .daily-update-drawer-container .ant-card,
          .daily-update-drawer-container .ant-input-number,
          .daily-update-drawer-container .ant-select-selection-item,
          .daily-update-drawer-container .ant-select:not(.member-select-dropdown .ant-select) {
            border-radius: 8px !important;
          }

          .du-add-project-btn {
            height: 48px !important;
            border-radius: 0 !important;
            margin-bottom: 32px !important;
            border-style: dashed !important;
            border-color: #bfdbfe !important;
            color: #2563eb !important;
            background: #eff6ff !important;
            font-weight: 600 !important;
            transition: all 0.3s ease;
          }
          [data-theme='dark'] .du-add-project-btn {
            border-color: rgba(59, 130, 246, 0.3) !important;
            color: #60a5fa !important;
            background: rgba(59, 130, 246, 0.1) !important;
          }
          [data-theme='dark'] .du-add-project-btn:hover {
            border-color: rgba(59, 130, 246, 0.5) !important;
            background: rgba(59, 130, 246, 0.15) !important;
          }
        `}} />

        <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          <Form form={form} layout="vertical">
            <SectionCard
              title="Team Member"
              subtitle="Select the team member to manage time for"
              icon={<UserOutlined />}
              step="STEP 1"
            >
              <Form.Item
                name="userId"
                className="member-select-dropdown"
                rules={[{ required: true, message: "Please select a member" }]}
                style={{ marginBottom: 0 }}
              >
                <SearchableDropdown
                  placeholder="Search and select a team member"
                  options={members}
                  itemNoun="members"
                  onChange={handleUserChange}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </SectionCard>

            {selectedUser ? (
              <>
                <SectionCard
                  title="Work Details"
                  subtitle="Configure the date and update type"
                  icon={<CalendarOutlined />}
                  step="STEP 2"
                >
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12}>
                      <Form.Item name="date" label="Work Date" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <DatePicker style={{ width: "100%", borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="updateType" label="Update Type" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select
                          style={{ borderRadius: 8 }}
                          options={[{ label: "BOD (Beginning of Day)", value: "BOD" }, { label: "EOD (End of Day)", value: "EOD" }]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="is_missed" label="Missed Update?" valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Switch style={{ background: form.getFieldValue('is_missed') ? 'var(--text-sky-500)' : '#cbd5e1' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item noStyle shouldUpdate={(p, c) => p.is_missed !== c.is_missed}>
                        {({ getFieldValue }) => getFieldValue('is_missed') ? (
                          <Form.Item name="missedDate" label="Target Date" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                            <DatePicker style={{ width: "100%", borderRadius: 8 }} />
                          </Form.Item>
                        ) : null}
                      </Form.Item>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 24 }}>
                  <Form.Item noStyle shouldUpdate={(p, c) => p.mood !== c.mood}>
                    {({ getFieldValue }) => (
                      <Form.Item name="mood" label="How was your mood today?">
                        <Radio.Group style={{ width: "100%" }}>
                          <Row gutter={[12, 12]}>
                            <Col xs={12} sm={6}>
                              <Radio.Button value="happy" className={`mood-btn ${getFieldValue('mood') === 'happy' ? 'mood-btn-active-happy' : ''}`}>
                                <Space><Smile size={16} /> Happy</Space>
                              </Radio.Button>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Radio.Button value="neutral" className={`mood-btn ${getFieldValue('mood') === 'neutral' ? 'mood-btn-active-neutral' : ''}`}>
                                <Space><Meh size={16} /> Neutral</Space>
                              </Radio.Button>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Radio.Button value="stressed" className={`mood-btn ${getFieldValue('mood') === 'stressed' ? 'mood-btn-active-stressed' : ''}`}>
                                <Space><Frown size={16} /> Stressed</Space>
                              </Radio.Button>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Radio.Button value="blocked" className={`mood-btn ${getFieldValue('mood') === 'blocked' ? 'mood-btn-active-blocked' : ''}`}>
                                <Space><Activity size={16} /> Blocked</Space>
                              </Radio.Button>
                            </Col>
                          </Row>
                        </Radio.Group>
                      </Form.Item>
                    )}
                  </Form.Item>
                  </div>
                </SectionCard>

                <SectionCard 
                  title="Project Activities" 
                  subtitle="Log hours and tasks for specific projects" 
                  icon={<Activity />} 
                  step="STEP 3"
                >
                  {projectUpdates.map((update, pIdx) => (
                  <Card
                    key={pIdx}
                    size="small"
                    className="project-card-premium"
                    style={{ marginBottom: 24 }}
                    title={
                      <Space align="center">
                        <div style={{ background: "var(--bg-slate-50)", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-slate-600)", border: "1px solid var(--border-slate-200)" }}>
                          <Zap size={14} fill="var(--text-slate-400)" color="var(--text-slate-400)" />
                        </div>
                        <Text strong style={{ fontSize: 13, color: "var(--text-slate-900)" }}>Project Update #{pIdx + 1}</Text>
                      </Space>
                    }
                    extra={
                      projectUpdates.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 size={16} />}
                          onClick={() => setProjectUpdates(prev => prev.filter((_, i) => i !== pIdx))}
                        />
                      )
                    }
                  >
                    <Row gutter={[12, 12]}>
                      <Col span={24}>
                        <Form.Item label="Project" required style={{ marginBottom: 0 }}>
                          <Select
                            placeholder="Select Project"
                            value={update.projectId || undefined}
                            onChange={val => handleProjectChange(pIdx, val)}
                            options={projects}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={10}>
                        <Form.Item label="Start Time" required style={{ marginBottom: 0 }}>
                          <DatePicker
                            showTime
                            format="DD-MM-YYYY HH:mm"
                            style={{ width: "100%" }}
                            value={update.startTime ? dayjs(update.startTime) : null}
                            onChange={val => handleTimeChange(pIdx, "startTime", val)}
                            disabledDate={(current) => {
                              const isMissed = form.getFieldValue('is_missed');
                              const missedDate = form.getFieldValue('missedDate');
                              if (isMissed) {
                                if (missedDate) return !current.isSame(missedDate, "day");
                                return current && (current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day") || current.isBefore(dayjs().subtract(3, "day"), "day"));
                              }
                              return current && current.isBefore(dayjs(), "day");
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={10}>
                        <Form.Item label="End Time" required style={{ marginBottom: 0 }}>
                          <DatePicker
                            showTime
                            format="DD-MM-YYYY HH:mm"
                            style={{ width: "100%" }}
                            value={update.endTime ? dayjs(update.endTime) : null}
                            onChange={val => handleTimeChange(pIdx, "endTime", val)}
                            disabledDate={(current) => {
                              const isMissed = form.getFieldValue('is_missed');
                              const missedDate = form.getFieldValue('missedDate');
                              if (isMissed) {
                                if (missedDate) return !current.isSame(missedDate, "day");
                                return current && (current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day") || current.isBefore(dayjs().subtract(3, "day"), "day"));
                              }
                              return current && current.isBefore(dayjs(), "day");
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={4}>
                        <Form.Item label="Hrs" style={{ marginBottom: 0 }}>
                          <Tag style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: 0 }}>
                            {update.hoursWorked}h
                          </Tag>
                        </Form.Item>
                      </Col>
                    </Row>

                    <div style={{ marginTop: 8, padding: "0 8px" }}>
                      <Text strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                        Tasks & Activities
                      </Text>

                      {update.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="sp-task-row" style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center", width: "100%" }}>
                          <Select
                            value={task.type}
                            onChange={val => handleTaskTypeChange(pIdx, tIdx, val as any)}
                            style={{ width: 100, flexShrink: 0 }}
                            options={[{ label: "Ticket", value: "ticket" }, { label: "Manual", value: "manual" }]}
                          />

                          {task.type === "ticket" ? (
                            <Select
                              placeholder="Select Ticket"
                              style={{ flex: 1, minWidth: 0 }}
                              showSearch
                              optionFilterProp="label"
                              value={task.ticketId}
                              onChange={val => {
                                const newUpdates = [...projectUpdates];
                                const ticket = projectTickets[update.projectId]?.find(t => t.id === val);
                                (newUpdates[pIdx].tasks[tIdx] as any).ticketId = val;
                                (newUpdates[pIdx].tasks[tIdx] as any).ticketNumber = ticket?.ticketNumber;
                                (newUpdates[pIdx].tasks[tIdx] as any).ticketTitle = ticket?.title;
                                setProjectUpdates(newUpdates);
                              }}
                              options={projectTickets[update.projectId]?.map(t => ({
                                label: `${t.ticketNumber}: ${t.title}`,
                                value: t.id
                              }))}
                              loading={!projectTickets[update.projectId]}
                            />
                          ) : (
                            <Input
                              placeholder="What were you working on?"
                              style={{ flex: 1, minWidth: 0 }}
                              value={task.description}
                              onChange={e => {
                                const newUpdates = [...projectUpdates];
                                (newUpdates[pIdx].tasks[tIdx] as any).description = e.target.value;
                                setProjectUpdates(newUpdates);
                              }}
                            />
                          )}

                          <Select
                            value={task.status}
                            onChange={val => {
                              const newUpdates = [...projectUpdates];
                              newUpdates[pIdx].tasks[tIdx].status = val as WorkStatus;
                              setProjectUpdates(newUpdates);
                            }}
                            style={{ width: 140, flexShrink: 0 }}
                            options={STATUS_OPTIONS}
                          />

                          {update.tasks.length > 1 && (
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveTask(pIdx, tIdx)} style={{ flexShrink: 0 }} className="sp-task-delete-btn" />
                          )}
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => handleAddTask(pIdx)}
                        block
                        icon={<PlusOutlined />}
                        style={{ borderRadius: 8, marginTop: 4 }}
                      >
                        Add Another Task
                      </Button>
                    </div>

                    <Row gutter={[12, 12]} style={{ marginTop: 24 }}>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Blockers (if any)">
                          <TextArea
                            rows={2}
                            placeholder="Any issues encountered?"
                            value={update.blockers}
                            onChange={e => {
                              const newUpdates = [...projectUpdates];
                              newUpdates[pIdx].blockers = e.target.value;
                              setProjectUpdates(newUpdates);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item label="Project Notes">
                          <TextArea
                            rows={2}
                            placeholder="Additional details..."
                            value={update.notes}
                            onChange={e => {
                              const newUpdates = [...projectUpdates];
                              newUpdates[pIdx].notes = e.target.value;
                              setProjectUpdates(newUpdates);
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => setProjectUpdates([...projectUpdates, {
                    projectId: "",
                    projectName: "",
                    startTime: dayjs().toISOString(),
                    endTime: dayjs().toISOString(),
                    hoursWorked: 0,
                    tasks: [{ type: "manual", description: "", status: "in_progress" }],
                    blockers: "",
                    notes: "",
                  }])}
                  block
                  icon={<Plus size={16} />}
                  className="du-add-project-btn"
                >
                  Add Another Project Update
                </Button>
                </SectionCard>

                <Form.Item name="generalNotes" label="General/Daily Notes">
                  <TextArea rows={4} placeholder="Overall summary of the day..." style={{ borderRadius: 8 }} />
                </Form.Item>
              </>
            ) : (
              <div style={{ padding: "80px 0", textAlign: "center", background: "var(--bg-secondary)", borderRadius: 0, border: "2px dashed var(--border-slate-200)" }}>
                <div style={{
                  width: 64,
                  height: 64,
                  background: "var(--border-slate-100)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px"
                }}>
                  <UserOutlined style={{ fontSize: 28, color: "var(--text-slate-400)" }} />
                </div>
                <Title level={5} style={{ color: "var(--text-slate-700)", margin: "0 0 8px" }}>No Member Selected</Title>
                <Text type="secondary" style={{ fontSize: 14 }}>Please select a team member from the dropdown above<br />to manage their time allocation and updates.</Text>
              </div>
            )}
          </Form>
        </div>
      </div>
    </Drawer>
  );
}
