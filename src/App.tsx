// App.tsx（タイトル＋注釈だけ変更したバージョン）

<div className="app-root">

  {/* ---- タイトル ---- */}
  <h1 className="app-title">S3 コスト見積もりツール</h1>

  {/* ---- 注釈 ---- */}
  <p style={{ textAlign: "center", marginTop: "-12px", color: "#333", fontSize: "14px" }}>
    ※ このツールは <strong>S3 Standard（標準ストレージ）</strong> の料金に対応しています
  </p>

  {/* ---- ここから下は今の UI そのまま ---- */}

  {/* リージョン情報など */}
  <div style={{ textAlign: "center", marginBottom: "12px", marginTop: "20px", fontSize: "14px" }}>
    リージョン： ap-northeast-1（東京）
  </div>

  <div className="card">

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
        value={storageGB}
        onChange={(e) => setStorageGB(Number(e.target.value))}
      />
    </div>
    <hr />

    {/* ② リクエスト */}
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
        value={putRequests}
        onChange={(e) => setPutRequests(Number(e.target.value))}
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
        value={getRequests}
        onChange={(e) => setGetRequests(Number(e.target.value))}
      />
    </div>
    <hr />

    {/* ③ データ転送量 */}
    <h2 className="section-title">③ データ転送量（GB / 月）</h2>
    <div className="field-row">
      <label>
        インターネット向けデータ転送量（GB）
        <div className="field-help">
          インターネットや別リージョンへ出ていく転送量です（同リージョン内は無料です）
        </div>
      </label>
      <input
        type="number"
        value={transferGB}
        onChange={(e) => setTransferGB(Number(e.target.value))}
      />
    </div>

    {/* チェックボックス */}
    <div className="field-row">
      <label>
        <input
          type="checkbox"
          checked={useFxRate}
          onChange={(e) => setUseFxRate(e.target.checked)}
        />
        為替レート（USD → JPY）をオンライン取得する
      </label>
    </div>

    {/* ボタン */}
    <button className="primary-button" onClick={calculateCost}>
      コストを計算
    </button>

  </div>

  {/* ---- 結果表示 ---- */}
  {result && (
    <div className="card result-card">
      {/* 結果の UI はそのまま使える */}
      …
    </div>
  )}

  {error && <div className="error-box">{error}</div>}
</div>
