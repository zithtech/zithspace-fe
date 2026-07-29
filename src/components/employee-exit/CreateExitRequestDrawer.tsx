import React, { useState, useEffect } from 'react';
import { Drawer, Button, Form, Select, DatePicker, Input, Typography, Switch, notification, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Plus, X, User, Clock, FileText } from 'lucide-react';
import dayjs from 'dayjs';

import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';
import { useAuth } from '@/context/AuthContext';
import { EmployeeExitService } from '@/services/employeeExitService';
import { EmployeeService } from '@/services/employeeServices';
import { DepartmentService } from '@/services/departmentService';
import { PositionService } from '@/services/positionService';
import { ExitTypeService } from '@/services/exitTypeService';
import { ReasonForExitService } from '@/services/reasonForExitService';

const { Text } = Typography;
const { TextArea } = Input;

export interface CreateExitRequestDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultEmployeeId?: string; 
  isSelfService?: boolean;
  initialData?: any; // If provided, drawer is in edit mode
}

export const CreateExitRequestDrawer: React.FC<CreateExitRequestDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultEmployeeId,
  isSelfService = false,
  initialData
}) => {
  const isEditMode = !!initialData;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [buyoutEnabled, setBuyoutEnabled] = useState(false);
  const [resignationLetter, setResignationLetter] = useState<any[]>([]);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [exitTypes, setExitTypes] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      fetchData();
      form.resetFields();
      setBuyoutEnabled(false);
      setResignationLetter([]);

      if (initialData) {
        // Edit mode: pre-fill all existing values
        setTimeout(() => {
          form.setFieldsValue({
            employeeId: initialData.employeeId,
            exitTypeId: initialData.exitTypeId,
            exitReasonId: initialData.exitReasonId,
            resignationDate: initialData.resignationDate ? dayjs(initialData.resignationDate) : undefined,
            proposedLastWorkingDay: initialData.proposedLastWorkingDay ? dayjs(initialData.proposedLastWorkingDay) : undefined,
            noticePeriodDay: initialData.noticePeriodDay ? dayjs(initialData.noticePeriodDay) : undefined,
            waiveNoticePeriod: initialData.waiveNoticePeriod || false,
            buyoutRequired: initialData.buyoutRequired || false,
            buyoutAmount: initialData.buyoutAmount || undefined,
            explanation: initialData.explanation || '',
          });
          setBuyoutEnabled(!!initialData.buyoutRequired);
          
          if (initialData.resignationLetterUrl || initialData.resignationLetter) {
            setResignationLetter([{
              uid: '-1',
              name: initialData.resignationLetter || 'resignation-letter.pdf',
              status: 'done',
              url: initialData.resignationLetterUrl || initialData.resignationLetter,
            }]);
          }
          
          handleEmployeeChange(initialData.employeeId, true);
        }, 100);
      } else {
        const empIdToUse = defaultEmployeeId || (isSelfService ? user?.employeeId : undefined);
        if (empIdToUse) {
          form.setFieldsValue({ employeeId: empIdToUse });
          handleEmployeeChange(empIdToUse);
        }
      }
    }
  }, [visible, defaultEmployeeId, user, initialData]);

  const fetchData = async () => {
    try {
      const [empRes, deptRes, posRes, typesRes, reasonsRes] = await Promise.all([
        EmployeeService.getEmployeesForSelect(),
        DepartmentService.getAll(),
        PositionService.getAll(),
        ExitTypeService.getAll(),
        ReasonForExitService.getAll()
      ]);
      // Filter out users without an employeeId (exit requests require a valid HR employee record)
      const validEmps = empRes.filter((emp: any) => !!emp.employeeId);
      
      // Deduplicate by employeeId to prevent multiple users mapped to the same employee showing up
      const uniqueEmpsMap = new Map();
      validEmps.forEach((emp: any) => {
        if (!uniqueEmpsMap.has(emp.employeeId)) {
          uniqueEmpsMap.set(emp.employeeId, {
            ...emp,
            value: emp.employeeId,
            label: emp.label
          });
        }
      });
      
      setEmployees(Array.from(uniqueEmpsMap.values()));
      setDepartments(deptRes);
      setPositions(posRes);
      setExitTypes(typesRes.filter((t: any) => t.is_active));
      setReasons(reasonsRes.filter((r: any) => r.is_active));
    } catch (e) {
      console.error("Failed to load options", e);
    }
  };

  const handleEmployeeChange = async (employeeId: string, skipNoticePeriodUpdate = false) => {
    try {
      setDetailsLoading(true);
      const data = await EmployeeService.getWorkDetailByEmployee(employeeId);

      if (data) {
        const posId = data.position?.id || data.positionId || null;
        const posTitle = data.position?.title || (positions.find(p => p.id === posId)?.title) || null;

        const deptId = data.department?.id || data.departmentId || data.position?.departmentId || data.position?.department?.id || null;
        const deptName = data.department?.name || (departments.find(d => d.id === deptId)?.name) || data.position?.department?.name || null;

        const managerId = data.reportingManagerId;
        const managerName = data.reportingManagerName;

        const formValues: any = {};

        if (posId) {
          formValues.positionId = { value: posId, label: posTitle || posId };
        }
        if (deptId) {
          formValues.departmentId = { value: deptId, label: deptName || deptId };
        }
        if (managerId) {
          formValues.reportingManagerId = { value: managerId, label: managerName || managerId };
        } else if (managerName) {
          formValues.reportingManagerId = { value: managerName, label: managerName };
        }

        form.setFieldsValue(formValues);

        // Notice period handling
        if (!skipNoticePeriodUpdate) {
          const noticeDays = data.noticePeriodDays || data.noticePeriod || 0;
          if (noticeDays > 0) {
            form.setFieldsValue({ noticePeriodDays: noticeDays });
            const resignationDate = form.getFieldValue('resignationDate');
            if (resignationDate) {
              const noticeDate = dayjs(resignationDate).add(noticeDays, 'day');
              form.setFieldsValue({ noticePeriodDay: noticeDate });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching employee details", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const calculateNoticeDate = (resignationDate: dayjs.Dayjs, periodDays: number = 0) => {
    if (resignationDate && periodDays) {
      const lastDay = resignationDate.add(periodDays, 'day');
      form.setFieldsValue({
        noticePeriodDay: lastDay,
        proposedLastWorkingDay: lastDay
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        employeeId: values.employeeId,
        departmentId: values.departmentId?.value || values.departmentId,
        positionId: values.positionId?.value || values.positionId,
        reportingManagerId: values.reportingManagerId?.value || values.reportingManagerId,
        exitTypeId: values.exitTypeId,
        exitReasonId: values.exitReasonId,
        resignationDate: values.resignationDate ? values.resignationDate.format('YYYY-MM-DD') : undefined,
        proposedLastWorkingDay: values.proposedLastWorkingDay ? values.proposedLastWorkingDay.format('YYYY-MM-DD') : undefined,
        noticePeriodDay: values.noticePeriodDay ? values.noticePeriodDay.format('YYYY-MM-DD') : undefined,
        waiveNoticePeriod: values.waiveNoticePeriod || false,
        buyoutRequired: values.buyoutRequired || false,
        buyoutAmount: values.buyoutRequired ? (values.buyoutAmount || 0) : 0,
        explanation: values.explanation,
        resignationLetter: undefined as any
      };

      if (resignationLetter.length > 0 && resignationLetter[0].originFileObj) {
        const file = resignationLetter[0].originFileObj;
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        payload.resignationLetter = {
          fileBase64,
          fileName: file.name
        };
      }
      
      if (isEditMode) {
        await EmployeeExitService.updateExitRequest(initialData.id, payload);
        notification.success({ message: 'Updated', description: 'Exit request updated successfully' });
      } else {
        await EmployeeExitService.createExitRequest(payload);
        notification.success({ message: 'Success', description: 'Exit request submitted successfully' });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.errorFields) return;
      notification.error({ message: 'Error', description: error.message || 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      open={visible}
      onClose={onClose}
      footer={
        <div
          className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <Button onClick={onClose} style={{ borderRadius: 8, height: 36 }}>Cancel</Button>
          <Button 
            type="primary" 
            loading={loading} 
            onClick={handleSubmit} 
            style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
          >
            {isEditMode ? 'Save Changes' : 'Submit Request'}
          </Button>
        </div>
      }
    >
      <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
      <div
        className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--bg-blue-50)',
              color: 'var(--text-blue-700)',
              border: '1px solid var(--border-blue-200)',
            }}
          >
            <Plus size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              New Exit Request
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Initiate a new employee exit process
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)] cursor-pointer"
          style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent' }}
        >
          <X size={16} />
        </button>
      </div>

      <Form
        form={form}
        layout="horizontal"
        labelAlign="left"
        labelCol={{ span: 9 }}
        wrapperCol={{ span: 15 }}
        requiredMark={false}
        className="customer-drawer-form"
      >
        <div className="px-6 py-6 space-y-5 pb-24">
          <SectionCard title="Employee Information" icon={<User size={16} />}>
            <Form.Item
              name="employeeId"
              label={<Text strong style={{ fontSize: 13 }}>Select Employee</Text>}
              rules={[{ required: true, message: 'Please select an employee' }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                showSearch
                placeholder="Search by name or code..."
                options={employees}
                onChange={handleEmployeeChange}
                disabled={!!defaultEmployeeId || (isSelfService && !!user?.employeeId)}
                style={{ height: 38 }}
                optionFilterProp="label"
                filterOption={(input, option) => String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>

            <Form.Item name="positionId" label={<Text strong style={{ fontSize: 13 }}>Current Position</Text>} style={{ marginBottom: 12 }}>
              <Select disabled loading={detailsLoading} labelInValue placeholder="Auto-filled" options={positions.map(p => ({ value: p.id, label: p.title }))} style={{ height: 38 }} />
            </Form.Item>
            <Form.Item name="departmentId" label={<Text strong style={{ fontSize: 13 }}>Department</Text>} style={{ marginBottom: 12 }}>
              <Select disabled loading={detailsLoading} labelInValue placeholder="Auto-filled" options={departments.map(d => ({ value: d.id, label: d.name }))} style={{ height: 38 }} />
            </Form.Item>
            <Form.Item name="reportingManagerId" label={<Text strong style={{ fontSize: 13 }}>Reporting Manager</Text>} style={{ marginBottom: 0 }}>
              <Select disabled loading={detailsLoading} placeholder="Auto-filled" labelInValue options={employees} style={{ height: 38 }} />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Exit Timeline" icon={<Clock size={16} />}>
            <Form.Item
              name="exitTypeId"
              label={<Text strong style={{ fontSize: 13 }}>Exit Category</Text>}
              rules={[{ required: true, message: 'Please select exit type' }]}
              style={{ marginBottom: 12 }}
            >
              <Select placeholder="Select exit type" options={exitTypes.map(t => ({ value: t.id, label: t.name }))} style={{ height: 38 }} />
            </Form.Item>
            <Form.Item
              name="resignationDate"
              label={<Text strong style={{ fontSize: 13 }}>Resignation Date</Text>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker style={{ width: '100%', height: 38 }} placeholder="Select date" onChange={(val) => calculateNoticeDate(val as dayjs.Dayjs, form.getFieldValue('noticePeriodDays'))} />
            </Form.Item>
            <Form.Item
              name="proposedLastWorkingDay"
              label={<Text strong style={{ fontSize: 13 }}>Proposed Last Working Day</Text>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker style={{ width: '100%', height: 38 }} placeholder="Select date" />
            </Form.Item>
            <Form.Item name="noticePeriodDays" label={<Text strong style={{ fontSize: 13 }}>Notice Period (Days)</Text>} style={{ marginBottom: 12 }}>
              <Input readOnly placeholder="0" style={{ height: 38, background: "var(--bg-slate-50)" }} />
            </Form.Item>
            <Form.Item name="noticePeriodDay" label={<Text strong style={{ fontSize: 13 }}>Calculated Notice End Date</Text>} style={{ marginBottom: 0 }}>
              <DatePicker disabled style={{ width: '100%', height: 38, background: "var(--bg-slate-50)" }} placeholder="Calculated" />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Additional Details" icon={<FileText size={16} />}>
            <Form.Item
              name="exitReasonId"
              label={<Text strong style={{ fontSize: 13 }}>Reason for Exit</Text>}
              rules={[{ required: true, message: 'Please select reason' }]}
              style={{ marginBottom: 12 }}
            >
              <Select placeholder="Select primary reason" options={reasons.map(r => ({ value: r.id, label: r.name }))} style={{ height: 38 }} />
            </Form.Item>
            <Form.Item name="waiveNoticePeriod" label={<Text strong style={{ fontSize: 13 }}>Waive Notice Period</Text>} valuePropName="checked" style={{ marginBottom: 12 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="buyoutRequired" label={<Text strong style={{ fontSize: 13 }}>Notice Buyout Required</Text>} valuePropName="checked" style={{ marginBottom: 12 }}>
              <Switch onChange={setBuyoutEnabled} />
            </Form.Item>
            {buyoutEnabled && (
              <Form.Item name="buyoutAmount" label={<Text strong style={{ fontSize: 13 }}>Buyout Amount</Text>} style={{ marginBottom: 12 }} rules={[{ required: true, message: 'Required' }]}>
                <Input type="number" prefix="$" style={{ height: 38 }} placeholder="Enter amount" />
              </Form.Item>
            )}
            <Form.Item name="explanation" label={<Text strong style={{ fontSize: 13 }}>Comments / Notes</Text>} style={{ marginBottom: 12 }}>
              <TextArea rows={4} placeholder="Additional context about this exit request..." style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label={<Text strong style={{ fontSize: 13 }}>Resignation Letter</Text>} style={{ marginBottom: 0 }}>
              <Upload
                maxCount={1}
                fileList={resignationLetter}
                beforeUpload={() => false}
                onChange={({ fileList }) => setResignationLetter(fileList)}
                onPreview={async (file) => {
                  if (!file.url && !file.preview && file.originFileObj) {
                    file.preview = await new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(file.originFileObj as Blob);
                      reader.onload = () => resolve(reader.result as string);
                    });
                  }
                  
                  let url = file.url || file.preview || '';
                  if (url.includes("r2.cloudflarestorage.com")) {
                    url = url.replace(
                      /https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/,
                      "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev"
                    );
                  }
                  if (url.includes(".r2.dev") && !url.includes(".r2.dev/")) {
                    url = url.replace(".r2.dev", ".r2.dev/");
                  }
                  
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
              >
                <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>Click to Upload</Button>
              </Upload>
            </Form.Item>
          </SectionCard>
        </div>
      </Form>
    </Drawer>
  );
};
