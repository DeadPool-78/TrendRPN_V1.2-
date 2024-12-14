import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DataPoint, Variable, DatasetStats } from '../types/data';

interface ChartStats {
  moyenne: string;
  mediane: string;
  ecartType: string;
  minimum: string;
  maximum: string;
  nombre: number;
}

interface ChartProps {
  data: DataPoint[];
  selectedVariables: Variable[];
  variableColors: string[];
  onTimeSelect: (time: string) => void;
  onZoom: (stats: Array<{ variable: string; stats: DatasetStats | null }>) => void;
}

interface ProcessedData {
  name: string;
  values: Array<{ date: Date; value: number; name: string }>;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  selectedVariables,
  variableColors,
  onTimeSelect,
  onZoom
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [chartStats, setChartStats] = useState<Record<string, ChartStats>>({});
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);

  // Mise à jour des dimensions lors du redimensionnement
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 400 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Traiter les données lorsque data ou selectedVariables changent
  useEffect(() => {
    const dataByName = new Map<string, DataPoint[]>();
    data.forEach((d: DataPoint) => {
      selectedVariables.forEach(v => {
        if (!dataByName.has(v.name)) {
          dataByName.set(v.name, []);
        }
        dataByName.get(v.name)?.push(d);
      });
    });

    const processed = selectedVariables.map(v => ({
      name: v.name,
      values: (dataByName.get(v.name) || []).map(d => ({
        date: new Date(d.timestamp),
        value: d[v.id] as number,
        name: v.name
      })).sort((a, b) => a.date.getTime() - b.date.getTime())
    }));

    setProcessedData(processed);
  }, [data, selectedVariables]);

  // Effet pour mettre à jour le graphique
  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const { width, height } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Nettoyer le SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Créer le conteneur SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Échelles
    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData[0].values, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(processedData, d => d3.min(d.values, v => v.value)) || 0,
        d3.max(processedData, d => d3.max(d.values, v => v.value)) || 0
      ])
      .range([innerHeight, 0]);

    // Axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(g => g.call(d3.axisBottom(xScale)));

    g.append("g")
      .attr("class", "y-axis")
      .call(g => g.call(d3.axisLeft(yScale)));

    // Ligne
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value));

    // Dessiner les lignes
    processedData.forEach((series, i) => {
      g.append("path")
        .datum(series.values)
        .attr("fill", "none")
        .attr("stroke", variableColors[i])
        .attr("stroke-width", 1.5)
        .attr("d", line);
    });

    // Ajouter le zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 20])
      .extent([[0, 0], [width, height]])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);
        
        g.select(".x-axis")
          .call(g => g.call(d3.axisBottom(newXScale)));
        g.select(".y-axis")
          .call(g => g.call(d3.axisLeft(newYScale)));
        
        g.selectAll("path")
          .attr("d", (d: any) => {
            return line.x(p => newXScale(p.date)).y(p => newYScale(p.value))(d.values);
          });

        // Calculer les statistiques pour la zone visible
        const xRange = newXScale.domain();
        const stats = processedData.map(series => {
          const visibleData = series.values.filter(
            v => v.date >= xRange[0] && v.date <= xRange[1]
          );
          return {
            variable: series.name,
            stats: visibleData.length > 0 ? {
              mean: d3.mean(visibleData, d => d.value) || 0,
              median: d3.median(visibleData, d => d.value) || 0,
              stdDev: d3.deviation(visibleData, d => d.value) || 0,
              min: d3.min(visibleData, d => d.value) || 0,
              max: d3.max(visibleData, d => d.value) || 0,
              count: visibleData.length
            } : null
          };
        });
        onZoom(stats);
      });

    svg.call(zoom as any);

    // Mettre à jour les statistiques
    const newStats = processedData.reduce((acc, series) => {
      const values = series.values.map(v => v.value);
      acc[series.name] = {
        moyenne: d3.mean(values)?.toFixed(2) || "N/A",
        mediane: d3.median(values)?.toFixed(2) || "N/A",
        ecartType: d3.deviation(values)?.toFixed(2) || "N/A",
        minimum: d3.min(values)?.toFixed(2) || "N/A",
        maximum: d3.max(values)?.toFixed(2) || "N/A",
        nombre: values.length
      };
      return acc;
    }, {} as Record<string, ChartStats>);

    setChartStats(newStats);
  }, [dimensions, processedData, variableColors, onZoom]);

  // Ajouter un gestionnaire de clic pour onTimeSelect
  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || processedData.length === 0) return;
    
    const { left, top } = svgRef.current.getBoundingClientRect();
    const x = event.clientX - left - 50; // 50 est la marge gauche
    
    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData[0].values, d => d.date) as [Date, Date])
      .range([0, dimensions.width - 70]); // 70 est la marge totale horizontale
    
    const date = xScale.invert(x);
    onTimeSelect(date.toISOString());
  };

  return (
    <div ref={containerRef} className="w-full">
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        onClick={handleClick}
      />
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(chartStats).map(([name, stats]) => (
          <div key={name} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">{name}</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">Moyenne: {stats.moyenne}</p>
              <p className="text-gray-600">Médiane: {stats.mediane}</p>
              <p className="text-gray-600">Écart-type: {stats.ecartType}</p>
              <p className="text-gray-600">Minimum: {stats.minimum}</p>
              <p className="text-gray-600">Maximum: {stats.maximum}</p>
              <p className="text-gray-600">Nombre de points: {stats.nombre}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-200">
        Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2
      </div>
    </div>
  );
};