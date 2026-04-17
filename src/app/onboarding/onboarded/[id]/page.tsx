"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Spin,
  message,
  Image,
} from 'antd';
import {
  ArrowLeft,
  User,
  Calendar,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  IdCard,
  CreditCard,
  History,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Clock,
  Zap,
  Box,
  Award,
  Layers,
  Edit2,
  Lock,
  Users,
} from 'lucide-react';
import dayjs from "dayjs";

// Layout & Components
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { EmployeeOnboardingService } from "@/services/onboardingService";
import EmployeeHistoryView from "../EmployeeHistoryViews";

const { Title, Text, Paragraph } = Typography;

/* ---------------- SHARED COMPONENTS ---------------- */

const RowItem = ({ label, value, icon, color = "#3b82f6" }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
      padding: "10px 14px",
      background: "#ffffff",
      borderRadius: "12px",
      border: "1px solid #f1f5f9",
      transition: "all 0.2s ease",
    }}
  >
    {icon && (
      <div
        style={{
          marginRight: "12px",
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          background: `${color}10`,
          borderRadius: "10px",
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#1e293b",
          fontWeight: 500,
        }}
      >
        {value || "-"}
      </div>
    </div>
  </div>
);

/* ---------------- TABS COMPONENTS ---------------- */

const PersonalDetailsTab = ({ data }: any) => {
  const personal = data?.personalDetails || {};
  const addr = personal.address || {};
  const currentAddr = addr.current || {};
  const permanentAddr = addr.permanent || {};

  const formatAddress = (a: any) => {
    const parts = [a.c_flat || a.p_flat, a.c_area || a.p_area, a.c_city || a.p_city, a.c_state || a.p_state, a.c_pincode || a.p_pincode, a.c_country || a.p_country];
    return parts.filter(Boolean).join(", ") || "Not Provided";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: "16px 0" }}>
      {/* Basic Info */}
      <Card title={<Space><User size={18} color="#3b82f6" /> <span>Basic Information</span></Space>} variant="borderless" styles={{ body: { padding: 24 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9" }}>
        <Row gutter={[20, 0]}>
          <Col span={8}><RowItem label="First Name" value={personal.firstName} icon={<User />} /></Col>
          <Col span={8}><RowItem label="Last Name" value={personal.lastName} icon={<User />} /></Col>
          <Col span={8}><RowItem label="Gender" value={personal.gender} icon={<Zap />} color="#8b5cf6" /></Col>
          <Col span={8}><RowItem label="Date of Birth" value={personal.dob ? dayjs(personal.dob).format("DD MMM YYYY") : null} icon={<Calendar />} color="#10b981" /></Col>
          <Col span={8}><RowItem label="Blood Group" value={personal.bloodGroup} icon={<ShieldCheck />} color="#ef4444" /></Col>
          <Col span={8}><RowItem label="Mobile Number" value={personal.mobile || personal.phone} icon={<Phone />} color="#3b82f6" /></Col>
          <Col span={12}><RowItem label="Personal Email" value={personal.personalEmail || personal.email} icon={<Mail />} color="#64748b" /></Col>
          <Col span={12}><RowItem label="Work Email" value={personal.workEmail} icon={<Mail />} color="#1677ff" /></Col>
        </Row>
      </Card>

      {/* Identity & Relationship */}
      <Row gutter={24}>
        <Col span={12}>
          <Card title={<Space><IdCard size={18} color="#f59e0b" /> <span>Identity Info</span></Space>} variant="borderless" styles={{ body: { padding: 24 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9", height: "100%" }}>
            <RowItem label="PAN Number" value={personal.pan} icon={<IdCard />} color="#f59e0b" />
            <RowItem label="Aadhaar Number" value={personal.aadhaar} icon={<IdCard />} color="#f59e0b" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<Space><Users size={18} color="#ec4899" /> <span>Relationship / Emergency Contact</span></Space>} variant="borderless" styles={{ body: { padding: 24 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9", height: "100%" }}>
            <RowItem label="Relationship" value={data.relationship} icon={<Users />} color="#ec4899" />
            <RowItem label="Name" value={data.relationName} icon={<User />} color="#ec4899" />
            <RowItem label="Mobile" value={data.relationMobile} icon={<Phone />} color="#ec4899" />
          </Card>
        </Col>
      </Row>

      {/* Address */}
      <Card title={<Space><MapPin size={18} color="#8b5cf6" /> <span>Address Information</span></Space>} variant="borderless" styles={{ body: { padding: 24 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9" }}>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Current Address</div>
              <Text style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{formatAddress(currentAddr)}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Permanent Address</div>
              <Text style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{formatAddress(permanentAddr)}</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const EmploymentTab = ({ data }: any) => {
  const employment = data?.employment || {};
  return (
    <Card variant="borderless" styles={{ body: { padding: 24 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9", marginTop: 16 }}>
      <Row gutter={[20, 0]}>
        <Col span={8}><RowItem label="Department" value={employment.department} icon={<Building2 />} /></Col>
        <Col span={8}><RowItem label="Team" value={employment.team} icon={<Users />} /></Col>
        <Col span={8}><RowItem label="Position" value={employment.position?.title || employment.designation} icon={<Briefcase />} color="#8b5cf6" /></Col>
        <Col span={8}><RowItem label="Employee Type" value={employment.employeeType} icon={<Zap />} color="#10b981" /></Col>
        <Col span={8}><RowItem label="Work Location" value={employment.workLocation} icon={<MapPin />} color="#f59e0b" /></Col>
        <Col span={8}><RowItem label="Joining Date" value={employment.joiningDate ? dayjs(employment.joiningDate).format("DD MMM YYYY") : null} icon={<Calendar />} color="#1677ff" /></Col>
        <Col span={8}><RowItem label="Notice Period" value={employment.noticePeriod} icon={<Clock />} color="#ef4444" /></Col>
        <Col span={8}><RowItem label="Work Type" value={employment.workType} icon={<Laptop />} color="#8b5cf6" /></Col>
        <Col span={8}><RowItem label="Reporting Manager" value={employment.reportingManager} icon={<User />} color="#10b981" /></Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0, fontSize: 14, color: "#475569", fontWeight: 600 }}>Assigned Projects</Title>
      </div>
      <Space wrap size={12}>
        {employment.projects?.length > 0 ? (
          employment.projects.map((p: any, i: number) => (
            <Tag key={i} color="blue" style={{ borderRadius: 20, padding: "4px 14px", fontWeight: 500, fontSize: 13, border: "none" }}>{p}</Tag>
          ))
        ) : (
          <Text type="secondary">No specific projects assigned yet.</Text>
        )}
      </Space>
    </Card>
  );
};

const BankPayrollTab = ({ data }: any) => {
  const bank = data?.bankAndPayroll || {};
  return (
    <Card variant="borderless" styles={{ body: { padding: 24 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9", marginTop: 16 }}>
      <Row gutter={[20, 0]}>
        <Col span={12}><RowItem label="Bank Name" value={bank.bankName} icon={<Building2 />} /></Col>
        <Col span={12}><RowItem label="Account Holder Name" value={bank.accountHolderName} icon={<User />} color="#10b981" /></Col>
        <Col span={12}><RowItem label="Account Number" value={bank.accountNumber} icon={<CreditCard />} color="#f59e0b" /></Col>
        <Col span={12}><RowItem label="IFSC Code" value={bank.ifscCode} icon={<Lock />} color="#ec4899" /></Col>
        <Col span={8}><RowItem label="PF Number" value={bank.pfNumber} icon={<ShieldCheck />} color="#8b5cf6" /></Col>
        <Col span={8}><RowItem label="ESI Number" value={bank.esiNumber} icon={<ShieldCheck />} color="#ef4444" /></Col>
        <Col span={8}><RowItem label="UAN Number" value={bank.uanNumber} icon={<IdCard />} color="#1677ff" /></Col>
      </Row>
    </Card>
  );
};

const AssetsTab = ({ data }: any) => {
  const assets = data?.assets || [];
  if (assets.length === 0) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', background: '#fbfcfd', borderRadius: 16, border: '1px dashed #e2e8f0', marginTop: 24 }}>
        <Laptop size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
        <div style={{ color: '#64748b' }}>No assets have been assigned to this employee.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, marginTop: 16 }}>
      {assets.map((asset: any, i: number) => (
        <Card key={i} styles={{ body: { padding: 20 } }} style={{ borderRadius: 16, border: "1px solid #f1f5f9" }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 80, height: 80, background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: "1px solid #f1f5f9" }}>
              {asset.image ? <Image alt="asset" src={asset.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><Laptop size={32} /></div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{asset.item}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{asset.brand} - {asset.model}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>S/N: {asset.modelNumber}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* ---------------- MAIN PAGE COMPONENT ---------------- */

export default function OnboardedViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getEmployeeById(id as string);
      let employeeData = null;

      if (res?.data?.success) employeeData = res.data.data;
      else if (res?.success) employeeData = res.data;
      else if (res?.data) employeeData = res.data;
      else employeeData = res;

      if (!employeeData) {
        message.error("Employee details not found");
        return;
      }

      // Comprehensive data extraction with fallbacks
      const personal = employeeData.personal || employeeData;
      const employment = employeeData.employment || employeeData;
      const bank = employeeData.bank || employeeData.bankAndPayroll || employeeData;

      const mappedData = {
        id: id,
        employee_code: employeeData.employee_code || "N/A",
        personalDetails: {
          firstName: personal.firstName || "",
          lastName: personal.lastName || "",
          email: personal.email || personal.personalEmail || "",
          personalEmail: personal.personalEmail || personal.email || "",
          phone: personal.phone || personal.mobile || "",
          mobile: personal.mobile || personal.phone || "",
          dob: personal.dob || personal.dateOfBirth || "",
          gender: personal.gender || "",
          bloodGroup: personal.bloodGroup || "",
          workEmail: personal.workEmail || employeeData.workEmail || "",
          address: personal.address || {},
          pan: personal.pan || "",
          aadhaar: personal.aadhaar || "",
        },
        employment: {
          department: employment.department || "",
          team: employment.team || "",
          employeeType: employment.employeeType || employment.employmentType || "",
          workLocation: employment.workLocation || "",
          workShift: employment.workShift || "",
          joiningDate: employment.joiningDate || "",
          noticePeriod: employment.noticePeriod || "",
          workType: employment.workType || "",
          reportingManager: employment.reportingManager || "",
          designation: employment.designation || employment.position?.title || "",
          projects: employment.projects || [],
        },
        bankAndPayroll: {
          bankName: bank.bankName || "",
          accountNumber: bank.accountNumber || "",
          ifscCode: bank.ifscCode || "",
          pfNumber: bank.pfNumber || "",
          esiNumber: bank.esiNumber || "",
          uanNumber: bank.uanNumber || "",
          accountHolderName: bank.accountHolderName || "",
        },
        history: employeeData.history || employeeData.previousCompanyDetails || [],
        assets: employeeData.assets || [],
        // Relationship / Emergency details
        relationship: employeeData.relationship || personal.relationship || "",
        relationName: employeeData.relationName || personal.relationName || "",
        relationMobile: employeeData.relationMobile || personal.relationMobile || "",
      };

      setData(mappedData);
    } catch (error) {
      console.error("Fetch error:", error);
      message.error("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, fetchDetails]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ height: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin size="large" tip="Loading Employee Information..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!data) return null;

  const personal = data.personalDetails || data.personal || data;
  const fullName = `${personal.firstName || ""} ${personal.lastName || ""}`;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: "24px 32px", background: "#ffffff", minHeight: "100vh" }}>
          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Space size={16}>
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={() => router.push('/onboarding/onboarded')}
                style={{ borderRadius: 12, height: 44, width: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
              />
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{fullName}</Title>
                <Space split={<Divider type="vertical" />}>
                  <Text style={{ color: "#64748b", fontSize: 13 }}>CODE: {data.employee_code || "N/A"}</Text>
                  <Text style={{ color: "#64748b", fontSize: 13 }}>DEPT: {data.employment?.department || "General"}</Text>
                </Space>
              </div>
            </Space>
            <div style={{ display: 'flex', gap: 12 }}>
              <Tag color="success" style={{ padding: "4px 16px", borderRadius: 20, fontWeight: 600, border: "none" }}>ACTIVE</Tag>
              <Button
                icon={<Edit2 size={16} />}
                onClick={() => router.push(`/onboarding/create?id=${id}`)}
                style={{ borderRadius: 10, height: 40, fontWeight: 600 }}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          <Tabs
            defaultActiveKey="1"
            className="premium-tabs"
            items={[
              {
                key: '1',
                label: <Space><User size={16} /><span>Personal Details</span></Space>,
                children: <PersonalDetailsTab data={data} />,
              },
              {
                key: '2',
                label: <Space><Briefcase size={16} /><span>Employment Details</span></Space>,
                children: <EmploymentTab data={data} />,
              },
              {
                key: '3',
                label: <Space><CreditCard size={16} /><span>Bank and Payroll</span></Space>,
                children: <BankPayrollTab data={data} />,
              },
              {
                key: '4',
                label: <Space><History size={16} /><span>History</span></Space>,
                children: <div style={{ marginTop: 16 }}><EmployeeHistoryView data={data.history || data.previousCompanyDetails || []} /></div>,
              },
              {
                key: '5',
                label: <Space><Laptop size={16} /><span>Assets</span></Space>,
                children: <AssetsTab data={data} />,
              },
            ]}
          />
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .premium-tabs .ant-tabs-nav { margin-bottom: 8px !important; }
          .premium-tabs .ant-tabs-tab { padding: 14px 0 !important; margin: 0 32px 0 0 !important; }
          .premium-tabs .ant-tabs-tab-btn { font-size: 15px !important; font-weight: 600 !important; color: #64748b !important; }
          .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #2563eb !important; }
          .premium-tabs .ant-tabs-ink-bar { height: 3px !important; background: #2563eb !important; border-radius: 3px 3px 0 0; }
          .ant-card-head-title { font-size: 14px !important; font-weight: 700 !important; color: #1e293b !important; text-transform: uppercase !important; letter-spacing: 0.025em !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
