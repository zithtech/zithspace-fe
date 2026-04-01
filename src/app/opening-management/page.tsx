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

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Types
interface Opening {
    id: string;
    jobId: string;
    title: string;
    role: 'Grade' | 'Position';
    department: string;
    experience: {
        min: number;
        max: number;
    };
    skills: string[];
    secondarySkills: string[];
    location: string;
    workType: 'Remote' | 'Onsite' | 'Hybrid';
    employmentType: 'Full-time' | 'Contract' | 'C2C' | 'W2';
    openingType: 'Internal' | 'External';
    numberOfOpenings: number;
    salary: {
        min: number;
        max: number;
        currency: string;
    };
    priority: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'Closed' | 'On Hold';
    targetJoinDate: string;
    tags: string[];
    createdAt: string;
}

// Dummy Data
const initialOpenings: Opening[] = [
    {
        id: '1',
        jobId: 'JOB-2024-001',
        title: 'Senior Frontend Engineer',
        role: 'Position',
        department: 'Engineering',
        experience: { min: 5, max: 8 },
        skills: ['React', 'Next.js', 'TypeScript', 'Ant Design'],
        secondarySkills: ['GraphQL', 'Tailwind CSS'],
        location: 'Bangalore, India',
        workType: 'Hybrid',
        employmentType: 'Full-time',
        openingType: 'External',
        numberOfOpenings: 3,
        salary: { min: 25, max: 45, currency: 'LPA' },
        priority: 'High',
        status: 'Open',
        targetJoinDate: '2024-05-01',
        tags: ['Urgent', 'Tech'],
        createdAt: '2024-03-25',
    },
    {
        id: '2',
        jobId: 'JOB-2024-002',
        title: 'UI/UX Designer',
        role: 'Grade',
        department: 'Design',
        experience: { min: 2, max: 5 },
        skills: ['Figma', 'Adobe XD', 'Prototyping'],
        secondarySkills: ['Illustrator', 'User Research'],
        location: 'Remote',
        workType: 'Remote',
        employmentType: 'Full-time',
        openingType: 'Internal',
        numberOfOpenings: 1,
        salary: { min: 15, max: 25, currency: 'LPA' },
        priority: 'Medium',
        status: 'Open',
        targetJoinDate: '2024-04-15',
        tags: ['Design', 'Creative'],
        createdAt: '2024-03-28',
    },
];

export default function OpeningManagementPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [openings, setOpenings] = useState<Opening[]>(initialOpenings);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDynamicData();
    }, []);

    const fetchDynamicData = async () => {
        setLoading(true);
        try {
            const [gradesData, positionsData, membersData] = await Promise.all([
                GradeService.getAllGrades(),
                PositionService.getAll(),
                MembersService.getMembersForSelect(),
            ]);

            setGrades(Array.isArray(gradesData) ? gradesData : (gradesData as any).data || []);
            setPositions(Array.isArray(positionsData) ? positionsData : (positionsData as any).data || []);
            setMembers(Array.isArray(membersData) ? membersData : (membersData as any).data || []);
        } catch (error) {
            console.error('Error fetching dynamic data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDrawer = (opening?: Opening) => {
        if (opening) {
            setEditingOpening(opening);
            form.setFieldsValue({
                ...opening,
                minExperience: opening.experience.min,
                maxExperience: opening.experience.max,
                salaryMin: opening.salary.min,
                salaryMax: opening.salary.max,
                currency: opening.salary.currency,
                targetJoinDate: dayjs(opening.targetJoinDate),
            });
        } else {
            setEditingOpening(null);
            form.resetFields();
            form.setFieldsValue({
                status: 'Open',
                priority: 'Medium',
                workType: 'Onsite',
                openingType: 'External',
                employmentType: 'Full-time',
                currency: 'INR',
            });
        }
        setDrawerVisible(true);
    };

    const handleSave = () => {
        form.validateFields().then((values) => {
            const newOpening: Opening = {
                id: editingOpening?.id || Math.random().toString(36).substr(2, 9),
                jobId: editingOpening?.jobId || `JOB-2024-${Math.floor(Math.random() * 1000)}`,
                title: values.title,
                role: values.role,
                department: values.department,
                experience: { min: values.minExperience, max: values.maxExperience },
                skills: values.skills,
                secondarySkills: values.secondarySkills || [],
                location: values.location,
                workType: values.workType,
                employmentType: values.employmentType,
                openingType: values.openingType,
                numberOfOpenings: values.numberOfOpenings,
                salary: { min: values.salaryMin, max: values.salaryMax, currency: values.currency },
                priority: values.priority,
                status: values.status,
                targetJoinDate: values.targetJoinDate ? values.targetJoinDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                tags: values.tags || [],
                createdAt: editingOpening?.createdAt || dayjs().format('YYYY-MM-DD'),
            };

            if (editingOpening) {
                setOpenings(openings.map((o) => (o.id === editingOpening.id ? newOpening : o)));
            } else {
                setOpenings([newOpening, ...openings]);
            }
            setDrawerVisible(false);
        });
    };

    const handleDelete = (id: string) => {
        setOpenings(openings.filter((o) => o.id !== id));
    };

    const filteredOpenings = openings.filter((o) => {
        const matchesSearch = o.title.toLowerCase().includes(searchText.toLowerCase()) ||
            o.jobId.toLowerCase().includes(searchText.toLowerCase()) ||
            o.department.toLowerCase().includes(searchText.toLowerCase()) ||
            o.skills.some(s => s.toLowerCase().includes(searchText.toLowerCase()));
            
        const matchesLocation = !filters.location || o.location === filters.location;
        const matchesWorkType = !filters.workType || o.workType === filters.workType;
        const matchesStatus = !filters.status || o.status === filters.status;
        
        // Experience Range Match
        const openingMin = o.experience.min;
        const openingMax = o.experience.max;
        const [filterMin, filterMax] = filters.experience;
        
        // Match if the opening experience range overlaps with the filter range
        // or if we want stricter: if opening is within filter range
        const matchesExp = openingMin >= filterMin && openingMax <= filterMax;

        return matchesSearch && matchesLocation && matchesWorkType && matchesStatus && matchesExp;
    });

    const columns = [
        {
            title: 'Job Info',
            key: 'jobInfo',
            width: 250,
            render: (record: Opening) => (
                <Space size={12}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 14,
                        border: '1px solid #dbeafe'
                    }}>
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', color: '#1e293b', fontSize: 14 }}>{record.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.jobId}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Category',
            key: 'roleDept',
            render: (record: Opening) => (
                <Space direction="vertical" size={2}>
                    <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>{record.role}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.department}</Text>
                </Space>
            ),
        },
        {
            title: 'Work Type',
            dataIndex: 'workType',
            key: 'workType',
            render: (type: string) => (
                <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 500 }}>{type}</Tag>
            )
        },
        {
            title: 'Type',
            dataIndex: 'openingType',
            key: 'openingType',
            render: (type: string) => (
                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 500 }}>{type}</Tag>
            )
        },
        {
            title: 'Openings',
            dataIndex: 'numberOfOpenings',
            key: 'numberOfOpenings',
            align: 'center' as const,
            render: (count: number) => (
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{count}</div>
            )
        },
        {
            title: 'Experience',
            key: 'exp',
            render: (record: Opening) => (
                <Text style={{ fontSize: 13 }}>{record.experience.min}-{record.experience.max} Yrs</Text>
            ),
        },
        {
            title: 'Employment',
            dataIndex: 'employmentType',
            key: 'employmentType',
            render: (type: string) => (
                <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>{type}</Tag>
            )
        },

        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = "processing";
                if (status === "Closed") color = "error";
                if (status === "On Hold") color = "warning";
                return (
                    <Tag
                        color={color}
                        style={{ borderRadius: 20, padding: "0 12px", fontWeight: 600, border: 0 }}
                    >
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (record: Opening) => (
                <Space size={4}>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<Eye size={18} style={{ color: "#64748b" }} />}
                            onClick={() => router.push(`/opening-management/${record.id}`)}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="Edit Opening">
                        <Button
                            type="text"
                            icon={<Edit size={18} style={{ color: "#64748b" }} />}
                            onClick={() => handleOpenDrawer(record)}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this opening?"
                        onConfirm={() => handleDelete(record.id)}
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
                border: "1px solid #f1f5f9", 
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
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
                <div style={{ margin: "0 -24px", padding: "24px 32px", background: "#ffffff", minHeight: "calc(100vh - 64px)" }}>
                    {/* Header */}
                    <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <Space size={12} align="center">
                                <div style={{ background: "#eff6ff", padding: 10, borderRadius: 12, color: "#2563eb", display: "flex" }}>
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Opening Management</Title>
                                    <Text style={{ color: "#64748b", fontSize: 15 }}>Create, track, and manage all your organization's job openings.</Text>
                                </div>
                            </Space>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Input
                                placeholder="Search openings..."
                                prefix={<Search size={16} style={{ color: '#94a3b8' }} />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 280, borderRadius: 10, height: 44 }}
                            />
                            <Button
                                type="primary"
                                icon={<Plus size={18} />}
                                onClick={() => handleOpenDrawer()}
                                style={{
                                    height: 44,
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    background: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: 'none',
                                    padding: '0 20px'
                                }}
                            >
                                Create Opening
                            </Button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                        <Col xs={24} sm={8}>
                            <StatCard 
                                label="Total Openings" 
                                value={openings.length} 
                                icon={Briefcase} 
                                color="#3b82f6" 
                            />
                        </Col>
                        <Col xs={24} sm={8}>
                            <StatCard 
                                label="Active Openings" 
                                value={openings.filter(o => o.status === 'Open').length} 
                                icon={CheckCircle2} 
                                color="#10b981" 
                            />
                        </Col>
                        <Col xs={24} sm={8}>
                            <StatCard 
                                label="High Priority" 
                                value={openings.filter(o => o.priority === 'High').length} 
                                icon={AlertCircle} 
                                color="#ef4444" 
                            />
                        </Col>
                    </Row>

                    {/* Filters */}
                    <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
                                            <Text strong style={{ fontSize: 13, color: '#1e293b' }}>Experience: {filters.experience[0]}–{filters.experience[1]} yrs</Text>
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
                            <Button icon={<Filter size={16} />} style={{ borderRadius: 8, height: 32 }}>More Filters</Button>
                        </Popover>
                    </div>

                    {/* Table */}
                    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: 'none' }}>
                        <Table
                            columns={columns}
                            dataSource={filteredOpenings}
                            rowKey="id"
                            pagination={{ pageSize: 10, position: ["bottomRight"] }}
                            className="custom-table"
                            size="middle"
                        />
                    </Card>

                    {/* Create/Edit Drawer */}
                    <Drawer
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    background: '#eff6ff',
                                    padding: 10,
                                    borderRadius: 12,
                                    color: '#2563eb',
                                    display: 'flex',
                                    boxShadow: '0 0 0 1px #dbeafe'
                                }}>
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                        {editingOpening ? 'Edit Opening' : 'New Opening Request'}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
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
                            header: { borderBottom: '1px solid #f1f5f9', padding: '16px 32px' },
                            body: { padding: '0' },
                            footer: { borderTop: '1px solid #f1f5f9', padding: '16px 24px' }
                        }}
                    >
                        <Form form={form} layout="vertical" requiredMark={false}>
                            {/* Section 1: Basic Info */}
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Basic Job Information
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item name="title" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Job Title</Text>} rules={[{ required: true }]}>
                                            <Input placeholder="e.g. Senior Frontend Engineer" style={{ height: 44, borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={10}>
                                        <Form.Item name="role" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Role Category</Text>} rules={[{ required: true }]}>
                                            <Select
                                                placeholder="Select role"
                                                onChange={() => form.setFieldsValue({ department: undefined })}
                                                style={{ height: 44 }}
                                            >
                                                <Option value="Grade">Grade</Option>
                                                <Option value="Position">Position</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={14}>
                                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
                                            {({ getFieldValue }) => {
                                                const role = getFieldValue('role');
                                                const label = role === 'Grade' ? 'Grade' : role === 'Position' ? 'Position' : 'Department';
                                                const activeOptions = role === 'Grade' ? grades : role === 'Position' ? positions : [];
                                                return (
                                                    <Form.Item
                                                        name="department"
                                                        label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</Text>}
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
                                        <Form.Item name="hiringManager" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Hiring Manager</Text>}>
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
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", background: "#fbfcfd" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Job Requirements
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="minExperience" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Min Experience (Years)</Text>} rules={[{ required: true }]}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="maxExperience" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Max Experience (Years)</Text>} rules={[{ required: true }]}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={0} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="skills" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Primary Skills</Text>} rules={[{ required: true }]}>
                                            <Select mode="multiple" placeholder="Select key skills..." style={{ width: '100%', borderRadius: 8 }}>
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
                                        <Form.Item name="description" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Job Description</Text>}>
                                            <TextArea rows={4} placeholder="Summarize the role and responsibilities..." style={{ borderRadius: 8, padding: '12px' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Section 3: Logistics */}
                            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Location & Logistics
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="location" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Base Location</Text>} rules={[{ required: true }]}>
                                            <Select placeholder="Select office" style={{ height: 44 }}>
                                                <Option value="Bangalore, India">Bangalore, India</Option>
                                                <Option value="Remote">Remote</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="workType" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Work Arrangement</Text>} rules={[{ required: true }]}>
                                            <Select placeholder="Select type" style={{ height: 44 }}>
                                                <Option value="Remote">Remote</Option>
                                                <Option value="Onsite">Onsite</Option>
                                                <Option value="Hybrid">Hybrid</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="employmentType" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Employment Type</Text>} rules={[{ required: true }]}>
                                            <Select placeholder="Select type" style={{ height: 44 }}>
                                                <Option value="Full-time">Full-time</Option>
                                                <Option value="Contract">Contract</Option>
                                                <Option value="C2C">C2C</Option>
                                                <Option value="W2">W2</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="numberOfOpenings" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Total Openings</Text>} rules={[{ required: true }]}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} min={1} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Section 4: Budget */}
                            <div style={{ padding: "24px 32px", background: "#fbfcfd" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 4, height: 16, background: "#2563eb", borderRadius: 2 }} />
                                    <Text strong style={{ fontSize: 15, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                                        Budget & Status
                                    </Text>
                                </div>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item name="salaryMin" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Min Salary</Text>}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="salaryMax" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Max Salary</Text>}>
                                            <InputNumber className="custom-input-number" style={{ width: '100%', height: 44 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="currency" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Currency</Text>}>
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
                                        <Form.Item name="priority" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Priority Level</Text>}>
                                            <Select style={{ height: 44 }}>
                                                <Option value="High">High</Option>
                                                <Option value="Medium">Medium</Option>
                                                <Option value="Low">Low</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="status" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Current Status</Text>}>
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
              .action-btn:hover { background: #f1f5f9 !important; color: #2563eb !important; }
              .action-btn-danger:hover { background: #fff1f2 !important; }
              .custom-table .ant-table-thead > tr > th {
                background: #f8fafc !important;
                color: #64748b !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                font-size: 11px !important;
                letter-spacing: 0.05em !important;
              }
              .custom-table .ant-table-row:hover > td { background: #f8fafc !important; }
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