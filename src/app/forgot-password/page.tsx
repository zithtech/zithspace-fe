'use client';

import React, { useState, Suspense } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Spin } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Logo from '@/assets/logo/Zukvologo.png';
import { AuthService } from '@/services/authService';

const { Title, Text } = Typography;

function resolveHostInfo() {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  let subdomain = "";
  let rootHost = window.location.host;

  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  let hasValidEnvRoot = false;
  if (envAppUrl) {
    try {
      rootHost = new URL(envAppUrl).host;
      hasValidEnvRoot = true;
    } catch (e) {}
  }

  if (isLocalhost) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== "localhost" && parts[0] !== "127") {
      if (parts[0] !== "app") subdomain = parts[0];
    }
  } else {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "app") {
      subdomain = parts[0];
    }
  }

  if (window.location.host === rootHost) {
    subdomain = ""; 
  }

  return { subdomain, rootHost };
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    try {
      setLoading(true);
      setError('');
      
      const { subdomain } = resolveHostInfo();
      const targetSubdomain = searchParams.get('subdomain') || subdomain || undefined;

      await AuthService.forgotPassword(values.email, targetSubdomain);
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <MailOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 16 }}>Check your email</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
          If an account with that email exists, a password reset link has been sent.
        </Text>
        <Link href="/login">
          <Button type="primary" block size="large">
            Back to Login
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary">
          Remember your password?{' '}
          <Link href="/login" style={{ color: '#1677ff' }}>
            Back to Login
          </Link>
        </Text>
      </div>
    </>
  );
}

export default function ForgotPasswordPage() {
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
            Forgot Password
          </Title>
        </div>

        <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '0 auto' }} />}>
          <ForgotPasswordForm />
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
