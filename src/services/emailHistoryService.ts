import { apiClient } from '@/lib/axios';

/* ==================== ENUMS ==================== */

export type EmailStatus = 
  | 'SENT' 
  | 'DELIVERED' 
  | 'OPENED' 
  | 'CLICKED' 
  | 'FAILED' 
  | 'BOUNCED';

/* ==================== TYPES ==================== */

export interface EmailLog {
  id: string;
  tenantId: string;
  
  // Module information
  module: string;
  moduleId: string;
  moduleNumber: string;
  
  // Email details
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  plainText?: string;
  
  // Customer info
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  
  // Invoice/Module specific
  amount?: string;
  dueDate?: string;
  currency?: string;
  
  // Attachment
  hasAttachment: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  
  // Status
  status: EmailStatus;
  errorMessage?: string;
  
  // Timestamps
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  
  // User
  sentBy: string;
  sentByUser?: string;
  
  // Metadata
  metadata?: any;
  
  // Relations
  customer?: {
    id: string;
    companyName: string;
    email: string;
  };
}

export interface ModuleConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

export interface EmailLogFilter {
  page?: number;
  limit?: number;
  module?: string;
  moduleId?: string;
  customerId?: string;
  status?: EmailStatus | string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface EmailStats {
  total: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  byModule: Array<{
    module: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

/* ==================== API RESPONSES ==================== */

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* ==================== MODULE CONFIGURATION ==================== */

// DYNAMIC MODULE CONFIGURATION - Add new modules here as they are created
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  INVOICE: {
    color: '#1677ff',
    bgColor: '#e6f4ff',
    icon: 'FileTextOutlined',
    label: 'Invoice'
  },
  ESTIMATE: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'CalculatorOutlined',
    label: 'Estimate'
  },
  RECEIPT: {
    color: '#722ed1',
    bgColor: '#f9f0ff',
    icon: 'ContainerOutlined',
    label: 'Receipt'
  },
  CONTRACT: {
    color: '#fa8c16',
    bgColor: '#fff7e6',
    icon: 'FileTextOutlined',
    label: 'Contract'
  },
  PAYMENT: {
    color: '#13c2c2',
    bgColor: '#e6fffb',
    icon: 'DollarOutlined',
    label: 'Payment'
  },
  TICKET: {
    color: '#faad14',
    bgColor: '#fffbe6',
    icon: 'ThunderboltOutlined',
    label: 'Support Ticket'
  },
  STATEMENT: {
    color: '#2f54eb',
    bgColor: '#f0f5ff',
    icon: 'BarChartOutlined',
    label: 'Statement'
  }
};

// DYNAMIC STATUS CONFIGURATION
export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  SENT: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'CheckCircleOutlined',
    label: 'Sent'
  },
  DELIVERED: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'CheckCircleOutlined',
    label: 'Delivered'
  },
  OPENED: {
    color: '#1677ff',
    bgColor: '#e6f4ff',
    icon: 'EyeOutlined',
    label: 'Opened'
  },
  CLICKED: {
    color: '#13c2c2',
    bgColor: '#e6fffb',
    icon: 'MailOutlined',
    label: 'Clicked'
  },
  FAILED: {
    color: '#ff4d4f',
    bgColor: '#fff2f0',
    icon: 'CloseCircleOutlined',
    label: 'Failed'
  },
  BOUNCED: {
    color: '#faad14',
    bgColor: '#fffbe6',
    icon: 'WarningOutlined',
    label: 'Bounced'
  }
};

/* ==================== SERVICE ==================== */

class EmailHistoryService {
  private baseUrl = '/api/email-history';

  /**
   * Get email logs with filters & pagination
   */
  async getEmailLogs(params?: EmailLogFilter) {
    try {
      const response = await apiClient.get<ApiListResponse<EmailLog>>(
        this.baseUrl,
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch email logs');
    }
  }

  /**
   * Get single email log by ID
   */
  async getEmailLogById(id: string): Promise<EmailLog> {
    try {
      const response = await apiClient.get<ApiResponse<EmailLog>>(
        `${this.baseUrl}/${id}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch email log');
    }
  }

  /**
   * Get all unique modules (DYNAMIC - from database)
   */
  async getModules(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `${this.baseUrl}/modules`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch modules');
    }
  }

  /**
   * Get email statistics
   */
  async getStats(): Promise<EmailStats> {
    try {
      const response = await apiClient.get<ApiResponse<EmailStats>>(
        `${this.baseUrl}/stats`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  }

  /**
   * Get invoice-specific email history
   */
  async getInvoiceEmailHistory(invoiceId: string): Promise<{
    data: EmailLog[];
    invoice: any;
  }> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/invoice/${invoiceId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch invoice email history');
    }
  }

  /**
   * Get module configuration (DYNAMIC - merges DB modules with static configs)
   */
  getModuleConfig(module: string): ModuleConfig {
    // Return static config if exists, otherwise generate dynamic config
    if (MODULE_CONFIGS[module]) {
      return MODULE_CONFIGS[module];
    }
    
    // Generate dynamic config for new modules
    return {
      color: '#8c8c8c',
      bgColor: '#f5f5f5',
      icon: 'MailOutlined',
      label: module.charAt(0) + module.slice(1).toLowerCase()
    };
  }

  /**
   * Get all module configs (static + dynamic from DB)
   */
  async getAllModuleConfigs(): Promise<Record<string, ModuleConfig>> {
    try {
      const modules = await this.getModules();
      const configs: Record<string, ModuleConfig> = { ...MODULE_CONFIGS };
      
      // Add configs for any modules not in static config
      modules.forEach(module => {
        if (!configs[module]) {
          configs[module] = {
            color: '#8c8c8c',
            bgColor: '#f5f5f5',
            icon: 'MailOutlined',
            label: module.charAt(0) + module.slice(1).toLowerCase()
          };
        }
      });
      
      return configs;
    } catch (error) {
      return MODULE_CONFIGS;
    }
  }

  /**
   * Get status configuration
   */
  getStatusConfig(status: string): StatusConfig {
    return STATUS_CONFIGS[status] || {
      color: '#8c8c8c',
      bgColor: '#f5f5f5',
      icon: 'InfoCircleOutlined',
      label: status
    };
  }

  /**
   * Download attachment
   */
  async downloadAttachment(url: string, filename: string): Promise<void> {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      throw new Error('Failed to download attachment');
    }
  }
}

export default new EmailHistoryService();