"use client";

import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Button,
  Table,
  Space,
  Input,
  Form,
  Drawer,
  Tabs,
  Popconfirm,
  notification,
  Select,
  Switch,
  Card,
  Row,
  Col,
  Divider,
  Tag
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Award,
  Briefcase,
  Plus,
  Search,
  Settings2,
  Trash2,
  Edit3,
  ChevronRight,
  Zap,
} from "lucide-react";

import { useSkills } from "@/hooks/useSkills";
import { useAuth } from "@/context/AuthContext";
import SkillsAutocomplete from "@/components/SkillsAutocomplete";
import { searchSkills, SkillOption } from "@/data/skillsData";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const { Title, Text } = Typography;

export default function SkillsPage() {
  const { 
    skills,
    experience,
    loading,
    fetchSkills,
    fetchExperience,
    createSkill,
    updateSkill,
    deleteSkill,
    createExperience,
    updateExperience,
    deleteExperience,
  } = useSkills();

  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("1");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    fetchSkills();
    fetchExperience();
  }, []);

  // ================= DRAWER =================

  const showDrawer = () => {
    setEditingId(null);
    form.resetFields();
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    
    // Format dates for HTML date inputs (YYYY-MM-DD) using local timezone
    const formattedRecord = { ...record };
    if (record.start_date) {
      const date = new Date(record.start_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedRecord.start_date = `${year}-${month}-${day}`;
    }
    if (record.end_date) {
      const date = new Date(record.end_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedRecord.end_date = `${year}-${month}-${day}`;
    }
    
    form.setFieldsValue(formattedRecord);
    setIsDrawerOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    setIsSaving(true);
    try {
      if (activeTab === "1") {
        if (editingId) {
          await updateSkill(editingId, values);
        } else {
          await createSkill(values);
        }
        fetchSkills();
      } else {
        if (editingId) {
          await updateExperience(editingId, values);
        } else {
          await createExperience(values);
        }
        fetchExperience();
      }

      api.success({ message: "Saved successfully", placement: "topRight" });
      setIsDrawerOpen(false);
      form.resetFields();
    } catch (err: any) {
      api.error({ message: err.message, placement: "topRight" });
    } finally {
      setIsSaving(false);
    }
  };

  // ================= SKILL TABLE =================

  const skillColumns = [
    { 
      title: "Name", 
      dataIndex: "name",
      width: "25%",
      render: (skillName: string) => {
        const matchedSkills = searchSkills(skillName);
        const skill = matchedSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        
        return (
          <Space size={12}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--bg-blue-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6
            }}>
              {skill ? (
                <img
                  src={skill.logo}
                  alt={skill.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <Award size={16} color="var(--premium-blue)" />
              )}
            </div>
            <Text strong style={{ color: "var(--text-slate-900)", fontSize: 14 }}>{skillName}</Text>
          </Space>
        );
      }
    },
    { 
      title: "Category", 
      dataIndex: "category",
      render: (text: string) => (
        <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
          {text || "General"}
        </Tag>
      )
    },
    { 
      title: "Description", 
      dataIndex: "description",
      ellipsis: true,
      width: 250,
      render: (text: string) => (
        <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{text || "-"}</Text>
      )
    },
    { 
      title: "Level", 
      dataIndex: "proficiency_level",
      render: (level: string) => (
        <Tag style={{ borderRadius: 20, textTransform: "capitalize", fontWeight: 600, border: 0 }} color="processing">
          {level}
        </Tag>
      )
    },
    { 
      title: "Years", 
      dataIndex: "years_of_experience",
      render: (val: number) => <Text style={{ fontWeight: 600 }}>{val ? `${val} yrs` : "-"}</Text>
    },
    {
      title: "Active",
      dataIndex: "is_active",
      render: (val: boolean) => <Switch checked={val} disabled />,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<Settings2 size={18} style={{ color: "var(--text-slate-400)" }} />}
            onClick={() => handleEdit(record)}
            className="action-btn"
          />
          <Popconfirm
            title="Delete this skill?"
            onConfirm={() => deleteSkill(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              type="text"
              icon={<Trash2 size={18} />}
              className="action-btn-danger"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ================= EXPERIENCE TABLE =================

  const expColumns = [
    { 
      title: "Job Title", 
      dataIndex: "job_title",
      render: (text: string) => <Text strong style={{ color: "var(--text-slate-900)" }}>{text}</Text>
    },
    { 
      title: "Company", 
      dataIndex: "company_name",
      render: (text: string) => (
        <Space size={8}>
          <div style={{ padding: 4, background: "var(--bg-blue-50)", borderRadius: 4, display: "flex" }}>
            <Briefcase size={14} color="var(--premium-blue)" />
          </div>
          <Text style={{ color: "var(--text-slate-600)" }}>{text}</Text>
        </Space>
      )
    },
    { title: "Location", dataIndex: "location", render: (text: string) => text || "-" },
    { 
      title: "Type", 
      dataIndex: "employment_type",
      render: (text: string) => (
        <Tag style={{ borderRadius: 6, textTransform: "capitalize" }}>{text}</Tag>
      )
    },
    { 
      title: "Timeline", 
      key: "timeline",
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13, fontWeight: 500 }}>
            {record.start_date ? new Date(record.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "-"}
            {" - "}
            {record.current_job ? "Present" : (record.end_date ? new Date(record.end_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "-")}
          </Text>
          {record.current_job && <Tag color="success" style={{ fontSize: 10, borderRadius: 4, padding: "0 4px", height: 16, lineHeight: "14px", margin: 0 }}>ACTIVE</Tag>}
        </Space>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<Settings2 size={18} style={{ color: "var(--text-slate-400)" }} />}
            onClick={() => handleEdit(record)}
            className="action-btn"
          />
          <Popconfirm
            title="Delete this experience?"
            onConfirm={() => deleteExperience(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              type="text"
              icon={<Trash2 size={18} />}
              className="action-btn-danger"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  console.log('Skills data in component:', skills);
  console.log('Experience data in component:', experience);

  const tabItems = [
    {
      key: "1",
      label: "Skills",
      children: (
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", overflow: "hidden" }}
        >
          <Table 
            rowKey="id" 
            columns={skillColumns} 
            dataSource={skills?.filter(s => s.name.toLowerCase().includes(searchText.toLowerCase()))} 
            loading={loading}
            size="middle"
            pagination={{ pageSize: 10, position: ["bottomRight"] }}
          />
        </Card>
      ),
    },
    {
      key: "2",
      label: "Experience",
      children: (
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", overflow: "hidden" }}
        >
          <Table 
            rowKey="id" 
            columns={expColumns} 
            dataSource={experience?.filter(e => e.job_title.toLowerCase().includes(searchText.toLowerCase()) || e.company_name.toLowerCase().includes(searchText.toLowerCase()))} 
            loading={loading}
            size="middle"
            pagination={{ pageSize: 10, position: ["bottomRight"] }}
          />
        </Card>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}

        <div className="skills-page-wrapper" style={{
          margin: "0 -24px",
          padding: "12px 24px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)"
        }}>
          
          {/* Header Section */}
          <div style={{ marginBottom: 0, paddingBottom: 3.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: "#6366f1"
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <Title level={4} className="premium-title" style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)", fontSize: 18, letterSpacing: "-0.01em" }}>Skills & Experience</Title>
                  <Text type="secondary" className="premium-text-sec" style={{ fontSize: '11px', display: 'block', color: "var(--text-secondary)" }}>
                    Manage your professional portfolio and technical competencies.
                  </Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input
                placeholder="Search skills..."
                prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
                className="premium-input-search"
                style={{
                  width: 220,
                  borderRadius: 8,
                  height: 32,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: 13,
                  fontWeight: 500
                }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                size="small"
                icon={<Plus size={14} />}
                style={{
                  borderRadius: 6,
                  height: 32,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  background: "#6366f1",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                  padding: "0 12px",
                  fontSize: 13
                }}
                onClick={showDrawer}
              >
                {activeTab === "1" ? "Add Skill" : "Add Experience"}
              </Button>
            </div>
          </div>

          <Divider className="hub-divider-premium" style={{ margin: '0 -24px 16px -24px', width: 'calc(100% + 48px)', borderTop: '1px solid #e2e8f0' }} />

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="premium-tabs"
          />

        {/* ================= DRAWER ================= */}

        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={
            <Space size={12}>
              <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)", display: "flex" }}>
                <Settings2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  {editingId ? "Edit Item" : "Create New Item"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>
                  {activeTab === "1" ? "Configure your technical skill levels" : "Add details about your professional role"}
                </div>
              </div>
            </Space>
          }
          width={480}
          closable={false}
          headerStyle={{ background: "var(--bg-pure-white)", borderBottom: "1px solid var(--border-slate-100)" }}
          bodyStyle={{ background: "var(--bg-pure-white)" }}
          footerStyle={{ background: "var(--bg-pure-white)", borderTop: "1px solid var(--border-slate-100)" }}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
              <Button onClick={() => setIsDrawerOpen(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
              <Button
                type="primary"
                loading={isSaving}
                onClick={handleOk}
                style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
              >
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          }
          className="config-drawer"
        >
          <Form form={form} layout="vertical" requiredMark={false}>

            {activeTab === "1" ? (
              <>
                <Form.Item name="name" label="Skill Name" rules={[{ required: true }]}>
                  <SkillsAutocomplete />
                </Form.Item>

                <Form.Item name="category" label="Category">
                  <Input />
                </Form.Item>

                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} placeholder="Describe your experience with this skill..." />
                </Form.Item>

                <Form.Item name="proficiency_level" label="Level">
                  <Select options={[
                    { value: "beginner" },
                    { value: "intermediate" },
                    { value: "advanced" },
                    { value: "expert" },
                  ]} />
                </Form.Item>

                <Form.Item name="years_of_experience" label="Years">
                  <Input type="number" />
                </Form.Item>

                <Form.Item name="certifications" label="Certifications">
                  <Select
                    mode="tags"
                    placeholder="Add certifications (press Enter to add)"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                  />
                </Form.Item>

                <Form.Item name="is_active" label="Active" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="job_title" label="Job Title" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="company_name" label="Company" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="location" label="Location">
                  <Input placeholder="City, State or Remote" />
                </Form.Item>

                <Form.Item name="employment_type" label="Type">
                  <Select options={[
                    { value: "full-time" },
                    { value: "part-time" },
                    { value: "contract" },
                    { value: "freelance" },
                    { value: "internship" },
                  ]} />
                </Form.Item>

                <Form.Item name="current_job" label="Current Job" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} placeholder="Describe your role and responsibilities..." />
                </Form.Item>

                <Form.Item name="start_date" label="Start Date">
                  <Input type="date" />
                </Form.Item>

                <Form.Item name="end_date" label="End Date">
                  <Input type="date" />
                </Form.Item>

                <Form.Item name="responsibilities" label="Responsibilities">
                  <Select
                    mode="tags"
                    placeholder="Add responsibilities (press Enter to add)"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                  />
                </Form.Item>

                <Form.Item name="achievements" label="Achievements">
                  <Select
                    mode="tags"
                    placeholder="Add achievements (press Enter to add)"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                  />
                </Form.Item>

                <Form.Item name="skills_used" label="Skills Used">
                  <Select
                    mode="tags"
                    placeholder="Add skills used (press Enter to add)"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                  />
                </Form.Item>
              </>
            )}

          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
          .action-btn:hover {
            background: var(--bg-slate-50) !important;
            color: var(--premium-blue) !important;
          }
          .action-btn-danger:hover {
            background: #fff1f2 !important;
          }
          .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .ant-table-row:hover > td {
            background: var(--bg-slate-50) !important;
          }
          .ant-input:focus, .ant-input-focused {
            border-color: var(--premium-blue) !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
          .config-drawer .ant-drawer-header {
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding: 24px !important;
          }
          .config-drawer .ant-drawer-footer {
            border-top: 1px solid var(--border-slate-100) !important;
            padding: 16px 24px !important;
          }
          .ant-pagination-item a { color: var(--text-slate-500) !important; }
          .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
          
          .premium-tabs .ant-tabs-nav::before {
            border-bottom: 1px solid var(--border-slate-100);
          }
          .premium-tabs .ant-tabs-tab {
            padding: 12px 16px;
            font-weight: 500;
            color: var(--text-slate-500);
          }
          .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: var(--premium-blue) !important;
            font-weight: 700;
          }
          .premium-tabs .ant-tabs-ink-bar {
            background: var(--premium-blue) !important;
            height: 3px !important;
            border-radius: 3px 3px 0 0;
          }
          
          /* Dark theme divider fix */
          [data-theme='dark'] .hub-divider-premium {
            border-top-color: #1F2937 !important;
          }
        `}} />
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
}