"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  TimesheetsService,
  TimesheetUser,
  Timesheet,
  CreateTimesheetData,
  UpdateTimesheetData,
} from "@/services/timesheetService";

import {
  Typography,
  Button,
  Progress,
  Table,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Modal,
  Divider,
  Tag,
  Drawer,
  Radio,
  Checkbox,
  Tooltip,
  message
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  SnippetsOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CloseOutlined,
  ReloadOutlined,
  UndoOutlined,
  ExportOutlined,
  CheckOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useMemo, useState, useEffect, useRef } from "react";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
//import { TimesheetService } from "@/services/timesheetService";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useTimesheets,
  useTimesheetById,
  useCreateTimesheet,
  useUpdateTimesheet,
  useApproveTimesheet,
} from "@/hooks/useTimesheet";
import type {
  TimesheetRow,
  TimesheetRow as TimesheetRowAPI,
} from "@/services/timesheetService";

const { Title, Text } = Typography;

interface TimesheetRowUI {
  key: string;
  day: string;
  date: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  hours?: number;
  billable?: boolean;
  status?: "Draft" | "Submitted";
  isSummary?: boolean;
  employeeName: string; // ✅ Add this
  projectName?: string;
  taskName?: string;
}
// const loggedInEmployee = {
//   employeeId: "EMP001",
//   employeeName: "Bharathi Murugan",
// };

export default function MyTimesheetPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
  //const [status, setStatus] = useState<"Draft" | "Submitted">("Draft");
  const [status, setStatus] = useState<TimesheetStatus>("Draft");
  const [rows, setRows] = useState<TimesheetRowUI[]>([]);

  // const [employeeName, setEmployeeName] = useState(
  //   loggedInEmployee.employeeName,
  // );

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState("");

  const [approveOpen, setApproveOpen] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);

  const [weekendEditable, setWeekendEditable] = useState<{
    [key: string]: boolean;
  }>({});
  type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");

  // 🔹 FETCH single timesheet

  // 🔹 MUTATIONS
  const createMutation = useCreateTimesheet();
  const updateMutation = useUpdateTimesheet();

  const approveMutation = useApproveTimesheet();

  const router = useRouter();
  //const searchParams = useSearchParams();
  //const id = searchParams.get("id"); // timesheet id
  const searchParams = useSearchParams();

  const idParam = searchParams.get("id"); // string | null
  const id = idParam ?? undefined; // string | undefined ✅
  const { data: sheet, isLoading } = useTimesheetById(id);

  const mode = searchParams.get("mode");
  const isEditMode = mode === "edit";
  const isPreviewMode = false;
  const timesheetId = searchParams.get("id");
  // const isViewMode = mode === "view";
  //const isViewMode = mode === "preview" || mode === "view";
  const isViewMode = mode === "view";
  // const isPreviewModes = mode === "preview";

  const isWeekend = (day: string) => day === "Sat" || day === "Sun";

  // const isFieldEditable = (r: TimesheetRow) => {
  //   if (!isWeekend(r.day)) return true; // weekdays editable
  //   return weekendEditable[r.key] || false; // weekends editable if toggled
  // };
  const isFieldEditable = (row: TimesheetRowUI) => {
    // Weekdays editable by default
    if (!isWeekend(row.day)) return true;
    // Weekends editable only if checkbox is checked
    return weekendEditable[row.key] ?? false;
  };
  const openDesc = (desc: string) => {
    setSelectedDesc(desc);
    setIsDescModalOpen(true);
  };

  const closeDesc = () => {
    setIsDescModalOpen(false);
    setSelectedDesc("");
  };

  const DAYS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = currentDate.startOf("week").add(i, "day");
      return {
        label: d.format("ddd"),
        date: d.format("MMM DD"),
      };
    });
  }, [currentDate]);
  const entryCount = rows.filter(
    (row) => row.projectId && row.taskId && (row.hours ?? 0) > 0,
  ).length;

  const createEmptyRows = () =>
    DAYS.map((d) => ({
      key: `${d.label}-${Date.now()}-${Math.random()}`,
      day: d.label,
      date: d.date,
      projectId: undefined,
      taskId: undefined,
      taskName: "",
      projectName: "",
      description: "",
      hours: 0,
      billable: true,
      status: "Draft" as const,
      // employeeName: loggedInEmployee.employeeName,
      // employeeName:sheet.user?.name
      employeeName: sheet?.user?.name || "Unknown Employee",
    }));

  // useEffect(() => {
  //   TimesheetsService.getProjects().then(setProjects);
  // }, []);

  // useEffect(() => {
  //   TimesheetsService.getTasks().then(setTasks);
  // }, []);
  // useEffect(() => {
  //   TimesheetsService.getProjects().then((data) => {
  //     setProjects(data.map(p => ({ value: p.id, label: p.name })));
  //   });

  //   TimesheetsService.getTasks().then((data) => {
  //     setTasks(data.map(t => ({ value: t.id, label: t.name })));
  //   });
  // }, []);

  // useEffect(() => {
  //   if (mode === "resubmit") {
  //     setRows(createEmptyRows());
  //     setStatus("Draft");
  //     setIsSubmitted(false);
  //     return;
  //   }

  //   if (id) {
  //     TimesheetService.getById(id).then((sheet) => {
  //       if (!sheet) return;

  //       const rowsWithEmployee = sheet.rows.map((r: any) => ({
  //         ...r,
  //         description: r.description,
  //         employeeName: sheet.employeeName || loggedInEmployee.employeeName,
  //       }));

  //       setRows(rowsWithEmployee);
  //       setIsSubmitted(sheet.status === "Submitted");

  //       setStatus(sheet.status);
  //       setCurrentDate(dayjs(sheet.weekStart));
  //     });
  //   } else {
  //     setRows(createEmptyRows());
  //     setStatus("Draft");
  //   }
  // }, [id, mode, isViewMode]);
  // const mapBackendStatusToUI = (
  //   status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
  // ): "Draft" | "Submitted" => {
  //   if (status === "SUBMITTED") return "Submitted";
  //   return "Draft";
  // };

  const projectOptions = Array.from(
    new Set(rows.map((r) => r.projectName).filter(Boolean)),
  ).map((name) => ({
    value: name!,
    label: name!,
  }));
  const taskOptions = Array.from(
    new Set(rows.map((r) => r.taskName).filter(Boolean)),
  ).map((name) => ({
    value: name!,
    label: name!,
  }));

  const mapBackendStatusToUI = (
    status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
  ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "SUBMITTED":
        return "Submitted";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return "Draft";
    }
  };
  useEffect(() => {
    if (mode === "resubmit") {
      setRows(createEmptyRows());
      setStatus("Draft");
      setIsSubmitted(false);
      return;
    }

    // if (id && sheet) {
    //   const rowsWithEmployee = sheet.rows.map((r: any) => ({
    //     ...r,
    //     employeeName: sheet.user?.name || loggedInEmployee.employeeName,
    //   }));

    //   setRows(rowsWithEmployee);
    //   setStatus(mapBackendStatusToUI(sheet.status));
    //   setIsSubmitted(sheet.status === "SUBMITTED");
    //   setCurrentDate(dayjs(sheet.weekStart));
    //   return;
    // }
    if (id && sheet) {
      const mappedRows: TimesheetRowUI[] = sheet.rows.map(
        (r: TimesheetRowAPI) => ({
          key: r.id,
          day: dayjs(r.day).format("ddd"), // Mon
          date: dayjs(r.day).format("MMM DD"),
          projectId: undefined, // UI only
          taskId: undefined,
          // projectId: r.projectId, // ✅ Use actual projectId from backend
          // taskId: r.taskId, // ✅ Use actual taskId from backend
          description: r.description,
          hours: r.hours,
          billable: r.billable,
          status: sheet.status === "SUBMITTED" ? "Submitted" : "Draft",
          //status: mapBackendStatusToUI(sheet.status),
          // employeeName: sheet.user?.name ?? loggedInEmployee.employeeName,
          employeeName: sheet.user?.name ?? "Unknown Employee",
          projectName: r.projectName,
          taskName: r.taskName,
        }),
      );

      setRows(mappedRows);
      setStatus(mapBackendStatusToUI(sheet.status));
      setIsSubmitted(sheet.status === "SUBMITTED");
      setCurrentDate(dayjs(sheet.weekStart));
      return;
    }

    if (!id) {
      setRows(createEmptyRows());
      setStatus("Draft");
    }
  }, [id, mode, sheet]);

  const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key === key) {
          const updated = { ...r, ...patch };

          // ✅ If the date changes, update currentDate to that week
          if (patch.date) {
            setCurrentDate(dayjs(patch.date).startOf("week"));
          }

          return updated;
        }
        return r;
      }),
    );

    setIsSaving(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setIsSaving(false), 1000);
  };

  const addEntry = (day: string, date: string) => {
    setRows((prev) => [
      ...prev,
      {
        key: `${day}-${Date.now()}`,
        day,
        date,
        hours: 0,
        billable: true,
        status: "Draft",
        // employeeName: loggedInEmployee.employeeName,
        employeeName: sheet?.user?.name ?? "Unknown Employee",
      },
    ]);
  };

  const handleCopyRow = (row: TimesheetRowUI) => {
    setRows((prev) => [...prev, { ...row, key: `${row.day}-${Date.now()}` }]);
  };

  // const handleDeleteRow = (key: string) => {
  //   setRows((prev) => prev.filter((r) => r.key !== key));
  // };
  const handleDeleteRow = (key: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              projectId: undefined,
              taskId: undefined,
              description: "",
              hours: 0,
              billable: false,
            }
          : row,
      ),
    );
  };

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const displayRows = useMemo(() => {
    const result: TimesheetRowUI[] = [];
    DAYS.forEach((d) => {
      const dayRows = rows.filter((r) => r.day === d.label);
      const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
      dayRows.forEach((r) => result.push(r));
      result.push({
        key: `${d.label}-summary`,
        day: d.label,
        date: d.date,
        hours: total,
        isSummary: true,
        // employeeName: loggedInEmployee.employeeName,
        employeeName: sheet?.user?.name ?? "Unknown Employee",
      });
    });
    return result;
  }, [rows, DAYS]);

  const viewRows = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      key: r.key,
    }));
  }, [rows]);

  const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);
  const totalBillable = rows.reduce(
    (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
    0,
  );
  const expectedHours = 40;
  const dayIndexMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const viewColumns: ColumnsType<TimesheetRowUI> = [
    // {
    //   title: "Date",
    //   render: (_: any, r) => `${r.day} (${r.date})`,
    // },
    {
      title: "Date",
      // render: (_: any, r) => {
      //   const dayIndexMap: Record<string, number> = {
      //     Sun: 0,
      //     Mon: 1,
      //     Tue: 2,
      //     Wed: 3,
      //     Thu: 4,
      //     Fri: 5,
      //     Sat: 6,
      //   };

      //   const date = currentDate
      //     .startOf("week")
      //     .add(dayIndexMap[r.day], "day")
      //     .format("MMM DD");

      //   return `${r.day} (${date})`;
      // },
      render: (_: any, r) => {
        const date = currentDate
          .startOf("week")
          .add(dayIndexMap[r.day], "day")
          .format("MMM DD");

        return `${r.day} (${date})`;
      },
    },

    // {
    //   title: "Project",
    //   render: (_: any, r) =>
    //     PROJECTS.find((p) => p.value === r.projectId)?.label || "-",
    // },
    // {
    //   title: "Task",
    //   render: (_: any, r) =>
    //     TASKS.find((t) => t.value === r.taskId)?.label || "-",
    // },
    {
      title: "Project",
      //   render: (_: any, r) =>
      //     projects.find((p) => p.value === r.projectId)?.label || "-",
      render: (_, r) => r.projectName || "-",
    },
    {
      title: "Task",
      // render: (_: any, r) =>
      //   tasks.find((t) => t.value === r.taskId)?.label || "-",
      render: (_, r) => r.taskName || "-",
    },
    {
      title: "Description",
      render: (_: any, r) => {
        const preview = r.description ? r.description.slice(0, 30) : ""; // show first 30 chars
        const hasMore = r.description && r.description.length > 30;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>
              {preview}
              {hasMore ? "..." : ""}
            </span>
            {r.description && r.description.length > 0 && (
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => openDesc(r.description ?? "")}
              />
            )}
          </div>
        );
      },
    },

    {
      title: "Hours",
      dataIndex: "hours",
      render: (h) => `${h}h`,
    },
    {
      title: "Billable",
      render: (_: any, r) => (r.billable ? "Yes" : "No"),
    },
  ];

  const columns: ColumnsType<TimesheetRowUI> = [
    {
      title: "DAY",
      width: 120,
      render: (_: any, r: TimesheetRowUI) => (
        <Space>
          {/* Day / Date text */}
          {r.isSummary ? (
            <Text type="secondary">{r.date}</Text>
          ) : (
            <Text strong>{r.day}</Text>
          )}

          {/* Weekend checkbox */}
          {isWeekend(r.day) && !r.isSummary && (
            <Checkbox
              checked={isFieldEditable(r)}
              onChange={(e) =>
                setWeekendEditable((prev) => ({
                  ...prev,
                  [r.key]: e.target.checked,
                }))
              }
            />
          )}
        </Space>
      ),
    },

    {
      title: "PROJECT",
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? (
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => addEntry(r.day, r.date)}
          >
            Add entry
          </Button>
        ) : (
          // <Select
          //   disabled={isViewMode || !isFieldEditable(r)}
          //   bordered={false}
          //   value={r.projectId}
          //   placeholder="Project"
          //   options={PROJECTS}
          //   style={{ width: 200 }}
          //   onChange={(v) => updateRow(r.key, { projectId: v })}
          // />
          <Tooltip
            title={
              isWeekend(r.day) && !isFieldEditable(r)
                ? "Weekend editing is disabled. Click checkbox to enable."
                : ""
            }
          >
            {/* <Select
              disabled={isViewMode || !isFieldEditable(r)}
              bordered={false}
              value={r.projectId}
              placeholder="Project"
              options={PROJECTS}
              style={{ width: 200 }}
              onChange={(projectId) => {
                const selectedProject = PROJECTS.find(
                  (p) => p.value === projectId,
                );

                updateRow(r.key, {
                  projectId: selectedProject?.value, // p2
                  projectName: selectedProject?.label, // Payroll System
                });
              }}
            /> */}
            {/* <Select
  disabled={isViewMode || !isFieldEditable(r)}
  bordered={false}
  value={r.projectId}
  placeholder="Project"
  options={projects} // <-- dynamic now
  style={{ width: 200 }}
  onChange={(projectId) => {
    const selectedProject = projects.find((p) => p.value === projectId);

    updateRow(r.key, {
      projectId: selectedProject?.value,
      projectName: selectedProject?.label,
      
    });
  }}
/> */}
            <Select
              disabled={isViewMode || !isFieldEditable(r)}
              bordered={false}
              // value={r.projectName} // ✅ projectId NOT needed
              value={r.projectName || undefined}
              placeholder="Project"
              options={projectOptions} // ✅ dynamic from rows
              style={{ width: 200 }}
              onChange={(value) => {
                updateRow(r.key, {
                  projectName: value, // ✅ only name
                });
              }}
            />
          </Tooltip>
        ),
    },
    {
      title: "TASK",
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? null : (
          // <Select
          //   bordered={false}
          //   disabled={isViewMode || !isFieldEditable(r)}
          //   value={r.taskId}
          //   placeholder="Task"
          //   options={TASKS}
          //   style={{ width: 200 }}
          //   onChange={(v) => updateRow(r.key, { taskId: v })}
          // />
          <Tooltip
            title={
              isWeekend(r.day) && !isFieldEditable(r)
                ? "Weekend editing is disabled. Click checkbox to enable."
                : ""
            }
          >
            {/* <Select
              bordered={false}
              disabled={isViewMode || !isFieldEditable(r)}
              value={r.taskId}
              placeholder="Task"
              options={TASKS}
              style={{ width: 200 }}
              onChange={(taskId) => {
                const selectedTask = TASKS.find((t) => t.value === taskId);

                updateRow(r.key, {
                  taskId: selectedTask?.value, // proto
                  taskName: selectedTask?.label, // Prototype UI
                });
              }}
            /> */}
            {/* <Select
  bordered={false}
  disabled={isViewMode || !isFieldEditable(r)}
  value={r.taskId}
  placeholder="Task"
  options={tasks} // <-- dynamic now
  style={{ width: 200 }}
  onChange={(taskId) => {
    const selectedTask = tasks.find((t) => t.value === taskId);

    updateRow(r.key, {
      taskId: selectedTask?.value,
      taskName: selectedTask?.label,
    });
  }}
/> */}
            <Select
              bordered={false}
              disabled={isViewMode || !isFieldEditable(r)}
              // value={r.taskName}
              value={r.taskName || undefined}
              placeholder="Task"
              options={taskOptions}
              style={{ width: 200 }}
              onChange={(value) => {
                updateRow(r.key, {
                  taskName: value,
                });
              }}
            />
          </Tooltip>
        ),
    },
    {
      title: "DESCRIPTION",
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? (
          <Text strong>Total</Text>
        ) : (
          <div
            onClick={() => setExpandedRow(expandedRow === r.key ? null : r.key)}
            style={{ cursor: "pointer" }}
          >
            {r.description || "Description"}{" "}
            <span>{expandedRow === r.key ? "▲" : "▼"}</span>
          </div>
        ),
    },
    {
      title: "HOURS",
      width: 120,
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
            }}
          >
            <Text strong style={{ whiteSpace: "nowrap" }}>
              {r.hours ?? 0}h / 8h
            </Text>

            <Progress
              percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
              showInfo={false}
              size="small"
              style={{ flex: 1, minWidth: 80 }}
            />
          </div>
        ) : (
          <InputNumber<number>
            min={0}
            max={24}
            step={0.5}
            value={r.hours}
            controls
            onKeyDown={(e) => {
              const allowedKeys = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
              ];

              // allow control keys
              if (allowedKeys.includes(e.key)) return;

              // allow numbers and one dot
              if (!/[\d.]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(value) => {
              updateRow(r.key, {
                hours: value ?? 0,
              });
            }}
          />
        ),
    },
    {
      title: "BILLABLE",
      width: 90,
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? null : (
          <Switch
            disabled={isViewMode || !isFieldEditable(r)}
            checked={r.billable}
            onChange={(v) => updateRow(r.key, { billable: v })}
          />
        ),
    },
    !isViewMode && {
      title: "ACTIONS",
      width: 150,
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? null : (
          <Space style={{ display: "flex", gap: "10px" }}>
            <SnippetsOutlined
              style={{
                color: "green",
                cursor: isFieldEditable(r) ? "pointer" : "not-allowed",
                opacity: isFieldEditable(r) ? 1 : 0.5,
              }}
              onClick={() => isFieldEditable(r) && handleCopyRow(r)}
            />
            <UndoOutlined
              style={{
                color: "blue",
                cursor: isFieldEditable(r) ? "pointer" : "not-allowed",
                opacity: isFieldEditable(r) ? 1 : 0.5,
              }}
              onClick={() => isFieldEditable(r) && handleDeleteRow(r.key)}
            />
            {/* ✅ Checkbox for weekends */}
            {/* {isWeekend(r.day) && (
              <Checkbox
                checked={isFieldEditable(r)}
                onChange={(e) =>
                  setWeekendEditable((prev) => ({
                    ...prev,
                    [r.key]: e.target.checked,
                  }))
                }
              ></Checkbox>
            )} */}
          </Space>
        ),
    },
  ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

  // const handleSaveDraft = async () => {
  //   const weekStart = currentDate.startOf("week").format("YYYY-MM-DD");

  //   const all = await TimesheetService.getAll();

  //   const existing = all.find(
  //     (t: any) =>
  //       t.employeeId === loggedInEmployee.employeeId &&
  //       dayjs(t.weekStart).format("YYYY-MM-DD") === weekStart,
  //   );

  //   const payload = {
  //     employeeId: loggedInEmployee.employeeId,
  //     employeeName: loggedInEmployee.employeeName,
  //     weekStart: currentDate.startOf("week").toISOString(),
  //     weekEnd: currentDate.endOf("week").toISOString(),
  //     rows,
  //     totalHours,
  //     totalBillable,
  //     status: "Draft" as const,
  //     // ✅ KEY POINT
  //     updatedAt: new Date().toISOString(),
  //     approvedBy: "",
  //   };

  //   if (existing) {
  //     await TimesheetService.update(existing.id, payload);
  //   } else {
  //     await TimesheetService.create({
  //       ...payload,
  //       id: Date.now().toString(),
  //       createdAt: new Date().toISOString(),
  //     });
  //   }
  //   router.push("/timesheets/timesheet");
  //   setStatus("Draft");
  // };
  const { data: allTimesheets } = useTimesheets();
  const handleSaveDraft = async () => {
    // const existing = allTimesheets?.data?.find((t: Timesheet) =>
    //   t.employeeId === loggedInEmployee.employeeId &&
    //   dayjs(t.weekStart).format("YYYY-MM-DD") === currentDate.startOf("week").format("YYYY-MM-DD")
    // );
    // const existing = allTimesheets?.data?.find(
    //   (t: Timesheet) =>
    //     t.userId === loggedInEmployee.employeeId &&
    //     dayjs(t.weekStart).format("YYYY-MM-DD") ===
    //       currentDate.startOf("week").format("YYYY-MM-DD"),
    // );
    const existing = allTimesheets?.data?.find(
      (t: Timesheet) =>
        t.user?.id === sheet?.user?.id && // ✅ use the employee from timesheet
        dayjs(t.weekStart).format("YYYY-MM-DD") ===
          currentDate.startOf("week").format("YYYY-MM-DD"),
    );

    const payload = {
      //employeeId: loggedInEmployee.employeeId,
      weekStart: currentDate.startOf("week").toISOString(),
      weekEnd: currentDate.endOf("week").toISOString(),
      rows,
      totalHours,
      totalBillable,
      status: "DRAFT", // backend enum
    };

    if (existing) {
      await updateMutation.mutateAsync({ id: existing.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setStatus("Draft");
    router.push("/timesheets/timesheet");
  };

  // const handleSubmitTimesheet = async () => {
  //   const weekStart = currentDate.startOf("week").format("YYYY-MM-DD");

  //   // 🔍 1. Get all timesheets
  //   const all = await TimesheetService.getAll();

  //   // 🔍 2. Check same employee + same week
  //   const existing = all.find(
  //     (t: any) =>
  //       t.employeeId === loggedInEmployee.employeeId &&
  //       dayjs(t.weekStart).format("YYYY-MM-DD") === weekStart,
  //   );

  //   const payload = {
  //     employeeId: loggedInEmployee.employeeId,
  //     employeeName: loggedInEmployee.employeeName,
  //     weekStart: currentDate.startOf("week").toISOString(),
  //     weekEnd: currentDate.endOf("week").toISOString(),
  //     rows,
  //     totalHours,
  //     totalBillable,
  //     status: "Submitted" as const,
  //     updatedAt: new Date().toISOString(),
  //     approvedBy: "",
  //   };

  //   if (existing) {
  //     // ✅ UPDATE existing week
  //     await TimesheetService.update(existing.id, payload);
  //   } else {
  //     // ✅ CREATE only first time
  //     await TimesheetService.create({
  //       ...payload,
  //       id: Date.now().toString(),
  //       createdAt: new Date().toISOString(),
  //     });
  //   }

  //   // ✅ UI state updates
  //   setIsSubmitted(true);
  //   setStatus("Submitted");
  //   setIsSubmitOpen(false);
  //   setIsSubmittedModalOpen(true);
  // };
  const handleSubmitTimesheet = async () => {
    // if (!loggedInEmployee) return;

    const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");

    // 1️⃣ Find existing timesheet for this employee + week
    // const existing = allTimesheets?.data?.find(
    //   (t: Timesheet) =>
    //     t.userId === loggedInEmployee.employeeId &&
    //     dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
    // );
    const existing = allTimesheets?.data?.find(
  (t: Timesheet) =>
    t.user?.id === sheet?.user?.id && // ✅ use the employee from timesheet
    dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
);

    // 2️⃣ Convert rows to correct type (Date for day, required fields)
    const rowsForPayload: CreateTimesheetData["rows"] = rows.map((r) => ({
      //day: new Date(r.day), // must be Date
      //    day: currentDate
      // .startOf("week")
      // .add(dayIndexMap[r.day], "day")
      // .toDate(),
      day: currentDate.startOf("week").add(dayIndexMap[r.day], "day").toDate(),
      projectName: r.projectName || "", // can't be undefined
      taskName: r.taskName || "", // can't be undefined
      description: r.description || "",
      hours: r.hours || 0,
      billable: r.billable || false,
    }));

    try {
      if (existing) {
        // 3️⃣ Update existing timesheet (UpdateTimesheetData)
        const updatePayload: UpdateTimesheetData = {
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
          status: "SUBMITTED",
        };

        await updateMutation.mutateAsync({
          id: existing.id,
          data: updatePayload,
        });
      } else {
        // 4️⃣ Create new timesheet (CreateTimesheetData)
        const createPayload: CreateTimesheetData = {
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
        };

        await createMutation.mutateAsync(createPayload);
      }

      // 5️⃣ Update UI state
      setIsSubmitted(true);
      setStatus("Submitted");
      setIsSubmitOpen(false);
      setIsSubmittedModalOpen(true);
    } catch (err: any) {
      console.error("Submit timesheet failed:", err);
    }
  };
// const handleSubmitTimesheet = async () => {
//   console.log("Button clicked!");

//    if (!rows || rows.length === 0) {
//     message.error("Please add at least one timesheet entry before submitting");
//     return;
//   }
//   try {
//     const weekStart = currentDate.startOf("week");
//     const weekEnd = currentDate.endOf("week");
//     const weekStartStr = weekStart.format("YYYY-MM-DD");

//     // 🔹 keep your existing logic
//     const existing = allTimesheets?.data?.find(
//       (t: Timesheet) =>
//         t.user?.id === sheet?.user?.id &&
//         dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//     );

//     // 🔹 SAFE row mapping (create + edit both)
//     const rowsForPayload: CreateTimesheetData["rows"] = rows.map((r) => ({
//       day: dayjs(r.day).isValid()
//         ? dayjs(r.day).toDate()
//         : weekStart.add(dayIndexMap[r.day], "day").toDate(),
//       projectName: r.projectName ?? "",
//       taskName: r.taskName ?? "",
//       description: r.description ?? "",
//       hours: Number(r.hours) || 0,
//       billable: !!r.billable,
//     }));

//     if (existing) {
//       // 🔹 UPDATE FLOW (unchanged logic)
//       const updatePayload: UpdateTimesheetData = {
//         weekStart: weekStart.toDate(),
//         weekEnd: weekEnd.toDate(),
//         rows: rowsForPayload,
//         status: "SUBMITTED",
//       };

//       await updateMutation.mutateAsync({
//         id: existing.id,
//         data: updatePayload,
//       });
//     } else {
//       // 🔹 CREATE FLOW (unchanged logic)
//       const createPayload: CreateTimesheetData = {
//         weekStart: weekStart.toDate(),
//         weekEnd: weekEnd.toDate(),
//         rows: rowsForPayload,
//       };

//       await createMutation.mutateAsync(createPayload);
//     }

//     // 🔹 UI updates
//     setIsSubmitted(true);
//     setStatus("Submitted");
//     setIsSubmitOpen(false);
//     setIsSubmittedModalOpen(true);
//   } catch (err) {
//     console.error("Submit timesheet failed:", err);
//   }
// };
// const handleSubmitTimesheet = async () => {
//   try {
//     if (!sheet?.id) {
//       console.error("Timesheet ID missing, cannot submit.");
//       return;
//     }

//     // ✅ Prepare rows for payload (optional if backend uses existing rows)
//     const rowsForPayload: any[] = rows.map(r => ({
//       day: dayjs(r.day).isValid() ? dayjs(r.day).toDate() : null,
//       projectName: r.projectName ?? "",
//       taskName: r.taskName ?? "",
//       description: r.description ?? "",
//       hours: Number(r.hours) || 0,
//       billable: !!r.billable,
//     }));

//     // 🔹 Make API call to submit timesheet
//     const response = await fetch(`/api/timesheets/${sheet.id}/submit`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ rows: rowsForPayload }), // optional if backend doesn't need rows
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       console.error("Submit timesheet failed:", data.error);
//       return;
//     }

//     // 🔹 UI updates
//     setIsSubmitted(true);
//     setStatus("Submitted");
//     setIsSubmitOpen(false);
//     setIsSubmittedModalOpen(true);

//     console.log("Timesheet submitted successfully!", data);
//   } catch (err) {
//     console.error("Submit timesheet error:", err);
//   }
// };



  // const handleSaveChanges = async () => {
  //   if (!timesheetId) return;

  //   await TimesheetService.update(timesheetId, {
  //     rows,
  //     totalHours,
  //     totalBillable,
  //     status: "Submitted", // or "draft" based on your flow
  //   });

  //   setIsSubmitOpen(false);
  //   // router.push("/timesheets");
  //   router.push("/timesheets/timesheet");
  // };
  const handleSaveChanges = async () => {
    if (!timesheetId) return;

    // Convert rows to correct type for backend
    const rowsForPayload = rows.map((r) => ({
      // day: new Date(r.day),
      day: currentDate.startOf("week").add(dayIndexMap[r.day], "day").toDate(),

      projectName: r.projectName || "",
      taskName: r.taskName || "",
      description: r.description || "",
      hours: r.hours || 0,
      billable: r.billable || false,
    }));

    // Prepare update payload
    const updatePayload = {
      weekStart: dayjs(currentDate).startOf("week").toDate(),
      weekEnd: dayjs(currentDate).endOf("week").toDate(),
      rows: rowsForPayload,
      totalHours,
      totalBillable,
      status: "SUBMITTED", // backend enum
    };

    try {
      await updateMutation.mutateAsync({
        id: timesheetId,
        data: updatePayload,
      });

      setIsSubmitOpen(false);
      router.push("/timesheets/timesheet");
    } catch (err: any) {
      console.error("Save changes failed:", err);
    }
  };
  const handleExport = () => {
    if (!rows.length) return;

    const headers = [
      "Date",
      "Day",
      "Project",
      "Task",
      "Description",
      "Hours",
      "Billable",
      "Status",
    ];

    const csvRows = rows
      .filter((r) => !r.isSummary)
      .map((r) => [
        r.date,
        r.day,
        r.projectName ?? "", // ✅ DIRECT FROM SERVICE
        r.taskName ?? "", // ✅ DIRECT FROM SERVICE
        r.description ?? "",
        r.hours ?? 0,
        r.billable ? "Yes" : "No",
        r.status ?? "Draft",
      ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map(String).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timesheet.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "Submitted":
        return <Tag color="blue">Submitted</Tag>;
      case "Approved":
        return <Tag color="green">Approved</Tag>;
      case "Rejected":
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag color="default">Draft</Tag>;
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: 22 }}>
        {/* Header */}
        <div
          className="timesheet-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            //paddingRight:"15px"
          }}
        >
          {isViewMode ? (
            // ✅ Team View Header
            <>
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  {/* {loggedInEmployee.employeeName} */}
                  {/* {employeeName} */}
                   {sheet?.user?.name ?? 'Unknown Employee'}
                </Title>
                <Text type="secondary">
                  {dayjs(currentDate.startOf("week")).format("MMM DD")} –{" "}
                  {dayjs(currentDate.endOf("week")).format("MMM DD, YYYY")}
                </Text>
              </div>
              {getStatusTag(status)}

              <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                <Button
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#52c41a", // Ant Design green
                    color: "#ffffff", // white text
                    border: "none",
                  }}
                  icon={<CheckOutlined />}
                  onClick={() => setApproveOpen(true)}
                >
                  Approve
                </Button>

                <Button
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#ff4d4f", // Ant Design red
                    color: "#ffffff", // white text
                    border: "none",
                  }}
                  icon={<CloseOutlined />}
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>

                <Button
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#1677ff", // Ant Design blue
                    color: "#ffffff", // white text
                    border: "none",
                  }}
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>
            </>
          ) : (
            // ✅ My Timesheet Header (original)
            <>
              <div>
                <Title level={3} style={{ margin: 0, color: "#262626" }}>
                  {isEditMode
                    ? `Edit Timesheet` // when editing an existing timesheet
                    : `My Timesheet`}{" "}
                </Title>

                <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
                  {currentDate.format("MMMM YYYY")}
                </Text>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Button
                  icon={<LeftOutlined />}
                  onClick={() =>
                    setCurrentDate(currentDate.subtract(1, "week"))
                  }
                  type="text"
                  style={{ color: "#595959" }}
                />
                <div
                  style={{
                    padding: "6px 16px",
                    backgroundColor: "#fafafa",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#1a1a1a",
                    minWidth: 200,
                    textAlign: "center",
                  }}
                >
                  {currentDate.startOf("week").format("MMM DD")} –{" "}
                  {currentDate.endOf("week").format("MMM DD, YYYY")}
                </div>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => setCurrentDate(currentDate.add(1, "week"))}
                  type="text"
                  style={{ color: "#595959" }}
                />
              </div>

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "6px 12px",
                  backgroundColor: "#fafafa",
                  borderRadius: 6,
                }}
              >
                <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
                  {totalHours}h / 40h
                </Text>
                <Progress
                  percent={(totalHours / 40) * 100}
                  showInfo={false}
                  strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
                  strokeWidth={6}
                  style={{ width: 80 }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* <Button type="default" style={{ minWidth: 80 }}>
                  {status}
                </Button> */}

                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveDraft}
                  disabled={isViewMode || status === "Submitted"}
                  style={{
                    fontWeight: 600, // bold text
                    // backgroundColor: "#bae7ff",
                    // backgroundColor:"#f0f0f0",
                    border: "1px solid grey",
                    color: "#595959",

                    // color: "#ffffff", // white text
                  }}
                >
                  Save Draft
                </Button>

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setIsSubmitOpen(true)}
                  style={{ minWidth: 100 }}
                >
                  Submit
                </Button>
              </div>
            </>
          )}
        </div>
        <Divider />
        {/* Table */}
        <Table
          //className="fade-table"
          className="table-hover-wrapper"
          style={{ marginTop: "50px" }}
          // columns={columns}
          // dataSource={displayRows}
          columns={isViewMode ? viewColumns : columns}
          dataSource={isViewMode ? viewRows : displayRows}
          pagination={false}
          bordered
          rowKey="key"
          expandable={{
            expandedRowKeys: expandedRow ? [expandedRow] : [],
            expandIcon: () => null,
            expandedRowRender: (r) =>
              !r.isSummary && (
                <Input.TextArea
                  rows={3}
                  value={r.description}
                  onChange={(e) =>
                    updateRow(r.key, { description: e.target.value })
                  }
                />
              ),
          }}
          rowClassName={(r) => (r.isSummary ? "no-column-border" : "")}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={columns.length}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 24px",
                      borderRadius: 6,
                      fontWeight: 600, // slightly less than 1000 for readability
                      fontSize: 14,
                      color: "#1f1f1f", // dark gray for main text
                    }}
                  >
                    <span style={{ color: "#595959" }}>Week Total</span>{" "}
                    {/* slightly lighter gray for label */}
                    <span
                      style={{
                        display: "flex",
                        gap: "30px",
                        alignItems: "center",
                        color: "#262626", // dark gray for values
                      }}
                    >
                      <span>{totalHours}h / 40h</span>
                      <span style={{ color: "#1890ff" }}>
                        {totalBillable} h billable
                      </span>{" "}
                      {/* subtle blue for billable */}
                    </span>
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        {/* Submit Modal */}
        <Modal
          open={isSubmitOpen}
          onCancel={() => setIsSubmitOpen(false)}
          footer={null}
          width={520}
          centered
          bodyStyle={{
            paddingLeft: 16, // 👈 reduce horizontal padding
            paddingRight: 16,
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              margin: 0,
            }}
          >
            <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {isEditMode ? "Save Changes" : "Submit Timesheet"}
              </Text>
              <br />

              <Text type="secondary">
                {isEditMode
                  ? "Review and save your updated timesheet."
                  : "Review your timesheet summary before submission."}
              </Text>
            </div>
          </div>

          <Divider />
          {/* Summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Total Hours */}
            <div
              style={{
                background: "#f2f5f8",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
                {totalHours}h
              </div>
              <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
            </div>

            {/* Billable */}
            <div
              style={{
                background: "#f2f5f8",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
                {totalBillable}h
              </div>
              <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
            </div>

            {/* Entries */}
            <div
              style={{
                background: "#f2f5f8",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
                {/* {rows.length} */}
                {entryCount}
                {/* {rowsForModal.length}   */}
              </div>
              <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
            </div>
          </div>

          {/* Projects */}
          <div
            style={{
              background: "#f7f9fb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Projects (
              {new Set(rows.map((r) => r.projectName).filter(Boolean)).size})
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[...new Set(rows.map((r) => r.projectName).filter(Boolean))].map(
                (projectName) => (
                  <Tag
                    key={projectName}
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      background: "#fff",
                    }}
                  >
                    {projectName}
                  </Tag>
                ),
              )}
            </div>
          </div>

          {/* Warning */}
          {totalHours < expectedHours && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: "#fff7e6",
                color: "#fa8c16",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <WarningOutlined />
              <span>
                Warning: You've logged {expectedHours - totalHours}h less than
                expected.
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
            {!isPreviewMode && (
              <Button
                type="primary"
                icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
                onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
              >
                {isEditMode ? "Save Changes" : "Submit Timesheet"}
              </Button>
            )}
          </div>
        </Modal>
        <Modal
          open={isSubmittedModalOpen}
          onCancel={() => setIsSubmittedModalOpen(false)}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => {
                setIsSubmittedModalOpen(false);
                router.push("/timesheets/timesheet"); // redirect to timesheet page
              }}
            >
              OK
            </Button>,
          ]}
          centered
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>
                Time Entry Submitted
              </Text>
              <br />
              <Text type="secondary">
                Your timesheet has been successfully submitted.
              </Text>
            </div>
          </div>
        </Modal>
        <Drawer
          title={
            <Space>
              <WarningOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
              <Text strong style={{ fontSize: 16 }}>
                Reject Timesheet Entries
              </Text>
            </Space>
          }
          placement="right"
          width={360}
          open={rejectOpen}
          onClose={() => setRejectOpen(false)}
          bodyStyle={{ paddingBottom: 80 }}
          closable={false}
          extra={
            <Button
              type="text"
              onClick={() => setRejectOpen(false)}
              icon={<CloseOutlined />}
            />
          }
        >
          {/* Description */}
          <Text type="secondary">
            Provide a reason for rejecting this timesheet. The employee will be
            notified and can make corrections.
          </Text>

          {/* Warning Card */}
          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: "#fff7e6",
              border: "1px solid #ffe7ba",
              borderRadius: 10,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <WarningOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
            <Text>
              Rejected entries will be unlocked for editing. The employee must
              resubmit after making corrections.
            </Text>
          </div>

          {/* Quick Reasons */}
          <div style={{ marginTop: 28 }}>
            <Text strong style={{ fontSize: 15 }}>
              Quick Reasons
            </Text>

            <Space wrap size={10} style={{ marginTop: 14 }}>
              {[
                "Incorrect project selected",
                "Hours do not match task complexity",
                "Missing description",
                "Needs more detail",
              ].map((reason) => (
                <Button
                  key={reason}
                  onClick={() =>
                    setRejectReason((prev) =>
                      prev ? `${prev}\n• ${reason}` : `• ${reason}`,
                    )
                  }
                >
                  {reason}
                </Button>
              ))}
            </Space>
          </div>

          {/* Reason Input */}
          <div style={{ marginTop: 28 }}>
            <Text strong style={{ fontSize: 15 }}>
              Rejection Reason <Text type="danger">*</Text>
            </Text>

            <Input.TextArea
              rows={6}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why these entries are being rejected..."
              style={{ marginTop: 10, borderRadius: 8, resize: "none" }}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: "16px 24px",
              borderTop: "1px solid #f0f0f0",
              background: "#fff",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            {/* <Button
              danger
              type="primary"
              disabled={!rejectReason}
              onClick={async () => {
                await TimesheetService.update(timesheetId!, {
                  status: "Rejected",
                  rejectReason,
                });
                setStatus("Rejected");

                // ✅ 1. Drawer close
                setRejectOpen(false);

                // ✅ 2. Set rejected reason
                setRejectedReason(rejectReason);

                // ✅ 3. Clear textarea
                setRejectReason("");

                // ✅ 4. OPEN modal
                setShowRejectedModal(true);
              }}
            >
              Confirm Rejection
            </Button> */}
            <Button
              danger
              type="primary"
              disabled={!rejectReason}
              onClick={async () => {
                if (!timesheetId) return;

                try {
                  // ✅ Call mutation hook
                  await approveMutation.mutateAsync({
                    id: timesheetId,
                    status: "REJECTED",
                    rejectReason,
                  });

                  setStatus("Rejected"); // update UI status
                  setRejectOpen(false); // close drawer
                  setRejectedReason(rejectReason); // set rejected reason
                  setRejectReason(""); // clear textarea
                  setShowRejectedModal(true); // show modal
                } catch (err: any) {
                  console.error("Rejection failed:", err);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </Drawer>
        <Modal
          open={showRejectedModal}
          onCancel={() => setShowRejectedModal(false)}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => {
                setShowRejectedModal(false);
                router.push("/timesheets/teams"); // 👈 Team page path
              }}
            >
              OK
            </Button>,
          ]}
          centered
          title={
            <Space>
              <WarningOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
              <Text strong>Timesheet Rejected</Text>
            </Space>
          }
        >
          <Text>
            Your timesheet has been rejected. Please review the reason below:
          </Text>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "#fff7e6",
              borderRadius: 8,
              border: "1px solid #ffe7ba",
            }}
          >
            <Text>{rejectedReason}</Text>
          </div>
        </Modal>
        {/* //approval */}
        <Modal
          open={approveOpen}
          onCancel={() => setApproveOpen(false)}
          centered
          footer={[
            <Button key="cancel" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>,
            // <Button
            //   key="confirm"
            //   type="primary"
            //   onClick={async () => {
            //     await TimesheetService.update(timesheetId!, {
            //       status: "Approved",
            //     });
            //     setStatus("Approved");

            //     setApproveOpen(false);
            //     setShowApprovedModal(true);
            //   }}
            // >
            //   Confirm Approval
            // </Button>
            <Button
              key="confirm"
              type="primary"
              onClick={async () => {
                if (!timesheetId) return;

                try {
                  await approveMutation.mutateAsync({
                    id: timesheetId,
                    status: "APPROVED", // backend enum
                  });

                  setStatus("Approved"); // update UI
                  setApproveOpen(false); // close modal
                  setShowApprovedModal(true); // show success modal
                } catch (err: any) {
                  console.error("Approval failed:", err);
                }
              }}
            >
              Confirm Approval
            </Button>,
          ]}
          title={
            <Space>
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
              <Text strong>Approve Timesheet</Text>
            </Space>
          }
        >
          <Text>
            Are you sure you want to approve this timesheet? Once approved, it
            cannot be edited.
          </Text>
        </Modal>
        {/* //approve success modal */}
        <Modal
          open={showApprovedModal}
          onCancel={() => setShowApprovedModal(false)}
          centered
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => {
                setShowApprovedModal(false);
                router.push("/timesheets/teams");
              }}
            >
              OK
            </Button>,
          ]}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>
                Timesheet Approved
              </Text>
              <br />
              <Text type="secondary">
                The timesheet has been successfully approved.
              </Text>
            </div>
          </div>
        </Modal>

        <Modal
          title="Description"
          open={isDescModalOpen}
          onCancel={closeDesc}
          footer={null}
          width={600}
        >
          <p style={{ whiteSpace: "pre-wrap" }}>{selectedDesc}</p>
        </Modal>
      </div>
    </MainLayout>
  );
}
