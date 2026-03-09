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
  Legend,
} from "recharts";

export default function ResultPageInner() {
  const params = useSearchParams();
  const Q = Number(params.get("Q"));
  const H = Number(params.get("H"));
  const freq = Number(params.get("freq"));
  const Ns_input = params.get("Ns");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openTypes, setOpenTypes] = useState<string[]>([]);
  const [selectedTurbine, setSelectedTurbine] = useState<any>(null);

  // Ns 計算
  let Ns: number;
  if (Ns_input && Ns_input !== "") {
    Ns = Number(Ns_input);
  } else {
    const rho = 1000;
    const g = 9.81;
    const eta = 0.8;
    const P = rho * g * Q * H * eta;
    const n = freq === 50 ? 300 : 360;
    Ns = Math.round((n * Math.sqrt(P)) / Math.pow(H, 1.25));
  }

  // API fetch
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/select?Q=${Q}&H=${H}&freq=${freq}&Ns=${Ns}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [Q, H, freq, Ns]);

  const toggleType = (type: string) => {
    setOpenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // グループ化
  let grouped: any = {};
  if (data?.matched) {
    grouped = data.matched.reduce((acc: any, t: any) => {
      const type = t.type ?? "その他";
      if (!acc[type]) acc[type] = [];
      acc[type].push(t);
      return acc;
    }, {});
  }

  // log ticks
  const logTicks: number[] = [];
  for (let exp = -1; exp <= 1; exp++) {
    [1, 2, 5].forEach((m) => logTicks.push(m * 10 ** exp));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-light text-slate-800 tracking-wide mb-6 text-center">
          選定結果
        </h1>

        {/* 入力条件 */}
        <div className="bg-white/70 backdrop-blur-md shadow-md border border-sky-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-medium text-slate-700 mb-4">入力条件</h2>

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

            <div>
              <p className="text-sm text-slate-500">比速度 Ns</p>
              <p className="text-xl font-semibold">{Ns}</p>
            </div>
          </div>
        </div>

        {loading && <p className="text-center text-slate-600">計算中です…</p>}

        {!loading && data && (
          <div className="space-y-8">

            {/* アコーディオン */}
            <div className="bg-white/70 backdrop-blur-md shadow-md border border-sky-100 rounded-xl p-6">
              <h2 className="text-lg font-medium text-slate-700 mb-4">
                水車候補一覧（種類別）
              </h2>

              {Object.keys(grouped).map((type) => {
                const isOpen = openTypes.includes(type);

                const sorted = [...grouped[type]].sort((a, b) => {
                  if (a.id === data.best?.id) return -1;
                  if (b.id === data.best?.id) return 1;
                  return 0;
                });

                return (
                  <div key={type} className="mb-4 border-b border-sky-100 pb-2">
                    <button
                      onClick={() => toggleType(type)}
                      className="w-full flex justify-between items-center py-2 text-left"
                    >
                      <span className="text-xl font-semibold text-slate-800">
                        {type} 型
                      </span>
                      <span className="text-slate-500">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                      <div className="mt-3 space-y-4">

                        {/* カード一覧 */}
                        {sorted.map((turbine: any) => {
                          const isBest = turbine.id === data.best?.id;

                          return (
                            <div
                              key={turbine.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("選択された水車:", turbine);
                                setSelectedTurbine(turbine);
                              }}
                              className={`relative border rounded-lg p-4 shadow-sm transition cursor-pointer
                                hover:bg-sky-50 hover:shadow-lg
                                ${isBest ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200"}
                              `}
                            >
                              <div
                                className={`absolute left-0 top-0 h-full w-1 rounded-l-lg
                                  ${isBest ? "bg-blue-500" : "bg-slate-300"}
                                `}
                              />

                              <p className="text-lg font-semibold text-slate-800">
                                {turbine.name}
                                {isBest && (
                                  <span className="ml-2 text-blue-600 font-bold">（推奨）</span>
                                )}
                              </p>

                              <p className="text-slate-600 mt-1 line-clamp-2">
                                {turbine.notes ?? "説明文はありません。"}
                              </p>

                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-slate-700">
                                <div>
                                  <p className="text-slate-500">Q 範囲</p>
                                  <p className="font-semibold">
                                    {turbine.q_min} 〜 {turbine.q_max} m³/s
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">H 範囲</p>
                                  <p className="font-semibold">
                                    {turbine.h_min} 〜 {turbine.h_max} m
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Ns 範囲</p>
                                  <p className="font-semibold">{turbine.Ns_min} 〜 {turbine.Ns_max}</p>
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
                              <th className="border px-2 py-1">Q 範囲</th>
                              <th className="border px-2 py-1">H 範囲</th>
                              <th className="border px-2 py-1">Ns 範囲</th>
                            </tr>
                          </thead>

                          <tbody>
                            {sorted.map((turbine: any) => {
                              const isBest = turbine.id === data.best?.id;

                              return (
                                <tr key={turbine.id} className={isBest ? "bg-blue-50 font-semibold" : ""}>
                                  <td className="border px-2 py-1">{turbine.name}</td>
                                  <td className="border px-2 py-1">
                                    {turbine.q_min} 〜 {turbine.q_max}
                                  </td>
                                  <td className="border px-2 py-1">
                                    {turbine.h_min} 〜 {turbine.h_max}
                                  </td>
                                  <td className="border px-2 py-1">
                                    {turbine.Ns_min} 〜 {turbine.Ns_max}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* モーダル */}
            {selectedTurbine && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                  {/* 閉じる */}
                  <button
                    onClick={() => setSelectedTurbine(null)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 text-2xl"
                  >
                    ×
                  </button>

                  {/* タイトル */}
                  <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                    {selectedTurbine.name}
                  </h2>

                  {/* 推奨バッジ */}
                  {selectedTurbine.id === data.best?.id && (
                    <div className="mb-4">
                      <p className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        推奨モデル（Best）
                      </p>

                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-700">
                        <p className="font-semibold mb-1">推奨理由：</p>

                        <ul className="list-disc ml-5 space-y-1">
                          <li>
                            流量 Q は {selectedTurbine.q_min}〜{selectedTurbine.q_max} m³/s の範囲に
                            {selectedTurbine.q_ok ? "入っています" : "入っていません"}
                          </li>

                          <li>
                            落差 H は {selectedTurbine.h_min}〜{selectedTurbine.h_max} m の範囲に
                            {selectedTurbine.h_ok ? "入っています" : "入っていません"}
                          </li>

                          <li>
                            比速度 Ns は {selectedTurbine.Ns_min}〜{selectedTurbine.Ns_max} の範囲に
                            {selectedTurbine.ns_ok ? "入っています" : "入っていません"}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 説明文 */}
                  <p className="text-slate-700 leading-relaxed mb-6">
                    {selectedTurbine.notes ?? "説明文はありません。"}
                  </p>

                  {/* 基本情報 */}
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">基本情報</h3>

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

                      <div>
                        <p className="text-slate-500">比速度 Ns 範囲</p>
                        <p className="font-semibold">
                          {selectedTurbine.Ns_min} 〜 {selectedTurbine.Ns_max}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* ─ Q–H マップ ─ */}
                  <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">
                    Q–H マップ
                  </h3>

                  <div className="relative bg-white border border-slate-200 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart margin={{ top: -30, right: 20, bottom: 40, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />

                        {/* X軸（流量 Q） */}
                        <XAxis
                          type="number"
                          dataKey="q"
                          name="流量 Q (m³/s)"
                          ticks={logTicks}
                          scale="log"
                          domain={[0.1, 50]}
                        >
                          <Label
                            value="流量 Q (m³/s)"
                            offset={-5}
                            position="insideBottom"
                            style={{ fontWeight: 600, fill: "#334155" }}
                          />
                        </XAxis>

                        {/* Y軸（落差 H） */}
                        <YAxis
                          type="number"
                          dataKey="h"
                          name="落差 H (m)"
                          scale="log"
                          domain={[1, 300]}
                        >
                          <Label
                            value="落差 H (m)"
                            angle={-90}
                            position="insideLeft"
                            offset={20}
                            style={{ fontWeight: 600, fill: "#334155" }}
                          />
                        </YAxis>

                        {/* 入力点 */}
                        <Scatter
                          name="入力点"
                          data={[{ q: Q, h: H }]}
                          fill="#ef4444"
                          shape={(props) => (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={7}
                              fill="#ef4444"
                              stroke="white"
                              strokeWidth={2}
                              style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.3))" }}
                            />
                          )}
                        />

                        {/* 水車の適用範囲 */}
                        <ReferenceArea
                          x1={selectedTurbine.q_min}
                          x2={selectedTurbine.q_max}
                          y1={selectedTurbine.h_min}
                          y2={selectedTurbine.h_max}
                          fill="rgba(59, 130, 246, 0.08)"
                          stroke="rgba(59, 130, 246, 0.7)"
                          strokeWidth={3}   // ← 太くする
                        />

                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{
                            background: "rgba(255,255,255,0.9)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "4px 8px",
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ─ 効率曲線 ─ */}
                  <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">
                    効率曲線
                  </h3>

                  <div className="relative bg-white border border-slate-200 rounded-xl p-4">
                    {selectedTurbine.efficiency_curve?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedTurbine.efficiency_curve}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="flow"
                            label={{ value: "流量 Q (m³/s)", position: "insideBottom", offset: -5, fontWeight: 700, fontSize: "14px", fill: "#334155" }}
                          />
                          <YAxis
                            dataKey="efficiency"
                            label={{ value: "効率 (%)", angle: -90, position: "insideLeft", fontWeight: 700, fontSize: "14px", fill: "#334155" }}
                          />
                          <Tooltip />
                          <Legend
                            verticalAlign="top"
                            align="right"
                          />
                          <Line
                            type="monotone"
                            dataKey="efficiency"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-500 text-sm">効率曲線データがありません。</p>
                    )}
                  </div>
                  
                  {/* 入力条件との適合 */}
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    入力条件との適合
                  </h3>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700">

                    {/* Q */}
                    <p>
                      入力 Q = <span className="font-semibold">{Q} m³/s</span> は
                      <span className="font-semibold">
                        {" "}
                        {selectedTurbine.q_min}〜{selectedTurbine.q_max}{" "}
                      </span>
                      の範囲に
                      {selectedTurbine.q_ok ? (
                        <span className="text-green-700 font-semibold"> 入っています。</span>
                      ) : (
                        <span className="text-red-600 font-semibold"> 入っていません。</span>
                      )}
                    </p>

                    {/* H */}
                    <p className="mt-1">
                      入力 H = <span className="font-semibold">{H} m</span> は
                      <span className="font-semibold">
                        {" "}
                        {selectedTurbine.h_min}〜{selectedTurbine.h_max}{" "}
                      </span>
                      の範囲に
                      {selectedTurbine.h_ok ? (
                        <span className="text-green-700 font-semibold"> 入っています。</span>
                      ) : (
                        <span className="text-red-600 font-semibold"> 入っていません。</span>
                      )}
                    </p>

                    {/* Ns */}
                    <p className="mt-1">
                      入力 Ns = <span className="font-semibold">{Ns}</span> は
                      <span className="font-semibold">
                        {" "}
                        {selectedTurbine.Ns_min}〜{selectedTurbine.Ns_max}{" "}
                      </span>
                      の範囲に
                      {selectedTurbine.ns_ok ? (
                        <span className="text-green-700 font-semibold"> 入っています。</span>
                      ) : (
                        <span className="text-red-600 font-semibold"> 入っていません。</span>
                      )}
                    </p>

                    {/* Ns 警告 */}
                    {!selectedTurbine.ns_ok && (
                      <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                        <p className="font-semibold">注意：</p>
                        <p>
                          この水車は比速度 Ns の適用範囲外です。ただし、流量 Q と落差 H が適合している場合は
                          実用上問題ないケースもあります。
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedTurbine(null)}
                      className="mt-6 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}