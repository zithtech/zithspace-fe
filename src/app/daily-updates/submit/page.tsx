"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Form,
  Button,
  Select,
  Input,
  Space,
  Typography,
  App,
  Tag,
  DatePicker,
  Radio,
  Row,
  Col,
  Switch,
  Spin,
} from "antd";
import {
  Clock,
  Trash2,
  Plus,
  Save,
  Send,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Smile,
  FileText,
  Briefcase,
  ListChecks,
  CalendarClock,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { ProjectService } from "@/services/projectService";
import DailyUpdateService from "@/services/dailyUpdateService";
import TicketService from "@/services/ticketService";
import {
  ProjectUpdate,
  WorkStatus,
  calculateHours,
  formatHours,
} from "@/types/dailyUpdate";
import dayjs, { Dayjs } from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useTheme } from "@/context/ThemeContext";

const { Text } = Typography;
const { TextArea } = Input;

interface ProjectOption {
  value: string;
  label: string;
  code: string;
}

interface TicketOption {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
}

const STATUS_OPTIONS = [
  { label: "⏳ Pending", value: "pending" },
  { label: "⚙️ In Progress", value: "in_progress" },
  { label: "✅ Dev Complete", value: "dev_complete" },
  { label: "🧪 In Testing", value: "in_testing" },
  { label: "🚀 Pushed to Staging", value: "pushed_to_staging" },
  { label: "🎉 Pushed to Production", value: "pushed_to_production" },
  { label: "✅ Completed", value: "completed" },
];

export default function SubmitDailyUpdatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { canCreateDailyUpdate } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canCreateDailyUpdate) {
      router.push('/dashboard');
    }
  }, [authLoading, canCreateDailyUpdate, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ padding: 100, textAlign: 'center' }}>
            <Spin size="large" tip="Loading">
              <div style={{ padding: 20 }} />
            </Spin>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canCreateDailyUpdate) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <SubmitDailyUpdateContent />
    </MainLayout>
  );
}

function SubmitDailyUpdateContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingUpdate, setExistingUpdate] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectTickets, setProjectTickets] = useState<
    Record<string, TicketOption[]>
  >({});
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([
    {
      projectId: "",
      projectName: "",
      startTime: "",
      endTime: "",
      hoursWorked: 0,
      tasks: [
        {
          type: "manual",
          description: "",
          status: "in_progress",
        },
      ],
      blockers: "",
      notes: "",
    },
  ]);
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [isMissedUpdate, setIsMissedUpdate] = useState(false);
  const [missedDate, setMissedDate] = useState<Dayjs | null>(null);
  // 🔐 24-hour edit window check
  const [isEditAllowed, setIsEditAllowed] = useState(true);
  // ✅ FETCH UPDATE FOR EDIT MODE
  const fetchUpdateById = async (id: string) => {
    try {
      const data = await DailyUpdateService.getUpdateById(id);

      setExistingUpdate(data);
      setAlreadySubmitted(true);
      // setProjectUpdates(data.projectUpdates);
      setProjectUpdates(data.projectUpdates ?? []);
      if (data.is_missed) {
        setIsMissedUpdate(true);
        setMissedDate(
          data.missed_updateAt ? dayjs(data.missed_updateAt) : null,
        );
      }

      // 🔐 24 hour rule
      const diffHours = dayjs().diff(dayjs(data.createdAt), "hour");
      if (diffHours >= 24) {
        setIsEditAllowed(false);
      }

      form.setFieldsValue({
        mood: data.mood,
        generalNotes: data.generalNotes,
        updateType: data.updateType,
      });
    } catch (error) {
      messageApi.error("Failed to load update for editing");
    } finally {
      // 🔥 THIS WAS MISSING
      setCheckingSubmission(false);
    }
  };
  // ✅ LOAD DATA WHEN editId EXISTS
  useEffect(() => {
    if (editId) {
      fetchUpdateById(editId);
    }
  }, [editId]);

  // useEffect(() => {
  //   fetchProjects();
  //   checkTodaySubmission();
  // }, []);
  useEffect(() => {
    fetchProjects();

    if (!editId) {
      checkTodaySubmission();
    }
  }, [editId]);
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    // Default when page opens
    if (hour < 14) {
      form.setFieldsValue({ updateType: "BOD" });

      const twoPM = new Date();
      twoPM.setHours(14, 0, 0, 0);

      const delay = twoPM.getTime() - now.getTime();

      const timer = setTimeout(() => {
        form.setFieldsValue({ updateType: "EOD" });
      }, delay);

      return () => clearTimeout(timer);
    } else {
      form.setFieldsValue({ updateType: "EOD" });
    }
  }, [form]);

  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      messageApi.error("Failed to load projects");
    }
  };

  const fetchProjectTickets = async (projectId: string) => {
    if (projectTickets[projectId]) return; // Already fetched

    try {
      const tickets = await TicketService.getProjectTickets(projectId);
      setProjectTickets((prev) => ({
        ...prev,
        [projectId]: tickets,
      }));
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      messageApi.error("Failed to load tickets for this project");
    }
  };

  const checkTodaySubmission = async () => {
    try {
      setCheckingSubmission(true);
      const result = await DailyUpdateService.checkTodaySubmission();
      if (result.submitted && result.data) {
        setAlreadySubmitted(true);
        setExistingUpdate(result.data);

        if (result.data.is_missed) {
          setIsMissedUpdate(true);
          setMissedDate(
            result.data.missed_updateAt
              ? dayjs(result.data.missed_updateAt)
              : null,
          );
        }

        // 🔥 STEP 1: 24 HOURS CHECK
        const createdAt = dayjs(result.data.createdAt);
        const diffHours = dayjs().diff(createdAt, "hour");

        if (diffHours >= 24) {
          setIsEditAllowed(false);
        }

        const existingProjectUpdates = result.data
          .projectUpdates as ProjectUpdate[];
        setProjectUpdates(existingProjectUpdates);

        form.setFieldsValue({
          mood: result.data.mood,
          generalNotes: result.data.generalNotes,
          updateType: result.data.updateType,
        });
      }
    } catch (error) {
      console.error("Failed to check submission:", error);
    } finally {
      setCheckingSubmission(false);
    }
  };

  const handleAddProject = () => {
    setProjectUpdates([
      ...projectUpdates,
      {
        projectId: "",
        projectName: "",
        startTime: "",
        endTime: "",
        hoursWorked: 0,
        tasks: [
          {
            type: "manual",
            description: "",
            status: "in_progress",
          },
        ],
        blockers: "",
        notes: "",
      },
    ]);
  };

  const handleRemoveProject = (index: number) => {
    if (projectUpdates.length === 1) {
      messageApi.warning("At least one project update is required");
      return;
    }
    const newUpdates = projectUpdates.filter((_, i) => i !== index);
    setProjectUpdates(newUpdates);
  };
  useEffect(() => {
    if (existingUpdate?.projectUpdates) {
      // Load tickets for all projects in existing update
      existingUpdate.projectUpdates.forEach((update: ProjectUpdate) => {
        if (update.projectId && !projectTickets[update.projectId]) {
          fetchProjectTickets(update.projectId);
        }
      });
    }
  }, [existingUpdate]);

  // Also update the handleProjectChange to ensure tickets are loaded
  const handleProjectChange = async (index: number, projectId: string) => {
    const project = projects.find((p) => p.value === projectId);
    const newUpdates = [...projectUpdates];
    newUpdates[index].projectId = projectId;
    newUpdates[index].projectName = project?.label || "";
    setProjectUpdates(newUpdates);

    // Fetch tickets for this project if not already fetched
    if (!projectTickets[projectId]) {
      await fetchProjectTickets(projectId);
    }
  };

  const handleTimeChange = (
    index: number,
    field: "startTime" | "endTime",
    value: Dayjs | null,
  ) => {
    const newUpdates = [...projectUpdates];
    newUpdates[index][field] = value ? value.toISOString() : "";

    // Auto-calculate hours if both times are set
    if (newUpdates[index].startTime && newUpdates[index].endTime) {
      const hours = calculateHours(
        newUpdates[index].startTime,
        newUpdates[index].endTime,
      );
      newUpdates[index].hoursWorked = hours;
    }

    setProjectUpdates(newUpdates);
  };

  const handleAddTask = (projectIndex: number) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].tasks.push({
      type: "manual",
      description: "",
      status: "in_progress",
    });
    setProjectUpdates(newUpdates);
  };

  const handleRemoveTask = (projectIndex: number, taskIndex: number) => {
    const newUpdates = [...projectUpdates];
    if (newUpdates[projectIndex].tasks.length === 1) {
      messageApi.warning("At least one task is required");
      return;
    }
    newUpdates[projectIndex].tasks.splice(taskIndex, 1);
    setProjectUpdates(newUpdates);
  };

  const handleTaskTypeChange = (
    projectIndex: number,
    taskIndex: number,
    type: "ticket" | "manual",
  ) => {
    const newUpdates = [...projectUpdates];
    const task = newUpdates[projectIndex].tasks[taskIndex];

    if (type === "ticket") {
      newUpdates[projectIndex].tasks[taskIndex] = {
        type: "ticket",
        ticketId: "",
        ticketNumber: "",
        ticketTitle: "",
        status: task.status,
      };
    } else {
      newUpdates[projectIndex].tasks[taskIndex] = {
        type: "manual",
        description: "",
        status: task.status,
      };
    }

    setProjectUpdates(newUpdates);
  };

  const handleTicketSelect = (
    projectIndex: number,
    taskIndex: number,
    ticketId: string,
  ) => {
    const newUpdates = [...projectUpdates];
    const projectId = newUpdates[projectIndex].projectId;
    const ticket = projectTickets[projectId]?.find((t) => t.id === ticketId);

    if (ticket) {
      newUpdates[projectIndex].tasks[taskIndex] = {
        type: "ticket",
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        status: newUpdates[projectIndex].tasks[taskIndex].status,
      };
    }

    setProjectUpdates(newUpdates);
  };

  const handleTaskDescriptionChange = (
    projectIndex: number,
    taskIndex: number,
    value: string,
  ) => {
    const newUpdates = [...projectUpdates];
    if (newUpdates[projectIndex].tasks[taskIndex].type === "manual") {
      (newUpdates[projectIndex].tasks[taskIndex] as any).description = value;
    }
    setProjectUpdates(newUpdates);
  };

  const handleTaskStatusChange = (
    projectIndex: number,
    taskIndex: number,
    status: WorkStatus,
  ) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].tasks[taskIndex].status = status;
    setProjectUpdates(newUpdates);
  };

  const handleBlockersChange = (projectIndex: number, value: string) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].blockers = value;
    setProjectUpdates(newUpdates);
  };

  const handleNotesChange = (projectIndex: number, value: string) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].notes = value;
    setProjectUpdates(newUpdates);
  };

  const getAvailableProjects = (currentIndex: number) => {
    const selectedProjectIds = projectUpdates
      .map((update, index) =>
        index !== currentIndex ? update.projectId : null,
      )
      .filter(Boolean);

    return projects.filter(
      (project) => !selectedProjectIds.includes(project.value),
    );
  };

  const getTotalHours = () => {
    return projectUpdates.reduce(
      (sum, update) => sum + (update.hoursWorked || 0),
      0,
    );
  };

  const validateForm = () => {
    for (let i = 0; i < projectUpdates.length; i++) {
      const update = projectUpdates[i];

      if (isMissedUpdate && !missedDate) {
        messageApi.error("Please select a missed update date");
        return false;
      }

      if (!update.projectId) {
        messageApi.error(`Please select a project for update #${i + 1}`);
        return false;
      }

      if (!update.startTime || !update.endTime) {
        messageApi.error(`Please set start and end time for ${update.projectName || `update #${i + 1}`}`);
        return false;
      }

      if (update.tasks.length === 0) {
        messageApi.error(`Please add at least one task for ${update.projectName || `update #${i + 1}`}`);
        return false;
      }

      for (let j = 0; j < update.tasks.length; j++) {
        const task = update.tasks[j];

        if (task.type === "ticket" && !task.ticketId) {
          messageApi.error(`Task #${j + 1} in ${update.projectName || `update #${i + 1}`}: Please select a ticket`);
          return false;
        }

        if (task.type === "manual" && !task.description?.trim()) {
          messageApi.error(`Task #${j + 1} in ${update.projectName || `update #${i + 1}`}: Please provide a description`);
          return false;
        }

        if (!task.status) {
          messageApi.error(`Task #${j + 1} in ${update.projectName || `update #${i + 1}`}: Please select a status`);
          return false;
        }
      }
    }

    const projectIds = projectUpdates.map((update) => update.projectId);
    const uniqueProjectIds = new Set(projectIds);
    if (projectIds.length !== uniqueProjectIds.size) {
      messageApi.error("You cannot select the same project multiple times");
      return false;
    }

    return true;
  };
  const handleSubmit = async () => {
    if (alreadySubmitted && !isEditAllowed) {
      messageApi.error("You can only edit within 24 hours of submission");
      return;
    }

    if (!validateForm()) return;

    if (isMissedUpdate && !missedDate) {
      messageApi.error("Please select a missed update date");
      return;
    }

    try {
      setLoading(true);

      const values = form.getFieldsValue();

      const now = new Date();
      const hour = now.getHours();
      const finalUpdateType = values.updateType || (hour < 14 ? "BOD" : "EOD");

      const submissionDate = alreadySubmitted && existingUpdate
        ? (existingUpdate.date || existingUpdate.working_date || existingUpdate.missed_updateAt || dayjs())
        : (isMissedUpdate ? missedDate : dayjs());

      const dateStr = dayjs(submissionDate).format("YYYY-MM-DD");

      const data = {
        date: dateStr,
        mood: values.mood,
        updateType: finalUpdateType as "BOD" | "EOD",
        projectUpdates,
        generalNotes: values.generalNotes,
        is_missed: isMissedUpdate,
        missed_updateAt: isMissedUpdate ? dateStr : undefined,
      };

      if (alreadySubmitted && existingUpdate) {
        await DailyUpdateService.updateUpdate(existingUpdate.id, data);
        messageApi.success("Daily update updated successfully!");
      } else {
        await DailyUpdateService.createUpdate(data);
        messageApi.success("Daily update submitted successfully!");
      }

      setTimeout(() => {
        router.push("/daily-updates/view");
      }, 1200);
    } catch (error: any) {
      let errorMessage = "Failed to submit daily update";

      if (error?.message) errorMessage = error.message;
      else if (error?.response?.data?.error)
        errorMessage = error.response.data.error;
      else if (error?.response?.data?.message)
        errorMessage = error.response.data.message;

      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubmission) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        <Card loading={true}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text>Checking submission status...</Text>
          </div>
        </Card>
      </div>
    );
  }

  const totalHours = getTotalHours();

  return (
    <div
      style={{
        margin: "0 -24px",
        height: "calc(100vh - 72px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--bg-pure-white)"
      }}
    >

      <style dangerouslySetInnerHTML={{
        __html: `
        .daily-update-scroll-area::-webkit-scrollbar { display: none; }
        .daily-update-scroll-area { scrollbar-width: none; -ms-overflow-style: none; }

        .premium-form-item .ant-form-item-label { padding-bottom: 4px !important; }
        .premium-form-item .ant-form-item-label > label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          height: auto !important;
        }
        .premium-form-item .ant-form-item-label > label::after { display: none; }
        .premium-form-item .ant-form-item-label > label.ant-form-item-required::before {
          color: #e11d48 !important;
          font-size: 12px !important;
          margin-right: 2px !important;
        }

        .mood-btn {
          transition: border-color .15s ease, background .15s ease, color .15s ease;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          color: var(--text-slate-700) !important;
          height: 32px !important;
          padding: 0 11px !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          font-size: 12px !important;
        }
        .mood-btn:hover { border-color: #cbd5e1 !important; }
        .mood-btn-active-happy    { background: #fef9c3 !important; border-color: #fde68a !important; color: #a16207 !important; }
        .mood-btn-active-neutral  { background: var(--bg-slate-50) !important; border-color: var(--border-slate-200) !important; color: var(--text-slate-900) !important; }
        .mood-btn-active-stressed { background: #ffedd5 !important; border-color: #fed7aa !important; color: #9a3412 !important; }
        .mood-btn-active-blocked  { background: #fee2e2 !important; border-color: #fca5a5 !important; color: #991b1b !important; }

        .dud-card {
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          background: var(--bg-pure-white);
          transition: border-color .15s ease;
        }
        .dud-card:hover { border-color: #cbd5e1; }

        .dud-task-row {
          transition: border-color .15s ease;
        }
        .dud-task-row:hover { border-color: #cbd5e1; }
        .dud-task-row .ant-select { height: 100%; }
        .dud-task-row .ant-select .ant-select-selector {
          height: 100% !important;
          display: flex;
          align-items: center;
        }
        .dud-task-row > .ant-btn {
          height: 100%;
          min-height: 32px;
        }

        @keyframes dudFadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dud-anim { animation: dudFadeUp .3s cubic-bezier(.2,.6,.2,1) both; }
      `}} />

      <TimeTrackingHeader
        style={{
          padding: '3px 32px',
          borderBottom: '1px solid var(--border-slate-200)',
          marginBottom: 20
        }}
        icon={<FileText size={20} color="#8b5cf6" />}
        title={alreadySubmitted ? "Edit Status Update" : "Submit Daily Update"}
        subTitle={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 12, color: "var(--text-slate-600)", fontWeight: 500 }}>
              {dayjs().format("dddd, MMMM D, YYYY")}
            </Text>
          </div>
        }
        description="Document your daily progress, accomplishments, and blockers."
        extra={
          <Space size={10} align="center">
            {alreadySubmitted && (
              <Tag color="success" style={{
                margin: 0,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "4px 10px",
                marginRight: 4
              }}>
                Submitted
              </Tag>
            )}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-slate-200)",
              background: "var(--bg-pure-white)",
              height: 38,
            }}>
              <Briefcase size={14} color="var(--text-slate-400)" />
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Projects
              </Text>
              <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>
                {projectUpdates.length}
              </Text>
            </div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-slate-200)",
              background: "var(--bg-pure-white)",
              height: 38,
            }}>
              <Clock size={14} color="#0ea5e9" />
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Total
              </Text>
              <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>
                {formatHours(totalHours)}
              </Text>
            </div>
            <Button
              type="primary"
              icon={alreadySubmitted ? <Save size={16} /> : <Send size={16} />}
              onClick={handleSubmit}
              loading={loading}
              disabled={alreadySubmitted && !isEditAllowed}
              style={{
                height: 38,
                padding: "0 20px",
                borderRadius: 10,
                fontWeight: 600,
                background: "#1677ff",
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: 'none'
              }}
            >
              {alreadySubmitted ? "Update Status" : "Submit Update"}
            </Button>
          </Space>
        }
      />

      {/* Internal Scroll Area */}
      <div className="daily-update-scroll-area" style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 32px 32px"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Form form={form} layout="vertical" className="premium-form-item">

            {/* Context Toolbar — Update Type + Mood + Missed Update */}
            <div className="dud-card" style={{
              padding: "12px 16px",
              marginBottom: isMissedUpdate ? 12 : 22,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 18,
              rowGap: 12,
            }}>
              {/* Update Type */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 11, color: "var(--text-slate-400)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                  Type
                </Text>
                <Form.Item name="updateType" noStyle>
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                  >
                    <Radio.Button value="BOD" style={{ width: 56, textAlign: "center", fontSize: 12, fontWeight: 600 }}>BOD</Radio.Button>
                    <Radio.Button value="EOD" style={{ width: 56, textAlign: "center", fontSize: 12, fontWeight: 600 }}>EOD</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </div>

              <div style={{ height: 22, width: 1, background: "var(--border-slate-200)" }} />

              {/* Mood */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 auto", minWidth: 0 }}>
                <Smile size={14} color="var(--text-slate-400)" />
                <Text style={{ fontSize: 11, color: "var(--text-slate-400)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  Feeling
                </Text>
                <Form.Item name="mood" noStyle>
                  <Space size={6} wrap>
                    {[
                      { key: "happy", icon: "😊", label: "Happy" },
                      { key: "neutral", icon: "😐", label: "Neutral" },
                      { key: "stressed", icon: "😰", label: "Stressed" },
                      { key: "blocked", icon: "🚫", label: "Blocked" }
                    ].map((m) => (
                      <Button
                        key={m.key}
                        className={`mood-btn ${form.getFieldValue("mood") === m.key ? `mood-btn-active-${m.key}` : ""}`}
                        onClick={() => {
                          form.setFieldsValue({ mood: m.key });
                          setProjectUpdates([...projectUpdates]);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </Button>
                    ))}
                  </Space>
                </Form.Item>
              </div>

              <div style={{ height: 22, width: 1, background: "var(--border-slate-200)" }} />

              {/* Missed Update */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={14} color={isMissedUpdate ? "#b45309" : "var(--text-slate-400)"} />
                <Text style={{ fontSize: 12, fontWeight: 600, color: isMissedUpdate ? "#92400e" : "var(--text-slate-700)" }}>
                  Missed Update
                </Text>
                <Switch
                  size="small"
                  checked={isMissedUpdate}
                  onChange={(checked) => {
                    setIsMissedUpdate(checked);
                    if (!checked) setMissedDate(null);
                  }}
                />
              </div>
            </div>

            {/* Missed-update date picker (revealed below toolbar) */}
            {isMissedUpdate && (
              <div className="dud-anim" style={{
                marginBottom: 22,
                padding: "12px 16px",
                background: isDark ? "rgba(251, 191, 36, 0.08)" : "#fffbeb",
                border: isDark ? "1px solid rgba(251, 191, 36, 0.2)" : "1px solid #fde68a",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <AlertTriangle size={16} color={isDark ? "#fbbf24" : "#b45309"} />
                <Text style={{ fontSize: 12, color: isDark ? "#fbbf24" : "#92400e", fontWeight: 600 }}>
                  Date for the missed update:
                </Text>
                <DatePicker
                  placeholder="Select missed date"
                  style={{ flex: 1, maxWidth: 240, borderRadius: 8 }}
                  value={missedDate}
                  onChange={(date) => setMissedDate(date)}
                  disabledDate={(current) =>
                    current && (current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day") || current.isBefore(dayjs().subtract(3, "day"), "day"))
                  }
                />
              </div>
            )}

            {/* Project Updates Section Title */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: "#6366f1" }} />
                <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)", letterSpacing: -0.1 }}>
                  Work Details
                </Text>
                <Text style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 500 }}>
                  · {projectUpdates.length} {projectUpdates.length === 1 ? "entry" : "entries"}
                </Text>
              </div>
              <Button
                icon={<Plus size={14} />}
                onClick={handleAddProject}
                disabled={projectUpdates.length >= projects.length}
                style={{
                  height: 32,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid var(--border-slate-200)",
                  background: "var(--bg-pure-white)",
                  color: "var(--text-slate-700)",
                }}
              >
                Add Project
              </Button>
            </div>

            {/* Project Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {projectUpdates.map((update, projectIndex) => (
                <div
                  key={projectIndex}
                  className="dud-card dud-anim"
                  style={{
                    overflow: "hidden",
                    animationDelay: `${projectIndex * 30}ms`,
                  }}
                >
                  {/* Card Header Strip */}
                  <div style={{
                    padding: "10px 16px",
                    background: "var(--bg-slate-50)",
                    borderBottom: "1px solid var(--border-slate-100)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "var(--bg-pure-white)",
                        border: "1px solid var(--border-slate-200)",
                        color: "var(--text-slate-700)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        flexShrink: 0,
                      }}>
                        {projectIndex + 1}
                      </div>
                      <Text strong style={{ color: "var(--text-slate-900)", fontSize: 13 }}>
                        Project Entry
                      </Text>
                      {update.projectName && (
                        <>
                          <span style={{ color: "var(--text-slate-400)", fontSize: 12 }}>·</span>
                          <Text style={{
                            fontSize: 12,
                            color: "var(--text-slate-600)",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {update.projectName}
                          </Text>
                        </>
                      )}
                      {update.hoursWorked > 0 && (
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          background: "#ecfdf5",
                          color: "#047857",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid #a7f3d0",
                          marginLeft: 4,
                          flexShrink: 0,
                        }}>
                          <Clock size={10} strokeWidth={2.5} />
                          {formatHours(update.hoursWorked)}
                        </div>
                      )}
                    </div>
                    {projectUpdates.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={13} />}
                        onClick={() => handleRemoveProject(projectIndex)}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div style={{ padding: 16 }}>
                    <Row gutter={14}>
                      <Col span={10}>
                        <Form.Item
                          label="Project & Client"
                          required
                          style={{ marginBottom: 14 }}
                        >
                          <Select
                            placeholder="Search and select project"
                            value={update.projectId || undefined}
                            onChange={(value) => handleProjectChange(projectIndex, value)}
                            options={getAvailableProjects(projectIndex).map((p) => ({
                              label: `${p.label} (${p.code})`,
                              value: p.value,
                            }))}
                            showSearch
                            optionFilterProp="label"
                            size="middle"
                            style={{ width: "100%" }}
                            suffixIcon={<ChevronRight size={14} />}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={14}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 96px", gap: 10 }}>
                          <Form.Item label="Start Time" required style={{ marginBottom: 14 }}>
                            <DatePicker
                              showTime
                              format="DD-MM-YYYY HH:mm"
                              placeholder="00-00-00 00:00"
                              value={update.startTime ? dayjs(update.startTime) : null}
                              onChange={(value) => handleTimeChange(projectIndex, "startTime", value)}
                              needConfirm={false}
                              disabledDate={(current) => {
                                if (isMissedUpdate) {
                                  if (missedDate) return !current.isSame(missedDate, "day");
                                  return current && (current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day") || current.isBefore(dayjs().subtract(3, "day"), "day"));
                                }

                                return current && current.isBefore(dayjs(), "day");
                              }}
                              style={{ width: "100%" }}
                              suffixIcon={<Clock size={14} />}
                            />
                          </Form.Item>
                          <Form.Item label="End Time" required style={{ marginBottom: 14 }}>
                            <DatePicker
                              showTime
                              format="DD-MM-YYYY HH:mm"
                              placeholder="00-00-00 00:00"
                              value={update.endTime ? dayjs(update.endTime) : null}
                              needConfirm={false}
                              onChange={(value) => handleTimeChange(projectIndex, "endTime", value)}
                              disabledDate={(current) => {
                                if (isMissedUpdate) {
                                  if (missedDate) return !current.isSame(missedDate, "day");
                                  return current && (current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day") || current.isBefore(dayjs().subtract(3, "day"), "day"));
                                }
                                return current && current.isBefore(dayjs(), "day");
                              }}
                              style={{ width: "100%" }}
                              suffixIcon={<Clock size={14} />}
                            />
                          </Form.Item>
                          <Form.Item label="Total" style={{ marginBottom: 14 }}>
                            <div style={{
                              height: 32,
                              background: "var(--bg-slate-50)",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--border-slate-200)",
                              fontWeight: 700,
                              color: update.hoursWorked > 0 ? "#047857" : "var(--text-slate-400)",
                              fontSize: 13,
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            }}>
                              {update.hoursWorked > 0 ? formatHours(update.hoursWorked) : "—"}
                            </div>
                          </Form.Item>
                        </div>
                      </Col>
                    </Row>

                    {/* Tasks Content Area */}
                    <div style={{
                      marginTop: 4,
                      padding: 14,
                      background: "var(--bg-slate-50)",
                      borderRadius: 10,
                      border: "1px solid var(--border-slate-200)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <ListChecks size={14} color="var(--text-slate-600)" />
                          <Text style={{
                            fontSize: 11,
                            color: "var(--text-slate-600)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}>
                            Tasks &amp; Deliverables · {update.tasks.length}
                          </Text>
                        </div>
                        <Button
                          size="small"
                          icon={<Plus size={12} />}
                          onClick={() => handleAddTask(projectIndex)}
                          style={{
                            height: 26,
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            border: "1px solid var(--border-slate-200)",
                            background: "var(--bg-pure-white)",
                            color: "var(--text-slate-700)",
                          }}
                        >
                          Add Task
                        </Button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {update.tasks.map((task, taskIndex) => (
                          <div
                            key={taskIndex}
                            className="dud-task-row"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "112px minmax(0, 1fr) 170px 32px",
                              gap: 8,
                              alignItems: "stretch",
                              background: "var(--bg-pure-white)",
                              padding: 8,
                              borderRadius: 8,
                              border: "1px solid var(--border-slate-200)",
                            }}
                          >
                            <Select
                              size="small"
                              value={task.type}
                              onChange={(val) => handleTaskTypeChange(projectIndex, taskIndex, val as any)}
                              options={[
                                { label: "Ticket", value: "ticket" },
                                { label: "Manual", value: "manual" },
                              ]}
                              style={{ width: "100%" }}
                            />

                            {task.type === "ticket" ? (
                              <Select
                                size="small"
                                placeholder="Select ticket"
                                value={task.ticketId || undefined}
                                onChange={(value) => handleTicketSelect(projectIndex, taskIndex, value)}
                                options={projectTickets[update.projectId]?.map((t) => ({
                                  label: `${t.ticketNumber} - ${t.title}`,
                                  value: t.id,
                                })) || []}
                                showSearch
                                optionFilterProp="label"
                                style={{ width: "100%" }}
                                disabled={!update.projectId}
                              />
                            ) : (
                              <TextArea
                                size="small"
                                placeholder="Task description..."
                                autoSize={{ minRows: 1, maxRows: 3 }}
                                value={task.description || ""}
                                onChange={(e) => handleTaskDescriptionChange(projectIndex, taskIndex, e.target.value)}
                                style={{ padding: "4px 10px", fontSize: 13 }}
                              />
                            )}

                            <Select
                              size="small"
                              placeholder="Status"
                              value={task.status}
                              onChange={(value) => handleTaskStatusChange(projectIndex, taskIndex, value as WorkStatus)}
                              options={STATUS_OPTIONS}
                              style={{ width: "100%" }}
                            />

                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<Trash2 size={14} />}
                              onClick={() => handleRemoveTask(projectIndex, taskIndex)}
                              disabled={update.tasks.length === 1}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Blockers & Notes Grid */}
                    <Row gutter={12} style={{ marginTop: 14 }}>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <AlertTriangle size={12} color="#f59e0b" />
                              Blockers
                            </span>
                          }
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea
                            rows={2}
                            placeholder="Any blockers or dependencies…"
                            value={update.blockers}
                            onChange={(e) => handleBlockersChange(projectIndex, e.target.value)}
                            style={{ borderRadius: 8, fontSize: 13 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <MessageSquare size={12} color="var(--text-slate-600)" />
                              Comments
                            </span>
                          }
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea
                            rows={2}
                            placeholder="Project specific notes…"
                            value={update.notes}
                            onChange={(e) => handleNotesChange(projectIndex, e.target.value)}
                            style={{ borderRadius: 8, fontSize: 13 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </div>
              ))}
            </div>

            {/* General Comments Section */}
            <div className="dud-card" style={{ marginTop: 22, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <MessageSquare size={15} color="var(--text-slate-600)" />
                <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>
                  General Comments
                </Text>
                <Text style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 500 }}>
                  · Optional
                </Text>
              </div>
              <Form.Item name="generalNotes" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={4}
                  placeholder="Provide any overall updates, wins, or concerns for the day…"
                  style={{
                    borderRadius: 8,
                    border: "1px solid var(--border-slate-200)",
                    background: "var(--bg-pure-white)",
                    padding: 12,
                    fontSize: 13,
                  }}
                />
              </Form.Item>
            </div>

            {/* Daily Total Summary */}
            <div style={{
              marginTop: 18,
              padding: "14px 18px",
              background: "var(--bg-pure-white)",
              borderRadius: 12,
              border: "1px solid var(--border-slate-200)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Clock size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 13, lineHeight: 1.3 }}>
                    Daily Total
                  </Text>
                  <Text style={{ display: "block", fontSize: 11, color: "var(--text-slate-400)", lineHeight: 1.3 }}>
                    Time logged across all project entries
                  </Text>
                </div>
              </div>
              <Text strong style={{
                fontSize: 22,
                color: "var(--text-slate-900)",
                letterSpacing: -0.4,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}>
                {formatHours(totalHours)}
              </Text>
            </div>

            {/* Extra Spacing Bottom */}
            <div style={{ height: 40 }} />
          </Form>
        </div>
      </div>
    </div>
  );
}
