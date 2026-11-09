export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === '/menu' && from.path !== '/menu' && from.matched.length > 0) {
    to.meta.pageTransition = { name: 'menu', mode: 'out-in' }
    return
  }

  // 今回はメニューから各メニューページへの移動だけを対象にする。
  const destinations = ['/', '/crowd', '/exhibitions', '/teams']
  to.meta.pageTransition =
    from.path === '/menu' && destinations.includes(to.path)
      ? { name: 'page-fade', mode: 'out-in' }
      : false
})
