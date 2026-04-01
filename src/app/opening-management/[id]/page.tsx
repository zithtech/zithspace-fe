'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  Typography,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Tabs,
  Divider,
  Spin,
  notification,
} from 'antd';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Edit,
  Share2,
  FileText,
  Building2,
  Info,
  Timer,
  CheckCircle2,
  History,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

// Components
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const { Title, Text, Paragraph } = Typography;

// Helper Component for consistent row items
const RowItem = ({ label, value, icon, color = "#3b82f6" }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
      padding: "6px 10px",
      background: "#ffffff",
      borderRadius: "8px",
      border: "1px solid #f1f5f9",
      transition: "all 0.2s ease",
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
          background: `${color}10`,
          borderRadius: "6px",
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 14 })}
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          marginBottom: "0px",
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

const PlaceholderTab = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div style={{ padding: '60px 0', textAlign: 'center', background: '#fbfcfd', borderRadius: 16, border: '1px dashed #e2e8f0', margin: '24px 0' }}>
    <Space direction="vertical" align="center" size={20}>
      <div style={{ color: '#3b82f6', background: '#fff', padding: 20, borderRadius: '50%', boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <div>
        <Title level={4} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>{title}</Title>
        <Text style={{ color: '#64748b', fontSize: 15 }}>This section is currently being prepared for the next release.</Text>
      </div>
    </Space>
  </div>
);

export default function OpeningDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<any>(null);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setOpening({
        id: id || '1',
        jobId: 'JOB-2024-001',
        title: 'Senior Frontend Engineer',
        role: 'Position',
        department: 'Engineering',
        experience: { min: 5, max: 8 },
        skills: ['React', 'Next.js', 'TypeScript', 'Ant Design', 'State Management'],
        secondarySkills: ['GraphQL', 'Tailwind CSS', 'Unit Testing'],
        location: 'Bangalore, India',
        workType: 'Hybrid',
        employmentType: 'Full-time',
        openingType: 'External',
        numberOfOpenings: 3,
        salary: { min: 25, max: 45, currency: 'LPA' },
        priority: 'High',
        status: 'Open',
        targetJoinDate: '2024-05-01',
        tags: ['Urgent', 'Tech', 'Remote-Friendly'],
        createdAt: '2024-03-25',
        description: "We are looking for a Senior Frontend Engineer who is passionate about building scalable, high-performance web applications. You will be responsible for architecting and implementing the frontend of our flagship product using React and Next.js.\n\nKey Responsibilities:\n- Design and develop high-quality UI components\n- Optimize application for maximum speed and scalability\n- Collaborate with backend engineers to integrate APIs\n- Mentor junior developers and conduct code reviews",
        hiringManager: 'John Doe (Engineering Lead)',
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Spin size="large" tip="Loading Opening Details..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const overviewTab = (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 🚀 Opening Context & Status */}
      <div style={{
        background: "white",
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: -16,
          right: -16,
          width: 80,
          height: 80,
          background: "#3b82f608",
          borderRadius: "50%"
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "#3b82f6", padding: 6, borderRadius: 8, color: "white" }}>
            <Briefcase size={18} />
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", display: "block" }}>Opening Overview</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>Core details of the job requisition</span>
          </div>
        </div>

        <Row gutter={[12, 0]}>
          <Col span={8}><RowItem label="Job ID" value={opening.jobId} icon={<FileText />} /></Col>
          <Col span={8}><RowItem label="Role category" value={opening.role} icon={<Info />} color="#8b5cf6" /></Col>
          <Col span={8}><RowItem label="Department" value={opening.department} icon={<Building2 />} color="#8b5cf6" /></Col>
          <Col span={8}><RowItem label="Location" value={opening.location} icon={<MapPin />} /></Col>
          <Col span={8}><RowItem label="Work Arrangement" value={opening.workType} icon={<Timer />} color="#10b981" /></Col>
          <Col span={8}>
            <RowItem
              label="Hiring Manager"
              value={opening.hiringManager}
              icon={<Users />}
              color="#f59e0b"
            />
          </Col>
        </Row>
      </div>

      {/* 📅 Requirements & Logistics */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <div style={{ padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Calendar size={16} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Key Requirements</span>
          </div>
          <Row gutter={[12, 0]}>
            <Col span={12}><RowItem label="Experience Range" value={`${opening.experience.min} - ${opening.experience.max} Years`} icon={<Clock />} /></Col>
            <Col span={12}><RowItem label="Total Openings" value={`${opening.numberOfOpenings} Vacancies`} icon={<Users />} color="#10b981" /></Col>
            <Col span={24}>
              <div style={{ padding: '6px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Primary Skills</Text>
                <Space wrap>
                  {opening.skills.map((skill: string) => (
                    <Tag key={skill} color="blue" style={{ borderRadius: 6, margin: 0 }}>{skill}</Tag>
                  ))}
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <DollarSign size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Budget & Timeline</span>
          </div>
          <RowItem label="Salary Bracket" value={`${opening.salary.min} - ${opening.salary.max} ${opening.salary.currency}`} icon={<DollarSign />} color="#f59e0b" />
          <RowItem label="Target Join Date" value={dayjs(opening.targetJoinDate).format('DD MMM YYYY')} icon={<Calendar />} color="#3b82f6" />
          <RowItem label="Priority" value={<Tag color={opening.priority === 'High' ? 'red' : 'orange'} style={{ borderRadius: 6, margin: 0 }}>{opening.priority.toUpperCase()}</Tag>} icon={<Timer />} color="#ef4444" />
        </div>
      </div>

      {/* 📝 Detailed Description */}
      <div style={{ padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ background: "#6366f115", padding: 6, borderRadius: 8, color: "#6366f1" }}>
            <FileText size={18} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Detailed Job Description</span>
        </div>
        <div style={{
          padding: 16,
          background: "#f8fafc",
          borderRadius: 12,
          border: "1px solid #f1f5f9",
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.6,
          whiteSpace: 'pre-line'
        }}>
          {opening.description}
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: '16px 24px', background: '#fff', minHeight: '100vh' }}>
          {/* Header */}
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Space size={16} align="center">
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={() => router.push('/opening-management')}
                style={{ borderRadius: 10, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{opening.title}</Title>
                  <Tag color="success" style={{ borderRadius: 20, padding: '2px 12px', fontWeight: 600, border: 0 }}>{opening.status.toUpperCase()}</Tag>
                </div>
                <Space split={<Divider type="vertical" />}>
                  <Text style={{ color: "#64748b" }}>ID: {opening.jobId}</Text>
                  <Text style={{ color: "#64748b" }}>{opening.department}</Text>
                  <Text style={{ color: "#64748b" }}>{opening.employmentType}</Text>
                </Space>
              </div>
            </Space>
            <Space>
              <Button icon={<Share2 size={18} />} style={{ borderRadius: 8 }}>Share</Button>
              <Button type="primary" icon={<Edit size={18} />} style={{ borderRadius: 8, background: '#2563eb', border: 'none' }}>Edit Opening</Button>
            </Space>
          </div>

          <Tabs
            defaultActiveKey="overview"
            className="modern-tabs"
            items={[
              { key: 'overview', label: 'Overview', children: overviewTab },
              { key: 'applicants', label: 'Applicants', children: <PlaceholderTab title="Applicants" icon={Users} /> },
              { key: 'activity', label: 'Activity Log', children: <PlaceholderTab title="Activity Log" icon={History} /> },
            ]}
          />
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            .modern-tabs .ant-tabs-nav { margin-bottom: 0 !important; }
            .modern-tabs .ant-tabs-tab { padding: 12px 0 !important; margin: 0 32px 0 0 !important; }
            .modern-tabs .ant-tabs-tab-btn { font-size: 15px !important; font-weight: 600 !important; color: #64748b !important; }
            .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #2563eb !important; }
            .modern-tabs .ant-tabs-ink-bar { height: 3px !important; background: #2563eb !important; }
          `
        }} />
      </MainLayout>
    </ProtectedRoute>
  );
}
