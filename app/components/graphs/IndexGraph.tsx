import React, { useMemo, useState, useRef, useEffect } from 'react';
import { LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { Tooltip } from '@visx/tooltip';
import { bisector } from 'd3-array';
import { useMediaQuery } from 'react-responsive'; // You'll need to install this

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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // State for container dimensions
  const [dimensions, setDimensions] = useState({
    width: propWidth || 500,
    height: propHeight || 300
  });

  // Adjust margins for mobile
  const margin = useMemo(() => {
    const defaultMargin = propMargin || {
      top: 40,
      right: 60,
      bottom: 50,
      left: 60  // Increased left margin for axis visibility
    };
    if (isMobile) {
      return {
        ...defaultMargin,
        left: Math.max(20, defaultMargin.left),
        bottom: Math.max(40, defaultMargin.bottom)
      };
    }
    return defaultMargin;
  }, [propMargin, isMobile]);

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

  // Modify handle mouse move to better support both mouse and touch
  const handleMouseMove = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    event.preventDefault(); // Prevent scrolling on touch devices

    const isTouchEvent = 'touches' in event;

    // Get the SVG element's bounding rectangle
    const svgRect = svgRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    // Get the coordinates relative to the viewport
    const clientX = isTouchEvent ? event.touches[0].clientX : event.clientX;
    const clientY = isTouchEvent ? event.touches[0].clientY : event.clientY;

    // Calculate position relative to the SVG container
    const svgX = clientX - svgRect.left;
    const svgY = clientY - svgRect.top;

    const x0 = xScale.invert(svgX - margin.left);
    const index = bisectDate(data, x0, 1);

    // Ensure we don't go out of bounds
    if (index <= 0 || index >= data.length) return;

    const d0 = data[index - 1];
    const d1 = data[index];

    if (!d0 || !d1) return;

    // Find the closer data point
    const point = x0.getTime() - d0.x.getTime() > d1.x.getTime() - x0.getTime() ? d1 : d0;

    setTooltipData(point);

    // Adjust tooltip position based on the device type
    if (isMobile) {
      // For mobile, position tooltip above touch point to avoid finger obstruction
      setTooltipLeft(clientX - 50); // Center tooltip
      setTooltipTop(clientY - 70); // Position well above finger
    } else {
      // For desktop, position near cursor
      setTooltipLeft(clientX + 10);
      setTooltipTop(clientY - 10);
    }
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
              fontSize: isMobile ? 10 : 12,
              fontFamily: 'Poppins',
              style: {
                dominantBaseline: 'middle'
              }
            }}
            strokeWidth={1.5}
            tickLabelProps={() => ({
              fill: axisColor,
              fontSize: isMobile ? 8 : 10,
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
            labelProps={{
              fill: axisColor,
              textAnchor: 'middle',
              fontSize: isMobile ? 10 : 12,
              fontFamily: 'Poppins',
              dy: isMobile ? 25 : 30,
            }}
            tickLabelProps={() => ({
              fill: axisColor,
              fontSize: isMobile ? 8 : 10,
              textAnchor: 'middle',
              dy: '0.33em',
            })}
            strokeWidth={1.5}
            strokeDasharray=""
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
              r={isMobile ? 4 : 3}
              fill={lineColor}
              fillOpacity={tooltipData === point ? 1 : 0.8}
              stroke="bg-accentPrimary"
              strokeWidth={tooltipData === point ? 2 : 1.5}
              className="transition-all duration-200 ease-in-out cursor-pointer hover:r-5"
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

      {/* Optimized tooltip positioning - adjusted to ensure tooltip stays on screen */}
      {tooltipData && tooltipLeft != null && tooltipTop != null && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          className={`
            fixed text-accentPrimary 
            p-2 rounded
            text-sm pointer-events-none backdrop-blur 
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}
          style={{
            transform: `translate(${Math.min(0, window.innerWidth - tooltipLeft - 150)}px, 
                ${Math.min(0, window.innerHeight - tooltipTop - 60)}px)`,
          }}
        >
          <div className=''>
            <div>
              <span className='text-accentPrimary font-primary'>Date: </span>
              {tooltipData.x.toLocaleDateString()}
            </div>
            <div>
              <span className='text-accentPrimary font-primary'>Value: </span>
              {tooltipData.y.toLocaleString()}
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default LineGraph;
