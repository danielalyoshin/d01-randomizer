import { test, expect } from '@playwright/test';

test('exclusions persist and each round picks only one of the remaining groups', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-exclude]')).toHaveCount(8);
  await page.getByRole('checkbox', { name: 'Group 01 already presented' }).check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Group 01 already presented' })).toBeChecked();
  await expect(page.locator('#ready-count')).toHaveText('7');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.getByRole('checkbox', { name: 'Group 02 already presented' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reveal catch' }).click();
  await expect(page.locator('#results-dialog')).toBeVisible();
  await expect(page.locator('.catch-row')).toHaveCount(7);
  await expect(page.locator('.winning-catch')).toHaveCount(1);
  await expect(page.locator('.catch-group')).not.toContainText(['Group 01']);
  const winner = await page.locator('.result-heading h2').textContent();
  const lengths = await page.locator('.fish-length').allTextContents();
  const winnerLength = await page.locator('.winning-catch .fish-length').textContent();
  expect(parseFloat(winnerLength)).toBe(Math.min(...lengths.map(parseFloat)));
  const names = await page.locator('.catch-group > span:nth-child(2)').allTextContents();
  expect(names).toEqual(['Group 02', 'Group 03', 'Group 04', 'Group 05', 'Group 06', 'Group 07', 'Group 08']);
  await page.getByRole('button', { name: 'Mark presented & return' }).click();
  await expect(page.getByRole('checkbox', { name: `${winner} already presented` })).toBeChecked();
  await expect(page.locator('#ready-count')).toHaveText('6');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await page.getByRole('button', { name: 'Reveal catch' }).click();
  await expect(page.locator('.catch-row')).toHaveCount(6);
  const nextNames = await page.locator('.catch-group > span:nth-child(2)').allTextContents();
  expect(nextNames).not.toContain(winner);
  expect(nextNames).not.toContain('Group 01');
});

test('a full expedition catches every fish, follows hooks down, and resumes after pause', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  // The catch feed's gauge has one segment per boat in the round.
  expect(await page.locator('.game-card').evaluate(card => getComputedStyle(card).getPropertyValue('--hooks').trim())).toBe('8');
  await expect.poll(async () => parseFloat(await page.locator('#depth').textContent())).toBeGreaterThan(2);
  // The name tags stay pinned as the dock strip while the camera dives.
  await expect(page.locator('.boat-tag').first()).toBeInViewport();
  await expect(page.locator('.boat-tag').first()).toHaveText('01 Group 01');
  // The masthead lifts off the page during the dive, so it never covers a boat reeling in.
  await expect(page.locator('.game-card')).toHaveClass(/is-diving/, { timeout: 20000 });
  await expect(page.locator('.masthead')).toBeHidden();
  await expect(page.locator('#catch-feed-title')).toHaveText(/^\d\d\u00a0·\u00a0Group \d\d$/, { timeout: 20000 });
  await page.getByRole('button', { name: 'Pause fishing' }).click();
  // Paused, the masthead and Options are back in reach.
  await expect(page.locator('.masthead')).toBeVisible();
  await expect(page.locator('#options-toggle')).toBeVisible();
  const pausedDepth = await page.locator('#depth').textContent();
  await page.waitForTimeout(400);
  await expect(page.locator('#depth')).toHaveText(pausedDepth);
  await page.getByRole('button', { name: 'Resume fishing' }).click();
  await expect(page.locator('#results-dialog')).toBeVisible({ timeout: 35000 });
  await expect(page.locator('.catch-row')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('the board prints Presented and toggles it in one action from the name tag or the Options list', async ({ page }) => {
  await page.goto('/');
  // The board carries no form controls; each name tag is the toggle and prints its own state.
  await expect(page.locator('#boat-labels input')).toHaveCount(0);
  const stamp = (boat) => page.locator('.boat-label').nth(boat - 1).locator('.presented-stamp');
  await page.getByRole('checkbox', { name: 'Group 03 already presented' }).click();
  await expect(page.getByRole('checkbox', { name: 'Group 03 already presented' })).toBeChecked();
  await expect(stamp(3)).toBeVisible();
  await expect(page.locator('#ready-count')).toHaveText('7');
  await page.locator('#options-toggle').click();
  await expect(page.getByRole('checkbox', { name: 'Group 03 presented', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Group 03 presented', exact: true }).uncheck();
  await expect(page.getByRole('checkbox', { name: 'Group 03 already presented' })).not.toBeChecked();
  await expect(stamp(3)).toBeHidden();
  await page.getByRole('checkbox', { name: 'Group 05 presented', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Group 05 presented', exact: true })).toBeFocused();
  await expect(page.getByRole('checkbox', { name: 'Group 05 already presented' })).toBeChecked();
  await expect(stamp(5)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Group 05 already presented' })).toBeChecked();
  await expect(page.locator('#ready-count')).toHaveText('7');
});

test('one remaining boat can catch a fish; all presented disables casting; resetting restores everyone', async ({ page }) => {
  await page.goto('/');
  for (let i = 1; i <= 7; i++) await page.getByRole('checkbox', { name: `Group 0${i} already presented` }).check();
  await expect(page.locator('#ready-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('#results-dialog')).toBeVisible({ timeout: 14000 });
  await expect(page.locator('.result-heading h2')).toHaveText('Group 08');
  await expect(page.locator('.catch-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Mark presented & return' }).click();
  await expect(page.getByRole('button', { name: 'Cast the lines' })).toBeDisabled();
  await page.locator('#options-toggle').click();
  await page.getByRole('button', { name: 'Reset presented', exact: true }).click();
  await expect(page.locator('#ready-count')).toHaveText('8');
  await expect(page.getByRole('button', { name: 'Cast the lines' })).toBeEnabled();
});

test('group editing, limits, reduced motion, and saved results work without HTML injection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#crew-list')).toBeHidden();
  await page.locator('#options-toggle').click();
  await expect(page.locator('#crew-list')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#crew-list')).toBeHidden();
  await expect(page.locator('#options-toggle')).toBeFocused();
  // Space belongs to the game: with focus left on the Options tag it casts, and never reopens Options.
  await page.keyboard.press('Space');
  await expect(page.locator('#results-dialog')).toBeVisible();
  await expect(page.locator('#crew-list')).toBeHidden();
  await page.keyboard.press('Escape');
  await page.locator('#options-toggle').click();
  await expect(page.locator('#crew-list')).toBeVisible();
  const name = '<b>Fish & Chips</b>';
  await page.getByRole('textbox', { name: 'Name for boat 1', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Name for boat 2', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Name for boat 2', exact: true })).toBeFocused();
  await expect(page.locator('.boat-name').first()).toHaveText(name);
  await expect(page.locator('.boat-name b')).toHaveCount(0);
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Add a boat' }).click();
  await expect(page.getByRole('button', { name: 'Add a boat' })).toBeDisabled();
  await expect(page.locator('[data-exclude]')).toHaveCount(12);
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('#crew-list')).toBeHidden();
  await expect(page.locator('#results-dialog')).toBeVisible();
  await expect(page.locator('.catch-row')).toHaveCount(12);
  await page.getByRole('button', { name: 'Back to the boats', exact: true }).click();
  await page.reload();
  await page.locator('#options-toggle').click();
  await page.getByRole('button', { name: 'View last catch' }).click();
  await expect(page.locator('.catch-row')).toHaveCount(12);
  await expect(page.locator('#crew-list')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#options-toggle')).toBeFocused();
  await page.locator('#options-toggle').click();
  for (let i = 0; i < 10; i++) await page.locator('[data-remove]').last().click();
  await expect(page.locator('[data-exclude]')).toHaveCount(2);
  await expect(page.locator('[data-remove]').first()).toBeDisabled();
});

test('mobile keeps the page within the viewport and every boat checkbox is reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.getByRole('button', { name: 'Cast the lines' })).toBeInViewport();
  await page.locator('#options-toggle').click();
  await expect(page.getByRole('textbox', { name: 'Name for boat 1', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('#options-toggle').click();
  await page.getByRole('checkbox', { name: 'Group 08 already presented' }).check();
  await expect(page.getByRole('checkbox', { name: 'Group 08 already presented' })).toBeChecked();
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await page.getByRole('button', { name: 'Reveal catch' }).click();
  await expect(page.locator('.catch-row')).toHaveCount(7);
  expect(await page.locator('#results-dialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
});

test('the reveal fits every row on common projector screens and Options folds away behind dialogs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#options-toggle').click();
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await expect(page.locator('#crew-list')).toBeHidden();
  await page.keyboard.press('Escape');
  const everyRowFits = () => page.locator('#results-dialog').evaluate(dialog => {
    const bottom = Math.min(innerHeight, dialog.getBoundingClientRect().bottom);
    return dialog.scrollHeight <= dialog.clientHeight && [...dialog.querySelectorAll('.catch-row, .comparison-scale')].every(el => el.getBoundingClientRect().bottom <= bottom);
  });
  for (const [width, height] of [[1280, 720], [1024, 768], [1024, 500]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Cast the lines' }).click();
    await expect(page.locator('.catch-row')).toHaveCount(8);
    expect(await everyRowFits()).toBe(true);
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#options-toggle').click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Add a boat' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('.catch-row')).toHaveCount(12);
  expect(await everyRowFits()).toBe(true);
});

test('the results speak the verdict, focus the way on, and read as a table', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: /Fishing boats/ })).toBeVisible();
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await page.keyboard.press('r');
  const results = page.locator('#results-dialog');
  await expect(results).toBeVisible();
  // While the evidence prints, the page itself holds focus, so an early Enter can't dismiss or mark.
  await expect(results).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(results).toBeVisible();
  // One control is named "Back to the boats"; the corner cross is just "Close".
  await expect(page.getByRole('button', { name: 'Back to the boats', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  const haul = page.getByRole('table', { name: 'Every catch, in boat order' });
  await expect(haul.getByRole('row')).toHaveCount(9);
  await expect(haul.getByRole('columnheader')).toHaveText(['The day’s haul', 'Catch drawn to scale', 'Fish length']);
  await expect(haul.getByRole('rowheader').first()).toHaveText('01Group 01');
  // Focus lands on Mark presented as the actions print, and the verdict is spoken from inside the dialog.
  await expect(page.getByRole('button', { name: 'Mark presented & return' })).toBeFocused({ timeout: 4000 });
  const winner = await page.locator('.result-heading h2').textContent();
  await expect(page.locator('#results-status')).toContainText(`${winner}, presents next with the smallest fish`);
  await page.keyboard.press('Enter');
  await expect(results).toBeHidden();
  await expect(page.getByRole('checkbox', { name: `${winner} already presented` })).toBeChecked();
  await expect(page.locator('#toast')).toContainText(`${winner} marked presented`);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('checkbox', { name: `${winner} already presented` })).not.toBeChecked();
  await expect(page.locator('#ready-count')).toHaveText('8');
  await expect(page.locator('#toast')).toContainText('back on board');
});

test('Space casts and pauses from any control, and a held round is stamped on the board', async ({ page }) => {
  await page.goto('/');
  // Focus left on a name tag after a click: Space casts rather than toggling it again.
  await page.getByRole('checkbox', { name: 'Group 02 already presented' }).click();
  await expect(page.getByRole('checkbox', { name: 'Group 02 already presented' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause fishing' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Group 02 already presented' })).toBeChecked();
  await expect(page.locator('.hold-stamp')).toBeHidden();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Resume fishing' })).toBeVisible();
  await expect(page.locator('.hold-stamp')).toBeVisible();
  await expect(page.locator('.hold-stamp strong')).toHaveText('Lines held');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause fishing' })).toBeVisible();
  await expect(page.locator('.hold-stamp')).toBeHidden();
});

test('duplicate names are refused, Enter ticks a box, and a reset or a removed boat can be undone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#options-toggle').click();
  const boat1 = page.getByRole('textbox', { name: 'Name for boat 1', exact: true });
  const boat2 = page.getByRole('textbox', { name: 'Name for boat 2', exact: true });
  await boat1.fill('Rebase Rangers');
  await boat1.press('Tab');
  await boat2.fill('  rebase   RANGERS ');
  await expect(boat2).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#crew-error')).toHaveText('Boat 01 already sails as “Rebase Rangers”. Pick another name.');
  await boat2.press('Enter');
  await expect(boat2).toHaveValue('Group 02');
  await expect(boat2).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#crew-error')).toContainText('Kept “Group 02”.');
  await expect(page.locator('.boat-name').nth(1)).toHaveText('Group 02');
  // Space belongs to the game, so Enter ticks a Presented box.
  await page.getByRole('checkbox', { name: 'Group 02 presented', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Group 02 presented', exact: true })).toBeChecked();
  await expect(page.locator('#ready-count')).toHaveText('7');
  await page.getByRole('button', { name: 'Reset presented', exact: true }).click();
  await expect(page.locator('#ready-count')).toHaveText('8');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('#ready-count')).toHaveText('7');
  await expect(page.getByRole('checkbox', { name: 'Group 02 presented', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Remove Rebase Rangers' }).click();
  await expect(page.locator('[data-exclude]')).toHaveCount(7);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('#crew-list')).toBeVisible();
  await expect(page.locator('[data-exclude]')).toHaveCount(8);
  await expect(boat1).toHaveValue('Rebase Rangers');
  await expect(boat1).toBeFocused();
});
