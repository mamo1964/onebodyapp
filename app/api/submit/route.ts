import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// service roleキー（サーバー側のみ）でUPDATE権限を持つクライアント
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CHATWORK_API_TOKEN = "b8135c68df88cf8b9116b2f055ce9803";
const CHATWORK_ROOM_ID = "415646330";
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbw9ArIIUwADGxPfp5hvscT_sx9BMVYSB-UEOpBPc9jSu4-gauiUHgcTZIVNBsBp9tJo/exec";
const resend = new Resend(process.env.RESEND_API_KEY);

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
  debt: boolean;
  paidCourseAgreement: boolean;
  assignmentAgreement: string;
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
  if (!body.debt) return "債務整理・自己破産の経験がないことの確認が必要です";
  if (!body.paidCourseAgreement) return "有料講座ご案内への同意が必要です";
  if (!body.slotId?.trim()) return "ご相談希望日時を選択してください";
  if (!body.cancelAgreement) return "キャンセル・リスケ不可への同意が必要です";
  return null;
}

function calcAge(birthdate: string): string {
  const parts = birthdate.split(/[\/\-\.\s年月日]/g).filter(Boolean);
  if (parts.length !== 3) return "不明";
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (y <= 1900 || m < 1 || m > 12 || d < 1 || d > 31) return "不明";
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age >= 0 && age <= 120 ? `${age}歳` : "不明";
}

function buildChatworkMessage(payload: SubmitPayload, slotLabel: string): string {
  const concerns = payload.concerns.join("、");
  const other = payload.otherNotes?.trim() || "なし";
  const age = calcAge(payload.birthdate);

  return `【ワンボディ 個別相談 新規申込】
━━━━━━━━━━━━━━━━━━━━
■ お名前: ${payload.name}
■ メール: ${payload.email}
■ 電話: ${payload.phone}
■ LINE名: ${payload.lineName}
■ 生年月日: ${payload.birthdate}（${age}）
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
■ 債務整理経験: なし（申告済み）
■ 課題提出: ${payload.assignmentAgreement === "提出します" ? "提出します（仮登録）" : payload.assignmentAgreement || "仮申込"}
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

async function sendConfirmationEmail(payload: SubmitPayload, slotLabel: string): Promise<void> {
  await resend.emails.send({
    from: "ワンボディウェルネス <noreply@elevenoneprm.com>",
    to: payload.email,
    subject: "【ワンボディウェルネス】個別相談のお申し込みを受け付けました",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d9488;">【ワンボディウェルネス】個別相談 お申し込み確認</h2>
        <p>${payload.name} 様</p>
        <p>このたびは個別相談にお申し込みいただきありがとうございます。<br>以下の内容でお申し込みを受け付けました。</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 40%;">お名前</td><td style="padding: 8px 0;">${payload.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">メールアドレス</td><td style="padding: 8px 0;">${payload.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">電話番号</td><td style="padding: 8px 0;">${payload.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">LINEオープンチャット登録名</td><td style="padding: 8px 0;">${payload.lineName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">生年月日</td><td style="padding: 8px 0;">${payload.birthdate}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">お住まい地域</td><td style="padding: 8px 0;">${payload.region}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">現在のお仕事</td><td style="padding: 8px 0;">${payload.job}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">ご家族の人数</td><td style="padding: 8px 0;">${payload.familyCount}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">身長</td><td style="padding: 8px 0;">${payload.height}cm</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">体重</td><td style="padding: 8px 0;">${payload.weight}kg</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">出産経験</td><td style="padding: 8px 0;">${payload.birth}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">既往歴</td><td style="padding: 8px 0;">${payload.medicalHistory}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">生理について</td><td style="padding: 8px 0;">${payload.menstruation}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">お通じについて</td><td style="padding: 8px 0;">${payload.bowel}${payload.bowelOther ? `（${payload.bowelOther}）` : ""}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">思い当たるお悩み</td><td style="padding: 8px 0;">${payload.concerns.join("、")}${payload.concernsOther ? `（その他：${payload.concernsOther}）` : ""}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">受講意欲</td><td style="padding: 8px 0;">${payload.motivation}/5</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-weight: bold;">ご相談日時</td><td style="padding: 8px 0; font-weight: bold; color: #0d9488;">${slotLabel}</td></tr>
          ${payload.otherNotes ? `<tr><td style="padding: 8px 0; color: #6b7280;">その他ご心配ごと</td><td style="padding: 8px 0;">${payload.otherNotes}</td></tr>` : ""}
        </table>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #374151;">後ほどご登録いただきましたLINEにご連絡をいたしますのでお待ちください。</p>
        <p style="color: #374151;">なお、お申し込み後の相談者様都合のキャンセル・日程変更はお受けできません。<br>あらかじめご了承ください。</p>
        <p style="color: #374151;">お問い合わせなどはLINEの方にお願いいたします。</p>
        <p style="color: #374151;">では、お会いできますことを楽しみにしております。</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">ワンボディウェルネス<br>柳下 郁子</p>
      </div>
    `,
  });
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

  let slotLabel = "調整希望";

  if (payload.slotId !== "調整希望") {
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

    // Mark slot as booked（service roleでRLSをバイパス）
    const { error: updateError } = await getSupabaseAdmin()
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

    slotLabel = slot.label;
  }

  // Send data to Google Sheets
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        debt: "なし（申告済み）",
        paidCourseAgreement: "同意済み",
        assignmentAgreement: payload.assignmentAgreement === "提出します" ? "提出します（仮登録）" : payload.assignmentAgreement || "仮申込",
        cancelAgreement: "同意済み",
        slotLabel,
      }),
    });
  } catch (err) {
    console.error("Google Sheets write failed:", err);
  }

  // Send Chatwork notification
  const message = buildChatworkMessage(payload, slotLabel);
  try {
    await sendChatworkMessage(message);
  } catch (err) {
    console.error("Chatwork notification failed:", err);
  }

  // Send confirmation email to applicant
  try {
    await sendConfirmationEmail(payload, slotLabel);
  } catch (err) {
    console.error("Confirmation email failed:", err);
  }

  return NextResponse.json({ success: true });
}
