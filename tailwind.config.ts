import type { Config } from 'tailwindcss'


export default {
  darkMode: 'selector',
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors:{
      basePrimary: "#DDDDDD",
      basePrimaryDark: "#CCCCCC",
      basePrimaryLight: "#E8E8E8",
      baseSecondary: "#836953",
      accentPrimary: "#F5F5DC",
      dangerPrimary: "#B3261E",
      txtprimary: "#27B08B",
      txtsecondary: "#FFFFFF",
      midGrey: "#2E3130",
      altMidGrey: "#B0B0B0",
      lightGrey: "#D9D9D9",
      darkGrey: "#222221",
      darkRed: "#8C333A"
    },

    extend: {
      fontFamily: {
        header: ['Jomhuria', 'regular'], 
        primary: ['Inter', 'regular'], 
      },
      extend: {

        keyframes: {
          slideDown: {
            from: { height: '0px' },
            to: { height: 'var(--radix-accordion-content-height)' },
          },
          slideUp: {
            from: { height: 'var(--radix-accordion-content-height)' },
            to: { height: '0px' },
          },
        },
        animation: {
          slideDown: 'slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)',
          slideUp: 'slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

