export const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

export const calculateDuration = (startDate: string, endDate: string): string => {
  try {
    // Parse dates correctly from French format
    const start = new Date(startDate.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
    const end = new Date(endDate.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // If duration is less than 24 hours, show only hours
    if (diffHours < 24) {
      return `${diffHours.toFixed(1)}h`;
    }
    
    // If duration is more than 24 hours but less than 48, show hours
    if (diffHours < 48) {
      return `${diffHours.toFixed(1)}h`;
    }
    
    // If duration is more than 48 hours, show days and hours
    const days = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `${days}j ${remainingHours.toFixed(1)}h`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 'Durée invalide';
  }
};

export const formatNumber = (num: number): string => {
  const absNum = Math.abs(num);
  
  // Si le nombre est très petit ou très grand, utiliser la notation scientifique
  if (absNum < 0.001 || absNum >= 10000) {
    return num.toExponential(3);
  }
  
  // Sinon utiliser la notation décimale standard
  return num.toFixed(3);
};

export const parseTimestamp = (timestamp: string): Date => {
  // Handle different date formats
  if (timestamp.includes('/')) {
    // French format: DD/MM/YYYY HH:mm:ss
    return new Date(timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
  } else if (timestamp.length === 14) {
    // Format YYYYMMDDHHMMSS
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);
    const minute = timestamp.substring(10, 12);
    const second = timestamp.substring(12, 14);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  }
  return new Date(timestamp);
};