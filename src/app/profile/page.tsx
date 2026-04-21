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
} from 'antd';
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
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === id
          ? 'text-[#2563eb] shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
      style={{
        backgroundColor: activeTab === id ? 'var(--bg-blue-50)' : 'transparent'
      }}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={activeTab === id ? 'text-[#2563eb]' : 'text-slate-400'} />
        <span className="font-medium text-[14px]">{label}</span>
      </div>
      {activeTab === id && <ChevronRight size={16} className="text-[#2563eb]" />}
    </button>
  );

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)]" style={{ backgroundColor: 'var(--bg-secondary)', margin: "0 -24px" }}>
        {/* Banner Area - Compacted */}
        <div className="h-24 bg-gradient-to-r from-[#1e40af] to-[#3730a3] relative overflow-hidden flex items-center px-10">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-[-20px]" />
          
          <div className="flex items-center gap-6 z-10 w-full max-w-[1100px] mx-auto">
            <div className="relative">
              <Avatar
                size={80}
                className="border-4 border-white/20 shadow-xl text-3xl font-semibold uppercase backdrop-blur-sm"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                {userProfile?.name.charAt(0) || user?.name?.charAt(0)}
              </Avatar>
              <Tooltip title="Coming Soon: Upload Avatar">
                <button 
                  className="absolute bottom-0 right-0 p-1.5 rounded-full shadow-sm cursor-not-allowed scale-75"
                  style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-100)', color: 'var(--text-slate-400)' }}
                >
                  <Camera size={14} />
                </button>
              </Tooltip>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {userProfile?.name || user?.name}
                </h2>
                <Tag 
                  className="m-0 px-2 py-0 border-0 bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase rounded-full backdrop-blur-md"
                >
                  {userProfile?.role?.replace('_', ' ') || 'User'}
                </Tag>
              </div>
              <p className="text-blue-100 text-[14px] font-medium opacity-90">
                {userProfile?.position?.title || 'Team Member'}
              </p>
            </div>
            
            {/* Status indicators moved to header for space */}
            <div className="hidden md:flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest leading-none mb-1">Status</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className={`w-1.5 h-1.5 rounded-full ${userProfile?.isActive ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                  <span className="text-white text-xs font-bold">{userProfile?.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Compact Settings Nav */}
            <div className="w-full lg:w-[240px] space-y-4">
              <div 
                className="rounded-xl p-1 shadow-sm"
                style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-100)' }}
              >
                <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-slate-50)' }}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Settings</span>
                </div>
                <div className="p-1 space-y-0.5">
                  <SidebarItem id="profile" icon={User} label="Profile Details" />
                  <SidebarItem id="security" icon={Shield} label="Security" />
                </div>
                <div className="mt-2 pt-1 p-1" style={{ borderTop: '1px solid var(--border-slate-100)' }}>
                  <button 
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-all duration-200 text-[12px] font-bold"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

               {/* Help Widget */}
               <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Help Center</h4>
                <p className="text-[9px] text-blue-700/70 leading-relaxed mb-2">Need professional role or permission updates?</p>
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
                className="rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[440px]"
                style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-100)' }}
              >
                {activeTab === 'profile' ? (
                  <div className="flex flex-col h-full animate-in fade-in duration-500">
                    {/* Information Bento Section - Enhanced Premium Style */}
                    <div 
                      className="grid grid-cols-3 shadow-sm relative z-0"
                      style={{ borderBottom: '1px solid var(--border-slate-100)' }}
                    >
                      <div className="p-4 transition-colors group cursor-default" style={{ background: 'var(--bg-pure-white)', borderRight: '1px solid var(--border-slate-50)' }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-blue-50)' }}>
                            <Briefcase size={12} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</span>
                        </div>
                        <p className="font-extrabold text-[13px] tracking-tight truncate leading-none" style={{ color: 'var(--text-slate-900)' }}>
                          {userProfile?.position?.title || 'N/A'}
                        </p>
                      </div>

                      <div className="p-4 transition-colors group cursor-default" style={{ background: 'var(--bg-pure-white)', borderRight: '1px solid var(--border-slate-50)' }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-blue-50)' }}>
                            <Calendar size={12} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</span>
                        </div>
                        <p className="font-extrabold text-[13px] tracking-tight truncate leading-none" style={{ color: 'var(--text-slate-900)' }}>
                          {userProfile?.createdAt ? dayjs(userProfile.createdAt).format('MMM D, YYYY') : 'N/A'}
                        </p>
                      </div>

                      <div className="p-4 transition-colors group cursor-default" style={{ background: 'var(--bg-pure-white)' }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform" style={{ background: 'var(--bg-green-50)' }}>
                            <User size={12} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead</span>
                        </div>
                        <p className="font-extrabold text-[13px] tracking-tight truncate leading-none" style={{ color: 'var(--text-slate-900)' }}>
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
                            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><User size={12}/> Full Name</span>}
                            rules={[{ required: true, message: 'Required' }]}
                            className="mb-1"
                          >
                            <Input className="rounded-lg py-1.5 focus:ring-0 border-slate-200 text-sm font-semibold h-9" />
                          </Form.Item>

                          <Form.Item
                            name="phone"
                            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Phone size={12}/> Phone Number</span>}
                            className="mb-1"
                          >
                            <Input className="rounded-lg py-1.5 focus:ring-0 border-slate-200 text-sm font-semibold h-9" />
                          </Form.Item>

                          <Form.Item
                            name="workEmail"
                            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Mail size={12}/> Work Email</span>}
                            className="mb-1"
                          >
                            <Input disabled className="rounded-lg py-1.5 h-9 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed text-sm font-bold" />
                          </Form.Item>

                          <Form.Item
                            name="personalEmail"
                            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Mail size={12}/> Personal Email</span>}
                            className="mb-1"
                          >
                            <Input className="rounded-lg py-1.5 focus:ring-0 border-slate-200 text-sm font-semibold h-9" />
                          </Form.Item>

                          <Form.Item
                            name="dateOfBirth"
                            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2"><Calendar size={12}/> Date of Birth</span>}
                            className="mb-1"
                          >
                            <Input type="date" className="rounded-lg py-1.5 focus:ring-0 text-sm font-semibold h-9" style={{ border: '1px solid var(--border-slate-100)', background: 'var(--bg-secondary)', color: 'var(--text-slate-900)' }} />
                          </Form.Item>
                        </div>

                        <div className="mt-8 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-slate-100)' }}>
                          <p className="text-[10px] text-slate-400 italic">Position changes require admin approval.</p>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={profileLoading}
                            className="h-9 px-10 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] border-0 font-bold text-xs"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 flex items-center justify-center h-full animate-in fade-in duration-500" style={{ background: 'var(--bg-pure-white)' }}>
                    <div className="max-w-xs w-full">
                      <div className="text-center mb-6">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <KeyRound size={20} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-tight" style={{ color: 'var(--text-slate-900)' }}>Access Control</h3>
                        <p className="text-slate-400 text-[11px] mt-1">Choose a unique, high-strength password.</p>
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
                          label={<span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Current Key</span>}
                          rules={[{ required: true, message: 'Required' }]}
                          className="mb-2"
                        >
                          <Input.Password className="rounded-lg py-1.5 h-9 border-slate-200" />
                        </Form.Item>

                        <Form.Item
                          name="newPassword"
                          label={<span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">New Password</span>}
                          rules={[{ required: true, message: 'Required' }]}
                          className="mb-2"
                        >
                          <Input.Password className="rounded-lg py-1.5 h-9 border-slate-200" />
                        </Form.Item>

                        <Form.Item
                          name="confirmPassword"
                          label={<span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Verify Key</span>}
                          rules={[{ required: true, message: 'Required' }]}
                          className="mb-2"
                        >
                          <Input.Password className="rounded-lg py-1.5 h-9 border-slate-200" />
                        </Form.Item>

                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={passwordLoading}
                          className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 border-0 font-bold text-xs mt-2"
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
        <style jsx global>{`
          .ant-form-item-label > label {
            font-weight: 500 !important;
            color: var(--text-slate-500) !important;
            font-size: 11px !important;
          }
          .ant-input, .ant-input-password, .ant-input-affix-wrapper {
            border-radius: 8px !important;
            border-color: var(--border-slate-100) !important;
            background: var(--bg-secondary) !important;
            color: var(--text-slate-900) !important;
          }
          .ant-input:focus, .ant-input-affix-wrapper-focused {
            border-color: #2563eb !important;
            box-shadow: none !important;
          }
           .ant-input:disabled {
            background-color: var(--bg-slate-50) !important;
            color: var(--text-slate-400) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
