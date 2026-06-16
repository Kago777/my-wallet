"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X } from "lucide-react";

type ReceiptData = {
  store: string | null;
  date: string | null;
  items: { name: string; amount: number }[];
  total: number;
};

type Props = {
  onCapture: (data: ReceiptData) => void;
  onClose: () => void;
};

export default function ReceiptCamera({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"camera" | "loading">("camera");
  const [error, setError] = useState<string | null>(null);

  // カメラ停止
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // カメラ起動
  const startCamera = useCallback(async () => {
    try {
      console.log("カメラ起動開始");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      console.log("カメラ取得成功", stream);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("videoに接続完了");
      }
    } catch (err) {
      console.error("カメラエラー:", err);
      setError("カメラへのアクセスが拒否されました");
    }
  }, []);

  // マウント時にカメラ起動・アンマウント時に停止
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // 撮影 → OCR送信
  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 現在のフレームをcanvasに焼き付け（メモリ上のみ）
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    stopCamera();
    setPhase("loading");
    setError(null);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("画像の取得に失敗しました");
        setPhase("camera");
        startCamera();
        return;
      }

      const formData = new FormData();
      formData.append("receipt", blob, "receipt.jpg");

      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? "読み取りに失敗しました");
        }

        const data = await res.json();
        onCapture(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "読み取りに失敗しました");
        setPhase("camera");
        startCamera();
      }
    }, "image/jpeg", 0.9);
  }, [onCapture, startCamera, stopCamera]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#000" }}
    >
      {/* ヘッダー */}
      <div
        className="flex justify-between items-center p-4"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <p className="text-sm font-medium text-white">レシートを撮影</p>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          style={{ color: "var(--text-muted)" }}
        >
          <X size={20} />
        </button>
      </div>

      {/* カメラビュー */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* ガイド枠 */}
        <div
          className="absolute inset-8 rounded-lg pointer-events-none"
          style={{ border: "2px solid rgba(255,255,255,0.6)" }}
        />
        {/* ガイドテキスト */}
        <p
          className="absolute bottom-4 left-0 right-0 text-center text-xs"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          レシート全体が枠内に収まるように合わせてください
        </p>
      </div>

      {/* canvas（非表示・処理用） */}
      <canvas ref={canvasRef} className="hidden" />

      {/* フッター */}
      <div
        className="p-8 flex flex-col items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        {error && (
          <p className="text-sm" style={{ color: "var(--red-400)" }}>
            {error}
          </p>
        )}
        {phase === "camera" ? (
          <button
            onClick={capture}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-opacity active:opacity-70"
            style={{ background: "var(--emerald-500)" }}
          >
            <Camera size={24} color="#fff" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--emerald-500)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              読み取り中...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}