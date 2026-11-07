export default defineNuxtRouteMiddleware((to, from) => {
  // 今回はメニューから各メニューページへの移動だけを対象にする。
  const destinations = ['/', '/crowd', '/exhibitions', '/teams']
  to.meta.pageTransition =
    from.path === '/menu' && destinations.includes(to.path)
      ? { name: 'page-fade', mode: 'out-in' }
      : false
})
