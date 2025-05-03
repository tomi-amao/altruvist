import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    {
      pattern: /^bg-indicator-(red|blue|green|yellow|purple|pink|indigo|orange|teal|cyan)$/,
    },
  ],
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.hide-number-spinner': {
          '&::-webkit-inner-spin-button': { display: 'none' },
          '&::-webkit-outer-spin-button': { display: 'none' },
          '-moz-appearance': 'textfield',
        },
        '.font-header': {
          fontFamily: ['Poppins', 'regular'].join(', '),
        },
        '.font-primary': {
          fontFamily: ['Poppins', 'light'].join(', '),
        },
      });
    },
  ],
} satisfies Config;
