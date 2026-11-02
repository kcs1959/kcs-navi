import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Vue page filenames mirror public routes such as /teams and /checkin.
    'vue/multi-word-component-names': 'off',
    // Prettier closes empty Vue template elements, including HTML void elements.
    'vue/html-self-closing': [
      'warn',
      {
        html: { void: 'always', normal: 'always', component: 'always' },
        svg: 'always',
        math: 'always',
      },
    ],
  },
})
