import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { uniqueUser } from '../fixtures/testData';

// Auth tests: signup, login + logout, and the bad-credentials path.
// The first two tests share state (we log in with the user we just
// signed up) so the describe is serial.
test.describe('Authentication', () => {
  test.describe.configure({ mode: 'serial' });

  const newUser = uniqueUser();

  test('a new user can sign up successfully', async ({ page }) => {
    const home = new HomePage(page);

    await test.step('open home page', async () => {
      await home.goto();
      await expect(home.loginNavLink).toBeVisible();
    });

    await test.step('open the signup modal', async () => {
      await home.openSignupModal();
      await expect(home.signupUsernameInput).toBeEditable();
      await expect(home.signupPasswordInput).toBeEditable();
    });

    await test.step('submit signup, capture the alert', async () => {
      const message = await home.submitSignupAndCaptureAlert(
        newUser.username,
        newUser.password,
      );
      // expect "Sign up successful." - if the site says "user already exist"
      // then our unique-name helper is broken
      expect(message).toMatch(/successful/i);
    });
  });

  test('a registered user can log in and log out', async ({ page }) => {
    const home = new HomePage(page);

    await home.goto();
    await home.openLoginModal();
    await home.submitLogin(newUser.username, newUser.password);

    await test.step('welcome banner shows the username', async () => {
      await home.expectLoggedInAs(newUser.username);
      await expect(home.loginNavLink).toBeHidden();
    });

    await test.step('log out goes back to anonymous state', async () => {
      await home.logout();
      await expect(home.welcomeUser).toBeHidden();
      await expect(home.loginNavLink).toBeVisible();
    });
  });

  test('login with invalid credentials shows an error', async ({ page }) => {
    const home = new HomePage(page);
    const ghost = uniqueUser('ghost'); // never registered

    // demoblaze pops a native alert from its ajax error handler.
    // attach the listener before the click so we don't miss it.
    const dialogMessages: string[] = [];
    page.on('dialog', async (d) => {
      dialogMessages.push(d.message());
      await d.dismiss();
    });

    await home.goto();
    await home.openLoginModal();
    await home.submitLogin(ghost.username, ghost.password);

    await expect
      .poll(() => dialogMessages.length, { timeout: 10000 })
      .toBeGreaterThan(0);

    expect(dialogMessages.join(' | ')).toMatch(/user does not exist|wrong password/i);
    await expect(home.welcomeUser).toBeHidden();
    await expect(home.loginNavLink).toBeVisible();
  });
});
