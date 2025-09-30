import { Router } from 'express';
import { ArchiveService } from '../services/archiveService';
import { ScheduledTasks } from '../tasks/scheduledTasks';
import { getPerformanceMetrics } from '../middleware/queryMonitoring';
import { logger } from '../utils/logger';

const router = Router();

// Get performance metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get performance metrics',
        code: 'METRICS_ERROR'
      }
    });
  }
});

// Get archive statistics
router.get('/archive/stats', async (req, res) => {
  try {
    const stats = await ArchiveService.getArchiveStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting archive stats:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get archive statistics',
        code: 'ARCHIVE_STATS_ERROR'
      }
    });
  }
});

// Trigger manual archival
router.post('/archive/trigger', async (req, res) => {
  try {
    const { retentionYears } = req.body;
    const result = await ScheduledTasks.triggerArchival(retentionYears);
    res.json({
      message: 'Archival completed successfully',
      result
    });
  } catch (error) {
    logger.error('Error triggering archival:', error);
    res.status(500).json({
      error: {
        message: 'Failed to trigger archival',
        code: 'ARCHIVAL_ERROR'
      }
    });
  }
});

// Trigger manual maintenance
router.post('/maintenance/trigger', async (req, res) => {
  try {
    const result = await ScheduledTasks.triggerMaintenance();
    res.json({
      message: 'Maintenance completed successfully',
      result
    });
  } catch (error) {
    logger.error('Error triggering maintenance:', error);
    res.status(500).json({
      error: {
        message: 'Failed to trigger maintenance',
        code: 'MAINTENANCE_ERROR'
      }
    });
  }
});

// Get scheduled tasks status
router.get('/tasks/status', (req, res) => {
  try {
    const status = ScheduledTasks.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting task status:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get task status',
        code: 'TASK_STATUS_ERROR'
      }
    });
  }
});

// Restore data from archive
router.post('/archive/restore', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: {
          message: 'startDate and endDate are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: {
          message: 'Invalid date format',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const restoredCount = await ArchiveService.restoreFromArchive(start, end);
    
    res.json({
      message: 'Data restored successfully',
      restoredCount,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error restoring from archive:', error);
    res.status(500).json({
      error: {
        message: 'Failed to restore from archive',
        code: 'RESTORE_ERROR'
      }
    });
  }
});

// Clean up old archives
router.post('/archive/cleanup', async (req, res) => {
  try {
    const { maxArchiveYears } = req.body;
    const years = maxArchiveYears || 20;
    
    const deletedCount = await ArchiveService.cleanupOldArchives('costs_archive', years);
    
    res.json({
      message: 'Archive cleanup completed successfully',
      deletedCount,
      maxArchiveYears: years
    });
  } catch (error) {
    logger.error('Error cleaning up archives:', error);
    res.status(500).json({
      error: {
        message: 'Failed to clean up archives',
        code: 'CLEANUP_ERROR'
      }
    });
  }
});

export default router;