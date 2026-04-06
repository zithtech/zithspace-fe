'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';
import {
  Card,
  Typography,
  Tabs,
  Space,
  Alert,
  Table,
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  TimePicker,
  InputNumber,
  Switch,
  Popconfirm,
  Spin,
  Upload,
  Row,
  Col,
  message,
  Tooltip,
  Tag,
} from 'antd';
import {
  SettingOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
} from '@ant-design/icons';
import LogoCropper from '@/components/common/LogoCropper';
import { SettingsService, Shift, CreateShiftData, UpdateShiftData } from '@/services/settingsService';
import { TenantService, TenantProfile } from '@/services/tenantService';
import { CompanyLocationService } from '@/services/companyLocationService';
import { ApiError } from '@/lib/axios';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// Premium UI Styles
const styles = {
  headerSection: {
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 8px 16px 8px",
    background: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
    flex: "0 0 auto"
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: "14px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 1px rgba(37, 99, 235, 0.05)"
  },
  sectionCard: {
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
    background: "#ffffff"
  },
  tabStyle: {
    background: "#ffffff",
    marginBottom: "0",
    padding: "0 8px"
  },
  locationCard: {
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    background: '#ffffff',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: '12px',
    background: '#f8fafc',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    border: '1px solid #f1f5f9'
  }
};

interface ShiftFormData {
  name: string;
  code: string;
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  graceMinutes: number;
  lunchBreakMinutes: number;
  overtimeThreshold: number;
  isFlexible: boolean;
}

function SettingsPage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { canReadSettings, canUpdateSettings } = usePermission();
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadSettings) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadSettings, router]);

  // State management
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);

  // Shift management state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isShiftModalVisible, setIsShiftModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Tenant settings state
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [systemForm] = Form.useForm();

  // Cropping and versioning state
  const [isCropperVisible, setIsCropperVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [cropLoading, setCropLoading] = useState(false);
  const [logoVersions, setLogoVersions] = useState<string[]>([]);
  const [isSystemFormDirty, setIsSystemFormDirty] = useState(false);

  // Company locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [locationForm] = Form.useForm();

  // Fetch shifts
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const shifts = await SettingsService.getAllShifts();
      setShifts(shifts);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error('Failed to fetch shifts');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenant profile
  const fetchTenantProfile = async () => {
    try {
      setLoading(true);
      const profile = await TenantService.getProfile();
      setTenantProfile(profile);
      systemForm.setFieldsValue({
        name: profile.name,
      });
      if (profile.settings?.logoUrl) {
        setFileList([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: profile.settings.logoUrl,
          },
        ]);
      }
      if (profile.settings?.logoVersions) {
        setLogoVersions(profile.settings.logoVersions);
      }
      setIsSystemFormDirty(false);
    } catch (error) {
      console.error('Failed to fetch tenant profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await CompanyLocationService.getAll();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      messageApi.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  // Load shifts when attendance tab is active
  useEffect(() => {
    if (user && activeTab === 'attendance') {
      fetchShifts();
    }
    if (user && activeTab === 'system') {
      fetchTenantProfile();
    }
    if (user && activeTab === 'location') {
      fetchLocations();
    }
  }, [user, activeTab]);


  // Handle shift form submission
  const handleShiftSubmit = async (values: ShiftFormData) => {
    try {
      setFormLoading(true);

      const payload: CreateShiftData | UpdateShiftData = {
        name: values.name,
        code: values.code.toUpperCase(),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        graceMinutes: values.graceMinutes,
        lunchBreakMinutes: values.lunchBreakMinutes,
        overtimeThreshold: values.overtimeThreshold,
        isFlexible: values.isFlexible,
        // Calculate working minutes
        workingMinutes: values.endTime.diff(values.startTime, 'minutes') - values.lunchBreakMinutes,
      };

      if (modalType === 'edit' && editingShift) {
        await SettingsService.updateShift(editingShift.id, payload as UpdateShiftData);
        messageApi.success('Shift updated successfully!');
      } else {
        await SettingsService.createShift(payload as CreateShiftData);
        messageApi.success('Shift created successfully!');
      }

      setIsShiftModalVisible(false);
      form.resetFields();
      setEditingShift(null);
      fetchShifts();
    } catch (error) {
      console.error('Failed to submit shift form:', error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error('Operation failed');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle shift deletion
  const handleDeleteShift = async (shiftId: string) => {
    try {
      setFormLoading(true);
      await SettingsService.deleteShift(shiftId);
      messageApi.success('Shift deleted successfully!');
      fetchShifts();
    } catch (error) {
      console.error('Failed to delete shift:', error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error('Failed to delete shift');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle system settings submission
  const handleSystemSubmit = async (values: { name: string }) => {
    try {
      setFormLoading(true);

      const payload: any = {
        name: values.name,
      };

      // Check for new logo
      const newLogo = fileList.find(f => f.originFileObj);
      if (newLogo) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(newLogo.originFileObj as File);
        });
        payload.logo = await base64Promise;
      }

      const updatedProfile = await TenantService.updateProfile(payload);

      // Update global auth state to reflect changes in TopNav immediately
      updateUser({
        tenantName: updatedProfile.name,
        tenantLogo: updatedProfile.settings?.logoUrl
      });

      messageApi.success('System settings updated successfully!');
      setFileList([]);
      setIsSystemFormDirty(false);
      fetchTenantProfile();

    } catch (error) {
      console.error('Failed to update system settings:', error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error('Failed to update system settings');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetAsFinal = async (url: string) => {
    try {
      setLoading(true);
      const updatedProfile = await TenantService.updateProfile({
        finalLogoUrl: url
      });

      updateUser({
        tenantLogo: updatedProfile.settings?.logoUrl
      });

      messageApi.success('Logo updated successfully!');
      fetchTenantProfile();
    } catch (error) {
      console.error('Failed to set final logo:', error);
      messageApi.error('Failed to update logo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (url: string) => {
    try {
      setLoading(true);
      const response = await TenantService.deleteLogoVersion(url);

      updateUser({
        tenantLogo: response.logoUrl
      });

      messageApi.success('Logo version deleted successfully!');
      fetchTenantProfile();
    } catch (error) {
      console.error('Failed to delete logo version:', error);
      messageApi.error('Failed to delete logo version');
    } finally {
      setLoading(false);
    }
  };

  const handleCropComplete = async (base64: string) => {
    try {
      setCropLoading(true);
      const updatedProfile = await TenantService.updateProfile({
        croppedLogo: base64
      });

      updateUser({
        tenantLogo: updatedProfile.settings?.logoUrl
      });

      setIsCropperVisible(false);
      messageApi.success('Cropped logo saved successfully!');
      fetchTenantProfile();
    } catch (error) {
      console.error('Failed to save cropped logo:', error);
      messageApi.error('Failed to save cropped logo');
    } finally {
      setCropLoading(false);
    }
  };

  // Modal handlers
  const showAddShiftModal = () => {
    setModalType('add');
    form.resetFields();
    setEditingShift(null);
    setIsShiftModalVisible(true);
  };

  const showEditShiftModal = (shift: Shift) => {
    setModalType('edit');
    setEditingShift(shift);
    form.setFieldsValue({
      name: shift.name,
      code: shift.code,
      startTime: dayjs(shift.startTime, 'HH:mm'),
      endTime: dayjs(shift.endTime, 'HH:mm'),
      graceMinutes: shift.graceMinutes,
      lunchBreakMinutes: shift.lunchBreakMinutes,
      overtimeThreshold: shift.overtimeThreshold,
      isFlexible: shift.isFlexible,
    });
    setIsShiftModalVisible(true);
  };

  const showAddLocationDrawer = () => {
    setEditingLocation(null);
    locationForm.resetFields();
    setIsLocationDrawerVisible(true);
  };

  const showEditLocationDrawer = (location: any) => {
    setEditingLocation(location);
    locationForm.setFieldsValue(location);
    setIsLocationDrawerVisible(true);
  };

  const handleLocationsSubmit = async (values: any) => {
    try {
      setFormLoading(true);
      if (editingLocation) {
        await CompanyLocationService.update(editingLocation.id, values);
        messageApi.success('Location updated successfully!');
      } else {
        await CompanyLocationService.create(values);
        messageApi.success('Location added successfully!');
      }
      setIsLocationDrawerVisible(false);
      setEditingLocation(null);
      locationForm.resetFields();
      fetchLocations();
    } catch (error) {
      console.error('Failed to save location', error);
      messageApi.error('Failed to save location');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      setFormLoading(true);
      await CompanyLocationService.delete(id);
      messageApi.success('Location removed successfully!');
      fetchLocations();
    } catch (error) {
      console.error('Failed to delete location', error);
      messageApi.error('Failed to delete location');
    } finally {
      setFormLoading(false);
    }
  };

  // Shift table columns
  const shiftColumns: ColumnsType<Shift> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      render: (code: string) => (
        <Text strong style={{ fontSize: 12 }}>{code}</Text>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      width: 120,
      render: (_, record: Shift) => (
        <Text style={{ fontSize: 12 }}>
          {record.startTime} - {record.endTime}
        </Text>
      ),
    },
    {
      title: 'Working Hours',
      dataIndex: 'workingMinutes',
      key: 'workingMinutes',
      width: 100,
      render: (minutes: number) => (
        <Text style={{ fontSize: 12 }}>
          {Math.floor(minutes / 60)}h {minutes % 60}m
        </Text>
      ),
    },
    {
      title: 'Grace Period',
      dataIndex: 'graceMinutes',
      key: 'graceMinutes',
      width: 100,
      render: (minutes: number) => (
        <Text style={{ fontSize: 12 }}>{minutes} min</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'isFlexible',
      key: 'isFlexible',
      width: 80,
      render: (isFlexible: boolean) => (
        <Text style={{ fontSize: 12, color: isFlexible ? '#722ed1' : '#52c41a' }}>
          {isFlexible ? 'Flexible' : 'Fixed'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Text style={{ fontSize: 12, color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record: Shift) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEditShiftModal(record)}
            style={{ color: '#1677ff' }}
          />
          <Popconfirm
            title="Delete shift?"
            description="Are you sure you want to delete this shift?"
            onConfirm={() => handleDeleteShift(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              style={{ color: '#ff4d4f' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ padding: 100, textAlign: 'center' }}>
            <Spin size="large" tip="Loading">
              <div style={{ padding: 20 }} />
            </Spin>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!canReadSettings || !user || !['super_admin', 'admin'].includes(user.role)) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Alert
            message="Access Denied"
            description="You do not have permission to access system settings."
            type="error"
            showIcon
          />
        </div>
      </MainLayout>
    );
  }

  const tabItems = [
    {
      key: 'system',
      label: (
        <Space size={8} style={{ padding: "4px 8px" }}>
          <SettingOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>System Information</span>
        </Space>
      ),
      children: (
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "8px 4px 40px 4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "100%"
        }}>
          <Card
            variant="borderless"
            style={{ ...styles.sectionCard, width: "100%", maxWidth: 1100, marginTop: 8 }}
            styles={{ body: { padding: "40px" } }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: "8px 0" }}>
                <Space size={12}>
                  <div style={{ ...styles.iconContainer, width: 36, height: 36, borderRadius: 10 }}>
                    <SettingOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 18, color: "#1e293b", display: 'block' }}>Company Branding</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Customize your workspace identity</Text>
                  </div>
                </Space>
              </div>
            }
          >
            <Row gutter={40} align="top">
              {/* Left Column: Branding Form */}
              <Col xs={24} lg={10} xl={9}>
                <Form
                  form={systemForm}
                  layout="vertical"
                  onFinish={handleSystemSubmit}
                  onValuesChange={() => setIsSystemFormDirty(true)}
                >
                  <Form.Item
                    name="name"
                    label={<Text strong style={{ color: '#475569' }}>Company Name</Text>}
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input placeholder="Enter company name" style={{ height: 44, borderRadius: 10 }} />
                  </Form.Item>

                  <Form.Item
                    label={
                      <Space size={8}>
                        <Text strong style={{ color: '#475569' }}>Company Logo</Text>
                        {tenantProfile?.settings?.logoUrl && fileList.length === 0 && (
                          <Tag color="blue" icon={<CheckCircleFilled />} style={{ margin: 0, borderRadius: 4 }}>Active</Tag>
                        )}
                      </Space>
                    }
                    style={{ marginBottom: 32 }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                      <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={({ fileList }) => {
                          setFileList(fileList);
                          setIsSystemFormDirty(true);
                        }}
                        beforeUpload={() => false}
                        maxCount={1}
                      >
                        {fileList.length < 1 && (
                          <div style={{ color: '#64748b' }}>
                            <PlusOutlined style={{ fontSize: 20 }} />
                            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 500 }}>Upload</div>
                          </div>
                        )}
                      </Upload>
                      <Space direction="vertical" size={2} style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 12, color: '#64748b', height: '100%', display: 'flex', alignItems: 'center' }}>
                          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0', width: '100%' }}>
                            Recommended: 200x50px transparent PNG. Max 2MB.
                          </div>
                        </div>
                      </Space>
                    </div>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={formLoading}
                      disabled={!isSystemFormDirty}
                      size="large"
                      block
                      style={{
                        borderRadius: 12,
                        height: 50,
                        fontWeight: 700,
                        background: !isSystemFormDirty ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        border: 'none',
                        boxShadow: !isSystemFormDirty ? 'none' : "0 4px 12px rgba(37, 99, 235, 0.2)"
                      }}
                    >
                      Save Branding
                    </Button>
                  </Form.Item>
                </Form>
              </Col>

              {/* Right Column: Logo Versions List */}
              <Col xs={24} lg={14} xl={15} style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: 40 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Logo Assets</Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>Previously generated logo versions. Set any version as your primary logo.</Text>
                </div>

                {logoVersions.length > 0 ? (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 16,
                    padding: 24,
                    border: '1px solid #f1f5f9',
                    width: '100%'
                  }}>
                    <Row gutter={[16, 16]}>
                      {logoVersions.map((url, index) => (
                        <Col key={index} span={12}>
                          <Card
                            hoverable
                            styles={{ body: { padding: 12 } }}
                            style={{
                              borderRadius: "12px",
                              overflow: 'hidden',
                              border: tenantProfile?.settings?.logoUrl === url ? '2px solid #2563eb' : '1px solid #f1f5f9',
                              position: 'relative',
                              background: '#fff'
                            }}
                          >
                            {tenantProfile?.settings?.logoUrl === url && (
                              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                                <Tag color="blue" icon={<CheckCircleFilled />} style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 10 }}>
                                  Active
                                </Tag>
                              </div>
                            )}
                            <div style={{
                              height: 80,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 8,
                              background: '#fcfdfe',
                              borderRadius: 8,
                              marginBottom: 12,
                              border: '1px solid #f8fafc'
                            }}>
                              <img src={url} alt={`Version ${index}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space size={6}>
                                <Tooltip title="Crop/Edit">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined style={{ color: '#3b82f6' }} />}
                                    onClick={() => {
                                      setImageToCrop(url);
                                      setIsCropperVisible(true);
                                    }}
                                    style={{ background: '#eff6ff', borderRadius: 8 }}
                                  />
                                </Tooltip>
                                {tenantProfile?.settings?.logoUrl !== url && (
                                  <Button
                                    size="small"
                                    type="link"
                                    style={{ fontSize: 11, fontWeight: 600, padding: 0 }}
                                    onClick={() => handleSetAsFinal(url)}
                                  >
                                    Use Logo
                                  </Button>
                                )}
                              </Space>
                              <Popconfirm
                                title="Delete version?"
                                onConfirm={() => handleDeleteVersion(url)}
                                okText="Delete"
                                cancelText="No"
                                okButtonProps={{ danger: true, size: 'small' }}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                                  style={{ borderRadius: 8 }}
                                />
                              </Popconfirm>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : (
                  <div style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: 16,
                    border: '1px dashed #e2e8f0'
                  }}>
                    <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
                      <PlusOutlined style={{ fontSize: 32 }} />
                    </div>
                    <Text type="secondary">Generated logo versions will appear here.</Text>
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          {/* Cropper Modal */}
          <LogoCropper
            image={imageToCrop}
            open={isCropperVisible}
            onClose={() => setIsCropperVisible(false)}
            onCropComplete={handleCropComplete}
            loading={cropLoading}
          />
        </div>
      )
    },
    {
      key: 'location',
      label: (
        <Space size={8} style={{ padding: "4px 8px" }}>
          <EnvironmentOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>Company Location</span>
        </Space>
      ),
      children: (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 4px 40px 4px" }}>
          <div style={{ padding: "8px 4px 24px 4px" }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              background: '#f8fafc',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '1px solid #f1f5f9'
            }}>
              <Space align="center" size="middle">
                <div style={{ ...styles.iconContainer, width: 40, height: 40, borderRadius: 10, background: '#fff' }}>
                  <EnvironmentOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
                    Company Locations
                  </Title>
                  <Text style={{ color: "#64748b", fontSize: 14 }}>
                    Manage your company office addresses and physical locations.
                  </Text>
                </div>
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddLocationDrawer}
                style={{
                  borderRadius: 10,
                  height: 42,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                }}
              >
                Add Location
              </Button>
            </div>

            <Row gutter={[24, 24]}>
              {locations.map((loc) => (
                <Col xs={24} sm={12} lg={8} key={loc.id}>
                  <div
                    style={{
                      borderRadius: 16,
                      border: "1px solid #f1f5f9",
                      background: "#ffffff",
                      padding: "20px",
                      position: "relative",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    {/* Top Right Ribbon */}
                    <div style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      background: '#3b82f6',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                      zIndex: 10
                    }}>
                      LOC
                      <div style={{
                        position: 'absolute',
                        bottom: -4,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderTop: '4px solid #1e3a8a',
                        borderRight: '4px solid transparent',
                      }} />
                    </div>

                    {/* Header Section */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 18,
                          border: "1px solid #bfdbfe",
                          flexShrink: 0
                        }}>
                          {loc.city ? loc.city.charAt(0).toUpperCase() : <EnvironmentOutlined />}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 16, color: "#1e293b", display: "block", lineHeight: 1.2 }}>
                            {loc.city}, {loc.state}
                          </Text>
                          <Text style={{ fontSize: 13, color: "#64748b" }}>
                            {loc.country}
                          </Text>
                        </div>
                      </div>
                      <Space size={2} style={{ marginRight: 24 }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: '#64748b' }} />}
                          onClick={() => showEditLocationDrawer(loc)}
                        />
                        <Popconfirm
                          title="Delete location?"
                          onConfirm={() => handleDeleteLocation(loc.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ef4444' }} />} />
                        </Popconfirm>
                      </Space>
                    </div>

                    {/* Pills Section */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      <div style={{
                        background: "#f8fafc",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #f1f5f9"
                      }}>
                        <EnvironmentOutlined style={{ color: "#3b82f6", fontSize: 14 }} />
                        <Text style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{loc.pincode}</Text>
                      </div>
                      <div style={{
                        background: "#f8fafc",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #f1f5f9"
                      }}>
                        <EnvironmentOutlined style={{ color: "#8b5cf6", fontSize: 14 }} />
                        <Text style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{loc.area}</Text>
                      </div>
                    </div>

                    {/* Grey Section (Tasks equivalent) */}
                    <div style={{
                      background: "#f8fafc",
                      borderRadius: "12px",
                      padding: "16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "4px", background: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </div>
                        <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Address Details</Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", flexShrink: 0 }} />
                        <Text style={{ fontSize: 13, color: "#334155" }}>
                          {loc.flatNumber}, {loc.street}
                        </Text>
                      </div>
                    </div>

                    {/* Footer Section equivalent */}
                    <div style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                        Status
                      </Text>
                      <Text style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>


                      </Text>
                    </div>
                  </div>
                </Col>
              ))}
              {locations.length === 0 && (
                <Col span={24}>
                  <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '2px dashed #e2e8f0'
                  }}>
                    <EnvironmentOutlined style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }} />
                    <Title level={5} style={{ color: '#64748b' }}>No locations added yet</Title>
                    <Button type="link" onClick={showAddLocationDrawer}>Add your first location</Button>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </div>
      )
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        padding: "0 24px",
        height: "calc(100vh - 64px)",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Premium Header */}
        <div style={styles.headerSection}>
          <Space align="center" size="middle">
            <div style={styles.iconContainer}>
              <SettingOutlined style={{ fontSize: 24 }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
                System Settings
              </Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>
                Configure your workspace, manage shifts, and customize branding.
              </Text>
            </div>
          </Space>
        </div>

        {/* Settings Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          type="line"
          tabBarStyle={{
            ...styles.tabStyle,
            background: '#fff',
            borderBottom: "1px solid rgba(0,0,0,0.05)",
            padding: "0 4px"
          }}
          style={{
            margin: 0,
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
          className="settings-tabs"
          items={tabItems}
        />


        {/* Add Location Drawer */}
        <Drawer
          title={
            <Space>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <EnvironmentOutlined style={{ fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', lineHeight: '1.2' }}>
                  {editingLocation ? 'Edit Company Location' : 'Add Company Location'}
                </div>
                <div style={{ fontWeight: 400, fontSize: 12, color: '#64748b' }}>
                  {editingLocation ? 'Update the company address details below' : 'Enter the company address details below'}
                </div>
              </div>
            </Space>
          }
          placement="right"
          onClose={() => setIsLocationDrawerVisible(false)}
          open={isLocationDrawerVisible}
          width={500}
          styles={{ body: { padding: '24px' } }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px' }}>
              <Button onClick={() => setIsLocationDrawerVisible(false)} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
              <Button type="primary" onClick={() => locationForm.submit()} style={{ borderRadius: 8, fontWeight: 600 }}>
                {editingLocation ? 'Update Location' : 'Save Location'}
              </Button>
            </div>
          }
        >
          <Form
            form={locationForm}
            layout="vertical"
            onFinish={handleLocationsSubmit}
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="flatNumber"
                  label={<span style={{ fontWeight: 500, color: '#475569' }}>Door / Flat Number</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. 101 or Suite 4" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="street"
                  label={<span style={{ fontWeight: 500, color: '#475569' }}>Street</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. Main St" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="area"
              label={<span style={{ fontWeight: 500, color: '#475569' }}>Area</span>}
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g. Downtown" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="city"
                  label={<span style={{ fontWeight: 500, color: '#475569' }}>City</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. San Francisco" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="state"
                  label={<span style={{ fontWeight: 500, color: '#475569' }}>State</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. California" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pincode"
                  label={<span style={{ fontWeight: 500, color: '#475569' }}>Pincode</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. 94105" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="country"
                  label={<span style={{ fontWeight: 500, color: '#475569' }}>Country</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. USA" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Drawer>

        {/* Modals and other components */}
        <Modal
          title={modalType === 'add' ? 'Add New Shift' : 'Edit Shift'}
          open={isShiftModalVisible}
          onCancel={() => {
            setIsShiftModalVisible(false);
            form.resetFields();
            setEditingShift(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleShiftSubmit}
            size="middle"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="name"
                label="Shift Name"
                rules={[{ required: true, message: 'Please enter shift name' }]}
              >
                <Input placeholder="e.g., Morning Shift" />
              </Form.Item>

              <Form.Item
                name="code"
                label="Shift Code"
                rules={[{ required: true, message: 'Please enter shift code' }]}
              >
                <Input placeholder="e.g., MS" maxLength={5} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Form.Item
                name="graceMinutes"
                label="Grace Period (minutes)"
                initialValue={30}
                rules={[{ required: true, message: 'Please enter grace period' }]}
              >
                <InputNumber min={0} max={120} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="lunchBreakMinutes"
                label="Lunch Break (minutes)"
                initialValue={60}
                rules={[{ required: true, message: 'Please enter lunch break' }]}
              >
                <InputNumber min={0} max={180} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="overtimeThreshold"
                label="Overtime Threshold (minutes)"
                initialValue={480}
                rules={[{ required: true, message: 'Please enter overtime threshold' }]}
              >
                <InputNumber min={0} max={720} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item
              name="isFlexible"
              label="Flexible Shift"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <Space>
                <Button onClick={() => {
                  setIsShiftModalVisible(false);
                  form.resetFields();
                  setEditingShift(null);
                }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={formLoading}
                >
                  {modalType === 'add' ? 'Add Shift' : 'Update Shift'}
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}

// ==========================================
// PREMIUM GLOBAL STYLES (SaaS UI OVERRIDES)
// ==========================================
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
    /* Table Header Styling */
    .ant-table-thead > tr > th {
      background: #f8fafc !important;
      color: #64748b !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      font-size: 11px !important;
      letter-spacing: 0.05em !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }
    
    .ant-table-row:hover > td {
      background: #f8fafc !important;
    }
    
    .ant-table {
      border-radius: 12px !important;
    }

    /* Tabs Styling */
    .ant-tabs-nav::before {
      border-bottom: 1px solid #f1f5f9 !important;
    }
    
    .ant-tabs-tab {
      transition: all 0.3s ease !important;
      margin: 0 16px 0 0 !important;
      padding: 12px 0 !important;
    }
    
    .ant-tabs-tab:hover {
      color: #2563eb !important;
    }
    
    .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #2563eb !important;
    }
    
    .ant-tabs-ink-bar {
      background: #2563eb !important;
      height: 3px !important;
      border-radius: 3px 3px 0 0 !important;
    }

    /* Form Elements */
    .ant-input, .ant-input-number, .ant-select-selector, .ant-picker {
      border-radius: 8px !important;
      border-color: #e2e8f0 !important;
      height: 40px !important;
      display: flex !important;
      align-items: center !important;
    }
    
    .ant-input:hover, .ant-input:focus, .ant-input-focused {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
    }

    /* Card Styling */
    .ant-card {
      transition: all 0.3s ease;
    }

    /* Hide Scrollbar while maintaining scrolling functionality */
    ::-webkit-scrollbar {
      display: none !important;
    }
    
    * {
      -ms-overflow-style: none !important;  /* IE and Edge */
      scrollbar-width: none !important;     /* Firefox */
    }

    /* Fixed Header/Tabs & Internal Content Scrolling (AntD 5.x) */
    .settings-tabs {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
        height: 100% !important;
    }
    
    .settings-tabs .ant-tabs-nav {
        flex: 0 0 auto !important;
        background: #fff !important;
        z-index: 10 !important;
    }

    .settings-tabs .ant-tabs-content-holder {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
        overflow: hidden !important;
    }

    .settings-tabs .ant-tabs-content {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
        height: 100% !important;
    }
    
    .settings-tabs .ant-tabs-tabpane {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow: hidden !important;
    }
  `}} />
);

export default function WrappedSettingsPage() {
  return (
    <>
      <GlobalStyles />
      <SettingsPage />
    </>
  );
}
