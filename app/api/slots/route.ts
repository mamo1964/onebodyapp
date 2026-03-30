import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export interface Slot {
  id: string;
  label: string;
  booked: boolean;
}

export async function GET() {
  const { data, error } = await supabase
    .from("time_slots")
    .select("id, label, booked")
    .eq("booked", false)
    .order("id");

  if (error) {
    console.error("Failed to fetch slots:", error);
    return NextResponse.json({ error: "日時の取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(data);
}
