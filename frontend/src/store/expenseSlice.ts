import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExpenseData, ExpenseCategory } from '../types/expense';

interface ExpenseState {
  expenses: ExpenseData[];
  loading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  filters: {
    category?: ExpenseCategory;
    year?: number;
    month?: number;
  };
}

const currentDate = new Date();
const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
  selectedMonth: currentDate.getMonth() + 1,
  selectedYear: currentDate.getFullYear(),
  filters: {},
};

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setExpenses: (state, action: PayloadAction<ExpenseData[]>) => {
      state.expenses = action.payload;
      state.loading = false;
      state.error = null;
    },
    addExpense: (state, action: PayloadAction<ExpenseData>) => {
      state.expenses.push(action.payload);
    },
    updateExpense: (state, action: PayloadAction<ExpenseData>) => {
      const index = state.expenses.findIndex(expense => expense.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    removeExpense: (state, action: PayloadAction<number>) => {
      state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
    },
    setSelectedMonth: (state, action: PayloadAction<number>) => {
      state.selectedMonth = action.payload;
    },
    setSelectedYear: (state, action: PayloadAction<number>) => {
      state.selectedYear = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ExpenseState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setExpenses,
  addExpense,
  updateExpense,
  removeExpense,
  setSelectedMonth,
  setSelectedYear,
  setFilters,
  clearFilters,
  clearError,
} = expenseSlice.actions;

export default expenseSlice.reducer;