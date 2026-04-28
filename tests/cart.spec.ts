import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';

test.describe('Shopping cart', () => {
  // add 1 phone + 1 laptop, check that the cart shows both rows
  // and the total is the sum of the two captured prices
  test('adds two products from different categories and displays correct total', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    let phoneName = '';
    let phonePrice = 0;
    let laptopName = '';
    let laptopPrice = 0;

    await home.goto();

    await test.step('add the first phone', async () => {
      const phones = await home.getVisibleProductNames();
      expect(phones.length).toBeGreaterThan(0);
      await home.openProduct(phones[0]);

      phoneName = await product.getName();
      phonePrice = await product.getPrice();
      const alertText = await product.addToCart();
      expect(alertText).toMatch(/product added/i);
    });

    await test.step('switch to laptops and add the first one', async () => {
      await home.homeNavLink.click();
      await home.filterByCategory('Laptops');

      const laptops = await home.getVisibleProductNames();
      expect(laptops.length).toBeGreaterThan(0);
      await home.openProduct(laptops[0]);

      laptopName = await product.getName();
      laptopPrice = await product.getPrice();
      const alertText = await product.addToCart();
      expect(alertText).toMatch(/product added/i);
    });

    await test.step('cart has both items + correct total', async () => {
      await cart.goto();

      // rows arrive via ajax, poll until both are there
      await expect.poll(() => cart.getItemCount(), { timeout: 10000 }).toBe(2);

      const items = await cart.getItems();
      const titles = items.map((i) => i.title);
      expect(titles).toEqual(expect.arrayContaining([phoneName, laptopName]));

      const expectedTotal = phonePrice + laptopPrice;
      const displayedTotal = await cart.getDisplayedTotal();
      expect(displayedTotal).toBe(expectedTotal);
    });
  });

  // add two phones, delete the first one, check the second one is
  // still there and the total matches its price
  test('removing an item updates the cart contents and total', async ({ page }) => {
    const home = new HomePage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    let firstName = '';
    let secondName = '';
    let secondPrice = 0;

    await home.goto();

    await test.step('add two phones', async () => {
      const phones = await home.getVisibleProductNames();
      expect(phones.length).toBeGreaterThanOrEqual(2);

      // first phone
      await home.openProduct(phones[0]);
      firstName = await product.getName();
      await product.addToCart();

      // back home, second phone
      await home.homeNavLink.click();
      await home.openProduct(phones[1]);
      secondName = await product.getName();
      secondPrice = await product.getPrice();
      await product.addToCart();
    });

    await test.step('open cart, both items are there', async () => {
      await cart.goto();
      await expect.poll(() => cart.getItemCount(), { timeout: 10000 }).toBe(2);
    });

    await test.step('delete the first item', async () => {
      await cart.removeItem(firstName);
    });

    await test.step('only the second item is left, total matches', async () => {
      const items = await cart.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe(secondName);
      expect(await cart.getDisplayedTotal()).toBe(secondPrice);
    });
  });
});
