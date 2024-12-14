import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { VariableSelector } from './VariableSelector';
import { Chart } from './Chart';
import { DataView } from './DataView';
import { ModelManager } from './ModelManager';
import { FileInfo } from './FileInfo';
import { StatsTable } from './StatsTable';
import { Oscilloperturbo } from './Oscilloperturbo';
import { FileDown, Activity, Table, Upload, Trash2 } from 'lucide-react';
import type { Model } from '../types/data';
import { calculateStats } from '../utils/statistics';
import { exportToExcel } from '../utils/excelExport';
import { schemeCategory10 } from 'd3';
import { useDataStore } from '../stores/dataStore';
import { useDataLoader } from '../hooks/useDataLoader';

const footerText = "Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2";

export const DataAnalysisApp: React.FC = () => {
  const { data, variables, fileData, setVariables, clearData } = useDataStore();
  const { handleDataLoaded } = useDataLoader();
  const [showDataView, setShowDataView] = useState(false);
  const [showOscillo, setShowOscillo] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentReferenceTime, setCurrentReferenceTime] = useState<string>('');
  const [zoomStats, setZoomStats] = useState<Array<{
    variable: string;
    stats: ReturnType<typeof calculateStats>;
  }> | null>(null);
  const [models, setModels] = useState<Model[]>(() => {
    const savedModels = localStorage.getItem('savedModels');
    return savedModels ? JSON.parse(savedModels) : [];
  });

  useEffect(() => {
    if (data.length > 0) {
      console.log('Données disponibles:', data.length);
      console.log('Variables sélectionnées:', variables.filter(v => v.selected).length);
      console.log('Exemple de données:', data[0]);
      console.log('Exemple de variable:', variables[0]);
    }
  }, [data, variables]);

  const handleFileUpload = async (parsedData: any, file: File) => {
    try {
      console.log('Données reçues:', parsedData);
      await handleDataLoaded(parsedData, file);
      console.log('Données chargées dans le store:', data);
      console.log('Variables:', variables);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Erreur lors du chargement du fichier:', error);
    }
  };

  const handleSaveModel = (name: string) => {
    const newModel: Model = {
      id: crypto.randomUUID(),
      name,
      variables: variables.filter(v => v.selected).map(v => v.id),
      createdAt: new Date().toISOString()
    };
    const updatedModels = [...models, newModel];
    setModels(updatedModels);
    localStorage.setItem('savedModels', JSON.stringify(updatedModels));
  };

  const handleLoadModel = (model: Model) => {
    setVariables(
      variables.map(v => ({
        ...v,
        selected: model.variables.includes(v.id)
      }))
    );
  };

  const handleClearData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les données ?')) {
      clearData();
      setZoomStats(null);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(data, variables, fileData!, zoomStats || undefined);
  };

  const handleZoom = (stats: Array<{
    variable: string;
    stats: ReturnType<typeof calculateStats>;
  }>) => {
    setZoomStats(stats);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white shadow-sm border-t">
        <div className="flex items-center gap-2 px-4 py-2">
          <button
            onClick={() => setShowFileUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Upload className="w-4 h-4" />
            Charger un fichier
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            disabled={!data.length}
          >
            <FileDown className="w-4 h-4" />
            Exporter en Excel
          </button>
          <button
            onClick={() => setShowOscillo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={!data.length}
          >
            <Activity className="w-4 h-4" />
            Oscilloperturbographe
          </button>
          <button
            onClick={() => setShowDataView(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={!data.length}
          >
            <Table className="w-4 h-4" />
            Voir les données
          </button>
          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={!data.length}
          >
            <Trash2 className="w-4 h-4" />
            Effacer les données
          </button>
          <ModelManager
            models={models}
            selectedVariables={variables.filter(v => v.selected)}
            onSaveModel={handleSaveModel}
            onLoadModel={handleLoadModel}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {data.length > 0 ? (
          <>
            <div className="grid grid-cols-[300px,1fr] gap-4">
              {/* Left Sidebar - Variable Selector */}
              <div className="bg-white rounded-lg shadow p-4 overflow-y-auto">
                <VariableSelector
                  variables={variables}
                  onVariableToggle={(variableId: string) => {
                    const updatedVariables = variables.map(v =>
                      v.id === variableId ? { ...v, selected: !v.selected } : v
                    );
                    setVariables(updatedVariables);
                  }}
                />
              </div>

              {/* Right Content - Chart and Stats */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <Chart
                    data={data.filter(d => variables.find(v => v.selected && v.id === d.Name))}
                    selectedVariables={variables.filter(v => v.selected)}
                    onTimeSelect={setCurrentReferenceTime}
                    onZoom={handleZoom}
                    variableColors={variables
                      .filter(v => v.selected)
                      .map((_, i) => schemeCategory10[i % schemeCategory10.length])}
                  />
                </div>

                {/* Stats Table - Below Chart */}
                {variables.some(v => v.selected) && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <StatsTable
                      stats={zoomStats || variables
                        .filter(v => v.selected)
                        .map(v => ({
                          variable: v.name,
                          stats: calculateStats(
                            data.filter(d => d.Name === v.id),
                            v.name
                          )
                        }))}
                      variableColors={variables
                        .filter(v => v.selected)
                        .map((_, i) => schemeCategory10[i % schemeCategory10.length])}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Aucune donnée chargée. Veuillez charger un fichier pour commencer.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-2 px-4 text-center text-sm text-gray-600">
        {footerText}
      </footer>

      {/* Modals */}
      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onCancel={() => setShowFileUpload(false)}
        />
      )}
      {showDataView && data.length > 0 && (
        <DataView
          data={data}
          selectedVariables={variables.filter(v => v.selected)}
          onBack={() => setShowDataView(false)}
        />
      )}
      {showOscillo && data.length > 0 && (
        <Oscilloperturbo
          data={data}
          selectedVariables={variables.filter(v => v.selected)}
          variableColors={variables
            .filter(v => v.selected)
            .map((_, i) => schemeCategory10[i % schemeCategory10.length])}
          onBack={() => setShowOscillo(false)}
          initialReferenceTime={currentReferenceTime}
        />
      )}
      {fileData && (
        <FileInfo
          fileData={fileData}
        />
      )}
    </div>
  );
};