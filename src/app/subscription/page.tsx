'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Typography, Card, Button, Row, Col, Space, Divider, Alert, Spin, message } from 'antd';
import { LockOutlined, CrownOutlined, CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { loadRazorpay } from '@/utils/loadRazorpay';
import { paymentService } from '@/services/payment.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SubscriptionPaywallContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await api.get('/api/plans');
        const fetchedPlans = Array.isArray(plansRes) ? plansRes : (plansRes as any)?.data || [];
        setPlans(fetchedPlans.filter((plan: any) => plan.plan_type?.toLowerCase() === 'paid'));
        
        // Also fetch current subscription to know the current plan
        try {
            const authRes = await api.get('/api/auth/me');
            const tenantId = authRes?.tenantId || authRes?.tenant?.id;
            if (tenantId) {
                const subRes = await api.get(`/api/subscriptions/tenant/${tenantId}`);
                if (subRes) {
                    setSubscription(subRes);
                    if (subRes.plan_id) {
                        setCurrentPlanId(subRes.plan_id);
                    }
                }
            }
        } catch (subErr) {
            console.error("Failed to fetch current subscription", subErr);
        }
      } catch (err) {
        console.error("Failed to fetch plans from admin API", err);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentTenant');
    window.location.href = '/login';
  };

  const handlePayNow = async (plan: any) => {
    setLoading(true);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        message.error('Razorpay failed to load');
        setLoading(false);
        return;
      }

      // Create Order / Select Plan
      const response = await paymentService.createOrder(plan.id, 'MONTHLY');
      const orderData = response; // api.post already unwraps response.data.data

      if (orderData.action === 'TRIAL_STARTED') {
        await api.get('/api/auth/me'); // Refresh user
        window.location.href = '/dashboard';
        return;
      }
      
      if (orderData.action === 'DOWNGRADE_SCHEDULED') {
        message.success(`Success: ${orderData.message || 'Plan downgraded successfully. Changes will apply next billing cycle.'}`);
        setLoading(false);
        return;
      }

      if (orderData.action === 'SUBSCRIPTION_UPDATED') {
        message.success(`Success: ${orderData.message || 'Plan updated successfully!'}`);
        await api.get('/api/auth/me'); // Refresh user
        window.location.href = '/dashboard';
        return;
      }

      if (orderData.action === 'PAYMENT_REQUIRED') {
        const paymentData = orderData.data;

        const options: any = {
          key: orderData.key || paymentData?.key,
          name: 'Zukvo SaaS',
          description: `Subscription to ${plan.name} plan`,
          handler: async function (response: any) {
            try {
              setLoading(true);
              await paymentService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_subscription_id: response.razorpay_subscription_id
              });
              // Refresh User & Subscription (auth/me usually refreshes the navigation too)
              await api.get('/api/auth/me');
              window.location.href = '/dashboard';
            } catch (err) {
              message.error('Payment verification failed');
              setLoading(false);
            }
          },
          theme: {
            color: '#2563eb',
          },
        };

        if (orderData.subscription_id) {
          options.subscription_id = orderData.subscription_id;
        } else if (paymentData?.orderId) {
          options.order_id = paymentData.orderId;
          options.amount = paymentData.amount;
          options.currency = paymentData.currency;
        } else {
           throw new Error('Failed to create order or subscription');
        }

        const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        message.error('Payment Failed: ' + response.error.description);
      });
      rzp1.open();
      }
    } catch (err: any) {
      console.error(err);
      message.error('Error initiating payment: ' + (err.response?.data?.error || err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const formatFeatureName = (name: string) => {
    if (!name) return '';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6 shadow-inner ring-4 ring-blue-50 dark:ring-blue-900/10">
            <LockOutlined className="text-4xl sm:text-5xl text-blue-600 dark:text-blue-400" />
          </div>
          <Title level={2} className="!text-slate-900 dark:!text-white !font-bold tracking-tight !mb-4">
            {searchParams.get('reason') === 'new' 
              ? 'Welcome to Zukvo!' 
              : searchParams.get('reason') === 'limit'
              ? 'Upgrade Required'
              : 'Access Restricted'}
          </Title>
          <Text className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto block">
            {searchParams.get('reason') === 'new'
              ? 'Please select a subscription plan to activate your workspace and get started.'
              : searchParams.get('reason') === 'limit'
              ? 'You have reached the limits of your current plan. Please upgrade to continue.'
              : 'Your free trial has ended or your subscription is no longer active.'}
          </Text>
        </div>

        {!loading && subscription && plans.find(p => p.id === subscription.plan_id) && (
          <div className="mb-16">
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
              <Title level={4} className="!mb-6 !mt-0 !text-slate-800 dark:!text-slate-200">Current Subscription</Title>
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Text type="secondary" className="block mb-1 text-xs uppercase tracking-wider font-semibold">Current Plan</Text>
                    <Text strong className="text-lg block">{plans.find(p => p.id === subscription.plan_id)?.name}</Text>
                    <Text type="secondary">${subscription.billing_cycle === 'YEARLY' ? plans.find(p => p.id === subscription.plan_id)?.yearly_amount : plans.find(p => p.id === subscription.plan_id)?.monthly_amount}/{subscription.billing_cycle === 'YEARLY' ? 'year' : 'month'}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Text type="secondary" className="block mb-1 text-xs uppercase tracking-wider font-semibold">Auto Renew</Text>
                    <Text strong className="text-lg text-emerald-600 dark:text-emerald-400">
                      {subscription.auto_renew ? 'ON' : 'OFF'}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Text type="secondary" className="block mb-1 text-xs uppercase tracking-wider font-semibold">Status</Text>
                    <Text strong className="text-lg capitalize">{subscription.status?.toLowerCase() || 'N/A'}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Text type="secondary" className="block mb-1 text-xs uppercase tracking-wider font-semibold">Expires</Text>
                    <Text strong className="text-lg block">
                      {subscription.expires_at ? dayjs(subscription.expires_at).format('DD MMM YYYY') : 'N/A'}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}

        <Title level={3} className="text-center !text-slate-800 dark:!text-slate-200 !font-semibold !mb-10">Available Plans</Title>
        {loading ? (
          <div className="text-center py-20"><Spin size="large" /></div>
        ) : (
          <Row gutter={[32, 32]} justify="center">
            {plans.map(plan => {
              // Fallback to URL param if state hasn't populated it or it's provided explicitly
              const urlPlanIdParam = searchParams.get('current_plan_id');
              const activePlanId = currentPlanId || (urlPlanIdParam ? parseInt(urlPlanIdParam, 10) : null);
              
              const isCurrentPlan = activePlanId === plan.id;
              const currentPlan = plans.find(p => p.id === activePlanId);
              
              let buttonLabel = 'Select Plan';
              let isButtonDisabled = false;
              if (isCurrentPlan) {
                buttonLabel = 'Current Plan';
                isButtonDisabled = true;
              } else if (currentPlan) {
                if (Number(plan.monthly_amount) > Number(currentPlan.monthly_amount)) {
                  buttonLabel = 'Upgrade';
                } else {
                  buttonLabel = 'Downgrade';
                }
              }

              return (
                <Col xs={24} sm={20} md={12} lg={8} key={plan.id} className="flex">
                  <Card 
                    hoverable 
                    className="w-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl group"
                    bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}
                  >
                    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50">
                      <Title level={4} className="!text-slate-900 dark:!text-white flex items-center justify-between !mb-2">
                        {plan.name}
                        {isCurrentPlan && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-3 py-1 rounded-full flex items-center font-medium border border-amber-200 dark:border-amber-700/50">
                            <CrownOutlined className="mr-1.5" /> Current
                          </span>
                        )}
                      </Title>
                      <Text className="text-slate-500 dark:text-slate-400 block h-10 line-clamp-2">{plan.description}</Text>
                      <div className="mt-6 flex items-baseline">
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">${plan.monthly_amount}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2 font-medium">/ month</span>
                      </div>
                    </div>
                    
                    <div className="p-6 sm:p-8 flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex-1 overflow-y-auto max-h-[280px] pr-2 mb-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <ul className="space-y-4 m-0 p-0 list-none">
                          {(plan.includes || []).map((point: any, idx: number) => {
                            const title = typeof point === 'string' ? point : point.title;
                            const subPoints = typeof point === 'string' ? [] : (point.subPoints || []);
                            
                            return (
                              <li key={idx} className="flex flex-col text-slate-600 dark:text-slate-300">
                                <div className="flex items-start">
                                  <CheckCircleOutlined className="text-emerald-500 text-lg mr-3 shrink-0 mt-0.5" />
                                  <span className="text-sm font-medium leading-relaxed">{title}</span>
                                </div>
                                {subPoints.length > 0 && (
                                  <ul className="mt-2 ml-8 space-y-2">
                                    {subPoints.map((sub: string, sIdx: number) => (
                                      <li key={sIdx} className="flex items-start text-slate-500 dark:text-slate-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mr-2.5 mt-2 shrink-0"></span>
                                        <span className="text-sm leading-relaxed">{sub}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <Button 
                        type={isCurrentPlan ? 'default' : 'primary'}
                        disabled={isButtonDisabled}
                        block 
                        size="large" 
                        onClick={() => handlePayNow(plan)} 
                        className={`mt-auto h-12 text-base font-semibold rounded-xl transition-all ${isCurrentPlan ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-none' : 'bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40'}`}
                      >
                        {buttonLabel}
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        <div className="mt-16 text-center">
          <div className="inline-block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-w-[320px] max-w-sm w-full mx-auto">
            <Space direction="vertical" size="middle" className="w-full">
              <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-white font-medium text-lg">
                <SafetyCertificateOutlined className="text-blue-500 text-xl" /> Need help?
              </div>
              <Text className="text-slate-500 dark:text-slate-400 block px-4">Contact our billing team at <br/> <a href="mailto:billing@zukvo.com" className="text-blue-600 dark:text-blue-400 hover:underline">billing@zukvo.com</a></Text>
              <Divider className="border-slate-200 dark:border-slate-700 my-2" />
              <Button type="text" danger onClick={handleLogout} className="font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-6 h-10">
                Log Out
              </Button>
            </Space>
          </div>
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

