import { expect, test } from '@playwright/test';

test('a bank with a Picture is shared as a Bank File, and another teacher imports it whole', async ({ browser }) => {
  const teacher = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await teacher.goto('/banks');
  await teacher.getByRole('button', { name: 'New bank' }).first().click();
  await teacher.getByLabel('Bank title').fill('Graphs');
  await teacher.getByRole('button', { name: 'New question' }).first().click();
  const dialog = teacher.getByRole('dialog', { name: 'New question' });
  await dialog.getByLabel('Question', { exact: true }).click();
  await teacher.keyboard.type('Which graph is $y = x^2$?');
  await dialog.getByLabel('Answer A', { exact: true }).click();
  const chooser = teacher.waitForEvent('filechooser');
  await dialog.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', { name: 'Picture' }).click();
  await (await chooser).setFiles('tests/fixtures/gradient.png');
  await expect(dialog.getByLabel('Answer A', { exact: true }).locator('img')).toBeVisible();
  await dialog.getByLabel('Answer B', { exact: true }).fill('A straight line');
  await dialog.getByRole('button', { name: 'Remove answer C' }).click();
  await dialog.getByRole('button', { name: 'Save question' }).click();
  await expect(dialog).toHaveCount(0);

  // A link can't carry the Picture, so Share offers the file first.
  await teacher.getByRole('button', { name: 'Share' }).click();
  const share = teacher.getByRole('dialog', { name: 'Share “Graphs”' });
  await expect(share).toContainText('1 Picture');
  const download = teacher.waitForEvent('download');
  await share.getByRole('button', { name: 'Download file' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('Graphs.parrot.zip');
  const path = test.info().outputPath('Graphs.parrot.zip');
  await file.saveAs(path);

  const colleague = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await colleague.goto('/banks');
  await colleague.getByRole('button', { name: 'Import' }).click();
  await colleague.getByLabel('A question file').setInputFiles(path);
  await expect(colleague.getByText('Read “Graphs.parrot.zip” as Test Parrot')).toBeVisible();
  await colleague.getByRole('button', { name: 'Import 1 question' }).click();
  await colleague.getByRole('link', { name: /Graphs/ }).click();
  const card = colleague.getByRole('button', { name: /^Edit question: Which graph is/ });
  await expect(card.locator('.katex')).toBeVisible();
  await expect(card.locator('.choices img')).toBeVisible();
  expect(await card.locator('.choices img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(300);
});

test('Download and Export give a Bank File, with a spreadsheet one step away', async ({ page }) => {
  await page.goto('/banks');
  await page.getByRole('button', { name: 'New bank' }).first().click();
  await page.getByLabel('Bank title').fill('Facts');
  await page.getByRole('button', { name: 'New question' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'New question' });
  await dialog.getByLabel('Question', { exact: true }).fill('What is 7 × 8?');
  await dialog.getByLabel('Answer A', { exact: true }).fill('56');
  await dialog.getByLabel('Answer B', { exact: true }).fill('54');
  await dialog.getByRole('button', { name: 'Remove answer C' }).click();
  await dialog.getByRole('button', { name: 'Save question' }).click();

  const file = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await file).suggestedFilename()).toBe('Facts.parrot.zip');
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'More ways to download' }).click();
  await page.getByRole('menuitem', { name: /Spreadsheet \(CSV\)/ }).click();
  expect((await csv).suggestedFilename()).toBe('Facts.csv');

  await page.goto('/banks');
  const all = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  expect((await all).suggestedFilename()).toMatch(/^class-gauntlet-banks-\d{4}-\d\d-\d\d\.parrot\.zip$/);
});
