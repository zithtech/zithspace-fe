// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Typography,
//   Button,
//   Table,
//   Select,
//   Space,
//   Avatar,
//   Divider,
//   Tag,
// } from "antd";
// import {
//   CheckCircleOutlined,
//   WarningOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
// import { useState, useEffect, useMemo } from "react";
// import type { ColumnsType } from "antd/es/table";
// import dayjs, { Dayjs } from "dayjs";
// import { TimesheetService } from "@/services/timesheetService";
// import { useSearchParams } from "next/navigation";

// const { Title, Text } = Typography;

// /* ---------- Types ---------- */
// interface TimesheetRow {
//   key: string;
//   day: string;
//   date: string;
//   projectId?: string;
//   taskId?: string;
//   description?: string;
//   hours?: number;
//   billable?: boolean;
//   status?: "Draft" | "Submitted" | "Rejected" | "Approved";
//   isSummary?: boolean;
// }

// /* ---------- Static Data ---------- */
// const PROJECTS = [
//   { value: "p1", label: "Enterprise Dashboard" },
//   { value: "p2", label: "Mobile App Redesign" },
// ];

// const TASKS = [
//   { value: "dev", label: "Development" },
//   { value: "proto", label: "Prototyping" },
//   { value: "review", label: "Code Review" },
// ];

// const TEAM_MEMBERS = [
//   { value: "mike", name: "Mike Chen", role: "Design", initials: "MC" },
//   { value: "john", name: "John Doe", role: "Frontend", initials: "JD" },
// ];

// /* ---------- Component ---------- */
// export default function TeamTimesheetPage() {
//   /* ---------- URL PARAM ---------- */
//   const searchParams = useSearchParams();
//   const memberFromUrl = searchParams.get("member");

//   /* ---------- STATE ---------- */
//   const [selectedMember, setSelectedMember] = useState(
//     memberFromUrl ?? TEAM_MEMBERS[0].value
//   );
//   const [rows, setRows] = useState<TimesheetRow[]>([]);
//   const [currentDate] = useState<Dayjs>(dayjs());

//   /* ---------- SYNC URL → STATE ---------- */
//   useEffect(() => {
//     if (memberFromUrl) {
//       setSelectedMember(memberFromUrl);
//     }
//   }, [memberFromUrl]);

//   /* ---------- FETCH DATA ---------- */
//   useEffect(() => {
//     async function fetchData() {
//       const sheet = await TimesheetService.getById(selectedMember);
//       if (sheet) setRows(sheet.rows);
//       else setRows([]);
//     }
//     fetchData();
//   }, [selectedMember]);

//   /* ---------- DISPLAY ROWS (WITH DAILY SUMMARY) ---------- */
//   const displayRows = useMemo(() => {
//     const result: TimesheetRow[] = [];

//     const days = Array.from({ length: 7 }).map((_, i) => {
//       const d = currentDate.startOf("week").add(i, "day");
//       return { label: d.format("ddd"), date: d.format("MMM DD") };
//     });

//     days.forEach((d) => {
//       const dayRows = rows.filter((r) => r.day === d.label);
//       const total = dayRows.reduce((s, r) => s + (r.hours || 0), 0);

//       dayRows.forEach((r) => result.push(r));

//       result.push({
//         key: `${d.label}-summary`,
//         day: d.label,
//         date: d.date,
//         hours: total,
//         isSummary: true,
//       });
//     });

//     return result;
//   }, [rows, currentDate]);

//   /* ---------- TOTALS ---------- */
//   const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);
//   const totalBillable = rows.reduce(
//     (s, r) => s + (r.billable ? r.hours || 0 : 0),
//     0
//   );

//   /* ---------- HELPERS ---------- */
//   const getProjectName = (id?: string) =>
//     PROJECTS.find((p) => p.value === id)?.label || "-";

//   const getTaskName = (id?: string) =>
//     TASKS.find((t) => t.value === id)?.label || "-";

//   /* ---------- EXPORT ---------- */
//   const handleExport = () => {
//     if (!rows.length) return;

//     const headers = [
//       "Date",
//       "Day",
//       "Project",
//       "Task",
//       "Description",
//       "Hours",
//       "Billable",
//       "Status",
//     ];

//     const csvRows = rows.map((r) => [
//       r.date,
//       r.day,
//       getProjectName(r.projectId),
//       getTaskName(r.taskId),
//       r.description ?? "",
//       r.hours ?? 0,
//       r.billable ? "Yes" : "No",
//       r.status ?? "Draft",
//     ]);

//     const csv = [headers, ...csvRows]
//       .map((row) => row.join(","))
//       .join("\n");

//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "team_timesheet.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   /* ---------- TABLE COLUMNS ---------- */
//   const columns: ColumnsType<TimesheetRow> = [
//     {
//       title: "DAY",
//       width: 120,
//       render: (_, r) =>
//         r.isSummary ? (
//           <Text type="secondary">{r.date}</Text>
//         ) : (
//           <Text strong>{r.day}</Text>
//         ),
//     },
//     {
//       title: "PROJECT",
//       render: (_, r) => (r.isSummary ? null : getProjectName(r.projectId)),
//     },
//     {
//       title: "TASK",
//       render: (_, r) => (r.isSummary ? null : getTaskName(r.taskId)),
//     },
//     {
//       title: "DESCRIPTION",
//       render: (_, r) =>
//         r.isSummary ? <Text strong>Total</Text> : r.description,
//     },
//     {
//       title: "HOURS",
//       width: 100,
//       render: (_, r) => <Text>{r.hours ?? 0}h</Text>,
//     },
//     {
//       title: "BILLABLE",
//       width: 90,
//       render: (_, r) =>
//         r.isSummary ? null : (
//           <Tag color={r.billable ? "blue" : "default"}>
//             {r.billable ? "Yes" : "No"}
//           </Tag>
//         ),
//     },
//     {
//       title: "ACTIONS",
//       width: 120,
//       align: "center",
//       render: (_, r) =>
//         r.isSummary ? null : (
//           <Space>
//             <CheckCircleOutlined
//               style={{ color: "#52c41a", cursor: "pointer" }}
//               onClick={async () => {
//                 await TimesheetService.update(r.key, {
//                   status: "Approved",
//                 });
//                 alert("Approved");
//               }}
//             />
//             <WarningOutlined
//               style={{ color: "#ff4d4f", cursor: "pointer" }}
//               onClick={async () => {
//                 await TimesheetService.update(r.key, {
//                   status: "Rejected",
//                 });
//                 alert("Rejected");
//               }}
//             />
//           </Space>
//         ),
//     },
//   ];

//   /* ---------- RENDER ---------- */
//   return (
//     <MainLayout>
//       <div style={{ padding: 40 }}>
//         {/* Header */}
//         <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
//           <Title level={3} style={{ margin: 0 }}>
//             Team Timesheet
//           </Title>

//           <Select
//             value={selectedMember}
//             onChange={setSelectedMember}
//             style={{ width: 260 }}
//           >
//             {TEAM_MEMBERS.map((m) => (
//               <Select.Option key={m.value} value={m.value}>
//                 <Space>
//                   <Avatar>{m.initials}</Avatar>
//                   <div>
//                     <div>{m.name}</div>
//                     <Text type="secondary" style={{ fontSize: 12 }}>
//                       {m.role}
//                     </Text>
//                   </div>
//                 </Space>
//               </Select.Option>
//             ))}
//           </Select>

//           <Button
//             icon={<DownloadOutlined />}
//             onClick={handleExport}
//             style={{ marginLeft: "auto" }}
//           >
//             Export
//           </Button>
//         </div>

//         <Divider />

//         {/* Table */}
//         <Table
//           bordered
//           columns={columns}
//           dataSource={displayRows}
//           pagination={false}
//           rowKey="key"
//           summary={() => (
//             <Table.Summary.Row>
//               <Table.Summary.Cell
//                 index={0}
//                 colSpan={columns.length}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                   }}
//                 >
//                   <Text strong>Week Total</Text>
//                   <Text strong>
//                     {totalHours}h{" "}
//                     <Text type="secondary">
//                       ({totalBillable}h billable)
//                     </Text>
//                   </Text>
//                 </div>
//               </Table.Summary.Cell>
//             </Table.Summary.Row>
//           )}
//         />
//       </div>
//     </MainLayout>
//   );
// }

"use client";

import MainLayout from "@/components/layout/MainLayout";
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
} from "@ant-design/icons";
import { useMemo, useState, useEffect, useRef } from "react";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
//import { TimesheetService } from "@/services/timesheetService";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useTimesheetData,
  useTimesheetById,
  useCreateTimesheet,
  useUpdateTimesheet,
} from "@/hooks/useTimesheet";

const { Title, Text } = Typography;

interface TimesheetRow {
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
}

const PROJECTS = [
  { value: "p1", label: "Enterprise Dashboard" },
  { value: "p2", label: "Mobile App Redesign" },
];

const TASKS = [
  { value: "dev", label: "Development" },
  { value: "proto", label: "Prototyping" },
  { value: "review", label: "Code Review" },
];

export default function MyTimesheetPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
  const [status, setStatus] = useState<"Draft" | "Submitted">("Draft");
  //const [timesheet, setTimesheet] = useState<any>(null);


  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // timesheet id
  const mode = searchParams.get("mode");
  const isEditMode = mode === "edit";
  const isPreviewMode = false;
 // const timesheetId = searchParams.get("timesheetId");
  const createTimesheetMutation = useCreateTimesheet();
  const updateTimesheetMutation = useUpdateTimesheet();

  const timesheetIdParam = searchParams.get("timesheetId");
  const timesheetId = timesheetIdParam ?? undefined;

  const DAYS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = currentDate.startOf("week").add(i, "day");
      return {
        label: d.format("ddd"),
        date: d.format("MMM DD"),
      };
    });
  }, [currentDate]);
   const loggedInEmployee = {
    employeeId: "EMP001",
    employeeName: "Bharathi Murugan",
  };


  //   useEffect(() => {
  //     if (id) {
  //       TimesheetService.getById(id).then((sheet) => {
  //         if (!sheet) return;
  //         setRows(sheet.rows);
  //         setIsSubmitted(sheet.status === "Submitted");
  //       });
  //     } else {
  //       setRows(
  //         DAYS.map((d) => ({
  //           key: `${d.label}-${Date.now()}`,
  //           day: d.label,
  //           date: d.date,
  //           hours: 0,
  //           billable: true,
  //           status: "Draft",
  //         }))
  //       );
  //     }
  //   }, [id, DAYS]);



//   useEffect(() => {
//   if (!timesheetId) return;

//   async function load() {
//     const data = await TimesheetService.getById(timesheetId??"");
//     setTimesheet(data);
//   }

//   load();
// }, [timesheetId]);


//   useEffect(() => {
//     if (id) {
//       TimesheetService.getById(id).then((sheet) => {
//         if (!sheet) return;

//         setRows(sheet.rows);
//         setIsSubmitted(sheet.status === "Submitted");

//         // ✅ Set status button from sheet
//         setStatus(sheet.status as "Draft" | "Submitted");
//       });
//     } else {
//       setRows(
//         DAYS.map((d) => ({
//           key: `${d.label}-${Date.now()}`,
//           day: d.label,
//           date: d.date,
//           hours: 0,
//           billable: true,
//           status: "Draft",
//         }))
//       );

//       setStatus("Draft"); // default for new timesheet
// //     }
// //   }, [id, DAYS]);
// const { timesheet, isLoading } = useTimesheetById(timesheetId);
const {
  data: timesheetData,
  isLoading,
  isError,
} = useTimesheetById(timesheetId);

// Set rows and status automatically when timesheetData loads
// useEffect(() => {
//   if (!timesheetData) {
//     // No data → initialize default rows for new timesheet
//     setRows(
//       DAYS.map((d) => ({
//         key: `${d.label}-${Date.now()}`,
//         day: d.label,
//         date: d.date,
//         hours: 0,
//         billable: true,
//         status: "Draft",
//       }))
//     );
//     setStatus("Draft");
//     return;
//   }

//   // Data exists → populate rows and status
//   setRows(timesheetData.rows);
//   setIsSubmitted(timesheetData.status === "SUBMITTED");
//   setStatus(timesheetData.status as "Draft" | "Submitted");
// }, [timesheetData, DAYS]);
useEffect(() => {
  if (!timesheetData) return;

  const mappedRows: TimesheetRow[] = timesheetData.rows.map((r) => ({
    key: r.id,                    // ✅ REQUIRED
    day: dayjs(r.day).format("ddd"),
    date: dayjs(r.day).format("MMM DD"),
    description: r.description,
    hours: r.hours,
    billable: r.billable,
    status: timesheetData.status === "SUBMITTED" ? "Submitted" : "Draft",
  }));

  setRows(mappedRows);
  setIsSubmitted(timesheetData.status === "SUBMITTED");
  setStatus(timesheetData.status === "SUBMITTED" ? "Submitted" : "Draft");

}, [timesheetData]);



  const updateRow = (key: string, patch: Partial<TimesheetRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
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
      },
    ]);
  };

  const handleCopyRow = (row: TimesheetRow) => {
    setRows((prev) => [...prev, { ...row, key: `${row.day}-${Date.now()}` }]);
  };

  const handleDeleteRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const displayRows = useMemo(() => {
    const result: TimesheetRow[] = [];
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
      });
    });
    return result;
  }, [rows, DAYS]);

  const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);
  const totalBillable = rows.reduce(
    (sum, r) => sum + (r.billable ? r.hours || 0 : 0),
    0
  );
  const expectedHours = 40;

  const columns: ColumnsType<TimesheetRow> = [
    {
      title: "DAY",
      width: 120,
      render: (_: any, r: TimesheetRow) =>
        r.isSummary ? (
          <Text type="secondary">{r.date}</Text>
        ) : (
          <Text strong>{r.day}</Text>
        ),
    },
    {
      title: "PROJECT",
      render: (_: any, r: TimesheetRow) =>
        r.isSummary ? (
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => addEntry(r.day, r.date)}
          >
            Add entry
          </Button>
        ) : (
          <Select
            bordered={false}
            value={r.projectId}
            placeholder="Project"
            options={PROJECTS}
            style={{ width: 200 }}
            onChange={(v) => updateRow(r.key, { projectId: v })}
          />
        ),
    },
    {
      title: "TASK",
      render: (_: any, r: TimesheetRow) =>
        r.isSummary ? null : (
          <Select
            bordered={false}
            value={r.taskId}
            placeholder="Task"
            options={TASKS}
            style={{ width: 200 }}
            onChange={(v) => updateRow(r.key, { taskId: v })}
          />
        ),
    },
    {
      title: "DESCRIPTION",
      render: (_: any, r: TimesheetRow) =>
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
      render: (_: any, r: TimesheetRow) =>
        r.isSummary ? (
          <Text strong>{r.hours ?? 0}h / 8h</Text>
        ) : (
          <InputNumber
            min={0}
            max={24}
            step={0.5}
            value={r.hours}
            onChange={(v) => updateRow(r.key, { hours: v ?? 0 })}
          />
        ),
    },
    {
      title: "BILLABLE",
      width: 90,
      render: (_: any, r: TimesheetRow) =>
        r.isSummary ? null : (
          <Switch
            checked={r.billable}
            onChange={(v) => updateRow(r.key, { billable: v })}
          />
        ),
    },
    {
      title: "ACTIONS",
      width: 120,
      render: (_: any, r: TimesheetRow) =>
        r.isSummary ? null : (
          <Space>
            <SnippetsOutlined onClick={() => handleCopyRow(r)} />
            <DeleteOutlined onClick={() => handleDeleteRow(r.key)} />
          </Space>
        ),
    },
  ];
  // const handleSubmitTimesheet = async () => {
  //   const payload = {
  //     id: Date.now().toString(),
  //     employeeId: loggedInEmployee.employeeId,       // ✅ add this
  //    employeeName: loggedInEmployee.employeeName,
  //     weekStart: currentDate.startOf("week").toISOString(),
  //     weekEnd: currentDate.endOf("week").toISOString(),
  //     rows,
  //     totalHours,
  //     totalBillable,
  //     status: "Submitted" as const,
  //     createdAt: new Date().toISOString(),
  //     approvedBy: "",
  //   };

  //   await TimesheetService.create(payload);
  //   setIsSubmitted(true);
  //   setIsSubmitOpen(false);
  //   setStatus("Submitted"); // ✅ Change Draft → Submitted
  //   setIsSubmittedModalOpen(true); // Show confirmation modal
  // };
  const handleSubmitTimesheet = () => {
  const payload = {
    id: Date.now().toString(),
    employeeId: loggedInEmployee.employeeId,
    employeeName: loggedInEmployee.employeeName,
    weekStart: currentDate.startOf("week").toISOString(),
    weekEnd: currentDate.endOf("week").toISOString(),
    rows,
    totalHours,
    totalBillable,
    status: "Submitted" as const,
    createdAt: new Date().toISOString(),
    approvedBy: "",
  };

  createTimesheetMutation.mutate(payload, {
    onSuccess: () => {
      setIsSubmitted(true);
      setIsSubmitOpen(false);
      setStatus("Submitted");
      setIsSubmittedModalOpen(true); // Show confirmation modal
    },
    onError: (err) => {
      console.error("Error submitting timesheet:", err);
    },
  });
};


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
  const handleSaveChanges = () => {
  if (!timesheetId) return;

  updateTimesheetMutation.mutate(
    { 
      id: timesheetId, 
      data: {
        rows,
        totalHours,
        totalBillable,
        status: "Submitted", // or "Draft" if you want
      },
    },
    {
      onSuccess: () => {
        setIsSubmitOpen(false);
        router.push("/timesheets/timesheet"); // redirect after update
      },
      onError: (err) => {
        console.error("Error updating timesheet:", err);
      },
    }
  );
};

  return (
    <MainLayout>
      <div style={{ padding:30}}>
        {/* Header */}

        <div className="timesheet-header"
          style={{
            
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            //padding: "20px 0",
            //borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, color: "#262626" }}>
              My Timesheet
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
            <Button type="default" style={{ minWidth: 80 }}>
              {status}
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
        style={{marginTop:"50px"}}
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
          //   summary={() => (
          //     <Table.Summary fixed>
          //       <Table.Summary.Row>
          //         <Table.Summary.Cell colSpan={columns.length}>
          //           <div style={{ display: "flex", justifyContent: "space-between", padding: 16 }}>
          //             <span>Week Total</span>
          //             <span>
          //               {totalHours}h ({totalBillable}h billable)
          //             </span>
          //           </div>
          //         </Table.Summary.Cell>
          //       </Table.Summary.Row>
          //     </Table.Summary>
          //   )}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={columns.length}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 16,
                    }}
                  >
                    <span>Week Total</span>
                    <span>
                      {totalHours}h ({totalBillable}h billable)
                    </span>
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        {/* Submit Modal */}
        {/* <Modal
          open={isSubmitOpen}
          onCancel={() => setIsSubmitOpen(false)}
          footer={null}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <SendOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            <Text strong style={{ fontSize: 16 }}>
              Submit Timesheet
            </Text>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSubmitTimesheet}>
              Submit
            </Button>
          </div>
        </Modal> */}
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
                {rows.length}
              </div>
              <div style={{ color: "#6b7a99", fontSize: 13 }}>Entries</div>
            </div>
          </div>

          {/* Projects */}
          {/* <Divider />
        <Text strong>Projects</Text>

        <div style={{ marginTop: 8 }}>
          {[...new Set(rows.map((r) => r.projectId).filter(Boolean))].map(
            (p) => (
              <Tag key={p}>{p}</Tag>
            )
          )}
        </div> */}
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
              {new Set(rows.map((r) => r.projectId).filter(Boolean)).size})
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[...new Set(rows.map((r) => r.projectId).filter(Boolean))].map(
                (p) => (
                  <Tag
                    key={p}
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      background: "#fff",
                    }}
                  >
                    {PROJECTS.find((x) => x.value === p)?.label ?? p}
                  </Tag>
                )
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
      </div>
    </MainLayout>
  );
}

