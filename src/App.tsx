import { useState } from "react";

type ApiResponse = {
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
  fx: {
    USD_JPY: number;
  };
  monthlyTotalJPY: string;
};

const apiEndpoint = import.meta.env.VITE_API_ENDPOINT as string | undefined;

const App: React.FC = () => {
  const [storageGB, setStorageGB] = useState<number>(1000);
  const [putRequests, setPutRequests] = useState<number>(20000);
  const [getRequests, setGetRequests] = useState<number>(1500000);
  const [dataTransferGB, setDataTransferGB] = useState<number>(300);
  const [useFxRate, setUseFxRate] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);

    if (!apiEndpoint) {
      setError("API エンドポイント (VITE_API_ENDPOINT) が設定されていません。");
      return;
    }

    setLoading(true);
    try {
      const body = {
        storageGB,
        putRequests,
        getRequests,
        dataTransferGB,
        fetchFx: useFxRate,
      };

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error: ${res.status} ${text}`);
      }

      const data = (await res.json()) as ApiResponse;
      setResult(data);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        setError(`エラー: ${e.message}`);
      } else {
        setError("エラー: 予期しない問題が発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-purple-500 to-purple-700">
      {/* 画面全体は縦スクロール。中央寄せ(items-center)はやめる */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* タイトルと注釈 */}
        <header className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            S3 コスト見積もりツール
          </h1>
          <p className="text-sm text-purple-100">
            ※ このツールは S3 Standard（標準ストレージ）の料金見積もりに対応しています。
          </p>
          <p className="text-sm text-purple-100 mt-1">
            リージョン：<span className="font-semibold">ap-northeast-1（東京）</span>
          </p>
        </header>

        {/* 入力フォーム */}
        <section className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 space-y-8">
          {/* 1. ストレージ容量 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              ① ストレージ容量（GB / 月）
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              S3 Standard に保存するデータ量（GB）
            </label>
            <p className="text-xs text-gray-500 mb-1">
              例：1TB 保存する場合は「1000」と入力します。
            </p>
            <input
              type="number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-right"
              value={storageGB}
              min={0}
              onChange={(e) => setStorageGB(Number(e.target.value || "0"))}
            />
          </div>

          {/* 2. リクエスト数 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              ② リクエスト数（回 / 月）
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  アップロード回数（PUT / 書き込み系）
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  ファイルをアップロード・保存・コピーした回数です。
                </p>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-right"
                  value={putRequests}
                  min={0}
                  onChange={(e) => setPutRequests(Number(e.target.value || "0"))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ダウンロード回数（GET / 読み取り系）
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  ダウンロードや一覧取得など、S3 から読み取る回数です。
                </p>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-right"
                  value={getRequests}
                  min={0}
                  onChange={(e) => setGetRequests(Number(e.target.value || "0"))}
                />
              </div>
            </div>
          </div>

          {/* 3. データ転送量 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              ③ データ転送量（GB / 月）
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              インターネット向けデータ転送量（GB）
            </label>
            <p className="text-xs text-gray-500 mb-1">
              インターネットや別リージョンへ出ていく転送量です。同一リージョン内の転送は無料なので含めなくてOKです。
            </p>
            <input
              type="number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-right"
              value={dataTransferGB}
              min={0}
              onChange={(e) => setDataTransferGB(Number(e.target.value || "0"))}
            />
          </div>

          {/* 為替レート */}
          <div className="flex items-center gap-2">
            <input
              id="useFxRate"
              type="checkbox"
              className="h-4 w-4"
              checked={useFxRate}
              onChange={(e) => setUseFxRate(e.target.checked)}
            />
            <label htmlFor="useFxRate" className="text-sm text-gray-700">
              為替レート（USD → JPY）をオンライン取得する
            </label>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-md bg-red-100 text-red-700 text-sm px-4 py-2">
              {error}
            </div>
          )}

          {/* ボタン */}
          <div className="text-center">
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-black px-10 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "計算中..." : "コストを計算"}
            </button>
          </div>
        </section>

        {/* 結果表示：フォームのすぐ下に配置 */}
        {result && (
          <section className="mt-8 bg-white/95 rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-4">結果</h2>

            <div className="space-y-1 text-sm">
              <p>
                為替レート: {result.fx.USD_JPY.toFixed(3)} 円 / USD
              </p>
              <p>合計（月額・USD）: {result.monthlyTotalUSD}</p>
              <p>合計（月額・JPY）: {result.monthlyTotalJPY} 円</p>
            </div>

            <h3 className="mt-4 mb-2 text-sm font-semibold">
              内訳（USD の目安）
            </h3>
            <div className="border rounded-md divide-y text-sm">
              <div className="px-4 py-2">
                ストレージ: {result.breakdown.storageUSD}
              </div>
              <div className="px-4 py-2">
                リクエスト: {result.breakdown.requestsUSD}
              </div>
              <div className="px-4 py-2">
                データ転送: {result.breakdown.transferUSD}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
