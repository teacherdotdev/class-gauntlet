import { expect, test, type Browser, type Page } from '@playwright/test';

async function joinAs(browser: Browser, pin: string, nickname: string): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(`/join?code=${pin}`);
  await page.getByLabel('Your name').fill(nickname);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  return page;
}

test('a full game over peer-to-peer: join, spotlight, answers, lifeline, reveal, reconnects', async ({ browser }) => {
  const teacher = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await teacher.goto('/games');
  await teacher.getByRole('button', { name: 'Champion', exact: true }).click();
  await teacher.getByRole('link', { name: /Host Champion/ }).click();
  await teacher.getByRole('button', { name: /^Add all/ }).click();
  await teacher.getByRole('button', { name: /Open the lobby/ }).click();
  await expect(teacher.locator('.lobby .status')).toHaveCount(0, { timeout: 30_000 });
  const pin = (await teacher.locator('.pin strong').textContent())!.replace(/\D/g, '');
  expect(pin).toMatch(/^\d{6}$/);

  const ana = await joinAs(browser, pin, 'Ana');
  const ben = await joinAs(browser, pin, 'Ben');
  const cy = await joinAs(browser, pin, 'Cy');
  await expect(teacher.locator('.count')).toContainText('3');

  // Choose Ana, then start: the spotlight sweeps and lands on her.
  await teacher.getByRole('button', { name: 'Ana' }).click();
  await teacher.getByRole('button', { name: 'Make them the champion' }).click();
  await teacher.getByRole('button', { name: 'Start' }).click();
  await expect(teacher.getByRole('heading', { name: 'Ana takes up the gauntlet!' })).toBeVisible();
  await expect(ana.getByRole('heading', { name: 'The spotlight is on you!' })).toBeVisible();
  await teacher.getByRole('button', { name: /Begin/ }).click();

  // Question 1 (answer A = 8). Neither Ana's phone nor the big screen shows it yet.
  await expect(ana.getByRole('heading', { name: 'Eyes on the big screen' })).toBeVisible();
  await expect(teacher.getByText('−6 + 14')).toHaveCount(0);
  await ben.getByRole('button', { name: 'A: 8' }).click();
  await cy.getByRole('button', { name: 'B: −8' }).click();
  await expect(ben.getByRole('heading', { name: 'Locked in!' })).toBeVisible();

  // The game hands the question to Ana by itself; one tap answers.
  await expect(teacher.getByText('−6 + 14 = ?')).toBeVisible({ timeout: 10_000 });
  await ana.getByRole('button', { name: 'A: 8' }).click();
  await expect(ana.getByText('You’re right!')).toBeVisible({ timeout: 10_000 });
  await expect(ben.getByText('Correct!')).toBeVisible();
  await expect(cy.getByText('You fall to the Comeback Crew')).toBeVisible();
  await expect(teacher.getByText('Cy falls to the Comeback Crew')).toBeVisible();

  // Ben reloads and keeps his seat and points.
  await ben.reload();
  await expect(ben.locator('.strip .pts')).toHaveText('12', { timeout: 30_000 });

  // Question 2 (answer B = -6): Ana polls the class through the ⚡ button.
  await teacher.getByRole('button', { name: /Next question/ }).click();
  await ben.getByRole('button', { name: 'B: −6' }).click();
  await cy.getByRole('button', { name: 'A: 6' }).click();
  await ana.getByRole('button', { name: 'Lifelines' }).click({ timeout: 10_000 });
  await ana.getByRole('button', { name: /Poll the Class/ }).click();
  await ana.getByRole('button', { name: 'Poll answer B' }).click();
  await expect(ana.getByText('1 of 2 chose B')).toBeVisible();
  await ana.getByRole('button', { name: 'B: −6' }).click();
  await expect(teacher.getByText('Ana is right!')).toBeVisible({ timeout: 10_000 });

  // The teacher reloads: the game resumes and everyone reconnects.
  await teacher.reload();
  await teacher.getByRole('button', { name: 'Resume' }).click();
  await teacher.waitForURL(/\/host$/);
  await expect(teacher.getByRole('button', { name: /Next question/ })).toBeVisible();
  await expect(teacher.locator('.conn')).toHaveCount(0, { timeout: 90_000 });
  await expect(teacher.locator('.crowd li.away')).toHaveCount(0, { timeout: 30_000 });
  await expect(teacher.locator('.offline')).toHaveCount(0, { timeout: 30_000 });
  await teacher.getByRole('button', { name: /Next question/ }).click();
  await expect(ben.getByRole('button', { name: /^A: / })).toBeVisible({ timeout: 30_000 });

  await teacher.getByRole('button', { name: 'Menu' }).click();
  await teacher.getByRole('button', { name: 'End the game' }).click();
  await expect(cy.getByText('Thanks for playing!')).toBeVisible();
});

// School laptops often have animations turned off, so the spotlight lands the
// moment it appears; Begin must still show up, round after round.
test('Begin appears when the teacher’s computer prefers reduced motion', async ({ browser }) => {
  const teacher = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await teacher.goto('/games');
  await teacher.getByRole('button', { name: 'Champion', exact: true }).click();
  await teacher.getByRole('link', { name: /Host Champion/ }).click();
  await teacher.getByRole('button', { name: /^Add all/ }).click();
  await teacher.getByRole('button', { name: /Open the lobby/ }).click();
  await expect(teacher.locator('.lobby .status')).toHaveCount(0, { timeout: 30_000 });
  const pin = (await teacher.locator('.pin strong').textContent())!.replace(/\D/g, '');
  await joinAs(browser, pin, 'Ana');
  await joinAs(browser, pin, 'Ben');

  await teacher.getByRole('button', { name: 'Start' }).click();
  await expect(teacher.getByRole('button', { name: /Begin/ })).toBeVisible({ timeout: 10_000 });

  // A second round lands again too.
  await teacher.getByRole('button', { name: 'Menu' }).click();
  await teacher.getByRole('button', { name: 'End this round' }).click();
  await teacher.getByRole('button', { name: /Next round/ }).click();
  await expect(teacher.getByRole('button', { name: /Begin/ })).toBeVisible({ timeout: 10_000 });
});
