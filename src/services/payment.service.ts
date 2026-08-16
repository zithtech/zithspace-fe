import { api } from '@/lib/axios';

export const paymentService = {
  createOrder: async (planId: number, billingCycle: string) => {
    const response = await api.post('/api/payments/order', {
      planId,
      billingCycle,
    });
    return response;
  },

  verifyPayment: async (payload: { razorpay_order_id?: string; razorpay_payment_id: string; razorpay_signature: string; razorpay_subscription_id?: string }) => {
    const response = await api.post('/api/payments/verify', payload);
    return response;
  }
};
