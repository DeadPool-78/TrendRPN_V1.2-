import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  Chrono: string;
  Name: string;
  Value: number;
  Quality: number;
  TextAttr03: string;
  TS: string;
}

interface ProcessedDataPoint {
  date: Date;
  value: number;
}

interface SeriesData {
  name: string;
  values: ProcessedDataPoint[];
}

interface Variable {
  id: string;
  name: string;
  textAttr03: string;
  displayName: string;
  selected: boolean;
}

interface DatasetStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

interface ChartProps {
  data: DataPoint[];
  selectedVariables: Variable[];
  variableColors: string[];
  onZoom: (stats: Array<{ variable: string; stats: DatasetStats | null }>) => void;
  onOscilloClick?: (timestamp: number) => void;
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
  onZoom,
  onOscilloClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentDomain, setCurrentDomain] = useState<[Date, Date] | null>(null);

  useEffect(() => {
    if (!data.length || !selectedVariables.length || !svgRef.current) return;

    // Configuration des dimensions
    const width = svgRef.current.parentElement?.clientWidth || 800;
    const mainHeight = 400;
    const navHeight = 100;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 }; // Augmentation de la marge du bas
    const totalHeight = mainHeight + navHeight + margin.top + margin.bottom + 20; // Ajout d'espace entre les graphiques

    // Nettoyage et configuration du SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("width", width)
      .attr("height", totalHeight)
      .style("width", "100%")
      .style("height", totalHeight + "px");

    // Dimensions internes
    const innerWidth = width - margin.left - margin.right;
    const mainInnerHeight = mainHeight - margin.top - margin.bottom;

    // Traitement des données avec la structure correcte
    const processed: SeriesData[] = selectedVariables.map(variable => ({
      name: variable.name,
      values: data
        .filter(d => d.Name === variable.name && d.TextAttr03 === variable.textAttr03)
        .map(d => {
          // Conversion correcte de la date
          const timestamp = Number(d.Chrono) / 10000;
          const date = new Date(timestamp);
          const value = Number(d.Value);
          
          // Vérification des valeurs invalides
          if (isNaN(date.getTime()) || isNaN(value)) {
            console.warn('Valeur invalide détectée:', { date, value, originalData: d });
            return null;
          }
          
          return { date, value };
        })
        .filter((d): d is ProcessedDataPoint => d !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
    }));

    // Vérifier qu'il y a des données valides
    if (processed.some(series => series.values.length === 0)) {
      console.warn('Certaines séries sont vides');
      return;
    }

    // Vérification des échelles
    const allDates = processed.flatMap(d => d.values.map(v => v.date));
    const allValues = processed.flatMap(d => d.values.map(v => v.value));
    
    if (allDates.length === 0 || allValues.length === 0) {
      console.warn('Pas de données à afficher');
      return;
    }

    const extent = d3.extent(allDates) as [Date, Date];
    const valueExtent = d3.extent(allValues) as [number, number];
    
    // Vérification supplémentaire des domaines
    if (!extent[0] || !extent[1] || !valueExtent[0] || !valueExtent[1]) {
      console.warn('Domaines invalides:', { extent, valueExtent });
      return;
    }

    const xScale = d3.scaleTime()
      .domain(currentDomain || extent)
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(valueExtent)
      .range([mainInnerHeight, 0]);

    // Format de date pour l'axe X
    const timeFormat = d3.timeFormat("%d/%m/%y %H:%M");

    // Axes
    const mainChart = svg.append("g")
      .attr("class", "main-chart")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxis = mainChart.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${mainInnerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d: any) => timeFormat(d)));

    // Rotation des labels de l'axe X pour une meilleure lisibilité
    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    const yAxis = mainChart.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    // Création du tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("padding", "10px")
      .style("pointer-events", "none");

    let tooltipDebounceTimeout: number | null = null;

    // Overlay pour la gestion des événements de souris
    const overlay = mainChart.append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", mainInnerHeight)
      .style("fill", "none")
      .style("pointer-events", "all");

    // Ligne verticale pour le tooltip
    const tooltipLine = mainChart.append("line")
      .attr("class", "tooltip-line")
      .style("stroke", "#999")
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0);

    // Fonction pour mettre à jour le tooltip
    const updateTooltip = (event: MouseEvent) => {
      if (tooltipDebounceTimeout) {
        window.clearTimeout(tooltipDebounceTimeout);
      }

      tooltipDebounceTimeout = window.setTimeout(() => {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        
        // Trouver les points les plus proches pour chaque série
        const tooltipContent = processed.map((series, i) => {
          const bisect = d3.bisector((d: ProcessedDataPoint) => d.date).left;
          const index = bisect(series.values, x0, 1);
          if (index === 0) return null;
          
          const d0 = series.values[index - 1];
          const d1 = series.values[index];
          if (!d0 || !d1) return null;
          
          const point = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
          return `<div style="color:${variableColors[i]}">${series.name}: ${point.value.toFixed(3)}</div>`;
        }).filter(Boolean).join('');

        if (tooltipContent) {
          tooltip
            .style("opacity", 1)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .html(`<div style="font-weight:bold">${timeFormat(x0)}</div>${tooltipContent}`);
        }
      }, 50); // Délai réduit pour plus de réactivité
    };

    // Gestionnaires d'événements pour l'overlay
    overlay
      .on("mousemove", updateTooltip)
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .on("dblclick", (event: MouseEvent) => {
        if (!onOscilloClick) return;
        const [x] = d3.pointer(event);
        const date = xScale.invert(x);
        // Trouver le point le plus proche
        const point = data.find(d => {
          const pointDate = new Date(d.TS);
          return Math.abs(pointDate.getTime() - date.getTime()) < 1000;
        });
        if (point) {
          onOscilloClick(Number(point.Chrono));
        }
      });

    // Fonction de ligne avec vérification des valeurs
    const line = d3.line<ProcessedDataPoint>()
      .defined(d => !isNaN(d.value) && !isNaN(d.date.getTime())) // Ignorer les valeurs invalides
      .x(d => {
        const x = xScale(d.date);
        return isNaN(x) ? 0 : x;
      })
      .y(d => {
        const y = yScale(d.value);
        return isNaN(y) ? 0 : y;
      })
      .curve(d3.curveStepAfter);

    // Dessiner les lignes avec le typage correct
    processed.forEach((series, i) => {
      mainChart.append("path")
        .datum(series.values)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", variableColors[i])
        .attr("stroke-width", 1.5)
        .attr("d", line);
    });

    // Gestion du tooltip sur les lignes
    mainChart.selectAll(".line")
      .on("mouseover", function(event, d) {
        if (tooltipDebounceTimeout) {
          window.clearTimeout(tooltipDebounceTimeout);
        }
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function(event, d) {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        
        // Trouver le point le plus proche
        const bisect = d3.bisector((d: ProcessedDataPoint) => d.date).left;
        const series = d3.select(this).datum() as ProcessedDataPoint[];
        const index = bisect(series, x0, 1);
        const d0 = series[index - 1];
        const d1 = series[index];
        const point = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

        tooltip
          .html(`Date: ${timeFormat(point.date)}<br/>Valeur: ${point.value.toFixed(3)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        if (tooltipDebounceTimeout) {
          window.clearTimeout(tooltipDebounceTimeout);
        }
        tooltip.style("opacity", 0);
      });

    // Ligne de navigation avec style en escalier
    const navChart = svg.append("g")
      .attr("class", "nav-chart")
      .attr("transform", `translate(${margin.left},${mainHeight + margin.top})`);

    // Style du navigateur de zoom
    const navBackground = navChart.append("rect")
      .attr("class", "nav-background")
      .attr("width", innerWidth)
      .attr("height", navHeight)
      .attr("fill", "#f5f5f5")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    // Ajout d'un titre pour le navigateur
    navChart.append("text")
      .attr("class", "nav-title")
      .attr("x", -40)
      .attr("y", navHeight / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .text("Zoom");

    processed.forEach((series, i) => {
      navChart.append("path")
        .datum(series.values)
        .attr("class", "nav-line")
        .attr("fill", "none")
        .attr("stroke", variableColors[i])
        .attr("stroke-width", 1)
        .attr("d", d3.line<ProcessedDataPoint>()
          .x(d => d3.scaleTime().domain(extent).range([0, innerWidth])(d.date))
          .y(d => d3.scaleLinear()
            .domain(yScale.domain())
            .range([navHeight, 0])(d.value))
          .curve(d3.curveStepAfter));  // Ajout du style en escalier
    });

    // Configuration de la brosse avec debounce
    let brushTimeout: number | null = null;
    const brush = d3.brushX()
      .extent([[0, 0], [innerWidth, navHeight]])
      .on("brush end", (event) => {
        if (!event.sourceEvent) return;

        const selection = event.selection as [number, number] | null;
        if (!selection) return;

        // Annuler le timeout précédent
        if (brushTimeout) {
          window.clearTimeout(brushTimeout);
        }

        // Créer un nouveau timeout
        brushTimeout = window.setTimeout(() => {
          const navXScale = d3.scaleTime().domain(extent).range([0, innerWidth]);
          const [x0, x1] = selection.map(navXScale.invert);
          setCurrentDomain([x0, x1]);

          // Mise à jour des statistiques avec un léger délai
          const zoomedData = processed.map(series => {
            const filteredValues = series.values
              .filter(d => d.date >= x0 && d.date <= x1)
              .map(d => d.value);
            return {
              variable: series.name,
              stats: filteredValues.length > 0 ? calculateStats(filteredValues) : null
            };
          });

          onZoom(zoomedData);
        }, 100); // Délai de 100ms
      });

    // Ajout de la brosse au navigateur
    const brushGroup = navChart.append("g")
      .attr("class", "brush")
      .call(brush);

    // Initialiser la brosse avec la plage complète si pas de domaine courant
    if (!currentDomain) {
      brushGroup.call(brush.move as any, [0, innerWidth]);
    } else {
      const navXScale = d3.scaleTime().domain(extent).range([0, innerWidth]);
      brushGroup.call(brush.move as any, currentDomain.map(navXScale));
    }

    return () => {
      brushGroup.call(brush.move as any, null);
      tooltip.remove();
    };

  }, [data, selectedVariables, variableColors, currentDomain, onOscilloClick]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};