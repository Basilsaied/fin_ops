import { apiClient } from '../utils/api';
import { ExpenseData, ExpenseFormData, ExpenseQuery, TrendData } from '../types/expense';

export class ExpenseService {
  // Get all expenses with optional filters
  static async getExpenses(query?: ExpenseQuery): Promise<ExpenseData[]> {
    return apiClient.get<ExpenseData[]>('/expenses', query);
  }

  // Get a specific expense by ID
  static async getExpenseById(id: number): Promise<ExpenseData> {
    return apiClient.get<ExpenseData>(`/expenses/${id}`);
  }

  // Create a new expense
  static async createExpense(data: ExpenseFormData): Promise<ExpenseData> {
    return apiClient.post<ExpenseData>('/expenses', data);
  }

  // Update an existing expense
  static async updateExpense(id: number, data: ExpenseFormData): Promise<ExpenseData> {
    return apiClient.put<ExpenseData>(`/expenses/${id}`, data);
  }

  // Delete an expense
  static async deleteExpense(id: number): Promise<void> {
    return apiClient.delete<void>(`/expenses/${id}`);
  }

  // Get trend data for charts
  static async getTrends(query?: ExpenseQuery): Promise<TrendData[]> {
    return apiClient.get<TrendData[]>('/expenses/trends', query);
  }
}

export default ExpenseService;