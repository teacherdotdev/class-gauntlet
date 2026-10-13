import { expect, test } from '@playwright/test';

test('a question with math and a picture is written in the editor and shows on a student’s phone', async ({ browser }) => {
  const teacher = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await teacher.goto('/banks');
  await teacher.getByRole('button', { name: 'New bank' }).first().click();
  await teacher.getByLabel('Bank title').fill('Squares');
  const bankId = new URL(teacher.url()).searchParams.get('id')!;
  await teacher.getByRole('button', { name: 'New question' }).first().click();

  const dialog = teacher.getByRole('dialog', { name: 'New question' });
  await dialog.getByLabel('Question', { exact: true }).click();
  // $…$ becomes math as it's typed, and the / menu adds a picture.
  await teacher.keyboard.type('What is $x^2$ when x = 3?');
  await expect(dialog.locator('.katex').first()).toBeVisible();
  await teacher.keyboard.press('Enter');
  await teacher.keyboard.type('/');
  await expect(teacher.locator('.milkdown-slash-menu:visible')).toBeVisible();
  await teacher.keyboard.type('image');
  await teacher.locator('.milkdown-slash-menu:visible').getByText('Image', { exact: true }).click();
  await dialog.locator('.milkdown-image-block input[type=file]').first().setInputFiles('tests/fixtures/gradient.png');
  await expect(dialog.locator('.milkdown-image-block img')).toBeVisible();
  await dialog.getByLabel('Answer A', { exact: true }).fill('9');
  await dialog.getByLabel('Answer B', { exact: true }).fill('6');
  await dialog.getByRole('button', { name: 'Remove answer C' }).click();
  await dialog.getByRole('button', { name: 'Save question' }).click();
  await expect(dialog).toHaveCount(0);

  const card = teacher.getByRole('button', { name: /^Edit question: What is x\^2 when x = 3\?/ });
  await expect(card.locator('.katex')).toBeVisible();
  await expect(card.locator('img')).toBeVisible();

  await teacher.goto(`/games/classic?bank=${bankId}`);
  await teacher.getByRole('button', { name: /Open the lobby/ }).click();
  await expect(teacher.locator('.lobby .status')).toHaveCount(0, { timeout: 30_000 });
  const pin = (await teacher.locator('.pin strong').textContent())!.replace(/\D/g, '');

  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await phone.goto(`/join?code=${pin}`);
  await phone.getByLabel('Your name').fill('Ana');
  await phone.getByRole('button', { name: 'Join' }).click();
  await expect(phone.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  await teacher.getByRole('button', { name: 'Start' }).click();

  await expect(teacher.locator('.prompt .katex')).toBeVisible();
  await expect(teacher.locator('.prompt img')).toBeVisible();
  // The phone has no copy of the picture: the teacher's tab sends it.
  await expect(phone.locator('.prompt .katex')).toBeVisible();
  await expect(phone.locator('.prompt img')).toHaveAttribute('src', /^blob:/);
  expect(await phone.locator('.prompt img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(300);
  await phone.getByRole('button', { name: 'A: 9' }).click();
  await expect(phone.getByRole('heading', { name: 'Correct!' })).toBeVisible();
});
