import { useState, useCallback, useEffect } from 'react';
import { SalaryApprovalService } from '@/services/salaryApprovalService';
import { message } from 'antd';
import dayjs from 'dayjs';

export function useApprovedPayouts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMailModalVisible, setIsMailModalVisible] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bankFile, setBankFile] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [month, setMonth] = useState<number>(dayjs().month() + 1);
  const [year, setYear] = useState<number>(dayjs().year());

  const fetchApprovedPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await SalaryApprovalService.getApprovedPayouts(month, year);
      setData(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Fetch approved payouts error:', error);
      message.error(error.message || 'Failed to fetch approved payouts');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const fetchLatestBankFile = useCallback(async () => {
    try {
      const response = await SalaryApprovalService.getLatestBankFile(month, year);
      console.log("Latest Bank File Response:", response);
      if (response) {
        setBankFile(response);
      } else {
        setBankFile(null);
      }
    } catch (error) {
      console.error('Fetch latest bank file error:', error);
    }
  }, [month, year]);

  const generateBankFile = async () => {
    setIsGenerating(true);
    try {
      console.log("Generating bank file for", month, year);
      const response = await SalaryApprovalService.generateBankFile(month, year);
      console.log("Generate Bank File Response:", response);
      
      if (response) {
        message.success("Bank file generated successfully. Downloading...");
        setBankFile(response);
        
        // Auto-download after setting state
        if (response.fileUrl) {
          window.open(response.fileUrl, '_blank');
        }
      }
    } catch (error: any) {
      console.error("Generate error:", error);
      message.error(error.response?.data?.error || error.message || "Failed to generate bank file");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadBankFile = () => {
    if (!bankFile?.fileUrl) return;
    window.open(bankFile.fileUrl, '_blank');
  };

  const sendBankFileEmail = async () => {
    if (!toEmail) {
      message.warning("Please enter a recipient email");
      return;
    }

    setSendingEmail(true);
    try {
      await SalaryApprovalService.sendBankFileEmail(bankFile.id, toEmail);
      message.success("Bank disbursement email sent successfully");
      setIsMailModalVisible(false);
      setToEmail('');
      await fetchLatestBankFile(); // Refresh status
    } catch (error: any) {
      console.error("Email error:", error);
      message.error(error.response?.data?.error || error.message || "Failed to send bank disbursement email");
    } finally {
      setSendingEmail(false);
    }
  };

  const markAsPaid = async () => {
    setMarkingPaid(true);
    try {
      await SalaryApprovalService.markAsPaid(month, year);
      message.success("All payouts marked as PAID successfully");
      await fetchApprovedPayouts(); // Refresh status in table
      await fetchLatestBankFile(); // Refresh bank file status
    } catch (error: any) {
      console.error("Mark as paid error:", error);
      message.error(error.response?.data?.error || error.message || "Failed to mark as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  useEffect(() => {
    fetchApprovedPayouts();
    fetchLatestBankFile();
  }, [fetchApprovedPayouts, fetchLatestBankFile]);

  return {
    data,
    loading,
    exporting,
    isMailModalVisible,
    toEmail,
    sendingEmail,
    bankFile,
    isGenerating,
    markingPaid,
    month,
    year,
    setIsMailModalVisible,
    setToEmail,
    setMonth,
    setYear,
    fetchApprovedPayouts,
    generateBankFile,
    downloadBankFile,
    sendBankFileEmail,
    markAsPaid
  };
}
