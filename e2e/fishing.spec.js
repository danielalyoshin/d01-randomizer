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
  await expect(page.locator('#help-tag')).toBeHidden();
  await expect(page.locator('#catch-feed-title')).toHaveText(/^\d\d\u00a0·\u00a0Group \d\d$/, { timeout: 20000 });
  await page.getByRole('button', { name: 'Pause fishing' }).click();
  // Paused, the masthead and Options are back in reach.
  await expect(page.locator('.masthead')).toBeVisible();
  await expect(page.locator('#options-toggle')).toBeVisible();
  await expect(page.locator('#help-tag')).toBeVisible();
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
  await page.locator('#help-tag').click();
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

test('a first run greets the TA with one note, and the default boats stay one click from casting', async ({ page }) => {
  await page.goto('/');
  const note = page.getByRole('complementary', { name: 'Every group gets a boat.' });
  await expect(note).toBeVisible();
  await expect(page.locator('[data-exclude]')).toHaveCount(8);
  // The note never stands between the TA and the lever: one click casts the default eight.
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.getByRole('button', { name: 'Pause fishing' })).toBeVisible();
  await expect(note).toBeHidden();
  await page.reload();
  await expect(note).toBeHidden();
});

test('Got it retires the note for good, and a browser that already has boats never sees it', async ({ page }) => {
  await page.goto('/');
  const note = page.getByRole('complementary', { name: 'Every group gets a boat.' });
  await expect(note).toBeVisible();
  // Still there after a reload: the first run lasts until the TA casts or says Got it.
  await page.reload();
  await expect(note).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(note).toBeHidden();
  await expect(page.getByRole('button', { name: 'Cast the lines' })).toBeFocused();
  await page.reload();
  await expect(note).toBeHidden();
  // A browser from before the note: boats saved, but no first-run mark.
  await page.evaluate(() => localStorage.removeItem('daily-catch-first-run'));
  await page.reload();
  await expect(note).toBeHidden();
});

test('How to play opens from the board: the ? plate, the ? key, and the first-run note', async ({ page }) => {
  await page.goto('/');
  const help = page.locator('#help-dialog');
  await page.locator('#options-toggle').click();
  await expect(page.locator('#options-panel').getByRole('button', { name: 'How to play' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'How to play' }).first().click();
  await expect(help).toBeVisible();
  await expect(help.getByRole('definition')).toContainText(['Open this guide from the board.']);
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-tag')).toBeFocused();
  await page.keyboard.press('Shift+?');
  await expect(help).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('complementary', { name: 'Every group gets a boat.' }).getByRole('button', { name: 'How to play' }).click();
  await expect(help).toBeVisible();
  await page.keyboard.press('Escape');
  // Mid-round, the guide holds the lines while it's open.
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await page.keyboard.press('Shift+?');
  await expect(help).toBeVisible();
  await expect(page.locator('#pause-button')).toHaveAttribute('aria-label', 'Resume fishing');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Pause fishing' })).toBeVisible();
});

test('a pasted list names the boats within 2–12 groups and 32 characters, and can be undone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Paste group names' }).click();
  const list = page.getByRole('textbox', { name: 'Group names, one per line' });
  const use = page.getByRole('button', { name: 'Use these names' });
  const status = page.locator('#list-status');
  // The list opens on the crew as it stands, selected, so one paste replaces it.
  await expect(list).toBeFocused();
  await expect(list).toHaveValue(Array.from({ length: 8 }, (_, i) => `Group 0${i + 1}`).join('\n'));
  await expect(page.locator('#crew-list')).toBeHidden();
  await list.fill(Array.from({ length: 13 }, (_, i) => `Team ${i + 1}`).join('\n'));
  await expect(status).toHaveText('13 names, but the dock holds 12 boats. Take out 1.');
  await expect(use).toBeDisabled();
  await expect(page.locator('#list-gutter li.is-over')).toHaveText(['13']);
  await list.fill('Solo');
  await expect(status).toHaveText('One name so far. The dock needs at least 2 boats.');
  await expect(use).toBeDisabled();
  await list.fill('Rebase Rangers\n rebase  RANGERS ');
  await expect(status).toHaveText('“Rebase Rangers” is on the list twice. Every boat needs its own name.');
  await expect(use).toBeDisabled();
  // Markers and blank lines drop out; a long name is cut at a word, and the list says so first.
  await list.fill('1. Rebase Rangers\n\n2. Null Pointers\n3. Team 3: Alice Wong, Bob Li, Carol Chen\n• The Segfaults\n');
  await expect(status).toHaveText('4 names, one boat each (4 fewer than now). Boat 03 runs past 32 characters and will sail as “Team 3: Alice Wong, Bob Li”.');
  await expect(page.locator('#list-gutter li.is-flagged')).toHaveText(['03']);
  await use.click();
  await expect(page.locator('.boat-name')).toHaveText(['Rebase Rangers', 'Null Pointers', 'Team 3: Alice Wong, Bob Li', 'The Segfaults']);
  await expect(page.getByRole('textbox', { name: 'Name for boat 3', exact: true })).toHaveValue('Team 3: Alice Wong, Bob Li');
  await expect(page.locator('#toast')).toContainText('4 boats named from your list.');
  await expect(page.getByRole('button', { name: 'Paste a list' })).toBeFocused();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('[data-exclude]')).toHaveCount(8);
  await expect(page.locator('.boat-name').first()).toHaveText('Group 01');
  // Ctrl/Cmd+Enter uses the list from the keyboard.
  await page.getByRole('button', { name: 'Paste a list' }).click();
  await list.fill('Alpha\nBravo');
  await list.press('ControlOrMeta+Enter');
  await expect(page.locator('.boat-name')).toHaveText(['Alpha', 'Bravo']);
});

test('a list pasted into a name field opens as a list, and Esc leaves the crew as it was', async ({ page }) => {
  await page.goto('/');
  await page.locator('#options-toggle').click();
  const boat3 = page.getByRole('textbox', { name: 'Name for boat 3', exact: true });
  await boat3.focus();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData('text/plain', 'Alpha\nBravo\r\nCharlie\n');
    document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  const list = page.getByRole('textbox', { name: 'Group names, one per line' });
  // The boats above the field stay; the pasted lines take the rest.
  await expect(list).toBeFocused();
  // A textarea keeps \n line ends, whatever the clipboard used.
  await expect(list).toHaveValue('Group 01\nGroup 02\nAlpha\nBravo\nCharlie');
  await expect(page.locator('#list-status')).toHaveText('5 names, one boat each (3 fewer than now).');
  // Esc steps back one layer: the list closes, Options stays open, and nothing changed.
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(page.locator('#crew-list')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Paste a list' })).toBeFocused();
  await expect(page.locator('[data-exclude]')).toHaveCount(8);
  // A one-line paste is just a name.
  await boat3.focus();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData('text/plain', 'Solo\n');
    document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect(list).toBeHidden();
});

test('casting uses an open list, holds for one that cannot be used, and L reopens the last catch', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Paste group names' }).click();
  const list = page.getByRole('textbox', { name: 'Group names, one per line' });
  await list.fill('Alpha\nalpha');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('#results-dialog')).toBeHidden();
  await expect(list).toBeVisible();
  await expect(list).toBeFocused();
  await expect(page.locator('#toast')).toContainText('The name list isn’t ready. Fix it or cancel it, then cast.');
  await list.fill('Alpha\nBravo\nCharlie');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('#results-dialog')).toBeVisible();
  await expect(page.locator('.catch-group > span:nth-child(2)')).toHaveText(['Alpha', 'Bravo', 'Charlie']);
  await page.keyboard.press('Escape');
  await expect(page.locator('#results-dialog')).toBeHidden();
  await page.keyboard.press('l');
  await expect(page.locator('#results-dialog')).toBeVisible();
  await expect(page.locator('.result-heading .eyebrow')).toHaveText('The last catch');
});

test('today’s catch lists every cast in order, and a quiet re-roll is stamped thrown back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const ledger = page.getByRole('region', { name: 'Today’s catch' });
  const lines = ledger.locator('.ledger-cast');
  await expect(ledger).toBeHidden();
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  const first = await page.locator('.result-heading h2').textContent();
  const firstLength = await page.locator('.winning-catch .fish-length').textContent();
  await page.getByRole('button', { name: 'Mark presented & return' }).click();
  await expect(ledger).toBeVisible();
  await expect(ledger.locator('.ledger-day')).toContainText('Today’s catch');
  await expect(lines).toHaveCount(1);
  await expect(lines.first()).toHaveClass(/is-presented/);
  await expect(lines.first()).toContainText(first);
  await expect(lines.first().locator('.ledger-length')).toHaveText(firstLength);
  // Closing the results without marking leaves the catch on deck; casting again throws it back.
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  const second = await page.locator('.result-heading h2').textContent();
  await page.getByRole('button', { name: 'Back to the boats' }).click();
  await expect(lines.nth(1)).toHaveClass(/is-on-deck/);
  await expect(lines.nth(1)).toContainText('On deck');
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  const third = await page.locator('.result-heading h2').textContent();
  await page.getByRole('button', { name: 'Back to the boats' }).click();
  await expect(lines).toHaveCount(3);
  await expect(lines.nth(1)).toHaveClass(/is-thrown-back/);
  await expect(lines.nth(1)).toContainText(second);
  await expect(lines.nth(1)).toContainText('Thrown back');
  // The winner marked by its name tag counts as presented, just as from the results.
  await page.getByRole('checkbox', { name: `${third} already presented` }).click();
  await expect(lines.nth(2)).toHaveClass(/is-presented/);
  await page.reload();
  await expect(lines).toHaveCount(3);
  await expect(lines.nth(1)).toHaveClass(/is-thrown-back/);
  // Reset presented clears the ledger with the marks; one Undo brings both back.
  await page.locator('#options-toggle').click();
  await page.getByRole('button', { name: 'Reset presented', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Today’s catch is cleared.');
  await expect(ledger).toBeHidden();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('#ready-count')).toHaveText('6');
  // The slip steps aside while Options is open, as the dock note does.
  await expect(ledger).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(lines).toHaveCount(3);
});

test('a reload mid-round is written as a cut line; its fixed catch can still be revealed, or is struck on the next cast', async ({ page }) => {
  await page.goto('/');
  const ledger = page.getByRole('region', { name: 'Today’s catch' });
  const lines = ledger.locator('.ledger-cast');
  const latestWinner = () => page.evaluate(() => JSON.parse(localStorage.getItem('daily-catch-ledger-v1')).casts.at(-1).winner);
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('#catch-feed')).toBeVisible();
  const fixed = await latestWinner();
  await page.reload();
  // The cut line never prints a winner the room hasn't seen.
  await expect(lines.first()).toHaveClass(/is-held/);
  await expect(lines.first()).toContainText('Catch held · 8 boats out');
  await expect(ledger).not.toContainText(fixed.name);
  await expect(page.locator('#toast')).toContainText('Cast 1 was cut short.');
  await page.getByRole('button', { name: 'Reveal its catch' }).click();
  await expect(page.locator('.result-heading h2')).toHaveText(fixed.name);
  await expect(page.locator('.winning-catch .fish-length')).toHaveText(`${(fixed.length / 10).toFixed(1)} cm`);
  await page.getByRole('button', { name: 'Mark presented & return' }).click();
  await expect(lines.first()).toHaveClass(/is-presented/);

  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await expect(page.locator('#catch-feed')).toBeVisible();
  const cut = await latestWinner();
  await page.reload();
  await page.locator('#options-toggle').click();
  await expect(page.getByRole('button', { name: 'Reveal cast 2' })).toBeVisible();
  await page.keyboard.press('Escape');
  // Casting again instead settles it as cut, and prints who it would have landed.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Cast the lines' }).click();
  await page.getByRole('button', { name: 'Back to the boats' }).click();
  await expect(lines).toHaveCount(3);
  await expect(lines.nth(1)).toHaveClass(/is-cut/);
  await expect(lines.nth(1)).toContainText(cut.name);
  await expect(lines.nth(1)).toContainText('Line cut');
  await expect(lines.nth(2)).toHaveClass(/is-on-deck/);
});
