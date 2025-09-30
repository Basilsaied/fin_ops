import { ExpenseCategory } from '../../types/expense';

export const validExpenseData = {
  category: ExpenseCategory.SOFTWARE_TOOLS,
  amount: 1500.50,
  month: 3,
  year: 2024
};

export const invalidExpenseData = [
  {
    // Missing category
    amount: 1500.50,
    month: 3,
    year: 2024
  },
  {
    // Invalid amount (negative)
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: -100,
    month: 3,
    year: 2024
  },
  {
    // Invalid month
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 1500.50,
    month: 13,
    year: 2024
  },
  {
    // Invalid year
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 1500.50,
    month: 3,
    year: 2019
  }
];

export const multipleExpenses = [
  {
    category: ExpenseCategory.SALARIES,
    amount: 50000,
    month: 1,
    year: 2024
  },
  {
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 2500,
    month: 1,
    year: 2024
  },
  {
    category: ExpenseCategory.INFRASTRUCTURE_HOSTING,
    amount: 1200,
    month: 1,
    year: 2024
  },
  {
    category: ExpenseCategory.SALARIES,
    amount: 52000,
    month: 2,
    year: 2024
  },
  {
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 2300,
    month: 2,
    year: 2024
  }
];

export const trendTestData = [
  {
    category: ExpenseCategory.SALARIES,
    amount: 50000,
    month: 1,
    year: 2024
  },
  {
    category: ExpenseCategory.SALARIES,
    amount: 51000,
    month: 2,
    year: 2024
  },
  {
    category: ExpenseCategory.SALARIES,
    amount: 52000,
    month: 3,
    year: 2024
  },
  {
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 2000,
    month: 1,
    year: 2024
  },
  {
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 2200,
    month: 2,
    year: 2024
  },
  {
    category: ExpenseCategory.SOFTWARE_TOOLS,
    amount: 2400,
    month: 3,
    year: 2024
  }
];