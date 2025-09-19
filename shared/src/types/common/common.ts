// src/types/common.ts

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: PaginationMeta;
    timing?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type UserRole = 'admin' | 'manager' | 'staff';

export type ScheduleStatus = 'draft' | 'published' | 'confirmed' | 'completed' | 'cancelled';

export type ShiftType = 'regular' | 'overtime' | 'on_call' | 'holiday';

export interface TimeRange {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface DateRange {
  start: Date;
  end: Date;
}