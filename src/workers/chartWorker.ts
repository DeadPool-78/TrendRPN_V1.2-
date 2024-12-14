const calculateStats = (values: number[]) => {
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

let currentRequestId: string | null = null;

// Fonction pour vérifier si une requête est annulée
const isRequestCancelled = (requestId: string) => {
  if (currentRequestId !== requestId) {
    self.postMessage({ 
      type: 'error',
      error: 'Calcul annulé : nouvelle requête reçue',
      requestId: currentRequestId
    });
    return true;
  }
  return false;
};

self.onmessage = (e: MessageEvent) => {
  const { type, data, domain, requestId } = e.data;

  // Si une nouvelle requête arrive, annuler la précédente
  if (currentRequestId && currentRequestId !== requestId) {
    self.postMessage({ 
      type: 'error',
      error: 'Calcul annulé : nouvelle requête reçue',
      requestId: currentRequestId
    });
    return;
  }

  currentRequestId = requestId;

  try {
    if (type === 'calculateZoomStats') {
      const [start, end] = domain;
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();

      // Group data by variable name
      const valuesByVariable = new Map<string, number[]>();
      const totalPoints = data.length;
      let processedPoints = 0;
      
      for (const point of data) {
        // Vérifier si la requête a été annulée
        if (isRequestCancelled(requestId)) {
          return;
        }

        const date = new Date(point.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
        if (date.getTime() >= startTime && date.getTime() <= endTime) {
          const value = typeof point.Value === 'string' ? parseFloat(point.Value.replace(',', '.')) : point.Value;
          if (!isNaN(value)) {
            const values = valuesByVariable.get(point.Name) || [];
            values.push(value);
            valuesByVariable.set(point.Name, values);
          }
        }

        processedPoints++;
        if (processedPoints % 1000 === 0) {
          // Vérifier si la requête a été annulée avant d'envoyer la progression
          if (isRequestCancelled(requestId)) {
            return;
          }
          self.postMessage({
            type: 'progress',
            progress: Math.round((processedPoints / totalPoints) * 100),
            requestId
          });
        }
      }

      // Vérifier une dernière fois si la requête est toujours valide
      if (isRequestCancelled(requestId)) {
        return;
      }

      const stats = Array.from(valuesByVariable.entries()).map(([variable, values]) => ({
        variable,
        stats: calculateStats(values)
      }));

      self.postMessage({ 
        type: 'zoomStats', 
        stats,
        requestId 
      });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      requestId
    });
  } finally {
    if (currentRequestId === requestId) {
      currentRequestId = null;
    }
  }
};