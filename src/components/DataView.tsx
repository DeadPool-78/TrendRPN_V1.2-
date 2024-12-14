import React, { useState } from 'react';
import { ArrowLeft, Table, BarChart2 } from 'lucide-react';
import { DataPoint, Variable } from '../types/data';
import { calculateStats } from '../utils/statistics';
import { DataTable } from './DataTable';
import { StatsTable } from './StatsTable';
import { schemeCategory10 } from 'd3';

interface DataViewProps {
  data: DataPoint[];
  selectedVariables: Variable[];
  onBack: () => void;
}

export const DataView: React.FC<DataViewProps> = ({
  data,
  selectedVariables,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'stats'>('stats');

  const stats = selectedVariables.map(variable => ({
    variable: variable.displayName,
    stats: calculateStats(data, variable.name)
  }));

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-[1920px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Charts</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Statistics</span>
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'data'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Raw Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {activeTab === 'stats' ? (
          <StatsTable 
            stats={stats} 
            variableColors={selectedVariables.map((_, i) => schemeCategory10[i])}
          />
        ) : (
          <DataTable
            data={data}
            selectedVariables={selectedVariables}
          />
        )}
      </main>
    </div>
  );
};