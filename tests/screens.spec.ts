import { expect, test, type Browser } from '@playwright/test';

// Not a check: saves screenshots of each screen for a visual review. Run with SHOTS=dir.
const dir = process.env.SHOTS;
test.skip(!dir, 'set SHOTS to a folder to save screenshots');

async function phone(browser: Browser, pin: string, name: string) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('/join?code=' + pin);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  return page;
}

test('screens', async ({ browser }) => {
  test.setTimeout(240_000);
  const t = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const shot = (p: typeof t, name: string, fullPage = false) => p.screenshot({ path: `${dir}/${name}.png`, fullPage });
  await t.goto('/games');
  await t.getByRole('heading', { name: 'Games' }).waitFor();
  await shot(t, '01-host-picker');
  await t.getByRole('button', { name: 'Champion', exact: true }).click();
  await t.getByRole('link', { name: /Host Champion/ }).click();
  await t.getByRole('button', { name: /^Add all/ }).click();
  await t.getByRole('button', { name: /Open the lobby/ }).click();
  await expect(t.locator('.lobby .status')).toHaveCount(0, { timeout: 30_000 });
  await shot(t, '02-lobby-empty');
  const pin = (await t.locator('.pin strong').textContent())!.replace(/\D/g, '');

  const join = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await join.goto('/join');
  await join.getByLabel('Game PIN').waitFor();
  await shot(join, '03-phone-pin');

  const names = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus', 'Hana'];
  const kids = [];
  for (const n of names) kids.push(await phone(browser, pin, n));
  await shot(t, '04-lobby-full');
  await shot(kids[1], '05-phone-lobby');

  await t.getByRole('button', { name: 'Ana', exact: true }).click();
  await t.getByRole('button', { name: 'Make them the champion' }).click();
  await t.getByRole('button', { name: 'Start' }).click();
  await t.waitForTimeout(1200);
  await shot(t, '06-sweep-mid');
  await t.getByRole('button', { name: /Begin/ }).waitFor();
  await shot(t, '07-sweep-landed');
  await shot(kids[0], '08-phone-one-intro');
  await t.getByRole('button', { name: /Begin/ }).click();

  // Q1 (A = 8): three classmates miss.
  await expect(kids[1].getByRole('button', { name: 'A: 8' })).toBeVisible();
  await shot(kids[1], '09-phone-answer');
  for (const [i, c] of [[1, 'A: 8'], [2, 'B: −8'], [3, 'A: 8'], [4, 'C: 20']] as const) await kids[i].getByRole('button', { name: c }).click();
  await t.waitForTimeout(700);
  await shot(t, '10-phaseA');
  await shot(kids[1], '11-phone-locked');
  await shot(kids[0], '12-phone-one-wait');
  for (const [i, c] of [[5, 'A: 8'], [6, 'B: −8'], [7, 'A: 8']] as const) await kids[i].getByRole('button', { name: c }).click();
  await expect(t.getByText('−6 + 14 = ?')).toBeVisible({ timeout: 10_000 });
  await t.waitForTimeout(700);
  await shot(t, '13-phaseB');
  await shot(kids[0], '14-phone-one-answer');
  // Ana walks up and taps the answer on the big screen.
  await t.getByRole('button', { name: 'A: 8' }).click();
  await t.waitForTimeout(400);
  await shot(t, '15-one-locked');
  await expect(t.getByText('Ana is right!')).toBeVisible({ timeout: 10_000 });
  await t.waitForTimeout(1200);
  await shot(t, '16-reveal');
  await shot(kids[1], '17-phone-correct');
  await shot(kids[2], '18-phone-fell');

  // Q2 (B = -6): Ana polls from the big screen, then misses twice to end the round.
  await t.getByRole('button', { name: /Next question/ }).click();
  for (const k of kids.slice(1)) await k.getByRole('button', { name: 'B: −6' }).click();
  await t.getByRole('button', { name: 'Poll the Class' }).click({ timeout: 10_000 });
  await shot(t, '19-poll-mode');
  await t.getByRole('button', { name: 'B: −6' }).click();
  await t.waitForTimeout(300);
  await shot(t, '20-poll-result');
  await t.getByRole('button', { name: 'A: 6' }).click();
  await expect(t.getByText('Ana misses!')).toBeVisible({ timeout: 10_000 });
  await t.getByRole('button', { name: /Next question/ }).click();
  for (const k of kids.slice(1)) await k.locator('button.block').first().click();
  await t.locator('.blocks button.block').nth(1).click({ timeout: 10_000 });
  await expect(t.getByText('Round over')).toBeVisible({ timeout: 10_000 });
  await t.waitForTimeout(1500);
  await shot(t, '21-round-over');
  await shot(kids[0], '22-phone-one-missed');
  await t.getByRole('button', { name: /Scoreboard/ }).click();
  await t.waitForTimeout(800);
  await shot(t, '23-scoreboard');
  await shot(kids[1], '24-phone-rank');
  await t.getByRole('button', { name: 'Menu' }).click();
  await t.getByRole('button', { name: 'End the game' }).click();
  await t.waitForTimeout(1000);
  await shot(t, '25-final');
});
