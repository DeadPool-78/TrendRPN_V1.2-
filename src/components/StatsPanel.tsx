import React from 'react';
import { DatasetStats } from '../types/data';

interface StatsPanelProps {
  stats: DatasetStats | null;
  variableName: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, variableName }) => {
  if (!stats) {
    return null;
  }

  const formatNumber = (num: number) => num.toFixed(2);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Statistics for {variableName}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Mean:</span>
            <span className="text-sm font-medium">{formatNumber(stats.mean)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Median:</span>
            <span className="text-sm font-medium">{formatNumber(stats.median)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Std Dev:</span>
            <span className="text-sm font-medium">{formatNumber(stats.stdDev)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Min:</span>
            <span className="text-sm font-medium">{formatNumber(stats.min)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Max:</span>
            <span className="text-sm font-medium">{formatNumber(stats.max)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Count:</span>
            <span className="text-sm font-medium">{stats.count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};