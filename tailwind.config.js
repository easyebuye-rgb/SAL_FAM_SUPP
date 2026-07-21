/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1C2521',
          soft: '#4A5751'
        },
        paper: {
          DEFAULT: '#FAFAF7',
          dim: '#F1F0E9'
        },
        brand: {
          50: '#EAF4F1',
          100: '#CDE6DE',
          200: '#9ECEC0',
          300: '#6BB3A0',
          400: '#3D9382',
          500: '#0F6B5C',
          600: '#0C5A4E',
          700: '#0A4A40',
          800: '#083A33',
          900: '#062B26'
        },
        gold: {
          50: '#FDF6E3',
          100: '#FAEAB8',
          200: '#F3D67D',
          300: '#EBC24A',
          400: '#E3A008',
          500: '#C68A06',
          600: '#A07005'
        },
        line: '#E4E1D6'
      },
      fontFamily: {
        display: ['"Sora"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(28,37,33,0.08), 0 1px 2px rgba(28,37,33,0.06)',
        lift: '0 12px 30px -10px rgba(15,107,92,0.25)'
      }
    }
  },
  plugins: []
};
