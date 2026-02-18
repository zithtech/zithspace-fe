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
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

interface TimesheetRowUI {
  id?: string;
  key: string;
  day: string;
  date: string;
  projectId?: string;
  taskIds?: string[]; // Changed from taskId to taskIds for multiple selection
  description?: string;
  hours?: number;
  billable?: boolean;
  status?: "Draft" | "Submitted" | "Approved" | "Rejected";
  isSummary?: boolean;
  employeeName: string;
  projectName?: string;
  taskNames?: string[]; // Changed from taskName to taskNames
}

const tableStyles = `
  .ant-table-wrapper {
    box-shadow: none !important;
  }
  .ant-table {
    box-shadow: none !important;
  }
  .ant-table-container {
    box-shadow: none !important;
  }
  .ant-table-cell {
    box-shadow: none !important;
  }
  .ant-table-row {
    box-shadow: none !important;
  }
`;

type SubmitTimesheetTabProps = {
  onSubmitted: () => void;
};

export default function SubmittimesheetTab({
  onSubmitted,
}: SubmitTimesheetTabProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
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
  
  const { data: allTimesheets } = useTimesheets();
  const isSubmittingRef = useRef(false);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

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
  const isFieldEditable = (row: TimesheetRowUI) => {
    if (!isWeekend(row.day)) return true;
    return weekendEditable[row.key] ?? false;
  };

  const DAYS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = currentDate.startOf("week").add(i, "day");
      return {
        label: d.format("ddd"),
        date: d.format("MMM DD"),
        fullDate: d.format("YYYY-MM-DD"),
      };
    });
  }, [currentDate]);

  const createEmptyRows = () =>
    DAYS.map((d) => {
      return {
        key: `${d.label}-${Date.now()}-${Math.random()}`,
        day: d.label,
        date: d.fullDate,
        projectId: undefined,
        taskIds: [], // Initialize as empty array
        taskNames: [],
        description: "",
        hours: 0,
        billable: true,
        status: "Draft" as const,
        employeeName: sheet?.user?.name || "Unknown Employee",
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
        !!row.projectId && 
        row.taskIds && 
        row.taskIds.length > 0 && // Check if at least one task is selected
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

  // Debug logs
  useEffect(() => {
    if (sheet) {
      console.log("🎯 Sheet data received:", {
        id: sheet.id,
        weekStart: sheet.weekStart,
        status: sheet.status,
        rowsCount: sheet.rows?.length,
        rows: sheet.rows?.map(r => ({
          id: r.id,
          day: r.day,
          taskId: r.taskId,
          taskName: r.taskName,
          projectId: r.projectId,
          projectName: r.projectName
        })),
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
    if (rows.length > 0) {
      console.log("📝 Mapped rows:", rows.map(r => ({
        key: r.key,
        day: r.day,
        taskIds: r.taskIds,
        taskNames: r.taskNames,
        projectId: r.projectId
      })));
    }
  }, [rows]);

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

          // FIXED: Properly handle multiple tasks
          let taskIds: string[] = [];
          let taskNames: string[] = [];
          
          // Get the correct project ID
          const projectId = r.projectId || projectFromName?.id;
          
          if (r.taskId) {
            // If single taskId exists
            taskIds = [r.taskId];
            const task = tasks.find(t => t.id === r.taskId);
            if (task) {
              taskNames = [task.name];
            } else if (r.taskName) {
              taskNames = [r.taskName];
            }
          } else if (r.taskName) {
            // Try to find tasks by name for this project
            if (projectId) {
              // Handle comma-separated task names
              const taskNameList = r.taskName.split(',').map(name => name.trim());
              
              taskNameList.forEach(name => {
                const matchedTasks = tasks.filter(
                  t => t.projectId === projectId && t.name === name
                );
                if (matchedTasks.length > 0) {
                  taskIds.push(...matchedTasks.map(t => t.id));
                  taskNames.push(...matchedTasks.map(t => t.name));
                } else {
                  // If no match found, just use the taskName
                  taskNames.push(name);
                }
              });
            } else {
              // If no project ID, just use the taskName as is
              taskNames = r.taskName.split(',').map(name => name.trim());
            }
          }
          
          const rowDate = dayjs(r.day);

          return {
            key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
            id: r.id,
            day: rowDate.format("ddd"),
            date: rowDate.format("YYYY-MM-DD"),
            projectId: projectId,
            taskIds: taskIds, // Now properly populated
            description: r.description,
            hours: r.hours,
            billable: r.billable,
            status: mapBackendStatusToUI(sheet.status),
            projectName: projects.find((p) => p.id === projectId)?.name || r.projectName || "",
            taskNames: taskNames, // Now properly populated
            employeeName: sheet.user?.name ?? "Unknown Employee",
          };
        },
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
  }, [id, mode, sheet, projects, tasks]);

  useEffect(() => {
    if (!projects.length || !tasks.length) return;

    setRows((prev) =>
      prev.map((r) => {
        // Update project name based on projectId
        const updatedProjectName = r.projectId
          ? projects.find((p) => p.id === r.projectId)?.name || r.projectName
          : r.projectName;
        
        // Update task names based on taskIds
        let updatedTaskNames = r.taskNames;
        if (r.taskIds && r.taskIds.length > 0) {
          // Only update if we have matching tasks
          const foundTasks = r.taskIds
            .map(id => tasks.find((t) => t.id === id))
            .filter(Boolean) as { id: string; name: string; projectId: string }[];
          
          if (foundTasks.length > 0) {
            updatedTaskNames = foundTasks.map(t => t.name);
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
        if (r.key === key) {
          const updated = { ...r, ...patch };

          // If project changes, reset tasks
          if (patch.projectId && patch.projectId !== r.projectId) {
            updated.taskIds = [];
            updated.taskNames = [];
          }

          // If date changes, update currentDate
          if (patch.date) {
            setCurrentDate(dayjs(patch.date).startOf("week"));
          }

          return updated;
        }
        return r;
      }),
    );
  };

  const addEntry = (day: string, date: string) => {
    setRows((prev) => [
      ...prev,
      {
        key: `${day}-${Date.now()}-${Math.random()}`,
        day,
        date,
        hours: 0,
        billable: true,
        status: "Draft",
        taskIds: [],
        taskNames: [],
        employeeName: sheet?.user?.name ?? "Unknown Employee",
      },
    ]);
  };

  const handleCopyRow = (row: TimesheetRowUI) => {
    setRows((prev) => [
      ...prev, 
      { 
        ...row, 
        key: `${row.day}-${Date.now()}-${Math.random()}`,
        id: undefined, // Remove ID for new row
        taskIds: [...(row.taskIds || [])], // Copy array
        taskNames: [...(row.taskNames || [])] // Copy array
      }
    ]);
  };
  
  const handleDeleteRow = (key: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              projectId: undefined,
              taskIds: [],
              taskNames: [],
              description: "",
              hours: 0,
              billable: false,
            }
          : row,
      ),
    );
  };

  const displayRows = useMemo(() => {
    const result: TimesheetRowUI[] = [];
    DAYS.forEach((d) => {
      const dayRows = rows.filter((r) => r.day === d.label);
      const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);
      dayRows.forEach((r) => result.push(r));
      result.push({
        key: `${d.label}-summary-${Date.now()}`,
        day: d.label,
        date: d.date,
        hours: total,
        isSummary: true,
        employeeName: sheet?.user?.name ?? "Unknown Employee",
        taskIds: [],
        taskNames: [],
      });
    });
    return result;
  }, [rows, DAYS]);

  const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);
  const totalBillable = rows.reduce(
    (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
    0,
  );
  const expectedHours = 40;

  // Get available tasks for selected project
  const getAvailableTasks = (projectId?: string) => {
    if (!projectId) return [];
    return tasks.filter((t) => t.projectId === projectId);
  };

  const columns: ColumnsType<TimesheetRowUI> = [
    {
      title: "DAY",
      width: 120,
      render: (_: any, r: TimesheetRowUI) => (
        <Space>
          {r.isSummary ? (
            <Text type="secondary">{r.date}</Text>
          ) : (
            <Text strong>{r.day}</Text>
          )}
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
          <Tooltip
            title={
              isWeekend(r.day) && !isFieldEditable(r)
                ? "Weekend editing is disabled. Click checkbox to enable."
                : ""
            }
          >
            <Select
              disabled={isViewMode || !isFieldEditable(r)}
              bordered={false}
              value={r.projectId}
              placeholder="Project"
              style={{ width: 200 }}
              options={projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              onChange={(projectId) => {
                const selected = projects.find((p) => p.id === projectId);
                updateRow(r.key, {
                  projectId,
                  projectName: selected?.name,
                  taskIds: [], // Reset tasks when project changes
                  taskNames: [],
                });
              }}
            />
          </Tooltip>
        ),
    },
    {
      title: "TASKS", // Changed from TASK to TASKS
      render: (_: any, r: TimesheetRowUI) =>
        r.isSummary ? null : (
          <Tooltip
            title={
              isWeekend(r.day) && !isFieldEditable(r)
                ? "Weekend editing is disabled. Click checkbox to enable."
                : ""
            }
          >
            <Select
              mode="multiple" // Enable multiple selection
              allowClear
              bordered={false}
              value={r.taskIds}
              placeholder="Select tasks"
              style={{ width: 250 }}
              disabled={!r.projectId || isViewMode || !isFieldEditable(r)} // Disable if no project selected
              options={getAvailableTasks(r.projectId).map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              onChange={(taskIds: string[]) => {
                const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
                updateRow(r.key, {
                  taskIds,
                  taskNames: selectedTasks.map(t => t.name),
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
              if (allowedKeys.includes(e.key)) return;
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
          </Space>
        ),
    },
  ].filter(Boolean) as ColumnsType<TimesheetRowUI>;

  const handleSaveDraft = async () => {
    try {
      setSaveDraftLoading(true); // Only draft loading state
      const existing = allTimesheets?.data?.find(
        (t: Timesheet) =>
          t.user?.id === sheet?.user?.id &&
          dayjs(t.weekStart).format("YYYY-MM-DD") ===
            currentDate.startOf("week").format("YYYY-MM-DD"),
      );
      
      const rowsForPayload = rows.map((r) => ({
        day: new Date(`${r.date}T00:00:00Z`),
        projectId: r.projectId,
        taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined, // Send first task or handle accordingly
        projectName: r.projectName || "",
        taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "", // Join multiple task names
        description: r.description || "",
        hours: r.hours || 0,
        billable: r.billable ?? true,
      }));

      const payload = {
        weekStart: currentDate.startOf("week").toISOString(),
        weekEnd: currentDate.endOf("week").toISOString(),
        rows: rowsForPayload,
        totalHours,
        totalBillable,
        status: "DRAFT",
      };

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
      setSaveDraftLoading(false); // Stop draft loading
    }
  };

  const handleSubmitTimesheet = async () => {
    console.log("SUBMIT BUTTON CLICKED");
    isSubmittingRef.current = true;

    try {
      setSubmitLoading(true); // Only submit loading state

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

      const rowsForPayload = rows.map((r) => ({
        id: r.id,
        day: new Date(`${r.date}T00:00:00Z`),
        projectId: r.projectId,
        taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
        projectName: r.projectName || "",
        taskName: r.taskNames && r.taskNames.length > 0 ? r.taskNames.join(', ') : "",
        description: r.description || "",
        hours: r.hours || 0,
        billable: r.billable ?? true,
      }));
      
      console.log("rowpayload", rowsForPayload);

      let timesheetId: string;
      if (existing) {
        await updateMutation.mutateAsync({
          id: existing.id,
          data: {
            weekStart: currentDate.startOf("week").toDate(),
            weekEnd: currentDate.endOf("week").toDate(),
            rows: rowsForPayload,
          },
        });
        timesheetId = existing.id;
      } else {
        const newTimesheet = await createMutation.mutateAsync({
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
        });
        timesheetId = newTimesheet.id;
      }

      if (!timesheetId) throw new Error("Timesheet ID missing");
      
      try {
        await TimesheetsService.submitTimesheet(timesheetId);
      } catch (submitError) {
        console.warn(
          "Submit API threw error, but backend already submitted",
          submitError,
        );
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
      console.error("Unexpected submit failure:", err);
      message.error("This timesheet is already submitted");
    } finally {
      setSubmitLoading(false); // Stop submit loading
      isSubmittingRef.current = false;
    }
  };

  const handleSaveChanges = async () => {
    if (!timesheetId) return;
    console.log("ROWS STATE BEFORE SAVE", rows);
    
    try {
      setSaveChangesLoading(true); // Only save changes loading state

      const rowsForPayload = rows.map((r) => ({
        id: r.id,
        day: new Date(`${r.date}T00:00:00Z`),
        taskId: r.taskIds && r.taskIds.length > 0 ? r.taskIds[0] : undefined,
        projectId: r.projectId,
        description: r.description || "",
        hours: r.hours || 0,
        billable: r.billable || false,
        ...(r.projectName && { projectName: r.projectName }),
        ...(r.taskNames && { taskName: r.taskNames.join(', ') }),
      }));
      
      const updatePayload = {
        weekStart: dayjs(currentDate).startOf("week").toDate(),
        weekEnd: dayjs(currentDate).endOf("week").toDate(),
        rows: rowsForPayload,
        totalHours,
        totalBillable,
        status: "SUBMITTED",
      };

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
      setSaveChangesLoading(false); // Stop save changes loading
    }
  };

  return (
    <>
     <style>{tableStyles}</style>
    <div style={{ padding: 22 }}>
      {/* Header */}
      <div
        className="timesheet-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#262626" }}>
            {isEditMode
              ? `Edit Timesheet`
              : `My Timesheet`}
          </Title>
          <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
            {currentDate.format("MMMM YYYY")}
          </Text>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Button
            icon={<LeftOutlined />}
            onClick={() => setCurrentDate(currentDate.subtract(1, "week"))}
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
          <Button
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={saveDraftLoading} // Use separate loading state
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
      
      <Divider />
      
      {/* Table */}
      <Table
        style={{ marginTop: "10px" }}
        columns={columns}
        dataSource={displayRows}
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
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#1f1f1f",
                  }}
                >
                  <span style={{ color: "#595959" }}>Week Total</span>
                  <span
                    style={{
                      display: "flex",
                      gap: "30px",
                      alignItems: "center",
                      color: "#262626",
                    }}
                  >
                    <span>{totalHours}h / 40h</span>
                    <span style={{ color: "#1890ff" }}>
                      {totalBillable} h billable
                    </span>
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
        styles={{ body: { paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 24 } }}
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
              loading={isEditMode ? saveChangesLoading : submitLoading} // Use appropriate loading state
              icon={isEditMode ? <SaveOutlined /> : <SendOutlined />}
              onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
            >
              {isEditMode ? "Save Changes" : "Submit Timesheet"}
            </Button>
          )}
        </div>
      </Modal>
      
      {/* <Modal
        open={isSubmittedModalOpen}
        onCancel={() => setIsSubmittedModalOpen(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              setIsSubmittedModalOpen(false);
              onSubmitted();
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
      </Modal> */}
    </div>
    </>
  );
}
