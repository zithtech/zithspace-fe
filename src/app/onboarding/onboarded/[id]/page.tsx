"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

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
  message,
  Image
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
  ShieldCheck,
  Clock,
  Zap,
  Edit2,
  Lock,
  Users,
  FileText,
} from 'lucide-react';
import dayjs from "dayjs";

// Layout & Components
import OnboardingGuard from '@/components/onboarding/OnboardingGuard';
import { EmployeeOnboardingService } from "@/services/onboardingService";
import EmployeeHistoryView from "../EmployeeHistoryViews";
import OrgHistoryTimeline from "@/components/new-profile/OrgHistoryTimeline";
import DocumentsTab from '@/components/new-profile/documentsTab';

const { Title, Text } = Typography;

// ── Module palette: blue / green / red / grey only ──────────────────────────
const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  grey: '#94A3B8'
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)'
} as const;

/* ---------------- SHARED COMPONENTS ---------------- */

const SectionTitle = ({ icon, color, tint, text }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: tint,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 15 })}
    </span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-slate-900, #0f172a)",
        textTransform: "uppercase",
        letterSpacing: "0.04em"
      }}
    >
      {text}
    </span>
  </div>
);

const RowItem = ({ label, value, icon, color = PALETTE.blue, tint = TINT.blue }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "6px",
      padding: "8px 10px",
      background: "var(--bg-secondary, #ffffff)",
      borderRadius: "8px",
      border: "1px solid var(--border-slate-200, #e2e8f0)"
    }}
  >
    {icon && (
      <div
        style={{
          marginRight: "10px",
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          background: tint,
          borderRadius: "6px",
          flexShrink: 0
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 15 })}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--text-slate-400, #94a3b8)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "1px"
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12.5px",
          color: "var(--text-slate-900, #0f172a)",
          fontWeight: 500
        }}
      >
        {value || "-"}
      </div>
    </div>
  </div>
);

const cardStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--border-slate-200, #e2e8f0)"
};
const cardBody = { body: { padding: 14 } };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: "12px 0" }}>
      {/* Basic Info */}
      <Card variant="borderless" styles={cardBody} style={cardStyle}>
        <SectionTitle icon={<User />} color={PALETTE.blue} tint={TINT.blue} text="Basic Information" />
        <Row gutter={[12, 0]}>
          <Col span={8}><RowItem label="First Name" value={personal.firstName} icon={<User />} /></Col>
          <Col span={8}><RowItem label="Last Name" value={personal.lastName} icon={<User />} /></Col>
          <Col span={8}><RowItem label="Gender" value={personal.gender} icon={<Zap />} color={PALETTE.blue} tint={TINT.blue} /></Col>
          <Col span={8}><RowItem label="Date of Birth" value={personal.dob ? dayjs(personal.dob).format("DD MMM YYYY") : null} icon={<Calendar />} color={PALETTE.green} tint={TINT.green} /></Col>
          <Col span={8}><RowItem label="Blood Group" value={personal.bloodGroup} icon={<ShieldCheck />} color={PALETTE.red} tint={TINT.red} /></Col>
          <Col span={8}><RowItem label="Mobile Number" value={personal.mobile || personal.phone} icon={<Phone />} color={PALETTE.blue} tint={TINT.blue} /></Col>
          <Col span={12}><RowItem label="Personal Email" value={personal.personalEmail || personal.email} icon={<Mail />} color={PALETTE.grey} tint={TINT.grey} /></Col>
          <Col span={12}><RowItem label="Work Email" value={personal.workEmail} icon={<Mail />} color={PALETTE.blue} tint={TINT.blue} /></Col>
        </Row>
      </Card>

      {/* Identity & Relationship */}
      <Row gutter={14}>
        <Col span={12}>
          <Card variant="borderless" styles={cardBody} style={{ ...cardStyle, height: "100%" }}>
            <SectionTitle icon={<IdCard />} color={PALETTE.blue} tint={TINT.blue} text="Identity Info" />
            <RowItem label="PAN Number" value={personal.pan} icon={<IdCard />} color={PALETTE.blue} tint={TINT.blue} />
            <RowItem label="Aadhaar Number" value={personal.aadhaar} icon={<IdCard />} color={PALETTE.blue} tint={TINT.blue} />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless" styles={cardBody} style={{ ...cardStyle, height: "100%" }}>
            <SectionTitle icon={<Users />} color={PALETTE.green} tint={TINT.green} text="Relationship / Emergency Contact" />
            <RowItem label="Relationship" value={data.relationship} icon={<Users />} color={PALETTE.green} tint={TINT.green} />
            <RowItem label="Name" value={data.relationName} icon={<User />} color={PALETTE.green} tint={TINT.green} />
            <RowItem label="Mobile" value={data.relationMobile} icon={<Phone />} color={PALETTE.green} tint={TINT.green} />
          </Card>
        </Col>
      </Row>

      {/* Address */}
      <Card variant="borderless" styles={cardBody} style={cardStyle}>
        <SectionTitle icon={<MapPin />} color={PALETTE.blue} tint={TINT.blue} text="Address Information" />
        <Row gutter={[14, 14]}>
          <Col span={12}>
            <div style={{ padding: 12, background: "var(--bg-slate-50, #f8fafc)", borderRadius: 8, border: "1px solid var(--border-slate-200, #e2e8f0)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: PALETTE.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Current Address</div>
              <Text style={{ fontSize: 12.5, color: "var(--text-slate-600, #475569)", lineHeight: 1.6 }}>{formatAddress(currentAddr)}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: 12, background: "var(--bg-slate-50, #f8fafc)", borderRadius: 8, border: "1px solid var(--border-slate-200, #e2e8f0)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: PALETTE.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Permanent Address</div>
              <Text style={{ fontSize: 12.5, color: "var(--text-slate-600, #475569)", lineHeight: 1.6 }}>{formatAddress(permanentAddr)}</Text>
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
    <Card variant="borderless" styles={cardBody} style={{ ...cardStyle, marginTop: 12 }}>
      <SectionTitle icon={<Briefcase />} color={PALETTE.blue} tint={TINT.blue} text="Employment Details" />
      <Row gutter={[12, 0]}>
        <Col span={8}><RowItem label="Department" value={employment.department} icon={<Building2 />} /></Col>
        <Col span={8}><RowItem label="Team" value={employment.team} icon={<Users />} /></Col>
        <Col span={8}><RowItem label="Position" value={employment.position?.title || employment.designation} icon={<Briefcase />} color={PALETTE.blue} tint={TINT.blue} /></Col>
        <Col span={8}><RowItem label="Employee Type" value={employment.employeeType} icon={<Zap />} color={PALETTE.green} tint={TINT.green} /></Col>
        <Col span={8}><RowItem label="Work Location" value={employment.workLocation} icon={<MapPin />} color={PALETTE.blue} tint={TINT.blue} /></Col>
        <Col span={8}><RowItem label="Joining Date" value={employment.joiningDate ? dayjs(employment.joiningDate).format("DD MMM YYYY") : null} icon={<Calendar />} color={PALETTE.green} tint={TINT.green} /></Col>
        <Col span={8}><RowItem label="Notice Period" value={employment.noticePeriod} icon={<Clock />} color={PALETTE.red} tint={TINT.red} /></Col>
        <Col span={8}><RowItem label="Work Type" value={employment.workType} icon={<Laptop />} color={PALETTE.blue} tint={TINT.blue} /></Col>
        <Col span={8}><RowItem label="Reporting Manager" value={employment.reportingManager} icon={<User />} color={PALETTE.green} tint={TINT.green} /></Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />

      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-slate-900, #0f172a)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Assigned Projects</span>
      </div>
      <Space wrap size={8}>
        {employment.projects?.length > 0 ? (
          employment.projects.map((p: any, i: number) => (
            <Tag key={i} style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 500, fontSize: 12, border: "none", background: TINT.blue, color: PALETTE.blue }}>{p}</Tag>
          ))
        ) : (
          <Text type="secondary" style={{ fontSize: 12.5 }}>No specific projects assigned yet.</Text>
        )}
      </Space>
    </Card>
  );
};

const BankPayrollTab = ({ data }: any) => {
  const bank = data?.bankAndPayroll || {};
  return (
    <Card variant="borderless" styles={cardBody} style={{ ...cardStyle, marginTop: 12 }}>
      <SectionTitle icon={<CreditCard />} color={PALETTE.blue} tint={TINT.blue} text="Bank & Payroll" />
      <Row gutter={[12, 0]}>
        <Col span={12}><RowItem label="Bank Name" value={bank.bankName} icon={<Building2 />} /></Col>
        <Col span={12}><RowItem label="Account Holder Name" value={bank.accountHolderName} icon={<User />} color={PALETTE.green} tint={TINT.green} /></Col>
        <Col span={12}><RowItem label="Account Number" value={bank.accountNumber} icon={<CreditCard />} color={PALETTE.blue} tint={TINT.blue} /></Col>
        <Col span={12}><RowItem label="IFSC Code" value={bank.ifscCode} icon={<Lock />} color={PALETTE.grey} tint={TINT.grey} /></Col>
        <Col span={8}><RowItem label="PF Number" value={bank.pfNumber} icon={<ShieldCheck />} color={PALETTE.blue} tint={TINT.blue} /></Col>
        <Col span={8}><RowItem label="ESI Number" value={bank.esiNumber} icon={<ShieldCheck />} color={PALETTE.red} tint={TINT.red} /></Col>
        <Col span={8}><RowItem label="UAN Number" value={bank.uanNumber} icon={<IdCard />} color={PALETTE.blue} tint={TINT.blue} /></Col>
      </Row>
    </Card>
  );
};

const AssetsTab = ({ data }: any) => {
  const assets = data?.assets || [];
  if (assets.length === 0) {
    return (
      <div style={{ padding: '44px 0', textAlign: 'center', background: 'var(--bg-slate-50, #f8fafc)', borderRadius: 10, border: '1px dashed var(--border-slate-200, #e2e8f0)', marginTop: 16 }}>
        <Laptop size={40} color={PALETTE.grey} style={{ marginBottom: 12 }} />
        <div style={{ color: 'var(--text-slate-500, #64748b)', fontSize: 13 }}>No assets have been assigned to this employee.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginTop: 12 }}>
      {assets.map((asset: any, i: number) => (
        <Card key={i} styles={{ body: { padding: 14 } }} style={cardStyle}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 64, height: 64, background: 'var(--bg-slate-50, #f8fafc)', borderRadius: 8, overflow: 'hidden', border: "1px solid var(--border-slate-200, #e2e8f0)", flexShrink: 0 }}>
              {asset.image ? <Image alt="asset" src={asset.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.grey }}><Laptop size={26} /></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-slate-900, #0f172a)', marginBottom: 2 }}>{asset.item}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-slate-500, #64748b)' }}>{asset.brand} - {asset.model}</div>
              <div style={{ marginTop: 6, fontSize: 10.5, color: PALETTE.grey, textTransform: 'uppercase', letterSpacing: 0.4 }}>S/N: {asset.modelNumber}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

import { PromotionModal } from "@/components/new-profile/PromotionModal";

/* ---------------- MAIN PAGE COMPONENT ---------------- */

export default function OnboardedViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [isPromotionModalOpen, setPromotionModalOpen] = useState(false);

  const getEditTabName = (key: string) => {
    switch (key) {
      case "1": return "personal";
      case "2": return "employment";
      case "3": return "bank";
      case "4": return "history";
      case "5": return "assets";
      case "6": return "documents";
      default: return "personal";
    }
  };

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
          aadhaar: personal.aadhaar || ""
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
          projects: employment.projects || []
        },
        bankAndPayroll: {
          bankName: bank.bankName || "",
          accountNumber: bank.accountNumber || "",
          ifscCode: bank.ifscCode || "",
          pfNumber: bank.pfNumber || "",
          esiNumber: bank.esiNumber || "",
          uanNumber: bank.uanNumber || "",
          accountHolderName: bank.accountHolderName || ""
        },
        history: employeeData.history || employeeData.previousCompanyDetails || [],
        assets: employeeData.assets || [],
        documents: employeeData.documents || [],
        // Relationship / Emergency details
        relationship: employeeData.relationship || personal.relationship || "",
        relationName: employeeData.relationName || personal.relationName || "",
        relationMobile: employeeData.relationMobile || personal.relationMobile || ""
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

  // Extract all documents from history and other sections to show them in the Documents tab as well
  const allDocuments = React.useMemo(() => {
    const docs = [...(data?.documents || [])];

    if (data?.history && Array.isArray(data.history)) {
      data.history.forEach((exp: any) => {
        const companyName = exp.companyName || 'Previous Company';

        const addDoc = (docItem: any, docType: string) => {
          if (docItem?.url) {
            docs.push({
              documentName: docItem.name || `${docType} - ${companyName}`,
              documentType: docType,
              documentUrl: docItem.url,
              status: 'uploaded',
              uploadedAt: exp.doj || new Date().toISOString(),
            });
          }
        };

        addDoc(exp.experienceLetter, 'Experience Letter');
        addDoc(exp.offerLetter, 'Offer Letter');
        addDoc(exp.serviceLetter, 'Service Letter');
        addDoc(exp.relievingLetter, 'Relieving Letter');

        if (Array.isArray(exp.form16)) {
          exp.form16.forEach((f: any, idx: number) => addDoc(f, `Form 16 (${idx + 1}) - ${companyName}`));
        }
        if (Array.isArray(exp.payslips)) {
          exp.payslips.forEach((p: any, idx: number) => addDoc(p, `Payslip (${idx + 1}) - ${companyName}`));
        }
      });
    }

    // Sort by uploadedAt descending if possible
    docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return docs;
  }, [data]);

  if (loading) {
    return (
      <OnboardingGuard itemKey="employees">
        <div style={{ height: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <LoadingSpinner message="Loading Employee Information..." size="large" fullScreen={false} />
        </div>
      </OnboardingGuard>
    );
  }

  if (!data) return null;

  const personal = data.personalDetails || data.personal || data;
  const fullName = `${personal.firstName || ""} ${personal.lastName || ""}`.trim();
  const initials = `${(personal.firstName || "").charAt(0)}${(personal.lastName || "").charAt(0)}`.toUpperCase() || "?";

  return (
    <OnboardingGuard itemKey="employees">
      <div style={{ padding: "16px 20px", background: "var(--bg-pure-white, #ffffff)", minHeight: "100vh" }}>
        {/* Slim Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            paddingBottom: 14,
            marginBottom: 14,
            borderBottom: "1px solid var(--border-slate-200, #e2e8f0)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/onboarding/onboarded')}
              style={{ borderRadius: 8, height: 34, width: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            />
            {/* Avatar / initials chip */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: TINT.blue,
                color: PALETTE.blue,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
                flexShrink: 0,
                letterSpacing: "0.02em"
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "var(--text-slate-900, #0f172a)", lineHeight: 1.2 }}>
                  {fullName || "—"}
                </Title>
                <Tag
                  style={{
                    margin: 0,
                    padding: "1px 8px",
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.04em",
                    border: "none",
                    background: TINT.green,
                    color: PALETTE.green
                  }}
                >
                  ACTIVE
                </Tag>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, fontSize: 12, color: "var(--text-slate-500, #64748b)" }}>
                <span>CODE: {data.employee_code || "N/A"}</span>
                <span style={{ color: "var(--border-slate-200, #cbd5e1)" }}>•</span>
                <span>DEPT: {data.employment?.department || "General"}</span>
              </div>
            </div>
          </div>
          <Space size={8}>
            <Button
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>}
              onClick={() => setPromotionModalOpen(true)}
              type="primary"
              style={{ borderRadius: 8, height: 34, fontWeight: 600, fontSize: 13, flexShrink: 0, backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Promotion
            </Button>
            <Button
              icon={<Edit2 size={14} />}
              onClick={() => router.push(`/onboarding/create?id=${id}&tab=${getEditTabName(activeTab)}`)}
              style={{ borderRadius: 8, height: 34, fontWeight: 600, fontSize: 13, flexShrink: 0 }}
            >
              Edit Profile
            </Button>
          </Space>
        </div>

        <PromotionModal
          visible={isPromotionModalOpen}
          onCancel={() => setPromotionModalOpen(false)}
          onSuccess={() => {
            window.location.reload();
          }}
          employeeId={id as string}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="premium-tabs"
          items={[
            {
              key: '1',
              label: <Space size={6}><User size={15} /><span>Personal Details</span></Space>,
              children: <PersonalDetailsTab data={data} />
            },
            {
              key: '2',
              label: <Space size={6}><Briefcase size={15} /><span>Employment Details</span></Space>,
              children: <EmploymentTab data={data} />
            },
            {
              key: '3',
              label: <Space size={6}><CreditCard size={15} /><span>Bank and Payroll</span></Space>,
              children: <BankPayrollTab data={data} />
            },
            {
              key: '4',
              label: <Space size={6}><History size={15} /><span>History</span></Space>,
              children: <div style={{ marginTop: 12 }}><EmployeeHistoryView data={data.history || data.previousCompanyDetails || []} /></div>
            },
            {
              key: '5',
              label: <Space size={6}><Laptop size={15} /><span>Assets</span></Space>,
              children: <AssetsTab data={data} />,
            },
            {
              key: '6',
              label: <Space size={6}><Clock size={15} /><span>Org History</span></Space>,
              children: <OrgHistoryTimeline employeeId={id as string} />,
            },
            {
              key: '7',
              label: <Space size={6}><FileText size={15} /><span>Documents</span></Space>,
              children: <DocumentsTab documents={allDocuments} />,
            },
          ]}
        />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .premium-tabs .ant-tabs-nav { margin-bottom: 4px !important; }
          .premium-tabs .ant-tabs-tab { padding: 9px 0 !important; margin: 0 24px 0 0 !important; }
          .premium-tabs .ant-tabs-tab-btn { font-size: 13px !important; font-weight: 600 !important; color: var(--text-slate-500, #64748b) !important; }
          .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${PALETTE.blue} !important; }
          .premium-tabs .ant-tabs-ink-bar { height: 2px !important; background: ${PALETTE.blue} !important; border-radius: 2px 2px 0 0; }
        `}} />
    </OnboardingGuard>
  );
}
