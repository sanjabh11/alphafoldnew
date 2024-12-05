// tailwind.config.js
module.exports = {
  darkMode: 'class', // This enables dark mode with class strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for your protein viewer
        'protein-bg': {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        'protein-text': {
          light: '#333333',
          dark: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};