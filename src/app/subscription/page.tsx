'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Typography, Card, Button, Row, Col, Space, Divider, Alert, Spin, message } from 'antd';
import { LockOutlined, CrownOutlined, CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { loadRazorpay } from '@/utils/loadRazorpay';
import { paymentService } from '@/services/payment.service';
import dayjs from 'dayjs';

import { useProduct } from '@/context/ProductContext';

const { Title, Text } = Typography;

const SubscriptionPaywallContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { manifest } = useProduct();
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
              ? `Welcome to ${manifest.name}!`
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
          <div className="mb-10">
            <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0a0a0a]" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-center justify-between mb-4">
                <Title level={5} className="!m-0 !text-slate-800 dark:!text-slate-200 font-semibold">Current Subscription</Title>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-[#111] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Text type="secondary" className="block mb-1 text-[10px] uppercase tracking-wider font-semibold">Plan</Text>
                  <Text strong className="text-base block dark:text-white">{plans.find(p => p.id === subscription.plan_id)?.name}</Text>
                  <Text type="secondary" className="text-xs">${subscription.billing_cycle === 'YEARLY' ? plans.find(p => p.id === subscription.plan_id)?.yearly_amount : plans.find(p => p.id === subscription.plan_id)?.monthly_amount}/{subscription.billing_cycle === 'YEARLY' ? 'year' : 'month'}</Text>
                </div>
                <div className="bg-slate-50 dark:bg-[#111] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Text type="secondary" className="block mb-1 text-[10px] uppercase tracking-wider font-semibold">Auto Renew</Text>
                  <Text strong className="text-base text-emerald-600 dark:text-emerald-400">
                    {subscription.auto_renew ? 'ON' : 'OFF'}
                  </Text>
                </div>
                <div className="bg-slate-50 dark:bg-[#111] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Text type="secondary" className="block mb-1 text-[10px] uppercase tracking-wider font-semibold">Status</Text>
                  <Text strong className="text-base capitalize dark:text-white">{subscription.status?.toLowerCase() || 'N/A'}</Text>
                </div>
                <div className="bg-slate-50 dark:bg-[#111] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Text type="secondary" className="block mb-1 text-[10px] uppercase tracking-wider font-semibold">Expires</Text>
                  <Text strong className="text-base block dark:text-white">
                    {subscription.expires_at ? dayjs(subscription.expires_at).format('DD MMM YYYY') : 'N/A'}
                  </Text>
                </div>
              </div>
            </Card>
          </div>

        )}

        <Title level={3} className="text-center !text-slate-800 dark:!text-slate-200 !font-semibold !mb-10">Available Plans</Title>
        {loading ? (
          <div className="text-center py-20"><Spin size="large" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-[1600px] mx-auto">
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
                <div key={plan.id} className="flex">
                  <Card 
                    hoverable 
                    className="w-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 bg-white dark:bg-[#0a0a0a] shadow-sm hover:shadow-xl group"
                    bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}
                  >
                    <div className="p-5 flex flex-col h-full gap-3">
                      {/* Top Label */}
                      <div className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase">
                        For Your Team
                      </div>
                      
                      {/* Title & Badge */}
                      <div className="flex items-center justify-between">
                        <Title level={4} className="!m-0 !text-slate-900 dark:!text-white font-bold tracking-tight">
                          {plan.name}
                        </Title>
                        {isCurrentPlan && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full flex items-center font-bold border border-amber-200 dark:border-amber-700/50 uppercase tracking-wider">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Price Block */}
                      <div className="mt-1">
                        <div className="flex items-baseline mb-0.5">
                          <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">${plan.monthly_amount}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-medium text-xs">/ month</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Billed monthly · Global</span>
                      </div>
                      
                      {/* Button */}
                      <Button 
                        type={isCurrentPlan ? 'default' : 'primary'}
                        disabled={isButtonDisabled}
                        block 
                        size="large" 
                        onClick={() => handlePayNow(plan)} 
                        className={`mt-3 h-[40px] text-sm font-semibold rounded-full transition-all ${isCurrentPlan ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none' : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-slate-100 dark:text-black border-none'}`}
                      >
                        {buttonLabel === 'Select Plan' ? 'Get started' : buttonLabel}
                      </Button>

                      {/* Divider & Features */}
                      <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4 flex-1 flex flex-col">
                        <div className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase mb-3">
                          Includes
                        </div>
                        
                        {/* Features List */}
                        <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                          <ul className="space-y-2.5 m-0 p-0 list-none">
                            {(plan.includes || []).map((point: any, idx: number) => {
                              const title = typeof point === 'string' ? point : point.title;
                              const subPoints = typeof point === 'string' ? [] : (point.subPoints || []);
                              
                              return (
                                <li key={idx} className="flex flex-col text-slate-700 dark:text-slate-300">
                                  <div className="flex items-start">
                                    <svg className="w-4 h-4 text-blue-500 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-[13px] font-medium leading-relaxed">{title}</span>
                                  </div>
                                  {subPoints.length > 0 && (
                                    <ul className="mt-1 ml-6 space-y-1">
                                      {subPoints.map((sub: string, sIdx: number) => (
                                        <li key={sIdx} className="flex items-start text-slate-500 dark:text-slate-400">
                                          <span className="text-[10px] mr-1.5 mt-0.5 shrink-0 opacity-60">◆</span>
                                          <span className="text-xs leading-relaxed">{sub}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
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

