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
  theme,
  Select,
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
  BgColorsOutlined,
  LoadingOutlined,
  MailOutlined,
  GoogleOutlined,
  WindowsFilled,
  CloudOutlined,
  SafetyCertificateFilled,
  ReloadOutlined,
  InboxOutlined,
  StarFilled,
  PictureOutlined,
  ThunderboltFilled,
  LinkOutlined,
} from '@ant-design/icons';
import LogoCropper from '@/components/common/LogoCropper';
import { SettingsService, Shift, CreateShiftData, UpdateShiftData } from '@/services/settingsService';
import { TenantService, TenantProfile } from '@/services/tenantService';
import { CompanyLocationService } from '@/services/companyLocationService';
import { MailService, MailProvider } from '@/services/mailService';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
import { ApiError } from '@/lib/axios';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

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

export default function SettingsPage() {
  const { token } = theme.useToken();
  const { user, isLoading: authLoading, updateUser } = useAuth();

  // Dynamic UI Styles
  const styles = {
    headerSection: {
      marginBottom: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 8px 16px 8px",
      background: token.colorBgContainer,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      flex: "0 0 auto"
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: "14px",
      background: token.colorPrimaryBg,
      color: token.colorPrimary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 0 0 1px ${token.colorPrimaryBorder}`
    },
    sectionCard: {
      borderRadius: "16px",
      border: `1px solid ${token.colorBorderSecondary}`,
      boxShadow: token.boxShadowTertiary,
      background: token.colorBgContainer
    },
    tabStyle: {
      background: token.colorBgContainer,
      marginBottom: "0",
      padding: "0 8px"
    },
    locationCard: {
      padding: '20px',
      borderRadius: '16px',
      border: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer,
      transition: 'all 0.2s ease',
      boxShadow: token.boxShadowTertiary,
    },
    locationIcon: {
      width: 40,
      height: 40,
      borderRadius: '12px',
      background: token.colorFillAlter,
      color: token.colorTextSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      border: `1px solid ${token.colorBorderSecondary}`
    }
  };
  const { canReadSettings, canUpdateSettings, canDeleteSettings, canManageSettings, canReadMail, canUpdateMail } = usePermission();
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

  const hasShownMailError = React.useRef(false);
  useEffect(() => {
    if (activeTab === 'mail' && !canReadMail && !hasShownMailError.current) {
      messageApi.error("Access Denied: You don't have the required Mail permissions to view this configuration. Please contact your administrator.");
      hasShownMailError.current = true;
      setActiveTab('system');
    } else if (activeTab !== 'mail') {
      hasShownMailError.current = false;
    }
  }, [activeTab, canReadMail, messageApi, setActiveTab]);

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
  const [processingBG, setProcessingBG] = useState<string | null>(null);

  // Invoice Mail Settings State
  const [connectedEmails, setConnectedEmails] = useState<any[]>([]);
  const [invoiceMailSettings, setInvoiceMailSettings] = useState<any>(null);
  const [invoiceMailLoading, setInvoiceMailLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState<string | null>(null);

  const removeLogoBackground = async (imageUrl: string, isExistingVersion: boolean = false) => {
    try {
      setProcessingBG(imageUrl);

      if (!imageUrl) throw new Error("Could not find image to process.");

      const img = new Image();

      // Clean the URL and add a cache-buster to prevent CORS issues with cached versions
      let finalUrl = imageUrl;
      if (imageUrl.startsWith('http')) {
        img.crossOrigin = "anonymous";
        const separator = imageUrl.includes('?') ? '&' : '?';
        finalUrl = `${imageUrl}${separator}t=${new Date().getTime()}`;
      } else if (imageUrl.startsWith('/')) {
        // Handle relative paths
        img.crossOrigin = "anonymous";
      }

      img.src = finalUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error("Image load detail error:", e);
          reject(new Error("The browser blocked the image load. Try downloading the logo and re-uploading it as a fresh file."));
        };
      });

      if (img.width === 0 || img.height === 0) {
        throw new Error("The image appears to be empty or invalid.");
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Your browser does not support image processing.");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        throw new Error("Security Restriction: This logo is hosted on a server that blocks background removal. Please download and upload it again.");
      }

      const data = imageData.data;

      // 1. Better background detection: Check all 4 corners
      const corners = [
        { r: data[0], g: data[1], b: data[2] }, // Top-left
        { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] }, // Top-right
        { r: data[data.length - 4], g: data[data.length - 3], b: data[data.length - 2] } // Bottom-right
      ];

      // Default to white if corners are inconsistent
      let r_bg = 255, g_bg = 255, b_bg = 255;

      // If at least two corners match, use that as background
      if (Math.abs(corners[0].r - corners[1].r) < 10) {
        r_bg = corners[0].r; g_bg = corners[0].g; b_bg = corners[0].b;
      }

      const threshold = 60; // Increased tolerance for "dirty" backgrounds

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const diff_bg = Math.abs(r - r_bg) + Math.abs(g - g_bg) + Math.abs(b - b_bg);
        const diff_white = Math.abs(r - 255) + Math.abs(g - 255) + Math.abs(b - 255);

        // If it's close to the detected background OR close to white
        // Use a very high tolerance for white to catch light-gray fringes
        if (diff_bg < threshold || diff_white < 80) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const processedUrl = canvas.toDataURL('image/png');

      if (isExistingVersion) {
        try {
          const updatedProfile = await TenantService.updateProfile({
            croppedLogo: processedUrl
          });
          updateUser({
            tenantLogo: updatedProfile.settings?.logoUrl
          });
          fetchTenantProfile();
          messageApi.success('Background removed and saved!');
        } catch (apiErr) {
          throw new Error("Failed to save the new version to the server.");
        }
      } else {
        const newFile = {
          ...fileList[0],
          url: processedUrl,
          thumbUrl: processedUrl,
        };
        setFileList([newFile]);
        setIsSystemFormDirty(true);
        messageApi.success('Background cleared! Click "Save Branding" to finish.');
      }
    } catch (error: any) {
      console.error("BG removal failed:", error);
      messageApi.error(error?.message || 'Unexpected error during background removal');
    } finally {
      setProcessingBG(null);
    }
  };

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

  // Load data based on active tab
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
    if (user && activeTab === 'mail') {
      fetchInvoiceMailSettings();
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
      const newLogo = fileList[0];
      if (newLogo) {
        if (newLogo.url && newLogo.url.startsWith('data:')) {
          // Use the processed base64 (with transparency)
          payload.logo = newLogo.url;
        } else if (newLogo.originFileObj) {
          // Fallback to original file if no processing was done
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(newLogo.originFileObj as File);
          });
          payload.logo = await base64Promise;
        }
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

  const fetchInvoiceMailSettings = async () => {
    try {
      setInvoiceMailLoading(true);
      const response = await MailService.getInvoiceMailSettings();
      if (response) {
        setConnectedEmails(response.connectedAccounts || []);
        const settings = response.settings || [];
        setInvoiceMailSettings(settings.find((s: any) => s.is_default_invoice_mail) || settings[0] || null);
      }
    } catch (error) {
      console.error('Failed to fetch invoice mail settings:', error);
    } finally {
      setInvoiceMailLoading(false);
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
        <Text style={{ fontSize: 12, color: isFlexible ? 'var(--text-primary)' : 'var(--text-holiday)' }}>
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
        <Text style={{ fontSize: 12, color: isActive ? 'var(--text-holiday)' : 'var(--text-leave)' }}>
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
            style={{ color: 'var(--premium-blue)' }}
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
              style={{ color: 'var(--text-leave)' }}
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
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
          textAlign: 'center'
        }}>
          <div style={{ padding: 100, textAlign: 'center' }}>
            <Spin size="large" tip="Loading">
              <div style={{ padding: 20 }} />
            </Spin>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!canReadSettings || !user) {
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
          padding: "20px 8px 40px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          gap: 20
        }}>
          {/* Hero / Identity Banner */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 50%, #8B5CF6 100%)',
            padding: '28px 32px',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.25)',
            flexShrink: 0
          }}>
            {/* Decorative glow blobs */}
            <div style={{
              position: 'absolute',
              top: -60,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -80,
              left: 20,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0) 70%)',
              pointerEvents: 'none'
            }} />

            <Row gutter={[24, 24]} align="middle" style={{ position: 'relative', zIndex: 1 }}>
              <Col xs={24} md={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {tenantProfile?.settings?.logoUrl ? (
                      <img
                        src={tenantProfile.settings.logoUrl}
                        alt="Company logo"
                        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                      />
                    ) : (
                      <PictureOutlined style={{ fontSize: 28, color: '#fff' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Workspace Identity
                      </Text>
                      <div style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.18)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0
                      }}>
                        <StarFilled style={{ fontSize: 9, color: '#FBBF24' }} /> PREMIUM
                      </div>
                    </div>
                    <Title
                      level={3}
                      style={{
                        color: '#fff',
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 24,
                        lineHeight: 1.25,
                        wordBreak: 'break-word'
                      }}
                    >
                      {tenantProfile?.name || 'Your Company'}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, display: 'block', marginTop: 4 }}>
                      Customize your branding, manage logo versions, and refine how your workspace presents itself.
                    </Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Row gutter={12}>
                  <Col span={12}>
                    <div style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 14,
                      padding: '14px 16px'
                    }}>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Logo Versions
                      </Text>
                      <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginTop: 4 }}>
                        {logoVersions.length}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 14,
                      padding: '14px 16px'
                    }}>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Status
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: tenantProfile?.settings?.logoUrl ? '#34D399' : '#FBBF24',
                          boxShadow: tenantProfile?.settings?.logoUrl
                            ? '0 0 0 3px rgba(52, 211, 153, 0.25)'
                            : '0 0 0 3px rgba(251, 191, 36, 0.25)'
                        }} />
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                          {tenantProfile?.settings?.logoUrl ? 'Active' : 'Pending'}
                        </Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>

          {/* Branding Card */}
          <Card
            variant="borderless"
            style={{ ...styles.sectionCard, width: "100%", borderRadius: 20 }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{
              padding: "20px 32px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: `linear-gradient(180deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20
            }}>
              <Space size={14} align="center">
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
                }}>
                  <SettingOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 17, color: "var(--text-primary)", display: 'block', letterSpacing: '-0.01em' }}>
                    Company Branding
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Set your display name and upload a logo for use across the workspace
                  </Text>
                </div>
              </Space>
            </div>

            <div style={{ padding: 32 }}>
              <Row gutter={[40, 32]} align="top">
                {/* Left Column: Branding Form */}
                <Col xs={24} lg={11} xl={10}>
                  <Form
                    form={systemForm}
                    layout="vertical"
                    onFinish={handleSystemSubmit}
                    onValuesChange={() => setIsSystemFormDirty(true)}
                  >
                    <Form.Item
                      name="name"
                      label={
                        <Space size={6}>
                          <Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Company Name</Text>
                          <Text style={{ color: '#EF4444', fontSize: 13 }}>*</Text>
                        </Space>
                      }
                      rules={[{ required: true, message: 'Please enter company name' }]}
                    >
                      <Input
                        placeholder="Enter company name"
                        prefix={<SettingOutlined style={{ color: token.colorTextTertiary, marginRight: 6 }} />}
                        style={{ height: 46, borderRadius: 12, fontSize: 14 }}
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Space size={8}>
                            <Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Company Logo</Text>
                            {tenantProfile?.settings?.logoUrl && fileList.length === 0 && (
                              <Tag color="success" icon={<CheckCircleFilled />} style={{ margin: 0, borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                                Active
                              </Tag>
                            )}
                          </Space>
                        </div>
                      }
                      style={{ marginBottom: 20 }}
                    >
                      <div style={{
                        background: token.colorFillAlter,
                        borderRadius: 14,
                        padding: 16,
                        border: `1px dashed ${token.colorBorder}`
                      }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                          <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => {
                              setFileList(fileList);
                              setIsSystemFormDirty(true);
                            }}
                            beforeUpload={() => false}
                            maxCount={1}
                            className="settings-logo-upload"
                          >
                            {fileList.length < 1 && (
                              <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                                <InboxOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>Upload</div>
                              </div>
                            )}
                          </Upload>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <Text strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                              Drop your logo here
                            </Text>
                            <Text style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', lineHeight: 1.5 }}>
                              Recommended: 200×50px transparent PNG
                            </Text>
                            <Text style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.7 }}>
                              PNG, JPG up to 2MB
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Form.Item>

                    {fileList.length > 0 && (
                      <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                          block
                          icon={processingBG === (fileList[0].url || fileList[0].thumbUrl) ? <LoadingOutlined /> : <BgColorsOutlined />}
                          loading={processingBG === (fileList[0].url || fileList[0].thumbUrl)}
                          onClick={() => {
                            const url = fileList[0].url || fileList[0].thumbUrl;
                            if (url) removeLogoBackground(url, false);
                          }}
                          style={{
                            borderRadius: 12,
                            height: 44,
                            color: 'var(--premium-blue)',
                            borderColor: 'rgba(59, 130, 246, 0.35)',
                            background: 'rgba(59, 130, 246, 0.06)',
                            fontWeight: 600
                          }}
                        >
                          Remove White Background
                        </Button>
                      </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={formLoading}
                        disabled={!isSystemFormDirty}
                        size="large"
                        block
                        icon={!formLoading && <ThunderboltFilled />}
                        style={{
                          borderRadius: 12,
                          height: 50,
                          fontWeight: 700,
                          fontSize: 14,
                          letterSpacing: '0.01em',
                          background: !isSystemFormDirty
                            ? token.colorFillSecondary
                            : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                          color: !isSystemFormDirty ? token.colorTextDisabled : '#fff',
                          border: 'none',
                          boxShadow: !isSystemFormDirty ? 'none' : '0 8px 20px -6px rgba(59, 130, 246, 0.45)'
                        }}
                      >
                        Save Branding Changes
                      </Button>
                    </Form.Item>
                  </Form>
                </Col>

                {/* Right Column: Logo Gallery */}
                <Col xs={24} lg={13} xl={14} style={{ borderLeft: `1px solid ${token.colorBorderSecondary}`, paddingLeft: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <Space size={8} align="center">
                        <PictureOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
                        <Text strong style={{ fontSize: 15, color: "var(--text-primary)", letterSpacing: '-0.01em' }}>
                          Logo Library
                        </Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        Switch between saved versions or upload a fresh one
                      </Text>
                    </div>
                    {logoVersions.length > 0 && (
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-secondary)'
                      }}>
                        {logoVersions.length} {logoVersions.length === 1 ? 'version' : 'versions'}
                      </div>
                    )}
                  </div>

                  {logoVersions.length > 0 ? (
                    <Row gutter={[16, 16]}>
                      {logoVersions.map((url, index) => {
                        const isActive = tenantProfile?.settings?.logoUrl === url;
                        return (
                          <Col key={index} xs={24} sm={12}>
                            <div
                              style={{
                                borderRadius: 14,
                                overflow: 'hidden',
                                border: isActive
                                  ? `2px solid ${token.colorPrimary}`
                                  : `1px solid ${token.colorBorderSecondary}`,
                                position: 'relative',
                                background: token.colorBgContainer,
                                transition: 'all 0.25s ease',
                                boxShadow: isActive
                                  ? '0 10px 24px -10px rgba(37, 99, 235, 0.35)'
                                  : '0 1px 2px rgba(0,0,0,0.03)'
                              }}
                            >
                              {isActive && (
                                <div style={{
                                  position: 'absolute',
                                  top: 10,
                                  right: 10,
                                  zIndex: 10,
                                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                  color: '#fff',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                }}>
                                  <CheckCircleFilled style={{ fontSize: 10 }} /> ACTIVE
                                </div>
                              )}
                              <div style={{
                                height: 110,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 16,
                                background: `repeating-conic-gradient(${token.colorFillAlter} 0% 25%, ${token.colorBgContainer} 0% 50%) 50% / 16px 16px`,
                                borderBottom: `1px solid ${token.colorBorderSecondary}`
                              }}>
                                <img
                                  src={url}
                                  alt={`Version ${index + 1}`}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>
                              <div style={{
                                padding: '10px 12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: token.colorBgContainer
                              }}>
                                <Text style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  Version {index + 1}
                                </Text>
                                <Space size={4}>
                                  <Tooltip title="Crop / Edit">
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<EditOutlined style={{ color: 'var(--premium-blue)' }} />}
                                      onClick={() => {
                                        setImageToCrop(url);
                                        setIsCropperVisible(true);
                                      }}
                                      style={{ borderRadius: 8 }}
                                    />
                                  </Tooltip>
                                  {!isActive && (
                                    <Tooltip title="Set as active logo">
                                      <Button
                                        size="small"
                                        type="primary"
                                        ghost
                                        onClick={() => handleSetAsFinal(url)}
                                        style={{ borderRadius: 8, fontSize: 11, fontWeight: 600, height: 26, padding: '0 10px' }}
                                      >
                                        Use
                                      </Button>
                                    </Tooltip>
                                  )}
                                  <Popconfirm
                                    title="Delete version?"
                                    description="This action cannot be undone."
                                    onConfirm={() => handleDeleteVersion(url)}
                                    okText="Delete"
                                    cancelText="No"
                                    okButtonProps={{ danger: true, size: 'small' }}
                                  >
                                    <Tooltip title="Delete">
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                                        style={{ borderRadius: 8 }}
                                      />
                                    </Tooltip>
                                  </Popconfirm>
                                </Space>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    <div style={{
                      padding: '60px 40px',
                      textAlign: 'center',
                      background: token.colorFillAlter,
                      borderRadius: 16,
                      border: `1px dashed ${token.colorBorder}`
                    }}>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        margin: '0 auto 16px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorTextTertiary
                      }}>
                        <PictureOutlined style={{ fontSize: 24 }} />
                      </div>
                      <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
                        No logo versions yet
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Upload your first logo on the left to start building your library.
                      </Text>
                    </div>
                  )}
                </Col>
              </Row>
            </div>
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
              background: 'var(--bg-slate-50)',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <Space align="center" size="middle">
                <div style={{ ...styles.iconContainer, width: 40, height: 40, borderRadius: 10, background: 'var(--bg-pure-white)' }}>
                  <EnvironmentOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
                    Company Locations
                  </Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 14 }}>
                    Manage your company office addresses and physical locations.
                  </Text>
                </div>
              </Space>
              {canUpdateSettings && (
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
              )}
            </div>

            <Row gutter={[24, 24]}>
              {locations.map((loc) => (
                <Col xs={24} sm={12} lg={8} key={loc.id}>
                  <div
                    style={{
                      borderRadius: 16,
                      border: "1px solid var(--border-slate-100)",
                      background: "var(--bg-secondary)",
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
                        borderTop: '4px solid var(--text-blue-900)',
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
                          backgroundColor: "var(--bg-blue-50)",
                          color: "var(--text-blue-600)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 18,
                          border: "1px solid var(--border-blue-200)",
                          flexShrink: 0
                        }}>
                          {loc.city ? loc.city.charAt(0).toUpperCase() : <EnvironmentOutlined />}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 16, color: "var(--text-slate-900)", display: "block", lineHeight: 1.2 }}>
                            {loc.city}, {loc.state}
                          </Text>
                          <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>
                            {loc.country}
                          </Text>
                        </div>
                      </div>
                      <Space size={2} style={{ marginRight: 24 }}>
                        {canUpdateSettings && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: '#64748b' }} />}
                            onClick={() => showEditLocationDrawer(loc)}
                          />
                        )}
                        {canDeleteSettings && (
                          <Popconfirm
                            title="Delete location?"
                            onConfirm={() => handleDeleteLocation(loc.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ef4444' }} />} />
                          </Popconfirm>
                        )}
                      </Space>
                    </div>

                    {/* Pills Section */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      <div style={{
                        background: "var(--bg-slate-50)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid var(--border-slate-100)"
                      }}>
                        <EnvironmentOutlined style={{ color: "var(--premium-blue)", fontSize: 14 }} />
                        <Text style={{ fontSize: 13, color: "var(--text-slate-700)", fontWeight: 500 }}>{loc.pincode}</Text>
                      </div>
                      <div style={{
                        background: "var(--bg-slate-50)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid var(--border-slate-100)"
                      }}>
                        <EnvironmentOutlined style={{ color: "var(--text-sky-500)", fontSize: 14 }} />
                        <Text style={{ fontSize: 13, color: "var(--text-slate-700)", fontWeight: 500 }}>{loc.area}</Text>
                      </div>
                    </div>

                    {/* Grey Section (Tasks equivalent) */}
                    <div style={{
                      background: "var(--bg-slate-50)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "4px", background: "var(--border-slate-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </div>
                        <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 600 }}>Address Details</Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-slate-200)", flexShrink: 0 }} />
                        <Text style={{ fontSize: 13, color: "var(--text-slate-700)" }}>
                          {loc.flatNumber}, {loc.street}
                        </Text>
                      </div>
                    </div>

                    {/* Footer Section equivalent */}
                    <div style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid var(--border-slate-100)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                        Status
                      </Text>
                      <Text style={{ fontSize: 11, color: "var(--text-slate-500)", fontWeight: 500 }}>


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
                    background: 'var(--bg-slate-50)',
                    borderRadius: '16px',
                    border: '2px dashed var(--border-slate-200)'
                  }}>
                    <EnvironmentOutlined style={{ fontSize: 48, color: 'var(--text-slate-300)', marginBottom: 16 }} />
                    <Title level={5} style={{ color: 'var(--text-slate-500)' }}>No locations added yet</Title>
                    {canUpdateSettings && <Button type="link" onClick={showAddLocationDrawer}>Add your first location</Button>}
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </div>
      )
    },
    {
      key: 'mail',
      label: (
        <Space size={8} style={{ padding: "4px 8px" }}>
          <MailOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>Mail Configuration</span>
        </Space>
      ),
      children: (
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "20px 8px 40px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          gap: 20
        }}>

          {/* Default Invoice Mail Card */}
          <Card
            variant="borderless"
            style={{ ...styles.sectionCard, width: "100%", borderRadius: 20 }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{
              padding: "20px 32px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: `linear-gradient(180deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20
            }}>
              <Space size={14} align="center">
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 1px rgba(124, 58, 237, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
                }}>
                  <MailOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 17, color: "var(--text-primary)", display: 'block', letterSpacing: '-0.01em' }}>
                    Default Invoice Mail
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Choose which connected mailbox will deliver invoices to your clients
                  </Text>
                </div>
              </Space>
            </div>

            <div style={{ padding: 32 }}>
              {connectedEmails.length === 0 ? (
                <div style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: token.colorFillAlter,
                  borderRadius: 16,
                  border: `1px dashed ${token.colorBorder}`
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                    color: '#B45309',
                    margin: '0 auto 16px auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px -8px rgba(245, 158, 11, 0.3)'
                  }}>
                    <InboxOutlined style={{ fontSize: 28 }} />
                  </div>
                  <Text strong style={{ display: 'block', fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>
                    No email accounts connected
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', maxWidth: 420, margin: '0 auto 20px' }}>
                    Connect a Google or Microsoft account from the Integrations page to start sending invoices from your own domain.
                  </Text>
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={() => router.push('/integrations')}
                    style={{
                      borderRadius: 10,
                      height: 40,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
                      border: 'none',
                      boxShadow: '0 8px 20px -6px rgba(124, 58, 237, 0.45)'
                    }}
                  >
                    Connect Email Account
                  </Button>
                </div>
              ) : (
                <Row gutter={[24, 24]}>
                  {/* Selector + accounts list */}
                  <Col xs={24} md={14}>
                    <div style={{ marginBottom: 20 }}>
                      <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                        Active Invoice Sender
                      </Text>
                      <Select
                        placeholder="Select an email account"
                        style={{ width: '100%' }}
                        size="large"
                        value={invoiceMailSettings?.email}
                        onChange={async (email) => {
                          const account = connectedEmails.find(a => a.email === email);
                          if (account) {
                            try {
                              setInvoiceMailLoading(true);
                              await MailService.setInvoiceMail({
                                email: account.email,
                                provider: account.provider,
                                integrationId: account.id
                              });
                              messageApi.success('Invoice mail set. Please verify the link sent to your inbox.');
                              fetchInvoiceMailSettings();
                            } catch (error: any) {
                              messageApi.error(error.message || 'Failed to set invoice mail');
                            } finally {
                              setInvoiceMailLoading(false);
                            }
                          }
                        }}
                        loading={invoiceMailLoading}
                        suffixIcon={<MailOutlined style={{ color: token.colorTextTertiary }} />}
                        optionLabelProp="label"
                      >
                        {connectedEmails.map(account => {
                          const providerColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
                            GOOGLE: { bg: '#FEF2F2', text: '#DC2626', icon: <GoogleOutlined /> },
                            MICROSOFT: { bg: '#EFF6FF', text: '#1D4ED8', icon: <WindowsFilled /> },
                          };
                          const p = providerColors[account.provider] || { bg: '#F0FDF4', text: '#15803D', icon: <CloudOutlined /> };
                          return (
                            <Select.Option
                              key={account.email}
                              value={account.email}
                              label={
                                <Space size={8}>
                                  <span style={{ color: p.text, fontSize: 14 }}>{p.icon}</span>
                                  <span style={{ fontWeight: 500 }}>{account.email}</span>
                                </Space>
                              }
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  background: p.bg,
                                  color: p.text,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {p.icon}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: 13 }}>{account.email}</div>
                                  <div style={{ fontSize: 11, color: token.colorTextTertiary }}>{account.provider}</div>
                                </div>
                              </div>
                            </Select.Option>
                          );
                        })}
                      </Select>
                      <Text style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginTop: 8 }}>
                        Invoices will be sent from this address. Recipients see your domain.
                      </Text>
                    </div>

                    <div>
                      <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 10 }}>
                        Connected Accounts
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {connectedEmails.map(account => {
                          const isSelected = invoiceMailSettings?.email === account.email;
                          const providerColors: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
                            GOOGLE: { bg: '#FEF2F2', text: '#DC2626', icon: <GoogleOutlined />, label: 'Google' },
                            MICROSOFT: { bg: '#EFF6FF', text: '#1D4ED8', icon: <WindowsFilled />, label: 'Microsoft' },
                          };
                          const p = providerColors[account.provider] || { bg: '#F0FDF4', text: '#15803D', icon: <CloudOutlined />, label: account.provider };
                          return (
                            <div
                              key={account.email}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                borderRadius: 12,
                                border: isSelected ? `1.5px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
                                background: isSelected
                                  ? 'linear-gradient(180deg, rgba(124, 58, 237, 0.04) 0%, rgba(124, 58, 237, 0.01) 100%)'
                                  : token.colorBgContainer,
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 4px 12px -4px rgba(124, 58, 237, 0.2)' : 'none'
                              }}
                            >
                              <Space size={12} align="center">
                                <div style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: p.bg,
                                  color: p.text,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 16
                                }}>
                                  {p.icon}
                                </div>
                                <div>
                                  <Text strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary)' }}>
                                    {account.email}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {p.label} · Connected
                                  </Text>
                                </div>
                              </Space>
                              {isSelected && (
                                <div style={{
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
                                  color: '#fff',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: '0.05em',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}>
                                  <StarFilled style={{ fontSize: 9 }} /> DEFAULT
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Col>

                  {/* Status panel */}
                  <Col xs={24} md={10}>
                    <div style={{
                      padding: 20,
                      borderRadius: 16,
                      height: '100%',
                      background: invoiceMailSettings
                        ? invoiceMailSettings.is_verified
                          ? 'linear-gradient(160deg, #F0FDF4 0%, #DCFCE7 100%)'
                          : 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 100%)'
                        : token.colorFillAlter,
                      border: `1px solid ${invoiceMailSettings
                        ? invoiceMailSettings.is_verified ? '#BBF7D0' : '#FDE68A'
                        : token.colorBorderSecondary}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {invoiceMailSettings ? (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: -30,
                            right: -30,
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: invoiceMailSettings.is_verified
                              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)'
                              : 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
                            pointerEvents: 'none'
                          }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                            <div style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              background: invoiceMailSettings.is_verified
                                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: invoiceMailSettings.is_verified
                                ? '0 8px 20px -6px rgba(34, 197, 94, 0.5)'
                                : '0 8px 20px -6px rgba(245, 158, 11, 0.5)'
                            }}>
                              {invoiceMailSettings.is_verified
                                ? <SafetyCertificateFilled style={{ fontSize: 24 }} />
                                : <ClockCircleOutlined style={{ fontSize: 22 }} />
                              }
                            </div>
                            <div>
                              <Text strong style={{
                                fontSize: 16,
                                display: 'block',
                                color: invoiceMailSettings.is_verified ? '#14532D' : '#78350F',
                                letterSpacing: '-0.01em'
                              }}>
                                {invoiceMailSettings.is_verified ? 'Domain Verified' : 'Verification Pending'}
                              </Text>
                              <Text style={{
                                fontSize: 12,
                                color: invoiceMailSettings.is_verified ? '#166534' : '#92400E',
                                fontWeight: 500
                              }}>
                                {invoiceMailSettings.is_verified ? 'Ready to send' : 'Action required'}
                              </Text>
                            </div>
                          </div>

                          <div style={{
                            padding: '12px 14px',
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 10,
                            border: `1px solid ${invoiceMailSettings.is_verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                            position: 'relative'
                          }}>
                            <Text style={{
                              fontSize: 11,
                              color: invoiceMailSettings.is_verified ? '#166534' : '#92400E',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              Account
                            </Text>
                            <Text strong style={{
                              fontSize: 13,
                              display: 'block',
                              color: invoiceMailSettings.is_verified ? '#14532D' : '#78350F',
                              wordBreak: 'break-all',
                              marginTop: 2
                            }}>
                              {invoiceMailSettings.email}
                            </Text>
                          </div>

                          <Text style={{
                            fontSize: 12,
                            color: invoiceMailSettings.is_verified ? '#166534' : '#92400E',
                            lineHeight: 1.6,
                            position: 'relative'
                          }}>
                            {invoiceMailSettings.is_verified
                              ? 'All invoices sent through Z-Space will be delivered from this address. Recipients will see your company name and domain.'
                              : 'A verification link was sent to your inbox. Click the link to activate this email for sending invoices.'}
                          </Text>

                          {!invoiceMailSettings.is_verified && (
                            <Button
                              type="primary"
                              icon={<ReloadOutlined />}
                              block
                              loading={resendingVerification === invoiceMailSettings.email}
                              onClick={async () => {
                                try {
                                  setResendingVerification(invoiceMailSettings.email);
                                  await MailService.resendInvoiceMailVerification(invoiceMailSettings.email);
                                  messageApi.success('Verification email resent!');
                                } catch (error: any) {
                                  messageApi.error(error.message || 'Failed to resend verification');
                                } finally {
                                  setResendingVerification(null);
                                }
                              }}
                              style={{
                                borderRadius: 10,
                                height: 42,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                border: 'none',
                                boxShadow: '0 6px 16px -4px rgba(245, 158, 11, 0.4)'
                              }}
                            >
                              Resend Verification Email
                            </Button>
                          )}
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: token.colorBgContainer,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            margin: '0 auto 12px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: token.colorTextTertiary
                          }}>
                            <MailOutlined style={{ fontSize: 24 }} />
                          </div>
                          <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
                            No default mail selected
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Pick a connected account on the left to set it as your invoice sender.
                          </Text>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          </Card>
        </div>
      )
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        margin: "0 -24px",
        height: "calc(100vh - 64px)",
        background: "var(--bg-pure-white)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Premium Header */}
        <TimeTrackingHeader
          style={{ padding: '10.5px 32px' }}
          icon={<SettingOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="System Settings"
          description="Configure your workspace, manage shifts, and customize branding."
        />

        <div style={{ padding: "0 32px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Settings Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            type="line"
            tabBarStyle={{
              ...styles.tabStyle,
              background: 'var(--bg-secondary)',
              borderBottom: "1px solid var(--border-color)",
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
        </div>

        {/* Add Location Drawer */}
        <Drawer
          title={
            <Space>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <EnvironmentOutlined style={{ fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-slate-900)', lineHeight: '1.2' }}>
                  {editingLocation ? 'Edit Company Location' : 'Add Company Location'}
                </div>
                <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-slate-500)' }}>
                  {editingLocation ? 'Update the company address details below' : 'Enter the company address details below'}
                </div>
              </div>
            </Space>
          }
          placement="right"
          onClose={() => setIsLocationDrawerVisible(false)}
          open={isLocationDrawerVisible}
          width={500}
          styles={{ 
            body: { padding: '24px' },
            header: { 
              background: 'var(--bg-secondary)', 
              borderBottom: '1px solid var(--border-slate-100)',
              padding: '16px 24px'
            },
            content: { background: 'var(--bg-secondary)' },
            footer: { 
              background: 'var(--bg-secondary)', 
              borderTop: '1px solid var(--border-slate-100)',
              padding: '16px 24px'
            },
            mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.2)' }
          }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
                  label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>Door / Flat Number</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. 101 or Suite 4" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="street"
                  label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>Street</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. Main St" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="area"
              label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>Area</span>}
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g. Downtown" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="city"
                  label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>City</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. San Francisco" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="state"
                  label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>State</span>}
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
                  label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>Pincode</span>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. 94105" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="country"
                  label={<span style={{ fontWeight: 500, color: 'var(--text-slate-600)' }}>Country</span>}
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
