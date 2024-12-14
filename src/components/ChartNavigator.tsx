import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface ChartNavigatorProps {
  data: Array<{
    name: string;
    values: Array<{ date: Date; value: number }>;
  }>;
  width: number;
  height: number;
  onBrushChange: (domain: [Date, Date] | null) => void;
  colors: string[];
  currentDomain?: [Date, Date] | null;
}

export const ChartNavigator: React.FC<ChartNavigatorProps> = ({
  data,
  width,
  height,
  onBrushChange,
  colors,
  currentDomain
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const brushRef = useRef<any>(null);
  const margin = { top: 2, right: 2, bottom: 20, left: 2 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const updateBrush = useCallback(() => {
    if (!brushRef.current || !currentDomain || !svgRef.current || !data.length) return;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data[0].values.map(v => v.date)) as [Date, Date])
      .range([0, chartWidth]);

    const selection = [
      xScale(currentDomain[0]),
      xScale(currentDomain[1])
    ];

    d3.select(svgRef.current)
      .select('.brush')
      .call(brushRef.current.move, selection);
  }, [currentDomain, data, chartWidth]);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const allDates = data[0].values.map(v => v.date);
    const allValues = data.flatMap(series => series.values.map(v => v.value));
    
    const xScale = d3.scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
      .range([chartHeight, 0]);

    // Create step line generator
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveStepAfter);

    // Add lines
    data.forEach((series, i) => {
      g.append('path')
        .datum(series.values)
        .attr('fill', 'none')
        .attr('stroke', colors[i] || '#999')
        .attr('stroke-width', 1)
        .attr('d', line);
    });

    // Add brush
    brushRef.current = d3.brushX()
      .extent([[0, 0], [chartWidth, chartHeight]])
      .on('brush end', (event) => {
        if (event.selection) {
          const [x0, x1] = event.selection as [number, number];
          onBrushChange([
            xScale.invert(x0),
            xScale.invert(x1)
          ]);
        } else {
          onBrushChange(null);
        }
      });

    g.append('g')
      .attr('class', 'brush')
      .call(brushRef.current);

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(5));

    // Update brush if there's a current domain
    if (currentDomain) {
      updateBrush();
    }

  }, [width, height, data, colors, onBrushChange, updateBrush, chartWidth, chartHeight, currentDomain]);

  return (
    <svg 
      ref={svgRef}
      className="w-full h-full"
    />
  );
};