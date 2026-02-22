import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const Q = Number(searchParams.get("Q"));
    const H = Number(searchParams.get("H"));
    const freq = searchParams.get("freq") ?? "50";

    if (!Q || !H) {
      return NextResponse.json(
        { error: "Q と H は必須です" },
        { status: 400 }
      );
    }

    // Supabase クライアント
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 水車データ取得
    const { data: turbines, error } = await supabase
      .from("turbines")
      .select("*");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "データ取得に失敗しました" },
        { status: 500 }
      );
    }

    // Q-H 条件に合う水車を抽出
    const matched = turbines.filter((t) => {
      return Q >= t.q_min && Q <= t.q_max && H >= t.h_min && H <= t.h_max;
    });

    if (matched.length === 0) {
      return NextResponse.json({
        matched: [],
        best: null,
      });
    }

    // 最適水車（とりあえず最初の1件）
    const bestTurbine = matched[0];

    // 効率曲線（JSON 文字列 → 配列）
    let parsedCurve = [];
    try {
      parsedCurve = JSON.parse(bestTurbine.efficiency_curve_json);
    } catch (e) {
      console.error("効率曲線の JSON パースに失敗:", e);
    }

    // 最終レスポンス
    return NextResponse.json({
      matched,
      best: {
        ...bestTurbine,
        efficiency_curve: parsedCurve,
      },
    });

  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json(
      { error: "サーバーエラー" },
      { status: 500 }
    );
  }
}