import { defineConfig, devices } from '@playwright/test';

const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 3101);
const backendPort = Number(process.env.E2E_BACKEND_PORT || 3100);
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendApiUrl = `http://127.0.0.1:${backendPort}/api`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `cd ../scn-jobs-monolith && npm run seed:admin && PORT=${backendPort} npm start`,
      url: `${backendApiUrl}/jobs`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `API_BACKEND_URL=${backendApiUrl} npm run dev -- -H 127.0.0.1 -p ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
