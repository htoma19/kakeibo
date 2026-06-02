# 実感家計簿

一日にいくら使ったかを手入力で記録して、支出を「実感」するためのスマホ向け家計簿アプリ（PWA）。
データはすべてスマホ内（ブラウザの IndexedDB）に保存され、サーバーには送信されません。

## 技術構成

- React + Vite
- IndexedDB（`idb-keyval`）にローカル保存
- Chart.js（`react-chartjs-2`）でグラフ表示
- `vite-plugin-pwa` でホーム画面追加 / オフライン対応

## 開発の始め方

```bash
npm install      # 初回のみ
npm run dev      # 開発サーバー起動（http://localhost:5173）
```

iPhone の実機で試すには、PC と iPhone を同じ Wi-Fi につなぎ、
`npm run dev -- --host` で表示される `http://192.168.x.x:5173` を Safari で開きます。

## ビルドと公開

```bash
npm run build    # dist/ に本番ファイルを出力
npm run preview  # ビルド結果をローカル確認
```

`dist/` を GitHub Pages / Netlify / Vercel などの静的ホスティングに置けば公開できます。
GitHub Pages のプロジェクトページに置く場合は `vite.config.js` の `base` を
`'/リポジトリ名/'` に変更してください。

## データについて

- 保存先はスマホ内（ブラウザの IndexedDB）。クラウド同期はなし（1台で完結）。
- iOS はブラウザの保存領域を消すことがあるため、**設定画面から定期的にエクスポート**してください。
- 「ホーム画面に追加」すると消えにくくなります。
