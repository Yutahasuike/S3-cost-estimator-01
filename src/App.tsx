import { useState } from "react";
import "./App.css";

function App() {
  // -----------------------------
  // 入力フォームの state
  // -----------------------------
  const [storageGB, setStorageGB] = useState<number>(1000);
  const [putRequests, setPutRequests] = useState<number>(20000);
  const [getRequests, setGetRequests] = useState<number>(1500000);
  const [dataTransferGB, setDataTransferGB] = useState<number>(300);
  const [fetchFx, setFetchFx] = useState<boolean>(true);

  // -----------------------------
  // 結果の state
  // -----------------------------
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const API = import.meta.env.VITE_API_ENDPOINT;

  // -----------------------------
  // API 呼び出し
  // -----------------------------
  const handleCalculate = async () => {
    setError(null);
    if (!API) {
      setError("エラー：API エンドポイント（VITE_API_ENDPOINT）が設定されていません。");
      return;
    }

    try {
      const body = {
        storageGB,
        putRequests,
        getRequests,
        dataTransferGB,
        fetchFx,
      };

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("API 呼び出しに失敗しました");

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("通信エラー：API に接続できませんでした。");
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-full bg-gradient-to-b from-purple-400 via-purple-500 to-purple-700 pb-24">
      <main className="max-w-3xl mx-auto px-4 pt-12">

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center text-white mb-4">
          S3 コスト見積もりツール
        </h1>

        <p className="text-center text-white mb-6 text-sm">
          ※ このツールは S3 Standard（標準ストレージ）の料金見積もりに対応しています。
        </p>

        <div className="bg-white shadow-xl rounded-xl p-8 mb-12">

          <p className="text-gray-600 text-sm text-center mb-6">
            リージョン： ap-northeast-1（東京）
          </p>

          {/* ① ストレージ */}
          <section className="mb-8">
            <h2 className="font-bold text-lg mb-2">① ストレージ容量（GB / 月）</h2>
            <p className="text-sm text-gray-600 mb-2">
              S3 Standard に保存するデータ量（GB）
            </p>

            <input
              type="number"
              value={storageGB}
              onChange={(e) => setStorageGB(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />
          </section>

          {/* ② リクエスト数 */}
          <section className="mb-8">
            <h2 className="font-bold text-lg mb-2">② リクエスト数（回 / 月）</h2>

            <p className="mt-2 text-sm text-gray-600">アップロード回数（PUT / 書き込み系）</p>
            <input
              type="number"
              value={putRequests}
              onChange={(e) => setPutRequests(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />

            <p className="mt-3 text-sm text-gray-600">ダウンロード回数（GET / 読み取り系）</p>
            <input
              type="number"
              value={getRequests}
              onChange={(e) => setGetRequests(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />
          </section>

          {/* ③ データ転送量 */}
          <section className="mb-8">
            <h2 className="font-bold text-lg mb-2">③ データ転送量（GB / 月）</h2>

            <p className="text-sm text-gray-600">
              インターネット向けデータ転送量（GB）
            </p>

            <input
              type="number"
              value={dataTransferGB}
              onChange={(e) => setDataTransferGB(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />

            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                checked={fetchFx}
                onChange={(e) => setFetchFx(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">為替レート（USD → JPY）をオンライン取得する</label>
            </div>
          </section>

          {/* ボタン */}
          <button
            onClick={handleCalculate}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
          >
            コストを計算
          </button>

          {/* エラー */}
          {error && (
            <p className="mt-4 text-red-600 text-center bg-red-100 p-2 rounded">
              {error}
            </p>
          )}

        </div>

        {/* 結果 */}
        {result && (
          <div className="bg-white shadow-xl rounded-xl p-8 mb-12">
            <h2 className="text-xl font-bold mb-4">結果</h2>

            <p className="text-gray-700 text-sm mb-1">
              為替レート: {result.fx?.USD_JPY} 円 / USD
            </p>
            <p className="text-gray-700 text-sm mb-1">
              合計（月額・USD）：{result.monthlyTotalUSD}
            </p>
            <p className="text-gray-700 text-sm mb-4">
              合計（月額・JPY）：{result.monthlyTotalJPY} 円
            </p>

            <details className="mt-4 cursor-pointer">
              <summary className="font-semibold text-gray-700 mb-2">内訳（USD）</summary>
              <div className="mt-2 border p-3 rounded">
                <p>ストレージ: {result.breakdown?.storageUSD}</p>
                <p>リクエスト: {result.breakdown?.requestsUSD}</p>
                <p>データ転送: {result.breakdown?.transferUSD}</p>
              </div>
            </details>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
