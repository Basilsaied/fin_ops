import { ExpenseCategory } from '../types/expense';

export const mockExpenseData = {
  id: 1,
  category: ExpenseCategory.SOFTWARE_TOOLS,
  amount: 1500.50,
  month: 3,
  year: 2024,
  createdAt: new Date('2024-03-15T10:00:00Z'),
  updatedAt: new Date('2024-03-15T10:00:00Z'),
};

export const mockExpenseList = [
  {
    id: 1,
    category: ExpenseCategory.SALARIES,
    amount: 50000,
    month: 1,
    year: 2024,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 2,
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 2500,
    month: 1,
    year: 2024,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 3,
    category: ExpenseCategory.INFRASTRUCTURE_HOSTING,
    amount: 1200,
    month: 1,
    year: 2024,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
];

export const mockTrendData = [
  {
    month: 1,
    year: 2024,
    totalAmount: 53700,
    categoryBreakdown: [
      { category: ExpenseCategory.SALARIES, amount: 50000 },
      { category: ExpenseCategory.SOFTWARE_TOOLS, amount: 2500 },
      { category: ExpenseCategory.INFRASTRUCTURE_HOSTING, amount: 1200 },
    ],
  },
  {
    month: 2,
    year: 2024,
    totalAmount: 54300,
    categoryBreakdown: [
      { category: ExpenseCategory.SALARIES, amount: 51000 },
      { category: ExpenseCategory.SOFTWARE_TOOLS, amount: 2300 },
      { category: ExpenseCategory.INFRASTRUCTURE_HOSTING, amount: 1000 },
    ],
  },
];

export const mockChartData = [
  { category: 'Salaries', amount: 50000 },
  { category: 'Software & Tools', amount: 2500 },
  { category: 'Infrastructure & Hosting', amount: 1200 },
];

// Mock API responses
export const mockApiResponses = {
  getExpenses: mockExpenseList,
  createExpense: mockExpenseData,
  updateExpense: { ...mockExpenseData, amount: 2000 },
  getTrends: mockTrendData,
};

// Mock fetch function
export const mockFetch = (response: any, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
  });
};

// Mock error response
export const mockErrorResponse = {
  error: {
    message: 'Test error',
    code: 'TEST_ERROR',
    timestamp: new Date().toISOString(),
    path: '/api/expenses',
  },
};