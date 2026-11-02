import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: [
    '@fontsource/noto-sans-jp/400.css',
    '@fontsource/noto-sans-jp/500.css',
    '@fontsource/noto-sans-jp/700.css',
    '~/assets/css/main.css',
  ],
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      title: 'KCS Navi | 三田祭 展示ガイド',
      meta: [
        {
          name: 'description',
          content: 'KCSの展示を、もっと楽しむ。ブースマップと班紹介、混雑状況をチェック。',
        },
        { name: 'theme-color', content: '#f4f1e9' },
      ],
    },
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: false,
      nodeCompat: true,
      dev: {
        // Nuxt開発時もD1を使い、Wranglerのマイグレーション・プレビューと同じDBを開く。
        // 起動時のマイグレーションやシード投入は行わず、開発者が手動で実行する。
        configPath: fileURLToPath(new URL('./wrangler.jsonc', import.meta.url)),
        persistDir: '.wrangler/state/v3',
      },
    },
  },
  typescript: { strict: true },
})
