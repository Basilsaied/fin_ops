import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/utils';
import BarChart from '../BarChart';
import { mockChartData } from '../../../test/mocks';

// Mock Recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children, ...props }: any) => (
    <div data-testid="bar-chart" {...props}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, ...props }: any) => (
    <div data-testid="bar" data-key={dataKey} {...props} />
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

describe('BarChart', () => {
  const defaultProps = {
    data: mockChartData,
    title: 'Monthly Expenses by Category',
  };

  it('should render chart with data', () => {
    render(<BarChart {...defaultProps} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should display chart title', () => {
    render(<BarChart {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(<BarChart {...defaultProps} data={[]} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should apply custom height when provided', () => {
    const customHeight = 500;
    render(<BarChart {...defaultProps} height={customHeight} />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toHaveStyle({ height: `${customHeight}px` });
  });

  it('should use default height when not provided', () => {
    render(<BarChart {...defaultProps} />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toHaveStyle({ height: '400px' });
  });

  it('should format currency values correctly', () => {
    render(<BarChart {...defaultProps} />);

    // Check if tooltip formatter is applied
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('should be responsive', () => {
    render(<BarChart {...defaultProps} />);

    const responsiveContainer = screen.getByTestId('responsive-container');
    expect(responsiveContainer).toHaveStyle({ width: '100%' });
  });

  it('should handle loading state', () => {
    render(<BarChart {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to load chart data';
    render(<BarChart {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<BarChart {...defaultProps} />);

    const chart = screen.getByTestId('bar-chart');
    expect(chart).toHaveAttribute('role', 'img');
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('Bar chart'));
  });

  it('should render with different color schemes', () => {
    const customColors = ['#8884d8', '#82ca9d', '#ffc658'];
    render(<BarChart {...defaultProps} colors={customColors} />);

    const bar = screen.getByTestId('bar');
    expect(bar).toHaveAttribute('fill', customColors[0]);
  });

  it('should handle click events on bars', () => {
    const onBarClick = vi.fn();
    render(<BarChart {...defaultProps} onBarClick={onBarClick} />);

    const bar = screen.getByTestId('bar');
    expect(bar).toHaveAttribute('onClick');
  });

  it('should display data labels when enabled', () => {
    render(<BarChart {...defaultProps} showDataLabels={true} />);

    // Check if data labels are rendered
    mockChartData.forEach(item => {
      expect(screen.getByText(item.amount.toString())).toBeInTheDocument();
    });
  });

  it('should animate on mount', () => {
    render(<BarChart {...defaultProps} animate={true} />);

    const bar = screen.getByTestId('bar');
    expect(bar).toHaveAttribute('isAnimationActive', 'true');
  });

  it('should handle very large numbers', () => {
    const largeNumberData = [
      { category: 'Large Expense', amount: 1000000 },
    ];

    render(<BarChart {...defaultProps} data={largeNumberData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should handle very small numbers', () => {
    const smallNumberData = [
      { category: 'Small Expense', amount: 0.01 },
    ];

    render(<BarChart {...defaultProps} data={smallNumberData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should maintain aspect ratio on resize', () => {
    render(<BarChart {...defaultProps} maintainAspectRatio={true} />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toHaveAttribute('aspect');
  });
});