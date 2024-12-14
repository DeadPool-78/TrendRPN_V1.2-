import { DataPoint, FileData } from '../types/data';
import { parseTimestamp } from './formatters';

export const addComputedFields = (data: DataPoint[]): DataPoint[] => {
  return data.map(row => {
    const computedFields: Record<string, string> = {};
    if (row.Name && row.TextAttr03) {
      const fieldName = `TextAttr03_${row.Name}`;
      computedFields[fieldName] = `${row.TextAttr03}_${row.Name}`;
    }
    return { ...row, ...computedFields };
  });
};

export const mergeDataSets = (existingData: DataPoint[], newData: DataPoint[]): DataPoint[] => {
  const allData = [...existingData, ...newData];
  
  // Trier les données par timestamp
  return allData.sort((a, b) => {
    const dateA = new Date(a.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
    const dateB = new Date(b.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
    return dateA.getTime() - dateB.getTime();
  });
};

export const calculateFileInfo = (data: DataPoint[], file: File): FileData => {
  // Optimisation pour les gros fichiers
  const sampleSize = Math.min(1000, data.length);
  const sampledData = data.length > sampleSize 
    ? data.filter((_, index) => index % Math.floor(data.length / sampleSize) === 0)
    : data;

  // Get unique variables
  const uniqueVariables = new Set(sampledData.map(point => point.Name));

  // Sort timestamps and ensure they are properly parsed
  const timestamps = sampledData.map(point => parseTimestamp(point.TS));
  const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());

  const firstTimestamp = sortedTimestamps[0].toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');

  const lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1].toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');

  return {
    fileName: file.name,
    fileSize: file.size,
    variablesCount: uniqueVariables.size,
    firstTimestamp,
    lastTimestamp
  };
};