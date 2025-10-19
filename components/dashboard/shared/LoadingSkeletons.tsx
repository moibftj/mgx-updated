import React from "react";

export const DashboardLoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="h-64 bg-gray-200 rounded-2xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
      ))}
    </div>
  </div>
);

export const MetricCardsSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse">
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="border-b border-gray-200 p-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
