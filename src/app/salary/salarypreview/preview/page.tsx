"use client";
import React from "react";
import { useState, useEffect, useCallback, Suspense } from "react";
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
  Spin,
  Tag,
  Modal,
  Form,
  Input
} from "antd";
import {
  InfoCircleOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  EditOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  CalendarFilled
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { useEmployeeOnboarding } from "@/hooks/use-onboarding";
import { useCompanyGovernmentHolidays } from "@/hooks/useCompanyGovernmentHolidays";
import { useSalaryAdjustments } from "@/hooks/useSalaryAdjustments";
import { PayrollService, LeaveSummary } from "@/services/payrollService";
import { SalaryAssignmentService, EmployeeSalaryAssignment } from "@/services/salaryAssignmentService";
import * as XLSX from 'xlsx';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const StatCard = ({ title, value, icon, color, bgColor, tooltip }: { title: string, value: any, icon: React.ReactNode, color: string, bgColor: string, tooltip?: string }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: '12px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      border: '1px solid #f0f0f0',
      height: '100%'
    }}
    bodyStyle={{ padding: '16px 20px' }}
  >
    <Row align="middle" justify="space-between" gutter={12}>
      <Col flex="1">
        <div style={{ marginBottom: 2 }}>
          <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{title}</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#262626', letterSpacing: '-0.5px' }}>
            {value}
          </Title>
          {tooltip && (
            <Tooltip title={tooltip}>
              <InfoCircleOutlined style={{ fontSize: '12px', color: '#bfbfbf', cursor: 'pointer' }} />
            </Tooltip>
          )}
        </div>
      </Col>
      <Col>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s'
        }}>
          {React.cloneElement(icon as React.ReactElement, { style: { fontSize: '18px', color: color } })}
        </div>
      </Col>
    </Row>
  </Card>
);

function SalaryPreviewContent() {
  const searchParams = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Hooks
  const { onboardedEmployees, fetchEmployees, loading: employeesLoading } = useEmployeeOnboarding();
  const { holidays, fetchHolidays } = useCompanyGovernmentHolidays();

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

  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);

  const [leaveBreakdownData, setLeaveBreakdownData] = useState<any[]>([]);

  const [salaryCalculation, setSalaryCalculation] = useState<{
    monthlySalary: number;
    perDaySalary: number;
    paidLeave: number;
    lopDays: number;
    otherDeductions: number;
    lopDeduction: number;
    totalDeduction: number;
    netSalary: number;
    totalAdjEarnings: number;
    totalAdjDeductions: number;
  } | null>(null);

  const [activeAssignment, setActiveAssignment] = useState<EmployeeSalaryAssignment | null>(null);
  const {
    adjustments,
    fetchAdjustments,
    saveAdjustment,
    deleteAdjustment,
    isSaving: isSavingAdjustment
  } = useSalaryAdjustments(selectedEmployee, selectedMonth);

  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
    fetchHolidays();
  }, []);

  // Handle Query Parameters
  useEffect(() => {
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");

    if (employeeId) setSelectedEmployee(employeeId);
    if (month) setSelectedMonth(month);
  }, [searchParams]);

  // Trigger preview when employee and month are set via query params or selection
  // (Removing automatic trigger as per user request to only load on click)
  // useEffect(() => {
  //   if (selectedEmployee && selectedMonth && onboardedEmployees.length > 0 && holidays.length > 0 && !showResults && !loading) {
  //     handleViewPreview();
  //   }
  // }, [selectedEmployee, selectedMonth, onboardedEmployees, holidays]);

  const handleAddAdjustment = async (values: any) => {
    const success = await saveAdjustment({ ...values, id: editingAdjustmentId });
    if (success) {
      setAdjustmentModalVisible(false);
      form.resetFields();
      setEditingAdjustmentId(null);
    }
  };

  const handleDeleteAdjustment = async (id: string) => {
    await deleteAdjustment(id);
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
      const selectedEmp = onboardedEmployees.find(emp => emp.id === selectedEmployee);

      // Fetch Active Salary Assignment
      const assignment = await SalaryAssignmentService.getAssignmentByEmployee(selectedEmployee);
      setActiveAssignment(assignment || null);

      if (assignment) {
        const monthlyGross = assignment.salaryType === "YEARLY"
          ? Number(assignment.baseSalary) / 12
          : Number(assignment.baseSalary);
        setMonthlySalaryInput(monthlyGross);
      } else {
        setMonthlySalaryInput(null);
      }

      setEmployeeDetails({
        name: selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : '',
        id: selectedEmployee,
        employeeCode: selectedEmp?.employee_code || 'N/A',
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

      // --- 3. Leave Summary via API ---
      const leaveSummaryResponse = await PayrollService.getLeaveSummary(selectedEmployee, selectedMonth);

      const monthData = {
        totalDays,
        weekendDays,
        holidays: holidayDateSet.size,
        workingDays: calculatedWorkingDays,
        holidayNames,
      };

      setMonthOverview(monthData);
      setLeaveSummary(leaveSummaryResponse);

      // Fetch Adjustments
      await fetchAdjustments();

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
      const lopDeduction = leaveSummary.totalLopDays * perDaySalary;

      // Sum up other deductions (EPF, ESI, etc.)
      let otherDeductions = 0;
      if (activeAssignment && activeAssignment.components) {
        otherDeductions = activeAssignment.components
          .filter(c => c.component.type === "Deduction")
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
      }

      const totalAdjEarnings = adjustments
        .filter((a: any) => a.type === 'Earning')
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
      const totalAdjDeductions = adjustments
        .filter((a: any) => a.type === 'Deduction')
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

      const netSalary = monthlySalaryInput - otherDeductions - lopDeduction + totalAdjEarnings - totalAdjDeductions;

      setSalaryCalculation({
        monthlySalary: monthlySalaryInput,
        perDaySalary,
        paidLeave: leaveSummary.paidLeaveTotal,
        lopDays: leaveSummary.totalLopDays,
        otherDeductions,
        lopDeduction,
        totalDeduction: otherDeductions + lopDeduction + totalAdjDeductions,
        netSalary,
        totalAdjEarnings,
        totalAdjDeductions
      });
    } else {
      setSalaryCalculation(null);
    }
  }, [monthlySalaryInput, monthOverview, leaveSummary, activeAssignment, adjustments]);

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
      ['Casual Leave', leaveSummary.casualLeave],
      ['Sick Leave', leaveSummary.sickLeave],
      ['Permission', leaveSummary.permission],
      ['Paid Leave Total', leaveSummary.paidLeaveTotal],
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
      description: 'Days Worked (Working - Paid Leave)',
      value: { type: 'number', amount: (monthOverview?.workingDays || 0) - (leaveSummary?.paidLeaveTotal || 0) },
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
      description: 'Actual Payable Days (Working - LOP)',
      value: { type: 'number', amount: (monthOverview?.workingDays || 0) - (leaveSummary?.totalLopDays || 0) },
    },
    {
      key: '6',
      description: (
        <span>
          LOP Deduction <Tooltip title="LOP Days × Per Day Salary"><InfoCircleOutlined style={{ fontSize: 12, marginLeft: 4, color: '#999' }} /></Tooltip>
        </span>
      ),
      value: { type: 'currency', amount: salaryCalculation.lopDeduction },
    },
    ...adjustments.map((a: any, idx: number) => ({
      key: `adj-${idx}`,
      description: (
        <span style={{ color: a.type === 'Earning' ? '#52c41a' : '#ff4d4f' }}>
          {a.label} (Adj)
        </span>
      ),
      value: {
        type: 'currency',
        amount: a.type === 'Earning' ? Number(a.amount) : -Number(a.amount)
      },
    })),
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
      <div style={{ padding: '20px' }}>
        {/* <Card className="shadow-sm" style={{ borderColor: '#f0f0f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}> */}
        {/* Header with Export Button */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>Salary Preview</Title>
            {selectedMonth && (
              <Space style={{ marginBottom: 4 }}>
                <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 13 }}>
                  {dayjs(selectedMonth).format('MMMM YYYY').toUpperCase()}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cycle: 01 {dayjs(selectedMonth).format('MMM')} - {dayjs(selectedMonth).endOf('month').format('DD MMM YYYY')}
                </Text>
              </Space>
            )}
          </Col>
          {showResults && salaryCalculation && (
            <Col>
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setAdjustmentModalVisible(true)}
                  size="middle"
                  style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
                >
                  Manage Adjustments
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportExcel}
                  size="middle"
                  type="primary"
                  ghost
                >
                  Export to Excel
                </Button>
              </Space>
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
              optionFilterProp="label"
              size="middle"
              loading={employeesLoading}
            >
              {onboardedEmployees.map((e: any) => (
                <Option key={e.id} value={e.id} label={`${e.firstName} ${e.lastName}`}>
                  {`${e.firstName} ${e.lastName} (${e.employee_code || 'N/A'})`}
                </Option>
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
            <div style={{ marginBottom: 32 }}>
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Total Days"
                    value={monthOverview.totalDays}
                    icon={<CalendarOutlined />}
                    color="#1890ff"
                    bgColor="#e6f7ff"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Weekends"
                    value={monthOverview.weekendDays}
                    icon={<CheckCircleOutlined />}
                    color="#52c41a"
                    bgColor="#f6ffed"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Holidays"
                    value={monthOverview.holidays}
                    icon={<InfoCircleOutlined />}
                    color="#fa8c16"
                    bgColor="#fff7e6"
                    tooltip={monthOverview.holidayNames.length > 0 ? monthOverview.holidayNames.join(', ') : undefined}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Working Days"
                    value={monthOverview.workingDays}
                    icon={<ThunderboltOutlined />}
                    color="#722ed1"
                    bgColor="#f9f0ff"
                  />
                </Col>
              </Row>
            </div>



            {/* Leave Summary */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, fontSize: 13, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Attendance & Leaves</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ height: '100%', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '4px 8px' }}>
                      {[
                        { label: 'Casual Leave', value: leaveSummary.casualLeave },
                        { label: 'Sick Leave', value: leaveSummary.sickLeave },
                        { label: 'Permission', value: leaveSummary.permission },
                        { label: 'Loss of Pay (LOP)', value: leaveSummary.totalLopDays, color: '#ff4d4f' }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                            <Text strong style={{ color: '#595959', fontSize: 13 }}>{item.label}</Text>
                            <Tag color={item.color === '#ff4d4f' ? 'error' : 'blue'} style={{ borderRadius: 6, margin: 0 }}>{item.value}</Tag>
                          </div>
                          {idx < 3 && <Divider style={{ margin: '0', opacity: 0.4 }} />}
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ height: '100%', borderRadius: 12, border: '1px solid #f0f0f0', background: '#fafafa', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '4px 8px' }}>
                      {[
                        { label: 'Total Paid Leaves', value: leaveSummary.paidLeaveTotal, sub: 'Included in payout' },
                        { label: 'Days Worked', value: monthOverview.workingDays - leaveSummary.paidLeaveTotal, sub: 'Working Days - Paid Leaves' },
                        { label: 'Actual Payable Days', value: monthOverview.workingDays - leaveSummary.totalLopDays, sub: 'Working Days - LOP Days', primary: true }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                            <div>
                              <Text strong style={{ color: item.primary ? '#1890ff' : '#595959', fontSize: 13 }}>{item.label}</Text>
                              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{item.sub}</div>
                            </div>
                            <Text strong style={{ fontSize: item.primary ? 22 : 16, color: item.primary ? '#1890ff' : '#262626' }}>{item.value}</Text>
                          </div>
                          {idx < 2 && <Divider style={{ margin: '0', opacity: 0.4 }} />}
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Employee Salary Details */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, fontSize: 14, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Salary Structure Details</Title>
              <Card size="small" style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Row gutter={[16, 16]} align="middle" style={{ padding: '8px 12px' }}>
                  <Col xs={24} md={6}>
                    <div style={{ borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Employee</Text>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{employeeDetails.name}</div>
                      <Tag style={{ marginTop: 4, borderRadius: 10 }}>{employeeDetails.employeeCode}</Tag>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Structure</Text>
                      <div style={{ marginTop: 4 }}>
                        {activeAssignment ? (
                          <Tag color="processing" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20 }}>
                            {activeAssignment.structure?.name || "Standard Structure"}
                          </Tag>
                        ) : (
                          <Tag color="error">No Structure Assigned</Tag>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} md={5}>
                    <div style={{ borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Assigned Gross (Monthly)</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#262626' }}>
                        {activeAssignment ? formatCurrency(activeAssignment.salaryType === "YEARLY" ? Number(activeAssignment.baseSalary) / 12 : Number(activeAssignment.baseSalary)) : '₹ 0'}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>Yearly: {activeAssignment ? formatCurrency(activeAssignment.salaryType === "YEARLY" ? Number(activeAssignment.baseSalary) : Number(activeAssignment.baseSalary) * 12) : '₹ 0'}</div>
                    </div>
                  </Col>
                  <Col xs={12} md={5}>
                    <div>
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Per Day Payout</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                        {monthlySalaryInput && monthOverview?.workingDays ? formatCurrency(monthlySalaryInput / monthOverview.workingDays) : '₹ 0'}
                      </div>
                      <Text style={{ fontSize: 10, color: '#bfbfbf' }}>Based on working days</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>

            {/* Earnings & Deductions Breakdown */}
            {activeAssignment?.components && activeAssignment.components.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0 }}>Earnings</Title>
                      <Button
                        type="link" size="small" icon={<PlusOutlined />}
                        onClick={() => setAdjustmentModalVisible(true)}
                        style={{ padding: 0, height: 'auto', fontSize: 11 }}
                      >
                        Adjust
                      </Button>
                    </div>
                    <Table
                      size="middle"
                      pagination={false}
                      dataSource={[
                        ...activeAssignment.components.filter(c => c.component.type === "Earning"),
                        ...adjustments.filter((a: any) => a.type === 'Earning').map((a: any) => ({
                          id: a.id,
                          amount: a.amount,
                          component: { componentName: `${a.label} (Adj)` },
                          isAdjustment: true
                        }))
                      ]}
                      columns={[
                        {
                          title: 'COMPONENT',
                          dataIndex: ['component', 'componentName'],
                          key: 'name',
                          render: (text, record: any) => <Text style={{ fontSize: 13, color: record.isAdjustment ? '#52c41a' : 'inherit' }} italic={record.isAdjustment}>{text}</Text>
                        },
                        { title: 'AMOUNT', dataIndex: 'amount', key: 'amount', align: 'right', render: (val) => <Text strong style={{ fontSize: 14 }}>{formatCurrency(val)}</Text> },
                      ]}
                      rowKey="id"
                      className="premium-subtable"
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Title level={5} style={{ margin: 0, fontSize: 13, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Deductions</Title>
                      <Button
                        type="link" size="small" icon={<PlusOutlined />}
                        onClick={() => setAdjustmentModalVisible(true)}
                        style={{ padding: 0, height: 'auto', fontSize: 11, color: '#ff4d4f' }}
                      >
                        Adjust
                      </Button>
                    </div>
                    <Table
                      size="middle"
                      pagination={false}
                      dataSource={[
                        ...activeAssignment.components.filter(c => c.component.type === "Deduction"),
                        ...adjustments.filter((a: any) => a.type === 'Deduction').map((a: any) => ({
                          id: a.id,
                          amount: a.amount,
                          component: { componentName: `${a.label} (Adj)` },
                          isAdjustment: true
                        }))
                      ]}
                      columns={[
                        {
                          title: 'COMPONENT',
                          dataIndex: ['component', 'componentName'],
                          key: 'name',
                          render: (text, record: any) => <Text style={{ fontSize: 13, color: record.isAdjustment ? '#ff4d4f' : 'inherit' }} italic={record.isAdjustment}>{text}</Text>
                        },
                        { title: 'AMOUNT', dataIndex: 'amount', key: 'amount', align: 'right', render: (val) => <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>{formatCurrency(val)}</Text> },
                      ]}
                      rowKey="id"
                      className="premium-subtable"
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* Adjustments (Manual) */}
            <div style={{ marginBottom: 32 }}>
              <Row justify="space-between" align="bottom" style={{ marginBottom: 16 }}>
                <Col>
                  <Title level={5} style={{ margin: 0, fontSize: 13, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Performance Adjustments
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11 }}>Extra earnings or performance-based deductions for this period</Text>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size="small"
                    ghost
                    icon={<SettingOutlined />}
                    onClick={() => setAdjustmentModalVisible(true)}
                  >
                    Manage Adjustments
                  </Button>
                </Col>
              </Row>

              <Table
                dataSource={adjustments}
                rowKey="id"
                size="middle"
                pagination={false}
                className="premium-subtable"
                style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                columns={[
                  { title: 'DESCRIPTION', dataIndex: 'label', key: 'label', render: (t) => <Text style={{ fontSize: 13 }}>{t}</Text> },
                  {
                    title: 'TYPE',
                    dataIndex: 'type',
                    key: 'type',
                    render: (t) => <Tag color={t === 'Earning' ? 'green' : 'red'}>{t.toUpperCase()}</Tag>
                  },
                  {
                    title: 'AMOUNT',
                    dataIndex: 'amount',
                    key: 'amount',
                    align: 'right',
                    render: (val, record) => (
                      <Text strong style={{ fontSize: 14, color: record.type === 'Earning' ? '#52c41a' : '#ff4d4f' }}>
                        {record.type === 'Earning' ? '+' : '-'} {formatCurrency(val)}
                      </Text>
                    )
                  },
                ]}
                locale={{ emptyText: <div style={{ padding: '20px 0' }}><Text type="secondary">No adjustments found</Text></div> }}
              />
            </div>

            {/* Salary Breakdown Table (Summary) */}
            {salaryCalculation && (
              <div style={{ marginBottom: 32 }}>
                <Title level={5} style={{ marginBottom: 16, fontSize: 13, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Final Salary Calculation Summary</Title>
                <Table
                  columns={breakdownColumns}
                  dataSource={breakdownData}
                  pagination={false}
                  size="middle"
                  className="summary-table"
                  showHeader={false}
                  style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: 'none', background: '#fafafa' }}
                />
                <div style={{
                  padding: '24px',
                  background: '#ffffff',
                  border: '2px solid #52c41a',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(82, 196, 26, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#52c41a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Net Salary Payable</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#1890ff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                      {formatCurrency(salaryCalculation.netSalary)}
                    </div>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Final take-home amount after all deductions</Text>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: 24, borderLeft: '1px solid #f0f0f0' }}>
                    <Text strong style={{ fontSize: 14, color: '#595959' }}>Yearly Gross Equivalent</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                      {formatCurrency(
                        (salaryCalculation.netSalary - (salaryCalculation.totalAdjEarnings - salaryCalculation.totalAdjDeductions)) * 12 +
                        (salaryCalculation.totalAdjEarnings - salaryCalculation.totalAdjDeductions)
                      )}
                    </div>
                    <Tag color="success" style={{ borderRadius: 10, marginTop: 4 }}>Annualized Projection</Tag>
                  </div>
                </div>
              </div>
            )}
          </>
        )}


        {/* </Card> */}
      </div>

      {/* Adjustments Modal */}
      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#fa8c16' }} />
            <Text strong>Manage Performance Adjustments</Text>
          </Space>
        }
        open={adjustmentModalVisible}
        onCancel={() => {
          setAdjustmentModalVisible(false);
          setEditingAdjustmentId(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        style={{ top: 40 }}
        destroyOnClose
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 20, backgroundColor: '#fffbe6', padding: '12px 16px', borderRadius: 8, border: '1px solid #ffe58f' }}>
            <Text style={{ fontSize: 13, color: '#856404' }}>
              Add extra earnings (bonuses, incentives) or deductions (fine, damages) specifically for this payroll period.
            </Text>
          </div>

          <Form form={form} layout="vertical" onFinish={handleAddAdjustment} initialValues={{ type: 'Earning' }}>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="label" label="Description" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="e.g. Achievement Bonus" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Earning">Earning</Option>
                    <Option value="Deduction">Deduction</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="₹0" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label=" ">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={editingAdjustmentId ? <CheckOutlined /> : <PlusOutlined />}
                    loading={isSavingAdjustment}
                    block
                  >
                    {editingAdjustmentId ? 'Update' : 'Add'}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider orientation="left" style={{ margin: '16px 0' }}>Active Adjustments</Divider>

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <Table
              dataSource={adjustments}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Label', dataIndex: 'label', key: 'label' },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (t) => <Tag color={t === 'Earning' ? 'green' : 'red'}>{t.toUpperCase()}</Tag>
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  align: 'right',
                  render: (a) => <Text strong>₹{Number(a).toLocaleString()}</Text>
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 100,
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingAdjustmentId(record.id);
                          form.setFieldsValue({
                            label: record.label,
                            type: record.type,
                            amount: Number(record.amount)
                          });
                        }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteAdjustment(record.id)}
                      />
                    </Space>
                  )
                }
              ]}
              locale={{ emptyText: 'No adjustments' }}
            />
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}

export default function SalaryPreviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}><Spin size="large" /></div>}>
      <SalaryPreviewContent />
    </Suspense>
  );
}

