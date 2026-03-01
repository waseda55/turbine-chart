import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("turbines").select("*");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // JSON文字列を配列に変換
  const parsed = data.map((turbine) => ({
    ...turbine,
    efficiency_curve: turbine.efficiency_curve_json
      ? JSON.parse(turbine.efficiency_curve_json)
      : null,
  }));

  return Response.json(parsed);
}
