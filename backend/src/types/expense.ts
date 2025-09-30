import { ExpenseCategory as PrismaExpenseCategory, Cost } from '@prisma/client';

// Re-export Prisma types for consistency
export { ExpenseCategory } from '@prisma/client';

// Core expense data interface
export interface ExpenseData {
  id: number;
  category: PrismaExpenseCategory;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Request types
export interface CreateExpenseRequest {
  category: PrismaExpenseCategory;
  amount: number;
  month: number;
  year: number;
}

export interface UpdateExpenseRequest {
  amount: number;
}

// API Response types
export interface ExpenseResponse {
  id: number;
  category: PrismaExpenseCategory;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

// Query parameters for filtering expenses
export interface ExpenseQuery {
  year?: number;
  month?: number;
  category?: PrismaExpenseCategory;
  limit?: number;
  offset?: number;
}

// Chart data types
export interface CategoryAmount {
  category: PrismaExpenseCategory;
  amount: number;
}

export interface TrendData {
  month: number;
  year: number;
  totalAmount: number;
  categories: CategoryAmount[];
}

export interface TrendResponse {
  month: number;
  year: number;
  totalAmount: number;
  categoryBreakdown: CategoryAmount[];
}

// Trends query parameters
export interface TrendsQuery {
  startYear: number;
  endYear: number;
  startMonth?: number;
  endMonth?: number;
  category?: PrismaExpenseCategory;
  groupBy?: 'month' | 'year' | 'category';
}

// Monthly trend data point
export interface MonthlyTrendData {
  month: number;
  year: number;
  totalAmount: number;
  categoryBreakdown: CategoryAmount[];
}

// Yearly trend data point
export interface YearlyTrendData {
  year: number;
  totalAmount: number;
  categoryBreakdown: CategoryAmount[];
}

// Category trend data point
export interface CategoryTrendData {
  category: PrismaExpenseCategory;
  totalAmount: number;
  monthlyBreakdown: Array<{
    month: number;
    year: number;
    amount: number;
  }>;
}

// Trends API response
export interface TrendsApiResponse {
  data: MonthlyTrendData[] | YearlyTrendData[] | CategoryTrendData[];
  summary: {
    totalAmount: number;
    averageAmount: number;
    highestAmount: number;
    lowestAmount: number;
    periodStart: string;
    periodEnd: string;
  };
  groupBy: 'month' | 'year' | 'category';
}

// Utility type to convert Prisma model to API response
export type ExpenseToResponse = (expense: Cost) => ExpenseResponse;