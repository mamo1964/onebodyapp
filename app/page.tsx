"use client";

import { useEffect, useState } from "react";

interface Slot {
  id: string;
  label: string;
  booked: boolean;
}

interface FormData {
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

const REGIONS = [
  "北海道","青森","岩手","宮城","秋田","山形","福島",
  "茨城","栃木","群馬","埼玉","千葉","東京","神奈川",
  "新潟","富山","石川","福井","山梨","長野",
  "岐阜","静岡","愛知","三重",
  "滋賀","京都","大阪","兵庫","奈良","和歌山",
  "鳥取","島根","岡山","広島","山口",
  "徳島","香川","愛媛","高知",
  "福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄",
  "海外",
];

const JOBS = [
  "専業主婦/主夫",
  "会社員（正社員）",
  "会社役員・経営者",
  "公務員",
  "パート・アルバイト",
  "自営業・フリーランス",
  "学生",
  "無職・求職中",
  "その他",
];

const FAMILY_COUNTS = ["1人", "2人", "3人", "4人", "5人", "6人以上"];

const BOWEL_OPTIONS = [
  "毎日快便",
  "便秘ぎみ",
  "下痢気味",
  "便秘と下痢を繰り返す",
  "その他",
];

const CONCERNS_OPTIONS = [
  "疲れやすい・体力が落ちた",
  "むくみ",
  "冷え性",
  "汗をかけない",
  "肩こり",
  "腰痛",
  "ひざ痛",
  "低血圧",
  "胃腸の調子がすぐれない",
  "不眠症",
  "やせられない",
  "やせてもリバウンドしてしまう",
  "ボディラインが崩れた",
  "すぐに結果がでないと嫌",
  "ストレス過多",
  "1人ではがんばれない",
  "結果がでるか不安",
  "運動が嫌い",
  "自信がない",
  "家族の理解がえられない",
  "その他",
];

const MOTIVATION_OPTIONS = [
  { value: "1", label: "1（興味がない）" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5（何としてでも受講したい）" },
];

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  lineName: "",
  birthdate: "",
  region: "",
  job: "",
  familyCount: "",
  height: "",
  weight: "",
  birth: "",
  medicalHistory: "",
  menstruation: "",
  bowel: "",
  bowelOther: "",
  concerns: [],
  concernsOther: "",
  motivation: "",
  debt: "",
  paidCourseAgreement: false,
  slotId: "",
  cancelAgreement: false,
  otherNotes: "",
};

function RequiredMark() {
  return <span className="text-red-500 text-xs ml-1">※</span>;
}

function FieldLabel({
  children,
  required = false,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor={htmlFor}>
      {children}
      {required && <RequiredMark />}
    </label>
  );
}

export default function ConsultationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    fetch(`/api/slots?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data);
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlotsLoading(false);
      });
  }, []);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  function toggleConcern(concern: string) {
    setFormData((prev) => {
      const next = prev.concerns.includes(concern)
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern];
      return { ...prev, concerns: next };
    });
    if (errors.concerns) {
      setErrors((prev) => ({ ...prev, concerns: "" }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "お名前を入力してください";
    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }
    if (!formData.phone.trim()) newErrors.phone = "電話番号を入力してください";
    if (!formData.lineName.trim()) newErrors.lineName = "LINE登録名を入力してください";
    if (!formData.birthdate.trim()) newErrors.birthdate = "生年月日を入力してください";
    if (!formData.region) newErrors.region = "お住まい地域を選択してください";
    if (!formData.job) newErrors.job = "現在のお仕事を選択してください";
    if (!formData.familyCount) newErrors.familyCount = "家族の人数を選択してください";
    if (!formData.height.trim()) newErrors.height = "身長を入力してください";
    if (!formData.weight.trim()) newErrors.weight = "体重を入力してください";
    if (!formData.birth) newErrors.birth = "ご出産経験を選択してください";
    if (!formData.medicalHistory.trim()) newErrors.medicalHistory = "既往歴を入力してください（無し、でも可）";
    if (!formData.menstruation) newErrors.menstruation = "生理について選択してください";
    if (!formData.bowel) newErrors.bowel = "お通じについて選択してください";
    if (formData.concerns.length === 0) newErrors.concerns = "お悩みを1つ以上選択してください";
    if (!formData.motivation) newErrors.motivation = "受講意欲を選択してください";
    if (!formData.debt) newErrors.debt = "債務整理・自己破産の経験を選択してください";
    if (!formData.paidCourseAgreement) newErrors.paidCourseAgreement = "有料講座ご案内への同意が必要です";
    if (!formData.slotId) newErrors.slotId = "ご相談希望日時を選択してください";
    if (!formData.cancelAgreement) newErrors.cancelAgreement = "キャンセル・リスケ不可への同意が必要です";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error
      const firstErrorEl = document.querySelector("[data-error='true']");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitStatus("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitStatus("error");
        setErrorMessage(data.error || "送信中にエラーが発生しました。もう一度お試しください。");
      }
    } catch {
      setSubmitStatus("error");
      setErrorMessage("通信エラーが発生しました。インターネット接続をご確認のうえ、もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitStatus === "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">送信完了</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            お申し込みありがとうございます。<br />
            メールにてお申込内容をお送りしましたので<br />
            迷惑メールフォルダも含めご確認のお願いします。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-teal-700 rounded-t-xl px-6 py-5 text-white">
          <p className="text-xs font-medium text-teal-200 mb-1">ワンボディウェルネス</p>
          <h1 className="text-base font-bold leading-snug">
            【ワンボディウェルネス】<br />
            個別相談 お申し込みフォーム
          </h1>
        </div>

        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 border-t-0 px-5 py-6 mb-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            以下のフォームに必要事項をご記入のうえ、ご希望の日時をお選びください。<br />
            <span className="text-red-500">※</span> は必須項目です。
          </p>
        </div>

        {submitStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-0">

          {/* ---- SECTION: 基本情報 ---- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-6 mb-4 space-y-5">
            <h2 className="text-sm font-bold text-teal-700 border-b border-gray-100 pb-2">基本情報</h2>

            {/* お名前 */}
            <div data-error={!!errors.name}>
              <FieldLabel required htmlFor="name">お名前（本名）</FieldLabel>
              <input
                id="name"
                type="text"
                className={`form-input ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="例：山田 花子"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                autoComplete="name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* メールアドレス */}
            <div data-error={!!errors.email}>
              <FieldLabel required htmlFor="email">メールアドレス</FieldLabel>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="例：example@email.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
                inputMode="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* 電話番号 */}
            <div data-error={!!errors.phone}>
              <FieldLabel required htmlFor="phone">電話番号</FieldLabel>
              <input
                id="phone"
                type="tel"
                className={`form-input ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="例：090-1234-5678"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* LINE名 */}
            <div data-error={!!errors.lineName}>
              <FieldLabel required htmlFor="lineName">
                3日間講座 LINEオープンチャット登録名
              </FieldLabel>
              <input
                id="lineName"
                type="text"
                className={`form-input ${errors.lineName ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="LINEオープンチャットでのお名前"
                value={formData.lineName}
                onChange={(e) => updateField("lineName", e.target.value)}
              />
              {errors.lineName && <p className="text-red-500 text-xs mt-1">{errors.lineName}</p>}
            </div>

            {/* 生年月日 */}
            <div data-error={!!errors.birthdate}>
              <FieldLabel required htmlFor="birthdate">ご生年月日（西暦）</FieldLabel>
              <input
                id="birthdate"
                type="text"
                className={`form-input ${errors.birthdate ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="例：1980年5月15日"
                value={formData.birthdate}
                onChange={(e) => updateField("birthdate", e.target.value)}
                inputMode="numeric"
              />
              {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
            </div>

            {/* お住まい地域 */}
            <div data-error={!!errors.region}>
              <FieldLabel required htmlFor="region">お住まい地域</FieldLabel>
              <select
                id="region"
                className={`form-input ${errors.region ? "border-red-400 focus:ring-red-400" : ""}`}
                value={formData.region}
                onChange={(e) => updateField("region", e.target.value)}
              >
                <option value="">選択してください</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>

            {/* 現在のお仕事 */}
            <div data-error={!!errors.job}>
              <FieldLabel required>現在のお仕事</FieldLabel>
              <div className="space-y-1 mt-1">
                {JOBS.map((j) => (
                  <label key={j} className="form-radio-label">
                    <input
                      type="radio"
                      name="job"
                      value={j}
                      checked={formData.job === j}
                      onChange={() => updateField("job", j)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0"
                    />
                    <span>{j}</span>
                  </label>
                ))}
              </div>
              {errors.job && <p className="text-red-500 text-xs mt-1">{errors.job}</p>}
            </div>

            {/* 家族人数 */}
            <div data-error={!!errors.familyCount}>
              <FieldLabel required htmlFor="familyCount">ご家族の人数（同居）</FieldLabel>
              <select
                id="familyCount"
                className={`form-input ${errors.familyCount ? "border-red-400 focus:ring-red-400" : ""}`}
                value={formData.familyCount}
                onChange={(e) => updateField("familyCount", e.target.value)}
              >
                <option value="">選択してください</option>
                {FAMILY_COUNTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {errors.familyCount && <p className="text-red-500 text-xs mt-1">{errors.familyCount}</p>}
            </div>
          </div>

          {/* ---- SECTION: 身体情報 ---- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-6 mb-4 space-y-5">
            <h2 className="text-sm font-bold text-teal-700 border-b border-gray-100 pb-2">身体・健康について</h2>

            {/* 身長 */}
            <div data-error={!!errors.height}>
              <FieldLabel required htmlFor="height">現在の身長（cm）</FieldLabel>
              <input
                id="height"
                type="text"
                className={`form-input ${errors.height ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="例：158"
                value={formData.height}
                onChange={(e) => updateField("height", e.target.value)}
                inputMode="decimal"
              />
              {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
            </div>

            {/* 体重 */}
            <div data-error={!!errors.weight}>
              <FieldLabel required htmlFor="weight">現在の体重（kg）</FieldLabel>
              <input
                id="weight"
                type="text"
                className={`form-input ${errors.weight ? "border-red-400 focus:ring-red-400" : ""}`}
                placeholder="例：54"
                value={formData.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                inputMode="decimal"
              />
              {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
            </div>

            {/* 出産経験 */}
            <div data-error={!!errors.birth}>
              <FieldLabel required>ご出産経験</FieldLabel>
              <div className="space-y-1 mt-1">
                {["はい、あります", "いいえ、ありません"].map((v) => (
                  <label key={v} className="form-radio-label">
                    <input
                      type="radio"
                      name="birth"
                      value={v}
                      checked={formData.birth === v}
                      onChange={() => updateField("birth", v)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0"
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
              {errors.birth && <p className="text-red-500 text-xs mt-1">{errors.birth}</p>}
            </div>

            {/* 既往歴 */}
            <div data-error={!!errors.medicalHistory}>
              <FieldLabel required htmlFor="medicalHistory">
                既往歴（腰痛・膝痛など）
              </FieldLabel>
              <p className="text-xs text-gray-400 mb-1">「無し」でも入力してください</p>
              <textarea
                id="medicalHistory"
                className={`form-input resize-none ${errors.medicalHistory ? "border-red-400 focus:ring-red-400" : ""}`}
                rows={3}
                placeholder="例：腰痛あり、高血圧（服薬中）　/ 無し"
                value={formData.medicalHistory}
                onChange={(e) => updateField("medicalHistory", e.target.value)}
              />
              {errors.medicalHistory && <p className="text-red-500 text-xs mt-1">{errors.medicalHistory}</p>}
            </div>

            {/* 生理 */}
            <div data-error={!!errors.menstruation}>
              <FieldLabel required>生理について</FieldLabel>
              <div className="space-y-1 mt-1">
                {["順調", "不調", "閉経"].map((v) => (
                  <label key={v} className="form-radio-label">
                    <input
                      type="radio"
                      name="menstruation"
                      value={v}
                      checked={formData.menstruation === v}
                      onChange={() => updateField("menstruation", v)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0"
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
              {errors.menstruation && <p className="text-red-500 text-xs mt-1">{errors.menstruation}</p>}
            </div>

            {/* お通じ */}
            <div data-error={!!errors.bowel}>
              <FieldLabel required>お通じについて</FieldLabel>
              <div className="space-y-1 mt-1">
                {BOWEL_OPTIONS.map((v) => (
                  <label key={v} className="form-radio-label">
                    <input
                      type="radio"
                      name="bowel"
                      value={v}
                      checked={formData.bowel === v}
                      onChange={() => updateField("bowel", v)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0"
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
              {errors.bowel && <p className="text-red-500 text-xs mt-1">{errors.bowel}</p>}
            </div>

            {/* お通じ その他詳細 */}
            {formData.bowel === "その他" && (
              <div>
                <FieldLabel htmlFor="bowelOther">お通じ「その他」詳細</FieldLabel>
                <textarea
                  id="bowelOther"
                  className="form-input resize-none"
                  rows={2}
                  placeholder="詳しくご記入ください"
                  value={formData.bowelOther}
                  onChange={(e) => updateField("bowelOther", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ---- SECTION: お悩み ---- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-6 mb-4 space-y-5">
            <h2 className="text-sm font-bold text-teal-700 border-b border-gray-100 pb-2">お悩みについて</h2>

            {/* お悩みチェックボックス */}
            <div data-error={!!errors.concerns}>
              <FieldLabel required>思い当たるお悩み（複数選択可）</FieldLabel>
              <div className="space-y-1 mt-1">
                {CONCERNS_OPTIONS.map((c) => (
                  <label key={c} className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.concerns.includes(c)}
                      onChange={() => toggleConcern(c)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0 mt-0.5"
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
              {errors.concerns && <p className="text-red-500 text-xs mt-1">{errors.concerns}</p>}
            </div>

            {/* お悩み その他詳細 */}
            {formData.concerns.includes("その他") && (
              <div>
                <FieldLabel htmlFor="concernsOther">お悩み「その他」詳細</FieldLabel>
                <textarea
                  id="concernsOther"
                  className="form-input resize-none"
                  rows={2}
                  placeholder="詳しくご記入ください"
                  value={formData.concernsOther}
                  onChange={(e) => updateField("concernsOther", e.target.value)}
                />
              </div>
            )}

            {/* 受講意欲 */}
            <div data-error={!!errors.motivation}>
              <FieldLabel required>実践講座を受講したい気持ち（1〜5）</FieldLabel>
              <div className="space-y-1 mt-1">
                {MOTIVATION_OPTIONS.map((m) => (
                  <label key={m.value} className="form-radio-label">
                    <input
                      type="radio"
                      name="motivation"
                      value={m.value}
                      checked={formData.motivation === m.value}
                      onChange={() => updateField("motivation", m.value)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0"
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
              {errors.motivation && <p className="text-red-500 text-xs mt-1">{errors.motivation}</p>}
            </div>

            {/* 債務整理 */}
            <div data-error={!!errors.debt}>
              <FieldLabel required>債務整理・自己破産の経験</FieldLabel>
              <div className="space-y-1 mt-1">
                {["はい、あります", "いいえ、ありません"].map((v) => (
                  <label key={v} className="form-radio-label">
                    <input
                      type="radio"
                      name="debt"
                      value={v}
                      checked={formData.debt === v}
                      onChange={() => updateField("debt", v)}
                      className="accent-teal-600 w-4 h-4 flex-shrink-0"
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
              {errors.debt && <p className="text-red-500 text-xs mt-1">{errors.debt}</p>}
            </div>

            {/* 有料講座同意 */}
            <div data-error={!!errors.paidCourseAgreement}>
              <FieldLabel required>有料講座ご案内への同意</FieldLabel>
              <p className="text-sm text-gray-600 mb-2">実践講座のカリキュラムの内容やご説明とともに、有料講座のご案内をさせていただく場合があります。あらかじめご了承いただけますか？</p>
              <label className="form-checkbox-label mt-1">
                <input
                  type="checkbox"
                  checked={formData.paidCourseAgreement}
                  onChange={(e) => updateField("paidCourseAgreement", e.target.checked)}
                  className="accent-teal-600 w-4 h-4 flex-shrink-0 mt-0.5"
                />
                <span>はい、承知しています</span>
              </label>
              {errors.paidCourseAgreement && (
                <p className="text-red-500 text-xs mt-1">{errors.paidCourseAgreement}</p>
              )}
            </div>
          </div>

          {/* ---- SECTION: 相談日時 ---- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-6 mb-4 space-y-5">
            <h2 className="text-sm font-bold text-teal-700 border-b border-gray-100 pb-2">ご相談希望日時</h2>

            <p className="text-xs text-gray-500 leading-relaxed">
              ご相談はZoomまたはスタジオにて（千葉県柏市）対面でも可能です。
            </p>
            <div data-error={!!errors.slotId}>
              <FieldLabel required>ご希望の日時をお選びください</FieldLabel>
              {slotsLoading ? (
                <p className="text-sm text-gray-400 py-4 text-center">空き枠を読み込み中...</p>
              ) : slots.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                  現在、空き枠がありません。
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {slots.map((slot) => (
                    <label
                      key={slot.id}
                      className={`slot-radio-label ${formData.slotId === slot.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="slotId"
                        value={slot.id}
                        checked={formData.slotId === slot.id}
                        onChange={() => updateField("slotId", slot.id)}
                        className="accent-teal-600 w-4 h-4 flex-shrink-0"
                      />
                      <span>{slot.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.slotId && <p className="text-red-500 text-xs mt-1">{errors.slotId}</p>}
            </div>

            {/* キャンセル同意 */}
            <div data-error={!!errors.cancelAgreement}>
              <FieldLabel required>キャンセル・リスケ不可への同意</FieldLabel>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                お申し込み後の相談者様都合のキャンセル・日程変更はお受けできません。ご了承のうえお申し込みください。
              </p>
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.cancelAgreement}
                  onChange={(e) => updateField("cancelAgreement", e.target.checked)}
                  className="accent-teal-600 w-4 h-4 flex-shrink-0 mt-0.5"
                />
                <span>了承のうえ申し込む</span>
              </label>
              {errors.cancelAgreement && (
                <p className="text-red-500 text-xs mt-1">{errors.cancelAgreement}</p>
              )}
            </div>

            {/* その他ご心配ごと */}
            <div>
              <FieldLabel htmlFor="otherNotes">その他ご心配ごと</FieldLabel>
              <p className="text-xs text-gray-400 mb-1">任意</p>
              <textarea
                id="otherNotes"
                className="form-input resize-none"
                rows={3}
                placeholder="ご不明な点やご心配なことがあればご記入ください"
                value={formData.otherNotes}
                onChange={(e) => updateField("otherNotes", e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pb-8">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl text-white font-bold text-base
                transition-colors shadow-sm
                ${submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800"
                }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  送信中...
                </span>
              ) : (
                "申し込む"
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              送信後、メールにてお申込内容をお送りします。
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
