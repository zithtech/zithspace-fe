'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Typography,
  Input,
  Button,
  Form,
  Alert,
  Avatar,
  Tag,
  Spin,
  Tooltip,
  Modal,
  Slider,
} from 'antd';
import Cropper from 'react-easy-crop';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Briefcase,
  ChevronRight,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Trash2,
  RefreshCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Maximize2,
  Minus,
  Plus,
} from 'lucide-react';
import dayjs from 'dayjs';
import { AuthService, UpdateProfileData, ChangePasswordData, UserProfile } from '@/services/authService';
import { ApiError } from '@/lib/axios';

const { Title, Text } = Typography;

interface ProfileFormData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  dateOfBirth: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type SettingsSection = 'profile' | 'security';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // State management
  const [activeTab, setActiveTab] = useState<SettingsSection>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await AuthService.getProfile();
        setUserProfile(data);

        // Pre-fill the form with current data
        profileForm.setFieldsValue({
          name: data.name || '',
          phone: data.phone || '',
          personalEmail: data.personalEmail || '',
          workEmail: data.workEmail || '',
          dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).format('YYYY-MM-DD') : '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, profileForm]);

  // Handle profile form submission
  const handleProfileSubmit = async (values: ProfileFormData) => {
    try {
      setProfileLoading(true);
      setError('');
      setSuccess('');

      const updateData: UpdateProfileData = {
        name: values.name,
        phone: values.phone,
        personalEmail: values.personalEmail,
        workEmail: values.workEmail,
        dateOfBirth: values.dateOfBirth || null,
      };

      const updatedProfile = await AuthService.updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setUserProfile(updatedProfile);

      // Sync with global auth state
      if (updateUser) {
        updateUser({
          name: updatedProfile.name,
          personalEmail: updatedProfile.personalEmail,
          workEmail: updatedProfile.workEmail,
          phone: updatedProfile.phone,
        });
      }

      // Refresh form fields
      profileForm.setFieldsValue({
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        personalEmail: updatedProfile.personalEmail,
        workEmail: updatedProfile.workEmail,
        dateOfBirth: updatedProfile.dateOfBirth ? dayjs(updatedProfile.dateOfBirth).format('YYYY-MM-DD') : '',
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof ApiError ? err.message : 'An error occurred while updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (values: PasswordFormData) => {
    try {
      setPasswordLoading(true);
      setError('');
      setSuccess('');

      await AuthService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      setSuccess('Password changed successfully!');
      passwordForm.resetFields();
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err instanceof ApiError ? err.message : 'An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Image Editing Helpers
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const handleImageUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      setUploadingImage(true);
      const image = await createImage(selectedImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply flips and brightness
      ctx.filter = `brightness(${brightness}%)`;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const base64Image = canvas.toDataURL('image/jpeg', 0.9);

      const updatedProfile = await AuthService.updateProfile({
        name: userProfile?.name || '',
        phone: userProfile?.phone || '',
        personalEmail: userProfile?.personalEmail || '',
        workEmail: userProfile?.workEmail || '',
        avatarUrl: base64Image,
      });

      setUserProfile(updatedProfile);
      setSuccess('Avatar updated successfully!');
      setIsEditorOpen(false);

      if (updateUser) {
        updateUser({
          ...user,
          avatarUrl: updatedProfile.avatarUrl,
        } as any);
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
        setIsEditorOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spin size="large" tip="Loading your workspace..." />
        </div>
      </MainLayout>
    );
  }

  const SidebarItem = ({ id, icon: Icon, label }: { id: SettingsSection; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === id
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
        <span className="font-bold text-[13px] tracking-tight">{label}</span>
      </div>
      {activeTab === id && <ChevronRight size={14} className="text-white/80" strokeWidth={3} />}
    </button>
  );

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
        {/* Premium SaaS Banner - Mesh Gradient Design */}
        <div
          className="h-44 relative overflow-hidden flex items-center px-10 transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #1c2c50 0%, #1e293b 50%, #0f172a 100%)',
          }}
        >
          {/* Animated Mesh Gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[60%] bg-violet-600/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />

          <div className="flex items-center gap-10 z-10 w-full max-w-[1140px] mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
              <div className="relative">
                <Avatar
                  size={120}
                  src={userProfile?.avatarUrl}
                  className="border-[6px] border-white/10 shadow-2xl text-5xl font-bold uppercase backdrop-blur-xl bg-white/5"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                >
                  {!userProfile?.avatarUrl && (userProfile?.name?.charAt(0) || user?.name?.charAt(0))}
                </Avatar>
                <div className="absolute bottom-1 right-2 flex gap-1 transform translate-y-1 translate-x-1">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                  />
                  <Tooltip title="Update Profile Photo">
                    <label
                      htmlFor="avatar-upload"
                      className="p-2.5 rounded-xl shadow-2xl cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center border border-white/40 backdrop-blur-md"
                      style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#1677ff' }}
                    >
                      <Camera size={18} strokeWidth={2.5} />
                    </label>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
                  {userProfile?.name || user?.name}
                </h2>
                <Tag
                  className="m-0 px-4 py-1 border-0 bg-blue-500/20 text-blue-100 font-black text-[10px] tracking-widest uppercase rounded-full backdrop-blur-xl border border-blue-500/30 shadow-lg"
                >
                  {userProfile?.role?.replace('_', ' ') || 'User'}
                </Tag>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-slate-300/80 text-[13px] font-semibold tracking-wide">
                <span className="flex items-center gap-2"><Briefcase size={16} className="text-blue-400" /> {userProfile?.position?.title || 'Senior Associate'}</span>
                <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full" />
                <span className="flex items-center gap-2"><Mail size={16} className="text-indigo-400" /> {userProfile?.workEmail}</span>
                <span className="hidden md:flex items-center gap-3">
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${userProfile?.isActive ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                    <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">{userProfile?.isActive ? 'Online' : 'Offline'}</span>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Compact Settings Nav */}
            <div className="w-full lg:w-[240px] space-y-4">
              <div
                className="rounded-xl p-1 shadow-sm bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              >
                <div className="px-4 py-2 border-b border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">Settings</span>
                </div>
                <div className="p-1 space-y-0.5">
                  <SidebarItem id="profile" icon={User} label="Profile Details" />
                  <SidebarItem id="security" icon={Shield} label="Security" />
                </div>
                <div className="mt-2 pt-1 p-1 border-t border-[var(--border-color)]">
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all duration-200 text-[12px] font-bold"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Help Widget */}
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Help Center</h4>
                <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed mb-2">Need professional role or permission updates?</p>
                <button className="text-[10px] font-bold text-blue-600 hover:underline">Contact Admin</button>
              </div>
            </div>

            {/* Right Column: Main Content */}
            <div className="flex-1 w-full relative">
              {/* Notifications Area - Floating style */}
              <div className="absolute -top-10 right-0 z-50">
                {success && (
                  <div className="bg-emerald-600 text-white shadow-lg rounded-full px-4 py-1 flex items-center gap-2 animate-in slide-in-from-top-4">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{success}</span>
                  </div>
                )}
                {error && (
                  <div className="bg-rose-600 text-white shadow-lg rounded-full px-4 py-1 flex items-center gap-2 animate-in slide-in-from-top-4">
                    <AlertCircle size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{error}</span>
                  </div>
                )}
              </div>

              {/* Main Container */}
              <div
                className="rounded-2xl shadow-xl shadow-black/5 overflow-hidden flex flex-col min-h-[480px] bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              >
                {/* Profile Strength Meter - SaaS Touch */}
                <div className="px-6 py-3 bg-[var(--bg-slate-50)] border-b border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500 rounded-lg text-white shadow-sm">
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Workspace Readiness</span>
                  </div>
                  <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-10">
                    <div className="h-1.5 flex-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full w-[85%] animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600">85%</span>
                  </div>
                </div>
                {activeTab === 'profile' ? (
                  <div className="flex flex-col h-full animate-in fade-in duration-500">
                    {/* Information Bento Section - Enhanced Premium Style */}
                    <div
                      className="grid grid-cols-3 relative z-0 border-b border-[var(--border-color)]"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <div className="p-5 transition-all group cursor-default hover:bg-blue-500/5 border-r border-[var(--border-color)]">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm bg-[var(--bg-secondary)] border border-blue-500/10">
                            <Briefcase size={14} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em]">Position</span>
                        </div>
                        <p className="font-black text-[15px] tracking-tight truncate leading-none text-[var(--text-primary)]">
                          {userProfile?.position?.title || 'N/A'}
                        </p>
                      </div>

                      <div className="p-5 transition-all group cursor-default hover:bg-indigo-500/5 border-r border-[var(--border-color)]">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm bg-[var(--bg-secondary)] border border-indigo-500/10">
                            <Calendar size={14} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em]">Joined</span>
                        </div>
                        <p className="font-black text-[15px] tracking-tight truncate leading-none text-[var(--text-primary)]">
                          {userProfile?.createdAt ? dayjs(userProfile.createdAt).format('MMM D, YYYY') : 'N/A'}
                        </p>
                      </div>

                      <div className="p-5 transition-all group cursor-default hover:bg-emerald-500/5">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm bg-[var(--bg-secondary)] border border-emerald-500/10">
                            <User size={14} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em]">Direct Lead</span>
                        </div>
                        <p className="font-black text-[15px] tracking-tight truncate leading-none text-[var(--text-primary)]">
                          {userProfile?.reportsTo?.name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Edit Form Body - Compact grid */}
                    <div className="p-6 flex-1">
                      <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleProfileSubmit}
                        requiredMark={false}
                        className="h-full flex flex-col justify-between"
                      >
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          <Form.Item
                            name="name"
                            label={<span className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><User size={12} /> Full Name</span>}
                            rules={[{ required: true, message: 'Required' }]}
                            className="mb-1"
                          >
                            <Input className="rounded-lg py-1.5 focus:ring-0 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold h-9" />
                          </Form.Item>

                          <Form.Item
                            name="phone"
                            label={<span className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Phone size={12} /> Phone Number</span>}
                            className="mb-1"
                          >
                            <Input className="rounded-lg py-1.5 focus:ring-0 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold h-9" />
                          </Form.Item>

                          <Form.Item
                            name="workEmail"
                            label={<span className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Mail size={12} /> Work Email</span>}
                            className="mb-1"
                          >
                            <Input disabled className="rounded-lg py-1.5 h-9 bg-[var(--bg-slate-50)] text-[var(--text-secondary)] border-[var(--border-color)] cursor-not-allowed text-sm font-bold" />
                          </Form.Item>

                          <Form.Item
                            name="personalEmail"
                            label={<span className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Mail size={12} /> Personal Email</span>}
                            className="mb-1"
                          >
                            <Input className="rounded-lg py-1.5 focus:ring-0 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold h-9" />
                          </Form.Item>

                          <Form.Item
                            name="dateOfBirth"
                            label={<span className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Calendar size={12} /> Date of Birth</span>}
                            className="mb-1"
                          >
                            <Input type="date" className="rounded-lg py-1.5 focus:ring-0 text-sm font-semibold h-9 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
                          </Form.Item>
                        </div>

                        <div className="mt-8 pt-6 flex items-center justify-between border-t border-dotted border-[var(--border-color)]">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Authorization</span>
                            <p className="text-[11px] text-[var(--text-secondary)] font-medium italic">Some security updates require admin approval.</p>
                          </div>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={profileLoading}
                            className="h-11 px-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 border-0 font-black text-xs shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98]"
                          >
                            Save Profile Changes
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 flex items-center justify-center h-full animate-in fade-in duration-500 bg-[var(--bg-secondary)]">
                    <div className="max-w-xs w-full">
                      <div className="text-center mb-6">
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <KeyRound size={20} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--text-primary)]">Access Control</h3>
                        <p className="text-[var(--text-secondary)] text-[11px] mt-1">Choose a unique, high-strength password.</p>
                      </div>

                      <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={handlePasswordSubmit}
                        requiredMark={false}
                        className="space-y-4"
                      >
                        <Form.Item
                          name="currentPassword"
                          label={<span className="text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">Current Key</span>}
                          rules={[{ required: true, message: 'Required' }]}
                          className="mb-2"
                        >
                          <Input.Password className="rounded-lg py-1.5 h-9 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
                        </Form.Item>

                        <Form.Item
                          name="newPassword"
                          label={<span className="text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">New Password</span>}
                          rules={[{ required: true, message: 'Required' }]}
                          className="mb-2"
                        >
                          <Input.Password className="rounded-lg py-1.5 h-9 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
                        </Form.Item>

                        <Form.Item
                          name="confirmPassword"
                          label={<span className="text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-wider">Verify Key</span>}
                          rules={[{ required: true, message: 'Required' }]}
                          className="mb-2"
                        >
                          <Input.Password className="rounded-lg py-1.5 h-9 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
                        </Form.Item>

                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={passwordLoading}
                          className="w-full h-10 rounded-lg bg-[var(--text-slate-900)] hover:bg-[var(--text-slate-700)] border-0 font-bold text-xs mt-2 text-white"
                        >
                          Update Security Key
                        </Button>
                      </Form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Image Editor Modal */}
        <Modal
          title={<span className="text-lg font-bold flex items-center gap-2"><div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><Camera size={18} /></div> Edit Profile Photo</span>}
          open={isEditorOpen}
          onCancel={() => setIsEditorOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsEditorOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleImageUpload}
              loading={uploadingImage}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
            >
              Update Avatar
            </Button>,
          ]}
          width={600}
          centered
          styles={{
            body: { padding: '24px 0' }
          }}
        >
          <div className="space-y-6">
            <div className="relative h-[300px] w-full bg-slate-900 overflow-hidden">
              {selectedImage && (
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              )}
            </div>

            <div className="px-8 space-y-6">
              {/* Controls Grid */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                      <Maximize2 size={12} /> Zoom
                    </span>
                    <span className="text-xs font-bold text-blue-600">{zoom.toFixed(1)}x</span>
                  </div>
                  <Slider
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e)}
                    tooltip={{ open: false }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                      <Sun size={12} /> Brightness
                    </span>
                    <span className="text-xs font-bold text-blue-600">{brightness}%</span>
                  </div>
                  <Slider
                    min={50}
                    max={150}
                    step={1}
                    value={brightness}
                    onChange={(e) => setBrightness(e)}
                    tooltip={{ open: false }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Flips & Orientation</span>
                <div className="flex gap-2">
                  <Tooltip title="Flip Horizontal">
                    <Button
                      icon={<FlipHorizontal size={16} />}
                      onClick={() => setFlipHorizontal(!flipHorizontal)}
                      type={flipHorizontal ? "primary" : "default"}
                      className="rounded-lg"
                    />
                  </Tooltip>
                  <Tooltip title="Flip Vertical">
                    <Button
                      icon={<FlipVertical size={16} />}
                      onClick={() => setFlipVertical(!flipVertical)}
                      type={flipVertical ? "primary" : "default"}
                      className="rounded-lg"
                    />
                  </Tooltip>
                  <Tooltip title="Reset All">
                    <Button
                      icon={<RefreshCw size={16} />}
                      onClick={() => {
                        setZoom(1);
                        setBrightness(100);
                        setFlipHorizontal(false);
                        setFlipVertical(false);
                      }}
                      className="rounded-lg"
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <style jsx global>{`
          .ant-form-item-label > label {
            font-weight: 700 !important;
            color: var(--text-secondary) !important;
            font-size: 10px !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .ant-input, .ant-input-password, .ant-input-affix-wrapper {
            border-radius: 10px !important;
            border-color: var(--border-color) !important;
            background: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
            padding: 8px 12px !important;
          }
          .ant-input:focus, .ant-input-affix-wrapper-focused {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
          }
           .ant-input:disabled {
            background-color: var(--bg-slate-50) !important;
            color: var(--text-secondary) !important;
            font-weight: 600;
          }
          .react-easy-crop_Container {
            background-color: #0f172a !important;
          }
          .ant-slider-track {
            background-color: #3b82f6 !important;
          }
          .ant-slider-handle::after {
            box-shadow: 0 0 0 2px #3b82f6 !important;
          }
          .ant-modal-content {
            background-color: var(--bg-secondary) !important;
          }
          .ant-modal-header {
            background-color: var(--bg-secondary) !important;
            border-bottom-color: var(--border-color) !important;
          }
          .ant-modal-title {
            color: var(--text-primary) !important;
          }
          .ant-modal-footer {
            border-top-color: var(--border-color) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
