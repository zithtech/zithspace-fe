export interface Company {
  id: number;
  
  // Basic Info
  name: string;
  email?: string;
  phone?: string;
  
  // Address
  plotNo?: string;
  floorNo?: string;
  buildingName?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  country?: string;
  
  // Registration
  cin?: string;
  gst?: string;
  
  // Status
  isActive: boolean;
  logo?: string;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedCompanyResponse {
  data: Company[];
  pagination: { pageSizeOptions: [10, 20, 25, 50, 100], current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCompanyData {
  name: string;
  email?: string;
  phone?: string;
  plotNo?: string;
  floorNo?: string;
  buildingName?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  country?: string;
  cin?: string;
  gst?: string;
  logo?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {}