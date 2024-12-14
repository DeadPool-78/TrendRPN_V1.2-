import { DataPoint } from '../types/data';

const MEMORY_CLEANUP_INTERVAL = 1000; // Nombre de points traités avant nettoyage mémoire

const processDataChunk = (chunk: DataPoint[]) => {
  return chunk.map(row => {
    const computedFields: Record<string, string> = {};
    if (row.Name && row.TextAttr03) {
      const fieldName = `TextAttr03_${row.Name}`;
      computedFields[fieldName] = `${row.TextAttr03}_${row.Name}`;
    }
    return { ...row, ...computedFields };
  });
};

const getTimestamp = (point: DataPoint): number => {
  try {
    return new Date(point.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 ')).getTime();
  } catch (error) {
    throw new Error(`Invalid timestamp format: ${point.TS}`);
  }
};

const mergeChunks = (chunks: DataPoint[][]): DataPoint[] => {
  // Fusionner les chunks par paires pour réduire l'utilisation mémoire
  while (chunks.length > 1) {
    const mergedChunks: DataPoint[][] = [];
    
    for (let i = 0; i < chunks.length; i += 2) {
      if (i + 1 < chunks.length) {
        // Fusionner deux chunks
        const merged = mergeTwoChunks(chunks[i], chunks[i + 1]);
        mergedChunks.push(merged);
      } else {
        // S'il reste un chunk impair, l'ajouter tel quel
        mergedChunks.push(chunks[i]);
      }
    }
    
    chunks = mergedChunks;
  }
  
  return chunks[0] || [];
};

const mergeTwoChunks = (chunk1: DataPoint[], chunk2: DataPoint[]): DataPoint[] => {
  const merged: DataPoint[] = [];
  let i = 0, j = 0;
  
  while (i < chunk1.length && j < chunk2.length) {
    const time1 = getTimestamp(chunk1[i]);
    const time2 = getTimestamp(chunk2[j]);
    
    if (time1 <= time2) {
      merged.push(chunk1[i]);
      i++;
    } else {
      merged.push(chunk2[j]);
      j++;
    }
  }
  
  // Ajouter les éléments restants
  while (i < chunk1.length) merged.push(chunk1[i++]);
  while (j < chunk2.length) merged.push(chunk2[j++]);
  
  return merged;
};

let processedItemCount = 0;

const cleanupMemory = async () => {
  processedItemCount++;
  if (processedItemCount % MEMORY_CLEANUP_INTERVAL === 0) {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (global.gc) {
      try {
        global.gc();
      } catch (e) {
        console.warn('Failed to force garbage collection');
      }
    }
  }
};

self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data;

  try {
    if (type === 'process_chunks') {
      const { chunks, totalChunks } = e.data;
      let processedCount = 0;

      for (const chunk of chunks) {
        const processedChunk = processDataChunk(chunk);
        processedCount++;

        self.postMessage({
          type: 'chunk_complete',
          data: processedChunk,
          progress: Math.round((processedCount / totalChunks) * 100)
        });

        await cleanupMemory();
      }

      self.postMessage({ type: 'complete' });
    }

    if (type === 'merge_chunks') {
      const { existingChunks, newChunks } = e.data;
      
      // Fusionner directement tous les chunks en une seule passe
      const allChunks = [...existingChunks, ...newChunks];
      const finalMerged = mergeChunks(allChunks);
      
      self.postMessage({ 
        type: 'complete',
        data: finalMerged
      });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Gestionnaire d'erreurs global
self.onerror = (event: Event | string): boolean => {
  const errorMessage = event instanceof Event ? 
    (event as ErrorEvent).message : 
    event;
    
  self.postMessage({
    type: 'error',
    error: errorMessage
  });
  return true;
};