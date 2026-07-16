'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Typography, Card, Button, Row, Col, Space, Divider, Alert, Spin } from 'antd';
import { LockOutlined, CrownOutlined, CheckCircleOutlined, CreditCardOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';

const { Title, Text, Paragraph } = Typography;

const SubscriptionPaywallContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  useEffect(() => {
    // Clear access token to force re-auth on next normal request if needed
    // Actually, don't clear it so the API can still know who we are to get plans.
    
    // Fetch plans from admin API. In a real decoupled setup, we might proxy this.
    // For now, let's assume we can fetch plans directly or they are available in the public tenant API.
    const fetchPlans = async () => {
      try {
        const res = await api.get('/api/plans');
        setPlans(Array.isArray(res) ? res : (res as any)?.data || []);
      } catch (err) {
        console.error("Failed to fetch plans from admin API", err);
        setPlans([]); // No fallback, fetch strictly from admin API
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentTenant');
    window.location.href = '/login';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const renderManualPayment = (plan: any) => (
    <Card className="manual-payment-card" style={{ marginTop: '20px', background: '#f8fafc', borderColor: '#cbd5e1' }}>
      <Title level={4}><CreditCardOutlined /> Complete Your Payment Offline</Title>
      <Paragraph>
        Zukvo currently processes payments manually. Please complete your payment using one of the methods below for the <strong>{plan.name}</strong> plan (₹{plan.monthly_amount}/month).
      </Paragraph>
      <Divider />
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <div style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Title level={5}>UPI Payment</Title>
            <div style={{ width: '150px', height: '150px', background: '#e2e8f0', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">[QR CODE]</Text>
            </div>
            <Text strong>Scan using any UPI app</Text><br />
            <Text type="secondary">zukvo@bank</Text>
          </div>
        </Col>
        
        <Col xs={24} md={12}>
          <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', height: '100%' }}>
            <Title level={5}>Bank Transfer (NEFT/RTGS)</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><Text type="secondary">Account Name:</Text> <Text strong>Zukvo SaaS Pvt Ltd</Text></div>
              <div><Text type="secondary">Account Number:</Text> <Text strong>12345678901234</Text></div>
              <div><Text type="secondary">IFSC Code:</Text> <Text strong>ZUKV0001234</Text></div>
              <div><Text type="secondary">Bank Name:</Text> <Text strong>Global Startup Bank</Text></div>
            </Space>
          </div>
        </Col>
      </Row>

      <Alert 
        message="Important Instruction" 
        description="Please include your Tenant ID in the payment reference or remarks. Once paid, contact your administrator to activate your account."
        type="warning" 
        showIcon 
        style={{ marginTop: '20px' }} 
      />
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space size="middle">
          <Button type="primary" onClick={handleRefresh}>I have paid, check status</Button>
          <Button onClick={() => setSelectedPlan(null)}>Choose a different plan</Button>
        </Space>
      </div>
    </Card>
  );

  const formatFeatureName = (name: string) => {
    if (!name) return '';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div style={{ height: '100vh', width: '100%', overflowY: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#64748b', marginBottom: '16px' }} />
          <Title level={2}>Access Restricted</Title>
          <Text type="secondary" style={{ fontSize: '18px' }}>
            Your free trial has ended or your subscription is no longer active.
          </Text>
        </div>

        {selectedPlan ? (
          renderManualPayment(selectedPlan)
        ) : (
          <>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '32px' }}>Choose a Plan to Continue</Title>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
            ) : (
              <Row gutter={[24, 24]} justify="center">
                {plans.map(plan => {
                  const currentPlanIdParam = searchParams.get('current_plan_id');
                  const currentPlanId = currentPlanIdParam ? parseInt(currentPlanIdParam, 10) : null;
                  const isCurrentPlan = currentPlanId === plan.id;
                  const currentPlan = plans.find(p => p.id === currentPlanId);
                  const isUpgrade = currentPlan && plan.monthly_amount > currentPlan.monthly_amount;
                  
                  let buttonLabel = 'Select Plan';
                  if (isCurrentPlan) buttonLabel = 'Renew Plan';
                  else if (isUpgrade) buttonLabel = `Upgrade to ${plan.name}`;

                  return (
                    <Col xs={24} md={12} lg={8} key={plan.id}>
                      <Card 
                        hoverable 
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}
                      >
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <Title level={4}>
                            {plan.name}
                            {isCurrentPlan && (
                              <CrownOutlined style={{ color: '#f59e0b', marginLeft: '8px', fontSize: '18px' }} title="Current Plan" />
                            )}
                          </Title>
                          <Text type="secondary">{plan.description}</Text>
                          <div style={{ margin: '24px 0' }}>
                            <Text style={{ fontSize: '32px', fontWeight: 'bold' }}>₹{plan.monthly_amount}</Text>
                            <Text type="secondary"> / month</Text>
                          </div>
                          
                          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '8px', marginBottom: '24px' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {(plan.features || []).map((feature: string, idx: number) => (
                                <li key={idx} style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start' }}>
                                  <CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px', marginTop: '4px' }} />
                                  <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>{formatFeatureName(feature)}</Text>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <Button 
                          type={isCurrentPlan ? 'default' : 'primary'} 
                          block 
                          size="large" 
                          onClick={() => setSelectedPlan(plan)} 
                          style={{ marginTop: 'auto' }}
                        >
                          {buttonLabel}
                        </Button>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </>
        )}

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <Card size="small" style={{ display: 'inline-block', minWidth: '300px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong><SafetyCertificateOutlined /> Need help?</Text>
              <Text type="secondary">Contact our billing team at billing@zukvo.com</Text>
              <Divider style={{ margin: '12px 0' }} />
              <Button type="link" danger onClick={handleLogout}>Log Out</Button>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionPaywallPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>}>
      <SubscriptionPaywallContent />
    </Suspense>
  );
}
