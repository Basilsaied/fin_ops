import React from 'react';

interface MonthYearSelectorProps {
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  showAllOption?: boolean;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// Generate years from 2020 to current year + 2
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2020; year <= currentYear + 2; year++) {
    years.push(year);
  }
  return years;
};

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  showAllOption = false
}) => {
  const years = generateYears();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex flex-col">
        <label htmlFor="month-select" className="text-sm font-medium text-gray-700 mb-1">
          Month
        </label>
        <select
          id="month-select"
          value={selectedMonth || ''}
          onChange={(e) => onMonthChange(e.target.value ? parseInt(e.target.value) : 0)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {showAllOption && (
            <option value="">All Months</option>
          )}
          {MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="year-select" className="text-sm font-medium text-gray-700 mb-1">
          Year
        </label>
        <select
          id="year-select"
          value={selectedYear || currentYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {selectedMonth && selectedYear && (
        <div className="flex flex-col justify-end">
          <button
            onClick={() => {
              onMonthChange(currentMonth);
              onYearChange(currentYear);
            }}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            Current Month
          </button>
        </div>
      )}
    </div>
  );
};