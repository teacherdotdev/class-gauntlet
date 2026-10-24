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
  await teacher.keyboard.type('picture');
  await teacher.locator('.milkdown-slash-menu:visible').getByText('Picture', { exact: true }).click();
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

test('the toolbar above a question acts on the field the teacher is in', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/banks');
  await page.getByRole('button', { name: 'New bank' }).first().click();
  await page.getByRole('button', { name: 'New question' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'New question' });
  const toolbar = dialog.getByRole('toolbar', { name: 'Formatting' });

  await dialog.getByLabel('Question', { exact: true }).click();
  await page.keyboard.type('Simplify x');
  await toolbar.getByRole('button', { name: 'Superscript' }).click();
  await expect(toolbar.getByRole('button', { name: 'Superscript' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.type('2');
  await expect(dialog.getByLabel('Question', { exact: true }).locator('sup')).toHaveText('2');

  // A picture-only answer, added from the toolbar while in answer B.
  await dialog.getByLabel('Answer A', { exact: true }).fill('x squared');
  await dialog.getByLabel('Answer B', { exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await toolbar.getByRole('button', { name: 'Picture' }).click();
  await (await chooser).setFiles('tests/fixtures/gradient.png');
  await expect(dialog.getByLabel('Answer B', { exact: true }).locator('img')).toBeVisible();

  await dialog.getByLabel('Answer C', { exact: true }).click();
  await toolbar.getByRole('button', { name: 'Math' }).click();
  // Math opens a box for its LaTeX, with a placeholder to type over.
  await expect(dialog.locator('.milkdown-latex-inline-edit .ProseMirror:focus')).toBeVisible();
  await page.keyboard.type('\\pi');
  await page.keyboard.press('Enter');
  await expect(dialog.getByLabel('Answer C', { exact: true }).locator('[data-type=math_inline]')).toHaveAttribute('data-value', '\\pi');

  await dialog.getByRole('button', { name: 'Save question' }).click();
  await expect(dialog).toHaveCount(0);
  const card = page.getByRole('button', { name: /^Edit question: Simplify x/ });
  await expect(card.locator('sup')).toHaveText('2');
  await expect(card.locator('.choices img')).toBeVisible();
  await expect(card.locator('.choices .katex')).toBeVisible();
});

test('a picture is resized from its corners, Google Docs style, and keeps its shape', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/banks');
  await page.getByRole('button', { name: 'New bank' }).first().click();
  await page.getByRole('button', { name: 'New question' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'New question' });
  await dialog.getByLabel('Question', { exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await dialog.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', { name: 'Picture' }).click();
  await (await chooser).setFiles('tests/fixtures/gradient.png');
  const picture = dialog.getByLabel('Question', { exact: true }).locator('img[data-type="image-block"]');
  await expect(picture).toBeVisible();
  const before = (await picture.boundingBox())!;

  await dialog.locator('.milkdown-image-block .image-wrapper').click();
  const corner = dialog.locator('.picture-frame:not([hidden]) .picture-handle.se');
  await expect(corner).toBeVisible();
  const grip = (await corner.boundingBox())!;
  await page.mouse.move(grip.x + 5, grip.y + 5);
  await page.mouse.down();
  await page.mouse.move(grip.x + 5 - before.width / 2, grip.y + 5, { steps: 5 });
  await page.mouse.up();

  const after = (await picture.boundingBox())!;
  expect(Math.abs(after.width - before.width / 2)).toBeLessThan(4);
  expect(after.height / after.width).toBeCloseTo(before.height / before.width, 1);
  await page.screenshot({ path: test.info().outputPath('resized.png') });
  // A click anywhere else lets the picture go.
  await dialog.getByLabel('Answer A', { exact: true }).click();
  await expect(dialog.locator('.picture-frame:not([hidden])')).toHaveCount(0);
  // The size is kept: it survives saving and opening the question again.
  await dialog.getByLabel('Answer A', { exact: true }).fill('A gradient');
  await dialog.getByLabel('Answer B', { exact: true }).fill('A square');
  await dialog.getByRole('button', { name: 'Remove answer C' }).click();
  await dialog.getByRole('button', { name: 'Save question' }).click();
  await page.getByRole('button', { name: /^Edit question:/ }).click();
  const again = page.getByRole('dialog', { name: 'Edit question' }).getByLabel('Question', { exact: true }).locator('img[data-type="image-block"]');
  await expect(again).toBeVisible();
  await expect.poll(async () => Math.round((await again.boundingBox())!.width)).toBeLessThan(Math.round(before.width * 0.6));
});
