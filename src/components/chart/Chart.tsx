import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Bug } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DataPoint, Variable } from '../../types/data';
import { calculateStats } from '../../utils/statistics';
import { ChartNavigator } from './ChartNavigator';
import { formatNumber } from '../../utils/formatters';
import { useChartDimensions } from './useChartDimensions';

interface ChartProps {
  data: DataPoint[];
  selectedVariables: Variable[];
  variableColors: string[];
  onZoomChange?: (zoomData: { 
    stats: Array<{ 
      variable: string; 
      stats: ReturnType<typeof calculateStats>; 
    }> | null;
    period?: { start: Date; end: Date };
  } | null) => void;
  onReferenceTimeSet?: (time: string) => void;
}

export const Chart: React.FC<ChartProps> = ({ 
  data, 
  selectedVariables, 
  variableColors, 
  onZoomChange,
  onReferenceTimeSet 
}) => {
  const { currentUser } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const dimensions = useChartDimensions();
  const [currentDomain, setCurrentDomain] = useState<[Date, Date] | null>(null);

  const processedData = useMemo(() => {
    return selectedVariables.map(variable => {
      const variableData = data
        .filter((d): d is DataPoint => {
          if (!d || typeof d.TS !== 'string' || typeof d.Name !== 'string' || d.Value === undefined) return false;
          return selectedVariables.some(v => v.name === d.Name);
        })
        .map((d): { date: Date; value: number; name: string } => {
          const value = typeof d.Value === 'string' ? parseFloat(d.Value.replace(',', '.')) : d.Value;
          const dateStr = typeof d.TS === 'string' ? d.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 ') : '';
          if (!dateStr) {
            throw new Error('Invalid date format in data');
          }
            
          return {
            date: new Date(dateStr),
            value,
            name: d.Name
          };
        })
        .filter((d) => !isNaN(d.value) && d.date instanceof Date && !isNaN(d.date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        name: variable.displayName,
        values: variableData
      };
    });
  }, [data, selectedVariables]);

  const initialDomain = useMemo(() => {
    if (!processedData.length) return null;
    const allDates = processedData.flatMap(series => series.values.map(v => v.date));
    return [
      d3.min(allDates) as Date,
      d3.max(allDates) as Date
    ] as [Date, Date];
  }, [processedData]);

  useEffect(() => {
    if (initialDomain && !currentDomain) {
      setCurrentDomain(initialDomain);
    }
  }, [initialDomain]);

  const updateChart = useCallback(() => {
    if (!svgRef.current || !processedData.length || !currentDomain) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    const xScale = d3.scaleTime()
      .range([0, dimensions.innerWidth])
      .domain(currentDomain);

    const allValues = processedData.flatMap(series => series.values.map(v => v.value));
    const yScale = d3.scaleLinear()
      .range([dimensions.innerHeight, 0])
      .domain([
        d3.min(allValues) as number,
        d3.max(allValues) as number
      ])
      .nice();

    const line = d3.line<{date: Date; value: number}>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveStepAfter);

    const chartGroup = g.append('g')
      .attr('clip-path', 'url(#clip)');

    svg.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', dimensions.innerWidth)
      .attr('height', dimensions.innerHeight);

    processedData.forEach((series, i) => {
      chartGroup.append('path')
        .datum(series.values)
        .attr('class', `line-${i}`)
        .attr('fill', 'none')
        .attr('stroke', variableColors[i])
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${dimensions.innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => d3.timeFormat('%d/%m/%y-%Hh')(d as Date)))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));

    const tooltip = d3.select(chartAreaRef.current)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none');

    const tooltipLine = chartGroup.append('line')
      .attr('class', 'tooltip-line')
      .attr('y1', 0)
      .attr('y2', dimensions.innerHeight)
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const mousemove = (event: any) => {
      const [mouseX] = d3.pointer(event);
      const date = xScale.invert(mouseX);

      const values = processedData.map((series, i) => {
        const bisect = d3.bisector((d: any) => d.date).left;
        const idx = bisect(series.values, date);
        const d0 = series.values[idx - 1];
        const d1 = series.values[idx];
        if (!d0 || !d1) return null;
        const d = date.getTime() - d0.date.getTime() > d1.date.getTime() - date.getTime() ? d1 : d0;
        return {
          name: series.name,
          value: d.value,
          color: variableColors[i]
        };
      }).filter(Boolean);

      if (values.length) {
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="text-xs font-medium mb-1">${date.toLocaleString()}</div>
            ${values.map(v => v ? `
              <div style="color:${v.color}" class="text-xs">
                ${v.name}: ${formatNumber(v.value)}
              </div>
            ` : '').join('')}
          `);

        tooltipLine
          .attr('x1', mouseX)
          .attr('x2', mouseX)
          .style('opacity', 1);
      }
    };

    const mouseout = () => {
      tooltip.style('opacity', 0);
      tooltipLine.style('opacity', 0);
    };

    svg.on('mousemove', mousemove)
       .on('mouseout', mouseout)
       .on('dblclick', (event) => {
         if (onReferenceTimeSet) {
           const [mouseX] = d3.pointer(event);
           const date = xScale.invert(mouseX);
           onReferenceTimeSet(date.toLocaleString('fr-FR'));
         }
       });

    return () => {
      tooltip.remove();
    };
  }, [processedData, variableColors, currentDomain, dimensions, onReferenceTimeSet]);

  useEffect(() => {
    const cleanup = updateChart();
    return () => {
      cleanup?.();
    };
  }, [updateChart]);

  const handleNavigatorBrush = useCallback((domain: [Date, Date] | null) => {
    if (!domain) return;
    
    setCurrentDomain(domain);
    
    if (onZoomChange) {
      const stats = selectedVariables.map(variable => ({
        variable: variable.displayName,
        stats: calculateStats(
          data.filter((d): d is DataPoint => {
            if (!d || typeof d.TS !== 'string' || typeof d.Name !== 'string') return false;
            const date = new Date(d.TS.replace(/(\d{2})\/(\d{2})\/(\d{4})\s/, '$3-$2-$1 '));
            return date >= domain[0] && date <= domain[1];
          }),
          variable.name
        )
      }));

      onZoomChange({
        stats,
        period: { start: domain[0], end: domain[1] }
      });
    }
  }, [data, selectedVariables, onZoomChange]);

  return (
    <div ref={chartAreaRef} className="bg-white p-4 rounded-lg shadow overflow-hidden relative">
      <svg 
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="mt-4"
      />

      <div className="mt-4" style={{ height: '100px' }}>
        {processedData.length > 0 && initialDomain && (
          <ChartNavigator
            data={processedData}
            width={dimensions.width}
            height={100}
            onBrushChange={handleNavigatorBrush}
            colors={variableColors}
            currentDomain={currentDomain}
            initialDomain={initialDomain}
          />
        )}
      </div>

      <button
        onClick={() => {
          setCurrentDomain(initialDomain);
          if (onZoomChange) onZoomChange(null);
        }}
        className="absolute top-4 right-4 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
      >
        Reset Zoom
      </button>

      {currentUser?.role === 'admin' && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors z-50"
          title={showDebug ? "Hide Debug Info" : "Show Debug Info"}
        >
          <Bug className="w-5 h-5" />
        </button>
      )}

      <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-200">
        Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2
      </div>
    </div>
  );
};