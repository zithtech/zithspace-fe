import { useState, useCallback, useEffect } from 'react';
import { SalaryApprovalService, Workflow, UpsertWorkflowData } from '@/services/salaryApprovalService';
import { message } from 'antd';

export function useSalaryWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SalaryApprovalService.getWorkflows();
      setWorkflows(data);
    } catch (error: any) {
      message.error(error.message || "Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWorkflow = async (data: UpsertWorkflowData) => {
    try {
      const result = await SalaryApprovalService.upsertWorkflow(data);
      if (result) {
        message.success("Workflow saved successfully");
        fetchWorkflows();
        return result;
      }
    } catch (error: any) {
      message.error(error.message || "Failed to save workflow");
      return null;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await SalaryApprovalService.deleteWorkflow(id);
      message.success("Workflow deleted successfully");
      fetchWorkflows();
    } catch (error: any) {
      message.error(error.message || "Failed to delete workflow");
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    fetchWorkflows,
    saveWorkflow,
    deleteWorkflow,
  };
}
