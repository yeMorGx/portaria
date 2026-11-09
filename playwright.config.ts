import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  use: {
    ignoreHTTPSErrors: true,
    baseURL: 'https://localhost:4173',
    channel: 'msedge',
    permissions: ['camera'],
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'https://localhost:4173',
    reuseExistingServer: true,
    ignoreHTTPSErrors: true,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
