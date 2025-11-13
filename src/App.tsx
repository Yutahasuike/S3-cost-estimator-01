// src/App.tsx
import { useState } from "react";
import "./App.css";

type FormState = {
  storageGB: number;         // S3 Standard ストレージ容量（GB / 月）
  uploadRequests: number;    // アップロード（書き込み）回数 / 月
  downloadRequests: number;  // ダウンロード（読み取り）回数 / 月
  dataTransferGB: number;    // インターネット向けデータ転送量（GB / 月）
  fetchFx: boolean;          // 為替レートをオンライン取得するか
};

const defaultForm: FormState = {
  storageGB: 1000,
  uploadRequests: 20000,
  downloadRequests: 1500000,
  dataTransferGB: 300,
  fetchFx: true,
};

// Amplify の環境変数（設定済みのものをそのまま使用）
const API_ENDPOINT = import.meta.env.VITE_S3_API_ENDPOINT as string;

function App() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 共通の number 用ハンドラ
  const handleNumberChange =
    (field: keyof Omit<FormState, "fetchFx">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setForm((prev) => ({
        ...prev,
        [field]: isNaN(value) ? 0 : value,
      }));
    };

  const handleFetchFxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      fetchFx: e.target.checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!API_ENDPOINT) {
      setError("VITE_S3_API_ENDPOINT が設定されていません。");
      return;
    }

    const payload = {
      storageGB: form.storageGB,
      putRequests: form.uploadRequests,
      getRequests: form.downloadRequests,
      dataTransferGB: form.dataTransferGB,
      fetchFx: form.fetchFx,
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
        throw new Error(
          `API error: ${resp.status} ${resp.statusText} - ${text}`
        );
      }

      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "API 呼び出しに失敗しました。");
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
      <h1 className="app-title">S3 Standard コスト見積もりツール</h1>

      <form className="card" onSubmit={handleSubmit}>
        <div className="field-group">
          <label>リージョン</label>
          <div>ap-northeast-1（東京）</div>
        </div>

        <hr />

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
            value={form.storageGB}
            onChange={handleNumberChange("storageGB")}
          />
        </div>

        <hr />

        {/* ② リクエスト数 */}
        <h2 className="section-title">② リクエスト数（回 / 月）</h2>
        <div className="field-row">
          <label>
            アップロード（書き込み）回数
            <div className="field-help">
              ファイルをアップロード・新規保存・コピーした回数です。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={form.uploadRequests}
            onChange={handleNumberChange("uploadRequests")}
          />
        </div>

        <div className="field-row">
          <label>
            ダウンロード（読み取り）回数
            <div className="field-help">
              ファイルのダウンロードや一覧取得など、S3 から読み取る回数です。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={form.downloadRequests}
            onChange={handleNumberChange("downloadRequests")}
          />
        </div>

        <hr />

        {/* ③ データ転送量 */}
        <h2 className="section-title">③ データ転送量（GB / 月）</h2>
        <div className="field-row">
          <label>
            インターネット向けデータ転送量（GB）
            <div className="field-help">
              インターネットや別リージョンへ出ていく転送量です。
              {" "}
              同じリージョン内の転送は無料なので含めなくてOKです。
            </div>
          </label>
          <input
            type="number"
            min={0}
            value={form.dataTransferGB}
            onChange={handleNumberChange("dataTransferGB")}
          />
        </div>

        <hr />

        {/* オプション：為替レート */}
        <div className="field-row">
          <label>
            <input
              type="checkbox"
              checked={form.fetchFx}
              onChange={handleFetchFxChange}
            />{" "}
            為替レート（USD → JPY）をオンライン取得する
          </label>
        </div>

        {error && <div className="error-box">エラー: {error}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "計算中..." : "コストを計算"}
        </button>
      </form>

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
}

export default App;
