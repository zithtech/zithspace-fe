import { api } from "@/lib/axios";

export interface DashboardStats {
  totalMembers: number;
  activeProjects: number;
  tickets: {
    assigned: number;
    closed: number;
    total: number;
    completionRate: number;
    display: string;
  };
  monthlyRevenue: number;
  attendance: {
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
    presentList: { name: string; position: string; id: string }[];
    absentList: { name: string; position: string; id: string }[];
  };
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  ticketNumber?: string;
  time: string;
  avatar: string;
}

export interface UpcomingTask {
  id: string;
  title: string;
  time: string;
  priority: "high" | "medium" | "low";
  type: string;
  status: string;
}

export interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  status: string;
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  notStartedTickets: number;
}

export interface LeaveStats {
  pendingApprovals: number;
  myLeaves: {
    approved: number;
    pending: number;
    totalDays: number;
  };
}

export interface TodayLeaveItem {
  id: string;
  user: {
    id: string;
    name: string;
    position: string;
  };
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationType: string;
}

export interface TodayLeaves {
  onLeave: TodayLeaveItem[];
  onPermission: TodayLeaveItem[];
  workingFromHome: TodayLeaveItem[];
}

export interface TeamPerformance {
  dailyUpdates: {
    submitted: number;
    total: number;
  };
  avgHoursWorked: number;
  topPerformer: {
    user: {
      id: string;
      name: string;
      position: string;
    } | null;
    completedTickets: number;
  } | null;
  lateArrivals: number;
  overtimeWorkers: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  upcomingTasks: UpcomingTask[];
  projectProgress: ProjectProgress[];
  leaves: LeaveStats;
  todayLeaves: TodayLeaves;
  teamPerformance: TeamPerformance;
  trends: {
    memberGrowth: string;
    projectGrowth: string;
    ticketCompletionRate: string;
  };
  period: {
    month: string;
    startDate: string;
    endDate: string;
  };
}

export const dashboardService = {
  /**
   * Get comprehensive dashboard summary
   * All metrics in a single optimized API call
   */
  getDashboardSummary: async (): Promise<DashboardData> => {
    const data = await api.get<DashboardData>("api/dashboard/summary");
    return data;
  },
};

export default dashboardService;
