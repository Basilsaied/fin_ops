import React, { useState, useEffect } from 'react';
import { MultiMonthSelector, MonthYear } from '../components/MultiMonthSelector';
import { LazyComparisonChart } from '../components/charts/LazyCharts';
import { DataExport } from '../components/DataExport';
import { AdvancedFilters, FilterCriteria } from '../components/AdvancedFilters';
import { SummaryStatistics } from '../components/SummaryStatistics';
import { PrintableReport } from '../components/PrintableReport';
import { useComparisonData } from '../hooks/useComparisonData';
import { useAdvancedFilters } from '../hooks/useAdvancedFilters';
import { ChartSkeleton, TableSkeleton, ProgressiveLoader } from '../components/LoadingSkeletons';

const Reports: React.FC = () => {
  const [selectedMonths, setSelectedMonths] = useState<MonthYear[]>([]);
  const [activeTab, setActiveTab] = useState<'comparison' | 'advanced'>('comparison');
  
  const {
    comparisonData,
    loading: comparisonLoading,
    error: comparisonError,
    fetchComparisonData,
    calculateSummaryStats,
    getTrendIndicators
  } = useComparisonData();

  const {
    filters,
    filteredExpenses,
    loading: filterLoading,
    error: filterError,
    hasActiveFilters,
    updateFilters,
    applyFilters,
    resetFilters
  } = useAdvancedFilters();

  // Fetch data when selected months change
  useEffect(() => {
    if (selectedMonths.length > 0) {
      fetchComparisonData(selectedMonths);
    }
  }, [selectedMonths, fetchComparisonData]);

  // Calculate summary statistics
  const summaryStats = calculateSummaryStats(comparisonData, selectedMonths);
  const trendIndicators = getTrendIndicators(comparisonData, selectedMonths);

  const handleMonthSelectionChange = (months: MonthYear[]) => {
    setSelectedMonths(months);
  };

  const handleFiltersChange = (newFilters: FilterCriteria) => {
    updateFilters(newFilters);
  };

  const handleApplyFilters = () => {
    applyFilters();
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Reports & Analytics
        </h2>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Multi-Month Comparison
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced Filtering & Reports
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Multi-Month Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Select Months for Comparison
              </h3>
              <MultiMonthSelector
                selectedMonths={selectedMonths}
                onSelectionChange={handleMonthSelectionChange}
                maxSelections={6}
              />
            </div>

            {/* Summary Statistics */}
            {selectedMonths.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Total Expenses</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ${summaryStats.totalExpenses.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Monthly Average</div>
                  <div className="text-2xl font-bold text-green-900">
                    ${summaryStats.averageMonthly.toLocaleString()}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-purple-600">Categories</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {summaryStats.totalCategories}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-orange-600">Months Selected</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {selectedMonths.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Filtering Tab */}
        {activeTab === 'advanced' && (
          <AdvancedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            loading={filterLoading}
          />
        )}
      </div>

      {/* Error Display */}
      {(comparisonError || filterError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{comparisonError || filterError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {activeTab === 'comparison' && (
        <div className="bg-white shadow rounded-lg p-6">
          <ProgressiveLoader
            isLoading={comparisonLoading}
            skeleton={<ChartSkeleton height={500} />}
            delay={200}
          >
            <LazyComparisonChart
              data={comparisonData}
              selectedMonths={selectedMonths}
              title="Multi-Month Expense Comparison"
              height={500}
              loading={comparisonLoading}
              showPercentageChange={true}
            />
          </ProgressiveLoader>
        </div>
      )}

      {/* Advanced Filtering Results */}
      {activeTab === 'advanced' && filteredExpenses.length > 0 && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <SummaryStatistics
            expenses={filteredExpenses}
            loading={filterLoading}
            title="Filtered Results Summary"
          />

          {/* Print Report Button */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Report Actions
              </h3>
              <button
                onClick={handlePrintReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Found {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} matching your criteria.
            </p>
          </div>
        </div>
      )}

      {/* Trend Indicators */}
      {activeTab === 'comparison' && trendIndicators.length > 0 && selectedMonths.length >= 2 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trend Analysis ({selectedMonths[0].label} → {selectedMonths[selectedMonths.length - 1].label})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendIndicators.map((indicator) => (
              <div
                key={indicator.category}
                className={`p-4 rounded-lg border-2 ${
                  indicator.trend === 'increasing'
                    ? 'border-red-200 bg-red-50'
                    : indicator.trend === 'decreasing'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-800 mb-2" title={indicator.category}>
                  {indicator.category}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-600">Change</div>
                    <div className={`text-lg font-bold ${
                      indicator.trend === 'increasing'
                        ? 'text-red-600'
                        : indicator.trend === 'decreasing'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {indicator.percentageChange > 0 ? '+' : ''}{indicator.percentageChange.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Amount</div>
                    <div className={`text-sm font-semibold ${
                      indicator.absoluteChange > 0
                        ? 'text-red-600'
                        : indicator.absoluteChange < 0
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {indicator.absoluteChange > 0 ? '+' : ''}${indicator.absoluteChange.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  ${indicator.firstAmount.toLocaleString()} → ${indicator.lastAmount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Export */}
      {activeTab === 'comparison' && (
        <DataExport
          trendData={comparisonData}
          selectedMonths={selectedMonths}
          filename="expense-comparison"
        />
      )}

      {/* Advanced Filtering Export */}
      {activeTab === 'advanced' && filteredExpenses.length > 0 && (
        <DataExport
          trendData={[]}
          expenseData={filteredExpenses}
          selectedMonths={[]}
          filename="filtered-expenses"
        />
      )}

      {/* Printable Report (hidden by default) */}
      {activeTab === 'advanced' && filteredExpenses.length > 0 && (
        <PrintableReport
          expenses={filteredExpenses}
          filters={filters}
          title="Expense Analysis Report"
        />
      )}
    </div>
  );
};

export default Reports;