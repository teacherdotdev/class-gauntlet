import { expect, test, type Browser, type Page } from '@playwright/test';

async function joinAs(browser: Browser, pin: string, nickname: string): Promise<Page> {
  const page = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  await page.goto(`/join?code=${pin}`);
  await page.getByLabel('Your name').fill(nickname);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  return page;
}

test('Peril! in Teams: set up, join, pick a tile, buzz, vote, score, standings', async ({
  browser,
}) => {
  const teacher = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 } })
  ).newPage();
  await teacher.goto('/games');
  await teacher.getByRole('button', { name: 'Peril!', exact: true }).click();
  await teacher.getByRole('link', { name: /Host Peril!/ }).click();
  await teacher.getByRole('radio', { name: 'Teams' }).click();
  await teacher.getByLabel('Number of teams').fill('2');

  // Build the board: click a tile, then a question; then add the rest, which fill the next empty column.
  await teacher.getByLabel('Column 1 title').fill('Integers');
  await teacher.getByRole('button', { name: 'Integers 100: empty' }).click();
  await teacher.getByRole('button', { name: /^−6 \+ 14 = \?/ }).click();
  await expect(teacher.getByRole('button', { name: 'Integers 100: −6 + 14 = ?' })).toBeVisible();
  await teacher.getByRole('button', { name: /^Add all \d+/ }).click();
  await expect(teacher.getByRole('button', { name: /^Column 2 500: (?!empty)/ })).toBeVisible();
  await teacher.getByRole('button', { name: /Open the lobby/ }).click();
  await expect(teacher.locator('.lobby .status')).toHaveCount(0, { timeout: 30_000 });
  const pin = (await teacher.locator('.pin strong').textContent())!.replace(/\D/g, '');

  // Team names and rules are set in the lobby.
  await teacher.getByLabel('Team name').nth(0).fill('Iron Wyverns');
  await teacher.getByLabel('Team name').nth(0).press('Tab');
  await teacher.getByLabel('Team name').nth(1).fill('Gilded Griffins');
  await teacher.getByLabel('Team name').nth(1).press('Tab');
  await teacher.getByRole('button', { name: 'Rules' }).click();
  await teacher.getByRole('checkbox', { name: /Treasure Trove/ }).uncheck();
  await teacher.getByRole('button', { name: 'Save' }).click();

  const ana = await joinAs(browser, pin, 'Ana');
  const ben = await joinAs(browser, pin, 'Ben');
  await expect(ana.getByText('You fight for the Iron Wyverns.')).toBeVisible();
  await expect(
    teacher.getByRole('group', { name: 'Gilded Griffins' }).getByText('Ben'),
  ).toBeVisible();

  await teacher.getByRole('button', { name: 'Start' }).click();
  await teacher.getByRole('button', { name: 'Integers for 100' }).click();
  await expect(teacher.getByText('−6 + 14 = ?')).toBeVisible();
  await expect(ana.getByRole('heading', { name: 'Read the question' })).toBeVisible();

  await teacher.getByRole('button', { name: 'Arm buzzers' }).click();
  await ana.getByRole('button', { name: 'BUZZ!' }).click();
  await expect(ben.getByRole('heading', { name: 'Iron Wyverns are answering' })).toBeVisible();
  await ana.getByRole('button', { name: 'A: 8' }).click();
  await expect(teacher.getByText('Iron Wyverns got it: +100')).toBeVisible();
  await expect(ana.getByRole('heading', { name: 'Got it!' })).toBeVisible();

  await teacher.getByRole('button', { name: /Next/ }).click();
  await expect(
    teacher.getByRole('button', { name: 'Integers for 100' }),
  ).toBeDisabled();
  await teacher.getByRole('button', { name: 'End game' }).click();
  await expect(teacher.getByRole('heading', { name: 'Champions of the realm' })).toBeVisible();
  await expect(teacher.locator('.standings > li').first()).toContainText('Iron Wyverns');
  await expect(teacher.locator('.standings > li').first()).toContainText('100');
  await expect(ana.getByText('#1')).toBeVisible();
});
