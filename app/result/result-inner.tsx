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
  CartesianGrid,
  Line,
  LineChart,
  Label,
  Legend
} from "recharts";

export default function ResultPageInner() {
  const params = useSearchParams();
  const Q = params.get("Q");
  const H = params.get("H");
  const freq = params.get("freq");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openTypes, setOpenTypes] = useState<string[]>([]);

  const [selectedTurbine, setSelectedTurbine] = useState<any>(null);

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

  const logTicks: number[] = [];
  for (let exp = -1; exp <= 4; exp++) {
    [1, 2, 5].forEach(m => {
    logTicks.push(m * 10 ** exp);
    });
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

                        {(() => {
                          const sorted = [...grouped[type]].sort((a, b) => {
                            if (a.id === data.best?.id) return -1;
                            if (b.id === data.best?.id) return 1;
                            return 0;
                          });

                          return (
                            <>
                              {/* カード一覧 */}
                              {sorted.map((turbine: any, index: number) => {
                                const isBest = turbine.id === data.best?.id;

                                return (
                                  <div
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTurbine(turbine);
                                    }}
                                    className={`
                                      relative border rounded-lg p-4 shadow-sm transition cursor-pointer
                                      hover:bg-sky-50 hover:shadow-lg
                                      ${isBest ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200"}
                                    `}
                                  >
                                    <div
                                      className={`
                                        absolute left-0 top-0 h-full w-1 rounded-l-lg
                                        ${isBest ? "bg-blue-500" : "bg-slate-300"}
                                      `}
                                    />

                                    <p className="text-lg font-semibold text-slate-800">
                                      {turbine.name}
                                      {isBest && <span className="ml-2 text-blue-600 font-bold">（推奨）</span>}
                                    </p>

                                    <p className="text-slate-600 mt-1 line-clamp-2">
                                      {turbine.notes ?? "説明文はありません。"}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-slate-700">
                                      <div>
                                        <p className="text-slate-500">Q 範囲</p>
                                        <p className="font-semibold">{turbine.q_min} 〜 {turbine.q_max} m³/s</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">H 範囲</p>
                                        <p className="font-semibold">{turbine.h_min} 〜 {turbine.h_max} m</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* 比較表 */}
                              <table className="w-full mt-6 text-sm border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700">
                                    <th className="border px-2 py-1">モデル名</th>
                                    <th className="border px-2 py-1">Q 範囲 (m³/s)</th>
                                    <th className="border px-2 py-1">H 範囲 (m)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sorted.map((turbine: any) => {
                                    const isBest = turbine.id === data.best?.id;

                                    return (
                                      <tr
                                        key={turbine.id}
                                        className={isBest ? "bg-blue-50 font-semibold" : ""}
                                      >
                                        <td className="border px-2 py-1">{turbine.name}</td>
                                        <td className="border px-2 py-1">
                                          {turbine.q_min} 〜 {turbine.q_max}
                                        </td>
                                        <td className="border px-2 py-1">
                                          {turbine.h_min} 〜 {turbine.h_max}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </>
                          );
                        })()}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {selectedTurbine && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl relative animate-fadeIn">

            {/* 閉じるボタン */}
            <button
              onClick={() => setSelectedTurbine(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 text-2xl"
            >
              ×
            </button>

            {/* タイトル */}
            <h2 className="text-3xl font-semibold text-slate-800 mb-2">
              {selectedTurbine.name}
            </h2>

            {/* 推奨バッジ */}
            {selectedTurbine.id === data.best?.id && (
              <p className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                推奨モデル（Best）
              </p>
            )}

            {/* 説明文 */}
            <p className="text-slate-700 leading-relaxed mb-6">
              {selectedTurbine.notes ?? "説明文はありません。"}
            </p>

            {/* セクションタイトル */}
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              基本情報
            </h3>

            {/* 情報カード */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">

                <div>
                  <p className="text-slate-500">型式</p>
                  <p className="font-semibold">{selectedTurbine.type ?? "不明"}</p>
                </div>

                <div>
                  <p className="text-slate-500">流量 Q 範囲</p>
                  <p className="font-semibold">
                    {selectedTurbine.q_min} 〜 {selectedTurbine.q_max} m³/s
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">落差 H 範囲</p>
                  <p className="font-semibold">
                    {selectedTurbine.h_min} 〜 {selectedTurbine.h_max} m
                  </p>
                </div>

                {selectedTurbine.design_Q && (
                  <div>
                    <p className="text-slate-500">設計流量</p>
                    <p className="font-semibold">{selectedTurbine.design_Q} m³/s</p>
                  </div>
                )}

                {selectedTurbine.design_H && (
                  <div>
                    <p className="text-slate-500">設計落差</p>
                    <p className="font-semibold">{selectedTurbine.design_H} m</p>
                  </div>
                )}

                {selectedTurbine.efficiency && (
                  <div>
                    <p className="text-slate-500">最高効率</p>
                    <p className="font-semibold">{selectedTurbine.efficiency}%</p>
                  </div>
                )}

              </div>
            </div>

            {/* ─ Q–H ミニチャート ─ */}
            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">
              Q–H マップ
            </h3>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                >
                  {/* グリッド */}
                  <CartesianGrid strokeDasharray="3 3" />

                  {/* X軸（流量 Q） */}
                  <XAxis
                    type="number"
                    dataKey="q"
                    name="流量 Q (m³/s)"
                    unit=""
                    ticks={logTicks}
                    scale="log"
                    domain={[0.1, 1000]}
                  >
                    <Label value="流量 Q (m³/s)" offset={-5} position="insideBottom" />
                  </XAxis>

                  {/* Y軸（落差 H） */}
                  <YAxis
                    type="number"
                    dataKey="h"
                    name="落差 H (m)"
                    unit=""
                    scale="log"
                    domain={[1, 100]}
                  >
                    <Label
                      value="落差 H (m)"
                      angle={-90}
                      position="insideLeft"
                      offset={10}
                    />
                  </YAxis>

                  {/* 入力点 */}
                  <Scatter
                    name="入力点"
                    data={[{ q: Number(Q), h: Number(H) }]}
                    fill="#ef4444"
                  />

                  {/* 水車の適用範囲（四角形） */}
                  <ReferenceArea
                    x1={selectedTurbine.q_min}
                    x2={selectedTurbine.q_max}
                    y1={selectedTurbine.h_min}
                    y2={selectedTurbine.h_max}
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="rgba(59, 130, 246, 0.6)"
                  />

                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* 入力条件との比較 */}
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              入力条件との適合
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700">
              <p>
                入力 Q = <span className="font-semibold">{Q} m³/s</span> は
                <span className="font-semibold"> {selectedTurbine.q_min}〜{selectedTurbine.q_max} </span>
                の範囲に入っています。
              </p>
              <p className="mt-1">
                入力 H = <span className="font-semibold">{H} m</span> は
                <span className="font-semibold"> {selectedTurbine.h_min}〜{selectedTurbine.h_max} </span>
                の範囲に入っています。
              </p>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}