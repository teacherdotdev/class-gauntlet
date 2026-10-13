import { expect, test, type Browser, type Page } from '@playwright/test';

async function joinAs(browser: Browser, pin: string, nickname: string): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(`/join?code=${pin}`);
  await page.getByLabel('Your name').fill(nickname);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  return page;
}

test('Classic: everyone answers, the reveal names nobody, and the report lands in History', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const teacher = await context.newPage();
  await teacher.goto('/games');
  await teacher.getByRole('button', { name: 'Classic', exact: true }).click();
  await teacher.getByRole('link', { name: /Host Classic/ }).click();
  // Select two questions (click, then Cmd/Ctrl-click) and add them with +; they leave the list.
  await teacher.getByRole('button', { name: /^−6 \+ 14 = \?/ }).click();
  await teacher.getByRole('button', { name: /^9 − 15 = \?/ }).click({ modifiers: ['ControlOrMeta'] });
  await teacher.getByRole('button', { name: 'Add the 2 selected questions' }).first().click();
  await expect(teacher.getByText('2 questions', { exact: true })).toBeVisible();
  await teacher.getByRole('button', { name: /Open the lobby/ }).click();
  await expect(teacher.locator('.lobby .status')).toHaveCount(0, { timeout: 30_000 });
  const pin = (await teacher.locator('.pin strong').textContent())!.replace(/\D/g, '');

  const ana = await joinAs(browser, pin, 'Ana');
  const ben = await joinAs(browser, pin, 'Ben');
  await teacher.getByRole('button', { name: 'Start' }).click();

  await expect(teacher.getByText('Question 1 of 2')).toBeVisible();
  await ana.getByRole('button', { name: 'A: 8' }).click();
  await expect(ana.getByRole('heading', { name: 'Locked in!' })).toBeVisible();
  await ben.getByRole('button', { name: 'B: −8' }).click();
  await expect(teacher.getByText('50% got it right')).toBeVisible();
  await expect(teacher.locator('.question')).not.toContainText('Ana');
  await expect(ana.getByRole('heading', { name: 'Correct!' })).toBeVisible();
  await expect(ben.getByRole('heading', { name: 'Not quite' })).toBeVisible();

  await teacher.getByRole('button', { name: /Next question/ }).click();
  await ana.getByRole('button', { name: 'B: −6' }).click();
  await ben.getByRole('button', { name: 'B: −6' }).click();
  await teacher.getByRole('button', { name: /See the report/ }).click();
  await expect(teacher.getByRole('heading', { name: 'The report' })).toBeVisible();
  await expect(ana.getByText('2 / 2')).toBeVisible();
  await teacher.getByRole('button', { name: /Show each student’s results/ }).click();
  await expect(teacher.getByRole('row', { name: /Ana 2 of 2 answers/ })).toBeVisible();
  await teacher.getByRole('button', { name: /Finish and save to History/ }).click();
  await expect(ana.getByText('Thanks for playing!')).toBeVisible();

  await teacher.goto('/history');
  await expect(teacher.getByText('Classic', { exact: true })).toBeVisible();
});
