import React from 'react';

interface ChartControlsProps {
  xDomain: [Date, Date];
  yDomain: [number, number];
  onXDomainChange: (domain: [Date, Date]) => void;
  onYDomainChange: (domain: [number, number]) => void;
  currentZoom?: { x: [Date, Date]; y: [number, number] } | null;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  xDomain,
  yDomain,
  onXDomainChange,
  onYDomainChange,
  currentZoom
}) => {
  return (
    <div className="flex space-x-4 p-2 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600">
        Utilisez le navigateur de zoom en bas du graphique pour ajuster la plage temporelle
      </div>
    </div>
  );
};