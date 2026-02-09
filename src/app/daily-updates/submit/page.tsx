"use client";

import React, { useState, useEffect } from "react";
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
} from "antd";
import type { NotificationArgsProps } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
import { useSearchParams } from "next/navigation";

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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading..." />
      </MainLayout>
    );
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
  /////////////////
  // useEffect(() => {
  //   const now = new Date();
  //   const hour = now.getHours();

  //   if (hour < 14) {
  //     form.setFieldsValue({ updateType: "BOD" });

  //     const twoPM = new Date();
  //     twoPM.setHours(14, 0, 0, 0);

  //     const delay = twoPM.getTime() - now.getTime();

  //     if (delay > 0) {
  //       const timer = setTimeout(() => {
  //         form.setFieldsValue({ updateType: "EOD" });
  //       }, delay);

  //       return () => clearTimeout(timer);
  //     }
  //   } else {
  //     form.setFieldsValue({ updateType: "EOD" });
  //   }
  // }, []);
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

  const handleProjectChange = async (index: number, projectId: string) => {
    const project = projects.find((p) => p.value === projectId);
    const newUpdates = [...projectUpdates];
    newUpdates[index].projectId = projectId;
    newUpdates[index].projectName = project?.label || "";
    setProjectUpdates(newUpdates);

    // Fetch tickets for this project
    await fetchProjectTickets(projectId);
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
            description: `Task #${j + 1} in ${
              update.projectName
            }: Please select a ticket`,
            placement: "bottomRight",
            duration: 4,
          });
          return false;
        }

        if (task.type === "manual" && !task.description?.trim()) {
          api.error({
            message: "Validation Error",
            description: `Task #${j + 1} in ${
              update.projectName
            }: Please provide a description`,
            placement: "bottomRight",
            duration: 4,
          });
          return false;
        }

        if (!task.status) {
          api.error({
            message: "Validation Error",
            description: `Task #${j + 1} in ${
              update.projectName
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

  // const handleSubmit = async () => {
  //   if (alreadySubmitted && !isEditAllowed) {
  //     api.error({
  //       message: "Edit Locked",
  //       description: "You can only edit within 24 hours of submission",
  //     });
  //     return;
  //   }
  //   if (!validateForm()) return;

  //   if (isMissedUpdate && !missedDate) {
  //     api.error({
  //       message: "Validation Error",
  //       description: "Please select a missed update date",
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const values = form.getFieldsValue();
  //     console.log("values", values);

  //     const data = {
  //       date:
  //         alreadySubmitted && existingUpdate
  //           ? existingUpdate.working_date // 🔥 EDIT MODE – keep same date
  //           : isMissedUpdate
  //             ? missedDate!.format("YYYY-MM-DD")
  //             : dayjs().format("YYYY-MM-DD"),

  //       mood: values.mood,
  //       updateType: values.updateType,
  //       projectUpdates: projectUpdates,
  //       generalNotes: values.generalNotes,
  //       is_missed: isMissedUpdate,
  //       missed_updateAt: isMissedUpdate
  //         ? missedDate?.format("YYYY-MM-DD")
  //         : null,
  //     };
  //     console.log("data", data);

  //     if (alreadySubmitted && existingUpdate) {
  //       await DailyUpdateService.updateUpdate(existingUpdate.id, data);
  //       api.success({
  //         message: "Success",
  //         description: "Daily update updated successfully!",
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //       setTimeout(() => {
  //         router.push("/daily-updates/view");
  //       }, 1200);
  //     } else {
  //       await DailyUpdateService.createUpdate(data);
  //       api.success({
  //         message: "Success",
  //         description: "Daily update submitted successfully!",
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //     }

  //     // router.push("/daily-updates/view");
  //     setTimeout(() => {
  //       router.push("/daily-updates/view");
  //     }, 1200);
  //   } catch (error: any) {
  //     console.error("Failed to submit update:", error);

  //     // Extract error message from various error formats
  //     let errorMessage = "Failed to submit daily update";

  //     if (error?.message) {
  //       errorMessage = error.message;
  //     } else if (error?.response?.data?.error) {
  //       errorMessage = error.response.data.error;
  //     } else if (error?.response?.data?.message) {
  //       errorMessage = error.response.data.message;
  //     } else if (typeof error === "string") {
  //       errorMessage = error;
  //     }

  //     // Display error message as toast notification
  //     api.error({
  //       message: "Error",
  //       description: errorMessage,
  //       placement: "bottomRight",
  //       duration: 4,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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

    const data = {
      date:
        alreadySubmitted && existingUpdate
          ? existingUpdate.working_date
          : isMissedUpdate
          ? missedDate!.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),

      mood: values.mood,
      updateType: finalUpdateType, // ✅ IMPORTANT
      projectUpdates,
      generalNotes: values.generalNotes,
      is_missed: isMissedUpdate,
      missed_updateAt: isMissedUpdate
        ? missedDate?.format("YYYY-MM-DD")
        : null,
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
    else if (error?.response?.data?.error) errorMessage = error.response.data.error;
    else if (error?.response?.data?.message) errorMessage = error.response.data.message;

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
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {contextHolder}
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {alreadySubmitted
            ? "Edit Daily Status Update"
            : "Submit Daily Status Update"}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        {alreadySubmitted && (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ marginLeft: 12, fontSize: 12 }}
          >
            Already Submitted Today
          </Tag>
        )}
      </div>

      {/* Form Card */}
      <Card
        style={{
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Form form={form} layout="vertical">
          {/* Mood Section */}

          <Form.Item
            label={
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                How are you feeling today?
              </span>
            }
            name="mood"
            style={{ marginBottom: 20 }}
          >
            {/* ONE ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              {/* LEFT SIDE – MOOD BUTTONS */}
              <Space size="small" wrap>
                <Button
                  icon={<span style={{ fontSize: 16 }}>😊</span>}
                  onClick={() => form.setFieldsValue({ mood: "happy" })}
                  type={
                    form.getFieldValue("mood") === "happy"
                      ? "primary"
                      : "default"
                  }
                >
                  Happy
                </Button>

                <Button
                  icon={<span style={{ fontSize: 16 }}>😐</span>}
                  onClick={() => form.setFieldsValue({ mood: "neutral" })}
                  type={
                    form.getFieldValue("mood") === "neutral"
                      ? "primary"
                      : "default"
                  }
                >
                  Neutral
                </Button>

                <Button
                  icon={<span style={{ fontSize: 16 }}>😰</span>}
                  onClick={() => form.setFieldsValue({ mood: "stressed" })}
                  type={
                    form.getFieldValue("mood") === "stressed"
                      ? "primary"
                      : "default"
                  }
                >
                  Stressed
                </Button>

                <Button
                  icon={<span style={{ fontSize: 16 }}>🚫</span>}
                  onClick={() => form.setFieldsValue({ mood: "blocked" })}
                  type={
                    form.getFieldValue("mood") === "blocked"
                      ? "primary"
                      : "default"
                  }
                >
                  Blocked
                </Button>
              </Space>

              {/* RIGHT SIDE – DROPDOWN */}
              <Form.Item name="updateType" noStyle>
                <Select
                  style={{ width: 120 }}
                  options={[
                    { label: "BOD", value: "BOD" },
                    { label: "EOD", value: "EOD" },
                  ]}
                />
              </Form.Item>
            </div>
          </Form.Item>
          {/* Missed Update Toggle */}
          <Card
            style={{
              marginBottom: 16,
              border: "1px dashed #d9d9d9",
              background: "#fafafa",
            }}
          >
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space
                align="center"
                size={6}
                style={{ display: "flex", flexWrap: "wrap" }}
              >
                <Text strong>Missed Update</Text>

                <Switch
                  size="small"
                  checked={isMissedUpdate}
                  onChange={(checked) => {
                    setIsMissedUpdate(checked);
                    console.log("checked", checked);
                    if (!checked) {
                      setMissedDate(null);
                    }
                  }}
                />

                {isMissedUpdate && (
                  <Tag color="orange" style={{ margin: 0 }}>
                    Missed
                  </Tag>
                )}

                {isMissedUpdate && (
                  <DatePicker
                    placeholder="Select missed update date"
                    style={{ width: 250 }}
                    value={missedDate}
                    onChange={(date) => setMissedDate(date)}
                    disabledDate={(current) =>
                      current &&
                      (current.isAfter(dayjs(), "day") ||
                        current.isBefore(dayjs().subtract(3, "day"), "day"))
                    }
                  />
                )}
              </Space>
            </Space>
          </Card>

          {/* Project Updates Section */}
          <div style={{ marginBottom: 24 }}>
            <Text
              strong
              style={{ fontSize: 15, display: "block", marginBottom: 16 }}
            >
              Project Updates
            </Text>

            {projectUpdates.map((update, projectIndex) => (
              <div
                key={projectIndex}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  backgroundColor: "#fafafa",
                  position: "relative",
                }}
              >
                {/* Project Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text strong style={{ fontSize: 14 }}>
                    Project Entry #{projectIndex + 1}
                  </Text>
                  {projectUpdates.length > 1 && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveProject(projectIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {/* Project Selection */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      Project <span style={{ color: "#ff4d4f" }}>*</span>
                    </span>
                  }
                  required={false}
                  validateStatus={!update.projectId ? "error" : "success"}
                  help={!update.projectId && "Please select a project"}
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    placeholder="Select a project"
                    value={update.projectId || undefined}
                    onChange={(value) =>
                      handleProjectChange(projectIndex, value)
                    }
                    options={getAvailableProjects(projectIndex).map(
                      (project) => ({
                        label: `${project.label} (${project.code})`,
                        value: project.value,
                      }),
                    )}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>

                {/* Time Tracking */}
                <div style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    ⏰ Time Tracking <span style={{ color: "#ff4d4f" }}>*</span>
                  </Text>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label={<span style={{ fontSize: 12 }}>Start Time</span>}
                        required={false}
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          showTime
                          format="DD-MM-YYYY HH:mm"
                          placeholder="dd-mm-yyyy --:--"
                          value={
                            update.startTime ? dayjs(update.startTime) : null
                          }
                          onChange={(value) =>
                            handleTimeChange(projectIndex, "startTime", value)
                          }
                          style={{ width: "100%" }}
                          disabledDate={(current) => {
                            if (!isMissedUpdate) {
                              // Toggle OFF → disable all past dates (yesterday, missed updates)
                              return (
                                current && current < dayjs().startOf("day")
                              );
                            }
                            // Toggle ON → allow everything (past + future)
                            return false;
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label={<span style={{ fontSize: 12 }}>End Time</span>}
                        required={false}
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          showTime
                          format="DD-MM-YYYY HH:mm"
                          placeholder="dd-mm-yyyy --:--"
                          value={update.endTime ? dayjs(update.endTime) : null}
                          onChange={(value) =>
                            handleTimeChange(projectIndex, "endTime", value)
                          }
                          style={{ width: "100%" }}
                          disabledDate={(current) => {
                            if (!isMissedUpdate) {
                              // Toggle OFF → disable all past dates (yesterday, missed updates)
                              return (
                                current && current < dayjs().startOf("day")
                              );
                            }
                            // Toggle ON → allow everything (past + future)
                            return false;
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label={
                          <span style={{ fontSize: 12 }}>Total Hours</span>
                        }
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          value={
                            update.hoursWorked > 0
                              ? formatHours(update.hoursWorked)
                              : "0h 0m"
                          }
                          disabled
                          prefix={<ClockCircleOutlined />}
                          style={{ backgroundColor: "#f5f5f5" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* Work Summary - Tasks */}
                <div style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    📝 Work Summary <span style={{ color: "#ff4d4f" }}>*</span>
                  </Text>

                  {update.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 12,
                        backgroundColor: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: 500 }}>
                          Task #{taskIndex + 1}
                        </Text>
                        {update.tasks.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              handleRemoveTask(projectIndex, taskIndex)
                            }
                          />
                        )}
                      </div>

                      {/* Task Type Selector */}
                      <Radio.Group
                        value={task.type}
                        onChange={(e) =>
                          handleTaskTypeChange(
                            projectIndex,
                            taskIndex,
                            e.target.value,
                          )
                        }
                        style={{ marginBottom: 8 }}
                        size="small"
                      >
                        <Radio value="ticket">Ticket</Radio>
                        <Radio value="manual">Manual Description</Radio>
                      </Radio.Group>

                      {/* Conditional Input */}
                      {task.type === "ticket" ? (
                        <Select
                          placeholder="Select ticket"
                          value={task.ticketId || undefined}
                          onChange={(value) =>
                            handleTicketSelect(projectIndex, taskIndex, value)
                          }
                          options={
                            projectTickets[update.projectId]?.map((ticket) => ({
                              label: `${ticket.ticketNumber} - ${ticket.title}`,
                              value: ticket.id,
                            })) || []
                          }
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          style={{ width: "100%", marginBottom: 8 }}
                          disabled={!update.projectId}
                        />
                      ) : (
                        <TextArea
                          placeholder="Describe what you worked on..."
                          value={task.description || ""}
                          onChange={(e) =>
                            handleTaskDescriptionChange(
                              projectIndex,
                              taskIndex,
                              e.target.value,
                            )
                          }
                          rows={2}
                          style={{ marginBottom: 8 }}
                        />
                      )}

                      {/* Status Selector */}
                      <Select
                        placeholder="Select status"
                        value={task.status}
                        onChange={(value) =>
                          handleTaskStatusChange(
                            projectIndex,
                            taskIndex,
                            value as WorkStatus,
                          )
                        }
                        options={STATUS_OPTIONS}
                        style={{ width: "100%" }}
                      />
                    </div>
                  ))}

                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddTask(projectIndex)}
                    size="small"
                    style={{ padding: 0, height: "auto", fontSize: 13 }}
                  >
                    Add Task
                  </Button>
                </div>

                {/* Blockers */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      🚫 Blockers{" "}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        (Optional)
                      </Text>
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <TextArea
                    rows={2}
                    placeholder="Any blockers or dependencies..."
                    value={update.blockers}
                    onChange={(e) =>
                      handleBlockersChange(projectIndex, e.target.value)
                    }
                  />
                </Form.Item>

                {/* Additional Notes */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      💬 Comments / Notes{" "}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        (Optional)
                      </Text>
                    </span>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <TextArea
                    rows={2}
                    placeholder="Additional notes or clarifications..."
                    value={update.notes}
                    onChange={(e) =>
                      handleNotesChange(projectIndex, e.target.value)
                    }
                  />
                </Form.Item>
              </div>
            ))}

            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={handleAddProject}
              disabled={projectUpdates.length >= projects.length}
              style={{ padding: 0, height: "auto", fontSize: 13 }}
            >
              Add Another Project Entry
            </Button>
          </div>

          {/* General Notes */}
          <Form.Item
            label={
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                General Notes{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (Optional)
                </Text>
              </span>
            }
            name="generalNotes"
            style={{ marginBottom: 16 }}
          >
            <TextArea
              rows={3}
              placeholder="Any other updates not related to specific projects..."
            />
          </Form.Item>

          {/* Total Hours Display */}
          <div
            style={{
              padding: 16,
              backgroundColor: "#f0f5ff",
              borderRadius: 6,
              marginBottom: 24,
              border: "1px solid #adc6ff",
            }}
          >
            <Text strong style={{ fontSize: 14 }}>
              ⏱️ Total Hours Today:{" "}
              <span style={{ color: "#1890ff", fontSize: 16 }}>
                {formatHours(totalHours)}
              </span>
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 4 }}
            >
              Auto-calculated from all project entries
            </Text>
          </div>

          {/* Submit Buttons */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="button"
                onClick={handleSubmit}
                loading={loading}
                size="large"
                disabled={alreadySubmitted && !isEditAllowed} // 🔥 IMPORTANT
              >
                {alreadySubmitted
                  ? isEditAllowed
                    ? "Update Daily Status"
                    : "Edit Locked (24 hrs passed)"
                  : "Submit Daily Status"}
              </Button>

              <Button
                onClick={() => router.push("/daily-updates/view")}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
