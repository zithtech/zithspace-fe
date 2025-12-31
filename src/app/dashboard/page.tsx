"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { AttendanceService, Attendance, TodayAttendance, AttendanceSummary, AttendanceFilters } from '@/services/attendanceService';
import { ApiError } from '@/lib/axios';
import dayjs from 'dayjs';
import { useRouter } from "next/navigation";
import { Camera, UsersRound, Clock11, TicketCheck,LogOut } from 'lucide-react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Avatar,
  Tag,
  Button,
  Alert,
  Skeleton,
  Badge,
  Tooltip
} from "antd";
import {
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  CalendarOutlined,
  BellOutlined,
  PlusOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleFilled,
  CloseCircleFilled

} from "@ant-design/icons";

const { Title, Text } = Typography;


// Define missing types locally
interface TodayAttendanceStatus extends TodayAttendance {
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isFlexible?: boolean;
  };
  isClockIn: boolean;
  clockInTime?: string;
  clockOutTime?: string;
  totalWorkMinutes: number;
}

interface DashboardSummary {
  totalMembers: number;
  expectedToday: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  wfhToday: number;
  attendanceRate: number;
}

interface PresentEmployee {
  id: string;
  name: string;
  position: string;
  status: string;
  clockInTime: string;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  };
  workHours: number;
}

// Extended Attendance interface to match actual API response
interface ExtendedAttendance extends Attendance {
  member?: {
    id: string;
    name: string;
    position: string;
  };
  effectiveWorkMinutes?: number;
}

// Extended AttendanceFilters to include search and member
interface ExtendedAttendanceFilters extends AttendanceFilters {
  search?: string;
  member?: string;
}
export type MeetingStatus = 'UPCOMING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export interface Meeting {
  id: string;
  meetingName: string;
  projectName: string;
  membersCount: number;
  time: string;
  status?: MeetingStatus;
}

const tickets = {
  "success": true,
  "data": [
    {
      "id": "25cad693-c63a-47fc-a702-53761f3abc4f",
      "ticketNumber": "TKT-0078",
      "title": "Document Verification for Driver App Backend",
      "status": "NOT_STARTED",
      "priority": "P1",
      "type": "TASK",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-22T14:33:01.464Z",
      "updatedAt": "2025-12-23T05:42:45.839Z",
      "createdBy": {
        "id": "69c902cb-0ad6-4234-8e47-552e93e568d6",
        "name": "Saroja",
        "workEmail": "saroja@zithmi.com"
      },
      "assignee": {
        "id": "58577de2-eb53-4327-a130-8733d0c1192f",
        "name": "Karthikeyan",
        "workEmail": "karthikeyan@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "89799c6c-592e-4bd2-824b-ffb0cc534f22",
      "ticketNumber": "TKT-0077",
      "title": "OTP Request And Verification For Driver App Backend",
      "status": "NOT_STARTED",
      "priority": "P1",
      "type": "TASK",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 3,
      "dueDate": null,
      "createdAt": "2025-12-22T14:28:45.848Z",
      "updatedAt": "2025-12-23T05:42:45.839Z",
      "createdBy": {
        "id": "69c902cb-0ad6-4234-8e47-552e93e568d6",
        "name": "Saroja",
        "workEmail": "saroja@zithmi.com"
      },
      "assignee": {
        "id": "58577de2-eb53-4327-a130-8733d0c1192f",
        "name": "Karthikeyan",
        "workEmail": "karthikeyan@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "3bfb3a37-bc61-4105-a338-d62842a583f3",
      "ticketNumber": "TKT-0076",
      "title": "Ride Alert Notification For Driver App",
      "status": "NOT_STARTED",
      "priority": "P1",
      "type": "TASK",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 2,
      "dueDate": null,
      "createdAt": "2025-12-22T14:15:00.940Z",
      "updatedAt": "2025-12-23T05:42:45.839Z",
      "createdBy": {
        "id": "69c902cb-0ad6-4234-8e47-552e93e568d6",
        "name": "Saroja",
        "workEmail": "saroja@zithmi.com"
      },
      "assignee": {
        "id": "58577de2-eb53-4327-a130-8733d0c1192f",
        "name": "Karthikeyan",
        "workEmail": "karthikeyan@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "bb0bce19-62b7-49fb-b0e0-6a61197eebb2",
      "ticketNumber": "TKT-0075",
      "title": "Base fare calculation",
      "status": "in_progress",
      "priority": "P2",
      "type": "Task",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-22T14:01:35.210Z",
      "updatedAt": "2025-12-23T04:57:30.643Z",
      "createdBy": {
        "id": "5fb01f2a-c111-45aa-961a-fcb1d23ef517",
        "name": "Subhalakshmi",
        "workEmail": "subhalakshmi.vinayagam@zithmi.com"
      },
      "assignee": {
        "id": "d3f3ded4-8079-42ad-bf3e-0a500f27946c",
        "name": "Subbulakshmi",
        "workEmail": "subbulakshmi@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "0d6c662c-34a8-4d0c-9647-c93ff295b30b",
      "ticketNumber": "TKT-0074",
      "title": "Home Screen For Drive App",
      "status": "in_progress",
      "priority": "P1",
      "type": "TASK",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 2,
      "dueDate": null,
      "createdAt": "2025-12-22T13:10:11.594Z",
      "updatedAt": "2025-12-23T05:42:45.839Z",
      "createdBy": {
        "id": "69c902cb-0ad6-4234-8e47-552e93e568d6",
        "name": "Saroja",
        "workEmail": "saroja@zithmi.com"
      },
      "assignee": {
        "id": "58577de2-eb53-4327-a130-8733d0c1192f",
        "name": "Karthikeyan",
        "workEmail": "karthikeyan@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "fc30e037-ee47-4875-b725-808f92f691bd",
      "ticketNumber": "TKT-0073",
      "title": "Profile Page For Driver App ",
      "status": "NOT_STARTED",
      "priority": "P1",
      "type": "TASK",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 2,
      "dueDate": null,
      "createdAt": "2025-12-22T13:04:42.256Z",
      "updatedAt": "2025-12-23T05:42:45.839Z",
      "createdBy": {
        "id": "69c902cb-0ad6-4234-8e47-552e93e568d6",
        "name": "Saroja",
        "workEmail": "saroja@zithmi.com"
      },
      "assignee": {
        "id": "58577de2-eb53-4327-a130-8733d0c1192f",
        "name": "Karthikeyan",
        "workEmail": "karthikeyan@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "02e7655d-e004-4749-818d-1332032b6de6",
      "ticketNumber": "TES6170-0072",
      "title": "Test 2",
      "status": "not_started",
      "priority": "P2",
      "type": "Task",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-22T11:19:27.819Z",
      "updatedAt": "2025-12-23T04:57:41.652Z",
      "createdBy": {
        "id": "f1f1760b-a35d-4d2a-ad3d-3658fa52462c",
        "name": "Admin User",
        "workEmail": "admin@zithmi.com"
      },
      "assignee": null,
      "project": {
        "id": "a531849b-ca70-48dd-b3a7-6e8ec59a55cf",
        "name": "Test Project",
        "code": "TES6170"
      }
    },
    {
      "id": "3af3a770-7ad7-47f7-9fd1-6f541c86b39e",
      "ticketNumber": "TKT-0071",
      "title": "Test",
      "status": "in_testing",
      "priority": "P2",
      "type": "Task",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-22T07:39:24.913Z",
      "updatedAt": "2025-12-22T11:17:34.646Z",
      "createdBy": {
        "id": "64a1fdac-354d-45e5-828f-8c16c2f15f21",
        "name": "ithyaz",
        "workEmail": "ithyaz@zithmi.com"
      },
      "assignee": {
        "id": "32df7388-9c84-484c-b796-364ffb1aa30c",
        "name": "Dinesh Kumar",
        "workEmail": "dineshdk@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
    {
      "id": "a4d4c6ed-88b5-4930-b9be-049a5bbc3e08",
      "ticketNumber": "TKT-0070",
      "title": "Dashboard UI changes and Enhancements",
      "status": "not_started",
      "priority": "P1",
      "type": "Feat",
      "platform": "Development",
      "taskLevel": "Easy",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-21T06:16:35.181Z",
      "updatedAt": "2025-12-22T11:04:07.047Z",
      "createdBy": {
        "id": "79e9266a-e957-4815-8680-2e5f6f8abf13",
        "name": "Manivanan",
        "workEmail": "manivanan@zithmi.com"
      },
      "assignee": {
        "id": "32df7388-9c84-484c-b796-364ffb1aa30c",
        "name": "Dinesh Kumar",
        "workEmail": "dineshdk@zithmi.com"
      },
      "project": {
        "id": "8107f5d4-0700-43ae-90c5-21f58a31a028",
        "name": "ZithSpace",
        "code": null
      }
    },
    {
      "id": "6e480126-2fec-44e0-a56c-185cfa5c1c22",
      "ticketNumber": "TKT-0069",
      "title": "Main side bar open / close issue",
      "status": "completed",
      "priority": "P1",
      "type": "Bug",
      "platform": "Development",
      "taskLevel": "Easy",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-19T06:18:46.505Z",
      "updatedAt": "2025-12-21T14:09:53.950Z",
      "createdBy": {
        "id": "79e9266a-e957-4815-8680-2e5f6f8abf13",
        "name": "Manivanan",
        "workEmail": "manivanan@zithmi.com"
      },
      "assignee": {
        "id": "79e9266a-e957-4815-8680-2e5f6f8abf13",
        "name": "Manivanan",
        "workEmail": "manivanan@zithmi.com"
      },
      "project": {
        "id": "8107f5d4-0700-43ae-90c5-21f58a31a028",
        "name": "ZithSpace",
        "code": null
      }
    }, {
      "id": "25cad693-c63a-47fc-a702-53761f3abc4f",
      "ticketNumber": "TKT-0078",
      "title": "Document Verification for Driver App Backend",
      "status": "NOT_STARTED",
      "priority": "P1",
      "type": "TASK",
      "platform": "Development",
      "taskLevel": "Medium",
      "storyPoint": 1,
      "dueDate": null,
      "createdAt": "2025-12-22T14:33:01.464Z",
      "updatedAt": "2025-12-23T05:42:45.839Z",
      "createdBy": {
        "id": "69c902cb-0ad6-4234-8e47-552e93e568d6",
        "name": "Saroja",
        "workEmail": "saroja@zithmi.com"
      },
      "assignee": {
        "id": "58577de2-eb53-4327-a130-8733d0c1192f",
        "name": "Karthikeyan",
        "workEmail": "karthikeyan@zithmi.com"
      },
      "project": {
        "id": "3d849fd6-88d2-41d9-b8d0-d6f7f7ab3066",
        "name": "VDrive",
        "code": null
      }
    },
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 70,
    "pages": 7,
    "hasNext": true,
    "hasPrev": false
  }
}
const dashboardDatas = {
  todayLeaves: {
    onLeave: [
      {
        id: "l1",
        user: { name: "Arun Kumar" },
        type: "CASUAL_LEAVE",
        duration: 2,
        durationType: "DAYS",
        approvedBy: false
      },
      {
        id: "l2",
        user: { name: "Priya Sharma" },
        type: "SICK_LEAVE",
        duration: 1,
        durationType: "DAYS",
        approvedBy: true
      },
      {
        id: "l3",
        user: { name: "Rahul Das" },
        type: "EARNED_LEAVE",
        duration: 3,
        durationType: "DAYS",
         approvedBy: true
      },
      {
        id: "l4",
        user: { name: "Sneha Iyer kamnuruthin" },
        type: "CASUAL_LEAVE",
        duration: 1,
        durationType: "DAYS",
        approvedBy: true
      },
      {
        id: "l5",
        user: { name: "Vikram Singh" },
        type: "SICK_LEAVE",
        duration: 2,
        durationType: "DAYS",
         approvedBy: true
      },
      {
        id: "l5",
        user: { name: "Vikram Singh" },
        type: "SICK_LEAVE",
        duration: 2,
        durationType: "DAYS",
        approvedBy: true
      },
      {
        id: "l5",
        user: { name: "Vikram Singh" },
        type: "SICK_LEAVE",
        duration: 2,
        durationType: "DAYS",
        approvedBy: true
      },
      {
        id: "l5",
        user: { name: "Vikram Singh" },
        type: "SICK_LEAVE",
        duration: 2,
        durationType: "DAYS",
        approvedBy: true
      },
    ],

    workingFromHome: [
      {
        id: "w1",
        user: { name: "Karthik M", position: "Frontend Developer", },
        approvedBy: true
      },
      {
        id: "w2",
        user: { name: "Anjali R", position: "QA Engineer", },
        approvedBy: false
      },
      {
        id: "w3",
        user: { name: "Suresh P", position: "Backend Developer", },
        approvedBy: true
      },
      {
        id: "w4",
        user: { name: "Meena K", position: "UI Designer", },
        approvedBy: false
      },
      {
        id: "w5",
        user: { name: "Ajith R", position: "DevOps Engineer", },
        approvedBy: true
      },
    ],

    onPermission: [
      {
        id: "p1",
        user: { name: "Divya S" },
        duration: "2 hrs",
        approvedBy: true
      },
      {
        id: "p2",
        user: { name: "Naveen K" },
        duration: "1 hr",
        approvedBy: false
      },
      {
        id: "p3",
        user: { name: "Pooja R" },
        duration: "3 hrs",
        approvedBy: false
      },
      {
        id: "p4",
        user: { name: "Sathish M" },
        duration: "1.5 hrs",
        approvedBy: false
      },
      {
        id: "p5",
        user: { name: "Lavanya T" },
        duration: "2 hrs",
        approvedBy: false
      },
    ],
  },
};
const meetingsData: Meeting[] = [
  { id: "m1", meetingName: "Stand-Up-call", projectName: "Over-All-Project", membersCount: 10, time: "11:00 AM - 11:30 AM", status: 'UPCOMING' },
  { id: "m2", meetingName: "Vdrive-Project-Call", projectName: "Vdrive-Project", membersCount: 3, time: "11:30 AM - 12:00 PM", status: 'UPCOMING' },
  { id: "m3", meetingName: "Zithspace-Project-Call", projectName: "Zithspace-Project", membersCount: 3, time: "12:30 PM - 01:00 PM", status: 'UPCOMING' },
  { id: "m4", meetingName: "Rap-up-call", projectName: "Over-All-Project", membersCount: 3, time: "12:30 PM - 01:00 PM", status: 'UPCOMING' },
  { id: "m5", meetingName: "Rap-up-call", projectName: "Over-All-Project", membersCount: 3, time: "12:30 AM - 01:00 AM", status: 'UPCOMING' },
  { id: "m6", meetingName: "Rap-up-call", projectName: "Over-All-Project", membersCount: 3, time: "07:30 PM - 10:00 PM", status: 'UPCOMING' },
  { id: "m7", meetingName: "Rap-up-call", projectName: "Over-All-Project", membersCount: 3, time: "07:00 PM - 08:00 PM", status: 'UPCOMING' },
  { id: "m8", meetingName: "Rap-up-call", projectName: "Over-All-Project", membersCount: 3, time: "12:20 AM - 01:20 AM", status: 'UPCOMING' }
];


export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  // Tickets Focus & Upcoming
  const [userestickets, setUserTickets] = useState(tickets.data)
  // Dashboard data
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [presentEmployees, setPresentEmployees] = useState<PresentEmployee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  // Clock In/Out data
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [myAttendanceRecords, setMyAttendanceRecords] = useState<Attendance[]>([]);
  const [workHoursSummary, setWorkHoursSummary] = useState<any>(null);
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  //calende view 
  const [mettings, setMettings] = useState<Meeting[]>(meetingsData)
  // Clock In/Out data fetch data
  useEffect(() => {
    fetchTodayStatus();
    fetchDashboardSummary();
    fetchPresentEmployees();
  }, []);

  // fetch in the tickeds data
  useEffect(() => {
    if (tickets.data) {
      setUserTickets(tickets.data);
    }
  }, [tickets.data]);

  useEffect(() => {
    if (
      dashboardData?.projectProgress &&
      dashboardData.projectProgress.length > 0 &&
      !selectedProjectId
    ) {
      setSelectedProjectId(dashboardData.projectProgress[0].id);
    }
  }, [dashboardData]);

  // Fetch today's status
  const fetchTodayStatus = async () => {
    try {
      const status = await AttendanceService.getTodayAttendance();
      console.log({ status })
      setTodayStatus(status as any);
    } catch (error) {
      console.error('Failed to fetch today status:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load today\'s status. Please try again.');
      }
      // Set to null so we can show error state instead of loading
      setTodayStatus(null);
    }
  };
  // Fetch dashboard summary
  const fetchDashboardSummary = async () => {
    try {
      const summary = await AttendanceService.getDashboardSummary();
      setDashboardSummary(summary as any);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      }
    }
  };

  // Fetch present employees
  const fetchPresentEmployees = async () => {
    try {
      const employees = await AttendanceService.getPresentMembers();
      setPresentEmployees(employees as any);
    } catch (error) {
      console.error('Failed to fetch present employees:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      }
    }
  };

  // Format time duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: '#52c41a',
      late: '#faad14',
      absent: '#ff4d4f', // Keep for dashboard summary display
    };
    return colors[status] || '#8c8c8c';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getDashboardSummary();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading dashboard..." />
      </MainLayout>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ff4d4f";
      case "medium":
        return "#faad14";
      case "low":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "#52c41a";
    if (progress >= 40) return "#1677ff";
    return "#faad14";
  };

  // const formatTimeAgo = (dateString: string) => {
  //   const date = new Date(dateString);
  //   const now = new Date();
  //   const diffMs = now.getTime() - date.getTime();
  //   const diffMins = Math.floor(diffMs / 60000);
  //   const diffHours = Math.floor(diffMins / 60);
  //   const diffDays = Math.floor(diffHours / 24);

  //   if (diffMins < 60)
  //     return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  //   if (diffHours < 24)
  //     return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  //   return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  // };

  // const formatDueDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const tomorrow = new Date(today);
  //   tomorrow.setDate(tomorrow.getDate() + 1);

  //   if (date.toDateString() === today.toDateString()) {
  //     return `Today, ${date.toLocaleTimeString("en-US", {
  //       hour: "numeric",
  //       minute: "2-digit",
  //     })}`;
  //   }
  //   if (date.toDateString() === tomorrow.toDateString()) {
  //     return `Tomorrow, ${date.toLocaleTimeString("en-US", {
  //       hour: "numeric",
  //       minute: "2-digit",
  //     })}`;
  //   }
  //   return date.toLocaleDateString("en-US", {
  //     weekday: "long",
  //     month: "short",
  //     day: "numeric",
  //     hour: "numeric",
  //     minute: "2-digit",
  //   });
  // };

  const selectedProject = dashboardData?.projectProgress.find(
    (p) => p.id === selectedProjectId
  );

  // Statistics cards configuration
  const stats = dashboardData
    ? [
      {
        title: "Total Members",
        value: dashboardData.stats.totalMembers,
        icon: <TeamOutlined style={{ color: "#1677ff" }} />,
        color: "#1677ff",
        change: dashboardData.trends.memberGrowth,
      },
      {
        title: "Active Projects",
        value: dashboardData.stats.activeProjects,
        icon: <ProjectOutlined style={{ color: "#52c41a" }} />,
        color: "#52c41a",
        change: dashboardData.trends.projectGrowth,
      },
      {
        title: "Assigned Tickets / Closed Tickets",
        value: dashboardData.stats.tickets.display,
        icon: <UserOutlined style={{ color: "#faad14" }} />,
        color: "#faad14",
        change: dashboardData.trends.ticketCompletionRate,
      },
      {
        title: "Today's Attendance",
        value: `${dashboardData.stats.attendance.present} / ${dashboardData.stats.totalMembers}`,
        icon: <ClockCircleOutlined style={{ color: "#722ed1" }} />,
        color: "#722ed1",
        change: `${dashboardData.stats.attendance.attendanceRate}% Present`,
        isAttendance: true,
        stats: dashboardData.stats.attendance,
      },
    ]
    : [];

  // pie Chart Helper
  const renderPieChart = (project: typeof selectedProject) => {
    if (!project) return null;
    const {
      notStartedTickets,
      inProgressTickets,
      completedTickets,
      totalTickets,
    } = project;

    if (totalTickets === 0)
      return (
        <div
          style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text type="secondary">No tickets in this project</Text>
        </div>
      );

    // Calculate angles
    const notStartedDeg = (notStartedTickets / totalTickets) * 360;
    const inProgressDeg = (inProgressTickets / totalTickets) * 360;
    const completedDeg = (completedTickets / totalTickets) * 360;

    // We can use a conic-gradient for a simple, lightweight pie chart
    // Colors: Not Started (Gray #d9d9d9), In Progress (Blue #1677ff), Completed (Green #52c41a)
    const gradient = `conic-gradient(
      #d9d9d9 0deg ${notStartedDeg}deg,
      #1677ff ${notStartedDeg}deg ${notStartedDeg + inProgressDeg}deg,
      #52c41a ${notStartedDeg + inProgressDeg}deg 360deg
    )`;
    return (

      <Space >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {/* Pie Chart */}
         <div
  style={{
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: gradient,
    position: "relative",   
    flexShrink: 0,
    bottom:20
  }}
>

            {/* Inner circle for Donut effect (optional, or just full pie) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                top: '50%',
                left: '50%',
                transform: "translate(-50%, -50%)",
                width: "55%",
                height: "55%",
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: "bold" }}>
                {project.progress}%
              </div>
              <div style={{ fontSize: 9, color: "#888", fontWeight: "bold" }}>Complete</div>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
              marginBottom: 40,
              paddingTop: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#d9d9d9",
                  borderRadius: "50%",
                  // margin: "0 auto 4px",

                }}
              />
              <div style={{ fontSize: 1, fontWeight: 600, marginBottom: 2 }}>
                {notStartedTickets}
              </div>

              <div style={{ fontSize: 12, color: "#888", marginTop: 2, bottom: 20 }}>Not Started</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#1677ff",
                  borderRadius: "50%",
                }}
              />
              <div style={{ fontSize: 1, fontWeight: 600, marginBottom: 4 }}>
                {inProgressTickets}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>In Progress</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#52c41a",
                  borderRadius: "50%",
                }}
              />
              <div style={{ fontSize: 1, fontWeight: 600, marginBottom: 4 }}>
                {completedTickets}
              </div>
              <div style={{ fontSize: 12, color: "#888", }}>Completed</div>
            </div>
          </div>
        </div>
      </Space>
    );
  };
  // Handle clock In
  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setError('');

      await AttendanceService.clockIn();
      setSuccess('Clocked in successfully!');
      fetchTodayStatus();
      fetchDashboardSummary();
      fetchPresentEmployees();
    } catch (error) {
      console.error('Clock in error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to clock in');
      }
    } finally {
      setActionLoading(false);
    }
  };
  // Handle clock out
  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setError('');

      await AttendanceService.clockOut();
      setSuccess('Clocked out successfully!');
      fetchTodayStatus();
      fetchDashboardSummary();
      fetchPresentEmployees();
    } catch (error) {
      console.error('Clock out error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to clock out');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // today ticket show
  const isToday = (dateString?: string) => {
    if (!dateString) return false;

    const date = new Date(dateString);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const todayLaunchTickets = userestickets.filter(ticket =>
    isToday(ticket.createdAt)
  );

  // 2. ADD these helper functions (replace your existing ones)
  const parseTime = (timeStr: string) => {
    const cleanTime = timeStr.replace(/\./g, ':').trim();
    const [timePart, meridian] = cleanTime.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr || '0');

    if (meridian === 'PM' && hour !== 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;

    return { hour, minute };
  };

  const getMeetingLiveStatus = (meeting: Meeting): MeetingStatus => {
    if (meeting.status === 'CANCELLED') return 'CANCELLED';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [startTimeStr, endTimeStr] = meeting.time.split(' - ');
    const startTime = parseTime(startTimeStr);
    const endTime = parseTime(endTimeStr);

    const startDate = new Date(today);
    startDate.setHours(startTime.hour, startTime.minute, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(endTime.hour, endTime.minute, 0, 0);

    if (now >= endDate) return 'COMPLETED';
    if (now >= startDate && now < endDate) return 'RUNNING';
    return 'UPCOMING';
  };

  const getMeetingColor = (status: string): string => {
    switch (status) {
      case 'RUNNING': return 'orange';
      case 'UPCOMING': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  // 3. REPLACE your meetingsWithLiveStatus line
  const meetingsWithLiveStatus = mettings.map(meeting => ({
    ...meeting,
    liveStatus: getMeetingLiveStatus(meeting)
  }));

  return (
    <MainLayout>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 12, overflow: 'auto' }}>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Error Loading Dashboard"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Loading State */}
        {loading ? (
          <>
            {/* Stats Cards Row - 4 cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {[1, 2, 3, 4].map(i => (
                <Col xs={24} sm={12} lg={6} key={i}>
                  <Card size="small">
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Main Content Row */}
            <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0 }}>
              {/* Left Column - Project Status + Calendar */}
              <Col xs={24} md={8} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Card size="small" style={{ height: 205 }}>
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
                <Card size="small" style={{ height: 430, flex: 1 }}>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
              </Col>

              {/* Center Column - Tickets */}
              <Col xs={24} md={8} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Card size="small" style={{ height: 430, flex: 1 }}>
                  <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
              </Col>

              {/* Right Column - Clock In + Leaves */}
              <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Card size="small" style={{ height: 205 }}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
                <Card size="small" style={{ height: 430, flex: 1 }}>
                  <Skeleton active paragraph={{ rows: 7 }} />
                </Card>
              </Col>
            </Row>
          </>
        ) : dashboardData ? (
          <>
            {/* Statistics Cards */}
            <Row gutter={[16, 16]}  >
              {stats.map((stat, index) => (
                <Col xs={24} sm={12} lg={6} key={index} style={{ display: "flex" }}>
                  <Card
                    size="small"
                    style={{
                      borderLeft: `4px solid ${stat.color}`,
                      width: "100%",
                    }}
                    styles={{ body: { padding: 12 } }}


                  >
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: "100%" }}
                    >
                      <Space
                        align="center"
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, fontWeight: 500, margin: 0 }}
                        >
                          {stat.title}
                        </Text>
                        {stat.icon}
                      </Space>
                      <Space align="baseline">
                        <Statistic
                          value={stat.value}
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: "#262626",
                            lineHeight: 1,
                          }}
                        />
                        <Tag
                          color={stat.isAttendance ? "purple" : "green"}
                          style={{
                            fontSize: 10,
                            padding: "0 4px",
                            margin: 0,
                            border: "none",
                          }}
                        >
                          {stat.change}
                        </Tag>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Cards main row */}
            <Row gutter={[16, 16]} style={{ marginTop: 10, flex: 1, minHeight: 0, }} align="top">

              {/* Project stautus  */}
              <Col xs={24} md={8} style={{ display: "flex", flexDirection: "column", gap: 10, }}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <TrophyOutlined style={{ color: "#ff7716ff" }} />
                      <span> Project Status</span>
                    </Space>
                  }
                  extra={
                    <Button
                      type="link"
                      size="small"
                      onClick={() => router.push("/projects")}

                    >
                      View Projects
                    </Button>
                  }
                  style={{

                    borderLeft: "4px solid #838383e6",
                    boxShadow: "0 6px 16px rgba(247, 15, 15, 0.08)",
                    height: 205
                  }}
                  styles={{
                    body: {
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    },
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      //marginBottom: 9,
                    }}
                  >
                    <select
                      style={{
                        // padding: " 3px",
                        fontSize: 13,
                        borderRadius: 4,
                        border: "1px solid #d9d9d9",
                        marginLeft: 310
                      }}
                      value={selectedProjectId || ""}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      {dashboardData.projectProgress.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chart */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                    }}
                  >
                    {selectedProject ? (
                      renderPieChart(selectedProject)
                    ) : (
                      <Text type="secondary">No active projects</Text>
                    )}
                  </div>
                </Card>
                {/* callender view */}
                <Card
                  size="small"
                  title={
                    <Space>
                      <CalendarOutlined style={{ color: "#1677ff" }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        Calendar View
                      </span>
                    </Space>

                  }
                  style={{
                    width: "100%",
                    height: 430,
                    borderLeft: "4px solid #838383e6",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    background: "#f0f2f5",

                  }}
                  styles={{
                    body: {
                      padding: 15,
                      height: "calc(500px - 100px)",
                      overflowY: "auto",

                    },
                  }}
                >
                  {meetingsWithLiveStatus.length > 0 ? (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {meetingsWithLiveStatus.map((meeting) => (
                        <div
                          key={meeting.id}
                          style={{
                            padding: 10,
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                            backgroundColor: "#ffffffff",

                          }}
                        >
                          <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            {/* Meeting title */}
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 4,

                            }}>
                              <Text strong style={{ fontSize: 13 }}>
                                {meeting.meetingName}
                              </Text>

                              {/* Project */}
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Project: {meeting.projectName}
                              </Text>
                            </div>
                            {/* Meta row */}
                            <Space size={16} wrap>
                              <Space size={6}>
                                <UsersRound size={16} />
                                <Text style={{ fontSize: 12 }}>
                                  {meeting.membersCount} Members
                                </Text>
                              </Space>
                              <Space size={6}>
                                <Clock11 size={16} />
                                <Text style={{ fontSize: 12 }}>
                                  {meeting.time}
                                </Text>
                              </Space>
                              <Space size={6}>
                                <Tag color={getMeetingColor(meeting.liveStatus)}>{meeting.liveStatus}</Tag>

                              </Space>
                            </Space>
                          </Space>
                        </div>
                      ))}
                    </Space>
                  ) : (
                    <div style={{ textAlign: "center", padding: 40 }}>
                      <Text type="secondary">No meetings scheduled</Text>
                    </div>
                  )}
                </Card>

              </Col>

              {/*Leave Managment*/}
              <Col xs={24} md={8} style={{ display: "flex", flexDirection: "column", gap: 10, }}>

                <Card
                  size="small"
                  title={
                    <Space>
                      <LogOut size={16} />
                      <span style={{ color: "#020202ff", fontWeight: 600 }}>Leave Management</span>
                    </Space>
                  }

                  style={{
                    width: "100%",
                    minHeight: 100,
                    borderLeft: "4px solid #838383e6",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  }}
                  styles={{
                    body: {
                      padding: "12px 16px",
                      overflowY: "auto",
                      fontSize: 13,
                      fontWeight: 600,
                    },
                  }}
                >
                  {dashboardData.leaves ? (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {/* Pending Approvals */}
                      {dashboardData.leaves.pendingApprovals > 0 && (
                        <Button
                          block
                          icon={<FileTextOutlined />}
                          onClick={() => router.push("/leaves")}
                          style={{
                            borderColor: "#faad14",
                            color: "#faad14",
                          }}
                        >
                          <Space
                            style={{
                              width: "100%",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Pending Approvals</span>
                            <Badge
                              count={dashboardData.leaves.pendingApprovals}
                              style={{ backgroundColor: "#faad14" }}
                            />
                          </Space>
                        </Button>
                      )}

                      {/* My Leaves Summary */}
                      <Card
                        size="small"
                        style={{
                          backgroundColor: "#f0f5ff",
                          border: "1px solid #adc6ff",
                        }}
                      >
                        <Text strong style={{ fontSize: 12 }}>
                          My Leaves This Month
                        </Text>

                        <Row gutter={8} style={{ marginTop: 8 }}>
                          <Col span={8}>
                            <Statistic
                              title={<Text style={{ fontSize: 10 }}>Approved</Text>}
                              value={dashboardData.leaves.myLeaves.approved}
                              valueStyle={{ fontSize: 16, color: "#52c41a" }}
                            />
                          </Col>

                          <Col span={8}>
                            <Statistic
                              title={<Text style={{ fontSize: 10 }}>Pending</Text>}
                              value={dashboardData.leaves.myLeaves.pending}
                              valueStyle={{ fontSize: 16, color: "#faad14" }}
                            />
                          </Col>

                          <Col span={8}>
                            <Statistic
                              title={<Text style={{ fontSize: 10 }}>Days</Text>}
                              value={dashboardData.leaves.myLeaves.totalDays}
                              valueStyle={{ fontSize: 16, color: "#1677ff" }}
                            />
                          </Col>
                        </Row>
                      </Card>

                      {/* Apply Leave Button */}
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => router.push("/leaves")}
                      >
                        Apply for Leave
                      </Button>
                    </Space>
                  ) : (
                    <Text type="secondary">No leave data available</Text>
                  )}
                </Card>
                {/* task and asign in new  */}

                <Card
                  size="small"
                  title={
                    <Space>
                      <TicketCheck size={16} color="#1677ff" />
                      <span>Tickets Focus & Upcoming</span>
                    </Space>
                  }
                  style={{
                    width: "100%",
                    height: 430,
                    borderLeft: "4px solid #838383e6",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    background: "#f0f2f5",

                  }}
                >
                  {/* SCROLL AREA */}
                  <div
                    style={{
                      padding: 5,
                      background: "#f0f2f5",
                      height: "calc(500px - 100px)",
                      overflowY: "auto",
                    }}
                  >
                    {todayLaunchTickets.length ? (
                      todayLaunchTickets.map((ticket) => (

                        <Card
                          key={ticket.id}
                          size="small"
                          style={{
                            backgroundColor: "#ffffffff",
                            border: "1px solid #cdcdcdff",
                            marginBottom: 10

                          }}
                        >
                          {/* Ticket meta */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 4,

                            }}
                          >
                            <Tooltip title='View Tickets' placement="top" color={'green'}>
                              <Button style={{ fontSize: 10, }} onClick={() => router.push(`/tickets/${ticket.id}`)}>
                                {ticket.ticketNumber}
                              </Button>
                            </Tooltip>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                            </Text>
                          </div>

                          {/* Title */}
                          <Text
                            strong
                            style={{
                              fontSize: 12,
                              display: "block",
                              marginBottom: 12,
                            }}
                          >
                            {ticket.title}
                          </Text>

                          {/* Footer */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
                                {ticket.assignee?.name
                                  ? ticket.assignee.name.charAt(0).toUpperCase()
                                  : "U"}
                              </Avatar>
                              <Text strong style={{ fontSize: 11 }}>
                                {ticket.assignee?.name || "Unassigned"}
                              </Text>
                            </Space>

                            <Text
                              style={{
                                fontSize: 10,
                                color: ticket.dueDate ? "#ff4d4f" : "#999",
                              }}
                            >
                              {ticket.dueDate ? `Due: ${ticket.dueDate}` : "No Due Date"}
                            </Text>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: 40 }}>
                        <Text type="secondary">No tickets launched today</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
              {/* Right Column - Sidebar (Quick Actions & Tasks) */}
              <Col xs={24} lg={8} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* colck in clock out */}
                <Card
                  size="small"
                  style={{
                    borderLeft: "4px solid #838383e6",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    height: 205,
                  }}
                  styles={{
                    body: {
                      padding: "10px 12px",
                    },
                  }}
                  title={
                    <Space>
                      <ClockCircleOutlined style={{ color: "#1677ff" }} />
                      <span>Today's Status</span>
                    </Space>
                  }
                >
                  {todayStatus ? (
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      {/* Shift Info */}
                      {todayStatus.shift && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Current Shift
                          </Text>
                          <br />
                          <Text strong style={{ fontSize: 14 }}>
                            {todayStatus.shift.name} (
                            {todayStatus.shift.startTime} - {todayStatus.shift.endTime})
                          </Text>
                          {todayStatus.shift.isFlexible && (
                            <Tag color="blue" style={{ marginLeft: 6 }}>
                              Flexible
                            </Tag>
                          )}
                        </div>
                      )}

                      {/* Clock In / Out */}
                      <div>
                        {!todayStatus.isClockIn ? (
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={handleClockIn}
                            loading={actionLoading}
                            block
                            style={{ height: 44 }}
                          >
                            Clock In
                          </Button>
                        ) : !todayStatus.clockOutTime ? (
                          <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={handleClockOut}
                            loading={actionLoading}
                            block
                            style={{ height: 44 }}
                          >
                            Clock Out
                          </Button>
                        ) : (
                          <Button disabled block style={{ height: 44 }}>
                            Day Complete
                          </Button>
                        )}
                      </div>

                      {/* Stats */}
                      <div
                        style={{
                          //display: "flex",
                          justifyContent: "center",
                          marginLeft: 50,
                          gap: 20,

                        }}
                      >
                        <Row gutter={16} justify="center">
                          <Col span={12} style={{ textAlign: "center" }}>
                            <Statistic
                              title={<Text style={{ fontSize: 12 }}>Status</Text>}
                              value={
                                todayStatus.status
                                  ? todayStatus.status.toUpperCase().replace("-", " ")
                                  : "-"
                              }
                              valueStyle={{
                                fontSize: 12,
                                color: getStatusColor(todayStatus.status),
                              }}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic
                              title={<Text style={{ fontSize: 12 }}>Work Hours</Text>}
                              value={formatDuration(todayStatus.totalWorkMinutes)}
                              valueStyle={{ fontSize: 12 }}
                            />
                          </Col>
                        </Row>
                      </div>

                      {/* Clock times */}
                      <div
                        style={{
                          //display: "flex",
                          justifyContent: "center",
                          marginLeft: 50,
                          gap: 20,

                        }}
                      >
                        {todayStatus.clockInTime && (
                          <Row gutter={16}>
                            <Col span={12} style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Clock In
                              </Text>
                              <br />
                              <Text strong style={{ fontSize: 12 }}>
                                {dayjs(todayStatus.clockInTime).format("HH:mm")}
                              </Text>
                            </Col>
                            <Col span={12} >
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                Clock Out
                              </Text>
                              <br />
                              <Text strong style={{ fontSize: 13 }}>
                                {todayStatus.clockOutTime
                                  ? dayjs(todayStatus.clockOutTime).format("HH:mm")
                                  : "-"}
                              </Text>
                            </Col>
                          </Row>
                        )}
                      </div>
                    </Space>

                  ) : (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <Text type="secondary">No records found</Text>
                    </div>
                  )}

                </Card>


                {/* People on Leave & Permission Today */}
                {dashboardDatas.todayLeaves && (
                  <Card
                    style={{
                      width: "100%",
                      borderLeft: "4px solid #838383e6",
                      boxShadow: "0 6px 16px rgba(245, 5, 5, 0.08)",
                      height: 430,
                    }}

                    title={
                      <Space>
                        <CalendarOutlined style={{ color: "#faad14", }} />
                        <span>On Leave & WFH /  Permission</span>
                      </Space>
                    }
                    size="small"
                    extra={
                      <Button
                        type="link"
                        size="small"
                        onClick={() => router.push("/leaves")}
                      >
                        View All
                      </Button>
                    }

                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {/* Row 1: Counts Header */}
                      <Row gutter={16} align="middle">
                        <Col xs={24} sm={12}>
                          <Text strong style={{ fontSize: 12, color: "#1677ff" }}>
                            🏖️ On Leave (
                            {String(dashboardDatas.todayLeaves.onLeave.length).padStart(2, "0")}
                            )
                          </Text>

                        </Col>
                        <Col xs={24} sm={12}>
                          <Text
                            strong
                            style={{
                              fontSize: 14,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ color: "#52c41a", fontSize: 12 }}>
                              🏠 WFH ({String(dashboardDatas.todayLeaves.workingFromHome.length).padStart(2, "0")})
                            </span>
                            <span style={{ margin: "0 6px", color: "#999" }}>/</span>
                            <span style={{ color: "#e7bd14ff", fontSize: 12 }}>
                              Permission ({String(dashboardDatas.todayLeaves.onPermission.length).padStart(2, "0")})
                            </span>
                          </Text>
                        </Col>

                      </Row>


                      {/* Row 2: Lists */}
                      <Row gutter={12}>


                        {/* FIXED VERTICAL LINE - Won't break line */}
                        <Col span={12} style={{ borderRight: '2px solid #f3f2f2ff', height: 320, }}>
                          {/* Left Column: On Leave & Permission */}
                          <Space direction="vertical" size={8} style={{ width: "100%" }}>
                            {/* On Leave List */}
                            {/* SCROLL AREA */}
                            <div
                              style={{
                                //padding:10,
                                background: "#ffffffff",
                                maxHeight: 260,
                                //overflowY: "auto",
                                // paddingRight: ,
                              }}
                            >
                              <div
                                style={{
                                  maxHeight: 330,
                                  overflowY: "auto",
                                  paddingRight: 12,
                                }}
                              >
                                {dashboardDatas.todayLeaves.onLeave.length > 0 &&
                                  dashboardDatas.todayLeaves.onLeave.map((leave) => (
                                    <Tooltip
                                      key={leave.id}
                                      title={leave.approvedBy ? "Approved" : "Not Approved"}
                                      placement="top"     // 👈 show on top
                                      color={leave.approvedBy ? "green" : "red"}
                                    >
                                      <div
                                        style={{
                                          width: "100%",
                                          padding: 10,
                                          background: "#f0f5ff",
                                          borderRadius: 10,
                                          marginBottom: 16,

                                          // border logic
                                          borderLeft: leave.approvedBy
                                            ? "none"
                                            : "4px solid #ff4d4f",

                                          boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <Space align="start" style={{ gap: 10 }}>
                                          <Avatar
                                            size="small"
                                            style={{ backgroundColor: "#1677ff" }}
                                          >
                                            {leave.user.name[0]}
                                          </Avatar>

                                          <div style={{ display: "flex", flexDirection: "column" }}>
                                            <Text strong style={{ fontSize: 11 }}>
                                              {leave.user.name}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: "#666" }}>
                                              {leave.type.replace(/_/g, " ")} • {leave.duration}{" "}
                                              {leave.durationType === "HOURS"
                                                ? leave.duration === 1
                                                  ? "hr"
                                                  : "hrs"
                                                : leave.duration === 1
                                                  ? "day"
                                                  : "days"}
                                            </Text>
                                          </div>
                                        </Space>
                                      </div>
                                    </Tooltip>
                                  ))}


                              </div>


                            </div>
                          </Space>
                        </Col>

                        {/* Right Column: Working From Home */}
                        <Col xs={24} lg={12}>
                          <div
                            style={{
                              padding: 5,
                              background: "#ffffffff",
                              maxHeight: 190,
                              overflowY: "auto",
                              paddingRight: 8,
                            }}
                          >
                            <div style={{ maxHeight: 220, paddingRight: 2, }}>
                              {dashboardDatas.todayLeaves.workingFromHome.length > 0 &&
                                dashboardDatas.todayLeaves.workingFromHome.map((wfh) => (
                                  <Tooltip
                                    key={wfh.id}
                                    title={wfh.approvedBy ? "Approved" : "Not Approved"}
                                    placement="top"
                                    color={wfh.approvedBy ? "green" : "red"}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        padding: "10px",
                                        background: "#e3f5d2ff",
                                        borderRadius: 10,
                                        marginBottom: 16,
                                        cursor: "pointer",

                                        borderLeft: wfh.approvedBy
                                          ? "none"                     
                                          : "4px solid #ff4d4f",       

                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        position: "relative",
                                      }}
                                    >
                                      <Space align="start" style={{ gap: 10 }}>
                                        {/* Avatar + Status Icon */}
                                        <div style={{ position: "relative" }}>
                                          <Avatar
                                            size="small"
                                            style={{
                                              backgroundColor: "#52c41a",
                                              flexShrink: 0,
                                            }}
                                          >
                                            {wfh.user.name[0]}
                                          </Avatar>

                                      
                                        </div>

                                        {/* Text block */}
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                          <Text strong style={{ fontSize: 11, lineHeight: "14px" }}>
                                            {wfh.user.name}
                                          </Text>
                                          <Text style={{ fontSize: 10, color: "#666", lineHeight: "12px" }}>
                                            {wfh.user.position}
                                          </Text>
                                        </div>
                                      </Space>
                                    </div>
                                  </Tooltip>
                                ))}
                            </div>
                          </div>

                          {/* <Divider style={{ margin: "40px 0" }} />  */}

                          {/* On Permission List */}
                          <div
                            style={{
                              padding: 5,
                              background: "#ffffffff",
                              maxHeight: 150,
                              overflowY: "auto",
                              paddingRight: 8,
                            }}
                          >
                            <div style={{ maxHeight: 250, paddingRight: 2, height: 300 }}>
                              {dashboardDatas.todayLeaves.onPermission.length > 0 ? (
                                dashboardDatas.todayLeaves.onPermission.map((leave) => (
                                  <Tooltip
                                    key={leave.id}
                                    title={leave.approvedBy ? "Approved" : "Not Approved"}
                                    placement="top"
                                    color={leave.approvedBy ? "green" : "red"}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        padding: "10px",
                                        background: "#f9f0ff",
                                        borderRadius: 10,
                                        marginBottom: 16,
                                        cursor: "pointer",
                                        borderLeft: leave.approvedBy
                                          ? "none"
                                          : "4px solid #ff4d4f",

                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        position: "relative",
                                      }}
                                    >
                                      <Space align="start" style={{ gap: 10 }}>
                                        {/* Avatar + Status Icon */}
                                        <div style={{ position: "relative" }}>
                                          <Avatar
                                            size="small"
                                            style={{ backgroundColor: "#722ed1", flexShrink: 0 }}
                                          >
                                            {leave.user.name[0]}
                                          </Avatar>
                                        </div>

                                        {/* Text block */}
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                          <Text strong style={{ fontSize: 11, lineHeight: "14px" }}>
                                            {leave.user.name}
                                          </Text>
                                          <Text style={{ fontSize: 10, color: "#666", lineHeight: "14px" }}>
                                            {leave.duration}
                                          </Text>
                                        </div>
                                      </Space>
                                    </div>
                                  </Tooltip>
                                ))
                              ) : (
                                <Text
                                  type="secondary"
                                  style={{ textAlign: "center", display: "block", padding: "20px 0" }}
                                >
                                  No permissions today
                                </Text>
                              )}

                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                )}


              </Col>

            </Row>

          </>
        ) : null}
      </div>

    </MainLayout>
  );
}


