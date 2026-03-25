// // hooks/usePerformance.ts
// import { useQuery } from "@tanstack/react-query";
// import TicketService from "@/services/ticketService";
// import dayjs from "dayjs";

// interface PerformanceFilters {
//   userId?: string;
//   month?: string;
//   year?: string;
// }

// export const usePerformance = (filters: PerformanceFilters) => {
//   const { userId, month, year } = filters;

//   const queryKey = ["performance", userId, month, year];

//   const queryFn = async () => {
//     if (!userId || !month || !year) return null;

//     // Calculate start and end date for the selected month
//     const startDate = dayjs()
//       .year(parseInt(year))
//       .month(parseInt(month) - 1)
//       .startOf("month")
//       .format("YYYY-MM-DD");

//     const endDate = dayjs()
//       .year(parseInt(year))
//       .month(parseInt(month) - 1)
//       .endOf("month")
//       .format("YYYY-MM-DD");

//     // Fetch tickets for the user in date range
//     const ticketsResponse = await TicketService.getTickets({
//       assigneeId: userId,
//       startDate,
//       endDate,
//       limit: 1000 // Get all tickets for the month
//     });

//     const tickets = ticketsResponse.data || [];

//     // Calculate ticket statistics
//     const completed = tickets.filter((t: any) => 
//       ["completed", "dev_complete", "done"].includes(t.status?.toLowerCase())
//     ).length;

//     const inProgress = tickets.filter((t: any) => 
//       ["in progress", "in_progress", "in testing", "in_testing", "in review"].includes(t.status?.toLowerCase())
//     ).length;

//     const pending = tickets.filter((t: any) => 
//       ["pending", "open", "to do", "not_started", "todo", "backlog"].includes(t.status?.toLowerCase())
//     ).length;

//     const total = tickets.length;

//     return {
//       tickets: {
//         summary: {
//           total,
//           completed,
//           inProgress,
//           pending,
//         },
//         details: tickets.slice(0, 10).map((t: any) => ({
//           key: t.id,
//           ticketId: t.ticketNumber || `TKT-${t.id.slice(0,4)}`,
//           title: t.title,
//           status: t.status,
//           priority: t.priority,
//           created: dayjs(t.createdAt).format("YYYY-MM-DD"),
//           closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
//         })),
//         distribution: [
//           { name: "Completed", value: completed, color: "#52c41a" },
//           { name: "In Progress", value: inProgress, color: "#faad14" },
//           { name: "Pending", value: pending, color: "#f5222d" },
//         ],
//       },
//       // Add attendance, leaves etc later
//     };
//   };

//   return useQuery({
//     queryKey,
//     queryFn,
//     enabled: !!userId && !!month && !!year,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };tickets


// hooks/usePerformance.ts
// hooks/usePerformance.ts
// import { useQuery } from "@tanstack/react-query";
// import TicketService from "@/services/ticketService";
// import DailyUpdateService from "@/services/dailyUpdateService";
// import dayjs from "dayjs";

// interface PerformanceFilters {
//   userId?: string;
//   month?: string;
//   year?: string;
// }

// export const usePerformance = (filters: PerformanceFilters) => {
//   const { userId, month, year } = filters;

//   const queryKey = ["performance", userId, month, year];

//   const queryFn = async () => {
//     if (!userId || !month || !year) return null;

//     // ✅ FIX: Correct date calculation
//     const selectedYear = parseInt(year);
//     const selectedMonth = parseInt(month) - 1; // 0-indexed for JS (0 = Jan)

//     // Start date = first day of month
//     const startDate = dayjs()
//       .year(selectedYear)
//       .month(selectedMonth)
//       .startOf("month")
//       .format("YYYY-MM-DD");

//     // End date = last day of month  
//     const endDate = dayjs()
//       .year(selectedYear)
//       .month(selectedMonth)
//       .endOf("month")
//       .format("YYYY-MM-DD");

//     console.log("Fetching data for:", { startDate, endDate }); // Debug log

//     // Fetch tickets and daily updates
//     const [ticketsRes, updatesRes] = await Promise.all([
//       TicketService.getTickets({
//         assigneeId: userId,
//         startDate,
//         endDate,
//         limit: 1000
//       }),

//       DailyUpdateService.getTeamUpdates({
//         userId: userId,
//         startDate,
//         endDate,
//         limit: 1000
//       }).catch(err => {
//         console.error("Error fetching updates:", err);
//         return [];
//       })
//     ]);

//     // Process Tickets
//     const tickets = ticketsRes?.data || [];

//     const completed = tickets.filter((t: any) => 
//       ["completed", "dev_complete", "done"].includes(t.status?.toLowerCase())
//     ).length;

//     const inProgress = tickets.filter((t: any) => 
//       ["in progress", "in_progress", "in testing", "in_testing", "in review"].includes(t.status?.toLowerCase())
//     ).length;

//     const pending = tickets.filter((t: any) => 
//       ["pending", "open", "to do", "not_started", "todo", "backlog"].includes(t.status?.toLowerCase())
//     ).length;

//     const total = tickets.length;

//     // 📅 Process Daily Updates
//     const updates = updatesRes || [];

//     console.log("Raw updates from API:", updates); // Debug log

//     // Count BOD and EOD
//     const bodDays = new Set();
//     const eodDays = new Set();
//     const updatesList = [];

//     updates.forEach((update: any) => {
//       const updateDate = dayjs(update.date).format("YYYY-MM-DD");

//       // Log each update date to debug
//       console.log("Update date:", updateDate);

//       // Check BOD
//       const hasBOD = update.projectUpdates?.length > 0 || update.updateType === 'BOD';
//       if (hasBOD) {
//         bodDays.add(updateDate);
//       }

//       // Check EOD
//       const hasEOD = update.totalHoursWorked || update.updateType === 'EOD';
//       if (hasEOD) {
//         eodDays.add(updateDate);
//       }

//       updatesList.push({
//         key: update.id || updateDate,
//         date: updateDate,
//         bod: hasBOD,
//         eod: hasEOD,
//         type: hasEOD ? 'EOD' : (hasBOD ? 'BOD' : 'Update'),
//       });
//     });

//     // Sort updates by date
//     updatesList.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

//     return {
//       tickets: {
//         summary: {
//           total,
//           completed,
//           inProgress,
//           pending,
//         },
//         details: tickets.slice(0, 10).map((t: any) => ({
//           key: t.id,
//           ticketId: t.ticketNumber || `TKT-${t.id.slice(0,4)}`,
//           title: t.title,
//           status: t.status,
//           priority: t.priority,
//           created: dayjs(t.createdAt).format("YYYY-MM-DD"),
//           closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
//         })),
//         distribution: [
//           { name: "Completed", value: completed, color: "#52c41a" },
//           { name: "In Progress", value: inProgress, color: "#faad14" },
//           { name: "Pending", value: pending, color: "#f5222d" },
//         ],
//       },
//       dailyUpdates: {
//         summary: {
//           bod: bodDays.size,
//           eod: eodDays.size,
//           total: updatesList.length,
//         },
//         logs: updatesList,
//       },
//     };
//   };

//   return useQuery({
//     queryKey,
//     queryFn,
//     enabled: !!userId && !!month && !!year,
//     staleTime: 5 * 60 * 1000,
//   });
// };ticketa plus updates








// // // hooks/usePerformance.ts
// import { useQuery } from "@tanstack/react-query";
// import TicketService from "@/services/ticketService";
// import DailyUpdateService from "@/services/dailyUpdateService";
// import dayjs from "dayjs";

// interface PerformanceFilters {
//   userId?: string;
//   month?: string;
//   year?: string;
// }

// // export const usePerformance = (filters: PerformanceFilters) => {
// //   const { userId, month, year } = filters;

// //   const queryKey = ["performance", userId, month, year];

// //   const queryFn = async () => {
// //     if (!userId || !month || !year) return null;

// //     const selectedYear = parseInt(year);
// //     const selectedMonth = parseInt(month) - 1;

// //     const startDate = dayjs()
// //       .year(selectedYear)
// //       .month(selectedMonth)
// //       .startOf("month")
// //       .format("YYYY-MM-DD");

// //     const endDate = dayjs()
// //       .year(selectedYear)
// //       .month(selectedMonth)
// //       .endOf("month")
// //       .format("YYYY-MM-DD");

// //     console.log("Fetching data for:", { startDate, endDate });

// //     const [ticketsRes, updatesRes] = await Promise.all([
// //       TicketService.getTickets({
// //         assigneeId: userId,
// //         startDate,
// //         endDate,
// //         limit: 1000
// //       }),

// //       DailyUpdateService.getTeamUpdates({
// //         userId: userId,
// //         startDate,
// //         endDate,
// //         limit: 1000
// //       }).catch(err => {
// //         console.error("Error fetching updates:", err);
// //         return [];
// //       })
// //     ]);

// //     // Process Tickets
// //     const tickets = ticketsRes?.data || [];

// //     const completed = tickets.filter((t: any) => 
// //       ["completed", "dev_complete", "done"].includes(t.status?.toLowerCase())
// //     ).length;

// //     const inProgress = tickets.filter((t: any) => 
// //       ["in progress", "in_progress", "in testing", "in_testing", "in review"].includes(t.status?.toLowerCase())
// //     ).length;

// //     const pending = tickets.filter((t: any) => 
// //       ["pending", "open", "to do", "not_started", "todo", "backlog"].includes(t.status?.toLowerCase())
// //     ).length;

// //     const total = tickets.length;

// //     // 📅 Process Daily Updates
// //     const updates = updatesRes || [];

// //     console.log("Raw updates from API:", updates);

// //     const bodDays = new Set();
// //     const eodDays = new Set();
// //     const updatesList = [];

// //     updates.forEach((update: any) => {
// //       // ✅ Fix: Convert date properly
// //       const updateDate = dayjs(update.date).format("YYYY-MM-DD");

// //       console.log("Processing update date:", updateDate);

// //       // Check BOD
// //       const hasBOD = update.projectUpdates?.length > 0 || update.updateType === 'BOD';
// //       if (hasBOD) {
// //         bodDays.add(updateDate);
// //       }

// //       // Check EOD
// //       const hasEOD = update.totalHoursWorked || update.updateType === 'EOD';
// //       if (hasEOD) {
// //         eodDays.add(updateDate);
// //       }

// //       updatesList.push({
// //         key: update.id || updateDate,
// //         date: updateDate,
// //         bod: hasBOD,
// //         eod: hasEOD,
// //         type: hasEOD ? 'EOD' : (hasBOD ? 'BOD' : 'Update'),
// //       });
// //     });

// //     // ✅ Sort by date - LATEST FIRST (Feb 16, Feb 13, Feb 12...)
// //     updatesList.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

// //     console.log("Final updates list:", updatesList);

// //     return {
// //       tickets: {
// //         summary: {
// //           total,
// //           completed,
// //           inProgress,
// //           pending,
// //         },
// //         details: tickets.slice(0, 10).map((t: any) => ({
// //           key: t.id,
// //           ticketId: t.ticketNumber || `TKT-${t.id.slice(0,4)}`,
// //           title: t.title,
// //           status: t.status,
// //           priority: t.priority,
// //           created: dayjs(t.createdAt).format("YYYY-MM-DD"),
// //           closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
// //         })),
// //         distribution: [
// //           { name: "Completed", value: completed, color: "#52c41a" },
// //           { name: "In Progress", value: inProgress, color: "#faad14" },
// //           { name: "Pending", value: pending, color: "#f5222d" },
// //         ],
// //       },
// //       dailyUpdates: {
// //         summary: {
// //           bod: bodDays.size,
// //           eod: eodDays.size,
// //           total: updatesList.length,
// //         },
// //         logs: updatesList,
// //       },
// //     };
// //   };

// //   return useQuery({
// //     queryKey,
// //     queryFn,
// //     enabled: !!userId && !!month && !!year,
// //     staleTime: 5 * 60 * 1000,
// //   });
// // };


// // hooks/usePerformance.ts - Modified version

// // export const usePerformance = (filters: PerformanceFilters) => {
// //   const { userId, month, year } = filters;

// //   const queryKey = ["performance", userId, month, year];

// //   const queryFn = async () => {
// //     if (!userId || !month || !year) return null;

// //     const selectedYear = parseInt(year);
// //     const selectedMonth = parseInt(month) - 1;

// //     const startDate = dayjs()
// //       .year(selectedYear)
// //       .month(selectedMonth)
// //       .startOf("month")
// //       .format("YYYY-MM-DD");

// //     const endDate = dayjs()
// //       .year(selectedYear)
// //       .month(selectedMonth)
// //       .endOf("month")
// //       .format("YYYY-MM-DD");

// //     console.log("Fetching data for:", { startDate, endDate });

// //     const [ticketsRes, updatesRes] = await Promise.all([
// //       TicketService.getTickets({
// //         assigneeId: userId,
// //         // Try with date filters first (if API supports)
// //         // startDate,
// //         // endDate,
// //         limit: 1000
// //       }),

// //       DailyUpdateService.getTeamUpdates({
// //         userId: userId,
// //         startDate,
// //         endDate,
// //         limit: 1000
// //       }).catch(err => {
// //         console.error("Error fetching updates:", err);
// //         return [];
// //       })
// //     ]);

// //     // 🎯 IMPORTANT: Filter tickets by month on frontend
// //     const allTickets = ticketsRes?.data || [];

// //     // Filter tickets that were CREATED in this month
// //     const ticketsInMonth = allTickets.filter((ticket: any) => {
// //       // Try different date fields that might exist
// //       const ticketDate = ticket.createdAt 
// //         ? dayjs(ticket.createdAt)
// //         : (ticket.created_date 
// //           ? dayjs(ticket.created_date)
// //           : (ticket.date 
// //             ? dayjs(ticket.date)
// //             : null));

// //       if (!ticketDate || !ticketDate.isValid()) {
// //         console.log("Ticket without valid date:", ticket);
// //         return false;
// //       }

// //       // Check if ticket was created in selected month/year
// //       const isInMonth = ticketDate.month() === selectedMonth && 
// //                         ticketDate.year() === selectedYear;

// //       if (isInMonth) {
// //         console.log(`Ticket ${ticket.ticketNumber || ticket.id} in month:`, ticketDate.format());
// //       }

// //       return isInMonth;
// //     });

// //     console.log(`📊 Before filter: ${allTickets.length} tickets`);
// //     console.log(`📊 After filter: ${ticketsInMonth.length} tickets for ${month}/${year}`);

// //     // Process filtered tickets
// //     const completed = ticketsInMonth.filter((t: any) => 
// //       ["completed", "dev_complete", "done"].includes(t.status?.toLowerCase())
// //     ).length;

// //     const inProgress = ticketsInMonth.filter((t: any) => 
// //       ["in progress", "in_progress", "in testing", "in_testing", "in review"].includes(t.status?.toLowerCase())
// //     ).length;

// //     const pending = ticketsInMonth.filter((t: any) => 
// //       ["pending", "open", "to do", "not_started", "todo", "backlog"].includes(t.status?.toLowerCase())
// //     ).length;

// //     const total = ticketsInMonth.length;

// //     // ... rest of your daily updates code remains same ...

// //     return {
// //       tickets: {
// //         summary: {
// //           total,
// //           completed,
// //           inProgress,
// //           pending,
// //         },
// //         details: ticketsInMonth.slice(0, 10).map((t: any) => ({
// //           key: t.id,
// //           ticketId: t.ticketNumber || `TKT-${t.id?.slice(0,4)}`,
// //           title: t.title,
// //           status: t.status,
// //           priority: t.priority,
// //           created: t.createdAt ? dayjs(t.createdAt).format("YYYY-MM-DD") : "-",
// //           closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
// //         })),
// //         distribution: [
// //           { name: "Completed", value: completed, color: "#52c41a" },
// //           { name: "In Progress", value: inProgress, color: "#faad14" },
// //           { name: "Pending", value: pending, color: "#f5222d" },
// //         ],
// //       },
// //       dailyUpdates: {
// //         summary: {
// //           bod: bodDays.size,
// //           eod: eodDays.size,
// //           total: updatesList.length,
// //         },
// //         logs: updatesList,
// //       },
// //     };
// //   };


// //   return useQuery({
// //     queryKey,
// //     queryFn,
// //     enabled: !!userId && !!month && !!year,
// //     staleTime: 5 * 60 * 1000,
// //   });
// // };





// export const usePerformance = (filters: PerformanceFilters) => {
//   const { userId, month, year } = filters;

//   const queryKey = ["performance", userId, month, year];

//   const queryFn = async () => {
//     if (!userId || !month || !year) return null;

//     const selectedYear = parseInt(year);
//     const selectedMonth = parseInt(month) - 1;

//     const startDate = dayjs()
//       .year(selectedYear)
//       .month(selectedMonth)
//       .startOf("month")
//       .format("YYYY-MM-DD");

//     const endDate = dayjs()
//       .year(selectedYear)
//       .month(selectedMonth)
//       .endOf("month")
//       .format("YYYY-MM-DD");

//     console.log("Fetching data for:", { startDate, endDate });

//     const [ticketsRes, updatesRes] = await Promise.all([
//       TicketService.getTickets({
//         assigneeId: userId,
//         limit: 1000
//       }),

//       DailyUpdateService.getTeamUpdates({
//         userId: userId,
//         startDate,
//         endDate,
//         limit: 1000
//       }).catch(err => {
//         console.error("Error fetching updates:", err);
//         return [];
//       })
//     ]);

//     // Process Tickets - WITH CLIENT-SIDE DATE FILTERING
//     // const allTickets = ticketsRes?.data || [];

//     // // Filter tickets by date range on frontend
//     // const ticketsInMonth = allTickets.filter((ticket: any) => {
//     //   const ticketDate = ticket.createdAt 
//     //     ? dayjs(ticket.createdAt) 
//     //     : (ticket.updatedAt ? dayjs(ticket.updatedAt) : null);

//     //   if (!ticketDate) return false;

//     //   return ticketDate.month() === selectedMonth && 
//     //          ticketDate.year() === selectedYear;
//     // });

//     // console.log(`📊 Before filter: ${allTickets.length} tickets`);
//     // console.log(`📊 After filter: ${ticketsInMonth.length} tickets for ${month}/${year}`);
//     // AFTER getting tickets from API
// const allTickets = ticketsRes?.data || [];
// console.log("🔴🔴🔴 DEBUG START 🔴🔴🔴");
// console.log("1️⃣ Total tickets from API:", allTickets.length);

// // Print ALL tickets with their details
// console.log("2️⃣ ALL TICKETS (with dates):");
// allTickets.forEach((ticket: any, index: number) => {
//   console.log(`   Ticket ${index + 1}:`, {
//     id: ticket.ticketNumber || ticket.id,
//     title: ticket.title,
//     createdAt: ticket.createdAt,
//     createdDate: ticket.createdAt ? dayjs(ticket.createdAt).format("YYYY-MM-DD") : "No date",
//     month: ticket.createdAt ? dayjs(ticket.createdAt).month() + 1 : "N/A",
//     year: ticket.createdAt ? dayjs(ticket.createdAt).year() : "N/A",
//     status: ticket.status
//   });
// });

// console.log("3️⃣ Selected Month/Year:", { 
//   selectedMonth: selectedMonth + 1, // +1 so show actual month
//   selectedYear 
// });

// // Filter tickets
// const ticketsInMonth = allTickets.filter((ticket: any) => {
//   const ticketDate = ticket.createdAt ? dayjs(ticket.createdAt) : null;
//   if (!ticketDate) return false;

//   const ticketMonth = ticketDate.month(); // 0-11
//   const ticketYear = ticketDate.year();

//   const isMatch = ticketMonth === selectedMonth && ticketYear === selectedYear;

//   // Log each ticket's comparison
//   console.log(`   Checking ${ticket.ticketNumber || ticket.id}:`, {
//     ticketMonth: ticketMonth + 1,
//     ticketYear,
//     selectedMonth: selectedMonth + 1,
//     selectedYear,
//     isMatch,
//     date: ticketDate.format("YYYY-MM-DD")
//   });

//   return isMatch;
// });

// console.log("4️⃣ Tickets IN selected month:", ticketsInMonth.length);
// console.log("5️⃣ Tickets NOT in selected month:", allTickets.length - ticketsInMonth.length);
// console.log("🔴🔴🔴 DEBUG END 🔴🔴🔴");

//     const completed = ticketsInMonth.filter((t: any) => 
//       ["completed", "dev_complete", "done"].includes(t.status?.toLowerCase())
//     ).length;

//     const inProgress = ticketsInMonth.filter((t: any) => 
//       ["in progress", "in_progress", "in testing", "in_testing", "in review"].includes(t.status?.toLowerCase())
//     ).length;

//     const pending = ticketsInMonth.filter((t: any) => 
//       ["pending", "open", "to do", "not_started", "todo", "backlog"].includes(t.status?.toLowerCase())
//     ).length;

//     const total = ticketsInMonth.length;

//     // Process Daily Updates
//     const updates = updatesRes || [];

//     const bodDays = new Set();
//     const eodDays = new Set();
//     const updatesList = [];

//     updates.forEach((update: any) => {
//       const updateDate = dayjs(update.date).format("YYYY-MM-DD");

//       const hasBOD = update.projectUpdates?.length > 0 || update.updateType === 'BOD';
//       if (hasBOD) {
//         bodDays.add(updateDate);
//       }

//       const hasEOD = update.totalHoursWorked || update.updateType === 'EOD';
//       if (hasEOD) {
//         eodDays.add(updateDate);
//       }

//       updatesList.push({
//         key: update.id || updateDate,
//         date: updateDate,
//         bod: hasBOD,
//         eod: hasEOD,
//         type: hasEOD ? 'EOD' : (hasBOD ? 'BOD' : 'Update'),
//       });
//     });

//     updatesList.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

//     // ✅ IMPORTANT: Return the data HERE (inside queryFn)
//     return {
//       tickets: {
//         summary: {
//           total,
//           completed,
//           inProgress,
//           pending,
//         },
//         details: ticketsInMonth.slice(0, 10).map((t: any) => ({
//           key: t.id,
//           ticketId: t.ticketNumber || `TKT-${t.id?.slice(0,4)}`,
//           title: t.title,
//           status: t.status,
//           priority: t.priority,
//           created: t.createdAt ? dayjs(t.createdAt).format("YYYY-MM-DD") : "-",
//           closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
//         })),
//         distribution: [
//           { name: "Completed", value: completed, color: "#52c41a" },
//           { name: "In Progress", value: inProgress, color: "#faad14" },
//           { name: "Pending", value: pending, color: "#f5222d" },
//         ],
//       },
//       dailyUpdates: {
//         summary: {
//           bod: bodDays.size,
//           eod: eodDays.size,
//           total: updatesList.length,
//         },
//         logs: updatesList,
//       },
//     };
//   };

//   // ✅ This useQuery call should be OUTSIDE and AFTER the queryFn
//   return useQuery({
//     queryKey,
//     queryFn,
//     enabled: !!userId && !!month && !!year,
//     staleTime: 5 * 60 * 1000,
//   });
// };

// hooks/usePerformance.ts
import { useQuery } from "@tanstack/react-query";
import TicketService from "@/services/ticketService";
import DailyUpdateService from "@/services/dailyUpdateService";
import dayjs from "dayjs";

interface PerformanceFilters {
  userId?: string;
  month?: string;
  year?: string;
}

// Define proper types
interface Ticket {
  id: string;
  ticketNumber?: string;
  title: string;
  status: string;
  priority?: string;
  createdAt?: string;
  closedAt?: string;
  updatedAt?: string;
}

interface DailyUpdate {
  id?: string;
  date: string;
  projectUpdates?: any[];
  updateType?: string;
  totalHoursWorked?: number;
}

interface UpdatesListItem {
  key: string;
  date: string;
  bod: boolean;
  eod: boolean;
  type: string;
}

export const usePerformance = (filters: PerformanceFilters) => {
  const { userId, month, year } = filters;

  const queryKey = ["performance", userId, month, year];

  const queryFn = async () => {
    if (!userId || !month || !year) return null;

    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1;

    const startDate = dayjs()
      .year(selectedYear)
      .month(selectedMonth)
      .startOf("month")
      .format("YYYY-MM-DD");

    const endDate = dayjs()
      .year(selectedYear)
      .month(selectedMonth)
      .endOf("month")
      .format("YYYY-MM-DD");

    console.log("Fetching data for:", { startDate, endDate });

    const [ticketsRes, updatesRes] = await Promise.all([
      TicketService.getTickets({
        assigneeId: userId,
        limit: 1000
      }),

      DailyUpdateService.getTeamUpdates({
        userId: userId,
        startDate,
        endDate,
        limit: 1000
      }).catch(err => {
        console.error("Error fetching updates:", err);
        return [];
      })
    ]);

    // AFTER getting tickets from API
    const allTickets = (ticketsRes?.data || []) as Ticket[];
    console.log("🔴🔴🔴 DEBUG START 🔴🔴🔴");
    console.log("1️⃣ Total tickets from API:", allTickets.length);

    // Print ALL tickets with their details
    console.log("2️⃣ ALL TICKETS (with dates):");
    allTickets.forEach((ticket: Ticket, index: number) => {
      console.log(`   Ticket ${index + 1}:`, {
        id: ticket.ticketNumber || ticket.id,
        title: ticket.title,
        createdAt: ticket.createdAt,
        createdDate: ticket.createdAt ? dayjs(ticket.createdAt).format("YYYY-MM-DD") : "No date",
        month: ticket.createdAt ? dayjs(ticket.createdAt).month() + 1 : "N/A",
        year: ticket.createdAt ? dayjs(ticket.createdAt).year() : "N/A",
        status: ticket.status
      });
    });

    console.log("3️⃣ Selected Month/Year:", {
      selectedMonth: selectedMonth + 1,
      selectedYear
    });

    // Filter tickets
    // const ticketsInMonth = allTickets.filter((ticket: Ticket) => {
    //   const ticketDate = ticket.createdAt ? dayjs(ticket.createdAt) : null;
    //   if (!ticketDate) return false;

    //   const ticketMonth = ticketDate.month();
    //   const ticketYear = ticketDate.year();

    //   const isMatch = ticketMonth === selectedMonth && ticketYear === selectedYear;

    //   console.log(`   Checking ${ticket.ticketNumber || ticket.id}:`, {
    //     ticketMonth: ticketMonth + 1,
    //     ticketYear,
    //     selectedMonth: selectedMonth + 1,
    //     selectedYear,
    //     isMatch,
    //     date: ticketDate.format("YYYY-MM-DD")
    //   });

    //   return isMatch;
    // });

    // console.log("4️⃣ Tickets IN selected month:", ticketsInMonth.length);
    // console.log("5️⃣ Tickets NOT in selected month:", allTickets.length - ticketsInMonth.length);
    // console.log("🔴🔴🔴 DEBUG END 🔴🔴🔴");
    // Filter tickets by date range (more reliable than month/year comparison)
    const ticketsInMonth = allTickets.filter((ticket: Ticket) => {
      // Get the date from various possible fields
      const dateString = ticket.createdAt ||
        (ticket as any).created_date ||
        (ticket as any).date;

      if (!dateString) {
        console.log("❌ Ticket has no date:", ticket.id);
        return false;
      }

      const ticketDate = dayjs(dateString);

      if (!ticketDate.isValid()) {
        console.log("❌ Invalid date for ticket:", ticket.id, dateString);
        return false;
      }

      // Create start and end of selected month
      const monthStart = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
      const monthEnd = dayjs().year(selectedYear).month(selectedMonth).endOf('month');

      // Check if ticket date is within the month
      const isInMonth = ticketDate.isAfter(monthStart) && ticketDate.isBefore(monthEnd);

      console.log(`📊 Ticket ${ticket.ticketNumber || ticket.id}:`, {
        date: ticketDate.format("YYYY-MM-DD"),
        inMonth: isInMonth,
        monthStart: monthStart.format("YYYY-MM-DD"),
        monthEnd: monthEnd.format("YYYY-MM-DD")
      });

      return isInMonth;
    });

    const completed = ticketsInMonth.filter((t: Ticket) =>
      ["completed", "done", "live"].includes(t.status?.toLowerCase())
    ).length;

    const inProgress = ticketsInMonth.filter((t: Ticket) =>
      ["in progress", "in_progress", "in review", "in_review"].includes(t.status?.toLowerCase())
    ).length;

    const pending = ticketsInMonth.filter((t: Ticket) =>
      ["pending", "open", "to do", "not_started", "todo", "backlog", "testing", "in testing", "in_testing", "dev_complete", "dev complete"].includes(t.status?.toLowerCase())
    ).length;

    const total = ticketsInMonth.length;

    // Process Daily Updates
    const updates = (updatesRes || []) as DailyUpdate[];

    let bodCount = 0;
    let eodCount = 0;
    const dailyMap = new Map<string, UpdatesListItem>();

    updates.forEach((update: DailyUpdate) => {
      const updateDate = dayjs(update.date).format("YYYY-MM-DD");

      const isBOD = update.updateType === 'BOD';
      const isEOD = update.updateType === 'EOD';

      if (isBOD) bodCount++;
      if (isEOD) eodCount++;

      if (!dailyMap.has(updateDate)) {
        dailyMap.set(updateDate, {
          key: update.id || updateDate,
          date: updateDate,
          bod: isBOD,
          eod: isEOD,
          type: update.updateType || 'Update',
        });
      } else {
        const existing = dailyMap.get(updateDate)!;
        if (isBOD) existing.bod = true;
        if (isEOD) existing.eod = true;
      }
    });

    const updatesList = Array.from(dailyMap.values());
    updatesList.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

    // Return the data
    return {
      tickets: {
        summary: {
          total,
          completed,
          inProgress,
          pending,
        },
        details: ticketsInMonth.slice(0, 10).map((t: Ticket) => ({
          key: t.id,
          ticketId: t.ticketNumber || `TKT-${t.id?.slice(0, 4)}`,
          title: t.title,
          status: t.status,
          priority: t.priority,
          created: t.createdAt ? dayjs(t.createdAt).format("YYYY-MM-DD") : "-",
          closed: t.closedAt ? dayjs(t.closedAt).format("YYYY-MM-DD") : "-",
        })),
        distribution: [
          { name: "Completed", value: completed, color: "#10b981" },
          { name: "In Progress", value: inProgress, color: "#f59e0b" },
          { name: "Pending", value: pending, color: "#ef4444" },
        ],
      },
      dailyUpdates: {
        summary: {
          bod: bodCount,
          eod: eodCount,
          total: dailyMap.size,
        },
        logs: updatesList,
      },
    };
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId && !!month && !!year,
    staleTime: 5 * 60 * 1000,
  });
};




