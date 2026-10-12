import { expect, test } from '@playwright/test';

test('imports a Kahoot workbook, saying which questions were left out', async ({ page }) => {
  await page.goto('/questions');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/Planets and capitals.xlsx');
  const report = page.getByRole('status');
  await expect(report).toContainText('Read as Kahoot spreadsheet: added 2 questions in 1 set. These were left out:');
  await expect(report).toContainText('Question 2 (line 10): it has more than one right answer');
  await expect(page.locator('.card', { hasText: 'Planets and capitals' })).toContainText('2 questions');
});
