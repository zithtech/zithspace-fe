"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Select,
  Tag,
  Button,
  Dropdown,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
//import { TimesheetService } from "@/services/timesheetService";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTimesheets } from "@/hooks/useTimesheet";

const { Title, Text } = Typography;

export default function TeamsPage() {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  //const [timesheets, setTimesheets] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const { data: timesheetsData, isLoading } = useTimesheets();
  const timesheets = timesheetsData?.data || [];

  /* ---------------- LOAD DATA ---------------- */
  // useEffect(() => {
  //   loadTeamTimesheets();
  // }, []);

  // const loadTeamTimesheets = async () => {
  //   const list = await TimesheetService.getAll(); // submit pannina data
  //   setTimesheets(list);
  // };

  // const loadTeamTimesheets = async () => {
  //   const all = await TimesheetService.getAll();
  //   //const submittedOnly = all.filter((t: any) => t.status === "Submitted");
  //   setTimesheets(all);

  // const rejectedOnly = timesheets.filter((t) => t.status === "Rejected");
  // const approvedOnly = timesheets.filter((t) => t.status === "Approved");
  //};

  /* ---------------- FILTER ---------------- */

 const filteredData = useMemo(() => {
  return timesheets.filter((t) => {
    const userId = t.user?.id;

    const memberOk =
      selectedMembers.length === 0 ||
      (userId ? selectedMembers.includes(userId) : false);

    const weekOk = selectedWeek
      ? dayjs(t.weekStart).startOf("week").isSame(dayjs(selectedWeek), "day")
      : true;

    return memberOk && weekOk;
  });
}, [timesheets, selectedMembers, selectedWeek]);



  // const members = useMemo(() => {
  //   const map = new Map();
  //   timesheets.forEach((t) => {
  //     map.set(t.user?.id, {
  //       id: t.user?.id,
  //       name: t.employeeName,
  //     });
  //   });
  //   return Array.from(map.values());
  // }, [timesheets]);
  const members = useMemo(() => {
    const map = new Map();
    timesheets.forEach((t) => {
      if (t.user) {
        map.set(t.user.id, {
          id: t.user.id,
          name: t.user.name,
        });
      }
    });
    return Array.from(map.values());
  }, [timesheets]);

  const weekOptions = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      const start = dayjs().startOf("week").subtract(i, "week"); // Sunday
      const end = start.add(6, "day"); // Saturday

      weeks.push({
        label: `${start.format("MMM DD")} – ${end.format("MMM DD")}`,
        value: start.format("YYYY-MM-DD"), // IMPORTANT
      });
    }
    return weeks;
  }, []);

  /* ---------------- COUNTS ---------------- */
  const approvedCount = filteredData.filter(
    (t) => t.status === "APPROVED",
  ).length;

  const pendingCount = filteredData.filter(
    (t) => t.status !=="APPROVED",
  ).length;

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    // {
    //   title: "Employee",
    //   render: (_: any, r: any) => (
    //     <>
    //       <strong>{r.employeeName}</strong>
    //       <br />
    //       <span style={{ color: "#888" }}>{r.user?.id}</span>
    //     </>
    //   ),
    // },
    {
  title: "Employee",
  render: (_: any, r: any) => (
    <>
      <strong>{r.user?.name}</strong>
      <br />
      <span style={{ color: "#888" }}>{r.user?.email}</span>
    </>
  ),
},


    {
      title: "Date",
      render: (_: any, r: any) => {
        const start = dayjs(r.weekStart);
        const end = start.add(6, "day");
        return `${start.format("MMM DD")} – ${end.format("MMM DD")}`;
      },
    },
    // {
    //   title: "Status",
    //   render: (_: any, r: any) => {
    //     if (r.status === "Approved") {
    //       return (
    //         <Space>
    //           <Tag color="green">Approved</Tag>
    //           <CheckCircleOutlined style={{ color: "#52c41a" }} />
    //         </Space>
    //       );
    //     }
    //     if (r.status === "Rejected") {
    //       return (
    //         <Space>
    //           <Tag color="red">Rejected</Tag>
    //           <WarningOutlined style={{ color: "#fa8c16" }} />
    //         </Space>
    //       );
    //     }
    //     return <Tag color="orange">Submitted</Tag>;
    //   },
    // },
    {
      title: "Status",
      render: (_: any, r: any) => {
        if (r.status === "APPROVED") {
          return (
            <Space>
              <Tag color="green">Approved</Tag>
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
            </Space>
          );
        }

        if (r.status === "REJECTED") {
          return (
            <Space>
              <Tag color="red">Rejected</Tag>
              <WarningOutlined style={{ color: "#fa8c16" }} />
            </Space>
          );
        }

        if (r.status === "SUBMITTED") {
          return <Tag color="orange">Submitted</Tag>;
        }

        return <Tag color="blue">Draft</Tag>;
      },
    },

    {
      title: "Total Hours",
      dataIndex: "totalHours",
      render: (h: number) => `${h}h`,
    },
    {
      title: "Leave",
      dataIndex: "leave",
    },
    {
      title: "Actions",
      render: (_: any, r: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "View",
                // onClick: () =>
                //   //   router.push(`/timesheets/teams?member=${r.userId}`),
                //   // router.push(
                //   //   `/timesheets/timesheet/create?id=${r.id}&mode=preview`
                //   // ),
                //   // router.push("/timesheets/team"),
                //   router.push("/timesheets/teams/team"),
                onClick: () =>
                  // router.push(`/timesheets/teams/team?timesheetId=${r.id}`),
                  // router.push(`/timesheets/timesheet?id=${r.id}&mode=view`),
                  router.push(
                    `/timesheets/timesheet/create?id=${r.id}&mode=view`,
                  ),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  /* ---------------- UI ---------------- */
  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        {/* HEADER */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, color: "#262626" }}>
              Team
            </Title>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Select
              mode="multiple"
              placeholder="Select Members"
              style={{ width: 200 }}
              value={selectedMembers}
              onChange={setSelectedMembers}
              options={members.map((m) => ({
                label: m.name,
                value: m.id,
              }))}
            />
            <Select
              placeholder="Select Week (Sun – Sat)"
              style={{ width: 200 }}
              value={selectedWeek}
              onChange={setSelectedWeek}
              options={weekOptions}
              allowClear
            />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", gap: 16 }}>
            <Button
              style={{
                minWidth: 120,
                textAlign: "center",
                padding: "12px 16px",
              }}
            >
              <Text strong>Approved</Text>
              <div style={{ fontSize: 20 }}>{approvedCount}</div>
            </Button>
            <Button
              style={{
                minWidth: 120,
                textAlign: "center",
                padding: "12px 16px",
              }}
            >
              <Text strong>Pending</Text>
              <div style={{ fontSize: 20 }}>{pendingCount}</div>
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <Card style={{ marginTop: 30 }}>
          <Table columns={columns} dataSource={filteredData} rowKey="id"  loading={isLoading}/>
        </Card>
      </div>
    </MainLayout>
  );
}
