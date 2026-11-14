import type {
  PrecacheEntry,
  RouteMatchCallbackOptions,
  SerwistGlobalConfig,
  SerwistPlugin,
} from 'serwist'
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const WEEK = 7 * 24 * 60 * 60
const WARM_PAGES = ['/', '/menu', '/crowd', '/exhibitions', '/teams']
const CHECKIN_PAGES = ['/checkin', '/welcome']

let stale = false
const setStale = async (value: boolean) => {
  stale = value
  for (const client of await self.clients.matchAll()) client.postMessage({ type: 'stale', stale })
}
const staleNotifier: SerwistPlugin = {
  fetchDidSucceed: async ({ response }) => {
    void setStale(false)
    return response
  },
  cachedResponseWillBeUsed: async ({ cachedResponse }) => {
    if (cachedResponse) void setStale(true)
    return cachedResponse
  },
}

const pagesExpiration = new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: WEEK })
const pages = new NetworkFirst({
  cacheName: 'pages',
  networkTimeoutSeconds: 5,
  plugins: [pagesExpiration, staleNotifier],
})
const isNavigation = ({ request, sameOrigin }: RouteMatchCallbackOptions) =>
  sameOrigin && request.mode === 'navigate'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: (options) => isNavigation(options) && CHECKIN_PAGES.includes(options.url.pathname),
      handler: new NetworkOnly(),
    },
    { matcher: isNavigation, handler: pages },
    { method: 'POST', matcher: isNavigation, handler: new NetworkOnly() },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin && request.method === 'GET' && url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'api',
        networkTimeoutSeconds: 5,
        plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: WEEK }), staleNotifier],
      }),
    },
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.destination === 'font',
      handler: new CacheFirst({
        cacheName: 'fonts',
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 365 * 24 * 60 * 60 })],
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: '/offline', matcher: ({ request }) => request.mode === 'navigate' }],
  },
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    pagesExpiration
      .deleteCacheAndMetadata()
      .then(() =>
        Promise.allSettled(
          WARM_PAGES.map((url) =>
            Promise.all(pages.handleAll({ request: new Request(url), event })),
          ),
        ),
      ),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'stale?') event.source?.postMessage({ type: 'stale', stale })
})

serwist.addEventListeners()
