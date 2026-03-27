import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import { SalaryApprovalService } from "@/services/salaryApprovalService";

export const useSalaryApprovals = (activeTab: string = 'pending') => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const result = activeTab === 'pending' 
        ? await SalaryApprovalService.getPendingApprovals()
        : await SalaryApprovalService.getAllApprovals();
      setData(result || []);
    } catch (error: any) {
      console.error('Fetch approvals error:', error);
      message.error('Failed to fetch approval records');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const processApprovalAction = async (payload: { 
    salaryPayoutId: string; 
    action: 'APPROVE' | 'REJECT'; 
    remarks?: string 
  }) => {
    setIsProcessing(true);
    try {
      const res = await SalaryApprovalService.processApprovalStep(payload);
      if (res.success) {
        message.success(`Salary payout ${payload.action.toLowerCase()}d successfully`);
        await fetchApprovals();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Process Approval Error:", error);
      message.error("Failed to process approval");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    data,
    loading,
    isProcessing,
    fetchApprovals,
    processApprovalAction
  };
};
