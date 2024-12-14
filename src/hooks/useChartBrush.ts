import { useCallback, useRef, MutableRefObject } from 'react';
import * as d3 from 'd3';

interface BrushConfig {
  chartWidth: number;
  chartHeight: number;
  xScale: () => d3.ScaleTime<number, number>;
  initialDomain: [Date, Date];
  onBrushChange: (domain: [Date, Date] | null) => void;
}

export const useChartBrush = ({
  chartWidth,
  chartHeight,
  xScale,
  initialDomain,
  onBrushChange
}: BrushConfig) => {
  const brushRef = useRef<any>(null);

  const createBrush = useCallback(() => {
    const brush = d3.brushX()
      .extent([[0, 0], [chartWidth, chartHeight]])
      .on('end', (event) => {
        if (!event.selection) {
          onBrushChange(initialDomain);
          return;
        }
        const [x0, x1] = event.selection as [number, number];
        onBrushChange([
          xScale().invert(x0),
          xScale().invert(x1)
        ]);
      });

    brushRef.current = brush;
    return brush;
  }, [chartWidth, chartHeight, xScale, initialDomain, onBrushChange]);

  const updateBrushPosition = useCallback((
    selection: d3.Selection<SVGGElement, unknown, null, undefined>,
    domain: [Date, Date]
  ) => {
    if (!brushRef.current) return;
    
    const brushPositions = [
      xScale()(domain[0]),
      xScale()(domain[1])
    ];
    
    selection.call(brushRef.current.move, brushPositions);
  }, [xScale]);

  return {
    createBrush,
    updateBrushPosition,
    brushRef
  };
};