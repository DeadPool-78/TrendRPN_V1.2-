import React, { useCallback, useState } from 'react';
import { Upload, ArrowLeft, AlertCircle } from 'lucide-react';
import { parseDataFile } from '../utils/parser';
import { ParsedData } from '../types/data';
import { useDataStore } from '../stores/dataStore';

interface FileUploadProps {
  onUpload: (parsedData: ParsedData, file: File) => void;
  onCancel: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { fileData } = useDataStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.dat')) {
      setError('Veuillez sélectionner un fichier .dat');
      return;
    }

    setError('');
    setIsProcessing(true);
    setCurrentOperation('Lecture du fichier...');

    try {
      const parsedData = await parseDataFile(file);
      onUpload(parsedData, file);
    } catch (error) {
      console.error('Error parsing file:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier');
    } finally {
      setIsProcessing(false);
      setCurrentOperation('');
    }
  }, [onUpload]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col items-center justify-center w-full h-[500px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-12 h-12 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">
                {fileData ? "Ajouter un autre fichier" : "Cliquez pour charger"}
              </span> ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500">Format: .dat file avec colonnes:</p>
            <p className="text-xs text-gray-500">Chrono, Name, Value, Quality, TextAttr03, TS</p>
            {fileData && (
              <p className="mt-2 text-xs text-blue-500">
                Les données seront fusionnées avec le fichier existant
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center space-x-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 w-64 space-y-4">
              <div className="text-sm text-blue-500 text-center">
                {currentOperation}
              </div>
            </div>
          )}

          <input
            type="file"
            className="hidden"
            accept=".dat"
            onChange={handleInputChange}
            disabled={isProcessing}
          />
        </label>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
      )}

      <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-200">
        Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2
      </div>
    </div>
  );
};