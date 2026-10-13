import { expect, test } from '@playwright/test';

test('a new bank: name it, write a question in the pop-up, edit it, filter by topic, undo a delete', async ({ page }) => {
  await page.goto('/banks');
  await page.getByRole('button', { name: 'New bank' }).first().click();
  await page.getByLabel('Bank title').fill('Fractions');
  await page.getByRole('button', { name: 'New question' }).first().click();

  const dialog = page.getByRole('dialog', { name: 'New question' });
  await dialog.getByLabel('Topics').fill('adding');
  await dialog.getByLabel('Topics').press('Enter');
  await dialog.getByLabel('Question', { exact: true }).fill('What is 1/2 + 1/4?');
  await dialog.getByLabel('Answer A', { exact: true }).fill('3/4');
  await dialog.getByLabel('Answer B', { exact: true }).fill('2/6');
  await dialog.getByRole('button', { name: 'Save question' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Fill in every answer, or remove the empty one.');
  await dialog.getByRole('button', { name: 'Remove answer C' }).click();
  await dialog.getByRole('button', { name: 'Save question' }).click();
  await expect(dialog).toHaveCount(0);

  const card = page.getByRole('button', { name: 'Edit question: What is 1/2 + 1/4?' });
  await card.click();
  const edit = page.getByRole('dialog', { name: 'Edit question' });
  await edit.getByRole('button', { name: 'B is the right answer' }).click();
  await edit.getByLabel('Question', { exact: true }).press('ControlOrMeta+Enter');
  await expect(edit).toHaveCount(0);
  await expect(page.locator('.choices .right')).toHaveText('B. 2/6');

  // The filter beside the search, and the outline, narrow the list to a Topic.
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.getByRole('dialog', { name: 'Topic filter' }).getByLabel('adding').check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^adding/ })).toHaveAttribute('aria-pressed', 'true');

  // Deleting can be undone with Cmd/Ctrl+Z.
  await card.hover();
  await page.getByRole('button', { name: 'Delete: What is 1/2 + 1/4?' }).click();
  await expect(card).toHaveCount(0);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('ControlOrMeta+z');
  await expect(card).toBeVisible();

  // The editor fits the window: the page itself never scrolls.
  const scrolls = await page.evaluate(() => document.scrollingElement!.scrollHeight > window.innerHeight);
  expect(scrolls).toBe(false);

  await page.goto('/banks');
  await expect(page.locator('.card', { hasText: 'Fractions' })).toContainText('1 question');
  await expect(page.locator('.card', { hasText: 'Fractions' })).toContainText('adding');
});
