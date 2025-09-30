import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils';
import ExpenseList from '../ExpenseList';
import { mockExpenseList } from '../../test/mocks';
import { ExpenseCategory } from '../../types/expense';

// Mock the API hook
vi.mock('../../hooks/useExpenses', () => ({
  useExpenses: () => ({
    data: mockExpenseList,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('ExpenseList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render expense list with data', () => {
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Check if all expenses are rendered
    mockExpenseList.forEach(expense => {
      expect(screen.getByText(expense.category)).toBeInTheDocument();
      expect(screen.getByText(`$${expense.amount.toLocaleString()}`)).toBeInTheDocument();
      expect(screen.getByText(`${expense.month}/${expense.year}`)).toBeInTheDocument();
    });
  });

  it('should display table headers', () => {
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Month/Year')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should show edit and delete buttons for each expense', () => {
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    expect(editButtons).toHaveLength(mockExpenseList.length);
    expect(deleteButtons).toHaveLength(mockExpenseList.length);
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const firstEditButton = screen.getAllByRole('button', { name: /edit/i })[0];
    await user.click(firstEditButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockExpenseList[0]);
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const firstDeleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await user.click(firstDeleteButton);

    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onDelete when deletion is confirmed', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const firstDeleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await user.click(firstDeleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockExpenseList[0].id);
  });

  it('should cancel deletion when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const firstDeleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await user.click(firstDeleteButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(require('../../hooks/useExpenses').useExpenses).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/loading expenses/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to load expenses';
    vi.mocked(require('../../hooks/useExpenses').useExpenses).mockReturnValue({
      data: [],
      isLoading: false,
      error: errorMessage,
      refetch: vi.fn(),
    });

    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should display empty state when no expenses', () => {
    vi.mocked(require('../../hooks/useExpenses').useExpenses).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/no expenses found/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first expense/i)).toBeInTheDocument();
  });

  it('should filter expenses by search term', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const searchInput = screen.getByPlaceholderText(/search expenses/i);
    await user.type(searchInput, 'Salaries');

    // Should only show expenses matching the search term
    expect(screen.getByText(ExpenseCategory.SALARIES)).toBeInTheDocument();
    expect(screen.queryByText(ExpenseCategory.SOFTWARE_TOOLS)).not.toBeInTheDocument();
  });

  it('should filter expenses by category', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const categoryFilter = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(categoryFilter, ExpenseCategory.SALARIES);

    // Should only show expenses from selected category
    expect(screen.getByText(ExpenseCategory.SALARIES)).toBeInTheDocument();
    expect(screen.queryByText(ExpenseCategory.SOFTWARE_TOOLS)).not.toBeInTheDocument();
  });

  it('should sort expenses by different columns', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const amountHeader = screen.getByText('Amount');
    await user.click(amountHeader);

    // Should sort by amount (implementation would depend on actual sorting logic)
    expect(screen.getByTestId('sort-indicator')).toBeInTheDocument();
  });

  it('should paginate expenses when there are many', () => {
    const manyExpenses = Array.from({ length: 25 }, (_, i) => ({
      ...mockExpenseList[0],
      id: i + 1,
      amount: 1000 + i,
    }));

    vi.mocked(require('../../hooks/useExpenses').useExpenses).mockReturnValue({
      data: manyExpenses,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
  });

  it('should format currency amounts correctly', () => {
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Check if amounts are formatted as currency
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('$2,500')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Check if dates are formatted correctly
    mockExpenseList.forEach(expense => {
      expect(screen.getByText(`${expense.month}/${expense.year}`)).toBeInTheDocument();
    });
  });

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Tab to first edit button
    await user.tab();
    const firstEditButton = screen.getAllByRole('button', { name: /edit/i })[0];
    expect(firstEditButton).toHaveFocus();

    // Tab to first delete button
    await user.tab();
    const firstDeleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    expect(firstDeleteButton).toHaveFocus();
  });

  it('should have proper ARIA labels', () => {
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Expenses list');
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    editButtons.forEach((button, index) => {
      expect(button).toHaveAttribute('aria-label', 
        expect.stringContaining(`Edit expense for ${mockExpenseList[index].category}`)
      );
    });
  });

  it('should handle bulk operations', async () => {
    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} enableBulkOperations={true} />);

    // Select multiple expenses
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Select first expense
    await user.click(checkboxes[1]); // Select second expense

    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
  });

  it('should refresh data when retry button is clicked', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(require('../../hooks/useExpenses').useExpenses).mockReturnValue({
      data: [],
      isLoading: false,
      error: 'Failed to load',
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    render(<ExpenseList onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
});