import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import expenseRoutes from '../../routes/expenseRoutes';
import { errorHandler } from '../../middleware/errorHandler';

export const createTestApp = (): express.Application => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/expenses', expenseRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
};