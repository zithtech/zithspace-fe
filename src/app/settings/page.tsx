'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Typography,
  Input,
  Button,
  Space,
  Spin,
  message,
} from 'antd';
import {
  SaveOutlined,
  LockOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    personalEmail: '',
    workEmail: '',
    dateOfBirth: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Only access localStorage on client side
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData({
            personalEmail: data.data.personalEmail || '',
            workEmail: data.data.workEmail || '',
            dateOfBirth: data.data.dateOfBirth ? data.data.dateOfBirth.split('T')[0] : '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      // Only access localStorage on client side
      if (typeof window === 'undefined') {
        message.error('Client-side operation required');
        setProfileLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        message.error('Authentication token not found');
        setProfileLoading(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personalEmail: profileData.personalEmail,
          workEmail: profileData.workEmail,
          dateOfBirth: profileData.dateOfBirth || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Profile updated successfully!');
        // Update user context if work email changed
        if (user && profileData.workEmail !== user.email) {
          updateUser({ email: profileData.workEmail });
        }
      } else {
        message.error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      message.error('An error occurred while updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      message.error('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      // Only access localStorage on client side
      if (typeof window === 'undefined') {
        message.error('Client-side operation required');
        setPasswordLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        message.error('Authentication token not found');
        setPasswordLoading(false);
        return;
      }

      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        message.error(data.error || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      message.error('An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2}>Settings</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Profile Settings */}
          <Card>
            <Title level={4}>Profile Information</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Update your personal information. Note: You cannot change your role or position from here.
            </Text>

            <form onSubmit={handleProfileSubmit}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Personal Email</Text>
                  <Input
                    type="email"
                    value={profileData.personalEmail}
                    onChange={(e) => setProfileData({ ...profileData, personalEmail: e.target.value })}
                    disabled={profileLoading}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                
                <div>
                  <Text strong>Work Email</Text>
                  <Input
                    type="email"
                    value={profileData.workEmail}
                    onChange={(e) => setProfileData({ ...profileData, workEmail: e.target.value })}
                    disabled={profileLoading}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                
                <div>
                  <Text strong>Date of Birth</Text>
                  <Input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    disabled={profileLoading}
                    style={{ marginTop: '4px' }}
                  />
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={profileLoading ? <Spin size="small" /> : <SaveOutlined />}
                  loading={profileLoading}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </Space>
            </form>
          </Card>

          {/* Password Settings */}
          <Card>
            <Title level={4}>Change Password</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Update your password to keep your account secure.
            </Text>

            <form onSubmit={handlePasswordSubmit}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Current Password</Text>
                  <Input.Password
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    disabled={passwordLoading}
                    required
                    style={{ marginTop: '4px' }}
                  />
                </div>
                
                <div>
                  <Text strong>New Password</Text>
                  <Input.Password
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    disabled={passwordLoading}
                    required
                    style={{ marginTop: '4px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Password must be at least 6 characters long
                  </Text>
                </div>
                
                <div>
                  <Text strong>Confirm New Password</Text>
                  <Input.Password
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    disabled={passwordLoading}
                    required
                    style={{ marginTop: '4px' }}
                  />
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={passwordLoading ? <Spin size="small" /> : <LockOutlined />}
                  loading={passwordLoading}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </Space>
            </form>
          </Card>
        </Space>
      </div>
    </MainLayout>
  );
}
