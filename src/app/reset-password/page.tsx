'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, Button, Typography, Alert, Progress } from 'antd';
import { LockOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthService } from '@/services/authService';
import AuthShell, { authSubmitStyle } from '@/components/auth/AuthShell';
import ZukvoLoader from "@/components/common/ZukvoLoader";

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

  // Ash → blue → green, so the meter stays inside the product palette
  let strengthColor = '#94A3B8';
  if (strength >= 60) strengthColor = '#3B82F6';
  if (strength >= 80) strengthColor = '#22C55E';

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
        <ZukvoLoader size="lg" />
        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: '#5A6982' }}>Verifying reset link...</Text>
        </div>
      </div>
    );
  }

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
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.24)',
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 28, color: '#4ADE80' }} />
        </div>
        <Title level={4} style={{ marginTop: 0, marginBottom: 10, color: '#F8FAFC', fontWeight: 600 }}>
          Password reset
        </Title>
        <Text style={{ display: 'block', marginBottom: 28, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
          Your password has been reset. You can now sign in with your new password.
        </Text>
        <Link href="/login">
          <Button type="primary" block icon={<ArrowLeftOutlined />} className="zk-submit" style={authSubmitStyle}>
            Go to sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Alert
          message="Invalid link"
          description={error || "This password reset link is invalid or has expired."}
          type="error"
          showIcon
          style={{ marginBottom: 24, textAlign: 'left', fontSize: 13 }}
        />
        <Link href="/forgot-password">
          <Button block className="zk-ghost">
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
          rules={[
            { required: true, message: 'Please enter a new password' },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
              message: 'Password must be at least 8 characters long and contain numbers and special characters.'
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#5A6982', marginRight: 8 }} />}
            placeholder="New password"
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Item>

        {password && (
          <div style={{ marginBottom: 16, marginTop: -4, padding: '0 4px' }}>
            <Progress
              percent={strength}
              strokeColor={strengthColor}
              trailColor="rgba(148, 163, 184, 0.14)"
              showInfo={false}
              size="small"
            />
            <Text style={{ fontSize: 12, color: strengthColor }}>
              Strength: {strengthLabel}
            </Text>
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              }
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#5A6982', marginRight: 8 }} />}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            icon={<LockOutlined />}
            className="zk-submit"
            style={authSubmitStyle}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text style={{ fontSize: 13, color: '#5A6982' }}>
          Back to{' '}
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

function ResetPasswordSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <ZukvoLoader size="lg" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell subtitle="Create a new password for your account.">
      <Suspense fallback={<ResetPasswordSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
