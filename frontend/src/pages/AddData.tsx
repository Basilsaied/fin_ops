import React, { useState, useEffect } from 'react';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import { useExpenses } from '../hooks/useExpenses';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ExpenseFormData, ExpenseData } from '../types/expense';

const AddData: React.FC = () => {
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [formError, setFormError] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses
  } = useExpenses();
  
  const { handleError } = useErrorHandler();

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    setFormLoading(true);
    setFormError('');
    
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data);
        setEditingExpense(null);
      } else {
        await createExpense(data);
      }
      // Refresh the expense list
      await fetchExpenses();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'An unexpected error occurred';
      setFormError(errorMessage);
      handleError(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (expense: ExpenseData) => {
    setEditingExpense(expense);
    setFormError('');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      // Refresh the expense list
      await fetchExpenses();
    } catch (error: any) {
      handleError(error);
      throw error; // Re-throw to let ExpenseList handle the UI state
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingExpense ? 'Edit Expense' : 'Add Expense Data'}
          </h2>
          {editingExpense && (
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel Edit
            </button>
          )}
        </div>
        
        <div className="max-w-md">
          <ExpenseForm
            onSubmit={handleFormSubmit}
            initialData={editingExpense || undefined}
            mode={editingExpense ? 'edit' : 'create'}
            loading={formLoading}
            error={formError}
          />
        </div>
      </div>

      {/* List Section */}
      <ExpenseList
        expenses={expenses}
        loading={expensesLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        error={expensesError}
      />
    </div>
  );
};

export default AddData;