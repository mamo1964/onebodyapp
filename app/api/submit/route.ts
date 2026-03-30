import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CHATWORK_API_TOKEN = "b8135c68df88cf8b9116b2f055ce9803";
const CHATWORK_ROOM_ID = "18494769";

interface SubmitPayload {
  name: string;
  email: string;
  phone: string;
  lineName: string;
  birthdate: string;
  region: string;
  job: string;
  familyCount: string;
  height: string;
  weight: string;
  birth: string;
  medicalHistory: string;
  menstruation: string;
  bowel: string;
  bowelOther: string;
  concerns: string[];
  concernsOther: string;
  motivation: string;
  debt: string;
  paidCourseAgreement: boolean;
  slotId: string;
  cancelAgreement: boolean;
  otherNotes: string;
}

function validatePayload(body: Partial<SubmitPayload>): string | null {
  if (!body.name?.trim()) return "お名前は必須です";
  if (!body.email?.trim()) return "メールアドレスは必須です";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return "メールアドレスの形式が正しくありません";
  if (!body.phone?.trim()) return "電話番号は必須です";
  if (!body.lineName?.trim()) return "LINE登録名は必須です";
  if (!body.birthdate?.trim()) return "生年月日は必須です";
  if (!body.region?.trim()) return "お住まい地域は必須です";
  if (!body.job?.trim()) return "現在のお仕事は必須です";
  if (!body.familyCount?.trim()) return "家族の人数は必須です";
  if (!body.height?.trim()) return "身長は必須です";
  if (!body.weight?.trim()) return "体重は必須です";
  if (!body.birth?.trim()) return "ご出産経験は必須です";
  if (!body.medicalHistory?.trim()) return "既往歴は必須です";
  if (!body.menstruation?.trim()) return "生理についての回答は必須です";
  if (!body.bowel?.trim()) return "お通じについての回答は必須です";
  if (!body.concerns || body.concerns.length === 0) return "お悩みを1つ以上選択してください";
  if (!body.motivation?.trim()) return "受講意欲の回答は必須です";
  if (!body.debt?.trim()) return "債務整理・自己破産の経験の回答は必須です";
  if (!body.paidCourseAgreement) return "有料講座ご案内への同意が必要です";
  if (!body.slotId?.trim()) return "ご相談希望日時を選択してください";
  if (!body.cancelAgreement) return "キャンセル・リスケ不可への同意が必要です";
  return null;
}

function buildChatworkMessage(payload: SubmitPayload, slotLabel: string): string {
  const concerns = payload.concerns.join("、");
  const other = payload.otherNotes?.trim() || "なし";

  return `【ワンボディ 個別相談 新規申込】
━━━━━━━━━━━━━━━━━━━━
■ お名前: ${payload.name}
■ メール: ${payload.email}
■ 電話: ${payload.phone}
■ LINE名: ${payload.lineName}
■ 生年月日: ${payload.birthdate}
■ 地域: ${payload.region}
■ お仕事: ${payload.job}
■ 家族人数: ${payload.familyCount}
■ 身長: ${payload.height}cm
■ 体重: ${payload.weight}kg
■ 出産経験: ${payload.birth}
■ 既往歴: ${payload.medicalHistory}
■ 生理: ${payload.menstruation}
■ お通じ: ${payload.bowel}${payload.bowelOther ? `（${payload.bowelOther}）` : ""}
■ お悩み: ${concerns}${payload.concernsOther ? `（その他：${payload.concernsOther}）` : ""}
■ 受講意欲: ${payload.motivation}/5
■ 債務整理経験: ${payload.debt}
■ ご相談日時: ${slotLabel}
■ その他: ${other}
━━━━━━━━━━━━━━━━━━━━`;
}

async function sendChatworkMessage(message: string): Promise<void> {
  const url = `https://api.chatwork.com/v2/rooms/${CHATWORK_ROOM_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-ChatWorkToken": CHATWORK_API_TOKEN,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ body: message }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Chatwork API error: ${response.status} ${text}`);
  }
}

export async function POST(req: NextRequest) {
  let body: Partial<SubmitPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const validationError = validatePayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const payload = body as SubmitPayload;

  // Find the selected slot
  const { data: slot, error: fetchError } = await supabase
    .from("time_slots")
    .select("id, label, booked")
    .eq("id", payload.slotId)
    .single();

  if (fetchError || !slot) {
    return NextResponse.json(
      { error: "選択された日時が見つかりません。ページを再読み込みして再度お試しください。" },
      { status: 400 }
    );
  }

  if (slot.booked) {
    return NextResponse.json(
      { error: "選択された日時はすでに予約済みです。別の日時をお選びください。" },
      { status: 409 }
    );
  }

  // Mark slot as booked
  const { error: updateError } = await supabase
    .from("time_slots")
    .update({ booked: true })
    .eq("id", payload.slotId);

  if (updateError) {
    console.error("Failed to update slot:", updateError);
    return NextResponse.json(
      { error: "予約の保存中にエラーが発生しました。お手数ですが、直接ご連絡ください。" },
      { status: 500 }
    );
  }

  // Send Chatwork notification
  const message = buildChatworkMessage(payload, slot.label);
  try {
    await sendChatworkMessage(message);
  } catch (err) {
    console.error("Chatwork notification failed:", err);
  }

  return NextResponse.json({ success: true });
}
