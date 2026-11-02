import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

// ルートの間接依存ではなく、実際のNuxtサーバーと同じH3を検証する。
const serverRequire = createRequire(import.meta.resolve('@nuxt/nitro-server'))

export default defineConfig({
  test: {
    projects: [
      ...['unit', 'd1'].map((name) => ({
        resolve: {
          alias: {
            '~': fileURLToPath(new URL('./app', import.meta.url)),
            '~~': fileURLToPath(new URL('.', import.meta.url)),
            '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
            h3: serverRequire.resolve('h3'),
          },
        },
        test: {
          name,
          environment: 'node',
          include: [`tests/${name}/**/*.test.ts`],
          clearMocks: true,
        },
      })),
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts'],
          clearMocks: true,
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
              // Nitro・Cloudflareの開発環境を起動せず、ローカルD1に接続しない。
              overrides: {
                dev: false,
                nitro: { preset: 'node-server' },
                // 開発中のNuxtが使う生成ファイルをテストで上書きしない。
                buildDir: fileURLToPath(new URL('./.nuxt/test', import.meta.url)),
              },
            },
          },
        },
      }),
    ],
  },
})
