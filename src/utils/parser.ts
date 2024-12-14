import Papa from 'papaparse';
import { DataPoint, ParsedData } from '../types/data';

const extractDateFromFileName = (fileName: string): string | null => {
  // Match YYYYMMDDHHMMSS pattern in filename
  const match = fileName.match(/(\d{14})/);
  if (match) {
    const timestamp = match[1];
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);
    const minute = timestamp.substring(10, 12);
    const second = timestamp.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }
  return null;
};

export const parseDataFile = (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const data: DataPoint[] = [];
    const uniqueVariables = new Set<string>();
    const textAttr03Map = new Map<string, string>();
    let firstTimestamp: Date | null = null;
    let lastTimestamp: Date | null = null;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step: (row) => {
        try {
          const { Chrono, Name, Value, Quality, TextAttr03, TS } = row.data;
          if (!Name || !TS) return;

          uniqueVariables.add(Name);
          if (TextAttr03) {
            textAttr03Map.set(Name, TextAttr03);
          }

          const timestamp = new Date(TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
          if (!firstTimestamp || timestamp < firstTimestamp) {
            firstTimestamp = timestamp;
          }
          if (!lastTimestamp || timestamp > lastTimestamp) {
            lastTimestamp = timestamp;
          }

          data.push({
            Chrono,
            Name,
            Value: typeof Value === 'string' ? parseFloat(Value.replace(',', '.')) : Value,
            Quality: parseInt(Quality),
            TextAttr03: TextAttr03 || '',
            TS
          });
        } catch (error) {
          console.error('Error processing row:', error, row.data);
        }
      },
      complete: () => {
        const variables = Array.from(uniqueVariables).map(name => ({
          id: name,
          name,
          textAttr03: textAttr03Map.get(name) || '',
          displayName: `${name} ${textAttr03Map.get(name) ? `(${textAttr03Map.get(name)})` : ''}`,
          selected: false
        }));

        resolve({
          data,
          variables,
          fileName: file.name,
          firstTimestamp: firstTimestamp!.toLocaleString('fr-FR'),
          lastTimestamp: lastTimestamp!.toLocaleString('fr-FR')
        });
      },
      error: (error) => reject(error)
    });
  });
};