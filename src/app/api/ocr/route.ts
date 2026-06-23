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
    console.log("Vision API response:", JSON.stringify(visionData, null, 2));
    const ocrText = visionData.responses?.[0]?.fullTextAnnotation?.text;
    console.log("OCR text:", ocrText);

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
記載内容を解析し、指定されたJSONスキーマに従って構造化してください。

# データ抽出と計算の最重要ルール
1. 【アンカーの絶対視】 レシートの「合計金額（お預り金額・お釣りを除く最終的な支払額）」を絶対的な正解として重み付けしてください。
2. 【計算の検証】 各商品の金額（割引適用後）の合計 ＋ 消費税 が、必ず「合計金額」と一致するようにデータの辻褄を合わせてください。
3. 【個数割引の吸収】 店舗によって「まとめ買い割引」の表記は異なります。割引行を見つけた場合は、それを独立した項目にせず、対象となる商品の \`amount\` から減算し、合計金額と一致するように調整してください。

# 出力形式
必ず以下のJSONフォーマットのみを出力してください。
※重要: \`calculation_log\` を必ずJSONの一番最初に配置し、そこで「各商品の合計額 - 割引額 + 消費税 = 合計金額」になるか計算の過程を記述して検証してください。

{
  "calculation_log": "合計金額と一致するかどうかの計算過程と検証メモ（文字列）",
  "store": "店名（読み取れない場合はnull）",
  "date": "YYYY-MM-DD（読み取れない場合はnull）",
  "items": [
    {
      "name": "商品名（正規化・クレンジング済）",
      "unit_price": 単価（不明な場合はnull）,
      "quantity": 数量（不明な場合は1）,
      "amount": その商品の最終金額（値引き適用後）
    }
  ],
  "subtotal": 小計金額（整数の数値、不明な場合はnull）,
  "tax": 消費税額（整数の数値、不明な場合はnull）,
  "total": 最終的な支払合計金額（整数の数値）
}

# OCRテキスト
${ocrText}`,
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
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}