import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,      // Força a porta ser sempre 5173
    strictPort: true, // Se a 5173 estiver ocupada, ele NÃO abre na 5174 (dá erro pra você saber)
  }
})