import type { Config } from 'tailwindcss'


export default {
  darkMode: 'selector',
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    {
      pattern: /^bg-indicator-(red|blue|green|yellow|purple|pink|indigo|orange|teal|cyan)$/,
    }
  ],
  theme: {
    colors:{
      basePrimary: "#DDDDDD",
      basePrimaryDark: "#CCCCCC",
      basePrimaryLight: "#E8E8E8",
      baseSecondary: "#836953",
      accentPrimary: "#F5F5DC",
      dangerPrimary: "#B3261E",
      confirmPrimary: "#27B08B",
      txtprimary: "#27B08B",
      txtsecondary: "#FFFFFF",
      midGrey: "#2E3130",
      altMidGrey: "#B0B0B0",
      lightGrey: "#D9D9D9",
      darkGrey: "#222221",
      darkRed: "#8C333A",
      indicator: {
        red: '#F87171',      
        blue: '#60A5FA',     
        green: '#34D399',    
        yellow: '#FBBF24',   
        purple: '#A78BFA',   
        pink: '#F472B6',     
        indigo: '#818CF8',   
        orange: '#FB923C',   
        teal: '#2DD4BF',     
        cyan: '#22D3EE',     
      },
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
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.hide-number-spinner': {
          '&::-webkit-inner-spin-button': { display: 'none' },
          '&::-webkit-outer-spin-button': { display: 'none' },
          '-moz-appearance': 'textfield',
        },
      });
    },
  ],
} satisfies Config

