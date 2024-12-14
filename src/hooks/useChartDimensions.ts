import { useEffect, useState, useCallback } from 'react';

interface Dimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  boundedWidth: number;
  boundedHeight: number;
  innerWidth: number;  // Alias for boundedWidth
  innerHeight: number; // Alias for boundedHeight
}

const defaultMargin = {
  top: 40,
  right: 30,
  bottom: 40,
  left: 60,
};

export const useChartDimensions = (containerRef: React.RefObject<HTMLElement>) => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
    margin: defaultMargin,
    boundedWidth: 0,
    boundedHeight: 0,
    innerWidth: 0,
    innerHeight: 0,
  });

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      const boundedWidth = Math.max(width - defaultMargin.left - defaultMargin.right, 0);
      const boundedHeight = Math.max(height - defaultMargin.top - defaultMargin.bottom, 0);

      setDimensions({
        width,
        height,
        margin: defaultMargin,
        boundedWidth,
        boundedHeight,
        innerWidth: boundedWidth,  // Alias for boundedWidth
        innerHeight: boundedHeight, // Alias for boundedHeight
      });
    }
  }, [containerRef]);

  useEffect(() => {
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, updateDimensions]);

  return dimensions;
};
