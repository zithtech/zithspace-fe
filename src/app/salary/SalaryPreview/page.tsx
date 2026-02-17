
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Card,
  Divider,
  Select,
  Button,
  Row,
  Col,
  Tooltip,
  message,
  InputNumber,
  Space,
  Table,
  Spin
} from "antd";
import {
  InfoCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { MembersService, Member } from "@/services/membersService";
import { useCompanyGovernmentHolidays } from "@/hooks/useCompanyGovernmentHolidays";
import { leaveService } from "@/services/leaveService";
import * as XLSX from 'xlsx';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface EmployeeSalary {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
}

// Mock salary data for employees
const MOCK_SALARIES: Record<string, EmployeeSalary> = {};

export default function SalaryPreviewPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [employees, setEmployees] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Monthly salary input field
  const [monthlySalaryInput, setMonthlySalaryInput] = useState<number | null>(null);

  const [employeeDetails, setEmployeeDetails] = useState<{
    name: string;
    id: string;
    employeeCode: string;
  } | null>(null);

  const [monthOverview, setMonthOverview] = useState<{
    totalDays: number;
    weekendDays: number;
    holidays: number;
    workingDays: number;
    holidayNames: string[];
  } | null>(null);

  const [leaveSummary, setLeaveSummary] = useState<{
    casualLeave: number;
    sickLeave: number;
    permission: number;
    paidCasual: number;
    paidSick: number;
    apiLop: number;
    paidLeaveTotal: number;
    lopFromCasual: number;
    lopFromSick: number;
    totalLopDays: number;
    workingDaysAfterLeave: number;
    actualWorkedDays: number;
  } | null>(null);

  const [leaveBreakdownData, setLeaveBreakdownData] = useState<any[]>([]);

  const [salaryCalculation, setSalaryCalculation] = useState<{
    monthlySalary: number;
    perDaySalary: number;
    paidLeave: number;
    lopDays: number;
    totalDeduction: number;
    netSalary: number;
  } | null>(null);

  const { holidays, fetchHolidays } = useCompanyGovernmentHolidays();

  useEffect(() => {
    fetchEmployees();
    fetchHolidays();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await MembersService.getMembers({
        page: 1,
        limit: 100,
        isActive: "all",
      });
      setEmployees(response.data);
      
      // Initialize mock data for employees
      response.data.forEach((emp, index) => {
        MOCK_SALARIES[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: `EMP${String(index + 1).padStart(3, '0')}`,
        };
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonths = () => {
    const months = [];
    const year = 2026;
    for (let i = 0; i < 12; i++) {
      const date = new Date(year, i, 1);
      months.push({
        value: `${year}-${String(i + 1).padStart(2, "0")}`,
        label: date.toLocaleString("default", { month: "long" }) + " 2026",
      });
    }
    return months;
  };

  const processLeaveBreakdown = (leaves: any[], year: number, targetMonthIndex: number) => {
    const breakdown: any[] = [];
    
    // First, filter and sort leaves that are in the selected month
    const relevantLeaves = leaves
      .filter(leave => leave.status?.toUpperCase() === "APPROVED")
      .map(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        const type = (leave.type || "").toUpperCase();
        
        // Check if leave overlaps with selected month
        const leaveStartMonth = leaveStart.getMonth();
        const leaveEndMonth = leaveEnd.getMonth();
        const leaveStartYear = leaveStart.getFullYear();
        const leaveEndYear = leaveEnd.getFullYear();
        
        const isInSelectedMonth = 
          (leaveStartYear === year && leaveStartMonth === targetMonthIndex) ||
          (leaveEndYear === year && leaveEndMonth === targetMonthIndex) ||
          (leaveStartYear < year && leaveEndYear > year) ||
          (leaveStartYear === year && leaveStartMonth < targetMonthIndex && leaveEndMonth > targetMonthIndex);
        
        if (!isInSelectedMonth) return null;
        
        // Calculate days in selected month only
        let totalDuration = 0;
        let current = new Date(Math.max(
          leaveStart.getTime(),
          new Date(year, targetMonthIndex, 1).getTime()
        ));
        const monthEnd = new Date(year, targetMonthIndex + 1, 0);
        const end = new Date(Math.min(
          leaveEnd.getTime(),
          monthEnd.getTime()
        ));
        
        while (current <= end) {
          const dayOfWeek = current.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          if (!isWeekend) {
            totalDuration += leave.durationType === "HALF_DAY" ? 0.5 : 1;
          }
          current.setDate(current.getDate() + 1);
        }
        
        return {
          ...leave,
          calculatedDuration: totalDuration,
          sortDate: leaveStart,
        };
      })
      .filter(leave => leave && leave.calculatedDuration > 0)
      .sort((a, b) => a.sortDate - b.sortDate);

    // Process leaves
    let casualPaidUsed = false;
    let sickPaidUsed = false;
    
    relevantLeaves.forEach((leave, index) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const type = (leave.type || "").toUpperCase();
      const durationType = leave.durationType || "FULL_DAY";
      const leaveId = leave.id || index;
      const reason = leave.reason || leave.description || '';
      const totalDuration = leave.calculatedDuration;
      
      // Process based on leave type
      if (type.includes("SICK")) {
        // Split into paid (first sick leave) and LOP (remaining)
        const paidDays = !sickPaidUsed ? Math.min(1, totalDuration) : 0;
        const lopDays = totalDuration - paidDays;
        
        if (paidDays > 0) {
          breakdown.push({
            key: `${leaveId}-${index}-paid`,
            type: 'Sick Leave',
            fromDate: leaveStart,
            toDate: leaveEnd,
            duration: paidDays,
            durationType,
            paymentType: 'Paid',
            reason: reason,
          });
          sickPaidUsed = true;
        }
        
        if (lopDays > 0) {
          breakdown.push({
            key: `${leaveId}-${index}-lop`,
            type: 'Sick Leave',
            fromDate: leaveStart,
            toDate: leaveEnd,
            duration: lopDays,
            durationType,
            paymentType: 'LOP',
            reason: lopDays === totalDuration ? reason : 'Extra sick leave - LOP',
          });
        }
      } 
      else if (type.includes("CASUAL")) {
        // Split into paid (first casual leave) and LOP (remaining)
        const paidDays = !casualPaidUsed ? Math.min(1, totalDuration) : 0;
        const lopDays = totalDuration - paidDays;
        
        if (paidDays > 0) {
          breakdown.push({
            key: `${leaveId}-${index}-paid`,
            type: 'Casual Leave',
            fromDate: leaveStart,
            toDate: leaveEnd,
            duration: paidDays,
            durationType,
            paymentType: 'Paid',
            reason: reason,
          });
          casualPaidUsed = true;
        }
        
        if (lopDays > 0) {
          breakdown.push({
            key: `${leaveId}-${index}-lop`,
            type: 'Casual Leave',
            fromDate: leaveStart,
            toDate: leaveEnd,
            duration: lopDays,
            durationType,
            paymentType: 'LOP',
            reason: lopDays === totalDuration ? reason : 'Extra casual leave - LOP',
          });
        }
      }
      else if (type.includes("PERMISSION")) {
        // Permission leaves are typically paid
        breakdown.push({
          key: `${leaveId}-${index}`,
          type: 'Permission',
          fromDate: leaveStart,
          toDate: leaveEnd,
          duration: totalDuration,
          durationType,
          paymentType: 'Paid',
          reason: reason || 'Permission',
        });
      }
      else if (type.includes("LOP") || type.includes("UNPAID")) {
        // All LOP days
        breakdown.push({
          key: `${leaveId}-${index}`,
          type: 'LOP',
          fromDate: leaveStart,
          toDate: leaveEnd,
          duration: totalDuration,
          durationType,
          paymentType: 'LOP',
          reason: reason || 'Loss of pay',
        });
      }
      // Ignore any other leave types
    });
    
    // Sort by from date
    breakdown.sort((a, b) => a.fromDate - b.fromDate);
    setLeaveBreakdownData(breakdown);
  };

  const handleViewPreview = async () => {
    if (!selectedMonth || !selectedEmployee) {
      message.warning("Please select month and employee");
      return;
    }

    setLoading(true);
    setShowResults(true);
    setLeaveBreakdownData([]);
    
    const [year, monthStr] = selectedMonth.split("-").map(Number);
    const targetMonthIndex = monthStr - 1;

    try {
      // Get employee data
      const selectedEmp = employees.find(emp => emp.id === selectedEmployee);
      const empData = MOCK_SALARIES[selectedEmployee];
      
      setEmployeeDetails({
        name: selectedEmp?.name || '',
        id: selectedEmployee,
        employeeCode: empData?.employeeCode || `EMP${String(employees.findIndex(e => e.id === selectedEmployee) + 1).padStart(3, '0')}`,
      });

      // --- 1. Calendar Calculations ---
      const totalDays = new Date(year, targetMonthIndex + 1, 0).getDate();
      let weekendDays = 0;
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, targetMonthIndex, d);
        if (date.getDay() === 0 || date.getDay() === 6) weekendDays++;
      }

      // --- 2. Holiday Calculations ---
      const holidayDateSet = new Set<string>();
      const holidayNames: string[] = [];
      holidays.forEach((h) => {
        if (h.status !== "ACTIVE") return;
        let curr = new Date(h.fromDate);
        const end = new Date(h.toDate);
        while (curr <= end) {
          if (curr.getUTCFullYear() === year && curr.getUTCMonth() === targetMonthIndex) {
            if (curr.getUTCDay() !== 0 && curr.getUTCDay() !== 6) {
              const dStr = curr.toISOString().split("T")[0];
              if (!holidayDateSet.has(dStr)) {
                holidayDateSet.add(dStr);
                holidayNames.push(`${h.holidayName} (${dStr})`);
              }
            }
          }
          curr.setUTCDate(curr.getUTCDate() + 1);
        }
      });

      const calculatedWorkingDays = totalDays - weekendDays - holidayDateSet.size;

      // --- 3. Leave Summary with LOP logic ---
      const leaveResponse = await leaveService.getAllLeaves({
        userId: selectedEmployee,
      });

      let casual = 0, sick = 0, permission = 0, apiLop = 0;

      if (leaveResponse.data && leaveResponse.data.length > 0) {
        leaveResponse.data.forEach((leave) => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          const isApproved = leave.status?.toUpperCase() === "APPROVED";

          if (isApproved) {
            let current = new Date(leaveStart);
            while (current <= leaveEnd) {
              const isSameMonth = current.getFullYear() === year && current.getMonth() === targetMonthIndex;
              const dayOfWeek = current.getDay(); 
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              if (isSameMonth && !isWeekend) {
                const type = (leave.type || "").toUpperCase();
                const dayValue = leave.durationType === "HALF_DAY" ? 0.5 : 1;

                if (type.includes("SICK")) {
                  sick += dayValue;
                } else if (type.includes("CASUAL")) {
                  casual += dayValue;
                } else if (type.includes("PERMISSION")) {
                  permission += dayValue;
                } else if (type.includes("LOP") || type.includes("UNPAID")) {
                  apiLop += dayValue;
                }
              }
              current.setDate(current.getDate() + 1);
            }
          }
        });
      } 
      
      const paidCasual = casual > 0 ? 1 : 0;
      const paidSick = sick > 0 ? 1 : 0;
      
      const lopFromCasual = casual > 1 ? casual - 1 : 0;
      const lopFromSick = sick > 1 ? sick - 1 : 0;
      
      const totalLopDays = lopFromCasual + lopFromSick + apiLop;
      const paidLeaveTotal = paidCasual + paidSick + permission; // Permission is paid
      
      const workingDaysAfterLeave = calculatedWorkingDays - paidLeaveTotal;
      
      const totalLeavesTaken = casual + sick + permission + apiLop;
      const actualWorkedDays = calculatedWorkingDays - totalLeavesTaken;

      const monthData = {
        totalDays,
        weekendDays,
        holidays: holidayDateSet.size,
        workingDays: calculatedWorkingDays,
        holidayNames,
      };
      
      setMonthOverview(monthData);

      const leaveData = {
        casualLeave: casual,
        sickLeave: sick,
        permission: permission,
        paidCasual,
        paidSick,
        paidLeaveTotal,
        apiLop,
        lopFromCasual,
        lopFromSick,
        totalLopDays,
        workingDaysAfterLeave,
        actualWorkedDays,
      };
      
      setLeaveSummary(leaveData);

      // Process leave breakdown
      processLeaveBreakdown(leaveResponse.data, year, targetMonthIndex);

      // Reset salary input
      setMonthlySalaryInput(null);
      setSalaryCalculation(null);

    } catch (error) {
      console.error("Error generating salary preview:", error);
      message.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate salary whenever monthly salary input changes
  useEffect(() => {
    if (monthlySalaryInput && monthOverview && leaveSummary) {
      const perDaySalary = monthlySalaryInput / monthOverview.workingDays;
      const totalDeduction = leaveSummary.totalLopDays * perDaySalary;
      const netSalary = monthlySalaryInput - totalDeduction;
      
      setSalaryCalculation({
        monthlySalary: monthlySalaryInput,
        perDaySalary,
        paidLeave: leaveSummary.paidLeaveTotal,
        lopDays: leaveSummary.totalLopDays,
        totalDeduction,
        netSalary,
      });
    } else {
      setSalaryCalculation(null);
    }
  }, [monthlySalaryInput, monthOverview, leaveSummary]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Export to Excel function
  const handleExportExcel = () => {
    if (!employeeDetails || !monthOverview || !leaveSummary || !salaryCalculation) {
      message.warning("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    const excelData = [
      ['SALARY PREVIEW REPORT'],
      [],
      ['Employee Details'],
      ['Employee Name', employeeDetails.name],
      ['Employee ID', employeeDetails.employeeCode],
      ['Month', selectedMonth],
      [],
      ['Month Overview'],
      ['Total Days', monthOverview.totalDays],
      ['Weekends', monthOverview.weekendDays],
      ['Holidays', monthOverview.holidays],
      ['Working Days', monthOverview.workingDays],
      [],
      ['Leave Summary'],
      ['Casual Leave', leaveSummary.casualLeave, '(Paid: ' + leaveSummary.paidCasual + ', LOP: ' + leaveSummary.lopFromCasual + ')'],
      ['Sick Leave', leaveSummary.sickLeave, '(Paid: ' + leaveSummary.paidSick + ', LOP: ' + leaveSummary.lopFromSick + ')'],
      ['Permission', leaveSummary.permission],
      ['Paid Leave Total', leaveSummary.paidLeaveTotal],
      ['Working Days (After Paid Leave)', leaveSummary.workingDaysAfterLeave],
      ['Total LOP Days', leaveSummary.totalLopDays],
      [],
      ['Salary Breakdown'],
      ['Description', 'Value'],
      ['Monthly Salary', formatCurrency(salaryCalculation.monthlySalary)],
      ['Working Days', monthOverview.workingDays],
      ['Per Day Salary', formatCurrency(salaryCalculation.perDaySalary)],
      ['Paid Leave', salaryCalculation.paidLeave],
      ['LOP Days', salaryCalculation.lopDays],
      ['Total Deduction', formatCurrency(salaryCalculation.totalDeduction)],
      ['Net Salary', formatCurrency(salaryCalculation.netSalary)],
      [],
      ['Generated on:', new Date().toLocaleString()],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Preview');
    
    const fileName = `Salary_Preview_${employeeDetails.name}_${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    message.success('Excel file downloaded successfully');
  };

  // Columns for Salary Breakdown table
  const breakdownColumns = [
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'VALUE',
      dataIndex: 'value',
      key: 'value',
      align: 'right' as const,
      render: (value: any) => {
        if (value.type === 'currency') {
          return <Text>{formatCurrency(value.amount)}</Text>;
        }
        if (value.type === 'number') {
          return <Text>{value.amount}</Text>;
        }
        return value;
      },
    },
  ];

  const breakdownData = salaryCalculation ? [
    {
      key: '1',
      description: 'Monthly Salary',
      value: { type: 'currency', amount: salaryCalculation.monthlySalary },
    },
    {
      key: '2',
      description: 'Working Days',
      value: { type: 'number', amount: monthOverview?.workingDays },
    },
    {
      key: '3',
      description: (
        <span>
          Per Day Salary <Tooltip title="Monthly Salary ÷ Working Days"><InfoCircleOutlined style={{ fontSize: 12, marginLeft: 4, color: '#999' }} /></Tooltip>
        </span>
      ),
      value: { type: 'currency', amount: salaryCalculation.perDaySalary },
    },
    {
      key: '4',
      description: 'Paid Leave',
      value: { type: 'number', amount: salaryCalculation.paidLeave },
    },
    {
      key: '5',
      description: 'LOP Days',
      value: { type: 'number', amount: salaryCalculation.lopDays },
    },
    {
      key: '6',
      description: (
        <span>
          Total Deduction <Tooltip title="LOP Days × Per Day Salary"><InfoCircleOutlined style={{ fontSize: 12, marginLeft: 4, color: '#999' }} /></Tooltip>
        </span>
      ),
      value: { type: 'currency', amount: salaryCalculation.totalDeduction },
    },
    {
      key: '7',
      description: (
        <span>
          Net Salary <Tooltip title="Monthly Salary - Total Deduction"><InfoCircleOutlined style={{ fontSize: 12, marginLeft: 4, color: '#999' }} /></Tooltip>
        </span>
      ),
      value: { type: 'currency', amount: salaryCalculation.netSalary },
    },
  ] : [];

  return (
    <MainLayout>
      <div style={{ padding: 12 }}>
        <Card className="shadow-sm" style={{ borderColor: '#f0f0f0' }}>
          {/* Header with Export Button */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={3} style={{ marginBottom: 4 }}>Salary Preview</Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Select month and employee to preview salary
              </Paragraph>
            </Col>
            {showResults && salaryCalculation && (
              <Col>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleExportExcel}
                  size="middle"
                >
                  Export to Excel
                </Button>
              </Col>
            )}
          </Row>
          
          <Divider style={{ margin: '16px 0' }} />

          {/* Selection Row */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary">Month</Text>
              </div>
              <Select
                className="w-full"
                placeholder="Select month"
                onChange={setSelectedMonth}
                value={selectedMonth}
                size="middle"
              >
                {generateMonths().map((m) => (
                  <Option key={m.value} value={m.value}>{m.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary">Employee</Text>
              </div>
              <Select
                className="w-full"
                placeholder="Select employee"
                onChange={setSelectedEmployee}
                value={selectedEmployee}
                showSearch
                optionFilterProp="children"
                size="middle"
              >
                {employees.map((e) => (
                  <Option key={e.id} value={e.id}>{e.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary">&nbsp;</Text>
              </div>
              <Button
                type="primary"
                onClick={handleViewPreview}
                block
                disabled={!selectedMonth || !selectedEmployee}
                loading={loading}
                size="middle"
              >
                View Salary
              </Button>
            </Col>
          </Row>

         {loading && (
  <div style={{ textAlign: 'center', padding: '40px 0' }}>
    <Spin size="large" />
  </div>
)}

          {/* Results Section */}
          {!loading && showResults && employeeDetails && monthOverview && leaveSummary && (
            <>
              {/* Month Overview */}
              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>Month Overview</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                      <div style={{ fontSize: 20, fontWeight: 500 }}>{monthOverview.totalDays}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Total Days</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                      <div style={{ fontSize: 20, fontWeight: 500 }}>{monthOverview.weekendDays}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Weekends</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ fontSize: 20, fontWeight: 500 }}>{monthOverview.holidays}</span>
                        {monthOverview.holidayNames.length > 0 && (
                          <Tooltip title={monthOverview.holidayNames.join(', ')}>
                            <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                          </Tooltip>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Holidays</Text>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: '#f0f0f0' }}>
                      <div style={{ fontSize: 20, fontWeight: 500 }}>{monthOverview.workingDays}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Working Days</Text>
                    </Card>
                  </Col>
                </Row>
              </div>



              {/* Leave Summary */}
<div style={{ marginBottom: 16 }}>
  <Title level={5} style={{ marginBottom: 12 }}>Leave Summary</Title>
  
  <Row gutter={[16, 16]}>
    {/* Left side - Leave types */}
    <Col xs={24} md={12}>
      <Card size="small" style={{ height: '100%' }}>
        <div style={{ padding: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <Text strong>Casual Leave</Text>
            <Text>{leaveSummary.paidCasual}/1</Text>
          </div>
          <Divider style={{ margin: '0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <Text strong>Sick Leave</Text>
            <Text>{leaveSummary.paidSick}/1</Text>
          </div>
          <Divider style={{ margin: '0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <Text strong>Comp Off</Text>
            <Text>0/1</Text>
          </div>
          <Divider style={{ margin: '0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0 0' }}>
            <Text strong>Loss of Pay (LOP)</Text>
            <Text type="danger">{leaveSummary.totalLopDays}</Text>
          </div>
          {/* No divider after LOP */}
        </div>
      </Card>
    </Col>

    {/* Vertical Divider */}
    <Col xs={24} md={0}>
      <Divider style={{ margin: '8px 0' }} />
    </Col>
    <Col xs={0} md={1}>
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
        <Divider type="vertical" style={{ height: '100%' }} />
      </div>
    </Col>

    {/* Right side - Summary stats */}
    <Col xs={24} md={11}>
      <Card size="small" style={{ height: '100%', background: '#ffffff', border: '1px solid #f0f0f0' }}>
        <div style={{ padding: '0' }}>
          {/* Total Paid Days */}
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#000000' }}>Total Paid Days</Text>
              <Text strong>{leaveSummary.paidLeaveTotal}</Text>
            </div>
          </div>
          
          <Divider style={{ margin: '0' }} />
          
          {/* Days Worked */}
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#000000' }}>Days Worked</Text>
              <Text strong>{leaveSummary.actualWorkedDays}</Text>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Working days - Paid leave - LOP
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>
              {monthOverview.workingDays} - {leaveSummary.paidLeaveTotal} - {leaveSummary.totalLopDays}
            </div>
          </div>
          
          <Divider style={{ margin: '0' }} />
          
          {/* Actual Pay Day */}
          <div style={{ padding: '8px 0 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#000000' }}>Actual Pay Day</Text>
              <Text strong style={{ color: '#52c41a' }}>{leaveSummary.actualWorkedDays + leaveSummary.paidLeaveTotal}</Text>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Days worked + Paid leave
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>
              {leaveSummary.actualWorkedDays} + {leaveSummary.paidLeaveTotal}
            </div>
          </div>
        </div>
      </Card>
    </Col>
  </Row>
</div>

              {/* Leave Breakdown with Dates and Reasons */}
{/* Leave Breakdown with Dates and Reasons */}
{leaveBreakdownData && leaveBreakdownData.length > 0 && (
  <div style={{ marginBottom: 16 }}>
    <Title level={5} style={{ marginBottom: 12 }}>Leave Breakdown</Title>
    <Card size="small">
      <Table
        dataSource={leaveBreakdownData}
        columns={[
          {
            title: 'Leave Type',
            dataIndex: 'type',
            key: 'type',
            width: '15%',
          },
          {
            title: 'From Date',
            dataIndex: 'fromDate',
            key: 'fromDate',
            width: '15%',
            render: (date: Date) => date.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            }),
          },
          {
            title: 'To Date',
            dataIndex: 'toDate',
            key: 'toDate',
            width: '15%',
            render: (date: Date) => date.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            }),
          },
          {
            title: 'Duration (Days)',
            dataIndex: 'duration',
            key: 'duration',
            width: '12%',
            align: 'center' as const,
            render: (duration: number, record: any) => (
              <span>
                {duration} {record.durationType === 'HALF_DAY' ? '(Half Day)' : ''}
              </span>
            ),
          },
          {
            title: 'Paid/LOP',
            dataIndex: 'paymentType',
            key: 'paymentType',
            width: '12%',
            render: (text: string) => {
              let color = text === 'Paid' ? 'green' : 'red';
              return <span style={{ color }}>{text}</span>;
            },
          },
          {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            width: '31%',
            ellipsis: true,
            render: (text: string) => text || '—',
          },
        ]}
        pagination={false}
        size="small"
        bordered
        rowKey={(record) => record.key}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  </div>
)}

              {/* Employee Salary Details */}
              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>Employee Salary Details</Title>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={6}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Employee Name</Text>
                        <div><Text>{employeeDetails.name}</Text></div>
                        <Text type="secondary" style={{ fontSize: 11 }}>ID: {employeeDetails.employeeCode}</Text>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Enter Monthly Salary</Text>
                        <InputNumber
                          style={{ width: '100%', marginTop: 4 }}
                          placeholder="Enter amount"
                          value={monthlySalaryInput}
                          onChange={(value) => setMonthlySalaryInput(value)}
                          formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value?.replace(/₹\s?|(,*)/g, '') as unknown as number}
                          min={0}
                          step={1000}
                          size="middle"
                        />
                      </div>
                    </Col>
                    <Col xs={12} md={5}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Monthly Salary</Text>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>
                          {monthlySalaryInput ? formatCurrency(monthlySalaryInput) : '₹ 0'}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} md={5}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Per Day Salary</Text>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>
                          {monthlySalaryInput ? formatCurrency(monthlySalaryInput / monthOverview.workingDays) : '₹ 0'}
                        </div>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          ({formatCurrency(monthlySalaryInput || 0)} ÷ {monthOverview.workingDays})
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>

              {/* Salary Breakdown Table */}
              {salaryCalculation && (
                <div>
                  <Title level={5} style={{ marginBottom: 12 }}>Salary Breakdown</Title>
                  <Table
                    columns={breakdownColumns}
                    dataSource={breakdownData}
                    pagination={false}
                    bordered
                    size="small"
                    style={{ marginBottom: 8 }}
                  />
                </div>
              )}
            </>
          )}

          
        </Card>
      </div>
    </MainLayout>
  );
}