"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type ClimateLineSpec = {
  dataKey: string;
  stroke: string;
  name: string;
  dashed?: boolean;
};

export type ClimateRefLine = {
  y: number;
  label: string;
};

export default function ClimateLineChart({
  data,
  xKey,
  lines,
  referenceLines
}: {
  data: object[];
  xKey: string;
  lines: ClimateLineSpec[];
  referenceLines?: ClimateRefLine[];
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" />
          <XAxis dataKey={xKey} tick={{ fill: "#70888f", fontSize: 10 }} />
          <YAxis tick={{ fill: "#70888f", fontSize: 10 }} unit="°C" />
          <Tooltip />
          {(referenceLines || []).map((line) => (
            <ReferenceLine
              key={line.label}
              y={line.y}
              stroke="#ffb35b"
              strokeDasharray="4 4"
              label={{ value: line.label, fill: "#88a0a8", fontSize: 10 }}
            />
          ))}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={false}
              connectNulls={false}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
