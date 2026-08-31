'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useTheme } from '@/context/ThemeContext';
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
  BankOutlined,
  PhoneOutlined,
  NumberOutlined,
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
  CloseOutlined,
  AppstoreOutlined,
  RobotOutlined
} from '@ant-design/icons';
import LogoCropper from '@/components/common/LogoCropper';
import { SettingsService, Shift, CreateShiftData, UpdateShiftData } from '@/services/settingsService';
import { TenantService, TenantProfile } from '@/services/tenantService';
import {
  CompanyDetailsService,
  CompanyBranch,
  CompanyDetails,
  formatAddress,
} from '@/services/companyDetailsService';
import { MailService, MailProvider } from '@/services/mailService';
import { dashboardService } from '@/services/dashboardService';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
import { ApiError } from '@/lib/axios';
import { History } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useActivitySource } from '@/hooks/useActivitySource';
import { drawerFormStyles as formStyles, SectionCard } from "@/components/common/DrawerSection";
import AiSettingsPanel from "@/components/settings/AiSettingsPanel";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const { Title, Text, Paragraph } = Typography;

/**
 * The detailed postal address, in the order it reads on an envelope. Shared by
 * the registered-company form and the branch drawer so the two never drift.
 */
const COMPANY_ADDRESS_FIELDS: { name: string; label: string; placeholder: string; rules?: any[]; normalize?: (v: string) => string }[] = [
  { name: 'doorNumber', label: 'Door / Flat Number', placeholder: 'e.g. 101 or Suite 4' },
  { name: 'floor', label: 'Floor', placeholder: 'e.g. 3rd Floor' },
  { name: 'building', label: 'Building', placeholder: 'e.g. Prestige Tower' },
  { name: 'area', label: 'Area', placeholder: 'e.g. Indiranagar' },
  { name: 'street', label: 'Street', placeholder: 'e.g. 100 Feet Road' },
  { name: 'city', label: 'City', placeholder: 'e.g. Bengaluru', rules: [{ pattern: /^[a-zA-Z\s]+$/, message: 'Only alphabets allowed' }], normalize: (v) => (v || '').replace(/[^a-zA-Z\s]/g, '') },
  { name: 'district', label: 'District', placeholder: 'e.g. Bengaluru Urban', rules: [{ pattern: /^[a-zA-Z\s]+$/, message: 'Only alphabets allowed' }], normalize: (v) => (v || '').replace(/[^a-zA-Z\s]/g, '') },
  { name: 'state', label: 'State', placeholder: 'e.g. Karnataka', rules: [{ pattern: /^[a-zA-Z\s]+$/, message: 'Only alphabets allowed' }], normalize: (v) => (v || '').replace(/[^a-zA-Z\s]/g, '') },
  { name: 'pincode', label: 'Pincode', placeholder: 'e.g. 560038', rules: [{ pattern: /^[0-9]+$/, message: 'Only numbers allowed' }], normalize: (v) => (v || '').replace(/\D/g, '') },
  { name: 'country', label: 'Country', placeholder: 'e.g. India', rules: [{ pattern: /^[a-zA-Z\s]+$/, message: 'Only alphabets allowed' }], normalize: (v) => (v || '').replace(/[^a-zA-Z\s]/g, '') },
];

/** One read-only label/value pair in the saved company-details view. */
const DetailField = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div style={{ marginBottom: 18 }}>
    <Text
      style={{
        display: 'block',
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-slate-400)',
        marginBottom: 4,
      }}
    >
      {label}
    </Text>
    <Space size={6} align="center">
      {icon}
      <Text style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>
        {value || <span style={{ color: 'var(--text-slate-300)' }}>—</span>}
      </Text>
    </Space>
  </div>
);

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
  useActivitySource({ section: "ADMIN", module: "GeneralSettings", page: "GeneralSettingsView" });
  const { token } = theme.useToken();
  const { theme: appTheme } = useTheme();
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
      borderRadius: "0px",
      border: `1px solid ${token.colorBorder}`,
      boxShadow: "none",
      background: 'transparent'
    },
    tabStyle: {
      background: 'transparent',
      marginBottom: "0",
      padding: "0 8px"
    },
    locationCard: {
      padding: '20px',
      borderRadius: '0px',
      border: `1px solid ${token.colorBorder}`,
      background: token.colorBgContainer,
      transition: 'all 0.2s ease',
      boxShadow: "none",
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
  const { canReadSettings, canUpdateSettings, canDeleteSettings, canManageSettings, canReadMail, canUpdateMail, canReadActivityLog } = usePermission();
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadSettings) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadSettings, router]);


  // State management
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (activeTab === 'attendance') {
        await fetchShifts();
      } else if (activeTab === 'system') {
        await fetchTenantProfile();
      } else if (activeTab === 'company') {
        await fetchCompanyDetails();
      } else if (activeTab === 'mail') {
        await fetchInvoiceMailSettings();
      }
    } catch (error) {
      console.error("Refresh settings error:", error);
    } finally {
      setRefreshing(false);
    }
  };



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

  // Company details state — the registered company plus its branch locations
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [companyForm] = Form.useForm();
  const [companySaving, setCompanySaving] = useState(false);
  // Saved details render read-only; the form only appears while editing (or
  // before anything has ever been saved).
  const [isCompanyEditing, setIsCompanyEditing] = useState(false);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [isBranchDrawerVisible, setIsBranchDrawerVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);
  const [branchForm] = Form.useForm();
  // Drives the branch drawer's email field: reuse the company email or type one.
  const branchUsesCompanyEmail = Form.useWatch('useCompanyEmail', branchForm);
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

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const { company, branches: branchList } = await CompanyDetailsService.getOverview();
      setCompanyDetails(company);
      setBranches(branchList);
      companyForm.setFieldsValue(company || {});
      // Nothing saved yet → open straight into the form; otherwise show the
      // saved details and wait for the user to hit Edit.
      setIsCompanyEditing(!company);
    } catch (error) {
      console.error('Failed to fetch company details:', error);
      messageApi.error('Failed to fetch company details');
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
    if (user && activeTab === 'company') {
      fetchCompanyDetails();
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
      messageApi.error('Failed to delete shift');
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

  const startEditingCompany = () => {
    companyForm.setFieldsValue(companyDetails || {});
    setIsCompanyEditing(true);
  };

  const cancelEditingCompany = () => {
    // Drop unsaved edits by re-seeding from the last saved record.
    companyForm.setFieldsValue(companyDetails || {});
    setIsCompanyEditing(false);
  };

  const handleCompanyDetailsSubmit = async (values: any) => {
    try {
      setCompanySaving(true);
      const saved = await CompanyDetailsService.saveCompany(values);
      setCompanyDetails(saved);
      companyForm.setFieldsValue(saved);
      setIsCompanyEditing(false);
      // Branches that reuse the company email show the new address immediately.
      setBranches((prev) =>
        prev.map((b) => (b.useCompanyEmail ? { ...b, effectiveEmail: saved.primaryEmail } : b)),
      );
      messageApi.success('Company details saved successfully!');
    } catch (error: any) {
      console.error('Failed to save company details', error);
      messageApi.error(error?.message || 'Failed to save company details');
    } finally {
      setCompanySaving(false);
    }
  };

  const showAddBranchDrawer = () => {
    setEditingBranch(null);
    branchForm.resetFields();
    // Reusing the company email is the default for a new branch.
    branchForm.setFieldsValue({ useCompanyEmail: true, country: companyDetails?.country });
    setIsBranchDrawerVisible(true);
  };

  const showEditBranchDrawer = (branch: CompanyBranch) => {
    setEditingBranch(branch);
    branchForm.setFieldsValue(branch);
    setIsBranchDrawerVisible(true);
  };

  const handleBranchSubmit = async (values: any) => {
    try {
      setFormLoading(true);
      const payload = {
        ...values,
        useCompanyEmail: !!values.useCompanyEmail,
        // A branch on the company email must not carry a stale one of its own.
        branchEmail: values.useCompanyEmail ? null : values.branchEmail,
      };
      if (editingBranch) {
        await CompanyDetailsService.updateBranch(editingBranch.id, payload);
        messageApi.success('Branch updated successfully!');
      } else {
        await CompanyDetailsService.createBranch(payload);
        messageApi.success('Branch added successfully!');
      }
      setIsBranchDrawerVisible(false);
      setEditingBranch(null);
      branchForm.resetFields();
      fetchCompanyDetails();
    } catch (error: any) {
      console.error('Failed to save branch', error);
      messageApi.error(error?.message || 'Failed to save branch');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      setFormLoading(true);
      await CompanyDetailsService.deleteBranch(id);
      messageApi.success('Branch removed successfully!');
      fetchCompanyDetails();
    } catch (error) {
      console.error('Failed to delete branch', error);
      messageApi.error('Failed to delete branch');
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
          background: "transparent",
          minHeight: "calc(100vh - 64px)",
          textAlign: 'center'
        }}>
          <div style={{ padding: 100, textAlign: 'center' }}>
            <ZukvoLoader size="lg" message="Loading" />
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
            borderRadius: 0,
            background: 'transparent',
            padding: '16px 24px',
            color: token.colorText,
            border: `1px solid ${token.colorBorder}`,
            boxShadow: "none",
            flexShrink: 0
          }}>

            <Row gutter={[24, 24]} align="middle" style={{ position: 'relative', zIndex: 1 }}>
              <Col xs={24} md={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    background: token.colorFillAlter,
                    border: `1px solid ${token.colorBorderSecondary}`,
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
                      <PictureOutlined style={{ fontSize: 28, color: token.colorTextTertiary }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: token.colorTextSecondary, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Workspace Identity
                      </Text>
                      <div style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        color: token.colorText,
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
                        color: token.colorText,
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 22,
                        lineHeight: 1.25,
                        wordBreak: 'break-word'
                      }}
                    >
                      {tenantProfile?.name || 'Your Company'}
                    </Title>
                    <Text style={{ color: token.colorTextSecondary, fontSize: 12, display: 'block', marginTop: 4 }}>
                      Customize your branding, manage logo versions, and refine how your workspace presents itself.
                    </Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Row gutter={12}>
                  <Col span={12}>
                    <div style={{
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: 0,
                      padding: '10px 12px'
                    }}>
                      <Text style={{ color: token.colorTextSecondary, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Logo Versions
                      </Text>
                      <div style={{ fontSize: 20, fontWeight: 700, color: token.colorText, lineHeight: 1.2, marginTop: 4 }}>
                        {logoVersions.length}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: 0,
                      padding: '10px 12px'
                    }}>
                      <Text style={{ color: token.colorTextSecondary, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                        <Text style={{ color: token.colorText, fontSize: 13, fontWeight: 700 }}>
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
            className="transparent-card"
            style={{ ...styles.sectionCard, width: "100%", borderRadius: 0, background: 'transparent' }}
            styles={{ body: { padding: 0, background: 'transparent' } }}
          >
            <div style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: 'transparent',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0
            }}>
              <Space size={14} align="center">
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
                }}>
                  <SettingOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: 'block', letterSpacing: '-0.01em' }}>
                    Company Branding
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Set your display name and upload a logo for use across the workspace
                  </Text>
                </div>
              </Space>
            </div>

            <div style={{ padding: 20 }}>
              <Row gutter={[24, 24]} align="top">
                {/* Left Column: Branding Form */}
                <Col xs={24} lg={8} xl={7}>
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
                        background: 'transparent',
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
                <Col xs={24} lg={16} xl={17} style={{ borderLeft: `1px solid ${token.colorBorderSecondary}`, paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <Space size={8} align="center">
                        <PictureOutlined style={{ fontSize: 15, color: token.colorPrimary }} />
                        <Text strong style={{ fontSize: 14, color: "var(--text-primary)", letterSpacing: '-0.01em' }}>
                          Logo Library
                        </Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                        Switch between saved versions or upload a fresh one
                      </Text>
                    </div>
                    {logoVersions.length > 0 && (
                      <div style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-secondary)'
                      }}>
                        {logoVersions.length} {logoVersions.length === 1 ? 'version' : 'versions'}
                      </div>
                    )}
                  </div>

                  {logoVersions.length > 0 ? (
                    <Row gutter={[12, 12]}>
                      {logoVersions.map((url, index) => {
                        const isActive = tenantProfile?.settings?.logoUrl === url;
                        return (
                          <Col key={index} xs={24} sm={12} md={8}>
                            <div
                              style={{
                                borderRadius: 0,
                                overflow: 'hidden',
                                border: isActive
                                  ? `2px solid ${token.colorPrimary}`
                                  : `1px solid ${token.colorBorder}`,
                                position: 'relative',
                                background: 'transparent',
                                transition: 'all 0.25s ease',
                                boxShadow: "none"
                              }}
                            >
                              {isActive && (
                                <div style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  zIndex: 10,
                                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  borderRadius: 0,
                                  fontSize: 9,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
                                }}>
                                  <CheckCircleFilled style={{ fontSize: 9 }} /> ACTIVE
                                </div>
                              )}
                              <div style={{
                                height: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 8,
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
                                padding: '6px 8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'transparent'
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
      key: 'company',
      label: (
        <Space size={8} style={{ padding: "4px 8px" }}>
          <BankOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>Company Details</span>
        </Space>
      ),
      children: (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 4px 40px 4px" }}>
          <div style={{ padding: "8px 4px 24px 4px" }}>
            {/* Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              background: 'var(--bg-slate-50)',
              padding: '10px 16px',
              borderRadius: '0px',
              border: `1px solid ${token.colorBorder}`
            }}>
              <Space align="center" size="middle">
                <div style={{ ...styles.iconContainer, width: 40, height: 40, borderRadius: 10, background: 'var(--bg-pure-white)' }}>
                  <BankOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
                    Company Details
                  </Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 14 }}>
                    Your registered entity, statutory identifiers and office addresses.
                  </Text>
                </div>
              </Space>
            </div>

            {/* ── Registered company ─────────────────────────────────────── */}
            <Card
              variant="borderless"
              className="transparent-card"
              style={{ ...styles.sectionCard, width: "100%", borderRadius: 0, background: 'transparent', marginBottom: 24 }}
              styles={{ body: { padding: 0, background: 'transparent' } }}
            >
              <div style={{
                padding: "12px 20px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <Space size={14} align="center">
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}>
                    <BankOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: 'block', letterSpacing: '-0.01em' }}>
                      Registered Company
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {isCompanyEditing
                        ? 'The legal entity used on invoices, letters and statutory documents'
                        : 'Saved details — click Edit to make changes'}
                    </Text>
                  </div>
                </Space>
                {companyDetails && !isCompanyEditing && canUpdateSettings && (
                  <Button
                    icon={<EditOutlined />}
                    onClick={startEditingCompany}
                    style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
                  >
                    Edit
                  </Button>
                )}
              </div>

              <div style={{ padding: 20 }}>
                {companyDetails && !isCompanyEditing ? (
                  /* ── Saved details, read-only ──────────────────────────── */
                  <>
                    <Row gutter={[16, 0]}>
                      <Col xs={24} md={12} lg={8}>
                        <DetailField
                          label="Registered Company Name"
                          value={companyDetails.registeredName}
                          icon={<BankOutlined style={{ color: 'var(--text-slate-400)' }} />}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <DetailField
                          label="GST Number"
                          value={companyDetails.gstNumber}
                          icon={<NumberOutlined style={{ color: 'var(--text-slate-400)' }} />}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <DetailField
                          label="Primary Company Email"
                          value={companyDetails.primaryEmail}
                          icon={<MailOutlined style={{ color: 'var(--text-slate-400)' }} />}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <DetailField
                          label="Primary Phone"
                          value={companyDetails.primaryPhone}
                          icon={<PhoneOutlined style={{ color: 'var(--text-slate-400)' }} />}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <DetailField
                          label="Website"
                          icon={<LinkOutlined style={{ color: 'var(--text-slate-400)' }} />}
                          value={
                            companyDetails.website ? (
                              <a
                                href={companyDetails.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--text-blue-600)' }}
                              >
                                {companyDetails.website}
                              </a>
                            ) : null
                          }
                        />
                      </Col>
                    </Row>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      margin: '4px 0 16px',
                      paddingBottom: 10,
                      borderBottom: `1px dashed ${token.colorBorderSecondary}`,
                    }}>
                      <EnvironmentOutlined style={{ color: '#2563EB', fontSize: 15 }} />
                      <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        Registered Address
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {formatAddress(companyDetails) || 'No address saved yet'}
                      </Text>
                    </div>

                    <Row gutter={[16, 0]}>
                      {COMPANY_ADDRESS_FIELDS.map((field) => (
                        <Col xs={24} md={12} lg={8} key={field.name}>
                          <DetailField
                            label={field.label}
                            value={(companyDetails as any)[field.name]}
                          />
                        </Col>
                      ))}
                    </Row>
                  </>
                ) : (
                <Form
                  form={companyForm}
                  layout="vertical"
                  onFinish={handleCompanyDetailsSubmit}
                  disabled={!canUpdateSettings}
                  requiredMark="optional"
                >
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        name="registeredName"
                        label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Registered Company Name</Text>}
                        rules={[{ required: true, whitespace: true, message: 'Registered name is required' }]}
                      >
                        <Input placeholder="e.g. Zithspace Technologies Pvt Ltd" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        name="gstNumber"
                        label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>GST Number</Text>}
                        normalize={(v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '')}
                        rules={[{
                          pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                          message: 'Enter a valid 15-character GSTIN',
                        }]}
                      >
                        <Input placeholder="e.g. 29ABCDE1234F1Z5" maxLength={15} prefix={<NumberOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        name="primaryEmail"
                        label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Primary Company Email</Text>}
                        normalize={(v) => (v || '').trim()}
                        rules={[
                          { required: true, message: 'Primary email is required' },
                          { type: 'email', message: 'Enter a valid email address' },
                        ]}
                      >
                        <Input placeholder="e.g. accounts@company.com" prefix={<MailOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        name="primaryPhone"
                        label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Primary Phone</Text>}
                        rules={[
                          { required: true, whitespace: true, message: 'Primary phone is required' },
                          { pattern: /^[0-9]+$/, message: 'Only numbers allowed' }
                        ]}
                        getValueFromEvent={(e) => e.target.value.replace(/\D/g, '')}
                      >
                        <Input placeholder="e.g. +91 98765 43210" prefix={<PhoneOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        name="website"
                        label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Website URL</Text>}
                        // The server prefixes a missing scheme, so accept a bare
                        // domain here and only reject obviously broken input.
                        rules={[{
                          pattern: /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i,
                          message: 'Enter a valid website URL',
                        }]}
                      >
                        <Input placeholder="e.g. www.company.com" prefix={<LinkOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    margin: '4px 0 16px',
                    paddingBottom: 10,
                    borderBottom: `1px dashed ${token.colorBorderSecondary}`,
                  }}>
                    <EnvironmentOutlined style={{ color: '#2563EB', fontSize: 15 }} />
                    <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      Registered Address
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      The full postal address of your head office
                    </Text>
                  </div>

                  <Row gutter={[16, 0]}>
                    {COMPANY_ADDRESS_FIELDS.map((field) => (
                      <Col xs={24} md={12} lg={8} key={field.name}>
                        <Form.Item
                          name={field.name}
                          label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{field.label}</Text>}
                          rules={field.rules}
                          normalize={field.normalize}
                        >
                          <Input placeholder="e.g. Zithspace Technologies Pvt Ltd" />
                        </Form.Item>
                      </Col>
                    ))}
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="gstNumber"
                          label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>GST Number</Text>}
                          normalize={(v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '')}
                          rules={[{
                            pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                            message: 'Enter a valid 15-character GSTIN',
                          }]}
                        >
                          <Input placeholder="e.g. 29ABCDE1234F1Z5" maxLength={15} prefix={<NumberOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="primaryEmail"
                          label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Primary Company Email</Text>}
                          rules={[
                            { required: true, message: 'Primary email is required' },
                            { type: 'email', message: 'Enter a valid email address' },
                          ]}
                        >
                          <Input placeholder="e.g. accounts@company.com" prefix={<MailOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="primaryPhone"
                          label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Primary Phone</Text>}
                          rules={[{ required: true, whitespace: true, message: 'Primary phone is required' }]}
                          getValueFromEvent={(e) => e.target.value.replace(/[^0-9+\-()\s]/g, '')}
                        >
                          <Input placeholder="e.g. +91 98765 43210" prefix={<PhoneOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} lg={8}>
                        <Form.Item
                          name="website"
                          label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>Website URL</Text>}
                          // The server prefixes a missing scheme, so accept a bare
                          // domain here and only reject obviously broken input.
                          rules={[{
                            pattern: /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i,
                            message: 'Enter a valid website URL',
                          }]}
                        >
                          <Input placeholder="e.g. www.company.com" prefix={<LinkOutlined style={{ color: 'var(--text-slate-400)' }} />} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      margin: '4px 0 16px',
                      paddingBottom: 10,
                      borderBottom: `1px dashed ${token.colorBorderSecondary}`,
                    }}>
                      <EnvironmentOutlined style={{ color: '#2563EB', fontSize: 15 }} />
                      <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        Registered Address
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        The full postal address of your head office
                      </Text>
                    </div>

                    <Row gutter={[16, 0]}>
                      {COMPANY_ADDRESS_FIELDS.map((field) => (
                        <Col xs={24} md={12} lg={8} key={field.name}>
                          <Form.Item
                            name={field.name}
                            label={<Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{field.label}</Text>}
                          >
                            <Input placeholder={field.placeholder} />
                          </Form.Item>
                        </Col>
                      ))}
                    </Row>

                    {canUpdateSettings && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        {companyDetails && (
                          <Button
                            onClick={cancelEditingCompany}
                            style={{ borderRadius: 10, height: 42, fontWeight: 600, minWidth: 110 }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={companySaving}
                          style={{ borderRadius: 10, height: 42, fontWeight: 600, minWidth: 160 }}
                        >
                          {companyDetails ? 'Save Changes' : 'Save Company Details'}
                        </Button>
                      </div>
                    )}
                  </Form>
                )}
              </div>
            </Card>

            {/* ── Branch locations ───────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              background: 'var(--bg-slate-50)',
              padding: '10px 16px',
              borderRadius: '0px',
              border: `1px solid ${token.colorBorder}`
            }}>
              <Space align="center" size="middle">
                <div style={{ ...styles.iconContainer, width: 40, height: 40, borderRadius: 10, background: 'var(--bg-pure-white)' }}>
                  <EnvironmentOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
                    Additional Branch Locations
                  </Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 14 }}>
                    Other offices. Each branch reuses the company email or carries its own.
                  </Text>
                </div>
              </Space>
              {canUpdateSettings && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showAddBranchDrawer}
                  style={{
                    borderRadius: 10,
                    height: 42,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                  }}
                >
                  Add Branch
                </Button>
              )}
            </div>

            <Row gutter={[24, 24]}>
              {branches.map((branch) => (
                <Col xs={24} sm={12} lg={8} key={branch.id}>
                  <div className="pc-card">
                    <div className="pc-top">
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          background: "var(--bg-blue-50)",
                          color: "var(--text-blue-600)",
                          fontSize: 12,
                          fontWeight: 800,
                          border: "1px solid var(--border-blue-200)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        {branch.branchName ? branch.branchName.charAt(0).toUpperCase() : <EnvironmentOutlined />}
                      </div>
                      <div className="pc-identity-body">
                        <div className="pc-title">{branch.branchName}</div>
                        <div className="pc-client-line">
                          <span className="pc-client-key">Location</span>
                          <span className="pc-client-val">
                            {[branch.city, branch.state, branch.country].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                      </div>
                      <Space size={2}>
                        {canUpdateSettings && (
                          <button className="pc-actions" onClick={(e) => { e.stopPropagation(); showEditBranchDrawer(branch); }}>
                            <EditOutlined style={{ fontSize: 13 }} />
                          </button>
                        )}
                        {canDeleteSettings && (
                          <ConfirmDialog
                            title="Delete branch?"
                            description="Are you sure you want to delete this branch location?"
                            onConfirm={() => handleDeleteBranch(branch.id)}
                            confirmText="Delete"
                          >
                            <button className="pc-actions" onClick={(e) => e.stopPropagation()}>
                              <DeleteOutlined style={{ fontSize: 13, color: '#ef4444' }} />
                            </button>
                          </ConfirmDialog>
                        )}
                      </Space>
                    </div>

                    <div className="pc-foot" style={{ height: 'auto', padding: '6px 0' }}>
                      <div className="pc-foot-row">
                        <div className="pc-foot-item">
                          <MailOutlined style={{ color: "var(--text-slate-400)" }} /> {branch.effectiveEmail || '—'}
                        </div>
                      </div>
                      <div className="pc-foot-row">
                        <div className="pc-foot-item">
                          <Tag
                            color={branch.useCompanyEmail ? 'green' : 'blue'}
                            style={{ marginInlineEnd: 0, fontSize: 11 }}
                          >
                            {branch.useCompanyEmail ? 'Company email' : 'Branch email'}
                          </Tag>
                        </div>
                        {branch.branchPhone && (
                          <>
                            <div style={{ width: 1, height: 10, background: 'var(--border-slate-200)' }} />
                            <div className="pc-foot-item">
                              <PhoneOutlined style={{ color: "var(--text-slate-400)" }} /> {branch.branchPhone}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="pc-foot-row">
                        <div className="pc-foot-item" style={{ whiteSpace: 'normal' }}>
                          <EnvironmentOutlined style={{ color: "var(--text-slate-400)" }} /> {formatAddress(branch) || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
              {branches.length === 0 && (
                <Col span={24}>
                  <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    background: 'var(--bg-slate-50)',
                    borderRadius: '16px',
                    border: '2px dashed var(--border-slate-200)'
                  }}>
                    <EnvironmentOutlined style={{ fontSize: 48, color: 'var(--text-slate-300)', marginBottom: 16 }} />
                    <Title level={5} style={{ color: 'var(--text-slate-500)' }}>No branch locations added yet</Title>
                    {canUpdateSettings && <Button type="link" onClick={showAddBranchDrawer}>Add your first branch</Button>}
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

          {/* Default Mail Card */}
          <Card
            variant="borderless"
            className="transparent-card"
            style={{ ...styles.sectionCard, width: "100%", borderRadius: 0 }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: `linear-gradient(180deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0
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
                    Default Mail
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Choose which connected mailbox will deliver invoices to your clients
                  </Text>
                </div>
              </Space>
            </div>

            <div style={{ padding: 20 }}>
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
                        Active Sender
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
                                border: isSelected ? `1.5px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
                                background: isSelected
                                  ? 'linear-gradient(180deg, rgba(124, 58, 237, 0.04) 0%, rgba(124, 58, 237, 0.01) 100%)'
                                  : token.colorBgContainer,
                                transition: 'all 0.2s ease',
                                boxShadow: 'none'
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
                      borderRadius: 0,
                      height: '100%',
                      background: invoiceMailSettings
                        ? invoiceMailSettings.is_verified
                          ? 'linear-gradient(160deg, #F0FDF4 0%, #DCFCE7 100%)'
                          : 'linear-gradient(160deg, #FFFAF5 0%, #FFF3E8 100%)'
                        : token.colorFillAlter,
                      border: `1px solid ${invoiceMailSettings
                        ? invoiceMailSettings.is_verified ? '#BBF7D0' : '#FDDCB5'
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
                              borderRadius: 0,
                              background: invoiceMailSettings.is_verified
                                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                                : 'linear-gradient(135deg, #FDBA74 0%, #FB923C 100%)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: invoiceMailSettings.is_verified
                                ? '0 4px 12px -4px rgba(34, 197, 94, 0.3)'
                                : '0 4px 12px -4px rgba(251, 146, 60, 0.3)'
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
                            borderRadius: 0,
                            border: `1px solid ${invoiceMailSettings.is_verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 146, 60, 0.3)'}`,
                            position: 'relative'
                          }}>
                            <Text style={{
                              fontSize: 11,
                              color: invoiceMailSettings.is_verified ? '#166534' : '#C2410C',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              Account
                            </Text>
                            <Text strong style={{
                              fontSize: 13,
                              display: 'block',
                              color: invoiceMailSettings.is_verified ? '#14532D' : '#9A3412',
                              wordBreak: 'break-all',
                              marginTop: 2
                            }}>
                              {invoiceMailSettings.email}
                            </Text>
                          </div>

                          <Text style={{
                            fontSize: 12,
                            color: invoiceMailSettings.is_verified ? '#166534' : '#B45309',
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
                                borderRadius: 0,
                                height: 42,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)',
                                border: '1px solid #FBBF77',
                                color: '#9A3412',
                                boxShadow: '0 2px 8px -2px rgba(251, 146, 60, 0.25)'
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
    {
      key: 'ai',
      label: (
        <Space size={8} style={{ padding: "4px 8px" }}>
          <RobotOutlined style={{ fontSize: 16 }} />
          <span style={{ fontWeight: 600 }}>AI Provider</span>
        </Space>
      ),
      children: (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 8px 40px 8px" }}>
          <AiSettingsPanel canManage={canManageSettings} />
        </div>
      )
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      <div className="settings-main-wrapper" style={{ background: 'transparent' }}>
        {/* Premium Header */}
        <TimeTrackingHeader
          className="settings-page-header"
          style={{ background: 'transparent' }}
          icon={<SettingOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="System Settings"
          description="Configure your workspace, manage shifts, and customize branding."
          onRefresh={handleRefresh}
          refreshing={refreshing}
          extra={
            canReadActivityLog && (
              <Button
                icon={<History size={14} />}
                onClick={() => setHistoryOpen(true)}
                style={{ borderRadius: 8, height: 38, fontWeight: 600, color: "var(--text-secondary)" }}
              >
                History
              </Button>
            )
          }
        />

        <div className="settings-tab-container">
          <style>{`
            .settings-tabs .ant-tabs-nav-operations {
              display: none !important;
            }
            .settings-tabs .ant-tabs-nav-wrap {
              overflow-x: auto !important;
              overflow-y: hidden !important;
            }
            .settings-tabs .ant-tabs-nav-wrap::-webkit-scrollbar {
              display: none;
            }
            .settings-tabs .ant-tabs-nav-list {
              transform: none !important;
              width: 100%;
            }
          `}</style>
          {/* Settings Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            type="line"
            moreIcon={null}

            tabBarStyle={{
              ...styles.tabStyle,
              background: 'transparent',
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
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

        {/* Add / Edit Branch Drawer */}
        <Drawer
          rootClassName="leave-drawer-root"
          title={null}
          open={isBranchDrawerVisible}
          onClose={() => setIsBranchDrawerVisible(false)}
          width={720}
          closable={false}
          destroyOnClose
          styles={{
            header: { display: 'none' },
            body: { padding: 0, background: 'var(--customers-page-bg)' },
            footer: { padding: 0, border: 'none' },
            wrapper: { boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.08)' },
            mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
          }}
          footer={
            <div
              className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500, marginRight: 'auto' }}>
                Fields marked required must be filled
              </span>
              <Button onClick={() => setIsBranchDrawerVisible(false)} style={{ borderRadius: 8, height: 36 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={formLoading}
                onClick={() => branchForm.submit()}
                icon={editingBranch ? <EditOutlined /> : <PlusOutlined />}
                style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
              >
                {editingBranch ? 'Update Branch' : 'Save Branch'}
              </Button>
            </div>
          }
        >
          <style>{formStyles}</style>
          {/* HEADER */}
          <div
            className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
            style={{
              background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(59,130,246,0.10)',
                  color: '#3b82f6',
                  border: '1px solid var(--border-blue-200)',
                }}
              >
                {editingBranch ? <EditOutlined style={{ fontSize: 18 }} /> : <EnvironmentOutlined style={{ fontSize: 18 }} />}
              </div>
              <div className="min-w-0">
                <div
                  className="text-[15px] font-semibold leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {editingBranch ? 'Edit Branch Location' : 'Add Branch Location'}
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {editingBranch ? 'Update this branch’s contact and address details' : 'Enter the branch contact and address details'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBranchDrawerVisible(false)}
              aria-label="Close"
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <CloseOutlined />
            </button>
          </div>

          <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--customers-page-bg)' }}>
            <Form
              form={branchForm}
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              labelAlign="left"
              colon={false}
              requiredMark="optional"
              className="customer-drawer-form"
              initialValues={{ useCompanyEmail: true }}
              onFinish={handleBranchSubmit}
            >
              <SectionCard
                icon={<BankOutlined />}
                title="Branch Contact"
                subtitle="Name this branch and choose how its email is routed"
                step="STEP 1"
              >
                <Form.Item
                  name="branchName"
                  label="Branch Name"
                  rules={[{ required: true, whitespace: true, message: 'Required' }]}
                  style={{ marginBottom: 14 }}
                >
                  <Input placeholder="e.g. Chennai Office" />
                </Form.Item>

                <Form.Item
                  name="useCompanyEmail"
                  label="Email Address"
                  valuePropName="checked"
                  style={{ marginBottom: 14 }}
                  extra={
                    <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>
                      {branchUsesCompanyEmail
                        ? `Reusing the company email${companyDetails?.primaryEmail ? ` (${companyDetails.primaryEmail})` : ''}`
                        : 'This branch uses its own email address'}
                    </span>
                  }
                >
                  <Switch checkedChildren="Same as company" unCheckedChildren="Different email" />
                </Form.Item>

                {/* Only demanded when the branch opts out of the company email —
                    mirrors the cd_branch_email_present CHECK on the table. */}
                {!branchUsesCompanyEmail && (
                  <Form.Item
                    name="branchEmail"
                    label="Branch Email"
                    normalize={(v) => (v || '').trim()}
                    rules={[
                      { required: true, message: 'Required' },
                      { type: 'email', message: 'Enter a valid email address' },
                    ]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. chennai@company.com" />
                  </Form.Item>
                )}

                <Form.Item
                  name="branchPhone"
                  label="Branch Phone"
                  style={{ marginBottom: 14 }}
                  rules={[{ pattern: /^[0-9]+$/, message: 'Only numbers allowed' }]}
                  getValueFromEvent={(e) => e.target.value.replace(/\D/g, '')}
                >
                  <Input placeholder="e.g. 914412345678" />
                </Form.Item>
              </SectionCard>

              <SectionCard
                icon={<EnvironmentOutlined />}
                title="Address Details"
                subtitle="Provide the branch's full location information"
                step="STEP 2"
              >
                {COMPANY_ADDRESS_FIELDS.map((field) => (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    rules={field.rules}
                    normalize={field.normalize}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder={field.placeholder} />
                  </Form.Item>
                ))}
              </SectionCard>
            </Form>
          </div>
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
        {tenantProfile && (
          <TransactionHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            entityType="tenant_settings"
            entityId={tenantProfile.id}
            subtitle={tenantProfile.name}
          />
        )}

        <style jsx global>{`
        /* --- Transparent Card Overrides --- */
        [data-theme='dark'] .transparent-card,
        [data-theme='dark'] .transparent-card .ant-card-body,
        [data-theme='dark'] .settings-main-wrapper,
        [data-theme='dark'] .settings-tab-container .ant-tabs-nav,
        [data-theme='dark'] .settings-tab-container .ant-tabs-content-holder {
          background: transparent !important;
        }

        /* --- Member Drawer Style Overrides --- */
        .mm-drawer .ant-form-item-label > label {
          color: #475569 !important;
          font-weight: 500 !important;
          font-size: 13.5px !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }
        .mm-drawer .ant-input,
        .mm-drawer .ant-select-selector,
        .mm-drawer .ant-input-number {
          border-radius: 8px !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
        }
        .mm-drawer .ant-input:focus,
        .mm-drawer .ant-input-focused,
        .mm-drawer .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
        }
        .mm-drawer .mm-footer-btn.ant-btn {
          border-radius: 8px !important;
        }
        
        [data-theme='dark'] .mm-drawer .ant-input,
        [data-theme='dark'] .mm-drawer .ant-select-selector,
        [data-theme='dark'] .mm-drawer .ant-input-number {
          background-color: #171f2e !important;
          border-color: #2a374a !important;
          color: #e2e8f0 !important;
        }
        [data-theme='dark'] .mm-drawer .ant-input::placeholder,
        [data-theme='dark'] .mm-drawer .ant-select-selection-placeholder {
          color: #64748b !important;
        }
        [data-theme='dark'] .mm-drawer .ant-form-item-label > label {
          color: #94a3b8 !important;
        }

        .sp-form-section {
          background: var(--bg-pure-white);
          border-radius: 0 !important;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
        }
        .sp-form-section-header {
          padding: 14px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-form-section-body {
          padding: 24px 28px;
        }
        
        [data-theme='dark'] .sp-form-section {
          background: #141b27 !important;
          border-color: #232f41 !important;
        }
        [data-theme='dark'] .sp-form-section-header {
          background: #141b27 !important;
          border-bottom-color: #232f41 !important;
        }

        .sp-section-icon {
          padding: 6px;
          border-radius: 0 !important;
          display: flex;
        }
        .sp-section-icon.slate { background: var(--bg-slate-50); }
        [data-theme='dark'] .sp-section-icon.slate { background: #1f2937 !important; }

        /* --- Location Cards Style (.pc-card) --- */
        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 64px; overflow: hidden; }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }

        [data-theme='dark'] .pc-card {
          background: #0b0f19 !important;
          border-color: #1e293b !important;
        }
        [data-theme='dark'] .pc-foot {
          background: #111827 !important;
          border-top-color: #1e293b !important;
        }
        [data-theme='dark'] .pc-foot-row + .pc-foot-row {
          border-top-color: #1e293b !important;
        }

        .settings-main-wrapper {
          margin: 0 -24px;
          height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .settings-page-header {
          padding: 8px 32px;
          margin-bottom: 0;
        }
        .settings-tab-container {
          padding: 0 32px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        @media (max-width: 900px) {
          .settings-main-wrapper {
            margin: 0;
            height: auto;
            min-height: calc(100vh - 64px);
          }
          .settings-page-header {
            padding: 16px;
          }
          .settings-tab-container {
            padding: 0 16px;
            overflow: visible;
          }
          .settings-tabs .ant-tabs-nav-list {
            padding-bottom: 8px;
          }
        }
      `}</style>

      </div>
    </MainLayout>
  );
}
