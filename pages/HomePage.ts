import { expect, Locator, Page } from '@playwright/test';

export type Category = 'Phones' | 'Laptops' | 'Monitors';

// Page object for the demoblaze home page.
// Holds locators for the nav, the category sidebar, the product grid
// and the login/signup modals.
export class HomePage {
  readonly page: Page;

  // top nav
  readonly loginNavLink: Locator;
  readonly signupNavLink: Locator;
  readonly logoutNavLink: Locator;
  readonly cartNavLink: Locator;
  readonly welcomeUser: Locator;
  readonly homeNavLink: Locator;

  // sidebar
  readonly categoryLinks: Locator;

  // product grid
  readonly productCards: Locator;
  readonly productTitles: Locator;

  // login modal
  readonly loginModal: Locator;
  readonly loginUsernameInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitButton: Locator;

  // signup modal
  readonly signupModal: Locator;
  readonly signupUsernameInput: Locator;
  readonly signupPasswordInput: Locator;
  readonly signupSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginNavLink = page.locator('#login2');
    this.signupNavLink = page.locator('#signin2');
    this.logoutNavLink = page.locator('#logout2');
    this.cartNavLink = page.locator('#cartur');
    this.welcomeUser = page.locator('#nameofuser');
    this.homeNavLink = page.locator('a.nav-link', { hasText: 'Home' });

    this.categoryLinks = page.locator('#itemc');

    this.productCards = page.locator('#tbodyid .card');
    this.productTitles = page.locator('#tbodyid .card .card-title a');

    this.loginModal = page.locator('#logInModal');
    this.loginUsernameInput = page.locator('#loginusername');
    this.loginPasswordInput = page.locator('#loginpassword');
    this.loginSubmitButton = page.locator('button', { hasText: 'Log in' }).last();

    this.signupModal = page.locator('#signInModal');
    this.signupUsernameInput = page.locator('#sign-username');
    this.signupPasswordInput = page.locator('#sign-password');
    this.signupSubmitButton = page.locator('button', { hasText: 'Sign up' });
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  // demoblaze loads the grid via /bycat ajax, so wait for the response
  // before we look at the new products
  async filterByCategory(category: Category) {
    const respPromise = this.page.waitForResponse(
      (r) => r.url().includes('bycat') && r.status() === 200,
      { timeout: 15000 },
    );
    await this.categoryLinks.filter({ hasText: category }).click();
    await respPromise;
  }

  async getVisibleProductNames() {
    await expect(this.productTitles.first()).toBeVisible();
    const names = await this.productTitles.allTextContents();
    return names.map((n) => n.trim()).filter(Boolean);
  }

  async openProduct(productName: string) {
    await this.productTitles.filter({ hasText: productName }).first().click();
  }

  async openLoginModal() {
    await this.loginNavLink.click();
    await expect(this.loginModal).toBeVisible();
    await expect(this.loginUsernameInput).toBeVisible();
  }

  async openSignupModal() {
    await this.signupNavLink.click();
    await expect(this.signupModal).toBeVisible();
    await expect(this.signupUsernameInput).toBeVisible();
  }

  async submitLogin(username: string, password: string) {
    await this.loginUsernameInput.fill(username);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitButton.click();
  }

  // signup fires a native alert with "Sign up successful." or
  // "This user already exist." - we capture and return the text
  async submitSignupAndCaptureAlert(username: string, password: string) {
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 15000 });
    await this.signupUsernameInput.fill(username);
    await this.signupPasswordInput.fill(password);
    await this.signupSubmitButton.click();
    const dialog = await dialogPromise;
    const msg = dialog.message();
    await dialog.accept();
    return msg;
  }

  async expectLoggedInAs(username: string) {
    await expect(this.welcomeUser).toBeVisible();
    await expect(this.welcomeUser).toContainText(username);
    await expect(this.logoutNavLink).toBeVisible();
  }

  async logout() {
    await this.logoutNavLink.click();
    await expect(this.loginNavLink).toBeVisible();
  }
}
