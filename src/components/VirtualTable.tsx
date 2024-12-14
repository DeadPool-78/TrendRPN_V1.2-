import React, { useCallback, useRef, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { DataPoint } from '../types/data';

interface VirtualTableProps {
  data: DataPoint[];
  columns: Array<{
    key: string;
    header: string;
    width: number;
    render?: (value: any) => React.ReactNode;
  }>;
  rowHeight?: number;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({
  data,
  columns,
  rowHeight = 35
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const scrollDiv = document.createElement('div');
    scrollDiv.style.overflow = 'scroll';
    document.body.appendChild(scrollDiv);
    setScrollbarWidth(scrollDiv.offsetWidth - scrollDiv.clientWidth);
    document.body.removeChild(scrollDiv);
  }, []);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    return (
      <div 
        style={style} 
        className="flex items-center border-b border-gray-200 hover:bg-gray-50"
      >
        {columns.map(column => (
          <div 
            key={column.key}
            style={{ width: column.width }}
            className="px-3 py-2 truncate"
          >
            {column.render ? column.render(item[column.key]) : item[column.key]}
          </div>
        ))}
      </div>
    );
  }, [data, columns]);

  return (
    <div className="h-full flex flex-col">
      <div ref={headerRef} className="flex border-b border-gray-200 bg-gray-50">
        {columns.map(column => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {column.header}
          </div>
        ))}
        <div style={{ width: scrollbarWidth }} />
      </div>
      
      <div className="flex-1">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={data.length}
              itemSize={rowHeight}
              width={width}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};