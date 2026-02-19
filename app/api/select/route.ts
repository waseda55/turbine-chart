import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const Q = searchParams.get("Q");
    const H = searchParams.get("H");
    const freq = searchParams.get("freq");

    const q = parseFloat(Q || "0");
    const h = parseFloat(H || "0");

    console.log("Q, H, freq:", q, h, freq);

    const { data, error } = await supabase
      .from("turbines")
      .select("*")
      .lte("q_min", q)  // q_min <= Q
      .gte("q_max", q)  // q_max >= Q
      .lte("h_min", h)  // h_min <= H
      .gte("h_max", h); // h_max >= H

    console.log("Matched:", data);
    console.log("Supabase error:", error);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(
      {
        matched: data,
        freq,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("API Error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}