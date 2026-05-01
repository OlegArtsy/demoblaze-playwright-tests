import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { VALID_ORDER } from '../fixtures/testData';

test.describe('Checkout', () => {
  // happy path: add one product, fill the order form with valid data,
  // submit, and check the sweetalert confirmation has the order id and
  // amount.
  test('a guest can complete an end-to-end purchase', async ({ page }) => {
    const home = new HomePage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    let productPrice = 0;

    await test.step('add a product to cart', async () => {
      await home.goto();
      const names = await home.getVisibleProductNames();
      await home.openProduct(names[0]);
      productPrice = await product.getPrice();
      await product.addToCart();
    });

    await test.step('open cart and start place-order', async () => {
      await cart.goto();
      await expect(cart.cartRows).toHaveCount(1);
      await cart.openPlaceOrderModal();
    });

    await test.step('fill the form and purchase', async () => {
      await cart.fillOrderForm(VALID_ORDER);
      await cart.submitPurchase();

      await expect(cart.confirmationHeading).toContainText(/thank you for your purchase/i);
      await expect(cart.confirmationDetails).toContainText(/Id:\s*\d+/);
      await expect(cart.confirmationDetails).toContainText(
        new RegExp(`Amount:\\s*${productPrice}\\s*USD`),
      );
      await expect(cart.confirmationDetails).toContainText(VALID_ORDER.creditCard);
      await expect(cart.confirmationDetails).toContainText(VALID_ORDER.name);
    });

    await test.step('dismiss the confirmation', async () => {
      await cart.dismissConfirmation();
      await expect(page).toHaveURL(/demoblaze\.com\/?(index\.html)?$/);
    });
  });

  // negative path: empty form -> demoblaze fires a native alert with
  // "Please fill out Name and Creditcard." We check that the order
  // modal stays open and no confirmation appears.
  test('place-order rejects submission with missing required fields', async ({ page }) => {
    const home = new HomePage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    await test.step('seed cart with one product', async () => {
      await home.goto();
      const names = await home.getVisibleProductNames();
      await home.openProduct(names[0]);
      await product.addToCart();
    });

    await test.step('open place-order, submit empty form', async () => {
      await cart.goto();
      await expect(cart.cartRows).toHaveCount(1);
      await cart.openPlaceOrderModal();

      const alertMessage = await cart.submitPurchaseExpectingValidationAlert();
      expect(alertMessage).toMatch(/please fill out name and creditcard/i);
    });

    await test.step('order modal still open, no confirmation', async () => {
      await expect(cart.orderModal).toBeVisible();
      await expect(cart.confirmationDialog).toBeHidden();
    });
  });
});
