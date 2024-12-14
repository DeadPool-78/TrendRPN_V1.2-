import React from 'react';
import { formatNumber } from '../../utils/formatters';

interface TooltipProps {
  date: Date;
  values: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const ChartTooltip: React.FC<TooltipProps> = ({ date, values }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 pointer-events-none">
    <div className="text-xs font-medium mb-1">{date.toLocaleString()}</div>
    {values.map((v, i) => (
      <div key={i} style={{ color: v.color }} className="text-xs">
        {v.name}: {formatNumber(v.value)}
      </div>
    ))}
  </div>
);