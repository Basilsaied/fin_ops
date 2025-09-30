// Expense Category Enum
export enum ExpenseCategory {
  SALARIES = 'Salaries',
  SOFTWARE_TOOLS = 'Software & Tools',
  INFRASTRUCTURE_HOSTING = 'Infrastructure & Hosting',
  HARDWARE_EQUIPMENT = 'Hardware & Equipment',
  SECURITY_COMPLIANCE = 'Security & Compliance',
  OPERATIONAL_ADMINISTRATIVE = 'Operational & Administrative',
  CONTINUOUS_LEARNING_RD = 'Continuous Learning & R&D'
}

// Core Expense Model
export interface ExpenseData {
  id: number;
  category: ExpenseCategory;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

// Form Data for creating/updating expenses
export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: number;
  month: number;
  year: number;
}

// Chart Data Models
export interface CategoryAmount {
  category: ExpenseCategory;
  amount: number;
}

export interface TrendData {
  month: number;
  year: number;
  totalAmount: number;
  categories: CategoryAmount[];
}

// API Error Types
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Query Parameters for API requests
export interface ExpenseQuery {
  year?: number;
  month?: number;
  category?: ExpenseCategory;
  limit?: number;
  offset?: number;
}