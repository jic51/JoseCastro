// Tests E2E de SecondGuess.
// Cada test corresponde a un criterio de APPS/SECONDGUESS/REQUISITOS.md.
// Nombre del test == columna "Test" de esa tabla. No renombrar sin actualizar el doc.
const { test, expect } = require('@playwright/test');

const APP = '/APPS/SECONDGUESS/index.html';
const DAY = 24 * 60 * 60 * 1000;

test.beforeEach(async ({ page }) => {
  // Los tests no deben depender de la red: Analytics se corta.
  await page.route(/googletagmanager\.com/, route => route.abort());
});

/**
 * Deja el localStorage en un estado concreto y recarga.
 * El hash lo calcula la propia app (Security.saveData) para no duplicar aqui
 * su algoritmo; despues sobreescribimos sg_checks si el test lo pide.
 */
async function seed(page, { data = {}, checks = null } = {}) {
  await page.goto(APP);
  await page.evaluate(({ data, checks }) => {
    const merged = { ...App.data, onboardingDone: true, ...data };
    Security.saveData(merged);
    if (checks) localStorage.setItem(Security.CHECK_KEY, JSON.stringify(checks));
  }, { data, checks });
  await page.reload();
}

/** Responde la pregunta del dia, sea numerica o de opcion multiple. */
async function answerQuestion(page) {
  const numeric = page.locator('#answer-input');
  if (await numeric.count()) {
    await numeric.fill('100');
  } else {
    await page.locator('.option-btn').first().click();
  }
  const submit = page.locator('#submit-btn');
  await expect(submit).toBeEnabled();
  await submit.click();
}

// ===== C1 =====
test('onboarding de 3 pasos lleva a la pregunta del dia', async ({ page }) => {
  await page.goto(APP);

  await expect(page.locator('#onboarding')).toBeVisible();
  await expect(page.locator('.onboarding-step[data-step="1"]')).toHaveClass(/active/);

  await page.locator('#onboarding-btn').click();
  await expect(page.locator('.onboarding-step[data-step="2"]')).toHaveClass(/active/);

  await page.locator('#onboarding-btn').click();
  await expect(page.locator('.onboarding-step[data-step="3"]')).toHaveClass(/active/);

  await page.locator('#onboarding-btn').click();
  await expect(page.locator('#app-container')).toBeVisible();
  await expect(page.locator('.question-card')).toBeVisible();
});

// ===== C2 =====
test('la pregunta del dia se renderiza con el submit deshabilitado', async ({ page }) => {
  await seed(page);

  await expect(page.locator('.question-card')).toBeVisible();
  await expect(page.locator('.question-text')).not.toBeEmpty();
  await expect(page.locator('#submit-btn')).toBeDisabled();
});

// ===== C3 =====
test('responder produce una pantalla de resultados', async ({ page }) => {
  await seed(page);
  await answerQuestion(page);

  await expect(page.locator('#suspense-screen')).toBeVisible();

  // processAnswer corre tras 2.5s de suspenso
  await expect(page.locator('.result-card')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.comparison-box')).toBeVisible();
  await expect(page.locator('#accuracy-ring')).toContainText('%');
  await expect(page.locator('#leaderboard-list')).not.toBeEmpty();
});

// ===== C4 =====
test('al recargar el mismo dia se ven los resultados', async ({ page }) => {
  await seed(page);
  await answerQuestion(page);
  await expect(page.locator('.result-card')).toBeVisible({ timeout: 10_000 });

  await page.reload();

  await expect(page.locator('.result-card')).toBeVisible();
  await expect(page.locator('.question-card')).toHaveCount(0);
});

// ===== C5 — regresion del bloqueo permanente =====
test('una ausencia larga no bloquea al jugador', async ({ page }) => {
  const now = Date.now();

  // Jugador normal: venia jugando a diario, desaparecio 6 dias, volvio y jugo
  // hace 2 dias. Ese hueco entre guardados NO es manipulacion del reloj, pero
  // deja un salto >48h en sg_checks. Es la visita SIGUIENTE al regreso la que
  // dispara el falso positivo, no el regreso mismo.
  const lastPlayed = new Date(now - 2 * DAY).toISOString();
  const checks = [now - 10 * DAY, now - 9 * DAY, now - 8 * DAY, now - 2 * DAY];

  await seed(page, { data: { lastPlayed, gamesPlayed: 4, streak: 1 }, checks });

  // Se consultan las dos funciones directamente y en el mismo evaluate. Mirar
  // solo la pantalla no sirve: el guard de renderCountdown devuelve al jugador a
  // la pregunta aunque el detector se haya equivocado, y el test pasaria por la
  // razon equivocada.
  const verdict = await page.evaluate(({ checks, lastPlayed }) => {
    localStorage.setItem(Security.CHECK_KEY, JSON.stringify(checks));
    return {
      flagged: Security.detectTimeTampering(),
      canPlay: Security.canPlayToday(lastPlayed).canPlay
    };
  }, { checks, lastPlayed });

  expect(verdict.flagged).toBe(false);
  expect(verdict.canPlay).toBe(true);

  await expect(page.locator('.question-card')).toBeVisible();
  await expect(page.locator('#submit-btn')).toBeVisible();
});

// ===== C6 =====
test('el reloj hacia atras no deja al jugador bloqueado para siempre', async ({ page }) => {
  const now = Date.now();

  // Manipulacion real: un timestamp posterior es menor que el anterior.
  await seed(page, {
    data: { lastPlayed: new Date(now - 5 * DAY).toISOString(), gamesPlayed: 2 },
    checks: [now - 2 * DAY, now - 6 * DAY]
  });

  // Primer arranque: la app puede castigar mostrando la espera.
  // Segundo arranque: debe haberse curado sola, no quedar encerrada.
  await page.reload();
  await expect(page.locator('.question-card')).toBeVisible();
});

// ===== C7 =====
test('la pantalla de espera nunca muestra un contador vencido', async ({ page }) => {
  await seed(page);
  await expect(page.locator('.question-card')).toBeVisible();

  // Forzamos la vista de espera con un objetivo que ya paso. updateCountdown
  // pinta un "00" muerto en ese caso, asi que la vista no debe llegar a pintarse:
  // con el objetivo vencido corresponde devolver al jugador a la pregunta.
  await page.evaluate(() => {
    App.renderCountdown(document.getElementById('main-view'), Date.now() - 1000);
  });

  await expect(page.locator('#wait-countdown')).toHaveCount(0);
  await expect(page.locator('.question-card')).toBeVisible();
});

// ===== C8 =====
test('la racha se rompe al saltarse un dia', async ({ page }) => {
  const now = Date.now();

  await seed(page, {
    data: { lastPlayed: new Date(now - 3 * DAY).toISOString(), streak: 7, gamesPlayed: 7 },
    checks: [now - 4 * DAY, now - 3 * DAY]
  });

  const streak = await page.evaluate(() => App.data.streak);
  expect(streak).toBe(0);
});

// ===== C11 =====
test('la racha se rompe aunque el salto de dias mida menos de 48 horas', async ({ page }) => {
  // Ultima partida: anteayer a las 23:59:59. Es un dia calendario completo
  // saltado, pero la diferencia en milisegundos siempre cae entre 24h y 48h,
  // asi que contar dias dividiendo milisegundos no lo detecta nunca.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const lastPlayed = new Date(todayStart.getTime() - DAY - 1000);

  await seed(page, {
    data: { lastPlayed: lastPlayed.toISOString(), streak: 7, gamesPlayed: 7 },
    checks: [lastPlayed.getTime() - DAY, lastPlayed.getTime()]
  });

  const streak = await page.evaluate(() => App.data.streak);
  expect(streak).toBe(0);
});

// ===== C9 =====
test('datos corruptos no rompen la app', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(APP);
  await page.evaluate(() => {
    localStorage.setItem('sg_data', JSON.stringify({ data: { streak: 999 }, ts: 1, hash: 'mentira' }));
  });
  await page.reload();

  // Arranca de cero (onboarding) en vez de reventar.
  await expect(page.locator('#onboarding')).toBeVisible();
  expect(errors).toEqual([]);
});

// ===== C10 =====
test('en movil no hay scroll horizontal', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'solo aplica al proyecto mobile');

  await seed(page);
  await expect(page.locator('.question-card')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
