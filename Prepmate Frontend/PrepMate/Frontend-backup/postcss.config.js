export default {
  plugins: {
    '@tailwindcss/postcss': {}, // This is the fix for the error you're seeing
    autoprefixer: {},
  },
}