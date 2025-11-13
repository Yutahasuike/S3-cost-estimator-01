// src/App.tsx
import { useState } from "react";

const API_ENDPOINT = import.meta.env.VITE_S3_API_ENDPOINT as string;

type ApiResult = {
  monthlyTotalUSD: string;
  monthlyTotalJPY: string;
  pickedUnitPricesUSD: any;
};

function App() {
  const [form, setForm] = useState({
    glacierGB: 1000,
    deepArchiveGB: 2000,
    putReq: 20000,
    getReq: 1500000,
    doutGB: 300,
    retrievalClass: "DEEP_ARCHIVE",
    retrievalTier: "Standard",
    retrievalGB: 250,
    retrievalReq: 1200,
    earlyClass: "DEEP_ARCHIVE",
    earlyGB: 500,
    earlyDays: 30,
    fetchFx: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  // 入力値変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : // 数値入力は number に、それ以外(セレクトなど)は文字列のまま
            (e.target as HTMLInputElement).type === "number"
          ? Number(value)
          : value,
    }));
  };

  // フォーム送信 → Lambda 呼び出し
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Lambda 側の inputs と同じ形で payload を作る
      const payload = {
        inputs: {
          location: "Asia Pacific (Tokyo)",
          storageGB: {
            GLACIER: form.glacierGB,
            DEEP_ARCHIVE: form.deepArchiveGB,
          },
          requests: {
            PUT: form.putReq,
            GET: form.getReq,
          },
          dataTransferOutGB: form.doutGB,
          glacierRetrieval: {
            class: form.retrievalClass,
            tier: form.retrievalTier,
            retrievalGB: form.retrievalGB,
            requests: form.retrievalReq,
          },
          earlyDeletion: {
            class: form.earlyClass,
            gb: form.earlyGB,
            actualDaysStored: form.earlyDays,
          },
          fetchFx: form.fetchFx,
        },
      };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>
      <h1>S3 コールドストレージ自動見積もり</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        {/* ストレージ容量 */}
        <fieldset>
          <legend>ストレージ容量（GB）</legend>
          <label>
            Glacier (Flexible Retrieval)
            <input
              type="number"
              name="glacierGB"
              value={form.glacierGB}
              onChange={handleChange}
              min={0}
            />
          </label>
          <br />
          <label>
            Glacier Deep Archive
            <input
              type="number"
              name="deepArchiveGB"
              value={form.deepArchiveGB}
              onChange={handleChange}
              min={0}
            />
          </label>
        </fieldset>

        {/* リクエスト数 */}
        <fieldset>
          <legend>API リクエスト</legend>
          <label>
            PUT / COPY / POST 回数
            <input
              type="number"
              name="putReq"
              value={form.putReq}
              onChange={handleChange}
              min={0}
            />
          </label>
          <br />
          <label>
            GET 回数
            <input
              type="number"
              name="getReq"
              value={form.getReq}
              onChange={handleChange}
              min={0}
            />
          </label>
        </fieldset>

        {/* データ転送量 */}
        <fieldset>
          <legend>データ転送量</legend>
          <label>
            インターネット向け転送 (GB)
            <input
              type="number"
              name="doutGB"
              value={form.doutGB}
              onChange={handleChange}
              min={0}
            />
          </label>
        </fieldset>

        {/* リストア条件 */}
        <fieldset>
          <legend>Glacier からの復元</legend>
          <label>
            クラス
            <select
              name="retrievalClass"
              value={form.retrievalClass}
              onChange={handleChange}
            >
              <option value="GLACIER">GLACIER (Flexible Retrieval)</option>
              <option value="DEEP_ARCHIVE">DEEP_ARCHIVE</option>
            </select>
          </label>
          <br />
          <label>
            ティア
            <select
              name="retrievalTier"
              value={form.retrievalTier}
              onChange={handleChange}
            >
              <option value="Standard">Standard</option>
              <option value="Bulk">Bulk</option>
              <option value="Expedited">Expedited (GLACIERのみ)</option>
            </select>
          </label>
          <br />
          <label>
            復元データ量 (GB)
            <input
              type="number"
              name="retrievalGB"
              value={form.retrievalGB}
              onChange={handleChange}
              min={0}
            />
          </label>
          <br />
          <label>
            復元リクエスト数
            <input
              type="number"
              name="retrievalReq"
              value={form.retrievalReq}
              onChange={handleChange}
              min={0}
            />
          </label>
        </fieldset>

        {/* 早期削除ペナルティ */}
        <fieldset>
          <legend>早期削除</legend>
          <label>
            クラス
            <select
              name="earlyClass"
              value={form.earlyClass}
              onChange={handleChange}
            >
              <option value="GLACIER">GLACIER</option>
              <option value="DEEP_ARCHIVE">DEEP_ARCHIVE</option>
            </select>
          </label>
          <br />
          <label>
            削除対象容量 (GB)
            <input
              type="number"
              name="earlyGB"
              value={form.earlyGB}
              onChange={handleChange}
              min={0}
            />
          </label>
          <br />
          <label>
            実際に保存した日数
            <input
              type="number"
              name="earlyDays"
              value={form.earlyDays}
              onChange={handleChange}
              min={0}
            />
          </label>
        </fieldset>

        {/* 為替 */}
        <label>
          為替レートをオンライン取得する
          <input
            type="checkbox"
            name="fetchFx"
            checked={form.fetchFx}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "試算中..." : "見積もり実行"}
        </button>
      </form>

      {/* エラー表示 */}
      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>エラー: {error}</p>
      )}

      {/* 結果表示 */}
      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2>見積もり結果</h2>
          <p>月額合計（USD）: {result.monthlyTotalUSD}</p>
          <p>月額合計（JPY）: {result.monthlyTotalJPY}</p>

          <details>
            <summary>詳細（JSON）</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result.pickedUnitPricesUSD, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default App;
