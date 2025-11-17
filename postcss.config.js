/** @type {import('postcss-load-config').Config} */
// NOTE: Must use CommonJS (module.exports) not ESM (export default) for Next.js 14 compatibility
// Using .js extension (not .mjs) ensures Next.js processes PostCSS correctly
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
