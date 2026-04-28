# Demoblaze Playwright tests

UI test automation for [demoblaze.com](https://www.demoblaze.com), written with Playwright + TypeScript.

The suite covers the main end-user flows: signup, login (happy + error path), browsing by category, building a cart and completing a purchase.

## Stack

- Playwright Test (browser automation, assertions, HTML reporter)
- TypeScript
- Page Object Model (so the specs don't deal with raw selectors)

By default every spec runs on Chromium, Firefox and WebKit.

## Project layout

```
.
├── pages/
│   ├── HomePage.ts          # landing page, nav, login/signup modals
│   ├── ProductPage.ts       # product detail page, "Add to cart"
│   └── CartPage.ts          # cart page + Place Order + confirmation
├── fixtures/
│   └── testData.ts          # unique-user generator, valid order data
├── tests/
│   ├── auth.spec.ts                # signup, login, login error
│   ├── cart.spec.ts                # add multiple items, remove items
│   ├── checkout.spec.ts            # end-to-end purchase, form validation
│   └── category-filter.spec.ts     # sidebar category filter
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Getting started

```bash
# 1. install deps
npm install

# 2. install browsers (chromium, firefox, webkit)
npm run install:browsers

# 3. run everything
npm test

# other handy commands
npm run test:headed       # watch tests in real browsers
npm run test:ui           # interactive UI mode
npm run test:chromium     # only chromium
npm run test:debug        # step through with inspector
npm run report            # open the last HTML report
```

Needs Node 18+.

## What the tests cover

### `auth.spec.ts`
1. New user can sign up — smoke test for signup + the success alert.
2. Registered user can log in and log out — checks the welcome banner and the session toggle.
3. Login with bad credentials shows an error — negative path, the app should reject the creds and not authenticate.

### `cart.spec.ts`
4. Add two products from different categories and verify total — the cart accumulates items across navigation and computes the right total.
5. Remove an item updates contents and total — delete should mutate both the row list and the displayed sum.

### `checkout.spec.ts`
6. Guest can complete an end-to-end purchase — full happy path, ends on the confirmation popup with order id + amount.
7. Place-order rejects empty form — client-side validation fires, no phantom order is created.

### `category-filter.spec.ts`
8. Laptops filter replaces the grid with only laptops — sidebar filter actually filters.
9. Phones → Monitors swaps the grid — successive filters re-render and categories don't bleed into each other.

## Things to know about demoblaze

A few quirks of the site that the suite has to handle:

- **Native alerts.** "Product added", "Sign up successful", "User does not exist", and the place-order validation all use `alert()`. Each page-object method that triggers one registers `page.waitForEvent('dialog')` *before* the click. The negative-login test attaches a long-lived `page.on('dialog', ...)` instead, so the test fails with a useful message even if no dialog ever fires.
- **AJAX-loaded grids and totals.** Cart total + category grids load asynchronously, so we use `expect.poll(...)` instead of fixed waits. Slow responses don't flake, but a truly broken page still fails.
- **State between runs.** Demoblaze keeps user accounts forever, so `fixtures/testData.ts#uniqueUser()` generates a timestamp + random username for each signup test.
- **Price parsing.** `ProductPage.getPrice()` parses things like `"$790 *includes tax"` and throws if the format ever changes — beats getting a silent `NaN`.
- **Retries + artifacts.** The config keeps traces on first retry, screenshots on failure and video on retained-failure, so flakes on this public demo site are still debuggable from the report.

## Reports

```bash
npm run report
```

opens the HTML report with traces, screenshots and video for any failure or retry.

## Notes

Demoblaze is a public, unmaintained demo. Occasional 5xx responses or slow ajax calls happen. The config retries once locally and twice in CI. All waits are explicit (no `page.waitForTimeout`). If a run fails, check the trace in the HTML report before assuming the suite is broken.
