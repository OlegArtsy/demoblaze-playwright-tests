import { Locator, Page } from '@playwright/test';

// Product detail page (/prod.html).
// "Add to cart" pops a native alert that we have to handle.
export class ProductPage {
  readonly page: Page;

  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('h2.name');
    this.productPrice = page.locator('h3.price-container');
    this.addToCartButton = page.locator('a', { hasText: 'Add to cart' });
  }

  async getName() {
    const txt = (await this.productName.textContent()) ?? '';
    return txt.trim();
  }

  // price text looks like "$790 *includes tax", grab the number
  async getPrice() {
    const raw = (await this.productPrice.textContent()) ?? '';
    const m = raw.match(/\$?\s*(\d+(?:\.\d+)?)/);
    if (!m) {
      throw new Error(`Could not parse price from "${raw}"`);
    }
    return Number(m[1]);
  }

  async addToCart() {
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 15000 });
    await this.addToCartButton.click();
    const dialog = await dialogPromise;
    const msg = dialog.message();
    await dialog.accept();
    return msg;
  }
}
