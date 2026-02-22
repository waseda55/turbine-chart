"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  Line,
  LineChart
} from "recharts";

export default function ResultPageInner() {
  const params = useSearchParams();
  const Q = params.get("Q");
  const H = params.get("H");
  const freq = params.get("freq");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openTypes, setOpenTypes] = useState<string[]>([]);

  const toggleType = (type: string) => {
    setOpenTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/select?Q=${Q}&H=${H}&freq=${freq}`
        );
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [Q, H, freq]);

  const typeColors: Record<string, string> = {
    Francis: "rgba(59, 130, 246, 0.3)",
    Kaplan: "rgba(16, 185, 129, 0.3)",
    Pelton: "rgba(249, 115, 22, 0.3)",
    その他: "rgba(148, 163, 184, 0.3)",
  };

  let grouped: any = {};
  if (data && data.matched) {
    grouped = data.matched.reduce((acc: any, turbine: any) => {
      const type = turbine.type ?? "その他";
      if (!acc[type]) acc[type] = [];
      acc[type].push(turbine);
      return acc;
    }, {});
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-light text-slate-800 tracking-wide mb-6 text-center">
          選定結果
        </h1>

        <div className="bg-white/70 backdrop-blur-md shadow-md border border-sky-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-medium text-slate-700 mb-4">
            入力条件
          </h2>

          <div className="grid grid-cols-2 gap-4 text-slate-700">
            <div>
              <p className="text-sm text-slate-500">流量 Q</p>
              <p className="text-xl font-semibold">{Q} m³/s</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">落差 H</p>
              <p className="text-xl font-semibold">{H} m</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">電源周波数</p>
              <p className="text-xl font-semibold">{freq} Hz</p>
            </div>
          </div>
        </div>

        {loading && (
          <p className="text-center text-slate-600">計算中です…</p>
        )}

        {!loading && data && (
          <div className="space-y-8">

            {/* アコーディオン */}
            <div className="bg-white/70 backdrop-blur-md shadow-md border border-sky-100 rounded-xl p-6">
              <h2 className="text-lg font-medium text-slate-700 mb-4">
                水車候補一覧（種類別）
              </h2>

              {Object.keys(grouped).map((type) => {
                const isOpen = openTypes.includes(type);

                return (
                  <div key={type} className="mb-4 border-b border-sky-100 pb-2">

                    <button
                      onClick={() => toggleType(type)}
                      className="w-full flex justify-between items-center py-2 text-left"
                    >
                      <span className="text-xl font-semibold text-slate-800">
                        {type} 型
                      </span>
                      <span className="text-slate-500">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mt-3 space-y-4">
                        {grouped[type].map((turbine: any, index: number) => (
                          <div
                            key={index}
                            className="border border-sky-100 bg-white/80 rounded-lg p-4 shadow-sm"
                          >
                            <p className="text-lg font-semibold text-slate-800">
                              {turbine.name}
                            </p>

                            <p className="text-slate-600 mt-1">
                              {turbine.notes ?? "説明文はありません。"}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-slate-600">
                              <div>
                                <p className="text-slate-500">Q 範囲</p>
                                <p>{turbine.q_min} 〜 {turbine.q_max} m³/s</p>
                              </div>
                              <div>
                                <p className="text-slate-500">H 範囲</p>
                                <p>{turbine.h_min} 〜 {turbine.h_max} m</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Q-H マップ */}
            <div className="bg-white/70 backdrop-blur-md shadow-md border border-sky-100 rounded-xl p-6">
              <h2 className="text-lg font-medium text-slate-700 mb-4">
                Q–H マップ
              </h2>

              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>

                    <XAxis
                      type="number"
                      dataKey="q"
                      name="流量 Q"
                      unit="m³/s"
                      scale="log"
                      domain={[0.1, 10]}
                    />

                    <YAxis
                      type="number"
                      dataKey="h"
                      name="落差 H"
                      unit="m"
                      scale="log"
                      domain={[1, 100]}
                    />

                    {Object.keys(grouped).map((type) =>
                      grouped[type].map((turbine: any, index: number) => (
                        <ReferenceArea
                          key={`${type}-${index}`}
                          x1={Number(turbine.q_min)}
                          x2={Number(turbine.q_max)}
                          y1={Number(turbine.h_min)}
                          y2={Number(turbine.h_max)}
                          fill={typeColors[type] ?? "rgba(148,163,184,0.3)"}
                          stroke={typeColors[type]?.replace("0.3", "1")}
                          strokeOpacity={0.6}
                        />
                      ))
                    )}

                    <Scatter
                      name="入力点"
                      data={[{ q: Number(Q), h: Number(H) }]}
                      fill="red"
                      shape="cross"
                    />

                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 効率曲線（η–Q） */}
            <div className="bg-white/70 backdrop-blur-md shadow-md border border-sky-100 rounded-xl p-6">
              <h2 className="text-lg font-medium text-slate-700 mb-4">
                効率曲線（η–Q）
              </h2>

              {data?.best?.efficiency_curve ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={Object.values(data.best.efficiency_curve)}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <XAxis
                        dataKey="flow"
                        name="流量 Q"
                        unit="m³/s"
                        type="number"
                      />
                      <YAxis
                        dataKey="efficiency"
                        name="効率 η"
                        unit="%"
                        type="number"
                        domain={[0, 100]}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                  効率曲線データがありません
                </div>
              )}
            </div>

          </div>
        )}

        <div className="text-center mt-10">
          <a
            href="/"
            className="text-sky-600 hover:text-sky-700 font-medium underline"
          >
            入力画面に戻る
          </a>
        </div>

      </div>
    </main>
  );
}
