import FormKitVariants from '@formkit/themes/tailwindcss'

export default {
  content: [
    './components/**/*.{html,js,ts,vue}',
    './layouts/**/*.{html,js,ts,vue}',
    './pages/**/*.{html,js,ts,vue}',
    './app.vue',
    './node_modules/@formkit/themes/dist/tailwindcss/genesis/index.cjs',
  ],
  plugins: [FormKitVariants],
}
