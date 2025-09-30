import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils';
import ExpenseForm from '../ExpenseForm';
import { ExpenseCategory } from '../../types/expense';
import { mockExpenseData } from '../../test/mocks';

// Mock the API hook
vi.mock('../../hooks/useApi', () => ({
  useApi: () => ({
    post: vi.fn(),
    put: vi.fn(),
  }),
}));

describe('ExpenseForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render form fields correctly', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/month/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should display all expense categories in dropdown', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.click(categorySelect);

      Object.values(ExpenseCategory).forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
        expect(screen.getByText(/month is required/i)).toBeInTheDocument();
        expect(screen.getByText(/year is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate amount is positive', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '-100');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate month range', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const monthInput = screen.getByLabelText(/month/i);
      await user.type(monthInput, '13');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/month must be between 1 and 12/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate year range', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const yearInput = screen.getByLabelText(/year/i);
      await user.type(yearInput, '2019');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/year must be between 2020 and 2050/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Fill form with valid data
      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, ExpenseCategory.SOFTWARE_TOOLS);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '1500.50');

      const monthInput = screen.getByLabelText(/month/i);
      await user.selectOptions(monthInput, '3');

      const yearInput = screen.getByLabelText(/year/i);
      await user.selectOptions(yearInput, '2024');

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          category: ExpenseCategory.SOFTWARE_TOOLS,
          amount: 1500.50,
          month: 3,
          year: 2024,
        });
      });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should pre-populate form with initial data', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="edit"
          initialData={mockExpenseData}
        />
      );

      expect(screen.getByDisplayValue(mockExpenseData.category)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockExpenseData.amount.toString())).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockExpenseData.month.toString())).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockExpenseData.year.toString())).toBeInTheDocument();
    });

    it('should show update button in edit mode', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="edit"
          initialData={mockExpenseData}
        />
      );

      expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add expense/i })).not.toBeInTheDocument();
    });

    it('should submit updated data', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="edit"
          initialData={mockExpenseData}
        />
      );

      // Update amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '2000');

      const submitButton = screen.getByRole('button', { name: /update expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          category: mockExpenseData.category,
          amount: 2000,
          month: mockExpenseData.month,
          year: mockExpenseData.year,
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      expect(submitButton).toBeDisabled();

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeDisabled();
    });

    it('should show loading text on submit button', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
          isLoading={true}
        />
      );

      expect(screen.getByText(/adding.../i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Failed to create expense';
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should clear error when form is modified', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create expense';
      
      const { rerender } = render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();

      // Simulate error being cleared
      rerender(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
          error=""
        />
      );

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/month/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for error states', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      await user.click(submitButton);

      await waitFor(() => {
        const categoryInput = screen.getByLabelText(/category/i);
        expect(categoryInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/category/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/amount/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/month/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/year/i)).toHaveFocus();
    });
  });
});