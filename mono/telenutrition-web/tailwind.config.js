const colors = require('tailwindcss/colors');
const defaultconfig = require('tailwindcss/defaultConfig');
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/modules/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: ['status-green', 'status-red', 'neutral', 'green', 'white', 'fs-green', 'fs-pale-green'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    boxShadow: {
      ...defaultconfig.theme.boxShadow,
      hi: 'var(--shadow-hi)',
      md: 'var(--shadow-md)',
      lo: 'var(--shadow-lo)',
      fl: 'var(--shadow)',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.8125rem', { lineHeight: '1rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.5rem' }],
      xl: ['1.25rem', { lineHeight: '2rem' }],
      '2xl': ['1.75rem', { lineHeight: '2.5rem' }],
      '3xl': ['2.37rem', { lineHeight: '3rem' }],
      '4xl': ['3.16rem', { lineHeight: '3.5rem' }],
      '5xl': ['3.75rem', { lineHeight: '2.5rem' }],
      '6xl': ['4.5rem', { lineHeight: '2.5rem' }],
      '7xl': ['6rem', { lineHeight: '2.5rem' }],
      '8xl': ['8rem', { lineHeight: '2.5rem' }],
    },
    colors: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent',
      gray: colors.gray,
      black: 'var(--black)',
      'f-very-dark-green': 'var(--f-very-dark-green)',
      'f-dark-green': 'var(--f-dark-green)',
      'f-light-green': 'var(--f-light-green)',
      'f-very-light-green': 'var(--f-very-light-green)',
      'f-grey': 'var(--f-grey)',
      'f-light-grey': 'var(--f-light-grey)',
      'f-orange': 'var(--f-orange)',
      'f-yellow': 'var(--f-yellow)',
      'f-red': 'var(--f-red)',
      'f-light-red': 'var(--f-light-red)',
      'f-blue': 'var(--f-blue)',
      'fs-green-600': 'var(--fs-green-600)',
      'fs-amber-100': 'var(--fs-amber-100)',
      'fs-default-green-reversed': 'var(--fs-default-green-reversed)',
      'purple-600': 'var(--purple-600)',
      white: 'var(--white)',
      border: 'var(--border)',
      input: 'hsl(var(--input))',
      ring: 'var(--status-green-200)',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },

      // START NEW COLORS
      'status-green': {
        100: 'var(--status-green-100)',
        200: 'var(--status-green-200)',
        400: 'var(--status-green-400)',
        700: 'var(--status-green-700)',
      },
      'status-amber': {
        100: 'var(--status-amber-100)',
        150: 'var(--status-amber-150)',
        200: 'var(--status-amber-200)',
        700: 'var(--status-amber-700)',
      },
      'status-red': {
        100: 'var(--status-red-100)',
        400: 'var(--status-red-400)',
        600: 'var(--status-red-600)',
        800: 'var(--status-red-800)',
      },

      neutral: {
        100: 'var(--neutral-100)',
        105: 'var(--neutral-105)',
        115: 'var(--neutral-115)',
        150: 'var(--neutral-150)',
        200: 'var(--neutral-200)',
        400: 'var(--neutral-400)',
        600: 'var(--neutral-600)',
        700: 'var(--neutral-700)',
        1500: 'var(--neutral-1500)',
      },
      'fs-green': {
        50: 'var(--fs-green-50)',
        100: 'var(--fs-green-100)',
        200: 'var(--fs-green-200)',
        300: 'var(--fs-green-300)',
        600: 'var(--fs-green-600)',
      },
      'fs-pale-green': {
        100: 'var(--fs-pale-green-100)',
        115: 'var(--fs-pale-green-115)',
        130: 'var(--fs-pale-green-130)',
      },
      blue: {
        100: 'var(--blue-100)',
        150: 'var(--blue-150)',
        200: 'var(--blue-200)',
        400: 'var(--blue-400)',
        600: 'var(--blue-600)',
        1000: 'var(--blue-1000)',
      },
      teal: {
        100: 'var(--teal-100)',
        125: 'var(--teal-125)',
        150: 'var(--teal-150)',
        200: 'var(--teal-200)',
        400: 'var(--teal-400)',
        700: 'var(--teal-700)',
      },
      green: {
        100: 'var(--green-100)',
        120: 'var(--green-120)',
        140: 'var(--green-140)',
        200: 'var(--green-200)',
        300: 'var(--fs-green-300)',
        600: 'var(--green-600)',
      },
      yellow: {
        100: 'var(--yellow-100)',
        120: 'var(--yellow-120)',
        130: 'var(--yellow-150)',
        200: 'var(--yellow-200)',
        500: 'var(--yellow-500)',
      },
      orange: {
        100: 'var(--orange-100)',
        150: 'var(--orange-150)',
        200: 'var(--orange-200)',
        300: 'var(--orange-300)',
        500: 'var(--orange-500)',
        900: 'var(--orange-900)',
      },
      rose: {
        100: 'var(--rose-100)',
        150: 'var(--rose-150)',
        200: 'var(--rose-200)',
        400: 'var(--rose-400)',
        700: 'var(--rose-700)',
        1100: 'var(--rose-1100)',
      },
      purple: {
        100: 'var(--purple-100)',
        150: 'var(--purple-150)',
        300: 'var(--purple-300)',
        600: 'var(--purple-600)',
        1000: 'var(--purple-1000)',
        1400: 'var(--purple-1400)',
      },
      // COMMON
      type: {
        primary: 'var(--neutral-1500)',
        secondary: 'var(--neutral-600)',
        disallowed: 'var(--neutral-400)',
        reversed: 'var(--white)',
        link: 'var(--blue-1000)',
        success: 'var(--status-green-700)',
        error: 'var(--status-red-800)',
        warning: 'var(--status-amber-700)'
      },
      'border-color': {
        light: 'var(--neutral-150)',
        default: 'var(--neutral-200)',
        hover: 'var(--neutral-400)',
      }
    },
    fontFamily: {
      sans: ['var(--font-atkinson)'],
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
    function ({ addVariant }) {
      addVariant('children', '& > *');
    },
    require('@tailwindcss/container-queries'),
    plugin(({ addComponents }) => {
      addComponents({
        ".heading-xxxxl": {
          "@apply text-8xl font-light": "",
        },
        ".heading-xxxl": {
          "@apply text-7xl font-medium": "",
        },
        ".heading-xxl": {
          "@apply text-6xl font-medium": "",
        },
        ".heading-xl": {
          "@apply text-5xl font-bold": "",
        },
        ".heading-l": {
          "@apply text-4xl font-bold": "",
        },
        ".heading-m": {
          "@apply text-3xl font-bold": "",
        },
        ".heading-s": {
          "@apply text-2xl font-bold": "",
        },
        ".heading-xs": {
          "@apply text-xl font-bold": "",
        },
        ".heading-xxs": {
          "@apply text-lg font-bold": "",
        },

        // ...rest of your typography
      });
    }),
  ],
};
