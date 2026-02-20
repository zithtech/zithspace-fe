// "use client";

// import MainLayout from "@/components/layout/MainLayout";

// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";

// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";

// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// //import { useQueryClient } from '@tanstack/react-query';

// //import { TimesheetService } from "@/services/timesheetService";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";

// const { Title, Text } = Typography;
// //const queryClient = useQueryClient();

// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   // date: Dayjs;
//   projectId?: string;
//   taskId?: string;
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   // status?: "Draft" | "Submitted";
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string; // ✅ Add this
//   projectName?: string;
//   taskName?: string;
// }
// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {

//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);
//   console.log("submitopen", isSubmitOpen);
//   const [isSaving, setIsSaving] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);

//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);

//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});
//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);
//   const { data: allTimesheets } = useTimesheets();
//   const [allTimesheetsState, setAllTimesheetsState] = useState(allTimesheets);
//   const isSubmittingRef = useRef(false);
//   const { message, notification } = App.useApp();
//   const [loading, setLoading] = useState(false);
//   const queryClient = useQueryClient();

//   // 🔹 FETCH single timesheet

//   // 🔹 MUTATIONS
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//       };
//     });
//   }, [currentDate]);

//   const createEmptyRows = () =>
//     DAYS.map((d, i) => {
//       //const fullDate = dayjs(sheet?.weekStart).add(i,"day");
//       const fullDate = currentDate.startOf("week").add(i, "day");

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         //date: fullDate.toISOString(),
//         date: fullDate.format("YYYY-MM-DD"),
//         //date: d.date,
//         projectId: undefined,
//         taskId: undefined,
//         taskName: "",
//         projectName: "",
//         description: "",
//         hours: 0,
//         billable: true,
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || "Unknown Employee",
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();

//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };

//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !!row.projectId && !!row.taskId && Number(row.hours) > 0,
//     ).length;

//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         rows: sheet.rows,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }
//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           const taskFromName = tasks.find(
//             (t) =>
//               t.name === r.taskName &&
//               t.projectId === (r.projectId || projectFromName?.id),
//           );
//           const rowDate = dayjs(r.day);

//           return {
//             key: r.id,
//             id: r.id,

//             day: rowDate.format("ddd"), // Sun / Mon / Tue
//             date: rowDate.format("YYYY-MM-DD"),
//             projectId: r.projectId || projectFromName?.id || undefined,
//             taskId: r.taskId || taskFromName?.id || undefined,
//             description: r.description,
//             hours: r.hours,
//             billable: r.billable,

//             status: mapBackendStatusToUI(sheet.status),
//             projectName:
//               projects.find((p) => p.id === r.projectId)?.name ||
//               r.projectName ||
//               "",

//             taskName:
//               tasks.find((t) => t.id === r.taskId)?.name || r.taskName || "",

//             employeeName: sheet.user?.name ?? "Unknown Employee",
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));

//       setEntryCount(entryCount); // <-- use a state variable to store it

//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => ({
//         ...r,
//         projectName: r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName,
//         taskName: r.taskId
//           ? tasks.find((t) => t.id === r.taskId)?.name || r.taskName
//           : r.taskName,
//       })),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           // ✅ If the date changes, update currentDate to that week
//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );

//     setIsSaving(true);
//     if (saveTimeout.current) clearTimeout(saveTimeout.current);
//     saveTimeout.current = setTimeout(() => setIsSaving(false), 1000);
//   };

//   const addEntry = (day: string, date: string) => {
//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         // employeeName: loggedInEmployee.employeeName,
//         employeeName: sheet?.user?.name ?? "Unknown Employee",
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     setRows((prev) => [...prev, { ...row, key: `${row.day}-${Date.now()}` }]);
//   };
//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key
//           ? {
//               ...row,
//               projectId: undefined,
//               taskId: undefined,
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const saveTimeout = useRef<NodeJS.Timeout | null>(null);

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));
//       result.push({
//         key: `${d.label}-summary`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,

//         employeeName: sheet?.user?.name ?? "Unknown Employee",
//       });
//     });
//     return result;
//   }, [rows, DAYS]);

//   const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows.reduce(
//     (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
//     0,
//   );
//   const expectedHours = 40;

//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => (
//         <Space>
//           {r.isSummary ? (
//             <Text type="secondary">{r.date}</Text>
//           ) : (
//             <Text strong>{r.day}</Text>
//           )}
//           {isWeekend(r.day) && !r.isSummary && (
//             <Checkbox
//               checked={isFieldEditable(r)}
//               onChange={(e) =>
//                 setWeekendEditable((prev) => ({
//                   ...prev,
//                   [r.key]: e.target.checked,
//                 }))
//               }
//             />
//           )}
//         </Space>
//       ),
//     },

//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r)}
//               bordered={false}
//               value={r.projectId}
//               placeholder="Project"
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);

//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskId: undefined,
//                   taskName: undefined,
//                 });
//               }}
//             />
//           </Tooltip>
//         ),
//     },
//     {
//       title: "TASK",
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? null : (
//           <Tooltip
//             title={
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               bordered={false}
//               value={r.taskId}
//               placeholder="Task"
//               style={{ width: 200 }}
//               options={tasks
//                 .filter((t) => t.projectId === r.projectId) // ✅ correct
//                 .map((t) => ({
//                   value: t.id,
//                   label: t.name,
//                 }))}
//               onChange={(taskId) => {
//                 const selected = tasks.find((t) => t.id === taskId);

//                 updateRow(r.key, {
//                   taskId,
//                   taskName: selected?.name ?? "",
//                 });
//               }}
//             />
//           </Tooltip>
//         ),
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() => setExpandedRow(expandedRow === r.key ? null : r.key)}
//             style={{ cursor: "pointer" }}
//           >
//             {r.description || "Description"}{" "}
//             <span>{expandedRow === r.key ? "▲" : "▼"}</span>
//           </div>
//         ),
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>

//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               updateRow(r.key, {
//                 hours: value ?? 0,
//               });
//             }}
//           />
//         ),
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r)}
//             checked={r.billable}
//             onChange={(v) => updateRow(r.key, { billable: v })}
//           />
//         ),
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: "green",
//                 cursor: isFieldEditable(r) ? "pointer" : "not-allowed",
//                 opacity: isFieldEditable(r) ? 1 : 0.5,
//               }}
//               onClick={() => isFieldEditable(r) && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: "blue",
//                 cursor: isFieldEditable(r) ? "pointer" : "not-allowed",
//                 opacity: isFieldEditable(r) ? 1 : 0.5,
//               }}
//               onClick={() => isFieldEditable(r) && handleDeleteRow(r.key)}
//             />
//           </Space>
//         ),
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id && // ✅ use the employee from timesheet
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );
//       const rowsForPayload = rows.map((r) => ({
//         day: new Date(`${r.date}T00:00:00Z`),

//         projectId: r.projectId,
//         taskId: r.taskId,

//         projectName: r.projectName || "",
//         taskName: r.taskName || "",
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable ?? true,
//       }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload, // ✅ use mapped rows
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("Failed to save draft");
//     } finally {
//       setLoading(false); // 🔥 stop spinner
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("SUBMIT BUTTON CLICKED");

//     isSubmittingRef.current = true;

//     try {
//       setLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");

//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );
//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return; // ❗ STOP further execution
//       }

//       const rowsForPayload: CreateTimesheetData["rows"] = rows.map((r) => ({
//         id: r.id,
//         day: new Date(`${r.date}T00:00:00Z`),

//         projectId: r.projectId,
//         taskId: r.taskId,
//         projectName: r.projectName || "",
//         taskName: r.taskName || "",
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable ?? true,
//       }));
//       console.log("rowpayload", rowsForPayload);

//       let timesheetId: string;
//       if (existing) {
//         await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         const newTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//         });
//         timesheetId = newTimesheet.id;
//       }

//       if (!timesheetId) throw new Error("Timesheet ID missing");
//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//       } catch (submitError) {
//         console.warn(
//           "Submit API threw error, but backend already submitted",
//           submitError,
//         );
//         // ❗ DO NOTHING – backend already updated
//       }

//       // 🔥 3. FORCE UI → SUBMITTED (THIS IS THE FIX)
//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");
//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });

//       //onSubmitted();
//     } catch (err) {
//       console.error("Unexpected submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);
//     try {
//       setLoading(true);

//       // Convert rows to correct type for backend
//       const rowsForPayload = rows.map((r) => ({
//         id: r.id, // ✅ MUST
//         day: new Date(`${r.date}T00:00:00Z`),

//         taskId: r.taskId,
//         projectId: r.projectId,
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable || false,
//         ...(r.projectName && { projectName: r.projectName }),
//         ...(r.taskName && { taskName: r.taskName }),
//       }));
//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED", // backend enum
//       };

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });
//       message.success("Timesheet edited successfully");

//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: 22 }}>
//       {/* Header */}
//       <div
//         className="timesheet-header"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 24,
//           flexWrap: "wrap",
//         }}
//       >
//             <div>
//               <Title level={3} style={{ margin: 0, color: "#262626" }}>
//                 {isEditMode
//                   ? `Edit Timesheet` // when editing an existing timesheet
//                   : `My Timesheet`}{" "}
//               </Title>

//               <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//                 {currentDate.format("MMMM YYYY")}
//               </Text>
//             </div>

//             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <Button
//                 icon={<LeftOutlined />}
//                 onClick={() => setCurrentDate(currentDate.subtract(1, "week"))}
//                 type="text"
//                 style={{ color: "#595959" }}
//               />
//               <div
//                 style={{
//                   padding: "6px 16px",
//                   backgroundColor: "#fafafa",
//                   borderRadius: 6,
//                   fontSize: 14,
//                   fontWeight: 500,
//                   color: "#1a1a1a",
//                   minWidth: 200,
//                   textAlign: "center",
//                 }}
//               >
//                 {currentDate.startOf("week").format("MMM DD")} –{" "}
//                 {currentDate.endOf("week").format("MMM DD, YYYY")}
//               </div>
//               <Button
//                 icon={<RightOutlined />}
//                 onClick={() => setCurrentDate(currentDate.add(1, "week"))}
//                 type="text"
//                 style={{ color: "#595959" }}
//               />
//             </div>

//             <div
//               style={{
//                 marginLeft: "auto",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 12,
//                 padding: "6px 12px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//               }}
//             >
//               <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//                 {totalHours}h / 40h
//               </Text>
//               <Progress
//                 percent={(totalHours / 40) * 100}
//                 showInfo={false}
//                 strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//                 strokeWidth={6}
//                 style={{ width: 80 }}
//               />
//             </div>

//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               {/* <Button type="default" style={{ minWidth: 80 }}>
//                   {status}
//                 </Button> */}

//               <Button
//                 icon={<SaveOutlined />}
//                 htmlType="submit"
//                 loading={loading}
//                 onClick={handleSaveDraft}
//                 disabled={isViewMode || status === "Submitted"}
//                 style={{
//                   fontWeight: 600, // bold text
//                   // backgroundColor: "#bae7ff",
//                   // backgroundColor:"#f0f0f0",
//                   border: "1px solid grey",
//                   color: "#595959",

//                   // color: "#ffffff", // white text
//                 }}
//               >
//                 Save Draft
//               </Button>

//               <Button
//                 type="primary"
//                 icon={<SendOutlined />}
//                 onClick={() => setIsSubmitOpen(true)}
//                 style={{ minWidth: 100 }}
//               >
//                 Submit
//               </Button>
//             </div>
//           {/* </>
//         )} */}
//       </div>
//       <Divider />
//       {/* Table */}
//       <Table

//         style={{ marginTop: "10px" }}

//         columns={columns}
//         dataSource={displayRows}
//         pagination={false}
//         bordered
//         rowKey="key"
//         expandable={{
//           expandedRowKeys: expandedRow ? [expandedRow] : [],
//           expandIcon: () => null,
//           expandedRowRender: (r) =>
//             !r.isSummary && (
//               <Input.TextArea
//                 rows={3}
//                 value={r.description}
//                 onChange={(e) =>
//                   updateRow(r.key, { description: e.target.value })
//                 }
//               />
//             ),
//         }}
//         rowClassName={(r) => (r.isSummary ? "no-column-border" : "")}
//         summary={() => (
//           <Table.Summary fixed>
//             <Table.Summary.Row>
//               <Table.Summary.Cell index={0} colSpan={columns.length}>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     padding: "12px 24px",
//                     borderRadius: 6,
//                     fontWeight: 600, // slightly less than 1000 for readability
//                     fontSize: 14,
//                     color: "#1f1f1f", // dark gray for main text
//                   }}
//                 >
//                   <span style={{ color: "#595959" }}>Week Total</span>{" "}
//                   {/* slightly lighter gray for label */}
//                   <span
//                     style={{
//                       display: "flex",
//                       gap: "30px",
//                       alignItems: "center",
//                       color: "#262626", // dark gray for values
//                     }}
//                   >
//                     <span>{totalHours}h / 40h</span>
//                     <span style={{ color: "#1890ff" }}>
//                       {totalBillable} h billable
//                     </span>{" "}
//                     {/* subtle blue for billable */}
//                   </span>
//                 </div>
//               </Table.Summary.Cell>
//             </Table.Summary.Row>
//           </Table.Summary>
//         )}
//       />
//       {/* Submit Modal */}
//       <Modal
//         open={isSubmitOpen}
//         onCancel={() => setIsSubmitOpen(false)}
//         footer={null}
//         width={520}
//         centered
//         bodyStyle={{
//           paddingLeft: 16, // 👈 reduce horizontal padding
//           paddingRight: 16,
//           paddingTop: 24,
//           paddingBottom: 24,
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             display: "flex",
//             gap: 12,
//             alignItems: "center",
//             margin: 0,
//           }}
//         >
//           <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//           <div>
//             <Text strong style={{ fontSize: 16 }}>
//               {isEditMode ? "Save Changes" : "Submit Timesheet"}
//             </Text>
//             <br />

//             <Text type="secondary">
//               {isEditMode
//                 ? "Review and save your updated timesheet."
//                 : "Review your timesheet summary before submission."}
//             </Text>
//           </div>
//         </div>

//         <Divider />
//         {/* Summary cards */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(3, 1fr)",
//             gap: 16,
//             marginBottom: 20,
//           }}
//         >
//           {/* Total Hours */}
//           <div
//             style={{
//               background: "#f2f5f8",
//               borderRadius: 12,
//               padding: 16,
//               textAlign: "center",
//             }}
//           >
//             <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//             <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//               {totalHours}h
//             </div>
//             <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//           </div>

//           {/* Billable */}
//           <div
//             style={{
//               background: "#f2f5f8",
//               borderRadius: 12,
//               padding: 16,
//               textAlign: "center",
//             }}
//           >
//             <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//             <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//               {totalBillable}h
//             </div>
//             <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//           </div>

//           {/* Entries */}
//           <div
//             style={{
//               background: "#f2f5f8",
//               borderRadius: 12,
//               padding: 16,
//               textAlign: "center",
//             }}
//           >
//             <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//             <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//               {/* {rows.length} */}
//               {entryCount}
//               {/* {rowsForModal.length}   */}
//             </div>
//             <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//           </div>
//         </div>

//         {/* Projects */}
//         <div
//           style={{
//             background: "#f7f9fb",
//             borderRadius: 12,
//             padding: 16,
//           }}
//         >
//           <div style={{ fontWeight: 600, marginBottom: 8 }}>
//             Projects (
//             {new Set(rows.map((r) => r.projectName).filter(Boolean)).size})
//           </div>

//           <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//             {[...new Set(rows.map((r) => r.projectName).filter(Boolean))].map(
//               (projectName) => (
//                 <Tag
//                   key={projectName}
//                   style={{
//                     borderRadius: 999,
//                     padding: "4px 10px",
//                     background: "#fff",
//                   }}
//                 >
//                   {projectName}
//                 </Tag>
//               ),
//             )}
//           </div>
//         </div>

//         {/* Warning */}
//         {totalHours < expectedHours && (
//           <div
//             style={{
//               marginTop: 16,
//               padding: 12,
//               borderRadius: 8,
//               background: "#fff7e6",
//               color: "#fa8c16",
//               display: "flex",
//               gap: 8,
//               alignItems: "center",
//             }}
//           >
//             <WarningOutlined />
//             <span>
//               Warning: You've logged {expectedHours - totalHours}h less than
//               expected.
//             </span>
//           </div>
//         )}

//         {/* Footer Buttons */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-end",
//             gap: 12,
//             marginTop: 24,
//           }}
//         >
//           <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//           {!isPreviewMode && (
//             <Button
//               type="primary"
//               loading={loading}
//               icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//               onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//             >
//               {isEditMode ? "Save Changes" : "Submit Timesheet"}
//             </Button>
//           )}
//         </div>
//       </Modal>
//       <Modal
//         open={isSubmittedModalOpen}
//         onCancel={() => setIsSubmittedModalOpen(false)}
//         footer={[
//           <Button
//             key="ok"
//             type="primary"
//             onClick={() => {
//               setIsSubmittedModalOpen(false);
//               //router.push("/timesheets/timesheet"); // redirect to timesheet page
//               onSubmitted();
//             }}
//           >
//             OK
//           </Button>,
//         ]}
//         centered
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
//           <div>
//             <Text strong style={{ fontSize: 16 }}>
//               Time Entry Submitted
//             </Text>
//             <br />
//             <Text type="secondary">
//               Your timesheet has been successfully submitted.
//             </Text>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";

// const { Title, Text } = Typography;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[]; // Changed from taskId to taskIds for multiple selection
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[]; // Changed from taskName to taskNames
// }

// const tableStyles = `
//   .ant-table-wrapper {
//     box-shadow: none !important;
//   }
//   .ant-table {
//     box-shadow: none !important;
//   }
//   .ant-table-container {
//     box-shadow: none !important;
//   }
//   .ant-table-cell {
//     box-shadow: none !important;
//   }
//   .ant-table-row {
//     box-shadow: none !important;
//   }
// `;

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//       };
//     });
//   }, [currentDate]);

//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [], // Initialize as empty array
//         taskNames: [],
//         description: "",
//         hours: 0,
//         billable: true,
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || "Unknown Employee",
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 && // Check if at least one task is selected
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   // Debug logs
//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         rows: sheet.rows?.map(r => ({
//           id: r.id,
//           day: r.day,
//           taskId: r.taskId,
//           taskName: r.taskName,
//           projectId: r.projectId,
//           projectName: r.projectName
//         })),
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (rows.length > 0) {
//       console.log("📝 Mapped rows:", rows.map(r => ({
//         key: r.key,
//         day: r.day,
//         taskIds: r.taskIds,
//         taskNames: r.taskNames,
//         projectId: r.projectId
//       })));
//     }
//   }, [rows]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           // FIXED: Properly handle multiple tasks
//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           // Get the correct project ID
//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             // If single taskId exists
//             taskIds = [r.taskId];
//             const task = tasks.find(t => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             // Try to find tasks by name for this project
//             if (projectId) {
//               // Handle comma-separated task names
//               const taskNameList = r.taskName.split(',').map(name => name.trim());

//               taskNameList.forEach(name => {
//                 const matchedTasks = tasks.filter(
//                   t => t.projectId === projectId && t.name === name
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map(t => t.id));
//                   taskNames.push(...matchedTasks.map(t => t.name));
//                 } else {
//                   // If no match found, just use the taskName
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               // If no project ID, just use the taskName as is
//               taskNames = r.taskName.split(',').map(name => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: rowDate.format("YYYY-MM-DD"),
//             projectId: projectId,
//             taskIds: taskIds, // Now properly populated
//             description: r.description,
//             hours: r.hours,
//             billable: r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName: projects.find((p) => p.id === projectId)?.name || r.projectName || "",
//             taskNames: taskNames, // Now properly populated
//             employeeName: sheet.user?.name ?? "Unknown Employee",
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Update project name based on projectId
//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         // Update task names based on taskIds
//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           // Only update if we have matching tasks
//           const foundTasks = r.taskIds
//             .map(id => tasks.find((t) => t.id === id))
//             .filter(Boolean) as { id: string; name: string; projectId: string }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map(t => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           // If project changes, reset tasks
//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           // If date changes, update currentDate
//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? "Unknown Employee",
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined, // Remove ID for new row
//         taskIds: [...(row.taskIds || [])], // Copy array
//         taskNames: [...(row.taskNames || [])] // Copy array
//       }
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key
//           ? {
//               ...row,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));
//       result.push({
//         key: `${d.label}-summary-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//         employeeName: sheet?.user?.name ?? "Unknown Employee",
//         taskIds: [],
//         taskNames: [],
//       });
//     });
//     return result;
//   }, [rows, DAYS]);

//   const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows.reduce(
//     (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
//     0,
//   );
//   const expectedHours = 40;

//   // Get available tasks for selected project
//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => (
//         <Space>
//           {r.isSummary ? (
//             <Text type="secondary">{r.date}</Text>
//           ) : (
//             <Text strong>{r.day}</Text>
//           )}
//           {isWeekend(r.day) && !r.isSummary && (
//             <Checkbox
//               checked={isFieldEditable(r)}
//               onChange={(e) =>
//                 setWeekendEditable((prev) => ({
//                   ...prev,
//                   [r.key]: e.target.checked,
//                 }))
//               }
//             />
//           )}
//         </Space>
//       ),
//     },
//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r)}
//               bordered={false}
//               value={r.projectId}
//               placeholder="Project"
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);
//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskIds: [], // Reset tasks when project changes
//                   taskNames: [],
//                 });
//               }}
//             />
//           </Tooltip>
//         ),
//     },
//     {
//       title: "TASKS", // Changed from TASK to TASKS
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? null : (
//           <Tooltip
//             title={
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               mode="multiple" // Enable multiple selection
//               allowClear
//               bordered={false}
//               value={r.taskIds}
//               placeholder="Select tasks"
//               style={{ width: 250 }}
//               disabled={!r.projectId || isViewMode || !isFieldEditable(r)} // Disable if no project selected
//               options={getAvailableTasks(r.projectId).map((t) => ({
//                 value: t.id,
//                 label: t.name,
//               }))}
//               onChange={(taskIds: string[]) => {
//                 const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
//                 updateRow(r.key, {
//                   taskIds,
//                   taskNames: selectedTasks.map(t => t.name),
//                 });
//               }}
//             />
//           </Tooltip>
//         ),
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() => setExpandedRow(expandedRow === r.key ? null : r.key)}
//             style={{ cursor: "pointer" }}
//           >
//             {r.description || "Description"}{" "}
//             <span>{expandedRow === r.key ? "▲" : "▼"}</span>
//           </div>
//         ),
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>
//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               updateRow(r.key, {
//                 hours: value ?? 0,
//               });
//             }}
//           />
//         ),
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r)}
//             checked={r.billable}
//             onChange={(v) => updateRow(r.key, { billable: v })}
//           />
//         ),
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) =>
//         r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: "green",
//                 cursor: isFieldEditable(r) ? "pointer" : "not-allowed",
//                 opacity: isFieldEditable(r) ? 1 : 0.5,
//               }}
//               onClick={() => isFieldEditable(r) && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: "blue",
//                 cursor: isFieldEditable(r) ? "pointer" : "not-allowed",
//                 opacity: isFieldEditable(r) ? 1 : 0.5,
//               }}
//               onClick={() => isFieldEditable(r) && handleDeleteRow(r.key)}
//             />
//           </Space>
//         ),
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true); // Only draft loading state
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       const rowsForPayload = rows.map((r) => ({
//         day: new Date(`${r.date}T00:00:00Z`),
//         projectId: r.projectId,
//         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined, // Send first task or handle accordingly
//         projectName: r.projectName || "",
//         taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "", // Join multiple task names
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable ?? true,
//       }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false); // Stop draft loading
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("SUBMIT BUTTON CLICKED");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true); // Only submit loading state

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       const rowsForPayload = rows.map((r) => ({
//         id: r.id,
//         day: new Date(`${r.date}T00:00:00Z`),
//         projectId: r.projectId,
//         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//         projectName: r.projectName || "",
//         taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable ?? true,
//       }));

//       console.log("rowpayload", rowsForPayload);

//       let timesheetId: string;
//       if (existing) {
//         await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         const newTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//         });
//         timesheetId = newTimesheet.id;
//       }

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//       } catch (submitError) {
//         console.warn(
//           "Submit API threw error, but backend already submitted",
//           submitError,
//         );
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//        onSubmitted();

//     } catch (err) {
//       console.error("Unexpected submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false); // Stop submit loading
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true); // Only save changes loading state

//       const rowsForPayload = rows.map((r) => ({
//         id: r.id,
//         day: new Date(`${r.date}T00:00:00Z`),
//         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//         projectId: r.projectId,
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable || false,
//         ...(r.projectName && { projectName: r.projectName }),
//         ...(r.taskNames && { taskName: r.taskNames.join(', ') }),
//       }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//       };

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false); // Stop save changes loading
//     }
//   };

//   return (
//     <>
//      <style>{tableStyles}</style>
//     <div style={{ padding: 22 }}>
//       {/* Header */}
//       <div
//         className="timesheet-header"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 24,
//           flexWrap: "wrap",
//         }}
//       >
//         <div>
//           <Title level={3} style={{ margin: 0, color: "#262626" }}>
//             {isEditMode
//               ? `Edit Timesheet`
//               : `My Timesheet`}
//           </Title>
//           <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//             {currentDate.format("MMMM YYYY")}
//           </Text>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//           <Button
//             icon={<LeftOutlined />}
//             onClick={() => setCurrentDate(currentDate.subtract(1, "week"))}
//             type="text"
//             style={{ color: "#595959" }}
//           />
//           <div
//             style={{
//               padding: "6px 16px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//               fontSize: 14,
//               fontWeight: 500,
//               color: "#1a1a1a",
//               minWidth: 200,
//               textAlign: "center",
//             }}
//           >
//             {currentDate.startOf("week").format("MMM DD")} –{" "}
//             {currentDate.endOf("week").format("MMM DD, YYYY")}
//           </div>
//           <Button
//             icon={<RightOutlined />}
//             onClick={() => setCurrentDate(currentDate.add(1, "week"))}
//             type="text"
//             style={{ color: "#595959" }}
//           />
//         </div>

//         <div
//           style={{
//             marginLeft: "auto",
//             display: "flex",
//             alignItems: "center",
//             gap: 12,
//             padding: "6px 12px",
//             backgroundColor: "#fafafa",
//             borderRadius: 6,
//           }}
//         >
//           <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//             {totalHours}h / 40h
//           </Text>
//           <Progress
//             percent={(totalHours / 40) * 100}
//             showInfo={false}
//             strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//             strokeWidth={6}
//             style={{ width: 80 }}
//           />
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <Button
//             icon={<SaveOutlined />}
//             htmlType="submit"
//             loading={saveDraftLoading} // Use separate loading state
//             onClick={handleSaveDraft}
//             disabled={isViewMode || status === "Submitted"}
//             style={{
//               fontWeight: 600,
//               border: "1px solid grey",
//               color: "#595959",
//             }}
//           >
//             Save Draft
//           </Button>

//           <Button
//             type="primary"
//             icon={<SendOutlined />}
//             onClick={() => setIsSubmitOpen(true)}
//             style={{ minWidth: 100 }}
//           >
//             Submit
//           </Button>
//         </div>
//       </div>

//       <Divider />

//       {/* Table */}
//       <Table
//         style={{ marginTop: "10px" }}
//         columns={columns}
//         dataSource={displayRows}
//         pagination={false}
//         bordered
//         rowKey="key"
//         expandable={{
//           expandedRowKeys: expandedRow ? [expandedRow] : [],
//           expandIcon: () => null,
//           expandedRowRender: (r) =>
//             !r.isSummary && (
//               <Input.TextArea
//                 rows={3}
//                 value={r.description}
//                 onChange={(e) =>
//                   updateRow(r.key, { description: e.target.value })
//                 }
//               />
//             ),
//         }}
//         rowClassName={(r) => (r.isSummary ? "no-column-border" : "")}
//         summary={() => (
//           <Table.Summary fixed>
//             <Table.Summary.Row>
//               <Table.Summary.Cell index={0} colSpan={columns.length}>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     padding: "12px 24px",
//                     borderRadius: 6,
//                     fontWeight: 600,
//                     fontSize: 14,
//                     color: "#1f1f1f",
//                   }}
//                 >
//                   <span style={{ color: "#595959" }}>Week Total</span>
//                   <span
//                     style={{
//                       display: "flex",
//                       gap: "30px",
//                       alignItems: "center",
//                       color: "#262626",
//                     }}
//                   >
//                     <span>{totalHours}h / 40h</span>
//                     <span style={{ color: "#1890ff" }}>
//                       {totalBillable} h billable
//                     </span>
//                   </span>
//                 </div>
//               </Table.Summary.Cell>
//             </Table.Summary.Row>
//           </Table.Summary>
//         )}
//       />

//       {/* Submit Modal */}
//       <Modal
//         open={isSubmitOpen}
//         onCancel={() => setIsSubmitOpen(false)}
//         footer={null}
//         width={520}
//         centered
//         styles={{ body: { paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 24 } }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             display: "flex",
//             gap: 12,
//             alignItems: "center",
//             margin: 0,
//           }}
//         >
//           <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//           <div>
//             <Text strong style={{ fontSize: 16 }}>
//               {isEditMode ? "Save Changes" : "Submit Timesheet"}
//             </Text>
//             <br />
//             <Text type="secondary">
//               {isEditMode
//                 ? "Review and save your updated timesheet."
//                 : "Review your timesheet summary before submission."}
//             </Text>
//           </div>
//         </div>

//         <Divider />

//         {/* Summary cards */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(3, 1fr)",
//             gap: 16,
//             marginBottom: 20,
//           }}
//         >
//           {/* Total Hours */}
//           <div
//             style={{
//               background: "#f2f5f8",
//               borderRadius: 12,
//               padding: 16,
//               textAlign: "center",
//             }}
//           >
//             <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//             <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//               {totalHours}h
//             </div>
//             <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//           </div>

//           {/* Billable */}
//           <div
//             style={{
//               background: "#f2f5f8",
//               borderRadius: 12,
//               padding: 16,
//               textAlign: "center",
//             }}
//           >
//             <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//             <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//               {totalBillable}h
//             </div>
//             <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//           </div>

//           {/* Entries */}
//           <div
//             style={{
//               background: "#f2f5f8",
//               borderRadius: 12,
//               padding: 16,
//               textAlign: "center",
//             }}
//           >
//             <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//             <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//               {entryCount}
//             </div>
//             <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//           </div>
//         </div>

//         {/* Projects */}
//         <div
//           style={{
//             background: "#f7f9fb",
//             borderRadius: 12,
//             padding: 16,
//           }}
//         >
//           <div style={{ fontWeight: 600, marginBottom: 8 }}>
//             Projects (
//             {new Set(rows.map((r) => r.projectName).filter(Boolean)).size})
//           </div>

//           <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//             {[...new Set(rows.map((r) => r.projectName).filter(Boolean))].map(
//               (projectName) => (
//                 <Tag
//                   key={projectName}
//                   style={{
//                     borderRadius: 999,
//                     padding: "4px 10px",
//                     background: "#fff",
//                   }}
//                 >
//                   {projectName}
//                 </Tag>
//               ),
//             )}
//           </div>
//         </div>

//         {/* Warning */}
//         {totalHours < expectedHours && (
//           <div
//             style={{
//               marginTop: 16,
//               padding: 12,
//               borderRadius: 8,
//               background: "#fff7e6",
//               color: "#fa8c16",
//               display: "flex",
//               gap: 8,
//               alignItems: "center",
//             }}
//           >
//             <WarningOutlined />
//             <span>
//               Warning: You've logged {expectedHours - totalHours}h less than
//               expected.
//             </span>
//           </div>
//         )}

//         {/* Footer Buttons */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-end",
//             gap: 12,
//             marginTop: 24,
//           }}
//         >
//           <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//           {!isPreviewMode && (
//             <Button
//               type="primary"
//               loading={isEditMode ? saveChangesLoading : submitLoading} // Use appropriate loading state
//               icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//               onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//             >
//               {isEditMode ? "Save Changes" : "Submit Timesheet"}
//             </Button>
//           )}
//         </div>
//       </Modal>

//     </div>
//     </>
//   );
// }

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
// }

// const tableStyles = `
//   .ant-table-wrapper {
//     box-shadow: none !important;
//   }
//   .ant-table {
//     box-shadow: none !important;
//   }
//   .ant-table-container {
//     box-shadow: none !important;
//   }
//   .ant-table-cell {
//     box-shadow: none !important;
//   }
//   .ant-table-row {
//     box-shadow: none !important;
//   }
// `;

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - ONLY dates, no count
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - DATES ONLY
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set to store ONLY leave dates
//       const leaveDateSet = new Set<string>();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Loop through each leave and add ALL dates in the range
//         leavesArray.forEach((leave: any) => {
//           // Only consider APPROVED leaves
//           if (leave.status === 'APPROVED' || leave.status === 'approved') {
//             const startDate = dayjs(leave.startDate).format('YYYY-MM-DD');
//             const endDate = dayjs(leave.endDate).format('YYYY-MM-DD');

//             console.log(`📅 Leave from ${startDate} to ${endDate} - ${leave.type}`);

//             // Add each day in the leave range to the Set
//             let currentDate = dayjs(startDate);
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
//               leaveDateSet.add(currentDate.format('YYYY-MM-DD'));
//               console.log(`  ✅ Added leave date: ${currentDate.format('YYYY-MM-DD')}`);
//               currentDate = currentDate.add(1, 'day');
//             }
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       setLeaveDates(leaveDateSet);

//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Fetch leaves when component mounts
//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//       };
//     });
//   }, [currentDate]);

//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: "",
//         hours: 0,
//         billable: true,
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find(t => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName.split(',').map(name => name.trim());

//               taskNameList.forEach(name => {
//                 const matchedTasks = tasks.filter(
//                   t => t.projectId === projectId && t.name === name
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map(t => t.id));
//                   taskNames.push(...matchedTasks.map(t => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(',').map(name => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: rowDate.format("YYYY-MM-DD"),
//             projectId: projectId,
//             taskIds: taskIds,
//             description: r.description,
//             hours: r.hours,
//             billable: r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName: projects.find((p) => p.id === projectId)?.name || r.projectName || "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map(id => tasks.find((t) => t.id === id))
//             .filter(Boolean) as { id: string; name: string; projectId: string }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map(t => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])]
//       }
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key
//           ? {
//               ...row,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));
//       result.push({
//         key: `${d.label}-summary-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         taskIds: [],
//         taskNames: [],
//       });
//     });
//     return result;
//   }, [rows, DAYS, sheet, user]);

//   const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows.reduce(
//     (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
//     0,
//   );
//   const expectedHours = 40;

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   // UPDATED COLUMNS - With leave date checking
//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         // Check if this date is in the leave Set
//         const isLeave = leaveDates.has(r.date);

//         return (
//           <Space>
//             {/* Show LEAVE tag ONLY on leave dates */}
//             {isLeave && !r.isSummary && (
//               <Tag color="red" style={{ marginRight: 4, fontWeight: 'bold' }}>
//                 LEAVE
//               </Tag>
//             )}

//             {r.isSummary ? (
//               <Text type="secondary">{r.date}</Text>
//             ) : (
//               <Text strong style={{ color: isLeave ? '#ff4d4f' : 'inherit' }}>
//                 {r.day}
//               </Text>
//             )}

//             {/* Weekend checkbox - only show on non-leave days */}
//             {isWeekend(r.day) && !r.isSummary && !isLeave && (
//               <Checkbox
//                 checked={isFieldEditable(r)}
//                 onChange={(e) =>
//                   setWeekendEditable((prev) => ({
//                     ...prev,
//                     [r.key]: e.target.checked,
//                   }))
//                 }
//               />
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) => {
//         // Check if this date is a leave day
//         const isLeave = leaveDates.has(r.date);

//         return r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//             disabled={isLeave} // Disable "Add entry" on leave days
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               bordered={false}
//               value={r.projectId}
//               placeholder={isLeave ? "Leave day" : "Project"}
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);
//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskIds: [],
//                   taskNames: [],
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "TASKS",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = leaveDates.has(r.date);

//         return r.isSummary ? null : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               mode="multiple"
//               allowClear
//               bordered={false}
//               value={r.taskIds}
//               placeholder={isLeave ? "Leave day" : "Select tasks"}
//               style={{ width: 250 }}
//               disabled={!r.projectId || isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               options={getAvailableTasks(r.projectId).map((t) => ({
//                 value: t.id,
//                 label: t.name,
//               }))}
//               onChange={(taskIds: string[]) => {
//                 const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
//                 updateRow(r.key, {
//                   taskIds,
//                   taskNames: selectedTasks.map(t => t.name),
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = leaveDates.has(r.date);

//         return r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() => !isLeave && setExpandedRow(expandedRow === r.key ? null : r.key)}
//             style={{
//               cursor: isLeave ? 'not-allowed' : 'pointer',
//               color: isLeave ? '#999' : 'inherit'
//             }}
//           >
//             {isLeave ? 'On Leave' : (r.description || "Description")}{" "}
//             {!isLeave && <span>{expandedRow === r.key ? "▲" : "▼"}</span>}
//           </div>
//         );
//       },
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = leaveDates.has(r.date);

//         return r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>
//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             disabled={isLeave} // Disable on leave
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               updateRow(r.key, {
//                 hours: value ?? 0,
//               });
//             }}
//           />
//         );
//       },
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = leaveDates.has(r.date);

//         return r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//             checked={r.billable}
//             onChange={(v) => updateRow(r.key, { billable: v })}
//           />
//         );
//       },
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = leaveDates.has(r.date);

//         return r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'green',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'blue',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleDeleteRow(r.key)}
//             />
//           </Space>
//         );
//       },
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       const rowsForPayload = rows.map((r) => ({
//         day: new Date(`${r.date}T00:00:00Z`),
//         projectId: r.projectId,
//         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//         projectName: r.projectName || "",
//         taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable ?? true,
//       }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("SUBMIT BUTTON CLICKED");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       const rowsForPayload = rows.map((r) => ({
//         id: r.id,
//         day: new Date(`${r.date}T00:00:00Z`),
//         projectId: r.projectId,
//         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//         projectName: r.projectName || "",
//         taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable ?? true,
//       }));

//       console.log("rowpayload", rowsForPayload);

//       let timesheetId: string;
//       if (existing) {
//         await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         const newTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//         });
//         timesheetId = newTimesheet.id;
//       }

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//       } catch (submitError) {
//         console.warn(
//           "Submit API threw error, but backend already submitted",
//           submitError,
//         );
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();

//     } catch (err) {
//       console.error("Unexpected submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       const rowsForPayload = rows.map((r) => ({
//         id: r.id,
//         day: new Date(`${r.date}T00:00:00Z`),
//         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//         projectId: r.projectId,
//         description: r.description || "",
//         hours: r.hours || 0,
//         billable: r.billable || false,
//         ...(r.projectName && { projectName: r.projectName }),
//         ...(r.taskNames && { taskName: r.taskNames.join(', ') }),
//       }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//       };

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   return (
//     <>
//       <style>{tableStyles}</style>
//       <div style={{ padding: 22 }}>
//         {/* Header */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => setCurrentDate(currentDate.subtract(1, "week"))}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => setCurrentDate(currentDate.add(1, "week"))}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Optional: Show leave dates for debugging - REMOVE this in production */}
//         {leaveDates.size > 0 && (
//           <div style={{ marginBottom: 16, padding: 8, background: '#fff1f0', borderRadius: 4 }}>
//             <Text strong>📅 Leave Dates: {Array.from(leaveDates).join(', ')}</Text>
//           </div>
//         )}

//         {/* Table */}
//         <Table
//           style={{ marginTop: "10px" }}
//           columns={columns}
//           dataSource={displayRows}
//           pagination={false}
//           bordered
//           rowKey="key"
//           expandable={{
//             expandedRowKeys: expandedRow ? [expandedRow] : [],
//             expandIcon: () => null,
//             expandedRowRender: (r) =>
//               !r.isSummary && (
//                 <Input.TextArea
//                   rows={3}
//                   value={r.description}
//                   onChange={(e) =>
//                     updateRow(r.key, { description: e.target.value })
//                   }
//                 />
//               ),
//           }}
//           rowClassName={(r) => (r.isSummary ? "no-column-border" : "")}
//           summary={() => (
//             <Table.Summary fixed>
//               <Table.Summary.Row>
//                 <Table.Summary.Cell index={0} colSpan={columns.length}>
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "12px 24px",
//                       borderRadius: 6,
//                       fontWeight: 600,
//                       fontSize: 14,
//                       color: "#1f1f1f",
//                     }}
//                   >
//                     <span style={{ color: "#595959" }}>Week Total</span>
//                     <span
//                       style={{
//                         display: "flex",
//                         gap: "30px",
//                         alignItems: "center",
//                         color: "#262626",
//                       }}
//                     >
//                       <span>{totalHours}h / 40h</span>
//                       <span style={{ color: "#1890ff" }}>
//                         {totalBillable} h billable
//                       </span>
//                     </span>
//                   </div>
//                 </Table.Summary.Cell>
//               </Table.Summary.Row>
//             </Table.Summary>
//           )}
//         />

//         {/* Submit Modal */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{ body: { paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 24 } }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {new Set(rows.map((r) => r.projectName).filter(Boolean)).size})
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[...new Set(rows.map((r) => r.projectName).filter(Boolean))].map(
//                 (projectName) => (
//                   <Tag
//                     key={projectName}
//                     style={{
//                       borderRadius: 999,
//                       padding: "4px 10px",
//                       background: "#fff",
//                     }}
//                   >
//                     {projectName}
//                   </Tag>
//                 ),
//               )}
//             </div>
//           </div>

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean; // Add this field
//   leaveType?: string; // Add this field
// }

// const tableStyles = `
//   .ant-table-wrapper {
//     box-shadow: none !important;
//   }
//   .ant-table {
//     box-shadow: none !important;
//   }
//   .ant-table-container {
//     box-shadow: none !important;
//   }
//   .ant-table-cell {
//     box-shadow: none !important;
//   }
//   .ant-table-row {
//     box-shadow: none !important;
//   }
//   .leave-row {
//     background-color: #fff2f0 !important;
//   }
//   .leave-row:hover {
//     background-color: #ffccc7 !important;
//   }
// `;

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<Map<string, { type: string, status: string }>>(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<string, { type: string, status: string }>();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           // 2. Status is approved (or approved/cancelled based on your requirement)
//           if (allowedLeaveTypes.includes(leaveType) &&
//               (leaveStatus === 'approved' || leaveStatus === 'cancelled')) {

//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(`📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`);

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
//               const dateStr = currentDate.format('YYYY-MM-DD');
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, 'day');
//             }
//           } else {
//             console.log(`❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave or not approved`);
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Fetch leaves when component mounts and when user changes
//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // Also fetch leaves when date changes (for different weeks/months)
//   useEffect(() => {
//     if (user?.id) {
//       console.log("📅 Date changed to:", currentDate.format("MMMM YYYY"));
//       // You can optionally fetch leaves for the new month here
//       // But since we already have all leaves, we don't need to refetch
//     }
//   }, [currentDate, user?.id]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (date: string): { type: string, status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find(t => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName.split(',').map(name => name.trim());

//               taskNameList.forEach(name => {
//                 const matchedTasks = tasks.filter(
//                   t => t.projectId === projectId && t.name === name
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map(t => t.id));
//                   taskNames.push(...matchedTasks.map(t => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(',').map(name => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);
//           const dateStr = rowDate.format("YYYY-MM-DD");

//           // Check if this date is a leave
//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : r.description,
//             hours: isLeave ? 0 : r.hours,
//             billable: isLeave ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName: projects.find((p) => p.id === projectId)?.name || r.projectName || "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user, leaveDates]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map(id => tasks.find((t) => t.id === id))
//             .filter(Boolean) as { id: string; name: string; projectId: string }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map(t => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])]
//       }
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key && !row.isLeave // Don't clear leave rows
//           ? {
//               ...row,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label && !r.isSummary);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));

//       // Add summary row
//       result.push({
//         key: `${d.label}-summary-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         taskIds: [],
//         taskNames: [],
//       });
//     });
//     return result;
//   }, [rows, DAYS, sheet, user]);

//   const totalHours = rows.filter(r => !r.isLeave).reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows.filter(r => !r.isLeave).reduce(
//     (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
//     0,
//   );
//   const expectedHours = 40;

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   // UPDATED COLUMNS - With leave date checking
//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         // Check if this is a leave day
//         const isLeave = r.isLeave;

//         return (
//           <Space>
//             {/* Show LEAVE tag on leave days */}
//             {isLeave && !r.isSummary && (
//               <Tag color="red" style={{ marginRight: 4, fontWeight: 'bold' }}>
//                 LEAVE
//               </Tag>
//             )}

//             {r.isSummary ? (
//               <Text type="secondary">{r.date}</Text>
//             ) : (
//               <Text strong style={{ color: isLeave ? '#ff4d4f' : 'inherit' }}>
//                 {r.day}
//               </Text>
//             )}

//             {/* Weekend checkbox - only show on non-leave days */}
//             {isWeekend(r.day) && !r.isSummary && !isLeave && (
//               <Checkbox
//                 checked={isFieldEditable(r)}
//                 onChange={(e) =>
//                   setWeekendEditable((prev) => ({
//                     ...prev,
//                     [r.key]: e.target.checked,
//                   }))
//                 }
//               />
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//             disabled={isLeave} // Disable "Add entry" on leave days
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               bordered={false}
//               value={r.projectId}
//               placeholder={isLeave ? "Leave day" : "Project"}
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);
//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskIds: [],
//                   taskNames: [],
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "TASKS",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               mode="multiple"
//               allowClear
//               bordered={false}
//               value={r.taskIds}
//               placeholder={isLeave ? "Leave day" : "Select tasks"}
//               style={{ width: 250 }}
//               disabled={!r.projectId || isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               options={getAvailableTasks(r.projectId).map((t) => ({
//                 value: t.id,
//                 label: t.name,
//               }))}
//               onChange={(taskIds: string[]) => {
//                 const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
//                 updateRow(r.key, {
//                   taskIds,
//                   taskNames: selectedTasks.map(t => t.name),
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() => !isLeave && setExpandedRow(expandedRow === r.key ? null : r.key)}
//             style={{
//               cursor: isLeave ? 'not-allowed' : 'pointer',
//               color: isLeave ? '#999' : 'inherit'
//             }}
//           >
//             {isLeave ? 'On Leave' : (r.description || "Description")}{" "}
//             {!isLeave && <span>{expandedRow === r.key ? "▲" : "▼"}</span>}
//           </div>
//         );
//       },
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>
//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             disabled={isLeave} // Disable on leave
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               if (!isLeave) {
//                 updateRow(r.key, {
//                   hours: value ?? 0,
//                 });
//               }
//             }}
//           />
//         );
//       },
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//             checked={r.billable}
//             onChange={(v) => !isLeave && updateRow(r.key, { billable: v })}
//           />
//         );
//       },
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'green',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'blue',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleDeleteRow(r.key)}
//             />
//           </Space>
//         );
//       },
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("SUBMIT BUTTON CLICKED");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       console.log("rowpayload", rowsForPayload);

//       let timesheetId: string;
//       if (existing) {
//         await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         const newTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//         });
//         timesheetId = newTimesheet.id;
//       }

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//       } catch (submitError) {
//         console.warn(
//           "Submit API threw error, but backend already submitted",
//           submitError,
//         );
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();

//     } catch (err) {
//       console.error("Unexpected submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectId: r.projectId,
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable || false,
//           ...(r.projectName && { projectName: r.projectName }),
//           ...(r.taskNames && { taskName: r.taskNames.join(', ') }),
//         }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//       };

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   // Calculate leave count for the current week
//   const weekLeaveCount = useMemo(() => {
//     return rows.filter(r => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   return (
//     <>
//       <style>{tableStyles}</style>
//       <div style={{ padding: 22 }}>
//         {/* Header */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => setCurrentDate(currentDate.subtract(1, "week"))}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => setCurrentDate(currentDate.add(1, "week"))}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
//             <Space>
//               <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
//               <Text strong style={{ color: '#ff4d4f' }}>Leave Alert:</Text>
//               <Text>You have {weekLeaveCount} leave day(s) this week. Those days are disabled for timesheet entry.</Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {process.env.NODE_ENV === 'development' && leaveDates.size > 0 && (
//           <div style={{ marginBottom: 16, padding: 8, background: '#f0f5ff', borderRadius: 4 }}>
//             <Text strong>📅 Leave Dates: {Array.from(leaveDates).join(', ')}</Text>
//           </div>
//         )}

//         {/* Table */}
//         <Table
//           style={{ marginTop: "10px" }}
//           columns={columns}
//           dataSource={displayRows}
//           pagination={false}
//           bordered
//           rowKey="key"
//           rowClassName={(r) => {
//             if (r.isSummary) return "no-column-border";
//             if (r.isLeave) return "leave-row";
//             return "";
//           }}
//           expandable={{
//             expandedRowKeys: expandedRow ? [expandedRow] : [],
//             expandIcon: () => null,
//             expandedRowRender: (r) =>
//               !r.isSummary && !r.isLeave && (
//                 <Input.TextArea
//                   rows={3}
//                   value={r.description}
//                   onChange={(e) =>
//                     updateRow(r.key, { description: e.target.value })
//                   }
//                 />
//               ),
//           }}
//           summary={() => (
//             <Table.Summary fixed>
//               <Table.Summary.Row>
//                 <Table.Summary.Cell index={0} colSpan={columns.length}>
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "12px 24px",
//                       borderRadius: 6,
//                       fontWeight: 600,
//                       fontSize: 14,
//                       color: "#1f1f1f",
//                     }}
//                   >
//                     <span style={{ color: "#595959" }}>Week Total</span>
//                     <span
//                       style={{
//                         display: "flex",
//                         gap: "30px",
//                         alignItems: "center",
//                         color: "#262626",
//                       }}
//                     >
//                       <span>{totalHours}h / 40h</span>
//                       <span style={{ color: "#1890ff" }}>
//                         {totalBillable} h billable
//                       </span>
//                       {weekLeaveCount > 0 && (
//                         <Tag color="red">{weekLeaveCount} Leave Day(s)</Tag>
//                       )}
//                     </span>
//                   </div>
//                 </Table.Summary.Cell>
//               </Table.Summary.Row>
//             </Table.Summary>
//           )}
//         />

//         {/* Submit Modal */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{ body: { paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 24 } }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {new Set(rows.filter(r => !r.isLeave).map((r) => r.projectName).filter(Boolean)).size})
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[...new Set(rows.filter(r => !r.isLeave).map((r) => r.projectName).filter(Boolean))].map(
//                 (projectName) => (
//                   <Tag
//                     key={projectName}
//                     style={{
//                       borderRadius: 999,
//                       padding: "4px 10px",
//                       background: "#fff",
//                     }}
//                   >
//                     {projectName}
//                   </Tag>
//                 ),
//               )}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// } date working

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean; // Add this field
//   leaveType?: string; // Add this field
// }

// const tableStyles = `
//   .ant-table-wrapper {
//     box-shadow: none !important;
//   }
//   .ant-table {
//     box-shadow: none !important;
//   }
//   .ant-table-container {
//     box-shadow: none !important;
//   }
//   .ant-table-cell {
//     box-shadow: none !important;
//   }
//   .ant-table-row {
//     box-shadow: none !important;
//   }
//   .leave-row {
//     background-color: #fff2f0 !important;
//   }
//   .leave-row:hover {
//     background-color: #ffccc7 !important;
//   }
// `;

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<Map<string, { type: string, status: string }>>(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<string, { type: string, status: string }>();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           // 2. Status is approved or cancelled (based on your requirement)
//           if (allowedLeaveTypes.includes(leaveType)) {

//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(`📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`);

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
//               const dateStr = currentDate.format('YYYY-MM-DD');
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, 'day');
//             }
//           } else {
//             console.log(`❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`);
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//       // After fetching leaves, refresh the rows for the current week
//       refreshRowsForCurrentWeek();

//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Function to refresh rows for the current week based on leave dates
//   const refreshRowsForCurrentWeek = () => {
//     if (!id && !sheet) {
//       // We're in create mode, just create empty rows with leave info
//       setRows(createEmptyRows());
//     } else if (id && sheet) {
//       // We're in edit mode, we need to preserve existing entries but update leave status
//       setRows((prevRows) =>
//         prevRows.map((row) => {
//           const isLeave = isDateLeave(row.date);
//           const leaveInfo = getLeaveInfo(row.date);

//           if (isLeave && !row.isLeave) {
//             // This row should be marked as leave
//             return {
//               ...row,
//               isLeave: true,
//               leaveType: leaveInfo?.type,
//               description: `On leave (${leaveInfo?.type || "Leave"})`,
//               hours: 0,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//             };
//           }
//           return row;
//         })
//       );
//     }
//   };

//   // Fetch leaves when component mounts and when user changes
//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // When date changes, refresh the rows to show leaves for the new week
//   useEffect(() => {
//     if (user?.id) {
//       console.log("📅 Date changed to:", currentDate.format("MMMM YYYY"), "Week:", currentDate.startOf("week").format("YYYY-MM-DD"), "to", currentDate.endOf("week").format("YYYY-MM-DD"));

//       // Refresh rows for the new week
//       if (!id && !sheet) {
//         // Create mode - create new empty rows
//         setRows(createEmptyRows());
//       } else {
//         // Edit mode - update existing rows with leave status
//         refreshRowsForCurrentWeek();
//       }
//     }
//   }, [currentDate, user?.id, leaveDates]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (date: string): { type: string, status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find(t => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName.split(',').map(name => name.trim());

//               taskNameList.forEach(name => {
//                 const matchedTasks = tasks.filter(
//                   t => t.projectId === projectId && t.name === name
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map(t => t.id));
//                   taskNames.push(...matchedTasks.map(t => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(',').map(name => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);
//           const dateStr = rowDate.format("YYYY-MM-DD");

//           // Check if this date is a leave
//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : r.description,
//             hours: isLeave ? 0 : r.hours,
//             billable: isLeave ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName: projects.find((p) => p.id === projectId)?.name || r.projectName || "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user]);

//   // Update rows when leaveDates change (for existing sheets)
//   useEffect(() => {
//     if (id && sheet && leaveDates.size > 0) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map(id => tasks.find((t) => t.id === id))
//             .filter(Boolean) as { id: string; name: string; projectId: string }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map(t => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])]
//       }
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key && !row.isLeave // Don't clear leave rows
//           ? {
//               ...row,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label && !r.isSummary);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));

//       // Add summary row
//       result.push({
//         key: `${d.label}-summary-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         taskIds: [],
//         taskNames: [],
//       });
//     });
//     return result;
//   }, [rows, DAYS, sheet, user]);

//   const totalHours = rows.filter(r => !r.isLeave).reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows.filter(r => !r.isLeave).reduce(
//     (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
//     0,
//   );
//   const expectedHours = 40;

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   // UPDATED COLUMNS - With leave date checking
//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         // Check if this is a leave day
//         const isLeave = r.isLeave;

//         return (
//           <Space>
//             {/* Show LEAVE tag on leave days */}
//             {isLeave && !r.isSummary && (
//               <Tag color="red" style={{ marginRight: 4, fontWeight: 'bold' }}>
//                 LEAVE
//               </Tag>
//             )}

//             {r.isSummary ? (
//               <Text type="secondary">{r.date}</Text>
//             ) : (
//               <Text strong style={{ color: isLeave ? '#ff4d4f' : 'inherit' }}>
//                 {r.day}
//               </Text>
//             )}

//             {/* Weekend checkbox - only show on non-leave days */}
//             {isWeekend(r.day) && !r.isSummary && !isLeave && (
//               <Checkbox
//                 checked={isFieldEditable(r)}
//                 onChange={(e) =>
//                   setWeekendEditable((prev) => ({
//                     ...prev,
//                     [r.key]: e.target.checked,
//                   }))
//                 }
//               />
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//             disabled={isLeave} // Disable "Add entry" on leave days
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               bordered={false}
//               value={r.projectId}
//               placeholder={isLeave ? "Leave day" : "Project"}
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);
//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskIds: [],
//                   taskNames: [],
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "TASKS",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               mode="multiple"
//               allowClear
//               bordered={false}
//               value={r.taskIds}
//               placeholder={isLeave ? "Leave day" : "Select tasks"}
//               style={{ width: 250 }}
//               disabled={!r.projectId || isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               options={getAvailableTasks(r.projectId).map((t) => ({
//                 value: t.id,
//                 label: t.name,
//               }))}
//               onChange={(taskIds: string[]) => {
//                 const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
//                 updateRow(r.key, {
//                   taskIds,
//                   taskNames: selectedTasks.map(t => t.name),
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() => !isLeave && setExpandedRow(expandedRow === r.key ? null : r.key)}
//             style={{
//               cursor: isLeave ? 'not-allowed' : 'pointer',
//               color: isLeave ? '#999' : 'inherit'
//             }}
//           >
//             {isLeave ? 'On Leave' : (r.description || "Description")}{" "}
//             {!isLeave && <span>{expandedRow === r.key ? "▲" : "▼"}</span>}
//           </div>
//         );
//       },
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>
//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             disabled={isLeave} // Disable on leave
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               if (!isLeave) {
//                 updateRow(r.key, {
//                   hours: value ?? 0,
//                 });
//               }
//             }}
//           />
//         );
//       },
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//             checked={r.billable}
//             onChange={(v) => !isLeave && updateRow(r.key, { billable: v })}
//           />
//         );
//       },
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'green',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'blue',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleDeleteRow(r.key)}
//             />
//           </Space>
//         );
//       },
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("SUBMIT BUTTON CLICKED");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       console.log("rowpayload", rowsForPayload);

//       let timesheetId: string;
//       if (existing) {
//         await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         const newTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//         });
//         timesheetId = newTimesheet.id;
//       }

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//       } catch (submitError) {
//         console.warn(
//           "Submit API threw error, but backend already submitted",
//           submitError,
//         );
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();

//     } catch (err) {
//       console.error("Unexpected submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectId: r.projectId,
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable || false,
//           ...(r.projectName && { projectName: r.projectName }),
//           ...(r.taskNames && { taskName: r.taskNames.join(', ') }),
//         }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//       };

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   // Calculate leave count for the current week
//   const weekLeaveCount = useMemo(() => {
//     return rows.filter(r => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   return (
//     <>
//       <style>{tableStyles}</style>
//       <div style={{ padding: 22 }}>
//         {/* Header */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.subtract(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.add(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
//             <Space>
//               <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
//               <Text strong style={{ color: '#ff4d4f' }}>Leave Alert:</Text>
//               <Text>You have {weekLeaveCount} leave day(s) this week. Those days are disabled for timesheet entry.</Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {process.env.NODE_ENV === 'development' && leaveDates.size > 0 && (
//           <div style={{ marginBottom: 16, padding: 8, background: '#f0f5ff', borderRadius: 4 }}>
//             <Text strong>📅 Leave Dates: {Array.from(leaveDates).join(', ')}</Text>
//             <Text strong> Current Week: {DAYS.map(d => d.fullDate).join(', ')}</Text>
//           </div>
//         )}

//         {/* Table */}
//         <Table
//           style={{ marginTop: "10px" }}
//           columns={columns}
//           dataSource={displayRows}
//           pagination={false}
//           bordered
//           rowKey="key"
//           rowClassName={(r) => {
//             if (r.isSummary) return "no-column-border";
//             if (r.isLeave) return "leave-row";
//             return "";
//           }}
//           expandable={{
//             expandedRowKeys: expandedRow ? [expandedRow] : [],
//             expandIcon: () => null,
//             expandedRowRender: (r) =>
//               !r.isSummary && !r.isLeave && (
//                 <Input.TextArea
//                   rows={3}
//                   value={r.description}
//                   onChange={(e) =>
//                     updateRow(r.key, { description: e.target.value })
//                   }
//                 />
//               ),
//           }}
//           summary={() => (
//             <Table.Summary fixed>
//               <Table.Summary.Row>
//                 <Table.Summary.Cell index={0} colSpan={columns.length}>
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "12px 24px",
//                       borderRadius: 6,
//                       fontWeight: 600,
//                       fontSize: 14,
//                       color: "#1f1f1f",
//                     }}
//                   >
//                     <span style={{ color: "#595959" }}>Week Total</span>
//                     <span
//                       style={{
//                         display: "flex",
//                         gap: "30px",
//                         alignItems: "center",
//                         color: "#262626",
//                       }}
//                     >
//                       <span>{totalHours}h / 40h</span>
//                       <span style={{ color: "#1890ff" }}>
//                         {totalBillable} h billable
//                       </span>
//                       {weekLeaveCount > 0 && (
//                         <Tag color="red">{weekLeaveCount} Leave Day(s)</Tag>
//                       )}
//                     </span>
//                   </div>
//                 </Table.Summary.Cell>
//               </Table.Summary.Row>
//             </Table.Summary>
//           )}
//         />

//         {/* Submit Modal */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{ body: { paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 24 } }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {new Set(rows.filter(r => !r.isLeave).map((r) => r.projectName).filter(Boolean)).size})
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[...new Set(rows.filter(r => !r.isLeave).map((r) => r.projectName).filter(Boolean))].map(
//                 (projectName) => (
//                   <Tag
//                     key={projectName}
//                     style={{
//                       borderRadius: 999,
//                       padding: "4px 10px",
//                       background: "#fff",
//                     }}
//                   >
//                     {projectName}
//                   </Tag>
//                 ),
//               )}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }//leave working

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean;
//   leaveType?: string;
// }

// const tableStyles = `
//   .ant-table-wrapper {
//     box-shadow: none !important;
//   }
//   .ant-table {
//     box-shadow: none !important;
//   }
//   .ant-table-container {
//     box-shadow: none !important;
//   }
//   .ant-table-cell {
//     box-shadow: none !important;
//   }
//   .ant-table-row {
//     box-shadow: none !important;
//   }
//   .leave-row {
//     background-color: #fff2f0 !important;
//   }
//   .leave-row:hover {
//     background-color: #ffccc7 !important;
//   }
// `;

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<Map<string, { type: string, status: string }>>(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<string, { type: string, status: string }>();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           // 2. Status is approved or cancelled (based on your requirement)
//           if (allowedLeaveTypes.includes(leaveType)) {

//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(`📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`);

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
//               const dateStr = currentDate.format('YYYY-MM-DD');
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, 'day');
//             }
//           } else {
//             console.log(`❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`);
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//       // After fetching leaves, refresh the rows for the current week
//       refreshRowsForCurrentWeek();

//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Function to refresh rows for the current week based on leave dates
//   const refreshRowsForCurrentWeek = () => {
//     if (!id && !sheet) {
//       // We're in create mode, just create empty rows with leave info
//       setRows(createEmptyRows());
//     } else if (id && sheet) {
//       // We're in edit mode, we need to preserve existing entries but update leave status
//       setRows((prevRows) =>
//         prevRows.map((row) => {
//           const isLeave = isDateLeave(row.date);
//           const leaveInfo = getLeaveInfo(row.date);

//           if (isLeave && !row.isLeave) {
//             // This row should be marked as leave
//             return {
//               ...row,
//               isLeave: true,
//               leaveType: leaveInfo?.type,
//               description: `On leave (${leaveInfo?.type || "Leave"})`,
//               hours: 0,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//             };
//           }
//           return row;
//         })
//       );
//     }
//   };

//   // Fetch leaves when component mounts and when user changes
//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // When date changes, refresh the rows to show leaves for the new week
//   useEffect(() => {
//     if (user?.id) {
//       console.log("📅 Date changed to:", currentDate.format("MMMM YYYY"), "Week:", currentDate.startOf("week").format("YYYY-MM-DD"), "to", currentDate.endOf("week").format("YYYY-MM-DD"));

//       // Refresh rows for the new week
//       if (!id && !sheet) {
//         // Create mode - create new empty rows
//         setRows(createEmptyRows());
//       } else {
//         // Edit mode - update existing rows with leave status
//         refreshRowsForCurrentWeek();
//       }
//     }
//   }, [currentDate, user?.id, leaveDates]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (date: string): { type: string, status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find(t => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName.split(',').map(name => name.trim());

//               taskNameList.forEach(name => {
//                 const matchedTasks = tasks.filter(
//                   t => t.projectId === projectId && t.name === name
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map(t => t.id));
//                   taskNames.push(...matchedTasks.map(t => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(',').map(name => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);
//           const dateStr = rowDate.format("YYYY-MM-DD");

//           // Check if this date is a leave
//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : r.description,
//             hours: isLeave ? 0 : r.hours,
//             billable: isLeave ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName: projects.find((p) => p.id === projectId)?.name || r.projectName || "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user]);

//   // Update rows when leaveDates change (for existing sheets)
//   useEffect(() => {
//     if (id && sheet && leaveDates.size > 0) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map(id => tasks.find((t) => t.id === id))
//             .filter(Boolean) as { id: string; name: string; projectId: string }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map(t => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])]
//       }
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key && !row.isLeave // Don't clear leave rows
//           ? {
//               ...row,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label && !r.isSummary);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));

//       // Add summary row
//       result.push({
//         key: `${d.label}-summary-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         taskIds: [],
//         taskNames: [],
//       });
//     });
//     return result;
//   }, [rows, DAYS, sheet, user]);

//   const totalHours = rows.filter(r => !r.isLeave).reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows.filter(r => !r.isLeave).reduce(
//     (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
//     0,
//   );
//   const expectedHours = 40;

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   // UPDATED COLUMNS - With leave date checking
//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         // Check if this is a leave day
//         const isLeave = r.isLeave;

//         return (
//           <Space>
//             {/* Show LEAVE tag on leave days */}
//             {isLeave && !r.isSummary && (
//               <Tag color="red" style={{ marginRight: 4, fontWeight: 'bold' }}>
//                 LEAVE
//               </Tag>
//             )}

//             {r.isSummary ? (
//               <Text type="secondary">{r.date}</Text>
//             ) : (
//               <Text strong style={{ color: isLeave ? '#ff4d4f' : 'inherit' }}>
//                 {r.day}
//               </Text>
//             )}

//             {/* Weekend checkbox - only show on non-leave days */}
//             {isWeekend(r.day) && !r.isSummary && !isLeave && (
//               <Checkbox
//                 checked={isFieldEditable(r)}
//                 onChange={(e) =>
//                   setWeekendEditable((prev) => ({
//                     ...prev,
//                     [r.key]: e.target.checked,
//                   }))
//                 }
//               />
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//             disabled={isLeave} // Disable "Add entry" on leave days
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               bordered={false}
//               value={r.projectId}
//               placeholder={isLeave ? "Leave day" : "Project"}
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);
//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskIds: [],
//                   taskNames: [],
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "TASKS",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Tooltip
//             title={
//               isLeave ? "You are on leave - cannot edit" :
//               isWeekend(r.day) && !isFieldEditable(r)
//                 ? "Weekend editing is disabled. Click checkbox to enable."
//                 : ""
//             }
//           >
//             <Select
//               mode="multiple"
//               allowClear
//               bordered={false}
//               value={r.taskIds}
//               placeholder={isLeave ? "Leave day" : "Select tasks"}
//               style={{ width: 250 }}
//               disabled={!r.projectId || isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               options={getAvailableTasks(r.projectId).map((t) => ({
//                 value: t.id,
//                 label: t.name,
//               }))}
//               onChange={(taskIds: string[]) => {
//                 const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
//                 updateRow(r.key, {
//                   taskIds,
//                   taskNames: selectedTasks.map(t => t.name),
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() => !isLeave && setExpandedRow(expandedRow === r.key ? null : r.key)}
//             style={{
//               cursor: isLeave ? 'not-allowed' : 'pointer',
//               color: isLeave ? '#999' : 'inherit'
//             }}
//           >
//             {isLeave ? 'On Leave' : (r.description || "Description")}{" "}
//             {!isLeave && <span>{expandedRow === r.key ? "▲" : "▼"}</span>}
//           </div>
//         );
//       },
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>
//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             disabled={isLeave} // Disable on leave
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               if (!isLeave) {
//                 updateRow(r.key, {
//                   hours: value ?? 0,
//                 });
//               }
//             }}
//           />
//         );
//       },
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//             checked={r.billable}
//             onChange={(v) => !isLeave && updateRow(r.key, { billable: v })}
//           />
//         );
//       },
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'green',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: isLeave ? '#ccc' : 'blue',
//                 cursor: (isFieldEditable(r) && !isLeave) ? "pointer" : "not-allowed",
//                 opacity: (isFieldEditable(r) && !isLeave) ? 1 : 0.5,
//               }}
//               onClick={() => (isFieldEditable(r) && !isLeave) && handleDeleteRow(r.key)}
//             />
//           </Space>
//         );
//       },
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   // ✅ UPDATED: handleSubmitTimesheet with leaveCount
//   const handleSubmitTimesheet = async () => {
//     console.log("SUBMIT BUTTON CLICKED");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       // ✅ Calculate leave count for this timesheet
//       const leaveCount = rows.filter(r => r.isLeave && !r.isSummary).length;

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       console.log("rowpayload", rowsForPayload);
//       console.log("leaveCount", leaveCount);

//       let timesheetId: string;
//       if (existing) {
//         await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//             totalHours,
//             totalBillable,
//             // ✅ Send leave count
//             leaveCount,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         const newTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//           totalHours,
//           totalBillable,
//           // ✅ Send leave count
//           leaveCount,
//         });
//         timesheetId = newTimesheet.id;
//       }

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//       } catch (submitError) {
//         console.warn(
//           "Submit API threw error, but backend already submitted",
//           submitError,
//         );
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();

//     } catch (err) {
//       console.error("Unexpected submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   // ✅ UPDATED: handleSaveChanges with leaveCount
//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       // ✅ Calculate leave count for this timesheet
//       const leaveCount = rows.filter(r => r.isLeave && !r.isSummary).length;

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter(r => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectId: r.projectId,
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable || false,
//           ...(r.projectName && { projectName: r.projectName }),
//           ...(r.taskNames && { taskName: r.taskNames.join(', ') }),
//         }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//         // ✅ Send leave count
//         leaveCount,
//       };

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   // Calculate leave count for the current week
//   const weekLeaveCount = useMemo(() => {
//     return rows.filter(r => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   return (
//     <>
//       <style>{tableStyles}</style>
//       <div style={{ padding: 22 }}>
//         {/* Header */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.subtract(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.add(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
//             <Space>
//               <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
//               <Text strong style={{ color: '#ff4d4f' }}>Leave Alert:</Text>
//               <Text>You have {weekLeaveCount} leave day(s) this week. Those days are disabled for timesheet entry.</Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {process.env.NODE_ENV === 'development' && leaveDates.size > 0 && (
//           <div style={{ marginBottom: 16, padding: 8, background: '#f0f5ff', borderRadius: 4 }}>
//             <Text strong>📅 Leave Dates: {Array.from(leaveDates).join(', ')}</Text>
//             <Text strong> Current Week: {DAYS.map(d => d.fullDate).join(', ')}</Text>
//           </div>
//         )}

//         {/* Table */}
//         <Table
//           style={{ marginTop: "10px" }}
//           columns={columns}
//           dataSource={displayRows}
//           pagination={false}
//           bordered
//           rowKey="key"
//           rowClassName={(r) => {
//             if (r.isSummary) return "no-column-border";
//             if (r.isLeave) return "leave-row";
//             return "";
//           }}
//           expandable={{
//             expandedRowKeys: expandedRow ? [expandedRow] : [],
//             expandIcon: () => null,
//             expandedRowRender: (r) =>
//               !r.isSummary && !r.isLeave && (
//                 <Input.TextArea
//                   rows={3}
//                   value={r.description}
//                   onChange={(e) =>
//                     updateRow(r.key, { description: e.target.value })
//                   }
//                 />
//               ),
//           }}
//           summary={() => (
//             <Table.Summary fixed>
//               <Table.Summary.Row>
//                 <Table.Summary.Cell index={0} colSpan={columns.length}>
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "12px 24px",
//                       borderRadius: 6,
//                       fontWeight: 600,
//                       fontSize: 14,
//                       color: "#1f1f1f",
//                     }}
//                   >
//                     <span style={{ color: "#595959" }}>Week Total</span>
//                     <span
//                       style={{
//                         display: "flex",
//                         gap: "30px",
//                         alignItems: "center",
//                         color: "#262626",
//                       }}
//                     >
//                       <span>{totalHours}h / 40h</span>
//                       <span style={{ color: "#1890ff" }}>
//                         {totalBillable} h billable
//                       </span>
//                       {weekLeaveCount > 0 && (
//                         <Tag color="red">{weekLeaveCount} Leave Day(s)</Tag>
//                       )}
//                     </span>
//                   </div>
//                 </Table.Summary.Cell>
//               </Table.Summary.Row>
//             </Table.Summary>
//           )}
//         />

//         {/* Submit Modal */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{ body: { paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 24 } }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {new Set(rows.filter(r => !r.isLeave).map((r) => r.projectName).filter(Boolean)).size})
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[...new Set(rows.filter(r => !r.isLeave).map((r) => r.projectName).filter(Boolean))].map(
//                 (projectName) => (
//                   <Tag
//                     key={projectName}
//                     style={{
//                       borderRadius: 999,
//                       padding: "4px 10px",
//                       background: "#fff",
//                     }}
//                   >
//                     {projectName}
//                   </Tag>
//                 ),
//               )}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }leave database la work agala

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean;
//   leaveType?: string;
// }

// const tableStyles = `
//   .ant-table-wrapper {
//     box-shadow: none !important;
//   }
//   .ant-table {
//     box-shadow: none !important;
//   }
//   .ant-table-container {
//     box-shadow: none !important;
//   }
//   .ant-table-cell {
//     box-shadow: none !important;
//   }
//   .ant-table-row {
//     box-shadow: none !important;
//   }
//   .leave-row {
//     background-color: #fff2f0 !important;
//   }
//   .leave-row:hover {
//     background-color: #ffccc7 !important;
//   }
// `;

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<
//     Map<string, { type: string; status: string }>
//   >(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<
//         string,
//         { type: string; status: string }
//       >();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           if (allowedLeaveTypes.includes(leaveType)) {
//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(
//               `📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`,
//             );

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (
//               currentDate.isBefore(endDate) ||
//               currentDate.isSame(endDate, "day")
//             ) {
//               const dateStr = currentDate.format("YYYY-MM-DD");
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status,
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, "day");
//             }
//           } else {
//             console.log(
//               `❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`,
//             );
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//       // After fetching leaves, refresh the rows for the current week
//       refreshRowsForCurrentWeek();
//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Function to refresh rows for the current week based on leave dates
//   const refreshRowsForCurrentWeek = () => {
//     if (!id && !sheet) {
//       // We're in create mode, just create empty rows with leave info
//       setRows(createEmptyRows());
//     } else if (id && sheet) {
//       // We're in edit mode, we need to preserve existing entries but update leave status
//       setRows((prevRows) =>
//         prevRows.map((row) => {
//           const isLeave = isDateLeave(row.date);
//           const leaveInfo = getLeaveInfo(row.date);

//           if (isLeave && !row.isLeave) {
//             // This row should be marked as leave
//             return {
//               ...row,
//               isLeave: true,
//               leaveType: leaveInfo?.type,
//               description: `On leave (${leaveInfo?.type || "Leave"})`,
//               hours: 0,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//             };
//           }
//           return row;
//         }),
//       );
//     }
//   };

//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // When date changes, refresh the rows to show leaves for the new week
//   useEffect(() => {
//     if (user?.id) {
//       console.log(
//         "📅 Date changed to:",
//         currentDate.format("MMMM YYYY"),
//         "Week:",
//         currentDate.startOf("week").format("YYYY-MM-DD"),
//         "to",
//         currentDate.endOf("week").format("YYYY-MM-DD"),
//       );

//       // Refresh rows for the new week
//       if (!id && !sheet) {
//         // Create mode - create new empty rows
//         setRows(createEmptyRows());
//       } else {
//         // Edit mode - update existing rows with leave status
//         refreshRowsForCurrentWeek();
//       }
//     }
//   }, [currentDate, user?.id, leaveDates]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (
//     date: string,
//   ): { type: string; status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find((t) => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName
//                 .split(",")
//                 .map((name) => name.trim());

//               taskNameList.forEach((name) => {
//                 const matchedTasks = tasks.filter(
//                   (t) => t.projectId === projectId && t.name === name,
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map((t) => t.id));
//                   taskNames.push(...matchedTasks.map((t) => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(",").map((name) => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);
//           const dateStr = rowDate.format("YYYY-MM-DD");

//           // Check if this date is a leave
//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave
//               ? `On leave (${leaveInfo?.type || "Leave"})`
//               : r.description,
//             hours: isLeave ? 0 : r.hours,
//             billable: isLeave ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName:
//               projects.find((p) => p.id === projectId)?.name ||
//               r.projectName ||
//               "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user]);

//   useEffect(() => {
//     console.log("📊 Data loading status:", {
//       id,
//       hasSheet: !!sheet,
//       leaveDatesSize: leaveDates.size,
//       rowsLength: rows.length,
//       mode,
//     });
//   }, [id, sheet, leaveDates, rows.length, mode]);

//   // Update rows when leaveDates change (for existing sheets)
//   useEffect(() => {
//     if (id && sheet && leaveDates.size > 0) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates, id, sheet]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map((id) => tasks.find((t) => t.id === id))
//             .filter(Boolean) as {
//             id: string;
//             name: string;
//             projectId: string;
//           }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map((t) => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])],
//       },
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.map((row) =>
//         row.key === key && !row.isLeave // Don't clear leave rows
//           ? {
//               ...row,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               description: "",
//               hours: 0,
//               billable: false,
//             }
//           : row,
//       ),
//     );
//   };

//   const displayRows = useMemo(() => {
//     const result: TimesheetRowUI[] = [];
//     DAYS.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label && !r.isSummary);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
//       dayRows.forEach((r) => result.push(r));

//       // Add summary row
//       result.push({
//         key: `${d.label}-summary-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         taskIds: [],
//         taskNames: [],
//       });
//     });
//     return result;
//   }, [rows, DAYS, sheet, user]);

//   const totalHours = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.billable ? r.hours || 0 : 0), 0);
//   const expectedHours = 40;

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   // UPDATED COLUMNS - With leave date checking
//   const columns: ColumnsType<TimesheetRowUI> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         // Check if this is a leave day
//         const isLeave = r.isLeave;

//         return (
//           <Space>
//             {/* Show LEAVE tag on leave days */}
//             {isLeave && !r.isSummary && (
//               <Tag color="red" style={{ marginRight: 4, fontWeight: "bold" }}>
//                 LEAVE
//               </Tag>
//             )}

//             {r.isSummary ? (
//               <Text type="secondary">{r.date}</Text>
//             ) : (
//               <Text strong style={{ color: isLeave ? "#ff4d4f" : "inherit" }}>
//                 {r.day}
//               </Text>
//             )}

//             {/* Weekend checkbox - only show on non-leave days */}
//             {isWeekend(r.day) && !r.isSummary && !isLeave && (
//               <Checkbox
//                 checked={isFieldEditable(r)}
//                 onChange={(e) =>
//                   setWeekendEditable((prev) => ({
//                     ...prev,
//                     [r.key]: e.target.checked,
//                   }))
//                 }
//               />
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "PROJECT",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Button
//             type="link"
//             icon={<PlusOutlined />}
//             onClick={() => addEntry(r.day, r.date)}
//             disabled={isLeave} // Disable "Add entry" on leave days
//           >
//             Add entry
//           </Button>
//         ) : (
//           <Tooltip
//             title={
//               isLeave
//                 ? "You are on leave - cannot edit"
//                 : isWeekend(r.day) && !isFieldEditable(r)
//                   ? "Weekend editing is disabled. Click checkbox to enable."
//                   : ""
//             }
//           >
//             <Select
//               disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//               bordered={false}
//               value={r.projectId}
//               placeholder={isLeave ? "Leave day" : "Project"}
//               style={{ width: 200 }}
//               options={projects.map((p) => ({
//                 value: p.id,
//                 label: p.name,
//               }))}
//               onChange={(projectId) => {
//                 const selected = projects.find((p) => p.id === projectId);
//                 updateRow(r.key, {
//                   projectId,
//                   projectName: selected?.name,
//                   taskIds: [],
//                   taskNames: [],
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "TASKS",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Tooltip
//             title={
//               isLeave
//                 ? "You are on leave - cannot edit"
//                 : isWeekend(r.day) && !isFieldEditable(r)
//                   ? "Weekend editing is disabled. Click checkbox to enable."
//                   : ""
//             }
//           >
//             <Select
//               mode="multiple"
//               allowClear
//               bordered={false}
//               value={r.taskIds}
//               placeholder={isLeave ? "Leave day" : "Select tasks"}
//               style={{ width: 250 }}
//               disabled={
//                 !r.projectId || isViewMode || !isFieldEditable(r) || isLeave
//               } // Disable on leave
//               options={getAvailableTasks(r.projectId).map((t) => ({
//                 value: t.id,
//                 label: t.name,
//               }))}
//               onChange={(taskIds: string[]) => {
//                 const selectedTasks = tasks.filter((t) =>
//                   taskIds.includes(t.id),
//                 );
//                 updateRow(r.key, {
//                   taskIds,
//                   taskNames: selectedTasks.map((t) => t.name),
//                 });
//               }}
//             />
//           </Tooltip>
//         );
//       },
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <Text strong>Total</Text>
//         ) : (
//           <div
//             onClick={() =>
//               !isLeave && setExpandedRow(expandedRow === r.key ? null : r.key)
//             }
//             style={{
//               cursor: isLeave ? "not-allowed" : "pointer",
//               color: isLeave ? "#999" : "inherit",
//             }}
//           >
//             {isLeave ? "On Leave" : r.description || "Description"}{" "}
//             {!isLeave && <span>{expandedRow === r.key ? "▲" : "▼"}</span>}
//           </div>
//         );
//       },
//     },
//     {
//       title: "HOURS",
//       width: 120,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               width: "100%",
//             }}
//           >
//             <Text strong style={{ whiteSpace: "nowrap" }}>
//               {r.hours ?? 0}h / 8h
//             </Text>
//             <Progress
//               percent={Math.min(100, ((r.hours ?? 0) / 8) * 100)}
//               showInfo={false}
//               size="small"
//               style={{ flex: 1, minWidth: 80 }}
//             />
//           </div>
//         ) : (
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={r.hours}
//             disabled={isLeave} // Disable on leave
//             controls
//             onKeyDown={(e) => {
//               const allowedKeys = [
//                 "Backspace",
//                 "Delete",
//                 "ArrowLeft",
//                 "ArrowRight",
//                 "Tab",
//               ];
//               if (allowedKeys.includes(e.key)) return;
//               if (!/[\d.]/.test(e.key)) {
//                 e.preventDefault();
//               }
//             }}
//             onChange={(value) => {
//               if (!isLeave) {
//                 updateRow(r.key, {
//                   hours: value ?? 0,
//                 });
//               }
//             }}
//           />
//         );
//       },
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Switch
//             disabled={isViewMode || !isFieldEditable(r) || isLeave} // Disable on leave
//             checked={r.billable}
//             onChange={(v) => !isLeave && updateRow(r.key, { billable: v })}
//           />
//         );
//       },
//     },
//     !isViewMode && {
//       title: "ACTIONS",
//       width: 150,
//       render: (_: any, r: TimesheetRowUI) => {
//         const isLeave = r.isLeave;

//         return r.isSummary ? null : (
//           <Space style={{ display: "flex", gap: "10px" }}>
//             <SnippetsOutlined
//               style={{
//                 color: isLeave ? "#ccc" : "green",
//                 cursor:
//                   isFieldEditable(r) && !isLeave ? "pointer" : "not-allowed",
//                 opacity: isFieldEditable(r) && !isLeave ? 1 : 0.5,
//               }}
//               onClick={() => isFieldEditable(r) && !isLeave && handleCopyRow(r)}
//             />
//             <UndoOutlined
//               style={{
//                 color: isLeave ? "#ccc" : "blue",
//                 cursor:
//                   isFieldEditable(r) && !isLeave ? "pointer" : "not-allowed",
//                 opacity: isFieldEditable(r) && !isLeave ? 1 : 0.5,
//               }}
//               onClick={() =>
//                 isFieldEditable(r) && !isLeave && handleDeleteRow(r.key)
//               }
//             />
//           </Space>
//         );
//       },
//     },
//   ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isLeave)
//         .map((r) => ({
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName:
//             r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   // ✅ UPDATED: handleSubmitTimesheet with leaveCount and debugging
//   // const handleSubmitTimesheet = async () => {
//   //   console.log("SUBMIT BUTTON CLICKED");
//   //   isSubmittingRef.current = true;

//   //   try {
//   //     setSubmitLoading(true);

//   //     const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//   //     const existing = allTimesheets?.data?.find(
//   //       (t: Timesheet) =>
//   //         t.user?.id === sheet?.user?.id &&
//   //         dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//   //     );

//   //     if (existing && existing.status === "SUBMITTED") {
//   //       message.warning("This timesheet is already submitted");
//   //       return;
//   //     }

//   //     // ✅ Debug: Log all rows to see which ones are marked as leave
//   //     console.log("📊 ALL ROWS BEFORE SUBMIT:", rows.map(r => ({
//   //       date: r.date,
//   //       isLeave: r.isLeave,
//   //       leaveType: r.leaveType,
//   //       isSummary: r.isSummary
//   //     })));

//   //     // ✅ Calculate leave count for this timesheet
//   //     const leaveRows = rows.filter(r => r.isLeave && !r.isSummary);
//   //     const leaveCount = leaveRows.length;

//   //     console.log("📊 LEAVE ROWS FOUND:", leaveRows.map(r => ({
//   //       date: r.date,
//   //       leaveType: r.leaveType
//   //     })));
//   //     console.log("📊 LEAVE COUNT:", leaveCount);

//   //     // Filter out leave rows from payload
//   //     const rowsForPayload = rows
//   //       .filter(r => !r.isLeave)
//   //       .map((r) => ({
//   //         id: r.id,
//   //         day: new Date(`${r.date}T00:00:00Z`),
//   //         projectId: r.projectId,
//   //         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//   //         projectName: r.projectName || "",
//   //         taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//   //         description: r.description || "",
//   //         hours: r.hours || 0,
//   //         billable: r.billable ?? true,
//   //       }));

//   //     console.log("rowpayload", rowsForPayload);
//   //     console.log("leaveCount being sent:", leaveCount);

//   //     let timesheetId: string;
//   //     if (existing) {
//   //       await updateMutation.mutateAsync({
//   //         id: existing.id,
//   //         data: {
//   //           weekStart: currentDate.startOf("week").toDate(),
//   //           weekEnd: currentDate.endOf("week").toDate(),
//   //           rows: rowsForPayload,
//   //           totalHours,
//   //           totalBillable,
//   //           // ✅ Send leave count
//   //           leaveCount,
//   //         },
//   //       });
//   //       timesheetId = existing.id;
//   //     } else {
//   //       const newTimesheet = await createMutation.mutateAsync({
//   //         weekStart: currentDate.startOf("week").toDate(),
//   //         weekEnd: currentDate.endOf("week").toDate(),
//   //         rows: rowsForPayload,
//   //         totalHours,
//   //         totalBillable,
//   //         // ✅ Send leave count
//   //         leaveCount,
//   //       });
//   //       timesheetId = newTimesheet.id;
//   //     }

//   //     if (!timesheetId) throw new Error("Timesheet ID missing");

//   //     try {
//   //       await TimesheetsService.submitTimesheet(timesheetId);
//   //     } catch (submitError) {
//   //       console.warn(
//   //         "Submit API threw error, but backend already submitted",
//   //         submitError,
//   //       );
//   //     }

//   //     setIsSubmittedModalOpen(true);
//   //     setIsSubmitted(true);
//   //     setStatus("Submitted");
//   //     setIsSubmitOpen(false);

//   //     setRows((prev) =>
//   //       prev.map((row) => ({
//   //         ...row,
//   //         status: "Submitted" as const,
//   //       })),
//   //     );

//   //     message.success("Timesheet submitted successfully!");

//   //     await queryClient.invalidateQueries({
//   //       queryKey: ["timesheets"],
//   //     });
//   //     onSubmitted();

//   //   } catch (err) {
//   //     console.error("Unexpected submit failure:", err);
//   //     message.error("This timesheet is already submitted");
//   //   } finally {
//   //     setSubmitLoading(false);
//   //     isSubmittingRef.current = false;
//   //   }
//   // };

//   //   const handleSubmitTimesheet = async () => {
//   //   console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
//   //   console.log("📅 Current Date:", currentDate.format("YYYY-MM-DD"));
//   //   console.log("📅 Week Range:", currentDate.startOf("week").format("YYYY-MM-DD"), "to", currentDate.endOf("week").format("YYYY-MM-DD"));

//   //   isSubmittingRef.current = true;

//   //   try {
//   //     setSubmitLoading(true);

//   //     const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//   //     const existing = allTimesheets?.data?.find(
//   //       (t: Timesheet) =>
//   //         t.user?.id === sheet?.user?.id &&
//   //         dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//   //     );

//   //     console.log("📋 Existing timesheet:", existing ? "Found" : "Not found");

//   //     if (existing && existing.status === "SUBMITTED") {
//   //       message.warning("This timesheet is already submitted");
//   //       return;
//   //     }

//   //     // 🔍 DEBUG: Log all rows
//   //     console.log("📊 ALL ROWS BEFORE FILTER:", rows.map(r => ({
//   //       key: r.key,
//   //       date: r.date,
//   //       day: r.day,
//   //       isLeave: r.isLeave,
//   //       leaveType: r.leaveType,
//   //       isSummary: r.isSummary,
//   //       projectId: r.projectId,
//   //       hours: r.hours
//   //     })));

//   //     // ✅ Calculate leave count
//   //     const leaveRows = rows.filter(r => r.isLeave && !r.isSummary);
//   //     const leaveCount = leaveRows.length;

//   //     console.log("📊 LEAVE ROWS FOUND:", leaveRows.map(r => ({
//   //       date: r.date,
//   //       leaveType: r.leaveType
//   //     })));
//   //     console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);

//   //     // Filter out leave rows from payload
//   //     const rowsForPayload = rows
//   //       .filter(r => !r.isLeave)
//   //       .map((r) => ({
//   //         id: r.id,
//   //         day: new Date(`${r.date}T00:00:00Z`),
//   //         projectId: r.projectId,
//   //         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//   //         projectName: r.projectName || "",
//   //         taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
//   //         description: r.description || "",
//   //         hours: r.hours || 0,
//   //         billable: r.billable ?? true,
//   //       }));

//   //     console.log("📦 ROWS FOR PAYLOAD:", rowsForPayload.map(r => ({
//   //       date: r.day,
//   //       hours: r.hours,
//   //       projectName: r.projectName
//   //     })));
//   //     console.log("📦 PAYLOAD DATA:", {
//   //       weekStart: currentDate.startOf("week").toDate(),
//   //       weekEnd: currentDate.endOf("week").toDate(),
//   //       rowsCount: rowsForPayload.length,
//   //       totalHours,
//   //       totalBillable,
//   //       leaveCount: leaveCount
//   //     });

//   //     let timesheetId: string;
//   //     if (existing) {
//   //       console.log("🔄 Updating existing timesheet:", existing.id);
//   //       await updateMutation.mutateAsync({
//   //         id: existing.id,
//   //         data: {
//   //           weekStart: currentDate.startOf("week").toDate(),
//   //           weekEnd: currentDate.endOf("week").toDate(),
//   //           rows: rowsForPayload,
//   //           totalHours,
//   //           totalBillable,
//   //           leaveCount,
//   //         },
//   //       });
//   //       timesheetId = existing.id;
//   //     } else {
//   //       console.log("🔄 Creating new timesheet");
//   //       const newTimesheet = await createMutation.mutateAsync({
//   //         weekStart: currentDate.startOf("week").toDate(),
//   //         weekEnd: currentDate.endOf("week").toDate(),
//   //         rows: rowsForPayload,
//   //         totalHours,
//   //         totalBillable,
//   //         leaveCount,
//   //       });
//   //       timesheetId = newTimesheet.id;
//   //     }

//   //     console.log("✅ Timesheet saved with ID:", timesheetId);
//   //     console.log("📤 Sending leaveCount to server:", leaveCount);

//   //     if (!timesheetId) throw new Error("Timesheet ID missing");

//   //     try {
//   //       await TimesheetsService.submitTimesheet(timesheetId);
//   //       console.log("✅ Timesheet submitted successfully");
//   //     } catch (submitError) {
//   //       console.warn("⚠️ Submit API error:", submitError);
//   //     }

//   //     setIsSubmittedModalOpen(true);
//   //     setIsSubmitted(true);
//   //     setStatus("Submitted");
//   //     setIsSubmitOpen(false);

//   //     setRows((prev) =>
//   //       prev.map((row) => ({
//   //         ...row,
//   //         status: "Submitted" as const,
//   //       })),
//   //     );

//   //     message.success("Timesheet submitted successfully!");

//   //     await queryClient.invalidateQueries({
//   //       queryKey: ["timesheets"],
//   //     });
//   //     onSubmitted();

//   //     console.log("✅ ===== SUBMIT TIMESHEET COMPLETED =====\n");

//   //   } catch (err) {
//   //     console.error("❌ Submit failure:", err);
//   //     message.error("This timesheet is already submitted");
//   //   } finally {
//   //     setSubmitLoading(false);
//   //     isSubmittingRef.current = false;
//   //   }
//   // };

//   const handleSubmitTimesheet = async () => {
//     console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       // Calculate leave count
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName:
//             r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       let timesheetId: string;
//       let savedTimesheet; // Store the response from create/update

//       if (existing) {
//         console.log("🔄 Updating existing timesheet:", existing.id);
//         savedTimesheet = await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//             totalHours,
//             totalBillable,
//             leaveCount,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         console.log("🔄 Creating new timesheet");
//         savedTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//           totalHours,
//           totalBillable,
//           leaveCount,
//         });
//         timesheetId = savedTimesheet.id;
//       }

//       console.log("✅ Timesheet saved with ID:", timesheetId);
//       console.log("✅ Timesheet data after save:", {
//         id: savedTimesheet.id,
//         leaveCount: savedTimesheet.leaveCount, // This should be 1!
//         status: savedTimesheet.status,
//       });

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//         console.log("✅ Timesheet submitted successfully");
//       } catch (submitError) {
//         console.warn("⚠️ Submit API error:", submitError);
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();
//     } catch (err) {
//       console.error("❌ Submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   // ✅ UPDATED: handleSaveChanges with leaveCount and debugging
//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       // ✅ Debug: Log all rows to see which ones are marked as leave
//       console.log(
//         "📊 ALL ROWS BEFORE SAVE:",
//         rows.map((r) => ({
//           date: r.date,
//           isLeave: r.isLeave,
//           leaveType: r.leaveType,
//           isSummary: r.isSummary,
//         })),
//       );

//       // ✅ Calculate leave count for this timesheet
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log(
//         "📊 LEAVE ROWS FOUND:",
//         leaveRows.map((r) => ({
//           date: r.date,
//           leaveType: r.leaveType,
//         })),
//       );
//       console.log("📊 LEAVE COUNT:", leaveCount);

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectId: r.projectId,
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable || false,
//           ...(r.projectName && { projectName: r.projectName }),
//           ...(r.taskNames && { taskName: r.taskNames.join(", ") }),
//         }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//         // ✅ Send leave count
//         leaveCount,
//       };

//       console.log("updatePayload with leaveCount:", updatePayload);

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   // Calculate leave count for the current week
//   const weekLeaveCount = useMemo(() => {
//     return rows.filter((r) => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   return (
//     <>
//       <style>{tableStyles}</style>
//       <div style={{ padding: 22 }}>
//         {/* Header */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.subtract(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.add(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 12,
//               background: "#fff1f0",
//               border: "1px solid #ffccc7",
//               borderRadius: 8,
//             }}
//           >
//             <Space>
//               <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
//               <Text strong style={{ color: "#ff4d4f" }}>
//                 Leave Alert:
//               </Text>
//               <Text>
//                 You have {weekLeaveCount} leave day(s) this week. Those days are
//                 disabled for timesheet entry.
//               </Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {process.env.NODE_ENV === "development" && leaveDates.size > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 8,
//               background: "#f0f5ff",
//               borderRadius: 4,
//             }}
//           >
//             <Text strong>
//               📅 Leave Dates: {Array.from(leaveDates).join(", ")}
//             </Text>
//             <Text strong>
//               {" "}
//               Current Week: {DAYS.map((d) => d.fullDate).join(", ")}
//             </Text>
//           </div>
//         )}

//         {/* Table */}
//         <Table
//           style={{ marginTop: "10px" }}
//           columns={columns}
//           dataSource={displayRows}
//           pagination={false}
//           bordered
//           rowKey="key"
//           rowClassName={(r) => {
//             if (r.isSummary) return "no-column-border";
//             if (r.isLeave) return "leave-row";
//             return "";
//           }}
//           expandable={{
//             expandedRowKeys: expandedRow ? [expandedRow] : [],
//             expandIcon: () => null,
//             expandedRowRender: (r) =>
//               !r.isSummary &&
//               !r.isLeave && (
//                 <Input.TextArea
//                   rows={3}
//                   value={r.description}
//                   onChange={(e) =>
//                     updateRow(r.key, { description: e.target.value })
//                   }
//                 />
//               ),
//           }}
//           summary={() => (
//             <Table.Summary fixed>
//               <Table.Summary.Row>
//                 <Table.Summary.Cell index={0} colSpan={columns.length}>
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "12px 24px",
//                       borderRadius: 6,
//                       fontWeight: 600,
//                       fontSize: 14,
//                       color: "#1f1f1f",
//                     }}
//                   >
//                     <span style={{ color: "#595959" }}>Week Total</span>
//                     <span
//                       style={{
//                         display: "flex",
//                         gap: "30px",
//                         alignItems: "center",
//                         color: "#262626",
//                       }}
//                     >
//                       <span>{totalHours}h / 40h</span>
//                       <span style={{ color: "#1890ff" }}>
//                         {totalBillable} h billable
//                       </span>
//                       {weekLeaveCount > 0 && (
//                         <Tag color="red">{weekLeaveCount} Leave Day(s)</Tag>
//                       )}
//                     </span>
//                   </div>
//                 </Table.Summary.Cell>
//               </Table.Summary.Row>
//             </Table.Summary>
//           )}
//         />

//         {/* Submit Modal */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{
//             body: {
//               paddingLeft: 16,
//               paddingRight: 16,
//               paddingTop: 24,
//               paddingBottom: 24,
//             },
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {
//                 new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ).size
//               }
//               )
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[
//                 ...new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ),
//               ].map((projectName) => (
//                 <Tag
//                   key={projectName}
//                   style={{
//                     borderRadius: 999,
//                     padding: "4px 10px",
//                     background: "#fff",
//                   }}
//                 >
//                   {projectName}
//                 </Tag>
//               ))}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are
//                 automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }working leave

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
//   Card,
//   Collapse,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// const { Panel } = Collapse;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean;
//   leaveType?: string;
// }

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<
//     Map<string, { type: string; status: string }>
//   >(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<
//         string,
//         { type: string; status: string }
//       >();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           if (allowedLeaveTypes.includes(leaveType)) {
//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(
//               `📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`,
//             );

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (
//               currentDate.isBefore(endDate) ||
//               currentDate.isSame(endDate, "day")
//             ) {
//               const dateStr = currentDate.format("YYYY-MM-DD");
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status,
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, "day");
//             }
//           } else {
//             console.log(
//               `❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`,
//             );
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//       // After fetching leaves, refresh the rows for the current week
//       refreshRowsForCurrentWeek();
//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Function to refresh rows for the current week based on leave dates
//   const refreshRowsForCurrentWeek = () => {
//     if (!id && !sheet) {
//       // We're in create mode, just create empty rows with leave info
//       setRows(createEmptyRows());
//     } else if (id && sheet) {
//       // We're in edit mode, we need to preserve existing entries but update leave status
//       setRows((prevRows) =>
//         prevRows.map((row) => {
//           const isLeave = isDateLeave(row.date);
//           const leaveInfo = getLeaveInfo(row.date);

//           if (isLeave && !row.isLeave) {
//             // This row should be marked as leave
//             return {
//               ...row,
//               isLeave: true,
//               leaveType: leaveInfo?.type,
//               description: `On leave (${leaveInfo?.type || "Leave"})`,
//               hours: 0,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//             };
//           }
//           return row;
//         }),
//       );
//     }
//   };

//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();

//       // Set today's day as expanded by default
//       const today = dayjs().format("ddd");
//       setExpandedDays(new Set([today]));
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // When date changes, refresh the rows to show leaves for the new week
//   useEffect(() => {
//     if (user?.id) {
//       console.log(
//         "📅 Date changed to:",
//         currentDate.format("MMMM YYYY"),
//         "Week:",
//         currentDate.startOf("week").format("YYYY-MM-DD"),
//         "to",
//         currentDate.endOf("week").format("YYYY-MM-DD"),
//       );

//       // Refresh rows for the new week
//       if (!id && !sheet) {
//         // Create mode - create new empty rows
//         setRows(createEmptyRows());
//       } else {
//         // Edit mode - update existing rows with leave status
//         refreshRowsForCurrentWeek();
//       }
//     }
//   }, [currentDate, user?.id, leaveDates]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (
//     date: string,
//   ): { type: string; status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//         dayNumber: d.format("D"),
//         year: d.format("YYYY"),
//         fullDateObj: d,
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find((t) => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName
//                 .split(",")
//                 .map((name) => name.trim());

//               taskNameList.forEach((name) => {
//                 const matchedTasks = tasks.filter(
//                   (t) => t.projectId === projectId && t.name === name,
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map((t) => t.id));
//                   taskNames.push(...matchedTasks.map((t) => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(",").map((name) => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);
//           const dateStr = rowDate.format("YYYY-MM-DD");

//           // Check if this date is a leave
//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave
//               ? `On leave (${leaveInfo?.type || "Leave"})`
//               : r.description,
//             hours: isLeave ? 0 : r.hours,
//             billable: isLeave ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName:
//               projects.find((p) => p.id === projectId)?.name ||
//               r.projectName ||
//               "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//           };
//         },
//       );
//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));
//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user]);

//   useEffect(() => {
//     console.log("📊 Data loading status:", {
//       id,
//       hasSheet: !!sheet,
//       leaveDatesSize: leaveDates.size,
//       rowsLength: rows.length,
//       mode,
//     });
//   }, [id, sheet, leaveDates, rows.length, mode]);

//   // Update rows when leaveDates change (for existing sheets)
//   useEffect(() => {
//     if (id && sheet && leaveDates.size > 0) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates, id, sheet]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map((id) => tasks.find((t) => t.id === id))
//             .filter(Boolean) as {
//             id: string;
//             name: string;
//             projectId: string;
//           }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map((t) => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         key: `${day}-${Date.now()}-${Math.random()}`,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);

//     // Auto-expand the day when adding an entry
//     setExpandedDays(prev => new Set([...prev, day]));
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])],
//       },
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.filter((row) => row.key !== key)
//     );
//   };

//   const getDayRows = (dayLabel: string) => {
//     return rows.filter((r) => r.day === dayLabel && !r.isSummary);
//   };

//   const getDayTotal = (dayLabel: string) => {
//     const dayRows = rows.filter((r) => r.day === dayLabel && !r.isSummary);
//     return dayRows.reduce((sum, r) => sum + (r.hours || 0), 0);
//   };

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   const toggleDayExpand = (day: string) => {
//     setExpandedDays(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(day)) {
//         newSet.delete(day);
//       } else {
//         newSet.add(day);
//       }
//       return newSet;
//     });
//   };

//   const totalHours = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.billable ? r.hours || 0 : 0), 0);
//   const expectedHours = 40;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isLeave)
//         .map((r) => ({
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName:
//             r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//       };

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       // Calculate leave count
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           projectId: r.projectId,
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectName: r.projectName || "",
//           taskName:
//             r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable ?? true,
//         }));

//       let timesheetId: string;
//       let savedTimesheet; // Store the response from create/update

//       if (existing) {
//         console.log("🔄 Updating existing timesheet:", existing.id);
//         savedTimesheet = await updateMutation.mutateAsync({
//           id: existing.id,
//           data: {
//             weekStart: currentDate.startOf("week").toDate(),
//             weekEnd: currentDate.endOf("week").toDate(),
//             rows: rowsForPayload,
//             totalHours,
//             totalBillable,
//             leaveCount,
//           },
//         });
//         timesheetId = existing.id;
//       } else {
//         console.log("🔄 Creating new timesheet");
//         savedTimesheet = await createMutation.mutateAsync({
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//           totalHours,
//           totalBillable,
//           leaveCount,
//         });
//         timesheetId = savedTimesheet.id;
//       }

//       console.log("✅ Timesheet saved with ID:", timesheetId);
//       console.log("✅ Timesheet data after save:", {
//         id: savedTimesheet.id,
//         leaveCount: savedTimesheet.leaveCount, // This should be 1!
//         status: savedTimesheet.status,
//       });

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//         console.log("✅ Timesheet submitted successfully");
//       } catch (submitError) {
//         console.warn("⚠️ Submit API error:", submitError);
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();
//     } catch (err) {
//       console.error("❌ Submit failure:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   // ✅ UPDATED: handleSaveChanges with leaveCount and debugging
//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       // ✅ Debug: Log all rows to see which ones are marked as leave
//       console.log(
//         "📊 ALL ROWS BEFORE SAVE:",
//         rows.map((r) => ({
//           date: r.date,
//           isLeave: r.isLeave,
//           leaveType: r.leaveType,
//           isSummary: r.isSummary,
//         })),
//       );

//       // ✅ Calculate leave count for this timesheet
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log(
//         "📊 LEAVE ROWS FOUND:",
//         leaveRows.map((r) => ({
//           date: r.date,
//           leaveType: r.leaveType,
//         })),
//       );
//       console.log("📊 LEAVE COUNT:", leaveCount);

//       // Filter out leave rows from payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isLeave)
//         .map((r) => ({
//           id: r.id,
//           day: new Date(`${r.date}T00:00:00Z`),
//           taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//           projectId: r.projectId,
//           description: r.description || "",
//           hours: r.hours || 0,
//           billable: r.billable || false,
//           ...(r.projectName && { projectName: r.projectName }),
//           ...(r.taskNames && { taskName: r.taskNames.join(", ") }),
//         }));

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//         // ✅ Send leave count
//         leaveCount,
//       };

//       console.log("updatePayload with leaveCount:", updatePayload);

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   // Calculate leave count for the current week
//   const weekLeaveCount = useMemo(() => {
//     return rows.filter((r) => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   // Render entry row for a day
//   const renderEntryRow = (row: TimesheetRowUI) => {
//     const isLeave = row.isLeave;

//     return (
//       <div
//         key={row.key}
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "12px",
//           padding: "12px",
//           backgroundColor: isLeave ? "#fff2f0" : "#fafafa",
//           borderRadius: "8px",
//           marginBottom: "8px",
//           border: isLeave ? "1px solid #ffccc7" : "1px solid #f0f0f0",
//         }}
//       >
//         {isLeave && (
//           <Tag color="red" style={{ marginRight: 4, fontWeight: "bold" }}>
//             LEAVE
//           </Tag>
//         )}

//         <Select
//           disabled={isViewMode || !isFieldEditable(row) || isLeave}
//           bordered={false}
//           value={row.projectId}
//           placeholder={isLeave ? "Leave day" : "Project"}
//           style={{ width: 180 }}
//           options={projects.map((p) => ({
//             value: p.id,
//             label: p.name,
//           }))}
//           onChange={(projectId) => {
//             const selected = projects.find((p) => p.id === projectId);
//             updateRow(row.key, {
//               projectId,
//               projectName: selected?.name,
//               taskIds: [],
//               taskNames: [],
//             });
//           }}
//         />

//         <Select
//           mode="multiple"
//           allowClear
//           bordered={false}
//           value={row.taskIds}
//           placeholder={isLeave ? "Leave day" : "Select tasks"}
//           style={{ width: 220 }}
//           disabled={
//             !row.projectId || isViewMode || !isFieldEditable(row) || isLeave
//           }
//           options={getAvailableTasks(row.projectId).map((t) => ({
//             value: t.id,
//             label: t.name,
//           }))}
//           onChange={(taskIds: string[]) => {
//             const selectedTasks = tasks.filter((t) =>
//               taskIds.includes(t.id),
//             );
//             updateRow(row.key, {
//               taskIds,
//               taskNames: selectedTasks.map((t) => t.name),
//             });
//           }}
//         />

//         <Input
//           placeholder="Description"
//           value={row.description}
//           onChange={(e) => updateRow(row.key, { description: e.target.value })}
//           disabled={isLeave || !isFieldEditable(row)}
//           style={{ flex: 1 }}
//           bordered={false}
//         />

//         <InputNumber<number>
//           min={0}
//           max={24}
//           step={0.5}
//           value={row.hours}
//           disabled={isLeave || !isFieldEditable(row)}
//           controls
//           onChange={(value) => {
//             if (!isLeave) {
//               updateRow(row.key, {
//                 hours: value ?? 0,
//               });
//             }
//           }}
//           style={{ width: 100 }}
//         />

//         <Switch
//           disabled={isViewMode || !isFieldEditable(row) || isLeave}
//           checked={row.billable}
//           onChange={(v) => !isLeave && updateRow(row.key, { billable: v })}
//         />

//         {!isViewMode && !isLeave && (
//           <Space>
//             <SnippetsOutlined
//               style={{
//                 color: isFieldEditable(row) ? "green" : "#ccc",
//                 cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
//               }}
//               onClick={() => isFieldEditable(row) && handleCopyRow(row)}
//             />
//             <DeleteOutlined
//               style={{
//                 color: isFieldEditable(row) ? "red" : "#ccc",
//                 cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
//               }}
//               onClick={() => isFieldEditable(row) && handleDeleteRow(row.key)}
//             />
//           </Space>
//         )}
//       </div>
//     );
//   };

//   return (
//     <>
//       <div style={{ padding: 22 }}>
//         {/* Header - Keep exactly as is */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.subtract(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.add(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 12,
//               background: "#fff1f0",
//               border: "1px solid #ffccc7",
//               borderRadius: 8,
//             }}
//           >
//             <Space>
//               <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
//               <Text strong style={{ color: "#ff4d4f" }}>
//                 Leave Alert:
//               </Text>
//               <Text>
//                 You have {weekLeaveCount} leave day(s) this week. Those days are
//                 disabled for timesheet entry.
//               </Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {process.env.NODE_ENV === "development" && leaveDates.size > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 8,
//               background: "#f0f5ff",
//               borderRadius: 4,
//             }}
//           >
//             <Text strong>
//               📅 Leave Dates: {Array.from(leaveDates).join(", ")}
//             </Text>
//             <Text strong>
//               {" "}
//               Current Week: {DAYS.map((d) => d.fullDate).join(", ")}
//             </Text>
//           </div>
//         )}

//         {/* 7 Day Cards */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//           {DAYS.map((day) => {
//             const dayRows = getDayRows(day.label);
//             const dayTotal = getDayTotal(day.label);
//             const isLeaveDay = dayRows.some(r => r.isLeave);
//             const isExpanded = expandedDays.has(day.label);
//             const isToday = dayjs().format("ddd") === day.label;

//             return (
//               <Card
//                 key={day.label}
//                 style={{
//                   borderRadius: "12px",
//                   border: isToday ? "2px solid #1890ff" : "1px solid #f0f0f0",
//                   backgroundColor: isLeaveDay ? "#fff2f0" : "#ffffff",
//                 }}
//                 bodyStyle={{ padding: "16px" }}
//               >
//                 {/* Card Header */}
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     cursor: "pointer",
//                   }}
//                   onClick={() => toggleDayExpand(day.label)}
//                 >
//                   {/* Left side - Day info */}
//                   <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//                     <div
//                       style={{
//                         width: "48px",
//                         height: "48px",
//                         backgroundColor: isLeaveDay ? "#ff4d4f" : "#1890ff",
//                         borderRadius: "8px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         color: "white",
//                         fontSize: "20px",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       {day.dayNumber}
//                     </div>
//                     <div>
//                       <div style={{ fontSize: "18px", fontWeight: "600" }}>
//                         {day.label}
//                       </div>
//                       <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
//                         {day.date}, {day.year}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Right side - Actions and total */}
//                   <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//                     {!isLeaveDay && (
//                       <Button
//                         type="primary"
//                         icon={<PlusOutlined />}
//                         size="small"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           addEntry(day.label, day.fullDate);
//                         }}
//                         disabled={isViewMode}
//                       >
//                         Add Item
//                       </Button>
//                     )}
//                     <div style={{ fontSize: "16px", fontWeight: "600" }}>
//                       {dayTotal}h
//                     </div>
//                     {isExpanded ? <UpOutlined /> : <DownOutlined />}
//                   </div>
//                 </div>

//                 {/* Card Content - Show when expanded */}
//                 {isExpanded && (
//                   <div style={{ marginTop: "16px" }}>
//                     {dayRows.length > 0 ? (
//                       dayRows.map((row) => renderEntryRow(row))
//                     ) : (
//                       <div
//                         style={{
//                           padding: "24px",
//                           textAlign: "center",
//                           color: "#8c8c8c",
//                           backgroundColor: "#fafafa",
//                           borderRadius: "8px",
//                         }}
//                       >
//                         {isLeaveDay ? (
//                           <div>
//                             <Tag color="red">Leave Day</Tag>
//                             <div style={{ marginTop: "8px" }}>
//                               No entries can be added on leave days
//                             </div>
//                           </div>
//                         ) : (
//                           <div>
//                             No time entries. Click 'Add Item' to log your time.
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </Card>
//             );
//           })}
//         </div>

//         {/* Submit Modal - Keep exactly as is */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{
//             body: {
//               paddingLeft: 16,
//               paddingRight: 16,
//               paddingTop: 24,
//               paddingBottom: 24,
//             },
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {
//                 new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ).size
//               }
//               )
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[
//                 ...new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ),
//               ].map((projectName) => (
//                 <Tag
//                   key={projectName}
//                   style={{
//                     borderRadius: 999,
//                     padding: "4px 10px",
//                     background: "#fff",
//                   }}
//                 >
//                   {projectName}
//                 </Tag>
//               ))}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are
//                 automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }ui working half

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
//   Card,
//   Collapse,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// const { Panel } = Collapse;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean;
//   leaveType?: string;
// }

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<
//     Map<string, { type: string; status: string }>
//   >(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<
//         string,
//         { type: string; status: string }
//       >();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           if (allowedLeaveTypes.includes(leaveType)) {
//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(
//               `📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`,
//             );

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (
//               currentDate.isBefore(endDate) ||
//               currentDate.isSame(endDate, "day")
//             ) {
//               const dateStr = currentDate.format("YYYY-MM-DD");
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status,
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, "day");
//             }
//           } else {
//             console.log(
//               `❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`,
//             );
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//       // After fetching leaves, refresh the rows for the current week
//       refreshRowsForCurrentWeek();
//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Function to refresh rows for the current week based on leave dates
//   const refreshRowsForCurrentWeek = () => {
//     if (!id && !sheet) {
//       // We're in create mode, just create empty rows with leave info
//       setRows(createEmptyRows());
//     } else if (id && sheet) {
//       // We're in edit mode, we need to preserve existing entries but update leave status
//       setRows((prevRows) =>
//         prevRows.map((row) => {
//           const isLeave = isDateLeave(row.date);
//           const leaveInfo = getLeaveInfo(row.date);

//           if (isLeave && !row.isLeave) {
//             // This row should be marked as leave
//             return {
//               ...row,
//               isLeave: true,
//               leaveType: leaveInfo?.type,
//               description: `On leave (${leaveInfo?.type || "Leave"})`,
//               hours: 0,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//             };
//           }
//           return row;
//         }),
//       );
//     }
//   };

//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();

//       // Set today's day as expanded by default
//       const today = dayjs().format("ddd");
//       setExpandedDays(new Set([today]));
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // When date changes, refresh the rows to show leaves for the new week
//   useEffect(() => {
//     if (user?.id) {
//       console.log(
//         "📅 Date changed to:",
//         currentDate.format("MMMM YYYY"),
//         "Week:",
//         currentDate.startOf("week").format("YYYY-MM-DD"),
//         "to",
//         currentDate.endOf("week").format("YYYY-MM-DD"),
//       );

//       // Refresh rows for the new week
//       if (!id && !sheet) {
//         // Create mode - create new empty rows
//         setRows(createEmptyRows());
//       } else {
//         // Edit mode - update existing rows with leave status
//         refreshRowsForCurrentWeek();
//       }
//     }
//   }, [currentDate, user?.id, leaveDates]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (
//     date: string,
//   ): { type: string; status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave and weekend toggle
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     // For weekend days, check if they've been enabled via the checkbox
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//         dayNumber: d.format("D"),
//         year: d.format("YYYY"),
//         fullDateObj: d,
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   // useEffect(() => {
//   //   if (mode === "resubmit") {
//   //     if (isSubmittingRef.current) return;
//   //     setRows(createEmptyRows());
//   //     setStatus("Draft");
//   //     setIsSubmitted(false);
//   //     return;
//   //   }

//   //   if (id && sheet) {
//   //     if (!sheet || !projects.length || !tasks.length) return;

//   //     const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//   //       (r: TimesheetRowAPI, index: number) => {
//   //         const dayAbbr = dayjs(r.day).format("ddd");
//   //         const projectFromName = projects.find(
//   //           (p) => p.name === r.projectName,
//   //         );

//   //         let taskIds: string[] = [];
//   //         let taskNames: string[] = [];

//   //         const projectId = r.projectId || projectFromName?.id;

//   //         if (r.taskId) {
//   //           taskIds = [r.taskId];
//   //           const task = tasks.find((t) => t.id === r.taskId);
//   //           if (task) {
//   //             taskNames = [task.name];
//   //           } else if (r.taskName) {
//   //             taskNames = [r.taskName];
//   //           }
//   //         } else if (r.taskName) {
//   //           if (projectId) {
//   //             const taskNameList = r.taskName
//   //               .split(",")
//   //               .map((name) => name.trim());

//   //             taskNameList.forEach((name) => {
//   //               const matchedTasks = tasks.filter(
//   //                 (t) => t.projectId === projectId && t.name === name,
//   //               );
//   //               if (matchedTasks.length > 0) {
//   //                 taskIds.push(...matchedTasks.map((t) => t.id));
//   //                 taskNames.push(...matchedTasks.map((t) => t.name));
//   //               } else {
//   //                 taskNames.push(name);
//   //               }
//   //             });
//   //           } else {
//   //             taskNames = r.taskName.split(",").map((name) => name.trim());
//   //           }
//   //         }

//   //         const rowDate = dayjs(r.day);
//   //         const dateStr = rowDate.format("YYYY-MM-DD");

//   //         // Check if this date is a leave
//   //         const isLeave = isDateLeave(dateStr);
//   //         const leaveInfo = getLeaveInfo(dateStr);

//   //         return {
//   //           key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//   //           id: r.id,
//   //           day: rowDate.format("ddd"),
//   //           date: dateStr,
//   //           projectId: projectId,
//   //           taskIds: taskIds,
//   //           description: isLeave
//   //             ? `On leave (${leaveInfo?.type || "Leave"})`
//   //             : r.description,
//   //           hours: isLeave ? 0 : r.hours,
//   //           billable: isLeave ? false : r.billable,
//   //           status: mapBackendStatusToUI(sheet.status),
//   //           projectName:
//   //             projects.find((p) => p.id === projectId)?.name ||
//   //             r.projectName ||
//   //             "",
//   //           taskNames: taskNames,
//   //           employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//   //           isLeave: isLeave,
//   //           leaveType: leaveInfo?.type,
//   //         };
//   //       },
//   //     );
//   //     setRows(mappedRows);
//   //     setStatus(mapBackendStatusToUI(sheet.status));
//   //     setIsSubmitted(sheet.status === "SUBMITTED");
//   //     setCurrentDate(dayjs(sheet.weekStart));
//   //     return;
//   //   }

//   //   if (!id) {
//   //     setRows(createEmptyRows());
//   //     setStatus("Draft");
//   //   }
//   // }, [id, mode, sheet, projects, tasks, user]);

//   // In SubmittimesheetTab.tsx - Update the useEffect that maps sheet data

// useEffect(() => {
//   if (mode === "resubmit") {
//     if (isSubmittingRef.current) return;
//     setRows(createEmptyRows());
//     setStatus("Draft");
//     setIsSubmitted(false);
//     return;
//   }

//   if (id && sheet) {
//     if (!sheet || !projects.length || !tasks.length) return;

//     const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//       (r: TimesheetRowAPI, index: number) => {
//         const dayAbbr = dayjs(r.day).format("ddd");
//         const projectFromName = projects.find(
//           (p) => p.name === r.projectName,
//         );

//         let taskIds: string[] = [];
//         let taskNames: string[] = [];

//         const projectId = r.projectId || projectFromName?.id;

//         if (r.taskId) {
//           taskIds = [r.taskId];
//           const task = tasks.find((t) => t.id === r.taskId);
//           if (task) {
//             taskNames = [task.name];
//           } else if (r.taskName) {
//             taskNames = [r.taskName];
//           }
//         } else if (r.taskName) {
//           if (projectId) {
//             const taskNameList = r.taskName
//               .split(",")
//               .map((name) => name.trim());

//             taskNameList.forEach((name) => {
//               const matchedTasks = tasks.filter(
//                 (t) => t.projectId === projectId && t.name === name,
//               );
//               if (matchedTasks.length > 0) {
//                 taskIds.push(...matchedTasks.map((t) => t.id));
//                 taskNames.push(...matchedTasks.map((t) => t.name));
//               } else {
//                 taskNames.push(name);
//               }
//             });
//           } else {
//             taskNames = r.taskName.split(",").map((name) => name.trim());
//           }
//         }

//         const rowDate = dayjs(r.day);
//         const dateStr = rowDate.format("YYYY-MM-DD");

//         // Check if this date is a leave
//         const isLeave = isDateLeave(dateStr);
//         const leaveInfo = getLeaveInfo(dateStr);

//         return {
//           key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//           id: r.id,
//           day: rowDate.format("ddd"),
//           date: dateStr,
//           projectId: projectId,
//           taskIds: taskIds,
//           description: isLeave
//             ? `On leave (${leaveInfo?.type || "Leave"})`
//             : r.description,
//           hours: isLeave ? 0 : r.hours,
//           billable: isLeave ? false : r.billable,
//           status: mapBackendStatusToUI(sheet.status),
//           projectName:
//             projects.find((p) => p.id === projectId)?.name ||
//             r.projectName ||
//             "",
//           taskNames: taskNames,
//           employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//           isLeave: isLeave,
//           leaveType: leaveInfo?.type,
//         };
//       },
//     );

//     setRows(mappedRows);
//     setStatus(mapBackendStatusToUI(sheet.status));
//     setIsSubmitted(sheet.status === "SUBMITTED");
//     setCurrentDate(dayjs(sheet.weekStart));

//     // 🔥 NEW CODE: Find all days that have data and expand them
//     const daysWithData = new Set<string>();

//     // Check each row to see if it has data
//     mappedRows.forEach(row => {
//       // A row has data if it has project/task or is a leave day
//       const hasData = row.projectId ||
//                       (row.taskIds && row.taskIds.length > 0) ||
//                       row.description ||
//                       (row.hours && row.hours > 0) ||
//                       row.isLeave;

//       if (hasData) {
//         daysWithData.add(row.day);
//       }
//     });

//     console.log("📅 Days with data to expand:", Array.from(daysWithData));

//     // Update expanded days - keep today expanded if no data, otherwise expand data days
//     setExpandedDays(prev => {
//       if (daysWithData.size > 0) {
//         return daysWithData;
//       }
//       // If no data, fall back to today
//       return new Set([dayjs().format("ddd")]);
//     });

//     return;
//   }

//   if (!id) {
//     setRows(createEmptyRows());
//     setStatus("Draft");
//   }
// }, [id, mode, sheet, projects, tasks, user]);
//   useEffect(() => {
//     console.log("📊 Data loading status:", {
//       id,
//       hasSheet: !!sheet,
//       leaveDatesSize: leaveDates.size,
//       rowsLength: rows.length,
//       mode,
//     });
//   }, [id, sheet, leaveDates, rows.length, mode]);

//   // Update rows when leaveDates change (for existing sheets)
//   useEffect(() => {
//     if (id && sheet && leaveDates.size > 0) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates, id, sheet]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map((id) => tasks.find((t) => t.id === id))
//             .filter(Boolean) as {
//             id: string;
//             name: string;
//             projectId: string;
//           }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map((t) => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };

//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     // Check if weekend is enabled before allowing add
//     const isWeekendDay = day === "Sat" || day === "Sun";
//     const newKey = `${day}-${Date.now()}-${Math.random()}`;

//     // For weekend days, set the editable state based on checkbox
//     if (isWeekendDay) {
//       // We'll add the row but it will be disabled until checkbox is checked
//       // The editable state is managed per row via weekendEditable
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         key: newKey,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);

//     // Auto-expand the day when adding an entry
//     setExpandedDays(prev => new Set([...prev, day]));
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])],
//       },
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) =>
//       prev.filter((row) => row.key !== key)
//     );
//   };

//   const getDayRows = (dayLabel: string) => {
//     return rows.filter((r) => r.day === dayLabel && !r.isSummary);
//   };

//   const getDayTotal = (dayLabel: string) => {
//     const dayRows = rows.filter((r) => r.day === dayLabel && !r.isSummary);
//     return dayRows.reduce((sum, r) => sum + (r.hours || 0), 0);
//   };

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   const toggleDayExpand = (day: string) => {
//     setExpandedDays(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(day)) {
//         newSet.delete(day);
//       } else {
//         newSet.add(day);
//       }
//       return newSet;
//     });
//   };

//   const totalHours = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.billable ? r.hours || 0 : 0), 0);
//   const expectedHours = 40;

//   // const handleSaveDraft = async () => {
//   //   try {
//   //     setSaveDraftLoading(true);
//   //     const existing = allTimesheets?.data?.find(
//   //       (t: Timesheet) =>
//   //         t.user?.id === sheet?.user?.id &&
//   //         dayjs(t.weekStart).format("YYYY-MM-DD") ===
//   //           currentDate.startOf("week").format("YYYY-MM-DD"),
//   //     );

//   //     // Filter out leave rows from payload
//   //     const rowsForPayload = rows
//   //       .filter((r) => !r.isLeave)
//   //       .map((r) => ({
//   //         day: new Date(`${r.date}T00:00:00Z`),
//   //         projectId: r.projectId,
//   //         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//   //         projectName: r.projectName || "",
//   //         taskName:
//   //           r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//   //         description: r.description || "",
//   //         hours: r.hours || 0,
//   //         billable: r.billable ?? true,
//   //       }));

//   //     const payload = {
//   //       weekStart: currentDate.startOf("week").toISOString(),
//   //       weekEnd: currentDate.endOf("week").toISOString(),
//   //       rows: rowsForPayload,
//   //       totalHours,
//   //       totalBillable,
//   //       status: "DRAFT",
//   //     };

//   //     if (existing) {
//   //       await updateMutation.mutateAsync({ id: existing.id, data: payload });
//   //     } else {
//   //       await createMutation.mutateAsync(payload);
//   //     }
//   //     message.success("Draft saved successfully");
//   //     setStatus("Draft");
//   //     onSubmitted();
//   //   } catch (err) {
//   //     message.error("This timesheet already submitted ");
//   //   } finally {
//   //     setSaveDraftLoading(false);
//   //   }
//   // };

//   // const handleSubmitTimesheet = async () => {
//   //   console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
//   //   isSubmittingRef.current = true;

//   //   try {
//   //     setSubmitLoading(true);

//   //     const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//   //     const existing = allTimesheets?.data?.find(
//   //       (t: Timesheet) =>
//   //         t.user?.id === sheet?.user?.id &&
//   //         dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//   //     );

//   //     if (existing && existing.status === "SUBMITTED") {
//   //       message.warning("This timesheet is already submitted");
//   //       return;
//   //     }

//   //     // Calculate leave count
//   //     const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//   //     const leaveCount = leaveRows.length;

//   //     console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);

//   //     // Filter out leave rows from payload
//   //     const rowsForPayload = rows
//   //       .filter((r) => !r.isLeave)
//   //       .map((r) => ({
//   //         id: r.id,
//   //         day: new Date(`${r.date}T00:00:00Z`),
//   //         projectId: r.projectId,
//   //         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//   //         projectName: r.projectName || "",
//   //         taskName:
//   //           r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//   //         description: r.description || "",
//   //         hours: r.hours || 0,
//   //         billable: r.billable ?? true,
//   //       }));

//   //     let timesheetId: string;
//   //     let savedTimesheet; // Store the response from create/update

//   //     if (existing) {
//   //       console.log("🔄 Updating existing timesheet:", existing.id);
//   //       savedTimesheet = await updateMutation.mutateAsync({
//   //         id: existing.id,
//   //         data: {
//   //           weekStart: currentDate.startOf("week").toDate(),
//   //           weekEnd: currentDate.endOf("week").toDate(),
//   //           rows: rowsForPayload,
//   //           totalHours,
//   //           totalBillable,
//   //           leaveCount,
//   //         },
//   //       });
//   //       timesheetId = existing.id;
//   //     } else {
//   //       console.log("🔄 Creating new timesheet");
//   //       savedTimesheet = await createMutation.mutateAsync({
//   //         weekStart: currentDate.startOf("week").toDate(),
//   //         weekEnd: currentDate.endOf("week").toDate(),
//   //         rows: rowsForPayload,
//   //         totalHours,
//   //         totalBillable,
//   //         leaveCount,
//   //       });
//   //       timesheetId = savedTimesheet.id;
//   //     }

//   //     console.log("✅ Timesheet saved with ID:", timesheetId);
//   //     console.log("✅ Timesheet data after save:", {
//   //       id: savedTimesheet.id,
//   //       leaveCount: savedTimesheet.leaveCount, // This should be 1!
//   //       status: savedTimesheet.status,
//   //     });

//   //     if (!timesheetId) throw new Error("Timesheet ID missing");

//   //     try {
//   //       await TimesheetsService.submitTimesheet(timesheetId);
//   //       console.log("✅ Timesheet submitted successfully");
//   //     } catch (submitError) {
//   //       console.warn("⚠️ Submit API error:", submitError);
//   //     }

//   //     setIsSubmittedModalOpen(true);
//   //     setIsSubmitted(true);
//   //     setStatus("Submitted");
//   //     setIsSubmitOpen(false);

//   //     setRows((prev) =>
//   //       prev.map((row) => ({
//   //         ...row,
//   //         status: "Submitted" as const,
//   //       })),
//   //     );

//   //     message.success("Timesheet submitted successfully!");

//   //     await queryClient.invalidateQueries({
//   //       queryKey: ["timesheets"],
//   //     });
//   //     onSubmitted();
//   //   } catch (err) {
//   //     console.error("❌ Submit failure:", err);
//   //     message.error("This timesheet is already submitted");
//   //   } finally {
//   //     setSubmitLoading(false);
//   //     isSubmittingRef.current = false;
//   //   }
//   // };

//   // ✅ UPDATED: handleSaveChanges with leaveCount and debugging
// // const handleSubmitTimesheet = async () => {
// //   console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
// //   isSubmittingRef.current = true;

// //   try {
// //     setSubmitLoading(true);

// //     const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
// //     const existing = allTimesheets?.data?.find(
// //       (t: Timesheet) =>
// //         t.user?.id === sheet?.user?.id &&
// //         dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
// //     );

// //     if (existing && existing.status === "SUBMITTED") {
// //       message.warning("This timesheet is already submitted");
// //       return;
// //     }

// //     // Calculate leave count
// //     const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
// //     const leaveCount = leaveRows.length;

// //     console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);
// //     console.log("📊 LEAVE ROWS:", leaveRows);

// //     // Filter out leave rows from payload
// //     const rowsForPayload = rows
// //       .filter((r) => !r.isLeave)
// //       .map((r) => ({
// //         id: r.id,
// //         day: new Date(`${r.date}T00:00:00Z`),
// //         projectId: r.projectId,
// //         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
// //         projectName: r.projectName || "",
// //         taskName:
// //           r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
// //         description: r.description || "",
// //         hours: r.hours || 0,
// //         billable: r.billable ?? true,
// //       }));

// //     // 🔥 PRINT ALL PAYLOADS HERE
// //     console.log("=".repeat(50));
// //     console.log("📦 COMPLETE SUBMIT PAYLOAD DETAILS:");
// //     console.log("=".repeat(50));

// //     console.log("📦 WEEK INFO:", {
// //       weekStart: currentDate.startOf("week").format("YYYY-MM-DD"),
// //       weekEnd: currentDate.endOf("week").format("YYYY-MM-DD"),
// //       weekStartISO: currentDate.startOf("week").toISOString(),
// //       weekEndISO: currentDate.endOf("week").toISOString(),
// //     });

// //     console.log("📦 ROWS FOR PAYLOAD:", rowsForPayload.map((r, index) => ({
// //       rowNumber: index + 1,
// //       date: r.day,
// //       projectId: r.projectId,
// //       projectName: r.projectName,
// //       taskId: r.taskId,
// //       taskName: r.taskName,
// //       description: r.description,
// //       hours: r.hours,
// //       billable: r.billable
// //     })));

// //     console.log("📦 SUMMARY:", {
// //       totalRows: rowsForPayload.length,
// //       totalHours,
// //       totalBillable,
// //       leaveCount,
// //     });

// //     let timesheetId: string;
// //     let savedTimesheet;

// //     if (existing) {
// //       console.log("🔄 UPDATING EXISTING TIMESHEET - ID:", existing.id);
// //       const updateData = {
// //         weekStart: currentDate.startOf("week").toDate(),
// //         weekEnd: currentDate.endOf("week").toDate(),
// //         rows: rowsForPayload,
// //         totalHours,
// //         totalBillable,
// //         leaveCount,
// //       };

// //       // 🔥 PRINT UPDATE PAYLOAD
// //       console.log("📦 UPDATE PAYLOAD (FULL):", JSON.stringify(updateData, null, 2));
// //       console.log("📦 UPDATE PAYLOAD (OBJECT):", updateData);

// //       savedTimesheet = await updateMutation.mutateAsync({
// //         id: existing.id,
// //         data: updateData,
// //       });
// //       timesheetId = existing.id;
// //     } else {
// //       console.log("🔄 CREATING NEW TIMESHEET");
// //       const createData = {
// //         weekStart: currentDate.startOf("week").toDate(),
// //         weekEnd: currentDate.endOf("week").toDate(),
// //         rows: rowsForPayload,
// //         totalHours,
// //         totalBillable,
// //         leaveCount,
// //       };

// //       // 🔥 PRINT CREATE PAYLOAD
// //       console.log("📦 CREATE PAYLOAD (FULL):", JSON.stringify(createData, null, 2));
// //       console.log("📦 CREATE PAYLOAD (OBJECT):", createData);

// //       savedTimesheet = await createMutation.mutateAsync(createData);
// //       timesheetId = savedTimesheet.id;
// //     }

// //     console.log("✅ TIMESHEET SAVED WITH ID:", timesheetId);
// //     console.log("✅ TIMESHEET DATA AFTER SAVE:", {
// //       id: savedTimesheet.id,
// //       leaveCount: savedTimesheet.leaveCount,
// //       status: savedTimesheet.status,
// //     });

// //     if (!timesheetId) throw new Error("Timesheet ID missing");

// //     try {
// //       await TimesheetsService.submitTimesheet(timesheetId);
// //       console.log("✅ TIMESHEET SUBMITTED SUCCESSFULLY");
// //     } catch (submitError) {
// //       console.warn("⚠️ SUBMIT API ERROR:", submitError);
// //     }

// //     console.log("=".repeat(50));
// //     console.log("✅ SUBMIT PROCESS COMPLETED");
// //     console.log("=".repeat(50));

// //     setIsSubmittedModalOpen(true);
// //     setIsSubmitted(true);
// //     setStatus("Submitted");
// //     setIsSubmitOpen(false);

// //     setRows((prev) =>
// //       prev.map((row) => ({
// //         ...row,
// //         status: "Submitted" as const,
// //       })),
// //     );

// //     message.success("Timesheet submitted successfully!");

// //     await queryClient.invalidateQueries({
// //       queryKey: ["timesheets"],
// //     });
// //     onSubmitted();
// //   } catch (err) {
// //     console.error("❌ SUBMIT FAILURE:", err);
// //     message.error("This timesheet is already submitted");
// //   } finally {
// //     setSubmitLoading(false);
// //     isSubmittingRef.current = false;
// //   }
// // };

// const handleSaveDraft = async () => {
//   try {
//     setSaveDraftLoading(true);
//     const existing = allTimesheets?.data?.find(
//       (t: Timesheet) =>
//         t.user?.id === sheet?.user?.id &&
//         dayjs(t.weekStart).format("YYYY-MM-DD") ===
//           currentDate.startOf("week").format("YYYY-MM-DD"),
//     );

//     // Calculate leave count
//     const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//     const leaveCount = leaveRows.length;

//     // Include leave rows in payload
//     const rowsForPayload = rows
//       .filter((r) => !r.isSummary)
//       .map((r) => {
//         if (r.isLeave) {
//           return {
//             day: new Date(`${r.date}T00:00:00Z`),
//             projectId: undefined,
//             taskId: undefined,
//             projectName: "",
//             taskName: "",
//             description: r.description || `On leave (${r.leaveType || "Leave"})`,
//             hours: 0,
//             billable: false,
//           };
//         } else {
//           return {
//             day: new Date(`${r.date}T00:00:00Z`),
//             projectId: r.projectId,
//             taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//             projectName: r.projectName || "",
//             taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//             description: r.description || "",
//             hours: r.hours || 0,
//             billable: r.billable ?? true,
//           };
//         }
//       });

//     const payload = {
//       weekStart: currentDate.startOf("week").toISOString(),
//       weekEnd: currentDate.endOf("week").toISOString(),
//       rows: rowsForPayload,
//       totalHours,
//       totalBillable,
//       status: "DRAFT",
//       leaveCount, // Send leave count even for drafts
//     };

//     console.log("📦 DRAFT PAYLOAD with leaveCount:", payload);

//     if (existing) {
//       await updateMutation.mutateAsync({ id: existing.id, data: payload });
//     } else {
//       await createMutation.mutateAsync(payload);
//     }
//     message.success("Draft saved successfully");
//     setStatus("Draft");
//     onSubmitted();
//   } catch (err) {
//     message.error("This timesheet already submitted ");
//   } finally {
//     setSaveDraftLoading(false);
//   }
// };
// const handleSubmitTimesheet = async () => {
//   console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
//   isSubmittingRef.current = true;

//   try {
//     setSubmitLoading(true);

//     const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//     const existing = allTimesheets?.data?.find(
//       (t: Timesheet) =>
//         t.user?.id === sheet?.user?.id &&
//         dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//     );

//     if (existing && existing.status === "SUBMITTED") {
//       message.warning("This timesheet is already submitted");
//       return;
//     }

//     // Calculate leave count from rows that are marked as leave
//     const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//     const leaveCount = leaveRows.length;

//     console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);
//     console.log("📊 LEAVE ROWS:", leaveRows.map(r => ({
//       date: r.date,
//       day: r.day,
//       leaveType: r.leaveType
//     })));

//     // IMPORTANT: Do NOT filter out leave rows for the payload
//     // We need to send leave rows to the backend so they can be saved
//     const rowsForPayload = rows
//       .filter((r) => !r.isSummary) // Only filter out summary rows, keep leave rows
//       .map((r) => {
//         // For leave rows, we want to send special data
//         if (r.isLeave) {
//           return {
//             id: r.id,
//             day: new Date(`${r.date}T00:00:00Z`),
//             projectId: undefined,
//             taskId: undefined,
//             projectName: "",
//             taskName: "",
//             description: r.description || `On leave (${r.leaveType || "Leave"})`,
//             hours: 0,
//             billable: false,
//             isLeave: true, // Add a flag to identify leave rows
//           };
//         } else {
//           // Regular timesheet entry
//           return {
//             id: r.id,
//             day: new Date(`${r.date}T00:00:00Z`),
//             projectId: r.projectId,
//             taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//             projectName: r.projectName || "",
//             taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//             description: r.description || "",
//             hours: r.hours || 0,
//             billable: r.billable ?? true,
//             isLeave: false,
//           };
//         }
//       });

//     console.log("📦 ROWS FOR PAYLOAD:", rowsForPayload.map(r => ({
//       date: r.day,
//       isLeave: r.isLeave,
//       hours: r.hours,
//       description: r.description
//     })));

//     let timesheetId: string;
//     let savedTimesheet;

//     if (existing) {
//       console.log("🔄 UPDATING EXISTING TIMESHEET - ID:", existing.id);
//       const updateData = {
//         weekStart: currentDate.startOf("week").toDate(),
//         weekEnd: currentDate.endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         leaveCount, // Send the calculated leave count
//       };

//       console.log("📦 UPDATE PAYLOAD:", JSON.stringify(updateData, null, 2));

//       savedTimesheet = await updateMutation.mutateAsync({
//         id: existing.id,
//         data: updateData,
//       });
//       timesheetId = existing.id;
//     } else {
//       console.log("🔄 CREATING NEW TIMESHEET");
//       const createData = {
//         weekStart: currentDate.startOf("week").toDate(),
//         weekEnd: currentDate.endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         leaveCount,
//       };

//       console.log("📦 CREATE PAYLOAD:", JSON.stringify(createData, null, 2));

//       savedTimesheet = await createMutation.mutateAsync(createData);
//       timesheetId = savedTimesheet.id;
//     }

//     console.log("✅ TIMESHEET SAVED WITH ID:", timesheetId);
//     console.log("✅ TIMESHEET DATA AFTER SAVE:", {
//       id: savedTimesheet.id,
//       leaveCount: savedTimesheet.leaveCount,
//       status: savedTimesheet.status,
//     });

//     if (!timesheetId) throw new Error("Timesheet ID missing");

//     try {
//       await TimesheetsService.submitTimesheet(timesheetId);
//       console.log("✅ TIMESHEET SUBMITTED SUCCESSFULLY");
//     } catch (submitError) {
//       console.warn("⚠️ SUBMIT API ERROR:", submitError);
//     }

//     setIsSubmittedModalOpen(true);
//     setIsSubmitted(true);
//     setStatus("Submitted");
//     setIsSubmitOpen(false);

//     setRows((prev) =>
//       prev.map((row) => ({
//         ...row,
//         status: "Submitted" as const,
//       })),
//     );

//     message.success("Timesheet submitted successfully!");

//     await queryClient.invalidateQueries({
//       queryKey: ["timesheets"],
//     });
//     onSubmitted();
//   } catch (err) {
//     console.error("❌ SUBMIT FAILURE:", err);
//     message.error("This timesheet is already submitted");
//   } finally {
//     setSubmitLoading(false);
//     isSubmittingRef.current = false;
//   }
// };

//   // const handleSaveChanges = async () => {
//   //   if (!timesheetId) return;
//   //   console.log("ROWS STATE BEFORE SAVE", rows);

//   //   try {
//   //     setSaveChangesLoading(true);

//   //     // ✅ Debug: Log all rows to see which ones are marked as leave
//   //     console.log(
//   //       "📊 ALL ROWS BEFORE SAVE:",
//   //       rows.map((r) => ({
//   //         date: r.date,
//   //         isLeave: r.isLeave,
//   //         leaveType: r.leaveType,
//   //         isSummary: r.isSummary,
//   //       })),
//   //     );

//   //     // ✅ Calculate leave count for this timesheet
//   //     const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//   //     const leaveCount = leaveRows.length;

//   //     console.log(
//   //       "📊 LEAVE ROWS FOUND:",
//   //       leaveRows.map((r) => ({
//   //         date: r.date,
//   //         leaveType: r.leaveType,
//   //       })),
//   //     );
//   //     console.log("📊 LEAVE COUNT:", leaveCount);

//   //     // Filter out leave rows from payload
//   //     const rowsForPayload = rows
//   //       .filter((r) => !r.isLeave)
//   //       .map((r) => ({
//   //         id: r.id,
//   //         day: new Date(`${r.date}T00:00:00Z`),
//   //         taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//   //         projectId: r.projectId,
//   //         description: r.description || "",
//   //         hours: r.hours || 0,
//   //         billable: r.billable || false,
//   //         ...(r.projectName && { projectName: r.projectName }),
//   //         ...(r.taskNames && { taskName: r.taskNames.join(", ") }),
//   //       }));

//   //     const updatePayload = {
//   //       weekStart: dayjs(currentDate).startOf("week").toDate(),
//   //       weekEnd: dayjs(currentDate).endOf("week").toDate(),
//   //       rows: rowsForPayload,
//   //       totalHours,
//   //       totalBillable,
//   //       status: "SUBMITTED",
//   //       // ✅ Send leave count
//   //       leaveCount,
//   //     };

//   //     console.log("updatePayload with leaveCount:", updatePayload);

//   //     await updateMutation.mutateAsync({
//   //       id: timesheetId,
//   //       data: updatePayload,
//   //     });

//   //     message.success("Timesheet edited successfully");
//   //     setIsSubmitOpen(false);
//   //     onSubmitted();
//   //   } catch (err: any) {
//   //     console.error("Save changes failed:", err);
//   //   } finally {
//   //     setSaveChangesLoading(false);
//   //   }
//   // };

//   // Calculate leave count for the current week
//   const handleSaveChanges = async () => {
//   if (!timesheetId) return;
//   console.log("ROWS STATE BEFORE SAVE", rows);

//   try {
//     setSaveChangesLoading(true);

//     // Calculate leave count
//     const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//     const leaveCount = leaveRows.length;

//     console.log("📊 LEAVE ROWS FOUND:", leaveRows.map(r => ({
//       date: r.date,
//       leaveType: r.leaveType,
//     })));
//     console.log("📊 LEAVE COUNT:", leaveCount);

//     // Include leave rows in payload, don't filter them out
//     const rowsForPayload = rows
//       .filter((r) => !r.isSummary)
//       .map((r) => {
//         if (r.isLeave) {
//           return {
//             id: r.id,
//             day: new Date(`${r.date}T00:00:00Z`),
//             taskId: undefined,
//             projectId: undefined,
//             description: r.description || `On leave (${r.leaveType || "Leave"})`,
//             hours: 0,
//             billable: false,
//             projectName: "",
//             taskName: "",
//           };
//         } else {
//           return {
//             id: r.id,
//             day: new Date(`${r.date}T00:00:00Z`),
//             taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//             projectId: r.projectId,
//             description: r.description || "",
//             hours: r.hours || 0,
//             billable: r.billable || false,
//             projectName: r.projectName || "",
//             taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(", ") : "",
//           };
//         }
//       });

//     const updatePayload = {
//       weekStart: dayjs(currentDate).startOf("week").toDate(),
//       weekEnd: dayjs(currentDate).endOf("week").toDate(),
//       rows: rowsForPayload,
//       totalHours,
//       totalBillable,
//       status: "SUBMITTED",
//       leaveCount, // Send the calculated leave count
//     };

//     console.log("📦 UPDATE PAYLOAD with leaveCount:", updatePayload);

//     await updateMutation.mutateAsync({
//       id: timesheetId,
//       data: updatePayload,
//     });

//     message.success("Timesheet edited successfully");
//     setIsSubmitOpen(false);
//     onSubmitted();
//   } catch (err: any) {
//     console.error("Save changes failed:", err);
//   } finally {
//     setSaveChangesLoading(false);
//   }
// };

//   const weekLeaveCount = useMemo(() => {
//     return rows.filter((r) => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   // Render entry row for a day
//   const renderEntryRow = (row: TimesheetRowUI) => {
//     const isLeave = row.isLeave;
//     const isWeekendDay = row.day === "Sat" || row.day === "Sun";

//     return (
//       <div
//         key={row.key}
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "12px",
//           padding: "12px",
//           backgroundColor: isLeave ? "#fff2f0" : "#ffffff",
//           borderRadius: "8px",
//           marginBottom: "8px",
//           border: isLeave ? "1px solid #ffccc7" : "1px solid #f0f0f0",
//           opacity: (isWeekendDay && !isFieldEditable(row)) ? 0.7 : 1,
//         }}
//       >
//         {isLeave && (
//           <Tag color="red" style={{ marginRight: 4, fontWeight: "bold" }}>
//             LEAVE
//           </Tag>
//         )}

//         {/* Weekend checkbox indicator */}
//         {isWeekendDay && !isLeave && (
//           <Checkbox
//             checked={weekendEditable[row.key] || false}
//             onChange={(e) => {
//               setWeekendEditable(prev => ({
//                 ...prev,
//                 [row.key]: e.target.checked
//               }));
//             }}
//             style={{ marginRight: 4 }}
//           />
//         )}

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Select
//             disabled={isViewMode || !isFieldEditable(row) || isLeave}
//             bordered={false}
//             value={row.projectId}
//             placeholder={isLeave ? "Leave day" : "Project"}
//             style={{ width: 180 }}
//             options={projects.map((p) => ({
//               value: p.id,
//               label: p.name,
//             }))}
//             onChange={(projectId) => {
//               const selected = projects.find((p) => p.id === projectId);
//               updateRow(row.key, {
//                 projectId,
//                 projectName: selected?.name,
//                 taskIds: [],
//                 taskNames: [],
//               });
//             }}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Select
//             mode="multiple"
//             allowClear
//             bordered={false}
//             value={row.taskIds}
//             placeholder={isLeave ? "Leave day" : "Select tasks"}
//             style={{ width: 220 }}
//             disabled={
//               !row.projectId || isViewMode || !isFieldEditable(row) || isLeave
//             }
//             options={getAvailableTasks(row.projectId).map((t) => ({
//               value: t.id,
//               label: t.name,
//             }))}
//             onChange={(taskIds: string[]) => {
//               const selectedTasks = tasks.filter((t) =>
//                 taskIds.includes(t.id),
//               );
//               updateRow(row.key, {
//                 taskIds,
//                 taskNames: selectedTasks.map((t) => t.name),
//               });
//             }}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Input
//             placeholder="Description"
//             value={row.description}
//             onChange={(e) => updateRow(row.key, { description: e.target.value })}
//             disabled={isLeave || !isFieldEditable(row)}
//             style={{ flex: 1 }}
//             bordered={false}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={row.hours}
//             disabled={isLeave || !isFieldEditable(row)}
//             controls
//             onChange={(value) => {
//               if (!isLeave) {
//                 updateRow(row.key, {
//                   hours: value ?? 0,
//                 });
//               }
//             }}
//             style={{ width: 100 }}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Switch
//             disabled={isViewMode || !isFieldEditable(row) || isLeave}
//             checked={row.billable}
//             onChange={(v) => !isLeave && updateRow(row.key, { billable: v })}
//           />
//         </Tooltip>

//         {!isViewMode && !isLeave && (
//           <Space>
//             <Tooltip
//               title={
//                 isWeekendDay && !isFieldEditable(row)
//                   ? "Enable the day first to copy"
//                   : "Copy entry"
//               }
//             >
//               <SnippetsOutlined
//                 style={{
//                   color: isFieldEditable(row) ? "green" : "#ccc",
//                   cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
//                 }}
//                 onClick={() => isFieldEditable(row) && handleCopyRow(row)}
//               />
//             </Tooltip>
//             <Tooltip
//               title={
//                 isWeekendDay && !isFieldEditable(row)
//                   ? "Enable the day first to delete"
//                   : "Delete entry"
//               }
//             >
//               <DeleteOutlined
//                 style={{
//                   color: isFieldEditable(row) ? "red" : "#ccc",
//                   cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
//                 }}
//                 onClick={() => isFieldEditable(row) && handleDeleteRow(row.key)}
//               />
//             </Tooltip>
//           </Space>
//         )}
//       </div>
//     );
//   };

//   return (
//     <>
//       <div style={{ padding: 22 }}>
//         {/* Header - Keep exactly as is */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.subtract(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.add(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 12,
//               background: "#fff1f0",
//               border: "1px solid #ffccc7",
//               borderRadius: 8,
//             }}
//           >
//             <Space>
//               <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
//               <Text strong style={{ color: "#ff4d4f" }}>
//                 Leave Alert:
//               </Text>
//               <Text>
//                 You have {weekLeaveCount} leave day(s) this week. Those days are
//                 disabled for timesheet entry.
//               </Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {process.env.NODE_ENV === "development" && leaveDates.size > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 8,
//               background: "#f0f5ff",
//               borderRadius: 4,
//             }}
//           >
//             <Text strong>
//               📅 Leave Dates: {Array.from(leaveDates).join(", ")}
//             </Text>
//             <Text strong>
//               {" "}
//               Current Week: {DAYS.map((d) => d.fullDate).join(", ")}
//             </Text>
//           </div>
//         )}

//         {/* 7 Day Cards */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//           {DAYS.map((day) => {
//             const dayRows = getDayRows(day.label);
//             const dayTotal = getDayTotal(day.label);
//             const isLeaveDay = dayRows.some(r => r.isLeave);
//             const isExpanded = expandedDays.has(day.label);
//             const isToday = dayjs().format("ddd") === day.label;

//             return (
//               <Card
//                 key={day.label}
//                 style={{
//                   borderRadius: "12px",
//                   border: isToday ? "2px solid #1890ff" : "1px solid #f0f0f0",
//                   backgroundColor: isLeaveDay ? "#fff2f0" : "#ffffff",
//                 }}
//                 bodyStyle={{ padding: "16px" }}
//               >
//                 {/* Card Header */}
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     cursor: "pointer",
//                   }}
//                   onClick={() => toggleDayExpand(day.label)}
//                 >
//                   {/* Left side - Day info */}
//                   <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//                     <div
//                       style={{
//                         width: "48px",
//                         height: "48px",
//                         backgroundColor: isToday ? "#1890ff" : (isLeaveDay ? "#ff4d4f" : "#d9d9d9"),
//                         borderRadius: "8px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         color: "white",
//                         fontSize: "20px",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       {day.dayNumber}
//                     </div>
//                     <div>
//                       <div style={{ fontSize: "18px", fontWeight: "600" }}>
//                         {day.label}
//                       </div>
//                       <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
//                         {day.date}, {day.year}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Right side - Actions and total */}
//                   <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//                     {!isLeaveDay && (
//                       <Button
//                         type="primary"
//                         icon={<PlusOutlined />}
//                         size="small"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           addEntry(day.label, day.fullDate);
//                         }}
//                         disabled={isViewMode}
//                       >
//                         Add Item
//                       </Button>
//                     )}
//                     <div style={{ fontSize: "16px", fontWeight: "600" }}>
//                       {dayTotal}h
//                     </div>
//                     {isExpanded ? <UpOutlined /> : <DownOutlined />}
//                   </div>
//                 </div>

//                 {/* Card Content - Table-like structure */}
//                 {isExpanded && (
//                   <div style={{ marginTop: "16px" }}>
//                     {/* Table Header */}
//                     {dayRows.length > 0 && (
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "12px",
//                           padding: "8px 12px",
//                           backgroundColor: "#fafafa",
//                           borderRadius: "8px 8px 0 0",
//                           borderBottom: "2px solid #f0f0f0",
//                           fontWeight: 600,
//                           fontSize: "12px",
//                           color: "#8c8c8c",
//                         }}
//                       >
//                         {!isLeaveDay && (day.label === "Sat" || day.label === "Sun") && (
//                           <div style={{ width: 30 }}></div>
//                         )}
//                         <div style={{ width: 180 }}>PROJECT</div>
//                         <div style={{ width: 220 }}>TASKS</div>
//                         <div style={{ flex: 1 }}>DESCRIPTION</div>
//                         <div style={{ width: 100 }}>HOURS</div>
//                         <div style={{ width: 90 }}>BILLABLE</div>
//                         {!isViewMode && <div style={{ width: 70 }}>ACTIONS</div>}
//                       </div>
//                     )}

//                     {/* Table Rows */}
//                     {dayRows.length > 0 ? (
//                       dayRows.map((row) => renderEntryRow(row))
//                     ) : (
//                       <div
//                         style={{
//                           padding: "24px",
//                           textAlign: "center",
//                           color: "#8c8c8c",
//                           backgroundColor: "#fafafa",
//                           borderRadius: "8px",
//                         }}
//                       >
//                         {isLeaveDay ? (
//                           <div>
//                             <Tag color="red">Leave Day</Tag>
//                             <div style={{ marginTop: "8px" }}>
//                               No entries can be added on leave days
//                             </div>
//                           </div>
//                         ) : (
//                           <div>
//                             No time entries. Click 'Add Item' to log your time.
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </Card>
//             );
//           })}
//         </div>

//         {/* Footer Weekly Summary */}
//         <div
//           style={{
//             marginTop: 24,
//             padding: "16px 24px",
//             backgroundColor: "#fafafa",
//             borderRadius: "8px",
//             border: "1px solid #f0f0f0",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <Text strong style={{ fontSize: "16px", color: "#262626" }}>
//             Week Total
//           </Text>
//           <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
//             <div>
//               <Text type="secondary" style={{ marginRight: 8 }}>
//                 Billable:
//               </Text>
//               <Text strong style={{ color: "#52c41a" }}>
//                 {totalBillable}h
//               </Text>
//             </div>
//             <div>
//               <Text type="secondary" style={{ marginRight: 8 }}>
//                 Total:
//               </Text>
//               <Text strong style={{ color: "#1890ff" }}>
//                 {totalHours}h
//               </Text>
//             </div>
//             {weekLeaveCount > 0 && (
//               <Tag color="red">{weekLeaveCount} Leave Day(s)</Tag>
//             )}
//           </div>
//         </div>

//         {/* Submit Modal - Keep exactly as is */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{
//             body: {
//               paddingLeft: 16,
//               paddingRight: 16,
//               paddingTop: 24,
//               paddingBottom: 24,
//             },
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {
//                 new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ).size
//               }
//               )
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[
//                 ...new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ),
//               ].map((projectName) => (
//                 <Tag
//                   key={projectName}
//                   style={{
//                     borderRadius: 999,
//                     padding: "4px 10px",
//                     background: "#fff",
//                   }}
//                 >
//                   {projectName}
//                 </Tag>
//               ))}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are
//                 automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }working

// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   TimesheetsService,
//   TimesheetUser,
//   Timesheet,
//   CreateTimesheetData,
//   UpdateTimesheetData,
//   reviewTimesheet,
// } from "@/services/timesheetService";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Typography,
//   Button,
//   Progress,
//   Table,
//   Input,
//   Select,
//   InputNumber,
//   Switch,
//   Space,
//   Modal,
//   Divider,
//   Tag,
//   Drawer,
//   Radio,
//   Checkbox,
//   Tooltip,
//   App,
//   Card,
//   Collapse,
// } from "antd";
// import {
//   LeftOutlined,
//   RightOutlined,
//   CalendarOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   SnippetsOutlined,
//   CheckCircleOutlined,
//   WarningOutlined,
//   SaveOutlined,
//   ClockCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   UndoOutlined,
//   ExportOutlined,
//   CheckOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined,
// } from "@ant-design/icons";
// import { useMemo, useState, useEffect, useRef } from "react";
// import type { ColumnsType } from "antd/es/table";
// import { useSearchParams, useRouter } from "next/navigation";
// import {
//   useTimesheets,
//   useTimesheetById,
//   useCreateTimesheet,
//   useUpdateTimesheet,
//   useApproveTimesheet,
// } from "@/hooks/useTimesheet";
// import type {
//   TimesheetRow,
//   TimesheetRow as TimesheetRowAPI,
// } from "@/services/timesheetService";
// // Import leave service
// import leaveService from "@/services/leaveService";
// import { useAuth } from "@/context/AuthContext";

// const { Title, Text } = Typography;
// const { Panel } = Collapse;
// import dayjs, { Dayjs } from "dayjs";
// import utc from "dayjs/plugin/utc";
// import timezone from "dayjs/plugin/timezone";
// import isBetween from "dayjs/plugin/isBetween";

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.extend(isBetween);

// interface TimesheetRowUI {
//   id?: string;
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskIds?: string[];
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Approved" | "Rejected";
//   isSummary?: boolean;
//   employeeName: string;
//   projectName?: string;
//   taskNames?: string[];
//   isLeave?: boolean;
//   leaveType?: string;
// }

// type SubmitTimesheetTabProps = {
//   onSubmitted: () => void;
// };

// export default function SubmittimesheetTab({
//   onSubmitted,
// }: SubmitTimesheetTabProps) {
//   // Get current user from auth context
//   const { user } = useAuth();

//   const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
//   const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
//   const [isSubmitOpen, setIsSubmitOpen] = useState(false);

//   // Separate loading states for different actions
//   const [saveDraftLoading, setSaveDraftLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [saveChangesLoading, setSaveChangesLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
//   const [status, setStatus] = useState<TimesheetStatus>("Draft");
//   const [rows, setRows] = useState<TimesheetRowUI[]>([]);
//   const [weekendEditable, setWeekendEditable] = useState<{
//     [key: string]: boolean;
//   }>({});

//   type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
//   const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
//   const [tasks, setTasks] = useState<
//     { id: string; name: string; projectId: string }[]
//   >([]);
//   const [entryCount, setEntryCount] = useState(0);

//   // State for leaves - use a Set for O(1) lookup
//   const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
//   const [leaveDetails, setLeaveDetails] = useState<
//     Map<string, { type: string; status: string }>
//   >(new Map());
//   const [loadingLeaves, setLoadingLeaves] = useState(false);

//   const { data: allTimesheets } = useTimesheets();
//   const isSubmittingRef = useRef(false);
//   const { message } = App.useApp();
//   const queryClient = useQueryClient();

//   // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
//   const fetchMyLeaves = async () => {
//     try {
//       setLoadingLeaves(true);
//       console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

//       const response = await leaveService.getMyLeaves();

//       console.log("✅ Leaves fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const leaveDateSet = new Set<string>();
//       const leaveDetailsMap = new Map<
//         string,
//         { type: string; status: string }
//       >();

//       // Check response structure
//       if (response) {
//         let leavesArray: any[] = [];

//         // Handle different response structures
//         if (response.data && Array.isArray(response.data)) {
//           leavesArray = response.data;
//         } else if (Array.isArray(response)) {
//           leavesArray = response;
//         }

//         // Filter for ONLY Casual Leave and Sick Leave
//         const allowedLeaveTypes = ["casual_leave", "sick_leave"];

//         // Loop through each leave
//         leavesArray.forEach((leave: any) => {
//           const leaveType = leave.type?.toLowerCase();
//           const leaveStatus = leave.status?.toLowerCase();

//           // Only include if:
//           // 1. Leave type is Casual Leave or Sick Leave
//           if (allowedLeaveTypes.includes(leaveType)) {
//             const startDate = dayjs(leave.startDate);
//             const endDate = dayjs(leave.endDate);

//             console.log(
//               `📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`,
//             );

//             // Add each day in the leave range
//             let currentDate = startDate;
//             while (
//               currentDate.isBefore(endDate) ||
//               currentDate.isSame(endDate, "day")
//             ) {
//               const dateStr = currentDate.format("YYYY-MM-DD");
//               leaveDateSet.add(dateStr);
//               leaveDetailsMap.set(dateStr, {
//                 type: leave.type,
//                 status: leave.status,
//               });
//               console.log(`  ✅ Added leave date: ${dateStr}`);
//               currentDate = currentDate.add(1, "day");
//             }
//           } else {
//             console.log(
//               `❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`,
//             );
//           }
//         });
//       }

//       console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
//       console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

//       setLeaveDates(leaveDateSet);
//       setLeaveDetails(leaveDetailsMap);

//       // After fetching leaves, refresh the rows for the current week
//       refreshRowsForCurrentWeek();
//     } catch (error: any) {
//       console.error("❌ Failed to fetch leaves:", error);
//     } finally {
//       setLoadingLeaves(false);
//     }
//   };

//   // Function to refresh rows for the current week based on leave dates
//   const refreshRowsForCurrentWeek = () => {
//     if (!id && !sheet) {
//       // We're in create mode, just create empty rows with leave info
//       setRows(createEmptyRows());
//     } else if (id && sheet) {
//       // We're in edit mode, we need to preserve existing entries but update leave status
//       setRows((prevRows) =>
//         prevRows.map((row) => {
//           const isLeave = isDateLeave(row.date);
//           const leaveInfo = getLeaveInfo(row.date);

//           if (isLeave && !row.isLeave) {
//             // This row should be marked as leave
//             return {
//               ...row,
//               isLeave: true,
//               leaveType: leaveInfo?.type,
//               description: `On leave (${leaveInfo?.type || "Leave"})`,
//               hours: 0,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//             };
//           }
//           return row;
//         }),
//       );
//     }
//   };

//   //   if (user?.id) {
//   //     console.log("🔄 Component mounted, user detected:", user.id);
//   //     fetchMyLeaves();

//   //     // 🔥 FIX: Always expand today's card based on ACTUAL current date
//   //     const today = dayjs().format("ddd");
//   //     console.log("📅 Today's day (from actual current date):", today);
//   //     setExpandedDays(new Set([today]));
//   //   } else {
//   //     console.log("⏳ Waiting for user to load...");
//   //   }
//   // }, [user?.id]);

//   useEffect(() => {
//     if (user?.id) {
//       console.log("🔄 Component mounted, user detected:", user.id);
//       fetchMyLeaves();

//       // ✅ Find which day in THIS week is actually today
//       const todayInThisWeek = DAYS.find((day) => day.isToday)?.label;
//       if (todayInThisWeek) {
//         console.log("📅 Today in this week:", todayInThisWeek);
//         setExpandedDays(new Set([todayInThisWeek]));
//       } else {
//         // Today's date is not in this week (e.g., looking at future/past week)
//         setExpandedDays(new Set([]));
//       }
//     } else {
//       console.log("⏳ Waiting for user to load...");
//     }
//   }, [user?.id]);

//   // When date changes, refresh the rows to show leaves for the new week
//   // useEffect(() => {
//   //   if (user?.id) {
//   //     console.log(
//   //       "📅 Date changed to:",
//   //       currentDate.format("MMMM YYYY"),
//   //       "Week:",
//   //       currentDate.startOf("week").format("YYYY-MM-DD"),
//   //       "to",
//   //       currentDate.endOf("week").format("YYYY-MM-DD"),
//   //     );

//   //     // Refresh rows for the new week
//   //     if (!id && !sheet) {
//   //       // Create mode - create new empty rows
//   //       setRows(createEmptyRows());

//   //       // 🔥 FIX: In create mode, always expand today's card
//   //       const today = dayjs().format("ddd");
//   //       setExpandedDays(new Set([today]));
//   //     } else {
//   //       // Edit mode - update existing rows with leave status
//   //       refreshRowsForCurrentWeek();

//   //       // In edit mode, we still want today's card expanded along with any data cards
//   //       // This will be handled in the sheet useEffect
//   //     }
//   //   }
//   // }, [currentDate, user?.id, leaveDates]);

//   // When date changes, refresh the rows to show leaves for the new week
//   useEffect(() => {
//     if (user?.id) {
//       console.log(
//         "📅 Date changed to:",
//         currentDate.format("MMMM YYYY"),
//         "Week:",
//         currentDate.startOf("week").format("YYYY-MM-DD"),
//         "to",
//         currentDate.endOf("week").format("YYYY-MM-DD"),
//       );

//       // Refresh rows for the new week
//       if (!id && !sheet) {
//         // Create mode - create new empty rows
//         setRows(createEmptyRows());

//         // ✅ Find which day in THIS week is actually today
//         const todayInThisWeek = DAYS.find((day) => day.isToday)?.label;
//         if (todayInThisWeek) {
//           setExpandedDays(new Set([todayInThisWeek]));
//         } else {
//           // Today's date is not in this week
//           setExpandedDays(new Set([]));
//         }
//       } else {
//         // Edit mode - update existing rows with leave status
//         refreshRowsForCurrentWeek();

//         // In edit mode, we still want today's card expanded along with any data cards
//         // This will be handled in the sheet useEffect
//       }
//     }
//   }, [currentDate, user?.id, leaveDates]);

//   // Helper function to check if a date is a leave
//   const isDateLeave = (date: string): boolean => {
//     return leaveDates.has(date);
//   };

//   // Helper function to get leave info
//   const getLeaveInfo = (
//     date: string,
//   ): { type: string; status: string } | undefined => {
//     return leaveDetails.get(date);
//   };

//   // 🔹 FETCH single timesheet
//   const createMutation = useCreateTimesheet();
//   const updateMutation = useUpdateTimesheet();

//   const searchParams = useSearchParams();
//   const idParam = searchParams.get("id");
//   const id = idParam ?? undefined;
//   const { data: sheet, isLoading } = useTimesheetById(id);

//   const mode = searchParams.get("mode") || "create";
//   const isEditMode = mode === "edit";
//   const isViewMode = mode === "view";
//   const isPreviewMode = false;
//   const timesheetId = searchParams.get("id");

//   const isWeekend = (day: string) => day === "Sat" || day === "Sun";

//   // Updated isFieldEditable to also check for leave and weekend toggle
//   const isFieldEditable = (row: TimesheetRowUI) => {
//     if (row.isLeave) return false; // Can't edit leave rows
//     if (!isWeekend(row.day)) return true;
//     // For weekend days, check if they've been enabled via the checkbox
//     return weekendEditable[row.key] ?? false;
//   };

//   // 🔥 FIX: Add isToday flag to each day for dynamic highlighting
//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       // Check if this day is TODAY's actual date (compare full date)
//       const isToday = d.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");

//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: d.format("YYYY-MM-DD"),
//         dayNumber: d.format("D"),
//         year: d.format("YYYY"),
//         fullDateObj: d,
//         isToday: isToday, // Add this flag
//       };
//     });
//   }, [currentDate]);

//   // Updated createEmptyRows to check for leaves
//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
//         hours: 0,
//         billable: !isLeave, // Not billable if on leave
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//       };
//     });

//   useEffect(() => {
//     const loadMeta = async () => {
//       try {
//         const meta = await TimesheetsService.getMeta();
//         setProjects(meta?.projects || []);
//         setTasks(meta?.tasks || []);
//       } catch (error) {
//         console.error("Error loading meta:", error);
//       }
//     };
//     loadMeta();
//   }, []);

//   useEffect(() => {
//     const count = rows.filter(
//       (row: TimesheetRowUI) =>
//         !row.isLeave && // Don't count leave rows
//         !!row.projectId &&
//         row.taskIds &&
//         row.taskIds.length > 0 &&
//         Number(row.hours) > 0,
//     ).length;
//     setEntryCount(count);
//   }, [rows]);

//   const mapBackendStatusToUI = (
//     status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
//   ): "Draft" | "Submitted" | "Approved" | "Rejected" => {
//     switch (status) {
//       case "DRAFT":
//         return "Draft";
//       case "SUBMITTED":
//         return "Submitted";
//       case "APPROVED":
//         return "Approved";
//       case "REJECTED":
//         return "Rejected";
//       default:
//         return "Draft";
//     }
//   };

//   useEffect(() => {
//     if (sheet) {
//       console.log("🎯 Sheet data received:", {
//         id: sheet.id,
//         weekStart: sheet.weekStart,
//         status: sheet.status,
//         rowsCount: sheet.rows?.length,
//         user: sheet.user,
//       });
//     }
//   }, [sheet]);

//   useEffect(() => {
//     if (tasks.length > 0) {
//       console.log("📋 Available tasks:", tasks);
//     }
//   }, [tasks]);

//   useEffect(() => {
//     if (mode === "resubmit") {
//       if (isSubmittingRef.current) return;
//       setRows(createEmptyRows());
//       setStatus("Draft");
//       setIsSubmitted(false);
//       return;
//     }

//     if (id && sheet) {
//       if (!sheet || !projects.length || !tasks.length) return;

//       const mappedRows: TimesheetRowUI[] = sheet.rows.map(
//         (r: TimesheetRowAPI, index: number) => {
//           const dayAbbr = dayjs(r.day).format("ddd");
//           const projectFromName = projects.find(
//             (p) => p.name === r.projectName,
//           );

//           let taskIds: string[] = [];
//           let taskNames: string[] = [];

//           const projectId = r.projectId || projectFromName?.id;

//           if (r.taskId) {
//             taskIds = [r.taskId];
//             const task = tasks.find((t) => t.id === r.taskId);
//             if (task) {
//               taskNames = [task.name];
//             } else if (r.taskName) {
//               taskNames = [r.taskName];
//             }
//           } else if (r.taskName) {
//             if (projectId) {
//               const taskNameList = r.taskName
//                 .split(",")
//                 .map((name) => name.trim());

//               taskNameList.forEach((name) => {
//                 const matchedTasks = tasks.filter(
//                   (t) => t.projectId === projectId && t.name === name,
//                 );
//                 if (matchedTasks.length > 0) {
//                   taskIds.push(...matchedTasks.map((t) => t.id));
//                   taskNames.push(...matchedTasks.map((t) => t.name));
//                 } else {
//                   taskNames.push(name);
//                 }
//               });
//             } else {
//               taskNames = r.taskName.split(",").map((name) => name.trim());
//             }
//           }

//           const rowDate = dayjs(r.day);
//           const dateStr = rowDate.format("YYYY-MM-DD");

//           // Check if this date is a leave
//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave
//               ? `On leave (${leaveInfo?.type || "Leave"})`
//               : r.description,
//             hours: isLeave ? 0 : r.hours,
//             billable: isLeave ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName:
//               projects.find((p) => p.id === projectId)?.name ||
//               r.projectName ||
//               "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//           };
//         },
//       );

//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));

//       // 🔥 FIX: Find all days that have data AND ensure today is also expanded
//       const daysToExpand = new Set<string>();

//       // Add today's day (always expand today)
//       // const today = dayjs().format("ddd");
//       // daysToExpand.add(today);

//       // Check each row to see if it has data and add those days
//       mappedRows.forEach((row) => {
//         // A row has data if it has project/task or is a leave day
//         const hasData =
//           row.projectId ||
//           (row.taskIds && row.taskIds.length > 0) ||
//           row.description ||
//           (row.hours && row.hours > 0) ||
//           row.isLeave;

//         if (hasData) {
//           daysToExpand.add(row.day);
//         }
//       });

//       console.log(
//         "📅 Days to expand (including today):",
//         Array.from(daysToExpand),
//       );

//       // Update expanded days
//       setExpandedDays(daysToExpand);

//       return;
//     }

//     if (!id) {
//       setRows(createEmptyRows());
//       setStatus("Draft");
//     }
//   }, [id, mode, sheet, projects, tasks, user]);

//   useEffect(() => {
//     console.log("📊 Data loading status:", {
//       id,
//       hasSheet: !!sheet,
//       leaveDatesSize: leaveDates.size,
//       rowsLength: rows.length,
//       mode,
//     });
//   }, [id, sheet, leaveDates, rows.length, mode]);

//   // Update rows when leaveDates change (for existing sheets)
//   useEffect(() => {
//     if (id && sheet && leaveDates.size > 0) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates, id, sheet]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't update leave rows
//         if (r.isLeave) return r;

//         const updatedProjectName = r.projectId
//           ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
//           : r.projectName;

//         let updatedTaskNames = r.taskNames;
//         if (r.taskIds && r.taskIds.length > 0) {
//           const foundTasks = r.taskIds
//             .map((id) => tasks.find((t) => t.id === id))
//             .filter(Boolean) as {
//             id: string;
//             name: string;
//             projectId: string;
//           }[];

//           if (foundTasks.length > 0) {
//             updatedTaskNames = foundTasks.map((t) => t.name);
//           }
//         }

//         return {
//           ...r,
//           projectName: updatedProjectName,
//           taskNames: updatedTaskNames,
//         };
//       }),
//     );
//   }, [projects, tasks]);

//   const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
//     setRows((prev) =>
//       prev.map((r) => {
//         // Don't allow updates on leave rows
//         if (r.isLeave) return r;

//         if (r.key === key) {
//           const updated = { ...r, ...patch };

//           if (patch.projectId && patch.projectId !== r.projectId) {
//             updated.taskIds = [];
//             updated.taskNames = [];
//           }

//           if (patch.date) {
//             setCurrentDate(dayjs(patch.date).startOf("week"));
//           }

//           return updated;
//         }
//         return r;
//       }),
//     );
//   };
//   // Add this with your other useRef declarations
//   const isAddingEntry = useRef(false);
//   const addEntry = (day: string, date: string) => {
//     // Don't allow adding entries on leave days
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     // ✅ THIS PREVENTS DOUBLE ADD FROM STRICT MODE
//     if (isAddingEntry.current) {
//       console.log("Preventing double add");
//       return;
//     }

//     isAddingEntry.current = true;

//     const newKey = `${day}-${Date.now()}-${Math.random()}`;

//     setRows((prev) => [
//       ...prev,
//       {
//         key: newKey,
//         day,
//         date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//         taskIds: [],
//         taskNames: [],
//         employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//         isLeave: false,
//       },
//     ]);

//     // Auto-expand the day when adding an entry
//     setExpandedDays((prev) => new Set([...prev, day]));

//     // Reset the flag after a short delay
//     setTimeout(() => {
//       isAddingEntry.current = false;
//     }, 500);
//   };

//   // const addEntry = (day: string, date: string) => {
//   //   // Don't allow adding entries on leave days
//   //   if (isDateLeave(date)) {
//   //     message.warning("Cannot add entry on a leave day");
//   //     return;
//   //   }

//   //   // Check if weekend is enabled before allowing add
//   //   const isWeekendDay = day === "Sat" || day === "Sun";
//   //   const newKey = `${day}-${Date.now()}-${Math.random()}`;

//   //   setRows((prev) => [
//   //     ...prev,
//   //     {
//   //       key: newKey,
//   //       day,
//   //       date,
//   //       hours: 0,
//   //       billable: true,
//   //       status: "Draft",
//   //       taskIds: [],
//   //       taskNames: [],
//   //       employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
//   //       isLeave: false,
//   //     },
//   //   ]);

//   //   // Auto-expand the day when adding an entry
//   //   setExpandedDays(prev => new Set([...prev, day]));
//   // };
//   // Add this ref near your other useRef declarations
//   // Add these near your other useRef declarations

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     // Don't allow copying leave rows
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     setRows((prev) => [
//       ...prev,
//       {
//         ...row,
//         key: `${row.day}-${Date.now()}-${Math.random()}`,
//         id: undefined,
//         taskIds: [...(row.taskIds || [])],
//         taskNames: [...(row.taskNames || [])],
//       },
//     ]);
//   };

//   const handleDeleteRow = (key: string) => {
//     setRows((prev) => prev.filter((row) => row.key !== key));
//   };

//   const getDayRows = (dayLabel: string) => {
//     return rows.filter((r) => r.day === dayLabel && !r.isSummary);
//   };

//   const getDayTotal = (dayLabel: string) => {
//     const dayRows = rows.filter((r) => r.day === dayLabel && !r.isSummary);
//     return dayRows.reduce((sum, r) => sum + (r.hours || 0), 0);
//   };

//   const getAvailableTasks = (projectId?: string) => {
//     if (!projectId) return [];
//     return tasks.filter((t) => t.projectId === projectId);
//   };

//   const toggleDayExpand = (day: string) => {
//     setExpandedDays((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(day)) {
//         newSet.delete(day);
//       } else {
//         newSet.add(day);
//       }
//       return newSet;
//     });
//   };

//   const totalHours = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.hours || 0), 0);
//   const totalBillable = rows
//     .filter((r) => !r.isLeave)
//     .reduce((sum, r) => sum + (r.billable ? r.hours || 0 : 0), 0);
//   const expectedHours = 40;

//   const handleSaveDraft = async () => {
//     try {
//       setSaveDraftLoading(true);
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") ===
//             currentDate.startOf("week").format("YYYY-MM-DD"),
//       );

//       // Calculate leave count
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       // Include leave rows in payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isSummary)
//         .map((r) => {
//           if (r.isLeave) {
//             return {
//               day: new Date(`${r.date}T00:00:00Z`),
//               projectId: undefined,
//               taskId: undefined,
//               projectName: "",
//               taskName: "",
//               description:
//                 r.description || `On leave (${r.leaveType || "Leave"})`,
//               hours: 0,
//               billable: false,
//             };
//           } else {
//             return {
//               day: new Date(`${r.date}T00:00:00Z`),
//               projectId: r.projectId,
//               taskId:
//                 r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//               projectName: r.projectName || "",
//               taskName:
//                 r.taskNames && r.taskNames.length > 0
//                   ? r.taskNames.join(", ")
//                   : "",
//               description: r.description || "",
//               hours: r.hours || 0,
//               billable: r.billable ?? true,
//             };
//           }
//         });

//       const payload = {
//         weekStart: currentDate.startOf("week").toISOString(),
//         weekEnd: currentDate.endOf("week").toISOString(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "DRAFT",
//         leaveCount,
//       };

//       console.log("📦 DRAFT PAYLOAD with leaveCount:", payload);

//       if (existing) {
//         await updateMutation.mutateAsync({ id: existing.id, data: payload });
//       } else {
//         await createMutation.mutateAsync(payload);
//       }
//       message.success("Draft saved successfully");
//       setStatus("Draft");
//       onSubmitted();
//     } catch (err) {
//       message.error("This timesheet already submitted ");
//     } finally {
//       setSaveDraftLoading(false);
//     }
//   };

//   const handleSubmitTimesheet = async () => {
//     console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
//     isSubmittingRef.current = true;

//     try {
//       setSubmitLoading(true);

//       const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
//       const existing = allTimesheets?.data?.find(
//         (t: Timesheet) =>
//           t.user?.id === sheet?.user?.id &&
//           dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
//       );

//       if (existing && existing.status === "SUBMITTED") {
//         message.warning("This timesheet is already submitted");
//         return;
//       }

//       // Calculate leave count from rows that are marked as leave
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);
//       console.log(
//         "📊 LEAVE ROWS:",
//         leaveRows.map((r) => ({
//           date: r.date,
//           day: r.day,
//           leaveType: r.leaveType,
//         })),
//       );

//       // IMPORTANT: Do NOT filter out leave rows for the payload
//       const rowsForPayload = rows
//         .filter((r) => !r.isSummary) // Only filter out summary rows, keep leave rows
//         .map((r) => {
//           if (r.isLeave) {
//             return {
//               id: r.id,
//               day: new Date(`${r.date}T00:00:00Z`),
//               projectId: undefined,
//               taskId: undefined,
//               projectName: "",
//               taskName: "",
//               description:
//                 r.description || `On leave (${r.leaveType || "Leave"})`,
//               hours: 0,
//               billable: false,
//               isLeave: true,
//             };
//           } else {
//             return {
//               id: r.id,
//               day: new Date(`${r.date}T00:00:00Z`),
//               projectId: r.projectId,
//               taskId:
//                 r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//               projectName: r.projectName || "",
//               taskName:
//                 r.taskNames && r.taskNames.length > 0
//                   ? r.taskNames.join(", ")
//                   : "",
//               description: r.description || "",
//               hours: r.hours || 0,
//               billable: r.billable ?? true,
//               isLeave: false,
//             };
//           }
//         });

//       console.log(
//         "📦 ROWS FOR PAYLOAD:",
//         rowsForPayload.map((r) => ({
//           date: r.day,
//           isLeave: r.isLeave,
//           hours: r.hours,
//           description: r.description,
//         })),
//       );

//       let timesheetId: string;
//       let savedTimesheet;

//       if (existing) {
//         console.log("🔄 UPDATING EXISTING TIMESHEET - ID:", existing.id);
//         const updateData = {
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//           totalHours,
//           totalBillable,
//           leaveCount,
//         };

//         console.log("📦 UPDATE PAYLOAD:", JSON.stringify(updateData, null, 2));

//         savedTimesheet = await updateMutation.mutateAsync({
//           id: existing.id,
//           data: updateData,
//         });
//         timesheetId = existing.id;
//       } else {
//         console.log("🔄 CREATING NEW TIMESHEET");
//         const createData = {
//           weekStart: currentDate.startOf("week").toDate(),
//           weekEnd: currentDate.endOf("week").toDate(),
//           rows: rowsForPayload,
//           totalHours,
//           totalBillable,
//           leaveCount,
//         };

//         console.log("📦 CREATE PAYLOAD:", JSON.stringify(createData, null, 2));

//         savedTimesheet = await createMutation.mutateAsync(createData);
//         timesheetId = savedTimesheet.id;
//       }

//       console.log("✅ TIMESHEET SAVED WITH ID:", timesheetId);
//       console.log("✅ TIMESHEET DATA AFTER SAVE:", {
//         id: savedTimesheet.id,
//         leaveCount: savedTimesheet.leaveCount,
//         status: savedTimesheet.status,
//       });

//       if (!timesheetId) throw new Error("Timesheet ID missing");

//       try {
//         await TimesheetsService.submitTimesheet(timesheetId);
//         console.log("✅ TIMESHEET SUBMITTED SUCCESSFULLY");
//       } catch (submitError) {
//         console.warn("⚠️ SUBMIT API ERROR:", submitError);
//       }

//       setIsSubmittedModalOpen(true);
//       setIsSubmitted(true);
//       setStatus("Submitted");
//       setIsSubmitOpen(false);

//       setRows((prev) =>
//         prev.map((row) => ({
//           ...row,
//           status: "Submitted" as const,
//         })),
//       );

//       message.success("Timesheet submitted successfully!");

//       await queryClient.invalidateQueries({
//         queryKey: ["timesheets"],
//       });
//       onSubmitted();
//     } catch (err) {
//       console.error("❌ SUBMIT FAILURE:", err);
//       message.error("This timesheet is already submitted");
//     } finally {
//       setSubmitLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (!timesheetId) return;
//     console.log("ROWS STATE BEFORE SAVE", rows);

//     try {
//       setSaveChangesLoading(true);

//       // Calculate leave count
//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log(
//         "📊 LEAVE ROWS FOUND:",
//         leaveRows.map((r) => ({
//           date: r.date,
//           leaveType: r.leaveType,
//         })),
//       );
//       console.log("📊 LEAVE COUNT:", leaveCount);

//       // Include leave rows in payload, don't filter them out
//       const rowsForPayload = rows
//         .filter((r) => !r.isSummary)
//         .map((r) => {
//           if (r.isLeave) {
//             return {
//               id: r.id,
//               day: new Date(`${r.date}T00:00:00Z`),
//               taskId: undefined,
//               projectId: undefined,
//               description:
//                 r.description || `On leave (${r.leaveType || "Leave"})`,
//               hours: 0,
//               billable: false,
//               projectName: "",
//               taskName: "",
//             };
//           } else {
//             return {
//               id: r.id,
//               day: new Date(`${r.date}T00:00:00Z`),
//               taskId:
//                 r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
//               projectId: r.projectId,
//               description: r.description || "",
//               hours: r.hours || 0,
//               billable: r.billable || false,
//               projectName: r.projectName || "",
//               taskName:
//                 r.taskNames && r.taskNames.length > 0
//                   ? r.taskNames.join(", ")
//                   : "",
//             };
//           }
//         });

//       const updatePayload = {
//         weekStart: dayjs(currentDate).startOf("week").toDate(),
//         weekEnd: dayjs(currentDate).endOf("week").toDate(),
//         rows: rowsForPayload,
//         totalHours,
//         totalBillable,
//         status: "SUBMITTED",
//         leaveCount,
//       };

//       console.log("📦 UPDATE PAYLOAD with leaveCount:", updatePayload);

//       await updateMutation.mutateAsync({
//         id: timesheetId,
//         data: updatePayload,
//       });

//       message.success("Timesheet edited successfully");
//       setIsSubmitOpen(false);
//       onSubmitted();
//     } catch (err: any) {
//       console.error("Save changes failed:", err);
//     } finally {
//       setSaveChangesLoading(false);
//     }
//   };

//   const weekLeaveCount = useMemo(() => {
//     return rows.filter((r) => r.isLeave && !r.isSummary).length;
//   }, [rows]);

//   // Render entry row for a day
//   const renderEntryRow = (row: TimesheetRowUI) => {
//     const isLeave = row.isLeave;
//     const isWeekendDay = row.day === "Sat" || row.day === "Sun";

//     return (
//       <div
//         key={row.key}
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "12px",
//           padding: "12px",
//           backgroundColor: isLeave ? "#fff2f0" : "#ffffff",
//           borderRadius: "8px",
//           marginBottom: "8px",
//           border: isLeave ? "1px solid #ffccc7" : "1px solid #f0f0f0",
//           opacity: isWeekendDay && !isFieldEditable(row) ? 0.7 : 1,
//         }}
//       >
//         {isLeave && (
//           <Tag color="red" style={{ marginRight: 4, fontWeight: "bold" }}>
//             LEAVE
//           </Tag>
//         )}

//         {/* Weekend checkbox indicator */}
//         {isWeekendDay && !isLeave && (
//           <Checkbox
//             checked={weekendEditable[row.key] || false}
//             onChange={(e) => {
//               setWeekendEditable((prev) => ({
//                 ...prev,
//                 [row.key]: e.target.checked,
//               }));
//             }}
//             style={{ marginRight: 4 }}
//           />
//         )}

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Select
//             disabled={isViewMode || !isFieldEditable(row) || isLeave}
//             bordered={false}
//             value={row.projectId}
//             placeholder={isLeave ? "Leave day" : "Project"}
//             style={{ width: 180 }}
//             options={projects.map((p) => ({
//               value: p.id,
//               label: p.name,
//             }))}
//             onChange={(projectId) => {
//               const selected = projects.find((p) => p.id === projectId);
//               updateRow(row.key, {
//                 projectId,
//                 projectName: selected?.name,
//                 taskIds: [],
//                 taskNames: [],
//               });
//             }}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Select
//             mode="multiple"
//             allowClear
//             bordered={false}
//             value={row.taskIds}
//             placeholder={isLeave ? "Leave day" : "Select tasks"}
//             style={{ width: 220 }}
//             disabled={
//               !row.projectId || isViewMode || !isFieldEditable(row) || isLeave
//             }
//             options={getAvailableTasks(row.projectId).map((t) => ({
//               value: t.id,
//               label: t.name,
//             }))}
//             onChange={(taskIds: string[]) => {
//               const selectedTasks = tasks.filter((t) => taskIds.includes(t.id));
//               updateRow(row.key, {
//                 taskIds,
//                 taskNames: selectedTasks.map((t) => t.name),
//               });
//             }}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Input
//             placeholder="Description"
//             value={row.description}
//             onChange={(e) =>
//               updateRow(row.key, { description: e.target.value })
//             }
//             disabled={isLeave || !isFieldEditable(row)}
//             style={{ flex: 1 }}
//             bordered={false}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={row.hours}
//             disabled={isLeave || !isFieldEditable(row)}
//             controls
//             onChange={(value) => {
//               if (!isLeave) {
//                 updateRow(row.key, {
//                   hours: value ?? 0,
//                 });
//               }
//             }}
//             style={{ width: 100 }}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave
//               ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
//               : ""
//           }
//         >
//           <Switch
//             disabled={isViewMode || !isFieldEditable(row) || isLeave}
//             checked={row.billable}
//             onChange={(v) => !isLeave && updateRow(row.key, { billable: v })}
//           />
//         </Tooltip>

//         {!isViewMode && !isLeave && (
//           <Space>
//             <Tooltip
//               title={
//                 isWeekendDay && !isFieldEditable(row)
//                   ? "Enable the day first to copy"
//                   : "Copy entry"
//               }
//             >
//               <SnippetsOutlined
//                 style={{
//                   color: isFieldEditable(row) ? "green" : "#ccc",
//                   cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
//                 }}
//                 onClick={() => isFieldEditable(row) && handleCopyRow(row)}
//               />
//             </Tooltip>
//             <Tooltip
//               title={
//                 isWeekendDay && !isFieldEditable(row)
//                   ? "Enable the day first to delete"
//                   : "Delete entry"
//               }
//             >
//               <DeleteOutlined
//                 style={{
//                   color: isFieldEditable(row) ? "red" : "#ccc",
//                   cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
//                 }}
//                 onClick={() => isFieldEditable(row) && handleDeleteRow(row.key)}
//               />
//             </Tooltip>
//           </Space>
//         )}
//       </div>
//     );
//   };

//   return (
//     <>
//       <div style={{ padding: 22 }}>
//         {/* Header - Keep exactly as is */}
//         <div
//           className="timesheet-header"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <Title level={3} style={{ margin: 0, color: "#262626" }}>
//               {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//             </Title>
//             <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//               {currentDate.format("MMMM YYYY")}
//             </Text>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <Button
//               icon={<LeftOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.subtract(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//             <div
//               style={{
//                 padding: "6px 16px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: 6,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: "#1a1a1a",
//                 minWidth: 200,
//                 textAlign: "center",
//               }}
//             >
//               {currentDate.startOf("week").format("MMM DD")} –{" "}
//               {currentDate.endOf("week").format("MMM DD, YYYY")}
//             </div>
//             <Button
//               icon={<RightOutlined />}
//               onClick={() => {
//                 setCurrentDate(currentDate.add(1, "week"));
//               }}
//               type="text"
//               style={{ color: "#595959" }}
//             />
//           </div>

//           <div
//             style={{
//               marginLeft: "auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               padding: "6px 12px",
//               backgroundColor: "#fafafa",
//               borderRadius: 6,
//             }}
//           >
//             <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
//               {totalHours}h / 40h
//             </Text>
//             <Progress
//               percent={(totalHours / 40) * 100}
//               showInfo={false}
//               strokeColor={totalHours >= 40 ? "#52c41a" : "#1890ff"}
//               strokeWidth={6}
//               style={{ width: 80 }}
//             />
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <Button
//               icon={<SaveOutlined />}
//               htmlType="submit"
//               loading={saveDraftLoading}
//               onClick={handleSaveDraft}
//               disabled={isViewMode || status === "Submitted"}
//               style={{
//                 fontWeight: 600,
//                 border: "1px solid grey",
//                 color: "#595959",
//               }}
//             >
//               Save Draft
//             </Button>

//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={() => setIsSubmitOpen(true)}
//               style={{ minWidth: 100 }}
//             >
//               Submit
//             </Button>
//           </div>
//         </div>

//         <Divider />

//         {/* Leave Alert - Show if there are leaves this week */}
//         {weekLeaveCount > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 12,
//               background: "#fff1f0",
//               border: "1px solid #ffccc7",
//               borderRadius: 8,
//             }}
//           >
//             <Space>
//               <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
//               <Text strong style={{ color: "#ff4d4f" }}>
//                 Leave Alert:
//               </Text>
//               <Text>
//                 You have {weekLeaveCount} leave day(s) this week. Those days are
//                 disabled for timesheet entry.
//               </Text>
//             </Space>
//           </div>
//         )}

//         {/* Optional: Show leave dates for debugging - REMOVE in production */}
//         {/* {process.env.NODE_ENV === "development" && leaveDates.size > 0 && (
//           <div
//             style={{
//               marginBottom: 16,
//               padding: 8,
//               background: "#f0f5ff",
//               borderRadius: 4,
//             }}
//           >
//            <Text strong>
//               📅 Leave Dates: {Array.from(leaveDates).join(", ")}
//             </Text>
//             <Text strong>
//               {" "}
//               Current Week: {DAYS.map((d) => d.fullDate).join(", ")}
//             </Text>
//           </div>
//         )} */}

//         {/* 7 Day Cards */}
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             gap: "16px",
//             alignItems: "center",
//           }}
//         >
//           {DAYS.map((day) => {
//             const dayRows = getDayRows(day.label);
//             const dayTotal = getDayTotal(day.label);
//             const isLeaveDay = dayRows.some((r) => r.isLeave);
//             const isExpanded = expandedDays.has(day.label);

//             // 🔥 FIX: Use the pre-calculated isToday flag from DAYS
//             const isToday = day.isToday;

//             return (
//               <Card
//                 key={day.label}
//                 style={{
//                   borderRadius: "12px",
//                   border: isToday ? "2px solid #1890ff" : "1px solid #f0f0f0",
//                   backgroundColor: isLeaveDay ? "#fff2f0" : "#ffffff",
//                   width: "900px",
//                 }}
//                 bodyStyle={{ padding: "16px" }}
//               >
//                 {/* Card Header */}
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     cursor: "pointer",
//                   }}
//                   onClick={() => toggleDayExpand(day.label)}
//                 >
//                   {/* Left side - Day info */}
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "48px",
//                         height: "48px",
//                         backgroundColor: isToday
//                           ? "#1890ff"
//                           : isLeaveDay
//                             ? "#ff4d4f"
//                             : "#d9d9d9",
//                         borderRadius: "8px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         color: "white",
//                         fontSize: "20px",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       {day.dayNumber}
//                     </div>
//                     <div>
//                       <div style={{ fontSize: "18px", fontWeight: "600" }}>
//                         {day.label}
//                       </div>
//                       <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
//                         {day.date}, {day.year}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Right side - Actions and total */}
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     {!isLeaveDay && (
//                       <Button
//                         type="primary"
//                         icon={<PlusOutlined />}
//                         size="small"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           addEntry(day.label, day.fullDate);
//                         }}
//                         disabled={isViewMode}
//                       >
//                         Add Item
//                       </Button>
//                     )}
//                     <div style={{ fontSize: "16px", fontWeight: "600" }}>
//                       {dayTotal}h
//                     </div>
//                     {isExpanded ? <UpOutlined /> : <DownOutlined />}
//                   </div>
//                 </div>

//                 {/* Card Content - Table-like structure */}
//                 {isExpanded && (
//                   <div style={{ marginTop: "16px" }}>
//                     {/* Table Header */}
//                     {dayRows.length > 0 && (
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "12px",
//                           padding: "8px 12px",
//                           backgroundColor: "#fafafa",
//                           borderRadius: "8px 8px 0 0",
//                           borderBottom: "2px solid #f0f0f0",
//                           fontWeight: 600,
//                           fontSize: "12px",
//                           color: "#8c8c8c",
//                         }}
//                       >
//                         {!isLeaveDay &&
//                           (day.label === "Sat" || day.label === "Sun") && (
//                             <div style={{ width: 30 }}></div>
//                           )}
//                         <div style={{ width: 180 }}>PROJECT</div>
//                         <div style={{ width: 220 }}>TASKS</div>
//                         <div style={{ flex: 1 }}>DESCRIPTION</div>
//                         <div style={{ width: 100 }}>HOURS</div>
//                         <div style={{ width: 90 }}>BILLABLE</div>
//                         {!isViewMode && (
//                           <div style={{ width: 70 }}>ACTIONS</div>
//                         )}
//                       </div>
//                     )}

//                     {/* Table Rows */}
//                     {dayRows.length > 0 ? (
//                       dayRows.map((row) => renderEntryRow(row))
//                     ) : (
//                       <div
//                         style={{
//                           padding: "24px",
//                           textAlign: "center",
//                           color: "#8c8c8c",
//                           backgroundColor: "#fafafa",
//                           borderRadius: "8px",
//                         }}
//                       >
//                         {isLeaveDay ? (
//                           <div>
//                             <Tag color="red">Leave Day</Tag>
//                             <div style={{ marginTop: "8px" }}>
//                               No entries can be added on leave days
//                             </div>
//                           </div>
//                         ) : (
//                           <div>
//                             No time entries. Click 'Add Item' to log your time.
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </Card>
//             );
//           })}
//         </div>

//         {/* Footer Weekly Summary */}
//         <div
//           style={{
//             marginTop: 24,
//             padding: "16px 24px",
//             backgroundColor: "#fafafa",
//             borderRadius: "8px",
//             border: "1px solid #f0f0f0",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             width: "900px",
//             marginLeft: "auto", // These two lines
//             marginRight: "auto",
//           }}
//         >
//           <Text strong style={{ fontSize: "16px", color: "#262626" }}>
//             Week Total
//           </Text>
//           <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
//             <div>
//               <Text type="secondary" style={{ marginRight: 8 }}>
//                 Billable:
//               </Text>
//               <Text strong style={{ color: "#52c41a" }}>
//                 {totalBillable}h
//               </Text>
//             </div>
//             <div>
//               <Text type="secondary" style={{ marginRight: 8 }}>
//                 Total:
//               </Text>
//               <Text strong style={{ color: "#1890ff" }}>
//                 {totalHours}h
//               </Text>
//             </div>
//             {weekLeaveCount > 0 && (
//               <Tag color="red">{weekLeaveCount} Leave Day(s)</Tag>
//             )}
//           </div>
//         </div>

//         {/* Submit Modal - Keep exactly as is */}
//         <Modal
//           open={isSubmitOpen}
//           onCancel={() => setIsSubmitOpen(false)}
//           footer={null}
//           width={520}
//           centered
//           styles={{
//             body: {
//               paddingLeft: 16,
//               paddingRight: 16,
//               paddingTop: 24,
//               paddingBottom: 24,
//             },
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               gap: 12,
//               alignItems: "center",
//               margin: 0,
//             }}
//           >
//             <SendOutlined style={{ color: "#1677ff", fontSize: 20 }} />
//             <div>
//               <Text strong style={{ fontSize: 16 }}>
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Text>
//               <br />
//               <Text type="secondary">
//                 {isEditMode
//                   ? "Review and save your updated timesheet."
//                   : "Review your timesheet summary before submission."}
//               </Text>
//             </div>
//           </div>

//           <Divider />

//           {/* Summary cards */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
//             {/* Total Hours */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <ClockCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalHours}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Total Hours</div>
//             </div>

//             {/* Billable */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <DollarOutlined style={{ fontSize: 22, color: "#2fb344" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {totalBillable}h
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Billable</div>
//             </div>

//             {/* Entries */}
//             <div
//               style={{
//                 background: "#f2f5f8",
//                 borderRadius: 12,
//                 padding: 16,
//                 textAlign: "center",
//               }}
//             >
//               <FileTextOutlined style={{ fontSize: 22, color: "#6b7a99" }} />
//               <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
//                 {entryCount}
//               </div>
//               <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
//             </div>
//           </div>

//           {/* Projects */}
//           <div
//             style={{
//               background: "#f7f9fb",
//               borderRadius: 12,
//               padding: 16,
//             }}
//           >
//             <div style={{ fontWeight: 600, marginBottom: 8 }}>
//               Projects (
//               {
//                 new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ).size
//               }
//               )
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {[
//                 ...new Set(
//                   rows
//                     .filter((r) => !r.isLeave)
//                     .map((r) => r.projectName)
//                     .filter(Boolean),
//                 ),
//               ].map((projectName) => (
//                 <Tag
//                   key={projectName}
//                   style={{
//                     borderRadius: 999,
//                     padding: "4px 10px",
//                     background: "#fff",
//                   }}
//                 >
//                   {projectName}
//                 </Tag>
//               ))}
//             </div>
//           </div>

//           {/* Leave Info */}
//           {weekLeaveCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff1f0",
//                 color: "#ff4d4f",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <ClockCircleOutlined />
//               <span>
//                 You have {weekLeaveCount} leave day(s) this week. Leave days are
//                 automatically excluded.
//               </span>
//             </div>
//           )}

//           {/* Warning */}
//           {totalHours < expectedHours && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#fff7e6",
//                 color: "#fa8c16",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <WarningOutlined />
//               <span>
//                 Warning: You've logged {expectedHours - totalHours}h less than
//                 expected.
//               </span>
//             </div>
//           )}

//           {/* Footer Buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 24,
//             }}
//           >
//             <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
//             {!isPreviewMode && (
//               <Button
//                 type="primary"
//                 loading={isEditMode ? saveChangesLoading : submitLoading}
//                 icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
//                 onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
//               >
//                 {isEditMode ? "Save Changes" : "Submit Timesheet"}
//               </Button>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// }all working good

"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  TimesheetsService,
  TimesheetUser,
  Timesheet,
  CreateTimesheetData,
  UpdateTimesheetData,
  reviewTimesheet,
} from "@/services/timesheetService";
import { useQueryClient } from "@tanstack/react-query";
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
  App,
  Card,
  Collapse,
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
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useMemo, useState, useEffect, useRef } from "react";
import type { ColumnsType } from "antd/es/table";
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
// Import leave service
import leaveService from "@/services/leaveService";
import { useAuth } from "@/context/AuthContext";

const { Title, Text } = Typography;
const { Panel } = Collapse;
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

interface TimesheetRowUI {
  id?: string;
  key: string;
  day: string;
  date: string;
  projectId?: string;
  taskIds?: string[];
  description?: string;
  hours?: number;
  billable?: boolean;
  status?: "Draft" | "Submitted" | "Approved" | "Rejected";
  isSummary?: boolean;
  employeeName: string;
  projectName?: string;
  taskNames?: string[];
  isLeave?: boolean;
  leaveType?: string;
}

type SubmitTimesheetTabProps = {
  onSubmitted: () => void;
};

export default function SubmittimesheetTab({
  onSubmitted,
}: SubmitTimesheetTabProps) {
  // Get current user from auth context
  const { user } = useAuth();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Separate loading states for different actions
  const [saveDraftLoading, setSaveDraftLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [saveChangesLoading, setSaveChangesLoading] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
  const [status, setStatus] = useState<TimesheetStatus>("Draft");
  const [rows, setRows] = useState<TimesheetRowUI[]>([]);
  const [weekendEditable, setWeekendEditable] = useState<{
    [key: string]: boolean;
  }>({});

  type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [tasks, setTasks] = useState<
    { id: string; name: string; projectId: string }[]
  >([]);
  const [entryCount, setEntryCount] = useState(0);

  // State for leaves - use a Set for O(1) lookup
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  const [leaveDetails, setLeaveDetails] = useState<
    Map<string, { type: string; status: string }>
  >(new Map());
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const { data: allTimesheets } = useTimesheets();
  const isSubmittingRef = useRef(false);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // 🔹 FETCH leaves for the logged-in user - ONLY Casual Leave and Sick Leave
  const fetchMyLeaves = async () => {
    try {
      setLoadingLeaves(true);
      console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

      const response = await leaveService.getMyLeaves();

      console.log("✅ Leaves fetched successfully:", response);

      // Create a Set for dates and a Map for details
      const leaveDateSet = new Set<string>();
      const leaveDetailsMap = new Map<
        string,
        { type: string; status: string }
      >();

      // Check response structure
      if (response) {
        let leavesArray: any[] = [];

        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          leavesArray = response.data;
        } else if (Array.isArray(response)) {
          leavesArray = response;
        }

        // Filter for ONLY Casual Leave and Sick Leave
        const allowedLeaveTypes = ["casual_leave", "sick_leave"];

        // Loop through each leave
        leavesArray.forEach((leave: any) => {
          const leaveType = leave.type?.toLowerCase();
          const leaveStatus = leave.status?.toLowerCase();

          // Only include if:
          // 1. Leave type is Casual Leave or Sick Leave
          if (allowedLeaveTypes.includes(leaveType)) {
            const startDate = dayjs(leave.startDate);
            const endDate = dayjs(leave.endDate);

            console.log(
              `📅 Including ${leaveType} (${leaveStatus}) from ${leave.startDate} to ${leave.endDate}`,
            );

            // Add each day in the leave range
            let currentDate = startDate;
            while (
              currentDate.isBefore(endDate) ||
              currentDate.isSame(endDate, "day")
            ) {
              const dateStr = currentDate.format("YYYY-MM-DD");
              leaveDateSet.add(dateStr);
              leaveDetailsMap.set(dateStr, {
                type: leave.type,
                status: leave.status,
              });
              console.log(`  ✅ Added leave date: ${dateStr}`);
              currentDate = currentDate.add(1, "day");
            }
          } else {
            console.log(
              `❌ Excluding ${leave.type} (${leave.status}) - Not Casual/Sick Leave`,
            );
          }
        });
      }

      console.log("📋 Final Leave Dates Set:", Array.from(leaveDateSet));
      console.log("📋 Leave Details:", Object.fromEntries(leaveDetailsMap));

      setLeaveDates(leaveDateSet);
      setLeaveDetails(leaveDetailsMap);

      // After fetching leaves, refresh the rows for the current week
      refreshRowsForCurrentWeek();
    } catch (error: any) {
      console.error("❌ Failed to fetch leaves:", error);
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Function to refresh rows for the current week based on leave dates
  const refreshRowsForCurrentWeek = () => {
    if (!id && !sheet) {
      // We're in create mode, just create empty rows with leave info
      setRows(createEmptyRows());
    } else if (id && sheet) {
      // We're in edit mode, we need to preserve existing entries but update leave status
      setRows((prevRows) =>
        prevRows.map((row) => {
          const isLeave = isDateLeave(row.date);
          const leaveInfo = getLeaveInfo(row.date);

          if (isLeave && !row.isLeave) {
            // This row should be marked as leave
            return {
              ...row,
              isLeave: true,
              leaveType: leaveInfo?.type,
              description: `On leave (${leaveInfo?.type || "Leave"})`,
              hours: 0,
              projectId: undefined,
              taskIds: [],
              taskNames: [],
              billable: false,
            };
          } else if (!isLeave && row.isLeave) {
            // This row should no longer be leave
            return {
              ...row,
              isLeave: false,
              leaveType: undefined,
              description: "",
            };
          }
          return row;
        }),
      );
    }
  };

  useEffect(() => {
    if (user?.id) {
      console.log("🔄 Component mounted, user detected:", user.id);
      fetchMyLeaves();

      // ✅ Find which day in THIS week is actually today
      const todayInThisWeek = DAYS.find((day) => day.isToday)?.label;
      if (todayInThisWeek) {
        console.log("📅 Today in this week:", todayInThisWeek);
        setExpandedDays(new Set([todayInThisWeek]));
      } else {
        // Today's date is not in this week (e.g., looking at future/past week)
        setExpandedDays(new Set([]));
      }
    } else {
      console.log("⏳ Waiting for user to load...");
    }
  }, [user?.id]);

  // When date changes, refresh the rows to show leaves for the new week
  useEffect(() => {
    if (user?.id) {
      console.log(
        "📅 Date changed to:",
        currentDate.format("MMMM YYYY"),
        "Week:",
        currentDate.startOf("week").format("YYYY-MM-DD"),
        "to",
        currentDate.endOf("week").format("YYYY-MM-DD"),
      );

      // Refresh rows for the new week
      if (!id && !sheet) {
        // Create mode - create new empty rows
        setRows(createEmptyRows());

        // ✅ Find which day in THIS week is actually today
        const todayInThisWeek = DAYS.find((day) => day.isToday)?.label;
        if (todayInThisWeek) {
          setExpandedDays(new Set([todayInThisWeek]));
        } else {
          // Today's date is not in this week
          setExpandedDays(new Set([]));
        }
      } else {
        // Edit mode - update existing rows with leave status
        refreshRowsForCurrentWeek();

        // In edit mode, we still want today's card expanded along with any data cards
        // This will be handled in the sheet useEffect
      }
    }
  }, [currentDate, user?.id, leaveDates]);

  // Helper function to check if a date is a leave
  const isDateLeave = (date: string): boolean => {
    return leaveDates.has(date);
  };

  // Helper function to get leave info
  const getLeaveInfo = (
    date: string,
  ): { type: string; status: string } | undefined => {
    return leaveDetails.get(date);
  };

  // 🔹 FETCH single timesheet
  const createMutation = useCreateTimesheet();
  const updateMutation = useUpdateTimesheet();

  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ?? undefined;
  const { data: sheet, isLoading } = useTimesheetById(id);

  const mode = searchParams.get("mode") || "create";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const isPreviewMode = false;
  const timesheetId = searchParams.get("id");

  const isWeekend = (day: string) => day === "Sat" || day === "Sun";

  // Updated isFieldEditable to also check for leave and weekend toggle
  const isFieldEditable = (row: TimesheetRowUI) => {
    if (row.isLeave) return false; // Can't edit leave rows
    if (!isWeekend(row.day)) return true;
    // For weekend days, check if they've been enabled via the checkbox
    return weekendEditable[row.key] ?? false;
  };

  // 🔥 FIX: Add isToday flag to each day for dynamic highlighting
  const DAYS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = currentDate.startOf("week").add(i, "day");
      // Check if this day is TODAY's actual date (compare full date)
      const isToday = d.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");

      return {
        label: d.format("ddd"),
        date: d.format("MMM DD"),
        fullDate: d.format("YYYY-MM-DD"),
        dayNumber: d.format("D"),
        year: d.format("YYYY"),
        fullDateObj: d,
        isToday: isToday, // Add this flag
      };
    });
  }, [currentDate]);

  // Updated createEmptyRows to check for leaves
  const createEmptyRows = () =>
    DAYS.map((d) => {
      const isLeave = isDateLeave(d.fullDate);
      const leaveInfo = getLeaveInfo(d.fullDate);

      return {
        key: `${d.label}-${Date.now()}-${Math.random()}`,
        day: d.label,
        date: d.fullDate,
        projectId: undefined,
        taskIds: [],
        taskNames: [],
        description: isLeave ? `On leave (${leaveInfo?.type || "Leave"})` : "",
        hours: 0,
        billable: !isLeave, // Not billable if on leave
        status: "Draft" as const,
        employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
        isLeave: isLeave,
        leaveType: leaveInfo?.type,
      };
    });

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const meta = await TimesheetsService.getMeta();
        setProjects(meta?.projects || []);
        setTasks(meta?.tasks || []);
      } catch (error) {
        console.error("Error loading meta:", error);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const count = rows.filter(
      (row: TimesheetRowUI) =>
        !row.isLeave && // Don't count leave rows
        !!row.projectId &&
        row.taskIds &&
        row.taskIds.length > 0 &&
        Number(row.hours) > 0,
    ).length;
    setEntryCount(count);
  }, [rows]);

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
    if (sheet) {
      console.log("🎯 Sheet data received:", {
        id: sheet.id,
        weekStart: sheet.weekStart,
        status: sheet.status,
        rowsCount: sheet.rows?.length,
        user: sheet.user,
      });
    }
  }, [sheet]);

  useEffect(() => {
    if (tasks.length > 0) {
      console.log("📋 Available tasks:", tasks);
    }
  }, [tasks]);

  useEffect(() => {
    if (mode === "resubmit") {
      if (isSubmittingRef.current) return;
      setRows(createEmptyRows());
      setStatus("Draft");
      setIsSubmitted(false);
      return;
    }

    if (id && sheet) {
      if (!sheet || !projects.length || !tasks.length) return;

      const mappedRows: TimesheetRowUI[] = sheet.rows.map(
        (r: TimesheetRowAPI, index: number) => {
          const dayAbbr = dayjs(r.day).format("ddd");
          const projectFromName = projects.find(
            (p) => p.name === r.projectName,
          );

          let taskIds: string[] = [];
          let taskNames: string[] = [];

          const projectId = r.projectId || projectFromName?.id;

          if (r.taskId) {
            taskIds = [r.taskId];
            const task = tasks.find((t) => t.id === r.taskId);
            if (task) {
              taskNames = [task.name];
            } else if (r.taskName) {
              taskNames = [r.taskName];
            }
          } else if (r.taskName) {
            if (projectId) {
              const taskNameList = r.taskName
                .split(",")
                .map((name) => name.trim());

              taskNameList.forEach((name) => {
                const matchedTasks = tasks.filter(
                  (t) => t.projectId === projectId && t.name === name,
                );
                if (matchedTasks.length > 0) {
                  taskIds.push(...matchedTasks.map((t) => t.id));
                  taskNames.push(...matchedTasks.map((t) => t.name));
                } else {
                  taskNames.push(name);
                }
              });
            } else {
              taskNames = r.taskName.split(",").map((name) => name.trim());
            }
          }

          const rowDate = dayjs(r.day);
          const dateStr = rowDate.format("YYYY-MM-DD");

          // Check if this date is a leave
          const isLeave = isDateLeave(dateStr);
          const leaveInfo = getLeaveInfo(dateStr);

          return {
            key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
            id: r.id,
            day: rowDate.format("ddd"),
            date: dateStr,
            projectId: projectId,
            taskIds: taskIds,
            description: isLeave
              ? `On leave (${leaveInfo?.type || "Leave"})`
              : r.description,
            hours: isLeave ? 0 : r.hours,
            billable: isLeave ? false : r.billable,
            status: mapBackendStatusToUI(sheet.status),
            projectName:
              projects.find((p) => p.id === projectId)?.name ||
              r.projectName ||
              "",
            taskNames: taskNames,
            employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
            isLeave: isLeave,
            leaveType: leaveInfo?.type,
          };
        },
      );

      setRows(mappedRows);
      setStatus(mapBackendStatusToUI(sheet.status));
      setIsSubmitted(sheet.status === "SUBMITTED");
      setCurrentDate(dayjs(sheet.weekStart));

      // 🔥 FIX: Find all days that have data AND ensure today is also expanded
      const daysToExpand = new Set<string>();

      // Add today's day (always expand today)
      // const today = dayjs().format("ddd");
      // daysToExpand.add(today);

      // Check each row to see if it has data and add those days
      mappedRows.forEach((row) => {
        // A row has data if it has project/task or is a leave day
        const hasData =
          row.projectId ||
          (row.taskIds && row.taskIds.length > 0) ||
          row.description ||
          (row.hours && row.hours > 0) ||
          row.isLeave;

        if (hasData) {
          daysToExpand.add(row.day);
        }
      });

      console.log(
        "📅 Days to expand (including today):",
        Array.from(daysToExpand),
      );

      // Update expanded days
      setExpandedDays(daysToExpand);

      return;
    }

    if (!id) {
      setRows(createEmptyRows());
      setStatus("Draft");
    }
  }, [id, mode, sheet, projects, tasks, user]);

  useEffect(() => {
    console.log("📊 Data loading status:", {
      id,
      hasSheet: !!sheet,
      leaveDatesSize: leaveDates.size,
      rowsLength: rows.length,
      mode,
    });
  }, [id, sheet, leaveDates, rows.length, mode]);

  // Update rows when leaveDates change (for existing sheets)
  useEffect(() => {
    if (id && sheet && leaveDates.size > 0) {
      refreshRowsForCurrentWeek();
    }
  }, [leaveDates, id, sheet]);

  useEffect(() => {
    if (!projects.length || !tasks.length) return;

    setRows((prev) =>
      prev.map((r) => {
        // Don't update leave rows
        if (r.isLeave) return r;

        const updatedProjectName = r.projectId
          ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
          : r.projectName;

        let updatedTaskNames = r.taskNames;
        if (r.taskIds && r.taskIds.length > 0) {
          const foundTasks = r.taskIds
            .map((id) => tasks.find((t) => t.id === id))
            .filter(Boolean) as {
            id: string;
            name: string;
            projectId: string;
          }[];

          if (foundTasks.length > 0) {
            updatedTaskNames = foundTasks.map((t) => t.name);
          }
        }

        return {
          ...r,
          projectName: updatedProjectName,
          taskNames: updatedTaskNames,
        };
      }),
    );
  }, [projects, tasks]);

  const updateRow = (key: string, patch: Partial<TimesheetRowUI>) => {
    setRows((prev) =>
      prev.map((r) => {
        // Don't allow updates on leave rows
        if (r.isLeave) return r;

        if (r.key === key) {
          const updated = { ...r, ...patch };

          if (patch.projectId && patch.projectId !== r.projectId) {
            updated.taskIds = [];
            updated.taskNames = [];
          }

          if (patch.date) {
            setCurrentDate(dayjs(patch.date).startOf("week"));
          }

          return updated;
        }
        return r;
      }),
    );
  };
  // Add this with your other useRef declarations
  const isAddingEntry = useRef(false);
  const addEntry = (day: string, date: string) => {
    // Don't allow adding entries on leave days
    if (isDateLeave(date)) {
      message.warning("Cannot add entry on a leave day");
      return;
    }

    // ✅ THIS PREVENTS DOUBLE ADD FROM STRICT MODE
    if (isAddingEntry.current) {
      console.log("Preventing double add");
      return;
    }

    isAddingEntry.current = true;

    const newKey = `${day}-${Date.now()}-${Math.random()}`;

    setRows((prev) => [
      ...prev,
      {
        key: newKey,
        day,
        date,
        hours: 0,
        billable: true,
        status: "Draft",
        taskIds: [],
        taskNames: [],
        employeeName: sheet?.user?.name ?? user?.name ?? "Unknown Employee",
        isLeave: false,
      },
    ]);

    // Auto-expand the day when adding an entry
    setExpandedDays((prev) => new Set([...prev, day]));

    // Reset the flag after a short delay
    setTimeout(() => {
      isAddingEntry.current = false;
    }, 500);
  };

  const handleCopyRow = (row: TimesheetRowUI) => {
    // Don't allow copying leave rows
    if (row.isLeave) {
      message.warning("Cannot copy leave entry");
      return;
    }

    setRows((prev) => [
      ...prev,
      {
        ...row,
        key: `${row.day}-${Date.now()}-${Math.random()}`,
        id: undefined,
        taskIds: [...(row.taskIds || [])],
        taskNames: [...(row.taskNames || [])],
      },
    ]);
  };

  const handleDeleteRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  const getDayRows = (dayLabel: string) => {
    return rows.filter((r) => r.day === dayLabel && !r.isSummary);
  };

  const getDayTotal = (dayLabel: string) => {
    const dayRows = rows.filter((r) => r.day === dayLabel && !r.isSummary);
    return dayRows.reduce((sum, r) => sum + (r.hours || 0), 0);
  };

  const getAvailableTasks = (projectId?: string) => {
    if (!projectId) return [];
    return tasks.filter((t) => t.projectId === projectId);
  };

  const toggleDayExpand = (day: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const totalHours = rows
    .filter((r) => !r.isLeave)
    .reduce((sum, r) => sum + (r.hours || 0), 0);
  const totalBillable = rows
    .filter((r) => !r.isLeave)
    .reduce((sum, r) => sum + (r.billable ? r.hours || 0 : 0), 0);
  const expectedHours = 40;

  const handleSaveDraft = async () => {
    try {
      setSaveDraftLoading(true);
      const existing = allTimesheets?.data?.find(
        (t: Timesheet) =>
          t.user?.id === sheet?.user?.id &&
          dayjs(t.weekStart).format("YYYY-MM-DD") ===
            currentDate.startOf("week").format("YYYY-MM-DD"),
      );

      // Calculate leave count
      const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
      const leaveCount = leaveRows.length;

      // Include leave rows in payload
      const rowsForPayload = rows
        .filter((r) => !r.isSummary)
        .map((r) => {
          if (r.isLeave) {
            return {
              day: new Date(`${r.date}T00:00:00Z`),
              projectId: undefined,
              taskId: undefined,
              projectName: "",
              taskName: "",
              description:
                r.description || `On leave (${r.leaveType || "Leave"})`,
              hours: 0,
              billable: false,
            };
          } else {
            return {
              day: new Date(`${r.date}T00:00:00Z`),
              projectId: r.projectId,
              taskId:
                r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
              projectName: r.projectName || "",
              taskName:
                r.taskNames && r.taskNames.length > 0
                  ? r.taskNames.join(", ")
                  : "",
              description: r.description || "",
              hours: r.hours || 0,
              billable: r.billable ?? true,
            };
          }
        });

      const payload = {
        weekStart: currentDate.startOf("week").toISOString(),
        weekEnd: currentDate.endOf("week").toISOString(),
        rows: rowsForPayload,
        totalHours,
        totalBillable,
        status: "DRAFT",
        leaveCount,
      };

      console.log("📦 DRAFT PAYLOAD with leaveCount:", payload);

      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      message.success("Draft saved successfully");
      setStatus("Draft");
      onSubmitted();
    } catch (err) {
      message.error("This timesheet already submitted ");
    } finally {
      setSaveDraftLoading(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    console.log("🚀 ===== SUBMIT TIMESHEET STARTED =====");
    isSubmittingRef.current = true;

    try {
      setSubmitLoading(true);

      const weekStartStr = currentDate.startOf("week").format("YYYY-MM-DD");
      const existing = allTimesheets?.data?.find(
        (t: Timesheet) =>
          t.user?.id === sheet?.user?.id &&
          dayjs(t.weekStart).format("YYYY-MM-DD") === weekStartStr,
      );

      if (existing && existing.status === "SUBMITTED") {
        message.warning("This timesheet is already submitted");
        return;
      }

      // Calculate leave count from rows that are marked as leave
      const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
      const leaveCount = leaveRows.length;

      console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);
      console.log(
        "📊 LEAVE ROWS:",
        leaveRows.map((r) => ({
          date: r.date,
          day: r.day,
          leaveType: r.leaveType,
        })),
      );

      // IMPORTANT: Do NOT filter out leave rows for the payload
      const rowsForPayload = rows
        .filter((r) => !r.isSummary) // Only filter out summary rows, keep leave rows
        .map((r) => {
          if (r.isLeave) {
            return {
              id: r.id,
              day: new Date(`${r.date}T00:00:00Z`),
              projectId: undefined,
              taskId: undefined,
              projectName: "",
              taskName: "",
              description:
                r.description || `On leave (${r.leaveType || "Leave"})`,
              hours: 0,
              billable: false,
              isLeave: true,
            };
          } else {
            return {
              id: r.id,
              day: new Date(`${r.date}T00:00:00Z`),
              projectId: r.projectId,
              taskId:
                r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
              projectName: r.projectName || "",
              taskName:
                r.taskNames && r.taskNames.length > 0
                  ? r.taskNames.join(", ")
                  : "",
              description: r.description || "",
              hours: r.hours || 0,
              billable: r.billable ?? true,
              isLeave: false,
            };
          }
        });

      console.log(
        "📦 ROWS FOR PAYLOAD:",
        rowsForPayload.map((r) => ({
          date: r.day,
          isLeave: r.isLeave,
          hours: r.hours,
          description: r.description,
        })),
      );

      let timesheetId: string;
      let savedTimesheet;

      if (existing) {
        console.log("🔄 UPDATING EXISTING TIMESHEET - ID:", existing.id);
        const updateData = {
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
          totalHours,
          totalBillable,
          leaveCount,
        };

        console.log("📦 UPDATE PAYLOAD:", JSON.stringify(updateData, null, 2));

        savedTimesheet = await updateMutation.mutateAsync({
          id: existing.id,
          data: updateData,
        });
        timesheetId = existing.id;
      } else {
        console.log("🔄 CREATING NEW TIMESHEET");
        const createData = {
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
          totalHours,
          totalBillable,
          leaveCount,
        };

        console.log("📦 CREATE PAYLOAD:", JSON.stringify(createData, null, 2));

        savedTimesheet = await createMutation.mutateAsync(createData);
        timesheetId = savedTimesheet.id;
      }

      console.log("✅ TIMESHEET SAVED WITH ID:", timesheetId);
      console.log("✅ TIMESHEET DATA AFTER SAVE:", {
        id: savedTimesheet.id,
        leaveCount: savedTimesheet.leaveCount,
        status: savedTimesheet.status,
      });

      if (!timesheetId) throw new Error("Timesheet ID missing");

      try {
        await TimesheetsService.submitTimesheet(timesheetId);
        console.log("✅ TIMESHEET SUBMITTED SUCCESSFULLY");
      } catch (submitError) {
        console.warn("⚠️ SUBMIT API ERROR:", submitError);
      }

      setIsSubmittedModalOpen(true);
      setIsSubmitted(true);
      setStatus("Submitted");
      setIsSubmitOpen(false);

      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          status: "Submitted" as const,
        })),
      );

      message.success("Timesheet submitted successfully!");

      await queryClient.invalidateQueries({
        queryKey: ["timesheets"],
      });
      onSubmitted();
    } catch (err) {
      console.error("❌ SUBMIT FAILURE:", err);
      message.error("This timesheet is already submitted");
    } finally {
      setSubmitLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSaveChanges = async () => {
    if (!timesheetId) return;
    console.log("ROWS STATE BEFORE SAVE", rows);

    try {
      setSaveChangesLoading(true);

      // Calculate leave count
      const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
      const leaveCount = leaveRows.length;

      console.log(
        "📊 LEAVE ROWS FOUND:",
        leaveRows.map((r) => ({
          date: r.date,
          leaveType: r.leaveType,
        })),
      );
      console.log("📊 LEAVE COUNT:", leaveCount);

      // Include leave rows in payload, don't filter them out
      const rowsForPayload = rows
        .filter((r) => !r.isSummary)
        .map((r) => {
          if (r.isLeave) {
            return {
              id: r.id,
              day: new Date(`${r.date}T00:00:00Z`),
              taskId: undefined,
              projectId: undefined,
              description:
                r.description || `On leave (${r.leaveType || "Leave"})`,
              hours: 0,
              billable: false,
              projectName: "",
              taskName: "",
            };
          } else {
            return {
              id: r.id,
              day: new Date(`${r.date}T00:00:00Z`),
              taskId:
                r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
              projectId: r.projectId,
              description: r.description || "",
              hours: r.hours || 0,
              billable: r.billable || false,
              projectName: r.projectName || "",
              taskName:
                r.taskNames && r.taskNames.length > 0
                  ? r.taskNames.join(", ")
                  : "",
            };
          }
        });

      const updatePayload = {
        weekStart: dayjs(currentDate).startOf("week").toDate(),
        weekEnd: dayjs(currentDate).endOf("week").toDate(),
        rows: rowsForPayload,
        totalHours,
        totalBillable,
        status: "SUBMITTED",
        leaveCount,
      };

      console.log("📦 UPDATE PAYLOAD with leaveCount:", updatePayload);

      await updateMutation.mutateAsync({
        id: timesheetId,
        data: updatePayload,
      });

      message.success("Timesheet edited successfully");
      setIsSubmitOpen(false);
      onSubmitted();
    } catch (err: any) {
      console.error("Save changes failed:", err);
    } finally {
      setSaveChangesLoading(false);
    }
  };

  const weekLeaveCount = useMemo(() => {
    return rows.filter((r) => r.isLeave && !r.isSummary).length;
  }, [rows]);

  // Render entry row for a day
  const renderEntryRow = (row: TimesheetRowUI) => {
    const isLeave = row.isLeave;
    const isWeekendDay = row.day === "Sat" || row.day === "Sun";

    return (
      <div
        key={row.key}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          backgroundColor: isLeave ? "#fff2f0" : "#ffffff",
          borderRadius: "8px",
          marginBottom: "8px",
          border: isLeave ? "1px solid #ffccc7" : "1px solid #f0f0f0",
          opacity: isWeekendDay && !isFieldEditable(row) ? 0.7 : 1,
        }}
      >
        {isLeave && (
          <Tag color="red" style={{ marginRight: 4, fontWeight: "bold" }}>
            LEAVE
          </Tag>
        )}

        {/* Weekend checkbox indicator */}
        {isWeekendDay && !isLeave && (
          <Checkbox
            checked={weekendEditable[row.key] || false}
            onChange={(e) => {
              setWeekendEditable((prev) => ({
                ...prev,
                [row.key]: e.target.checked,
              }));
            }}
            style={{ marginRight: 4 }}
          />
        )}

        <Tooltip
          title={
            isWeekendDay && !isFieldEditable(row) && !isLeave
              ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
              : ""
          }
        >
          <Select
            disabled={isViewMode || !isFieldEditable(row) || isLeave}
            bordered={false}
            value={row.projectId}
            placeholder={isLeave ? "Leave day" : "Project"}
            style={{ width: 180 }}
            options={projects.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            onChange={(projectId) => {
              const selected = projects.find((p) => p.id === projectId);
              updateRow(row.key, {
                projectId,
                projectName: selected?.name,
                taskIds: [],
                taskNames: [],
              });
            }}
          />
        </Tooltip>

        <Tooltip
          title={
            isWeekendDay && !isFieldEditable(row) && !isLeave
              ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
              : ""
          }
        >
          <Select
            mode="multiple"
            allowClear
            bordered={false}
            value={row.taskIds}
            placeholder={isLeave ? "Leave day" : "Select tasks"}
            style={{ width: 220 }}
            disabled={
              !row.projectId || isViewMode || !isFieldEditable(row) || isLeave
            }
            options={getAvailableTasks(row.projectId).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            onChange={(taskIds: string[]) => {
              const selectedTasks = tasks.filter((t) => taskIds.includes(t.id));
              updateRow(row.key, {
                taskIds,
                taskNames: selectedTasks.map((t) => t.name),
              });
            }}
          />
        </Tooltip>

        <Tooltip
          title={
            isWeekendDay && !isFieldEditable(row) && !isLeave
              ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
              : ""
          }
        >
          <Input
            placeholder="Description"
            value={row.description}
            onChange={(e) =>
              updateRow(row.key, { description: e.target.value })
            }
            disabled={isLeave || !isFieldEditable(row)}
            style={{ flex: 1 }}
            bordered={false}
          />
        </Tooltip>

        <Tooltip
          title={
            isWeekendDay && !isFieldEditable(row) && !isLeave
              ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
              : ""
          }
        >
          <InputNumber<number>
            min={0}
            max={24}
            step={0.5}
            value={row.hours}
            disabled={isLeave || !isFieldEditable(row)}
            controls
            onChange={(value) => {
              if (!isLeave) {
                updateRow(row.key, {
                  hours: value ?? 0,
                });
              }
            }}
            style={{ width: 100 }}
          />
        </Tooltip>

        <Tooltip
          title={
            isWeekendDay && !isFieldEditable(row) && !isLeave
              ? "This day is disabled. Click the checkbox to enable and fill the timesheet."
              : ""
          }
        >
          <Switch
            disabled={isViewMode || !isFieldEditable(row) || isLeave}
            checked={row.billable}
            onChange={(v) => !isLeave && updateRow(row.key, { billable: v })}
          />
        </Tooltip>

        {!isViewMode && !isLeave && (
          <Space>
            <Tooltip
              title={
                isWeekendDay && !isFieldEditable(row)
                  ? "Enable the day first to copy"
                  : "Copy entry"
              }
            >
              <SnippetsOutlined
                style={{
                  color: isFieldEditable(row) ? "green" : "#ccc",
                  cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
                }}
                onClick={() => isFieldEditable(row) && handleCopyRow(row)}
              />
            </Tooltip>
            <Tooltip
              title={
                isWeekendDay && !isFieldEditable(row)
                  ? "Enable the day first to delete"
                  : "Delete entry"
              }
            >
              <DeleteOutlined
                style={{
                  color: isFieldEditable(row) ? "red" : "#ccc",
                  cursor: isFieldEditable(row) ? "pointer" : "not-allowed",
                }}
                onClick={() => isFieldEditable(row) && handleDeleteRow(row.key)}
              />
            </Tooltip>
          </Space>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ padding: 30 }}>
        {/* Main White Container Card */}
        <Card
          style={{
            borderRadius: "16px",
            //boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#ffffff",
            marginBottom: 24,
          }}
          bodyStyle={{ padding: "24px" }}
        >
          {/* Header - Sticky */}
          <div
            className="timesheet-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
              position: "sticky",
              top: 0,
              backgroundColor: "#ffffff",
              zIndex: 10,
              paddingBottom: "16px",
              borderBottom: "1px solid #f0f0f0",
              marginBottom: "24px",
            }}
          >
            <div>
              <Title level={3} style={{ margin: 0, color: "#262626" }}>
                {isEditMode ? `Edit Timesheet` : `My Timesheet`}
              </Title>
              <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
                {currentDate.format("MMMM YYYY")}
              </Text>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => {
                  setCurrentDate(currentDate.subtract(1, "week"));
                }}
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
                onClick={() => {
                  setCurrentDate(currentDate.add(1, "week"));
                }}
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
              <Button
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={saveDraftLoading}
                onClick={handleSaveDraft}
                disabled={isViewMode || status === "Submitted"}
                style={{
                  fontWeight: 600,
                  border: "1px solid grey",
                  color: "#595959",
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
          </div>

          {/* Leave Alert - Show if there are leaves this week */}
          {weekLeaveCount > 0 && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: "#fff1f0",
                border: "1px solid #ffccc7",
                borderRadius: 8,
              }}
            >
              <Space>
                <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
                <Text strong style={{ color: "#ff4d4f" }}>
                  Leave Alert:
                </Text>
                <Text>
                  You have {weekLeaveCount} leave day(s) this week. Those days
                  are disabled for timesheet entry.
                </Text>
              </Space>
            </div>
          )}

          {/* 7 Day Cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {DAYS.map((day) => {
              const dayRows = getDayRows(day.label);
              const dayTotal = getDayTotal(day.label);
              const isLeaveDay = dayRows.some((r) => r.isLeave);
              const isExpanded = expandedDays.has(day.label);
              const isToday = day.isToday;

              return (
                <Card
                  key={day.label}
                  className="hover-card"
                  style={{
                    borderRadius: "12px",
                    border: isToday ? "2px solid #1890ff" : "1px solid #e8e8e8",
                    backgroundColor: isLeaveDay ? "#fff2f0" : "#ffffff",
                    width: "900px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                    cursor: "pointer",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    onClick={() => toggleDayExpand(day.label)}
                  >
                    {/* Left side - Day info */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      {/* <div
                        style={{
                          width: "38px",
                          height: "38px",
                          backgroundColor: isToday
                            ? "#1890ff"
                            : isLeaveDay
                              ? "#ff4d4f"
                              : "#f0f0f0",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isToday || isLeaveDay ? "white" : "#595959",
                          fontSize: "15px",
                          fontWeight: "bold",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        {day.dayNumber}
                      </div> */}
                      <div
  style={{
    width: "38px",
    height: "38px",
    backgroundColor: isToday
      ? "#1890ff"
      : isLeaveDay
      ? "#ff4d4f"
      : "#f0f0f0",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: isToday || isLeaveDay ? "white" : "#595959",
    fontSize: "12px",
    fontWeight: "bold",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    gap: "2px"
  }}
>
  <CalendarOutlined style={{ fontSize: "12px" }} />
  <span>{day.dayNumber}</span>
</div>

                      <div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#262626",
                            display: "flex",
                            gap: "5px",
                          }}
                        >
                          {day.label}

                          {isLeaveDay && (
                            <>
                              {dayRows
                                .filter((r) => r.isLeave)
                                .map((leaveRow, index) => (
                                  <Tag
                                    key={index}
                                    color={
                                      leaveRow.leaveType === "sick_leave"
                                        ? "orange"
                                        : "red"
                                    }
                                    icon={<ClockCircleOutlined />}
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "bold",
                                      padding: "2px 8px",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    {leaveRow.leaveType === "sick_leave"
                                      ? "Sick Leave"
                                      : leaveRow.leaveType === "casual_leave"
                                        ? "Casual Leave"
                                        : "Leave"}
                                  </Tag>
                                ))}
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
                          {day.date}, {day.year}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions and total */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      {!isLeaveDay && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            addEntry(day.label, day.fullDate);
                          }}
                          disabled={isViewMode}
                          style={{
                            boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
                          }}
                        >
                          Add Item
                        </Button>
                      )}
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: isToday ? "#1890ff" : "#595959",
                          backgroundColor: "#f5f5f5",
                          padding: "4px 12px",
                          borderRadius: "20px",
                        }}
                      >
                        {dayTotal}h
                      </div>
                      <div style={{ color: "#8c8c8c" }}>
                        {isExpanded ? <UpOutlined /> : <DownOutlined />}
                      </div>
                    </div>
                  </div>

                  {/* Card Content - Table-like structure */}
                  {isExpanded && (
                    <div style={{ marginTop: "20px" }}>
                      {/* Table Header */}
                      {dayRows.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            backgroundColor: "#fafafa",
                            borderRadius: "8px 8px 0 0",
                            borderBottom: "2px solid #e8e8e8",
                            fontWeight: 600,
                            fontSize: "12px",
                            color: "#8c8c8c",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {!isLeaveDay &&
                            (day.label === "Sat" || day.label === "Sun") && (
                              <div style={{ width: 30 }}></div>
                            )}
                          <div style={{ width: 180 }}>PROJECT</div>
                          <div style={{ width: 220 }}>TASKS</div>
                          <div style={{ flex: 1 }}>DESCRIPTION</div>
                          <div style={{ width: 100 }}>HOURS</div>
                          <div style={{ width: 90 }}>BILLABLE</div>
                          {!isViewMode && (
                            <div style={{ width: 70 }}>ACTIONS</div>
                          )}
                        </div>
                      )}

                      {/* Table Rows */}
                      {dayRows.length > 0 ? (
                        dayRows.map((row) => renderEntryRow(row))
                      ) : (
                        <div
                          style={{
                            padding: "32px",
                            textAlign: "center",
                            color: "#8c8c8c",
                            backgroundColor: "#fafafa",
                            borderRadius: "8px",
                            border: "1px dashed #d9d9d9",
                          }}
                        >
                          {isLeaveDay ? (
                            <div>
                              <Tag color="red" style={{ marginBottom: 8 }}>
                                Leave Day
                              </Tag>
                              <div>No entries can be added on leave days</div>
                            </div>
                          ) : (
                            <div>
                              <ClockCircleOutlined
                                style={{
                                  fontSize: 24,
                                  marginBottom: 8,
                                  color: "#bfbfbf",
                                }}
                              />
                              <div>
                                No time entries. Click 'Add Item' to log your
                                time.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Footer Weekly Summary */}
          <div
            style={{
              marginTop: 32,
              padding: "20px 32px",
              backgroundColor: "#fafafa",
              borderRadius: "12px",
              border: "1px solid #e8e8e8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "900px",
              marginLeft: "auto",
              marginRight: "auto",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Text strong style={{ fontSize: "18px", color: "#262626" }}>
              Week Total
            </Text>
            <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
              <div>
                <Text
                  type="secondary"
                  style={{ marginRight: 8, fontSize: "14px" }}
                >
                  Billable:
                </Text>
                <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                  {totalBillable}h
                </Text>
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ marginRight: 8, fontSize: "14px" }}
                >
                  Total:
                </Text>
                <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                  {totalHours}h
                </Text>
              </div>
              {weekLeaveCount > 0 && (
                <Tag color="red" icon={<ClockCircleOutlined />}>
                  {weekLeaveCount} Leave Day(s)
                </Tag>
              )}
            </div>
          </div>
        </Card>

        {/* Submit Modal */}
        <Modal
          open={isSubmitOpen}
          onCancel={() => setIsSubmitOpen(false)}
          footer={null}
          width={520}
          centered
          styles={{
            body: {
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 24,
              paddingBottom: 24,
            },
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
                {entryCount}
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
              {
                new Set(
                  rows
                    .filter((r) => !r.isLeave)
                    .map((r) => r.projectName)
                    .filter(Boolean),
                ).size
              }
              )
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                ...new Set(
                  rows
                    .filter((r) => !r.isLeave)
                    .map((r) => r.projectName)
                    .filter(Boolean),
                ),
              ].map((projectName) => (
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
              ))}
            </div>
          </div>

          {/* Leave Info */}
          {weekLeaveCount > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: "#fff1f0",
                color: "#ff4d4f",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <ClockCircleOutlined />
              <span>
                You have {weekLeaveCount} leave day(s) this week. Leave days are
                automatically excluded.
              </span>
            </div>
          )}

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
                loading={isEditMode ? saveChangesLoading : submitLoading}
                icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
                onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
              >
                {isEditMode ? "Save Changes" : "Submit Timesheet"}
              </Button>
            )}
          </div>
        </Modal>
      </div>
    </>
  );
}
