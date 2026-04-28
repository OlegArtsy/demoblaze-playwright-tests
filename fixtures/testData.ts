// Shared test data + a helper for unique usernames.
// demoblaze keeps registered users forever, so we always sign up
// with a fresh random name.

export interface TestUser {
  username: string;
  password: string;
}

export function uniqueUser(prefix = 'qa'): TestUser {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return {
    username: `${prefix}_${stamp}_${rand}`,
    password: `Pwd!${stamp}`,
  };
}

export const VALID_ORDER = {
  name: 'Jane Tester',
  country: 'Canada',
  city: 'Toronto',
  creditCard: '4111111111111111',
  month: '12',
  year: '2030',
};
