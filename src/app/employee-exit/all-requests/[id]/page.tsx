'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { 
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Tabs,
  Tag,
  Divider,
  Table,
  Input,
  Select,
  InputNumber,
  Modal,
  Form,
  Upload,
  App
} from 'antd';
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Info,
  Plus,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  Building,
  Clock,
  CheckCircle2,
  History,
  MessageSquare,
  Wallet,
  UserCheck,
  ShieldCheck,
  Building2,
  Trophy,
  CheckCircle,
  HelpCircle,
  MapPin,
  Mail,
  Users } from 'lucide-react';

// Components
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Services
import { EmployeeExitService, EmployeeExitRequest, EmployeeAsset } from '@/services/employeeExitService';
import { ExitTypeService, ExitType } from '@/services/exitTypeService';
import { ReasonForExitService, ReasonForExit } from '@/services/reasonForExitService';
import { PositionService, Position } from '@/services/positionService';
import { DepartmentService } from '@/services/departmentService';


const { Title, Text, Paragraph } = Typography;

const PlaceholderTab = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div style={{ padding: '60px 0', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border-slate-200)', margin: '24px 0' }}>
    <Space direction="vertical" align="center" size={20}>
      <div style={{ color: 'var(--premium-blue)', background: 'var(--bg-pure-white)', padding: 20, borderRadius: '50%', boxShadow: "var(--shadow-premium-sm)" }}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <div>
        <Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)', fontWeight: 600 }}>{title}</Title>
        <Text style={{ color: 'var(--text-slate-500)', fontSize: 15 }}>This section is currently being prepared for the next release.</Text>
      </div>
    </Space>
  </div>
);

// --- Components ---

const RowItem = ({ label, value, icon, color = "#3b82f6" }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
      padding: "8px 12px",
      background: "var(--bg-pure-white)",
      borderRadius: "10px",
      border: "1px solid var(--border-slate-100)",
      transition: "all 0.2s ease" }}
  >
    {icon && (
      <div
        style={{
          marginRight: "12px",
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          background: `${color}10`,
          borderRadius: "8px" }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-slate-400)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "2px" }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-slate-900)",
          fontWeight: 500 }}
      >
        {value || "-"}
      </div>
    </div>
  </div>
);

const DetailCard = ({ label, value, icon: Icon }: { label: string, value: any, icon: any }) => (
  <RowItem label={label} value={value} icon={<Icon />} />
);

// --- Page Component ---

export default function ExitRequestViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [assetForm] = Form.useForm();

  // State
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<EmployeeExitRequest | null>(null);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EmployeeAsset | null>(null);

  // Master Data
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [reasons, setReasons] = useState<ReasonForExit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchRequestData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestData, typesData, reasonsData, positionsData, departmentsData] = await Promise.all([
        EmployeeExitService.getExitRequestById(id as string),
        ExitTypeService.getAll(),
        ReasonForExitService.getAll(),
        PositionService.getAll(),
        DepartmentService.getAll(),
      ]);

      setRequest(requestData);
      setExitTypes(typesData);
      setReasons(reasonsData);
      setPositions(positionsData);
      setDepartments(departmentsData);

      if (requestData?.employeeId) {
        fetchAssets(requestData.employeeId);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      messageApi.error('Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  const fetchAssets = async (employeeId: string) => {
    setAssetsLoading(true);
    try {
      const data = await EmployeeExitService.getEmployeeAssets(employeeId);
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequestData();
  }, [id, fetchRequestData]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <LoadingSpinner message="Loading Exit Details..." size="large" fullScreen={false} />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!request) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Title level={4}>Request Not Found</Title>
            <Button type="primary" onClick={() => router.push('/employee-exit/management')}>Back to List</Button>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const getExitTypeName = (id: string) => exitTypes.find(t => t.id === id)?.name || 'N/A';
  const getReasonName = (id: string) => reasons.find(r => r.id === id)?.name || 'N/A';
  const getPositionName = (id: string) => positions.find(p => p.id === id)?.title || 'N/A';
  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';

  const employeeName = `${request.employee?.first_name} ${request.employee?.last_name}`;
  const noticeRemaining = dayjs(request.proposedLastWorkingDay).diff(dayjs().startOf('day'), 'day');

  // Asset Handlers
  const handleAssetSubmit = async () => {
    try {
      const values = await assetForm.validateFields();
      const payload = { ...values, returnStatus: values.returnStatus || "Pending", condition: values.condition || "Good" };

      if (editingAsset?.id) {
        await EmployeeExitService.updateEmployeeAsset(request.employeeId, editingAsset.id, payload);
        messageApi.success("Asset updated");
      } else {
        await EmployeeExitService.addEmployeeAsset(request.employeeId, payload);
        messageApi.success("Asset added");
      }
      setIsAssetModalOpen(false);
      fetchAssets(request.employeeId);
    } catch (error) {
      messageApi.error("Failed to save asset");
    }
  };

  const overviewTab = (
    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 🚀 Exit Context & Status */}
      <div style={{
        background: "var(--bg-pure-white)",
        padding: 24,
        borderRadius: 20,
        border: "1px solid var(--border-slate-100)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "var(--shadow-premium-sm)"
      }}>
        <div style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: "var(--bg-blue-50)",
          borderRadius: "50%",
          opacity: 0.5
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "var(--premium-blue)", padding: 8, borderRadius: 10, color: "var(--bg-pure-white)" }}>
            <FileText size={20} />
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)", display: "block" }}>Request Overview</span>
            <span style={{ fontSize: 13, color: "var(--text-slate-500)" }}>Core details of the resignation request</span>
          </div>
        </div>

        <Row gutter={[16, 0]}>
          <Col span={8}><RowItem label="Employee" value={employeeName} icon={<User />} /></Col>
          <Col span={8}><RowItem label="Employee ID" value={request.employee?.employee_code} icon={<FileText />} /></Col>
          <Col span={8}><RowItem label="Position" value={getPositionName(request.positionId)} icon={<Briefcase />} color="#8b5cf6" /></Col>
          <Col span={8}><RowItem label="Department" value={getDepartmentName(request.departmentId)} icon={<Building2 />} color="#8b5cf6" /></Col>
          <Col span={8}><RowItem label="Reporting Manager" value={request.reportingManagerName} icon={<UserCheck />} color="#10b981" /></Col>
          <Col span={8}>
            <RowItem
              label="Exit Type"
              value={<Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{getExitTypeName(request.exitTypeId)}</Tag>}
              icon={<Info />}
              color="#ef4444"
            />
          </Col>
        </Row>
      </div>

      {/* 📅 Timeline & Reasons */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        <div style={{ padding: 24, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-slate-100)", boxShadow: "var(--shadow-premium-sm)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Calendar size={18} style={{ color: "var(--premium-blue)" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-slate-900)" }}>Timeline Details</span>
          </div>
          <Row gutter={[16, 0]}>
            <Col span={12}><RowItem label="Resignation Date" value={dayjs(request.resignationDate).format('DD MMM YYYY')} icon={<Calendar />} /></Col>
            <Col span={12}><RowItem label="Last Working Day" value={dayjs(request.proposedLastWorkingDay).format('DD MMM YYYY')} icon={<Calendar />} color="#10b981" /></Col>
            <Col span={24}>
              <RowItem
                label="Days Remaining"
                value={
                  <span style={{ color: noticeRemaining < 0 ? "var(--text-green-600)" : "var(--premium-blue)", fontWeight: 700 }}>
                    {noticeRemaining < 0 ? 'Resignation Period Completed' : `${noticeRemaining} Days to LWD`}
                  </span>
                }
                icon={<Clock />}
                color={noticeRemaining < 0 ? "#10b981" : "var(--premium-blue)"}
              />
            </Col>
          </Row>
        </div>

        <div style={{ padding: 24, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-slate-100)", boxShadow: "var(--shadow-premium-sm)" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <HelpCircle size={18} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-slate-900)" }}>Resignation Context</span>
          </div>
          <RowItem label="Primary Reason" value={getReasonName(request.exitReasonId)} icon={<MessageSquare />} color="#f59e0b" />
          <RowItem label="Current Status" value={<Tag color="orange" style={{ borderRadius: 6, margin: 0 }}>{request.status || 'PENDING'}</Tag>} icon={<ShieldCheck />} color="#f59e0b" />
        </div>
      </div>

      {/* 📝 Explanation Block */}
      <div style={{ padding: 24, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-slate-100)", boxShadow: "var(--shadow-premium-sm)" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)" }}>
            <FileText size={20} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>Detailed Explanation</span>
        </div>
        <div style={{
          padding: 18,
          background: "var(--bg-secondary)",
          borderRadius: 16,
          border: "1px solid var(--border-slate-100)",
          fontSize: 14,
          color: "var(--text-slate-500)",
          lineHeight: 1.6,
          minHeight: 100
        }}>
          {request.explanation || 'No detailed explanation provided by the employee.'}
        </div>
      </div>
    </div>
  );

  const assetColumns = [
    { title: 'Asset Name', dataIndex: 'item', key: 'item' },
    { title: 'Return Status', dataIndex: 'returnStatus', key: 'returnStatus', render: (s: string) => <Tag color={s === 'Returned' ? 'success' : 'warning'}>{s}</Tag> },
    { title: 'Condition', dataIndex: 'condition', key: 'condition' },
    { title: 'Deduction', dataIndex: 'deduction', key: 'deduction', render: (v: number) => `$${v || 0}` },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: EmployeeAsset) => (
        <Space>
          <Button type="text" icon={<Edit size={16} />} onClick={() => { setEditingAsset(record); assetForm.setFieldsValue(record); setIsAssetModalOpen(true); }} />
          <Button type="text" danger icon={<Trash2 size={16} />} onClick={async () => { await EmployeeExitService.deleteEmployeeAsset(request.employeeId, record.id!); fetchAssets(request.employeeId); }} />
        </Space>
      )
    }
  ];

  const assetsTab = (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditingAsset(null); assetForm.resetFields(); setIsAssetModalOpen(true); }}>
          Add Asset
        </Button>
      </div>
      <Table
        columns={assetColumns}
        dataSource={assets}
        rowKey="id"
        loading={assetsLoading}
        pagination={false}
        className="modern-table"
      />
    </div>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: '24px 32px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
          

          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Space size={16} align="center">
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={() => router.push('/employee-exit/management')}
                style={{ borderRadius: 10, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>{employeeName}</Title>
                <Space split={<Divider type="vertical" />}>
                  <Text style={{ color: "var(--text-slate-500)" }}>ID: {request.employee?.employee_code || 'N/A'}</Text>
                  <Text style={{ color: "var(--text-slate-500)" }}>{getDepartmentName(request.departmentId)}</Text>
                </Space>
              </div>
            </Space>
            <Tag color="orange" style={{ padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>{request.status || 'PENDING'}</Tag>
          </div>

          <Tabs
            defaultActiveKey="1"
            className="modern-tabs"
            items={[
              { key: '1', label: 'Overview', children: overviewTab },
              { key: '2', label: 'Approvals', children: <PlaceholderTab title="Approvals" icon={UserCheck} /> },
              { key: '3', label: 'Assets & Clearance', children: assetsTab },
              { key: '4', label: 'FNF Settlement', children: <PlaceholderTab title="FNF Settlement" icon={Wallet} /> },
              { key: '5', label: 'Exit Interview', children: <PlaceholderTab title="Exit Interview" icon={MessageSquare} /> },
              { key: '6', label: 'Activity Log', children: <PlaceholderTab title="Activity Log" icon={History} /> },
            ]}
          />
        </div>

        <Modal
          title={editingAsset ? "Edit Asset" : "Add Asset"}
          open={isAssetModalOpen}
          onCancel={() => setIsAssetModalOpen(false)}
          onOk={handleAssetSubmit}
          destroyOnClose
        >
          <Form form={assetForm} layout="vertical">
            <Form.Item label="Item Name" name="item" rules={[{ required: true }]}><Input /></Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Return Status" name="returnStatus">
                  <Select options={[{ value: 'Pending', label: 'Pending' }, { value: 'Returned', label: 'Returned' }, { value: 'Damaged', label: 'Damaged' }]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Condition" name="condition">
                  <Select options={[{ value: 'Good', label: 'Good' }, { value: 'Fair', label: 'Fair' }, { value: 'Bad', label: 'Bad' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Deduction Amount" name="deduction"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item label="Remarks" name="remarks"><Input.TextArea rows={2} /></Form.Item>
          </Form>
        </Modal>

        <style dangerouslySetInnerHTML={{
          __html: `
          .modern-tabs .ant-tabs-nav { margin-bottom: 0 !important; }
          .modern-tabs .ant-tabs-tab { padding: 12px 0 !important; margin: 0 32px 0 0 !important; }
          .modern-tabs .ant-tabs-tab-btn { font-size: 15px !important; font-weight: 600 !important; color: var(--text-slate-500) !important; }
          .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--premium-blue) !important; }
          .modern-tabs .ant-tabs-ink-bar { height: 3px !important; background: var(--premium-blue) !important; }
          
          .ant-table-thead > tr > th { 
            background: var(--bg-secondary) !important; color: var(--text-slate-500) !important; 
            font-weight: 600 !important; text-transform: uppercase !important; 
            font-size: 11px !important; letter-spacing: 0.05em !important; 
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
