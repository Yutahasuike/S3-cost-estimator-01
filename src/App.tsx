// src/App.tsx
import { useState } from "react";
import "./App.css";

const API_ENDPOINT = import.meta.env.VITE_S3_API_ENDPOINT as string | undefined;

function App() {
  // ---- 入力 state ----
  const [storageGB, setStorageGB] = useState<number>(1000);
  const [putRequests, setPutRequests] = useState<number>(20000);
  const [getRequests, setGetRequests] = useState<number>(1500000);
  const [transferGB, setTransferGB] = useState<number>(300);
  const [useFxRate, setUseFxRate] = useState<boolean>(true);

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ---- API 呼び出し ----
  const calculateCost = async () => {
    setError(null);
    setResult(null);

    if (!API_ENDPOINT) {
      setError("VITE_S3_API_ENDPOINT が Amplify に設定されていません。");
      return;
    }

    const payload = {
      storageGB,
      putRequests,
      getRequests,
      dataTransferGB: transferGB,
      fetchFx: useFxRate,
    };

    setLoading(true);
    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }

      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "API 呼び出しに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const monthlyUSD = result?.monthlyTotalUSD;
  const monthlyJPY = result?.monthlyTotalJPY;
  const fxRate = result?.fx?.USD_JPY;
  const breakdown = result?.breakdown || result?.totals;

  return (
    <div className="app-root">
      {/* タイトル */}
      <h1 className="app-title">S3 コスト見積もりツール</h1>

      {/* 注釈（Standard 対応を明記） */}
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

      <div className="card">
        <div style={{ textAlign: "center", marginBottom: "12px", fontSize: "14px" }}>
          リージョン： ap-northeast-1（東京）
        </div>

        {/* ① ストレージ */}
        <h2 className="section-title">① ストレージ容量（GB / 月）</h2>
        <div className="field-row">
          <label>
            S3 Standard に保存するデータ量（GB）
            <div className="field-help">例：1TB → 1000 と入力します</div>
          </label>
          <input
            type="number"
            min={0}
            value={storageGB}
            onChange={(e) => setStorageGB(Number(e.target.value) || 0)}
          />
        </div>

        <hr />

        {/* ② リクエスト */}
        <h2 className="section-title">② リクエスト数（回 / 月）</h2>

        <div className="field-row">
          <label>
            アップロード回数（PUT / 書き込み）
            <div className="field-help">ファイルを保存・更新・コピーした回数です</div>
          </label>
          <input
            type="number"
            min={0}
            value={putRequests}
            onChange={(e) => setPutRequests(Number(e.target.value) || 0)}
          />
        </div>

        <div className="field-row">
          <label>
            ダウンロード回数（GET / 読み取り）
            <div className="field-help">ダウンロードや一覧取得など、S3 の読み取り回数です</div>
          </label>
          <input
            type="number"
            min={0}
            value={getRequests}
            onChange={(e) => setGetRequests(Number(e.target.value) || 0)}
          />
        </div>

        <hr />

        {/* ③ 転送量 */}
        <h2 className="section-title">③ データ転送量（GB / 月）</h2>
        <div className="field-row">
          <label>
            インターネット向けデータ転送量（GB）
            <div className="field-help">
              インターネットや別リージョンに出ていく転送量です。
              <br />
              同一リージョン内の転送は無料です。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={transferGB}
            onChange={(e) => setTransferGB(Number(e.target.value) || 0)}
          />
        </div>

        <hr />

        {/* 為替 */}
        <div className="field-row">
          <label>
            <input
              type="checkbox"
              checked={useFxRate}
              onChange={(e) => setUseFxRate(e.target.checked)}
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

      {/* 結果 */}
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
              <strong>月額（USD）:</strong> {monthlyUSD}
            </p>
          )}
          {monthlyJPY && (
            <p>
              <strong>月額（JPY）:</strong> {monthlyJPY} 円
            </p>
          )}

          <h3 className="section-subtitle">内訳（USD）</h3>
          <ul className="totals-list">
            {"storageUSD" in breakdown && <li>ストレージ: {breakdown.storageUSD}</li>}
            {"requestsUSD" in breakdown && <li>リクエスト: {breakdown.requestsUSD}</li>}
            {"transferUSD" in breakdown && <li>データ転送: {breakdown.transferUSD}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
