// src/App.tsx
import React, { useState } from "react";
import "./App.css";

// API の URL（環境変数があれば優先、なければ直書き URL を使用）
const API_URL =
  import.meta.env.VITE_S3_API_ENDPOINT ??
  "https://dsa6vy1g4c.execute-api.ap-northeast-1.amazonaws.com/s3-calc";

const App: React.FC = () => {
  // ---- 入力値 ----
  const [storageGB, setStorageGB] = useState<number>(1000);        // 保存容量
  const [putRequests, setPutRequests] = useState<number>(20000);   // アップロード回数
  const [getRequests, setGetRequests] = useState<number>(1500000); // ダウンロード回数
  const [transferGB, setTransferGB] = useState<number>(300);       // データ転送量 (GB)
  const [useFxRate, setUseFxRate] = useState<boolean>(true);       // 為替レート取得

  // ---- 結果・状態 ----
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ---- API 呼び出し ----
  const calculateCost = async () => {
    setError(null);
    setResult(null);

    if (!API_URL) {
      setError("API_URL が設定されていません。VITE_S3_API_ENDPOINT を確認してください。");
      return;
    }

    // Lambda が期待している「フラットな JSON」
    const payload = {
      storageGB,
      putRequests,
      getRequests,
      dataTransferGB: transferGB,
      fetchFx: useFxRate,
    };

    setLoading(true);
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${resp.statusText} - ${text}`);
      }

      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      console.error("fetch error:", e);
      setError(e?.message ?? "API 呼び出しに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // 結果の取り出し
  const monthlyUSD = result?.monthlyTotalUSD;
  const monthlyJPY = result?.monthlyTotalJPY;
  const fxRate = result?.fx?.USD_JPY;
  const breakdown = result?.breakdown || result?.totals;

  return (
    <div className="app-root">
      {/* タイトル */}
      <h1 className="app-title">S3 コスト見積もりツール</h1>

      {/* 注釈：S3 Standard 対応 */}
      <p
        style={{
          textAlign: "center",
          marginTop: "-10px",
          marginBottom: "18px",
          fontSize: "14px",
          color: "#222",
        }}
      >
        ※ このツールは <strong>S3 Standard（標準ストレージ）</strong> の料金見積もりに対応しています。
      </p>

      {/* 入力フォーム */}
      <div className="card">
        <div
          style={{
            textAlign: "center",
            marginBottom: "12px",
            fontSize: "14px",
          }}
        >
          リージョン： ap-northeast-1（東京）
        </div>

        {/* ① ストレージ容量 */}
        <h2 className="section-title">① ストレージ容量（GB / 月）</h2>
        <div className="field-row">
          <label>
            S3 Standard に保存するデータ量（GB）
            <div className="field-help">
              例：1TB 保存する場合は「1000」と入力します。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={storageGB}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setStorageGB(Number(e.target.value) || 0)
            }
          />
        </div>

        <hr />

        {/* ② リクエスト数 */}
        <h2 className="section-title">② リクエスト数（回 / 月）</h2>

        <div className="field-row">
          <label>
            アップロード回数（書き込み回数）
            <div className="field-help">
              ファイルをアップロード・保存・コピーした回数です。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={putRequests}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPutRequests(Number(e.target.value) || 0)
            }
          />
        </div>

        <div className="field-row">
          <label>
            ダウンロード回数（読み取り回数）
            <div className="field-help">
              ファイルのダウンロードや一覧取得など、S3 から読み取る回数です。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={getRequests}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setGetRequests(Number(e.target.value) || 0)
            }
          />
        </div>

        <hr />

        {/* ③ データ転送量 */}
        <h2 className="section-title">③ データ転送量（GB / 月）</h2>
        <div className="field-row">
          <label>
            インターネット向けデータ転送量（GB）
            <div className="field-help">
              インターネットや別リージョンに出ていく転送量です。
              <br />
              同じリージョン内の転送は無料なので含めなくてOKです。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={transferGB}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTransferGB(Number(e.target.value) || 0)
            }
          />
        </div>

        <hr />

        {/* 為替レート */}
        <div className="field-row">
          <label>
            <input
              type="checkbox"
              checked={useFxRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUseFxRate(e.target.checked)
              }
            />{" "}
            為替レート（USD → JPY）をオンライン取得する
          </label>
        </div>

        {error && <div className="error-box">エラー: {error}</div>}

        <button
          className="primary-button"
          type="button"
          onClick={calculateCost}
          disabled={loading}
        >
          {loading ? "計算中..." : "コストを計算"}
        </button>
      </div>

      {/* 結果表示 */}
      {result && (
        <div className="card result-card">
          <h2 className="section-title">結果</h2>

          {fxRate && (
            <p>
              <strong>為替レート:</strong>{" "}
              {typeof fxRate === "number" ? fxRate.toFixed(3) : fxRate} 円 / USD
            </p>
          )}

          {monthlyUSD && (
            <p>
              <strong>合計（月額・USD）:</strong> {monthlyUSD}
            </p>
          )}

          {monthlyJPY && (
            <p>
              <strong>合計（月額・JPY）:</strong> {monthlyJPY} 円
            </p>
          )}

          {breakdown && (
            <>
              <h3 className="section-subtitle">内訳（USD の目安）</h3>
              <ul className="totals-list">
                {"storageUSD" in breakdown && (
                  <li>ストレージ: {breakdown.storageUSD}</li>
                )}
                {"requestsUSD" in breakdown && (
                  <li>リクエスト: {breakdown.requestsUSD}</li>
                )}
                {"transferUSD" in breakdown && (
                  <li>データ転送: {breakdown.transferUSD}</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
