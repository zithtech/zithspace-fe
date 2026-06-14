'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Spin,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
// import Logo from '@/assets/logo/CMPLOGO.jpeg';
import Logo from '@/assets/logo/Zukvologo.png';


const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

// Separate component that uses useSearchParams
function LoginFormWithParams() {
  const { login, user } = useAuth();
  const { resolveTenant } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the redirect URL from query parameters
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) {
      // If user is already authenticated, redirect to the intended page
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  // Prefill email/password and resolve tenant subdomain from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');
    const subdomainParam = searchParams.get('subdomain');

    if (emailParam || passwordParam) {
      form.setFieldsValue({
        email: emailParam || '',
        password: passwordParam || '',
      });
    }

    if (subdomainParam) {
      resolveTenant(subdomainParam);
    }
  }, [searchParams, form]);

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      
      await login(values.email, values.password);
      // Navigation is handled by the useEffect below when `user` state is set
    } catch (error: any) {
      setError(error.message || 'Login failed');
      setLoading(false);
    }
    // Note: do NOT call setLoading(false) on success — keep spinner while navigating
  };

  if (user) {
    // User is authenticated — show a spinner while the useEffect triggers navigation
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Redirecting...</Text>
        </div>
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
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter your email"
            style={{ height: 44 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter your password' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter your password"
            style={{ height: 44 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            icon={<LoginOutlined />}
            style={{
              height: 44,
              fontSize: 15,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #1677ff, #69c0ff)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

// Loading fallback component
function LoginFormSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">Loading login form...</Text>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
    // background: '#ffffff',
    // borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    // boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
            Welcome Back !!!
          </Title>
          
          {/* <Text type="secondary" style={{ fontSize: 14 }}>
            Sign in to your Z account
          </Text> */}
        </div>

        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginFormWithParams />
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
