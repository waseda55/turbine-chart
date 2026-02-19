"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";

type Turbine = {
  type: string;
  qMin: number;
  qMax: number;
  hMin: number;
  hMax: number;
};

type UserPoint = {
  q: number;
  h: number;
};

type TurbineChartProps = {
  turbines: Turbine[];
  userPoint: UserPoint;
};

export default function TurbineChart({ turbines, userPoint }: TurbineChartProps) {
  return (
    <ScatterChart
      width={600}
      height={400}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      <CartesianGrid />
      <XAxis
        type="number"
        dataKey="Q"
        name="流量 Q"
        unit="m³/s"
        domain={[0, 6]}
      />
      <YAxis
        type="number"
        dataKey="H"
        name="落差 H"
        unit="m"
        domain={[0, 300]}
      />
      <Tooltip cursor={{ strokeDasharray: "3 3" }} />

      {/* 水車の適用範囲（矩形） */}
      {turbines.map((t, i) => (
        <ReferenceArea
          key={i}
          x1={t.q_min}
          x2={t.q_max}
          y1={t.h_min}
          y2={t.h_max}
          fill="rgba(0, 128, 255, 0.2)"
          stroke="blue"
        />
      ))}

      {/* ユーザー入力点（赤い×） */}
      <Scatter
        name="入力点"
        data={[userPoint]}
        fill="red"
        shape="cross"
      />
    </ScatterChart>
  );
}