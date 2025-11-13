import { useState } from "react";
import "./App.css";

function App() {
  const API_ENDPOINT = import.meta.env.VITE_S3_API_ENDPOINT;

  const [storageGB, setStorageGB] = useState(1000);
  const [putRequests, setPutRequests] = useState(20000);
  const [getRequests, setGetRequests] = useState(1500000);
  const [dataTransferGB, setDataTransferGB] = useState(300);
  const [fetchFx, setFetchFx] = useState(true);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = {
        storageGB: Number(storageGB),
        putRequests: Number(putRequests),
        getRequests: Number(getRequests),
        dataTransferGB: Number(dataTransferGB),
        fetchFx: fetchFx,
      };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("API エラー: " + res.status);
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* ======================= 入力フォーム ======================= */}
      <div className="card">
        <h2 className="title">S3 コスト見積もりツール</h2>
        <p className="subtitle">※ S3 Standard（標準ストレージ）に対応</p>

        {/* ① ストレージ */}
        <div className="section">
          <div className="section-title">① ストレージ容量（GB / 月）</div>
          <label className="label">保存するデータ量（GB）</label>
          <input
            className="input-box"
            type="number"
            value={storageGB}
            onChange={(e) => setStorageGB(e.target.value)}
          />
        </div>

        {/* ② リクエスト数 */}
        <div className="section">
          <div className="section-title">② リクエスト数（回 / 月）</div>

          <label className="label">PUT / COPY / POST / LIST（書き込み系）</label>
          <input
            className="input-box"
            type="number"
            value={putRequests}
            onChange={(e) => setPutRequests(e.target.value)}
          />

          <label className="label">GET（読み取り系）</label>
          <input
            className="input-box"
            type="number"
            value={getRequests}
            onChange={(e) => setGetRequests(e.target.value)}
          />
        </div>

        {/* ③ データ転送 */}
        <div className="section">
          <div className="section-title">③ データ転送量（GB / 月）</div>

          <label className="label">インターネット向けデータ転送量</label>
          <input
            className="input-box"
            type="number"
            value={dataTransferGB}
            onChange={(e) => setDataTransferGB(e.target.value)}
          />
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

      {/* ======================= 結果 ======================= */}
      {result && (
        <div className="result-card">
          <h3 className="section-title">結果</h3>

          <p>為替レート：{result.fx?.USD_JPY} 円 / USD</p>
          <p>合計（月額・USD）：{result.monthlyTotalUSD}</p>
          <p>合計（月額・JPY）：{result.monthlyTotalJPY} 円</p>

          <h4 style={{ marginTop: "20px" }}>内訳（USD の目安）</h4>

          <div className="breakdown-box">
            ストレージ：{result.breakdown.storageUSD}
          </div>
          <div className="breakdown-box">
            リクエスト：{result.breakdown.requestsUSD}
          </div>
          <div className="breakdown-box">
            データ転送：{result.breakdown.transferUSD}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
