/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Notion-inspired warm neutral palette
        'notion-blue': '#0075de',
        'notion-blue-hover': '#005bab',
        'notion-blue-light': '#62aef0',
        'notion-blue-bg': '#f2f9ff',
        'warm-white': '#f6f5f4',
        'warm-dark': '#31302e',
        'warm-gray-300': '#a39e98',
        'warm-gray-500': '#615d59',
        'warm-gray-700': '#31302e',
        'near-black': 'rgba(0,0,0,0.95)',
        'whisper-border': 'rgba(0,0,0,0.1)',
        'whisper-border-light': 'rgba(0,0,0,0.06)',
        'teal-accent': '#2a9d99',
        'green-accent': '#1aae39',
        'orange-accent': '#dd5b00',
        'pink-accent': '#ff64c8',
        // Dark mode colors
        'dark-bg': '#1e1e1e',
        'dark-surface': '#252526',
        'dark-border': 'rgba(255,255,255,0.1)',
        'dark-text': '#d4d4d4',
        'dark-text-muted': '#8c8c8c',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'notion-card': 'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px',
        'notion-deep': 'rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px',
        'toolbar': 'rgba(0,0,0,0.05) 0px 1px 2px, rgba(0,0,0,0.03) 0px 2px 6px',
        'dropdown': 'rgba(0,0,0,0.08) 0px 4px 12px, rgba(0,0,0,0.04) 0px 8px 24px',
      },
      borderRadius: {
        'notion': '4px',
        'notion-card': '12px',
        'notion-large': '16px',
      },
      fontSize: {
        'micro': ['12px', { lineHeight: '1.33', letterSpacing: '0.125px' }],
        'caption': ['14px', { lineHeight: '1.43' }],
        'nav': ['15px', { lineHeight: '1.33' }],
      },
    },
  },
  plugins: [],
}
