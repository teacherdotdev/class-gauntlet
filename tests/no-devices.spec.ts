import { expect, test, type Page } from '@playwright/test';

// No student devices: one teacher device, no students joined, and nothing sent to
// the matchmaking server. Every test cuts it off to prove the game doesn't need
// it. (The workspace's Connection Check still tries it; the game itself mustn't.)
async function offlineTeacher(browser: import('@playwright/test').Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const reached: string[] = [];
  await context.route(/peer\.(classgauntlet\.com|teacher\.dev)|\/api\/turn/, (route) => {
    reached.push(route.request().url());
    return route.abort();
  });
  const teacher = await context.newPage();
  await teacher.goto('/games');
  return { teacher, reached };
}

async function host(teacher: Page, mode: 'Champion' | 'Peril!' | 'Classic') {
  await teacher.getByRole('button', { name: mode, exact: true }).click();
  await teacher.getByRole('switch', { name: 'Use student devices' }).uncheck();
  await teacher.getByRole('link', { name: new RegExp(`Host ${mode}`) }).click();
}

async function setUp(teacher: Page, reached: string[]) {
  await teacher.getByRole('button', { name: /Open the game/ }).click();
  await teacher.waitForURL('**/host');
  reached.length = 0;
}

test('Champion with no student devices: no peeking, the Class Majority, a tapped answer, then History', async ({ browser }) => {
  const { teacher, reached } = await offlineTeacher(browser);
  await host(teacher, 'Champion');
  await teacher.getByRole('button', { name: /^Add all/ }).click();
  await setUp(teacher, reached);
  await expect(teacher.locator('.pin strong')).toHaveCount(0);
  await teacher.getByLabel('First champion’s name').fill('Ana');
  await teacher.getByRole('button', { name: 'Start' }).click();

  await expect(teacher.getByRole('heading', { name: 'Ana takes up the gauntlet!' })).toBeVisible();
  await teacher.getByRole('button', { name: /Begin/ }).click();
  await expect(teacher.getByRole('heading', { name: /Ana, close your eyes or turn around/ })).toBeVisible();
  await expect(teacher.locator('.question')).toHaveCount(0);

  // A clicker's → shows the class the question; B taps the Class Majority.
  await teacher.keyboard.press('ArrowRight');
  await expect(teacher.locator('.question')).toBeVisible();
  await teacher.keyboard.press('b');
  await expect(teacher.getByRole('heading', { name: 'Ana, you can look now!' })).toBeVisible();
  await expect(teacher.locator('.question')).toHaveCount(0);

  await teacher.getByRole('button', { name: /Show Ana the question/ }).click();
  await teacher.getByRole('button', { name: 'Poll the Class' }).click();
  await expect(teacher.getByText('most of the class chose B')).toBeVisible();
  await teacher.getByRole('button', { name: /^A: / }).click();
  await expect(teacher.locator('.verdict')).toBeVisible({ timeout: 10_000 });
  await expect(teacher.locator('.verdict')).toContainText('The class chose B.');

  await teacher.getByRole('button', { name: 'Menu' }).click();
  await teacher.getByRole('button', { name: 'End the game' }).click();
  await expect(teacher.getByRole('heading', { name: 'Champions of the realm' })).toBeVisible();
  expect(reached).toEqual([]);
  await teacher.goto('/history');
  await expect(teacher.getByText('No student devices')).toBeVisible();
});

test('Peril! with no student devices: Teams with nobody in them, the teacher taps who buzzed and their answer', async ({ browser }) => {
  const { teacher, reached } = await offlineTeacher(browser);
  await host(teacher, 'Peril!');
  await expect(teacher.getByRole('radio', { name: 'Solo' })).toHaveCount(0);
  await teacher.getByLabel('Number of teams').fill('2');
  await teacher.getByLabel('Column 1 title').fill('Integers');
  await teacher.getByRole('button', { name: /^Add all \d+/ }).click();
  await setUp(teacher, reached);

  await teacher.getByLabel('Team name').nth(0).fill('Iron Wyverns');
  await teacher.getByLabel('Team name').nth(0).press('Tab');
  await teacher.getByLabel('Team name').nth(1).fill('Gilded Griffins');
  await teacher.getByLabel('Team name').nth(1).press('Tab');
  await teacher.getByRole('button', { name: 'Rules' }).click();
  await teacher.getByRole('checkbox', { name: /Treasure Trove/ }).uncheck();
  await teacher.getByRole('button', { name: 'Save' }).click();
  await teacher.getByRole('button', { name: 'Start' }).click();

  await teacher.getByRole('button', { name: 'Integers for 100' }).click();
  await teacher.keyboard.press('ArrowRight');
  await expect(teacher.getByText('Who was first?')).toBeVisible();
  await teacher.getByRole('button', { name: /Gilded Griffins/ }).click();
  await expect(teacher.getByText('Gilded Griffins, what’s your answer?')).toBeVisible();
  await teacher.getByRole('button', { name: /^B: / }).click();
  // Right, the Tile is theirs; wrong, the buzzers re-arm for the Iron Wyverns.
  await expect(teacher.getByText(/Gilded Griffins got it|Who was first\?/)).toBeVisible();

  await teacher.getByRole('button', { name: 'End game' }).click();
  await expect(teacher.getByRole('heading', { name: 'Champions of the realm' })).toBeVisible();
  expect(reached).toEqual([]);
});

test('Classic with no student devices: a class review the teacher paces, with no counts', async ({ browser }) => {
  const { teacher, reached } = await offlineTeacher(browser);
  await host(teacher, 'Classic');
  await teacher.getByRole('button', { name: /^−6 \+ 14 = \?/ }).click();
  await teacher.getByRole('button', { name: /^9 − 15 = \?/ }).click({ modifiers: ['ControlOrMeta'] });
  await teacher.getByRole('button', { name: 'Add the 2 selected questions' }).first().click();
  await setUp(teacher, reached);
  await expect(teacher.getByRole('heading', { name: 'Class review' })).toBeVisible();
  await teacher.getByRole('button', { name: 'Start' }).click();

  await expect(teacher.getByText('Question 1 of 2')).toBeVisible();
  await expect(teacher.getByText(/answered/)).toHaveCount(0);
  await teacher.getByRole('button', { name: /Show the answer/ }).click();
  await expect(teacher.getByLabel('right answer')).toBeVisible();
  await expect(teacher.getByText(/got it right/)).toHaveCount(0);
  await teacher.keyboard.press('PageDown');
  await expect(teacher.getByText('Question 2 of 2')).toBeVisible();
  await teacher.keyboard.press('PageDown');
  await teacher.getByRole('button', { name: /Finish/ }).click();
  await expect(teacher.getByRole('heading', { name: 'That’s every question!' })).toBeVisible();
  await teacher.getByRole('button', { name: 'End the review' }).click();
  await expect(teacher.getByRole('link', { name: 'Back to games' })).toBeVisible();
  expect(reached).toEqual([]);
});
