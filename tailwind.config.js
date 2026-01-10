/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Importante para o seu switch de tema funcionar
  theme: {
    extend: {
      colors: {
        // Aqui definimos suas cores padrão
        primary: {
          DEFAULT: '#1100ab', // Seu azul principal
          light: '#4d4dff',   // Seu azul mais claro/neon
          dark: '#0c007a',    // Seu azul hover
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}