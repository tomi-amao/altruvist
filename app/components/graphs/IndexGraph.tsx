import React, { useMemo, useState, useRef } from 'react';
import { LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { Tooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';

// Define the data point structure
interface DataPoint {
  x: Date;
  y: number;
}

// Define the props for our component
interface LineGraphProps {
  width: number;
  height: number;
  data: DataPoint[];
  margin?: { top: number; right: number; bottom: number; left: number };
  xAxisLabel?: string;
  yAxisLabel?: string;
  lineColor?: string;
  axisColor?: string; // New prop for axis color
}

// Helper function to get the data point from x coordinate
const bisectDate = bisector<DataPoint, Date>((d) => d.x).left;

const LineGraph: React.FC<LineGraphProps> = ({
  width,
  height,
  data,
  margin = { top: 20, right: 20, bottom: 50, left: 50 },
  xAxisLabel = 'Date',
  yAxisLabel = 'Value',
  lineColor = '#3b82f6', // blue-500
  axisColor = '#888', // Default axis color
}) => {
  // Define state for tooltip
  const [tooltipData, setTooltipData] = useState<DataPoint | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);
  const [tooltipTop, setTooltipTop] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate inner dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

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

  // Handle mouse move to show tooltip
  const handleMouseMove = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    // Get the SVG element's bounding rectangle
    const svgRect = svgRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    
    // Get the mouse coordinates relative to the viewport
    const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
    
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
    // Set tooltip position at cursor coordinates, relative to the page
    setTooltipLeft(clientX);
    setTooltipTop(clientY);
  };

  // Hide tooltip when mouse leaves
  const handleMouseLeave = () => {
    setTooltipData(null);
    setTooltipLeft(null);
    setTooltipTop(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Y Axis */}
          <AxisLeft
            scale={yScale}
            stroke={axisColor}
            tickStroke={axisColor}
            label={yAxisLabel}
            labelProps={{
              fill: axisColor,
              textAnchor: 'middle',
              fontSize: 12,
              fontFamily: 'Arial',
            }}
            tickLabelProps={() => ({
              fill: axisColor,
              fontSize: 10,
              textAnchor: 'end',
              dy: '0.33em',
            })}
          />
          
          {/* X Axis */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={axisColor}
            tickStroke={axisColor}
            label={xAxisLabel}
            labelProps={{
              fill: axisColor,
              textAnchor: 'middle',
              fontSize: 12,
              fontFamily: 'Arial',
            }}
            tickLabelProps={() => ({
              fill: axisColor,
              fontSize: 10,
              textAnchor: 'middle',
            })}
          />
          
          {/* Line path */}
          <LinePath
            data={data}
            x={(d) => xScale(d.x)}
            y={(d) => yScale(d.y)}
            stroke={lineColor}
            strokeWidth={2}
            curve={curveMonotoneX}
          />
          
          {/* Data points */}
          {data.map((point, i) => (
            <circle
              key={`point-${i}`}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={4}
              fill={lineColor}
              fillOpacity={tooltipData === point ? 1 : 0.7}
              stroke="white"
              strokeWidth={tooltipData === point ? 2 : 0}
            />
          ))}
          
          {/* Transparent overlay for mouse events */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseLeave}
          />
        </Group>
      </svg>
      
      {/* Tooltip positioned relative to the page */}
      {tooltipData && tooltipLeft != null && tooltipTop != null && (
        <Tooltip
          // Position the tooltip just above the cursor
          top={tooltipTop - 10} 
          left={tooltipLeft + 10}
          style={{
            position: 'fixed', // Change to fixed positioning
            backgroundColor: 'white',
            color: '#333',
            padding: '8px',
            borderRadius: '4px',
            boxShadow: '0 1px 10px rgba(0,0,0,0.2)',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 9999,
          }}
        >
          <div>
            <strong>Date:</strong> {tooltipData.x.toLocaleDateString()}
          </div>
          <div>
            <strong>Value:</strong> {tooltipData.y.toLocaleString()}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default LineGraph;
