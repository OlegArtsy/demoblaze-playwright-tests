import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Category navigation', () => {
  // filter to laptops, the grid should change and contain
  // at least one well-known laptop name
  test('Laptops filter replaces product grid with only laptops', async ({ page }) => {
    const home = new HomePage(page);

    await home.goto();
    const baseline = await home.getVisibleProductNames();
    expect(baseline.length).toBeGreaterThan(0);

    await home.filterByCategory('Laptops');

    const filtered = await home.getVisibleProductNames();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered).not.toEqual(baseline);

    const hasKnownLaptop = filtered.some((n) =>
      /sony vaio|macbook|dell|lenovo/i.test(n),
    );
    expect(hasKnownLaptop).toBe(true);
  });

  // click Phones, then Monitors. Both lists should be non-empty
  // and they shouldn't share any products.
  test('switching from Phones to Monitors swaps the grid contents', async ({ page }) => {
    const home = new HomePage(page);

    await home.goto();

    await home.filterByCategory('Phones');
    const phones = await home.getVisibleProductNames();
    expect(phones.length).toBeGreaterThan(0);

    await home.filterByCategory('Monitors');
    const monitors = await home.getVisibleProductNames();
    expect(monitors.length).toBeGreaterThan(0);

    const overlap = phones.filter((p) => monitors.includes(p));
    expect(overlap).toEqual([]);
  });
});
