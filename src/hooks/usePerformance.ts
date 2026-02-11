import { useQuery } from "@tanstack/react-query";
import PerformanceService from "@/services/performanceService";

interface PerformanceFilters {
  userId?: string;
  month?: string;
  year?: string;
}

/**
 * React Query hook for Performance Dashboard
 * Fetches aggregated data for Tickets, Attendance, Updates, and Leaves
 */
export const usePerformance = (filters: PerformanceFilters) => {
  const { userId, month, year } = filters;

  // Default to current month/year if not provided to ensure data loads
  const currentDate = new Date();
  const queryMonth = month || (currentDate.getMonth() + 1).toString();
  const queryYear = year || currentDate.getFullYear().toString();

  return useQuery({
    queryKey: ["performance", userId, queryMonth, queryYear],
    queryFn: () => PerformanceService.getDashboardData(userId!, queryMonth, queryYear),
    // Only run query if userId is present (month/year have defaults)
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
};