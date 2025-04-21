import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/react-big-calendar/lib/css/react-big-calendar.css'
  ],
  theme: {
    extend: {
      colors: {
        'calendar-blue': '#3b82f6',
        'calendar-blue-dark': '#2563eb',
        'calendar-light': '#eff6ff',
      },
    },
  },
  plugins: [],
}

export default config 