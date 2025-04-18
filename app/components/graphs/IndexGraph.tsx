import React, { useMemo, useState, useRef, useEffect } from 'react';
import { LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { bisector } from 'd3-array';
import { useViewport } from '../../hooks/useViewport';

// Define the data point structure
interface DataPoint {
  x: Date;
  y: number;
}

// Define the props for our component
interface LineGraphProps {
  width?: number; // Make width optional
  height?: number; // Make height optional
  data: DataPoint[];
  margin?: { top: number; right: number; bottom: number; left: number };
  xAxisLabel?: string;
  yAxisLabel?: string;
  lineColor?: string;
  axisColor?: string;
}

// Helper function to get the data point from x coordinate
const bisectDate = bisector<DataPoint, Date>((d) => d.x).left;

const LineGraph: React.FC<LineGraphProps> = ({
  width: propWidth,
  height: propHeight,
  data,
  margin: propMargin,
  xAxisLabel = 'Date',
  yAxisLabel = 'Value',
  lineColor = '#3b82f6',
  axisColor = '#6b7280',
}) => {
  const { isMobile, isClient } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // State for container dimensions
  const [dimensions, setDimensions] = useState({
    width: propWidth || 500,
    height: propHeight || 300
  });

  // Responsive margins using Tailwind breakpoints
  const margin = useMemo(() => ({
    top: 40,
    right: 60,
    bottom: 60,
    left: propMargin?.left || (isClient && isMobile ? 40 : 60)
  }), [propMargin, isMobile, isClient]);

  // Define state for tooltip
  const [tooltipData, setTooltipData] = useState<DataPoint | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);
  const [tooltipTop, setTooltipTop] = useState<number | null>(null);

  // Calculate inner dimensions
  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  // Resize handler
  useEffect(() => {
    if (!propWidth || !propHeight) {
      const handleResize = () => {
        if (containerRef.current) {
          const { width } = containerRef.current.getBoundingClientRect();
          // Set height proportionally but with min/max constraints
          // Adjust these values based on your design needs
          const minHeight = 200;
          const maxHeight = 400;
          const aspectRatio = 0.5; // 2:1 aspect ratio

          const height = Math.max(minHeight, Math.min(maxHeight, width * aspectRatio));
          setDimensions({ width, height });
        }
      };

      handleResize(); // Set initial size

      // Use ResizeObserver for more accurate resizing if supported
      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      } else {
        // Fallback to window resize
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }
    // If props are provided, use those dimensions
    else {
      setDimensions({
        width: propWidth,
        height: propHeight
      });
    }
  }, [propWidth, propHeight, containerRef.current]);

  // Define scales
  const xScale = useMemo(
    () =>
      scaleTime<number>({
        domain: [Math.min(...data.map((d) => d.x.getTime())), Math.max(...data.map((d) => d.x.getTime()))],
        range: [0, innerWidth],
      }),
    [data, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(...data.map((d) => d.y)) * 1.1], // Add 10% padding at the top
        range: [innerHeight, 0],
        nice: true,
      }),
    [data, innerHeight]
  );

  // Modify handle mouse move to better handle tooltip positioning
  const handleMouseMove = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    const isTouchEvent = 'touches' in event;
    const svgRect = svgRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    const clientX = isTouchEvent ? event.touches[0].clientX : event.clientX;

    const svgX = clientX - svgRect.left - margin.left;
    const x0 = xScale.invert(svgX);
    const index = bisectDate(data, x0, 1);

    if (index <= 0 || index >= data.length) return;

    const d0 = data[index - 1];
    const d1 = data[index];
    const point = x0.getTime() - d0.x.getTime() > d1.x.getTime() - x0.getTime() ? d1 : d0;

    setTooltipData(point);
    setTooltipLeft(xScale(point.x) + margin.left);
    setTooltipTop(yScale(point.y) + margin.top);
  };

  // Hide tooltip when touch/mouse leaves
  const handleMouseLeave = () => {
    setTooltipData(null);
    setTooltipLeft(null);
    setTooltipTop(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-auto max-w-full rounded-lg  p-4 "
    >
      {isClient && (
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="block max-w-full transition-all duration-200 ease-in-out"
        >
          <Group left={margin.left} top={margin.top}>
            {/* Y Axis */}
            <AxisLeft
              scale={yScale}
              stroke={axisColor}
              tickStroke={axisColor}
              label={yAxisLabel}
              numTicks={isMobile ? 5 : 8}

              labelProps={{
                fill: axisColor,
                textAnchor: 'middle',
                fontSize: 'sm:12 text-10',
                fontFamily: 'Poppins',
                className: 'text-xs sm:text-sm'
              }}
              strokeWidth={1.5}
              tickLabelProps={() => ({
                fill: axisColor,
                className: 'text-[8px] sm:text-[12px]',
                textAnchor: 'end',
                dx: '-0.5em',
                dy: '0.3em'
              })}
            />

            {/* X Axis */}
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              stroke={axisColor}
              tickStroke={axisColor}
              label={xAxisLabel}
              numTicks={isMobile ? 4 : 6}
              labelOffset={20}
              labelProps={{
                fill: axisColor,
                textAnchor: 'middle',
                className: 'text-xs sm:text-sm font-poppins',
                fontFamily: 'Poppins',
              }}
              tickLabelProps={() => ({
                fill: axisColor,
                className: 'text-[8px] sm:text-[12px]',
                textAnchor: 'middle',
                dy: '0.33em'
              })}
              strokeWidth={1.5}
              tickLength={isMobile ? 4 : 6}
            />

            {/* Line path with updated styling */}
            <LinePath
              data={data}
              x={(d) => xScale(d.x)}
              y={(d) => yScale(d.y)}
              stroke={lineColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              curve={curveMonotoneX}
              className="transition-all duration-300 ease-in-out"
            />

            {/* Data points with updated styling */}
            {data.map((point, i) => (
              <circle
                key={`point-${i}`}
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                className="r-3 sm:r-4 transition-all duration-200 ease-in-out cursor-pointer hover:r-5"
                fill={lineColor}
                fillOpacity={tooltipData === point ? 1 : 0.8}
                stroke="bg-accentPrimary"
                strokeWidth={tooltipData === point ? 2 : 1.5}
              />
            ))}

            {/* Transparent overlay for mouse/touch events */}
            <rect
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseLeave}
              className="cursor-pointer touch-none"
            />
          </Group>
        </svg>
      )}

      {/* Update tooltip rendering */}
      {isClient && tooltipData && tooltipLeft != null && tooltipTop != null && (
        <div
          style={{
            position: 'absolute',
            left: tooltipLeft,
            top: tooltipTop,
            transform: 'translate(-50%, -100%)',
          }}
          className="p-2 rounded shadow-lg backdrop-blur-sm border border-accentPrimary "
        >
          <div className="text-xs sm:text-sm space-y-1 text-basePrimary">
            <div className="font-medium">
              <span className="text-accentPrimary">Date: </span>
              {tooltipData.x.toLocaleDateString()}
            </div>
            <div className="font-medium">
              <span className="text-accentPrimary">Value: </span>
              {tooltipData.y.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineGraph;
