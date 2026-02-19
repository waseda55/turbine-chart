import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const turbineId = searchParams.get("id");

  const { data, error } = await supabase
    .from("efficiency_curves")
    .select("*")
    .eq("turbine_id", turbineId)
    .order("flow");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}