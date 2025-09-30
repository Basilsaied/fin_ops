import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { ExpenseCategory, ExpenseFormData, ExpenseData } from '../types/expense';

// Validation schema
const expenseSchema = Joi.object({
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .required()
    .messages({
      'any.required': 'Category is required',
      'any.only': 'Please select a valid category'
    }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999.99)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be greater than 0',
      'number.max': 'Amount cannot exceed 999,999,999.99',
      'any.required': 'Amount is required'
    }),
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'number.base': 'Month must be a number',
      'number.integer': 'Month must be a whole number',
      'number.min': 'Month must be between 1 and 12',
      'number.max': 'Month must be between 1 and 12',
      'any.required': 'Month is required'
    }),
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .required()
    .messages({
      'number.base': 'Year must be a number',
      'number.integer': 'Year must be a whole number',
      'number.min': 'Year must be between 2020 and 2050',
      'number.max': 'Year must be between 2020 and 2050',
      'any.required': 'Year is required'
    })
});

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: ExpenseData;
  mode: 'create' | 'edit';
  loading?: boolean;
  error?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  initialData,
  mode,
  loading = false,
  error
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ExpenseFormData>({
    resolver: joiResolver(expenseSchema),
    defaultValues: initialData ? {
      category: initialData.category,
      amount: initialData.amount,
      month: initialData.month,
      year: initialData.year
    } : {
      category: ExpenseCategory.SALARIES,
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }
  });

  const handleFormSubmit = async (data: ExpenseFormData) => {
    try {
      await onSubmit(data);
      if (mode === 'create') {
        reset();
      }
    } catch (err) {
      // Error handling is managed by parent component
      console.error('Form submission error:', err);
    }
  };

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="category"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || isSubmitting}
            >
              {Object.values(ExpenseCategory).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount ($)
        </label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="number"
              id="amount"
              step="0.01"
              min="0"
              max="999999999.99"
              placeholder="0.00"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || isSubmitting}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Month Selection */}
      <div>
        <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
          Month
        </label>
        <Controller
          name="month"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="month"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.month ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || isSubmitting}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.month && (
          <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>
        )}
      </div>

      {/* Year Selection */}
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <Controller
          name="year"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="year"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.year ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || isSubmitting}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.year && (
          <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || isSubmitting}
          >
            Reset
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          disabled={loading || isSubmitting}
        >
          {(loading || isSubmitting) && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {mode === 'create' ? 'Add Expense' : 'Update Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;