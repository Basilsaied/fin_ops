import { Router } from 'express';
import { ExpenseController } from '../controllers/expenseController';
import { validateExpenseInput, sanitizeTextFields, handleValidationErrors } from '../middleware/security';
import { param } from 'express-validator';

const router = Router();

// Validation for ID parameters
const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// POST /api/expenses - Create a new expense
router.post('/', sanitizeTextFields, validateExpenseInput, ExpenseController.createExpense);

// GET /api/expenses/trends - Get trends and analytics data (must come before /:id route)
router.get('/trends', ExpenseController.getTrends);

// GET /api/expenses - Get expenses with optional filtering
router.get('/', ExpenseController.getExpenses);

// GET /api/expenses/:id - Get a specific expense by ID
router.get('/:id', validateIdParam, ExpenseController.getExpenseById);

// PUT /api/expenses/:id - Update an expense
router.put('/:id', validateIdParam, sanitizeTextFields, validateExpenseInput, ExpenseController.updateExpense);

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', validateIdParam, ExpenseController.deleteExpense);

export default router;