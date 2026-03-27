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
  notification,
  Tag,
  DatePicker,
  Radio,
  Row,
  Col,
  Switch,
  Spin,
} from "antd";
import type { NotificationArgsProps } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  WarningOutlined,
  CalendarOutlined,
  ClockCircleTwoTone,
  EditOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Clock,
  Trash2,
  Plus,
  AlertCircle,
  Save,
  Send,
  Calendar,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Activity,
  Zap,
  FileText
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
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
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;
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
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
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
      });
    } catch (error) {
      api.error({
        message: "Error",
        description: "Failed to load update for editing",
      });
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
      api.error({
        message: "Error",
        description: "Failed to load projects",
        placement: "bottomRight",
        duration: 4,
      });
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
      api.error({
        message: "Error",
        description: "Failed to load tickets for this project",
        placement: "bottomRight",
        duration: 4,
      });
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
      api.warning({
        message: "Warning",
        description: "At least one project update is required",
        placement: "bottomRight",
        duration: 3,
      });
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
      api.warning({
        message: "Warning",
        description: "At least one task is required",
        placement: "bottomRight",
        duration: 3,
      });
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
        api.error({
          message: "Validation Error",
          description: "Please select a missed update date",
          placement: "bottomRight",
          duration: 4,
        });
        return false;
      }

      if (!update.projectId) {
        api.error({
          message: "Validation Error",
          description: `Please select a project for update #${i + 1}`,
          placement: "bottomRight",
          duration: 4,
        });
        return false;
      }

      if (!update.startTime || !update.endTime) {
        api.error({
          message: "Validation Error",
          description: `Please set start and end time for ${update.projectName}`,
          placement: "bottomRight",
          duration: 4,
        });
        return false;
      }

      if (update.tasks.length === 0) {
        api.error({
          message: "Validation Error",
          description: `Please add at least one task for ${update.projectName}`,
          placement: "bottomRight",
          duration: 4,
        });
        return false;
      }

      for (let j = 0; j < update.tasks.length; j++) {
        const task = update.tasks[j];

        if (task.type === "ticket" && !task.ticketId) {
          api.error({
            message: "Validation Error",
            description: `Task #${j + 1} in ${update.projectName
              }: Please select a ticket`,
            placement: "bottomRight",
            duration: 4,
          });
          return false;
        }

        if (task.type === "manual" && !task.description?.trim()) {
          api.error({
            message: "Validation Error",
            description: `Task #${j + 1} in ${update.projectName
              }: Please provide a description`,
            placement: "bottomRight",
            duration: 4,
          });
          return false;
        }

        if (!task.status) {
          api.error({
            message: "Validation Error",
            description: `Task #${j + 1} in ${update.projectName
              }: Please select a status`,
            placement: "bottomRight",
            duration: 4,
          });
          return false;
        }
      }
    }

    const projectIds = projectUpdates.map((update) => update.projectId);
    const uniqueProjectIds = new Set(projectIds);
    if (projectIds.length !== uniqueProjectIds.size) {
      api.error({
        message: "Validation Error",
        description: "You cannot select the same project multiple times",
        placement: "bottomRight",
        duration: 4,
      });
      return false;
    }

    return true;
  };
  const handleSubmit = async () => {
    if (alreadySubmitted && !isEditAllowed) {
      api.error({
        message: "Edit Locked",
        description: "You can only edit within 24 hours of submission",
      });
      return;
    }

    if (!validateForm()) return;

    if (isMissedUpdate && !missedDate) {
      api.error({
        message: "Validation Error",
        description: "Please select a missed update date",
      });
      return;
    }

    try {
      setLoading(true);

      const values = form.getFieldsValue();

      // 🔒 LOCK updateType based on time
      const now = new Date();
      const hour = now.getHours();
      const finalUpdateType = hour < 14 ? "BOD" : "EOD";

      const submissionDate = alreadySubmitted && existingUpdate
        ? (existingUpdate.date || existingUpdate.working_date || existingUpdate.missed_updateAt || dayjs())
        : (isMissedUpdate ? missedDate : dayjs());

      const dateStr = dayjs(submissionDate).format("YYYY-MM-DD");

      const data = {
        date: dateStr,
        mood: values.mood,
        updateType: finalUpdateType,
        projectUpdates,
        generalNotes: values.generalNotes,
        is_missed: isMissedUpdate,
        missed_updateAt: isMissedUpdate ? dateStr : null,
      };

      if (alreadySubmitted && existingUpdate) {
        await DailyUpdateService.updateUpdate(existingUpdate.id, data);
        api.success({
          message: "Success",
          description: "Daily update updated successfully!",
          placement: "bottomRight",
          duration: 3,
        });
      } else {
        await DailyUpdateService.createUpdate(data);
        api.success({
          message: "Success",
          description: "Daily update submitted successfully!",
          placement: "bottomRight",
          duration: 3,
        });
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

      api.error({
        message: "Error",
        description: errorMessage,
        placement: "bottomRight",
        duration: 4,
      });
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
        backgroundColor: "#ffffff"
      }}
    >
      {contextHolder}

      <style dangerouslySetInnerHTML={{
        __html: `
        .daily-update-scroll-area::-webkit-scrollbar {
          display: none;
        }
        .daily-update-scroll-area {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .premium-form-item .ant-form-item-label > label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }
        .mood-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0 !important;
          height: 38px !important;
          border-radius: 10px !important;
        }
        .mood-btn-active-happy { background: #f0fdf4 !important; border-color: #22c55e !important; color: #166534 !important; }
        .mood-btn-active-neutral { background: #f8fafc !important; border-color: #64748b !important; color: #1e293b !important; }
        .mood-btn-active-stressed { background: #fffbeb !important; border-color: #f59e0b !important; color: #92400e !important; }
        .mood-btn-active-blocked { background: #fff1f2 !important; border-color: #f43f5e !important; color: #9f1239 !important; }
        
        .project-card {
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          background: #ffffff !important;
        }
        .project-card:hover {
          border-color: #0ea5e9 !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
        }
      `}} />

      {/* Premium Header */}
      <div style={{
        padding: "16px 32px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 14, color: "#0ea5e9", display: "flex" }}>
            <FileText size={28} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {alreadySubmitted ? "Edit Status Update" : "Submit Daily Update"}
            </Title>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                {dayjs().format("dddd, MMMM D, YYYY")}
              </Text>
              {alreadySubmitted && (
                <Tag color="success" style={{
                  margin: 0,
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "0 8px"
                }}>
                  Submitted
                </Tag>
              )}
            </div>
          </div>
        </div>

        <Space size="middle">
          <div style={{ textAlign: "right", marginRight: 16 }}>
            <Text style={{ fontSize: 11, color: "#64748b", display: "block" }}>Project Entries</Text>
            <Text strong style={{ fontSize: 18, color: "#0f172a" }}>{projectUpdates.length}</Text>
          </div>
          <div style={{ textAlign: "right", marginRight: 16 }}>
            <Text style={{ fontSize: 11, color: "#64748b", display: "block" }}>Total Hours</Text>
            <Text strong style={{ fontSize: 18, color: "#0ea5e9" }}>{formatHours(totalHours)}</Text>
          </div>
          <Button
            type="primary"
            icon={alreadySubmitted ? <Save size={16} /> : <Send size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={alreadySubmitted && !isEditAllowed}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              fontWeight: 600,
              // background: "#0ea5e9",
              background: "#1677ff",
              // borderColor: "#0ea5e9",
              // boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {alreadySubmitted ? "Update Status" : "Submit Update"}
          </Button>
        </Space>
      </div>

      {/* Internal Scroll Area */}
      <div className="daily-update-scroll-area" style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 32px"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Form form={form} layout="vertical" className="premium-form-item">

            {/* Daily Context Section */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: 20,
              marginBottom: 24
            }}>
              {/* Mood Card */}
              <Card
                style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                bodyStyle={{ padding: "16px 20px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#f0f9ff", padding: 8, borderRadius: 10, color: "#0ea5e9" }}>
                      <Smile size={20} />
                    </div>
                    <Text strong style={{ fontSize: 14, color: "#1e293b" }}>How are you feeling?</Text>
                  </div>
                  <Form.Item name="mood" noStyle>
                    <Space size={8}>
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
                            setProjectUpdates([...projectUpdates]); // force re-render
                          }}
                          style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </Button>
                      ))}
                    </Space>
                  </Form.Item>
                </div>
              </Card>

              {/* Update Type & Date Card */}
              <Card
                style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                bodyStyle={{ padding: "16px 20px" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <Form.Item name="updateType" noStyle>
                    <Radio.Group
                      optionType="button"
                      buttonStyle="solid"
                      size="middle"
                      style={{ borderRadius: 8, overflow: "hidden" }}
                    >
                      <Radio.Button value="BOD" style={{ width: 60, textAlign: "center" }}>BOD</Radio.Button>
                      <Radio.Button value="EOD" style={{ width: 60, textAlign: "center" }}>EOD</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <div style={{ height: 24, width: 1, background: "#e2e8f0" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Switch
                      size="small"
                      checked={isMissedUpdate}
                      onChange={(checked) => {
                        setIsMissedUpdate(checked);
                        if (!checked) setMissedDate(null);
                      }}
                    />
                    <Text style={{ fontSize: 12, fontWeight: 500, color: isMissedUpdate ? "#f59e0b" : "#64748b" }}>
                      Missed Update
                    </Text>
                  </div>
                </div>
                {isMissedUpdate && (
                  <div style={{ marginTop: 12 }}>
                    <DatePicker
                      placeholder="Select missed date"
                      style={{ width: "100%", borderRadius: 8 }}
                      value={missedDate}
                      onChange={(date) => setMissedDate(date)}
                      disabledDate={(current) =>
                        current && (current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day") || current.isBefore(dayjs().subtract(3, "day"), "day"))
                      }
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Project Updates Section Title */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              padding: "0 4px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Activity size={18} color="#0ea5e9" />
                <Text strong style={{ fontSize: 16, color: "#1e293b" }}>Work Details</Text>
              </div>
              <Button
                type="link"
                icon={<Plus size={16} />}
                onClick={handleAddProject}
                disabled={projectUpdates.length >= projects.length}
                style={{ fontWeight: 600, fontSize: 14, color: "#0ea5e9" }}
              >
                Add Project
              </Button>
            </div>

            {/* Project Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {projectUpdates.map((update, projectIndex) => (
                <Card
                  key={projectIndex}
                  className="project-card"
                  bodyStyle={{ padding: 0 }}
                >
                  {/* Card Header Strip */}
                  <div style={{
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <Space size="middle">
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: "#0ea5e9",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        {projectIndex + 1}
                      </div>
                      <Text strong style={{ color: "#1e293b" }}>Project Entry</Text>
                    </Space>
                    {projectUpdates.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleRemoveProject(projectIndex)}
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div style={{ padding: 20 }}>
                    <Row gutter={24}>
                      <Col span={10}>
                        <Form.Item
                          label="Project & Client"
                          required
                          style={{ marginBottom: 16 }}
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
                            size="middle"
                            style={{ width: "100%" }}
                            suffixIcon={<ChevronRight size={14} />}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={14}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 12 }}>
                          <Form.Item label="Start Time" required style={{ marginBottom: 16 }}>
                            <DatePicker
                              showTime
                              format="DD-MM-YYYY HH:mm"
                              placeholder="00-00-00 00:00"
                              value={update.startTime ? dayjs(update.startTime) : null}
                              onChange={(value) => handleTimeChange(projectIndex, "startTime", value)}
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
                          <Form.Item label="End Time" required style={{ marginBottom: 16 }}>
                            <DatePicker
                              showTime
                              format="DD-MM-YYYY HH:mm"
                              placeholder="00-00-00 00:00"
                              value={update.endTime ? dayjs(update.endTime) : null}
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
                          <Form.Item label="Total" style={{ marginBottom: 16 }}>
                            <div style={{
                              height: 32,
                              background: "#f1f5f9",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #e2e8f0",
                              fontWeight: 600,
                              color: "#0f172a",
                              fontSize: 13
                            }}>
                              {update.hoursWorked > 0 ? formatHours(update.hoursWorked) : "0h 0m"}
                            </div>
                          </Form.Item>
                        </div>
                      </Col>
                    </Row>

                    {/* Tasks Content Area */}
                    <div style={{
                      marginTop: 8,
                      padding: 16,
                      background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      borderLeft: "4px solid #0ea5e9"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckCircle2 size={14} color="#22c55e" />
                          <Text strong style={{ fontSize: 13, color: "#475569" }}>Tasks & Deliverables</Text>
                        </div>
                        <Button
                          type="link"
                          size="small"
                          icon={<Plus size={14} />}
                          onClick={() => handleAddTask(projectIndex)}
                          style={{ padding: 0, height: "auto", fontWeight: 600 }}
                        >
                          Add Task
                        </Button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {update.tasks.map((task, taskIndex) => (
                          <div
                            key={taskIndex}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "140px 1fr 180px 32px",
                              gap: 12,
                              alignItems: "flex-start",
                              background: "#ffffff",
                              padding: 10,
                              borderRadius: 10,
                              border: "1px solid #e2e8f0"
                            }}
                          >
                            <Select
                              size="small"
                              value={task.type}
                              onChange={(val) => handleTaskTypeChange(projectIndex, taskIndex, val as any)}
                              options={[
                                { label: "Ticket", value: "ticket" },
                                { label: "Manual", value: "manual" }
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
                                style={{ padding: "4px 11px" }}
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
                    <Row gutter={16} style={{ marginTop: 20 }}>
                      <Col span={12}>
                        <Form.Item
                          label={<span style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color="#f59e0b" /> Blockers</span>}
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea
                            rows={2}
                            placeholder="Any blockers or dependencies..."
                            value={update.blockers}
                            onChange={(e) => handleBlockersChange(projectIndex, e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={<span style={{ display: "flex", alignItems: "center", gap: 6 }}><MessageSquare size={14} color="#64748b" />  Comments</span>}
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea
                            rows={2}
                            placeholder="Project specific notes..."
                            value={update.notes}
                            onChange={(e) => handleNotesChange(projectIndex, e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Card>
              ))}
            </div>

            {/* General Section */}
            <div style={{ marginTop: 32 }}>
              <div style={{
                padding: "24px 32px",
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <MessageSquare size={18} color="#64748b" />
                  <Text strong style={{ fontSize: 16, color: "#1e293b", margin: 0 }}>
                    General Comments
                  </Text>
                </div>
                <Form.Item name="generalNotes" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={4}
                    placeholder="Provide any overall updates, wins, or concerns for the day..."
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: 16 }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div style={{
              marginTop: 24,
              padding: "12px 20px",
              background: "#eff6ff",
              borderRadius: 12,
              border: "1px solid #bfdbfe",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#3b82f6", padding: 6, borderRadius: 8, color: "white" }}>
                  <Clock size={16} />
                </div>
                <div>
                  <Text strong style={{ color: "#1e40af", fontSize: 13 }}>Final Review</Text>
                  <Text type="secondary" style={{ display: "block", fontSize: 11, color: "#60a5fa" }}>
                    Total logged time for all selected projects today
                  </Text>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text style={{ fontSize: 12, color: "#1e40af", fontWeight: 500 }}>Daily Total:</Text>
                <Text strong style={{ fontSize: 20, color: "#2563eb", marginLeft: 8 }}>{formatHours(totalHours)}</Text>
              </div>
            </div>

            {/* Extra Spacing Bottom */}
            <div style={{ height: 40 }} />
          </Form>
        </div>
      </div>
    </div>
  );
}
