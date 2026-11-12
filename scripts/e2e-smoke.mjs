/**
 * End-to-end smoke test for the student management UI.
 *
 * Run against a production server:  npm run build && npm run start
 * Then:                             node scripts/e2e-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const results = [];
let failed = 0;

function check(name, condition, extra = '') {
  const ok = Boolean(condition);
  if (!ok) failed += 1;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  const text = message.text();
  // Expected negative-path responses (duplicate email -> 409, validation -> 422)
  // are surfaced in the UI and are not app errors.
  if (/status of (409|422)/.test(text)) return;
  consoleErrors.push(text);
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

try {
  /* ---------------------------------------------------------------- dashboard */
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByText('Total students').waitFor({ timeout: 15000 });
  const totalText = await page.locator('text=Total students').first().locator('..').innerText();
  check('dashboard renders KPI cards', totalText.length > 0, totalText.replace(/\n/g, ' | '));
  check(
    'dashboard renders charts',
    (await page.locator('svg.MuiChartsSurface-root, svg').count()) >= 2,
    `${await page.locator('svg').count()} svg nodes`,
  );
  check('dashboard lists top performers', await page.getByText('Top performers').isVisible());

  /* ------------------------------------------------------------ student list */
  await page.goto(`${BASE}/students`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Add student' }).waitFor({ timeout: 15000 });
  const rowCount = await page.locator('.MuiDataGrid-row').count();
  check('data grid renders rows', rowCount > 0, `${rowCount} rows on page 1`);

  /* search */
  await page.getByPlaceholder('Search by name, roll number, email or major').fill('Okafor');
  await page.waitForTimeout(700);
  await page.waitForLoadState('networkidle');
  const searched = await page.locator('.MuiDataGrid-row').count();
  const searchedNames = await page.locator('.MuiDataGrid-row').allInnerTexts();
  check(
    'search filters the grid',
    searched > 0 && searchedNames.every((text) => text.includes('Okafor')),
    `${searched} match(es)`,
  );

  /* filter by status */
  await page.getByPlaceholder('Search by name, roll number, email or major').fill('');
  await page.waitForTimeout(500);
  await page.getByLabel('Status').click();
  await page.getByRole('option', { name: 'Suspended' }).click();
  await page.waitForTimeout(900);
  await page.waitForLoadState('networkidle');
  const statusCells = await page.locator('.MuiDataGrid-row [data-field="status"]').allInnerTexts();
  check(
    'status filter applies on the server',
    statusCells.length > 0 && statusCells.every((text) => text.includes('Suspended')),
    statusCells.join(','),
  );

  /* sorting */
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.waitForTimeout(700);
  await page.getByRole('columnheader', { name: 'GPA' }).click();
  await page.waitForTimeout(900);
  await page.waitForLoadState('networkidle');
  const gpas = (await page.locator('.MuiDataGrid-row [data-field="gpa"]').allInnerTexts()).map(Number);
  check(
    'server side sorting by GPA works',
    gpas.length > 1 && gpas.every((value, index) => index === 0 || gpas[index - 1] <= value),
    gpas.join(','),
  );

  /* pagination */
  const pageInfoBefore = await page.locator('.MuiTablePagination-displayedRows').innerText();
  await page.getByLabel('Go to next page').click();
  await page.waitForTimeout(900);
  await page.waitForLoadState('networkidle');
  const pageInfoAfter = await page.locator('.MuiTablePagination-displayedRows').innerText();
  check('pagination advances', pageInfoBefore !== pageInfoAfter, `${pageInfoBefore} -> ${pageInfoAfter}`);

  /* ------------------------------------------------------------------- create */
  await page.getByRole('button', { name: 'Add student' }).click();
  await page.getByLabel('Roll number').fill('E2E-0001');
  await page.getByLabel('Email').fill('e2e.smoke@campus.edu');
  await page.getByLabel('First name').fill('E2E');
  await page.getByLabel('Last name').fill('Smoke');
  await page.getByLabel('Phone').fill('+1 (555) 111-2222');
  await page.getByLabel('Date of birth').fill('2004-02-02');
  await page.getByLabel('Enrolled on').fill('2025-08-18');
  await page.getByLabel('GPA').fill('3.25');
  /* Invalid submit first, to confirm client side validation blocks it. */
  await page.getByLabel('Roll number').fill('x');
  await page.getByRole('button', { name: 'Create student' }).click();
  await page.waitForTimeout(300);
  check(
    'client validation blocks an invalid form',
    await page.getByText('Roll number must be at least 3 characters long').isVisible(),
  );

  await page.getByLabel('Roll number').fill('E2E-0001');
  await page.getByRole('button', { name: 'Create student' }).click();
  await page.getByText('E2E Smoke was added to the register.').waitFor({ timeout: 15000 });
  check('create student succeeds', true);

  /* duplicate rejection surfaces a field error */
  await page.getByRole('button', { name: 'Add student' }).click();
  await page.getByLabel('Roll number').fill('E2E-0001');
  await page.getByLabel('Email').fill('e2e.smoke@campus.edu');
  await page.getByLabel('First name').fill('E2E');
  await page.getByLabel('Last name').fill('Duplicate');
  await page.getByLabel('Phone').fill('+1 (555) 111-2222');
  await page.getByLabel('Date of birth').fill('2004-02-02');
  await page.getByLabel('Enrolled on').fill('2025-08-18');
  await page.getByRole('button', { name: 'Create student' }).click();
  await page.getByText('already registered', { exact: false }).first().waitFor({ timeout: 15000 });
  check('duplicate email is rejected by the API', true);
  await page.getByRole('button', { name: 'Cancel' }).click();

  /* -------------------------------------------------------------------- read */
  await page.getByPlaceholder('Search by name, roll number, email or major').fill('E2E-0001');
  await page.waitForTimeout(900);
  await page.waitForLoadState('networkidle');
  await page.locator('.MuiDataGrid-row').first().click();
  await page.waitForURL(/\/students\/\d+$/, { timeout: 15000 });
  await page.getByText('Student profile').waitFor({ timeout: 15000 });
  check('row click opens the detail page', /\/students\/\d+$/.test(page.url()), page.url());
  check(
    'detail page shows the record',
    await page.getByText('e2e.smoke@campus.edu').first().isVisible(),
  );

  /* ------------------------------------------------------------------ update */
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Last name').fill('SmokeUpdated');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('was updated successfully.').waitFor({ timeout: 15000 });
  check('update student succeeds', true);
  check(
    'detail page reflects the update',
    await page.getByText('SmokeUpdated').first().isVisible(),
  );

  /* ------------------------------------------------------------------ delete */
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.waitForURL(/\/students$/, { timeout: 15000 });
  check('delete student returns to the list', page.url().endsWith('/students'));

  await page.getByPlaceholder('Search by name, roll number, email or major').fill('E2E-0001');
  await page.waitForTimeout(900);
  await page.waitForLoadState('networkidle');
  check(
    'deleted student is gone from the list',
    (await page.locator('.MuiDataGrid-row').count()) === 0,
  );

  /* --------------------------------------------------------------- dark mode */
  await page.goto(`${BASE}/students`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Toggle color mode' }).click();
  await page.waitForTimeout(500);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check('dark mode switches theme', background !== 'rgb(245, 246, 251)', background);

  /* --------------------------------------------------------- responsive (xs) */
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Students' }).first().click();
  await page.waitForURL(/\/students$/, { timeout: 15000 });
  check('mobile drawer navigation works', page.url().endsWith('/students'));

  check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
} catch (error) {
  failed += 1;
  results.push(`FAIL  unexpected error — ${error.message}`);
  await page.screenshot({ path: 'e2e-failure.png', fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
