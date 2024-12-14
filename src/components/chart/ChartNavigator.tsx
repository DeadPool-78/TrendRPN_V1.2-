import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { useChartBrush } from '../../hooks/useChartBrush';

interface ChartNavigatorProps {
  data: Array<{
    name: string;
    values: Array<{ date: Date; value: number }>;
  }>;
  width: number;
  height: number;
  onBrushChange: (domain: [Date, Date] | null) => void;
  colors: string[];
  currentDomain: [Date, Date] | null;
  initialDomain: [Date, Date];
}

export const ChartNavigator: React.FC<ChartNavigatorProps> = ({
  data,
  width,
  height,
  onBrushChange,
  colors,
  currentDomain,
  initialDomain
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = useMemo(() => ({ top: 2, right: 2, bottom: 20, left: 2 }), []);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => 
    d3.scaleTime()
      .domain(initialDomain)
      .range([0, chartWidth]), 
    [initialDomain, chartWidth]
  );

  const yScale = useMemo(() => {
    const allValues = data.flatMap(series => series.values.map(v => v.value));
    return d3.scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
      .range([chartHeight, 0]);
  }, [data, chartHeight]);

  const line = useMemo(() => 
    d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveStepAfter),
    [xScale, yScale]
  );

  const { createBrush, updateBrushPosition } = useChartBrush({
    chartWidth,
    chartHeight,
    xScale: () => xScale,
    initialDomain,
    onBrushChange
  });

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add lines
    data.forEach((series, i) => {
      g.append('path')
        .datum(series.values)
        .attr('fill', 'none')
        .attr('stroke', colors[i])
        .attr('stroke-width', 1)
        .attr('d', line);
    });

    // Add brush
    const brushGroup = g.append('g').attr('class', 'brush');
    const brush = createBrush();
    if (brush) {
      brushGroup.call(brush);
      if (currentDomain) {
        updateBrushPosition(brushGroup, currentDomain);
      }
    }

    return () => {
      svg.selectAll('*').remove();
    };
  }, [
    data,
    width,
    height,
    colors,
    line,
    createBrush,
    updateBrushPosition,
    currentDomain,
    margin
  ]);

  return (
    <svg 
      ref={svgRef}
      className="bg-white rounded-lg shadow"
    />
  );
};