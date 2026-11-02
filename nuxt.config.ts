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
    // Production must explicitly select a data source; an omitted D1 binding must
    // never silently replace real visitor records with disposable demo data.
    dataMode: process.env.NUXT_DATA_MODE || (process.env.NODE_ENV === 'development' ? 'demo' : ''),
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3001',
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
    // Ordinary Nuxt development uses the in-memory demo repository. Only the
    // developer's explicit Wrangler invocation may create/open a local D1 file.
    // Nitro's Cloudflare preset otherwise automatically creates a D1 proxy in dev.
    preset: process.env.NODE_ENV === 'development' ? 'node-server' : 'cloudflare_module',
    cloudflare: { deployConfig: false, nodeCompat: true },
  },
  typescript: { strict: true },
})
