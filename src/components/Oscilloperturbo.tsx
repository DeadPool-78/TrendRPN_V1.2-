import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Download, Clock } from 'lucide-react';
import { DataPoint, Variable } from '../types/data';
import { formatNumber } from '../utils/formatters';
import * as Dialog from '@radix-ui/react-dialog';

const footerText = "Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2";
const BATCH_SIZE = 1000;

interface Settings {
  timeWindow: {
    before: number;
    after: number;
  };
}

interface OscilloperturbographeProps {
  data: DataPoint[];
  selectedVariables: Variable[];
  variableColors: string[];
  onBack: () => void;
  initialReferenceTime?: string;
}

export const Oscilloperturbo: React.FC<OscilloperturbographeProps> = ({
  data,
  selectedVariables,
  variableColors,
  onBack,
  initialReferenceTime
}) => {
  const [settings, setSettings] = useState<Settings>({
    timeWindow: {
      before: 10,
      after: 10,
    }
  });

  const [currentTime, setCurrentTime] = useState<string>(initialReferenceTime || '');
  const [showSettings, setShowSettings] = useState(false);
  const [displayData, setDisplayData] = useState<DataPoint[]>([]);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!currentTime && data.length > 0) {
      const sortedData = [...data].sort((a, b) => 
        new Date(a.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 ')).getTime() -
        new Date(b.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 ')).getTime()
      );
      setCurrentTime(sortedData[Math.floor(sortedData.length / 2)].TS);
    }
  }, [data, currentTime]);

  const getFilteredData = useCallback(() => {
    if (!currentTime) return [];

    const sortedData = [...data].sort((a, b) => 
      new Date(a.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 ')).getTime() -
      new Date(b.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 ')).getTime()
    );

    let filteredData: DataPoint[] = [];
    const currentDate = new Date(currentTime.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
    const beforeTime = new Date(currentDate.getTime() - settings.timeWindow.before * 1000);
    const afterTime = new Date(currentDate.getTime() + settings.timeWindow.after * 1000);

    filteredData = sortedData.filter(point => {
      const pointDate = new Date(point.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
      return pointDate >= beforeTime && pointDate <= afterTime;
    });

    return filteredData.filter(point => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const pointValue = String(point[key]).toLowerCase();
        return pointValue.includes(value.toLowerCase());
      });
    });
  }, [data, currentTime, settings, filters]);

  const loadMoreData = useCallback(() => {
    const filteredData = getFilteredData();
    const start = 0;
    const end = Math.min(currentBatch * BATCH_SIZE, filteredData.length);
    setDisplayData(filteredData.slice(start, end));
    setIsLoading(false);
  }, [getFilteredData, currentBatch]);

  useEffect(() => {
    setCurrentBatch(1);
    loadMoreData();
  }, [currentTime, settings, filters, loadMoreData]);

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

  const handleExport = () => {
    const filteredData = getFilteredData();
    const csvContent = [
      ['Timestamp', 'Variable', 'Value', 'Quality'].join(';'),
      ...filteredData.map(row => 
        [row.TS, row.Name, formatNumber(Number(row.Value)), row.Quality].join(';')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'oscilloperturbo_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <span>Retour au graphique</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h2 className="text-xl font-bold text-gray-900">Oscilloperturbographe</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Réglages</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Temps de référence:
              </label>
              <input
                type="text"
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <div 
                className="overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 300px)' }}
                onScroll={handleScroll}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs"
                          placeholder="Filtrer..."
                          value={filters['TS'] || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, TS: e.target.value }))}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variable
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs"
                          placeholder="Filtrer..."
                          value={filters['Name'] || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, Name: e.target.value }))}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs"
                          placeholder="Filtrer..."
                          value={filters['Value'] || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, Value: e.target.value }))}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quality
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-xs"
                          placeholder="Filtrer..."
                          value={filters['Quality'] || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, Quality: e.target.value }))}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayData.map((point, index) => {
                      const isReferenceTime = point.TS === currentTime;
                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-gray-50 ${isReferenceTime ? 'bg-yellow-50 font-bold' : ''}`}
                        >
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {isReferenceTime && <Clock className="inline-block w-4 h-4 mr-1 text-yellow-500" />}
                            {point.TS}
                          </td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">
                            <span style={{ 
                              color: variableColors[selectedVariables.findIndex(v => v.name === point.Name)] || '#000'
                            }}>
                              {point.Name}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {formatNumber(Number(point.Value))}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {point.Quality}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {isLoading && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Chargement des données...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-[400px]">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Réglages
            </Dialog.Title>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondes avant: {settings.timeWindow.before}
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={settings.timeWindow.before}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeWindow: {
                      ...prev.timeWindow,
                      before: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondes après: {settings.timeWindow.after}
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={settings.timeWindow.after}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeWindow: {
                      ...prev.timeWindow,
                      after: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Fermer
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <footer className="mt-8 py-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600">
          {footerText}
        </div>
      </footer>
    </div>
  );
};