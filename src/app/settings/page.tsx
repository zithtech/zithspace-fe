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
    position: "sticky" as const,
    top: 0,
    zIndex: 110,
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 4px",
    background: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
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
    position: "sticky" as const,
    top: "84px", // height of headerSection
    zIndex: 100,
    background: "#ffffff",
    marginBottom: "24px",
    padding: "0"
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

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        padding: "0 24px 24px 24px",
        minHeight: "100%",
        background: "#ffffff"
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
          style={{ margin: "0 auto" }}
        >
          <Tabs.TabPane
            tab={
              <Space size={8} style={{ padding: "4px 8px" }}>
                <SettingOutlined style={{ fontSize: 16 }} />
                <span style={{ fontWeight: 600 }}>System Information</span>
              </Space>
            }
            key="system"
          >
            <Card
              bordered={false}
              style={{ ...styles.sectionCard, maxWidth: 850, marginTop: 8 }}
              styles={{ body: { padding: "32px" } }}
              title={
                <Space size={10} style={{ padding: "12px 0" }}>
                  <div style={{ ...styles.iconContainer, width: 32, height: 32, borderRadius: 8 }}>
                    <SettingOutlined style={{ fontSize: 16 }} />
                  </div>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Company Branding</span>
                </Space>
              }
            >
              <Form
                form={systemForm}
                layout="vertical"
                onFinish={handleSystemSubmit}
              >
                <Form.Item
                  name="name"
                  label="Company Name"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input placeholder="Enter company name" />
                </Form.Item>

                <Form.Item label="Company Logo">
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    beforeUpload={() => false} // Prevent auto upload
                    maxCount={1}
                  >
                    {fileList.length < 1 && (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                  <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                    {fileList.length > 0 && fileList[0].status === 'done' && (
                      <div style={{ width: 'fit-content', marginTop: 8 }}>
                        <EditOutlined
                          style={{
                            cursor: 'pointer',
                            color: '#2563eb',
                            fontSize: 18,
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            background: '#eff6ff',
                            border: '1px dashed #bfdbfe'
                          }}
                          onClick={() => {
                            if (fileList[0].url) {
                              setImageToCrop(fileList[0].url);
                              setIsCropperVisible(true);
                            }
                          }}
                          title="Edit / Crop Logo"
                        />
                      </div>
                    )}
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Recommended size: 200x50px. Max size: 2MB.
                    </Text>
                  </Space>
                </Form.Item>

                <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={formLoading}
                    size="large"
                    style={{
                      borderRadius: 10,
                      height: 48,
                      padding: "0 32px",
                      fontWeight: 600,
                      boxShadow: "0 4px 12px rgba(22, 119, 255, 0.2)"
                    }}
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>

              {/* Logo Versions Gallery */}
              {logoVersions.length > 0 && (
                <div style={{ marginTop: 48, borderTop: '1px solid #f1f5f9', paddingTop: 32 }}>
                  <div style={{ marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#334155" }}>Logo Versions</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Previously uploaded and cropped versions for branding.</Text>
                  </div>
                  <Row gutter={[16, 16]}>
                    {logoVersions.map((url, index) => (
                      <Col key={index} style={{ flex: '0 0 20%', maxWidth: '20%' }}>
                        <Card
                          hoverable
                          styles={{ body: { padding: 0 } }}
                          style={{
                            borderRadius: "14px",
                            overflow: 'hidden',
                            borderColor: tenantProfile?.settings?.logoUrl === url ? '#2563eb' : '#f1f5f9',
                            borderWidth: tenantProfile?.settings?.logoUrl === url ? 2 : 1,
                            transition: "all 0.3s ease",
                            position: 'relative',
                          }}
                        >
                          {tenantProfile?.settings?.logoUrl === url && (
                            <CheckCircleFilled style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              color: '#1677ff',
                              fontSize: 18,
                              zIndex: 1,
                              background: '#fff',
                              borderRadius: '50%'
                            }} />
                          )}
                          <div style={{
                            height: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f9f9f9',
                            padding: 12
                          }}>
                            <img src={url} alt={`Version ${index}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          </div>
                          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <EditOutlined
                                style={{
                                  cursor: 'pointer',
                                  color: '#2563eb',
                                  fontSize: 15,
                                  padding: '4px',
                                  borderRadius: '6px',
                                  transition: 'all 0.2s',
                                  background: '#eff6ff'
                                }}
                                onClick={() => {
                                  setImageToCrop(url);
                                  setIsCropperVisible(true);
                                }}
                                title="Edit / Crop"
                              />
                              {tenantProfile?.settings?.logoUrl !== url && (
                                <Button
                                  size="small"
                                  type="primary"
                                  ghost
                                  style={{ fontSize: 11, borderRadius: 6 }}
                                  onClick={() => handleSetAsFinal(url)}
                                >
                                  Set Final
                                </Button>
                              )}
                            </div>

                            <div style={{ padding: '0 4px' }}>
                              <Popconfirm
                                title="Delete logo version?"
                                description="Are you sure?"
                                onConfirm={() => handleDeleteVersion(url)}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                              >
                                <DeleteOutlined
                                  style={{
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    fontSize: 15,
                                    transition: 'all 0.2s'
                                  }}
                                  title="Delete Version"
                                />
                              </Popconfirm>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card>

            {/* Cropper Modal */}
            <LogoCropper
              image={imageToCrop}
              open={isCropperVisible}
              onClose={() => setIsCropperVisible(false)}
              onCropComplete={handleCropComplete}
              loading={cropLoading}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space size={8} style={{ padding: "4px 8px" }}>
                <EnvironmentOutlined style={{ fontSize: 16 }} />
                <span style={{ fontWeight: 600 }}>Company Location</span>
              </Space>
            }
            key="location"
          >
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
                          ACTIVE
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
          </Tabs.TabPane>
        </Tabs>

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

    /* Custom Scrollbar for Gallery */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
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
