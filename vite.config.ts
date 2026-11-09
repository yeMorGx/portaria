import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: { host: true },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
