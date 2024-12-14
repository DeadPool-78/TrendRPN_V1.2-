import React from 'react';
import { DatasetStats } from '../types/data';
import { formatNumber } from '../utils/formatters';

interface StatsTableProps {
  stats: Array<{
    variable: string;
    stats: DatasetStats | null;
  }>;
  zoomStats?: Array<{
    variable: string;
    stats: DatasetStats | null;
  }>;
  variableColors: string[];
}

export const StatsTable: React.FC<StatsTableProps> = ({ stats, zoomStats, variableColors = [] }) => {
  const renderStatsSection = (title: string, statsData: typeof stats) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variable
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moyenne
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Médiane
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Écart Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Minimum
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maximum
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {statsData.map(({ variable, stats }, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-xs break-all">
                  <span style={{ color: variableColors[index] || '#000' }}>
                    {variable}
                  </span>
                </td>
                {stats ? (
                  <>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatNumber(stats.mean)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatNumber(stats.median)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatNumber(stats.stdDev)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatNumber(stats.min)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatNumber(stats.max)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {stats.count}
                    </td>
                  </>
                ) : (
                  <td colSpan={6} className="px-3 py-2 text-xs text-gray-500">
                    No data available
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Tableau des statistiques</h2>
      {renderStatsSection("Statistiques globales", stats)}
      {zoomStats && zoomStats.length > 0 && renderStatsSection("Statistiques de la sélection", zoomStats)}
    </div>
  );
};