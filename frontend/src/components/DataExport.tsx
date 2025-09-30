import React, { useCallback } from 'react';
import type { TrendData, ExpenseData } from '../types/expense';
import { MonthYear } from './MultiMonthSelector';

interface DataExportProps {
  trendData: TrendData[];
  expenseData?: ExpenseData[];
  selectedMonths: MonthYear[];
  filename?: string;
}

interface ExportData {
  month: string;
  year: number;
  category: string;
  amount: number;
  percentageOfTotal?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DataExport: React.FC<DataExportProps> = ({
  trendData,
  expenseData,
  selectedMonths,
  filename = 'expense-comparison'
}) => {
  // Convert data to CSV format
  const convertToCSV = useCallback((data: ExportData[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header as keyof ExportData];
          // Escape commas and quotes in string values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }, []);

  // Prepare export data from trend data
  const prepareExportData = useCallback((): ExportData[] => {
    const exportData: ExportData[] = [];

    selectedMonths.forEach(monthYear => {
      const trendItem = trendData.find(
        t => t.month === monthYear.month && t.year === monthYear.year
      );

      if (trendItem) {
        const totalAmount = trendItem.totalAmount;
        
        trendItem.categories.forEach(category => {
          const percentageOfTotal = totalAmount > 0 
            ? (category.amount / totalAmount) * 100 
            : 0;

          exportData.push({
            month: MONTH_NAMES[monthYear.month - 1],
            year: monthYear.year,
            category: category.category,
            amount: category.amount,
            percentageOfTotal: Math.round(percentageOfTotal * 100) / 100
          });
        });
      }
    });

    return exportData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) {
        const aMonthIndex = MONTH_NAMES.indexOf(a.month);
        const bMonthIndex = MONTH_NAMES.indexOf(b.month);
        return aMonthIndex - bMonthIndex;
      }
      return a.category.localeCompare(b.category);
    });
  }, [trendData, selectedMonths]);

  // Download CSV file
  const downloadCSV = useCallback(() => {
    const exportData = prepareExportData();
    if (exportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const csvContent = convertToCSV(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [prepareExportData, convertToCSV, filename]);

  // Download JSON file
  const downloadJSON = useCallback(() => {
    const exportData = prepareExportData();
    if (exportData.length === 0) {
      alert('No data available to export');
      return;
    }

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [prepareExportData, filename]);

  // Print chart (opens print dialog)
  const printChart = useCallback(() => {
    window.print();
  }, []);

  // Copy data to clipboard
  const copyToClipboard = useCallback(async () => {
    const exportData = prepareExportData();
    if (exportData.length === 0) {
      alert('No data available to copy');
      return;
    }

    const csvContent = convertToCSV(exportData);
    
    try {
      await navigator.clipboard.writeText(csvContent);
      alert('Data copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy data to clipboard:', err);
      alert('Failed to copy data to clipboard');
    }
  }, [prepareExportData, convertToCSV]);

  const hasData = selectedMonths.length > 0 && trendData.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">
        Export Data
      </h4>
      
      {!hasData ? (
        <p className="text-gray-500 text-sm">
          Select months to enable data export options
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Export comparison data for {selectedMonths.length} selected month{selectedMonths.length !== 1 ? 's' : ''}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV
            </button>
            
            <button
              onClick={downloadJSON}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download JSON
            </button>
            
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </button>
            
            <button
              onClick={printChart}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            <p>• CSV format is compatible with Excel and Google Sheets</p>
            <p>• JSON format preserves data structure for technical use</p>
            <p>• Print option will open the browser's print dialog</p>
          </div>
        </div>
      )}
    </div>
  );
};