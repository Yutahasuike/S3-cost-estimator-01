import { useState } from "react";
import "./App.css";

type ApiResult = {
  fx?: { USD_JPY: number };
  monthlyTotalUSD: string;
  monthlyTotalJPY: string;
  breakdown: {
    storageUSD: string;
    requestsUSD: string;
    transferUSD: string;
  };
};

function App() {
  const API_ENDPOINT = import.meta.env.VITE_S3_API_ENDPOINT as string;

  const [storageGB, setStorageGB] = useState<number>(1000);
  const [putRequests, setPutRequests] = useState<number>(20000);
  const [getRequests, setGetRequests] = useState<number>(1500000);
  const [dataTransferGB, setDataTransferGB] = useState<number>(300);
  const [fetchFx, setFetchFx] = useState<boolean>(true);

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNumberChange =
    (setter: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      setter(Number.isNaN(v) ? 0 : v);
    };

  const calculate = async () => {
    if (!API_ENDPOINT) {
      setError("API のエンドポイントが設定されていません（VITE_S3_API_ENDPOINT）");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        storageGB,
        putRequests,
        getRequests,
        dataTransferGB,
        fetchFx,
      };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`API エラー: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as ApiResult;
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* 入力カード */}
      <div className="card">
        <h2 className="title">S3 コスト見積もりツール</h2>
        <p className="subtitle">※ このツールは S3 Standard（標準ストレージ）の料金見積もりに対応しています。</p>

        {/* ① ストレージ */}
        <div className="section">
          <div className="section-title">① ストレージ容量（GB / 月）</div>
          <label className="label">S3 Standard に保存するデータ量（GB）</label>
          <input
            className="input-box"
            type="number"
            value={storageGB}
            onChange={handleNumberChange(setStorageGB)}
          />
          <p className="helper-text">例：1TB 保存する場合は「1000」と入力します。</p>
        </div>

        {/* ② リクエスト */}
        <div className="section">
          <div className="section-title">② リクエスト数（回 / 月）</div>

          <label className="label">アップロード回数（PUT / 書き込み系）</label>
          <input
            className="input-box"
            type="number"
            value={putRequests}
            onChange={handleNumberChange(setPutRequests)}
          />
          <p className="helper-text">
            ファイルをアップロード・保存・コピーした回数です。
          </p>

          <label className="label">ダウンロード回数（GET / 読み取り系）</label>
          <input
            className="input-box"
            type="number"
            value={getRequests}
            onChange={handleNumberChange(setGetRequests)}
          />
          <p className="helper-text">
            ファイルのダウンロードや一覧取得など、S3 から読み取る回数です。
          </p>
        </div>

        {/* ③ データ転送 */}
        <div className="section">
          <div className="section-title">③ データ転送量（GB / 月）</div>

          <label className="label">インターネット向けデータ転送量（GB）</label>
          <input
            className="input-box"
            type="number"
            value={dataTransferGB}
            onChange={handleNumberChange(setDataTransferGB)}
          />
          <p className="helper-text">
            インターネットや別リージョンへ出ていく転送量です。同一リージョン内の転送は無料なので含めなくて OK です。
          </p>
        </div>

        {/* オプション */}
        <div className="section">
          <label>
            <input
              type="checkbox"
              checked={fetchFx}
              onChange={(e) => setFetchFx(e.target.checked)}
            />{" "}
            為替レート（USD → JPY）をオンライン取得する
          </label>
        </div>

        <button className="calc-button" onClick={calculate} disabled={loading}>
          {loading ? "計算中..." : "コストを計算"}
        </button>

        {error && <p className="error-text">⚠ {error}</p>}
      </div>

      {/* 結果カード */}
      {result && (
        <div className="result-card">
          <h3 className="section-title">結果</h3>
          <p>為替レート：{result.fx?.USD_JPY} 円 / USD</p>
          <p>合計（月額・USD）：{result.monthlyTotalUSD}</p>
          <p>合計（月額・JPY）：{result.monthlyTotalJPY} 円</p>

          <h4 style={{ marginTop: 20 }}>内訳（USD の目安）</h4>
          <div className="breakdown-box">ストレージ：{result.breakdown.storageUSD}</div>
          <div className="breakdown-box">リクエスト：{result.breakdown.requestsUSD}</div>
          <div className="breakdown-box">データ転送：{result.breakdown.transferUSD}</div>
        </div>
      )}
    </div>
  );
}

export default App;
