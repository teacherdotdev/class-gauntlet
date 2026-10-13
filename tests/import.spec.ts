import { expect, test } from '@playwright/test';

test('imports a Kahoot workbook through the Import pop-up, showing what was left out before adding it', async ({ page }) => {
  await page.goto('/banks');
  await page.getByRole('button', { name: 'Import' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import questions' });
  await expect(dialog.getByText('Supports')).toBeVisible();
  await dialog.getByLabel('A question file').setInputFiles('tests/fixtures/Planets and capitals.xlsx');
  await expect(dialog.getByText('Read “Planets and capitals.xlsx” as Kahoot spreadsheet')).toBeVisible();
  await expect(dialog.getByRole('status')).toContainText('2 coming in');
  await expect(dialog.getByRole('status')).toContainText('1 left out');
  await expect(dialog).toContainText('Question 2 (line 10): it has more than one right answer');
  await dialog.getByRole('button', { name: 'Import 2 questions' }).click();
  await expect(page.locator('.card', { hasText: 'Planets and capitals' })).toContainText('2 questions');
});

test('a pasted spreadsheet imports, and a file it can’t read points to the AI instructions', async ({ page }) => {
  await page.goto('/banks');
  await page.getByRole('button', { name: 'Import' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import questions' });
  await dialog.getByLabel('A question file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('just some notes') });
  await expect(dialog.getByRole('alert')).toContainText('copy the instructions for an AI below');
  await expect(dialog.getByRole('button', { name: 'Copy instructions for an AI' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Paste the cells' }).click();
  await dialog.getByLabel(/Paste cells/).fill('question\tA\tB\tanswer\nCapital of France?\tParis\tRome\tA\n');
  await dialog.getByRole('button', { name: 'Read my questions' }).click();
  await dialog.getByLabel('Bank name').fill('Capitals');
  await dialog.getByRole('button', { name: 'Import 1 question' }).click();
  await expect(page.locator('.card', { hasText: 'Capitals' })).toContainText('1 question');
});
