旧　APP.tsx
// src/App.tsx
import React, { useState } from "react";

type ApiResult = {
  inputs: {
    storageGB: number;
    putRequests: number;
    getRequests: number;
    dataTransferGB: number;
    fetchFx: boolean;
  };
  unitPricesUSD: {
    storage_per_GB_month_USD: string;
    put_per_request_USD: string;
    get_per_request_USD: string;
    dataTransfer_per_GB_USD: string;
  };
  breakdown: {
    storageUSD: string;
    requestsUSD: string;
    transferUSD: string;
  };
  monthlyTotalUSD: string;
  fx: { USD_JPY: number };
  monthlyTotalJPY: string;
};

const App: React.FC = () => {
  const [storageGB, setStorageGB] = useState<number>(1000);
  const [putRequests, setPutRequests] = useState<number>(20000);
  const [getRequests, setGetRequests] = useState<number>(1500000);
  const [transferGB, setTransferGB] = useState<number>(300);
  const [useFxRate, setUseFxRate] = useState<boolean>(true);

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

const endpoint = import.meta.env.VITE_S3_API_ENDPOINT as string | undefined;

  const calculateCost = async () => {
    setError(null);
    setResult(null);

    if (!endpoint) {
      setError("API エンドポイント (VITE_API_ENDPOINT) が設定されていません。");
      return;
    }

    setLoading(true);
    try {
      const body = {
        storageGB,
        putRequests,
        getRequests,
        dataTransferGB: transferGB,
        fetchFx: useFxRate,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} / ${text}`);
      }

      const data = (await res.json()) as ApiResult;
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(`Failed to fetch: ${e.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // Number() で文字列→数値に変換（ビルドエラー対策）
  const handleNumberChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(Number(e.target.value));
    };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #a58adf 0%, #6f4bd8 40%, #5c3cc5 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 16px 80px", // 下に 80px 余白
        boxSizing: "border-box",
        overflowY: "auto", // 常にスクロール可能
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* タイトルカード */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: "24px",
            padding: "32px 32px 40px",
            boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
            marginBottom: "40px",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              marginBottom: "8px",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            S3 コスト見積もりツール
          </h1>
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#555",
              marginBottom: "16px",
            }}
          >
            ※ このツールは{" "}
            <strong>S3 Standard（標準ストレージ）</strong> の料金見積もりに対応しています。
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#666",
              marginBottom: "24px",
            }}
          >
            リージョン：<strong>ap-northeast-1（東京）</strong>
          </p>

          {/* 入力フォーム */}
          <section style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "8px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              ① ストレージ容量（GB / 月）
            </h2>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              S3 Standard に保存するデータ量（GB）
            </label>
            <p style={{ fontSize: "12px", color: "#666", marginTop: 0 }}>
              例：1TB 保存する場合は <code>1000</code> と入力します。
            </p>
            <input
              type="number"
              value={storageGB}
              onChange={handleNumberChange(setStorageGB)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </section>

          <section style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "8px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              ② リクエスト数（回 / 月）
            </h2>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                アップロード回数（PUT / 書き込み系）
              </label>
              <p style={{ fontSize: "12px", color: "#666", marginTop: 0 }}>
                ファイルをアップロード・保存・コピーした回数です。
              </p>
              <input
                type="number"
                value={putRequests}
                onChange={handleNumberChange(setPutRequests)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ダウンロード回数（GET / 読み取り系）
              </label>
              <p style={{ fontSize: "12px", color: "#666", marginTop: 0 }}>
                ダウンロードや一覧取得など、S3 から読み取る回数です。
              </p>
              <input
                type="number"
                value={getRequests}
                onChange={handleNumberChange(setGetRequests)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                }}
              />
            </div>
          </section>

          <section style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "8px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              ③ データ転送量（GB / 月）
            </h2>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              インターネット向けデータ転送量（GB）
            </label>
            <p style={{ fontSize: "12px", color: "#666", marginTop: 0 }}>
              インターネットや別リージョンへ出ていく転送量です。同一リージョン内の転送は無料なので含めなくてOKです。
            </p>
            <input
              type="number"
              value={transferGB}
              onChange={handleNumberChange(setTransferGB)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </section>

          <section style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={useFxRate}
                onChange={(e) => setUseFxRate(e.target.checked)}
                style={{ marginRight: "6px" }}
              />
              為替レート（USD → JPY）をオンライン取得する
            </label>
          </section>

          {error && (
            <div
              style={{
                backgroundColor: "#ffe2e2",
                color: "#b40000",
                padding: "8px 10px",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              エラー: {error}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button
              onClick={calculateCost}
              disabled={loading}
              style={{
                backgroundColor: "#111",
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                padding: "10px 40px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "計算中..." : "コストを計算"}
            </button>
          </div>
        </div>

        {/* 結果カード */}
        {result && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: "24px",
              padding: "24px 32px 32px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
              marginBottom: "40px", // 一番下にも余白
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "12px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              結果
            </h2>

            <p style={{ fontSize: "14px", marginBottom: "4px" }}>
              為替レート: {result.fx.USD_JPY.toFixed(3)} 円 / USD
            </p>
            <p style={{ fontSize: "14px", marginBottom: "4px" }}>
              合計（月額・USD）：<strong>{result.monthlyTotalUSD}</strong>
            </p>
            <p style={{ fontSize: "14px", marginBottom: "10px" }}>
              合計（月額・JPY）：<strong>{result.monthlyTotalJPY} 円</strong>
            </p>

            <h3
              style={{
                fontSize: "15px",
                marginBottom: "6px",
                marginTop: "16px",
              }}
            >
              内訳（USD の目安）
            </h3>
            <div
              style={{
                borderRadius: "14px",
                border: "2px solid #000",
                overflow: "hidden",
                fontSize: "14px",
              }}
            >
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #000" }}>
                ストレージ: {result.breakdown.storageUSD}
              </div>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #000" }}>
                リクエスト: {result.breakdown.requestsUSD}
              </div>
              <div style={{ padding: "8px 12px" }}>
                データ転送: {result.breakdown.transferUSD}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
