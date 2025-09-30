import React, { useState, useCallback } from 'react';
import { ExpenseCategory } from '../types/expense';

export interface MonthYear {
  month: number;
  year: number;
  label: string;
}

interface MultiMonthSelectorProps {
  selectedMonths: MonthYear[];
  onSelectionChange: (months: MonthYear[]) => void;
  maxSelections?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export const MultiMonthSelector: React.FC<MultiMonthSelectorProps> = ({
  selectedMonths,
  onSelectionChange,
  maxSelections = 6
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);

  const addMonth = useCallback(() => {
    if (selectedMonths.length >= maxSelections) {
      return;
    }

    const monthYear: MonthYear = {
      month: selectedMonth,
      year: selectedYear,
      label: `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
    };

    // Check if this month/year combination is already selected
    const exists = selectedMonths.some(
      m => m.month === selectedMonth && m.year === selectedYear
    );

    if (!exists) {
      const newSelection = [...selectedMonths, monthYear].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      onSelectionChange(newSelection);
    }
  }, [selectedMonth, selectedYear, selectedMonths, maxSelections, onSelectionChange]);

  const removeMonth = useCallback((monthToRemove: MonthYear) => {
    const newSelection = selectedMonths.filter(
      m => !(m.month === monthToRemove.month && m.year === monthToRemove.year)
    );
    onSelectionChange(newSelection);
  }, [selectedMonths, onSelectionChange]);

  const clearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
            Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTH_NAMES.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
            Year:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEARS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addMonth}
          disabled={selectedMonths.length >= maxSelections}
          className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Add Month
        </button>

        {selectedMonths.length > 0 && (
          <button
            onClick={clearAll}
            className="px-4 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Clear All
          </button>
        )}
      </div>

      {selectedMonths.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Selected Months ({selectedMonths.length}/{maxSelections}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedMonths.map((monthYear) => (
              <span
                key={`${monthYear.year}-${monthYear.month}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {monthYear.label}
                <button
                  onClick={() => removeMonth(monthYear)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  aria-label={`Remove ${monthYear.label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedMonths.length >= maxSelections && (
        <p className="text-sm text-amber-600">
          Maximum of {maxSelections} months can be selected for comparison.
        </p>
      )}
    </div>
  );
};