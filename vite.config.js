import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages（プロジェクトページ）用の公開パス。
// リポジトリ名を変えたら、ここも '/新しい名前/' に変更してください。
const REPO_BASE = '/kakeibo/'

// 開発(npm run dev)は '/'、本番ビルド/プレビューは REPO_BASE を使う。
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? REPO_BASE : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '実感家計簿',
        short_name: '家計簿',
        description: '一日にいくら使ったかを手入力して「実感」する家計簿',
        lang: 'ja',
        theme_color: '#0f766e',
        background_color: '#f1f5f9',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
}))
