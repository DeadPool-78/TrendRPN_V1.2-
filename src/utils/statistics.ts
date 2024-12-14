import { DataPoint, DatasetStats } from '../types/data';

export const calculateStats = (data: DataPoint[], variableName: string): DatasetStats | null => {
  const values = data
    .filter(d => d.Name === variableName)
    .map(d => parseFloat(typeof d.Value === 'string' ? d.Value.replace(',', '.') : d.Value))
    .filter(v => !isNaN(v));

  if (values.length === 0) return null;

  const sortedValues = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median = count % 2 === 0
    ? (sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2
    : sortedValues[Math.floor(count / 2)];
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    stdDev,
    min: sortedValues[0],
    max: sortedValues[count - 1],
    count
  };
};