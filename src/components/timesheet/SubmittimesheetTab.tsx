

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
// // Import holiday service
// import { companyGovernmentHolidayService } from "@/services/companyGovernmentHolidayService";
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
//   // Add holiday properties
//   isHoliday?: boolean;
//   holidayName?: string;
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

//   // State for holidays
//   const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());
//   const [holidayDetails, setHolidayDetails] = useState<
//     Map<string, { name: string; type: string }>
//   >(new Map());
//   const [loadingHolidays, setLoadingHolidays] = useState(false);

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

//   // 🔹 FETCH company/government holidays
//   const fetchHolidays = async () => {
//     try {
//       setLoadingHolidays(true);
//       console.log("📅 Fetching company/government holidays");

//       const response = await companyGovernmentHolidayService.getAll();

//       console.log("✅ Holidays fetched successfully:", response);

//       // Create a Set for dates and a Map for details
//       const holidayDateSet = new Set<string>();
//       const holidayDetailsMap = new Map<
//         string,
//         { name: string; type: string }
//       >();

//       if (response && Array.isArray(response)) {
//         // Filter only ACTIVE holidays
//         const activeHolidays = response.filter((h) => h.status === "ACTIVE");

//         activeHolidays.forEach((holiday: any) => {
//           const fromDate = dayjs(holiday.fromDate);
//           const toDate = dayjs(holiday.toDate);

//           console.log(
//             `📅 Processing holiday: ${holiday.holidayName} from ${holiday.fromDate} to ${holiday.toDate}`,
//           );

//           // Add each day in the holiday range
//           let currentDate = fromDate;
//           while (
//             currentDate.isBefore(toDate) ||
//             currentDate.isSame(toDate, "day")
//           ) {
//             const dateStr = currentDate.format("YYYY-MM-DD");
//             holidayDateSet.add(dateStr);
//             holidayDetailsMap.set(dateStr, {
//               name: holiday.holidayName,
//               type: holiday.type,
//             });
//             console.log(
//               `  ✅ Added holiday date: ${dateStr} - ${holiday.holidayName}`,
//             );
//             currentDate = currentDate.add(1, "day");
//           }
//         });
//       }

//       console.log("📋 Final Holiday Dates Set:", Array.from(holidayDateSet));
//       console.log("📋 Holiday Details:", Object.fromEntries(holidayDetailsMap));

//       setHolidayDates(holidayDateSet);
//       setHolidayDetails(holidayDetailsMap);
//     } catch (error: any) {
//       console.error("❌ Failed to fetch holidays:", error);
//     } finally {
//       setLoadingHolidays(false);
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
//           const isHoliday = isDateHoliday(row.date);
//           const holidayInfo = getHolidayInfo(row.date);

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
//               isHoliday: false,
//               holidayName: undefined,
//             };
//           } else if (!isLeave && row.isLeave) {
//             // This row should no longer be leave
//             return {
//               ...row,
//               isLeave: false,
//               leaveType: undefined,
//               description: "",
//               isHoliday: isHoliday,
//               holidayName: holidayInfo?.name,
//               hours: isHoliday ? 8 : 0,
//               billable: !isHoliday,
//             };
//           } else if (isHoliday && !row.isHoliday) {
//             // This row should be marked as holiday
//             return {
//               ...row,
//               isHoliday: true,
//               holidayName: holidayInfo?.name,
//               description: `Holiday: ${holidayInfo?.name || "Holiday"}`,
//               hours: 6,
//               projectId: undefined,
//               taskIds: [],
//               taskNames: [],
//               billable: false,
//               isLeave: false,
//               leaveType: undefined,
//             };
//           } else if (!isHoliday && row.isHoliday) {
//             // This row should no longer be holiday
//             return {
//               ...row,
//               isHoliday: false,
//               holidayName: undefined,
//               description: "",
//               hours: 0,
//               billable: true,
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
//       fetchHolidays();

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
//   }, [currentDate, user?.id, leaveDates, holidayDates]);

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

//   // Helper function to check if a date is a holiday
//   const isDateHoliday = (date: string): boolean => {
//     return holidayDates.has(date);
//   };

//   // Helper function to get holiday info
//   const getHolidayInfo = (
//     date: string,
//   ): { name: string; type: string } | undefined => {
//     return holidayDetails.get(date);
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
//     if (row.isLeave) return false;
//     if (row.isHoliday) return false;
//     if (!isWeekend(row.day)) return true;
//     return weekendEditable[row.key] ?? false;
//   };

//   const DAYS = useMemo(() => {
//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       const dateStr = d.format("YYYY-MM-DD");
//       const isToday = dateStr === dayjs().format("YYYY-MM-DD");
//       const isHoliday = isDateHoliday(dateStr);
//       const holidayInfo = getHolidayInfo(dateStr);

//       return {
//         label: d.format("ddd"),
//         date: d.format("MMM DD"),
//         fullDate: dateStr,
//         dayNumber: d.format("D"),
//         year: d.format("YYYY"),
//         fullDateObj: d,
//         isToday: isToday,
//         isHoliday: isHoliday,
//         holidayName: holidayInfo?.name,
//       };
//     });
//   }, [currentDate, holidayDates]);

//   const createEmptyRows = () =>
//     DAYS.map((d) => {
//       const isLeave = isDateLeave(d.fullDate);
//       const leaveInfo = getLeaveInfo(d.fullDate);
//       const isHoliday = d.isHoliday;
//       const holidayName = d.holidayName;

//       return {
//         key: `${d.label}-${Date.now()}-${Math.random()}`,
//         day: d.label,
//         date: d.fullDate,
//         projectId: undefined,
//         taskIds: [],
//         taskNames: [],
//         description: isLeave
//           ? `On leave (${leaveInfo?.type || "Leave"})`
//           : isHoliday
//             ? `Holiday: ${holidayName}`
//             : "",
//         hours: isHoliday ? 6 : 0,
//         billable: !isLeave && !isHoliday,
//         status: "Draft" as const,
//         employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
//         isLeave: isLeave,
//         leaveType: leaveInfo?.type,
//         isHoliday: isHoliday,
//         holidayName: holidayName,
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
//         !row.isLeave &&
//         !row.isHoliday &&
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

//           const isLeave = isDateLeave(dateStr);
//           const leaveInfo = getLeaveInfo(dateStr);

//           const isHoliday = isDateHoliday(dateStr);
//           const holidayInfo = getHolidayInfo(dateStr);

//           return {
//             key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
//             id: r.id,
//             day: rowDate.format("ddd"),
//             date: dateStr,
//             projectId: projectId,
//             taskIds: taskIds,
//             description: isLeave
//               ? `On leave (${leaveInfo?.type || "Leave"})`
//               : isHoliday
//                 ? `Holiday: ${holidayInfo?.name || "Holiday"}`
//                 : r.description,
//             hours: isLeave ? 0 : isHoliday ? 6 : r.hours,
//             billable: isLeave ? false : isHoliday ? false : r.billable,
//             status: mapBackendStatusToUI(sheet.status),
//             projectName:
//               projects.find((p) => p.id === projectId)?.name ||
//               r.projectName ||
//               "",
//             taskNames: taskNames,
//             employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
//             isLeave: isLeave,
//             leaveType: leaveInfo?.type,
//             isHoliday: isHoliday,
//             holidayName: holidayInfo?.name,
//           };
//         },
//       );

//       setRows(mappedRows);
//       setStatus(mapBackendStatusToUI(sheet.status));
//       setIsSubmitted(sheet.status === "SUBMITTED");
//       setCurrentDate(dayjs(sheet.weekStart));

//       const daysToExpand = new Set<string>();

//       mappedRows.forEach((row) => {
//         const hasData =
//           row.projectId ||
//           (row.taskIds && row.taskIds.length > 0) ||
//           row.description ||
//           (row.hours && row.hours > 0) ||
//           row.isLeave ||
//           row.isHoliday;

//         if (hasData) {
//           daysToExpand.add(row.day);
//         }
//       });

//       console.log("📅 Days to expand:", Array.from(daysToExpand));

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

//   useEffect(() => {
//     if (id && sheet && (leaveDates.size > 0 || holidayDates.size > 0)) {
//       refreshRowsForCurrentWeek();
//     }
//   }, [leaveDates, holidayDates, id, sheet]);

//   useEffect(() => {
//     if (!projects.length || !tasks.length) return;

//     setRows((prev) =>
//       prev.map((r) => {
//         if (r.isLeave || r.isHoliday) return r;

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
//         if (r.isLeave || r.isHoliday) return r;

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

//   const isAddingEntry = useRef(false);
//   const addEntry = (day: string, date: string) => {
//     if (isDateLeave(date)) {
//       message.warning("Cannot add entry on a leave day");
//       return;
//     }

//     if (isDateHoliday(date)) {
//       message.warning("Cannot add entry on a holiday");
//       return;
//     }

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
//         isHoliday: false,
//       },
//     ]);

//     setExpandedDays((prev) => new Set([...prev, day]));

//     setTimeout(() => {
//       isAddingEntry.current = false;
//     }, 500);
//   };

//   const handleCopyRow = (row: TimesheetRowUI) => {
//     if (row.isLeave) {
//       message.warning("Cannot copy leave entry");
//       return;
//     }

//     if (row.isHoliday) {
//       message.warning("Cannot copy holiday entry");
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
//     .filter((r) => !r.isLeave && !r.isHoliday)
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

//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

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
//           } else if (r.isHoliday) {
//             return {
//               day: new Date(`${r.date}T00:00:00Z`),
//               projectId: undefined,
//               taskId: undefined,
//               projectName: "",
//               taskName: "",
//               description:
//                 r.description || `Holiday: ${r.holidayName || "Holiday"}`,
//               hours: 8,
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

//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

//       console.log("📊 LEAVE COUNT CALCULATED:", leaveCount);

//       const rowsForPayload = rows
//         .filter((r) => !r.isSummary)
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
//           } else if (r.isHoliday) {
//             return {
//               id: r.id,
//               day: new Date(`${r.date}T00:00:00Z`),
//               projectId: undefined,
//               taskId: undefined,
//               projectName: "",
//               taskName: "",
//               description:
//                 r.description || `Holiday: ${r.holidayName || "Holiday"}`,
//               hours: 8,
//               billable: false,
//               isHoliday: true,
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

//         savedTimesheet = await createMutation.mutateAsync(createData);
//         timesheetId = savedTimesheet.id;
//       }

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

//       const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
//       const leaveCount = leaveRows.length;

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
//           } else if (r.isHoliday) {
//             return {
//               id: r.id,
//               day: new Date(`${r.date}T00:00:00Z`),
//               taskId: undefined,
//               projectId: undefined,
//               description:
//                 r.description || `Holiday: ${r.holidayName || "Holiday"}`,
//               hours: 8,
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

//   const weekHolidayCount = useMemo(() => {
//     return rows.filter((r) => r.isHoliday && !r.isSummary).length;
//   }, [rows]);

//   const handleWeekendToggle = (
//     day: string,
//     checked: boolean,
//     dayRows: TimesheetRowUI[],
//   ) => {
//     // Get all rows for this day
//     const dayRowKeys = dayRows.map((row) => row.key);
//     // Toggle all rows for this day
//     dayRowKeys.forEach((key) => {
//       setWeekendEditable((prev) => ({
//         ...prev,
//         [key]: checked,
//       }));
//     });
//   };

//   const renderEntryRow = (row: TimesheetRowUI) => {
//     const isLeave = row.isLeave;
//     const isHoliday = row.isHoliday;
//     const isWeekendDay = row.day === "Sat" || row.day === "Sun";

//     return (
//       <div
//         key={row.key}
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "12px",
//           padding: "12px",
//           backgroundColor: isLeave
//             ? "#fff2f0"
//             : isHoliday
//               ? "#f6ffed"
//               : "#ffffff",
//           borderRadius: "8px",
//           marginBottom: "8px",
//           border: isLeave
//             ? "1px solid #ffccc7"
//             : isHoliday
//               ? "1px solid #b7eb8f"
//               : "1px solid #f0f0f0",
//           opacity: isWeekendDay && !isFieldEditable(row) ? 0.7 : 1,
//         }}
//       >
//         {isLeave && (
//           <Tag color="red" style={{ marginRight: 4, fontWeight: "bold" }}>
//             LEAVE
//           </Tag>
//         )}
//         {isHoliday && !isLeave && (
//           <Tag
//             color="green"
//             icon={<CalendarOutlined />}
//             style={{ marginRight: 4, fontWeight: "bold" }}
//           >
//             {row.holidayName || "HOLIDAY"}
//           </Tag>
//         )}

//         {/* Checkbox removed from here - now in header */}

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave && !isHoliday
//               ? "This day is disabled. Click the Enable checkbox above to fill the timesheet."
//               : ""
//           }
//         >
//           <Select
//             disabled={
//               isViewMode || !isFieldEditable(row) || isLeave || isHoliday
//             }
//             bordered={false}
//             value={row.projectId}
//             placeholder={
//               isLeave ? "Leave day" : isHoliday ? "Holiday" : "Project"
//             }
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
//             isWeekendDay && !isFieldEditable(row) && !isLeave && !isHoliday
//               ? "This day is disabled. Click the Enable checkbox above to fill the timesheet."
//               : ""
//           }
//         >
//           <Select
//             mode="multiple"
//             allowClear
//             bordered={false}
//             value={row.taskIds}
//             placeholder={
//               isLeave ? "Leave day" : isHoliday ? "Holiday" : "Select tasks"
//             }
//             style={{ width: 220 }}
//             disabled={
//               isViewMode ||
//               !isFieldEditable(row) ||
//               isLeave ||
//               isHoliday ||
//               !row.projectId
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
//             isWeekendDay && !isFieldEditable(row) && !isLeave && !isHoliday
//               ? "This day is disabled. Click the Enable checkbox above to fill the timesheet."
//               : ""
//           }
//         >
//           <Input
//             placeholder="Description"
//             value={row.description}
//             onChange={(e) =>
//               updateRow(row.key, { description: e.target.value })
//             }
//             disabled={
//               isViewMode || !isFieldEditable(row) || isLeave || isHoliday
//             }
//             style={{ flex: 1 }}
//             bordered={false}
//           />
//         </Tooltip>

//         <Tooltip
//           title={
//             isWeekendDay && !isFieldEditable(row) && !isLeave && !isHoliday
//               ? "This day is disabled. Click the Enable checkbox above to fill the timesheet."
//               : ""
//           }
//         >
//           <InputNumber<number>
//             min={0}
//             max={24}
//             step={0.5}
//             value={row.hours}
//             disabled={
//               isViewMode || !isFieldEditable(row) || isLeave || isHoliday
//             }
//             controls
//             onChange={(value) => {
//               if (!isLeave && !isHoliday) {
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
//             isWeekendDay && !isFieldEditable(row) && !isLeave && !isHoliday
//               ? "This day is disabled. Click the Enable checkbox above to fill the timesheet."
//               : ""
//           }
//         >
//           <Switch
//             disabled={
//               isViewMode || !isFieldEditable(row) || isLeave || isHoliday
//             }
//             checked={row.billable}
//             onChange={(v) =>
//               !isLeave && !isHoliday && updateRow(row.key, { billable: v })
//             }
//           />
//         </Tooltip>

//         {!isViewMode && !isLeave && !isHoliday && (
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
//       <div
//         style={{
//           padding: 30,
//           marginTop: 0,
//           height: "calc(100vh - 120px)",
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         <Card
//           style={{
//             borderRadius: "16px",
//             backgroundColor: "#ffffff",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//           }}
//           bodyStyle={{
//             padding: "24px",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//           }}
//         >
//           {/* Sticky Header */}
//           <div
//             className="timesheet-header"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 24,
//               flexWrap: "wrap",
//               position: "sticky",
//               top: 0,
//               backgroundColor: "#ffffff",
//               zIndex: 10,
//               paddingBottom: "16px",
//               borderBottom: "1px solid #f0f0f0",
//               marginBottom: "24px",
//               flexShrink: 0,
//             }}
//           >
//             <div>
//               <Title level={3} style={{ margin: 0, color: "#262626" }}>
//                 {isEditMode ? `Edit Timesheet` : `My Timesheet`}
//               </Title>
//               <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
//                 {currentDate.format("MMMM YYYY")}
//               </Text>
//             </div>

//             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <Button
//                 icon={<LeftOutlined />}
//                 onClick={() => {
//                   setCurrentDate(currentDate.subtract(1, "week"));
//                 }}
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
//                 onClick={() => {
//                   setCurrentDate(currentDate.add(1, "week"));
//                 }}
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
//               <Button
//                 icon={<SaveOutlined />}
//                 htmlType="submit"
//                 loading={saveDraftLoading}
//                 onClick={handleSaveDraft}
//                 disabled={isViewMode || status === "Submitted"}
//                 style={{
//                   fontWeight: 600,
//                   border: "1px solid grey",
//                   color: "#595959",
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
//           </div>

//           {/* Scrollable Content Area */}
//           {/* <div style={{ 
//             overflowY: 'auto',
//             flex: 1,
//             paddingRight: '8px'
//           }}> */}
//           <style>
//             {`div[data-scrollable]::-webkit-scrollbar { display: none; }`}
//           </style>

//           {/* Scrollable Content Area */}
//           <div
//             data-scrollable
//             style={{
//               overflowY: "auto",
//               flex: 1,
//               paddingRight: "8px",
//               scrollbarWidth: "none",
//               msOverflowStyle: "none",
//             }}
//           >
//             {weekLeaveCount > 0 && (
//               <div
//                 style={{
//                   marginBottom: 16,
//                   padding: 12,
//                   background: "#fff1f0",
//                   border: "1px solid #ffccc7",
//                   borderRadius: 8,
//                 }}
//               >
//                 <Space>
//                   <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
//                   <Text strong style={{ color: "#ff4d4f" }}>
//                     Leave Alert:
//                   </Text>
//                   <Text>
//                     You have {weekLeaveCount} leave day(s) this week. Those days
//                     are disabled for timesheet entry.
//                   </Text>
//                 </Space>
//               </div>
//             )}

//             {weekHolidayCount > 0 && (
//               <div
//                 style={{
//                   marginBottom: 16,
//                   padding: 12,
//                   background: "#f6ffed",
//                   border: "1px solid #b7eb8f",
//                   borderRadius: 8,
//                 }}
//               >
//                 <Space>
//                   <CalendarOutlined style={{ color: "#52c41a" }} />
//                   <Text strong style={{ color: "#52c41a" }}>
//                     Holiday Alert:
//                   </Text>
//                   <Text>
//                     You have {weekHolidayCount} holiday(s) this week. These days
//                     are pre-filled with 8 hours and are not billable.
//                   </Text>
//                 </Space>
//               </div>
//             )}

//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "20px",
//                 alignItems: "center",
//               }}
//             >
//               {DAYS.map((day) => {
//                 const dayRows = getDayRows(day.label);
//                 const dayTotal = getDayTotal(day.label);
//                 const isLeaveDay = dayRows.some((r) => r.isLeave);
//                 const isHoliday = day.isHoliday;
//                 const holidayName = day.holidayName;
//                 const isExpanded = expandedDays.has(day.label);
//                 const isToday = day.isToday;
//                 const isWeekendDay = day.label === "Sat" || day.label === "Sun";

//                 // Check if any row for this day is editable (for weekend toggle)
//                 const anyRowEditable = dayRows.some(
//                   (row) => !row.isLeave && !row.isHoliday,
//                 );

//                 // Check if all weekend rows are enabled
//                 const allWeekendEnabled =
//                   isWeekendDay &&
//                   anyRowEditable &&
//                   dayRows.every(
//                     (row) =>
//                       row.isLeave || row.isHoliday || weekendEditable[row.key],
//                   );

//                 return (
//                   <Card
//                     key={day.label}
//                     className="hover-card"
//                     style={{
//                       borderRadius: "12px",
//                       border: isToday
//                         ? "2px solid #1890ff"
//                         : "1px solid #e8e8e8",
//                       backgroundColor: isLeaveDay
//                         ? "#fff2f0"
//                         : isHoliday
//                           ? "#f6ffed"
//                           : "#ffffff",
//                       width: "900px",
//                       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
//                       cursor: "pointer",
//                       flexShrink: 0,
//                     }}
//                     bodyStyle={{ padding: "20px" }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                       }}
//                       onClick={() => toggleDayExpand(day.label)}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             width: "38px",
//                             height: "38px",
//                             backgroundColor: isToday
//                               ? "#1890ff"
//                               : isLeaveDay
//                                 ? "#ff4d4f"
//                                 : isHoliday
//                                   ? "#52c41a"
//                                   : "#f0f0f0",
//                             borderRadius: "8px",
//                             display: "flex",
//                             flexDirection: "column",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             color:
//                               isToday || isLeaveDay || isHoliday
//                                 ? "white"
//                                 : "#595959",
//                             fontSize: "12px",
//                             fontWeight: "bold",
//                             boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
//                             gap: "2px",
//                           }}
//                         >
//                           <CalendarOutlined style={{ fontSize: "12px" }} />
//                           <span>{day.dayNumber}</span>
//                         </div>

//                         <div>
//                           <div
//                             style={{
//                               fontSize: "18px",
//                               fontWeight: "600",
//                               color: "#262626",
//                               display: "flex",
//                               gap: "5px",
//                               alignItems: "center",
//                             }}
//                           >
//                             {day.label}

//                             {isHoliday && !isLeaveDay && (
//                               <Tag
//                                 color="green"
//                                 icon={<CalendarOutlined />}
//                                 style={{
//                                   fontSize: "10px",
//                                   fontWeight: "bold",
//                                   padding: "2px 8px",
//                                   borderRadius: "12px",
//                                   marginLeft: "8px",
//                                 }}
//                               >
//                                 {holidayName || "Holiday"}
//                               </Tag>
//                             )}

//                             {isLeaveDay && (
//                               <>
//                                 {dayRows
//                                   .filter((r) => r.isLeave)
//                                   .map((leaveRow, index) => (
//                                     <Tag
//                                       key={index}
//                                       color={
//                                         leaveRow.leaveType === "sick_leave"
//                                           ? "orange"
//                                           : "red"
//                                       }
//                                       icon={<ClockCircleOutlined />}
//                                       style={{
//                                         fontSize: "10px",
//                                         fontWeight: "bold",
//                                         padding: "2px 8px",
//                                         borderRadius: "12px",
//                                       }}
//                                     >
//                                       {leaveRow.leaveType === "sick_leave"
//                                         ? "Sick Leave"
//                                         : leaveRow.leaveType === "casual_leave"
//                                           ? "Casual Leave"
//                                           : "Leave"}
//                                     </Tag>
//                                   ))}
//                               </>
//                             )}
//                           </div>
//                           <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
//                             {day.date}, {day.year}
//                           </div>
//                         </div>
//                       </div>

//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "16px",
//                         }}
//                       >
//                         {/* Add Item button - only visible when expanded */}
//                         {isExpanded && !isLeaveDay && !isHoliday && (
//                           <Button
//                             type="primary"
//                             icon={<PlusOutlined />}
//                             size="small"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               addEntry(day.label, day.fullDate);
//                             }}
//                             disabled={isViewMode}
//                             style={{
//                               boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
//                             }}
//                           >
//                             Add Item
//                           </Button>
//                         )}

//                         {/* Weekend Enable Checkbox - Now next to total hours */}
//                         {isWeekendDay &&
//                           anyRowEditable &&
//                           !isLeaveDay &&
//                           !isHoliday && (
//                             <Checkbox
//                               checked={allWeekendEnabled}
//                               onChange={(e) => {
//                                 e.stopPropagation();
//                                 handleWeekendToggle(
//                                   day.label,
//                                   e.target.checked,
//                                   dayRows,
//                                 );
//                               }}
//                               style={{ marginRight: 4 }}
//                             >
//                               Enable
//                             </Checkbox>
//                           )}

//                         <div
//                           style={{
//                             fontSize: "16px",
//                             fontWeight: "600",
//                             color: isToday ? "#1890ff" : "#595959",
//                             backgroundColor: "#f5f5f5",
//                             padding: "4px 12px",
//                             borderRadius: "20px",
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "4px",
//                           }}
//                         >
//                           {dayTotal}h
//                         </div>
//                         <div style={{ color: "#8c8c8c" }}>
//                           {isExpanded ? <UpOutlined /> : <DownOutlined />}
//                         </div>
//                       </div>
//                     </div>

//                     {isExpanded && (
//                       <div style={{ marginTop: "20px" }}>
//                         {dayRows.length > 0 && (
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               gap: "12px",
//                               padding: "12px 16px",
//                               backgroundColor: "#fafafa",
//                               borderRadius: "8px 8px 0 0",
//                               borderBottom: "2px solid #e8e8e8",
//                               fontWeight: 600,
//                               fontSize: "12px",
//                               color: "#8c8c8c",
//                               textTransform: "uppercase",
//                               letterSpacing: "0.5px",
//                             }}
//                           >
//                             {!isLeaveDay &&
//                               !isHoliday &&
//                               (day.label === "Sat" || day.label === "Sun") && (
//                                 <div style={{ width: 30 }}></div>
//                               )}
//                             <div style={{ width: 180 }}>PROJECT</div>
//                             <div style={{ width: 220 }}>TASKS</div>
//                             <div style={{ flex: 1 }}>DESCRIPTION</div>
//                             <div style={{ width: 100 }}>HOURS</div>
//                             <div style={{ width: 90 }}>BILLABLE</div>
//                             {!isViewMode && (
//                               <div style={{ width: 70 }}>ACTIONS</div>
//                             )}
//                           </div>
//                         )}

//                         {dayRows.length > 0 ? (
//                           dayRows.map((row) => renderEntryRow(row))
//                         ) : (
//                           <div
//                             style={{
//                               padding: "32px",
//                               textAlign: "center",
//                               color: "#8c8c8c",
//                               backgroundColor: "#fafafa",
//                               borderRadius: "8px",
//                               border: "1px dashed #d9d9d9",
//                             }}
//                           >
//                             {isLeaveDay ? (
//                               <div>
//                                 <Tag color="red" style={{ marginBottom: 8 }}>
//                                   Leave Day
//                                 </Tag>
//                                 <div>No entries can be added on leave days</div>
//                               </div>
//                             ) : isHoliday ? (
//                               <div>
//                                 <Tag
//                                   color="green"
//                                   icon={<CalendarOutlined />}
//                                   style={{ marginBottom: 8 }}
//                                 >
//                                   {holidayName || "Holiday"} (8 hours)
//                                 </Tag>
//                                 <div>
//                                   Holiday automatically logged with 8 hours
//                                 </div>
//                               </div>
//                             ) : (
//                               <div>
//                                 <ClockCircleOutlined
//                                   style={{
//                                     fontSize: 24,
//                                     marginBottom: 8,
//                                     color: "#bfbfbf",
//                                   }}
//                                 />
//                                 <div>
//                                   No time entries. Click 'Add Item' to log your
//                                   time.
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </Card>
//                 );
//               })}
//             </div>

//             <div
//               style={{
//                 marginTop: 32,
//                 padding: "20px 32px",
//                 backgroundColor: "#fafafa",
//                 borderRadius: "12px",
//                 border: "1px solid #e8e8e8",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 width: "900px",
//                 marginLeft: "auto",
//                 marginRight: "auto",
//                 boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
//                 flexShrink: 0,
//               }}
//             >
//               <Text strong style={{ fontSize: "18px", color: "#262626" }}>
//                 Week Total
//               </Text>
//               <div
//                 style={{ display: "flex", gap: "40px", alignItems: "center" }}
//               >
//                 <div>
//                   <Text
//                     type="secondary"
//                     style={{ marginRight: 8, fontSize: "14px" }}
//                   >
//                     Billable:
//                   </Text>
//                   <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
//                     {totalBillable}h
//                   </Text>
//                 </div>
//                 <div>
//                   <Text
//                     type="secondary"
//                     style={{ marginRight: 8, fontSize: "14px" }}
//                   >
//                     Total:
//                   </Text>
//                   <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
//                     {totalHours}h
//                   </Text>
//                 </div>
//                 {weekLeaveCount > 0 && (
//                   <Tag color="red" icon={<ClockCircleOutlined />}>
//                     {weekLeaveCount} Leave Day(s)
//                   </Tag>
//                 )}
//                 {weekHolidayCount > 0 && (
//                   <Tag color="green" icon={<CalendarOutlined />}>
//                     {weekHolidayCount} Holiday(s) ({weekHolidayCount * 8}h)
//                   </Tag>
//                 )}
//               </div>
//             </div>
//           </div>
//         </Card>

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

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: 16,
//               marginBottom: 20,
//             }}
//           >
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
//                     .filter((r) => !r.isLeave && !r.isHoliday)
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
//                     .filter((r) => !r.isLeave && !r.isHoliday)
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

//           {weekHolidayCount > 0 && (
//             <div
//               style={{
//                 marginTop: 16,
//                 padding: 12,
//                 borderRadius: 8,
//                 background: "#f6ffed",
//                 color: "#52c41a",
//                 display: "flex",
//                 gap: 8,
//                 alignItems: "center",
//               }}
//             >
//               <CalendarOutlined />
//               <span>
//                 You have {weekHolidayCount} holiday(s) this week. Holiday days
//                 are automatically logged with 8 hours and are not billable.
//               </span>
//             </div>
//           )}

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
  Row,
  Col,
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
import {
  FileText,
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Save,
  Send,
  AlertCircle,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
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
import leaveService from "@/services/leaveService";
import { companyGovernmentHolidayService } from "@/services/companyGovernmentHolidayService";
import { useAuth } from "@/context/AuthContext";

const { Title, Text } = Typography;
const { Panel } = Collapse;
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";

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
  isHoliday?: boolean;
  holidayName?: string;
}

type SubmitTimesheetTabProps = {
  onSubmitted: () => void;
};

export default function SubmittimesheetTab({
  onSubmitted,
}: SubmitTimesheetTabProps) {
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      bodyStyle={{ padding: "16px 20px" }}
      style={{
        borderRadius: 12,
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );

  const { user } = useAuth();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

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

  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  const [leaveDetails, setLeaveDetails] = useState<
    Map<string, { type: string; status: string }>
  >(new Map());
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());
  const [holidayDetails, setHolidayDetails] = useState<
    Map<string, { name: string; type: string }>
  >(new Map());
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const { data: allTimesheets } = useTimesheets();
  const isSubmittingRef = useRef(false);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const fetchMyLeaves = async () => {
    try {
      setLoadingLeaves(true);
      console.log("🔍 Fetching leaves for user:", user?.id, user?.name);

      const response = await leaveService.getMyLeaves();

      const leaveDateSet = new Set<string>();
      const leaveDetailsMap = new Map<
        string,
        { type: string; status: string }
      >();

      if (response) {
        let leavesArray: any[] = [];

        if (response.data && Array.isArray(response.data)) {
          leavesArray = response.data;
        } else if (Array.isArray(response)) {
          leavesArray = response;
        }

        const allowedLeaveTypes = ["casual_leave", "sick_leave"];

        leavesArray.forEach((leave: any) => {
          const leaveType = leave.type?.toLowerCase();
          const leaveStatus = leave.status?.toLowerCase();

          if (allowedLeaveTypes.includes(leaveType)) {
            const startDate = dayjs(leave.startDate);
            const endDate = dayjs(leave.endDate);

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
              currentDate = currentDate.add(1, "day");
            }
          }
        });
      }

      setLeaveDates(leaveDateSet);
      setLeaveDetails(leaveDetailsMap);
      refreshRowsForCurrentWeek();
    } catch (error: any) {
      console.error("❌ Failed to fetch leaves:", error);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      setLoadingHolidays(true);

      const response = await companyGovernmentHolidayService.getAll();

      const holidayDateSet = new Set<string>();
      const holidayDetailsMap = new Map<
        string,
        { name: string; type: string }
      >();

      if (response && Array.isArray(response)) {
        const activeHolidays = response.filter((h) => h.status === "ACTIVE");

        activeHolidays.forEach((holiday: any) => {
          const fromDate = dayjs(holiday.fromDate);
          const toDate = dayjs(holiday.toDate);

          let currentDate = fromDate;
          while (
            currentDate.isBefore(toDate) ||
            currentDate.isSame(toDate, "day")
          ) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            holidayDateSet.add(dateStr);
            holidayDetailsMap.set(dateStr, {
              name: holiday.holidayName,
              type: holiday.type,
            });
            currentDate = currentDate.add(1, "day");
          }
        });
      }

      setHolidayDates(holidayDateSet);
      setHolidayDetails(holidayDetailsMap);
    } catch (error: any) {
      console.error("❌ Failed to fetch holidays:", error);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const refreshRowsForCurrentWeek = () => {
    if (!id && !sheet) {
      setRows(createEmptyRows());
    } else if (id && sheet) {
      setRows((prevRows) =>
        prevRows.map((row) => {
          const isLeave = isDateLeave(row.date);
          const leaveInfo = getLeaveInfo(row.date);
          const isHoliday = isDateHoliday(row.date);
          const holidayInfo = getHolidayInfo(row.date);

          if (isLeave && !row.isLeave) {
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
              isHoliday: false,
              holidayName: undefined,
            };
          } else if (!isLeave && row.isLeave) {
            return {
              ...row,
              isLeave: false,
              leaveType: undefined,
              description: "",
              isHoliday: isHoliday,
              holidayName: holidayInfo?.name,
              hours: isHoliday ? 6 : 0,
              billable: !isHoliday,
            };
          } else if (isHoliday && !row.isHoliday) {
            return {
              ...row,
              isHoliday: true,
              holidayName: holidayInfo?.name,
              description: `Holiday: ${holidayInfo?.name || "Holiday"}`,
              hours: 8,
              projectId: undefined,
              taskIds: [],
              taskNames: [],
              billable: false,
              isLeave: false,
              leaveType: undefined,
            };
          } else if (!isHoliday && row.isHoliday) {
            return {
              ...row,
              isHoliday: false,
              holidayName: undefined,
              description: "",
              hours: 0,
              billable: true,
            };
          }
          return row;
        }),
      );
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyLeaves();
      fetchHolidays();

      const todayInThisWeek = DAYS.find((day) => day.isToday)?.label;
      if (todayInThisWeek) {
        setExpandedDays(new Set([todayInThisWeek]));
      } else {
        setExpandedDays(new Set([]));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      if (!id && !sheet) {
        setRows(createEmptyRows());

        const todayInThisWeek = DAYS.find((day) => day.isToday)?.label;
        if (todayInThisWeek) {
          setExpandedDays(new Set([todayInThisWeek]));
        } else {
          setExpandedDays(new Set([]));
        }
      } else {
        refreshRowsForCurrentWeek();
      }
    }
  }, [currentDate, user?.id, leaveDates, holidayDates]);

  const isDateLeave = (date: string): boolean => {
    return leaveDates.has(date);
  };

  const getLeaveInfo = (
    date: string,
  ): { type: string; status: string } | undefined => {
    return leaveDetails.get(date);
  };

  const isDateHoliday = (date: string): boolean => {
    return holidayDates.has(date);
  };

  const getHolidayInfo = (
    date: string,
  ): { name: string; type: string } | undefined => {
    return holidayDetails.get(date);
  };

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
    if (row.isLeave) return false;
    if (row.isHoliday) return false;
    if (!isWeekend(row.day)) return true;
    return weekendEditable[row.key] ?? false;
  };

  const DAYS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = currentDate.startOf("week").add(i, "day");
      const dateStr = d.format("YYYY-MM-DD");
      const isToday = dateStr === dayjs().format("YYYY-MM-DD");
      const isHoliday = isDateHoliday(dateStr);
      const holidayInfo = getHolidayInfo(dateStr);

      return {
        label: d.format("ddd"),
        date: d.format("MMM DD"),
        fullDate: dateStr,
        dayNumber: d.format("D"),
        year: d.format("YYYY"),
        fullDateObj: d,
        isToday: isToday,
        isHoliday: isHoliday,
        holidayName: holidayInfo?.name,
      };
    });
  }, [currentDate, holidayDates]);

  const createEmptyRows = () =>
    DAYS.map((d) => {
      const isLeave = isDateLeave(d.fullDate);
      const leaveInfo = getLeaveInfo(d.fullDate);
      const isHoliday = d.isHoliday;
      const holidayName = d.holidayName;

      return {
        key: `${d.label}-${Date.now()}-${Math.random()}`,
        day: d.label,
        date: d.fullDate,
        projectId: undefined,
        taskIds: [],
        taskNames: [],
        description: isLeave
          ? `On leave (${leaveInfo?.type || "Leave"})`
          : isHoliday
            ? `Holiday: ${holidayName}`
            : "",
        hours: isHoliday ? 8 : 0,
        billable: !isLeave && !isHoliday,
        status: "Draft" as const,
        employeeName: sheet?.user?.name || user?.name || "Unknown Employee",
        isLeave: isLeave,
        leaveType: leaveInfo?.type,
        isHoliday: isHoliday,
        holidayName: holidayName,
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
        !row.isLeave &&
        !row.isHoliday &&
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

          const isLeave = isDateLeave(dateStr);
          const leaveInfo = getLeaveInfo(dateStr);

          const isHoliday = isDateHoliday(dateStr);
          const holidayInfo = getHolidayInfo(dateStr);

          return {
            key: r.id || `${dayAbbr}-${index}-${Date.now()}`,
            id: r.id,
            day: rowDate.format("ddd"),
            date: dateStr,
            projectId: projectId,
            taskIds: taskIds,
            description: isLeave
              ? `On leave (${leaveInfo?.type || "Leave"})`
              : isHoliday
                ? `Holiday: ${holidayInfo?.name || "Holiday"}`
                : r.description,
            hours: isLeave ? 0 : isHoliday ? 8 : r.hours,
            billable: isLeave ? false : isHoliday ? false : r.billable,
            status: mapBackendStatusToUI(sheet.status),
            projectName:
              projects.find((p) => p.id === projectId)?.name ||
              r.projectName ||
              "",
            taskNames: taskNames,
            employeeName: sheet.user?.name ?? user?.name ?? "Unknown Employee",
            isLeave: isLeave,
            leaveType: leaveInfo?.type,
            isHoliday: isHoliday,
            holidayName: holidayInfo?.name,
          };
        },
      );

      setRows(mappedRows);
      setStatus(mapBackendStatusToUI(sheet.status));
      setIsSubmitted(sheet.status === "SUBMITTED");
      setCurrentDate(dayjs(sheet.weekStart));

      const daysToExpand = new Set<string>();

      mappedRows.forEach((row) => {
        const hasData =
          row.projectId ||
          (row.taskIds && row.taskIds.length > 0) ||
          row.description ||
          (row.hours && row.hours > 0) ||
          row.isLeave ||
          row.isHoliday;

        if (hasData) {
          daysToExpand.add(row.day);
        }
      });

      setExpandedDays(daysToExpand);

      return;
    }

    if (!id) {
      setRows(createEmptyRows());
      setStatus("Draft");
    }
  }, [id, mode, sheet, projects, tasks, user]);

  useEffect(() => {
    if (id && sheet && (leaveDates.size > 0 || holidayDates.size > 0)) {
      refreshRowsForCurrentWeek();
    }
  }, [leaveDates, holidayDates, id, sheet]);

  useEffect(() => {
    if (!projects.length || !tasks.length) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.isLeave || r.isHoliday) return r;

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
        if (r.isLeave || r.isHoliday) return r;

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

  const isAddingEntry = useRef(false);
  const addEntry = (day: string, date: string) => {
    if (isDateLeave(date)) {
      message.warning("Cannot add entry on a leave day");
      return;
    }

    if (isDateHoliday(date)) {
      message.warning("Cannot add entry on a holiday");
      return;
    }

    if (isAddingEntry.current) {
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
        isHoliday: false,
      },
    ]);

    setExpandedDays((prev) => new Set([...prev, day]));

    setTimeout(() => {
      isAddingEntry.current = false;
    }, 500);
  };

  const handleCopyRow = (row: TimesheetRowUI) => {
    if (row.isLeave) {
      message.warning("Cannot copy leave entry");
      return;
    }

    if (row.isHoliday) {
      message.warning("Cannot copy holiday entry");
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
    .filter((r) => !r.isLeave && !r.isHoliday)
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

      const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
      const leaveCount = leaveRows.length;

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
          } else if (r.isHoliday) {
            return {
              day: new Date(`${r.date}T00:00:00Z`),
              projectId: undefined,
              taskId: undefined,
              projectName: "",
              taskName: "",
              description:
                r.description || `Holiday: ${r.holidayName || "Holiday"}`,
              hours: 8,
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

      const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
      const leaveCount = leaveRows.length;

      const rowsForPayload = rows
        .filter((r) => !r.isSummary)
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
          } else if (r.isHoliday) {
            return {
              id: r.id,
              day: new Date(`${r.date}T00:00:00Z`),
              projectId: undefined,
              taskId: undefined,
              projectName: "",
              taskName: "",
              description:
                r.description || `Holiday: ${r.holidayName || "Holiday"}`,
              hours: 8,
              billable: false,
              isHoliday: true,
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

      let timesheetId: string;
      let savedTimesheet;

      if (existing) {
        const updateData = {
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
          totalHours,
          totalBillable,
          leaveCount,
        };

        savedTimesheet = await updateMutation.mutateAsync({
          id: existing.id,
          data: updateData,
        });
        timesheetId = existing.id;
      } else {
        const createData = {
          weekStart: currentDate.startOf("week").toDate(),
          weekEnd: currentDate.endOf("week").toDate(),
          rows: rowsForPayload,
          totalHours,
          totalBillable,
          leaveCount,
        };

        savedTimesheet = await createMutation.mutateAsync(createData);
        timesheetId = savedTimesheet.id;
      }

      if (!timesheetId) throw new Error("Timesheet ID missing");

      try {
        await TimesheetsService.submitTimesheet(timesheetId);
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

    try {
      setSaveChangesLoading(true);

      const leaveRows = rows.filter((r) => r.isLeave && !r.isSummary);
      const leaveCount = leaveRows.length;

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
          } else if (r.isHoliday) {
            return {
              id: r.id,
              day: new Date(`${r.date}T00:00:00Z`),
              taskId: undefined,
              projectId: undefined,
              description:
                r.description || `Holiday: ${r.holidayName || "Holiday"}`,
              hours: 8,
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

  const weekHolidayCount = useMemo(() => {
    return rows.filter((r) => r.isHoliday && !r.isSummary).length;
  }, [rows]);

  const handleWeekendToggle = (
    day: string,
    checked: boolean,
    dayRows: TimesheetRowUI[],
  ) => {
    const dayRowKeys = dayRows.map((row) => row.key);
    dayRowKeys.forEach((key) => {
      setWeekendEditable((prev) => ({
        ...prev,
        [key]: checked,
      }));
    });
  };

  const renderEntryRow = (row: TimesheetRowUI) => {
    const isLeave = row.isLeave;
    const isHoliday = row.isHoliday;
    const isToday = DAYS.find((d) => d.fullDate === row.date)?.isToday;
    const isWeekendDay = row.day === "Sat" || row.day === "Sun";

    return (
      <div
        key={row.key}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          background: isLeave ? "var(--bg-leave)" : isHoliday ? "var(--bg-holiday)" : "var(--bg-pure-white)",
          borderBottom: "1px solid var(--border-slate-100)",
          transition: "all 0.2s ease",
          opacity: isWeekendDay && !isFieldEditable(row) ? 0.6 : 1,
        }}
        className={`entry-row ${isLeave ? "entry-row-leave" : isHoliday ? "entry-row-holiday" : "entry-row-active"}`}
      >
        {/* Project Select */}
        <div style={{ width: 150 }}>
          <Select
            disabled={isViewMode || !isFieldEditable(row) || isLeave || isHoliday}
            bordered={false}
            value={row.projectId}
            placeholder="Project"
            style={{ width: "100%", fontSize: 14 }}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
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
        </div>

        {/* Tasks Multi-Select */}
        <div style={{ width: 180 }}>
          <Select
            mode="multiple"
            allowClear
            bordered={false}
            value={row.taskIds}
            placeholder="Select tasks"
            style={{ width: "100%", fontSize: 14 }}
            disabled={isViewMode || !isFieldEditable(row) || isLeave || isHoliday || !row.projectId}
            options={getAvailableTasks(row.projectId).map((t) => ({ value: t.id, label: t.name }))}
            onChange={(taskIds: string[]) => {
              const selectedTasks = tasks.filter((t) => taskIds.includes(t.id));
              updateRow(row.key, {
                taskIds,
                taskNames: selectedTasks.map((t) => t.name),
              });
            }}
          />
        </div>

        {/* Description Input */}
        <div style={{ flex: 1 }}>
          <Input
            placeholder="What are you working on?"
            value={row.description}
            onChange={(e) => updateRow(row.key, { description: e.target.value })}
            disabled={isViewMode || !isFieldEditable(row) || isLeave || isHoliday}
            style={{ width: "100%", fontSize: 14 }}
            bordered={false}
          />
        </div>

        {/* Hours Input */}
        <div style={{ width: 80, display: "flex", justifyContent: "center" }}>
          <InputNumber<number>
            min={0}
            max={24}
            step={0.5}
            value={row.hours}
            disabled={isViewMode || !isFieldEditable(row) || isLeave || isHoliday}
            controls={false}
            onChange={(value) => {
              if (!isLeave && !isHoliday) {
                updateRow(row.key, { hours: value ?? 0 });
              }
            }}
            onKeyDown={(e) => {
              const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
              if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
                return;
              }
              if (!/^\d$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            style={{ width: 60, textAlign: "center", borderRadius: 6, background: isFieldEditable(row) && !isLeave && !isHoliday ? "var(--bg-table-header)" : "transparent" }}
          />
        </div>

        {/* Billable Switch */}
        <div style={{ width: 70, display: "flex", justifyContent: "center" }}>
          <Switch
            disabled={isViewMode || !isFieldEditable(row) || isLeave || isHoliday}
            checked={row.billable}
            onChange={(v) => !isLeave && !isHoliday && updateRow(row.key, { billable: v })}
            size="small"
          />
        </div>

        {/* Actions */}
        {!isViewMode && (
          <div style={{ width: 70, display: "flex", justifyContent: "center", gap: 12 }}>
            {!isLeave && !isHoliday ? (
              <>
                <Tooltip title="Copy entry">
                  <Button
                    type="text"
                    icon={<Copy size={16} color={isFieldEditable(row) ? "#64748b" : "#cbd5e1"} />}
                    disabled={!isFieldEditable(row)}
                    onClick={() => isFieldEditable(row) && handleCopyRow(row)}
                    style={{ padding: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
                  />
                </Tooltip>
                <Tooltip title="Delete entry">
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    disabled={!isFieldEditable(row)}
                    onClick={() => isFieldEditable(row) && handleDeleteRow(row.key)}
                    style={{ padding: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
                  />
                </Tooltip>
              </>
            ) : (
              <div style={{ width: 64 }} />
            )}
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      <div style={{
        margin: "0 -24px",
        padding: "0 32px",
        background: "var(--bg-pure-white)",
        height: "calc(100vh - 72px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header Section */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          background: "var(--bg-pure-white)",
          zIndex: 100,
          padding: "20px 0 12px 0",
          borderBottom: "1px solid var(--border-slate-100)",
          marginBottom: 16,
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }}>
            <Space size={14} align="center">
              <div style={{ background: "var(--bg-sky-50)", padding: 12, borderRadius: 14, color: "var(--text-sky-500)", display: "flex" }}>
                <ClipboardList size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>{isEditMode ? "Edit Timesheet" : "Submit Timesheet"}</Title>
                <Text style={{ color: "var(--text-slate-600)", fontSize: 15 }}>
                  {isEditMode
                    ? "Review and save your updated timesheet for this period."
                    : "Please fill in your working hours for the current week."}
                </Text>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Week Selector Context */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-table-header)", padding: "4px", borderRadius: 12, border: "1px solid var(--border-slate-200)" }}>
              <Button
                type="text"
                icon={<ChevronLeft size={18} />}
                onClick={() => setCurrentDate(currentDate.subtract(1, "week"))}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, width: 36, borderRadius: 8 }}
              />
              <div style={{ padding: "0 16px", fontWeight: 600, color: "var(--text-slate-900)", fontSize: 14, minWidth: 180, textAlign: "center" }}>
                {currentDate.startOf("week").format("MMM DD")} – {currentDate.endOf("week").format("MMM DD, YYYY")}
              </div>
              <Button
                type="text"
                icon={<ChevronRight size={18} />}
                onClick={() => setCurrentDate(currentDate.add(1, "week"))}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, width: 36, borderRadius: 8 }}
              />
            </div>

            <Tooltip title={`${totalHours}h / 40h logged`}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 16px",
                background: "var(--bg-table-header)",
                borderRadius: 12,
                border: "1px solid var(--border-slate-200)",
                height: 44
              }}>
                <Clock size={16} color="var(--text-slate-600)" />
                <div style={{ width: 80 }}>
                  <Progress
                    percent={(totalHours / 40) * 100}
                    showInfo={false}
                    strokeColor={totalHours >= 40 ? "#10b981" : "#0ea5e9"}
                    trailColor="var(--border-slate-200)"
                    strokeWidth={6}
                  />
                </div>
                <Text strong style={{ fontSize: 13, color: "var(--text-slate-900)" }}>{totalHours}h</Text>
              </div>
            </Tooltip>

            <Button
              icon={<Save size={18} />}
              loading={saveDraftLoading}
              onClick={handleSaveDraft}
              disabled={isViewMode || status === "Submitted"}
              style={{ height: 44, borderRadius: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
            >
              Save Draft
            </Button>

            <Button
              type="primary"
              icon={<Send size={18} />}
              onClick={() => setIsSubmitOpen(true)}
              style={{ height: 44, borderRadius: 10, fontWeight: 600, background: '#1677ff', display: "flex", alignItems: "center", gap: 8 }}
            >
              Submit
            </Button>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        .timesheet-scroll-area { 
          scrollbar-width: none !important; 
          -ms-overflow-style: none !important;
        }
        .timesheet-scroll-area::-webkit-scrollbar { 
          display: none !important; 
        }
        .day-card { 
          transition: all 0.2s ease; 
          border: 1px solid var(--border-slate-100) !important;
        }
        .day-card:hover { 
          border-color: var(--text-sky-500) !important;
          box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.05) !important;
        }
        .entry-row-active {
          background: var(--bg-pure-white);
        }
        .entry-row-leave {
          background: var(--bg-leave);
        }
        .entry-row-holiday {
          background: var(--bg-holiday);
        }
      `}} />

        {/* Main Content Card Wrapper */}
        <div className="timesheet-scroll-area" style={{ flex: 1, overflowY: "auto", padding: "0 0 24px 0", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "var(--bg-pure-white)",
              border: "1px solid var(--border-slate-100)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              overflow: "hidden",
              marginBottom: 20
            }}
            bodyStyle={{ padding: "24px 32px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                maxWidth: 1000,
                margin: "0 auto",
                width: "100%"
              }}
            >
              {weekLeaveCount > 0 && (
                <div style={{ padding: "12px 16px", background: "var(--bg-leave)", borderRadius: 12, border: "1px solid var(--border-blue-200)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "var(--bg-pure-white)", padding: 6, borderRadius: 8, color: "#f43f5e", display: "flex" }}>
                    <AlertCircle size={18} />
                  </div>
                  <Text style={{ color: "#9f1239", fontSize: 13 }}>
                    <Text strong style={{ color: "#9f1239" }}>Leave Alert:</Text> You have {weekLeaveCount} leave day(s) this week. These days are disabled for manual entries.
                  </Text>
                </div>
              )}

              {weekHolidayCount > 0 && (
                <div style={{ padding: "12px 16px", background: "var(--bg-holiday)", borderRadius: 12, border: "1px solid var(--border-blue-200)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "var(--bg-pure-white)", padding: 6, borderRadius: 8, color: "#10b981", display: "flex" }}>
                    <Calendar size={18} />
                  </div>
                  <Text style={{ color: "#166534", fontSize: 13 }}>
                    <Text strong style={{ color: "#166534" }}>Holiday Alert:</Text> You have {weekHolidayCount} holiday(s) this week. These days are pre-filled with 8 hours.
                  </Text>
                </div>
              )}

              {DAYS.map((day) => {
                const dayRows = getDayRows(day.label);
                const dayTotal = getDayTotal(day.label);
                const isLeaveDay = dayRows.some((r) => r.isLeave);
                const isHoliday = day.isHoliday;
                const holidayName = day.holidayName;
                const isExpanded = expandedDays.has(day.label);
                const isToday = day.isToday;
                const isWeekendDay = day.label === "Sat" || day.label === "Sun";

                const anyRowEditable = dayRows.some(
                  (row) => !row.isLeave && !row.isHoliday,
                );

                const allWeekendEnabled =
                  isWeekendDay &&
                  anyRowEditable &&
                  dayRows.every(
                    (row) =>
                      row.isLeave || row.isHoliday || weekendEditable[row.key],
                  );

                return (
                  <Card
                    key={day.label}
                    className="day-card"
                    style={{
                      borderRadius: 12,
                      border: isToday ? "1px solid var(--text-sky-500)" : "1px solid var(--border-slate-100)",
                      background: isLeaveDay ? "var(--bg-leave)" : isHoliday ? "var(--bg-holiday)" : "var(--bg-pure-white)",
                      cursor: "pointer",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onClick={() => toggleDayExpand(day.label)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          background: isToday ? "var(--text-sky-500)" : isLeaveDay ? "#f43f5e" : isHoliday ? "#10b981" : "var(--bg-table-header)",
                          borderRadius: 10,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isToday || isLeaveDay || isHoliday ? "white" : "var(--text-slate-600)",
                          border: isToday || isLeaveDay || isHoliday ? "none" : "1px solid var(--border-slate-200)"
                        }}>
                          <Text style={{ color: "inherit", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{day.label.toUpperCase()}</Text>
                          <Text style={{ color: "inherit", fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{day.dayNumber}</Text>
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Text strong style={{ fontSize: 16, color: "var(--text-slate-900)" }}>{day.fullDateObj.format("MMMM DD, YYYY")}</Text>
                            {isToday && <Tag color="blue" style={{ borderRadius: 4, fontWeight: 600 }}>Today</Tag>}
                            {isHoliday && !isLeaveDay && <Tag color="green" style={{ borderRadius: 4 }}>{holidayName}</Tag>}
                            {isLeaveDay && <Tag color="red" style={{ borderRadius: 4 }}>On Leave</Tag>}
                          </div>
                          <Text style={{ color: "var(--text-slate-600)", fontSize: 13 }}>{dayRows.length} {dayRows.length === 1 ? "entry" : "entries"}</Text>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        {isExpanded && !isLeaveDay && !isHoliday && (
                          <Button
                            type="primary"
                            icon={<Plus size={14} />}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              addEntry(day.label, day.fullDate);
                            }}
                            disabled={isViewMode}
                            style={{ borderRadius: 6, background: "var(--text-sky-500)" }}
                          >
                            Add Item
                          </Button>
                        )}

                        {isWeekendDay && anyRowEditable && !isLeaveDay && !isHoliday && (
                          <Checkbox
                            checked={allWeekendEnabled}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleWeekendToggle(day.label, e.target.checked, dayRows);
                            }}
                            style={{ color: "var(--text-slate-600)" }}
                          >
                            Enable Weekend
                          </Checkbox>
                        )}

                        <div style={{
                          padding: "4px 12px",
                          background: isToday ? "rgba(14, 165, 233, 0.1)" : "var(--bg-table-header)",
                          borderRadius: 20,
                          border: `1px solid ${isToday ? "rgba(14, 165, 233, 0.2)" : "var(--border-slate-200)"}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          <Clock size={14} color={isToday ? "var(--text-sky-500)" : "var(--text-slate-600)"} />
                          <Text strong style={{ color: isToday ? "var(--text-sky-500)" : "var(--text-slate-900)" }}>{dayTotal}h</Text>
                        </div>

                        {isExpanded ? <UpOutlined style={{ color: "#94a3b8" }} /> : <DownOutlined style={{ color: "#94a3b8" }} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 20 }}>
                        {dayRows.length > 0 && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "8px 16px",
                            background: "var(--bg-table-header)",
                            borderRadius: "8px 8px 0 0",
                            borderBottom: "1px solid var(--border-slate-100)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--text-slate-600)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }}>
                            <div style={{ width: 150 }}>Project</div>
                            <div style={{ width: 180 }}>Tasks</div>
                            <div style={{ flex: 1 }}>Description</div>
                            <div style={{ width: 80, textAlign: "center" }}>Hours</div>
                            <div style={{ width: 70, textAlign: "center" }}>Billable</div>
                            {!isViewMode && <div style={{ width: 70, textAlign: "center" }}>Actions</div>}
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {dayRows.length > 0 ? (
                            dayRows.map((row) => renderEntryRow(row))
                          ) : (
                            <div style={{ padding: 40, textAlign: "center", background: "var(--bg-table-header)", borderRadius: 8, border: "1px dashed var(--border-slate-100)" }}>
                              <div style={{ color: "var(--text-slate-400)", marginBottom: 8 }}><Clock size={32} strokeWidth={1.5} /></div>
                              <Text style={{ color: "var(--text-slate-600)" }}>
                                {isLeaveDay ? "No entries allowed on leave days" : isHoliday ? "Holiday hours automatically logged" : "No entries. Click 'Add Item' to record time."}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Week Total Footer Area */}
            <div style={{
              marginTop: 16,
              padding: "10px 20px",
              background: "var(--bg-table-header)",
              borderRadius: 12,
              border: "1px solid var(--border-slate-100)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: 1000,
              margin: "16px auto 0"
            }}>
              <Text strong style={{ color: "var(--text-slate-900)", fontSize: 14 }}>Weekly Summary</Text>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Text style={{ fontSize: 11, color: "var(--text-slate-600)" }}>Billable Hours</Text>
                  <Text strong style={{ fontSize: 16, color: "#10b981" }}>{totalBillable}h</Text>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Text style={{ fontSize: 11, color: "var(--text-slate-600)" }}>Total Logged</Text>
                  <Text strong style={{ fontSize: 16, color: "var(--text-sky-500)" }}>{totalHours}h <Text style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 400 }}>/ 40h</Text></Text>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {weekLeaveCount > 0 && <Tag color="red" style={{ borderRadius: 6, padding: "2px 10px" }}>{weekLeaveCount} Day Leave</Tag>}
                  {weekHolidayCount > 0 && <Tag color="green" style={{ borderRadius: 6, padding: "2px 10px" }}>{weekHolidayCount} Day Holiday</Tag>}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Submit Modal */}
        <Modal
          open={isSubmitOpen}
          onCancel={() => setIsSubmitOpen(false)}
          footer={null}
          width={460}
          centered
          styles={{
            body: {
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 16,
              paddingBottom: 16,
            },
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              margin: 0,
            }}
          >
            <SendOutlined style={{ color: "var(--text-sky-500)", fontSize: 16 }} />
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>
                {isEditMode ? "Save Changes" : "Submit Timesheet"}
              </Text>
              <br />
              <Text style={{ color: "var(--text-slate-600)", fontSize: 11 }}>
                {isEditMode
                  ? "Review and save your updated timesheet."
                  : "Review your timesheet summary before submission."}
              </Text>
            </div>
          </div>

          <Row gutter={[20, 20]} style={{ marginTop: 16, marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <StatCard
                label="Total Hours"
                value={`${totalHours}h`}
                icon={Clock}
                color="#3b82f6"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                label="Billable"
                value={`${totalBillable}h`}
                icon={Zap}
                color="#10b981"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                label="Entries"
                value={entryCount}
                icon={FileText}
                color="#64748b"
              />
            </Col>
          </Row>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #f1f5f9"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: "#475569" }}>
              Projects (
              {
                new Set(
                  rows
                    .filter((r) => !r.isLeave && !r.isHoliday)
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
                    .filter((r) => !r.isLeave && !r.isHoliday)
                    .map((r) => r.projectName)
                    .filter(Boolean),
                ),
              ].map((projectName) => (
                <Tag
                  key={projectName}
                  style={{
                    borderRadius: 999,
                    padding: "2px 10px",
                    background: "#fff",
                    fontSize: 11,
                    border: "1px solid #e2e8f0",
                    color: "#475569"
                  }}
                >
                  {projectName}
                </Tag>
              ))}
            </div>
          </div>

          {weekLeaveCount > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 8,
                background: "#fff1f2",
                color: "#e11d48",
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 12
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 14 }} />
              <span>
                You have {weekLeaveCount} leave day(s) this week.
              </span>
            </div>
          )}

          {weekHolidayCount > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f0fdf4",
                color: "#166534",
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 12
              }}
            >
              <CalendarOutlined style={{ fontSize: 14 }} />
              <span>
                You have {weekHolidayCount} holiday(s) this week.
              </span>
            </div>
          )}

          {totalHours < expectedHours && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 8,
                background: "#fffbeb",
                color: "#b45309",
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 12
              }}
            >
              <WarningOutlined style={{ fontSize: 14 }} />
              <span>
                Logged {expectedHours - totalHours}h less than expected.
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsSubmitOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
            {!isPreviewMode && (
              <Button
                type="primary"
                loading={isEditMode ? saveChangesLoading : submitLoading}
                icon={isEditMode ? <Save size={16} /> : <Send size={16} />}
                onClick={isEditMode ? handleSaveChanges : handleSubmitTimesheet}
                style={{ borderRadius: 8, background: "#0ea5e9", borderColor: "#0ea5e9", display: "flex", alignItems: "center", gap: 8 }}
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