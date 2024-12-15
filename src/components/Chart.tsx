import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DataPoint, Variable, DatasetStats } from '../types/data';

interface ChartProps {
  data: DataPoint[];
  selectedVariables: Variable[];
  variableColors: string[];
  onZoom: (stats: Array<{ variable: string; stats: DatasetStats | null }>) => void;
}

interface ProcessedData {
  name: string;
  values: Array<{ date: Date; value: number; name: string }>;
}

interface ChartStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

const calculateStats = (values: number[]): ChartStats => {
  return {
    mean: d3.mean(values) || 0,
    median: d3.median(values) || 0,
    stdDev: d3.deviation(values) || 0,
    min: d3.min(values) || 0,
    max: d3.max(values) || 0,
    count: values.length
  };
};

export const Chart: React.FC<ChartProps> = ({
  data,
  selectedVariables,
  variableColors,
  onZoom
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [currentZoomState, setCurrentZoomState] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomRef = useRef<any>(null);
  const mainChartRef = useRef<any>(null);

  useEffect(() => {
    if (!data.length || !selectedVariables.length || !svgRef.current) return;

    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none")
      .style("z-index", "9999");

    const processed: ProcessedData[] = selectedVariables.map(variable => {
      const values = data
        .filter(d => d.Name === variable.name && d.TextAttr03 === variable.textAttr03)
        .map(d => {
          const timestamp = Math.floor(parseInt(d.Chrono) / 1000000);
          const date = new Date(timestamp);
          return {
            date,
            value: typeof d.Value === 'number' ? d.Value : 0,
            name: variable.name
          };
        })
        .filter(d => !isNaN(d.date.getTime()) && !isNaN(d.value))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        name: variable.name,
        values
      };
    }).filter(series => series.values.length > 0);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.parentElement?.clientWidth || 800;
    const baseHeight = 400;
    const totalHeight = baseHeight + 100;

    svg
      .attr("width", width)
      .attr("height", totalHeight)
      .style("width", "100%")
      .style("height", totalHeight + "px");

    const margin = { top: 20, right: 50, bottom: 100, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = baseHeight - margin.top - margin.bottom;

    const allDates = processed.flatMap(d => d.values.map(v => v.date));
    const allValues = processed.flatMap(d => d.values.map(v => v.value));

    const xScale = d3.scaleTime()
      .domain([
        d3.min(allDates) || new Date(),
        d3.max(allDates) || new Date()
      ])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(allValues) || 0,
        d3.max(allValues) || 1
      ])
      .range([innerHeight, 0]);

    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveStepAfter)
      .defined(d => !isNaN(d.value) && !isNaN(d.date.getTime()));

    const mainChart = svg.append("g")
      .attr("class", "main-chart")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    mainChartRef.current = mainChart;

    mainChart.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    mainChart.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    processed.forEach((series, i) => {
      if (series.values.length === 0) return;

      mainChart.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", variableColors[i])
        .attr("stroke-width", 1.5)
        .attr("d", line);

      mainChart.selectAll(`.dot-${i}`)
        .data(series.values)
        .enter()
        .append("circle")
        .attr("class", `dot-${i}`)
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.value))
        .attr("r", 3)
        .attr("fill", variableColors[i])
        .on("mouseover", (event: MouseEvent, d: any) => {
          const [x, y] = d3.pointer(event, svg.node());
          tooltip
            .style("visibility", "visible")
            .html(`
              <strong>${d.name}</strong><br/>
              Date: ${d.date.toLocaleString()}<br/>
              Valeur: ${d.value.toFixed(3)}
            `)
            .style("left", (x + 10) + "px")
            .style("top", (y - 10) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("visibility", "hidden");
        });
    });

    const navHeight = 50;
    const navChart = svg.append("g")
      .attr("class", "nav-chart")
      .attr("transform", `translate(${margin.left},${baseHeight + 10})`);

    const navXScale = xScale.copy();
    const navYScale = d3.scaleLinear()
      .domain(yScale.domain())
      .range([navHeight, 0]);

    const navLine = d3.line<{ date: Date; value: number }>()
      .x(d => navXScale(d.date))
      .y(d => navYScale(d.value))
      .curve(d3.curveStepAfter);

    processed.forEach((series, i) => {
      navChart.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", variableColors[i])
        .attr("stroke-width", 1)
        .attr("d", navLine);
    });

    const zoom = d3.zoom<SVGGElement, unknown>()
      .scaleExtent([1, 20])
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on("zoom", (event) => {
        if (!event.sourceEvent) return; // Ignorer les événements programmés

        const transform = event.transform;
        setCurrentZoomState(transform);

        const newXScale = transform.rescaleX(xScale);
        
        // Mettre à jour l'axe X
        mainChart.select(".x-axis").call(d3.axisBottom(newXScale) as any);

        // Mettre à jour les lignes
        mainChart.selectAll("path")
          .attr("d", (d: any) => {
            if (!Array.isArray(d)) return "";
            return line.x(p => newXScale(p.date))
                      .y(p => yScale(p.value))(d);
          });

        // Mettre à jour les points
        mainChart.selectAll("circle")
          .attr("cx", (d: any) => newXScale(d.date));

        // Synchroniser avec la brosse
        if (event.sourceEvent && event.sourceEvent.type !== "brush") {
          const range = newXScale.domain();
          const [start, end] = range.map(navXScale);
          navChart.select(".brush").call(brush.move as any, [start, end]);
        }

        // Calculer les statistiques
        const xRange = newXScale.domain();
        const stats = processed.map(series => {
          const visibleData = series.values.filter(
            v => v.date >= xRange[0] && v.date <= xRange[1]
          );
          return {
            variable: series.name,
            stats: visibleData.length ? calculateStats(visibleData.map(v => v.value)) : null
          };
        });
        onZoom(stats);
      });

    zoomRef.current = zoom;

    const brush = d3.brushX()
      .extent([[0, 0], [innerWidth, navHeight]])
      .on("brush", (event) => {
        if (!event.sourceEvent || event.sourceEvent.type === "zoom") return;

        const selection = event.selection as [number, number] | null;
        if (!selection) return;

        const [x0, x1] = selection.map(navXScale.invert);
        const transform = d3.zoomIdentity
          .scale(innerWidth / (x1.getTime() - x0.getTime()))
          .translate(-navXScale(x0), 0);

        mainChart.call(zoom.transform as any, transform);
      });

    // Appliquer le zoom au graphique principal
    mainChart.call(zoom as any);

    // Restaurer l'état du zoom précédent
    if (currentZoomState && currentZoomState !== d3.zoomIdentity) {
      mainChart.transition().duration(0).call(zoom.transform as any, currentZoomState);
    }

    // Nettoyer lors du démontage
    return () => {
      zoomRef.current = null;
      mainChartRef.current = null;
    };

  }, [data, selectedVariables, variableColors]);

  // Effet pour restaurer le zoom lors des mises à jour
  useEffect(() => {
    if (mainChartRef.current && zoomRef.current && currentZoomState !== d3.zoomIdentity) {
      mainChartRef.current
        .transition()
        .duration(0)
        .call(zoomRef.current.transform as any, currentZoomState);
    }
  }, [currentZoomState]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      <div ref={tooltipRef} />
    </div>
  );
};