import React from 'react';

interface ChartContainerProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  title?: string;
  height?: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  loading,
  error,
  children,
  title,
  height = 400
}) => {
  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {title}
          </h3>
        )}
        <div 
          className="flex flex-col items-center justify-center text-red-500"
          style={{ height }}
        >
          <svg 
            className="w-12 h-12 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
          <p className="text-center font-medium">Error loading chart</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {title}
          </h3>
        )}
        <div 
          className="flex flex-col items-center justify-center"
          style={{ height }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {children}
    </div>
  );
};