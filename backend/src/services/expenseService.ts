import { prisma } from '../config/database';
import { 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpenseQuery, 
  ExpenseData,
  ExpenseToResponse,
  ExpenseResponse 
} from '../types/expense';
import { 
  DuplicateEntryError, 
  NotFoundError, 
  DatabaseError 
} from '../utils/errors';
import { logger } from '../utils/logger';
import { Prisma, Cost } from '@prisma/client';

export class ExpenseService {
  // Convert Prisma Cost model to API response format
  private static toResponse: ExpenseToResponse = (expense: Cost): ExpenseResponse => ({
    id: expense.id,
    category: expense.category,
    amount: Number(expense.amount),
    month: expense.month,
    year: expense.year,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString()
  });

  // Create a new expense
  static async createExpense(data: CreateExpenseRequest): Promise<ExpenseResponse> {
    try {
      const expense = await prisma.cost.create({
        data: {
          category: data.category,
          amount: data.amount,
          month: data.month,
          year: data.year
        }
      });

      logger.info(`Created expense: ${expense.id} - ${expense.category} - $${expense.amount}`);
      return this.toResponse(expense);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violation (duplicate entry)
        if (error.code === 'P2002') {
          throw new DuplicateEntryError(
            `An expense entry already exists for ${data.category} in ${data.month}/${data.year}`
          );
        }
      }
      
      logger.error('Failed to create expense:', error);
      throw new DatabaseError('Failed to create expense');
    }
  }

  // Get expenses with optional filtering
  static async getExpenses(query: ExpenseQuery): Promise<{
    expenses: ExpenseResponse[];
    total: number;
  }> {
    try {
      const where: Prisma.CostWhereInput = {};
      
      // Build where clause based on query parameters
      if (query.year !== undefined) {
        where.year = query.year;
      }
      
      if (query.month !== undefined) {
        where.month = query.month;
      }
      
      if (query.category !== undefined) {
        where.category = query.category;
      }

      // Get total count for pagination
      const total = await prisma.cost.count({ where });

      // Get expenses with pagination
      const expenses = await prisma.cost.findMany({
        where,
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { category: 'asc' }
        ],
        take: query.limit || 50,
        skip: query.offset || 0
      });

      logger.debug(`Retrieved ${expenses.length} expenses (total: ${total})`);
      
      return {
        expenses: expenses.map(this.toResponse),
        total
      };
    } catch (error) {
      logger.error('Failed to retrieve expenses:', error);
      throw new DatabaseError('Failed to retrieve expenses');
    }
  }

  // Get a single expense by ID
  static async getExpenseById(id: number): Promise<ExpenseResponse> {
    try {
      const expense = await prisma.cost.findUnique({
        where: { id }
      });

      if (!expense) {
        throw new NotFoundError(`Expense with ID ${id} not found`);
      }

      return this.toResponse(expense);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error(`Failed to retrieve expense ${id}:`, error);
      throw new DatabaseError('Failed to retrieve expense');
    }
  }

  // Update an expense
  static async updateExpense(id: number, data: UpdateExpenseRequest): Promise<ExpenseResponse> {
    try {
      const expense = await prisma.cost.update({
        where: { id },
        data: {
          amount: data.amount,
          updatedAt: new Date()
        }
      });

      logger.info(`Updated expense: ${expense.id} - new amount: $${expense.amount}`);
      return this.toResponse(expense);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle record not found
        if (error.code === 'P2025') {
          throw new NotFoundError(`Expense with ID ${id} not found`);
        }
      }
      
      logger.error(`Failed to update expense ${id}:`, error);
      throw new DatabaseError('Failed to update expense');
    }
  }

  // Delete an expense
  static async deleteExpense(id: number): Promise<void> {
    try {
      await prisma.cost.delete({
        where: { id }
      });

      logger.info(`Deleted expense: ${id}`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle record not found
        if (error.code === 'P2025') {
          throw new NotFoundError(`Expense with ID ${id} not found`);
        }
      }
      
      logger.error(`Failed to delete expense ${id}:`, error);
      throw new DatabaseError('Failed to delete expense');
    }
  }

  // Check if an expense exists for a specific category, month, and year
  static async expenseExists(category: string, month: number, year: number): Promise<boolean> {
    try {
      const expense = await prisma.cost.findFirst({
        where: {
          category: category as any,
          month,
          year
        }
      });

      return expense !== null;
    } catch (error) {
      logger.error('Failed to check expense existence:', error);
      throw new DatabaseError('Failed to check expense existence');
    }
  }

  // Get trends data with aggregation and analysis
  static async getTrends(query: import('../types/expense').TrendsQuery): Promise<import('../types/expense').TrendsApiResponse> {
    try {
      const where: Prisma.CostWhereInput = {};
      
      // Build date range filter
      const dateConditions: Prisma.CostWhereInput[] = [];
      
      // Handle year range
      if (query.startYear === query.endYear) {
        // Same year - handle month range if provided
        where.year = query.startYear;
        if (query.startMonth && query.endMonth) {
          where.month = {
            gte: query.startMonth,
            lte: query.endMonth
          };
        } else if (query.startMonth) {
          where.month = { gte: query.startMonth };
        } else if (query.endMonth) {
          where.month = { lte: query.endMonth };
        }
      } else {
        // Multiple years
        if (query.startMonth) {
          dateConditions.push({
            year: query.startYear,
            month: { gte: query.startMonth }
          });
        } else {
          dateConditions.push({ year: query.startYear });
        }
        
        // Add middle years
        if (query.endYear - query.startYear > 1) {
          dateConditions.push({
            year: {
              gt: query.startYear,
              lt: query.endYear
            }
          });
        }
        
        if (query.endMonth) {
          dateConditions.push({
            year: query.endYear,
            month: { lte: query.endMonth }
          });
        } else {
          dateConditions.push({ year: query.endYear });
        }
        
        where.OR = dateConditions;
      }
      
      // Add category filter if specified
      if (query.category) {
        where.category = query.category;
      }

      // Get raw data
      const expenses = await prisma.cost.findMany({
        where,
        orderBy: [
          { year: 'asc' },
          { month: 'asc' },
          { category: 'asc' }
        ]
      });

      // Process data based on groupBy parameter
      let processedData: any[];
      let summary: any;

      switch (query.groupBy) {
        case 'year':
          ({ data: processedData, summary } = this.processYearlyTrends(expenses));
          break;
        case 'category':
          ({ data: processedData, summary } = this.processCategoryTrends(expenses));
          break;
        case 'month':
        default:
          ({ data: processedData, summary } = this.processMonthlyTrends(expenses));
          break;
      }

      // Add period information to summary
      summary.periodStart = `${query.startYear}-${String(query.startMonth || 1).padStart(2, '0')}-01`;
      summary.periodEnd = `${query.endYear}-${String(query.endMonth || 12).padStart(2, '0')}-01`;

      logger.debug(`Retrieved trends data: ${processedData.length} data points`);

      return {
        data: processedData,
        summary,
        groupBy: query.groupBy || 'month'
      };
    } catch (error) {
      logger.error('Failed to retrieve trends data:', error);
      throw new DatabaseError('Failed to retrieve trends data');
    }
  }

  // Process expenses into monthly trends
  private static processMonthlyTrends(expenses: Cost[]): {
    data: import('../types/expense').MonthlyTrendData[];
    summary: any;
  } {
    const monthlyMap = new Map<string, { totalAmount: number; categories: Map<string, number> }>();
    
    // Group by month-year
    expenses.forEach(expense => {
      const key = `${expense.year}-${String(expense.month).padStart(2, '0')}`;
      const amount = Number(expense.amount);
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { totalAmount: 0, categories: new Map() });
      }
      
      const monthData = monthlyMap.get(key)!;
      monthData.totalAmount += amount;
      
      const currentCategoryAmount = monthData.categories.get(expense.category) || 0;
      monthData.categories.set(expense.category, currentCategoryAmount + amount);
    });

    // Convert to array format
    const data: import('../types/expense').MonthlyTrendData[] = Array.from(monthlyMap.entries())
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        return {
          month: parseInt(month || '0'),
          year: parseInt(year || '0'),
          totalAmount: value.totalAmount,
          categoryBreakdown: Array.from(value.categories.entries()).map(([category, amount]) => ({
            category: category as any,
            amount
          }))
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    // Calculate summary
    const amounts = data.map(d => d.totalAmount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    
    const summary = {
      totalAmount,
      averageAmount: amounts.length > 0 ? totalAmount / amounts.length : 0,
      highestAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
      lowestAmount: amounts.length > 0 ? Math.min(...amounts) : 0
    };

    return { data, summary };
  }

  // Process expenses into yearly trends
  private static processYearlyTrends(expenses: Cost[]): {
    data: import('../types/expense').YearlyTrendData[];
    summary: any;
  } {
    const yearlyMap = new Map<number, { totalAmount: number; categories: Map<string, number> }>();
    
    // Group by year
    expenses.forEach(expense => {
      const amount = Number(expense.amount);
      
      if (!yearlyMap.has(expense.year)) {
        yearlyMap.set(expense.year, { totalAmount: 0, categories: new Map() });
      }
      
      const yearData = yearlyMap.get(expense.year)!;
      yearData.totalAmount += amount;
      
      const currentCategoryAmount = yearData.categories.get(expense.category) || 0;
      yearData.categories.set(expense.category, currentCategoryAmount + amount);
    });

    // Convert to array format
    const data: import('../types/expense').YearlyTrendData[] = Array.from(yearlyMap.entries())
      .map(([year, value]) => ({
        year,
        totalAmount: value.totalAmount,
        categoryBreakdown: Array.from(value.categories.entries()).map(([category, amount]) => ({
          category: category as any,
          amount
        }))
      }))
      .sort((a, b) => a.year - b.year);

    // Calculate summary
    const amounts = data.map(d => d.totalAmount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    
    const summary = {
      totalAmount,
      averageAmount: amounts.length > 0 ? totalAmount / amounts.length : 0,
      highestAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
      lowestAmount: amounts.length > 0 ? Math.min(...amounts) : 0
    };

    return { data, summary };
  }

  // Process expenses into category trends
  private static processCategoryTrends(expenses: Cost[]): {
    data: import('../types/expense').CategoryTrendData[];
    summary: any;
  } {
    const categoryMap = new Map<string, { totalAmount: number; months: Map<string, number> }>();
    
    // Group by category
    expenses.forEach(expense => {
      const amount = Number(expense.amount);
      const monthKey = `${expense.year}-${String(expense.month).padStart(2, '0')}`;
      
      if (!categoryMap.has(expense.category)) {
        categoryMap.set(expense.category, { totalAmount: 0, months: new Map() });
      }
      
      const categoryData = categoryMap.get(expense.category)!;
      categoryData.totalAmount += amount;
      
      const currentMonthAmount = categoryData.months.get(monthKey) || 0;
      categoryData.months.set(monthKey, currentMonthAmount + amount);
    });

    // Convert to array format
    const data: import('../types/expense').CategoryTrendData[] = Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category: category as any,
        totalAmount: value.totalAmount,
        monthlyBreakdown: Array.from(value.months.entries()).map(([monthKey, amount]) => {
          const [year, month] = monthKey.split('-');
          return {
            month: parseInt(month || '0'),
            year: parseInt(year || '0'),
            amount
          };
        }).sort((a, b) => a.year - b.year || a.month - b.month)
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by total amount descending

    // Calculate summary
    const amounts = data.map(d => d.totalAmount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    
    const summary = {
      totalAmount,
      averageAmount: amounts.length > 0 ? totalAmount / amounts.length : 0,
      highestAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
      lowestAmount: amounts.length > 0 ? Math.min(...amounts) : 0
    };

    return { data, summary };
  }
}