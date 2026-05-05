'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Result, Button, Spin, Typography } from 'antd';
import { MailService } from '@/services/mailService';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function VerifyMailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const response = await MailService.verifyInvoiceMail(token);
        if (response.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(response.error || 'Verification failed. The link may have expired.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'An error occurred during verification.');
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card style={{ width: 500, borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div style={{ marginTop: 24 }}>
              <Text strong style={{ fontSize: 18 }}>{message}</Text>
            </div>
          </div>
        )}

        {status === 'success' && (
          <Result
            status="success"
            title="Email Verified!"
            subTitle={message}
            extra={[
              <Button type="primary" key="settings" onClick={() => router.push('/settings?tab=mail')}>
                Go to Settings
              </Button>
            ]}
          />
        )}

        {status === 'error' && (
          <Result
            status="error"
            title="Verification Failed"
            subTitle={message}
            extra={[
              <Button type="primary" key="settings" onClick={() => router.push('/settings?tab=mail')}>
                Back to Settings
              </Button>
            ]}
          />
        )}
      </Card>
    </div>
  );
}
