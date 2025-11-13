// src/App.tsx
import { useState } from "react";
import "./App.css";

type GlacierClass = "GLACIER" | "DEEP_ARCHIVE";
type RetrievalTier = "Standard" | "Bulk";

type S3Inputs = {
  location: string;
  storageGB: {
    GLACIER: number;
    DEEP_ARCHIVE: number;
  };
  requests: {
    PUT: number;
    GET: number;
  };
  dataTransferOutGB: number;
  glacierRetrieval: {
    class: GlacierClass;
    tier: RetrievalTier;
    retrievalGB: number;
    requests: number;
  };
  earlyDeletion: {
    class: GlacierClass;
    gb: number;
    actualDaysStored: number;
  };
  fetchFx: boolean;
};

const defaultInputs: S3Inputs = {
  location: "Asia Pacific (Tokyo)",
  storageGB: {
    GLACIER: 1000,
    DEEP_ARCHIVE: 2000,
  },
  requests: {
    PUT: 20000,
    GET: 1500000,
  },
  dataTransferOutGB: 300,
  glacierRetrieval: {
    class: "DEEP_ARCHIVE",
    tier: "Standard",
    retrievalGB: 250,
    requests: 1200,
  },
  earlyDeletion: {
    class: "DEEP_ARCHIVE",
    gb: 500,
    actualDaysStored: 30,
  },
  fetchFx: true,
};

const API_ENDPOINT = import.meta.env.VITE_S3_API_ENDPOINT as string;

function App() {
  const [form, setForm] = useState<S3Inputs>(defaultInputs);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- 入力用ハンドラ（checked 問題が出ないよう全部分ける） ----
  const handleStorageChange =
    (klass: GlacierClass) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setForm((prev) => ({
        ...prev,
        storageGB: {
          ...prev.storageGB,
          [klass]: value,
        },
      }));
    };

  const handleRequestChange =
    (kind: "PUT" | "GET") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setForm((prev) => ({
        ...prev,
        requests: {
          ...prev.requests,
          [kind]: value,
        },
      }));
    };

  const handleNumberField =
    (field: "dataTransferOutGB") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleRetrievalNumber =
    (field: "retrievalGB" | "requests") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setForm((prev) => ({
        ...prev,
        glacierRetrieval: {
          ...prev.glacierRetrieval,
          [field]: value,
        },
      }));
    };

  const handleEarlyDeletionNumber =
    (field: "gb" | "actualDaysStored") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setForm((prev) => ({
        ...prev,
        earlyDeletion: {
          ...prev.earlyDeletion,
          [field]: value,
        },
      }));
    };

  const handleRetrievalClassChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as GlacierClass;
    setForm((prev) => ({
      ...prev,
      glacierRetrieval: {
        ...prev.glacierRetrieval,
        class: value,
      },
    }));
  };

  const handleRetrievalTierChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as RetrievalTier;
    setForm((prev) => ({
      ...prev,
      glacierRetrieval: {
        ...prev.glacierRetrieval,
        tier: value,
      },
    }));
  };

  const handleEarlyDeletionClassChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as GlacierClass;
    setForm((prev) => ({
      ...prev,
      earlyDeletion: {
        ...prev.earlyDeletion,
        class: value,
      },
    }));
  };

  const handleFetchFxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      fetchFx: e.target.checked,
    }));
  };

  // ---- 送信 ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!API_ENDPOINT) {
      setError("VITE_S3_API_ENDPOINT が設定されていません。");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: form }),
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

  const totals = result?.pickedUnitPricesUSD?.totals;

  return (
    <div className="app-root">
      <h1 className="app-title">S3 コスト見積もりツール</h1>

      <form className="card" onSubmit={handleSubmit}>
        <div className="field-group">
          <label>リージョン</label>
          <div>ap-northeast-1（東京） / {form.location}</div>
        </div>

        <hr />

        <h2 className="section-title">① ストレージ容量（GB / 月）</h2>
        <div className="field-row">
          <label>S3 Glacier Flexible Retrieval（GLACIER）</label>
          <input
            type="number"
            min={0}
            value={form.storageGB.GLACIER}
            onChange={handleStorageChange("GLACIER")}
          />
        </div>
        <div className="field-row">
          <label>S3 Glacier Deep Archive（DEEP_ARCHIVE）</label>
          <input
            type="number"
            min={0}
            value={form.storageGB.DEEP_ARCHIVE}
            onChange={handleStorageChange("DEEP_ARCHIVE")}
          />
        </div>

        <hr />

        <h2 className="section-title">② API リクエスト数（回 / 月）</h2>
        <div className="field-row">
          <label>PUT / COPY / POST</label>
          <input
            type="number"
            min={0}
            value={form.requests.PUT}
            onChange={handleRequestChange("PUT")}
          />
        </div>
        <div className="field-row">
          <label>GET / SELECT</label>
          <input
            type="number"
            min={0}
            value={form.requests.GET}
            onChange={handleRequestChange("GET")}
          />
        </div>

        <hr />

        <h2 className="section-title">③ データ転送量</h2>
        <div className="field-row">
          <label>インターネット向け転送量（GB / 月）</label>
          <input
            type="number"
            min={0}
            value={form.dataTransferOutGB}
            onChange={handleNumberField("dataTransferOutGB")}
          />
        </div>

        <hr />

        <h2 className="section-title">④ Glacier からのリストア</h2>
        <div className="field-row">
          <label>ストレージクラス</label>
          <select
            value={form.glacierRetrieval.class}
            onChange={handleRetrievalClassChange}
          >
            <option value="GLACIER">GLACIER（Flexible Retrieval）</option>
            <option value="DEEP_ARCHIVE">DEEP_ARCHIVE</option>
          </select>
        </div>
        <div className="field-row">
          <label>リストア Tier</label>
          <select
            value={form.glacierRetrieval.tier}
            onChange={handleRetrievalTierChange}
          >
            <option value="Standard">Standard</option>
            <option value="Bulk">Bulk</option>
          </select>
        </div>
        <div className="field-row">
          <label>リストア容量（GB）</label>
          <input
            type="number"
            min={0}
            value={form.glacierRetrieval.retrievalGB}
            onChange={handleRetrievalNumber("retrievalGB")}
          />
        </div>
        <div className="field-row">
          <label>リストアリクエスト数（回）</label>
          <input
            type="number"
            min={0}
            value={form.glacierRetrieval.requests}
            onChange={handleRetrievalNumber("requests")}
          />
        </div>

        <hr />

        <h2 className="section-title">⑤ 早期削除（最低保持期間前に削除）</h2>
        <div className="field-row">
          <label>クラス</label>
          <select
            value={form.earlyDeletion.class}
            onChange={handleEarlyDeletionClassChange}
          >
            <option value="GLACIER">GLACIER</option>
            <option value="DEEP_ARCHIVE">DEEP_ARCHIVE</option>
          </select>
        </div>
        <div className="field-row">
          <label>削除対象容量（GB）</label>
          <input
            type="number"
            min={0}
            value={form.earlyDeletion.gb}
            onChange={handleEarlyDeletionNumber("gb")}
          />
        </div>
        <div className="field-row">
          <label>実際に保存していた日数</label>
          <input
            type="number"
            min={0}
            value={form.earlyDeletion.actualDaysStored}
            onChange={handleEarlyDeletionNumber("actualDaysStored")}
          />
        </div>

        <hr />

        <div className="field-row">
          <label>
            <input
              type="checkbox"
              checked={form.fetchFx}
              onChange={handleFetchFxChange}
            />
            為替レート（USD → JPY）をオンライン取得する
          </label>
        </div>

        {error && <div className="error-box">エラー: {error}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "計算中..." : "コストを計算"}
        </button>
      </form>

      {result && (
        <div className="card result-card">
          <h2 className="section-title">結果</h2>

          <p>
            <strong>為替レート:</strong>{" "}
            {result.fx?.USD_JPY?.toFixed
              ? result.fx.USD_JPY.toFixed(3)
              : result.fx?.USD_JPY}{" "}
            円 / USD
          </p>

          <p>
            <strong>合計（月額・USD）:</strong> {result.monthlyTotalUSD}
          </p>
          <p>
            <strong>合計（月額・JPY）:</strong> {result.monthlyTotalJPY} 円
          </p>

          {totals && (
            <>
              <h3 className="section-subtitle">内訳（USD）</h3>
              <ul className="totals-list">
                <li>ストレージ: {totals.storage_USD}</li>
                <li>リクエスト: {totals.requests_USD}</li>
                <li>転送量: {totals.dataTransferOut_USD}</li>
                <li>リストア: {totals.glacierRetrieval_USD}</li>
                <li>早期削除ペナルティ: {totals.earlyDeletionPenalty_USD}</li>
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
