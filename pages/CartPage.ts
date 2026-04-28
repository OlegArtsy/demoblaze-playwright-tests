import { expect, Locator, Page } from '@playwright/test';

export interface CartItem {
  title: string;
  price: number;
}

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  creditCard: string;
  month: string;
  year: string;
}

// Cart page + place order modal + purchase confirmation popup.
export class CartPage {
  readonly page: Page;

  readonly cartRows: Locator;
  readonly totalLabel: Locator;
  readonly placeOrderButton: Locator;

  // place order modal
  readonly orderModal: Locator;
  readonly orderNameInput: Locator;
  readonly orderCountryInput: Locator;
  readonly orderCityInput: Locator;
  readonly orderCardInput: Locator;
  readonly orderMonthInput: Locator;
  readonly orderYearInput: Locator;
  readonly orderPurchaseButton: Locator;

  // sweetalert confirmation
  readonly confirmationDialog: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationDetails: Locator;
  readonly confirmationOkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartRows = page.locator('#tbodyid tr.success');
    this.totalLabel = page.locator('#totalp');
    this.placeOrderButton = page.locator('button', { hasText: 'Place Order' });

    this.orderModal = page.locator('#orderModal');
    this.orderNameInput = page.locator('#name');
    this.orderCountryInput = page.locator('#country');
    this.orderCityInput = page.locator('#city');
    this.orderCardInput = page.locator('#card');
    this.orderMonthInput = page.locator('#month');
    this.orderYearInput = page.locator('#year');
    this.orderPurchaseButton = page.locator('button', { hasText: 'Purchase' });

    this.confirmationDialog = page.locator('.sweet-alert.showSweetAlert.visible');
    this.confirmationHeading = this.confirmationDialog.locator('h2');
    this.confirmationDetails = this.confirmationDialog.locator('p.lead');
    this.confirmationOkButton = this.confirmationDialog.locator('button.confirm');
  }

  async goto() {
    await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
  }

  async getItemCount() {
    return this.cartRows.count();
  }

  // row layout: image | title | price | delete link
  async getItems(): Promise<CartItem[]> {
    const count = await this.cartRows.count();
    const items: CartItem[] = [];
    for (let i = 0; i < count; i++) {
      const row = this.cartRows.nth(i);
      const title = ((await row.locator('td').nth(1).textContent()) ?? '').trim();
      const priceText = ((await row.locator('td').nth(2).textContent()) ?? '').trim();
      const price = Number(priceText.replace(/[^0-9.]/g, ''));
      if (Number.isNaN(price)) {
        throw new Error(`Could not parse cart price from "${priceText}"`);
      }
      items.push({ title, price });
    }
    return items;
  }

  async getDisplayedTotal() {
    // total is filled by ajax, wait until it's not empty
    await expect
      .poll(async () => ((await this.totalLabel.textContent()) ?? '').trim(), {
        timeout: 10000,
      })
      .not.toBe('');
    const raw = ((await this.totalLabel.textContent()) ?? '').trim();
    return Number(raw);
  }

  // delete clears the tbody and re-renders the remaining rows,
  // so the row count can drop to 0 for a moment. poll until it
  // settles to what we expect.
  async removeItem(title: string) {
    const before = await this.cartRows.count();
    const target = before - 1;

    const row = this.cartRows.filter({ hasText: title }).first();
    await row.locator('a', { hasText: 'Delete' }).click();

    await expect.poll(() => this.cartRows.count(), { timeout: 10000 }).toBe(target);
    await expect(this.cartRows.filter({ hasText: title })).toHaveCount(0);
  }

  async openPlaceOrderModal() {
    await this.placeOrderButton.click();
    await expect(this.orderModal).toBeVisible();
    await expect(this.orderNameInput).toBeVisible();
  }

  async fillOrderForm(d: Partial<OrderDetails>) {
    if (d.name) await this.orderNameInput.fill(d.name);
    if (d.country) await this.orderCountryInput.fill(d.country);
    if (d.city) await this.orderCityInput.fill(d.city);
    if (d.creditCard) await this.orderCardInput.fill(d.creditCard);
    if (d.month) await this.orderMonthInput.fill(d.month);
    if (d.year) await this.orderYearInput.fill(d.year);
  }

  async submitPurchase() {
    await this.orderPurchaseButton.click();
  }

  // empty form -> demoblaze fires a synchronous alert() inside
  // purchaseOrder(). alert() blocks until dismissed, so the click
  // promise won't resolve unless we accept the dialog from a
  // listener. register it before the click.
  async submitPurchaseExpectingValidationAlert() {
    let captured = '';
    const handler = async (dialog: import('@playwright/test').Dialog) => {
      captured = dialog.message();
      await dialog.accept();
    };
    this.page.once('dialog', handler);

    try {
      await this.orderPurchaseButton.click();
    } catch (err) {
      this.page.off('dialog', handler);
      throw err;
    }

    await expect.poll(() => captured, { timeout: 5000 }).not.toBe('');
    return captured;
  }

  async dismissConfirmation() {
    await this.confirmationOkButton.click();
    await expect(this.confirmationDialog).toBeHidden();
  }
}
