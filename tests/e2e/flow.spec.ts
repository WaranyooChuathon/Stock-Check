import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  // Wait for the post-login redirect so the session cookie is set before we navigate.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

test('unauthenticated access to a protected route redirects to login', async ({ page }) => {
  await page.goto('/units');
  await expect(page).toHaveURL(/\/login/);
});

test('main flow: login → search → verify → problems → logout', async ({ page }) => {
  await login(page, 'admin', 'admin123');
  await expect(page.getByRole('heading', { name: /สวัสดี/ })).toBeVisible();

  await page.goto('/units');
  await expect(page.getByRole('heading', { name: 'รายการเครื่อง' })).toBeVisible();

  // search for a known seeded unit
  await page.fill('#q', 'SN-3001');
  await page.getByRole('button', { name: 'ค้นหา / กรอง' }).click();
  await expect(page).toHaveURL(/q=SN-3001/);

  // open the unit
  await page.locator('a[href^="/units/"]').first().click();
  await expect(page.getByRole('heading', { name: 'ตรวจยืนยันเครื่อง' })).toBeVisible();

  // tick every accessory then submit the verification
  const checkboxes = page.getByRole('checkbox');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i += 1) await checkboxes.nth(i).check();
  await page.getByRole('button', { name: 'บันทึกผลตรวจยืนยัน' }).click();
  await expect(page.getByText('บันทึกแล้ว')).toBeVisible();

  // problems page renders
  await page.goto('/problems');
  await expect(page.getByRole('heading', { name: 'เครื่องที่มีปัญหา' })).toBeVisible();

  // logout
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('staff is blocked from the admin settings page', async ({ page }) => {
  await login(page, 'staff', 'staff123');
  await page.goto('/settings');
  await expect(page.getByText(/ผู้ดูแล \(admin\) เท่านั้น/)).toBeVisible();
});
