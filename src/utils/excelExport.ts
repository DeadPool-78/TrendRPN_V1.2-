import { utils, writeFile } from 'xlsx';
import { DataPoint, Variable, FileData } from '../types/data';
import { calculateStats } from './statistics';
import { formatFileSize } from './formatters';

export const exportToExcel = async (
  data: DataPoint[],
  selectedVariables: Variable[],
  fileData?: FileData,
  zoomStats?: Array<{ variable: string; stats: ReturnType<typeof calculateStats> }> | null,
) => {
  // Create workbook
  const wb = utils.book_new();

  // Prepare combined data for Overview sheet
  const overviewData = [
    ['Analyse de Fichier TREND RPN VD4'],
    [],
  ];

  if (fileData) {
    overviewData.push(
      ['Informations du fichier'],
      ['Fichier', fileData.fileName],
      ['Taille', formatFileSize(fileData.fileSize)],
      ['Variables', fileData.variablesCount.toString()],
      ['Période', `${fileData.firstTimestamp} → ${fileData.lastTimestamp}`],
      []
    );
  }

  overviewData.push(
    ['Statistiques globales'],
    ['Variable', 'Moyenne', 'Médiane', 'Écart Type', 'Minimum', 'Maximum', 'Nombre']
  );

  // Add global stats
  selectedVariables.forEach(variable => {
    const stats = calculateStats(data, variable.name);
    if (stats) {
      overviewData.push([
        variable.displayName,
        stats.mean.toFixed(3),
        stats.median.toFixed(3),
        stats.stdDev.toFixed(3),
        stats.min.toFixed(3),
        stats.max.toFixed(3),
        stats.count.toString()
      ]);
    }
  });

  // Add zoom stats if available
  if (zoomStats && Array.isArray(zoomStats) && zoomStats.length > 0) {
    overviewData.push(
      [],
      ['Statistiques de la période sélectionnée'],
      ['Variable', 'Moyenne', 'Médiane', 'Écart Type', 'Minimum', 'Maximum', 'Nombre']
    );

    zoomStats.forEach(({ variable, stats }) => {
      if (stats) {
        overviewData.push([
          variable,
          stats.mean.toFixed(3),
          stats.median.toFixed(3),
          stats.stdDev.toFixed(3),
          stats.min.toFixed(3),
          stats.max.toFixed(3),
          stats.count.toString()
        ]);
      }
    });
  }

  // Create Overview sheet
  const wsOverview = utils.aoa_to_sheet(overviewData);
  utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble');

  // Create Data sheet
  const headers = ['Timestamp', ...selectedVariables.map(v => v.displayName)];
  const wsData = utils.aoa_to_sheet([
    headers,
    ...data.map(point => [
      point.TS,
      ...selectedVariables.map(v => point[v.name])
    ])
  ]);
  utils.book_append_sheet(wb, wsData, 'Données');

  // Save the file
  writeFile(wb, 'analyse_trend_rpn.xlsx');
};