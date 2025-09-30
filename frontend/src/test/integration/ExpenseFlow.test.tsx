import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils';
import App from '../../App';
import { mockApiResponses, mockFetch } from '../mocks';
import { ExpenseCategory } from '../../types/expense';

// Mock fetch globally
global.fetch = mockFetch(mockApiResponses.getExpenses);

describe('Expense Management Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch(mockApiResponses.getExpenses);
  });

  it('should complete full expense creation flow', async () => {
    const user = userEvent.setup();
    
    render(<App />);

    // Navigate to Add Data page
    const addDataLink = screen.getByRole('link', { name: /add data/i });
    await user.click(addDataLink);

    // Fill out expense form
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, ExpenseCategory.SOFTWARE_TOOLS);

    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '1500.50');

    const monthSelect = screen.getByLabelText(/month/i);
    await user.selectOptions(monthSelect, '3');

    const yearSelect = screen.getByLabelText(/year/i);
    await user.selectOptions(yearSelect, '2024');

    // Mock successful creation
    global.fetch = mockFetch(mockApiResponses.createExpense, 201);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/expense created successfully/i)).toBeInTheDocument();
    });
  });
}); 
 it('should handle expense editing flow', async () => {
    const user = userEvent.setup();
    
    render(<App />);

    // Navigate to dashboard where expenses are listed
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // Click edit button on first expense
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    await user.click(editButton);

    // Update amount
    const amountInput = screen.getByLabelText(/amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '2000');

    // Mock successful update
    global.fetch = mockFetch(mockApiResponses.updateExpense);

    // Submit update
    const updateButton = screen.getByRole('button', { name: /update expense/i });
    await user.click(updateButton);

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/expense updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle expense deletion flow', async () => {
    const user = userEvent.setup();
    
    render(<App />);

    // Click delete button on first expense
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Mock successful deletion
    global.fetch = mockFetch({}, 204);

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/expense deleted successfully/i)).toBeInTheDocument();
    });
  });

  it('should display charts with data', async () => {
    global.fetch = mockFetch(mockApiResponses.getTrends);
    
    render(<App />);

    // Navigate to reports
    const reportsLink = screen.getByRole('link', { name: /reports/i });
    await user.click(reportsLink);

    // Wait for charts to load
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    global.fetch = mockFetch({ error: 'Server error' }, 500);
    
    render(<App />);

    // Try to create expense
    const addDataLink = screen.getByRole('link', { name: /add data/i });
    await user.click(addDataLink);

    // Fill and submit form
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, ExpenseCategory.SOFTWARE_TOOLS);

    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
});