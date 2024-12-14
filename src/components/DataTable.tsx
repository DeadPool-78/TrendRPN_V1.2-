import React, { useState, useEffect, useCallback } from 'react';
import { DataPoint, Variable } from '../types/data';
import { formatNumber } from '../utils/formatters';

interface DataTableProps {
  data: DataPoint[];
  selectedVariables: Variable[];
}

const BATCH_SIZE = 5000;

export const DataTable: React.FC<DataTableProps> = ({ data, selectedVariables }) => {
  const [displayedData, setDisplayedData] = useState<Array<{ timestamp: string; [key: string]: number }>>([]);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [variableCounts, setVariableCounts] = useState<{ [key: string]: number }>({});

  const calculateVariableCounts = useCallback(() => {
    const counts: { [key: string]: number } = {};
    selectedVariables.forEach(variable => {
      counts[variable.name] = data.filter(d => d.Name === variable.name).length;
    });
    return counts;
  }, [data, selectedVariables]);

  const pivotData = useCallback(() => {
    const timeMap = new Map<string, { [key: string]: number }>();
    
    data.forEach(row => {
      if (selectedVariables.some(v => v.name === row.Name)) {
        const value = typeof row.Value === 'string' ? parseFloat(row.Value.replace(',', '.')) : row.Value;
        if (!timeMap.has(row.TS)) {
          timeMap.set(row.TS, {});
        }
        const timeEntry = timeMap.get(row.TS)!;
        timeEntry[row.Name] = value;
      }
    });

    return Array.from(timeMap.entries())
      .map(([timestamp, values]) => ({
        timestamp,
        ...values
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, selectedVariables]);

  const loadMoreData = useCallback(() => {
    const pivotedData = pivotData();
    const start = 0;
    const end = Math.min(currentBatch * BATCH_SIZE, pivotedData.length);
    setDisplayedData(pivotedData.slice(start, end));
    setIsLoading(false);
  }, [pivotData, currentBatch]);

  useEffect(() => {
    setCurrentBatch(1);
    loadMoreData();
    setVariableCounts(calculateVariableCounts());
  }, [data, selectedVariables, calculateVariableCounts]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    if (
      element.scrollHeight - element.scrollTop === element.clientHeight &&
      !isLoading
    ) {
      setIsLoading(true);
      setCurrentBatch(prev => prev + 1);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) {
      loadMoreData();
    }
  }, [isLoading, loadMoreData]);

  const truncateText = (text: string, maxLength: number = 30) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!displayedData.length || !selectedVariables.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
        No data available for the selected variables
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Tableau de données</h2>
      <div className="overflow-x-auto shadow-md rounded-lg bg-white">
        <div 
          className="overflow-x-scroll" 
          style={{ maxHeight: '70vh' }}
          onScroll={handleScroll}
        >
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-36">
                  Timestamp
                </th>
                {selectedVariables.map(variable => (
                  <th 
                    key={variable.id} 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-32"
                    title={variable.displayName}
                  >
                    <div>{truncateText(variable.displayName)}</div>
                    <div className="text-xs font-normal text-gray-400 mt-1">
                      {variableCounts[variable.name]} points
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-xs">
              {displayedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                    {row.timestamp}
                  </td>
                  {selectedVariables.map(variable => (
                    <td key={variable.id} className="px-2 py-2 whitespace-nowrap text-gray-500">
                      {row[variable.name] !== undefined ? formatNumber(row[variable.name]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && (
            <div className="text-center py-4 text-gray-500">
              Loading more data...
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 italic">
        Les données sont affichées chronologiquement selon leur horodatage
      </p>
    </div>
  );
};