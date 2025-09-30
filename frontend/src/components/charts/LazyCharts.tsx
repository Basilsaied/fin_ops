import React, { Suspense } from 'react';

// Lazy load chart components for better performance
const BarChart = React.lazy(() => 
  import('./BarChart').then(module => ({ default: module.BarChart }))
);

const LineChart = React.lazy(() => 
  import('./LineChart').then(module => ({ default: module.LineChart }))
);

const ComparisonChart = React.lazy(() => 
  import('./ComparisonChart').then(module => ({ default: module.ComparisonChart }))
);

// Chart loading skeleton
const ChartSkeleton = ({ height = 400 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <div className="h-6 bg-gray-200 rounded mb-4 w-1/3 mx-auto"></div>
    <div className="h-full bg-gray-100 rounded flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  </div>
);

// Wrapper components with Suspense
export const LazyBarChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton height={props.height} />}>
    <BarChart {...props} />
  </Suspense>
);

export const LazyLineChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton height={props.height} />}>
    <LineChart {...props} />
  </Suspense>
);

export const LazyComparisonChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton height={props.height} />}>
    <ComparisonChart {...props} />
  </Suspense>
);