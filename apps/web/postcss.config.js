// Tailwind v4: the PostCSS integration moved to its own package, and autoprefixer is no
// longer needed — the Lightning CSS engine handles vendor prefixing internally.
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};
