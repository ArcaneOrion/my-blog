import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arcane: {
          bg: '#fbfaf7',
          'bg-deep': '#f2efe8',
          'bg-secondary': '#ffffff',
          text: '#17181c',
          'text-secondary': '#5f6670',
          'text-dim': '#8d94a0',
          math: '#1d4ed8',
          ai: '#be185d',
          quant: '#0f766e',
          neuro: '#7c3aed',
          border: '#d7dde7',
          danger: '#d62839',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['EB Garamond', 'Cormorant Garamond', 'Noto Serif SC', 'serif'],
        serif: ['EB Garamond', 'Cormorant Garamond', 'serif'],
        display: ['Italiana', 'Cormorant Garamond', 'Georgia', 'serif'],
        italic: ['Cormorant Garamond', 'EB Garamond', 'serif'],
      },
    },
  },
  plugins: [typography],
};
