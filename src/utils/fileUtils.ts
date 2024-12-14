import { DataPoint, FileData } from '../types/data';

export const calculateFileInfo = async (data: DataPoint[], file: File): Promise<FileData> => {
  return {
    fileName: file.name,
    fileSize: file.size,
    variablesCount: Object.keys(data[0] || {}).length - 1, // -1 pour exclure TS
    firstTimestamp: data[0]?.TS || '',
    lastTimestamp: data[data.length - 1]?.TS || ''
  };
};
