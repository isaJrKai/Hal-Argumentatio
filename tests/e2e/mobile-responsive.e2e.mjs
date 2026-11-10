import { test, expect } from '@playwright/test';

const mobileWidths = [320, 360, 390, 430];

async function openReviewWorkspace(page, width) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/?review=1');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
}

async function expectNoPageOverflow(page, width) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(dimensions.viewport, `viewport should be ${width}px`).toBe(width);
  expect(dimensions.document, `document overflow at ${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(width + 1);
  expect(dimensions.body, `body overflow at ${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(width + 1);
}

for (const width of mobileWidths) {
  test(`mobile navigation and Maps remain usable without horizontal page overflow at ${width}px`, async ({ page }) => {
    await openReviewWorkspace(page, width);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Main navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Maps & Lead Intelligence', { exact: true })).toBeVisible();
    await drawer.getByText('Maps & Lead Intelligence', { exact: true }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByText('TERRITORY LEDGER LIST')).toBeVisible({ timeout: 30000 });
    const mapCanvas = page.locator('.hal-map-canvas');
    await expect(mapCanvas).toBeVisible();
    const mapBounds = await mapCanvas.boundingBox();
    expect(mapBounds).not.toBeNull();
    expect(mapBounds.width, `map should fit ${width}px viewport`).toBeLessThanOrEqual(width + 1);
    expect(mapBounds.height, 'mobile map should stay within the compact workspace height').toBeLessThanOrEqual(421);
    await expectNoPageOverflow(page, width);
  });

  test(`mobile chat history opens as a dismissible drawer at ${width}px`, async ({ page }) => {
    await openReviewWorkspace(page, width);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Main navigation' });
    await drawer.getByText('HAL Chat', { exact: true }).click();
    await expect(drawer).toBeHidden();
    const composer = page.locator('.hal-chat-composer');
    await expect(composer).toBeVisible();
    const composerBounds = await composer.boundingBox();
    expect(composerBounds).not.toBeNull();
    expect(composerBounds.width, `chat composer should fit ${width}px viewport`).toBeLessThanOrEqual(width + 1);
    const openHistory = page.getByRole('button', { name: 'Open chat history' });
    await expect(openHistory).toBeVisible();
    await openHistory.click();
    await expect(page.getByRole('button', { name: 'Close chat history' }).last()).toBeVisible();
    await page.getByRole('button', { name: 'Close chat history' }).last().click();
    await expect(openHistory).toBeVisible();
    await expectNoPageOverflow(page, width);
  });
}

test('desktop workspace keeps its wide layout without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?review=1');
  await expect(page.getByText('HALBiz', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
  await expectNoPageOverflow(page, 1280);
});


test('core workspaces remain reachable and fit on a phone', async ({ page }) => {
  const width = 390;
  await openReviewWorkspace(page, width);

  const coreWorkspaces = [
    'Overview',
    'Prospects',
    'Sales Pipeline',
    'Tasks',
    'HAL Chat'
  ];

  for (const label of coreWorkspaces) {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Main navigation' });
    await expect(drawer).toBeVisible();
    await drawer.getByText(label, { exact: true }).first().click();
    await expect(drawer).toBeHidden();

    const workspace = page.locator('.hal-mobile-workspace');
    await expect(workspace).toBeVisible();
    const bounds = await workspace.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.width, `${label} should fit the ${width}px phone viewport`).toBeLessThanOrEqual(width + 1);
    await expectNoPageOverflow(page, width);

    if (label === 'HAL Chat') {
      await expect(page.locator('.hal-chat-composer textarea')).toBeVisible();
    }
  }
});

test('mobile chat composer remains reachable in a short-height viewport', async ({ page }) => {
  await openReviewWorkspace(page, 390);
  await page.setViewportSize({ width: 390, height: 420 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Main navigation' });
  await drawer.getByText('HAL Chat', { exact: true }).click();

  const composer = page.locator('.hal-chat-composer');
  await expect(composer).toBeVisible();
  const bounds = await composer.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.y + bounds.height, 'composer should remain inside the short viewport').toBeLessThanOrEqual(421);
});

test('desktop navigation and workspace layout remain available at tablet and desktop widths', async ({ page }) => {
  for (const width of [768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?review=1');
    await expect(page.locator('#hal-primary-workspace-tabs')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
    const workspace = page.locator('.hal-mobile-workspace');
    await expect(workspace).toBeVisible();
    const bounds = await workspace.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.width, `desktop workspace should remain usable at ${width}px`).toBeGreaterThan(400);
    await expectNoPageOverflow(page, width);
  }
});


test('mobile navigation keeps its guided-tour action reachable on short screens', async ({ page }) => {
  await openReviewWorkspace(page, 320);
  await page.setViewportSize({ width: 320, height: 420 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();

  const drawer = page.getByRole('dialog', { name: 'Main navigation' });
  await expect(drawer).toBeVisible();
  const tourAction = drawer.getByRole('button', { name: 'Take a guided tour' });
  await expect(tourAction).toBeVisible();
  const bounds = await tourAction.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.y + bounds.height, 'guided tour action should remain inside the drawer viewport').toBeLessThanOrEqual(421);
});
