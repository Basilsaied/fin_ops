import Joi from 'joi';
import { ExpenseCategory } from '@prisma/client';

// Validation schema for creating an expense
export const createExpenseSchema = Joi.object({
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .required()
    .messages({
      'any.required': 'Category is required',
      'any.only': 'Category must be one of the predefined expense categories'
    }),
  
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999.99)
    .required()
    .messages({
      'any.required': 'Amount is required',
      'number.positive': 'Amount must be a positive number',
      'number.max': 'Amount cannot exceed 999,999,999.99'
    }),
  
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': 'Month is required',
      'number.min': 'Month must be between 1 and 12',
      'number.max': 'Month must be between 1 and 12'
    }),
  
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .required()
    .messages({
      'any.required': 'Year is required',
      'number.min': 'Year must be between 2020 and 2050',
      'number.max': 'Year must be between 2020 and 2050'
    })
});

// Validation schema for updating an expense
export const updateExpenseSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999.99)
    .required()
    .messages({
      'any.required': 'Amount is required',
      'number.positive': 'Amount must be a positive number',
      'number.max': 'Amount cannot exceed 999,999,999.99'
    })
});

// Validation schema for expense query parameters
export const expenseQuerySchema = Joi.object({
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .optional(),
  
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional(),
  
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .optional(),
  
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
});

// Validation schema for expense ID parameter
export const expenseIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Expense ID is required',
      'number.positive': 'Expense ID must be a positive number'
    })
});

// Validation schema for trends query parameters
export const trendsQuerySchema = Joi.object({
  startYear: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .required()
    .messages({
      'any.required': 'Start year is required',
      'number.min': 'Start year must be between 2020 and 2050',
      'number.max': 'Start year must be between 2020 and 2050'
    }),
  
  endYear: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .required()
    .messages({
      'any.required': 'End year is required',
      'number.min': 'End year must be between 2020 and 2050',
      'number.max': 'End year must be between 2020 and 2050'
    }),
  
  startMonth: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
    .messages({
      'number.min': 'Start month must be between 1 and 12',
      'number.max': 'Start month must be between 1 and 12'
    }),
  
  endMonth: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
    .messages({
      'number.min': 'End month must be between 1 and 12',
      'number.max': 'End month must be between 1 and 12'
    }),
  
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .optional(),
  
  groupBy: Joi.string()
    .valid('month', 'year', 'category')
    .default('month')
    .optional()
}).custom((value, helpers) => {
  // Validate that endYear is not before startYear
  if (value.endYear < value.startYear) {
    return helpers.error('any.invalid', { message: 'End year cannot be before start year' });
  }
  
  // If same year, validate months
  if (value.startYear === value.endYear && value.startMonth && value.endMonth) {
    if (value.endMonth < value.startMonth) {
      return helpers.error('any.invalid', { message: 'End month cannot be before start month in the same year' });
    }
  }
  
  return value;
});