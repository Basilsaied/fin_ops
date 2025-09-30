import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/utils';
import LineChart from '../LineChart';
import { mockTrendData } from '../../../test/mocks';

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart" {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, ...props }: any) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} {...props} />
  ),
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('LineChart', () => {
  const defaultProps = {
    data: mockTrendData,
    title: 'Expense Trends Over Time',
  };

  it('should render chart with trend data', () => {
    render(<LineChart {...defaultProps} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should display chart title', () => {
    render(<LineChart {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(<LineChart {...defaultProps} data={[]} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText('No trend data available')).toBeInTheDocument();
  });

  it('should apply custom height when provided', () => {
    const customHeight = 600;
    render(<LineChart {...defaultProps} height={customHeight} />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toHaveStyle({ height: `${customHeight}px` });
  });

  it('should use default height when not provided', () => {
    render(<LineChart {...defaultProps} />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toHaveStyle({ height: '400px' });
  });

  it('should format month labels correctly', () => {
    render(<LineChart {...defaultProps} />);

    // Check if month formatter is applied to X-axis
    const xAxis = screen.getByTestId('x-axis');
    expect(xAxis).toHaveAttribute('tickFormatter');
  });

  it('should format currency values correctly', () => {
    render(<LineChart {...defaultProps} />);

    // Check if currency formatter is applied to Y-axis and tooltip
    const yAxis = screen.getByTestId('y-axis');
    expect(yAxis).toHaveAttribute('tickFormatter');
    
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('formatter');
  });

  it('should be responsive', () => {
    render(<LineChart {...defaultProps} />);

    const responsiveContainer = screen.getByTestId('responsive-container');
    expect(responsiveContainer).toHaveStyle({ width: '100%' });
  });

  it('should handle loading state', () => {
    render(<LineChart {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to load trend data';
    render(<LineChart {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LineChart {...defaultProps} />);

    const chart = screen.getByTestId('line-chart');
    expect(chart).toHaveAttribute('role', 'img');
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('Line chart'));
  });

  it('should render multiple lines for different categories', () => {
    render(<LineChart {...defaultProps} showCategoryLines={true} />);

    // Should render multiple lines for different categories
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('should handle click events on data points', () => {
    const onPointClick = vi.fn();
    render(<LineChart {...defaultProps} onPointClick={onPointClick} />);

    const line = screen.getByTestId('line');
    expect(line).toHaveAttribute('onClick');
  });

  it('should show data points when enabled', () => {
    render(<LineChart {...defaultProps} showDataPoints={true} />);

    const line = screen.getByTestId('line');
    expect(line).toHaveAttribute('dot', 'true');
  });

  it('should animate on mount', () => {
    render(<LineChart {...defaultProps} animate={true} />);

    const line = screen.getByTestId('line');
    expect(line).toHaveAttribute('isAnimationActive', 'true');
  });

  it('should handle single data point', () => {
    const singlePointData = [mockTrendData[0]];
    render(<LineChart {...defaultProps} data={singlePointData} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });

  it('should display trend indicators', () => {
    render(<LineChart {...defaultProps} showTrendIndicators={true} />);

    // Should show trend arrows or indicators
    expect(screen.getByTestId('trend-indicator')).toBeInTheDocument();
  });

  it('should handle zoom functionality', () => {
    render(<LineChart {...defaultProps} enableZoom={true} />);

    const chart = screen.getByTestId('line-chart');
    expect(chart).toHaveAttribute('onMouseDown');
    expect(chart).toHaveAttribute('onMouseMove');
  });

  it('should format tooltip content correctly', () => {
    render(<LineChart {...defaultProps} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('labelFormatter');
    expect(tooltip).toHaveAttribute('formatter');
  });

  it('should handle different time periods', () => {
    const yearlyData = mockTrendData.map(item => ({
      ...item,
      period: 'yearly'
    }));

    render(<LineChart {...defaultProps} data={yearlyData} timePeriod="yearly" />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should maintain performance with large datasets', () => {
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      month: (i % 12) + 1,
      year: 2020 + Math.floor(i / 12),
      totalAmount: Math.random() * 100000,
      categoryBreakdown: [],
    }));

    render(<LineChart {...defaultProps} data={largeDataset} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});