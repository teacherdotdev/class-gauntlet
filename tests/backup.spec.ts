import { expect, test } from '@playwright/test';

test('exporting everything and importing it back restores the banks', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('.have')).toContainText('1 question bank');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export everything' }).click();
  const file = await (await download).path();

  await page.evaluate(() => localStorage.setItem('classgauntlet:sets', '[]'));
  await page.reload();
  await expect(page.locator('.have')).toContainText('0 question banks');

  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByRole('alert')).toContainText('has 1 question bank');
  await page.getByRole('button', { name: 'Replace everything' }).click();
  await expect(page.locator('.have')).toContainText('1 question bank');
});

test('a file that isn’t a backup is refused', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('input[type=file]').setInputFiles({ name: 'notes.csv', mimeType: 'text/csv', buffer: Buffer.from('question,A,B') });
  await expect(page.getByRole('alert')).toContainText('isn’t a Class Gauntlet backup');
});
