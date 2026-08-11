'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useState, Suspense } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, MailOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthService } from '@/services/authService';
import AuthShell, { authSubmitStyle } from '@/components/auth/AuthShell';

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
    } catch (e) { }
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
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.24)',
          }}
        >
          <MailOutlined style={{ fontSize: 28, color: '#60A5FA' }} />
        </div>
        <Title level={4} style={{ marginTop: 0, marginBottom: 10, color: '#F8FAFC', fontWeight: 600 }}>
          Check your email
        </Title>
        <Text style={{ display: 'block', marginBottom: 28, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
          If an account with that email exists, a password reset link has been sent.
        </Text>
        <Link href="/login">
          <Button type="primary" block icon={<ArrowLeftOutlined />} className="zk-submit" style={authSubmitStyle}>
            Back to sign in
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
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#5A6982', marginRight: 8 }} />}
            placeholder="Email address"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            icon={<SendOutlined />}
            className="zk-submit"
            style={authSubmitStyle}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text style={{ fontSize: 13, color: '#5A6982' }}>
          Remember your password?{' '}
          <Link
            href="/login"
            className="zk-link"
            style={{ color: '#60A5FA', fontWeight: 500, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </Text>
      </div>
    </>
  );
}

function ForgotPasswordSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <Spin size="large" />
    </div>
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
