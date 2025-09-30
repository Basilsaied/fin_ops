import React from 'react';

// Chart loading skeleton
export const ChartSkeleton: React.FC<{ height?: number; title?: boolean }> = ({ 
  height = 400, 
  title = true 
}) => (
  <div className="w-full animate-pulse space-y-4">
    {title && (
      <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
    )}
    <div className="w-full bg-gray-100 rounded" style={{ height }}>
      <div className="flex items-end justify-around h-full p-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-300 rounded-t"
            style={{
              height: `${Math.random() * 60 + 20}%`,
              width: '10%'
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

// Table loading skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="w-full animate-pulse">
    {/* Header */}
    <div className="flex space-x-4 mb-4">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 rounded flex-1"></div>
      ))}
    </div>
    
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 mb-3">
        {[...Array(columns)].map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);

// Form loading skeleton
export const FormSkeleton: React.FC = () => (
  <div className="w-full animate-pulse space-y-6">
    {/* Form fields */}
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    ))}
    
    {/* Submit button */}
    <div className="h-10 bg-gray-300 rounded w-32"></div>
  </div>
);

// Card loading skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Dashboard loading skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    {/* Header */}
    <div className="space-y-2">
      <div className="h-8 bg-gray-300 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    
    {/* Stats cards */}
    <CardSkeleton count={3} />
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartSkeleton height={300} />
      <ChartSkeleton height={300} />
    </div>
  </div>
);

// Progressive loading component
export const ProgressiveLoader: React.FC<{
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}> = ({ isLoading, skeleton, children, delay = 200 }) => {
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);
  
  if (isLoading && showSkeleton) {
    return <>{skeleton}</>;
  }
  
  if (isLoading) {
    return null; // Show nothing during initial delay
  }
  
  return <>{children}</>;
};