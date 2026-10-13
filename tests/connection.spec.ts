import { expect, test } from '@playwright/test';

test('the connection light turns red when a filter blocks matchmaking, and offers a report', async ({ page }) => {
  await page.route(/peer\.(classgauntlet|teacher)/, (route) => route.abort());
  await page.routeWebSocket(/peer\./, (socket) => socket.close());
  await page.goto('/games');
  const light = page.getByRole('button', { name: 'Connection problem' });
  await expect(light).toBeVisible({ timeout: 30_000 });
  await light.click();
  const dialog = page.getByRole('dialog', { name: 'Your connection' });
  await expect(dialog).toContainText('can’t reach the matchmaking server');
  await expect(dialog.locator('pre')).toContainText('Class Gauntlet connection report (SERVER-BLOCKED)');
  await expect(dialog.locator('pre')).toContainText('peer.classgauntlet.com: answer');
});
