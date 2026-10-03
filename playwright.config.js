const { defineConfig, devices } = require('@playwright/test');

// El contenedor trae Chromium preinstalado en /opt/pw-browsers y la version de
// @playwright/test no siempre coincide con ese build, asi que apuntamos al binario
// directamente cuando existe. En una maquina normal la variable no esta puesta y
// Playwright resuelve su propio Chromium.
const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`
  : undefined;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    launchOptions: { executablePath }
  },

  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], launchOptions: { executablePath } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } }
  ],

  webServer: {
    command: 'node tests/server.mjs',
    url: 'http://127.0.0.1:4173/APPS/SECONDGUESS/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
