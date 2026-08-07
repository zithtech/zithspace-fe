'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Spin, Progress } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Logo from '@/assets/logo/Zukvologo.png';
import { AuthService } from '@/services/authService';

const { Title, Text } = Typography;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  
  // Calculate password strength
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 0) score += 20;
    if (pass.length >= 8) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/\d/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return score;
  };

  const strength = calculateStrength(password);
  
  let strengthColor = '#ff4d4f'; // red
  if (strength >= 60) strengthColor = '#faad14'; // orange
  if (strength >= 80) strengthColor = '#52c41a'; // green

  let strengthLabel = 'Weak';
  if (strength >= 60) strengthLabel = 'Medium';
  if (strength >= 80) strengthLabel = 'Strong';

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setError("No reset token provided.");
        setValidating(false);
        return;
      }
      
      try {
        await AuthService.validateResetToken(token);
        setTokenValid(true);
      } catch (err: any) {
        setTokenValid(false);
        setError(err.message || "Invalid or expired reset link.");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (values: any) => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');
      
      await AuthService.resetPassword(token, values.password);
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Verifying reset link...</Text>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 16 }}>Password Reset!</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
          Your password has been successfully reset. You can now login with your new password.
        </Text>
        <Link href="/login">
          <Button type="primary" block size="large">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Alert
          message="Invalid Link"
          description={error || "This password reset link is invalid or has expired."}
          type="error"
          showIcon
          style={{ marginBottom: 24, textAlign: 'left' }}
        />
        <Link href="/forgot-password">
          <Button block size="large">
            Request new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24, fontSize: 13 }}
          closable
          onClose={() => setError('')}
        />
      )}

      <Form
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="password"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter a new password' },
            { 
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, 
              message: 'Password must be at least 8 characters long and contain numbers and special characters.' 
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter new password"
            style={{ height: 44 }}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Item>

        {password && (
          <div style={{ marginBottom: 24, marginTop: -12 }}>
            <Progress 
              percent={strength} 
              strokeColor={strengthColor} 
              showInfo={false} 
              size="small" 
            />
            <Text type="secondary" style={{ fontSize: 12, color: strengthColor }}>
              Strength: {strengthLabel}
            </Text>
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Confirm new password"
            style={{ height: 44 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12, marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              height: 44,
              fontSize: 15,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #1677ff, #69c0ff)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
          border: 'none',
        }}
        styles={{
          body: {
            padding: 32,
          },
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 100,
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Image
              src={Logo}
              alt="Logo"
              width={70}
              height={70}
              style={{ objectFit: 'contain' }}
            />
          </div>
          
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Create New Password
          </Title>
        </div>

        <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '0 auto' }} />}>
          <ResetPasswordForm />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} Zukvo. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
}
