import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("receipt") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    // ── Step 1: base64変換 ──
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // ── Step 2: Google Cloud Vision API でテキスト抽出 ──
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          }],
        }),
      }
    );

    const visionData = await visionRes.json();
    const ocrText = visionData.responses?.[0]?.fullTextAnnotation?.text;

    if (!ocrText) {
      return NextResponse.json({ error: "テキストを読み取れませんでした" }, { status: 422 });
    }

    // ── Step 3: Claude Haiku でJSON化 ──
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `以下はレシートからOCRで読み取ったテキストです。
商品名と金額を抽出してください。

# ルール
- 小計・消費税・合計・値引きはitemsに含めない
- 金額は整数（円）で返す
- 店名・日付が読み取れない場合はnullにする
- 必ずJSON形式のみで返し、前後に余分なテキストを含めないこと
- \`\`\`json などのマークダウンも含めないこと

# OCRテキスト
${ocrText}

# 出力形式
{
  "store": "店名 or null",
  "date": "YYYY-MM-DD or null",
  "items": [
    { "name": "商品名", "amount": 金額 }
  ],
  "total": 合計金額
}`,
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "JSON変換に失敗しました" }, { status: 500 });
    }

    // マークダウンが混入した場合のクリーニング
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);

  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}