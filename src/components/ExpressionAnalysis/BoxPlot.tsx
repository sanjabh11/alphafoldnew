import React from 'react';
import { Rectangle, Line } from 'recharts';

interface BoxPlotProps {
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[];
  fill?: string;
  stroke?: string;
}

export const BoxPlotComponent = (props: BoxPlotProps) => {
  const { x, y, width, height, data, fill = '#8884d8', stroke = '#000' } = props;

  // Calculate statistics
  const sortedData = [...data].sort((a, b) => a - b);
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];
  const q1 = sortedData[Math.floor(sortedData.length * 0.25)];
  const median = sortedData[Math.floor(sortedData.length * 0.5)];
  const q3 = sortedData[Math.floor(sortedData.length * 0.75)];

  // Scale values to fit in the allocated space
  const scale = height / (max - min);
  const boxTop = y + (max - q3) * scale;
  const boxBottom = y + (max - q1) * scale;
  const medianY = y + (max - median) * scale;
  const whiskerTop = y;
  const whiskerBottom = y + height;

  return (
    <g>
      {/* Box */}
      <Rectangle
        x={x - width / 2}
        y={boxTop}
        width={width}
        height={boxBottom - boxTop}
        fill={fill}
        stroke={stroke}
      />

      {/* Median line */}
      <Line
        x1={x - width / 2}
        x2={x + width / 2}
        y1={medianY}
        y2={medianY}
        stroke={stroke}
        strokeWidth={2}
      />

      {/* Top whisker */}
      <Line
        x1={x}
        x2={x}
        y1={whiskerTop}
        y2={boxTop}
        stroke={stroke}
      />
      <Line
        x1={x - width / 3}
        x2={x + width / 3}
        y1={whiskerTop}
        y2={whiskerTop}
        stroke={stroke}
      />

      {/* Bottom whisker */}
      <Line
        x1={x}
        x2={x}
        y1={boxBottom}
        y2={whiskerBottom}
        stroke={stroke}
      />
      <Line
        x1={x - width / 3}
        x2={x + width / 3}
        y1={whiskerBottom}
        y2={whiskerBottom}
        stroke={stroke}
      />
    </g>
  );
};

interface CustomBoxPlotProps {
  data: { value: number; index: number }[];
  width: number;
  height: number;
}

export const BoxPlot: React.FC<CustomBoxPlotProps> = ({ data, width, height }) => {
  const values = data.map(d => d.value);
  const boxWidth = 40;
  const x = width / 2;
  const y = 20;
  const plotHeight = height - 40;

  return (
    <svg width={width} height={height}>
      <BoxPlotComponent
        x={x}
        y={y}
        width={boxWidth}
        height={plotHeight}
        data={values}
      />
    </svg>
  );
};
