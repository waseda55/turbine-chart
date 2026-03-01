import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const Q = Number(searchParams.get("Q"));
    const H = Number(searchParams.get("H"));

    if (!Q || !H) {
      return NextResponse.json(
        { error: "Q と H は必須です" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Q-H 条件に合う水車を取得
    const { data, error } = await supabase
      .from("turbines")
      .select("*")
      .lte("q_min", Q)
      .gte("q_max", Q)
      .lte("h_min", H)
      .gte("h_max", H);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 効率曲線をパース
    const parsed = data.map((row) => ({
      ...row,
      efficiency_curve: row.efficiency_curve_json
        ? JSON.parse(row.efficiency_curve_json)
        : null,
    }));

    // 候補がゼロならそのまま返す
    if (parsed.length === 0) {
      return NextResponse.json({
        matched: [],
        best: null,
      });
    }

    // 最適水車（とりあえず最初の1件）
    const bestTurbine = parsed[0];

    return NextResponse.json({
      matched: parsed,
      best: bestTurbine,
    });

  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json(
      { error: "サーバーエラー" },
      { status: 500 }
    );
  }
}