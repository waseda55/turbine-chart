import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const Q = Number(searchParams.get("Q"));
  const H = Number(searchParams.get("H"));
  const freq = Number(searchParams.get("freq"));
  const Ns = Number(searchParams.get("Ns")); // ★ Ns を受け取る

  if (!Q || !H || !freq) {
    return NextResponse.json({ matched: [], best: null });
  }

  // Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ★ DB から水車データを取得
  const { data: turbines } = await supabase
    .from("turbines")
    .select("*");

  if (!turbines) {
    return NextResponse.json({ matched: [], best: null });
  }

  // ★ 効率曲線を JSON.parse して UI 用に整形
  const turbinesWithCurve = await Promise.all(
    turbines.map(async (t) => {
      const { data: curve } = await supabase
        .from("efficiency_curves")   // ← 小文字にする
        .select("flow, efficiency")
        .eq("turbine_id", t.id)
        .order("flow", { ascending: true });

      return {
        ...t,
        efficiency_curve: curve ?? [],
      };
    })
  );

  // ★ 判定ロジック
  const matched = turbinesWithCurve.map((t) => {
    const q_ok = Q >= t.q_min && Q <= t.q_max;
    const h_ok = H >= t.h_min && H <= t.h_max;

    const Ns_min = t.ns_min ?? t.Ns_min ?? 0;
    const Ns_max = t.ns_max ?? t.Ns_max ?? 9999;

    const ns_ok = Ns >= Ns_min && Ns <= Ns_max;

    const score =
      (q_ok ? 2 : 0) +
      (h_ok ? 2 : 0) +
      (ns_ok ? 1 : 0);

    return {
      ...t,
      Ns_min,
      Ns_max,
      q_ok,
      h_ok,
      ns_ok,
      score,
    };
  });
  
  // ★ best（最適 1 台）
  const best = matched.reduce((a, b) => (a.score > b.score ? a : b), matched[0]);

  return NextResponse.json({
    matched,
    best,
  });
}