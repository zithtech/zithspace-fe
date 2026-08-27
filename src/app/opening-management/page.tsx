'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Form,
    Input,
    Select,
    InputNumber,
    Space,
    Typography,
    Row,
    Col,
    Tag,
    Drawer,
    Divider,
    DatePicker,
    Radio,
    Popconfirm,
    Tooltip,
    Card,
    Popover,
    Slider,
} from 'antd';
import {
    Plus,
    Search,
    Briefcase,
    MapPin,
    Clock,
    Trash2,
    Edit,
    Eye,
    Filter,
    Users,
    Calendar,
    AlertCircle,
    ClipboardList,
    CheckCircle2,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

// Components
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Services
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position as PositionType } from '@/services/positionService';
import { MembersService } from '@/services/membersService';
import { OpeningManagementService, OpeningManagement } from '@/services/openingManagementService';
import { CompanyDetailsService, CompanyBranch } from '@/services/companyDetailsService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function OpeningManagementPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [openings, setOpenings] = useState<OpeningManagement[]>([]);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingOpening, setEditingOpening] = useState<OpeningManagement | null>(null);
    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState<any>({
        location: null,
        workType: null,
        status: null,
        experience: [0, 20],
    });

    // Dynamic Data States
    const [grades, setGrades] = useState<GradeAPIResponse[]>([]);
    const [positions, setPositions] = useState<PositionType[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [locations, setLocations] = useState<CompanyBranch[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDynamicData();
        fetchOpenings();
    }, []);

    const fetchOpenings = async () => {
        try {
            const data = await OpeningManagementService.getAll();
            setOpenings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching openings:', error);
        }
    };

    const fetchDynamicData = async () => {
        setLoading(true);
        try {
            const [gradesData, positionsData, membersData, locationsData] = await Promise.all([
                GradeService.getAllGrades(),
                PositionService.getAll(),
                MembersService.getMembersForSelect(),
                CompanyDetailsService.getBranches(),
            ]);

            setGrades(Array.isArray(gradesData) ? gradesData : (gradesData as any).data || []);
            setPositions(Array.isArray(positionsData) ? positionsData : (positionsData as any).data || []);
            setMembers(Array.isArray(membersData) ? membersData : (membersData as any).data || []);
            setLocations(Array.isArray(locationsData) ? locationsData : (locationsData as any).data || []);
        } catch (error) {
            console.error('Error fetching dynamic data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDrawer = (opening?: OpeningManagement) => {
        if (opening) {
            setEditingOpening(opening);
            form.setFieldsValue({
                ...opening,
            });
        } else {
            setEditingOpening(null);
            form.resetFields();
            form.setFieldsValue({
                currentStatus: 'Open',
                priorityLevel: 'Medium',
                workArrangement: 'Onsite',
                employmentType: 'Full-time',
                currency: 'INR',
                totalOpenings: 1
            });
        }
        setDrawerVisible(true);
    };

    const handleSave = () => {
        form.validateFields().then(async (values) => {
            try {
                if (editingOpening) {
                    await OpeningManagementService.update(editingOpening.id, values);
                } else {
                    await OpeningManagementService.create(values);
                }
                await fetchOpenings();
                setDrawerVisible(false);
            } catch (error) {
                console.error("Failed to save opening", error);
            }
        });
    };

    const handleDelete = async (id: string) => {
        try {
            await OpeningManagementService.delete(id);
            await fetchOpenings();
        } catch (error) {
            console.error("Failed to delete opening", error);
        }
    };

    const filteredOpenings = openings.filter((o) => {
        const matchesSearch = (o.jobTitle || "").toLowerCase().includes(searchText.toLowerCase()) ||
            (o.primarySkills || []).some(s => s.toLowerCase().includes(searchText.toLowerCase()));

        const matchesLocation = !filters.location || o.baseLocation === filters.location;
        const matchesWorkType = !filters.workType || o.workArrangement === filters.workType;
        const matchesStatus = !filters.status || o.currentStatus === filters.status;

        // Experience Range Match
        const openingMin = o.minExperience || 0;
        const openingMax = o.maxExperience || 0;
        const [filterMin, filterMax] = filters.experience;

        const matchesExp = openingMin >= filterMin && openingMax <= filterMax;

        return matchesSearch && matchesLocation && matchesWorkType && matchesStatus && matchesExp;
    });

    const columns = [
        {
            title: 'Job Info',
            key: 'jobInfo',
            width: 290,
            render: (record: OpeningManagement) => (
                <Space size={12}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'var(--bg-slate-100)',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 14,
                        border: '1px solid var(--border-color)'
                    }}>
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', color: 'var(--text-slate-900)', fontSize: 14 }}>{record.jobTitle}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.id?.substring(0, 8).toUpperCase()}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Category',
            key: 'roleDept',
            width: 200,
            render: (record: OpeningManagement) => {
                const isGrade = record.roleType === 'Grade';
                const deptName = isGrade
                    ? grades.find(g => g.id === record.departmentId)?.name
                    : positions.find(p => p.id === record.departmentId)?.title;

                return (
                    <Space direction="vertical" size={2}>
                        <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>{record.roleType}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{deptName || record.departmentId}</Text>
                    </Space>
                );
            },
        },
        {
            title: 'Work Type',
            dataIndex: 'workArrangement',
            key: 'workArrangement',
            render: (type: string) => (
                <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 500 }}>{type || "N/A"}</Tag>
            )
        },
        {
            title: 'Openings',
            dataIndex: 'totalOpenings',
            key: 'totalOpenings',
            align: 'center' as const,
            render: (count: number) => (
                <div style={{ fontWeight: 700, color: 'var(--text-slate-900)' }}>{count || 0}</div>
            )
        },
        {
            title: 'Experience',
            key: 'exp',
            render: (record: OpeningManagement) => (
                <Text style={{ fontSize: 13 }}>{record.minExperience || 0}-{record.maxExperience || 0} Yrs</Text>
            ),
        },
        {
            title: 'Notice Period',
            dataIndex: 'noticePeriod',
            key: 'noticePeriod',
            render: (days: number) => (
                <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-slate-700)' }}>
                    {days ? `${days} Days` : 'N/A'}
                </Text>
            )
        },
        {
            title: 'Status',
            dataIndex: 'currentStatus',
            key: 'currentStatus',
            render: (status: string) => {
                let color = "processing";
                if (status === "Closed") color = "error";
                if (status === "On Hold") color = "warning";
                return (
                    <Tag
                        color={color}
                        style={{ borderRadius: 20, padding: "0 12px", fontWeight: 600, border: 0 }}
                    >
                        {(status || "OPEN").toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (record: OpeningManagement) => (
                <Space size={4}>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<Eye size={18} style={{ color: "var(--text-slate-500)" }} />}
                            onClick={() => router.push(`/opening-management/${record.id}`)}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="Edit Opening">
                        <Button
                            type="text"
                            icon={<Edit size={18} style={{ color: "var(--text-slate-500)" }} />}
                            onClick={() => handleOpenDrawer(record)}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this opening?"
                        onConfirm={() => handleDelete(record.id!)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<Trash2 size={18} />} className="action-btn-danger" />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <Card
            styles={{ body: { padding: "16px 20px" } }}
            style={{
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
                </div>
                <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
                    <Icon size={20} />
                </div>
            </div>
        </Card>
    );

    return (
        <ProtectedRoute>
            <MainLayout>
                <div style={{ margin: "0 -24px", padding: "24px 32px", background: "var(--bg-pure-white)", minHeight: "calc(100vh - 64px)" }}>
                    {/* Header */}
                    <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <Space size={12} align="center">
                                <div style={{ background: "var(--bg-slate-100)", padding: 10, borderRadius: 12, color: "#2563eb", display: "flex" }}>
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Opening Management</Title>
                                    <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Create, track, and manage all your organization's job openings.</Text>
                                </div>
                            </Space>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    placeholder="Search openings..."
                                    prefix={<Search size={18} style={{ color: '#6366f1' }} />}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="creative-search"
                                    suffix={
                                        <div style={{
                                            background: 'var(--border-color)',
                                            padding: '2px 6px',
                                            borderRadius: 6,
                                            fontSize: 11,
                                            color: 'var(--text-slate-400)',
                                            fontWeight: 600,
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            ⌘K
                                        </div>
                                    }
                                />
                            </div>
                            <Button
                                type="primary"
                                icon={<Plus size={18} />}
                                onClick={() => handleOpenDrawer()}
                                style={{
                                    height: 46,
                                    borderRadius: 12,
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: 'none',
                                    padding: '0 24px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                                }}
                            >
                                Create Opening
                            </Button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                        <Col xs={24} sm={6}>
                            <StatCard
                                label="Total Openings"
                                value={openings.length}
                                icon={Briefcase}
                                color="#3b82f6"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <StatCard
                                label="Active Openings"
                                value={openings.filter(o => o.currentStatus === 'Open').length}
                                icon={CheckCircle2}
                                color="#10b981"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <StatCard
                                label="High Priority"
                                value={openings.filter(o => o.priorityLevel === 'High').length}
                                icon={AlertCircle}
                                color="#ef4444"
                            />
                        </Col>
                    </Row>

                    {/* Filters */}
                    <Card
                        styles={{ body: { padding: '16px 24px' } }}
                        style={{
                            marginBottom: 24,
                            borderRadius: 16,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-pure-white)',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.02)'
                        }}
                    >
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Text strong style={{ marginRight: 8, color: 'var(--text-slate-500)', fontSize: 13 }}>Quick Filters:</Text>
                            <Select
                                placeholder="Location"
                                style={{ width: 180 }}
                                allowClear
                                onChange={(val) => setFilters({ ...filters, location: val })}
                                dropdownStyle={{ borderRadius: 12 }}
                            >
                                <Option value="Bangalore, India">Bangalore, India</Option>
                                <Option value="Remote">Remote</Option>
                                <Option value="New York, USA">New York, USA</Option>
                            </Select>
                            <Select
                                placeholder="Work Type"
                                style={{ width: 180 }}
                                allowClear
                                onChange={(val) => setFilters({ ...filters, workType: val })}
                                dropdownStyle={{ borderRadius: 12 }}
                            >
                                <Option value="Remote">Remote</Option>
                                <Option value="Onsite">Onsite</Option>
                                <Option value="Hybrid">Hybrid</Option>
                            </Select>
                            <Select
                                placeholder="Status"
                                style={{ width: 180 }}
                                allowClear
                                onChange={(val) => setFilters({ ...filters, status: val })}
                                dropdownStyle={{ borderRadius: 12 }}
                            >
                                <Option value="Open">Open</Option>
                                <Option value="Closed">Closed</Option>
                                <Option value="On Hold">On Hold</Option>
                            </Select>

                            <Popover
                                content={
                                    <div style={{ width: 280, padding: '12px 8px' }}>
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>Experience: {filters.experience[0]}–{filters.experience[1]} yrs</Text>
                                            </div>
                                            <Slider
                                                range
                                                min={0}
                                                max={20}
                                                defaultValue={[0, 20]}
                                                value={filters.experience}
                                                onChange={(val) => setFilters({ ...filters, experience: val })}
                                                trackStyle={[{ background: '#3b82f6' }]}
                                                handleStyle={[{ borderColor: '#3b82f6' }, { borderColor: '#3b82f6' }]}
                                            />
                                        </div>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={() => setFilters({ ...filters, experience: [0, 20] })}
                                            style={{ padding: 0, height: 'auto' }}
                                        >
                                            Reset Advanced Filters
                                        </Button>
                                    </div>
                                }
                                title={<Text strong style={{ fontSize: 14 }}>Advanced Filters</Text>}
                                trigger="click"
                                placement="bottomRight"
                                overlayStyle={{ paddingTop: 8 }}
                            >
                                <Button icon={<Filter size={16} />} style={{ borderRadius: 10, height: 36, display: 'flex', alignItems: 'center', gap: 6 }}>More Filters</Button>
                            </Popover>
                        </div>
                    </Card>

                    {/* Table */}
                    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'visible', boxShadow: 'none' }}>
                        <Table
                            columns={columns}
                            dataSource={filteredOpenings}
                            rowKey="id"
                            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10, position: ["bottomRight"] }}
                            className="custom-table"
                            size="middle"
                        />
                    </Card>

                    {/* Create/Edit Drawer */}
                    <Drawer
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    background: 'var(--bg-slate-100)',
                                    padding: 10,
                                    borderRadius: 12,
                                    color: '#2563eb',
                                    display: 'flex',
                                    boxShadow: '0 0 0 1px var(--border-color)'
                                }}>
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>
                                        {editingOpening ? 'Edit Opening' : 'New Opening Request'}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-slate-500)', marginTop: 2 }}>
                                        {editingOpening ? 'Update existing job opening details' : 'Initiate a new recruitment process'}
                                    </div>
                                </div>
                            </div>
                        }
                        width={640}
                        onClose={() => setDrawerVisible(false)}
                        open={drawerVisible}
                        footer={
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px' }}>
                                <Button onClick={() => setDrawerVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
                                <Button type="primary" onClick={handleSave} style={{ borderRadius: 8, height: 40, padding: '0 24px', fontWeight: 600, background: '#2563eb', border: 'none' }}>
                                    {editingOpening ? 'Update Opening' : 'Publish Opening'}
                                </Button>
                            </div>
                        }
                        styles={{
                            header: { borderBottom: '1px solid var(--border-color)', padding: '16px 32px' },
                            body: { padding: '0' },
                            footer: { borderTop: '1px solid var(--border-color)', padding: '16px 24px' }
                        }}
                    >
                        <Form form={form} layout="vertical" requiredMark={false}>
                            {/* Section 1: Basic Info */}
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Basic Job Information
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item name="jobTitle" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Job Title</Text>} rules={[{ required: true }]}>
                                            <Input placeholder="e.g. Senior Frontend Engineer" style={{ height: 44, borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={10}>
                                        <Form.Item name="roleType" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Role Category</Text>} rules={[{ required: true }]}>
                                            <Select
                                                placeholder="Select role"
                                                onChange={() => form.setFieldsValue({ departmentId: undefined })}
                                                style={{ height: 44 }}
                                            >
                                                <Option value="Grade">Grade</Option>
                                                <Option value="Position">Position</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={14}>
                                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.roleType !== curr.roleType}>
                                            {({ getFieldValue }) => {
                                                const roleType = getFieldValue('roleType');
                                                const label = roleType === 'Grade' ? 'Grade' : roleType === 'Position' ? 'Position' : 'Department';
                                                const activeOptions = roleType === 'Grade' ? grades : roleType === 'Position' ? positions : [];
                                                return (
                                                    <Form.Item
                                                        name="departmentId"
                                                        label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>{label}</Text>}
                                                        rules={[{ required: true }]}
                                                    >
                                                        <Select placeholder={`Select ${label.toLowerCase()}`} showSearch optionFilterProp="children" style={{ height: 44 }}>
                                                            {activeOptions.map((item: any) => (
                                                                <Option key={item.id} value={item.id}>{item.name || item.title}</Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                );
                                            }}
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="hiringManagerId" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Hiring Manager</Text>}>
                                            <Select showSearch placeholder="Assign a hiring manager" optionFilterProp="children" style={{ height: 44 }}>
                                                {members.map(member => (
                                                    <Option key={member.value} value={member.value}>
                                                        {member.label} ({member.email})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Section 2: Requirements */}
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-pure-white)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Job Requirements
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="minExperience" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Min Experience (Years)</Text>} rules={[{ required: true }]}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="maxExperience" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Max Experience (Years)</Text>} rules={[{ required: true }]}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="primarySkills" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Primary Skills</Text>} rules={[{ required: true }]}>
                                            <Select mode="tags" placeholder="Select or type key skills..." style={{ width: '100%', borderRadius: 8 }}>
                                                <Option value="React">React</Option>
                                                <Option value="Next.js">Next.js</Option>
                                                <Option value="TypeScript">TypeScript</Option>
                                                <Option value="Node.js">Node.js</Option>
                                                <Option value="Java">Java</Option>
                                                <Option value="Python">Python</Option>
                                                <Option value="Go">Go</Option>
                                                <Option value="AWS">AWS</Option>
                                                <Option value="Azure">Azure</Option>
                                                <Option value="Figma">Figma</Option>
                                                <Option value="Tailwind CSS">Tailwind CSS</Option>
                                                <Option value="SQL">SQL</Option>
                                                <Option value="NoSQL">NoSQL</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="noticePeriod" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Notice Period (Days)</Text>}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={0} placeholder="e.g. 30" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="jobDescription" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Job Description</Text>}>
                                            <TextArea rows={4} placeholder="Summarize the role and responsibilities..." style={{ borderRadius: 8, padding: '12px' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Section 3: Logistics */}
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Location & Logistics
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="baseLocation" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Base Location</Text>} rules={[{ required: true }]}>
                                            <Select placeholder="Select office" style={{ height: 44 }}>
                                                {locations.map((loc) => (
                                                    <Option key={loc.id} value={loc.id}>
                                                        {loc.branchName || [loc.city, loc.country].filter(Boolean).join(', ') || loc.id}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="workArrangement" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Work Arrangement</Text>} rules={[{ required: true }]}>
                                            <Select placeholder="Select type" style={{ height: 44 }}>
                                                <Option value="Remote">Remote</Option>
                                                <Option value="Onsite">Onsite</Option>
                                                <Option value="Hybrid">Hybrid</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="employmentType" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Employment Type</Text>} rules={[{ required: true }]}>
                                            <Select placeholder="Select type" style={{ height: 44 }}>
                                                <Option value="Full-time">Full-time</Option>
                                                <Option value="Contract">Contract</Option>
                                                <Option value="C2C">C2C</Option>
                                                <Option value="W2">W2</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="totalOpenings" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Total Openings</Text>} rules={[{ required: true }]}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={1} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Section 4: Budget */}
                            <div style={{ padding: "24px 32px", background: "var(--bg-pure-white)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Budget & Status
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item name="minSalary" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Min Salary</Text>}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="maxSalary" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Max Salary</Text>}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="currency" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Currency</Text>}>
                                            <Select style={{ height: 44 }}>
                                                <Option value="INR">INR (₹)</Option>
                                                <Option value="USD">USD ($)</Option>
                                                <Option value="EUR">EUR (€)</Option>
                                                <Option value="GBP">GBP (£)</Option>
                                                <Option value="AED">AED (د.إ)</Option>
                                                <Option value="CAD">CAD ($)</Option>
                                                <Option value="AUD">AUD ($)</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="priorityLevel" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Priority Level</Text>}>
                                            <Select style={{ height: 44 }}>
                                                <Option value="High">High</Option>
                                                <Option value="Medium">Medium</Option>
                                                <Option value="Low">Low</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="currentStatus" label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Current Status</Text>}>
                                            <Select style={{ height: 44 }}>
                                                <Option value="Open">Open</Option>
                                                <Option value="Closed">Closed</Option>
                                                <Option value="On Hold">On Hold</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </Form>
                    </Drawer>

                    <style dangerouslySetInnerHTML={{
                        __html: `
              .action-btn:hover { background: var(--border-color) !important; color: #2563eb !important; }
              .action-btn-danger:hover { background: var(--bg-leave) !important; }
              .creative-search {
                width: 320px;
                border-radius: 12px !important;
                height: 46px !important;
                background: var(--bg-table-header) !important;
                border: 1px solid var(--border-color) !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
              }
              .creative-search:hover {
                border-color: var(--border-slate-800) !important;
                background: var(--bg-pure-white) !important;
              }
              .creative-search:focus, .creative-search-focused {
                border-color: #2563eb !important;
                background: var(--bg-pure-white) !important;
                box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
                width: 380px !important;
              }
              
              .custom-table .ant-table-thead > tr > th:first-child {
                border-top-left-radius: 16px !important;
              }
              .custom-table .ant-table-thead > tr > th:last-child {
                border-top-right-radius: 16px !important;
              }
              .custom-table .ant-table-pagination {
                position: sticky !important;
                bottom: 0 !important;
                z-index: 20;
                background: var(--bg-pure-white) !important;
                margin: 0 !important;
                padding: 16px 24px !important;
                border-top: 1px solid var(--border-color) !important;
                border-bottom-left-radius: 16px !important;
                border-bottom-right-radius: 16px !important;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.03);
              }

              .custom-table .ant-table-thead > tr > th {
                background: var(--bg-table-header) !important;
                color: var(--text-slate-500) !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                font-size: 11px !important;
                letter-spacing: 0.05em !important;
              }
              .custom-table .ant-table-thead > tr > th:first-child,
              .custom-table .ant-table-tbody > tr > td:first-child {
                padding-left: 24px !important;
              }
              .custom-table .ant-table-thead > tr > th:last-child,
              .custom-table .ant-table-tbody > tr > td:last-child {
                padding-right: 24px !important;
              }
              .custom-table .ant-table-row:hover > td { background: var(--bg-table-header) !important; }
              .ant-input:focus, .ant-select-focused .ant-select-selector, .ant-input-number:focus { 
                border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important; 
              }
              .custom-input-number .ant-input-number-input {
                text-align: left !important;
                height: 44px !important;
                display: flex !important;
                align-items: center !important;
              }
              .custom-input-number {
                border-radius: 8px !important;
                overflow: hidden !important;
              }
            `
                    }} />
                </div>
            </MainLayout>
        </ProtectedRoute>
    );
}
