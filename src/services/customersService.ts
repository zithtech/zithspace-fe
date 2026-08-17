import { api, ApiError, apiUtils, PaginatedResponse } from "@/lib/axios";


export interface Customer {
  id: string;

  companyName: string;
  email?: string | null;
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  country?: string | null;

  taxId?: string | null;
  gstin?: string | null;
  pan?: string | null;
  isActive: boolean;
  clientId?: string | null;

  tenantId: string;
  createdBy: string;
  updatedBy?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  companyName: string;
  email?: string | null;
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  country?: string | null;

  taxId?: string | null;
  gstin?: string | null;
  pan?: string | null;
  isActive?: boolean;
  clientId?: string | null;
}

export interface UpdateCustomerData {
  companyName?: string;
  email?: string | null;
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  country?: string | null;

  taxId?: string | null;
  gstin?: string | null;
  pan?: string | null;
  isActive?: boolean;
  clientId?: string | null;
}

export interface CustomersFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CustomerSelectOption {
  value: string;
  label: string;
  email?: string | null;
}



export class CustomersService {
  static async getCustomers(
    filters: CustomersFilters = {}
  ): Promise<PaginatedResponse<Customer>> {
    try {
      return await apiUtils.getPaginated<Customer>(
        "/api/customers",
        filters
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch customers");
    }
  }

  static async getCustomer(id: string): Promise<Customer> {
    try {
      return await api.get<Customer>(`/api/customers/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch customer");
    }
  }

  static async createCustomer(
    data: CreateCustomerData
  ): Promise<Customer> {
    try {
      return await api.post<Customer>("/api/customers", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create customer");
    }
  }

  static async updateCustomer(
    id: string,
    data: UpdateCustomerData
  ): Promise<Customer> {
    try {
      return await api.put<Customer>(`/api/customers/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update customer");
    }
  }

  static async deleteCustomer(id: string): Promise<void> {
    try {
      await api.delete(`/api/customers/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete customer");
    }
  }

  static async getCustomersForSelect(): Promise<CustomerSelectOption[]> {
    try {
      return await api.get<CustomerSelectOption[]>(
        "/api/customers/select"
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch customers for select");
    }
  }
}

