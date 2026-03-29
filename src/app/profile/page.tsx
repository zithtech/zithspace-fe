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
  Form,
  Alert,
  Divider,
  Row,
  Col,
  Avatar,
  Tag,
  Descriptions,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  LockOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
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

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // State management
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
        const userProfile = await AuthService.getProfile();
        
        setUserProfile(userProfile);
        
        // Pre-fill the form with current data
        profileForm.setFieldsValue({
          name: userProfile.name || '',
          phone: userProfile.phone || '',
          personalEmail: userProfile.personalEmail || '',
          workEmail: userProfile.workEmail || '',
          dateOfBirth: userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth).format('YYYY-MM-DD') : '',
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to load profile');
        }
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
      
      // Update the form with the latest data
      profileForm.setFieldsValue({
        name: updatedProfile.name || '',
        phone: updatedProfile.phone || '',
        personalEmail: updatedProfile.personalEmail || '',
        workEmail: updatedProfile.workEmail || '',
        dateOfBirth: updatedProfile.dateOfBirth ? dayjs(updatedProfile.dateOfBirth).format('YYYY-MM-DD') : '',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An error occurred while updating profile');
      }
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

      if (values.newPassword !== values.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (values.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }

      const passwordData: ChangePasswordData = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      };

      await AuthService.changePassword(passwordData);
      
      setSuccess('Password changed successfully!');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Failed to change password:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An error occurred while changing password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#ff4d4f';
      case 'admin':
        return '#faad14';
      default:
        return '#52c41a';
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Space align="center">
            <UserOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <Title level={2} style={{ margin: 0 }}>
              My Profile
            </Title>
          </Space>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setError('')}
          />
        )}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setSuccess('')}
          />
        )}

        <Row gutter={[24, 24]}>
          {/* Profile Information Display */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <IdcardOutlined style={{ color: '#1677ff' }} />
                  <span>Profile Information</span>
                </Space>
              }
              size="small"
            >
              {userProfile && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {/* Avatar and Basic Info */}
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      size={80}
                      style={{
                        backgroundColor: getRoleColor(userProfile.role),
                        fontSize: 32,
                        fontWeight: 600,
                        marginBottom: 12,
                      }}
                    >
                      {userProfile.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {userProfile.name}
                      </Title>
                      <Text type="secondary">{userProfile.position?.title}</Text>
                    </div>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  {/* Detailed Information */}
                  <Descriptions column={1} size="small">
                    <Descriptions.Item 
                      label={<><TeamOutlined /> Role</>}
                    >
                      <Tag color={getRoleColor(userProfile.role)} style={{ fontSize: 11 }}>
                        {userProfile.role.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    
                    <Descriptions.Item 
                      label={<><PhoneOutlined /> Phone</>}
                    >
                      {userProfile.phone}
                    </Descriptions.Item>
                    
                    <Descriptions.Item 
                      label={<><MailOutlined /> Work Email</>}
                    >
                      {userProfile.workEmail}
                    </Descriptions.Item>
                    
                    <Descriptions.Item 
                      label={<><MailOutlined /> Personal Email</>}
                    >
                      {userProfile.personalEmail}
                    </Descriptions.Item>
                    
                    {userProfile.reportsTo && (
                      <Descriptions.Item 
                        label={<><UserOutlined /> Reports To</>}
                      >
                        {userProfile.reportsTo.name}
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {userProfile.reportsTo?.position?.title}
                        </Text>
                      </Descriptions.Item>
                    )}
                    
                    {userProfile.dateOfBirth && (
                      <Descriptions.Item 
                        label={<><CalendarOutlined /> Date of Birth</>}
                      >
                        {dayjs(userProfile.dateOfBirth).format('MMM DD, YYYY')}
                      </Descriptions.Item>
                    )}
                    
                    <Descriptions.Item 
                      label={<><CalendarOutlined /> Joined</>}
                    >
                      {dayjs(userProfile.createdAt).format('MMM DD, YYYY')}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Status">
                      <Tag color={userProfile.isActive ? 'green' : 'red'} style={{ fontSize: 11 }}>
                        {userProfile.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              )}
            </Card>
          </Col>

          {/* Settings Forms */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              {/* Profile Settings Form */}
              <Card
                title={
                  <Space>
                    <SaveOutlined style={{ color: '#52c41a' }} />
                    <span>Edit Profile</span>
                  </Space>
                }
                size="small"
              >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Update your personal information. Note: You cannot change your role or position from here.
                </Text>

                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileSubmit}
                  size="middle"
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[
                          { required: true, message: 'Please enter your full name' },
                          { min: 2, message: 'Name must be at least 2 characters' },
                        ]}
                      >
                        <Input placeholder="Enter your full name" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[
                          { required: true, message: 'Please enter your phone number' },
                        ]}
                      >
                        <Input placeholder="Enter your phone number" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="personalEmail"
                        label="Personal Email"
                        rules={[
                          { required: true, message: 'Please enter your personal email' },
                          { type: 'email', message: 'Please enter a valid email address' },
                        ]}
                      >
                        <Input placeholder="Enter your personal email" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="workEmail"
                        label="Work Email"
                        rules={[
                          { required: true, message: 'Please enter your work email' },
                          { type: 'email', message: 'Please enter a valid email address' },
                        ]}
                      >
                        <Input placeholder="Enter your work email" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                  >
                    <Input type="date" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={profileLoading}
                      size="middle"
                    >
                      {profileLoading ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* Password Change Form */}
              <Card
                title={
                  <Space>
                    <LockOutlined style={{ color: '#faad14' }} />
                    <span>Change Password</span>
                  </Space>
                }
                size="small"
              >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Update your password to keep your account secure. All fields are required.
                </Text>

                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                  size="middle"
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[
                      { required: true, message: 'Please enter your current password' },
                    ]}
                  >
                    <Input.Password placeholder="Enter your current password" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                          { required: true, message: 'Please enter your new password' },
                          { min: 6, message: 'Password must be at least 6 characters long' },
                        ]}
                      >
                        <Input.Password placeholder="Enter your new password" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        rules={[
                          { required: true, message: 'Please confirm your new password' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Passwords do not match'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password placeholder="Confirm your new password" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<LockOutlined />}
                      loading={passwordLoading}
                      size="middle"
                    >
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
