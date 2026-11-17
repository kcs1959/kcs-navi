// @serwist/nuxt が 'vue' と '@vue/runtime-core' の両方に ComponentCustomProperties を
// 宣言するとモジュールIDが分離し、vue-i18n が 'vue' にのみ付加する $t の型が
// コンポーネントインスタンスから参照できなくなる。(@serwist/nuxt + @nuxtjs/i18n の相互作用)
// このため '@vue/runtime-core' 側にも $t を補完して、テンプレートの $t を型安全に保つ。
import type { Composer } from 'vue-i18n'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /** テンプレートで使えるグローバル翻訳関数（vue-i18n の globalInjection 相当）。 */
    $t: Composer['t']
  }
}
