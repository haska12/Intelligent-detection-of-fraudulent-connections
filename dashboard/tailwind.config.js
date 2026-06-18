/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dxc: { blue:'#5865C5', orange:'#E8623A', purple:'#7B5BC4' },
        threat: { critical:'#EF4444', high:'#F97316', medium:'#EAB308', low:'#22C55E', info:'#3B82F6' },
      },
      fontFamily: { sans: ['Inter','Segoe UI','system-ui','sans-serif'] },
      backdropBlur: { '20': '20px' },
    },
  },
  plugins: [],
}
