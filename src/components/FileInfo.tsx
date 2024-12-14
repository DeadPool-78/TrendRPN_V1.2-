import React from 'react';
import { FileData } from '../types/data';
import { formatFileSize, calculateDuration } from '../utils/formatters';

interface FileInfoProps {
  fileData: FileData;
  selectedPeriod?: { start: Date; end: Date } | null;
}

export const FileInfo: React.FC<FileInfoProps> = ({ fileData, selectedPeriod }) => {
  const totalDuration = calculateDuration(fileData.firstTimestamp, fileData.lastTimestamp);
  const selectedDuration = selectedPeriod 
    ? calculateDuration(
        selectedPeriod.start.toLocaleString('fr-FR'),
        selectedPeriod.end.toLocaleString('fr-FR')
      )
    : null;
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-md mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Informations du fichier</h3>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500">Fichier:</span>
          <span className="font-medium">{fileData.fileName}</span>
        </div>
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500">Taille:</span>
          <span className="font-medium">{formatFileSize(fileData.fileSize)}</span>
        </div>
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500">Variables:</span>
          <span className="font-medium">{fileData.variablesCount}</span>
        </div>
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500">Durée:</span>
          <span className="font-medium">{totalDuration}</span>
        </div>
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500">Période:</span>
          <span className="font-medium whitespace-nowrap">{fileData.firstTimestamp} → {fileData.lastTimestamp}</span>
        </div>
        {selectedDuration && (
          <div className="flex items-center gap-x-1">
            <span className="text-gray-500">Sélection:</span>
            <span className="font-medium">{selectedDuration}</span>
          </div>
        )}
      </div>
    </div>
  );
};