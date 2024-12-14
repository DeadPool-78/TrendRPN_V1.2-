import { useMemo } from 'react';

interface ChartDimensions {
  margin: { top: number; right: number; bottom: number; left: number };
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}

export const useChartDimensions = (
  containerWidth: number = 1200,
  containerHeight: number = 600
): ChartDimensions => {
  return useMemo(() => {
    const margin = { top: 20, right: 120, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    return {
      margin,
      width: containerWidth,
      height: containerHeight,
      innerWidth: width,
      innerHeight: height
    };
  }, [containerWidth, containerHeight]);
};