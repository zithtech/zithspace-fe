"use client";

import { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Card,
  Divider,
  Select,
  Button,
  Row,
  Col,
  Input,
  Table,
  Spin,
  Tag,
  message,
  Space,
  Modal,
  Form,
  InputNumber
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  EditOutlined,
  CheckOutlined,
  SaveOutlined,
  SendOutlined
} from "@ant-design/icons";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployeeOnboarding } from "@/hooks/use-onboarding";
import { useCompanyGovernmentHolidays } from "@/hooks/useCompanyGovernmentHolidays";
import { useSalaryAdjustments } from "@/hooks/useSalaryAdjustments";
import { PayrollService, LeaveSummary } from "@/services/payrollService";
import { SalaryAssignmentService, EmployeeSalaryAssignment } from "@/services/salaryAssignmentService";
import { SalaryAdjustmentService } from "@/services/salaryAdjustmentService";
import * as XLSX from 'xlsx';
import Link from "next/link";
import { api } from "@/lib/axios";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface SalaryData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  monthlySalary: number;
  workingDays: number;
  lopDays: number;
  casualLeave: number;
  sickLeave: number;
  permission: number;
  actualWorkingDays: number;
  netSalary: number;
  lopDeduction: number;
  totalComponentDeductions: number;
  earnings: any[];
  deductions: any[];
  adjustments: any[];
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid' | 'Sent to Bank';
  payoutId?: string;
  loading?: boolean;
}

export default function BulkSalaryPreviewPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [bulkAdjustmentModalVisible, setBulkAdjustmentModalVisible] = useState(false);
  const [selectedEmployeeForAdjustment, setSelectedEmployeeForAdjustment] = useState<SalaryData | null>(null);
  const [editingRowAdjustmentId, setEditingRowAdjustmentId] = useState<string | null>(null);
  const [isSavingBulkAdjustment, setIsSavingBulkAdjustment] = useState(false);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  // Adjustment Hook for Individual Employee Modal
  const { 
    adjustments: modalAdjustments, 
    fetchAdjustments: fetchModalAdjustments, 
    saveAdjustment: saveRowAdjustment, 
    deleteAdjustment: deleteRowAdjustment,
    isSaving: isSavingRowAdjustment,
    loading: modalLoading
  } = useSalaryAdjustments(selectedEmployeeForAdjustment?.employeeId, selectedMonth);

  const { departments, loading: departmentsLoading } = useDepartments();
  const { onboardedEmployees, fetchEmployees, loading: employeesLoading } = useEmployeeOnboarding();
  const { holidays, fetchHolidays } = useCompanyGovernmentHolidays();

  useEffect(() => {
    fetchEmployees();
    fetchHolidays();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleSaveDraft = async () => {
    if (selectedRowKeys.length === 0) return;
    
    const [year, month] = selectedMonth.split("-").map(Number);
    const selectedData = salaryData.filter(d => selectedRowKeys.includes(d.employeeId));
    
    setLoading(true);
    try {
      const payload = {
        month,
        year,
        selectedEmployeeIds: selectedRowKeys,
        payrollData: selectedData.map(d => ({
          employeeId: d.employeeId,
          grossSalary: d.monthlySalary,
          netSalary: d.netSalary,
          totalDeductions: d.totalComponentDeductions + d.lopDeduction + (d.adjustments?.filter(a => a.type === 'Deduction').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0),
          lopDays: d.lopDays,
          lopDeduction: d.lopDeduction,
          workedDays: d.actualWorkingDays,
          breakdown: { earnings: d.earnings, deductions: d.deductions },
          adjustments: d.adjustments
        }))
      };

      const res = await api.post('/api/salary-approvals/bulk', payload);
      const updatedPayouts = res || [];
      setSalaryData(prev => {
        const newData = prev.map(item => {
          const match = updatedPayouts.find((p: any) => p.employeeId === item.employeeId);
          return match ? { ...item, status: 'Draft' as SalaryData['status'], payoutId: match.id } : item;
        });
        return newData;
      });
      
      message.success(`Draft saved for ${selectedRowKeys.length} salaries`);
      setSelectedRowKeys([]);
    } catch (error) {
      console.error("Save Draft Error:", error);
      message.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (selectedRowKeys.length === 0) return;
    
    setLoading(true);
    try {
      // First, find the Payout IDs for selected employees
      const selectedData = salaryData.filter(d => selectedRowKeys.includes(d.employeeId));
      const payoutIds = selectedData
        .filter(d => d.payoutId)
        .map(d => d.payoutId);

      if (payoutIds.length === 0) {
        message.warning("Please save changes as draft first");
        setLoading(false);
        return;
      }

      await api.post('/api/salary-approvals/submit', { salaryPayoutIds: payoutIds });
      
      setSalaryData(prev => prev.map(item => 
        selectedRowKeys.includes(item.employeeId) ? { ...item, status: 'Pending' as SalaryData['status'] } : item
      ));
      message.success(`Submitted ${selectedRowKeys.length} salaries for approval`);
      setSelectedRowKeys([]);
    } catch (error: any) {
      console.error("Submit Approval Error:", error);
      window.alert("Submit Error: " + (error.message || "Unknown Error"));
      message.error("Failed to submit for approval");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjustment = async (values: any) => {
    if (!selectedEmployeeForAdjustment) return;
    const success = await saveRowAdjustment({ ...values, id: editingRowAdjustmentId });
    if (success) {
      setAdjustmentModalVisible(false);
      form.resetFields();
      setEditingRowAdjustmentId(null);
      fetchSalaryDataForEmployees(); // Refresh bulk list
    }
  };

  const handleDeleteAdjustment = async (id: string) => {
    const success = await deleteRowAdjustment(id);
    if (success) {
      fetchSalaryDataForEmployees();
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

  const filteredEmployees = useMemo(() => {
    return onboardedEmployees.filter(emp => {
      const firstName = emp.firstName || emp.first_name || "";
      const lastName = emp.lastName || emp.last_name || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const employeeCode = (emp.employeeCode || emp.employee_code || "").toLowerCase();
      
      const matchesSearch = fullName.includes(debouncedSearch.toLowerCase()) || 
                           employeeCode.includes(debouncedSearch.toLowerCase());
      
      const matchesDept = selectedDepartment === "all" || 
                         emp.departmentId === selectedDepartment || 
                         emp.workDetail?.some((wd: any) => wd.position?.departmentId === selectedDepartment);
                         
      return matchesSearch && matchesDept;
    });
  }, [onboardedEmployees, debouncedSearch, selectedDepartment]);

  const handleBulkAdjustment = async (values: any) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one employee");
      return;
    }
    
    setIsSavingBulkAdjustment(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      await SalaryAdjustmentService.upsertAdjustment({
        employeeIds: selectedRowKeys,
        month,
        year,
        ...values
      } as any);
      message.success(`Adjustments added to ${selectedRowKeys.length} employees`);
      setBulkAdjustmentModalVisible(false);
      bulkForm.resetFields();
      fetchSalaryDataForEmployees();
    } catch (error) {
      console.error("Bulk Adjustment Error:", error);
      message.error("Failed to add bulk adjustments");
    } finally {
      setIsSavingBulkAdjustment(false);
    }
  };

  const summaryStats = useMemo(() => {
    const totalPayroll = salaryData.reduce((acc, curr) => acc + curr.netSalary, 0);
    const avgSalary = salaryData.length > 0 ? totalPayroll / salaryData.length : 0;
    const totalLop = salaryData.reduce((acc, curr) => acc + curr.lopDays, 0);
    return { totalPayroll, avgSalary, totalLop };
  }, [salaryData]);

  const calculateMonthOverview = (monthStr: string) => {
    const [year, mStr] = monthStr.split("-").map(Number);
    const monthIndex = mStr - 1;
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    let weekendDays = 0;
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, monthIndex, d);
      if (date.getDay() === 0 || date.getDay() === 6) weekendDays++;
    }

    const holidayDateSet = new Set<string>();
    holidays.forEach((h) => {
      if (h.status !== "ACTIVE") return;
      let curr = new Date(h.fromDate);
      const end = new Date(h.toDate);
      while (curr <= end) {
        if (curr.getUTCFullYear() === year && curr.getUTCMonth() === monthIndex) {
          if (curr.getUTCDay() !== 0 && curr.getUTCDay() !== 6) {
            holidayDateSet.add(curr.toISOString().split("T")[0]);
          }
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    });

    return { totalDays, workingDays: totalDays - weekendDays - holidayDateSet.size };
  };

  const fetchSalaryDataForEmployees = async () => {
    if (!selectedMonth || filteredEmployees.length === 0) {
      if (filteredEmployees.length === 0) setSalaryData([]);
      return;
    }

    setLoading(true);
    const { workingDays } = calculateMonthOverview(selectedMonth);
    const [year, month] = selectedMonth.split("-").map(Number);
    let allAdjustments: any[] = [];
    let payouts: any[] = [];

    try {
      // 1. Fetch all adjustments and payouts for this month/year (Safe Fetch)
      try {
        console.log("BulkPreview: Fetching metadata for", { month, year });
        const [adjRes, payoutRes] = await Promise.allSettled([
          SalaryAdjustmentService.getAdjustments({ month, year } as any),
          api.get('/api/salary-approvals', { params: { month, year } })
        ]);
        
        if (adjRes.status === 'fulfilled') allAdjustments = adjRes.value || [];
        if (payoutRes.status === 'fulfilled') {
          payouts = payoutRes.value || [];
        }
        
        console.log(`BulkPreview: Metadata load complete. Adjustments: ${allAdjustments.length}, Payouts: ${payouts.length}`);
      } catch (fetchErr) {
        console.error("Fetch Metadata Error (Safe):", fetchErr);
      }

      const results: SalaryData[] = await Promise.all(
        filteredEmployees.map(async (emp) => {
          try {
            let assignment = null;
            try {
              assignment = await SalaryAssignmentService.getAssignmentByEmployee(emp.id);
            } catch (assignErr) {
              console.error(`Assignment fetch failed for ${emp.id}:`, assignErr);
            }

            const monthlySalary = assignment 
              ? (assignment.salaryType === "YEARLY" ? Number(assignment.baseSalary) / 12 : Number(assignment.baseSalary)) 
              : 0;
            
            // Components
            const earnings = assignment?.components?.filter((c: any) => c.component.type === "Earning") || [];
            const deductions = assignment?.components?.filter((c: any) => c.component.type === "Deduction") || [];
            const totalComponentDeductions = deductions.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

            let leaveSummary: any = { totalLopDays: 0, casualLeave: 0, sickLeave: 0, permission: 0 };
            try {
              leaveSummary = await PayrollService.getLeaveSummary(emp.id, selectedMonth);
            } catch (leaveErr) {
              console.error(`Leave fetch failed for ${emp.id}:`, leaveErr);
            }

            const lopDays = leaveSummary.totalLopDays || 0;
            const casualLeave = leaveSummary.casualLeave || 0;
            const sickLeave = leaveSummary.sickLeave || 0;
            const permission = leaveSummary.permission || 0;

            const perDaySalary = workingDays > 0 ? monthlySalary / workingDays : 0;
            const lopDeduction = lopDays * perDaySalary;
            
            // Adjustments
            const empAdjustments = allAdjustments.filter((a: any) => a.employeeId === emp.id);
            const totalAdjEarnings = empAdjustments
              .filter((a: any) => a.type === 'Earning')
              .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
            const totalAdjDeductions = empAdjustments
              .filter((a: any) => a.type === 'Deduction')
              .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

            const netSalary = monthlySalary - totalComponentDeductions - lopDeduction + totalAdjEarnings - totalAdjDeductions;

            const existingPayout = payouts.find((p: any) => p.employeeId === emp.id);

            return {
              employeeId: emp.id,
              employeeName: `${emp.firstName || emp.first_name || ""} ${emp.lastName || emp.last_name || ""}`.trim() || "Unknown",
              employeeCode: emp.employeeCode || emp.employee_code || "N/A",
              departmentName: emp.departmentName || (emp.workDetail?.[0]?.position?.department?.name) || "N/A",
              monthlySalary,
              workingDays,
              lopDays,
              casualLeave,
              sickLeave,
              permission,
              actualWorkingDays: workingDays - lopDays,
              netSalary,
              lopDeduction,
              totalComponentDeductions,
              earnings,
              deductions,
              adjustments: empAdjustments,
              status: existingPayout 
                ? (existingPayout.status === 'SENT_TO_BANK' ? 'Sent to Bank' : existingPayout.status.charAt(0).toUpperCase() + existingPayout.status.slice(1).toLowerCase() as any) 
                : 'Draft',
              payoutId: existingPayout?.id
            };
          } catch (error) {
            console.error(`Inner conversion failed for ${emp.id}:`, error);
            return {
              employeeId: emp.id,
              employeeName: `${emp.firstName || emp.first_name || ""} ${emp.lastName || emp.last_name || ""}`.trim() || "Unknown",
              employeeCode: emp.employeeCode || emp.employee_code || "N/A",
              departmentName: "Error",
              monthlySalary: 0,
              workingDays,
              lopDays: 0,
              casualLeave: 0,
              sickLeave: 0,
              permission: 0,
              actualWorkingDays: 0,
              netSalary: 0,
              lopDeduction: 0,
              totalComponentDeductions: 0,
              earnings: [],
              deductions: [],
              adjustments: [],
              status: 'Draft' as const
            };
          }
        })
      );
      setSalaryData(results);
    } catch (error) {
      console.error("Fetch Salary Data Master Error:", error);
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Automatic Data Fetching
  useEffect(() => {
    fetchSalaryDataForEmployees();
  }, [filteredEmployees, selectedMonth, holidays]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportExcel = () => {
    if (salaryData.length === 0) return;
    const exportData = salaryData.map(item => ({
      'Employee Name': item.employeeName,
      'Employee ID': item.employeeCode,
      'Department': item.departmentName,
      'Monthly Gross': item.monthlySalary,
      'Working Days': item.workingDays,
      'LOP Days': item.lopDays,
      'Worked Days': item.actualWorkingDays,
      'Net Salary': item.netSalary,
      'Status': item.status
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bulk Salary Preview');
    XLSX.writeFile(wb, `Bulk_Salary_Preview_${selectedMonth}.xlsx`);
  };

  const columns = [
    {
      title: 'EMPLOYEE',
      key: 'employee',
      width: 220,
      render: (_: any, record: SalaryData) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0f2f5', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <UserOutlined style={{ color: '#1890ff', fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{record.employeeName}</div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>{record.employeeCode}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'PERIOD',
      key: 'period',
      width: 100,
      render: () => (
        <Text style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 500 }}>
          {dayjs(selectedMonth).format('MMM YYYY').toUpperCase()}
        </Text>
      ),
    },
    {
      title: 'DEPARTMENT',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text: string) => (
        <Tag color="cyan" style={{ borderRadius: 12, border: 'none', padding: '0 8px', fontSize: 10 }}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'ATTENDANCE',
      key: 'attendance',
      align: 'center' as const,
      render: (_: any, record: SalaryData) => (
        <Text style={{ fontSize: 12 }}>
          <span style={{ color: '#52c41a', fontWeight: 600 }}>{record.actualWorkingDays}</span>
          <span style={{ color: '#bfbfbf' }}> / {record.workingDays}</span>
        </Text>
      ),
    },
    {
      title: 'GROSS',
      dataIndex: 'monthlySalary',
      key: 'monthlySalary',
      align: 'right' as const,
      render: (val: number) => <Text strong style={{ fontSize: 12 }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'NET SALARY',
      dataIndex: 'netSalary',
      key: 'netSalary',
      align: 'right' as const,
      render: (val: number) => (
        <Text strong style={{ color: '#1890ff', fontSize: 13 }}>{formatCurrency(val)}</Text>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '#d9d9d9'; let bg = '#fafafa'; let border = '#d9d9d9'; let icon = <ClockCircleOutlined />;
        if (status === 'Approved') { color = '#52c41a'; bg = '#f6ffed'; border = '#b7eb8f'; icon = <CheckCircleOutlined />; }
        else if (status === 'Pending') { color = '#faad14'; bg = '#fffbe6'; border = '#ffe58f'; icon = <ClockCircleOutlined />; }
        else if (status === 'Paid') { color = '#1890ff'; bg = '#e6f7ff'; border = '#91d5ff'; icon = <DollarCircleOutlined />; }
        else if (status === 'Draft') { color = '#8c8c8c'; bg = '#f5f5f5'; border = '#d9d9d9'; icon = <EditOutlined />; }
        else if (status === 'Sent to Bank') { color = '#722ed1'; bg = '#f9f0ff'; border = '#d3adf7'; icon = <SendOutlined />; }
        return (
          <Tag icon={icon} style={{ 
            color, background: bg, borderColor: border, 
            borderRadius: 6, padding: '1px 6px', fontWeight: 500, fontSize: 10 
          }}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'ACTION',
      key: 'action',
      width: 100,
      render: (_: any, record: SalaryData) => (
        <Space size="small">
          <Link href={`/salary/salarypreview/preview?employeeId=${record.employeeId}&month=${selectedMonth}`}>
            <Button type="text" shape="circle" size="small" icon={<EyeOutlined style={{ color: '#1890ff' }} />} />
          </Link>
          <Button 
            type="text" 
            shape="circle" 
            size="small" 
            icon={<SettingOutlined style={{ color: '#fa8c16' }} />} 
            onClick={() => {
              setSelectedEmployeeForAdjustment(record);
              setAdjustmentModalVisible(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: SalaryData) => {
    return (
      <div style={{ padding: '0 20px 20px', backgroundColor: '#fdfdfd' }}>
        <Row gutter={16} align="stretch" style={{ marginTop: 16 }}>
          <Col span={6}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 12, color: '#595959' }}>EARNINGS</Text>
                <Button 
                  type="link" size="small" icon={<PlusOutlined />} 
                  onClick={() => { setSelectedEmployeeForAdjustment(record); setAdjustmentModalVisible(true); }}
                  style={{ padding: 0, height: 'auto', fontSize: 11 }}
                >
                  Adjust
                </Button>
              </div>
              <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, flex: 1, overflow: 'hidden' }}>
                {record.earnings.length > 0 || record.adjustments.some(a => a.type === 'Earning') ? (
                  <>
                    {record.earnings.map(e => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f9f9f9' }}>
                        <Text style={{ fontSize: 11 }}>{e.component.componentName}</Text>
                        <Text strong style={{ fontSize: 11 }}>{formatCurrency(e.amount)}</Text>
                      </div>
                    ))}
                    {record.adjustments.filter(a => a.type === 'Earning').map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f9f9f9', backgroundColor: '#f6ffed' }}>
                        <Text style={{ fontSize: 11, color: '#52c41a' }} italic>{a.label} (Adj)</Text>
                        <Text strong style={{ fontSize: 11, color: '#52c41a' }}>{formatCurrency(a.amount)}</Text>
                      </div>
                    ))}
                  </>
                ) : <div style={{ padding: '8px 12px', textAlign: 'center', color: '#bfbfbf' }}>No earnings</div>}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 12, color: '#595959' }}>DEDUCTIONS</Text>
                <Button 
                  type="link" size="small" icon={<PlusOutlined />} 
                  onClick={() => { setSelectedEmployeeForAdjustment(record); setAdjustmentModalVisible(true); }}
                  style={{ padding: 0, height: 'auto', fontSize: 11, color: '#ff4d4f' }}
                >
                  Adjust
                </Button>
              </div>
              <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, flex: 1, overflow: 'hidden' }}>
                {record.deductions.length > 0 || record.adjustments.some(a => a.type === 'Deduction') ? (
                  <>
                    {record.deductions.map(e => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f9f9f9' }}>
                        <Text style={{ fontSize: 11 }}>{e.component.componentName}</Text>
                        <Text strong style={{ fontSize: 11, color: '#ff4d4f' }}>{formatCurrency(e.amount)}</Text>
                      </div>
                    ))}
                    {record.adjustments.filter(a => a.type === 'Deduction').map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f9f9f9', backgroundColor: '#fff1f0' }}>
                        <Text style={{ fontSize: 11, color: '#ff4d4f' }} italic>{a.label} (Adj)</Text>
                        <Text strong style={{ fontSize: 11, color: '#ff4d4f' }}>{formatCurrency(a.amount)}</Text>
                      </div>
                    ))}
                  </>
                ) : <div style={{ padding: '8px 12px', textAlign: 'center', color: '#bfbfbf' }}>No deductions</div>}
              </div>
            </div>
          </Col>
          <Col span={5}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: 8 }}><Text strong style={{ fontSize: 12, color: '#595959' }}>LEAVE SUMMARY</Text></div>
              <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '4px 0', flex: 1 }}>
                {[
                  { label: 'Casual Leave', value: record.casualLeave, color: '#1890ff' },
                  { label: 'Sick Leave', value: record.sickLeave, color: '#1890ff' },
                  { label: 'Permission', value: record.permission, color: '#1890ff' },
                  { label: 'Loss of Pay', value: record.lopDays, color: '#ff4d4f' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: idx === 3 ? 'none' : '1px solid #f9f9f9' }}>
                    <Text style={{ fontSize: 11 }}>{item.label}</Text>
                    <Text strong style={{ fontSize: 11, color: item.color }}>{item.value} Days</Text>
                  </div>
                ))}
              </div>
            </div>
          </Col>
          <Col span={7}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: 8 }}><Text strong style={{ fontSize: 12, color: '#52c41a' }}>FINAL SUMMARY</Text></div>
              <div style={{ backgroundColor: '#f6ffed', border: '1px solid #e1f0e0', borderRadius: 8, padding: 12, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11 }}>Gross Monthly</Text>
                  <Text strong style={{ fontSize: 11 }}>{formatCurrency(record.monthlySalary)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11 }}>Other Deductions</Text>
                  <Text strong style={{ fontSize: 11, color: '#ff4d4f' }}>- {formatCurrency(record.totalComponentDeductions)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11 }}>LOP Deduction</Text>
                  <Text strong style={{ fontSize: 11, color: '#ff4d4f' }}>- {formatCurrency(record.lopDeduction)}</Text>
                </div>
                {record.adjustments.length > 0 && (
                  <>
                    <Divider style={{ margin: '6px 0', borderColor: '#d9f7be' }} />
                    {record.adjustments.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, color: a.type === 'Earning' ? '#52c41a' : '#ff4d4f' }}>
                          {a.label}
                        </Text>
                        <Text strong style={{ fontSize: 10, color: a.type === 'Earning' ? '#52c41a' : '#ff4d4f' }}>
                          {a.type === 'Earning' ? '+' : '-'} {formatCurrency(a.amount)}
                        </Text>
                      </div>
                    ))}
                  </>
                )}
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 12 }}>NET PAYABLE</Text>
                  <Text strong style={{ fontSize: 13, color: '#1890ff' }}>{formatCurrency(record.netSalary)}</Text>
                </div>
                <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                  <Link href={`/salary/salarypreview/preview?employeeId=${record.employeeId}&month=${selectedMonth}`}>
                    <Button type="primary" size="small" ghost icon={<EyeOutlined />} style={{ fontSize: 11 }}>Full Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <MainLayout>
      <div style={{ padding: '12px 16px', minHeight: '100vh', backgroundColor: '#fff' }}>
        {/* Modern Header */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ marginBottom: 2, fontWeight: 700 }}>Bulk Salary Overview</Title>
            <Space style={{ marginBottom: 4 }}>
              <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 11 }}>
                {dayjs(selectedMonth).format('MMMM YYYY').toUpperCase()}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Cycle: 01 {dayjs(selectedMonth).format('MMM')} - {dayjs(selectedMonth).endOf('month').format('DD MMM YYYY')}
              </Text>
            </Space>
          </div>
          <Space>
            <Button 
              size="middle" 
              icon={<DownloadOutlined />} 
              onClick={handleExportExcel}
              disabled={salaryData.length === 0}
            >
              Export
            </Button>
            {selectedRowKeys.length > 0 && (
              <Space>
                <Button 
                  size="middle"
                  icon={<SettingOutlined />}
                  onClick={() => setBulkAdjustmentModalVisible(true)}
                  style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
                >
                  Bulk Adjustment ({selectedRowKeys.length})
                </Button>
                <Button 
                  size="middle"
                  icon={<SaveOutlined />}
                  onClick={handleSaveDraft}
                  style={{ borderColor: '#1890ff', color: '#1890ff' }}
                >
                  Save Draft ({selectedRowKeys.length})
                </Button>
                <Button 
                   type="primary" 
                   size="middle"
                   icon={<SendOutlined />}
                    onClick={handleSubmitForApproval}
                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                  >
                    Send for Approval ({selectedRowKeys.length})
                  </Button>
              </Space>
            )}
          </Space>
        </div>

        {/* Stats Summary Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card bordered={false} className="premium-card" bodyStyle={{ padding: 12 }} style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  backgroundColor: '#e6f7ff', padding: 10, borderRadius: 8, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <DollarCircleOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                </div>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Total Payroll</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(summaryStats.totalPayroll)}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} className="premium-card" bodyStyle={{ padding: 12 }} style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  backgroundColor: '#f6ffed', padding: 10, borderRadius: 8, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <TeamOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                </div>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Employees</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{salaryData.length}</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} className="premium-card" bodyStyle={{ padding: 12 }} style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  backgroundColor: '#fff7e6', padding: 10, borderRadius: 8, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <WalletOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                </div>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Avg Net Pay</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(summaryStats.avgSalary)}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filter Section (No Fetch Button) */}
        <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4 }}><Text strong style={{ fontSize: 12, color: '#595959' }}>MONTH</Text></div>
              <Select className="w-full glass-select" size="middle" value={selectedMonth} onChange={setSelectedMonth}>
                {generateMonths().map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div style={{ marginBottom: 4 }}><Text strong style={{ fontSize: 12, color: '#595959' }}>DEPARTMENT</Text></div>
              <Select className="w-full glass-select" size="middle" value={selectedDepartment} onChange={setSelectedDepartment} loading={departmentsLoading}>
                <Option value="all">All Departments</Option>
                {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <div style={{ marginBottom: 4 }}><Text strong style={{ fontSize: 12, color: '#595959' }}>SEARCH EMPLOYEE</Text></div>
              <Input
                size="middle" placeholder="ID or Name"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ borderRadius: 6 }}
              />
            </Col>
          </Row>
        </Card>

        {/* Main Table */}
        <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={salaryData}
            loading={loading || employeesLoading}
            rowKey="employeeId"
            pagination={{ pageSize: 20, position: ['bottomRight'], showSizeChanger: true }}
            className="modern-table"
            size="small"
            expandable={{
              expandedRowRender,
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <span onClick={e => onExpand(record, e)} style={{ cursor: 'pointer', color: '#1890ff', fontSize: 14 }}>−</span>
                ) : (
                  <span onClick={e => onExpand(record, e)} style={{ cursor: 'pointer', color: '#1890ff', fontSize: 14 }}>+</span>
                )
            }}
          />
        </Card>

        {/* Adjustments Modal */}
        <Modal
          title={
            <Space>
              <SettingOutlined style={{ color: '#fa8c16' }} />
              <Text strong>Manage Adjustments - {selectedEmployeeForAdjustment?.employeeName}</Text>
            </Space>
          }
          open={adjustmentModalVisible}
          onCancel={() => {
            setAdjustmentModalVisible(false);
            setSelectedEmployeeForAdjustment(null);
            setEditingRowAdjustmentId(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
          style={{ top: 40 }}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 20, backgroundColor: '#fffbe6', padding: '12px 16px', borderRadius: 8, border: '1px solid #ffe58f' }}>
              <Text style={{ fontSize: 13, color: '#856404' }}>
                Add ad-hoc earnings or deductions. These will be automatically calculated into the net salary for {selectedMonth}.
              </Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleAddAdjustment} initialValues={{ type: 'Earning' }}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="label" label="Label (e.g., performance Bonus)" rules={[{ required: true }]}>
                    <Input placeholder="Description" />
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
                  <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="₹0" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label=" ">
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={editingRowAdjustmentId ? <CheckOutlined /> : <PlusOutlined />}
                      loading={isSavingRowAdjustment}
                      block
                    >
                      {editingRowAdjustmentId ? 'Update' : 'Add'}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <Divider orientation="left" style={{ margin: '16px 0' }}>Current Adjustments</Divider>
            
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {selectedEmployeeForAdjustment?.adjustments && selectedEmployeeForAdjustment.adjustments.length > 0 ? (
                <Table
                  dataSource={modalAdjustments}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  loading={modalLoading}
                  columns={[
                    { title: 'Description', dataIndex: 'label', key: 'label' },
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
                              setEditingRowAdjustmentId(record.id);
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
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#bfbfbf' }}>
                  No adjustments found for this period
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* Bulk Adjustment Modal */}
        <Modal
          title={
            <Space>
              <SettingOutlined style={{ color: '#fa8c16' }} />
              <Text strong>Bulk Performance Adjustment ({selectedRowKeys.length} Employees Selected)</Text>
            </Space>
          }
          open={bulkAdjustmentModalVisible}
          onCancel={() => {
            setBulkAdjustmentModalVisible(false);
            bulkForm.resetFields();
          }}
          footer={null}
          width={500}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 20, backgroundColor: '#e6f7ff', padding: '12px 16px', borderRadius: 8, border: '1px solid #91d5ff' }}>
              <Text style={{ fontSize: 13, color: '#003a8c' }}>
                Applying this adjustment will add it to all {selectedRowKeys.length} selected employees for {dayjs(selectedMonth).format('MMMM YYYY')}.
              </Text>
            </div>

            <Form form={bulkForm} layout="vertical" onFinish={handleBulkAdjustment} initialValues={{ type: 'Earning' }}>
              <Form.Item name="label" label="Adjustment Label (e.g., Festive Bonus)" rules={[{ required: true, message: 'Please enter a label' }]}>
                <Input placeholder="Enter description" />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                    <Select>
                      <Option value="Earning">Earning</Option>
                      <Option value="Deduction">Deduction</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: 'Please enter amount' }]}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="₹0" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setBulkAdjustmentModalVisible(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={isSavingBulkAdjustment}>
                    Apply to {selectedRowKeys.length} Employees
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        </Modal>
      </div>

      <style jsx global>{`
        .premium-card {
          border: 1px solid #f0f0f0;
        }
        .modern-table .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          color: #595959 !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          letter-spacing: 0.3px !important;
          padding: 10px !12px !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          padding: 10px 12px !important;
        }
        .glass-select .ant-select-selector {
          border-radius: 6px !important;
        }
      `}</style>
    </MainLayout>
  );
}
