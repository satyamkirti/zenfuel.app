import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

// Semantic colour tokens are CSS variables (see globals.css) so light and dark themes are
// designed separately but used through one set of class names.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

/*
  ZenFuel palette: premium blue. Royal blue leads everywhere; light blue and white carry the
  page; a coordinated set of accents (cyan, teal, green, purple, violet, orange, yellow, pink)
  colours icons, metric cards and chart series. Teal and green are accents, never backgrounds.

    blue     royal #1265D8 (600) · bright #1877F2 (500) · sky #48A8F5 (400) · navy #092E70 (900)
    accents  teal #11BFA9 · cyan #2CC8E8 · purple #8B5CF6 · violet #A855F7 · orange #FF982F
             yellow #FFC83D · pink #F35C9B · green #22C77A · red #EF5350
    slate    blue-tinted neutrals: border #D7E6F8 · secondary text #60728C · ink #10254A
*/
const blue = {
  50: '#f3f8ff',
  100: '#e3efff',
  200: '#c5dcfc',
  300: '#95c2f9',
  400: '#48a8f5',
  500: '#1877f2',
  600: '#1265d8',
  700: '#0f52b4',
  800: '#0c4192',
  900: '#092e70',
  950: '#061d4a',
};
const sky = {
  50: '#f0f8ff',
  100: '#dff0fe',
  200: '#b8e0fc',
  300: '#7fc6f9',
  400: '#48a8f5',
  500: '#2b91e8',
  600: '#1877d0',
  700: '#155fa8',
  800: '#154f88',
  900: '#164270',
  950: '#0f2a4a',
};
const cyan = {
  50: '#ecfbfe',
  100: '#cff4fc',
  200: '#a2e8f8',
  300: '#67d8f0',
  400: '#2cc8e8',
  500: '#12abcf',
  600: '#0a87a8',
  700: '#0d6c88',
  800: '#12586f',
  900: '#13495d',
  950: '#062f3e',
};
const teal = {
  50: '#edfcf9',
  100: '#d1f7f0',
  200: '#a5eee2',
  300: '#6ee0cf',
  400: '#34cdb8',
  500: '#11bfa9',
  600: '#0b9a89',
  700: '#0b7b6f',
  800: '#0e625a',
  900: '#10514b',
  950: '#02312e',
};
const green = {
  50: '#ebfbf3',
  100: '#cff5e2',
  200: '#a3eac8',
  300: '#6ad9a8',
  400: '#3ccd8c',
  500: '#22c77a',
  600: '#16a463',
  700: '#138352',
  800: '#146744',
  900: '#13553a',
  950: '#05301f',
};
const purple = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
};
const violet = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
};
const orange = {
  50: '#fff6ec',
  100: '#ffe9d0',
  200: '#ffd0a1',
  300: '#ffb468',
  400: '#ffa94d',
  500: '#ff982f',
  600: '#ec7a14',
  700: '#c45e0c',
  800: '#9c4a10',
  900: '#7e3e11',
  950: '#441d05',
};
const yellow = {
  50: '#fffbeb',
  100: '#fff3c6',
  200: '#ffe68a',
  300: '#ffd65a',
  400: '#ffc83d',
  500: '#f5b014',
  600: '#d98b06',
  700: '#b46609',
  800: '#924f0e',
  900: '#78410f',
  950: '#452103',
};
const pink = {
  50: '#fef2f7',
  100: '#fde6f0',
  200: '#fccce1',
  300: '#f9a3c6',
  400: '#f67cad',
  500: '#f35c9b',
  600: '#e03a7d',
  700: '#c02762',
  800: '#9f2353',
  900: '#852148',
  950: '#520c26',
};
const red = {
  50: '#fef3f2',
  100: '#fde4e3',
  200: '#fbcdcb',
  300: '#f7a9a6',
  400: '#f37b78',
  500: '#ef5350',
  600: '#dc3a37',
  700: '#b92d2b',
  800: '#992928',
  900: '#7f2827',
  950: '#451110',
};
// Blue-tinted neutrals: light borders and text at the top, Blue Night surfaces at the bottom.
const slate = {
  50: '#f3f8ff',
  100: '#e8f0fa',
  200: '#d7e6f8',
  300: '#b5c8e0',
  400: '#8a9db8',
  500: '#60728c',
  600: '#4b5d78',
  700: '#34496a',
  800: '#1f3a66',
  900: '#132f5c',
  950: '#081836',
};
// Always-dark structural surfaces (sidebar, PIN screen, overlays): deep navy blue.
const navy = {
  600: '#1d4a99',
  700: '#123d85',
  800: '#0c3274',
  900: '#092e70',
  950: '#071a40',
};

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Class names are also defined in a few lib/utils modules (risk palette, plan colours).
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        'surface-3': token('surface-3'),
        line: token('line'),
        'line-strong': token('line-strong'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        muted: token('muted'),
        'on-brand': token('on-brand'),
        brand: {
          DEFAULT: token('brand'),
          strong: token('brand-strong'),
          text: token('brand-text'),
          soft: token('brand-soft'),
        },
        accent: {
          DEFAULT: token('accent'),
          text: token('accent-text'),
          soft: token('accent-soft'),
        },
        good: { DEFAULT: token('good'), soft: token('good-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        bad: { DEFAULT: token('bad'), soft: token('bad-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        // "zen" is the interface colour: royal blue.
        zen: blue,
        primary: blue,
        blue,
        cobalt: blue,
        indigo: blue,
        sky,
        cyan,
        teal,
        purple,
        violet,
        fuchsia: violet,
        orange,
        amber: yellow,
        yellow,
        emerald: green,
        green,
        lime: green,
        red,
        rose: pink,
        pink,
        slate,
        gray: slate,
        charcoal: navy,
        navy,
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        // Headings and large numbers.
        display: ['var(--font-display)', 'var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        card: '1.375rem',
        tile: '1rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        pop: 'var(--shadow-pop)',
        // Soft lift under primary buttons only.
        glow: 'var(--shadow-glow)',
      },
      backgroundImage: {
        // Primary buttons: ZenFuel blue, lighter at the top-left.
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--brand-hi)) 0%, rgb(var(--brand)) 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(var(--brand-strong)) 100%)',
        // Hero cards: royal blue with a sky-blue light in the corner.
        'hero-gradient': 'radial-gradient(120% 140% at 100% 0%, #48a8f5 0%, rgba(72,168,245,0) 55%), linear-gradient(150deg, #1877f2 0%, #1265d8 42%, #092e70 100%)',
        // Navigation: deep navy blue, darkest at the top so the logo's blue wordmark stays legible
        // (a deeper night version in dark mode).
        'sidebar-gradient': 'linear-gradient(180deg, #072359 0%, #092e70 30%, #063b91 100%)',
        'sidebar-gradient-night': 'linear-gradient(180deg, #0a2a66 0%, #071a40 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'rise': 'rise 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        rise: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
