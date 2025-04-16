module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        'neu-light': '10px 10px 20px #d1d9e6, -10px -10px 20px #ffffff',
        'neu-pressed-light': 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
      },
      colors: {
        'neu-light': '#e6e7ee',
      },
      backgroundColor: {
        'glass-light': 'rgba(255, 255, 255, 0.15)',
      },
    },
  },
  plugins: [],
}; 