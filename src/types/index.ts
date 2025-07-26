export interface User {
  _id: string;
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: 'Developer' | 'CEO' |'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: string | { _id: string; name: string };
  password: string;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: 'super admin' | 'admin' | 'user';
  position: 'Developer'| 'CEO' | 'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  role?: 'super admin' | 'admin' | 'user';
  position?: 'Developer'| 'CEO' | 'DevOps' | 'Project Manager' | 'Product Manager' | 'UI/UX' | 'Business Management';
  reportsTo?: string;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  position?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'super admin' | 'admin' | 'user';
      position: string;
      personalEmail: string;
      workEmail: string;
      phone: string;
      reportsTo: string | null;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: 'super admin' | 'admin' | 'user';
    position: string;
    personalEmail: string;
    workEmail: string;
    phone: string;
    reportsTo: string | null;
    isActive: boolean;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: string;
    position: string;
    personalEmail: string;
    workEmail: string;
    phone: string;
    reportsTo: string | null;
    isActive: boolean;
  }
}

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}
